import type {
  MainWireNormalAdultFiveWallCirculatoryLoadPointIdV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallCirculatoryLoadPointsV1";
import type {
  MainWireNormalAdultStressedVenousVolumeResearchPointIdV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultBloodVolumeOperatingPointV1";
import type {
  MainWireNormalAdultVentricularMaterialResearchPointIdV1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";

export const MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_CANDIDATE_LOAD_ENVELOPE_V1_ID =
  "main-wire-aortic-outflow-ejection-timing-candidate-load-envelope-v1" as const;

export const MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_CANDIDATE_IDS_V1 =
  Object.freeze([
    "canonical",
    "velocity-distortion-threefold-tref-three-halves",
  ] as const);

export type MainWireAorticOutflowEjectionTimingCandidateIdV1 =
  (typeof MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_CANDIDATE_IDS_V1)[number];

export const MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_LOAD_CONTEXT_IDS_V1 =
  Object.freeze([
    "systemic-resistance-low",
    "baseline",
    "systemic-resistance-high",
    "arterial-stiffness-low",
    "arterial-stiffness-high",
    "stressed-venous-volume-low",
    "stressed-venous-volume-high",
  ] as const);

export type MainWireAorticOutflowEjectionTimingLoadContextIdV1 =
  (typeof MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_LOAD_CONTEXT_IDS_V1)[number];

export type MainWireAorticOutflowEjectionTimingCandidateV1 = Readonly<{
  candidateId: MainWireAorticOutflowEjectionTimingCandidateIdV1;
  ventricularMaterialPointId: Extract<
    MainWireNormalAdultVentricularMaterialResearchPointIdV1,
    | "baseline"
    | "ventricular-velocity-distortion-threefold-plus-tref-three-halves"
  >;
  aeffScaleFromBaseline: 1 | 3;
  trefScaleFromBaseline: 1 | number;
}>;

export type MainWireAorticOutflowEjectionTimingLoadContextV1 = Readonly<{
  contextId: MainWireAorticOutflowEjectionTimingLoadContextIdV1;
  circulatoryLoadPointId: Extract<
    MainWireNormalAdultFiveWallCirculatoryLoadPointIdV1,
    | "baseline"
    | "systemic-resistance-low"
    | "systemic-resistance-high"
    | "arterial-stiffness-low"
    | "arterial-stiffness-high"
  >;
  stressedVenousVolumePointId:
    MainWireNormalAdultStressedVenousVolumeResearchPointIdV1;
  changedLoadAxis:
    | "none"
    | "systemic-resistance"
    | "arterial-stiffness"
    | "stressed-venous-volume";
  level: "baseline" | "low" | "high";
}>;

export const MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_CANDIDATE_LOAD_CLAIM_V1 =
  Object.freeze({
    role:
      "fixed-canonical-paired-Aeff-threefold-Tref-three-halves-seven-context-load-envelope" as const,
    loadAxes: Object.freeze([
      "systemic-resistance",
      "global-arterial-PV-stiffness",
      "fixed-total-blood-volume-via-stressed-venous-volume",
    ] as const),
    loadScales: Object.freeze([0.75, 1, 4 / 3] as const),
    oneLoadAxisAtATime: true as const,
    canonicalComparatorAtEveryContext: true as const,
    candidateSelectedFromPriorEtFirstFactorial: true as const,
    calciumDriveChanged: false as const,
    passiveOrSlsChanged: false as const,
    aorticValveConstitutiveLawChanged: false as const,
    landStateCountChanged: false as const,
    acceptedStateOrCheckpointTopologyChanged: false as const,
    independentCanonicalColdStartPerRun: true as const,
    genericParameterPatchAccepted: false as const,
    parameterSearchOrFitting: false as const,
    clinicalValidationClaimed: false as const,
  });

export const MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_CANDIDATES_V1 =
  Object.freeze({
    canonical: candidate("canonical", "baseline", 1, 1),
    "velocity-distortion-threefold-tref-three-halves": candidate(
      "velocity-distortion-threefold-tref-three-halves",
      "ventricular-velocity-distortion-threefold-plus-tref-three-halves",
      3,
      1.5,
    ),
  } satisfies Readonly<Record<
    MainWireAorticOutflowEjectionTimingCandidateIdV1,
    MainWireAorticOutflowEjectionTimingCandidateV1
  >>);

export const MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_LOAD_CONTEXTS_V1 =
  Object.freeze({
    "systemic-resistance-low": context(
      "systemic-resistance-low", "systemic-resistance-low", "baseline",
      "systemic-resistance", "low",
    ),
    baseline: context(
      "baseline", "baseline", "baseline", "none", "baseline",
    ),
    "systemic-resistance-high": context(
      "systemic-resistance-high", "systemic-resistance-high", "baseline",
      "systemic-resistance", "high",
    ),
    "arterial-stiffness-low": context(
      "arterial-stiffness-low", "arterial-stiffness-low", "baseline",
      "arterial-stiffness", "low",
    ),
    "arterial-stiffness-high": context(
      "arterial-stiffness-high", "arterial-stiffness-high", "baseline",
      "arterial-stiffness", "high",
    ),
    "stressed-venous-volume-low": context(
      "stressed-venous-volume-low", "baseline", "stressed-venous-volume-low",
      "stressed-venous-volume", "low",
    ),
    "stressed-venous-volume-high": context(
      "stressed-venous-volume-high", "baseline", "stressed-venous-volume-high",
      "stressed-venous-volume", "high",
    ),
  } satisfies Readonly<Record<
    MainWireAorticOutflowEjectionTimingLoadContextIdV1,
    MainWireAorticOutflowEjectionTimingLoadContextV1
  >>);

export function resolveMainWireAorticOutflowEjectionTimingCandidateV1(
  candidateId: MainWireAorticOutflowEjectionTimingCandidateIdV1,
): MainWireAorticOutflowEjectionTimingCandidateV1 {
  const resolved =
    MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_CANDIDATES_V1[candidateId];
  if (resolved === undefined) {
    throw new Error(`unsupported ejection-timing candidate: ${String(candidateId)}`);
  }
  return resolved;
}

export function resolveMainWireAorticOutflowEjectionTimingLoadContextV1(
  contextId: MainWireAorticOutflowEjectionTimingLoadContextIdV1,
): MainWireAorticOutflowEjectionTimingLoadContextV1 {
  const resolved =
    MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_LOAD_CONTEXTS_V1[contextId];
  if (resolved === undefined) {
    throw new Error(`unsupported ejection-timing load context: ${String(contextId)}`);
  }
  return resolved;
}

function candidate(
  candidateId: MainWireAorticOutflowEjectionTimingCandidateIdV1,
  ventricularMaterialPointId:
    MainWireAorticOutflowEjectionTimingCandidateV1["ventricularMaterialPointId"],
  aeffScaleFromBaseline: 1 | 3,
  trefScaleFromBaseline: number,
): MainWireAorticOutflowEjectionTimingCandidateV1 {
  return Object.freeze({
    candidateId,
    ventricularMaterialPointId,
    aeffScaleFromBaseline,
    trefScaleFromBaseline,
  });
}

function context(
  contextId: MainWireAorticOutflowEjectionTimingLoadContextIdV1,
  circulatoryLoadPointId:
    MainWireAorticOutflowEjectionTimingLoadContextV1["circulatoryLoadPointId"],
  stressedVenousVolumePointId:
    MainWireNormalAdultStressedVenousVolumeResearchPointIdV1,
  changedLoadAxis:
    MainWireAorticOutflowEjectionTimingLoadContextV1["changedLoadAxis"],
  level: MainWireAorticOutflowEjectionTimingLoadContextV1["level"],
): MainWireAorticOutflowEjectionTimingLoadContextV1 {
  return Object.freeze({
    contextId,
    circulatoryLoadPointId,
    stressedVenousVolumePointId,
    changedLoadAxis,
    level,
  });
}
