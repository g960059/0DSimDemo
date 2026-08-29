import {
  LAND2017_STATE_INDEX,
  evaluateLand2017ContinuousOutput,
  solveLand2017BackwardEulerStep,
  type Land2017EquationParameters,
} from "@/engine/myocardium/myofilament/land2017";

export const MAIN_WIRE_VENTRICULAR_LAND_SOURCE_VELOCITY_PROTOCOL_AUDIT_V2_ID =
  "main-wire-ventricular-land-source-velocity-protocol-audit-v2" as const;

export const MAIN_WIRE_VENTRICULAR_LAND_SOURCE_VELOCITY_PROTOCOL_CLAIM_V2 =
  Object.freeze({
    role: "source-protocol-constitutive-audit-independent-of-hemodynamics" as const,
    sourceDoi: "10.1016/j.yjmcc.2017.03.008" as const,
    sourceContext: "skinned-human-cardiomyocyte-37C" as const,
    sourceConstantVelocityCostTargets: Object.freeze([
      Object.freeze({ shorteningFraction: 0.1, durationSec: 0.1, target: 0.2 }),
      Object.freeze({ shorteningFraction: 0.1, durationSec: 0.2, target: 0.4 }),
      Object.freeze({ shorteningFraction: 0.1, durationSec: 0.3, target: 0.5 }),
    ] as const),
    sourceConstantVelocityShortlistThreshold: 17 as const,
    sourceReportedMinimumConstantVelocityCost: 8.6 as const,
    sourceQuickStretchFractions: Object.freeze([0.005, 0.01, 0.02] as const),
    sourceQuickStretchDurationSec: 0.01 as const,
    sourceFixedCalciumUM: 30 as const,
    sourceNormalizedStartStretch: 1 as const,
    activeLandTensionOnlyForConstantVelocityCost: true as const,
    passiveForceIncludedInSourceQuickStretchFitButExcludedHere: true as const,
    sourceQuickStretchTraceDigitized: false as const,
    sourceQuickStretchCostReproduced: false as const,
    wholeHeartFeedbackApplied: false as const,
    aorticValveOutputUsed: false as const,
    parameterSearchOrFitting: false as const,
  });

const DEFAULT_PROTOCOL_DT_SEC = 0.00025;
const SETTLEMENT_DT_SEC = 0.001;
const SETTLEMENT_MAXIMUM_STEPS = 10_000;
const SETTLEMENT_TOLERANCE = 1e-12;
const DEFAULT_STATE = Object.freeze([0.18, 0.22, 0.04, 0.02, 0, 0] as const);

type RampResult = Readonly<{
  finalState: Float64Array;
  finalActiveStressPa: number;
  minimumActiveStressPa: number;
  maximumActiveStressPa: number;
  normalizedActiveStressTimeIntegral: number;
  endRampZetaW: number;
  endRampZetaS: number;
  maximumLandSolverResidualNorm: number;
}>;

export type MainWireVentricularLandSourceVelocityProtocolAuditV2 = Readonly<{
  methodId:
    typeof MAIN_WIRE_VENTRICULAR_LAND_SOURCE_VELOCITY_PROTOCOL_AUDIT_V2_ID;
  landEquationParameterSetId: string;
  landEquationParameterSetStableHash: string;
  protocol: Readonly<{
    dtSec: number;
    freeCalciumUM: 30;
    startLandStretch: 1;
    constantVelocityShorteningFraction: 0.1;
    constantVelocityRampDurationsSec: readonly [0.1, 0.2, 0.3];
    quickStretchFractions: readonly [0.005, 0.01, 0.02];
    quickStretchRampDurationSec: 0.01;
  }>;
  settlement: Readonly<{
    dtSec: number;
    stepCount: number;
    maximumFinalStateUpdate: number;
  }>;
  initialActiveStressPa: number;
  constantVelocityShortening: readonly Readonly<{
    durationSec: number;
    sourceTargetEndRampStressFraction: number;
    endRampActiveStressFractionOfInitial: number;
    signedTargetError: number;
    absoluteTargetError: number;
    minimumActiveStressFractionOfInitial: number;
    normalizedActiveStressTimeIntegral: number;
    endRampZetaW: number;
    endRampZetaS: number;
    maximumLandSolverResidualNorm: number;
  }>[];
  sourceConstantVelocityCost: number;
  passesSourceConstantVelocityShortlistThreshold: boolean;
  quickStretch: readonly Readonly<{
    stretchFraction: number;
    endRampActiveStressFractionOfInitial: number;
    maximumActiveStressFractionOfInitial: number;
    acuteEndRampStressIncrementFractionOfInitial: number;
    endRampZetaW: number;
    endRampZetaS: number;
    maximumLandSolverResidualNorm: number;
  }>[];
  claim: typeof MAIN_WIRE_VENTRICULAR_LAND_SOURCE_VELOCITY_PROTOCOL_CLAIM_V2;
}>;

export function measureMainWireVentricularLandSourceVelocityProtocolAuditV2(
  parameterSet: Land2017EquationParameters,
  options: Readonly<{ dtSec?: number }> = {},
): MainWireVentricularLandSourceVelocityProtocolAuditV2 {
  const dtSec = options.dtSec ?? DEFAULT_PROTOCOL_DT_SEC;
  if (!(dtSec > 0) || !Number.isFinite(dtSec)) {
    throw new Error("source velocity protocol dt must be positive and finite");
  }
  const settlement = settleAtSourceFixedInput(parameterSet);
  const initialActiveStressPa = activeStressPa(
    settlement.state,
    1,
    0,
    parameterSet,
  );
  if (!(initialActiveStressPa > 0) || !Number.isFinite(initialActiveStressPa)) {
    throw new Error("source velocity protocol initial active stress must be positive");
  }

  const sourceTargets =
    MAIN_WIRE_VENTRICULAR_LAND_SOURCE_VELOCITY_PROTOCOL_CLAIM_V2
      .sourceConstantVelocityCostTargets;
  const constantVelocityShortening = Object.freeze(sourceTargets.map((target) => {
    const ramp = runRamp(
      settlement.state,
      1,
      1 - target.shorteningFraction,
      target.durationSec,
      dtSec,
      parameterSet,
    );
    const endRampFraction = ramp.finalActiveStressPa / initialActiveStressPa;
    return Object.freeze({
      durationSec: target.durationSec,
      sourceTargetEndRampStressFraction: target.target,
      endRampActiveStressFractionOfInitial: endRampFraction,
      signedTargetError: endRampFraction - target.target,
      absoluteTargetError: Math.abs(endRampFraction - target.target),
      minimumActiveStressFractionOfInitial:
        ramp.minimumActiveStressPa / initialActiveStressPa,
      normalizedActiveStressTimeIntegral:
        ramp.normalizedActiveStressTimeIntegral / initialActiveStressPa,
      endRampZetaW: ramp.endRampZetaW,
      endRampZetaS: ramp.endRampZetaS,
      maximumLandSolverResidualNorm: ramp.maximumLandSolverResidualNorm,
    });
  }));
  const sourceConstantVelocityCost = 50 * constantVelocityShortening.reduce(
    (sum, point) => sum + point.absoluteTargetError,
    0,
  );

  const quickStretch = Object.freeze(
    MAIN_WIRE_VENTRICULAR_LAND_SOURCE_VELOCITY_PROTOCOL_CLAIM_V2
      .sourceQuickStretchFractions.map((stretchFraction) => {
        const ramp = runRamp(
          settlement.state,
          1,
          1 + stretchFraction,
          0.01,
          dtSec,
          parameterSet,
        );
        const endRampFraction = ramp.finalActiveStressPa / initialActiveStressPa;
        return Object.freeze({
          stretchFraction,
          endRampActiveStressFractionOfInitial: endRampFraction,
          maximumActiveStressFractionOfInitial:
            ramp.maximumActiveStressPa / initialActiveStressPa,
          acuteEndRampStressIncrementFractionOfInitial: endRampFraction - 1,
          endRampZetaW: ramp.endRampZetaW,
          endRampZetaS: ramp.endRampZetaS,
          maximumLandSolverResidualNorm: ramp.maximumLandSolverResidualNorm,
        });
      }),
  );

  return Object.freeze({
    methodId: MAIN_WIRE_VENTRICULAR_LAND_SOURCE_VELOCITY_PROTOCOL_AUDIT_V2_ID,
    landEquationParameterSetId: parameterSet.parameterSetId,
    landEquationParameterSetStableHash: parameterSet.parameterSetStableHash,
    protocol: Object.freeze({
      dtSec,
      freeCalciumUM: 30 as const,
      startLandStretch: 1 as const,
      constantVelocityShorteningFraction: 0.1 as const,
      constantVelocityRampDurationsSec: Object.freeze([0.1, 0.2, 0.3] as const),
      quickStretchFractions: Object.freeze([0.005, 0.01, 0.02] as const),
      quickStretchRampDurationSec: 0.01 as const,
    }),
    settlement: Object.freeze({
      dtSec: SETTLEMENT_DT_SEC,
      stepCount: settlement.stepCount,
      maximumFinalStateUpdate: settlement.maximumFinalStateUpdate,
    }),
    initialActiveStressPa,
    constantVelocityShortening,
    sourceConstantVelocityCost,
    passesSourceConstantVelocityShortlistThreshold:
      sourceConstantVelocityCost < 17,
    quickStretch,
    claim: MAIN_WIRE_VENTRICULAR_LAND_SOURCE_VELOCITY_PROTOCOL_CLAIM_V2,
  });
}

function settleAtSourceFixedInput(
  parameterSet: Land2017EquationParameters,
): Readonly<{
  state: Float64Array;
  stepCount: number;
  maximumFinalStateUpdate: number;
}> {
  let state = Float64Array.from(DEFAULT_STATE);
  let maximumFinalStateUpdate = Number.POSITIVE_INFINITY;
  let stepCount = 0;
  for (; stepCount < SETTLEMENT_MAXIMUM_STEPS; stepCount += 1) {
    const solved = solveLand2017BackwardEulerStep(
      state,
      {
        freeCalciumUM: 30,
        previousFiberEngineeringStrain: 0,
        stageFiberEngineeringStrain: 0,
        dtSec: SETTLEMENT_DT_SEC,
        stage: { scheme: "BE", stageIndex: 0 },
      },
      { residualTolerance: 1e-11 },
      parameterSet,
    );
    if (!solved.ok) {
      throw new Error(
        `source velocity protocol settlement failed: ${solved.failureReason ?? "unknown"}`,
      );
    }
    maximumFinalStateUpdate = maximumDifference(state, solved.nextState);
    state = solved.nextState;
    if (maximumFinalStateUpdate <= SETTLEMENT_TOLERANCE) {
      stepCount += 1;
      return Object.freeze({ state, stepCount, maximumFinalStateUpdate });
    }
  }
  throw new Error(
    `source velocity protocol settlement did not converge: ${maximumFinalStateUpdate}`,
  );
}

function runRamp(
  initialState: ArrayLike<number>,
  startLandStretch: number,
  endLandStretch: number,
  durationSec: number,
  dtSec: number,
  parameterSet: Land2017EquationParameters,
): RampResult {
  const stepCount = Math.round(durationSec / dtSec);
  if (Math.abs(stepCount * dtSec - durationSec) > 1e-13) {
    throw new Error("source velocity protocol duration is not an exact dt multiple");
  }
  let state = Float64Array.from(initialState);
  let previousEngineeringStrain = startLandStretch - 1;
  let finalActiveStressPa = Number.NaN;
  let minimumActiveStressPa = Number.POSITIVE_INFINITY;
  let maximumActiveStressPa = Number.NEGATIVE_INFINITY;
  let activeStressTimeIntegralPaSec = 0;
  let maximumLandSolverResidualNorm = 0;
  for (let stepIndex = 1; stepIndex <= stepCount; stepIndex += 1) {
    const fraction = stepIndex / stepCount;
    const landStretch = startLandStretch
      + fraction * (endLandStretch - startLandStretch);
    const engineeringStrain = landStretch - 1;
    const solved = solveLand2017BackwardEulerStep(
      state,
      {
        freeCalciumUM: 30,
        previousFiberEngineeringStrain: previousEngineeringStrain,
        stageFiberEngineeringStrain: engineeringStrain,
        dtSec,
        stage: { scheme: "BE", stageIndex: 0 },
      },
      { residualTolerance: 1e-11 },
      parameterSet,
    );
    if (!solved.ok || solved.output === undefined) {
      throw new Error(
        `source velocity protocol ramp failed: ${solved.failureReason ?? "unknown"}`,
      );
    }
    state = solved.nextState;
    previousEngineeringStrain = engineeringStrain;
    finalActiveStressPa = solved.output.sourceActiveFiberStressPa;
    minimumActiveStressPa = Math.min(minimumActiveStressPa, finalActiveStressPa);
    maximumActiveStressPa = Math.max(maximumActiveStressPa, finalActiveStressPa);
    activeStressTimeIntegralPaSec += finalActiveStressPa * dtSec;
    maximumLandSolverResidualNorm = Math.max(
      maximumLandSolverResidualNorm,
      solved.residualNorm,
    );
  }
  return Object.freeze({
    finalState: state,
    finalActiveStressPa,
    minimumActiveStressPa,
    maximumActiveStressPa,
    normalizedActiveStressTimeIntegral:
      activeStressTimeIntegralPaSec / durationSec,
    endRampZetaW: state[LAND2017_STATE_INDEX.zetaW]!,
    endRampZetaS: state[LAND2017_STATE_INDEX.zetaS]!,
    maximumLandSolverResidualNorm,
  });
}

function activeStressPa(
  state: ArrayLike<number>,
  landStretch: number,
  strainRatePerSec: number,
  parameterSet: Land2017EquationParameters,
): number {
  return evaluateLand2017ContinuousOutput(
    state,
    {
      freeCalciumUM: 30,
      fiberEngineeringStrain: landStretch - 1,
      fiberEngineeringStrainRatePerSec: strainRatePerSec,
    },
    parameterSet,
  ).sourceActiveFiberStressPa;
}

function maximumDifference(left: ArrayLike<number>, right: ArrayLike<number>): number {
  if (left.length !== right.length) throw new Error("state length mismatch");
  let maximum = 0;
  for (let index = 0; index < left.length; index += 1) {
    maximum = Math.max(maximum, Math.abs(left[index]! - right[index]!));
  }
  return maximum;
}
