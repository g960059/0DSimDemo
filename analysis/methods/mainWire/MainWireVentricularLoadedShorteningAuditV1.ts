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
  type LandSlsWallMaterialParamsV1,
} from "@/engine/myocardium/mechanics/landSlsWallMaterialV1";
import {
  createCanonicalMainWireNormalAdultFiveWallProviderV1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";
import {
  NORMAL_ADULT_FIVE_WALL_PRIOR_V1,
} from "@/engine/myocardium/mechanics/normalAdultFiveWallPriorV1";
import {
  LAND2017_STATE_INDEX,
  solveLand2017BackwardEulerStep,
} from "@/engine/myocardium/myofilament/land2017";

export const MAIN_WIRE_VENTRICULAR_LOADED_SHORTENING_AUDIT_V1_ID =
  "main-wire-ventricular-loaded-shortening-audit-v1" as const;

export const MAIN_WIRE_VENTRICULAR_LOADED_SHORTENING_AUDIT_CLAIM_V1 =
  Object.freeze({
    source: "last-retained-complete-whole-heart-beat" as const,
    exactModelStateOrCheckpointChanged: false as const,
    replayFeedsBackIntoMechanicsOrCirculation: false as const,
    replayIntegration:
      "one-backward-Euler-Land-step-per-accepted-whole-heart-sample" as const,
    fullKinematicsReplay:
      "prescribed-accepted-calcium-and-fiber-strain-history" as const,
    distortionSuppressedReplay:
      "same-calcium-and-length-history-with-zeta-drive-rate-set-to-zero" as const,
    fixedAtEjectionOnsetReplay:
      "same-calcium-with-length-fixed-at-aortic-flow-onset" as const,
    distortionSuppressedReplayIsProposedModel: false as const,
    lengthDependenceRetainedInBothReplays: true as const,
    activeStressConversion:
      "land-stretch-times-orientation-times-viability-times-source-nominal-stress" as const,
    aorticEjectionEpisode:
      "one-percent-peak-or-one-mL-per-second-threshold" as const,
    smoothingApplied: false as const,
    interpolationApplied: false as const,
    parameterSearchOrFitting: false as const,
  });

export const MAIN_WIRE_VENTRICULAR_LOADED_SHORTENING_AUDIT_WALL_IDS_V1 =
  Object.freeze(["LVFW", "SEP", "RVFW"] as const);
export type MainWireVentricularLoadedShorteningAuditWallIdV1 =
  (typeof MAIN_WIRE_VENTRICULAR_LOADED_SHORTENING_AUDIT_WALL_IDS_V1)[number];

export type MainWireVentricularLoadedShorteningReplayMetricsV1 = Readonly<{
  simulatedCycleCount: number;
  maximumLandStateClosureResidual: number;
  converged: boolean;
  peakActiveStressKPa: number;
  peakActiveStressPhase01: number;
  positiveActiveStressCycleIntegralKPaSec: number;
  activeStressAtAorticFlowPeakKPa: number;
  localPeakCountAboveFivePercentPeak: number;
  minimumZetaW: number;
  maximumZetaW: number;
  minimumZetaS: number;
  maximumZetaS: number;
  maximumLandSolverResidualNorm: number;
}>;

export type MainWireVentricularLoadedShorteningWallAuditV1 = Readonly<{
  wallId: MainWireVentricularLoadedShorteningAuditWallIdV1;
  strainHistory: Readonly<{
    minimumLandStretch: number;
    maximumLandStretch: number;
    landStretchAtAorticFlowOnset: number;
    landStretchAtAorticFlowPeak: number;
    landStretchAtAorticFlowEnd: number;
    netEjectionShortening: number;
    meanEjectionShorteningRatePerSec: number;
    maximumEjectionShorteningRatePerSec: number;
  }>;
  recordedWholeHeart: Readonly<{
    peakActiveStressKPa: number;
    peakActiveStressPhase01: number;
    positiveActiveStressCycleIntegralKPaSec: number;
    activeStressAtAorticFlowPeakKPa: number;
    localPeakCountAboveFivePercentPeak: number;
  }>;
  fullKinematicsReplay: MainWireVentricularLoadedShorteningReplayMetricsV1;
  distortionSuppressedReplay:
    MainWireVentricularLoadedShorteningReplayMetricsV1;
  fixedAtEjectionOnsetReplay:
    MainWireVentricularLoadedShorteningReplayMetricsV1;
  replayConsistency: Readonly<{
    maximumAbsoluteRecordedVsFullReplayStressResidualKPa: number;
    maximumRelativeRecordedVsFullReplayStressResidual: number;
  }>;
  distortionContribution: Readonly<{
    loadedPeakStressFractionOfDistortionSuppressedReplay: number;
    loadedStressImpulseFractionOfDistortionSuppressedReplay: number;
    loadedStressAtAorticFlowPeakFractionOfDistortionSuppressedReplay: number;
    distortionSuppressionPeakTimingShiftSec: number;
  }>;
  dynamicLengthContribution: Readonly<{
    distortionFreeDynamicLengthPeakStressFractionOfFixedOnsetLength: number;
    distortionFreeDynamicLengthStressImpulseFractionOfFixedOnsetLength: number;
    distortionFreeDynamicLengthStressAtAorticFlowPeakFractionOfFixedOnsetLength:
      number;
    dynamicLengthPeakTimingShiftSec: number;
  }>;
  totalShorteningHistoryContribution: Readonly<{
    loadedPeakStressFractionOfFixedOnsetLength: number;
    loadedStressImpulseFractionOfFixedOnsetLength: number;
    loadedStressAtAorticFlowPeakFractionOfFixedOnsetLength: number;
  }>;
}>;

export type MainWireVentricularLoadedShorteningAuditV1 = Readonly<{
  methodId: typeof MAIN_WIRE_VENTRICULAR_LOADED_SHORTENING_AUDIT_V1_ID;
  source: Readonly<{
    protocolIdentityHash: string;
    beatIndex: number;
    dtSec: number;
    sampleCount: number;
    periodicSteadyStateClaimed: boolean;
    calciumDriveParameterSetId: string;
    mechanicsProviderParameterIdentityHash: string;
  }>;
  aorticEjectionEpisode: Readonly<{
    flowThresholdMlPerSec: number;
    onsetPhase01: number;
    peakPhase01: number;
    endPhase01: number;
    durationSec: number;
  }>;
  walls: Readonly<Record<
    MainWireVentricularLoadedShorteningAuditWallIdV1,
    MainWireVentricularLoadedShorteningWallAuditV1
  >>;
  claim: typeof MAIN_WIRE_VENTRICULAR_LOADED_SHORTENING_AUDIT_CLAIM_V1;
}>;

type ReplayMode = "full-kinematics" | "distortion-drive-suppressed";
type ReplayTrace = Readonly<{
  metrics: MainWireVentricularLoadedShorteningReplayMetricsV1;
  activeStressKPa: readonly number[];
}>;

const MINIMUM_REPLAY_CYCLES = 2;
const MAXIMUM_REPLAY_CYCLES = 20;
const REPLAY_P1_TOLERANCE = 1e-9;

export function measureMainWireVentricularLoadedShorteningAuditV1(
  result: MainWireNormalAdultFiveWallPeriodicResultV1,
  calciumDriveParams: FiveWallNormalCalciumDriveParamsV1,
): MainWireVentricularLoadedShorteningAuditV1 {
  const beat = result.retainedCompleteBeats.at(-1);
  if (beat === undefined || beat.samples.length < 3) {
    throw new Error("loaded shortening audit requires a retained complete beat");
  }
  if (
    result.protocolIdentity.calciumDrive.parameterSetId
    !== calciumDriveParams.parameterSetId
  ) {
    throw new Error("loaded shortening audit calcium protocol identity mismatch");
  }
  const canonicalProvider =
    createCanonicalMainWireNormalAdultFiveWallProviderV1();
  if (
    result.protocolIdentity.mechanicsProvider.parameterIdentityHash
    !== canonicalProvider.parameterIdentityHash
  ) {
    throw new Error(
      "loaded shortening audit V1 requires the canonical mechanics provider",
    );
  }
  const samples = beat.samples;
  const valve = measureMainWireValveDiseaseCycleMetricsV1(result).valves.AoV;
  const flows = samples.map((sample) => sample.valveHydraulics.AoV.flowMlPerSec);
  const ejectionMask = flows.map((flow) =>
    flow > 0 && flow >= valve.episodeFlowThresholdMlPerSec);
  const onsetIndex = ejectionMask.findIndex((active, index) =>
    active && !ejectionMask[(index - 1 + ejectionMask.length) % ejectionMask.length]);
  const ejectionSampleCount = ejectionMask.filter(Boolean).length;
  if (onsetIndex < 0 || ejectionSampleCount === 0 || valve.forwardEpisodeCount !== 1) {
    throw new Error("loaded shortening audit requires one aortic ejection episode");
  }
  const endIndex = cyclicIndex(
    onsetIndex + ejectionSampleCount - 1,
    samples.length,
  );
  const peakFlowIndex = indexOfMaximum(flows);
  const material =
    NORMAL_ADULT_FIVE_WALL_PRIOR_V1.active.ventricularWallMaterial;
  const walls = wallRecord((wallId) => {
    const fiberLogStrains = samples.map((sample) =>
      sample.wallFiberLogStrain[wallId]);
    const calciumUM = samples.map((sample) => sample.freeCalciumUM[wallId]);
    const recordedStressKPa = samples.map((sample) =>
      sample.wallStressPa[wallId].active / 1000);
    const landStretches = fiberLogStrains.map((fiberLogStrain) =>
      Math.exp(fiberLogStrain) * material.landSlackStretch);
    const previousFiberLogStrain = result.retainedCompleteBeats.at(-2)
      ?.samples.at(-1)?.wallFiberLogStrain[wallId]
      ?? fiberLogStrains.at(-1)!;
    const previousLandStretch =
      Math.exp(previousFiberLogStrain) * material.landSlackStretch;
    const stretchRates = backwardDifferences(
      landStretches,
      result.dtSec,
      previousLandStretch,
    );
    const ejectionIndices = Array.from(
      { length: ejectionSampleCount },
      (_, offset) => cyclicIndex(onsetIndex + offset, samples.length),
    );
    const full = replayLandTrajectory(
      fiberLogStrains,
      calciumUM,
      result.dtSec,
      peakFlowIndex,
      material,
      "full-kinematics",
    );
    const suppressed = replayLandTrajectory(
      fiberLogStrains,
      calciumUM,
      result.dtSec,
      peakFlowIndex,
      material,
      "distortion-drive-suppressed",
    );
    const fixedAtOnset = replayLandTrajectory(
      fiberLogStrains.map(() => fiberLogStrains[onsetIndex]!),
      calciumUM,
      result.dtSec,
      peakFlowIndex,
      material,
      "distortion-drive-suppressed",
    );
    const recorded = traceMetrics(
      recordedStressKPa,
      samples.map((sample) => sample.cyclePhase01),
      result.dtSec,
      peakFlowIndex,
    );
    const maximumAbsoluteReplayResidual = maximum(recordedStressKPa.map(
      (stress, index) => Math.abs(stress - full.activeStressKPa[index]!),
    ));
    const maximumRecordedMagnitude = maximum(recordedStressKPa.map(Math.abs));
    return Object.freeze({
      wallId,
      strainHistory: Object.freeze({
        minimumLandStretch: minimum(landStretches),
        maximumLandStretch: maximum(landStretches),
        landStretchAtAorticFlowOnset: landStretches[onsetIndex]!,
        landStretchAtAorticFlowPeak: landStretches[peakFlowIndex]!,
        landStretchAtAorticFlowEnd: landStretches[endIndex]!,
        netEjectionShortening:
          landStretches[onsetIndex]! - landStretches[endIndex]!,
        meanEjectionShorteningRatePerSec:
          (landStretches[onsetIndex]! - landStretches[endIndex]!)
          / (ejectionSampleCount * result.dtSec),
        maximumEjectionShorteningRatePerSec: Math.max(
          0,
          ...ejectionIndices.map((index) => -stretchRates[index]!),
        ),
      }),
      recordedWholeHeart: recorded,
      fullKinematicsReplay: full.metrics,
      distortionSuppressedReplay: suppressed.metrics,
      fixedAtEjectionOnsetReplay: fixedAtOnset.metrics,
      replayConsistency: Object.freeze({
        maximumAbsoluteRecordedVsFullReplayStressResidualKPa:
          maximumAbsoluteReplayResidual,
        maximumRelativeRecordedVsFullReplayStressResidual:
          maximumAbsoluteReplayResidual / Math.max(maximumRecordedMagnitude, 1e-12),
      }),
      distortionContribution: Object.freeze({
        loadedPeakStressFractionOfDistortionSuppressedReplay:
          full.metrics.peakActiveStressKPa
          / suppressed.metrics.peakActiveStressKPa,
        loadedStressImpulseFractionOfDistortionSuppressedReplay:
          full.metrics.positiveActiveStressCycleIntegralKPaSec
          / suppressed.metrics.positiveActiveStressCycleIntegralKPaSec,
        loadedStressAtAorticFlowPeakFractionOfDistortionSuppressedReplay:
          full.metrics.activeStressAtAorticFlowPeakKPa
          / suppressed.metrics.activeStressAtAorticFlowPeakKPa,
        distortionSuppressionPeakTimingShiftSec: signedPhaseDifference01(
          suppressed.metrics.peakActiveStressPhase01
          - full.metrics.peakActiveStressPhase01,
        ) * calciumDriveParams.cycleLengthSec,
      }),
      dynamicLengthContribution: Object.freeze({
        distortionFreeDynamicLengthPeakStressFractionOfFixedOnsetLength:
          suppressed.metrics.peakActiveStressKPa
          / fixedAtOnset.metrics.peakActiveStressKPa,
        distortionFreeDynamicLengthStressImpulseFractionOfFixedOnsetLength:
          suppressed.metrics.positiveActiveStressCycleIntegralKPaSec
          / fixedAtOnset.metrics.positiveActiveStressCycleIntegralKPaSec,
        distortionFreeDynamicLengthStressAtAorticFlowPeakFractionOfFixedOnsetLength:
          suppressed.metrics.activeStressAtAorticFlowPeakKPa
          / fixedAtOnset.metrics.activeStressAtAorticFlowPeakKPa,
        dynamicLengthPeakTimingShiftSec: signedPhaseDifference01(
          suppressed.metrics.peakActiveStressPhase01
          - fixedAtOnset.metrics.peakActiveStressPhase01,
        ) * calciumDriveParams.cycleLengthSec,
      }),
      totalShorteningHistoryContribution: Object.freeze({
        loadedPeakStressFractionOfFixedOnsetLength:
          full.metrics.peakActiveStressKPa
          / fixedAtOnset.metrics.peakActiveStressKPa,
        loadedStressImpulseFractionOfFixedOnsetLength:
          full.metrics.positiveActiveStressCycleIntegralKPaSec
          / fixedAtOnset.metrics.positiveActiveStressCycleIntegralKPaSec,
        loadedStressAtAorticFlowPeakFractionOfFixedOnsetLength:
          full.metrics.activeStressAtAorticFlowPeakKPa
          / fixedAtOnset.metrics.activeStressAtAorticFlowPeakKPa,
      }),
    });
  });
  return Object.freeze({
    methodId: MAIN_WIRE_VENTRICULAR_LOADED_SHORTENING_AUDIT_V1_ID,
    source: Object.freeze({
      protocolIdentityHash: result.protocolIdentityHash,
      beatIndex: beat.beatIndex,
      dtSec: result.dtSec,
      sampleCount: samples.length,
      periodicSteadyStateClaimed: result.periodicSteadyStateClaimed,
      calciumDriveParameterSetId: calciumDriveParams.parameterSetId,
      mechanicsProviderParameterIdentityHash:
        result.protocolIdentity.mechanicsProvider.parameterIdentityHash,
    }),
    aorticEjectionEpisode: Object.freeze({
      flowThresholdMlPerSec: valve.episodeFlowThresholdMlPerSec,
      onsetPhase01: samples[onsetIndex]!.cyclePhase01,
      peakPhase01: samples[peakFlowIndex]!.cyclePhase01,
      endPhase01: samples[endIndex]!.cyclePhase01,
      durationSec: ejectionSampleCount * result.dtSec,
    }),
    walls,
    claim: MAIN_WIRE_VENTRICULAR_LOADED_SHORTENING_AUDIT_CLAIM_V1,
  });
}

function replayLandTrajectory(
  fiberLogStrains: readonly number[],
  calciumUM: readonly number[],
  dtSec: number,
  aorticFlowPeakIndex: number,
  material: LandSlsWallMaterialParamsV1,
  mode: ReplayMode,
): ReplayTrace {
  const initialFiberLogStrain = fiberLogStrains.at(-1)!;
  const cold = initializeLandSlsWallAtFixedInputV1(
    initialFiberLogStrain,
    calciumUM.at(-1)!,
    material,
  );
  if (!cold.converged) {
    throw new Error("loaded shortening replay cold initialization failed");
  }
  let state = cold.state.landState;
  let closureResidual = Number.POSITIVE_INFINITY;
  let simulatedCycleCount = 0;
  let finalStressKPa: number[] = [];
  let finalZetaW: number[] = [];
  let finalZetaS: number[] = [];
  let maximumLandSolverResidualNorm = 0;
  for (let cycleIndex = 0; cycleIndex < MAXIMUM_REPLAY_CYCLES; cycleIndex += 1) {
    const cycleStartState = Float64Array.from(state);
    const stressKPa: number[] = [];
    const zetaW: number[] = [];
    const zetaS: number[] = [];
    let previousEngineeringStrain =
      Math.exp(initialFiberLogStrain) * material.landSlackStretch - 1;
    let cycleMaximumSolverResidual = 0;
    for (let index = 0; index < fiberLogStrains.length; index += 1) {
      const landStretch =
        Math.exp(fiberLogStrains[index]!) * material.landSlackStretch;
      const nextEngineeringStrain = landStretch - 1;
      const solved = solveLand2017BackwardEulerStep(
        state,
        {
          freeCalciumUM: calciumUM[index]!,
          previousFiberEngineeringStrain: previousEngineeringStrain,
          stageFiberEngineeringStrain: nextEngineeringStrain,
          ...(mode === "distortion-drive-suppressed"
            ? { stageZetaDriveFiberEngineeringStrainRatePerSec: 0 }
            : {}),
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
          `loaded shortening ${mode} replay failed: ${solved.failureReason ?? "unknown"}`,
        );
      }
      state = solved.nextState;
      previousEngineeringStrain = nextEngineeringStrain;
      stressKPa.push(
        landStretch
        * material.orientationFraction01
        * material.viableActiveFraction01
        * solved.output.sourceActiveFiberStressPa
        / 1000,
      );
      zetaW.push(state[LAND2017_STATE_INDEX.zetaW]!);
      zetaS.push(state[LAND2017_STATE_INDEX.zetaS]!);
      cycleMaximumSolverResidual = Math.max(
        cycleMaximumSolverResidual,
        solved.residualNorm,
      );
    }
    simulatedCycleCount = cycleIndex + 1;
    closureResidual = maximumArrayDifference(cycleStartState, state);
    finalStressKPa = stressKPa;
    finalZetaW = zetaW;
    finalZetaS = zetaS;
    maximumLandSolverResidualNorm = cycleMaximumSolverResidual;
    if (
      simulatedCycleCount >= MINIMUM_REPLAY_CYCLES
      && closureResidual <= REPLAY_P1_TOLERANCE
    ) break;
  }
  const phases = fiberLogStrains.map((_, index) =>
    positiveModulo01((index + 1) / fiberLogStrains.length));
  return Object.freeze({
    metrics: Object.freeze({
      ...traceMetrics(
        finalStressKPa,
        phases,
        dtSec,
        aorticFlowPeakIndex,
      ),
      simulatedCycleCount,
      maximumLandStateClosureResidual: closureResidual,
      converged: closureResidual <= REPLAY_P1_TOLERANCE,
      minimumZetaW: minimum(finalZetaW),
      maximumZetaW: maximum(finalZetaW),
      minimumZetaS: minimum(finalZetaS),
      maximumZetaS: maximum(finalZetaS),
      maximumLandSolverResidualNorm,
    }),
    activeStressKPa: Object.freeze(finalStressKPa),
  });
}

function traceMetrics(
  activeStressKPa: readonly number[],
  phases01: readonly number[],
  dtSec: number,
  aorticFlowPeakIndex: number,
): MainWireVentricularLoadedShorteningReplayMetricsV1 extends infer Replay
  ? Omit<Replay, "simulatedCycleCount" | "maximumLandStateClosureResidual"
    | "converged" | "minimumZetaW" | "maximumZetaW" | "minimumZetaS"
    | "maximumZetaS" | "maximumLandSolverResidualNorm">
  : never {
  const peak = maximum(activeStressKPa);
  const peakIndex = indexOfMaximum(activeStressKPa);
  return Object.freeze({
    peakActiveStressKPa: peak,
    peakActiveStressPhase01: phases01[peakIndex]!,
    positiveActiveStressCycleIntegralKPaSec:
      activeStressKPa.reduce((sum, value) => sum + Math.max(0, value) * dtSec, 0),
    activeStressAtAorticFlowPeakKPa: activeStressKPa[aorticFlowPeakIndex]!,
    localPeakCountAboveFivePercentPeak:
      countStrictCyclicLocalMaxima(activeStressKPa, 0.05 * peak),
  });
}

function backwardDifferences(
  values: readonly number[],
  dtSec: number,
  precedingValue: number,
): readonly number[] {
  return Object.freeze(values.map((value, index) =>
    (value - (index === 0 ? precedingValue : values[index - 1]!)) / dtSec));
}

function countStrictCyclicLocalMaxima(
  values: readonly number[],
  threshold: number,
): number {
  return values.filter((value, index) =>
    value >= threshold
    && value > values[cyclicIndex(index - 1, values.length)]!
    && value > values[cyclicIndex(index + 1, values.length)]!).length;
}

function maximumArrayDifference(
  first: ArrayLike<number>,
  second: ArrayLike<number>,
): number {
  if (first.length !== second.length) {
    throw new Error("Land replay state lengths differ");
  }
  let result = 0;
  for (let index = 0; index < first.length; index += 1) {
    result = Math.max(result, Math.abs(first[index]! - second[index]!));
  }
  return result;
}

function wallRecord<T>(
  build: (wallId: MainWireVentricularLoadedShorteningAuditWallIdV1) => T,
): Readonly<Record<MainWireVentricularLoadedShorteningAuditWallIdV1, T>> {
  return Object.freeze(Object.fromEntries(
    MAIN_WIRE_VENTRICULAR_LOADED_SHORTENING_AUDIT_WALL_IDS_V1.map(
      (wallId) => [wallId, build(wallId)],
    ),
  )) as Readonly<Record<
    MainWireVentricularLoadedShorteningAuditWallIdV1,
    T
  >>;
}

function cyclicIndex(index: number, count: number): number {
  const result = index % count;
  return result < 0 ? result + count : result;
}

function positiveModulo01(value: number): number {
  const result = value % 1;
  return result < 0 ? result + 1 : result;
}

function signedPhaseDifference01(value: number): number {
  return positiveModulo01(value + 0.5) - 0.5;
}

function indexOfMaximum(values: readonly number[]): number {
  let result = 0;
  for (let index = 1; index < values.length; index += 1) {
    if (values[index]! > values[result]!) result = index;
  }
  return result;
}

function maximum(values: readonly number[]): number {
  let result = Number.NEGATIVE_INFINITY;
  for (const value of values) result = Math.max(result, value);
  return result;
}

function minimum(values: readonly number[]): number {
  let result = Number.POSITIVE_INFINITY;
  for (const value of values) result = Math.min(result, value);
  return result;
}
