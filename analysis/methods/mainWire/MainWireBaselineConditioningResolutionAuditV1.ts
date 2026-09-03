import {
  canonicalJsonStringify,
  sha256CanonicalJsonHex,
} from "@/engine/integrity";
import type {
  MainWireIntegratedModelBaselineValidationCheckIdV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelBaselineValidationV1";
import {
  buildMainWireBaselineConditioningAdmittedMatrixV1,
  buildMainWireBaselineConditioningSpectrumV1,
  verifyMainWireBaselineConditioningAuditV1,
  type MainWireBaselineConditioningAuditV1,
  type MainWireBaselineConditioningSensitivityV1,
  type MainWireBaselineConditioningSpectrumV1,
  type MainWireBaselineConditioningTaskResultV1,
} from "@/analysis/methods/mainWire/MainWireBaselineConditioningAuditV1";
import type {
  MainWireBaselineNumericalFloorMetricV1,
} from "@/analysis/methods/mainWire/MainWireBaselineNumericalFloorAuditV1";
import {
  verifyMainWireStandard70BaselineNumericalFloorAuditV1,
  type MainWireStandard70BaselineNumericalFloorAuditV1,
} from "@/analysis/methods/mainWire/MainWireStandard70BaselineNumericalFloorAuditV1";
import type {
  MainWireBaselineCalibrationParameterIdV1,
} from "@/analysis/policies/mainWire/MainWireBaselineCalibrationParametersV1";
import {
  MAIN_WIRE_BASELINE_CONDITIONING_STUDY_SOURCE_V1,
} from "@/analysis/policies/mainWire/MainWireBaselineConditioningStudyV1";

export const MAIN_WIRE_BASELINE_CONDITIONING_RESOLUTION_AUDIT_V1_ID =
  "main-wire-baseline-conditioning-resolution-audit-v1" as const;

export const MAIN_WIRE_BASELINE_CONDITIONING_RESOLUTION_POLICY_V1 =
  Object.freeze({
    endpointDifferenceFloorMultiplier: 2 as const,
    numericalFloorTransport:
      "baseline-local-reference-applied-across-conditions-not-error-bound" as const,
    rankToleranceComposition:
      "maximum-of-machine-step-halving-and-baseline-floor-reference-frobenius" as const,
    baselineFloorStressInterpretation:
      "comparative-rank-under-hypothetical-componentwise-endpoint-budget-not-error-bound" as const,
  });

export type MainWireBaselineConditioningResolutionSpectrumV1 = Readonly<{
  coordinateIds: readonly MainWireBaselineCalibrationParameterIdV1[];
  candidateRowCount: number;
  rowCount: number;
  excludedRows: MainWireBaselineConditioningSpectrumV1["excludedRows"];
  singularValues: readonly number[];
  numericalRank: number;
  numericalRankTolerance: number;
  stepStablePracticalRank: number;
  stepStablePracticalRankTolerance: number;
  stepStablePracticalConditionNumber: number | null;
  observedStepHalvingPerturbationFrobeniusNorm: number;
  baselineFloorStressPerturbationFrobeniusNorm: number;
  baselineFloorStressColumnNorms: Readonly<Record<string, number>>;
  baselineFloorStressNormsByCheckId: Readonly<Record<string, number>>;
  baselineFloorStressRank: number;
  baselineFloorStressRankTolerance: number;
  baselineFloorStressSingularValueRatiosToTolerance:
    readonly (number | null)[];
  baselineFloorStressConditionNumber: number | null;
  baselineFloorStressDominatesStepHalving: boolean;
}>;

export type MainWireBaselineConditioningResolutionAuditV1 = Readonly<{
  auditId: typeof MAIN_WIRE_BASELINE_CONDITIONING_RESOLUTION_AUDIT_V1_ID;
  status: "completed";
  source: Readonly<{
    conditioningAuditId: string;
    conditioningArtifactIdentitySha256: string;
    studyIdentitySha256: string;
    conditioningMode: "primary-envelope" | "full-envelope";
    conditioningNominalDtSec: number;
    numericalFloorAuditId: string;
    numericalFloorArtifactIdentitySha256: string;
    numericalFloorCoarseDtSec: number;
    numericalFloorFineDtSec: number;
    exactModelIdentitySha256: string;
    constructionPolicyIdentitySha256: string;
  }>;
  policy: typeof MAIN_WIRE_BASELINE_CONDITIONING_RESOLUTION_POLICY_V1;
  primarySpectrum: MainWireBaselineConditioningResolutionSpectrumV1;
  alternativeSubsetSpectra: readonly Readonly<{
    coordinateIds: readonly MainWireBaselineCalibrationParameterIdV1[];
    spectrum: MainWireBaselineConditioningResolutionSpectrumV1;
    stepStableFullRank: boolean;
    baselineFloorStressFullRank: boolean;
  }>[];
  summary: Readonly<{
    stepStableFullRankSubsetCount: number;
    baselineFloorStressFullRankSubsetCount: number;
    baselineFloorStressFullRankMultiCoordinateSubsets:
      readonly (readonly MainWireBaselineCalibrationParameterIdV1[])[];
  }>;
  claim: Readonly<{
    localDiagnosticOnly: true;
    baselineNumericalFloorIsEnvelopeBound: false;
    baselineFloorStressUsedAsAdmissionGate: false;
    numericalFloorIsClinicalTolerance: false;
    parameterSubsetAutomaticallySelected: false;
    inferentialUncertaintyClaimed: false;
  }>;
}>;

/**
 * Adds a separately visible baseline-dt resolution scale to an already
 * verified conditioning audit. It does not replace the fixed-dt step-halving
 * diagnostic and does not claim that the baseline floor bounds every envelope
 * condition.
 */
export async function buildMainWireBaselineConditioningResolutionAuditV1(
  conditioningInput: unknown,
  numericalFloorInput: unknown,
): Promise<MainWireBaselineConditioningResolutionAuditV1> {
  const conditioning =
    await verifyMainWireBaselineConditioningAuditV1(conditioningInput);
  const numericalFloor =
    await verifyMainWireStandard70BaselineNumericalFloorAuditV1(
      numericalFloorInput,
    );
  if (
    conditioning.status !== "completed"
    || (conditioning.mode !== "primary-envelope"
      && conditioning.mode !== "full-envelope")
    || conditioning.primarySpectrum === null
  ) {
    throw new Error(
      "resolution audit requires a completed Standard70 envelope conditioning audit",
    );
  }
  assertMainWireBaselineConditioningResolutionDtCompatibilityV1(
    numericalFloor,
  );
  const numericalPolicy =
    MAIN_WIRE_BASELINE_CONDITIONING_STUDY_SOURCE_V1.numericalPolicy;
  const floorById = numericalFloorIndexV1(numericalFloor.metricFloors);
  const primarySpectrum =
    buildMainWireBaselineConditioningResolutionSpectrumV1({
      sensitivities: conditioning.sensitivities,
      evaluations: conditioning.evaluations,
      numericalFloors: floorById,
      coordinateIds: conditioning.primarySpectrum.coordinateIds,
      stepStableSpectrum: conditioning.primarySpectrum,
    });
  const alternativeSubsetSpectra = Object.freeze(
    conditioning.primaryAlternativeSubsetSpectra.map((candidate) => {
      const spectrum = buildMainWireBaselineConditioningResolutionSpectrumV1({
        sensitivities: conditioning.sensitivities,
        evaluations: conditioning.evaluations,
        numericalFloors: floorById,
        coordinateIds: candidate.coordinateIds,
        stepStableSpectrum: candidate.spectrum,
      });
      return Object.freeze({
        coordinateIds: Object.freeze([...candidate.coordinateIds]),
        spectrum,
        stepStableFullRank:
          spectrum.stepStablePracticalRank === candidate.coordinateIds.length,
        baselineFloorStressFullRank:
          spectrum.baselineFloorStressRank
            === candidate.coordinateIds.length,
      });
    }),
  );
  const baselineFloorStressFullRankMultiCoordinateSubsets =
    alternativeSubsetSpectra
      .filter(({ coordinateIds, baselineFloorStressFullRank }) =>
        coordinateIds.length > 1 && baselineFloorStressFullRank)
      .map(({ coordinateIds }) => coordinateIds);
  return Object.freeze({
    auditId: MAIN_WIRE_BASELINE_CONDITIONING_RESOLUTION_AUDIT_V1_ID,
    status: "completed" as const,
    source: Object.freeze({
      conditioningAuditId: conditioning.auditId,
      conditioningArtifactIdentitySha256:
        await sha256CanonicalJsonHex(conditioning),
      studyIdentitySha256: conditioning.studyIdentitySha256,
      conditioningMode: conditioning.mode,
      conditioningNominalDtSec: numericalPolicy.explorationNominalDtSec,
      numericalFloorAuditId: numericalFloor.auditId,
      numericalFloorArtifactIdentitySha256:
        await sha256CanonicalJsonHex(numericalFloor),
      numericalFloorCoarseDtSec: numericalFloor.coarseDtSec,
      numericalFloorFineDtSec: numericalFloor.fineDtSec,
      exactModelIdentitySha256:
        numericalFloor.target.exactModelIdentitySha256,
      constructionPolicyIdentitySha256:
        numericalFloor.target.constructionPolicyIdentitySha256,
    }),
    policy: MAIN_WIRE_BASELINE_CONDITIONING_RESOLUTION_POLICY_V1,
    primarySpectrum,
    alternativeSubsetSpectra,
    summary: Object.freeze({
      stepStableFullRankSubsetCount: alternativeSubsetSpectra.filter(
        ({ stepStableFullRank }) => stepStableFullRank,
      ).length,
      baselineFloorStressFullRankSubsetCount: alternativeSubsetSpectra.filter(
        ({ baselineFloorStressFullRank }) => baselineFloorStressFullRank,
      ).length,
      baselineFloorStressFullRankMultiCoordinateSubsets: Object.freeze(
        baselineFloorStressFullRankMultiCoordinateSubsets,
      ),
    }),
    claim: Object.freeze({
      localDiagnosticOnly: true as const,
      baselineNumericalFloorIsEnvelopeBound: false as const,
      baselineFloorStressUsedAsAdmissionGate: false as const,
      numericalFloorIsClinicalTolerance: false as const,
      parameterSubsetAutomaticallySelected: false as const,
      inferentialUncertaintyClaimed: false as const,
    }),
  });
}

export function assertMainWireBaselineConditioningResolutionDtCompatibilityV1(
  numericalFloor: Readonly<{ coarseDtSec: number; fineDtSec: number }>,
): void {
  const numericalPolicy =
    MAIN_WIRE_BASELINE_CONDITIONING_STUDY_SOURCE_V1.numericalPolicy;
  if (
    numericalFloor.coarseDtSec !== numericalPolicy.explorationNominalDtSec
    || numericalFloor.fineDtSec !== numericalPolicy.finalistRefinedDtSec
  ) {
    throw new Error(
      "resolution audit numerical-floor dt differs from conditioning policy",
    );
  }
}

export function buildMainWireBaselineConditioningResolutionSpectrumV1(
  input: Readonly<{
    sensitivities: readonly MainWireBaselineConditioningSensitivityV1[];
    evaluations: readonly MainWireBaselineConditioningTaskResultV1[];
    numericalFloors: ReadonlyMap<
      MainWireIntegratedModelBaselineValidationCheckIdV1,
      MainWireBaselineNumericalFloorMetricV1
    >;
    coordinateIds: readonly MainWireBaselineCalibrationParameterIdV1[];
    stepStableSpectrum: MainWireBaselineConditioningSpectrumV1;
  }>,
): MainWireBaselineConditioningResolutionSpectrumV1 {
  const coordinateIds = [...input.coordinateIds];
  const matrix = buildMainWireBaselineConditioningAdmittedMatrixV1(
    input.sensitivities,
    coordinateIds,
  );
  const reconstructedSpectrum = buildMainWireBaselineConditioningSpectrumV1(
    input.sensitivities,
    coordinateIds,
  );
  if (
    reconstructedSpectrum === null
    || canonicalJsonStringify(reconstructedSpectrum)
      !== canonicalJsonStringify(input.stepStableSpectrum)
  ) {
    throw new Error("resolution audit does not reproduce step-stable spectrum");
  }
  const weighted = matrix.rows.map((row) => {
    const floor = input.numericalFloors.get(row.checkId);
    if (floor === undefined) {
      throw new Error(`resolution floor is missing for ${row.checkId}`);
    }
    if (
      floor.unit !== row.unit
      || floor.constructionCorridorWidth !== row.constructionCorridorWidth
    ) {
      throw new Error(`resolution floor contract differs for ${row.checkId}`);
    }
    return Object.freeze({
      floor: coordinateIds.map((coordinateId) => {
        const transformedSpan = halfStepTransformedSpanV1(
          input.evaluations,
          row.conditionId,
          coordinateId,
        );
        return MAIN_WIRE_BASELINE_CONDITIONING_RESOLUTION_POLICY_V1
          .endpointDifferenceFloorMultiplier
          * floor.numericalFloorAbsolute
          / floor.constructionCorridorWidth
          / transformedSpan
          / row.weightDivisor;
      }),
    });
  });
  const floorRows = weighted.map(({ floor }) => floor);
  const singularValues = [...reconstructedSpectrum.singularValues];
  const stepTolerance = reconstructedSpectrum.practicalRankTolerance;
  const stepRank = reconstructedSpectrum.practicalRank;
  const floorFrobenius = frobeniusNormV1(floorRows);
  const floorTolerance = Math.max(stepTolerance, floorFrobenius);
  const floorRank = singularValues.filter((value) =>
    value > floorTolerance).length;
  const floorColumns = coordinateIds.map((_, columnIndex) =>
    floorRows.map((row) => row[columnIndex]!));
  const floorRowsByCheckId = new Map<string, readonly number[][]>();
  for (const [index, row] of matrix.rows.entries()) {
    const current = floorRowsByCheckId.get(row.checkId) ?? [];
    floorRowsByCheckId.set(
      row.checkId,
      [...current, floorRows[index]!],
    );
  }
  return Object.freeze({
    coordinateIds: Object.freeze(coordinateIds),
    candidateRowCount: matrix.candidateRowCount,
    rowCount: matrix.rows.length,
    excludedRows: matrix.excludedRows,
    singularValues: Object.freeze(singularValues),
    numericalRank: reconstructedSpectrum.numericalRank,
    numericalRankTolerance: reconstructedSpectrum.numericalRankTolerance,
    stepStablePracticalRank: stepRank,
    stepStablePracticalRankTolerance: stepTolerance,
    stepStablePracticalConditionNumber:
      reconstructedSpectrum.practicalConditionNumber,
    observedStepHalvingPerturbationFrobeniusNorm:
      reconstructedSpectrum.observedStepHalvingPerturbationFrobeniusNorm,
    baselineFloorStressPerturbationFrobeniusNorm: floorFrobenius,
    baselineFloorStressColumnNorms: Object.freeze(Object.fromEntries(
      coordinateIds.map((coordinateId, index) =>
        [coordinateId, vectorNormV1(floorColumns[index]!)]),
    )),
    baselineFloorStressNormsByCheckId: Object.freeze(Object.fromEntries(
      [...floorRowsByCheckId.entries()].map(([checkId, rows]) =>
        [checkId, frobeniusNormV1(rows)]),
    )),
    baselineFloorStressRank: floorRank,
    baselineFloorStressRankTolerance: floorTolerance,
    baselineFloorStressSingularValueRatiosToTolerance: Object.freeze(
      singularValues.map((value) => floorTolerance > 0
        ? value / floorTolerance
        : null),
    ),
    baselineFloorStressConditionNumber:
      practicalConditionNumberV1(singularValues, floorRank, coordinateIds.length),
    baselineFloorStressDominatesStepHalving:
      floorFrobenius > reconstructedSpectrum
        .observedStepHalvingPerturbationFrobeniusNorm,
  });
}

function numericalFloorIndexV1(
  floors: readonly MainWireBaselineNumericalFloorMetricV1[],
): ReadonlyMap<
  MainWireIntegratedModelBaselineValidationCheckIdV1,
  MainWireBaselineNumericalFloorMetricV1
> {
  const byId = new Map<
    MainWireIntegratedModelBaselineValidationCheckIdV1,
    MainWireBaselineNumericalFloorMetricV1
  >();
  for (const floor of floors) {
    if (byId.has(floor.checkId)) {
      throw new Error(`resolution floor is duplicated for ${floor.checkId}`);
    }
    byId.set(floor.checkId, floor);
  }
  return byId;
}

function halfStepTransformedSpanV1(
  evaluations: readonly MainWireBaselineConditioningTaskResultV1[],
  conditionId: string,
  coordinateId: MainWireBaselineCalibrationParameterIdV1,
): number {
  const matches = (direction: -1 | 1) => evaluations.find(({ task }) =>
    task.conditionId === conditionId
    && task.coordinateId === coordinateId
    && task.direction === direction
    && task.stepFraction === 0.5);
  const minus = matches(-1);
  const plus = matches(1);
  if (
    minus?.evaluationStatus !== "accepted"
    || plus?.evaluationStatus !== "accepted"
    || minus.transformedCoordinateValue === null
    || plus.transformedCoordinateValue === null
  ) {
    throw new Error(
      `resolution half-step span is unavailable for ${conditionId}/${coordinateId}`,
    );
  }
  const span = plus.transformedCoordinateValue
    - minus.transformedCoordinateValue;
  if (!(span > 0) || !Number.isFinite(span)) {
    throw new Error(
      `resolution half-step span is invalid for ${conditionId}/${coordinateId}`,
    );
  }
  return span;
}

function practicalConditionNumberV1(
  singularValues: readonly number[],
  rank: number,
  coordinateCount: number,
): number | null {
  return rank < coordinateCount
    ? null
    : singularValues[0]! / singularValues[coordinateCount - 1]!;
}

function frobeniusNormV1(rows: readonly (readonly number[])[]): number {
  return Math.sqrt(rows.reduce((sum, row) =>
    sum + row.reduce((rowSum, value) => rowSum + value * value, 0), 0));
}

function vectorNormV1(values: readonly number[]): number {
  return Math.sqrt(values.reduce((sum, value) => sum + value * value, 0));
}
