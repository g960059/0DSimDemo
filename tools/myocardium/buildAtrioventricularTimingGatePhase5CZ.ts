import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { DEFAULT_PARAMS } from "@/constants";
import type { ModelCoreExperimentalOptions } from "@/engine/ModelCore";
import { measureSteady, settleToSteadyState } from "@/engine/measure";
import {
  MODELCORE_RUNTIME_ALL_CHAMBER_LANDATRIAL_DEFAULT_MODE,
  MODELCORE_RUNTIME_LEGACY_ACTIVE_STRESS_ROLLBACK_MODE,
  resolveModelCoreRuntimeActiveSource,
} from "@/engine/myocardium/runtimeActiveSource";
import type { CoreRuntimeParams, OverrideBlock, SimulationHealth } from "@/engine/protocol";
import type { SettleStatus } from "@/engine/settling";
import {
  morphologyCheckSummaryFromSamples,
  type MorphologyBadgeSummary,
  type MorphologyCheckResult,
  type MorphologyCheckSummary,
} from "@/engine/verification/morphologyCheck";
import { resolveVerificationProfile } from "@/engine/verification/profiles";

export const ATRIOVENTRICULAR_TIMING_GATE_PHASE5CZ_ID =
  "atrioventricular-timing-gate-phase5cz-result-v1" as const;
export const ATRIOVENTRICULAR_TIMING_GATE_PHASE5CZ_RESULT_PATH =
  "data/myocardium/protocols/atrioventricular-timing-gate-phase5cz-result-v1.json" as const;

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
  | "legacy-active-stress-rollback"
  | "current-user0-all-chamber-landatrial"
  | "valve-pressure-flow-user0-inlet-held-release";

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
  readonly closurePath:
    | "frozen-legacy-active-stress"
    | "current-user0-all-chamber-landatrial"
    | "phase5cy-user0-valve-pressure-flow";
  readonly experimentalOptions: ModelCoreExperimentalOptions;
};

type TimingDigest = {
  readonly status: MorphologyCheckResult["status"] | "not-measured";
  readonly activeLeadMs: number | null;
  readonly pressureLeadMs: number | null;
  readonly activePeakTheta: number | null;
  readonly ventricularUpstrokeTheta: number | null;
  readonly pressureAPeakTheta: number | null;
};

type PointResult = {
  readonly variantId: VariantId;
  readonly pointId: PointId;
  readonly settled: boolean;
  readonly settleReason: SettleStatus["reason"] | "exception";
  readonly healthStatus: SimulationHealth["status"] | "exception";
  readonly morphologyStatus: MorphologyCheckSummary["status"] | "not-measured";
  readonly badges: MorphologyBadgeSummary | null;
  readonly failedLabels: readonly string[];
  readonly leftAvDelay: TimingDigest;
  readonly rightAvDelay: TimingDigest;
  readonly lapWaveform: TimingDigest;
  readonly rapWaveform: TimingDigest;
  readonly errorMessage: string | null;
};

type VariantSummary = {
  readonly variantId: VariantId;
  readonly measuredCount: number;
  readonly settledOkCount: number;
  readonly healthOkCount: number;
  readonly leftAvDelayOkCount: number;
  readonly rightAvDelayOkCount: number;
  readonly bothDirectAvDelayOkCount: number;
  readonly lapWaveformOkCount: number;
  readonly rapWaveformOkCount: number;
  readonly bothPressureWaveformOkCount: number;
  readonly firstDirectAvDelayFailurePoint: PointId | null;
  readonly firstPressureWaveformFailurePoint: PointId | null;
};

type Classification = {
  readonly legacyDirectAvDelay: string;
  readonly currentUser0DirectAvDelay: string;
  readonly valvePressureFlowUser0DirectAvDelay: string;
  readonly currentUser0PressureWaveform: string;
  readonly valvePressureFlowUser0PressureWaveform: string;
  readonly decision:
    | "direct-av-delay-gate-added-pressure-waveform-still-blocked"
    | "direct-av-delay-and-pressure-waveform-blocked"
    | "configuration-or-measurement-gap";
  readonly notes: readonly string[];
};

type Evidence = {
  readonly schemaVersion: 1;
  readonly id: typeof ATRIOVENTRICULAR_TIMING_GATE_PHASE5CZ_ID;
  readonly phase: "5CZ";
  readonly profile: {
    readonly verificationProfile: "fitFast";
    readonly morphologyProfileId: "normal_sinus_default";
    readonly pointSource: "representative-normal-sinus-envelope";
    readonly diagnosticQuestion:
      "whether normal-sinus morphology includes a direct atrial-kick-to-ventricular-upstroke timing gate beyond the existing LAP/RAP waveform check";
  };
  readonly gateContract: {
    readonly directGateAddedTo: "engine/verification/morphologyCheck.ts";
    readonly leftGateId: "left-av-delay";
    readonly rightGateId: "right-av-delay";
    readonly activeLeadThresholdMs: "45-240";
    readonly pressureLeadThresholdMs: "10-260 when measurable";
    readonly lapRapBadgesIncludeDirectDelay: true;
  };
  readonly variants: readonly Omit<VariantSpec, "experimentalOptions">[];
  readonly points: readonly PointSpec[];
  readonly results: readonly PointResult[];
  readonly variantSummaries: readonly VariantSummary[];
  readonly classification: Classification;
  readonly recommendedNext: readonly string[];
  readonly claimBoundary: {
    readonly noRuntimeDefaultAdoption: true;
    readonly noOfficialMorphologyAcceptance: true;
    readonly noLandAtrialParameterTuningUnlock: true;
    readonly noA1A2Reopen: true;
    readonly noValveQdotRootZcTrefSourceStressTuning: true;
    readonly noClinicalScientificValidation: true;
  };
  readonly normalizedSha256: string;
};

const profile = resolveVerificationProfile("fitFast");

const POINTS: readonly PointSpec[] = [
  { id: "normal-hr75", targetTBVMl: 5600, params: { HR: 75 } },
  { id: "low-preload-hr75", targetTBVMl: 4800, params: { HR: 75 } },
  { id: "high-preload-hr75", targetTBVMl: 6200, params: { HR: 75 } },
  { id: "normal-hr90", targetTBVMl: 5600, params: { HR: 90 } },
  { id: "systemic-afterload-high-hr75", targetTBVMl: 5600, params: { HR: 75, systemicResistance: 1.25 } },
  { id: "pulmonary-afterload-high-hr75", targetTBVMl: 5600, params: { HR: 75, pulmonaryResistance: 1.35 } },
  { id: "contractility-low-hr75", targetTBVMl: 5600, params: { HR: 75, contractility: 0.82 } },
  { id: "contractility-high-hr75", targetTBVMl: 5600, params: { HR: 75, contractility: 1.18 } },
];

export function buildAtrioventricularTimingGatePhase5CZEvidence(): Evidence {
  const inletHeldRelease = {
    avPlaneDescentRiseTauSec: 0.018,
    avPlaneDescentReleaseTauSec: 0.140,
    avPlaneDescentMaxRiseVelocity01PerSec: 24,
    avPlaneDescentMaxReleaseVelocity01PerSec: 7,
    avPlaneDescentReleaseInletOpenHold: 1,
    avPlaneDescentReleaseInletOpenThreshold: 0.08,
  } as const;
  const variants = [
    runtimeVariant(
      "legacy-active-stress-rollback",
      "Frozen legacy active-stress rollback/reference",
      "frozen-legacy-active-stress",
      MODELCORE_RUNTIME_LEGACY_ACTIVE_STRESS_ROLLBACK_MODE,
    ),
    runtimeVariant(
      "current-user0-all-chamber-landatrial",
      "Current user0 all-chamber LandAtrial staged default",
      "current-user0-all-chamber-landatrial",
      MODELCORE_RUNTIME_ALL_CHAMBER_LANDATRIAL_DEFAULT_MODE,
    ),
    valvePressureFlowUser0Variant(inletHeldRelease),
  ] as const;
  const results = variants.flatMap((variant) => POINTS.map((point) => runPoint(variant, point)));
  const variantSummaries = variants.map((variant) => summarizeVariant(variant, results));
  const classification = classify(variantSummaries);
  const evidenceWithoutHash = {
    schemaVersion: 1,
    id: ATRIOVENTRICULAR_TIMING_GATE_PHASE5CZ_ID,
    phase: "5CZ",
    profile: {
      verificationProfile: "fitFast",
      morphologyProfileId: "normal_sinus_default",
      pointSource: "representative-normal-sinus-envelope",
      diagnosticQuestion:
        "whether normal-sinus morphology includes a direct atrial-kick-to-ventricular-upstroke timing gate beyond the existing LAP/RAP waveform check",
    },
    gateContract: {
      directGateAddedTo: "engine/verification/morphologyCheck.ts",
      leftGateId: "left-av-delay",
      rightGateId: "right-av-delay",
      activeLeadThresholdMs: "45-240",
      pressureLeadThresholdMs: "10-260 when measurable",
      lapRapBadgesIncludeDirectDelay: true,
    },
    variants: variants.map(({ experimentalOptions: _experimentalOptions, ...variant }) => variant),
    points: POINTS,
    results,
    variantSummaries,
    classification,
    recommendedNext: recommendedNext(classification),
    claimBoundary: {
      noRuntimeDefaultAdoption: true,
      noOfficialMorphologyAcceptance: true,
      noLandAtrialParameterTuningUnlock: true,
      noA1A2Reopen: true,
      noValveQdotRootZcTrefSourceStressTuning: true,
      noClinicalScientificValidation: true,
    },
  } satisfies Omit<Evidence, "normalizedSha256">;
  return {
    ...evidenceWithoutHash,
    normalizedSha256: hashStable(evidenceWithoutHash),
  };
}

function runtimeVariant(
  id: Exclude<VariantId, "valve-pressure-flow-user0-inlet-held-release">,
  label: string,
  closurePath: VariantSpec["closurePath"],
  mode: Parameters<typeof resolveModelCoreRuntimeActiveSource>[0]["mode"],
): VariantSpec {
  const resolved = resolveModelCoreRuntimeActiveSource({ mode, runtimeParams: DEFAULT_PARAMS });
  return { id, label, closurePath, experimentalOptions: resolved.experimentalOptions };
}

function valvePressureFlowUser0Variant(override: AtrialAvPlaneActiveOverride): VariantSpec {
  const resolved = resolveModelCoreRuntimeActiveSource({
    mode: MODELCORE_RUNTIME_ALL_CHAMBER_LANDATRIAL_DEFAULT_MODE,
    runtimeParams: DEFAULT_PARAMS,
  });
  return {
    id: "valve-pressure-flow-user0-inlet-held-release",
    label: "Phase 5CY user0 valve-pressure-flow candidate with inlet-held AV-plane release",
    closurePath: "phase5cy-user0-valve-pressure-flow",
    experimentalOptions: withAvBoundaryMode(
      withAtrialAvPlaneOverride(resolved.experimentalOptions, { LA: override, RA: override }),
      "phase5cz-valve-pressure-flow-user0-inlet-held-release",
    ),
  };
}

function withAvBoundaryMode(
  experimentalOptions: ModelCoreExperimentalOptions,
  mechanismId: string,
): ModelCoreExperimentalOptions {
  return {
    ...experimentalOptions,
    ventricularChamberTransactionStep: {
      mechanismId,
      iterations: 4,
      relaxation: 0.7,
      providerStateCouplingChambers: ["LV", "RV"],
      includeAdjacentLoadNodes: true,
      avValveBoundaryMode: "accepted-state-valve-pressure-flow",
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
      morphologyStatus: morphology?.status ?? "not-measured",
      badges: morphology?.badges ?? null,
      failedLabels: morphology
        ? morphology.results.filter((result) => result.status === "failed").map((result) => result.label)
        : ["not-measured"],
      leftAvDelay: digest(morphology, "left-av-delay"),
      rightAvDelay: digest(morphology, "right-av-delay"),
      lapWaveform: digest(morphology, "lap-waveform"),
      rapWaveform: digest(morphology, "rap-waveform"),
      errorMessage: null,
    };
  } catch (error) {
    return {
      variantId: variant.id,
      pointId: point.id,
      settled: false,
      settleReason: "exception",
      healthStatus: "exception",
      morphologyStatus: "not-measured",
      badges: null,
      failedLabels: ["exception"],
      leftAvDelay: emptyDigest(),
      rightAvDelay: emptyDigest(),
      lapWaveform: emptyDigest(),
      rapWaveform: emptyDigest(),
      errorMessage: error instanceof Error ? error.message : String(error),
    };
  }
}

function digest(
  morphology: MorphologyCheckSummary | null,
  id: "left-av-delay" | "right-av-delay" | "lap-waveform" | "rap-waveform",
): TimingDigest {
  const result = morphology?.results.find((entry) => entry.id === id);
  if (!result) return emptyDigest();
  return {
    status: result.status,
    activeLeadMs: numberMetric(result, "activeToVentricularUpstrokeLeadMs"),
    pressureLeadMs: numberMetric(result, "pressureAToVentricularUpstrokeLeadMs"),
    activePeakTheta: numberMetric(result, "activePeakTheta"),
    ventricularUpstrokeTheta: numberMetric(result, "ventricularUpstrokeTheta"),
    pressureAPeakTheta: numberMetric(result, "atrialPressureAPeakTheta"),
  };
}

function numberMetric(result: MorphologyCheckResult, key: string): number | null {
  const value = result.metrics[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function emptyDigest(): TimingDigest {
  return {
    status: "not-measured",
    activeLeadMs: null,
    pressureLeadMs: null,
    activePeakTheta: null,
    ventricularUpstrokeTheta: null,
    pressureAPeakTheta: null,
  };
}

function summarizeVariant(variant: VariantSpec, results: readonly PointResult[]): VariantSummary {
  const selected = results.filter((result) => result.variantId === variant.id);
  const measured = selected.filter((result) => result.morphologyStatus !== "not-measured");
  const directOk = (result: PointResult) =>
    result.leftAvDelay.status === "ok" && result.rightAvDelay.status === "ok";
  const pressureOk = (result: PointResult) =>
    result.badges?.lapWaveform === "ok" && result.badges.rapWaveform === "ok";
  return {
    variantId: variant.id,
    measuredCount: measured.length,
    settledOkCount: selected.filter((result) => result.settled).length,
    healthOkCount: selected.filter((result) => result.healthStatus === "ok").length,
    leftAvDelayOkCount: measured.filter((result) => result.leftAvDelay.status === "ok").length,
    rightAvDelayOkCount: measured.filter((result) => result.rightAvDelay.status === "ok").length,
    bothDirectAvDelayOkCount: measured.filter(directOk).length,
    lapWaveformOkCount: measured.filter((result) => result.badges?.lapWaveform === "ok").length,
    rapWaveformOkCount: measured.filter((result) => result.badges?.rapWaveform === "ok").length,
    bothPressureWaveformOkCount: measured.filter(pressureOk).length,
    firstDirectAvDelayFailurePoint: measured.find((result) => !directOk(result))?.pointId ?? null,
    firstPressureWaveformFailurePoint: measured.find((result) => !pressureOk(result))?.pointId ?? null,
  };
}

function classify(summaries: readonly VariantSummary[]): Classification {
  const legacy = mustFindSummary(summaries, "legacy-active-stress-rollback");
  const current = mustFindSummary(summaries, "current-user0-all-chamber-landatrial");
  const pressureFlow = mustFindSummary(summaries, "valve-pressure-flow-user0-inlet-held-release");
  const currentDirect = count(current.bothDirectAvDelayOkCount, current.measuredCount);
  const pressureFlowDirect = count(pressureFlow.bothDirectAvDelayOkCount, pressureFlow.measuredCount);
  const currentPressure = count(current.bothPressureWaveformOkCount, current.measuredCount);
  const pressureFlowPressure = count(pressureFlow.bothPressureWaveformOkCount, pressureFlow.measuredCount);
  const decision = current.measuredCount === 0 || pressureFlow.measuredCount === 0
    ? "configuration-or-measurement-gap"
    : current.bothDirectAvDelayOkCount === current.measuredCount
        && pressureFlow.bothDirectAvDelayOkCount === pressureFlow.measuredCount
      ? "direct-av-delay-gate-added-pressure-waveform-still-blocked"
      : "direct-av-delay-and-pressure-waveform-blocked";
  return {
    legacyDirectAvDelay: count(legacy.bothDirectAvDelayOkCount, legacy.measuredCount),
    currentUser0DirectAvDelay: currentDirect,
    valvePressureFlowUser0DirectAvDelay: pressureFlowDirect,
    currentUser0PressureWaveform: currentPressure,
    valvePressureFlowUser0PressureWaveform: pressureFlowPressure,
    decision,
    notes: [
      "The morphology checker now contains direct left/right atrial-kick-to-ventricular-pressure-upstroke timing checks.",
      "This phase answers the owner screenshot concern directly but does not unlock LandAtrial tuning because LAP/RAP waveform timing remains part of the same badge.",
      "Pressure waveform acceptance remains separate from LV/RV PV plus MVF/TVF gross repair.",
    ],
  };
}

function recommendedNext(classification: Classification): readonly string[] {
  if (classification.decision === "configuration-or-measurement-gap") {
    return ["Fix the measurement gap before interpreting atrioventricular timing."];
  }
  return [
    "Keep the direct AV timing check as a permanent normal-sinus morphology guard.",
    "Use the new left/right AV delay metrics in future case/lesson profile gates, with profile-specific expectations for AF and conduction-delay cases.",
    "Do not resume LandAtrial parameter tuning until the chamber/valve/load contract also clears LV/RV PV plus MVF/TVF and LAP/RAP timing over the representative envelope.",
  ];
}

function mustFindSummary(summaries: readonly VariantSummary[], variantId: VariantId): VariantSummary {
  const found = summaries.find((summary) => summary.variantId === variantId);
  if (!found) throw new Error(`Missing summary for ${variantId}`);
  return found;
}

function count(numerator: number, denominator: number): string {
  return `${numerator}/${denominator}`;
}

function hashStable(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value, null, 2)).digest("hex");
}

function writeEvidence(): void {
  const evidence = buildAtrioventricularTimingGatePhase5CZEvidence();
  const outPath = path.resolve(ATRIOVENTRICULAR_TIMING_GATE_PHASE5CZ_RESULT_PATH);
  mkdirSync(path.dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(evidence, null, 2)}\n`);
  console.log(`Wrote ${ATRIOVENTRICULAR_TIMING_GATE_PHASE5CZ_RESULT_PATH}`);
  console.log(`normalizedSha256=${evidence.normalizedSha256}`);
  console.log(JSON.stringify(evidence.classification, null, 2));
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  writeEvidence();
}
