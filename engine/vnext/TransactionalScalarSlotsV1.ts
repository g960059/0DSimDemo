import {
  createFlatNumericalStateLayoutV1,
  type FlatNumericalContainerV1,
  type FlatNumericalSlotV1,
} from "@/engine/vnext/FlatNumericalStateV1";

export const TRANSACTIONAL_SCALAR_SLOT_MANIFEST_V1_SCHEMA_ID =
  "circleheart-transactional-scalar-slot-manifest-v1" as const;
export const TRANSACTIONAL_SCALAR_SLOTS_V1_ID =
  "circleheart-transactional-scalar-slots-v1" as const;

export type TransactionalScalarSlotManifestV1 = Readonly<{
  schemaId: typeof TRANSACTIONAL_SCALAR_SLOT_MANIFEST_V1_SCHEMA_ID;
  layoutId: string;
  fingerprint: string;
  continuousSlots: readonly FlatNumericalSlotV1[];
  booleanSlots: readonly FlatNumericalSlotV1[];
  excludedDynamicRoots: readonly FlatNumericalSlotV1[];
  excludedStringSlots: readonly FlatNumericalSlotV1[];
  containers: readonly FlatNumericalContainerV1[];
}>;

export type TransactionalScalarSlotsReportV1 = Readonly<{
  authorityId: typeof TRANSACTIONAL_SCALAR_SLOTS_V1_ID;
  layoutId: string;
  fingerprint: string;
  continuousSlotCount: number;
  booleanSlotCount: number;
  excludedDynamicRootCount: number;
  excludedStringSlotCount: number;
  containerCount: number;
  activeBufferIndex: 0 | 1;
  commitCount: number;
  staged: boolean;
}>;

export type TransactionalScalarSlotsSnapshotV1 = Readonly<{
  continuous: Float64Array;
  booleans: Uint8Array;
}>;

/**
 * Compiles the fixed scalar portion of one model-owned accepted-state shape.
 * Arrays, nullable subtrees, and strings are reported rather than silently
 * flattened. Their explicit tag/code layouts belong to later model schemas.
 */
export function createTransactionalScalarSlotManifestV1(
  layoutId: string,
  referenceState: unknown,
): TransactionalScalarSlotManifestV1 {
  const discovered = createFlatNumericalStateLayoutV1(
    layoutId,
    referenceState,
  );
  const fingerprint = manifestFingerprint(
    layoutId,
    discovered.continuousSlots,
    discovered.booleanSlots,
    discovered.excludedDynamicRoots,
    discovered.stringSlots,
    discovered.containers,
  );
  return Object.freeze({
    schemaId: TRANSACTIONAL_SCALAR_SLOT_MANIFEST_V1_SCHEMA_ID,
    layoutId,
    fingerprint,
    continuousSlots: discovered.continuousSlots,
    booleanSlots: discovered.booleanSlots,
    excludedDynamicRoots: discovered.excludedDynamicRoots,
    excludedStringSlots: discovered.stringSlots,
    containers: discovered.containers,
  });
}

/**
 * Allocation-free two-buffer scalar transaction owner. `stage` may overwrite
 * only the inactive candidate. `promote` is the sole accepted-state swap and
 * cannot fail after staging succeeds.
 */
export class TransactionalScalarSlotsV1<TState> {
  readonly authorityId = TRANSACTIONAL_SCALAR_SLOTS_V1_ID;

  readonly #manifest: TransactionalScalarSlotManifestV1;
  readonly #continuousBuffers: readonly [Float64Array, Float64Array];
  readonly #booleanBuffers: readonly [Uint8Array, Uint8Array];
  #activeIndex: 0 | 1 = 0;
  #commitCount = 0;
  #staged = false;

  constructor(
    manifest: TransactionalScalarSlotManifestV1,
    initialState: TState,
  ) {
    this.#manifest = manifest;
    this.#continuousBuffers = Object.freeze([
      new Float64Array(manifest.continuousSlots.length),
      new Float64Array(manifest.continuousSlots.length),
    ]);
    this.#booleanBuffers = Object.freeze([
      new Uint8Array(manifest.booleanSlots.length),
      new Uint8Array(manifest.booleanSlots.length),
    ]);
    this.stage(initialState);
    this.promote();
    this.#commitCount = 0;
  }

  stage(candidate: TState): void {
    if (this.#staged) {
      throw new Error("Transactional scalar slots already have a staged candidate");
    }
    const candidateIndex = this.#activeIndex === 0 ? 1 : 0;
    const continuous = this.#continuousBuffers[candidateIndex];
    const booleans = this.#booleanBuffers[candidateIndex];
    for (
      let index = 0;
      index < this.#manifest.continuousSlots.length;
      index += 1
    ) {
      const slot = this.#manifest.continuousSlots[index]!;
      const value = requiredPathValue(candidate, slot);
      if (typeof value !== "number" || !Number.isFinite(value)) {
        throw new Error(`Transactional scalar slot ${slot.pointer} must be finite`);
      }
      continuous[index] = value;
    }
    for (
      let index = 0;
      index < this.#manifest.booleanSlots.length;
      index += 1
    ) {
      const slot = this.#manifest.booleanSlots[index]!;
      const value = requiredPathValue(candidate, slot);
      if (typeof value !== "boolean") {
        throw new Error(`Transactional scalar slot ${slot.pointer} must be boolean`);
      }
      booleans[index] = value ? 1 : 0;
    }
    this.#staged = true;
  }

  promote(): void {
    if (!this.#staged) {
      throw new Error("Transactional scalar slots have no staged candidate");
    }
    this.#activeIndex = this.#activeIndex === 0 ? 1 : 0;
    this.#staged = false;
    this.#commitCount += 1;
  }

  abort(): void {
    this.#staged = false;
  }

  assertCurrentMatches(state: TState): void {
    const continuous = this.#continuousBuffers[this.#activeIndex];
    const booleans = this.#booleanBuffers[this.#activeIndex];
    for (
      let index = 0;
      index < this.#manifest.continuousSlots.length;
      index += 1
    ) {
      const slot = this.#manifest.continuousSlots[index]!;
      const value = requiredPathValue(state, slot);
      if (typeof value !== "number" || !Object.is(value, continuous[index])) {
        throw new Error(`Transactional scalar slot ${slot.pointer} differs`);
      }
    }
    for (
      let index = 0;
      index < this.#manifest.booleanSlots.length;
      index += 1
    ) {
      const slot = this.#manifest.booleanSlots[index]!;
      const value = requiredPathValue(state, slot);
      if (typeof value !== "boolean" || (value ? 1 : 0) !== booleans[index]) {
        throw new Error(`Transactional scalar slot ${slot.pointer} differs`);
      }
    }
  }

  snapshot(): TransactionalScalarSlotsSnapshotV1 {
    return Object.freeze({
      continuous: this.#continuousBuffers[this.#activeIndex].slice(),
      booleans: this.#booleanBuffers[this.#activeIndex].slice(),
    });
  }

  report(): TransactionalScalarSlotsReportV1 {
    return Object.freeze({
      authorityId: TRANSACTIONAL_SCALAR_SLOTS_V1_ID,
      layoutId: this.#manifest.layoutId,
      fingerprint: this.#manifest.fingerprint,
      continuousSlotCount: this.#manifest.continuousSlots.length,
      booleanSlotCount: this.#manifest.booleanSlots.length,
      excludedDynamicRootCount: this.#manifest.excludedDynamicRoots.length,
      excludedStringSlotCount: this.#manifest.excludedStringSlots.length,
      containerCount: this.#manifest.containers.length,
      activeBufferIndex: this.#activeIndex,
      commitCount: this.#commitCount,
      staged: this.#staged,
    });
  }
}

function requiredPathValue(
  root: unknown,
  slot: FlatNumericalSlotV1,
): unknown {
  let current = root;
  for (const segment of slot.path) {
    if (current === null || typeof current !== "object") {
      throw new Error(`Transactional scalar slot ${slot.pointer} is unavailable`);
    }
    const descriptor = Object.getOwnPropertyDescriptor(current, String(segment));
    if (descriptor === undefined || !("value" in descriptor)) {
      throw new Error(`Transactional scalar slot ${slot.pointer} is unavailable`);
    }
    current = descriptor.value;
  }
  return current;
}

function manifestFingerprint(
  layoutId: string,
  continuous: readonly FlatNumericalSlotV1[],
  booleans: readonly FlatNumericalSlotV1[],
  dynamics: readonly FlatNumericalSlotV1[],
  strings: readonly FlatNumericalSlotV1[],
  containers: readonly FlatNumericalContainerV1[],
): string {
  const canonical = [
    `layout:${layoutId}`,
    ...continuous.map(({ pointer }) => `f64:${pointer}`),
    ...booleans.map(({ pointer }) => `bool:${pointer}`),
    ...dynamics.map(({ pointer }) => `dynamic:${pointer}`),
    ...strings.map(({ pointer }) => `string:${pointer}`),
    ...containers.map((container) => [
      "container",
      container.pointer,
      container.kind,
      container.prototypeTag ?? "null",
      container.keys.join(","),
    ].join(":")),
  ].join("\n");
  let hash = 0x811c9dc5;
  const bytes = new TextEncoder().encode(canonical);
  for (const byte of bytes) {
    hash ^= byte;
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return `fnv1a32-${hash.toString(16).padStart(8, "0")}`;
}
