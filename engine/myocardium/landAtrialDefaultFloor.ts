import {
  LANDATRIAL_RUNTIME_CANDIDATE_ACTIVE_OVERRIDES,
  LANDATRIAL_RUNTIME_CANDIDATE_CLAIM_BOUNDARY,
  LANDATRIAL_RUNTIME_CANDIDATE_PHASE5BK_ID,
  LANDATRIAL_RUNTIME_CANDIDATE_SOURCE_PROVIDER_IDS,
} from "@/engine/myocardium/landAtrialRuntimeCandidate";
import { LANDATRIAL_SHADOW_PARAMETER_PACK_ID } from "@/engine/myocardium/atrialLandShadow";
import {
  MODELCORE_RUNTIME_ALL_CHAMBER_LANDATRIAL_DEFAULT_MODE,
  MODELCORE_RUNTIME_LV_LAND_SOURCE_PROVIDER_ID,
  MODELCORE_RUNTIME_RV_LAND_SOURCE_PROVIDER_ID,
} from "@/engine/myocardium/runtimeActiveSource";
import { MODELCORE_RUNTIME_ROOT_ZC_SOURCED_BOUNDARY_ROOT_DEFAULT_MODE } from "@/engine/myocardium/runtimeRootZc";

export const LANDATRIAL_DEFAULT_FLOOR_V1_ID =
  "landatrial-default-floor-v1" as const;
export const LANDATRIAL_DEFAULT_FLOOR_PHASE5BL_RESULT_ID =
  "landatrial-default-floor-phase5bl-result-v1" as const;
export const LANDATRIAL_DEFAULT_FLOOR_SELECTED_CANDIDATE_ID =
  "landatrial-runtime-candidate-la22-ra26" as const;
export const LANDATRIAL_DEFAULT_FLOOR_CLAIM_BOUNDARY =
  "user0-staged-landatrial-default-floor-no-physiology-acceptance" as const;

export const LANDATRIAL_DEFAULT_FLOOR_POINT_IDS = [
  "normal-hr75",
  "low-preload-hr75",
  "high-preload-hr75",
  "normal-hr90",
  "low-preload-hr90",
  "high-preload-hr90",
] as const;

export const LANDATRIAL_DEFAULT_FLOOR_DASHBOARD_AXES = [
  "health-output",
  "raw-atrial-pv-readability",
  "volume-function",
  "pressure-wave-timing",
  "av-plane-effective-wall-geometry",
  "direct-wall-strain",
  "valve-diode-measurement-hygiene",
  "hr75-hr90-preload-robustness",
] as const;

export const LANDATRIAL_DEFAULT_FLOOR_NOT_ACCEPTED_CLAIMS = [
  "atrial-physiology-acceptance",
  "official-morphology-acceptance",
  "valve-load-timing-acceptance",
  "af-validation",
  "qdot-clamp-removal",
  "legacy-active-stress-deletion",
  "clinical-or-scientific-validation",
] as const;

export const LANDATRIAL_DEFAULT_FLOOR_V1_CONTRACT = deepFreeze({
  floorId: LANDATRIAL_DEFAULT_FLOOR_V1_ID,
  selectedCandidateId: LANDATRIAL_DEFAULT_FLOOR_SELECTED_CANDIDATE_ID,
  runtimeActiveSourceMode: MODELCORE_RUNTIME_ALL_CHAMBER_LANDATRIAL_DEFAULT_MODE,
  rootZcMode: MODELCORE_RUNTIME_ROOT_ZC_SOURCED_BOUNDARY_ROOT_DEFAULT_MODE,
  sourceProviderScope: "LV+RV+LA+RA",
  sourceProviderIds: {
    LV: MODELCORE_RUNTIME_LV_LAND_SOURCE_PROVIDER_ID,
    RV: MODELCORE_RUNTIME_RV_LAND_SOURCE_PROVIDER_ID,
    LA: LANDATRIAL_RUNTIME_CANDIDATE_SOURCE_PROVIDER_IDS.LA,
    RA: LANDATRIAL_RUNTIME_CANDIDATE_SOURCE_PROVIDER_IDS.RA,
  },
  atrialParameterPackId: LANDATRIAL_SHADOW_PARAMETER_PACK_ID,
  atrialRuntimeCandidateId: LANDATRIAL_RUNTIME_CANDIDATE_PHASE5BK_ID,
  atrialRuntimeCandidateClaimBoundary: LANDATRIAL_RUNTIME_CANDIDATE_CLAIM_BOUNDARY,
  atrialActiveOverrides: LANDATRIAL_RUNTIME_CANDIDATE_ACTIVE_OVERRIDES,
  envelopePointIds: LANDATRIAL_DEFAULT_FLOOR_POINT_IDS,
  dashboardAxes: LANDATRIAL_DEFAULT_FLOOR_DASHBOARD_AXES,
  notAcceptedClaims: LANDATRIAL_DEFAULT_FLOOR_NOT_ACCEPTED_CLAIMS,
  a1A2Policy: "frozen-diagnostic-scaffolds-not-selection-candidates",
  valvePolicy: "measurement-confounder-not-solved-mechanism",
  calibrationPolicy:
    "continue from this LandAtrial floor; do not tune A1/A2, qDot/rootZc, valve thresholds, Tref, source-stress scale, or official cases to buy atrial morphology",
  stage: "user0-staged-default-floor",
} as const);

function deepFreeze<T>(value: T): T {
  if (!value || typeof value !== "object") return value;
  Object.freeze(value);
  for (const entry of Object.values(value as Record<string, unknown>)) {
    if (entry && typeof entry === "object" && !Object.isFrozen(entry)) {
      deepFreeze(entry);
    }
  }
  return value;
}
