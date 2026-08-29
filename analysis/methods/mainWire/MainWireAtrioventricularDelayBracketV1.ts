import {
  measureMainWireAorticOutflowCalciumWaveformCycleV1,
  type MainWireAorticOutflowCalciumWaveformCycleMetricsV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowCalciumWaveformComparisonV1";
import {
  measureMainWireVentricularCalciumSourceTraceFitDiastolicFlowV1,
  type MainWireVentricularCalciumSourceTraceFitDiastolicFlowReadbackV1,
} from "@/analysis/methods/mainWire/MainWireVentricularCalciumSourceTraceFitShortlistLoadEnvelopeV1";
import type {
  FiveWallNormalCalciumDriveParamsV1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import {
  MAIN_WIRE_ATRIOVENTRICULAR_DELAY_PROFILE_IDS_V1,
  resolveMainWireAtrioventricularDelayProfileV1,
  type MainWireAtrioventricularDelayProfileIdV1,
  type MainWireAtrioventricularDelayProfileV1,
} from "@/engine/myocardium/calcium/MainWireAtrioventricularDelayBracketV1";
import type {
  MainWireNormalAdultFiveWallPeriodicResultV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";
import {
  summarizeMainWireNormalAdultFiveWallPeriodicSteadyV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSummaryV1";

export const MAIN_WIRE_ATRIOVENTRICULAR_DELAY_BRACKET_ANALYSIS_V1_ID =
  "main-wire-atrioventricular-delay-bracket-analysis-v1" as const;

export const MAIN_WIRE_ATRIOVENTRICULAR_DELAY_BRACKET_ANALYSIS_CLAIM_V1 =
  Object.freeze({
    source: "last-retained-complete-beat-per-independent-cold-run" as const,
    exactFrameMutation: false as const,
    exactModelFeedback: false as const,
    acceptedStepReadbackOnly: true as const,
    ventricularCalciumRiseEvent:
      "first-cyclic-upward-crossing-of-one-percent-configured-supradiastolic-amplitude" as const,
    valveEvents:
      "shared-one-percent-peak-forward-flow-threshold-event-analogue" as const,
    signedMitralClosureToCalciumRise:
      "positive-when-flow-defined-mitral-closure-precedes-ventricular-calcium-rise" as const,
    ictTeiAndPressureRateDefinitionsInheritedFromCycleDiagnostics:
      true as const,
    mitralAndPulmonaryVenousWindowsUseArmSpecificAtrialCalciumOnset:
      true as const,
    pressureRateSmoothingApplied: false as const,
    fixedDiscreteBracketNotContinuousOptimization: true as const,
    parameterFitApplied: false as const,
    clinicalTimingEquivalenceClaimed: false as const,
    clinicalValidationClaimed: false as const,
    canonicalAdoptionEstablished: false as const,
  });

export type MainWireAtrioventricularDelayBracketAnalysisInputV1 = Readonly<{
  profileId: MainWireAtrioventricularDelayProfileIdV1;
  calciumDriveParams: FiveWallNormalCalciumDriveParamsV1;
  periodicResult: MainWireNormalAdultFiveWallPeriodicResultV1;
}>;

type NumericRangeV1 = Readonly<{ minimum: number; maximum: number }>;

export type MainWireAtrioventricularDelayBracketArmV1 = Readonly<{
  profile: MainWireAtrioventricularDelayProfileV1;
  protocolIdentityHash: string;
  calciumDriveStableHash: string;
  periodicSteadyStateClaimed: boolean;
  integrationCompletedWithoutFailure: boolean;
  terminationReason:
    MainWireNormalAdultFiveWallPeriodicResultV1["terminationReason"];
  completedBeatCount: number;
  cycle: MainWireAorticOutflowCalciumWaveformCycleMetricsV1;
  diastolicFlow:
    MainWireVentricularCalciumSourceTraceFitDiastolicFlowReadbackV1;
  timing: Readonly<{
    atrialCalciumOnsetPhase01: number;
    ventricularCalciumOnePercentRisePhase01: number;
    mitralValveClosurePhase01: number;
    aorticValveOpeningPhase01: number;
    aorticValveClosurePhase01: number;
    mitralValveOpeningPhase01: number;
    atrialCalciumOnsetToMitralClosureSec: number;
    mitralClosureToVentricularCalciumOnePercentRiseSignedSec: number;
    ventricularCalciumOnePercentRiseToAorticOpeningSec: number;
  }>;
  meanAbsolutePressureMmHg: Readonly<{
    aorticRoot: number;
    pulmonaryArtery: number;
    pulmonaryVein: number;
    leftAtrium: number;
    rightAtrium: number;
    centralVein: number;
  }>;
  relativeToSource160ms: Readonly<{
    ejectionTime: number;
    isovolumicContractionTime: number | null;
    isovolumicRelaxationTime: number | null;
    teiIndex: number | null;
    maximumPositivePressureRate: number;
    maximumPressureFallRateMagnitude: number;
    strokeVolume: number;
    peakVelocity: number;
    meanGradient: number;
    peakGradient: number;
    meanAorticPressure: number;
  }>;
}>;

export type MainWireAtrioventricularDelayBracketAnalysisV1 = Readonly<{
  methodId: typeof MAIN_WIRE_ATRIOVENTRICULAR_DELAY_BRACKET_ANALYSIS_V1_ID;
  arms: readonly MainWireAtrioventricularDelayBracketArmV1[];
  ranges: Readonly<{
    ejectionTimeSec: NumericRangeV1;
    isovolumicContractionTimeSec: NumericRangeV1;
    isovolumicRelaxationTimeSec: NumericRangeV1;
    teiIndex: NumericRangeV1;
    maximumPositivePressureRateMmHgPerSec: NumericRangeV1;
    maximumPressureFallRateMagnitudeMmHgPerSec: NumericRangeV1;
    strokeVolumeMl: NumericRangeV1;
    peakVelocityMPerSec: NumericRangeV1;
    meanGradientMmHg: NumericRangeV1;
    peakGradientMmHg: NumericRangeV1;
    meanAorticPressureMmHg: NumericRangeV1;
    meanLeftAtrialPressureMmHg: NumericRangeV1;
    meanCentralVenousPressureMmHg: NumericRangeV1;
    mitralClosureToVentricularCalciumRiseSignedSec: NumericRangeV1;
    ventricularCalciumRiseToAorticOpeningSec: NumericRangeV1;
  }>;
  allRunsPeriod1AndIntegrated: boolean;
  allCyclePhysiologyReadbacksAvailable: boolean;
  allDiastolicFlowReadbacksAvailable: boolean;
  allProtocolIdentitiesDistinct: boolean;
  claim: typeof MAIN_WIRE_ATRIOVENTRICULAR_DELAY_BRACKET_ANALYSIS_CLAIM_V1;
}>;

type RawArmV1 = Omit<
  MainWireAtrioventricularDelayBracketArmV1,
  "relativeToSource160ms"
>;

export function measureMainWireAtrioventricularDelayBracketV1(
  inputs: readonly MainWireAtrioventricularDelayBracketAnalysisInputV1[],
): MainWireAtrioventricularDelayBracketAnalysisV1 {
  const byId = new Map<
    MainWireAtrioventricularDelayProfileIdV1,
    MainWireAtrioventricularDelayBracketAnalysisInputV1
  >();
  for (const input of inputs) {
    if (byId.has(input.profileId)) {
      throw new Error(`duplicate atrioventricular delay arm: ${input.profileId}`);
    }
    byId.set(input.profileId, input);
  }
  if (byId.size !== MAIN_WIRE_ATRIOVENTRICULAR_DELAY_PROFILE_IDS_V1.length) {
    throw new Error(
      `atrioventricular delay bracket requires ${MAIN_WIRE_ATRIOVENTRICULAR_DELAY_PROFILE_IDS_V1.length} arms`,
    );
  }
  const rawArms = MAIN_WIRE_ATRIOVENTRICULAR_DELAY_PROFILE_IDS_V1.map(
    (profileId) => {
      const input = byId.get(profileId);
      if (input === undefined) {
        throw new Error(`missing atrioventricular delay arm: ${profileId}`);
      }
      return measureArm(input);
    },
  );
  const source = rawArms.find((arm) =>
    arm.profile.sourceAtrioventricularDelayRetained);
  if (source === undefined) {
    throw new Error("atrioventricular delay bracket lacks source 160ms arm");
  }
  const arms = Object.freeze(rawArms.map((arm) => Object.freeze({
    ...arm,
    relativeToSource160ms: Object.freeze({
      ejectionTime: relative(
        arm.cycle.aorticEjectionTimeProxySec,
        source.cycle.aorticEjectionTimeProxySec,
      ),
      isovolumicContractionTime: nullableRelative(
        arm.cycle.leftVentricularIsovolumicContractionTimeSec,
        source.cycle.leftVentricularIsovolumicContractionTimeSec,
      ),
      isovolumicRelaxationTime: nullableRelative(
        arm.cycle.leftVentricularIsovolumicRelaxationTimeSec,
        source.cycle.leftVentricularIsovolumicRelaxationTimeSec,
      ),
      teiIndex: nullableRelative(
        arm.cycle.leftVentricularTeiIndex,
        source.cycle.leftVentricularTeiIndex,
      ),
      maximumPositivePressureRate: relative(
        arm.cycle.maximumPositiveLeftVentricularPressureRiseRateMmHgPerSec,
        source.cycle.maximumPositiveLeftVentricularPressureRiseRateMmHgPerSec,
      ),
      maximumPressureFallRateMagnitude: relative(
        arm.cycle.maximumLeftVentricularPressureFallRateMagnitudeMmHgPerSec,
        source.cycle.maximumLeftVentricularPressureFallRateMagnitudeMmHgPerSec,
      ),
      strokeVolume: relative(
        arm.cycle.aorticForwardVolumeMl,
        source.cycle.aorticForwardVolumeMl,
      ),
      peakVelocity: relative(
        arm.cycle.peakVenaContractaVelocityMPerSec,
        source.cycle.peakVenaContractaVelocityMPerSec,
      ),
      meanGradient: relative(
        arm.cycle.meanDopplerGradientMmHg,
        source.cycle.meanDopplerGradientMmHg,
      ),
      peakGradient: relative(
        arm.cycle.peakDopplerGradientMmHg,
        source.cycle.peakDopplerGradientMmHg,
      ),
      meanAorticPressure: relative(
        arm.cycle.meanAorticAbsolutePressureMmHg,
        source.cycle.meanAorticAbsolutePressureMmHg,
      ),
    }),
  })));
  return Object.freeze({
    methodId: MAIN_WIRE_ATRIOVENTRICULAR_DELAY_BRACKET_ANALYSIS_V1_ID,
    arms,
    ranges: Object.freeze({
      ejectionTimeSec: range(arms.map((arm) =>
        arm.cycle.aorticEjectionTimeProxySec)),
      isovolumicContractionTimeSec: range(arms.map((arm) =>
        required(
          arm.cycle.leftVentricularIsovolumicContractionTimeSec,
          `${arm.profile.profileId} ICT`,
        ))),
      isovolumicRelaxationTimeSec: range(arms.map((arm) =>
        required(
          arm.cycle.leftVentricularIsovolumicRelaxationTimeSec,
          `${arm.profile.profileId} IVRT`,
        ))),
      teiIndex: range(arms.map((arm) => required(
        arm.cycle.leftVentricularTeiIndex,
        `${arm.profile.profileId} Tei index`,
      ))),
      maximumPositivePressureRateMmHgPerSec: range(arms.map((arm) =>
        arm.cycle.maximumPositiveLeftVentricularPressureRiseRateMmHgPerSec)),
      maximumPressureFallRateMagnitudeMmHgPerSec: range(arms.map((arm) =>
        arm.cycle.maximumLeftVentricularPressureFallRateMagnitudeMmHgPerSec)),
      strokeVolumeMl: range(arms.map((arm) =>
        arm.cycle.aorticForwardVolumeMl)),
      peakVelocityMPerSec: range(arms.map((arm) =>
        arm.cycle.peakVenaContractaVelocityMPerSec)),
      meanGradientMmHg: range(arms.map((arm) =>
        arm.cycle.meanDopplerGradientMmHg)),
      peakGradientMmHg: range(arms.map((arm) =>
        arm.cycle.peakDopplerGradientMmHg)),
      meanAorticPressureMmHg: range(arms.map((arm) =>
        arm.cycle.meanAorticAbsolutePressureMmHg)),
      meanLeftAtrialPressureMmHg: range(arms.map((arm) =>
        arm.meanAbsolutePressureMmHg.leftAtrium)),
      meanCentralVenousPressureMmHg: range(arms.map((arm) =>
        arm.meanAbsolutePressureMmHg.centralVein)),
      mitralClosureToVentricularCalciumRiseSignedSec: range(arms.map((arm) =>
        arm.timing.mitralClosureToVentricularCalciumOnePercentRiseSignedSec)),
      ventricularCalciumRiseToAorticOpeningSec: range(arms.map((arm) =>
        arm.timing.ventricularCalciumOnePercentRiseToAorticOpeningSec)),
    }),
    allRunsPeriod1AndIntegrated: arms.every((arm) =>
      arm.periodicSteadyStateClaimed
      && arm.integrationCompletedWithoutFailure),
    allCyclePhysiologyReadbacksAvailable: arms.every((arm) =>
      arm.cycle.leftVentricularIsovolumicContractionTimeSec !== null
      && arm.cycle.leftVentricularIsovolumicRelaxationTimeSec !== null
      && arm.cycle.leftVentricularTeiIndex !== null),
    allDiastolicFlowReadbacksAvailable: arms.every((arm) =>
      arm.diastolicFlow.value !== null),
    allProtocolIdentitiesDistinct:
      new Set(arms.map((arm) => arm.protocolIdentityHash)).size === arms.length,
    claim: MAIN_WIRE_ATRIOVENTRICULAR_DELAY_BRACKET_ANALYSIS_CLAIM_V1,
  });
}

function measureArm(
  input: MainWireAtrioventricularDelayBracketAnalysisInputV1,
): RawArmV1 {
  const { periodicResult: result, calciumDriveParams } = input;
  const profile = resolveMainWireAtrioventricularDelayProfileV1(
    input.profileId,
  );
  if (
    calciumDriveParams.atrioventricularDelaySec
      !== profile.atrioventricularDelaySec
  ) throw new Error(`${input.profileId} delay parameter mismatch`);
  if (
    result.protocolIdentity.calciumDrive.parameterSetId
      !== calciumDriveParams.parameterSetId
  ) throw new Error(`${input.profileId} calcium protocol identity mismatch`);
  const beat = result.retainedCompleteBeats.at(-1);
  if (beat === undefined || beat.samples.length === 0) {
    throw new Error(`${input.profileId} requires a retained complete beat`);
  }
  const cycle = measureMainWireAorticOutflowCalciumWaveformCycleV1(
    result,
    calciumDriveParams,
    input.profileId,
  );
  const summary = summarizeMainWireNormalAdultFiveWallPeriodicSteadyV1(
    result,
    calciumDriveParams,
  );
  const physiology = summary.cyclePhysiology;
  if (physiology === null) {
    throw new Error(`${input.profileId} cycle physiology is unavailable`);
  }
  const samples = beat.samples;
  const riseThreshold = calciumDriveParams.ventricular.diastolicCalciumUM
    + 0.01 * calciumDriveParams.ventricular.peakAmplitudeUM;
  const calciumRiseIndex = cyclicUpwardCrossingIndex(
    samples.map((sample) => sample.freeCalciumUM.LVFW),
    riseThreshold,
  );
  const events = physiology.events;
  const n = samples.length;
  const timing = Object.freeze({
    atrialCalciumOnsetPhase01: events.atrialCalciumOnset.phase01,
    ventricularCalciumOnePercentRisePhase01:
      samples[calciumRiseIndex]!.cyclePhase01,
    mitralValveClosurePhase01: events.mitralValveClosure.phase01,
    aorticValveOpeningPhase01: events.aorticValveOpening.phase01,
    aorticValveClosurePhase01: events.aorticValveClosure.phase01,
    mitralValveOpeningPhase01: events.mitralValveOpening.phase01,
    atrialCalciumOnsetToMitralClosureSec: cyclicForwardSampleDelta(
      events.atrialCalciumOnset.sampleIndex,
      events.mitralValveClosure.sampleIndex,
      n,
    ) * result.dtSec,
    mitralClosureToVentricularCalciumOnePercentRiseSignedSec:
      signedCyclicSampleDelta(
        events.mitralValveClosure.sampleIndex,
        calciumRiseIndex,
        n,
      ) * result.dtSec,
    ventricularCalciumOnePercentRiseToAorticOpeningSec:
      cyclicForwardSampleDelta(
        calciumRiseIndex,
        events.aorticValveOpening.sampleIndex,
        n,
      ) * result.dtSec,
  });
  return Object.freeze({
    profile,
    protocolIdentityHash: result.protocolIdentityHash,
    calciumDriveStableHash:
      result.protocolComponentHashes.calciumDriveFixedParamsStableHash,
    periodicSteadyStateClaimed: result.periodicSteadyStateClaimed,
    integrationCompletedWithoutFailure: result.integrationCompletedWithoutFailure,
    terminationReason: result.terminationReason,
    completedBeatCount: result.completedBeatCount,
    cycle,
    diastolicFlow:
      measureMainWireVentricularCalciumSourceTraceFitDiastolicFlowV1(
        result,
        calciumDriveParams,
      ),
    timing,
    meanAbsolutePressureMmHg: Object.freeze({
      aorticRoot: mean(samples.map((sample) =>
        sample.circulationNodeAbsolutePressureMmHg.Ao)),
      pulmonaryArtery: mean(samples.map((sample) =>
        sample.circulationNodeAbsolutePressureMmHg.PA)),
      pulmonaryVein: mean(samples.map((sample) =>
        sample.circulationNodeAbsolutePressureMmHg.PVein)),
      leftAtrium: mean(samples.map((sample) =>
        sample.circulationNodeAbsolutePressureMmHg.LA)),
      rightAtrium: mean(samples.map((sample) =>
        sample.circulationNodeAbsolutePressureMmHg.RA)),
      centralVein: mean(samples.map((sample) =>
        sample.circulationNodeAbsolutePressureMmHg.VC)),
    }),
  });
}

function cyclicUpwardCrossingIndex(
  values: readonly number[],
  threshold: number,
): number {
  for (let index = 0; index < values.length; index += 1) {
    const previous = values[(index - 1 + values.length) % values.length]!;
    if (previous < threshold && values[index]! >= threshold) return index;
  }
  throw new Error("ventricular calcium one-percent rise was not observed");
}

function cyclicForwardSampleDelta(
  fromIndex: number,
  toIndex: number,
  sampleCount: number,
): number {
  return (toIndex - fromIndex + sampleCount) % sampleCount;
}

function signedCyclicSampleDelta(
  fromIndex: number,
  toIndex: number,
  sampleCount: number,
): number {
  const forward = cyclicForwardSampleDelta(fromIndex, toIndex, sampleCount);
  return forward <= sampleCount / 2 ? forward : forward - sampleCount;
}

function nullableRelative(
  value: number | null,
  reference: number | null,
): number | null {
  return value === null || reference === null
    ? null
    : relative(value, reference);
}

function relative(value: number, reference: number): number {
  if (!(Number.isFinite(reference) && reference !== 0)) {
    throw new Error("relative comparison requires finite nonzero reference");
  }
  return value / reference - 1;
}

function required(value: number | null, label: string): number {
  if (value === null) throw new Error(`${label} is unavailable`);
  return value;
}

function range(values: readonly number[]): NumericRangeV1 {
  if (values.length === 0 || values.some((value) => !Number.isFinite(value))) {
    throw new Error("numeric range requires finite values");
  }
  return Object.freeze({
    minimum: Math.min(...values),
    maximum: Math.max(...values),
  });
}

function mean(values: readonly number[]): number {
  if (values.length === 0 || values.some((value) => !Number.isFinite(value))) {
    throw new Error("mean requires finite values");
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}
