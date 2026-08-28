import {
  measureMainWireAorticOutflowCalciumWaveformCycleV1,
  type MainWireAorticOutflowCalciumWaveformCycleMetricsV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowCalciumWaveformComparisonV1";
import {
  buildAuthoritativeCirculationGraphV1,
  vascularPvLawFromNodeV1,
} from "@/engine/core/circulationGraphKernelV1";
import {
  FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import {
  sanitizeForStableHash,
  stableHash,
} from "@/engine/integrity/stableHash";
import {
  resolveMainWireNormalAdultFiveWallCirculatoryLoadPointV1,
  resolveMainWireNormalAdultFiveWallCirculatoryLoadRuntimeV1,
  type MainWireNormalAdultFiveWallCirculatoryLoadPointV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallCirculatoryLoadPointsV1";
import type {
  MainWireNormalAdultFiveWallPeriodicResultV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";
import {
  complianceFromPtm,
  type VascularPvLaw,
} from "@/engine/vascularPv";

export const MAIN_WIRE_AORTIC_OUTFLOW_ARTERIAL_STIFFNESS_ABLATION_V1_ID =
  "main-wire-aortic-outflow-arterial-stiffness-ablation-v1" as const;

export const MAIN_WIRE_AORTIC_OUTFLOW_ARTERIAL_STIFFNESS_POINT_IDS_V1 =
  Object.freeze([
    "arterial-stiffness-low",
    "baseline",
    "arterial-stiffness-high",
  ] as const);

export type MainWireAorticOutflowArterialStiffnessPointIdV1 =
  (typeof MAIN_WIRE_AORTIC_OUTFLOW_ARTERIAL_STIFFNESS_POINT_IDS_V1)[number];

export const MAIN_WIRE_AORTIC_OUTFLOW_ARTERIAL_STIFFNESS_ABLATION_CLAIM_V1 =
  Object.freeze({
    source: "last-retained-complete-beat-per-independent-cold-run" as const,
    design:
      "fixed-log-symmetric-global-arterial-stiffness-bracket" as const,
    stiffnessScaleFromBaseline: Object.freeze([0.75, 1, 4 / 3] as const),
    changedExactOwner:
      "global-arterial-pressure-volume-law-stiffness-only" as const,
    affectedArterialNodes: Object.freeze(["Ao", "SA", "Art"] as const),
    complianceReadback:
      "exact-law-tangent-at-accepted-endpoint-pressure" as const,
    complianceDimension: "node-volume-ml-per-mmHg" as const,
    localAreaComplianceComparisonRequiresAnatomicalSupportLength: true as const,
    proximalAorticComplianceIsolated: false as const,
    inputImpedanceOrWaveReflectionIdentified: false as const,
    smoothingApplied: false as const,
    interpolationApplied: false as const,
    parameterSearchOrFitting: false as const,
    hemodynamicOutcomeUsedToDeriveBracket: false as const,
    clinicalValidationClaimed: false as const,
    canonicalAdoptionEstablished: false as const,
  });

type ArterialNodeId = "Ao" | "SA" | "Art";

type ComplianceSummary = Readonly<{
  minimumMlPerMmHg: number;
  arithmeticMeanMlPerMmHg: number;
  maximumMlPerMmHg: number;
}>;

export type MainWireAorticOutflowArterialStiffnessInputV1 = Readonly<{
  pointId: MainWireAorticOutflowArterialStiffnessPointIdV1;
  periodicResult: MainWireNormalAdultFiveWallPeriodicResultV1;
}>;

export type MainWireAorticOutflowArterialStiffnessArmV1 = Readonly<{
  point: MainWireNormalAdultFiveWallCirculatoryLoadPointV1;
  arterialStiffness: number;
  cycle: MainWireAorticOutflowCalciumWaveformCycleMetricsV1;
  aorticPulsePressureMmHg: number;
  tangentComplianceByNode: Readonly<Record<
    ArterialNodeId,
    ComplianceSummary
  >>;
  summedArterialNodeTangentCompliance: ComplianceSummary;
}>;

export type MainWireAorticOutflowArterialStiffnessContrastV1 = Readonly<{
  pointId: Exclude<
    MainWireAorticOutflowArterialStiffnessPointIdV1,
    "baseline"
  >;
  aorticMaximumFlowChangeMlPerSec: number;
  aorticEjectionTimeProxyChangeSec: number;
  meanDopplerGradientChangeMmHg: number;
  peakDopplerGradientChangeMmHg: number;
  aorticForwardVolumeChangeMl: number;
  meanAorticPressureChangeMmHg: number;
  aorticPulsePressureChangeMmHg: number;
  netAorticCardiacOutputChangeLPerMin: number;
  summedMeanTangentComplianceChangeMlPerMmHg: number;
}>;

export type MainWireAorticOutflowArterialStiffnessAblationV1 = Readonly<{
  methodId: typeof MAIN_WIRE_AORTIC_OUTFLOW_ARTERIAL_STIFFNESS_ABLATION_V1_ID;
  arms: readonly MainWireAorticOutflowArterialStiffnessArmV1[];
  contrastsFromBaseline:
    readonly MainWireAorticOutflowArterialStiffnessContrastV1[];
  allRunsPeriod1AndIntegrated: boolean;
  peakGradientStrictlyDecreasesWithStiffness: boolean;
  peakFlowStrictlyDecreasesWithStiffness: boolean;
  ejectionTimeStrictlyIncreasesWithStiffness: boolean;
  claim: typeof MAIN_WIRE_AORTIC_OUTFLOW_ARTERIAL_STIFFNESS_ABLATION_CLAIM_V1;
}>;

export function measureMainWireAorticOutflowArterialStiffnessAblationV1(
  inputs: readonly MainWireAorticOutflowArterialStiffnessInputV1[],
): MainWireAorticOutflowArterialStiffnessAblationV1 {
  const byId = new Map<
    MainWireAorticOutflowArterialStiffnessPointIdV1,
    MainWireNormalAdultFiveWallPeriodicResultV1
  >();
  for (const input of inputs) {
    if (byId.has(input.pointId)) {
      throw new Error(`duplicate arterial-stiffness point: ${input.pointId}`);
    }
    byId.set(input.pointId, input.periodicResult);
  }
  for (const pointId of
    MAIN_WIRE_AORTIC_OUTFLOW_ARTERIAL_STIFFNESS_POINT_IDS_V1) {
    if (!byId.has(pointId)) {
      throw new Error(`missing arterial-stiffness point: ${pointId}`);
    }
  }
  if (
    byId.size
      !== MAIN_WIRE_AORTIC_OUTFLOW_ARTERIAL_STIFFNESS_POINT_IDS_V1.length
  ) {
    throw new Error("arterial-stiffness ablation accepts exactly three points");
  }
  const baselineResult = byId.get("baseline")!;
  for (const [pointId, result] of byId) {
    assertSharedNonRuntimeProtocol(pointId, result, baselineResult);
  }

  const arms = Object.freeze(
    MAIN_WIRE_AORTIC_OUTFLOW_ARTERIAL_STIFFNESS_POINT_IDS_V1.map(
      (pointId) => measureArm(pointId, byId.get(pointId)!),
    ),
  );
  const low = arms[0]!;
  const baseline = arms[1]!;
  const high = arms[2]!;
  const contrast = (
    arm: typeof low | typeof high,
  ): MainWireAorticOutflowArterialStiffnessContrastV1 => Object.freeze({
    pointId: arm.point.pointId as Exclude<
      MainWireAorticOutflowArterialStiffnessPointIdV1,
      "baseline"
    >,
    aorticMaximumFlowChangeMlPerSec:
      arm.cycle.aorticMaximumFlowMlPerSec
      - baseline.cycle.aorticMaximumFlowMlPerSec,
    aorticEjectionTimeProxyChangeSec:
      arm.cycle.aorticEjectionTimeProxySec
      - baseline.cycle.aorticEjectionTimeProxySec,
    meanDopplerGradientChangeMmHg:
      arm.cycle.meanDopplerGradientMmHg
      - baseline.cycle.meanDopplerGradientMmHg,
    peakDopplerGradientChangeMmHg:
      arm.cycle.peakDopplerGradientMmHg
      - baseline.cycle.peakDopplerGradientMmHg,
    aorticForwardVolumeChangeMl:
      arm.cycle.aorticForwardVolumeMl
      - baseline.cycle.aorticForwardVolumeMl,
    meanAorticPressureChangeMmHg:
      arm.cycle.meanAorticAbsolutePressureMmHg
      - baseline.cycle.meanAorticAbsolutePressureMmHg,
    aorticPulsePressureChangeMmHg:
      arm.aorticPulsePressureMmHg - baseline.aorticPulsePressureMmHg,
    netAorticCardiacOutputChangeLPerMin:
      arm.cycle.netAorticCardiacOutputLPerMin
      - baseline.cycle.netAorticCardiacOutputLPerMin,
    summedMeanTangentComplianceChangeMlPerMmHg:
      arm.summedArterialNodeTangentCompliance.arithmeticMeanMlPerMmHg
      - baseline.summedArterialNodeTangentCompliance.arithmeticMeanMlPerMmHg,
  });
  return Object.freeze({
    methodId: MAIN_WIRE_AORTIC_OUTFLOW_ARTERIAL_STIFFNESS_ABLATION_V1_ID,
    arms,
    contrastsFromBaseline: Object.freeze([contrast(low), contrast(high)]),
    allRunsPeriod1AndIntegrated: arms.every((arm) =>
      arm.cycle.periodicSteadyStateClaimed
      && arm.cycle.integrationCompletedWithoutFailure),
    peakGradientStrictlyDecreasesWithStiffness:
      low.cycle.peakDopplerGradientMmHg
        > baseline.cycle.peakDopplerGradientMmHg
      && baseline.cycle.peakDopplerGradientMmHg
        > high.cycle.peakDopplerGradientMmHg,
    peakFlowStrictlyDecreasesWithStiffness:
      low.cycle.aorticMaximumFlowMlPerSec
        > baseline.cycle.aorticMaximumFlowMlPerSec
      && baseline.cycle.aorticMaximumFlowMlPerSec
        > high.cycle.aorticMaximumFlowMlPerSec,
    ejectionTimeStrictlyIncreasesWithStiffness:
      low.cycle.aorticEjectionTimeProxySec
        < baseline.cycle.aorticEjectionTimeProxySec
      && baseline.cycle.aorticEjectionTimeProxySec
        < high.cycle.aorticEjectionTimeProxySec,
    claim: MAIN_WIRE_AORTIC_OUTFLOW_ARTERIAL_STIFFNESS_ABLATION_CLAIM_V1,
  });
}

function assertSharedNonRuntimeProtocol(
  pointId: MainWireAorticOutflowArterialStiffnessPointIdV1,
  result: MainWireNormalAdultFiveWallPeriodicResultV1,
  baseline: MainWireNormalAdultFiveWallPeriodicResultV1,
): void {
  for (const key of [
    "mechanicsProviderMetadataStableHash",
    "calciumDriveFixedParamsStableHash",
    "circulationTopologyGraphStableHash",
    "bloodVolumeOperatingPointStableHash",
    "commonPericardiumStableHash",
    "periodicPolicyStableHash",
  ] as const) {
    if (
      result.protocolComponentHashes[key]
        !== baseline.protocolComponentHashes[key]
    ) {
      throw new Error(`${pointId} protocol mismatch outside runtime: ${key}`);
    }
  }
}

function measureArm(
  pointId: MainWireAorticOutflowArterialStiffnessPointIdV1,
  periodicResult: MainWireNormalAdultFiveWallPeriodicResultV1,
): MainWireAorticOutflowArterialStiffnessArmV1 {
  const beat = periodicResult.retainedCompleteBeats.at(-1);
  if (beat === undefined || beat.samples.length === 0) {
    throw new Error(`${pointId} arterial-stiffness arm requires a beat`);
  }
  const point = resolveMainWireNormalAdultFiveWallCirculatoryLoadPointV1(
    pointId,
  );
  const runtime = resolveMainWireNormalAdultFiveWallCirculatoryLoadRuntimeV1(
    pointId,
  );
  const expectedRuntimeHash = stableHash(sanitizeForStableHash(runtime));
  if (
    periodicResult.protocolComponentHashes.circulationRuntimeStableHash
      !== expectedRuntimeHash
  ) {
    throw new Error(`${pointId} result does not match its fixed runtime`);
  }
  const graph = buildAuthoritativeCirculationGraphV1();
  const nodeLaws = Object.freeze(Object.fromEntries(
    (["Ao", "SA", "Art"] as const).map((nodeId) => {
      const node = graph.nodes[graph.nodeIndex.get(nodeId)!]!;
      return [nodeId, vascularPvLawFromNodeV1(node, runtime.vascular)];
    }),
  )) as Readonly<Record<ArterialNodeId, VascularPvLaw>>;
  const complianceSeriesFor = (nodeId: ArterialNodeId) =>
    beat.samples.map((sample) => complianceFromPtm(
      nodeLaws[nodeId],
      sample.circulationNodeAbsolutePressureMmHg[nodeId],
    ));
  const complianceSeries = Object.freeze({
    Ao: complianceSeriesFor("Ao"),
    SA: complianceSeriesFor("SA"),
    Art: complianceSeriesFor("Art"),
  });
  const summed = beat.samples.map((_, index) =>
    complianceSeries.Ao[index]!
    + complianceSeries.SA[index]!
    + complianceSeries.Art[index]!);
  const cycle = measureMainWireAorticOutflowCalciumWaveformCycleV1(
    periodicResult,
    FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
    pointId,
  );
  return Object.freeze({
    point,
    arterialStiffness: runtime.vascular.arterialStiffness,
    cycle,
    aorticPulsePressureMmHg:
      cycle.maximumAorticRootPressureMmHg
      - cycle.minimumAorticRootPressureMmHg,
    tangentComplianceByNode: Object.freeze({
      Ao: summarize(complianceSeries.Ao),
      SA: summarize(complianceSeries.SA),
      Art: summarize(complianceSeries.Art),
    }),
    summedArterialNodeTangentCompliance: summarize(summed),
  });
}

function summarize(values: readonly number[]): ComplianceSummary {
  if (values.length === 0) throw new Error("compliance series is empty");
  let minimum = Number.POSITIVE_INFINITY;
  let maximum = Number.NEGATIVE_INFINITY;
  let sum = 0;
  for (const value of values) {
    minimum = Math.min(minimum, value);
    maximum = Math.max(maximum, value);
    sum += value;
  }
  return Object.freeze({
    minimumMlPerMmHg: minimum,
    arithmeticMeanMlPerMmHg: sum / values.length,
    maximumMlPerMmHg: maximum,
  });
}
