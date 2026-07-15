export const FOUR_CHAMBER_PHASE_A0_RELEASE_BLOCKERS = Object.freeze([
  "Complete ventricular-human-37c-v1 manifest and isolated target pack in Phase A1",
  "Complete atrial-human-prior-v1 explicit-diff manifest and isolated target pack in Phase A1",
  "Verify rate-free Land xi equivalence, passive/SLS, atrial one-fiber, and TriSeg component oracles",
] as const);

export const FOUR_CHAMBER_PHASE_A0_SCOPE = Object.freeze({
  phase: "Phase A0",
  purpose: "clean-slate four-chamber/TriSeg/Land/SLS contracts",
  modelCoreIntegration: false,
  browserRuntimeAdopted: false,
  mechanics2Dependency: false,
  legacyStateSchemaMigration: false,
  clinicalReleaseReady: false,
  releaseBlockers: FOUR_CHAMBER_PHASE_A0_RELEASE_BLOCKERS,
  deferredUntilPhaseA1: Object.freeze([
    "ventricular-human-37c-v1 manifest and isolated target pack",
    "atrial-human-prior-v1 manifest and isolated target pack",
    "rate-free Land xi residual and source-equivalence oracle",
    "equilibrium passive material and SLS implementation",
    "atrial one-fiber and TriSeg component oracles",
  ] as const),
} as const);
