import normalReferenceEvidenceV1 from
  "@/data/physiology/main-wire-normal-reference-evidence-v1.json";
import {
  canonicalJsonStringify,
  sha256CanonicalJsonHex,
} from "@/engine/integrity";
import {
  buildMainWireBaselineConditioningAdmittedMatrixV1,
  buildMainWireBaselineConditioningSingularValuesV1,
  verifyMainWireBaselineConditioningAuditV1,
  type MainWireBaselineConditioningSensitivityV1,
} from "@/analysis/methods/mainWire/MainWireBaselineConditioningAuditV1";
import {
  verifyMainWireBaselineConditioningRefinedDerivativeAuditV1,
  type MainWireBaselineConditioningRefinedDerivativeSubsetV1,
} from "@/analysis/methods/mainWire/MainWireBaselineConditioningRefinedDerivativeAuditV1";
import {
  verifyMainWireBaselineConditioningPerturbationAttributionV1,
  type MainWireBaselineConditioningPerturbationRowAttributionV1,
  type MainWireBaselineConditioningPerturbationSubsetAttributionV1,
} from "@/analysis/methods/mainWire/MainWireBaselineConditioningPerturbationAttributionV1";
import {
  compileMainWireBaselineCalibrationStagePolicyV1,
  type MainWireBaselineCalibrationStagePolicyV1,
} from "@/analysis/policies/mainWire/MainWireBaselineCalibrationStagePolicyV1";
import type {
  MainWireBaselineCalibrationParameterIdV1,
} from "@/analysis/policies/mainWire/MainWireBaselineCalibrationParametersV1";

export const MAIN_WIRE_BASELINE_CONDITIONING_STAGE_AUDIT_V1_ID =
  "main-wire-baseline-conditioning-stage-audit-v1" as const;

type PerturbationNormsV1 = Readonly<{
  coarseStepHalving: number;
  refinedStepHalving: number;
  coarseRefinedDerivative: number;
}>;

type ExpectedRowV1 = Readonly<{
  conditionId: string;
  checkId: string;
}>;

export type MainWireBaselineConditioningToleranceCompositionV1 = Readonly<{
  compositionId:
    | "maximum-component-primary"
    | "root-sum-square-components-stress-reference"
    | "additive-components-stress-reference";
  practicalRankTolerance: number;
  practicalRank: number;
  singularValueRatiosToPracticalTolerance: readonly (number | null)[];
  smallestSingularValueToTolerance: number | null;
  practicalConditionNumber: number | null;
  resolutionStatus: "supported" | "deficient" | "unresolved";
}>;

export type MainWireBaselineConditioningStageBasisV1 = Readonly<{
  basisId:
    | "source-all-common"
    | "all-conditions-operating-point-groups"
    | "rest-conditions-all-groups"
    | "rest-operating-point-identification";
  basisRole:
    | "source-verdict"
    | "restriction-attribution"
    | "primary-policy";
  completeInventoryRequiredForResolution: boolean;
  candidateRowCount: number;
  commonAdmittedRowCount: number;
  rowInventoryStatus: "complete" | "incomplete";
  missingCandidateRows: readonly ExpectedRowV1[];
  aggregate: PerturbationNormsV1 & Readonly<{
    refinedHalfStepSignalFrobeniusNorm: number;
  }>;
  refinedSingularValues: readonly number[];
  numericalRank: number;
  numericalRankTolerance: number;
  numericalConditionNumber: number | null;
  toleranceCompositions:
    readonly MainWireBaselineConditioningToleranceCompositionV1[];
  columnNorms: Readonly<Record<string, number>>;
  columnCosines: readonly Readonly<{
    leftCoordinateId: MainWireBaselineCalibrationParameterIdV1;
    rightCoordinateId: MainWireBaselineCalibrationParameterIdV1;
    cosine: number | null;
  }>[];
}>;

export type MainWireBaselineConditioningIdentificationRowV1 =
  PerturbationNormsV1 & Readonly<{
    conditionId: string;
    observationGroupId: string;
    checkId: string;
    refinedHalfStepSignalNorm: number;
    worstPerturbationNorm: number;
    signalToWorstPerturbationRatio: number | null;
  }>;

export type MainWireBaselineConditioningObservationGroupDiagnosticV1 =
  PerturbationNormsV1 & Readonly<{
    observationGroupId: string;
    rowCount: number;
    refinedHalfStepSignalFrobeniusNorm: number;
    refinedHalfStepSignalSquaredShare: number | null;
  }>;

export type MainWireBaselineConditioningStageSubsetV1 = Readonly<{
  coordinateIds: readonly MainWireBaselineCalibrationParameterIdV1[];
  sourceResolutionStatus: "supported" | "deficient";
  sourceAllRows: MainWireBaselineConditioningStageBasisV1;
  allConditionsOperatingPointGroups:
    MainWireBaselineConditioningStageBasisV1;
  restConditionsAllGroups: MainWireBaselineConditioningStageBasisV1;
  operatingPointIdentification: MainWireBaselineConditioningStageBasisV1;
  gateOnlyCommonRowCount: number;
  identificationRows:
    readonly MainWireBaselineConditioningIdentificationRowV1[];
  identificationByObservationGroup:
    readonly MainWireBaselineConditioningObservationGroupDiagnosticV1[];
  primaryMaximumComponentResolutionStatus:
    "supported" | "deficient" | "unresolved";
  compositionRobustnessStatus:
    | "supported-across-reported-compositions"
    | "composition-sensitive"
    | "deficient"
    | "unresolved";
}>;

export type MainWireBaselineConditioningStageAuditV1 = Readonly<{
  auditId: typeof MAIN_WIRE_BASELINE_CONDITIONING_STAGE_AUDIT_V1_ID;
  status: "completed";
  source: Readonly<{
    coarseAuditId: string;
    coarseArtifactIdentitySha256: string;
    refinedAuditId: string;
    refinedArtifactIdentitySha256: string;
    perturbationAttributionAuditId: string;
    perturbationAttributionArtifactIdentitySha256: string;
    studyIdentitySha256: string;
    exactModelIdentitySha256: string;
    constructionPolicyIdentitySha256: string;
  }>;
  stagePolicy: Readonly<{
    policyIdentitySha256: string;
    observationInventoryIdentitySha256: string;
    policy: MainWireBaselineCalibrationStagePolicyV1;
  }>;
  subsets: readonly MainWireBaselineConditioningStageSubsetV1[];
  summary: Readonly<{
    sourceAllRowsDeficientDeclaredPairCoordinateSubsets:
      readonly (readonly MainWireBaselineCalibrationParameterIdV1[])[];
    primaryMaximumComponentSupportedDeclaredPairCoordinateSubsets:
      readonly (readonly MainWireBaselineCalibrationParameterIdV1[])[];
    primarySupportedAcrossReportedCompositionsDeclaredPairCoordinateSubsets:
      readonly (readonly MainWireBaselineCalibrationParameterIdV1[])[];
    primaryCompositionSensitiveDeclaredPairCoordinateSubsets:
      readonly (readonly MainWireBaselineCalibrationParameterIdV1[])[];
    primaryVerdictDiffersFromSourceAllRowsDeclaredPairCoordinateSubsets:
      readonly (readonly MainWireBaselineCalibrationParameterIdV1[])[];
  }>;
  claim: Readonly<{
    localNumericalResolutionOnly: true;
    rolePolicyRetrospectivelyAppliedToExistingSources: true;
    reportedToleranceStressReferencesAreNotErrorBounds: true;
    confirmatoryRoleSelectionClaimed: false;
    parameterFittingExecuted: false;
    parameterSubsetAutomaticallySelected: false;
    parameterUniquenessClaimed: false;
    independentObservationCountClaimed: false;
    measurementCovarianceApplied: false;
    inferenceOrPredictionUncertaintyClaimed: false;
    qualificationGatesRemoved: false;
    fitMayOverrideModelFormFailure: false;
    rightHeartOrPulmonaryFitClaimed: false;
  }>;
}>;

export async function buildMainWireBaselineConditioningStageAuditV1(
  coarseInput: unknown,
  refinedInput: unknown,
  attributionInput: unknown,
): Promise<MainWireBaselineConditioningStageAuditV1> {
  const coarse = await verifyMainWireBaselineConditioningAuditV1(coarseInput);
  const refined =
    await verifyMainWireBaselineConditioningRefinedDerivativeAuditV1(
      refinedInput,
      coarse,
    );
  const attribution =
    await verifyMainWireBaselineConditioningPerturbationAttributionV1(
      attributionInput,
      coarse,
      refined,
    );
  if (coarse.status !== "completed" || refined.status !== "completed") {
    throw new Error("conditioning stage audit requires completed sources");
  }
  const stagePolicy =
    await compileMainWireBaselineCalibrationStagePolicyV1();
  if (
    stagePolicy.studyIdentitySha256 !== coarse.studyIdentitySha256
    || stagePolicy.studyIdentitySha256
      !== refined.source.studyIdentitySha256
    || stagePolicy.studyIdentitySha256
      !== attribution.source.studyIdentitySha256
  ) {
    throw new Error("conditioning stage policy differs from source study");
  }

  const groupByCheckId = groupByCheckIdV1();
  const identificationChecks = checksForGroupsV1(
    stagePolicy.policy.operatingPointIdentificationGroupIds,
  );
  const sourceCandidateRows = candidateRowsV1(refined.fineSensitivities);
  const sourceCandidateCheckIds = new Set(sourceCandidateRows.map(
    ({ checkId }) => checkId,
  ));
  const allConditionsOperatingPointRows = expectedRowsV1(
    stagePolicy.policy.envelopeGateConditionIds,
    identificationChecks,
  );
  const restConditionIds = new Set<string>(
    stagePolicy.policy.operatingPointIdentificationConditionIds,
  );
  const restAllGroupRows = sourceCandidateRows.filter(({ conditionId }) =>
    restConditionIds.has(conditionId));
  const operatingPointRows = expectedRowsV1(
    stagePolicy.policy.operatingPointIdentificationConditionIds,
    identificationChecks,
  );
  assertCandidateInventoryV1(
    sourceCandidateRows,
    refined.subsetDiagnostics,
  );
  assertDifferentiablePolicyRowsV1(
    operatingPointRows,
    sourceCandidateCheckIds,
  );

  const refinedSubsetByKey = new Map(refined.subsetDiagnostics.map((subset) =>
    [coordinateKeyV1(subset.coordinateIds), subset] as const));
  const subsets = Object.freeze(attribution.subsets.map((sourceSubset) => {
    const sourceDiagnostic = refinedSubsetByKey.get(
      coordinateKeyV1(sourceSubset.coordinateIds),
    );
    if (sourceDiagnostic === undefined) {
      throw new Error("conditioning stage source subset is missing");
    }
    return buildSubsetV1({
      sourceSubset,
      sourceDiagnostic,
      refinedSensitivities: refined.fineSensitivities,
      sourceCandidateRows,
      allConditionsOperatingPointRows,
      restAllGroupRows,
      operatingPointRows,
      groupByCheckId,
      identificationGroupOrder:
        stagePolicy.policy.operatingPointIdentificationGroupIds,
    });
  }));
  const declaredPairKeys = new Set(refined.policy.declaredPairCoordinateIds.map(
    coordinateKeyV1,
  ));
  const declaredPairs = subsets.filter(({ coordinateIds }) =>
    declaredPairKeys.has(coordinateKeyV1(coordinateIds)));
  return Object.freeze({
    auditId: MAIN_WIRE_BASELINE_CONDITIONING_STAGE_AUDIT_V1_ID,
    status: "completed" as const,
    source: Object.freeze({
      coarseAuditId: coarse.auditId,
      coarseArtifactIdentitySha256: await sha256CanonicalJsonHex(coarse),
      refinedAuditId: refined.auditId,
      refinedArtifactIdentitySha256: await sha256CanonicalJsonHex(refined),
      perturbationAttributionAuditId: attribution.auditId,
      perturbationAttributionArtifactIdentitySha256:
        await sha256CanonicalJsonHex(attribution),
      studyIdentitySha256: refined.source.studyIdentitySha256,
      exactModelIdentitySha256: refined.source.exactModelIdentitySha256,
      constructionPolicyIdentitySha256:
        refined.source.constructionPolicyIdentitySha256,
    }),
    stagePolicy: Object.freeze({
      policyIdentitySha256: stagePolicy.policyIdentitySha256,
      observationInventoryIdentitySha256:
        stagePolicy.observationInventoryIdentitySha256,
      policy: stagePolicy.policy,
    }),
    subsets,
    summary: Object.freeze({
      sourceAllRowsDeficientDeclaredPairCoordinateSubsets:
        coordinateListsV1(declaredPairs.filter(({ sourceResolutionStatus }) =>
          sourceResolutionStatus === "deficient")),
      primaryMaximumComponentSupportedDeclaredPairCoordinateSubsets:
        coordinateListsV1(declaredPairs.filter((subset) =>
          subset.primaryMaximumComponentResolutionStatus === "supported")),
      primarySupportedAcrossReportedCompositionsDeclaredPairCoordinateSubsets:
        coordinateListsV1(declaredPairs.filter((subset) =>
          subset.compositionRobustnessStatus
            === "supported-across-reported-compositions")),
      primaryCompositionSensitiveDeclaredPairCoordinateSubsets:
        coordinateListsV1(declaredPairs.filter((subset) =>
          subset.compositionRobustnessStatus === "composition-sensitive")),
      primaryVerdictDiffersFromSourceAllRowsDeclaredPairCoordinateSubsets:
        coordinateListsV1(declaredPairs.filter((subset) =>
          subset.sourceResolutionStatus
            !== subset.primaryMaximumComponentResolutionStatus)),
    }),
    claim: Object.freeze({
      localNumericalResolutionOnly: true as const,
      rolePolicyRetrospectivelyAppliedToExistingSources: true as const,
      reportedToleranceStressReferencesAreNotErrorBounds: true as const,
      confirmatoryRoleSelectionClaimed: false as const,
      parameterFittingExecuted: false as const,
      parameterSubsetAutomaticallySelected: false as const,
      parameterUniquenessClaimed: false as const,
      independentObservationCountClaimed: false as const,
      measurementCovarianceApplied: false as const,
      inferenceOrPredictionUncertaintyClaimed: false as const,
      qualificationGatesRemoved: false as const,
      fitMayOverrideModelFormFailure: false as const,
      rightHeartOrPulmonaryFitClaimed: false as const,
    }),
  });
}

export async function verifyMainWireBaselineConditioningStageAuditV1(
  input: unknown,
  coarseInput: unknown,
  refinedInput: unknown,
  attributionInput: unknown,
): Promise<MainWireBaselineConditioningStageAuditV1> {
  const rebuilt = await buildMainWireBaselineConditioningStageAuditV1(
    coarseInput,
    refinedInput,
    attributionInput,
  );
  if (canonicalJsonStringify(rebuilt) !== canonicalJsonStringify(input)) {
    throw new Error("conditioning stage audit differs from its reconstruction");
  }
  return input as MainWireBaselineConditioningStageAuditV1;
}

function buildSubsetV1(input: Readonly<{
  sourceSubset: MainWireBaselineConditioningPerturbationSubsetAttributionV1;
  sourceDiagnostic: MainWireBaselineConditioningRefinedDerivativeSubsetV1;
  refinedSensitivities: readonly MainWireBaselineConditioningSensitivityV1[];
  sourceCandidateRows: readonly ExpectedRowV1[];
  allConditionsOperatingPointRows: readonly ExpectedRowV1[];
  restAllGroupRows: readonly ExpectedRowV1[];
  operatingPointRows: readonly ExpectedRowV1[];
  groupByCheckId: ReadonlyMap<string, string>;
  identificationGroupOrder: readonly string[];
}>): MainWireBaselineConditioningStageSubsetV1 {
  const sourceAllRows = buildBasisV1({
    basisId: "source-all-common",
    basisRole: "source-verdict",
    completeInventoryRequiredForResolution: false,
    sourceSubset: input.sourceSubset,
    refinedSensitivities: input.refinedSensitivities,
    expectedRows: input.sourceCandidateRows,
    groupByCheckId: input.groupByCheckId,
  });
  assertSourceDiagnosticV1(sourceAllRows, input.sourceDiagnostic);
  const allConditionsOperatingPointGroups = buildBasisV1({
    basisId: "all-conditions-operating-point-groups",
    basisRole: "restriction-attribution",
    completeInventoryRequiredForResolution: false,
    sourceSubset: input.sourceSubset,
    refinedSensitivities: input.refinedSensitivities,
    expectedRows: input.allConditionsOperatingPointRows,
    groupByCheckId: input.groupByCheckId,
  });
  const restConditionsAllGroups = buildBasisV1({
    basisId: "rest-conditions-all-groups",
    basisRole: "restriction-attribution",
    completeInventoryRequiredForResolution: false,
    sourceSubset: input.sourceSubset,
    refinedSensitivities: input.refinedSensitivities,
    expectedRows: input.restAllGroupRows,
    groupByCheckId: input.groupByCheckId,
  });
  const operatingPointIdentification = buildBasisV1({
    basisId: "rest-operating-point-identification",
    basisRole: "primary-policy",
    completeInventoryRequiredForResolution: true,
    sourceSubset: input.sourceSubset,
    refinedSensitivities: input.refinedSensitivities,
    expectedRows: input.operatingPointRows,
    groupByCheckId: input.groupByCheckId,
  });
  const identificationRows = buildIdentificationRowsV1(
    input.sourceSubset,
    input.refinedSensitivities,
    input.operatingPointRows,
    input.groupByCheckId,
  );
  const primaryCompositions =
    operatingPointIdentification.toleranceCompositions;
  const primaryMaximum = primaryCompositions.find(({ compositionId }) =>
    compositionId === "maximum-component-primary");
  if (primaryMaximum === undefined) {
    throw new Error("conditioning stage primary tolerance is missing");
  }
  return Object.freeze({
    coordinateIds: Object.freeze([...input.sourceSubset.coordinateIds]),
    sourceResolutionStatus: input.sourceDiagnostic.resolutionStatus,
    sourceAllRows,
    allConditionsOperatingPointGroups,
    restConditionsAllGroups,
    operatingPointIdentification,
    gateOnlyCommonRowCount:
      input.sourceSubset.rowCount
      - operatingPointIdentification.commonAdmittedRowCount,
    identificationRows,
    identificationByObservationGroup: aggregateByObservationGroupV1(
      identificationRows,
      input.identificationGroupOrder,
    ),
    primaryMaximumComponentResolutionStatus: primaryMaximum.resolutionStatus,
    compositionRobustnessStatus: compositionRobustnessStatusV1(
      primaryCompositions,
    ),
  });
}

function buildBasisV1(input: Readonly<{
  basisId: MainWireBaselineConditioningStageBasisV1["basisId"];
  basisRole: MainWireBaselineConditioningStageBasisV1["basisRole"];
  completeInventoryRequiredForResolution: boolean;
  sourceSubset: MainWireBaselineConditioningPerturbationSubsetAttributionV1;
  refinedSensitivities: readonly MainWireBaselineConditioningSensitivityV1[];
  expectedRows: readonly ExpectedRowV1[];
  groupByCheckId: ReadonlyMap<string, string>;
}>): MainWireBaselineConditioningStageBasisV1 {
  const expectedKeys = new Set(input.expectedRows.map(rowKeyV1));
  if (expectedKeys.size !== input.expectedRows.length) {
    throw new Error("conditioning stage candidate rows are duplicated");
  }
  assertWholeSourceGroupBlocksV1(
    input.sourceSubset.rows,
    input.expectedRows,
    input.groupByCheckId,
  );
  const sourceByKey = new Map(input.sourceSubset.rows.map((row) =>
    [rowKeyV1(row), row] as const));
  const commonKeys = new Set([...expectedKeys].filter((key) =>
    sourceByKey.has(key)));
  const missingCandidateRows = Object.freeze(input.expectedRows.filter((row) =>
    !commonKeys.has(rowKeyV1(row))));
  const matrix = buildMainWireBaselineConditioningAdmittedMatrixV1(
    input.refinedSensitivities.filter((sensitivity) =>
      commonKeys.has(rowKeyV1(sensitivity))),
    input.sourceSubset.coordinateIds,
  );
  if (matrix.excludedRows.length > 0 || matrix.rows.length !== commonKeys.size) {
    throw new Error("conditioning stage basis differs from common rows");
  }
  const refinedRows = matrix.rows.map((row) => weightedV1(
    row.halfStepRow,
    row.weightDivisor,
  ));
  const selectedAttributionRows = matrix.rows.map((row) => {
    const source = sourceByKey.get(rowKeyV1(row));
    if (source === undefined) {
      throw new Error("conditioning stage perturbation row is missing");
    }
    return source;
  });
  const singularValues = buildMainWireBaselineConditioningSingularValuesV1(
    refinedRows,
    input.sourceSubset.coordinateIds.length,
  );
  const maximum = singularValues[0] ?? 0;
  const numericalRankTolerance = maximum * Math.max(
    refinedRows.length,
    input.sourceSubset.coordinateIds.length,
  ) * Number.EPSILON;
  const numericalRank = singularValues.filter((value) =>
    value > numericalRankTolerance).length;
  const rowInventoryStatus = missingCandidateRows.length === 0
    ? "complete" as const
    : "incomplete" as const;
  const aggregatePerturbation = aggregatePerturbationsV1(
    selectedAttributionRows,
  );
  const toleranceCompositions = toleranceCompositionsV1({
    singularValues,
    numericalRankTolerance,
    coordinateCount: input.sourceSubset.coordinateIds.length,
    aggregatePerturbation,
    inventoryResolved: !input.completeInventoryRequiredForResolution
      || rowInventoryStatus === "complete",
  });
  return Object.freeze({
    basisId: input.basisId,
    basisRole: input.basisRole,
    completeInventoryRequiredForResolution:
      input.completeInventoryRequiredForResolution,
    candidateRowCount: input.expectedRows.length,
    commonAdmittedRowCount: refinedRows.length,
    rowInventoryStatus,
    missingCandidateRows,
    aggregate: Object.freeze({
      refinedHalfStepSignalFrobeniusNorm: frobeniusNormV1(refinedRows),
      ...aggregatePerturbation,
    }),
    refinedSingularValues: Object.freeze(singularValues),
    numericalRank,
    numericalRankTolerance,
    numericalConditionNumber: numericalRank
      === input.sourceSubset.coordinateIds.length
      && singularValues.at(-1)! > 0
      ? singularValues[0]! / singularValues.at(-1)!
      : null,
    toleranceCompositions,
    columnNorms: columnNormsV1(
      refinedRows,
      input.sourceSubset.coordinateIds,
    ),
    columnCosines: columnCosinesV1(
      refinedRows,
      input.sourceSubset.coordinateIds,
    ),
  });
}

function buildIdentificationRowsV1(
  sourceSubset: MainWireBaselineConditioningPerturbationSubsetAttributionV1,
  refinedSensitivities: readonly MainWireBaselineConditioningSensitivityV1[],
  expectedRows: readonly ExpectedRowV1[],
  groupByCheckId: ReadonlyMap<string, string>,
): readonly MainWireBaselineConditioningIdentificationRowV1[] {
  const expectedKeys = new Set(expectedRows.map(rowKeyV1));
  const sourceByKey = new Map(sourceSubset.rows.map((row) =>
    [rowKeyV1(row), row] as const));
  const commonKeys = new Set([...expectedKeys].filter((key) =>
    sourceByKey.has(key)));
  const matrix = buildMainWireBaselineConditioningAdmittedMatrixV1(
    refinedSensitivities.filter((sensitivity) =>
      commonKeys.has(rowKeyV1(sensitivity))),
    sourceSubset.coordinateIds,
  );
  return Object.freeze(matrix.rows.map((matrixRow) => {
    const source = sourceByKey.get(rowKeyV1(matrixRow));
    const observationGroupId = groupByCheckId.get(matrixRow.checkId);
    if (source === undefined || observationGroupId === undefined) {
      throw new Error("conditioning stage row cannot resolve its source role");
    }
    const refinedHalfStepSignalNorm = vectorNormV1(weightedV1(
      matrixRow.halfStepRow,
      matrixRow.weightDivisor,
    ));
    const worstPerturbationNorm = Math.max(
      source.coarseStepHalving,
      source.refinedStepHalving,
      source.coarseRefinedDerivative,
    );
    return Object.freeze({
      conditionId: matrixRow.conditionId,
      observationGroupId,
      checkId: matrixRow.checkId,
      refinedHalfStepSignalNorm,
      coarseStepHalving: source.coarseStepHalving,
      refinedStepHalving: source.refinedStepHalving,
      coarseRefinedDerivative: source.coarseRefinedDerivative,
      worstPerturbationNorm,
      signalToWorstPerturbationRatio: worstPerturbationNorm > 0
        ? refinedHalfStepSignalNorm / worstPerturbationNorm
        : null,
    });
  }));
}

function toleranceCompositionsV1(input: Readonly<{
  singularValues: readonly number[];
  numericalRankTolerance: number;
  coordinateCount: number;
  aggregatePerturbation: PerturbationNormsV1;
  inventoryResolved: boolean;
}>): readonly MainWireBaselineConditioningToleranceCompositionV1[] {
  const components = [
    input.aggregatePerturbation.coarseStepHalving,
    input.aggregatePerturbation.refinedStepHalving,
    input.aggregatePerturbation.coarseRefinedDerivative,
  ] as const;
  const definitions = [
    ["maximum-component-primary", Math.max(...components)],
    [
      "root-sum-square-components-stress-reference",
      rootSumSquaresV1(components),
    ],
    ["additive-components-stress-reference", components.reduce(
      (sum, value) => sum + value,
      0,
    )],
  ] as const;
  return Object.freeze(definitions.map(([compositionId, empiricalTolerance]) => {
    const practicalRankTolerance = Math.max(
      input.numericalRankTolerance,
      empiricalTolerance,
    );
    const practicalRank = input.singularValues.filter((value) =>
      value > practicalRankTolerance).length;
    const ratios = Object.freeze(input.singularValues.map((value) =>
      practicalRankTolerance > 0 ? value / practicalRankTolerance : null));
    const fullRank = practicalRank === input.coordinateCount;
    return Object.freeze({
      compositionId,
      practicalRankTolerance,
      practicalRank,
      singularValueRatiosToPracticalTolerance: ratios,
      smallestSingularValueToTolerance: ratios.at(-1) ?? null,
      practicalConditionNumber: fullRank
        && input.singularValues.at(-1)! > 0
        ? input.singularValues[0]! / input.singularValues.at(-1)!
        : null,
      resolutionStatus: !input.inventoryResolved
        ? "unresolved" as const
        : fullRank
          ? "supported" as const
          : "deficient" as const,
    });
  }));
}

function aggregateByObservationGroupV1(
  rows: readonly MainWireBaselineConditioningIdentificationRowV1[],
  groupOrder: readonly string[],
): readonly MainWireBaselineConditioningObservationGroupDiagnosticV1[] {
  const totalSignalSquared = rows.reduce((sum, row) =>
    sum + row.refinedHalfStepSignalNorm ** 2, 0);
  return Object.freeze(groupOrder.flatMap((observationGroupId) => {
    const members = rows.filter((row) =>
      row.observationGroupId === observationGroupId);
    if (members.length === 0) return [];
    const signal = rootSumSquaresV1(members.map((row) =>
      row.refinedHalfStepSignalNorm));
    return [Object.freeze({
      observationGroupId,
      rowCount: members.length,
      refinedHalfStepSignalFrobeniusNorm: signal,
      refinedHalfStepSignalSquaredShare: totalSignalSquared > 0
        ? signal ** 2 / totalSignalSquared
        : null,
      ...aggregatePerturbationsV1(members),
    })];
  }));
}

function compositionRobustnessStatusV1(
  compositions:
    readonly MainWireBaselineConditioningToleranceCompositionV1[],
): MainWireBaselineConditioningStageSubsetV1["compositionRobustnessStatus"] {
  if (compositions.some(({ resolutionStatus }) =>
    resolutionStatus === "unresolved")) return "unresolved";
  const primary = compositions.find(({ compositionId }) =>
    compositionId === "maximum-component-primary")!;
  if (primary.resolutionStatus === "deficient") return "deficient";
  return compositions.every(({ resolutionStatus }) =>
    resolutionStatus === "supported")
    ? "supported-across-reported-compositions"
    : "composition-sensitive";
}

function assertSourceDiagnosticV1(
  basis: MainWireBaselineConditioningStageBasisV1,
  source: MainWireBaselineConditioningRefinedDerivativeSubsetV1,
): void {
  const primary = basis.toleranceCompositions.find(({ compositionId }) =>
    compositionId === "maximum-component-primary")!;
  const values = [
    [basis.commonAdmittedRowCount, source.commonAdmittedRowCount],
    [basis.numericalRank, source.numericalRank],
    [basis.numericalRankTolerance, source.numericalRankTolerance],
    [primary.practicalRank, source.practicalRank],
    [primary.practicalRankTolerance, source.practicalRankTolerance],
    [
      basis.aggregate.coarseStepHalving,
      source.coarseStepHalvingPerturbationFrobeniusNorm,
    ],
    [
      basis.aggregate.refinedStepHalving,
      source.refinedStepHalvingPerturbationFrobeniusNorm,
    ],
    [
      basis.aggregate.coarseRefinedDerivative,
      source.coarseRefinedDerivativePerturbationFrobeniusNorm,
    ],
  ] as const;
  if (
    values.some(([actual, expected]) => !nearlyEqualV1(actual, expected))
    || basis.refinedSingularValues.length
      !== source.refinedSingularValues.length
    || basis.refinedSingularValues.some((value, index) =>
      !nearlyEqualV1(value, source.refinedSingularValues[index]!))
    || primary.resolutionStatus !== source.resolutionStatus
  ) {
    throw new Error("conditioning stage does not reproduce source verdict");
  }
}

function assertWholeSourceGroupBlocksV1(
  sourceRows:
    readonly MainWireBaselineConditioningPerturbationRowAttributionV1[],
  expectedRows: readonly ExpectedRowV1[],
  groupByCheckId: ReadonlyMap<string, string>,
): void {
  const expectedKeys = new Set(expectedRows.map(rowKeyV1));
  const selectedBlocks = new Set(expectedRows.map((row) => {
    const groupId = groupByCheckId.get(row.checkId);
    if (groupId === undefined) {
      throw new Error("conditioning stage expected row has no evidence group");
    }
    return `${row.conditionId}::${groupId}`;
  }));
  if (sourceRows.some((row) => {
    const groupId = groupByCheckId.get(row.checkId);
    return groupId !== undefined
      && selectedBlocks.has(`${row.conditionId}::${groupId}`)
      && !expectedKeys.has(rowKeyV1(row));
  })) {
    throw new Error("conditioning stage basis splits an evidence-group block");
  }
}

function assertCandidateInventoryV1(
  rows: readonly ExpectedRowV1[],
  subsets: readonly MainWireBaselineConditioningRefinedDerivativeSubsetV1[],
): void {
  if (
    new Set(rows.map(rowKeyV1)).size !== rows.length
    || subsets.some(({ candidateRowCount }) => candidateRowCount !== rows.length)
  ) {
    throw new Error("conditioning stage source candidate inventory differs");
  }
}

function assertDifferentiablePolicyRowsV1(
  rows: readonly ExpectedRowV1[],
  sourceCandidateCheckIds: ReadonlySet<string>,
): void {
  if (rows.some(({ checkId }) => !sourceCandidateCheckIds.has(checkId))) {
    throw new Error(
      "conditioning stage fit role contains a non-differentiable check",
    );
  }
}

function candidateRowsV1(
  sensitivities: readonly MainWireBaselineConditioningSensitivityV1[],
): readonly ExpectedRowV1[] {
  const firstCoordinateId = sensitivities[0]?.coordinateId;
  if (firstCoordinateId === undefined) {
    throw new Error("conditioning stage source sensitivities are empty");
  }
  return Object.freeze(sensitivities
    .filter(({ coordinateId }) => coordinateId === firstCoordinateId)
    .map(({ conditionId, checkId }) => Object.freeze({
      conditionId,
      checkId,
    })));
}

function expectedRowsV1(
  conditionIds: readonly string[],
  checks: readonly Readonly<{ checkId: string }>[],
): readonly ExpectedRowV1[] {
  return Object.freeze(conditionIds.flatMap((conditionId) =>
    checks.map(({ checkId }) => Object.freeze({ conditionId, checkId }))));
}

function checksForGroupsV1(
  groupIds: readonly string[],
): readonly Readonly<{ groupId: string; checkId: string }>[] {
  const selected = new Set(groupIds);
  return Object.freeze(normalReferenceEvidenceV1.checkGroups
    .filter(({ groupId }) => selected.has(groupId))
    .flatMap(({ groupId, checkIds }) => checkIds.map((checkId) =>
      Object.freeze({ groupId, checkId }))));
}

function groupByCheckIdV1(): ReadonlyMap<string, string> {
  return new Map(normalReferenceEvidenceV1.checkGroups.flatMap(
    ({ groupId, checkIds }) => checkIds.map((checkId) =>
      [checkId, groupId] as const),
  ));
}

function coordinateListsV1(
  subsets: readonly MainWireBaselineConditioningStageSubsetV1[],
): readonly (readonly MainWireBaselineCalibrationParameterIdV1[])[] {
  return Object.freeze(subsets.map(({ coordinateIds }) => coordinateIds));
}

function aggregatePerturbationsV1(
  rows: readonly PerturbationNormsV1[],
): PerturbationNormsV1 {
  return Object.freeze({
    coarseStepHalving: rootSumSquaresV1(rows.map((row) =>
      row.coarseStepHalving)),
    refinedStepHalving: rootSumSquaresV1(rows.map((row) =>
      row.refinedStepHalving)),
    coarseRefinedDerivative: rootSumSquaresV1(rows.map((row) =>
      row.coarseRefinedDerivative)),
  });
}

function columnNormsV1(
  rows: readonly (readonly number[])[],
  coordinateIds: readonly MainWireBaselineCalibrationParameterIdV1[],
): Readonly<Record<string, number>> {
  return Object.freeze(Object.fromEntries(coordinateIds.map(
    (coordinateId, column) => [
      coordinateId,
      vectorNormV1(rows.map((row) => row[column]!)),
    ],
  )));
}

function columnCosinesV1(
  rows: readonly (readonly number[])[],
  coordinateIds: readonly MainWireBaselineCalibrationParameterIdV1[],
): MainWireBaselineConditioningStageBasisV1["columnCosines"] {
  const result:
    MainWireBaselineConditioningStageBasisV1["columnCosines"][number][] = [];
  for (let left = 0; left < coordinateIds.length; left += 1) {
    const leftValues = rows.map((row) => row[left]!);
    const leftNorm = vectorNormV1(leftValues);
    for (let right = left + 1; right < coordinateIds.length; right += 1) {
      const rightValues = rows.map((row) => row[right]!);
      const rightNorm = vectorNormV1(rightValues);
      result.push(Object.freeze({
        leftCoordinateId: coordinateIds[left]!,
        rightCoordinateId: coordinateIds[right]!,
        cosine: leftNorm > 0 && rightNorm > 0
          ? leftValues.reduce((sum, value, index) =>
              sum + value * rightValues[index]!, 0) / leftNorm / rightNorm
          : null,
      }));
    }
  }
  return Object.freeze(result);
}

function frobeniusNormV1(rows: readonly (readonly number[])[]): number {
  return rootSumSquaresV1(rows.flat());
}

function rootSumSquaresV1(values: readonly number[]): number {
  return Math.sqrt(values.reduce((sum, value) => sum + value * value, 0));
}

function vectorNormV1(values: readonly number[]): number {
  return rootSumSquaresV1(values);
}

function weightedV1(values: readonly number[], divisor: number): number[] {
  return values.map((value) => value / divisor);
}

function nearlyEqualV1(left: number, right: number): boolean {
  return Math.abs(left - right)
    <= Math.max(1, Math.abs(left), Math.abs(right)) * 1e-12;
}

function rowKeyV1(row: Readonly<{
  conditionId: string;
  checkId: string;
}>): string {
  return `${row.conditionId}::${row.checkId}`;
}

function coordinateKeyV1(
  coordinateIds: readonly MainWireBaselineCalibrationParameterIdV1[],
): string {
  return coordinateIds.join("::");
}
