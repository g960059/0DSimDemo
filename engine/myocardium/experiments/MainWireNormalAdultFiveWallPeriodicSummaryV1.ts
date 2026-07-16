import {
  measureLaPvReservoirConduitOrderV1,
  type LaPvReservoirConduitOrderV1,
} from "@/engine/mechanics2/diagnostics/LaPvReservoirConduitOrderV1";
import {
  measureLaPvTwoLobesV2,
  type LaPvLobeMeasurementV2,
  type LaPvMeasuredLobeV2,
} from "@/engine/mechanics2/diagnostics/LaPvLobeMeasurementV2";
import {
  FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import {
  measureMainWireNormalAdultFiveWallCycleDiagnosticsV1,
  type MainWireNormalAdultFiveWallCycleDiagnosticsV1,
} from "@/engine/myocardium/diagnostics/MainWireNormalAdultFiveWallCycleDiagnosticsV1";
import type {
  MainWireNormalAdultFiveWallDiagnosticSampleV2,
} from "@/engine/myocardium/diagnostics/MainWireNormalAdultFiveWallDiagnosticSampleV2";
import type {
  MainWireFiveWallPeriodicClosureGroupV1,
  MainWireFiveWallPeriodicClosureReportV1,
} from "@/engine/myocardium/experiments/MainWireFiveWallPeriodicClosureV1";
import type {
  MainWireNormalAdultFiveWallPeriodicResultV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";
import {
  NORMAL_ADULT_FIVE_WALL_PRIOR_V1,
} from "@/engine/myocardium/mechanics/normalAdultFiveWallPriorV1";

export const MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_SUMMARY_V1_ID =
  "main-wire-normal-adult-five-wall-periodic-summary-v1" as const;

export const MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_SUMMARY_CLAIM_V1 =
  Object.freeze({
    input: "periodic-runner-accepted-readback-only" as const,
    selectedCycle: "last-retained-complete-beat" as const,
    addsDynamicState: false as const,
    changesPhysiologyOrMaterialParameters: false as const,
    parameterSearchOrTuning: false as const,
    smoothingOrInterpolation: false as const,
    morphologyMetricsComputedWhenNotPeriodic: true as const,
    morphologyInterpretationRequiresPeriod1Convergence: true as const,
    morphologyMetricAcceptanceThresholdApplied: false as const,
  });

type ChamberId = "LA" | "LV" | "RA" | "RV";
type FlowId = "MV" | "AoV" | "TV" | "PV" | "PVein_LA";
type AbsolutePressureId = "Ao" | "PA" | "PVein";
type ValveId = "MV" | "AoV" | "TV" | "PV";

export type MainWireNormalAdultFiveWallRangeV1 = Readonly<{
  minimum: number;
  maximum: number;
}>;

export type MainWireNormalAdultFiveWallCompactLobeV1 = Readonly<
  Omit<LaPvMeasuredLobeV2, "path"> & { pointCount: number }
>;

export type MainWireNormalAdultFiveWallCompactTwoLobesV1 =
  | Readonly<
    Omit<
      Extract<LaPvLobeMeasurementV2, { status: "measurable" }>,
      "aLobe" | "vLobe"
    > & {
      aLobe: MainWireNormalAdultFiveWallCompactLobeV1;
      vLobe: MainWireNormalAdultFiveWallCompactLobeV1;
    }
  >
  | Extract<LaPvLobeMeasurementV2, { status: "not-measurable" }>;

export type MainWireNormalAdultFiveWallCompactBranchOrderV1 = Readonly<
  Omit<LaPvReservoirConduitOrderV1, "probes">
>;

export type MainWireNormalAdultFiveWallCompactClosureV1 = Readonly<{
  elapsedTimeSec: number;
  entryCount: number;
  maximumNormalizedDelta: number;
  worstGroup: MainWireFiveWallPeriodicClosureGroupV1;
  worstPath: string;
  groupMaximumNormalizedDelta: Readonly<Record<
    MainWireFiveWallPeriodicClosureGroupV1,
    Readonly<{ maximumNormalizedDelta: number; worstPath: string }>
  >>;
}>;

export type MainWireNormalAdultFiveWallPeriodicSummaryV1 = Readonly<{
  summaryId:
    typeof MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_SUMMARY_V1_ID;
  source: Readonly<{
    experimentId: MainWireNormalAdultFiveWallPeriodicResultV1["experimentId"];
    initialization: MainWireNormalAdultFiveWallPeriodicResultV1["initialization"];
    laSlsMode: MainWireNormalAdultFiveWallPeriodicResultV1["laSlsMode"];
    dtSec: number;
    requestedMaximumBeatCount: number;
    completedBeatCount: number;
    terminationReason: MainWireNormalAdultFiveWallPeriodicResultV1["terminationReason"];
    integrationCompletedWithoutFailure: boolean;
    failure: MainWireNormalAdultFiveWallPeriodicResultV1["failure"];
  }>;
  convergence: Readonly<{
    classifier: MainWireNormalAdultFiveWallPeriodicResultV1["periodicity"];
    periodicSteadyStateClaimed: boolean;
    period2OrbitSuspected: boolean;
    latestPeriod1Closure: MainWireNormalAdultFiveWallCompactClosureV1 | null;
    latestPeriod2Closure: MainWireNormalAdultFiveWallCompactClosureV1 | null;
  }>;
  morphologyInterpretation: Readonly<{
    eligible: boolean;
    reason:
      | "eligible-period1-converged"
      | "ineligible-period2-suspect"
      | "ineligible-period1-not-converged";
  }>;
  selectedBeat: Readonly<{
    beatIndex: number;
    startTimeSec: number;
    endTimeSec: number;
    sampleCount: number;
    precedingAcceptedSampleAvailable: boolean;
    precedingBeatIndex: number | null;
  }>;
  fixedActivationPrior: Readonly<{
    parameterSetId: string;
    atrialCalciumOnsetPhase01: number;
    activationNormalization:
      "clamp((freeCa-diastolicCa)/peakAmplitude,0,1)";
  }>;
  ranges: Readonly<{
    chamberVolumeMl: Readonly<Record<ChamberId,
      MainWireNormalAdultFiveWallRangeV1>>;
    chamberTransmuralPressureMmHg: Readonly<Record<ChamberId,
      MainWireNormalAdultFiveWallRangeV1>>;
    absolutePressureMmHg: Readonly<Record<AbsolutePressureId,
      MainWireNormalAdultFiveWallRangeV1>>;
    flowMlPerSec: Readonly<Record<FlowId,
      MainWireNormalAdultFiveWallRangeV1>>;
  }>;
  hemodynamics: Readonly<{
    leftVentricularEjectionFraction01: number;
    rightVentricularEjectionFraction01: number;
    netAorticStrokeVolumeMl: number;
    forwardAorticStrokeVolumeMl: number;
    netAorticCardiacOutputLPerMin: number;
    cardiacIndexLPerMinPerM2: number;
    meanAorticAbsolutePressureMmHg: number;
  }>;
  cyclePhysiology: Omit<
    MainWireNormalAdultFiveWallCycleDiagnosticsV1,
    "phaseBySample"
  >;
  laPvMorphology: Readonly<{
    twoLobes: MainWireNormalAdultFiveWallCompactTwoLobesV1;
    reservoirConduitEqualVolumeOrder:
      MainWireNormalAdultFiveWallCompactBranchOrderV1;
  }>;
  residualMaxima: Readonly<{
    mechanicsResidualNorm: number;
    circulationScaledResidualInfinityNorm: number;
    absoluteContinuityResidualMl: number;
    absoluteTotalBloodVolumeErrorMl: number;
    absoluteValvePowerBalanceResidualMmHgMlPerSec: Readonly<Record<
      ValveId,
      number
    >>;
  }>;
  claim:
    typeof MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_SUMMARY_CLAIM_V1;
}>;

/**
 * Produces a compact, pure readback of the last retained complete beat.
 * Morphology is still measured for debugging before closure, but it is marked
 * interpretable only after the runner has established a period-1 orbit.
 */
export function summarizeMainWireNormalAdultFiveWallPeriodicSteadyV1(
  result: MainWireNormalAdultFiveWallPeriodicResultV1,
): MainWireNormalAdultFiveWallPeriodicSummaryV1 {
  const selectedBeat = result.retainedCompleteBeats.at(-1);
  if (selectedBeat === undefined || selectedBeat.samples.length === 0) {
    throw new Error("periodic result has no retained complete beat to summarize");
  }
  if (selectedBeat.samples.length !== result.stepsPerBeat) {
    throw new Error("retained complete beat does not match stepsPerBeat");
  }
  const precedingBeat = result.retainedCompleteBeats.at(-2);
  const precedingSample = precedingBeat !== undefined
      && precedingBeat.beatIndex + 1 === selectedBeat.beatIndex
    ? precedingBeat.samples.at(-1) ?? null
    : null;
  const samples = selectedBeat.samples;
  const atrialOnsetPhase01 = normalAtrialCalciumOnsetPhase01();
  const cycle = measureMainWireNormalAdultFiveWallCycleDiagnosticsV1({
    samples,
    precedingSample,
    dtSec: result.dtSec,
    atrialCalciumOnsetPhase01: atrialOnsetPhase01,
    wallMaterialVolumeMlByWall: wallMaterialVolumesMl(),
  });
  const lobeMeasurement = measureLaPvTwoLobesV2(samples.map((sample, index) =>
    Object.freeze({
      theta: sample.cyclePhase01,
      laVolumeMl: sample.nodeVolumeMl.LA,
      laPressureMmHg: sample.chamberTransmuralPressureMmHg.LA,
      laActivation01: atrialActivation01(sample),
      phase: cycle.phaseBySample[index]!,
    })));
  const branchOrder = measureLaPvReservoirConduitOrderV1({
    reservoir: cyclicSegmentInclusive(
      samples,
      cycle.events.mitralValveClosure.sampleIndex,
      cycle.events.mitralValveOpening.sampleIndex,
    ).map(pvPoint),
    conduit: cyclicSegmentInclusive(
      samples,
      cycle.events.mitralValveOpening.sampleIndex,
      cycle.events.atrialCalciumOnset.sampleIndex,
    ).map(pvPoint),
  });
  const latestClosure = result.beatClosure.at(-1) ?? null;
  const morphologyEligibility = morphologyInterpretation(result);
  const netAorticStrokeVolumeMl = samples.reduce(
    (sum, sample) => sum + sample.flowMlPerSec.AoV * result.dtSec,
    0,
  );
  const forwardAorticStrokeVolumeMl = samples.reduce(
    (sum, sample) =>
      sum + Math.max(sample.flowMlPerSec.AoV, 0) * result.dtSec,
    0,
  );
  const { phaseBySample: _phaseBySample, ...compactCycle } = cycle;

  return Object.freeze({
    summaryId: MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_SUMMARY_V1_ID,
    source: Object.freeze({
      experimentId: result.experimentId,
      initialization: result.initialization,
      laSlsMode: result.laSlsMode,
      dtSec: result.dtSec,
      requestedMaximumBeatCount: result.requestedMaximumBeatCount,
      completedBeatCount: result.completedBeatCount,
      terminationReason: result.terminationReason,
      integrationCompletedWithoutFailure:
        result.integrationCompletedWithoutFailure,
      failure: result.failure,
    }),
    convergence: Object.freeze({
      classifier: result.periodicity,
      periodicSteadyStateClaimed: result.periodicSteadyStateClaimed,
      period2OrbitSuspected: result.period2OrbitSuspected,
      latestPeriod1Closure: latestClosure?.period1 === null
        || latestClosure === null
        ? null
        : compactClosure(latestClosure.period1),
      latestPeriod2Closure: latestClosure?.period2 === null
        || latestClosure === null
        ? null
        : compactClosure(latestClosure.period2),
    }),
    morphologyInterpretation: morphologyEligibility,
    selectedBeat: Object.freeze({
      beatIndex: selectedBeat.beatIndex,
      startTimeSec: selectedBeat.startTimeSec,
      endTimeSec: selectedBeat.endTimeSec,
      sampleCount: samples.length,
      precedingAcceptedSampleAvailable: precedingSample !== null,
      precedingBeatIndex: precedingSample === null
        ? null
        : precedingBeat!.beatIndex,
    }),
    fixedActivationPrior: Object.freeze({
      parameterSetId:
        FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1.parameterSetId,
      atrialCalciumOnsetPhase01: atrialOnsetPhase01,
      activationNormalization:
        "clamp((freeCa-diastolicCa)/peakAmplitude,0,1)" as const,
    }),
    ranges: Object.freeze({
      chamberVolumeMl: chamberRecord((chamber) =>
        range(samples.map((sample) => sample.nodeVolumeMl[chamber]))),
      chamberTransmuralPressureMmHg: chamberRecord((chamber) =>
        range(samples.map((sample) =>
          sample.chamberTransmuralPressureMmHg[chamber]))),
      absolutePressureMmHg: absolutePressureRecord((node) =>
        range(samples.map((sample) => sample.nodeAbsolutePressureMmHg[node]))),
      flowMlPerSec: flowRecord((flow) =>
        range(samples.map((sample) => sample.flowMlPerSec[flow]))),
    }),
    hemodynamics: Object.freeze({
      leftVentricularEjectionFraction01: ejectionFraction(
        samples.map((sample) => sample.nodeVolumeMl.LV),
      ),
      rightVentricularEjectionFraction01: ejectionFraction(
        samples.map((sample) => sample.nodeVolumeMl.RV),
      ),
      netAorticStrokeVolumeMl,
      forwardAorticStrokeVolumeMl,
      netAorticCardiacOutputLPerMin:
        netAorticStrokeVolumeMl / (samples.length * result.dtSec) * 60 / 1000,
      cardiacIndexLPerMinPerM2:
        netAorticStrokeVolumeMl / (samples.length * result.dtSec) * 60 / 1000
        / NORMAL_ADULT_FIVE_WALL_PRIOR_V1.bodySurfaceAreaM2,
      meanAorticAbsolutePressureMmHg: mean(samples.map((sample) =>
        sample.nodeAbsolutePressureMmHg.Ao)),
    }),
    cyclePhysiology: Object.freeze(compactCycle),
    laPvMorphology: Object.freeze({
      twoLobes: compactTwoLobes(lobeMeasurement),
      reservoirConduitEqualVolumeOrder: compactBranchOrder(branchOrder),
    }),
    residualMaxima: Object.freeze({
      mechanicsResidualNorm: maximumAbsolute(samples.map((sample) =>
        sample.diagnostics.mechanicsResidualNorm)),
      circulationScaledResidualInfinityNorm:
        maximumAbsolute(samples.map((sample) =>
          sample.diagnostics.circulationScaledResidualInfinityNorm)),
      absoluteContinuityResidualMl: maximumAbsolute(samples.map((sample) =>
        sample.diagnostics.maximumContinuityResidualMl)),
      absoluteTotalBloodVolumeErrorMl: maximumAbsolute(samples.map((sample) =>
        sample.diagnostics.totalBloodVolumeErrorMl)),
      absoluteValvePowerBalanceResidualMmHgMlPerSec: valveRecord((valve) =>
        maximumAbsolute(samples.map((sample) =>
          sample.valveHydraulics[valve]
            .powerBalanceResidualMmHgMlPerSec))),
    }),
    claim: MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_SUMMARY_CLAIM_V1,
  });
}

function compactClosure(
  closure: MainWireFiveWallPeriodicClosureReportV1,
): MainWireNormalAdultFiveWallCompactClosureV1 {
  return Object.freeze({
    elapsedTimeSec: closure.elapsedTimeSec,
    entryCount: closure.overall.entryCount,
    maximumNormalizedDelta: closure.overall.maximumNormalizedDelta,
    worstGroup: closure.overall.worstGroup,
    worstPath: closure.overall.worstPath,
    groupMaximumNormalizedDelta: Object.freeze(Object.fromEntries(
      Object.entries(closure.groups).map(([group, report]) => [
        group,
        Object.freeze({
          maximumNormalizedDelta: report.maximumNormalizedDelta,
          worstPath: report.worstPath,
        }),
      ]),
    )) as MainWireNormalAdultFiveWallCompactClosureV1[
      "groupMaximumNormalizedDelta"
    ],
  });
}

function morphologyInterpretation(
  result: MainWireNormalAdultFiveWallPeriodicResultV1,
): MainWireNormalAdultFiveWallPeriodicSummaryV1[
  "morphologyInterpretation"
] {
  const eligible = result.integrationCompletedWithoutFailure
    && result.terminationReason === "period1-converged"
    && result.periodicity.status === "period1-converged"
    && result.periodicSteadyStateClaimed;
  return Object.freeze({
    eligible,
    reason: eligible
      ? "eligible-period1-converged" as const
      : result.terminationReason === "period2-suspect"
          || result.periodicity.status === "period2-suspect"
        ? "ineligible-period2-suspect" as const
        : "ineligible-period1-not-converged" as const,
  });
}

function compactTwoLobes(
  measured: LaPvLobeMeasurementV2,
): MainWireNormalAdultFiveWallCompactTwoLobesV1 {
  if (measured.status === "not-measurable") return measured;
  return Object.freeze({
    ...measured,
    aLobe: compactLobe(measured.aLobe),
    vLobe: compactLobe(measured.vLobe),
  });
}

function compactLobe(
  lobe: LaPvMeasuredLobeV2,
): MainWireNormalAdultFiveWallCompactLobeV1 {
  const { path, ...withoutPath } = lobe;
  return Object.freeze({ ...withoutPath, pointCount: path.length });
}

function compactBranchOrder(
  measured: LaPvReservoirConduitOrderV1,
): MainWireNormalAdultFiveWallCompactBranchOrderV1 {
  const { probes: _probes, ...withoutProbes } = measured;
  return Object.freeze(withoutProbes);
}

function atrialActivation01(
  sample: MainWireNormalAdultFiveWallDiagnosticSampleV2,
): number {
  const atrial = FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1.atrial;
  return clamp01(
    (sample.freeCalciumUM.LA - atrial.diastolicCalciumUM)
      / atrial.peakAmplitudeUM,
  );
}

function normalAtrialCalciumOnsetPhase01(): number {
  const prior = FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1;
  return positiveModulo(
    prior.cycleLengthSec - prior.atrioventricularDelaySec
      + prior.atrial.electricalToCalciumDelaySec,
    prior.cycleLengthSec,
  ) / prior.cycleLengthSec;
}

function wallMaterialVolumesMl() {
  const prior = NORMAL_ADULT_FIVE_WALL_PRIOR_V1;
  const ventricular = prior.anatomy.triSeg.wallGeometryParameters;
  return Object.freeze({
    LA: prior.anatomy.atria.LA.wallMaterialVolumeMl,
    LVFW: ventricular.LVFW.wallMaterialVolumeM3 * 1e6,
    SEP: ventricular.SEP.wallMaterialVolumeM3 * 1e6,
    RVFW: ventricular.RVFW.wallMaterialVolumeM3 * 1e6,
    RA: prior.anatomy.atria.RA.wallMaterialVolumeMl,
  });
}

function cyclicSegmentInclusive<T>(
  values: readonly T[],
  startIndex: number,
  endIndex: number,
): readonly T[] {
  const segment: T[] = [];
  let index = startIndex;
  for (let guard = 0; guard <= values.length; guard += 1) {
    segment.push(values[index]!);
    if (index === endIndex) return Object.freeze(segment);
    index = (index + 1) % values.length;
  }
  throw new Error("cyclic event segment did not terminate");
}

function pvPoint(sample: MainWireNormalAdultFiveWallDiagnosticSampleV2) {
  return Object.freeze({
    laVolumeMl: sample.nodeVolumeMl.LA,
    laPressureMmHg: sample.chamberTransmuralPressureMmHg.LA,
  });
}

function ejectionFraction(values: readonly number[]): number {
  const measured = range(values);
  return (measured.maximum - measured.minimum) / measured.maximum;
}

function range(values: readonly number[]): MainWireNormalAdultFiveWallRangeV1 {
  return Object.freeze({
    minimum: Math.min(...values),
    maximum: Math.max(...values),
  });
}

function mean(values: readonly number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function maximumAbsolute(values: readonly number[]): number {
  return Math.max(...values.map(Math.abs));
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function positiveModulo(value: number, modulus: number): number {
  const result = value % modulus;
  return result < 0 ? result + modulus : result;
}

function chamberRecord<T>(
  build: (chamber: ChamberId) => T,
): Readonly<Record<ChamberId, T>> {
  return Object.freeze(Object.fromEntries(
    (["LA", "LV", "RA", "RV"] as const).map((chamber) =>
      [chamber, build(chamber)]),
  )) as Readonly<Record<ChamberId, T>>;
}

function absolutePressureRecord<T>(
  build: (node: AbsolutePressureId) => T,
): Readonly<Record<AbsolutePressureId, T>> {
  return Object.freeze(Object.fromEntries(
    (["Ao", "PA", "PVein"] as const).map((node) => [node, build(node)]),
  )) as Readonly<Record<AbsolutePressureId, T>>;
}

function flowRecord<T>(
  build: (flow: FlowId) => T,
): Readonly<Record<FlowId, T>> {
  return Object.freeze(Object.fromEntries(
    (["MV", "AoV", "TV", "PV", "PVein_LA"] as const).map((flow) =>
      [flow, build(flow)]),
  )) as Readonly<Record<FlowId, T>>;
}

function valveRecord<T>(
  build: (valve: ValveId) => T,
): Readonly<Record<ValveId, T>> {
  return Object.freeze(Object.fromEntries(
    (["MV", "AoV", "TV", "PV"] as const).map((valve) =>
      [valve, build(valve)]),
  )) as Readonly<Record<ValveId, T>>;
}
