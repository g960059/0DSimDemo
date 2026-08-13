import {
  MainWireFlatReferenceKernelV1,
  createMainWireFlatReferenceOutputPlanV1,
  openMainWireFlatReferencePresentationPageV1,
  type MainWireFlatReferenceAdvanceResultV1,
} from "@/engine/vnext/MainWireFlatReferenceKernelV1";

export const MAIN_WIRE_FLAT_REFERENCE_WORKER_COMMAND_V1_SCHEMA_ID =
  "circleheart-main-wire-flat-reference-worker-command-v1" as const;
export const MAIN_WIRE_FLAT_REFERENCE_WORKER_RESULT_V1_SCHEMA_ID =
  "circleheart-main-wire-flat-reference-worker-result-v1" as const;

export type MainWireFlatReferenceWorkerCommandV1 = Readonly<{
  schemaId: typeof MAIN_WIRE_FLAT_REFERENCE_WORKER_COMMAND_V1_SCHEMA_ID;
  kind: "advance";
  requestId: string;
  targetTick: number;
  capacity: number;
  outputIds: readonly string[];
  destinationBuffer: ArrayBuffer;
}>;

export type MainWireFlatReferenceWorkerResultV1 = Readonly<{
  schemaId: typeof MAIN_WIRE_FLAT_REFERENCE_WORKER_RESULT_V1_SCHEMA_ID;
  kind: "advanced";
  requestId: string;
  capacity: number;
  outputIds: readonly string[];
  advance: MainWireFlatReferenceAdvanceResultV1;
  destinationBuffer: ArrayBuffer;
}>;

/**
 * Non-production executable protocol seam. A real dedicated Worker can own
 * this runtime without changing the command/page contract.
 */
export class MainWireFlatReferenceWorkerRuntimeV1 {
  readonly #kernel: MainWireFlatReferenceKernelV1;

  private constructor(kernel: MainWireFlatReferenceKernelV1) {
    this.#kernel = kernel;
  }

  static async create(): Promise<MainWireFlatReferenceWorkerRuntimeV1> {
    return new MainWireFlatReferenceWorkerRuntimeV1(
      await MainWireFlatReferenceKernelV1.create(),
    );
  }

  execute(commandValue: unknown): MainWireFlatReferenceWorkerResultV1 {
    const command = validateCommand(commandValue);
    const plan = createMainWireFlatReferenceOutputPlanV1(command.outputIds);
    const page = openMainWireFlatReferencePresentationPageV1(
      command.destinationBuffer,
      command.capacity,
      plan,
    );
    const advance = this.#kernel.advanceTo(command.targetTick, plan, page);
    return Object.freeze({
      schemaId: MAIN_WIRE_FLAT_REFERENCE_WORKER_RESULT_V1_SCHEMA_ID,
      kind: "advanced" as const,
      requestId: command.requestId,
      capacity: command.capacity,
      outputIds: plan.outputIds,
      advance,
      destinationBuffer: page.buffer,
    });
  }
}

export function createMainWireFlatReferenceWorkerCommandV1(input: Readonly<{
  requestId: string;
  targetTick: number;
  capacity: number;
  outputIds: readonly string[];
  destinationBuffer: ArrayBuffer;
}>): MainWireFlatReferenceWorkerCommandV1 {
  return validateCommand({
    schemaId: MAIN_WIRE_FLAT_REFERENCE_WORKER_COMMAND_V1_SCHEMA_ID,
    kind: "advance",
    ...input,
  });
}

export function mainWireFlatReferenceWorkerCommandTransferV1(
  command: MainWireFlatReferenceWorkerCommandV1,
): Transferable[] {
  return [command.destinationBuffer];
}

export function mainWireFlatReferenceWorkerResultTransferV1(
  result: MainWireFlatReferenceWorkerResultV1,
): Transferable[] {
  return [result.destinationBuffer];
}

function validateCommand(value: unknown): MainWireFlatReferenceWorkerCommandV1 {
  const record = exactRecord(value, [
    "schemaId",
    "kind",
    "requestId",
    "targetTick",
    "capacity",
    "outputIds",
    "destinationBuffer",
  ]);
  if (record.schemaId !== MAIN_WIRE_FLAT_REFERENCE_WORKER_COMMAND_V1_SCHEMA_ID) {
    throw new Error("Flat reference Worker command schemaId is invalid");
  }
  if (record.kind !== "advance") {
    throw new Error("Flat reference Worker command kind is invalid");
  }
  if (typeof record.requestId !== "string" || record.requestId.trim().length === 0) {
    throw new Error("Flat reference Worker requestId is invalid");
  }
  if (!Number.isSafeInteger(record.targetTick) || (record.targetTick as number) < 1) {
    throw new Error("Flat reference Worker targetTick is invalid");
  }
  if (!Number.isSafeInteger(record.capacity) || (record.capacity as number) < 1) {
    throw new Error("Flat reference Worker capacity is invalid");
  }
  if (
    !Array.isArray(record.outputIds)
    || record.outputIds.some((outputId) => typeof outputId !== "string")
  ) {
    throw new Error("Flat reference Worker outputIds are invalid");
  }
  if (!(record.destinationBuffer instanceof ArrayBuffer)) {
    throw new Error("Flat reference Worker destinationBuffer is invalid");
  }
  return Object.freeze({
    schemaId: MAIN_WIRE_FLAT_REFERENCE_WORKER_COMMAND_V1_SCHEMA_ID,
    kind: "advance" as const,
    requestId: record.requestId,
    targetTick: record.targetTick as number,
    capacity: record.capacity as number,
    outputIds: Object.freeze([...(record.outputIds as string[])]),
    destinationBuffer: record.destinationBuffer,
  });
}

function exactRecord(
  value: unknown,
  keys: readonly string[],
): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Flat reference Worker command must be a record");
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    throw new Error("Flat reference Worker command prototype is invalid");
  }
  if (Object.getOwnPropertySymbols(value).length !== 0) {
    throw new Error("Flat reference Worker command has symbol keys");
  }
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  if (
    actual.length !== expected.length
    || actual.some((key, index) => key !== expected[index])
  ) {
    throw new Error("Flat reference Worker command field set is invalid");
  }
  const record: Record<string, unknown> = {};
  for (const key of keys) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (descriptor === undefined || !("value" in descriptor)) {
      throw new Error(`Flat reference Worker command ${key} is an accessor`);
    }
    record[key] = descriptor.value;
  }
  return record;
}
