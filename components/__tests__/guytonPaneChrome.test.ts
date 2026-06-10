import { describe, expect, it } from "vitest";
import {
  guytonPaneChromeState,
  guytonStarlingCalibrationDetail,
  guytonStarlingCalibrationLabel,
} from "@/components/guytonPaneChrome";
import type { StarlingSweepCurve } from "@/engine/guytonStarling";

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
    const curve: StarlingSweepCurve = {
      side: "left",
      points: [],
      warnings: [],
      calibration: {
        mode: "calibrated",
        plannedDeltasMl: [-900, -300, 0, 300, 900],
        anchorDeltasMl: [-900, 0, 300, 900],
        fallbackReasons: [],
      },
      interpretation: {
        xAxis: "LAP",
        yAxis: "CO",
        sweepVariable: "TBV delta",
        fitBasis: "calibrated anchors",
        anchorDeltasMl: [-900, 0, 300, 900],
        measuredRangeMmHg: { min: 1.2, max: 8.4 },
        extrapolation: "final-only dashed",
        zeroFlowConstrained: false,
        zeroFlowConstraintReason: "Starling x-axis is cycle-mean RAP/LAP from a TBV sweep, not the ESPVR volume-axis V0.",
      },
    };

    expect(guytonStarlingCalibrationLabel(curve)).toBe("calibrated 4 anchors");
    const detail = guytonStarlingCalibrationDetail(curve, labels());
    expect(detail?.label).toBe("calibrated 4 anchors");
    expect(detail?.rows).toEqual([
      { label: "Axis", value: "x=LAP, y=CO" },
      { label: "Sweep", value: "TBV delta" },
      { label: "Anchors", value: "-900 mL, 0 mL, +300 mL, +900 mL" },
      { label: "Measured range", value: "1.2-8.4 mmHg" },
      { label: "Low-flow end", value: "Zero-flow/V0 is not constrained." },
    ]);

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

  it("summarizes period-2 averaged points only in the detail popover", () => {
    const curve: StarlingSweepCurve = {
      side: "left",
      points: [
        { x: 1.2, y: 3.8, periodBeats: 2, periodLabel: "period-2" },
        { x: 2.0, y: 4.3, periodBeats: 2, periodLabel: "period-2" },
        { x: 6.8, y: 5.4, periodBeats: 1, periodLabel: "period-1" },
      ],
      warnings: [],
      calibration: {
        mode: "adaptive",
        plannedDeltasMl: [-1000, -500, 0],
        anchorDeltasMl: [-1000, -500, 0],
        fallbackReasons: [],
      },
      interpretation: {
        xAxis: "LAP",
        yAxis: "CO",
        sweepVariable: "TBV delta",
        fitBasis: "adaptive exploration",
        anchorDeltasMl: [-1000, -500, 0],
        measuredRangeMmHg: { min: 1.2, max: 6.8 },
        extrapolation: "none",
        zeroFlowConstrained: false,
        zeroFlowConstraintReason: "Starling x-axis is cycle-mean RAP/LAP from a TBV sweep, not the ESPVR volume-axis V0.",
      },
    };

    expect(guytonStarlingCalibrationDetail(curve, labels())?.rows).toContainEqual({
      label: "Period",
      value: "2 period-2 averaged points",
    });
  });
});

function labels() {
  return {
    axis: "Axis",
    sweep: "Sweep",
    anchors: "Anchors",
    audit: "Audit",
    holdoutError: "Holdout error",
    measuredRange: "Measured range",
    period: "Period",
    zeroFlow: "Low-flow end",
    notAvailable: "n/a",
    zeroFlowNotConstrained: "Zero-flow/V0 is not constrained.",
  };
}
