import type {
  MainWireIntegratedPreviewMcsPresetIdV1,
  MainWireIntegratedPreviewRunPresentationV2,
  MainWireIntegratedPreviewRunRecordV2,
} from "@/engine/scientific/integratedPreview";
import {
  canonicalJsonStringify,
  cloneAndFreezeCanonicalJson,
  sha256CanonicalJsonHex,
  type CanonicalJsonObject,
} from "@/engine/scientific/release";
import {
  INTEGRATED_PREVIEW_COMMAND_PROTOCOL_V1_ID,
  type IntegratedPreviewCommandResponseV1,
  type IntegratedPreviewCommandV1,
} from "@/engine/scientific/worker/integratedPreviewCommandProtocolV1";
import {
  MAIN_WIRE_INTEGRATED_PREVIEW_BROWSER_EXPECTED_IDENTITY_V1,
  MAIN_WIRE_INTEGRATED_PREVIEW_BROWSER_RELEASE_REF_V1,
} from "@/engine/scientificBrowser/mainWireIntegratedPreviewExpectedIdentityV1";

export {
  MAIN_WIRE_INTEGRATED_PREVIEW_BROWSER_EXPECTED_IDENTITY_V1,
  MAIN_WIRE_INTEGRATED_PREVIEW_BROWSER_RELEASE_REF_V1,
} from "@/engine/scientificBrowser/mainWireIntegratedPreviewExpectedIdentityV1";

type MessageListenerV1 = (event: MessageEvent<unknown>) => void;
type ErrorListenerV1 = (event: ErrorEvent) => void;

export interface MainWireIntegratedPreviewWorkerLikeV1 {
  postMessage(message: unknown): void;
  terminate(): void;
  addEventListener(
    type: "message",
    listener: MessageListenerV1,
  ): void;
  addEventListener(
    type: "messageerror",
    listener: MessageListenerV1,
  ): void;
  addEventListener(type: "error", listener: ErrorListenerV1): void;
  removeEventListener(
    type: "message",
    listener: MessageListenerV1,
  ): void;
  removeEventListener(
    type: "messageerror",
    listener: MessageListenerV1,
  ): void;
  removeEventListener(type: "error", listener: ErrorListenerV1): void;
}

export type MainWireIntegratedPreviewWorkerClientOptionsV1 = Readonly<{
  workerFactory?: () => MainWireIntegratedPreviewWorkerLikeV1;
  requestTimeoutMs?: number;
}>;

type Pending = Readonly<{
  requestId: string;
  sessionId: string;
  commandKind: IntegratedPreviewCommandV1["kind"];
  expectedMcsPresetId: MainWireIntegratedPreviewMcsPresetIdV1;
  expectedSessionHead: ActiveSessionHead | null;
  resolve(response: IntegratedPreviewCommandResponseV1): void;
  reject(error: Error): void;
  timeout: ReturnType<typeof setTimeout>;
}>;

type ActiveSessionHead = Readonly<{
  mcsPresetId: MainWireIntegratedPreviewMcsPresetIdV1;
  simulationInputSpecSha256: string;
  terminalCheckpointSha256: string;
  terminalAcceptedTimeSec: number;
  terminalRevision: number;
  nextContinuationBeatOrdinalFromSeed: number;
}>;

type CreatingSession = Readonly<{
  requestId: string;
  mcsPresetId: MainWireIntegratedPreviewMcsPresetIdV1;
}>;

export class MainWireIntegratedPreviewWorkerClientV1 {
  private readonly worker: MainWireIntegratedPreviewWorkerLikeV1;
  private readonly requestTimeoutMs: number;
  private readonly pending = new Map<string, Pending>();
  private readonly verifyingRequestIds = new Set<string>();
  private readonly activeSessionHeadBySessionId =
    new Map<string, ActiveSessionHead>();
  private readonly creatingSessionBySessionId =
    new Map<string, CreatingSession>();
  private readonly inFlightRequestIdBySessionId =
    new Map<string, string>();
  private requestSequence = 0;
  private terminated = false;

  private readonly onMessage = (event: MessageEvent<unknown>): void => {
    let detached: unknown;
    try {
      detached =
        cloneAndFreezeCanonicalJson<CanonicalJsonObject>(event.data);
    } catch (error) {
      this.quarantine(
        new Error(
          "integrated preview Worker response is not canonical JSON data: "
            + errorMessage(error),
        ),
      );
      return;
    }
    if (!isResponse(detached)) {
      this.quarantine(
        new Error("integrated preview Worker response is invalid"),
      );
      return;
    }
    const response = detached;
    const pending = this.pending.get(response.requestId ?? "");
    if (pending === undefined) {
      this.quarantine(
        new Error("integrated preview Worker response is unsolicited"),
      );
      return;
    }
    if (
      response.releaseRef !== null
      && !sameReleaseRef(
        response.releaseRef,
        MAIN_WIRE_INTEGRATED_PREVIEW_BROWSER_RELEASE_REF_V1,
      )
    ) {
      this.quarantine(
        new Error(
          "integrated preview Worker response release differs from "
            + "the current browser bundle",
        ),
      );
      return;
    }
    if (
      response.requestId !== pending.requestId
      || response.sessionId !== pending.sessionId
      || response.commandKind !== pending.commandKind
    ) {
      this.quarantine(
        new Error(
          "integrated preview Worker response identity does not match "
            + `pending request ${pending.requestId}`,
        ),
      );
      return;
    }
    if (this.verifyingRequestIds.has(pending.requestId)) {
      this.quarantine(
        new Error(
          "integrated preview Worker emitted a duplicate response while "
            + `request ${pending.requestId} was being verified`,
        ),
      );
      return;
    }
    if (response.ok === false) {
      this.completePending(pending, response, null);
      return;
    }
    this.verifyingRequestIds.add(pending.requestId);
    void this.verifySuccessResponse(pending, response).then(
      (nextSessionHead) => {
        if (
          this.terminated
          || this.pending.get(pending.requestId) !== pending
        ) return;
        this.completePending(pending, response, nextSessionHead);
      },
      (error: unknown) => {
        this.quarantine(
          new Error(
            "integrated preview Worker response integrity verification failed: "
              + errorMessage(error),
          ),
        );
      },
    );
  };

  private readonly onMessageError = (
    _event: MessageEvent<unknown>,
  ): void => {
    this.quarantine(
      new Error("integrated preview Worker emitted a messageerror event"),
    );
  };

  private readonly onWorkerError = (event: ErrorEvent): void => {
    event.preventDefault?.();
    this.quarantine(
      new Error(
        event.message || "integrated preview Worker emitted an error event",
      ),
    );
  };

  constructor(options: MainWireIntegratedPreviewWorkerClientOptionsV1 = {}) {
    this.requestTimeoutMs = options.requestTimeoutMs ?? 90_000;
    this.worker = (options.workerFactory ?? createDefaultWorker)();
    this.worker.addEventListener("message", this.onMessage);
    this.worker.addEventListener("messageerror", this.onMessageError);
    this.worker.addEventListener("error", this.onWorkerError);
  }

  createSession(
    sessionId: string,
    mcsPresetId: MainWireIntegratedPreviewMcsPresetIdV1,
  ): Promise<IntegratedPreviewCommandResponseV1> {
    return this.send({
      protocolId: INTEGRATED_PREVIEW_COMMAND_PROTOCOL_V1_ID,
      kind: "createSession",
      requestId: this.nextRequestId(),
      sessionId,
      mcsPresetId,
    });
  }

  runNextBeat(sessionId: string):
  Promise<IntegratedPreviewCommandResponseV1> {
    return this.send({
      protocolId: INTEGRATED_PREVIEW_COMMAND_PROTOCOL_V1_ID,
      kind: "runNextBeat",
      requestId: this.nextRequestId(),
      sessionId,
    });
  }

  disposeSession(sessionId: string):
  Promise<IntegratedPreviewCommandResponseV1> {
    return this.send({
      protocolId: INTEGRATED_PREVIEW_COMMAND_PROTOCOL_V1_ID,
      kind: "disposeSession",
      requestId: this.nextRequestId(),
      sessionId,
    });
  }

  terminate(): void {
    this.quarantine(
      new Error("integrated preview Worker client terminated"),
    );
  }

  private send(
    command: IntegratedPreviewCommandV1,
  ): Promise<IntegratedPreviewCommandResponseV1> {
    if (this.terminated) {
      return Promise.reject(
        new Error("integrated preview Worker client is terminated"),
      );
    }
    let expectedMcsPresetId: MainWireIntegratedPreviewMcsPresetIdV1;
    let expectedSessionHead: ActiveSessionHead | null;
    if (command.kind === "createSession") {
      if (
        this.creatingSessionBySessionId.has(command.sessionId)
        || this.activeSessionHeadBySessionId.has(command.sessionId)
        || this.inFlightRequestIdBySessionId.has(command.sessionId)
      ) {
        return Promise.reject(
          new Error(
            "integrated preview Worker session is already creating or active",
          ),
        );
      }
      expectedMcsPresetId = command.mcsPresetId;
      expectedSessionHead = null;
      this.creatingSessionBySessionId.set(command.sessionId, {
        requestId: command.requestId,
        mcsPresetId: command.mcsPresetId,
      });
    } else {
      const creating =
        this.creatingSessionBySessionId.get(command.sessionId);
      if (creating !== undefined) {
        return Promise.reject(
          new Error(
            "integrated preview Worker session creation has not completed",
          ),
        );
      }
      const activeSessionHead =
        this.activeSessionHeadBySessionId.get(command.sessionId);
      if (activeSessionHead === undefined) {
        return Promise.reject(
          new Error("integrated preview Worker session is not active"),
        );
      }
      if (this.inFlightRequestIdBySessionId.has(command.sessionId)) {
        return Promise.reject(
          new Error(
            "integrated preview Worker session already has "
              + "a stateful command pending",
          ),
        );
      }
      expectedMcsPresetId = activeSessionHead.mcsPresetId;
      expectedSessionHead = activeSessionHead;
    }
    this.inFlightRequestIdBySessionId.set(
      command.sessionId,
      command.requestId,
    );
    return new Promise<IntegratedPreviewCommandResponseV1>((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.quarantine(
          new Error(
            "integrated preview Worker request timed out; "
              + "the session outcome is unknown and was quarantined",
          ),
        );
      }, this.requestTimeoutMs);
      this.pending.set(command.requestId, {
        requestId: command.requestId,
        sessionId: command.sessionId,
        commandKind: command.kind,
        expectedMcsPresetId,
        expectedSessionHead,
        resolve,
        reject,
        timeout,
      });
      try {
        this.worker.postMessage(command);
      } catch (error) {
        this.quarantine(
          error instanceof Error ? error : new Error(String(error)),
        );
      }
    }).then((response) => {
      if (response.ok === false) {
        throw new Error(
          `${response.error.code}: ${response.error.message}`,
        );
      }
      return response;
    });
  }

  private nextRequestId(): string {
    this.requestSequence += 1;
    return `integrated-preview-request-${this.requestSequence}`;
  }

  private failAll(error: Error): void {
    for (const pending of this.pending.values()) {
      clearTimeout(pending.timeout);
      pending.reject(error);
    }
    this.pending.clear();
    this.verifyingRequestIds.clear();
    this.activeSessionHeadBySessionId.clear();
    this.creatingSessionBySessionId.clear();
    this.inFlightRequestIdBySessionId.clear();
  }

  private quarantine(error: Error): void {
    if (!this.terminated) {
      this.terminated = true;
      try {
        this.worker.removeEventListener("message", this.onMessage);
        this.worker.removeEventListener("messageerror", this.onMessageError);
        this.worker.removeEventListener("error", this.onWorkerError);
      } catch {
        // The transport is already terminal. Listener-detach failure cannot
        // make any response trustworthy again.
      }
      try {
        this.worker.terminate();
      } catch {
        // Preserve the original terminal cause for every pending request.
      }
    }
    this.failAll(error);
  }

  private completePending(
    pending: Pending,
    response: IntegratedPreviewCommandResponseV1,
    nextSessionHead: ActiveSessionHead | null,
  ): void {
    clearTimeout(pending.timeout);
    this.pending.delete(pending.requestId);
    this.verifyingRequestIds.delete(pending.requestId);
    if (
      this.inFlightRequestIdBySessionId.get(pending.sessionId)
        === pending.requestId
    ) {
      this.inFlightRequestIdBySessionId.delete(pending.sessionId);
    }
    if (pending.commandKind === "createSession") {
      const creating =
        this.creatingSessionBySessionId.get(pending.sessionId);
      if (creating?.requestId === pending.requestId) {
        this.creatingSessionBySessionId.delete(pending.sessionId);
        if (response.ok === true && nextSessionHead !== null) {
          this.activeSessionHeadBySessionId.set(
            pending.sessionId,
            nextSessionHead,
          );
        }
      }
    } else if (response.ok === true) {
      if (pending.commandKind === "disposeSession") {
        this.activeSessionHeadBySessionId.delete(pending.sessionId);
      } else if (nextSessionHead !== null) {
        this.activeSessionHeadBySessionId.set(
          pending.sessionId,
          nextSessionHead,
        );
      }
    }
    pending.resolve(response);
  }

  private async verifySuccessResponse(
    pending: Pending,
    response: Extract<
      IntegratedPreviewCommandResponseV1,
      { ok: true }
    >,
  ): Promise<ActiveSessionHead | null> {
    const runRecord = response.runRecord;
    const presentation = response.presentation;
    if (runRecord === null || presentation === null) {
      if (pending.commandKind !== "disposeSession") {
        throw new Error("stateful command omitted its run record");
      }
      return null;
    }
    if (pending.commandKind === "disposeSession") {
      throw new Error("dispose command returned a run record");
    }

    const { recordSha256, ...recordPayload } = runRecord;
    const [expectedRecordSha256, expectedInputSpecSha256] = await Promise.all([
      sha256CanonicalJsonHex(recordPayload),
      sha256CanonicalJsonHex(runRecord.simulationInputSpec),
    ]);
    if (recordSha256 !== expectedRecordSha256) {
      throw new Error("run record SHA-256 does not match its canonical payload");
    }
    if (runRecord.simulationInputSpecSha256 !== expectedInputSpecSha256) {
      throw new Error(
        "simulation input SHA-256 does not match its canonical payload",
      );
    }
    await validateStrictRunRecordV2(runRecord);
    if (
      !sameReleaseRef(runRecord.simulationInputSpec.releaseRef, response.releaseRef)
      || runRecord.sourceSeed.payloadSha256
        !== runRecord.simulationInputSpec.seedRunPayloadSha256
      || runRecord.sourceSeed.protocolIdentityHash
        !== runRecord.simulationInputSpec.sourceProtocolIdentityHash
      || runRecord.sourceSeed.periodicFixtureIdentitySha256
        !== runRecord.simulationInputSpec.periodicFixtureIdentitySha256
      || runRecord.run.acceptedStepCount !== runRecord.run.trace.length
    ) {
      throw new Error("run record internal identity relations are inconsistent");
    }
    if (
      runRecord.simulationInputSpec.mechanicalSupport.presetId
        !== pending.expectedMcsPresetId
    ) {
      throw new Error("run record MCS preset differs from the pending command");
    }
    const expectedBrowserIdentity =
      MAIN_WIRE_INTEGRATED_PREVIEW_BROWSER_EXPECTED_IDENTITY_V1
        .byMcsPresetId[pending.expectedMcsPresetId];
    const expectedSourceSeed =
      MAIN_WIRE_INTEGRATED_PREVIEW_BROWSER_EXPECTED_IDENTITY_V1.sourceSeed;
    if (
      runRecord.simulationInputSpecSha256
        !== expectedBrowserIdentity.simulationInputSpecSha256
      || runRecord.sourceSeed.payloadSha256
        !== expectedSourceSeed.payloadSha256
      || runRecord.sourceSeed.startCheckpointSha256
        !== expectedSourceSeed.startCheckpointSha256
      || runRecord.sourceSeed.terminalCheckpointSha256
        !== expectedSourceSeed.terminalCheckpointSha256
      || (
        pending.commandKind === "createSession"
        && runRecord.startModelState.checkpointSha256
          !== expectedBrowserIdentity.createStartCheckpointSha256
      )
    ) {
      throw new Error(
        "run record differs from the pinned browser input or seed identity",
      );
    }
    if (
      pending.commandKind === "createSession"
      && pending.expectedMcsPresetId === "all-off"
      && runRecord.run.kind !== "bundled-p1-seed"
    ) {
      throw new Error("all-off create command did not return its bundled seed");
    }
    if (
      (
        pending.commandKind === "runNextBeat"
        || pending.expectedMcsPresetId
          === "lvad-hmii-9000-one-beat-transient"
      )
      && runRecord.run.kind !== "one-beat-continuation"
    ) {
      throw new Error("beat command did not return a one-beat continuation");
    }

    const expectedPresentation = projectExpectedPresentation(
      runRecord as MainWireIntegratedPreviewRunRecordV2,
    );
    if (
      canonicalJsonStringify(presentation)
        !== canonicalJsonStringify(expectedPresentation)
    ) {
      throw new Error(
        "presentation is not the exact projection of the run record",
      );
    }
    return nextActiveSessionHead(pending, runRecord);
  }
}

function nextActiveSessionHead(
  pending: Pending,
  runRecord: MainWireIntegratedPreviewRunRecordV2,
): ActiveSessionHead {
  let nextContinuationBeatOrdinalFromSeed: number;
  if (pending.commandKind === "createSession") {
    if (pending.expectedSessionHead !== null) {
      throw new Error("create command unexpectedly had a prior session head");
    }
    if (pending.expectedMcsPresetId === "all-off") {
      if (
        runRecord.run.kind !== "bundled-p1-seed"
        || runRecord.run.execution.operation !== "project-bundled-p1-seed"
      ) {
        throw new Error(
          "all-off create command did not establish its bundled seed head",
        );
      }
      nextContinuationBeatOrdinalFromSeed = 1;
    } else {
      if (
        runRecord.run.kind !== "one-beat-continuation"
        || runRecord.run.execution.operation
          !== "advance-one-fixed-sinus-cycle"
        || runRecord.run.execution.continuationBeatOrdinalFromSeed !== 1
      ) {
        throw new Error(
          "active-MCS create command did not establish ordinal-one head",
        );
      }
      nextContinuationBeatOrdinalFromSeed = 2;
    }
  } else if (pending.commandKind === "runNextBeat") {
    const expected = pending.expectedSessionHead;
    if (expected === null) {
      throw new Error("beat command omitted its expected session head");
    }
    if (
      runRecord.run.kind !== "one-beat-continuation"
      || runRecord.run.execution.operation
        !== "advance-one-fixed-sinus-cycle"
      || runRecord.run.execution.continuationBeatOrdinalFromSeed
        !== expected.nextContinuationBeatOrdinalFromSeed
      || runRecord.simulationInputSpecSha256
        !== expected.simulationInputSpecSha256
      || runRecord.startModelState.checkpointSha256
        !== expected.terminalCheckpointSha256
      || runRecord.startModelState.acceptedTimeSec
        !== expected.terminalAcceptedTimeSec
      || runRecord.startModelState.revision !== expected.terminalRevision
    ) {
      throw new Error(
        "beat response does not continue the exact pending session head",
      );
    }
    nextContinuationBeatOrdinalFromSeed =
      expected.nextContinuationBeatOrdinalFromSeed + 1;
  } else {
    throw new Error("dispose command unexpectedly returned a run record");
  }
  return Object.freeze({
    mcsPresetId: pending.expectedMcsPresetId,
    simulationInputSpecSha256: runRecord.simulationInputSpecSha256,
    terminalCheckpointSha256:
      runRecord.terminalModelState.checkpointSha256,
    terminalAcceptedTimeSec:
      runRecord.terminalModelState.acceptedTimeSec,
    terminalRevision: runRecord.terminalModelState.revision,
    nextContinuationBeatOrdinalFromSeed,
  });
}

function createDefaultWorker(): MainWireIntegratedPreviewWorkerLikeV1 {
  return new Worker(
    new URL("./mainWireIntegratedPreviewWorkerV1.ts", import.meta.url),
    { type: "module" },
  ) as unknown as MainWireIntegratedPreviewWorkerLikeV1;
}

function projectExpectedPresentation(
  record: MainWireIntegratedPreviewRunRecordV2,
): MainWireIntegratedPreviewRunPresentationV2 {
  const { trace, ...run } = record.run;
  return {
    artifactId: record.artifactId,
    schemaVersion: record.schemaVersion,
    recordSha256: record.recordSha256,
    releaseRef: record.releaseRef,
    simulationInputSpec: record.simulationInputSpec,
    simulationInputSpecSha256: record.simulationInputSpecSha256,
    sourceSeed: record.sourceSeed,
    run,
    trace,
    startModelStateRef: {
      checkpointId: record.startModelState.checkpointId,
      schemaVersion: record.startModelState.schemaVersion,
      checkpointSha256: record.startModelState.checkpointSha256,
      acceptedTimeSec: record.startModelState.acceptedTimeSec,
      revision: record.startModelState.revision,
    },
    terminalModelStateRef: {
      checkpointId: record.terminalModelState.checkpointId,
      schemaVersion: record.terminalModelState.schemaVersion,
      checkpointSha256: record.terminalModelState.checkpointSha256,
      acceptedTimeSec: record.terminalModelState.acceptedTimeSec,
      revision: record.terminalModelState.revision,
    },
  };
}

async function validateStrictRunRecordV2(value: unknown): Promise<void> {
  assertExactRecordKeys(value, [
    "artifactId",
    "schemaVersion",
    "releaseRef",
    "simulationInputSpec",
    "simulationInputSpecSha256",
    "sourceSeed",
    "run",
    "startModelState",
    "terminalModelState",
    "replayCompleteness",
    "recordSha256",
  ], "integrated preview run record");
  if (
    value.artifactId
      !== "circleheart-main-wire-integrated-preview-run-record-v2"
    || value.schemaVersion !== 2
  ) {
    throw new Error("integrated preview run record schema is unsupported");
  }
  assertReleaseRef(value.releaseRef, "integrated preview run record release");
  if (
    !sameReleaseRef(
      value.releaseRef,
      MAIN_WIRE_INTEGRATED_PREVIEW_BROWSER_RELEASE_REF_V1,
    )
  ) {
    throw new Error(
      "integrated preview run record release differs from "
        + "the current browser bundle",
    );
  }
  assertSimulationInputSpec(value.simulationInputSpec, value.releaseRef);
  assertDigest(
    value.simulationInputSpecSha256,
    "integrated preview input spec SHA-256",
  );
  assertSourceSeed(value.sourceSeed, value.simulationInputSpec);
  assertRunLedger(value.run);
  assertReplayCompleteness(
    value.replayCompleteness,
    value.run as unknown as MainWireIntegratedPreviewRunRecordV2["run"],
  );
  assertDigest(value.recordSha256, "integrated preview run record SHA-256");

  const record = value as unknown as MainWireIntegratedPreviewRunRecordV2;
  await Promise.all([
    validateIntegratedCheckpointV3(
      record.startModelState,
      record.run.startAcceptedTimeSec,
      "start",
    ),
    validateIntegratedCheckpointV3(
      record.terminalModelState,
      record.run.endAcceptedTimeSec,
      "terminal",
    ),
  ]);
  if (
    !sameReleaseRef(
      record.simulationInputSpec.releaseRef,
      record.releaseRef,
    )
    || record.sourceSeed.payloadSha256
      !== record.simulationInputSpec.seedRunPayloadSha256
    || record.sourceSeed.protocolIdentityHash
      !== record.simulationInputSpec.sourceProtocolIdentityHash
    || record.sourceSeed.periodicFixtureIdentitySha256
      !== record.simulationInputSpec.periodicFixtureIdentitySha256
    || record.run.acceptedStepCount !== record.run.trace.length
    || record.terminalModelState.revision
      - record.startModelState.revision !== record.run.acceptedStepCount
    || record.startModelState.dynamicMechanicalSupportProfileIdentitySha256
      !== record.simulationInputSpec.mechanicalSupport.canonicalProfileSha256
    || record.terminalModelState
      .dynamicMechanicalSupportProfileIdentitySha256
      !== record.simulationInputSpec.mechanicalSupport.canonicalProfileSha256
    || record.startModelState.composedRhythmConfigurationIdentitySha256
      !== record.terminalModelState
        .composedRhythmConfigurationIdentitySha256
    || record.startModelState.providerParameterIdentitySha256
      !== record.terminalModelState.providerParameterIdentitySha256
    || record.startModelState
      .dynamicMechanicalSupportStructuralHydraulicIdentitySha256
      !== record.terminalModelState
        .dynamicMechanicalSupportStructuralHydraulicIdentitySha256
    || canonicalJsonStringify(record.startModelState.exactResumeClaim)
      !== canonicalJsonStringify(record.terminalModelState.exactResumeClaim)
    || canonicalJsonStringify(
      record.startModelState.coronary.exactResumeClaim,
    ) !== canonicalJsonStringify(
      record.terminalModelState.coronary.exactResumeClaim,
    )
    || canonicalJsonStringify(
      record.startModelState.coronary.baseCheckpointV2.exactResumeClaim,
    ) !== canonicalJsonStringify(
      record.terminalModelState.coronary.baseCheckpointV2.exactResumeClaim,
    )
    || canonicalJsonStringify(
      record.startModelState.composedRhythm.exactResumeClaim,
    ) !== canonicalJsonStringify(
      record.terminalModelState.composedRhythm.exactResumeClaim,
    )
    || canonicalJsonStringify(
      record.startModelState.coronary.coronaryAutoregulationBinding,
    ) !== canonicalJsonStringify(
      record.terminalModelState.coronary.coronaryAutoregulationBinding,
    )
    || canonicalJsonStringify(
      record.startModelState.coronary.baseCheckpointV2.coronaryBinding,
    ) !== canonicalJsonStringify(
      record.terminalModelState.coronary.baseCheckpointV2.coronaryBinding,
    )
  ) {
    throw new Error("integrated preview run record identity relation differs");
  }
  if (record.run.kind === "bundled-p1-seed") {
    if (
      record.run.execution.operation !== "project-bundled-p1-seed"
      || record.run.execution.continuationBeatCountFromSeed !== 0
      || record.run.numericalPeriod1Established !== true
      || record.simulationInputSpec.mechanicalSupport.presetId !== "all-off"
      || record.startModelState.checkpointSha256
        !== record.sourceSeed.startCheckpointSha256
      || record.terminalModelState.checkpointSha256
        !== record.sourceSeed.terminalCheckpointSha256
    ) {
      throw new Error("integrated preview bundled seed relation differs");
    }
  } else if (
    record.run.execution.operation !== "advance-one-fixed-sinus-cycle"
    || record.run.execution.requestedDurationSec !== 1
    || !Number.isInteger(
      record.run.execution.continuationBeatOrdinalFromSeed,
    )
    || record.run.execution.continuationBeatOrdinalFromSeed < 1
    || record.run.numericalPeriod1Established
      !== "not-assessed-for-this-continuation"
  ) {
    throw new Error("integrated preview continuation relation differs");
  }
}

function assertSimulationInputSpec(
  value: unknown,
  outerReleaseRef: Readonly<{ id: string; version: string; sha256: string }>,
): void {
  assertExactRecordKeys(value, [
    "schemaId",
    "schemaVersion",
    "releaseRef",
    "modelAssembly",
    "fixedGlobalTotalBloodVolumeMl",
    "rhythm",
    "mechanicalSupport",
    "nominalDtSec",
    "seedRunPayloadSha256",
    "sourceProtocolIdentityHash",
    "periodicFixtureIdentitySha256",
  ], "integrated preview simulation input spec");
  if (
    value.schemaId !== "circleheart-integrated-simulation-input-spec-v1"
    || value.schemaVersion !== 1
    || value.modelAssembly
      !== "base+coronary-v3+dynamic-mcs+composed-rhythm-v2"
    || value.fixedGlobalTotalBloodVolumeMl !== 5_600
    || value.nominalDtSec !== 0.002
  ) {
    throw new Error("integrated preview simulation input schema differs");
  }
  assertReleaseRef(value.releaseRef, "integrated preview input release");
  if (!sameReleaseRef(value.releaseRef, outerReleaseRef)) {
    throw new Error("integrated preview input release differs");
  }
  assertExactRecordKeys(value.rhythm, [
    "presetId",
    "heartRateBpm",
    "cycleLengthSec",
    "externalAfOwnerIncluded",
  ], "integrated preview rhythm input");
  if (
    value.rhythm.presetId !== "composed-regular-sinus-60-v1"
    || value.rhythm.heartRateBpm !== 60
    || value.rhythm.cycleLengthSec !== 1
    || value.rhythm.externalAfOwnerIncluded !== false
  ) {
    throw new Error("integrated preview rhythm input differs");
  }
  assertExactRecordKeys(value.mechanicalSupport, [
    "presetId",
    "activeDeviceIds",
    "interpretation",
    "canonicalProfileSha256",
    "canonicalConfigSha256",
  ], "integrated preview mechanical-support input");
  const support = value.mechanicalSupport;
  if (
    (
      support.presetId !== "all-off"
      && support.presetId !== "lvad-hmii-9000-one-beat-transient"
    )
    || !Array.isArray(support.activeDeviceIds)
  ) {
    throw new Error("integrated preview mechanical-support preset differs");
  }
  if (
    support.presetId === "all-off"
      ? support.activeDeviceIds.length !== 0
        || support.interpretation !== "numerically-periodic-all-off-seed"
      : support.activeDeviceIds.length !== 1
        || support.activeDeviceIds[0] !== "LVAD"
        || support.interpretation !== "one-unsteady-post-activation-beat"
  ) {
    throw new Error("integrated preview mechanical-support relation differs");
  }
  assertDigest(
    support.canonicalProfileSha256,
    "integrated preview MCS profile SHA-256",
  );
  assertDigest(
    support.canonicalConfigSha256,
    "integrated preview MCS config SHA-256",
  );
  assertDigest(
    value.seedRunPayloadSha256,
    "integrated preview seed payload SHA-256",
  );
  assertDigest(
    value.sourceProtocolIdentityHash,
    "integrated preview source protocol SHA-256",
  );
  assertDigest(
    value.periodicFixtureIdentitySha256,
    "integrated preview fixture identity SHA-256",
  );
}

function assertSourceSeed(
  value: unknown,
  inputSpec: unknown,
): void {
  assertExactRecordKeys(value, [
    "payloadSha256",
    "startCheckpointSha256",
    "terminalCheckpointSha256",
    "protocolIdentityHash",
    "periodicFixtureIdentitySha256",
    "numericalPeriod1Established",
  ], "integrated preview source seed");
  assertPlainRecord(inputSpec, "integrated preview simulation input spec");
  for (const [field, label] of [
    ["payloadSha256", "payload"],
    ["startCheckpointSha256", "start checkpoint"],
    ["terminalCheckpointSha256", "terminal checkpoint"],
    ["protocolIdentityHash", "protocol identity"],
    ["periodicFixtureIdentitySha256", "fixture identity"],
  ] as const) {
    assertDigest(value[field], `integrated preview source seed ${label}`);
  }
  if (
    value.numericalPeriod1Established !== true
    || value.payloadSha256 !== inputSpec.seedRunPayloadSha256
    || value.protocolIdentityHash !== inputSpec.sourceProtocolIdentityHash
    || value.periodicFixtureIdentitySha256
      !== inputSpec.periodicFixtureIdentitySha256
  ) {
    throw new Error("integrated preview source seed relation differs");
  }
}

function assertRunLedger(
  value: unknown,
): void {
  assertExactRecordKeys(value, [
    "kind",
    "execution",
    "startAcceptedTimeSec",
    "endAcceptedTimeSec",
    "acceptedStepCount",
    "trace",
    "allValuesFinite",
    "maximumTotalBloodVolumeErrorMl",
    "maximumCoronaryBloodVolumeLedgerResidualMl",
    "maximumDynamicMcsConservationResidualMlPerSec",
    "numericalPeriod1Established",
    "physiologicalAcceptanceEstablished",
    "clinicalValidationClaimed",
  ], "integrated preview run ledger");
  assertFiniteNumber(value.startAcceptedTimeSec, "run start accepted time");
  assertFiniteNumber(value.endAcceptedTimeSec, "run end accepted time");
  assertNonnegativeInteger(value.acceptedStepCount, "run accepted step count");
  if (
    value.endAcceptedTimeSec - value.startAcceptedTimeSec !== 1
    || value.acceptedStepCount < 1
    || value.acceptedStepCount > 1_100
    || !Array.isArray(value.trace)
    || value.trace.length !== value.acceptedStepCount
    || value.allValuesFinite !== true
    || value.physiologicalAcceptanceEstablished !== false
    || value.clinicalValidationClaimed !== false
  ) {
    throw new Error("integrated preview run ledger relation differs");
  }
  assertFiniteNonnegative(
    value.maximumTotalBloodVolumeErrorMl,
    "run maximum total blood-volume error",
  );
  assertFiniteNonnegative(
    value.maximumCoronaryBloodVolumeLedgerResidualMl,
    "run maximum coronary ledger residual",
  );
  assertFiniteNonnegative(
    value.maximumDynamicMcsConservationResidualMlPerSec,
    "run maximum dynamic-MCS conservation residual",
  );
  if (
    value.kind !== "bundled-p1-seed"
    && value.kind !== "one-beat-continuation"
  ) {
    throw new Error("integrated preview run kind differs");
  }
  assertExactRecordKeys(
    value.execution,
    value.kind === "bundled-p1-seed"
      ? ["operation", "continuationBeatCountFromSeed"]
      : [
        "operation",
        "requestedDurationSec",
        "continuationBeatOrdinalFromSeed",
      ],
    "integrated preview run execution",
  );
  if (value.kind === "bundled-p1-seed") {
    if (
      value.execution.operation !== "project-bundled-p1-seed"
      || value.execution.continuationBeatCountFromSeed !== 0
      || value.numericalPeriod1Established !== true
    ) {
      throw new Error("integrated preview run execution differs");
    }
  } else if (
    value.execution.operation !== "advance-one-fixed-sinus-cycle"
    || value.execution.requestedDurationSec !== 1
    || !Number.isInteger(value.execution.continuationBeatOrdinalFromSeed)
    || (value.execution.continuationBeatOrdinalFromSeed as number) < 1
    || value.numericalPeriod1Established
      !== "not-assessed-for-this-continuation"
  ) {
    throw new Error("integrated preview run execution differs");
  }
  assertTraceRelations(
    value as unknown as MainWireIntegratedPreviewRunRecordV2["run"],
  );
}

function assertTraceRelations(
  run: MainWireIntegratedPreviewRunRecordV2["run"],
): void {
  let priorAcceptedTimeSec = run.startAcceptedTimeSec;
  let traceCycleIndex: number | undefined;
  let durationSec = 0;
  let maximumTotalBloodVolumeErrorMl = 0;
  let maximumCoronaryBloodVolumeLedgerResidualMl = 0;
  let maximumDynamicMcsConservationResidualMlPerSec = 0;
  run.trace.forEach((sample, index) => {
    assertExactRecordKeys(sample, [
      "cycleIndex",
      "acceptedStepIndexWithinCycle",
      "acceptedTimeSec",
      "cyclePhase01",
      "acceptedDtSec",
      "chamberVolumeMl",
      "absolutePressureMmHg",
      "valveFlowMlPerSec",
      "pulmonaryCirculation",
      "coronary",
      "freeCalciumUMByWall",
      "dynamicMcsAcceptedFlowMlPerSec",
      "acceptedEventIdentity",
      "diagnostics",
    ], `integrated preview trace sample ${index}`);
    assertFiniteNumber(sample.acceptedTimeSec, "trace accepted time");
    assertFiniteNumber(sample.acceptedDtSec, "trace accepted dt");
    assertFiniteNumber(sample.cyclePhase01, "trace cycle phase");
    assertNonnegativeInteger(sample.cycleIndex, "trace cycle index");
    assertNonnegativeInteger(
      sample.acceptedStepIndexWithinCycle,
      "trace accepted step index",
    );
    assertTraceSamplePayload(sample, index);
    traceCycleIndex ??= sample.cycleIndex;
    if (
      sample.acceptedStepIndexWithinCycle !== index + 1
      || sample.cycleIndex !== traceCycleIndex
      || sample.acceptedTimeSec <= priorAcceptedTimeSec
      || !(sample.acceptedDtSec > 0)
      || sample.acceptedTimeSec - priorAcceptedTimeSec
        !== sample.acceptedDtSec
      || !(sample.cyclePhase01 > 0 && sample.cyclePhase01 <= 1)
      || sample.cyclePhase01
        !== sample.acceptedTimeSec - run.startAcceptedTimeSec
    ) {
      throw new Error("integrated preview trace coordinate differs");
    }
    const diagnostics = sample.diagnostics;
    maximumTotalBloodVolumeErrorMl = Math.max(
      maximumTotalBloodVolumeErrorMl,
      Math.abs(diagnostics.totalBloodVolumeErrorMl),
    );
    maximumCoronaryBloodVolumeLedgerResidualMl = Math.max(
      maximumCoronaryBloodVolumeLedgerResidualMl,
      Math.abs(diagnostics.coronaryBloodVolumeLedgerResidualMl),
    );
    maximumDynamicMcsConservationResidualMlPerSec = Math.max(
      maximumDynamicMcsConservationResidualMlPerSec,
      Math.abs(diagnostics.dynamicMcsConservationResidualMlPerSec),
    );
    durationSec += sample.acceptedDtSec;
    priorAcceptedTimeSec = sample.acceptedTimeSec;
  });
  if (
    priorAcceptedTimeSec !== run.endAcceptedTimeSec
    || traceCycleIndex !== Math.floor(run.startAcceptedTimeSec) + 1
    || Math.abs(durationSec - 1) > 1e-12
    || maximumTotalBloodVolumeErrorMl
      !== run.maximumTotalBloodVolumeErrorMl
    || maximumCoronaryBloodVolumeLedgerResidualMl
      !== run.maximumCoronaryBloodVolumeLedgerResidualMl
    || maximumDynamicMcsConservationResidualMlPerSec
      !== run.maximumDynamicMcsConservationResidualMlPerSec
  ) {
    throw new Error("integrated preview trace summary differs");
  }
}

function assertTraceSamplePayload(
  sample: MainWireIntegratedPreviewRunRecordV2["run"]["trace"][number],
  index: number,
): void {
  const label = `integrated preview trace sample ${index}`;
  assertExactFiniteNumberRecord(
    sample.chamberVolumeMl,
    ["LA", "LV", "RA", "RV"],
    `${label} chamber volume`,
  );
  assertExactFiniteNumberRecord(
    sample.absolutePressureMmHg,
    ["LA", "LV", "RA", "RV", "Ao", "PA", "PVein"],
    `${label} absolute pressure`,
  );
  assertExactFiniteNumberRecord(
    sample.valveFlowMlPerSec,
    ["MV", "AoV", "TV", "PV"],
    `${label} valve flow`,
  );
  assertExactRecordKeys(sample.pulmonaryCirculation, [
    "nodeVolumeMl",
    "absolutePressureMmHg",
    "edgeFlowMlPerSec",
  ], `${label} pulmonary circulation`);
  assertExactFiniteNumberRecord(
    sample.pulmonaryCirculation.nodeVolumeMl,
    ["PA", "PArt", "PCap", "PVen", "PVein"],
    `${label} pulmonary node volume`,
  );
  assertExactFiniteNumberRecord(
    sample.pulmonaryCirculation.absolutePressureMmHg,
    ["PA", "PArt", "PCap", "PVen", "PVein"],
    `${label} pulmonary absolute pressure`,
  );
  assertExactFiniteNumberRecord(
    sample.pulmonaryCirculation.edgeFlowMlPerSec,
    ["PV", "PA_PArt", "PArt_PCap", "PCap_PVen", "PVen_PVein", "PVein_LA"],
    `${label} pulmonary edge flow`,
  );
  assertExactFiniteNumberRecord(
    sample.coronary,
    ["totalInletFlowMlPerSec", "ladSubendocardialQmFlowMlPerSec"],
    `${label} coronary projection`,
  );
  assertExactFiniteNumberRecord(
    sample.freeCalciumUMByWall,
    ["LA", "LVFW", "SEP", "RVFW", "RA"],
    `${label} free calcium`,
  );
  assertExactFiniteNumberRecord(
    sample.dynamicMcsAcceptedFlowMlPerSec,
    ["IMPELLA", "LVAD", "VA_ECMO", "VV_ECMO"],
    `${label} dynamic-MCS flow`,
  );
  assertExactRecordKeys(sample.acceptedEventIdentity, [
    "atrialCapturedActivationId",
    "ventricularCapturedActivationId",
    "deliveredCalciumDepositIds",
    "scheduledCalciumDepositIds",
  ], `${label} accepted event identity`);
  for (const field of [
    "atrialCapturedActivationId",
    "ventricularCapturedActivationId",
  ] as const) {
    const identity = sample.acceptedEventIdentity[field];
    if (identity !== null && typeof identity !== "string") {
      throw new Error(`${label} ${field} differs`);
    }
  }
  for (const field of [
    "deliveredCalciumDepositIds",
    "scheduledCalciumDepositIds",
  ] as const) {
    const identities = sample.acceptedEventIdentity[field];
    if (
      !Array.isArray(identities)
      || identities.some((identity) => typeof identity !== "string")
    ) {
      throw new Error(`${label} ${field} differs`);
    }
  }
  assertExactFiniteNumberRecord(sample.diagnostics, [
    "mechanicsResidualNorm",
    "circulationScaledResidualInfinityNorm",
    "maximumContinuityResidualMl",
    "totalBloodVolumeErrorMl",
    "coronaryBloodVolumeLedgerResidualMl",
    "dynamicMcsConservationResidualMlPerSec",
  ], `${label} diagnostics`);
}

async function validateIntegratedCheckpointV3(
  value: unknown,
  expectedAcceptedTimeSec: number,
  boundary: "start" | "terminal",
): Promise<void> {
  const label = `integrated preview ${boundary} checkpoint`;
  assertExactRecordKeys(value, [
    "checkpointId",
    "schemaVersion",
    "transactionId",
    "revision",
    "acceptedTimeSec",
    "providerParameterIdentitySha256",
    "composedRhythmConfigurationIdentitySha256",
    "dynamicMechanicalSupportProfileIdentitySha256",
    "dynamicMechanicalSupportStructuralHydraulicIdentitySha256",
    "coronary",
    "composedRhythm",
    "dynamicMechanicalSupport",
    "exactResumeClaim",
    "checkpointSha256",
  ], label);
  if (
    value.checkpointId
      !== "circleheart.main-wire-integrated-model-composed-rhythm-checkpoint.v3"
    || value.schemaVersion !== 3
    || value.transactionId
      !== "main-wire-base-coronary-v3-dynamic-mcs-composed-rhythm-transaction-v3"
  ) {
    throw new Error(`${label} schema differs`);
  }
  assertNonnegativeInteger(value.revision, `${label} revision`);
  assertFiniteNumber(value.acceptedTimeSec, `${label} accepted time`);
  if (value.acceptedTimeSec !== expectedAcceptedTimeSec) {
    throw new Error(`${label} accepted time differs`);
  }
  for (const field of [
    "providerParameterIdentitySha256",
    "composedRhythmConfigurationIdentitySha256",
    "dynamicMechanicalSupportProfileIdentitySha256",
    "dynamicMechanicalSupportStructuralHydraulicIdentitySha256",
    "checkpointSha256",
  ] as const) {
    assertDigest(value[field], `${label} ${field}`);
  }
  assertIntegratedCheckpointClaim(value.exactResumeClaim, label);
  assertCoronaryCheckpointV3(value.coronary, value, label);
  assertComposedRhythmCheckpointV2(value.composedRhythm, value, label);
  assertDynamicMcsAcceptedStateV1(value.dynamicMechanicalSupport, label);

  const checkpoint = value as Record<string, unknown>;
  const coronary = checkpoint.coronary as Record<string, unknown>;
  const baseCoronary =
    coronary.baseCheckpointV2 as Record<string, unknown>;
  const composedRhythm =
    checkpoint.composedRhythm as Record<string, unknown>;
  const dynamicMcs =
    checkpoint.dynamicMechanicalSupport as Record<string, unknown>;
  const { checkpointSha256, ...checkpointPayload } = checkpoint;
  const {
    checkpointSha256: coronarySha256,
    ...coronaryPayload
  } = coronary;
  const {
    checkpointSha256: baseCoronarySha256,
    ...baseCoronaryPayload
  } = baseCoronary;
  const {
    checkpointSha256: composedRhythmSha256,
    ...composedRhythmPayload
  } = composedRhythm;
  const [
    expectedCheckpointSha256,
    expectedCoronarySha256,
    expectedBaseCoronarySha256,
    expectedComposedRhythmSha256,
    expectedComposedConfigurationSha256,
    expectedDynamicProfileSha256,
    expectedDynamicStructuralSha256,
    integratedClaimSha256,
    coronaryV3ClaimSha256,
    coronaryV2ClaimSha256,
    composedRhythmV2ClaimSha256,
  ] = await Promise.all([
    sha256CanonicalJsonHex(checkpointPayload),
    sha256CanonicalJsonHex(coronaryPayload),
    sha256CanonicalJsonHex(baseCoronaryPayload),
    sha256CanonicalJsonHex(composedRhythmPayload),
    sha256CanonicalJsonHex(composedRhythm.configuration),
    sha256CanonicalJsonHex(dynamicMcs.inertanceProfileSnapshot),
    sha256CanonicalJsonHex(dynamicMcs.structuralHydraulicProjection),
    sha256CanonicalJsonHex(checkpoint.exactResumeClaim),
    sha256CanonicalJsonHex(coronary.exactResumeClaim),
    sha256CanonicalJsonHex(baseCoronary.exactResumeClaim),
    sha256CanonicalJsonHex(composedRhythm.exactResumeClaim),
  ]);
  const expectedClaimSha256 =
    MAIN_WIRE_INTEGRATED_PREVIEW_BROWSER_EXPECTED_IDENTITY_V1
      .checkpointClaimSha256;
  if (
    integratedClaimSha256 !== expectedClaimSha256.integratedV3
    || coronaryV3ClaimSha256 !== expectedClaimSha256.coronaryV3
    || coronaryV2ClaimSha256 !== expectedClaimSha256.coronaryV2
    || composedRhythmV2ClaimSha256
      !== expectedClaimSha256.composedRhythmV2
  ) {
    throw new Error(`${label} trusted checkpoint claim differs`);
  }
  if (
    checkpointSha256 !== expectedCheckpointSha256
    || coronarySha256 !== expectedCoronarySha256
    || baseCoronarySha256 !== expectedBaseCoronarySha256
    || composedRhythmSha256 !== expectedComposedRhythmSha256
    || checkpoint.composedRhythmConfigurationIdentitySha256
      !== expectedComposedConfigurationSha256
    || checkpoint.dynamicMechanicalSupportProfileIdentitySha256
      !== expectedDynamicProfileSha256
    || checkpoint.dynamicMechanicalSupportStructuralHydraulicIdentitySha256
      !== expectedDynamicStructuralSha256
  ) {
    throw new Error(`${label} canonical content identity differs`);
  }
}

function assertCoronaryCheckpointV3(
  value: unknown,
  outer: Record<string, unknown>,
  label: string,
): void {
  assertExactRecordKeys(value, [
    "checkpointId",
    "schemaVersion",
    "transactionId",
    "revision",
    "acceptedTimeSec",
    "baseCheckpointV2",
    "coronaryAutoregulationBinding",
    "coronaryAutoregulation",
    "exactResumeClaim",
    "checkpointSha256",
  ], `${label} coronary`);
  if (
    value.checkpointId
      !== "circleheart.main-wire-five-wall-coronary-checkpoint.v3"
    || value.schemaVersion !== 3
    || value.transactionId !== "main-wire-five-wall-coronary-transaction-v3"
    || value.revision !== outer.revision
    || value.acceptedTimeSec !== outer.acceptedTimeSec
  ) {
    throw new Error(`${label} coronary schema or clock differs`);
  }
  assertDigest(value.checkpointSha256, `${label} coronary SHA-256`);
  assertExactRecordKeys(value.exactResumeClaim, [
    "acceptedTuple",
    "integrity",
    "autoregulationAccumulatorIncluded",
    "autoregulationAccumulator",
    "acceptedToneMode",
    "exactResumeScope",
    "legacyCheckpointV2DirectRestoreCompatible",
    "explicitV2PromotionAvailable",
  ], `${label} coronary exact-resume claim`);
  assertPlainRecord(
    value.coronaryAutoregulationBinding,
    `${label} coronary autoregulation binding`,
  );
  assertPlainRecord(
    value.coronaryAutoregulation,
    `${label} coronary autoregulation state`,
  );
  assertBaseCoronaryCheckpointV2(
    value.baseCheckpointV2,
    value,
    `${label} coronary base`,
  );
}

function assertBaseCoronaryCheckpointV2(
  value: unknown,
  outer: Record<string, unknown>,
  label: string,
): void {
  assertExactRecordKeys(value, [
    "checkpointId",
    "schemaVersion",
    "transactionId",
    "revision",
    "acceptedTimeSec",
    "fixedGlobalTotalBloodVolumeMl",
    "circulation",
    "coronary",
    "coronaryBinding",
    "mechanics",
    "mvcReferenceState",
    "exactResumeClaim",
    "checkpointSha256",
  ], label);
  if (
    value.checkpointId
      !== "circleheart.main-wire-five-wall-coronary-checkpoint.v2"
    || value.schemaVersion !== 2
    || value.transactionId !== "main-wire-five-wall-coronary-transaction-v2"
    || value.revision !== outer.revision
    || value.acceptedTimeSec !== outer.acceptedTimeSec
    || value.fixedGlobalTotalBloodVolumeMl !== 5_600
  ) {
    throw new Error(`${label} schema or clock differs`);
  }
  assertDigest(value.checkpointSha256, `${label} SHA-256`);
  assertExactRecordKeys(value.circulation, [
    "checkpointId",
    "schemaVersion",
    "state",
    "stateFingerprint",
  ], `${label} circulation`);
  assertExactRecordKeys(value.circulation.state, [
    "acceptedTimeSec",
    "dynamicEdgeFlowsMlPerSec",
    "nodeVolumesMl",
    "revision",
    "totalBloodVolumeMl",
    "transactionId",
    "valveStates",
  ], `${label} circulation state`);
  if (
    value.circulation.checkpointId
      !== "main-wire-noncoronary-circulation-checkpoint-v1"
    || value.circulation.schemaVersion !== 1
    || value.circulation.state.acceptedTimeSec !== value.acceptedTimeSec
    || value.circulation.state.revision !== value.revision
    || typeof value.circulation.stateFingerprint !== "string"
    || !/^[0-9a-f]{8}$/.test(value.circulation.stateFingerprint)
  ) {
    throw new Error(`${label} circulation relation differs`);
  }
  assertExactRecordKeys(value.coronary, [
    "acceptedState",
    "collapseHydraulicsFingerprint",
    "priorFingerprint",
    "schema",
    "topologyId",
  ], `${label} coronary state`);
  assertExactRecordKeys(value.coronary.acceptedState, [
    "acceptedTimeSec",
    "revision",
    "toneResistanceScaleByTerritoryLayer",
    "volumeMlByNode",
  ], `${label} coronary accepted state`);
  if (
    value.coronary.schema !== "circleheart.coronary-hydraulic-checkpoint.v2"
    || value.coronary.acceptedState.acceptedTimeSec !== value.acceptedTimeSec
    || value.coronary.acceptedState.revision !== value.revision
  ) {
    throw new Error(`${label} coronary accepted-state relation differs`);
  }
  assertExactRecordKeys(value.coronaryBinding, [
    "boundaryResolverId",
    "collapseHydraulicsFingerprint",
    "impMechanism",
    "mvcReferenceSemantics",
    "priorFingerprint",
    "shorteningImpPriorFingerprint",
    "topologyId",
  ], `${label} coronary binding`);
  assertExactRecordKeys(value.mechanics, [
    "acceptedTimeSec",
    "acceptedVolumesMl",
    "contractId",
    "materialState",
    "materialStateFingerprint",
    "parameterIdentityHash",
    "parameterSetId",
    "providerId",
    "revision",
    "stateSchemaVersion",
  ], `${label} mechanics`);
  if (
    value.mechanics.acceptedTimeSec !== value.acceptedTimeSec
    || value.mechanics.revision !== value.revision
  ) {
    throw new Error(`${label} mechanics clock differs`);
  }
  assertPlainRecord(value.mvcReferenceState, `${label} MVC reference state`);
  assertExactRecordKeys(value.exactResumeClaim, [
    "acceptedTuple",
    "integrity",
    "acceptedToneMode",
    "acceptedToneStateCount",
    "autoregulationAccumulatorIncluded",
    "futureAutoregulationAccumulatorRequired",
    "exactResumeScope",
    "legacyNoncoronaryCheckpointV1Compatible",
    "legacyScientificExactCheckpointV3Compatible",
    "newSchemaRequiredBeforeAcceptedToneEvolution",
  ], `${label} exact-resume claim`);
}

function assertComposedRhythmCheckpointV2(
  value: unknown,
  outer: Record<string, unknown>,
  label: string,
): void {
  assertExactRecordKeys(value, [
    "checkpointId",
    "schemaVersion",
    "stateSchemaId",
    "revision",
    "acceptedTimeSec",
    "configuration",
    "acceptedState",
    "authoredVentricularPacingReplay",
    "exactResumeClaim",
    "checkpointSha256",
  ], `${label} composed rhythm`);
  if (
    value.checkpointId
      !== "circleheart.accepted-composed-rhythm-transaction-checkpoint.v2"
    || value.schemaVersion !== 2
    || value.stateSchemaId !== "accepted-composed-rhythm-transaction-state-v2"
    || value.revision !== outer.revision
    || value.acceptedTimeSec !== outer.acceptedTimeSec
  ) {
    throw new Error(`${label} composed-rhythm schema or clock differs`);
  }
  assertDigest(value.checkpointSha256, `${label} composed-rhythm SHA-256`);
  assertExactRecordKeys(value.configuration, [
    "atrialSource",
    "authoredEctopySchedule",
    "authoredVentricularPacingReplay",
    "avGateInstanceId",
    "avGateParameters",
    "calciumParametersByWall",
    "configurationId",
    "configurationSchemaId",
    "distalGate",
    "electricalCaptureOwner",
    "ownerInstanceId",
    "pacAtrialCalciumDeposit",
    "schemaVersion",
    "sinusAtrialCalciumDeposit",
    "ventricularBackup",
    "ventricularCalciumDeposit",
    "ventricularIntervalStrength",
  ], `${label} composed-rhythm configuration`);
  assertExactRecordKeys(value.acceptedState, [
    "acceptedAtrialCaptureCount",
    "acceptedTimeSec",
    "acceptedVentricularCaptureCount",
    "authoredEctopyState",
    "authoredVentricularPacingReplayState",
    "calciumStateByWall",
    "configuration",
    "deliveredCalciumDepositCount",
    "distalGateState",
    "electricalCaptureState",
    "initialAcceptedTimeSec",
    "pendingCalciumDeposits",
    "pendingDistalVentricularImpulses",
    "pendingProximalAvOutputs",
    "proximalAvGateState",
    "regularAtrialSourceState",
    "revision",
    "schemaVersion",
    "stateSchemaId",
    "ventricularBackupState",
    "ventricularIntervalStrengthState",
  ], `${label} composed-rhythm accepted state`);
  if (
    value.acceptedState.acceptedTimeSec !== value.acceptedTimeSec
    || value.acceptedState.revision !== value.revision
    || canonicalJsonStringify(value.acceptedState.configuration)
      !== canonicalJsonStringify(value.configuration)
  ) {
    throw new Error(`${label} composed-rhythm accepted-state relation differs`);
  }
  if (
    value.authoredVentricularPacingReplay !== null
    && !isRecord(value.authoredVentricularPacingReplay)
  ) {
    throw new Error(`${label} authored pacing replay differs`);
  }
  assertExactRecordKeys(value.exactResumeClaim, [
    "exactResumeScope",
    "externalAfSourceOwnerStateStored",
    "externalAfSourceOwnerCheckpointRequiredSeparately",
    "fullConfigurationStored",
    "completeOwnedAcceptedStateStored",
    "integrity",
    "authenticationClaimed",
    "expectedConfigurationRequirement",
    "restoreResult",
    "migrationClaimed",
    "clockRebaseClaimed",
    "proximalAvGateV2Ownership",
    "proximalAvGateV2CompleteAcceptedStateStored",
    "authoredVentricularPacingReplay",
    "transactionSemantics",
  ], `${label} composed-rhythm exact-resume claim`);
}

function assertDynamicMcsAcceptedStateV1(
  value: unknown,
  label: string,
): void {
  assertExactRecordKeys(value, [
    "stateSchemaId",
    "schemaVersion",
    "networkId",
    "unitSystemId",
    "inertanceProfileSnapshot",
    "structuralHydraulicProjection",
    "acceptedFlowMlPerSec",
  ], `${label} dynamic MCS`);
  if (
    value.stateSchemaId
      !== "circleheart-dynamic-mechanical-support-accepted-flow-state-v1"
    || value.schemaVersion !== 1
    || value.networkId !== "circleheart-dynamic-mechanical-support-network-v1"
    || value.unitSystemId !== "circleheart-mmHg-mL-second-v1"
  ) {
    throw new Error(`${label} dynamic-MCS schema differs`);
  }
  assertExactFiniteNumberRecord(
    value.acceptedFlowMlPerSec,
    ["IMPELLA", "LVAD", "VA_ECMO", "VV_ECMO"],
    `${label} dynamic-MCS accepted flow`,
  );
  assertExactRecordKeys(value.inertanceProfileSnapshot, [
    "profileSchemaId",
    "schemaVersion",
    "unitSystemId",
    "profileId",
    "profileBindingSha256",
    "deviceProfileBindingByDevice",
    "inertanceByDevice",
  ], `${label} dynamic-MCS inertance profile`);
  const profile = value.inertanceProfileSnapshot;
  if (
    profile.profileSchemaId
      !== "circleheart-dynamic-mechanical-support-inertance-profile-v1"
    || profile.schemaVersion !== 1
    || profile.unitSystemId !== "circleheart-mmHg-mL-second-v1"
    || typeof profile.profileId !== "string"
    || profile.profileId.length === 0
  ) {
    throw new Error(`${label} dynamic-MCS profile schema differs`);
  }
  assertDigest(profile.profileBindingSha256, `${label} profile binding`);
  assertExactRecordKeys(
    profile.deviceProfileBindingByDevice,
    ["IMPELLA", "LVAD", "VA_ECMO", "VV_ECMO"],
    `${label} dynamic-MCS profile bindings`,
  );
  assertExactRecordKeys(
    profile.inertanceByDevice,
    ["IMPELLA", "LVAD", "VA_ECMO", "VV_ECMO"],
    `${label} dynamic-MCS inertances`,
  );
  for (const deviceId of [
    "IMPELLA",
    "LVAD",
    "VA_ECMO",
    "VV_ECMO",
  ] as const) {
    const binding = profile.deviceProfileBindingByDevice[deviceId];
    assertExactRecordKeys(binding, [
      "bindingSchemaId",
      "schemaVersion",
      "deviceId",
      "circuitProfileId",
      "circuitProfileBindingSha256",
    ], `${label} ${deviceId} profile binding`);
    if (
      binding.bindingSchemaId
        !== "circleheart-dynamic-mechanical-support-device-profile-binding-v1"
      || binding.schemaVersion !== 1
      || binding.deviceId !== deviceId
      || typeof binding.circuitProfileId !== "string"
      || binding.circuitProfileId.length === 0
    ) {
      throw new Error(`${label} ${deviceId} profile binding differs`);
    }
    assertDigest(
      binding.circuitProfileBindingSha256,
      `${label} ${deviceId} profile binding SHA-256`,
    );
    const inertance = profile.inertanceByDevice[deviceId];
    assertExactRecordKeys(inertance, [
      "drainageMmHgSec2PerMl",
      "oxygenatorMmHgSec2PerMl",
      "pumpInternalMmHgSec2PerMl",
      "returnPathMmHgSec2PerMl",
      "unitSystemId",
    ], `${label} ${deviceId} inertance`);
    for (const field of [
      "drainageMmHgSec2PerMl",
      "oxygenatorMmHgSec2PerMl",
      "pumpInternalMmHgSec2PerMl",
      "returnPathMmHgSec2PerMl",
    ] as const) {
      assertFiniteNonnegative(
        inertance[field],
        `${label} ${deviceId} ${field}`,
      );
    }
    if (inertance.unitSystemId !== "circleheart-mmHg-mL-second-v1") {
      throw new Error(`${label} ${deviceId} inertance units differ`);
    }
  }
  assertExactRecordKeys(value.structuralHydraulicProjection, [
    "projectionSchemaId",
    "schemaVersion",
    "modelId",
    "byDevice",
  ], `${label} dynamic-MCS structural projection`);
  const projection = value.structuralHydraulicProjection;
  if (
    projection.projectionSchemaId
      !== "circleheart-dynamic-mechanical-support-structural-hydraulic-projection-v1"
    || projection.schemaVersion !== 1
    || projection.modelId !== "circleheart-mechanical-circulatory-support-v1"
  ) {
    throw new Error(`${label} dynamic-MCS structural schema differs`);
  }
  assertExactRecordKeys(
    projection.byDevice,
    ["IMPELLA", "LVAD", "VA_ECMO", "VV_ECMO"],
    `${label} dynamic-MCS structural devices`,
  );
  for (const deviceId of [
    "IMPELLA",
    "LVAD",
    "VA_ECMO",
    "VV_ECMO",
  ] as const) {
    const device = projection.byDevice[deviceId];
    assertExactRecordKeys(device, [
      "deviceId",
      "inletNode",
      "outletNode",
      "curve",
      "drainage",
      "oxygenator",
      "returnPath",
      "inletSuction",
      "maximumForwardFlowLMin",
      "maximumReverseFlowLMin",
      "forwardFlowEvidenceDomain",
      "vaCannulation",
      "vvCannulation",
      "vvHemodynamicCoupling",
    ], `${label} ${deviceId} structural hydraulics`);
    if (
      device.deviceId !== deviceId
      || typeof device.inletNode !== "string"
      || typeof device.outletNode !== "string"
      || !isRecord(device.curve)
      || !isRecord(device.drainage)
      || !isRecord(device.oxygenator)
      || !isRecord(device.returnPath)
      || !isRecord(device.inletSuction)
      || !isRecord(device.forwardFlowEvidenceDomain)
      || (
        device.maximumForwardFlowLMin !== null
        && (
          typeof device.maximumForwardFlowLMin !== "number"
          || !Number.isFinite(device.maximumForwardFlowLMin)
        )
      )
      || typeof device.maximumReverseFlowLMin !== "number"
      || !Number.isFinite(device.maximumReverseFlowLMin)
    ) {
      throw new Error(`${label} ${deviceId} structural hydraulics differ`);
    }
  }
}

function assertIntegratedCheckpointClaim(
  value: unknown,
  label: string,
): void {
  assertExactRecordKeys(value, [
    "acceptedTuple",
    "integrity",
    "nestedIntegrity",
    "providerParameterIdentity",
    "composedRhythmConfigurationIdentity",
    "dynamicMechanicalSupportProfileIdentity",
    "dynamicMechanicalSupportStructuralHydraulicIdentity",
    "exactResumeScope",
    "ownerClock",
    "calciumOwnership",
    "externalAfSeam",
    "proximalAvGateV2CompleteAcceptedStateStoredInComposedCheckpoint",
    "dynamicMechanicalSupportStateStored",
    "providerStored",
    "exactRestoreRequiresExpectedProvider",
    "exactRestoreRequiresExpectedComposedRhythmConfiguration",
    "exactRestoreRequiresExpectedDynamicInertanceProfile",
    "exactRestoreRequiresExpectedDynamicStructuralHydraulicConfig",
    "externalSessionMustOwnDeviceConfigAndControllerCommand",
    "releaseBlockers",
    "migrationClaimed",
    "clockRebaseClaimed",
    "longTermPhysiologicalValidationEstablished",
    "clinicalValidationClaimed",
    "simulationReady",
  ], `${label} exact-resume claim`);
  assertExactRecordKeys(value.nestedIntegrity, [
    "coronary",
    "composedRhythm",
    "dynamicMechanicalSupport",
  ], `${label} nested-integrity claim`);
  assertExactRecordKeys(value.calciumOwnership, [
    "soleAcceptedOwner",
    "fiveExactEventCalciumStatesStored",
    "legacyFixedPeriodicOwnerStored",
    "generatedPeriodicOwnerStored",
  ], `${label} calcium-ownership claim`);
  assertExactRecordKeys(value.externalAfSeam, [
    "typedSourceModeConfigurationStored",
    "externalAfOwnerStateStored",
    "externalAfOwnerCheckpointRequiredSeparately",
    "afWrapperIntegrated",
  ], `${label} external-AF claim`);
  assertExactRecordKeys(value.releaseBlockers, [
    "afOwnerWrapperAndJointCheckpoint",
    "iabpAcceptedVentricularSynchronization",
  ], `${label} release-blocker claim`);
}

function assertReplayCompleteness(
  value: unknown,
  run: MainWireIntegratedPreviewRunRecordV2["run"],
): void {
  assertExactRecordKeys(value, [
    "stateTransitionInputIdentitiesIncluded",
    "exactStartCheckpointIncluded",
    "exactTerminalCheckpointIncluded",
    "executableBuildProvenanceAttached",
    "standaloneReplayCompleteArtifactClaimed",
    "promotionEligibility",
    "upgradePath",
  ], "integrated preview replay completeness");
  const promotionEligible =
    run.kind === "bundled-p1-seed"
    || (
      run.execution.operation === "advance-one-fixed-sinus-cycle"
      && run.execution.continuationBeatOrdinalFromSeed === 1
    );
  if (
    value.stateTransitionInputIdentitiesIncluded !== true
    || value.exactStartCheckpointIncluded !== true
    || value.exactTerminalCheckpointIncluded !== true
    || value.executableBuildProvenanceAttached !== false
    || value.standaloneReplayCompleteArtifactClaimed !== false
    || value.promotionEligibility !== (
      promotionEligible
        ? "eligible-with-current-runtime-exact-replay"
        : "blocked-missing-complete-seed-lineage"
    )
    || value.upgradePath !== (
      promotionEligible
        ? "createMainWireIntegratedPreviewRunArtifactV1-with-external-BuildArtifactRefV1"
        : null
    )
  ) {
    throw new Error("integrated preview replay-completeness claim differs");
  }
}

function assertExactFiniteNumberRecord(
  value: unknown,
  expectedKeys: readonly string[],
  label: string,
): asserts value is Readonly<Record<string, number>> {
  assertExactRecordKeys(value, expectedKeys, label);
  for (const key of expectedKeys) {
    assertFiniteNumber(value[key], `${label}.${key}`);
  }
}

function assertExactRecordKeys(
  value: unknown,
  expectedKeys: readonly string[],
  label: string,
): asserts value is Record<string, unknown> {
  assertPlainRecord(value, label);
  if (!hasExactKeys(value, expectedKeys)) {
    throw new Error(`${label} keys differ`);
  }
}

function assertPlainRecord(
  value: unknown,
  label: string,
): asserts value is Record<string, unknown> {
  if (!isRecord(value)) throw new Error(`${label} must be an object`);
}

function assertReleaseRef(
  value: unknown,
  label: string,
): asserts value is Readonly<{ id: string; version: string; sha256: string }> {
  assertExactRecordKeys(value, ["id", "version", "sha256"], label);
  if (
    typeof value.id !== "string"
    || value.id.length === 0
    || typeof value.version !== "string"
    || value.version.length === 0
  ) {
    throw new Error(`${label} is invalid`);
  }
  assertDigest(value.sha256, `${label} SHA-256`);
}

function assertDigest(value: unknown, label: string): asserts value is string {
  if (!isSha256(value)) throw new Error(`${label} is invalid`);
}

function assertFiniteNumber(
  value: unknown,
  label: string,
): asserts value is number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${label} must be finite`);
  }
}

function assertFiniteNonnegative(
  value: unknown,
  label: string,
): asserts value is number {
  assertFiniteNumber(value, label);
  if (value < 0) throw new Error(`${label} must be nonnegative`);
}

function assertNonnegativeInteger(
  value: unknown,
  label: string,
): asserts value is number {
  if (!Number.isInteger(value) || (value as number) < 0) {
    throw new Error(`${label} must be a nonnegative integer`);
  }
}

function isResponse(
  value: unknown,
): value is IntegratedPreviewCommandResponseV1 {
  if (!isRecord(value)
    || value.protocolId !== INTEGRATED_PREVIEW_COMMAND_PROTOCOL_V1_ID
    || typeof value.ok !== "boolean") return false;
  if (value.ok === true) {
    return hasExactKeys(value, [
      "protocolId",
      "ok",
      "requestId",
      "sessionId",
      "commandKind",
      "releaseRef",
      "runRecord",
      "presentation",
      "disposed",
    ])
      && typeof value.requestId === "string"
      && typeof value.sessionId === "string"
      && isCommandKind(value.commandKind)
      && isReleaseRef(value.releaseRef)
      && isSuccessPayloadPair(
        value.commandKind,
        value.releaseRef,
        value.runRecord,
        value.presentation,
        value.disposed,
      );
  }
  return hasExactKeys(value, [
    "protocolId",
    "ok",
    "requestId",
    "sessionId",
    "commandKind",
    "releaseRef",
    "error",
  ])
    && (typeof value.requestId === "string" || value.requestId === null)
    && (typeof value.sessionId === "string" || value.sessionId === null)
    && (isCommandKind(value.commandKind) || value.commandKind === null)
    && (isReleaseRef(value.releaseRef) || value.releaseRef === null)
    && isErrorPayload(value.error);
}

function isSuccessPayloadPair(
  commandKind: IntegratedPreviewCommandV1["kind"],
  releaseRef: Readonly<{ id: string; version: string; sha256: string }>,
  runRecord: unknown,
  presentation: unknown,
  disposed: unknown,
): boolean {
  if (commandKind === "disposeSession") {
    return disposed === true && runRecord === null && presentation === null;
  }
  if (
    disposed !== false
    || !isRecord(runRecord)
    || !isRecord(presentation)
    || !hasExactKeys(runRecord, [
      "artifactId",
      "schemaVersion",
      "releaseRef",
      "simulationInputSpec",
      "simulationInputSpecSha256",
      "sourceSeed",
      "run",
      "startModelState",
      "terminalModelState",
      "replayCompleteness",
      "recordSha256",
    ])
    || !hasExactKeys(presentation, [
      "artifactId",
      "schemaVersion",
      "recordSha256",
      "releaseRef",
      "simulationInputSpec",
      "simulationInputSpecSha256",
      "sourceSeed",
      "run",
      "trace",
      "startModelStateRef",
      "terminalModelStateRef",
    ])
  ) return false;
  return runRecord.artifactId
      === "circleheart-main-wire-integrated-preview-run-record-v2"
    && runRecord.schemaVersion === 2
    && presentation.artifactId === runRecord.artifactId
    && presentation.schemaVersion === runRecord.schemaVersion
    && isSha256(runRecord.recordSha256)
    && presentation.recordSha256 === runRecord.recordSha256
    && isSha256(runRecord.simulationInputSpecSha256)
    && presentation.simulationInputSpecSha256
      === runRecord.simulationInputSpecSha256
    && sameReleaseRef(runRecord.releaseRef, releaseRef)
    && sameReleaseRef(presentation.releaseRef, releaseRef)
    && isRecord(runRecord.simulationInputSpec)
    && isRecord(presentation.simulationInputSpec)
    && isRecord(runRecord.sourceSeed)
    && isRecord(presentation.sourceSeed)
    && isRecord(runRecord.run)
    && Array.isArray(runRecord.run.trace)
    && isRecord(presentation.run)
    && Array.isArray(presentation.trace)
    && isRecord(runRecord.startModelState)
    && isRecord(runRecord.terminalModelState)
    && isRecord(runRecord.replayCompleteness)
    && hasExactKeys(runRecord.replayCompleteness, [
      "stateTransitionInputIdentitiesIncluded",
      "exactStartCheckpointIncluded",
      "exactTerminalCheckpointIncluded",
      "executableBuildProvenanceAttached",
      "standaloneReplayCompleteArtifactClaimed",
      "promotionEligibility",
      "upgradePath",
    ])
    && runRecord.replayCompleteness
      .stateTransitionInputIdentitiesIncluded === true
    && runRecord.replayCompleteness.exactStartCheckpointIncluded === true
    && runRecord.replayCompleteness.exactTerminalCheckpointIncluded === true
    && runRecord.replayCompleteness.executableBuildProvenanceAttached === false
    && runRecord.replayCompleteness
      .standaloneReplayCompleteArtifactClaimed === false
    && (
      runRecord.replayCompleteness.promotionEligibility
        === "eligible-with-current-runtime-exact-replay"
      || runRecord.replayCompleteness.promotionEligibility
        === "blocked-missing-complete-seed-lineage"
    )
    && (
      runRecord.replayCompleteness.upgradePath
        === "createMainWireIntegratedPreviewRunArtifactV1-with-external-BuildArtifactRefV1"
      || runRecord.replayCompleteness.upgradePath === null
    )
    && isRecord(presentation.startModelStateRef)
    && isRecord(presentation.terminalModelStateRef)
    && sameCheckpointProjection(
      runRecord.startModelState,
      presentation.startModelStateRef,
    )
    && sameCheckpointProjection(
      runRecord.terminalModelState,
      presentation.terminalModelStateRef,
    )
    && typeof runRecord.run.startAcceptedTimeSec === "number"
    && runRecord.run.startAcceptedTimeSec
      === runRecord.startModelState.acceptedTimeSec
    && typeof runRecord.run.endAcceptedTimeSec === "number"
    && runRecord.run.endAcceptedTimeSec
      === runRecord.terminalModelState.acceptedTimeSec;
}

function sameCheckpointProjection(
  checkpoint: Record<string, unknown>,
  projection: Record<string, unknown>,
): boolean {
  return hasExactKeys(projection, [
    "checkpointId",
    "schemaVersion",
    "checkpointSha256",
    "acceptedTimeSec",
    "revision",
  ])
    && checkpoint.checkpointId === projection.checkpointId
    && checkpoint.schemaVersion === projection.schemaVersion
    && checkpoint.checkpointSha256 === projection.checkpointSha256
    && checkpoint.acceptedTimeSec === projection.acceptedTimeSec
    && checkpoint.revision === projection.revision
    && isSha256(projection.checkpointSha256);
}

function isErrorPayload(value: unknown): boolean {
  return isRecord(value)
    && hasExactKeys(value, ["code", "message"])
    && (
      value.code === "invalid-command"
      || value.code === "duplicate-session-id"
      || value.code === "unknown-session-id"
      || value.code === "session-capacity-exceeded"
      || value.code === "command-failed"
    )
    && typeof value.message === "string";
}

function isReleaseRef(
  value: unknown,
): value is Readonly<{ id: string; version: string; sha256: string }> {
  return isRecord(value)
    && hasExactKeys(value, ["id", "version", "sha256"])
    && typeof value.id === "string"
    && value.id.length > 0
    && typeof value.version === "string"
    && value.version.length > 0
    && isSha256(value.sha256);
}

function sameReleaseRef(
  value: unknown,
  expected: Readonly<{ id: string; version: string; sha256: string }>,
): boolean {
  return isReleaseRef(value)
    && value.id === expected.id
    && value.version === expected.version
    && value.sha256 === expected.sha256;
}

function isCommandKind(
  value: unknown,
): value is IntegratedPreviewCommandV1["kind"] {
  return value === "createSession"
    || value === "runNextBeat"
    || value === "disposeSession";
}

function isSha256(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{64}$/.test(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasExactKeys(
  value: Record<string, unknown>,
  expected: readonly string[],
): boolean {
  return Object.keys(value).length === expected.length
    && expected.every((key) =>
      Object.prototype.hasOwnProperty.call(value, key));
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
