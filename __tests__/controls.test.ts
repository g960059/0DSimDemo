import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { Controls } from "@/components/Controls";
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
});
