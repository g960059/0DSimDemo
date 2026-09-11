/** Case selection intervals, including strict clinical boundaries and one-sided
 * criteria. A finite normalization scale is a search convention, not a bound. */
export type MainWireCaseIntervalV1 = Readonly<{
  metricId: string; lower: number | null; upper: number | null;
  lowerInclusive?: boolean; upperInclusive?: boolean; normalizationScale?: number;
  sourceIds: readonly string[]; rationale: string; method?: string; unit?: string;
}>;

export function assessMainWireCaseIntervalsV1<R extends {
  referenceId: string; restScreen: readonly MainWireCaseIntervalV1[];
  fittingTargets: readonly (MainWireCaseIntervalV1 & { priority: number })[];
}>(reference: R, values: Readonly<Record<string, number | null>>) {
  const row = <T extends MainWireCaseIntervalV1>(rule: T) => {
    const actual = values[rule.metricId] ?? null;
    const available = actual !== null && Number.isFinite(actual);
    const scale = rule.normalizationScale ?? (rule.lower !== null && rule.upper !== null ? rule.upper - rule.lower : NaN);
    if (!(scale > 0 && Number.isFinite(scale))) throw new Error("Case interval needs a finite positive normalization scale");
    const passed = available && (rule.lower === null || (rule.lowerInclusive === false ? actual > rule.lower : actual >= rule.lower))
      && (rule.upper === null || (rule.upperInclusive === false ? actual < rule.upper : actual <= rule.upper));
    const distance = available ? Math.max((rule.lower ?? -Infinity) - actual, actual - (rule.upper ?? Infinity), 0) / scale : null;
    // Exact equality at an excluded endpoint is a failure. Keep it rankable,
    // above the search comparator's roundoff floor, without moving the bound.
    const normalizedError = !available ? null : passed ? 0 : Math.max(distance!, 1e-8);
    return { ...rule, actual, status: !available ? "unresolved" as const : passed ? "passed" as const : "failed" as const,
      normalizedError, normalizationScale: scale };
  };
  const screen = reference.restScreen.map(row), targets = reference.fittingTargets.map(row);
  const screenUnresolved = screen.some(r => r.status === "unresolved"), targetsUnresolved = targets.some(r => r.status === "unresolved");
  const primary = targets.filter(t => t.priority === 0), secondary = targets.filter(t => t.priority === 1);
  const screenPassed = screen.every(r => r.status === "passed"), preferredTargetsMet = targets.every(r => r.status === "passed");
  const worst = (rows: readonly { normalizedError: number | null }[]) => Math.max(0, ...rows.map(r => r.normalizedError ?? 0));
  return { referenceId: reference.referenceId,
    status: screenUnresolved ? "unresolved" as const : screenPassed ? "passed" as const : "failed" as const,
    preferenceStatus: targetsUnresolved ? "unresolved" as const : preferredTargetsMet ? "met" as const : "not-met" as const,
    screenPassed, preferredTargetsMet, screen, targets,
    ranking: screenUnresolved || primary.some(t => t.status === "unresolved") ? null
      : [screenPassed ? 0 : 1, worst(screen), worst(primary), secondary.some(t => t.status === "unresolved") ? null : worst(secondary)],
    finalQualification: "not-performed" as const, publicPromotionAuthorized: false as const };
}
