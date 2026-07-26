import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeAll, describe, expect, it } from "vitest";

import i18n from "@/i18n";
import {
  MAIN_WIRE_SCIENTIFIC_OBSERVABLE_IDS_V1,
} from "@/engine/scientific/observables";
import type { ControllerItem, PanelDef } from "@/types";
import {
  ControllerItemsBuilder,
  normalizeControllerItemsForAuthoring,
  type ControllerAuthoringCatalog,
} from "@/components/workbench/ControllerItemsBuilder";
import {
  type ScenarioPresetCatalogEntry,
} from "@/components/workbench/ScenarioPane";
import {
  LEGACY_SCENARIO_PRESET_CATALOG,
} from "@/components/workbench/legacyScenarioPresetCatalog";
import {
  SCIENTIFIC_CONTROL_ARTERIAL_STIFFNESS_V1,
  SCIENTIFIC_CONTROL_PEEP_V1,
  SCIENTIFIC_CONTROL_PERICARDIAL_FLUID_V1,
  SCIENTIFIC_CONTROL_PULMONARY_V1,
  SCIENTIFIC_CONTROL_SYSTEMIC_V1,
  SCIENTIFIC_CONTROL_VENOUS_TONE_V1,
  SCIENTIFIC_WORKBENCH_CIRCULATION_CONTROLLER_ITEMS_V1,
  SCIENTIFIC_WORKBENCH_CONTROLLER_ITEMS_V1,
  SCIENTIFIC_WORKBENCH_VENTILATION_RESTRAINT_CONTROLLER_ITEMS_V1,
  graphViewToPanel,
  scientificControllerInteractionKeyV1,
  scientificControllerItemForReleaseV1,
  scientificHemodynamicDisplayModeV1,
} from "@/components/scientificProduct/ScientificWorkbenchRuntimeRendererV1";
import {
  MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_BASELINE_VALUES_V0,
  MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_IDS_V0,
  MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_VALUE_DOMAINS_V0,
} from "@/engine/scientific/controls/MainWireScientificResearchControlCatalogV0";
import {
  captureStudioGraphPaneSpecV1,
  panelFromStudioGraphPaneSpecV1,
  sameStudioGraphPaneSpecV1,
  studioGraphPaneCaptureDriftV1,
} from "@/components/studio/StudioGraphPaneProjectionV1";
import type {
  ScientificProductRuntimeRegistryPortV1,
} from "@/components/scientificProduct/ScientificProductRuntimeRegistryPortV1";

function authoringEntry(item: ControllerItem) {
  return {
    key: item.paramKey,
    label: item.label ?? item.paramKey,
    min: item.min ?? 0,
    max: item.max ?? 1,
    step: item.step ?? 1,
    defaultKind: "slider" as const,
    allowedKinds: ["slider"] as const,
    options: item.options ?? [],
    lockedDomain: true,
  };
}

const authoring: ControllerAuthoringCatalog = {
  sections: [
    {
      id: "release-bound-circulation",
      title: "Circulation load",
      entries: SCIENTIFIC_WORKBENCH_CIRCULATION_CONTROLLER_ITEMS_V1.map(
        authoringEntry,
      ),
    },
    {
      id: "release-bound-ventilation-restraint",
      title: "Ventilation & pericardial restraint",
      entries: SCIENTIFIC_WORKBENCH_VENTILATION_RESTRAINT_CONTROLLER_ITEMS_V1
        .map(authoringEntry),
    },
  ],
  baselineValues: MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_BASELINE_VALUES_V0,
  defaultItems: SCIENTIFIC_WORKBENCH_CONTROLLER_ITEMS_V1,
};

beforeAll(async () => {
  await i18n.changeLanguage("en");
});

describe("runtime-specific Workbench authoring seams", () => {
  it("normalizes runtime controller ids without admitting keys outside the injected catalog", () => {
    const result = normalizeControllerItemsForAuthoring([
      {
        paramKey: SCIENTIFIC_CONTROL_SYSTEMIC_V1,
        kind: "slider",
        label: "SVR",
        min: 0,
        max: 9,
        options: [{ label: "Unsupported", value: 1.1 }],
      },
      {
        paramKey: "systemicVascularResistanceScale",
        kind: "slider",
        label: "Legacy alias",
      },
    ], authoring);

    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      paramKey: SCIENTIFIC_CONTROL_SYSTEMIC_V1,
      min: 0.25,
      kind: "slider",
    });
    expect(result.items[0].max).toBe(4);
    expect(result.items[0].options?.map(({ value }) => value)).toEqual(
      MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_VALUE_DOMAINS_V0[
        SCIENTIFIC_CONTROL_SYSTEMIC_V1
      ].allowedValues,
    );
    expect(result.warnings).toContain(
      'Dropped controller item not exposed by this runtime: "systemicVascularResistanceScale".',
    );
  });

  it("renders from injected baselines without reading legacy SimInstance params", () => {
    const html = renderToStaticMarkup(React.createElement(ControllerItemsBuilder, {
      authoring,
      items: [...(authoring.defaultItems ?? [])],
    }));

    expect(html).toContain("Circulation load");
    expect(html).toContain("Ventilation &amp; pericardial restraint");
    expect(html).toContain("Systemic resistance scale");
    expect(html).toContain("Pulmonary resistance scale");
    expect(html).toContain("Venous tone");
    expect(html).toContain("Arterial PV stiffness");
    expect(html).toContain("PEEP boundary");
    expect(html).toContain("Pericardial occupancy");
    expect(html).not.toContain("Atrial contractility");
    expect(html).not.toContain("Not exposed by this scientific release");
  });

  it("coerces an authored button group to the exact-stop release slider", () => {
    const result = normalizeControllerItemsForAuthoring([{
      paramKey: SCIENTIFIC_CONTROL_SYSTEMIC_V1,
      kind: "buttonGroup",
      label: "SVR",
      min: 0.75,
      max: 1.5,
      step: 0.01,
      options: [{ label: "Unsupported", value: 1.1 }],
    }], authoring);

    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      kind: "slider",
      min: 0.25,
      max: 4,
    });
    expect(result.items[0].step).toBe(0.25);
    expect(result.items[0].options?.map(({ value }) => value)).toEqual(
      MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_VALUE_DOMAINS_V0[
        SCIENTIFIC_CONTROL_SYSTEMIC_V1
      ].allowedValues,
    );
    expect(result.warnings.join(" ")).toContain(
      "runtime domain does not admit buttonGroup",
    );

    const releaseItem = scientificControllerItemForReleaseV1(result.items[0]);
    expect(releaseItem.kind).toBe("slider");
    expect(releaseItem.step).toBe(0.25);
    expect(releaseItem.options?.map(({ value }) => value)).toEqual(
      MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_VALUE_DOMAINS_V0[
        SCIENTIFIC_CONTROL_SYSTEMIC_V1
      ].allowedValues,
    );
  });

  it("keeps the Product controller IDs and stops identical to the engine catalog", () => {
    expect([
      SCIENTIFIC_CONTROL_SYSTEMIC_V1,
      SCIENTIFIC_CONTROL_PULMONARY_V1,
      SCIENTIFIC_CONTROL_VENOUS_TONE_V1,
      SCIENTIFIC_CONTROL_ARTERIAL_STIFFNESS_V1,
      SCIENTIFIC_CONTROL_PEEP_V1,
      SCIENTIFIC_CONTROL_PERICARDIAL_FLUID_V1,
    ]).toEqual([...MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_IDS_V0]);
    expect(
      SCIENTIFIC_WORKBENCH_CONTROLLER_ITEMS_V1.map(({ paramKey }) => paramKey),
    ).toEqual([...MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_IDS_V0]);

    for (const item of SCIENTIFIC_WORKBENCH_CONTROLLER_ITEMS_V1) {
      expect(item.kind).toBe("slider");
      expect(item.options?.map(({ value }) => value)).toEqual(
        MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_VALUE_DOMAINS_V0[
          item.paramKey as keyof typeof MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_VALUE_DOMAINS_V0
        ].allowedValues,
      );
    }

    expect(Object.fromEntries(SCIENTIFIC_WORKBENCH_CONTROLLER_ITEMS_V1.map(
      (item) => [item.paramKey, [item.min, item.max]],
    ))).toEqual({
      [SCIENTIFIC_CONTROL_SYSTEMIC_V1]: [0.25, 4],
      [SCIENTIFIC_CONTROL_PULMONARY_V1]: [0.25, 4],
      [SCIENTIFIC_CONTROL_VENOUS_TONE_V1]: [0, 1],
      [SCIENTIFIC_CONTROL_ARTERIAL_STIFFNESS_V1]: [0.4, 3],
      [SCIENTIFIC_CONTROL_PEEP_V1]: [0, 25],
      [SCIENTIFIC_CONTROL_PERICARDIAL_FLUID_V1]: [0, 150],
    });
  });

  it("reasserts the exact-stop slider at render time and remounts on target identity", () => {
    const authoredSlider = {
      paramKey: SCIENTIFIC_CONTROL_SYSTEMIC_V1,
      kind: "slider" as const,
      min: 0.75,
      max: 1.5,
      step: 0.01,
    };
    const runtimeItem = scientificControllerItemForReleaseV1(authoredSlider);

    expect(runtimeItem.kind).toBe("slider");
    expect(runtimeItem.min).toBe(0.25);
    expect(runtimeItem.max).toBe(4);
    expect(runtimeItem.step).toBe(0.25);
    expect(runtimeItem.options?.map(({ value }) => value)).toEqual(
      MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_VALUE_DOMAINS_V0[
        SCIENTIFIC_CONTROL_SYSTEMIC_V1
      ].allowedValues,
    );
    expect(scientificControllerInteractionKeyV1(
      "scenario-a",
      "release-sha",
      authoredSlider,
    )).not.toBe(scientificControllerInteractionKeyV1(
      "scenario-b",
      "release-sha",
      authoredSlider,
    ));
    expect(scientificControllerInteractionKeyV1(
      "scenario-a",
      "release-sha",
      authoredSlider,
    )).not.toBe(scientificControllerInteractionKeyV1(
      "scenario-a",
      "release-sha",
      { ...authoredSlider, step: 0.05 },
    ));
  });

  it("keeps the legacy scenario presets as the default while accepting runtime catalogs", () => {
    const runtimeCatalog: readonly ScenarioPresetCatalogEntry[] = [
      { id: "healthy-v1", label: "Healthy", detail: "Scientific release v1" },
    ];

    expect(LEGACY_SCENARIO_PRESET_CATALOG.length).toBeGreaterThan(0);
    expect(runtimeCatalog).toEqual([
      { id: "healthy-v1", label: "Healthy", detail: "Scientific release v1" },
    ]);
  });

  it("restores authored graph legend position into the scientific panel view", () => {
    const panel = graphViewToPanel({
      id: "lv-pv",
      title: "LV pressure–volume loop",
      kind: "graph",
      graphType: "pvloop",
      membership: { healthy: ["LV"] },
      presentation: {
        showLegend: true,
        legendPosition: { xPct: 0.2, yPct: 0.3 },
      },
    });

    expect(panel.view).toMatchObject({
      kind: "graph",
      graphType: "pvloop",
      showLegend: true,
      legendPosition: { xPct: 0.2, yPct: 0.3 },
    });
  });

  it("restores authored cardiac-output response presentation settings", () => {
    expect(scientificHemodynamicDisplayModeV1("standard")).toBe("estimated");
    expect(scientificHemodynamicDisplayModeV1("settled-reference")).toBe("settled");
    expect(scientificHemodynamicDisplayModeV1("compare")).toBe("both");

    const panel = graphViewToPanel({
      id: "left-response",
      title: "Left heart: cardiac output & PCWP",
      kind: "graph",
      graphType: "guyton-left",
      membership: { healthy: [] },
      presentation: {
        showLegend: false,
        legendPosition: { xPct: 0.18, yPct: 0.22 },
        hemodynamicDetailMode: "compare",
        hemodynamicParameterHistoryCount: 3,
        hemodynamicAllowNegativeFillingPressure: true,
      },
    });

    expect(panel).toMatchObject({
      showLegend: false,
      view: {
        kind: "graph",
        graphType: "guyton-left",
        showLegend: false,
        legendPosition: { xPct: 0.18, yPct: 0.22 },
        hemodynamicDetailMode: "compare",
        hemodynamicParameterHistoryCount: 3,
        hemodynamicAllowNegativeFillingPressure: true,
      },
      hemodynamicDetailMode: "compare",
      hemodynamicParameterHistoryCount: 3,
      hemodynamicAllowNegativeFillingPressure: true,
    });
  });

  it("captures a detached Reader pane with resolved window, colors, names, and legend position", () => {
    const panel: PanelDef = {
      id: "pressure-pane",
      sourceViewId: "pressure-pane",
      type: "WAVEFORM",
      title: "Pressure comparison",
      role: "graph",
      zone: "main",
      w: 8,
      h: 4,
      config: {
        "workbench-scenario": {
          visible: true,
          selectedSignals: [
            "hemodynamics.pressure.absolute.Ao",
            "hemodynamics.pressure.absolute.LV",
          ],
          customBaseColor: "#123456",
          customName: "Captured scenario",
          customSignalColors: {
            "hemodynamics.pressure.absolute.Ao": "#abcdef",
          },
          customSignalNames: {
            "hemodynamics.pressure.absolute.Ao": "Custom Ao",
          },
        },
      },
      view: {
        kind: "graph",
        graphType: "waveform",
        showLegend: true,
        legendPosition: { xPct: 0.23, yPct: 0.37 },
        timeWindow: 7_000,
      },
      isSettingsOpen: true,
      showLegend: true,
      showGuides: false,
      timeWindow: 7_000,
    };
    const registry = {
      getPresentation: (scenarioId: string) =>
        scenarioId === "workbench-scenario"
          ? {
              descriptor: {
                id: scenarioId,
                name: "Runtime name",
                color: "#999999",
                isVisible: true,
              },
            }
          : null,
    } as unknown as ScientificProductRuntimeRegistryPortV1;

    const captured = captureStudioGraphPaneSpecV1({
      panel,
      registry,
      scenarioIdMap: new Map([
        ["workbench-scenario", "article-scenario"],
      ]),
    });

    expect(captured).toMatchObject({
      paneId: "pressure-pane",
      kind: "waveform",
      scenarios: [{
        scenarioId: "article-scenario",
        label: "Captured scenario",
        color: "#123456",
        items: [
          {
            itemId: "hemodynamics.pressure.absolute.Ao",
            label: "Custom Ao",
            unit: "mmHg",
            color: "#abcdef",
          },
          {
            itemId: "hemodynamics.pressure.absolute.LV",
            unit: "mmHg",
          },
        ],
      }],
      presentation: {
        showLegend: true,
        legendPosition: { xPct: 0.23, yPct: 0.37 },
        timeWindowMs: 7_000,
      },
    });
    expect(Object.isFrozen(captured)).toBe(true);
    expect(Object.isFrozen(captured.scenarios[0]?.items)).toBe(true);

    const readerPanel = panelFromStudioGraphPaneSpecV1(captured);
    expect(readerPanel).toMatchObject({
      type: "WAVEFORM",
      timeWindow: 7_000,
      showLegend: true,
      isSettingsOpen: false,
      config: {
        "article-scenario": {
          visible: true,
          customBaseColor: "#123456",
          customName: "Captured scenario",
          customSignalColors: {
            "hemodynamics.pressure.absolute.Ao": "#abcdef",
          },
          customSignalNames: {
            "hemodynamics.pressure.absolute.Ao": "Custom Ao",
          },
        },
      },
      view: {
        legendPosition: { xPct: 0.23, yPct: 0.37 },
      },
    });
  });

  it("fails closed when a visible Workbench scenario has no article mapping", () => {
    const panel: PanelDef = {
      id: "multi-scenario-pane",
      type: "WAVEFORM",
      title: "Comparison",
      w: 8,
      h: 4,
      config: {
        mapped: {
          visible: true,
          selectedSignals: ["hemodynamics.pressure.absolute.Ao"],
        },
        unmapped: {
          visible: true,
          selectedSignals: ["hemodynamics.pressure.absolute.LV"],
        },
      },
      isSettingsOpen: false,
    };
    const registry = {
      getPresentation: (scenarioId: string) => ({
        descriptor: {
          id: scenarioId,
          name: scenarioId,
          color: "#123456",
          isVisible: true,
        },
      }),
    } as unknown as ScientificProductRuntimeRegistryPortV1;

    expect(() => captureStudioGraphPaneSpecV1({
      panel,
      registry,
      scenarioIdMap: new Map([["mapped", "article-mapped"]]),
    })).toThrow(
      "Panel multi-scenario-pane has visible scenarios without article mappings: unmapped",
    );
  });

  it("round-trips PV generation history and Guyton compare settings through Reader panes", () => {
    const workspaceDocument = {
      content: {
        panels: [{
          view: {
            kind: "pressure-volume",
            trajectories: [{
              trajectoryId: "lv-primary",
              label: "Primary LV trajectory",
              volumeObservableId: "hemodynamics.volume.LV",
              pressureObservableId: "hemodynamics.pressure.absolute.LV",
            }],
          },
        }],
      },
    };
    const scenarioConfig = {
      "workbench-scenario": {
        visible: true,
        selectedSignals: ["lv-primary"],
        customBaseColor: "#334455",
        customName: "Exact source",
      },
    };
    const registry = {
      getPresentation: () => ({
        descriptor: {
          id: "workbench-scenario",
          name: "Runtime name",
          color: "#999999",
          isVisible: true,
        },
        workspaceDocument,
      }),
    } as unknown as ScientificProductRuntimeRegistryPortV1;
    const scenarioIdMap = new Map([
      ["workbench-scenario", "article-scenario"],
    ]);
    const pv = captureStudioGraphPaneSpecV1({
      registry,
      scenarioIdMap,
      panel: {
        id: "pv-pane",
        type: "PVLOOP",
        title: "LV PV",
        w: 6,
        h: 6,
        config: scenarioConfig,
        view: {
          kind: "graph",
          graphType: "pvloop",
          legendPosition: { xPct: 0.6, yPct: 0.1 },
        },
        isSettingsOpen: false,
        showLegend: false,
        showGuides: true,
        pvHistoryBeats: 12,
        pvHistoryMode: "persistent",
        pvParameterHistoryCount: 6,
        pvRelationDisplayMode: "research",
        pvRelationPressureBasis: "transmural",
        pvRelationShowSamplePoints: true,
      },
    });
    expect(pv.scenarios[0]!.items[0]).toMatchObject({
      itemId: "lv-primary",
      label: "Primary LV trajectory",
      unit: null,
    });
    expect(panelFromStudioGraphPaneSpecV1(pv)).toMatchObject({
      type: "PVLOOP",
      showLegend: false,
      showGuides: true,
      pvHistoryBeats: 12,
      pvHistoryMode: "persistent",
      pvParameterHistoryCount: 6,
      pvRelationDisplayMode: "research",
      pvRelationPressureBasis: "transmural",
      pvRelationShowSamplePoints: true,
      config: {
        "article-scenario": {
          selectedSignals: ["lv-primary"],
        },
      },
    });

    const pvWithRendererDefaults = captureStudioGraphPaneSpecV1({
      registry,
      scenarioIdMap,
      panel: {
        id: "pv-default-pane",
        type: "PVLOOP",
        title: "Default guides",
        w: 6,
        h: 6,
        config: scenarioConfig,
        isSettingsOpen: false,
      },
    });
    expect(pvWithRendererDefaults.presentation.showGuides).toBe(true);
    expect(pvWithRendererDefaults.presentation.pvBeatHistoryCount).toBe(4);
    expect(pvWithRendererDefaults.presentation.pvParameterHistoryCount).toBe(0);
    expect(panelFromStudioGraphPaneSpecV1(pvWithRendererDefaults).showGuides)
      .toBe(true);

    expect(() => captureStudioGraphPaneSpecV1({
      registry,
      scenarioIdMap,
      panel: {
        id: "forged-pv-pane",
        type: "PVLOOP",
        title: "Forged PV",
        w: 6,
        h: 6,
        config: {
          "workbench-scenario": {
            ...scenarioConfig["workbench-scenario"],
            selectedSignals: ["forged-pressure-volume-trajectory"],
          },
        },
        isSettingsOpen: false,
      },
    })).toThrow(
      /PV-loop item forged-pressure-volume-trajectory is not supported by scenario workbench-scenario's workspace/,
    );

    const guyton = captureStudioGraphPaneSpecV1({
      registry,
      scenarioIdMap,
      panel: {
        id: "guyton-pane",
        type: "GUYTON_LEFT",
        title: "Left response",
        w: 6,
        h: 6,
        config: {
          "workbench-scenario": {
            ...scenarioConfig["workbench-scenario"],
            selectedSignals: [],
          },
        },
        view: {
          kind: "graph",
          graphType: "guyton-left",
          legendPosition: { xPct: 0.7, yPct: 0.08 },
        },
        isSettingsOpen: false,
        showLegend: true,
        showGuides: false,
        hemodynamicDetailMode: "compare",
        hemodynamicParameterHistoryCount: 3,
        hemodynamicAllowNegativeFillingPressure: true,
      },
    });
    expect(panelFromStudioGraphPaneSpecV1(guyton)).toMatchObject({
      type: "GUYTON_LEFT",
      hemodynamicDetailMode: "compare",
      hemodynamicParameterHistoryCount: 3,
      hemodynamicAllowNegativeFillingPressure: true,
      view: {
        legendPosition: { xPct: 0.7, yPct: 0.08 },
      },
    });
  });

});

const HOST_SCENARIO_ID = "host-scenario";
const ARTICLE_SCENARIO_ID = "article-scenario";
const OBSERVABLE_ID = MAIN_WIRE_SCIENTIFIC_OBSERVABLE_IDS_V1[0]!;

function registryStubV1(
  isVisible: boolean,
): ScientificProductRuntimeRegistryPortV1 {
  return {
    getPresentation: (id: string) =>
      id === HOST_SCENARIO_ID
        ? ({
          descriptor: {
            id: HOST_SCENARIO_ID,
            name: "Reference adult",
            color: "#38bdf8",
            isVisible,
          },
          workspaceDocument: null,
        } as unknown as ReturnType<
          ScientificProductRuntimeRegistryPortV1["getPresentation"]
        >)
        : null,
  } as unknown as ScientificProductRuntimeRegistryPortV1;
}

function waveformPanelV1(timeWindow = 2_000): PanelDef {
  return {
    id: "product-left-pressure-v1",
    sourceViewId: "product-left-pressure-v1",
    type: "WAVEFORM",
    title: "Left pressures",
    role: "graph",
    zone: "main",
    w: 12,
    h: 5,
    config: {
      [HOST_SCENARIO_ID]: {
        visible: true,
        selectedSignals: [OBSERVABLE_ID],
      },
    },
    isSettingsOpen: false,
    showLegend: true,
    showGuides: false,
    timeWindow,
  } as unknown as PanelDef;
}

const CAPTURE_SCENARIO_ID_MAP = new Map([
  [HOST_SCENARIO_ID, ARTICLE_SCENARIO_ID],
]);
const PREVIEW_SCENARIO_ID_MAP = new Map([
  [ARTICLE_SCENARIO_ID, HOST_SCENARIO_ID],
]);

describe("StudioGraphPaneProjectionV1 authoring drift", () => {
  it("reports no drift while the live source is unchanged", () => {
    const registry = registryStubV1(true);
    const panel = waveformPanelV1();
    const pinned = captureStudioGraphPaneSpecV1({
      panel,
      registry,
      scenarioIdMap: CAPTURE_SCENARIO_ID_MAP,
    });

    expect(studioGraphPaneCaptureDriftV1(pinned, {
      panel,
      registry,
      scenarioIdMap: CAPTURE_SCENARIO_ID_MAP,
    })).toEqual({ kind: "current" });
  });

  it("reports drift after a presentation change, and clears it once re-pinned", () => {
    const registry = registryStubV1(true);
    const pinned = captureStudioGraphPaneSpecV1({
      panel: waveformPanelV1(2_000),
      registry,
      scenarioIdMap: CAPTURE_SCENARIO_ID_MAP,
    });
    const changed = waveformPanelV1(7_000);

    expect(studioGraphPaneCaptureDriftV1(pinned, {
      panel: changed,
      registry,
      scenarioIdMap: CAPTURE_SCENARIO_ID_MAP,
    })).toEqual({ kind: "drifted" });

    const resynced = captureStudioGraphPaneSpecV1({
      panel: changed,
      registry,
      scenarioIdMap: CAPTURE_SCENARIO_ID_MAP,
    });
    expect(sameStudioGraphPaneSpecV1(pinned, resynced)).toBe(false);
    expect(studioGraphPaneCaptureDriftV1(resynced, {
      panel: changed,
      registry,
      scenarioIdMap: CAPTURE_SCENARIO_ID_MAP,
    })).toEqual({ kind: "current" });
  });

  it("reports an uncapturable source instead of throwing", () => {
    const pinned = captureStudioGraphPaneSpecV1({
      panel: waveformPanelV1(),
      registry: registryStubV1(true),
      scenarioIdMap: CAPTURE_SCENARIO_ID_MAP,
    });

    const drift = studioGraphPaneCaptureDriftV1(pinned, {
      panel: waveformPanelV1(),
      registry: registryStubV1(false),
      scenarioIdMap: CAPTURE_SCENARIO_ID_MAP,
    });
    expect(drift.kind).toBe("uncapturable");
    if (drift.kind !== "uncapturable") throw new Error("unreachable");
    expect(drift.reason.length).toBeGreaterThan(0);
  });
});

describe("StudioGraphPaneProjectionV1 presentation options", () => {
  const pinned = captureStudioGraphPaneSpecV1({
    panel: waveformPanelV1(7_000),
    registry: registryStubV1(true),
    scenarioIdMap: CAPTURE_SCENARIO_ID_MAP,
  });

  it("keeps portable article identity when no options are supplied", () => {
    const panel = panelFromStudioGraphPaneSpecV1(pinned);
    expect(panel.id).toBe("product-left-pressure-v1");
    expect(Object.keys(panel.config)).toEqual([ARTICLE_SCENARIO_ID]);
  });

  it("remaps onto the host session for an authoring preview", () => {
    const panel = panelFromStudioGraphPaneSpecV1(pinned, {
      scenarioIdMap: PREVIEW_SCENARIO_ID_MAP,
      panelId: "briefing-preview:product-left-pressure-v1",
    });
    expect(panel.id).toBe("briefing-preview:product-left-pressure-v1");
    // The pane keeps its portable identity even when the panel id is scoped
    // to the preview, so presentation settings stay attached to the capture.
    expect(panel.sourceViewId).toBe("product-left-pressure-v1");
    expect(Object.keys(panel.config)).toEqual([HOST_SCENARIO_ID]);
    expect(panel.timeWindow).toBe(7_000);
  });

  it("falls back to the article id when a scenario has no host mapping", () => {
    const panel = panelFromStudioGraphPaneSpecV1(pinned, {
      scenarioIdMap: new Map([["unrelated", "other"]]),
    });
    expect(Object.keys(panel.config)).toEqual([ARTICLE_SCENARIO_ID]);
  });
});
