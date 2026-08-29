import {
  type FiveWallNormalCalciumDriveParamsV1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import {
  measureMainWireValveDiseaseCycleMetricsV1,
} from "@/engine/myocardium/diagnostics/MainWireValveDiseaseCycleMetricsV1";
import type {
  MainWireNormalAdultFiveWallPeriodicResultV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";
import {
  initializeLandSlsWallAtFixedInputV1,
} from "@/engine/myocardium/mechanics/landSlsWallMaterialV1";
import {
  createCanonicalMainWireNormalAdultFiveWallProviderV1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";
import {
  NORMAL_ADULT_FIVE_WALL_PRIOR_V1,
} from "@/engine/myocardium/mechanics/normalAdultFiveWallPriorV1";
import {
  solveLand2017BackwardEulerStep,
  type Land2017StepSolveResult,
} from "@/engine/myocardium/myofilament/land2017";

export const MAIN_WIRE_VENTRICULAR_SERIES_ELASTIC_REPLAY_AUDIT_V1_ID =
  "main-wire-ventricular-series-elastic-replay-audit-v1" as const;

export const MAIN_WIRE_VENTRICULAR_SERIES_ELASTIC_PROFILE_IDS_V1 =
  Object.freeze([
    "rigid-direct-coupling",
    "linear-hencky-see-100kpa-at-2p5pct",
    "linear-hencky-see-100kpa-at-5pct",
    "linear-hencky-see-100kpa-at-7p5pct",
    "linear-hencky-see-100kpa-at-10pct",
  ] as const);

export type MainWireVentricularSeriesElasticProfileIdV1 =
  (typeof MAIN_WIRE_VENTRICULAR_SERIES_ELASTIC_PROFILE_IDS_V1)[number];

export type MainWireVentricularSeriesElasticProfileV1 = Readonly<{
  profileId: MainWireVentricularSeriesElasticProfileIdV1;
  referenceStressKPa: 100;
  referenceSeriesExtensionFraction01: number;
  seriesHenckyStiffnessKPa: number | null;
}>;

export const MAIN_WIRE_VENTRICULAR_SERIES_ELASTIC_REPLAY_AUDIT_CLAIM_V1 =
  Object.freeze({
    source: "last-retained-complete-whole-heart-beat" as const,
    wall: "LVFW" as const,
    exactModelStateOrCheckpointChanged: false as const,
    replayFeedsBackIntoMechanicsOrCirculation: false as const,
    activeBranchTopology:
      "Land-contractile-element-in-series-with-tension-only-linear-Hencky-spring" as const,
    passiveAndParallelSlsRemainOnTotalFiberStrainInProposedTopology:
      true as const,
    seriesForceEquilibrium:
      "active-Kirchhoff-stress-equals-series-Hencky-stiffness-times-log-stretch-ratio" as const,
    internalContractileStretchSolvedAlgebraicallyEachBackwardEulerStep:
      true as const,
    previousInternalContractileStretchRequiredForLandRateHistory: true as const,
    referenceExtensionBracket:
      "2.5-to-10-percent-at-100-kPa-hypothesis-screen" as const,
    historicalPapillaryMuscleExtensionContextOnly: Object.freeze({
      species: "cat" as const,
      reportedExtensionRangeFraction01: Object.freeze([0.04, 0.10] as const),
      sourceDois: Object.freeze([
        "10.1152/ajplegacy.1964.207.6.1330",
      ] as const),
      directHumanParameterIdentificationClaimed: false as const,
    }),
    smoothingApplied: false as const,
    interpolationApplied: false as const,
    parameterSearchOrFitting: false as const,
    closedLoopEjectionTimeImprovementEstablished: false as const,
  });

export type MainWireVentricularSeriesElasticReplayArmV1 = Readonly<{
  profile: MainWireVentricularSeriesElasticProfileV1;
  simulatedCycleCount: number;
  converged: boolean;
  maximumLandStateClosureResidual: number;
  internalLogStretchClosureResidual: number;
  maximumLandSolverResidualNorm: number;
  maximumSeriesForceEquilibriumResidualKPa: number;
  tensionClampSampleCount: number;
  peakTransmittedActiveStressKPa: number;
  peakTransmittedActiveStressPhase01: number;
  transmittedActiveStressAtAorticFlowPeakKPa: number;
  transmittedActiveStressAtAorticFlowEndKPa: number;
  positiveTransmittedActiveStressImpulseKPaSec: number;
  durationAboveHalfPeakSec: number;
  localPeakCountAboveFivePercentPeak: number;
  maximumSeriesExtensionFraction01: number;
  seriesExtensionAtAorticFlowPeakFraction01: number;
  seriesExtensionAtAorticFlowEndFraction01: number;
  internalContractileShorteningDuringEjectionFraction01: number;
  totalLandShorteningDuringEjectionFraction01: number;
}>;

export type MainWireVentricularSeriesElasticReplayAuditV1 = Readonly<{
  methodId: typeof MAIN_WIRE_VENTRICULAR_SERIES_ELASTIC_REPLAY_AUDIT_V1_ID;
  source: Readonly<{
    protocolIdentityHash: string;
    beatIndex: number;
    dtSec: number;
    sampleCount: number;
    periodicSteadyStateClaimed: boolean;
    calciumDriveParameterSetId: string;
    mechanicsProviderParameterIdentityHash: string;
    wallMaterialParameterSetId: string;
  }>;
  aorticEjectionEpisode: Readonly<{
    onsetIndex: number;
    peakFlowIndex: number;
    endIndex: number;
    durationSec: number;
  }>;
  arms: readonly MainWireVentricularSeriesElasticReplayArmV1[];
  claim: typeof MAIN_WIRE_VENTRICULAR_SERIES_ELASTIC_REPLAY_AUDIT_CLAIM_V1;
}>;

type SeriesStep = Readonly<{
  nextState: Float64Array;
  nextInternalLogStretch: number;
  transmittedStressKPa: number;
  seriesExtensionFraction01: number;
  forceResidualKPa: number;
  landSolverResidualNorm: number;
  tensionClamped: boolean;
}>;

const MINIMUM_REPLAY_CYCLES = 2;
const MAXIMUM_REPLAY_CYCLES = 20;
const REPLAY_CLOSURE_TOLERANCE = 1e-9;
const ROOT_ITERATIONS = 42;
const REFERENCE_STRESS_KPA = 100 as const;

export function resolveMainWireVentricularSeriesElasticProfileV1(
  profileId: MainWireVentricularSeriesElasticProfileIdV1,
): MainWireVentricularSeriesElasticProfileV1 {
  const referenceSeriesExtensionFraction01 = profileId === "rigid-direct-coupling"
    ? 0
    : profileId === "linear-hencky-see-100kpa-at-2p5pct"
      ? 0.025
      : profileId === "linear-hencky-see-100kpa-at-5pct"
        ? 0.05
        : profileId === "linear-hencky-see-100kpa-at-7p5pct"
          ? 0.075
          : profileId === "linear-hencky-see-100kpa-at-10pct"
            ? 0.10
            : Number.NaN;
  if (!Number.isFinite(referenceSeriesExtensionFraction01)) {
    throw new Error(`unsupported ventricular series elastic profile: ${String(profileId)}`);
  }
  return Object.freeze({
    profileId,
    referenceStressKPa: REFERENCE_STRESS_KPA,
    referenceSeriesExtensionFraction01,
    seriesHenckyStiffnessKPa: referenceSeriesExtensionFraction01 === 0
      ? null
      : REFERENCE_STRESS_KPA / Math.log1p(referenceSeriesExtensionFraction01),
  });
}

export function measureMainWireVentricularSeriesElasticReplayAuditV1(
  result: MainWireNormalAdultFiveWallPeriodicResultV1,
  calciumDriveParams: FiveWallNormalCalciumDriveParamsV1,
): MainWireVentricularSeriesElasticReplayAuditV1 {
  const beat = result.retainedCompleteBeats.at(-1);
  if (beat === undefined || beat.samples.length < 3) {
    throw new Error("series elastic replay requires a retained complete beat");
  }
  if (result.protocolIdentity.calciumDrive.parameterSetId
      !== calciumDriveParams.parameterSetId) {
    throw new Error("series elastic replay calcium protocol identity mismatch");
  }
  const provider = createCanonicalMainWireNormalAdultFiveWallProviderV1();
  if (result.protocolIdentity.mechanicsProvider.parameterIdentityHash
      !== provider.parameterIdentityHash) {
    throw new Error("series elastic replay requires canonical mechanics material");
  }
  const material =
    NORMAL_ADULT_FIVE_WALL_PRIOR_V1.active.ventricularWallMaterial;
  const samples = beat.samples;
  const flow = samples.map((sample) => sample.valveHydraulics.AoV.flowMlPerSec);
  const valve = measureMainWireValveDiseaseCycleMetricsV1(result).valves.AoV;
  const active = flow.map((value) =>
    value > 0 && value >= valve.episodeFlowThresholdMlPerSec);
  const onsetIndex = active.findIndex((value, index) =>
    value && !active[(index - 1 + active.length) % active.length]);
  const activeCount = active.filter(Boolean).length;
  if (onsetIndex < 0 || activeCount === 0 || valve.forwardEpisodeCount !== 1) {
    throw new Error("series elastic replay requires one aortic ejection episode");
  }
  const endIndex = (onsetIndex + activeCount - 1) % samples.length;
  const peakFlowIndex = indexOfMaximum(flow);
  const totalLogStretch = samples.map((sample) =>
    sample.wallFiberLogStrain.LVFW + Math.log(material.landSlackStretch));
  const calciumUM = samples.map((sample) => sample.freeCalciumUM.LVFW);
  const arms = MAIN_WIRE_VENTRICULAR_SERIES_ELASTIC_PROFILE_IDS_V1.map(
    (profileId) => replayProfile(
      resolveMainWireVentricularSeriesElasticProfileV1(profileId),
      totalLogStretch,
      calciumUM,
      samples.map((sample) => sample.cyclePhase01),
      result.dtSec,
      onsetIndex,
      peakFlowIndex,
      endIndex,
    ),
  );
  return Object.freeze({
    methodId: MAIN_WIRE_VENTRICULAR_SERIES_ELASTIC_REPLAY_AUDIT_V1_ID,
    source: Object.freeze({
      protocolIdentityHash: result.protocolIdentityHash,
      beatIndex: beat.beatIndex,
      dtSec: result.dtSec,
      sampleCount: samples.length,
      periodicSteadyStateClaimed: result.periodicSteadyStateClaimed,
      calciumDriveParameterSetId: calciumDriveParams.parameterSetId,
      mechanicsProviderParameterIdentityHash:
        result.protocolIdentity.mechanicsProvider.parameterIdentityHash,
      wallMaterialParameterSetId: material.parameterSetId,
    }),
    aorticEjectionEpisode: Object.freeze({
      onsetIndex,
      peakFlowIndex,
      endIndex,
      durationSec: activeCount * result.dtSec,
    }),
    arms,
    claim: MAIN_WIRE_VENTRICULAR_SERIES_ELASTIC_REPLAY_AUDIT_CLAIM_V1,
  });
}

function replayProfile(
  profile: MainWireVentricularSeriesElasticProfileV1,
  totalLogStretch: readonly number[],
  calciumUM: readonly number[],
  phases01: readonly number[],
  dtSec: number,
  ejectionOnsetIndex: number,
  aorticFlowPeakIndex: number,
  ejectionEndIndex: number,
): MainWireVentricularSeriesElasticReplayArmV1 {
  const material =
    NORMAL_ADULT_FIVE_WALL_PRIOR_V1.active.ventricularWallMaterial;
  const initialTotalLogStretch = totalLogStretch.at(-1)!;
  const initialFiberLogStrain =
    initialTotalLogStretch - Math.log(material.landSlackStretch);
  const cold = initializeLandSlsWallAtFixedInputV1(
    initialFiberLogStrain,
    calciumUM.at(-1)!,
    material,
  );
  if (!cold.converged) {
    throw new Error("series elastic replay cold initialization failed");
  }
  let state = cold.state.landState;
  let previousInternalLogStretch = initialTotalLogStretch;
  let stateClosureResidual = Number.POSITIVE_INFINITY;
  let internalClosureResidual = Number.POSITIVE_INFINITY;
  let simulatedCycleCount = 0;
  let finalSteps: SeriesStep[] = [];
  for (let cycleIndex = 0; cycleIndex < MAXIMUM_REPLAY_CYCLES; cycleIndex += 1) {
    const cycleStartState = Float64Array.from(state);
    const cycleStartInternalLogStretch = previousInternalLogStretch;
    const steps: SeriesStep[] = [];
    for (let index = 0; index < totalLogStretch.length; index += 1) {
      const step = solveSeriesStep(
        state,
        previousInternalLogStretch,
        totalLogStretch[index]!,
        calciumUM[index]!,
        dtSec,
        profile.seriesHenckyStiffnessKPa,
      );
      state = step.nextState;
      previousInternalLogStretch = step.nextInternalLogStretch;
      steps.push(step);
    }
    simulatedCycleCount = cycleIndex + 1;
    stateClosureResidual = maximumArrayDifference(cycleStartState, state);
    internalClosureResidual = Math.abs(
      previousInternalLogStretch - cycleStartInternalLogStretch,
    );
    finalSteps = steps;
    if (
      simulatedCycleCount >= MINIMUM_REPLAY_CYCLES
      && stateClosureResidual <= REPLAY_CLOSURE_TOLERANCE
      && internalClosureResidual <= REPLAY_CLOSURE_TOLERANCE
    ) break;
  }
  const stress = finalSteps.map((step) => step.transmittedStressKPa);
  const seriesExtension = finalSteps.map((step) =>
    step.seriesExtensionFraction01);
  const internalLogStretch = finalSteps.map((step) =>
    step.nextInternalLogStretch);
  const peakStress = maximum(stress);
  const peakStressIndex = indexOfMaximum(stress);
  const onsetInternalStretch = Math.exp(internalLogStretch[ejectionOnsetIndex]!);
  const endInternalStretch = Math.exp(internalLogStretch[ejectionEndIndex]!);
  const onsetTotalStretch = Math.exp(totalLogStretch[ejectionOnsetIndex]!);
  const endTotalStretch = Math.exp(totalLogStretch[ejectionEndIndex]!);
  return Object.freeze({
    profile,
    simulatedCycleCount,
    converged:
      stateClosureResidual <= REPLAY_CLOSURE_TOLERANCE
      && internalClosureResidual <= REPLAY_CLOSURE_TOLERANCE,
    maximumLandStateClosureResidual: stateClosureResidual,
    internalLogStretchClosureResidual: internalClosureResidual,
    maximumLandSolverResidualNorm: maximum(finalSteps.map((step) =>
      step.landSolverResidualNorm)),
    maximumSeriesForceEquilibriumResidualKPa: maximum(finalSteps.map((step) =>
      Math.abs(step.forceResidualKPa))),
    tensionClampSampleCount: finalSteps.filter((step) =>
      step.tensionClamped).length,
    peakTransmittedActiveStressKPa: peakStress,
    peakTransmittedActiveStressPhase01: phases01[peakStressIndex]!,
    transmittedActiveStressAtAorticFlowPeakKPa:
      stress[aorticFlowPeakIndex]!,
    transmittedActiveStressAtAorticFlowEndKPa: stress[ejectionEndIndex]!,
    positiveTransmittedActiveStressImpulseKPaSec:
      stress.reduce((sum, value) => sum + Math.max(0, value) * dtSec, 0),
    durationAboveHalfPeakSec:
      stress.filter((value) => value >= 0.5 * peakStress).length * dtSec,
    localPeakCountAboveFivePercentPeak: countLocalPeaks(stress, 0.05 * peakStress),
    maximumSeriesExtensionFraction01: maximum(seriesExtension),
    seriesExtensionAtAorticFlowPeakFraction01:
      seriesExtension[aorticFlowPeakIndex]!,
    seriesExtensionAtAorticFlowEndFraction01:
      seriesExtension[ejectionEndIndex]!,
    internalContractileShorteningDuringEjectionFraction01:
      (onsetInternalStretch - endInternalStretch) / onsetInternalStretch,
    totalLandShorteningDuringEjectionFraction01:
      (onsetTotalStretch - endTotalStretch) / onsetTotalStretch,
  });
}

function solveSeriesStep(
  previousState: Float64Array,
  previousInternalLogStretch: number,
  totalLogStretch: number,
  freeCalciumUM: number,
  dtSec: number,
  seriesHenckyStiffnessKPa: number | null,
): SeriesStep {
  const upper = evaluateAtInternalLogStretch(
    previousState,
    previousInternalLogStretch,
    totalLogStretch,
    freeCalciumUM,
    dtSec,
    totalLogStretch,
    seriesHenckyStiffnessKPa,
  );
  if (seriesHenckyStiffnessKPa === null) {
    return Object.freeze({
      nextState: upper.solved.nextState,
      nextInternalLogStretch: totalLogStretch,
      transmittedStressKPa: upper.activeStressKPa,
      seriesExtensionFraction01: 0,
      forceResidualKPa: upper.forceResidualKPa,
      landSolverResidualNorm: upper.solved.residualNorm,
      tensionClamped: false,
    });
  }
  if (upper.activeStressKPa <= 0) {
    return Object.freeze({
      nextState: upper.solved.nextState,
      nextInternalLogStretch: totalLogStretch,
      transmittedStressKPa: 0,
      seriesExtensionFraction01: 0,
      forceResidualKPa: upper.activeStressKPa,
      landSolverResidualNorm: upper.solved.residualNorm,
      tensionClamped: true,
    });
  }
  let lowerLogStretch = totalLogStretch - Math.log1p(0.15);
  let lower = evaluateAtInternalLogStretch(
    previousState,
    previousInternalLogStretch,
    lowerLogStretch,
    freeCalciumUM,
    dtSec,
    totalLogStretch,
    seriesHenckyStiffnessKPa,
  );
  while (lower.forceResidualKPa > 0) {
    const extensionFraction = Math.expm1(totalLogStretch - lowerLogStretch);
    if (extensionFraction >= 0.50) {
      throw new Error("series elastic force root exceeds 50 percent extension");
    }
    lowerLogStretch = totalLogStretch - Math.log1p(
      Math.min(0.50, extensionFraction * 1.5),
    );
    lower = evaluateAtInternalLogStretch(
      previousState,
      previousInternalLogStretch,
      lowerLogStretch,
      freeCalciumUM,
      dtSec,
      totalLogStretch,
      seriesHenckyStiffnessKPa,
    );
  }
  let lowerBound = lowerLogStretch;
  let upperBound = totalLogStretch;
  let accepted = upper;
  for (let iteration = 0; iteration < ROOT_ITERATIONS; iteration += 1) {
    const midpoint = 0.5 * (lowerBound + upperBound);
    const candidate = evaluateAtInternalLogStretch(
      previousState,
      previousInternalLogStretch,
      midpoint,
      freeCalciumUM,
      dtSec,
      totalLogStretch,
      seriesHenckyStiffnessKPa,
    );
    accepted = candidate;
    if (candidate.forceResidualKPa > 0) upperBound = midpoint;
    else lowerBound = midpoint;
  }
  const seriesHenckyStrain = totalLogStretch - accepted.internalLogStretch;
  return Object.freeze({
    nextState: accepted.solved.nextState,
    nextInternalLogStretch: accepted.internalLogStretch,
    transmittedStressKPa: seriesHenckyStiffnessKPa * seriesHenckyStrain,
    seriesExtensionFraction01: Math.expm1(seriesHenckyStrain),
    forceResidualKPa: accepted.forceResidualKPa,
    landSolverResidualNorm: accepted.solved.residualNorm,
    tensionClamped: false,
  });
}

type EvaluatedSeriesRoot = Readonly<{
  solved: Land2017StepSolveResult;
  internalLogStretch: number;
  activeStressKPa: number;
  forceResidualKPa: number;
}>;

function evaluateAtInternalLogStretch(
  previousState: Float64Array,
  previousInternalLogStretch: number,
  internalLogStretch: number,
  freeCalciumUM: number,
  dtSec: number,
  totalLogStretch: number,
  seriesHenckyStiffnessKPa: number | null,
): EvaluatedSeriesRoot {
  const material =
    NORMAL_ADULT_FIVE_WALL_PRIOR_V1.active.ventricularWallMaterial;
  const solved = solveLand2017BackwardEulerStep(
    previousState,
    {
      freeCalciumUM,
      previousFiberEngineeringStrain: Math.expm1(previousInternalLogStretch),
      stageFiberEngineeringStrain: Math.expm1(internalLogStretch),
      dtSec,
      stage: { scheme: "BE", stageIndex: 0 },
    },
    {
      maxIterations: 20,
      residualTolerance: 1e-9,
      lineSearchMinStep: 1 / 4096,
    },
    material.landEquationParameters,
  );
  if (!solved.ok || solved.output === undefined) {
    throw new Error(
      `series elastic Land solve failed: ${solved.failureReason ?? "unknown"}`,
    );
  }
  const activeStressKPa = Math.exp(internalLogStretch)
    * material.orientationFraction01
    * material.viableActiveFraction01
    * solved.output.sourceActiveFiberStressPa
    / 1000;
  const seriesStressKPa = seriesHenckyStiffnessKPa === null
    ? activeStressKPa
    : seriesHenckyStiffnessKPa * (totalLogStretch - internalLogStretch);
  return Object.freeze({
    solved,
    internalLogStretch,
    activeStressKPa,
    forceResidualKPa: activeStressKPa - seriesStressKPa,
  });
}

function countLocalPeaks(values: readonly number[], threshold: number): number {
  let count = 0;
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index]!;
    if (
      value >= threshold
      && value > values[(index - 1 + values.length) % values.length]!
      && value > values[(index + 1) % values.length]!
    ) count += 1;
  }
  return count;
}

function maximum(values: readonly number[]): number {
  return values.reduce((result, value) => Math.max(result, value),
    Number.NEGATIVE_INFINITY);
}

function indexOfMaximum(values: readonly number[]): number {
  let index = 0;
  for (let candidate = 1; candidate < values.length; candidate += 1) {
    if (values[candidate]! > values[index]!) index = candidate;
  }
  return index;
}

function maximumArrayDifference(first: ArrayLike<number>, second: ArrayLike<number>): number {
  if (first.length !== second.length) throw new Error("state length mismatch");
  let maximumDifference = 0;
  for (let index = 0; index < first.length; index += 1) {
    maximumDifference = Math.max(
      maximumDifference,
      Math.abs(first[index]! - second[index]!),
    );
  }
  return maximumDifference;
}
