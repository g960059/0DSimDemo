import {
  decodeCanonicalFlatDataV1,
  encodeCanonicalFlatDataIntoV1,
} from "@/engine/vnext/CanonicalFlatDataV1";
import {
  assertFlatNumericalStateShapeV1,
  createFlatNumericalStateLayoutV1,
  readFlatNumericalStatePathV1,
  type FlatNumericalPathSegmentV1,
  type FlatNumericalStateLayoutV1,
  type FlatNumericalStateLayoutOptionsV1,
} from "@/engine/vnext/FlatNumericalStateV1";

export const TRANSACTIONAL_TYPED_STATE_IMAGE_V1_ID =
  "circleheart-transactional-typed-state-image-v1" as const;
export const TRANSACTIONAL_TYPED_STATE_MANIFEST_V1_SCHEMA_ID =
  "circleheart-transactional-typed-state-manifest-v1" as const;

const MAX_ARENA_CAPACITY_BYTES = 16 * 1024 * 1024;
const UTF8_ENCODER = new TextEncoder();
const UTF8_DECODER = new TextDecoder("utf-8", { fatal: true });

type TypedStateNodeV1 =
  | Readonly<{ kind: "f64"; slotIndex: number }>
  | Readonly<{ kind: "boolean"; slotIndex: number }>
  | Readonly<{ kind: "string"; slotIndex: number }>
  | Readonly<{ kind: "dynamic"; slotIndex: number }>
  | Readonly<{
    kind: "record";
    nullPrototype: boolean;
    entries: readonly Readonly<{
      key: string;
      node: TypedStateNodeV1;
    }>[];
  }>
  | Readonly<{
    kind: "typed-array";
    constructorTag: NumericTypedArrayTagV1;
    items: readonly TypedStateNodeV1[];
  }>
  | Readonly<{
    kind: "array";
    items: readonly TypedStateNodeV1[];
  }>;

type NumericTypedArrayV1 =
  | Float64Array
  | Float32Array
  | Int32Array
  | Uint32Array
  | Int16Array
  | Uint16Array
  | Int8Array
  | Uint8Array
  | Uint8ClampedArray;

type NumericTypedArrayTagV1 =
  | "Float64Array"
  | "Float32Array"
  | "Int32Array"
  | "Uint32Array"
  | "Int16Array"
  | "Uint16Array"
  | "Int8Array"
  | "Uint8Array"
  | "Uint8ClampedArray";

type TypedStateImageLayoutV1 = Readonly<{
  continuousByteOffset: number;
  booleanByteOffset: number;
  stringMetadataByteOffset: number;
  dynamicMetadataByteOffset: number;
  stringArenaByteOffset: number;
  dynamicArenaByteOffset: number;
  bufferByteLength: number;
}>;

export type TransactionalTypedStateManifestV1 = Readonly<{
  schemaId: typeof TRANSACTIONAL_TYPED_STATE_MANIFEST_V1_SCHEMA_ID;
  layoutId: string;
  fingerprint: string;
  numericalLayout: FlatNumericalStateLayoutV1;
  stringArenaCapacityBytes: number;
  dynamicArenaCapacityBytes: number;
  bufferByteLength: number;
  rootNode: TypedStateNodeV1;
  imageLayout: TypedStateImageLayoutV1;
}>;

export type TransactionalTypedStateImageReportV1 = Readonly<{
  authorityId: typeof TRANSACTIONAL_TYPED_STATE_IMAGE_V1_ID;
  layoutId: string;
  fingerprint: string;
  continuousSlotCount: number;
  booleanSlotCount: number;
  stringSlotCount: number;
  dynamicRootCount: number;
  containerCount: number;
  fixedImageCount: 2;
  bufferByteLength: number;
  stringArenaCapacityBytes: number;
  dynamicArenaCapacityBytes: number;
  currentStringBytes: number;
  currentDynamicBytes: number;
  highWaterStringBytes: number;
  highWaterDynamicBytes: number;
  activeBufferIndex: 0 | 1;
  commitCount: number;
  staged: boolean;
}>;

export type TransactionalTypedStateImageSnapshotV1 = Readonly<{
  continuous: Float64Array;
  booleans: Uint8Array;
  stringMetadata: Uint32Array;
  stringBytes: Uint8Array;
  dynamicMetadata: Uint32Array;
  dynamicBytes: Uint8Array;
}>;

/**
 * Read-only, live cursor over whichever fixed image is currently accepted.
 * It never exposes an ArrayBuffer or typed-array view, so a caller cannot
 * mutate the transaction authority. Slot numbers are bound by the manifest
 * fingerprint and are intended to be generated into a model-owned cursor.
 */
export type TransactionalTypedStateCurrentCursorV1 = Readonly<{
  layoutId: string;
  fingerprint: string;
  readContinuous(slotIndex: number): number;
  readBoolean(slotIndex: number): boolean;
  readString(slotIndex: number): string;
  readDynamic(slotIndex: number): unknown;
}>;

/**
 * Generation-bound writer for the inactive candidate image. V1 intentionally
 * permits direct writes only for fixed numerical leaves; strings and dynamic
 * roots remain copied from current until their model owners receive bounded
 * tagged layouts.
 */
export type TransactionalTypedStateCandidateCursorV1 = Readonly<{
  layoutId: string;
  fingerprint: string;
  readContinuous(slotIndex: number): number;
  writeContinuous(slotIndex: number, value: number): void;
  readBoolean(slotIndex: number): boolean;
  writeBoolean(slotIndex: number, value: boolean): void;
}>;

export type TransactionalTypedStateRetainedSlotsV1 = Readonly<{
  continuous?: readonly number[];
  booleans?: readonly number[];
}>;

type MutableImageV1 = Readonly<{
  buffer: ArrayBuffer;
  continuous: Float64Array;
  booleans: Uint8Array;
  stringMetadata: Uint32Array;
  dynamicMetadata: Uint32Array;
  stringArena: Uint8Array;
  dynamicArena: Uint8Array;
}>;

/**
 * Compiles one exact, model-owned state topology. Fixed leaves receive typed
 * slots. Nullable or variable-array roots receive bounded canonical payload
 * slots, so they cannot grow memory for the lifetime of a Session.
 */
export function createTransactionalTypedStateManifestV1(
  layoutId: string,
  referenceState: unknown,
  stringArenaCapacityBytes: number,
  dynamicArenaCapacityBytes: number,
  layoutOptions: FlatNumericalStateLayoutOptionsV1 = {},
): TransactionalTypedStateManifestV1 {
  assertArenaCapacity(stringArenaCapacityBytes, "string");
  assertArenaCapacity(dynamicArenaCapacityBytes, "dynamic");
  const numericalLayout = createFlatNumericalStateLayoutV1(
    layoutId,
    referenceState,
    layoutOptions,
  );
  const rootNode = compileNode(referenceState, [], numericalLayout);
  const imageLayout = createImageLayout(
    numericalLayout,
    stringArenaCapacityBytes,
    dynamicArenaCapacityBytes,
  );
  const fingerprint = manifestFingerprint(
    numericalLayout,
    stringArenaCapacityBytes,
    dynamicArenaCapacityBytes,
  );
  return Object.freeze({
    schemaId: TRANSACTIONAL_TYPED_STATE_MANIFEST_V1_SCHEMA_ID,
    layoutId,
    fingerprint,
    numericalLayout,
    stringArenaCapacityBytes,
    dynamicArenaCapacityBytes,
    bufferByteLength: imageLayout.bufferByteLength,
    rootNode,
    imageLayout,
  });
}

/**
 * Two fixed ArrayBuffers form a transaction boundary. `stage` writes only the
 * inactive image; `promote` is an infallible index swap after all validation.
 */
export class TransactionalTypedStateImageV1<TState> {
  readonly authorityId = TRANSACTIONAL_TYPED_STATE_IMAGE_V1_ID;

  readonly #manifest: TransactionalTypedStateManifestV1;
  readonly #images: readonly [MutableImageV1, MutableImageV1];
  readonly #currentCursor: TransactionalTypedStateCurrentCursorV1;
  #activeIndex: 0 | 1 = 0;
  #commitCount = 0;
  #staged = false;
  #stagedStringBytes = 0;
  #stagedDynamicBytes = 0;
  #currentStringBytes = 0;
  #currentDynamicBytes = 0;
  #highWaterStringBytes = 0;
  #highWaterDynamicBytes = 0;
  #candidateGeneration = 0;

  constructor(
    manifest: TransactionalTypedStateManifestV1,
    initialState: TState,
  ) {
    this.#manifest = manifest;
    this.#images = Object.freeze([
      createImage(manifest),
      createImage(manifest),
    ]);
    this.#currentCursor = Object.freeze({
      layoutId: manifest.layoutId,
      fingerprint: manifest.fingerprint,
      readContinuous: (slotIndex: number) =>
        this.readCurrentContinuous(slotIndex),
      readBoolean: (slotIndex: number) =>
        this.readCurrentBoolean(slotIndex),
      readString: (slotIndex: number) =>
        this.readCurrentString(slotIndex),
      readDynamic: (slotIndex: number) =>
        this.readCurrentDynamic(slotIndex),
    });
    this.stage(initialState);
    this.promote();
    this.#commitCount = 0;
  }

  stage(candidate: TState): void {
    if (this.#staged) {
      throw new Error("Transactional typed state already has a staged candidate");
    }
    assertFlatNumericalStateShapeV1(
      this.#manifest.numericalLayout,
      candidate,
    );
    const candidateImage = this.#images[this.inactiveIndex()];
    writeFixedLeaves(this.#manifest, candidate, candidateImage);
    const stringBytes = writeStrings(this.#manifest, candidate, candidateImage);
    const dynamicBytes = writeDynamicRoots(
      this.#manifest,
      candidate,
      candidateImage,
    );
    this.#stagedStringBytes = stringBytes;
    this.#stagedDynamicBytes = dynamicBytes;
    this.#staged = true;
  }

  /**
   * Copies current into inactive storage once, then returns a cursor that can
   * update fixed slots without allocating candidate objects. The caller must
   * still rehydrate/validate before promotion during this reference phase.
   */
  beginCandidateFromCurrent(): TransactionalTypedStateCandidateCursorV1 {
    if (this.#staged) {
      throw new Error("Transactional typed state already has a staged candidate");
    }
    const current = this.#images[this.#activeIndex];
    const candidate = this.#images[this.inactiveIndex()];
    new Uint8Array(candidate.buffer).set(new Uint8Array(current.buffer));
    this.#stagedStringBytes = this.#currentStringBytes;
    this.#stagedDynamicBytes = this.#currentDynamicBytes;
    this.#staged = true;
    this.#candidateGeneration += 1;
    const generation = this.#candidateGeneration;
    return Object.freeze({
      layoutId: this.#manifest.layoutId,
      fingerprint: this.#manifest.fingerprint,
      readContinuous: (slotIndex: number) =>
        this.readCandidateContinuous(generation, slotIndex),
      writeContinuous: (slotIndex: number, value: number) =>
        this.writeCandidateContinuous(generation, slotIndex, value),
      readBoolean: (slotIndex: number) =>
        this.readCandidateBoolean(generation, slotIndex),
      writeBoolean: (slotIndex: number, value: boolean) =>
        this.writeCandidateBoolean(generation, slotIndex, value),
    });
  }

  /**
   * Completes a directly staged candidate from a temporary object adapter.
   * Slots already written by migrated owners are compared bit-exactly and are
   * never overwritten; all remaining leaves and bounded arenas are populated
   * from the adapter before cold-boundary rehydration and validation.
   */
  completeCandidateFromObject(
    candidate: TState,
    retained: TransactionalTypedStateRetainedSlotsV1,
  ): void {
    if (!this.#staged) {
      throw new Error("Transactional typed state has no staged candidate");
    }
    assertFlatNumericalStateShapeV1(
      this.#manifest.numericalLayout,
      candidate,
    );
    const retainedContinuous = retainedSlotSet(
      retained.continuous,
      this.#manifest.numericalLayout.continuousSlots.length,
      "continuous",
    );
    const retainedBooleans = retainedSlotSet(
      retained.booleans,
      this.#manifest.numericalLayout.booleanSlots.length,
      "boolean",
    );
    const candidateImage = this.#images[this.inactiveIndex()];
    assertRetainedFixedLeavesMatch(
      this.#manifest,
      candidate,
      candidateImage,
      retainedContinuous,
      retainedBooleans,
    );
    writeFixedLeaves(
      this.#manifest,
      candidate,
      candidateImage,
      retainedContinuous,
      retainedBooleans,
    );
    this.#stagedStringBytes = writeStrings(
      this.#manifest,
      candidate,
      candidateImage,
    );
    this.#stagedDynamicBytes = writeDynamicRoots(
      this.#manifest,
      candidate,
      candidateImage,
    );
  }

  promote(): void {
    if (!this.#staged) {
      throw new Error("Transactional typed state has no staged candidate");
    }
    this.#activeIndex = this.inactiveIndex();
    this.#currentStringBytes = this.#stagedStringBytes;
    this.#currentDynamicBytes = this.#stagedDynamicBytes;
    this.#highWaterStringBytes = Math.max(
      this.#highWaterStringBytes,
      this.#currentStringBytes,
    );
    this.#highWaterDynamicBytes = Math.max(
      this.#highWaterDynamicBytes,
      this.#currentDynamicBytes,
    );
    this.#staged = false;
    this.#commitCount += 1;
  }

  abort(): void {
    this.#staged = false;
    this.#stagedStringBytes = 0;
    this.#stagedDynamicBytes = 0;
  }

  rehydrateCurrent(): TState {
    return rehydrateNode(
      this.#manifest.rootNode,
      this.#images[this.#activeIndex],
    ) as TState;
  }

  rehydrateStaged(): TState {
    if (!this.#staged) {
      throw new Error("Transactional typed state has no staged candidate");
    }
    return rehydrateNode(
      this.#manifest.rootNode,
      this.#images[this.inactiveIndex()],
    ) as TState;
  }

  currentCursor(): TransactionalTypedStateCurrentCursorV1 {
    return this.#currentCursor;
  }

  snapshot(): TransactionalTypedStateImageSnapshotV1 {
    const image = this.#images[this.#activeIndex];
    return Object.freeze({
      continuous: image.continuous.slice(),
      booleans: image.booleans.slice(),
      stringMetadata: image.stringMetadata.slice(),
      stringBytes: image.stringArena.slice(0, this.#currentStringBytes),
      dynamicMetadata: image.dynamicMetadata.slice(),
      dynamicBytes: image.dynamicArena.slice(0, this.#currentDynamicBytes),
    });
  }

  report(): TransactionalTypedStateImageReportV1 {
    const layout = this.#manifest.numericalLayout;
    return Object.freeze({
      authorityId: TRANSACTIONAL_TYPED_STATE_IMAGE_V1_ID,
      layoutId: this.#manifest.layoutId,
      fingerprint: this.#manifest.fingerprint,
      continuousSlotCount: layout.continuousSlots.length,
      booleanSlotCount: layout.booleanSlots.length,
      stringSlotCount: layout.stringSlots.length,
      dynamicRootCount: layout.excludedDynamicRoots.length,
      containerCount: layout.containers.length,
      fixedImageCount: 2 as const,
      bufferByteLength: this.#manifest.bufferByteLength,
      stringArenaCapacityBytes: this.#manifest.stringArenaCapacityBytes,
      dynamicArenaCapacityBytes: this.#manifest.dynamicArenaCapacityBytes,
      currentStringBytes: this.#currentStringBytes,
      currentDynamicBytes: this.#currentDynamicBytes,
      highWaterStringBytes: this.#highWaterStringBytes,
      highWaterDynamicBytes: this.#highWaterDynamicBytes,
      activeBufferIndex: this.#activeIndex,
      commitCount: this.#commitCount,
      staged: this.#staged,
    });
  }

  private inactiveIndex(): 0 | 1 {
    return this.#activeIndex === 0 ? 1 : 0;
  }

  private readCurrentContinuous(slotIndex: number): number {
    assertSlotIndex(
      slotIndex,
      this.#manifest.numericalLayout.continuousSlots.length,
      "continuous",
    );
    const value = this.#images[this.#activeIndex].continuous[slotIndex]!;
    if (!Number.isFinite(value)) {
      throw new Error("Transactional typed state current continuous slot is not finite");
    }
    return value;
  }

  private readCurrentBoolean(slotIndex: number): boolean {
    assertSlotIndex(
      slotIndex,
      this.#manifest.numericalLayout.booleanSlots.length,
      "boolean",
    );
    const value = this.#images[this.#activeIndex].booleans[slotIndex]!;
    if (value !== 0 && value !== 1) {
      throw new Error("Transactional typed state current boolean slot is invalid");
    }
    return value === 1;
  }

  private readCurrentString(slotIndex: number): string {
    assertSlotIndex(
      slotIndex,
      this.#manifest.numericalLayout.stringSlots.length,
      "string",
    );
    const image = this.#images[this.#activeIndex];
    const offset = image.stringMetadata[slotIndex * 2]!;
    const length = image.stringMetadata[slotIndex * 2 + 1]!;
    assertArenaSlice(offset, length, this.#currentStringBytes, "string", true);
    return UTF8_DECODER.decode(image.stringArena.subarray(offset, offset + length));
  }

  private readCurrentDynamic(slotIndex: number): unknown {
    assertSlotIndex(
      slotIndex,
      this.#manifest.numericalLayout.excludedDynamicRoots.length,
      "dynamic",
    );
    const image = this.#images[this.#activeIndex];
    const offset = image.dynamicMetadata[slotIndex * 2]!;
    const length = image.dynamicMetadata[slotIndex * 2 + 1]!;
    assertArenaSlice(offset, length, this.#currentDynamicBytes, "dynamic");
    return decodeCanonicalFlatDataV1(
      image.dynamicArena.subarray(offset, offset + length),
    );
  }

  private readCandidateContinuous(
    generation: number,
    slotIndex: number,
  ): number {
    this.assertCandidateGeneration(generation);
    assertSlotIndex(
      slotIndex,
      this.#manifest.numericalLayout.continuousSlots.length,
      "continuous candidate",
    );
    return this.#images[this.inactiveIndex()].continuous[slotIndex]!;
  }

  private writeCandidateContinuous(
    generation: number,
    slotIndex: number,
    value: number,
  ): void {
    this.assertCandidateGeneration(generation);
    assertSlotIndex(
      slotIndex,
      this.#manifest.numericalLayout.continuousSlots.length,
      "continuous candidate",
    );
    if (!Number.isFinite(value)) {
      throw new Error(
        "Transactional typed state candidate continuous value must be finite",
      );
    }
    this.#images[this.inactiveIndex()].continuous[slotIndex] = value;
  }

  private readCandidateBoolean(
    generation: number,
    slotIndex: number,
  ): boolean {
    this.assertCandidateGeneration(generation);
    assertSlotIndex(
      slotIndex,
      this.#manifest.numericalLayout.booleanSlots.length,
      "boolean candidate",
    );
    return this.#images[this.inactiveIndex()].booleans[slotIndex] === 1;
  }

  private writeCandidateBoolean(
    generation: number,
    slotIndex: number,
    value: boolean,
  ): void {
    this.assertCandidateGeneration(generation);
    assertSlotIndex(
      slotIndex,
      this.#manifest.numericalLayout.booleanSlots.length,
      "boolean candidate",
    );
    if (typeof value !== "boolean") {
      throw new Error(
        "Transactional typed state candidate boolean value must be boolean",
      );
    }
    this.#images[this.inactiveIndex()].booleans[slotIndex] = value ? 1 : 0;
  }

  private assertCandidateGeneration(generation: number): void {
    if (!this.#staged || generation !== this.#candidateGeneration) {
      throw new Error("Transactional typed state candidate cursor is stale");
    }
  }
}

function assertSlotIndex(
  slotIndex: number,
  slotCount: number,
  owner: string,
): void {
  if (
    !Number.isSafeInteger(slotIndex)
    || slotIndex < 0
    || slotIndex >= slotCount
  ) {
    throw new Error(`Transactional typed state ${owner} slot index is invalid`);
  }
}

function assertArenaSlice(
  offset: number,
  length: number,
  usedBytes: number,
  owner: string,
  allowEmpty = false,
): void {
  if (
    !Number.isSafeInteger(offset)
    || !Number.isSafeInteger(length)
    || offset < 0
    || length < (allowEmpty ? 0 : 1)
    || offset + length > usedBytes
  ) {
    throw new Error(`Transactional typed state current ${owner} slice is invalid`);
  }
}

function writeFixedLeaves(
  manifest: TransactionalTypedStateManifestV1,
  state: unknown,
  destination: MutableImageV1,
  retainedContinuous?: ReadonlySet<number>,
  retainedBooleans?: ReadonlySet<number>,
): void {
  const layout = manifest.numericalLayout;
  for (let index = 0; index < layout.continuousSlots.length; index += 1) {
    const slot = layout.continuousSlots[index]!;
    const value = readFlatNumericalStatePathV1(state, slot.path);
    if (typeof value !== "number" || !Number.isFinite(value)) {
      throw new Error(`Transactional typed state ${slot.pointer} must be finite`);
    }
    if (!retainedContinuous?.has(index)) {
      destination.continuous[index] = value;
    }
  }
  for (let index = 0; index < layout.booleanSlots.length; index += 1) {
    const slot = layout.booleanSlots[index]!;
    const value = readFlatNumericalStatePathV1(state, slot.path);
    if (typeof value !== "boolean") {
      throw new Error(`Transactional typed state ${slot.pointer} must be boolean`);
    }
    if (!retainedBooleans?.has(index)) {
      destination.booleans[index] = value ? 1 : 0;
    }
  }
}

function assertRetainedFixedLeavesMatch(
  manifest: TransactionalTypedStateManifestV1,
  state: unknown,
  destination: MutableImageV1,
  retainedContinuous: ReadonlySet<number>,
  retainedBooleans: ReadonlySet<number>,
): void {
  for (const index of retainedContinuous) {
    const slot = manifest.numericalLayout.continuousSlots[index]!;
    const value = readFlatNumericalStatePathV1(state, slot.path);
    if (
      typeof value !== "number"
      || !Number.isFinite(value)
      || !Object.is(destination.continuous[index], value)
    ) {
      throw new Error(
        `Transactional typed state retained ${slot.pointer} differs from adapter`,
      );
    }
  }
  for (const index of retainedBooleans) {
    const slot = manifest.numericalLayout.booleanSlots[index]!;
    const value = readFlatNumericalStatePathV1(state, slot.path);
    if (
      typeof value !== "boolean"
      || destination.booleans[index] !== (value ? 1 : 0)
    ) {
      throw new Error(
        `Transactional typed state retained ${slot.pointer} differs from adapter`,
      );
    }
  }
}

function retainedSlotSet(
  slots: readonly number[] | undefined,
  slotCount: number,
  owner: string,
): ReadonlySet<number> {
  const retained = new Set<number>();
  for (const slotIndex of slots ?? []) {
    assertSlotIndex(slotIndex, slotCount, `${owner} retained`);
    if (retained.has(slotIndex)) {
      throw new Error(
        `Transactional typed state ${owner} retained slot is duplicated`,
      );
    }
    retained.add(slotIndex);
  }
  return retained;
}

function writeStrings(
  manifest: TransactionalTypedStateManifestV1,
  state: unknown,
  destination: MutableImageV1,
): number {
  let byteOffset = 0;
  for (
    let index = 0;
    index < manifest.numericalLayout.stringSlots.length;
    index += 1
  ) {
    const slot = manifest.numericalLayout.stringSlots[index]!;
    const value = readFlatNumericalStatePathV1(state, slot.path);
    if (typeof value !== "string") {
      throw new Error(`Transactional typed state ${slot.pointer} must be a string`);
    }
    assertWellFormedString(value, slot.pointer);
    const target = destination.stringArena.subarray(byteOffset);
    const result = UTF8_ENCODER.encodeInto(value, target);
    if (result.read !== value.length) {
      throw new Error("Transactional typed state string arena capacity exceeded");
    }
    destination.stringMetadata[index * 2] = byteOffset;
    destination.stringMetadata[index * 2 + 1] = result.written;
    byteOffset += result.written;
  }
  return byteOffset;
}

function writeDynamicRoots(
  manifest: TransactionalTypedStateManifestV1,
  state: unknown,
  destination: MutableImageV1,
): number {
  let byteOffset = 0;
  const roots = manifest.numericalLayout.excludedDynamicRoots;
  for (let index = 0; index < roots.length; index += 1) {
    const slot = roots[index]!;
    const value = readFlatNumericalStatePathV1(state, slot.path);
    let length: number;
    try {
      length = encodeCanonicalFlatDataIntoV1(
        value,
        destination.dynamicArena.subarray(byteOffset),
      );
    } catch (error) {
      if (
        error instanceof Error
        && error.message === "Canonical flat data exceeds its fixed capacity"
      ) {
        throw new Error(
          "Transactional typed state dynamic arena capacity exceeded",
        );
      }
      throw error;
    }
    destination.dynamicMetadata[index * 2] = byteOffset;
    destination.dynamicMetadata[index * 2 + 1] = length;
    byteOffset += length;
  }
  return byteOffset;
}

function rehydrateNode(node: TypedStateNodeV1, image: MutableImageV1): unknown {
  switch (node.kind) {
    case "f64":
      return image.continuous[node.slotIndex]!;
    case "boolean":
      return image.booleans[node.slotIndex] === 1;
    case "string": {
      const offset = image.stringMetadata[node.slotIndex * 2]!;
      const length = image.stringMetadata[node.slotIndex * 2 + 1]!;
      return UTF8_DECODER.decode(image.stringArena.subarray(offset, offset + length));
    }
    case "dynamic": {
      const offset = image.dynamicMetadata[node.slotIndex * 2]!;
      const length = image.dynamicMetadata[node.slotIndex * 2 + 1]!;
      return decodeCanonicalFlatDataV1(
        image.dynamicArena.subarray(offset, offset + length),
      );
    }
    case "typed-array": {
      const array = createNumericTypedArray(node.constructorTag, node.items.length);
      for (let index = 0; index < node.items.length; index += 1) {
        const value = rehydrateNode(node.items[index]!, image);
        if (typeof value !== "number") {
          throw new Error("Transactional typed state typed-array item is not numeric");
        }
        array[index] = value;
      }
      return array;
    }
    case "array":
      return Object.freeze(
        node.items.map((item) => rehydrateNode(item, image)),
      );
    case "record": {
      const record = node.nullPrototype
        ? Object.create(null) as Record<string, unknown>
        : {} as Record<string, unknown>;
      for (const entry of node.entries) {
        record[entry.key] = rehydrateNode(entry.node, image);
      }
      return Object.freeze(record);
    }
  }
}

function compileNode(
  value: unknown,
  path: readonly FlatNumericalPathSegmentV1[],
  layout: FlatNumericalStateLayoutV1,
): TypedStateNodeV1 {
  const pathPointer = pointer(path);
  const dynamicIndex = slotIndex(layout.excludedDynamicRoots, pathPointer);
  if (dynamicIndex !== -1) {
    return Object.freeze({ kind: "dynamic" as const, slotIndex: dynamicIndex });
  }
  if (typeof value === "number") {
    return Object.freeze({
      kind: "f64" as const,
      slotIndex: requiredSlotIndex(layout.continuousSlots, pathPointer),
    });
  }
  if (typeof value === "boolean") {
    return Object.freeze({
      kind: "boolean" as const,
      slotIndex: requiredSlotIndex(layout.booleanSlots, pathPointer),
    });
  }
  if (typeof value === "string") {
    return Object.freeze({
      kind: "string" as const,
      slotIndex: requiredSlotIndex(layout.stringSlots, pathPointer),
    });
  }
  if (isNumericTypedArray(value)) {
    const items = Array.from(
      { length: value.length },
      (_, index) => compileNode(value[index], [...path, index], layout),
    );
    return Object.freeze({
      kind: "typed-array" as const,
      constructorTag: value.constructor.name as NumericTypedArrayTagV1,
      items: Object.freeze(items),
    });
  }
  if (Array.isArray(value)) {
    return Object.freeze({
      kind: "array" as const,
      items: Object.freeze(value.map((item, index) =>
        compileNode(item, [...path, index], layout))),
    });
  }
  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) {
      throw new Error(
        `Transactional typed state ${pathPointer} has an unsupported record prototype`,
      );
    }
    const entries = Object.keys(value).sort().map((key) => Object.freeze({
      key,
      node: compileNode(requiredOwnValue(value, key, path), [...path, key], layout),
    }));
    return Object.freeze({
      kind: "record" as const,
      nullPrototype: prototype === null,
      entries: Object.freeze(entries),
    });
  }
  throw new Error(`Transactional typed state ${pathPointer} has no compiled node`);
}

function createImageLayout(
  layout: FlatNumericalStateLayoutV1,
  stringArenaCapacityBytes: number,
  dynamicArenaCapacityBytes: number,
): TypedStateImageLayoutV1 {
  let offset = 0;
  const continuousByteOffset = align(offset, 8);
  offset = continuousByteOffset + layout.continuousSlots.length * 8;
  const booleanByteOffset = offset;
  offset += layout.booleanSlots.length;
  const stringMetadataByteOffset = align(offset, 4);
  offset = stringMetadataByteOffset + layout.stringSlots.length * 2 * 4;
  const dynamicMetadataByteOffset = align(offset, 4);
  offset = dynamicMetadataByteOffset
    + layout.excludedDynamicRoots.length * 2 * 4;
  const stringArenaByteOffset = offset;
  offset += stringArenaCapacityBytes;
  const dynamicArenaByteOffset = offset;
  offset += dynamicArenaCapacityBytes;
  return Object.freeze({
    continuousByteOffset,
    booleanByteOffset,
    stringMetadataByteOffset,
    dynamicMetadataByteOffset,
    stringArenaByteOffset,
    dynamicArenaByteOffset,
    bufferByteLength: offset,
  });
}

function createImage(manifest: TransactionalTypedStateManifestV1): MutableImageV1 {
  const layout = manifest.numericalLayout;
  const offsets = manifest.imageLayout;
  const buffer = new ArrayBuffer(offsets.bufferByteLength);
  return Object.freeze({
    buffer,
    continuous: new Float64Array(
      buffer,
      offsets.continuousByteOffset,
      layout.continuousSlots.length,
    ),
    booleans: new Uint8Array(
      buffer,
      offsets.booleanByteOffset,
      layout.booleanSlots.length,
    ),
    stringMetadata: new Uint32Array(
      buffer,
      offsets.stringMetadataByteOffset,
      layout.stringSlots.length * 2,
    ),
    dynamicMetadata: new Uint32Array(
      buffer,
      offsets.dynamicMetadataByteOffset,
      layout.excludedDynamicRoots.length * 2,
    ),
    stringArena: new Uint8Array(
      buffer,
      offsets.stringArenaByteOffset,
      manifest.stringArenaCapacityBytes,
    ),
    dynamicArena: new Uint8Array(
      buffer,
      offsets.dynamicArenaByteOffset,
      manifest.dynamicArenaCapacityBytes,
    ),
  });
}

function createNumericTypedArray(
  tag: NumericTypedArrayTagV1,
  length: number,
): NumericTypedArrayV1 {
  switch (tag) {
    case "Float64Array": return new Float64Array(length);
    case "Float32Array": return new Float32Array(length);
    case "Int32Array": return new Int32Array(length);
    case "Uint32Array": return new Uint32Array(length);
    case "Int16Array": return new Int16Array(length);
    case "Uint16Array": return new Uint16Array(length);
    case "Int8Array": return new Int8Array(length);
    case "Uint8Array": return new Uint8Array(length);
    case "Uint8ClampedArray": return new Uint8ClampedArray(length);
  }
}

function isNumericTypedArray(value: unknown): value is NumericTypedArrayV1 {
  return value instanceof Float64Array
    || value instanceof Float32Array
    || value instanceof Int32Array
    || value instanceof Uint32Array
    || value instanceof Int16Array
    || value instanceof Uint16Array
    || value instanceof Int8Array
    || value instanceof Uint8Array
    || value instanceof Uint8ClampedArray;
}

function requiredOwnValue(
  record: object,
  key: string,
  path: readonly FlatNumericalPathSegmentV1[],
): unknown {
  const descriptor = Object.getOwnPropertyDescriptor(record, key);
  if (descriptor === undefined || !("value" in descriptor)) {
    throw new Error(
      `Transactional typed state ${pointer([...path, key])} is unavailable`,
    );
  }
  return descriptor.value;
}

function slotIndex(
  slots: readonly Readonly<{ pointer: string }>[],
  pathPointer: string,
): number {
  return slots.findIndex((slot) => slot.pointer === pathPointer);
}

function requiredSlotIndex(
  slots: readonly Readonly<{ pointer: string }>[],
  pathPointer: string,
): number {
  const index = slotIndex(slots, pathPointer);
  if (index === -1) {
    throw new Error(`Transactional typed state ${pathPointer} has no slot`);
  }
  return index;
}

function assertWellFormedString(value: string, pathPointer: string): void {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code >= 0xd800 && code <= 0xdbff) {
      const next = value.charCodeAt(index + 1);
      if (!(next >= 0xdc00 && next <= 0xdfff)) {
        throw new Error(
          `Transactional typed state ${pathPointer} contains an unpaired surrogate`,
        );
      }
      index += 1;
    } else if (code >= 0xdc00 && code <= 0xdfff) {
      throw new Error(
        `Transactional typed state ${pathPointer} contains an unpaired surrogate`,
      );
    }
  }
}

function assertArenaCapacity(capacity: number, owner: string): void {
  if (
    !Number.isSafeInteger(capacity)
    || capacity < 1
    || capacity > MAX_ARENA_CAPACITY_BYTES
  ) {
    throw new Error(`Transactional typed state ${owner} arena capacity is invalid`);
  }
}

function align(value: number, alignment: number): number {
  return Math.ceil(value / alignment) * alignment;
}

function pointer(path: readonly FlatNumericalPathSegmentV1[]): string {
  if (path.length === 0) return "/";
  return `/${path.map((segment) => String(segment)
    .replaceAll("~", "~0")
    .replaceAll("/", "~1")).join("/")}`;
}

function manifestFingerprint(
  layout: FlatNumericalStateLayoutV1,
  stringCapacity: number,
  dynamicCapacity: number,
): string {
  const canonical = [
    `layout:${layout.layoutId}`,
    `string-capacity:${stringCapacity}`,
    `dynamic-capacity:${dynamicCapacity}`,
    ...layout.continuousSlots.map(({ pointer: value }) => `f64:${value}`),
    ...layout.booleanSlots.map(({ pointer: value }) => `bool:${value}`),
    ...layout.stringSlots.map(({ pointer: value }) => `string:${value}`),
    ...layout.excludedDynamicRoots.map(({ pointer: value }) => `dynamic:${value}`),
    ...layout.containers.map((container) => [
      "container",
      container.pointer,
      container.kind,
      container.prototypeTag ?? "null",
      container.keys.join(","),
    ].join(":")),
  ].join("\n");
  let hash = 0x811c9dc5;
  for (const byte of UTF8_ENCODER.encode(canonical)) {
    hash ^= byte;
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return `fnv1a32-${hash.toString(16).padStart(8, "0")}`;
}
