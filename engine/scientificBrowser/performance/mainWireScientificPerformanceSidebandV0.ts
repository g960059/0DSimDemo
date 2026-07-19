import type {
  ScientificCommandKindV1,
} from "@/engine/scientific/worker/scientificCommandProtocolV1";
import {
  SCIENTIFIC_COMMAND_KINDS_V1,
  SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
} from "@/engine/scientific/worker/scientificCommandProtocolV1";

export const MAIN_WIRE_SCIENTIFIC_PERFORMANCE_SIDEBAND_V0_ID =
  "circleheart-scientific-performance-sideband-v0" as const;

export type MainWireScientificPerformanceSidebandConnectV0 = Readonly<{
  protocolId: typeof MAIN_WIRE_SCIENTIFIC_PERFORMANCE_SIDEBAND_V0_ID;
  kind: "connect-performance-sideband";
}>;

export type MainWireScientificPerformanceSidebandMessageV0 =
  | Readonly<{
    protocolId: typeof MAIN_WIRE_SCIENTIFIC_PERFORMANCE_SIDEBAND_V0_ID;
    kind: "worker-protocol-ready";
    workerNowMs: number;
  }>
  | Readonly<{
    protocolId: typeof MAIN_WIRE_SCIENTIFIC_PERFORMANCE_SIDEBAND_V0_ID;
    kind: "worker-command-timing";
    requestId: string;
    commandKind: ScientificCommandKindV1;
    receivedAtWorkerMs: number;
    kernelStartedAtWorkerMs: number;
    kernelSettledAtWorkerMs: number;
    scientificResponsePostStartedAtWorkerMs: number;
    scientificResponsePostReturnedAtWorkerMs: number;
  }>;

export const MAIN_WIRE_SCIENTIFIC_PERFORMANCE_SIDEBAND_CONNECT_V0 =
  Object.freeze({
    protocolId: MAIN_WIRE_SCIENTIFIC_PERFORMANCE_SIDEBAND_V0_ID,
    kind: "connect-performance-sideband" as const,
  });

/**
 * The performance sideband is an opt-in host probe. It is deliberately not a
 * scientific command and never contributes bytes to a scientific response,
 * checkpoint, observable frame, Case, or Run document.
 */
export function isMainWireScientificPerformanceSidebandConnectV0(
  value: unknown,
): value is MainWireScientificPerformanceSidebandConnectV0 {
  if (!isRecord(value)) return false;
  const keys = Object.keys(value).sort();
  return keys.length === 2
    && keys[0] === "kind"
    && keys[1] === "protocolId"
    && value.protocolId === MAIN_WIRE_SCIENTIFIC_PERFORMANCE_SIDEBAND_V0_ID
    && value.kind === "connect-performance-sideband";
}

export function scientificCommandIdentityForPerformanceSidebandV0(
  value: unknown,
): Readonly<{
  requestId: string;
  commandKind: ScientificCommandKindV1;
}> | null {
  if (!isRecord(value)) return null;
  if (value.protocolId !== SCIENTIFIC_COMMAND_PROTOCOL_V1_ID) return null;
  if (typeof value.requestId !== "string" || value.requestId.length === 0) {
    return null;
  }
  if (!isScientificCommandKindV1(value.kind)) return null;
  return Object.freeze({
    requestId: value.requestId,
    commandKind: value.kind,
  });
}

function isScientificCommandKindV1(
  value: unknown,
): value is ScientificCommandKindV1 {
  return typeof value === "string"
    && (SCIENTIFIC_COMMAND_KINDS_V1 as readonly string[]).includes(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
