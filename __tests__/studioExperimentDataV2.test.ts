import { describe, expect, it } from "vitest";

import {
  STUDIO_EXPERIMENT_PLACEMENT_V2_SCHEMA_ID,
  STUDIO_EXPERIMENT_SNAPSHOT_V2_SCHEMA_ID,
  STUDIO_EXPERIMENT_WORKSPACE_V2_SCHEMA_ID,
  STUDIO_SCENARIO_PRESET_V2_SCHEMA_ID,
} from "@/studio/contracts/v2/content";
import {
  createScenarioPresetCaptureClonerV2,
  StudioExperimentDataValidationErrorV2,
  validateExperimentPlacementAgainstSnapshotV2,
  validateExperimentDesiredContentForModelV2,
  validateExperimentSnapshotV2,
  validateExperimentWorkspaceV2,
  validateScenarioPresetV2,
} from "@/studio/application/authoring/StudioExperimentDataV2";
import type {
  ModelContractV2,
  RegisteredModelCaptureAdapterV2,
} from "@/studio/contracts/v2/model";

describe("Studio Experiment data V2", () => {
  it("detaches and deeply freezes a mutable workspace with an atomic Scenario capture", () => {
    const caller = workspaceV2();
    const validated = validateExperimentWorkspaceV2(caller);

    caller.content.scenarios[0]!.label = "caller mutation";
    caller.content.scenarios[0]!.capture.fixture.controls.svr = 99;
    caller.content.scenarios[0]!.capture.checkpoint.payload.state[0] = 99;
    caller.content.surface.note.text = "caller note mutation";

    expect(validated).toMatchObject({
      experimentId: "experiment/afterload",
      draftVersion: 3,
      headSnapshotId: "snapshot/2",
      basedOnSnapshotId: "snapshot/2",
      content: {
        modelId: "model/main-wire-v3",
        scenarios: [{
          scenarioId: "scenario/baseline",
          label: "Baseline",
          capture: {
            fixture: { controls: { svr: 1 } },
            checkpoint: {
              acceptedRevision: 1200,
              acceptedTimeSec: 2.4,
              payload: { state: [1, 2, 3] },
            },
          },
        }],
        surface: {
          note: {
            instanceId: "note/method",
            text: "Compare pressure and volume after the target changes.",
          },
        },
      },
    });
    expect(Object.isFrozen(validated)).toBe(true);
    expect(Object.isFrozen(validated.content.scenarios[0]!.capture)).toBe(true);
    expect(Object.isFrozen(
      validated.content.scenarios[0]!.capture.checkpoint.payload,
    )).toBe(true);
    expect(validated.content.scenarios[0]!.capture.fixture).not.toBe(
      caller.content.scenarios[0]!.capture.fixture,
    );
    expect(validated.content.surface.note.text)
      .toBe("Compare pressure and volume after the target changes.");
  });

  it("owns checkpoint-free desired Save content without weakening durable captures", () => {
    const caller = desiredContentV2();
    const desired = validateExperimentDesiredContentForModelV2(
      caller,
      modelContractV2(),
    );

    expect(Object.keys(desired.scenarios[0]).sort()).toEqual([
      "fixture",
      "label",
      "scenarioId",
    ]);
    expect(JSON.stringify(desired)).not.toMatch(/capture|checkpoint/);
    expect(Object.isFrozen(desired)).toBe(true);
    expect(Object.isFrozen(desired.scenarios[0].fixture)).toBe(true);

    caller.scenarios[0].fixture.controls.svr = 9;
    expect((desired.scenarios[0].fixture as any).controls.svr).toBe(1);

    const smuggledCheckpoint = desiredContentV2() as Record<string, any>;
    smuggledCheckpoint.scenarios[0].checkpoint = captureV2().checkpoint;
    expect(() => validateExperimentDesiredContentForModelV2(
      smuggledCheckpoint,
      modelContractV2(),
    )).toThrow(/keys must be exactly/);
  });

  it("keeps immutable snapshot identity opaque and separate from draftVersion", () => {
    const snapshot = validateExperimentSnapshotV2(snapshotV2());

    expect(snapshot).toEqual(expect.objectContaining({
      snapshotId: "snapshot/3",
      experimentId: "experiment/afterload",
      parentSnapshotId: "snapshot/2",
      createdAt: "2026-07-31T03:04:05.000Z",
      createdBy: "user/author",
    }));
    expect(Object.keys(snapshot)).not.toContain("revision");
    expect(Object.keys(snapshot)).not.toContain("hash");
    expect(Object.keys(snapshot)).not.toContain("modelRef");
    expect(Object.isFrozen(snapshot.content.surface)).toBe(true);

    const withoutActor = snapshotV2();
    delete withoutActor.createdBy;
    expect(validateExperimentSnapshotV2(withoutActor).createdBy).toBeUndefined();
  });

  it("models semantic surface groups, order and priority with exactly one note", () => {
    const validated = validateExperimentWorkspaceV2(workspaceV2());
    expect(validated.content.surface).toEqual({
      groups: [{
        groupId: "group/hemodynamics",
        label: "Hemodynamics",
        order: 0,
        priority: 10,
      }],
      graphs: [{
        instanceId: "graph/pressure",
        graphId: "catalog.graph/pressure",
        groupId: "group/hemodynamics",
        order: 0,
        priority: 10,
      }],
      readouts: [{
        instanceId: "readout/map",
        outputId: "catalog.output/map",
        groupId: "group/hemodynamics",
        order: 1,
        priority: 8,
      }],
      controls: [{
        instanceId: "control/svr",
        controlId: "catalog.control/svr",
        groupId: "group/hemodynamics",
        order: 2,
        priority: 9,
      }],
      note: {
        instanceId: "note/method",
        text: "Compare pressure and volume after the target changes.",
        groupId: "group/hemodynamics",
        order: 3,
        priority: 5,
      },
    });

    for (const forbidden of ["extent", "fullscreen", "layout", "geometry"]) {
      const candidate = workspaceV2() as Record<string, any>;
      candidate.content.surface[forbidden] = {};
      expect(() => validateExperimentWorkspaceV2(candidate))
        .toThrow(/keys must be exactly/);
    }

    const missingNote = workspaceV2() as Record<string, any>;
    delete missingNote.content.surface.note;
    expect(() => validateExperimentWorkspaceV2(missingNote))
      .toThrow(/keys must be exactly/);

    const noteArray = workspaceV2() as Record<string, any>;
    noteArray.content.surface.note = [noteArray.content.surface.note];
    expect(() => validateExperimentWorkspaceV2(noteArray))
      .toThrow(/must be an object/);
  });

  it("pins a placement to one snapshot and preserves omitted versus empty subsets", () => {
    const snapshot = snapshotV2();
    const all = validateExperimentPlacementAgainstSnapshotV2(
      placementV2(),
      snapshot,
    );
    expect(all.view).toBeUndefined();

    const none = placementV2() as Record<string, any>;
    none.view = {
      scenarioIds: [],
      graphInstanceIds: [],
      readoutInstanceIds: [],
      controlInstanceIds: [],
      order: ["note/method"],
    };
    const validatedNone = validateExperimentPlacementAgainstSnapshotV2(
      none,
      snapshot,
    );
    expect(validatedNone.view).toEqual(none.view);
    expect(validatedNone.view?.scenarioIds).toEqual([]);
    expect(validatedNone.view?.graphInstanceIds).toEqual([]);

    const subset = placementV2() as Record<string, any>;
    subset.view = {
      scenarioIds: ["scenario/baseline"],
      graphInstanceIds: ["graph/pressure"],
      readoutInstanceIds: [],
      controlInstanceIds: ["control/svr"],
      order: ["control/svr", "note/method", "graph/pressure"],
    };
    expect(validateExperimentPlacementAgainstSnapshotV2(subset, snapshot).view)
      .toEqual(subset.view);
  });

  it("rejects a wrong snapshot, unknown or duplicate subsets, and non-permutation order", () => {
    const snapshot = snapshotV2();
    const wrongSnapshot = placementV2();
    wrongSnapshot.snapshotId = "snapshot/other";
    expect(() =>
      validateExperimentPlacementAgainstSnapshotV2(wrongSnapshot, snapshot)
    ).toThrow(/does not match the pinned snapshot/);

    const unknown = placementV2() as Record<string, any>;
    unknown.view = { graphInstanceIds: ["graph/missing"] };
    expect(() =>
      validateExperimentPlacementAgainstSnapshotV2(unknown, snapshot)
    ).toThrow(/unknown id graph\/missing/);

    const duplicate = placementV2() as Record<string, any>;
    duplicate.view = {
      scenarioIds: ["scenario/baseline", "scenario/baseline"],
    };
    expect(() =>
      validateExperimentPlacementAgainstSnapshotV2(duplicate, snapshot)
    ).toThrow(/duplicate id scenario\/baseline/);

    const incompleteOrder = placementV2() as Record<string, any>;
    incompleteOrder.view = { order: ["note/method"] };
    expect(() =>
      validateExperimentPlacementAgainstSnapshotV2(incompleteOrder, snapshot)
    ).toThrow(/exact permutation/);
  });

  it("validates the only reusable named input/state object and applies it by copy", () => {
    const caller = presetV2();
    const preset = validateScenarioPresetV2(caller);
    const cloner = createScenarioPresetCaptureClonerV2(
      exactRuntimeResolverV2(),
    );
    const applied = cloner.clone(caller);

    expect(preset).toMatchObject({
      presetId: "preset/healthy",
      modelId: "model/main-wire-v3",
      title: "Healthy baseline",
      description: "A reusable starting state.",
    });
    expect(applied).toEqual(preset.capture);
    expect(applied).not.toBe(preset.capture);
    expect(applied.checkpoint).not.toBe(preset.capture.checkpoint);
    expect(applied.fixture).not.toBe(caller.capture.fixture);
    expect(Object.isFrozen(applied)).toBe(true);

    caller.capture.fixture.controls.svr = 4;
    expect((applied.fixture as { controls: { svr: number } }).controls.svr)
      .toBe(1);

    const qualified = presetV2() as Record<string, unknown>;
    qualified.qualification = "certified";
    expect(() => validateScenarioPresetV2(qualified))
      .toThrow(/keys must be exactly/);

    const wrongModel = presetV2();
    wrongModel.modelId = "model/other";
    expect(() => cloner.clone(wrongModel)).toThrow(/not registered/);

    const wrongCodec = presetV2() as any;
    wrongCodec.capture.checkpoint.payload = { wrongCodec: true };
    expect(() => cloner.clone(wrongCodec)).toThrow(/rejected capture/);

    const spoofedAdapter = {
      ...captureAdapterV2(),
      validateFixture() {},
      validateCapture() {},
    };
    expect(Object.keys(cloner)).toEqual(["clone"]);
    expect(cloner).not.toHaveProperty("adapter");
    expect(() => (cloner.clone as any)(wrongCodec, spoofedAdapter))
      .toThrow(/rejected capture/);
  });

  it("fails closed on malformed checkpoints, duplicate identity, forbidden fields and non-JSON data", () => {
    const cases: Array<readonly [string, (candidate: Record<string, any>) => void, RegExp]> = [
      [
        "missing fixture",
        (candidate) => {
          delete candidate.content.scenarios[0].capture.fixture;
        },
        /keys must be exactly/,
      ],
      [
        "missing checkpoint",
        (candidate) => {
          delete candidate.content.scenarios[0].capture.checkpoint;
        },
        /keys must be exactly/,
      ],
      [
        "invalid accepted revision",
        (candidate) => {
          candidate.content.scenarios[0].capture.checkpoint.acceptedRevision =
            -1;
        },
        /nonnegative safe integer/,
      ],
      [
        "invalid accepted time",
        (candidate) => {
          candidate.content.scenarios[0].capture.checkpoint.acceptedTimeSec =
            Number.NaN;
        },
        /JSON number must be finite/,
      ],
      [
        "negative zero",
        (candidate) => {
          candidate.content.scenarios[0].capture.fixture.controls.svr = -0;
        },
        /negative zero/,
      ],
      [
        "redundant codec identity",
        (candidate) => {
          candidate.content.scenarios[0].capture.checkpoint.codecId =
            "checkpoint/main-wire-v4";
        },
        /keys must be exactly/,
      ],
      [
        "duplicate scenario",
        (candidate) => {
          candidate.content.scenarios.push(
            structuredClone(candidate.content.scenarios[0]),
          );
        },
        /duplicate id scenario\/baseline/,
      ],
      [
        "unknown group",
        (candidate) => {
          candidate.content.surface.graphs[0].groupId = "group/missing";
        },
        /unknown semantic group/,
      ],
      [
        "duplicate surface identity",
        (candidate) => {
          candidate.content.surface.readouts[0].instanceId = "graph/pressure";
        },
        /duplicate id graph\/pressure/,
      ],
      [
        "duplicate order",
        (candidate) => {
          candidate.content.surface.readouts[0].order = 0;
        },
        /duplicate order 0/,
      ],
      [
        "forbidden immutable-domain field",
        (candidate) => {
          candidate.content.assessment = {};
        },
        /keys must be exactly/,
      ],
      [
        "function payload",
        (candidate) => {
          candidate.content.scenarios[0].capture.checkpoint.payload = () => 1;
        },
        /portable JSON/,
      ],
      [
        "unpaired Unicode surrogate",
        (candidate) => {
          candidate.content.surface.note.text = "\ud800";
        },
        /unpaired high surrogate/,
      ],
    ];

    for (const [_name, mutate, pattern] of cases) {
      const candidate = workspaceV2() as Record<string, any>;
      mutate(candidate);
      expect(() => validateExperimentWorkspaceV2(candidate)).toThrow(pattern);
    }

    const selfParent = snapshotV2();
    selfParent.parentSnapshotId = selfParent.snapshotId;
    expect(() => validateExperimentSnapshotV2(selfParent))
      .toThrow(/must not reference the snapshot itself/);

    const forbiddenSnapshot = snapshotV2() as Record<string, unknown>;
    forbiddenSnapshot.revision = 4;
    expect(() => validateExperimentSnapshotV2(forbiddenSnapshot))
      .toThrow(/field set mismatch/);

    const normalizedInvalidDate = snapshotV2();
    normalizedInvalidDate.createdAt = "2026-02-31T00:00:00.000Z";
    expect(() => validateExperimentSnapshotV2(normalizedInvalidDate))
      .toThrow(/calendar-valid/);

    const cyclic = workspaceV2() as Record<string, any>;
    cyclic.content.scenarios[0].capture.fixture.self =
      cyclic.content.scenarios[0].capture.fixture;
    expect(() => validateExperimentWorkspaceV2(cyclic))
      .toThrow(StudioExperimentDataValidationErrorV2);
    expect(() => validateExperimentWorkspaceV2(cyclic))
      .toThrow(/cyclic JSON/);
  });
});

function captureV2() {
  return {
    fixture: {
      controls: {
        svr: 1,
      },
    },
    checkpoint: {
      acceptedRevision: 1200,
      acceptedTimeSec: 2.4,
      payload: {
        state: [1, 2, 3],
      },
    },
  };
}

function contentV2() {
  return {
    modelId: "model/main-wire-v3",
    scenarios: [{
      scenarioId: "scenario/baseline",
      label: "Baseline",
      capture: captureV2(),
    }],
    surface: {
      groups: [{
        groupId: "group/hemodynamics",
        label: "Hemodynamics",
        order: 0,
        priority: 10,
      }],
      graphs: [{
        instanceId: "graph/pressure",
        graphId: "catalog.graph/pressure",
        groupId: "group/hemodynamics",
        order: 0,
        priority: 10,
      }],
      readouts: [{
        instanceId: "readout/map",
        outputId: "catalog.output/map",
        groupId: "group/hemodynamics",
        order: 1,
        priority: 8,
      }],
      controls: [{
        instanceId: "control/svr",
        controlId: "catalog.control/svr",
        groupId: "group/hemodynamics",
        order: 2,
        priority: 9,
      }],
      note: {
        instanceId: "note/method",
        text: "Compare pressure and volume after the target changes.",
        groupId: "group/hemodynamics",
        order: 3,
        priority: 5,
      },
    },
  };
}

function desiredContentV2() {
  const content = contentV2();
  return {
    modelId: content.modelId,
    scenarios: content.scenarios.map((scenario) => ({
      scenarioId: scenario.scenarioId,
      label: scenario.label,
      fixture: scenario.capture.fixture,
    })),
    surface: content.surface,
  };
}

function workspaceV2() {
  return {
    schemaId: STUDIO_EXPERIMENT_WORKSPACE_V2_SCHEMA_ID,
    experimentId: "experiment/afterload",
    draftVersion: 3,
    headSnapshotId: "snapshot/2",
    basedOnSnapshotId: "snapshot/2",
    content: contentV2(),
  };
}

function snapshotV2() {
  return {
    schemaId: STUDIO_EXPERIMENT_SNAPSHOT_V2_SCHEMA_ID,
    snapshotId: "snapshot/3",
    experimentId: "experiment/afterload",
    parentSnapshotId: "snapshot/2",
    content: contentV2(),
    createdAt: "2026-07-31T03:04:05.000Z",
    createdBy: "user/author",
  };
}

function placementV2() {
  return {
    schemaId: STUDIO_EXPERIMENT_PLACEMENT_V2_SCHEMA_ID,
    placementId: "placement/article-afterload",
    snapshotId: "snapshot/3",
    caption: "Afterload experiment",
  };
}

function presetV2() {
  return {
    schemaId: STUDIO_SCENARIO_PRESET_V2_SCHEMA_ID,
    presetId: "preset/healthy",
    modelId: "model/main-wire-v3",
    title: "Healthy baseline",
    description: "A reusable starting state.",
    capture: captureV2(),
  };
}

function modelContractV2(): ModelContractV2 {
  return {
    modelId: "model/main-wire-v3",
    modelFamilyId: "model/main-wire",
    displayName: "Main Wire V3",
    fixtureSchemaId: "fixture/main-wire-v3",
    checkpointCodecId: "checkpoint/main-wire-v4",
    snapshotGateId: "snapshot-gate/main-wire-v3",
    parameterCatalog: [{
      parameterId: "catalog.parameter/svr",
    }],
    controlCatalog: [{
      controlId: "catalog.control/svr",
      parameterIds: ["catalog.parameter/svr"],
    }],
    outputCatalog: [{
      outputId: "catalog.output/map",
      kind: "metric",
      unit: "mmHg",
      shape: "scalar",
      scope: "beat",
      dependencies: [],
    }],
    graphCatalog: [{
      graphId: "catalog.graph/pressure",
      outputIds: ["catalog.output/map"],
    }],
  };
}

function captureAdapterV2(): RegisteredModelCaptureAdapterV2 {
  return {
    modelId: "model/main-wire-v3",
    fixtureSchemaId: "fixture/main-wire-v3",
    checkpointCodecId: "checkpoint/main-wire-v4",
    validateFixture({ fixture }) {
      const svr = (fixture as any)?.controls?.svr;
      if (typeof svr !== "number") throw new Error("invalid fixture schema");
    },
    validateCapture({ capture }) {
      if (!Array.isArray((capture.checkpoint.payload as any)?.state)) {
        throw new Error("invalid checkpoint codec");
      }
    },
  };
}

function exactRuntimeResolverV2() {
  const contract = modelContractV2();
  const captureAdapter = captureAdapterV2();
  return {
    resolveExactRuntime(modelId: string) {
      if (modelId !== contract.modelId) {
        throw new Error(`model ${modelId} is not registered`);
      }
      return {
        contract,
        captureAdapter,
        draftCapture: {
          modelId: contract.modelId,
          fixtureSchemaId: contract.fixtureSchemaId,
          checkpointCodecId: contract.checkpointCodecId,
          captureAcceptedCandidate() {
            throw new Error("not used by Preset clone");
          },
        },
        snapshotGate: {
          modelId: contract.modelId,
          snapshotGateId: contract.snapshotGateId,
          qualifyFrozenCandidate() {
            throw new Error("not used by Preset clone");
          },
        },
        fixtureAdapter: {
          modelId: contract.modelId,
          fixtureSchemaId: contract.fixtureSchemaId,
          validateCompleteFixture() {},
        },
      };
    },
  };
}
