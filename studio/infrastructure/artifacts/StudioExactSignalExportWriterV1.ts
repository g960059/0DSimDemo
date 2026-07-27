import {
  EXACT_SIGNAL_DETERMINISM_SCOPE_V1,
  EXACT_SIGNAL_EXPORT_CONTENT_V1_SCHEMA_ID,
  EXACT_SIGNAL_EXPORT_LIMITS_V1,
  EXACT_SIGNAL_EXPORT_MANIFEST_V1_SCHEMA_ID,
  EXACT_SIGNAL_EXPORT_V1_MEDIA_TYPE,
  EXACT_SIGNAL_REPLAY_COVERAGE_V1,
  EXACT_SIGNAL_REPLAY_RECIPE_V1_SCHEMA_ID,
  STUDIO_ARTIFACT_REF_V1_SCHEMA_ID,
  type ArtifactStorePortV1,
  type ExactSignalExportArtifactRefV1,
  type ExactSignalExportContentV1,
  type ExactSignalExportManifestV1,
  type ExactSignalExportResultV1,
  type ExactSignalObservableValueV1,
  type ExactSignalReplayRecipeV1,
  type ExactSignalSampleV1,
  type RuntimeExecutionIdentityV1,
  type StudioJsonValueV1,
} from "@/studio/contracts/v1";
import {
  MainWireVerifiedExactSignalReplayV1,
} from "@/studio/adapters/mainWire/MainWireExactSignalReplayWorkerV1";
import {
  cloneAndFreezeStudioJsonV1,
  sha256StudioJsonHexV1,
  sha256StudioTextHexV1,
  studioCanonicalJsonStringifyV1,
} from "./studioCanonicalJsonV1";

const EXACT_DT_SEC_V1 = 0.002;
const TIME_TOLERANCE_SEC_V1 = 1e-11;
const TEXT_ENCODER_V1 = new TextEncoder();
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

export type MainWireExactSignalExportWriteInternalV1 = Readonly<{
  capability: MainWireVerifiedExactSignalReplayV1;
  recipe: ExactSignalReplayRecipeV1;
  intervalStartOffsetSec: number;
  intervalDurationSec: number;
  samples: AsyncIterable<ExactSignalSampleV1>;
  signal: AbortSignal;
}>;

export interface MainWireExactSignalExportWriterInternalPortV1 {
  writeExactSignalExportV1(
    write: MainWireExactSignalExportWriteInternalV1,
  ): Promise<ExactSignalExportResultV1>;
}

export class StudioExactSignalExportValidationErrorV1 extends Error {
  constructor(message: string) {
    super(`Studio exact signal export rejected: ${message}`);
    this.name = "StudioExactSignalExportValidationErrorV1";
  }
}

/**
 * Internal replay writer. Samples are validated as they arrive and handed to
 * the artifact store's bounded stream spool. The writer retains only
 * first/previous/final validation state, never the full object or encoded array.
 */
export class StudioExactSignalExportWriterV1
implements MainWireExactSignalExportWriterInternalPortV1 {
  constructor(private readonly artifacts: ArtifactStorePortV1) {}

  async writeExactSignalExportV1(
    write: MainWireExactSignalExportWriteInternalV1,
  ): Promise<ExactSignalExportResultV1> {
    if (
      !(write.capability instanceof MainWireVerifiedExactSignalReplayV1)
      || !sameRecipeV1(write.capability.recipe, write.recipe)
    ) throw exportErrorV1("verified replay capability is required");
    assertNotAbortedV1(write.signal);
    assertRecipeV1(write.recipe);
    if (
      write.samples === null
      || typeof write.samples !== "object"
      || !(Symbol.asyncIterator in write.samples)
    ) throw exportErrorV1("samples must be an async iterable");

    const intervalCount = gridStepCountV1(write.intervalDurationSec);
    const expectedSampleCount = intervalCount + 1;
    if (
      !finiteGridDurationV1(write.intervalStartOffsetSec, true)
      || !finiteGridDurationV1(write.intervalDurationSec, false)
      || expectedSampleCount
        > EXACT_SIGNAL_EXPORT_LIMITS_V1.maximumSampleCount
    ) throw exportErrorV1("interval exceeds the export budget");

    const recipeSha256 = await sha256StudioJsonHexV1(write.recipe);
    assertNotAbortedV1(write.signal);
    let first: ExactSignalSampleV1 | undefined;
    let previous: ExactSignalSampleV1 | undefined;
    let final: ExactSignalSampleV1 | undefined;
    let sampleCount = 0;
    let checkpointBoundarySampleCount: 0 | 1 = 0;
    let manifest: ExactSignalExportManifestV1 | undefined;
    const validatedSamples = (async function*(): AsyncGenerator<
      StudioJsonValueV1
    > {
      for await (const sample of write.samples) {
        assertNotAbortedV1(write.signal);
        if (sampleCount >= expectedSampleCount) {
          throw exportErrorV1("sample count exceeds manifest coverage");
        }
        assertSampleV1(
          sample,
          sampleCount,
          write.recipe.cycleLengthSec,
        );
        if (previous !== undefined) {
          assertAdjacentSamplesV1(previous, sample, sampleCount);
        }
        if (first === undefined) {
          first = sample;
          checkpointBoundarySampleCount =
            sample.provenance === "checkpoint-boundary" ? 1 : 0;
        }
        previous = sample;
        final = sample;
        sampleCount += 1;
        yield sample as unknown as StudioJsonValueV1;
      }
    })();
    const stored = await this.artifacts.putJsonArrayStream({
      kind: "exact-signal-export",
      mediaType: EXACT_SIGNAL_EXPORT_V1_MEDIA_TYPE,
      arrayProperty: "samples",
      maximumArrayByteLength:
        EXACT_SIGNAL_EXPORT_LIMITS_V1.maximumOutputByteLength,
      items: validatedSamples,
      buildContentWithoutArray: (summary) => {
        assertNotAbortedV1(write.signal);
        if (first === undefined || final === undefined) {
          throw exportErrorV1("sample stream is empty");
        }
        assertCompleteCoverageV1({
          recipe: write.recipe,
          intervalStartOffsetSec: write.intervalStartOffsetSec,
          intervalDurationSec: write.intervalDurationSec,
          intervalCount,
          sampleCount,
          first,
          final,
        });
        if (summary.itemCount !== sampleCount) {
          throw exportErrorV1("artifact spool sample count mismatch");
        }
        manifest = Object.freeze({
          schemaId: EXACT_SIGNAL_EXPORT_MANIFEST_V1_SCHEMA_ID,
          schemaVersion: 1 as const,
          recipe: write.recipe,
          recipeSha256,
          determinismScope: EXACT_SIGNAL_DETERMINISM_SCOPE_V1,
          intervalStartOffsetSec: write.intervalStartOffsetSec,
          intervalDurationSec: write.intervalDurationSec,
          coverage: Object.freeze({
            kind: EXACT_SIGNAL_REPLAY_COVERAGE_V1,
            dtSec: EXACT_DT_SEC_V1,
            observationStride: 1 as const,
            intervalCount,
            sampleCount,
          }),
          claims: exactClaimsV1(),
          firstRevision: first.revision,
          finalRevision: final.revision,
          firstSimulationTimeSec: first.simulationTimeSec,
          finalSimulationTimeSec: final.simulationTimeSec,
          checkpointBoundarySampleCount,
          acceptedStepSampleCount:
            sampleCount - checkpointBoundarySampleCount,
          dataSha256: summary.canonicalArraySha256,
          dataByteLength: summary.canonicalArrayByteLength,
        }) as unknown as ExactSignalExportManifestV1;
        assertManifestV1(manifest);
        const canonicalManifest =
          studioCanonicalJsonStringifyV1(manifest);
        if (
          exactContentByteLengthV1(
            canonicalManifest,
            summary.canonicalArrayByteLength,
          ) > EXACT_SIGNAL_EXPORT_LIMITS_V1.maximumOutputByteLength
        ) throw exportErrorV1("encoded export exceeds its byte budget");
        return Object.freeze({
          schemaId: EXACT_SIGNAL_EXPORT_CONTENT_V1_SCHEMA_ID,
          schemaVersion: 1 as const,
          manifest: manifest as unknown as StudioJsonValueV1,
        });
      },
    }, { signal: write.signal });
    assertNotAbortedV1(write.signal);
    const artifactRef = stored.artifactRef;
    if (
      artifactRef.kind !== "exact-signal-export"
      || manifest === undefined
    ) {
      throw exportErrorV1("artifact store returned the wrong artifact kind");
    }
    return Object.freeze({
      artifactRef: artifactRef as ExactSignalExportArtifactRefV1,
      manifest,
    });
  }
}

/**
 * Strict persisted-content loader. It validates exact fields, recipe and data
 * digests, bounds, continuity and claims before returning nominal public types.
 */
export async function loadExactSignalExportContentV1(
  value: unknown,
): Promise<ExactSignalExportContentV1> {
  let detached: StudioJsonValueV1;
  try {
    detached = cloneAndFreezeStudioJsonV1(
      value as StudioJsonValueV1,
    );
  } catch (error) {
    throw exportErrorV1(
      `content is not canonical JSON: ${errorMessageV1(error)}`,
    );
  }
  const content = recordV1(detached, "content");
  assertExactKeysV1(content, [
    "schemaId",
    "schemaVersion",
    "manifest",
    "samples",
  ], "content");
  if (
    content.schemaId !== EXACT_SIGNAL_EXPORT_CONTENT_V1_SCHEMA_ID
    || content.schemaVersion !== 1
    || !Array.isArray(content.samples)
  ) throw exportErrorV1("content identity mismatch");
  const manifest = content.manifest as ExactSignalExportManifestV1;
  assertManifestV1(manifest);
  assertRecipeV1(manifest.recipe);
  if (
    await sha256StudioJsonHexV1(manifest.recipe)
      !== manifest.recipeSha256
  ) throw exportErrorV1("recipe digest mismatch");

  const samples = content.samples as unknown as ExactSignalSampleV1[];
  if (
    samples.length !== manifest.coverage.sampleCount
    || samples.length > EXACT_SIGNAL_EXPORT_LIMITS_V1.maximumSampleCount
  ) throw exportErrorV1("persisted sample count mismatch");
  let previous: ExactSignalSampleV1 | undefined;
  for (let index = 0; index < samples.length; index += 1) {
    const sample = samples[index]!;
    assertSampleV1(sample, index, manifest.recipe.cycleLengthSec);
    if (previous !== undefined) {
      assertAdjacentSamplesV1(previous, sample, index);
    }
    previous = sample;
  }
  const first = samples[0];
  const final = samples.at(-1);
  if (first === undefined || final === undefined) {
    throw exportErrorV1("persisted sample stream is empty");
  }
  assertCompleteCoverageV1({
    recipe: manifest.recipe,
    intervalStartOffsetSec: manifest.intervalStartOffsetSec,
    intervalDurationSec: manifest.intervalDurationSec,
    intervalCount: manifest.coverage.intervalCount,
    sampleCount: samples.length,
    first,
    final,
  });
  const canonicalData = studioCanonicalJsonStringifyV1(samples);
  const canonicalManifest = studioCanonicalJsonStringifyV1(manifest);
  if (
    byteLengthV1(canonicalData) !== manifest.dataByteLength
    || await sha256StudioTextHexV1(canonicalData)
      !== manifest.dataSha256
    || byteLengthV1(
      exactContentCanonicalTextV1(canonicalManifest, canonicalData),
    ) > EXACT_SIGNAL_EXPORT_LIMITS_V1.maximumOutputByteLength
    || manifest.firstRevision !== first.revision
    || manifest.finalRevision !== final.revision
    || !sameTimeV1(
      manifest.firstSimulationTimeSec,
      first.simulationTimeSec,
    )
    || !sameTimeV1(
      manifest.finalSimulationTimeSec,
      final.simulationTimeSec,
    )
    || manifest.checkpointBoundarySampleCount
      !== (first.provenance === "checkpoint-boundary" ? 1 : 0)
    || manifest.acceptedStepSampleCount
      !== samples.length - manifest.checkpointBoundarySampleCount
  ) throw exportErrorV1("persisted export summary mismatch");
  return Object.freeze({
    schemaId: EXACT_SIGNAL_EXPORT_CONTENT_V1_SCHEMA_ID,
    schemaVersion: 1 as const,
    manifest,
    samples: Object.freeze(samples),
  }) as unknown as ExactSignalExportContentV1;
}

function exactClaimsV1(): ExactSignalExportManifestV1["claims"] {
  return Object.freeze({
    onDemandResimulation: true as const,
    verifiedReplayCapabilityConsumed: true as const,
    fastForwardIntermediateObservationsRetained: false as const,
    restoredBoundaryProvenance: "checkpoint-boundary" as const,
    acceptedStepRevisionAndTimeContinuityValidated: true as const,
    smoothingOrInterpolationApplied: false as const,
    presentationSamplesConsumed: false as const,
    liveRuntimeBranchMutated: false as const,
    sameRecipeSameBuildSampleDeterminism: true as const,
    durableReplayLedgerAvailable: false as const,
    crossBuildDeterminismClaimed: false as const,
  });
}

function assertManifestV1(
  manifest: ExactSignalExportManifestV1,
): void {
  if (manifest === null || typeof manifest !== "object") {
    throw exportErrorV1("manifest must be an object");
  }
  assertExactKeysV1(manifest, [
    "schemaId",
    "schemaVersion",
    "recipe",
    "recipeSha256",
    "determinismScope",
    "intervalStartOffsetSec",
    "intervalDurationSec",
    "coverage",
    "claims",
    "firstRevision",
    "finalRevision",
    "firstSimulationTimeSec",
    "finalSimulationTimeSec",
    "checkpointBoundarySampleCount",
    "acceptedStepSampleCount",
    "dataSha256",
    "dataByteLength",
  ], "manifest");
  const coverage = manifest.coverage;
  const claims = manifest.claims;
  if (
    manifest.schemaId !== EXACT_SIGNAL_EXPORT_MANIFEST_V1_SCHEMA_ID
    || manifest.schemaVersion !== 1
    || manifest.determinismScope !== EXACT_SIGNAL_DETERMINISM_SCOPE_V1
    || !SHA256_HEX_PATTERN_V1.test(manifest.recipeSha256)
    || !finiteGridDurationV1(manifest.intervalStartOffsetSec, true)
    || !finiteGridDurationV1(manifest.intervalDurationSec, false)
    || coverage === null
    || typeof coverage !== "object"
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
    || coverage.sampleCount
      > EXACT_SIGNAL_EXPORT_LIMITS_V1.maximumSampleCount
    || !sameClaimsV1(claims, exactClaimsV1())
    || !nonnegativeSafeIntegerV1(manifest.firstRevision)
    || !nonnegativeSafeIntegerV1(manifest.finalRevision)
    || !finiteNonnegativeV1(manifest.firstSimulationTimeSec)
    || !finiteNonnegativeV1(manifest.finalSimulationTimeSec)
    || (
      manifest.checkpointBoundarySampleCount !== 0
      && manifest.checkpointBoundarySampleCount !== 1
    )
    || !nonnegativeSafeIntegerV1(manifest.acceptedStepSampleCount)
    || !SHA256_HEX_PATTERN_V1.test(manifest.dataSha256)
    || !nonnegativeSafeIntegerV1(manifest.dataByteLength)
    || manifest.dataByteLength
      > EXACT_SIGNAL_EXPORT_LIMITS_V1.maximumOutputByteLength
  ) throw exportErrorV1("manifest identity or claims mismatch");
}

function assertRecipeV1(recipe: ExactSignalReplayRecipeV1): void {
  if (
    recipe === null
    || typeof recipe !== "object"
    || !hasExactKeysV1(recipe, [
      "schemaId",
      "schemaVersion",
      "simulationInputRef",
      "replayCheckpointRef",
      "targetInputSha256",
      "execution",
      "boundaryRevision",
      "boundaryTimeSec",
      "cycleLengthSec",
    ])
    || recipe.schemaId !== EXACT_SIGNAL_REPLAY_RECIPE_V1_SCHEMA_ID
    || recipe.schemaVersion !== 1
    || !validArtifactRefV1(
      recipe.simulationInputRef,
      "simulation-input",
    )
    || !validArtifactRefV1(
      recipe.replayCheckpointRef,
      "snapshot-envelope",
    )
    || !SHA256_HEX_PATTERN_V1.test(recipe.targetInputSha256)
    || !validExecutionIdentityV1(recipe.execution)
    || !nonnegativeSafeIntegerV1(recipe.boundaryRevision)
    || !finiteNonnegativeV1(recipe.boundaryTimeSec)
    || !Number.isFinite(recipe.cycleLengthSec)
    || recipe.cycleLengthSec <= 0
  ) throw exportErrorV1("recipe identity mismatch");
}

function assertSampleV1(
  sample: ExactSignalSampleV1,
  index: number,
  cycleLengthSec: number,
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
    || !nonnegativeSafeIntegerV1(sample.revision)
    || !finiteNonnegativeV1(sample.simulationTimeSec)
    || !Number.isFinite(sample.phase01)
    || sample.phase01 < 0
    || sample.phase01 >= 1
    || !sameTimeV1(
      sample.phase01,
      canonicalPhase01V1(sample.simulationTimeSec, cycleLengthSec),
    )
    || sample.values === null
    || typeof sample.values !== "object"
    || Array.isArray(sample.values)
  ) throw exportErrorV1(`sample ${index} identity mismatch`);
  const entries = Object.entries(sample.values);
  if (entries.length === 0) {
    throw exportErrorV1(`sample ${index} has no observable catalog`);
  }
  for (const [observableId, observable] of entries) {
    assertObservableValueV1(observableId, observable, index);
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
    || (value.value !== null && !Number.isFinite(value.value))
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
  input: Readonly<{
    recipe: ExactSignalReplayRecipeV1;
    intervalStartOffsetSec: number;
    intervalDurationSec: number;
    intervalCount: number;
    sampleCount: number;
    first: ExactSignalSampleV1;
    final: ExactSignalSampleV1;
  }>,
): void {
  const fastForwardStepCount =
    gridStepCountV1(input.intervalStartOffsetSec);
  const expectedFirstRevision =
    input.recipe.boundaryRevision + fastForwardStepCount;
  const expectedFirstTimeSec =
    input.recipe.boundaryTimeSec + input.intervalStartOffsetSec;
  const expectedFirstProvenance = fastForwardStepCount === 0
    ? "checkpoint-boundary"
    : "accepted-step";
  if (
    input.sampleCount !== input.intervalCount + 1
    || input.first.provenance !== expectedFirstProvenance
    || input.first.revision !== expectedFirstRevision
    || !sameTimeV1(
      input.first.simulationTimeSec,
      expectedFirstTimeSec,
    )
    || input.final.revision
      !== expectedFirstRevision + input.intervalCount
    || !sameTimeV1(
      input.final.simulationTimeSec,
      input.first.simulationTimeSec + input.intervalDurationSec,
    )
  ) throw exportErrorV1("sample coverage does not match the recipe");
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
    && ref.schemaId === STUDIO_ARTIFACT_REF_V1_SCHEMA_ID
    && ref.kind === expectedKind
    && SHA256_HEX_PATTERN_V1.test(ref.sha256)
    && typeof ref.mediaType === "string"
    && ref.mediaType.trim().length > 0
    && Number.isSafeInteger(ref.byteLength)
    && ref.byteLength >= 0;
}

function validExecutionIdentityV1(
  execution: RuntimeExecutionIdentityV1,
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

function sameRecipeV1(
  left: ExactSignalReplayRecipeV1,
  right: ExactSignalReplayRecipeV1,
): boolean {
  return studioCanonicalJsonStringifyV1(left)
    === studioCanonicalJsonStringifyV1(right);
}

function sameClaimsV1(
  left: ExactSignalExportManifestV1["claims"],
  right: ExactSignalExportManifestV1["claims"],
): boolean {
  return left !== null
    && typeof left === "object"
    && hasExactKeysV1(left, Object.keys(right))
    && Object.entries(right).every(([key, value]) =>
      left[key as keyof typeof left] === value
    );
}

function sameStringSetV1(
  left: readonly string[],
  right: readonly string[],
): boolean {
  if (left.length !== right.length) return false;
  const rightSet = new Set(right);
  return left.every((value) => rightSet.has(value));
}

function recordV1(
  value: unknown,
  label: string,
): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw exportErrorV1(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function assertExactKeysV1(
  value: object,
  expected: readonly string[],
  label: string,
): void {
  if (!hasExactKeysV1(value, expected)) {
    throw exportErrorV1(`${label} fields mismatch`);
  }
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

function finiteNonnegativeV1(value: number): boolean {
  return Number.isFinite(value) && value >= 0;
}

function nonnegativeSafeIntegerV1(value: number): boolean {
  return Number.isSafeInteger(value) && value >= 0;
}

function finiteGridDurationV1(value: number, zeroAllowed: boolean): boolean {
  return Number.isFinite(value)
    && (zeroAllowed ? value >= 0 : value > 0)
    && Number.isSafeInteger(gridStepCountV1(value))
    && sameTimeV1(
      value,
      gridStepCountV1(value) * EXACT_DT_SEC_V1,
    );
}

function gridStepCountV1(value: number): number {
  return Math.round(value / EXACT_DT_SEC_V1);
}

function sameTimeV1(left: number, right: number): boolean {
  return Math.abs(left - right) <= TIME_TOLERANCE_SEC_V1;
}

function canonicalPhase01V1(
  timeSec: number,
  cycleLengthSec: number,
): number {
  const raw = timeSec / cycleLengthSec;
  const phase = raw - Math.floor(raw);
  return phase >= 1 - 1e-12 || phase < 1e-12 ? 0 : phase;
}

function exactContentCanonicalTextV1(
  canonicalManifest: string,
  canonicalData: string,
): string {
  return `{"manifest":${canonicalManifest},"samples":${canonicalData},"schemaId":${JSON.stringify(EXACT_SIGNAL_EXPORT_CONTENT_V1_SCHEMA_ID)},"schemaVersion":1}`;
}

function exactContentByteLengthV1(
  canonicalManifest: string,
  canonicalDataByteLength: number,
): number {
  return byteLengthV1(`{"manifest":${canonicalManifest},"samples":`)
    + canonicalDataByteLength
    + byteLengthV1(
      `,"schemaId":${JSON.stringify(EXACT_SIGNAL_EXPORT_CONTENT_V1_SCHEMA_ID)},"schemaVersion":1}`,
    );
}

function byteLengthV1(value: string): number {
  return TEXT_ENCODER_V1.encode(value).byteLength;
}

function assertNotAbortedV1(signal: AbortSignal): void {
  if (signal.aborted) throw exportErrorV1("export was cancelled");
}

const SHA256_HEX_PATTERN_V1 = /^[0-9a-f]{64}$/;

function exportErrorV1(
  message: string,
): StudioExactSignalExportValidationErrorV1 {
  return new StudioExactSignalExportValidationErrorV1(message);
}

function errorMessageV1(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
