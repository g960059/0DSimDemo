import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { DEFAULT_PARAMS } from "@/constants";
import { measureSteady, settleToSteadyState } from "@/engine/measure";
import {
  PRESCRIBED_CALCIUM_SYNTHETIC_SMOKE_PARAMETER_SET,
  PRESCRIBED_CALCIUM_SYNTHETIC_SMOKE_PARAMETER_SET_ID,
  stepPrescribedCalciumTransientV1,
  type PrescribedCalciumInput,
} from "@/engine/myocardium/calcium";
import {
  DEFAULT_SERIES_ELASTIC_FIBER_PARAMETERS,
  SERIES_ELASTIC_FIBER_ADAPTER_V1_ID,
  initialSeriesElasticFiberState,
  stepSeriesElasticLandFiberV1,
  type SeriesElasticFiberParameters,
  type SeriesElasticFiberState,
  type SeriesElasticFiberStepResult,
} from "@/engine/myocardium/seriesElasticFiberAdapter";
import {
  MODELCORE_RUNTIME_ALL_CHAMBER_LANDATRIAL_DEFAULT_MODE,
  resolveModelCoreRuntimeActiveSource,
} from "@/engine/myocardium/runtimeActiveSource";
import {
  MODELCORE_RUNTIME_ROOT_ZC_SOURCED_BOUNDARY_ROOT_DEFAULT_MODE,
} from "@/engine/myocardium/runtimeRootZc";
import type { CoreRuntimeParams, SimMetrics, SimSample, SimulationHealth } from "@/engine/protocol";
import type { SettleStatus } from "@/engine/settling";
import {
  DYNAMIC_VALVE_TRANSITION_V1_ID,
  initialDynamicValveTransitionV1State,
  stepDynamicValveTransitionV1,
  type DynamicValveTransitionV1Parameters,
  type DynamicValveTransitionV1State,
  type DynamicValveTransitionV1StepResult,
} from "@/engine/valves/dynamicValveTransitionV1";
import { lastCompleteBeat, phaseInWindow, phaseOf } from "@/engine/verification/shapeMetrics";
import { resolveVerificationProfile } from "@/engine/verification/profiles";

export const LV_SUBSYSTEM_BENCH_PHASE5BV_ID =
  "lv-subsystem-bench-phase5bv-result-v1" as const;
export const LV_SUBSYSTEM_BENCH_PHASE5BV_RESULT_PATH =
  "data/myocardium/protocols/lv-subsystem-bench-phase5bv-result-v1.json" as const;

type PointId =
  | "normal-hr75"
  | "normal-hr90"
  | "low-preload-hr75"
  | "high-preload-hr75"
  | "systemic-afterload-high-hr75"
  | "pulmonary-afterload-high-hr75"
  | "contractility-low-hr75"
  | "contractility-high-hr75";

type SideId = "LV" | "RV";
type AvValveId = "MV" | "TV";
type OutValveId = "AoV" | "PV";

type VariantId =
  | "live-source-reference"
  | "picard-live-pressure-current-valves"
  | "picard-linear-pressure-current-valves"
  | "picard-linear-pressure-dynamic-valves"
  | "picard-series-elastic-current-valves"
  | "picard-series-elastic-dynamic-valves";

type PointSpec = {
  readonly id: PointId;
  readonly hrBpm: number;
  readonly targetTBVMl: number;
  readonly runtimeParams: Partial<CoreRuntimeParams>;
  readonly contractilityScale: number;
};

type ValveSpec = {
  readonly id: AvValveId | OutValveId;
  readonly resistanceMmHgSecPerMl: number;
  readonly bernoulliMmHgSec2PerMl2: number;
  readonly inertanceMmHgSec2PerMl: number;
  readonly openGainPerMmHg: number;
  readonly sourceDeadbandMmHg: number;
  readonly tauOpenSec: number;
  readonly tauCloseSec: number;
};

type SideSpec = {
  readonly id: SideId;
  readonly avValveId: AvValveId;
  readonly outValveId: OutValveId;
  readonly atrialPressureKey: keyof SimSample;
  readonly arterialPressureKey: keyof SimSample;
  readonly chamberPressureKey: keyof SimSample;
  readonly volumeKey: keyof SimSample;
  readonly avFlowKey: keyof SimSample;
  readonly outFlowKey: keyof SimSample;
  readonly avOpenKey: keyof SimSample;
  readonly outOpenKey: keyof SimSample;
  readonly activePressureKey: keyof SimSample;
  readonly activeStressKey: keyof SimSample;
  readonly fiberLambdaKey: keyof SimSample;
  readonly avValve: ValveSpec;
  readonly outValve: ValveSpec;
  readonly passiveSlopeBounds: readonly [number, number];
  readonly activePressurePerStressBounds: readonly [number, number];
};

type VariantSpec = {
  readonly id: VariantId;
  readonly label: string;
  readonly hypothesis: string;
  readonly pressureMode: "live-pressure" | "linear-pressure" | "series-elastic-pressure";
  readonly valveMode: "current-like" | "dynamic-5bu-best";
  readonly picardIterations: number;
  readonly seriesElastic: SeriesElasticFiberParameters | null;
};

type LiveTrace = {
  readonly pointId: PointId;
  readonly settled: boolean;
  readonly settleReason: SettleStatus["reason"] | "exception";
  readonly healthStatus: SimulationHealth["status"] | "exception";
  readonly sampleCount: number;
  readonly finalBeatSampleCount: number;
  readonly metrics: MetricDigest | null;
  readonly samples: readonly SimSample[];
  readonly finalBeat: readonly SimSample[];
  readonly errorMessage: string | null;
};

type ReplaySample = {
  readonly timeSec: number;
  readonly theta: number;
  readonly volumeMl: number;
  readonly liveVolumeMl: number;
  readonly chamberPressureMmHg: number;
  readonly liveChamberPressureMmHg: number;
  readonly passivePressureMmHg: number;
  readonly activePressureMmHg: number;
  readonly atrialPressureMmHg: number;
  readonly arterialPressureMmHg: number;
  readonly avFlowMlPerSec: number;
  readonly outFlowMlPerSec: number;
  readonly liveAvFlowMlPerSec: number;
  readonly liveOutFlowMlPerSec: number;
  readonly avOpen01: number;
  readonly outOpen01: number;
  readonly lambdaTotal: number;
  readonly lambdaSi: number | null;
  readonly lambdaSe: number | null;
  readonly sigmaCePa: number | null;
  readonly sigmaSePa: number | null;
  readonly sigmaMismatchPa: number | null;
  readonly seElasticEnergyJm3: number | null;
  readonly picardPressureResidualMmHg: number;
  readonly picardVolumeResidualMl: number;
  readonly avQDotClampImpulseMlPerSec2: number;
  readonly outQDotClampImpulseMlPerSec2: number;
  readonly avDiodeImpulseMlPerSec: number;
  readonly outDiodeImpulseMlPerSec: number;
  readonly avAdversePressureGradientFlow01: number;
  readonly outAdversePressureGradientFlow01: number;
};

type SubsystemMetrics = {
  readonly finalBeatSampleCount: number;
  readonly pvOk: boolean;
  readonly pvPeakCount: number;
  readonly pvTroughCount: number;
  readonly pvRoughness: number;
  readonly ejectionSampleCount: number;
  readonly avFlowOk: boolean;
  readonly avDiastolicPeakCount: number;
  readonly avExtraPeakCount: number;
  readonly avAOverE: number | null;
  readonly avExtraPeakProminenceRatio: number | null;
  readonly liveForwardAvVolumeMl: number;
  readonly replayForwardAvVolumeMl: number;
  readonly liveForwardOutVolumeMl: number;
  readonly replayForwardOutVolumeMl: number;
  readonly avForwardVolumeRatio: number | null;
  readonly outForwardVolumeRatio: number | null;
  readonly volumeDriftMl: number;
  readonly maxAbsPicardPressureResidualMmHg: number;
  readonly maxAbsPicardVolumeResidualMl: number;
  readonly maxAbsSigmaMismatchPa: number | null;
  readonly maxSeElasticEnergyJm3: number | null;
  readonly seEnergyDriftJm3: number | null;
  readonly boundedSeriesElasticEnergy: boolean | null;
  readonly avQDotClampDutyFraction: number;
  readonly outQDotClampDutyFraction: number;
  readonly avAdverseGradientFlowFraction: number;
  readonly outAdverseGradientFlowFraction: number;
  readonly outputPreserved: boolean;
  readonly grossOk: boolean;
};

type RunResult = {
  readonly variantId: VariantId;
  readonly pointId: PointId;
  readonly side: SideId;
  readonly measured: boolean;
  readonly metrics: SubsystemMetrics;
  readonly previewFinalBeatSamples: readonly ReplaySample[];
  readonly failureMessage: string | null;
};

type VariantSummary = {
  readonly variantId: VariantId;
  readonly measuredCount: number;
  readonly grossOkCount: number;
  readonly lvMeasuredCount: number;
  readonly rvMeasuredCount: number;
  readonly lvGrossOkCount: number;
  readonly rvGrossOkCount: number;
  readonly pvOkCount: number;
  readonly avFlowOkCount: number;
  readonly outputPreservedCount: number;
  readonly boundedSeriesElasticEnergyCount: number;
  readonly meanPvPeakCount: number;
  readonly meanAvDiastolicPeakCount: number;
  readonly meanAvExtraPeakCount: number;
  readonly meanMaxAbsPicardPressureResidualMmHg: number;
  readonly meanMaxAbsPicardVolumeResidualMl: number;
  readonly failedPointSides: readonly string[];
};

type Classification = {
  readonly liveUser0GrossPass: string;
  readonly bestPicardVariant: string;
  readonly lvSubsystemDecision:
    | "supported-for-runtime-shadow"
    | "partial-local-subsystem-signal"
    | "not-supported";
  readonly notes: readonly string[];
};

type Evidence = {
  readonly schemaVersion: 1;
  readonly id: typeof LV_SUBSYSTEM_BENCH_PHASE5BV_ID;
  readonly phase: "5BV";
  readonly bench: {
    readonly mode: "live-user0-boundary-pressure-local-ventricular-subsystem-replay";
    readonly pointSource:
      "normal-hr75-hr90-preload-afterload-contractility-representative-envelope";
    readonly liveClosure:
      "current-user0-lv-rv-la-ra-landatrial-plus-sourced-root-zc";
    readonly components: readonly [typeof DYNAMIC_VALVE_TRANSITION_V1_ID, typeof SERIES_ELASTIC_FIBER_ADAPTER_V1_ID];
    readonly claimBoundary:
      "local-subsystem-bench-only-no-runtime-default-no-closed-loop-morphology-claim";
  };
  readonly points: readonly PointSpec[];
  readonly sides: readonly SideDigest[];
  readonly variants: readonly Omit<VariantSpec, "seriesElastic">[];
  readonly liveTraceSummaries: readonly Omit<LiveTrace, "samples" | "finalBeat">[];
  readonly results: readonly RunResult[];
  readonly variantSummaries: readonly VariantSummary[];
  readonly classification: Classification;
  readonly recommendedNext: readonly string[];
  readonly claimBoundary: {
    readonly noRuntimeDefaultAdoption: true;
    readonly noClosedLoopMorphologyAcceptance: true;
    readonly noLandAtrialTuning: true;
    readonly noA1A2Reopen: true;
    readonly noValveQdotRootZcTrefSourceStressTuning: true;
    readonly noClinicalScientificValidation: true;
  };
  readonly normalizedSha256: string;
};

type SideDigest = {
  readonly id: SideId;
  readonly avValveId: AvValveId;
  readonly outValveId: OutValveId;
  readonly passiveSlopeBounds: readonly [number, number];
  readonly activePressurePerStressBounds: readonly [number, number];
};

type MetricDigest = Pick<
  SimMetrics,
  "AoPMean" | "PAPMean" | "CO_L" | "CO_R" | "LAPMean" | "RAPMean" | "EF_LApprox" | "EF_RApprox"
>;

type LocalReplayState = {
  volumeMl: number;
  avValveState: DynamicValveTransitionV1State;
  outValveState: DynamicValveTransitionV1State;
  seriesElasticState: SeriesElasticFiberState | null;
  calciumState: Float64Array;
  previousFreeCalciumUM: number;
};

const profile = resolveVerificationProfile("fitFast");
const FINAL_BEAT_PREVIEW_SAMPLES = 6;
const DEFAULT_INITIAL_LAND_STATE = Float64Array.from([0.18, 0.22, 0.04, 0.02, 0, 0]);
const DEFAULT_INITIAL_CALCIUM_STATE = Float64Array.from([0, 0]);

const POINTS: readonly PointSpec[] = [
  { id: "normal-hr75", hrBpm: 75, targetTBVMl: 5600, runtimeParams: { HR: 75 }, contractilityScale: 1 },
  { id: "normal-hr90", hrBpm: 90, targetTBVMl: 5600, runtimeParams: { HR: 90 }, contractilityScale: 1 },
  { id: "low-preload-hr75", hrBpm: 75, targetTBVMl: 4800, runtimeParams: { HR: 75 }, contractilityScale: 1 },
  { id: "high-preload-hr75", hrBpm: 75, targetTBVMl: 6200, runtimeParams: { HR: 75 }, contractilityScale: 1 },
  { id: "systemic-afterload-high-hr75", hrBpm: 75, targetTBVMl: 5600, runtimeParams: { HR: 75, systemicResistance: 1.25 }, contractilityScale: 1 },
  { id: "pulmonary-afterload-high-hr75", hrBpm: 75, targetTBVMl: 5600, runtimeParams: { HR: 75, pulmonaryResistance: 0.8 }, contractilityScale: 1 },
  { id: "contractility-low-hr75", hrBpm: 75, targetTBVMl: 5600, runtimeParams: { HR: 75, contractility: 0.8 }, contractilityScale: 0.82 },
  { id: "contractility-high-hr75", hrBpm: 75, targetTBVMl: 5600, runtimeParams: { HR: 75, contractility: 1.2 }, contractilityScale: 1.18 },
];

const SIDES: readonly SideSpec[] = [
  {
    id: "LV",
    avValveId: "MV",
    outValveId: "AoV",
    atrialPressureKey: "LAP",
    arterialPressureKey: "AoP",
    chamberPressureKey: "LVP",
    volumeKey: "VLV",
    avFlowKey: "QMV",
    outFlowKey: "QAo",
    avOpenKey: "xiMV",
    outOpenKey: "xiAoV",
    activePressureKey: "LVActivePressureMmHg",
    activeStressKey: "LVActiveFiberStressPa",
    fiberLambdaKey: "LVFiberLambda",
    avValve: valveSpec("MV"),
    outValve: valveSpec("AoV"),
    passiveSlopeBounds: [0.015, 1.2],
    activePressurePerStressBounds: [0.0001, 0.04],
  },
  {
    id: "RV",
    avValveId: "TV",
    outValveId: "PV",
    atrialPressureKey: "RAP",
    arterialPressureKey: "PAP",
    chamberPressureKey: "RVP",
    volumeKey: "VRV",
    avFlowKey: "QTV",
    outFlowKey: "QPV",
    avOpenKey: "xiTV",
    outOpenKey: "xiPV",
    activePressureKey: "RVActivePressureMmHg",
    activeStressKey: "RVActiveFiberStressPa",
    fiberLambdaKey: "RVFiberLambda",
    avValve: valveSpec("TV"),
    outValve: valveSpec("PV"),
    passiveSlopeBounds: [0.006, 0.5],
    activePressurePerStressBounds: [0.00003, 0.02],
  },
];

const VARIANTS: readonly VariantSpec[] = [
  {
    id: "live-source-reference",
    label: "Live source reference",
    hypothesis: "Records current user-0 LV/RV PV and AV inflow gross morphology in the same envelope.",
    pressureMode: "live-pressure",
    valveMode: "current-like",
    picardIterations: 0,
    seriesElastic: null,
  },
  {
    id: "picard-live-pressure-current-valves",
    label: "Picard current-like valves with live chamber pressure",
    hypothesis: "Separates local valve replay from chamber-pressure feedback.",
    pressureMode: "live-pressure",
    valveMode: "current-like",
    picardIterations: 3,
    seriesElastic: null,
  },
  {
    id: "picard-linear-pressure-current-valves",
    label: "Picard linear chamber pressure with current-like valves",
    hypothesis: "Tests whether same-step chamber volume-pressure feedback moves dome and inflow artifacts.",
    pressureMode: "linear-pressure",
    valveMode: "current-like",
    picardIterations: 3,
    seriesElastic: null,
  },
  {
    id: "picard-linear-pressure-dynamic-valves",
    label: "Picard linear pressure with Phase 5BU dynamic valves",
    hypothesis: "Tests chamber pressure feedback plus the best local DynamicValveTransitionV1 component.",
    pressureMode: "linear-pressure",
    valveMode: "dynamic-5bu-best",
    picardIterations: 3,
    seriesElastic: null,
  },
  {
    id: "picard-series-elastic-current-valves",
    label: "Picard SeriesElasticV1 pressure with current-like valves",
    hypothesis: "Tests whether transmitted series-elastic stress plus same-step valve correction is a useful component.",
    pressureMode: "series-elastic-pressure",
    valveMode: "current-like",
    picardIterations: 3,
    seriesElastic: seriesElasticParams(600_000, 3_500),
  },
  {
    id: "picard-series-elastic-dynamic-valves",
    label: "Picard SeriesElasticV1 pressure with Phase 5BU dynamic valves",
    hypothesis: "Tests the smallest composition of SE stress transmission plus dynamic valve transition.",
    pressureMode: "series-elastic-pressure",
    valveMode: "dynamic-5bu-best",
    picardIterations: 3,
    seriesElastic: seriesElasticParams(600_000, 3_500),
  },
];

export function buildLvSubsystemBenchPhase5BVEvidence(): Evidence {
  const liveTraces = buildLiveTraces();
  const results = VARIANTS.flatMap((variant) =>
    POINTS.flatMap((point) =>
      SIDES.map((side) => runSubsystem(variant, point, side, requiredTrace(liveTraces, point.id))),
    ),
  );
  const variantSummaries = VARIANTS.map((variant) => summarizeVariant(variant, results));
  const classification = classify(variantSummaries);
  const evidenceWithoutHash = {
    schemaVersion: 1,
    id: LV_SUBSYSTEM_BENCH_PHASE5BV_ID,
    phase: "5BV",
    bench: {
      mode: "live-user0-boundary-pressure-local-ventricular-subsystem-replay",
      pointSource: "normal-hr75-hr90-preload-afterload-contractility-representative-envelope",
      liveClosure: "current-user0-lv-rv-la-ra-landatrial-plus-sourced-root-zc",
      components: [DYNAMIC_VALVE_TRANSITION_V1_ID, SERIES_ELASTIC_FIBER_ADAPTER_V1_ID],
      claimBoundary: "local-subsystem-bench-only-no-runtime-default-no-closed-loop-morphology-claim",
    },
    points: POINTS,
    sides: SIDES.map(sideDigest),
    variants: VARIANTS.map(({ seriesElastic: _seriesElastic, ...variant }) => variant),
    liveTraceSummaries: liveTraces.map(({ samples: _samples, finalBeat: _finalBeat, ...trace }) => trace),
    results,
    variantSummaries,
    classification,
    recommendedNext: recommendedNext(classification),
    claimBoundary: {
      noRuntimeDefaultAdoption: true,
      noClosedLoopMorphologyAcceptance: true,
      noLandAtrialTuning: true,
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

function buildLiveTraces(): readonly LiveTrace[] {
  const resolved = resolveModelCoreRuntimeActiveSource({
    mode: MODELCORE_RUNTIME_ALL_CHAMBER_LANDATRIAL_DEFAULT_MODE,
    rootZcMode: MODELCORE_RUNTIME_ROOT_ZC_SOURCED_BOUNDARY_ROOT_DEFAULT_MODE,
    runtimeParams: DEFAULT_PARAMS,
  });
  return POINTS.map((point) => {
    try {
      const params = { ...DEFAULT_PARAMS, ...point.runtimeParams };
      const settle = settleToSteadyState(params, {
        targetTBV: point.targetTBVMl,
        dt: profile.dt,
        sampleHz: profile.sampleHz,
        settlePolicy: profile.settlePolicy,
        measureBeats: profile.measureBeats,
        requireProjectorQuiet: profile.requireProjectorQuiet,
        experimentalOptions: resolved.experimentalOptions,
      });
      const measurement = settle.ok
        ? measureSteady(settle.core, settle.settleStatus, {
          targetTBV: point.targetTBVMl,
          dt: profile.dt,
          sampleHz: profile.sampleHz,
          settlePolicy: profile.settlePolicy,
          measureBeats: profile.measureBeats,
          requireProjectorQuiet: profile.requireProjectorQuiet,
          experimentalOptions: resolved.experimentalOptions,
        })
        : null;
      const samples = measurement?.samples ?? [];
      const finalBeat = lastCompleteBeat([...samples]);
      return {
        pointId: point.id,
        settled: settle.settleStatus.settled,
        settleReason: settle.settleStatus.reason,
        healthStatus: measurement?.health.status ?? settle.core.health().status,
        sampleCount: samples.length,
        finalBeatSampleCount: finalBeat.length,
        metrics: measurement ? metricDigest(measurement.metrics) : null,
        samples,
        finalBeat,
        errorMessage: null,
      };
    } catch (error) {
      return {
        pointId: point.id,
        settled: false,
        settleReason: "exception",
        healthStatus: "exception",
        sampleCount: 0,
        finalBeatSampleCount: 0,
        metrics: null,
        samples: [],
        finalBeat: [],
        errorMessage: error instanceof Error ? error.message : String(error),
      };
    }
  });
}

function runSubsystem(
  variant: VariantSpec,
  point: PointSpec,
  side: SideSpec,
  liveTrace: LiveTrace,
): RunResult {
  if (!liveTrace.settled || liveTrace.healthStatus !== "ok" || liveTrace.samples.length < 10 || liveTrace.finalBeat.length < 8) {
    return {
      variantId: variant.id,
      pointId: point.id,
      side: side.id,
      measured: false,
      metrics: emptyMetrics(),
      previewFinalBeatSamples: [],
      failureMessage: liveTrace.errorMessage ?? `live trace unavailable or unsettled for ${point.id}`,
    };
  }
  const samples = variant.id === "live-source-reference"
    ? liveReferenceSamples(side, liveTrace.samples)
    : replaySubsystem(variant, point, side, liveTrace.samples);
  const finalBeat = finalBeatSamples(samples);
  return {
    variantId: variant.id,
    pointId: point.id,
    side: side.id,
    measured: true,
    metrics: computeMetrics(side, liveTrace.finalBeat, finalBeat),
    previewFinalBeatSamples: previewFinalBeat(finalBeat),
    failureMessage: null,
  };
}

function replaySubsystem(
  variant: VariantSpec,
  point: PointSpec,
  side: SideSpec,
  samples: readonly SimSample[],
): readonly ReplaySample[] {
  const first = samples[0];
  const passiveSlope = estimatePassiveSlope(side, samples);
  const pressurePerStress = estimateActivePressurePerStress(side, samples);
  const cycleLengthSec = 60 / point.hrBpm;
  const state: LocalReplayState = {
    volumeMl: numberAt(first, side.volumeKey),
    avValveState: initialDynamicValveTransitionV1State(numberAt(first, side.avFlowKey), numberAt(first, side.avOpenKey)),
    outValveState: initialDynamicValveTransitionV1State(numberAt(first, side.outFlowKey), numberAt(first, side.outOpenKey)),
    seriesElasticState: variant.seriesElastic
      ? initialSeriesElasticFiberState(DEFAULT_INITIAL_LAND_STATE, numberAt(first, side.fiberLambdaKey))
      : null,
    calciumState: Float64Array.from(DEFAULT_INITIAL_CALCIUM_STATE),
    previousFreeCalciumUM: 0,
  };
  const replay: ReplaySample[] = [];
  for (let index = 1; index < samples.length; index += 1) {
    const previous = samples[index - 1];
    const sample = samples[index];
    const dtSec = Math.max(sample.t - previous.t, 1e-6);
    const livePreviousVolume = numberAt(previous, side.volumeKey);
    const previousLambda = lambdaFromVolume(side, previous, state.volumeMl);
    const cycleIndex = Math.floor(sample.phi);
    const timeSinceActivationSec = Math.max(0, (sample.phi - cycleIndex) * cycleLengthSec);
    const calcium = stepPrescribedCalciumTransientV1(
      state.calciumState,
      prescribedCalciumInput(cycleIndex + 1, timeSinceActivationSec, cycleLengthSec, point.contractilityScale, dtSec),
      PRESCRIBED_CALCIUM_SYNTHETIC_SMOKE_PARAMETER_SET,
    );
    state.calciumState = calcium.nextState;
    if (index === 1) state.previousFreeCalciumUM = calcium.output.freeCalciumUM;

    let estimateVolume = state.volumeMl;
    let bestAvStep: DynamicValveTransitionV1StepResult | null = null;
    let bestOutStep: DynamicValveTransitionV1StepResult | null = null;
    let bestSeriesElasticStep: SeriesElasticFiberStepResult | null = null;
    let previousPressureEstimate = numberAt(previous, side.chamberPressureKey);
    let pressureResidual = 0;
    let volumeResidual = 0;
    const iterations = Math.max(1, variant.picardIterations);
    for (let iteration = 0; iteration < iterations; iteration += 1) {
      const pressure = pressureForEstimate(
        variant,
        side,
        sample,
        estimateVolume,
        passiveSlope,
        pressurePerStress,
        state.seriesElasticState,
        previousLambda,
        calcium.output.freeCalciumUM,
        state.previousFreeCalciumUM,
        dtSec,
      );
      const avStep = stepDynamicValveTransitionV1(
        state.avValveState,
        {
          dtSec,
          upstreamPressureMmHg: numberAt(sample, side.atrialPressureKey),
          downstreamPressureMmHg: pressure.pressureMmHg,
        },
        paramsForValve(variant, side.avValve),
      );
      const outStep = stepDynamicValveTransitionV1(
        state.outValveState,
        {
          dtSec,
          upstreamPressureMmHg: pressure.pressureMmHg,
          downstreamPressureMmHg: numberAt(sample, side.arterialPressureKey),
        },
        paramsForValve(variant, side.outValve),
      );
      const nextVolume = state.volumeMl + dtSec * (avStep.flowMlPerSec - outStep.flowMlPerSec);
      pressureResidual = pressure.pressureMmHg - previousPressureEstimate;
      volumeResidual = nextVolume - estimateVolume;
      previousPressureEstimate = pressure.pressureMmHg;
      estimateVolume = estimateVolume + 0.65 * volumeResidual;
      bestAvStep = avStep;
      bestOutStep = outStep;
      bestSeriesElasticStep = pressure.seriesElasticStep;
    }

    const finalPressure = pressureForEstimate(
      variant,
      side,
      sample,
      estimateVolume,
      passiveSlope,
      pressurePerStress,
      state.seriesElasticState,
      previousLambda,
      calcium.output.freeCalciumUM,
      state.previousFreeCalciumUM,
      dtSec,
    );
    const avStep = bestAvStep ?? stepDynamicValveTransitionV1(
      state.avValveState,
      {
        dtSec,
        upstreamPressureMmHg: numberAt(sample, side.atrialPressureKey),
        downstreamPressureMmHg: finalPressure.pressureMmHg,
      },
      paramsForValve(variant, side.avValve),
    );
    const outStep = bestOutStep ?? stepDynamicValveTransitionV1(
      state.outValveState,
      {
        dtSec,
        upstreamPressureMmHg: finalPressure.pressureMmHg,
        downstreamPressureMmHg: numberAt(sample, side.arterialPressureKey),
      },
      paramsForValve(variant, side.outValve),
    );
    state.volumeMl += dtSec * (avStep.flowMlPerSec - outStep.flowMlPerSec);
    state.avValveState = avStep.nextState;
    state.outValveState = outStep.nextState;
    const committedSeriesElasticStep = finalPressure.seriesElasticStep ?? bestSeriesElasticStep;
    if (committedSeriesElasticStep?.ok) {
      state.seriesElasticState = committedSeriesElasticStep.nextState;
    }
    state.previousFreeCalciumUM = calcium.output.freeCalciumUM;

    replay.push({
      timeSec: sample.t,
      theta: phaseOf(sample),
      volumeMl: state.volumeMl,
      liveVolumeMl: numberAt(sample, side.volumeKey),
      chamberPressureMmHg: finalPressure.pressureMmHg,
      liveChamberPressureMmHg: numberAt(sample, side.chamberPressureKey),
      passivePressureMmHg: finalPressure.passivePressureMmHg,
      activePressureMmHg: finalPressure.activePressureMmHg,
      atrialPressureMmHg: numberAt(sample, side.atrialPressureKey),
      arterialPressureMmHg: numberAt(sample, side.arterialPressureKey),
      avFlowMlPerSec: avStep.flowMlPerSec,
      outFlowMlPerSec: outStep.flowMlPerSec,
      liveAvFlowMlPerSec: numberAt(sample, side.avFlowKey),
      liveOutFlowMlPerSec: numberAt(sample, side.outFlowKey),
      avOpen01: avStep.open01,
      outOpen01: outStep.open01,
      lambdaTotal: lambdaFromVolume(side, sample, state.volumeMl),
      lambdaSi: committedSeriesElasticStep?.lambdaSi ?? null,
      lambdaSe: committedSeriesElasticStep?.lambdaSe ?? null,
      sigmaCePa: committedSeriesElasticStep?.sigmaCePa ?? null,
      sigmaSePa: committedSeriesElasticStep?.sigmaSePa ?? null,
      sigmaMismatchPa: committedSeriesElasticStep?.sigmaMismatchPa ?? null,
      seElasticEnergyJm3: committedSeriesElasticStep?.elasticEnergyJm3 ?? null,
      picardPressureResidualMmHg: pressureResidual,
      picardVolumeResidualMl: volumeResidual,
      avQDotClampImpulseMlPerSec2: avStep.qDotClampImpulseMlPerSec2,
      outQDotClampImpulseMlPerSec2: outStep.qDotClampImpulseMlPerSec2,
      avDiodeImpulseMlPerSec: avStep.diodeImpulseMlPerSec,
      outDiodeImpulseMlPerSec: outStep.diodeImpulseMlPerSec,
      avAdversePressureGradientFlow01: avStep.adversePressureGradientFlow ? 1 : 0,
      outAdversePressureGradientFlow01: outStep.adversePressureGradientFlow ? 1 : 0,
    });
  }
  return replay;
}

function pressureForEstimate(
  variant: VariantSpec,
  side: SideSpec,
  sample: SimSample,
  volumeEstimateMl: number,
  passiveSlope: number,
  activePressurePerStress: number,
  previousSeriesElasticState: SeriesElasticFiberState | null,
  previousLambdaTotal: number,
  freeCalciumUM: number,
  previousFreeCalciumUM: number,
  dtSec: number,
): {
  readonly pressureMmHg: number;
  readonly passivePressureMmHg: number;
  readonly activePressureMmHg: number;
  readonly seriesElasticStep: SeriesElasticFiberStepResult | null;
} {
  const liveVolume = numberAt(sample, side.volumeKey);
  const livePressure = numberAt(sample, side.chamberPressureKey);
  const liveActivePressure = optionalNumber(sample, side.activePressureKey);
  const passivePressure = livePressure - liveActivePressure + passiveSlope * (volumeEstimateMl - liveVolume);
  if (variant.pressureMode === "live-pressure") {
    return {
      pressureMmHg: livePressure,
      passivePressureMmHg: livePressure - liveActivePressure,
      activePressureMmHg: liveActivePressure,
      seriesElasticStep: null,
    };
  }
  if (variant.pressureMode === "linear-pressure" || !variant.seriesElastic || !previousSeriesElasticState) {
    const pressureMmHg = passivePressure + liveActivePressure;
    return {
      pressureMmHg,
      passivePressureMmHg: passivePressure,
      activePressureMmHg: liveActivePressure,
      seriesElasticStep: null,
    };
  }
  const stageLambdaTotal = lambdaFromVolume(side, sample, volumeEstimateMl);
  const seriesElasticStep = stepSeriesElasticLandFiberV1(
    previousSeriesElasticState,
    {
      freeCalciumUM,
      previousFreeCalciumUM,
      previousLambdaTotal,
      stageLambdaTotal,
      dtSec,
    },
    variant.seriesElastic,
  );
  const transmittedStress = seriesElasticStep.ok ? Math.max(0, seriesElasticStep.sigmaSePa) : 0;
  const activePressure = activePressurePerStress * transmittedStress;
  return {
    pressureMmHg: passivePressure + activePressure,
    passivePressureMmHg: passivePressure,
    activePressureMmHg: activePressure,
    seriesElasticStep,
  };
}

function liveReferenceSamples(side: SideSpec, samples: readonly SimSample[]): readonly ReplaySample[] {
  return samples.map((sample) => ({
    timeSec: sample.t,
    theta: phaseOf(sample),
    volumeMl: numberAt(sample, side.volumeKey),
    liveVolumeMl: numberAt(sample, side.volumeKey),
    chamberPressureMmHg: numberAt(sample, side.chamberPressureKey),
    liveChamberPressureMmHg: numberAt(sample, side.chamberPressureKey),
    passivePressureMmHg: numberAt(sample, side.chamberPressureKey) - optionalNumber(sample, side.activePressureKey),
    activePressureMmHg: optionalNumber(sample, side.activePressureKey),
    atrialPressureMmHg: numberAt(sample, side.atrialPressureKey),
    arterialPressureMmHg: numberAt(sample, side.arterialPressureKey),
    avFlowMlPerSec: numberAt(sample, side.avFlowKey),
    outFlowMlPerSec: numberAt(sample, side.outFlowKey),
    liveAvFlowMlPerSec: numberAt(sample, side.avFlowKey),
    liveOutFlowMlPerSec: numberAt(sample, side.outFlowKey),
    avOpen01: numberAt(sample, side.avOpenKey),
    outOpen01: numberAt(sample, side.outOpenKey),
    lambdaTotal: numberAt(sample, side.fiberLambdaKey),
    lambdaSi: null,
    lambdaSe: null,
    sigmaCePa: optionalNumber(sample, side.activeStressKey),
    sigmaSePa: optionalNumber(sample, side.activeStressKey),
    sigmaMismatchPa: null,
    seElasticEnergyJm3: null,
    picardPressureResidualMmHg: 0,
    picardVolumeResidualMl: 0,
    avQDotClampImpulseMlPerSec2: 0,
    outQDotClampImpulseMlPerSec2: 0,
    avDiodeImpulseMlPerSec: 0,
    outDiodeImpulseMlPerSec: 0,
    avAdversePressureGradientFlow01: adversePressureGradientFlow(
      numberAt(sample, side.atrialPressureKey) - numberAt(sample, side.chamberPressureKey),
      numberAt(sample, side.avFlowKey),
    ) ? 1 : 0,
    outAdversePressureGradientFlow01: adversePressureGradientFlow(
      numberAt(sample, side.chamberPressureKey) - numberAt(sample, side.arterialPressureKey),
      numberAt(sample, side.outFlowKey),
    ) ? 1 : 0,
  }));
}

function computeMetrics(
  side: SideSpec,
  liveBeat: readonly SimSample[],
  replayBeat: readonly ReplaySample[],
): SubsystemMetrics {
  if (replayBeat.length < 8) return emptyMetrics();
  const flowMax = Math.max(0, ...replayBeat.map((sample) => sample.outFlowMlPerSec));
  const ejectionThreshold = Math.max(side.id === "LV" ? 10 : 5, 0.08 * flowMax);
  const ejection = replayBeat.filter((sample) => sample.outFlowMlPerSec > ejectionThreshold);
  const pressureSpan = valueRange(ejection.map((sample) => sample.chamberPressureMmHg));
  const prominence = Math.max(side.id === "LV" ? 4 : 1.2, 0.10 * pressureSpan);
  const pvPeakCount = prominentExtremaCount(ejection.map((sample) => sample.chamberPressureMmHg), "max", prominence);
  const pvTroughCount = prominentExtremaCount(ejection.map((sample) => sample.chamberPressureMmHg), "min", prominence);
  const pvRoughness = totalVariation(ejection.map((sample) => sample.chamberPressureMmHg)) / Math.max(pressureSpan, 1e-6);
  const pvOk = ejection.length >= 8 && pvPeakCount <= 1 && pvTroughCount === 0 && pvRoughness < 2.4;
  const peaks = positivePeaksDetailed(replayBeat, "avFlowMlPerSec", 0.12, 20);
  const diastolic = peaks.filter((peak) => phaseInWindow(peak.theta, 0.25, 0.12));
  const ePeak = maxPeak(peaks.filter((peak) => phaseInWindow(peak.theta, 0.30, 0.75)));
  const aPeak = maxPeak(peaks.filter((peak) => phaseInWindow(peak.theta, 0.85, 0.08)));
  const extraPeaks = diastolic
    .filter((peak) => peak !== ePeak && peak !== aPeak)
    .sort((a, b) => b.value - a.value);
  const extraPeak = extraPeaks[0] ?? null;
  const avExtraPeakCount = Math.max(0, diastolic.length - 2);
  const avFlowOk = Boolean(ePeak && aPeak) && avExtraPeakCount === 0;
  const liveForwardAvVolumeMl = integratePositive(liveBeat.map((sample) => numberAt(sample, side.avFlowKey)), liveDt(liveBeat));
  const liveForwardOutVolumeMl = integratePositive(liveBeat.map((sample) => numberAt(sample, side.outFlowKey)), liveDt(liveBeat));
  const replayForwardAvVolumeMl = integratePositive(replayBeat.map((sample) => sample.avFlowMlPerSec), replayDt(replayBeat));
  const replayForwardOutVolumeMl = integratePositive(replayBeat.map((sample) => sample.outFlowMlPerSec), replayDt(replayBeat));
  const avForwardVolumeRatio = ratioOrNull(replayForwardAvVolumeMl, liveForwardAvVolumeMl);
  const outForwardVolumeRatio = ratioOrNull(replayForwardOutVolumeMl, liveForwardOutVolumeMl);
  const volumeDriftMl = replayBeat.at(-1)!.volumeMl - replayBeat[0].volumeMl;
  const maxAbsSigmaMismatchPa = finiteMaxOrNull(replayBeat.map((sample) => Math.abs(sample.sigmaMismatchPa ?? Number.NaN)));
  const maxSeElasticEnergyJm3 = finiteMaxOrNull(replayBeat.map((sample) => sample.seElasticEnergyJm3 ?? Number.NaN));
  const firstEnergy = firstFinite(replayBeat.map((sample) => sample.seElasticEnergyJm3 ?? Number.NaN));
  const lastEnergy = lastFinite(replayBeat.map((sample) => sample.seElasticEnergyJm3 ?? Number.NaN));
  const seEnergyDriftJm3 = firstEnergy == null || lastEnergy == null ? null : lastEnergy - firstEnergy;
  const boundedSeriesElasticEnergy =
    maxSeElasticEnergyJm3 == null
      ? null
      : maxSeElasticEnergyJm3 < 2_500 && Math.abs(seEnergyDriftJm3 ?? 0) < 500 && (maxAbsSigmaMismatchPa ?? 0) < 12_000;
  const outputPreserved =
    ratioInRange(avForwardVolumeRatio, 0.65, 1.35)
    && ratioInRange(outForwardVolumeRatio, 0.65, 1.35)
    && Math.abs(volumeDriftMl) < Math.max(25, 0.35 * Math.max(replayForwardAvVolumeMl, replayForwardOutVolumeMl, 1));
  return {
    finalBeatSampleCount: replayBeat.length,
    pvOk,
    pvPeakCount,
    pvTroughCount,
    pvRoughness: round(pvRoughness),
    ejectionSampleCount: ejection.length,
    avFlowOk,
    avDiastolicPeakCount: diastolic.length,
    avExtraPeakCount,
    avAOverE: ePeak && aPeak ? round(aPeak.value / Math.max(ePeak.value, 1e-9)) : null,
    avExtraPeakProminenceRatio: extraPeak && ePeak ? round(extraPeak.value / Math.max(ePeak.value, 1e-9)) : null,
    liveForwardAvVolumeMl: round(liveForwardAvVolumeMl),
    replayForwardAvVolumeMl: round(replayForwardAvVolumeMl),
    liveForwardOutVolumeMl: round(liveForwardOutVolumeMl),
    replayForwardOutVolumeMl: round(replayForwardOutVolumeMl),
    avForwardVolumeRatio: avForwardVolumeRatio == null ? null : round(avForwardVolumeRatio),
    outForwardVolumeRatio: outForwardVolumeRatio == null ? null : round(outForwardVolumeRatio),
    volumeDriftMl: round(volumeDriftMl),
    maxAbsPicardPressureResidualMmHg: round(maxFinite(replayBeat.map((sample) => Math.abs(sample.picardPressureResidualMmHg)))),
    maxAbsPicardVolumeResidualMl: round(maxFinite(replayBeat.map((sample) => Math.abs(sample.picardVolumeResidualMl)))),
    maxAbsSigmaMismatchPa: maxAbsSigmaMismatchPa == null ? null : round(maxAbsSigmaMismatchPa),
    maxSeElasticEnergyJm3: maxSeElasticEnergyJm3 == null ? null : round(maxSeElasticEnergyJm3),
    seEnergyDriftJm3: seEnergyDriftJm3 == null ? null : round(seEnergyDriftJm3),
    boundedSeriesElasticEnergy,
    avQDotClampDutyFraction: round(fraction(replayBeat, (sample) => Math.abs(sample.avQDotClampImpulseMlPerSec2) > 1e-6)),
    outQDotClampDutyFraction: round(fraction(replayBeat, (sample) => Math.abs(sample.outQDotClampImpulseMlPerSec2) > 1e-6)),
    avAdverseGradientFlowFraction: round(fraction(replayBeat, (sample) => sample.avAdversePressureGradientFlow01 > 0.5)),
    outAdverseGradientFlowFraction: round(fraction(replayBeat, (sample) => sample.outAdversePressureGradientFlow01 > 0.5)),
    outputPreserved,
    grossOk: pvOk && avFlowOk && outputPreserved && (boundedSeriesElasticEnergy !== false),
  };
}

function paramsForValve(variant: VariantSpec, valve: ValveSpec): DynamicValveTransitionV1Parameters {
  const dynamic = variant.valveMode === "dynamic-5bu-best";
  return {
    mechanismId: `${DYNAMIC_VALVE_TRANSITION_V1_ID}:${variant.valveMode}:${valve.id}`,
    updateMode: dynamic ? "consistent-loss" : "current-loss",
    openMode: dynamic ? "hysteretic-ode" : "source-ode",
    reverseMode: dynamic ? "soft-open-scaled-reverse" : "hard-diode",
    resistanceMmHgSecPerMl: valve.resistanceMmHgSecPerMl,
    bernoulliMmHgSec2PerMl2: valve.bernoulliMmHgSec2PerMl2,
    inertanceMmHgSec2PerMl: valve.inertanceMmHgSec2PerMl,
    openGainPerMmHg: valve.openGainPerMmHg,
    sourceDeadbandMmHg: valve.sourceDeadbandMmHg,
    openThresholdMmHg: dynamic ? 0.15 : 0,
    closeThresholdMmHg: dynamic ? -0.3 : 0,
    tauOpenSec: valve.tauOpenSec,
    tauCloseSec: dynamic ? valve.tauCloseSec * 2.2 : valve.tauCloseSec,
    minEffectiveOpen01: dynamic ? 0.08 : 1,
    lossScalesWithOpenArea: dynamic,
    reverseFlowLimitMlPerSec: dynamic ? 18 : 0,
    reverseSmoothingEpsilonMlPerSec: dynamic ? 2.5 : 1,
    qDotLimitMlPerSec2: 40_000,
  };
}

function valveSpec(id: AvValveId | OutValveId): ValveSpec {
  if (id === "MV") {
    return {
      id,
      resistanceMmHgSecPerMl: DEFAULT_PARAMS.MV_R,
      bernoulliMmHgSec2PerMl2: DEFAULT_PARAMS.MV_B,
      inertanceMmHgSec2PerMl: DEFAULT_PARAMS.MV_L,
      openGainPerMmHg: DEFAULT_PARAMS.MV_kOpen,
      sourceDeadbandMmHg: 0.25,
      tauOpenSec: DEFAULT_PARAMS.MV_tauOpen,
      tauCloseSec: DEFAULT_PARAMS.MV_tauClose,
    };
  }
  if (id === "AoV") {
    return {
      id,
      resistanceMmHgSecPerMl: DEFAULT_PARAMS.AoV_R,
      bernoulliMmHgSec2PerMl2: DEFAULT_PARAMS.AoV_B,
      inertanceMmHgSec2PerMl: DEFAULT_PARAMS.AoV_L * 2,
      openGainPerMmHg: DEFAULT_PARAMS.AoV_kOpen,
      sourceDeadbandMmHg: 0,
      tauOpenSec: DEFAULT_PARAMS.AoV_tauOpen,
      tauCloseSec: DEFAULT_PARAMS.AoV_tauClose,
    };
  }
  if (id === "TV") {
    return {
      id,
      resistanceMmHgSecPerMl: DEFAULT_PARAMS.TV_R,
      bernoulliMmHgSec2PerMl2: DEFAULT_PARAMS.TV_B,
      inertanceMmHgSec2PerMl: DEFAULT_PARAMS.TV_L,
      openGainPerMmHg: DEFAULT_PARAMS.TV_kOpen,
      sourceDeadbandMmHg: 0,
      tauOpenSec: DEFAULT_PARAMS.TV_tauOpen,
      tauCloseSec: DEFAULT_PARAMS.TV_tauClose,
    };
  }
  return {
    id,
    resistanceMmHgSecPerMl: DEFAULT_PARAMS.PV_R,
    bernoulliMmHgSec2PerMl2: DEFAULT_PARAMS.PV_B,
    inertanceMmHgSec2PerMl: DEFAULT_PARAMS.PV_L,
    openGainPerMmHg: DEFAULT_PARAMS.PV_kOpen,
    sourceDeadbandMmHg: 0,
    tauOpenSec: DEFAULT_PARAMS.PV_tauOpen,
    tauCloseSec: DEFAULT_PARAMS.PV_tauClose,
  };
}

function estimatePassiveSlope(side: SideSpec, samples: readonly SimSample[]): number {
  const values: number[] = [];
  for (let index = 1; index < samples.length; index += 1) {
    const prev = samples[index - 1];
    const cur = samples[index];
    const active = Math.max(optionalNumber(cur, side.activePressureKey), optionalNumber(prev, side.activePressureKey));
    if (active > 0.25 * maxActivePressure(side, samples)) continue;
    const dV = numberAt(cur, side.volumeKey) - numberAt(prev, side.volumeKey);
    const pPrev = numberAt(prev, side.chamberPressureKey) - optionalNumber(prev, side.activePressureKey);
    const pCur = numberAt(cur, side.chamberPressureKey) - optionalNumber(cur, side.activePressureKey);
    const dP = pCur - pPrev;
    if (Math.abs(dV) < 0.05) continue;
    const slope = dP / dV;
    if (Number.isFinite(slope) && slope > 0) values.push(slope);
  }
  const [lo, hi] = side.passiveSlopeBounds;
  return clamp(median(values) ?? (side.id === "LV" ? 0.08 : 0.035), lo, hi);
}

function estimateActivePressurePerStress(side: SideSpec, samples: readonly SimSample[]): number {
  const ratios = samples
    .map((sample) => {
      const stress = optionalNumber(sample, side.activeStressKey);
      const pressure = optionalNumber(sample, side.activePressureKey);
      return stress > 50 && pressure > 0 ? pressure / stress : Number.NaN;
    })
    .filter(Number.isFinite);
  const [lo, hi] = side.activePressurePerStressBounds;
  return clamp(median(ratios) ?? (side.id === "LV" ? 0.006 : 0.003), lo, hi);
}

function lambdaFromVolume(side: SideSpec, sample: SimSample, volumeMl: number): number {
  const liveVolume = Math.max(numberAt(sample, side.volumeKey), 1);
  const liveLambda = numberAt(sample, side.fiberLambdaKey);
  return clamp(liveLambda * Math.cbrt(Math.max(volumeMl, 1) / liveVolume), 0.65, 1.35);
}

function summarizeVariant(variant: VariantSpec, results: readonly RunResult[]): VariantSummary {
  const measured = results.filter((result) => result.variantId === variant.id && result.measured);
  return {
    variantId: variant.id,
    measuredCount: measured.length,
    grossOkCount: measured.filter((result) => result.metrics.grossOk).length,
    lvMeasuredCount: measured.filter((result) => result.side === "LV").length,
    rvMeasuredCount: measured.filter((result) => result.side === "RV").length,
    lvGrossOkCount: measured.filter((result) => result.side === "LV" && result.metrics.grossOk).length,
    rvGrossOkCount: measured.filter((result) => result.side === "RV" && result.metrics.grossOk).length,
    pvOkCount: measured.filter((result) => result.metrics.pvOk).length,
    avFlowOkCount: measured.filter((result) => result.metrics.avFlowOk).length,
    outputPreservedCount: measured.filter((result) => result.metrics.outputPreserved).length,
    boundedSeriesElasticEnergyCount: measured.filter((result) => result.metrics.boundedSeriesElasticEnergy !== false).length,
    meanPvPeakCount: round(mean(measured.map((result) => result.metrics.pvPeakCount))),
    meanAvDiastolicPeakCount: round(mean(measured.map((result) => result.metrics.avDiastolicPeakCount))),
    meanAvExtraPeakCount: round(mean(measured.map((result) => result.metrics.avExtraPeakCount))),
    meanMaxAbsPicardPressureResidualMmHg: round(mean(measured.map((result) => result.metrics.maxAbsPicardPressureResidualMmHg))),
    meanMaxAbsPicardVolumeResidualMl: round(mean(measured.map((result) => result.metrics.maxAbsPicardVolumeResidualMl))),
    failedPointSides: measured
      .filter((result) => !result.metrics.grossOk)
      .map((result) => `${result.pointId}/${result.side}`),
  };
}

function classify(summaries: readonly VariantSummary[]): Classification {
  const live = requiredSummary(summaries, "live-source-reference");
  const candidates = summaries.filter((summary) => summary.variantId !== "live-source-reference");
  const best = [...candidates].sort((a, b) => {
    if (b.grossOkCount !== a.grossOkCount) return b.grossOkCount - a.grossOkCount;
    if (b.avFlowOkCount !== a.avFlowOkCount) return b.avFlowOkCount - a.avFlowOkCount;
    if (b.pvOkCount !== a.pvOkCount) return b.pvOkCount - a.pvOkCount;
    return b.outputPreservedCount - a.outputPreservedCount;
  })[0] ?? live;
  const decision =
    best.grossOkCount >= 14 && best.lvGrossOkCount >= 7 && best.rvGrossOkCount >= 7
      ? "supported-for-runtime-shadow"
      : best.grossOkCount >= Math.max(live.grossOkCount + 4, 6)
        ? "partial-local-subsystem-signal"
        : "not-supported";
  return {
    liveUser0GrossPass: `${live.grossOkCount}/${live.measuredCount}`,
    bestPicardVariant:
      `${best.variantId}:gross=${best.grossOkCount}/${best.measuredCount},lv=${best.lvGrossOkCount}/${best.lvMeasuredCount},rv=${best.rvGrossOkCount}/${best.rvMeasuredCount},pv=${best.pvOkCount}/${best.measuredCount},av=${best.avFlowOkCount}/${best.measuredCount},output=${best.outputPreservedCount}/${best.measuredCount}`,
    lvSubsystemDecision: decision,
    notes: [
      "This is a local ventricular subsystem replay with live atrial/arterial pressure boundaries, not a closed-loop runtime implementation.",
      "SeriesElasticV1 candidates use synthetic prescribed calcium and live-derived pressure-per-stress scaling; they are component evidence, not source-state-controlled physiology acceptance.",
      "The decision requires envelope improvement across LV/RV PV domes plus MVF/TVF, not normal-point screenshot cleanup.",
    ],
  };
}

function recommendedNext(classification: Classification): readonly string[] {
  if (classification.lvSubsystemDecision === "supported-for-runtime-shadow") {
    return [
      "promote the best composition to an off-by-default closed-loop runtime shadow over the same morphology envelope",
      "keep LandAtrial tuning paused until LV/RV PV plus MVF/TVF remain robust in closed loop",
      "audit qDot clamp and valve/load work before any default adoption",
    ];
  }
  if (classification.lvSubsystemDecision === "partial-local-subsystem-signal") {
    return [
      "use the best local composition to design the next closed-loop shadow only if residual failures localize cleanly",
      "do not adopt SeriesElasticV1 or DynamicValveTransitionV1 standalone from this result",
      "separate residual AV-plane/effective-wall release timing only after LV/RV subsystem morphology improves without output loss",
    ];
  }
  return [
    "do not wire the tested local subsystem composition into runtime defaults",
    "treat the result as evidence that a larger local coupled step or different chamber-pressure adapter is needed before LandAtrial calibration resumes",
    "keep the current user-0 closure morphology-blocked over the representative envelope",
  ];
}

function requiredTrace(traces: readonly LiveTrace[], pointId: PointId): LiveTrace {
  const trace = traces.find((entry) => entry.pointId === pointId);
  if (!trace) throw new Error(`missing live trace for ${pointId}`);
  return trace;
}

function requiredSummary(summaries: readonly VariantSummary[], variantId: VariantId): VariantSummary {
  const summary = summaries.find((entry) => entry.variantId === variantId);
  if (!summary) throw new Error(`missing summary for ${variantId}`);
  return summary;
}

function finalBeatSamples(samples: readonly ReplaySample[]): readonly ReplaySample[] {
  if (samples.length < 3) return [];
  const wrapIndexes: number[] = [];
  for (let index = 1; index < samples.length; index += 1) {
    if (samples[index].theta < samples[index - 1].theta) wrapIndexes.push(index);
  }
  if (wrapIndexes.length >= 2) {
    return samples.slice(wrapIndexes[wrapIndexes.length - 2], wrapIndexes[wrapIndexes.length - 1]);
  }
  if (wrapIndexes.length === 1) return samples.slice(wrapIndexes[0]);
  return samples;
}

function previewFinalBeat(samples: readonly ReplaySample[]): readonly ReplaySample[] {
  if (samples.length <= FINAL_BEAT_PREVIEW_SAMPLES) return samples.map(previewSample);
  const out: ReplaySample[] = [];
  for (let index = 0; index < FINAL_BEAT_PREVIEW_SAMPLES; index += 1) {
    const sourceIndex = Math.min(samples.length - 1, Math.round(index * (samples.length - 1) / (FINAL_BEAT_PREVIEW_SAMPLES - 1)));
    out.push(previewSample(samples[sourceIndex]));
  }
  return out;
}

function previewSample(sample: ReplaySample): ReplaySample {
  return {
    ...sample,
    timeSec: round(sample.timeSec),
    theta: round(sample.theta),
    volumeMl: round(sample.volumeMl),
    liveVolumeMl: round(sample.liveVolumeMl),
    chamberPressureMmHg: round(sample.chamberPressureMmHg),
    liveChamberPressureMmHg: round(sample.liveChamberPressureMmHg),
    passivePressureMmHg: round(sample.passivePressureMmHg),
    activePressureMmHg: round(sample.activePressureMmHg),
    atrialPressureMmHg: round(sample.atrialPressureMmHg),
    arterialPressureMmHg: round(sample.arterialPressureMmHg),
    avFlowMlPerSec: round(sample.avFlowMlPerSec),
    outFlowMlPerSec: round(sample.outFlowMlPerSec),
    liveAvFlowMlPerSec: round(sample.liveAvFlowMlPerSec),
    liveOutFlowMlPerSec: round(sample.liveOutFlowMlPerSec),
    avOpen01: round(sample.avOpen01),
    outOpen01: round(sample.outOpen01),
    lambdaTotal: round(sample.lambdaTotal),
    lambdaSi: sample.lambdaSi == null ? null : round(sample.lambdaSi),
    lambdaSe: sample.lambdaSe == null ? null : round(sample.lambdaSe),
    sigmaCePa: sample.sigmaCePa == null ? null : round(sample.sigmaCePa),
    sigmaSePa: sample.sigmaSePa == null ? null : round(sample.sigmaSePa),
    sigmaMismatchPa: sample.sigmaMismatchPa == null ? null : round(sample.sigmaMismatchPa),
    seElasticEnergyJm3: sample.seElasticEnergyJm3 == null ? null : round(sample.seElasticEnergyJm3),
    picardPressureResidualMmHg: round(sample.picardPressureResidualMmHg),
    picardVolumeResidualMl: round(sample.picardVolumeResidualMl),
    avQDotClampImpulseMlPerSec2: round(sample.avQDotClampImpulseMlPerSec2),
    outQDotClampImpulseMlPerSec2: round(sample.outQDotClampImpulseMlPerSec2),
    avDiodeImpulseMlPerSec: round(sample.avDiodeImpulseMlPerSec),
    outDiodeImpulseMlPerSec: round(sample.outDiodeImpulseMlPerSec),
    avAdversePressureGradientFlow01: sample.avAdversePressureGradientFlow01,
    outAdversePressureGradientFlow01: sample.outAdversePressureGradientFlow01,
  };
}

function positivePeaksDetailed(
  samples: readonly ReplaySample[],
  key: "avFlowMlPerSec" | "outFlowMlPerSec",
  minProminenceFraction: number,
  minAbsoluteProminence: number,
): readonly { theta: number; value: number; prominence: number }[] {
  if (samples.length < 3) return [];
  const values = samples.map((sample) => sample[key]);
  const span = valueRange(values);
  const minProminence = Math.max(minAbsoluteProminence, minProminenceFraction * span);
  const peaks: { theta: number; value: number; prominence: number }[] = [];
  for (let index = 1; index < samples.length - 1; index += 1) {
    const prev = values[index - 1];
    const cur = values[index];
    const next = values[index + 1];
    if (cur <= 5 || cur < prev || cur <= next) continue;
    const leftMin = Math.min(...values.slice(Math.max(0, index - 8), index + 1));
    const rightMin = Math.min(...values.slice(index, Math.min(values.length, index + 9)));
    const prominence = cur - Math.max(leftMin, rightMin);
    if (prominence < minProminence) continue;
    const last = peaks.at(-1);
    if (!last || Math.abs(samples[index].theta - last.theta) > 0.07) {
      peaks.push({ theta: samples[index].theta, value: cur, prominence });
    } else if (cur > last.value) {
      last.theta = samples[index].theta;
      last.value = cur;
      last.prominence = prominence;
    }
  }
  return peaks.sort((a, b) => b.value - a.value);
}

function prominentExtremaCount(values: readonly number[], mode: "max" | "min", prominence: number): number {
  if (values.length < 3) return 0;
  let count = 0;
  for (let index = 1; index < values.length - 1; index += 1) {
    const prev = values[index - 1];
    const cur = values[index];
    const next = values[index + 1];
    const isExtremum = mode === "max"
      ? cur >= prev && cur > next
      : cur <= prev && cur < next;
    if (!isExtremum) continue;
    const left = values.slice(Math.max(0, index - 8), index + 1);
    const right = values.slice(index, Math.min(values.length, index + 9));
    const baseline = mode === "max"
      ? Math.max(Math.min(...left), Math.min(...right))
      : Math.min(Math.max(...left), Math.max(...right));
    const prom = mode === "max" ? cur - baseline : baseline - cur;
    if (prom >= prominence) count += 1;
  }
  return count;
}

function maxPeak<T extends { readonly value: number }>(peaks: readonly T[]): T | null {
  if (peaks.length === 0) return null;
  return peaks.reduce((best, peak) => peak.value > best.value ? peak : best, peaks[0]);
}

function prescribedCalciumInput(
  beatIndex: number,
  timeSinceActivationSec: number,
  cycleLengthSec: number,
  contractilityScale: number,
  dtSec: number,
): PrescribedCalciumInput {
  return {
    targetId: "phase5bv-subsystem-prescribed-ca",
    activationEventId: beatIndex,
    timeSinceActivationSec,
    cycleLengthSec,
    dtSec,
    activationStrength01: clamp(contractilityScale, 0.6, 1),
  };
}

function seriesElasticParams(seriesStiffnessPa: number, seriesDampingPaSec: number): SeriesElasticFiberParameters {
  return {
    ...DEFAULT_SERIES_ELASTIC_FIBER_PARAMETERS,
    seriesStiffnessPa,
    seriesDampingPaSec,
    maxLambdaSeAbs: 0.08,
    maxForceBalanceIterations: 12,
    forceBalanceTolerancePa: 500,
  };
}

function sideDigest(side: SideSpec): SideDigest {
  return {
    id: side.id,
    avValveId: side.avValveId,
    outValveId: side.outValveId,
    passiveSlopeBounds: side.passiveSlopeBounds,
    activePressurePerStressBounds: side.activePressurePerStressBounds,
  };
}

function metricDigest(metrics: SimMetrics): MetricDigest {
  return {
    AoPMean: round(metrics.AoPMean),
    PAPMean: round(metrics.PAPMean),
    CO_L: round(metrics.CO_L),
    CO_R: round(metrics.CO_R),
    LAPMean: round(metrics.LAPMean),
    RAPMean: round(metrics.RAPMean),
    EF_LApprox: round(metrics.EF_LApprox),
    EF_RApprox: round(metrics.EF_RApprox),
  };
}

function numberAt(sample: SimSample, key: keyof SimSample): number {
  const value = Number(sample[key]);
  return Number.isFinite(value) ? value : 0;
}

function optionalNumber(sample: SimSample, key: keyof SimSample): number {
  const value = Number(sample[key]);
  return Number.isFinite(value) ? value : 0;
}

function maxActivePressure(side: SideSpec, samples: readonly SimSample[]): number {
  return maxFinite(samples.map((sample) => optionalNumber(sample, side.activePressureKey)));
}

function liveDt(samples: readonly SimSample[]): number {
  if (samples.length < 2) return profile.dt;
  return Math.max(samples[1].t - samples[0].t, 1e-6);
}

function replayDt(samples: readonly ReplaySample[]): number {
  if (samples.length < 2) return profile.dt;
  return Math.max(samples[1].timeSec - samples[0].timeSec, 1e-6);
}

function integratePositive(values: readonly number[], dtSec: number): number {
  return values.reduce((sum, value) => sum + Math.max(0, value) * dtSec, 0);
}

function ratioOrNull(numerator: number, denominator: number): number | null {
  return Math.abs(denominator) < 1e-9 ? null : numerator / denominator;
}

function ratioInRange(value: number | null, lo: number, hi: number): boolean {
  return value != null && value >= lo && value <= hi;
}

function adversePressureGradientFlow(dPMmHg: number, flowMlPerSec: number): boolean {
  return (dPMmHg < -0.75 && flowMlPerSec > 10) || (dPMmHg > 0.75 && flowMlPerSec < -10);
}

function emptyMetrics(): SubsystemMetrics {
  return {
    finalBeatSampleCount: 0,
    pvOk: false,
    pvPeakCount: 0,
    pvTroughCount: 0,
    pvRoughness: 0,
    ejectionSampleCount: 0,
    avFlowOk: false,
    avDiastolicPeakCount: 0,
    avExtraPeakCount: 0,
    avAOverE: null,
    avExtraPeakProminenceRatio: null,
    liveForwardAvVolumeMl: 0,
    replayForwardAvVolumeMl: 0,
    liveForwardOutVolumeMl: 0,
    replayForwardOutVolumeMl: 0,
    avForwardVolumeRatio: null,
    outForwardVolumeRatio: null,
    volumeDriftMl: 0,
    maxAbsPicardPressureResidualMmHg: 0,
    maxAbsPicardVolumeResidualMl: 0,
    maxAbsSigmaMismatchPa: null,
    maxSeElasticEnergyJm3: null,
    seEnergyDriftJm3: null,
    boundedSeriesElasticEnergy: null,
    avQDotClampDutyFraction: 0,
    outQDotClampDutyFraction: 0,
    avAdverseGradientFlowFraction: 0,
    outAdverseGradientFlowFraction: 0,
    outputPreserved: false,
    grossOk: false,
  };
}

function valueRange(values: readonly number[]): number {
  const finite = values.filter(Number.isFinite);
  if (finite.length === 0) return 0;
  return Math.max(...finite) - Math.min(...finite);
}

function totalVariation(values: readonly number[]): number {
  let total = 0;
  for (let index = 1; index < values.length; index += 1) {
    total += Math.abs(values[index] - values[index - 1]);
  }
  return total;
}

function maxFinite(values: readonly number[]): number {
  const finite = values.filter(Number.isFinite);
  return finite.length === 0 ? 0 : Math.max(...finite);
}

function finiteMaxOrNull(values: readonly number[]): number | null {
  const finite = values.filter(Number.isFinite);
  return finite.length === 0 ? null : Math.max(...finite);
}

function firstFinite(values: readonly number[]): number | null {
  return values.find(Number.isFinite) ?? null;
}

function lastFinite(values: readonly number[]): number | null {
  for (let index = values.length - 1; index >= 0; index -= 1) {
    if (Number.isFinite(values[index])) return values[index];
  }
  return null;
}

function mean(values: readonly number[]): number {
  const finite = values.filter(Number.isFinite);
  if (finite.length === 0) return 0;
  return finite.reduce((sum, value) => sum + value, 0) / finite.length;
}

function median(values: readonly number[]): number | null {
  const finite = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (finite.length === 0) return null;
  const mid = Math.floor(finite.length / 2);
  return finite.length % 2 === 0 ? 0.5 * (finite[mid - 1] + finite[mid]) : finite[mid];
}

function fraction<T>(values: readonly T[], predicate: (value: T) => boolean): number {
  if (values.length === 0) return 0;
  return values.filter(predicate).length / values.length;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function round(value: number): number {
  if (!Number.isFinite(value)) return value;
  return Math.round(value * 1_000_000) / 1_000_000;
}

function hashStable(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(sortJson(value))).digest("hex");
}

function sortJson(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortJson);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, entry]) => [key, sortJson(entry)]),
    );
  }
  return value;
}

function writeEvidence(): void {
  const evidence = buildLvSubsystemBenchPhase5BVEvidence();
  const outputPath = path.resolve(process.cwd(), LV_SUBSYSTEM_BENCH_PHASE5BV_RESULT_PATH);
  mkdirSync(path.dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(evidence, null, 2)}\n`);
  console.log(JSON.stringify({
    id: evidence.id,
    path: LV_SUBSYSTEM_BENCH_PHASE5BV_RESULT_PATH,
    hash: evidence.normalizedSha256,
    classification: evidence.classification,
  }, null, 2));
}

const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : "";
if (import.meta.url === invokedPath) {
  writeEvidence();
}
