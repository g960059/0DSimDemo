import normalReferenceEvidenceV1 from
  "@/data/physiology/main-wire-normal-reference-evidence-v1.json";
import type {
  MainWireIntegratedModelBaselineValidationCheckIdV1,
  MainWireIntegratedModelBaselineValidationCheckV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelBaselineValidationV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_BASELINE_HEMODYNAMIC_INPUTS_V1,
  MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_BASELINE_MECHANISM_INPUTS_V1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelRoundedEjectionBaselineV1";
import {
  indexMainWireBaselineNumericalFloorsV1,
  type MainWireBaselineNumericalFloorMetricV1,
} from "@/analysis/methods/mainWire/MainWireBaselineNumericalFloorAuditV1";
import {
  applyMainWireBaselineCalibrationParametersV1,
  assertMainWireBaselineCalibrationCandidateOnReleaseLatticeV1,
  mainWireBaselineCalibrationParameterV1,
  projectMainWireBaselineCalibrationParameterToReleaseLatticeV1,
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

export type MainWireBaselineSearchStageV1 =
  | "initial"
  | "refinement"
  | "segment"
  | "profile"
  | "release-lattice";

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
  primaryWorstBufferedInteriorMargin: number | null;
  worstBufferedInteriorMargin: number | null;
  referenceDepartureRms: number;
  failedCheckIds: readonly MainWireIntegratedModelBaselineValidationCheckIdV1[];
  primaryActiveMargins: readonly MainWireBaselineBufferedMarginV1[];
  activeMargins: readonly MainWireBaselineBufferedMarginV1[];
  margins: readonly MainWireBaselineBufferedMarginV1[];
}>;

export function buildMainWireBaselineSearchDesignV1(input: Readonly<{
  stage: Exclude<
    MainWireBaselineSearchStageV1,
    "segment" | "profile" | "release-lattice"
  >;
  center?: MainWireBaselineCalibrationCandidateInputsV1;
  contractionOverride?: number;
  coordinateBounds?: Readonly<Partial<Record<
    MainWireBaselineCalibrationParameterIdV1,
    Readonly<{ minimum?: number; maximum?: number }>
  >>>;
}>): readonly MainWireBaselineSearchCandidateV1[] {
  const policy = MAIN_WIRE_BASELINE_CONDITIONING_STUDY_SOURCE_V1.searchPolicy;
  const reference = baselineCandidateV1();
  const center = input.center ?? reference;
  const count = input.stage === "initial"
    ? policy.initialCandidateCountIncludingReference
    : policy.refinementCandidateCountIncludingCenter;
  const contraction = input.contractionOverride ?? (input.stage === "initial"
    ? 1
    : policy.refinementContraction);
  if (!(contraction > 0) || !(contraction <= 1)) {
    throw new Error("baseline search contraction must lie in (0, 1]");
  }
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
    const policyBound = input.coordinateBounds?.[coordinateId];
    const physicalMinimum = policyBound?.minimum ?? descriptor.minimum;
    const physicalMaximum = policyBound?.maximum ?? descriptor.maximum;
    if (
      physicalMinimum < descriptor.minimum
      || physicalMaximum > descriptor.maximum
      || physicalMinimum > physicalMaximum
      || centerValue < physicalMinimum
      || centerValue > physicalMaximum
    ) {
      throw new Error(`baseline search bound is invalid for ${coordinateId}`);
    }
    const allowedMinimum =
      transformMainWireBaselineCalibrationParameterV1(
        coordinateId,
        physicalMinimum,
      );
    const allowedMaximum =
      transformMainWireBaselineCalibrationParameterV1(
        coordinateId,
        physicalMaximum,
      );
    const domainMinimum = transformMainWireBaselineCalibrationParameterV1(
      coordinateId,
      descriptor.minimum,
    );
    const domainMaximum = transformMainWireBaselineCalibrationParameterV1(
      coordinateId,
      descriptor.maximum,
    );
    const halfSpan = policy.transformedDomainHalfSpanFraction
      * (domainMaximum - domainMinimum)
      * contraction;
    return Object.freeze({
      coordinateId,
      minimum: Math.max(allowedMinimum, centerTransformed - halfSpan),
      maximum: Math.min(allowedMaximum, centerTransformed + halfSpan),
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

/**
 * Resolves an observed trade-off boundary with a fixed, very small budget.
 * Interpolation follows each coordinate's declared transform so log-scaled
 * positive parameters are combined geometrically rather than arithmetically.
 */
export function buildMainWireBaselineSegmentDesignV1(input: Readonly<{
  start: MainWireBaselineCalibrationCandidateInputsV1;
  end: MainWireBaselineCalibrationCandidateInputsV1;
}>): readonly MainWireBaselineSearchCandidateV1[] {
  const policy = MAIN_WIRE_BASELINE_CONDITIONING_STUDY_SOURCE_V1.searchPolicy;
  const coordinateIds = policy.coordinateIds;
  const differs = coordinateIds.some((coordinateId) =>
    readMainWireBaselineCalibrationParameterV1(input.start, coordinateId)
      !== readMainWireBaselineCalibrationParameterV1(input.end, coordinateId));
  if (!differs) throw new Error("baseline segment endpoints must differ");
  return Object.freeze(policy.paretoSegmentFractions.map((fraction, ordinal) => {
    const candidateInputs = applyMainWireBaselineCalibrationParametersV1(
      input.start,
      coordinateIds.map((parameterId) => {
        const start = transformMainWireBaselineCalibrationParameterV1(
          parameterId,
          readMainWireBaselineCalibrationParameterV1(input.start, parameterId),
        );
        const end = transformMainWireBaselineCalibrationParameterV1(
          parameterId,
          readMainWireBaselineCalibrationParameterV1(input.end, parameterId),
        );
        const transformed = start + fraction * (end - start);
        const descriptor = mainWireBaselineCalibrationParameterV1(parameterId);
        return Object.freeze({
          parameterId,
          value: descriptor.transform === "log"
            ? Math.exp(transformed)
            : transformed,
        });
      }),
    );
    return candidateV1("segment", ordinal, candidateInputs);
  }));
}

/** Profiles one conditioning-supported residual direction at a fixed budget. */
export function buildMainWireBaselineCoordinateProfileDesignV1(input: Readonly<{
  center: MainWireBaselineCalibrationCandidateInputsV1;
  coordinateId: MainWireBaselineCalibrationParameterIdV1;
  direction: -1 | 1;
}>): readonly MainWireBaselineSearchCandidateV1[] {
  const policy = MAIN_WIRE_BASELINE_CONDITIONING_STUDY_SOURCE_V1.searchPolicy;
  if (!policy.coordinateIds.includes(input.coordinateId)) {
    throw new Error("baseline profile coordinate is outside the search policy");
  }
  const descriptor = mainWireBaselineCalibrationParameterV1(input.coordinateId);
  const centerValue = readMainWireBaselineCalibrationParameterV1(
    input.center,
    input.coordinateId,
  );
  const lowerProbe = centerValue - descriptor.finiteDifferenceStep;
  const upperProbe = centerValue + descriptor.finiteDifferenceStep;
  if (lowerProbe < descriptor.minimum || upperProbe > descriptor.maximum) {
    throw new Error("baseline profile center lacks a symmetric local step");
  }
  const centerTransformed = transformMainWireBaselineCalibrationParameterV1(
    input.coordinateId,
    centerValue,
  );
  const transformedStep = Math.min(
    centerTransformed - transformMainWireBaselineCalibrationParameterV1(
      input.coordinateId,
      lowerProbe,
    ),
    transformMainWireBaselineCalibrationParameterV1(
      input.coordinateId,
      upperProbe,
    ) - centerTransformed,
  );
  return Object.freeze(policy.coordinateProfileStepMultipliers.map(
    (multiplier, ordinal) => {
      const transformed = centerTransformed
        + input.direction * multiplier * transformedStep;
      const value = descriptor.transform === "log"
        ? Math.exp(transformed)
        : transformed;
      const candidateInputs = applyMainWireBaselineCalibrationParametersV1(
        input.center,
        [Object.freeze({ parameterId: input.coordinateId, value })],
      );
      return candidateV1("profile", ordinal, candidateInputs);
    },
  ));
}

/**
 * Projects a continuous exploratory result onto the control catalog lattice,
 * then evaluates each one-step coordinate neighbour with a fixed small budget.
 */
export function buildMainWireBaselineReleaseLatticeDesignV1(input: Readonly<{
  center: MainWireBaselineCalibrationCandidateInputsV1;
}>): readonly MainWireBaselineSearchCandidateV1[] {
  const policy = MAIN_WIRE_BASELINE_CONDITIONING_STUDY_SOURCE_V1.searchPolicy;
  const coordinateIds = policy.coordinateIds;
  const projected = applyMainWireBaselineCalibrationParametersV1(
    input.center,
    coordinateIds.map((parameterId) => Object.freeze({
      parameterId,
      value: projectMainWireBaselineCalibrationParameterToReleaseLatticeV1(
        parameterId,
        readMainWireBaselineCalibrationParameterV1(input.center, parameterId),
      ),
    })),
  );
  const candidates: MainWireBaselineSearchCandidateV1[] = [
    candidateV1("release-lattice", 0, projected),
  ];
  for (const parameterId of coordinateIds) {
    const descriptor = mainWireBaselineCalibrationParameterV1(parameterId);
    const centerValue = readMainWireBaselineCalibrationParameterV1(
      projected,
      parameterId,
    );
    for (const direction of policy.releaseLatticeNeighbourDirections) {
      const value = Number((centerValue
        + direction * descriptor.finiteDifferenceStep).toPrecision(15));
      if (value < descriptor.minimum || value > descriptor.maximum) continue;
      candidates.push(candidateV1(
        "release-lattice",
        candidates.length,
        applyMainWireBaselineCalibrationParametersV1(projected, [
          Object.freeze({ parameterId, value }),
        ]),
      ));
    }
  }
  for (const candidate of candidates) {
    assertMainWireBaselineCalibrationCandidateOnReleaseLatticeV1(
      candidate.candidateInputs,
      coordinateIds,
    );
  }
  return Object.freeze(candidates);
}

export function scoreMainWireBaselineCandidateObjectiveV1(input: Readonly<{
  checks: readonly MainWireIntegratedModelBaselineValidationCheckV1[];
  candidate: MainWireBaselineCalibrationCandidateInputsV1;
  numericalFloors: readonly MainWireBaselineNumericalFloorMetricV1[];
}>): MainWireBaselineCandidateObjectiveV1 {
  const policy = MAIN_WIRE_BASELINE_CONDITIONING_STUDY_SOURCE_V1.searchPolicy;
  const floorById = indexMainWireBaselineNumericalFloorsV1(
    input.checks,
    input.numericalFloors,
  );
  const margins = input.checks.map((check) => {
    const width = check.maximum - check.minimum;
    const floor = floorById.get(check.checkId)!;
    const numericalFloorAbsolute = floor.numericalFloorAbsolute;
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
  const primaryGroupIds = new Set(
    MAIN_WIRE_BASELINE_CONDITIONING_STUDY_SOURCE_V1.objectivePolicy
      .primaryInteriorGroupIds,
  );
  const primaryCheckIds = new Set(normalReferenceEvidenceV1.checkGroups
    .filter(({ groupId }) => primaryGroupIds.has(groupId))
    .flatMap(({ checkIds }) => checkIds));
  const primaryContinuous = continuous.filter(({ checkId }) =>
    primaryCheckIds.has(checkId));
  if (primaryContinuous.length === 0) {
    throw new Error("baseline objective has no continuous primary margin");
  }
  const primaryActiveMargins = [...primaryContinuous]
    .sort((left, right) =>
      left.bufferedInteriorMargin! - right.bufferedInteriorMargin!)
    .slice(0, 5);
  const activeMargins = [...continuous].sort((left, right) =>
    left.bufferedInteriorMargin! - right.bufferedInteriorMargin!)
    .slice(0, 5);
  return Object.freeze({
    objectiveId: MAIN_WIRE_BASELINE_MAX_MARGIN_SEARCH_V1_ID,
    status: failedCheckIds.length === 0
      ? "feasible" as const
      : "corridor-rejected" as const,
    primaryWorstBufferedInteriorMargin: primaryActiveMargins[0]
      ?.bufferedInteriorMargin ?? null,
    worstBufferedInteriorMargin: activeMargins[0]
      ?.bufferedInteriorMargin ?? null,
    referenceDepartureRms: referenceDepartureRmsV1(input.candidate),
    failedCheckIds: Object.freeze(failedCheckIds),
    primaryActiveMargins: Object.freeze(primaryActiveMargins),
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
  const leftPrimaryMargin = left.primaryWorstBufferedInteriorMargin
    ?? Number.NEGATIVE_INFINITY;
  const rightPrimaryMargin = right.primaryWorstBufferedInteriorMargin
    ?? Number.NEGATIVE_INFINITY;
  if (leftPrimaryMargin !== rightPrimaryMargin) {
    return rightPrimaryMargin - leftPrimaryMargin;
  }
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
  const primes = [2, 3, 5, 7, 11] as const;
  const prime = primes[dimension];
  if (prime === undefined) {
    throw new Error("baseline search supports at most five coordinates");
  }
  return prime;
}
