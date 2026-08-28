import {
  initializeLandSlsWallAtFixedInputV1,
  type LandSlsWallMaterialParamsV1,
} from "@/engine/myocardium/mechanics/landSlsWallMaterialV1";
import {
  LAND2017_STATE_INDEX,
  evaluateLand2017ContinuousOutput,
  solveLand2017BackwardEulerStep,
} from "@/engine/myocardium/myofilament/land2017";

export const MAIN_WIRE_VENTRICULAR_LAND_DISTORTION_PROTOCOL_AUDIT_V1_ID =
  "main-wire-ventricular-land-distortion-protocol-audit-v1" as const;

export const MAIN_WIRE_VENTRICULAR_LAND_DISTORTION_PROTOCOL_AUDIT_CLAIM_V1 =
  Object.freeze({
    role: "source-inspired-distortion-timescale-audit-not-data-fit" as const,
    sourceContext:
      "Land-2017-quick-length-change-and-constant-velocity-shortening" as const,
    sourceDoi: "10.1016/j.yjmcc.2017.03.008" as const,
    quickProtocol:
      "one-percent-shortening-over-ten-ms-followed-by-fixed-length-recovery" as const,
    constantVelocityProtocol:
      "twenty-percent-shortening-over-one-hundred-seventy-five-ms" as const,
    normalizedStartStretchRationale:
      "2.3-um-source-start-over-2.0-um-reference" as const,
    calciumRole: "fixed-saturating-drive-to-isolate-distortion" as const,
    passiveOrSlsIncluded: false as const,
    wholeHeartFeedbackApplied: false as const,
    experimentalTraceDigitizedOrFitted: false as const,
    sourceReproductionOrValidationClaimed: false as const,
    parameterSearchOrFitting: false as const,
  });

export type MainWireVentricularLandDistortionProtocolAuditV1 = Readonly<{
  methodId:
    typeof MAIN_WIRE_VENTRICULAR_LAND_DISTORTION_PROTOCOL_AUDIT_V1_ID;
  materialParameterSetId: string;
  landEquationParameterSetStableHash: string;
  protocol: Readonly<{
    dtSec: number;
    freeCalciumUM: number;
    startLandStretch: number;
    quickShorteningFractionOfStart: number;
    quickRampDurationSec: number;
    quickRecoveryHoldDurationSec: number;
    constantVelocityShorteningFractionOfStart: number;
    constantVelocityRampDurationSec: number;
  }>;
  initialActiveStressKPa: number;
  quickShortening: Readonly<{
    endRampActiveStressFractionOfInitial: number;
    minimumActiveStressFractionOfInitial: number;
    endHoldActiveStressFractionOfInitial: number;
    endRampZetaW: number;
    endRampZetaS: number;
    endHoldZetaW: number;
    endHoldZetaS: number;
    maximumLandSolverResidualNorm: number;
  }>;
  constantVelocityShortening: Readonly<{
    endRampActiveStressFractionOfInitial: number;
    minimumActiveStressFractionOfInitial: number;
    normalizedActiveStressTimeIntegral: number;
    endRampZetaW: number;
    endRampZetaS: number;
    maximumLandSolverResidualNorm: number;
  }>;
  claim: typeof MAIN_WIRE_VENTRICULAR_LAND_DISTORTION_PROTOCOL_AUDIT_CLAIM_V1;
}>;

type RampResult = Readonly<{
  finalState: Float64Array;
  stressKPa: readonly number[];
  finalZetaW: number;
  finalZetaS: number;
  maximumLandSolverResidualNorm: number;
}>;

const PROTOCOL = Object.freeze({
  dtSec: 0.0005,
  freeCalciumUM: 10,
  startLandStretch: 1.15,
  quickShorteningFractionOfStart: 0.01,
  quickRampDurationSec: 0.01,
  quickRecoveryHoldDurationSec: 0.1,
  constantVelocityShorteningFractionOfStart: 0.2,
  constantVelocityRampDurationSec: 0.175,
});

export function measureMainWireVentricularLandDistortionProtocolAuditV1(
  material: LandSlsWallMaterialParamsV1,
): MainWireVentricularLandDistortionProtocolAuditV1 {
  const startFiberLogStrain = Math.log(
    PROTOCOL.startLandStretch / material.landSlackStretch,
  );
  const cold = initializeLandSlsWallAtFixedInputV1(
    startFiberLogStrain,
    PROTOCOL.freeCalciumUM,
    material,
  );
  if (!cold.converged) {
    throw new Error("distortion protocol fixed-input initialization failed");
  }
  const initialActiveStressKPa = activeStressKPa(
    cold.state.landState,
    PROTOCOL.startLandStretch,
    0,
    material,
  );
  const quickEndStretch = PROTOCOL.startLandStretch
    * (1 - PROTOCOL.quickShorteningFractionOfStart);
  const quickRamp = runRamp(
    cold.state.landState,
    PROTOCOL.startLandStretch,
    quickEndStretch,
    PROTOCOL.quickRampDurationSec,
    material,
  );
  const quickHold = runRamp(
    quickRamp.finalState,
    quickEndStretch,
    quickEndStretch,
    PROTOCOL.quickRecoveryHoldDurationSec,
    material,
  );
  const constantEndStretch = PROTOCOL.startLandStretch
    * (1 - PROTOCOL.constantVelocityShorteningFractionOfStart);
  const constantRamp = runRamp(
    cold.state.landState,
    PROTOCOL.startLandStretch,
    constantEndStretch,
    PROTOCOL.constantVelocityRampDurationSec,
    material,
  );
  return Object.freeze({
    methodId: MAIN_WIRE_VENTRICULAR_LAND_DISTORTION_PROTOCOL_AUDIT_V1_ID,
    materialParameterSetId: material.parameterSetId,
    landEquationParameterSetStableHash:
      material.landEquationParameters.parameterSetStableHash,
    protocol: PROTOCOL,
    initialActiveStressKPa,
    quickShortening: Object.freeze({
      endRampActiveStressFractionOfInitial:
        quickRamp.stressKPa.at(-1)! / initialActiveStressKPa,
      minimumActiveStressFractionOfInitial:
        minimum(quickRamp.stressKPa) / initialActiveStressKPa,
      endHoldActiveStressFractionOfInitial:
        quickHold.stressKPa.at(-1)! / initialActiveStressKPa,
      endRampZetaW: quickRamp.finalZetaW,
      endRampZetaS: quickRamp.finalZetaS,
      endHoldZetaW: quickHold.finalZetaW,
      endHoldZetaS: quickHold.finalZetaS,
      maximumLandSolverResidualNorm: Math.max(
        quickRamp.maximumLandSolverResidualNorm,
        quickHold.maximumLandSolverResidualNorm,
      ),
    }),
    constantVelocityShortening: Object.freeze({
      endRampActiveStressFractionOfInitial:
        constantRamp.stressKPa.at(-1)! / initialActiveStressKPa,
      minimumActiveStressFractionOfInitial:
        minimum(constantRamp.stressKPa) / initialActiveStressKPa,
      normalizedActiveStressTimeIntegral:
        constantRamp.stressKPa.reduce((sum, stress) =>
          sum + stress * PROTOCOL.dtSec, 0)
        / (
          initialActiveStressKPa
          * PROTOCOL.constantVelocityRampDurationSec
        ),
      endRampZetaW: constantRamp.finalZetaW,
      endRampZetaS: constantRamp.finalZetaS,
      maximumLandSolverResidualNorm:
        constantRamp.maximumLandSolverResidualNorm,
    }),
    claim: MAIN_WIRE_VENTRICULAR_LAND_DISTORTION_PROTOCOL_AUDIT_CLAIM_V1,
  });
}

function runRamp(
  initialState: ArrayLike<number>,
  startLandStretch: number,
  endLandStretch: number,
  durationSec: number,
  material: LandSlsWallMaterialParamsV1,
): RampResult {
  const stepCount = Math.round(durationSec / PROTOCOL.dtSec);
  if (Math.abs(stepCount * PROTOCOL.dtSec - durationSec) > 1e-15) {
    throw new Error("distortion protocol duration is not an exact dt multiple");
  }
  let state = Float64Array.from(initialState);
  let previousEngineeringStrain = startLandStretch - 1;
  const stressKPa: number[] = [];
  let maximumLandSolverResidualNorm = 0;
  for (let stepIndex = 1; stepIndex <= stepCount; stepIndex += 1) {
    const fraction = stepIndex / stepCount;
    const landStretch = startLandStretch
      + fraction * (endLandStretch - startLandStretch);
    const engineeringStrain = landStretch - 1;
    const solved = solveLand2017BackwardEulerStep(
      state,
      {
        freeCalciumUM: PROTOCOL.freeCalciumUM,
        previousFiberEngineeringStrain: previousEngineeringStrain,
        stageFiberEngineeringStrain: engineeringStrain,
        dtSec: PROTOCOL.dtSec,
        stage: { scheme: "BE", stageIndex: 0 },
      },
      {
        maxIterations: 20,
        residualTolerance: 1e-10,
        lineSearchMinStep: 1 / 4096,
      },
      material.landEquationParameters,
    );
    if (!solved.ok || solved.output === undefined) {
      throw new Error(
        `distortion protocol Land step failed: ${solved.failureReason ?? "unknown"}`,
      );
    }
    state = solved.nextState;
    previousEngineeringStrain = engineeringStrain;
    maximumLandSolverResidualNorm = Math.max(
      maximumLandSolverResidualNorm,
      solved.residualNorm,
    );
    stressKPa.push(
      landStretch
      * material.orientationFraction01
      * material.viableActiveFraction01
      * solved.output.sourceActiveFiberStressPa
      / 1000,
    );
  }
  return Object.freeze({
    finalState: state,
    stressKPa: Object.freeze(stressKPa),
    finalZetaW: state[LAND2017_STATE_INDEX.zetaW]!,
    finalZetaS: state[LAND2017_STATE_INDEX.zetaS]!,
    maximumLandSolverResidualNorm,
  });
}

function activeStressKPa(
  state: ArrayLike<number>,
  landStretch: number,
  strainRatePerSec: number,
  material: LandSlsWallMaterialParamsV1,
): number {
  const output = evaluateLand2017ContinuousOutput(
    state,
    {
      freeCalciumUM: PROTOCOL.freeCalciumUM,
      fiberEngineeringStrain: landStretch - 1,
      fiberEngineeringStrainRatePerSec: strainRatePerSec,
    },
    material.landEquationParameters,
  );
  return landStretch
    * material.orientationFraction01
    * material.viableActiveFraction01
    * output.sourceActiveFiberStressPa
    / 1000;
}

function minimum(values: readonly number[]): number {
  if (values.length === 0) throw new Error("minimum requires values");
  return Math.min(...values);
}
