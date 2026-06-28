import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import phase5VArtifact from "@/data/myocardium/protocols/myocardium-developer-only-lv-land-runtime-flag-suite-result-v1.json";
import { ModelCore, defaultParams, type ModelCoreExperimentalOptions } from "@/engine/ModelCore";
import type { CoreRuntimeParams, SimMetrics, SimSample, SimulationHealth } from "@/engine/protocol";
import { DEFAULT_SETTLE_POLICY, type SettlePolicy, type SettleStatus } from "@/engine/settling";
import { measureSteady, type SteadyMeasurement } from "@/engine/measure";
import {
  MYOCARDIUM_DEVELOPER_ONLY_LV_LAND_RUNTIME_FLAG_ACKNOWLEDGEMENT,
  createMyocardiumDeveloperOnlyLvLandRuntimeFlagOptions,
} from "@/tools/myocardium/modelCoreDeveloperOnlyLandRuntimeFlag";
import {
  createModelCoreLand2017LvSourceProviderInstrumentation,
  type ModelCoreLand2017LvSourceProviderInstrumentation,
} from "@/tools/myocardium/modelCoreLand2017LvSourceProvider";

export const MYOCARDIUM_DEVELOPER_ONLY_LV_LAND_ENVELOPE_PHASE5W_ID =
  "myocardium-developer-only-lv-land-envelope-phase5w-result-v1";

export const MYOCARDIUM_DEVELOPER_ONLY_LV_LAND_ENVELOPE_PHASE5W_RESULT_PATH =
  "data/myocardium/protocols/myocardium-developer-only-lv-land-envelope-phase5w-result-v1.json";

type ModelPathId = "stock-active-no-provider-v0" | "developer-only-lv-land-v0";
type DomainRole = "low-preload-edge" | "main-domain";
type WindowKind = "settled-measure-window" | "cap-tail-window";
type ValveId = "MV" | "AoV" | "TV" | "PV";

export type DeveloperOnlyLvLandEnvelopePoint = {
  readonly id: string;
  readonly HR: 75 | 90;
  readonly targetTBVMl: 4350 | 5600 | 6600;
  readonly domainRole: DomainRole;
};

export type DeveloperOnlyLvLandEnvelopeRun = {
  readonly protocolId: "phase5w-developer-only-lv-land-envelope-v1";
  readonly pointId: string;
  readonly modelPathId: ModelPathId;
  readonly sourceProviderId: string | null;
  readonly experimentalActiveSourceProvider: boolean;
  readonly closureInvariant: DeveloperOnlyLvLandEnvelopeClosureInvariant;
  readonly HR: number;
  readonly targetTBVMl: number;
  readonly domainRole: DomainRole;
  readonly settled: boolean;
  readonly settleReason: string;
  readonly settleActualSeconds: number | null;
  readonly settleBeats: number;
  readonly periodBeats: number;
  readonly adjacentDelta: number | null;
  readonly periodDelta: number | null;
  readonly worstSignal: string | null;
  readonly worstDelta: number | null;
  readonly healthStatus: string;
  readonly healthMessages: readonly string[];
  readonly clampHitCount: number;
  readonly leftRightFlowMismatchLMin: number | null;
  readonly cycleMetricDelta: number | null;
  readonly metrics: DeveloperOnlyLvLandEnvelopeMetrics;
  readonly window: DeveloperOnlyLvLandEnvelopeWindow;
  readonly terminalActiveStress: DeveloperOnlyLvLandEnvelopeActiveStress;
  readonly providerInstrumentation: DeveloperOnlyLvLandEnvelopeProviderInstrumentation | null;
};

export type DeveloperOnlyLvLandEnvelopeMetrics = {
  readonly CO_L: number | null;
  readonly CO_R: number | null;
  readonly SV_L: number | null;
  readonly SV_R: number | null;
  readonly AoPMean: number | null;
  readonly AoPSys: number | null;
  readonly AoPDia: number | null;
  readonly PAPMean: number | null;
  readonly LAPMean: number | null;
  readonly RAPMean: number | null;
  readonly LVEDPApprox: number | null;
  readonly RVEDPApprox: number | null;
  readonly EF_LApprox: number | null;
  readonly EF_RApprox: number | null;
  readonly AoVForwardVolumeMl: number | null;
  readonly AoVReverseVolumeMl: number | null;
  readonly MVForwardVolumeMl: number | null;
  readonly MVReverseVolumeMl: number | null;
};

export type DeveloperOnlyLvLandEnvelopeClosureInvariant = {
  readonly heartModel: "activeStress";
  readonly HR: number;
  readonly targetTBVMl: number;
  readonly dtSec: number;
  readonly settleSampleHz: number;
  readonly measurementSampleHz: number;
  readonly independentInitialization: true;
  readonly noWarmStart: true;
  readonly noQDotTuning: true;
  readonly noValveTuning: true;
  readonly noAfterloadTuning: true;
  readonly noPreloadTuning: true;
  readonly noLandParameterTuning: true;
  readonly noSourceStressScaling: true;
};

export type DeveloperOnlyLvLandEnvelopeWindow = {
  readonly kind: WindowKind;
  readonly measureBeats: number;
  readonly metricWindowBeats: 1 | 2;
  readonly sampleCount: number;
  readonly simulatedSeconds: number | null;
  readonly tbvStartMl: number | null;
  readonly tbvEndMl: number | null;
  readonly tbvDriftMl: number | null;
  readonly projectorQuiet: boolean | null;
  readonly LVPMax: number | null;
  readonly LVPMin: number | null;
  readonly AoPMax: number | null;
  readonly QAoPeakMlPerSec: number | null;
  readonly qAoCapRatioMax: number | null;
  readonly AoVQDotClampHitFraction: number | null;
  readonly AoVQDotRawAbsMaxMlPerS2: number | null;
  readonly valves: Record<ValveId, DeveloperOnlyLvLandEnvelopeValveWindow>;
  readonly filling: DeveloperOnlyLvLandEnvelopeFillingProxy;
};

export type DeveloperOnlyLvLandEnvelopeValveWindow = {
  readonly reverseVolumeMl: number | null;
  readonly diodeImpulseMax: number | null;
  readonly diodeHitFraction: number | null;
  readonly qDotClampHitFraction: number | null;
};

export type DeveloperOnlyLvLandEnvelopeFillingProxy = {
  readonly MV_A_forward_window_mL: number | null;
  readonly MV_E_forward_window_mL: number | null;
  readonly MV_A_forward_perBeat_mL: number | null;
  readonly MV_E_forward_perBeat_mL: number | null;
  readonly MV_A_fraction: number | null;
  readonly LA_loop_area: number | null;
  readonly fillingMorphologyClass: "E-only" | "E+A" | "weak-A" | "indeterminate";
};

export type DeveloperOnlyLvLandEnvelopeActiveStress = {
  readonly LV_sigmaActTargetPa: number | null;
  readonly LV_sigmaActPa: number | null;
  readonly LV_sigmaPasPa: number | null;
  readonly LV_c: number | null;
  readonly LV_a: number | null;
};

export type DeveloperOnlyLvLandEnvelopeProviderInstrumentation = {
  readonly sourceActiveStressCallCount: number;
  readonly debugActiveStressTermsCallCount: number;
  readonly commitProviderStateAfterStepCount: number;
  readonly landSolveFailureCount: number;
  readonly landSolveOkCount: number;
  readonly maxSolverResidualNorm: number;
  readonly sourcePathAuditSampleCount: number;
  readonly commitPathAuditSampleCount: number;
};

export type DeveloperOnlyLvLandEnvelopeComparison = {
  readonly pointId: string;
  readonly HR: number;
  readonly targetTBVMl: number;
  readonly domainRole: DomainRole;
  readonly stockSettled: boolean;
  readonly landSettled: boolean;
  readonly sameClosureInvariant: boolean;
  readonly bothHealthOk: boolean;
  readonly landSolveFailureCount: number;
  readonly landSourceAndCommitPresent: boolean;
  readonly landVsStock: {
    readonly CO_L_delta: number | null;
    readonly SV_L_delta: number | null;
    readonly LVPMax_delta: number | null;
    readonly AoPMean_delta: number | null;
    readonly QAoPeak_delta: number | null;
    readonly AoVQDotClampHitFraction_delta: number | null;
    readonly MV_A_fraction_delta: number | null;
  };
};

export type DeveloperOnlyLvLandEnvelopePhase5WEvidence = {
  readonly schemaVersion: 1;
  readonly id: typeof MYOCARDIUM_DEVELOPER_ONLY_LV_LAND_ENVELOPE_PHASE5W_ID;
  readonly phase: "Phase 5W";
  readonly claimBoundary: "developer-only-lv-land-envelope-expansion-diagnostic-only";
  readonly upstreamPhase5VArtifactId: typeof phase5VArtifact.id;
  readonly verifierScript: "verify:myocardium-developer-only-lv-land-envelope";
  readonly oracleDirectionSession: "direction-after-pr218-light";
  readonly protocol: {
    readonly matrixMode: "hr-preload-main-domain-envelope-v1";
    readonly modelPathIds: readonly ModelPathId[];
    readonly points: readonly DeveloperOnlyLvLandEnvelopePoint[];
    readonly dtSec: number;
    readonly settleSampleHz: number;
    readonly requestedMeasurementSampleHz: number;
    readonly measurementSampleHz: number;
    readonly capTailMeasurementSampleHz: number;
    readonly minimumMeasureBeats: number;
    readonly period2MeasureBeats: number;
    readonly settlePolicy: Pick<SettlePolicy, "tolPrimary" | "tolShape" | "consecutiveBeats" | "minBeats" | "capSeconds" | "postSettleBeats">;
    readonly pointInitialization: "independent-from-target-tbv-no-cross-point-warm-start";
    readonly sourceProviderScope: "LV-only";
    readonly calciumMappingScenario: "phase2b-absolute-peak-ca";
    readonly commitScheme: "BE";
  };
  readonly runHealth: {
    readonly runCount: number;
    readonly settledRunCount: number;
    readonly capRunCount: number;
    readonly healthOkRunCount: number;
    readonly mainDomainLandRunCount: number;
    readonly mainDomainLandSettledCount: number;
    readonly mainDomainLandHealthOkCount: number;
    readonly landSolveFailureCount: number;
    readonly landSourceCallsPresentEveryRun: boolean;
    readonly landCommitCallsPresentEveryRun: boolean;
    readonly mainDomainLandAllPeriod1: boolean;
  };
  readonly runs: readonly DeveloperOnlyLvLandEnvelopeRun[];
  readonly comparisons: readonly DeveloperOnlyLvLandEnvelopeComparison[];
  readonly summary: {
    readonly productionReplacementReadiness: "not-ready-diagnostic-envelope-only";
    readonly mainDomainSignal: "developer-only-envelope-recorded";
    readonly lowPreloadHandling: "report-only-edge-evidence";
    readonly morphologyHandling: "diagnostic-proxy-only-no-tuning";
    readonly recommendedNext: readonly string[];
  };
  readonly boundary: {
    readonly noRuntimeReplacement: true;
    readonly noOfficialCaseReauthoring: true;
    readonly noWorkbenchRuntimeWiring: true;
    readonly noStateSchemaMigration: true;
    readonly noRuntimeFlagUi: true;
    readonly noProductionRegistryIntegration: true;
    readonly noQDotTuning: true;
    readonly noValveTuning: true;
    readonly noAfterloadTuning: true;
    readonly noPreloadTuning: true;
    readonly noLandParameterTuning: true;
    readonly noSourceStressScaling: true;
    readonly noLevel3Acceptance: true;
    readonly noLevel4Acceptance: true;
    readonly noOfficialMorphologyAcceptance: true;
    readonly noFinalNoAlternansAcceptance: true;
    readonly noStructuralAlternansRemovalClaim: true;
  };
  readonly doesNotUnlock: readonly string[];
};

const DT_SEC = 0.001;
const SETTLE_SAMPLE_HZ = 240;
const REQUESTED_MEASUREMENT_SAMPLE_HZ = 240;
const MEASUREMENT_SAMPLE_HZ = Math.max(REQUESTED_MEASUREMENT_SAMPLE_HZ, Math.ceil(1 / DT_SEC));
const MINIMUM_MEASURE_BEATS = 3;
const PERIOD2_MEASURE_BEATS = 4;
const RUN_OPTIONS = { collectSamples: false, recordHistory: true, historyLimit: 1440 } as const;
const SETTLE_POLICY: SettlePolicy = { ...DEFAULT_SETTLE_POLICY, capSeconds: 90 };
const MODEL_PATH_IDS: readonly ModelPathId[] = [
  "stock-active-no-provider-v0",
  "developer-only-lv-land-v0",
] as const;
const POINTS: readonly DeveloperOnlyLvLandEnvelopePoint[] = [
  { id: "hr75-tbv4350-low-edge", HR: 75, targetTBVMl: 4350, domainRole: "low-preload-edge" },
  { id: "hr75-tbv5600-main", HR: 75, targetTBVMl: 5600, domainRole: "main-domain" },
  { id: "hr75-tbv6600-main-high", HR: 75, targetTBVMl: 6600, domainRole: "main-domain" },
  { id: "hr90-tbv4350-low-edge", HR: 90, targetTBVMl: 4350, domainRole: "low-preload-edge" },
  { id: "hr90-tbv5600-main", HR: 90, targetTBVMl: 5600, domainRole: "main-domain" },
  { id: "hr90-tbv6600-main-high", HR: 90, targetTBVMl: 6600, domainRole: "main-domain" },
] as const;

export function buildDeveloperOnlyLvLandEnvelopePhase5WEvidence():
DeveloperOnlyLvLandEnvelopePhase5WEvidence {
  return withQuietClampLogs(buildDeveloperOnlyLvLandEnvelopePhase5WEvidenceImpl);
}

function buildDeveloperOnlyLvLandEnvelopePhase5WEvidenceImpl():
DeveloperOnlyLvLandEnvelopePhase5WEvidence {
  const runs = POINTS.flatMap((point) => MODEL_PATH_IDS.map((modelPathId) => runEnvelopePoint(point, modelPathId)));
  const comparisons = POINTS.map((point) => comparePoint(point, runs));
  return {
    schemaVersion: 1,
    id: MYOCARDIUM_DEVELOPER_ONLY_LV_LAND_ENVELOPE_PHASE5W_ID,
    phase: "Phase 5W",
    claimBoundary: "developer-only-lv-land-envelope-expansion-diagnostic-only",
    upstreamPhase5VArtifactId: phase5VArtifact.id,
    verifierScript: "verify:myocardium-developer-only-lv-land-envelope",
    oracleDirectionSession: "direction-after-pr218-light",
    protocol: {
      matrixMode: "hr-preload-main-domain-envelope-v1",
      modelPathIds: MODEL_PATH_IDS,
      points: POINTS,
      dtSec: DT_SEC,
      settleSampleHz: SETTLE_SAMPLE_HZ,
      requestedMeasurementSampleHz: REQUESTED_MEASUREMENT_SAMPLE_HZ,
      measurementSampleHz: MEASUREMENT_SAMPLE_HZ,
      capTailMeasurementSampleHz: MEASUREMENT_SAMPLE_HZ,
      minimumMeasureBeats: MINIMUM_MEASURE_BEATS,
      period2MeasureBeats: PERIOD2_MEASURE_BEATS,
      settlePolicy: {
        tolPrimary: SETTLE_POLICY.tolPrimary,
        tolShape: SETTLE_POLICY.tolShape,
        consecutiveBeats: SETTLE_POLICY.consecutiveBeats,
        minBeats: SETTLE_POLICY.minBeats,
        capSeconds: SETTLE_POLICY.capSeconds,
        postSettleBeats: SETTLE_POLICY.postSettleBeats,
      },
      pointInitialization: "independent-from-target-tbv-no-cross-point-warm-start",
      sourceProviderScope: "LV-only",
      calciumMappingScenario: "phase2b-absolute-peak-ca",
      commitScheme: "BE",
    },
    runHealth: buildRunHealth(runs),
    runs,
    comparisons,
    summary: {
      productionReplacementReadiness: "not-ready-diagnostic-envelope-only",
      mainDomainSignal: "developer-only-envelope-recorded",
      lowPreloadHandling: "report-only-edge-evidence",
      morphologyHandling: "diagnostic-proxy-only-no-tuning",
      recommendedNext: [
        "use Phase 5W to decide whether developer-only LV Land envelope is broad enough for a production-shadow dry-run",
        "keep A0 atrial bridge decisions separate from LV Land source-provider evidence",
        "run morphology blocker experiments before default active-model replacement",
      ],
    },
    boundary: {
      noRuntimeReplacement: true,
      noOfficialCaseReauthoring: true,
      noWorkbenchRuntimeWiring: true,
      noStateSchemaMigration: true,
      noRuntimeFlagUi: true,
      noProductionRegistryIntegration: true,
      noQDotTuning: true,
      noValveTuning: true,
      noAfterloadTuning: true,
      noPreloadTuning: true,
      noLandParameterTuning: true,
      noSourceStressScaling: true,
      noLevel3Acceptance: true,
      noLevel4Acceptance: true,
      noOfficialMorphologyAcceptance: true,
      noFinalNoAlternansAcceptance: true,
      noStructuralAlternansRemovalClaim: true,
    },
    doesNotUnlock: [
      "runtimeReplacement",
      "officialCaseWiring",
      "workbenchRuntimeWiring",
      "stateSchemaMigration",
      "runtimeFlagUi",
      "productionRegistryIntegration",
      "officialMorphologyAcceptance",
      "finalNoAlternans",
      "structuralAlternansRemoval",
      "Level3Acceptance",
      "Level4Acceptance",
      "qDotTuning",
      "valveThresholdTuning",
      "arterialLoadTuning",
      "preloadTuning",
      "landParameterTuning",
      "sourceStressScaling",
      "clinicalDecisionSupport",
      "scientificValidationClaim",
    ],
  };
}

function withQuietClampLogs<T>(fn: () => T): T {
  const originalWarn = console.warn;
  const originalLog = console.log;
  const filter = (original: typeof console.warn) => (...args: unknown[]) => {
    const message = args.map(String).join(" ");
    if (message.startsWith("Clamp hit on node ")) return;
    original(...args);
  };
  console.warn = filter(originalWarn);
  console.log = filter(originalLog);
  try {
    return fn();
  } finally {
    console.warn = originalWarn;
    console.log = originalLog;
  }
}

function runEnvelopePoint(
  point: DeveloperOnlyLvLandEnvelopePoint,
  modelPathId: ModelPathId,
): DeveloperOnlyLvLandEnvelopeRun {
  const instrumentation = modelPathId === "developer-only-lv-land-v0"
    ? createModelCoreLand2017LvSourceProviderInstrumentation()
    : null;
  const flag = instrumentation
    ? createMyocardiumDeveloperOnlyLvLandRuntimeFlagOptions({
      acknowledgement: MYOCARDIUM_DEVELOPER_ONLY_LV_LAND_RUNTIME_FLAG_ACKNOWLEDGEMENT,
      instrumentation,
    })
    : null;
  const experimentalOptions = flag?.experimentalOptions ?? {};
  const core = new ModelCore(runParams(point), experimentalOptions);
  core.initializeVenousPressuresForTargetTBV(point.targetTBVMl);
  const settle = core.settleToSteady(SETTLE_POLICY, DT_SEC, SETTLE_SAMPLE_HZ, RUN_OPTIONS);
  const health = core.health({ periodBeats: settle.periodBeats });
  const windowContext = measureWindow(core, settle, point);
  const terminalActiveStress = terminalActiveStressTerms(windowContext.core);

  return {
    protocolId: "phase5w-developer-only-lv-land-envelope-v1",
    pointId: point.id,
    modelPathId,
    sourceProviderId: flag?.sourceProviderId ?? null,
    experimentalActiveSourceProvider: flag != null,
    closureInvariant: closureInvariant(point),
    HR: point.HR,
    targetTBVMl: point.targetTBVMl,
    domainRole: point.domainRole,
    settled: settle.settled,
    settleReason: settle.reason,
    settleActualSeconds: finiteOrNull(settle.actualSeconds),
    settleBeats: settle.beats,
    periodBeats: settle.periodBeats,
    adjacentDelta: finiteOrNull(settle.adjacentDelta),
    periodDelta: finiteOrNull(settle.periodDelta),
    worstSignal: settle.worstSignal,
    worstDelta: finiteOrNull(settle.worstDelta),
    healthStatus: health.status,
    healthMessages: health.messages,
    clampHitCount: health.clampHitCount,
    leftRightFlowMismatchLMin: finiteOrNull(health.leftRightFlowMismatchLMin),
    cycleMetricDelta: finiteOrNull(health.cycleMetricDelta),
    metrics: metricsSummary(windowContext.metrics),
    window: windowSummary(windowContext, point),
    terminalActiveStress,
    providerInstrumentation: instrumentation ? providerInstrumentationSummary(instrumentation) : null,
  };
}

function runParams(point: DeveloperOnlyLvLandEnvelopePoint): Partial<CoreRuntimeParams> {
  return {
    ...defaultParams(),
    HR: point.HR,
    heartModel: "activeStress",
  };
}

function measureWindow(
  core: ModelCore,
  settle: SettleStatus,
  point: DeveloperOnlyLvLandEnvelopePoint,
): { readonly core: ModelCore; readonly kind: WindowKind; readonly measureBeats: number; readonly metricWindowBeats: 1 | 2; readonly samples: readonly SimSample[]; readonly metrics: SimMetrics; readonly projectorQuiet: boolean | null } {
  const clone = core.cloneForReadOnlyMeasurement();
  const measureBeats = measureBeatsForPeriod(settle.periodBeats);
  const metricWindowBeats = metricWindowBeatsForPeriod(settle.periodBeats);
  if (settle.settled && settle.actualSeconds != null) {
    const measured: SteadyMeasurement = measureSteady(clone, settle as SettleStatus & { actualSeconds: number }, {
      dt: DT_SEC,
      sampleHz: MEASUREMENT_SAMPLE_HZ,
      measureBeats,
      requireProjectorQuiet: false,
    });
    return {
      core: measured.core,
      kind: "settled-measure-window",
      measureBeats,
      metricWindowBeats,
      samples: measured.samples,
      metrics: measured.core.metrics({ windowBeats: metricWindowBeats }),
      projectorQuiet: measured.projectorQuiet,
    };
  }
  const samples = clone.runFor(measureBeats * 60 / point.HR, DT_SEC, MEASUREMENT_SAMPLE_HZ);
  return {
    core: clone,
    kind: "cap-tail-window",
    measureBeats,
    metricWindowBeats,
    samples,
    metrics: clone.metrics({ windowBeats: metricWindowBeats }),
    projectorQuiet: null,
  };
}

function metricsSummary(metrics: SimMetrics): DeveloperOnlyLvLandEnvelopeMetrics {
  return {
    CO_L: finiteOrNull(metrics.CO_L),
    CO_R: finiteOrNull(metrics.CO_R),
    SV_L: finiteOrNull(metrics.SV_L),
    SV_R: finiteOrNull(metrics.SV_R),
    AoPMean: finiteOrNull(metrics.AoPMean),
    AoPSys: finiteOrNull(metrics.AoPSys),
    AoPDia: finiteOrNull(metrics.AoPDia),
    PAPMean: finiteOrNull(metrics.PAPMean),
    LAPMean: finiteOrNull(metrics.LAPMean),
    RAPMean: finiteOrNull(metrics.RAPMean),
    LVEDPApprox: finiteOrNull(metrics.LVEDPApprox),
    RVEDPApprox: finiteOrNull(metrics.RVEDPApprox),
    EF_LApprox: finiteOrNull(metrics.EF_LApprox),
    EF_RApprox: finiteOrNull(metrics.EF_RApprox),
    AoVForwardVolumeMl: finiteOrNull(metrics.AoVForwardVolumeMl),
    AoVReverseVolumeMl: finiteOrNull(metrics.AoVReverseVolumeMl),
    MVForwardVolumeMl: finiteOrNull(metrics.MVForwardVolumeMl),
    MVReverseVolumeMl: finiteOrNull(metrics.MVReverseVolumeMl),
  };
}

function windowSummary(
  context: { readonly kind: WindowKind; readonly measureBeats: number; readonly metricWindowBeats: 1 | 2; readonly samples: readonly SimSample[]; readonly projectorQuiet: boolean | null },
  point: DeveloperOnlyLvLandEnvelopePoint,
): DeveloperOnlyLvLandEnvelopeWindow {
  const samples = context.samples;
  const tbvStart = samples[0]?.TBV;
  const tbvEnd = samples.at(-1)?.TBV;
  return {
    kind: context.kind,
    measureBeats: context.measureBeats,
    metricWindowBeats: context.metricWindowBeats,
    sampleCount: samples.length,
    simulatedSeconds: finiteOrNull(samples.length > 1 ? samples.at(-1)!.t - samples[0].t : 0),
    tbvStartMl: finiteOrNull(tbvStart),
    tbvEndMl: finiteOrNull(tbvEnd),
    tbvDriftMl: finiteOrNull(tbvStart != null && tbvEnd != null ? tbvEnd - tbvStart : Number.NaN),
    projectorQuiet: context.projectorQuiet,
    LVPMax: maxOrNull(samples.map((sample) => sample.LVP)),
    LVPMin: minOrNull(samples.map((sample) => sample.LVP)),
    AoPMax: maxOrNull(samples.map((sample) => sample.AoP)),
    QAoPeakMlPerSec: maxOrNull(samples.map((sample) => sample.QAo)),
    qAoCapRatioMax: maxOrNull(samples.map((sample) => Math.abs(sample.QAo) / 40000)),
    AoVQDotClampHitFraction: fraction(samples.map((sample) => sample.AoV_qDotClampHit01)),
    AoVQDotRawAbsMaxMlPerS2: maxOrNull(samples.map((sample) => Math.abs(sample.AoV_qDotRaw))),
    valves: {
      MV: valveWindow(samples, "MV", point.HR, context.measureBeats),
      AoV: valveWindow(samples, "AoV", point.HR, context.measureBeats),
      TV: valveWindow(samples, "TV", point.HR, context.measureBeats),
      PV: valveWindow(samples, "PV", point.HR, context.measureBeats),
    },
    filling: fillingProxy(samples, context.measureBeats),
  };
}

function valveWindow(
  samples: readonly SimSample[],
  valve: ValveId,
  HR: number,
  measureBeats: number,
): DeveloperOnlyLvLandEnvelopeValveWindow {
  const flows = samples.map((sample) => valueAt(sample, valveFlowKey(valve)));
  const reverseVolumeMl =
    integrateBySampleInterval(flows.map((flow) => Math.max(0, -flow)), HR, samples.length, measureBeats);
  const diodeValues = samples.map((sample) => Math.abs(valueAt(sample, `${valve}_diodeImpulse`)));
  const qDotHitValues = samples.map((sample) => valueAt(sample, `${valve}_qDotClampHit01`));
  return {
    reverseVolumeMl: finiteOrNull(reverseVolumeMl),
    diodeImpulseMax: maxOrNull(diodeValues),
    diodeHitFraction: fraction(diodeValues.map((value) => value > 0 ? 1 : 0)),
    qDotClampHitFraction: fraction(qDotHitValues),
  };
}

function fillingProxy(samples: readonly SimSample[], measureBeats: number): DeveloperOnlyLvLandEnvelopeFillingProxy {
  if (samples.length < 2) {
    return {
      MV_A_forward_window_mL: null,
      MV_E_forward_window_mL: null,
      MV_A_forward_perBeat_mL: null,
      MV_E_forward_perBeat_mL: null,
      MV_A_fraction: null,
      LA_loop_area: null,
      fillingMorphologyClass: "indeterminate",
    };
  }
  const eForward = integratePhaseFlow(samples, 0.3, 0.65);
  const aForward = integratePhaseFlow(samples, 0.82, 0.12);
  const total = eForward + aForward;
  const aFraction = total > 1e-9 ? aForward / total : null;
  const beatCount = Math.max(measureBeats, 1);
  return {
    MV_A_forward_window_mL: finiteOrNull(aForward),
    MV_E_forward_window_mL: finiteOrNull(eForward),
    MV_A_forward_perBeat_mL: finiteOrNull(aForward / beatCount),
    MV_E_forward_perBeat_mL: finiteOrNull(eForward / beatCount),
    MV_A_fraction: finiteOrNull(aFraction),
    LA_loop_area: finiteOrNull(loopArea(samples.map((sample) => ({ x: sample.VLA, y: sample.LAP })))),
    fillingMorphologyClass: total <= 1e-9
      ? "indeterminate"
      : aForward < 0.05 * Math.max(eForward, 1)
        ? "E-only"
        : aFraction != null && aFraction < 0.15
          ? "weak-A"
          : "E+A",
  };
}

function terminalActiveStressTerms(core: ModelCore): DeveloperOnlyLvLandEnvelopeActiveStress {
  const lv = core.debugActiveStressDiagnostics().LV;
  return {
    LV_sigmaActTargetPa: finiteOrNull(lv?.sigmaActTarget),
    LV_sigmaActPa: finiteOrNull(lv?.sigmaAct),
    LV_sigmaPasPa: finiteOrNull(lv?.sigmaPas),
    LV_c: finiteOrNull(lv?.c),
    LV_a: finiteOrNull(lv?.a),
  };
}

function providerInstrumentationSummary(
  instrumentation: ModelCoreLand2017LvSourceProviderInstrumentation,
): DeveloperOnlyLvLandEnvelopeProviderInstrumentation {
  return {
    sourceActiveStressCallCount: instrumentation.sourceActiveStressPa,
    debugActiveStressTermsCallCount: instrumentation.debugActiveStressTerms,
    commitProviderStateAfterStepCount: instrumentation.commitProviderStateAfterStep,
    landSolveFailureCount: instrumentation.landSolveFailureCount,
    landSolveOkCount: instrumentation.landSolveOkCount,
    maxSolverResidualNorm: round(instrumentation.maxSolverResidualNorm),
    sourcePathAuditSampleCount: instrumentation.sourcePathAudit.sampleCount,
    commitPathAuditSampleCount: instrumentation.commitPathAudit.sampleCount,
  };
}

function buildRunHealth(
  runs: readonly DeveloperOnlyLvLandEnvelopeRun[],
): DeveloperOnlyLvLandEnvelopePhase5WEvidence["runHealth"] {
  const landRuns = runs.filter((run) => run.modelPathId === "developer-only-lv-land-v0");
  const mainDomainLandRuns = landRuns.filter((run) => run.domainRole === "main-domain");
  return {
    runCount: runs.length,
    settledRunCount: runs.filter((run) => run.settled).length,
    capRunCount: runs.filter((run) => run.settleReason === "cap").length,
    healthOkRunCount: runs.filter((run) => run.healthStatus === "ok").length,
    mainDomainLandRunCount: mainDomainLandRuns.length,
    mainDomainLandSettledCount: mainDomainLandRuns.filter((run) => run.settled).length,
    mainDomainLandHealthOkCount: mainDomainLandRuns.filter((run) => run.healthStatus === "ok").length,
    landSolveFailureCount:
      landRuns.reduce((sum, run) => sum + (run.providerInstrumentation?.landSolveFailureCount ?? 0), 0),
    landSourceCallsPresentEveryRun:
      landRuns.every((run) => (run.providerInstrumentation?.sourceActiveStressCallCount ?? 0) > 0),
    landCommitCallsPresentEveryRun:
      landRuns.every((run) => (run.providerInstrumentation?.commitProviderStateAfterStepCount ?? 0) > 0),
    mainDomainLandAllPeriod1:
      mainDomainLandRuns.every((run) => run.periodBeats === 1),
  };
}

function comparePoint(
  point: DeveloperOnlyLvLandEnvelopePoint,
  runs: readonly DeveloperOnlyLvLandEnvelopeRun[],
): DeveloperOnlyLvLandEnvelopeComparison {
  const stock = requireRun(runs, point.id, "stock-active-no-provider-v0");
  const land = requireRun(runs, point.id, "developer-only-lv-land-v0");
  return {
    pointId: point.id,
    HR: point.HR,
    targetTBVMl: point.targetTBVMl,
    domainRole: point.domainRole,
    stockSettled: stock.settled,
    landSettled: land.settled,
    sameClosureInvariant:
      JSON.stringify(stock.closureInvariant) === JSON.stringify(land.closureInvariant),
    bothHealthOk: stock.healthStatus === "ok" && land.healthStatus === "ok",
    landSolveFailureCount: land.providerInstrumentation?.landSolveFailureCount ?? -1,
    landSourceAndCommitPresent:
      (land.providerInstrumentation?.sourceActiveStressCallCount ?? 0) > 0
      && (land.providerInstrumentation?.commitProviderStateAfterStepCount ?? 0) > 0,
    landVsStock: {
      CO_L_delta: delta(land.metrics.CO_L, stock.metrics.CO_L),
      SV_L_delta: delta(land.metrics.SV_L, stock.metrics.SV_L),
      LVPMax_delta: delta(land.window.LVPMax, stock.window.LVPMax),
      AoPMean_delta: delta(land.metrics.AoPMean, stock.metrics.AoPMean),
      QAoPeak_delta: delta(land.window.QAoPeakMlPerSec, stock.window.QAoPeakMlPerSec),
      AoVQDotClampHitFraction_delta:
        delta(land.window.AoVQDotClampHitFraction, stock.window.AoVQDotClampHitFraction),
      MV_A_fraction_delta: delta(land.window.filling.MV_A_fraction, stock.window.filling.MV_A_fraction),
    },
  };
}

function requireRun(
  runs: readonly DeveloperOnlyLvLandEnvelopeRun[],
  pointId: string,
  modelPathId: ModelPathId,
): DeveloperOnlyLvLandEnvelopeRun {
  const run = runs.find((candidate) => candidate.pointId === pointId && candidate.modelPathId === modelPathId);
  if (!run) throw new Error(`Missing Phase 5W run ${pointId}/${modelPathId}`);
  return run;
}

function integratePhaseFlow(samples: readonly SimSample[], phaseStart: number, phaseEnd: number): number {
  if (samples.length < 2) return 0;
  let sum = 0;
  for (let i = 1; i < samples.length; i++) {
    const prev = samples[i - 1];
    const curr = samples[i];
    const phase = phaseOf(curr);
    if (!phaseInWindow(phase, phaseStart, phaseEnd)) continue;
    const dt = Math.max(0, curr.t - prev.t);
    sum += 0.5 * (Math.max(0, prev.QMV) + Math.max(0, curr.QMV)) * dt;
  }
  return round(sum);
}

function closureInvariant(point: DeveloperOnlyLvLandEnvelopePoint): DeveloperOnlyLvLandEnvelopeClosureInvariant {
  return {
    heartModel: "activeStress",
    HR: point.HR,
    targetTBVMl: point.targetTBVMl,
    dtSec: DT_SEC,
    settleSampleHz: SETTLE_SAMPLE_HZ,
    measurementSampleHz: MEASUREMENT_SAMPLE_HZ,
    independentInitialization: true,
    noWarmStart: true,
    noQDotTuning: true,
    noValveTuning: true,
    noAfterloadTuning: true,
    noPreloadTuning: true,
    noLandParameterTuning: true,
    noSourceStressScaling: true,
  };
}

function measureBeatsForPeriod(periodBeats: 1 | 2): number {
  return periodBeats === 2 ? PERIOD2_MEASURE_BEATS : MINIMUM_MEASURE_BEATS;
}

function metricWindowBeatsForPeriod(periodBeats: 1 | 2): 1 | 2 {
  return periodBeats === 2 ? 2 : 1;
}

function integrateBySampleInterval(
  values: readonly number[],
  HR: number,
  sampleCount: number,
  measureBeats: number,
): number {
  if (values.length === 0 || sampleCount <= 0) return 0;
  const seconds = measureBeats * 60 / Math.max(HR, 1);
  const dt = seconds / Math.max(sampleCount, 1);
  return round(values.reduce((sum, value) => sum + value * dt, 0));
}

function phaseInWindow(phase: number, start: number, end: number): boolean {
  return start <= end ? phase >= start && phase <= end : phase >= start || phase <= end;
}

function phaseOf(sample: SimSample): number {
  return sample.phi - Math.floor(sample.phi);
}

function valveFlowKey(valve: ValveId): keyof Pick<SimSample, "QMV" | "QAo" | "QTV" | "QPV"> {
  if (valve === "MV") return "QMV";
  if (valve === "AoV") return "QAo";
  if (valve === "TV") return "QTV";
  return "QPV";
}

function loopArea(points: readonly { readonly x: number; readonly y: number }[]): number {
  if (points.length < 3) return Number.NaN;
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    area += points[i].x * points[j].y - points[j].x * points[i].y;
  }
  return Math.abs(area) / 2;
}

function valueAt(sample: SimSample, key: string): number {
  const value = (sample as unknown as Record<string, number | undefined>)[key];
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function maxOrNull(values: readonly number[]): number | null {
  const finite = values.filter(Number.isFinite);
  return finite.length > 0 ? round(Math.max(...finite)) : null;
}

function minOrNull(values: readonly number[]): number | null {
  const finite = values.filter(Number.isFinite);
  return finite.length > 0 ? round(Math.min(...finite)) : null;
}

function fraction(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  return round(values.reduce((sum, value) => sum + (value > 0 ? 1 : 0), 0) / values.length);
}

function delta(left: number | null, right: number | null): number | null {
  if (left == null || right == null) return null;
  return finiteOrNull(left - right);
}

function finiteOrNull(value: number | null | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) ? round(value) : null;
}

function round(value: number): number {
  if (!Number.isFinite(value)) return value;
  return Math.round(value * 1e6) / 1e6;
}

function isDirectExecution(): boolean {
  const entrypoint = process.argv[1];
  if (entrypoint && import.meta.url === pathToFileURL(path.resolve(entrypoint)).href) return true;
  const normalizedScriptPath =
    path.normalize("tools/myocardium/buildDeveloperOnlyLvLandEnvelopePhase5W.ts");
  return process.argv.some((arg) => path.normalize(arg).endsWith(normalizedScriptPath));
}

if (isDirectExecution()) {
  const evidence = buildDeveloperOnlyLvLandEnvelopePhase5WEvidence();
  if (process.argv.includes("--write")) {
    const outPath = path.join(process.cwd(), MYOCARDIUM_DEVELOPER_ONLY_LV_LAND_ENVELOPE_PHASE5W_RESULT_PATH);
    mkdirSync(path.dirname(outPath), { recursive: true });
    writeFileSync(outPath, `${JSON.stringify(evidence, null, 2)}\n`);
    console.log(`Wrote ${outPath}`);
  } else {
    console.log(JSON.stringify(evidence, null, 2));
  }
}
