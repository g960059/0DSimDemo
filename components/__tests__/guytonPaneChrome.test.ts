import { describe, expect, it } from "vitest";
import { guytonPaneChromeState } from "@/components/guytonPaneChrome";

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
});
