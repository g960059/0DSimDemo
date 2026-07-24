import type { Sha256HexV1 } from "./ids";

export const STUDIO_ARTIFACT_REF_V1_SCHEMA_ID =
  "circleheart-studio-artifact-ref-v1" as const;
export const STUDIO_RUN_ARTIFACT_CONTENT_V1_SCHEMA_ID =
  "circleheart-studio-run-artifact-content-v1" as const;

export type StudioJsonPrimitiveV1 = null | boolean | number | string;
export type StudioJsonArrayV1 = readonly StudioJsonValueV1[];
export type StudioJsonObjectV1 = Readonly<{
  [key: string]: StudioJsonValueV1;
}>;
export type StudioJsonValueV1 =
  | StudioJsonPrimitiveV1
  | StudioJsonArrayV1
  | StudioJsonObjectV1;

export type StudioArtifactKindV1 =
  | "model-package"
  | "run-artifact"
  | "simulation-input"
  | "snapshot-envelope"
  | "studio-json";

export type StudioArtifactRefV1<
  TKind extends StudioArtifactKindV1 = StudioArtifactKindV1,
> = Readonly<{
  schemaId: typeof STUDIO_ARTIFACT_REF_V1_SCHEMA_ID;
  kind: TKind;
  sha256: Sha256HexV1;
  mediaType: string;
  byteLength: number;
}>;

export type SnapshotEnvelopeRefV1 =
  StudioArtifactRefV1<"snapshot-envelope">;
export type RunArtifactRefV1 = StudioArtifactRefV1<"run-artifact">;

/**
 * Exact model/runtime identities which determine numerical reproducibility.
 * UI state, actors, clocks, and Studio generations are intentionally absent.
 */
export type RuntimeExecutionIdentityV1 = Readonly<{
  modelRef: string;
  runtimeRef: string;
  solverRef: string;
  stateCodecRef: string;
  protocolRef: string;
}>;

/**
 * Canonical content persisted when an ephemeral steady candidate is pinned.
 *
 * targetGeneration is deliberately excluded: it correlates asynchronous work
 * inside one interactive session, but must not make identical scientific
 * results hash differently. Signal samples and window metrics are derived from
 * the settled one-point snapshot and are likewise excluded.
 */
export type StudioRunArtifactContentV1 = Readonly<{
  schemaId: typeof STUDIO_RUN_ARTIFACT_CONTENT_V1_SCHEMA_ID;
  sourceRunRef: RunArtifactRefV1;
  targetInputSha256: Sha256HexV1;
  snapshotRef: SnapshotEnvelopeRefV1;
  execution: RuntimeExecutionIdentityV1;
  claims: Readonly<{
    steadyStatus: "converged";
    numericalHealth: "passed";
    snapshotIsWarmRestartable: true;
    canonicalSignalSamplesStored: false;
    canonicalWindowMetricsStored: false;
  }>;
}>;

export type StudioJsonWriteV1<
  TKind extends StudioArtifactKindV1 = StudioArtifactKindV1,
> = Readonly<{
  kind: TKind;
  mediaType: string;
  content: StudioJsonValueV1;
}>;
