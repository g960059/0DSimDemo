import type {
  StudioDesiredFixtureV2,
  StudioFixtureActionV2,
  StudioFixtureFieldChangeV2,
  StudioFixturePatchV2,
  StudioFixturePathSegmentV2,
  StudioFixturePathV2,
  StudioFixtureReductionInputV2,
  StudioKnobActionV2,
  StudioScenarioRuntimeContextV2,
  StudioModelFixtureAdapterV2,
} from "@/studio/contracts/v2/runtime";
import type {
  ExactModelRuntimeResolverPortV2,
} from "@/studio/contracts/v2/executable";
import type {
  StudioJsonValueV2,
} from "@/studio/contracts/v2/json";

export type StudioFixtureReductionErrorCodeV2 =
  | "invalid-action"
  | "invalid-json"
  | "invalid-patch"
  | "missing-model-reducer"
  | "model-binding"
  | "model-validation"
  | "unknown-path";

const MAXIMUM_FIXTURE_JSON_DEPTH_V2 = 128;
const PORTABLE_RUNTIME_ID_V2 = /^[A-Za-z0-9][A-Za-z0-9._:/@+-]{0,255}$/;

export class StudioFixtureReductionErrorV2 extends Error {
  readonly code: StudioFixtureReductionErrorCodeV2;

  constructor(
    code: StudioFixtureReductionErrorCodeV2,
    message: string,
  ) {
    super(message);
    this.name = "StudioFixtureReductionErrorV2";
    this.code = code;
  }
}

/**
 * Reduces one ephemeral control/knob action directly into a detached, deeply
 * frozen, complete fixture. Nothing is applied until every path and JSON value
 * in the resulting patch has passed validation.
 */
export type StudioFixtureReducerFacadeV2 = Readonly<{
  reduce(input: StudioFixtureReductionInputV2): StudioDesiredFixtureV2;
}>;

/**
 * Binds fixture reduction to the exact executable bundle resolved by the
 * registry. Callers cannot supply or spoof their own validation adapter.
 */
export function createStudioFixtureReducerV2(
  models: ExactModelRuntimeResolverPortV2,
): StudioFixtureReducerFacadeV2 {
  return Object.freeze({
    reduce(input: StudioFixtureReductionInputV2) {
      const reductionInput = validateReductionInputV2(input);
      const context = validateRuntimeContextV2(reductionInput.context);
      const runtime = models.resolveExactRuntime(context.modelId);
      if (
        runtime.contract.modelId !== context.modelId
        || runtime.fixtureAdapter.modelId !== runtime.contract.modelId
        || runtime.fixtureAdapter.fixtureSchemaId
          !== runtime.contract.fixtureSchemaId
      ) {
        throw new StudioFixtureReductionErrorV2(
          "model-binding",
          `registered fixture adapter does not exactly match model ${context.modelId}`,
        );
      }
      return reduceStudioFixtureActionInternalV2(
        Object.freeze({
          desiredFixture: reductionInput.desiredFixture,
          action: reductionInput.action,
          context,
        }),
        runtime.fixtureAdapter,
      );
    },
  });
}

function reduceStudioFixtureActionInternalV2(
  input: StudioFixtureReductionInputV2,
  modelAdapter: StudioModelFixtureAdapterV2,
): StudioDesiredFixtureV2 {
  const context = validateRuntimeContextV2(input.context);
  assertExactModelAdapterBindingV2(modelAdapter, context);
  const currentFixture = cloneJsonV2(input.desiredFixture, "$");
  const action = assertAndDetachActionV2(input.action);

  let patch: StudioFixturePatchV2;
  if (action.kind === "control") {
    patch = action.patch;
  } else {
    const reduceKnobAction = modelAdapter.reduceKnobAction;
    if (reduceKnobAction === undefined) {
      throw new StudioFixtureReductionErrorV2(
        "missing-model-reducer",
        `knob "${action.knobKey}" requires a model fixture reducer`,
      );
    }
    const adapterFixture = deepFreezeV2(cloneJsonV2(currentFixture, "$"));
    patch = reduceKnobAction(Object.freeze({
      context,
      fixture: adapterFixture,
      action,
    }));
  }

  const changes = normalizePatchV2(currentFixture, patch);
  for (const change of changes) {
    replaceAtPathV2(currentFixture, change.path, change.value);
  }
  const reduced = deepFreezeV2(cloneJsonV2(currentFixture, "$"));
  try {
    modelAdapter.validateCompleteFixture(Object.freeze({
      context,
      fixture: reduced,
    }));
  } catch (error) {
    throw new StudioFixtureReductionErrorV2(
      "model-validation",
      `registered model ${context.modelId} rejected the complete fixture: `
        + errorMessageV2(error),
    );
  }
  return reduced;
}

function validateReductionInputV2(
  value: unknown,
): StudioFixtureReductionInputV2 {
  const record = exactDataRecordV2(
    value,
    ["action", "context", "desiredFixture"],
    [],
    "invalid-action",
    "fixture reduction input",
  );
  return Object.freeze({
    desiredFixture: record.desiredFixture as StudioDesiredFixtureV2,
    action: record.action as StudioFixtureActionV2,
    context: record.context as StudioScenarioRuntimeContextV2,
  });
}

function validateRuntimeContextV2(
  value: unknown,
): StudioScenarioRuntimeContextV2 {
  const record = exactDataRecordV2(
    value,
    ["modelId", "scenarioId"],
    [],
    "invalid-action",
    "runtime context",
  );
  const modelId = record.modelId;
  const scenarioId = record.scenarioId;
  if (
    typeof modelId !== "string"
    || typeof scenarioId !== "string"
    || !PORTABLE_RUNTIME_ID_V2.test(modelId)
    || !PORTABLE_RUNTIME_ID_V2.test(scenarioId)
  ) {
    throw new StudioFixtureReductionErrorV2(
      "invalid-action",
      "runtime context must contain exact portable modelId and scenarioId",
    );
  }
  return Object.freeze({
    scenarioId,
    modelId,
  });
}

function assertExactModelAdapterBindingV2(
  adapter: StudioModelFixtureAdapterV2,
  context: StudioScenarioRuntimeContextV2,
): void {
  if (
    adapter === null
    || typeof adapter !== "object"
    || adapter.modelId !== context.modelId
    || typeof adapter.validateCompleteFixture !== "function"
  ) {
    throw new StudioFixtureReductionErrorV2(
      "model-binding",
      `fixture adapter must exactly match model ${context.modelId}`,
    );
  }
}

function assertAndDetachActionV2(
  candidate: unknown,
): StudioFixtureActionV2 {
  const data = dataRecordV2(candidate, "invalid-action", "fixture action");

  if (data.kind === "control") {
    const action = exactDataRecordV2(
      data,
      ["kind", "patch"],
      ["requestCorrelation"],
      "invalid-action",
      "control action",
    );
    const requestCorrelation = optionalCorrelationV2(action);
    return Object.freeze({
      kind: "control",
      patch: action.patch as StudioFixturePatchV2,
      ...(requestCorrelation === undefined
        ? {}
        : { requestCorrelation }),
    });
  }
  if (data.kind === "knob") {
    const actionRecord = exactDataRecordV2(
      data,
      ["kind", "knobKey", "value"],
      ["requestCorrelation"],
      "invalid-action",
      "knob action",
    );
    const requestCorrelation = optionalCorrelationV2(actionRecord);
    if (
      typeof actionRecord.knobKey !== "string"
      || actionRecord.knobKey.trim().length === 0
    ) {
      throw new StudioFixtureReductionErrorV2(
        "invalid-action",
        "knob action requires a non-empty knobKey",
      );
    }
    const action: StudioKnobActionV2 = {
      kind: "knob",
      knobKey: actionRecord.knobKey,
      value: deepFreezeV2(cloneJsonV2(
        actionRecord.value,
        "$.action.value",
      )),
      ...(requestCorrelation === undefined
        ? {}
        : { requestCorrelation }),
    };
    return Object.freeze(action);
  }
  throw new StudioFixtureReductionErrorV2(
    "invalid-action",
    "fixture action kind is invalid",
  );
}

function optionalCorrelationV2(
  candidate: Record<string, unknown>,
): string | undefined {
  if (!Object.prototype.hasOwnProperty.call(candidate, "requestCorrelation")) {
    return undefined;
  }
  const correlation = candidate.requestCorrelation;
  if (
    typeof correlation !== "string"
    || correlation.length === 0
  ) {
    throw new StudioFixtureReductionErrorV2(
      "invalid-action",
      "requestCorrelation field must be a non-empty string when present",
    );
  }
  return correlation;
}

function normalizePatchV2(
  currentFixture: StudioDesiredFixtureV2,
  candidate: unknown,
): readonly StudioFixtureFieldChangeV2[] {
  const patch = exactDataRecordV2(
    candidate,
    ["changes"],
    [],
    "invalid-patch",
    "fixture patch",
  );
  const changes = arrayDataValuesV2(
    patch.changes,
    "fixture patch changes",
    "invalid-patch",
  );
  if (changes.length === 0) {
    throw new StudioFixtureReductionErrorV2(
      "invalid-patch",
      "fixture patch must contain at least one change",
    );
  }

  const normalized: StudioFixtureFieldChangeV2[] = [];
  for (let index = 0; index < changes.length; index += 1) {
    const change = exactDataRecordV2(
      changes[index],
      ["path", "value"],
      [],
      "invalid-patch",
      `fixture patch change ${index}`,
    );
    const path = normalizePathV2(change.path, index);
    assertKnownPathV2(currentFixture, path);
    const value = deepFreezeV2(
      cloneJsonV2(change.value, formatPathV2(path)),
    );
    normalized.push(Object.freeze({ path, value }));
  }

  assertNonConflictingPathsV2(normalized);
  return Object.freeze(normalized);
}

function normalizePathV2(
  candidate: unknown,
  changeIndex: number,
): StudioFixturePathV2 {
  const segments = arrayDataValuesV2(
    candidate,
    `fixture patch change ${changeIndex} path`,
    "invalid-patch",
  );
  if (segments.length === 0) {
    throw new StudioFixtureReductionErrorV2(
      "invalid-patch",
      `fixture patch change ${changeIndex} has an empty path`,
    );
  }
  const normalized: StudioFixturePathSegmentV2[] = [];
  for (
    let segmentIndex = 0;
    segmentIndex < segments.length;
    segmentIndex += 1
  ) {
    const segment = segments[segmentIndex];
    if (typeof segment === "number" && Object.is(segment, -0)) {
      throw new StudioFixtureReductionErrorV2(
        "invalid-patch",
        `fixture patch change ${changeIndex} has a negative zero path segment at ${segmentIndex}`,
      );
    }
    if (
      typeof segment === "string"
      && segment.length > 0
    ) {
      normalized.push(segment);
      continue;
    }
    if (
      typeof segment === "number"
      && Number.isSafeInteger(segment)
      && segment >= 0
    ) {
      normalized.push(segment);
      continue;
    }
    throw new StudioFixtureReductionErrorV2(
      "invalid-patch",
      `fixture patch change ${changeIndex} has an invalid path segment at ${segmentIndex}`,
    );
  }
  return Object.freeze(normalized) as StudioFixturePathV2;
}

function assertKnownPathV2(
  root: StudioDesiredFixtureV2,
  path: StudioFixturePathV2,
): void {
  let cursor: StudioJsonValueV2 = root;
  for (const segment of path) {
    if (Array.isArray(cursor)) {
      if (
        typeof segment !== "number"
        || segment >= cursor.length
      ) {
        throw unknownPathErrorV2(path);
      }
      cursor = cursor[segment];
      continue;
    }
    if (isPlainObjectV2(cursor)) {
      if (
        typeof segment !== "string"
        || !Object.prototype.hasOwnProperty.call(cursor, segment)
      ) {
        throw unknownPathErrorV2(path);
      }
      cursor = cursor[segment] as StudioJsonValueV2;
      continue;
    }
    throw unknownPathErrorV2(path);
  }
}

function assertNonConflictingPathsV2(
  changes: readonly StudioFixtureFieldChangeV2[],
): void {
  for (let leftIndex = 0; leftIndex < changes.length; leftIndex += 1) {
    for (
      let rightIndex = leftIndex + 1;
      rightIndex < changes.length;
      rightIndex += 1
    ) {
      const left = changes[leftIndex].path;
      const right = changes[rightIndex].path;
      const commonLength = Math.min(left.length, right.length);
      let common = true;
      for (let index = 0; index < commonLength; index += 1) {
        if (left[index] !== right[index]) {
          common = false;
          break;
        }
      }
      if (common) {
        throw new StudioFixtureReductionErrorV2(
          "invalid-patch",
          `fixture patch paths conflict: ${formatPathV2(left)} and ${formatPathV2(right)}`,
        );
      }
    }
  }
}

function replaceAtPathV2(
  root: StudioDesiredFixtureV2,
  path: StudioFixturePathV2,
  value: StudioJsonValueV2,
): void {
  let parent: StudioJsonValueV2 = root;
  for (let index = 0; index < path.length - 1; index += 1) {
    const segment = path[index];
    parent = Array.isArray(parent)
      ? parent[segment as number]
      : (parent as Record<string, StudioJsonValueV2>)[segment as string];
  }
  const leaf = path[path.length - 1];
  if (Array.isArray(parent)) {
    (parent as StudioJsonValueV2[])[leaf as number] = value;
    return;
  }
  Object.defineProperty(parent, leaf as string, {
    configurable: true,
    enumerable: true,
    value,
    writable: true,
  });
}

type StudioFixtureBoundaryErrorCodeV2 =
  | "invalid-action"
  | "invalid-patch";

function dataRecordV2(
  candidate: unknown,
  code: StudioFixtureBoundaryErrorCodeV2,
  label: string,
): Record<string, unknown> {
  if (!isPlainObjectV2(candidate)) {
    throw new StudioFixtureReductionErrorV2(
      code,
      `${label} must be a plain data object`,
    );
  }
  for (const key of Reflect.ownKeys(candidate)) {
    if (typeof key !== "string") {
      throw new StudioFixtureReductionErrorV2(
        code,
        `${label} fields must be string-keyed data`,
      );
    }
    const descriptor = Object.getOwnPropertyDescriptor(candidate, key);
    if (
      descriptor === undefined
      || !descriptor.enumerable
      || !("value" in descriptor)
    ) {
      throw new StudioFixtureReductionErrorV2(
        code,
        `${label} field ${key} must be enumerable data`,
      );
    }
  }
  return candidate as Record<string, unknown>;
}

function exactDataRecordV2(
  candidate: unknown,
  required: readonly string[],
  optional: readonly string[],
  code: StudioFixtureBoundaryErrorCodeV2,
  label: string,
): Record<string, unknown> {
  const record = dataRecordV2(candidate, code, label);
  const allowed = new Set<string>();
  for (const key of required) allowed.add(key);
  for (const key of optional) allowed.add(key);

  const missing: string[] = [];
  for (const key of required) {
    if (!Object.prototype.hasOwnProperty.call(record, key)) missing.push(key);
  }
  const unknown: string[] = [];
  for (const key of Object.keys(record)) {
    if (!allowed.has(key)) unknown.push(key);
  }
  if (missing.length > 0 || unknown.length > 0) {
    throw new StudioFixtureReductionErrorV2(
      code,
      `${label} fields must match exactly (missing: `
        + `${missing.join(", ") || "none"}; unknown: `
        + `${unknown.join(", ") || "none"})`,
    );
  }
  return record;
}

function arrayDataValuesV2(
  candidate: unknown,
  label: string,
  code: StudioFixtureBoundaryErrorCodeV2,
): readonly unknown[] {
  if (!Array.isArray(candidate)) {
    throw new StudioFixtureReductionErrorV2(
      code,
      `${label} must be an array`,
    );
  }
  const expectedKeys = new Set<string>(["length"]);
  for (let index = 0; index < candidate.length; index += 1) {
    expectedKeys.add(String(index));
  }
  for (const key of Reflect.ownKeys(candidate)) {
    if (typeof key !== "string" || !expectedKeys.has(key)) {
      throw new StudioFixtureReductionErrorV2(
        code,
        `${label} arrays must have no custom properties`,
      );
    }
  }

  const values: unknown[] = [];
  for (let index = 0; index < candidate.length; index += 1) {
    const descriptor = Object.getOwnPropertyDescriptor(
      candidate,
      String(index),
    );
    if (
      descriptor === undefined
      || !descriptor.enumerable
      || !("value" in descriptor)
    ) {
      throw new StudioFixtureReductionErrorV2(
        code,
        `${label}[${index}] must be dense enumerable data`,
      );
    }
    values.push(descriptor.value);
  }
  return Object.freeze(values);
}

function cloneJsonV2(
  candidate: unknown,
  path: string,
  ancestors = new Set<object>(),
  depth = 0,
): StudioJsonValueV2 {
  if (depth > MAXIMUM_FIXTURE_JSON_DEPTH_V2) {
    throw invalidJsonErrorV2(path, "nesting limit exceeded");
  }
  if (candidate === null) {
    return null;
  }
  if (
    typeof candidate === "boolean"
  ) {
    return candidate;
  }
  if (typeof candidate === "string") {
    assertUnicodeScalarSequenceV2(candidate, path);
    return candidate;
  }
  if (typeof candidate === "number") {
    if (!Number.isFinite(candidate) || Object.is(candidate, -0)) {
      throw invalidJsonErrorV2(
        path,
        "number must be finite and must not be negative zero",
      );
    }
    return candidate;
  }
  if (typeof candidate !== "object") {
    throw invalidJsonErrorV2(path, "value is not JSON");
  }
  if (ancestors.has(candidate)) {
    throw invalidJsonErrorV2(path, "cyclic value is not JSON");
  }

  ancestors.add(candidate);
  try {
    if (Array.isArray(candidate)) {
      const expectedKeys = new Set([
        "length",
        ...Array.from({ length: candidate.length }, (_, index) =>
          String(index)),
      ]);
      for (const key of Reflect.ownKeys(candidate)) {
        if (typeof key !== "string" || !expectedKeys.has(key)) {
          throw invalidJsonErrorV2(
            path,
            "arrays must be dense and have no custom properties",
          );
        }
      }
      const result: StudioJsonValueV2[] = [];
      for (let index = 0; index < candidate.length; index += 1) {
        const descriptor = Object.getOwnPropertyDescriptor(
          candidate,
          String(index),
        );
        if (
          descriptor === undefined
          || !descriptor.enumerable
          || !("value" in descriptor)
        ) {
          throw invalidJsonErrorV2(
            `${path}[${index}]`,
            "array entries must be enumerable JSON data",
          );
        }
        result.push(cloneJsonV2(
          descriptor.value,
          `${path}[${index}]`,
          ancestors,
          depth + 1,
        ));
      }
      return result;
    }
    if (!isPlainObjectV2(candidate)) {
      throw invalidJsonErrorV2(path, "object must be a plain JSON object");
    }

    const result: Record<string, StudioJsonValueV2> = {};
    for (const key of Reflect.ownKeys(candidate)) {
      if (typeof key !== "string") {
        throw invalidJsonErrorV2(path, "symbol keys are not JSON");
      }
      assertUnicodeScalarSequenceV2(key, `${path} property name`);
      const descriptor = Object.getOwnPropertyDescriptor(candidate, key);
      if (
        descriptor === undefined
        || !descriptor.enumerable
        || !("value" in descriptor)
      ) {
        throw invalidJsonErrorV2(
          `${path}.${key}`,
          "property must be enumerable JSON data",
        );
      }
      Object.defineProperty(result, key, {
        configurable: true,
        enumerable: true,
        value: cloneJsonV2(
          descriptor.value,
          `${path}.${key}`,
          ancestors,
          depth + 1,
        ),
        writable: true,
      });
    }
    return result;
  } finally {
    ancestors.delete(candidate);
  }
}

function assertUnicodeScalarSequenceV2(
  value: string,
  path: string,
): void {
  for (let index = 0; index < value.length; index += 1) {
    const codeUnit = value.charCodeAt(index);
    if (codeUnit >= 0xd800 && codeUnit <= 0xdbff) {
      const next = value.charCodeAt(index + 1);
      if (!(next >= 0xdc00 && next <= 0xdfff)) {
        throw invalidJsonErrorV2(path, "unpaired high surrogate");
      }
      index += 1;
    } else if (codeUnit >= 0xdc00 && codeUnit <= 0xdfff) {
      throw invalidJsonErrorV2(path, "unpaired low surrogate");
    }
  }
}

function deepFreezeV2<TValue extends StudioJsonValueV2>(
  value: TValue,
): TValue {
  if (value !== null && typeof value === "object") {
    for (const child of Array.isArray(value)
      ? value
      : Object.values(value)) {
      deepFreezeV2(child);
    }
    Object.freeze(value);
  }
  return value;
}

function isPlainObjectV2(
  candidate: unknown,
): candidate is Record<string, StudioJsonValueV2> {
  if (
    candidate === null
    || typeof candidate !== "object"
    || Array.isArray(candidate)
  ) {
    return false;
  }
  const prototype = Object.getPrototypeOf(candidate);
  return prototype === Object.prototype || prototype === null;
}

function unknownPathErrorV2(
  path: StudioFixturePathV2,
): StudioFixtureReductionErrorV2 {
  return new StudioFixtureReductionErrorV2(
    "unknown-path",
    `fixture path does not exist: ${formatPathV2(path)}`,
  );
}

function invalidJsonErrorV2(
  path: string,
  detail: string,
): StudioFixtureReductionErrorV2 {
  return new StudioFixtureReductionErrorV2(
    "invalid-json",
    `invalid JSON at ${path}: ${detail}`,
  );
}

function formatPathV2(path: StudioFixturePathV2): string {
  return path.reduce<string>((formatted, segment) => (
    typeof segment === "number"
      ? `${formatted}[${segment}]`
      : `${formatted}.${segment}`
  ), "$");
}

function errorMessageV2(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
