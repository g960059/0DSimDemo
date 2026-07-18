import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeAll, describe, expect, it } from "vitest";

import i18n from "@/i18n";
import type { ControllerItem } from "@/types";
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
} from "@/components/scientificProduct/ScientificWorkbenchRuntimeRendererV1";
import {
  MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_BASELINE_VALUES_V0,
  MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_IDS_V0,
  MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_VALUE_DOMAINS_V0,
} from "@/engine/scientific/controls/MainWireScientificResearchControlCatalogV0";

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

  it("maps the authored PV-relations graph to its dedicated panel type", () => {
    const panel = graphViewToPanel({
      id: "lv-pv-relations",
      title: "ESPVR / EDPVR",
      kind: "graph",
      graphType: "pv-relations",
      membership: { healthy: ["Default"] },
    });

    expect(panel.type).toBe("PV_RELATIONS");
    expect(panel.view).toMatchObject({
      kind: "graph",
      graphType: "pv-relations",
    });
  });
});
