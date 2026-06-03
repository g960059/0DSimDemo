import { describe, expect, it } from "vitest";
import { toLegacyPanelConfig, toTypedPanelView } from "@/panelView";
import type { PanelDef } from "@/types";

describe("panel view compatibility adapter", () => {
  it("derives typed waveform view from legacy panel config", () => {
    const panel: PanelDef = {
      id: "wave",
      type: "WAVEFORM",
      title: "Waveforms",
      w: 6,
      h: 8,
      timeWindow: 5000,
      isSettingsOpen: false,
      config: {
        normal: {
          visible: true,
          selectedSignals: ["LVP", "AoP"],
          customName: "Normal",
          customSignalColors: { AoP: "#38bdf8" },
        },
      },
    };

    const view = toTypedPanelView(panel);

    expect(view.kind).toBe("graph");
    if (view.kind !== "graph") throw new Error("expected graph view");
    expect(view.graphType).toBe("waveform");
    expect(view.signals).toEqual(["LVP", "AoP"]);
    expect(view.timeWindow).toBe(5000);
    expect(view.instances?.normal?.label).toBe("Normal");
    expect(view.instances?.normal?.items?.AoP?.color).toBe("#38bdf8");
  });

  it("can emit legacy config from a typed output view", () => {
    const config = toLegacyPanelConfig(["normal", "ami"], {
      kind: "output",
      metrics: ["ABP", "CO"],
      instances: {
        ami: { visible: false, label: "AMI", color: "#ef4444" },
      },
    });

    expect(config.normal.selectedSignals).toEqual(["ABP", "CO"]);
    expect(config.normal.visible).toBe(true);
    expect(config.ami.visible).toBe(false);
    expect(config.ami.customName).toBe("AMI");
    expect(config.ami.customBaseColor).toBe("#ef4444");
  });

  it("derives scenario view instead of falling through to note view", () => {
    const panel: PanelDef = {
      id: "scenarios",
      type: "SCENARIOS",
      title: "Scenarios",
      w: 4,
      h: 4,
      isSettingsOpen: false,
      config: {
        normal: {
          visible: true,
          selectedSignals: [],
          customName: "Normal",
        },
      },
    };

    const view = toTypedPanelView(panel);

    expect(view.kind).toBe("scenario");
    if (view.kind !== "scenario") throw new Error("expected scenario view");
    expect(view.mode).toBe("list");
    expect(view.instances?.normal?.label).toBe("Normal");
  });
});
