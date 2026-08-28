import {
  measureMainWireAorticOutflowKinematicFloorV1,
  type MainWireAorticOutflowKinematicFloorV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowKinematicFloorV1";
import {
  measureMainWireValveDiseaseCycleMetricsV1,
} from "@/engine/myocardium/diagnostics/MainWireValveDiseaseCycleMetricsV1";
import type {
  MainWireNormalAdultFiveWallPeriodicResultV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";
import {
  MAIN_WIRE_AORTIC_VALVE_AREA_CONTROL_POINT_IDS_V1,
  resolveMainWireAorticValveAreaControlPointV1,
  type MainWireAorticValveAreaControlPointIdV1,
} from "@/engine/valves/MainWireAorticValveAreaControlV1";

export const MAIN_WIRE_AORTIC_VALVE_AREA_CONTROL_COMPARISON_V1_ID =
  "main-wire-aortic-valve-area-control-comparison-v1" as const;

export const MAIN_WIRE_AORTIC_VALVE_AREA_CONTROL_COMPARISON_CLAIM_V1 =
  Object.freeze({
    source: "last-retained-complete-beat-per-independent-cold-run" as const,
    design: "fixed-three-point-AoV-maximum-forward-EOA-control" as const,
    onlyAorticMaximumForwardEoaChangedAcrossPoints: true as const,
    exactModelStateOrCheckpointChanged: false as const,
    aorticValveConstitutiveLawChanged: false as const,
    gradientStation:
      "EOA-derived-vena-contracta-simplified-Doppler" as const,
    kinematicDecomposition:
      "duration-floor-times-flow-nonuniformity-times-opening-penalty" as const,
    smoothingApplied: false as const,
    interpolationApplied: false as const,
    parameterSearchOrFitting: false as const,
    clinicalThresholdOrValidationClaimed: false as const,
    canonicalAdoptionEstablished: false as const,
  });

export type MainWireAorticValveAreaControlArmInputV1 = Readonly<{
  pointId: MainWireAorticValveAreaControlPointIdV1;
  periodicResult: MainWireNormalAdultFiveWallPeriodicResultV1;
}>;

export type MainWireAorticValveAreaControlArmV1 = Readonly<{
  pointId: MainWireAorticValveAreaControlPointIdV1;
  maximumForwardEoaCm2: number;
  protocolIdentityHash: string;
  periodicSteadyStateClaimed: boolean;
  integrationCompletedWithoutFailure: boolean;
  completedBeatCount: number;
  aorticForwardVolumeMl: number;
  aorticMaximumFlowMlPerSec: number;
  aorticForwardFlowTimeSec: number;
  meanActiveEoaDuringForwardFlowCm2: number;
  maximumActiveEoaCm2: number;
  meanDopplerGradientMmHg: number;
  peakDopplerGradientMmHg: number;
  meanNodeGradientMmHg: number;
  peakNodeGradientMmHg: number;
  kinematicFloor: MainWireAorticOutflowKinematicFloorV1["currentDuration"];
}>;

export type MainWireAorticValveAreaControlContrastV1 = Readonly<{
  pointId: Exclude<
    MainWireAorticValveAreaControlPointIdV1,
    "canonical-aortic-eoa-3p5cm2"
  >;
  areaRatioToCanonical: number;
  relativeAorticForwardVolumeChange: number;
  relativeAorticMaximumFlowChange: number;
  relativeAorticForwardFlowTimeChange: number;
  relativeMeanDopplerGradientChange: number;
  relativePeakDopplerGradientChange: number;
  relativeKinematicFloorChange: number;
  relativeFlowNonuniformityFactorChange: number;
  relativeOpeningPenaltyFactorChange: number;
}>;

export type MainWireAorticValveAreaControlComparisonV1 = Readonly<{
  methodId: typeof MAIN_WIRE_AORTIC_VALVE_AREA_CONTROL_COMPARISON_V1_ID;
  arms: readonly MainWireAorticValveAreaControlArmV1[];
  contrastsToCanonical: readonly MainWireAorticValveAreaControlContrastV1[];
  allArmsPeriod1AndIntegrated: boolean;
  allProtocolIdentitiesDistinct: boolean;
  claim: typeof MAIN_WIRE_AORTIC_VALVE_AREA_CONTROL_COMPARISON_CLAIM_V1;
}>;

export function compareMainWireAorticValveAreaControlV1(
  inputs: readonly MainWireAorticValveAreaControlArmInputV1[],
): MainWireAorticValveAreaControlComparisonV1 {
  const byId = new Map<
    MainWireAorticValveAreaControlPointIdV1,
    MainWireNormalAdultFiveWallPeriodicResultV1
  >();
  for (const input of inputs) {
    if (byId.has(input.pointId)) {
      throw new Error(`duplicate AoV area control point: ${input.pointId}`);
    }
    byId.set(input.pointId, input.periodicResult);
  }
  for (const pointId of MAIN_WIRE_AORTIC_VALVE_AREA_CONTROL_POINT_IDS_V1) {
    if (!byId.has(pointId)) {
      throw new Error(`missing AoV area control point: ${pointId}`);
    }
  }
  if (byId.size !== MAIN_WIRE_AORTIC_VALVE_AREA_CONTROL_POINT_IDS_V1.length) {
    throw new Error("AoV area control accepts exactly three fixed points");
  }
  const arms = Object.freeze(
    MAIN_WIRE_AORTIC_VALVE_AREA_CONTROL_POINT_IDS_V1.map((pointId) =>
      measureArm(pointId, byId.get(pointId)!)),
  );
  const canonical = arms.find((arm) =>
    arm.pointId === "canonical-aortic-eoa-3p5cm2")!;
  const contrasts = Object.freeze(([
    "aortic-eoa-3p0cm2",
    "aortic-eoa-4p0cm2",
  ] as const).map((pointId) => contrast(
    arms.find((arm) => arm.pointId === pointId)!,
    canonical,
  )));
  return Object.freeze({
    methodId: MAIN_WIRE_AORTIC_VALVE_AREA_CONTROL_COMPARISON_V1_ID,
    arms,
    contrastsToCanonical: contrasts,
    allArmsPeriod1AndIntegrated: arms.every((arm) =>
      arm.periodicSteadyStateClaimed
      && arm.integrationCompletedWithoutFailure),
    allProtocolIdentitiesDistinct:
      new Set(arms.map((arm) => arm.protocolIdentityHash)).size
      === arms.length,
    claim: MAIN_WIRE_AORTIC_VALVE_AREA_CONTROL_COMPARISON_CLAIM_V1,
  });
}

function measureArm(
  pointId: MainWireAorticValveAreaControlPointIdV1,
  result: MainWireNormalAdultFiveWallPeriodicResultV1,
): MainWireAorticValveAreaControlArmV1 {
  const point = resolveMainWireAorticValveAreaControlPointV1(pointId);
  const beat = result.retainedCompleteBeats.at(-1);
  if (beat === undefined || beat.samples.length === 0) {
    throw new Error(`${pointId} requires a retained complete beat`);
  }
  const aortic = measureMainWireValveDiseaseCycleMetricsV1(result).valves.AoV;
  if (aortic.configuredMaximumForwardEoaCm2 !== point.maximumForwardEoaCm2) {
    throw new Error(`${pointId} area readback mismatch`);
  }
  const forwardSamples = beat.samples.filter((sample) =>
    sample.valveHydraulics.AoV.flowMlPerSec > 0);
  if (forwardSamples.length === 0) {
    throw new Error(`${pointId} requires positive aortic flow`);
  }
  const kinematicFloor = measureMainWireAorticOutflowKinematicFloorV1(result);
  return Object.freeze({
    pointId,
    maximumForwardEoaCm2: point.maximumForwardEoaCm2,
    protocolIdentityHash: result.protocolIdentityHash,
    periodicSteadyStateClaimed: result.periodicSteadyStateClaimed,
    integrationCompletedWithoutFailure:
      result.integrationCompletedWithoutFailure,
    completedBeatCount: result.completedBeatCount,
    aorticForwardVolumeMl: aortic.forwardVolumeMl,
    aorticMaximumFlowMlPerSec: maximum(forwardSamples.map((sample) =>
      sample.valveHydraulics.AoV.flowMlPerSec)),
    aorticForwardFlowTimeSec: aortic.forwardFlowTimeSec,
    meanActiveEoaDuringForwardFlowCm2: mean(forwardSamples.map((sample) =>
      sample.valveHydraulics.AoV.activeEoaCm2)),
    maximumActiveEoaCm2: maximum(forwardSamples.map((sample) =>
      sample.valveHydraulics.AoV.activeEoaCm2)),
    meanDopplerGradientMmHg:
      aortic.forwardFlowTimeMeanSimplifiedDopplerGradientMmHg,
    peakDopplerGradientMmHg: aortic.peakSimplifiedDopplerGradientMmHg,
    meanNodeGradientMmHg: aortic.forwardFlowTimeMeanGradientMmHg,
    peakNodeGradientMmHg: aortic.peakForwardGradientMmHg,
    kinematicFloor: kinematicFloor.currentDuration,
  });
}

function contrast(
  arm: MainWireAorticValveAreaControlArmV1,
  canonical: MainWireAorticValveAreaControlArmV1,
): MainWireAorticValveAreaControlContrastV1 {
  return Object.freeze({
    pointId: arm.pointId as MainWireAorticValveAreaControlContrastV1["pointId"],
    areaRatioToCanonical:
      arm.maximumForwardEoaCm2 / canonical.maximumForwardEoaCm2,
    relativeAorticForwardVolumeChange: relativeChange(
      arm.aorticForwardVolumeMl,
      canonical.aorticForwardVolumeMl,
    ),
    relativeAorticMaximumFlowChange: relativeChange(
      arm.aorticMaximumFlowMlPerSec,
      canonical.aorticMaximumFlowMlPerSec,
    ),
    relativeAorticForwardFlowTimeChange: relativeChange(
      arm.aorticForwardFlowTimeSec,
      canonical.aorticForwardFlowTimeSec,
    ),
    relativeMeanDopplerGradientChange: relativeChange(
      arm.meanDopplerGradientMmHg,
      canonical.meanDopplerGradientMmHg,
    ),
    relativePeakDopplerGradientChange: relativeChange(
      arm.peakDopplerGradientMmHg,
      canonical.peakDopplerGradientMmHg,
    ),
    relativeKinematicFloorChange: relativeChange(
      arm.kinematicFloor.meanAndPeakGradientFloorMmHg,
      canonical.kinematicFloor.meanAndPeakGradientFloorMmHg,
    ),
    relativeFlowNonuniformityFactorChange: relativeChange(
      arm.kinematicFloor.flowNonuniformityFactor,
      canonical.kinematicFloor.flowNonuniformityFactor,
    ),
    relativeOpeningPenaltyFactorChange: relativeChange(
      arm.kinematicFloor.timeVaryingOpeningPenaltyFactor,
      canonical.kinematicFloor.timeVaryingOpeningPenaltyFactor,
    ),
  });
}

function relativeChange(value: number, reference: number): number {
  if (reference === 0) throw new Error("AoV area control reference is zero");
  return (value - reference) / reference;
}

function mean(values: readonly number[]): number {
  if (values.length === 0) throw new Error("mean requires values");
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function maximum(values: readonly number[]): number {
  let result = Number.NEGATIVE_INFINITY;
  for (const value of values) result = Math.max(result, value);
  if (!Number.isFinite(result)) throw new Error("maximum requires values");
  return result;
}
