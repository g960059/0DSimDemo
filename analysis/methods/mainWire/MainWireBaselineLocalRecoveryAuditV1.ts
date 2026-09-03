import {
  canonicalJsonStringify,
  sha256CanonicalJsonHex,
} from "@/engine/integrity";
import {
  buildMainWireBaselineConditioningAdmittedMatrixV1,
  buildMainWireBaselineConditioningCenterCandidateV1,
  buildMainWireBaselineConditioningSingularValuesV1,
  verifyMainWireBaselineConditioningAuditV1,
  type MainWireBaselineConditioningSensitivityV1,
} from "@/analysis/methods/mainWire/MainWireBaselineConditioningAuditV1";
import {
  verifyMainWireBaselineConditioningRefinedDerivativeAuditV1,
} from "@/analysis/methods/mainWire/MainWireBaselineConditioningRefinedDerivativeAuditV1";
import {
  verifyMainWireBaselineConditioningPerturbationAttributionV1,
} from "@/analysis/methods/mainWire/MainWireBaselineConditioningPerturbationAttributionV1";
import {
  verifyMainWireBaselineConditioningStageAuditV1,
  type MainWireBaselineConditioningStageSubsetV1,
} from "@/analysis/methods/mainWire/MainWireBaselineConditioningStageAuditV1";
import {
  applyMainWireBaselineCalibrationParametersV1,
  mainWireBaselineCalibrationParameterV1,
  projectMainWireBaselineCalibrationParameterToReleaseLatticeV1,
  readMainWireBaselineCalibrationParameterV1,
  transformMainWireBaselineCalibrationParameterV1,
  type MainWireBaselineCalibrationCandidateInputsV1,
  type MainWireBaselineCalibrationParameterIdV1,
} from "@/analysis/policies/mainWire/MainWireBaselineCalibrationParametersV1";

export const MAIN_WIRE_BASELINE_LOCAL_RECOVERY_AUDIT_V1_ID =
  "main-wire-baseline-local-recovery-audit-v1" as const;

const TBV = "hemodynamics.total-blood-volume-ml" as const;
const ACTIVE_TENSION =
  "myocardium.common-ventricular-active-tension-scale" as const;
const ARTERIAL_STIFFNESS = "hemodynamics.arterial-stiffness" as const;

export const MAIN_WIRE_BASELINE_LOCAL_RECOVERY_POLICY_V1 = Object.freeze({
  estimator: "refined-half-step-primary-jacobian" as const,
  crossEstimateGenerators: Object.freeze([
    "coarse-full-step-primary-jacobian",
    "coarse-half-step-primary-jacobian",
    "refined-full-step-primary-jacobian",
  ] as const),
  recoveryCoordinateIds: Object.freeze([TBV, ACTIVE_TENSION] as const),
  comparisonCoordinateIds: Object.freeze([TBV, ARTERIAL_STIFFNESS] as const),
  truthOffset:
    "one-release-lattice-step-in-each-coordinate" as const,
  directionControls: Object.freeze([
    Object.freeze({
      controlId: "both-minus",
      directions: Object.freeze([-1, -1] as const),
    }),
    Object.freeze({
      controlId: "tbv-minus-active-plus",
      directions: Object.freeze([-1, 1] as const),
    }),
    Object.freeze({
      controlId: "tbv-plus-active-minus",
      directions: Object.freeze([1, -1] as const),
    }),
    Object.freeze({
      controlId: "both-plus",
      directions: Object.freeze([1, 1] as const),
    }),
  ] as const),
  recoveryAdmission:
    "complete-primary-rows-and-supported-across-reported-compositions" as const,
  recoveryPassRule:
    "recovered-values-project-to-the-known-truth-release-lattice-point" as const,
  comparisonRefusalRule:
    "do-not-run-recovery-when-not-supported-across-reported-compositions" as const,
});

type GeneratorIdV1 =
  typeof MAIN_WIRE_BASELINE_LOCAL_RECOVERY_POLICY_V1
    .crossEstimateGenerators[number];

type CoordinateRecordV1 = Readonly<Record<string, number>>;

export type MainWireBaselineLocalRecoveryControlV1 = Readonly<{
  controlId: string;
  generatorId: GeneratorIdV1;
  directions: readonly [-1 | 1, -1 | 1];
  truthCoordinateValues: CoordinateRecordV1;
  truthTransformedOffsets: CoordinateRecordV1;
  recoveredCoordinateValues: CoordinateRecordV1;
  recoveredTransformedOffsets: CoordinateRecordV1;
  recoveryErrorsInReleaseLatticeSteps: CoordinateRecordV1;
  projectedRecoveredCoordinateValues: CoordinateRecordV1;
  responseNorm: number;
  fittedResidualNorm: number;
  fittedResidualFraction: number | null;
  generatorDifferenceFrobeniusNorm: number;
  actualTransformedParameterErrorNorm: number;
  transformedParameterErrorUpperBound: number;
  boundCheckStatus: "passed";
  recoveryStatus: "passed" | "failed";
}>;

export type MainWireBaselineLocalRecoveryAuditV1 = Readonly<{
  auditId: typeof MAIN_WIRE_BASELINE_LOCAL_RECOVERY_AUDIT_V1_ID;
  status: "completed";
  source: Readonly<{
    coarseAuditId: string;
    coarseArtifactIdentitySha256: string;
    refinedAuditId: string;
    refinedArtifactIdentitySha256: string;
    perturbationAttributionAuditId: string;
    perturbationAttributionArtifactIdentitySha256: string;
    stageAuditId: string;
    stageArtifactIdentitySha256: string;
    stagePolicyIdentitySha256: string;
    studyIdentitySha256: string;
    exactModelIdentitySha256: string;
  }>;
  policyIdentitySha256: string;
  policy: typeof MAIN_WIRE_BASELINE_LOCAL_RECOVERY_POLICY_V1;
  recoveryBasis: Readonly<{
    coordinateIds: readonly MainWireBaselineCalibrationParameterIdV1[];
    rowCount: number;
    rowKeys: readonly string[];
    estimatorSingularValues: readonly number[];
    estimatorConditionNumber: number;
    centerCoordinateValues: CoordinateRecordV1;
    releaseLatticeSteps: CoordinateRecordV1;
  }>;
  controls: readonly MainWireBaselineLocalRecoveryControlV1[];
  unsupportedComparisonRefusal: Readonly<{
    coordinateIds: readonly MainWireBaselineCalibrationParameterIdV1[];
    sourceResolutionStatus: "supported" | "deficient";
    primaryMaximumComponentResolutionStatus:
      "supported" | "deficient" | "unresolved";
    compositionRobustnessStatus:
      MainWireBaselineConditioningStageSubsetV1["compositionRobustnessStatus"];
    refusalRequired: boolean;
    recoveryAttempted: false;
    refusalStatus: "passed" | "not-required";
  }>;
  summary: Readonly<{
    controlCount: number;
    passedControlCount: number;
    maximumAbsoluteRecoveryErrorInReleaseLatticeSteps: number;
    allControlsRecoverTruthLatticePoint: boolean;
    unsupportedComparisonRefusalRequired: boolean;
    unsupportedComparisonRefused: boolean;
  }>;
  claim: Readonly<{
    localLinearizedRecoveryOnly: true;
    crossEstimateRatherThanSelfEstimateControls: true;
    exactNonlinearSyntheticTargetsEvaluated: false;
    optimizerExecuted: false;
    parameterSubsetAutomaticallySelected: false;
    uniqueParameterVectorClaimed: false;
    rawParameterConfoundRefusalClaimed: false;
    measurementOrModelDiscrepancyApplied: false;
    presetOrCaseFittingQualified: false;
  }>;
}>;

export async function buildMainWireBaselineLocalRecoveryAuditV1(
  coarseInput: unknown,
  refinedInput: unknown,
  attributionInput: unknown,
  stageInput: unknown,
): Promise<MainWireBaselineLocalRecoveryAuditV1> {
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
  const stage = await verifyMainWireBaselineConditioningStageAuditV1(
    stageInput,
    coarse,
    refined,
    attribution,
  );
  const recoverySubset = requiredSubsetV1(
    stage.subsets,
    MAIN_WIRE_BASELINE_LOCAL_RECOVERY_POLICY_V1.recoveryCoordinateIds,
  );
  assertRecoveryAdmissionV1(recoverySubset);
  const comparisonSubset = requiredSubsetV1(
    stage.subsets,
    MAIN_WIRE_BASELINE_LOCAL_RECOVERY_POLICY_V1.comparisonCoordinateIds,
  );
  const expectedRows = recoverySubset.identificationRows.map(
    ({ conditionId, checkId }) => Object.freeze({ conditionId, checkId }),
  );
  const estimator = matrixV1(
    refined.fineSensitivities,
    recoverySubset.coordinateIds,
    expectedRows,
    "half",
  );
  assertEstimatorMatchesStageV1(estimator.rows, recoverySubset);
  const generators = [
    Object.freeze({
      generatorId: "coarse-full-step-primary-jacobian" as const,
      matrix: matrixV1(
        coarse.sensitivities,
        recoverySubset.coordinateIds,
        expectedRows,
        "full",
      ),
    }),
    Object.freeze({
      generatorId: "coarse-half-step-primary-jacobian" as const,
      matrix: matrixV1(
        coarse.sensitivities,
        recoverySubset.coordinateIds,
        expectedRows,
        "half",
      ),
    }),
    Object.freeze({
      generatorId: "refined-full-step-primary-jacobian" as const,
      matrix: matrixV1(
        refined.fineSensitivities,
        recoverySubset.coordinateIds,
        expectedRows,
        "full",
      ),
    }),
  ] as const;
  generators.forEach(({ matrix }) =>
    assertAlignedMatricesV1(estimator, matrix));

  const center = buildMainWireBaselineConditioningCenterCandidateV1(
    "rest-hr60",
  );
  const controls = Object.freeze(generators.flatMap(({ generatorId, matrix }) =>
    MAIN_WIRE_BASELINE_LOCAL_RECOVERY_POLICY_V1.directionControls.map(
      ({ controlId, directions }) => buildControlV1({
        controlId,
        generatorId,
        directions,
        coordinateIds: recoverySubset.coordinateIds,
        center,
        estimatorRows: estimator.rows,
        generatorRows: matrix.rows,
        estimatorSmallestSingularValue:
          recoverySubset.operatingPointIdentification
            .refinedSingularValues.at(-1)!,
      }),
    )));
  const comparisonRefused = comparisonSubset.compositionRobustnessStatus
    !== "supported-across-reported-compositions";
  const maximumAbsoluteRecoveryErrorInReleaseLatticeSteps = Math.max(
    ...controls.flatMap((control) => Object.values(
      control.recoveryErrorsInReleaseLatticeSteps,
    ).map(Math.abs)),
  );
  return Object.freeze({
    auditId: MAIN_WIRE_BASELINE_LOCAL_RECOVERY_AUDIT_V1_ID,
    status: "completed" as const,
    source: Object.freeze({
      coarseAuditId: coarse.auditId,
      coarseArtifactIdentitySha256: await sha256CanonicalJsonHex(coarse),
      refinedAuditId: refined.auditId,
      refinedArtifactIdentitySha256: await sha256CanonicalJsonHex(refined),
      perturbationAttributionAuditId: attribution.auditId,
      perturbationAttributionArtifactIdentitySha256:
        await sha256CanonicalJsonHex(attribution),
      stageAuditId: stage.auditId,
      stageArtifactIdentitySha256: await sha256CanonicalJsonHex(stage),
      stagePolicyIdentitySha256: stage.stagePolicy.policyIdentitySha256,
      studyIdentitySha256: stage.source.studyIdentitySha256,
      exactModelIdentitySha256: stage.source.exactModelIdentitySha256,
    }),
    policyIdentitySha256: await sha256CanonicalJsonHex(
      MAIN_WIRE_BASELINE_LOCAL_RECOVERY_POLICY_V1,
    ),
    policy: MAIN_WIRE_BASELINE_LOCAL_RECOVERY_POLICY_V1,
    recoveryBasis: Object.freeze({
      coordinateIds: recoverySubset.coordinateIds,
      rowCount: estimator.rows.length,
      rowKeys: estimator.rowKeys,
      estimatorSingularValues:
        recoverySubset.operatingPointIdentification.refinedSingularValues,
      estimatorConditionNumber:
        recoverySubset.operatingPointIdentification
          .numericalConditionNumber!,
      centerCoordinateValues: coordinateValuesV1(
        center,
        recoverySubset.coordinateIds,
      ),
      releaseLatticeSteps: Object.freeze(Object.fromEntries(
        recoverySubset.coordinateIds.map((coordinateId) => [
          coordinateId,
          mainWireBaselineCalibrationParameterV1(coordinateId)
            .finiteDifferenceStep,
        ]),
      )),
    }),
    controls,
    unsupportedComparisonRefusal: Object.freeze({
      coordinateIds: comparisonSubset.coordinateIds,
      sourceResolutionStatus: comparisonSubset.sourceResolutionStatus,
      primaryMaximumComponentResolutionStatus:
        comparisonSubset.primaryMaximumComponentResolutionStatus,
      compositionRobustnessStatus:
        comparisonSubset.compositionRobustnessStatus,
      refusalRequired: comparisonRefused,
      recoveryAttempted: false as const,
      refusalStatus: comparisonRefused
        ? "passed" as const
        : "not-required" as const,
    }),
    summary: Object.freeze({
      controlCount: controls.length,
      passedControlCount: controls.filter(({ recoveryStatus }) =>
        recoveryStatus === "passed").length,
      maximumAbsoluteRecoveryErrorInReleaseLatticeSteps,
      allControlsRecoverTruthLatticePoint: controls.every(
        ({ recoveryStatus }) => recoveryStatus === "passed",
      ),
      unsupportedComparisonRefusalRequired: comparisonRefused,
      unsupportedComparisonRefused: comparisonRefused,
    }),
    claim: Object.freeze({
      localLinearizedRecoveryOnly: true as const,
      crossEstimateRatherThanSelfEstimateControls: true as const,
      exactNonlinearSyntheticTargetsEvaluated: false as const,
      optimizerExecuted: false as const,
      parameterSubsetAutomaticallySelected: false as const,
      uniqueParameterVectorClaimed: false as const,
      rawParameterConfoundRefusalClaimed: false as const,
      measurementOrModelDiscrepancyApplied: false as const,
      presetOrCaseFittingQualified: false as const,
    }),
  });
}

export async function verifyMainWireBaselineLocalRecoveryAuditV1(
  input: unknown,
  coarseInput: unknown,
  refinedInput: unknown,
  attributionInput: unknown,
  stageInput: unknown,
): Promise<MainWireBaselineLocalRecoveryAuditV1> {
  const rebuilt = await buildMainWireBaselineLocalRecoveryAuditV1(
    coarseInput,
    refinedInput,
    attributionInput,
    stageInput,
  );
  if (canonicalJsonStringify(rebuilt) !== canonicalJsonStringify(input)) {
    throw new Error("baseline local recovery differs from its reconstruction");
  }
  return input as MainWireBaselineLocalRecoveryAuditV1;
}

function buildControlV1(input: Readonly<{
  controlId: string;
  generatorId: GeneratorIdV1;
  directions: readonly [-1 | 1, -1 | 1];
  coordinateIds: readonly MainWireBaselineCalibrationParameterIdV1[];
  center: MainWireBaselineCalibrationCandidateInputsV1;
  estimatorRows: readonly (readonly number[])[];
  generatorRows: readonly (readonly number[])[];
  estimatorSmallestSingularValue: number;
}>): MainWireBaselineLocalRecoveryControlV1 {
  const truth = applyMainWireBaselineCalibrationParametersV1(
    input.center,
    input.coordinateIds.map((parameterId, index) => {
      const center = readMainWireBaselineCalibrationParameterV1(
        input.center,
        parameterId,
      );
      const descriptor = mainWireBaselineCalibrationParameterV1(parameterId);
      return Object.freeze({
        parameterId,
        value: projectMainWireBaselineCalibrationParameterToReleaseLatticeV1(
          parameterId,
          center + input.directions[index]! * descriptor.finiteDifferenceStep,
        ),
      });
    }),
  );
  const centerTransformed = transformedCoordinateValuesV1(
    input.center,
    input.coordinateIds,
  );
  const truthTransformed = transformedCoordinateValuesV1(
    truth,
    input.coordinateIds,
  );
  const truthOffsets = input.coordinateIds.map((coordinateId) =>
    truthTransformed[coordinateId]! - centerTransformed[coordinateId]!);
  const response = multiplyMatrixVectorV1(input.generatorRows, truthOffsets);
  const recoveredOffsets = solveTwoColumnLeastSquaresV1(
    input.estimatorRows,
    response,
  );
  const recoveredValues = Object.freeze(Object.fromEntries(
    input.coordinateIds.map((coordinateId, index) => {
      const descriptor = mainWireBaselineCalibrationParameterV1(coordinateId);
      const transformed = centerTransformed[coordinateId]!
        + recoveredOffsets[index]!;
      return [
        coordinateId,
        descriptor.transform === "log" ? Math.exp(transformed) : transformed,
      ];
    }),
  ));
  const truthValues = coordinateValuesV1(truth, input.coordinateIds);
  const projectedRecoveredValues = Object.freeze(Object.fromEntries(
    input.coordinateIds.map((coordinateId) => [
      coordinateId,
      projectMainWireBaselineCalibrationParameterToReleaseLatticeV1(
        coordinateId,
        recoveredValues[coordinateId]!,
      ),
    ]),
  ));
  const errorsInSteps = Object.freeze(Object.fromEntries(
    input.coordinateIds.map((coordinateId) => [
      coordinateId,
      (recoveredValues[coordinateId]! - truthValues[coordinateId]!)
        / mainWireBaselineCalibrationParameterV1(coordinateId)
          .finiteDifferenceStep,
    ]),
  ));
  const fitted = multiplyMatrixVectorV1(
    input.estimatorRows,
    recoveredOffsets,
  );
  const residual = response.map((value, index) => value - fitted[index]!);
  const responseNorm = vectorNormV1(response);
  const generatorDifference = differenceMatrixV1(
    input.generatorRows,
    input.estimatorRows,
  );
  const actualParameterError = vectorNormV1(recoveredOffsets.map(
    (value, index) => value - truthOffsets[index]!,
  ));
  const transformedParameterErrorUpperBound = frobeniusNormV1(
    generatorDifference,
  ) * vectorNormV1(truthOffsets) / input.estimatorSmallestSingularValue;
  if (
    actualParameterError
      > transformedParameterErrorUpperBound
        + 1e-12 * Math.max(1, transformedParameterErrorUpperBound)
  ) {
    throw new Error("local recovery exceeded its linear algebra error bound");
  }
  const recoveredTruthLatticePoint = input.coordinateIds.every(
    (coordinateId) =>
      projectedRecoveredValues[coordinateId] === truthValues[coordinateId],
  );
  return Object.freeze({
    controlId: `${input.generatorId}::${input.controlId}`,
    generatorId: input.generatorId,
    directions: Object.freeze([...input.directions]) as readonly [
      -1 | 1,
      -1 | 1,
    ],
    truthCoordinateValues: truthValues,
    truthTransformedOffsets: recordFromVectorV1(
      input.coordinateIds,
      truthOffsets,
    ),
    recoveredCoordinateValues: recoveredValues,
    recoveredTransformedOffsets: recordFromVectorV1(
      input.coordinateIds,
      recoveredOffsets,
    ),
    recoveryErrorsInReleaseLatticeSteps: errorsInSteps,
    projectedRecoveredCoordinateValues: projectedRecoveredValues,
    responseNorm,
    fittedResidualNorm: vectorNormV1(residual),
    fittedResidualFraction: responseNorm > 0
      ? vectorNormV1(residual) / responseNorm
      : null,
    generatorDifferenceFrobeniusNorm: frobeniusNormV1(generatorDifference),
    actualTransformedParameterErrorNorm: actualParameterError,
    transformedParameterErrorUpperBound,
    boundCheckStatus: "passed" as const,
    recoveryStatus: recoveredTruthLatticePoint
      ? "passed" as const
      : "failed" as const,
  });
}

function assertRecoveryAdmissionV1(
  subset: MainWireBaselineConditioningStageSubsetV1,
): void {
  if (
    subset.operatingPointIdentification.rowInventoryStatus !== "complete"
    || subset.compositionRobustnessStatus
      !== "supported-across-reported-compositions"
  ) {
    throw new Error(
      "baseline local recovery pair is not supported on a complete primary basis",
    );
  }
}

function requiredSubsetV1(
  subsets: readonly MainWireBaselineConditioningStageSubsetV1[],
  coordinateIds: readonly MainWireBaselineCalibrationParameterIdV1[],
): MainWireBaselineConditioningStageSubsetV1 {
  const key = coordinateKeyV1(coordinateIds);
  const subset = subsets.find((candidate) =>
    coordinateKeyV1(candidate.coordinateIds) === key);
  if (subset === undefined) {
    throw new Error(`baseline local recovery subset is missing: ${key}`);
  }
  return subset;
}

type MatrixV1 = Readonly<{
  rowKeys: readonly string[];
  weightDivisors: readonly number[];
  rows: readonly (readonly number[])[];
}>;

function matrixV1(
  sensitivities: readonly MainWireBaselineConditioningSensitivityV1[],
  coordinateIds: readonly MainWireBaselineCalibrationParameterIdV1[],
  expectedRows: readonly Readonly<{ conditionId: string; checkId: string }>[],
  estimate: "full" | "half",
): MatrixV1 {
  const expectedKeys = expectedRows.map(rowKeyV1);
  const expectedKeySet = new Set(expectedKeys);
  if (expectedKeySet.size !== expectedKeys.length) {
    throw new Error("baseline local recovery rows are duplicated");
  }
  const matrix = buildMainWireBaselineConditioningAdmittedMatrixV1(
    sensitivities.filter((sensitivity) =>
      expectedKeySet.has(rowKeyV1(sensitivity))),
    coordinateIds,
  );
  const matrixByKey = new Map(matrix.rows.map((row) =>
    [rowKeyV1(row), row] as const));
  if (
    matrix.excludedRows.length > 0
    || matrix.rows.length !== expectedRows.length
  ) {
    throw new Error("baseline local recovery requires complete admitted rows");
  }
  const ordered = expectedKeys.map((key) => matrixByKey.get(key)!);
  if (ordered.some((row) => row === undefined)) {
    throw new Error("baseline local recovery row order is incomplete");
  }
  return Object.freeze({
    rowKeys: Object.freeze(expectedKeys),
    weightDivisors: Object.freeze(ordered.map(({ weightDivisor }) =>
      weightDivisor)),
    rows: Object.freeze(ordered.map((row) => Object.freeze(
      (estimate === "half" ? row.halfStepRow : row.fullStepRow)
        .map((value) => value / row.weightDivisor),
    ))),
  });
}

function assertAlignedMatricesV1(left: MatrixV1, right: MatrixV1): void {
  if (
    left.rowKeys.length !== right.rowKeys.length
    || left.rowKeys.some((key, index) => key !== right.rowKeys[index])
    || left.weightDivisors.some((value, index) =>
      value !== right.weightDivisors[index])
  ) {
    throw new Error("baseline local recovery matrix contracts differ");
  }
}

function assertEstimatorMatchesStageV1(
  rows: readonly (readonly number[])[],
  subset: MainWireBaselineConditioningStageSubsetV1,
): void {
  const expected = subset.operatingPointIdentification.refinedSingularValues;
  const actual = buildMainWireBaselineConditioningSingularValuesV1(
    rows,
    subset.coordinateIds.length,
  );
  if (
    actual.length !== expected.length
    || actual.some((value, index) => !nearlyEqualV1(value, expected[index]!))
    || subset.operatingPointIdentification.numericalConditionNumber === null
  ) {
    throw new Error("baseline local recovery estimator differs from stage");
  }
}

function solveTwoColumnLeastSquaresV1(
  rows: readonly (readonly number[])[],
  response: readonly number[],
): readonly [number, number] {
  if (
    rows.length !== response.length
    || rows.length === 0
    || rows.some((row) => row.length !== 2)
  ) {
    throw new Error("baseline local recovery least-squares shape is invalid");
  }
  const left = rows.map((row) => row[0]!);
  const right = rows.map((row) => row[1]!);
  const leftLeft = dotV1(left, left);
  const leftRight = dotV1(left, right);
  const rightRight = dotV1(right, right);
  const determinant = leftLeft * rightRight - leftRight * leftRight;
  const scale = Math.max(1, leftLeft * rightRight);
  if (!(determinant > 64 * Number.EPSILON * scale)) {
    throw new Error("baseline local recovery estimator is rank deficient");
  }
  const leftResponse = dotV1(left, response);
  const rightResponse = dotV1(right, response);
  return Object.freeze([
    (rightRight * leftResponse - leftRight * rightResponse) / determinant,
    (leftLeft * rightResponse - leftRight * leftResponse) / determinant,
  ]);
}

function coordinateValuesV1(
  candidate: MainWireBaselineCalibrationCandidateInputsV1,
  coordinateIds: readonly MainWireBaselineCalibrationParameterIdV1[],
): CoordinateRecordV1 {
  return Object.freeze(Object.fromEntries(coordinateIds.map((coordinateId) => [
    coordinateId,
    readMainWireBaselineCalibrationParameterV1(candidate, coordinateId),
  ])));
}

function transformedCoordinateValuesV1(
  candidate: MainWireBaselineCalibrationCandidateInputsV1,
  coordinateIds: readonly MainWireBaselineCalibrationParameterIdV1[],
): CoordinateRecordV1 {
  return Object.freeze(Object.fromEntries(coordinateIds.map((coordinateId) => [
    coordinateId,
    transformMainWireBaselineCalibrationParameterV1(
      coordinateId,
      readMainWireBaselineCalibrationParameterV1(candidate, coordinateId),
    ),
  ])));
}

function recordFromVectorV1(
  coordinateIds: readonly MainWireBaselineCalibrationParameterIdV1[],
  values: readonly number[],
): CoordinateRecordV1 {
  return Object.freeze(Object.fromEntries(coordinateIds.map(
    (coordinateId, index) => [coordinateId, values[index]!],
  )));
}

function multiplyMatrixVectorV1(
  matrix: readonly (readonly number[])[],
  vector: readonly number[],
): number[] {
  return matrix.map((row) => dotV1(row, vector));
}

function differenceMatrixV1(
  left: readonly (readonly number[])[],
  right: readonly (readonly number[])[],
): number[][] {
  if (
    left.length !== right.length
    || left.some((row, rowIndex) => row.length !== right[rowIndex]!.length)
  ) {
    throw new Error("baseline local recovery matrix shapes differ");
  }
  return left.map((row, rowIndex) => row.map((value, columnIndex) =>
    value - right[rowIndex]![columnIndex]!));
}

function frobeniusNormV1(matrix: readonly (readonly number[])[]): number {
  return vectorNormV1(matrix.flat());
}

function vectorNormV1(vector: readonly number[]): number {
  return Math.sqrt(dotV1(vector, vector));
}

function dotV1(left: readonly number[], right: readonly number[]): number {
  if (left.length !== right.length) {
    throw new Error("baseline local recovery vector shapes differ");
  }
  return left.reduce((sum, value, index) =>
    sum + value * right[index]!, 0);
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
