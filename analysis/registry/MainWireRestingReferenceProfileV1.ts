import evidence from "@/data/physiology/main-wire-normal-reference-evidence-v1.json";

/** Source comparisons, not an admission policy or a joint healthy distribution.
 * Keep published ranges separate from model tolerances and old mint corridors.
 * A source-specific method gap cannot be repaired by widening its interval.
 */
export const MAIN_WIRE_RESTING_REFERENCE_PROFILE_V1_ID = "main-wire-resting-reference-profile-v1";

type Range = Readonly<{ lower: number | null; upper: number | null }>;
type Comparison = Readonly<{
  stratum: string; range: Range;
  statistic: "published-reference-interval" | "published-10th-90th-percentiles" | "clinical-upper-limit";
}>;
type Entry = Readonly<{
  metricId: string; unit: string; sourceId: string; locator: string;
  historicalCheckId?: string;
  role: "operating-comparison" | "demographic-comparison" | "coupled-flow-context" | "method-context";
  mapping: string; comparisons: readonly Comparison[];
}>;
const range = (stratum: string, lower: number | null, upper: number | null,
  statistic: Comparison["statistic"] = "published-reference-interval"): Comparison =>
  Object.freeze({ stratum, range: Object.freeze({ lower, upper }), statistic });
const cmr = "kawel-boehm-2025-scmr-reference-values";
const rhc = "humbert-2022-esc-ers-pulmonary-hypertension";
const rhcMapping = "Absolute lumped pressure, no respiratory cycle; compare with supine end-expiratory catheter values at the specified zero. No catheter transfer function or peripheral waveform is simulated.";
const cmrMapping = "Native valve-closure cavity blood volumes, BSA indexed; compared with anatomical bSSFP CMR excluding papillary/trabecular myocardium from the blood pool. No validated image segmentation or age/sex assignment; separate marginal ranges are not a joint distribution. EF is derived from EDV and ESV.";
const indexed = (metricId: string, unit: string, table: number, men: [number, number], women: [number, number]): Entry => ({
  metricId, unit, sourceId: cmr, locator: `Table ${table}, anatomical segmentation, sex-specific indexed volume/EF rows`,
  role: "demographic-comparison", mapping: cmrMapping,
  comparisons: [range("men, pooled adult ages", ...men), range("women, pooled adult ages", ...women)],
});

export const MAIN_WIRE_RESTING_REFERENCE_PROFILE_V1 = Object.freeze({
  profileId: MAIN_WIRE_RESTING_REFERENCE_PROFILE_V1_ID,
  subject: Object.freeze({ bodySurfaceAreaM2: 1.9, allowedHeartRatesBpm: Object.freeze([60, 70]),
    sex: "unspecified", age: "unspecified", ethnicity: "unspecified" }),
  scope: "Settled resting unassisted, nonshunting sinus baseline; source comparisons are not patient-fit targets or a replacement for numerical/construction checks.",
  selectionRule: "Report every declared comparison, never select a stratum because it passes. This comparison profile alone provides no sex-union, sex-intersection or summed-score admission rule; any consuming design decision must be explicit and separately versioned.",
  entries: Object.freeze(([
    { metricId: "aortic-valve.ejection-time", unit: "s", sourceId: "alhakak-2023-copenhagen-cardiac-time-intervals",
      locator: "Methods, Cardiac time intervals; Table 2, pooled LVET 95% prediction interval",
      role: "method-context", mapping: "Native accumulated positive AoV-flow duration, not mitral-leaflet color-TDI timing. Opening-to-closure interpretation requires the separate morphology/timing observer to establish one forward episode; this comparison does not enforce that condition. No HR correction or method equivalence inferred.",
      comparisons: [range("Copenhagen pooled healthy adults; HR 63 +/- 10", .248, .336)] },
    { metricId: "pulmonary-valve.ejection-time", unit: "s", sourceId: "van-oort-1988-pulmonary-doppler",
      locator: "Abstract: population and recording stations; no numeric adult ET interval verified",
      role: "method-context", mapping: "Native accumulated positive PV-flow duration; the separate morphology/timing observer must establish one forward episode. Doppler PA versus RVOT station, respiration and HR differ. No adult ET bounds inferred from acceleration time, tissue S-wave duration or LVET.", comparisons: [] },
    { metricId: "aortic-pressure.maximum", unit: "mmHg", sourceId: "herbert-2014-central-pressure-reference",
      locator: "Methods, Standardizing methodologies; Table 2, Normal population, all adult age rows",
      role: "method-context", mapping: "Model Ao root pressure is invasive-like. Source cSBP is cuff-calibrated noninvasive estimation; authors explicitly distinguish it from higher invasive intra-aortic SBP. Published P10/P90 are context, not 95% normal cutoffs or a model calibration target.",
      comparisons: [
        range("women 20-29", 80, 110, "published-10th-90th-percentiles"), range("men 20-29", 92, 115, "published-10th-90th-percentiles"),
        range("women 30-39", 84, 119, "published-10th-90th-percentiles"), range("men 30-39", 88, 120, "published-10th-90th-percentiles"),
        range("women 40-49", 87, 123, "published-10th-90th-percentiles"), range("men 40-49", 90, 123, "published-10th-90th-percentiles"),
        range("women 50-59", 93, 127, "published-10th-90th-percentiles"), range("men 50-59", 96, 126, "published-10th-90th-percentiles"),
        range("women 60-69", 97, 129, "published-10th-90th-percentiles"), range("men 60-69", 97, 128, "published-10th-90th-percentiles"),
        range("women 70+", 100, 131, "published-10th-90th-percentiles"), range("men 70+", 99, 130, "published-10th-90th-percentiles"),
      ] },
    { metricId: "aortic-pressure.minimum", unit: "mmHg", sourceId: "herbert-2014-central-pressure-reference",
      locator: "Methods, Standardizing methodologies; Table 1, brachial DBP summary",
      role: "method-context", mapping: "Source assumes DBP consistency for calibration, but does not publish a central-DBP normal interval. Do not turn the brachial mean +/- SD into a verified Ao-node cutoff.", comparisons: [] },
    { metricId: "central-venous-pressure.mean", unit: "mmHg", sourceId: rhc, locator: "Table 11, mean RAP; section 5.1.12.1",
      role: "operating-comparison", mapping: rhcMapping, comparisons: [range("resting adult RHC reference", 2, 6)] },
    { metricId: "pulmonary-artery-pressure.maximum", unit: "mmHg", sourceId: rhc, locator: "Table 11, systolic PAP; section 5.1.12.1",
      role: "operating-comparison", mapping: rhcMapping, comparisons: [range("resting adult RHC reference", 15, 30)] },
    { metricId: "pulmonary-artery-pressure.minimum", unit: "mmHg", sourceId: rhc, locator: "Table 11, diastolic PAP; section 5.1.12.1",
      role: "operating-comparison", mapping: rhcMapping, comparisons: [range("resting adult RHC reference", 4, 12)] },
    { metricId: "pulmonary-artery-pressure.mean", unit: "mmHg", sourceId: rhc, locator: "Table 11, mean PAP; section 5.1.12.1",
      role: "operating-comparison", mapping: rhcMapping, comparisons: [range("resting adult RHC reference", 8, 20)] },
    { metricId: "pcwp-surrogate.mean", unit: "mmHg", sourceId: rhc, locator: "Table 11, PAWP; section 5.1.12.1",
      role: "method-context", mapping: "Observed quantity remains LA mean, not a wedge measurement or LVEDP. PAWP <=15 is the guideline clinical reference upper limit, not a healthy-cohort distribution or a verified model LA-to-PAWP transfer. No lower bound is invented.",
      comparisons: [range("adult RHC PAWP clinical reference", null, 15, "clinical-upper-limit")] },
    indexed("left-ventricle.edv-index", "mL/m2", 2, [46, 104], [46, 91]),
    indexed("left-ventricle.esv-index", "mL/m2", 2, [11, 41], [11, 34]),
    indexed("left-ventricle.ejection-fraction", "fraction", 2, [.53, .79], [.55, .80]),
    indexed("right-ventricle.edv-index", "mL/m2", 8, [49, 117], [47, 99]),
    indexed("right-ventricle.esv-index", "mL/m2", 8, [12, 56], [11, 43]),
    indexed("right-ventricle.ejection-fraction", "fraction", 8, [.44, .77], [.49, .77]),
    { metricId: "systemic-net-flow.cardiac-index", historicalCheckId: "systemic-forward-flow.cardiac-index", unit: "L/min/m2", sourceId: rhc, locator: "Table 11, CI; section 5.1.12.1, direct Fick/thermodilution",
      role: "operating-comparison", mapping: "Use signed native AoV NET output/BSA under a distinct metric ID. Interpretation as whole-circulation CO requires a settled unassisted nonshunting state; no positive-only flow substitution or distal-CMR-plane equivalence.",
      comparisons: [range("resting adult RHC reference", 2.5, 4)] },
    { metricId: "systemic-net-flow.stroke-volume-index", historicalCheckId: "systemic-forward-flow.stroke-volume-index", unit: "mL/m2", sourceId: rhc, locator: "Table 11, SVI; section 5.1.12.1",
      role: "coupled-flow-context", mapping: "Signed native AoV NET volume/BSA. CI = HR * SVI / 1000, so this is a coupled comparison, not a second independent fitting objective. The CI-conditional interval is reported separately; it is not this published SVI interval.",
      comparisons: [range("resting adult RHC reference", 33, 47)] },
  ] satisfies Entry[]).map(entry => Object.freeze({ ...entry, comparisons: Object.freeze(entry.comparisons) }))),
});

// Every comparison, including a method gap, resolves a concrete source. Source
// existence is not threshold support; the old provenance audit is unchanged.
const sourceIds = new Set(evidence.sources.map(source => source.sourceId));
for (const entry of MAIN_WIRE_RESTING_REFERENCE_PROFILE_V1.entries) {
  if (!sourceIds.has(entry.sourceId)) throw new Error(`Unresolved resting reference source: ${entry.sourceId}`);
}
