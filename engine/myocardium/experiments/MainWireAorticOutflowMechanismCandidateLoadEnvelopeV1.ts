import type {
  MainWireNormalAdultFiveWallCirculatoryLoadPointIdV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallCirculatoryLoadPointsV1";
import type {
  MainWireNormalAdultStressedVenousVolumeResearchPointIdV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultBloodVolumeOperatingPointV1";
import type {
  MainWireNormalAdultVentricularMaterialResearchPointIdV1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";

export const MAIN_WIRE_AORTIC_OUTFLOW_MECHANISM_CANDIDATE_LOAD_ENVELOPE_V1_ID =
  "main-wire-aortic-outflow-mechanism-candidate-load-envelope-v1" as const;

export const MAIN_WIRE_AORTIC_OUTFLOW_MECHANISM_CANDIDATE_IDS_V1 =
  Object.freeze([
    "canonical",
    "distortion-transient-four-thirds",
    "peak-tension-length-half",
  ] as const);

export type MainWireAorticOutflowMechanismCandidateIdV1 =
  (typeof MAIN_WIRE_AORTIC_OUTFLOW_MECHANISM_CANDIDATE_IDS_V1)[number];

export const MAIN_WIRE_AORTIC_OUTFLOW_MECHANISM_LOAD_CONTEXT_IDS_V1 =
  Object.freeze([
    "systemic-resistance-low",
    "baseline",
    "systemic-resistance-high",
    "stressed-venous-volume-low",
    "stressed-venous-volume-high",
  ] as const);

export type MainWireAorticOutflowMechanismLoadContextIdV1 =
  (typeof MAIN_WIRE_AORTIC_OUTFLOW_MECHANISM_LOAD_CONTEXT_IDS_V1)[number];

export type MainWireAorticOutflowMechanismCandidateV1 = Readonly<{
  candidateId: MainWireAorticOutflowMechanismCandidateIdV1;
  ventricularMaterialPointId: Extract<
    MainWireNormalAdultVentricularMaterialResearchPointIdV1,
    | "baseline"
    | "ventricular-velocity-distortion-high-plus-recovery-high"
    | "ventricular-peak-tension-length-dependence-half"
  >;
  changedMechanism:
    | "none"
    | "Land-distortion-transient-timescale"
    | "Land-peak-tension-length-dependence";
}>;

export type MainWireAorticOutflowMechanismLoadContextV1 = Readonly<{
  contextId: MainWireAorticOutflowMechanismLoadContextIdV1;
  circulatoryLoadPointId: Extract<
    MainWireNormalAdultFiveWallCirculatoryLoadPointIdV1,
    "baseline" | "systemic-resistance-low" | "systemic-resistance-high"
  >;
  stressedVenousVolumePointId:
    MainWireNormalAdultStressedVenousVolumeResearchPointIdV1;
  changedLoadAxis: "none" | "systemic-resistance" | "stressed-venous-volume";
  level: "baseline" | "low" | "high";
}>;

export const MAIN_WIRE_AORTIC_OUTFLOW_MECHANISM_CANDIDATE_LOAD_CLAIM_V1 =
  Object.freeze({
    role:
      "fixed-two-candidate-by-five-load-context-robustness-envelope" as const,
    candidateSelection: Object.freeze([
      "smallest-proportional-Aeff-phi-distortion-transient-arm",
      "strongest-retained-single-beta0-arm",
    ] as const),
    candidateSelectionOutcomeInformed: true as const,
    loadAxes: Object.freeze([
      "systemic-resistance",
      "fixed-total-blood-volume-via-stressed-venous-volume",
    ] as const),
    loadScales: Object.freeze([0.75, 1, 4 / 3] as const),
    oneLoadAxisAtATime: true as const,
    canonicalComparatorAtEveryContext: true as const,
    independentCanonicalColdStartPerRun: true as const,
    calciumDriveChanged: false as const,
    ventricularTrefChanged: false as const,
    passiveOrSlsChanged: false as const,
    aorticValveConstitutiveLawChanged: false as const,
    acceptedStateOrCheckpointTopologyChanged: false as const,
    genericParameterPatchAccepted: false as const,
    numericParameterSearchOrFitting: false as const,
    clinicalValidationClaimed: false as const,
  });

export const MAIN_WIRE_AORTIC_OUTFLOW_MECHANISM_CANDIDATES_V1 = Object.freeze({
  canonical: candidate("canonical", "baseline", "none"),
  "distortion-transient-four-thirds": candidate(
    "distortion-transient-four-thirds",
    "ventricular-velocity-distortion-high-plus-recovery-high",
    "Land-distortion-transient-timescale",
  ),
  "peak-tension-length-half": candidate(
    "peak-tension-length-half",
    "ventricular-peak-tension-length-dependence-half",
    "Land-peak-tension-length-dependence",
  ),
} satisfies Readonly<Record<
  MainWireAorticOutflowMechanismCandidateIdV1,
  MainWireAorticOutflowMechanismCandidateV1
>>);

export const MAIN_WIRE_AORTIC_OUTFLOW_MECHANISM_LOAD_CONTEXTS_V1 = Object.freeze({
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
    "stressed-venous-volume",
    "low",
  ),
  "stressed-venous-volume-high": context(
    "stressed-venous-volume-high",
    "baseline",
    "stressed-venous-volume-high",
    "stressed-venous-volume",
    "high",
  ),
} satisfies Readonly<Record<
  MainWireAorticOutflowMechanismLoadContextIdV1,
  MainWireAorticOutflowMechanismLoadContextV1
>>);

export function resolveMainWireAorticOutflowMechanismCandidateV1(
  candidateId: MainWireAorticOutflowMechanismCandidateIdV1,
): MainWireAorticOutflowMechanismCandidateV1 {
  const resolved = MAIN_WIRE_AORTIC_OUTFLOW_MECHANISM_CANDIDATES_V1[candidateId];
  if (resolved === undefined) {
    throw new Error(`unsupported aortic outflow candidate: ${String(candidateId)}`);
  }
  return resolved;
}

export function resolveMainWireAorticOutflowMechanismLoadContextV1(
  contextId: MainWireAorticOutflowMechanismLoadContextIdV1,
): MainWireAorticOutflowMechanismLoadContextV1 {
  const resolved = MAIN_WIRE_AORTIC_OUTFLOW_MECHANISM_LOAD_CONTEXTS_V1[contextId];
  if (resolved === undefined) {
    throw new Error(`unsupported aortic outflow load context: ${String(contextId)}`);
  }
  return resolved;
}

function candidate(
  candidateId: MainWireAorticOutflowMechanismCandidateIdV1,
  ventricularMaterialPointId:
    MainWireAorticOutflowMechanismCandidateV1["ventricularMaterialPointId"],
  changedMechanism:
    MainWireAorticOutflowMechanismCandidateV1["changedMechanism"],
): MainWireAorticOutflowMechanismCandidateV1 {
  return Object.freeze({
    candidateId,
    ventricularMaterialPointId,
    changedMechanism,
  });
}

function context(
  contextId: MainWireAorticOutflowMechanismLoadContextIdV1,
  circulatoryLoadPointId:
    MainWireAorticOutflowMechanismLoadContextV1["circulatoryLoadPointId"],
  stressedVenousVolumePointId:
    MainWireAorticOutflowMechanismLoadContextV1["stressedVenousVolumePointId"],
  changedLoadAxis:
    MainWireAorticOutflowMechanismLoadContextV1["changedLoadAxis"],
  level: MainWireAorticOutflowMechanismLoadContextV1["level"],
): MainWireAorticOutflowMechanismLoadContextV1 {
  return Object.freeze({
    contextId,
    circulatoryLoadPointId,
    stressedVenousVolumePointId,
    changedLoadAxis,
    level,
  });
}
