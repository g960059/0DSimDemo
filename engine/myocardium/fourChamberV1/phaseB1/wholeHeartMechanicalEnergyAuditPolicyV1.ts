export const PHASE_B1_WHOLE_HEART_MECHANICAL_ENERGY_AUDIT_POLICY_V1 =
  Object.freeze({
    policyId: "phase-b1-whole-heart-mechanical-energy-audit-policy-v1",
    landAdapterWorkRelativeTolerance: 1e-12,
    correctedStageLedgerNormalizedResidualTolerance: 1e-5,
    publishedTaylorGeometryDiagnosticOnly: true,
    publishedTaylorGeometryWorkConjugacyAccepted: false,
    backwardEulerUnresolvedIncrementAcceptanceGate: false,
    testReferenceOnly: true,
    releaseRuntimeReachable: false,
  } as const);

/** Additive policy for the mechanistic-rebuild energy owner; V1 remains hash-stable. */
export const PHASE_B1_FINITE_THICKNESS_TRISEG_ENERGY_AUDIT_POLICY_V2 =
  Object.freeze({
    policyId: "phase-b1-finite-thickness-triseg-energy-audit-policy-v2",
    bendingStoredEnergyIncluded: true,
    publishedTaylorDefectSubtracted: false,
    normalizedWorkConjugacyTolerance: 1e-8,
    legacyV1PolicyMutated: false,
  } as const);
