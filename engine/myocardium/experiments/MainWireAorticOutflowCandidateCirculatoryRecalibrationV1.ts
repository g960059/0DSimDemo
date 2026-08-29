import type {
  MainWireNormalAdultStressedVenousVolumeResearchPointIdV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultBloodVolumeOperatingPointV1";
import type {
  MainWireNormalAdultFiveWallCirculatoryLoadPointIdV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallCirculatoryLoadPointsV1";
import {
  MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V5,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowPhysiologyCandidateV5";

export const MAIN_WIRE_AORTIC_OUTFLOW_CANDIDATE_CIRCULATORY_RECALIBRATION_V1_ID =
  "main-wire-aortic-outflow-candidate-circulatory-recalibration-v1" as const;

export const MAIN_WIRE_AORTIC_OUTFLOW_CANDIDATE_CIRCULATORY_RECALIBRATION_LEVELS_V1 =
  Object.freeze(["low", "baseline", "high"] as const);

export type MainWireAorticOutflowCandidateCirculatoryRecalibrationLevelV1 =
  (typeof MAIN_WIRE_AORTIC_OUTFLOW_CANDIDATE_CIRCULATORY_RECALIBRATION_LEVELS_V1)[number];

export const MAIN_WIRE_AORTIC_OUTFLOW_CANDIDATE_CIRCULATORY_RECALIBRATION_CONTEXT_IDS_V1 =
  Object.freeze([
    "pvr-low__tbv-low",
    "pvr-low__tbv-baseline",
    "pvr-low__tbv-high",
    "pvr-baseline__tbv-low",
    "pvr-baseline__tbv-baseline",
    "pvr-baseline__tbv-high",
    "pvr-high__tbv-low",
    "pvr-high__tbv-baseline",
    "pvr-high__tbv-high",
  ] as const);

export type MainWireAorticOutflowCandidateCirculatoryRecalibrationContextIdV1 =
  (typeof MAIN_WIRE_AORTIC_OUTFLOW_CANDIDATE_CIRCULATORY_RECALIBRATION_CONTEXT_IDS_V1)[number];

export type MainWireAorticOutflowCandidateCirculatoryRecalibrationContextV1 =
  Readonly<{
    contextId:
      MainWireAorticOutflowCandidateCirculatoryRecalibrationContextIdV1;
    pulmonaryResistanceLevel:
      MainWireAorticOutflowCandidateCirculatoryRecalibrationLevelV1;
    stressedVenousVolumeLevel:
      MainWireAorticOutflowCandidateCirculatoryRecalibrationLevelV1;
    pulmonaryResistanceScaleFromBaseline: 0.75 | 1 | 1.3333333333333333;
    canonicalAdditionalStressedVenousVolumeScale:
      0.75 | 1 | 1.3333333333333333;
    circulatoryLoadPointId:
      MainWireNormalAdultFiveWallCirculatoryLoadPointIdV1;
    stressedVenousVolumePointId:
      MainWireNormalAdultStressedVenousVolumeResearchPointIdV1;
  }>;

export const MAIN_WIRE_AORTIC_OUTFLOW_CANDIDATE_CIRCULATORY_RECALIBRATION_CLAIM_V1 =
  Object.freeze({
    role:
      "fixed-three-by-three-pulmonary-resistance-by-stressed-volume-factorial" as const,
    fixedCandidate: MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V5,
    pulmonaryResistanceScales: Object.freeze([0.75, 1, 4 / 3] as const),
    canonicalAdditionalStressedVenousVolumeScales:
      Object.freeze([0.75, 1, 4 / 3] as const),
    systemicResistanceHeldAtBaseline: true as const,
    globalArterialStiffnessLoadScaleHeldAtBaseline: true as const,
    aorticValveAreaOrOpeningLawChanged: false as const,
    aorticEtMechanismHeldFixed: true as const,
    independentCanonicalColdStartPerRun: true as const,
    acceptedStateOrCheckpointTopologyChanged: false as const,
    fixedGridNotNumericOptimization: true as const,
    calibrationTargetApplied: false as const,
    clinicalValidationClaimed: false as const,
    canonicalAdoptionEstablished: false as const,
  });

const LEVEL_SCALE = Object.freeze({
  low: 0.75 as const,
  baseline: 1 as const,
  high: 1.3333333333333333 as const,
});

const PVR_POINT = Object.freeze({
  low: "pulmonary-resistance-low" as const,
  baseline: "baseline" as const,
  high: "pulmonary-resistance-high" as const,
});

const TBV_POINT = Object.freeze({
  low: "stressed-venous-volume-low" as const,
  baseline: "baseline" as const,
  high: "stressed-venous-volume-high" as const,
});

function context(
  contextId:
    MainWireAorticOutflowCandidateCirculatoryRecalibrationContextIdV1,
  pulmonaryResistanceLevel:
    MainWireAorticOutflowCandidateCirculatoryRecalibrationLevelV1,
  stressedVenousVolumeLevel:
    MainWireAorticOutflowCandidateCirculatoryRecalibrationLevelV1,
): MainWireAorticOutflowCandidateCirculatoryRecalibrationContextV1 {
  return Object.freeze({
    contextId,
    pulmonaryResistanceLevel,
    stressedVenousVolumeLevel,
    pulmonaryResistanceScaleFromBaseline: LEVEL_SCALE[pulmonaryResistanceLevel],
    canonicalAdditionalStressedVenousVolumeScale:
      LEVEL_SCALE[stressedVenousVolumeLevel],
    circulatoryLoadPointId: PVR_POINT[pulmonaryResistanceLevel],
    stressedVenousVolumePointId: TBV_POINT[stressedVenousVolumeLevel],
  });
}

export const MAIN_WIRE_AORTIC_OUTFLOW_CANDIDATE_CIRCULATORY_RECALIBRATION_CONTEXTS_V1 =
  Object.freeze({
    "pvr-low__tbv-low": context("pvr-low__tbv-low", "low", "low"),
    "pvr-low__tbv-baseline": context(
      "pvr-low__tbv-baseline",
      "low",
      "baseline",
    ),
    "pvr-low__tbv-high": context("pvr-low__tbv-high", "low", "high"),
    "pvr-baseline__tbv-low": context(
      "pvr-baseline__tbv-low",
      "baseline",
      "low",
    ),
    "pvr-baseline__tbv-baseline": context(
      "pvr-baseline__tbv-baseline",
      "baseline",
      "baseline",
    ),
    "pvr-baseline__tbv-high": context(
      "pvr-baseline__tbv-high",
      "baseline",
      "high",
    ),
    "pvr-high__tbv-low": context("pvr-high__tbv-low", "high", "low"),
    "pvr-high__tbv-baseline": context(
      "pvr-high__tbv-baseline",
      "high",
      "baseline",
    ),
    "pvr-high__tbv-high": context("pvr-high__tbv-high", "high", "high"),
  } satisfies Readonly<Record<
    MainWireAorticOutflowCandidateCirculatoryRecalibrationContextIdV1,
    MainWireAorticOutflowCandidateCirculatoryRecalibrationContextV1
  >>);

export function resolveMainWireAorticOutflowCandidateCirculatoryRecalibrationContextV1(
  contextId:
    MainWireAorticOutflowCandidateCirculatoryRecalibrationContextIdV1,
): MainWireAorticOutflowCandidateCirculatoryRecalibrationContextV1 {
  const resolved =
    MAIN_WIRE_AORTIC_OUTFLOW_CANDIDATE_CIRCULATORY_RECALIBRATION_CONTEXTS_V1[
      contextId
    ];
  if (resolved === undefined) {
    throw new Error(
      `unsupported candidate circulatory recalibration context: ${String(contextId)}`,
    );
  }
  return resolved;
}
