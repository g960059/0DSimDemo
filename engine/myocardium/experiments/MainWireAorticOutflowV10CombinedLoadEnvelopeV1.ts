import {
  MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_COMBINED_LOAD_AXES_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_COMBINED_LOAD_CONTEXTS_V1,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowPhysiologyCandidateCombinedLoadEnvelopeV1";
import {
  MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V10,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowPhysiologyCandidateV10";

export const MAIN_WIRE_AORTIC_OUTFLOW_V10_COMBINED_LOAD_ENVELOPE_V1_ID =
  "main-wire-aortic-outflow-v10-combined-load-envelope-v1" as const;

export const MAIN_WIRE_AORTIC_OUTFLOW_V10_COMBINED_LOAD_ENVELOPE_CLAIM_V1 =
  Object.freeze({
    role:
      "fixed-V10-four-axis-full-factorial-combined-load-corner-envelope" as const,
    fixedCandidate: MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V10,
    axes:
      MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_COMBINED_LOAD_AXES_V1,
    contextCount:
      MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_COMBINED_LOAD_CONTEXTS_V1
        .length,
    systemicResistanceScaleFromBaseline:
      Object.freeze({ low: 0.75, high: 4 / 3 }),
    systemicArterialTangentStiffnessScaleFromCandidate:
      Object.freeze({ low: 0.75, high: 4 / 3 }),
    stressedVenousVolumeScaleFromBaseline:
      Object.freeze({ low: 0.75, high: 4 / 3 }),
    ventricularTrefForceScaleFromCandidate:
      Object.freeze({ low: 0.9, high: 1.1 }),
    fullFactorialCornerCount: 16 as const,
    simultaneousAxisChangesPerArm: 4 as const,
    containsBaselineArm: false as const,
    pulmonaryResistanceHeldAtBaseline: true as const,
    independentCanonicalColdStartPerRun: true as const,
    pressureRecoveryAndLocalPortOwnershipHeldAtV10: true as const,
    aorticValveMaximumEoaHeldAtCm2: 3.5 as const,
    newContinuousStateAdded: false as const,
    acceptedStateOrCheckpointTopologyChanged: false as const,
    parameterSearchOrFitting: false as const,
    clinicalValidationClaimed: false as const,
    canonicalAdoptionEstablished: false as const,
  });
