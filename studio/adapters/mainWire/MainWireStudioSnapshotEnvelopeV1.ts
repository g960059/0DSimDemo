import {
  loadMainWireAdultFiveWallNonCoronaryReleaseV1,
} from "@/engine/scientific/assembly";
import {
  MAIN_WIRE_SCIENTIFIC_OBSERVABLE_CATALOG_V1,
  MAIN_WIRE_SCIENTIFIC_OBSERVABLE_FRAME_V1_ID,
  MAIN_WIRE_SCIENTIFIC_OBSERVABLE_REGISTRY_V1_ID,
  MAIN_WIRE_SCIENTIFIC_OBSERVABLE_REGISTRY_V1_SCHEMA_VERSION,
  SCIENTIFIC_OBSERVABLE_AVAILABILITY_VALUES_V1,
  SCIENTIFIC_OBSERVABLE_QUALITY_VALUES_V1,
  type MainWireScientificObservableDefinitionV1,
  type MainWireScientificObservableFrameV1,
  type MainWireScientificObservableIdV1,
} from "@/engine/scientific/observables";
import {
  sameSimulationReleaseRef,
  type SimulationReleaseRef,
} from "@/engine/scientific/release";
import {
  loadMainWireScientificSessionExactCheckpointV4,
  type MainWireScientificSessionExactCheckpointV4,
} from "@/engine/scientific/runtime";
import {
  STUDIO_ARTIFACT_REF_V1_SCHEMA_ID,
  RUNTIME_PRESENTATION_COVERAGE_V1,
  runtimePresentationCanonicalPhaseV1,
  type ArtifactStorePortV1,
  type RuntimeExecutionIdentityV1,
  type RuntimePresentationSnapshotV1,
  type SimulationInputRefV1,
  type SnapshotEnvelopeRefV1,
  type StudioJsonValueV1,
} from "@/studio/contracts/v1";

export const MAIN_WIRE_STUDIO_SNAPSHOT_ENVELOPE_V1_SCHEMA_ID =
  "circleheart-main-wire-studio-snapshot-envelope-v1" as const;
export const MAIN_WIRE_STUDIO_SNAPSHOT_ENVELOPE_V1_MEDIA_TYPE =
  "application/vnd.circleheart.main-wire-studio-snapshot-envelope.v1+json" as const;

export type MainWireStudioSnapshotEnvelopeContentV1 = Readonly<{
  schemaId: typeof MAIN_WIRE_STUDIO_SNAPSHOT_ENVELOPE_V1_SCHEMA_ID;
  schemaVersion: 1;
  simulationInputRef: SimulationInputRefV1;
  checkpointV4: MainWireScientificSessionExactCheckpointV4;
  /**
   * Exactly one full accepted-step projection at the checkpoint revision/time.
   * Restore/fork observations intentionally omit pressure and flow until the
   * next step, so this seed enables a no-step first paint without a saved beat.
   */
  seedObservableFrame: MainWireScientificObservableFrameV1;
  claims: Readonly<{
    exactCheckpointStored: true;
    seedObservablePointCount: 1;
    beatSampleHistoryStored: false;
    windowMetricsStored: false;
    presentationStateStored: false;
  }>;
}>;

export type MainWireStudioSnapshotEnvelopeExpectedIdentityV1 = Readonly<{
  simulationInputRef: SimulationInputRefV1;
  baseSessionInputSha256: string;
}>;

export class MainWireStudioSnapshotEnvelopeValidationErrorV1 extends Error {
  constructor(message: string) {
    super(`MainWire Studio snapshot rejected: ${message}`);
    this.name = "MainWireStudioSnapshotEnvelopeValidationErrorV1";
  }
}

export async function putMainWireStudioSnapshotEnvelopeV1(
  artifacts: ArtifactStorePortV1,
  input: Readonly<{
    simulationInputRef: SimulationInputRefV1;
    checkpointV4: MainWireScientificSessionExactCheckpointV4;
    seedObservableFrame: MainWireScientificObservableFrameV1;
  }>,
  options: Readonly<{ signal?: AbortSignal }> = {},
): Promise<SnapshotEnvelopeRefV1> {
  const content = await loadMainWireStudioSnapshotEnvelopeV1(
    {
      schemaId: MAIN_WIRE_STUDIO_SNAPSHOT_ENVELOPE_V1_SCHEMA_ID,
      schemaVersion: 1,
      simulationInputRef: input.simulationInputRef,
      checkpointV4: input.checkpointV4,
      seedObservableFrame: input.seedObservableFrame,
      claims: {
        exactCheckpointStored: true,
        seedObservablePointCount: 1,
        beatSampleHistoryStored: false,
        windowMetricsStored: false,
        presentationStateStored: false,
      },
    },
    {
      simulationInputRef: input.simulationInputRef,
      baseSessionInputSha256: input.checkpointV4.baseSessionInputSha256,
    },
  );
  const refs = await artifacts.putJsonBatch([{
    kind: "snapshot-envelope",
    mediaType: MAIN_WIRE_STUDIO_SNAPSHOT_ENVELOPE_V1_MEDIA_TYPE,
    content: content as unknown as StudioJsonValueV1,
  }], options);
  const ref = refs[0];
  if (
    refs.length !== 1
    || ref?.kind !== "snapshot-envelope"
  ) throw snapshotErrorV1("artifact store returned an invalid snapshot ref");
  return ref as SnapshotEnvelopeRefV1;
}

export async function loadMainWireStudioSnapshotEnvelopeV1(
  value: unknown,
  expectedIdentity: MainWireStudioSnapshotEnvelopeExpectedIdentityV1,
): Promise<MainWireStudioSnapshotEnvelopeContentV1> {
  const envelope = recordV1(value, "snapshot envelope");
  assertExactKeysV1(envelope, [
    "schemaId",
    "schemaVersion",
    "simulationInputRef",
    "checkpointV4",
    "seedObservableFrame",
    "claims",
  ], "snapshot envelope");
  if (
    envelope.schemaId !== MAIN_WIRE_STUDIO_SNAPSHOT_ENVELOPE_V1_SCHEMA_ID
    || envelope.schemaVersion !== 1
  ) throw snapshotErrorV1("schema identity mismatch");

  const simulationInputRef = loadSimulationInputRefV1(
    envelope.simulationInputRef,
  );
  const expectedSimulationInputRef = loadSimulationInputRefV1(
    expectedIdentity?.simulationInputRef,
  );
  if (!sameArtifactRefV1(simulationInputRef, expectedSimulationInputRef)) {
    throw snapshotErrorV1("simulation input reference mismatch");
  }
  const expectedBaseSessionInputSha256 = lowercaseSha256V1(
    expectedIdentity?.baseSessionInputSha256,
    "expected baseSessionInputSha256",
  );
  const checkpointCandidate = recordV1(
    envelope.checkpointV4,
    "checkpointV4",
  );
  const canonicalRelease =
    await loadMainWireAdultFiveWallNonCoronaryReleaseV1();
  const checkpointV4 =
    await loadMainWireScientificSessionExactCheckpointV4(
      {
        releaseRef: canonicalRelease.ref,
        baseSessionInputSha256: expectedBaseSessionInputSha256,
        stateCodec: Object.freeze({
          stateSchemaId: canonicalRelease.manifest.stateSchema.schemaId,
          stateSchemaVersion:
            canonicalRelease.manifest.stateSchema.schemaVersion,
          transactionCheckpointId:
            "main-wire-five-wall-noncoronary-checkpoint-v1",
          transactionCheckpointSchemaVersion: 1,
        }),
      },
      checkpointCandidate,
    );
  const seedObservableFrame = loadSeedObservableFrameV1(
    envelope.seedObservableFrame,
    checkpointV4,
  );
  loadClaimsV1(envelope.claims);

  return Object.freeze({
    schemaId: MAIN_WIRE_STUDIO_SNAPSHOT_ENVELOPE_V1_SCHEMA_ID,
    schemaVersion: 1 as const,
    simulationInputRef,
    checkpointV4,
    seedObservableFrame,
    claims: Object.freeze({
      exactCheckpointStored: true as const,
      seedObservablePointCount: 1 as const,
      beatSampleHistoryStored: false as const,
      windowMetricsStored: false as const,
      presentationStateStored: false as const,
    }),
  });
}

export function mainWireStudioExecutionIdentityV1(
  checkpoint: MainWireScientificSessionExactCheckpointV4,
): RuntimeExecutionIdentityV1 {
  return Object.freeze({
    modelRef:
      `${checkpoint.releaseRef.id}@${checkpoint.releaseRef.version}:sha256:${checkpoint.releaseRef.sha256}`,
    runtimeRef: "main-wire-scientific-browser-worker@1",
    solverRef: "main-wire-five-wall-noncoronary-transaction@1",
    stateCodecRef:
      `${checkpoint.stateCodec.stateSchemaId}@${checkpoint.stateCodec.stateSchemaVersion}`,
    protocolRef: "main-wire-periodic-settlement@1",
  });
}

export function mainWireStudioSeedPresentationSnapshotV1(
  envelope: MainWireStudioSnapshotEnvelopeContentV1,
): RuntimePresentationSnapshotV1 {
  const frame = envelope.seedObservableFrame;
  const values: Record<string, number> = {};
  for (const [observableId, observable] of Object.entries(frame.values)) {
    if (
      observable.availability === "available"
      && typeof observable.value === "number"
      && Number.isFinite(observable.value)
    ) values[observableId] = observable.value;
  }
  return Object.freeze({
    sample: Object.freeze({
      coverage: RUNTIME_PRESENTATION_COVERAGE_V1,
      presentationOrdinal: 0,
      acceptedRevision: frame.revision,
      acceptedTimeSec: frame.acceptedTimeSec,
      acceptedStepSpanFromPrevious: 0,
      phase: runtimePresentationCanonicalPhaseV1(frame.revision),
      values: Object.freeze(values),
      retentionReason: "stream-boundary" as const,
    }),
    metricState: Object.freeze({
      status: "collecting" as const,
      retainedSampleCount: 1,
      completedBeatCount: 0 as const,
      latestBeatEstimate: null,
    }),
  });
}

function loadSeedObservableFrameV1(
  value: unknown,
  checkpoint: MainWireScientificSessionExactCheckpointV4,
): MainWireScientificObservableFrameV1 {
  const frame = recordV1(value, "seedObservableFrame");
  assertExactKeysV1(frame, [
    "frameId",
    "registryId",
    "schemaVersion",
    "releaseRef",
    "sourceObservationId",
    "source",
    "revision",
    "acceptedTimeSec",
    "values",
  ], "seedObservableFrame");
  if (
    frame.frameId !== MAIN_WIRE_SCIENTIFIC_OBSERVABLE_FRAME_V1_ID
    || frame.registryId !== MAIN_WIRE_SCIENTIFIC_OBSERVABLE_REGISTRY_V1_ID
    || frame.schemaVersion
      !== MAIN_WIRE_SCIENTIFIC_OBSERVABLE_REGISTRY_V1_SCHEMA_VERSION
    || frame.sourceObservationId
      !== "main-wire-scientific-session-observation-v1"
    || frame.source !== "accepted-step"
    || !Number.isSafeInteger(frame.revision)
    || (frame.revision as number) < 0
    || !Number.isFinite(frame.acceptedTimeSec)
    || (frame.acceptedTimeSec as number) < 0
  ) throw snapshotErrorV1("seed observable frame identity is invalid");
  const frameRelease = loadReleaseRefV1(frame.releaseRef);
  if (!sameSimulationReleaseRef(frameRelease, checkpoint.releaseRef)) {
    throw snapshotErrorV1("seed observable release does not match checkpoint");
  }
  if (
    frame.revision !== checkpoint.transaction.revision
    || frame.acceptedTimeSec !== checkpoint.transaction.acceptedTimeSec
  ) {
    throw snapshotErrorV1(
      "seed observable revision/time does not match checkpoint",
    );
  }

  const rawValues = recordV1(frame.values, "seedObservableFrame.values");
  assertExactKeysV1(
    rawValues,
    MAIN_WIRE_SCIENTIFIC_OBSERVABLE_CATALOG_V1.map(
      ({ observableId }) => observableId,
    ),
    "seedObservableFrame.values",
  );
  const values: Record<string, unknown> = {};
  for (const definition of MAIN_WIRE_SCIENTIFIC_OBSERVABLE_CATALOG_V1) {
    values[definition.observableId] = loadObservableValueV1(
      rawValues[definition.observableId],
      definition,
    );
  }
  assertCoreSeedObservablesAvailableV1(
    values as Record<MainWireScientificObservableIdV1, Readonly<{
      value: number | null;
      availability: string;
    }>>,
  );
  return Object.freeze({
    frameId: MAIN_WIRE_SCIENTIFIC_OBSERVABLE_FRAME_V1_ID,
    registryId: MAIN_WIRE_SCIENTIFIC_OBSERVABLE_REGISTRY_V1_ID,
    schemaVersion:
      MAIN_WIRE_SCIENTIFIC_OBSERVABLE_REGISTRY_V1_SCHEMA_VERSION,
    releaseRef: frameRelease,
    sourceObservationId: "main-wire-scientific-session-observation-v1",
    source: frame.source as MainWireScientificObservableFrameV1["source"],
    revision: frame.revision as number,
    acceptedTimeSec: frame.acceptedTimeSec as number,
    values: Object.freeze(values) as MainWireScientificObservableFrameV1[
      "values"
    ],
  });
}

function loadObservableValueV1(
  value: unknown,
  definition: MainWireScientificObservableDefinitionV1<
    MainWireScientificObservableIdV1
  >,
): MainWireScientificObservableFrameV1["values"][MainWireScientificObservableIdV1] {
  const { observableId } = definition;
  const observable = recordV1(value, `observable ${observableId}`);
  assertExactKeysV1(observable, [
    "observableId",
    "value",
    "availability",
    "quality",
  ], `observable ${observableId}`);
  if (
    observable.observableId !== observableId
    || (
      observable.value !== null
      && (
        typeof observable.value !== "number"
        || !Number.isFinite(observable.value)
      )
    )
    || !SCIENTIFIC_OBSERVABLE_AVAILABILITY_VALUES_V1.includes(
      observable.availability as never,
    )
    || !SCIENTIFIC_OBSERVABLE_QUALITY_VALUES_V1.includes(
      observable.quality as never,
    )
  ) throw snapshotErrorV1(`observable ${observableId} is invalid`);
  if (definition.modelingStatus === "not-modeled") {
    if (
      observable.value !== null
      || observable.availability !== "not-modeled"
      || observable.quality !== "not-assessed"
    ) throw snapshotErrorV1(`observable ${observableId} is invalid`);
  } else if (observable.availability === "available") {
    const expectedQuality = definition.sourceKind === "accepted-state"
      ? "authoritative-state"
      : definition.sourceKind === "accepted-step-readback"
      ? "accepted-derived"
      : "solver-diagnostic";
    if (
      typeof observable.value !== "number"
      || !Number.isFinite(observable.value)
      || observable.quality !== expectedQuality
    ) throw snapshotErrorV1(`observable ${observableId} is invalid`);
  } else if (
    observable.availability === "not-modeled"
    || observable.value !== null
    || observable.quality !== "not-assessed"
  ) throw snapshotErrorV1(`observable ${observableId} is invalid`);
  return Object.freeze({
    observableId,
    value: observable.value as number | null,
    availability: observable.availability as never,
    quality: observable.quality as never,
  });
}

const REQUIRED_SEED_OBSERVABLES_V1 = Object.freeze([
  "hemodynamics.volume.LA",
  "hemodynamics.volume.RA",
  "hemodynamics.volume.LV",
  "hemodynamics.volume.RV",
  "hemodynamics.pressure.absolute.LA",
  "hemodynamics.pressure.absolute.RA",
  "hemodynamics.pressure.absolute.LV",
  "hemodynamics.pressure.absolute.RV",
  "hemodynamics.pressure.absolute.Ao",
  "hemodynamics.pressure.absolute.PA",
  "hemodynamics.pressure.absolute.PVein",
  "valve.MV.flow",
  "valve.AoV.flow",
  "valve.TV.flow",
  "valve.PV.flow",
  "valve.MV.opening_fraction",
  "valve.AoV.opening_fraction",
  "valve.TV.opening_fraction",
  "valve.PV.opening_fraction",
  "hemodynamics.flow.pulmonary_venous",
] as const satisfies readonly MainWireScientificObservableIdV1[]);

function assertCoreSeedObservablesAvailableV1(
  values: Record<MainWireScientificObservableIdV1, Readonly<{
    value: number | null;
    availability: string;
  }>>,
): void {
  const missing = REQUIRED_SEED_OBSERVABLES_V1.filter((observableId) => {
    const value = values[observableId];
    return value.availability !== "available"
      || typeof value.value !== "number"
      || !Number.isFinite(value.value);
  });
  if (missing.length > 0) {
    throw snapshotErrorV1(
      `seed observable frame lacks full core values: ${missing.join(", ")}`,
    );
  }
}

function loadSimulationInputRefV1(value: unknown): SimulationInputRefV1 {
  const ref = recordV1(value, "simulationInputRef");
  assertExactKeysV1(ref, [
    "schemaId",
    "kind",
    "sha256",
    "mediaType",
    "byteLength",
  ], "simulationInputRef");
  if (
    ref.schemaId !== STUDIO_ARTIFACT_REF_V1_SCHEMA_ID
    || ref.kind !== "simulation-input"
    || typeof ref.mediaType !== "string"
    || ref.mediaType.length === 0
    || !Number.isSafeInteger(ref.byteLength)
    || (ref.byteLength as number) < 0
  ) throw snapshotErrorV1("simulationInputRef is invalid");
  return Object.freeze({
    schemaId: STUDIO_ARTIFACT_REF_V1_SCHEMA_ID,
    kind: "simulation-input" as const,
    sha256: lowercaseSha256V1(
      ref.sha256,
      "simulationInputRef.sha256",
    ),
    mediaType: ref.mediaType,
    byteLength: ref.byteLength as number,
  });
}

function sameArtifactRefV1(
  left: SimulationInputRefV1,
  right: SimulationInputRefV1,
): boolean {
  return left.schemaId === right.schemaId
    && left.kind === right.kind
    && left.sha256 === right.sha256
    && left.mediaType === right.mediaType
    && left.byteLength === right.byteLength;
}

function loadReleaseRefV1(value: unknown): SimulationReleaseRef {
  const ref = recordV1(value, "releaseRef");
  assertExactKeysV1(ref, ["id", "version", "sha256"], "releaseRef");
  if (
    typeof ref.id !== "string"
    || ref.id.length === 0
    || typeof ref.version !== "string"
    || ref.version.length === 0
  ) throw snapshotErrorV1("releaseRef is invalid");
  return Object.freeze({
    id: ref.id,
    version: ref.version,
    sha256: lowercaseSha256V1(ref.sha256, "releaseRef.sha256"),
  });
}

function loadClaimsV1(value: unknown): void {
  const claims = recordV1(value, "claims");
  assertExactKeysV1(claims, [
    "exactCheckpointStored",
    "seedObservablePointCount",
    "beatSampleHistoryStored",
    "windowMetricsStored",
    "presentationStateStored",
  ], "claims");
  if (
    claims.exactCheckpointStored !== true
    || claims.seedObservablePointCount !== 1
    || claims.beatSampleHistoryStored !== false
    || claims.windowMetricsStored !== false
    || claims.presentationStateStored !== false
  ) throw snapshotErrorV1("snapshot claims mismatch");
}

function lowercaseSha256V1(value: unknown, path: string): string {
  if (typeof value !== "string" || !/^[0-9a-f]{64}$/.test(value)) {
    throw snapshotErrorV1(`${path} must be lowercase SHA-256 hex`);
  }
  return value;
}

function recordV1(value: unknown, path: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw snapshotErrorV1(`${path} must be an object`);
  }
  return value as Record<string, unknown>;
}

function assertExactKeysV1(
  value: Record<string, unknown>,
  expected: readonly string[],
  path: string,
): void {
  const actual = Object.keys(value).sort();
  const sortedExpected = [...expected].sort();
  if (
    actual.length !== sortedExpected.length
    || actual.some((key, index) => key !== sortedExpected[index])
  ) throw snapshotErrorV1(`${path} field set mismatch`);
}

function snapshotErrorV1(
  message: string,
): MainWireStudioSnapshotEnvelopeValidationErrorV1 {
  return new MainWireStudioSnapshotEnvelopeValidationErrorV1(message);
}
