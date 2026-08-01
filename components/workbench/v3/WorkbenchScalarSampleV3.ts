/**
 * Presentation-only scalar sample shared by the V3 Workbench charts.
 *
 * `cyclePhase01` must come from the registered model. Renderers deliberately
 * do not infer cardiac cycles from a hard-coded heart rate or wall clock.
 */
export type WorkbenchScalarSampleV3 = Readonly<{
  acceptedTimeSec: number;
  cyclePhase01: number | null;
  values: Readonly<Record<string, number | null>>;
}>;

export function finiteWorkbenchScalarValueV3(
  sample: WorkbenchScalarSampleV3,
  outputId: string,
): number | null {
  const value = sample.values[outputId];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}
