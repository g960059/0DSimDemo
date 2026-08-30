import { MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V10 } from "@/engine/myocardium/experiments/MainWireAorticOutflowPhysiologyCandidateV10";

export const MAIN_WIRE_AORTIC_OUTFLOW_V10_EVENT_DEFINITION_SENSITIVITY_V1_ID =
  "main-wire-aortic-outflow-v10-event-definition-sensitivity-v1" as const;

export const MAIN_WIRE_AORTIC_OUTFLOW_V10_EVENT_FLOW_PEAK_FRACTIONS_V1 =
  Object.freeze([0.001, 0.005, 0.01, 0.02, 0.05] as const);

export const MAIN_WIRE_AORTIC_OUTFLOW_V10_EVENT_VOLUME_WINDOWS_V1 =
  Object.freeze([
    Object.freeze({
      windowId: "forward-volume-2p5-to-97p5-percent" as const,
      lowerQuantile01: 0.025,
      upperQuantile01: 0.975,
    }),
    Object.freeze({
      windowId: "forward-volume-5-to-95-percent" as const,
      lowerQuantile01: 0.05,
      upperQuantile01: 0.95,
    }),
  ] as const);

export const MAIN_WIRE_AORTIC_OUTFLOW_V10_EVENT_DEFINITION_SENSITIVITY_CLAIM_V1 =
  Object.freeze({
    role: "fixed-V10-last-complete-beat-aortic-event-definition-sensitivity" as const,
    fixedCandidate: MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V10,
    mitralAnchors:
      "existing-cycle-diagnostics-one-percent-positive-peak-plus-one-mL-per-second-floor-held-fixed" as const,
    sampledFlowDefinitions:
      "strict-Q-greater-than-threshold-peak-containing-cyclic-episode" as const,
    strictPositiveFlowDefinition: "Q-greater-than-zero" as const,
    flowPeakFractions:
      MAIN_WIRE_AORTIC_OUTFLOW_V10_EVENT_FLOW_PEAK_FRACTIONS_V1,
    fractionalFlowThresholdAbsoluteFloorApplied: false as const,
    legacyValveEventDefinition:
      "Q-greater-than-max-one-mL-per-second-one-percent-positive-peak" as const,
    currentProxyReferenceDefinition:
      "Q-positive-and-greater-than-or-equal-max-one-mL-per-second-one-percent-maximum-absolute-flow-all-active-samples" as const,
    exactLocalPortPressureDefinition:
      "linearly-interpolated-zero-crossings-of-LV-minus-exact-proximal-port-gradient-around-peak-Q-episode" as const,
    localPressureMvcAndMvoPartitionIsTimingSurrogateNotValveEvent:
      true as const,
    pressureCrossingSmoothingApplied: false as const,
    volumeWindowDefinitions:
      MAIN_WIRE_AORTIC_OUTFLOW_V10_EVENT_VOLUME_WINDOWS_V1,
    volumeIntegration:
      "backward-Euler-endpoint-positive-Q-increment-owned-by-diagnostic-sample-cell" as const,
    volumeWindowsAreValveEvents: false as const,
    volumeWindowIctIvrtOrTeiClaimed: false as const,
    acceptedStateOrCheckpointTopologyChanged: false as const,
    exactModelMutation: false as const,
    parameterSearchOrFitting: false as const,
    clinicalValidationClaimed: false as const,
    canonicalAdoptionEstablished: false as const,
  });
