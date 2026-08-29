import type {
  MainWireAorticValveObservationGeometryV1,
} from "@/analysis/methods/mainWire/MainWireAorticValveObservationStationsV1";
import {
  measureMainWireVentricularCalciumSourceTraceFitRecalibrationReadbackV1,
  type MainWireVentricularCalciumSourceTraceFitRecalibrationReadbackV1,
} from "@/analysis/methods/mainWire/MainWireVentricularCalciumSourceTraceFitRecalibrationSensitivityV1";
import {
  measureMainWireVentricularCalciumSourceTraceFitDiastolicFlowV1,
  type MainWireVentricularCalciumSourceTraceFitDiastolicFlowReadbackV1,
} from "@/analysis/methods/mainWire/MainWireVentricularCalciumSourceTraceFitShortlistLoadEnvelopeV1";
import type {
  NonCoronaryNodeNameV1,
} from "@/engine/core/nonCoronaryCirculationBackwardEulerV1";
import {
  MAIN_WIRE_AORTIC_OUTFLOW_CANDIDATE_CIRCULATORY_RECALIBRATION_CLAIM_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_CANDIDATE_CIRCULATORY_RECALIBRATION_CONTEXT_IDS_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_CANDIDATE_CIRCULATORY_RECALIBRATION_LEVELS_V1,
  resolveMainWireAorticOutflowCandidateCirculatoryRecalibrationContextV1,
  type MainWireAorticOutflowCandidateCirculatoryRecalibrationContextIdV1,
  type MainWireAorticOutflowCandidateCirculatoryRecalibrationContextV1,
  type MainWireAorticOutflowCandidateCirculatoryRecalibrationLevelV1,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowCandidateCirculatoryRecalibrationV1";
import {
  MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V7,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowPhysiologyCandidateV7";
import type {
  MainWireNormalAdultFiveWallAorticOutflowLandCoppiniSourceTraceWindkesselResearchRunV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";

export const MAIN_WIRE_AORTIC_OUTFLOW_CANDIDATE_CIRCULATORY_RECALIBRATION_ANALYSIS_V1_ID =
  "main-wire-aortic-outflow-candidate-circulatory-recalibration-analysis-v1" as const;

export const MAIN_WIRE_AORTIC_OUTFLOW_CANDIDATE_CIRCULATORY_RECALIBRATION_ANALYSIS_CLAIM_V1 =
  Object.freeze({
    source: "last-retained-complete-beat-per-independent-cold-run" as const,
    pressureMeansUseAcceptedSamplesWithoutInterpolation: true as const,
    pressureAndVolumeRangesUseAcceptedSampleExtrema: true as const,
    pulmonaryVenousSignalIsAggregateFlowNotDopplerVelocity: true as const,
    fixedFactorialUsedForCausalSeparationNotParameterFit: true as const,
    exactFrameMutation: false as const,
    smoothingApplied: false as const,
    interpolationApplied: false as const,
    clinicalTargetsApplied: false as const,
    parameterOptimizationOrFitApplied: false as const,
    clinicalValidationClaimed: false as const,
    canonicalAdoptionEstablished: false as const,
  });

export const MAIN_WIRE_AORTIC_OUTFLOW_CANDIDATE_CIRCULATORY_RECALIBRATION_PRESSURE_NODE_IDS_V1 =
  Object.freeze([
    "Ao",
    "PA",
    "PVein",
    "LA",
    "LV",
    "RA",
    "RV",
    "VC",
  ] as const satisfies readonly NonCoronaryNodeNameV1[]);

type PressureNodeId =
  (typeof MAIN_WIRE_AORTIC_OUTFLOW_CANDIDATE_CIRCULATORY_RECALIBRATION_PRESSURE_NODE_IDS_V1)[number];
type ChamberId = "LA" | "LV" | "RA" | "RV";
type NumericRange = Readonly<{ minimum: number; maximum: number }>;

export type MainWireAorticOutflowCandidateCirculatoryRecalibrationInputV1 =
  Readonly<{
    contextId:
      MainWireAorticOutflowCandidateCirculatoryRecalibrationContextIdV1;
    run:
      MainWireNormalAdultFiveWallAorticOutflowLandCoppiniSourceTraceWindkesselResearchRunV1;
  }>;

export type MainWireAorticOutflowCandidateCirculatorySystemReadbackV1 =
  Readonly<{
    meanAbsolutePressureMmHg: Readonly<Record<PressureNodeId, number>>;
    absolutePressureRangeMmHg:
      Readonly<Record<PressureNodeId, NumericRange>>;
    meanChamberVolumeMl: Readonly<Record<ChamberId, number>>;
    chamberVolumeRangeMl: Readonly<Record<ChamberId, NumericRange>>;
    commonPericardialExcessPressureRangeMmHg: NumericRange;
  }>;

export type MainWireAorticOutflowCandidateCirculatoryRecalibrationArmV1 =
  Readonly<{
    context:
      MainWireAorticOutflowCandidateCirculatoryRecalibrationContextV1;
    protocolIdentityHash: string;
    readback:
      MainWireVentricularCalciumSourceTraceFitRecalibrationReadbackV1;
    diastolicFlow:
      MainWireVentricularCalciumSourceTraceFitDiastolicFlowReadbackV1;
    system: MainWireAorticOutflowCandidateCirculatorySystemReadbackV1;
  }>;

type ContrastMetrics = Readonly<{
  ejectionTimeMs: number;
  isovolumicContractionTimeMs: number | null;
  leftVentricularTeiIndex: number | null;
  maximumPositiveLeftVentricularPressureRiseRateMmHgPerSec: number | null;
  maximumLeftVentricularPressureFallRateMagnitudeMmHgPerSec: number | null;
  aorticForwardVolumeMl: number;
  peakVenaContractaVelocityMPerSec: number;
  meanDopplerGradientMmHg: number;
  peakDopplerGradientMmHg: number;
  meanAorticPressureMmHg: number;
  leftVentricularEjectionFraction01: number;
  meanLeftAtrialPressureMmHg: number;
  meanPulmonaryVeinPressureMmHg: number;
  meanPulmonaryArteryPressureMmHg: number;
  meanRightAtrialPressureMmHg: number;
  meanCentralVenousPressureMmHg: number;
  leftVentricularEndDiastolicVolumeMl: number;
  ivrtLikeMs: number | null;
  relaxationTauMs: number | null;
  pulmonaryVenousAtrialReversalVolumeMl: number | null;
}>;

export type MainWireAorticOutflowCandidateCirculatoryRecalibrationContrastV1 =
  Readonly<{
    changedAxis: "pulmonary-resistance" | "stressed-venous-volume";
    heldLevel:
      MainWireAorticOutflowCandidateCirculatoryRecalibrationLevelV1;
    lowContextId:
      MainWireAorticOutflowCandidateCirculatoryRecalibrationContextIdV1;
    highContextId:
      MainWireAorticOutflowCandidateCirculatoryRecalibrationContextIdV1;
    highMinusLow: ContrastMetrics;
  }>;

export type MainWireAorticOutflowCandidateCirculatoryRecalibrationV1 =
  Readonly<{
    methodId:
      typeof MAIN_WIRE_AORTIC_OUTFLOW_CANDIDATE_CIRCULATORY_RECALIBRATION_ANALYSIS_V1_ID;
    geometry: MainWireAorticValveObservationGeometryV1;
    arms:
      readonly MainWireAorticOutflowCandidateCirculatoryRecalibrationArmV1[];
    baselineContextId: "pvr-baseline__tbv-baseline";
    rangesAcrossFactorial: Readonly<Record<keyof ContrastMetrics, NumericRange | null>>;
    pulmonaryResistanceContrasts:
      readonly MainWireAorticOutflowCandidateCirculatoryRecalibrationContrastV1[];
    stressedVenousVolumeContrasts:
      readonly MainWireAorticOutflowCandidateCirculatoryRecalibrationContrastV1[];
    allRunsPeriod1AndIntegrated: boolean;
    allArmsHaveOneProminentAorticFlowPeak: boolean;
    maximumSecondaryAorticFlowPeakProminenceFractionOfGlobalMaximum: number;
    allDiastolicReadbacksAvailable: boolean;
    allProtocolIdentitiesDistinct: boolean;
    experimentClaim:
      typeof MAIN_WIRE_AORTIC_OUTFLOW_CANDIDATE_CIRCULATORY_RECALIBRATION_CLAIM_V1;
    claim:
      typeof MAIN_WIRE_AORTIC_OUTFLOW_CANDIDATE_CIRCULATORY_RECALIBRATION_ANALYSIS_CLAIM_V1;
  }>;

export function measureMainWireAorticOutflowCandidateCirculatoryRecalibrationV1(
  inputs:
    readonly MainWireAorticOutflowCandidateCirculatoryRecalibrationInputV1[],
  geometry: MainWireAorticValveObservationGeometryV1,
): MainWireAorticOutflowCandidateCirculatoryRecalibrationV1 {
  const byId = new Map<
    MainWireAorticOutflowCandidateCirculatoryRecalibrationContextIdV1,
    MainWireAorticOutflowCandidateCirculatoryRecalibrationInputV1
  >();
  for (const input of inputs) {
    if (byId.has(input.contextId)) {
      throw new Error(`duplicate circulatory recalibration context: ${input.contextId}`);
    }
    assertRunMatchesContext(input);
    byId.set(input.contextId, input);
  }
  if (byId.size !==
    MAIN_WIRE_AORTIC_OUTFLOW_CANDIDATE_CIRCULATORY_RECALIBRATION_CONTEXT_IDS_V1.length) {
    throw new Error(
      "candidate circulatory recalibration requires its exact nine-arm factorial",
    );
  }

  const arms = Object.freeze(
    MAIN_WIRE_AORTIC_OUTFLOW_CANDIDATE_CIRCULATORY_RECALIBRATION_CONTEXT_IDS_V1
      .map((contextId) => {
        const input = byId.get(contextId);
        if (input === undefined) {
          throw new Error(`missing circulatory recalibration context: ${contextId}`);
        }
        const readback =
          measureMainWireVentricularCalciumSourceTraceFitRecalibrationReadbackV1(
            input.run.periodicResult,
            input.run.calciumDriveParams,
            contextId,
            geometry,
          );
        return Object.freeze({
          context:
            resolveMainWireAorticOutflowCandidateCirculatoryRecalibrationContextV1(
              contextId,
            ),
          protocolIdentityHash: input.run.periodicResult.protocolIdentityHash,
          readback,
          diastolicFlow:
            measureMainWireVentricularCalciumSourceTraceFitDiastolicFlowV1(
              input.run.periodicResult,
              input.run.calciumDriveParams,
            ),
          system: measureSystemReadback(input.run),
        });
      }),
  );
  const metrics = new Map(arms.map((arm) => [
    arm.context.contextId,
    contrastMetrics(arm),
  ] as const));
  const rangesAcrossFactorial = rangeRecord([...metrics.values()]);
  return Object.freeze({
    methodId:
      MAIN_WIRE_AORTIC_OUTFLOW_CANDIDATE_CIRCULATORY_RECALIBRATION_ANALYSIS_V1_ID,
    geometry: Object.freeze({ ...geometry }),
    arms,
    baselineContextId: "pvr-baseline__tbv-baseline" as const,
    rangesAcrossFactorial,
    pulmonaryResistanceContrasts: Object.freeze(
      MAIN_WIRE_AORTIC_OUTFLOW_CANDIDATE_CIRCULATORY_RECALIBRATION_LEVELS_V1
        .map((tbvLevel) => contrast(
          "pulmonary-resistance",
          tbvLevel,
          contextId("low", tbvLevel),
          contextId("high", tbvLevel),
          metrics,
        )),
    ),
    stressedVenousVolumeContrasts: Object.freeze(
      MAIN_WIRE_AORTIC_OUTFLOW_CANDIDATE_CIRCULATORY_RECALIBRATION_LEVELS_V1
        .map((pvrLevel) => contrast(
          "stressed-venous-volume",
          pvrLevel,
          contextId(pvrLevel, "low"),
          contextId(pvrLevel, "high"),
          metrics,
        )),
    ),
    allRunsPeriod1AndIntegrated: arms.every((arm) =>
      arm.readback.periodicSteadyStateClaimed
      && arm.readback.integrationCompletedWithoutFailure),
    allArmsHaveOneProminentAorticFlowPeak: arms.every((arm) =>
      arm.readback.cycle.aorticFlowDistinctPeakCountAboveFivePercent === 1),
    maximumSecondaryAorticFlowPeakProminenceFractionOfGlobalMaximum:
      Math.max(...arms.map((arm) =>
        arm.readback.cycle
          .maximumSecondaryAorticFlowPeakProminenceFractionOfGlobalMaximum)),
    allDiastolicReadbacksAvailable: arms.every((arm) =>
      arm.diastolicFlow.value !== null),
    allProtocolIdentitiesDistinct:
      new Set(arms.map((arm) => arm.protocolIdentityHash)).size === arms.length,
    experimentClaim:
      MAIN_WIRE_AORTIC_OUTFLOW_CANDIDATE_CIRCULATORY_RECALIBRATION_CLAIM_V1,
    claim:
      MAIN_WIRE_AORTIC_OUTFLOW_CANDIDATE_CIRCULATORY_RECALIBRATION_ANALYSIS_CLAIM_V1,
  });
}

function measureSystemReadback(
  run:
    MainWireNormalAdultFiveWallAorticOutflowLandCoppiniSourceTraceWindkesselResearchRunV1,
): MainWireAorticOutflowCandidateCirculatorySystemReadbackV1 {
  const samples = run.periodicResult.retainedCompleteBeats.at(-1)?.samples;
  if (samples === undefined || samples.length === 0) {
    throw new Error("circulatory recalibration arm has no retained samples");
  }
  const pressureRecord = <T>(
    build: (nodeId: PressureNodeId) => T,
  ): Readonly<Record<PressureNodeId, T>> => Object.freeze(Object.fromEntries(
    MAIN_WIRE_AORTIC_OUTFLOW_CANDIDATE_CIRCULATORY_RECALIBRATION_PRESSURE_NODE_IDS_V1
      .map((nodeId) => [nodeId, build(nodeId)]),
  )) as Readonly<Record<PressureNodeId, T>>;
  const chamberRecord = <T>(
    build: (chamberId: ChamberId) => T,
  ): Readonly<Record<ChamberId, T>> => Object.freeze(Object.fromEntries(
    (["LA", "LV", "RA", "RV"] as const)
      .map((chamberId) => [chamberId, build(chamberId)]),
  )) as Readonly<Record<ChamberId, T>>;
  return Object.freeze({
    meanAbsolutePressureMmHg: pressureRecord((nodeId) => mean(samples.map(
      (sample) => sample.circulationNodeAbsolutePressureMmHg[nodeId],
    ))),
    absolutePressureRangeMmHg: pressureRecord((nodeId) => range(samples.map(
      (sample) => sample.circulationNodeAbsolutePressureMmHg[nodeId],
    ))),
    meanChamberVolumeMl: chamberRecord((chamberId) => mean(samples.map(
      (sample) => sample.nodeVolumeMl[chamberId],
    ))),
    chamberVolumeRangeMl: chamberRecord((chamberId) => range(samples.map(
      (sample) => sample.nodeVolumeMl[chamberId],
    ))),
    commonPericardialExcessPressureRangeMmHg: range(samples.map(
      (sample) => sample.commonPericardium.excessPressureMmHg,
    )),
  });
}

function contrastMetrics(
  arm: MainWireAorticOutflowCandidateCirculatoryRecalibrationArmV1,
): ContrastMetrics {
  const cycle = arm.readback.cycle;
  const filling = arm.readback.fillingAndPressureReadback;
  const diastolic = arm.diastolicFlow.value;
  return Object.freeze({
    ejectionTimeMs: cycle.aorticEjectionTimeProxySec * 1000,
    isovolumicContractionTimeMs:
      cycle.leftVentricularIsovolumicContractionTimeSec === null
        ? null
        : cycle.leftVentricularIsovolumicContractionTimeSec * 1000,
    leftVentricularTeiIndex: cycle.leftVentricularTeiIndex,
    maximumPositiveLeftVentricularPressureRiseRateMmHgPerSec:
      cycle.maximumPositiveLeftVentricularPressureRiseRateMmHgPerSec,
    maximumLeftVentricularPressureFallRateMagnitudeMmHgPerSec:
      cycle.maximumLeftVentricularPressureFallRateMagnitudeMmHgPerSec,
    aorticForwardVolumeMl: cycle.aorticForwardVolumeMl,
    peakVenaContractaVelocityMPerSec:
      cycle.peakVenaContractaVelocityMPerSec,
    meanDopplerGradientMmHg: cycle.meanDopplerGradientMmHg,
    peakDopplerGradientMmHg: cycle.peakDopplerGradientMmHg,
    meanAorticPressureMmHg: cycle.meanAorticAbsolutePressureMmHg,
    leftVentricularEjectionFraction01:
      cycle.leftVentricularEjectionFraction01,
    meanLeftAtrialPressureMmHg:
      filling.meanLeftAtrialAbsolutePressureMmHg,
    meanPulmonaryVeinPressureMmHg:
      filling.meanPulmonaryVeinAbsolutePressureMmHg,
    meanPulmonaryArteryPressureMmHg:
      filling.meanPulmonaryArteryAbsolutePressureMmHg,
    meanRightAtrialPressureMmHg: arm.system.meanAbsolutePressureMmHg.RA,
    meanCentralVenousPressureMmHg:
      filling.meanCentralVenousAbsolutePressureMmHg,
    leftVentricularEndDiastolicVolumeMl:
      filling.leftVentricularEndDiastolicVolumeMl,
    ivrtLikeMs: diastolic === null
      ? null
      : diastolic.relaxation.ivrtLikeSec * 1000,
    relaxationTauMs: diastolic?.relaxation.relaxationTauSec === null
      || diastolic === null
      ? null
      : diastolic.relaxation.relaxationTauSec * 1000,
    pulmonaryVenousAtrialReversalVolumeMl: diastolic === null
      ? null
      : diastolic.pulmonaryVenous.atrialReversalVolumeMl,
  });
}

function contrast(
  changedAxis: "pulmonary-resistance" | "stressed-venous-volume",
  heldLevel: MainWireAorticOutflowCandidateCirculatoryRecalibrationLevelV1,
  lowContextId:
    MainWireAorticOutflowCandidateCirculatoryRecalibrationContextIdV1,
  highContextId:
    MainWireAorticOutflowCandidateCirculatoryRecalibrationContextIdV1,
  metrics: ReadonlyMap<
    MainWireAorticOutflowCandidateCirculatoryRecalibrationContextIdV1,
    ContrastMetrics
  >,
): MainWireAorticOutflowCandidateCirculatoryRecalibrationContrastV1 {
  const low = metrics.get(lowContextId)!;
  const high = metrics.get(highContextId)!;
  return Object.freeze({
    changedAxis,
    heldLevel,
    lowContextId,
    highContextId,
    highMinusLow: mapMetrics(low, high, (lowValue, highValue) =>
      highValue - lowValue),
  });
}

function rangeRecord(
  values: readonly ContrastMetrics[],
): Readonly<Record<keyof ContrastMetrics, NumericRange | null>> {
  const keys = Object.keys(values[0]!) as (keyof ContrastMetrics)[];
  return Object.freeze(Object.fromEntries(keys.map((key) => {
    const finite = values.map((value) => value[key])
      .filter((value): value is number => value !== null);
    return [key, finite.length === 0 ? null : range(finite)];
  }))) as Readonly<Record<keyof ContrastMetrics, NumericRange | null>>;
}

function mapMetrics(
  low: ContrastMetrics,
  high: ContrastMetrics,
  map: (lowValue: number, highValue: number) => number,
): ContrastMetrics {
  const entries = (Object.keys(low) as (keyof ContrastMetrics)[]).map((key) => {
    const lowValue = low[key];
    const highValue = high[key];
    return [key, lowValue === null || highValue === null
      ? null
      : map(lowValue, highValue)] as const;
  });
  return Object.freeze(Object.fromEntries(entries)) as ContrastMetrics;
}

function contextId(
  pvrLevel: MainWireAorticOutflowCandidateCirculatoryRecalibrationLevelV1,
  tbvLevel: MainWireAorticOutflowCandidateCirculatoryRecalibrationLevelV1,
): MainWireAorticOutflowCandidateCirculatoryRecalibrationContextIdV1 {
  return `pvr-${pvrLevel}__tbv-${tbvLevel}` as
    MainWireAorticOutflowCandidateCirculatoryRecalibrationContextIdV1;
}

function assertRunMatchesContext(
  input: MainWireAorticOutflowCandidateCirculatoryRecalibrationInputV1,
): void {
  const context =
    resolveMainWireAorticOutflowCandidateCirculatoryRecalibrationContextV1(
      input.contextId,
    );
  const run = input.run;
  const candidate = MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V7;
  const actual = Object.freeze({
    kuwProfileId: run.kuwProfile.profileId,
    complianceProfileId: run.complianceProfile.profileId,
    characteristicResistancePlacementProfileId:
      run.placementProfile?.profileId ?? null,
    rootInertanceProfileId: run.rootInertanceProfile?.profileId ?? null,
    sarcomereReferenceProfileId: run.sarcomereReferenceProfile.profileId,
    calciumSensitivityLengthProfileId:
      run.calciumSensitivityLengthProfile.profileId,
    twitchRetentionCandidateId:
      run.sourceTwitchRetentionCandidate.candidateId,
    trefForceLoadProfileId: run.trefForceLoadProfile.profileId,
    sourceVelocityDistortionProfileId:
      run.sourceVelocityDistortionProfile.profileId,
    strongBridgeDeactivationExitProfileId:
      run.strongBridgeDeactivationExitProfile.profileId,
    atrioventricularDelayProfileId:
      run.atrioventricularDelayProfile.profileId,
    circulatoryLoadPointId: run.circulatoryLoadPoint.pointId,
    stressedVenousVolumePointId: run.stressedVenousVolumePoint.pointId,
  });
  const expected = Object.freeze({
    kuwProfileId: candidate.kuwProfileId,
    complianceProfileId: candidate.complianceProfileId,
    characteristicResistancePlacementProfileId:
      candidate.characteristicResistancePlacementProfileId,
    rootInertanceProfileId: candidate.rootInertanceProfileId,
    sarcomereReferenceProfileId: candidate.sarcomereReferenceProfileId,
    calciumSensitivityLengthProfileId:
      candidate.calciumSensitivityLengthProfileId,
    twitchRetentionCandidateId: candidate.twitchRetentionCandidateId,
    trefForceLoadProfileId: candidate.trefForceLoadProfileId,
    sourceVelocityDistortionProfileId:
      candidate.sourceVelocityDistortionProfileId,
    strongBridgeDeactivationExitProfileId:
      candidate.strongBridgeDeactivationExitProfileId,
    atrioventricularDelayProfileId:
      candidate.atrioventricularDelayProfileId,
    circulatoryLoadPointId: context.circulatoryLoadPointId,
    stressedVenousVolumePointId: context.stressedVenousVolumePointId,
  });
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${input.contextId} does not match the fixed candidate factorial`);
  }
}

function mean(values: readonly number[]): number {
  if (values.length === 0) throw new Error("mean requires values");
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function range(values: readonly number[]): NumericRange {
  if (values.length === 0) throw new Error("range requires values");
  return Object.freeze({ minimum: Math.min(...values), maximum: Math.max(...values) });
}
