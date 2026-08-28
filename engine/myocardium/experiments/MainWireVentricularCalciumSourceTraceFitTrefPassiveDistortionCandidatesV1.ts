import {
  resolveMainWireVentricularCalciumSourceTraceFitTrefPassiveProfileV1,
  type MainWireVentricularCalciumSourceTraceFitTrefPassiveProfileIdV1,
  type MainWireVentricularCalciumSourceTraceFitTrefPassiveProfileV1,
} from "@/engine/myocardium/experiments/MainWireVentricularCalciumSourceTraceFitTrefPassiveGridV1";
import {
  MAIN_WIRE_NORMAL_ADULT_FIXED_VENTRICULAR_DISTORTION_TRANSIENT_SCALE_V1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";

export const MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_TREF_PASSIVE_DISTORTION_CANDIDATES_V1_ID =
  "main-wire-ventricular-calcium-source-trace-fit-tref-passive-distortion-candidates-v1" as const;

export const MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_TREF_PASSIVE_DISTORTION_CANDIDATE_IDS_V1 =
  Object.freeze([
    "tref-1p00-passive-0p750-plus-distortion-transient-high",
    "tref-1p10-passive-0p750-plus-distortion-transient-high",
    "tref-1p20-passive-0p875-plus-distortion-transient-high",
    "tref-1p20-passive-0p750-plus-distortion-transient-high",
    "tref-1p30-passive-1p000-plus-distortion-transient-high",
    "tref-1p30-passive-0p750-plus-distortion-transient-high",
  ] as const);

export type MainWireVentricularCalciumSourceTraceFitTrefPassiveDistortionCandidateIdV1 =
  (typeof MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_TREF_PASSIVE_DISTORTION_CANDIDATE_IDS_V1)[number];

export type MainWireVentricularCalciumSourceTraceFitTrefPassiveDistortionCandidateV1 =
  Readonly<{
    candidateId:
      MainWireVentricularCalciumSourceTraceFitTrefPassiveDistortionCandidateIdV1;
    pairedBaselineProfileId:
      MainWireVentricularCalciumSourceTraceFitTrefPassiveProfileIdV1;
    pairedBaselineProfile:
      MainWireVentricularCalciumSourceTraceFitTrefPassiveProfileV1;
    commonVentricularLandAeffScaleFromBaseline:
      typeof MAIN_WIRE_NORMAL_ADULT_FIXED_VENTRICULAR_DISTORTION_TRANSIENT_SCALE_V1;
    commonVentricularLandPhiScaleFromBaseline:
      typeof MAIN_WIRE_NORMAL_ADULT_FIXED_VENTRICULAR_DISTORTION_TRANSIENT_SCALE_V1;
    claim: typeof CLAIM;
  }>;

const CLAIM = Object.freeze({
  role: "fixed-post-pareto-existing-Land-distortion-transient-probe" as const,
  candidateSetOutcomeInformedByFixedTrefPassiveGrid: true as const,
  pairedDifferenceChangesOnlyLandAeffAndPhi: true as const,
  commonVentricularWallScope: Object.freeze([
    "LVFW", "SEP", "RVFW",
  ] as const),
  landAeffAndPhiScaledProportionally: true as const,
  constantStrainRateZetaGainAeffOverPhiPreserved: true as const,
  quickTransientResponseChanged: true as const,
  existingLandDistortionStateReused: true as const,
  landStateCountChanged: false as const,
  localAorticValveStateAdded: false as const,
  localAorticValveInertanceAdded: false as const,
  ventricularCalciumDriveChangedWithinPair: false as const,
  ventricularTrefOrPassiveChangedWithinPair: false as const,
  circulationRuntimeChangedWithinPair: false as const,
  fixedTotalBloodVolumeChangedWithinPair: false as const,
  aorticValveAreaOrLawChangedWithinPair: false as const,
  numericTargetOptimizationOrFit: false as const,
  patientFitOrCanonicalAdoption: false as const,
});

const CANDIDATE_BASELINES = Object.freeze({
  "tref-1p00-passive-0p750-plus-distortion-transient-high":
    "tref-1p00-passive-0p750",
  "tref-1p10-passive-0p750-plus-distortion-transient-high":
    "tref-1p10-passive-0p750",
  "tref-1p20-passive-0p875-plus-distortion-transient-high":
    "tref-1p20-passive-0p875",
  "tref-1p20-passive-0p750-plus-distortion-transient-high":
    "tref-1p20-passive-0p750",
  "tref-1p30-passive-1p000-plus-distortion-transient-high":
    "tref-1p30-passive-1p000",
  "tref-1p30-passive-0p750-plus-distortion-transient-high":
    "tref-1p30-passive-0p750",
} satisfies Readonly<Record<
  MainWireVentricularCalciumSourceTraceFitTrefPassiveDistortionCandidateIdV1,
  MainWireVentricularCalciumSourceTraceFitTrefPassiveProfileIdV1
>>);

export const MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_TREF_PASSIVE_DISTORTION_CANDIDATES_V1 =
  Object.freeze(
    MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_TREF_PASSIVE_DISTORTION_CANDIDATE_IDS_V1
      .map((candidateId) => candidate(candidateId)),
  );

export function resolveMainWireVentricularCalciumSourceTraceFitTrefPassiveDistortionCandidateV1(
  candidateId:
    MainWireVentricularCalciumSourceTraceFitTrefPassiveDistortionCandidateIdV1,
): MainWireVentricularCalciumSourceTraceFitTrefPassiveDistortionCandidateV1 {
  const resolved =
    MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_TREF_PASSIVE_DISTORTION_CANDIDATES_V1
      .find((candidate) => candidate.candidateId === candidateId);
  if (resolved === undefined) {
    throw new Error(
      `unsupported source-calcium Tref/passive distortion candidate: ${
        String(candidateId)}`,
    );
  }
  return resolved;
}

function candidate(
  candidateId:
    MainWireVentricularCalciumSourceTraceFitTrefPassiveDistortionCandidateIdV1,
): MainWireVentricularCalciumSourceTraceFitTrefPassiveDistortionCandidateV1 {
  const pairedBaselineProfileId = CANDIDATE_BASELINES[candidateId];
  return Object.freeze({
    candidateId,
    pairedBaselineProfileId,
    pairedBaselineProfile:
      resolveMainWireVentricularCalciumSourceTraceFitTrefPassiveProfileV1(
        pairedBaselineProfileId,
      ),
    commonVentricularLandAeffScaleFromBaseline:
      MAIN_WIRE_NORMAL_ADULT_FIXED_VENTRICULAR_DISTORTION_TRANSIENT_SCALE_V1,
    commonVentricularLandPhiScaleFromBaseline:
      MAIN_WIRE_NORMAL_ADULT_FIXED_VENTRICULAR_DISTORTION_TRANSIENT_SCALE_V1,
    claim: CLAIM,
  });
}
