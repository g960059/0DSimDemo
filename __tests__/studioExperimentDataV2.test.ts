import { describe, expect, it } from "vitest";

import {
  STUDIO_EXPERIMENT_PLACEMENT_V2_SCHEMA_ID,
  STUDIO_EXPERIMENT_SCENARIO_LIMIT_V2,
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

  it("limits durable and desired Experiment content to four Scenarios", () => {
    const workspace = workspaceV2() as Record<string, any>;
    const baseline = workspace.content.scenarios[0];
    workspace.content.scenarios = Array.from(
      { length: STUDIO_EXPERIMENT_SCENARIO_LIMIT_V2 + 1 },
      (_, index) => ({
        ...baseline,
        scenarioId: `scenario/${index + 1}`,
        label: `Scenario ${index + 1}`,
      }),
    );
    expect(() => validateExperimentWorkspaceV2(workspace))
      .toThrow(/at most 4 Scenarios/);

    const desired = desiredContentV2() as Record<string, any>;
    const desiredBaseline = desired.scenarios[0];
    desired.scenarios = Array.from(
      { length: STUDIO_EXPERIMENT_SCENARIO_LIMIT_V2 + 1 },
      (_, index) => ({
        ...desiredBaseline,
        scenarioId: `scenario/${index + 1}`,
        label: `Scenario ${index + 1}`,
      }),
    );
    expect(() => validateExperimentDesiredContentForModelV2(
      desired,
      modelContractV2(),
    )).toThrow(/at most 4 Scenarios/);
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
        order: 0,
        priority: 10,
        graphId: "catalog.graph/pressure",
        windowSec: 2,
        series: [{
          seriesId: "MAP",
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

    for (
      const role of ["graphPanes", "outputPanes", "controlPanes"] as const
    ) {
      const legacyPaneColor = workspaceV2() as Record<string, any>;
      legacyPaneColor.content.surface[role][0].colorHex = "#3ea8ff";
      expect(() => validateExperimentWorkspaceV2(legacyPaneColor))
        .toThrow(/field set mismatch|keys must be exactly/);
    }

    for (const role of ["outputPanes", "controlPanes"] as const) {
      const legacyItemColor = workspaceV2() as Record<string, any>;
      legacyItemColor.content.surface[role][0].items[0].colorHex = "#3ea8ff";
      expect(() => validateExperimentWorkspaceV2(legacyItemColor))
        .toThrow(/field set mismatch|keys must be exactly/);
    }
  });

  it("keeps control panes Scenario-agnostic for the active inspector context", () => {
    const validated = validateExperimentWorkspaceV2(workspaceV2());
    expect(validated.content.surface.controlPanes[0]?.items[0]).toEqual({
      controlId: "catalog.control/svr",
      label: "SVR",
      order: 0,
    });
    expect(() => assertExperimentContentMatchesModelV2(
      validated.content,
      modelContractV2(),
    )).not.toThrow();

    const legacyTargets = workspaceV2() as Record<string, any>;
    legacyTargets.content.surface.controlPanes[0].items[0].targetScenarioIds = [
      "scenario/baseline",
    ];
    expect(() => validateExperimentWorkspaceV2(legacyTargets))
      .toThrow(/keys must be exactly/);
  });

  it("enforces renderer-specific selections against graph-owned series catalogs", () => {
    const emptySweep = workspaceV2() as Record<string, any>;
    emptySweep.content.surface.graphPanes[0].series = [];
    const validatedEmptySweep = validateExperimentWorkspaceV2(emptySweep);
    expect(() => assertExperimentContentMatchesModelV2(
      validatedEmptySweep.content,
      modelContractV2(),
    )).toThrow(/sweep graphs must select at least one registered series/);

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

    const expandedModel = structuredClone(
      modelContractV2(),
    ) as Record<string, any>;
    expandedModel.outputCatalog.push({
      outputId: "catalog.output/temperature",
      kind: "signal",
      unit: "mmHg",
      shape: "scalar",
      sampling: "accepted-step",
    });
    expandedModel.graphCatalog[0].seriesCatalog.push({
      kind: "scalar",
      seriesId: "Temperature",
      outputId: "catalog.output/temperature",
    });

    const registeredSeriesSelection = workspaceV2() as Record<string, any>;
    registeredSeriesSelection.content.surface.graphPanes[0].series[0].seriesId =
      "Temperature";
    expect(() => assertExperimentContentMatchesModelV2(
      validateExperimentWorkspaceV2(registeredSeriesSelection).content,
      expandedModel as ModelContractV2,
    )).not.toThrow();

    const unknownSeriesSelection = workspaceV2() as Record<string, any>;
    unknownSeriesSelection.content.surface.graphPanes[0].series[0].seriesId =
      "Missing";
    expect(() => assertExperimentContentMatchesModelV2(
      validateExperimentWorkspaceV2(unknownSeriesSelection).content,
      expandedModel as ModelContractV2,
    )).toThrow(/unknown registered graph series Missing/);

    const pressureVolumeModel = {
      ...modelContractV2(),
      graphCatalog: [{
        graphId: "hemodynamics.pressure-volume",
        renderer: "pressure-volume" as const,
        seriesCatalog: [{
          kind: "pressure-volume" as const,
          seriesId: "LV",
          volumeOutputId: "catalog.output/map",
          pressureOutputId: "catalog.output/map",
          pressureBasis: "transmural" as const,
          cyclePhaseOutputId: "catalog.output/map",
          guideMode: "lv-single-beat-orientation" as const,
        }],
        defaultSeriesIds: ["LV"],
      }],
    };
    const pressureVolume = workspaceV2() as Record<string, any>;
    pressureVolume.content.surface.graphPanes[0].graphId =
      "hemodynamics.pressure-volume";
    pressureVolume.content.surface.graphPanes[0].historyDepth = 1;
    pressureVolume.content.surface.graphPanes[0].series = [{
      seriesId: "LV",
      label: "LV",
      colorHex: "#cf405a",
      order: 0,
    }];
    const validatedPressureVolume = validateExperimentWorkspaceV2(
      pressureVolume,
    );
    expect(() => assertExperimentContentMatchesModelV2(
      validatedPressureVolume.content,
      pressureVolumeModel,
    )).toThrow(/must not configure a waveform window/);

    delete pressureVolume.content.surface.graphPanes[0].windowSec;
    expect(() => assertExperimentContentMatchesModelV2(
      validateExperimentWorkspaceV2(pressureVolume).content,
      pressureVolumeModel,
    )).not.toThrow();

    for (const invalidDepth of [-1, 1.5, 4]) {
      const invalid = structuredClone(pressureVolume);
      invalid.content.surface.graphPanes[0].historyDepth = invalidDepth;
      expect(() => validateExperimentWorkspaceV2(invalid))
        .toThrow(/must be an integer from 0 to 3/);
    }

    const sweepWithHistory = workspaceV2() as Record<string, any>;
    sweepWithHistory.content.surface.graphPanes[0].historyDepth = 1;
    expect(() => assertExperimentContentMatchesModelV2(
      validateExperimentWorkspaceV2(sweepWithHistory).content,
      modelContractV2(),
    )).toThrow(/sweep graphs must not configure an explicit history depth/);

    pressureVolume.content.surface.graphPanes[0].series = [];
    expect(() => assertExperimentContentMatchesModelV2(
      validateExperimentWorkspaceV2(pressureVolume).content,
      pressureVolumeModel,
    )).toThrow(
      /pressure-volume graphs must select at least one registered series/,
    );
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

  it("pins a placement and validates role-specific Reader briefing content", () => {
    const snapshot = snapshotV2();
    const all = validateExperimentPlacementAgainstSnapshotV2(
      placementV2(),
      snapshot,
    );
    expect(all.briefing).toBeUndefined();

    const roleSpecific = placementV2() as Record<string, any>;
    roleSpecific.briefing = briefingV2();
    const validated = validateExperimentPlacementAgainstSnapshotV2(
      roleSpecific,
      snapshot,
    );
    expect(validated.briefing).toEqual(roleSpecific.briefing);
    expect(validated.briefing).toMatchObject({
      scenarioScope: {
        visibleScenarioIds: ["scenario/baseline"],
        initialFocusScenarioId: "scenario/baseline",
      },
      graphs: [{
        paneId: "pane/pressure",
        emphasis: "primary",
        overrides: {
          legend: "compact",
          windowSec: 3,
        },
      }],
      outputs: [{ outputId: "catalog.output/map" }],
      controls: [{
        controlId: "catalog.control/svr",
        presentation: {
          kind: "buttons",
          options: [
            { label: "Low", value: 0.8 },
            { label: "High", value: 1.2 },
          ],
        },
        binding: {
          mode: "fixed",
          scenarioIds: ["scenario/baseline"],
          application: "absolute",
        },
      }],
    });
    expect(Object.isFrozen(validated.briefing)).toBe(true);
  });

  it("rejects a wrong snapshot and malformed or unknown briefing selections", () => {
    const snapshot = snapshotV2();
    const wrongSnapshot = placementV2();
    wrongSnapshot.snapshotId = "snapshot/other";
    expect(() =>
      validateExperimentPlacementAgainstSnapshotV2(wrongSnapshot, snapshot)
    ).toThrow(/does not match the pinned snapshot/);

    const malformed = placementV2() as Record<string, any>;
    malformed.briefing = { unknownProjection: [] };
    expect(() =>
      validateExperimentPlacementAgainstSnapshotV2(malformed, snapshot)
    ).toThrow(/keys must be exactly/);

    const unknownGraph = placementWithBriefingV2();
    unknownGraph.briefing.graphs[0].paneId = "pane/missing";
    expect(() =>
      validateExperimentPlacementAgainstSnapshotV2(unknownGraph, snapshot)
    ).toThrow(/unknown graph pane pane\/missing/);

    const unknownSeries = placementWithBriefingV2();
    unknownSeries.briefing.graphs[0].overrides.series[0].seriesId = "missing";
    expect(() =>
      validateExperimentPlacementAgainstSnapshotV2(unknownSeries, snapshot)
    ).toThrow(/unknown id missing/);

    const unknownOutput = placementWithBriefingV2();
    unknownOutput.briefing.outputs[0].outputId = "catalog.output/missing";
    expect(() =>
      validateExperimentPlacementAgainstSnapshotV2(unknownOutput, snapshot)
    ).toThrow(/unknown Surface output catalog.output\/missing/);

    const unknownControl = placementWithBriefingV2();
    unknownControl.briefing.controls[0].controlId = "catalog.control/missing";
    expect(() =>
      validateExperimentPlacementAgainstSnapshotV2(unknownControl, snapshot)
    ).toThrow(/unknown Surface control catalog.control\/missing/);
  });

  it("fails closed on briefing identity, order, labels, colors and button values", () => {
    const cases: Array<readonly [
      string,
      (briefing: Record<string, any>) => void,
      RegExp,
    ]> = [
      [
        "duplicate graph pane",
        (briefing) => {
          briefing.graphs.push({ ...briefing.graphs[0], order: 1 });
        },
        /duplicate id pane\/pressure/,
      ],
      [
        "negative graph order",
        (briefing) => {
          briefing.graphs[0].order = -1;
        },
        /nonnegative safe integer/,
      ],
      [
        "unknown emphasis",
        (briefing) => {
          briefing.graphs[0].emphasis = "hero";
        },
        /must be primary or supporting/,
      ],
      [
        "blank graph label",
        (briefing) => {
          briefing.graphs[0].overrides.label = " ";
        },
        /nonempty trimmed string/,
      ],
      [
        "noncanonical graph color",
        (briefing) => {
          briefing.graphs[0].overrides.series[0].colorHex = "#3EA8FF";
        },
        /canonical lowercase #rrggbb color/,
      ],
      [
        "duplicate output",
        (briefing) => {
          briefing.outputs.push({ ...briefing.outputs[0], order: 1 });
        },
        /duplicate id catalog.output\/map/,
      ],
      [
        "untrimmed output label",
        (briefing) => {
          briefing.outputs[0].label = " MAP";
        },
        /nonempty trimmed string/,
      ],
      [
        "duplicate control",
        (briefing) => {
          briefing.controls.push({ ...briefing.controls[0], order: 1 });
        },
        /duplicate id catalog.control\/svr/,
      ],
      [
        "invalid button value",
        (briefing) => {
          briefing.controls[0].presentation.options[0].value = "low";
        },
        /must be a finite number/,
      ],
      [
        "duplicate button value",
        (briefing) => {
          briefing.controls[0].presentation.options[1].value = 0.8;
        },
        /duplicate button value/,
      ],
      [
        "empty buttons",
        (briefing) => {
          briefing.controls[0].presentation.options = [];
        },
        /must contain at least one option/,
      ],
      [
        "invalid fixed application",
        (briefing) => {
          briefing.controls[0].binding.application = "relative";
        },
        /must be absolute/,
      ],
    ];

    for (const [_name, mutate, pattern] of cases) {
      const placement = placementWithBriefingV2();
      mutate(placement.briefing);
      expect(() => validateExperimentPlacementAgainstSnapshotV2(
        placement,
        snapshotV2(),
      )).toThrow(pattern);
    }
  });

  it("fails closed on Reader scenario scope and control binding targets", () => {
    const duplicateVisible = placementWithBriefingV2();
    duplicateVisible.briefing.scenarioScope.visibleScenarioIds.push(
      "scenario/baseline",
    );
    expect(() => validateExperimentPlacementAgainstSnapshotV2(
      duplicateVisible,
      snapshotV2(),
    )).toThrow(/duplicate id scenario\/baseline/);

    const emptyVisible = placementWithBriefingV2();
    emptyVisible.briefing.scenarioScope.visibleScenarioIds = [];
    expect(() => validateExperimentPlacementAgainstSnapshotV2(
      emptyVisible,
      snapshotV2(),
    )).toThrow(/must contain at least one Scenario/);

    const focusOutsideScope = placementWithBriefingV2();
    focusOutsideScope.briefing.scenarioScope.initialFocusScenarioId =
      "scenario/comparison";
    expect(() => validateExperimentPlacementAgainstSnapshotV2(
      focusOutsideScope,
      snapshotV2(),
    )).toThrow(/must be included in visibleScenarioIds/);

    const snapshot = snapshotV2() as Record<string, any>;
    snapshot.content.scenarios.push({
      ...structuredClone(snapshot.content.scenarios[0]),
      scenarioId: "scenario/comparison",
      label: "Comparison",
    });
    const hiddenFixedTarget = placementWithBriefingV2();
    hiddenFixedTarget.briefing.controls[0].binding.scenarioIds = [
      "scenario/comparison",
    ];
    expect(() => validateExperimentPlacementAgainstSnapshotV2(
      hiddenFixedTarget,
      snapshot,
    )).toThrow(/unknown id scenario\/comparison/);

    const readerFocus = placementWithBriefingV2();
    readerFocus.briefing.controls[0].binding = {
      mode: "reader-focus",
      allowedScenarioIds: ["scenario/baseline"],
    };
    expect(() => validateExperimentPlacementAgainstSnapshotV2(
      readerFocus,
      snapshotV2(),
    )).not.toThrow();

    readerFocus.briefing.controls[0].binding.allowedScenarioIds = [];
    expect(() => validateExperimentPlacementAgainstSnapshotV2(
      readerFocus,
      snapshotV2(),
    )).toThrow(/must contain at least one Scenario/);
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
        "noncanonical graph series color",
        (candidate) => {
          candidate.content.surface.graphPanes[0].series[0].colorHex = "#FF6685";
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
        order: 0,
        priority: 10,
        graphId: "catalog.graph/pressure",
        windowSec: 2,
        series: [{
          seriesId: "MAP",
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

function briefingV2() {
  return {
    scenarioScope: {
      visibleScenarioIds: ["scenario/baseline"],
      initialFocusScenarioId: "scenario/baseline",
    },
    graphs: [{
      paneId: "pane/pressure",
      order: 0,
      emphasis: "primary",
      overrides: {
        label: "Arterial pressure",
        legend: "compact",
        series: [{
          seriesId: "MAP",
          label: "MAP",
          colorHex: "#3ea8ff",
          order: 0,
        }],
        windowSec: 3,
      },
    }],
    outputs: [{
      outputId: "catalog.output/map",
      label: "MAP",
      order: 0,
    }],
    controls: [{
      controlId: "catalog.control/svr",
      label: "Afterload",
      order: 0,
      presentation: {
        kind: "buttons",
        options: [
          { label: "Low", value: 0.8 },
          { label: "High", value: 1.2 },
        ],
      },
      binding: {
        mode: "fixed",
        scenarioIds: ["scenario/baseline"],
        application: "absolute",
      },
    }],
  };
}

function placementWithBriefingV2() {
  return {
    ...placementV2(),
    briefing: briefingV2(),
  } as Record<string, any>;
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
      seriesCatalog: [{
        kind: "scalar",
        seriesId: "MAP",
        outputId: "catalog.output/map",
      }],
      defaultSeriesIds: ["MAP"],
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
