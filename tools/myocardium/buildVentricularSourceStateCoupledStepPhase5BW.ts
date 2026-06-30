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
import {
  MODELCORE_RUNTIME_ROOT_ZC_SOURCED_BOUNDARY_ROOT_DEFAULT_MODE,
} from "@/engine/myocardium/runtimeRootZc";
import {
  DEFAULT_SERIES_ELASTIC_FIBER_PARAMETERS,
  SERIES_ELASTIC_FIBER_ADAPTER_V1_ID,
  initialSeriesElasticFiberState,
  stepSeriesElasticLandFiberV1,
  type SeriesElasticFiberParameters,
} from "@/engine/myocardium/seriesElasticFiberAdapter";
import type { CoreRuntimeParams, SimMetrics, SimSample, SimulationHealth } from "@/engine/protocol";
import type { SettleStatus } from "@/engine/settling";
import {
  conciseMorphologyMessages,
  morphologyCheckSummaryFromSamples,
  type MorphologyBadgeSummary,
  type MorphologyCheckStatus,
} from "@/engine/verification/morphologyCheck";
import { lastCompleteBeat, phaseOf } from "@/engine/verification/shapeMetrics";
import { resolveVerificationProfile } from "@/engine/verification/profiles";

export const VENTRICULAR_SOURCE_STATE_COUPLED_STEP_PHASE5BW_ID =
  "ventricular-source-state-coupled-step-phase5bw-result-v1" as const;
export const VENTRICULAR_SOURCE_STATE_COUPLED_STEP_PHASE5BW_RESULT_PATH =
  "data/myocardium/protocols/ventricular-source-state-coupled-step-phase5bw-result-v1.json" as const;

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

type PointSpec = {
  readonly id: PointId;
  readonly hrBpm: number;
  readonly targetTBVMl: number;
  readonly runtimeParams: Partial<CoreRuntimeParams>;
};

type SideSpec = {
  readonly id: SideId;
  readonly chamberPressureKey: keyof SimSample;
  readonly volumeKey: keyof SimSample;
  readonly outFlowKey: keyof SimSample;
  readonly avFlowKey: keyof SimSample;
  readonly activePressureKey: keyof SimSample;
  readonly activeStressKey: keyof SimSample;
  readonly pvBadge: keyof Pick<MorphologyBadgeSummary, "lvPv" | "rvPv">;
  readonly avBadge: keyof Pick<MorphologyBadgeSummary, "mvf" | "tvf">;
  readonly minProminenceMmHg: number;
};

type MetricDigest = Pick<
  SimMetrics,
  "AoPMean" | "PAPMean" | "CO_L" | "CO_R" | "LAPMean" | "RAPMean" | "EF_LApprox" | "EF_RApprox"
>;

type LivePointResult = {
  readonly pointId: PointId;
  readonly settled: boolean;
  readonly settleReason: SettleStatus["reason"] | "exception";
  readonly healthStatus: SimulationHealth["status"] | "exception";
  readonly sampleCount: number;
  readonly finalBeatSampleCount: number;
  readonly metrics: MetricDigest | null;
  readonly morphologyStatus: MorphologyCheckStatus | "not-measured";
  readonly morphologyBadges: MorphologyBadgeSummary | null;
  readonly morphologyMessages: readonly string[];
  readonly traceDropped: { readonly LV: number; readonly RV: number };
  readonly sideSummaries: readonly SideSourceStateSummary[];
  readonly errorMessage: string | null;
};

type SideSourceStateSummary = {
  readonly side: SideId;
  readonly measured: boolean;
  readonly finalBeatTraceSamples: number;
  readonly validSourceStateTraceSamples: number;
  readonly missingSourceStateTraceSamples: number;
  readonly livePvBadge: MorphologyCheckStatus | "not-measured";
  readonly liveAvFlowBadge: MorphologyCheckStatus | "not-measured";
  readonly livePressureDomeOk: boolean;
  readonly livePressurePeakCount: number;
  readonly livePressureTroughCount: number;
  readonly livePressureRoughness: number;
  readonly sourceStressPeakCount: number;
  readonly sourceStressTroughCount: number;
  readonly sourceStressRoughness: number;
  readonly sourceStressFiniteFraction: number;
  readonly calciumPeakCount: number;
  readonly fiberStrainPeakCount: number;
  readonly fiberStrainTroughCount: number;
  readonly rawFiberStrainPeakCount: number;
  readonly rawFiberStrainTroughCount: number;
  readonly seStressPeakCount: number;
  readonly seStressTroughCount: number;
  readonly seStressRoughness: number;
  readonly seFailureFraction: number;
  readonly seMaxAbsSigmaMismatchPa: number | null;
  readonly seMaxElasticEnergyJm3: number | null;
  readonly sourceVsSePeakRatio: number | null;
  readonly interpretation:
    | "not-measured"
    | "source-state-stress-single-peaked-while-pv-fails"
    | "source-state-stress-also-multi-peaked"
    | "source-state-se-component-not-bounded"
    | "pv-and-source-state-stress-both-clean"
    | "inconclusive";
};

type Classification = {
  readonly liveGrossMorphologyPass: string;
  readonly sideMeasuredCount: number;
  readonly sideLivePvOkCount: number;
  readonly sideLiveAvFlowOkCount: number;
  readonly sideSourceStressSinglePeakCount: number;
  readonly sideSeStressSinglePeakCount: number;
  readonly sourceStateCoupledStepDecision:
    | "not-source-state-limited"
    | "source-state-component-still-suspect"
    | "insufficient-measurement";
  readonly notes: readonly string[];
};

type Evidence = {
  readonly schemaVersion: 1;
  readonly id: typeof VENTRICULAR_SOURCE_STATE_COUPLED_STEP_PHASE5BW_ID;
  readonly phase: "5BW";
  readonly bench: {
    readonly mode: "live-land-source-state-trace-plus-source-state-series-elastic-replay";
    readonly pointSource: "normal-hr75-hr90-preload-afterload-contractility-representative-envelope";
    readonly liveClosure: "current-user0-lv-rv-la-ra-landatrial-plus-sourced-root-zc";
    readonly components: readonly [typeof SERIES_ELASTIC_FIBER_ADAPTER_V1_ID];
    readonly claimBoundary: "source-state-diagnostic-only-no-runtime-default-no-closed-loop-morphology-claim";
  };
  readonly points: readonly PointSpec[];
  readonly sides: readonly SideId[];
  readonly seriesElastic: {
    readonly mechanismId: typeof SERIES_ELASTIC_FIBER_ADAPTER_V1_ID;
    readonly seriesStiffnessPa: number;
    readonly seriesDampingPaSec: number;
    readonly maxLambdaSeAbs: number;
  };
  readonly livePointResults: readonly LivePointResult[];
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

type MatchedTraceSample = {
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
    chamberPressureKey: "LVP",
    volumeKey: "VLV",
    outFlowKey: "QAo",
    avFlowKey: "QMV",
    activePressureKey: "LVActivePressureMmHg",
    activeStressKey: "LVActiveFiberStressPa",
    pvBadge: "lvPv",
    avBadge: "mvf",
    minProminenceMmHg: 4,
  },
  {
    id: "RV",
    chamberPressureKey: "RVP",
    volumeKey: "VRV",
    outFlowKey: "QPV",
    avFlowKey: "QTV",
    activePressureKey: "RVActivePressureMmHg",
    activeStressKey: "RVActiveFiberStressPa",
    pvBadge: "rvPv",
    avBadge: "tvf",
    minProminenceMmHg: 1.2,
  },
];

export function buildVentricularSourceStateCoupledStepPhase5BWEvidence(): Evidence {
  const livePointResults = POINTS.map(runPoint);
  const classification = classify(livePointResults);
  const evidenceWithoutHash = {
    schemaVersion: 1,
    id: VENTRICULAR_SOURCE_STATE_COUPLED_STEP_PHASE5BW_ID,
    phase: "5BW",
    bench: {
      mode: "live-land-source-state-trace-plus-source-state-series-elastic-replay",
      pointSource: "normal-hr75-hr90-preload-afterload-contractility-representative-envelope",
      liveClosure: "current-user0-lv-rv-la-ra-landatrial-plus-sourced-root-zc",
      components: [SERIES_ELASTIC_FIBER_ADAPTER_V1_ID],
      claimBoundary: "source-state-diagnostic-only-no-runtime-default-no-closed-loop-morphology-claim",
    },
    points: POINTS,
    sides: SIDES.map((side) => side.id),
    seriesElastic: {
      mechanismId: SERIES_ELASTIC_FIBER_ADAPTER_V1_ID,
      seriesStiffnessPa: sourceStateSeriesElasticParams().seriesStiffnessPa,
      seriesDampingPaSec: sourceStateSeriesElasticParams().seriesDampingPaSec,
      maxLambdaSeAbs: sourceStateSeriesElasticParams().maxLambdaSeAbs,
    },
    livePointResults,
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

function runPoint(point: PointSpec): LivePointResult {
  const lvInstrumentation = createModelCoreLand2017LvSourceProviderInstrumentation({
    maxTraceSamples: TRACE_SAMPLE_CAP_PER_CHAMBER,
  });
  const rvInstrumentation = createModelCoreLand2017LvSourceProviderInstrumentation({
    maxTraceSamples: TRACE_SAMPLE_CAP_PER_CHAMBER,
  });
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
    const traces = {
      LV: lvInstrumentation.traceSamples,
      RV: rvInstrumentation.traceSamples,
    } as const;
    return {
      pointId: point.id,
      settled: settle.settleStatus.settled,
      settleReason: settle.settleStatus.reason,
      healthStatus: measurement?.health.status ?? settle.core.health().status,
      sampleCount: samples.length,
      finalBeatSampleCount: finalBeat.length,
      metrics: measurement ? metricDigest(measurement.metrics) : null,
      morphologyStatus: morphology?.status ?? "not-measured",
      morphologyBadges: morphology?.badges ?? null,
      morphologyMessages: morphology ? conciseMorphologyMessages(morphology) : ["Morphology check not measured."],
      traceDropped: {
        LV: lvInstrumentation.traceDroppedCount,
        RV: rvInstrumentation.traceDroppedCount,
      },
      sideSummaries: SIDES.map((side) =>
        summarizeSideSourceState(
          side,
          finalBeat,
          traces[side.id],
          morphology?.badges ?? null,
        ),
      ),
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
      morphologyStatus: "not-measured",
      morphologyBadges: null,
      morphologyMessages: [],
      traceDropped: {
        LV: lvInstrumentation.traceDroppedCount,
        RV: rvInstrumentation.traceDroppedCount,
      },
      sideSummaries: SIDES.map((side) => emptySideSummary(side.id)),
      errorMessage: error instanceof Error ? error.message : String(error),
    };
  }
}

function summarizeSideSourceState(
  side: SideSpec,
  finalBeat: readonly SimSample[],
  allTraceSamples: readonly ModelCoreLand2017LvSourceProviderTraceSample[],
  badges: MorphologyBadgeSummary | null,
): SideSourceStateSummary {
  if (finalBeat.length < 8) return emptySideSummary(side.id);
  const firstT = finalBeat[0].t;
  const lastT = finalBeat.at(-1)!.t;
  const traces = allTraceSamples
    .filter((trace) =>
      trace.chamber === side.id
      && trace.after.tSec >= firstT - profile.dt
      && trace.after.tSec <= lastT + profile.dt,
    );
  if (traces.length < 8) return emptySideSummary(side.id);
  const matched = matchTraceToSamples(traces, finalBeat);
  const livePressure = matched.map((entry) => numberAt(entry.sample, side.chamberPressureKey));
  const liveOutFlow = matched.map((entry) => Math.max(0, numberAt(entry.sample, side.outFlowKey)));
  const ejection = ejectionIndexes(liveOutFlow, side.id === "LV" ? 10 : 5);
  const liveDome = ejectionShape(livePressure, ejection, side.minProminenceMmHg);
  const validSourceMatched = matched.filter(sourceStateTraceIsUsable);
  const sourceStress = validSourceMatched.map((entry) => entry.trace.sourceActiveFiberStressPa as number);
  const sourceShape = stressShape(sourceStress);
  const calciumShape = scalarShape(validSourceMatched.map((entry) => entry.trace.freeCalciumUM), 0.01, 0.12);
  const fiberShape = scalarShape(validSourceMatched.map((entry) => entry.trace.stageFiberEngineeringStrain), 0.001, 0.12);
  const rawFiberShape = scalarShape(
    validSourceMatched.map((entry) => entry.trace.stageRawFiberEngineeringStrain),
    0.001,
    0.12,
  );
  const seReplay = replaySeriesElasticSourceState(validSourceMatched);
  const seStress = seReplay.stressPa;
  const seShape = stressShape(seStress);
  const sourcePeak = maxFinite(sourceStress);
  const sePeak = maxFinite(seStress);
  const sourceVsSePeakRatio = sourcePeak > 1e-9 ? sePeak / sourcePeak : null;
  const sourceStateFiniteFraction = fraction(matched, (entry) => sourceStateTraceIsUsable(entry));
  const sourceStateMeasured = validSourceMatched.length >= 8 && sourceStateFiniteFraction >= 0.9;
  const sourceSingle = sourceShape.peakCount <= 1 && sourceShape.troughCount <= 1;
  const seSingle = seShape.peakCount <= 1 && seShape.troughCount <= 1;
  const interpretation =
    !sourceStateMeasured
      ? "inconclusive"
      : seReplay.failureFraction > 0.1
      ? "source-state-se-component-not-bounded"
      : !liveDome.ok && sourceSingle && seSingle
        ? "source-state-stress-single-peaked-while-pv-fails"
        : !liveDome.ok && (!sourceSingle || !seSingle)
          ? "source-state-stress-also-multi-peaked"
          : liveDome.ok && sourceSingle && seSingle
            ? "pv-and-source-state-stress-both-clean"
            : "inconclusive";
  return {
    side: side.id,
    measured: true,
    finalBeatTraceSamples: matched.length,
    validSourceStateTraceSamples: validSourceMatched.length,
    missingSourceStateTraceSamples: matched.length - validSourceMatched.length,
    livePvBadge: badges?.[side.pvBadge] ?? "not-measured",
    liveAvFlowBadge: badges?.[side.avBadge] ?? "not-measured",
    livePressureDomeOk: liveDome.ok,
    livePressurePeakCount: liveDome.peakCount,
    livePressureTroughCount: liveDome.troughCount,
    livePressureRoughness: round(liveDome.roughness),
    sourceStressPeakCount: sourceShape.peakCount,
    sourceStressTroughCount: sourceShape.troughCount,
    sourceStressRoughness: round(sourceShape.roughness),
    sourceStressFiniteFraction: round(sourceStateFiniteFraction),
    calciumPeakCount: calciumShape.peakCount,
    fiberStrainPeakCount: fiberShape.peakCount,
    fiberStrainTroughCount: fiberShape.troughCount,
    rawFiberStrainPeakCount: rawFiberShape.peakCount,
    rawFiberStrainTroughCount: rawFiberShape.troughCount,
    seStressPeakCount: seShape.peakCount,
    seStressTroughCount: seShape.troughCount,
    seStressRoughness: round(seShape.roughness),
    seFailureFraction: round(seReplay.failureFraction),
    seMaxAbsSigmaMismatchPa: seReplay.maxAbsSigmaMismatchPa == null ? null : round(seReplay.maxAbsSigmaMismatchPa),
    seMaxElasticEnergyJm3: seReplay.maxElasticEnergyJm3 == null ? null : round(seReplay.maxElasticEnergyJm3),
    sourceVsSePeakRatio: sourceVsSePeakRatio == null ? null : round(sourceVsSePeakRatio),
    interpretation,
  };
}

function sourceStateTraceIsUsable(entry: MatchedTraceSample): boolean {
  return entry.trace.solverOk
    && entry.trace.nextLandState != null
    && Number.isFinite(entry.trace.sourceActiveFiberStressPa)
    && Number.isFinite(entry.trace.freeCalciumUM)
    && Number.isFinite(entry.trace.previousFreeCalciumUM)
    && Number.isFinite(entry.trace.previousFiberEngineeringStrain)
    && Number.isFinite(entry.trace.stageFiberEngineeringStrain);
}

function replaySeriesElasticSourceState(
  matched: readonly MatchedTraceSample[],
): {
  readonly stressPa: readonly number[];
  readonly failureFraction: number;
  readonly maxAbsSigmaMismatchPa: number | null;
  readonly maxElasticEnergyJm3: number | null;
} {
  const first = matched[0]?.trace;
  if (!first) {
    return { stressPa: [], failureFraction: 1, maxAbsSigmaMismatchPa: null, maxElasticEnergyJm3: null };
  }
  const parameters = sourceStateSeriesElasticParams();
  let state = initialSeriesElasticFiberState(
    first.previousLandState,
    1 + first.previousFiberEngineeringStrain,
  );
  const stressPa: number[] = [];
  const sigmaMismatch: number[] = [];
  const energy: number[] = [];
  let failures = 0;
  for (const entry of matched) {
    const trace = entry.trace;
    const result = stepSeriesElasticLandFiberV1(
      state,
      {
        freeCalciumUM: trace.freeCalciumUM,
        previousFreeCalciumUM: trace.previousFreeCalciumUM,
        previousLambdaTotal: 1 + trace.previousFiberEngineeringStrain,
        stageLambdaTotal: 1 + trace.stageFiberEngineeringStrain,
        dtSec: trace.dtSec,
      },
      parameters,
    );
    if (result.ok) {
      state = result.nextState;
      stressPa.push(Math.max(0, result.sigmaSePa));
      sigmaMismatch.push(Math.abs(result.sigmaMismatchPa));
      energy.push(result.elasticEnergyJm3);
    } else {
      failures += 1;
      stressPa.push(Number.NaN);
    }
  }
  return {
    stressPa,
    failureFraction: matched.length === 0 ? 1 : failures / matched.length,
    maxAbsSigmaMismatchPa: finiteMaxOrNull(sigmaMismatch),
    maxElasticEnergyJm3: finiteMaxOrNull(energy),
  };
}

function classify(results: readonly LivePointResult[]): Classification {
  const measuredPoints = results.filter((result) =>
    result.healthStatus === "ok" && result.finalBeatSampleCount >= 8,
  );
  const measuredSides = measuredPoints.flatMap((result) => result.sideSummaries).filter((side) => side.measured);
  const pointGrossOk = measuredPoints.filter((result) =>
    result.morphologyBadges?.lvPv === "ok"
    && result.morphologyBadges.rvPv === "ok"
    && result.morphologyBadges.mvf === "ok"
    && result.morphologyBadges.tvf === "ok",
  ).length;
  const livePvOkCount = measuredSides.filter((side) => side.livePvBadge === "ok").length;
  const liveAvFlowOkCount = measuredSides.filter((side) => side.liveAvFlowBadge === "ok").length;
  const sourceStressSinglePeakCount =
    measuredSides.filter((side) => side.sourceStressPeakCount <= 1 && side.sourceStressTroughCount <= 1).length;
  const seStressSinglePeakCount =
    measuredSides.filter((side) => side.seStressPeakCount <= 1 && side.seStressTroughCount <= 1).length;
  const sourceStatePvFailSingleStress =
    measuredSides.filter((side) => side.interpretation === "source-state-stress-single-peaked-while-pv-fails").length;
  const sourceStateStressAlsoSuspect =
    measuredSides.filter((side) => side.interpretation === "source-state-stress-also-multi-peaked").length;
  const decision =
    measuredSides.length < 6
      ? "insufficient-measurement"
      : sourceStatePvFailSingleStress >= Math.ceil(0.5 * measuredSides.length)
        ? "not-source-state-limited"
        : sourceStateStressAlsoSuspect >= Math.ceil(0.35 * measuredSides.length)
          ? "source-state-component-still-suspect"
          : "insufficient-measurement";
  return {
    liveGrossMorphologyPass: `${pointGrossOk}/${measuredPoints.length}`,
    sideMeasuredCount: measuredSides.length,
    sideLivePvOkCount: livePvOkCount,
    sideLiveAvFlowOkCount: liveAvFlowOkCount,
    sideSourceStressSinglePeakCount: sourceStressSinglePeakCount,
    sideSeStressSinglePeakCount: seStressSinglePeakCount,
    sourceStateCoupledStepDecision: decision,
    notes: [
      "This diagnostic uses live Land source-provider commit traces and source-state-controlled SeriesElasticV1 replay; it does not use Phase 5BV synthetic calcium.",
      "Ca, filtered fiber strain, and raw fiber strain peak counts are recorded to separate Ca timing from load-driven kinematic feedback.",
      "If PV dome or AV inflow fails while live/source-state stress stays single-peaked, the next blocker is chamber pressure/volume plus valve-load coupling rather than Land source-state tuning.",
      "The envelope decision is based on LV/RV plus MVF/TVF morphology badges across representative preload/afterload/contractility points, not on normal-only screenshots.",
    ],
  };
}

function recommendedNext(classification: Classification): readonly string[] {
  if (classification.sourceStateCoupledStepDecision === "not-source-state-limited") {
    return [
      "stop LandAtrial parameter tuning until the ventricular chamber-pressure/volume plus valve-load coupled step is redesigned",
      "build the next runtime shadow around a source-state-preserving ChamberShell/CoupledStep surface rather than local valve smoothing or source-stress retuning",
      "keep deterministic LV/RV PV and MVF/TVF morphology checks as the hard adoption surface for broad envelope work",
    ];
  }
  if (classification.sourceStateCoupledStepDecision === "source-state-component-still-suspect") {
    return [
      "attribute the remaining source-state stress multi-peak to Ca timing, fiber kinematics, or adapter sign before any closed-loop adoption",
      "do not reopen A1/A2 and do not tune root/Zc, qDot, Tref, source-stress, or valve thresholds to hide morphology",
      "repeat the source-state trace on a reduced isolated chamber shell after fixing the source-state component",
    ];
  }
  return [
    "reduce the measurement to the settled health-ok envelope and rerun source-state traces before selecting a mechanism",
    "do not wire source-state SeriesElasticV1 or any local coupled step into runtime defaults from this diagnostic",
    "keep current user-0 closure morphology-blocked",
  ];
}

function sourceStateSeriesElasticParams(): SeriesElasticFiberParameters {
  return {
    ...DEFAULT_SERIES_ELASTIC_FIBER_PARAMETERS,
    seriesStiffnessPa: 600_000,
    seriesDampingPaSec: 3_500,
    maxLambdaSeAbs: 0.08,
    maxForceBalanceIterations: 12,
    forceBalanceTolerancePa: 500,
  };
}

function matchTraceToSamples(
  traces: readonly ModelCoreLand2017LvSourceProviderTraceSample[],
  samples: readonly SimSample[],
): readonly MatchedTraceSample[] {
  const out: MatchedTraceSample[] = [];
  let sampleIndex = 0;
  for (const trace of traces) {
    while (
      sampleIndex < samples.length - 1
      && Math.abs(samples[sampleIndex + 1].t - trace.after.tSec) <= Math.abs(samples[sampleIndex].t - trace.after.tSec)
    ) {
      sampleIndex += 1;
    }
    out.push({ trace, sample: samples[sampleIndex] });
  }
  return out;
}

function ejectionIndexes(outFlow: readonly number[], minAbsoluteFlowMlPerSec: number): readonly number[] {
  const flowMax = Math.max(0, ...outFlow);
  const threshold = Math.max(minAbsoluteFlowMlPerSec, 0.08 * flowMax);
  const indexes: number[] = [];
  for (let index = 0; index < outFlow.length; index += 1) {
    if (outFlow[index] > threshold) indexes.push(index);
  }
  return indexes;
}

function ejectionShape(
  pressure: readonly number[],
  ejectionIndexesInput: readonly number[],
  minProminenceMmHg: number,
): { readonly ok: boolean; readonly peakCount: number; readonly troughCount: number; readonly roughness: number } {
  const values = ejectionIndexesInput.map((index) => pressure[index]).filter(Number.isFinite);
  if (values.length < 8) return { ok: false, peakCount: 0, troughCount: 0, roughness: 0 };
  const span = valueRange(values);
  const prominence = Math.max(minProminenceMmHg, 0.10 * span);
  const peakCount = prominentExtremaCount(values, "max", prominence);
  const troughCount = prominentExtremaCount(values, "min", prominence);
  const roughness = totalVariation(values) / Math.max(span, 1e-9);
  return { ok: peakCount <= 1 && troughCount === 0 && roughness < 2.4, peakCount, troughCount, roughness };
}

function stressShape(stressPa: readonly number[]): {
  readonly peakCount: number;
  readonly troughCount: number;
  readonly roughness: number;
} {
  return scalarShape(stressPa, 250, 0.12);
}

function scalarShape(
  valuesIn: readonly number[],
  minAbsoluteProminence: number,
  minProminenceFraction: number,
): {
  readonly peakCount: number;
  readonly troughCount: number;
  readonly roughness: number;
} {
  const values = valuesIn.filter(Number.isFinite);
  if (values.length < 8) return { peakCount: 0, troughCount: 0, roughness: 0 };
  const span = valueRange(values);
  const prominence = Math.max(minAbsoluteProminence, minProminenceFraction * span);
  const peakCount = prominentCircularExtremaCount(values, "max", prominence);
  const troughCount = prominentCircularExtremaCount(values, "min", prominence);
  const roughness = totalVariation(values) / Math.max(span, 1e-9);
  return { peakCount, troughCount, roughness };
}

function prominentCircularExtremaCount(values: readonly number[], mode: "max" | "min", prominence: number): number {
  if (values.length < 3) return 0;
  let count = 0;
  for (let index = 0; index < values.length; index += 1) {
    const prev = values[(index - 1 + values.length) % values.length];
    const cur = values[index];
    const next = values[(index + 1) % values.length];
    const isExtremum = mode === "max"
      ? cur >= prev && cur > next
      : cur <= prev && cur < next;
    if (!isExtremum) continue;
    const neighborhood = circularNeighborhood(values, index, 8);
    const left = neighborhood.left;
    const right = neighborhood.right;
    const baseline = mode === "max"
      ? Math.max(Math.min(...left), Math.min(...right))
      : Math.min(Math.max(...left), Math.max(...right));
    const prom = mode === "max" ? cur - baseline : baseline - cur;
    if (prom >= prominence) count += 1;
  }
  return count;
}

function circularNeighborhood(
  values: readonly number[],
  index: number,
  radius: number,
): { readonly left: readonly number[]; readonly right: readonly number[] } {
  const left: number[] = [];
  const right: number[] = [];
  for (let offset = -radius; offset <= 0; offset += 1) {
    left.push(values[(index + offset + values.length) % values.length]);
  }
  for (let offset = 0; offset <= radius; offset += 1) {
    right.push(values[(index + offset) % values.length]);
  }
  return { left, right };
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

function emptySideSummary(side: SideId): SideSourceStateSummary {
  return {
    side,
    measured: false,
    finalBeatTraceSamples: 0,
    validSourceStateTraceSamples: 0,
    missingSourceStateTraceSamples: 0,
    livePvBadge: "not-measured",
    liveAvFlowBadge: "not-measured",
    livePressureDomeOk: false,
    livePressurePeakCount: 0,
    livePressureTroughCount: 0,
    livePressureRoughness: 0,
    sourceStressPeakCount: 0,
    sourceStressTroughCount: 0,
    sourceStressRoughness: 0,
    sourceStressFiniteFraction: 0,
    calciumPeakCount: 0,
    fiberStrainPeakCount: 0,
    fiberStrainTroughCount: 0,
    rawFiberStrainPeakCount: 0,
    rawFiberStrainTroughCount: 0,
    seStressPeakCount: 0,
    seStressTroughCount: 0,
    seStressRoughness: 0,
    seFailureFraction: 1,
    seMaxAbsSigmaMismatchPa: null,
    seMaxElasticEnergyJm3: null,
    sourceVsSePeakRatio: null,
    interpretation: "not-measured",
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

function fraction<T>(values: readonly T[], predicate: (value: T) => boolean): number {
  if (values.length === 0) return 0;
  return values.filter(predicate).length / values.length;
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
  const evidence = buildVentricularSourceStateCoupledStepPhase5BWEvidence();
  const outputPath = path.resolve(process.cwd(), VENTRICULAR_SOURCE_STATE_COUPLED_STEP_PHASE5BW_RESULT_PATH);
  mkdirSync(path.dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(evidence, null, 2)}\n`);
  console.log(JSON.stringify({
    id: evidence.id,
    path: VENTRICULAR_SOURCE_STATE_COUPLED_STEP_PHASE5BW_RESULT_PATH,
    hash: evidence.normalizedSha256,
    classification: evidence.classification,
  }, null, 2));
}

const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : "";
if (import.meta.url === invokedPath) {
  writeEvidence();
}
