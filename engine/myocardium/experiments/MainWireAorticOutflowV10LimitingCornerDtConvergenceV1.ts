import {
  resolveMainWireAorticOutflowPhysiologyCandidateCombinedLoadContextV1,
  type MainWireAorticOutflowPhysiologyCandidateCombinedLoadContextV1,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowPhysiologyCandidateCombinedLoadEnvelopeV1";
import {
  MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V10,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowPhysiologyCandidateV10";

export const MAIN_WIRE_AORTIC_OUTFLOW_V10_LIMITING_CORNER_DT_CONVERGENCE_V1_ID =
  "main-wire-aortic-outflow-v10-limiting-corner-dt-convergence-v1" as const;

export const MAIN_WIRE_AORTIC_OUTFLOW_V10_LIMITING_CORNER_DT_VALUES_SEC_V1 =
  Object.freeze([0.002, 0.001, 0.0005] as const);

export type MainWireAorticOutflowV10LimitingCornerSelectionIdV1 =
  | "dt2-ejection-time-minimum"
  | "dt2-ejection-time-maximum"
  | "dt2-tei-index-maximum"
  | "dt2-negative-dpdt-magnitude-minimum-and-acceleration-time-failure";

export type MainWireAorticOutflowV10LimitingCornerV1 = Readonly<{
  selectionId: MainWireAorticOutflowV10LimitingCornerSelectionIdV1;
  selectionBasis:
    | "minimum-ejection-time-in-fixed-V10-dt2-full-factorial-envelope"
    | "maximum-ejection-time-in-fixed-V10-dt2-full-factorial-envelope"
    | "maximum-left-ventricular-Tei-index-in-fixed-V10-dt2-full-factorial-envelope"
    | "minimum-left-ventricular-negative-dpdt-magnitude-and-acceleration-time-interval-failure-in-fixed-V10-dt2-full-factorial-envelope";
  context: MainWireAorticOutflowPhysiologyCandidateCombinedLoadContextV1;
}>;

export const MAIN_WIRE_AORTIC_OUTFLOW_V10_LIMITING_CORNERS_V1 = Object.freeze([
  limitingCorner(
    "dt2-ejection-time-minimum",
    "minimum-ejection-time-in-fixed-V10-dt2-full-factorial-envelope",
    "systemic-resistance-low+arterial-stiffness-three-halves+stressed-venous-volume-low+tref-force-load-high",
  ),
  limitingCorner(
    "dt2-ejection-time-maximum",
    "maximum-ejection-time-in-fixed-V10-dt2-full-factorial-envelope",
    "systemic-resistance-low+arterial-stiffness-eight-thirds+stressed-venous-volume-high+tref-force-load-low",
  ),
  limitingCorner(
    "dt2-tei-index-maximum",
    "maximum-left-ventricular-Tei-index-in-fixed-V10-dt2-full-factorial-envelope",
    "systemic-resistance-high+arterial-stiffness-three-halves+stressed-venous-volume-low+tref-force-load-high",
  ),
  limitingCorner(
    "dt2-negative-dpdt-magnitude-minimum-and-acceleration-time-failure",
    "minimum-left-ventricular-negative-dpdt-magnitude-and-acceleration-time-interval-failure-in-fixed-V10-dt2-full-factorial-envelope",
    "systemic-resistance-low+arterial-stiffness-three-halves+stressed-venous-volume-low+tref-force-load-low",
  ),
] as const satisfies readonly MainWireAorticOutflowV10LimitingCornerV1[]);

export const MAIN_WIRE_AORTIC_OUTFLOW_V10_LIMITING_CORNER_DT_CONVERGENCE_CLAIM_V1 =
  Object.freeze({
    role:
      "fixed-V10-post-envelope-limiting-corner-time-step-convergence" as const,
    fixedCandidate: MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V10,
    dtValuesSec:
      MAIN_WIRE_AORTIC_OUTFLOW_V10_LIMITING_CORNER_DT_VALUES_SEC_V1,
    limitingContextCount: 4 as const,
    fullDesignArmCount: 12 as const,
    limitingContextsSelectedFrom:
      "prior-fixed-V10-dt2-four-axis-full-factorial-envelope" as const,
    limitingContextsFixedBeforeThisDtComparison: true as const,
    limitingContextSelectionIsIndependentValidation: false as const,
    independentCanonicalColdStartPerRun: true as const,
    warmStartApplied: false as const,
    exactProtocolIdentityExpectedStableAcrossDtWithinContext: true as const,
    pressureRecoveryAndLocalPortOwnershipHeldAtV10: true as const,
    aorticValveMaximumEoaHeldAtCm2: 3.5 as const,
    systemicOrVolumeRecalibrationApplied: false as const,
    parameterSearchOrFitting: false as const,
    newContinuousStateAdded: false as const,
    acceptedStateOrCheckpointTopologyChanged: false as const,
    finestDtIsExactContinuumSolutionClaimed: false as const,
    aorticEjectionTimeProxyKeptDistinctFromValveEventEjectionTime:
      true as const,
    clinicalValidationClaimed: false as const,
    canonicalAdoptionEstablished: false as const,
  });

export function resolveMainWireAorticOutflowV10LimitingCornerV1(
  selectionId: MainWireAorticOutflowV10LimitingCornerSelectionIdV1,
): MainWireAorticOutflowV10LimitingCornerV1 {
  const resolved = MAIN_WIRE_AORTIC_OUTFLOW_V10_LIMITING_CORNERS_V1.find(
    (corner) => corner.selectionId === selectionId,
  );
  if (resolved === undefined) {
    throw new Error(`unsupported V10 limiting-corner selection: ${selectionId}`);
  }
  return resolved;
}

function limitingCorner(
  selectionId: MainWireAorticOutflowV10LimitingCornerSelectionIdV1,
  selectionBasis: MainWireAorticOutflowV10LimitingCornerV1["selectionBasis"],
  contextId: string,
): MainWireAorticOutflowV10LimitingCornerV1 {
  return Object.freeze({
    selectionId,
    selectionBasis,
    context:
      resolveMainWireAorticOutflowPhysiologyCandidateCombinedLoadContextV1(
        contextId,
      ),
  });
}
