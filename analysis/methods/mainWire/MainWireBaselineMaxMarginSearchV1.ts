import type {
  MainWireIntegratedModelBaselineValidationCheckIdV1,
  MainWireIntegratedModelBaselineValidationCheckV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelBaselineValidationV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_BASELINE_HEMODYNAMIC_INPUTS_V1,
  MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_BASELINE_MECHANISM_INPUTS_V1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelRoundedEjectionBaselineV1";
import type {
  MainWireBaselineNumericalFloorMetricV1,
} from "@/analysis/methods/mainWire/MainWireBaselineNumericalFloorAuditV1";
import {
  applyMainWireBaselineCalibrationParametersV1,
  mainWireBaselineCalibrationParameterV1,
  readMainWireBaselineCalibrationParameterV1,
  transformMainWireBaselineCalibrationParameterV1,
  type MainWireBaselineCalibrationCandidateInputsV1,
  type MainWireBaselineCalibrationParameterIdV1,
} from "@/analysis/policies/mainWire/MainWireBaselineCalibrationParametersV1";
import {
  MAIN_WIRE_BASELINE_CONDITIONING_STUDY_SOURCE_V1,
} from "@/analysis/policies/mainWire/MainWireBaselineConditioningStudyV1";

export const MAIN_WIRE_BASELINE_MAX_MARGIN_SEARCH_V1_ID =
  "main-wire-baseline-max-margin-search-v1" as const;

export type MainWireBaselineSearchStageV1 = "initial" | "refinement";

export type MainWireBaselineSearchCandidateV1 = Readonly<{
  candidateId: string;
  stage: MainWireBaselineSearchStageV1;
  ordinal: number;
  coordinateValues: Readonly<Record<string, number>>;
  transformedCoordinateValues: Readonly<Record<string, number>>;
  candidateInputs: MainWireBaselineCalibrationCandidateInputsV1;
}>;

export type MainWireBaselineBufferedMarginV1 = Readonly<{
  checkId: MainWireIntegratedModelBaselineValidationCheckIdV1;
  unit: string;
  actual: number;
  minimum: number;
  maximum: number;
  numericalFloorAbsolute: number;
  numericalFloorFractionOfCorridor: number | null;
  unbufferedInteriorMargin: number | null;
  bufferedInteriorMargin: number | null;
  status: "passed" | "failed";
}>;

export type MainWireBaselineCandidateObjectiveV1 = Readonly<{
  objectiveId: typeof MAIN_WIRE_BASELINE_MAX_MARGIN_SEARCH_V1_ID;
  status: "feasible" | "corridor-rejected";
  worstBufferedInteriorMargin: number | null;
  referenceDepartureRms: number;
  failedCheckIds: readonly MainWireIntegratedModelBaselineValidationCheckIdV1[];
  activeMargins: readonly MainWireBaselineBufferedMarginV1[];
  margins: readonly MainWireBaselineBufferedMarginV1[];
}>;

export function buildMainWireBaselineSearchDesignV1(input: Readonly<{
  stage: MainWireBaselineSearchStageV1;
  center?: MainWireBaselineCalibrationCandidateInputsV1;
}>): readonly MainWireBaselineSearchCandidateV1[] {
  const policy = MAIN_WIRE_BASELINE_CONDITIONING_STUDY_SOURCE_V1.searchPolicy;
  const reference = baselineCandidateV1();
  const center = input.center ?? reference;
  const count = input.stage === "initial"
    ? policy.initialCandidateCountIncludingReference
    : policy.refinementCandidateCountIncludingCenter;
  const contraction = input.stage === "initial"
    ? 1
    : policy.refinementContraction;
  const coordinateIds = policy.coordinateIds;
  const bounds = coordinateIds.map((coordinateId) => {
    const descriptor = mainWireBaselineCalibrationParameterV1(coordinateId);
    const centerValue = readMainWireBaselineCalibrationParameterV1(
      center,
      coordinateId,
    );
    const centerTransformed =
      transformMainWireBaselineCalibrationParameterV1(
        coordinateId,
        centerValue,
      );
    const domainMinimum =
      transformMainWireBaselineCalibrationParameterV1(
        coordinateId,
        descriptor.minimum,
      );
    const domainMaximum =
      transformMainWireBaselineCalibrationParameterV1(
        coordinateId,
        descriptor.maximum,
      );
    const halfSpan = policy.transformedDomainHalfSpanFraction
      * (domainMaximum - domainMinimum)
      * contraction;
    return Object.freeze({
      coordinateId,
      minimum: Math.max(domainMinimum, centerTransformed - halfSpan),
      maximum: Math.min(domainMaximum, centerTransformed + halfSpan),
    });
  });
  const candidates: MainWireBaselineSearchCandidateV1[] = [];
  for (let ordinal = 0; ordinal < count; ordinal += 1) {
    const target = ordinal === 0
      ? center
      : applyMainWireBaselineCalibrationParametersV1(
          center,
          bounds.map((bound, dimension) => {
            const fraction = haltonV1(
              policy.haltonSkip + ordinal,
              primeV1(dimension),
            );
            const transformed = bound.minimum
              + fraction * (bound.maximum - bound.minimum);
            const descriptor = mainWireBaselineCalibrationParameterV1(
              bound.coordinateId,
            );
            return Object.freeze({
              parameterId: bound.coordinateId,
              value: descriptor.transform === "log"
                ? Math.exp(transformed)
                : transformed,
            });
          }),
        );
    candidates.push(candidateV1(input.stage, ordinal, target));
  }
  return Object.freeze(candidates);
}

export function scoreMainWireBaselineCandidateObjectiveV1(input: Readonly<{
  checks: readonly MainWireIntegratedModelBaselineValidationCheckV1[];
  candidate: MainWireBaselineCalibrationCandidateInputsV1;
  numericalFloors: readonly MainWireBaselineNumericalFloorMetricV1[];
}>): MainWireBaselineCandidateObjectiveV1 {
  const policy = MAIN_WIRE_BASELINE_CONDITIONING_STUDY_SOURCE_V1.searchPolicy;
  const floorById = new Map(input.numericalFloors.map((floor) =>
    [floor.checkId, floor] as const));
  const margins = input.checks.map((check) => {
    const width = check.maximum - check.minimum;
    const floor = floorById.get(check.checkId);
    if (
      floor !== undefined
      && (floor.unit !== check.unit
        || floor.constructionMinimum !== check.minimum
        || floor.constructionMaximum !== check.maximum)
    ) {
      throw new Error(`numerical floor contract differs for ${check.checkId}`);
    }
    const numericalFloorAbsolute = floor?.numericalFloorAbsolute ?? 0;
    const exactGatePassed = check.status === "passed";
    if (!(width > 0)) {
      return Object.freeze({
        checkId: check.checkId,
        unit: check.unit,
        actual: check.actual,
        minimum: check.minimum,
        maximum: check.maximum,
        numericalFloorAbsolute,
        numericalFloorFractionOfCorridor: null,
        unbufferedInteriorMargin: null,
        bufferedInteriorMargin: null,
        status: exactGatePassed ? "passed" as const : "failed" as const,
      });
    }
    const unbufferedInteriorMargin = Math.min(
      (check.actual - check.minimum) / width,
      (check.maximum - check.actual) / width,
    );
    const bufferedInteriorMargin = unbufferedInteriorMargin
      - policy.numericalFloorBufferMultiples
        * numericalFloorAbsolute / width;
    return Object.freeze({
      checkId: check.checkId,
      unit: check.unit,
      actual: check.actual,
      minimum: check.minimum,
      maximum: check.maximum,
      numericalFloorAbsolute,
      numericalFloorFractionOfCorridor: numericalFloorAbsolute / width,
      unbufferedInteriorMargin,
      bufferedInteriorMargin,
      status: exactGatePassed && bufferedInteriorMargin >= 0
        ? "passed" as const
        : "failed" as const,
    });
  });
  const failedCheckIds = margins.filter(({ status }) => status === "failed")
    .map(({ checkId }) => checkId);
  const continuous = margins.filter((margin) =>
    margin.bufferedInteriorMargin !== null);
  const activeMargins = [...continuous].sort((left, right) =>
    left.bufferedInteriorMargin! - right.bufferedInteriorMargin!)
    .slice(0, 5);
  return Object.freeze({
    objectiveId: MAIN_WIRE_BASELINE_MAX_MARGIN_SEARCH_V1_ID,
    status: failedCheckIds.length === 0
      ? "feasible" as const
      : "corridor-rejected" as const,
    worstBufferedInteriorMargin: activeMargins[0]
      ?.bufferedInteriorMargin ?? null,
    referenceDepartureRms: referenceDepartureRmsV1(input.candidate),
    failedCheckIds: Object.freeze(failedCheckIds),
    activeMargins: Object.freeze(activeMargins),
    margins: Object.freeze(margins),
  });
}

/** Negative means `left` ranks ahead of `right`. */
export function compareMainWireBaselineCandidateObjectivesV1(
  left: MainWireBaselineCandidateObjectiveV1,
  right: MainWireBaselineCandidateObjectiveV1,
): number {
  if (left.status !== right.status) return left.status === "feasible" ? -1 : 1;
  const leftMargin = left.worstBufferedInteriorMargin
    ?? Number.NEGATIVE_INFINITY;
  const rightMargin = right.worstBufferedInteriorMargin
    ?? Number.NEGATIVE_INFINITY;
  if (leftMargin !== rightMargin) return rightMargin - leftMargin;
  return left.referenceDepartureRms - right.referenceDepartureRms;
}

function candidateV1(
  stage: MainWireBaselineSearchStageV1,
  ordinal: number,
  candidateInputs: MainWireBaselineCalibrationCandidateInputsV1,
): MainWireBaselineSearchCandidateV1 {
  const coordinateIds = MAIN_WIRE_BASELINE_CONDITIONING_STUDY_SOURCE_V1
    .searchPolicy.coordinateIds;
  return Object.freeze({
    candidateId: `${stage}-${ordinal.toString().padStart(2, "0")}`,
    stage,
    ordinal,
    coordinateValues: Object.freeze(Object.fromEntries(coordinateIds.map(
      (coordinateId) => [
        coordinateId,
        readMainWireBaselineCalibrationParameterV1(candidateInputs, coordinateId),
      ],
    ))),
    transformedCoordinateValues: Object.freeze(Object.fromEntries(
      coordinateIds.map((coordinateId) => [
        coordinateId,
        transformMainWireBaselineCalibrationParameterV1(
          coordinateId,
          readMainWireBaselineCalibrationParameterV1(
            candidateInputs,
            coordinateId,
          ),
        ),
      ]),
    )),
    candidateInputs,
  });
}

function referenceDepartureRmsV1(
  candidate: MainWireBaselineCalibrationCandidateInputsV1,
): number {
  const reference = baselineCandidateV1();
  const coordinateIds = MAIN_WIRE_BASELINE_CONDITIONING_STUDY_SOURCE_V1
    .searchPolicy.coordinateIds;
  const squared = coordinateIds.map((coordinateId) => {
    const descriptor = mainWireBaselineCalibrationParameterV1(coordinateId);
    const transformedMinimum = transformMainWireBaselineCalibrationParameterV1(
      coordinateId,
      descriptor.minimum,
    );
    const transformedMaximum = transformMainWireBaselineCalibrationParameterV1(
      coordinateId,
      descriptor.maximum,
    );
    const transformedCandidate = transformMainWireBaselineCalibrationParameterV1(
      coordinateId,
      readMainWireBaselineCalibrationParameterV1(candidate, coordinateId),
    );
    const transformedReference = transformMainWireBaselineCalibrationParameterV1(
      coordinateId,
      readMainWireBaselineCalibrationParameterV1(reference, coordinateId),
    );
    const normalized = (transformedCandidate - transformedReference)
      / (transformedMaximum - transformedMinimum);
    return normalized * normalized;
  });
  return Math.sqrt(squared.reduce((sum, value) => sum + value, 0)
    / squared.length);
}

function baselineCandidateV1(): MainWireBaselineCalibrationCandidateInputsV1 {
  return Object.freeze({
    hemodynamicResearchInputs:
      MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_BASELINE_HEMODYNAMIC_INPUTS_V1,
    mechanismResearchInputs:
      MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_BASELINE_MECHANISM_INPUTS_V1,
    ventricularContractilityScale: 1,
  });
}

function haltonV1(index: number, base: number): number {
  let remaining = index;
  let fraction = 1;
  let result = 0;
  while (remaining > 0) {
    fraction /= base;
    result += fraction * (remaining % base);
    remaining = Math.floor(remaining / base);
  }
  return result;
}

function primeV1(dimension: number): number {
  const primes = [2, 3, 5, 7] as const;
  const prime = primes[dimension];
  if (prime === undefined) {
    throw new Error("baseline search supports at most four coordinates");
  }
  return prime;
}
