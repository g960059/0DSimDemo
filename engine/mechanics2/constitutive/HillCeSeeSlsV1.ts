import {
  DEFAULT_LAND_FORM_CA_TROPONIN_ACTIVATION_PARAMS_V1,
  initialLandFormCaTroponinActivationStateV1,
  prepareLandFormCaTroponinActivationParamsV1,
  trialLandFormCaTroponinActivationMidpointV2,
  validateLandFormCaTroponinActivationParamsV1,
  type LandFormCaTroponinActivationMidpointReadbackV2,
  type LandFormCaTroponinActivationMidpointTrialV2,
  type LandFormCaTroponinActivationParamsV1,
  type PreparedLandFormCaTroponinActivationParamsV1,
} from "@/engine/mechanics2/activation/LandFormCaTroponinActivationV1";

/**
 * Clean-room, one-dimensional Hill CE--SEE rheology with one parallel SLS arm.
 *
 * KINEMATIC CLAIM (V1)
 * --------------------
 * Every strain in this file is a natural-log strain.  The additive split
 *
 *   epsilon = epsilon_CE + epsilon_SE
 *
 * is therefore the logarithm of the multiplicative stretch decomposition
 * lambda = lambda_CE lambda_SE.  Stresses are one-dimensional Kirchhoff
 * stresses, work-conjugate to log-strain rate.  Energy densities and work
 * increments are per reference fiber volume.
 *
 * SERIAL AND PARALLEL TOPOLOGY
 * ----------------------------
 * CE and SEE are serial, hence T_CE = T_SE; they are never added.  The chamber
 * receives
 *
 *   tau = tau_passive_equilibrium + T_SE + q_SLS.
 *
 * Prescribed dimensional free calcium drives a one-state Land-form CaTRPN
 * update inside every CE root candidate.  CaTRPN length sensitivity therefore
 * participates in the same-step algorithmic tangent; it is not a lagged force
 * multiplier.  Calcium cycling, ATP, and chemical free energy remain outside
 * V1 and no total chemo-mechanical efficiency is claimed.
 */

export const HILL_CE_SEE_SLS_KINEMATIC_CLAIM_V1 = Object.freeze({
  strainMeasure: "natural-log-strain" as const,
  stretchDecomposition: "lambda=lambda_CE*lambda_SE" as const,
  stressMeasure: "one-dimensional-Kirchhoff-stress" as const,
  workConjugatePair: "Kirchhoff-stress-times-log-strain-rate" as const,
  energyDensityMeasure: "per-reference-fiber-volume" as const,
  activeChemicalEnergyModelled: false as const,
  prescribedFreeCalciumInput: true as const,
  caTroponinUpdatedInsideSerialEquilibrium: true as const,
  caTroponinNumericalUpdate: "exponential-midpoint-rush-larsen" as const,
  ceMidpointReconstruction: "accepted-to-trial-endpoint-linear" as const,
  calciumCyclingModelled: false as const,
  /** A trajectory must be restarted when constitutive parameters change. */
  materialParametersMayChangeWithinTrajectory: false as const,
});

export type HillCeSeeSlsStateV1 = {
  readonly totalStrain: number;
  readonly ceStrain: number;
  readonly slsOverstressPa: number;
  /** Accepted Land-form regulatory-site occupancy. */
  readonly caTroponin01: number;
  /** Present only for the opt-in normalized thin-filament availability lag. */
  readonly thinFilamentAvailability01?: number;
};

export type HillCeSeeSlsParamsV1 = {
  readonly parameterSetId: string;
  readonly calciumTroponinActivation: LandFormCaTroponinActivationParamsV1;
  readonly passive: {
    readonly tangentModulusPa: number;
    readonly exponentialSlope: number;
    readonly referenceStrain: number;
    /** C2 ramp from compression-off to the tensile exponential potential. */
    readonly tensionTransitionStrain: number;
  };
  readonly contractileElement: {
    readonly maximumIsometricTensionPa: number;
    readonly optimalStrain: number;
    readonly lengthWidth: number;
    readonly minimumLengthFactor: number;
    readonly maximumLengthFactor: number;
    /** a/F0 in the classical Hill hyperbola. */
    readonly hillCurvatureRatio: number;
    /** Positive magnitude; shortening velocity is negative in this file. */
    readonly maximumShorteningVelocityPerSec: number;
    /** C1 ramp width above the unloaded endpoint -v_max. */
    readonly unloadedTransitionWidthPerSec: number;
    readonly maximumLengtheningForceVelocityFactor: number;
    readonly lengtheningVelocityScalePerSec: number;
    /** C1 join half-width around zero velocity. */
    readonly forceVelocityTransitionHalfWidthPerSec: number;
    readonly minimumStrain: number;
    readonly maximumStrain: number;
  };
  readonly seriesElasticElement: {
    readonly slackStrain: number;
    /** C2 tensile ramp above slack; stress is derived from the smoothed energy. */
    readonly tensionTransitionStrain: number;
    readonly linearStiffnessPa: number;
    readonly cubicStiffnessPa: number;
  };
  readonly sls: {
    readonly enabled: boolean;
    readonly modulusPa: number;
    readonly relaxationTimeSec: number;
  };
  readonly solver: {
    readonly absoluteStressTolerancePa: number;
    readonly relativeStressTolerance: number;
    readonly strainTolerance: number;
    readonly maximumIterations: number;
    /** Follow the accepted physical branch locally before the all-root fallback. */
    readonly preferLocalContinuation: boolean;
    readonly maximumLocalContinuationIterations: number;
    readonly minimumLocalLineSearchStep: number;
    /** Base scan augmented by scale-local nodes and adaptive refinement. */
    readonly rootScanSubdivisions: number;
    /** Recursive refinement depth for same-sign intervals near extrema. */
    readonly maximumAdaptiveRootDepth: number;
    readonly minimumStableAlgorithmicStiffnessPa: number;
  };
};

declare const PREPARED_HILL_CE_SEE_SLS_PARAMS_V1: unique symbol;

/**
 * Immutable, validated parameter snapshot for repeated constitutive trials.
 * The private WeakSet membership, rather than the structural brand alone,
 * authorizes the validation fast path at runtime.
 */
export type PreparedHillCeSeeSlsParamsV1 = Omit<
  HillCeSeeSlsParamsV1,
  "calciumTroponinActivation"
> & {
  readonly calciumTroponinActivation: PreparedLandFormCaTroponinActivationParamsV1;
  readonly [PREPARED_HILL_CE_SEE_SLS_PARAMS_V1]: true;
};

const PREPARED_HILL_CE_SEE_SLS_PARAM_OBJECTS_V1 = new WeakSet<object>();

export type HillCeSeeSlsTrialInputV1 = {
  readonly dtSec: number;
  readonly totalStrain: number;
  /** Endpoint dimensional prescribed free calcium, retained for readback. */
  readonly freeCalciumUm: number;
  /** Interval-midpoint free calcium used by the Land exponential update. */
  readonly midpointFreeCalciumUm?: number;
};

export type HillPassiveEquilibriumEvaluationV1 =
  | {
      readonly valid: true;
      readonly finite: true;
      readonly failureReason: null;
      readonly totalStrain: number;
      readonly stressPa: number;
      readonly tangentPa: number;
      readonly storageJPerM3: number;
    }
  | {
      readonly valid: false;
      readonly finite: boolean;
      readonly failureReason: string;
      readonly totalStrain: number;
      readonly stressPa: null;
      readonly tangentPa: null;
      readonly storageJPerM3: null;
    };

export type HillCeSeeSlsIssueCodeV1 =
  | "INVALID_PARAMETERS"
  | "INVALID_ACCEPTED_STATE"
  | "INVALID_TRIAL_INPUT"
  | "NONFINITE_CONSTITUTIVE_OUTPUT"
  | "NO_SERIAL_ROOT"
  | "NO_CONVERGED_SERIAL_ROOT"
  | "NO_STABLE_SERIAL_ROOT";

export type HillCeSeeSlsIssueV1 = {
  readonly code: HillCeSeeSlsIssueCodeV1;
  readonly message: string;
};

export type HillCeSeeSlsRootCandidateV1 = {
  readonly ceStrain: number;
  readonly residualPa: number;
  /** K_SE + dT_CE/d(epsilon_CE) using the backward-Euler velocity derivative. */
  readonly algorithmicStabilityPa: number;
  readonly residualTolerancePa: number;
  readonly converged: boolean;
  /** Local invertibility of the loaded CE--SEE equilibrium branch. */
  readonly stable: boolean;
  /** Admissible neutral continuation on the exactly unloaded manifold. */
  readonly neutralZeroManifold: boolean;
  readonly admissible: boolean;
  readonly source:
    | "local-continuation"
    | "sign-bracket"
    | "zero-manifold-boundary"
    | "zero-manifold-continuation";
};

export type HillCeSeeSlsStressReadbackV1 = {
  readonly passiveEquilibriumPa: number;
  readonly contractileElementTensionPa: number;
  readonly seriesElasticTensionPa: number;
  readonly slsOverstressPa: number;
  /** passiveEquilibriumPa + seriesElasticTensionPa + slsOverstressPa */
  readonly totalTransmittedPa: number;
  /** seriesElasticTensionPa - contractileElementTensionPa */
  readonly serialEquilibriumResidualPa: number;
};

export type HillCeSeeSlsTangentReadbackV1 = {
  readonly passiveEquilibriumPa: number;
  readonly contractileElementAlgorithmicPa: number;
  readonly seriesElasticPa: number;
  readonly serialStabilityPa: number;
  readonly serialTransmittedAlgorithmicPa: number;
  readonly slsAlgorithmicPa: number;
  readonly totalTransmittedAlgorithmicPa: number;
};

export type HillCeSeeSlsEnergyReadbackV1 = {
  readonly passiveEquilibriumStorageJPerM3: number;
  readonly seriesElasticStorageJPerM3: number;
  readonly slsStorageJPerM3: number;
  readonly totalStoredJPerM3: number;
};

export type HillCeSeeSlsSerialWorkReadbackV1 = {
  readonly boundaryWorkIncrementJPerM3: number;
  readonly contractileElementMechanicalWorkIncrementJPerM3: number;
  readonly seriesElasticStorageIncrementJPerM3: number;
  readonly seriesElasticBackwardEulerNumericalDissipationJPerM3: number;
  readonly discreteBalanceResidualJPerM3: number;
  readonly activeChemicalEnergyModelled: false;
  readonly activeChemicalEnergyClaim: "unmodelled-in-v1";
};

export type HillCeSeeSlsSlsBalanceReadbackV1 = {
  readonly workIncrementJPerM3: number;
  readonly storageIncrementJPerM3: number;
  readonly physicalRelaxationDissipationJPerM3: number;
  readonly backwardEulerNumericalDissipationJPerM3: number;
  readonly physicalRelaxationDissipationRateWPerM3: number;
  readonly backwardEulerNumericalDissipationRateWPerM3: number;
  readonly discreteBalanceResidualJPerM3: number;
};

export type HillCeSeeSlsReadbackV1 = {
  readonly freeCalciumUm: number;
  readonly caTroponin01: number;
  /** Normalized thin-filament availability, not a prescribed force waveform. */
  readonly thinFilamentAvailability01: number;
  /** @deprecated Compatibility alias for thinFilamentAvailability01. */
  readonly activation01: number;
  readonly calciumTroponinActivation: LandFormCaTroponinActivationMidpointReadbackV2 | null;
  readonly strains: {
    readonly total: number;
    readonly contractileElement: number;
    readonly seriesElasticElement: number;
    readonly totalRatePerSec: number;
    readonly contractileElementRatePerSec: number;
  };
  readonly factors: {
    readonly activeLength: number;
    readonly forceVelocity: number;
  };
  readonly stresses: HillCeSeeSlsStressReadbackV1;
  readonly tangentsPa: HillCeSeeSlsTangentReadbackV1;
  readonly energies: HillCeSeeSlsEnergyReadbackV1;
  readonly serialWork: HillCeSeeSlsSerialWorkReadbackV1;
  readonly slsBalance: HillCeSeeSlsSlsBalanceReadbackV1;
  readonly kinematicClaim: typeof HILL_CE_SEE_SLS_KINEMATIC_CLAIM_V1;
};

export type HillCeSeeSlsTrialV1 = {
  readonly previousState: HillCeSeeSlsStateV1;
  readonly nextState: HillCeSeeSlsStateV1;
  readonly readback: HillCeSeeSlsReadbackV1;
  readonly solver: {
    readonly converged: boolean;
    readonly iterations: number;
    readonly bracketed: boolean;
    readonly absoluteResidualPa: number;
    readonly rootCandidates: readonly HillCeSeeSlsRootCandidateV1[];
    readonly convergedRootCount: number;
    readonly stableRootCount: number;
    readonly admissibleRootCount: number;
    readonly selectedRootIndex: number | null;
    readonly selectedAlgorithmicStabilityPa: number;
    readonly selectedMechanicallyStable: boolean;
    readonly selectedNeutralZeroManifold: boolean;
  };
  readonly valid: boolean;
  readonly finite: boolean;
  readonly issues: readonly HillCeSeeSlsIssueV1[];
};

export const DEFAULT_HILL_CE_SEE_SLS_PARAMS_V1: HillCeSeeSlsParamsV1 = {
  parameterSetId: "hill-ce-see-sls-engineering-seed-v1",
  calciumTroponinActivation: DEFAULT_LAND_FORM_CA_TROPONIN_ACTIVATION_PARAMS_V1,
  passive: {
    tangentModulusPa: 8_000,
    exponentialSlope: 8,
    referenceStrain: 0,
    tensionTransitionStrain: 0.02,
  },
  contractileElement: {
    maximumIsometricTensionPa: 100_000,
    optimalStrain: 0,
    lengthWidth: 0.22,
    minimumLengthFactor: 0.05,
    maximumLengthFactor: 1,
    hillCurvatureRatio: 0.25,
    maximumShorteningVelocityPerSec: 1.5,
    unloadedTransitionWidthPerSec: 0.02,
    maximumLengtheningForceVelocityFactor: 1.5,
    lengtheningVelocityScalePerSec: 1,
    forceVelocityTransitionHalfWidthPerSec: 0.02,
    minimumStrain: -0.6,
    // Stay on the open differentiable branch of Land Eq. 29 (lambda_CE < 1.2).
    maximumStrain: Math.log(1.2) - 1e-9,
  },
  seriesElasticElement: {
    slackStrain: 0,
    tensionTransitionStrain: 1e-4,
    linearStiffnessPa: 150_000,
    cubicStiffnessPa: 2_000_000,
  },
  sls: {
    enabled: true,
    modulusPa: 6_000,
    relaxationTimeSec: 0.08,
  },
  solver: {
    absoluteStressTolerancePa: 1e-6,
    relativeStressTolerance: 1e-10,
    strainTolerance: 1e-14,
    maximumIterations: 80,
    preferLocalContinuation: true,
    maximumLocalContinuationIterations: 18,
    minimumLocalLineSearchStep: 1 / 1024,
    rootScanSubdivisions: 32,
    maximumAdaptiveRootDepth: 8,
    minimumStableAlgorithmicStiffnessPa: 1e-6,
  },
};

export function initialHillCeSeeSlsStateV1(
  totalStrain: number,
  ceStrain: number = totalStrain,
  slsOverstressPa = 0,
  caTroponin01 = 0,
  thinFilamentAvailability01?: number,
): HillCeSeeSlsStateV1 {
  requireFinite("totalStrain", totalStrain);
  requireFinite("ceStrain", ceStrain);
  requireFinite("slsOverstressPa", slsOverstressPa);
  initialLandFormCaTroponinActivationStateV1(
    caTroponin01,
    thinFilamentAvailability01,
  );
  return thinFilamentAvailability01 === undefined
    ? Object.freeze({ totalStrain, ceStrain, slsOverstressPa, caTroponin01 })
    : Object.freeze({
        totalStrain,
        ceStrain,
        slsOverstressPa,
        caTroponin01,
        thinFilamentAvailability01,
      });
}

/**
 * Snapshot, validate, and deeply freeze a material pack once for repeated CE
 * root evaluations. Caller-owned objects are cloned before validation and are
 * never registered in the fast path, so later mutation cannot bypass the
 * parameter contract.
 */
export function prepareHillCeSeeSlsParamsV1(
  params: HillCeSeeSlsParamsV1,
): PreparedHillCeSeeSlsParamsV1 {
  const snapshot: HillCeSeeSlsParamsV1 = {
    ...params,
    calciumTroponinActivation: {
      ...params.calciumTroponinActivation,
      ...(params.calciumTroponinActivation.thinFilamentDynamics === undefined
        ? {}
        : {
            thinFilamentDynamics: {
              ...params.calciumTroponinActivation.thinFilamentDynamics,
            },
          }),
    },
    passive: { ...params.passive },
    contractileElement: { ...params.contractileElement },
    seriesElasticElement: { ...params.seriesElasticElement },
    sls: { ...params.sls },
    solver: { ...params.solver },
  };
  const parameterErrors = validateHillCeSeeSlsParamsV1(snapshot);
  if (parameterErrors.length > 0) throw new Error(parameterErrors.join("; "));

  const prepared = Object.freeze({
    ...snapshot,
    calciumTroponinActivation: prepareLandFormCaTroponinActivationParamsV1(
      snapshot.calciumTroponinActivation,
    ),
    passive: Object.freeze(snapshot.passive),
    contractileElement: Object.freeze(snapshot.contractileElement),
    seriesElasticElement: Object.freeze(snapshot.seriesElasticElement),
    sls: Object.freeze(snapshot.sls),
    solver: Object.freeze(snapshot.solver),
  }) as PreparedHillCeSeeSlsParamsV1;
  PREPARED_HILL_CE_SEE_SLS_PARAM_OBJECTS_V1.add(prepared);
  return prepared;
}

/**
 * Pure equilibrium-passive branch evaluation.
 *
 * This is the long-time, zero-activation readback of the parallel equilibrium
 * spring only. It deliberately excludes CE--SEE tension and SLS overstress, so
 * it has no time-step, calcium, or material-history input. It is intended for
 * component protocols such as a fully relaxed passive chamber PV relation;
 * dynamic trials must continue to use trialHillCeSeeSlsV1.
 */
export function evaluateHillPassiveEquilibriumV1(
  totalStrain: number,
  params: HillCeSeeSlsParamsV1 = DEFAULT_HILL_CE_SEE_SLS_PARAMS_V1,
): HillPassiveEquilibriumEvaluationV1 {
  const parameterErrors = PREPARED_HILL_CE_SEE_SLS_PARAM_OBJECTS_V1.has(params)
    ? []
    : validateHillCeSeeSlsParamsV1(params);
  if (parameterErrors.length > 0) {
    return Object.freeze({
      valid: false,
      finite: nestedNumbersFinite(params) && Number.isFinite(totalStrain),
      failureReason: parameterErrors.join("; "),
      totalStrain,
      stressPa: null,
      tangentPa: null,
      storageJPerM3: null,
    });
  }
  if (!Number.isFinite(totalStrain)) {
    return Object.freeze({
      valid: false,
      finite: false,
      failureReason: "totalStrain must be finite",
      totalStrain,
      stressPa: null,
      tangentPa: null,
      storageJPerM3: null,
    });
  }
  const passive = evaluatePassiveEquilibrium(totalStrain, params);
  if (!passive.finite) {
    return Object.freeze({
      valid: false,
      finite: false,
      failureReason:
        "passive equilibrium evaluation exceeded its finite numerical domain",
      totalStrain,
      stressPa: null,
      tangentPa: null,
      storageJPerM3: null,
    });
  }
  return Object.freeze({
    valid: true,
    finite: true,
    failureReason: null,
    totalStrain,
    stressPa: passive.stressPa,
    tangentPa: passive.tangentPa,
    storageJPerM3: passive.storageJPerM3,
  });
}

/** Pure trial update. Invalid domains are returned as structured failed trials. */
export function trialHillCeSeeSlsV1(
  acceptedState: HillCeSeeSlsStateV1,
  input: HillCeSeeSlsTrialInputV1,
  params: HillCeSeeSlsParamsV1 = DEFAULT_HILL_CE_SEE_SLS_PARAMS_V1,
): HillCeSeeSlsTrialV1 {
  const parameterErrors = PREPARED_HILL_CE_SEE_SLS_PARAM_OBJECTS_V1.has(params)
    ? []
    : validateHillCeSeeSlsParamsV1(params);
  if (parameterErrors.length > 0) {
    return invalidTrial(
      acceptedState,
      input,
      [
        {
          code: "INVALID_PARAMETERS",
          message: parameterErrors.join("; "),
        },
      ],
      nestedNumbersFinite(params),
    );
  }

  const stateErrors = validateAcceptedState(acceptedState, params);
  if (stateErrors.length > 0) {
    return invalidTrial(
      acceptedState,
      input,
      [
        {
          code: "INVALID_ACCEPTED_STATE",
          message: stateErrors.join("; "),
        },
      ],
      everyFinite([
        acceptedState.totalStrain,
        acceptedState.ceStrain,
        acceptedState.slsOverstressPa,
        acceptedState.caTroponin01,
        ...(acceptedState.thinFilamentAvailability01 === undefined
          ? []
          : [acceptedState.thinFilamentAvailability01]),
      ]),
    );
  }
  const inputErrors = validateInput(input);
  if (inputErrors.length > 0) {
    return invalidTrial(
      acceptedState,
      input,
      [
        {
          code: "INVALID_TRIAL_INPUT",
          message: inputErrors.join("; "),
        },
      ],
      everyFinite([
        input.dtSec,
        input.totalStrain,
        input.freeCalciumUm,
        input.midpointFreeCalciumUm ?? input.freeCalciumUm,
      ]),
    );
  }

  const rootSolution = solveAllSerialRoots(
    acceptedState.ceStrain,
    acceptedState.caTroponin01,
    acceptedState.thinFilamentAvailability01,
    input.totalStrain,
    input.midpointFreeCalciumUm ?? input.freeCalciumUm,
    input.dtSec,
    params,
  );
  if (!rootSolution.finite) {
    return invalidTrial(
      acceptedState,
      input,
      [
        {
          code: "NONFINITE_CONSTITUTIVE_OUTPUT",
          message: "Serial root scan produced a non-finite stress or tangent",
        },
      ],
      false,
      rootSolution,
    );
  }
  if (rootSolution.candidates.length === 0) {
    return invalidTrial(
      acceptedState,
      input,
      [
        {
          code: "NO_SERIAL_ROOT",
          message:
            "No CE--SEE equilibrium root was found inside the configured CE domain",
        },
      ],
      true,
      rootSolution,
    );
  }
  if (rootSolution.selectedIndex === null) {
    const hasConvergedRoot = rootSolution.candidates.some(
      (candidate) => candidate.converged,
    );
    return invalidTrial(
      acceptedState,
      input,
      [
        {
          code: hasConvergedRoot
            ? "NO_STABLE_SERIAL_ROOT"
            : "NO_CONVERGED_SERIAL_ROOT",
          message: hasConvergedRoot
            ? "Converged serial roots exist, but none is mechanically stable or an admissible neutral unloaded continuation"
            : "Serial root candidates exist, but none meets the absolute-plus-relative force-balance tolerance",
        },
      ],
      true,
      rootSolution,
    );
  }

  const selectedCandidate =
    rootSolution.candidates[rootSolution.selectedIndex]!;
  const serial = evaluateSerialPoint(
    selectedCandidate.ceStrain,
    acceptedState.ceStrain,
    acceptedState.caTroponin01,
    acceptedState.thinFilamentAvailability01,
    input.totalStrain,
    input.midpointFreeCalciumUm ?? input.freeCalciumUm,
    input.dtSec,
    params,
  );
  const passive = evaluatePassiveEquilibrium(input.totalStrain, params);
  const sls = backwardEulerSlsTrial(
    acceptedState.slsOverstressPa,
    input.totalStrain - acceptedState.totalStrain,
    input.dtSec,
    params,
  );
  if (
    !serial.finite ||
    !serial.activationTrial.valid ||
    serial.activationTrial.nextState === null ||
    serial.activationTrial.readback === null ||
    !passive.finite ||
    !sls.finite
  ) {
    return invalidTrial(
      acceptedState,
      input,
      [
        {
          code: "NONFINITE_CONSTITUTIVE_OUTPUT",
          message:
            "Constitutive evaluation exceeded its finite numerical domain",
        },
      ],
      false,
      rootSolution,
    );
  }

  const nextState: HillCeSeeSlsStateV1 = Object.freeze({
    totalStrain: input.totalStrain,
    ceStrain: selectedCandidate.ceStrain,
    slsOverstressPa: sls.overstressPa,
    caTroponin01: serial.activationTrial.nextState.caTroponin01,
    ...(serial.activationTrial.nextState.thinFilamentAvailability01 ===
    undefined
      ? {}
      : {
          thinFilamentAvailability01:
            serial.activationTrial.nextState.thinFilamentAvailability01,
        }),
  });
  const previousSeries = evaluateSeriesElasticElement(
    acceptedState.totalStrain - acceptedState.ceStrain,
    params,
  );
  if (!previousSeries.finite) {
    return invalidTrial(
      acceptedState,
      input,
      [
        {
          code: "NONFINITE_CONSTITUTIVE_OUTPUT",
          message:
            "Accepted SEE state lies outside the finite numerical domain",
        },
      ],
      false,
      rootSolution,
    );
  }

  const stresses: HillCeSeeSlsStressReadbackV1 = Object.freeze({
    passiveEquilibriumPa: passive.stressPa,
    contractileElementTensionPa: serial.contractileTensionPa,
    seriesElasticTensionPa: serial.series.tensionPa,
    slsOverstressPa: sls.overstressPa,
    totalTransmittedPa:
      passive.stressPa + serial.series.tensionPa + sls.overstressPa,
    serialEquilibriumResidualPa: serial.residualPa,
  });
  const serialTransmittedAlgorithmicPa =
    serial.stabilityPa > 0
      ? (serial.series.tangentPa * serial.contractileAlgorithmicTangentPa) /
        serial.stabilityPa
      : 0;
  const tangentsPa: HillCeSeeSlsTangentReadbackV1 = Object.freeze({
    passiveEquilibriumPa: passive.tangentPa,
    contractileElementAlgorithmicPa: serial.contractileAlgorithmicTangentPa,
    seriesElasticPa: serial.series.tangentPa,
    serialStabilityPa: serial.stabilityPa,
    serialTransmittedAlgorithmicPa,
    slsAlgorithmicPa: sls.algorithmicTangentPa,
    totalTransmittedAlgorithmicPa:
      passive.tangentPa +
      serialTransmittedAlgorithmicPa +
      sls.algorithmicTangentPa,
  });
  const energies: HillCeSeeSlsEnergyReadbackV1 = Object.freeze({
    passiveEquilibriumStorageJPerM3: passive.storageJPerM3,
    seriesElasticStorageJPerM3: serial.series.storageJPerM3,
    slsStorageJPerM3: sls.storageJPerM3,
    totalStoredJPerM3:
      passive.storageJPerM3 + serial.series.storageJPerM3 + sls.storageJPerM3,
  });
  const totalStrainIncrement = input.totalStrain - acceptedState.totalStrain;
  const ceStrainIncrement = selectedCandidate.ceStrain - acceptedState.ceStrain;
  const seriesStrainIncrement = totalStrainIncrement - ceStrainIncrement;
  const seriesStorageIncrement =
    serial.series.storageJPerM3 - previousSeries.storageJPerM3;
  const seriesEndpointWork = serial.series.tensionPa * seriesStrainIncrement;
  const seriesNumericalDissipation = Math.max(
    0,
    seriesEndpointWork - seriesStorageIncrement,
  );
  const serialWork: HillCeSeeSlsSerialWorkReadbackV1 = Object.freeze({
    boundaryWorkIncrementJPerM3: serial.series.tensionPa * totalStrainIncrement,
    contractileElementMechanicalWorkIncrementJPerM3:
      serial.contractileTensionPa * ceStrainIncrement,
    seriesElasticStorageIncrementJPerM3: seriesStorageIncrement,
    seriesElasticBackwardEulerNumericalDissipationJPerM3:
      seriesNumericalDissipation,
    discreteBalanceResidualJPerM3:
      serial.series.tensionPa * totalStrainIncrement -
      serial.contractileTensionPa * ceStrainIncrement -
      seriesStorageIncrement -
      seriesNumericalDissipation,
    activeChemicalEnergyModelled: false,
    activeChemicalEnergyClaim: "unmodelled-in-v1",
  });
  const readback: HillCeSeeSlsReadbackV1 = Object.freeze({
    freeCalciumUm: input.freeCalciumUm,
    caTroponin01: serial.activationTrial.readback.caTroponin01,
    thinFilamentAvailability01:
      serial.activationTrial.readback.thinFilamentAvailability01,
    activation01: serial.activationTrial.readback.thinFilamentAvailability01,
    calciumTroponinActivation: serial.activationTrial.readback,
    strains: Object.freeze({
      total: input.totalStrain,
      contractileElement: selectedCandidate.ceStrain,
      seriesElasticElement: input.totalStrain - selectedCandidate.ceStrain,
      totalRatePerSec: totalStrainIncrement / input.dtSec,
      contractileElementRatePerSec: ceStrainIncrement / input.dtSec,
    }),
    factors: Object.freeze({
      activeLength: serial.lengthFactor,
      forceVelocity: serial.forceVelocityFactor,
    }),
    stresses,
    tangentsPa,
    energies,
    serialWork,
    slsBalance: sls.balance,
    kinematicClaim: HILL_CE_SEE_SLS_KINEMATIC_CLAIM_V1,
  });
  const finite = everyFinite([
    nextState.totalStrain,
    nextState.ceStrain,
    nextState.slsOverstressPa,
    nextState.caTroponin01,
    ...(nextState.thinFilamentAvailability01 === undefined
      ? []
      : [nextState.thinFilamentAvailability01]),
    readback.freeCalciumUm,
    readback.caTroponin01,
    readback.thinFilamentAvailability01,
    readback.activation01,
    ...Object.values(stresses),
    ...Object.values(tangentsPa),
    ...Object.values(energies),
    ...Object.values(readback.strains),
    ...Object.values(readback.factors),
    ...numericValues(serialWork),
    ...Object.values(sls.balance),
  ]);
  if (!finite) {
    return invalidTrial(
      acceptedState,
      input,
      [
        {
          code: "NONFINITE_CONSTITUTIVE_OUTPUT",
          message: "Readback assembly produced a non-finite quantity",
        },
      ],
      false,
      rootSolution,
    );
  }

  return Object.freeze({
    previousState: acceptedState,
    nextState,
    readback,
    solver: solverReadback(rootSolution, Math.abs(serial.residualPa)),
    valid: true,
    finite: true,
    issues: Object.freeze([]),
  });
}

export function commitHillCeSeeSlsTrialV1(
  trial: HillCeSeeSlsTrialV1,
): HillCeSeeSlsStateV1 {
  if (!trial.valid || !trial.finite || !trial.solver.converged) {
    throw new Error(
      "Cannot commit an invalid, non-finite, or unconverged HillCeSeeSlsV1 trial",
    );
  }
  return Object.freeze({ ...trial.nextState });
}

export function hillCeLengthFactorV1(
  ceStrain: number,
  params: HillCeSeeSlsParamsV1 = DEFAULT_HILL_CE_SEE_SLS_PARAMS_V1,
): number {
  return evaluateLengthFactor(ceStrain, params).value;
}

/**
 * Regularized classical Hill relation. Negative velocity is shortening.  The
 * branch reaches exactly zero force at finite -v_max and stays unloaded below
 * it; positive velocity saturates on the eccentric/lengthening branch.
 */
export function hillCeForceVelocityFactorV1(
  ceStrainRatePerSec: number,
  params: HillCeSeeSlsParamsV1 = DEFAULT_HILL_CE_SEE_SLS_PARAMS_V1,
): number {
  return evaluateForceVelocityFactor(ceStrainRatePerSec, params).value;
}

/** Exact inverse of the unregularized shortening Hill hyperbola on f in [0,1]. */
export function hillCeClassicalShorteningVelocityFromForceFactorV1(
  forceFactor01: number,
  params: HillCeSeeSlsParamsV1 = DEFAULT_HILL_CE_SEE_SLS_PARAMS_V1,
): number {
  if (
    !Number.isFinite(forceFactor01) ||
    forceFactor01 < 0 ||
    forceFactor01 > 1
  ) {
    throw new RangeError("forceFactor01 must be finite and inside [0,1]");
  }
  const ce = params.contractileElement;
  return (
    (-ce.hillCurvatureRatio *
      ce.maximumShorteningVelocityPerSec *
      (1 - forceFactor01)) /
    (forceFactor01 + ce.hillCurvatureRatio)
  );
}

export function validateHillCeSeeSlsParamsV1(
  params: HillCeSeeSlsParamsV1,
): readonly string[] {
  const errors: string[] = [];
  if (
    typeof params.parameterSetId !== "string" ||
    params.parameterSetId.trim().length === 0
  ) {
    errors.push("parameterSetId must be a non-empty string");
  }
  const passive = params.passive;
  const ce = params.contractileElement;
  const see = params.seriesElasticElement;
  const sls = params.sls;
  const solver = params.solver;
  for (const issue of validateLandFormCaTroponinActivationParamsV1(
    params.calciumTroponinActivation,
  )) {
    errors.push(`calciumTroponinActivation.${issue.message}`);
  }
  positive(errors, "passive.tangentModulusPa", passive.tangentModulusPa);
  positive(errors, "passive.exponentialSlope", passive.exponentialSlope);
  finite(errors, "passive.referenceStrain", passive.referenceStrain);
  positive(
    errors,
    "passive.tensionTransitionStrain",
    passive.tensionTransitionStrain,
  );
  nonnegative(
    errors,
    "contractileElement.maximumIsometricTensionPa",
    ce.maximumIsometricTensionPa,
  );
  finite(errors, "contractileElement.optimalStrain", ce.optimalStrain);
  positive(errors, "contractileElement.lengthWidth", ce.lengthWidth);
  nonnegative(
    errors,
    "contractileElement.minimumLengthFactor",
    ce.minimumLengthFactor,
  );
  positive(
    errors,
    "contractileElement.maximumLengthFactor",
    ce.maximumLengthFactor,
  );
  if (ce.maximumLengthFactor < ce.minimumLengthFactor) {
    errors.push(
      "contractileElement.maximumLengthFactor must be >= minimumLengthFactor",
    );
  }
  positive(
    errors,
    "contractileElement.hillCurvatureRatio",
    ce.hillCurvatureRatio,
  );
  positive(
    errors,
    "contractileElement.maximumShorteningVelocityPerSec",
    ce.maximumShorteningVelocityPerSec,
  );
  positive(
    errors,
    "contractileElement.unloadedTransitionWidthPerSec",
    ce.unloadedTransitionWidthPerSec,
  );
  if (
    Number.isFinite(ce.unloadedTransitionWidthPerSec) &&
    Number.isFinite(ce.maximumShorteningVelocityPerSec) &&
    ce.unloadedTransitionWidthPerSec >= ce.maximumShorteningVelocityPerSec
  ) {
    errors.push(
      "contractileElement.unloadedTransitionWidthPerSec must be < maximumShorteningVelocityPerSec",
    );
  }
  if (
    Number.isFinite(ce.unloadedTransitionWidthPerSec) &&
    Number.isFinite(ce.maximumShorteningVelocityPerSec) &&
    Number.isFinite(ce.hillCurvatureRatio) &&
    ce.unloadedTransitionWidthPerSec >=
      (2 / 3) * (ce.hillCurvatureRatio + 1) * ce.maximumShorteningVelocityPerSec
  ) {
    errors.push(
      "contractileElement.unloadedTransitionWidthPerSec is too wide for a monotone C1 unloaded ramp",
    );
  }
  if (
    !Number.isFinite(ce.maximumLengtheningForceVelocityFactor) ||
    ce.maximumLengtheningForceVelocityFactor < 1
  ) {
    errors.push(
      "contractileElement.maximumLengtheningForceVelocityFactor must be finite and >= 1",
    );
  }
  positive(
    errors,
    "contractileElement.lengtheningVelocityScalePerSec",
    ce.lengtheningVelocityScalePerSec,
  );
  positive(
    errors,
    "contractileElement.forceVelocityTransitionHalfWidthPerSec",
    ce.forceVelocityTransitionHalfWidthPerSec,
  );
  if (
    ce.forceVelocityTransitionHalfWidthPerSec >=
    ce.maximumShorteningVelocityPerSec
  ) {
    errors.push(
      "contractileElement.forceVelocityTransitionHalfWidthPerSec must be < maximumShorteningVelocityPerSec",
    );
  }
  if (
    Number.isFinite(ce.unloadedTransitionWidthPerSec) &&
    Number.isFinite(ce.forceVelocityTransitionHalfWidthPerSec) &&
    Number.isFinite(ce.maximumShorteningVelocityPerSec) &&
    ce.unloadedTransitionWidthPerSec +
      ce.forceVelocityTransitionHalfWidthPerSec >=
      ce.maximumShorteningVelocityPerSec
  ) {
    errors.push(
      "contractileElement unloaded and zero-velocity transition regions must not overlap",
    );
  }
  finite(errors, "contractileElement.minimumStrain", ce.minimumStrain);
  finite(errors, "contractileElement.maximumStrain", ce.maximumStrain);
  if (!(ce.maximumStrain > ce.minimumStrain)) {
    errors.push("contractileElement.maximumStrain must be > minimumStrain");
  }
  if (
    Number.isFinite(ce.maximumStrain) &&
    Number.isFinite(
      params.calciumTroponinActivation.maximumLinearCeStretchExclusive,
    ) &&
    Math.exp(ce.maximumStrain) >=
      params.calciumTroponinActivation.maximumLinearCeStretchExclusive
  ) {
    errors.push(
      "contractileElement.maximumStrain must stay below the open Land-form linear CE-stretch bound",
    );
  }
  finite(errors, "seriesElasticElement.slackStrain", see.slackStrain);
  positive(
    errors,
    "seriesElasticElement.tensionTransitionStrain",
    see.tensionTransitionStrain,
  );
  positive(
    errors,
    "seriesElasticElement.linearStiffnessPa",
    see.linearStiffnessPa,
  );
  nonnegative(
    errors,
    "seriesElasticElement.cubicStiffnessPa",
    see.cubicStiffnessPa,
  );
  nonnegative(errors, "sls.modulusPa", sls.modulusPa);
  positive(errors, "sls.relaxationTimeSec", sls.relaxationTimeSec);
  positive(
    errors,
    "solver.absoluteStressTolerancePa",
    solver.absoluteStressTolerancePa,
  );
  positive(
    errors,
    "solver.relativeStressTolerance",
    solver.relativeStressTolerance,
  );
  positive(errors, "solver.strainTolerance", solver.strainTolerance);
  positive(
    errors,
    "solver.minimumStableAlgorithmicStiffnessPa",
    solver.minimumStableAlgorithmicStiffnessPa,
  );
  if (
    !Number.isInteger(solver.maximumIterations) ||
    solver.maximumIterations < 1
  ) {
    errors.push("solver.maximumIterations must be an integer >= 1");
  }
  if (typeof solver.preferLocalContinuation !== "boolean") {
    errors.push("solver.preferLocalContinuation must be boolean");
  }
  if (
    !Number.isInteger(solver.maximumLocalContinuationIterations) ||
    solver.maximumLocalContinuationIterations < 1
  ) {
    errors.push(
      "solver.maximumLocalContinuationIterations must be an integer >= 1",
    );
  }
  if (
    !Number.isFinite(solver.minimumLocalLineSearchStep) ||
    solver.minimumLocalLineSearchStep <= 0 ||
    solver.minimumLocalLineSearchStep > 1
  ) {
    errors.push("solver.minimumLocalLineSearchStep must lie inside (0,1]");
  }
  if (
    !Number.isInteger(solver.rootScanSubdivisions) ||
    solver.rootScanSubdivisions < 16
  ) {
    errors.push("solver.rootScanSubdivisions must be an integer >= 16");
  }
  if (
    !Number.isInteger(solver.maximumAdaptiveRootDepth) ||
    solver.maximumAdaptiveRootDepth < 1
  ) {
    errors.push("solver.maximumAdaptiveRootDepth must be an integer >= 1");
  }
  return errors;
}

type SerialElementEvaluation = {
  readonly finite: boolean;
  readonly residualPa: number;
  readonly contractileTensionPa: number;
  readonly contractileAlgorithmicTangentPa: number;
  readonly stabilityPa: number;
  readonly lengthFactor: number;
  readonly forceVelocityFactor: number;
  readonly activationTrial: LandFormCaTroponinActivationMidpointTrialV2;
  readonly series: SeriesEvaluation;
};

type SeriesEvaluation = {
  readonly finite: boolean;
  readonly tensionPa: number;
  readonly tangentPa: number;
  readonly storageJPerM3: number;
};

type RootSolution = {
  readonly finite: boolean;
  readonly candidates: readonly HillCeSeeSlsRootCandidateV1[];
  readonly selectedIndex: number | null;
  readonly iterations: number;
  readonly signBracketCount: number;
};

type SerialScanNode = {
  readonly strain: number;
  readonly serial: SerialElementEvaluation;
};

function solveAllSerialRoots(
  previousCeStrain: number,
  previousCaTroponin01: number,
  previousThinFilamentAvailability01: number | undefined,
  totalStrain: number,
  freeCalciumUm: number,
  dtSec: number,
  params: HillCeSeeSlsParamsV1,
): RootSolution {
  const ce = params.contractileElement;
  const analyticNeutral = analyticUnloadedNeutralContinuation(
    previousCeStrain,
    previousCaTroponin01,
    previousThinFilamentAvailability01,
    totalStrain,
    freeCalciumUm,
    dtSec,
    params,
  );
  if (params.solver.preferLocalContinuation && analyticNeutral !== null) {
    return {
      finite: true,
      candidates: Object.freeze([Object.freeze(analyticNeutral)]),
      selectedIndex: 0,
      iterations: 0,
      signBracketCount: 0,
    };
  }
  if (params.solver.preferLocalContinuation) {
    const local = tryLocalContinuationRoot(
      previousCeStrain,
      previousCaTroponin01,
      previousThinFilamentAvailability01,
      totalStrain,
      freeCalciumUm,
      dtSec,
      params,
    );
    if (local !== null) return local;
  }
  const subdivisions = params.solver.rootScanSubdivisions;
  const width = ce.maximumStrain - ce.minimumStrain;
  let evaluations: SerialScanNode[] = [];
  const structuralNodes = [
    ce.minimumStrain,
    ce.maximumStrain,
    previousCeStrain,
    previousCeStrain - ce.maximumShorteningVelocityPerSec * dtSec,
    previousCeStrain -
      (ce.maximumShorteningVelocityPerSec - ce.unloadedTransitionWidthPerSec) *
        dtSec,
    previousCeStrain - ce.forceVelocityTransitionHalfWidthPerSec * dtSec,
    previousCeStrain + ce.forceVelocityTransitionHalfWidthPerSec * dtSec,
    totalStrain - params.seriesElasticElement.slackStrain,
    ce.optimalStrain,
    ce.optimalStrain - ce.lengthWidth,
    ce.optimalStrain + ce.lengthWidth,
  ];
  const scanNodes = Array.from(
    { length: subdivisions + 1 },
    (_, index) => ce.minimumStrain + (width * index) / subdivisions,
  );
  for (const node of structuralNodes) {
    if (node >= ce.minimumStrain && node <= ce.maximumStrain)
      scanNodes.push(node);
  }
  appendFeatureNeighborhoodNodes(
    scanNodes,
    ce.optimalStrain,
    ce.lengthWidth,
    ce,
  );
  appendFeatureNeighborhoodNodes(
    scanNodes,
    previousCeStrain - ce.maximumShorteningVelocityPerSec * dtSec,
    ce.unloadedTransitionWidthPerSec * dtSec,
    ce,
  );
  appendFeatureNeighborhoodNodes(
    scanNodes,
    previousCeStrain - ce.forceVelocityTransitionHalfWidthPerSec * dtSec,
    ce.forceVelocityTransitionHalfWidthPerSec * dtSec,
    ce,
  );
  appendFeatureNeighborhoodNodes(
    scanNodes,
    previousCeStrain + ce.forceVelocityTransitionHalfWidthPerSec * dtSec,
    ce.forceVelocityTransitionHalfWidthPerSec * dtSec,
    ce,
  );
  appendFeatureNeighborhoodNodes(
    scanNodes,
    totalStrain - params.seriesElasticElement.slackStrain,
    params.seriesElasticElement.tensionTransitionStrain,
    ce,
  );
  scanNodes.sort((a, b) => a - b);
  const uniqueScanNodes = scanNodes.filter(
    (node, index) =>
      index === 0 ||
      Math.abs(node - scanNodes[index - 1]!) >
        Number.EPSILON * Math.max(1, Math.abs(node)),
  );
  for (const strain of uniqueScanNodes) {
    const serial = evaluateSerialPoint(
      strain,
      previousCeStrain,
      previousCaTroponin01,
      previousThinFilamentAvailability01,
      totalStrain,
      freeCalciumUm,
      dtSec,
      params,
    );
    if (!serial.finite) {
      return {
        finite: false,
        candidates: [],
        selectedIndex: null,
        iterations: 0,
        signBracketCount: 0,
      };
    }
    evaluations.push({ strain, serial });
  }
  const adaptiveEvaluations = adaptRootScanNodes(
    evaluations,
    previousCeStrain,
    previousCaTroponin01,
    previousThinFilamentAvailability01,
    totalStrain,
    freeCalciumUm,
    dtSec,
    params,
  );
  if (adaptiveEvaluations === null) {
    return {
      finite: false,
      candidates: [],
      selectedIndex: null,
      iterations: 0,
      signBracketCount: 0,
    };
  }
  evaluations = adaptiveEvaluations;

  const candidates: HillCeSeeSlsRootCandidateV1[] = [];
  if (analyticNeutral !== null)
    addCandidate(candidates, analyticNeutral, params);
  let iterations = 0;
  let signBracketCount = 0;
  for (let index = 0; index < evaluations.length - 1; index += 1) {
    const left = evaluations[index]!;
    const right = evaluations[index + 1]!;
    if (oppositeSigns(left.serial.residualPa, right.serial.residualPa)) {
      const refined = refineSignBracket(
        left.strain,
        right.strain,
        left.serial.residualPa,
        previousCeStrain,
        previousCaTroponin01,
        previousThinFilamentAvailability01,
        totalStrain,
        freeCalciumUm,
        dtSec,
        params,
      );
      iterations += refined.iterations;
      signBracketCount += 1;
      addCandidate(
        candidates,
        candidateFromEvaluation(
          refined.strain,
          refined.serial,
          "sign-bracket",
          params,
        ),
        params,
      );
    }
  }

  let runStart = -1;
  for (let index = 0; index <= evaluations.length; index += 1) {
    const insideZeroRun =
      index < evaluations.length &&
      serialResidualConverged(evaluations[index]!.serial, params);
    if (insideZeroRun && runStart < 0) runStart = index;
    if (!insideZeroRun && runStart >= 0) {
      const runEnd = index - 1;
      const startNode = evaluations[runStart]!;
      const endNode = evaluations[runEnd]!;
      const leftOutside = runStart > 0 ? evaluations[runStart - 1]! : null;
      const rightOutside =
        runEnd < evaluations.length - 1 ? evaluations[runEnd + 1]! : null;
      if (
        leftOutside !== null &&
        rightOutside !== null &&
        oppositeSigns(
          leftOutside.serial.residualPa,
          rightOutside.serial.residualPa,
        )
      ) {
        const refined = refineSignBracket(
          leftOutside.strain,
          rightOutside.strain,
          leftOutside.serial.residualPa,
          previousCeStrain,
          previousCaTroponin01,
          previousThinFilamentAvailability01,
          totalStrain,
          freeCalciumUm,
          dtSec,
          params,
        );
        iterations += refined.iterations;
        signBracketCount += 1;
        addCandidate(
          candidates,
          candidateFromEvaluation(
            refined.strain,
            refined.serial,
            "sign-bracket",
            params,
          ),
          params,
        );
      }
      if (runStart > 0) {
        const outside = leftOutside!;
        const refined = refineZeroBoundary(
          outside.strain,
          startNode.strain,
          previousCeStrain,
          previousCaTroponin01,
          previousThinFilamentAvailability01,
          totalStrain,
          freeCalciumUm,
          dtSec,
          params,
        );
        iterations += refined.iterations;
        addCandidate(
          candidates,
          candidateFromEvaluation(
            refined.strain,
            refined.serial,
            "zero-manifold-boundary",
            params,
          ),
          params,
        );
      } else {
        addCandidate(
          candidates,
          candidateFromEvaluation(
            startNode.strain,
            startNode.serial,
            "zero-manifold-boundary",
            params,
          ),
          params,
        );
      }

      const continuationStrain = clamp(
        previousCeStrain,
        startNode.strain,
        endNode.strain,
      );
      const continuation = evaluateSerialPoint(
        continuationStrain,
        previousCeStrain,
        previousCaTroponin01,
        previousThinFilamentAvailability01,
        totalStrain,
        freeCalciumUm,
        dtSec,
        params,
      );
      addCandidate(
        candidates,
        candidateFromEvaluation(
          continuationStrain,
          continuation,
          "zero-manifold-continuation",
          params,
        ),
        params,
      );

      if (runEnd < evaluations.length - 1) {
        const outside = rightOutside!;
        const refined = refineZeroBoundary(
          outside.strain,
          endNode.strain,
          previousCeStrain,
          previousCaTroponin01,
          previousThinFilamentAvailability01,
          totalStrain,
          freeCalciumUm,
          dtSec,
          params,
        );
        iterations += refined.iterations;
        addCandidate(
          candidates,
          candidateFromEvaluation(
            refined.strain,
            refined.serial,
            "zero-manifold-boundary",
            params,
          ),
          params,
        );
      } else {
        addCandidate(
          candidates,
          candidateFromEvaluation(
            endNode.strain,
            endNode.serial,
            "zero-manifold-boundary",
            params,
          ),
          params,
        );
      }
      runStart = -1;
    }
  }

  const admissibleCandidateIndices = candidates
    .map((candidate, index) => ({ candidate, index }))
    .filter(({ candidate }) => candidate.admissible)
    .sort((a, b) => {
      const distance =
        Math.abs(a.candidate.ceStrain - previousCeStrain) -
        Math.abs(b.candidate.ceStrain - previousCeStrain);
      if (Math.abs(distance) > params.solver.strainTolerance) return distance;
      const residual =
        Math.abs(a.candidate.residualPa) - Math.abs(b.candidate.residualPa);
      if (residual !== 0) return residual;
      return a.candidate.ceStrain - b.candidate.ceStrain;
    });

  return {
    finite: true,
    candidates: Object.freeze(
      candidates.map((candidate) => Object.freeze(candidate)),
    ),
    selectedIndex: admissibleCandidateIndices[0]?.index ?? null,
    iterations,
    signBracketCount,
  };
}

/**
 * Exact neutral set created by the overlap of the unloaded Hill branch and a
 * slack SEE:
 *
 *   epsilon_CE <= epsilon_CE^n - v_max dt,
 *   epsilon_CE >= epsilon_total - epsilon_SE,slack.
 *
 * Selecting this set analytically prevents a local Newton iteration from
 * accepting a nearby residual-tolerance contour as a loaded stable root.  A
 * tiny inward offset is used only to represent the closed -v_max endpoint
 * robustly in floating point; its scale is set by the configured strain
 * tolerance and machine precision.
 */
function analyticUnloadedNeutralContinuation(
  previousCeStrain: number,
  previousCaTroponin01: number,
  previousThinFilamentAvailability01: number | undefined,
  totalStrain: number,
  freeCalciumUm: number,
  dtSec: number,
  params: HillCeSeeSlsParamsV1,
): HillCeSeeSlsRootCandidateV1 | null {
  const ce = params.contractileElement;
  const lower = Math.max(
    ce.minimumStrain,
    totalStrain - params.seriesElasticElement.slackStrain,
  );
  const upper = Math.min(
    ce.maximumStrain,
    previousCeStrain - ce.maximumShorteningVelocityPerSec * dtSec,
  );
  if (lower > upper) return null;

  const continuation = clamp(previousCeStrain, lower, upper);
  const intervalWidth = upper - lower;
  const floatingMargin = Math.max(
    4 * params.solver.strainTolerance,
    32 * Number.EPSILON * Math.max(1, Math.abs(lower), Math.abs(upper)),
  );
  const inwardMargin = Math.min(floatingMargin, 0.5 * intervalWidth);
  const strain =
    continuation >= upper - inwardMargin ? upper - inwardMargin : continuation;
  const serial = evaluateSerialPoint(
    strain,
    previousCeStrain,
    previousCaTroponin01,
    previousThinFilamentAvailability01,
    totalStrain,
    freeCalciumUm,
    dtSec,
    params,
  );
  if (!serial.finite) return null;

  const base = candidateFromEvaluation(
    strain,
    serial,
    "zero-manifold-continuation",
    params,
  );
  const nearZeroTolerancePa = base.residualTolerancePa;
  if (
    !base.converged ||
    Math.abs(serial.contractileTensionPa) > nearZeroTolerancePa ||
    Math.abs(serial.series.tensionPa) > nearZeroTolerancePa
  ) {
    return null;
  }
  return {
    ...base,
    neutralZeroManifold: true,
    admissible: true,
  };
}

/**
 * Fast physical-branch continuation.  This uses the exact same constitutive
 * residual and tangent as the all-root solver, and falls back to the latter if
 * the accepted branch cannot be followed monotonically.  It is therefore an
 * algorithmic acceleration, not a different material law.
 */
function tryLocalContinuationRoot(
  previousCeStrain: number,
  previousCaTroponin01: number,
  previousThinFilamentAvailability01: number | undefined,
  totalStrain: number,
  freeCalciumUm: number,
  dtSec: number,
  params: HillCeSeeSlsParamsV1,
): RootSolution | null {
  const ce = params.contractileElement;
  let strain = clamp(previousCeStrain, ce.minimumStrain, ce.maximumStrain);
  let serial = evaluateSerialPoint(
    strain,
    previousCeStrain,
    previousCaTroponin01,
    previousThinFilamentAvailability01,
    totalStrain,
    freeCalciumUm,
    dtSec,
    params,
  );
  if (!serial.finite) return null;

  for (
    let iteration = 0;
    iteration <= params.solver.maximumLocalContinuationIterations;
    iteration += 1
  ) {
    const candidate = candidateFromEvaluation(
      strain,
      serial,
      "local-continuation",
      params,
    );
    if (candidate.admissible) {
      return {
        finite: true,
        candidates: Object.freeze([Object.freeze(candidate)]),
        selectedIndex: 0,
        iterations: iteration,
        signBracketCount: 0,
      };
    }
    if (
      !(serial.stabilityPa > params.solver.minimumStableAlgorithmicStiffnessPa)
    )
      return null;

    const fullStep = serial.residualPa / serial.stabilityPa;
    if (
      !Number.isFinite(fullStep) ||
      Math.abs(fullStep) <= params.solver.strainTolerance
    ) {
      return null;
    }
    const previousMetric = serialResidualMetric(serial, params);
    let lineSearch = 1;
    let accepted: {
      readonly strain: number;
      readonly serial: SerialElementEvaluation;
    } | null = null;
    while (lineSearch >= params.solver.minimumLocalLineSearchStep) {
      const trialStrain = clamp(
        strain + lineSearch * fullStep,
        ce.minimumStrain,
        ce.maximumStrain,
      );
      if (Math.abs(trialStrain - strain) <= params.solver.strainTolerance)
        break;
      const trial = evaluateSerialPoint(
        trialStrain,
        previousCeStrain,
        previousCaTroponin01,
        previousThinFilamentAvailability01,
        totalStrain,
        freeCalciumUm,
        dtSec,
        params,
      );
      if (
        trial.finite &&
        serialResidualMetric(trial, params) < previousMetric
      ) {
        accepted = { strain: trialStrain, serial: trial };
        break;
      }
      lineSearch *= 0.5;
    }
    if (accepted === null) return null;
    strain = accepted.strain;
    serial = accepted.serial;
  }
  return null;
}

function appendFeatureNeighborhoodNodes(
  nodes: number[],
  centre: number,
  featureScale: number,
  ce: HillCeSeeSlsParamsV1["contractileElement"],
): void {
  if (
    !Number.isFinite(centre) ||
    !Number.isFinite(featureScale) ||
    featureScale <= 0
  )
    return;
  // Six feature widths on either side with four samples per width.  This keeps
  // narrow fitted length/velocity/slack transitions visible without imposing a
  // uniformly tiny scan spacing across the entire CE domain.
  for (let offsetIndex = -24; offsetIndex <= 24; offsetIndex += 1) {
    const strain = centre + (offsetIndex * featureScale) / 4;
    if (strain >= ce.minimumStrain && strain <= ce.maximumStrain)
      nodes.push(strain);
  }
}

function adaptRootScanNodes(
  baseNodes: readonly SerialScanNode[],
  previousCeStrain: number,
  previousCaTroponin01: number,
  previousThinFilamentAvailability01: number | undefined,
  totalStrain: number,
  freeCalciumUm: number,
  dtSec: number,
  params: HillCeSeeSlsParamsV1,
): SerialScanNode[] | null {
  if (baseNodes.length < 2) return [...baseNodes];
  const output: SerialScanNode[] = [];
  for (let index = 0; index < baseNodes.length - 1; index += 1) {
    const left = baseNodes[index]!;
    const right = baseNodes[index + 1]!;
    output.push(left);
    const interior = adaptiveRootScanInterior(
      left,
      right,
      0,
      previousCeStrain,
      previousCaTroponin01,
      previousThinFilamentAvailability01,
      totalStrain,
      freeCalciumUm,
      dtSec,
      params,
    );
    if (interior === null) return null;
    output.push(...interior);
  }
  output.push(baseNodes[baseNodes.length - 1]!);
  return output;
}

function adaptiveRootScanInterior(
  left: SerialScanNode,
  right: SerialScanNode,
  depth: number,
  previousCeStrain: number,
  previousCaTroponin01: number,
  previousThinFilamentAvailability01: number | undefined,
  totalStrain: number,
  freeCalciumUm: number,
  dtSec: number,
  params: HillCeSeeSlsParamsV1,
): SerialScanNode[] | null {
  if (right.strain - left.strain <= 2 * params.solver.strainTolerance)
    return [];
  const midpointStrain = 0.5 * (left.strain + right.strain);
  const midpoint: SerialScanNode = {
    strain: midpointStrain,
    serial: evaluateSerialPoint(
      midpointStrain,
      previousCeStrain,
      previousCaTroponin01,
      previousThinFilamentAvailability01,
      totalStrain,
      freeCalciumUm,
      dtSec,
      params,
    ),
  };
  if (!midpoint.serial.finite) return null;

  const leftResidual = left.serial.residualPa;
  const midpointResidual = midpoint.serial.residualPa;
  const rightResidual = right.serial.residualPa;
  const midpointIntroducesBrackets =
    !oppositeSigns(leftResidual, rightResidual) &&
    (oppositeSigns(leftResidual, midpointResidual) ||
      oppositeSigns(midpointResidual, rightResidual));
  const derivativeTurns =
    oppositeSigns(left.serial.stabilityPa, midpoint.serial.stabilityPa) ||
    oppositeSigns(midpoint.serial.stabilityPa, right.serial.stabilityPa);
  const endpointMagnitude = Math.min(
    Math.abs(leftResidual),
    Math.abs(rightResidual),
  );
  const interiorApproachesZero =
    endpointMagnitude > 0 &&
    Math.abs(midpointResidual) < 0.5 * endpointMagnitude;
  const containsContinuation =
    previousCeStrain > left.strain &&
    previousCeStrain < right.strain &&
    depth < 2;
  const shouldRefine =
    depth < params.solver.maximumAdaptiveRootDepth &&
    (midpointIntroducesBrackets ||
      derivativeTurns ||
      interiorApproachesZero ||
      containsContinuation);
  if (!shouldRefine) return [midpoint];

  const leftInterior = adaptiveRootScanInterior(
    left,
    midpoint,
    depth + 1,
    previousCeStrain,
    previousCaTroponin01,
    previousThinFilamentAvailability01,
    totalStrain,
    freeCalciumUm,
    dtSec,
    params,
  );
  if (leftInterior === null) return null;
  const rightInterior = adaptiveRootScanInterior(
    midpoint,
    right,
    depth + 1,
    previousCeStrain,
    previousCaTroponin01,
    previousThinFilamentAvailability01,
    totalStrain,
    freeCalciumUm,
    dtSec,
    params,
  );
  if (rightInterior === null) return null;
  return [...leftInterior, midpoint, ...rightInterior];
}

function evaluateSerialPoint(
  ceStrain: number,
  previousCeStrain: number,
  previousCaTroponin01: number,
  previousThinFilamentAvailability01: number | undefined,
  totalStrain: number,
  freeCalciumUm: number,
  dtSec: number,
  params: HillCeSeeSlsParamsV1,
): SerialElementEvaluation {
  const ceRate = (ceStrain - previousCeStrain) / dtSec;
  const length = evaluateLengthFactor(ceStrain, params);
  const forceVelocity = evaluateForceVelocityFactor(ceRate, params);
  const activationTrial = trialLandFormCaTroponinActivationMidpointV2(
    previousThinFilamentAvailability01 === undefined
      ? { caTroponin01: previousCaTroponin01 }
      : {
          caTroponin01: previousCaTroponin01,
          thinFilamentAvailability01: previousThinFilamentAvailability01,
        },
    {
      dtSec,
      midpointFreeCalciumUm: freeCalciumUm,
      previousContractileElementLogStrain: previousCeStrain,
      nextContractileElementLogStrain: ceStrain,
    },
    params.calciumTroponinActivation,
  );
  const activation = activationTrial.readback;
  const activation01 = activation?.thinFilamentAvailability01 ?? 0;
  const activationDerivative =
    activation?.thinFilamentAvailabilityDerivativePerNextLogStrain ?? 0;
  const activeScale = params.contractileElement.maximumIsometricTensionPa;
  const contractileTensionPa = activeScale * length.value * forceVelocity.value;
  const contractileAlgorithmicTangentPa =
    activeScale *
    (activationDerivative * length.value * forceVelocity.value +
      activation01 * length.derivativePerStrain * forceVelocity.value +
      (activation01 * length.value * forceVelocity.derivativeSec) / dtSec);
  const activatedContractileTensionPa = activation01 * contractileTensionPa;
  const series = evaluateSeriesElasticElement(totalStrain - ceStrain, params);
  const residualPa = series.tensionPa - activatedContractileTensionPa;
  const stabilityPa = series.tangentPa + contractileAlgorithmicTangentPa;
  return {
    finite:
      activationTrial.valid &&
      activationTrial.finite &&
      everyFinite([
        ceRate,
        length.value,
        length.derivativePerStrain,
        forceVelocity.value,
        forceVelocity.derivativeSec,
        activation01,
        activationDerivative,
        activatedContractileTensionPa,
        contractileAlgorithmicTangentPa,
        series.tensionPa,
        series.tangentPa,
        series.storageJPerM3,
        residualPa,
        stabilityPa,
      ]),
    residualPa,
    contractileTensionPa: activatedContractileTensionPa,
    contractileAlgorithmicTangentPa,
    stabilityPa,
    lengthFactor: length.value,
    forceVelocityFactor: forceVelocity.value,
    activationTrial,
    series,
  };
}

function serialResidualTolerancePa(
  serial: SerialElementEvaluation,
  params: HillCeSeeSlsParamsV1,
): number {
  const stressScalePa = Math.max(
    1,
    Math.abs(serial.contractileTensionPa),
    Math.abs(serial.series.tensionPa),
  );
  return (
    params.solver.absoluteStressTolerancePa +
    params.solver.relativeStressTolerance * stressScalePa
  );
}

function serialResidualConverged(
  serial: SerialElementEvaluation,
  params: HillCeSeeSlsParamsV1,
): boolean {
  return (
    Math.abs(serial.residualPa) <= serialResidualTolerancePa(serial, params)
  );
}

function serialResidualMetric(
  serial: SerialElementEvaluation,
  params: HillCeSeeSlsParamsV1,
): number {
  return (
    Math.abs(serial.residualPa) / serialResidualTolerancePa(serial, params)
  );
}

function evaluateLengthFactor(
  ceStrain: number,
  params: HillCeSeeSlsParamsV1,
): { readonly value: number; readonly derivativePerStrain: number } {
  const ce = params.contractileElement;
  const offset = ceStrain - ce.optimalStrain;
  const normalized = offset / ce.lengthWidth;
  const bell = Math.exp(-0.5 * normalized * normalized);
  const amplitude = ce.maximumLengthFactor - ce.minimumLengthFactor;
  return {
    value: ce.minimumLengthFactor + amplitude * bell,
    derivativePerStrain:
      (-amplitude * bell * offset) / (ce.lengthWidth * ce.lengthWidth),
  };
}

function evaluateForceVelocityFactor(
  velocityPerSec: number,
  params: HillCeSeeSlsParamsV1,
): { readonly value: number; readonly derivativeSec: number } {
  const ce = params.contractileElement;
  const vmax = ce.maximumShorteningVelocityPerSec;
  const alpha = ce.hillCurvatureRatio;
  const transition = ce.forceVelocityTransitionHalfWidthPerSec;
  const unloadedJoin = -vmax + ce.unloadedTransitionWidthPerSec;

  const classicalShortening = (
    velocity: number,
  ): { readonly value: number; readonly derivativeSec: number } => {
    const denominator = alpha * vmax - velocity;
    return {
      value: (alpha * (vmax + velocity)) / denominator,
      derivativeSec: (alpha * (alpha + 1) * vmax) / (denominator * denominator),
    };
  };
  const lengthening = (
    velocity: number,
  ): { readonly value: number; readonly derivativeSec: number } => {
    const exponential = Math.exp(-velocity / ce.lengtheningVelocityScalePerSec);
    return {
      value:
        1 + (ce.maximumLengtheningForceVelocityFactor - 1) * (1 - exponential),
      derivativeSec:
        ((ce.maximumLengtheningForceVelocityFactor - 1) * exponential) /
        ce.lengtheningVelocityScalePerSec,
    };
  };

  if (velocityPerSec <= -vmax) return { value: 0, derivativeSec: 0 };
  if (velocityPerSec < unloadedJoin) {
    const join = classicalShortening(unloadedJoin);
    return cubicHermiteWithDerivative(
      velocityPerSec,
      -vmax,
      unloadedJoin,
      0,
      join.value,
      0,
      join.derivativeSec,
    );
  }
  if (velocityPerSec <= -transition) return classicalShortening(velocityPerSec);
  if (velocityPerSec >= transition) return lengthening(velocityPerSec);

  const left = classicalShortening(-transition);
  const right = lengthening(transition);
  const leftSecant = (1 - left.value) / transition;
  const rightSecant = (right.value - 1) / transition;
  const rawCentreSlope =
    0.5 *
    ((alpha + 1) / (alpha * vmax) +
      (ce.maximumLengtheningForceVelocityFactor - 1) /
        ce.lengtheningVelocityScalePerSec);
  const centreSlope = clamp(
    rawCentreSlope,
    0,
    3 * Math.min(leftSecant, rightSecant),
  );
  return velocityPerSec <= 0
    ? cubicHermiteWithDerivative(
        velocityPerSec,
        -transition,
        0,
        left.value,
        1,
        left.derivativeSec,
        centreSlope,
      )
    : cubicHermiteWithDerivative(
        velocityPerSec,
        0,
        transition,
        1,
        right.value,
        centreSlope,
        right.derivativeSec,
      );
}

function evaluateSeriesElasticElement(
  seriesStrain: number,
  params: HillCeSeeSlsParamsV1,
): SeriesEvaluation {
  const see = params.seriesElasticElement;
  const rawExtension = seriesStrain - see.slackStrain;
  const tensile = smoothTensionStrain(
    rawExtension,
    see.tensionTransitionStrain,
  );
  const extension = tensile.value;
  const extension2 = extension * extension;
  const baseTensionPa =
    see.linearStiffnessPa * extension +
    see.cubicStiffnessPa * extension2 * extension;
  const storageJPerM3 =
    0.5 * see.linearStiffnessPa * extension2 +
    0.25 * see.cubicStiffnessPa * extension2 * extension2;
  const baseTangentPa =
    see.linearStiffnessPa + 3 * see.cubicStiffnessPa * extension2;
  const tensionPa = baseTensionPa * tensile.firstDerivative;
  const tangentPa =
    baseTangentPa * tensile.firstDerivative * tensile.firstDerivative +
    baseTensionPa * tensile.secondDerivative;
  return {
    finite: everyFinite([tensionPa, storageJPerM3, tangentPa]),
    tensionPa,
    tangentPa,
    storageJPerM3,
  };
}

function evaluatePassiveEquilibrium(
  totalStrain: number,
  params: HillCeSeeSlsParamsV1,
): {
  readonly finite: boolean;
  readonly stressPa: number;
  readonly tangentPa: number;
  readonly storageJPerM3: number;
} {
  const passive = params.passive;
  const tensile = smoothTensionStrain(
    totalStrain - passive.referenceStrain,
    passive.tensionTransitionStrain,
  );
  const exponentialArgument = passive.exponentialSlope * tensile.value;
  if (
    !Number.isFinite(exponentialArgument) ||
    exponentialArgument > MAX_SAFE_EXP_ARGUMENT
  ) {
    return { finite: false, stressPa: 0, tangentPa: 0, storageJPerM3: 0 };
  }
  const exponential = Math.exp(exponentialArgument);
  const exponentialMinusOne = Math.expm1(exponentialArgument);
  const baseStressPa =
    (passive.tangentModulusPa / passive.exponentialSlope) * exponentialMinusOne;
  const baseTangentPa = passive.tangentModulusPa * exponential;
  const stressPa = baseStressPa * tensile.firstDerivative;
  const tangentPa =
    baseTangentPa * tensile.firstDerivative * tensile.firstDerivative +
    baseStressPa * tensile.secondDerivative;
  const storageJPerM3 =
    (passive.tangentModulusPa /
      (passive.exponentialSlope * passive.exponentialSlope)) *
    (exponentialMinusOne - exponentialArgument);
  return {
    finite: everyFinite([stressPa, tangentPa, storageJPerM3]),
    stressPa,
    tangentPa,
    storageJPerM3,
  };
}

function smoothTensionStrain(
  strain: number,
  transition: number,
): {
  readonly value: number;
  readonly firstDerivative: number;
  readonly secondDerivative: number;
} {
  if (strain <= 0) return { value: 0, firstDerivative: 0, secondDerivative: 0 };
  if (strain >= transition) {
    return {
      value: strain - 0.5 * transition,
      firstDerivative: 1,
      secondDerivative: 0,
    };
  }
  const t = strain / transition;
  return {
    value: transition * (t * t * t - 0.5 * t * t * t * t),
    firstDerivative: 3 * t * t - 2 * t * t * t,
    secondDerivative: (6 * t - 6 * t * t) / transition,
  };
}

function backwardEulerSlsTrial(
  previousOverstressPa: number,
  totalStrainIncrement: number,
  dtSec: number,
  params: HillCeSeeSlsParamsV1,
): {
  readonly finite: boolean;
  readonly overstressPa: number;
  readonly storageJPerM3: number;
  readonly algorithmicTangentPa: number;
  readonly balance: HillCeSeeSlsSlsBalanceReadbackV1;
} {
  const sls = params.sls;
  if (!sls.enabled || sls.modulusPa === 0) {
    return {
      finite: true,
      overstressPa: 0,
      storageJPerM3: 0,
      algorithmicTangentPa: 0,
      balance: ZERO_SLS_BALANCE,
    };
  }
  const modulusPa = sls.modulusPa;
  const denominator = 1 + dtSec / sls.relaxationTimeSec;
  const nextOverstressPa =
    (previousOverstressPa + modulusPa * totalStrainIncrement) / denominator;
  const previousStorage =
    (previousOverstressPa * previousOverstressPa) / (2 * modulusPa);
  const storage = (nextOverstressPa * nextOverstressPa) / (2 * modulusPa);
  const storageIncrement = storage - previousStorage;
  const physicalDissipation =
    (dtSec * nextOverstressPa * nextOverstressPa) /
    (modulusPa * sls.relaxationTimeSec);
  const qIncrement = nextOverstressPa - previousOverstressPa;
  const numericalDissipation = (qIncrement * qIncrement) / (2 * modulusPa);
  const workIncrement = nextOverstressPa * totalStrainIncrement;
  const balance: HillCeSeeSlsSlsBalanceReadbackV1 = Object.freeze({
    workIncrementJPerM3: workIncrement,
    storageIncrementJPerM3: storageIncrement,
    physicalRelaxationDissipationJPerM3: physicalDissipation,
    backwardEulerNumericalDissipationJPerM3: numericalDissipation,
    physicalRelaxationDissipationRateWPerM3: physicalDissipation / dtSec,
    backwardEulerNumericalDissipationRateWPerM3: numericalDissipation / dtSec,
    discreteBalanceResidualJPerM3:
      workIncrement -
      storageIncrement -
      physicalDissipation -
      numericalDissipation,
  });
  return {
    finite: everyFinite([
      nextOverstressPa,
      storage,
      modulusPa / denominator,
      ...Object.values(balance),
    ]),
    overstressPa: nextOverstressPa,
    storageJPerM3: storage,
    algorithmicTangentPa: modulusPa / denominator,
    balance,
  };
}

function refineSignBracket(
  initialLower: number,
  initialUpper: number,
  initialLowerResidual: number,
  previousCeStrain: number,
  previousCaTroponin01: number,
  previousThinFilamentAvailability01: number | undefined,
  totalStrain: number,
  freeCalciumUm: number,
  dtSec: number,
  params: HillCeSeeSlsParamsV1,
): {
  readonly strain: number;
  readonly serial: SerialElementEvaluation;
  readonly iterations: number;
} {
  let lower = initialLower;
  let upper = initialUpper;
  let lowerResidual = initialLowerResidual;
  let bestStrain = lower;
  let best = evaluateSerialPoint(
    lower,
    previousCeStrain,
    previousCaTroponin01,
    previousThinFilamentAvailability01,
    totalStrain,
    freeCalciumUm,
    dtSec,
    params,
  );
  for (
    let iteration = 1;
    iteration <= params.solver.maximumIterations;
    iteration += 1
  ) {
    const midpoint = 0.5 * (lower + upper);
    const serial = evaluateSerialPoint(
      midpoint,
      previousCeStrain,
      previousCaTroponin01,
      previousThinFilamentAvailability01,
      totalStrain,
      freeCalciumUm,
      dtSec,
      params,
    );
    if (
      serialResidualMetric(serial, params) < serialResidualMetric(best, params)
    ) {
      bestStrain = midpoint;
      best = serial;
    }
    if (serialResidualConverged(serial, params)) {
      return { strain: midpoint, serial, iterations: iteration };
    }
    if (upper - lower <= params.solver.strainTolerance) {
      return { strain: bestStrain, serial: best, iterations: iteration };
    }
    if (oppositeSigns(lowerResidual, serial.residualPa)) {
      upper = midpoint;
    } else {
      lower = midpoint;
      lowerResidual = serial.residualPa;
    }
  }
  return {
    strain: bestStrain,
    serial: best,
    iterations: params.solver.maximumIterations,
  };
}

function refineZeroBoundary(
  initialOutside: number,
  initialInside: number,
  previousCeStrain: number,
  previousCaTroponin01: number,
  previousThinFilamentAvailability01: number | undefined,
  totalStrain: number,
  freeCalciumUm: number,
  dtSec: number,
  params: HillCeSeeSlsParamsV1,
): {
  readonly strain: number;
  readonly serial: SerialElementEvaluation;
  readonly iterations: number;
} {
  let outside = initialOutside;
  let inside = initialInside;
  let insideEvaluation = evaluateSerialPoint(
    inside,
    previousCeStrain,
    previousCaTroponin01,
    previousThinFilamentAvailability01,
    totalStrain,
    freeCalciumUm,
    dtSec,
    params,
  );
  let bestStable: {
    readonly strain: number;
    readonly serial: SerialElementEvaluation;
  } | null = null;
  for (
    let iteration = 1;
    iteration <= params.solver.maximumIterations;
    iteration += 1
  ) {
    const midpoint = 0.5 * (outside + inside);
    const serial = evaluateSerialPoint(
      midpoint,
      previousCeStrain,
      previousCaTroponin01,
      previousThinFilamentAvailability01,
      totalStrain,
      freeCalciumUm,
      dtSec,
      params,
    );
    if (
      serialResidualConverged(serial, params) &&
      serial.stabilityPa > params.solver.minimumStableAlgorithmicStiffnessPa
    ) {
      bestStable = { strain: midpoint, serial };
    }
    if (serialResidualConverged(serial, params)) {
      inside = midpoint;
      insideEvaluation = serial;
    } else {
      outside = midpoint;
    }
    if (Math.abs(inside - outside) <= params.solver.strainTolerance) {
      const selected = bestStable ?? {
        strain: inside,
        serial: insideEvaluation,
      };
      return { ...selected, iterations: iteration };
    }
  }
  const selected = bestStable ?? { strain: inside, serial: insideEvaluation };
  return { ...selected, iterations: params.solver.maximumIterations };
}

function candidateFromEvaluation(
  strain: number,
  serial: SerialElementEvaluation,
  source: HillCeSeeSlsRootCandidateV1["source"],
  params: HillCeSeeSlsParamsV1,
): HillCeSeeSlsRootCandidateV1 {
  const residualTolerancePa = serialResidualTolerancePa(serial, params);
  const converged = Math.abs(serial.residualPa) <= residualTolerancePa;
  const stable =
    serial.stabilityPa > params.solver.minimumStableAlgorithmicStiffnessPa;
  const carriesResolvedLoad =
    Math.max(
      Math.abs(serial.contractileTensionPa),
      Math.abs(serial.series.tensionPa),
    ) > residualTolerancePa;
  const neutralZeroManifold =
    (source === "zero-manifold-continuation" ||
      source === "local-continuation") &&
    converged &&
    serial.contractileTensionPa === 0 &&
    serial.series.tensionPa === 0;
  return {
    ceStrain: strain,
    residualPa: serial.residualPa,
    algorithmicStabilityPa: serial.stabilityPa,
    residualTolerancePa,
    converged,
    stable,
    neutralZeroManifold,
    // A tolerance-run boundary is a diagnostic contour, not an equilibrium
    // root. Simple loaded roots are supplied by sign brackets; an exactly
    // unloaded plateau is represented only by its continuation candidate.
    admissible:
      (source === "sign-bracket" && converged && stable) ||
      (source === "local-continuation" &&
        converged &&
        stable &&
        carriesResolvedLoad) ||
      neutralZeroManifold,
    source,
  };
}

function addCandidate(
  candidates: HillCeSeeSlsRootCandidateV1[],
  candidate: HillCeSeeSlsRootCandidateV1,
  params: HillCeSeeSlsParamsV1,
): void {
  const duplicateTolerance = Math.max(
    10 * params.solver.strainTolerance,
    ((params.contractileElement.maximumStrain -
      params.contractileElement.minimumStrain) /
      params.solver.rootScanSubdivisions) *
      1e-8,
  );
  const duplicateIndex = candidates.findIndex(
    (existing) =>
      Math.abs(existing.ceStrain - candidate.ceStrain) <= duplicateTolerance,
  );
  if (duplicateIndex < 0) {
    candidates.push(candidate);
    return;
  }
  const existing = candidates[duplicateIndex]!;
  if (
    (candidate.admissible && !existing.admissible) ||
    (candidate.admissible === existing.admissible &&
      candidate.converged &&
      !existing.converged) ||
    (candidate.admissible === existing.admissible &&
      candidate.converged === existing.converged &&
      Math.abs(candidate.residualPa) / candidate.residualTolerancePa <
        Math.abs(existing.residualPa) / existing.residualTolerancePa)
  ) {
    candidates[duplicateIndex] = candidate;
  }
}

function solverReadback(
  root: RootSolution,
  residual: number,
): HillCeSeeSlsTrialV1["solver"] {
  const selected =
    root.selectedIndex === null ? null : root.candidates[root.selectedIndex]!;
  const rootCandidates = root.candidates.filter(
    (candidate) =>
      candidate.source === "sign-bracket" ||
      candidate.source === "local-continuation" ||
      candidate.neutralZeroManifold,
  );
  return Object.freeze({
    converged: selected !== null,
    iterations: root.iterations,
    bracketed: root.signBracketCount > 0,
    absoluteResidualPa: residual,
    rootCandidates: root.candidates,
    convergedRootCount: rootCandidates.filter(
      (candidate) => candidate.converged,
    ).length,
    stableRootCount: rootCandidates.filter(
      (candidate) => candidate.converged && candidate.stable,
    ).length,
    admissibleRootCount: root.candidates.filter(
      (candidate) => candidate.admissible,
    ).length,
    selectedRootIndex: root.selectedIndex,
    selectedAlgorithmicStabilityPa: selected?.algorithmicStabilityPa ?? 0,
    selectedMechanicallyStable: selected?.stable ?? false,
    selectedNeutralZeroManifold: selected?.neutralZeroManifold ?? false,
  });
}

function invalidTrial(
  acceptedState: HillCeSeeSlsStateV1,
  input: HillCeSeeSlsTrialInputV1,
  issues: readonly HillCeSeeSlsIssueV1[],
  finiteFlag: boolean,
  root: RootSolution = EMPTY_ROOT_SOLUTION,
): HillCeSeeSlsTrialV1 {
  const safeState = everyFinite([
    acceptedState.totalStrain,
    acceptedState.ceStrain,
    acceptedState.slsOverstressPa,
    acceptedState.caTroponin01,
    ...(acceptedState.thinFilamentAvailability01 === undefined
      ? []
      : [acceptedState.thinFilamentAvailability01]),
  ])
    ? acceptedState
    : ZERO_STATE;
  const total = Number.isFinite(input.totalStrain)
    ? input.totalStrain
    : safeState.totalStrain;
  const freeCalciumUm = Number.isFinite(input.freeCalciumUm)
    ? input.freeCalciumUm
    : 0;
  const readback: HillCeSeeSlsReadbackV1 = Object.freeze({
    freeCalciumUm,
    caTroponin01: safeState.caTroponin01,
    thinFilamentAvailability01: 0,
    activation01: 0,
    calciumTroponinActivation: null,
    strains: Object.freeze({
      total,
      contractileElement: safeState.ceStrain,
      seriesElasticElement: total - safeState.ceStrain,
      totalRatePerSec: 0,
      contractileElementRatePerSec: 0,
    }),
    factors: Object.freeze({ activeLength: 0, forceVelocity: 0 }),
    stresses: ZERO_STRESSES,
    tangentsPa: ZERO_TANGENTS,
    energies: ZERO_ENERGIES,
    serialWork: ZERO_SERIAL_WORK,
    slsBalance: ZERO_SLS_BALANCE,
    kinematicClaim: HILL_CE_SEE_SLS_KINEMATIC_CLAIM_V1,
  });
  return Object.freeze({
    previousState: acceptedState,
    nextState: safeState,
    readback,
    solver: solverReadback(root, 0),
    valid: false,
    finite: finiteFlag,
    issues: Object.freeze(issues.map((issue) => Object.freeze({ ...issue }))),
  });
}

function validateAcceptedState(
  state: HillCeSeeSlsStateV1,
  params: HillCeSeeSlsParamsV1,
): string[] {
  const errors: string[] = [];
  finite(errors, "state.totalStrain", state.totalStrain);
  finite(errors, "state.ceStrain", state.ceStrain);
  finite(errors, "state.slsOverstressPa", state.slsOverstressPa);
  finite(errors, "state.caTroponin01", state.caTroponin01);
  if (
    Number.isFinite(state.caTroponin01) &&
    (state.caTroponin01 < 0 || state.caTroponin01 > 1)
  ) {
    errors.push("state.caTroponin01 must lie inside [0,1]");
  }
  if (state.thinFilamentAvailability01 !== undefined) {
    finite(
      errors,
      "state.thinFilamentAvailability01",
      state.thinFilamentAvailability01,
    );
    if (
      Number.isFinite(state.thinFilamentAvailability01) &&
      (state.thinFilamentAvailability01 < 0 ||
        state.thinFilamentAvailability01 > 1)
    ) {
      errors.push("state.thinFilamentAvailability01 must lie inside [0,1]");
    }
  }
  if (
    params.calciumTroponinActivation.thinFilamentDynamics?.mode ===
      "one-state-normalized-lag" &&
    state.thinFilamentAvailability01 === undefined
  ) {
    errors.push(
      "state.thinFilamentAvailability01 is required by the one-state-normalized-lag mode",
    );
  }
  if (
    Number.isFinite(state.ceStrain) &&
    (state.ceStrain < params.contractileElement.minimumStrain ||
      state.ceStrain > params.contractileElement.maximumStrain)
  ) {
    errors.push(
      "state.ceStrain must lie inside the configured CE strain domain",
    );
  }
  if (
    Number.isFinite(state.slsOverstressPa) &&
    (!params.sls.enabled || params.sls.modulusPa === 0) &&
    state.slsOverstressPa !== 0
  ) {
    errors.push(
      "state.slsOverstressPa must be exactly zero when the SLS arm is disabled",
    );
  }
  return errors;
}

function validateInput(input: HillCeSeeSlsTrialInputV1): string[] {
  const errors: string[] = [];
  if (!Number.isFinite(input.dtSec) || input.dtSec <= 0)
    errors.push("dtSec must be finite and > 0");
  finite(errors, "totalStrain", input.totalStrain);
  finite(errors, "freeCalciumUm", input.freeCalciumUm);
  if (Number.isFinite(input.freeCalciumUm) && input.freeCalciumUm < 0) {
    errors.push("freeCalciumUm must be >= 0");
  }
  if (input.midpointFreeCalciumUm !== undefined) {
    finite(errors, "midpointFreeCalciumUm", input.midpointFreeCalciumUm);
    if (
      Number.isFinite(input.midpointFreeCalciumUm) &&
      input.midpointFreeCalciumUm < 0
    ) {
      errors.push("midpointFreeCalciumUm must be >= 0");
    }
  }
  return errors;
}

function cubicHermiteWithDerivative(
  x: number,
  x0: number,
  x1: number,
  y0: number,
  y1: number,
  slope0: number,
  slope1: number,
): { readonly value: number; readonly derivativeSec: number } {
  const width = x1 - x0;
  const t = (x - x0) / width;
  const t2 = t * t;
  const t3 = t2 * t;
  const value =
    (2 * t3 - 3 * t2 + 1) * y0 +
    (t3 - 2 * t2 + t) * width * slope0 +
    (-2 * t3 + 3 * t2) * y1 +
    (t3 - t2) * width * slope1;
  const derivativeSec =
    ((6 * t2 - 6 * t) * y0 +
      (3 * t2 - 4 * t + 1) * width * slope0 +
      (-6 * t2 + 6 * t) * y1 +
      (3 * t2 - 2 * t) * width * slope1) /
    width;
  return { value, derivativeSec };
}

function oppositeSigns(a: number, b: number): boolean {
  return (a < 0 && b > 0) || (a > 0 && b < 0);
}

function numericValues(serialWork: HillCeSeeSlsSerialWorkReadbackV1): number[] {
  return [
    serialWork.boundaryWorkIncrementJPerM3,
    serialWork.contractileElementMechanicalWorkIncrementJPerM3,
    serialWork.seriesElasticStorageIncrementJPerM3,
    serialWork.seriesElasticBackwardEulerNumericalDissipationJPerM3,
    serialWork.discreteBalanceResidualJPerM3,
  ];
}

const MAX_SAFE_EXP_ARGUMENT = 700;
const ZERO_STATE: HillCeSeeSlsStateV1 = Object.freeze({
  totalStrain: 0,
  ceStrain: 0,
  slsOverstressPa: 0,
  caTroponin01: 0,
});
const ZERO_STRESSES: HillCeSeeSlsStressReadbackV1 = Object.freeze({
  passiveEquilibriumPa: 0,
  contractileElementTensionPa: 0,
  seriesElasticTensionPa: 0,
  slsOverstressPa: 0,
  totalTransmittedPa: 0,
  serialEquilibriumResidualPa: 0,
});
const ZERO_TANGENTS: HillCeSeeSlsTangentReadbackV1 = Object.freeze({
  passiveEquilibriumPa: 0,
  contractileElementAlgorithmicPa: 0,
  seriesElasticPa: 0,
  serialStabilityPa: 0,
  serialTransmittedAlgorithmicPa: 0,
  slsAlgorithmicPa: 0,
  totalTransmittedAlgorithmicPa: 0,
});
const ZERO_ENERGIES: HillCeSeeSlsEnergyReadbackV1 = Object.freeze({
  passiveEquilibriumStorageJPerM3: 0,
  seriesElasticStorageJPerM3: 0,
  slsStorageJPerM3: 0,
  totalStoredJPerM3: 0,
});
const ZERO_SERIAL_WORK: HillCeSeeSlsSerialWorkReadbackV1 = Object.freeze({
  boundaryWorkIncrementJPerM3: 0,
  contractileElementMechanicalWorkIncrementJPerM3: 0,
  seriesElasticStorageIncrementJPerM3: 0,
  seriesElasticBackwardEulerNumericalDissipationJPerM3: 0,
  discreteBalanceResidualJPerM3: 0,
  activeChemicalEnergyModelled: false,
  activeChemicalEnergyClaim: "unmodelled-in-v1",
});
const ZERO_SLS_BALANCE: HillCeSeeSlsSlsBalanceReadbackV1 = Object.freeze({
  workIncrementJPerM3: 0,
  storageIncrementJPerM3: 0,
  physicalRelaxationDissipationJPerM3: 0,
  backwardEulerNumericalDissipationJPerM3: 0,
  physicalRelaxationDissipationRateWPerM3: 0,
  backwardEulerNumericalDissipationRateWPerM3: 0,
  discreteBalanceResidualJPerM3: 0,
});
const EMPTY_ROOT_SOLUTION: RootSolution = Object.freeze({
  finite: true,
  candidates: Object.freeze([]),
  selectedIndex: null,
  iterations: 0,
  signBracketCount: 0,
});

function requireFinite(name: string, value: number): void {
  if (!Number.isFinite(value)) throw new RangeError(`${name} must be finite`);
}

function finite(errors: string[], name: string, value: number): void {
  if (!Number.isFinite(value)) errors.push(`${name} must be finite`);
}

function nonnegative(errors: string[], name: string, value: number): void {
  if (!Number.isFinite(value) || value < 0)
    errors.push(`${name} must be finite and >= 0`);
}

function positive(errors: string[], name: string, value: number): void {
  if (!Number.isFinite(value) || value <= 0)
    errors.push(`${name} must be finite and > 0`);
}

function everyFinite(values: readonly number[]): boolean {
  return values.every(Number.isFinite);
}

function nestedNumbersFinite(value: unknown): boolean {
  if (typeof value === "number") return Number.isFinite(value);
  if (typeof value !== "object" || value === null) return true;
  return Object.values(value).every(nestedNumbersFinite);
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}
