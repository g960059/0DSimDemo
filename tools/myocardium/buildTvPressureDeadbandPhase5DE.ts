import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { DEFAULT_PARAMS } from "@/constants";
import type { ModelCoreExperimentalOptions } from "@/engine/ModelCore";
import { measureSteady, settleToSteadyState } from "@/engine/measure";
import {
  MODELCORE_RUNTIME_ALL_CHAMBER_LANDATRIAL_DEFAULT_MODE,
  resolveModelCoreRuntimeActiveSource,
} from "@/engine/myocardium/runtimeActiveSource";
import type { CoreRuntimeParams, OverrideBlock, SimMetrics, SimSample, SimulationHealth } from "@/engine/protocol";
import type { SettleStatus } from "@/engine/settling";
import { morphologyCheckSummaryFromSamples, type MorphologyBadgeSummary } from "@/engine/verification/morphologyCheck";
import { resolveVerificationProfile } from "@/engine/verification/profiles";
import { phaseInWindow, phaseOf, positiveValvePeaksDetailed } from "@/engine/verification/shapeMetrics";

export const TV_PRESSURE_DEADBAND_PHASE5DE_ID =
  "tv-pressure-deadband-phase5de-result-v1" as const;
export const TV_PRESSURE_DEADBAND_PHASE5DE_RESULT_PATH =
  "data/myocardium/protocols/tv-pressure-deadband-phase5de-result-v1.json" as const;

type PointId =
  | "normal-hr75"
  | "normal-hr90"
  | "low-preload-hr75"
  | "high-preload-hr75"
  | "systemic-afterload-high-hr75"
  | "pulmonary-afterload-high-hr75"
  | "contractility-low-hr75"
  | "contractility-high-hr75";

type VariantId =
  | "pressure-flow-user0-inlet-held-release"
  | "tv-deadband035-user0-inlet-held-release"
  | "tv-deadband060-user0-inlet-held-release"
  | "tv-deadband-close035-user0-inlet-held-release"
  | "tv-deadband-close060-user0-inlet-held-release";

type AvBoundaryMode =
  | "accepted-state-valve-pressure-flow"
  | "accepted-state-valve-pressure-flow-tv-deadband"
  | "accepted-state-valve-pressure-flow-tv-deadband-close";

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

type VariantSpec = {
  readonly id: VariantId;
  readonly label: string;
  readonly closurePath: "current-user0-all-chamber-landatrial" | "lv-rv-land-legacy-atria";
  readonly avValveBoundaryMode: AvBoundaryMode;
  readonly experimentalOptions: ModelCoreExperimentalOptions;
};

type MetricDigest = Pick<SimMetrics, "AoPMean" | "PAPMean" | "CO_L" | "CO_R" | "LAPMean" | "RAPMean">;

type TvfDigest = {
  readonly peakCount: number | null;
  readonly extraPeakTheta: number | null;
  readonly extraPeakValue: number | null;
  readonly acceptedDiodeHitFraction: number | null;
  readonly acceptedQDotHitFraction: number | null;
  readonly acceptedComplementarityLeakFraction: number | null;
  readonly acceptedGradientMeanMmHg: number | null;
  readonly acceptedValveStateMean: number | null;
  readonly acceptedAreaRatioMean: number | null;
};

type PointResult = {
  readonly variantId: VariantId;
  readonly pointId: PointId;
  readonly settled: boolean;
  readonly settleReason: SettleStatus["reason"] | "exception";
  readonly healthStatus: SimulationHealth["status"] | "exception";
  readonly grossMorphologyOk: boolean;
  readonly badges: MorphologyBadgeSummary | null;
  readonly failedLabels: readonly string[];
  readonly metrics: MetricDigest | null;
  readonly tvf: TvfDigest | null;
  readonly errorMessage: string | null;
};

type VariantSummary = {
  readonly variantId: VariantId;
  readonly measuredCount: number;
  readonly settledOkCount: number;
  readonly grossPassCount: number;
  readonly lvPvOkCount: number;
  readonly rvPvOkCount: number;
  readonly mvfOkCount: number;
  readonly tvfOkCount: number;
  readonly tvfExtraWaveCount: number;
  readonly outputPreservedCount: number;
  readonly failedPoints: readonly string[];
};

type Evidence = {
  readonly schemaVersion: 1;
  readonly id: typeof TV_PRESSURE_DEADBAND_PHASE5DE_ID;
  readonly phase: "5DE";
  readonly profile: {
    readonly verificationProfile: "fitFast";
    readonly morphologyProfileId: "normal_sinus_default";
    readonly diagnosticQuestion:
      "whether off-by-default TV pressure deadband or deadband-close decay in the accepted pressure-flow valve-state projection removes the remaining right AV TVF extra wave without breaking the representative envelope";
  };
  readonly upstreamEvidence: {
    readonly phase5DBArtifactId: "avplane-state-hygiene-phase5db-result-v1";
    readonly phase5DCArtifactId: "post-hygiene-pressure-flow-envelope-phase5dc-result-v1";
    readonly phase5DDArtifactId: "right-av-energy-coasting-phase5dd-result-v1";
  };
  readonly variants: readonly Omit<VariantSpec, "experimentalOptions">[];
  readonly points: readonly PointSpec[];
  readonly results: readonly PointResult[];
  readonly variantSummaries: readonly VariantSummary[];
  readonly interpretation: {
    readonly decision:
      | "tv-deadband-improves-tvf-frontier"
      | "tv-deadband-does-not-improve-frontier"
      | "tv-deadband-breaks-output-or-morphology";
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
  { id: "normal-hr90", targetTBVMl: 5600, params: { HR: 90 } },
  { id: "low-preload-hr75", targetTBVMl: 4800, params: { HR: 75 } },
  { id: "high-preload-hr75", targetTBVMl: 6200, params: { HR: 75 } },
  { id: "systemic-afterload-high-hr75", targetTBVMl: 5600, params: { HR: 75, systemicResistance: 1.25 } },
  { id: "pulmonary-afterload-high-hr75", targetTBVMl: 5600, params: { HR: 75, pulmonaryResistance: 1.35 } },
  { id: "contractility-low-hr75", targetTBVMl: 5600, params: { HR: 75, contractility: 0.82 } },
  { id: "contractility-high-hr75", targetTBVMl: 5600, params: { HR: 75, contractility: 1.18 } },
];

const INLET_HELD_RELEASE = {
  avPlaneDescentRiseTauSec: 0.018,
  avPlaneDescentReleaseTauSec: 0.140,
  avPlaneDescentMaxRiseVelocity01PerSec: 24,
  avPlaneDescentMaxReleaseVelocity01PerSec: 7,
  avPlaneDescentReleaseInletOpenHold: 1,
  avPlaneDescentReleaseInletOpenThreshold: 0.08,
} as const;

export function buildTvPressureDeadbandPhase5DEEvidence(): Evidence {
  const variants = [
    user0Variant(
      "pressure-flow-user0-inlet-held-release",
      "Phase 5DC/5DD user0 pressure-flow frontier with inlet-held AV-plane release",
      "accepted-state-valve-pressure-flow",
    ),
    user0Variant(
      "tv-deadband035-user0-inlet-held-release",
      "User0 pressure-flow frontier plus TV accepted-boundary pressure deadband 0.35 mmHg",
      "accepted-state-valve-pressure-flow-tv-deadband",
      0.35,
    ),
    user0Variant(
      "tv-deadband060-user0-inlet-held-release",
      "User0 pressure-flow frontier plus TV accepted-boundary pressure deadband 0.60 mmHg",
      "accepted-state-valve-pressure-flow-tv-deadband",
      0.60,
    ),
    user0Variant(
      "tv-deadband-close035-user0-inlet-held-release",
      "User0 pressure-flow frontier plus TV accepted-boundary pressure deadband-close 0.35 mmHg",
      "accepted-state-valve-pressure-flow-tv-deadband-close",
      0.35,
    ),
    user0Variant(
      "tv-deadband-close060-user0-inlet-held-release",
      "User0 pressure-flow frontier plus TV accepted-boundary pressure deadband-close 0.60 mmHg",
      "accepted-state-valve-pressure-flow-tv-deadband-close",
      0.60,
    ),
  ] as const;
  const results = variants.flatMap((variant) => POINTS.map((point) => runPoint(variant, point)));
  const variantSummaries = variants.map((variant) => summarizeVariant(variant.id, results));
  const interpretation = interpret(variantSummaries);
  const evidenceWithoutHash = {
    schemaVersion: 1,
    id: TV_PRESSURE_DEADBAND_PHASE5DE_ID,
    phase: "5DE",
    profile: {
      verificationProfile: "fitFast",
      morphologyProfileId: "normal_sinus_default",
      diagnosticQuestion:
        "whether off-by-default TV pressure deadband or deadband-close decay in the accepted pressure-flow valve-state projection removes the remaining right AV TVF extra wave without breaking the representative envelope",
    },
    upstreamEvidence: {
      phase5DBArtifactId: "avplane-state-hygiene-phase5db-result-v1",
      phase5DCArtifactId: "post-hygiene-pressure-flow-envelope-phase5dc-result-v1",
      phase5DDArtifactId: "right-av-energy-coasting-phase5dd-result-v1",
    },
    variants: variants.map(({ experimentalOptions: _experimentalOptions, ...variant }) => variant),
    points: POINTS,
    results,
    variantSummaries,
    interpretation,
    recommendedNext: recommendation(interpretation.decision),
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
  id: VariantId,
  label: string,
  avValveBoundaryMode: AvBoundaryMode,
  pressureDeadbandMmHg = 0,
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
      withAtrialAvPlaneOverride(resolved.experimentalOptions, INLET_HELD_RELEASE),
      `phase5de-${id}`,
      avValveBoundaryMode,
      pressureDeadbandMmHg,
    ),
  };
}

function withAvBoundaryMode(
  experimentalOptions: ModelCoreExperimentalOptions,
  mechanismId: string,
  avValveBoundaryMode: AvBoundaryMode,
  pressureDeadbandMmHg: number,
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
      avValveBoundaryPressureDeadbandMmHg: pressureDeadbandMmHg,
    },
  };
}

function withAtrialAvPlaneOverride(
  experimentalOptions: ModelCoreExperimentalOptions,
  override: AtrialAvPlaneActiveOverride,
): ModelCoreExperimentalOptions {
  const basePatch = experimentalOptions.runtimeParameterPatch ?? {};
  const baseNodes = (basePatch.nodeOverrides ?? {}) as OverrideBlock;
  const nodeOverrides: OverrideBlock = { ...baseNodes };
  for (const side of ["LA", "RA"] as const) {
    const baseNode = baseNodes[side] ?? {};
    nodeOverrides[side] = {
      ...baseNode,
      active: { ...activeOverride(baseNode), ...override },
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
    const badges = morphology?.badges ?? null;
    return {
      variantId: variant.id,
      pointId: point.id,
      settled: settle.settleStatus.settled,
      settleReason: settle.settleStatus.reason,
      healthStatus: measurement?.health.status ?? settle.core.health().status,
      grossMorphologyOk: !!badges && badges.lvPv === "ok" && badges.rvPv === "ok" && badges.mvf === "ok" && badges.tvf === "ok",
      badges,
      failedLabels: morphology
        ? morphology.results.filter((result) => result.status === "failed").map((result) => result.label)
        : ["not-measured"],
      metrics: measurement ? metricDigest(measurement.metrics) : null,
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
      grossMorphologyOk: false,
      badges: null,
      failedLabels: ["exception"],
      metrics: null,
      tvf: null,
      errorMessage: error instanceof Error ? error.message : String(error),
    };
  }
}

function tvfDigest(samples: readonly SimSample[]): TvfDigest {
  const peaks = positiveValvePeaksDetailed([...samples], "QTV", 0.12, 20);
  const diastolic = peaks.filter((peak) => phaseInWindow(peak.theta, 0.25, 0.12));
  const ePeak = maxPeak(peaks.filter((peak) => phaseInWindow(peak.theta, 0.30, 0.75)));
  const aPeak = maxPeak(peaks.filter((peak) => phaseInWindow(peak.theta, 0.85, 0.08)));
  const extraPeak = diastolic
    .filter((peak) => peak !== ePeak && peak !== aPeak)
    .sort((a, b) => b.value - a.value)[0] ?? null;
  const window = extraPeak ? samples.filter((sample) => circularDistance(phaseOf(sample), extraPeak.theta) <= 0.04) : [];
  return {
    peakCount: diastolic.length,
    extraPeakTheta: roundNullable(extraPeak?.theta ?? null),
    extraPeakValue: roundNullable(extraPeak?.value ?? null),
    acceptedDiodeHitFraction: window.length > 0 ? round(fractionPositive(window, "TV_acceptedBoundaryDiodeImpulse")) : null,
    acceptedQDotHitFraction: window.length > 0 ? round(fractionAtLeast(window, "TV_acceptedBoundaryQDotClampHit01", 0.5)) : null,
    acceptedComplementarityLeakFraction: window.length > 0
      ? round(fractionPositive(window, "TV_acceptedBoundaryComplementarityResidualMlPerSec"))
      : null,
    acceptedGradientMeanMmHg: window.length > 0 ? roundNullable(mean(keyValues(window, "TV_acceptedBoundaryPressureGradientMmHg"))) : null,
    acceptedValveStateMean: window.length > 0 ? roundNullable(mean(keyValues(window, "TV_acceptedBoundaryValveState01"))) : null,
    acceptedAreaRatioMean: window.length > 0 ? roundNullable(mean(keyValues(window, "TV_acceptedBoundaryAreaRatio"))) : null,
  };
}

function summarizeVariant(variantId: VariantId, results: readonly PointResult[]): VariantSummary {
  const selected = results.filter((result) => result.variantId === variantId);
  const measured = selected.filter((result) => result.badges);
  return {
    variantId,
    measuredCount: measured.length,
    settledOkCount: selected.filter((result) => result.settled && result.healthStatus === "ok").length,
    grossPassCount: measured.filter((result) => result.grossMorphologyOk).length,
    lvPvOkCount: measured.filter((result) => result.badges?.lvPv === "ok").length,
    rvPvOkCount: measured.filter((result) => result.badges?.rvPv === "ok").length,
    mvfOkCount: measured.filter((result) => result.badges?.mvf === "ok").length,
    tvfOkCount: measured.filter((result) => result.badges?.tvf === "ok").length,
    tvfExtraWaveCount: measured.filter((result) => (result.tvf?.peakCount ?? 0) > 2).length,
    outputPreservedCount: measured.filter(outputPreserved).length,
    failedPoints: measured
      .filter((result) => !result.grossMorphologyOk)
      .map((result) => `${result.pointId}:${result.failedLabels.join("|")}`),
  };
}

function interpret(summaries: readonly VariantSummary[]): Evidence["interpretation"] {
  const baseline = requiredSummary(summaries, "pressure-flow-user0-inlet-held-release");
  const candidates = [
    requiredSummary(summaries, "tv-deadband035-user0-inlet-held-release"),
    requiredSummary(summaries, "tv-deadband060-user0-inlet-held-release"),
    requiredSummary(summaries, "tv-deadband-close035-user0-inlet-held-release"),
    requiredSummary(summaries, "tv-deadband-close060-user0-inlet-held-release"),
  ];
  const usable = candidates.filter((candidate) =>
    candidate.outputPreservedCount >= 7
    && candidate.mvfOkCount >= baseline.mvfOkCount
    && candidate.lvPvOkCount >= 8
    && candidate.rvPvOkCount >= 8
  );
  const best = [...usable].sort((a, b) =>
    b.grossPassCount - a.grossPassCount
    || b.tvfOkCount - a.tvfOkCount
    || a.tvfExtraWaveCount - b.tvfExtraWaveCount
  )[0] ?? null;
  if (usable.length === 0) {
    return {
      decision: "tv-deadband-breaks-output-or-morphology",
      notes: [
        `Baseline user0 pressure-flow gross=${baseline.grossPassCount}/8, MVF=${baseline.mvfOkCount}/8, TVF=${baseline.tvfOkCount}/8.`,
        ...candidates.map((candidate) => `${candidate.variantId}: gross=${candidate.grossPassCount}/8, MVF=${candidate.mvfOkCount}/8, TVF=${candidate.tvfOkCount}/8, output=${candidate.outputPreservedCount}/8.`),
        "TV pressure deadband is not an adoption candidate if it buys TVF by breaking output, MVF, or LV/RV PV morphology.",
      ],
    };
  }
  if (best && (best.grossPassCount > baseline.grossPassCount || best.tvfOkCount > baseline.tvfOkCount)) {
    return {
      decision: "tv-deadband-improves-tvf-frontier",
      notes: [
        `Baseline user0 pressure-flow gross=${baseline.grossPassCount}/8, TVF=${baseline.tvfOkCount}/8.`,
        `Best TV-deadband candidate ${best.variantId} gross=${best.grossPassCount}/8, TVF=${best.tvfOkCount}/8, extraWave=${best.tvfExtraWaveCount}/8.`,
        "This is component evidence only; it still needs full claim-boundary review before any runtime/default wiring.",
      ],
    };
  }
  return {
    decision: "tv-deadband-does-not-improve-frontier",
    notes: [
      `Baseline user0 pressure-flow gross=${baseline.grossPassCount}/8, TVF=${baseline.tvfOkCount}/8.`,
      ...candidates.map((candidate) => `${candidate.variantId}: gross=${candidate.grossPassCount}/8, TVF=${candidate.tvfOkCount}/8, extraWave=${candidate.tvfExtraWaveCount}/8.`),
      `Failed points: ${candidates.map((candidate) => `${candidate.variantId}=${candidate.failedPoints.join(" || ") || "none"}`).join(" ; ")}.`,
    ],
  };
}

function recommendation(decision: Evidence["interpretation"]["decision"]): readonly string[] {
  if (decision === "tv-deadband-improves-tvf-frontier") {
    return [
      "Carry TV pressure deadband as component evidence, then inspect accepted-boundary valve-state and pressure-flow traces before runtime adoption.",
      "Keep LandAtrial tuning locked until the full morphology envelope and pressure timing gates pass.",
    ];
  }
  return [
    "Do not adopt the TV pressure deadband as a runtime/default fix.",
    "Next right-AV work should move beyond scalar pressure thresholds toward a fuller AV valve boundary contract or owner visual review if the deterministic gate and trace disagree.",
  ];
}

function metricDigest(metrics: SimMetrics): MetricDigest {
  return {
    AoPMean: round(metrics.AoPMean),
    PAPMean: round(metrics.PAPMean),
    CO_L: round(metrics.CO_L),
    CO_R: round(metrics.CO_R),
    LAPMean: round(metrics.LAPMean),
    RAPMean: round(metrics.RAPMean),
  };
}

function outputPreserved(result: PointResult): boolean {
  const metrics = result.metrics;
  if (!metrics) return false;
  return metrics.CO_L > 3.0 && metrics.CO_L < 7.5
    && metrics.CO_R > 3.0 && metrics.CO_R < 7.5
    && metrics.AoPMean > 55 && metrics.AoPMean < 125
    && metrics.PAPMean > 8 && metrics.PAPMean < 45;
}

function requiredSummary(summaries: readonly VariantSummary[], id: VariantId): VariantSummary {
  const summary = summaries.find((entry) => entry.variantId === id);
  if (!summary) throw new Error(`Missing Phase 5DE variant summary ${id}.`);
  return summary;
}

function keyValues(samples: readonly SimSample[], key: keyof SimSample): readonly number[] {
  return samples.map((sample) => Number(sample[key])).filter(Number.isFinite);
}

function fractionPositive(samples: readonly SimSample[], key: keyof SimSample): number {
  return samples.length > 0 ? samples.filter((sample) => Number(sample[key]) > 1e-9).length / samples.length : 0;
}

function fractionAtLeast(samples: readonly SimSample[], key: keyof SimSample, threshold: number): number {
  return samples.length > 0 ? samples.filter((sample) => Number(sample[key]) >= threshold).length / samples.length : 0;
}

function maxPeak(peaks: readonly { readonly theta: number; readonly value: number }[]) {
  return peaks.length === 0 ? null : peaks.reduce((best, peak) => peak.value > best.value ? peak : best, peaks[0]);
}

function mean(values: readonly number[]): number | null {
  return values.length === 0 ? null : values.reduce((sum, value) => sum + value, 0) / values.length;
}

function circularDistance(a: number, b: number): number {
  const d = Math.abs(a - b) % 1;
  return Math.min(d, 1 - d);
}

function round(value: number): number {
  return Number.isFinite(value) ? Number(value.toFixed(6)) : value;
}

function roundNullable(value: number | null): number | null {
  return value == null ? null : round(value);
}

function stable(value: unknown): string {
  return JSON.stringify(sortJson(value));
}

function hashStable(value: unknown): string {
  return createHash("sha256").update(stable(value)).digest("hex");
}

function sortJson(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortJson);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, entry]) => [key, sortJson(entry)]),
  );
}

export function writeTvPressureDeadbandPhase5DEEvidence(): Evidence {
  const evidence = buildTvPressureDeadbandPhase5DEEvidence();
  const outPath = path.resolve(process.cwd(), TV_PRESSURE_DEADBAND_PHASE5DE_RESULT_PATH);
  mkdirSync(path.dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(evidence, null, 2)}\n`);
  return evidence;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const evidence = writeTvPressureDeadbandPhase5DEEvidence();
  console.log(JSON.stringify({
    id: evidence.id,
    normalizedSha256: evidence.normalizedSha256,
    interpretation: evidence.interpretation,
    variantSummaries: evidence.variantSummaries,
    resultPath: TV_PRESSURE_DEADBAND_PHASE5DE_RESULT_PATH,
  }, null, 2));
}
