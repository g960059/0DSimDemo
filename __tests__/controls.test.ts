import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeAll, describe, expect, it, vi } from "vitest";
import i18n from "@/i18n";
import { Controls, getChangedClinicalControls, resetClinicalKnobsToBaseline } from "@/components/Controls";
import { CONTROLLER_CATALOG } from "@/controllerCatalog";
import { DEFAULT_PARAMS } from "@/constants";
import { neutralKnobs } from "@/engine/knobs";
import { defaultControllerItemFor, readingButtonOptionsFor } from "@/knobMetadata";
import { controllerOptionsWithLabelKeys } from "@/i18nText";
import type { SimInstance } from "@/types";

beforeAll(async () => {
  await i18n.changeLanguage("en");
});

describe("Controls", () => {
  it("renders studio clinical knobs as sliders without preset chips by default", () => {
    const knobs = { ...neutralKnobs(DEFAULT_PARAMS), contractility: 1.4 };
    const instance: SimInstance = {
      id: "normal",
      name: "Normal",
      color: "#3b82f6",
      params: { ...DEFAULT_PARAMS },
      targetVolume: 5000,
      isVisible: true,
      knobs,
      knobBaseline: { ...DEFAULT_PARAMS },
    };

    const html = renderToStaticMarkup(React.createElement(Controls, {
      instances: [instance],
      activeInstanceId: instance.id,
      updateInstanceParams: vi.fn(),
      updateInstanceKnobs: vi.fn(),
      updateInstanceVolume: vi.fn(),
    }));

    expect(html).toContain('type="range"');
    expect(html).not.toContain(i18n.t("workbench.controls.options.low"));
    expect(html).not.toContain(i18n.t("workbench.controls.options.normal"));
    expect(html).not.toContain(i18n.t("workbench.controls.options.high"));
    expect(html).toContain("1 changed");
    expect(html).toContain(`aria-label="${i18n.t("workbench.controls.resetClinicalBaseline")}"`);
    expect(html).toContain(i18n.t("workbench.controls.groups.global"));
    expect(html).not.toContain(i18n.t("workbench.controls.raw.globalContractility"));
  });

  it("renders reading controls as clinical-only button groups", () => {
    const knobs = { ...neutralKnobs(DEFAULT_PARAMS), contractility: 1.4, aorticStenosis: 1 };
    const instance: SimInstance = {
      id: "normal",
      name: "Normal",
      color: "#3b82f6",
      params: { ...DEFAULT_PARAMS },
      targetVolume: 5000,
      isVisible: true,
      knobs,
      knobBaseline: { ...DEFAULT_PARAMS },
    };

    const html = renderToStaticMarkup(React.createElement(Controls, {
      instances: [instance],
      activeInstanceId: instance.id,
      updateInstanceParams: vi.fn(),
      updateInstanceKnobs: vi.fn(),
      updateInstanceVolume: vi.fn(),
      isPaneMode: true,
      paneConfig: {
        normal: {
          visible: true,
          selectedSignals: ["clinical", "global", "ventricles"],
        },
      },
      presentationMode: "reading",
    }));

    expect(html).toContain(i18n.t("workbench.controls.options.low"));
    expect(html).toContain(i18n.t("workbench.controls.options.normal"));
    expect(html).toContain(i18n.t("workbench.controls.options.high"));
    expect(html).toContain(i18n.t("workbench.controls.options.none"));
    expect(html).toContain(i18n.t("workbench.controls.options.moderate"));
    expect(html).toContain(i18n.t("workbench.controls.options.severe"));
    expect(html).toContain(i18n.t("workbench.controls.knobs.contractility"));
    expect(html).toContain(i18n.t("workbench.controls.knobs.HR"));
    expect(html).toContain(i18n.t("workbench.controls.knobs.aorticStenosis"));
    expect(html).not.toContain('type="range"');
    expect(html).not.toContain(i18n.t("workbench.controls.groups.global"));
    expect(html).not.toContain(i18n.t("workbench.controls.groups.ventricles"));
    expect(html).not.toContain(i18n.t("workbench.controls.knobs.relaxation"));
    expect(html).not.toContain(i18n.t("workbench.controls.knobs.diastolicStiffness"));
    expect(html).not.toContain(i18n.t("workbench.controls.knobs.venousTone"));
  });

  it("forces clinical controls in reading mode when pane signals exclude clinical", () => {
    const knobs = { ...neutralKnobs(DEFAULT_PARAMS), contractility: 1.4 };
    const instance: SimInstance = {
      id: "normal",
      name: "Normal",
      color: "#3b82f6",
      params: { ...DEFAULT_PARAMS },
      targetVolume: 5000,
      isVisible: true,
      knobs,
      knobBaseline: { ...DEFAULT_PARAMS },
    };

    const html = renderToStaticMarkup(React.createElement(Controls, {
      instances: [instance],
      activeInstanceId: instance.id,
      updateInstanceParams: vi.fn(),
      updateInstanceKnobs: vi.fn(),
      updateInstanceVolume: vi.fn(),
      isPaneMode: true,
      paneConfig: {
        normal: {
          visible: true,
          selectedSignals: ["Global", "ventricles"],
        },
      },
      presentationMode: "reading",
    }));

    expect(html).not.toContain(i18n.t("workbench.controls.groups.clinical"));
    expect(html).toContain(i18n.t("workbench.controls.knobs.contractility"));
    expect(html).toContain(i18n.t("workbench.controls.options.low"));
    expect(html).toContain(i18n.t("workbench.controls.options.normal"));
    expect(html).toContain(i18n.t("workbench.controls.options.high"));
    expect(html).not.toContain(i18n.t("workbench.controls.groups.global"));
    expect(html).not.toContain(i18n.t("workbench.controls.groups.ventricles"));
  });

  it("uses authored controls instead of the built-in clinical group in studio mode", () => {
    const knobs = { ...neutralKnobs(DEFAULT_PARAMS), contractility: 1.4, afterload: 1.6 };
    const instance: SimInstance = {
      id: "normal",
      name: "Normal",
      color: "#3b82f6",
      params: { ...DEFAULT_PARAMS },
      targetVolume: 5000,
      isVisible: true,
      knobs,
      knobBaseline: { ...DEFAULT_PARAMS },
    };

    const html = renderToStaticMarkup(React.createElement(Controls, {
      instances: [instance],
      activeInstanceId: instance.id,
      updateInstanceParams: vi.fn(),
      updateInstanceKnobs: vi.fn(),
      updateInstanceVolume: vi.fn(),
      controllerItems: [{ paramKey: "contractility", kind: "slider", label: "LV Focus" }],
    }));

    expect(html).toContain("LV Focus");
    expect(html).not.toContain(i18n.t("workbench.controls.knobs.contractilityRV"));
    expect(html).not.toContain(i18n.t("workbench.controls.knobs.afterload"));
    expect(html).not.toContain(i18n.t("workbench.controls.groups.clinical"));
    expect(html).not.toContain(i18n.t("workbench.controls.customReplaceDefault"));
    expect(html).not.toContain(i18n.t("workbench.controls.customControls"));
  });

  it("renders category labels for long authored controller views only", () => {
    const instance: SimInstance = {
      id: "normal",
      name: "Normal",
      color: "#3b82f6",
      params: { ...DEFAULT_PARAMS },
      targetVolume: 5000,
      isVisible: true,
      knobs: neutralKnobs(DEFAULT_PARAMS),
      knobBaseline: { ...DEFAULT_PARAMS },
    };
    const renderAuthored = (controllerItems: React.ComponentProps<typeof Controls>["controllerItems"]) => renderToStaticMarkup(React.createElement(Controls, {
      instances: [instance],
      activeInstanceId: instance.id,
      updateInstanceParams: vi.fn(),
      updateInstanceKnobs: vi.fn(),
      updateInstanceVolume: vi.fn(),
      controllerItems,
    }));

    const smallHtml = renderAuthored([
      { paramKey: "contractility", kind: "slider" },
      { paramKey: "HR", kind: "slider" },
      { paramKey: "aorticStenosis", kind: "slider" },
    ]);
    expect(smallHtml).not.toContain(i18n.t("workbench.controls.categories.cardiacFunction"));
    expect(smallHtml).not.toContain(i18n.t("workbench.controls.categories.loadRate"));
    expect(smallHtml).not.toContain(i18n.t("workbench.controls.categories.valveLesions"));

    const standardHtml = renderAuthored(CONTROLLER_CATALOG.map((entry) => ({ paramKey: entry.key, kind: "slider" as const })));
    expect(standardHtml).toContain(i18n.t("workbench.controls.categories.cardiacFunction"));
    expect(standardHtml).toContain(i18n.t("workbench.controls.categories.loadRate").replace("&", "&amp;"));
    expect(standardHtml).toContain(i18n.t("workbench.controls.categories.valveLesions"));
  });

  it("localizes default authored controller labels and options at display time", async () => {
    const instance: SimInstance = {
      id: "normal",
      name: "Normal",
      color: "#3b82f6",
      params: { ...DEFAULT_PARAMS },
      targetVolume: 5000,
      isVisible: true,
      knobs: neutralKnobs(DEFAULT_PARAMS),
      knobBaseline: { ...DEFAULT_PARAMS },
    };
    const baseItem = defaultControllerItemFor("contractility");
    const controllerItems = [{
      ...baseItem,
      labelKey: "contractility",
      kind: "buttonGroup" as const,
      options: controllerOptionsWithLabelKeys(baseItem, readingButtonOptionsFor("contractility", 1) ?? [], 1),
    }];

    expect(controllerItems[0].label).toBe("LV contractility");
    expect(controllerItems[0].options?.map((option) => option.label)).toEqual(["Low", "Normal", "High"]);

    await i18n.changeLanguage("ja");
    const jaHtml = renderToStaticMarkup(React.createElement(Controls, {
      instances: [instance],
      activeInstanceId: instance.id,
      updateInstanceParams: vi.fn(),
      updateInstanceKnobs: vi.fn(),
      updateInstanceVolume: vi.fn(),
      presentationMode: "reading",
      controllerItems,
    }));

    expect(jaHtml).toContain("LV収縮性");
    expect(jaHtml).toContain("低");
    expect(jaHtml).not.toContain("LV contractility");

    await i18n.changeLanguage("en");
    const enHtml = renderToStaticMarkup(React.createElement(Controls, {
      instances: [instance],
      activeInstanceId: instance.id,
      updateInstanceParams: vi.fn(),
      updateInstanceKnobs: vi.fn(),
      updateInstanceVolume: vi.fn(),
      presentationMode: "reading",
      controllerItems,
    }));

    expect(enHtml).toContain("LV contractility");
    expect(enHtml).toContain("Low");
    expect(enHtml).not.toContain("LV収縮性");
  });

  it("renders authored reading controls as buttons without falling back to auto clinical", () => {
    const instance: SimInstance = {
      id: "normal",
      name: "Normal",
      color: "#3b82f6",
      params: { ...DEFAULT_PARAMS },
      targetVolume: 5000,
      isVisible: true,
      knobs: neutralKnobs(DEFAULT_PARAMS),
      knobBaseline: { ...DEFAULT_PARAMS },
    };

    const html = renderToStaticMarkup(React.createElement(Controls, {
      instances: [instance],
      activeInstanceId: instance.id,
      updateInstanceParams: vi.fn(),
      updateInstanceKnobs: vi.fn(),
      updateInstanceVolume: vi.fn(),
      isPaneMode: true,
      paneConfig: {
        normal: {
          visible: true,
          selectedSignals: ["clinical"],
        },
      },
      presentationMode: "reading",
      controllerItems: [
        {
          paramKey: "HR",
          kind: "buttonGroup",
          label: "Rate",
          options: [{ label: "Slow", value: 60 }, { label: "Fast", value: 120 }],
        },
        { paramKey: "relaxation", kind: "slider", label: "Relaxation focus", min: 0.25, max: 2.5, step: 0.05 },
      ],
    }));

    expect(html).toContain("Slow");
    expect(html).toContain("Fast");
    expect(html).toContain("Relaxation focus");
    expect(html).toContain(i18n.t("workbench.controls.options.low"));
    expect(html).toContain(i18n.t("workbench.controls.options.normal"));
    expect(html).toContain(i18n.t("workbench.controls.options.high"));
    expect(html).not.toContain('type="range"');
    expect(html).not.toContain(i18n.t("workbench.controls.knobs.contractility"));
    expect(html).not.toContain(i18n.t("workbench.controls.knobs.aorticStenosis"));
  });

  it("derives authored reading buttons from the item's own continuous range when no teaching-safe band exists", () => {
    const instance: SimInstance = {
      id: "normal",
      name: "Normal",
      color: "#3b82f6",
      params: { ...DEFAULT_PARAMS },
      targetVolume: 5000,
      isVisible: true,
      knobs: neutralKnobs(DEFAULT_PARAMS),
      knobBaseline: { ...DEFAULT_PARAMS },
    };

    const html = renderToStaticMarkup(React.createElement(Controls, {
      instances: [instance],
      activeInstanceId: instance.id,
      updateInstanceParams: vi.fn(),
      updateInstanceKnobs: vi.fn(),
      updateInstanceVolume: vi.fn(),
      presentationMode: "reading",
      controllerItems: [
        { paramKey: "relaxation", kind: "slider", label: "Relaxation range", min: 0.4, max: 1.6, step: 0.2 },
      ],
    }));

    expect(html).toContain("Relaxation range");
    expect(html).toContain(i18n.t("workbench.controls.options.low"));
    expect(html).toContain(i18n.t("workbench.controls.options.normal"));
    expect(html).toContain(i18n.t("workbench.controls.options.high"));
    expect(html).toContain('title="0.4 x"');
    expect(html).toContain('title="1 x"');
    expect(html).toContain('title="1.6 x"');
    expect(html).not.toContain('type="range"');
  });

  it("counts and resets only authored clinical knobs when authored items are present", () => {
    const baseline = neutralKnobs(DEFAULT_PARAMS);
    const knobs = { ...baseline, contractility: 1.4, afterload: 1.6 };
    const authoredControls = [{ key: "contractility" as const, label: "LV Focus", step: 0.05, unit: "x" }];
    const changed = getChangedClinicalControls(knobs, baseline, authoredControls);
    const reset = resetClinicalKnobsToBaseline(knobs, baseline, changed);
    const instance: SimInstance = {
      id: "normal",
      name: "Normal",
      color: "#3b82f6",
      params: { ...DEFAULT_PARAMS },
      targetVolume: 5000,
      isVisible: true,
      knobs,
      knobBaseline: { ...DEFAULT_PARAMS },
    };

    const html = renderToStaticMarkup(React.createElement(Controls, {
      instances: [instance],
      activeInstanceId: instance.id,
      updateInstanceParams: vi.fn(),
      updateInstanceKnobs: vi.fn(),
      updateInstanceVolume: vi.fn(),
      controllerItems: [{ paramKey: "contractility", kind: "slider", label: "LV Focus" }],
    }));

    expect(changed).toEqual(authoredControls);
    expect(reset.contractility).toBe(baseline.contractility);
    expect(reset.afterload).toBe(knobs.afterload);
    expect(html).toContain("LV Focus");
    expect(html).not.toContain(i18n.t("workbench.controls.groups.clinical"));
    expect(html).not.toContain(i18n.t("workbench.controls.groups.global"));
  });
});
