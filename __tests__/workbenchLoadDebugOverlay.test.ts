import { describe, expect, it } from "vitest";
import { DEFAULT_PARAMS } from "@/constants";
import type { PanelDef, SimInstance } from "@/types";
import { remapWorkbenchLoadIds } from "@/workbenchLoad";

describe("workbench load PV debug overlay config", () => {
  it("preserves panel and graph-view debug presentation while remapping instance ids", () => {
    const instances: SimInstance[] = [{
      id: "normal",
      name: "Normal",
      color: "#38bdf8",
      params: { ...DEFAULT_PARAMS },
      targetVolume: 5600,
      isVisible: true,
    }];
    const panels: PanelDef[] = [{
      id: "pv",
      type: "PVLOOP",
      title: "PV Loop",
      w: 6,
      h: 8,
      config: { normal: { visible: true, selectedSignals: ["LV"] } },
      isSettingsOpen: false,
      pvDebugOverlay: true,
      pvDebugTraceMode: "resampled",
      view: {
        kind: "graph",
        graphType: "pvloop",
        chambers: ["LV"],
        instances: { normal: { visible: true } },
        pvDebugOverlay: true,
        pvDebugTraceMode: "both",
      },
    }];

    const remapped = remapWorkbenchLoadIds(instances, panels, "dbg");
    const panel = remapped.panels[0];

    expect(panel.pvDebugOverlay).toBe(true);
    expect(panel.pvDebugTraceMode).toBe("resampled");
    expect(panel.config).toHaveProperty("cdbg_1");
    expect(panel.view).toMatchObject({
      kind: "graph",
      pvDebugOverlay: true,
      pvDebugTraceMode: "both",
      instances: { cdbg_1: { visible: true } },
    });
  });
});
