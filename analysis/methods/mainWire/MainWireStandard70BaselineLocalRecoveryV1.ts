import {
  cloneAndFreezeCanonicalJson,
  sha256CanonicalJsonHex,
  type CanonicalJsonValue,
} from "@/engine/integrity";
import {
  resolveMainWireFittingReferenceV1,
} from "@/analysis/registry/MainWireFittingReferenceRegistryV1";
import {
  buildMainWireStandard70BaselineLocalProposalSourceV1,
  type MainWireStandard70BaselineLocalProposalSourceArtifactsV1,
  type MainWireStandard70BaselineLocalProposalSourceV1,
} from "./MainWireStandard70BaselineLocalProposalSourceV1";
import {
  buildMainWireStandard70BaselineLocalProposalV1,
  MAIN_WIRE_STANDARD70_BASELINE_LOCAL_PROPOSAL_POLICY_V1,
  type MainWireStandard70BaselineLocalProposalObservationV1,
} from "./MainWireStandard70BaselineLocalProposalV1";
import {
  buildMainWireStandard70BaselineCalibrationRequestIdentityV1,
  evaluateMainWireStandard70BaselineCalibrationCandidateV1,
  type MainWireStandard70BaselineCalibrationAcceptedEvaluationV1,
  type MainWireStandard70BaselineCalibrationEvaluationV1,
} from "./MainWireStandard70BaselineCalibrationEvaluatorV1";
import {
  applyMainWireBaselineCalibrationParametersV1,
  mainWireBaselineCalibrationParameterIsOnReleaseLatticeV1,
  mainWireBaselineCalibrationParameterV1,
  readMainWireBaselineCalibrationParameterV1,
  type MainWireBaselineCalibrationCandidateInputsV1,
} from "@/analysis/policies/mainWire/MainWireBaselineCalibrationParametersV1";

const POLICY = MAIN_WIRE_STANDARD70_BASELINE_LOCAL_PROPOSAL_POLICY_V1;

export type MainWireStandard70BaselineLocalRecoveryRequestV1 = Readonly<{
  referenceId: "baseline";
  sourceArtifacts: MainWireStandard70BaselineLocalProposalSourceArtifactsV1;
  syntheticTruthValues: readonly [number, number];
}>;

/**
 * One executable synthetic control, not an optimizer or a baseline selection.
 * The evaluator is called directly, so no second serialized-target verifier
 * is needed. Only the existing two-coordinate local proposal is replayed.
 */
export async function runMainWireStandard70BaselineLocalRecoveryV1(
  request: MainWireStandard70BaselineLocalRecoveryRequestV1,
  onProgress?: (stage: "source" | "target" | "proposal" | "replay") => void,
) {
  const owned = (
    cloneAndFreezeCanonicalJson<CanonicalJsonValue>(request)
  ) as unknown as MainWireStandard70BaselineLocalRecoveryRequestV1;
  const reference = resolveMainWireFittingReferenceV1(owned.referenceId);
  const center = reference.selectedConstruction.candidateInputs;
  assertLocalTruthV1(owned.syntheticTruthValues, center);
  onProgress?.("source");
  const source = await buildMainWireStandard70BaselineLocalProposalSourceV1(
    owned.sourceArtifacts,
  );
  if (await sha256CanonicalJsonHex(center)
      !== source.context.centerCandidateIdentitySha256) {
    throw new Error("local recovery reference and source center differ");
  }
  const common = Object.freeze({
    runId: "main-wire-standard70-baseline-local-recovery-v1" as const,
    referenceId: reference.referenceId,
    referenceIdentitySha256: await sha256CanonicalJsonHex(reference),
    modelId: reference.selectedConstruction.modelId,
    sourceIdentitySha256: source.sourceIdentitySha256,
    nominalDtSec: source.context.refinedNominalDtSec,
    syntheticTruthValues: owned.syntheticTruthValues,
    claim: Object.freeze({
      sourceArtifactChainReconstructed: true as const,
      syntheticControlOnly: true as const,
      optimizerExecuted: false as const,
      postFitEnvelopeQualified: false as const,
      parameterUniquenessClaimed: false as const,
      presetOrCaseFittingQualified: false as const,
    }),
  });
  const truth = candidateV1(center, owned.syntheticTruthValues);
  onProgress?.("target");
  const target = await evaluateColdV1(truth, source);
  if (!allGatesPassedV1(target)) {
    return Object.freeze({
      ...common, status: "stopped" as const, stoppedAt: "target" as const,
      target: summaryV1(target),
    });
  }
  const targetObservations = observationsV1(target, source);
  onProgress?.("proposal");
  const proposal = await buildMainWireStandard70BaselineLocalProposalV1({
    source: source.provenance,
    target: {
      exactModelIdentitySha256: target.exactModelIdentitySha256,
      constructionPolicyIdentitySha256: target.constructionPolicyIdentitySha256,
      objectiveAnalysisMethodId: target.objectiveAnalysisMethodId,
      safetyAnalysisMethodId: target.safetyAnalysisMethodId,
      requestIdentitySha256: target.requestIdentitySha256,
      initializationKind: "cold",
      constructionGateStatus: target.constructionGateStatus,
      objectiveGateStatus: target.objectiveGateStatus,
      safetySentinelStatus: target.safetySentinelStatus,
      failedConstructionCheckIds: target.failedConstructionCheckIds,
      failedObjectiveCheckIds: target.failedObjectiveCheckIds,
      failedSafetySentinelCheckIds: target.failedSafetySentinelCheckIds,
    },
    coordinates: [
      { ...source.coordinates[0], syntheticTruthValue: owned.syntheticTruthValues[0] },
      { ...source.coordinates[1], syntheticTruthValue: owned.syntheticTruthValues[1] },
    ],
    basis: source.basis,
    centerObservations: source.centerObservations,
    targetObservations,
  });
  if (proposal.status === "refused") {
    return Object.freeze({
      ...common, status: "stopped" as const, stoppedAt: "proposal" as const,
      target: summaryV1(target), proposal,
    });
  }
  const replayCandidate = candidateV1(center,
    proposal.coordinates.map(({ projectedValue }) => projectedValue));
  onProgress?.("replay");
  const replay = await evaluateColdV1(replayCandidate, source);
  if (!allGatesPassedV1(replay)) {
    return Object.freeze({
      ...common, status: "stopped" as const, stoppedAt: "replay" as const,
      target: summaryV1(target), proposal, replay: summaryV1(replay),
    });
  }
  const replayObservations = observationsV1(replay, source);
  const rows = source.basis.rows.map((row, index) => {
    const targetActual = targetObservations[index]!.actual;
    const replayActual = replayObservations[index]!.actual;
    return Object.freeze({
      checkId: row.checkId, unit: row.unit, targetActual, replayActual,
      normalizedDifference: (replayActual - targetActual)
        / (row.maximum - row.minimum) / row.weightDivisor,
    });
  });
  return Object.freeze({
    ...common, status: "replayed" as const,
    target: summaryV1(target), proposal, replay: summaryV1(replay),
    comparison: Object.freeze({
      rows: Object.freeze(rows),
      maximumAbsoluteNormalizedDifference: Math.max(
        ...rows.map(({ normalizedDifference }) => Math.abs(normalizedDifference)),
      ),
      // Same-dt replay is not a convergence or candidate-specific noise bound.
      numericalFloorOrUncertaintyClaimed: false as const,
    }),
  });
}

function assertLocalTruthV1(
  values: readonly number[],
  center: MainWireBaselineCalibrationCandidateInputsV1,
): void {
  if (values.length !== 2) throw new Error("local recovery requires two coordinates");
  for (const [index, parameterId] of POLICY.coordinateIds.entries()) {
    const value = values[index]!;
    const centerValue = readMainWireBaselineCalibrationParameterV1(center, parameterId);
    const descriptor = mainWireBaselineCalibrationParameterV1(parameterId);
    if (!mainWireBaselineCalibrationParameterIsOnReleaseLatticeV1(parameterId, value)) {
      throw new Error("local recovery truth is off the release lattice");
    }
    const steps = Math.round((value - centerValue) / descriptor.finiteDifferenceStep);
    if (Math.abs(steps) > POLICY.maximumSyntheticTruthOffsetInReleaseSteps) {
      throw new Error("local recovery truth is outside the local radius");
    }
  }
}

function candidateV1(
  center: MainWireBaselineCalibrationCandidateInputsV1,
  values: readonly number[],
) {
  return applyMainWireBaselineCalibrationParametersV1(center,
    POLICY.coordinateIds.map((parameterId, index) => ({
      parameterId, value: values[index]!,
    })));
}

async function evaluateColdV1(
  candidate: MainWireBaselineCalibrationCandidateInputsV1,
  source: MainWireStandard70BaselineLocalProposalSourceV1,
) {
  const request = Object.freeze({
    ...candidate,
    nominalDtSec: source.context.refinedNominalDtSec,
    initialization: Object.freeze({ kind: "cold" as const }),
  });
  const result = await evaluateMainWireStandard70BaselineCalibrationCandidateV1(request);
  if (result.status === "accepted") {
    const expectedRequest = await buildMainWireStandard70BaselineCalibrationRequestIdentityV1({
      ...request,
      constructionPolicyIdentitySha256: source.provenance.constructionPolicyIdentitySha256,
    });
    if (
      result.requestIdentitySha256 !== expectedRequest
      || result.nominalDtSec !== request.nominalDtSec
      || result.initializationKind !== "cold"
      || result.exactResult.nominalDtSec !== request.nominalDtSec
      || result.exactResult.initializationKind !== "cold"
      || result.exactResult.classification.status !== "period1-converged"
      || result.exactModelIdentitySha256 !== source.provenance.exactModelIdentitySha256
      || result.constructionPolicyIdentitySha256
        !== source.provenance.constructionPolicyIdentitySha256
      || result.objectiveAnalysisMethodId !== source.provenance.objectiveAnalysisMethodId
      || result.safetyAnalysisMethodId !== source.provenance.safetyAnalysisMethodId
    ) throw new Error("local recovery evaluator context differs from source/request");
  }
  return result;
}

function allGatesPassedV1(
  result: MainWireStandard70BaselineCalibrationEvaluationV1,
): result is MainWireStandard70BaselineCalibrationAcceptedEvaluationV1 {
  return result.status === "accepted"
    && result.constructionGateStatus === "passed"
    && result.objectiveGateStatus === "passed"
    && result.safetySentinelStatus === "passed"
    && result.failedConstructionCheckIds.length === 0
    && result.failedObjectiveCheckIds.length === 0
    && result.failedSafetySentinelCheckIds.length === 0;
}

function observationsV1(
  result: MainWireStandard70BaselineCalibrationAcceptedEvaluationV1,
  source: MainWireStandard70BaselineLocalProposalSourceV1,
): readonly MainWireStandard70BaselineLocalProposalObservationV1[] {
  const checks = new Map(result.objectiveChecks.map((check) => [check.checkId, check]));
  if (checks.size !== result.objectiveChecks.length) {
    throw new Error("local recovery objective checks are duplicated");
  }
  return Object.freeze(source.basis.rows.map((row) => {
    const check = checks.get(row.checkId);
    if (check === undefined || check.unit !== row.unit
      || check.minimum !== row.minimum || check.maximum !== row.maximum
      || !Number.isFinite(check.actual)) {
      throw new Error(`local recovery observation differs: ${row.checkId}`);
    }
    return Object.freeze({
      conditionId: row.conditionId, checkId: row.checkId,
      unit: check.unit, minimum: check.minimum, maximum: check.maximum,
      actual: check.actual,
    });
  }));
}

function summaryV1(result: MainWireStandard70BaselineCalibrationEvaluationV1) {
  if (result.status !== "accepted") return result;
  const { exactResult, objectiveChecks: _objective, safetySentinelChecks: _safety,
    ...summary } = result;
  return Object.freeze({
    ...summary,
    completedCycleCount: exactResult.completedCycleCount,
    classificationStatus: exactResult.classification.status,
    checkpointSha256: exactResult.checkpoint.checkpointSha256,
  });
}
