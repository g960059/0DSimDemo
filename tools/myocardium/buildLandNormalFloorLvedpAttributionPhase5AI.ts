import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import phase5XArtifact from "@/data/myocardium/protocols/lv-land-default-candidate-preflight-phase5x-result-v1.json";
import phase5AHArtifact from "@/data/myocardium/protocols/arterial-root-boundary-attribution-phase5ah-result-v1.json";
import { defaultActiveLV } from "@/engine/chambers";
import { defaultParams } from "@/engine/ModelCore";
import { measureConverged } from "@/engine/measure";
import type { CoreRuntimeParams, SimulationHealth } from "@/engine/protocol";
import {
  MYOCARDIUM_DEVELOPER_ONLY_LV_LAND_RUNTIME_FLAG_ACKNOWLEDGEMENT,
  createMyocardiumDeveloperOnlyLvLandRuntimeFlagOptions,
} from "@/tools/myocardium/modelCoreDeveloperOnlyLandRuntimeFlag";
import { createModelCoreLand2017LvSourceProviderInstrumentation } from "@/tools/myocardium/modelCoreLand2017LvSourceProvider";

export const LAND_NORMAL_FLOOR_LVEDP_ATTRIBUTION_PHASE5AI_ID =
  "land-normal-floor-lvedp-attribution-phase5ai-result-v1";

export const LAND_NORMAL_FLOOR_LVEDP_ATTRIBUTION_PHASE5AI_RESULT_PATH =
  "data/myocardium/protocols/land-normal-floor-lvedp-attribution-phase5ai-result-v1.json";

const VERIFIER_SCRIPT = "verify:myocardium-land-normal-floor-lvedp-attribution" as const;
const NORMAL_TARGET_TBV_ML = 5600;
const MEASURE_OPTIONS = {
  dt: 0.001,
  sampleHz: 240,
  measureBeats: 3,
  requireProjectorQuiet: false,
} as const;
const FLOOR_THRESHOLDS = {
  CO_L: { min: 3.5, max: 7.0, unit: "L/min" },
  AoPMean: { min: 65, max: 110, unit: "mmHg" },
  EF_LApprox: { min: 0.45, max: 0.75, unit: "fraction" },
  EDV_L: { min: 70, max: 180, unit: "mL" },
  ESV_L: { min: 20, max: 110, unit: "mL" },
  LVEDPApprox: { min: 0, max: 16, unit: "mmHg" },
} as const;
const OUTPUT_RATIO_MIN = 0.85;
const OUTPUT_RATIO_MAX = 1.15;

const PROBES = [
  { id: "stock-current-normal", label: "stock current normal", axis: "reference-stock", modelPathId: "stock-active-no-provider-v0", targetTBVMl: 5600, paramPatch: {} },
  { id: "land-current-normal", label: "Land current normal", axis: "reference-land", modelPathId: "developer-only-lv-land-v0", targetTBVMl: 5600, paramPatch: {} },
  { id: "land-tbv-5550", label: "Land TBV 5550", axis: "preload-tbv", modelPathId: "developer-only-lv-land-v0", targetTBVMl: 5550, paramPatch: {} },
  { id: "land-tbv-5500", label: "Land TBV 5500", axis: "preload-tbv", modelPathId: "developer-only-lv-land-v0", targetTBVMl: 5500, paramPatch: {} },
  { id: "land-tbv-5450", label: "Land TBV 5450", axis: "preload-tbv", modelPathId: "developer-only-lv-land-v0", targetTBVMl: 5450, paramPatch: {} },
  { id: "land-venous-tone-0p10", label: "Land venous tone 0.10", axis: "venous-tone", modelPathId: "developer-only-lv-land-v0", targetTBVMl: 5600, paramPatch: { venousTone: 0.10 } },
  { id: "land-venous-tone-0p12", label: "Land venous tone 0.12", axis: "venous-tone", modelPathId: "developer-only-lv-land-v0", targetTBVMl: 5600, paramPatch: { venousTone: 0.12 } },
  { id: "land-venous-tone-0p18", label: "Land venous tone 0.18", axis: "venous-tone", modelPathId: "developer-only-lv-land-v0", targetTBVMl: 5600, paramPatch: { venousTone: 0.18 } },
  { id: "land-lv-bpas-0p95", label: "Land LV bPas 0.95x", axis: "lv-passive-stiffness-proxy", modelPathId: "developer-only-lv-land-v0", targetTBVMl: 5600, paramPatch: lvBPasPatch(0.95) },
  { id: "land-lv-bpas-0p90", label: "Land LV bPas 0.90x", axis: "lv-passive-stiffness-proxy", modelPathId: "developer-only-lv-land-v0", targetTBVMl: 5600, paramPatch: lvBPasPatch(0.90) },
  { id: "land-lv-bpas-0p85", label: "Land LV bPas 0.85x", axis: "lv-passive-stiffness-proxy", modelPathId: "developer-only-lv-land-v0", targetTBVMl: 5600, paramPatch: lvBPasPatch(0.85) },
  { id: "land-lv-geom-0p95", label: "Land LV geometry scale 0.95x", axis: "lv-geometry-scale", modelPathId: "developer-only-lv-land-v0", targetTBVMl: 5600, paramPatch: { lvGeomScale: 0.95 } },
  { id: "land-lv-geom-1p05", label: "Land LV geometry scale 1.05x", axis: "lv-geometry-scale", modelPathId: "developer-only-lv-land-v0", targetTBVMl: 5600, paramPatch: { lvGeomScale: 1.05 } },
  { id: "land-ca-release-0p90", label: "Land Ca release scale 0.90x", axis: "source-calcium-scale-diagnostic", modelPathId: "developer-only-lv-land-v0", targetTBVMl: 5600, paramPatch: { caReleaseScale: 0.90 } },
  { id: "land-ca-release-1p10", label: "Land Ca release scale 1.10x", axis: "source-calcium-scale-diagnostic", modelPathId: "developer-only-lv-land-v0", targetTBVMl: 5600, paramPatch: { caReleaseScale: 1.10 } },
  { id: "land-pericardium-off", label: "Land pericardium off", axis: "extrinsic-constraint-proxy", modelPathId: "developer-only-lv-land-v0", targetTBVMl: 5600, paramPatch: { pericardiumEnabled: false } },
] as const satisfies readonly ProbeDefinition[];

type ModelPathId = "stock-active-no-provider-v0" | "developer-only-lv-land-v0";
type ProbeAxis =
  | "reference-stock"
  | "reference-land"
  | "preload-tbv"
  | "venous-tone"
  | "lv-passive-stiffness-proxy"
  | "lv-geometry-scale"
  | "source-calcium-scale-diagnostic"
  | "extrinsic-constraint-proxy";

type ProbeDefinition = {
  readonly id: string;
  readonly label: string;
  readonly axis: ProbeAxis;
  readonly modelPathId: ModelPathId;
  readonly targetTBVMl: number;
  readonly paramPatch: Partial<CoreRuntimeParams>;
};

type NormalFloorObserved = {
  readonly CO_L: number | null;
  readonly AoPMean: number | null;
  readonly EF_LApprox: number | null;
  readonly EDV_L: number | null;
  readonly ESV_L: number | null;
  readonly LVEDPApprox: number | null;
  readonly SV_L: number | null;
  readonly RAPMean: number | null;
  readonly LAPMean: number | null;
  readonly Pmsf: number | null;
  readonly vrGradient: number | null;
};

export type LandNormalFloorLvedpAttributionPhase5AIRun = {
  readonly id: string;
  readonly label: string;
  readonly axis: ProbeAxis;
  readonly modelPathId: ModelPathId;
  readonly targetTBVMl: number;
  readonly paramPatch: Partial<CoreRuntimeParams>;
  readonly status: "measured" | "error";
  readonly settled: boolean;
  readonly settleReason: string | null;
  readonly settleBeats: number | null;
  readonly settleActualSeconds: number | null;
  readonly projectorQuiet: boolean | null;
  readonly health: Pick<
    SimulationHealth,
    | "status"
    | "periodBeats"
    | "tbvDriftMl"
    | "leftRightFlowMismatchLMin"
    | "cycleMetricDelta"
    | "clampHitCount"
    | "numericalStability"
    | "massConservation"
    | "flowBalance"
    | "physiologicalRange"
    | "messages"
  > | null;
  readonly observed: NormalFloorObserved;
  readonly floorFailures: readonly string[];
  readonly lvedpResolved: boolean;
  readonly outputPreservedVsLandBaseline: boolean | null;
  readonly classification:
    | "reference-stock"
    | "reference-land-blocked-by-lvedp"
    | "lvedp-resolved-output-preserved-diagnostic-only"
    | "lvedp-resolved-output-cost-diagnostic-only"
    | "lvedp-unresolved-diagnostic-only"
    | "uninterpretable-health-or-settle";
  readonly comparisonVsLandBaseline: {
    readonly LVEDPDeltaMmHg: number | null;
    readonly LVEDPReductionMmHg: number | null;
    readonly CO_LRatio: number | null;
    readonly SV_LRatio: number | null;
    readonly EF_LDelta: number | null;
    readonly EDV_LDeltaMl: number | null;
    readonly AoPMeanDeltaMmHg: number | null;
  };
  readonly providerInstrumentation: {
    readonly sourceProviderId: string | null;
    readonly sourceActiveStressCallCount: number;
    readonly commitProviderStateAfterStepCount: number;
    readonly landSolveFailureCount: number;
    readonly landSolveOkCount: number;
    readonly maxSolverResidualNorm: number;
  } | null;
  readonly errorMessage: string | null;
};

export type LandNormalFloorLvedpAttributionPhase5AIAxisSummary = {
  readonly axis: ProbeAxis;
  readonly runCount: number;
  readonly measuredCount: number;
  readonly lvedpResolvedCount: number;
  readonly outputPreservedResolvedCount: number;
  readonly minLVEDPApprox: number | null;
  readonly bestRunId: string | null;
  readonly interpretation: string;
};

export type LandNormalFloorLvedpAttributionPhase5AIEvidence = {
  readonly schemaVersion: 1;
  readonly id: typeof LAND_NORMAL_FLOOR_LVEDP_ATTRIBUTION_PHASE5AI_ID;
  readonly phase: "Phase 5AI";
  readonly claimBoundary: "land-normal-floor-lvedp-attribution-diagnostic-only";
  readonly upstreamPhase5XArtifactId: typeof phase5XArtifact.id;
  readonly upstreamPhase5XArtifactHash: string;
  readonly upstreamPhase5AHArtifactId: typeof phase5AHArtifact.id;
  readonly upstreamPhase5AHArtifactHash: string;
  readonly verifierScript: typeof VERIFIER_SCRIPT;
  readonly protocol: {
    readonly measurementMode: "independent-normal-floor-single-axis-probes-v1";
    readonly targetBaselineTBVMl: typeof NORMAL_TARGET_TBV_ML;
    readonly measureOptions: typeof MEASURE_OPTIONS;
    readonly floorThresholds: typeof FLOOR_THRESHOLDS;
    readonly outputPreservedRatioRange: readonly [typeof OUTPUT_RATIO_MIN, typeof OUTPUT_RATIO_MAX];
    readonly probeCount: number;
    readonly probes: readonly Pick<ProbeDefinition, "id" | "axis" | "modelPathId" | "targetTBVMl" | "paramPatch">[];
    readonly sourceProviderScope: "LV-only";
    readonly calciumMappingScenario: "phase2b-absolute-peak-ca";
  };
  readonly runs: readonly LandNormalFloorLvedpAttributionPhase5AIRun[];
  readonly axisSummaries: readonly LandNormalFloorLvedpAttributionPhase5AIAxisSummary[];
  readonly summary: {
    readonly stockBaselineLVEDPApprox: number | null;
    readonly landBaselineLVEDPApprox: number | null;
    readonly landBaselineLVEDPExcessMmHg: number | null;
    readonly landBaselineOtherFloorFailures: readonly string[];
    readonly measuredRunCount: number;
    readonly lvedpResolvedOutputPreservedRunIds: readonly string[];
    readonly smallestPreloadReductionResolvedRunId: string | null;
    readonly passiveProxyResolvedRunIds: readonly string[];
    readonly sourceCalciumResolvedRunIds: readonly string[];
    readonly defaultFlipBlockerStatus:
      | "bounded-small-lvedp-excess-diagnostic-only"
      | "unresolved-lvedp-blocker"
      | "uninterpretable";
    readonly currentInterpretation: string;
    readonly recommendedNext: readonly string[];
    readonly limitations: readonly string[];
  };
  readonly boundary: {
    readonly noRuntimeDefaultFlip: true;
    readonly noLegacyActiveStressDeletion: true;
    readonly noOfficialCaseReauthoring: true;
    readonly noWorkbenchRuntimeWiring: true;
    readonly noStateSchemaMigration: true;
    readonly noProductionRegistryIntegration: true;
    readonly noPerCaseTuning: true;
    readonly noAcceptedPreloadTuning: true;
    readonly noAcceptedVenousToneTuning: true;
    readonly noAcceptedPassiveTuning: true;
    readonly noAcceptedGeometryTuning: true;
    readonly noAcceptedSourceCalciumScaling: true;
    readonly noTrefFudge: true;
    readonly noLandParameterTuning: true;
    readonly noQDotTuning: true;
    readonly noValveTuning: true;
    readonly noSourceStressScaling: true;
    readonly noOfficialMorphologyAcceptance: true;
    readonly noClinicalScientificValidationClaim: true;
  };
  readonly doesNotUnlock: readonly string[];
  readonly normalizedSha256: string;
};

export function buildLandNormalFloorLvedpAttributionPhase5AIEvidence():
LandNormalFloorLvedpAttributionPhase5AIEvidence {
  const measuredRunsWithoutClassification = PROBES.map(runProbe);
  const landBaseline = measuredRunsWithoutClassification.find((run) => run.id === "land-current-normal") ?? null;
  const runs = measuredRunsWithoutClassification.map((run) => classifyRun(run, landBaseline));
  const axisSummaries = buildAxisSummaries(runs);
  const stockBaseline = runs.find((run) => run.id === "stock-current-normal") ?? null;
  const resolvedOutputPreserved = runs.filter((run) =>
    run.classification === "lvedp-resolved-output-preserved-diagnostic-only"
  );
  const smallestPreloadReductionResolved = resolvedOutputPreserved
    .filter((run) => run.axis === "preload-tbv")
    .sort((a, b) => b.targetTBVMl - a.targetTBVMl)[0] ?? null;
  const landBaselineLVEDP = landBaseline?.observed.LVEDPApprox ?? null;
  const evidenceWithoutHash: Omit<LandNormalFloorLvedpAttributionPhase5AIEvidence, "normalizedSha256"> = {
    schemaVersion: 1 as const,
    id: LAND_NORMAL_FLOOR_LVEDP_ATTRIBUTION_PHASE5AI_ID,
    phase: "Phase 5AI" as const,
    claimBoundary: "land-normal-floor-lvedp-attribution-diagnostic-only" as const,
    upstreamPhase5XArtifactId: phase5XArtifact.id,
    upstreamPhase5XArtifactHash: artifactHash(phase5XArtifact),
    upstreamPhase5AHArtifactId: phase5AHArtifact.id,
    upstreamPhase5AHArtifactHash: artifactHash(phase5AHArtifact),
    verifierScript: VERIFIER_SCRIPT,
    protocol: {
      measurementMode: "independent-normal-floor-single-axis-probes-v1" as const,
      targetBaselineTBVMl: NORMAL_TARGET_TBV_ML,
      measureOptions: MEASURE_OPTIONS,
      floorThresholds: FLOOR_THRESHOLDS,
      outputPreservedRatioRange: [OUTPUT_RATIO_MIN, OUTPUT_RATIO_MAX],
      probeCount: PROBES.length,
      probes: PROBES.map(({ id, axis, modelPathId, targetTBVMl, paramPatch }) => ({
        id,
        axis,
        modelPathId,
        targetTBVMl,
        paramPatch,
      })),
      sourceProviderScope: "LV-only" as const,
      calciumMappingScenario: "phase2b-absolute-peak-ca" as const,
    },
    runs,
    axisSummaries,
    summary: {
      stockBaselineLVEDPApprox: stockBaseline?.observed.LVEDPApprox ?? null,
      landBaselineLVEDPApprox: landBaselineLVEDP,
      landBaselineLVEDPExcessMmHg: landBaselineLVEDP == null ? null : round(landBaselineLVEDP - FLOOR_THRESHOLDS.LVEDPApprox.max),
      landBaselineOtherFloorFailures: landBaseline?.floorFailures.filter((failure) => failure !== "LVEDPApprox") ?? [],
      measuredRunCount: runs.filter((run) => run.status === "measured").length,
      lvedpResolvedOutputPreservedRunIds: resolvedOutputPreserved.map((run) => run.id),
      smallestPreloadReductionResolvedRunId: smallestPreloadReductionResolved?.id ?? null,
      passiveProxyResolvedRunIds: resolvedOutputPreserved
        .filter((run) => run.axis === "lv-passive-stiffness-proxy")
        .map((run) => run.id),
      sourceCalciumResolvedRunIds: resolvedOutputPreserved
        .filter((run) => run.axis === "source-calcium-scale-diagnostic")
        .map((run) => run.id),
      defaultFlipBlockerStatus: blockerStatus(landBaseline, resolvedOutputPreserved),
      currentInterpretation: interpretation(landBaseline, resolvedOutputPreserved, smallestPreloadReductionResolved),
      recommendedNext: [
        "treat normal-floor LVEDP as bounded small-excess diagnostic evidence, not as a reason to tune Tref or Land parameters",
        "if owner accepts this bounded blocker, draft the user-0 LV Land default-flip RFC with frozen legacy rollback and no root/Zc or atrial gating",
        "if owner wants a numerical correction first, prefer a separate explicit passive/geometry calibration PR over hidden preload, venous-tone, or source-scale tuning",
        "keep official cases at smoke/teaching-surface level until the default path and atrial/arterial closures stabilize",
      ],
      limitations: [
        "Single-axis probes are diagnostic perturbations, not accepted parameter changes.",
        "The current production closure does not expose independent homogenization or reference-stretch controls; those are not inferred by proxy.",
        "Source-calcium scale probes are reported only to test sensitivity and do not authorize source-stress scaling.",
        "This phase does not modify runtime defaults, official cases, qDot clamps, valves, root/Zc, or Land parameters.",
      ],
    },
    boundary: boundary(),
    doesNotUnlock: doesNotUnlock(),
  };
  return {
    ...evidenceWithoutHash,
    normalizedSha256: hashStable(evidenceWithoutHash),
  };
}

function runProbe(probe: ProbeDefinition): Omit<LandNormalFloorLvedpAttributionPhase5AIRun, "classification" | "comparisonVsLandBaseline" | "outputPreservedVsLandBaseline"> {
  const instrumentation =
    probe.modelPathId === "developer-only-lv-land-v0"
      ? createModelCoreLand2017LvSourceProviderInstrumentation()
      : null;
  const flag = instrumentation
    ? createMyocardiumDeveloperOnlyLvLandRuntimeFlagOptions({
      acknowledgement: MYOCARDIUM_DEVELOPER_ONLY_LV_LAND_RUNTIME_FLAG_ACKNOWLEDGEMENT,
      instrumentation,
    })
    : null;
  try {
    const measurement = measureConverged(paramsForProbe(probe), {
      ...MEASURE_OPTIONS,
      targetTBV: probe.targetTBVMl,
      ...(flag ? { experimentalOptions: flag.experimentalOptions } : {}),
    });
    const observed = observedFromMeasurement(measurement.samples, measurement.metrics);
    return {
      id: probe.id,
      label: probe.label,
      axis: probe.axis,
      modelPathId: probe.modelPathId,
      targetTBVMl: probe.targetTBVMl,
      paramPatch: probe.paramPatch,
      status: "measured",
      settled: true,
      settleReason: measurement.settleStatus.reason,
      settleBeats: measurement.settleStatus.beats,
      settleActualSeconds: finiteOrNull(measurement.settleStatus.actualSeconds),
      projectorQuiet: measurement.projectorQuiet,
      health: compactHealth(measurement.health),
      observed,
      floorFailures: floorFailures(observed),
      lvedpResolved: lvedpResolved(observed),
      providerInstrumentation: flag && instrumentation ? {
        sourceProviderId: flag.sourceProviderId,
        sourceActiveStressCallCount: instrumentation.sourceActiveStressPa,
        commitProviderStateAfterStepCount: instrumentation.commitProviderStateAfterStep,
        landSolveFailureCount: instrumentation.landSolveFailureCount,
        landSolveOkCount: instrumentation.landSolveOkCount,
        maxSolverResidualNorm: finiteOrNull(instrumentation.maxSolverResidualNorm) ?? 0,
      } : null,
      errorMessage: null,
    };
  } catch (error) {
    return {
      id: probe.id,
      label: probe.label,
      axis: probe.axis,
      modelPathId: probe.modelPathId,
      targetTBVMl: probe.targetTBVMl,
      paramPatch: probe.paramPatch,
      status: "error",
      settled: false,
      settleReason: null,
      settleBeats: null,
      settleActualSeconds: null,
      projectorQuiet: null,
      health: null,
      observed: emptyObserved(),
      floorFailures: ["measurement-error"],
      lvedpResolved: false,
      providerInstrumentation: flag && instrumentation ? {
        sourceProviderId: flag.sourceProviderId,
        sourceActiveStressCallCount: instrumentation.sourceActiveStressPa,
        commitProviderStateAfterStepCount: instrumentation.commitProviderStateAfterStep,
        landSolveFailureCount: instrumentation.landSolveFailureCount,
        landSolveOkCount: instrumentation.landSolveOkCount,
        maxSolverResidualNorm: finiteOrNull(instrumentation.maxSolverResidualNorm) ?? 0,
      } : null,
      errorMessage: (error as Error).message,
    };
  }
}

function classifyRun(
  run: Omit<LandNormalFloorLvedpAttributionPhase5AIRun, "classification" | "comparisonVsLandBaseline" | "outputPreservedVsLandBaseline">,
  landBaseline: Omit<LandNormalFloorLvedpAttributionPhase5AIRun, "classification" | "comparisonVsLandBaseline" | "outputPreservedVsLandBaseline"> | null,
): LandNormalFloorLvedpAttributionPhase5AIRun {
  const comparison = comparisonVsBaseline(run, landBaseline);
  const outputPreserved = outputPreservedVsBaseline(comparison);
  const classification: LandNormalFloorLvedpAttributionPhase5AIRun["classification"] =
    run.id === "stock-current-normal"
      ? "reference-stock"
      : run.id === "land-current-normal"
        ? "reference-land-blocked-by-lvedp"
        : !isRunInterpretable(run)
          ? "uninterpretable-health-or-settle"
          : run.lvedpResolved && outputPreserved
            ? "lvedp-resolved-output-preserved-diagnostic-only"
            : run.lvedpResolved
              ? "lvedp-resolved-output-cost-diagnostic-only"
              : "lvedp-unresolved-diagnostic-only";
  return {
    ...run,
    outputPreservedVsLandBaseline: run.id === "land-current-normal" ? true : outputPreserved,
    classification,
    comparisonVsLandBaseline: comparison,
  };
}

function paramsForProbe(probe: ProbeDefinition): CoreRuntimeParams {
  return {
    ...defaultParams(),
    ...probe.paramPatch,
  };
}

function lvBPasPatch(scale: number): Partial<CoreRuntimeParams> {
  return {
    nodeOverrides: {
      LV: { active: { bPas: round(defaultActiveLV.bPas * scale) } },
    },
  };
}

function observedFromMeasurement(
  samples: readonly { readonly VLV: number }[],
  metrics: { readonly CO_L: number; readonly AoPMean: number; readonly EF_LApprox: number; readonly LVEDPApprox: number; readonly SV_L: number; readonly RAPMean: number; readonly LAPMean: number; readonly Pmsf: number; readonly vrGradient: number },
): NormalFloorObserved {
  const volumes = samples.map((sample) => sample.VLV).filter(Number.isFinite);
  return {
    CO_L: finiteOrNull(metrics.CO_L),
    AoPMean: finiteOrNull(metrics.AoPMean),
    EF_LApprox: finiteOrNull(metrics.EF_LApprox),
    EDV_L: finiteOrNull(volumes.length > 0 ? Math.max(...volumes) : null),
    ESV_L: finiteOrNull(volumes.length > 0 ? Math.min(...volumes) : null),
    LVEDPApprox: finiteOrNull(metrics.LVEDPApprox),
    SV_L: finiteOrNull(metrics.SV_L),
    RAPMean: finiteOrNull(metrics.RAPMean),
    LAPMean: finiteOrNull(metrics.LAPMean),
    Pmsf: finiteOrNull(metrics.Pmsf),
    vrGradient: finiteOrNull(metrics.vrGradient),
  };
}

function floorFailures(observed: NormalFloorObserved): readonly string[] {
  const fields = ["CO_L", "AoPMean", "EF_LApprox", "EDV_L", "ESV_L", "LVEDPApprox"] as const;
  return fields.filter((field) => {
    const value = observed[field];
    const threshold = FLOOR_THRESHOLDS[field];
    return value == null || value < threshold.min || value > threshold.max;
  });
}

function lvedpResolved(observed: NormalFloorObserved): boolean {
  return observed.LVEDPApprox != null
    && observed.LVEDPApprox >= FLOOR_THRESHOLDS.LVEDPApprox.min
    && observed.LVEDPApprox <= FLOOR_THRESHOLDS.LVEDPApprox.max;
}

function isRunInterpretable(run: Pick<LandNormalFloorLvedpAttributionPhase5AIRun, "status" | "settled" | "health">): boolean {
  return run.status === "measured" && run.settled && run.health?.status === "ok";
}

function comparisonVsBaseline(
  run: Pick<LandNormalFloorLvedpAttributionPhase5AIRun, "observed">,
  baseline: Pick<LandNormalFloorLvedpAttributionPhase5AIRun, "observed"> | null,
): LandNormalFloorLvedpAttributionPhase5AIRun["comparisonVsLandBaseline"] {
  const base = baseline?.observed ?? null;
  return {
    LVEDPDeltaMmHg: delta(run.observed.LVEDPApprox, base?.LVEDPApprox ?? null),
    LVEDPReductionMmHg: delta(base?.LVEDPApprox ?? null, run.observed.LVEDPApprox),
    CO_LRatio: ratio(run.observed.CO_L, base?.CO_L ?? null),
    SV_LRatio: ratio(run.observed.SV_L, base?.SV_L ?? null),
    EF_LDelta: delta(run.observed.EF_LApprox, base?.EF_LApprox ?? null),
    EDV_LDeltaMl: delta(run.observed.EDV_L, base?.EDV_L ?? null),
    AoPMeanDeltaMmHg: delta(run.observed.AoPMean, base?.AoPMean ?? null),
  };
}

function outputPreservedVsBaseline(
  comparison: LandNormalFloorLvedpAttributionPhase5AIRun["comparisonVsLandBaseline"],
): boolean {
  return inRange(comparison.CO_LRatio, OUTPUT_RATIO_MIN, OUTPUT_RATIO_MAX)
    && inRange(comparison.SV_LRatio, OUTPUT_RATIO_MIN, OUTPUT_RATIO_MAX)
    && comparison.EF_LDelta != null
    && Math.abs(comparison.EF_LDelta) <= 0.08
    && comparison.AoPMeanDeltaMmHg != null
    && Math.abs(comparison.AoPMeanDeltaMmHg) <= 10;
}

function buildAxisSummaries(
  runs: readonly LandNormalFloorLvedpAttributionPhase5AIRun[],
): readonly LandNormalFloorLvedpAttributionPhase5AIAxisSummary[] {
  const axes = [...new Set(runs.map((run) => run.axis))] as ProbeAxis[];
  return axes.map((axis) => {
    const axisRuns = runs.filter((run) => run.axis === axis);
    const measured = axisRuns.filter((run) => run.status === "measured");
    const lvedpResolvedRuns = measured.filter((run) => run.lvedpResolved);
    const outputPreservedResolved = lvedpResolvedRuns.filter((run) =>
      run.classification === "lvedp-resolved-output-preserved-diagnostic-only"
    );
    const best = measured
      .filter((run) => run.observed.LVEDPApprox != null)
      .sort((a, b) => a.observed.LVEDPApprox! - b.observed.LVEDPApprox!)[0] ?? null;
    return {
      axis,
      runCount: axisRuns.length,
      measuredCount: measured.length,
      lvedpResolvedCount: lvedpResolvedRuns.length,
      outputPreservedResolvedCount: outputPreservedResolved.length,
      minLVEDPApprox: best?.observed.LVEDPApprox ?? null,
      bestRunId: best?.id ?? null,
      interpretation: axisInterpretation(axis, outputPreservedResolved, best),
    };
  });
}

function axisInterpretation(
  axis: ProbeAxis,
  outputPreservedResolved: readonly LandNormalFloorLvedpAttributionPhase5AIRun[],
  best: LandNormalFloorLvedpAttributionPhase5AIRun | null,
): string {
  if (axis === "reference-stock") return "Stock current closure is a reference only.";
  if (axis === "reference-land") return "Land current closure defines the normal-floor LVEDP blocker.";
  if (outputPreservedResolved.length > 0) {
    return `${axis} has output-preserved diagnostic runs that bring LVEDP within the Phase 5X normal-floor range.`;
  }
  if (best?.observed.LVEDPApprox != null) {
    return `${axis} changes LVEDP but does not produce an output-preserved resolved diagnostic run.`;
  }
  return `${axis} was uninterpretable in this diagnostic.`;
}

function blockerStatus(
  landBaseline: Pick<LandNormalFloorLvedpAttributionPhase5AIRun, "observed" | "health" | "status"> | null,
  resolvedOutputPreserved: readonly LandNormalFloorLvedpAttributionPhase5AIRun[],
): LandNormalFloorLvedpAttributionPhase5AIEvidence["summary"]["defaultFlipBlockerStatus"] {
  if (!landBaseline || landBaseline.status !== "measured" || landBaseline.health?.status !== "ok") return "uninterpretable";
  const excess = landBaseline.observed.LVEDPApprox == null
    ? Infinity
    : landBaseline.observed.LVEDPApprox - FLOOR_THRESHOLDS.LVEDPApprox.max;
  if (excess <= 2 && resolvedOutputPreserved.length > 0) return "bounded-small-lvedp-excess-diagnostic-only";
  return "unresolved-lvedp-blocker";
}

function interpretation(
  landBaseline: Pick<LandNormalFloorLvedpAttributionPhase5AIRun, "observed" | "floorFailures"> | null,
  resolvedOutputPreserved: readonly LandNormalFloorLvedpAttributionPhase5AIRun[],
  smallestPreloadReductionResolved: LandNormalFloorLvedpAttributionPhase5AIRun | null,
): string {
  const lvedp = landBaseline?.observed.LVEDPApprox ?? null;
  const excess = lvedp == null ? null : round(lvedp - FLOOR_THRESHOLDS.LVEDPApprox.max);
  const resolvedIds = resolvedOutputPreserved.map((run) => run.id).join(", ") || "none";
  return `Phase 5AI measures Land normal-floor LVEDP as ${formatNumber(lvedp)} mmHg, ${formatNumber(excess)} mmHg above the Phase 5X floor, with other floor failures ${landBaseline?.floorFailures.filter((failure) => failure !== "LVEDPApprox").join(", ") || "none"}. Output-preserved diagnostic runs resolving LVEDP are: ${resolvedIds}. The smallest preload-axis resolving run is ${smallestPreloadReductionResolved?.id ?? "none"}. Treat this as bounded attribution only, not accepted preload/passive/geometry/source scaling or default flip.`;
}

function compactHealth(health: SimulationHealth): NonNullable<LandNormalFloorLvedpAttributionPhase5AIRun["health"]> {
  return {
    status: health.status,
    ...(health.periodBeats != null ? { periodBeats: health.periodBeats } : {}),
    tbvDriftMl: round(health.tbvDriftMl),
    leftRightFlowMismatchLMin: round(health.leftRightFlowMismatchLMin),
    cycleMetricDelta: round(health.cycleMetricDelta),
    clampHitCount: health.clampHitCount,
    numericalStability: health.numericalStability,
    massConservation: health.massConservation,
    flowBalance: health.flowBalance,
    physiologicalRange: health.physiologicalRange,
    messages: health.messages,
  };
}

function emptyObserved(): NormalFloorObserved {
  return {
    CO_L: null,
    AoPMean: null,
    EF_LApprox: null,
    EDV_L: null,
    ESV_L: null,
    LVEDPApprox: null,
    SV_L: null,
    RAPMean: null,
    LAPMean: null,
    Pmsf: null,
    vrGradient: null,
  };
}

function boundary(): LandNormalFloorLvedpAttributionPhase5AIEvidence["boundary"] {
  return {
    noRuntimeDefaultFlip: true,
    noLegacyActiveStressDeletion: true,
    noOfficialCaseReauthoring: true,
    noWorkbenchRuntimeWiring: true,
    noStateSchemaMigration: true,
    noProductionRegistryIntegration: true,
    noPerCaseTuning: true,
    noAcceptedPreloadTuning: true,
    noAcceptedVenousToneTuning: true,
    noAcceptedPassiveTuning: true,
    noAcceptedGeometryTuning: true,
    noAcceptedSourceCalciumScaling: true,
    noTrefFudge: true,
    noLandParameterTuning: true,
    noQDotTuning: true,
    noValveTuning: true,
    noSourceStressScaling: true,
    noOfficialMorphologyAcceptance: true,
    noClinicalScientificValidationClaim: true,
  };
}

function doesNotUnlock(): readonly string[] {
  return [
    "runtimeDefaultFlip",
    "legacyActiveStressDeletion",
    "officialCaseWiring",
    "officialCaseReauthoring",
    "workbenchRuntimeWiring",
    "stateSchemaMigration",
    "productionRegistryIntegration",
    "perCaseTuning",
    "acceptedPreloadTuning",
    "acceptedVenousToneTuning",
    "acceptedPassiveTuning",
    "acceptedGeometryTuning",
    "acceptedSourceCalciumScaling",
    "TrefFudge",
    "LandParameterTuning",
    "qDotTuning",
    "valveTuning",
    "sourceStressScaling",
    "officialMorphologyAcceptance",
    "clinicalScientificValidationClaim",
  ];
}

function inRange(value: number | null, min: number, max: number): boolean {
  return value != null && value >= min && value <= max;
}

function ratio(left: number | null, right: number | null): number | null {
  if (left == null || right == null || Math.abs(right) < 1e-9) return null;
  return round(left / right);
}

function delta(left: number | null, right: number | null): number | null {
  return left == null || right == null ? null : round(left - right);
}

function finiteOrNull(value: number | null | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) ? round(value) : null;
}

function formatNumber(value: number | null): string {
  return value == null ? "missing" : value.toFixed(6);
}

function round(value: number): number {
  if (!Number.isFinite(value)) return value;
  return Math.round(value * 1_000_000) / 1_000_000;
}

function hashStable(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(stable(value))).digest("hex");
}

function artifactHash(value: unknown): string {
  if (!value || typeof value !== "object" || Array.isArray(value)) return hashStable(value);
  const { normalizedSha256: _normalizedSha256, ...withoutHash } = value as Record<string, unknown>;
  return hashStable(withoutHash);
}

function stable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== "object") return value;
  const object = value as Record<string, unknown>;
  return Object.fromEntries(Object.keys(object).sort().map((key) => [key, stable(object[key])]));
}

function main(): void {
  const evidence = buildLandNormalFloorLvedpAttributionPhase5AIEvidence();
  const outPath = path.resolve(process.cwd(), LAND_NORMAL_FLOOR_LVEDP_ATTRIBUTION_PHASE5AI_RESULT_PATH);
  mkdirSync(path.dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(evidence, null, 2)}\n`);
  console.log(
    `Wrote ${LAND_NORMAL_FLOOR_LVEDP_ATTRIBUTION_PHASE5AI_RESULT_PATH} `
    + `runs=${evidence.runs.length} `
    + `landLVEDP=${evidence.summary.landBaselineLVEDPApprox} `
    + `resolved=${evidence.summary.lvedpResolvedOutputPreservedRunIds.length}`,
  );
}

function isDirectExecution(): boolean {
  const entrypoint = process.argv[1];
  if (entrypoint && import.meta.url === pathToFileURL(path.resolve(entrypoint)).href) return true;
  const normalizedScriptPath = path.normalize("tools/myocardium/buildLandNormalFloorLvedpAttributionPhase5AI.ts");
  return process.argv.some((arg) => path.normalize(arg).endsWith(normalizedScriptPath));
}

if (isDirectExecution()) {
  main();
}
