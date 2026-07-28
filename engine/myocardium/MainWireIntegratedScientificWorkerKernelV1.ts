import {
  createIntegratedV3LaneDescriptorV1,
  type StudioLaneDescriptorV1,
} from "@/engine/myocardium/MainWireIntegratedLaneIdentityV1";
import {
  loadMainWireIntegratedLaneDevelopmentIdentityV1,
} from "@/engine/myocardium/MainWireIntegratedLaneDevelopmentIdentityArtifactV1";
import {
  projectMainWireIntegratedLaneObservationV1,
} from "@/engine/myocardium/MainWireIntegratedLaneObservableRegistryV1";
import {
  INTEGRATED_LANE_MAX_SUBSTEPS_PER_INTERVAL_V1,
  MainWireIntegratedScientificSession,
  integratedLanePresentationTargetTimeSecV1,
  type MainWireIntegratedLanePresentationAdvanceV1,
} from "@/engine/myocardium/MainWireIntegratedScientificSession";
import {
  MAIN_WIRE_INTEGRATED_SCIENTIFIC_WORKER_COMMAND_KINDS_V1,
  MAIN_WIRE_INTEGRATED_SCIENTIFIC_WORKER_PROTOCOL_V1_ID,
  type MainWireIntegratedScientificWorkerAdvancePayloadV1,
  type MainWireIntegratedScientificWorkerCommandKindV1,
  type MainWireIntegratedScientificWorkerCommandV1,
  type MainWireIntegratedScientificWorkerErrorCodeV1,
  type MainWireIntegratedScientificWorkerErrorResponseV1,
  type MainWireIntegratedScientificWorkerResponseV1,
  type MainWireIntegratedScientificWorkerSessionSnapshotV1,
  type MainWireIntegratedScientificWorkerSuccessPayloadByKindV1,
  type MainWireIntegratedScientificWorkerSuccessResponseForKindV1,
} from "@/engine/myocardium/MainWireIntegratedScientificWorkerProtocolV1";

export const MAIN_WIRE_INTEGRATED_SCIENTIFIC_WORKER_KERNEL_V1_ID =
  "main-wire-integrated-scientific-worker-kernel-v1" as const;

export const MAIN_WIRE_INTEGRATED_SCIENTIFIC_WORKER_KERNEL_CLAIM_V1 =
  Object.freeze({
    hostNeutral: true as const,
    transportOwnedHere: false as const,
    workerOwnedFixedPresetOnly: true as const,
    presentationOrdinalCommandOnly: true as const,
    controlsAvailable: false as const,
    periodicSettlementAvailable: false as const,
    sideAnalysesAvailable: false as const,
    exactExportAvailable: false as const,
    operationalCheckpointInternalOnly: true as const,
    boundedCommandPayload: true as const,
    boundedCommandQueue: true as const,
    boundedSessionOwnership: true as const,
    requestReplayRejected: true as const,
    retiredSessionIdReuseRejected: true as const,
    commandSubmissionOrderSerialized: true as const,
    silentFallbackApplied: false as const,
  });

export type MainWireIntegratedScientificWorkerKernelOptionsV1 = Readonly<{
  maximumSessionCount?: number;
  maximumQueuedCommandCount?: number;
  maximumRequestCountPerKernelLifetime?: number;
  maximumSessionIdentityCountPerKernelLifetime?: number;
  maximumCommandJsonBytes?: number;
  maximumCommandJsonNodeCount?: number;
  maximumPresentationOrdinalCountPerAdvanceCommand?: number;
}>;

type HostedSession = {
  session: MainWireIntegratedScientificSession;
  lastPresentationOrdinal: number | null;
};

type PartialIdentity = Readonly<{
  requestId: string | null;
  sessionId: string | null;
  commandKind: MainWireIntegratedScientificWorkerCommandKindV1 | null;
}>;

type ParsedCommand =
  | Readonly<{
    ok: true;
    command: MainWireIntegratedScientificWorkerCommandV1;
  }>
  | Readonly<{
    ok: false;
    identity: PartialIdentity;
    message: string;
  }>;

const DEFAULT_MAXIMUM_SESSION_COUNT = 4;
const DEFAULT_MAXIMUM_QUEUED_COMMAND_COUNT = 8;
const DEFAULT_MAXIMUM_REQUEST_COUNT = 8_192;
const DEFAULT_MAXIMUM_SESSION_IDENTITY_COUNT = 256;
const DEFAULT_MAXIMUM_COMMAND_JSON_BYTES = 2 * 1024 * 1024;
const DEFAULT_MAXIMUM_COMMAND_JSON_NODE_COUNT = 200_000;
const MAXIMUM_CONFIGURED_SESSION_COUNT = 64;
const MAXIMUM_CONFIGURED_QUEUED_COMMAND_COUNT = 64;
const MAXIMUM_CONFIGURED_REQUEST_COUNT = 100_000;
const MAXIMUM_CONFIGURED_SESSION_IDENTITY_COUNT = 4_096;
const MAXIMUM_CONFIGURED_COMMAND_JSON_BYTES = 16 * 1024 * 1024;
const MAXIMUM_CONFIGURED_COMMAND_JSON_NODE_COUNT = 1_000_000;
const MAXIMUM_CONFIGURED_PRESENTATION_ORDINAL_COUNT_PER_ADVANCE_COMMAND = 16;
const RESERVED_RECOVERY_REQUEST_COUNT = 2;
const IDENTIFIER_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;

export class MainWireIntegratedScientificWorkerKernelV1 {
  readonly kernelId = MAIN_WIRE_INTEGRATED_SCIENTIFIC_WORKER_KERNEL_V1_ID;
  readonly claim =
    MAIN_WIRE_INTEGRATED_SCIENTIFIC_WORKER_KERNEL_CLAIM_V1;
  readonly maximumSessionCount: number;
  readonly maximumQueuedCommandCount: number;
  readonly maximumRequestCountPerKernelLifetime: number;
  readonly maximumSessionIdentityCountPerKernelLifetime: number;
  readonly maximumCommandJsonBytes: number;
  readonly maximumCommandJsonNodeCount: number;
  readonly maximumPresentationOrdinalCountPerAdvanceCommand: number;

  private readonly sessions = new Map<string, HostedSession>();
  private readonly allocatedSessionIds = new Set<string>();
  private readonly seenRequestIds = new Set<string>();
  private readonly laneDescriptor: Promise<StudioLaneDescriptorV1>;
  private queuedCommandCount = 0;
  private commandTail: Promise<void> = Promise.resolve();

  constructor(
    options: MainWireIntegratedScientificWorkerKernelOptionsV1 = {},
  ) {
    this.maximumSessionCount = boundedPositiveInteger(
      options.maximumSessionCount ?? DEFAULT_MAXIMUM_SESSION_COUNT,
      MAXIMUM_CONFIGURED_SESSION_COUNT,
      "maximumSessionCount",
    );
    this.maximumQueuedCommandCount = boundedPositiveInteger(
      options.maximumQueuedCommandCount ?? DEFAULT_MAXIMUM_QUEUED_COMMAND_COUNT,
      MAXIMUM_CONFIGURED_QUEUED_COMMAND_COUNT,
      "maximumQueuedCommandCount",
    );
    this.maximumRequestCountPerKernelLifetime = boundedPositiveInteger(
      options.maximumRequestCountPerKernelLifetime
        ?? DEFAULT_MAXIMUM_REQUEST_COUNT,
      MAXIMUM_CONFIGURED_REQUEST_COUNT,
      "maximumRequestCountPerKernelLifetime",
    );
    this.maximumSessionIdentityCountPerKernelLifetime = boundedPositiveInteger(
      options.maximumSessionIdentityCountPerKernelLifetime
        ?? DEFAULT_MAXIMUM_SESSION_IDENTITY_COUNT,
      MAXIMUM_CONFIGURED_SESSION_IDENTITY_COUNT,
      "maximumSessionIdentityCountPerKernelLifetime",
    );
    this.maximumCommandJsonBytes = boundedPositiveInteger(
      options.maximumCommandJsonBytes ?? DEFAULT_MAXIMUM_COMMAND_JSON_BYTES,
      MAXIMUM_CONFIGURED_COMMAND_JSON_BYTES,
      "maximumCommandJsonBytes",
    );
    this.maximumCommandJsonNodeCount = boundedPositiveInteger(
      options.maximumCommandJsonNodeCount
        ?? DEFAULT_MAXIMUM_COMMAND_JSON_NODE_COUNT,
      MAXIMUM_CONFIGURED_COMMAND_JSON_NODE_COUNT,
      "maximumCommandJsonNodeCount",
    );
    this.maximumPresentationOrdinalCountPerAdvanceCommand =
      boundedPositiveInteger(
        options.maximumPresentationOrdinalCountPerAdvanceCommand
          ?? MAXIMUM_CONFIGURED_PRESENTATION_ORDINAL_COUNT_PER_ADVANCE_COMMAND,
        MAXIMUM_CONFIGURED_PRESENTATION_ORDINAL_COUNT_PER_ADVANCE_COMMAND,
        "maximumPresentationOrdinalCountPerAdvanceCommand",
      );
    if (
      INTEGRATED_LANE_MAX_SUBSTEPS_PER_INTERVAL_V1
        !== 16
    ) {
      throw new Error(
        "integrated Worker/session substep limits no longer agree",
      );
    }
    this.laneDescriptor = loadLaneDescriptorV1();
  }

  activeSessionCount(): number {
    return this.sessions.size;
  }

  handle(
    untrustedCommand: unknown,
  ): Promise<MainWireIntegratedScientificWorkerResponseV1> {
    let captured: unknown;
    try {
      captured = captureBoundedJsonValueV1(
        untrustedCommand,
        this.maximumCommandJsonBytes,
        this.maximumCommandJsonNodeCount,
      );
    } catch (error) {
      return Promise.resolve(errorResponseV1(
        partialIdentityV1(untrustedCommand),
        "invalid-command",
        errorMessageV1(error),
      ));
    }

    const parsed = parseCommandV1(captured);
    if (parsed.ok === false) {
      return Promise.resolve(errorResponseV1(
        parsed.identity,
        "invalid-command",
        parsed.message,
      ));
    }
    const command = parsed.command;
    if (this.seenRequestIds.has(command.requestId)) {
      return Promise.resolve(errorResponseV1(
        identityForCommandV1(command),
        "duplicate-request-id",
        `requestId ${command.requestId} was already submitted`,
      ));
    }
    const usedRequestCount = this.seenRequestIds.size;
    const recoveryCommand =
      command.kind === "getOperationalCheckpoint"
      || command.kind === "disposeSession";
    if (
      usedRequestCount >= this.maximumRequestCountPerKernelLifetime
      && (
        !recoveryCommand
        || usedRequestCount
          >= this.maximumRequestCountPerKernelLifetime
            + RESERVED_RECOVERY_REQUEST_COUNT
      )
    ) {
      return Promise.resolve(errorResponseV1(
        identityForCommandV1(command),
        "request-capacity-exceeded",
        "integrated Worker request capacity is exhausted",
      ));
    }
    if (this.queuedCommandCount >= this.maximumQueuedCommandCount) {
      return Promise.resolve(errorResponseV1(
        identityForCommandV1(command),
        "command-queue-capacity-exceeded",
        "integrated Worker command queue capacity is exhausted",
      ));
    }

    this.seenRequestIds.add(command.requestId);
    this.queuedCommandCount += 1;
    return new Promise((resolve) => {
      const run = async () => {
        try {
          resolve(await this.dispatch(command));
        } catch (error) {
          resolve(errorResponseV1(
            identityForCommandV1(command),
            "command-failed",
            errorMessageV1(error),
          ));
        } finally {
          this.queuedCommandCount -= 1;
        }
      };
      this.commandTail = this.commandTail.then(run, run);
    });
  }

  private async dispatch(
    command: MainWireIntegratedScientificWorkerCommandV1,
  ): Promise<MainWireIntegratedScientificWorkerResponseV1> {
    switch (command.kind) {
      case "createWorkerOwnedPresetSession":
        return this.create(command);
      case "observe":
        return this.observe(command);
      case "advanceToPresentationOrdinal":
        return this.advance(command);
      case "getOperationalCheckpoint":
        return this.checkpoint(command);
      case "restoreOperationalCheckpoint":
        return this.restore(command);
      case "disposeSession":
        return this.dispose(command);
    }
  }

  private async create(
    command: Extract<
      MainWireIntegratedScientificWorkerCommandV1,
      { kind: "createWorkerOwnedPresetSession" }
    >,
  ): Promise<MainWireIntegratedScientificWorkerResponseV1> {
    const allocationError = this.sessionAllocationError(command.sessionId);
    if (allocationError !== null) {
      return errorResponseV1(
        identityForCommandV1(command),
        allocationError.code,
        allocationError.message,
      );
    }
    this.allocatedSessionIds.add(command.sessionId);
    try {
      const session = await MainWireIntegratedScientificSession.create();
      const hosted = {
        session,
        lastPresentationOrdinal: 0,
      } satisfies HostedSession;
      this.sessions.set(command.sessionId, hosted);
      return successResponseV1(
        command,
        await this.laneDescriptor,
        Object.freeze({
          kind: "worker-owned-preset-session-created" as const,
          session: snapshotV1(hosted),
        }),
      );
    } catch (error) {
      return errorResponseV1(
        identityForCommandV1(command),
        "session-creation-failed",
        errorMessageV1(error),
      );
    }
  }

  private async observe(
    command: Extract<
      MainWireIntegratedScientificWorkerCommandV1,
      { kind: "observe" }
    >,
  ): Promise<MainWireIntegratedScientificWorkerResponseV1> {
    const hosted = this.sessions.get(command.sessionId);
    if (hosted === undefined) return this.unknownSession(command);
    return successResponseV1(
      command,
      await this.laneDescriptor,
      Object.freeze({
        kind: "observation" as const,
        session: snapshotV1(hosted),
      }),
    );
  }

  private async advance(
    command: Extract<
      MainWireIntegratedScientificWorkerCommandV1,
      { kind: "advanceToPresentationOrdinal" }
    >,
  ): Promise<MainWireIntegratedScientificWorkerResponseV1> {
    const hosted = this.sessions.get(command.sessionId);
    if (hosted === undefined) return this.unknownSession(command);
    if (command.presentationOrdinalCount !== undefined) {
      return this.advanceBatch(
        command as typeof command & Readonly<{
          presentationOrdinalCount: number;
        }>,
        hosted,
      );
    }
    if (!isAdmissiblePresentationOrdinalV1(
      hosted,
      command.presentationOrdinal,
    )) {
      return errorResponseV1(
        identityForCommandV1(command),
        "presentation-ordinal-mismatch",
        "presentation ordinal must identify the current target or the next unrepresented grid target",
        await this.laneDescriptor,
      );
    }

    const advanced = advanceOnePresentationOrdinalV1(
      hosted,
      command.presentationOrdinal,
    );
    if (advanced.ok === false) {
      return errorResponseV1(
        identityForCommandV1(command),
        advanced.code,
        advanced.message,
        await this.laneDescriptor,
        advanced.partialProgress,
      );
    }
    return successResponseV1(
      command,
      await this.laneDescriptor,
      advanced.payload,
    );
  }

  private async advanceBatch(
    command: Extract<
      MainWireIntegratedScientificWorkerCommandV1,
      { kind: "advanceToPresentationOrdinal" }
    > & Readonly<{ presentationOrdinalCount: number }>,
    hosted: HostedSession,
  ): Promise<MainWireIntegratedScientificWorkerResponseV1> {
    const count = command.presentationOrdinalCount;
    const lastPresentationOrdinal =
      command.presentationOrdinal + count - 1;
    if (
      count > this.maximumPresentationOrdinalCountPerAdvanceCommand
      || !Number.isSafeInteger(lastPresentationOrdinal)
      || !isNextPresentationOrdinalV1(
        hosted,
        command.presentationOrdinal,
      )
    ) {
      return errorResponseV1(
        identityForCommandV1(command),
        count > this.maximumPresentationOrdinalCountPerAdvanceCommand
          ? "invalid-command"
          : "presentation-ordinal-mismatch",
        count > this.maximumPresentationOrdinalCountPerAdvanceCommand
          ? `presentationOrdinalCount exceeds the V3 bound of ${this.maximumPresentationOrdinalCountPerAdvanceCommand}`
          : "batch must begin at the next unrepresented presentation ordinal",
        await this.laneDescriptor,
      );
    }

    const completedAdvances:
      MainWireIntegratedScientificWorkerAdvancePayloadV1[] = [];
    for (let offset = 0; offset < count; offset += 1) {
      const presentationOrdinal = command.presentationOrdinal + offset;
      const advanced = advanceOnePresentationOrdinalV1(
        hosted,
        presentationOrdinal,
      );
      if (advanced.ok === false) {
        if (advanced.code === "presentation-ordinal-mismatch") {
          return errorResponseV1(
            identityForCommandV1(command),
            advanced.code,
            advanced.message,
            await this.laneDescriptor,
          );
        }
        const failure = advanced.result;
        return errorResponseV1(
          identityForCommandV1(command),
          "simulation-step-failed",
          advanced.message,
          await this.laneDescriptor,
          Object.freeze({
            kind:
              "presentation-advance-batch-partial-progress" as const,
            firstPresentationOrdinal: command.presentationOrdinal,
            requestedPresentationOrdinalCount: count,
            completedAdvances: Object.freeze([...completedAdvances]),
            failedPresentationOrdinal: presentationOrdinal,
            failedPresentationTimeSec:
              integratedLanePresentationTargetTimeSecV1(
                presentationOrdinal,
              ),
            acceptedRevision: failure.acceptedRevision,
            acceptedTimeSec: failure.acceptedTimeSec,
            lastPresentationOrdinal: hosted.lastPresentationOrdinal,
            failedOrdinalPartiallyAdvanced:
              failure.partiallyAdvanced,
            failedOrdinalInternalAcceptedSubstepCount:
              failure.internalAcceptedSubstepCount,
            failedOrdinalBoundaryClippedSubstepCount:
              failure.boundaryClippedSubstepCount ?? 0,
            failedOrdinalSubsteps:
              failure.substeps ?? Object.freeze([]),
            failureReason: failure.reason,
          }),
        );
      }
      if (advanced.payload.status !== "advanced") {
        return errorResponseV1(
          identityForCommandV1(command),
          "presentation-ordinal-mismatch",
          "batch encountered an already represented presentation ordinal",
          await this.laneDescriptor,
        );
      }
      completedAdvances.push(advanced.payload);
    }

    const finalAdvance = completedAdvances.at(-1);
    if (finalAdvance === undefined) {
      throw new Error("integrated advance batch completed no ordinals");
    }
    return successResponseV1(
      command,
      await this.laneDescriptor,
      Object.freeze({
        kind: "presentation-advance-batch" as const,
        status: "advanced" as const,
        presentationOrdinal: finalAdvance.presentationOrdinal,
        presentationTimeSec: finalAdvance.presentationTimeSec,
        acceptedRevision: finalAdvance.acceptedRevision,
        acceptedTimeSec: finalAdvance.acceptedTimeSec,
        acceptedRevisionSpanFromPrevious:
          finalAdvance.acceptedRevisionSpanFromPrevious,
        internalAcceptedSubstepCount:
          finalAdvance.internalAcceptedSubstepCount,
        boundaryClippedSubstepCount:
          finalAdvance.boundaryClippedSubstepCount,
        substeps: finalAdvance.substeps,
        emittedPresentationSample: true as const,
        observableFrame: finalAdvance.observableFrame,
        firstPresentationOrdinal: command.presentationOrdinal,
        lastPresentationOrdinal,
        requestedPresentationOrdinalCount: count,
        advances: Object.freeze([...completedAdvances]),
      }),
    );
  }

  private async checkpoint(
    command: Extract<
      MainWireIntegratedScientificWorkerCommandV1,
      { kind: "getOperationalCheckpoint" }
    >,
  ): Promise<MainWireIntegratedScientificWorkerResponseV1> {
    const hosted = this.sessions.get(command.sessionId);
    if (hosted === undefined) return this.unknownSession(command);
    try {
      const checkpoint = await hosted.session.checkpointOperational();
      return successResponseV1(
        command,
        await this.laneDescriptor,
        Object.freeze({
          kind: "operational-checkpoint" as const,
          checkpoint,
          session: snapshotV1(hosted),
        }),
      );
    } catch (error) {
      return errorResponseV1(
        identityForCommandV1(command),
        "checkpoint-failed",
        errorMessageV1(error),
        await this.laneDescriptor,
      );
    }
  }

  private async restore(
    command: Extract<
      MainWireIntegratedScientificWorkerCommandV1,
      { kind: "restoreOperationalCheckpoint" }
    >,
  ): Promise<MainWireIntegratedScientificWorkerResponseV1> {
    const allocationError = this.sessionAllocationError(command.sessionId);
    if (allocationError !== null) {
      return errorResponseV1(
        identityForCommandV1(command),
        allocationError.code,
        allocationError.message,
      );
    }
    this.allocatedSessionIds.add(command.sessionId);
    try {
      const session =
        await MainWireIntegratedScientificSession
          .restoreOperationalCheckpoint(command.checkpoint);
      const hosted = {
        session,
        lastPresentationOrdinal: exactPresentationOrdinalV1(
          session.currentAcceptedState().acceptedTimeSec,
        ),
      } satisfies HostedSession;
      this.sessions.set(command.sessionId, hosted);
      return successResponseV1(
        command,
        await this.laneDescriptor,
        Object.freeze({
          kind: "operational-checkpoint-session-restored" as const,
          session: snapshotV1(hosted),
        }),
      );
    } catch (error) {
      return errorResponseV1(
        identityForCommandV1(command),
        "operational-restore-rejected",
        errorMessageV1(error),
      );
    }
  }

  private async dispose(
    command: Extract<
      MainWireIntegratedScientificWorkerCommandV1,
      { kind: "disposeSession" }
    >,
  ): Promise<MainWireIntegratedScientificWorkerResponseV1> {
    if (!this.sessions.delete(command.sessionId)) {
      return this.unknownSession(command);
    }
    return successResponseV1(
      command,
      await this.laneDescriptor,
      Object.freeze({
        kind: "session-disposed" as const,
        disposedSessionId: command.sessionId,
      }),
    );
  }

  private unknownSession(
    command: MainWireIntegratedScientificWorkerCommandV1,
  ): MainWireIntegratedScientificWorkerErrorResponseV1 {
    return errorResponseV1(
      identityForCommandV1(command),
      "unknown-session-id",
      `sessionId ${command.sessionId} is not active`,
    );
  }

  private sessionAllocationError(
    sessionId: string,
  ): Readonly<{
    code:
      | "duplicate-session-id"
      | "retired-session-id"
      | "session-capacity-exceeded";
    message: string;
  }> | null {
    if (this.sessions.has(sessionId)) {
      return Object.freeze({
        code: "duplicate-session-id" as const,
        message: `sessionId ${sessionId} is already active`,
      });
    }
    if (this.allocatedSessionIds.has(sessionId)) {
      return Object.freeze({
        code: "retired-session-id" as const,
        message: `sessionId ${sessionId} was already allocated`,
      });
    }
    if (this.sessions.size >= this.maximumSessionCount) {
      return Object.freeze({
        code: "session-capacity-exceeded" as const,
        message: "integrated Worker session capacity is exhausted",
      });
    }
    if (
      this.allocatedSessionIds.size
        >= this.maximumSessionIdentityCountPerKernelLifetime
    ) {
      return Object.freeze({
        code: "session-capacity-exceeded" as const,
        message: "integrated Worker session identity capacity is exhausted",
      });
    }
    return null;
  }
}

type AdvanceOnePresentationOrdinalResultV1 =
  | Readonly<{
    ok: true;
    payload: MainWireIntegratedScientificWorkerAdvancePayloadV1;
  }>
  | Readonly<{
    ok: false;
    code: "presentation-ordinal-mismatch";
    message: string;
    partialProgress: null;
  }>
  | Readonly<{
    ok: false;
    code: "simulation-step-failed";
    message: string;
    partialProgress: NonNullable<
      MainWireIntegratedScientificWorkerErrorResponseV1["error"][
        "partialProgress"
      ]
    >;
    result: Extract<
      MainWireIntegratedLanePresentationAdvanceV1,
      { status: "failed" }
    >;
  }>;

function advanceOnePresentationOrdinalV1(
  hosted: HostedSession,
  presentationOrdinal: number,
): AdvanceOnePresentationOrdinalResultV1 {
  // The target is deliberately re-derived from the ordinal on every
  // iteration. A batch must never accumulate a running floating-point time.
  const targetTimeSec = integratedLanePresentationTargetTimeSecV1(
    presentationOrdinal,
  );
  let result: MainWireIntegratedLanePresentationAdvanceV1;
  try {
    result = hosted.session.advanceToPresentationTime(targetTimeSec);
  } catch (error) {
    return Object.freeze({
      ok: false as const,
      code: "presentation-ordinal-mismatch" as const,
      message: errorMessageV1(error),
      partialProgress: null,
    });
  }
  if (result.status === "failed") {
    return Object.freeze({
      ok: false as const,
      code: "simulation-step-failed" as const,
      message: result.message,
      result,
      partialProgress: Object.freeze({
        kind: "presentation-advance-partial-progress" as const,
        requestedPresentationOrdinal: presentationOrdinal,
        requestedPresentationTimeSec: targetTimeSec,
        acceptedRevision: result.acceptedRevision,
        acceptedTimeSec: result.acceptedTimeSec,
        lastPresentationOrdinal: hosted.lastPresentationOrdinal,
        partiallyAdvanced: result.partiallyAdvanced,
        internalAcceptedSubstepCount:
          result.internalAcceptedSubstepCount,
        emittedPresentationSample: false as const,
        observableFrame: null,
        failureReason: result.reason,
      }),
    });
  }

  const alreadyAtTarget = result.status === "already-at-target";
  if (!alreadyAtTarget) {
    hosted.lastPresentationOrdinal = presentationOrdinal;
  }
  const observableFrame =
    projectMainWireIntegratedLaneObservationV1(result.observation);
  return Object.freeze({
    ok: true as const,
    payload: Object.freeze({
      kind: "presentation-advance" as const,
      status: result.status,
      presentationOrdinal,
      presentationTimeSec: result.presentationTimeSec,
      acceptedRevision: result.acceptedRevision,
      acceptedTimeSec: result.acceptedTimeSec,
      acceptedRevisionSpanFromPrevious: result.status
        === "already-at-target"
        ? 0
        : result.acceptedRevisionSpanFromPrevious,
      internalAcceptedSubstepCount:
        result.internalAcceptedSubstepCount,
      boundaryClippedSubstepCount: result.status
        === "already-at-target"
        ? 0
        : result.boundaryClippedSubstepCount,
      substeps: result.status === "already-at-target"
        ? Object.freeze([])
        : result.substeps,
      emittedPresentationSample: !alreadyAtTarget,
      observableFrame,
    }),
  });
}

async function loadLaneDescriptorV1(): Promise<StudioLaneDescriptorV1> {
  const identity =
    await loadMainWireIntegratedLaneDevelopmentIdentityV1();
  const sha256 = identity.manifest.observableSchema.sha256;
  if (typeof sha256 !== "string") {
    throw new Error(
      "integrated lane development identity lacks an observable catalog SHA-256",
    );
  }
  return createIntegratedV3LaneDescriptorV1(identity.ref, sha256);
}

function snapshotV1(
  hosted: HostedSession,
): MainWireIntegratedScientificWorkerSessionSnapshotV1 {
  const acceptedState = hosted.session.currentAcceptedState();
  const retained = hosted.session.observe();
  const observation = retained.acceptedState === acceptedState
    ? retained
    : Object.freeze({
      source: "operational-checkpoint-restore" as const,
      acceptedState,
      lastAcceptedStep: null,
    });
  return Object.freeze({
    presentationOrdinal: exactPresentationOrdinalV1(
      acceptedState.acceptedTimeSec,
    ),
    acceptedRevision: acceptedState.revision,
    acceptedTimeSec: acceptedState.acceptedTimeSec,
    observableFrame:
      projectMainWireIntegratedLaneObservationV1(observation),
  });
}

function exactPresentationOrdinalV1(timeSec: number): number | null {
  const candidate = Math.round(timeSec / 0.002);
  return Number.isSafeInteger(candidate)
    && candidate >= 0
    && integratedLanePresentationTargetTimeSecV1(candidate) === timeSec
    ? candidate
    : null;
}

function isAdmissiblePresentationOrdinalV1(
  hosted: HostedSession,
  ordinal: number,
): boolean {
  if (!Number.isSafeInteger(ordinal) || ordinal < 0) return false;
  const acceptedTimeSec =
    hosted.session.currentAcceptedState().acceptedTimeSec;
  const acceptedOrdinal = exactPresentationOrdinalV1(acceptedTimeSec);
  if (acceptedOrdinal !== null) {
    return ordinal === acceptedOrdinal || ordinal === acceptedOrdinal + 1;
  }
  let nextOrdinal = Math.floor(acceptedTimeSec / 0.002) + 1;
  while (
    integratedLanePresentationTargetTimeSecV1(nextOrdinal)
      <= acceptedTimeSec
  ) {
    nextOrdinal += 1;
  }
  return ordinal === nextOrdinal;
}

function isNextPresentationOrdinalV1(
  hosted: HostedSession,
  ordinal: number,
): boolean {
  if (!Number.isSafeInteger(ordinal) || ordinal < 1) return false;
  const acceptedTimeSec =
    hosted.session.currentAcceptedState().acceptedTimeSec;
  const acceptedOrdinal = exactPresentationOrdinalV1(acceptedTimeSec);
  if (acceptedOrdinal !== null) return ordinal === acceptedOrdinal + 1;
  let nextOrdinal = Math.floor(acceptedTimeSec / 0.002) + 1;
  while (
    integratedLanePresentationTargetTimeSecV1(nextOrdinal)
      <= acceptedTimeSec
  ) {
    nextOrdinal += 1;
  }
  return ordinal === nextOrdinal;
}

function successResponseV1<
  TKind extends MainWireIntegratedScientificWorkerCommandKindV1,
>(
  command: Extract<
    MainWireIntegratedScientificWorkerCommandV1,
    { kind: TKind }
  >,
  laneDescriptor: StudioLaneDescriptorV1,
  payload: MainWireIntegratedScientificWorkerSuccessPayloadByKindV1[TKind],
): MainWireIntegratedScientificWorkerSuccessResponseForKindV1<TKind> {
  return Object.freeze({
    protocolId: MAIN_WIRE_INTEGRATED_SCIENTIFIC_WORKER_PROTOCOL_V1_ID,
    ok: true as const,
    requestId: command.requestId,
    sessionId: command.sessionId,
    commandKind: command.kind,
    laneDescriptor,
    payload,
    error: null,
  });
}

function errorResponseV1(
  identity: PartialIdentity,
  code: MainWireIntegratedScientificWorkerErrorCodeV1,
  message: string,
  laneDescriptor: StudioLaneDescriptorV1 | null = null,
  partialProgress:
    MainWireIntegratedScientificWorkerErrorResponseV1["error"][
      "partialProgress"
    ] = null,
): MainWireIntegratedScientificWorkerErrorResponseV1 {
  return Object.freeze({
    protocolId: MAIN_WIRE_INTEGRATED_SCIENTIFIC_WORKER_PROTOCOL_V1_ID,
    ok: false as const,
    ...identity,
    laneDescriptor,
    payload: null,
    error: Object.freeze({
      code,
      message,
      retryable: false as const,
      silentFallbackApplied: false as const,
      partialProgress,
    }),
  });
}

function parseCommandV1(value: unknown): ParsedCommand {
  const identity = partialIdentityV1(value);
  if (!isRecordV1(value)) {
    return invalidParseV1(identity, "command must be an object");
  }
  if (
    value.protocolId
      !== MAIN_WIRE_INTEGRATED_SCIENTIFIC_WORKER_PROTOCOL_V1_ID
  ) {
    return invalidParseV1(identity, "command protocolId is unsupported");
  }
  if (!isIdentifierV1(value.requestId)) {
    return invalidParseV1(identity, "command requestId is invalid");
  }
  if (!isIdentifierV1(value.sessionId)) {
    return invalidParseV1(identity, "command sessionId is invalid");
  }
  if (!isCommandKindV1(value.kind)) {
    return invalidParseV1(identity, "command kind is unsupported");
  }
  const commonKeys = ["protocolId", "kind", "requestId", "sessionId"];
  const expectedKeys = value.kind === "advanceToPresentationOrdinal"
    ? (
      "presentationOrdinalCount" in value
        ? [
          ...commonKeys,
          "presentationOrdinal",
          "presentationOrdinalCount",
        ]
        : [...commonKeys, "presentationOrdinal"]
    )
    : value.kind === "restoreOperationalCheckpoint"
      ? [...commonKeys, "checkpoint"]
      : commonKeys;
  if (!hasExactKeysV1(value, expectedKeys)) {
    return invalidParseV1(
      identity,
      `command ${value.kind} fields do not match its protocol schema`,
    );
  }
  if (
    value.kind === "advanceToPresentationOrdinal"
    && (
      !Number.isSafeInteger(value.presentationOrdinal)
      || (value.presentationOrdinal as number) < 0
    )
  ) {
    return invalidParseV1(
      identity,
      "presentationOrdinal must be a non-negative safe integer",
    );
  }
  if (
    value.kind === "advanceToPresentationOrdinal"
    && "presentationOrdinalCount" in value
    && (
      !Number.isSafeInteger(value.presentationOrdinalCount)
      || (value.presentationOrdinalCount as number) < 1
    )
  ) {
    return invalidParseV1(
      identity,
      "presentationOrdinalCount must be a positive safe integer",
    );
  }
  return Object.freeze({
    ok: true as const,
    command: value as MainWireIntegratedScientificWorkerCommandV1,
  });
}

function partialIdentityV1(value: unknown): PartialIdentity {
  if (!isRecordV1(value)) {
    return Object.freeze({
      requestId: null,
      sessionId: null,
      commandKind: null,
    });
  }
  return Object.freeze({
    requestId: isIdentifierV1(value.requestId) ? value.requestId : null,
    sessionId: isIdentifierV1(value.sessionId) ? value.sessionId : null,
    commandKind: isCommandKindV1(value.kind) ? value.kind : null,
  });
}

function identityForCommandV1(
  command: MainWireIntegratedScientificWorkerCommandV1,
): PartialIdentity {
  return Object.freeze({
    requestId: command.requestId,
    sessionId: command.sessionId,
    commandKind: command.kind,
  });
}

function invalidParseV1(
  identity: PartialIdentity,
  message: string,
): ParsedCommand {
  return Object.freeze({ ok: false as const, identity, message });
}

function captureBoundedJsonValueV1(
  value: unknown,
  maximumBytes: number,
  maximumNodeCount: number,
): unknown {
  let cloned: unknown;
  try {
    cloned = structuredClone(value);
  } catch {
    throw new Error("command is not structured-cloneable");
  }
  const stack = [cloned];
  const visited = new Set<object>();
  let nodeCount = 0;
  while (stack.length > 0) {
    const current = stack.pop();
    nodeCount += 1;
    if (nodeCount > maximumNodeCount) {
      throw new Error("command JSON node capacity is exceeded");
    }
    if (
      current === null
      || typeof current === "string"
      || typeof current === "boolean"
    ) continue;
    if (typeof current === "number") {
      if (!Number.isFinite(current)) {
        throw new Error("command contains a non-finite number");
      }
      continue;
    }
    if (typeof current !== "object") {
      throw new Error("command contains a non-JSON value");
    }
    if (visited.has(current)) continue;
    visited.add(current);
    if (Array.isArray(current)) {
      for (const item of current) stack.push(item);
      continue;
    }
    const prototype = Object.getPrototypeOf(current);
    if (prototype !== Object.prototype && prototype !== null) {
      throw new Error("command contains a non-plain object");
    }
    for (const item of Object.values(current)) stack.push(item);
  }
  let json: string;
  try {
    json = JSON.stringify(cloned);
  } catch {
    throw new Error("command contains a cyclic object");
  }
  if (new TextEncoder().encode(json).byteLength > maximumBytes) {
    throw new Error("command JSON byte capacity is exceeded");
  }
  return deepFreezeJsonV1(cloned);
}

function deepFreezeJsonV1<T>(value: T): T {
  if (value === null || typeof value !== "object" || Object.isFrozen(value)) {
    return value;
  }
  for (const child of Object.values(value)) deepFreezeJsonV1(child);
  return Object.freeze(value);
}

function isRecordV1(
  value: unknown,
): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isIdentifierV1(value: unknown): value is string {
  return typeof value === "string" && IDENTIFIER_PATTERN.test(value);
}

function isCommandKindV1(
  value: unknown,
): value is MainWireIntegratedScientificWorkerCommandKindV1 {
  return MAIN_WIRE_INTEGRATED_SCIENTIFIC_WORKER_COMMAND_KINDS_V1.includes(
    value as MainWireIntegratedScientificWorkerCommandKindV1,
  );
}

function hasExactKeysV1(
  value: Record<string, unknown>,
  keys: readonly string[],
): boolean {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return actual.length === expected.length
    && actual.every((key, index) => key === expected[index]);
}

function boundedPositiveInteger(
  value: number,
  maximum: number,
  label: string,
): number {
  if (!Number.isSafeInteger(value) || value < 1 || value > maximum) {
    throw new Error(`${label} must be an integer from 1 through ${maximum}`);
  }
  return value;
}

function errorMessageV1(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
