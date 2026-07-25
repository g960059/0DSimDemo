import {
  MAIN_WIRE_INTEGRATED_PREVIEW_MCS_PRESET_IDS_V1,
  MainWireIntegratedPreviewSessionV1,
  projectMainWireIntegratedPreviewRunV2,
} from "@/engine/scientific/integratedPreview";
import type {
  SimulationReleaseRef,
} from "@/engine/scientific/release";
import {
  INTEGRATED_PREVIEW_COMMAND_PROTOCOL_V1_ID,
  type IntegratedPreviewCommandResponseV1,
  type IntegratedPreviewCommandV1,
} from "@/engine/scientific/worker/integratedPreviewCommandProtocolV1";

export const MAIN_WIRE_INTEGRATED_PREVIEW_WORKER_KERNEL_V1_ID =
  "circleheart-main-wire-integrated-preview-worker-kernel-v1" as const;

const IDENTIFIER_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;

export class MainWireIntegratedPreviewWorkerKernelV1 {
  readonly kernelId = MAIN_WIRE_INTEGRATED_PREVIEW_WORKER_KERNEL_V1_ID;
  readonly maximumSessionCount: number;
  private readonly sessions =
    new Map<string, MainWireIntegratedPreviewSessionV1>();
  private commandTail: Promise<void> = Promise.resolve();

  constructor(maximumSessionCount = 2) {
    if (
      !Number.isSafeInteger(maximumSessionCount)
      || maximumSessionCount < 1
      || maximumSessionCount > 8
    ) throw new RangeError("integrated preview session capacity is invalid");
    this.maximumSessionCount = maximumSessionCount;
  }

  handle(command: unknown): Promise<IntegratedPreviewCommandResponseV1> {
    const operation = this.commandTail.then(() => this.dispatch(command));
    this.commandTail = operation.then(
      () => undefined,
      () => undefined,
    );
    return operation;
  }

  private async dispatch(
    input: unknown,
  ): Promise<IntegratedPreviewCommandResponseV1> {
    const parsed = parseCommand(input);
    if (parsed.ok === false) {
      return errorResponse(
        parsed.requestId,
        parsed.sessionId,
        parsed.commandKind,
        null,
        "invalid-command",
        parsed.message,
      );
    }
    const command = parsed.command;
    const existing = this.sessions.get(command.sessionId);
    try {
      switch (command.kind) {
        case "createSession": {
          if (existing !== undefined) {
            return errorResponse(
              command.requestId,
              command.sessionId,
              command.kind,
              existing.releaseRef,
              "duplicate-session-id",
              "integrated preview session id is already active",
            );
          }
          if (this.sessions.size >= this.maximumSessionCount) {
            return errorResponse(
              command.requestId,
              command.sessionId,
              command.kind,
              null,
              "session-capacity-exceeded",
              "integrated preview session capacity is exhausted",
            );
          }
          const session = await MainWireIntegratedPreviewSessionV1.create(
            command.mcsPresetId,
          );
          const runRecord = command.mcsPresetId === "all-off"
            ? await session.seedRunRecord()
            : await session.runNextBeatRecord();
          this.sessions.set(command.sessionId, session);
          return successResponse(
            command,
            session.releaseRef,
            runRecord,
            projectMainWireIntegratedPreviewRunV2(runRecord),
            false,
          );
        }
        case "runNextBeat": {
          if (existing === undefined) {
            return errorResponse(
              command.requestId,
              command.sessionId,
              command.kind,
              null,
              "unknown-session-id",
              "integrated preview session id is not active",
            );
          }
          const runRecord = await existing.runNextBeatRecord();
          return successResponse(
            command,
            existing.releaseRef,
            runRecord,
            projectMainWireIntegratedPreviewRunV2(runRecord),
            false,
          );
        }
        case "disposeSession": {
          if (existing === undefined) {
            return errorResponse(
              command.requestId,
              command.sessionId,
              command.kind,
              null,
              "unknown-session-id",
              "integrated preview session id is not active",
            );
          }
          this.sessions.delete(command.sessionId);
          return successResponse(
            command,
            existing.releaseRef,
            null,
            null,
            true,
          );
        }
      }
    } catch (error) {
      return errorResponse(
        command.requestId,
        command.sessionId,
        command.kind,
        existing?.releaseRef ?? null,
        "command-failed",
        error instanceof Error ? error.message : String(error),
      );
    }
  }
}

type ParseResult =
  | Readonly<{ ok: true; command: IntegratedPreviewCommandV1 }>
  | Readonly<{
    ok: false;
    requestId: string | null;
    sessionId: string | null;
    commandKind: IntegratedPreviewCommandV1["kind"] | null;
    message: string;
  }>;

function parseCommand(input: unknown): ParseResult {
  if (!isRecord(input)) {
    return invalid(null, null, null, "command must be an object");
  }
  const requestId = validIdentifier(input.requestId) ? input.requestId : null;
  const sessionId = validIdentifier(input.sessionId) ? input.sessionId : null;
  const commandKind =
    input.kind === "createSession"
      || input.kind === "runNextBeat"
      || input.kind === "disposeSession"
      ? input.kind
      : null;
  if (
    input.protocolId !== INTEGRATED_PREVIEW_COMMAND_PROTOCOL_V1_ID
    || requestId === null
    || sessionId === null
    || commandKind === null
  ) return invalid(
    requestId,
    sessionId,
    commandKind,
    "command identity or protocol is invalid",
  );
  const expectedKeys = commandKind === "createSession"
    ? ["kind", "mcsPresetId", "protocolId", "requestId", "sessionId"]
    : ["kind", "protocolId", "requestId", "sessionId"];
  if (Object.keys(input).sort().join(",") !== expectedKeys.sort().join(",")) {
    return invalid(
      requestId,
      sessionId,
      commandKind,
      "command fields are not exact",
    );
  }
  if (commandKind === "createSession") {
    if (
      typeof input.mcsPresetId !== "string"
      || !MAIN_WIRE_INTEGRATED_PREVIEW_MCS_PRESET_IDS_V1.includes(
        input.mcsPresetId as never,
      )
    ) return invalid(
      requestId,
      sessionId,
      commandKind,
      "MCS preset is not allowlisted",
    );
    return {
      ok: true,
      command: input as unknown as IntegratedPreviewCommandV1,
    };
  }
  return {
    ok: true,
    command: input as unknown as IntegratedPreviewCommandV1,
  };
}

function validIdentifier(value: unknown): value is string {
  return typeof value === "string" && IDENTIFIER_PATTERN.test(value);
}

function invalid(
  requestId: string | null,
  sessionId: string | null,
  commandKind: IntegratedPreviewCommandV1["kind"] | null,
  message: string,
): ParseResult {
  return Object.freeze({
    ok: false as const,
    requestId,
    sessionId,
    commandKind,
    message,
  });
}

function successResponse(
  command: IntegratedPreviewCommandV1,
  releaseRef: SimulationReleaseRef,
  runRecord:
    import("@/engine/scientific/integratedPreview")
      .MainWireIntegratedPreviewRunRecordV2 | null,
  presentation:
    import("@/engine/scientific/integratedPreview")
      .MainWireIntegratedPreviewRunPresentationV2 | null,
  disposed: boolean,
): IntegratedPreviewCommandResponseV1 {
  return Object.freeze({
    protocolId: INTEGRATED_PREVIEW_COMMAND_PROTOCOL_V1_ID,
    ok: true as const,
    requestId: command.requestId,
    sessionId: command.sessionId,
    commandKind: command.kind,
    releaseRef,
    runRecord,
    presentation,
    disposed,
  });
}

function errorResponse(
  requestId: string | null,
  sessionId: string | null,
  commandKind: IntegratedPreviewCommandV1["kind"] | null,
  releaseRef: SimulationReleaseRef | null,
  code: Extract<
    IntegratedPreviewCommandResponseV1,
    { ok: false }
  >["error"]["code"],
  message: string,
): IntegratedPreviewCommandResponseV1 {
  return Object.freeze({
    protocolId: INTEGRATED_PREVIEW_COMMAND_PROTOCOL_V1_ID,
    ok: false as const,
    requestId,
    sessionId,
    commandKind,
    releaseRef,
    error: Object.freeze({ code, message }),
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
