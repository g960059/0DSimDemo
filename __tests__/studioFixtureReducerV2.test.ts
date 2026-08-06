import { describe, expect, it, vi } from "vitest";

import {
  createStudioFixtureReducerV2,
  StudioFixtureReductionErrorV2,
} from "@/studio/application/runtime/StudioFixtureReducerV2";
import type {
  StudioFixtureActionV2,
  StudioModelFixtureAdapterV2,
} from "@/studio/contracts/v2/runtime";
import type {
  StudioPreviewArtifactV2,
} from "@/studio/contracts/v2/preview";

const MODEL_ID = "model/main-wire-v3-r1";
const FIXTURE_SCHEMA_ID = "fixture/main-wire-v3-r1";
const SCENARIO_ID = "scenario/baseline";

const TEST_CONTROL = Object.freeze({
  controlId: "control/test-value",
  valueType: "number" as const,
  unit: "1",
  minimum: 0,
  maximum: 10,
  step: 0.1,
  defaultValue: 1,
  changeSemantics: "reset" as const,
});

const VASCULAR_TONE_CONTROL = Object.freeze({
  controlId: "control/vascular-tone",
  valueType: "number" as const,
  unit: "1",
  minimum: 0.5,
  maximum: 2,
  step: 0.05,
  defaultValue: 1,
  changeSemantics: "reset" as const,
});

describe("Studio fixture reducer V2", () => {
  it("folds one semantic numeric control into the complete fixture immediately", () => {
    const currentFixture = {
      controls: {
        heartRateBpm: 60,
        systemicResistance: 1,
      },
      initialState: {
        volumeMl: 5_000,
      },
    };
    const action: StudioFixtureActionV2 = {
      kind: "control",
      controlId: TEST_CONTROL.controlId,
      requestCorrelation: "pointer-17",
      value: 72 / 10,
    };

    const reduced = reduceFixtureV2({
      desiredFixture: currentFixture,
      action,
      modelAdapter: adapterV2(({ action: received }) => ({
        changes: [{
          path: ["controls", "heartRateBpm"],
          value: received.value * 10,
        }],
      })),
    });

    expect(reduced).toEqual({
      controls: {
        heartRateBpm: 72,
        systemicResistance: 1,
      },
      initialState: {
        volumeMl: 5_000,
      },
    });
    expect(currentFixture.controls.heartRateBpm).toBe(60);
  });

  it("keeps a model-owned multi-field patch atomic", () => {
    const currentFixture = {
      controls: {
        preload: 8,
        afterload: 70,
      },
      flags: {
        assisted: false,
      },
    };

    const reduced = reduceFixtureV2({
      desiredFixture: currentFixture,
      action: controlActionV2(1.2, VASCULAR_TONE_CONTROL.controlId),
      modelAdapter: adapterV2(({ action }) => ({
        changes: [
          { path: ["controls", "preload"], value: action.value * 10 },
          { path: ["controls", "afterload"], value: 55 },
          { path: ["flags", "assisted"], value: true },
        ],
      })),
    });

    expect(reduced).toEqual({
      controls: {
        preload: 12,
        afterload: 55,
      },
      flags: {
        assisted: true,
      },
    });
    expect(currentFixture).toEqual({
      controls: {
        preload: 8,
        afterload: 70,
      },
      flags: {
        assisted: false,
      },
    });
  });

  it("rolls back the whole model patch when a path or JSON value is invalid", () => {
    const currentFixture = {
      controls: {
        valid: 1,
      },
    };

    expect(() => reduceFixtureV2({
      desiredFixture: currentFixture,
      action: controlActionV2(2),
      modelAdapter: adapterV2(() => ({
        changes: [
          { path: ["controls", "valid"], value: 2 },
          { path: ["controls", "missing"], value: 3 },
        ],
      })),
    })).toThrowError(StudioFixtureReductionErrorV2);
    expect(currentFixture.controls.valid).toBe(1);

    expect(() => reduceFixtureV2({
      desiredFixture: currentFixture,
      action: controlActionV2(2),
      modelAdapter: adapterV2(() => ({
        changes: [{
          path: ["controls", "valid"],
          value: Number.NaN,
        }],
      })),
    })).toThrow(/number must be finite/);
    expect(currentFixture.controls.valid).toBe(1);
  });

  it("never dispatches through model-patch array prototype methods", () => {
    const changesMap = vi.fn(() => [{
      path: ["value"],
      value: Number.NaN,
    }]);
    const changes: [{ path: ["value"]; value: number }] = [{
      path: ["value"],
      value: 2,
    }];
    const changesPrototype = Object.create(Array.prototype) as {
      map: typeof changesMap;
    };
    changesPrototype.map = changesMap;
    Object.setPrototypeOf(changes, changesPrototype);

    expect(reduceFixtureV2({
      desiredFixture: { value: 1 },
      action: controlActionV2(2),
      modelAdapter: adapterV2(() => ({ changes })),
    })).toEqual({ value: 2 });
    expect(changesMap).not.toHaveBeenCalled();

    const pathMap = vi.fn(() => ["missing"]);
    const path: ["value"] = ["value"];
    const pathPrototype = Object.create(Array.prototype) as {
      map: typeof pathMap;
    };
    pathPrototype.map = pathMap;
    Object.setPrototypeOf(path, pathPrototype);

    expect(reduceFixtureV2({
      desiredFixture: { value: 1 },
      action: controlActionV2(3),
      modelAdapter: adapterV2(() => ({
        changes: [{ path, value: 3 }],
      })),
    })).toEqual({ value: 3 });
    expect(pathMap).not.toHaveBeenCalled();
  });

  it("rejects own model-patch array methods without invoking them", () => {
    const map = vi.fn(() => [{ path: ["value"], value: Number.NaN }]);
    const changes = [{ path: ["value"], value: 2 }];
    Object.defineProperty(changes, "map", {
      enumerable: true,
      value: map,
    });

    expect(() => reduceFixtureV2({
      desiredFixture: { value: 1 },
      action: controlActionV2(2),
      modelAdapter: adapterV2(() => ({ changes }) as any),
    })).toThrow(/custom properties/);
    expect(map).not.toHaveBeenCalled();
  });

  it("rejects unknown or explicitly undefined public command fields", () => {
    const base = {
      desiredFixture: { value: 1 },
      action: controlActionV2(1.2),
      context: {
        scenarioId: SCENARIO_ID,
        modelId: MODEL_ID,
      },
    } as const;
    const reducer = createReducerV2();
    const foreignInputs = [
      { ...base, targetGeneration: 1 },
      { ...base, action: { ...base.action, status: "pending" } },
      {
        ...base,
        action: {
          ...base.action,
          requestCorrelation: undefined,
        },
      },
    ];

    for (const input of foreignInputs) {
      expect(() => reducer.reduce(input as any)).toThrow(/exactly|field/);
    }
  });

  it("rejects nonnumeric, nonfinite, and negative-zero values before model reduction", () => {
    const reduceControlAction = vi.fn(() => ({
      changes: [{ path: ["value"] as const, value: 2 }],
    }));
    const reducer = createReducerV2(undefined, adapterV2(reduceControlAction));
    const invalidValues: readonly unknown[] = [
      null,
      "1",
      {},
      [],
      Number.NaN,
      Number.POSITIVE_INFINITY,
      Number.NEGATIVE_INFINITY,
      -0,
    ];

    for (const value of invalidValues) {
      expect(() => reducer.reduce({
        desiredFixture: { value: 1 },
        action: {
          kind: "control",
          controlId: TEST_CONTROL.controlId,
          value,
        },
        context: { scenarioId: SCENARIO_ID, modelId: MODEL_ID },
      } as any)).toThrow(/finite number|negative zero/);
    }
    expect(reduceControlAction).not.toHaveBeenCalled();
  });

  it("enforces the registered inclusive range and minimum-anchored step lattice", () => {
    const reduceControlAction = vi.fn(({ action }) => ({
      changes: [{ path: ["value"] as const, value: action.value }],
    }));
    const reducer = createReducerV2(undefined, adapterV2(reduceControlAction));

    for (const value of [-0.1, 10.1]) {
      expect(() => reducer.reduce(reductionInputV2(value))).toThrow(/within/);
    }
    for (const value of [0.05, 1.25, 9.999]) {
      expect(() => reducer.reduce(reductionInputV2(value))).toThrow(/step lattice/);
    }
    expect(reduceControlAction).not.toHaveBeenCalled();

    for (const value of [0, 10, 0.1 + 0.2]) {
      expect(reducer.reduce(reductionInputV2(value))).toEqual({ value });
    }
    expect(reduceControlAction).toHaveBeenCalledTimes(3);
  });

  it("rejects non-string runtime IDs before resolving a model", () => {
    const resolveExactRuntime = vi.fn();
    const reducer = createReducerV2(resolveExactRuntime);

    const invalidContexts = [
      ...[undefined, null, 123].map((scenarioId) => ({
        modelId: MODEL_ID,
        scenarioId,
      })),
      ...[undefined, null, 123].map((modelId) => ({
        modelId,
        scenarioId: SCENARIO_ID,
      })),
    ];
    for (const context of invalidContexts) {
      expect(() => reducer.reduce({
        desiredFixture: { value: 1 },
        action: controlActionV2(2),
        context,
      } as any)).toThrow(/portable modelId and scenarioId/);
    }
    expect(resolveExactRuntime).not.toHaveBeenCalled();
  });

  it("uses the model reducer seam to map one semantic control to an atomic patch", () => {
    const modelAdapter = adapterV2(({ fixture, action }) => {
      expect(Object.isFrozen(fixture)).toBe(true);
      expect(action.controlId).toBe(VASCULAR_TONE_CONTROL.controlId);
      return {
        changes: [
          {
            path: ["circulation", "systemicResistance"],
            value: action.value,
          },
          {
            path: ["circulation", "venousCompliance"],
            value: 0.85,
          },
        ],
      };
    });

    const reduced = reduceFixtureV2({
      desiredFixture: {
        circulation: {
          systemicResistance: 1,
          venousCompliance: 1,
        },
      },
      action: controlActionV2(1.2, VASCULAR_TONE_CONTROL.controlId),
      modelAdapter,
    });

    expect(reduced).toEqual({
      circulation: {
        systemicResistance: 1.2,
        venousCompliance: 0.85,
      },
    });
  });

  it("returns detached, deeply frozen fixture and model-patch data", () => {
    const mutableFixture = {
      controls: {
        labels: ["baseline"],
        gain: 1,
      },
    };
    const mutablePatchValue = {
      label: "updated",
      points: [1, 2],
    };

    const reduced = reduceFixtureV2({
      desiredFixture: mutableFixture,
      action: controlActionV2(2),
      modelAdapter: adapterV2(() => ({
        changes: [{
          path: ["controls", "gain"],
          value: mutablePatchValue,
        }],
      })),
    });
    mutableFixture.controls.labels.push("mutated");
    mutablePatchValue.label = "mutated";
    mutablePatchValue.points.push(3);

    expect(reduced).toEqual({
      controls: {
        labels: ["baseline"],
        gain: {
          label: "updated",
          points: [1, 2],
        },
      },
    });
    expect(Object.isFrozen(reduced)).toBe(true);
    const controls = (reduced as {
      controls: { labels: readonly string[]; gain: object };
    }).controls;
    expect(Object.isFrozen(controls)).toBe(true);
    expect(Object.isFrozen(controls.labels)).toBe(true);
    expect(Object.isFrozen(controls.gain)).toBe(true);
  });

  it("serializes without parameter entities, generations, epochs, status, or hashes", () => {
    const reduced = reduceFixtureV2({
      desiredFixture: {
        controls: {
          heartRateBpm: 60,
        },
      },
      action: controlActionV2(6.5),
      modelAdapter: adapterV2(({ action }) => ({
        changes: [{
          path: ["controls", "heartRateBpm"],
          value: action.value * 10,
        }],
      })),
    });
    const preview: StudioPreviewArtifactV2 = {
      snapshotId: "snapshot-1",
      cacheFormatVersion: 1,
      generatedAt: "2026-07-31T00:00:00.000Z",
      scenarios: [{
        scenarioId: "scenario-1",
        kind: "loopable-beat",
        timeRange: {
          startSec: 0,
          endSec: 1,
        },
        loopable: true,
        samples: {
          pressure: [80, 120, 80],
        },
      }],
    };

    const serialized = JSON.stringify({ reduced, preview });
    expect(serialized).not.toMatch(
      /ParameterSet|parameterSet|targetGeneration|inputEpoch|"status"|"hash"/,
    );
    expect(serialized).not.toMatch(/qualification|evidence/);
  });

  it("rejects a valid model patch when exact-model fixture validation fails", () => {
    const desiredFixture = {
      controls: {
        heartRateBpm: 60,
      },
    };
    const modelAdapter = adapterV2(
      () => ({
        changes: [{ path: ["controls", "heartRateBpm"], value: -1 }],
      }),
      ({ context, fixture }) => {
        expect(context.modelId).toBe(MODEL_ID);
        const heartRate = (fixture as {
          controls: { heartRateBpm: number };
        }).controls.heartRateBpm;
        if (heartRate <= 0) throw new Error("heart rate must be positive");
        return undefined;
      },
    );

    let thrown: unknown;
    try {
      reduceFixtureV2({
        desiredFixture,
        action: controlActionV2(1),
        modelAdapter,
      });
    } catch (error) {
      thrown = error;
    }
    expect(thrown).toMatchObject({ code: "model-validation" });
    expect(desiredFixture.controls.heartRateBpm).toBe(60);
  });

  it("rejects sparse fixture arrays before a model patch can escape", () => {
    const sparse = Array<number>(2);
    sparse[1] = 1;
    expect(() => reduceFixtureV2({
      desiredFixture: { values: sparse },
      action: controlActionV2(2),
      modelAdapter: adapterV2(() => ({
        changes: [{ path: ["values", 1], value: 2 }],
      })),
    })).toThrow(/array entries must be enumerable JSON data/);
  });

  it("rejects non-portable Unicode before applying a model patch", () => {
    expect(() => reduceFixtureV2({
      desiredFixture: { label: "\ud800" },
      action: controlActionV2(2),
      modelAdapter: adapterV2(() => ({
        changes: [{ path: ["label"], value: "portable" }],
      })),
    })).toThrow(/unpaired high surrogate/);
  });

  it("rejects an adapter bound to a different exact model", () => {
    const modelAdapter = adapterV2(
      () => ({ changes: [{ path: ["value"], value: 2 }] }),
      undefined,
      "model/other",
    );
    expect(() => reduceFixtureV2({
      desiredFixture: { value: 1 },
      action: controlActionV2(2),
      modelAdapter,
    })).toThrow(/does not exactly match/);
  });

  it("rejects an unregistered control before invoking the model reducer", () => {
    const reduceControlAction = vi.fn(() => ({
      changes: [{ path: ["value"] as const, value: 2 }],
    }));
    expect(() => reduceFixtureV2({
      desiredFixture: { value: 1 },
      action: controlActionV2(2, "control/not-registered"),
      modelAdapter: adapterV2(reduceControlAction),
    })).toThrow(/unknown registered control/);
    expect(reduceControlAction).not.toHaveBeenCalled();
  });

  it("rejects negative zero in fixtures and model-owned patches", () => {
    expect(() => reduceFixtureV2({
      desiredFixture: { value: -0 },
      action: controlActionV2(1),
      modelAdapter: adapterV2(() => ({
        changes: [{ path: ["value"], value: 1 }],
      })),
    })).toThrow(/negative zero/);
    expect(() => reduceFixtureV2({
      desiredFixture: { value: 1 },
      action: controlActionV2(1),
      modelAdapter: adapterV2(() => ({
        changes: [{ path: ["value"], value: -0 }],
      })),
    })).toThrow(/negative zero/);
    expect(() => reduceFixtureV2({
      desiredFixture: [1],
      action: controlActionV2(1),
      modelAdapter: adapterV2(() => ({
        changes: [{ path: [-0], value: 2 }],
      })),
    })).toThrow(/negative zero/);
  });
});

type ReduceControlActionV2 = NonNullable<
  StudioModelFixtureAdapterV2["reduceControlAction"]
>;
type ValidateFixtureV2 = StudioModelFixtureAdapterV2[
  "validateCompleteFixture"
];

function adapterV2(
  reduceControlAction: ReduceControlActionV2,
  validateCompleteFixture: ValidateFixtureV2 = () => undefined,
  modelId = MODEL_ID,
): StudioModelFixtureAdapterV2 {
  return {
    modelId,
    fixtureSchemaId: FIXTURE_SCHEMA_ID,
    validateCompleteFixture,
    reduceControlAction,
  };
}

function controlActionV2(
  value: number,
  controlId: string = TEST_CONTROL.controlId,
): StudioFixtureActionV2 {
  return { kind: "control", controlId, value };
}

function reductionInputV2(value: number) {
  return {
    desiredFixture: { value: 1 },
    action: controlActionV2(value),
    context: { scenarioId: SCENARIO_ID, modelId: MODEL_ID },
  } as const;
}

function reduceFixtureV2(
  input: Readonly<{
    desiredFixture: Parameters<
      ReturnType<typeof createStudioFixtureReducerV2>["reduce"]
    >[0]["desiredFixture"];
    action: StudioFixtureActionV2;
    modelAdapter: StudioModelFixtureAdapterV2;
  }>,
) {
  const reducer = createReducerV2(undefined, input.modelAdapter);
  return reducer.reduce({
    desiredFixture: input.desiredFixture,
    action: input.action,
    context: { scenarioId: SCENARIO_ID, modelId: MODEL_ID },
  });
}

function createReducerV2(
  resolveExactRuntime?: (modelId: string) => any,
  fixtureAdapter: StudioModelFixtureAdapterV2 = adapterV2(({ action }) => ({
    changes: [{ path: ["value"], value: action.value }],
  })),
) {
  const resolve = resolveExactRuntime ?? ((modelId: string) => ({
    contract: {
      modelId,
      fixtureSchemaId: FIXTURE_SCHEMA_ID,
      controlCatalog: [TEST_CONTROL, VASCULAR_TONE_CONTROL],
    },
    fixtureAdapter,
  }));
  return createStudioFixtureReducerV2({ resolveExactRuntime: resolve });
}
