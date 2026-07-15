/**
 * Frozen numerical policy for the Phase B0 test reference. This object is
 * included in the synthetic-case hash and is never a physiological parameter.
 */
export const PHASE_B0_MONOLITHIC_BE_NUMERICAL_POLICY_V1 = Object.freeze({
  policyId: "phase-b0-monolithic-be-test-reference-numerics-v1",
  algorithmicJacobianScaledStepCandidates: Object.freeze([
    2 ** -18,
    2 ** -19,
    2 ** -20,
    2 ** -21,
    2 ** -22,
    2 ** -23,
    2 ** -24,
  ] as const),
  algorithmicJacobianScaledStep: 2 ** -19,
  independentDirectionalAuditStepRatioToConstruction: 0.25,
  algorithmicJacobianAuditDirectionIds: Object.freeze([
    "mixed",
    "blood-volumes",
    "inertial-flows",
    "sls-states",
    "triseg-coordinates",
  ] as const),
  algorithmicJacobianAuditDirectionCoefficients: Object.freeze({
    mixedIndexModulo7: Object.freeze([-3, -2, -1, 0.5, 1, 2, 3] as const),
    bloodVolumesEvenOdd: Object.freeze([1, -0.75] as const),
    inertialFlowsEvenOdd: Object.freeze([0.8, -1] as const),
    slsStatesEvenOdd: Object.freeze([1, -0.6] as const),
    triSegCoordinates: Object.freeze([1, -0.7] as const),
  }),
  algorithmicJacobianAuditEvaluationState:
    "accepted-first-backward-euler-step-from-content-hashed-symmetric-initial-state",
  slsJacobianAuditDirectionOmittedWhenTopologyOff: true,
  algorithmicJacobianStepSelectionRule:
    "largest-candidate-passing-on-off-predeclared-block-directions-at-relative-1e-6",
  algorithmicJacobianDirectionalErrorNorm:
    "relative-two-norm-of-scaled-directional-residual",
  algorithmicJacobianMaximumAbsoluteRowDifferenceUse:
    "diagnostic-only-because-a-universal-absolute-cutoff-is-not-scale-invariant",
  algorithmicJacobianSelectionEvidenceStatus:
    "exploratory-b0-candidate-not-phase-b-acceptance-evidence",
  monolithicJacobianDirectionalRelativeTolerance: 1e-6,
  differentiatedConstraintDirectionalStepSec: 1e-7,
  differentiatedConstraintStepHalvingFactor: 2,
  differentiatedKinematicsHalvingRelativeTolerance: 1e-6,
  shortHorizonDifferentiatedConstraintResidualToleranceNPerMSec: 1e-5,
  shortHorizonTriSegScaledCoordinateStepNorm: "scaled-infinity-norm",
  shortHorizonTriSegScaledCoordinateStepTolerance: 0.05,
  shortHorizonTriSegReferenceJacobianDeterminantSign: 1,
  shortHorizonStageEnergyRhoTolerance: 1e-5,
  shortHorizonRelativeTotalBloodVolumeTolerance: 1e-10,
  shortHorizonTriSegResidualToleranceNPerM: 1e-8,
  shortHorizonSlsAlphaMismatchTolerance: 1e-8,
  shortHorizonSlsPassivityIdentityRhoTolerance: 1e-10,
  energyLedgerOrderWaiverRho: 1e-6,
  backwardEulerObservedOrderThreshold: 0.8,
  strictBloodVolumeLowerBoundM3: 1e-12,
  strictJunctionRadiusLowerBoundM: 1e-6,
  maxNewtonIterations: 24,
  rootResidualInfinityTolerance: 1e-8,
  rootUpdateInfinityTolerance: 1e-8,
  armijoCoefficient: 1e-4,
  lineSearchContraction: 0.5,
  maxLineSearchBacktracks: 24,
  minimumStepLength: 1e-12,
  fractionToBoundarySafety: 0.995,
  relativePivotTolerance: 64 * Number.EPSILON,
  deterministicSubstepFactors: Object.freeze([1, 2, 4, 8] as const),
  adaptiveRescaling: false,
  postStepBloodVolumeProjection: false,
  flowClamp: false,
  fallbackMechanics: false,
  testOnly: true,
  physiologicalParameter: false,
} as const);

export type PhaseB0MonolithicBeNumericalPolicyV1 =
  typeof PHASE_B0_MONOLITHIC_BE_NUMERICAL_POLICY_V1;
