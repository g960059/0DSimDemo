import {
  cloneAndFreezeCanonicalJson,
  sha256CanonicalJsonHex,
  type CanonicalJsonValue,
} from "@/engine/integrity";
import {
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_IDENTITY_V1,
} from "@/engine/myocardium/MainWireIntegratedModelStandard70CheckpointV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_BASELINE_VALIDATION_V1_ID,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelBaselineValidationV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_BASELINE_VALIDATION_V1_ID,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard70BaselineValidationV1";
import {
  buildMainWireBaselineConditioningAdmittedMatrixV1,
  buildMainWireBaselineConditioningCenterCandidateV1,
  verifyMainWireBaselineConditioningAuditV1,
} from "@/analysis/methods/mainWire/MainWireBaselineConditioningAuditV1";
import {
  verifyMainWireBaselineConditioningRefinedDerivativeAuditV1,
} from "@/analysis/methods/mainWire/MainWireBaselineConditioningRefinedDerivativeAuditV1";
import {
  verifyMainWireBaselineConditioningPerturbationAttributionV1,
} from "@/analysis/methods/mainWire/MainWireBaselineConditioningPerturbationAttributionV1";
import {
  verifyMainWireBaselineConditioningStageAuditV1,
} from "@/analysis/methods/mainWire/MainWireBaselineConditioningStageAuditV1";
import {
  MAIN_WIRE_STANDARD70_BASELINE_LOCAL_PROPOSAL_POLICY_V1,
  type MainWireStandard70BaselineLocalProposalInputV1,
  type MainWireStandard70BaselineLocalProposalObservationV1,
  type MainWireStandard70BaselineLocalProposalRowV1,
} from "@/analysis/methods/mainWire/MainWireStandard70BaselineLocalProposalV1";
import {
  readMainWireBaselineCalibrationParameterV1,
} from "@/analysis/policies/mainWire/MainWireBaselineCalibrationParametersV1";

export const MAIN_WIRE_STANDARD70_BASELINE_LOCAL_PROPOSAL_SOURCE_V1_ID =
  "main-wire-standard70-baseline-local-proposal-source-v1" as const;

const POLICY = MAIN_WIRE_STANDARD70_BASELINE_LOCAL_PROPOSAL_POLICY_V1;
const TBV = POLICY.coordinateIds[0];
const ACTIVE_TENSION = POLICY.coordinateIds[1];

export type MainWireStandard70BaselineLocalProposalSourceArtifactsV1 =
  Readonly<{
    coarseArtifact: unknown;
    refinedArtifact: unknown;
    perturbationAttributionArtifact: unknown;
    stageArtifact: unknown;
  }>;

type SourceContentV1 = Readonly<{
  sourceId: typeof MAIN_WIRE_STANDARD70_BASELINE_LOCAL_PROPOSAL_SOURCE_V1_ID;
  provenance: Readonly<{
    coarseArtifactIdentitySha256: string;
    refinedArtifactIdentitySha256: string;
    perturbationAttributionArtifactIdentitySha256: string;
    stageArtifactIdentitySha256: string;
    studyIdentitySha256: string;
    exactModelIdentitySha256: string;
    constructionPolicyIdentitySha256: string;
    objectiveAnalysisMethodId:
      typeof MAIN_WIRE_INTEGRATED_MODEL_BASELINE_VALIDATION_V1_ID;
    safetyAnalysisMethodId:
      typeof MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_BASELINE_VALIDATION_V1_ID;
    stagePolicyIdentitySha256: string;
  }>;
  context: Readonly<{
    conditionId: "rest-hr60";
    refinedNominalDtSec: number;
    centerCandidateIdentitySha256: string;
    centerRequestIdentitySha256: string;
    centerSourceCheckpointSha256: string;
  }>;
  coordinates: readonly [
    Readonly<{ parameterId: typeof TBV; centerValue: number }>,
    Readonly<{
      parameterId: typeof ACTIVE_TENSION;
      centerValue: number;
    }>,
  ];
  basis: MainWireStandard70BaselineLocalProposalInputV1["basis"];
  centerObservations:
    readonly MainWireStandard70BaselineLocalProposalObservationV1[];
  claim: Readonly<{
    sourceArtifactChainReconstructed: true;
    centerRecordReconstructedFromArtifact: true;
    targetEvaluated: false;
    exactReplayExecuted: false;
    refinedDtConvergenceClaimed: false;
    parameterSubsetAutomaticallySelected: false;
  }>;
}>;

export type MainWireStandard70BaselineLocalProposalSourceV1 =
  SourceContentV1 & Readonly<{ sourceIdentitySha256: string }>;

/**
 * Reconstructs the complete conditioning artifact chain once, then retains
 * only the admitted rest-HR60 TBV/active-tension basis and its exact center.
 * No target is evaluated and no proposal or replay claim is made here.
 */
export async function buildMainWireStandard70BaselineLocalProposalSourceV1(
  input: MainWireStandard70BaselineLocalProposalSourceArtifactsV1,
): Promise<MainWireStandard70BaselineLocalProposalSourceV1> {
  const owned = (
    cloneAndFreezeCanonicalJson<CanonicalJsonValue>(input)
  ) as unknown as MainWireStandard70BaselineLocalProposalSourceArtifactsV1;
  const coarse = await verifyMainWireBaselineConditioningAuditV1(
    owned.coarseArtifact,
  );
  const refined =
    await verifyMainWireBaselineConditioningRefinedDerivativeAuditV1(
      owned.refinedArtifact,
      coarse,
    );
  const attribution =
    await verifyMainWireBaselineConditioningPerturbationAttributionV1(
      owned.perturbationAttributionArtifact,
      coarse,
      refined,
    );
  const stage = await verifyMainWireBaselineConditioningStageAuditV1(
    owned.stageArtifact,
    coarse,
    refined,
    attribution,
  );

  const exactModelIdentitySha256 = await sha256CanonicalJsonHex(
    MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_IDENTITY_V1,
  );
  if (
    stage.source.exactModelIdentitySha256 !== exactModelIdentitySha256
    || refined.source.exactModelIdentitySha256 !== exactModelIdentitySha256
    || stage.source.constructionPolicyIdentitySha256
      !== refined.source.constructionPolicyIdentitySha256
  ) {
    throw new Error("local proposal source targets another exact contract");
  }

  const subset = uniquePairSubsetV1(stage.subsets);
  const primary = subset.operatingPointIdentification;
  const tolerance = primary.toleranceCompositions.find(({ compositionId }) =>
    compositionId === "maximum-component-primary");
  if (
    subset.compositionRobustnessStatus
      !== "supported-across-reported-compositions"
    || subset.primaryMaximumComponentResolutionStatus !== "supported"
    || primary.basisId !== POLICY.stageBasisId
    || primary.basisRole !== "primary-policy"
    || primary.completeInventoryRequiredForResolution !== true
    || primary.rowInventoryStatus !== "complete"
    || primary.missingCandidateRows.length !== 0
    || primary.candidateRowCount !== primary.commonAdmittedRowCount
    || primary.refinedSingularValues.length !== 2
    || tolerance?.practicalRank !== 2
    || tolerance.resolutionStatus !== "supported"
  ) {
    throw new Error("local proposal primary source basis is not admitted");
  }

  const expectedKeys = subset.identificationRows.map(({ conditionId, checkId }) =>
    rowKeyV1(conditionId, checkId));
  if (new Set(expectedKeys).size !== expectedKeys.length) {
    throw new Error("local proposal source rows are duplicated");
  }
  const expectedKeySet = new Set(expectedKeys);
  const admitted = buildMainWireBaselineConditioningAdmittedMatrixV1(
    refined.fineSensitivities.filter(({ conditionId, checkId }) =>
      expectedKeySet.has(rowKeyV1(conditionId, checkId))),
    POLICY.coordinateIds,
  );
  const admittedByKey = new Map(admitted.rows.map((row) =>
    [rowKeyV1(row.conditionId, row.checkId), row] as const));
  if (
    admitted.coordinateIds.join("::") !== POLICY.coordinateIds.join("::")
    || admitted.candidateRowCount !== expectedKeys.length
    || admitted.excludedRows.length !== 0
    || admitted.rows.length !== expectedKeys.length
    || admittedByKey.size !== expectedKeys.length
  ) {
    throw new Error("local proposal admitted source rows are incomplete");
  }

  const centerEvaluations = refined.fineEvaluations.filter(({ taskResult }) =>
    taskResult.task.conditionId === POLICY.conditionId
    && taskResult.task.coordinateId === null);
  if (centerEvaluations.length !== 1) {
    throw new Error("local proposal refined center is not unique");
  }
  const centerEvaluation = centerEvaluations[0]!;
  const center = centerEvaluation.taskResult;
  if (
    centerEvaluation.nominalDtSec !== refined.source.refinedNominalDtSec
    || center.evaluationStatus !== "accepted"
    || center.classificationStatus !== "period1-converged"
    || center.constructionGateStatus !== "passed"
    || center.objectiveGateStatus !== "passed"
    || center.safetySentinelStatus !== "passed"
    || center.failedConstructionCheckIds.length !== 0
    || center.failedObjectiveCheckIds.length !== 0
    || center.failedSafetySentinelCheckIds.length !== 0
    || center.requestIdentitySha256 === null
    || center.sourceCheckpointSha256 === null
  ) {
    throw new Error("local proposal refined center is not qualified");
  }
  const centerCheckByKey = new Map(center.checks.map((check) =>
    [rowKeyV1(POLICY.conditionId, check.checkId), check] as const));
  if (centerCheckByKey.size !== center.checks.length) {
    throw new Error("local proposal center checks are duplicated");
  }

  const rows: MainWireStandard70BaselineLocalProposalRowV1[] = [];
  const centerObservations:
    MainWireStandard70BaselineLocalProposalObservationV1[] = [];
  for (const key of expectedKeys) {
    const admittedRow = admittedByKey.get(key);
    const check = centerCheckByKey.get(key);
    if (
      admittedRow === undefined
      || check === undefined
      || admittedRow.halfStepRow.length !== 2
      || admittedRow.unit !== check.unit
      || admittedRow.constructionCorridorWidth
        !== check.maximum - check.minimum
    ) {
      throw new Error(`local proposal source row differs: ${key}`);
    }
    rows.push(Object.freeze({
      conditionId: POLICY.conditionId,
      checkId: check.checkId,
      unit: check.unit,
      minimum: check.minimum,
      maximum: check.maximum,
      weightDivisor: admittedRow.weightDivisor,
      halfStepNormalizedDerivatives: Object.freeze([
        admittedRow.halfStepRow[0]!,
        admittedRow.halfStepRow[1]!,
      ] as const),
    }));
    centerObservations.push(Object.freeze({
      conditionId: POLICY.conditionId,
      checkId: check.checkId,
      unit: check.unit,
      minimum: check.minimum,
      maximum: check.maximum,
      actual: check.actual,
    }));
  }

  const centerCandidate =
    buildMainWireBaselineConditioningCenterCandidateV1(POLICY.conditionId);
  const content = (
    cloneAndFreezeCanonicalJson<CanonicalJsonValue>({
      sourceId: MAIN_WIRE_STANDARD70_BASELINE_LOCAL_PROPOSAL_SOURCE_V1_ID,
      provenance: {
        coarseArtifactIdentitySha256: await sha256CanonicalJsonHex(coarse),
        refinedArtifactIdentitySha256: await sha256CanonicalJsonHex(refined),
        perturbationAttributionArtifactIdentitySha256:
          await sha256CanonicalJsonHex(attribution),
        stageArtifactIdentitySha256: await sha256CanonicalJsonHex(stage),
        studyIdentitySha256: stage.source.studyIdentitySha256,
        exactModelIdentitySha256,
        constructionPolicyIdentitySha256:
          stage.source.constructionPolicyIdentitySha256,
        objectiveAnalysisMethodId:
          MAIN_WIRE_INTEGRATED_MODEL_BASELINE_VALIDATION_V1_ID,
        safetyAnalysisMethodId:
          MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_BASELINE_VALIDATION_V1_ID,
        stagePolicyIdentitySha256: stage.stagePolicy.policyIdentitySha256,
      },
      context: {
        conditionId: POLICY.conditionId,
        refinedNominalDtSec: refined.source.refinedNominalDtSec,
        centerCandidateIdentitySha256:
          await sha256CanonicalJsonHex(centerCandidate),
        centerRequestIdentitySha256: center.requestIdentitySha256,
        centerSourceCheckpointSha256: center.sourceCheckpointSha256,
      },
      coordinates: [
        {
          parameterId: TBV,
          centerValue: readMainWireBaselineCalibrationParameterV1(
            centerCandidate,
            TBV,
          ),
        },
        {
          parameterId: ACTIVE_TENSION,
          centerValue: readMainWireBaselineCalibrationParameterV1(
            centerCandidate,
            ACTIVE_TENSION,
          ),
        },
      ],
      basis: {
        basisId: POLICY.stageBasisId,
        basisRole: "primary-policy",
        rowInventoryStatus: "complete",
        compositionRobustnessStatus:
          "supported-across-reported-compositions",
        practicalRank: 2,
        practicalRankTolerance: tolerance.practicalRankTolerance,
        refinedSingularValues: [
          primary.refinedSingularValues[0]!,
          primary.refinedSingularValues[1]!,
        ],
        rows,
      },
      centerObservations,
      claim: {
        sourceArtifactChainReconstructed: true,
        centerRecordReconstructedFromArtifact: true,
        targetEvaluated: false,
        exactReplayExecuted: false,
        refinedDtConvergenceClaimed: false,
        parameterSubsetAutomaticallySelected: false,
      },
    })
  ) as unknown as SourceContentV1;
  return Object.freeze({
    ...content,
    sourceIdentitySha256: await sha256CanonicalJsonHex(content),
  });
}

function uniquePairSubsetV1(
  subsets: Awaited<ReturnType<
    typeof verifyMainWireBaselineConditioningStageAuditV1
  >>["subsets"],
) {
  const key = POLICY.coordinateIds.join("::");
  const matches = subsets.filter(({ coordinateIds }) =>
    coordinateIds.join("::") === key);
  if (matches.length !== 1) {
    throw new Error("local proposal source coordinate pair is not unique");
  }
  return matches[0]!;
}

function rowKeyV1(conditionId: string, checkId: string): string {
  return `${conditionId}::${checkId}`;
}
