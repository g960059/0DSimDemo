import { describe, expect, it } from "vitest";
import { guytonPaneChromeState, guytonStarlingCalibrationLabel } from "@/components/guytonPaneChrome";

describe("Guyton pane chrome helpers", () => {
  it("dedupes warnings for the warning popover", () => {
    const state = guytonPaneChromeState({
      pending: false,
      workerBusy: false,
      warnings: ["+300 mL: sweep point did not fully settle", "+300 mL: sweep point did not fully settle"],
      notes: ["+600 mL: sweep point did not fully settle", "+600 mL: sweep point did not fully settle"],
      workerError: "Worker failed",
    });

    expect(state.hasWarnings).toBe(true);
    expect(state.warnings).toEqual([
      "+300 mL: sweep point did not fully settle",
      "Worker failed",
    ]);
    expect(state.notes).toEqual(["+600 mL: sweep point did not fully settle"]);
  });

  it("uses a spinner state instead of textual progress labels", () => {
    expect(guytonPaneChromeState({
      pending: true,
      workerBusy: false,
      warnings: [],
    })).toEqual({
      showSpinner: true,
      warnings: [],
      notes: [],
      hasWarnings: false,
    });
    expect(guytonPaneChromeState({
      pending: false,
      workerBusy: true,
      warnings: [],
    }).showSpinner).toBe(true);
  });

  it("formats compact calibrated sweep labels", () => {
    expect(guytonStarlingCalibrationLabel({
      side: "left",
      points: [],
      warnings: [],
      calibration: {
        mode: "calibrated",
        plannedDeltasMl: [-900, -300, 0, 300, 900],
        anchorDeltasMl: [-900, 0, 300, 900],
        fallbackReasons: [],
      },
    })).toBe("calibrated 4 anchors");

    expect(guytonStarlingCalibrationLabel({
      side: "left",
      points: [],
      warnings: [],
      calibration: {
        mode: "full7-fallback",
        plannedDeltasMl: [-900, -600, -300, 0, 300, 600, 900],
        anchorDeltasMl: [-900, 0, 300, 900],
        fallbackReasons: ["left return residual threshold"],
      },
    })).toBe("full7 fallback");
  });
});
