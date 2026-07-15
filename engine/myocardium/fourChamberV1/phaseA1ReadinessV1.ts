export const FOUR_CHAMBER_PHASE_A1_COMPLETION_STATUS_V1 =
  "component-oracles-complete-with-explicit-release-blockers" as const;

export const FOUR_CHAMBER_PHASE_A1_RELEASE_BLOCKERS_V1 = Object.freeze([
  "Replace source-regression-only Land packs and project-synthetic priors with predeclared experimental acceptance evidence before physiological release claims",
  "Complete Phase B/C closed-loop DAE assembly, root conditioning, whole-heart conservation/work audits, and solver convergence gates",
  "Complete closed-loop-only component gates including active atrial A-wave causality, graded PH roots, valve-floor convergence, and paired SLS-on/off causal attribution without a predeclared morphology outcome",
  "Freeze and content-hash the Phase B valve/inlet numerical policy for A_num, epsilon_P, and epsilon_Q",
] as const);

export const FOUR_CHAMBER_PHASE_A1_COMPONENT_STATUS_V1 = Object.freeze({
  phase: "Phase A1 component oracles",
  completionStatus: FOUR_CHAMBER_PHASE_A1_COMPLETION_STATUS_V1,
  runtimeBoundary: Object.freeze({
    modelCoreIntegration: false,
    browserRuntimeAdopted: false,
    mechanics2Dependency: false,
  }),
  components: Object.freeze({
    tissueManifests: "candidate-prior-content-hashed",
    isolatedLandTargetPacks: "source-regression-only-not-experimental-validation",
    exactEventCalcium: "implemented",
    landRateFreeXiEquivalence: "implemented-continuous-and-BE",
    equilibriumPassive: "implemented-energy-C2-convexity-gated",
    oneStateSls: "implemented-continuous-and-BE-passivity",
    atrialOneFiber: "implemented-virtual-work",
    publishedTriSeg2009: "implemented-Taylor-oracle-with-Appendix-A4-tension-error-gate",
    appendixAcAnalyticalReference:
      "canonical-within-original-spherical-one-fiber-assumptions-high-precision-pack-pinned",
    vascularCompliance: "implemented-energy-derived",
    signedValveAndInletLoss:
      "implemented-component-equations-phase-b-selection-policy-unbound",
    commonPericardium: "implemented-energy-derived",
  }),
  releaseBlockers: FOUR_CHAMBER_PHASE_A1_RELEASE_BLOCKERS_V1,
  phaseA1Complete: true,
  closedLoopReleaseEligible: false,
  clinicalReleaseReady: false,
} as const);
