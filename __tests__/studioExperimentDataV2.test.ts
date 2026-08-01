import { describe, expect, it } from "vitest";

import {
  STUDIO_EXPERIMENT_PLACEMENT_V2_SCHEMA_ID,
  STUDIO_EXPERIMENT_SNAPSHOT_V2_SCHEMA_ID,
  STUDIO_EXPERIMENT_WORKSPACE_V2_SCHEMA_ID,
  STUDIO_SCENARIO_PRESET_V2_SCHEMA_ID,
} from "@/studio/contracts/v2/content";
import {
  assertExperimentContentMatchesModelV2,
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

  it("models role panes, authored presentation metadata and exactly one note", () => {
    const validated = validateExperimentWorkspaceV2(workspaceV2());
    expect(validated.content.surface).toEqual({
      graphPanes: [{
        paneId: "pane/pressure",
        role: "graph",
        label: "Pressure",
        colorHex: "#ff6685",
        order: 0,
        priority: 10,
        graphId: "catalog.graph/pressure",
        windowSec: 2,
        series: [{
          outputId: "catalog.output/map",
          label: "MAP",
          colorHex: "#3ea8ff",
          order: 0,
        }],
      }],
      outputPanes: [{
        paneId: "pane/outputs",
        role: "output",
        label: "Outputs",
        order: 0,
        priority: 8,
        items: [{
          outputId: "catalog.output/map",
          label: "MAP",
          colorHex: "#3ea8ff",
          order: 0,
        }],
      }],
      controlPanes: [{
        paneId: "pane/controls",
        role: "control",
        label: "Controls",
        order: 0,
        priority: 9,
        items: [{
          controlId: "catalog.control/svr",
          label: "SVR",
          colorHex: "#a78bfa",
          targetScenarioIds: ["scenario/baseline"],
          order: 0,
        }],
      }],
      note: {
        text: "Compare pressure and volume after the target changes.",
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

    for (const role of ["outputPanes", "controlPanes"] as const) {
      const legacyPaneColor = workspaceV2() as Record<string, any>;
      legacyPaneColor.content.surface[role][0].colorHex = "#3ea8ff";
      expect(() => validateExperimentWorkspaceV2(legacyPaneColor))
        .toThrow(/keys must be exactly/);
    }
  });

  it("requires every control item to bind explicit existing Scenarios", () => {
    const missingTargets = workspaceV2() as Record<string, any>;
    delete missingTargets.content.surface.controlPanes[0].items[0]
      .targetScenarioIds;
    expect(() => validateExperimentWorkspaceV2(missingTargets))
      .toThrow(/keys must be exactly/);

    const emptyTargets = workspaceV2() as Record<string, any>;
    emptyTargets.content.surface.controlPanes[0].items[0].targetScenarioIds = [];
    expect(() => validateExperimentWorkspaceV2(emptyTargets))
      .toThrow(/at least one explicit Scenario target/);

    const duplicateTargets = workspaceV2() as Record<string, any>;
    duplicateTargets.content.surface.controlPanes[0].items[0].targetScenarioIds = [
      "scenario/baseline",
      "scenario/baseline",
    ];
    expect(() => validateExperimentWorkspaceV2(duplicateTargets))
      .toThrow(/duplicate id scenario\/baseline/);

    const unknownTarget = validateExperimentWorkspaceV2({
      ...workspaceV2(),
      content: {
        ...workspaceV2().content,
        surface: {
          ...workspaceV2().content.surface,
          controlPanes: [{
            ...workspaceV2().content.surface.controlPanes[0],
            items: [{
              ...workspaceV2().content.surface.controlPanes[0].items[0],
              targetScenarioIds: ["scenario/missing"],
            }],
          }],
        },
      },
    });
    expect(() => assertExperimentContentMatchesModelV2(
      unknownTarget.content,
      modelContractV2(),
    )).toThrow(/unknown target Scenario scenario\/missing/);
  });

  it("enforces renderer-specific graph series against the full Output Catalog", () => {
    const emptySweep = workspaceV2() as Record<string, any>;
    emptySweep.content.surface.graphPanes[0].series = [];
    const validatedEmptySweep = validateExperimentWorkspaceV2(emptySweep);
    expect(() => assertExperimentContentMatchesModelV2(
      validatedEmptySweep.content,
      modelContractV2(),
    )).toThrow(/sweep graphs must select at least one scalar output/);

    const missingWindow = workspaceV2() as Record<string, any>;
    delete missingWindow.content.surface.graphPanes[0].windowSec;
    expect(() => assertExperimentContentMatchesModelV2(
      validateExperimentWorkspaceV2(missingWindow).content,
      modelContractV2(),
    )).toThrow(/must configure an authored waveform window/);

    for (const invalidWindow of [0.5, 1.25, 6.5]) {
      const invalid = workspaceV2() as Record<string, any>;
      invalid.content.surface.graphPanes[0].windowSec = invalidWindow;
      expect(() => validateExperimentWorkspaceV2(invalid))
        .toThrow(/must be 1–6 seconds in 0.5 second steps/);
    }

    const expandedModel = modelContractV2() as Record<string, any>;
    expandedModel.outputCatalog.push(
      {
        outputId: "catalog.output/temperature",
        kind: "signal",
        unit: "degC",
        shape: "scalar",
        sampling: "accepted-step",
      },
      {
        outputId: "catalog.output/vector",
        kind: "signal",
        unit: "1",
        shape: "vector",
        sampling: "accepted-step",
      },
    );

    const fullCatalogSelection = workspaceV2() as Record<string, any>;
    fullCatalogSelection.content.surface.graphPanes[0].series[0].outputId =
      "catalog.output/temperature";
    expect(() => assertExperimentContentMatchesModelV2(
      validateExperimentWorkspaceV2(fullCatalogSelection).content,
      expandedModel as ModelContractV2,
    )).not.toThrow();

    const mixedUnitSelection = workspaceV2() as Record<string, any>;
    mixedUnitSelection.content.surface.graphPanes[0].series.push({
      outputId: "catalog.output/temperature",
      label: "Temperature",
      colorHex: "#ffbb33",
      order: 1,
    });
    expect(() => assertExperimentContentMatchesModelV2(
      validateExperimentWorkspaceV2(mixedUnitSelection).content,
      expandedModel as ModelContractV2,
    )).toThrow(/sweep outputs must share one unit.*expected mmHg.*uses degC/);

    const vectorSelection = workspaceV2() as Record<string, any>;
    vectorSelection.content.surface.graphPanes[0].series[0].outputId =
      "catalog.output/vector";
    expect(() => assertExperimentContentMatchesModelV2(
      validateExperimentWorkspaceV2(vectorSelection).content,
      expandedModel as ModelContractV2,
    )).toThrow(/must be scalar/);

    const pressureVolumeModel = {
      ...modelContractV2(),
      graphCatalog: [{
        graphId: "catalog.graph/pv",
        renderer: "pressure-volume" as const,
        outputIds: ["catalog.output/map"],
        volumeOutputId: "catalog.output/map",
        pressureOutputId: "catalog.output/map",
        cyclePhaseOutputId: "catalog.output/map",
        guideMode: "none" as const,
      }],
    };
    const pressureVolume = workspaceV2() as Record<string, any>;
    pressureVolume.content.surface.graphPanes[0].graphId = "catalog.graph/pv";
    const validatedPressureVolume = validateExperimentWorkspaceV2(pressureVolume);
    expect(() => assertExperimentContentMatchesModelV2(
      validatedPressureVolume.content,
      pressureVolumeModel,
    )).toThrow(/pressure-volume graphs must not configure output series/);

    pressureVolume.content.surface.graphPanes[0].series = [];
    expect(() => assertExperimentContentMatchesModelV2(
      validateExperimentWorkspaceV2(pressureVolume).content,
      pressureVolumeModel,
    )).toThrow(/must not configure a waveform window/);
    delete pressureVolume.content.surface.graphPanes[0].windowSec;
    expect(() => assertExperimentContentMatchesModelV2(
      validateExperimentWorkspaceV2(pressureVolume).content,
      pressureVolumeModel,
    )).not.toThrow();
  });

  it("allows an empty role-pane surface and an empty note", () => {
    const candidate = workspaceV2() as Record<string, any>;
    candidate.content.surface = {
      graphPanes: [],
      outputPanes: [],
      controlPanes: [],
      note: { text: "" },
    };

    const validated = validateExperimentWorkspaceV2(candidate);
    expect(validated.content.surface).toEqual(candidate.content.surface);
    expect(() => assertExperimentContentMatchesModelV2(
      validated.content,
      modelContractV2(),
    )).not.toThrow();
  });

  it("pins a placement and distinguishes an omitted briefing from empty picks", () => {
    const snapshot = snapshotV2();
    const all = validateExperimentPlacementAgainstSnapshotV2(
      placementV2(),
      snapshot,
    );
    expect(all.briefing).toBeUndefined();

    const none = placementV2() as Record<string, any>;
    none.briefing = {
      scenarioIds: [],
      panePicks: [],
    };
    const validatedNone = validateExperimentPlacementAgainstSnapshotV2(
      none,
      snapshot,
    );
    expect(validatedNone.briefing).toEqual(none.briefing);
    expect(validatedNone.briefing?.scenarioIds).toEqual([]);
    expect(validatedNone.briefing?.panePicks).toEqual([]);

    const subset = placementV2() as Record<string, any>;
    subset.briefing = {
      scenarioIds: ["scenario/baseline"],
      panePicks: [
        { paneId: "pane/controls", priority: 20 },
        { paneId: "pane/pressure", priority: 10 },
      ],
    };
    expect(
      validateExperimentPlacementAgainstSnapshotV2(subset, snapshot).briefing,
    ).toEqual(subset.briefing);
  });

  it("rejects a wrong snapshot and invalid briefing selections", () => {
    const snapshot = snapshotV2();
    const wrongSnapshot = placementV2();
    wrongSnapshot.snapshotId = "snapshot/other";
    expect(() =>
      validateExperimentPlacementAgainstSnapshotV2(wrongSnapshot, snapshot)
    ).toThrow(/does not match the pinned snapshot/);

    const unknown = placementV2() as Record<string, any>;
    unknown.briefing = {
      panePicks: [{ paneId: "pane/missing", priority: 0 }],
    };
    expect(() =>
      validateExperimentPlacementAgainstSnapshotV2(unknown, snapshot)
    ).toThrow(/unknown pane pane\/missing/);

    const duplicate = placementV2() as Record<string, any>;
    duplicate.briefing = {
      scenarioIds: ["scenario/baseline", "scenario/baseline"],
      panePicks: [],
    };
    expect(() =>
      validateExperimentPlacementAgainstSnapshotV2(duplicate, snapshot)
    ).toThrow(/duplicate id scenario\/baseline/);

    const duplicatePick = placementV2() as Record<string, any>;
    duplicatePick.briefing = {
      panePicks: [
        { paneId: "pane/pressure", priority: 5 },
        { paneId: "pane/pressure", priority: 10 },
      ],
    };
    expect(() =>
      validateExperimentPlacementAgainstSnapshotV2(duplicatePick, snapshot)
    ).toThrow(/duplicate id pane\/pressure/);

    const negativePriority = placementV2() as Record<string, any>;
    negativePriority.briefing = {
      panePicks: [{ paneId: "pane/pressure", priority: -1 }],
    };
    expect(() =>
      validateExperimentPlacementAgainstSnapshotV2(negativePriority, snapshot)
    ).toThrow(/nonnegative safe integer/);
  });

  it("validates the only reusable named input/state object and applies it by copy", async () => {
    const caller = presetV2();
    const preset = validateScenarioPresetV2(caller);
    const cloner = createScenarioPresetCaptureClonerV2(
      exactRuntimeResolverV2(),
    );
    const applied = await cloner.clone(caller);

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
    await expect(cloner.clone(wrongModel)).rejects.toThrow(/not registered/);

    const wrongCodec = presetV2() as any;
    wrongCodec.capture.checkpoint.payload = { wrongCodec: true };
    await expect(cloner.clone(wrongCodec)).rejects.toThrow(/rejected capture/);

    const spoofedAdapter = {
      ...captureAdapterV2(),
      validateFixture() {},
      async validateCapture() {},
    };
    expect(Object.keys(cloner)).toEqual(["clone"]);
    expect(cloner).not.toHaveProperty("adapter");
    await expect((cloner.clone as any)(wrongCodec, spoofedAdapter))
      .rejects.toThrow(/rejected capture/);
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
        "noncanonical pane color",
        (candidate) => {
          candidate.content.surface.graphPanes[0].colorHex = "#FF6685";
        },
        /canonical lowercase #rrggbb color/,
      ],
      [
        "duplicate pane identity across roles",
        (candidate) => {
          candidate.content.surface.outputPanes[0].paneId = "pane/pressure";
        },
        /duplicate id pane\/pressure/,
      ],
      [
        "duplicate pane order within one role",
        (candidate) => {
          candidate.content.surface.graphPanes.push({
            ...structuredClone(candidate.content.surface.graphPanes[0]),
            paneId: "pane/pressure-secondary",
          });
        },
        /duplicate graph pane order 0/,
      ],
      [
        "duplicate item order",
        (candidate) => {
          candidate.content.surface.outputPanes[0].items.push({
            outputId: "catalog.output/other",
            label: "Other",
            colorHex: "#ffffff",
            order: 0,
          });
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
      graphPanes: [{
        paneId: "pane/pressure",
        role: "graph",
        label: "Pressure",
        colorHex: "#ff6685",
        order: 0,
        priority: 10,
        graphId: "catalog.graph/pressure",
        windowSec: 2,
        series: [{
          outputId: "catalog.output/map",
          label: "MAP",
          colorHex: "#3ea8ff",
          order: 0,
        }],
      }],
      outputPanes: [{
        paneId: "pane/outputs",
        role: "output",
        label: "Outputs",
        order: 0,
        priority: 8,
        items: [{
          outputId: "catalog.output/map",
          label: "MAP",
          colorHex: "#3ea8ff",
          order: 0,
        }],
      }],
      controlPanes: [{
        paneId: "pane/controls",
        role: "control",
        label: "Controls",
        order: 0,
        priority: 9,
        items: [{
          controlId: "catalog.control/svr",
          label: "SVR",
          colorHex: "#a78bfa",
          targetScenarioIds: ["scenario/baseline"],
          order: 0,
        }],
      }],
      note: {
        text: "Compare pressure and volume after the target changes.",
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
    controlCatalog: [{
      controlId: "catalog.control/svr",
      valueType: "number",
      unit: "1",
      minimum: 0.5,
      maximum: 2,
      step: 0.05,
      defaultValue: 1,
      changeSemantics: "reset",
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
      renderer: "sweep",
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
    async validateCapture({ capture }) {
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
          validateCompleteFixture() { return undefined; },
        },
        simulationAdapter: {
          modelId: contract.modelId,
          fixtureSchemaId: contract.fixtureSchemaId,
          checkpointCodecId: contract.checkpointCodecId,
          async createSession() {},
          disposeSession() {},
          currentFrame() {
            throw new Error("not used by Preset clone");
          },
          advanceOnePresentationStep() {
            throw new Error("not used by Preset clone");
          },
          applyControl() {
            throw new Error("not used by Preset clone");
          },
          requestAnalysis() {
            throw new Error("not used by Preset clone");
          },
          async replaceFixture() {
            return 0;
          },
          currentInputEpoch() {
            return 0;
          },
        },
      };
    },
  };
}
