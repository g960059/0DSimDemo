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
      const context = validateRuntimeContextV2(input.context);
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
        Object.freeze({ ...input, context }),
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
  const reduced = deepFreezeV2(currentFixture);
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

function validateRuntimeContextV2(
  value: StudioScenarioRuntimeContextV2,
): StudioScenarioRuntimeContextV2 {
  if (
    value === null
    || typeof value !== "object"
    || Array.isArray(value)
    || Object.keys(value).sort().join(",") !== "modelId,scenarioId"
    || !PORTABLE_RUNTIME_ID_V2.test(value.modelId)
    || !PORTABLE_RUNTIME_ID_V2.test(value.scenarioId)
  ) {
    throw new StudioFixtureReductionErrorV2(
      "invalid-action",
      "runtime context must contain exact portable modelId and scenarioId",
    );
  }
  return Object.freeze({
    scenarioId: value.scenarioId,
    modelId: value.modelId,
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
  candidate: StudioFixtureActionV2,
): StudioFixtureActionV2 {
  if (!isPlainObjectV2(candidate)) {
    throw new StudioFixtureReductionErrorV2(
      "invalid-action",
      "fixture action must be a plain object",
    );
  }
  assertOptionalCorrelationV2(candidate.requestCorrelation);

  if (candidate.kind === "control") {
    return Object.freeze({
      kind: "control",
      patch: candidate.patch,
      ...(candidate.requestCorrelation === undefined
        ? {}
        : { requestCorrelation: candidate.requestCorrelation }),
    });
  }
  if (candidate.kind === "knob") {
    if (
      typeof candidate.knobKey !== "string"
      || candidate.knobKey.trim().length === 0
    ) {
      throw new StudioFixtureReductionErrorV2(
        "invalid-action",
        "knob action requires a non-empty knobKey",
      );
    }
    const action: StudioKnobActionV2 = {
      kind: "knob",
      knobKey: candidate.knobKey,
      value: deepFreezeV2(cloneJsonV2(candidate.value, "$.action.value")),
      ...(candidate.requestCorrelation === undefined
        ? {}
        : { requestCorrelation: candidate.requestCorrelation }),
    };
    return Object.freeze(action);
  }
  throw new StudioFixtureReductionErrorV2(
    "invalid-action",
    "fixture action kind is invalid",
  );
}

function assertOptionalCorrelationV2(
  candidate: string | undefined,
): void {
  if (
    candidate !== undefined
    && (typeof candidate !== "string" || candidate.length === 0)
  ) {
    throw new StudioFixtureReductionErrorV2(
      "invalid-action",
      "requestCorrelation must be a non-empty string when present",
    );
  }
}

function normalizePatchV2(
  currentFixture: StudioDesiredFixtureV2,
  candidate: StudioFixturePatchV2,
): readonly StudioFixtureFieldChangeV2[] {
  if (!isPlainObjectV2(candidate) || !Array.isArray(candidate.changes)) {
    throw new StudioFixtureReductionErrorV2(
      "invalid-patch",
      "fixture patch must contain a changes array",
    );
  }
  if (candidate.changes.length === 0) {
    throw new StudioFixtureReductionErrorV2(
      "invalid-patch",
      "fixture patch must contain at least one change",
    );
  }

  const normalized = candidate.changes.map((change, index) => {
    if (!isPlainObjectV2(change) || !Array.isArray(change.path)) {
      throw new StudioFixtureReductionErrorV2(
        "invalid-patch",
        `fixture patch change ${index} is invalid`,
      );
    }
    const path = normalizePathV2(change.path, index);
    assertKnownPathV2(currentFixture, path);
    const value = deepFreezeV2(
      cloneJsonV2(change.value, formatPathV2(path)),
    );
    return Object.freeze({ path, value });
  });

  assertNonConflictingPathsV2(normalized.map((change) => change.path));
  return Object.freeze(normalized);
}

function normalizePathV2(
  candidate: readonly StudioFixturePathSegmentV2[],
  changeIndex: number,
): StudioFixturePathV2 {
  if (candidate.length === 0) {
    throw new StudioFixtureReductionErrorV2(
      "invalid-patch",
      `fixture patch change ${changeIndex} has an empty path`,
    );
  }
  const normalized = candidate.map((segment, segmentIndex) => {
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
      return segment;
    }
    if (
      typeof segment === "number"
      && Number.isSafeInteger(segment)
      && segment >= 0
    ) {
      return segment;
    }
    throw new StudioFixtureReductionErrorV2(
      "invalid-patch",
      `fixture patch change ${changeIndex} has an invalid path segment at ${segmentIndex}`,
    );
  });
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
  paths: readonly StudioFixturePathV2[],
): void {
  for (let leftIndex = 0; leftIndex < paths.length; leftIndex += 1) {
    for (
      let rightIndex = leftIndex + 1;
      rightIndex < paths.length;
      rightIndex += 1
    ) {
      const left = paths[leftIndex];
      const right = paths[rightIndex];
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
