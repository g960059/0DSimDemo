import type {
  MainWireNormalAdultPassiveEquilibriumCoordinatesV3,
  MainWireNormalAdultPassiveEquilibriumMatrix2V3,
} from "@/engine/myocardium/experiments/MainWirePassiveEquilibriumPointSolverComparisonDefinitionV1";

export const MAIN_WIRE_PASSIVE_EQUILIBRIUM_POINT_SOLVER_COMPARISON_ENGINEERING_V1_ID =
  "main-wire-normal-adult-passive-equilibrium-point-solver-comparison-engineering-v1" as const;

export const MAIN_WIRE_PASSIVE_EQUILIBRIUM_RESIDUAL_ARMIJO_NEWTON_V3_ID =
  "main-wire-normal-adult-passive-equilibrium-residual-armijo-newton-v3" as const;
export const MAIN_WIRE_PASSIVE_EQUILIBRIUM_COMPONENT_ENERGY_TERMINAL_ROOT_GUARD_V3_ID =
  "main-wire-normal-adult-passive-equilibrium-component-energy-terminal-root-guard-v3" as const;
export const MAIN_WIRE_PASSIVE_EQUILIBRIUM_RESIDUAL_LM_V3_ID =
  "main-wire-normal-adult-passive-equilibrium-residual-lm-v3" as const;

export const MAIN_WIRE_PASSIVE_EQUILIBRIUM_POINT_SOLVER_POLICY_ORDER_V3 =
  Object.freeze([
    MAIN_WIRE_PASSIVE_EQUILIBRIUM_RESIDUAL_ARMIJO_NEWTON_V3_ID,
    MAIN_WIRE_PASSIVE_EQUILIBRIUM_RESIDUAL_LM_V3_ID,
    MAIN_WIRE_PASSIVE_EQUILIBRIUM_COMPONENT_ENERGY_TERMINAL_ROOT_GUARD_V3_ID,
  ] as const);

export type MainWirePassiveEquilibriumPointSolverPolicyIdV3 =
  (typeof MAIN_WIRE_PASSIVE_EQUILIBRIUM_POINT_SOLVER_POLICY_ORDER_V3)[number];

export const MAIN_WIRE_PASSIVE_EQUILIBRIUM_POINT_SOLVER_SHARED_POLICY_V3 =
  deepFreezeV3({
    coordinateOrder: ["septal-midwall-cap-volume-m3", "junction-radius-m"],
    coordinateScales: {
      septalMidwallCapVolumeM3: 42e-6,
      junctionRadiusM: 0.033,
    },
    energyScaleJ: 1,
    maximumAcceptedUpdatesPerStage: 48,
    maximumTrialExponentOrDampingAttempt: 28,
    armijoCoefficient: 1e-4,
    scaledForceInfinityTolerance: 1e-10,
    scaledUpdateStagnationLimit: 1e-11,
    minimumScaledInternalHessianEigenvalueExclusive: 1e-10,
    minimumJunctionRadiusMExclusive: 1e-5,
    terminalGateOrder: [
      "finite-domain",
      "strict-local-stability",
      "scaled-force-infinity-tolerance",
    ],
    activeStressIncluded: false,
    slsHistoryIncluded: false,
    surfaceEstablished: false,
    branchEstablished: false,
    globalUniquenessEstablished: false,
    officialQualificationEstablished: false,
    publicCatalogEligibilityEstablished: false,
  });

export const MAIN_WIRE_PASSIVE_EQUILIBRIUM_POINT_SOLVER_POLICIES_V3 =
  deepFreezeV3({
    [MAIN_WIRE_PASSIVE_EQUILIBRIUM_RESIDUAL_ARMIJO_NEWTON_V3_ID]: {
      policyId: MAIN_WIRE_PASSIVE_EQUILIBRIUM_RESIDUAL_ARMIJO_NEWTON_V3_ID,
      family: "residual-merit-armijo-newton",
      merit: "phi=0.5*dot(scaled-gradient,scaled-gradient)",
      direction: "d=-inverse(scaled-hessian)*scaled-gradient",
      candidateExponentsInclusive: [0, 28],
      alpha: "2^(-b)",
      acceptance:
        "phi-trial<=(1-2*1e-4*alpha)*phi-current-and-trial-strictly-stable",
    },
    [MAIN_WIRE_PASSIVE_EQUILIBRIUM_COMPONENT_ENERGY_TERMINAL_ROOT_GUARD_V3_ID]:
      {
        policyId:
          MAIN_WIRE_PASSIVE_EQUILIBRIUM_COMPONENT_ENERGY_TERMINAL_ROOT_GUARD_V3_ID,
        family: "component-energy-armijo-newton-with-terminal-root-guard",
        direction: "d=-inverse(scaled-hessian)*scaled-gradient",
        wallOrder: ["LVFW", "SEP", "RVFW"],
        componentComparison:
          "two-diff-six-term-expansion-plus-negative-rhs-exact-sign",
        terminalRootGuard:
          "b0-only-coordinate-changed-finite-domain-force-tolerance-and-strict-stability",
        energyUlpFloorApplied: false,
        roundedEnergyDecisionApplied: false,
      },
    [MAIN_WIRE_PASSIVE_EQUILIBRIUM_RESIDUAL_LM_V3_ID]: {
      policyId: MAIN_WIRE_PASSIVE_EQUILIBRIUM_RESIDUAL_LM_V3_ID,
      family: "residual-merit-levenberg-marquardt",
      merit: "phi=0.5*dot(scaled-gradient,scaled-gradient)",
      initialMu: "1e-3*max(diag(transpose(H)*H))",
      initialNu: 2,
      direction: "inverse(transpose(H)*H+mu*I)*(-transpose(H)*g)",
      acceptance: "finite-domain-strict-stability-predicted>0-and-rho>0",
      acceptedMuUpdate: "mu*=max(1/3,1-(2*rho-1)^3);nu=2",
      rejectedMuUpdate: "mu*=nu;nu*=2",
      trustRegionPolicyIncluded: false,
      gradientDescentFallbackIncluded: false,
    },
  });

export type MainWirePassiveEquilibriumWallEnergyV3 = Readonly<{
  LVFW: number;
  SEP: number;
  RVFW: number;
}>;

export type MainWirePassiveEquilibriumSolverCandidateInputV3 = Readonly<{
  internalCoordinates: MainWireNormalAdultPassiveEquilibriumCoordinatesV3;
  wallStoredEnergyJ: MainWirePassiveEquilibriumWallEnergyV3;
  scaledGradient: readonly [number, number];
  scaledInternalHessian: MainWireNormalAdultPassiveEquilibriumMatrix2V3;
}>;

export type MainWirePassiveEquilibriumSolverCandidateV3 = Readonly<{
  internalCoordinates: MainWireNormalAdultPassiveEquilibriumCoordinatesV3;
  wallStoredEnergyJ: MainWirePassiveEquilibriumWallEnergyV3;
  rawStoredEnergyJ: number;
  scaledGradient: readonly [number, number];
  scaledForceInfinityNorm: number;
  scaledInternalHessian: MainWireNormalAdultPassiveEquilibriumMatrix2V3;
  scaledInternalHessianEigenvaluesAscending: readonly [number, number];
  minimumScaledInternalHessianEigenvalue: number;
  strictLocalStabilityPassed: boolean;
  junctionRadiusPassed: boolean;
}>;

export type MainWirePassiveEquilibriumTrialRecordV3 = Readonly<{
  trialIndex: number;
  backtrackExponent: number | null;
  alpha: number | null;
  mu: number | null;
  coordinates: MainWireNormalAdultPassiveEquilibriumCoordinatesV3 | null;
  status: "accepted" | "rejected" | "evaluation-failed";
  reason:
    | "residual-armijo-satisfied"
    | "component-energy-armijo-satisfied"
    | "terminal-root-guard-satisfied"
    | "lm-gain-ratio-satisfied"
    | "residual-armijo-not-satisfied"
    | "component-energy-armijo-not-satisfied"
    | "lm-gain-ratio-not-satisfied"
    | "zero-coordinate-step"
    | "junction-radius-below-minimum"
    | "candidate-evaluation-failed"
    | "candidate-not-finite"
    | "candidate-not-strictly-stable"
    | "rhs-not-strictly-negative"
    | "component-energy-comparison-unavailable"
    | "lm-system-singular"
    | "lm-predicted-reduction-not-positive";
  trialScaledForceInfinityNorm: number | null;
  trialMinimumScaledHessianEigenvalue: number | null;
  currentMerit: number | null;
  trialMerit: number | null;
  acceptanceBoundary: number | null;
  exactComponentEnergyComparisonSign: -1 | 0 | 1 | null;
  lmPredictedReduction: number | null;
  lmGainRatio: number | null;
}>;

export type MainWirePassiveEquilibriumIterationRecordV3 = Readonly<{
  iterationIndex: number;
  currentCoordinates: MainWireNormalAdultPassiveEquilibriumCoordinatesV3;
  currentScaledForceInfinityNorm: number;
  currentMinimumScaledHessianEigenvalue: number;
  currentMerit: number;
  selectedTrialIndex: number | null;
  selectedReason: MainWirePassiveEquilibriumTrialRecordV3["reason"] | null;
  scaledUpdateInfinityNorm: number | null;
  trials: readonly MainWirePassiveEquilibriumTrialRecordV3[];
}>;

export type MainWirePassiveEquilibriumPointSolverFailureReasonV3 =
  | "candidate-evaluation-failed"
  | "candidate-not-finite"
  | "junction-radius-below-minimum"
  | "scaled-internal-hessian-singular"
  | "scaled-internal-hessian-not-positive-definite"
  | "newton-direction-unavailable"
  | "newton-iteration-limit"
  | "line-search-failed"
  | "lm-damping-exhausted"
  | "scaled-update-stagnated";

type SolverResultCommonV3 = Readonly<{
  ownerId: typeof MAIN_WIRE_PASSIVE_EQUILIBRIUM_POINT_SOLVER_COMPARISON_ENGINEERING_V1_ID;
  policyId: MainWirePassiveEquilibriumPointSolverPolicyIdV3;
  stageIndex: number;
  initialCoordinates: MainWireNormalAdultPassiveEquilibriumCoordinatesV3;
  candidateEvaluations: number;
  acceptedUpdates: number;
  rejectedTrials: number;
  trace: readonly MainWirePassiveEquilibriumIterationRecordV3[];
  officialQualificationEstablished: false;
  surfaceEstablished: false;
  branchEstablished: false;
  globalUniquenessEstablished: false;
}>;

export type MainWirePassiveEquilibriumPointSolverResultV3 =
  | (SolverResultCommonV3 &
      Readonly<{
        status: "point-local-stable-root-established";
        pointLocalStableRootEstablished: true;
        terminalCandidate: MainWirePassiveEquilibriumSolverCandidateV3;
        failureReason: null;
      }>)
  | (SolverResultCommonV3 &
      Readonly<{
        status: "point-solve-failed";
        pointLocalStableRootEstablished: false;
        terminalCandidate: MainWirePassiveEquilibriumSolverCandidateV3 | null;
        failureReason: MainWirePassiveEquilibriumPointSolverFailureReasonV3;
      }>);

export type MainWirePassiveEquilibriumCandidateEvaluatorV3 = (
  coordinates: MainWireNormalAdultPassiveEquilibriumCoordinatesV3,
) => MainWirePassiveEquilibriumSolverCandidateInputV3;

export type MainWirePassiveEquilibriumComponentEnergyComparisonV3 = Readonly<{
  available: boolean;
  exactSign: -1 | 0 | 1 | null;
  accepted: boolean;
  twoDiffTerms: readonly number[];
  energyExpansion: readonly number[];
  comparisonExpansion: readonly number[];
  roundedEnergyDeltaDiagnosticJ: number | null;
}>;

export function solveMainWirePassiveEquilibriumPointEngineeringV3(
  input: Readonly<{
    policyId: MainWirePassiveEquilibriumPointSolverPolicyIdV3;
    stageIndex: number;
    initialCoordinates: MainWireNormalAdultPassiveEquilibriumCoordinatesV3;
    evaluateCandidate: MainWirePassiveEquilibriumCandidateEvaluatorV3;
  }>,
): MainWirePassiveEquilibriumPointSolverResultV3 {
  if (
    !MAIN_WIRE_PASSIVE_EQUILIBRIUM_POINT_SOLVER_POLICY_ORDER_V3.includes(
      input.policyId,
    )
  )
    throw new Error("unknown passive-equilibrium point-solver policy");
  if (!Number.isInteger(input.stageIndex) || input.stageIndex < 0)
    throw new Error("stage index must be a non-negative integer");
  if (
    !Number.isFinite(input.initialCoordinates.septalMidwallCapVolumeM3) ||
    !Number.isFinite(input.initialCoordinates.junctionRadiusM)
  )
    throw new Error("initial coordinates must be finite");
  const counters = { candidateEvaluations: 0, rejectedTrials: 0 };
  const trace: MainWirePassiveEquilibriumIterationRecordV3[] = [];
  let current: MainWirePassiveEquilibriumSolverCandidateV3;
  try {
    current = evaluateAndNormalizeCandidateV3(
      input.evaluateCandidate,
      input.initialCoordinates,
      counters,
    );
  } catch {
    return failureV3(
      input,
      counters,
      trace,
      0,
      "candidate-evaluation-failed",
      null,
    );
  }
  let lmState: { mu: number; nu: number } | null = null;

  for (
    let iterationIndex = 0;
    iterationIndex <=
    MAIN_WIRE_PASSIVE_EQUILIBRIUM_POINT_SOLVER_SHARED_POLICY_V3.maximumAcceptedUpdatesPerStage;
    iterationIndex += 1
  ) {
    const gateFailure = currentCandidateGateFailureV3(current);
    if (gateFailure !== null)
      return failureV3(
        input,
        counters,
        trace,
        iterationIndex,
        gateFailure,
        current,
      );
    if (
      current.scaledForceInfinityNorm <=
      MAIN_WIRE_PASSIVE_EQUILIBRIUM_POINT_SOLVER_SHARED_POLICY_V3.scaledForceInfinityTolerance
    )
      return successV3(input, counters, trace, iterationIndex, current);
    if (
      iterationIndex ===
      MAIN_WIRE_PASSIVE_EQUILIBRIUM_POINT_SOLVER_SHARED_POLICY_V3.maximumAcceptedUpdatesPerStage
    )
      return failureV3(
        input,
        counters,
        trace,
        iterationIndex,
        "newton-iteration-limit",
        current,
      );

    const currentMerit = residualMeritV3(current.scaledGradient);
    if (!Number.isFinite(currentMerit))
      return failureV3(
        input,
        counters,
        trace,
        iterationIndex,
        "candidate-not-finite",
        current,
      );

    const decision =
      input.policyId === MAIN_WIRE_PASSIVE_EQUILIBRIUM_RESIDUAL_LM_V3_ID
        ? evaluateLmIterationV3(
            current,
            currentMerit,
            lmState,
            input.evaluateCandidate,
            counters,
          )
        : evaluateNewtonIterationV3(
            input.policyId,
            current,
            currentMerit,
            input.evaluateCandidate,
            counters,
          );

    if (decision.status === "pretrial-failure")
      return failureV3(
        input,
        counters,
        trace,
        iterationIndex,
        decision.failureReason,
        current,
      );
    trace.push(
      deepFreezeV3({
        iterationIndex,
        currentCoordinates: { ...current.internalCoordinates },
        currentScaledForceInfinityNorm: current.scaledForceInfinityNorm,
        currentMinimumScaledHessianEigenvalue:
          current.minimumScaledInternalHessianEigenvalue,
        currentMerit,
        selectedTrialIndex: decision.selectedTrialIndex,
        selectedReason: decision.selectedReason,
        scaledUpdateInfinityNorm: decision.scaledUpdateInfinityNorm,
        trials: decision.trials,
      }),
    );
    if (decision.status === "trial-exhausted")
      return failureV3(
        input,
        counters,
        trace,
        iterationIndex,
        input.policyId === MAIN_WIRE_PASSIVE_EQUILIBRIUM_RESIDUAL_LM_V3_ID
          ? "lm-damping-exhausted"
          : "line-search-failed",
        current,
      );

    current = decision.acceptedCandidate;
    if (decision.nextLmState !== null) lmState = decision.nextLmState;
    const acceptedGateFailure = currentCandidateGateFailureV3(current);
    if (acceptedGateFailure !== null)
      return failureV3(
        input,
        counters,
        trace,
        iterationIndex + 1,
        acceptedGateFailure,
        current,
      );
    if (
      current.scaledForceInfinityNorm <=
      MAIN_WIRE_PASSIVE_EQUILIBRIUM_POINT_SOLVER_SHARED_POLICY_V3.scaledForceInfinityTolerance
    )
      return successV3(input, counters, trace, iterationIndex + 1, current);
    if (
      decision.scaledUpdateInfinityNorm <=
      MAIN_WIRE_PASSIVE_EQUILIBRIUM_POINT_SOLVER_SHARED_POLICY_V3.scaledUpdateStagnationLimit
    )
      return failureV3(
        input,
        counters,
        trace,
        iterationIndex + 1,
        "scaled-update-stagnated",
        current,
      );
  }
  throw new Error("unreachable passive-equilibrium comparison solver state");
}

export function evaluateMainWirePassiveEquilibriumComponentEnergyComparisonV3(
  input: Readonly<{
    currentWallStoredEnergyJ: MainWirePassiveEquilibriumWallEnergyV3;
    trialWallStoredEnergyJ: MainWirePassiveEquilibriumWallEnergyV3;
    rhsJ: number;
  }>,
): MainWirePassiveEquilibriumComponentEnergyComparisonV3 {
  const terms: number[] = [];
  for (const wallId of ["LVFW", "SEP", "RVFW"] as const) {
    const difference = twoDiffV3(
      input.trialWallStoredEnergyJ[wallId],
      input.currentWallStoredEnergyJ[wallId],
    );
    terms.push(difference.hi, difference.lo);
  }
  if (
    !Number.isFinite(input.rhsJ) ||
    !(input.rhsJ < 0) ||
    terms.some((term) => !Number.isFinite(term))
  )
    return deepFreezeV3({
      available: false,
      exactSign: null,
      accepted: false,
      twoDiffTerms: terms,
      energyExpansion: [],
      comparisonExpansion: [],
      roundedEnergyDeltaDiagnosticJ: null,
    });

  let energyExpansion: number[] = [];
  for (const term of terms) {
    energyExpansion = growExpansionV3(energyExpansion, term);
    if (energyExpansion.some((component) => !Number.isFinite(component)))
      return deepFreezeV3({
        available: false,
        exactSign: null,
        accepted: false,
        twoDiffTerms: terms,
        energyExpansion,
        comparisonExpansion: [],
        roundedEnergyDeltaDiagnosticJ: null,
      });
  }
  const comparisonExpansion = growExpansionV3(energyExpansion, -input.rhsJ);
  if (comparisonExpansion.some((component) => !Number.isFinite(component)))
    return deepFreezeV3({
      available: false,
      exactSign: null,
      accepted: false,
      twoDiffTerms: terms,
      energyExpansion,
      comparisonExpansion,
      roundedEnergyDeltaDiagnosticJ: null,
    });
  let roundedEnergyDeltaDiagnosticJ = 0;
  for (const component of energyExpansion)
    roundedEnergyDeltaDiagnosticJ += component;
  const exactSign = expansionSignV3(comparisonExpansion);
  return deepFreezeV3({
    available: true,
    exactSign,
    accepted: exactSign <= 0,
    twoDiffTerms: terms,
    energyExpansion,
    comparisonExpansion,
    roundedEnergyDeltaDiagnosticJ: Number.isFinite(
      roundedEnergyDeltaDiagnosticJ,
    )
      ? roundedEnergyDeltaDiagnosticJ
      : null,
  });
}

type IterationDecisionV3 =
  | Readonly<{
      status: "pretrial-failure";
      failureReason: MainWirePassiveEquilibriumPointSolverFailureReasonV3;
    }>
  | Readonly<{
      status: "trial-exhausted";
      trials: readonly MainWirePassiveEquilibriumTrialRecordV3[];
      selectedTrialIndex: null;
      selectedReason: null;
      scaledUpdateInfinityNorm: null;
    }>
  | Readonly<{
      status: "accepted";
      acceptedCandidate: MainWirePassiveEquilibriumSolverCandidateV3;
      trials: readonly MainWirePassiveEquilibriumTrialRecordV3[];
      selectedTrialIndex: number;
      selectedReason: MainWirePassiveEquilibriumTrialRecordV3["reason"];
      scaledUpdateInfinityNorm: number;
      nextLmState: { mu: number; nu: number } | null;
    }>;

function evaluateNewtonIterationV3(
  policyId:
    | typeof MAIN_WIRE_PASSIVE_EQUILIBRIUM_RESIDUAL_ARMIJO_NEWTON_V3_ID
    | typeof MAIN_WIRE_PASSIVE_EQUILIBRIUM_COMPONENT_ENERGY_TERMINAL_ROOT_GUARD_V3_ID,
  current: MainWirePassiveEquilibriumSolverCandidateV3,
  currentMerit: number,
  evaluator: MainWirePassiveEquilibriumCandidateEvaluatorV3,
  counters: { candidateEvaluations: number; rejectedTrials: number },
): IterationDecisionV3 {
  const direction = solveNewtonDirectionV3(
    current.scaledInternalHessian,
    current.scaledGradient,
  );
  if (direction === null)
    return {
      status: "pretrial-failure",
      failureReason: "newton-direction-unavailable",
    };
  const directionalDerivative =
    current.scaledGradient[0] * direction[0] +
    current.scaledGradient[1] * direction[1];
  if (!Number.isFinite(directionalDerivative) || directionalDerivative >= 0)
    return {
      status: "pretrial-failure",
      failureReason: "newton-direction-unavailable",
    };

  const trials: MainWirePassiveEquilibriumTrialRecordV3[] = [];
  for (
    let backtrackExponent = 0;
    backtrackExponent <=
    MAIN_WIRE_PASSIVE_EQUILIBRIUM_POINT_SOLVER_SHARED_POLICY_V3.maximumTrialExponentOrDampingAttempt;
    backtrackExponent += 1
  ) {
    const alpha = 2 ** -backtrackExponent;
    const trialCoordinates = applyScaledDirectionV3(
      current.internalCoordinates,
      direction,
      alpha,
    );
    const base = {
      trialIndex: backtrackExponent,
      backtrackExponent,
      alpha,
      mu: null,
      coordinates: trialCoordinates,
      currentMerit,
      exactComponentEnergyComparisonSign: null,
      lmPredictedReduction: null,
      lmGainRatio: null,
    } as const;
    if (coordinatesBitEqualV3(current.internalCoordinates, trialCoordinates)) {
      counters.rejectedTrials += 1;
      trials.push(rejectedTrialV3(base, "zero-coordinate-step"));
      continue;
    }
    if (
      !Number.isFinite(trialCoordinates.septalMidwallCapVolumeM3) ||
      !Number.isFinite(trialCoordinates.junctionRadiusM)
    ) {
      counters.rejectedTrials += 1;
      trials.push(rejectedTrialV3(base, "candidate-not-finite"));
      continue;
    }
    if (
      !(
        trialCoordinates.junctionRadiusM >
        MAIN_WIRE_PASSIVE_EQUILIBRIUM_POINT_SOLVER_SHARED_POLICY_V3.minimumJunctionRadiusMExclusive
      )
    ) {
      counters.rejectedTrials += 1;
      trials.push(rejectedTrialV3(base, "junction-radius-below-minimum"));
      continue;
    }
    let trial: MainWirePassiveEquilibriumSolverCandidateV3;
    try {
      trial = evaluateAndNormalizeCandidateV3(
        evaluator,
        trialCoordinates,
        counters,
      );
    } catch {
      counters.rejectedTrials += 1;
      trials.push(rejectedTrialV3(base, "candidate-evaluation-failed"));
      continue;
    }
    const trialGateFailure = currentCandidateGateFailureV3(trial);
    if (trialGateFailure !== null) {
      counters.rejectedTrials += 1;
      trials.push(
        candidateTrialV3(
          base,
          trial,
          trialGateFailure === "scaled-internal-hessian-not-positive-definite"
            ? "candidate-not-strictly-stable"
            : trialGateFailure === "junction-radius-below-minimum"
              ? "junction-radius-below-minimum"
              : "candidate-not-finite",
        ),
      );
      continue;
    }
    const trialMerit = residualMeritV3(trial.scaledGradient);

    if (
      policyId === MAIN_WIRE_PASSIVE_EQUILIBRIUM_RESIDUAL_ARMIJO_NEWTON_V3_ID
    ) {
      const acceptanceBoundary =
        (1 -
          2 *
            MAIN_WIRE_PASSIVE_EQUILIBRIUM_POINT_SOLVER_SHARED_POLICY_V3.armijoCoefficient *
            alpha) *
        currentMerit;
      if (
        Number.isFinite(trialMerit) &&
        Number.isFinite(acceptanceBoundary) &&
        trialMerit <= acceptanceBoundary
      ) {
        trials.push(
          acceptedTrialV3(
            base,
            trial,
            "residual-armijo-satisfied",
            trialMerit,
            acceptanceBoundary,
          ),
        );
        return acceptedDecisionV3(
          trial,
          trials,
          backtrackExponent,
          "residual-armijo-satisfied",
          alpha * maxAbs2V3(direction),
          null,
        );
      }
      counters.rejectedTrials += 1;
      trials.push(
        candidateTrialV3(
          base,
          trial,
          "residual-armijo-not-satisfied",
          trialMerit,
          acceptanceBoundary,
        ),
      );
      continue;
    }

    const rhsJ =
      MAIN_WIRE_PASSIVE_EQUILIBRIUM_POINT_SOLVER_SHARED_POLICY_V3.armijoCoefficient *
      alpha *
      MAIN_WIRE_PASSIVE_EQUILIBRIUM_POINT_SOLVER_SHARED_POLICY_V3.energyScaleJ *
      directionalDerivative;
    if (!Number.isFinite(rhsJ) || !(rhsJ < 0)) {
      counters.rejectedTrials += 1;
      trials.push(
        candidateTrialV3(
          base,
          trial,
          "rhs-not-strictly-negative",
          trialMerit,
          rhsJ,
        ),
      );
      continue;
    }
    const comparison =
      evaluateMainWirePassiveEquilibriumComponentEnergyComparisonV3({
        currentWallStoredEnergyJ: current.wallStoredEnergyJ,
        trialWallStoredEnergyJ: trial.wallStoredEnergyJ,
        rhsJ,
      });
    const componentBase = {
      ...base,
      exactComponentEnergyComparisonSign: comparison.exactSign,
    };
    if (comparison.accepted) {
      trials.push(
        acceptedTrialV3(
          componentBase,
          trial,
          "component-energy-armijo-satisfied",
          trialMerit,
          rhsJ,
        ),
      );
      return acceptedDecisionV3(
        trial,
        trials,
        backtrackExponent,
        "component-energy-armijo-satisfied",
        alpha * maxAbs2V3(direction),
        null,
      );
    }
    if (
      backtrackExponent === 0 &&
      comparison.available &&
      comparison.exactSign !== null &&
      comparison.exactSign > 0 &&
      trial.scaledForceInfinityNorm <=
        MAIN_WIRE_PASSIVE_EQUILIBRIUM_POINT_SOLVER_SHARED_POLICY_V3.scaledForceInfinityTolerance &&
      trial.strictLocalStabilityPassed &&
      trial.junctionRadiusPassed
    ) {
      trials.push(
        acceptedTrialV3(
          componentBase,
          trial,
          "terminal-root-guard-satisfied",
          trialMerit,
          rhsJ,
        ),
      );
      return acceptedDecisionV3(
        trial,
        trials,
        backtrackExponent,
        "terminal-root-guard-satisfied",
        maxAbs2V3(direction),
        null,
      );
    }
    counters.rejectedTrials += 1;
    trials.push(
      candidateTrialV3(
        componentBase,
        trial,
        comparison.available
          ? "component-energy-armijo-not-satisfied"
          : "component-energy-comparison-unavailable",
        trialMerit,
        rhsJ,
      ),
    );
  }
  return {
    status: "trial-exhausted",
    trials: deepFreezeV3(trials),
    selectedTrialIndex: null,
    selectedReason: null,
    scaledUpdateInfinityNorm: null,
  };
}

function evaluateLmIterationV3(
  current: MainWirePassiveEquilibriumSolverCandidateV3,
  currentMerit: number,
  previousState: { mu: number; nu: number } | null,
  evaluator: MainWirePassiveEquilibriumCandidateEvaluatorV3,
  counters: { candidateEvaluations: number; rejectedTrials: number },
): IterationDecisionV3 {
  const [[h00, h01], [, h11]] = current.scaledInternalHessian;
  const [g0, g1] = current.scaledGradient;
  const a00 = h00 * h00 + h01 * h01;
  const a01 = h00 * h01 + h01 * h11;
  const a11 = h01 * h01 + h11 * h11;
  const b0 = -(h00 * g0 + h01 * g1);
  const b1 = -(h01 * g0 + h11 * g1);
  let mu = previousState?.mu ?? 1e-3 * Math.max(a00, a11);
  let nu = previousState?.nu ?? 2;
  if (
    ![a00, a01, a11, b0, b1, mu, nu].every(Number.isFinite) ||
    !(mu > 0) ||
    !(nu > 0)
  )
    return {
      status: "pretrial-failure",
      failureReason: "newton-direction-unavailable",
    };
  const trials: MainWirePassiveEquilibriumTrialRecordV3[] = [];

  for (
    let dampingAttempt = 0;
    dampingAttempt <=
    MAIN_WIRE_PASSIVE_EQUILIBRIUM_POINT_SOLVER_SHARED_POLICY_V3.maximumTrialExponentOrDampingAttempt;
    dampingAttempt += 1
  ) {
    const direction = solveSymmetric2V3(a00 + mu, a01, a11 + mu, b0, b1);
    const base = {
      trialIndex: dampingAttempt,
      backtrackExponent: null,
      alpha: null,
      mu,
      currentMerit,
      exactComponentEnergyComparisonSign: null,
    } as const;
    if (direction === null) {
      counters.rejectedTrials += 1;
      trials.push(
        rejectedTrialV3({ ...base, coordinates: null }, "lm-system-singular"),
      );
      ({ mu, nu } = rejectLmAttemptV3(mu, nu));
      continue;
    }
    const trialCoordinates = applyScaledDirectionV3(
      current.internalCoordinates,
      direction,
      1,
    );
    const coordinateBase = { ...base, coordinates: trialCoordinates };
    if (coordinatesBitEqualV3(current.internalCoordinates, trialCoordinates)) {
      counters.rejectedTrials += 1;
      trials.push(rejectedTrialV3(coordinateBase, "zero-coordinate-step"));
      ({ mu, nu } = rejectLmAttemptV3(mu, nu));
      continue;
    }
    if (
      !Number.isFinite(trialCoordinates.septalMidwallCapVolumeM3) ||
      !Number.isFinite(trialCoordinates.junctionRadiusM)
    ) {
      counters.rejectedTrials += 1;
      trials.push(rejectedTrialV3(coordinateBase, "candidate-not-finite"));
      ({ mu, nu } = rejectLmAttemptV3(mu, nu));
      continue;
    }
    if (
      !(
        trialCoordinates.junctionRadiusM >
        MAIN_WIRE_PASSIVE_EQUILIBRIUM_POINT_SOLVER_SHARED_POLICY_V3.minimumJunctionRadiusMExclusive
      )
    ) {
      counters.rejectedTrials += 1;
      trials.push(
        rejectedTrialV3(coordinateBase, "junction-radius-below-minimum"),
      );
      ({ mu, nu } = rejectLmAttemptV3(mu, nu));
      continue;
    }
    let trial: MainWirePassiveEquilibriumSolverCandidateV3;
    try {
      trial = evaluateAndNormalizeCandidateV3(
        evaluator,
        trialCoordinates,
        counters,
      );
    } catch {
      counters.rejectedTrials += 1;
      trials.push(
        rejectedTrialV3(coordinateBase, "candidate-evaluation-failed"),
      );
      ({ mu, nu } = rejectLmAttemptV3(mu, nu));
      continue;
    }
    const trialGateFailure = currentCandidateGateFailureV3(trial);
    if (trialGateFailure !== null) {
      counters.rejectedTrials += 1;
      trials.push(
        candidateTrialV3(
          coordinateBase,
          trial,
          trialGateFailure === "scaled-internal-hessian-not-positive-definite"
            ? "candidate-not-strictly-stable"
            : trialGateFailure === "junction-radius-below-minimum"
              ? "junction-radius-below-minimum"
              : "candidate-not-finite",
        ),
      );
      ({ mu, nu } = rejectLmAttemptV3(mu, nu));
      continue;
    }
    const predictedReduction =
      0.5 *
      (direction[0] * (mu * direction[0] + b0) +
        direction[1] * (mu * direction[1] + b1));
    if (!Number.isFinite(predictedReduction) || !(predictedReduction > 0)) {
      counters.rejectedTrials += 1;
      trials.push(
        candidateTrialV3(
          coordinateBase,
          trial,
          "lm-predicted-reduction-not-positive",
          residualMeritV3(trial.scaledGradient),
          null,
          predictedReduction,
          null,
        ),
      );
      ({ mu, nu } = rejectLmAttemptV3(mu, nu));
      continue;
    }
    const trialMerit = residualMeritV3(trial.scaledGradient);
    const gainRatio = (currentMerit - trialMerit) / predictedReduction;
    if (
      Number.isFinite(trialMerit) &&
      Number.isFinite(gainRatio) &&
      gainRatio > 0
    ) {
      trials.push(
        acceptedTrialV3(
          coordinateBase,
          trial,
          "lm-gain-ratio-satisfied",
          trialMerit,
          null,
          predictedReduction,
          gainRatio,
        ),
      );
      const nextMu = mu * Math.max(1 / 3, 1 - (2 * gainRatio - 1) ** 3);
      return acceptedDecisionV3(
        trial,
        trials,
        dampingAttempt,
        "lm-gain-ratio-satisfied",
        maxAbs2V3(direction),
        { mu: nextMu, nu: 2 },
      );
    }
    counters.rejectedTrials += 1;
    trials.push(
      candidateTrialV3(
        coordinateBase,
        trial,
        "lm-gain-ratio-not-satisfied",
        trialMerit,
        null,
        predictedReduction,
        gainRatio,
      ),
    );
    ({ mu, nu } = rejectLmAttemptV3(mu, nu));
  }
  return {
    status: "trial-exhausted",
    trials: deepFreezeV3(trials),
    selectedTrialIndex: null,
    selectedReason: null,
    scaledUpdateInfinityNorm: null,
  };
}

function evaluateAndNormalizeCandidateV3(
  evaluator: MainWirePassiveEquilibriumCandidateEvaluatorV3,
  coordinates: MainWireNormalAdultPassiveEquilibriumCoordinatesV3,
  counters: { candidateEvaluations: number },
): MainWirePassiveEquilibriumSolverCandidateV3 {
  counters.candidateEvaluations += 1;
  const raw = evaluator(Object.freeze({ ...coordinates }));
  const wallStoredEnergyJ = {
    LVFW: raw.wallStoredEnergyJ.LVFW,
    SEP: raw.wallStoredEnergyJ.SEP,
    RVFW: raw.wallStoredEnergyJ.RVFW,
  };
  const rawStoredEnergyJ =
    wallStoredEnergyJ.LVFW + wallStoredEnergyJ.SEP + wallStoredEnergyJ.RVFW;
  const scaledGradient = [
    raw.scaledGradient[0],
    raw.scaledGradient[1],
  ] as const;
  const scaledInternalHessian = [
    [raw.scaledInternalHessian[0][0], raw.scaledInternalHessian[0][1]],
    [raw.scaledInternalHessian[1][0], raw.scaledInternalHessian[1][1]],
  ] as const;
  if (scaledInternalHessian[0][1] !== scaledInternalHessian[1][0])
    throw new Error("scaled internal Hessian must be symmetric");
  const eigenvalues = symmetricMatrix2EigenvaluesV3(scaledInternalHessian);
  const scaledForceInfinityNorm = maxAbs2V3(scaledGradient);
  const finiteFields = [
    raw.internalCoordinates.septalMidwallCapVolumeM3,
    raw.internalCoordinates.junctionRadiusM,
    wallStoredEnergyJ.LVFW,
    wallStoredEnergyJ.SEP,
    wallStoredEnergyJ.RVFW,
    rawStoredEnergyJ,
    ...scaledGradient,
    ...scaledInternalHessian[0],
    ...scaledInternalHessian[1],
    ...eigenvalues,
    scaledForceInfinityNorm,
  ];
  if (!finiteFields.every(Number.isFinite))
    throw new Error("candidate fields must be finite");
  if (!coordinatesBitEqualV3(raw.internalCoordinates, coordinates))
    throw new Error("candidate coordinates must match requested coordinates");
  return deepFreezeV3({
    internalCoordinates: { ...raw.internalCoordinates },
    wallStoredEnergyJ,
    rawStoredEnergyJ,
    scaledGradient,
    scaledForceInfinityNorm,
    scaledInternalHessian,
    scaledInternalHessianEigenvaluesAscending: eigenvalues,
    minimumScaledInternalHessianEigenvalue: eigenvalues[0],
    strictLocalStabilityPassed:
      eigenvalues[0] >
      MAIN_WIRE_PASSIVE_EQUILIBRIUM_POINT_SOLVER_SHARED_POLICY_V3.minimumScaledInternalHessianEigenvalueExclusive,
    junctionRadiusPassed:
      raw.internalCoordinates.junctionRadiusM >
      MAIN_WIRE_PASSIVE_EQUILIBRIUM_POINT_SOLVER_SHARED_POLICY_V3.minimumJunctionRadiusMExclusive,
  });
}

function currentCandidateGateFailureV3(
  candidate: MainWirePassiveEquilibriumSolverCandidateV3,
): MainWirePassiveEquilibriumPointSolverFailureReasonV3 | null {
  const finite = [
    candidate.internalCoordinates.septalMidwallCapVolumeM3,
    candidate.internalCoordinates.junctionRadiusM,
    candidate.rawStoredEnergyJ,
    ...candidate.scaledGradient,
    ...candidate.scaledInternalHessian[0],
    ...candidate.scaledInternalHessian[1],
    ...candidate.scaledInternalHessianEigenvaluesAscending,
  ].every(Number.isFinite);
  if (!finite) return "candidate-not-finite";
  if (!candidate.junctionRadiusPassed) return "junction-radius-below-minimum";
  const [[h00, h01], [, h11]] = candidate.scaledInternalHessian;
  const determinant = h00 * h11 - h01 * h01;
  if (!Number.isFinite(determinant) || determinant === 0)
    return "scaled-internal-hessian-singular";
  if (!candidate.strictLocalStabilityPassed)
    return "scaled-internal-hessian-not-positive-definite";
  return null;
}

function successV3(
  input: Parameters<
    typeof solveMainWirePassiveEquilibriumPointEngineeringV3
  >[0],
  counters: { candidateEvaluations: number; rejectedTrials: number },
  trace: readonly MainWirePassiveEquilibriumIterationRecordV3[],
  acceptedUpdates: number,
  terminalCandidate: MainWirePassiveEquilibriumSolverCandidateV3,
): MainWirePassiveEquilibriumPointSolverResultV3 {
  return deepFreezeV3({
    ownerId:
      MAIN_WIRE_PASSIVE_EQUILIBRIUM_POINT_SOLVER_COMPARISON_ENGINEERING_V1_ID,
    policyId: input.policyId,
    stageIndex: input.stageIndex,
    initialCoordinates: { ...input.initialCoordinates },
    status: "point-local-stable-root-established",
    pointLocalStableRootEstablished: true,
    terminalCandidate,
    failureReason: null,
    candidateEvaluations: counters.candidateEvaluations,
    acceptedUpdates,
    rejectedTrials: counters.rejectedTrials,
    trace: [...trace],
    officialQualificationEstablished: false,
    surfaceEstablished: false,
    branchEstablished: false,
    globalUniquenessEstablished: false,
  });
}

function failureV3(
  input: Parameters<
    typeof solveMainWirePassiveEquilibriumPointEngineeringV3
  >[0],
  counters: { candidateEvaluations: number; rejectedTrials: number },
  trace: readonly MainWirePassiveEquilibriumIterationRecordV3[],
  acceptedUpdates: number,
  failureReason: MainWirePassiveEquilibriumPointSolverFailureReasonV3,
  terminalCandidate: MainWirePassiveEquilibriumSolverCandidateV3 | null,
): MainWirePassiveEquilibriumPointSolverResultV3 {
  return deepFreezeV3({
    ownerId:
      MAIN_WIRE_PASSIVE_EQUILIBRIUM_POINT_SOLVER_COMPARISON_ENGINEERING_V1_ID,
    policyId: input.policyId,
    stageIndex: input.stageIndex,
    initialCoordinates: { ...input.initialCoordinates },
    status: "point-solve-failed",
    pointLocalStableRootEstablished: false,
    terminalCandidate,
    failureReason,
    candidateEvaluations: counters.candidateEvaluations,
    acceptedUpdates,
    rejectedTrials: counters.rejectedTrials,
    trace: [...trace],
    officialQualificationEstablished: false,
    surfaceEstablished: false,
    branchEstablished: false,
    globalUniquenessEstablished: false,
  });
}

function solveNewtonDirectionV3(
  hessian: MainWireNormalAdultPassiveEquilibriumMatrix2V3,
  gradient: readonly [number, number],
): readonly [number, number] | null {
  const [[h00, h01], [, h11]] = hessian;
  return solveSymmetric2V3(h00, h01, h11, -gradient[0], -gradient[1]);
}

function solveSymmetric2V3(
  h00: number,
  h01: number,
  h11: number,
  b0: number,
  b1: number,
): readonly [number, number] | null {
  const determinant = h00 * h11 - h01 * h01;
  if (!Number.isFinite(determinant) || determinant === 0) return null;
  const x0 = (h11 * b0 - h01 * b1) / determinant;
  const x1 = (-h01 * b0 + h00 * b1) / determinant;
  return Number.isFinite(x0) && Number.isFinite(x1)
    ? Object.freeze([x0, x1] as const)
    : null;
}

function applyScaledDirectionV3(
  coordinates: MainWireNormalAdultPassiveEquilibriumCoordinatesV3,
  direction: readonly [number, number],
  alpha: number,
): MainWireNormalAdultPassiveEquilibriumCoordinatesV3 {
  return Object.freeze({
    septalMidwallCapVolumeM3:
      coordinates.septalMidwallCapVolumeM3 +
      MAIN_WIRE_PASSIVE_EQUILIBRIUM_POINT_SOLVER_SHARED_POLICY_V3
        .coordinateScales.septalMidwallCapVolumeM3 *
        alpha *
        direction[0],
    junctionRadiusM:
      coordinates.junctionRadiusM +
      MAIN_WIRE_PASSIVE_EQUILIBRIUM_POINT_SOLVER_SHARED_POLICY_V3
        .coordinateScales.junctionRadiusM *
        alpha *
        direction[1],
  });
}

function rejectedTrialV3(
  base: Readonly<{
    trialIndex: number;
    backtrackExponent: number | null;
    alpha: number | null;
    mu: number | null;
    coordinates: MainWireNormalAdultPassiveEquilibriumCoordinatesV3 | null;
    currentMerit: number;
    exactComponentEnergyComparisonSign: -1 | 0 | 1 | null;
    lmPredictedReduction?: number | null;
    lmGainRatio?: number | null;
  }>,
  reason: MainWirePassiveEquilibriumTrialRecordV3["reason"],
): MainWirePassiveEquilibriumTrialRecordV3 {
  return deepFreezeV3({
    ...base,
    status: "rejected",
    reason,
    trialScaledForceInfinityNorm: null,
    trialMinimumScaledHessianEigenvalue: null,
    trialMerit: null,
    acceptanceBoundary: null,
    lmPredictedReduction: base.lmPredictedReduction ?? null,
    lmGainRatio: base.lmGainRatio ?? null,
  });
}

function candidateTrialV3(
  base: Parameters<typeof rejectedTrialV3>[0],
  trial: MainWirePassiveEquilibriumSolverCandidateV3,
  reason: MainWirePassiveEquilibriumTrialRecordV3["reason"],
  trialMerit = residualMeritV3(trial.scaledGradient),
  acceptanceBoundary: number | null = null,
  lmPredictedReduction: number | null = null,
  lmGainRatio: number | null = null,
): MainWirePassiveEquilibriumTrialRecordV3 {
  return deepFreezeV3({
    ...base,
    status: "rejected",
    reason,
    trialScaledForceInfinityNorm: trial.scaledForceInfinityNorm,
    trialMinimumScaledHessianEigenvalue:
      trial.minimumScaledInternalHessianEigenvalue,
    trialMerit,
    acceptanceBoundary,
    lmPredictedReduction,
    lmGainRatio,
  });
}

function acceptedTrialV3(
  base: Parameters<typeof rejectedTrialV3>[0],
  trial: MainWirePassiveEquilibriumSolverCandidateV3,
  reason: MainWirePassiveEquilibriumTrialRecordV3["reason"],
  trialMerit: number,
  acceptanceBoundary: number | null,
  lmPredictedReduction: number | null = null,
  lmGainRatio: number | null = null,
): MainWirePassiveEquilibriumTrialRecordV3 {
  return deepFreezeV3({
    ...base,
    status: "accepted",
    reason,
    trialScaledForceInfinityNorm: trial.scaledForceInfinityNorm,
    trialMinimumScaledHessianEigenvalue:
      trial.minimumScaledInternalHessianEigenvalue,
    trialMerit,
    acceptanceBoundary,
    lmPredictedReduction,
    lmGainRatio,
  });
}

function acceptedDecisionV3(
  acceptedCandidate: MainWirePassiveEquilibriumSolverCandidateV3,
  trials: readonly MainWirePassiveEquilibriumTrialRecordV3[],
  selectedTrialIndex: number,
  selectedReason: MainWirePassiveEquilibriumTrialRecordV3["reason"],
  scaledUpdateInfinityNorm: number,
  nextLmState: { mu: number; nu: number } | null,
): IterationDecisionV3 {
  return deepFreezeV3({
    status: "accepted",
    acceptedCandidate,
    trials: [...trials],
    selectedTrialIndex,
    selectedReason,
    scaledUpdateInfinityNorm,
    nextLmState,
  });
}

function rejectLmAttemptV3(mu: number, nu: number): { mu: number; nu: number } {
  return { mu: mu * nu, nu: 2 * nu };
}

function residualMeritV3(gradient: readonly [number, number]): number {
  return 0.5 * (gradient[0] * gradient[0] + gradient[1] * gradient[1]);
}

function symmetricMatrix2EigenvaluesV3(
  matrix: MainWireNormalAdultPassiveEquilibriumMatrix2V3,
): readonly [number, number] {
  const a = matrix[0][0];
  const b = matrix[0][1];
  const d = matrix[1][1];
  const center = 0.5 * (a + d);
  const radius = Math.hypot(0.5 * (a - d), b);
  return Object.freeze([center - radius, center + radius] as const);
}

function twoDiffV3(a: number, b: number): { hi: number; lo: number } {
  const hi = a - b;
  const bVirtual = a - hi;
  const aVirtual = hi + bVirtual;
  const bRound = bVirtual - b;
  const aRound = a - aVirtual;
  const lo = aRound + bRound;
  return { hi, lo };
}

function twoSumV3(a: number, b: number): { sum: number; error: number } {
  const sum = a + b;
  const bPrime = sum - a;
  const aPrime = sum - bPrime;
  const bRound = b - bPrime;
  const aRound = a - aPrime;
  const error = aRound + bRound;
  return { sum, error };
}

function growExpansionV3(
  expansion: readonly number[],
  value: number,
): number[] {
  let q = value;
  const next: number[] = [];
  for (const component of expansion) {
    const sum = twoSumV3(q, component);
    next.push(sum.error);
    q = sum.sum;
  }
  next.push(q);
  return next;
}

function expansionSignV3(expansion: readonly number[]): -1 | 0 | 1 {
  for (let index = expansion.length - 1; index >= 0; index -= 1) {
    const component = expansion[index]!;
    if (component !== 0) return component < 0 ? -1 : 1;
  }
  return 0;
}

function coordinatesBitEqualV3(
  left: MainWireNormalAdultPassiveEquilibriumCoordinatesV3,
  right: MainWireNormalAdultPassiveEquilibriumCoordinatesV3,
): boolean {
  return (
    float64BitsHexV3(left.septalMidwallCapVolumeM3) ===
      float64BitsHexV3(right.septalMidwallCapVolumeM3) &&
    float64BitsHexV3(left.junctionRadiusM) ===
      float64BitsHexV3(right.junctionRadiusM)
  );
}

function float64BitsHexV3(value: number): string {
  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  view.setFloat64(0, value, false);
  return view.getBigUint64(0, false).toString(16).padStart(16, "0");
}

function maxAbs2V3(values: readonly [number, number]): number {
  return Math.max(Math.abs(values[0]), Math.abs(values[1]));
}

function deepFreezeV3<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>))
      deepFreezeV3(child);
    Object.freeze(value);
  }
  return value;
}
