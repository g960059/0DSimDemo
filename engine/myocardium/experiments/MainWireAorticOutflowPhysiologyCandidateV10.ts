import {
  MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V9,
  MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V9_CLAIM,
  type MainWireAorticOutflowPhysiologyCandidateV9,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowPhysiologyCandidateV9";
import type {
  MainWireAorticRecoveredRootPortValveProfileIdV1,
} from "@/engine/valves/MainWireAorticRecoveredRootPortValveV1";
import type {
  MainWireAorticValveResearchProfileIdV1,
} from "@/engine/valves/MainWireAorticValvePressureRecoveryAblationV1";

export const MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V10_ID =
  "main-wire-aortic-outflow-physiology-candidate-v10" as const;

export type MainWireAorticOutflowPhysiologyCandidateV10 = Readonly<
  Omit<MainWireAorticOutflowPhysiologyCandidateV9, "candidateId">
  & {
    candidateId:
      typeof MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V10_ID;
    pressureRecoveryProfileId: MainWireAorticValveResearchProfileIdV1;
    recoveredRootPortValveProfileId:
      MainWireAorticRecoveredRootPortValveProfileIdV1;
  }
>;

/**
 * V10 changes only the algebraic AoV/root constitutive ownership on top of V9.
 * It adds no state and performs no systemic, volume, calcium, or mechanics
 * recalibration.
 */
export const MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V10 =
  Object.freeze({
    ...MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V9,
    candidateId: MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V10_ID,
    pressureRecoveryProfileId: "pressure-recovery-aa-d3p0cm" as const,
    recoveredRootPortValveProfileId:
      "Land2017-Zc-Garcia-AA-d3p0cm-local-opening" as const,
  }) satisfies MainWireAorticOutflowPhysiologyCandidateV10;

export const MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V10_CLAIM =
  Object.freeze({
    ...MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V9_CLAIM,
    role: "exact-research-candidate-not-canonical-default" as const,
    predecessorCandidateId:
      MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V9.candidateId,
    changedAxisFromV9:
      "aortic-valve-root-algebraic-constitutive-port-ownership" as const,
    forwardConvectivePortLawChangedFromV9:
      "full-vena-contracta-to-Garcia-ELCo-plus-fixed-AA-kinetic" as const,
    openingDrivePressureStationChangedFromV9:
      "raw-LV-minus-Ao-node-to-LV-minus-proximal-constitutive-port" as const,
    sourceValveLinearResistanceSeparatedFromCharacteristicImpedanceInExactLaw:
      true as const,
    characteristicWaveLoadSeparatedFromValveDissipationInExactLaw:
      true as const,
    downstreamKineticTransportSeparatedFromValveDissipationInExactLaw:
      true as const,
    proximalPortPressureOwnedByExactConstitutiveEvaluation: true as const,
    aorticValveAreaOrOpeningLawChanged: true as const,
    aorticMaximumForwardEoaChanged: false as const,
    aorticRootInertanceChangedFromV9: false as const,
    ventricularCalciumOrMechanicsChangedFromV9: false as const,
    bloodVolumeOrSystemicResistanceChangedFromV9: false as const,
    systemicRecalibrationAppliedAfterPortLawChange: false as const,
    newContinuousStateAdded: false as const,
    acceptedStateOrCheckpointTopologyChanged: false as const,
    parameterSearchOrFittingForV10PortLaw: false as const,
    fixedAscendingAorticGeometryIsSubjectMeasured: false as const,
    proximalPortIsClaimedCatheterEquivalent: false as const,
    clinicalValidationClaimed: false as const,
    canonicalAdoptionEstablished: false as const,
  });
