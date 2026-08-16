export const FLAT_NUMERICAL_STATE_LAYOUT_V1_SCHEMA_ID =
  "circleheart-flat-numerical-state-layout-v1" as const;

export type FlatNumericalPathSegmentV1 = string | number;

export type FlatNumericalSlotV1 = Readonly<{
  path: readonly FlatNumericalPathSegmentV1[];
  pointer: string;
  optionalRecordRootIndex: number | null;
  boundedArrayRootIndex: number | null;
  boundedArrayItemIndex: number | null;
}>;

export type FlatNumericalContainerV1 = Readonly<{
  path: readonly FlatNumericalPathSegmentV1[];
  pointer: string;
  kind: "array" | "record" | "typed-array";
  keys: readonly string[];
  prototypeTag: string | null;
  optionalRecordRootIndex: number | null;
  boundedArrayRootIndex: number | null;
  boundedArrayItemIndex: number | null;
}>;

export type FlatNumericalOptionalRecordRootV1 = Readonly<{
  path: readonly FlatNumericalPathSegmentV1[];
  pointer: string;
  template: Readonly<Record<string, unknown>>;
}>;

export type FlatNumericalOptionalRecordTemplateV1 = Readonly<{
  pointer: string;
  template: Readonly<Record<string, unknown>>;
}>;

export type FlatNumericalBoundedArrayRootV1 = Readonly<{
  path: readonly FlatNumericalPathSegmentV1[];
  pointer: string;
  capacity: number;
  itemTemplate: unknown;
}>;

export type FlatNumericalBoundedArrayTemplateV1 = Readonly<{
  pointer: string;
  capacity: number;
  itemTemplate: unknown;
}>;

export type FlatNumericalExternalImmutableAliasV1 = Readonly<{
  /** Mutable-state field rehydrated from the immutable source binding. */
  pointer: string;
  /** Exact pointer at or below an admitted external-immutable root. */
  sourcePointer: string;
  sourcePath: readonly FlatNumericalPathSegmentV1[];
}>;

export type FlatNumericalExternalImmutableAliasInputV1 = Readonly<{
  pointer: string;
  sourcePointer: string;
}>;

/**
 * Deterministic structural map used by the first flat-kernel vertical slice.
 * It deliberately contains no model objects or executable callbacks.
 */
export type FlatNumericalStateLayoutV1 = Readonly<{
  schemaId: typeof FLAT_NUMERICAL_STATE_LAYOUT_V1_SCHEMA_ID;
  layoutId: string;
  continuousSlots: readonly FlatNumericalSlotV1[];
  /** Explicit nullable numeric leaves represented by value + presence slots. */
  nullableContinuousSlots: readonly FlatNumericalSlotV1[];
  /** Explicit nullable string leaves represented by code + presence slots. */
  nullableStringSlots: readonly FlatNumericalSlotV1[];
  /** Fixed-shape records represented by one presence byte plus typed leaves. */
  optionalRecordRoots: readonly FlatNumericalOptionalRecordRootV1[];
  /** Variable-length arrays represented by one length plus fixed item slots. */
  boundedArrayRoots: readonly FlatNumericalBoundedArrayRootV1[];
  booleanSlots: readonly FlatNumericalSlotV1[];
  stringSlots: readonly FlatNumericalSlotV1[];
  /** Deeply immutable model-owned roots retained outside the hot images. */
  externalImmutableRoots: readonly FlatNumericalSlotV1[];
  /** Aliases that rebind nested immutable owner configuration on rehydrate. */
  externalImmutableAliases:
    readonly FlatNumericalExternalImmutableAliasV1[];
  /** Nullable or variable-array roots reserved for explicit tagged layouts later. */
  excludedDynamicRoots: readonly FlatNumericalSlotV1[];
  containers: readonly FlatNumericalContainerV1[];
}>;

export type FlatNumericalStateLayoutOptionsV1 = Readonly<{
  /** Model-owned ordinary arrays whose exact length is part of the layout. */
  fixedArrayPointers?: readonly string[];
  /** Deeply immutable roots whose identity is not part of accepted evolution. */
  externalImmutablePointers?: readonly string[];
  /** Nested owner fields rebound from an admitted immutable configuration. */
  externalImmutableAliases?:
    readonly FlatNumericalExternalImmutableAliasInputV1[];
  /** Null reference leaves that may evolve to finite numbers. */
  nullableContinuousPointers?: readonly string[];
  /** Null reference leaves that may evolve to strings. */
  nullableStringPointers?: readonly string[];
  /** Null record roots that may evolve to the supplied exact fixed shape. */
  optionalRecordTemplates?: readonly FlatNumericalOptionalRecordTemplateV1[];
  /** Variable arrays with explicit capacity and one exact item shape. */
  boundedArrayTemplates?: readonly FlatNumericalBoundedArrayTemplateV1[];
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
  const nullableContinuousSlots: FlatNumericalSlotV1[] = [];
  const nullableStringSlots: FlatNumericalSlotV1[] = [];
  const optionalRecordRoots: FlatNumericalOptionalRecordRootV1[] = [];
  const boundedArrayRoots: FlatNumericalBoundedArrayRootV1[] = [];
  const booleanSlots: FlatNumericalSlotV1[] = [];
  const stringSlots: FlatNumericalSlotV1[] = [];
  const externalImmutableRoots: FlatNumericalSlotV1[] = [];
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
  const admittedExternalImmutableBindings = pointerSet(
    options.externalImmutablePointers,
    "external-immutable",
  );
  const externalImmutableAliases = externalImmutableAliasMap(
    options.externalImmutableAliases,
    admittedExternalImmutableBindings,
  );
  const externalImmutablePointers = new Set(
    admittedExternalImmutableBindings,
  );
  for (const targetPointer of externalImmutableAliases.keys()) {
    if (externalImmutablePointers.has(targetPointer)) {
      throw new Error(
        "Flat numerical external-immutable alias target is duplicated",
      );
    }
    externalImmutablePointers.add(targetPointer);
  }
  const admittedExternalImmutablePointers = new Set<string>();
  const nullableContinuousPointers = pointerSet(
    options.nullableContinuousPointers,
    "nullable-continuous",
  );
  const admittedNullableContinuousPointers = new Set<string>();
  const nullableStringPointers = pointerSet(
    options.nullableStringPointers,
    "nullable-string",
  );
  const admittedNullableStringPointers = new Set<string>();
  const optionalRecordTemplates = optionalRecordTemplateMap(
    options.optionalRecordTemplates,
  );
  const admittedOptionalRecordPointers = new Set<string>();
  const boundedArrayTemplates = boundedArrayTemplateMap(
    options.boundedArrayTemplates,
  );
  const admittedBoundedArrayPointers = new Set<string>();

  visit(referenceState, [], {
    continuousSlots,
    nullableContinuousSlots,
    nullableStringSlots,
    optionalRecordRoots,
    boundedArrayRoots,
    booleanSlots,
    stringSlots,
    externalImmutableRoots,
    excludedDynamicRoots,
    containers,
    fixedArrayPointers,
    admittedFixedArrayPointers,
    externalImmutablePointers,
    externalImmutableAliases,
    admittedExternalImmutablePointers,
    nullableContinuousPointers,
    admittedNullableContinuousPointers,
    nullableStringPointers,
    admittedNullableStringPointers,
    optionalRecordTemplates,
    admittedOptionalRecordPointers,
    boundedArrayTemplates,
    admittedBoundedArrayPointers,
  });
  for (const fixedArrayPointer of fixedArrayPointers) {
    if (!admittedFixedArrayPointers.has(fixedArrayPointer)) {
      throw new Error(
        `Flat numerical fixed-array ${fixedArrayPointer} is unavailable`,
      );
    }
  }
  for (const externalImmutablePointer of externalImmutablePointers) {
    if (!admittedExternalImmutablePointers.has(externalImmutablePointer)) {
      throw new Error(
        `Flat numerical external-immutable ${externalImmutablePointer} is unavailable`,
      );
    }
  }
  for (const nullableContinuousPointer of nullableContinuousPointers) {
    if (!admittedNullableContinuousPointers.has(nullableContinuousPointer)) {
      throw new Error(
        `Flat numerical nullable-continuous ${nullableContinuousPointer} is unavailable`,
      );
    }
  }
  for (const nullableStringPointer of nullableStringPointers) {
    if (!admittedNullableStringPointers.has(nullableStringPointer)) {
      throw new Error(
        `Flat numerical nullable-string ${nullableStringPointer} is unavailable`,
      );
    }
  }
  for (const optionalRecordPointer of optionalRecordTemplates.keys()) {
    if (!admittedOptionalRecordPointers.has(optionalRecordPointer)) {
      throw new Error(
        `Flat numerical optional-record ${optionalRecordPointer} is unavailable`,
      );
    }
  }
  for (const boundedArrayPointer of boundedArrayTemplates.keys()) {
    if (!admittedBoundedArrayPointers.has(boundedArrayPointer)) {
      throw new Error(
        `Flat numerical bounded-array ${boundedArrayPointer} is unavailable`,
      );
    }
  }
  if (continuousSlots.length === 0) {
    throw new Error("Flat numerical state contains no continuous slots");
  }
  const layout = Object.freeze({
    schemaId: FLAT_NUMERICAL_STATE_LAYOUT_V1_SCHEMA_ID,
    layoutId,
    continuousSlots: Object.freeze(continuousSlots),
    nullableContinuousSlots: Object.freeze(nullableContinuousSlots),
    nullableStringSlots: Object.freeze(nullableStringSlots),
    optionalRecordRoots: Object.freeze(optionalRecordRoots),
    boundedArrayRoots: Object.freeze(boundedArrayRoots),
    booleanSlots: Object.freeze(booleanSlots),
    stringSlots: Object.freeze(stringSlots),
    externalImmutableRoots: Object.freeze(externalImmutableRoots),
    externalImmutableAliases: Object.freeze(
      [...externalImmutableAliases.values()].sort((left, right) =>
        left.pointer.localeCompare(right.pointer)),
    ),
    excludedDynamicRoots: Object.freeze(excludedDynamicRoots),
    containers: Object.freeze(containers),
  });
  assertFlatNumericalStateShapeV1(layout, referenceState);
  return layout;
}

/**
 * Verifies every fixed-topology container before a candidate is projected.
 * Dynamic roots are explicit cut points and are validated by their owner.
 */
export function assertFlatNumericalStateShapeV1(
  layout: FlatNumericalStateLayoutV1,
  state: unknown,
): void {
  for (const root of layout.optionalRecordRoots) {
    const value = readFlatNumericalStatePathV1(state, root.path);
    if (
      value !== null
      && (typeof value !== "object" || Array.isArray(value))
    ) {
      throw new Error(
        `Flat numerical state ${root.pointer} must be null or a record`,
      );
    }
  }
  for (const root of layout.boundedArrayRoots) {
    const value = readFlatNumericalStatePathV1(state, root.path);
    if (!Array.isArray(value)) {
      throw new Error(
        `Flat numerical state ${root.pointer} must remain an array`,
      );
    }
    assertDataProperties(value, root.path, true);
    const keys = Array.from({ length: value.length }, (_, index) => String(index));
    if (!sameStrings(Object.keys(value), keys)) {
      throw new Error(
        `Flat numerical state ${root.pointer} changed bounded-array shape`,
      );
    }
    if (value.length > root.capacity) {
      throw new Error(
        `Flat numerical state ${root.pointer} exceeds bounded-array capacity`,
      );
    }
  }
  for (const container of layout.containers) {
    if (layoutEntryAbsent(layout, state, container)) {
      continue;
    }
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

function visit(
  value: unknown,
  path: readonly FlatNumericalPathSegmentV1[],
  destination: {
    continuousSlots: FlatNumericalSlotV1[];
    nullableContinuousSlots: FlatNumericalSlotV1[];
    nullableStringSlots: FlatNumericalSlotV1[];
    optionalRecordRoots: FlatNumericalOptionalRecordRootV1[];
    boundedArrayRoots: FlatNumericalBoundedArrayRootV1[];
    booleanSlots: FlatNumericalSlotV1[];
    stringSlots: FlatNumericalSlotV1[];
    externalImmutableRoots: FlatNumericalSlotV1[];
    excludedDynamicRoots: FlatNumericalSlotV1[];
    containers: FlatNumericalContainerV1[];
    fixedArrayPointers: ReadonlySet<string>;
    admittedFixedArrayPointers: Set<string>;
    externalImmutablePointers: ReadonlySet<string>;
    externalImmutableAliases:
      ReadonlyMap<string, FlatNumericalExternalImmutableAliasV1>;
    admittedExternalImmutablePointers: Set<string>;
    nullableContinuousPointers: ReadonlySet<string>;
    admittedNullableContinuousPointers: Set<string>;
    nullableStringPointers: ReadonlySet<string>;
    admittedNullableStringPointers: Set<string>;
    optionalRecordTemplates:
      ReadonlyMap<string, Readonly<Record<string, unknown>>>;
    admittedOptionalRecordPointers: Set<string>;
    boundedArrayTemplates:
      ReadonlyMap<string, FlatNumericalBoundedArrayTemplateV1>;
    admittedBoundedArrayPointers: Set<string>;
  },
  optionalRecordRootIndex: number | null = null,
  compilingOptionalPointer: string | null = null,
  boundedArrayRootIndex: number | null = null,
  boundedArrayItemIndex: number | null = null,
  compilingBoundedArrayPointer: string | null = null,
): void {
  const pathPointer = pointer(path);
  const optionalTemplate = destination.optionalRecordTemplates.get(pathPointer);
  if (
    optionalTemplate !== undefined
    && compilingOptionalPointer !== pathPointer
  ) {
    if (optionalRecordRootIndex !== null || boundedArrayRootIndex !== null) {
      throw new Error(
        `Flat numerical optional-record ${pathPointer} may not be nested`,
      );
    }
    if (
      value !== null
      && (typeof value !== "object" || Array.isArray(value))
    ) {
      throw new Error(
        `Flat numerical optional-record ${pathPointer} reference must be null or a record`,
      );
    }
    const nextOptionalRootIndex = destination.optionalRecordRoots.length;
    destination.optionalRecordRoots.push(Object.freeze({
      path: Object.freeze([...path]),
      pointer: pathPointer,
      template: optionalTemplate,
    }));
    destination.admittedOptionalRecordPointers.add(pathPointer);
    visit(
      optionalTemplate,
      path,
      destination,
      nextOptionalRootIndex,
      pathPointer,
      boundedArrayRootIndex,
      boundedArrayItemIndex,
      compilingBoundedArrayPointer,
    );
    return;
  }
  const boundedArrayTemplate = destination.boundedArrayTemplates.get(pathPointer);
  if (
    boundedArrayTemplate !== undefined
    && compilingBoundedArrayPointer !== pathPointer
  ) {
    if (optionalRecordRootIndex !== null || boundedArrayRootIndex !== null) {
      throw new Error(
        `Flat numerical bounded-array ${pathPointer} may not be nested`,
      );
    }
    if (!Array.isArray(value)) {
      throw new Error(
        `Flat numerical bounded-array ${pathPointer} reference must be an array`,
      );
    }
    assertDataProperties(value, path, true);
    const keys = Array.from({ length: value.length }, (_, index) => String(index));
    if (!sameStrings(Object.keys(value), keys)) {
      throw new Error(
        `Flat numerical state ${pathPointer} changed bounded-array shape`,
      );
    }
    if (value.length > boundedArrayTemplate.capacity) {
      throw new Error(
        `Flat numerical state ${pathPointer} exceeds bounded-array capacity`,
      );
    }
    const nextBoundedArrayRootIndex = destination.boundedArrayRoots.length;
    destination.boundedArrayRoots.push(Object.freeze({
      path: Object.freeze([...path]),
      pointer: pathPointer,
      capacity: boundedArrayTemplate.capacity,
      itemTemplate: boundedArrayTemplate.itemTemplate,
    }));
    destination.admittedBoundedArrayPointers.add(pathPointer);
    for (let index = 0; index < boundedArrayTemplate.capacity; index += 1) {
      visit(
        boundedArrayTemplate.itemTemplate,
        [...path, index],
        destination,
        optionalRecordRootIndex,
        compilingOptionalPointer,
        nextBoundedArrayRootIndex,
        index,
        pathPointer,
      );
    }
    return;
  }
  if (destination.externalImmutablePointers.has(pathPointer)) {
    if (
      boundedArrayRootIndex !== null
      || (
        optionalRecordRootIndex !== null
        && !destination.externalImmutableAliases.has(pathPointer)
      )
    ) {
      throw new Error(
        `Flat numerical typed aggregate ${pathPointer} may not contain an external immutable root`,
      );
    }
    if (
      value === undefined
      || typeof value === "function"
      || typeof value === "symbol"
      || typeof value === "bigint"
    ) {
      throw new Error(
        `Flat numerical external-immutable ${pathPointer} is unsupported`,
      );
    }
    destination.externalImmutableRoots.push(slot(
      path,
      optionalRecordRootIndex,
      boundedArrayRootIndex,
      boundedArrayItemIndex,
    ));
    destination.admittedExternalImmutablePointers.add(pathPointer);
    return;
  }
  if (destination.nullableContinuousPointers.has(pathPointer)) {
    if (value !== null) {
      throw new Error(
        `Flat numerical nullable-continuous ${pathPointer} reference must be null`,
      );
    }
    destination.nullableContinuousSlots.push(slot(
      path,
      optionalRecordRootIndex,
      boundedArrayRootIndex,
      boundedArrayItemIndex,
    ));
    destination.admittedNullableContinuousPointers.add(pathPointer);
    return;
  }
  if (destination.nullableStringPointers.has(pathPointer)) {
    if (value !== null) {
      throw new Error(
        `Flat numerical nullable-string ${pathPointer} reference must be null`,
      );
    }
    destination.nullableStringSlots.push(slot(
      path,
      optionalRecordRootIndex,
      boundedArrayRootIndex,
      boundedArrayItemIndex,
    ));
    destination.admittedNullableStringPointers.add(pathPointer);
    return;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new Error(`Flat numerical state ${pointer(path)} must be finite`);
    }
    destination.continuousSlots.push(slot(
      path,
      optionalRecordRootIndex,
      boundedArrayRootIndex,
      boundedArrayItemIndex,
    ));
    return;
  }
  if (typeof value === "boolean") {
    destination.booleanSlots.push(slot(
      path,
      optionalRecordRootIndex,
      boundedArrayRootIndex,
      boundedArrayItemIndex,
    ));
    return;
  }
  if (typeof value === "string") {
    destination.stringSlots.push(slot(
      path,
      optionalRecordRootIndex,
      boundedArrayRootIndex,
      boundedArrayItemIndex,
    ));
    return;
  }
  if (value === null) {
    if (boundedArrayRootIndex !== null) {
      throw new Error(
        `Flat numerical bounded-array item ${pathPointer} may not contain a dynamic root`,
      );
    }
    destination.excludedDynamicRoots.push(slot(
      path,
      optionalRecordRootIndex,
      boundedArrayRootIndex,
      boundedArrayItemIndex,
    ));
    return;
  }
  if (Array.isArray(value)) {
    if (!destination.fixedArrayPointers.has(pathPointer)) {
      if (boundedArrayRootIndex !== null) {
        throw new Error(
          `Flat numerical bounded-array item ${pathPointer} may not contain a dynamic root`,
        );
      }
      destination.excludedDynamicRoots.push(slot(
        path,
        optionalRecordRootIndex,
        boundedArrayRootIndex,
        boundedArrayItemIndex,
      ));
      return;
    }
    assertDataProperties(value, path, true);
    const keys = Array.from({ length: value.length }, (_, index) => String(index));
    if (!sameStrings(Object.keys(value), keys)) {
      throw new Error(`Flat numerical state ${pathPointer} changed array shape`);
    }
    destination.containers.push(container(
      path,
      "array",
      keys,
      null,
      optionalRecordRootIndex,
      boundedArrayRootIndex,
      boundedArrayItemIndex,
    ));
    destination.admittedFixedArrayPointers.add(pathPointer);
    for (let index = 0; index < value.length; index += 1) {
      visit(
        value[index],
        [...path, index],
        destination,
        optionalRecordRootIndex,
        compilingOptionalPointer,
        boundedArrayRootIndex,
        boundedArrayItemIndex,
        compilingBoundedArrayPointer,
      );
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
      optionalRecordRootIndex,
      boundedArrayRootIndex,
      boundedArrayItemIndex,
    ));
    for (let index = 0; index < value.length; index += 1) {
      visit(
        value[index],
        [...path, index],
        destination,
        optionalRecordRootIndex,
        compilingOptionalPointer,
        boundedArrayRootIndex,
        boundedArrayItemIndex,
        compilingBoundedArrayPointer,
      );
    }
    return;
  }
  if (typeof value === "object") {
    const prototypeTag = dataRecordPrototypeTag(value, path);
    assertDataProperties(value, path, false);
    const keys = Object.keys(value).sort();
    destination.containers.push(container(
      path,
      "record",
      keys,
      prototypeTag,
      optionalRecordRootIndex,
      boundedArrayRootIndex,
      boundedArrayItemIndex,
    ));
    for (const key of keys) {
      visit(
        requiredOwnValue(value, key, path),
        [...path, key],
        destination,
        optionalRecordRootIndex,
        compilingOptionalPointer,
        boundedArrayRootIndex,
        boundedArrayItemIndex,
        compilingBoundedArrayPointer,
      );
    }
    return;
  }
  throw new Error(`Flat numerical state ${pointer(path)} has an unsupported leaf`);
}

function pointerSet(
  pointers: readonly string[] | undefined,
  owner: string,
): ReadonlySet<string> {
  const values = new Set(
    pointers?.map((value) => {
      if (
        typeof value !== "string"
        || value === "/"
        || !value.startsWith("/")
      ) {
        throw new Error(`Flat numerical ${owner} pointer is invalid`);
      }
      return value;
    }) ?? [],
  );
  if (values.size !== (pointers?.length ?? 0)) {
    throw new Error(`Flat numerical ${owner} pointer is duplicated`);
  }
  return values;
}

function externalImmutableAliasMap(
  aliases: readonly FlatNumericalExternalImmutableAliasInputV1[] | undefined,
  admittedBindings: ReadonlySet<string>,
): ReadonlyMap<string, FlatNumericalExternalImmutableAliasV1> {
  const values = new Map<string, FlatNumericalExternalImmutableAliasV1>();
  for (const entry of aliases ?? []) {
    const targetPath = pointerPath(entry.pointer, "alias target");
    const sourcePath = pointerPath(entry.sourcePointer, "alias source");
    if (entry.pointer === entry.sourcePointer) {
      throw new Error("Flat numerical external-immutable alias is self-referential");
    }
    if (values.has(entry.pointer)) {
      throw new Error("Flat numerical external-immutable alias target is duplicated");
    }
    if (![...admittedBindings].some((bindingPointer) =>
      entry.sourcePointer === bindingPointer
      || entry.sourcePointer.startsWith(`${bindingPointer}/`)
    )) {
      throw new Error(
        `Flat numerical external-immutable alias source ${entry.sourcePointer} is not admitted`,
      );
    }
    values.set(entry.pointer, Object.freeze({
      pointer: pointer(targetPath),
      sourcePointer: pointer(sourcePath),
      sourcePath: Object.freeze(sourcePath),
    }));
  }
  return values;
}

function pointerPath(
  value: string,
  owner: string,
): FlatNumericalPathSegmentV1[] {
  if (typeof value !== "string" || value === "/" || !value.startsWith("/")) {
    throw new Error(`Flat numerical external-immutable ${owner} is invalid`);
  }
  return value.slice(1).split("/").map((segment) => {
    if (/~(?:[^01]|$)/u.test(segment)) {
      throw new Error(`Flat numerical external-immutable ${owner} is invalid`);
    }
    return segment.replaceAll("~1", "/").replaceAll("~0", "~");
  });
}

function optionalRecordTemplateMap(
  templates: readonly FlatNumericalOptionalRecordTemplateV1[] | undefined,
): ReadonlyMap<string, Readonly<Record<string, unknown>>> {
  const values = new Map<string, Readonly<Record<string, unknown>>>();
  for (const entry of templates ?? []) {
    if (
      typeof entry.pointer !== "string"
      || entry.pointer === "/"
      || !entry.pointer.startsWith("/")
    ) {
      throw new Error("Flat numerical optional-record pointer is invalid");
    }
    if (
      entry.template === null
      || typeof entry.template !== "object"
      || Array.isArray(entry.template)
    ) {
      throw new Error(
        `Flat numerical optional-record ${entry.pointer} template is invalid`,
      );
    }
    if (values.has(entry.pointer)) {
      throw new Error("Flat numerical optional-record pointer is duplicated");
    }
    values.set(entry.pointer, entry.template);
  }
  return values;
}

function boundedArrayTemplateMap(
  templates: readonly FlatNumericalBoundedArrayTemplateV1[] | undefined,
): ReadonlyMap<string, FlatNumericalBoundedArrayTemplateV1> {
  const values = new Map<string, FlatNumericalBoundedArrayTemplateV1>();
  for (const entry of templates ?? []) {
    if (
      typeof entry.pointer !== "string"
      || entry.pointer === "/"
      || !entry.pointer.startsWith("/")
    ) {
      throw new Error("Flat numerical bounded-array pointer is invalid");
    }
    if (
      !Number.isSafeInteger(entry.capacity)
      || entry.capacity < 1
      || entry.capacity > 0xffff_ffff
    ) {
      throw new Error(
        `Flat numerical bounded-array ${entry.pointer} capacity is invalid`,
      );
    }
    if (entry.itemTemplate === undefined) {
      throw new Error(
        `Flat numerical bounded-array ${entry.pointer} item template is invalid`,
      );
    }
    if (values.has(entry.pointer)) {
      throw new Error("Flat numerical bounded-array pointer is duplicated");
    }
    values.set(entry.pointer, Object.freeze({
      pointer: entry.pointer,
      capacity: entry.capacity,
      itemTemplate: entry.itemTemplate,
    }));
  }
  return values;
}

function layoutEntryAbsent(
  layout: FlatNumericalStateLayoutV1,
  state: unknown,
  entry: FlatNumericalSlotV1 | FlatNumericalContainerV1,
): boolean {
  if (entry.optionalRecordRootIndex !== null) {
    const root = layout.optionalRecordRoots[entry.optionalRecordRootIndex];
    if (root === undefined) {
      throw new Error("Flat numerical optional-record slot owner is invalid");
    }
    if (readFlatNumericalStatePathV1(state, root.path) === null) return true;
  }
  if (entry.boundedArrayRootIndex !== null) {
    const root = layout.boundedArrayRoots[entry.boundedArrayRootIndex];
    if (root === undefined || entry.boundedArrayItemIndex === null) {
      throw new Error("Flat numerical bounded-array slot owner is invalid");
    }
    const value = readFlatNumericalStatePathV1(state, root.path);
    if (!Array.isArray(value)) {
      throw new Error(
        `Flat numerical state ${root.pointer} must remain an array`,
      );
    }
    return entry.boundedArrayItemIndex >= value.length;
  }
  return false;
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

function slot(
  path: readonly FlatNumericalPathSegmentV1[],
  optionalRecordRootIndex: number | null = null,
  boundedArrayRootIndex: number | null = null,
  boundedArrayItemIndex: number | null = null,
): FlatNumericalSlotV1 {
  const ownedPath = Object.freeze([...path]);
  return Object.freeze({
    path: ownedPath,
    pointer: pointer(ownedPath),
    optionalRecordRootIndex,
    boundedArrayRootIndex,
    boundedArrayItemIndex,
  });
}

function container(
  path: readonly FlatNumericalPathSegmentV1[],
  kind: FlatNumericalContainerV1["kind"],
  keys: readonly string[],
  prototypeTag: string | null = null,
  optionalRecordRootIndex: number | null = null,
  boundedArrayRootIndex: number | null = null,
  boundedArrayItemIndex: number | null = null,
): FlatNumericalContainerV1 {
  const ownedPath = Object.freeze([...path]);
  return Object.freeze({
    path: ownedPath,
    pointer: pointer(ownedPath),
    kind,
    keys: Object.freeze([...keys]),
    prototypeTag,
    optionalRecordRootIndex,
    boundedArrayRootIndex,
    boundedArrayItemIndex,
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
