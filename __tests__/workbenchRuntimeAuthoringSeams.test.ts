import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeAll, describe, expect, it } from "vitest";

import i18n from "@/i18n";
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
  SCIENTIFIC_CONTROL_PULMONARY_V1,
  SCIENTIFIC_CONTROL_SYSTEMIC_V1,
  SCIENTIFIC_WORKBENCH_CONTROLLER_ITEMS_V1,
  graphViewToPanel,
  scientificControllerInteractionKeyV1,
  scientificControllerItemForReleaseV1,
} from "@/components/scientificProduct/ScientificWorkbenchRuntimeRendererV1";
import {
  MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_IDS_V0,
  MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_SCALE_VALUES_V0,
} from "@/engine/scientific/controls/MainWireScientificResearchControlCatalogV0";

const exactStops = MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_SCALE_VALUES_V0.map(
  (value) => ({ label: `${value.toFixed(2)}×`, value }),
);

const authoring: ControllerAuthoringCatalog = {
  sections: [
    {
      id: "release-bound",
      title: "Release-bound controls",
      entries: [
        {
          key: SCIENTIFIC_CONTROL_SYSTEMIC_V1,
          label: "Systemic vascular resistance",
          min: 0.75,
          max: 4 / 3,
          step: 1 / 12,
          defaultKind: "slider",
          allowedKinds: ["slider"],
          options: exactStops,
          lockedDomain: true,
        },
        {
          key: SCIENTIFIC_CONTROL_PULMONARY_V1,
          label: "Pulmonary vascular resistance",
          min: 0.75,
          max: 4 / 3,
          step: 1 / 12,
          defaultKind: "slider",
          allowedKinds: ["slider"],
          options: exactStops,
          lockedDomain: true,
        },
      ],
    },
  ],
  baselineValues: {
    [SCIENTIFIC_CONTROL_SYSTEMIC_V1]: 1,
    [SCIENTIFIC_CONTROL_PULMONARY_V1]: 1,
  },
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
        options: exactStops,
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
      min: 0.75,
      kind: "slider",
    });
    expect(result.items[0].max).toBeCloseTo(4 / 3, 10);
    expect(result.items[0].max).toBe(4 / 3);
    expect(result.items[0].options?.map(({ value }) => value)).toEqual([
      0.75,
      1,
      4 / 3,
    ]);
    expect(result.warnings).toContain(
      'Dropped controller item not exposed by this runtime: "systemicVascularResistanceScale".',
    );
  });

  it("renders from injected baselines without reading legacy SimInstance params", () => {
    const html = renderToStaticMarkup(React.createElement(ControllerItemsBuilder, {
      authoring,
      items: [...(authoring.defaultItems ?? [])],
    }));

    expect(html).toContain("Release-bound controls");
    expect(html).toContain("Systemic vascular resistance");
    expect(html).toContain("Pulmonary vascular resistance");
    expect(html).not.toContain("Atrial contractility");
    expect(html).not.toContain("Not exposed by this scientific release");
  });

  it("coerces an authored button group to the exact-stop release slider", () => {
    const result = normalizeControllerItemsForAuthoring([{
      paramKey: SCIENTIFIC_CONTROL_SYSTEMIC_V1,
      kind: "buttonGroup",
      label: "SVR",
      min: 0.75,
      max: 4 / 3,
      step: 0.01,
      options: [{ label: "Unsupported", value: 1.1 }],
    }], authoring);

    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      kind: "slider",
      min: 0.75,
      max: 4 / 3,
    });
    expect(result.items[0].step).toBe(1 / 12);
    expect(result.items[0].options?.map(({ value }) => value)).toEqual([
      0.75,
      1,
      4 / 3,
    ]);
    expect(result.warnings.join(" ")).toContain(
      "runtime domain does not admit buttonGroup",
    );

    const releaseItem = scientificControllerItemForReleaseV1(result.items[0]);
    expect(releaseItem.kind).toBe("slider");
    expect(releaseItem.step).toBe(1 / 12);
    expect(releaseItem.options?.map(({ value }) => value)).toEqual([
      0.75,
      1,
      4 / 3,
    ]);
  });

  it("keeps the Product controller IDs and stops identical to the engine catalog", () => {
    expect([
      SCIENTIFIC_CONTROL_SYSTEMIC_V1,
      SCIENTIFIC_CONTROL_PULMONARY_V1,
    ]).toEqual([...MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_IDS_V0]);
    expect(
      SCIENTIFIC_WORKBENCH_CONTROLLER_ITEMS_V1.map(({ paramKey }) => paramKey),
    ).toEqual([...MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_IDS_V0]);

    for (const item of SCIENTIFIC_WORKBENCH_CONTROLLER_ITEMS_V1) {
      expect(item.kind).toBe("slider");
      expect(item.options?.map(({ value }) => value)).toEqual(
        [...MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_SCALE_VALUES_V0],
      );
    }
  });

  it("reasserts the exact-stop slider at render time and remounts on target identity", () => {
    const authoredSlider = {
      paramKey: SCIENTIFIC_CONTROL_SYSTEMIC_V1,
      kind: "slider" as const,
      min: 0.75,
      max: 4 / 3,
      step: 0.01,
    };
    const runtimeItem = scientificControllerItemForReleaseV1(authoredSlider);

    expect(runtimeItem.kind).toBe("slider");
    expect(runtimeItem.min).toBe(0.75);
    expect(runtimeItem.max).toBe(4 / 3);
    expect(runtimeItem.step).toBe(1 / 12);
    expect(runtimeItem.options?.map(({ value }) => value)).toEqual([
      0.75,
      1,
      4 / 3,
    ]);
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
});
