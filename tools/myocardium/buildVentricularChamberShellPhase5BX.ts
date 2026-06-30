import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { DEFAULT_PARAMS } from "@/constants";
import { measureSteady, settleToSteadyState } from "@/engine/measure";
import {
  createModelCoreLand2017LvSourceProviderInstrumentation,
  type ModelCoreLand2017LvSourceProviderTraceSample,
} from "@/engine/myocardium/modelCoreLand2017LvSourceProvider";
import {
  MODELCORE_RUNTIME_ALL_CHAMBER_LANDATRIAL_DEFAULT_MODE,
  resolveModelCoreRuntimeActiveSource,
} from "@/engine/myocardium/runtimeActiveSource";
import { MODELCORE_RUNTIME_ROOT_ZC_SOURCED_BOUNDARY_ROOT_DEFAULT_MODE } from "@/engine/myocardium/runtimeRootZc";
import {
  DEFAULT_SERIES_ELASTIC_FIBER_PARAMETERS,
  SERIES_ELASTIC_FIBER_ADAPTER_V1_ID,
} from "@/engine/myocardium/seriesElasticFiberAdapter";
import {
  VENTRICULAR_CHAMBER_SHELL_V1_ID,
  initialVentricularChamberShellState,
  stepVentricularChamberShellV1,
  type VentricularChamberShellParameters,
} from "@/engine/myocardium/ventricularChamberShell";
import type { CoreRuntimeParams, SimMetrics, SimSample, SimulationHealth } from "@/engine/protocol";
import type { SettleStatus } from "@/engine/settling";
import {
  DYNAMIC_VALVE_TRANSITION_V1_ID,
  type DynamicValveTransitionV1Parameters,
} from "@/engine/valves/dynamicValveTransitionV1";
import { morphologyCheckSummaryFromSamples, type MorphologyBadgeSummary } from "@/engine/verification/morphologyCheck";
import { lastCompleteBeat, phaseInWindow, phaseOf } from "@/engine/verification/shapeMetrics";
import { resolveVerificationProfile } from "@/engine/verification/profiles";

export const VENTRICULAR_CHAMBER_SHELL_PHASE5BX_ID =
  "ventricular-chamber-shell-phase5bx-result-v1" as const;
export const VENTRICULAR_CHAMBER_SHELL_PHASE5BX_RESULT_PATH =
  "data/myocardium/protocols/ventricular-chamber-shell-phase5bx-result-v1.json" as const;

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
  | "shell-live-source-current-valves"
  | "shell-live-source-dynamic-valves"
  | "shell-source-state-se-current-valves"
  | "shell-source-state-se-dynamic-valves";

type PointSpec = {
  readonly id: PointId;
  readonly hrBpm: number;
  readonly targetTBVMl: number;
  readonly runtimeParams: Partial<CoreRuntimeParams>;
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
  readonly chamberPressureKey: keyof SimSample;
  readonly volumeKey: keyof SimSample;
  readonly avFlowKey: keyof SimSample;
  readonly outFlowKey: keyof SimSample;
  readonly avOpenKey: keyof SimSample;
  readonly outOpenKey: keyof SimSample;
  readonly atrialPressureKey: keyof SimSample;
  readonly arterialPressureKey: keyof SimSample;
  readonly activePressureKey: keyof SimSample;
  readonly activeStressKey: keyof SimSample;
  readonly avBadge: keyof Pick<MorphologyBadgeSummary, "mvf" | "tvf">;
  readonly pvBadge: keyof Pick<MorphologyBadgeSummary, "lvPv" | "rvPv">;
  readonly avValve: ValveSpec;
  readonly outValve: ValveSpec;
  readonly passiveSlopeBounds: readonly [number, number];
  readonly activePressurePerStressBounds: readonly [number, number];
};

type VariantSpec = {
  readonly id: VariantId;
  readonly label: string;
  readonly activeMode: "live-source-stress" | "source-state-series-elastic";
  readonly valveMode: "current-like" | "dynamic-5bu-best";
  readonly usesShell: boolean;
};

type MetricDigest = Pick<
  SimMetrics,
  "AoPMean" | "PAPMean" | "CO_L" | "CO_R" | "LAPMean" | "RAPMean" | "EF_LApprox" | "EF_RApprox"
>;

type LiveTrace = {
  readonly pointId: PointId;
  readonly settled: boolean;
  readonly settleReason: SettleStatus["reason"] | "exception";
  readonly healthStatus: SimulationHealth["status"] | "exception";
  readonly sampleCount: number;
  readonly finalBeatSampleCount: number;
  readonly metrics: MetricDigest | null;
  readonly morphologyBadges: MorphologyBadgeSummary | null;
  readonly samples: readonly SimSample[];
  readonly finalBeat: readonly SimSample[];
  readonly tracesBySide: Readonly<Record<SideId, readonly ModelCoreLand2017LvSourceProviderTraceSample[]>>;
  readonly traceDropped: Readonly<Record<SideId, number>>;
  readonly errorMessage: string | null;
};

type ReplaySample = {
  readonly t: number;
  readonly theta: number;
  readonly volumeMl: number;
  readonly liveVolumeMl: number;
  readonly pressureMmHg: number;
  readonly livePressureMmHg: number;
  readonly passivePressureMmHg: number;
  readonly activePressureMmHg: number;
  readonly avFlowMlPerSec: number;
  readonly outFlowMlPerSec: number;
  readonly liveAvFlowMlPerSec: number;
  readonly liveOutFlowMlPerSec: number;
  readonly residualMl: number;
  readonly solveOk01: number;
  readonly shellIterations: number;
  readonly inletDiodeImpulseMlPerSec: number;
  readonly outletDiodeImpulseMlPerSec: number;
  readonly inletQDotClampImpulseMlPerSec2: number;
  readonly outletQDotClampImpulseMlPerSec2: number;
  readonly inletAdverseGradientFlow01: number;
  readonly outletAdverseGradientFlow01: number;
  readonly sigmaSePa: number | null;
  readonly sigmaMismatchPa: number | null;
  readonly seElasticEnergyJm3: number | null;
};

type RunMetrics = {
  readonly finalBeatSampleCount: number;
  readonly pvOk: boolean;
  readonly pvPeakCount: number;
  readonly pvTroughCount: number;
  readonly pvRoughness: number;
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
  readonly solveOkFraction: number;
  readonly maxAbsResidualMl: number;
  readonly maxAbsSigmaMismatchPa: number | null;
  readonly maxSeElasticEnergyJm3: number | null;
  readonly outputPreserved: boolean;
  readonly grossOk: boolean;
};

type RunResult = {
  readonly variantId: VariantId;
  readonly pointId: PointId;
  readonly side: SideId;
  readonly measured: boolean;
  readonly metrics: RunMetrics;
  readonly failureMessage: string | null;
};

type VariantSummary = {
  readonly variantId: VariantId;
  readonly measuredCount: number;
  readonly lvMeasuredCount: number;
  readonly rvMeasuredCount: number;
  readonly grossOkCount: number;
  readonly lvGrossOkCount: number;
  readonly rvGrossOkCount: number;
  readonly pvOkCount: number;
  readonly avFlowOkCount: number;
  readonly outputPreservedCount: number;
  readonly meanPvPeakCount: number;
  readonly meanAvExtraPeakCount: number;
  readonly meanSolveOkFraction: number;
  readonly meanMaxAbsResidualMl: number;
  readonly failedPointSides: readonly string[];
};

type Classification = {
  readonly liveUser0GrossPass: string;
  readonly bestShellVariant: string;
  readonly chamberShellDecision:
    | "supported-for-runtime-shadow"
    | "partial-shell-signal"
    | "not-supported";
  readonly notes: readonly string[];
};

type Evidence = {
  readonly schemaVersion: 1;
  readonly id: typeof VENTRICULAR_CHAMBER_SHELL_PHASE5BX_ID;
  readonly phase: "5BX";
  readonly bench: {
    readonly mode: "source-state-preserving-local-ventricular-chamber-shell";
    readonly pointSource: "normal-hr75-hr90-preload-afterload-contractility-representative-envelope";
    readonly liveClosure: "current-user0-lv-rv-la-ra-landatrial-plus-sourced-root-zc";
    readonly components: readonly [typeof VENTRICULAR_CHAMBER_SHELL_V1_ID, typeof DYNAMIC_VALVE_TRANSITION_V1_ID, typeof SERIES_ELASTIC_FIBER_ADAPTER_V1_ID];
    readonly claimBoundary: "local-chamber-shell-bench-only-no-runtime-default-no-closed-loop-morphology-claim";
  };
  readonly points: readonly PointSpec[];
  readonly sides: readonly SideId[];
  readonly variants: readonly Omit<VariantSpec, "usesShell">[];
  readonly liveTraceSummaries: readonly Omit<LiveTrace, "samples" | "finalBeat" | "tracesBySide">[];
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

type MatchedTrace = {
  readonly trace: ModelCoreLand2017LvSourceProviderTraceSample;
  readonly sample: SimSample;
};

const profile = resolveVerificationProfile("fitFast");
const TRACE_SAMPLE_CAP_PER_CHAMBER = 250_000;

const POINTS: readonly PointSpec[] = [
  { id: "normal-hr75", hrBpm: 75, targetTBVMl: 5600, runtimeParams: { HR: 75 } },
  { id: "normal-hr90", hrBpm: 90, targetTBVMl: 5600, runtimeParams: { HR: 90 } },
  { id: "low-preload-hr75", hrBpm: 75, targetTBVMl: 4800, runtimeParams: { HR: 75 } },
  { id: "high-preload-hr75", hrBpm: 75, targetTBVMl: 6200, runtimeParams: { HR: 75 } },
  { id: "systemic-afterload-high-hr75", hrBpm: 75, targetTBVMl: 5600, runtimeParams: { HR: 75, systemicResistance: 1.25 } },
  { id: "pulmonary-afterload-high-hr75", hrBpm: 75, targetTBVMl: 5600, runtimeParams: { HR: 75, pulmonaryResistance: 0.8 } },
  { id: "contractility-low-hr75", hrBpm: 75, targetTBVMl: 5600, runtimeParams: { HR: 75, contractility: 0.8 } },
  { id: "contractility-high-hr75", hrBpm: 75, targetTBVMl: 5600, runtimeParams: { HR: 75, contractility: 1.2 } },
];

const SIDES: readonly SideSpec[] = [
  {
    id: "LV",
    avValveId: "MV",
    outValveId: "AoV",
    chamberPressureKey: "LVP",
    volumeKey: "VLV",
    avFlowKey: "QMV",
    outFlowKey: "QAo",
    avOpenKey: "xiMV",
    outOpenKey: "xiAoV",
    atrialPressureKey: "LAP",
    arterialPressureKey: "AoP",
    activePressureKey: "LVActivePressureMmHg",
    activeStressKey: "LVActiveFiberStressPa",
    avBadge: "mvf",
    pvBadge: "lvPv",
    avValve: valveSpec("MV"),
    outValve: valveSpec("AoV"),
    passiveSlopeBounds: [0.015, 1.2],
    activePressurePerStressBounds: [0.0001, 0.04],
  },
  {
    id: "RV",
    avValveId: "TV",
    outValveId: "PV",
    chamberPressureKey: "RVP",
    volumeKey: "VRV",
    avFlowKey: "QTV",
    outFlowKey: "QPV",
    avOpenKey: "xiTV",
    outOpenKey: "xiPV",
    atrialPressureKey: "RAP",
    arterialPressureKey: "PAP",
    activePressureKey: "RVActivePressureMmHg",
    activeStressKey: "RVActiveFiberStressPa",
    avBadge: "tvf",
    pvBadge: "rvPv",
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
    activeMode: "live-source-stress",
    valveMode: "current-like",
    usesShell: false,
  },
  {
    id: "shell-live-source-current-valves",
    label: "ChamberShell live source stress with current-like valves",
    activeMode: "live-source-stress",
    valveMode: "current-like",
    usesShell: true,
  },
  {
    id: "shell-live-source-dynamic-valves",
    label: "ChamberShell live source stress with DynamicValveTransitionV1",
    activeMode: "live-source-stress",
    valveMode: "dynamic-5bu-best",
    usesShell: true,
  },
  {
    id: "shell-source-state-se-current-valves",
    label: "ChamberShell source-state SeriesElasticV1 with current-like valves",
    activeMode: "source-state-series-elastic",
    valveMode: "current-like",
    usesShell: true,
  },
  {
    id: "shell-source-state-se-dynamic-valves",
    label: "ChamberShell source-state SeriesElasticV1 with DynamicValveTransitionV1",
    activeMode: "source-state-series-elastic",
    valveMode: "dynamic-5bu-best",
    usesShell: true,
  },
];

export function buildVentricularChamberShellPhase5BXEvidence(): Evidence {
  const liveTraces = POINTS.map(runLiveTrace);
  const results = VARIANTS.flatMap((variant) =>
    POINTS.flatMap((point) =>
      SIDES.map((side) => runVariant(variant, point, side, requiredTrace(liveTraces, point.id))),
    ),
  );
  const variantSummaries = VARIANTS.map((variant) => summarizeVariant(variant.id, results));
  const classification = classify(variantSummaries);
  const evidenceWithoutHash = {
    schemaVersion: 1,
    id: VENTRICULAR_CHAMBER_SHELL_PHASE5BX_ID,
    phase: "5BX",
    bench: {
      mode: "source-state-preserving-local-ventricular-chamber-shell",
      pointSource: "normal-hr75-hr90-preload-afterload-contractility-representative-envelope",
      liveClosure: "current-user0-lv-rv-la-ra-landatrial-plus-sourced-root-zc",
      components: [VENTRICULAR_CHAMBER_SHELL_V1_ID, DYNAMIC_VALVE_TRANSITION_V1_ID, SERIES_ELASTIC_FIBER_ADAPTER_V1_ID],
      claimBoundary: "local-chamber-shell-bench-only-no-runtime-default-no-closed-loop-morphology-claim",
    },
    points: POINTS,
    sides: SIDES.map((side) => side.id),
    variants: VARIANTS.map(({ usesShell: _usesShell, ...variant }) => variant),
    liveTraceSummaries: liveTraces.map(({ samples: _samples, finalBeat: _finalBeat, tracesBySide: _tracesBySide, ...trace }) => trace),
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

function runLiveTrace(point: PointSpec): LiveTrace {
  const lvInstrumentation = createModelCoreLand2017LvSourceProviderInstrumentation({ maxTraceSamples: TRACE_SAMPLE_CAP_PER_CHAMBER });
  const rvInstrumentation = createModelCoreLand2017LvSourceProviderInstrumentation({ maxTraceSamples: TRACE_SAMPLE_CAP_PER_CHAMBER });
  const resolved = resolveModelCoreRuntimeActiveSource({
    mode: MODELCORE_RUNTIME_ALL_CHAMBER_LANDATRIAL_DEFAULT_MODE,
    rootZcMode: MODELCORE_RUNTIME_ROOT_ZC_SOURCED_BOUNDARY_ROOT_DEFAULT_MODE,
    runtimeParams: DEFAULT_PARAMS,
    instrumentation: lvInstrumentation,
    rvInstrumentation,
  });
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
    const morphology = samples.length > 0 ? morphologyCheckSummaryFromSamples(samples) : null;
    return {
      pointId: point.id,
      settled: settle.settleStatus.settled,
      settleReason: settle.settleStatus.reason,
      healthStatus: measurement?.health.status ?? settle.core.health().status,
      sampleCount: samples.length,
      finalBeatSampleCount: finalBeat.length,
      metrics: measurement ? metricDigest(measurement.metrics) : null,
      morphologyBadges: morphology?.badges ?? null,
      samples,
      finalBeat,
      tracesBySide: {
        LV: lvInstrumentation.traceSamples,
        RV: rvInstrumentation.traceSamples,
      },
      traceDropped: {
        LV: lvInstrumentation.traceDroppedCount,
        RV: rvInstrumentation.traceDroppedCount,
      },
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
      morphologyBadges: null,
      samples: [],
      finalBeat: [],
      tracesBySide: { LV: [], RV: [] },
      traceDropped: { LV: lvInstrumentation.traceDroppedCount, RV: rvInstrumentation.traceDroppedCount },
      errorMessage: error instanceof Error ? error.message : String(error),
    };
  }
}

function runVariant(
  variant: VariantSpec,
  _point: PointSpec,
  side: SideSpec,
  liveTrace: LiveTrace,
): RunResult {
  if (!liveTrace.settled || liveTrace.healthStatus !== "ok" || liveTrace.finalBeat.length < 8) {
    return {
      variantId: variant.id,
      pointId: liveTrace.pointId,
      side: side.id,
      measured: false,
      metrics: emptyMetrics(),
      failureMessage: liveTrace.errorMessage ?? "live trace unavailable or unsettled",
    };
  }
  const matched = finalBeatMatchedTrace(side, liveTrace);
  if (matched.length < 8) {
    return {
      variantId: variant.id,
      pointId: liveTrace.pointId,
      side: side.id,
      measured: false,
      metrics: emptyMetrics(),
      failureMessage: "source-state trace unavailable for final beat",
    };
  }
  const replay = variant.usesShell
    ? replayShellVariant(variant, side, liveTrace.finalBeat, matched)
    : liveReferenceReplay(side, liveTrace.finalBeat);
  const replayBeat = finalBeatReplaySamples(replay);
  return {
    variantId: variant.id,
    pointId: liveTrace.pointId,
    side: side.id,
    measured: true,
    metrics: computeMetrics(side, liveTrace.finalBeat, replayBeat),
    failureMessage: null,
  };
}

function replayShellVariant(
  variant: VariantSpec,
  side: SideSpec,
  liveBeat: readonly SimSample[],
  matched: readonly MatchedTrace[],
): readonly ReplaySample[] {
  const first = matched[0];
  const passiveSlope = estimatePassiveSlope(side, liveBeat);
  const activePressurePerStress = estimateActivePressurePerStress(side, liveBeat);
  let shell = initialVentricularChamberShellState(
    numberAt(first.sample, side.volumeKey),
    numberAt(first.sample, side.avFlowKey),
    numberAt(first.sample, side.outFlowKey),
    numberAt(first.sample, side.avOpenKey),
    numberAt(first.sample, side.outOpenKey),
    sourceStateForTrace(
      first.trace,
      numberAt(first.sample, side.volumeKey),
      numberAt(first.sample, side.volumeKey),
      numberAt(first.sample, side.volumeKey),
    ),
  );
  const out: ReplaySample[] = [];
  for (let index = 0; index < matched.length; index += 1) {
    const entry = matched[index];
    const prevEntry = matched[Math.max(0, index - 1)];
    const dtSec = Math.max(
      entry.trace.dtSec,
      index > 0 ? entry.sample.t - prevEntry.sample.t : entry.trace.dtSec,
      1e-6,
    );
    const liveVolume = numberAt(entry.sample, side.volumeKey);
    const previousLiveVolume = numberAt(prevEntry.sample, side.volumeKey);
    const previousShellVolume = shell.volumeMl;
    const sourceState = sourceStateForTrace(entry.trace, liveVolume, previousShellVolume, previousLiveVolume);
    const step = stepVentricularChamberShellV1(
      shell,
      {
        dtSec,
        liveVolumeMl: liveVolume,
        livePassivePressureMmHg: numberAt(entry.sample, side.chamberPressureKey)
          - optionalNumber(entry.sample, side.activePressureKey),
        passiveSlopeMmHgPerMl: passiveSlope,
        atrialPressureMmHg: numberAt(entry.sample, side.atrialPressureKey),
        arterialPressureMmHg: numberAt(entry.sample, side.arterialPressureKey),
        liveSourceStressPa: entry.trace.sourceActiveFiberStressPa ?? optionalNumber(entry.sample, side.activeStressKey),
        activePressurePerStressMmHgPerPa: activePressurePerStress,
        activeMode: variant.activeMode,
        sourceState,
        volumeBracketMl: [
          Math.min(shell.volumeMl, liveVolume) - 45,
          Math.max(shell.volumeMl, liveVolume) + 45,
        ],
      },
      shellParams(variant, side),
    );
    shell = step.nextState;
    out.push({
      t: entry.sample.t,
      theta: phaseOf(entry.sample),
      volumeMl: step.volumeMl,
      liveVolumeMl: liveVolume,
      pressureMmHg: step.pressureMmHg,
      livePressureMmHg: numberAt(entry.sample, side.chamberPressureKey),
      passivePressureMmHg: step.passivePressureMmHg,
      activePressureMmHg: step.activePressureMmHg,
      avFlowMlPerSec: step.inletFlowMlPerSec,
      outFlowMlPerSec: step.outletFlowMlPerSec,
      liveAvFlowMlPerSec: numberAt(entry.sample, side.avFlowKey),
      liveOutFlowMlPerSec: numberAt(entry.sample, side.outFlowKey),
      residualMl: step.residualMl,
      solveOk01: step.ok ? 1 : 0,
      shellIterations: step.iterations,
      inletDiodeImpulseMlPerSec: step.inletValveStep.diodeImpulseMlPerSec,
      outletDiodeImpulseMlPerSec: step.outletValveStep.diodeImpulseMlPerSec,
      inletQDotClampImpulseMlPerSec2: step.inletValveStep.qDotClampImpulseMlPerSec2,
      outletQDotClampImpulseMlPerSec2: step.outletValveStep.qDotClampImpulseMlPerSec2,
      inletAdverseGradientFlow01: step.inletValveStep.adversePressureGradientFlow ? 1 : 0,
      outletAdverseGradientFlow01: step.outletValveStep.adversePressureGradientFlow ? 1 : 0,
      sigmaSePa: step.seriesElasticStep?.sigmaSePa ?? null,
      sigmaMismatchPa: step.seriesElasticStep?.sigmaMismatchPa ?? null,
      seElasticEnergyJm3: step.seriesElasticStep?.elasticEnergyJm3 ?? null,
    });
  }
  return out;
}

function sourceStateForTrace(
  trace: ModelCoreLand2017LvSourceProviderTraceSample,
  liveVolumeMl: number,
  previousShellVolumeMl: number,
  previousLiveVolumeMl: number,
) {
  return {
    previousLandState: trace.previousLandState,
    freeCalciumUM: trace.freeCalciumUM,
    previousFreeCalciumUM: trace.previousFreeCalciumUM,
    previousFiberEngineeringStrain: scaledFiberEngineeringStrain(
      trace.previousFiberEngineeringStrain,
      previousShellVolumeMl,
      previousLiveVolumeMl,
    ),
    stageFiberEngineeringStrainAtVolumeMl: (volumeMl: number) => {
      return scaledFiberEngineeringStrain(trace.stageFiberEngineeringStrain, volumeMl, liveVolumeMl);
    },
  };
}

function scaledFiberEngineeringStrain(
  referenceFiberEngineeringStrain: number,
  candidateVolumeMl: number,
  referenceVolumeMl: number,
): number {
  const referenceLambda = 1 + referenceFiberEngineeringStrain;
  return clamp(referenceLambda * Math.cbrt(Math.max(candidateVolumeMl, 1) / Math.max(referenceVolumeMl, 1)), 0.65, 1.35) - 1;
}

function finalBeatMatchedTrace(side: SideSpec, liveTrace: LiveTrace): readonly MatchedTrace[] {
  const finalBeat = liveTrace.finalBeat;
  const firstT = finalBeat[0].t;
  const lastT = finalBeat.at(-1)!.t;
  const traces = liveTrace.tracesBySide[side.id]
    .filter((trace) =>
      trace.chamber === side.id
      && trace.after.tSec >= firstT - profile.dt
      && trace.after.tSec <= lastT + profile.dt,
    );
  const out: MatchedTrace[] = [];
  let sampleIndex = 0;
  for (const trace of traces) {
    while (
      sampleIndex < finalBeat.length - 1
      && Math.abs(finalBeat[sampleIndex + 1].t - trace.after.tSec)
        <= Math.abs(finalBeat[sampleIndex].t - trace.after.tSec)
    ) {
      sampleIndex += 1;
    }
    out.push({ trace, sample: finalBeat[sampleIndex] });
  }
  return out;
}

function liveReferenceReplay(side: SideSpec, liveBeat: readonly SimSample[]): readonly ReplaySample[] {
  return liveBeat.map((sample) => ({
    t: sample.t,
    theta: phaseOf(sample),
    volumeMl: numberAt(sample, side.volumeKey),
    liveVolumeMl: numberAt(sample, side.volumeKey),
    pressureMmHg: numberAt(sample, side.chamberPressureKey),
    livePressureMmHg: numberAt(sample, side.chamberPressureKey),
    passivePressureMmHg: numberAt(sample, side.chamberPressureKey) - optionalNumber(sample, side.activePressureKey),
    activePressureMmHg: optionalNumber(sample, side.activePressureKey),
    avFlowMlPerSec: numberAt(sample, side.avFlowKey),
    outFlowMlPerSec: numberAt(sample, side.outFlowKey),
    liveAvFlowMlPerSec: numberAt(sample, side.avFlowKey),
    liveOutFlowMlPerSec: numberAt(sample, side.outFlowKey),
    residualMl: 0,
    solveOk01: 1,
    shellIterations: 0,
    inletDiodeImpulseMlPerSec: 0,
    outletDiodeImpulseMlPerSec: 0,
    inletQDotClampImpulseMlPerSec2: 0,
    outletQDotClampImpulseMlPerSec2: 0,
    inletAdverseGradientFlow01: adversePressureGradientFlow(
      numberAt(sample, side.atrialPressureKey) - numberAt(sample, side.chamberPressureKey),
      numberAt(sample, side.avFlowKey),
    ) ? 1 : 0,
    outletAdverseGradientFlow01: adversePressureGradientFlow(
      numberAt(sample, side.chamberPressureKey) - numberAt(sample, side.arterialPressureKey),
      numberAt(sample, side.outFlowKey),
    ) ? 1 : 0,
    sigmaSePa: optionalNumber(sample, side.activeStressKey),
    sigmaMismatchPa: null,
    seElasticEnergyJm3: null,
  }));
}

function computeMetrics(side: SideSpec, liveBeat: readonly SimSample[], replayBeat: readonly ReplaySample[]): RunMetrics {
  if (replayBeat.length < 8) return emptyMetrics();
  const flowMax = Math.max(0, ...replayBeat.map((sample) => sample.outFlowMlPerSec));
  const ejectionThreshold = Math.max(side.id === "LV" ? 10 : 5, 0.08 * flowMax);
  const ejection = replayBeat.filter((sample) => sample.outFlowMlPerSec > ejectionThreshold);
  const pressureSpan = valueRange(ejection.map((sample) => sample.pressureMmHg));
  const prominence = Math.max(side.id === "LV" ? 4 : 1.2, 0.10 * pressureSpan);
  const pvPeakCount = prominentExtremaCount(ejection.map((sample) => sample.pressureMmHg), "max", prominence);
  const pvTroughCount = prominentExtremaCount(ejection.map((sample) => sample.pressureMmHg), "min", prominence);
  const pvRoughness = totalVariation(ejection.map((sample) => sample.pressureMmHg)) / Math.max(pressureSpan, 1e-6);
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
  const solveOkFraction = fraction(replayBeat, (sample) => sample.solveOk01 > 0.5);
  const maxAbsResidualMl = maxFinite(replayBeat.map((sample) => Math.abs(sample.residualMl)));
  const maxAbsSigmaMismatchPa = finiteMaxOrNull(replayBeat.map((sample) => Math.abs(sample.sigmaMismatchPa ?? Number.NaN)));
  const maxSeElasticEnergyJm3 = finiteMaxOrNull(replayBeat.map((sample) => sample.seElasticEnergyJm3 ?? Number.NaN));
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
    solveOkFraction: round(solveOkFraction),
    maxAbsResidualMl: round(maxAbsResidualMl),
    maxAbsSigmaMismatchPa: maxAbsSigmaMismatchPa == null ? null : round(maxAbsSigmaMismatchPa),
    maxSeElasticEnergyJm3: maxSeElasticEnergyJm3 == null ? null : round(maxSeElasticEnergyJm3),
    outputPreserved,
    grossOk: pvOk && avFlowOk && outputPreserved && solveOkFraction > 0.98 && maxAbsResidualMl < 1.5,
  };
}

function shellParams(variant: VariantSpec, side: SideSpec): VentricularChamberShellParameters {
  return {
    inletValve: valveParams(variant, side.avValve),
    outletValve: valveParams(variant, side.outValve),
    seriesElastic: variant.activeMode === "source-state-series-elastic" ? seriesElasticParams() : null,
    maxSolveIterations: 18,
    residualToleranceMl: 0.02,
  };
}

function valveParams(variant: VariantSpec, valve: ValveSpec): DynamicValveTransitionV1Parameters {
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

function seriesElasticParams() {
  return {
    ...DEFAULT_SERIES_ELASTIC_FIBER_PARAMETERS,
    seriesStiffnessPa: 600_000,
    seriesDampingPaSec: 3_500,
    maxLambdaSeAbs: 0.08,
    maxForceBalanceIterations: 12,
    forceBalanceTolerancePa: 500,
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
  const maxActive = maxFinite(samples.map((sample) => optionalNumber(sample, side.activePressureKey)));
  for (let index = 1; index < samples.length; index += 1) {
    const prev = samples[index - 1];
    const cur = samples[index];
    const active = Math.max(optionalNumber(cur, side.activePressureKey), optionalNumber(prev, side.activePressureKey));
    if (active > 0.25 * maxActive) continue;
    const dV = numberAt(cur, side.volumeKey) - numberAt(prev, side.volumeKey);
    const pPrev = numberAt(prev, side.chamberPressureKey) - optionalNumber(prev, side.activePressureKey);
    const pCur = numberAt(cur, side.chamberPressureKey) - optionalNumber(cur, side.activePressureKey);
    if (Math.abs(dV) < 0.05) continue;
    const slope = (pCur - pPrev) / dV;
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

function summarizeVariant(variantId: VariantId, results: readonly RunResult[]): VariantSummary {
  const measured = results.filter((result) => result.variantId === variantId && result.measured);
  return {
    variantId,
    measuredCount: measured.length,
    lvMeasuredCount: measured.filter((result) => result.side === "LV").length,
    rvMeasuredCount: measured.filter((result) => result.side === "RV").length,
    grossOkCount: measured.filter((result) => result.metrics.grossOk).length,
    lvGrossOkCount: measured.filter((result) => result.side === "LV" && result.metrics.grossOk).length,
    rvGrossOkCount: measured.filter((result) => result.side === "RV" && result.metrics.grossOk).length,
    pvOkCount: measured.filter((result) => result.metrics.pvOk).length,
    avFlowOkCount: measured.filter((result) => result.metrics.avFlowOk).length,
    outputPreservedCount: measured.filter((result) => result.metrics.outputPreserved).length,
    meanPvPeakCount: round(mean(measured.map((result) => result.metrics.pvPeakCount))),
    meanAvExtraPeakCount: round(mean(measured.map((result) => result.metrics.avExtraPeakCount))),
    meanSolveOkFraction: round(mean(measured.map((result) => result.metrics.solveOkFraction))),
    meanMaxAbsResidualMl: round(mean(measured.map((result) => result.metrics.maxAbsResidualMl))),
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
  const bestAllMeasured = best.measuredCount > 0
    && best.lvMeasuredCount > 0
    && best.rvMeasuredCount > 0
    && best.grossOkCount === best.measuredCount
    && best.lvGrossOkCount === best.lvMeasuredCount
    && best.rvGrossOkCount === best.rvMeasuredCount;
  const partialThreshold = Math.max(
    live.grossOkCount + Math.ceil(Math.max(best.measuredCount, 1) * 0.25),
    Math.ceil(Math.max(best.measuredCount, 1) * 0.4),
  );
  const decision =
    bestAllMeasured
      ? "supported-for-runtime-shadow"
      : best.grossOkCount >= partialThreshold
        ? "partial-shell-signal"
        : "not-supported";
  return {
    liveUser0GrossPass: `${live.grossOkCount}/${live.measuredCount}`,
    bestShellVariant:
      `${best.variantId}:gross=${best.grossOkCount}/${best.measuredCount},lv=${best.lvGrossOkCount}/${best.lvMeasuredCount},rv=${best.rvGrossOkCount}/${best.rvMeasuredCount},pv=${best.pvOkCount}/${best.measuredCount},av=${best.avFlowOkCount}/${best.measuredCount},output=${best.outputPreservedCount}/${best.measuredCount},solve=${best.meanSolveOkFraction}`,
    chamberShellDecision: decision,
    notes: [
      "This is a local source-state-preserving ChamberShell bench, not a runtime implementation.",
      "Adoption requires broad LV/RV PV plus MVF/TVF morphology across the representative envelope, not normal-only improvement.",
      "The bench keeps root/Zc, qDot, Tref, source-stress, valve thresholds, and LandAtrial parameters fixed.",
    ],
  };
}

function recommendedNext(classification: Classification): readonly string[] {
  if (classification.chamberShellDecision === "supported-for-runtime-shadow") {
    return [
      "promote the best ChamberShell composition to an off-by-default runtime shadow over the same morphology envelope",
      "run live equivalence and output preservation before any default adoption",
      "keep LandAtrial calibration paused until LV/RV PV plus MVF/TVF remain robust",
    ];
  }
  if (classification.chamberShellDecision === "partial-shell-signal") {
    return [
      "use the best ChamberShell residual surface as the basis for a fuller two-ventricle coupled-step shadow",
      "do not adopt the local shell or valve path as default from this partial evidence",
      "attribute remaining failures before reopening LandAtrial AV-plane/effective-wall release timing",
    ];
  }
  return [
    "do not wire this local ChamberShell composition into runtime defaults",
    "treat the residual blocker as requiring a larger graph-level coupled step or a different chamber pressure adapter",
    "keep the deterministic morphology envelope as the development contract",
  ];
}

function requiredTrace(traces: readonly LiveTrace[], pointId: PointId): LiveTrace {
  const trace = traces.find((entry) => entry.pointId === pointId);
  if (!trace) throw new Error(`missing live trace for ${pointId}`);
  return trace;
}

function requiredSummary(summaries: readonly VariantSummary[], variantId: VariantId): VariantSummary {
  const summary = summaries.find((entry) => entry.variantId === variantId);
  if (!summary) throw new Error(`missing variant summary for ${variantId}`);
  return summary;
}

function finalBeatReplaySamples(samples: readonly ReplaySample[]): readonly ReplaySample[] {
  if (samples.length < 3) return [];
  const wrapIndexes: number[] = [];
  for (let index = 1; index < samples.length; index += 1) {
    if (samples[index].theta < samples[index - 1].theta) wrapIndexes.push(index);
  }
  if (wrapIndexes.length >= 2) return samples.slice(wrapIndexes[wrapIndexes.length - 2], wrapIndexes[wrapIndexes.length - 1]);
  if (wrapIndexes.length === 1) return samples.slice(wrapIndexes[0]);
  return samples;
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
    const isExtremum = mode === "max" ? cur >= prev && cur > next : cur <= prev && cur < next;
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
  return numberAt(sample, key);
}

function liveDt(samples: readonly SimSample[]): number {
  if (samples.length < 2) return profile.dt;
  return Math.max(samples[1].t - samples[0].t, 1e-6);
}

function replayDt(samples: readonly ReplaySample[]): number {
  if (samples.length < 2) return profile.dt;
  return Math.max(samples[1].t - samples[0].t, 1e-6);
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

function emptyMetrics(): RunMetrics {
  return {
    finalBeatSampleCount: 0,
    pvOk: false,
    pvPeakCount: 0,
    pvTroughCount: 0,
    pvRoughness: 0,
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
    solveOkFraction: 0,
    maxAbsResidualMl: 0,
    maxAbsSigmaMismatchPa: null,
    maxSeElasticEnergyJm3: null,
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
  for (let index = 1; index < values.length; index += 1) total += Math.abs(values[index] - values[index - 1]);
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
  const evidence = buildVentricularChamberShellPhase5BXEvidence();
  const outputPath = path.resolve(process.cwd(), VENTRICULAR_CHAMBER_SHELL_PHASE5BX_RESULT_PATH);
  mkdirSync(path.dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(evidence, null, 2)}\n`);
  console.log(JSON.stringify({
    id: evidence.id,
    path: VENTRICULAR_CHAMBER_SHELL_PHASE5BX_RESULT_PATH,
    hash: evidence.normalizedSha256,
    classification: evidence.classification,
  }, null, 2));
}

const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : "";
if (import.meta.url === invokedPath) {
  writeEvidence();
}
