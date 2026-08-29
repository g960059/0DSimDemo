import {
  resolveMainWireAorticOutflowPhysiologyCandidateCombinedLoadContextV1,
  type MainWireAorticOutflowPhysiologyCandidateCombinedLoadContextV1,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowPhysiologyCandidateCombinedLoadEnvelopeV1";
import type {
  MainWireAorticCharacteristicResistancePlacementProfileIdV1,
} from "@/engine/valves/MainWireAorticCharacteristicResistancePlacementV1";

export const MAIN_WIRE_AORTIC_OUTFLOW_CHARACTERISTIC_RESISTANCE_DAMPING_V1_ID =
  "main-wire-aortic-outflow-characteristic-resistance-damping-v1" as const;

export const MAIN_WIRE_AORTIC_OUTFLOW_CHARACTERISTIC_RESISTANCE_DAMPING_PLACEMENT_PROFILE_IDS_V1 =
  Object.freeze([
    "all-Ao-SA-resistance-upstream-of-root-compliance",
    "Land2017-characteristic-impedance-matched",
    "half-Ao-SA-resistance-upstream-of-root-compliance",
  ] as const satisfies readonly
    MainWireAorticCharacteristicResistancePlacementProfileIdV1[]);

export const MAIN_WIRE_AORTIC_OUTFLOW_CHARACTERISTIC_RESISTANCE_DAMPING_CONTEXT_IDS_V1 =
  Object.freeze([
    "systemic-resistance-low+arterial-stiffness-eight-thirds+stressed-venous-volume-high+tref-force-load-low",
    "systemic-resistance-low+arterial-stiffness-eight-thirds+stressed-venous-volume-high+tref-force-load-high",
    "systemic-resistance-high+arterial-stiffness-eight-thirds+stressed-venous-volume-low+tref-force-load-low",
    "systemic-resistance-high+arterial-stiffness-eight-thirds+stressed-venous-volume-high+tref-force-load-low",
    "systemic-resistance-high+arterial-stiffness-eight-thirds+stressed-venous-volume-high+tref-force-load-high",
  ] as const);

export type MainWireAorticOutflowCharacteristicResistanceDampingContextIdV1 =
  (typeof MAIN_WIRE_AORTIC_OUTFLOW_CHARACTERISTIC_RESISTANCE_DAMPING_CONTEXT_IDS_V1)[number];

export const MAIN_WIRE_AORTIC_OUTFLOW_CHARACTERISTIC_RESISTANCE_DAMPING_CLAIM_V1 =
  Object.freeze({
    role:
      "fixed-three-placement-by-five-high-stiffness-limiting-context-bracket" as const,
    placementAxis:
      MAIN_WIRE_AORTIC_OUTFLOW_CHARACTERISTIC_RESISTANCE_DAMPING_PLACEMENT_PROFILE_IDS_V1,
    contextAxis:
      MAIN_WIRE_AORTIC_OUTFLOW_CHARACTERISTIC_RESISTANCE_DAMPING_CONTEXT_IDS_V1,
    limitingContextSelection:
      "all-upstream-half-millisecond-arms-with-more-than-one-strict-aortic-flow-maximum" as const,
    primaryMechanismQuestion:
      "whether-zero-direct-Ao-SA-series-resistance-permits-an-inertance-between-two-compliances-exchange-mode" as const,
    sourceAoSaLinearResistanceSumPreservedAcrossPlacements: true as const,
    allUpstreamPlacementLeavesZeroDirectAoSaSeriesResistance: true as const,
    Land2017PlacementLeavesPositiveDirectAoSaSeriesResistance: true as const,
    halfPlacementIsSymmetricFixedLossPartition: true as const,
    aorticValveAreaOrOpeningLawChanged: false as const,
    rootInertanceChanged: false as const,
    arterialComplianceChangedWithinMatchedContext: false as const,
    calciumOrMechanicsChangedWithinMatchedContext: false as const,
    acceptedStateOrCheckpointTopologyChanged: false as const,
    newContinuousStateAdded: false as const,
    parameterSearchOrFitting: false as const,
    clinicalValidationClaimed: false as const,
    canonicalAdoptionEstablished: false as const,
  });

export function resolveMainWireAorticOutflowCharacteristicResistanceDampingContextV1(
  contextId: MainWireAorticOutflowCharacteristicResistanceDampingContextIdV1,
): MainWireAorticOutflowPhysiologyCandidateCombinedLoadContextV1 {
  if (
    !MAIN_WIRE_AORTIC_OUTFLOW_CHARACTERISTIC_RESISTANCE_DAMPING_CONTEXT_IDS_V1
      .includes(contextId)
  ) {
    throw new Error(
      "unsupported characteristic-resistance damping context: "
        + String(contextId),
    );
  }
  return resolveMainWireAorticOutflowPhysiologyCandidateCombinedLoadContextV1(
    contextId,
  );
}
