import type {
  MainWireNormalAdultFiveWallCirculatoryLoadPointIdV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallCirculatoryLoadPointsV1";
import {
  MAIN_WIRE_VENTRICULAR_LAND_ET_REFINEMENT_CANDIDATE_IDS_V1,
  type MainWireVentricularLandEtRefinementCandidateIdV1,
} from "@/engine/myocardium/mechanics/MainWireVentricularLandEtRefinementCandidatesV1";

export const MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_REFINEMENT_V1_ID =
  "main-wire-aortic-outflow-ejection-timing-refinement-v1" as const;

export const MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_REFINEMENT_CANDIDATE_IDS_V1 =
  MAIN_WIRE_VENTRICULAR_LAND_ET_REFINEMENT_CANDIDATE_IDS_V1;

export type MainWireAorticOutflowEjectionTimingRefinementCandidateIdV1 =
  MainWireVentricularLandEtRefinementCandidateIdV1;

export const MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_REFINEMENT_CONTEXT_IDS_V1 =
  Object.freeze(["baseline", "arterial-stiffness-low"] as const);

export type MainWireAorticOutflowEjectionTimingRefinementContextIdV1 =
  (typeof MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_REFINEMENT_CONTEXT_IDS_V1)[number];

export type MainWireAorticOutflowEjectionTimingRefinementContextV1 =
  Readonly<{
    contextId: MainWireAorticOutflowEjectionTimingRefinementContextIdV1;
    circulatoryLoadPointId: Extract<
      MainWireNormalAdultFiveWallCirculatoryLoadPointIdV1,
      "baseline" | "arterial-stiffness-low"
    >;
    role: "nominal" | "prior-envelope-worst-ET";
  }>;

export const MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_REFINEMENT_CLAIM_V1 =
  Object.freeze({
    role:
      "fixed-eight-candidate-by-nominal-and-prior-worst-ET-context-refinement" as const,
    candidateAxis:
      "canonical-kinetics-Aeff-phi-Tref-plus-isometric-informed-rw-TRPN50-Aeff-shortlist" as const,
    contextAxis: "baseline-versus-arterial-stiffness-low" as const,
    candidateValuesOutcomeInformedByPriorEtFactorial: true as const,
    lowStiffnessContextSelectedFromPriorLoadEnvelope: true as const,
    calciumDriveChanged: false as const,
    bloodVolumeChanged: false as const,
    passiveOrSlsChanged: false as const,
    aorticValveConstitutiveLawChanged: false as const,
    landStateCountChanged: false as const,
    acceptedStateOrCheckpointTopologyChanged: false as const,
    independentCanonicalColdStartPerRun: true as const,
    genericParameterPatchAccepted: false as const,
    continuousOptimizationApplied: false as const,
    clinicalValidationClaimed: false as const,
  });

export const MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_REFINEMENT_CONTEXTS_V1 =
  Object.freeze({
    baseline: Object.freeze({
      contextId: "baseline" as const,
      circulatoryLoadPointId: "baseline" as const,
      role: "nominal" as const,
    }),
    "arterial-stiffness-low": Object.freeze({
      contextId: "arterial-stiffness-low" as const,
      circulatoryLoadPointId: "arterial-stiffness-low" as const,
      role: "prior-envelope-worst-ET" as const,
    }),
  } satisfies Readonly<Record<
    MainWireAorticOutflowEjectionTimingRefinementContextIdV1,
    MainWireAorticOutflowEjectionTimingRefinementContextV1
  >>);

export function resolveMainWireAorticOutflowEjectionTimingRefinementContextV1(
  contextId: MainWireAorticOutflowEjectionTimingRefinementContextIdV1,
): MainWireAorticOutflowEjectionTimingRefinementContextV1 {
  const resolved =
    MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_REFINEMENT_CONTEXTS_V1[contextId];
  if (resolved === undefined) {
    throw new Error(`unsupported ET refinement context: ${String(contextId)}`);
  }
  return resolved;
}
