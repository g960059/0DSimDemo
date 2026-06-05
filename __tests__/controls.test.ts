import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { Controls, getChangedClinicalControls, resetClinicalKnobsToBaseline } from "@/components/Controls";
import { DEFAULT_PARAMS } from "@/constants";
import { neutralKnobs } from "@/engine/knobs";
import type { SimInstance } from "@/types";

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
    expect(html).not.toContain("Low");
    expect(html).not.toContain("Normal");
    expect(html).not.toContain("High");
    expect(html).toContain("1 changed");
    expect(html).toContain("Reset clinical knobs to baseline");
    expect(html).toContain("Global Physiology");
    expect(html).not.toContain("Global Contractility");
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

    expect(html).toContain("Low");
    expect(html).toContain("Normal");
    expect(html).toContain("High");
    expect(html).toContain("None");
    expect(html).toContain("Moderate");
    expect(html).toContain("Severe");
    expect(html).toContain("LV Contractility");
    expect(html).toContain("Heart Rate");
    expect(html).toContain("Aortic Stenosis");
    expect(html).not.toContain('type="range"');
    expect(html).not.toContain("Global Physiology");
    expect(html).not.toContain("Ventricular Mechanics");
    expect(html).not.toContain("Relaxation");
    expect(html).not.toContain("Diastolic Stiffness");
    expect(html).not.toContain("Venous Tone");
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

    expect(html).toContain("Clinical Knobs");
    expect(html).toContain("LV Contractility");
    expect(html).toContain("Low");
    expect(html).toContain("Normal");
    expect(html).toContain("High");
    expect(html).not.toContain("Global Physiology");
    expect(html).not.toContain("Ventricular Mechanics");
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
    expect(html).not.toContain("RV Contractility");
    expect(html).not.toContain("Afterload (SVR)");
    expect(html).toContain("1 changed");
    expect(html).toContain("Reset clinical knobs to baseline");
    expect(html).toContain("Custom controls replace the default Clinical Knobs");
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
    expect(html).toContain("Low");
    expect(html).toContain("Normal");
    expect(html).toContain("High");
    expect(html).not.toContain('type="range"');
    expect(html).not.toContain("LV Contractility");
    expect(html).not.toContain("Aortic Stenosis");
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
    expect(html).toContain("Low");
    expect(html).toContain("Normal");
    expect(html).toContain("High");
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
    expect(html).toContain("1 changed");
    expect(html).not.toContain("2 changed");
  });
});
