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

describe("Studio fixture reducer V2", () => {
  it("folds an ephemeral control action into the complete current fixture immediately", () => {
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
      requestCorrelation: "pointer-17",
      patch: {
        changes: [{
          path: ["controls", "heartRateBpm"],
          value: 72,
        }],
      },
    };

    const reduced = reduceFixtureV2({
      desiredFixture: currentFixture,
      action,
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

  it("applies a multi-field control patch atomically", () => {
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
      action: {
        kind: "control",
        patch: {
          changes: [
            { path: ["controls", "preload"], value: 12 },
            { path: ["controls", "afterload"], value: 55 },
            { path: ["flags", "assisted"], value: true },
          ],
        },
      },
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

  it("rolls back the whole patch when a path or JSON value is invalid", () => {
    const currentFixture = {
      controls: {
        valid: 1,
      },
    };

    expect(() => reduceFixtureV2({
      desiredFixture: currentFixture,
      action: {
        kind: "control",
        patch: {
          changes: [
            { path: ["controls", "valid"], value: 2 },
            { path: ["controls", "missing"], value: 3 },
          ],
        },
      },
    })).toThrowError(StudioFixtureReductionErrorV2);
    expect(currentFixture.controls.valid).toBe(1);

    expect(() => reduceFixtureV2({
      desiredFixture: currentFixture,
      action: {
        kind: "control",
        patch: {
          changes: [{
            path: ["controls", "valid"],
            value: Number.NaN,
          }],
        },
      },
    })).toThrow(/number must be finite/);
    expect(currentFixture.controls.valid).toBe(1);
  });

  it("never dispatches through caller-controlled array methods", () => {
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
      action: {
        kind: "control",
        patch: { changes },
      },
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
      action: {
        kind: "control",
        patch: { changes: [{ path, value: 3 }] },
      },
    })).toEqual({ value: 3 });
    expect(pathMap).not.toHaveBeenCalled();
  });

  it("rejects own array methods without invoking them", () => {
    const map = vi.fn(() => [{ path: ["value"], value: Number.NaN }]);
    const changes = [{ path: ["value"], value: 2 }];
    Object.defineProperty(changes, "map", {
      enumerable: true,
      value: map,
    });

    expect(() => reduceFixtureV2({
      desiredFixture: { value: 1 },
      action: {
        kind: "control",
        patch: { changes } as any,
      },
    })).toThrow(/custom properties/);
    expect(map).not.toHaveBeenCalled();
  });

  it("rejects unknown or explicitly undefined command fields", () => {
    const base = {
      desiredFixture: { value: 1 },
      action: {
        kind: "control",
        patch: { changes: [{ path: ["value"], value: 2 }] },
      },
      context: {
        scenarioId: "scenario/baseline",
        modelId: "model/main-wire-v3-r1",
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
          patch: { ...base.action.patch, status: "pending" },
        },
      },
      {
        ...base,
        action: {
          ...base.action,
          patch: {
            changes: [{
              ...base.action.patch.changes[0],
              parameterSetId: "legacy-set",
            }],
          },
        },
      },
      {
        ...base,
        action: {
          ...base.action,
          requestCorrelation: undefined,
        },
      },
      {
        ...base,
        action: {
          kind: "knob",
          knobKey: "vascular-tone",
          value: 1.2,
          status: "pending",
        },
      },
    ];

    for (const input of foreignInputs) {
      expect(() => reducer.reduce(input as any)).toThrow(/exactly|field/);
    }
  });

  it("rejects non-string runtime IDs before resolving a model", () => {
    const resolveExactRuntime = vi.fn();
    const reducer = createReducerV2(resolveExactRuntime);

    const invalidContexts = [
      ...[undefined, null, 123].map((scenarioId) => ({
        modelId: "model/main-wire-v3-r1",
        scenarioId,
      })),
      ...[undefined, null, 123].map((modelId) => ({
        modelId,
        scenarioId: "scenario/baseline",
      })),
    ];
    for (const context of invalidContexts) {
      expect(() => reducer.reduce({
        desiredFixture: { value: 1 },
        action: {
          kind: "control",
          patch: { changes: [{ path: ["value"], value: 2 }] },
        },
        context,
      } as any)).toThrow(/portable modelId and scenarioId/);
    }
    expect(resolveExactRuntime).not.toHaveBeenCalled();
  });

  it("uses the model reducer seam to map one complex knob to one atomic patch", () => {
    const modelAdapter: StudioModelFixtureAdapterV2 = {
      modelId: "model/main-wire-v3-r1",
      fixtureSchemaId: "fixture/main-wire-v3-r1",
      validateCompleteFixture() {},
      reduceKnobAction({ fixture, action }) {
        expect(Object.isFrozen(fixture)).toBe(true);
        expect(action.knobKey).toBe("vascular-tone");
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
      },
    };

    const reduced = reduceFixtureV2({
      desiredFixture: {
        circulation: {
          systemicResistance: 1,
          venousCompliance: 1,
        },
      },
      action: {
        kind: "knob",
        knobKey: "vascular-tone",
        value: 1.2,
      },
      modelAdapter,
    });

    expect(reduced).toEqual({
      circulation: {
        systemicResistance: 1.2,
        venousCompliance: 0.85,
      },
    });
  });

  it("returns detached, deeply frozen data", () => {
    const mutableFixture = {
      controls: {
        labels: ["baseline"],
        gain: 1,
      },
    };
    const mutableValue = {
      label: "updated",
      points: [1, 2],
    };

    const reduced = reduceFixtureV2({
      desiredFixture: mutableFixture,
      action: {
        kind: "control",
        patch: {
          changes: [{
            path: ["controls", "gain"],
            value: mutableValue,
          }],
        },
      },
    });
    mutableFixture.controls.labels.push("mutated");
    mutableValue.label = "mutated";
    mutableValue.points.push(3);

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
      action: {
        kind: "control",
        patch: {
          changes: [{
            path: ["controls", "heartRateBpm"],
            value: 65,
          }],
        },
      },
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
    expect(serialized).not.toMatch(
      /qualification|evidence/,
    );
  });

  it("rejects a structurally valid patch when the exact model rejects the complete fixture", () => {
    const desiredFixture = {
      controls: {
        heartRateBpm: 60,
      },
    };
    let thrown: unknown;
    try {
      reduceFixtureV2({
        desiredFixture,
        action: {
          kind: "control",
          patch: {
            changes: [{
              path: ["controls", "heartRateBpm"],
              value: -1,
            }],
          },
        },
        modelAdapter: {
          modelId: "model/main-wire-v3-r1",
          fixtureSchemaId: "fixture/main-wire-v3-r1",
          validateCompleteFixture({ context, fixture }) {
            expect(context.modelId).toBe("model/main-wire-v3-r1");
            const heartRate = (fixture as {
              controls: { heartRateBpm: number };
            }).controls.heartRateBpm;
            if (heartRate <= 0) throw new Error("heart rate must be positive");
          },
        },
      });
    } catch (error) {
      thrown = error;
    }
    expect(thrown).toMatchObject({
      code: "model-validation",
    });
    expect(desiredFixture.controls.heartRateBpm).toBe(60);
  });

  it("rejects sparse arrays before a non-portable fixture can escape", () => {
    const sparse = Array<number>(2);
    sparse[1] = 1;
    expect(() => reduceFixtureV2({
      desiredFixture: {
        values: sparse,
      },
      action: {
        kind: "control",
        patch: {
          changes: [{
            path: ["values", 1],
            value: 2,
          }],
        },
      },
    })).toThrow(/array entries must be enumerable JSON data/);
  });

  it("rejects non-portable Unicode before applying a fixture action", () => {
    expect(() => reduceFixtureV2({
      desiredFixture: {
        label: "\ud800",
      },
      action: {
        kind: "control",
        patch: {
          changes: [{
            path: ["label"],
            value: "portable",
          }],
        },
      },
    })).toThrow(/unpaired high surrogate/);
  });

  it("rejects an adapter bound to a different exact model", () => {
    const modelAdapter = {
      modelId: "model/other",
      fixtureSchemaId: "fixture/main-wire-v3-r1",
      validateCompleteFixture() {},
    };
    expect(() => reduceFixtureV2({
      desiredFixture: { value: 1 },
      action: {
        kind: "control",
        patch: { changes: [{ path: ["value"], value: 2 }] },
      },
      modelAdapter,
    })).toThrow(/does not exactly match/);
  });

  it("rejects negative zero in the fixture or patch", () => {
    expect(() => reduceFixtureV2({
      desiredFixture: { value: -0 },
      action: {
        kind: "control",
        patch: { changes: [{ path: ["value"], value: 1 }] },
      },
    })).toThrow(/negative zero/);
    expect(() => reduceFixtureV2({
      desiredFixture: { value: 1 },
      action: {
        kind: "control",
        patch: { changes: [{ path: ["value"], value: -0 }] },
      },
    })).toThrow(/negative zero/);
    expect(() => reduceFixtureV2({
      desiredFixture: [1],
      action: {
        kind: "control",
        patch: { changes: [{ path: [-0], value: 2 }] },
      },
    })).toThrow(/negative zero/);
  });
});

function reduceFixtureV2(
  input: Readonly<{
    desiredFixture: Parameters<
      ReturnType<typeof createStudioFixtureReducerV2>["reduce"]
    >[0]["desiredFixture"];
    action: StudioFixtureActionV2;
    modelAdapter?: StudioModelFixtureAdapterV2;
  }>,
) {
  const modelAdapter = input.modelAdapter ?? {
    modelId: "model/main-wire-v3-r1",
    fixtureSchemaId: "fixture/main-wire-v3-r1",
    validateCompleteFixture() {},
  };
  const reducer = createReducerV2((modelId) => ({
    contract: {
      modelId,
      fixtureSchemaId: "fixture/main-wire-v3-r1",
    },
    fixtureAdapter: modelAdapter,
  } as any));
  return reducer.reduce({
    desiredFixture: input.desiredFixture,
    action: input.action,
    context: {
      scenarioId: "scenario/baseline",
      modelId: "model/main-wire-v3-r1",
    },
  });
}

function createReducerV2(
  resolveExactRuntime: (modelId: string) => any = (modelId) => ({
    contract: {
      modelId,
      fixtureSchemaId: "fixture/main-wire-v3-r1",
    },
    fixtureAdapter: {
      modelId,
      fixtureSchemaId: "fixture/main-wire-v3-r1",
      validateCompleteFixture() {},
    },
  }),
) {
  return createStudioFixtureReducerV2({ resolveExactRuntime });
}
