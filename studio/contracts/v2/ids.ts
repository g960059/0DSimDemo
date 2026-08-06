/**
 * Domain identities are opaque strings. Hashes remain registry/storage
 * implementation details and never become Studio domain identity.
 */
export type ModelIdV2 = string;
export type ModelFamilyIdV2 = string;
export type ExperimentIdV2 = string;
export type ExperimentSnapshotIdV2 = string;
export type ScenarioIdV2 = string;
export type ExperimentPlacementIdV2 = string;

/**
 * The only numeric revision retained by the authoring model is an optimistic
 * concurrency token for the mutable Experiment. It is not immutable content
 * identity and is never referenced by an article placement.
 */
export type ExperimentVersionV2 = number;
