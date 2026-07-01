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
import type { CoreRuntimeParams, OverrideBlock, SimSample, SimulationHealth } from "@/engine/protocol";
import type { SettleStatus } from "@/engine/settling";
import { morphologyCheckSummaryFromSamples, type MorphologyBadgeSummary } from "@/engine/verification/morphologyCheck";
import { resolveVerificationProfile } from "@/engine/verification/profiles";

export const AVPLANE_STATE_HYGIENE_PHASE5DB_ID =
  "avplane-state-hygiene-phase5db-result-v1" as const;
export const AVPLANE_STATE_HYGIENE_PHASE5DB_RESULT_PATH =
  "data/myocardium/protocols/avplane-state-hygiene-phase5db-result-v1.json" as const;

type PointId = "normal-hr75" | "contractility-low-hr75";

type VariantId =
  | "user0-current-avplane"
  | "user0-stateful-inlet-held-pressure-flow"
  | "user0-stateful-inlet-held-accepted-complementarity";

type AvBoundaryMode =
  | "accepted-state-av-boundary-fixedpoint"
  | "accepted-state-valve-pressure-flow";

type AtrialAvPlaneActiveOverride = {
  readonly avPlaneDescentRiseTauSec?: number;
  readonly avPlaneDescentReleaseTauSec?: number;
  readonly avPlaneDescentMaxRiseVelocity01PerSec?: number;
  readonly avPlaneDescentMaxReleaseVelocity01PerSec?: number;
  readonly avPlaneDescentReleaseInletOpenHold?: number;
  readonly avPlaneDescentReleaseInletOpenThreshold?: number;
};

type PointSpec = {
  readonly id: PointId;
  readonly targetTBVMl: number;
  readonly params: Partial<CoreRuntimeParams>;
};

type VariantSpec = {
  readonly id: VariantId;
  readonly label: string;
  readonly requestedAvPlaneOverride: AtrialAvPlaneActiveOverride | null;
  readonly avValveBoundaryMode: AvBoundaryMode | null;
  readonly experimentalOptions: ModelCoreExperimentalOptions;
};

type SideHygiene = {
  readonly side: "LA" | "RA";
  readonly sampleCount: number;
  readonly readbackAvailable: boolean;
  readonly statefulEnabledFraction: number;
  readonly requested: AtrialAvPlaneActiveOverride | null;
  readonly effective: {
    readonly riseTauSec: number | null;
    readonly releaseTauSec: number | null;
    readonly inletOpenHold: number | null;
    readonly inletOpenThreshold: number | null;
  };
  readonly targetDescentRange: number | null;
  readonly descentRange: number | null;
  readonly descentMax: number | null;
  readonly targetDescentMax: number | null;
  readonly maxAbsTargetMinusDescent: number | null;
  readonly effectiveVolumeCorrectionRangeMl: number | null;
  readonly effectiveVolumeCorrectionMaxMl: number | null;
  readonly effectiveVolumeCorrectionVelocityRangeMlPerSec: number | null;
  readonly wallLambdaAvPlaneDeltaRange: number | null;
  readonly pressureDeltaRangeMmHg: number | null;
  readonly globalNonzeroDescent: boolean;
  readonly globalNonzeroCorrection: boolean;
  readonly requestedEffectiveMatch: boolean;
};

type PointResult = {
  readonly variantId: VariantId;
  readonly pointId: PointId;
  readonly settled: boolean;
  readonly settleReason: SettleStatus["reason"] | "exception";
  readonly healthStatus: SimulationHealth["status"] | "exception";
  readonly badges: MorphologyBadgeSummary | null;
  readonly failedLabels: readonly string[];
  readonly LA: SideHygiene | null;
  readonly RA: SideHygiene | null;
  readonly errorMessage: string | null;
};

type VariantSummary = {
  readonly variantId: VariantId;
  readonly measuredCount: number;
  readonly settledOkCount: number;
  readonly laStatefulEnabledCount: number;
  readonly raStatefulEnabledCount: number;
  readonly laNonzeroDescentCount: number;
  readonly raNonzeroDescentCount: number;
  readonly laNonzeroCorrectionCount: number;
  readonly raNonzeroCorrectionCount: number;
  readonly requestedEffectiveMismatchCount: number;
  readonly minLaDescentMax: number | null;
  readonly minRaDescentMax: number | null;
  readonly minLaCorrectionMaxMl: number | null;
  readonly minRaCorrectionMaxMl: number | null;
};

type Evidence = {
  readonly schemaVersion: 1;
  readonly id: typeof AVPLANE_STATE_HYGIENE_PHASE5DB_ID;
  readonly phase: "5DB";
  readonly profile: {
    readonly verificationProfile: "fitFast";
    readonly morphologyProfileId: "normal_sinus_default";
    readonly diagnosticQuestion:
      "whether Phase 5CV-5DA stateful LandAtrial AV-plane release state/readbacks are preserved and nonzero before interpreting transfer residuals";
  };
  readonly upstreamEvidence: {
    readonly phase5CWArtifactId: "stateful-avplane-release-hold-phase5cw-result-v1";
    readonly phase5DAArtifactId: "tvf-residual-attribution-phase5da-result-v1";
  };
  readonly variants: readonly Omit<VariantSpec, "experimentalOptions">[];
  readonly points: readonly PointSpec[];
  readonly results: readonly PointResult[];
  readonly variantSummaries: readonly VariantSummary[];
  readonly interpretation: {
    readonly decision:
      | "stateful-avplane-state-preserved"
      | "stateful-avplane-state-hygiene-failed"
      | "stateful-avplane-state-hygiene-inconclusive";
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

const INLET_HELD_RELEASE = {
  avPlaneDescentRiseTauSec: 0.018,
  avPlaneDescentReleaseTauSec: 0.140,
  avPlaneDescentMaxRiseVelocity01PerSec: 24,
  avPlaneDescentMaxReleaseVelocity01PerSec: 7,
  avPlaneDescentReleaseInletOpenHold: 1,
  avPlaneDescentReleaseInletOpenThreshold: 0.08,
} as const;

export function buildAvPlaneStateHygienePhase5DBEvidence(): Evidence {
  const variants = [
    user0CurrentVariant(),
    user0StatefulVariant(
      "user0-stateful-inlet-held-pressure-flow",
      "User0 stateful inlet-held AV-plane release with Phase 5CY pressure-flow contract",
      "accepted-state-valve-pressure-flow",
    ),
    user0StatefulVariant(
      "user0-stateful-inlet-held-accepted-complementarity",
      "User0 stateful inlet-held AV-plane release with accepted-complementarity comparator",
      "accepted-state-av-boundary-fixedpoint",
    ),
  ] as const;
  const results = variants.flatMap((variant) => POINTS.map((point) => runPoint(variant, point)));
  const variantSummaries = variants.map((variant) => summarizeVariant(variant.id, results));
  const interpretation = interpret(variantSummaries);
  const evidenceWithoutHash = {
    schemaVersion: 1,
    id: AVPLANE_STATE_HYGIENE_PHASE5DB_ID,
    phase: "5DB",
    profile: {
      verificationProfile: "fitFast",
      morphologyProfileId: "normal_sinus_default",
      diagnosticQuestion:
        "whether Phase 5CV-5DA stateful LandAtrial AV-plane release state/readbacks are preserved and nonzero before interpreting transfer residuals",
    },
    upstreamEvidence: {
      phase5CWArtifactId: "stateful-avplane-release-hold-phase5cw-result-v1",
      phase5DAArtifactId: "tvf-residual-attribution-phase5da-result-v1",
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

function user0CurrentVariant(): VariantSpec {
  const resolved = resolveModelCoreRuntimeActiveSource({
    mode: MODELCORE_RUNTIME_ALL_CHAMBER_LANDATRIAL_DEFAULT_MODE,
    runtimeParams: DEFAULT_PARAMS,
  });
  return {
    id: "user0-current-avplane",
    label: "Current user0 all-chamber LandAtrial AV-plane closure",
    requestedAvPlaneOverride: null,
    avValveBoundaryMode: null,
    experimentalOptions: resolved.experimentalOptions,
  };
}

function user0StatefulVariant(id: Exclude<VariantId, "user0-current-avplane">, label: string, avValveBoundaryMode: AvBoundaryMode): VariantSpec {
  const resolved = resolveModelCoreRuntimeActiveSource({
    mode: MODELCORE_RUNTIME_ALL_CHAMBER_LANDATRIAL_DEFAULT_MODE,
    runtimeParams: DEFAULT_PARAMS,
  });
  return {
    id,
    label,
    requestedAvPlaneOverride: INLET_HELD_RELEASE,
    avValveBoundaryMode,
    experimentalOptions: withAvBoundaryMode(
      withAtrialAvPlaneOverride(resolved.experimentalOptions, INLET_HELD_RELEASE),
      `phase5db-${id}`,
      avValveBoundaryMode,
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
      LA: measurement ? sideHygiene("LA", measurement.samples, variant.requestedAvPlaneOverride) : null,
      RA: measurement ? sideHygiene("RA", measurement.samples, variant.requestedAvPlaneOverride) : null,
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
      LA: null,
      RA: null,
      errorMessage: error instanceof Error ? error.message : String(error),
    };
  }
}

function sideHygiene(side: "LA" | "RA", samples: readonly SimSample[], requested: AtrialAvPlaneActiveOverride | null): SideHygiene {
  const prefix = side;
  const descent = values(samples, `${prefix}AvPlaneDescent01` as keyof SimSample);
  const target = values(samples, `${prefix}AvPlaneTargetDescent01` as keyof SimSample);
  const correction = values(samples, `${prefix}AvPlaneEffectiveVolumeCorrectionMl` as keyof SimSample);
  const correctionVelocity = values(samples, `${prefix}AvPlaneEffectiveVolumeCorrectionVelocityMlPerSec` as keyof SimSample);
  const lambdaDelta = values(samples, `${prefix}WallLambdaAvPlaneDelta` as keyof SimSample);
  const pressureDelta = values(samples, `${prefix}AvPlanePressureDeltaMmHg` as keyof SimSample);
  const stateful = values(samples, `${prefix}AvPlaneStatefulRelease01` as keyof SimSample);
  const riseTau = firstFinite(samples, `${prefix}AvPlaneDescentRiseTauSec` as keyof SimSample);
  const releaseTau = firstFinite(samples, `${prefix}AvPlaneDescentReleaseTauSec` as keyof SimSample);
  const inletHold = firstFinite(samples, `${prefix}AvPlaneDescentReleaseInletOpenHold` as keyof SimSample);
  const inletThreshold = firstFinite(samples, `${prefix}AvPlaneDescentReleaseInletOpenThreshold` as keyof SimSample);
  const maxAbsTargetMinusDescent = rangeZipMaxAbs(target, descent);
  const effective = {
    riseTauSec: roundNullable(riseTau),
    releaseTauSec: roundNullable(releaseTau),
    inletOpenHold: roundNullable(inletHold),
    inletOpenThreshold: roundNullable(inletThreshold),
  };
  return {
    side,
    sampleCount: samples.length,
    readbackAvailable: descent.length > 0 && target.length > 0 && correction.length > 0,
    statefulEnabledFraction: round(fraction(stateful, (value) => value > 0.5)),
    requested,
    effective,
    targetDescentRange: roundNullable(range(target)),
    descentRange: roundNullable(range(descent)),
    descentMax: roundNullable(max(descent)),
    targetDescentMax: roundNullable(max(target)),
    maxAbsTargetMinusDescent: roundNullable(maxAbsTargetMinusDescent),
    effectiveVolumeCorrectionRangeMl: roundNullable(range(correction)),
    effectiveVolumeCorrectionMaxMl: roundNullable(max(correction)),
    effectiveVolumeCorrectionVelocityRangeMlPerSec: roundNullable(range(correctionVelocity)),
    wallLambdaAvPlaneDeltaRange: roundNullable(range(lambdaDelta)),
    pressureDeltaRangeMmHg: roundNullable(range(pressureDelta)),
    globalNonzeroDescent: (max(descent) ?? 0) > 0.02,
    globalNonzeroCorrection: (max(correction) ?? 0) > 0.05,
    requestedEffectiveMatch: requestedEffectiveMatch(requested, effective),
  };
}

function summarizeVariant(variantId: VariantId, results: readonly PointResult[]): VariantSummary {
  const selected = results.filter((result) => result.variantId === variantId);
  const measured = selected.filter((result) => result.LA && result.RA);
  const la = measured.map((result) => result.LA!);
  const ra = measured.map((result) => result.RA!);
  return {
    variantId,
    measuredCount: measured.length,
    settledOkCount: selected.filter((result) => result.settled && result.healthStatus === "ok").length,
    laStatefulEnabledCount: la.filter((entry) => entry.statefulEnabledFraction > 0.9).length,
    raStatefulEnabledCount: ra.filter((entry) => entry.statefulEnabledFraction > 0.9).length,
    laNonzeroDescentCount: la.filter((entry) => entry.globalNonzeroDescent).length,
    raNonzeroDescentCount: ra.filter((entry) => entry.globalNonzeroDescent).length,
    laNonzeroCorrectionCount: la.filter((entry) => entry.globalNonzeroCorrection).length,
    raNonzeroCorrectionCount: ra.filter((entry) => entry.globalNonzeroCorrection).length,
    requestedEffectiveMismatchCount: [...la, ...ra].filter((entry) => !entry.requestedEffectiveMatch).length,
    minLaDescentMax: roundNullable(min(la.map((entry) => entry.descentMax))),
    minRaDescentMax: roundNullable(min(ra.map((entry) => entry.descentMax))),
    minLaCorrectionMaxMl: roundNullable(min(la.map((entry) => entry.effectiveVolumeCorrectionMaxMl))),
    minRaCorrectionMaxMl: roundNullable(min(ra.map((entry) => entry.effectiveVolumeCorrectionMaxMl))),
  };
}

function interpret(summaries: readonly VariantSummary[]): Evidence["interpretation"] {
  const pressureFlow = requiredSummary(summaries, "user0-stateful-inlet-held-pressure-flow");
  const comparator = requiredSummary(summaries, "user0-stateful-inlet-held-accepted-complementarity");
  const needed = POINTS.length;
  const statefulOk = [pressureFlow, comparator].every((summary) =>
    summary.measuredCount === needed
    && summary.laStatefulEnabledCount === needed
    && summary.raStatefulEnabledCount === needed
    && summary.laNonzeroDescentCount === needed
    && summary.raNonzeroDescentCount === needed
    && summary.laNonzeroCorrectionCount === needed
    && summary.raNonzeroCorrectionCount === needed
    && summary.requestedEffectiveMismatchCount === 0
  );
  if (statefulOk) {
    return {
      decision: "stateful-avplane-state-preserved",
      notes: [
        "Stateful inlet-held AV-plane release readbacks are enabled on LA and RA in both measured variants.",
        "LA/RA descent and effective-volume correction are globally nonzero, so sanitizeState/state packing is not zeroing the stateful release coordinate.",
        "The Phase 5DA zero RA AV-plane correction in the failed TVF extra-wave window should be interpreted as local timing/coasting evidence, not a global AV-plane state-readback failure.",
      ],
    };
  }
  const anyMismatch = [pressureFlow, comparator].some((summary) => summary.requestedEffectiveMismatchCount > 0);
  const anyMissing = [pressureFlow, comparator].some((summary) =>
    summary.laStatefulEnabledCount < needed
    || summary.raStatefulEnabledCount < needed
    || summary.laNonzeroDescentCount < needed
    || summary.raNonzeroDescentCount < needed
  );
  return {
    decision: anyMismatch || anyMissing ? "stateful-avplane-state-hygiene-failed" : "stateful-avplane-state-hygiene-inconclusive",
    notes: [
      `Pressure-flow stateful summary: LA stateful ${pressureFlow.laStatefulEnabledCount}/${needed}, RA stateful ${pressureFlow.raStatefulEnabledCount}/${needed}, mismatches ${pressureFlow.requestedEffectiveMismatchCount}.`,
      `Accepted-complementarity stateful summary: LA stateful ${comparator.laStatefulEnabledCount}/${needed}, RA stateful ${comparator.raStatefulEnabledCount}/${needed}, mismatches ${comparator.requestedEffectiveMismatchCount}.`,
      "Do not interpret Phase 5CW-5DA AV-plane release evidence until this hygiene gap is resolved.",
    ],
  };
}

function recommendation(decision: Evidence["interpretation"]["decision"]): readonly string[] {
  if (decision === "stateful-avplane-state-preserved") {
    return [
      "Proceed from Phase 5DA's right AV pressure-flow coasting attribution; do not reopen simple AV-plane gain-off or state-persistence debugging.",
      "The next structural surface should address right AV pressure-flow energy/coasting consistency across the diastolic window while preserving Phase 5CY pressure-flow contract readbacks.",
      "Keep LandAtrial parameter tuning locked until representative LV/RV PV plus MVF/TVF morphology passes.",
    ];
  }
  return [
    "Fix AV-plane state persistence/readback before using Phase 5CW-5DA transfer evidence.",
    "Do not tune LandAtrial, valve thresholds, qDot, root/Zc, Tref, or source-stress to compensate for a state hygiene failure.",
  ];
}

function requestedEffectiveMatch(
  requested: AtrialAvPlaneActiveOverride | null,
  effective: SideHygiene["effective"],
): boolean {
  if (!requested) return true;
  return nearly(effective.riseTauSec, requested.avPlaneDescentRiseTauSec)
    && nearly(effective.releaseTauSec, requested.avPlaneDescentReleaseTauSec)
    && nearly(effective.inletOpenHold, requested.avPlaneDescentReleaseInletOpenHold)
    && nearly(effective.inletOpenThreshold, requested.avPlaneDescentReleaseInletOpenThreshold);
}

function requiredSummary(summaries: readonly VariantSummary[], id: VariantId): VariantSummary {
  const summary = summaries.find((entry) => entry.variantId === id);
  if (!summary) throw new Error(`Missing Phase 5DB variant summary ${id}.`);
  return summary;
}

function values(samples: readonly SimSample[], key: keyof SimSample): readonly number[] {
  return samples.map((sample) => Number(sample[key])).filter(Number.isFinite);
}

function firstFinite(samples: readonly SimSample[], key: keyof SimSample): number | null {
  for (const sample of samples) {
    const value = Number(sample[key]);
    if (Number.isFinite(value)) return value;
  }
  return null;
}

function rangeZipMaxAbs(a: readonly number[], b: readonly number[]): number | null {
  const n = Math.min(a.length, b.length);
  if (n === 0) return null;
  let out = 0;
  for (let i = 0; i < n; i++) out = Math.max(out, Math.abs(a[i] - b[i]));
  return out;
}

function max(values_: readonly (number | null)[]): number | null {
  const finite = values_.filter((value): value is number => value != null && Number.isFinite(value));
  return finite.length > 0 ? Math.max(...finite) : null;
}

function min(values_: readonly (number | null)[]): number | null {
  const finite = values_.filter((value): value is number => value != null && Number.isFinite(value));
  return finite.length > 0 ? Math.min(...finite) : null;
}

function range(values_: readonly number[]): number | null {
  if (values_.length === 0) return null;
  return Math.max(...values_) - Math.min(...values_);
}

function fraction(values_: readonly number[], predicate: (value: number) => boolean): number {
  return values_.length > 0 ? values_.filter(predicate).length / values_.length : 0;
}

function nearly(actual: number | null, expected: number | undefined): boolean {
  if (expected == null) return true;
  return actual != null && Math.abs(actual - expected) <= 1e-6;
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

export function writeAvPlaneStateHygienePhase5DBEvidence(): Evidence {
  const evidence = buildAvPlaneStateHygienePhase5DBEvidence();
  const outPath = path.resolve(process.cwd(), AVPLANE_STATE_HYGIENE_PHASE5DB_RESULT_PATH);
  mkdirSync(path.dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(evidence, null, 2)}\n`);
  return evidence;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const evidence = writeAvPlaneStateHygienePhase5DBEvidence();
  console.log(JSON.stringify({
    id: evidence.id,
    normalizedSha256: evidence.normalizedSha256,
    decision: evidence.interpretation.decision,
    variantSummaries: evidence.variantSummaries,
    resultPath: AVPLANE_STATE_HYGIENE_PHASE5DB_RESULT_PATH,
  }, null, 2));
}
