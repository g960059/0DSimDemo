import type {
  MainWireNormalAdultFiveWallCirculatoryLoadPointIdV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallCirculatoryLoadPointsV1";
import type {
  MainWireNormalAdultStressedVenousVolumeResearchPointIdV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultBloodVolumeOperatingPointV1";
import {
  resolveMainWireVentricularCalciumSourceTraceFitTrefPassiveDistortionCandidateV1,
  type MainWireVentricularCalciumSourceTraceFitTrefPassiveDistortionCandidateIdV1,
  type MainWireVentricularCalciumSourceTraceFitTrefPassiveDistortionCandidateV1,
} from "@/engine/myocardium/experiments/MainWireVentricularCalciumSourceTraceFitTrefPassiveDistortionCandidatesV1";

export const MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_SHORTLIST_LOAD_ENVELOPE_V1_ID =
  "main-wire-ventricular-calcium-source-trace-fit-shortlist-load-envelope-v1" as const;

export const MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_SHORTLIST_CANDIDATE_IDS_V1 =
  Object.freeze([
    "tref-1p10-passive-0p750-plus-distortion-transient-high",
    "tref-1p20-passive-0p750-plus-distortion-transient-high",
    "tref-1p30-passive-0p750-plus-distortion-transient-high",
  ] as const satisfies readonly MainWireVentricularCalciumSourceTraceFitTrefPassiveDistortionCandidateIdV1[]);

export type MainWireVentricularCalciumSourceTraceFitShortlistCandidateIdV1 =
  (typeof MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_SHORTLIST_CANDIDATE_IDS_V1)[number];

export const MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_SHORTLIST_ARM_IDS_V1 =
  Object.freeze([
    "canonical",
    ...MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_SHORTLIST_CANDIDATE_IDS_V1,
  ] as const);

export type MainWireVentricularCalciumSourceTraceFitShortlistArmIdV1 =
  (typeof MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_SHORTLIST_ARM_IDS_V1)[number];

export const MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_SHORTLIST_LOAD_CONTEXT_IDS_V1 =
  Object.freeze([
    "systemic-resistance-low",
    "baseline",
    "systemic-resistance-high",
    "stressed-venous-volume-low",
    "stressed-venous-volume-high",
  ] as const);

export type MainWireVentricularCalciumSourceTraceFitShortlistLoadContextIdV1 =
  (typeof MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_SHORTLIST_LOAD_CONTEXT_IDS_V1)[number];

export type MainWireVentricularCalciumSourceTraceFitShortlistArmV1 = Readonly<{
  armId: MainWireVentricularCalciumSourceTraceFitShortlistArmIdV1;
  role: "canonical-control" | "source-calcium-mechanics-shortlist";
  candidate:
    MainWireVentricularCalciumSourceTraceFitTrefPassiveDistortionCandidateV1
    | null;
}>;

export type MainWireVentricularCalciumSourceTraceFitShortlistLoadContextV1 =
  Readonly<{
    contextId:
      MainWireVentricularCalciumSourceTraceFitShortlistLoadContextIdV1;
    circulatoryLoadPointId: Extract<
      MainWireNormalAdultFiveWallCirculatoryLoadPointIdV1,
      "baseline" | "systemic-resistance-low" | "systemic-resistance-high"
    >;
    stressedVenousVolumePointId:
      MainWireNormalAdultStressedVenousVolumeResearchPointIdV1;
    changedLoadAxis: "none" | "systemic-resistance" | "fixed-total-blood-volume";
    level: "baseline" | "low" | "high";
  }>;

export const MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_SHORTLIST_LOAD_ENVELOPE_CLAIM_V1 =
  Object.freeze({
    role: "fixed-three-candidate-by-five-load-context-robustness-envelope" as const,
    shortlistSelectionOutcomeInformed: true as const,
    shortlistRule:
      "three-passive-0p75-distortion-arms-spanning-retained-Tref-range" as const,
    canonicalComparatorAtEveryContext: true as const,
    loadAxes: Object.freeze([
      "systemic-resistance",
      "fixed-total-blood-volume-via-stressed-venous-volume",
    ] as const),
    loadScales: Object.freeze([0.75, 1, 4 / 3] as const),
    oneLoadAxisAtATime: true as const,
    loadAxesAreRobustnessCoordinatesNotCalibrationKnobs: true as const,
    independentColdStartPerRun: true as const,
    commonVentricularSourceCalciumWithinShortlist: true as const,
    aorticValveAreaOrLawChanged: false as const,
    pulmonaryValveAreaOrLawChanged: false as const,
    valveStateOrLocalInertanceAdded: false as const,
    acceptedStateOrCheckpointTopologyChanged: false as const,
    genericParameterPatchAccepted: false as const,
    numericParameterSearchOrFitting: false as const,
    clinicalValidationClaimed: false as const,
    canonicalAdoptionEstablished: false as const,
  });

const LOAD_CONTEXTS = Object.freeze({
  "systemic-resistance-low": context(
    "systemic-resistance-low",
    "systemic-resistance-low",
    "baseline",
    "systemic-resistance",
    "low",
  ),
  baseline: context("baseline", "baseline", "baseline", "none", "baseline"),
  "systemic-resistance-high": context(
    "systemic-resistance-high",
    "systemic-resistance-high",
    "baseline",
    "systemic-resistance",
    "high",
  ),
  "stressed-venous-volume-low": context(
    "stressed-venous-volume-low",
    "baseline",
    "stressed-venous-volume-low",
    "fixed-total-blood-volume",
    "low",
  ),
  "stressed-venous-volume-high": context(
    "stressed-venous-volume-high",
    "baseline",
    "stressed-venous-volume-high",
    "fixed-total-blood-volume",
    "high",
  ),
} satisfies Readonly<Record<
  MainWireVentricularCalciumSourceTraceFitShortlistLoadContextIdV1,
  MainWireVentricularCalciumSourceTraceFitShortlistLoadContextV1
>>);

export function resolveMainWireVentricularCalciumSourceTraceFitShortlistArmV1(
  armId: MainWireVentricularCalciumSourceTraceFitShortlistArmIdV1,
): MainWireVentricularCalciumSourceTraceFitShortlistArmV1 {
  if (armId === "canonical") {
    return Object.freeze({
      armId,
      role: "canonical-control" as const,
      candidate: null,
    });
  }
  if (!MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_SHORTLIST_CANDIDATE_IDS_V1
    .includes(armId)) {
    throw new Error(`unsupported source-calcium shortlist arm: ${String(armId)}`);
  }
  return Object.freeze({
    armId,
    role: "source-calcium-mechanics-shortlist" as const,
    candidate:
      resolveMainWireVentricularCalciumSourceTraceFitTrefPassiveDistortionCandidateV1(
        armId,
      ),
  });
}

export function resolveMainWireVentricularCalciumSourceTraceFitShortlistLoadContextV1(
  contextId:
    MainWireVentricularCalciumSourceTraceFitShortlistLoadContextIdV1,
): MainWireVentricularCalciumSourceTraceFitShortlistLoadContextV1 {
  const resolved = LOAD_CONTEXTS[contextId];
  if (resolved === undefined) {
    throw new Error(`unsupported source-calcium shortlist load context: ${String(contextId)}`);
  }
  return resolved;
}

function context(
  contextId:
    MainWireVentricularCalciumSourceTraceFitShortlistLoadContextIdV1,
  circulatoryLoadPointId:
    MainWireVentricularCalciumSourceTraceFitShortlistLoadContextV1["circulatoryLoadPointId"],
  stressedVenousVolumePointId:
    MainWireVentricularCalciumSourceTraceFitShortlistLoadContextV1["stressedVenousVolumePointId"],
  changedLoadAxis:
    MainWireVentricularCalciumSourceTraceFitShortlistLoadContextV1["changedLoadAxis"],
  level: MainWireVentricularCalciumSourceTraceFitShortlistLoadContextV1["level"],
): MainWireVentricularCalciumSourceTraceFitShortlistLoadContextV1 {
  return Object.freeze({
    contextId,
    circulatoryLoadPointId,
    stressedVenousVolumePointId,
    changedLoadAxis,
    level,
  });
}
