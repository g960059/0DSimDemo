import type {
  MainWireAorticRootInertanceResearchProfileIdV1,
} from "@/engine/core/MainWireAorticRootInertanceResearchProfileV1";
import type {
  MainWireArterialCompliancePhysiologyProfileIdV1,
} from "@/engine/myocardium/experiments/MainWireArterialCompliancePhysiologyBracketV1";
import type {
  MainWireVentricularLandCalciumSensitivityLengthProfileIdV1,
} from "@/engine/myocardium/mechanics/MainWireVentricularLandCalciumSensitivityLengthBracketV1";
import type {
  MainWireVentricularLandSarcomereReferenceProfileIdV1,
} from "@/engine/myocardium/mechanics/MainWireVentricularLandSarcomereReferenceBracketV1";
import type {
  MainWireVentricularLandSourceTwitchRetentionCandidateIdV1,
  MainWireVentricularLandTrefForceLoadProfileIdV1,
} from "@/engine/myocardium/mechanics/MainWireVentricularLandSourceTwitchRetentionCandidatesV1";
import type {
  MainWireVentricularLandSourceVelocityDistortionProfileIdV1,
} from "@/engine/myocardium/mechanics/MainWireVentricularLandSourceVelocityDistortionBracketV1";
import type {
  MainWireVentricularLandWholeOrganKuwProfileIdV1,
} from "@/engine/myocardium/mechanics/MainWireVentricularLandWholeOrganKuwBracketV1";
import type {
  MainWireAorticCharacteristicResistancePlacementProfileIdV1,
} from "@/engine/valves/MainWireAorticCharacteristicResistancePlacementV1";

export const MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V1_ID =
  "main-wire-aortic-outflow-physiology-candidate-v1" as const;

export type MainWireAorticOutflowCandidateProtocolV1<
  CandidateId extends string = string,
> = Readonly<{
  candidateId: CandidateId;
  calciumProfileId:
    "main-wire-ventricular-calcium-land-coppini-source-trace-v1";
  kuwProfileId: MainWireVentricularLandWholeOrganKuwProfileIdV1;
  sarcomereReferenceProfileId:
    MainWireVentricularLandSarcomereReferenceProfileIdV1;
  calciumSensitivityLengthProfileId:
    MainWireVentricularLandCalciumSensitivityLengthProfileIdV1;
  twitchRetentionCandidateId:
    MainWireVentricularLandSourceTwitchRetentionCandidateIdV1;
  trefForceLoadProfileId: MainWireVentricularLandTrefForceLoadProfileIdV1;
  sourceVelocityDistortionProfileId:
    MainWireVentricularLandSourceVelocityDistortionProfileIdV1;
  complianceProfileId: MainWireArterialCompliancePhysiologyProfileIdV1;
  characteristicResistancePlacementProfileId:
    MainWireAorticCharacteristicResistancePlacementProfileIdV1;
  rootInertanceProfileId: MainWireAorticRootInertanceResearchProfileIdV1;
  aorticMaximumForwardEoaCm2: 3.5;
}>;

export type MainWireAorticOutflowPhysiologyCandidateV1 =
  MainWireAorticOutflowCandidateProtocolV1<
    typeof MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V1_ID
  >;

export const MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V1 =
  Object.freeze({
    candidateId: MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V1_ID,
    calciumProfileId:
      "main-wire-ventricular-calcium-land-coppini-source-trace-v1" as const,
    kuwProfileId: "land-whole-organ-kuw-nu4" as const,
    sarcomereReferenceProfileId:
      "land-sarcomere-reference-plus-5-percent" as const,
    calciumSensitivityLengthProfileId: "land-beta1-canonical" as const,
    twitchRetentionCandidateId:
      "source-twitch-retention-kws-thirteen-twentieths-ntm-four-fifths-peak-compensated" as const,
    trefForceLoadProfileId: "tref-force-load-baseline" as const,
    sourceVelocityDistortionProfileId: "source-Aeff-canonical" as const,
    complianceProfileId: "arterial-stiffness-twofold" as const,
    characteristicResistancePlacementProfileId:
      "all-Ao-SA-resistance-upstream-of-root-compliance" as const,
    rootInertanceProfileId: "aortic-root-inertance-two-fifths" as const,
    aorticMaximumForwardEoaCm2: 3.5 as const,
  }) satisfies MainWireAorticOutflowPhysiologyCandidateV1;

export const MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V1_CLAIM =
  Object.freeze({
    role: "exact-research-candidate-not-canonical-default" as const,
    primaryNumericCoppiniCalciumTraceUsed: true as const,
    landKuwWholeOrganScaleUsesPublishedIsometricIndistinguishableRange:
      true as const,
    landSarcomereReferenceCouplingChanged: true as const,
    effectiveWholeOrganKwsScaleFromIntactSource: 0.65 as const,
    effectiveThinFilamentCooperativityScaleFromIntactSource: 0.8 as const,
    isometricPeakTrefCompensationApplied: true as const,
    kwsAxisInterpretation:
      "zero-distortion-weak-to-strong-transition-timescale-with-rw-rs-held-fixed" as const,
    zeroDistortionEquilibriumPopulationRatiosPreservedByKwsScale:
      true as const,
    weakStateAggregateZeroDistortionExitRatePreservedByDerivedKwu:
      true as const,
    strongStateReturnRateAndDistortionRecoveryScaleWithKws: true as const,
    thinFilamentCooperativityChangesActivationShapeWithoutAddingState:
      true as const,
    trefCompensationChangesStressScaleNotCrossbridgeStateKinetics:
      true as const,
    sourceVelocityDistortionAeffScaleFromIntactSource: 1 as const,
    effectiveSystemicArterialTangentStiffnessScaleFromCanonical: 2 as const,
    systemicArterialTopologyDesignPressurePreservedAtGlobalLawReferenceVolume:
      true as const,
    arterialStiffnessCoordinateExistedInPriorLoadEnvelope: true as const,
    arterialStiffnessSelectionStage:
      "side-effect-reduction-after-fixed-load-envelope" as const,
    kineticScaleSelectionStage:
      "bounded-ET-completion-after-source-isometric-screen-and-structure-factorial" as const,
    numericOptimizerApplied: false as const,
    ejectionTimingUsedToSelectBoundedCandidate: true as const,
    sourceLandIdentityClaimed: false as const,
    arterialCharacteristicImpedanceMatchedToLand2017Source: false as const,
    fullSourceAoSaResistanceReinterpretedAsProximalCharacteristicImpedance:
      true as const,
    sourceAoSaResistanceMmHgSecPerMl: 0.0465088 as const,
    healthyHumanAscendingAorticCharacteristicImpedanceContextMmHgSecPerMl:
      Object.freeze({ mean: 0.065, standardDeviation: 0.019 } as const),
    healthyHumanCharacteristicImpedanceContextDoi:
      "10.1152/ajpheart.01207.2005" as const,
    proximalCharacteristicImpedanceSeparatedFromValveLossInAnalysis:
      true as const,
    rootInertanceUsesNormalAscendingAortaGeometryMagnitudeBracket:
      true as const,
    aorticValveAreaOrOpeningLawChanged: false as const,
    calciumOrMechanicsStateAdded: false as const,
    acceptedStateOrCheckpointTopologyChanged: false as const,
    parameterSearchOrPatientFit: false as const,
    clinicalValidationClaimed: false as const,
    canonicalAdoptionEstablished: false as const,
  });
