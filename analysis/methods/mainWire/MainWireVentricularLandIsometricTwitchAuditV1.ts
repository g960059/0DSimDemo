import {
  FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
  FIVE_WALL_NORMAL_CALCIUM_DRIVE_PROVENANCE_V1,
  evaluateFiveWallNormalCalciumDriveV1,
  type FiveWallNormalCalciumDriveParamsV1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import {
  initializeLandSlsWallAtFixedInputV1,
  trialLandSlsWallMaterialV1,
  type LandSlsWallMaterialParamsV1,
  type LandSlsWallMaterialStateV1,
} from "@/engine/myocardium/mechanics/landSlsWallMaterialV1";
import {
  NORMAL_ADULT_FIVE_WALL_PRIOR_V1,
} from "@/engine/myocardium/mechanics/normalAdultFiveWallPriorV1";

export const MAIN_WIRE_VENTRICULAR_LAND_ISOMETRIC_TWITCH_AUDIT_V1_ID =
  "main-wire-ventricular-land-isometric-twitch-audit-v1" as const;

export const MAIN_WIRE_VENTRICULAR_LAND_ISOMETRIC_TWITCH_AUDIT_CLAIM_V1 =
  Object.freeze({
    role: "offline-fixed-length-calcium-to-Land-audit" as const,
    exactModelStateOrCheckpointChanged: false as const,
    aorticValveOrCirculationUsed: false as const,
    externalSeriesElasticElementUsed: false as const,
    passiveStressIncludedInTwitchMetrics: false as const,
    parallelSlsStressIncludedInTwitchMetrics: false as const,
    activeMetricStress:
      "Land-active-Kirchhoff-stress-above-cycle-minimum" as const,
    periodicProtocol:
      "cold-fixed-input-initialization-followed-by-whole-cycle-P1-closure" as const,
    integration: "one-backward-Euler-Land-step-per-sample" as const,
    thresholdTiming:
      "piecewise-linear-crossing-between-accepted-end-step-samples" as const,
    peakTiming: "accepted-end-step-maximum-without-smoothing" as const,
    localPeakThreshold:
      "strict-local-maximum-above-five-percent-of-cycle-amplitude" as const,
    sourceTraceReproductionClaimed: false as const,
    parameterSearchOrFitting: false as const,
    hemodynamicOutcomeUsed: false as const,
  });

export type MainWireVentricularLandIsometricTwitchAuditPolicyV1 = Readonly<{
  dtSec: number;
  fixedLandStretch: number;
  minimumCycleCount: number;
  maximumCycleCount: number;
  p1StateClosureTolerance: number;
}>;

export const MAIN_WIRE_VENTRICULAR_LAND_ISOMETRIC_TWITCH_AUDIT_POLICY_V1 =
  Object.freeze({
    dtSec: 0.001,
    fixedLandStretch: 1,
    minimumCycleCount: 2,
    maximumCycleCount: 20,
    p1StateClosureTolerance: 1e-9,
  } satisfies MainWireVentricularLandIsometricTwitchAuditPolicyV1);

export type MainWireIsometricTransientMetricsV1 = Readonly<{
  minimum: number;
  maximum: number;
  amplitude: number;
  timeToPeakSec: number;
  relaxationTime50Sec: number | null;
  relaxationTime90Sec: number | null;
  relaxationTime95Sec: number | null;
  durationAboveHalfMaximumSec: number | null;
  localPeakCountAboveFivePercentAmplitude: number;
}>;

export type MainWireVentricularLandIsometricTwitchAuditV1 = Readonly<{
  methodId: typeof MAIN_WIRE_VENTRICULAR_LAND_ISOMETRIC_TWITCH_AUDIT_V1_ID;
  identities: Readonly<{
    calciumDriveParameterSetId: string;
    wallMaterialParameterSetId: string;
    landEquationParameterSetId: string;
    landEquationParameterSetStableHash: string;
  }>;
  protocol: Readonly<{
    cycleLengthSec: number;
    dtSec: number;
    sampleCount: number;
    fixedLandStretch: number;
    fixedFiberLogStrain: number;
    ventricularElectricalToCalciumDelaySec: number;
    minimumCycleCount: number;
    maximumCycleCount: number;
    p1StateClosureTolerance: number;
  }>;
  periodicClosure: Readonly<{
    coldFixedInputConverged: boolean;
    coldFixedInputIterations: number;
    simulatedCycleCount: number;
    maximumLandStateClosureResidual: number;
    converged: boolean;
  }>;
  calcium: MainWireIsometricTransientMetricsV1;
  activeTwitch: MainWireIsometricTransientMetricsV1 & Readonly<{
    minimumKPa: number;
    peakKPa: number;
    amplitudeKPa: number;
  }>;
  numericalHealth: Readonly<{
    maximumLandSolverIterations: number;
    maximumLandSolverResidualNorm: number;
    maximumAbsoluteParallelSlsOverstressPa: number;
    minimumLandPopulation: number;
    maximumLandStateConservationResidual: number;
    everyStepValid: true;
  }>;
  sourceContext: Readonly<{
    doi: string;
    sourceCalciumInput: string;
    sourceRestingExtensionRatio: number;
    currentCalciumInputIsDigitizedSourceTrace: false;
    targetTimeToPeakRangeSec: readonly [number, number];
    targetRelaxationTime50RangeSec: readonly [number, number];
    targetRelaxationTime95RangeSec: readonly [number, number];
    publishedFinalModel: Readonly<{
      timeToPeakSec: number;
      relaxationTime50Sec: number;
      relaxationTime95Sec: number;
      peakTensionKPa: number;
      minimumTensionKPa: number;
    }>;
    directionalScreenOnly: Readonly<{
      fixedStretchMatchesSourceRestingExtensionRatio: boolean;
      timeToPeakWithinTargetRange: boolean;
      relaxationTime50WithinTargetRange: boolean;
      relaxationTime95WithinTargetRange: boolean;
      peakTensionAtLeastSourceCostFloor: boolean;
      everyTimingTargetMet: boolean;
      eligibleForSourceTraceReproductionClaim: false;
    }>;
  }>;
  claim: typeof MAIN_WIRE_VENTRICULAR_LAND_ISOMETRIC_TWITCH_AUDIT_CLAIM_V1;
}>;

type Sample = Readonly<{
  timeSec: number;
  calciumUM: number;
  activeKirchhoffStressKPa: number;
}>;

const ZERO_PASSIVE_INPUT = Object.freeze({
  stressPa: 0,
  // The wall-material contract requires a positive equilibrium tangent even
  // though this fixed-length audit consumes active stress only.
  tangentPa: 1,
  storedEnergyDensityJPerM3: 0,
});

export function measureMainWireVentricularLandIsometricTwitchAuditV1(
  calciumDriveParams: FiveWallNormalCalciumDriveParamsV1 =
    FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
  policy: Partial<MainWireVentricularLandIsometricTwitchAuditPolicyV1> = {},
  wallMaterialParams: LandSlsWallMaterialParamsV1 =
    NORMAL_ADULT_FIVE_WALL_PRIOR_V1.active.ventricularWallMaterial,
): MainWireVentricularLandIsometricTwitchAuditV1 {
  const resolvedPolicy = resolvePolicy(policy);
  const cycleLengthSec = calciumDriveParams.cycleLengthSec;
  const stepCountFloat = cycleLengthSec / resolvedPolicy.dtSec;
  const stepCount = Math.round(stepCountFloat);
  if (
    !Number.isInteger(stepCount)
    || Math.abs(stepCount - stepCountFloat) > 1e-10 * Math.max(1, stepCount)
  ) {
    throw new Error("isometric twitch dtSec must divide the cycle length");
  }
  const fixedFiberLogStrain = Math.log(
    resolvedPolicy.fixedLandStretch / wallMaterialParams.landSlackStretch,
  );
  const diastolicCalciumUM = calciumDriveParams.ventricular.diastolicCalciumUM;
  const cold = initializeLandSlsWallAtFixedInputV1(
    fixedFiberLogStrain,
    diastolicCalciumUM,
    wallMaterialParams,
  );
  if (!cold.converged) {
    throw new Error("isometric twitch Land fixed-input initialization failed");
  }

  let state = cold.state;
  let closureResidual = Number.POSITIVE_INFINITY;
  let simulatedCycleCount = 0;
  let samples: Sample[] = [];
  let maximumLandSolverIterations = 0;
  let maximumLandSolverResidualNorm = 0;
  let maximumAbsoluteParallelSlsOverstressPa = 0;
  let minimumLandPopulation = Number.POSITIVE_INFINITY;
  let maximumLandStateConservationResidual = 0;

  for (
    let cycleIndex = 0;
    cycleIndex < resolvedPolicy.maximumCycleCount;
    cycleIndex += 1
  ) {
    const cycleStartState = copyState(state);
    const cycleSamples: Sample[] = [];
    let cycleMaximumLandSolverIterations = 0;
    let cycleMaximumLandSolverResidualNorm = 0;
    let cycleMaximumAbsoluteParallelSlsOverstressPa = 0;
    let cycleMinimumLandPopulation = Number.POSITIVE_INFINITY;
    let cycleMaximumLandStateConservationResidual = 0;
    for (let stepIndex = 1; stepIndex <= stepCount; stepIndex += 1) {
      const timeSec = stepIndex === stepCount
        ? cycleLengthSec
        : stepIndex * resolvedPolicy.dtSec;
      const calciumUM = evaluateFiveWallNormalCalciumDriveV1(
        timeSec,
        calciumDriveParams,
      ).freeCalciumUMByWall.LVFW;
      const trial = trialLandSlsWallMaterialV1(
        state,
        {
          nextFiberLogStrain: fixedFiberLogStrain,
          nextFreeCalciumUM: calciumUM,
          dtSec: resolvedPolicy.dtSec,
          equilibriumPassive: ZERO_PASSIVE_INPUT,
        },
        wallMaterialParams,
      );
      if (!trial.valid) {
        throw new Error(
          `isometric twitch Land step failed: ${trial.issues.join("; ")}`,
        );
      }
      state = trial.state;
      cycleSamples.push(Object.freeze({
        timeSec,
        calciumUM,
        activeKirchhoffStressKPa: trial.activeKirchhoffStressPa / 1000,
      }));
      cycleMaximumLandSolverIterations = Math.max(
        cycleMaximumLandSolverIterations,
        trial.landSolverIterations,
      );
      cycleMaximumLandSolverResidualNorm = Math.max(
        cycleMaximumLandSolverResidualNorm,
        trial.landSolverResidualNorm,
      );
      cycleMaximumAbsoluteParallelSlsOverstressPa = Math.max(
        cycleMaximumAbsoluteParallelSlsOverstressPa,
        Math.abs(trial.sls.nextOverstressPa),
      );
      cycleMinimumLandPopulation = Math.min(
        cycleMinimumLandPopulation,
        trial.land.health.minimumPopulation,
      );
      cycleMaximumLandStateConservationResidual = Math.max(
        cycleMaximumLandStateConservationResidual,
        trial.land.health.stateConservationResidual,
      );
    }
    simulatedCycleCount = cycleIndex + 1;
    closureResidual = maximumLandStateDifference(cycleStartState, state);
    samples = cycleSamples;
    maximumLandSolverIterations = cycleMaximumLandSolverIterations;
    maximumLandSolverResidualNorm = cycleMaximumLandSolverResidualNorm;
    maximumAbsoluteParallelSlsOverstressPa =
      cycleMaximumAbsoluteParallelSlsOverstressPa;
    minimumLandPopulation = cycleMinimumLandPopulation;
    maximumLandStateConservationResidual =
      cycleMaximumLandStateConservationResidual;
    if (
      simulatedCycleCount >= resolvedPolicy.minimumCycleCount
      && closureResidual <= resolvedPolicy.p1StateClosureTolerance
    ) break;
  }

  const calcium = measureTransient(samples, (sample) => sample.calciumUM);
  const active = measureTransient(
    samples,
    (sample) => sample.activeKirchhoffStressKPa,
  );
  const provenance = FIVE_WALL_NORMAL_CALCIUM_DRIVE_PROVENANCE_V1
    .ventricularTimingSource;
  const tptRange = millisecondsRangeToSeconds(
    provenance.targetTimeToPeakRangeMs,
  );
  const rt50Range = millisecondsRangeToSeconds(
    provenance.targetRelaxationTime50RangeMs,
  );
  const rt95Range = millisecondsRangeToSeconds(
    provenance.targetRelaxationTime95RangeMs,
  );
  const tptWithin = withinRange(active.timeToPeakSec, tptRange);
  const rt50Within = active.relaxationTime50Sec !== null
    && withinRange(active.relaxationTime50Sec, rt50Range);
  const rt95Within = active.relaxationTime95Sec !== null
    && withinRange(active.relaxationTime95Sec, rt95Range);
  const peakTensionAtLeastSourceCostFloor = active.maximum >= 50;

  return Object.freeze({
    methodId: MAIN_WIRE_VENTRICULAR_LAND_ISOMETRIC_TWITCH_AUDIT_V1_ID,
    identities: Object.freeze({
      calciumDriveParameterSetId: calciumDriveParams.parameterSetId,
      wallMaterialParameterSetId: wallMaterialParams.parameterSetId,
      landEquationParameterSetId:
        wallMaterialParams.landEquationParameters.parameterSetId,
      landEquationParameterSetStableHash:
        wallMaterialParams.landEquationParameters.parameterSetStableHash,
    }),
    protocol: Object.freeze({
      cycleLengthSec,
      dtSec: resolvedPolicy.dtSec,
      sampleCount: samples.length,
      fixedLandStretch: resolvedPolicy.fixedLandStretch,
      fixedFiberLogStrain,
      ventricularElectricalToCalciumDelaySec:
        calciumDriveParams.ventricular.electricalToCalciumDelaySec,
      minimumCycleCount: resolvedPolicy.minimumCycleCount,
      maximumCycleCount: resolvedPolicy.maximumCycleCount,
      p1StateClosureTolerance: resolvedPolicy.p1StateClosureTolerance,
    }),
    periodicClosure: Object.freeze({
      coldFixedInputConverged: cold.converged,
      coldFixedInputIterations: cold.fixedInputIterations,
      simulatedCycleCount,
      maximumLandStateClosureResidual: closureResidual,
      converged: closureResidual <= resolvedPolicy.p1StateClosureTolerance,
    }),
    calcium,
    activeTwitch: Object.freeze({
      ...active,
      minimumKPa: active.minimum,
      peakKPa: active.maximum,
      amplitudeKPa: active.amplitude,
    }),
    numericalHealth: Object.freeze({
      maximumLandSolverIterations,
      maximumLandSolverResidualNorm,
      maximumAbsoluteParallelSlsOverstressPa,
      minimumLandPopulation,
      maximumLandStateConservationResidual,
      everyStepValid: true as const,
    }),
    sourceContext: Object.freeze({
      doi: provenance.doi,
      sourceCalciumInput: provenance.sourceCalciumInput,
      sourceRestingExtensionRatio: provenance.sourceRestingExtensionRatio,
      currentCalciumInputIsDigitizedSourceTrace: false as const,
      targetTimeToPeakRangeSec: tptRange,
      targetRelaxationTime50RangeSec: rt50Range,
      targetRelaxationTime95RangeSec: rt95Range,
      publishedFinalModel: Object.freeze({
        timeToPeakSec: provenance.reportedFinalModelTimeToPeakMs / 1000,
        relaxationTime50Sec:
          provenance.reportedFinalModelRelaxationTime50Ms / 1000,
        relaxationTime95Sec:
          provenance.reportedFinalModelRelaxationTime95Ms / 1000,
        peakTensionKPa: provenance.reportedFinalModelPeakTensionKPa,
        minimumTensionKPa: provenance.reportedFinalModelMinimumTensionKPa,
      }),
      directionalScreenOnly: Object.freeze({
        fixedStretchMatchesSourceRestingExtensionRatio:
          resolvedPolicy.fixedLandStretch
          === provenance.sourceRestingExtensionRatio,
        timeToPeakWithinTargetRange: tptWithin,
        relaxationTime50WithinTargetRange: rt50Within,
        relaxationTime95WithinTargetRange: rt95Within,
        peakTensionAtLeastSourceCostFloor,
        everyTimingTargetMet: tptWithin && rt50Within && rt95Within,
        eligibleForSourceTraceReproductionClaim: false as const,
      }),
    }),
    claim: MAIN_WIRE_VENTRICULAR_LAND_ISOMETRIC_TWITCH_AUDIT_CLAIM_V1,
  });
}

function resolvePolicy(
  policy: Partial<MainWireVentricularLandIsometricTwitchAuditPolicyV1>,
): MainWireVentricularLandIsometricTwitchAuditPolicyV1 {
  const resolved = Object.freeze({
    ...MAIN_WIRE_VENTRICULAR_LAND_ISOMETRIC_TWITCH_AUDIT_POLICY_V1,
    ...policy,
  });
  requirePositive(resolved.dtSec, "dtSec");
  requirePositive(resolved.fixedLandStretch, "fixedLandStretch");
  requirePositive(
    resolved.p1StateClosureTolerance,
    "p1StateClosureTolerance",
  );
  if (
    !Number.isInteger(resolved.minimumCycleCount)
    || resolved.minimumCycleCount <= 0
  ) {
    throw new Error("minimumCycleCount must be a positive integer");
  }
  if (
    !Number.isInteger(resolved.maximumCycleCount)
    || resolved.maximumCycleCount < resolved.minimumCycleCount
  ) {
    throw new Error(
      "maximumCycleCount must be an integer no smaller than minimumCycleCount",
    );
  }
  return resolved;
}

function copyState(
  state: LandSlsWallMaterialStateV1,
): LandSlsWallMaterialStateV1 {
  return Object.freeze({
    landState: Float64Array.from(state.landState),
    slsState: Object.freeze({ ...state.slsState }),
    previousFiberLogStrain: state.previousFiberLogStrain,
    previousFreeCalciumUM: state.previousFreeCalciumUM,
  });
}

function maximumLandStateDifference(
  first: LandSlsWallMaterialStateV1,
  second: LandSlsWallMaterialStateV1,
): number {
  let maximum = Math.max(
    Math.abs(first.previousFiberLogStrain - second.previousFiberLogStrain),
    Math.abs(first.previousFreeCalciumUM - second.previousFreeCalciumUM),
    Math.abs(
      first.slsState.viscousLogStrain
      - second.slsState.viscousLogStrain,
    ),
  );
  for (let index = 0; index < first.landState.length; index += 1) {
    maximum = Math.max(
      maximum,
      Math.abs(first.landState[index]! - second.landState[index]!),
    );
  }
  return maximum;
}

function measureTransient(
  samples: readonly Sample[],
  value: (sample: Sample) => number,
): MainWireIsometricTransientMetricsV1 {
  if (samples.length < 3) {
    throw new Error("isometric twitch transient requires at least three samples");
  }
  const values = samples.map(value);
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const amplitude = maximum - minimum;
  if (!(amplitude > 0) || !Number.isFinite(amplitude)) {
    throw new Error("isometric twitch transient requires positive amplitude");
  }
  const peakIndex = values.indexOf(maximum);
  const peakTimeSec = samples[peakIndex]!.timeSec;
  const relaxationTime = (relaxedFraction01: number): number | null => {
    const threshold = minimum + (1 - relaxedFraction01) * amplitude;
    const crossing = firstFallingCrossingTime(
      samples,
      values,
      peakIndex,
      threshold,
    );
    return crossing === null ? null : crossing - peakTimeSec;
  };
  const halfThreshold = minimum + 0.5 * amplitude;
  const risingHalfTime = firstRisingCrossingTime(
    samples,
    values,
    peakIndex,
    halfThreshold,
  );
  const fallingHalfTime = firstFallingCrossingTime(
    samples,
    values,
    peakIndex,
    halfThreshold,
  );
  let localPeakCount = 0;
  const peakThreshold = minimum + 0.05 * amplitude;
  for (let index = 1; index < values.length - 1; index += 1) {
    if (
      values[index]! > values[index - 1]!
      && values[index]! >= values[index + 1]!
      && values[index]! >= peakThreshold
    ) localPeakCount += 1;
  }
  return Object.freeze({
    minimum,
    maximum,
    amplitude,
    timeToPeakSec: peakTimeSec,
    relaxationTime50Sec: relaxationTime(0.5),
    relaxationTime90Sec: relaxationTime(0.9),
    relaxationTime95Sec: relaxationTime(0.95),
    durationAboveHalfMaximumSec:
      risingHalfTime === null || fallingHalfTime === null
        ? null
        : fallingHalfTime - risingHalfTime,
    localPeakCountAboveFivePercentAmplitude: localPeakCount,
  });
}

function firstRisingCrossingTime(
  samples: readonly Sample[],
  values: readonly number[],
  peakIndex: number,
  threshold: number,
): number | null {
  for (let index = 1; index <= peakIndex; index += 1) {
    if (values[index - 1]! < threshold && values[index]! >= threshold) {
      return interpolateCrossing(
        samples[index - 1]!.timeSec,
        values[index - 1]!,
        samples[index]!.timeSec,
        values[index]!,
        threshold,
      );
    }
  }
  return null;
}

function firstFallingCrossingTime(
  samples: readonly Sample[],
  values: readonly number[],
  peakIndex: number,
  threshold: number,
): number | null {
  for (let index = peakIndex + 1; index < samples.length; index += 1) {
    if (values[index - 1]! > threshold && values[index]! <= threshold) {
      return interpolateCrossing(
        samples[index - 1]!.timeSec,
        values[index - 1]!,
        samples[index]!.timeSec,
        values[index]!,
        threshold,
      );
    }
  }
  return null;
}

function interpolateCrossing(
  firstTimeSec: number,
  firstValue: number,
  secondTimeSec: number,
  secondValue: number,
  threshold: number,
): number {
  if (secondValue === firstValue) return secondTimeSec;
  const fraction = (threshold - firstValue) / (secondValue - firstValue);
  return firstTimeSec + fraction * (secondTimeSec - firstTimeSec);
}

function millisecondsRangeToSeconds(
  rangeMs: readonly [number, number],
): readonly [number, number] {
  return Object.freeze([rangeMs[0] / 1000, rangeMs[1] / 1000] as const);
}

function withinRange(
  value: number,
  range: readonly [number, number],
): boolean {
  return value >= range[0] && value <= range[1];
}

function requirePositive(value: number, name: string): void {
  if (!(value > 0) || !Number.isFinite(value)) {
    throw new Error(`${name} must be positive and finite`);
  }
}
