import {
  loadMainWireAdultFiveWallNonCoronaryReleaseV1,
} from "@/engine/scientific/assembly";
import type {
  MainWireScientificResolvedSessionInputV1,
} from "@/engine/scientific/inputs";
import {
  sameSimulationReleaseRef,
} from "@/engine/scientific/release";
import {
  loadMainWireScientificSessionExactCheckpointV4,
  type MainWireScientificSessionExactCheckpointV4,
} from "@/engine/scientific/runtime";
import {
  type ArtifactStorePortV1,
  type SimulationInputRefV1,
  type SnapshotEnvelopeRefV1,
  type StudioJsonValueV1,
} from "@/studio/contracts/v1";

export const MAIN_WIRE_STUDIO_REPLAY_CHECKPOINT_ENVELOPE_V1_SCHEMA_ID =
  "circleheart-main-wire-studio-replay-checkpoint-envelope-v1" as const;
export const MAIN_WIRE_STUDIO_REPLAY_CHECKPOINT_ENVELOPE_V1_MEDIA_TYPE =
  "application/vnd.circleheart.main-wire-studio-replay-checkpoint-envelope.v1+json" as const;

export type MainWireStudioReplayCheckpointEnvelopeContentV1 = Readonly<{
  schemaId:
    typeof MAIN_WIRE_STUDIO_REPLAY_CHECKPOINT_ENVELOPE_V1_SCHEMA_ID;
  schemaVersion: 1;
  simulationInputRef: SimulationInputRefV1;
  checkpointV4: MainWireScientificSessionExactCheckpointV4;
  claims: Readonly<{
    exactCheckpointStored: true;
    acceptedStepHistoryStored: false;
    restoredBoundaryRequiresCheckpointBoundaryProvenance: true;
    presentationStateStored: false;
  }>;
}>;

export class MainWireStudioReplayCheckpointEnvelopeValidationErrorV1
extends Error {
  constructor(message: string) {
    super(`MainWire Studio replay checkpoint rejected: ${message}`);
    this.name =
      "MainWireStudioReplayCheckpointEnvelopeValidationErrorV1";
  }
}

export async function putMainWireStudioReplayCheckpointEnvelopeV1(
  artifacts: ArtifactStorePortV1,
  input: Readonly<{
    simulationInputRef: SimulationInputRefV1;
    resolvedSessionInput: MainWireScientificResolvedSessionInputV1;
    checkpointV4: MainWireScientificSessionExactCheckpointV4;
  }>,
): Promise<SnapshotEnvelopeRefV1> {
  const content = await loadMainWireStudioReplayCheckpointEnvelopeV1(
    {
      schemaId:
        MAIN_WIRE_STUDIO_REPLAY_CHECKPOINT_ENVELOPE_V1_SCHEMA_ID,
      schemaVersion: 1,
      simulationInputRef: input.simulationInputRef,
      checkpointV4: input.checkpointV4,
      claims: {
        exactCheckpointStored: true,
        acceptedStepHistoryStored: false,
        restoredBoundaryRequiresCheckpointBoundaryProvenance: true,
        presentationStateStored: false,
      },
    },
    {
      simulationInputRef: input.simulationInputRef,
      resolvedSessionInput: input.resolvedSessionInput,
    },
  );
  const ref = await artifacts.putJson({
    kind: "snapshot-envelope",
    mediaType:
      MAIN_WIRE_STUDIO_REPLAY_CHECKPOINT_ENVELOPE_V1_MEDIA_TYPE,
    content: content as unknown as StudioJsonValueV1,
  });
  if (ref.kind !== "snapshot-envelope") {
    throw replayCheckpointErrorV1(
      "artifact store returned the wrong artifact kind",
    );
  }
  return ref as SnapshotEnvelopeRefV1;
}

export async function loadMainWireStudioReplayCheckpointEnvelopeV1(
  value: unknown,
  expected: Readonly<{
    simulationInputRef: SimulationInputRefV1;
    resolvedSessionInput: MainWireScientificResolvedSessionInputV1;
  }>,
): Promise<MainWireStudioReplayCheckpointEnvelopeContentV1> {
  const envelope = recordV1(value, "envelope");
  assertExactKeysV1(envelope, [
    "schemaId",
    "schemaVersion",
    "simulationInputRef",
    "checkpointV4",
    "claims",
  ], "envelope");
  if (
    envelope.schemaId
      !== MAIN_WIRE_STUDIO_REPLAY_CHECKPOINT_ENVELOPE_V1_SCHEMA_ID
    || envelope.schemaVersion !== 1
    || !sameArtifactRefV1(
      envelope.simulationInputRef,
      expected.simulationInputRef,
    )
  ) throw replayCheckpointErrorV1("envelope identity mismatch");
  const canonicalRelease =
    await loadMainWireAdultFiveWallNonCoronaryReleaseV1();
  if (
    expected.resolvedSessionInput.sessionInputSha256.length !== 64
    || !sameSimulationReleaseRef(
      expected.resolvedSessionInput.releaseRef,
      canonicalRelease.ref,
    )
  ) throw replayCheckpointErrorV1("resolved input identity mismatch");
  const checkpointV4 =
    await loadMainWireScientificSessionExactCheckpointV4(
      {
        releaseRef: canonicalRelease.ref,
        baseSessionInputSha256:
          expected.resolvedSessionInput.sessionInputSha256,
        stateCodec: Object.freeze({
          stateSchemaId:
            canonicalRelease.manifest.stateSchema.schemaId,
          stateSchemaVersion:
            canonicalRelease.manifest.stateSchema.schemaVersion,
          transactionCheckpointId:
            "main-wire-five-wall-noncoronary-checkpoint-v1",
          transactionCheckpointSchemaVersion: 1,
        }),
      },
      envelope.checkpointV4,
    );
  const claims = recordV1(envelope.claims, "claims");
  assertExactKeysV1(claims, [
    "exactCheckpointStored",
    "acceptedStepHistoryStored",
    "restoredBoundaryRequiresCheckpointBoundaryProvenance",
    "presentationStateStored",
  ], "claims");
  if (
    claims.exactCheckpointStored !== true
    || claims.acceptedStepHistoryStored !== false
    || claims.restoredBoundaryRequiresCheckpointBoundaryProvenance
      !== true
    || claims.presentationStateStored !== false
  ) throw replayCheckpointErrorV1("claims mismatch");

  return Object.freeze({
    schemaId:
      MAIN_WIRE_STUDIO_REPLAY_CHECKPOINT_ENVELOPE_V1_SCHEMA_ID,
    schemaVersion: 1 as const,
    simulationInputRef: expected.simulationInputRef,
    checkpointV4,
    claims: Object.freeze({
      exactCheckpointStored: true as const,
      acceptedStepHistoryStored: false as const,
      restoredBoundaryRequiresCheckpointBoundaryProvenance:
        true as const,
      presentationStateStored: false as const,
    }),
  });
}

function sameArtifactRefV1(
  value: unknown,
  expected: SimulationInputRefV1,
): boolean {
  if (value === null || typeof value !== "object") return false;
  const ref = value as Record<string, unknown>;
  return ref.schemaId === expected.schemaId
    && ref.kind === expected.kind
    && ref.sha256 === expected.sha256
    && ref.mediaType === expected.mediaType
    && ref.byteLength === expected.byteLength;
}

function recordV1(
  value: unknown,
  label: string,
): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw replayCheckpointErrorV1(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function assertExactKeysV1(
  value: Readonly<Record<string, unknown>>,
  expected: readonly string[],
  label: string,
): void {
  const actual = Object.keys(value).sort();
  const sortedExpected = [...expected].sort();
  if (
    actual.length !== sortedExpected.length
    || actual.some((key, index) => key !== sortedExpected[index])
  ) throw replayCheckpointErrorV1(`${label} fields mismatch`);
}

function replayCheckpointErrorV1(
  message: string,
): MainWireStudioReplayCheckpointEnvelopeValidationErrorV1 {
  return new MainWireStudioReplayCheckpointEnvelopeValidationErrorV1(
    message,
  );
}
