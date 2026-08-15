import {
  resolveBoundExecutionPlanStateDispatchV1,
  type BoundExecutionPlanV1,
} from "@/runtime/executionPlan/BoundExecutionPlanV1";
import type {
  ExecutionPlanStateStorageKindV1,
} from "@/runtime/executionPlan/ExecutionPlanDescriptorV1";
import type {
  TransactionalTypedStateCurrentCursorV1,
  TransactionalTypedStateManifestV1,
} from "@/engine/vnext/TransactionalTypedStateImageV1";

export const EXECUTION_PLAN_ACCEPTED_TYPED_STATE_BINDING_V1_SCHEMA_ID =
  "circleheart-execution-plan-accepted-typed-state-binding-v1" as const;

export type ExecutionPlanAcceptedTypedStateBindingV1 = Readonly<{
  schemaId:
    typeof EXECUTION_PLAN_ACCEPTED_TYPED_STATE_BINDING_V1_SCHEMA_ID;
  definitionId: string;
  authorityLayoutId: string;
  authorityFingerprint: string;
  logicalSlotCount: number;
  continuousSlotCount: number;
  booleanSlotCount: number;
}>;

type BoundSlotV1 = Readonly<{
  stateId: string;
  logicalIndex: number;
  storageKind: ExecutionPlanStateStorageKindV1;
  authoritySlotIndex: number;
}>;

type BindingStorageV1 = Readonly<{
  slots: readonly BoundSlotV1[];
  slotByStateId: ReadonlyMap<string, BoundSlotV1>;
}>;

const BINDING_STORAGE_V1 = new WeakMap<
  object,
  BindingStorageV1
>();

/**
 * Binds compiler-owned state identities to one exact typed-authority manifest.
 * Pointer lookup happens once during Scenario initialization; the hot path
 * subsequently uses only numeric slot indices retained in private storage.
 */
export function bindExecutionPlanAcceptedTypedStateV1(
  bound: BoundExecutionPlanV1,
  manifest: TransactionalTypedStateManifestV1,
): ExecutionPlanAcceptedTypedStateBindingV1 {
  const stateDispatch = resolveBoundExecutionPlanStateDispatchV1(bound);
  assertManifestV1(manifest);
  const continuousSlotByPointer = slotIndexByPointerV1(
    manifest.numericalLayout.continuousSlots,
    "continuous",
  );
  const booleanSlotByPointer = slotIndexByPointerV1(
    manifest.numericalLayout.booleanSlots,
    "boolean",
  );
  const slots = stateDispatch.slots.map((slot) => {
    const expected = slot.storageKind === "continuous-f64"
      ? continuousSlotByPointer
      : booleanSlotByPointer;
    const conflicting = slot.storageKind === "continuous-f64"
      ? booleanSlotByPointer
      : continuousSlotByPointer;
    const authoritySlotIndex = expected.get(slot.authorityPointer);
    if (authoritySlotIndex === undefined) {
      if (conflicting.has(slot.authorityPointer)) {
        throw new Error(
          `Execution plan state ${slot.stateId} authority storage kind drifted`,
        );
      }
      throw new Error(
        `Execution plan state ${slot.stateId} authority pointer is unavailable`,
      );
    }
    return Object.freeze({
      stateId: slot.stateId,
      logicalIndex: slot.logicalIndex,
      storageKind: slot.storageKind,
      authoritySlotIndex,
    });
  });
  const continuousAuthoritySlots = slots
    .filter(({ storageKind }) => storageKind === "continuous-f64")
    .map(({ authoritySlotIndex }) => authoritySlotIndex);
  const booleanAuthoritySlots = slots
    .filter(({ storageKind }) => storageKind === "boolean-u8")
    .map(({ authoritySlotIndex }) => authoritySlotIndex);
  assertUniqueAuthoritySlotsV1(continuousAuthoritySlots, "continuous");
  assertUniqueAuthoritySlotsV1(booleanAuthoritySlots, "boolean");
  const binding = Object.freeze({
    schemaId: EXECUTION_PLAN_ACCEPTED_TYPED_STATE_BINDING_V1_SCHEMA_ID,
    definitionId: stateDispatch.definitionId,
    authorityLayoutId: manifest.layoutId,
    authorityFingerprint: manifest.fingerprint,
    logicalSlotCount: stateDispatch.logicalSlotCount,
    continuousSlotCount: stateDispatch.continuousSlotCount,
    booleanSlotCount: stateDispatch.booleanSlotCount,
  });
  BINDING_STORAGE_V1.set(binding, Object.freeze({
    slots: Object.freeze(slots),
    slotByStateId: new Map(slots.map((slot) => [slot.stateId, slot] as const)),
  }));
  return binding;
}

/** Copies the exact current authority into compiler logical order. */
export function readExecutionPlanAcceptedTypedStateIntoLogicalV1(
  binding: ExecutionPlanAcceptedTypedStateBindingV1,
  cursor: TransactionalTypedStateCurrentCursorV1,
  destination: Float64Array,
): void {
  const storage = requiredStorageV1(binding);
  assertCursorV1(binding, cursor);
  if (
    !(destination instanceof Float64Array)
    || destination.length !== binding.logicalSlotCount
  ) {
    throw new RangeError(
      "Execution plan accepted-state destination has the wrong length",
    );
  }
  for (const slot of storage.slots) {
    destination[slot.logicalIndex] = slot.storageKind === "continuous-f64"
      ? cursor.readContinuous(slot.authoritySlotIndex)
      : (cursor.readBoolean(slot.authoritySlotIndex) ? 1 : 0);
  }
}

/** Resolves one cold state identity without exposing mutable binding arrays. */
export function resolveExecutionPlanAcceptedTypedStateSlotV1(
  binding: ExecutionPlanAcceptedTypedStateBindingV1,
  stateId: string,
): BoundSlotV1 {
  const slot = requiredStorageV1(binding).slotByStateId.get(stateId);
  if (slot === undefined) {
    throw new Error(`Execution plan accepted state ${stateId} is unavailable`);
  }
  return slot;
}

/** Returns immutable logical-order metadata for one model-owned binder. */
export function listExecutionPlanAcceptedTypedStateSlotsV1(
  binding: ExecutionPlanAcceptedTypedStateBindingV1,
): readonly BoundSlotV1[] {
  return requiredStorageV1(binding).slots;
}

function requiredStorageV1(
  binding: ExecutionPlanAcceptedTypedStateBindingV1,
): BindingStorageV1 {
  const storage = BINDING_STORAGE_V1.get(binding);
  if (storage === undefined) {
    throw new Error(
      "Execution plan accepted-state operation requires an admitted binding",
    );
  }
  return storage;
}

function assertManifestV1(manifest: TransactionalTypedStateManifestV1): void {
  if (
    typeof manifest !== "object"
    || manifest === null
    || typeof manifest.layoutId !== "string"
    || manifest.layoutId.length === 0
    || typeof manifest.fingerprint !== "string"
    || manifest.fingerprint.length === 0
  ) {
    throw new Error("Execution plan typed-authority manifest is invalid");
  }
}

function assertCursorV1(
  binding: ExecutionPlanAcceptedTypedStateBindingV1,
  cursor: TransactionalTypedStateCurrentCursorV1,
): void {
  if (
    cursor.layoutId !== binding.authorityLayoutId
    || cursor.fingerprint !== binding.authorityFingerprint
  ) {
    throw new Error("Execution plan typed-authority cursor identity drifted");
  }
}

function slotIndexByPointerV1(
  slots: readonly Readonly<{ pointer: string }>[],
  label: string,
): Map<string, number> {
  const result = new Map<string, number>();
  slots.forEach(({ pointer }, index) => {
    if (result.has(pointer)) {
      throw new Error(
        `Execution plan typed-authority ${label} pointer is duplicated`,
      );
    }
    result.set(pointer, index);
  });
  return result;
}

function assertUniqueAuthoritySlotsV1(
  slots: readonly number[],
  label: string,
): void {
  if (new Set(slots).size !== slots.length) {
    throw new Error(
      `Execution plan ${label} states alias one typed-authority slot`,
    );
  }
}
