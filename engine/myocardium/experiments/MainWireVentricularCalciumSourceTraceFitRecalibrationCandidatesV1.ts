import type {
  MainWireNormalAdultFiveWallCirculatoryLoadPointIdV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallCirculatoryLoadPointsV1";
import type {
  MainWireNormalAdultStressedVenousVolumeResearchPointIdV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultBloodVolumeOperatingPointV1";
import type {
  MainWireNormalAdultVentricularMaterialResearchPointIdV1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";

export const MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_RECALIBRATION_CANDIDATES_V1_ID =
  "main-wire-ventricular-calcium-source-trace-fit-recalibration-candidates-v1" as const;

export const MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_RECALIBRATION_CANDIDATE_IDS_V1 =
  Object.freeze([
    "tref-high-plus-arterial-stiffness-high",
    "tref-high-plus-stressed-venous-volume-high",
    "tref-high-plus-passive-low",
  ] as const);

export type MainWireVentricularCalciumSourceTraceFitRecalibrationCandidateIdV1 =
  (typeof MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_RECALIBRATION_CANDIDATE_IDS_V1)[number];

export type MainWireVentricularCalciumSourceTraceFitRecalibrationCandidateV1 =
  Readonly<{
    candidateId:
      MainWireVentricularCalciumSourceTraceFitRecalibrationCandidateIdV1;
    circulatoryLoadPointId:
      MainWireNormalAdultFiveWallCirculatoryLoadPointIdV1;
    ventricularMaterialPointId:
      MainWireNormalAdultVentricularMaterialResearchPointIdV1;
    stressedVenousVolumePointId:
      MainWireNormalAdultStressedVenousVolumeResearchPointIdV1;
    changedSemanticOwners: readonly (
      | "global-arterial-stiffness"
      | "fixed-total-blood-volume-operating-point"
      | "common-ventricular-land-tref"
      | "common-ventricular-passive-material"
    )[];
    claim: typeof CLAIM;
  }>;

const CLAIM = Object.freeze({
  role: "fixed-bounded-post-svd-corner-probe" as const,
  candidateChoiceUsedNumericTargetOptimization: false as const,
  candidateChoiceUsedSensitivityDirection: true as const,
  ventricularTrefScaleFromBaseline: 1.3333333333333333 as const,
  secondAxisUsesFixedEnvelopeCorner: true as const,
  arterialStiffnessAndStressedVenousVolumeChangedTogether: false as const,
  systemicResistanceChanged: false as const,
  pulmonaryResistanceChanged: false as const,
  passiveMaterialChangedOnlyInNamedCandidate: true as const,
  ventricularCalciumProfileHeldFixed: true as const,
  aorticValveAreaOrLawChanged: false as const,
  vascularUnstressedVolumesChanged: false as const,
  warmStartAllowed: false as const,
  patientFitOrCanonicalAdoption: false as const,
});

const CANDIDATES = Object.freeze({
  "tref-high-plus-arterial-stiffness-high": Object.freeze({
    candidateId: "tref-high-plus-arterial-stiffness-high" as const,
    circulatoryLoadPointId: "arterial-stiffness-high" as const,
    ventricularMaterialPointId: "ventricular-tref-high" as const,
    stressedVenousVolumePointId: "baseline" as const,
    changedSemanticOwners: Object.freeze([
      "global-arterial-stiffness",
      "common-ventricular-land-tref",
    ] as const),
    claim: CLAIM,
  }),
  "tref-high-plus-stressed-venous-volume-high": Object.freeze({
    candidateId: "tref-high-plus-stressed-venous-volume-high" as const,
    circulatoryLoadPointId: "baseline" as const,
    ventricularMaterialPointId: "ventricular-tref-high" as const,
    stressedVenousVolumePointId: "stressed-venous-volume-high" as const,
    changedSemanticOwners: Object.freeze([
      "fixed-total-blood-volume-operating-point",
      "common-ventricular-land-tref",
    ] as const),
    claim: CLAIM,
  }),
  "tref-high-plus-passive-low": Object.freeze({
    candidateId: "tref-high-plus-passive-low" as const,
    circulatoryLoadPointId: "baseline" as const,
    ventricularMaterialPointId:
      "ventricular-tref-high-plus-passive-low" as const,
    stressedVenousVolumePointId: "baseline" as const,
    changedSemanticOwners: Object.freeze([
      "common-ventricular-land-tref",
      "common-ventricular-passive-material",
    ] as const),
    claim: CLAIM,
  }),
} satisfies Readonly<Record<
  MainWireVentricularCalciumSourceTraceFitRecalibrationCandidateIdV1,
  MainWireVentricularCalciumSourceTraceFitRecalibrationCandidateV1
>>);

export const MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_RECALIBRATION_CANDIDATES_V1 =
  CANDIDATES;

export function resolveMainWireVentricularCalciumSourceTraceFitRecalibrationCandidateV1(
  candidateId:
    MainWireVentricularCalciumSourceTraceFitRecalibrationCandidateIdV1,
): MainWireVentricularCalciumSourceTraceFitRecalibrationCandidateV1 {
  const candidate = CANDIDATES[candidateId];
  if (candidate === undefined) {
    throw new Error(`unsupported calcium source-trace recalibration candidate: ${
      String(candidateId)}`);
  }
  return candidate;
}
