import type { StarlingSweepCurve } from "@/engine/guytonStarling";

export type GuytonPaneChromeStateInput = {
  pending: boolean;
  workerBusy: boolean;
  warnings: string[];
  notes?: string[];
  workerError?: string | null;
};

export type GuytonPaneChromeState = {
  showSpinner: boolean;
  warnings: string[];
  notes: string[];
  hasWarnings: boolean;
};

export function guytonPaneChromeState(input: GuytonPaneChromeStateInput): GuytonPaneChromeState {
  const warnings = uniqueStrings([
    ...input.warnings,
    ...(input.workerError ? [input.workerError] : []),
  ]);
  const notes = uniqueStrings(input.notes ?? []);
  return {
    showSpinner: input.pending || input.workerBusy,
    warnings,
    notes,
    hasWarnings: warnings.length > 0,
  };
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

export function guytonStarlingCalibrationLabel(curve?: StarlingSweepCurve): string | undefined {
  const calibration = curve?.calibration;
  if (!calibration) return undefined;
  if (calibration.mode === "calibrated") {
    const count = calibration.anchorDeltasMl.length || curve?.fit?.sourcePointCount || curve?.points.length || 0;
    return count > 0 ? `calibrated ${count} anchors` : "calibrated";
  }
  if (calibration.mode === "full7-fallback") return "full7 fallback";
  if (calibration.mode === "full7" || calibration.mode === "full7-reference") return "measured full7";
  if (calibration.mode === "custom") return "measured custom";
  return undefined;
}
