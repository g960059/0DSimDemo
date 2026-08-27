import {
  countMainWireStrictLocalMaximaV1,
  mainWirePeriodicSpectralEnergyFractionV1,
} from "@/analysis/methods/mainWire/MainWireAorticValveAblationComparisonV1";
import {
  resolveMainWireAorticRootInertanceResearchProfileV1,
} from "@/engine/core/MainWireAorticRootInertanceResearchProfileV1";
import {
  measureMainWireValveDiseaseCycleMetricsV1,
} from "@/engine/myocardium/diagnostics/MainWireValveDiseaseCycleMetricsV1";
import {
  MAIN_WIRE_AORTIC_OUTFLOW_DRIVER_ROOT_ABLATION_ARM_IDS_V1,
  resolveMainWireAorticOutflowDriverRootAblationArmV1,
  type MainWireAorticOutflowDriverRootAblationArmIdV1,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowDriverRootAblationV1";
import type {
  MainWireNormalAdultFiveWallPeriodicResultV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";
import {
  summarizeMainWireNormalAdultFiveWallPeriodicSteadyV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSummaryV1";
import {
  resolveMainWireNormalAdultVentricularMaterialResearchPointV1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";

export const MAIN_WIRE_AORTIC_OUTFLOW_DRIVER_ROOT_COMPARISON_V1_ID =
  "main-wire-aortic-outflow-driver-root-comparison-v1" as const;

export const MAIN_WIRE_AORTIC_OUTFLOW_DRIVER_ROOT_COMPARISON_CLAIM_V1 =
  Object.freeze({
    source: "last-retained-complete-beat" as const,
    exactFrameMutation: false as const,
    rootPressureBalance:
      "Ao-minus-SA-equals-R-times-q-plus-effective-L-times-backward-difference-q" as const,
    rootFirstSampleDerivative:
      "previous-retained-beat-final-sample-when-available-otherwise-cyclic" as const,
    aorticRootStorageFlow:
      "AoV-flow-minus-Ao-SA-flow-positive-means-root-volume-accumulation" as const,
    ventricularDriver:
      "common-LVFW-SEP-RVFW-Land-Tref-not-independent-LV-inotropy" as const,
    nodeAndDopplerGradientsAreNotInterchangeable: true as const,
    flowPeakThreshold: "five-percent-of-positive-cycle-maximum" as const,
    flowPeakCounting: "strict-unsmoothed-local-maxima" as const,
    spectralBandHz: Object.freeze([10, 50] as const),
    factorialContrast:
      "one-sided-two-by-two-absolute-differences-with-difference-of-differences-interaction" as const,
    smoothingApplied: false as const,
    parameterSearchOrFitting: false as const,
    clinicalThresholdOrPassFailJudgment: false as const,
  });

export type MainWireAorticOutflowDriverRootArmInputV1 = Readonly<{
  armId: MainWireAorticOutflowDriverRootAblationArmIdV1;
  periodicResult: MainWireNormalAdultFiveWallPeriodicResultV1;
}>;

export type MainWireAorticOutflowDriverRootArmMetricsV1 = Readonly<{
  armId: MainWireAorticOutflowDriverRootAblationArmIdV1;
  protocolIdentityHash: string;
  ventricularLandTrefScaleFromBaseline: number;
  aorticRootInertanceScaleFromTopology: number;
  terminationReason:
    MainWireNormalAdultFiveWallPeriodicResultV1["terminationReason"];
  periodicSteadyStateClaimed: boolean;
  period2OrbitSuspected: boolean;
  integrationCompletedWithoutFailure: boolean;
  completedBeatCount: number;
  beatIndex: number;
  dtSec: number;
  sampleCount: number;
  aorticForwardVolumeMl: number;
  aorticNetStrokeVolumeMl: number;
  aorticMaximumFlowMlPerSec: number;
  aorticForwardFlowTimeSec: number;
  aorticFlowPeakCountAboveFivePercent: number;
  aorticFlowAcEnergyFraction10To50Hz: number;
  forwardFlowTimeMeanActiveEoaCm2: number;
  activeEoaAtMaximumFlowCm2: number;
  forwardFlowTimeMeanNodeGradientMmHg: number;
  peakNodeGradientMmHg: number;
  forwardFlowTimeMeanDopplerGradientMmHg: number;
  peakDopplerGradientMmHg: number;
  peakVenaContractaVelocityMPerSec: number;
  maximumPositiveAorticFlowAccelerationMlPerSec2: number;
  aorticFlowCentralDerivativeAtMaximumMlPerSec2: number;
  peakLvPressureMmHg: number;
  maximumPositiveLvPressureRiseRateMmHgPerSec: number;
  leftVentricularEjectionFraction01: number;
  rightVentricularEjectionFraction01: number;
  netAorticCardiacOutputLPerMin: number;
  cardiacIndexLPerMinPerM2: number;
  meanAorticAbsolutePressureMmHg: number;
  minimumLvVolumeMl: number;
  maximumLvVolumeMl: number;
  minimumAorticAbsolutePressureMmHg: number;
  maximumAorticAbsolutePressureMmHg: number;
  aorticRootTopologyResistanceMmHgSecPerMl: number;
  aorticRootTopologyInertanceMmHgSec2PerMl: number;
  aorticRootEffectiveInertanceMmHgSec2PerMl: number;
  aorticRootMaximumFlowMlPerSec: number;
  maximumPositiveAorticRootFlowAccelerationMlPerSec2: number;
  peakAbsoluteAorticRootResistivePressureMmHg: number;
  peakAbsoluteAorticRootInertialPressureMmHg: number;
  maximumAbsoluteAorticRootPressureBalanceResidualMmHg: number;
  forwardAorticFlowTimeMeanAorticRootPressureDropMmHg: number;
  maximumAorticRootStorageFlowMlPerSec: number;
  minimumAorticRootStorageFlowMlPerSec: number;
  rmsAorticRootStorageFlowMlPerSec: number;
  aorticRootFlowCentralDerivativeAtAorticFlowMaximumMlPerSec2: number;
}>;

export type MainWireAorticOutflowFactorialMetricIdV1 =
  | "aortic-maximum-flow"
  | "aortic-forward-volume"
  | "mean-doppler-gradient"
  | "peak-doppler-gradient"
  | "peak-node-gradient"
  | "maximum-positive-aortic-flow-acceleration"
  | "peak-lv-pressure"
  | "maximum-positive-lv-pressure-rise-rate"
  | "left-ventricular-ejection-fraction"
  | "net-aortic-cardiac-output"
  | "mean-aortic-absolute-pressure"
  | "rms-aortic-root-storage-flow"
  | "peak-absolute-aortic-root-inertial-pressure"
  | "aortic-flow-ac-energy-fraction-10-to-50-hz";

export type MainWireAorticOutflowFactorialContrastV1 = Readonly<{
  metricId: MainWireAorticOutflowFactorialMetricIdV1;
  unit:
    | "mL/s"
    | "mL"
    | "mmHg"
    | "mL/s^2"
    | "mmHg/s"
    | "L/min"
    | "fraction";
  canonicalValue: number;
  lowDriverMainEffectAtBaselineRoot: number;
  highRootInertanceMainEffectAtBaselineDriver: number;
  interactionDifferenceOfDifferences: number;
  lowDriverEffectAtHighRootInertance: number;
  highRootInertanceEffectAtLowDriver: number;
}>;

export type MainWireAorticOutflowDriverRootComparisonV1 = Readonly<{
  methodId: typeof MAIN_WIRE_AORTIC_OUTFLOW_DRIVER_ROOT_COMPARISON_V1_ID;
  arms: readonly MainWireAorticOutflowDriverRootArmMetricsV1[];
  factorialContrasts: readonly MainWireAorticOutflowFactorialContrastV1[];
  claim: typeof MAIN_WIRE_AORTIC_OUTFLOW_DRIVER_ROOT_COMPARISON_CLAIM_V1;
}>;

export function compareMainWireAorticOutflowDriverRootAblationV1(
  inputs: readonly MainWireAorticOutflowDriverRootArmInputV1[],
): MainWireAorticOutflowDriverRootComparisonV1 {
  const byId = new Map<
    MainWireAorticOutflowDriverRootAblationArmIdV1,
    MainWireNormalAdultFiveWallPeriodicResultV1
  >();
  for (const input of inputs) {
    if (byId.has(input.armId)) {
      throw new Error(`duplicate aortic-outflow ablation arm: ${input.armId}`);
    }
    byId.set(input.armId, input.periodicResult);
  }
  for (const armId of MAIN_WIRE_AORTIC_OUTFLOW_DRIVER_ROOT_ABLATION_ARM_IDS_V1) {
    if (!byId.has(armId)) {
      throw new Error(`missing aortic-outflow ablation arm: ${armId}`);
    }
  }
  if (byId.size !== MAIN_WIRE_AORTIC_OUTFLOW_DRIVER_ROOT_ABLATION_ARM_IDS_V1.length) {
    throw new Error("aortic-outflow comparison accepts exactly the fixed four arms");
  }
  const arms = MAIN_WIRE_AORTIC_OUTFLOW_DRIVER_ROOT_ABLATION_ARM_IDS_V1.map(
    (armId) => measureArm(armId, byId.get(armId)!),
  );
  const metricsById = new Map(arms.map((arm) => [arm.armId, arm]));
  const canonical = metricsById.get("canonical")!;
  const lowDriver = metricsById.get("ventricular-tref-low")!;
  const highRoot = metricsById.get("aortic-root-inertance-high")!;
  const combined = metricsById.get(
    "ventricular-tref-low-plus-aortic-root-inertance-high",
  )!;
  const contrast = (
    metricId: MainWireAorticOutflowFactorialMetricIdV1,
    unit: MainWireAorticOutflowFactorialContrastV1["unit"],
    read: (arm: MainWireAorticOutflowDriverRootArmMetricsV1) => number,
  ): MainWireAorticOutflowFactorialContrastV1 => {
    const baseline = read(canonical);
    const driver = read(lowDriver);
    const root = read(highRoot);
    const both = read(combined);
    return Object.freeze({
      metricId,
      unit,
      canonicalValue: baseline,
      lowDriverMainEffectAtBaselineRoot: driver - baseline,
      highRootInertanceMainEffectAtBaselineDriver: root - baseline,
      interactionDifferenceOfDifferences: both - driver - root + baseline,
      lowDriverEffectAtHighRootInertance: both - root,
      highRootInertanceEffectAtLowDriver: both - driver,
    });
  };
  const factorialContrasts = Object.freeze([
    contrast("aortic-maximum-flow", "mL/s", (arm) =>
      arm.aorticMaximumFlowMlPerSec),
    contrast("aortic-forward-volume", "mL", (arm) =>
      arm.aorticForwardVolumeMl),
    contrast("mean-doppler-gradient", "mmHg", (arm) =>
      arm.forwardFlowTimeMeanDopplerGradientMmHg),
    contrast("peak-doppler-gradient", "mmHg", (arm) =>
      arm.peakDopplerGradientMmHg),
    contrast("peak-node-gradient", "mmHg", (arm) =>
      arm.peakNodeGradientMmHg),
    contrast("maximum-positive-aortic-flow-acceleration", "mL/s^2", (arm) =>
      arm.maximumPositiveAorticFlowAccelerationMlPerSec2),
    contrast("peak-lv-pressure", "mmHg", (arm) => arm.peakLvPressureMmHg),
    contrast("maximum-positive-lv-pressure-rise-rate", "mmHg/s", (arm) =>
      arm.maximumPositiveLvPressureRiseRateMmHgPerSec),
    contrast("left-ventricular-ejection-fraction", "fraction", (arm) =>
      arm.leftVentricularEjectionFraction01),
    contrast("net-aortic-cardiac-output", "L/min", (arm) =>
      arm.netAorticCardiacOutputLPerMin),
    contrast("mean-aortic-absolute-pressure", "mmHg", (arm) =>
      arm.meanAorticAbsolutePressureMmHg),
    contrast("rms-aortic-root-storage-flow", "mL/s", (arm) =>
      arm.rmsAorticRootStorageFlowMlPerSec),
    contrast("peak-absolute-aortic-root-inertial-pressure", "mmHg", (arm) =>
      arm.peakAbsoluteAorticRootInertialPressureMmHg),
    contrast(
      "aortic-flow-ac-energy-fraction-10-to-50-hz",
      "fraction",
      (arm) => arm.aorticFlowAcEnergyFraction10To50Hz,
    ),
  ]);
  return Object.freeze({
    methodId: MAIN_WIRE_AORTIC_OUTFLOW_DRIVER_ROOT_COMPARISON_V1_ID,
    arms: Object.freeze(arms),
    factorialContrasts,
    claim: MAIN_WIRE_AORTIC_OUTFLOW_DRIVER_ROOT_COMPARISON_CLAIM_V1,
  });
}

function measureArm(
  armId: MainWireAorticOutflowDriverRootAblationArmIdV1,
  result: MainWireNormalAdultFiveWallPeriodicResultV1,
): MainWireAorticOutflowDriverRootArmMetricsV1 {
  const beat = result.retainedCompleteBeats.at(-1);
  if (beat === undefined || beat.samples.length === 0) {
    throw new Error(`${armId} requires a retained complete beat`);
  }
  const precedingBeat = result.retainedCompleteBeats.at(-2);
  const arm = resolveMainWireAorticOutflowDriverRootAblationArmV1(armId);
  const materialPoint =
    resolveMainWireNormalAdultVentricularMaterialResearchPointV1(
      arm.ventricularMaterialPointId,
    );
  const rootScale = arm.aorticRootInertanceProfileId === null
    ? 1
    : resolveMainWireAorticRootInertanceResearchProfileV1(
      arm.aorticRootInertanceProfileId,
    ).inertanceScaleFromTopology;
  const rootEdge = result.protocolIdentity.circulation.topologyGraphSnapshot
    .edges.find((edge) => edge.name === "Ao_SA");
  if (
    rootEdge === undefined
    || rootEdge.kind !== "dynamic"
    || rootEdge.up !== "Ao"
    || rootEdge.down !== "SA"
    || !(rootEdge.R > 0)
    || !(rootEdge.L !== undefined && rootEdge.L > 0)
    || (rootEdge.B ?? 0) !== 0
    || rootEdge.useChiResistance === true
  ) {
    throw new Error(`${armId} requires the fixed linear dynamic Ao_SA edge`);
  }
  const cycleMetrics = measureMainWireValveDiseaseCycleMetricsV1(result);
  const periodicSummary =
    summarizeMainWireNormalAdultFiveWallPeriodicSteadyV1(result);
  const aortic = cycleMetrics.valves.AoV;
  const samples = beat.samples;
  const dtSec = result.dtSec;
  const aorticFlows = samples.map((sample) =>
    sample.circulationEdgeFlowMlPerSec.AoV);
  const forwardAorticFlows = aorticFlows.map((flow) => Math.max(0, flow));
  const rootFlows = samples.map((sample) =>
    sample.circulationEdgeFlowMlPerSec.Ao_SA);
  const lvPressures = samples.map((sample) =>
    sample.circulationNodeAbsolutePressureMmHg.LV);
  const rootPressureDrops = samples.map((sample) =>
    sample.circulationNodeAbsolutePressureMmHg.Ao
      - sample.circulationNodeAbsolutePressureMmHg.SA);
  const previousSample = precedingBeat?.samples.at(-1);
  const aorticFlowDerivatives = backwardDifferences(
    aorticFlows,
    dtSec,
    previousSample?.circulationEdgeFlowMlPerSec.AoV,
  );
  const rootFlowDerivatives = backwardDifferences(
    rootFlows,
    dtSec,
    previousSample?.circulationEdgeFlowMlPerSec.Ao_SA,
  );
  const lvPressureDerivatives = backwardDifferences(
    lvPressures,
    dtSec,
    previousSample?.circulationNodeAbsolutePressureMmHg.LV,
  );
  const effectiveRootInertance = rootEdge.L * rootScale;
  const rootResistivePressures = rootFlows.map((flow) => rootEdge.R * flow);
  const rootInertialPressures = rootFlowDerivatives.map((derivative) =>
    effectiveRootInertance * derivative);
  const rootBalanceResiduals = rootPressureDrops.map((drop, index) =>
    drop - rootResistivePressures[index]! - rootInertialPressures[index]!);
  const rootStorageFlows = aorticFlows.map((flow, index) =>
    flow - rootFlows[index]!);
  const forwardSampleIndices = samples.flatMap((_, index) =>
    aorticFlows[index]! > 0 ? [index] : []);
  const maximumAorticFlowIndex = indexOfMaximum(forwardAorticFlows);
  const forwardAreas = forwardSampleIndices.map((index) =>
    samples[index]!.valveHydraulics.AoV.activeEoaCm2);
  const threshold = 0.05 * maximum(forwardAorticFlows);
  return Object.freeze({
    armId,
    protocolIdentityHash: result.protocolIdentityHash,
    ventricularLandTrefScaleFromBaseline:
      materialPoint.ventricularLandTrefScaleFromBaseline,
    aorticRootInertanceScaleFromTopology: rootScale,
    terminationReason: result.terminationReason,
    periodicSteadyStateClaimed: result.periodicSteadyStateClaimed,
    period2OrbitSuspected: result.period2OrbitSuspected,
    integrationCompletedWithoutFailure:
      result.integrationCompletedWithoutFailure,
    completedBeatCount: result.completedBeatCount,
    beatIndex: beat.beatIndex,
    dtSec,
    sampleCount: samples.length,
    aorticForwardVolumeMl: aortic.forwardVolumeMl,
    aorticNetStrokeVolumeMl: aortic.netVolumeMl,
    aorticMaximumFlowMlPerSec: maximum(forwardAorticFlows),
    aorticForwardFlowTimeSec: aortic.forwardFlowTimeSec,
    aorticFlowPeakCountAboveFivePercent:
      countMainWireStrictLocalMaximaV1(forwardAorticFlows, threshold),
    aorticFlowAcEnergyFraction10To50Hz:
      mainWirePeriodicSpectralEnergyFractionV1(
        forwardAorticFlows,
        dtSec,
        10,
        50,
      ),
    forwardFlowTimeMeanActiveEoaCm2: mean(forwardAreas),
    activeEoaAtMaximumFlowCm2:
      samples[maximumAorticFlowIndex]!.valveHydraulics.AoV.activeEoaCm2,
    forwardFlowTimeMeanNodeGradientMmHg:
      aortic.forwardFlowTimeMeanGradientMmHg,
    peakNodeGradientMmHg: aortic.peakForwardGradientMmHg,
    forwardFlowTimeMeanDopplerGradientMmHg:
      aortic.forwardFlowTimeMeanSimplifiedDopplerGradientMmHg,
    peakDopplerGradientMmHg: aortic.peakSimplifiedDopplerGradientMmHg,
    peakVenaContractaVelocityMPerSec: aortic.peakForwardJetVelocityMPerSec,
    maximumPositiveAorticFlowAccelerationMlPerSec2:
      Math.max(0, maximum(aorticFlowDerivatives)),
    aorticFlowCentralDerivativeAtMaximumMlPerSec2: cyclicCentralDerivative(
      aorticFlows,
      maximumAorticFlowIndex,
      dtSec,
      previousSample?.circulationEdgeFlowMlPerSec.AoV,
    ),
    peakLvPressureMmHg: maximum(lvPressures),
    maximumPositiveLvPressureRiseRateMmHgPerSec:
      Math.max(0, maximum(lvPressureDerivatives)),
    leftVentricularEjectionFraction01:
      periodicSummary.hemodynamics.leftVentricularEjectionFraction01,
    rightVentricularEjectionFraction01:
      periodicSummary.hemodynamics.rightVentricularEjectionFraction01,
    netAorticCardiacOutputLPerMin:
      periodicSummary.hemodynamics.netAorticCardiacOutputLPerMin,
    cardiacIndexLPerMinPerM2:
      periodicSummary.hemodynamics.cardiacIndexLPerMinPerM2,
    meanAorticAbsolutePressureMmHg:
      periodicSummary.hemodynamics.meanAorticAbsolutePressureMmHg,
    minimumLvVolumeMl:
      periodicSummary.ranges.chamberVolumeMl.LV.minimum,
    maximumLvVolumeMl:
      periodicSummary.ranges.chamberVolumeMl.LV.maximum,
    minimumAorticAbsolutePressureMmHg:
      periodicSummary.ranges.absolutePressureMmHg.Ao.minimum,
    maximumAorticAbsolutePressureMmHg:
      periodicSummary.ranges.absolutePressureMmHg.Ao.maximum,
    aorticRootTopologyResistanceMmHgSecPerMl: rootEdge.R,
    aorticRootTopologyInertanceMmHgSec2PerMl: rootEdge.L,
    aorticRootEffectiveInertanceMmHgSec2PerMl: effectiveRootInertance,
    aorticRootMaximumFlowMlPerSec: maximum(rootFlows),
    maximumPositiveAorticRootFlowAccelerationMlPerSec2:
      Math.max(0, maximum(rootFlowDerivatives)),
    peakAbsoluteAorticRootResistivePressureMmHg:
      maximum(rootResistivePressures.map(Math.abs)),
    peakAbsoluteAorticRootInertialPressureMmHg:
      maximum(rootInertialPressures.map(Math.abs)),
    maximumAbsoluteAorticRootPressureBalanceResidualMmHg:
      maximum(rootBalanceResiduals.map(Math.abs)),
    forwardAorticFlowTimeMeanAorticRootPressureDropMmHg: mean(
      forwardSampleIndices.map((index) => rootPressureDrops[index]!),
    ),
    maximumAorticRootStorageFlowMlPerSec: maximum(rootStorageFlows),
    minimumAorticRootStorageFlowMlPerSec: minimum(rootStorageFlows),
    rmsAorticRootStorageFlowMlPerSec: rootMeanSquare(rootStorageFlows),
    aorticRootFlowCentralDerivativeAtAorticFlowMaximumMlPerSec2:
      cyclicCentralDerivative(
        rootFlows,
        maximumAorticFlowIndex,
        dtSec,
        previousSample?.circulationEdgeFlowMlPerSec.Ao_SA,
      ),
  });
}

function backwardDifferences(
  values: readonly number[],
  dtSec: number,
  precedingValue?: number,
): readonly number[] {
  if (!(dtSec > 0) || !Number.isFinite(dtSec) || values.length === 0) {
    throw new Error("cyclic derivative requires samples and positive finite dt");
  }
  const initialPrevious = precedingValue ?? values.at(-1)!;
  return Object.freeze(values.map((value, index) =>
    (value - (index === 0 ? initialPrevious : values[index - 1]!)) / dtSec));
}

function cyclicCentralDerivative(
  values: readonly number[],
  index: number,
  dtSec: number,
  precedingValue?: number,
): number {
  if (values.length < 2) return 0;
  const previous = index === 0
    ? precedingValue ?? values.at(-1)!
    : values[index - 1]!;
  const next = index === values.length - 1
    ? values[0]!
    : values[index + 1]!;
  return (next - previous) / (2 * dtSec);
}

function maximum(values: readonly number[]): number {
  let value = Number.NEGATIVE_INFINITY;
  for (const candidate of values) value = Math.max(value, candidate);
  return value === Number.NEGATIVE_INFINITY ? 0 : value;
}

function minimum(values: readonly number[]): number {
  let value = Number.POSITIVE_INFINITY;
  for (const candidate of values) value = Math.min(value, candidate);
  return value === Number.POSITIVE_INFINITY ? 0 : value;
}

function indexOfMaximum(values: readonly number[]): number {
  let index = 0;
  for (let candidate = 1; candidate < values.length; candidate += 1) {
    if (values[candidate]! > values[index]!) index = candidate;
  }
  return index;
}

function mean(values: readonly number[]): number {
  return values.length === 0
    ? 0
    : values.reduce((sum, value) => sum + value, 0) / values.length;
}

function rootMeanSquare(values: readonly number[]): number {
  return values.length === 0
    ? 0
    : Math.sqrt(
      values.reduce((sum, value) => sum + value ** 2, 0) / values.length,
    );
}
