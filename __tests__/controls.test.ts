import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { Controls } from "@/components/Controls";
import { DEFAULT_PARAMS } from "@/constants";
import { neutralKnobs } from "@/engine/knobs";
import type { SimInstance } from "@/types";

describe("Controls", () => {
  it("renders clinical preset chips while retaining sliders and reset markup", () => {
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

    expect(html).toContain("Low");
    expect(html).toContain("Normal");
    expect(html).toContain("High");
    expect(html).toContain('type="range"');
    expect(html).toContain("1 changed");
    expect(html).toContain("Reset clinical knobs to baseline");
    expect(html).toContain("Global Physiology");
    expect(html).not.toContain("Global Contractility");
  });
});
