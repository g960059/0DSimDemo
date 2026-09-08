import evidence from "@/data/physiology/main-wire-prospective-reference-evidence-v1.json";
import { compareMainWireRestingReferencesV1 } from "@/analysis/methods/mainWire/MainWireRestingReferenceComparisonV1";
import { mainWireBaselineCheckBlocksV1, mainWireBaselineGateRoleV1,
  assertMainWireBaselineCheckCoverageV1 } from "./MainWireProspectiveBaselineGateRolesV1";
import type { MainWireIntegratedModelCompletedBeatMetricsV3 as Beat } from "@/engine/myocardium/MainWireIntegratedModelBeatMetricsV3";
import type { MainWireIntegratedModelStandard70BaselineCheckV1 as Check } from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard70BaselineValidationV1";

const rhc = "humbert-2022-esc-ers-pulmonary-hypertension";
export const MAIN_WIRE_PROSPECTIVE_BASELINE_ADMISSION_V1 = Object.freeze({
  policyId: "main-wire-prospective-baseline-admission-v1",
  scope: "Resting unassisted nonshunting sinus research construction, BSA1.9, HR60 or70, zero intrathoracic reference. Scientific eligibility for exact-model promotion, not public mint or clinical normality.",
  operating: [
    { metricId: "systemic-net-flow.cardiac-index", lower: 2.5, upper: 4, sourceId: rhc, locator: "Table 11, CI", basis: "source-informed-operating-target" },
    { metricId: "central-venous-pressure.mean", lower: 2, upper: 6, sourceId: rhc, locator: "Table 11, mean RAP", basis: "source-informed-operating-target" },
    { metricId: "pulmonary-artery-pressure.mean", lower: 8, upper: 20, sourceId: rhc, locator: "Table 11, mean PAP", basis: "source-informed-operating-target" },
    { metricId: "aortic-pressure.maximum", lower: 90, upper: 140, sourceId: "herbert-2014-central-pressure-reference", locator: "Methods, invasive versus cuff-calibrated pressure distinction", basis: "retained-engineering-load-guard-NOT-source-derived-normal-range" },
    { metricId: "aortic-pressure.minimum", lower: 60, upper: 90, sourceId: "herbert-2014-central-pressure-reference", locator: "Methods, DBP calibration; no central-DBP reference interval", basis: "retained-engineering-load-guard-NOT-source-derived-normal-range" },
    { metricId: "left-ventricle.native-end-filling-pressure", lower: null, upper: 16, sourceId: "nagueh-2025-lv-diastolic-function", locator: "Section2, Table1 p539 (>16), Figure1 p540", basis: "source-informed-engineering-load-guard-NOT-method-matched-normal-range" },
  ],
  loadGuardRationale: "Keep a baseline away from low/high systemic load and high native end-filling pressure. Ao bounds are retained design choices, not derived from Herbert. LV native flow cessation may precede the pressure upstroke; <=16 is an approximate end-filling design ceiling, not validated catheter LVEDP equivalence or a lower normal limit.",
  anatomyRule: "For this sex-unspecified generic baseline only, automatic eligibility requires all six valid anatomical CMR comparisons inside BOTH declared sex strata. Otherwise require demographic/method review, not automatic disease rejection. This conservative design intersection does not assign sex or claim joint population normality; preset/patient fitting must use its own profile.",
  warningRule: "Keep strict source comparisons for phasic PAP, ET, anatomy and SVI plus historical timing/E-A/dPdt/roundness context. A warning never excuses missing, nonfinite or invalid observations. Preserve unexplained ringing/closure-rebound construction holds; pressure-peak phase and PV roundness are not universal normality gates.",
  numericalAndConstructionProvenance: "Inherited numerical/gradient/ringing checks resolve their existing per-check evidence; new rest criteria do not reinterpret the old physiological corridors or clear the old provenance audit.",
  regression: "__tests__/mainWireProspectiveBaselineAdmissionV1.test.ts",
});
for (const rule of MAIN_WIRE_PROSPECTIVE_BASELINE_ADMISSION_V1.operating) {
  if (!evidence.sources.some(s => s.sourceId === rule.sourceId)) throw new Error(`Missing admission source: ${rule.sourceId}`);
}

/** Consumes freshly observed checks, not persisted passed/failed votes. The pair
 * qualifier separately requires settlement, tau, pressure-rate quality, reserve
 * and construction/pressure-reference applicability. No legacy gate mutation. */
export function assessMainWireProspectiveRestV1(beat: Beat, checks: readonly Check[], bsa: number) {
  assertMainWireBaselineCheckCoverageV1(checks);
  const comparison = compareMainWireRestingReferencesV1(beat, bsa);
  const byId = new Map(comparison.entries.map(e => [e.metricId, e]));
  const operating = MAIN_WIRE_PROSPECTIVE_BASELINE_ADMISSION_V1.operating.map(rule => {
    const actual = rule.metricId === "left-ventricle.native-end-filling-pressure"
      ? comparison.nativeLvEndDiastolicPressure?.absolutePressureMmHg ?? null : byId.get(rule.metricId)!.actual;
    return { ...rule, actual, status: actual === null || !Number.isFinite(actual) ? "unresolved" as const
      : (rule.lower === null || actual >= rule.lower) && actual <= rule.upper ? "passed" as const : "failed" as const };
  });
  const retained = checks.filter(c => ["numerical-quality", "construction-guard", "reference-warning"].includes(mainWireBaselineGateRoleV1(c.checkId)));
  const invalidOrFailedRetained = retained.filter(mainWireBaselineCheckBlocksV1).map(c => c.checkId);
  const unavailable = comparison.entries.filter(e => e.observationStatus !== "observed").map(e => e.metricId);
  const anatomy = comparison.entries.filter(e => e.role === "demographic-comparison");
  const anatomyReviewRequired = anatomy.some(e => e.comparisons.some(c => c.status === "outside-source-range"));
  const historicalWarnings = retained.filter(c => mainWireBaselineGateRoleV1(c.checkId) === "reference-warning" && c.status !== "passed");
  return { operating, comparison, invalidOrFailedRetained, unavailable, anatomyReviewRequired, historicalWarnings,
    status: unavailable.length || operating.some(c => c.status === "unresolved") ? "unresolved" as const
      : invalidOrFailedRetained.length || operating.some(c => c.status === "failed") ? "failed" as const
        : anatomyReviewRequired ? "demographic-review-required" as const : "passed" as const };
}
