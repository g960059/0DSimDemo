import raw from "@/data/physiology/main-wire-as-high-gradient-reference-v1.json";
import lowFlow from "@/data/physiology/main-wire-as-low-flow-reduced-ef-reference-v1.json";
import { cloneAndFreezeCanonicalJson as own } from "@/engine/integrity";
import { assessMainWireCaseIntervalsV1 as intervals, type MainWireCaseIntervalV1 } from "./MainWireCaseIntervalsV1";
import { MAIN_WIRE_REFERENCE_BODY_SURFACE_AREA_M2_V1 as bsa } from "@/analysis/methods/mainWire/MainWireReferenceIndexingV1";

export type MainWireAsReferenceDefinitionV1 = Omit<typeof raw, "restScreen" | "fittingTargets"> & {
  restScreen: readonly MainWireCaseIntervalV1[];
  fittingTargets: readonly (MainWireCaseIntervalV1 & { priority: number })[];
};

/** AS owns its provenance and criteria. Only the disease-neutral interval
 * arithmetic is shared; no healthy/HFrEF threshold is inherited. */
export function validateMainWireAsReferenceV1(value: MainWireAsReferenceDefinitionV1) {
  const ids = new Set(value.sources.map(s => s.sourceId));
  if (value.clinicalValidationClaimed !== false || value.scope.heartRateBpm !== 70 || value.scope.bodySurfaceAreaM2 !== bsa
    || ids.size !== value.sources.length || value.sources.some(s => !s.title || !s.locator || !s.method || !s.population || !s.limitations || !s.url.startsWith("https://")))
    throw new Error("Invalid AS scope or provenance");
  for (const group of [value.restScreen, value.fittingTargets]) {
    if (new Set(group.map(r => r.metricId)).size !== group.length) throw new Error("Duplicate AS criterion");
    for (const r of group) if (r.lower === null && r.upper === null
      || [r.lower, r.upper].some(v => v !== null && !Number.isFinite(v))
      || r.lower !== null && r.upper !== null && !(r.lower < r.upper) || !r.unit || !r.rationale
      || [r.lowerInclusive, r.upperInclusive].some(v => v !== undefined && typeof v !== "boolean")
      || !(Number.isFinite(r.normalizationScale ?? (r.lower !== null && r.upper !== null ? r.upper - r.lower : NaN))
        && (r.normalizationScale ?? r.upper! - r.lower!) > 0))
      throw new Error("Invalid AS interval");
  }
  if (!value.construction?.mechanism || !value.construction.rationale || !value.construction.limitations)
    throw new Error("Invalid AS construction explanation");
  for (const r of [value.construction, ...value.restScreen, ...value.fittingTargets, ...value.context, ...value.features])
    if (!r.sourceIds.length || r.sourceIds.some(id => !ids.has(id))) throw new Error("AS criterion needs registered provenance");
  for (const r of value.fittingTargets) {
    const screen = value.restScreen.find(s => s.metricId === r.metricId);
    if (![0, 1].includes(r.priority) || screen && ((r.lower ?? -Infinity) < (screen.lower ?? -Infinity)
      || (r.upper ?? Infinity) > (screen.upper ?? Infinity)
      || r.lower === screen.lower && screen.lowerInclusive === false && r.lowerInclusive !== false
      || r.upper === screen.upper && screen.upperInclusive === false && r.upperInclusive !== false)
      || !screen && !r.method) throw new Error("Invalid AS target or method");
  }
  return own(value) as MainWireAsReferenceDefinitionV1;
}
export const MAIN_WIRE_AS_REFERENCE_V1 = validateMainWireAsReferenceV1(raw);
export const MAIN_WIRE_AS_LOW_FLOW_REFERENCE_V1 = validateMainWireAsReferenceV1(lowFlow);
export const MAIN_WIRE_AS_REST_POLICY_V1 = Object.freeze({
  policyId: "main-wire-as-high-gradient-valve-only-rest-v1",
  ranking: "case screen first, then worst normalized mean-gradient target, then forward-SVI target; stable input order; no sum of dependent outputs",
  selection: "Every listed fitting target is required to select this teaching example after cold qualification. Priority controls search order, not whether a target is optional; these selection corridors are not universal clinical criteria.",
  finalReview: "independent cold 2/1ms, native waveform and PV inspection, current quasi-steady valve-law verification, and matched-input valve-area-only relief control; no automatic adoption",
  numericalAdmission: "current exact periodicity, all-off clocks/conservation and case measurement validity remain mandatory",
  publicPromotionAuthorized: false,
});
export const MAIN_WIRE_AS_LOW_FLOW_REST_POLICY_V1 = Object.freeze({ ...MAIN_WIRE_AS_REST_POLICY_V1,
  policyId: "main-wire-as-low-flow-reduced-ef-rest-v1",
  ranking: "case phenotype screen first, then worst normalized mean-gradient target, then forward-SVI target; no healthy or HFrEF targets inherited",
  finalReview: "independent cold 2/1ms, native waveform/PV and matched-background normal-valve control; contrast with baseline and valve-only AS; no DSE, pseudo-severe or automatic adoption claim",
});
export function assessMainWireAsRestV1(observation: { values: Readonly<Record<string, number | null>> }, reference = MAIN_WIRE_AS_REFERENCE_V1) {
  const result = intervals(reference, observation.values);
  return { ...result, features: reference.features.map(f => ({ ...f,
    descriptionRole: "intended-not-an-achievement-claim" as const,
    observations: f.metricIds.map(metricId => ({ metricId, actual: observation.values[metricId] ?? null })) })) };
}
