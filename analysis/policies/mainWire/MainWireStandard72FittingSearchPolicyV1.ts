import { MAIN_WIRE_PROSPECTIVE_BASELINE_ADMISSION_V1 as admission } from "./MainWireProspectiveBaselineAdmissionV1";
import { MAIN_WIRE_RESTING_REFERENCE_PROFILE_V1 as profile } from "@/analysis/registry/MainWireRestingReferenceProfileV1";
import { mainWireBaselineCalibrationParameterV1 as descriptor,
  readMainWireBaselineCalibrationParameterV1 as read, transformMainWireBaselineCalibrationParameterV1 as transform,
  type MainWireBaselineCalibrationParameterIdV1 as Id,
  type MainWireBaselineCalibrationCandidateInputsV1 as Candidate } from "./MainWireBaselineCalibrationParametersV1";
import type { MainWireStandard72AcceptedCalibrationEvaluationV1 as Evaluation } from "@/analysis/methods/mainWire/MainWireStandard72BaselineCalibrationEvaluatorV1";

const supported = Object.freeze(["hemodynamics.total-blood-volume-ml", "hemodynamics.systemic-resistance",
  "hemodynamics.arterial-stiffness", "myocardium.common-ventricular-active-tension-scale"] as const satisfies readonly Id[]);

/** Search preferences are engineering choices, not new physiological gates,
 * likelihood weights, evidence of identifiability, or release-lattice rules. */
export const MAIN_WIRE_STANDARD72_FITTING_SEARCH_POLICY_V1 = Object.freeze({
  policyId: "main-wire-standard72-bounded-resting-pattern-search-v1",
  supportedParameters: supported,
  defaultParameters: Object.freeze(supported.slice(0, 3)),
  fixedParameters: "HR, venous tone, pulmonary resistance, passive material, Ca/Land kinetics, and all nonselected controls",
  objective: "feasibility-first-then-worst-normalized-current-admission-margin",
  bounds: "registered-exact-research-domains-or-explicit-narrower-search-box-not-physiological-priors",
  normalization: "two-sided distance / interval width; upper-only distance / absolute upper limit; no invented lower bound",
  anatomy: "existing-generic-baseline-both-sex-intersection; correlated constraints are not independent data",
  initialStepFraction: .1, minimumStepFraction: .0125, minimumMarginImprovement: .02,
  maximumEvaluations: 25, maximumAllowedEvaluations: 65,
  maximumFinalists: 3,
  continuation: "one-immutable-incumbent-checkpoint-for-every-neighbor-in-a-poll",
  budgetBoundary: "stop-before-an-incomplete-neighborhood; budget-is-an-upper-bound",
  finalQualification: "separate-independent-cold-2ms-1ms-and-fixed-control-preload-protocol",
  gateThresholdsChanged: false, globalOptimumClaimed: false, parameterIdentifiabilityClaimed: false,
});
const policy = MAIN_WIRE_STANDARD72_FITTING_SEARCH_POLICY_V1;
export type MainWireStandard72FittingSearchOptionsV1 = Readonly<{
  parameters?: readonly Readonly<{ parameterId: Id; minimum?: number; maximum?: number }>[];
  maximumEvaluations?: number;
}>;

export function resolveMainWireStandard72FittingSearchPlanV1(seed: Candidate, options: MainWireStandard72FittingSearchOptionsV1 = {}) {
  if (!options || typeof options !== "object" || Array.isArray(options)
    || Object.keys(options).some(k => !["parameters", "maximumEvaluations"].includes(k))) throw new Error("Unrecognized search plan fields");
  const maximumEvaluations = options.maximumEvaluations ?? policy.maximumEvaluations;
  if (!Number.isInteger(maximumEvaluations) || maximumEvaluations < 1 || maximumEvaluations > policy.maximumAllowedEvaluations) {
    throw new Error(`Search evaluation budget must be an integer in [1, ${policy.maximumAllowedEvaluations}]`);
  }
  const parameters: NonNullable<MainWireStandard72FittingSearchOptionsV1["parameters"]> = options.parameters
    ?? policy.defaultParameters.map(parameterId => ({ parameterId }));
  if (!Array.isArray(parameters) || parameters.length < 1 || parameters.length > supported.length
    || parameters.some(p => !p || typeof p !== "object" || Array.isArray(p)
      || Object.keys(p).some(k => !["parameterId", "minimum", "maximum"].includes(k)))
    || new Set(parameters.map(p => p.parameterId)).size !== parameters.length) throw new Error("Select one to four distinct supported search parameters");
  const coordinates = parameters.map(p => {
    if (!(supported as readonly string[]).includes(p.parameterId)) {
      throw new Error(`Unsupported search parameter: ${p.parameterId}; preload aliases and kinetic/passive parameters are not jointly fitted`);
    }
    const d = descriptor(p.parameterId), minimum = p.minimum ?? d.minimum, maximum = p.maximum ?? d.maximum;
    if (!Number.isFinite(minimum) || !Number.isFinite(maximum) || minimum < d.minimum || maximum > d.maximum || minimum >= maximum) {
      throw new Error(`Search bounds must be a nonempty subset of the registered domain: ${p.parameterId}`);
    }
    const initialValue = read(seed, p.parameterId);
    if (!Number.isFinite(initialValue) || initialValue < minimum || initialValue > maximum) throw new Error(`Search seed outside declared bounds: ${p.parameterId}`);
    return { parameterId: p.parameterId, unit: d.unit, transform: d.transform, minimum, maximum, initialValue,
      lowerTransformed: transform(p.parameterId, minimum), upperTransformed: transform(p.parameterId, maximum),
      boundProvenance: d.boundProvenance };
  }).sort((a, b) => supported.indexOf(a.parameterId as typeof supported[number]) - supported.indexOf(b.parameterId as typeof supported[number]));
  return { coordinates, maximumEvaluations };
}
export type MainWireStandard72FittingSearchPlanV1 = ReturnType<typeof resolveMainWireStandard72FittingSearchPlanV1>;

type Margin = Readonly<{ metricId: string; actual: number; lower: number | null; upper: number;
  scale: number; margin: number; source: string }>;
export type MainWireStandard72FittingSearchScoreV1 =
  | Readonly<{ status: "excluded"; issues: readonly string[] }>
  | Readonly<{ status: "rankable"; feasible: boolean; worstMargin: number; margins: readonly Margin[] }>;

/** Read existing observations, but take every bound from the current policy.
 * Warnings (ET/Tei/dPdt/roundness etc.) stay visible in the saved result and
 * never become accidental center-fitting objectives. */
export function scoreMainWireStandard72FittingRestV1(e: Evaluation): MainWireStandard72FittingSearchScoreV1 {
  const issues = [...e.rest.invalidOrFailedRetained, ...e.rest.unavailable];
  if (e.rest.status === "unresolved" || e.classification.status !== "period1-converged") issues.push("unresolved-rest-or-settlement");
  if (issues.length) return { status: "excluded", issues };
  const margins: Margin[] = [];
  const add = (metricId: string, actual: number | null | undefined, lower: number | null, upper: number, source: string) => {
    const scale = lower === null ? Math.abs(upper) : upper - lower;
    if (actual == null || !Number.isFinite(actual) || !(scale > 0)) { issues.push(`unavailable:${metricId}`); return; }
    margins.push({ metricId, actual, lower, upper, source, scale,
      margin: (lower === null ? upper - actual : Math.min(actual - lower, upper - actual)) / scale });
  };
  for (const rule of admission.operating) {
    const rows = e.rest.operating.filter(r => r.metricId === rule.metricId);
    if (rows.length !== 1) { issues.push(`operating-coverage:${rule.metricId}`); continue; }
    add(rule.metricId, rows[0]!.actual, rule.lower, rule.upper, `${admission.policyId}:${rule.sourceId}`);
  }
  const anatomy = profile.entries.filter(r => r.role === "demographic-comparison");
  for (const rule of anatomy) {
    const rows = e.rest.comparison.entries.filter(r => r.metricId === rule.metricId);
    if (rows.length !== 1) { issues.push(`anatomy-coverage:${rule.metricId}`); continue; }
    const lower = Math.max(...rule.comparisons.map(c => c.range.lower!));
    const upper = Math.min(...rule.comparisons.map(c => c.range.upper!));
    add(rule.metricId, rows[0]!.actual, lower, upper, `${profile.profileId}:${rule.sourceId}`);
  }
  if (issues.length || margins.length !== admission.operating.length + anatomy.length) return { status: "excluded", issues: [...issues, "incomplete-margin-observations"] };
  const worstMargin = Math.min(...margins.map(r => r.margin));
  const feasible = worstMargin >= 0;
  if (feasible !== (e.rest.status === "passed")) return { status: "excluded", issues: ["rest-vote-and-observations-disagree"] };
  return { status: "rankable", feasible, worstMargin, margins };
}
