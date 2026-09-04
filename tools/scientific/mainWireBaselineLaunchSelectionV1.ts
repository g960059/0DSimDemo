import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { canonicalJsonStringify, sha256CanonicalJsonHex } from "@/engine/integrity";
import { MAIN_WIRE_BASELINE_OPERATING_POINT_DESIGN_V1 as policy,
  scoreMainWireBaselineOperatingPointV1 } from "@/analysis/methods/mainWire/MainWireBaselineOperatingPointDesignV1";
import { buildMainWireStandard70BaselineCalibrationConstructionPolicyIdentityV1,
  buildMainWireStandard70BaselineCalibrationRequestIdentityV1, initializationIdentityV1,
  type MainWireStandard70BaselineCalibrationEvaluationRequestV1,
  type MainWireStandard70BaselineCalibrationEvaluationV1 } from
  "@/analysis/methods/mainWire/MainWireStandard70BaselineCalibrationEvaluatorV1";
import { MainWireIntegratedModelStandard70TypedAuthoritySessionV1 } from
  "@/engine/vnext/MainWireIntegratedModelStandard70TypedAuthoritySessionV1";
import { MAIN_WIRE_NUMERICAL_BASE_TICK_SEC_V1 } from "@/engine/executionPlan/MainWireNumericalClockV1";
import { buildMainWireIntegratedStudioStandard70BaselineValidationV2 } from
  "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioStandard70BaselineValidationV1";
import { validateDesignQualificationResultV1, qualifyMeasuredDesignReserveV1,
  reserveCandidateIdentityV1, designReservePolicyV1 } from "./mainWireBaselineDesignExecutionV1";
import descriptor from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioAlgebraicPulmonaryRootExactModelV1.client.json";

/** Select only the declared four-mode finalist; paths are derived, never supplied by evidence. */
export function requireQualifiedBaselineLaunchSelectionV1(result: any, heartRateBpm: number) {
  const index = result?.qualifiedCandidateIndex;
  const modes = ["refined", "reserve", heartRateBpm === 60 ? "hr70" : "hr60", "cold"];
  const rows = result?.qualificationResults?.filter((row: any) => row.index === index);
  if (![60, 70].includes(heartRateBpm) || !Number.isInteger(index) || index < 0
    || result.baselineAdopted !== false || !/^[0-9a-f]{40}$/.test(result.executionCommit)
    || rows?.length !== 1 || rows[0].qualified !== true || rows[0].modes?.length !== modes.length
    || modes.some((mode) => rows[0].modes.filter((row: any) => row.mode === mode
      && row.qualified === true && row.resultPath === `${index}.qualification-${mode}.json`).length !== 1)) {
    throw new Error("launch selection requires one complete qualified refined/reserve/rate/cold finalist");
  }
  return { index: index as number, modes, executionCommit: result.executionCommit as string };
}

/** Generate launch metadata from verified evidence; never mint or modify an exact artifact. */
export async function prepareMainWireBaselineLaunchV1(directory: string, baselineId: string) {
  if (!baselineId.trim()) throw new Error("baseline ID is required");
  const evidenceFiles: { path: string; sha256: string }[] = [];
  const read = async (name: string) => {
    const path = resolve(directory, name);
    const value = JSON.parse(await readFile(path, "utf8"));
    evidenceFiles.push({ path, sha256: await sha256CanonicalJsonHex(value) });
    return value;
  };
  const result = await read("result.json");
  const index = result?.qualifiedCandidateIndex;
  if (!Number.isInteger(index) || index < 0) throw new Error("missing qualified candidate");
  const request = await read(`${index}.request.json`) as MainWireStandard70BaselineCalibrationEvaluationRequestV1;
  if (!request.hemodynamicResearchInputs || !request.mechanismResearchInputs || request.ventricularContractilityScale !== 1) {
    throw new Error("launch requires explicit candidate inputs and no hidden contractility multiplier");
  }
  const selection = requireQualifiedBaselineLaunchSelectionV1(result, request.hemodynamicResearchInputs.heartRateBpm);
  if (result.policyIdentity !== await sha256CanonicalJsonHex(policy)) throw new Error("stale launch qualification policy");
  const candidateInputs = { hemodynamicResearchInputs: request.hemodynamicResearchInputs,
    mechanismResearchInputs: request.mechanismResearchInputs, ventricularContractilityScale: 1 };
  const candidateIdentitySha256 = await sha256CanonicalJsonHex(candidateInputs);
  const evaluation = await read(`${index}.result.json`) as MainWireStandard70BaselineCalibrationEvaluationV1;
  const construction = await buildMainWireStandard70BaselineCalibrationConstructionPolicyIdentityV1();
  if (evaluation.status !== "accepted" || !scoreMainWireBaselineOperatingPointV1(evaluation).feasible
    || evaluation.nominalDtSec !== 0.002 || evaluation.constructionPolicyIdentitySha256 !== construction.constructionPolicyIdentitySha256
    || evaluation.requestIdentitySha256 !== await buildMainWireStandard70BaselineCalibrationRequestIdentityV1({
      ...candidateInputs, ...construction, nominalDtSec: request.nominalDtSec ?? 0.002,
      initialization: initializationIdentityV1(request.initialization ?? { kind: "cold" }),
    })) throw new Error("nominal launch evaluation is not bound to its current request and policy");
  const launchSession = await MainWireIntegratedModelStandard70TypedAuthoritySessionV1.restoreStandard70ExactCheckpoint(
    evaluation.exactResult.checkpoint, candidateInputs.hemodynamicResearchInputs, 1, undefined, candidateInputs.mechanismResearchInputs);
  const measuredReserve = qualifyMeasuredDesignReserveV1(await read(`${index}.reserve.json`), {
    sourceCheckpointSha256: evaluation.exactResult.checkpoint.checkpointSha256,
    candidateIdentitySha256: await reserveCandidateIdentityV1(candidateInputs, 0.002),
    reservePolicyIdentity: await sha256CanonicalJsonHex(designReservePolicyV1),
    sourceGlobalTbvMl: candidateInputs.hemodynamicResearchInputs.totalBloodVolumeMl,
  });
  const qualified: Record<string, any> = {};
  for (const mode of selection.modes) {
    const record = await read(`${index}.qualification-${mode}.json`);
    if (!validateDesignQualificationResultV1(record, { mode, executionCommit: selection.executionCommit,
      sourceRequestPath: resolve(directory, `${index}.request.json`),
      sourceEvaluationPath: resolve(directory, `${index}.result.json`) }, { evaluation, candidateIdentitySha256 })) {
      throw new Error(`launch condition ${mode} did not pass`);
    }
    const condition = { ...candidateInputs.hemodynamicResearchInputs,
      ...(mode === "hr60" ? { heartRateBpm: 60 } : mode === "hr70" ? { heartRateBpm: 70 } : {}) };
    if (canonicalJsonStringify(record.conditionHemodynamicResearchInputs) !== canonicalJsonStringify(condition)
      || record.evaluation.nominalDtSec !== (mode === "refined" ? 0.001 : 0.002)) {
      throw new Error(`launch condition ${mode} does not bind the candidate or dt`);
    }
    // Restore validates the checkpoint against actual inputs/clock, not just file names or claims.
    await MainWireIntegratedModelStandard70TypedAuthoritySessionV1.restoreStandard70ExactCheckpoint(
      record.evaluation.exactResult.checkpoint, condition, 1, undefined, candidateInputs.mechanismResearchInputs);
    qualified[mode] = record;
  }
  const quality = qualified.refined.pressureRateQuality;
  if (canonicalJsonStringify(measuredReserve) !== canonicalJsonStringify(qualified.reserve.reserve)) {
    throw new Error("final reserve does not match its bound source measurement");
  }
  if (quality.grids.coarse.checkpointSha256 !== evaluation.exactResult.checkpoint.checkpointSha256
    || quality.grids.coarse.candidateIdentitySha256 !== candidateIdentitySha256
    || quality.grids.fine.candidateIdentitySha256 !== candidateIdentitySha256) throw new Error("unbound refined source");
  const validationReport = buildMainWireIntegratedStudioStandard70BaselineValidationV2(
    evaluation.exactResult, qualified.reserve.reserve, quality);
  const sourceCheckpoint = evaluation.exactResult.checkpoint;
  // HR70 complete-cycle boundaries need not lie on the live plan's 2-ms grid.
  // Integrate a real short step; never relabel a checkpoint's accepted clock.
  const targetTimeSec = Math.ceil(sourceCheckpoint.acceptedTimeSec / MAIN_WIRE_NUMERICAL_BASE_TICK_SEC_V1)
    * MAIN_WIRE_NUMERICAL_BASE_TICK_SEC_V1;
  if (targetTimeSec > sourceCheckpoint.acceptedTimeSec) {
    const advance = launchSession.advanceStructuralAnalysisToPresentationTimeV1(targetTimeSec);
    if (advance.status !== "advanced" || advance.acceptedTimeSec !== targetTimeSec) {
      throw new Error("launch grid preparation failed");
    }
  }
  const checkpoint = await launchSession.checkpointStandard70Exact();
  if (canonicalJsonStringify(checkpoint.baseStandardCheckpointV2.completedBeatMetrics)
    !== canonicalJsonStringify(sourceCheckpoint.baseStandardCheckpointV2.completedBeatMetrics)) {
    throw new Error("launch preparation changed the qualified completed beat");
  }
  return { schemaId: "circleheart-standard70-launch-baseline-v1", baselineId,
    modelId: descriptor.manifest.modelId, candidateInputs,
    // Research restarts at a complete-cycle boundary; live starts at a base tick.
    // Retain both actual states rather than relabelling either owner's clock.
    qualificationCheckpoint: sourceCheckpoint,
    capture: { fixture: { ...descriptor.defaultFixture,
      hemodynamicResearchInputs: candidateInputs.hemodynamicResearchInputs,
      mechanismResearchInputs: candidateInputs.mechanismResearchInputs }, checkpoint: {
      acceptedRevision: checkpoint.revision, acceptedTimeSec: checkpoint.acceptedTimeSec, payload: checkpoint } },
    validationReport, provenance: { candidateIdentitySha256, executionCommit: selection.executionCommit,
      launchPreparation: { sourceCheckpointSha256: sourceCheckpoint.checkpointSha256,
        sourceAcceptedTimeSec: sourceCheckpoint.acceptedTimeSec,
        targetCheckpointSha256: checkpoint.checkpointSha256, targetAcceptedTimeSec: checkpoint.acceptedTimeSec,
        advancedDurationSec: checkpoint.acceptedTimeSec - sourceCheckpoint.acceptedTimeSec,
        completedBeatUnchanged: true },
      qualificationPolicyIdentity: result.policyIdentity,
      qualificationEvidencePaths: evidenceFiles.map(({ path }) => path), evidenceFiles,
      clinicalValidationClaimed: false } };
}
