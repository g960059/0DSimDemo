/**
 * Portable Studio identities.
 *
 * These aliases deliberately remain plain strings/numbers at the contract
 * boundary. Validation belongs at command ingress; transport adapters must not
 * depend on JavaScript class instances or symbols to preserve identity.
 */
export type StudioSessionIdV1 = string;
export type ScenarioIdV1 = string;
export type RuntimeBranchIdV1 = string;
export type RuntimeCandidateIdV1 = string;
export type RuntimeIntentIdV1 = string;
export type TargetGenerationV1 = number;
export type PresentationRevisionV1 = number;
export type Sha256HexV1 = string;

export const INITIAL_TARGET_GENERATION_V1 = 0 as const;
export const INITIAL_PRESENTATION_REVISION_V1 = 0 as const;
