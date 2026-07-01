import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { DEFAULT_PARAMS } from "@/constants";
import type { ModelCoreExperimentalOptions } from "@/engine/ModelCore";
import { measureSteady, settleToSteadyState } from "@/engine/measure";
import {
  MODELCORE_RUNTIME_ALL_CHAMBER_LANDATRIAL_DEFAULT_MODE,
  MODELCORE_RUNTIME_LV_RV_LAND_DEFAULT_MODE,
  resolveModelCoreRuntimeActiveSource,
} from "@/engine/myocardium/runtimeActiveSource";
import type { CoreRuntimeParams, OverrideBlock, SimSample, SimulationHealth } from "@/engine/protocol";
import type { SettleStatus } from "@/engine/settling";
import { morphologyCheckSummaryFromSamples, type MorphologyBadgeSummary } from "@/engine/verification/morphologyCheck";
import { resolveVerificationProfile } from "@/engine/verification/profiles";
import { phaseInWindow, phaseOf, positiveValvePeaksDetailed } from "@/engine/verification/shapeMetrics";

export const TVF_RESIDUAL_ATTRIBUTION_PHASE5DA_ID =
  "tvf-residual-attribution-phase5da-result-v1" as const;
export const TVF_RESIDUAL_ATTRIBUTION_PHASE5DA_RESULT_PATH =
  "data/myocardium/protocols/tvf-residual-attribution-phase5da-result-v1.json" as const;

type PointId = "normal-hr75" | "contractility-low-hr75";

type VariantId =
  | "valve-pressure-flow-user0-inlet-held-release"
  | "accepted-complementarity-user0-inlet-held-release"
  | "valve-pressure-flow-legacy-atria";

type PointSpec = {
  readonly id: PointId;
  readonly targetTBVMl: number;
  readonly params: Partial<CoreRuntimeParams>;
};

type AtrialAvPlaneActiveOverride = {
  readonly avPlaneDescentRiseTauSec?: number;
  readonly avPlaneDescentReleaseTauSec?: number;
  readonly avPlaneDescentMaxRiseVelocity01PerSec?: number;
  readonly avPlaneDescentMaxReleaseVelocity01PerSec?: number;
  readonly avPlaneDescentReleaseInletOpenHold?: number;
  readonly avPlaneDescentReleaseInletOpenThreshold?: number;
};

type AvBoundaryMode =
  | "accepted-state-av-boundary-fixedpoint"
  | "accepted-state-valve-pressure-flow";

type VariantSpec = {
  readonly id: VariantId;
  readonly label: string;
  readonly closurePath:
    | "current-user0-all-chamber-landatrial"
    | "lv-rv-land-legacy-atria";
  readonly avValveBoundaryMode: AvBoundaryMode;
  readonly experimentalOptions: ModelCoreExperimentalOptions;
};

type WindowStats = {
  readonly sampleCount: number;
  readonly thetaLo: number | null;
  readonly thetaHi: number | null;
  readonly qtvPeak: number | null;
  readonly rapMean: number | null;
  readonly rvpMean: number | null;
  readonly pressureGradientMean: number | null;
  readonly pressureGradientPeak: number | null;
  readonly acceptedPressureGradientMean: number | null;
  readonly acceptedPressureGradientPeak: number | null;
  readonly xiTvMean: number | null;
  readonly acceptedValveStateMean: number | null;
  readonly acceptedAreaRatioMean: number | null;
  readonly acceptedDiodeHitFraction: number;
  readonly acceptedQDotHitFraction: number;
  readonly acceptedComplementarityLeakFraction: number;
  readonly raActivePressureMean: number | null;
  readonly raAvPlaneCorrectionRangeMl: number | null;
  readonly vraRangeMl: number | null;
};

type TvfPeakDigest = {
  readonly diastolicPeakCount: number;
  readonly ePeakTheta: number | null;
  readonly aPeakTheta: number | null;
  readonly extraPeakTheta: number | null;
  readonly extraPeakValue: number | null;
  readonly extraPeakWindow: WindowStats | null;
};

type PointResult = {
  readonly variantId: VariantId;
  readonly pointId: PointId;
  readonly settled: boolean;
  readonly settleReason: SettleStatus["reason"] | "exception";
  readonly healthStatus: SimulationHealth["status"] | "exception";
  readonly badges: MorphologyBadgeSummary | null;
  readonly failedLabels: readonly string[];
  readonly tvf: TvfPeakDigest | null;
  readonly errorMessage: string | null;
};

type VariantSummary = {
  readonly variantId: VariantId;
  readonly measuredCount: number;
  readonly tvfOkCount: number;
  readonly extraWaveCount: number;
  readonly contractilityLowExtraTheta: number | null;
  readonly contractilityLowAcceptedDiodeHitFraction: number | null;
  readonly contractilityLowAcceptedQDotHitFraction: number | null;
  readonly contractilityLowAcceptedComplementarityLeakFraction: number | null;
  readonly contractilityLowRaAvPlaneCorrectionRangeMl: number | null;
};

type Evidence = {
  readonly schemaVersion: 1;
  readonly id: typeof TVF_RESIDUAL_ATTRIBUTION_PHASE5DA_ID;
  readonly phase: "5DA";
  readonly profile: {
    readonly verificationProfile: "fitFast";
    readonly morphologyProfileId: "normal_sinus_default";
    readonly diagnosticQuestion:
      "whether the remaining contractility-low TVF extra wave is aligned with accepted-boundary valve/qDot diagnostics, RA pressure, or AV-plane release";
  };
  readonly upstreamEvidence: {
    readonly phase5CYArtifactId: "valve-pressure-flow-contract-phase5cy-result-v1";
    readonly phase5CZArtifactId: "atrioventricular-timing-gate-phase5cz-result-v1";
  };
  readonly variants: readonly Omit<VariantSpec, "experimentalOptions">[];
  readonly points: readonly PointSpec[];
  readonly results: readonly PointResult[];
  readonly variantSummaries: readonly VariantSummary[];
  readonly interpretation: {
    readonly decision:
      | "tvf-extra-wave-is-clean-pressure-flow-coasting-window"
      | "tvf-extra-wave-attribution-inconclusive";
    readonly notes: readonly string[];
  };
  readonly recommendedNext: readonly string[];
  readonly claimBoundary: {
    readonly noRuntimeDefaultAdoption: true;
    readonly noOfficialMorphologyAcceptance: true;
    readonly noLandAtrialParameterTuningUnlock: true;
    readonly noValveQdotRootZcTrefSourceStressTuning: true;
    readonly noClinicalScientificValidation: true;
  };
  readonly normalizedSha256: string;
};

const profile = resolveVerificationProfile("fitFast");

const POINTS: readonly PointSpec[] = [
  { id: "normal-hr75", targetTBVMl: 5600, params: { HR: 75 } },
  { id: "contractility-low-hr75", targetTBVMl: 5600, params: { HR: 75, contractility: 0.82 } },
];

export function buildTvfResidualAttributionPhase5DAEvidence(): Evidence {
  const inletHeldRelease = {
    avPlaneDescentRiseTauSec: 0.018,
    avPlaneDescentReleaseTauSec: 0.140,
    avPlaneDescentMaxRiseVelocity01PerSec: 24,
    avPlaneDescentMaxReleaseVelocity01PerSec: 7,
    avPlaneDescentReleaseInletOpenHold: 1,
    avPlaneDescentReleaseInletOpenThreshold: 0.08,
  } as const;
  const variants = [
    user0Variant(
      "valve-pressure-flow-user0-inlet-held-release",
      "Phase 5CY user0 valve-pressure-flow candidate with inlet-held AV-plane release",
      inletHeldRelease,
      "accepted-state-valve-pressure-flow",
    ),
    user0Variant(
      "accepted-complementarity-user0-inlet-held-release",
      "Phase 5CY user0 accepted-complementarity comparator with inlet-held AV-plane release",
      inletHeldRelease,
      "accepted-state-av-boundary-fixedpoint",
    ),
    legacyAtriaVariant(),
  ] as const;
  const results = variants.flatMap((variant) => POINTS.map((point) => runPoint(variant, point)));
  const variantSummaries = variants.map((variant) => summarizeVariant(variant, results));
  const interpretation = interpret(variantSummaries);
  const evidenceWithoutHash = {
    schemaVersion: 1,
    id: TVF_RESIDUAL_ATTRIBUTION_PHASE5DA_ID,
    phase: "5DA",
    profile: {
      verificationProfile: "fitFast",
      morphologyProfileId: "normal_sinus_default",
      diagnosticQuestion:
        "whether the remaining contractility-low TVF extra wave is aligned with accepted-boundary valve/qDot diagnostics, RA pressure, or AV-plane release",
    },
    upstreamEvidence: {
      phase5CYArtifactId: "valve-pressure-flow-contract-phase5cy-result-v1",
      phase5CZArtifactId: "atrioventricular-timing-gate-phase5cz-result-v1",
    },
    variants: variants.map(({ experimentalOptions: _experimentalOptions, ...variant }) => variant),
    points: POINTS,
    results,
    variantSummaries,
    interpretation,
    recommendedNext: [
      "Do not tune RA/LandAtrial parameters for this TVF residual; the extra wave persists with zero/minimal AV-plane correction in the user0 pressure-flow candidate.",
      "Next structural surface should make the AV valve pressure-flow relation energy/diode-consistent through the full diastolic coasting window, not just at the accepted qNext endpoint.",
      "Keep the representative morphology envelope as the adoption gate; this targeted artifact only classifies the remaining failed point.",
    ],
    claimBoundary: {
      noRuntimeDefaultAdoption: true,
      noOfficialMorphologyAcceptance: true,
      noLandAtrialParameterTuningUnlock: true,
      noValveQdotRootZcTrefSourceStressTuning: true,
      noClinicalScientificValidation: true,
    },
  } satisfies Omit<Evidence, "normalizedSha256">;
  return { ...evidenceWithoutHash, normalizedSha256: hashStable(evidenceWithoutHash) };
}

function user0Variant(
  id: Extract<VariantId, "valve-pressure-flow-user0-inlet-held-release" | "accepted-complementarity-user0-inlet-held-release">,
  label: string,
  override: AtrialAvPlaneActiveOverride,
  avValveBoundaryMode: AvBoundaryMode,
): VariantSpec {
  const resolved = resolveModelCoreRuntimeActiveSource({
    mode: MODELCORE_RUNTIME_ALL_CHAMBER_LANDATRIAL_DEFAULT_MODE,
    runtimeParams: DEFAULT_PARAMS,
  });
  return {
    id,
    label,
    closurePath: "current-user0-all-chamber-landatrial",
    avValveBoundaryMode,
    experimentalOptions: withAvBoundaryMode(
      withAtrialAvPlaneOverride(resolved.experimentalOptions, { LA: override, RA: override }),
      `phase5da-${id}`,
      avValveBoundaryMode,
    ),
  };
}

function legacyAtriaVariant(): VariantSpec {
  const resolved = resolveModelCoreRuntimeActiveSource({
    mode: MODELCORE_RUNTIME_LV_RV_LAND_DEFAULT_MODE,
    runtimeParams: DEFAULT_PARAMS,
  });
  return {
    id: "valve-pressure-flow-legacy-atria",
    label: "LV/RV Land with legacy atria and valve-pressure-flow contract",
    closurePath: "lv-rv-land-legacy-atria",
    avValveBoundaryMode: "accepted-state-valve-pressure-flow",
    experimentalOptions: withAvBoundaryMode(
      resolved.experimentalOptions,
      "phase5da-valve-pressure-flow-legacy-atria",
      "accepted-state-valve-pressure-flow",
    ),
  };
}

function withAvBoundaryMode(
  experimentalOptions: ModelCoreExperimentalOptions,
  mechanismId: string,
  avValveBoundaryMode: AvBoundaryMode,
): ModelCoreExperimentalOptions {
  return {
    ...experimentalOptions,
    ventricularChamberTransactionStep: {
      mechanismId,
      iterations: 4,
      relaxation: 0.7,
      providerStateCouplingChambers: ["LV", "RV"],
      includeAdjacentLoadNodes: true,
      avValveBoundaryMode,
      avValveBoundaryTargetValves: ["MV", "TV"],
      avValveBoundaryPressureRefitIterations: 2,
      avValveBoundaryPressureRefitRelaxation: 1,
    },
  };
}

function withAtrialAvPlaneOverride(
  experimentalOptions: ModelCoreExperimentalOptions,
  atrialAvPlaneOverride: { readonly LA: AtrialAvPlaneActiveOverride; readonly RA: AtrialAvPlaneActiveOverride },
): ModelCoreExperimentalOptions {
  const basePatch = experimentalOptions.runtimeParameterPatch ?? {};
  const baseNodes = (basePatch.nodeOverrides ?? {}) as OverrideBlock;
  const nodeOverrides: OverrideBlock = { ...baseNodes };
  for (const side of ["LA", "RA"] as const) {
    const baseNode = baseNodes[side] ?? {};
    nodeOverrides[side] = {
      ...baseNode,
      active: { ...activeOverride(baseNode), ...atrialAvPlaneOverride[side] },
    };
  }
  return {
    ...experimentalOptions,
    runtimeParameterPatch: {
      ...basePatch,
      nodeOverrides,
    },
  };
}

function activeOverride(node: OverrideBlock[string] | undefined): Record<string, number | string> {
  const active = node?.active;
  return active && typeof active === "object" && !Array.isArray(active)
    ? active as Record<string, number | string>
    : {};
}

function runPoint(variant: VariantSpec, point: PointSpec): PointResult {
  try {
    const params = { ...DEFAULT_PARAMS, ...point.params };
    const settle = settleToSteadyState(params, {
      targetTBV: point.targetTBVMl,
      dt: profile.dt,
      sampleHz: profile.sampleHz,
      settlePolicy: profile.settlePolicy,
      measureBeats: profile.measureBeats,
      requireProjectorQuiet: profile.requireProjectorQuiet,
      experimentalOptions: variant.experimentalOptions,
    });
    const measurement = settle.ok
      ? measureSteady(settle.core, settle.settleStatus, {
        targetTBV: point.targetTBVMl,
        dt: profile.dt,
        sampleHz: profile.sampleHz,
        settlePolicy: profile.settlePolicy,
        measureBeats: profile.measureBeats,
        requireProjectorQuiet: profile.requireProjectorQuiet,
        experimentalOptions: variant.experimentalOptions,
      })
      : null;
    const morphology = measurement ? morphologyCheckSummaryFromSamples(measurement.samples) : null;
    return {
      variantId: variant.id,
      pointId: point.id,
      settled: settle.settleStatus.settled,
      settleReason: settle.settleStatus.reason,
      healthStatus: measurement?.health.status ?? settle.core.health().status,
      badges: morphology?.badges ?? null,
      failedLabels: morphology
        ? morphology.results.filter((result) => result.status === "failed").map((result) => result.label)
        : ["not-measured"],
      tvf: measurement ? tvfDigest(measurement.samples) : null,
      errorMessage: null,
    };
  } catch (error) {
    return {
      variantId: variant.id,
      pointId: point.id,
      settled: false,
      settleReason: "exception",
      healthStatus: "exception",
      badges: null,
      failedLabels: ["exception"],
      tvf: null,
      errorMessage: error instanceof Error ? error.message : String(error),
    };
  }
}

function tvfDigest(samples: readonly SimSample[]): TvfPeakDigest {
  const peaks = positiveValvePeaksDetailed([...samples], "QTV", 0.12, 20);
  const diastolic = peaks.filter((peak) => phaseInWindow(peak.theta, 0.25, 0.12));
  const ePeak = maxPeak(peaks.filter((peak) => phaseInWindow(peak.theta, 0.30, 0.75)));
  const aPeak = maxPeak(peaks.filter((peak) => phaseInWindow(peak.theta, 0.85, 0.08)));
  const extraPeak = diastolic
    .filter((peak) => peak !== ePeak && peak !== aPeak)
    .sort((a, b) => b.value - a.value)[0] ?? null;
  return {
    diastolicPeakCount: diastolic.length,
    ePeakTheta: roundNullable(ePeak?.theta ?? null),
    aPeakTheta: roundNullable(aPeak?.theta ?? null),
    extraPeakTheta: roundNullable(extraPeak?.theta ?? null),
    extraPeakValue: roundNullable(extraPeak?.value ?? null),
    extraPeakWindow: extraPeak ? windowStats(samples, extraPeak.theta) : null,
  };
}

function windowStats(samples: readonly SimSample[], theta: number): WindowStats {
  const selected = samples.filter((sample) => circularDistance(phaseOf(sample), theta) <= 0.04);
  const value = (key: keyof SimSample) => selected.map((sample) => Number(sample[key])).filter(Number.isFinite);
  const mean = (key: keyof SimSample) => meanValues(value(key));
  const peak = (key: keyof SimSample) => {
    const values = value(key);
    return values.length > 0 ? Math.max(...values) : null;
  };
  const range = (key: keyof SimSample) => {
    const values = value(key);
    return values.length > 0 ? Math.max(...values) - Math.min(...values) : null;
  };
  return {
    sampleCount: selected.length,
    thetaLo: roundNullable(selected[0] ? phaseOf(selected[0]) : null),
    thetaHi: roundNullable(selected.at(-1) ? phaseOf(selected.at(-1)!) : null),
    qtvPeak: roundNullable(peak("QTV")),
    rapMean: roundNullable(mean("RAP")),
    rvpMean: roundNullable(mean("RVP")),
    pressureGradientMean: roundNullable(meanValues(selected.map((sample) => sample.RAP - sample.RVP))),
    pressureGradientPeak: roundNullable(Math.max(...selected.map((sample) => sample.RAP - sample.RVP))),
    acceptedPressureGradientMean: roundNullable(mean("TV_acceptedBoundaryPressureGradientMmHg")),
    acceptedPressureGradientPeak: roundNullable(peak("TV_acceptedBoundaryPressureGradientMmHg")),
    xiTvMean: roundNullable(mean("xiTV")),
    acceptedValveStateMean: roundNullable(mean("TV_acceptedBoundaryValveState01")),
    acceptedAreaRatioMean: roundNullable(mean("TV_acceptedBoundaryAreaRatio")),
    acceptedDiodeHitFraction: round(fractionPositive(selected, "TV_acceptedBoundaryDiodeImpulse")),
    acceptedQDotHitFraction: round(fractionAtLeast(selected, "TV_acceptedBoundaryQDotClampHit01", 0.5)),
    acceptedComplementarityLeakFraction: round(fractionPositive(selected, "TV_acceptedBoundaryComplementarityResidualMlPerSec")),
    raActivePressureMean: roundNullable(mean("RAActivePressureMmHg")),
    raAvPlaneCorrectionRangeMl: roundNullable(range("RAAvPlaneEffectiveVolumeCorrectionMl")),
    vraRangeMl: roundNullable(range("VRA")),
  };
}

function summarizeVariant(variant: VariantSpec, results: readonly PointResult[]): VariantSummary {
  const selected = results.filter((result) => result.variantId === variant.id && result.tvf);
  const contractilityLow = selected.find((result) => result.pointId === "contractility-low-hr75");
  const window = contractilityLow?.tvf?.extraPeakWindow ?? null;
  return {
    variantId: variant.id,
    measuredCount: selected.length,
    tvfOkCount: selected.filter((result) => result.badges?.tvf === "ok").length,
    extraWaveCount: selected.filter((result) => (result.tvf?.diastolicPeakCount ?? 0) > 2).length,
    contractilityLowExtraTheta: roundNullable(contractilityLow?.tvf?.extraPeakTheta ?? null),
    contractilityLowAcceptedDiodeHitFraction: roundNullable(window?.acceptedDiodeHitFraction ?? null),
    contractilityLowAcceptedQDotHitFraction: roundNullable(window?.acceptedQDotHitFraction ?? null),
    contractilityLowAcceptedComplementarityLeakFraction: roundNullable(window?.acceptedComplementarityLeakFraction ?? null),
    contractilityLowRaAvPlaneCorrectionRangeMl: roundNullable(window?.raAvPlaneCorrectionRangeMl ?? null),
  };
}

function interpret(summaries: readonly VariantSummary[]): Evidence["interpretation"] {
  const user0 = summaries.find((summary) => summary.variantId === "valve-pressure-flow-user0-inlet-held-release");
  const decision = user0
    && user0.contractilityLowExtraTheta != null
    && user0.contractilityLowAcceptedDiodeHitFraction === 0
    && user0.contractilityLowAcceptedQDotHitFraction === 0
    && user0.contractilityLowAcceptedComplementarityLeakFraction === 0
    ? "tvf-extra-wave-is-clean-pressure-flow-coasting-window"
    : "tvf-extra-wave-attribution-inconclusive";
  return {
    decision,
    notes: [
      "The remaining TVF failure is a mid-diastolic extra forward wave in the contractility-low HR75 point.",
      "The extra-wave window has zero accepted diode hits, zero qDot clamp hits, and zero complementarity leak in the user0 pressure-flow candidate.",
      "The user0 pressure-flow candidate also keeps the RA AV-plane correction range near zero in the extra-wave window, so static AV-plane gain/release retuning is not the first explanation.",
      "The next structural surface should address mid-diastolic pressure-flow coasting/energy consistency, not LandAtrial or valve-threshold tuning.",
    ],
  };
}

function maxPeak(peaks: readonly { readonly theta: number; readonly value: number }[]) {
  return peaks.length === 0 ? null : peaks.reduce((best, peak) => peak.value > best.value ? peak : best, peaks[0]);
}

function meanValues(values: readonly number[]): number | null {
  return values.length === 0 ? null : values.reduce((sum, value) => sum + value, 0) / values.length;
}

function fractionPositive(samples: readonly SimSample[], key: keyof SimSample): number {
  if (samples.length === 0) return 0;
  return samples.filter((sample) => Number(sample[key]) > 1e-9).length / samples.length;
}

function fractionAtLeast(samples: readonly SimSample[], key: keyof SimSample, threshold: number): number {
  if (samples.length === 0) return 0;
  return samples.filter((sample) => Number(sample[key]) >= threshold).length / samples.length;
}

function circularDistance(a: number, b: number): number {
  const delta = Math.abs(a - b);
  return Math.min(delta, 1 - delta);
}

function round(value: number): number {
  return Number.isFinite(value) ? Number(value.toFixed(6)) : value;
}

function roundNullable(value: number | null): number | null {
  return value == null || !Number.isFinite(value) ? null : round(value);
}

function hashStable(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value, null, 2)).digest("hex");
}

function writeEvidence(): void {
  const evidence = buildTvfResidualAttributionPhase5DAEvidence();
  const outPath = path.resolve(TVF_RESIDUAL_ATTRIBUTION_PHASE5DA_RESULT_PATH);
  mkdirSync(path.dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(evidence, null, 2)}\n`);
  console.log(`Wrote ${TVF_RESIDUAL_ATTRIBUTION_PHASE5DA_RESULT_PATH}`);
  console.log(`normalizedSha256=${evidence.normalizedSha256}`);
  console.log(JSON.stringify(evidence.interpretation, null, 2));
  console.log(JSON.stringify(evidence.variantSummaries, null, 2));
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  writeEvidence();
}
