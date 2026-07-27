import {
  EXACT_SIGNAL_EXPORT_CONTENT_V1_SCHEMA_ID,
  EXACT_SIGNAL_EXPORT_MANIFEST_V1_SCHEMA_ID,
  EXACT_SIGNAL_EXPORT_V1_MEDIA_TYPE,
  EXACT_SIGNAL_REPLAY_COVERAGE_V1,
  type ArtifactStorePortV1,
  type ExactSignalExportArtifactRefV1,
  type ExactSignalExportManifestDraftV1,
  type ExactSignalExportManifestV1,
  type ExactSignalExportResultV1,
  type ExactSignalExportWriterPortV1,
  type ExactSignalObservableValueV1,
  type ExactSignalSampleV1,
  type StudioJsonValueV1,
} from "@/studio/contracts/v1";
import {
  cloneAndFreezeStudioJsonV1,
  sha256StudioJsonHexV1,
  studioCanonicalJsonStringifyV1,
} from "./studioCanonicalJsonV1";

const EXACT_DT_SEC_V1 = 0.002;
const TIME_TOLERANCE_SEC_V1 = 1e-11;
const AVAILABILITY_VALUES_V1 = new Set([
  "available",
  "not-modeled",
  "not-measurable",
  "not-converged",
  "not-evaluated-at-accepted-state",
]);
const QUALITY_VALUES_V1 = new Set([
  "authoritative-state",
  "accepted-derived",
  "solver-diagnostic",
  "not-assessed",
]);

export class StudioExactSignalExportValidationErrorV1 extends Error {
  constructor(message: string) {
    super(`Studio exact signal export rejected: ${message}`);
    this.name = "StudioExactSignalExportValidationErrorV1";
  }
}

/**
 * The writer is the second validation boundary after replay. This prevents a
 * future replay transport from turning partial, reordered, or presentation
 * samples into an artifact merely because it reached storage.
 */
export class StudioExactSignalExportWriterV1
implements ExactSignalExportWriterPortV1 {
  constructor(private readonly artifacts: ArtifactStorePortV1) {}

  async writeExactSignalExport(
    write: Parameters<
      ExactSignalExportWriterPortV1["writeExactSignalExport"]
    >[0],
  ): Promise<ExactSignalExportResultV1> {
    const manifestDraft = detachedManifestV1(write.manifest);
    assertManifestDraftV1(manifestDraft);
    if (
      write.samples === null
      || typeof write.samples !== "object"
      || !(Symbol.asyncIterator in write.samples)
    ) throw exportErrorV1("samples must be an async iterable");

    const samples: ExactSignalSampleV1[] = [];
    for await (const sample of write.samples) {
      const detachedSample = detachedSampleV1(sample, samples.length);
      assertSampleV1(detachedSample, samples.length);
      const previous = samples.at(-1);
      if (previous !== undefined) {
        assertAdjacentSamplesV1(
          previous,
          detachedSample,
          samples.length,
        );
      }
      samples.push(detachedSample);
    }
    assertCompleteCoverageV1(manifestDraft, samples);

    const frozenSamples = Object.freeze([...samples]);
    const canonicalData = studioCanonicalJsonStringifyV1(frozenSamples);
    const dataSha256 = await sha256StudioJsonHexV1(frozenSamples);
    const first = frozenSamples[0]!;
    const final = frozenSamples.at(-1)!;
    const checkpointBoundarySampleCount = frozenSamples[0]!.provenance
        === "checkpoint-boundary"
      ? 1 as const
      : 0 as const;
    const manifest = Object.freeze({
      ...manifestDraft,
      firstRevision: first.revision,
      finalRevision: final.revision,
      firstSimulationTimeSec: first.simulationTimeSec,
      finalSimulationTimeSec: final.simulationTimeSec,
      checkpointBoundarySampleCount,
      acceptedStepSampleCount:
        frozenSamples.length - checkpointBoundarySampleCount,
      dataSha256,
      dataByteLength:
        new TextEncoder().encode(canonicalData).byteLength,
    }) satisfies ExactSignalExportManifestV1;
    const content = Object.freeze({
      schemaId: EXACT_SIGNAL_EXPORT_CONTENT_V1_SCHEMA_ID,
      schemaVersion: 1 as const,
      manifest,
      samples: frozenSamples,
    });
    const artifactRef = await this.artifacts.putJson({
      kind: "exact-signal-export",
      mediaType: EXACT_SIGNAL_EXPORT_V1_MEDIA_TYPE,
      content: content as unknown as StudioJsonValueV1,
    });
    if (artifactRef.kind !== "exact-signal-export") {
      throw exportErrorV1("artifact store returned the wrong artifact kind");
    }
    return Object.freeze({
      artifactRef: artifactRef as ExactSignalExportArtifactRefV1,
      manifest,
    });
  }
}

function detachedManifestV1(
  manifest: ExactSignalExportManifestDraftV1,
): ExactSignalExportManifestDraftV1 {
  try {
    return cloneAndFreezeStudioJsonV1(
      manifest as unknown as StudioJsonValueV1,
    ) as unknown as ExactSignalExportManifestDraftV1;
  } catch (error) {
    throw exportErrorV1(`manifest is not canonical JSON: ${errorMessageV1(error)}`);
  }
}

function detachedSampleV1(
  sample: ExactSignalSampleV1,
  index: number,
): ExactSignalSampleV1 {
  try {
    return cloneAndFreezeStudioJsonV1(
      sample as unknown as StudioJsonValueV1,
    ) as unknown as ExactSignalSampleV1;
  } catch (error) {
    throw exportErrorV1(
      `sample ${index} is not canonical JSON: ${errorMessageV1(error)}`,
    );
  }
}

function assertManifestDraftV1(
  manifest: ExactSignalExportManifestDraftV1,
): void {
  if (manifest === null || typeof manifest !== "object") {
    throw exportErrorV1("manifest must be an object");
  }
  const { coverage, origin, claims } = manifest;
  if (
    !hasExactKeysV1(manifest, [
      "schemaId",
      "schemaVersion",
      "origin",
      "intervalStartOffsetSec",
      "intervalDurationSec",
      "coverage",
      "claims",
    ])
    || manifest.schemaId !== EXACT_SIGNAL_EXPORT_MANIFEST_V1_SCHEMA_ID
    || manifest.schemaVersion !== 1
    || origin === null
    || typeof origin !== "object"
    || !validReplayOriginV1(origin)
    || !Number.isSafeInteger(origin.boundaryRevision)
    || origin.boundaryRevision < 0
    || !finiteNonnegativeV1(origin.boundaryTimeSec)
    || !finiteGridDurationV1(manifest.intervalStartOffsetSec, true)
    || !finiteGridDurationV1(manifest.intervalDurationSec, false)
    || coverage === null
    || !hasExactKeysV1(coverage, [
      "kind",
      "dtSec",
      "observationStride",
      "intervalCount",
      "sampleCount",
    ])
    || coverage.kind !== EXACT_SIGNAL_REPLAY_COVERAGE_V1
    || coverage.dtSec !== EXACT_DT_SEC_V1
    || coverage.observationStride !== 1
    || !Number.isSafeInteger(coverage.intervalCount)
    || coverage.intervalCount < 1
    || coverage.intervalCount
      !== gridStepCountV1(manifest.intervalDurationSec)
    || coverage.sampleCount !== coverage.intervalCount + 1
    || claims === null
    || typeof claims !== "object"
    || !hasExactKeysV1(claims, [
      "onDemandResimulation",
      "fastForwardIntermediateObservationsRetained",
      "restoredBoundaryProvenance",
      "acceptedStepRevisionAndTimeContinuityValidated",
      "smoothingOrInterpolationApplied",
      "presentationSamplesConsumed",
      "liveRuntimeBranchMutated",
    ])
    || claims?.onDemandResimulation !== true
    || claims.fastForwardIntermediateObservationsRetained !== false
    || claims.restoredBoundaryProvenance !== "checkpoint-boundary"
    || claims.acceptedStepRevisionAndTimeContinuityValidated !== true
    || claims.smoothingOrInterpolationApplied !== false
    || claims.presentationSamplesConsumed !== false
    || claims.liveRuntimeBranchMutated !== false
  ) throw exportErrorV1("manifest identity or claims mismatch");
}

function assertSampleV1(
  sample: ExactSignalSampleV1,
  index: number,
): void {
  if (
    sample === null
    || typeof sample !== "object"
    || !hasExactKeysV1(sample, [
      "coverage",
      "provenance",
      "revision",
      "simulationTimeSec",
      "phase01",
      "values",
    ])
    || sample.coverage !== EXACT_SIGNAL_REPLAY_COVERAGE_V1
    || (
      sample.provenance !== "checkpoint-boundary"
      && sample.provenance !== "accepted-step"
    )
    || !Number.isSafeInteger(sample.revision)
    || sample.revision < 0
    || !finiteNonnegativeV1(sample.simulationTimeSec)
    || !Number.isFinite(sample.phase01)
    || sample.phase01 < 0
    || sample.phase01 >= 1
    || !sameTimeV1(
      sample.phase01,
      canonicalPhase01V1(sample.simulationTimeSec),
    )
    || sample.values === null
    || typeof sample.values !== "object"
    || Array.isArray(sample.values)
  ) throw exportErrorV1(`sample ${index} identity mismatch`);
  const entries = Object.entries(sample.values);
  if (entries.length === 0) {
    throw exportErrorV1(`sample ${index} has no observable catalog`);
  }
  for (const [observableId, value] of entries) {
    assertObservableValueV1(observableId, value, index);
  }
}

function assertObservableValueV1(
  observableId: string,
  value: ExactSignalObservableValueV1,
  sampleIndex: number,
): void {
  if (
    observableId.length === 0
    || value === null
    || typeof value !== "object"
    || !hasExactKeysV1(value, [
      "observableId",
      "value",
      "availability",
      "quality",
    ])
    || value.observableId !== observableId
    || (
      value.value !== null
      && !Number.isFinite(value.value)
    )
    || !AVAILABILITY_VALUES_V1.has(value.availability)
    || !QUALITY_VALUES_V1.has(value.quality)
    || (
      value.availability === "available"
        ? value.value === null || value.quality === "not-assessed"
        : value.value !== null || value.quality !== "not-assessed"
    )
  ) {
    throw exportErrorV1(
      `sample ${sampleIndex} observable ${observableId} mismatch`,
    );
  }
}

function assertAdjacentSamplesV1(
  previous: ExactSignalSampleV1,
  sample: ExactSignalSampleV1,
  index: number,
): void {
  if (
    sample.provenance !== "accepted-step"
    || sample.revision !== previous.revision + 1
    || !sameTimeV1(
      sample.simulationTimeSec,
      previous.simulationTimeSec + EXACT_DT_SEC_V1,
    )
    || !sameStringSetV1(
      Object.keys(previous.values),
      Object.keys(sample.values),
    )
  ) throw exportErrorV1(`sample ${index} is not exact-step contiguous`);
}

function assertCompleteCoverageV1(
  manifest: ExactSignalExportManifestDraftV1,
  samples: readonly ExactSignalSampleV1[],
): void {
  const expectedCount = manifest.coverage.sampleCount;
  const fastForwardStepCount =
    gridStepCountV1(manifest.intervalStartOffsetSec);
  const expectedFirstRevision =
    manifest.origin.boundaryRevision + fastForwardStepCount;
  const expectedFirstTimeSec =
    manifest.origin.boundaryTimeSec
      + manifest.intervalStartOffsetSec;
  const first = samples[0];
  const final = samples.at(-1);
  const expectedFirstProvenance = fastForwardStepCount === 0
    ? "checkpoint-boundary"
    : "accepted-step";
  if (
    samples.length !== expectedCount
    || first === undefined
    || final === undefined
    || first.provenance !== expectedFirstProvenance
    || first.revision !== expectedFirstRevision
    || !sameTimeV1(first.simulationTimeSec, expectedFirstTimeSec)
    || final.revision
      !== expectedFirstRevision + manifest.coverage.intervalCount
    || !sameTimeV1(
      final.simulationTimeSec,
      first.simulationTimeSec + manifest.intervalDurationSec,
    )
  ) throw exportErrorV1("sample coverage does not match the manifest");
}

function sameStringSetV1(
  left: readonly string[],
  right: readonly string[],
): boolean {
  if (left.length !== right.length) return false;
  const rightSet = new Set(right);
  return left.every((value) => rightSet.has(value));
}

function hasExactKeysV1(
  value: object,
  expected: readonly string[],
): boolean {
  const actual = Object.keys(value).sort();
  const sortedExpected = [...expected].sort();
  return actual.length === sortedExpected.length
    && actual.every((key, index) => key === sortedExpected[index]);
}

function validReplayOriginV1(
  origin: ExactSignalExportManifestDraftV1["origin"],
): boolean {
  const common = [
    "kind",
    "sessionId",
    "scenarioId",
    "liveBranchId",
    "targetGeneration",
    "presentationRevision",
    "sourceRunRef",
    "simulationInputRef",
    "targetInputSha256",
    "execution",
    "boundaryRevision",
    "boundaryTimeSec",
  ];
  const variant = origin.kind === "opened-run"
    ? ["sourceSnapshotRef"]
    : origin.kind === "live-transition"
      ? ["replayCheckpointRef"]
      : origin.kind === "promoted-steady-candidate"
        ? ["candidateId", "promotedSnapshotRef"]
        : null;
  if (
    variant === null
    || !hasExactKeysV1(origin, [...common, ...variant])
    || [origin.sessionId, origin.scenarioId, origin.liveBranchId].some(
      (value) => typeof value !== "string" || value.trim().length === 0,
    )
    || !Number.isSafeInteger(origin.targetGeneration)
    || origin.targetGeneration < 0
    || !Number.isSafeInteger(origin.presentationRevision)
    || origin.presentationRevision < 0
    || !/^[0-9a-f]{64}$/.test(origin.targetInputSha256)
    || !validArtifactRefV1(origin.sourceRunRef, "run-artifact")
    || !validArtifactRefV1(
      origin.simulationInputRef,
      "simulation-input",
    )
    || !validExecutionIdentityV1(origin.execution)
  ) return false;
  if (origin.kind === "opened-run") {
    return validArtifactRefV1(
      origin.sourceSnapshotRef,
      "snapshot-envelope",
    );
  }
  if (origin.kind === "live-transition") {
    return validArtifactRefV1(
      origin.replayCheckpointRef,
      "snapshot-envelope",
    );
  }
  return typeof origin.candidateId === "string"
    && origin.candidateId.trim().length > 0
    && validArtifactRefV1(
      origin.promotedSnapshotRef,
      "snapshot-envelope",
    );
}

function validArtifactRefV1(
  ref: Readonly<{
    schemaId: string;
    kind: string;
    sha256: string;
    mediaType: string;
    byteLength: number;
  }>,
  expectedKind: string,
): boolean {
  return ref !== null
    && typeof ref === "object"
    && hasExactKeysV1(ref, [
      "schemaId",
      "kind",
      "sha256",
      "mediaType",
      "byteLength",
    ])
    && ref.schemaId === "circleheart-studio-artifact-ref-v1"
    && ref.kind === expectedKind
    && /^[0-9a-f]{64}$/.test(ref.sha256)
    && typeof ref.mediaType === "string"
    && ref.mediaType.trim().length > 0
    && Number.isSafeInteger(ref.byteLength)
    && ref.byteLength >= 0;
}

function validExecutionIdentityV1(
  execution: ExactSignalExportManifestDraftV1["origin"]["execution"],
): boolean {
  return execution !== null
    && typeof execution === "object"
    && hasExactKeysV1(execution, [
      "modelRef",
      "runtimeRef",
      "solverRef",
      "stateCodecRef",
      "protocolRef",
    ])
    && Object.values(execution).every((value) =>
      typeof value === "string" && value.trim().length > 0
    );
}

function finiteNonnegativeV1(value: number): boolean {
  return Number.isFinite(value) && value >= 0;
}

function finiteGridDurationV1(value: number, zeroAllowed: boolean): boolean {
  return Number.isFinite(value)
    && (zeroAllowed ? value >= 0 : value > 0)
    && Number.isSafeInteger(Math.round(value / EXACT_DT_SEC_V1))
    && sameTimeV1(
      value,
      Math.round(value / EXACT_DT_SEC_V1) * EXACT_DT_SEC_V1,
    );
}

function gridStepCountV1(value: number): number {
  return Math.round(value / EXACT_DT_SEC_V1);
}

function sameTimeV1(left: number, right: number): boolean {
  return Math.abs(left - right) <= TIME_TOLERANCE_SEC_V1;
}

function canonicalPhase01V1(timeSec: number): number {
  const phase = timeSec - Math.floor(timeSec);
  return phase >= 1 - 1e-12 || phase < 1e-12 ? 0 : phase;
}

function exportErrorV1(
  message: string,
): StudioExactSignalExportValidationErrorV1 {
  return new StudioExactSignalExportValidationErrorV1(message);
}

function errorMessageV1(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
