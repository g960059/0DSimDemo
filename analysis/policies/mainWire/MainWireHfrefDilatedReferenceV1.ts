import raw from "@/data/physiology/main-wire-hfref-dilated-reference-v1.json";
import { cloneAndFreezeCanonicalJson } from "@/engine/integrity";
import { MAIN_WIRE_HFREF_REFERENCE_V1 as mechanismReference,
  MAIN_WIRE_HFREF_REST_POLICY_V1 as mechanismPolicy,
  validateMainWireHfrefReferenceV1, assessMainWireHfrefIntervalsV1 } from "./MainWireHfrefReferenceV1";
import { assertMainWireRelaxationTauMeasuredV1,
  type MainWireRelaxationTauV1 } from "@/analysis/methods/mainWire/MainWireRelaxationTauV1";

/** Reuse source records, not the older case's phenotype or EF-first ranking. */
export function composeMainWireHfrefDilatedReferenceV1(value: typeof raw) {
  const { reuseSourceIds, ...definition } = value;
  if (new Set(reuseSourceIds).size !== reuseSourceIds.length) throw new Error("Duplicate shared HFrEF source");
  const sources = [...reuseSourceIds.map(id => {
    const source = mechanismReference.sources.find(s => s.sourceId === id);
    if (!source) throw new Error("Unregistered shared HFrEF source");
    return source;
  }), ...definition.sources];
  const reference = { ...definition, sources };
  validateMainWireHfrefReferenceV1(reference, { allowStandalonePreferredTargets: true });
  const metrics = new Set([...reference.restScreen, ...reference.fittingTargets].map(r => r.metricId));
  for (const c of reference.context) for (const id of c.metricIds) metrics.add(id);
  const featureIds = new Set<string>();
  for (const f of reference.features) {
    if (featureIds.has(f.featureId) || !f.featureId.trim() || !f.label.trim()
      || !f.expectedFinding.trim() || !f.limitation.trim()
      || !["required", "preferred", "observe"].includes(f.role)
      || !f.metricIds.length || f.metricIds.some(id => !metrics.has(id))
      || !f.sourceIds.length || f.sourceIds.some(id => !sources.some(s => s.sourceId === id))
      || (f.role === "required" && !f.metricIds.some(id => reference.restScreen.some(r => r.metricId === id)))
      || (f.role === "preferred" && !f.metricIds.some(id => reference.fittingTargets.some(r => r.metricId === id)))) {
      throw new Error("Invalid HFrEF explanatory feature or provenance");
    }
    featureIds.add(f.featureId);
  }
  return cloneAndFreezeCanonicalJson(reference) as typeof reference;
}

export const MAIN_WIRE_HFREF_DILATED_REFERENCE_V1 = composeMainWireHfrefDilatedReferenceV1(raw);
export const MAIN_WIRE_HFREF_DILATED_REST_POLICY_V1 = Object.freeze({
  ...mechanismPolicy,
  policyId: "main-wire-hfref-chronic-dilated-rest-v1",
  ranking: "screen first; max normalized joint EF/EDVI/CI/Ao target error; then max qualified-Weiss/LA target error; stable input order",
  finalReview: "cold/fine, raw PV/flow/pressure, phase-resolved filling, pressure-matched passive mechanics, and explicit geometry/pericardium/coronary construction compatibility; no automatic adoption",
});

export type MainWireHfrefCaseObservationV1 = Readonly<{
  values: Readonly<Record<string, number | null>>; tau: MainWireRelaxationTauV1 | null;
}>;

function qualifiedValues(observation: MainWireHfrefCaseObservationV1) {
  let issue: string | null = null;
  try {
    assertMainWireRelaxationTauMeasuredV1(observation.tau ?? undefined);
    if (observation.values.weissTauMs !== observation.tau!.weiss!.tauMs) throw new Error("Weiss value does not match its fit");
  } catch (error) { issue = error instanceof Error ? error.message : String(error); }
  return { values: { ...observation.values,
    weissTauMs: issue ? null : observation.values.weissTauMs!,
    glantzTauMs: !issue && observation.tau?.sensitivityStatus === "measured"
      && observation.values.glantzTauMs === observation.tau.glantz?.tauMs ? observation.values.glantzTauMs! : null }, issue };
}

/** Qualify the measurement, not just the number. Feature text is an intention;
 * measured values and unmeasured facts are emitted separately for article use. */
export function assessMainWireHfrefDilatedRestV1(observation: MainWireHfrefCaseObservationV1,
  baseline?: MainWireHfrefCaseObservationV1) {
  const current = qualifiedValues(observation), comparison = baseline ? qualifiedValues(baseline) : null;
  const assessment = assessMainWireHfrefIntervalsV1(MAIN_WIRE_HFREF_DILATED_REFERENCE_V1, current.values);
  const finite = (value: number | null | undefined) => typeof value === "number" && Number.isFinite(value) ? value : null;
  const features = MAIN_WIRE_HFREF_DILATED_REFERENCE_V1.features.map(f => ({
    ...f, descriptionRole: "intended-not-an-achievement-claim" as const,
    criteria: [...assessment.screen, ...assessment.targets].filter(r => f.metricIds.includes(r.metricId)),
    observations: f.metricIds.map(metricId => {
      const actual = finite(current.values[metricId]), baselineActual = finite(comparison?.values[metricId]);
      return { metricId, actual, baselineActual,
        differenceFromBaseline: actual !== null && baselineActual !== null ? actual - baselineActual : null,
        status: actual === null ? "unresolved-or-unmeasured" as const : "observed" as const };
    }),
  }));
  return { ...assessment, features, measurementIssues: { weiss: current.issue, baselineWeiss: comparison?.issue ?? null },
    baselineComparison: baseline ? "descriptive-not-a-matched-load-or-causal-test" as const : "not-provided" as const,
    biologicalIdentifiabilityClaimed: false as const };
}
