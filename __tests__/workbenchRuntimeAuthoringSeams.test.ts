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
  SCIENTIFIC_CONTROL_SYSTEMIC_V1,
  graphViewToPanel,
  scientificControllerInteractionKeyV1,
  scientificControllerItemForReleaseV1,
} from "@/components/scientificProduct/ScientificWorkbenchRuntimeRendererV1";

const authoring: ControllerAuthoringCatalog = {
  sections: [
    {
      id: "release-bound",
      title: "Release-bound controls",
      entries: [
        {
          key: "circulation.systemic-resistance-scale",
          label: "Systemic vascular resistance",
          min: 0.75,
          max: 4 / 3,
          step: 1 / 12,
          defaultKind: "buttonGroup",
          allowedKinds: ["buttonGroup"],
          options: [
            { label: "Low", value: 0.75 },
            { label: "Reference", value: 1 },
            { label: "High", value: 4 / 3 },
          ],
        },
        {
          key: "mechanics.atrial-contractility-scale",
          label: "Atrial contractility",
          min: 0.5,
          max: 1.5,
          step: 0.05,
          disabledReason: "Not exposed by this scientific release",
        },
      ],
    },
  ],
  baselineValues: {
    "circulation.systemic-resistance-scale": 1,
  },
  defaultItems: [
    {
      paramKey: "circulation.systemic-resistance-scale",
      kind: "buttonGroup",
      label: "Systemic vascular resistance",
      options: [
        { label: "Low", value: 0.75 },
        { label: "Reference", value: 1 },
        { label: "High", value: 4 / 3 },
      ],
    },
  ],
};

beforeAll(async () => {
  await i18n.changeLanguage("en");
});

describe("runtime-specific Workbench authoring seams", () => {
  it("normalizes runtime controller ids without admitting keys outside the injected catalog", () => {
    const result = normalizeControllerItemsForAuthoring([
      {
        paramKey: "circulation.systemic-resistance-scale",
        kind: "buttonGroup",
        label: "SVR",
        min: 0,
        max: 9,
        options: [
          { label: "Low", value: 0.75 },
          { label: "Reference", value: 1 },
          { label: "High", value: 4 / 3 },
        ],
      },
      { paramKey: "legacy.contractility", kind: "slider", label: "Legacy" },
    ], authoring);

    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      paramKey: "circulation.systemic-resistance-scale",
      min: 0.75,
      kind: "buttonGroup",
    });
    expect(result.items[0].max).toBeCloseTo(4 / 3, 10);
    expect(result.items[0].max).toBe(4 / 3);
    expect(result.items[0].options?.map((option) => option.value)).toEqual([
      0.75,
      1,
      4 / 3,
    ]);
    expect(result.warnings).toContain(
      'Dropped controller item not exposed by this runtime: "legacy.contractility".',
    );
  });

  it("renders from injected baselines without reading legacy SimInstance params", () => {
    const html = renderToStaticMarkup(React.createElement(ControllerItemsBuilder, {
      authoring,
      items: [...(authoring.defaultItems ?? [])],
    }));

    expect(html).toContain("Release-bound controls");
    expect(html).toContain("Systemic vascular resistance");
    expect(html).toContain("Not exposed by this scientific release");
  });

  it("coerces an authored continuous slider to the enumerated release domain", () => {
    const result = normalizeControllerItemsForAuthoring([{
      paramKey: "circulation.systemic-resistance-scale",
      kind: "slider",
      label: "SVR",
      min: 0.75,
      max: 4 / 3,
      step: 0.01,
    }], authoring);

    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      kind: "buttonGroup",
      min: 0.75,
      max: 4 / 3,
    });
    expect(result.items[0].options?.map(({ value }) => value)).toEqual([
      0.75,
      1,
      4 / 3,
    ]);
    expect(result.warnings.join(" ")).toContain(
      "runtime domain does not admit slider",
    );

    const malformed = normalizeControllerItemsForAuthoring([{
      paramKey: "circulation.systemic-resistance-scale",
      kind: "buttonGroup",
      options: [{ label: "Only", value: 1 }],
    }], authoring);
    expect(malformed.items[0].kind).toBe("buttonGroup");
    expect(malformed.items[0].options?.map(({ value }) => value)).toEqual([
      0.75,
      1,
      4 / 3,
    ]);
    expect(malformed.warnings.join(" ")).toContain(
      "Restored canonical button values",
    );
  });

  it("reasserts the enumerated domain at render time and remounts on target identity", () => {
    const authoredSlider = {
      paramKey: SCIENTIFIC_CONTROL_SYSTEMIC_V1,
      kind: "slider" as const,
      min: 0.75,
      max: 4 / 3,
      step: 0.01,
    };
    const runtimeItem = scientificControllerItemForReleaseV1(authoredSlider);

    expect(runtimeItem.kind).toBe("buttonGroup");
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
