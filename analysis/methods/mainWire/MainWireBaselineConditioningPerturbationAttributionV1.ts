import {
  canonicalJsonStringify,
  sha256CanonicalJsonHex,
} from "@/engine/integrity";
import {
  buildMainWireBaselineConditioningAdmittedMatrixV1,
  verifyMainWireBaselineConditioningAuditV1,
  type MainWireBaselineConditioningSensitivityV1,
} from "@/analysis/methods/mainWire/MainWireBaselineConditioningAuditV1";
import {
  verifyMainWireBaselineConditioningRefinedDerivativeAuditV1,
  type MainWireBaselineConditioningRefinedDerivativeSubsetV1,
} from "@/analysis/methods/mainWire/MainWireBaselineConditioningRefinedDerivativeAuditV1";
import type {
  MainWireBaselineCalibrationParameterIdV1,
} from "@/analysis/policies/mainWire/MainWireBaselineCalibrationParametersV1";

export const MAIN_WIRE_BASELINE_CONDITIONING_PERTURBATION_ATTRIBUTION_V1_ID =
  "main-wire-baseline-conditioning-perturbation-attribution-v1" as const;

export const MAIN_WIRE_BASELINE_CONDITIONING_PERTURBATION_ATTRIBUTION_POLICY_V1 =
  Object.freeze({
    rowBasis:
      "common-admitted-corridor-normalized-evidence-group-weighted" as const,
    aggregation: "root-sum-of-squares" as const,
    changesAdmission: false as const,
  });

type PerturbationNormsV1 = Readonly<{
  coarseStepHalving: number;
  refinedStepHalving: number;
  coarseRefinedDerivative: number;
}>;

export type MainWireBaselineConditioningPerturbationRowAttributionV1 =
  PerturbationNormsV1 & Readonly<{
    conditionId: string;
    checkId: string;
  }>;

export type MainWireBaselineConditioningPerturbationSubsetAttributionV1 =
  Readonly<{
    coordinateIds: readonly MainWireBaselineCalibrationParameterIdV1[];
    rowCount: number;
    aggregate: PerturbationNormsV1;
    rows:
      readonly MainWireBaselineConditioningPerturbationRowAttributionV1[];
    byCheckId: readonly (PerturbationNormsV1 & Readonly<{
      checkId: string;
    }>)[];
    byConditionId: readonly (PerturbationNormsV1 & Readonly<{
      conditionId: string;
    }>)[];
  }>;

export type MainWireBaselineConditioningPerturbationAttributionV1 = Readonly<{
  auditId:
    typeof MAIN_WIRE_BASELINE_CONDITIONING_PERTURBATION_ATTRIBUTION_V1_ID;
  status: "completed";
  source: Readonly<{
    coarseAuditId: string;
    coarseArtifactIdentitySha256: string;
    refinedAuditId: string;
    refinedArtifactIdentitySha256: string;
    studyIdentitySha256: string;
    exactModelIdentitySha256: string;
    constructionPolicyIdentitySha256: string;
  }>;
  policy:
    typeof MAIN_WIRE_BASELINE_CONDITIONING_PERTURBATION_ATTRIBUTION_POLICY_V1;
  subsets:
    readonly MainWireBaselineConditioningPerturbationSubsetAttributionV1[];
  claim: Readonly<{
    attributionOnly: true;
    changesSourceAdmission: false;
    observationRoleAssigned: false;
    parameterSubsetAutomaticallySelected: false;
    causalExplanationClaimed: false;
  }>;
}>;

export async function buildMainWireBaselineConditioningPerturbationAttributionV1(
  coarseInput: unknown,
  refinedInput: unknown,
): Promise<MainWireBaselineConditioningPerturbationAttributionV1> {
  const coarse = await verifyMainWireBaselineConditioningAuditV1(coarseInput);
  const refined =
    await verifyMainWireBaselineConditioningRefinedDerivativeAuditV1(
      refinedInput,
      coarse,
    );
  if (coarse.status !== "completed" || refined.status !== "completed") {
    throw new Error("perturbation attribution requires completed source audits");
  }
  const subsets = Object.freeze(refined.subsetDiagnostics.map((subset) =>
    buildSubsetAttributionV1(
      coarse.sensitivities,
      refined.fineSensitivities,
      subset,
    )));
  return Object.freeze({
    auditId:
      MAIN_WIRE_BASELINE_CONDITIONING_PERTURBATION_ATTRIBUTION_V1_ID,
    status: "completed" as const,
    source: Object.freeze({
      coarseAuditId: coarse.auditId,
      coarseArtifactIdentitySha256: await sha256CanonicalJsonHex(coarse),
      refinedAuditId: refined.auditId,
      refinedArtifactIdentitySha256: await sha256CanonicalJsonHex(refined),
      studyIdentitySha256: refined.source.studyIdentitySha256,
      exactModelIdentitySha256: refined.source.exactModelIdentitySha256,
      constructionPolicyIdentitySha256:
        refined.source.constructionPolicyIdentitySha256,
    }),
    policy:
      MAIN_WIRE_BASELINE_CONDITIONING_PERTURBATION_ATTRIBUTION_POLICY_V1,
    subsets,
    claim: Object.freeze({
      attributionOnly: true as const,
      changesSourceAdmission: false as const,
      observationRoleAssigned: false as const,
      parameterSubsetAutomaticallySelected: false as const,
      causalExplanationClaimed: false as const,
    }),
  });
}

export async function verifyMainWireBaselineConditioningPerturbationAttributionV1(
  input: unknown,
  coarseInput: unknown,
  refinedInput: unknown,
): Promise<MainWireBaselineConditioningPerturbationAttributionV1> {
  const rebuilt =
    await buildMainWireBaselineConditioningPerturbationAttributionV1(
      coarseInput,
      refinedInput,
    );
  if (canonicalJsonStringify(rebuilt) !== canonicalJsonStringify(input)) {
    throw new Error(
      "perturbation attribution differs from its reconstruction",
    );
  }
  return input as MainWireBaselineConditioningPerturbationAttributionV1;
}

function buildSubsetAttributionV1(
  coarseSensitivities: readonly MainWireBaselineConditioningSensitivityV1[],
  refinedSensitivities: readonly MainWireBaselineConditioningSensitivityV1[],
  source: MainWireBaselineConditioningRefinedDerivativeSubsetV1,
): MainWireBaselineConditioningPerturbationSubsetAttributionV1 {
  const coordinateIds = source.coordinateIds;
  const coarseRaw = buildMainWireBaselineConditioningAdmittedMatrixV1(
    coarseSensitivities,
    coordinateIds,
  );
  const refinedRaw = buildMainWireBaselineConditioningAdmittedMatrixV1(
    refinedSensitivities,
    coordinateIds,
  );
  const refinedKeys = new Set(refinedRaw.rows.map(rowKeyV1));
  const commonKeys = new Set(coarseRaw.rows.map(rowKeyV1).filter((key) =>
    refinedKeys.has(key)));
  const coarseCommon = buildMainWireBaselineConditioningAdmittedMatrixV1(
    coarseSensitivities.filter((sensitivity) =>
      commonKeys.has(sensitivityKeyV1(sensitivity))),
    coordinateIds,
  );
  const refinedCommon = buildMainWireBaselineConditioningAdmittedMatrixV1(
    refinedSensitivities.filter((sensitivity) =>
      commonKeys.has(sensitivityKeyV1(sensitivity))),
    coordinateIds,
  );
  const refinedByKey = new Map(refinedCommon.rows.map((row) =>
    [rowKeyV1(row), row] as const));
  const rows = Object.freeze(coarseCommon.rows.map((coarseRow) => {
    const refinedRow = refinedByKey.get(rowKeyV1(coarseRow));
    if (
      refinedRow === undefined
      || refinedRow.weightDivisor !== coarseRow.weightDivisor
      || refinedRow.unit !== coarseRow.unit
      || refinedRow.constructionCorridorWidth
        !== coarseRow.constructionCorridorWidth
    ) {
      throw new Error("perturbation attribution row contracts differ");
    }
    const coarseFull = weightedV1(
      coarseRow.fullStepRow,
      coarseRow.weightDivisor,
    );
    const coarseHalf = weightedV1(
      coarseRow.halfStepRow,
      coarseRow.weightDivisor,
    );
    const refinedFull = weightedV1(
      refinedRow.fullStepRow,
      refinedRow.weightDivisor,
    );
    const refinedHalf = weightedV1(
      refinedRow.halfStepRow,
      refinedRow.weightDivisor,
    );
    return Object.freeze({
      conditionId: coarseRow.conditionId,
      checkId: coarseRow.checkId,
      coarseStepHalving: differenceNormV1(coarseHalf, coarseFull),
      refinedStepHalving: differenceNormV1(refinedHalf, refinedFull),
      coarseRefinedDerivative: differenceNormV1(coarseHalf, refinedHalf),
    });
  }));
  if (rows.length !== source.commonAdmittedRowCount) {
    throw new Error("perturbation attribution row count differs from source");
  }
  const aggregate = aggregateNormsV1(rows);
  assertSourceAggregateV1(aggregate, source);
  return Object.freeze({
    coordinateIds: Object.freeze([...coordinateIds]),
    rowCount: rows.length,
    aggregate,
    rows,
    byCheckId: aggregateByV1(rows, "checkId"),
    byConditionId: aggregateByV1(rows, "conditionId"),
  });
}

function aggregateByV1<Key extends "checkId" | "conditionId">(
  rows: readonly MainWireBaselineConditioningPerturbationRowAttributionV1[],
  key: Key,
): readonly (PerturbationNormsV1 & Readonly<Record<Key, string>>)[] {
  const grouped = new Map<string,
    MainWireBaselineConditioningPerturbationRowAttributionV1[]>();
  for (const row of rows) {
    grouped.set(row[key], [...(grouped.get(row[key]) ?? []), row]);
  }
  return Object.freeze([...grouped.entries()]
    .sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0)
    .map(([id, members]) => Object.freeze({
      [key]: id,
      ...aggregateNormsV1(members),
    }) as PerturbationNormsV1 & Readonly<Record<Key, string>>));
}

function aggregateNormsV1(
  rows: readonly PerturbationNormsV1[],
): PerturbationNormsV1 {
  const rootSumSquares = (key: keyof PerturbationNormsV1) => Math.sqrt(
    rows.reduce((sum, row) => sum + row[key] ** 2, 0),
  );
  return Object.freeze({
    coarseStepHalving: rootSumSquares("coarseStepHalving"),
    refinedStepHalving: rootSumSquares("refinedStepHalving"),
    coarseRefinedDerivative: rootSumSquares("coarseRefinedDerivative"),
  });
}

function assertSourceAggregateV1(
  aggregate: PerturbationNormsV1,
  source: MainWireBaselineConditioningRefinedDerivativeSubsetV1,
): void {
  for (const [actual, expected] of [
    [
      aggregate.coarseStepHalving,
      source.coarseStepHalvingPerturbationFrobeniusNorm,
    ],
    [
      aggregate.refinedStepHalving,
      source.refinedStepHalvingPerturbationFrobeniusNorm,
    ],
    [
      aggregate.coarseRefinedDerivative,
      source.coarseRefinedDerivativePerturbationFrobeniusNorm,
    ],
  ] as const) {
    const tolerance = Math.max(1, Math.abs(expected)) * 1e-12;
    if (Math.abs(actual - expected) > tolerance) {
      throw new Error("perturbation attribution does not reproduce source norm");
    }
  }
}

function weightedV1(values: readonly number[], divisor: number): number[] {
  return values.map((value) => value / divisor);
}

function differenceNormV1(
  left: readonly number[],
  right: readonly number[],
): number {
  if (left.length !== right.length) {
    throw new Error("perturbation attribution row shapes differ");
  }
  return Math.sqrt(left.reduce((sum, value, index) =>
    sum + (value - right[index]!) ** 2, 0));
}

function rowKeyV1(row: Readonly<{
  conditionId: string;
  checkId: string;
}>): string {
  return `${row.conditionId}::${row.checkId}`;
}

function sensitivityKeyV1(
  sensitivity: MainWireBaselineConditioningSensitivityV1,
): string {
  return rowKeyV1(sensitivity);
}
