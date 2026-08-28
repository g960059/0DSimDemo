import {
  MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_WAVEFORM_REFERENCE_CONTEXT_V1,
  measureMainWireAorticOutflowCalciumWaveformCycleV1,
  screenMainWireAorticOutflowCalciumCandidateV1,
  type MainWireAorticOutflowCalciumCandidateScreenResultV1,
  type MainWireAorticOutflowCalciumWaveformCycleMetricsV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowCalciumWaveformComparisonV1";
import {
  countMainWireStrictLocalMaximaV1,
} from "@/analysis/methods/mainWire/MainWireAorticValveAblationComparisonV1";
import {
  measureMainWireVentricularLandIsometricTwitchAuditV1,
  type MainWireVentricularLandIsometricTwitchAuditV1,
} from "@/analysis/methods/mainWire/MainWireVentricularLandIsometricTwitchAuditV1";
import {
  FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import {
  measureMainWireValveDiseaseCycleMetricsV1,
} from "@/engine/myocardium/diagnostics/MainWireValveDiseaseCycleMetricsV1";
import type {
  MainWireNormalAdultFiveWallPeriodicResultV1,
  MainWireNormalAdultVentricularLengthDependenceResearchPointIdV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";
import {
  resolveMainWireNormalAdultVentricularMaterialResearchPointV1,
  resolveMainWireNormalAdultVentricularWallMaterialResearchV1,
  type MainWireNormalAdultVentricularMaterialResearchPointV1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";

export const MAIN_WIRE_AORTIC_OUTFLOW_LENGTH_DEPENDENCE_ENVELOPE_V1_ID =
  "main-wire-aortic-outflow-length-dependence-envelope-v1" as const;

export const MAIN_WIRE_AORTIC_OUTFLOW_LENGTH_DEPENDENCE_POINT_IDS_V1 =
  Object.freeze([
    "baseline",
    "ventricular-length-dependence-low",
    "ventricular-length-dependence-half",
    "ventricular-length-dependence-quarter",
    "ventricular-length-dependence-exact-off",
  ] as const satisfies readonly MainWireNormalAdultVentricularLengthDependenceResearchPointIdV1[]);

export const MAIN_WIRE_AORTIC_OUTFLOW_LENGTH_DEPENDENCE_ENVELOPE_CLAIM_V1 =
  Object.freeze({
    source: "last-retained-complete-beat-per-independent-cold-run" as const,
    design:
      "fixed-baseline-three-quarter-half-quarter-and-exact-off-diagnostic-envelope" as const,
    scaledParameters: "Land-beta0-and-beta1-together" as const,
    referenceLengthInvariant:
      "Land-active-values-at-lambda-one-not-algorithmic-length-tangent" as const,
    exactOffRole:
      "mechanism-removal-boundary-not-physiological-candidate" as const,
    calciumDriveChanged: false as const,
    ventricularTrefChanged: false as const,
    passiveOrSlsChanged: false as const,
    circulationRuntimeChanged: false as const,
    aorticValveConstitutiveLawChanged: false as const,
    acceptedStateOrCheckpointTopologyChanged: false as const,
    outcomeInformedPointSelection: false as const,
    parameterSearchOrFitting: false as const,
    clinicalValidationClaimed: false as const,
    canonicalAdoptionEstablished: false as const,
  });

export type MainWireAorticOutflowLengthDependenceInputV1 = Readonly<{
  pointId: MainWireNormalAdultVentricularLengthDependenceResearchPointIdV1;
  periodicResult: MainWireNormalAdultFiveWallPeriodicResultV1;
}>;

export type MainWireAorticOutflowLengthDependenceLoadedReadbackV1 = Readonly<{
  landStretchAtAorticFlowOnset: number;
  landStretchAtAorticFlowPeak: number;
  landStretchAtAorticFlowEnd: number;
  activeStressAtAorticFlowOnsetPa: number;
  activeStressAtAorticFlowPeakPa: number;
  activeStressAtAorticFlowEndPa: number;
  peakActiveStressPa: number;
  activeStressAtFlowEndToPeakRatio: number;
  totalLvfwStressAtAorticFlowOnsetPa: number;
  totalLvfwStressAtAorticFlowPeakPa: number;
  totalLvfwStressAtAorticFlowEndPa: number;
  leftVentricularVolumeAtAorticFlowOnsetMl: number;
  leftVentricularVolumeAtAorticFlowPeakMl: number;
  leftVentricularVolumeAtAorticFlowEndMl: number;
  leftVentricularPressureAtAorticFlowOnsetMmHg: number;
  leftVentricularPressureAtAorticFlowPeakMmHg: number;
  leftVentricularPressureAtAorticFlowEndMmHg: number;
  aorticPressureAtAorticFlowOnsetMmHg: number;
  aorticPressureAtAorticFlowPeakMmHg: number;
  aorticPressureAtAorticFlowEndMmHg: number;
  lvMinusAorticPressureAtAorticFlowOnsetMmHg: number;
  lvMinusAorticPressureAtAorticFlowPeakMmHg: number;
  lvMinusAorticPressureAtAorticFlowEndMmHg: number;
  positiveActiveStressCycleIntegralPaSec: number;
  activeStressPeakCountAboveFivePercent: number;
}>;

export type MainWireAorticOutflowLengthDependenceArmV1 = Readonly<{
  pointId: MainWireNormalAdultVentricularLengthDependenceResearchPointIdV1;
  materialPoint: MainWireNormalAdultVentricularMaterialResearchPointV1;
  protocolIdentityHash: string;
  cycle: MainWireAorticOutflowCalciumWaveformCycleMetricsV1;
  referenceLengthIsometric: MainWireVentricularLandIsometricTwitchAuditV1;
  loadedLvfw: MainWireAorticOutflowLengthDependenceLoadedReadbackV1;
  aorticPulsePressureMmHg: number;
  ejectionTimeGapToHealthyLower95PiSec: number;
  singlePeakMorphologyPreserved: boolean;
  candidateScreen: MainWireAorticOutflowCalciumCandidateScreenResultV1 | null;
}>;

export type MainWireAorticOutflowLengthDependenceEnvelopeV1 = Readonly<{
  methodId: typeof MAIN_WIRE_AORTIC_OUTFLOW_LENGTH_DEPENDENCE_ENVELOPE_V1_ID;
  arms: readonly MainWireAorticOutflowLengthDependenceArmV1[];
  referenceLengthIsometricInvariance: Readonly<{
    maximumAbsoluteActiveTwitchMetricDifference: number;
    exactAtFloatingPointAcrossEnvelope: boolean;
  }>;
  sampledDirectionality: Readonly<{
    aorticMaximumFlowStrictlyDecreasesAsLengthDependenceIsRemoved: boolean;
    peakDopplerGradientStrictlyDecreasesAsLengthDependenceIsRemoved: boolean;
    aorticEjectionTimeStrictlyIncreasesAsLengthDependenceIsRemoved: boolean;
  }>;
  stableNonzeroBranchDirectionality: Readonly<{
    aorticMaximumFlowStrictlyDecreasesAsLengthDependenceIsRemoved: boolean;
    peakDopplerGradientStrictlyDecreasesAsLengthDependenceIsRemoved: boolean;
    aorticEjectionTimeStrictlyIncreasesAsLengthDependenceIsRemoved: boolean;
  }>;
  exactOffBoundary: Readonly<{
    ejectionTimeWithinHealthyReferenceContext: boolean;
    ejectionTimeGapToHealthyLower95PiSec: number;
    directionalCandidateRetained: boolean;
    referenceNormalizedCandidate: boolean;
  }>;
  allRunsPeriod1AndIntegrated: boolean;
  morphologyPreservedAcrossEnvelope: boolean;
  claim: typeof MAIN_WIRE_AORTIC_OUTFLOW_LENGTH_DEPENDENCE_ENVELOPE_CLAIM_V1;
}>;

export function compareMainWireAorticOutflowLengthDependenceEnvelopeV1(
  inputs: readonly MainWireAorticOutflowLengthDependenceInputV1[],
): MainWireAorticOutflowLengthDependenceEnvelopeV1 {
  const byId = new Map<
    MainWireNormalAdultVentricularLengthDependenceResearchPointIdV1,
    MainWireNormalAdultFiveWallPeriodicResultV1
  >();
  for (const input of inputs) {
    if (byId.has(input.pointId)) {
      throw new Error(`duplicate length-dependence point: ${input.pointId}`);
    }
    byId.set(input.pointId, input.periodicResult);
  }
  for (const pointId of MAIN_WIRE_AORTIC_OUTFLOW_LENGTH_DEPENDENCE_POINT_IDS_V1) {
    if (!byId.has(pointId)) {
      throw new Error(`missing length-dependence point: ${pointId}`);
    }
  }
  if (byId.size !== MAIN_WIRE_AORTIC_OUTFLOW_LENGTH_DEPENDENCE_POINT_IDS_V1.length) {
    throw new Error("length-dependence envelope accepts exactly three points");
  }
  assertProtocolAxes(byId);
  const canonicalCycle = measureMainWireAorticOutflowCalciumWaveformCycleV1(
    byId.get("baseline")!,
    FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
    "baseline length-dependence point",
  );
  const arms = Object.freeze(
    MAIN_WIRE_AORTIC_OUTFLOW_LENGTH_DEPENDENCE_POINT_IDS_V1.map((pointId) =>
      measureArm(pointId, byId.get(pointId)!, canonicalCycle)),
  );
  const reference = activeTwitchVector(arms[0]!.referenceLengthIsometric);
  const maximumAbsoluteActiveTwitchMetricDifference = maximum(
    arms.flatMap((arm) => {
      const values = activeTwitchVector(arm.referenceLengthIsometric);
      return values.map((value, index) => Math.abs(value - reference[index]!));
    }),
  );
  const exactOff = arms.at(-1)!;
  const stableNonzeroBranch = arms.slice(0, -1);
  return Object.freeze({
    methodId: MAIN_WIRE_AORTIC_OUTFLOW_LENGTH_DEPENDENCE_ENVELOPE_V1_ID,
    arms,
    referenceLengthIsometricInvariance: Object.freeze({
      maximumAbsoluteActiveTwitchMetricDifference,
      exactAtFloatingPointAcrossEnvelope:
        maximumAbsoluteActiveTwitchMetricDifference === 0,
    }),
    sampledDirectionality: Object.freeze({
      aorticMaximumFlowStrictlyDecreasesAsLengthDependenceIsRemoved:
        strictlyDecreases(arms.map((arm) =>
          arm.cycle.aorticMaximumFlowMlPerSec)),
      peakDopplerGradientStrictlyDecreasesAsLengthDependenceIsRemoved:
        strictlyDecreases(arms.map((arm) =>
          arm.cycle.peakDopplerGradientMmHg)),
      aorticEjectionTimeStrictlyIncreasesAsLengthDependenceIsRemoved:
        strictlyIncreases(arms.map((arm) =>
          arm.cycle.aorticEjectionTimeProxySec)),
    }),
    stableNonzeroBranchDirectionality: Object.freeze({
      aorticMaximumFlowStrictlyDecreasesAsLengthDependenceIsRemoved:
        strictlyDecreases(stableNonzeroBranch.map((arm) =>
          arm.cycle.aorticMaximumFlowMlPerSec)),
      peakDopplerGradientStrictlyDecreasesAsLengthDependenceIsRemoved:
        strictlyDecreases(stableNonzeroBranch.map((arm) =>
          arm.cycle.peakDopplerGradientMmHg)),
      aorticEjectionTimeStrictlyIncreasesAsLengthDependenceIsRemoved:
        strictlyIncreases(stableNonzeroBranch.map((arm) =>
          arm.cycle.aorticEjectionTimeProxySec)),
    }),
    exactOffBoundary: Object.freeze({
      ejectionTimeWithinHealthyReferenceContext:
        exactOff.candidateScreen!.ejectionTimeWithinReferenceContext,
      ejectionTimeGapToHealthyLower95PiSec:
        exactOff.ejectionTimeGapToHealthyLower95PiSec,
      directionalCandidateRetained:
        exactOff.candidateScreen!.retainedDirectionalCandidate,
      referenceNormalizedCandidate:
        exactOff.candidateScreen!.referenceNormalizedCandidate,
    }),
    allRunsPeriod1AndIntegrated: arms.every((arm) =>
      arm.cycle.periodicSteadyStateClaimed
      && arm.cycle.integrationCompletedWithoutFailure),
    morphologyPreservedAcrossEnvelope:
      arms.every((arm) => arm.singlePeakMorphologyPreserved),
    claim: MAIN_WIRE_AORTIC_OUTFLOW_LENGTH_DEPENDENCE_ENVELOPE_CLAIM_V1,
  });
}

function measureArm(
  pointId: MainWireNormalAdultVentricularLengthDependenceResearchPointIdV1,
  result: MainWireNormalAdultFiveWallPeriodicResultV1,
  canonicalCycle: MainWireAorticOutflowCalciumWaveformCycleMetricsV1,
): MainWireAorticOutflowLengthDependenceArmV1 {
  const materialPoint =
    resolveMainWireNormalAdultVentricularMaterialResearchPointV1(pointId);
  const wallMaterial =
    resolveMainWireNormalAdultVentricularWallMaterialResearchV1(pointId);
  if (wallMaterial.landSlackStretch !== 1) {
    throw new Error(`${pointId} requires unit ventricular Land slack stretch`);
  }
  const cycle = pointId === "baseline"
    ? canonicalCycle
    : measureMainWireAorticOutflowCalciumWaveformCycleV1(
      result,
      FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
      pointId,
    );
  const beat = result.retainedCompleteBeats.at(-1);
  if (beat === undefined || beat.samples.length === 0) {
    throw new Error(`${pointId} requires a retained complete beat`);
  }
  const valve = measureMainWireValveDiseaseCycleMetricsV1(result).valves.AoV;
  const flows = beat.samples.map((sample) =>
    Math.max(0, sample.circulationEdgeFlowMlPerSec.AoV));
  const active = flows.map((flow) => flow >= valve.episodeFlowThresholdMlPerSec);
  const onsetIndex = active.findIndex((isActive, index) =>
    isActive && !active[(index - 1 + active.length) % active.length]);
  const activeCount = active.filter(Boolean).length;
  if (onsetIndex < 0 || activeCount === 0 || valve.forwardEpisodeCount !== 1) {
    throw new Error(`${pointId} requires one thresholded aortic flow episode`);
  }
  const endIndex = (onsetIndex + activeCount - 1) % beat.samples.length;
  const peakFlowIndex = indexOfMaximum(flows);
  const stretches = beat.samples.map((sample) =>
    Math.exp(sample.wallFiberLogStrain.LVFW));
  const stresses = beat.samples.map((sample) =>
    Math.max(0, sample.wallStressPa.LVFW.active));
  const peakStress = maximum(stresses);
  const at = (index: number) => beat.samples[index]!;
  const lvMinusAorticPressure = (index: number) =>
    at(index).circulationNodeAbsolutePressureMmHg.LV
    - at(index).circulationNodeAbsolutePressureMmHg.Ao;
  const loadedLvfw = Object.freeze({
    landStretchAtAorticFlowOnset: stretches[onsetIndex]!,
    landStretchAtAorticFlowPeak: stretches[peakFlowIndex]!,
    landStretchAtAorticFlowEnd: stretches[endIndex]!,
    activeStressAtAorticFlowOnsetPa: stresses[onsetIndex]!,
    activeStressAtAorticFlowPeakPa: stresses[peakFlowIndex]!,
    activeStressAtAorticFlowEndPa: stresses[endIndex]!,
    peakActiveStressPa: peakStress,
    activeStressAtFlowEndToPeakRatio: stresses[endIndex]! / peakStress,
    totalLvfwStressAtAorticFlowOnsetPa:
      at(onsetIndex).wallStressPa.LVFW.total,
    totalLvfwStressAtAorticFlowPeakPa:
      at(peakFlowIndex).wallStressPa.LVFW.total,
    totalLvfwStressAtAorticFlowEndPa:
      at(endIndex).wallStressPa.LVFW.total,
    leftVentricularVolumeAtAorticFlowOnsetMl:
      at(onsetIndex).nodeVolumeMl.LV,
    leftVentricularVolumeAtAorticFlowPeakMl:
      at(peakFlowIndex).nodeVolumeMl.LV,
    leftVentricularVolumeAtAorticFlowEndMl:
      at(endIndex).nodeVolumeMl.LV,
    leftVentricularPressureAtAorticFlowOnsetMmHg:
      at(onsetIndex).circulationNodeAbsolutePressureMmHg.LV,
    leftVentricularPressureAtAorticFlowPeakMmHg:
      at(peakFlowIndex).circulationNodeAbsolutePressureMmHg.LV,
    leftVentricularPressureAtAorticFlowEndMmHg:
      at(endIndex).circulationNodeAbsolutePressureMmHg.LV,
    aorticPressureAtAorticFlowOnsetMmHg:
      at(onsetIndex).circulationNodeAbsolutePressureMmHg.Ao,
    aorticPressureAtAorticFlowPeakMmHg:
      at(peakFlowIndex).circulationNodeAbsolutePressureMmHg.Ao,
    aorticPressureAtAorticFlowEndMmHg:
      at(endIndex).circulationNodeAbsolutePressureMmHg.Ao,
    lvMinusAorticPressureAtAorticFlowOnsetMmHg:
      lvMinusAorticPressure(onsetIndex),
    lvMinusAorticPressureAtAorticFlowPeakMmHg:
      lvMinusAorticPressure(peakFlowIndex),
    lvMinusAorticPressureAtAorticFlowEndMmHg:
      lvMinusAorticPressure(endIndex),
    positiveActiveStressCycleIntegralPaSec:
      cycle.positiveActiveStressCycleIntegralPaSecByWall.LVFW,
    activeStressPeakCountAboveFivePercent:
      countMainWireStrictLocalMaximaV1(stresses, 0.05 * peakStress),
  });
  const aorticPressures = beat.samples.map((sample) =>
    sample.circulationNodeAbsolutePressureMmHg.Ao);
  const candidateScreen = pointId === "baseline"
    ? null
    : screenMainWireAorticOutflowCalciumCandidateV1(cycle, canonicalCycle);
  const healthyLower =
    MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_WAVEFORM_REFERENCE_CONTEXT_V1
      .leftVentricularEjectionTime.predictionInterval95Sec[0];
  return Object.freeze({
    pointId,
    materialPoint,
    protocolIdentityHash: result.protocolIdentityHash,
    cycle,
    referenceLengthIsometric:
      measureMainWireVentricularLandIsometricTwitchAuditV1(
        FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
        { dtSec: result.dtSec, fixedLandStretch: 1 },
        wallMaterial,
      ),
    loadedLvfw,
    aorticPulsePressureMmHg:
      maximum(aorticPressures) - minimum(aorticPressures),
    ejectionTimeGapToHealthyLower95PiSec:
      healthyLower - cycle.aorticEjectionTimeProxySec,
    singlePeakMorphologyPreserved:
      cycle.aorticFlowPeakCountAboveFivePercent === 1
      && loadedLvfw.activeStressPeakCountAboveFivePercent === 1,
    candidateScreen,
  });
}

function assertProtocolAxes(
  byId: ReadonlyMap<
    MainWireNormalAdultVentricularLengthDependenceResearchPointIdV1,
    MainWireNormalAdultFiveWallPeriodicResultV1
  >,
): void {
  const results = [...byId.values()];
  const runtimeHashes = new Set(results.map((result) =>
    result.protocolComponentHashes.circulationRuntimeStableHash));
  const calciumHashes = new Set(results.map((result) =>
    result.protocolComponentHashes.calciumDriveFixedParamsStableHash));
  const mechanicsHashes = new Set(results.map((result) =>
    result.protocolComponentHashes.mechanicsProviderMetadataStableHash));
  if (
    runtimeHashes.size !== 1
    || calciumHashes.size !== 1
    || mechanicsHashes.size
      !== MAIN_WIRE_AORTIC_OUTFLOW_LENGTH_DEPENDENCE_POINT_IDS_V1.length
  ) {
    throw new Error("length-dependence envelope protocol axes are not isolated");
  }
}

function activeTwitchVector(
  audit: MainWireVentricularLandIsometricTwitchAuditV1,
): readonly number[] {
  const twitch = audit.activeTwitch;
  return Object.freeze([
    twitch.minimum,
    twitch.maximum,
    twitch.amplitude,
    twitch.timeToPeakSec,
    required(twitch.relaxationTime50Sec, "isometric RT50"),
    required(twitch.relaxationTime90Sec, "isometric RT90"),
    required(twitch.relaxationTime95Sec, "isometric RT95"),
    required(twitch.durationAboveHalfMaximumSec, "isometric half duration"),
    twitch.minimumKPa,
    twitch.peakKPa,
    twitch.amplitudeKPa,
  ]);
}

function strictlyDecreases(values: readonly number[]): boolean {
  return values.every((value, index) =>
    index === 0 || value < values[index - 1]!);
}

function strictlyIncreases(values: readonly number[]): boolean {
  return values.every((value, index) =>
    index === 0 || value > values[index - 1]!);
}

function indexOfMaximum(values: readonly number[]): number {
  if (values.length === 0) throw new Error("maximum requires values");
  let index = 0;
  for (let candidate = 1; candidate < values.length; candidate += 1) {
    if (values[candidate]! > values[index]!) index = candidate;
  }
  return index;
}

function minimum(values: readonly number[]): number {
  if (values.length === 0) throw new Error("minimum requires values");
  return Math.min(...values);
}

function maximum(values: readonly number[]): number {
  if (values.length === 0) throw new Error("maximum requires values");
  return Math.max(...values);
}

function required(value: number | null, label: string): number {
  if (value === null) throw new Error(`${label} was not resolved`);
  return value;
}
