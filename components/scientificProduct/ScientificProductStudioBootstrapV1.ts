import {
  loadBundledOfficialHealthyPeriodicWorkspaceDocumentV1,
  MainWireScientificWorkerClientV1,
} from "@/engine/scientificBrowser";
import {
  MAIN_WIRE_SCIENTIFIC_BROWSER_RUNTIME_LIMITS_V1,
} from "@/engine/scientificBrowser/mainWireScientificBrowserRuntimeLimitsV1";
import {
  loadMainWireScientificWorkspaceDocumentV1,
  type MainWireScientificWorkspaceDocumentV1,
} from "@/engine/scientific/documents";
import type {
  MainWireScientificObservableFrameV1,
} from "@/engine/scientific/observables";
import {
  SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
  type ScientificPeriodicSettlementProgressV1,
  type ScientificResearchControlContextV0,
} from "@/engine/scientific/worker";
import {
  STUDIO_RUN_ARTIFACT_CONTENT_V1_SCHEMA_ID,
  type ArtifactStorePortV1,
  type OpenScenarioRuntimeBranchV1,
  type StudioArtifactRefV1,
  type StudioJsonValueV1,
  type StudioJsonWriteV1,
  type StudioRunArtifactContentV1,
} from "@/studio/contracts/v1";
import {
  mainWireStudioExecutionIdentityV1,
  putMainWireStudioSnapshotEnvelopeV1,
} from "@/studio/adapters/mainWire/MainWireStudioSnapshotEnvelopeV1";
import {
  mainWireStudioTargetInputSha256V1,
} from "@/studio/adapters/mainWire/MainWireStudioTargetResolverV1";
import {
  InMemoryContentAddressedArtifactStoreV1,
} from "@/studio/infrastructure/artifacts/InMemoryContentAddressedArtifactStoreV1";

import type {
  ScientificProductCaseV1,
} from "./scientificProductCaseCatalogV1";

const STUDIO_BOOTSTRAP_SOURCE_LINEAGE_SCHEMA_ID_V1 =
  "circleheart-product-studio-bootstrap-source-lineage-v1" as const;
const STUDIO_BOOTSTRAP_SOURCE_LINEAGE_MEDIA_TYPE_V1 =
  "application/vnd.circleheart.product-studio-bootstrap-source-lineage.v1+json";
const STUDIO_RUN_ARTIFACT_MEDIA_TYPE_V1 =
  "application/vnd.circleheart.studio-run-artifact.v1+json";
const SIMULATION_INPUT_MEDIA_TYPE_V1 =
  "application/vnd.circleheart.main-wire-resolved-session-input.v1+json";
const LIVE_DT_SEC_V1 = 0.002;
const MAXIMUM_BOOTSTRAP_SETTLEMENT_BEAT_COUNT_V1 = 32;

let bootstrapOrdinalV1 = 0;

export type ScientificProductStudioBootstrapProgressV1 = Readonly<{
  phase: "restoring" | "settling" | "materializing";
  completedBeatCount: number;
  maximumBeatCount: number;
  message: string;
}>;

export type ScientificProductStudioBootstrapResultV1 = Readonly<{
  workspaceDocument: MainWireScientificWorkspaceDocumentV1;
  baseSessionInputSha256: string;
  source: Readonly<{
    sessionId: string;
    context: ScientificResearchControlContextV0;
    seedFrame: MainWireScientificObservableFrameV1;
  }>;
  branch: OpenScenarioRuntimeBranchV1;
}>;

/**
 * Converts one current built-in case into a canonical Studio source.
 *
 * The temporary Worker owns every release/document/settlement decision. The
 * main thread receives only the verified Workspace, complete resolved input,
 * exact V4 checkpoint, and one accepted-step seed frame; no beat history is
 * stored or returned.
 */
export async function bootstrapScientificProductStudioSourceV1(
  input: Readonly<{
    caseEntry: ScientificProductCaseV1;
    scenarioId: string;
    artifacts: ArtifactStorePortV1;
    onProgress?: (progress: ScientificProductStudioBootstrapProgressV1) => void;
    createClient?: () => MainWireScientificWorkerClientV1;
    signal?: AbortSignal;
  }>,
): Promise<ScientificProductStudioBootstrapResultV1> {
  assertPortableIdV1(input.scenarioId, "scenarioId");
  assertBootstrapNotAbortedV1(input.signal);
  const ordinal = ++bootstrapOrdinalV1;
  // The Worker protocol deliberately accepts a narrower, 128-character
  // identifier alphabet than portable Studio scenario ids. Keep this
  // disposable internal identity independent from the user-facing id.
  const workerSessionId = `product-studio-bootstrap-${ordinal}`;
  const client = (input.createClient ?? createStudioBootstrapClientV1)();
  const abortBootstrap = () => client.terminate();
  input.signal?.addEventListener("abort", abortBootstrap, { once: true });
  try {
    assertBootstrapNotAbortedV1(input.signal);
    input.onProgress?.(Object.freeze({
      phase: "restoring",
      completedBeatCount: 0,
      maximumBeatCount: MAXIMUM_BOOTSTRAP_SETTLEMENT_BEAT_COUNT_V1,
      message: "Restoring the release-bound source…",
    }));
    const created = input.caseEntry.kind === "official-exact-periodic"
      ? await createOfficialSourceV1(client, input.caseEntry, workerSessionId)
      : await createResearchSourceV1(
        client,
        input.caseEntry,
        workerSessionId,
        input.onProgress,
      );

    assertBootstrapNotAbortedV1(input.signal);
    input.onProgress?.(Object.freeze({
      phase: "materializing",
      completedBeatCount: created.completedBeatCount,
      maximumBeatCount: MAXIMUM_BOOTSTRAP_SETTLEMENT_BEAT_COUNT_V1,
      message: "Materializing the exact one-point Studio source…",
    }));
    assertBootstrapNotAbortedV1(input.signal);
    const exported = await client.request({
      protocolId: SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
      kind: "getExactCheckpointV4",
      requestId: `${workerSessionId}:export-v4`,
      sessionId: workerSessionId,
    });
    assertBootstrapNotAbortedV1(input.signal);
    if (
      !exported.ok
      || exported.commandKind !== "getExactCheckpointV4"
      || exported.payload.kind !== "exactCheckpointV4"
    ) throw bootstrapErrorV1(
      exported.ok
        ? "Worker returned a mismatched V4 export"
        : `${exported.error.code}: ${exported.error.message}`,
    );
    const checkpoint = exported.payload.checkpoint;
    const seedFrame = exported.payload.observableFrame;
    if (
      seedFrame.source !== "accepted-step"
      || seedFrame.revision !== checkpoint.transaction.revision
      || seedFrame.acceptedTimeSec !== checkpoint.transaction.acceptedTimeSec
      || checkpoint.baseSessionInputSha256
        !== exported.payload.resolvedSessionInput.sessionInputSha256
    ) throw bootstrapErrorV1(
      "V4 export is not bound to one full accepted-step seed",
    );

    // Materialize the dependency graph in a private CAS first. The shared
    // store sees it only through one atomic batch after every hash and
    // cancellation check has succeeded.
    const stagingArtifacts =
      new InMemoryContentAddressedArtifactStoreV1();
    const stagedWrites: StudioJsonWriteV1[] = [];
    const simulationInputWrite = Object.freeze({
      kind: "simulation-input",
      mediaType: SIMULATION_INPUT_MEDIA_TYPE_V1,
      content: exported.payload.resolvedSessionInput as unknown as
        StudioJsonValueV1,
    }) satisfies StudioJsonWriteV1<"simulation-input">;
    stagedWrites.push(simulationInputWrite);
    const simulationInputRef =
      await stagingArtifacts.putJson(simulationInputWrite);
    assertBootstrapNotAbortedV1(input.signal);
    const snapshotRef = await putMainWireStudioSnapshotEnvelopeV1(
      stagingArtifacts,
      {
        simulationInputRef,
        checkpointV4: checkpoint,
        seedObservableFrame: seedFrame,
      },
    );
    stagedWrites.push(Object.freeze({
      kind: "snapshot-envelope",
      mediaType: snapshotRef.mediaType,
      content: await stagingArtifacts.readJson(snapshotRef),
    }));
    assertBootstrapNotAbortedV1(input.signal);
    const targetInputSha256 = await mainWireStudioTargetInputSha256V1(
      checkpoint.controlTargetState,
      checkpoint.baseSessionInputSha256,
    );
    assertBootstrapNotAbortedV1(input.signal);
    const lineageWrite = Object.freeze({
      kind: "run-artifact",
      mediaType: STUDIO_BOOTSTRAP_SOURCE_LINEAGE_MEDIA_TYPE_V1,
      content: {
        schemaId: STUDIO_BOOTSTRAP_SOURCE_LINEAGE_SCHEMA_ID_V1,
        caseId: input.caseEntry.caseId,
        workspaceRef: created.workspaceDocument.ref,
        releaseRef: checkpoint.releaseRef,
        baseSessionInputSha256: checkpoint.baseSessionInputSha256,
        controlTargetStateSha256: checkpoint.controlTargetStateSha256,
        parameterEpoch: checkpoint.parameterEpoch,
        sourceClaim: "worker-confirmed-period1-no-beat-history-retained",
      },
    }) satisfies StudioJsonWriteV1<"run-artifact">;
    stagedWrites.push(lineageWrite);
    const lineageRef = await stagingArtifacts.putJson(lineageWrite);
    assertBootstrapNotAbortedV1(input.signal);
    const runContent: StudioRunArtifactContentV1 = Object.freeze({
      schemaId: STUDIO_RUN_ARTIFACT_CONTENT_V1_SCHEMA_ID,
      sourceRunRef: lineageRef,
      simulationInputRef,
      targetInputSha256,
      snapshotRef,
      execution: mainWireStudioExecutionIdentityV1(checkpoint),
      claims: Object.freeze({
        steadyStatus: "converged" as const,
        numericalHealth: "passed" as const,
        snapshotIsWarmRestartable: true as const,
        canonicalSignalSamplesStored: false as const,
        canonicalWindowMetricsStored: false as const,
      }),
    });
    const runWrite = Object.freeze({
      kind: "run-artifact",
      mediaType: STUDIO_RUN_ARTIFACT_MEDIA_TYPE_V1,
      content: runContent as unknown as StudioJsonValueV1,
    }) satisfies StudioJsonWriteV1<"run-artifact">;
    stagedWrites.push(runWrite);
    const runRef = await stagingArtifacts.putJson(runWrite);
    assertBootstrapNotAbortedV1(input.signal);
    let committedRefs: readonly StudioArtifactRefV1[];
    try {
      committedRefs = await input.artifacts.putJsonBatch(
        stagedWrites,
        { signal: input.signal },
      );
    } catch (error) {
      assertBootstrapNotAbortedV1(input.signal);
      throw error;
    }
    const stagedRefs = Object.freeze([
      simulationInputRef,
      snapshotRef,
      lineageRef,
      runRef,
    ]);
    if (
      committedRefs.length !== stagedRefs.length
      || committedRefs.some((ref, index) =>
        !sameArtifactRefV1(ref, stagedRefs[index]!))
    ) {
      throw bootstrapErrorV1(
        "artifact batch returned a mismatched content address",
      );
    }
    const context: ScientificResearchControlContextV0 = Object.freeze({
      stateIdentity: Object.freeze({
        revision: seedFrame.revision,
        acceptedTimeSec: seedFrame.acceptedTimeSec,
        totalBloodVolumeMl:
          created.researchControlContext.stateIdentity.totalBloodVolumeMl,
      }),
      controlState: checkpoint.controlTargetState,
      parameterEpoch: checkpoint.parameterEpoch,
    });
    return Object.freeze({
      workspaceDocument: created.workspaceDocument,
      baseSessionInputSha256: checkpoint.baseSessionInputSha256,
      source: Object.freeze({
        sessionId: input.scenarioId,
        context,
        seedFrame,
      }),
      branch: Object.freeze({
        scenarioId: input.scenarioId,
        sourceRunRef: runRef,
        sourceInputRef: simulationInputRef,
        sourceSnapshotRef: snapshotRef,
        initialTargetInputSha256: targetInputSha256,
      }),
    });
  } finally {
    input.signal?.removeEventListener("abort", abortBootstrap);
    client.terminate();
  }
}

export function createStudioBootstrapClientV1():
MainWireScientificWorkerClientV1 {
  return new MainWireScientificWorkerClientV1({
    maximumPendingRequestCount: 1,
    maximumRequestCountPerClientLifetime:
      MAIN_WIRE_SCIENTIFIC_BROWSER_RUNTIME_LIMITS_V1
        .maximumRequestCountPerLifetime,
    requestTimeoutMs: 3 * 60_000,
  });
}

type CreatedBootstrapSourceV1 = Readonly<{
  workspaceDocument: MainWireScientificWorkspaceDocumentV1;
  researchControlContext: ScientificResearchControlContextV0;
  completedBeatCount: number;
}>;

async function createOfficialSourceV1(
  client: MainWireScientificWorkerClientV1,
  caseEntry: Extract<ScientificProductCaseV1, {
    kind: "official-exact-periodic";
  }>,
  sessionId: string,
): Promise<CreatedBootstrapSourceV1> {
  const workspaceBundle =
    await loadBundledOfficialHealthyPeriodicWorkspaceDocumentV1({
      presetId: caseEntry.source.presetId,
      presetVersion: caseEntry.source.presetVersion,
    });
  const created = await client.request({
    protocolId: SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
    kind: "createOfficialDocumentCaseSession",
    requestId: `${sessionId}:create`,
    sessionId,
    presetId: caseEntry.source.presetId,
    presetVersion: caseEntry.source.presetVersion,
  });
  if (
    !created.ok
    || created.commandKind !== "createOfficialDocumentCaseSession"
    || created.payload.kind !== "officialDocumentCaseSessionCreated"
    || created.sessionOrigin.kind
      !== "official-document-case-v3-exact-checkpoint-restore"
  ) throw bootstrapErrorV1(
    created.ok
      ? "official source receipt mismatch"
      : `${created.error.code}: ${created.error.message}`,
  );
  const settled = await client.request({
    protocolId: SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
    kind: "settlePeriodic",
    requestId: `${sessionId}:confirm-p1`,
    sessionId,
  });
  if (
    !settled.ok
    || settled.commandKind !== "settlePeriodic"
    || settled.payload.kind !== "periodic-settlement-progress"
    || settled.payload.status !== "period1-converged"
    || settled.payload.periodicSteadyStateClaimed !== true
    || settled.payload.period2OrbitSuspected
    || settled.payload.beatCompletedThisCall
    || settled.payload.completedStepCountThisCall !== 0
  ) throw bootstrapErrorV1(
    settled.ok
      ? "official source did not confirm the pinned P1 boundary"
      : `${settled.error.code}: ${settled.error.message}`,
  );

  // The restored exact boundary intentionally has no derived pressure/flow.
  // Advance one accepted integration point so the one-point Studio snapshot
  // can paint every modeled chart value without retaining a complete beat.
  const stepped = await client.request({
    protocolId: SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
    kind: "runTransient",
    requestId: `${sessionId}:seed-step`,
    sessionId,
    dtSec: LIVE_DT_SEC_V1,
    stepCount: 1,
    observationStride: 1,
  });
  if (
    !stepped.ok
    || stepped.commandKind !== "runTransient"
    || stepped.payload.kind !== "transientCompleted"
    || stepped.payload.completedStepCount !== 1
    || stepped.payload.observableFrames.length !== 1
    || stepped.payload.finalObservableFrame.source !== "accepted-step"
  ) throw bootstrapErrorV1(
    stepped.ok
      ? "official source seed step receipt mismatch"
      : `${stepped.error.code}: ${stepped.error.message}`,
  );
  return Object.freeze({
    workspaceDocument: workspaceBundle.workspaceDocument,
    researchControlContext: created.payload.researchControlContext,
    completedBeatCount: settled.payload.completedBeatCount,
  });
}

async function createResearchSourceV1(
  client: MainWireScientificWorkerClientV1,
  caseEntry: Extract<ScientificProductCaseV1, { kind: "research-bracket" }>,
  sessionId: string,
  onProgress:
    | ((progress: ScientificProductStudioBootstrapProgressV1) => void)
    | undefined,
): Promise<CreatedBootstrapSourceV1> {
  const created = await client.request({
    protocolId: SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
    kind: "createResearchDocumentCaseSession",
    requestId: `${sessionId}:create`,
    sessionId,
    presetId: caseEntry.source.presetId,
    presetVersion: caseEntry.source.presetVersion,
  });
  if (
    !created.ok
    || created.commandKind !== "createResearchDocumentCaseSession"
    || created.payload.kind !== "researchDocumentCaseSessionCreated"
    || created.sessionOrigin.kind !== "research-document-case-cold-start"
  ) throw bootstrapErrorV1(
    created.ok
      ? "research source receipt mismatch"
      : `${created.error.code}: ${created.error.message}`,
  );
  const workspaceDocument =
    await loadMainWireScientificWorkspaceDocumentV1(
      created.payload.workspaceDocument,
    );
  let terminal:
    ScientificPeriodicSettlementProgressV1<MainWireScientificObservableFrameV1>
      | null = null;
  for (
    let callIndex = 0;
    callIndex < MAXIMUM_BOOTSTRAP_SETTLEMENT_BEAT_COUNT_V1;
    callIndex += 1
  ) {
    const settled = await client.request({
      protocolId: SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
      kind: "settlePeriodic",
      requestId: `${sessionId}:settle-${callIndex + 1}`,
      sessionId,
    });
    if (
      !settled.ok
      || settled.commandKind !== "settlePeriodic"
      || settled.payload.kind !== "periodic-settlement-progress"
    ) throw bootstrapErrorV1(
      settled.ok
        ? "research settlement receipt mismatch"
        : `${settled.error.code}: ${settled.error.message}`,
    );
    terminal = settled.payload;
    onProgress?.(Object.freeze({
      phase: "settling",
      completedBeatCount: terminal.completedBeatCount,
      maximumBeatCount: MAXIMUM_BOOTSTRAP_SETTLEMENT_BEAT_COUNT_V1,
      message:
        `Periodic settlement ${terminal.completedBeatCount}`
        + `/${MAXIMUM_BOOTSTRAP_SETTLEMENT_BEAT_COUNT_V1}`,
    }));
    if (terminal.status === "period1-converged") break;
    if (terminal.status !== "tracking") {
      throw bootstrapErrorV1(
        `research source settlement ended as ${terminal.status}`,
      );
    }
  }
  if (
    terminal === null
    || terminal.status !== "period1-converged"
    || terminal.periodicSteadyStateClaimed !== true
    || terminal.period2OrbitSuspected
    || terminal.finalObservableFrame.source !== "accepted-step"
  ) throw bootstrapErrorV1(
    "research source did not converge to a full accepted-step P1 boundary",
  );
  return Object.freeze({
    workspaceDocument,
    researchControlContext: created.payload.researchControlContext,
    completedBeatCount: terminal.completedBeatCount,
  });
}

function assertPortableIdV1(value: string, path: string): void {
  if (
    typeof value !== "string"
    || value.length === 0
    || value.length > 160
    || !/^[A-Za-z0-9][A-Za-z0-9._:/-]*$/.test(value)
  ) throw bootstrapErrorV1(`${path} is not a portable identifier`);
}

function bootstrapErrorV1(message: string): Error {
  return new Error(`scientific product Studio bootstrap failed: ${message}`);
}

function sameArtifactRefV1(
  left: StudioArtifactRefV1,
  right: StudioArtifactRefV1,
): boolean {
  return left.schemaId === right.schemaId
    && left.kind === right.kind
    && left.sha256 === right.sha256
    && left.mediaType === right.mediaType
    && left.byteLength === right.byteLength;
}

function assertBootstrapNotAbortedV1(signal: AbortSignal | undefined): void {
  if (signal?.aborted) {
    throw bootstrapErrorV1("aborted");
  }
}
