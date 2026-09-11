import { canonicalJsonStringify as canonical, cloneAndFreezeCanonicalJson as own } from "@/engine/integrity";
import { createMainWireIntegratedModelStaticCaseFixtureV1 as fixtureFor } from "@/engine/myocardium/experiments/MainWireIntegratedModelStaticCaseFixtureV1";
import type { MainWireStaticCaseAnatomyIdV1 } from "@/engine/myocardium/mechanics/MainWireStaticCaseAnatomyV1";
import { validateAndOwnMainWireIntegratedModelHemodynamicResearchInputsV3 as hemodynamic } from "@/engine/myocardium/MainWireIntegratedModelHemodynamicResearchInputsV3";
import { validateAndOwnMainWireIntegratedModelMechanismResearchInputsV3 as mechanism } from "@/engine/myocardium/MainWireIntegratedModelMechanismResearchInputsV3";
import { MAIN_WIRE_STANDARD71_BASELINE_MECHANISM_INPUTS_V1 as referenceMechanism } from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard71FixtureV1";
import { assertUnaliasedMainWireFittingCandidateV1, type MainWireBaselineCalibrationCandidateInputsV1 } from "@/analysis/policies/mainWire/MainWireBaselineCalibrationParametersV1";
import type { settleMainWireFittingSessionV1 as settle } from "@/analysis/methods/mainWire/MainWireFittingCycleV1";
import { resolveMainWireFittingReferenceV1 as resolveReference } from "@/analysis/registry/MainWireFittingReferenceRegistryV1";
import { MAIN_WIRE_PROSPECTIVE_BASELINE_ADMISSION_V1 as baselinePolicy, assessMainWireProspectiveRestV1 as assessBaseline } from "@/analysis/policies/mainWire/MainWireProspectiveBaselineAdmissionV1";
import { buildMainWireProspectiveBaselineChecksV1 as buildChecks } from "@/analysis/policies/mainWire/MainWireProspectiveBaselineChecksV1";
import { measureMainWireIntegratedModelStandard70CandidateEvidenceV1 as measure,
  mainWireStandard70TimingAndInletObservationTraceV1 as observationTrace } from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard70BaselineQualificationV1";
import { observeMainWireStandard70TimingAndInletV2 as timing } from "@/analysis/methods/mainWire/MainWireStandard70BaselineAssessmentV2";
import { MAIN_WIRE_BASELINE_OBSERVATION_V2_ID, MainWireBaselineObservationUnavailableErrorV2 } from "@/analysis/methods/mainWire/MainWireBaselineObservationV2";
import { observeMainWireHfrefCaseV3 as observeHfref, MAIN_WIRE_HFREF_CASE_OBSERVATION_V3_ID } from "@/analysis/methods/mainWire/MainWireHfrefCaseObservationV3";
import { assessMainWireHfrefDilatedRestV1 as assessHfref } from "@/analysis/policies/mainWire/MainWireHfrefDilatedReferenceV1";
import baselineEvidence from "@/data/physiology/main-wire-prospective-reference-evidence-v1.json";
import { observeMainWireAsCaseV1 as observeAs, MAIN_WIRE_AS_CASE_OBSERVATION_V1_ID } from "@/analysis/methods/mainWire/MainWireAsCaseObservationV1";
import { assessMainWireAsRestV1 as assessAs, MAIN_WIRE_AS_LOW_FLOW_REFERENCE_V1, MAIN_WIRE_AS_REFERENCE_V1 } from "@/analysis/policies/mainWire/MainWireAsReferenceV1";
import { CURRENT_BASELINE_V1 } from "@/data/model-baselines/CurrentBaselineV1";

export type MainWireStaticCaseCandidateV1 = MainWireBaselineCalibrationCandidateInputsV1 & Readonly<{ anatomyId: MainWireStaticCaseAnatomyIdV1 }>;
type Execution = Pick<Extract<Awaited<ReturnType<typeof settle>>, { status: "accepted" }>, "diagnostics">;

/** Scope of these resting cases, not the exact model\'s full input domain. */
export function ownMainWireStaticCaseCandidateV1(input: MainWireStaticCaseCandidateV1): MainWireStaticCaseCandidateV1 {
  return ownRestingInputs(input, false);
}
function ownRestingInputs(input: MainWireStaticCaseCandidateV1, allowAorticArea: boolean): MainWireStaticCaseCandidateV1 {
  const value = own(input) as MainWireStaticCaseCandidateV1;
  if (Object.keys(value).sort().join() !== ["anatomyId", "hemodynamicResearchInputs", "mechanismResearchInputs", "ventricularContractilityScale"].sort().join())
    throw new Error("Unexpected case candidate field set");
  assertUnaliasedMainWireFittingCandidateV1(value);
  const result = { anatomyId: value.anatomyId, ventricularContractilityScale: 1,
    hemodynamicResearchInputs: hemodynamic(value.hemodynamicResearchInputs), mechanismResearchInputs: mechanism(value.mechanismResearchInputs) };
  if (![60, 70].includes(result.hemodynamicResearchInputs.heartRateBpm) || result.hemodynamicResearchInputs.peepCmH2O !== 0)
    throw new Error("Resting case fitting requires HR60 or70 and zero PEEP");
  for (const key of ["pericardium", "coronaryDisease", "oxygenTransport"] as const)
    if (canonical(result.mechanismResearchInputs[key]) !== canonical(referenceMechanism[key]))
      throw new Error(`These resting references do not qualify changed ${key}`);
  const areas = result.mechanismResearchInputs.valveAreas;
  const comparedAreas = allowAorticArea ? { ...areas, AoV: { ...areas.AoV,
    maximumForwardEoaCm2: referenceMechanism.valveAreas.AoV.maximumForwardEoaCm2 } } : areas;
  if (canonical(comparedAreas) !== canonical(referenceMechanism.valveAreas)) throw new Error("Case does not qualify these valve area changes");
  fixtureFor(result.anatomyId, result.hemodynamicResearchInputs, 1, result.mechanismResearchInputs);
  return own(result) as MainWireStaticCaseCandidateV1;
}

function baselineAssessment(execution: Execution) {
  const d = execution.diagnostics, measured = measure({ ...d, timingAndInletObserver: timing });
  const checks = buildChecks(measured, true);
  const assessment = assessBaseline(d.completedBeat, checks, measured.cardiacSizeAndFunction.bodySurfaceAreaM2);
  return { referenceId: "baseline" as const, status: assessment.status, observation: { measured, checks }, assessment };
}
function hfrefAssessment(execution: Execution) {
  const d = execution.diagnostics, observation = observeHfref(d.completedBeat, observationTrace(d));
  const assessment = assessHfref(observation);
  return { referenceId: "hfref-chronic-dilated-v1" as const,
    status: assessment.screenPassed && observation.measurementReview.status === "clear" ? "passed" as const : "held" as const,
    observation, assessment };
}
function asAssessment<R extends "as-high-gradient-valve-only-v1" | "as-low-flow-reduced-ef-v1">(execution: Execution, referenceId: R) {
  const d = execution.diagnostics, observation = observeAs(d.completedBeat, observationTrace(d));
  const assessment = assessAs(observation, referenceId === "as-low-flow-reduced-ef-v1" ? MAIN_WIRE_AS_LOW_FLOW_REFERENCE_V1 : MAIN_WIRE_AS_REFERENCE_V1);
  return { referenceId,
    status: assessment.screenPassed && observation.measurementReview.status === "clear" ? "passed" as const : "held" as const,
    observation, assessment };
}

/** Model-specific bindings reuse the evidence registry and existing methods.
 * Adding a case does not silently add an anatomy or relax an exact contract. */
export const MAIN_WIRE_STATIC_CASE_DEFINITIONS_V1 = Object.freeze({
  "as-high-gradient-valve-only-v1": Object.freeze({
    referenceId: "as-high-gradient-valve-only-v1" as const, adoptedPresetId: null,
    title: "AS · 弁狭窄のみ・高勾配", titleEn: "AS · valve-only high gradient", kind: "preset" as const,
    description: "採用baselineから大動脈弁の最大有効弁口面積だけを変更した比較例。慢性肥大・線維化やEF保持型AS全体を代表するものではありません。",
    context: () => { const reference = resolveReference("as-high-gradient-valve-only-v1");
      return { reference, methodId: MAIN_WIRE_AS_CASE_OBSERVATION_V1_ID, assessmentPolicy: reference.target }; },
    ownInputs: (input: MainWireStaticCaseCandidateV1) => {
      const c = ownRestingInputs(input, true);
      if (c.anatomyId !== "baseline-v1" || c.hemodynamicResearchInputs.heartRateBpm !== 70)
        throw new Error("This AS example requires HR70 and the declared non-remodelled baseline anatomy");
      const baseline = CURRENT_BASELINE_V1.capture.fixture;
      const restored = { ...c.mechanismResearchInputs, valveAreas: { ...c.mechanismResearchInputs.valveAreas,
        AoV: { ...c.mechanismResearchInputs.valveAreas.AoV, maximumForwardEoaCm2: baseline.mechanismResearchInputs.valveAreas.AoV.maximumForwardEoaCm2 } } };
      if (canonical(c.hemodynamicResearchInputs) !== canonical(baseline.hemodynamicResearchInputs)
        || canonical(restored) !== canonical(baseline.mechanismResearchInputs))
        throw new Error("Valve-only AS may change only maximum aortic area from the adopted baseline");
      return c;
    }, assess: (execution: Execution) => asAssessment(execution, "as-high-gradient-valve-only-v1"),
    reviewItems: ["native-jet-law-and-doppler-method-difference", "raw-lv-aortic-pressure-flow-pv", "valve-area-only-relief-control", "fixed-anatomy-scope"],
  }),
  "as-low-flow-reduced-ef-v1": Object.freeze({
    referenceId: "as-low-flow-reduced-ef-v1" as const, adoptedPresetId: null,
    title: "AS · 低EF・低流量・低勾配", titleEn: "AS · low EF, low flow, low gradient", kind: "preset" as const,
    description: "拡大した左室の収縮能低下と大動脈弁狭窄を組み合わせた固定構成。低い勾配だけでは弁口狭小化を否定できないことを示す教育例です。",
    context: () => { const reference = resolveReference("as-low-flow-reduced-ef-v1");
      return { reference, methodId: MAIN_WIRE_AS_CASE_OBSERVATION_V1_ID, assessmentPolicy: reference.target }; },
    ownInputs: (input: MainWireStaticCaseCandidateV1) => {
      const c = ownRestingInputs(input, true);
      if (c.anatomyId !== "dilated-lv-v1" || c.hemodynamicResearchInputs.heartRateBpm !== 70)
        throw new Error("Low-flow AS requires HR70 and the declared dilated LV anatomy");
      return c;
    }, assess: (execution: Execution) => asAssessment(execution, "as-low-flow-reduced-ef-v1"),
    reviewItems: ["raw-lv-aortic-pressure-flow-pv", "matched-background-normal-valve-control", "low-flow-not-low-flow-rate-equivalence", "no-dse-or-pseudo-severe-claim"],
  }),
  baseline: Object.freeze({
    referenceId: "baseline" as const, adoptedPresetId: "standard73-baseline-v1", title: "baseline", titleEn: "baseline",
    kind: "baseline" as const, description: "安静・洞調律・補助循環なしの基準設定。",
    context: () => ({ reference: resolveReference("baseline"), methodId: MAIN_WIRE_BASELINE_OBSERVATION_V2_ID,
      assessmentPolicy: { policy: baselinePolicy, evidence: baselineEvidence } }),
    ownInputs: ownMainWireStaticCaseCandidateV1, assess: baselineAssessment,
    reviewItems: ["representative-baseline-selection", "raw-waveform-and-pv-review"],
  }),
  "hfref-chronic-dilated-v1": Object.freeze({
    referenceId: "hfref-chronic-dilated-v1" as const, adoptedPresetId: "standard73-hfref-chronic-dilated-v1", title: "HFrEF · 慢性左室拡大型",
    titleEn: "HFrEF · chronic LV-dilated example",
    kind: "preset" as const,
    description: "左室の拡大と収縮能低下を組み合わせた安静時の教育例。AMIや経時的なリモデリングではない。",
    context: () => { const reference = resolveReference("hfref-chronic-dilated-v1");
      return { reference, methodId: MAIN_WIRE_HFREF_CASE_OBSERVATION_V3_ID, assessmentPolicy: reference.target }; },
    ownInputs: (input: MainWireStaticCaseCandidateV1) => {
      const c = ownMainWireStaticCaseCandidateV1(input);
      if (c.hemodynamicResearchInputs.heartRateBpm !== 70)
        throw new Error("The current HFrEF reference is HR70-only; HR60 requires a different assessment scope");
      return c;
    },
    assess: hfrefAssessment,
    reviewItems: ["raw-pv-flow-pressure-and-filling", "pressure-matched-passive-mechanics", "geometry-pericardium-coronary-compatibility"],
  }),
});
export type MainWireCaseReferenceIdV1 = keyof typeof MAIN_WIRE_STATIC_CASE_DEFINITIONS_V1;
export function resolveMainWireStaticCaseDefinitionV1(referenceId: MainWireCaseReferenceIdV1) {
  if (!Object.hasOwn(MAIN_WIRE_STATIC_CASE_DEFINITIONS_V1, referenceId)) throw new Error("Unsupported case reference");
  return MAIN_WIRE_STATIC_CASE_DEFINITIONS_V1[referenceId];
}
export function mainWireStaticCaseContextV1(referenceId: MainWireCaseReferenceIdV1) {
  return resolveMainWireStaticCaseDefinitionV1(referenceId).context();
}
export function assessMainWireStaticCaseRestV1(referenceId: MainWireCaseReferenceIdV1, execution: Execution) {
  const definition = resolveMainWireStaticCaseDefinitionV1(referenceId);
  try { return definition.assess(execution); }
  catch (error) {
    if (!(error instanceof MainWireBaselineObservationUnavailableErrorV2)) throw error;
    return { referenceId, status: "unavailable" as const, issue: { code: error.code, side: error.side, message: error.message } };
  }
}
