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

export type GuytonCalibrationDetailLabels = {
  axis: string;
  sweep: string;
  anchors: string;
  measuredRange: string;
  zeroFlow: string;
  notAvailable: string;
  zeroFlowNotConstrained: string;
};

export type GuytonCalibrationDetail = {
  label: string;
  rows: Array<{ label: string; value: string }>;
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

export function guytonStarlingCalibrationDetail(
  curve: StarlingSweepCurve | undefined,
  labels: GuytonCalibrationDetailLabels,
): GuytonCalibrationDetail | undefined {
  const label = guytonStarlingCalibrationLabel(curve);
  const interpretation = curve?.interpretation;
  if (!label || !interpretation) return undefined;
  const measuredRange = interpretation.measuredRangeMmHg
    ? `${formatMmHg(interpretation.measuredRangeMmHg.min)}-${formatMmHg(interpretation.measuredRangeMmHg.max)} mmHg`
    : labels.notAvailable;
  return {
    label,
    rows: [
      { label: labels.axis, value: `x=${interpretation.xAxis}, y=${interpretation.yAxis}` },
      { label: labels.sweep, value: interpretation.sweepVariable },
      { label: labels.anchors, value: interpretation.anchorDeltasMl.map(formatDeltaMl).join(", ") },
      { label: labels.measuredRange, value: measuredRange },
      { label: labels.zeroFlow, value: labels.zeroFlowNotConstrained },
    ],
  };
}

function formatDeltaMl(value: number): string {
  return `${value > 0 ? "+" : ""}${Math.round(value)} mL`;
}

function formatMmHg(value: number): string {
  return Math.abs(value) >= 10 ? value.toFixed(0) : value.toFixed(1);
}
