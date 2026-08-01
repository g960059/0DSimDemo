export type WorkbenchDurableCommitKindV3 = "draft-save" | "snapshot";

export class WorkbenchDurablePersistenceErrorV3 extends Error {
  readonly kind: WorkbenchDurableCommitKindV3;

  constructor(kind: WorkbenchDurableCommitKindV3, cause: unknown) {
    const causeMessage = cause instanceof Error ? cause.message : String(cause);
    super(`Workbench ${kind} browser persistence failed: ${causeMessage}`, {
      cause,
    });
    this.name = "WorkbenchDurablePersistenceErrorV3";
    this.kind = kind;
  }
}

/**
 * Crosses the only boundary where an already-advanced Worker Workspace becomes
 * durable browser state. UI adoption happens strictly after `persist` returns.
 * If storage rejects the write, the advanced runtime is no longer compatible
 * with the last durable Workspace, so it is terminated and reconstructed from
 * storage instead of being resumed.
 */
export function commitWorkbenchDurableMutationV3<T>(input: Readonly<{
  kind: WorkbenchDurableCommitKindV3;
  persist(): T;
  adoptDurable(value: T): void;
  terminateRuntime(): void;
  reinitializeFromDurable(): void;
}>): T {
  let durable: T;
  try {
    durable = input.persist();
  } catch (error) {
    try {
      input.terminateRuntime();
    } finally {
      input.reinitializeFromDurable();
    }
    throw new WorkbenchDurablePersistenceErrorV3(input.kind, error);
  }
  input.adoptDurable(durable);
  return durable;
}
