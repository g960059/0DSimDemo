import {
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
  resolveMainWireAorticRootResistanceResearchProfileV1,
} from "@/engine/core/MainWireAorticRootResistanceResearchProfileV1";
import {
  FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import {
  measureMainWireValveDiseaseCycleMetricsV1,
} from "@/engine/myocardium/diagnostics/MainWireValveDiseaseCycleMetricsV1";
import {
  MAIN_WIRE_AORTIC_OUTFLOW_LENGTH_DEPENDENCE_ROOT_RESISTANCE_ARM_IDS_V1,
  resolveMainWireAorticOutflowLengthDependenceRootResistanceArmV1,
  type MainWireAorticOutflowLengthDependenceRootResistanceArmIdV1,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowLengthDependenceRootResistanceAblationV1";
import type {
  MainWireNormalAdultFiveWallPeriodicResultV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";
import {
  resolveMainWireNormalAdultVentricularMaterialResearchPointV1,
  resolveMainWireNormalAdultVentricularWallMaterialResearchV1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";

export const MAIN_WIRE_AORTIC_OUTFLOW_LENGTH_DEPENDENCE_ROOT_RESISTANCE_FACTORIAL_V1_ID =
  "main-wire-aortic-outflow-length-dependence-root-resistance-factorial-v1" as const;

export const MAIN_WIRE_AORTIC_OUTFLOW_LENGTH_DEPENDENCE_ROOT_RESISTANCE_FACTORIAL_CLAIM_V1 =
  Object.freeze({
    source: "last-retained-complete-beat-per-independent-cold-run" as const,
    design: "fixed-one-sided-two-by-two-mechanism-factorial" as const,
    ventricularFactor:
      "Land-beta0-and-beta1-scaled-together-to-three-quarters" as const,
    ventricularReferenceLengthInvariant:
      "both-scaled-terms-vanish-at-lambda-one" as const,
    rootFactor:
      "graph-owned-Ao-SA-linear-resistance-scaled-to-four-thirds" as const,
    rootPressureBalance:
      "Ao-minus-SA-equals-effective-R-times-q-plus-topology-L-times-backward-difference-q" as const,
    rootFirstSampleDerivative:
      "previous-retained-beat-final-sample-required-for-inclusion-in-exact-balance" as const,
    landStretchReadback:
      "exp-effective-fiber-log-strain-with-fixed-unit-land-slack-stretch" as const,
    loadedTiming:
      "same-thresholded-aortic-forward-episode-as-valve-cycle-method" as const,
    isometricAudit:
      "offline-periodic-Land-replay-at-source-resting-lambda-one" as const,
    exactFrameMutation: false as const,
    calciumDriveChanged: false as const,
    ventricularTrefChanged: false as const,
    passiveOrSlsChanged: false as const,
    aorticValveConstitutiveLawChanged: false as const,
    acceptedStateOrCheckpointTopologyChanged: false as const,
    outcomeInformedFactorSelection: false as const,
    parameterSearchOrFitting: false as const,
    clinicalValidationClaimed: false as const,
    canonicalAdoptionEstablished: false as const,
  });

type VentricularWallId = "LVFW" | "SEP" | "RVFW";

export type MainWireAorticOutflowLengthDependenceRootResistanceInputV1 =
  Readonly<{
    armId: MainWireAorticOutflowLengthDependenceRootResistanceArmIdV1;
    periodicResult: MainWireNormalAdultFiveWallPeriodicResultV1;
  }>;

export type MainWireAorticOutflowLoadedWallTimingV1 = Readonly<{
  minimumLandStretch: number;
  maximumLandStretch: number;
  landStretchAtAorticFlowOnset: number;
  landStretchAtAorticFlowPeak: number;
  landStretchAtAorticFlowEnd: number;
  activeStressAtAorticFlowOnsetPa: number;
  activeStressAtAorticFlowPeakPa: number;
  activeStressAtAorticFlowEndPa: number;
  peakActiveStressPa: number;
  positiveActiveStressCycleIntegralPaSec: number;
  activeStressPeakCountAboveFivePercent: number;
}>;

export type MainWireAorticRootResistanceBalanceV1 = Readonly<{
  topologyResistanceMmHgSecPerMl: number;
  resistanceScaleFromTopology: number;
  effectiveResistanceMmHgSecPerMl: number;
  topologyInertanceMmHgSec2PerMl: number;
  firstSampleBalanceIncluded: boolean;
  pressureBalanceSampleCount: number;
  maximumAbsolutePressureBalanceResidualMmHg: number;
  peakAbsoluteResistivePressureMmHg: number;
  peakAbsoluteInertialPressureMmHg: number;
  forwardFlowTimeMeanRootPressureDropMmHg: number;
}>;

export type MainWireAorticOutflowLengthDependenceRootResistanceArmV1 =
  Readonly<{
    armId: MainWireAorticOutflowLengthDependenceRootResistanceArmIdV1;
    protocolIdentityHash: string;
    lengthDependenceScaleFromBaseline: number;
    resolvedLandBeta0: number;
    resolvedLandBeta1UM: number;
    rootResistanceScaleFromTopology: number;
    cycle: MainWireAorticOutflowCalciumWaveformCycleMetricsV1;
    aorticPulsePressureMmHg: number;
    referenceLengthIsometric:
      MainWireVentricularLandIsometricTwitchAuditV1;
    loadedWallTimingByWall: Readonly<Record<
      VentricularWallId,
      MainWireAorticOutflowLoadedWallTimingV1
    >>;
    rootResistanceBalance: MainWireAorticRootResistanceBalanceV1;
    singlePeakMorphologyPreserved: boolean;
    candidateScreen:
      MainWireAorticOutflowCalciumCandidateScreenResultV1 | null;
  }>;

export type MainWireAorticOutflowLengthDependenceRootResistanceMetricIdV1 =
  | "aortic-maximum-flow"
  | "aortic-ejection-time-proxy"
  | "mean-doppler-gradient"
  | "peak-doppler-gradient"
  | "aortic-forward-volume"
  | "cardiac-output"
  | "mean-aortic-pressure"
  | "aortic-pulse-pressure"
  | "left-ventricular-ejection-fraction"
  | "peak-left-ventricular-pressure"
  | "lvfw-active-stress-at-aortic-flow-peak"
  | "lvfw-active-stress-cycle-integral"
  | "lvfw-land-stretch-at-aortic-flow-peak"
  | "peak-root-resistive-pressure";

export type MainWireAorticOutflowLengthDependenceRootResistanceContrastV1 =
  Readonly<{
    metricId:
      MainWireAorticOutflowLengthDependenceRootResistanceMetricIdV1;
    canonicalValue: number;
    lowLengthDependenceMainEffectAtBaselineRoot: number;
    highRootResistanceMainEffectAtBaselineLengthDependence: number;
    interactionDifferenceOfDifferences: number;
    lowLengthDependenceEffectAtHighRootResistance: number;
    highRootResistanceEffectAtLowLengthDependence: number;
    combinedValue: number;
  }>;

export type MainWireAorticOutflowLengthDependenceRootResistanceFactorialV1 =
  Readonly<{
    methodId:
      typeof MAIN_WIRE_AORTIC_OUTFLOW_LENGTH_DEPENDENCE_ROOT_RESISTANCE_FACTORIAL_V1_ID;
    arms:
      readonly MainWireAorticOutflowLengthDependenceRootResistanceArmV1[];
    factorialContrasts:
      readonly MainWireAorticOutflowLengthDependenceRootResistanceContrastV1[];
    referenceLengthIsometricInvariance: Readonly<{
      maximumAbsoluteActiveTwitchMetricDifference: number;
      exactAtFloatingPoint: boolean;
    }>;
    allRunsPeriod1AndIntegrated: boolean;
    morphologyPreservedAcrossFactorial: boolean;
    combinedDirectionalCandidateRetained: boolean;
    combinedReferenceNormalizedCandidate: boolean;
    claim:
      typeof MAIN_WIRE_AORTIC_OUTFLOW_LENGTH_DEPENDENCE_ROOT_RESISTANCE_FACTORIAL_CLAIM_V1;
  }>;

export function compareMainWireAorticOutflowLengthDependenceRootResistanceFactorialV1(
  inputs:
    readonly MainWireAorticOutflowLengthDependenceRootResistanceInputV1[],
): MainWireAorticOutflowLengthDependenceRootResistanceFactorialV1 {
  const byId = new Map<
    MainWireAorticOutflowLengthDependenceRootResistanceArmIdV1,
    MainWireNormalAdultFiveWallPeriodicResultV1
  >();
  for (const input of inputs) {
    if (byId.has(input.armId)) {
      throw new Error(
        `duplicate length-dependence/root-resistance arm: ${input.armId}`,
      );
    }
    byId.set(input.armId, input.periodicResult);
  }
  for (
    const armId of
    MAIN_WIRE_AORTIC_OUTFLOW_LENGTH_DEPENDENCE_ROOT_RESISTANCE_ARM_IDS_V1
  ) {
    if (!byId.has(armId)) {
      throw new Error(
        `missing length-dependence/root-resistance arm: ${armId}`,
      );
    }
  }
  if (
    byId.size
    !== MAIN_WIRE_AORTIC_OUTFLOW_LENGTH_DEPENDENCE_ROOT_RESISTANCE_ARM_IDS_V1
      .length
  ) {
    throw new Error(
      "length-dependence/root-resistance factorial accepts exactly four arms",
    );
  }
  assertFactorialIdentities(byId);
  const canonicalResult = byId.get("canonical")!;
  const canonicalCycle = measureMainWireAorticOutflowCalciumWaveformCycleV1(
    canonicalResult,
    FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
    "canonical length-dependence/root-resistance arm",
  );
  const arms = Object.freeze(
    MAIN_WIRE_AORTIC_OUTFLOW_LENGTH_DEPENDENCE_ROOT_RESISTANCE_ARM_IDS_V1.map(
      (armId) => measureArm(
        armId,
        byId.get(armId)!,
        canonicalCycle,
      ),
    ),
  );
  const canonical = arms[0]!;
  const lowLengthDependence = arms[1]!;
  const highRootResistance = arms[2]!;
  const combined = arms[3]!;
  const contrast = (
    metricId:
      MainWireAorticOutflowLengthDependenceRootResistanceMetricIdV1,
    read: (
      arm: MainWireAorticOutflowLengthDependenceRootResistanceArmV1,
    ) => number,
  ): MainWireAorticOutflowLengthDependenceRootResistanceContrastV1 => {
    const base = read(canonical);
    const length = read(lowLengthDependence);
    const root = read(highRootResistance);
    const both = read(combined);
    return Object.freeze({
      metricId,
      canonicalValue: base,
      lowLengthDependenceMainEffectAtBaselineRoot: length - base,
      highRootResistanceMainEffectAtBaselineLengthDependence: root - base,
      interactionDifferenceOfDifferences: both - length - root + base,
      lowLengthDependenceEffectAtHighRootResistance: both - root,
      highRootResistanceEffectAtLowLengthDependence: both - length,
      combinedValue: both,
    });
  };
  const factorialContrasts = Object.freeze([
    contrast("aortic-maximum-flow", (arm) =>
      arm.cycle.aorticMaximumFlowMlPerSec),
    contrast("aortic-ejection-time-proxy", (arm) =>
      arm.cycle.aorticEjectionTimeProxySec),
    contrast("mean-doppler-gradient", (arm) =>
      arm.cycle.meanDopplerGradientMmHg),
    contrast("peak-doppler-gradient", (arm) =>
      arm.cycle.peakDopplerGradientMmHg),
    contrast("aortic-forward-volume", (arm) =>
      arm.cycle.aorticForwardVolumeMl),
    contrast("cardiac-output", (arm) =>
      arm.cycle.netAorticCardiacOutputLPerMin),
    contrast("mean-aortic-pressure", (arm) =>
      arm.cycle.meanAorticAbsolutePressureMmHg),
    contrast("aortic-pulse-pressure", (arm) =>
      arm.aorticPulsePressureMmHg),
    contrast("left-ventricular-ejection-fraction", (arm) =>
      arm.cycle.leftVentricularEjectionFraction01),
    contrast("peak-left-ventricular-pressure", (arm) =>
      arm.cycle.peakLeftVentricularPressureMmHg),
    contrast("lvfw-active-stress-at-aortic-flow-peak", (arm) =>
      arm.loadedWallTimingByWall.LVFW.activeStressAtAorticFlowPeakPa),
    contrast("lvfw-active-stress-cycle-integral", (arm) =>
      arm.loadedWallTimingByWall.LVFW.positiveActiveStressCycleIntegralPaSec),
    contrast("lvfw-land-stretch-at-aortic-flow-peak", (arm) =>
      arm.loadedWallTimingByWall.LVFW.landStretchAtAorticFlowPeak),
    contrast("peak-root-resistive-pressure", (arm) =>
      arm.rootResistanceBalance.peakAbsoluteResistivePressureMmHg),
  ]);
  const canonicalIsometric = activeTwitchVector(
    canonical.referenceLengthIsometric,
  );
  const lowLengthIsometric = activeTwitchVector(
    lowLengthDependence.referenceLengthIsometric,
  );
  const maximumAbsoluteActiveTwitchMetricDifference = maximum(
    canonicalIsometric.map((value, index) =>
      Math.abs(value - lowLengthIsometric[index]!)),
  );
  return Object.freeze({
    methodId:
      MAIN_WIRE_AORTIC_OUTFLOW_LENGTH_DEPENDENCE_ROOT_RESISTANCE_FACTORIAL_V1_ID,
    arms,
    factorialContrasts,
    referenceLengthIsometricInvariance: Object.freeze({
      maximumAbsoluteActiveTwitchMetricDifference,
      exactAtFloatingPoint:
        maximumAbsoluteActiveTwitchMetricDifference === 0,
    }),
    allRunsPeriod1AndIntegrated: arms.every((arm) =>
      arm.cycle.periodicSteadyStateClaimed
      && arm.cycle.integrationCompletedWithoutFailure),
    morphologyPreservedAcrossFactorial:
      arms.every((arm) => arm.singlePeakMorphologyPreserved),
    combinedDirectionalCandidateRetained:
      combined.candidateScreen!.retainedDirectionalCandidate,
    combinedReferenceNormalizedCandidate:
      combined.candidateScreen!.referenceNormalizedCandidate,
    claim:
      MAIN_WIRE_AORTIC_OUTFLOW_LENGTH_DEPENDENCE_ROOT_RESISTANCE_FACTORIAL_CLAIM_V1,
  });
}

function measureArm(
  armId: MainWireAorticOutflowLengthDependenceRootResistanceArmIdV1,
  result: MainWireNormalAdultFiveWallPeriodicResultV1,
  canonicalCycle: MainWireAorticOutflowCalciumWaveformCycleMetricsV1,
): MainWireAorticOutflowLengthDependenceRootResistanceArmV1 {
  const arm =
    resolveMainWireAorticOutflowLengthDependenceRootResistanceArmV1(armId);
  const materialPoint =
    resolveMainWireNormalAdultVentricularMaterialResearchPointV1(
      arm.ventricularMaterialPointId,
    );
  const wallMaterial =
    resolveMainWireNormalAdultVentricularWallMaterialResearchV1(
      arm.ventricularMaterialPointId,
    );
  if (wallMaterial.landSlackStretch !== 1) {
    throw new Error(`${armId} requires unit ventricular Land slack stretch`);
  }
  const cycle = armId === "canonical"
    ? canonicalCycle
    : measureMainWireAorticOutflowCalciumWaveformCycleV1(
      result,
      FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
      armId,
    );
  const beat = result.retainedCompleteBeats.at(-1);
  if (beat === undefined || beat.samples.length === 0) {
    throw new Error(`${armId} requires a retained complete beat`);
  }
  const valveMetrics = measureMainWireValveDiseaseCycleMetricsV1(result)
    .valves.AoV;
  const flows = beat.samples.map((sample) =>
    Math.max(0, sample.circulationEdgeFlowMlPerSec.AoV));
  const thresholdActive = flows.map((flow) =>
    flow >= valveMetrics.episodeFlowThresholdMlPerSec);
  const onsetIndex = thresholdActive.findIndex((active, index) =>
    active && !thresholdActive[
      (index - 1 + thresholdActive.length) % thresholdActive.length
    ]);
  const activeCount = thresholdActive.filter(Boolean).length;
  if (onsetIndex < 0 || activeCount === 0 || valveMetrics.forwardEpisodeCount !== 1) {
    throw new Error(`${armId} requires one thresholded aortic flow episode`);
  }
  const endIndex = (onsetIndex + activeCount - 1) % beat.samples.length;
  const peakFlowIndex = indexOfMaximum(flows);
  const loadedWallTimingByWall = wallRecord((wallId) => {
    const stretches = beat.samples.map((sample) =>
      Math.exp(sample.wallFiberLogStrain[wallId]));
    const activeStresses = beat.samples.map((sample) =>
      Math.max(0, sample.wallStressPa[wallId].active));
    const peakStress = maximum(activeStresses);
    return Object.freeze({
      minimumLandStretch: minimum(stretches),
      maximumLandStretch: maximum(stretches),
      landStretchAtAorticFlowOnset: stretches[onsetIndex]!,
      landStretchAtAorticFlowPeak: stretches[peakFlowIndex]!,
      landStretchAtAorticFlowEnd: stretches[endIndex]!,
      activeStressAtAorticFlowOnsetPa: activeStresses[onsetIndex]!,
      activeStressAtAorticFlowPeakPa: activeStresses[peakFlowIndex]!,
      activeStressAtAorticFlowEndPa: activeStresses[endIndex]!,
      peakActiveStressPa: peakStress,
      positiveActiveStressCycleIntegralPaSec:
        cycle.positiveActiveStressCycleIntegralPaSecByWall[wallId],
      activeStressPeakCountAboveFivePercent:
        countMainWireStrictLocalMaximaV1(
          activeStresses,
          0.05 * peakStress,
        ),
    });
  });
  const rootResistanceScaleFromTopology =
    arm.aorticRootResistanceProfileId === null
      ? 1
      : resolveMainWireAorticRootResistanceResearchProfileV1(
        arm.aorticRootResistanceProfileId,
      ).resistanceScaleFromTopology;
  const aorticPressures = beat.samples.map((sample) =>
    sample.circulationNodeAbsolutePressureMmHg.Ao);
  const candidateScreen = armId === "canonical"
    ? null
    : screenMainWireAorticOutflowCalciumCandidateV1(cycle, canonicalCycle);
  return Object.freeze({
    armId,
    protocolIdentityHash: result.protocolIdentityHash,
    lengthDependenceScaleFromBaseline:
      materialPoint.ventricularLandLengthDependenceScaleFromBaseline,
    resolvedLandBeta0: materialPoint.resolvedVentricularLandBeta0,
    resolvedLandBeta1UM: materialPoint.resolvedVentricularLandBeta1UM,
    rootResistanceScaleFromTopology,
    cycle,
    aorticPulsePressureMmHg:
      maximum(aorticPressures) - minimum(aorticPressures),
    referenceLengthIsometric:
      measureMainWireVentricularLandIsometricTwitchAuditV1(
        FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
        { dtSec: result.dtSec, fixedLandStretch: 1 },
        wallMaterial,
      ),
    loadedWallTimingByWall,
    rootResistanceBalance: measureRootResistanceBalance(
      armId,
      result,
      rootResistanceScaleFromTopology,
    ),
    singlePeakMorphologyPreserved:
      cycle.aorticFlowPeakCountAboveFivePercent === 1
      && Object.values(loadedWallTimingByWall).every((wall) =>
        wall.activeStressPeakCountAboveFivePercent === 1),
    candidateScreen,
  });
}

function measureRootResistanceBalance(
  armId: MainWireAorticOutflowLengthDependenceRootResistanceArmIdV1,
  result: MainWireNormalAdultFiveWallPeriodicResultV1,
  resistanceScaleFromTopology: number,
): MainWireAorticRootResistanceBalanceV1 {
  const edge = result.protocolIdentity.circulation.topologyGraphSnapshot.edges
    .find((candidate) => candidate.name === "Ao_SA");
  if (
    edge === undefined
    || edge.kind !== "dynamic"
    || edge.up !== "Ao"
    || edge.down !== "SA"
    || !(edge.R > 0)
    || edge.L === undefined
    || !(edge.L > 0)
    || (edge.B ?? 0) !== 0
    || edge.useChiResistance === true
  ) {
    throw new Error(`${armId} requires the fixed linear dynamic Ao_SA edge`);
  }
  const beat = result.retainedCompleteBeats.at(-1)!;
  const samples = beat.samples;
  const rootFlows = samples.map((sample) =>
    sample.circulationEdgeFlowMlPerSec.Ao_SA);
  const precedingFinalSample = result.retainedCompleteBeats.at(-2)?.samples.at(
    -1,
  );
  const firstSampleBalanceIncluded = precedingFinalSample !== undefined;
  const previousFlow = precedingFinalSample
    ?.circulationEdgeFlowMlPerSec.Ao_SA ?? rootFlows.at(-1)!;
  const derivatives = backwardDifferences(
    rootFlows,
    result.dtSec,
    previousFlow,
  );
  const drops = samples.map((sample) =>
    sample.circulationNodeAbsolutePressureMmHg.Ao
    - sample.circulationNodeAbsolutePressureMmHg.SA);
  const effectiveResistance = edge.R * resistanceScaleFromTopology;
  const resistivePressures = rootFlows.map((flow) =>
    effectiveResistance * flow);
  const inertialPressures = derivatives.map((derivative) =>
    edge.L! * derivative);
  const residuals = drops.map((drop, index) =>
    drop - resistivePressures[index]! - inertialPressures[index]!);
  const admittedResiduals = firstSampleBalanceIncluded
    ? residuals
    : residuals.slice(1);
  if (admittedResiduals.length === 0) {
    throw new Error(`${armId} requires an admitted root-balance sample`);
  }
  const forwardIndices = rootFlows.flatMap((flow, index) =>
    flow > 0 ? [index] : []);
  if (forwardIndices.length === 0) {
    throw new Error(`${armId} requires positive Ao_SA flow`);
  }
  return Object.freeze({
    topologyResistanceMmHgSecPerMl: edge.R,
    resistanceScaleFromTopology,
    effectiveResistanceMmHgSecPerMl: effectiveResistance,
    topologyInertanceMmHgSec2PerMl: edge.L,
    firstSampleBalanceIncluded,
    pressureBalanceSampleCount: admittedResiduals.length,
    maximumAbsolutePressureBalanceResidualMmHg:
      maximum(admittedResiduals.map(Math.abs)),
    peakAbsoluteResistivePressureMmHg:
      maximum(resistivePressures.map(Math.abs)),
    peakAbsoluteInertialPressureMmHg:
      maximum(inertialPressures.map(Math.abs)),
    forwardFlowTimeMeanRootPressureDropMmHg:
      mean(forwardIndices.map((index) => drops[index]!)),
  });
}

function assertFactorialIdentities(
  byId: ReadonlyMap<
    MainWireAorticOutflowLengthDependenceRootResistanceArmIdV1,
    MainWireNormalAdultFiveWallPeriodicResultV1
  >,
): void {
  const canonical = byId.get("canonical")!;
  const length = byId.get("ventricular-length-dependence-low")!;
  const root = byId.get("aortic-root-resistance-high")!;
  const both = byId.get(
    "ventricular-length-dependence-low-plus-aortic-root-resistance-high",
  )!;
  const mechanicsHash = (result: MainWireNormalAdultFiveWallPeriodicResultV1) =>
    result.protocolComponentHashes.mechanicsProviderMetadataStableHash;
  const runtimeHash = (result: MainWireNormalAdultFiveWallPeriodicResultV1) =>
    result.protocolComponentHashes.circulationRuntimeStableHash;
  if (
    mechanicsHash(canonical) !== mechanicsHash(root)
    || mechanicsHash(length) !== mechanicsHash(both)
    || mechanicsHash(canonical) === mechanicsHash(length)
    || runtimeHash(canonical) !== runtimeHash(length)
    || runtimeHash(root) !== runtimeHash(both)
    || runtimeHash(canonical) === runtimeHash(root)
  ) {
    throw new Error(
      "length-dependence/root-resistance protocol identities do not form the fixed factorial",
    );
  }
  const calciumHashes = new Set([...byId.values()].map((result) =>
    result.protocolComponentHashes.calciumDriveFixedParamsStableHash));
  if (calciumHashes.size !== 1) {
    throw new Error(
      "length-dependence/root-resistance factorial changed calcium drive",
    );
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

function backwardDifferences(
  values: readonly number[],
  dtSec: number,
  previousValue: number,
): readonly number[] {
  return Object.freeze(values.map((value, index) =>
    (value - (index === 0 ? previousValue : values[index - 1]!)) / dtSec));
}

function wallRecord<T>(
  build: (wallId: VentricularWallId) => T,
): Readonly<Record<VentricularWallId, T>> {
  return Object.freeze(Object.fromEntries(
    (["LVFW", "SEP", "RVFW"] as const).map((wallId) =>
      [wallId, build(wallId)]),
  )) as Readonly<Record<VentricularWallId, T>>;
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

function mean(values: readonly number[]): number {
  if (values.length === 0) throw new Error("mean requires values");
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function required(value: number | null, label: string): number {
  if (value === null) throw new Error(`${label} was not resolved`);
  return value;
}
