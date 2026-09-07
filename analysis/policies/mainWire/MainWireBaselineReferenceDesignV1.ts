import baseline from "@/data/model-baselines/standard70-launch-baseline.json";
import { MAIN_WIRE_INTEGRATED_MODEL_HEMODYNAMIC_RESEARCH_RANGES_V3 } from "@/engine/myocardium/MainWireIntegratedModelHemodynamicResearchInputsV3";
import { MAIN_WIRE_FIVE_WALL_MECHANICS_RESEARCH_SCALE_RANGES_V1 } from "@/engine/myocardium/mechanics/MainWireFiveWallMechanicsResearchInputsV1";
import { MAIN_WIRE_BASELINE_REFERENCE_RESEARCH_DOMAIN_V1,
  MAIN_WIRE_BASELINE_REFERENCE_INTERVENTION_DOMAIN_V1 } from "@/engine/myocardium/experiments/MainWireBaselineReferenceResearchV1";
import { MAIN_WIRE_VENTRICULAR_ROUNDED_EJECTION_WALL_MATERIAL_V1 } from "@/engine/myocardium/mechanics/MainWireVentricularRoundedEjectionProfileV1";

export const MAIN_WIRE_BASELINE_REFERENCE_DESIGN_V1 = Object.freeze({
  studyId: "main-wire-baseline-reference-design-v1",
  role: "bounded-constitutive-screen-with-intervention-headroom",
  referenceBaselineId: baseline.baselineId,
  referenceModelId: baseline.modelId,
  referenceTrefPa: MAIN_WIRE_VENTRICULAR_ROUNDED_EJECTION_WALL_MATERIAL_V1.landEquationParameters.values.Tref
    * baseline.candidateInputs.mechanismResearchInputs.chamberMechanics.activeTensionScaleByWall.LVFW,
  amplitudeRatios: [0.8, 1, 1.2] as const,
  systemicComplianceRatios: [0.8, 1, 1.2] as const,
  interventionRadiusFraction: 0.2,
  interventionRadiusProvenance: "authoring-usefulness-screen-not-a-human-normal-reserve-threshold",
  constructionDomain: MAIN_WIRE_BASELINE_REFERENCE_RESEARCH_DOMAIN_V1,
  interventionOnlyDomain: MAIN_WIRE_BASELINE_REFERENCE_INTERVENTION_DOMAIN_V1,
  referenceSources: [
    { doi: "10.1016/j.yjmcc.2017.03.008", role: "source-material-amplitude-and-kinetics-context-not-research-bound" },
    { doi: "10.3389/fcvm.2023.1197842", role: "coupled-ventricular-and-arterial-pressure-response-not-a-direct-Tref-calibration" },
    { doi: "10.1016/j.mbs.2021.108731", role: "parameter-subset-identifiability-and-observation-context" },
    { doi: "10.1152/ajpheart.1998.274.2.H500", role: "human-central-SV-to-pulse-pressure-compliance-proxy-not-a-universal-normal-range" },
    { doi: "10.1038/jhh.2009.92", role: "compliance-estimation-method-dependence-not-an-exact-model-C-calibration" },
  ],
  decision: "report-rest-constraints-and-intervention-response-separately-no-automatic-mint",
  defaultScreenUnchanged: "Ca,Land-rates,geometry,passive-law-form,pulmonary-PV-law,valves,AV-inertance; explicit intervention jobs record additional counterfactuals separately",
  afterloadStressTestRequired: false,
});

/** Box occupancy only: these ratios are NOT measured physiological reserve. */
export function baselineRelativeParameterDomainV1(reference: number, minimum: number, maximum: number) {
  if (![reference, minimum, maximum].every(Number.isFinite)
    || !(minimum > 0) || !(maximum >= minimum) || reference < minimum || reference > maximum) {
    throw new Error("relative parameter domain requires a positive reference within finite bounds");
  }
  return Object.freeze({ reference, minimum, maximum,
    claim: "declared-coordinate-range-only-not-physiological-reserve" as const,
    relativeMinimum: minimum / reference, relativeMaximum: maximum / reference,
    availableDecreaseFraction: 1 - minimum / reference,
    availableIncreaseFraction: maximum / reference - 1 });
}

export function currentMainWireBaselineHeadroomV1() {
  const h = baseline.candidateInputs.hemodynamicResearchInputs;
  const active = MAIN_WIRE_FIVE_WALL_MECHANICS_RESEARCH_SCALE_RANGES_V1.activeTensionScaleByWall;
  const range = MAIN_WIRE_INTEGRATED_MODEL_HEMODYNAMIC_RESEARCH_RANGES_V3;
  return Object.freeze({
    activeTension: baselineRelativeParameterDomainV1(
      baseline.candidateInputs.mechanismResearchInputs.chamberMechanics.activeTensionScaleByWall.LVFW,
      active.minimum, active.maximum),
    arterialStiffness: baselineRelativeParameterDomainV1(h.arterialStiffness,
      range.arterialStiffness.minimum, range.arterialStiffness.maximum),
    systemicResistance: baselineRelativeParameterDomainV1(h.systemicResistance,
      range.systemicResistance.minimum, range.systemicResistance.maximum),
  });
}

export function mainWireBaselineReferenceScreenV1() {
  return MAIN_WIRE_BASELINE_REFERENCE_DESIGN_V1.amplitudeRatios.flatMap(active =>
    MAIN_WIRE_BASELINE_REFERENCE_DESIGN_V1.systemicComplianceRatios.map(compliance => ({
      id: `active-${active}-systemic-C-${compliance}`,
      role: "baseline-candidate" as const,
      heartRateBpm: 70 as const,
      parameters: {
        ventricularTrefPa: MAIN_WIRE_BASELINE_REFERENCE_DESIGN_V1.referenceTrefPa * active,
        systemicArterialComplianceScale: compliance,
      },
    })));
}

/** Reject misspelled/unsupported experiment settings before spending a settle.
 * Numerical admissibility remains owned by the exact research construction.
 * Resolution belongs to the runner's --dt-sec option, never a job property. */
export function assertMainWireBaselineReferenceJobFieldsV1(value: unknown): void {
  const record = (input: unknown, allowed: readonly string[], label: string) => {
    if (input === null || typeof input !== "object" || Array.isArray(input)) {
      throw new Error(`${label} must be an object`);
    }
    const unknown = Object.keys(input).filter(key => !allowed.includes(key));
    if (unknown.length) throw new Error(`unsupported ${label} fields: ${unknown.join(", ")}; resolution uses --dt-sec`);
    return input as Record<string, unknown>;
  };
  const job = record(value, ["id", "role", "parameters", "heartRateBpm", "totalBloodVolumeMl",
    "systemicResistance", "ventricularPassiveScale", "aorticRootInertanceScale", "mechanismTrace",
    "ventricularCalciumTimeScale", "ventricularCalciumRiseFraction", "ventricularAeff", "ventricularDiastolicCalciumUM",
    "ventricularLandSlackStretch", "ventricularKineticRestoration", "ventricularBridgeExit",
    "ventricularRecruitmentDistortion", "ventricularLengthSensitivityScale", "initialization",
    "preloadReserve", "leftAtrialActiveScale", "pericardialReferenceCapacityScale",
    "ventricularAffinityCalibration", "ventricularPeakCalciumUM"], "research job");
  if (typeof job.id !== "string" || !/^[a-zA-Z0-9._-]+$/.test(job.id)
    || !["baseline-candidate", "intervention"].includes(String(job.role))
    || ![60, 70].includes(job.heartRateBpm as number)) throw new Error("invalid research job id, role or HR");
  record(job.parameters, ["ventricularTrefPa", "systemicArterialComplianceScale"], "research parameters");
  for (const key of ["preloadReserve", "mechanismTrace"]) {
    if (job[key] !== undefined && typeof job[key] !== "boolean") throw new Error(`${key} must be boolean`);
  }
  if (job.initialization !== undefined
    && !["cold", "published-reference-continuation"].includes(String(job.initialization))) {
    throw new Error("unsupported research initialization");
  }
  if (job.ventricularBridgeExit !== undefined && job.ventricularBridgeExit !== "none") {
    record(job.ventricularBridgeExit, ["maximumRatePerSec", "cooperativeGatePower"], "bridge-exit probe");
  }
  if (job.ventricularRecruitmentDistortion !== undefined) {
    record(job.ventricularRecruitmentDistortion, ["kwsScale", "phiScale"], "recruitment/distortion probe");
  }
  if (job.ventricularAffinityCalibration !== undefined) {
    record(job.ventricularAffinityCalibration, ["caT50RefUM", "beta1UM"], "affinity calibration");
  }
}
