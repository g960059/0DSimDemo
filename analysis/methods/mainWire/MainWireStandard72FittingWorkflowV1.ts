import { canonicalJsonStringify, cloneAndFreezeCanonicalJson, sha256CanonicalJsonHex } from "@/engine/integrity";
import { MAIN_WIRE_INTEGRATED_STUDIO_STANDARD72_MODEL_ID_V1 as modelId } from "@/domain/model/MainWireStandardIdentityV1";
import { MainWireIntegratedModelStandard72TypedAuthoritySessionV1 as Session } from "@/engine/vnext/MainWireIntegratedModelStandard72TypedAuthoritySessionV1";
import type { MainWireIntegratedModelStandard72CheckpointV1 as Checkpoint } from "@/engine/myocardium/MainWireIntegratedModelStandard72CheckpointV1";
import type { MainWireBaselineCalibrationCandidateInputsV1 as Candidate } from "@/analysis/policies/mainWire/MainWireBaselineCalibrationParametersV1";
import { resolveMainWireFittingReferenceV1 } from "@/analysis/registry/MainWireFittingReferenceRegistryV1";
import { evaluateMainWireStandard72BaselineCalibrationCandidateV1 as evaluate,
  MAIN_WIRE_STANDARD72_BASELINE_CALIBRATION_EVALUATOR_V1_ID as evaluatorId,
  buildMainWireStandard72FittingPolicyIdentityV1 as policyIdentity,
  type MainWireStandard72AcceptedCalibrationEvaluationV1 as Evaluation } from "./MainWireStandard72BaselineCalibrationEvaluatorV1";

const schemaId = "main-wire-standard72-saved-fitting-result-v1" as const;
type Reference = ReturnType<typeof resolveMainWireFittingReferenceV1>;
export type MainWireStandard72SavedFittingResultV1 = Readonly<{
  schemaId: typeof schemaId; modelId: typeof modelId; reference: Reference;
  referenceIdentitySha256: string; evaluation: Evaluation; resultSha256: string;
}>;

/** Reuse carries parameters and a verified exact72 checkpoint; it does not turn
 * the selected reference's outputs into a new target, or grant baseline approval.
 */
export async function runMainWireStandard72FittingWorkflowV1(request: Readonly<{
  candidateInputs?: Candidate;
  source?: Readonly<{ checkpoint: Checkpoint; candidateInputs: Candidate }>;
  reuse?: unknown;
  cold?: boolean;
  abortSignal?: AbortSignal;
}> = {}) {
  const owned = cloneAndFreezeCanonicalJson({ candidateInputs: request.candidateInputs ?? null,
    source: request.source ?? null, reuse: request.reuse ?? null, cold: request.cold ?? false }) as {
    candidateInputs: Candidate | null; source: { checkpoint: Checkpoint; candidateInputs: Candidate } | null; reuse: unknown; cold: boolean };
  if (owned.cold && (owned.reuse !== null || owned.source !== null)) throw new Error("Choose cold execution or checkpoint reuse");
  if (owned.source !== null && owned.reuse !== null) throw new Error("Choose a source checkpoint or saved-result reuse");
  const reference = resolveMainWireFittingReferenceV1("baseline");
  const saved = owned.reuse === null ? null : await validateMainWireStandard72SavedFittingResultV1(owned.reuse);
  const sourceCandidateInputs = saved?.evaluation.candidateInputs ?? owned.source?.candidateInputs ?? reference.selectedConstruction.candidateInputs;
  const candidateInputs = owned.candidateInputs ?? sourceCandidateInputs;
  const checkpoint = saved?.evaluation.checkpoint ?? owned.source?.checkpoint;
  const evaluation = await evaluate({ candidateInputs, abortSignal: request.abortSignal,
    initialization: checkpoint === undefined ? { kind: "cold" }
      : canonicalJsonStringify(candidateInputs) === canonicalJsonStringify(sourceCandidateInputs)
        ? { kind: "standard72-exact-checkpoint", checkpoint, ...(saved ? { sourceNominalDtSec: saved.evaluation.nominalDtSec } : {}) }
        : { kind: "standard72-parameter-continuation", checkpoint, sourceCandidateInputs,
          ...(saved ? { sourceNominalDtSec: saved.evaluation.nominalDtSec } : {}) } });
  if (evaluation.status !== "accepted") return { status: "evaluation-failed" as const, evaluation };
  const body = { schemaId, modelId, reference, referenceIdentitySha256: await sha256CanonicalJsonHex(reference), evaluation };
  const result: MainWireStandard72SavedFittingResultV1 = { ...body, resultSha256: await sha256CanonicalJsonHex(body) };
  return { status: "saved-result-ready" as const, result };
}

/** A digest detects edits, not third-party scientific certification. Always
 * restore using the saved candidate to verify model/parameter/checkpoint binding.
 * Current policy/reference equality prevents a stale record becoming current.
 */
export async function validateMainWireStandard72SavedFittingResultV1(input: unknown): Promise<MainWireStandard72SavedFittingResultV1> {
  const value = cloneAndFreezeCanonicalJson(input) as MainWireStandard72SavedFittingResultV1;
  if (value === null || typeof value !== "object" || Array.isArray(value)
    || value.schemaId !== schemaId || value.modelId !== modelId || typeof value.resultSha256 !== "string") {
    throw new Error("Invalid Standard72 saved fitting result identity");
  }
  const { resultSha256, ...body } = value;
  if (await sha256CanonicalJsonHex(body) !== resultSha256) throw new Error("Saved fitting result digest differs");
  const reference = resolveMainWireFittingReferenceV1("baseline");
  if (canonicalJsonStringify(value.reference) !== canonicalJsonStringify(reference)
    || value.referenceIdentitySha256 !== await sha256CanonicalJsonHex(reference)
    || value.evaluation?.evaluatorId !== evaluatorId || value.evaluation.modelId !== modelId
    || value.evaluation.status !== "accepted" || value.evaluation.policyIdentitySha256 !== await policyIdentity()
    || value.evaluation.nominalDtSec !== .002 || value.evaluation.classification.status !== "period1-converged"
    || value.evaluation.executionPath !== "standard72-selected-output-projection"
    || value.evaluation.qualification.scope !== "periodic-rest-assessment"
    || value.evaluation.qualification.restStatus !== value.evaluation.rest.status
    || value.evaluation.qualification.pairedGridPressureRateAndTau !== "not-evaluated"
    || value.evaluation.qualification.preloadReserve !== "not-evaluated"
    || value.evaluation.qualification.clinicalValidationClaimed !== false
    || value.evaluation.qualification.postFitEnvelopeQualified !== false
    || value.evaluation.qualification.publicBaselinePromotionAuthorized !== false) {
    throw new Error("Saved fitting result reference, policy or evaluation context differs");
  }
  const candidate = value.evaluation.candidateInputs;
  await Session.restoreStandard72ExactCheckpoint(value.evaluation.checkpoint,
    candidate.hemodynamicResearchInputs, candidate.ventricularContractilityScale, undefined, candidate.mechanismResearchInputs);
  return value;
}
