export const FLAT_NUMERICAL_STATE_LAYOUT_V1_SCHEMA_ID =
  "circleheart-flat-numerical-state-layout-v1" as const;

export type FlatNumericalPathSegmentV1 = string | number;

export type FlatNumericalSlotV1 = Readonly<{
  path: readonly FlatNumericalPathSegmentV1[];
  pointer: string;
}>;

export type FlatNumericalContainerV1 = Readonly<{
  path: readonly FlatNumericalPathSegmentV1[];
  pointer: string;
  kind: "array" | "record" | "typed-array";
  keys: readonly string[];
  prototypeTag: string | null;
}>;

/**
 * Deterministic structural map used by the first flat-kernel vertical slice.
 * It deliberately contains no model objects or executable callbacks.
 */
export type FlatNumericalStateLayoutV1 = Readonly<{
  schemaId: typeof FLAT_NUMERICAL_STATE_LAYOUT_V1_SCHEMA_ID;
  layoutId: string;
  continuousSlots: readonly FlatNumericalSlotV1[];
  booleanSlots: readonly FlatNumericalSlotV1[];
  stringSlots: readonly FlatNumericalSlotV1[];
  /** Nullable or variable-array roots reserved for explicit tagged layouts later. */
  excludedDynamicRoots: readonly FlatNumericalSlotV1[];
  containers: readonly FlatNumericalContainerV1[];
}>;

export type FlatNumericalStateLayoutOptionsV1 = Readonly<{
  /** Model-owned ordinary arrays whose exact length is part of the layout. */
  fixedArrayPointers?: readonly string[];
}>;

/** Mutable storage owned by one numerical authority. */
export type FlatNumericalStateBufferV1 = Readonly<{
  continuous: Float64Array;
  booleans: Uint8Array;
  strings: Uint32Array;
}>;

/**
 * Phase 1a string codec. Codes are stable for the lifetime of one kernel.
 * A canonical binary checkpoint will own the table in the later cutover.
 */
export type FlatNumericalStringTableV1 = Readonly<{
  codeByValue: Map<string, number>;
  valuesByCode: string[];
}>;

export function createFlatNumericalStateLayoutV1(
  layoutId: string,
  referenceState: unknown,
  options: FlatNumericalStateLayoutOptionsV1 = {},
): FlatNumericalStateLayoutV1 {
  if (layoutId.trim().length === 0) {
    throw new Error("Flat numerical state layoutId is empty");
  }
  const continuousSlots: FlatNumericalSlotV1[] = [];
  const booleanSlots: FlatNumericalSlotV1[] = [];
  const stringSlots: FlatNumericalSlotV1[] = [];
  const excludedDynamicRoots: FlatNumericalSlotV1[] = [];
  const containers: FlatNumericalContainerV1[] = [];
  const fixedArrayPointers = new Set(
    options.fixedArrayPointers?.map((value) => {
      if (typeof value !== "string" || !value.startsWith("/")) {
        throw new Error("Flat numerical fixed-array pointer is invalid");
      }
      return value;
    }) ?? [],
  );
  if (fixedArrayPointers.size !== (options.fixedArrayPointers?.length ?? 0)) {
    throw new Error("Flat numerical fixed-array pointer is duplicated");
  }
  const admittedFixedArrayPointers = new Set<string>();

  visit(referenceState, [], {
    continuousSlots,
    booleanSlots,
    stringSlots,
    excludedDynamicRoots,
    containers,
    fixedArrayPointers,
    admittedFixedArrayPointers,
  });
  for (const fixedArrayPointer of fixedArrayPointers) {
    if (!admittedFixedArrayPointers.has(fixedArrayPointer)) {
      throw new Error(
        `Flat numerical fixed-array ${fixedArrayPointer} is unavailable`,
      );
    }
  }
  if (continuousSlots.length === 0) {
    throw new Error("Flat numerical state contains no continuous slots");
  }
  return Object.freeze({
    schemaId: FLAT_NUMERICAL_STATE_LAYOUT_V1_SCHEMA_ID,
    layoutId,
    continuousSlots: Object.freeze(continuousSlots),
    booleanSlots: Object.freeze(booleanSlots),
    stringSlots: Object.freeze(stringSlots),
    excludedDynamicRoots: Object.freeze(excludedDynamicRoots),
    containers: Object.freeze(containers),
  });
}

export function createFlatNumericalStateBufferV1(
  layout: FlatNumericalStateLayoutV1,
): FlatNumericalStateBufferV1 {
  return Object.freeze({
    continuous: new Float64Array(layout.continuousSlots.length),
    booleans: new Uint8Array(layout.booleanSlots.length),
    strings: new Uint32Array(layout.stringSlots.length),
  });
}

export function createFlatNumericalStringTableV1():
FlatNumericalStringTableV1 {
  return Object.freeze({
    codeByValue: new Map<string, number>(),
    valuesByCode: [],
  });
}

/**
 * Writes every fixed-topology leaf after the complete container topology has passed.
 * Initial null and ordinary-array roots are deliberately excluded: the
 * reference bridge reports them so the production flat schema can reserve
 * explicit presence tags and bounded array storage.
 * A shape error therefore cannot partially update the destination buffer.
 */
export function writeFlatNumericalStateV1(
  layout: FlatNumericalStateLayoutV1,
  state: unknown,
  destination: FlatNumericalStateBufferV1,
  stringTable: FlatNumericalStringTableV1,
): void {
  assertBufferMatchesLayout(layout, destination);
  assertFlatNumericalStateShapeV1(layout, state);

  const continuous = new Float64Array(layout.continuousSlots.length);
  const booleans = new Uint8Array(layout.booleanSlots.length);
  const strings = new Uint32Array(layout.stringSlots.length);
  const stagedStringTable: FlatNumericalStringTableV1 = {
    codeByValue: new Map(stringTable.codeByValue),
    valuesByCode: [...stringTable.valuesByCode],
  };

  for (let index = 0; index < layout.continuousSlots.length; index += 1) {
    const slot = layout.continuousSlots[index]!;
    const value = requiredPathValue(state, slot.path);
    if (typeof value !== "number" || !Number.isFinite(value)) {
      throw new Error(`Flat numerical state ${slot.pointer} must be finite`);
    }
    continuous[index] = value;
  }
  for (let index = 0; index < layout.booleanSlots.length; index += 1) {
    const slot = layout.booleanSlots[index]!;
    const value = requiredPathValue(state, slot.path);
    if (typeof value !== "boolean") {
      throw new Error(`Flat numerical state ${slot.pointer} must be boolean`);
    }
    booleans[index] = value ? 1 : 0;
  }
  for (let index = 0; index < layout.stringSlots.length; index += 1) {
    const slot = layout.stringSlots[index]!;
    const value = requiredPathValue(state, slot.path);
    if (typeof value !== "string") {
      throw new Error(`Flat numerical state ${slot.pointer} must be a string`);
    }
    strings[index] = internString(stagedStringTable, value);
  }
  destination.continuous.set(continuous);
  destination.booleans.set(booleans);
  destination.strings.set(strings);
  stringTable.codeByValue.clear();
  for (const [value, code] of stagedStringTable.codeByValue) {
    stringTable.codeByValue.set(value, code);
  }
  stringTable.valuesByCode.splice(
    0,
    stringTable.valuesByCode.length,
    ...stagedStringTable.valuesByCode,
  );
}

/**
 * Verifies every fixed-topology container before a candidate is projected.
 * Dynamic roots are explicit cut points and are validated by their owner.
 */
export function assertFlatNumericalStateShapeV1(
  layout: FlatNumericalStateLayoutV1,
  state: unknown,
): void {
  for (const container of layout.containers) {
    assertContainerShape(
      readFlatNumericalStatePathV1(state, container.path),
      container,
    );
  }
}

/** Data-only path lookup that never invokes inherited properties or accessors. */
export function readFlatNumericalStatePathV1(
  root: unknown,
  path: readonly FlatNumericalPathSegmentV1[],
): unknown {
  return requiredPathValue(root, path);
}

export function flatNumericalStateBuffersEqualV1(
  left: FlatNumericalStateBufferV1,
  right: FlatNumericalStateBufferV1,
): boolean {
  return typedArraysEqual(left.continuous, right.continuous)
    && typedArraysEqual(left.booleans, right.booleans)
    && typedArraysEqual(left.strings, right.strings);
}

function visit(
  value: unknown,
  path: readonly FlatNumericalPathSegmentV1[],
  destination: {
    continuousSlots: FlatNumericalSlotV1[];
    booleanSlots: FlatNumericalSlotV1[];
    stringSlots: FlatNumericalSlotV1[];
    excludedDynamicRoots: FlatNumericalSlotV1[];
    containers: FlatNumericalContainerV1[];
    fixedArrayPointers: ReadonlySet<string>;
    admittedFixedArrayPointers: Set<string>;
  },
): void {
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new Error(`Flat numerical state ${pointer(path)} must be finite`);
    }
    destination.continuousSlots.push(slot(path));
    return;
  }
  if (typeof value === "boolean") {
    destination.booleanSlots.push(slot(path));
    return;
  }
  if (typeof value === "string") {
    destination.stringSlots.push(slot(path));
    return;
  }
  if (value === null) {
    destination.excludedDynamicRoots.push(slot(path));
    return;
  }
  if (Array.isArray(value)) {
    const pathPointer = pointer(path);
    if (!destination.fixedArrayPointers.has(pathPointer)) {
      destination.excludedDynamicRoots.push(slot(path));
      return;
    }
    assertDataProperties(value, path, true);
    const keys = Array.from({ length: value.length }, (_, index) => String(index));
    if (!sameStrings(Object.keys(value), keys)) {
      throw new Error(`Flat numerical state ${pathPointer} changed array shape`);
    }
    destination.containers.push(container(path, "array", keys));
    destination.admittedFixedArrayPointers.add(pathPointer);
    for (let index = 0; index < value.length; index += 1) {
      visit(value[index], [...path, index], destination);
    }
    return;
  }
  if (isNumericTypedArray(value)) {
    const keys = Array.from({ length: value.length }, (_, index) => String(index));
    destination.containers.push(container(
      path,
      "typed-array",
      keys,
      value.constructor.name,
    ));
    for (let index = 0; index < value.length; index += 1) {
      visit(value[index], [...path, index], destination);
    }
    return;
  }
  if (typeof value === "object") {
    const prototypeTag = dataRecordPrototypeTag(value, path);
    assertDataProperties(value, path, false);
    const keys = Object.keys(value).sort();
    destination.containers.push(container(path, "record", keys, prototypeTag));
    for (const key of keys) {
      visit(requiredOwnValue(value, key, path), [...path, key], destination);
    }
    return;
  }
  throw new Error(`Flat numerical state ${pointer(path)} has an unsupported leaf`);
}

function assertContainerShape(value: unknown, expected: FlatNumericalContainerV1): void {
  if (expected.kind === "array") {
    if (!Array.isArray(value)) {
      throw new Error(`Flat numerical state ${expected.pointer} must remain an array`);
    }
    assertDataProperties(value, expected.path, true);
    if (!sameStrings(Object.keys(value), expected.keys)) {
      throw new Error(`Flat numerical state ${expected.pointer} changed array shape`);
    }
    return;
  }
  if (expected.kind === "typed-array") {
    if (
      !isNumericTypedArray(value)
      || value.constructor.name !== expected.prototypeTag
      || Object.getPrototypeOf(value)
        !== numericTypedArrayPrototype(expected.prototypeTag)
      || value.length !== expected.keys.length
    ) {
      throw new Error(`Flat numerical state ${expected.pointer} changed typed-array shape`);
    }
    assertDataProperties(value, expected.path, false);
    if (!sameStrings(Object.keys(value), expected.keys)) {
      throw new Error(
        `Flat numerical state ${expected.pointer} changed typed-array shape`,
      );
    }
    return;
  }
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`Flat numerical state ${expected.pointer} must remain a record`);
  }
  const prototypeTag = dataRecordPrototypeTag(value, expected.path);
  if (prototypeTag !== expected.prototypeTag) {
    throw new Error(`Flat numerical state ${expected.pointer} changed record prototype`);
  }
  const prototype = Object.getPrototypeOf(value);
  if (
    (expected.prototypeTag === "Object" && prototype !== Object.prototype)
    || (expected.prototypeTag === null && prototype !== null)
  ) {
    throw new Error(`Flat numerical state ${expected.pointer} changed record prototype`);
  }
  assertDataProperties(value, expected.path, false);
  if (!sameStrings(Object.keys(value).sort(), expected.keys)) {
    throw new Error(`Flat numerical state ${expected.pointer} changed record shape`);
  }
}

function assertDataProperties(
  value: object,
  path: readonly FlatNumericalPathSegmentV1[],
  array: boolean,
): void {
  if (Object.getOwnPropertySymbols(value).length !== 0) {
    throw new Error(`Flat numerical state ${pointer(path)} has symbol keys`);
  }
  const allowedNonEnumerable = array ? new Set(["length"]) : new Set<string>();
  for (const key of Object.getOwnPropertyNames(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (descriptor === undefined || !("value" in descriptor)) {
      throw new Error(`Flat numerical state ${pointer([...path, key])} is an accessor`);
    }
    if (!descriptor.enumerable && !allowedNonEnumerable.has(key)) {
      throw new Error(
        `Flat numerical state ${pointer([...path, key])} is non-enumerable`,
      );
    }
  }
}

function requiredPathValue(
  root: unknown,
  path: readonly FlatNumericalPathSegmentV1[],
): unknown {
  let current = root;
  const traversed: FlatNumericalPathSegmentV1[] = [];
  for (const segment of path) {
    if (current === null || typeof current !== "object") {
      throw new Error(`Flat numerical state ${pointer(path)} is unavailable`);
    }
    current = requiredOwnValue(current, String(segment), traversed);
    traversed.push(segment);
  }
  return current;
}

function requiredOwnValue(
  record: object,
  key: string,
  path: readonly FlatNumericalPathSegmentV1[],
): unknown {
  const descriptor = Object.getOwnPropertyDescriptor(record, key);
  if (descriptor === undefined || !("value" in descriptor)) {
    throw new Error(`Flat numerical state ${pointer([...path, key])} is unavailable`);
  }
  return descriptor.value;
}

function internString(table: FlatNumericalStringTableV1, value: string): number {
  const existing = table.codeByValue.get(value);
  if (existing !== undefined) return existing;
  const next = table.valuesByCode.length + 1;
  if (next > 0xffff_ffff) {
    throw new Error("Flat numerical string table exhausted Uint32 codes");
  }
  table.codeByValue.set(value, next);
  table.valuesByCode.push(value);
  return next;
}

function assertBufferMatchesLayout(
  layout: FlatNumericalStateLayoutV1,
  buffer: FlatNumericalStateBufferV1,
): void {
  if (
    buffer.continuous.length !== layout.continuousSlots.length
    || buffer.booleans.length !== layout.booleanSlots.length
    || buffer.strings.length !== layout.stringSlots.length
  ) {
    throw new Error("Flat numerical state buffer does not match its layout");
  }
}

function slot(path: readonly FlatNumericalPathSegmentV1[]): FlatNumericalSlotV1 {
  const ownedPath = Object.freeze([...path]);
  return Object.freeze({ path: ownedPath, pointer: pointer(ownedPath) });
}

function container(
  path: readonly FlatNumericalPathSegmentV1[],
  kind: FlatNumericalContainerV1["kind"],
  keys: readonly string[],
  prototypeTag: string | null = null,
): FlatNumericalContainerV1 {
  const ownedPath = Object.freeze([...path]);
  return Object.freeze({
    path: ownedPath,
    pointer: pointer(ownedPath),
    kind,
    keys: Object.freeze([...keys]),
    prototypeTag,
  });
}

function dataRecordPrototypeTag(
  value: object,
  path: readonly FlatNumericalPathSegmentV1[],
): string | null {
  if (
    value instanceof Date
    || value instanceof Map
    || value instanceof Set
    || value instanceof ArrayBuffer
    || ArrayBuffer.isView(value)
  ) {
    throw new Error(`Flat numerical state ${pointer(path)} is not a data record`);
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype === null) return null;
  const constructorDescriptor = Object.getOwnPropertyDescriptor(
    prototype,
    "constructor",
  );
  const constructor = constructorDescriptor?.value;
  if (typeof constructor !== "function" || constructor.name.length === 0) {
    throw new Error(`Flat numerical state ${pointer(path)} has no record prototype`);
  }
  return constructor.name;
}

function isNumericTypedArray(value: unknown): value is
  | Float64Array
  | Float32Array
  | Int32Array
  | Uint32Array
  | Int16Array
  | Uint16Array
  | Int8Array
  | Uint8Array
  | Uint8ClampedArray {
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

function numericTypedArrayPrototype(tag: string | null): object | null {
  switch (tag) {
    case "Float64Array": return Float64Array.prototype;
    case "Float32Array": return Float32Array.prototype;
    case "Int32Array": return Int32Array.prototype;
    case "Uint32Array": return Uint32Array.prototype;
    case "Int16Array": return Int16Array.prototype;
    case "Uint16Array": return Uint16Array.prototype;
    case "Int8Array": return Int8Array.prototype;
    case "Uint8Array": return Uint8Array.prototype;
    case "Uint8ClampedArray": return Uint8ClampedArray.prototype;
    default: return null;
  }
}

function pointer(path: readonly FlatNumericalPathSegmentV1[]): string {
  if (path.length === 0) return "/";
  return `/${path.map((segment) => String(segment)
    .replaceAll("~", "~0")
    .replaceAll("/", "~1")).join("/")}`;
}

function sameStrings(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length
    && left.every((value, index) => value === right[index]);
}

function typedArraysEqual(
  left: Float64Array | Uint8Array | Uint32Array,
  right: Float64Array | Uint8Array | Uint32Array,
): boolean {
  return left.length === right.length
    && left.every((value, index) => Object.is(value, right[index]));
}
