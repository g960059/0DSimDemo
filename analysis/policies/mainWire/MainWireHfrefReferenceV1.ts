import raw from "@/data/physiology/main-wire-hfref-reference-v1.json";
import { cloneAndFreezeCanonicalJson } from "@/engine/integrity";

type Interval = Readonly<{ metricId: string; lower: number; upper: number;
  sourceIds: readonly string[]; rationale: string; method?: string; unit?: string }>;
export type MainWireHfrefReferenceDefinitionV1 = Readonly<{
  referenceId: string; clinicalValidationClaimed: boolean;
  scope: Readonly<{ heartRateBpm: number; bodySurfaceAreaM2: number }>;
  sources: readonly Readonly<{ sourceId: string; title: string; locator: string;
    population: string; limitations: string; url: string }>[];
  restScreen: readonly Interval[];
  fittingTargets: readonly (Interval & Readonly<{ priority: number }>)[];
  context: readonly Readonly<{ sourceIds: readonly string[] }>[];
}>;

export function validateMainWireHfrefReferenceV1(value: MainWireHfrefReferenceDefinitionV1,
  options: Readonly<{ allowStandalonePreferredTargets?: boolean }> = {}): void {
  if (value.clinicalValidationClaimed !== false || value.scope.heartRateBpm !== 70
    || value.scope.bodySurfaceAreaM2 !== 1.9) throw new Error("Unsupported HFrEF reference scope");
  const sources = new Set(value.sources.map(s => s.sourceId));
  if (sources.size !== value.sources.length || value.sources.some(s => !s.title.trim() || !s.locator.trim()
    || !s.population.trim() || !s.limitations.trim() || !/^https:\/\//.test(s.url))) throw new Error("Invalid HFrEF provenance");
  for (const group of [value.restScreen, value.fittingTargets]) {
    const ids = new Set<string>();
    for (const rule of group) {
      if (ids.has(rule.metricId) || ![rule.lower, rule.upper].every(Number.isFinite) || rule.lower >= rule.upper
        || !rule.rationale.trim()) throw new Error("Invalid HFrEF interval");
      ids.add(rule.metricId);
    }
  }
  for (const rule of [...value.restScreen, ...value.fittingTargets, ...value.context]) {
    if (!rule.sourceIds.length || rule.sourceIds.some(id => !sources.has(id))) throw new Error("HFrEF criterion needs registered provenance");
  }
  for (const target of value.fittingTargets) {
    const screen = value.restScreen.find(s => s.metricId === target.metricId);
    if (!screen) {
      if (!options.allowStandalonePreferredTargets || target.priority !== 1
        || !target.method?.trim() || !target.unit?.trim()) throw new Error("HFrEF target must lie inside its screen or declare a standalone preferred method/unit");
    } else if (target.lower < screen.lower || target.upper > screen.upper) throw new Error("HFrEF target must lie inside its screen");
    if (![0, 1].includes(target.priority)) throw new Error("Invalid HFrEF target priority");
  }
}
validateMainWireHfrefReferenceV1(raw);
export const MAIN_WIRE_HFREF_REFERENCE_V1 = cloneAndFreezeCanonicalJson(raw) as typeof raw;

export const MAIN_WIRE_HFREF_REST_POLICY_V1 = Object.freeze({
  policyId: "main-wire-hfref-rest-screen-v1",
  numericalAdmission: "current exact evaluator: owned inputs, all-off/clock/conservation each step, fresh complete beat, three consecutive period-1 closures; no healthy physiological verdict",
  ranking: "screen pass first; then worst normalized screen violation; then EF target error; then worst normalized EDVI/CI target error; input order breaks ties",
  dependency: "At HR70 without regurgitation, CI ≈ 0.07*EF*EDVI (EF as fraction); residuals are deterministic construction preferences, not independent likelihoods.",
  finalReview: "cold start, half-step agreement, saved raw PV/flow and pressure review, and matched-load LV active-tension restoration control before any preset adoption",
  referenceOutputsAreTargets: false,
  publicPromotionAuthorized: false,
});

/** Missing observations fail closed. Context is never converted into a normal
 * baseline verdict; broad screening and preferred targets remain separate. */
export function assessMainWireHfrefRestV1(values: Readonly<Record<string, number | null>>) {
  return assessMainWireHfrefIntervalsV1(MAIN_WIRE_HFREF_REFERENCE_V1, values);
}

/** Same interval arithmetic for both case references. A missing soft observation
 * leaves that ranking component unknown, not zero or a failed circulation. */
export function assessMainWireHfrefIntervalsV1(reference: Pick<MainWireHfrefReferenceDefinitionV1,
  "referenceId" | "restScreen" | "fittingTargets">, values: Readonly<Record<string, number | null>>) {
  const row = <T extends { metricId: string; lower: number; upper: number }>(rule: T) => {
    const actual = values[rule.metricId] ?? null;
    const available = actual !== null && Number.isFinite(actual);
    const normalizedError = available ? Math.max(rule.lower - actual, actual - rule.upper, 0) / (rule.upper - rule.lower) : null;
    return { ...rule, actual, status: !available ? "unresolved" as const
      : normalizedError === 0 ? "passed" as const : "failed" as const, normalizedError };
  };
  const screen = reference.restScreen.map(row);
  const targets = reference.fittingTargets.map(row);
  const screenUnresolved = screen.some(r => r.status === "unresolved");
  const targetsUnresolved = targets.some(r => r.status === "unresolved");
  const primaryTargets = targets.filter(t => t.priority === 0);
  const secondaryTargets = targets.filter(t => t.priority === 1);
  const screenPassed = !screenUnresolved && screen.every(r => r.status === "passed");
  const preferredTargetsMet = !targetsUnresolved && targets.every(r => r.status === "passed");
  const worst = (rows: typeof targets | typeof screen) => Math.max(0, ...rows.map(r => r.normalizedError ?? 0));
  return {
    referenceId: reference.referenceId,
    status: screenUnresolved ? "unresolved" as const : screenPassed ? "passed" as const : "failed" as const,
    preferenceStatus: targetsUnresolved ? "unresolved" as const : preferredTargetsMet ? "met" as const : "not-met" as const,
    screenPassed, preferredTargetsMet, screen, targets,
    ranking: screenUnresolved || primaryTargets.some(t => t.status === "unresolved") ? null
      : [screenPassed ? 0 : 1, worst(screen), worst(primaryTargets),
        secondaryTargets.some(t => t.status === "unresolved") ? null : worst(secondaryTargets)],
    finalQualification: "not-performed" as const, publicPromotionAuthorized: false as const,
  };
}
