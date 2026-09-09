/** English explanatory projection; source records and numerical rules remain in
 * the physiology registry. Missing translations fail during authoring. */
const sources: Record<string, { population: string; method: string; limitations: string }> = {
  "heidenreich-2022-hf": {
    population: "EF classification in the 2022 heart-failure guideline.",
    method: "The guideline's EF-based classification is used as a construction convention.",
    limitations: "Neither a claim about the latest definition nor a clinical diagnosis from low EF alone.",
  },
  "carlsson-2012-cmr-flow": {
    population: "157 patients with CHF and EF ≤40%, age 60±13 years. Moderate or greater MR, AR and aortic velocity >3 m/s were among the exclusions.",
    method: "Supine CMR; whole-cycle phase-contrast flow in the ascending aorta at the pulmonary-artery bifurcation.",
    limitations: "CI and EF were weakly related. Flow measured beyond the coronary origins is not identical to model AV net output. Low CI is not a necessary HFrEF finding.",
  },
  "shinke-1999-invasive-pv": {
    population: "14 patients with LV dysfunction: 10 with previous infarction and four with DCM. EF 34±12%, range 23–53%; not all had EF ≤40%.",
    method: "Control HR 83±10; conductance volume and Millar cavity pressure. Linear ESPVR during IVC occlusion; loop area for work; Raff–Glantz relaxation.",
    limitations: "Diuretics and vasodilators were withheld for at least 24 hours. EDP differs between Tables 1 and 2; Ees indexing units also differ between text and table. These values cannot directly define model thresholds or validate transmural work and a nonlinear common-isochrone ESPVR.",
  },
  "moriwaki-2021-invasive-pv": {
    population: "10 treated HFrEF patients with improved symptoms; EF 23±6%, HR 72±17. PAWP ≥25 mmHg, resting SBP ≥160 mmHg, AF, severe valve disease and recent AMI were excluded.",
    method: "Right-heart catheterization and 333-Hz microchip/conductance PV, calibrated to MRI volume. Senzaki single-beat Ees; MAP estimated from LV end-systolic and estimated diastolic pressures.",
    limitations: "Small, selected, treated cohort. Do not index individual volumes using the cohort's mean BSA. PAWP is not measured mean LA pressure. Nonzero-asymptote tau is not Weiss tau and requires method checking before comparison with Glantz.",
  },
  "patel-2020-timing": {
    population: "171 ambulatory HFrEF patients; median EF 30%, interquartile range 25–35%.",
    method: "Three echocardiographic measurements. SET from LVOT Doppler; PEP includes ECG timing; relaxation calculated as R-to-E minus PEP and SET.",
    limitations: "PEP is not ICT; Doppler endpoints differ from flow-zero crossings. HR dependence prevents adopting the interquartile interval as an HR70 gate. Table 2 gives HFrEF relaxation 93.3 [67.3, 122] ms, while the abstract reverses the group medians. That inconsistent statistic is contextual only, not a gate or objective.",
  },
  "benfari-2019-diastolic": {
    population: "12,421 patients with Stage B/C LV dysfunction, including EF <50%; not an exclusively EF ≤40% cohort.",
    method: "Doppler diastolic measures; filling patterns differ between E/e′ groups.",
    limitations: "Supports not requiring restrictive filling in every HFrEF case. The 0D model does not measure e′, so E/e′ must not be invented.",
  },
  "kato-1996-dcm-pv": {
    population: "38 resting idiopathic DCM patients in sinus rhythm, NYHA II–III, and nine controls. Stabilized by treatment, then medications withheld for at least three days. Observed EF 17–64%; not all meet modern HFrEF classification.",
    method: "High-fidelity LV pressure at 3-ms intervals. Zero-asymptote Weiss and Raff–Glantz tau from minimum dP/dt to EDP+5 mmHg. Conductance volume and four to eight IVC-occlusion beats for Ees.",
    limitations: "Small selected cohort. Acquisition differs from time-weighted accepted-step regression and valve-event measurements. Ees and tau were not correlated; some patients retained relaxation. Inconsistent assignment of preserved TL/TD proportions in the text prevents using a finding frequency.",
  },
  "pi-2018-dcm-cmr": {
    population: "172 idiopathic DCM patients with EF <40%; HR 83±20 and MAP 84±13 mmHg.",
    method: "CMR and contemporaneous clinical measurements. LV-volume-derived and RV-volume-derived output differ.",
    limitations: "Clinical MAP and exact Ao-node cycle mean differ in site and method. Do not transfer LV-volume-derived CI to net AV flow or derive net CI from ratios of cohort means.",
  },
  "bortone-1989-dcm-stiffness": {
    population: "12 DCM patients and 10 controls. Seven DCM patients had normal material stiffness and five had increased stiffness; group mean EF 37/36% and LVEDP 18/22 mmHg.",
    method: "Simultaneous ventriculography and high-fidelity pressure, viscoelastic pressure–volume/stress–strain analysis, and right-heart biopsy.",
    limitations: "Chamber pressure–volume behavior differs from tissue stiffness. Small-group abstract statistics do not directly specify model material coefficients or required intervals.",
  },
  "ishihara-1994-dcm-energetics": {
    population: "Invasive PV in 23 idiopathic DCM patients; simultaneous coronary-sinus oxygen consumption in 16.",
    method: "Conductance PV, IVC-occlusion Ees and a double-thermistor coronary-sinus catheter.",
    limitations: "Statistics are mean±SE. Inferring Ees/Ea from EF does not provide independent evidence. SW/PVA and SW/MVO2 differ; transmural model work alone establishes neither metabolic efficiency nor increased PVA. Institution and authors overlap with Kato.",
  },
  "lavine-1989-dcm-filling": {
    population: "33 controls; 14 DCM patients with normal and 26 with elevated filling pressure, classified by mean pulmonary capillary pressure.",
    method: "Filling pressure and pulsed transmitral Doppler; mitral-regurgitation effects also examined.",
    limitations: "Filling pressure and MR affect inflow differently. The 15-mmHg group boundary is not an identical threshold for mean LA or LVEDP. Doppler velocity and total volumetric valve flow must remain distinct.",
  },
  "david-1989-simultaneous-la-lv": {
    population: "Idiopathic DCM at baseline and during amrinone. Sample size was not stated in the available abstract.",
    method: "Simultaneous LA/LV micromanometer pressures, transmitral Doppler and M-mode/2D echocardiography.",
    limitations: "E/A can fall despite improved relaxation. Intervention mechanisms were not individually isolated. This is not validation of a numerical target or drug model.",
  },
  "becker-2021-dcm-rv": {
    population: "216 nonischemic DCM patients with CMR EF <50%; median EF 37% [25–44]. RV dysfunction in 38% and MR in 63%, mostly mild.",
    method: "Single-center retrospective CMR cohort; preexisting RV disease and pulmonary hypertension excluded.",
    limitations: "Includes EF >40%, treatment, AF and MR. The 38% finding is not a universal HFrEF frequency or occurrence probability. LV/RV association does not determine causal direction.",
  },
};
const rationales: Record<string, string> = {
  "screen.lvef": "Reduced EF defines the chosen phenotype. The 20% lower bound selects severity; it is not a diagnostic lower limit.",
  "screen.lvedvi": "Selects a chronic LV-dilated volume range, not a requirement for all HFrEF or an imaging diagnostic boundary.",
  "screen.ci": "Allows lower or retained output; reduced EF is not equated with extreme low output.",
  "screen.meanLa": "Retains the broad screen against extreme filling. Elevated pressure is a case preference, not a required condition.",
  "screen.meanRa": "Selects loading for an LV-dominant case; it proves neither normal RVEF nor absence of RV involvement.",
  "screen.meanAo": "Avoids extreme arterial loading. Site and method differences prevent treating it as clinical MAP diagnosis.",
  "target.lvef": "Meet EF jointly with the other primary preferences, without ranking EF above all other objectives.",
  "target.lvedvi": "Selects dilation and a large residual volume. ESVI is not added as a duplicate objective.",
  "target.ci": "Selects one case with retained resting net output, not a disease-specific normal CI interval.",
  "target.meanAo": "A resting arterial-pressure preference, strongly dependent on output and vascular load. Missing it does not invalidate HFrEF; the lower bound was not lowered to admit a known 77-mmHg candidate.",
  "target.meanLa": "Intentionally selects higher filling than the mean PAWP of 10–12 mmHg in treated cohorts. Lavine supports the existence of such cases, not a frequency weight. Pressure alone does not diagnose edema or clinical congestion; native LV end-filling cavity and transmural pressures are also reported. Higher is not rewarded beyond the interval.",
  "target.weissTauMs": "A broad design interval informed by 54±14 ms, not a normal/abnormal boundary. Use only quality-qualified Weiss fits and retain the window and baseline comparison. With calcium/crossbridge rates fixed, tau changes can arise from geometry, tension, load and regression window; intrinsic relaxation change is not identified. No substitution by Glantz or extra reward for longer tau.",
};
export function hfrefSourceEnglishV1(id: string) {
  const text = sources[id];
  if (!text) throw new Error(`Missing English HFrEF source explanation: ${id}`);
  return text;
}
export function hfrefRationaleEnglishV1(group: "screen" | "target", metricId: string) {
  const text = rationales[`${group}.${metricId}`];
  if (!text) throw new Error(`Missing English HFrEF rationale: ${group}.${metricId}`);
  return text;
}
