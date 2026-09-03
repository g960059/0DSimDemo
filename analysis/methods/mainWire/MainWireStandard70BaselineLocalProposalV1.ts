import { sha256CanonicalJsonHex } from "@/engine/integrity";
import type {
  MainWireIntegratedModelBaselineValidationCheckIdV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelBaselineValidationV1";
import {
  buildMainWireBaselineConditioningSingularValuesV1,
} from "@/analysis/methods/mainWire/MainWireBaselineConditioningAuditV1";
import {
  mainWireBaselineCalibrationParameterIsOnReleaseLatticeV1,
  mainWireBaselineCalibrationParameterV1,
  projectMainWireBaselineCalibrationParameterToReleaseLatticeV1,
  transformMainWireBaselineCalibrationParameterV1,
  type MainWireBaselineCalibrationParameterIdV1,
} from "@/analysis/policies/mainWire/MainWireBaselineCalibrationParametersV1";

export const MAIN_WIRE_STANDARD70_BASELINE_LOCAL_PROPOSAL_V1_ID =
  "main-wire-standard70-baseline-local-proposal-v1" as const;

const TBV = "hemodynamics.total-blood-volume-ml" as const;
const ACTIVE_TENSION =
  "myocardium.common-ventricular-active-tension-scale" as const;

export const MAIN_WIRE_STANDARD70_BASELINE_LOCAL_PROPOSAL_POLICY_V1 =
  Object.freeze({
    schemaVersion: 1 as const,
    proposalId: MAIN_WIRE_STANDARD70_BASELINE_LOCAL_PROPOSAL_V1_ID,
    coordinateIds: Object.freeze([TBV, ACTIVE_TENSION] as const),
    conditionId: "rest-hr60" as const,
    stageBasisId: "rest-operating-point-identification" as const,
    maximumSyntheticTruthOffsetInReleaseSteps: 1 as const,
    maximumProjectedOffsetInReleaseSteps: 1 as const,
    maximumNormalizedResidualFraction: 0.1,
    residualCeilingRole:
      "retrospective-local-construction-guard-not-uncertainty" as const,
  });

type CoordinateIdV1 =
  typeof MAIN_WIRE_STANDARD70_BASELINE_LOCAL_PROPOSAL_POLICY_V1
    .coordinateIds[number];

export type MainWireStandard70BaselineLocalProposalRowV1 = Readonly<{
  conditionId: "rest-hr60";
  checkId: MainWireIntegratedModelBaselineValidationCheckIdV1;
  unit: string;
  minimum: number;
  maximum: number;
  weightDivisor: number;
  halfStepNormalizedDerivatives: readonly [number, number];
}>;

export type MainWireStandard70BaselineLocalProposalObservationV1 = Readonly<{
  conditionId: "rest-hr60";
  checkId: MainWireIntegratedModelBaselineValidationCheckIdV1;
  unit: string;
  minimum: number;
  maximum: number;
  actual: number;
}>;

export type MainWireStandard70BaselineLocalProposalInputV1 = Readonly<{
  source: Readonly<{
    studyIdentitySha256: string;
    exactModelIdentitySha256: string;
    constructionPolicyIdentitySha256: string;
    objectiveAnalysisMethodId: string;
    safetyAnalysisMethodId: string;
    stagePolicyIdentitySha256: string;
    stageArtifactIdentitySha256: string;
    refinedArtifactIdentitySha256: string;
  }>;
  target: Readonly<{
    exactModelIdentitySha256: string;
    constructionPolicyIdentitySha256: string;
    objectiveAnalysisMethodId: string;
    safetyAnalysisMethodId: string;
    requestIdentitySha256: string;
    initializationKind: "cold";
    constructionGateStatus: "passed" | "failed";
    objectiveGateStatus: "passed" | "failed";
    safetySentinelStatus: "passed" | "failed";
    failedConstructionCheckIds: readonly string[];
    failedObjectiveCheckIds: readonly string[];
    failedSafetySentinelCheckIds: readonly string[];
  }>;
  coordinates: readonly [
    Readonly<{
      parameterId: typeof TBV;
      centerValue: number;
      syntheticTruthValue: number;
    }>,
    Readonly<{
      parameterId: typeof ACTIVE_TENSION;
      centerValue: number;
      syntheticTruthValue: number;
    }>,
  ];
  basis: Readonly<{
    basisId: "rest-operating-point-identification";
    basisRole: "primary-policy";
    rowInventoryStatus: "complete";
    compositionRobustnessStatus:
      "supported-across-reported-compositions";
    practicalRank: 2;
    practicalRankTolerance: number;
    refinedSingularValues: readonly [number, number];
    rows: readonly MainWireStandard70BaselineLocalProposalRowV1[];
  }>;
  centerObservations:
    readonly MainWireStandard70BaselineLocalProposalObservationV1[];
  targetObservations:
    readonly MainWireStandard70BaselineLocalProposalObservationV1[];
}>;

type RefusalReasonV1 =
  | "target-gates-failed"
  | "target-outside-local-radius"
  | "zero-target-response"
  | "residual-fraction-exceeded"
  | "proposal-outside-parameter-domain"
  | "proposal-outside-local-radius";

type CommonResultV1 = Readonly<{
  proposalId: typeof MAIN_WIRE_STANDARD70_BASELINE_LOCAL_PROPOSAL_V1_ID;
  policyIdentitySha256: string;
  inputIdentitySha256: string;
  stageArtifactIdentitySha256: string;
  refinedArtifactIdentitySha256: string;
  targetRequestIdentitySha256: string;
}>;

export type MainWireStandard70BaselineLocalProposalV1 =
  | (CommonResultV1 & Readonly<{
      status: "refused";
      reason: RefusalReasonV1;
      normalizedResidualFraction: number | null;
    }>)
  | (CommonResultV1 & Readonly<{
      status: "proposed";
      rowCount: number;
      responseNorm: number;
      normalizedResidualNorm: number;
      normalizedResidualFraction: number;
      coordinates: readonly Readonly<{
        parameterId: CoordinateIdV1;
        centerValue: number;
        syntheticTruthValue: number;
        transformedOffset: number;
        continuousValue: number;
        projectedValue: number;
        projectedOffsetInReleaseSteps: number;
        continuousErrorFromTruthInReleaseSteps: number;
      }>[];
      syntheticTruthRecoveryStatus: "exact" | "mismatch";
      claim: Readonly<{
        artifactContentsVerified: false;
        exactReplayExecuted: false;
        localOneStepProposalOnly: true;
        optimizerExecuted: false;
        parameterUniquenessClaimed: false;
        inferentialUncertaintyClaimed: false;
        presetOrCaseFittingQualified: false;
      }>;
    }>);

/**
 * Pure two-coordinate proposal kernel. Callers must construct this compact
 * input only after the existing stage, refined-derivative, and exact-target
 * verifiers succeed. Every consumed row and identity is hashed into output.
 */
export async function buildMainWireStandard70BaselineLocalProposalV1(
  input: MainWireStandard70BaselineLocalProposalInputV1,
): Promise<MainWireStandard70BaselineLocalProposalV1> {
  assertInputContractV1(input);
  const common = Object.freeze({
    proposalId: MAIN_WIRE_STANDARD70_BASELINE_LOCAL_PROPOSAL_V1_ID,
    policyIdentitySha256: await sha256CanonicalJsonHex(
      MAIN_WIRE_STANDARD70_BASELINE_LOCAL_PROPOSAL_POLICY_V1,
    ),
    inputIdentitySha256: await sha256CanonicalJsonHex(input),
    stageArtifactIdentitySha256: input.source.stageArtifactIdentitySha256,
    refinedArtifactIdentitySha256:
      input.source.refinedArtifactIdentitySha256,
    targetRequestIdentitySha256: input.target.requestIdentitySha256,
  });
  if (!targetGatesPassedV1(input.target)) {
    return refusalV1(common, "target-gates-failed", null);
  }

  const truthOffsets = input.coordinates.map((coordinate) =>
    releaseOffsetV1(
      coordinate.parameterId,
      coordinate.centerValue,
      coordinate.syntheticTruthValue,
    ));
  if (truthOffsets.some((offset) =>
    Math.abs(offset)
      > MAIN_WIRE_STANDARD70_BASELINE_LOCAL_PROPOSAL_POLICY_V1
        .maximumSyntheticTruthOffsetInReleaseSteps)) {
    return refusalV1(common, "target-outside-local-radius", null);
  }

  const centerByKey = observationMapV1(
    input.centerObservations,
    "center",
  );
  const targetByKey = observationMapV1(
    input.targetObservations,
    "target",
  );
  const matrix = input.basis.rows.map((row) =>
    row.halfStepNormalizedDerivatives.map((value) =>
      value / row.weightDivisor));
  assertBasisMatrixV1(input, matrix);
  const response = input.basis.rows.map((row) => {
    const key = rowKeyV1(row);
    const center = centerByKey.get(key);
    const target = targetByKey.get(key);
    if (center === undefined || target === undefined) {
      throw new Error(`local proposal observation is missing: ${key}`);
    }
    assertObservationMatchesRowV1(center, row);
    assertObservationMatchesRowV1(target, row);
    return (target.actual - center.actual)
      / (row.maximum - row.minimum)
      / row.weightDivisor;
  });
  const responseNorm = vectorNormV1(response);
  if (!(responseNorm > 0)) {
    return refusalV1(common, "zero-target-response", null);
  }
  const transformedOffsets = solveTwoColumnLeastSquaresV1(matrix, response);
  const fitted = matrix.map((row) => dotV1(row, transformedOffsets));
  const residual = response.map((value, index) => value - fitted[index]!);
  const normalizedResidualNorm = vectorNormV1(residual);
  const normalizedResidualFraction = normalizedResidualNorm / responseNorm;
  if (
    !Number.isFinite(normalizedResidualFraction)
    || normalizedResidualFraction
      > MAIN_WIRE_STANDARD70_BASELINE_LOCAL_PROPOSAL_POLICY_V1
        .maximumNormalizedResidualFraction
  ) {
    return refusalV1(
      common,
      "residual-fraction-exceeded",
      normalizedResidualFraction,
    );
  }

  const estimates = input.coordinates.map((coordinate, index) => {
    const descriptor = mainWireBaselineCalibrationParameterV1(
      coordinate.parameterId,
    );
    const transformed = transformMainWireBaselineCalibrationParameterV1(
      coordinate.parameterId,
      coordinate.centerValue,
    ) + transformedOffsets[index]!;
    const continuousValue = descriptor.transform === "log"
      ? Math.exp(transformed)
      : transformed;
    if (
      !Number.isFinite(continuousValue)
      || continuousValue < descriptor.minimum
      || continuousValue > descriptor.maximum
    ) return null;
    const projectedValue =
      projectMainWireBaselineCalibrationParameterToReleaseLatticeV1(
        coordinate.parameterId,
        continuousValue,
      );
    return Object.freeze({
      parameterId: coordinate.parameterId,
      centerValue: coordinate.centerValue,
      syntheticTruthValue: coordinate.syntheticTruthValue,
      transformedOffset: transformedOffsets[index]!,
      continuousValue,
      projectedValue,
      projectedOffsetInReleaseSteps: releaseOffsetV1(
        coordinate.parameterId,
        coordinate.centerValue,
        projectedValue,
      ),
      continuousErrorFromTruthInReleaseSteps:
        (continuousValue - coordinate.syntheticTruthValue)
        / descriptor.finiteDifferenceStep,
    });
  });
  if (estimates.some((estimate) => estimate === null)) {
    return refusalV1(
      common,
      "proposal-outside-parameter-domain",
      normalizedResidualFraction,
    );
  }
  const accepted = estimates as readonly Exclude<
    typeof estimates[number],
    null
  >[];
  if (accepted.some(({ projectedOffsetInReleaseSteps }) =>
    Math.abs(projectedOffsetInReleaseSteps)
      > MAIN_WIRE_STANDARD70_BASELINE_LOCAL_PROPOSAL_POLICY_V1
        .maximumProjectedOffsetInReleaseSteps)) {
    return refusalV1(
      common,
      "proposal-outside-local-radius",
      normalizedResidualFraction,
    );
  }

  return Object.freeze({
    ...common,
    status: "proposed" as const,
    rowCount: input.basis.rows.length,
    responseNorm,
    normalizedResidualNorm,
    normalizedResidualFraction,
    coordinates: Object.freeze(accepted),
    syntheticTruthRecoveryStatus: accepted.every((estimate) =>
      estimate.projectedValue === estimate.syntheticTruthValue)
      ? "exact" as const
      : "mismatch" as const,
    claim: Object.freeze({
      artifactContentsVerified: false as const,
      exactReplayExecuted: false as const,
      localOneStepProposalOnly: true as const,
      optimizerExecuted: false as const,
      parameterUniquenessClaimed: false as const,
      inferentialUncertaintyClaimed: false as const,
      presetOrCaseFittingQualified: false as const,
    }),
  });
}

function assertInputContractV1(
  input: MainWireStandard70BaselineLocalProposalInputV1,
): void {
  const policy = MAIN_WIRE_STANDARD70_BASELINE_LOCAL_PROPOSAL_POLICY_V1;
  const digests = [
    input.source.studyIdentitySha256,
    input.source.exactModelIdentitySha256,
    input.source.constructionPolicyIdentitySha256,
    input.source.stagePolicyIdentitySha256,
    input.source.stageArtifactIdentitySha256,
    input.source.refinedArtifactIdentitySha256,
    input.target.exactModelIdentitySha256,
    input.target.constructionPolicyIdentitySha256,
    input.target.requestIdentitySha256,
  ];
  if (digests.some((digest) => !/^[0-9a-f]{64}$/.test(digest))) {
    throw new Error("local proposal provenance digest is invalid");
  }
  if (
    input.source.exactModelIdentitySha256
      !== input.target.exactModelIdentitySha256
    || input.source.constructionPolicyIdentitySha256
      !== input.target.constructionPolicyIdentitySha256
    || input.source.objectiveAnalysisMethodId
      !== input.target.objectiveAnalysisMethodId
    || input.source.safetyAnalysisMethodId
      !== input.target.safetyAnalysisMethodId
    || input.target.initializationKind !== "cold"
    || input.source.objectiveAnalysisMethodId.length === 0
    || input.source.safetyAnalysisMethodId.length === 0
  ) {
    throw new Error("local proposal source and target provenance differ");
  }
  if (
    input.coordinates.length !== 2
    || input.coordinates.some((coordinate, index) =>
      coordinate.parameterId !== policy.coordinateIds[index])
  ) {
    throw new Error("local proposal coordinate policy differs");
  }
  for (const coordinate of input.coordinates) {
    if (
      !mainWireBaselineCalibrationParameterIsOnReleaseLatticeV1(
        coordinate.parameterId,
        coordinate.centerValue,
      )
      || !mainWireBaselineCalibrationParameterIsOnReleaseLatticeV1(
        coordinate.parameterId,
        coordinate.syntheticTruthValue,
      )
    ) {
      throw new Error(
        `local proposal ${coordinate.parameterId} is off the release lattice`,
      );
    }
  }
  const basis = input.basis;
  if (
    basis.basisId !== policy.stageBasisId
    || basis.basisRole !== "primary-policy"
    || basis.rowInventoryStatus !== "complete"
    || basis.compositionRobustnessStatus
      !== "supported-across-reported-compositions"
    || basis.practicalRank !== 2
    || !Number.isFinite(basis.practicalRankTolerance)
    || basis.practicalRankTolerance < 0
    || basis.refinedSingularValues.some((value) =>
      !Number.isFinite(value) || value < 0)
    || basis.refinedSingularValues[0] < basis.refinedSingularValues[1]
    || basis.rows.length < 2
  ) {
    throw new Error("local proposal stage basis is not admitted");
  }
  const keys = basis.rows.map(rowKeyV1);
  if (new Set(keys).size !== keys.length) {
    throw new Error("local proposal stage rows are duplicated");
  }
  for (const row of basis.rows) {
    if (
      row.conditionId !== policy.conditionId
      || row.unit.length === 0
      || !Number.isFinite(row.minimum)
      || !Number.isFinite(row.maximum)
      || !(row.maximum > row.minimum)
      || !(row.weightDivisor > 0)
      || !Number.isFinite(row.weightDivisor)
      || row.halfStepNormalizedDerivatives.some((value) =>
        !Number.isFinite(value))
    ) {
      throw new Error("local proposal stage row is invalid");
    }
  }
  assertObservationInventoryV1(input, keys);
}

function assertObservationInventoryV1(
  input: MainWireStandard70BaselineLocalProposalInputV1,
  expectedKeys: readonly string[],
): void {
  const expected = new Set(expectedKeys);
  for (const [label, observations] of [
    ["center", input.centerObservations],
    ["target", input.targetObservations],
  ] as const) {
    const map = observationMapV1(observations, label);
    if (
      map.size !== expected.size
      || [...map.keys()].some((key) => !expected.has(key))
    ) {
      throw new Error(`local proposal ${label} observation inventory differs`);
    }
    for (const row of input.basis.rows) {
      assertObservationMatchesRowV1(map.get(rowKeyV1(row))!, row);
    }
  }
}

function assertBasisMatrixV1(
  input: MainWireStandard70BaselineLocalProposalInputV1,
  matrix: readonly (readonly number[])[],
): void {
  const actual = buildMainWireBaselineConditioningSingularValuesV1(matrix, 2);
  const expected = input.basis.refinedSingularValues;
  if (
    actual.length !== 2
    || actual.some((value, index) => !nearlyEqualV1(value, expected[index]!))
    || actual[1]! <= input.basis.practicalRankTolerance
  ) {
    throw new Error("local proposal matrix differs from admitted stage rank");
  }
}

function observationMapV1(
  observations: readonly MainWireStandard70BaselineLocalProposalObservationV1[],
  label: string,
): ReadonlyMap<string, MainWireStandard70BaselineLocalProposalObservationV1> {
  const map = new Map(observations.map((observation) =>
    [rowKeyV1(observation), observation] as const));
  if (map.size !== observations.length) {
    throw new Error(`local proposal ${label} observations are duplicated`);
  }
  return map;
}

function assertObservationMatchesRowV1(
  observation: MainWireStandard70BaselineLocalProposalObservationV1,
  row: MainWireStandard70BaselineLocalProposalRowV1,
): void {
  if (
    observation.unit !== row.unit
    || observation.minimum !== row.minimum
    || observation.maximum !== row.maximum
    || !Number.isFinite(observation.actual)
  ) {
    throw new Error(`local proposal observation contract differs: ${rowKeyV1(row)}`);
  }
}

function targetGatesPassedV1(
  target: MainWireStandard70BaselineLocalProposalInputV1["target"],
): boolean {
  return target.constructionGateStatus === "passed"
    && target.objectiveGateStatus === "passed"
    && target.safetySentinelStatus === "passed"
    && target.failedConstructionCheckIds.length === 0
    && target.failedObjectiveCheckIds.length === 0
    && target.failedSafetySentinelCheckIds.length === 0;
}

function solveTwoColumnLeastSquaresV1(
  matrix: readonly (readonly number[])[],
  vector: readonly number[],
): readonly [number, number] {
  const left = matrix.map((row) => row[0]!);
  const right = matrix.map((row) => row[1]!);
  const ll = dotV1(left, left);
  const lr = dotV1(left, right);
  const rr = dotV1(right, right);
  const ly = dotV1(left, vector);
  const ry = dotV1(right, vector);
  const determinant = ll * rr - lr * lr;
  if (!(determinant > 64 * Number.EPSILON * Math.max(1, ll * rr))) {
    throw new Error("local proposal least-squares matrix is rank deficient");
  }
  return Object.freeze([
    (rr * ly - lr * ry) / determinant,
    (ll * ry - lr * ly) / determinant,
  ]);
}

function releaseOffsetV1(
  parameterId: MainWireBaselineCalibrationParameterIdV1,
  centerValue: number,
  value: number,
): number {
  const step = mainWireBaselineCalibrationParameterV1(parameterId)
    .finiteDifferenceStep;
  const offset = (value - centerValue) / step;
  const nearest = Math.round(offset);
  const tolerance = 64 * Number.EPSILON * Math.max(1, Math.abs(offset));
  if (Math.abs(offset - nearest) > tolerance) {
    throw new Error(`${parameterId} release offset is not integral`);
  }
  return nearest;
}

function refusalV1(
  common: CommonResultV1,
  reason: RefusalReasonV1,
  normalizedResidualFraction: number | null,
): MainWireStandard70BaselineLocalProposalV1 {
  return Object.freeze({
    ...common,
    status: "refused" as const,
    reason,
    normalizedResidualFraction,
  });
}

function rowKeyV1(input: Readonly<{
  conditionId: string;
  checkId: string;
}>): string {
  return `${input.conditionId}::${input.checkId}`;
}

function dotV1(left: readonly number[], right: readonly number[]): number {
  return left.reduce((sum, value, index) => sum + value * right[index]!, 0);
}

function vectorNormV1(vector: readonly number[]): number {
  return Math.hypot(...vector);
}

function nearlyEqualV1(left: number, right: number): boolean {
  return Math.abs(left - right)
    <= 128 * Number.EPSILON * Math.max(1, Math.abs(left), Math.abs(right));
}
