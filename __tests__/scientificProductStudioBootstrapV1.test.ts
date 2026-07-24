import { beforeAll, describe, expect, it } from "vitest";

import {
  bootstrapScientificProductStudioSourceV1,
} from "@/components/scientificProduct/ScientificProductStudioBootstrapV1";
import {
  SCIENTIFIC_PRODUCT_CASE_CATALOG_V1,
  type ScientificProductCaseV1,
} from "@/components/scientificProduct/scientificProductCaseCatalogV1";
import type {
  MainWireScientificWorkerClientV1,
} from "@/engine/scientificBrowser";
import {
  MainWireScientificInProcessKernelV1,
  SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
  type MainWireScientificCommandResponseV1,
  type ScientificCommandV1,
} from "@/engine/scientific/worker";
import {
  loadMainWireStudioSnapshotEnvelopeV1,
  MAIN_WIRE_STUDIO_SNAPSHOT_ENVELOPE_V1_SCHEMA_ID,
} from "@/studio/adapters/mainWire/MainWireStudioSnapshotEnvelopeV1";
import type {
  StudioArtifactRefV1,
  StudioJsonWriteV1,
  StudioRunArtifactContentV1,
} from "@/studio/contracts/v1";
import {
  InMemoryContentAddressedArtifactStoreV1,
} from "@/studio/infrastructure/artifacts/InMemoryContentAddressedArtifactStoreV1";

type ResearchCreatedResponseV1 = Extract<
  MainWireScientificCommandResponseV1,
  Readonly<{
    ok: true;
    commandKind: "createResearchDocumentCaseSession";
  }>
>;

type ExactCheckpointResponseV1 = Extract<
  MainWireScientificCommandResponseV1,
  Readonly<{
    ok: true;
    commandKind: "getExactCheckpointV4";
  }>
>;

type CanonicalFixtureV1 = Readonly<{
  researchCase: Extract<
    ScientificProductCaseV1,
    Readonly<{ kind: "research-bracket" }>
  >;
  researchCreated: ResearchCreatedResponseV1;
  exactCheckpoint: ExactCheckpointResponseV1;
}>;

let fixtureV1: CanonicalFixtureV1;

beforeAll(async () => {
  fixtureV1 = await createCanonicalFixtureV1();
}, 120_000);

describe("Scientific Product Studio bootstrap V1", () => {
  it("rejects an already-aborted load before allocating a Worker client", async () => {
    const artifacts = new InMemoryContentAddressedArtifactStoreV1();
    const abortController = new AbortController();
    let allocationCount = 0;
    abortController.abort();

    await expect(bootstrapScientificProductStudioSourceV1({
      caseEntry: requiredOfficialCaseV1(),
      scenarioId: "scenario/aborted-bootstrap",
      artifacts,
      signal: abortController.signal,
      createClient: () => {
        allocationCount += 1;
        throw new Error("aborted bootstrap allocated a Worker");
      },
    })).rejects.toThrow(/bootstrap failed: aborted/);

    expect(allocationCount).toBe(0);
    expect(artifacts.entryCount).toBe(0);
  });

  it("does not continue or succeed when cancellation lands during artifact materialization", async () => {
    const abortController = new AbortController();
    const artifacts = new AbortBeforeAtomicBatchCommitV1(abortController);
    const client = officialSuccessClientV1(fixtureV1);

    await expect(bootstrapScientificProductStudioSourceV1({
      caseEntry: requiredOfficialCaseV1(),
      scenarioId: "scenario/abort-during-materialization",
      artifacts,
      signal: abortController.signal,
      createClient: () => client.asWorkerClientV1(),
    })).rejects.toThrow(/bootstrap failed: aborted/);

    expect(artifacts.batchCount).toBe(1);
    expect(artifacts.entryCount).toBe(0);
    expect(client.terminateCount).toBe(2);
  });

  it("materializes an official source as one checkpoint-bound point with no beat history", async () => {
    const artifacts = new InMemoryContentAddressedArtifactStoreV1();
    const client = officialSuccessClientV1(fixtureV1);
    const progress: Array<Readonly<{
      phase: string;
      completedBeatCount: number;
    }>> = [];

    const result = await bootstrapScientificProductStudioSourceV1({
      caseEntry: requiredOfficialCaseV1(),
      scenarioId: "scenario/official-bootstrap",
      artifacts,
      createClient: () => client.asWorkerClientV1(),
      onProgress: (update) => progress.push(update),
    });

    expect(client.commandKinds).toEqual([
      "createOfficialDocumentCaseSession",
      "settlePeriodic",
      "runTransient",
      "getExactCheckpointV4",
    ]);
    expect(client.terminateCount).toBe(1);
    expect(progress).toMatchObject([
      { phase: "restoring", completedBeatCount: 0 },
      { phase: "materializing", completedBeatCount: 12 },
    ]);
    expect(artifacts.entryCount).toBe(4);

    const resolvedInput = await artifacts.readJson(
      result.branch.sourceInputRef,
    );
    const snapshot = await loadMainWireStudioSnapshotEnvelopeV1(
      await artifacts.readJson(result.branch.sourceSnapshotRef),
    );
    const run = await artifacts.readJson(
      result.branch.sourceRunRef,
    ) as unknown as StudioRunArtifactContentV1;
    const lineage = await artifacts.readJson(run.sourceRunRef);

    expect(resolvedInput).toEqual(
      fixtureV1.exactCheckpoint.payload.resolvedSessionInput,
    );
    expect(result.baseSessionInputSha256).toBe(
      fixtureV1.exactCheckpoint.payload.resolvedSessionInput
        .sessionInputSha256,
    );
    expect(snapshot).toMatchObject({
      schemaId: MAIN_WIRE_STUDIO_SNAPSHOT_ENVELOPE_V1_SCHEMA_ID,
      simulationInputRef: result.branch.sourceInputRef,
      checkpointV4: {
        checkpointSha256:
          fixtureV1.exactCheckpoint.payload.checkpoint.checkpointSha256,
        baseSessionInputSha256:
          fixtureV1.exactCheckpoint.payload.resolvedSessionInput
            .sessionInputSha256,
      },
      seedObservableFrame: {
        source: "accepted-step",
        revision:
          fixtureV1.exactCheckpoint.payload.checkpoint.transaction.revision,
        acceptedTimeSec:
          fixtureV1.exactCheckpoint.payload.checkpoint.transaction
            .acceptedTimeSec,
      },
      claims: {
        exactCheckpointStored: true,
        seedObservablePointCount: 1,
        beatSampleHistoryStored: false,
        windowMetricsStored: false,
        presentationStateStored: false,
      },
    });
    expect(Object.keys(snapshot).sort()).toEqual([
      "checkpointV4",
      "claims",
      "schemaId",
      "schemaVersion",
      "seedObservableFrame",
      "simulationInputRef",
    ]);
    expect(run).toMatchObject({
      simulationInputRef: result.branch.sourceInputRef,
      snapshotRef: result.branch.sourceSnapshotRef,
      claims: {
        steadyStatus: "converged",
        numericalHealth: "passed",
        snapshotIsWarmRestartable: true,
        canonicalSignalSamplesStored: false,
        canonicalWindowMetricsStored: false,
      },
    });
    expect(lineage).toMatchObject({
      caseId: requiredOfficialCaseV1().caseId,
      sourceClaim: "worker-confirmed-period1-no-beat-history-retained",
      baseSessionInputSha256: result.baseSessionInputSha256,
      releaseRef: snapshot.checkpointV4.releaseRef,
    });
    expect(result.source.seedFrame).toEqual(snapshot.seedObservableFrame);
    expect(result.source.context).toMatchObject({
      stateIdentity: {
        revision: snapshot.checkpointV4.transaction.revision,
        acceptedTimeSec:
          snapshot.checkpointV4.transaction.acceptedTimeSec,
      },
      controlState: snapshot.checkpointV4.controlTargetState,
      parameterEpoch: snapshot.checkpointV4.parameterEpoch,
    });
  }, 120_000);

  it("settles a research source in bounded calls and exports the terminal worker state", async () => {
    const artifacts = new InMemoryContentAddressedArtifactStoreV1();
    const client = researchSuccessClientV1(fixtureV1);
    const progress: Array<Readonly<{
      phase: string;
      completedBeatCount: number;
    }>> = [];

    const result = await bootstrapScientificProductStudioSourceV1({
      caseEntry: fixtureV1.researchCase,
      scenarioId: "scenario/research-bootstrap",
      artifacts,
      createClient: () => client.asWorkerClientV1(),
      onProgress: (update) => progress.push(update),
    });

    expect(client.commandKinds).toEqual([
      "createResearchDocumentCaseSession",
      "settlePeriodic",
      "settlePeriodic",
      "getExactCheckpointV4",
    ]);
    expect(client.terminateCount).toBe(1);
    expect(progress).toMatchObject([
      { phase: "restoring", completedBeatCount: 0 },
      { phase: "settling", completedBeatCount: 1 },
      { phase: "settling", completedBeatCount: 2 },
      { phase: "materializing", completedBeatCount: 2 },
    ]);
    expect(result.workspaceDocument).toEqual(
      fixtureV1.researchCreated.payload.workspaceDocument,
    );
    const snapshot = await loadMainWireStudioSnapshotEnvelopeV1(
      await artifacts.readJson(result.branch.sourceSnapshotRef),
    );
    expect(snapshot.claims).toEqual({
      exactCheckpointStored: true,
      seedObservablePointCount: 1,
      beatSampleHistoryStored: false,
      windowMetricsStored: false,
      presentationStateStored: false,
    });
    expect(snapshot.seedObservableFrame).toEqual(
      fixtureV1.exactCheckpoint.payload.observableFrame,
    );
  }, 120_000);

  it("rejects an official receipt mismatch before artifact materialization and terminates the client", async () => {
    const artifacts = new InMemoryContentAddressedArtifactStoreV1();
    const client = officialSuccessClientV1(fixtureV1, {
      officialOriginKind: "research-document-case-cold-start",
    });

    await expect(bootstrapScientificProductStudioSourceV1({
      caseEntry: requiredOfficialCaseV1(),
      scenarioId: "scenario/official-mismatch",
      artifacts,
      createClient: () => client.asWorkerClientV1(),
    })).rejects.toThrow(/official source receipt mismatch/);

    expect(client.commandKinds).toEqual([
      "createOfficialDocumentCaseSession",
    ]);
    expect(artifacts.entryCount).toBe(0);
    expect(client.terminateCount).toBe(1);
  });

  it("rejects a non-P1 research terminal without exporting or retaining artifacts", async () => {
    const artifacts = new InMemoryContentAddressedArtifactStoreV1();
    const client = researchSuccessClientV1(fixtureV1, {
      terminalStatus: "period2-confirmed",
    });

    await expect(bootstrapScientificProductStudioSourceV1({
      caseEntry: fixtureV1.researchCase,
      scenarioId: "scenario/research-mismatch",
      artifacts,
      createClient: () => client.asWorkerClientV1(),
    })).rejects.toThrow(
      /research source settlement ended as period2-confirmed/,
    );

    expect(client.commandKinds).toEqual([
      "createResearchDocumentCaseSession",
      "settlePeriodic",
      "settlePeriodic",
    ]);
    expect(artifacts.entryCount).toBe(0);
    expect(client.terminateCount).toBe(1);
  });

  it("fails closed when the exported resolved input is not bound to the exact checkpoint", async () => {
    const artifacts = new InMemoryContentAddressedArtifactStoreV1();
    const client = officialSuccessClientV1(fixtureV1, {
      exportedSessionInputSha256: "f".repeat(64),
    });

    await expect(bootstrapScientificProductStudioSourceV1({
      caseEntry: requiredOfficialCaseV1(),
      scenarioId: "scenario/export-binding-mismatch",
      artifacts,
      createClient: () => client.asWorkerClientV1(),
    })).rejects.toThrow(
      /V4 export is not bound to one full accepted-step seed/,
    );

    expect(client.commandKinds.at(-1)).toBe("getExactCheckpointV4");
    expect(artifacts.entryCount).toBe(0);
    expect(client.terminateCount).toBe(1);
  });
});

class AbortBeforeAtomicBatchCommitV1
extends InMemoryContentAddressedArtifactStoreV1 {
  batchCount = 0;

  constructor(private readonly abortController: AbortController) {
    super();
  }

  override async putJsonBatch(
    writes: readonly StudioJsonWriteV1[],
    options: Readonly<{ signal?: AbortSignal }> = {},
  ): Promise<readonly StudioArtifactRefV1[]> {
    this.batchCount += 1;
    this.abortController.abort();
    return super.putJsonBatch(writes, options);
  }
}

class BootstrapFakeClientV1 {
  readonly commandKinds: ScientificCommandV1["kind"][] = [];
  terminateCount = 0;

  constructor(
    private readonly responseFor:
      (command: ScientificCommandV1) => unknown | Promise<unknown>,
  ) {}

  async request(command: ScientificCommandV1): Promise<unknown> {
    this.commandKinds.push(command.kind);
    return this.responseFor(command);
  }

  terminate(): void {
    this.terminateCount += 1;
  }

  asWorkerClientV1(): MainWireScientificWorkerClientV1 {
    return this as unknown as MainWireScientificWorkerClientV1;
  }
}

function officialSuccessClientV1(
  fixture: CanonicalFixtureV1,
  options: Readonly<{
    officialOriginKind?: string;
    exportedSessionInputSha256?: string;
  }> = {},
): BootstrapFakeClientV1 {
  return new BootstrapFakeClientV1((command) => {
    switch (command.kind) {
      case "createOfficialDocumentCaseSession":
        return responseIdentityV1(command, {
          releaseRef: fixture.exactCheckpoint.releaseRef,
          sessionOrigin: {
            kind: options.officialOriginKind
              ?? "official-document-case-v3-exact-checkpoint-restore",
          },
          payload: {
            kind: "officialDocumentCaseSessionCreated",
            researchControlContext:
              fixture.researchCreated.payload.researchControlContext,
          },
        });
      case "settlePeriodic":
        return periodicResponseV1(command, {
          status: "period1-converged",
          completedBeatCount: 12,
          beatCompletedThisCall: false,
          completedStepCountThisCall: 0,
        }, fixture);
      case "runTransient":
        return responseIdentityV1(command, {
          releaseRef: fixture.exactCheckpoint.releaseRef,
          sessionOrigin: fixture.exactCheckpoint.sessionOrigin,
          payload: {
            kind: "transientCompleted",
            completedStepCount: 1,
            observableFrames: [
              fixture.exactCheckpoint.payload.observableFrame,
            ],
            finalObservableFrame:
              fixture.exactCheckpoint.payload.observableFrame,
          },
        });
      case "getExactCheckpointV4": {
        const resolved = options.exportedSessionInputSha256 === undefined
          ? fixture.exactCheckpoint.payload.resolvedSessionInput
          : {
            ...fixture.exactCheckpoint.payload.resolvedSessionInput,
            sessionInputSha256: options.exportedSessionInputSha256,
          };
        return responseIdentityV1(command, {
          releaseRef: fixture.exactCheckpoint.releaseRef,
          sessionOrigin: fixture.exactCheckpoint.sessionOrigin,
          payload: {
            ...fixture.exactCheckpoint.payload,
            resolvedSessionInput: resolved,
          },
        });
      }
      default:
        throw new Error(`unexpected official command ${command.kind}`);
    }
  });
}

function researchSuccessClientV1(
  fixture: CanonicalFixtureV1,
  options: Readonly<{
    terminalStatus?: "period1-converged" | "period2-confirmed";
  }> = {},
): BootstrapFakeClientV1 {
  let settlementCallCount = 0;
  return new BootstrapFakeClientV1((command) => {
    switch (command.kind) {
      case "createResearchDocumentCaseSession":
        return responseIdentityV1(command, {
          releaseRef: fixture.researchCreated.releaseRef,
          sessionOrigin: fixture.researchCreated.sessionOrigin,
          payload: fixture.researchCreated.payload,
        });
      case "settlePeriodic": {
        settlementCallCount += 1;
        const terminal = settlementCallCount === 2;
        return periodicResponseV1(command, {
          status: terminal
            ? options.terminalStatus ?? "period1-converged"
            : "tracking",
          completedBeatCount: settlementCallCount,
          beatCompletedThisCall: true,
          completedStepCountThisCall: 500,
        }, fixture);
      }
      case "getExactCheckpointV4":
        return responseIdentityV1(command, {
          releaseRef: fixture.exactCheckpoint.releaseRef,
          sessionOrigin: fixture.exactCheckpoint.sessionOrigin,
          payload: fixture.exactCheckpoint.payload,
        });
      default:
        throw new Error(`unexpected research command ${command.kind}`);
    }
  });
}

function periodicResponseV1(
  command: Extract<ScientificCommandV1, { kind: "settlePeriodic" }>,
  input: Readonly<{
    status: "tracking" | "period1-converged" | "period2-confirmed";
    completedBeatCount: number;
    beatCompletedThisCall: boolean;
    completedStepCountThisCall: number;
  }>,
  fixture: CanonicalFixtureV1,
): unknown {
  return responseIdentityV1(command, {
    releaseRef: fixture.exactCheckpoint.releaseRef,
    sessionOrigin: fixture.exactCheckpoint.sessionOrigin,
    payload: {
      kind: "periodic-settlement-progress",
      status: input.status,
      periodicSteadyStateClaimed: input.status === "period1-converged",
      period2OrbitSuspected: input.status === "period2-confirmed",
      beatCompletedThisCall: input.beatCompletedThisCall,
      completedStepCountThisCall: input.completedStepCountThisCall,
      completedBeatCount: input.completedBeatCount,
      finalObservableFrame:
        fixture.exactCheckpoint.payload.observableFrame,
    },
  });
}

function responseIdentityV1(
  command: ScientificCommandV1,
  body: Readonly<Record<string, unknown>>,
): Readonly<Record<string, unknown>> {
  return {
    protocolId: SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
    ok: true,
    requestId: command.requestId,
    sessionId: command.sessionId,
    commandKind: command.kind,
    ...body,
    error: null,
  };
}

async function createCanonicalFixtureV1(): Promise<CanonicalFixtureV1> {
  const researchCase = requiredResearchCaseV1();
  const kernel = new MainWireScientificInProcessKernelV1({
    maximumSessionCount: 1,
    maximumTransientStepCountPerCommand: 1,
    maximumOutputFrameCountPerCommand: 1,
  });
  const sessionId = "fixture:studio-bootstrap";
  const created = await kernel.handle({
    protocolId: SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
    kind: "createResearchDocumentCaseSession",
    requestId: "fixture:create",
    sessionId,
    presetId: researchCase.source.presetId,
    presetVersion: researchCase.source.presetVersion,
  });
  if (
    !created.ok
    || created.commandKind !== "createResearchDocumentCaseSession"
    || created.payload.kind !== "researchDocumentCaseSessionCreated"
  ) throw new Error(
    `failed to create canonical bootstrap fixture: ${JSON.stringify(created)}`,
  );

  const stepped = await kernel.handle({
    protocolId: SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
    kind: "runTransient",
    requestId: "fixture:step",
    sessionId,
    dtSec: 0.002,
    stepCount: 1,
    observationStride: 1,
  });
  if (
    !stepped.ok
    || stepped.commandKind !== "runTransient"
    || stepped.payload.kind !== "transientCompleted"
    || stepped.payload.finalObservableFrame.source !== "accepted-step"
  ) throw new Error("failed to advance canonical bootstrap fixture");

  const exported = await kernel.handle({
    protocolId: SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
    kind: "getExactCheckpointV4",
    requestId: "fixture:export",
    sessionId,
  });
  if (
    !exported.ok
    || exported.commandKind !== "getExactCheckpointV4"
    || exported.payload.kind !== "exactCheckpointV4"
  ) throw new Error("failed to export canonical bootstrap fixture");

  return Object.freeze({
    researchCase,
    researchCreated: created,
    exactCheckpoint: exported,
  });
}

function requiredOfficialCaseV1(): Extract<
  ScientificProductCaseV1,
  Readonly<{ kind: "official-exact-periodic" }>
> {
  const entry = SCIENTIFIC_PRODUCT_CASE_CATALOG_V1.find(
    (candidate) => candidate.kind === "official-exact-periodic",
  );
  if (entry === undefined || entry.kind !== "official-exact-periodic") {
    throw new Error("official product case fixture is unavailable");
  }
  return entry;
}

function requiredResearchCaseV1(): Extract<
  ScientificProductCaseV1,
  Readonly<{ kind: "research-bracket" }>
> {
  const entry = SCIENTIFIC_PRODUCT_CASE_CATALOG_V1.find(
    (candidate) => candidate.kind === "research-bracket",
  );
  if (entry === undefined || entry.kind !== "research-bracket") {
    throw new Error("research product case fixture is unavailable");
  }
  return entry;
}
