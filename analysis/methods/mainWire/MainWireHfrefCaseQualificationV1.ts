import { canonicalJsonStringify as canonical, sha256CanonicalJsonHex as hash } from "@/engine/integrity";
import { readMainWireStaticCaseFittingResultV1 as read, assessMainWireStaticCaseRestV1 as rest,
  buildMainWireStaticCaseFittingPolicyIdentityV1 as policyIdentity,
  type MainWireStaticCaseFittingResultV1 as Result } from "./MainWireStaticCaseFittingWorkflowV1";
import { observeMainWireHfrefCaseV3 as observe, MAIN_WIRE_HFREF_CASE_OBSERVATION_V3_ID as methodId } from "./MainWireHfrefCaseObservationV3";
import { mainWireStandard70TimingAndInletObservationTraceV1 as trace } from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard70BaselineQualificationV1";
import { classifyMainWireIntegratedModelPeriodicityV3 as classify } from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicClassifierV3";
import { MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3 as periodic,
  MAIN_WIRE_INTEGRATED_MODEL_NUMERICAL_POLICY_V3 as numerical } from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicPolicyV3";
import { mainWireStaticCaseContextV1 as context, type MainWireCaseReferenceIdV1 as Reference } from "@/analysis/registry/MainWireStaticCaseDefinitionsV1";

/** Numerical sensitivity, not a clinical interval or an error confidence bound.
 * The two event-sampled grids have 2 + 1 ms resolution; a fixed 0.5 mmHg
 * allowance alone becomes disproportionately strict at high AS gradients. */
export function compareMainWireDiseasePairedMetricV1(key: string, coarse: number | null, fine: number | null) {
  const magnitude = Math.max(Math.abs(coarse ?? 0), Math.abs(fine ?? 0));
  const timing = key === "avAccelerationTimeMs" || key === "etMs";
  const tolerance = key.endsWith("ef") || key === "avAtEt" ? .005
    : timing ? 3 : key.includes("Gradient") ? Math.max(.5, magnitude * .01)
      : key.startsWith("mean") ? .5 : Math.abs(fine ?? 0) * .01;
  const roundoffAllowance = timing ? 1e-9 : 0;
  return { key, coarse, fine, tolerance, roundoffAllowance,
    passed: coarse !== null && fine !== null && Number.isFinite(coarse) && Number.isFinite(fine)
      && Math.abs(coarse - fine) <= tolerance + roundoffAllowance };
}

/** Existing selected-case two-grid protocol, extracted from review preparation.
 * Scalar comparison and rest assessment use the same current observation method.
 * This is not a new physiology gate or completion of the manual case review. */
export async function assessMainWireHfrefCaseQualificationV1(input: Readonly<{ coarse: unknown; fine: unknown }>) {
  return assessMainWireDiseaseCaseQualificationV1(input, { referenceId: "hfref-chronic-dilated-v1", anatomyId: "dilated-lv-v1",
    schemaId: "main-wire-hfref-paired-checks-v1", keys: ["lvef", "rvef", "lvedvi", "lvesvi", "rvedvi", "rvesvi", "ci", "meanLa", "meanRa", "meanPap", "meanAo"] });
}

/** Common source/grid/conservation protocol; each case supplies its observables
 * and anatomy scope. Re-observe through the case definition, never HF fallback. */
export async function assessMainWireDiseaseCaseQualificationV1(input: Readonly<{ coarse: unknown; fine: unknown }>,
  specification: { referenceId: Exclude<Reference, "baseline">; anatomyId: string; schemaId: string; keys: readonly string[] }) {
  const { referenceId, anatomyId, keys } = specification;
  const issues: string[] = [], results: Result[] = [], observations: { values: Readonly<Record<string, number | null>> }[] = [];
  for (const [key, dt] of [["coarse", .002], ["fine", .001]] as const) {
    try {
      const r = await read(input[key]), d = r.execution.diagnostics;
      results.push(r);
      if (r.nominalDtSec !== dt || r.initialization.kind !== "cold" || r.candidateInputs.anatomyId !== anatomyId
        || r.rest.referenceId !== referenceId || r.policyIdentitySha256 !== await policyIdentity(referenceId, r.referenceContext.background))
        issues.push(`${key}:independent-current-reference-grid`);
      if (r.requestIdentitySha256 !== await hash({ modelId: r.modelId, sourceSha256: r.sourceSha256,
        candidateInputs: r.candidateInputs, nominalDtSec: r.nominalDtSec,
        initialization: r.initialization, policyIdentitySha256: r.policyIdentitySha256 })) issues.push(`${key}:request-identity`);
      if (canonical(classify(d.periodicObservations, periodic)) !== canonical(r.execution.classification)) issues.push(`${key}:periodic-classification`);
      if (!d.allOffAndOwnerClocksCheckedEveryStep || d.invariantPolicyId !== numerical.policyId
        || d.cycleEvidence.length !== r.execution.completedCycleCount || d.cycleEvidence.some((c, i) => c.cycleIndex !== i + 1
          || c.acceptedStepCount <= 0 || c.atrialCaptureCount !== 1 || c.ventricularCaptureCount !== 1
          || !(c.maximumGlobalVolumeErrorMl <= numerical.invariantTolerance.globalTotalBloodVolumeErrorMl)
          || !(c.maximumCoronaryLedgerErrorMl <= numerical.invariantTolerance.coronaryBloodVolumeLedgerResidualMl))
        || d.periodicObservations.some(o => o.protocolIdentityHash !== r.requestIdentitySha256)
        || trace(d).some(s => !(s.acceptedDtSec > 0 && s.acceptedDtSec <= dt + numerical.invariantTolerance.acceptedOwnerClockSkewSec)))
        issues.push(`${key}:native-grid-or-conservation`);
      const observed = rest(referenceId, r.execution);
      if (canonical(observed) !== canonical(r.rest)) issues.push(`${key}:rest-reobservation`);
      if (r.rest.status !== "passed") issues.push(`${key}:rest-${r.rest.status}`);
      if (observed.status === "unavailable" || observed.referenceId === "baseline") throw new Error("Case observations unavailable");
      observations.push(observed.observation);
    } catch (error) { issues.push(`${key}:${error instanceof Error ? error.message : String(error)}`); }
  }
  if (results.length === 2) {
    if (results[0]!.sourceSha256 !== results[1]!.sourceSha256) issues.push("paired-source");
    if (canonical(results[0]!.candidateInputs) !== canonical(results[1]!.candidateInputs)) issues.push("paired-inputs");
    if (canonical(results[0]!.referenceContext) !== canonical(results[1]!.referenceContext)) issues.push("paired-reference-context");
  }
  const comparisons = observations.length === 2 ? keys.map(key => compareMainWireDiseasePairedMetricV1(
    key, observations[0]!.values[key] ?? null, observations[1]!.values[key] ?? null)) : [];
  if (comparisons.length !== keys.length || comparisons.some(c => !c.passed)) issues.push("paired-grid-sensitivity");
  const body = { schemaId: specification.schemaId, status: issues.length === 0 ? "checks-passed" as const : "held" as const,
    sourceResults: results.map(r => r.resultSha256), methodId: context(referenceId).methodId, comparisons, issues,
    waveformReview: "not-performed", clinicalNormalityClaimed: false, publicPromotionAuthorized: false };
  return { ...body, reportSha256: await hash(body) };
}
