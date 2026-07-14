import {
  DEFAULT_NO_AVPD_PASSIVE_LV_EDPVR_BOUNDARY_V1,
  runNoAvpdPassiveLvEdpvrBenchV1,
  type NoAvpdPassiveLvEdpvrAvailablePointV1,
  type NoAvpdPassiveLvEdpvrReportV1,
} from "@/engine/mechanics2/benches/NoAvpdPassiveLvEdpvrBenchV1";
import {
  DEFAULT_NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_PARAMS_V1,
  type NoAvpdFourChamberHillTriSegParamsV1,
} from "@/engine/mechanics2/subsystems/NoAvpdFourChamberHillTriSegV1";

export type NoAvpdPassiveRvOwnerFamilyIdV1 =
  "prescribed-rv-transmural-pressure" | "rv-free-wall-passive-tangent-modulus";

export const NO_AVPD_PASSIVE_RV_OWNER_VOLUME_SEARCH_ML_V1 = Object.freeze([
  20, 800,
] as const);

const ROOT_HEADROOM_WARNING_FRACTION = 0.75;

export type NoAvpdPassiveRvOwnerCandidateDeclarationV1 = {
  readonly candidateId: string;
  readonly role: "family-reference" | "sensitivity-candidate";
  readonly targetRvTransmuralPressureMmHg: number;
  readonly rightFreeWallPassiveTangentModulusScale: number;
};

export type NoAvpdPassiveRvOwnerFamilyDeclarationV1 = {
  readonly familyId: NoAvpdPassiveRvOwnerFamilyIdV1;
  readonly variedInput:
    | "target-rv-transmural-pressure-only"
    | "right-free-wall-passive-tangent-modulus-only";
  readonly invariants: {
    readonly externalPressureMmHg: 0;
    readonly referenceMidwallAreas: "baseline-unchanged";
    readonly nonOwnerModelParameters: "baseline-unchanged";
    readonly targetRvTransmuralPressureMmHg:
      "varied-within-family" | "fixed-at-5-mmHg";
    readonly rightFreeWallPassiveTangentModulus:
      "baseline-unchanged" | "varied-by-declared-scale";
  };
  readonly candidates: readonly NoAvpdPassiveRvOwnerCandidateDeclarationV1[];
};

export const NO_AVPD_PASSIVE_RV_OWNER_FAMILY_DECLARATIONS_V1: readonly NoAvpdPassiveRvOwnerFamilyDeclarationV1[] =
  Object.freeze([
    Object.freeze({
      familyId: "prescribed-rv-transmural-pressure",
      variedInput: "target-rv-transmural-pressure-only",
      invariants: Object.freeze({
        externalPressureMmHg: 0,
        referenceMidwallAreas: "baseline-unchanged",
        nonOwnerModelParameters: "baseline-unchanged",
        targetRvTransmuralPressureMmHg: "varied-within-family",
        rightFreeWallPassiveTangentModulus: "baseline-unchanged",
      }),
      candidates: Object.freeze([
        Object.freeze({
          candidateId: "rv-load-1p5-mmHg",
          role: "sensitivity-candidate",
          targetRvTransmuralPressureMmHg: 1.5,
          rightFreeWallPassiveTangentModulusScale: 1,
        }),
        Object.freeze({
          candidateId: "rv-load-2-mmHg",
          role: "sensitivity-candidate",
          targetRvTransmuralPressureMmHg: 2,
          rightFreeWallPassiveTangentModulusScale: 1,
        }),
        Object.freeze({
          candidateId: "rv-load-5-mmHg-reference",
          role: "family-reference",
          targetRvTransmuralPressureMmHg: 5,
          rightFreeWallPassiveTangentModulusScale: 1,
        }),
      ]),
    }),
    Object.freeze({
      familyId: "rv-free-wall-passive-tangent-modulus",
      variedInput: "right-free-wall-passive-tangent-modulus-only",
      invariants: Object.freeze({
        externalPressureMmHg: 0,
        referenceMidwallAreas: "baseline-unchanged",
        nonOwnerModelParameters: "baseline-unchanged",
        targetRvTransmuralPressureMmHg: "fixed-at-5-mmHg",
        rightFreeWallPassiveTangentModulus: "varied-by-declared-scale",
      }),
      candidates: Object.freeze([
        Object.freeze({
          candidateId: "rv-passive-tangent-0p5x",
          role: "sensitivity-candidate",
          targetRvTransmuralPressureMmHg: 5,
          rightFreeWallPassiveTangentModulusScale: 0.5,
        }),
        Object.freeze({
          candidateId: "rv-passive-tangent-1x-reference",
          role: "family-reference",
          targetRvTransmuralPressureMmHg: 5,
          rightFreeWallPassiveTangentModulusScale: 1,
        }),
        Object.freeze({
          candidateId: "rv-passive-tangent-2x",
          role: "sensitivity-candidate",
          targetRvTransmuralPressureMmHg: 5,
          rightFreeWallPassiveTangentModulusScale: 2,
        }),
      ]),
    }),
  ]);

export const NO_AVPD_PASSIVE_RV_OWNER_SENSITIVITY_PROTOCOL_V1 = Object.freeze({
  protocolId: "no-avpd-passive-rv-owner-sensitivity-v1",
  evidenceStatus:
    "report-only-restricted-component-sensitivity-not-physiology-gate",
  reusedBench: "NoAvpdPassiveLvEdpvrBenchV1-unchanged",
  familyIsolation:
    "each-family-has-its-own-reference-and-varies-one-declared-input-only",
  duplicateReferenceTreatment:
    "identical-effective-input-family-references-share-one-bench-execution",
  commonRvVolumeSearchMl: NO_AVPD_PASSIVE_RV_OWNER_VOLUME_SEARCH_ML_V1,
  candidateRangeSemantics:
    "broad-engineering-sensitivity-probes-not-physiologic-priors-or-calibrated-bounds",
  ownerCoverage: "nonexhaustive-load-and-rv-free-wall-passive-tangent-only",
  referenceAreaSensitivityIncluded: false,
  referenceStrainSensitivityIncluded: false,
  referenceCoordinateBoundary:
    "reference-midwall-area-and-passive-reference-strain-are-not-treated-as-independent-passive-owners-in-this-matrix",
  wallVolumeSensitivityIncluded: false,
  septalParameterSensitivityIncluded: false,
  externalPressureSensitivityIncluded: false,
  scalarWinnerSelected: false,
  physiologyGateApplied: false,
  pointRetention:
    "full-lv-volume-grid-with-required-rv-volume-septal-cap-lv-pressure-slope-and-root-diagnostics",
  claimBoundary:
    "restricted-two-family-passive-biventricular-triseg-sensitivity-not-exhaustive-owner-localization-parameter-calibration-or-clinical-edpvr-validation",
  families: NO_AVPD_PASSIVE_RV_OWNER_FAMILY_DECLARATIONS_V1,
});

export type NoAvpdPassiveRvOwnerCandidateSummaryV1 = {
  readonly requestedPointCount: number;
  readonly rangePopulation: "available-points-only-no-imputation";
  readonly rootAvailability: {
    readonly availablePointCount: number;
    readonly unavailablePointCount: number;
    readonly ambiguousPointCount: number;
    readonly allPointsAvailable: boolean;
  };
  readonly requiredRvVolumeRangeMl: readonly [number, number] | null;
  readonly septalCapVolumeRangeMl: readonly [number, number] | null;
  readonly lvTransmuralPressureRangeMmHg: readonly [number, number] | null;
  readonly centeredSecantPressureSlopeRangeMmHgPerMl:
    readonly [number, number] | null;
  readonly maximumAbsoluteRvPressureTargetResidualMmHg: number | null;
  readonly maximumTriSegRelativeResidual: number | null;
  readonly rootSearchHeadroom: {
    readonly searchLowerBoundMl: number;
    readonly searchUpperBoundMl: number;
    readonly warningFractionOfUpperBound: number;
    readonly warningThresholdMl: number;
    readonly maximumRequiredRvVolumeMl: number | null;
    readonly minimumUpperHeadroomMl: number | null;
    readonly maximumRootFractionOfUpperBound: number | null;
    readonly status:
      | "below-search-headroom-warning-threshold"
      | "warning-search-headroom"
      | "unavailable-no-roots";
    readonly boundary: "engineering-search-headroom-only-not-physiologic-rv-volume-gate";
  };
};

export type NoAvpdPassiveRvOwnerCandidateReportV1 = {
  readonly declaration: NoAvpdPassiveRvOwnerCandidateDeclarationV1;
  readonly effectiveInputs: {
    readonly targetRvTransmuralPressureMmHg: number;
    readonly externalPressureMmHg: 0;
    readonly baselineRightFreeWallPassiveTangentModulusPa: number;
    readonly effectiveRightFreeWallPassiveTangentModulusPa: number;
  };
  readonly edpvr: NoAvpdPassiveLvEdpvrReportV1;
  readonly summary: NoAvpdPassiveRvOwnerCandidateSummaryV1;
};

export type NoAvpdPassiveRvOwnerFamilyReportV1 = {
  readonly declaration: NoAvpdPassiveRvOwnerFamilyDeclarationV1;
  readonly candidates: readonly NoAvpdPassiveRvOwnerCandidateReportV1[];
};

export type NoAvpdPassiveRvOwnerSensitivityReportV1 = {
  readonly protocol: typeof NO_AVPD_PASSIVE_RV_OWNER_SENSITIVITY_PROTOCOL_V1;
  readonly families: readonly NoAvpdPassiveRvOwnerFamilyReportV1[];
  readonly summary: {
    readonly familyCount: number;
    readonly candidateDeclarationCountIncludingFamilyReferences: number;
    readonly uniqueBenchExecutionCount: number;
    readonly reusedEffectiveInputCount: number;
    readonly allCandidatePointsAvailable: boolean;
    readonly scalarWinnerSelected: false;
    readonly physiologyGateApplied: false;
  };
};

export function runNoAvpdPassiveRvOwnerSensitivityBenchV1(): NoAvpdPassiveRvOwnerSensitivityReportV1 {
  const executionCache = new Map<string, NoAvpdPassiveLvEdpvrReportV1>();
  const families = NO_AVPD_PASSIVE_RV_OWNER_FAMILY_DECLARATIONS_V1.map(
    (declaration): NoAvpdPassiveRvOwnerFamilyReportV1 => ({
      declaration,
      candidates: declaration.candidates.map((candidate) =>
        runCandidate(candidate, executionCache),
      ),
    }),
  );
  const candidateDeclarationCount = families.reduce(
    (sum, family) => sum + family.candidates.length,
    0,
  );
  return {
    protocol: NO_AVPD_PASSIVE_RV_OWNER_SENSITIVITY_PROTOCOL_V1,
    families,
    summary: {
      familyCount: families.length,
      candidateDeclarationCountIncludingFamilyReferences:
        candidateDeclarationCount,
      uniqueBenchExecutionCount: executionCache.size,
      reusedEffectiveInputCount:
        candidateDeclarationCount - executionCache.size,
      allCandidatePointsAvailable: families.every((family) =>
        family.candidates.every(
          (candidate) => candidate.summary.rootAvailability.allPointsAvailable,
        ),
      ),
      scalarWinnerSelected: false,
      physiologyGateApplied: false,
    },
  };
}

function runCandidate(
  declaration: NoAvpdPassiveRvOwnerCandidateDeclarationV1,
  executionCache: Map<string, NoAvpdPassiveLvEdpvrReportV1>,
): NoAvpdPassiveRvOwnerCandidateReportV1 {
  const baselineTangentModulusPa =
    DEFAULT_NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_PARAMS_V1.triSeg.rightFreeWall
      .material.passive.tangentModulusPa;
  const effectiveTangentModulusPa =
    baselineTangentModulusPa *
    declaration.rightFreeWallPassiveTangentModulusScale;
  const params = withRightFreeWallPassiveTangentModulus(
    effectiveTangentModulusPa,
  );
  const boundary = {
    ...DEFAULT_NO_AVPD_PASSIVE_LV_EDPVR_BOUNDARY_V1,
    targetRvTransmuralPressureMmHg: declaration.targetRvTransmuralPressureMmHg,
    rvVolumeSearchMl: NO_AVPD_PASSIVE_RV_OWNER_VOLUME_SEARCH_ML_V1,
  };
  const executionKey = JSON.stringify({
    targetRvTransmuralPressureMmHg: declaration.targetRvTransmuralPressureMmHg,
    effectiveRightFreeWallPassiveTangentModulusPa: effectiveTangentModulusPa,
    boundary,
  });
  let edpvr = executionCache.get(executionKey);
  if (edpvr === undefined) {
    edpvr = runNoAvpdPassiveLvEdpvrBenchV1(params, boundary);
    executionCache.set(executionKey, edpvr);
  }
  return {
    declaration,
    effectiveInputs: {
      targetRvTransmuralPressureMmHg:
        declaration.targetRvTransmuralPressureMmHg,
      externalPressureMmHg: 0,
      baselineRightFreeWallPassiveTangentModulusPa: baselineTangentModulusPa,
      effectiveRightFreeWallPassiveTangentModulusPa: effectiveTangentModulusPa,
    },
    edpvr,
    summary: summarizeCandidate(edpvr),
  };
}

function withRightFreeWallPassiveTangentModulus(
  tangentModulusPa: number,
): NoAvpdFourChamberHillTriSegParamsV1 {
  const baseline = DEFAULT_NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_PARAMS_V1;
  const rightFreeWall = baseline.triSeg.rightFreeWall;
  return {
    ...baseline,
    triSeg: {
      ...baseline.triSeg,
      rightFreeWall: {
        ...rightFreeWall,
        material: {
          ...rightFreeWall.material,
          passive: {
            ...rightFreeWall.material.passive,
            tangentModulusPa,
          },
        },
      },
    },
  };
}

function summarizeCandidate(
  report: NoAvpdPassiveLvEdpvrReportV1,
): NoAvpdPassiveRvOwnerCandidateSummaryV1 {
  const available = report.points.filter(
    (point): point is NoAvpdPassiveLvEdpvrAvailablePointV1 =>
      point.status === "available",
  );
  const slopes = available
    .map((point) => point.centeredSecantPressureSlopeMmHgPerMl)
    .filter((value): value is number => value !== null);
  const [searchLowerBoundMl, searchUpperBoundMl] =
    report.boundary.rvVolumeSearchMl;
  const maximumRequiredRvVolumeMl = maximumOrNull(
    available.map((point) => point.rvVolumeMl),
  );
  const warningThresholdMl =
    ROOT_HEADROOM_WARNING_FRACTION * searchUpperBoundMl;
  return {
    requestedPointCount: report.summary.requestedPointCount,
    rangePopulation: "available-points-only-no-imputation",
    rootAvailability: {
      availablePointCount: report.summary.availablePointCount,
      unavailablePointCount: report.summary.unavailablePointCount,
      ambiguousPointCount: report.summary.ambiguousPointCount,
      allPointsAvailable: report.summary.allPointsAvailable,
    },
    requiredRvVolumeRangeMl: rangeOrNull(
      available.map((point) => point.rvVolumeMl),
    ),
    septalCapVolumeRangeMl: rangeOrNull(
      available.map((point) => point.triSegCoordinates.septalCapVolumeMl),
    ),
    lvTransmuralPressureRangeMmHg: rangeOrNull(
      available.map((point) => point.lvTransmuralPressureMmHg),
    ),
    centeredSecantPressureSlopeRangeMmHgPerMl: rangeOrNull(slopes),
    maximumAbsoluteRvPressureTargetResidualMmHg: maximumOrNull(
      available.map((point) => Math.abs(point.rvPressureTargetResidualMmHg)),
    ),
    maximumTriSegRelativeResidual: maximumOrNull(
      available.map((point) => point.triSegRelativeResidual),
    ),
    rootSearchHeadroom: {
      searchLowerBoundMl,
      searchUpperBoundMl,
      warningFractionOfUpperBound: ROOT_HEADROOM_WARNING_FRACTION,
      warningThresholdMl,
      maximumRequiredRvVolumeMl,
      minimumUpperHeadroomMl:
        maximumRequiredRvVolumeMl === null
          ? null
          : searchUpperBoundMl - maximumRequiredRvVolumeMl,
      maximumRootFractionOfUpperBound:
        maximumRequiredRvVolumeMl === null
          ? null
          : maximumRequiredRvVolumeMl / searchUpperBoundMl,
      status:
        maximumRequiredRvVolumeMl === null
          ? "unavailable-no-roots"
          : maximumRequiredRvVolumeMl >= warningThresholdMl
            ? "warning-search-headroom"
            : "below-search-headroom-warning-threshold",
      boundary:
        "engineering-search-headroom-only-not-physiologic-rv-volume-gate",
    },
  };
}

function rangeOrNull(
  values: readonly number[],
): readonly [number, number] | null {
  return values.length === 0
    ? null
    : Object.freeze([Math.min(...values), Math.max(...values)] as const);
}

function maximumOrNull(values: readonly number[]): number | null {
  return values.length === 0 ? null : Math.max(...values);
}
