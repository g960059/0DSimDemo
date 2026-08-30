import {
  buildNonCoronaryCirculationGraphV1,
  createInitialNonCoronaryCirculationStateV1,
  NON_CORONARY_CIRCULATION_SCOPE_V1,
  NON_CORONARY_NODE_NAMES_V1,
  type NonCoronaryCirculationInitialStateInputV1,
  type NonCoronaryCirculationRuntimeParamsV1,
  type NonCoronaryCirculationTrialDiagnosticsV1,
} from "@/engine/core/nonCoronaryCirculationBackwardEulerV1";
import {
  resolveMainWireAorticRootInertanceResearchProfileV1,
  type MainWireAorticRootInertanceResearchProfileIdV1,
  type MainWireAorticRootInertanceResearchProfileV1,
} from "@/engine/core/MainWireAorticRootInertanceResearchProfileV1";
import {
  resolveMainWireAorticRootResistanceResearchProfileV1,
  type MainWireAorticRootResistanceResearchProfileIdV1,
  type MainWireAorticRootResistanceResearchProfileV1,
} from "@/engine/core/MainWireAorticRootResistanceResearchProfileV1";
import {
  resolveMainWireAorticRootFlowStateRelocationProfileV1,
  type MainWireAorticRootFlowStateRelocationProfileIdV1,
  type MainWireAorticRootFlowStateRelocationProfileV1,
} from "@/engine/core/MainWireAorticRootFlowStateRelocationResearchProfileV1";
import {
  resolveMainWireAorticCharacteristicResistancePlacementProfileV1,
  type MainWireAorticCharacteristicResistancePlacementProfileIdV1,
  type MainWireAorticCharacteristicResistancePlacementProfileV1,
} from "@/engine/valves/MainWireAorticCharacteristicResistancePlacementV1";
import {
  resolveMainWireAorticCompliancePartitionCapacitySnapshotV1,
  resolveMainWireAorticCompliancePartitionResearchProfileV1,
  type MainWireAorticCompliancePartitionCapacitySnapshotV1,
  type MainWireAorticCompliancePartitionResearchProfileIdV1,
  type MainWireAorticCompliancePartitionResearchProfileV1,
} from "@/engine/core/MainWireAorticCompliancePartitionResearchProfileV1";
import type { EdgeSpec, NodeSpec } from "@/engine/core/topology";
import {
  checkpointMainWireFiveWallNonCoronaryV1,
  initializeMainWireFiveWallNonCoronaryV1,
  restoreMainWireFiveWallNonCoronaryV1,
  stepMainWireFiveWallNonCoronaryV1,
  type MainWireFiveWallNonCoronaryAcceptedStateV1,
  type MainWireFiveWallNonCoronaryCheckpointV1,
  type MainWireFiveWallNonCoronaryStepFailureV1,
} from "@/engine/myocardium/MainWireFiveWallNonCoronaryTransactionV1";
import {
  FIVE_WALL_NORMAL_CALCIUM_DRIVE_V1_ID,
  FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
  type FiveWallNormalCalciumDriveParamsV1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import {
  resolveMainWireVentricularCalciumWaveformParamsV1,
  resolveMainWireVentricularCalciumWaveformProfileV1,
  type MainWireVentricularCalciumWaveformProfileIdV1,
  type MainWireVentricularCalciumWaveformProfileV1,
} from "@/engine/myocardium/calcium/MainWireVentricularCalciumWaveformAblationV1";
import {
  resolveMainWireVentricularCalciumSourceConstrainedParamsV1,
  resolveMainWireVentricularCalciumSourceConstrainedProfileV1,
  type MainWireVentricularCalciumSourceConstrainedProfileIdV1,
  type MainWireVentricularCalciumSourceConstrainedProfileV1,
} from "@/engine/myocardium/calcium/MainWireVentricularCalciumSourceConstrainedPriorV1";
import {
  MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_PROFILE_V1,
  resolveMainWireVentricularCalciumSourceTraceFitParamsV1,
  type MainWireVentricularCalciumSourceTraceFitProfileV1,
} from "@/engine/myocardium/calcium/MainWireVentricularCalciumSourceTraceFitPriorV1";
import {
  MAIN_WIRE_VENTRICULAR_CALCIUM_DELAYED_MIXTURE_PROFILE_V1_ID,
  resolveMainWireVentricularCalciumDelayedMixtureParamsV1,
  resolveMainWireVentricularCalciumDelayedMixtureProfileV1,
  type MainWireVentricularCalciumDelayedMixtureProfileIdV1,
  type MainWireVentricularCalciumDelayedMixtureProfileV1,
} from "@/engine/myocardium/calcium/MainWireVentricularCalciumDelayedMixtureAblationV1";
import {
  resolveMainWireVentricularCalciumActivationDistributionParamsV1,
  resolveMainWireVentricularCalciumActivationDistributionProfileV1,
  type MainWireVentricularCalciumActivationDistributionProfileIdV1,
  type MainWireVentricularCalciumActivationDistributionProfileV1,
} from "@/engine/myocardium/calcium/MainWireVentricularCalciumActivationDistributionV1";
import {
  resolveMainWireVentricularCalciumPeakLockedTailParamsV1,
  resolveMainWireVentricularCalciumPeakLockedTailProfileV1,
  type MainWireVentricularCalciumPeakLockedTailProfileIdV1,
  type MainWireVentricularCalciumPeakLockedTailProfileV1,
} from "@/engine/myocardium/calcium/MainWireVentricularCalciumPeakLockedTailAblationV1";
import {
  MAIN_WIRE_VENTRICULAR_CALCIUM_LAND_COPPINI_SOURCE_TRACE_PROFILE_V1,
} from "@/engine/myocardium/calcium/MainWireVentricularCalciumLandCoppiniSourceTraceV1";
import {
  resolveMainWireVentricularCalciumHeartRateHypothesisParamsV1,
  resolveMainWireVentricularCalciumHeartRateHypothesisProfileV1,
  type MainWireVentricularCalciumHeartRateHypothesisProfileIdV1,
  type MainWireVentricularCalciumHeartRateHypothesisProfileV1,
} from "@/engine/myocardium/calcium/MainWireVentricularCalciumHeartRateHypothesesV1";
import {
  resolveMainWireVentricularCalciumMatchedAlphaTimingPolicyBridgeParamsV1,
  resolveMainWireVentricularCalciumMatchedAlphaTimingPolicyBridgeProfileV1,
  type MainWireVentricularCalciumMatchedAlphaTimingPolicyBridgeProfileIdV1,
  type MainWireVentricularCalciumMatchedAlphaTimingPolicyBridgeProfileV1,
} from "@/engine/myocardium/calcium/MainWireVentricularCalciumMatchedAlphaTimingPolicyBridgeV1";
import {
  resolveMainWireAtrioventricularDelayCalciumParamsV1,
  resolveMainWireAtrioventricularDelayProfileV1,
  type MainWireAtrioventricularDelayProfileIdV1,
  type MainWireAtrioventricularDelayProfileV1,
} from "@/engine/myocardium/calcium/MainWireAtrioventricularDelayBracketV1";
import {
  resolveMainWireVentricularCalciumLandCoppiniAmplitudeParamsV1,
} from "@/engine/myocardium/calcium/MainWireVentricularCalciumLandCoppiniAmplitudeBracketV1";
import {
  resolveMainWireVentricularCalciumFixedAmplitudeDecayParamsV1,
  resolveMainWireVentricularCalciumFixedAmplitudeDecayProfileV1,
  type MainWireVentricularCalciumFixedAmplitudeDecayProfileIdV1,
  type MainWireVentricularCalciumFixedAmplitudeDecayProfileV1,
} from "@/engine/myocardium/calcium/MainWireVentricularCalciumFixedAmplitudeDecayAblationV1";
import {
  classifyMainWireFiveWallPeriodicityV1,
  compareMainWireFiveWallAcceptedStatesV1,
  MAIN_WIRE_FIVE_WALL_PERIODIC_REFERENCE_SCALES_V1,
  type MainWireFiveWallPeriodicBeatObservationV1,
  type MainWireFiveWallPeriodicClassificationV1,
} from "@/engine/myocardium/experiments/MainWireFiveWallPeriodicClosureV1";
import {
  normalAdultMainWireRuntimeV1,
  type MainWireNormalAdultFiveWallMechanicsStateV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallClosedLoopV1";
import { MAIN_WIRE_AORTIC_OUTFLOW_V10_HEART_RATE_CALCIUM_REFERENCE_NON_CALCIUM_ASSEMBLY_V1 } from "@/engine/myocardium/experiments/MainWireAorticOutflowV10HeartRateCalciumHypothesesV1";
import {
  MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_REFERENCE_NON_CALCIUM_ASSEMBLY_V1,
  resolveMainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeArmV1,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeV1";
import {
  resolveMainWireArterialCompliancePhysiologyProfileV1,
  resolveMainWireArterialCompliancePhysiologyRuntimeV1,
  type MainWireArterialCompliancePhysiologyProfileIdV1,
  type MainWireArterialCompliancePhysiologyProfileV1,
} from "@/engine/myocardium/experiments/MainWireArterialCompliancePhysiologyBracketV1";
import {
  resolveMainWireNormalAdultFiveWallCirculatoryLoadPointV1,
  resolveMainWireNormalAdultFiveWallCirculatoryLoadRuntimeV1,
  type MainWireNormalAdultFiveWallCirculatoryLoadPointIdV1,
  type MainWireNormalAdultFiveWallCirculatoryLoadPointV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallCirculatoryLoadPointsV1";
import {
  resolveMainWireNormalAdultBloodVolumeOperatingPointV1,
  resolveMainWireNormalAdultBloodVolumeResearchPointV1,
  type MainWireNormalAdultBloodVolumeOperatingPointAuditV1,
  type MainWireNormalAdultBloodVolumeOperatingPointIdentityV1,
  type MainWireNormalAdultBloodVolumeOperatingPointResolvedV1,
  type MainWireNormalAdultStressedVenousVolumeResearchPointIdV1,
  type MainWireNormalAdultStressedVenousVolumeResearchPointV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultBloodVolumeOperatingPointV1";
import {
  resolveMainWireNormalAdultFiveWallMacroPhysiologyPointV1,
  type MainWireNormalAdultFiveWallMacroPhysiologyPointIdV1,
  type MainWireNormalAdultFiveWallMacroPhysiologyPointV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallMacroPhysiologyPointsV1";
import {
  resolveMainWireVentricularCalciumSourceTraceFitRecalibrationPointV1,
  type MainWireVentricularCalciumSourceTraceFitRecalibrationPointIdV1,
  type MainWireVentricularCalciumSourceTraceFitRecalibrationPointV1,
} from "@/engine/myocardium/experiments/MainWireVentricularCalciumSourceTraceFitRecalibrationPointsV1";
import {
  resolveMainWireVentricularCalciumSourceTraceFitRecalibrationCandidateV1,
  type MainWireVentricularCalciumSourceTraceFitRecalibrationCandidateIdV1,
  type MainWireVentricularCalciumSourceTraceFitRecalibrationCandidateV1,
} from "@/engine/myocardium/experiments/MainWireVentricularCalciumSourceTraceFitRecalibrationCandidatesV1";
import {
  resolveMainWireVentricularCalciumSourceTraceFitTrefPassiveMechanicsInputV1,
  resolveMainWireVentricularCalciumSourceTraceFitTrefPassiveProfileV1,
  type MainWireVentricularCalciumSourceTraceFitTrefPassiveProfileIdV1,
  type MainWireVentricularCalciumSourceTraceFitTrefPassiveProfileV1,
} from "@/engine/myocardium/experiments/MainWireVentricularCalciumSourceTraceFitTrefPassiveGridV1";
import {
  resolveMainWireVentricularCalciumSourceTraceFitTrefPassiveDistortionCandidateV1,
  type MainWireVentricularCalciumSourceTraceFitTrefPassiveDistortionCandidateIdV1,
  type MainWireVentricularCalciumSourceTraceFitTrefPassiveDistortionCandidateV1,
} from "@/engine/myocardium/experiments/MainWireVentricularCalciumSourceTraceFitTrefPassiveDistortionCandidatesV1";
import {
  resolveMainWireVentricularLandTwitchTimingCandidateV1,
  type MainWireVentricularLandTwitchTimingCandidateIdV1,
  type MainWireVentricularLandTwitchTimingCandidateV1,
} from "@/engine/myocardium/mechanics/MainWireVentricularLandTwitchTimingCandidatesV1";
import {
  resolveMainWireVentricularLandWholeOrganKuwProfileV1,
  type MainWireVentricularLandWholeOrganKuwProfileIdV1,
  type MainWireVentricularLandWholeOrganKuwProfileV1,
} from "@/engine/myocardium/mechanics/MainWireVentricularLandWholeOrganKuwBracketV1";
import {
  resolveMainWireVentricularLandSarcomereReferenceProfileV1,
  type MainWireVentricularLandSarcomereReferenceProfileIdV1,
  type MainWireVentricularLandSarcomereReferenceProfileV1,
} from "@/engine/myocardium/mechanics/MainWireVentricularLandSarcomereReferenceBracketV1";
import {
  resolveMainWireVentricularLandCalciumSensitivityLengthProfileV1,
  type MainWireVentricularLandCalciumSensitivityLengthProfileIdV1,
  type MainWireVentricularLandCalciumSensitivityLengthProfileV1,
} from "@/engine/myocardium/mechanics/MainWireVentricularLandCalciumSensitivityLengthBracketV1";
import {
  resolveMainWireVentricularLandSourceTwitchRetentionCandidateV1,
  resolveMainWireVentricularLandTrefForceLoadProfileV1,
  type MainWireVentricularLandSourceTwitchRetentionCandidateIdV1,
  type MainWireVentricularLandSourceTwitchRetentionCandidateV1,
  type MainWireVentricularLandTrefForceLoadProfileIdV1,
  type MainWireVentricularLandTrefForceLoadProfileV1,
} from "@/engine/myocardium/mechanics/MainWireVentricularLandSourceTwitchRetentionCandidatesV1";
import {
  resolveMainWireVentricularLandSourceVelocityDistortionProfileV1,
  type MainWireVentricularLandSourceVelocityDistortionProfileIdV1,
  type MainWireVentricularLandSourceVelocityDistortionProfileV1,
} from "@/engine/myocardium/mechanics/MainWireVentricularLandSourceVelocityDistortionBracketV1";
import {
  resolveMainWireVentricularLandStrongBridgeDeactivationExitProfileV1,
  type MainWireVentricularLandStrongBridgeDeactivationExitProfileIdV1,
  type MainWireVentricularLandStrongBridgeDeactivationExitProfileV1,
} from "@/engine/myocardium/mechanics/MainWireVentricularLandStrongBridgeDeactivationExitBracketV1";
import {
  resolveMainWireVentricularCalciumSourceTraceFitShortlistArmV1,
  resolveMainWireVentricularCalciumSourceTraceFitShortlistLoadContextV1,
  type MainWireVentricularCalciumSourceTraceFitShortlistArmIdV1,
  type MainWireVentricularCalciumSourceTraceFitShortlistArmV1,
  type MainWireVentricularCalciumSourceTraceFitShortlistLoadContextIdV1,
  type MainWireVentricularCalciumSourceTraceFitShortlistLoadContextV1,
} from "@/engine/myocardium/experiments/MainWireVentricularCalciumSourceTraceFitShortlistLoadEnvelopeV1";
import {
  resolveMainWireAorticOutflowDistortionTransientArmV1,
  type MainWireAorticOutflowDistortionTransientArmIdV1,
  type MainWireAorticOutflowDistortionTransientArmV1,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowDistortionTransientAblationV1";
import {
  resolveMainWireAorticOutflowVelocityDistortionAmplitudeArmV1,
  type MainWireAorticOutflowVelocityDistortionAmplitudeArmIdV1,
  type MainWireAorticOutflowVelocityDistortionAmplitudeArmV1,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowVelocityDistortionAmplitudeAblationV1";
import {
  resolveMainWireAorticOutflowVelocityDistortionPreloadArmV1,
  type MainWireAorticOutflowVelocityDistortionPreloadArmIdV1,
  type MainWireAorticOutflowVelocityDistortionPreloadArmV1,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowVelocityDistortionPreloadFactorialV1";
import {
  resolveMainWireAorticOutflowVelocityDistortionTrefArmV1,
  type MainWireAorticOutflowVelocityDistortionTrefArmIdV1,
  type MainWireAorticOutflowVelocityDistortionTrefArmV1,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowVelocityDistortionTrefFactorialV1";
import {
  resolveMainWireAorticOutflowEjectionTimingArmV1,
  type MainWireAorticOutflowEjectionTimingArmIdV1,
  type MainWireAorticOutflowEjectionTimingArmV1,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowEjectionTimingAblationV1";
import {
  resolveMainWireAorticOutflowLengthMechanismArmV1,
  type MainWireAorticOutflowLengthMechanismArmIdV1,
  type MainWireAorticOutflowLengthMechanismArmV1,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowLengthMechanismAblationV1";
import {
  resolveMainWireAorticOutflowMechanismCandidateV1,
  resolveMainWireAorticOutflowMechanismLoadContextV1,
  type MainWireAorticOutflowMechanismCandidateIdV1,
  type MainWireAorticOutflowMechanismCandidateV1,
  type MainWireAorticOutflowMechanismLoadContextIdV1,
  type MainWireAorticOutflowMechanismLoadContextV1,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowMechanismCandidateLoadEnvelopeV1";
import {
  resolveMainWireAorticOutflowEjectionTimingCandidateV1,
  resolveMainWireAorticOutflowEjectionTimingLoadContextV1,
  type MainWireAorticOutflowEjectionTimingCandidateIdV1,
  type MainWireAorticOutflowEjectionTimingCandidateV1,
  type MainWireAorticOutflowEjectionTimingLoadContextIdV1,
  type MainWireAorticOutflowEjectionTimingLoadContextV1,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowEjectionTimingCandidateLoadEnvelopeV1";
import {
  resolveMainWireAorticOutflowEjectionTimingRefinementContextV1,
  type MainWireAorticOutflowEjectionTimingRefinementCandidateIdV1,
  type MainWireAorticOutflowEjectionTimingRefinementContextIdV1,
  type MainWireAorticOutflowEjectionTimingRefinementContextV1,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowEjectionTimingRefinementV1";
import {
  resolveMainWireAorticOutflowEjectionTimingLocalInertanceInteractionArmV1,
  type MainWireAorticOutflowEjectionTimingLocalInertanceInteractionArmIdV1,
  type MainWireAorticOutflowEjectionTimingLocalInertanceInteractionArmV1,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowEjectionTimingLocalInertanceInteractionV1";
import {
  resolveMainWireAorticOutflowEjectionTimingCharacteristicResistancePlacementArmV1,
  type MainWireAorticOutflowEjectionTimingCharacteristicResistancePlacementArmIdV1,
  type MainWireAorticOutflowEjectionTimingCharacteristicResistancePlacementArmV1,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowEjectionTimingCharacteristicResistancePlacementV1";
import {
  resolveMainWireAorticOutflowDriverRootAblationArmV1,
  type MainWireAorticOutflowDriverRootAblationArmIdV1,
  type MainWireAorticOutflowDriverRootAblationArmV1,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowDriverRootAblationV1";
import {
  resolveMainWireAorticValveLocalInertancePressureRecoveryArmV1,
  type MainWireAorticValveLocalInertancePressureRecoveryArmIdV1,
  type MainWireAorticValveLocalInertancePressureRecoveryArmV1,
} from "@/engine/myocardium/experiments/MainWireAorticValveLocalInertancePressureRecoveryFactorialV1";
import {
  resolveMainWireAorticOutflowLengthDependenceRootResistanceArmV1,
  type MainWireAorticOutflowLengthDependenceRootResistanceArmIdV1,
  type MainWireAorticOutflowLengthDependenceRootResistanceArmV1,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowLengthDependenceRootResistanceAblationV1";
import {
  resolveMainWireAorticOutflowLengthVelocityArmV1,
  type MainWireAorticOutflowLengthVelocityArmIdV1,
  type MainWireAorticOutflowLengthVelocityArmV1,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowLengthVelocityAblationV1";
import {
  resolveMainWireAorticOutflowVelocityStiffnessArmV1,
  type MainWireAorticOutflowVelocityStiffnessArmIdV1,
  type MainWireAorticOutflowVelocityStiffnessArmV1,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowVelocityStiffnessAblationV1";
import {
  sanitizeForStableHash,
  stableHash,
} from "@/engine/integrity/stableHash";
import {
  sampleMainWireNormalAdultFiveWallDiagnosticStepV2,
  type MainWireNormalAdultFiveWallDiagnosticSampleV2,
} from "@/engine/myocardium/diagnostics/MainWireNormalAdultFiveWallDiagnosticSampleV2";
import {
  createCanonicalMainWireNormalAdultFiveWallProviderV1,
  createFixedResearchMainWireNormalAdultFiveWallProviderV1,
  createMainWireNormalAdultFiveWallProviderWithVentricularLandEtRefinementCandidateV1,
  createMainWireNormalAdultFiveWallProviderWithVentricularLandActivationCohortsV1,
  createMainWireNormalAdultFiveWallProviderWithVentricularLandCoppiniAmplitudeTrefPairV1,
  createMainWireNormalAdultFiveWallProviderWithVentricularLandCalciumSensitivityLengthProfileV1,
  createMainWireNormalAdultFiveWallProviderWithVentricularLandSourceTwitchRetentionCandidateV1,
  createMainWireNormalAdultFiveWallProviderWithVentricularLandSourceTwitchRetentionTrefForceLoadV1,
  createMainWireNormalAdultFiveWallProviderWithVentricularLandSourceVelocityDistortionV1,
  createMainWireNormalAdultFiveWallProviderWithVentricularLandStrongBridgeDeactivationExitV1,
  createMainWireNormalAdultFiveWallProviderWithVentricularLandSarcomereReferenceProfileV1,
  createMainWireNormalAdultFiveWallProviderWithVentricularLandWholeOrganKuwProfileV1,
  createMainWireNormalAdultFiveWallProviderWithVentricularLandTwitchTimingCandidateV1,
  createMainWireNormalAdultFiveWallProviderWithVentricularGammaWResearchProfileV1,
  createMainWireNormalAdultFiveWallProviderWithMechanicsResearchInputsAndFixedVentricularDistortionTransientV1,
  createMainWireNormalAdultFiveWallProviderWithMechanicsResearchInputsV1,
  resolveMainWireNormalAdultVentricularMaterialResearchPointV1,
  resolveMainWireNormalAdultVentricularGammaWResearchProfileV1,
  resolveMainWireNormalAdultVentricularGammaWWallMaterialV1,
  type MainWireNormalAdultLaSlsModeV1,
  type MainWireNormalAdultFiveWallProviderV1,
  type MainWireNormalAdultVentricularGammaWResearchProfileV1,
  type MainWireNormalAdultVentricularMaterialResearchPointIdV1,
  type MainWireNormalAdultVentricularMaterialResearchPointV1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";
import {
  resolveMainWireVentricularLandCoppiniAmplitudeTrefPairV1,
  type MainWireVentricularLandCoppiniAmplitudeTrefPairIdV1,
  type MainWireVentricularLandCoppiniAmplitudeTrefPairV1,
} from "@/engine/myocardium/mechanics/MainWireVentricularLandCoppiniAmplitudeTrefPairV1";
import {
  resolveMainWireVentricularLandActivationCohortProfileV1,
  type MainWireVentricularLandActivationCohortProfileIdV1,
  type MainWireVentricularLandActivationCohortProfileV1,
} from "@/engine/myocardium/mechanics/MainWireVentricularLandActivationCohortHomogenizationV1";
import {
  resolveMainWireVentricularLandEtRefinementCandidateV1,
  type MainWireVentricularLandEtRefinementCandidateV1,
} from "@/engine/myocardium/mechanics/MainWireVentricularLandEtRefinementCandidatesV1";
import type { MainWireFiveWallMechanicsResearchInputsV1 } from "@/engine/myocardium/mechanics/MainWireFiveWallMechanicsResearchInputsV1";
import {
  createMainWireNormalAdultCommonPericardiumV1,
  type MainWireNormalAdultCommonPericardiumCaseV1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultCommonPericardiumV1";
import type {
  MainWireCommonPericardiumBindingV1,
  MainWireCommonPericardiumModeV1,
} from "@/engine/myocardium/mechanics/mainWireCommonPericardiumBindingV1";
import {
  MAIN_WIRE_FOUR_VALVE_DEFAULT_AREA_INPUTS_V1,
  createMainWireFourValveContinuousAreaResearchInputV1,
  type MainWireFourValveAreaInputsV1,
  MainWireFourValveDiseaseBracketIdV1,
  type MainWireFourValveDiseaseResearchInputV1,
} from "@/engine/valves/MainWireFourValveDiseaseResearchBracketsV1";
import {
  resolveMainWireAorticValveAreaControlPointV1,
  type MainWireAorticValveAreaControlPointIdV1,
  type MainWireAorticValveAreaControlPointV1,
} from "@/engine/valves/MainWireAorticValveAreaControlV1";
import {
  resolveMainWireAorticValveResearchProfileV1,
  type MainWireAorticValveResearchProfileIdV1,
  type MainWireAorticValveResearchProfileV1,
} from "@/engine/valves/MainWireAorticValvePressureRecoveryAblationV1";
import {
  resolveMainWireAorticRecoveredRootPortValveProfileV1,
  type MainWireAorticRecoveredRootPortValveProfileIdV1,
  type MainWireAorticRecoveredRootPortValveProfileV1,
} from "@/engine/valves/MainWireAorticRecoveredRootPortValveV1";
import {
  MAIN_WIRE_AORTIC_VALVE_LOCAL_INERTANCE_PROFILE_V1,
  resolveMainWireAorticValveLocalInertanceProfileV1,
  type MainWireAorticValveLocalInertanceProfileV1,
} from "@/engine/valves/MainWireAorticValveLocalInertanceAblationV1";

export const MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_STEADY_V1_ID =
  "main-wire-normal-adult-five-wall-periodic-steady-v1" as const;

export const MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_PROTOCOL_IDENTITY_V1_ID =
  "main-wire-normal-adult-five-wall-periodic-protocol-identity-v1" as const;

export const MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CYCLE_WARM_START_V1_ID =
  "main-wire-normal-adult-five-wall-cycle-boundary-warm-start-v1" as const;

export const MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_POLICY_V1 =
  Object.freeze({
    policyId: "fixed-groupwise-periodic-policy-v1" as const,
    period1NormalizedTolerance: 1e-3,
    period2NormalizedTolerance: 1e-3,
    period2MinimumPeriod1NormalizedDelta: 5e-3,
    consecutiveBeats: 3,
    defaultMaximumBeatCount: 32,
    retainedCompleteBeatCount: 3,
    referenceScaleSetId:
      MAIN_WIRE_FIVE_WALL_PERIODIC_REFERENCE_SCALES_V1.scaleSetId,
  });

export const MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PULMONARY_REDISTRIBUTION_V1 =
  Object.freeze({
    variant: "pven-to-pvein-10ml" as const,
    sourceNode: "PVen" as const,
    destinationNode: "PVein" as const,
    transferredVolumeMl: 10,
    totalBloodVolumeChangeMl: 0 as const,
  });

export type MainWireNormalAdultFiveWallPeriodicInitializationV1 =
  | "canonical"
  | typeof MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PULMONARY_REDISTRIBUTION_V1.variant
  | "cycle-boundary-warm-start";

export type MainWireNormalAdultFiveWallPeriodicProtocolComponentHashesV1 =
  Readonly<{
    mechanicsProviderMetadataStableHash: string;
    calciumDriveFixedParamsStableHash: string;
    circulationTopologyGraphStableHash: string;
    circulationRuntimeStableHash: string;
    bloodVolumeOperatingPointStableHash: string;
    commonPericardiumStableHash: string;
    periodicPolicyStableHash: string;
  }>;

export type MainWireNormalAdultFiveWallCycleWarmStartV1 = Readonly<{
  warmStartId:
    typeof MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CYCLE_WARM_START_V1_ID;
  schemaVersion: 3;
  sourceProtocolIdentity: MainWireNormalAdultFiveWallPeriodicProtocolIdentityV1;
  sourceProtocolIdentityHash: string;
  sourceComponentHashes:
    MainWireNormalAdultFiveWallPeriodicProtocolComponentHashesV1;
  sourcePericardiumMode: MainWireCommonPericardiumModeV1;
  sourcePericardiumParameterSetId: string;
  sourceDtSec: number;
  sourceCompletedBeatCount: number;
  checkpoint: MainWireFiveWallNonCoronaryCheckpointV1;
  claim: Readonly<{
    cycleBoundaryPhase01: 0;
    timeRebasedToZeroOnRestore: true;
    parameterSearch: false;
    pericardiumStateStored: false;
  }>;
  envelopeFingerprint: string;
}>;

export type MainWireNormalAdultFiveWallPeriodicProtocolIdentityV1 = Readonly<{
  identityId:
    typeof MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_PROTOCOL_IDENTITY_V1_ID;
  mechanicsProvider: Readonly<{
    providerId: string;
    parameterSetId: string;
    /** Includes the provider's material, geometry, and internal solver options. */
    parameterIdentityHash: string;
    stateSchemaVersion: number;
  }>;
  calciumDrive: Readonly<{
    driveId: typeof FIVE_WALL_NORMAL_CALCIUM_DRIVE_V1_ID;
    parameterSetId: string;
    fixedParamsStableHash: string;
  }>;
  circulation: Readonly<{
    topologyGraphSnapshot: Readonly<{
      topologyId: string;
      nodes: readonly Readonly<NodeSpec>[];
      edges: readonly Readonly<EdgeSpec>[];
      scope: typeof NON_CORONARY_CIRCULATION_SCOPE_V1;
    }>;
    topologyGraphStableHash: string;
    runtimeStableHash: string;
    valveResearchInputStableHash: string;
    valveResearchInputSnapshot: MainWireFourValveDiseaseResearchInputV1;
  }>;
  bloodVolumeOperatingPoint:
    MainWireNormalAdultBloodVolumeOperatingPointIdentityV1;
  commonPericardium: Readonly<{
    bindingId: string;
    parameterSetId: string;
    mode: MainWireCommonPericardiumModeV1;
    stableHash: string;
    bindingSnapshot: MainWireCommonPericardiumBindingV1;
  }>;
  periodicPolicy: Readonly<{
    policyId:
      typeof MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_POLICY_V1.policyId;
    policyStableHash: string;
  }>;
}>;

export type MainWireNormalAdultFiveWallPeriodicOptionsV1 = Readonly<{
  dtSec: number;
  maximumBeatCount?: number;
  laSlsMode?: MainWireNormalAdultLaSlsModeV1;
  pericardiumMode?: MainWireCommonPericardiumModeV1;
  pericardiumCase?: MainWireNormalAdultCommonPericardiumCaseV1;
  valveDiseaseBracketIds?: readonly MainWireFourValveDiseaseBracketIdV1[];
  initialization?: MainWireNormalAdultFiveWallPeriodicInitializationV1;
  warmStart?: MainWireNormalAdultFiveWallCycleWarmStartV1;
}>;

export type MainWireNormalAdultFiveWallCirculatoryLoadResearchOptionsV1 =
  Readonly<{
    dtSec: number;
    maximumBeatCount?: number;
  }>;

export type MainWireNormalAdultFiveWallMacroPhysiologyResearchOptionsV1 =
  Readonly<{
    dtSec: number;
    maximumBeatCount?: number;
  }>;

export type MainWireNormalAdultFiveWallAorticValveResearchOptionsV1 =
  Readonly<{
    dtSec: number;
    maximumBeatCount?: number;
  }>;

export type MainWireNormalAdultFiveWallAorticOutflowResearchOptionsV1 =
  Readonly<{
    dtSec: number;
    maximumBeatCount?: number;
  }>;

export type MainWireNormalAdultVentricularLengthDependenceResearchPointIdV1 =
  Extract<
    MainWireNormalAdultVentricularMaterialResearchPointIdV1,
    | "baseline"
    | "ventricular-length-dependence-low"
    | "ventricular-length-dependence-half"
    | "ventricular-length-dependence-quarter"
    | "ventricular-length-dependence-exact-off"
  >;

export type MainWireNormalAdultFiveWallVentricularCalciumWaveformResearchOptionsV1 =
  Readonly<{
    dtSec: number;
    maximumBeatCount?: number;
  }>;

export type MainWireNormalAdultFiveWallAorticValveResearchRunV1 = Readonly<{
  configurationRole: "fixed-aortic-valve-research-profile";
  profile: MainWireAorticValveResearchProfileV1;
  periodicResult: MainWireNormalAdultFiveWallPeriodicResultV1;
  claim: Readonly<{
    sourceResearchRunnerOnly: true;
    independentCanonicalColdStart: true;
    warmStartApplied: false;
    genericParameterPatchAccepted: false;
    valveDiseaseBracketApplied: false;
    exactRuntimeIdentityIncludesProfile: true;
  }>;
}>;

export type MainWireNormalAdultFiveWallAorticValveAreaControlRunV1 = Readonly<{
  configurationRole: "fixed-aortic-valve-area-identifiability-control";
  point: MainWireAorticValveAreaControlPointV1;
  periodicResult: MainWireNormalAdultFiveWallPeriodicResultV1;
  claim: Readonly<{
    sourceResearchRunnerOnly: true;
    independentCanonicalColdStart: true;
    warmStartApplied: false;
    genericParameterPatchAccepted: false;
    continuousValveAreaResearchInputUsed: true;
    onlyAorticMaximumForwardEoaChangedAcrossPoints: true;
    aorticValveConstitutiveLawChanged: false;
    acceptedStateOrCheckpointTopologyChanged: false;
    exactRuntimeIdentityIncludesAreaInput: true;
  }>;
}>;

export type MainWireNormalAdultFiveWallAorticOutflowResearchRunV1 = Readonly<{
  configurationRole: "fixed-aortic-outflow-driver-root-ablation-arm";
  arm: MainWireAorticOutflowDriverRootAblationArmV1;
  materialPoint: MainWireNormalAdultVentricularMaterialResearchPointV1;
  aorticRootInertanceProfile:
    MainWireAorticRootInertanceResearchProfileV1 | null;
  periodicResult: MainWireNormalAdultFiveWallPeriodicResultV1;
  claim: Readonly<{
    sourceResearchRunnerOnly: true;
    independentCanonicalColdStart: true;
    warmStartApplied: false;
    genericParameterPatchAccepted: false;
    valveDiseaseBracketApplied: false;
    aorticValveConstitutiveLawChanged: false;
    acceptedStateOrCheckpointTopologyChanged: false;
    exactRuntimeIdentityIncludesRootProfileWhenActive: true;
  }>;
}>;

export type MainWireNormalAdultFiveWallAorticOutflowLengthDependenceRootResistanceResearchRunV1 =
  Readonly<{
    configurationRole:
      "fixed-aortic-outflow-length-dependence-root-resistance-ablation-arm";
    arm: MainWireAorticOutflowLengthDependenceRootResistanceArmV1;
    materialPoint: MainWireNormalAdultVentricularMaterialResearchPointV1;
    aorticRootResistanceProfile:
      MainWireAorticRootResistanceResearchProfileV1 | null;
    periodicResult: MainWireNormalAdultFiveWallPeriodicResultV1;
    claim: Readonly<{
      sourceResearchRunnerOnly: true;
      independentCanonicalColdStart: true;
      warmStartApplied: false;
      genericParameterPatchAccepted: false;
      valveDiseaseBracketApplied: false;
      calciumDriveChanged: false;
      aorticValveConstitutiveLawChanged: false;
      acceptedStateOrCheckpointTopologyChanged: false;
      exactRuntimeIdentityIncludesRootProfileWhenActive: true;
    }>;
  }>;

export type MainWireNormalAdultFiveWallVentricularLengthDependenceResearchRunV1 =
  Readonly<{
    configurationRole:
      "fixed-ventricular-land-length-dependence-research-point";
    materialPoint: MainWireNormalAdultVentricularMaterialResearchPointV1;
    periodicResult: MainWireNormalAdultFiveWallPeriodicResultV1;
    claim: Readonly<{
      sourceResearchRunnerOnly: true;
      independentCanonicalColdStart: true;
      warmStartApplied: false;
      genericParameterPatchAccepted: false;
      valveDiseaseBracketApplied: false;
      circulationRuntimeChanged: false;
      calciumDriveChanged: false;
      aorticValveConstitutiveLawChanged: false;
      acceptedStateOrCheckpointTopologyChanged: false;
    }>;
  }>;

export type MainWireNormalAdultFiveWallAorticOutflowLengthVelocityResearchRunV1 =
  Readonly<{
    configurationRole: "fixed-aortic-outflow-length-velocity-ablation-arm";
    arm: MainWireAorticOutflowLengthVelocityArmV1;
    materialPoint: MainWireNormalAdultVentricularMaterialResearchPointV1;
    periodicResult: MainWireNormalAdultFiveWallPeriodicResultV1;
    claim: Readonly<{
      sourceResearchRunnerOnly: true;
      independentCanonicalColdStart: true;
      warmStartApplied: false;
      genericParameterPatchAccepted: false;
      valveDiseaseBracketApplied: false;
      circulationRuntimeChanged: false;
      calciumDriveChanged: false;
      aorticValveConstitutiveLawChanged: false;
      acceptedStateOrCheckpointTopologyChanged: false;
    }>;
  }>;

export type MainWireNormalAdultFiveWallAorticOutflowDistortionTransientResearchRunV1 =
  Readonly<{
    configurationRole:
      "fixed-aortic-outflow-distortion-transient-ablation-arm";
    arm: MainWireAorticOutflowDistortionTransientArmV1;
    materialPoint: MainWireNormalAdultVentricularMaterialResearchPointV1;
    periodicResult: MainWireNormalAdultFiveWallPeriodicResultV1;
    claim: Readonly<{
      sourceResearchRunnerOnly: true;
      independentCanonicalColdStart: true;
      warmStartApplied: false;
      genericParameterPatchAccepted: false;
      valveDiseaseBracketApplied: false;
      circulationRuntimeChanged: false;
      calciumDriveChanged: false;
      aorticValveConstitutiveLawChanged: false;
      acceptedStateOrCheckpointTopologyChanged: false;
    }>;
  }>;

export type MainWireNormalAdultFiveWallAorticOutflowVelocityDistortionAmplitudeResearchRunV1 =
  Readonly<{
    configurationRole:
      "fixed-aortic-outflow-velocity-distortion-amplitude-arm";
    arm: MainWireAorticOutflowVelocityDistortionAmplitudeArmV1;
    materialPoint: MainWireNormalAdultVentricularMaterialResearchPointV1;
    periodicResult: MainWireNormalAdultFiveWallPeriodicResultV1;
    claim: Readonly<{
      sourceResearchRunnerOnly: true;
      independentCanonicalColdStart: true;
      warmStartApplied: false;
      genericParameterPatchAccepted: false;
      valveDiseaseBracketApplied: false;
      circulationRuntimeChanged: false;
      calciumDriveChanged: false;
      aorticValveConstitutiveLawChanged: false;
      acceptedStateOrCheckpointTopologyChanged: false;
    }>;
  }>;

export type MainWireNormalAdultFiveWallAorticOutflowVelocityDistortionPreloadResearchRunV1 =
  Readonly<{
    configurationRole:
      "fixed-aortic-outflow-velocity-distortion-preload-arm";
    arm: MainWireAorticOutflowVelocityDistortionPreloadArmV1;
    materialPoint: MainWireNormalAdultVentricularMaterialResearchPointV1;
    stressedVenousVolumePoint:
      MainWireNormalAdultStressedVenousVolumeResearchPointV1;
    periodicResult: MainWireNormalAdultFiveWallPeriodicResultV1;
    claim: Readonly<{
      sourceResearchRunnerOnly: true;
      independentCanonicalColdStart: true;
      warmStartApplied: false;
      genericParameterPatchAccepted: false;
      valveDiseaseBracketApplied: false;
      circulationRuntimeChanged: false;
      calciumDriveChanged: false;
      aorticValveConstitutiveLawChanged: false;
      acceptedStateOrCheckpointTopologyChanged: false;
      exactProtocolIdentityIncludesMechanicsAndBloodVolume: true;
    }>;
  }>;

export type MainWireNormalAdultFiveWallAorticOutflowVelocityDistortionTrefResearchRunV1 =
  Readonly<{
    configurationRole:
      "fixed-aortic-outflow-velocity-distortion-tref-arm";
    arm: MainWireAorticOutflowVelocityDistortionTrefArmV1;
    materialPoint: MainWireNormalAdultVentricularMaterialResearchPointV1;
    periodicResult: MainWireNormalAdultFiveWallPeriodicResultV1;
    claim: Readonly<{
      sourceResearchRunnerOnly: true;
      independentCanonicalColdStart: true;
      warmStartApplied: false;
      genericParameterPatchAccepted: false;
      valveDiseaseBracketApplied: false;
      circulationRuntimeChanged: false;
      calciumDriveChanged: false;
      bloodVolumeChanged: false;
      aorticValveConstitutiveLawChanged: false;
      acceptedStateOrCheckpointTopologyChanged: false;
    }>;
  }>;

export type MainWireNormalAdultFiveWallAorticOutflowLengthMechanismResearchRunV1 =
  Readonly<{
    configurationRole:
      "fixed-aortic-outflow-length-mechanism-ablation-arm";
    arm: MainWireAorticOutflowLengthMechanismArmV1;
    materialPoint: MainWireNormalAdultVentricularMaterialResearchPointV1;
    periodicResult: MainWireNormalAdultFiveWallPeriodicResultV1;
    claim: Readonly<{
      sourceResearchRunnerOnly: true;
      independentCanonicalColdStart: true;
      warmStartApplied: false;
      genericParameterPatchAccepted: false;
      valveDiseaseBracketApplied: false;
      circulationRuntimeChanged: false;
      calciumDriveChanged: false;
      aorticValveConstitutiveLawChanged: false;
      acceptedStateOrCheckpointTopologyChanged: false;
    }>;
  }>;

export type MainWireNormalAdultFiveWallAorticOutflowMechanismCandidateLoadResearchRunV1 =
  Readonly<{
    configurationRole:
      "fixed-aortic-outflow-mechanism-candidate-load-envelope-run";
    candidate: MainWireAorticOutflowMechanismCandidateV1;
    context: MainWireAorticOutflowMechanismLoadContextV1;
    materialPoint: MainWireNormalAdultVentricularMaterialResearchPointV1;
    circulatoryLoadPoint: MainWireNormalAdultFiveWallCirculatoryLoadPointV1;
    stressedVenousVolumePoint:
      MainWireNormalAdultStressedVenousVolumeResearchPointV1;
    periodicResult: MainWireNormalAdultFiveWallPeriodicResultV1;
    claim: Readonly<{
      sourceResearchRunnerOnly: true;
      independentCanonicalColdStart: true;
      warmStartApplied: false;
      genericParameterPatchAccepted: false;
      valveDiseaseBracketApplied: false;
      calciumDriveChanged: false;
      aorticValveConstitutiveLawChanged: false;
      acceptedStateOrCheckpointTopologyChanged: false;
      exactProtocolIdentityIncludesCandidateLoadAndBloodVolume: true;
    }>;
  }>;

export type MainWireNormalAdultFiveWallAorticOutflowEjectionTimingCandidateLoadResearchRunV1 =
  Readonly<{
    configurationRole:
      "fixed-aortic-outflow-ejection-timing-candidate-load-envelope-run";
    candidate: MainWireAorticOutflowEjectionTimingCandidateV1;
    context: MainWireAorticOutflowEjectionTimingLoadContextV1;
    materialPoint: MainWireNormalAdultVentricularMaterialResearchPointV1;
    circulatoryLoadPoint: MainWireNormalAdultFiveWallCirculatoryLoadPointV1;
    stressedVenousVolumePoint:
      MainWireNormalAdultStressedVenousVolumeResearchPointV1;
    periodicResult: MainWireNormalAdultFiveWallPeriodicResultV1;
    claim: Readonly<{
      sourceResearchRunnerOnly: true;
      independentCanonicalColdStart: true;
      warmStartApplied: false;
      genericParameterPatchAccepted: false;
      valveDiseaseBracketApplied: false;
      calciumDriveChanged: false;
      aorticValveConstitutiveLawChanged: false;
      acceptedStateOrCheckpointTopologyChanged: false;
      exactProtocolIdentityIncludesCandidateLoadAndBloodVolume: true;
    }>;
  }>;

export type MainWireNormalAdultFiveWallAorticOutflowEjectionTimingRefinementResearchRunV1 =
  Readonly<{
    configurationRole:
      "fixed-aortic-outflow-ejection-timing-refinement-run";
    candidate: MainWireVentricularLandEtRefinementCandidateV1;
    context: MainWireAorticOutflowEjectionTimingRefinementContextV1;
    circulatoryLoadPoint: MainWireNormalAdultFiveWallCirculatoryLoadPointV1;
    periodicResult: MainWireNormalAdultFiveWallPeriodicResultV1;
    claim: Readonly<{
      sourceResearchRunnerOnly: true;
      independentCanonicalColdStart: true;
      warmStartApplied: false;
      genericParameterPatchAccepted: false;
      valveDiseaseBracketApplied: false;
      calciumDriveChanged: false;
      bloodVolumeChanged: false;
      aorticValveConstitutiveLawChanged: false;
      acceptedStateOrCheckpointTopologyChanged: false;
      exactProtocolIdentityIncludesCandidateAndLoad: true;
    }>;
  }>;

export type MainWireNormalAdultFiveWallAorticOutflowEjectionTimingLocalInertanceInteractionResearchRunV1 =
  Readonly<{
    configurationRole:
      "fixed-aortic-outflow-ejection-timing-local-inertance-interaction-arm";
    arm: MainWireAorticOutflowEjectionTimingLocalInertanceInteractionArmV1;
    materialPoint: MainWireNormalAdultVentricularMaterialResearchPointV1;
    localInertanceProfile: MainWireAorticValveLocalInertanceProfileV1 | null;
    periodicResult: MainWireNormalAdultFiveWallPeriodicResultV1;
    externalFlowStateAudit: MainWireNormalAdultFiveWallPeriodicResultV1[
      "aorticValveLocalInertanceResearchAudit"
    ] | null;
    claim: Readonly<{
      sourceResearchRunnerOnly: true;
      independentCanonicalColdStart: true;
      warmStartApplied: false;
      genericParameterPatchAccepted: false;
      valveDiseaseBracketApplied: false;
      calciumDriveChanged: false;
      bloodVolumeChanged: false;
      pressureRecoveryChanged: false;
      openingModeChanged: false;
      aorticMaximumForwardEoaChanged: false;
      externalFlowPromotedOnlyAfterSuccessfulCoupledStepWhenApplicable: true;
      canonicalAcceptedStateOrCheckpointChanged: false;
      exactProtocolIdentityIncludesMechanicsAndLocalInertance: true;
    }>;
  }>;

export type MainWireNormalAdultFiveWallAorticOutflowEjectionTimingCharacteristicResistancePlacementResearchRunV1 =
  Readonly<{
    configurationRole:
      "fixed-aortic-outflow-ejection-timing-characteristic-resistance-placement-arm";
    arm:
      MainWireAorticOutflowEjectionTimingCharacteristicResistancePlacementArmV1;
    materialPoint: MainWireNormalAdultVentricularMaterialResearchPointV1;
    placementProfile:
      MainWireAorticCharacteristicResistancePlacementProfileV1 | null;
    periodicResult: MainWireNormalAdultFiveWallPeriodicResultV1;
    claim: Readonly<{
      sourceResearchRunnerOnly: true;
      independentCanonicalColdStart: true;
      warmStartApplied: false;
      genericParameterPatchAccepted: false;
      valveDiseaseBracketApplied: false;
      calciumDriveChanged: false;
      bloodVolumeChanged: false;
      aorticMaximumForwardEoaChanged: false;
      aorticValveOpeningLawChanged: false;
      aorticRootComplianceOrInertanceChanged: false;
      sourceTopologyLinearResistanceSumPreservedExactly: true;
      acceptedStateOrCheckpointTopologyChanged: false;
      exactProtocolIdentityIncludesMechanicsAndPlacement: true;
    }>;
  }>;

export type MainWireNormalAdultFiveWallAorticOutflowVelocityStiffnessResearchRunV1 =
  Readonly<{
    configurationRole: "fixed-aortic-outflow-velocity-stiffness-ablation-arm";
    arm: MainWireAorticOutflowVelocityStiffnessArmV1;
    materialPoint: MainWireNormalAdultVentricularMaterialResearchPointV1;
    circulatoryLoadPoint: MainWireNormalAdultFiveWallCirculatoryLoadPointV1;
    periodicResult: MainWireNormalAdultFiveWallPeriodicResultV1;
    claim: Readonly<{
      sourceResearchRunnerOnly: true;
      independentCanonicalColdStart: true;
      warmStartApplied: false;
      genericParameterPatchAccepted: false;
      valveDiseaseBracketApplied: false;
      calciumDriveChanged: false;
      aorticValveConstitutiveLawChanged: false;
      acceptedStateOrCheckpointTopologyChanged: false;
      exactRuntimeIdentityIncludesLoadPoint: true;
    }>;
  }>;

export type MainWireNormalAdultFiveWallAorticCompliancePartitionResearchRunV1 =
  Readonly<{
    configurationRole:
      "fixed-aortic-compliance-partition-research-profile";
    profile: MainWireAorticCompliancePartitionResearchProfileV1;
    capacitySnapshot:
      MainWireAorticCompliancePartitionCapacitySnapshotV1;
    periodicResult: MainWireNormalAdultFiveWallPeriodicResultV1;
    claim: Readonly<{
      sourceResearchRunnerOnly: true;
      independentCanonicalColdStart: true;
      warmStartApplied: false;
      genericParameterPatchAccepted: false;
      valveDiseaseBracketApplied: false;
      aorticValveConstitutiveLawChanged: false;
      globalArterialStiffnessChanged: false;
      aorticRootPlusSystemicArteryVsSumPreservedExactly: true;
      acceptedStateOrCheckpointTopologyChanged: false;
      exactRuntimeIdentityIncludesPartitionProfile: true;
    }>;
  }>;

export type MainWireNormalAdultFiveWallArterialCompliancePhysiologyResearchRunV1 =
  Readonly<{
    configurationRole:
      "fixed-arterial-compliance-physiology-research-profile";
    profile: MainWireArterialCompliancePhysiologyProfileV1;
    periodicResult: MainWireNormalAdultFiveWallPeriodicResultV1;
    claim: Readonly<{
      sourceResearchRunnerOnly: true;
      independentCanonicalColdStart: true;
      warmStartApplied: false;
      genericParameterPatchAccepted: false;
      valveDiseaseBracketApplied: false;
      bloodVolumeChanged: false;
      systemicOrPulmonaryResistanceChanged: false;
      aorticValveConstitutiveLawChanged: false;
      mechanicsOrCalciumChanged: false;
      acceptedStateOrCheckpointTopologyChanged: false;
      exactRuntimeIdentityIncludesProfile: true;
    }>;
  }>;

export type MainWireNormalAdultFiveWallAorticValveLocalInertanceResearchRunV1 =
  Readonly<{
    configurationRole: "fixed-aortic-valve-local-inertance-research-profile";
    profile: MainWireAorticValveLocalInertanceProfileV1;
    periodicResult: MainWireNormalAdultFiveWallPeriodicResultV1;
    externalFlowStateAudit: NonNullable<
      MainWireNormalAdultFiveWallPeriodicResultV1[
        "aorticValveLocalInertanceResearchAudit"
      ]
    >;
    claim: Readonly<{
      sourceResearchRunnerOnly: true;
      independentCanonicalColdStart: true;
      genericParameterPatchAccepted: false;
      valveDiseaseBracketApplied: false;
      externalFlowPromotedOnlyAfterSuccessfulCoupledStep: true;
      canonicalAcceptedStateOrCheckpointChanged: false;
      standardWarmStartEmitted: false;
    }>;
  }>;

export type MainWireNormalAdultFiveWallAorticValveLocalInertancePressureRecoveryRunV1 =
  Readonly<{
    configurationRole:
      "fixed-aortic-valve-local-inertance-pressure-recovery-factorial-arm";
    arm: MainWireAorticValveLocalInertancePressureRecoveryArmV1;
    localInertanceProfile: MainWireAorticValveLocalInertanceProfileV1 | null;
    pressureRecoveryProfile: MainWireAorticValveResearchProfileV1 | null;
    periodicResult: MainWireNormalAdultFiveWallPeriodicResultV1;
    externalFlowStateAudit: MainWireNormalAdultFiveWallPeriodicResultV1[
      "aorticValveLocalInertanceResearchAudit"
    ] | null;
    claim: Readonly<{
      sourceResearchRunnerOnly: true;
      independentCanonicalColdStart: true;
      warmStartApplied: false;
      genericParameterPatchAccepted: false;
      valveDiseaseBracketApplied: false;
      openingModeChanged: false;
      aorticMaximumForwardEoaChanged: false;
      externalFlowPromotedOnlyAfterSuccessfulCoupledStepWhenApplicable: true;
      canonicalAcceptedStateOrCheckpointChanged: false;
      standardWarmStartEmittedWhenLocalInertanceOn: false;
      exactRuntimeIdentityIncludesBothFactorProfiles: true;
    }>;
  }>;

export type MainWireNormalAdultFiveWallVentricularCalciumWaveformResearchRunV1 =
  Readonly<{
    configurationRole:
      "fixed-ventricular-calcium-waveform-research-profile";
    profile: MainWireVentricularCalciumWaveformProfileV1;
    calciumDriveParams: FiveWallNormalCalciumDriveParamsV1;
    periodicResult: MainWireNormalAdultFiveWallPeriodicResultV1;
    claim: Readonly<{
      sourceResearchRunnerOnly: true;
      independentCanonicalColdStart: true;
      warmStartApplied: false;
      genericParameterPatchAccepted: false;
      valveDiseaseBracketApplied: false;
      circulationRuntimeChanged: false;
      mechanicsProviderChanged: false;
      calciumOrMechanicsStateAdded: false;
      acceptedStateOrCheckpointTopologyChanged: false;
      exactProtocolIdentityIncludesCalciumParams: true;
    }>;
  }>;

export type MainWireNormalAdultFiveWallAorticOutflowEjectionTimingResearchRunV1 =
  Readonly<{
    configurationRole:
      "fixed-aortic-outflow-ejection-timing-causal-ablation-arm";
    arm: MainWireAorticOutflowEjectionTimingArmV1;
    calciumProfile:
      MainWireVentricularCalciumFixedAmplitudeDecayProfileV1;
    gammaWProfile: MainWireNormalAdultVentricularGammaWResearchProfileV1;
    calciumDriveParams: FiveWallNormalCalciumDriveParamsV1;
    periodicResult: MainWireNormalAdultFiveWallPeriodicResultV1;
    claim: Readonly<{
      sourceResearchRunnerOnly: true;
      independentCanonicalColdStart: true;
      warmStartApplied: false;
      genericParameterPatchAccepted: false;
      valveDiseaseBracketApplied: false;
      circulationRuntimeChanged: false;
      aorticValveConstitutiveLawChanged: false;
      calciumOrMechanicsStateAdded: false;
      acceptedStateOrCheckpointTopologyChanged: false;
      calciumAndGammaWAxesCombined: false;
      exactProtocolIdentityIncludesCalciumAndMechanicsParams: true;
    }>;
  }>;

export type MainWireNormalAdultFiveWallVentricularLandTwitchTimingResearchRunV1 =
  Readonly<{
    configurationRole:
      "fixed-ventricular-land-twitch-timing-candidate";
    candidate: MainWireVentricularLandTwitchTimingCandidateV1;
    calciumDriveParams: FiveWallNormalCalciumDriveParamsV1;
    periodicResult: MainWireNormalAdultFiveWallPeriodicResultV1;
    claim: Readonly<{
      sourceResearchRunnerOnly: true;
      independentCanonicalColdStart: true;
      warmStartApplied: false;
      genericParameterPatchAccepted: false;
      valveDiseaseBracketApplied: false;
      circulationRuntimeChanged: false;
      calciumDriveChanged: false;
      aorticValveConstitutiveLawChanged: false;
      calciumOrMechanicsStateAdded: false;
      acceptedStateOrCheckpointTopologyChanged: false;
      exactProtocolIdentityIncludesMechanicsParams: true;
    }>;
  }>;

export type MainWireNormalAdultFiveWallVentricularCalciumSourceConstrainedResearchRunV1 =
  Readonly<{
    configurationRole:
      "fixed-ventricular-calcium-source-constrained-research-profile";
    profile: MainWireVentricularCalciumSourceConstrainedProfileV1;
    calciumDriveParams: FiveWallNormalCalciumDriveParamsV1;
    periodicResult: MainWireNormalAdultFiveWallPeriodicResultV1;
    claim: Readonly<{
      sourceResearchRunnerOnly: true;
      independentCanonicalColdStart: true;
      warmStartApplied: false;
      genericParameterPatchAccepted: false;
      valveDiseaseBracketApplied: false;
      circulationRuntimeChanged: false;
      mechanicsProviderChanged: false;
      calciumOrMechanicsStateAdded: false;
      acceptedStateOrCheckpointTopologyChanged: false;
      exactProtocolIdentityIncludesCalciumParams: true;
    }>;
  }>;

export type MainWireNormalAdultFiveWallVentricularCalciumLandTwitchTimingResearchRunV1 =
  Readonly<{
    configurationRole:
      "fixed-ventricular-calcium-land-twitch-timing-factorial-arm";
    calciumProfile: MainWireVentricularCalciumSourceConstrainedProfileV1;
    twitchTimingCandidate: MainWireVentricularLandTwitchTimingCandidateV1;
    calciumDriveParams: FiveWallNormalCalciumDriveParamsV1;
    periodicResult: MainWireNormalAdultFiveWallPeriodicResultV1;
    claim: Readonly<{
      sourceResearchRunnerOnly: true;
      independentCanonicalColdStart: true;
      warmStartApplied: false;
      genericParameterPatchAccepted: false;
      valveDiseaseBracketApplied: false;
      circulationRuntimeChanged: false;
      aorticValveConstitutiveLawChanged: false;
      calciumOrMechanicsStateAdded: false;
      acceptedStateOrCheckpointTopologyChanged: false;
      exactProtocolIdentityIncludesCalciumAndMechanicsParams: true;
    }>;
  }>;

export type MainWireNormalAdultFiveWallAorticOutflowLowOrderMechanismCombinationResearchRunV1 =
  Readonly<{
    configurationRole:
      "fixed-aortic-outflow-low-order-mechanism-combination-arm";
    complianceProfile: MainWireArterialCompliancePhysiologyProfileV1;
    compliancePartitionProfile:
      MainWireAorticCompliancePartitionResearchProfileV1 | null;
    placementProfile:
      MainWireAorticCharacteristicResistancePlacementProfileV1 | null;
    rootInertanceProfile: MainWireAorticRootInertanceResearchProfileV1 | null;
    twitchTimingCandidate: MainWireVentricularLandTwitchTimingCandidateV1;
    circulatoryLoadPoint: MainWireNormalAdultFiveWallCirculatoryLoadPointV1;
    bloodVolumePoint: MainWireNormalAdultStressedVenousVolumeResearchPointV1;
    calciumDriveParams: FiveWallNormalCalciumDriveParamsV1;
    periodicResult: MainWireNormalAdultFiveWallPeriodicResultV1;
    claim: Readonly<{
      sourceResearchRunnerOnly: true;
      independentCanonicalColdStart: true;
      warmStartApplied: false;
      genericParameterPatchAccepted: false;
      valveDiseaseBracketApplied: false;
      bloodVolumeChanged: false;
      aorticMaximumForwardEoaChanged: false;
      calciumDriveChanged: false;
      calciumOrMechanicsStateAdded: false;
      acceptedStateOrCheckpointTopologyChanged: false;
      exactProtocolIdentityIncludesAllSevenFactors: true;
    }>;
  }>;

export type MainWireNormalAdultFiveWallAorticRootRlcDampingResearchRunV1 =
  Readonly<{
    configurationRole: "fixed-aortic-root-rlc-damping-research-arm";
    compliancePartitionProfile:
      MainWireAorticCompliancePartitionResearchProfileV1 | null;
    rootResistanceProfile: MainWireAorticRootResistanceResearchProfileV1 | null;
    rootInertanceProfile: MainWireAorticRootInertanceResearchProfileV1 | null;
    twitchTimingCandidate: MainWireVentricularLandTwitchTimingCandidateV1;
    calciumDriveParams: FiveWallNormalCalciumDriveParamsV1;
    periodicResult: MainWireNormalAdultFiveWallPeriodicResultV1;
    claim: Readonly<{
      sourceResearchRunnerOnly: true;
      independentCanonicalColdStart: true;
      warmStartApplied: false;
      genericParameterPatchAccepted: false;
      valveDiseaseBracketApplied: false;
      bloodVolumeChanged: false;
      aorticMaximumForwardEoaChanged: false;
      calciumDriveChanged: false;
      dynamicFlowStateOwnerChanged: false;
      acceptedStateOrCheckpointTopologyChanged: false;
      exactProtocolIdentityIncludesAllFourFactors: true;
    }>;
  }>;

export type MainWireNormalAdultFiveWallAorticRootFlowStateRelocationResearchRunV1 =
  Readonly<{
    configurationRole:
      "fixed-aortic-root-flow-state-relocation-research-arm";
    relocationProfile: MainWireAorticRootFlowStateRelocationProfileV1;
    complianceProfile: MainWireArterialCompliancePhysiologyProfileV1;
    twitchTimingCandidate: MainWireVentricularLandTwitchTimingCandidateV1;
    calciumDriveParams: FiveWallNormalCalciumDriveParamsV1;
    periodicResult: MainWireNormalAdultFiveWallPeriodicResultV1;
    claim: Readonly<{
      sourceResearchRunnerOnly: true;
      independentCanonicalColdStart: true;
      warmStartApplied: false;
      genericParameterPatchAccepted: false;
      valveDiseaseBracketApplied: false;
      bloodVolumeChanged: false;
      aorticMaximumForwardEoaChanged: false;
      calciumDriveChanged: false;
      dynamicFlowStateSlotCountChanged: false;
      dynamicFlowStateSlotSemanticsChanged: true;
      canonicalCheckpointCompatible: false;
      exactProtocolIdentityIncludesAllThreeFactors: true;
    }>;
  }>;

export type MainWireNormalAdultFiveWallAorticOutflowWholeOrganKuwWindkesselResearchRunV1 =
  Readonly<{
    configurationRole:
      "fixed-aortic-outflow-whole-organ-kuw-windkessel-arm";
    kuwProfile: MainWireVentricularLandWholeOrganKuwProfileV1;
    complianceProfile: MainWireArterialCompliancePhysiologyProfileV1;
    placementProfile:
      MainWireAorticCharacteristicResistancePlacementProfileV1 | null;
    rootInertanceProfile: MainWireAorticRootInertanceResearchProfileV1 | null;
    calciumDriveParams: FiveWallNormalCalciumDriveParamsV1;
    periodicResult: MainWireNormalAdultFiveWallPeriodicResultV1;
    claim: Readonly<{
      sourceResearchRunnerOnly: true;
      independentCanonicalColdStart: true;
      warmStartApplied: false;
      genericParameterPatchAccepted: false;
      valveDiseaseBracketApplied: false;
      bloodVolumeChanged: false;
      aorticMaximumForwardEoaChanged: false;
      sourceFittedAeffChanged: false;
      sourceWholeOrganTrefChanged: false;
      calciumDriveChanged: false;
      acceptedStateOrCheckpointTopologyChanged: false;
      exactProtocolIdentityIncludesAllFourFactors: true;
    }>;
  }>;

export type MainWireNormalAdultFiveWallAorticOutflowLandCoppiniSourceTraceWindkesselResearchRunV1 =
  Readonly<{
    configurationRole:
      "fixed-aortic-outflow-land-coppini-source-trace-windkessel-arm";
    kuwProfile: MainWireVentricularLandWholeOrganKuwProfileV1;
    sourceTraceProfile:
      typeof MAIN_WIRE_VENTRICULAR_CALCIUM_LAND_COPPINI_SOURCE_TRACE_PROFILE_V1;
    sarcomereReferenceProfile:
      MainWireVentricularLandSarcomereReferenceProfileV1;
    calciumSensitivityLengthProfile:
      MainWireVentricularLandCalciumSensitivityLengthProfileV1;
    sourceTwitchRetentionCandidate:
      MainWireVentricularLandSourceTwitchRetentionCandidateV1;
    trefForceLoadProfile:
      MainWireVentricularLandTrefForceLoadProfileV1;
    sourceVelocityDistortionProfile:
      MainWireVentricularLandSourceVelocityDistortionProfileV1;
    strongBridgeDeactivationExitProfile:
      MainWireVentricularLandStrongBridgeDeactivationExitProfileV1;
    atrioventricularDelayProfile:
      MainWireAtrioventricularDelayProfileV1;
    circulatoryLoadPoint:
      MainWireNormalAdultFiveWallCirculatoryLoadPointV1;
    stressedVenousVolumePoint:
      MainWireNormalAdultStressedVenousVolumeResearchPointV1;
    complianceProfile: MainWireArterialCompliancePhysiologyProfileV1;
    placementProfile:
      MainWireAorticCharacteristicResistancePlacementProfileV1 | null;
    rootInertanceProfile: MainWireAorticRootInertanceResearchProfileV1 | null;
    aorticValveResearchProfile: MainWireAorticValveResearchProfileV1 | null;
    recoveredRootPortValveProfile:
      MainWireAorticRecoveredRootPortValveProfileV1 | null;
    calciumDriveParams: FiveWallNormalCalciumDriveParamsV1;
    periodicResult: MainWireNormalAdultFiveWallPeriodicResultV1;
    claim: Readonly<{
      sourceResearchRunnerOnly: true;
      independentCanonicalColdStart: true;
      warmStartApplied: false;
      genericParameterPatchAccepted: false;
      valveDiseaseBracketApplied: false;
      bloodVolumeChanged: boolean;
      systemicOrPulmonaryResistanceChanged: boolean;
      arterialStiffnessLoadScaleChanged: boolean;
      aorticValveConstitutiveLawChanged: boolean;
      aorticValvePressureStationOwnershipChanged: boolean;
      aorticMaximumForwardEoaChanged: false;
      sourceFittedAeffChanged: boolean;
      sourceWholeOrganTrefChanged: boolean;
      primaryNumericSourceCalciumTraceUsed: true;
      sourceLandParametersOutsideExplicitResearchAxesChanged: false;
      sourceLandBeta1Changed: boolean;
      sourceLandTwitchRetentionParametersChanged: boolean;
      sourceLandTrefForceLoadChanged: boolean;
      sourceLandVelocityDistortionChanged: boolean;
      sourceLandStrongBridgeDeactivationExitChanged: boolean;
      sourceLandStrongBridgeDeactivationExitPeakCompensationChanged: boolean;
      atrioventricularDelayChanged: boolean;
      sourceTwitchRetentionCandidateDerivedFromIsometricOnly: boolean;
      sourceTwitchRetentionCandidateInformedByPriorLoadedEnvelope: boolean;
      referenceLengthIsometricLandValuesChanged: false;
      referenceLengthIsometricPeakTargetChangedByTrefForceLoad: boolean;
      landSarcomereReferenceCouplingChanged: boolean;
      calciumOrMechanicsStateAdded: false;
      acceptedStateOrCheckpointTopologyChanged: false;
      exactProtocolIdentityIncludesAllExplicitFactors: true;
    }>;
  }>;

export type MainWireNormalAdultFiveWallAorticOutflowV10HeartRateCalciumHypothesisResearchRunV1 =
  Readonly<{
    configurationRole: "fixed-v10-reference-non-calcium-heart-rate-calcium-hypothesis-arm";
    referenceNonCalciumAssembly: typeof MAIN_WIRE_AORTIC_OUTFLOW_V10_HEART_RATE_CALCIUM_REFERENCE_NON_CALCIUM_ASSEMBLY_V1;
    calciumHypothesisProfile: MainWireVentricularCalciumHeartRateHypothesisProfileV1;
    kuwProfile: MainWireVentricularLandWholeOrganKuwProfileV1;
    sarcomereReferenceProfile: MainWireVentricularLandSarcomereReferenceProfileV1;
    calciumSensitivityLengthProfile: MainWireVentricularLandCalciumSensitivityLengthProfileV1;
    sourceTwitchRetentionCandidate: MainWireVentricularLandSourceTwitchRetentionCandidateV1;
    trefForceLoadProfile: MainWireVentricularLandTrefForceLoadProfileV1;
    sourceVelocityDistortionProfile: MainWireVentricularLandSourceVelocityDistortionProfileV1;
    strongBridgeDeactivationExitProfile: MainWireVentricularLandStrongBridgeDeactivationExitProfileV1;
    circulatoryLoadPoint: MainWireNormalAdultFiveWallCirculatoryLoadPointV1;
    stressedVenousVolumePoint: MainWireNormalAdultStressedVenousVolumeResearchPointV1;
    complianceProfile: MainWireArterialCompliancePhysiologyProfileV1;
    placementProfile: MainWireAorticCharacteristicResistancePlacementProfileV1;
    rootInertanceProfile: MainWireAorticRootInertanceResearchProfileV1;
    aorticValveResearchProfile: MainWireAorticValveResearchProfileV1;
    recoveredRootPortValveProfile: MainWireAorticRecoveredRootPortValveProfileV1;
    calciumDriveParams: FiveWallNormalCalciumDriveParamsV1;
    periodicResult: MainWireNormalAdultFiveWallPeriodicResultV1;
    exactAssemblyAudit: Readonly<{
      mechanicsProviderParameterIdentityHash: string;
      circulationRuntimeStableHash: string;
      bloodVolumeOperatingPointStableHash: string;
      calciumDriveFixedParamsStableHash: string;
    }>;
    claim: Readonly<{
      sourceResearchRunnerOnly: true;
      independentCanonicalColdStart: true;
      warmStartApplied: false;
      genericParameterPatchAccepted: false;
      fixedCalciumHypothesisProfileOnly: true;
      valveDiseaseBracketApplied: false;
      referenceAssemblyDerivedFromCandidateV10: true;
      fullV10CandidateIdentityRetained: false;
      V10ReferenceNonCalciumAssemblyHeldExactly: true;
      V10CalciumAndAtrioventricularTimingIdentityHeldFixed: false;
      ventricularNumericSourceTraceUsed: boolean;
      oldLandCoppiniSourceTraceProfileReturned: false;
      oldAtrioventricularDelayProfileReturned: false;
      circulatoryLoadHeldAtBaseline: true;
      bloodVolumeHeldAtBaseline: true;
      systemicOrBloodVolumeRecalibrationApplied: false;
      aorticMaximumForwardEoaHeldAtCm2: 3.5;
      calciumOrMechanicsStateAdded: false;
      acceptedStateOrCheckpointTopologyChanged: false;
      nonHr60V3WarmStartEmissionSuppressed: true;
      nonHr60V3WarmStartRestoreRejected: true;
      exactProtocolIdentityIncludesActiveCalciumAndAllNonCalciumFactors: true;
      parameterSearchOrFitting: false;
      clinicalValidationClaimed: false;
      canonicalAdoptionEstablished: false;
    }>;
  }>;

export type MainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaTimingPolicyBridgeResearchRunV1 =
  Readonly<{
    configurationRole: "fixed-v10-reference-non-calcium-matched-alpha-timing-policy-bridge-arm";
    referenceNonCalciumAssembly: typeof MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_REFERENCE_NON_CALCIUM_ASSEMBLY_V1;
    matchedAlphaTimingPolicyBridgeProfile: MainWireVentricularCalciumMatchedAlphaTimingPolicyBridgeProfileV1;
    kuwProfile: MainWireVentricularLandWholeOrganKuwProfileV1;
    sarcomereReferenceProfile: MainWireVentricularLandSarcomereReferenceProfileV1;
    calciumSensitivityLengthProfile: MainWireVentricularLandCalciumSensitivityLengthProfileV1;
    sourceTwitchRetentionCandidate: MainWireVentricularLandSourceTwitchRetentionCandidateV1;
    trefForceLoadProfile: MainWireVentricularLandTrefForceLoadProfileV1;
    sourceVelocityDistortionProfile: MainWireVentricularLandSourceVelocityDistortionProfileV1;
    strongBridgeDeactivationExitProfile: MainWireVentricularLandStrongBridgeDeactivationExitProfileV1;
    circulatoryLoadPoint: MainWireNormalAdultFiveWallCirculatoryLoadPointV1;
    stressedVenousVolumePoint: MainWireNormalAdultStressedVenousVolumeResearchPointV1;
    complianceProfile: MainWireArterialCompliancePhysiologyProfileV1;
    placementProfile: MainWireAorticCharacteristicResistancePlacementProfileV1;
    rootInertanceProfile: MainWireAorticRootInertanceResearchProfileV1;
    aorticValveResearchProfile: MainWireAorticValveResearchProfileV1;
    recoveredRootPortValveProfile: MainWireAorticRecoveredRootPortValveProfileV1;
    calciumDriveParams: FiveWallNormalCalciumDriveParamsV1;
    periodicResult: MainWireNormalAdultFiveWallPeriodicResultV1;
    exactAssemblyAudit: Readonly<{
      mechanicsProviderParameterIdentityHash: string;
      circulationRuntimeStableHash: string;
      bloodVolumeOperatingPointStableHash: string;
      calciumDriveFixedParamsStableHash: string;
    }>;
    claim: Readonly<{
      sourceResearchRunnerOnly: true;
      independentCanonicalColdStart: true;
      warmStartApplied: false;
      genericParameterPatchAccepted: false;
      fixedMatchedAlphaTimingPolicyBridgeProfileOnly: true;
      valveDiseaseBracketApplied: false;
      referenceAssemblyDerivedFromCandidateV10: true;
      fullV10CandidateIdentityRetained: false;
      V10ReferenceNonCalciumAssemblyHeldExactly: true;
      V10CalciumAndAtrioventricularTimingIdentityHeldFixed: false;
      matchedAlphaWaveformFamilyHeldExactly: true;
      ventricularCalciumExtremaHeldExactly: true;
      ventricularElectricalToCalciumDelayHeldAtSec: 0.012;
      atrioventricularDelayHeldAtSec: 0.12;
      onlyVentricularRiseAndDecayTimeConstantsDifferAcrossTimingPolicy: true;
      oldLandCoppiniSourceTraceProfileReturned: false;
      oldAtrioventricularDelayProfileReturned: false;
      circulatoryLoadHeldAtBaseline: true;
      bloodVolumeHeldAtBaseline: true;
      systemicOrBloodVolumeRecalibrationApplied: false;
      aorticMaximumForwardEoaHeldAtCm2: 3.5;
      calciumOrMechanicsStateAdded: false;
      acceptedStateOrCheckpointTopologyChanged: false;
      nonHr60V3WarmStartEmissionSuppressed: true;
      nonHr60V3WarmStartRestoreRejected: true;
      profileToCalciumParamsIdentityChecked: true;
      exactProtocolIdentityIncludesCalciumParamsAndAllNonCalciumFactors: true;
      parameterSearchOrFitting: false;
      clinicalValidationClaimed: false;
      canonicalAdoptionEstablished: false;
    }>;
  }>;

export const MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_FIXED_PHYSICAL_HORIZON_SENTINEL_STEPS_PER_CYCLE_V1 =
  4_000 as const;

export const MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_FIXED_PHYSICAL_HORIZON_SENTINEL_SEC_V1 =
  48 as const;

export type MainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaTimingPolicyBridgeFixedPhysicalHorizonSentinelResearchRunV1 =
  Readonly<
    Omit<
      MainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaTimingPolicyBridgeResearchRunV1,
      "configurationRole" | "claim"
    > & {
      configurationRole: "fixed-v10-reference-non-calcium-matched-alpha-timing-policy-bridge-48s-sentinel-arm";
      executionPolicy: Readonly<{
        policyId: "matched-alpha-fixed-physical-horizon-48s-sentinel-v1";
        fixedPhysicalHorizonSec: 48;
        stepsPerCycle: 4_000;
        minimumCompletedBeatCountBeforePeriodicTermination: 40 | 72;
        maximumBeatCount: 40 | 72;
        periodicTerminationBeforeFixedHorizonAccepted: false;
      }>;
      claim: Readonly<{
        sourceResearchRunnerOnly: true;
        independentCanonicalColdStart: true;
        warmStartApplied: false;
        publicExecutionOptionsAccepted: false;
        genericParameterPatchAccepted: false;
        fixedMatchedAlphaTimingPolicyBridgeProfileOnly: true;
        fixedPhysicalHorizonSentinelOnly: true;
        fixedPhysicalHorizonSec: 48;
        fixedStepsPerCycle: 4_000;
        minimumAndMaximumBeatCountsEqual: true;
        periodicTerminationBeforeFixedHorizonAccepted: false;
        endpointPeriodicClassificationStillRequiredForP1Claim: true;
        executionHorizonIsExactRunnerPolicyNotPhysiologicalProtocolParameter: true;
        valveDiseaseBracketApplied: false;
        referenceAssemblyDerivedFromCandidateV10: true;
        fullV10CandidateIdentityRetained: false;
        V10ReferenceNonCalciumAssemblyHeldExactly: true;
        matchedAlphaWaveformFamilyHeldExactly: true;
        ventricularCalciumExtremaHeldExactly: true;
        circulatoryLoadHeldAtBaseline: true;
        bloodVolumeHeldAtBaseline: true;
        systemicOrBloodVolumeRecalibrationApplied: false;
        aorticMaximumForwardEoaHeldAtCm2: 3.5;
        calciumOrMechanicsStateAdded: false;
        acceptedStateOrCheckpointTopologyChanged: false;
        nonHr60V3WarmStartEmissionSuppressed: true;
        nonHr60V3WarmStartRestoreRejected: true;
        profileToCalciumParamsIdentityChecked: true;
        exactProtocolIdentityIncludesCalciumParamsAndAllNonCalciumFactors: true;
        derivedAnalysisStored: false;
        parameterSearchOrFitting: false;
        clinicalValidationClaimed: false;
        canonicalAdoptionEstablished: false;
      }>;
    }
  >;

export type MainWireNormalAdultFiveWallAorticOutflowLandCoppiniAmplitudeTrefWindkesselResearchRunV1 =
  Readonly<{
    configurationRole:
      "fixed-aortic-outflow-land-coppini-amplitude-tref-windkessel-arm";
    amplitudeTrefPair: MainWireVentricularLandCoppiniAmplitudeTrefPairV1;
    kuwProfile: MainWireVentricularLandWholeOrganKuwProfileV1;
    sarcomereReferenceProfile:
      MainWireVentricularLandSarcomereReferenceProfileV1;
    complianceProfile: MainWireArterialCompliancePhysiologyProfileV1;
    placementProfile:
      MainWireAorticCharacteristicResistancePlacementProfileV1 | null;
    rootInertanceProfile: MainWireAorticRootInertanceResearchProfileV1 | null;
    calciumDriveParams: FiveWallNormalCalciumDriveParamsV1;
    periodicResult: MainWireNormalAdultFiveWallPeriodicResultV1;
    claim: Readonly<{
      sourceResearchRunnerOnly: true;
      independentCanonicalColdStart: true;
      warmStartApplied: false;
      genericParameterPatchAccepted: false;
      valveDiseaseBracketApplied: false;
      bloodVolumeChanged: false;
      aorticMaximumForwardEoaChanged: false;
      sourceLandParametersExceptTrefChanged: false;
      amplitudeAndTrefPairDerivedFromSourceIsometricPeakOnly: true;
      loadedOrHemodynamicOutcomeUsedToDerivePair: false;
      calciumOrMechanicsStateAdded: false;
      acceptedStateOrCheckpointTopologyChanged: false;
      exactProtocolIdentityIncludesAllSevenFactors: true;
    }>;
  }>;

export type MainWireNormalAdultFiveWallAorticOutflowWholeOrganKuwCalciumWindkesselResearchRunV1 =
  Readonly<{
    configurationRole:
      "fixed-aortic-outflow-whole-organ-kuw-calcium-windkessel-arm";
    kuwProfile: MainWireVentricularLandWholeOrganKuwProfileV1;
    calciumProfile: MainWireVentricularCalciumDelayedMixtureProfileV1 | null;
    complianceProfile: MainWireArterialCompliancePhysiologyProfileV1;
    placementProfile:
      MainWireAorticCharacteristicResistancePlacementProfileV1 | null;
    rootInertanceProfile: MainWireAorticRootInertanceResearchProfileV1 | null;
    calciumDriveParams: FiveWallNormalCalciumDriveParamsV1;
    periodicResult: MainWireNormalAdultFiveWallPeriodicResultV1;
    claim: Readonly<{
      sourceResearchRunnerOnly: true;
      independentCanonicalColdStart: true;
      warmStartApplied: false;
      genericParameterPatchAccepted: false;
      valveDiseaseBracketApplied: false;
      bloodVolumeChanged: false;
      aorticMaximumForwardEoaChanged: false;
      sourceFittedAeffChanged: false;
      sourceWholeOrganTrefChanged: false;
      calciumOrMechanicsStateAdded: false;
      acceptedStateOrCheckpointTopologyChanged: false;
      exactProtocolIdentityIncludesAllFiveFactors: true;
    }>;
  }>;

export type MainWireNormalAdultFiveWallAorticOutflowActivationDistributionWindkesselResearchRunV1 =
  Readonly<{
    configurationRole:
      "fixed-aortic-outflow-activation-distribution-windkessel-arm";
    kuwProfile: MainWireVentricularLandWholeOrganKuwProfileV1;
    activationDistributionProfile:
      MainWireVentricularCalciumActivationDistributionProfileV1;
    complianceProfile: MainWireArterialCompliancePhysiologyProfileV1;
    placementProfile:
      MainWireAorticCharacteristicResistancePlacementProfileV1 | null;
    rootInertanceProfile: MainWireAorticRootInertanceResearchProfileV1 | null;
    calciumDriveParams: FiveWallNormalCalciumDriveParamsV1;
    periodicResult: MainWireNormalAdultFiveWallPeriodicResultV1;
    claim: Readonly<{
      sourceResearchRunnerOnly: true;
      independentCanonicalColdStart: true;
      warmStartApplied: false;
      genericParameterPatchAccepted: false;
      valveDiseaseBracketApplied: false;
      bloodVolumeChanged: false;
      aorticMaximumForwardEoaChanged: false;
      sourceFittedAeffChanged: false;
      sourceWholeOrganTrefChanged: false;
      localCellCalciumPulseChanged: false;
      calciumOrMechanicsStateAdded: false;
      acceptedStateOrCheckpointTopologyChanged: false;
      exactProtocolIdentityIncludesAllFiveFactors: true;
    }>;
  }>;

export type MainWireNormalAdultFiveWallAorticOutflowIndependentActivationCohortWindkesselResearchRunV1 =
  Readonly<{
    configurationRole:
      "fixed-aortic-outflow-independent-activation-cohort-windkessel-arm";
    kuwProfile: MainWireVentricularLandWholeOrganKuwProfileV1;
    activationCohortProfile:
      MainWireVentricularLandActivationCohortProfileV1;
    complianceProfile: MainWireArterialCompliancePhysiologyProfileV1;
    placementProfile:
      MainWireAorticCharacteristicResistancePlacementProfileV1 | null;
    rootInertanceProfile: MainWireAorticRootInertanceResearchProfileV1 | null;
    calciumDriveParams: FiveWallNormalCalciumDriveParamsV1;
    periodicResult: MainWireNormalAdultFiveWallPeriodicResultV1;
    claim: Readonly<{
      sourceResearchRunnerOnly: true;
      independentCanonicalColdStart: true;
      warmStartApplied: false;
      genericParameterPatchAccepted: false;
      valveDiseaseBracketApplied: false;
      bloodVolumeChanged: false;
      aorticMaximumForwardEoaChanged: false;
      sourceFittedAeffChanged: false;
      sourceWholeOrganTrefChanged: false;
      localCellCalciumPulseChanged: false;
      ventricularLandStateCountPerWall: 18;
      calciumOrMechanicsStateAdded: true;
      acceptedStateOrCheckpointTopologyChanged: true;
      canonicalCheckpointCompatible: false;
      exactProtocolIdentityIncludesAllFiveFactors: true;
    }>;
  }>;

export type MainWireNormalAdultFiveWallAorticOutflowCalciumDecayWindkesselResearchRunV1 =
  Readonly<{
    configurationRole:
      "fixed-aortic-outflow-calcium-decay-windkessel-arm";
    calciumProfile: MainWireVentricularCalciumFixedAmplitudeDecayProfileV1;
    kuwProfile: MainWireVentricularLandWholeOrganKuwProfileV1;
    complianceProfile: MainWireArterialCompliancePhysiologyProfileV1;
    placementProfile:
      MainWireAorticCharacteristicResistancePlacementProfileV1 | null;
    rootInertanceProfile: MainWireAorticRootInertanceResearchProfileV1 | null;
    calciumDriveParams: FiveWallNormalCalciumDriveParamsV1;
    periodicResult: MainWireNormalAdultFiveWallPeriodicResultV1;
    claim: Readonly<{
      sourceResearchRunnerOnly: true;
      independentCanonicalColdStart: true;
      warmStartApplied: false;
      genericParameterPatchAccepted: false;
      valveDiseaseBracketApplied: false;
      bloodVolumeChanged: false;
      aorticMaximumForwardEoaChanged: false;
      sourceFittedAeffChanged: false;
      sourceWholeOrganTrefChanged: false;
      calciumOrMechanicsStateAdded: false;
      acceptedStateOrCheckpointTopologyChanged: false;
      exactProtocolIdentityIncludesAllFiveFactors: true;
    }>;
  }>;

export type MainWireNormalAdultFiveWallVentricularCalciumSourceTraceFitResearchRunV1 =
  Readonly<{
    configurationRole:
      "fixed-ventricular-calcium-source-trace-fit-research-profile";
    profile: MainWireVentricularCalciumSourceTraceFitProfileV1;
    calciumDriveParams: FiveWallNormalCalciumDriveParamsV1;
    periodicResult: MainWireNormalAdultFiveWallPeriodicResultV1;
    claim: Readonly<{
      sourceResearchRunnerOnly: true;
      independentCanonicalColdStart: true;
      warmStartApplied: false;
      genericParameterPatchAccepted: false;
      valveDiseaseBracketApplied: false;
      circulationRuntimeChanged: false;
      mechanicsProviderChanged: false;
      calciumOrMechanicsStateAdded: false;
      acceptedStateOrCheckpointTopologyChanged: false;
      exactProtocolIdentityIncludesCalciumParams: true;
    }>;
  }>;

export type MainWireNormalAdultFiveWallVentricularCalciumSourceTraceFitRecalibrationResearchRunV1 =
  Readonly<{
    configurationRole:
      "fixed-ventricular-calcium-source-trace-fit-recalibration-point";
    point: MainWireVentricularCalciumSourceTraceFitRecalibrationPointV1;
    calciumProfile: MainWireVentricularCalciumSourceTraceFitProfileV1;
    calciumDriveParams: FiveWallNormalCalciumDriveParamsV1;
    circulatoryLoadPoint: MainWireNormalAdultFiveWallCirculatoryLoadPointV1;
    ventricularMaterialPoint:
      MainWireNormalAdultVentricularMaterialResearchPointV1;
    stressedVenousVolumePoint:
      MainWireNormalAdultStressedVenousVolumeResearchPointV1;
    resolvedProviderIdentity: Readonly<{
      providerId: string;
      parameterSetId: string;
      parameterIdentityHash: string;
      stateSchemaVersion: number;
    }>;
    resolvedBloodVolumeIdentity:
      MainWireNormalAdultBloodVolumeOperatingPointIdentityV1;
    periodicResult: MainWireNormalAdultFiveWallPeriodicResultV1;
    claim: Readonly<{
      sourceResearchRunnerOnly: true;
      independentCanonicalColdStart: true;
      warmStartApplied: false;
      genericParameterPatchAccepted: false;
      oneFactorAtATime: true;
      ventricularCalciumProfileHeldFixedAcrossPoints: true;
      aorticValveAreaOrLawChanged: false;
      vascularUnstressedVolumesChanged: false;
      acceptedStateOrCheckpointTopologyChanged: false;
      exactProtocolIdentityIncludesAllResolvedOwners: true;
      parameterOptimizationOrPatientFit: false;
    }>;
  }>;

export type MainWireNormalAdultFiveWallVentricularCalciumSourceTraceFitRecalibrationCandidateResearchRunV1 =
  Readonly<{
    configurationRole:
      "fixed-ventricular-calcium-source-trace-fit-recalibration-candidate";
    candidate:
      MainWireVentricularCalciumSourceTraceFitRecalibrationCandidateV1;
    calciumProfile: MainWireVentricularCalciumSourceTraceFitProfileV1;
    calciumDriveParams: FiveWallNormalCalciumDriveParamsV1;
    circulatoryLoadPoint: MainWireNormalAdultFiveWallCirculatoryLoadPointV1;
    ventricularMaterialPoint:
      MainWireNormalAdultVentricularMaterialResearchPointV1;
    stressedVenousVolumePoint:
      MainWireNormalAdultStressedVenousVolumeResearchPointV1;
    resolvedProviderIdentity: Readonly<{
      providerId: string;
      parameterSetId: string;
      parameterIdentityHash: string;
      stateSchemaVersion: number;
    }>;
    resolvedBloodVolumeIdentity:
      MainWireNormalAdultBloodVolumeOperatingPointIdentityV1;
    periodicResult: MainWireNormalAdultFiveWallPeriodicResultV1;
    claim: Readonly<{
      sourceResearchRunnerOnly: true;
      independentCanonicalColdStart: true;
      warmStartApplied: false;
      genericParameterPatchAccepted: false;
      fixedCandidateOnly: true;
      ventricularCalciumProfileHeldFixedAcrossCandidates: true;
      aorticValveAreaOrLawChanged: false;
      vascularUnstressedVolumesChanged: false;
      acceptedStateOrCheckpointTopologyChanged: false;
      exactProtocolIdentityIncludesAllResolvedOwners: true;
      numericTargetOptimizationApplied: false;
      patientFitOrCanonicalAdoption: false;
    }>;
  }>;

export type MainWireNormalAdultFiveWallVentricularCalciumSourceTraceFitTrefPassiveResearchRunV1 =
  Readonly<{
    configurationRole:
      "fixed-ventricular-calcium-source-trace-fit-tref-passive-profile";
    profile: MainWireVentricularCalciumSourceTraceFitTrefPassiveProfileV1;
    mechanicsResearchInput: MainWireFiveWallMechanicsResearchInputsV1;
    calciumProfile: MainWireVentricularCalciumSourceTraceFitProfileV1;
    calciumDriveParams: FiveWallNormalCalciumDriveParamsV1;
    resolvedProviderIdentity: Readonly<{
      providerId: string;
      parameterSetId: string;
      parameterIdentityHash: string;
      stateSchemaVersion: number;
    }>;
    periodicResult: MainWireNormalAdultFiveWallPeriodicResultV1;
    claim: Readonly<{
      sourceResearchRunnerOnly: true;
      independentCanonicalColdStart: true;
      warmStartApplied: false;
      genericParameterPatchAccepted: false;
      fixedFactorialProfileOnly: true;
      ventricularCalciumProfileHeldFixedAcrossProfiles: true;
      circulationRuntimeChanged: false;
      fixedTotalBloodVolumeChanged: false;
      aorticValveAreaOrLawChanged: false;
      vascularUnstressedVolumesChanged: false;
      calciumOrMechanicsStateAdded: false;
      acceptedStateOrCheckpointTopologyChanged: false;
      exactProtocolIdentityIncludesAllResolvedOwners: true;
      numericTargetOptimizationApplied: false;
      patientFitOrCanonicalAdoption: false;
    }>;
  }>;

export type MainWireNormalAdultFiveWallVentricularCalciumSourceTraceFitTrefPassiveDistortionResearchRunV1 =
  Readonly<{
    configurationRole:
      "fixed-ventricular-calcium-source-trace-fit-tref-passive-distortion-candidate";
    candidate:
      MainWireVentricularCalciumSourceTraceFitTrefPassiveDistortionCandidateV1;
    mechanicsResearchInput: MainWireFiveWallMechanicsResearchInputsV1;
    calciumProfile: MainWireVentricularCalciumSourceTraceFitProfileV1;
    calciumDriveParams: FiveWallNormalCalciumDriveParamsV1;
    resolvedProviderIdentity: Readonly<{
      providerId: string;
      parameterSetId: string;
      parameterIdentityHash: string;
      stateSchemaVersion: number;
    }>;
    periodicResult: MainWireNormalAdultFiveWallPeriodicResultV1;
    claim: Readonly<{
      sourceResearchRunnerOnly: true;
      independentCanonicalColdStart: true;
      warmStartApplied: false;
      genericParameterPatchAccepted: false;
      fixedPostParetoCandidateOnly: true;
      pairedBaselineChangesOnlyExistingLandDistortionTransient: true;
      ventricularCalciumProfileHeldFixedAcrossCandidates: true;
      circulationRuntimeChanged: false;
      fixedTotalBloodVolumeChanged: false;
      aorticValveAreaOrLawChanged: false;
      vascularUnstressedVolumesChanged: false;
      calciumOrMechanicsStateAdded: false;
      acceptedStateOrCheckpointTopologyChanged: false;
      exactProtocolIdentityIncludesAllResolvedOwners: true;
      numericTargetOptimizationApplied: false;
      patientFitOrCanonicalAdoption: false;
    }>;
  }>;

export type MainWireNormalAdultFiveWallVentricularCalciumSourceTraceFitShortlistLoadResearchRunV1 =
  Readonly<{
    configurationRole:
      "fixed-ventricular-calcium-source-trace-fit-shortlist-load-envelope-run";
    arm: MainWireVentricularCalciumSourceTraceFitShortlistArmV1;
    context:
      MainWireVentricularCalciumSourceTraceFitShortlistLoadContextV1;
    mechanicsResearchInput: MainWireFiveWallMechanicsResearchInputsV1 | null;
    calciumDriveParams: FiveWallNormalCalciumDriveParamsV1;
    circulatoryLoadPoint: MainWireNormalAdultFiveWallCirculatoryLoadPointV1;
    stressedVenousVolumePoint:
      MainWireNormalAdultStressedVenousVolumeResearchPointV1;
    resolvedProviderIdentity: Readonly<{
      providerId: string;
      parameterSetId: string;
      parameterIdentityHash: string;
      stateSchemaVersion: number;
    }>;
    resolvedBloodVolumeIdentity:
      MainWireNormalAdultBloodVolumeOperatingPointIdentityV1;
    periodicResult: MainWireNormalAdultFiveWallPeriodicResultV1;
    claim: Readonly<{
      sourceResearchRunnerOnly: true;
      independentCanonicalColdStart: true;
      warmStartApplied: false;
      genericParameterPatchAccepted: false;
      fixedShortlistAndLoadContextOnly: true;
      loadContextIsRobustnessCoordinateNotCalibrationKnob: true;
      canonicalControlUsesCanonicalCalciumAndMechanics: true;
      shortlistUsesCommonSourceCalcium: true;
      shortlistUsesOnlyPredeclaredMechanicsComposition: true;
      aorticValveAreaOrLawChanged: false;
      pulmonaryValveAreaOrLawChanged: false;
      vascularUnstressedVolumesChanged: false;
      calciumOrMechanicsStateAdded: false;
      acceptedStateOrCheckpointTopologyChanged: false;
      exactProtocolIdentityIncludesAllResolvedOwners: true;
      numericTargetOptimizationApplied: false;
      patientFitOrCanonicalAdoption: false;
    }>;
  }>;

export type MainWireNormalAdultFiveWallVentricularCalciumDelayedMixtureResearchRunV1 =
  Readonly<{
    configurationRole:
      "fixed-ventricular-calcium-delayed-mixture-research-profile";
    profile: MainWireVentricularCalciumDelayedMixtureProfileV1;
    calciumDriveParams: FiveWallNormalCalciumDriveParamsV1;
    periodicResult: MainWireNormalAdultFiveWallPeriodicResultV1;
    claim: Readonly<{
      sourceResearchRunnerOnly: true;
      independentCanonicalColdStart: true;
      warmStartApplied: false;
      genericParameterPatchAccepted: false;
      valveDiseaseBracketApplied: false;
      circulationRuntimeChanged: false;
      mechanicsProviderChanged: false;
      calciumOrMechanicsStateAdded: false;
      acceptedStateOrCheckpointTopologyChanged: false;
      exactProtocolIdentityIncludesCalciumParams: true;
    }>;
  }>;

export type MainWireNormalAdultFiveWallVentricularCalciumPeakLockedTailResearchRunV1 =
  Readonly<{
    configurationRole:
      "fixed-ventricular-calcium-peak-locked-tail-research-profile";
    profile: MainWireVentricularCalciumPeakLockedTailProfileV1;
    calciumDriveParams: FiveWallNormalCalciumDriveParamsV1;
    periodicResult: MainWireNormalAdultFiveWallPeriodicResultV1;
    claim: Readonly<{
      sourceResearchRunnerOnly: true;
      independentCanonicalColdStart: true;
      warmStartApplied: false;
      genericParameterPatchAccepted: false;
      valveDiseaseBracketApplied: false;
      circulationRuntimeChanged: false;
      mechanicsProviderChanged: false;
      calciumOrMechanicsStateAdded: false;
      acceptedStateOrCheckpointTopologyChanged: false;
      exactProtocolIdentityIncludesCalciumParams: true;
    }>;
  }>;

export type MainWireNormalAdultFiveWallVentricularCalciumDelayedMixtureLoadResearchRunV1 =
  Readonly<{
    configurationRole:
      "fixed-ventricular-calcium-delayed-mixture-load-research-point";
    profile: MainWireVentricularCalciumDelayedMixtureProfileV1;
    loadPoint: MainWireNormalAdultFiveWallCirculatoryLoadPointV1;
    calciumDriveParams: FiveWallNormalCalciumDriveParamsV1;
    periodicResult: MainWireNormalAdultFiveWallPeriodicResultV1;
    claim: Readonly<{
      sourceResearchRunnerOnly: true;
      independentCanonicalColdStart: true;
      warmStartApplied: false;
      genericParameterPatchAccepted: false;
      valveDiseaseBracketApplied: false;
      mechanicsProviderChanged: false;
      calciumOrMechanicsStateAdded: false;
      acceptedStateOrCheckpointTopologyChanged: false;
      exactProtocolIdentityIncludesCalciumAndLoadParams: true;
    }>;
  }>;

export type MainWireNormalAdultFiveWallVentricularCalciumDelayedMixtureCompliancePartitionResearchRunV1 =
  Readonly<{
    configurationRole:
      "fixed-delayed-mixture-compliance-partition-research-arm";
    calciumProfile: MainWireVentricularCalciumDelayedMixtureProfileV1;
    compliancePartitionProfile:
      MainWireAorticCompliancePartitionResearchProfileV1;
    capacitySnapshot:
      MainWireAorticCompliancePartitionCapacitySnapshotV1;
    calciumDriveParams: FiveWallNormalCalciumDriveParamsV1;
    periodicResult: MainWireNormalAdultFiveWallPeriodicResultV1;
    claim: Readonly<{
      sourceResearchRunnerOnly: true;
      independentCanonicalColdStart: true;
      warmStartApplied: false;
      genericParameterPatchAccepted: false;
      valveDiseaseBracketApplied: false;
      mechanicsProviderChanged: false;
      calciumOrMechanicsStateAdded: false;
      aorticValveConstitutiveLawChanged: false;
      globalArterialStiffnessChanged: false;
      aorticRootPlusSystemicArteryVsSumPreservedExactly: true;
      acceptedStateOrCheckpointTopologyChanged: false;
      exactProtocolIdentityIncludesCalciumAndPartitionProfiles: true;
    }>;
  }>;

export type MainWireNormalAdultFiveWallMacroPhysiologyResearchRunV1 = Readonly<{
  configurationRole: "fixed-research-point";
  point: MainWireNormalAdultFiveWallMacroPhysiologyPointV1;
  materialPoint: MainWireNormalAdultVentricularMaterialResearchPointV1;
  stressedVenousVolumePoint:
    MainWireNormalAdultStressedVenousVolumeResearchPointV1;
  resolvedProviderIdentity: Readonly<{
    providerId: string;
    parameterSetId: string;
    parameterIdentityHash: string;
    stateSchemaVersion: number;
  }>;
  resolvedBloodVolumeIdentity:
    MainWireNormalAdultBloodVolumeOperatingPointIdentityV1;
  periodicResult: MainWireNormalAdultFiveWallPeriodicResultV1;
  claim: Readonly<{
    sourceResearchRunnerOnly: true;
    independentCanonicalColdStart: true;
    warmStartApplied: false;
    genericParameterPatchAccepted: false;
    wholeLoopDirectionIsDescriptiveNotAcceptance: true;
  }>;
}>;

export type MainWireNormalAdultFiveWallRetainedBeatV1 = Readonly<{
  beatIndex: number;
  startTimeSec: number;
  endTimeSec: number;
  samples: readonly MainWireNormalAdultFiveWallDiagnosticSampleV2[];
}>;

export type MainWireNormalAdultFiveWallPeriodicTerminationReasonV1 =
  | "period1-converged"
  | "period2-suspect"
  | "maximum-beats-reached"
  | "step-failure";

export type MainWireNormalAdultFiveWallPeriodicResultV1 = Readonly<{
  experimentId:
    typeof MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_STEADY_V1_ID;
  mode: "canonical";
  protocolIdentity: MainWireNormalAdultFiveWallPeriodicProtocolIdentityV1;
  protocolIdentityHash: string;
  protocolComponentHashes:
    MainWireNormalAdultFiveWallPeriodicProtocolComponentHashesV1;
  /** Deterministic construction readback; intentionally excluded from hashes. */
  bloodVolumeOperatingPointAudit:
    MainWireNormalAdultBloodVolumeOperatingPointAuditV1;
  laSlsMode: MainWireNormalAdultLaSlsModeV1;
  pericardiumMode: MainWireCommonPericardiumModeV1;
  pericardiumCase: MainWireNormalAdultCommonPericardiumCaseV1;
  pericardiumParameterSetId: string;
  valveResearchInput: MainWireFourValveDiseaseResearchInputV1;
  initialization: MainWireNormalAdultFiveWallPeriodicInitializationV1;
  dtSec: number;
  stepsPerBeat: number;
  requestedMaximumBeatCount: number;
  completedBeatCount: number;
  terminationReason:
    MainWireNormalAdultFiveWallPeriodicTerminationReasonV1;
  integrationCompletedWithoutFailure: boolean;
  periodicSteadyStateClaimed: boolean;
  period2OrbitSuspected: boolean;
  periodicity: MainWireFiveWallPeriodicClassificationV1;
  beatClosure: readonly MainWireFiveWallPeriodicBeatObservationV1[];
  retainedCompleteBeats:
    readonly MainWireNormalAdultFiveWallRetainedBeatV1[];
  retainedPartialBeat:
    readonly MainWireNormalAdultFiveWallDiagnosticSampleV2[];
  terminalCycleBoundaryWarmStart:
    MainWireNormalAdultFiveWallCycleWarmStartV1 | null;
  aorticValveLocalInertanceResearchAudit?: Readonly<{
    profileId: MainWireAorticValveLocalInertanceProfileV1["profileId"];
    initialAcceptedFlowMlPerSec: 0;
    terminalAcceptedFlowMlPerSec: number;
    cycleBoundaryAcceptedFlowsMlPerSec: readonly number[];
    period1BoundaryClosureSatisfied: boolean;
    period2BoundaryClosureSatisfied: boolean;
    externalFlowPromotedOnlyAfterSuccessfulCoupledStep: true;
    canonicalAcceptedStateOrCheckpointChanged: false;
    standardWarmStartEmitted: false;
  }>;
  failure: null | Readonly<{
    beatIndex: number;
    stepWithinBeat: number;
    globalStepIndex: number;
    timeSec: number;
    message: string;
    reason: MainWireFiveWallNonCoronaryStepFailureV1<unknown>["reason"];
    circulationFailureReason:
      MainWireFiveWallNonCoronaryStepFailureV1<unknown>[
        "circulationFailureReason"
      ];
    finalizationFailureStage:
      MainWireFiveWallNonCoronaryStepFailureV1<unknown>[
        "finalizationFailureStage"
      ];
    lastAcceptedCandidateNodeVolumesMl: Readonly<Record<string, number>>;
    circulationDiagnostics: NonCoronaryCirculationTrialDiagnosticsV1;
  }>;
  initializationAudit: Readonly<{
    canonicalTotalBloodVolumeMl: number;
    initializedTotalBloodVolumeMl: number;
    totalBloodVolumeDifferenceMl: number;
    chamberVolumesChanged: boolean;
    dynamicEdgeFlowsChanged: boolean;
    valveOpeningStatesChanged: boolean;
    mechanicsColdInputChanged: boolean;
    mechanicsColdStateFingerprintChanged: boolean;
    transferredVolumeMl: number;
    sourceNode: "PVen" | null;
    destinationNode: "PVein" | null;
    pulmonaryNodeVolumeDeltaMl: Readonly<{
      PVen: number;
      PVein: number;
    }>;
    warmStartSourceProtocolIdentityHash: string | null;
    warmStartTargetProtocolIdentityHash: string | null;
    warmStartSourcePericardiumStableHash: string | null;
    warmStartTargetPericardiumStableHash: string | null;
    warmStartProtocolDifference:
      | "not-a-warm-start"
      | "none"
      | "common-pericardium-only";
  }>;
  policy: typeof MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_POLICY_V1;
  claim: Readonly<{
    heartRateBpm: number;
    circulation: "main-wire-derived-noncoronary-experimental";
    ordinaryBeatIterationOnly: true;
    shootingOrAndersonAccelerationApplied: false;
    parameterSearch: false;
    initializationVariantChangesRuntimeOrMaterialParameters: false;
    pulmonaryRedistributionIsInitialConditionBasinAuditOnly: true;
    samePeriodicOrbitAcrossInitializationsClaimed: false;
    retainedSamplesAreAtMostTheLastThreeCompleteBeats: true;
    smoothingAppliedToSamples: false;
    pericardialConstraintInterfaceIncluded: true;
    pericardialConstraintEnabled: boolean;
    pericardialConstraintMayBeSlackAtHealthyBaseline: true;
    warmStartIsInitialConditionOnly: true;
    valveDiseaseResearchInputIsProtocolParameterNotAcceptedState: true;
    valveDiseaseBracketIsClinicalDiagnosis: false;
  }>;
}>;

type AcceptedState = MainWireFiveWallNonCoronaryAcceptedStateV1<
  MainWireNormalAdultFiveWallMechanicsStateV1
>;

type ResolvedPeriodicAssemblyV1 = Readonly<{
  provider: MainWireNormalAdultFiveWallProviderV1;
  bloodVolumeOperatingPoint:
    MainWireNormalAdultBloodVolumeOperatingPointResolvedV1;
  calciumDriveParams?: FiveWallNormalCalciumDriveParamsV1;
}>;

type MainWireNormalAdultFiveWallPeriodicExecutionControlV1 = Readonly<{
  minimumCompletedBeatCountBeforePeriodicTermination: number;
}>;

const STANDARD_WARM_START_CYCLE_LENGTH_SEC = 1;

export function runMainWireNormalAdultFiveWallPeriodicSteadyV1(
  options: MainWireNormalAdultFiveWallPeriodicOptionsV1,
): MainWireNormalAdultFiveWallPeriodicResultV1 {
  const runtime = normalAdultMainWireRuntimeV1(
    options.valveDiseaseBracketIds,
  );
  return runMainWireNormalAdultFiveWallPeriodicSteadyResolvedRuntimeV1(
    options,
    runtime,
  );
}

/** Fixed-ID-only AoV constitutive ablation from an independent cold start. */
export function runMainWireNormalAdultFiveWallAorticValveResearchProfileV1(
  options: MainWireNormalAdultFiveWallAorticValveResearchOptionsV1,
  profileId: MainWireAorticValveResearchProfileIdV1,
): MainWireNormalAdultFiveWallAorticValveResearchRunV1 {
  assertExactAorticValveResearchOptions(options);
  const profile = resolveMainWireAorticValveResearchProfileV1(profileId);
  const baselineRuntime = normalAdultMainWireRuntimeV1();
  const runtime: NonCoronaryCirculationRuntimeParamsV1 = Object.freeze({
    ...baselineRuntime,
    aorticValveResearchProfile: profile,
  });
  const periodicResult =
    runMainWireNormalAdultFiveWallPeriodicSteadyResolvedRuntimeV1(
      Object.freeze({
        dtSec: options.dtSec,
        ...(options.maximumBeatCount === undefined
          ? {}
          : { maximumBeatCount: options.maximumBeatCount }),
        laSlsMode: "on" as const,
        pericardiumMode: "on" as const,
        pericardiumCase: "healthy-slack" as const,
        initialization: "canonical" as const,
        valveDiseaseBracketIds: Object.freeze([]),
      }),
      runtime,
    );
  return Object.freeze({
    configurationRole: "fixed-aortic-valve-research-profile" as const,
    profile,
    periodicResult,
    claim: Object.freeze({
      sourceResearchRunnerOnly: true as const,
      independentCanonicalColdStart: true as const,
      warmStartApplied: false as const,
      genericParameterPatchAccepted: false as const,
      valveDiseaseBracketApplied: false as const,
      exactRuntimeIdentityIncludesProfile: true as const,
    }),
  });
}

/** Fixed AoV-area identifiability control from an independent cold start. */
export function runMainWireNormalAdultFiveWallAorticValveAreaControlV1(
  options: MainWireNormalAdultFiveWallAorticValveResearchOptionsV1,
  pointId: MainWireAorticValveAreaControlPointIdV1,
): MainWireNormalAdultFiveWallAorticValveAreaControlRunV1 {
  assertExactAorticValveResearchOptions(options);
  const point = resolveMainWireAorticValveAreaControlPointV1(pointId);
  const areaInputs = Object.freeze({
    ...MAIN_WIRE_FOUR_VALVE_DEFAULT_AREA_INPUTS_V1,
    AoV: Object.freeze({
      ...MAIN_WIRE_FOUR_VALVE_DEFAULT_AREA_INPUTS_V1.AoV,
      maximumForwardEoaCm2: point.maximumForwardEoaCm2,
    }),
  }) satisfies MainWireFourValveAreaInputsV1;
  const valveResearchInput =
    createMainWireFourValveContinuousAreaResearchInputV1(areaInputs);
  const baselineRuntime = normalAdultMainWireRuntimeV1();
  const runtime: NonCoronaryCirculationRuntimeParamsV1 = Object.freeze({
    ...baselineRuntime,
    valveResearchInput,
  });
  const periodicResult =
    runMainWireNormalAdultFiveWallPeriodicSteadyResolvedRuntimeV1(
      Object.freeze({
        dtSec: options.dtSec,
        ...(options.maximumBeatCount === undefined
          ? {}
          : { maximumBeatCount: options.maximumBeatCount }),
        laSlsMode: "on" as const,
        pericardiumMode: "on" as const,
        pericardiumCase: "healthy-slack" as const,
        initialization: "canonical" as const,
        valveDiseaseBracketIds: Object.freeze([]),
      }),
      runtime,
    );
  if (
    periodicResult.valveResearchInput.parameterIdentityHash
      !== valveResearchInput.parameterIdentityHash
  ) throw new Error("AoV area control drifted from periodic protocol identity");
  return Object.freeze({
    configurationRole:
      "fixed-aortic-valve-area-identifiability-control" as const,
    point,
    periodicResult,
    claim: Object.freeze({
      sourceResearchRunnerOnly: true as const,
      independentCanonicalColdStart: true as const,
      warmStartApplied: false as const,
      genericParameterPatchAccepted: false as const,
      continuousValveAreaResearchInputUsed: true as const,
      onlyAorticMaximumForwardEoaChangedAcrossPoints: true as const,
      aorticValveConstitutiveLawChanged: false as const,
      acceptedStateOrCheckpointTopologyChanged: false as const,
      exactRuntimeIdentityIncludesAreaInput: true as const,
    }),
  });
}

/** Fixed 2x2 ventricular-driver/Ao_SA-inertance arm from a cold start. */
export function runMainWireNormalAdultFiveWallAorticOutflowResearchArmV1(
  options: MainWireNormalAdultFiveWallAorticOutflowResearchOptionsV1,
  armId: MainWireAorticOutflowDriverRootAblationArmIdV1,
): MainWireNormalAdultFiveWallAorticOutflowResearchRunV1 {
  assertExactAorticOutflowResearchOptions(options);
  const arm = resolveMainWireAorticOutflowDriverRootAblationArmV1(armId);
  const baselineRuntime = normalAdultMainWireRuntimeV1();
  const aorticRootInertanceProfile = arm.aorticRootInertanceProfileId === null
    ? null
    : resolveMainWireAorticRootInertanceResearchProfileV1(
      arm.aorticRootInertanceProfileId,
    );
  const runtime: NonCoronaryCirculationRuntimeParamsV1 =
    aorticRootInertanceProfile === null
      ? baselineRuntime
      : Object.freeze({
        ...baselineRuntime,
        aorticRootInertanceResearchProfile: aorticRootInertanceProfile,
      });
  const provider = createFixedResearchMainWireNormalAdultFiveWallProviderV1(
    arm.ventricularMaterialPointId,
  );
  const materialPoint =
    resolveMainWireNormalAdultVentricularMaterialResearchPointV1(
      arm.ventricularMaterialPointId,
    );
  const bloodVolumeOperatingPoint =
    resolveMainWireNormalAdultBloodVolumeOperatingPointV1(runtime);
  const periodicResult =
    runMainWireNormalAdultFiveWallPeriodicSteadyResolvedRuntimeV1(
      Object.freeze({
        dtSec: options.dtSec,
        ...(options.maximumBeatCount === undefined
          ? {}
          : { maximumBeatCount: options.maximumBeatCount }),
        laSlsMode: "on" as const,
        pericardiumMode: "on" as const,
        pericardiumCase: "healthy-slack" as const,
        initialization: "canonical" as const,
        valveDiseaseBracketIds: Object.freeze([]),
      }),
      runtime,
      Object.freeze({ provider, bloodVolumeOperatingPoint }),
    );
  return Object.freeze({
    configurationRole:
      "fixed-aortic-outflow-driver-root-ablation-arm" as const,
    arm,
    materialPoint,
    aorticRootInertanceProfile,
    periodicResult,
    claim: Object.freeze({
      sourceResearchRunnerOnly: true as const,
      independentCanonicalColdStart: true as const,
      warmStartApplied: false as const,
      genericParameterPatchAccepted: false as const,
      valveDiseaseBracketApplied: false as const,
      aorticValveConstitutiveLawChanged: false as const,
      acceptedStateOrCheckpointTopologyChanged: false as const,
      exactRuntimeIdentityIncludesRootProfileWhenActive: true as const,
    }),
  });
}

/** Fixed 2x2 Land-length-dependence/Ao_SA-resistance arm from a cold start. */
export function runMainWireNormalAdultFiveWallAorticOutflowLengthDependenceRootResistanceResearchArmV1(
  options: MainWireNormalAdultFiveWallAorticOutflowResearchOptionsV1,
  armId: MainWireAorticOutflowLengthDependenceRootResistanceArmIdV1,
): MainWireNormalAdultFiveWallAorticOutflowLengthDependenceRootResistanceResearchRunV1 {
  assertExactAorticOutflowResearchOptions(options);
  const arm =
    resolveMainWireAorticOutflowLengthDependenceRootResistanceArmV1(armId);
  const baselineRuntime = normalAdultMainWireRuntimeV1();
  const aorticRootResistanceProfile =
    arm.aorticRootResistanceProfileId === null
      ? null
      : resolveMainWireAorticRootResistanceResearchProfileV1(
        arm.aorticRootResistanceProfileId,
      );
  const runtime: NonCoronaryCirculationRuntimeParamsV1 =
    aorticRootResistanceProfile === null
      ? baselineRuntime
      : Object.freeze({
        ...baselineRuntime,
        aorticRootResistanceResearchProfile: aorticRootResistanceProfile,
      });
  const provider = createFixedResearchMainWireNormalAdultFiveWallProviderV1(
    arm.ventricularMaterialPointId,
  );
  const materialPoint =
    resolveMainWireNormalAdultVentricularMaterialResearchPointV1(
      arm.ventricularMaterialPointId,
    );
  const bloodVolumeOperatingPoint =
    resolveMainWireNormalAdultBloodVolumeOperatingPointV1(runtime);
  const periodicResult =
    runMainWireNormalAdultFiveWallPeriodicSteadyResolvedRuntimeV1(
      Object.freeze({
        dtSec: options.dtSec,
        ...(options.maximumBeatCount === undefined
          ? {}
          : { maximumBeatCount: options.maximumBeatCount }),
        laSlsMode: "on" as const,
        pericardiumMode: "on" as const,
        pericardiumCase: "healthy-slack" as const,
        initialization: "canonical" as const,
        valveDiseaseBracketIds: Object.freeze([]),
      }),
      runtime,
      Object.freeze({ provider, bloodVolumeOperatingPoint }),
    );
  return Object.freeze({
    configurationRole:
      "fixed-aortic-outflow-length-dependence-root-resistance-ablation-arm" as const,
    arm,
    materialPoint,
    aorticRootResistanceProfile,
    periodicResult,
    claim: Object.freeze({
      sourceResearchRunnerOnly: true as const,
      independentCanonicalColdStart: true as const,
      warmStartApplied: false as const,
      genericParameterPatchAccepted: false as const,
      valveDiseaseBracketApplied: false as const,
      calciumDriveChanged: false as const,
      aorticValveConstitutiveLawChanged: false as const,
      acceptedStateOrCheckpointTopologyChanged: false as const,
      exactRuntimeIdentityIncludesRootProfileWhenActive: true as const,
    }),
  });
}

/** Fixed Land beta0/beta1 envelope point from a canonical cold start. */
export function runMainWireNormalAdultFiveWallVentricularLengthDependenceResearchV1(
  options: MainWireNormalAdultFiveWallAorticOutflowResearchOptionsV1,
  pointId: MainWireNormalAdultVentricularLengthDependenceResearchPointIdV1,
): MainWireNormalAdultFiveWallVentricularLengthDependenceResearchRunV1 {
  assertExactAorticOutflowResearchOptions(options);
  const runtime = normalAdultMainWireRuntimeV1();
  const provider = createFixedResearchMainWireNormalAdultFiveWallProviderV1(
    pointId,
  );
  const materialPoint =
    resolveMainWireNormalAdultVentricularMaterialResearchPointV1(pointId);
  const bloodVolumeOperatingPoint =
    resolveMainWireNormalAdultBloodVolumeOperatingPointV1(runtime);
  const periodicResult =
    runMainWireNormalAdultFiveWallPeriodicSteadyResolvedRuntimeV1(
      Object.freeze({
        dtSec: options.dtSec,
        ...(options.maximumBeatCount === undefined
          ? {}
          : { maximumBeatCount: options.maximumBeatCount }),
        laSlsMode: "on" as const,
        pericardiumMode: "on" as const,
        pericardiumCase: "healthy-slack" as const,
        initialization: "canonical" as const,
        valveDiseaseBracketIds: Object.freeze([]),
      }),
      runtime,
      Object.freeze({ provider, bloodVolumeOperatingPoint }),
    );
  return Object.freeze({
    configurationRole:
      "fixed-ventricular-land-length-dependence-research-point" as const,
    materialPoint,
    periodicResult,
    claim: Object.freeze({
      sourceResearchRunnerOnly: true as const,
      independentCanonicalColdStart: true as const,
      warmStartApplied: false as const,
      genericParameterPatchAccepted: false as const,
      valveDiseaseBracketApplied: false as const,
      circulationRuntimeChanged: false as const,
      calciumDriveChanged: false as const,
      aorticValveConstitutiveLawChanged: false as const,
      acceptedStateOrCheckpointTopologyChanged: false as const,
    }),
  });
}

/** Fixed 2x2 Land length/velocity-dependence arm from a canonical cold start. */
export function runMainWireNormalAdultFiveWallAorticOutflowLengthVelocityResearchArmV1(
  options: MainWireNormalAdultFiveWallAorticOutflowResearchOptionsV1,
  armId: MainWireAorticOutflowLengthVelocityArmIdV1,
): MainWireNormalAdultFiveWallAorticOutflowLengthVelocityResearchRunV1 {
  assertExactAorticOutflowResearchOptions(options);
  const arm = resolveMainWireAorticOutflowLengthVelocityArmV1(armId);
  const runtime = normalAdultMainWireRuntimeV1();
  const provider = createFixedResearchMainWireNormalAdultFiveWallProviderV1(
    arm.ventricularMaterialPointId,
  );
  const materialPoint =
    resolveMainWireNormalAdultVentricularMaterialResearchPointV1(
      arm.ventricularMaterialPointId,
    );
  const bloodVolumeOperatingPoint =
    resolveMainWireNormalAdultBloodVolumeOperatingPointV1(runtime);
  const periodicResult =
    runMainWireNormalAdultFiveWallPeriodicSteadyResolvedRuntimeV1(
      Object.freeze({
        dtSec: options.dtSec,
        ...(options.maximumBeatCount === undefined
          ? {}
          : { maximumBeatCount: options.maximumBeatCount }),
        laSlsMode: "on" as const,
        pericardiumMode: "on" as const,
        pericardiumCase: "healthy-slack" as const,
        initialization: "canonical" as const,
        valveDiseaseBracketIds: Object.freeze([]),
      }),
      runtime,
      Object.freeze({ provider, bloodVolumeOperatingPoint }),
    );
  return Object.freeze({
    configurationRole:
      "fixed-aortic-outflow-length-velocity-ablation-arm" as const,
    arm,
    materialPoint,
    periodicResult,
    claim: Object.freeze({
      sourceResearchRunnerOnly: true as const,
      independentCanonicalColdStart: true as const,
      warmStartApplied: false as const,
      genericParameterPatchAccepted: false as const,
      valveDiseaseBracketApplied: false as const,
      circulationRuntimeChanged: false as const,
      calciumDriveChanged: false as const,
      aorticValveConstitutiveLawChanged: false as const,
      acceptedStateOrCheckpointTopologyChanged: false as const,
    }),
  });
}

/** Fixed 2x2 Land distortion-amplitude/recovery research arm. */
export function runMainWireNormalAdultFiveWallAorticOutflowDistortionTransientResearchArmV1(
  options: MainWireNormalAdultFiveWallAorticOutflowResearchOptionsV1,
  armId: MainWireAorticOutflowDistortionTransientArmIdV1,
): MainWireNormalAdultFiveWallAorticOutflowDistortionTransientResearchRunV1 {
  assertExactAorticOutflowResearchOptions(options);
  const arm = resolveMainWireAorticOutflowDistortionTransientArmV1(armId);
  const runtime = normalAdultMainWireRuntimeV1();
  const provider = createFixedResearchMainWireNormalAdultFiveWallProviderV1(
    arm.ventricularMaterialPointId,
  );
  const materialPoint =
    resolveMainWireNormalAdultVentricularMaterialResearchPointV1(
      arm.ventricularMaterialPointId,
    );
  const bloodVolumeOperatingPoint =
    resolveMainWireNormalAdultBloodVolumeOperatingPointV1(runtime);
  const periodicResult =
    runMainWireNormalAdultFiveWallPeriodicSteadyResolvedRuntimeV1(
      Object.freeze({
        dtSec: options.dtSec,
        ...(options.maximumBeatCount === undefined
          ? {}
          : { maximumBeatCount: options.maximumBeatCount }),
        laSlsMode: "on" as const,
        pericardiumMode: "on" as const,
        pericardiumCase: "healthy-slack" as const,
        initialization: "canonical" as const,
        valveDiseaseBracketIds: Object.freeze([]),
      }),
      runtime,
      Object.freeze({ provider, bloodVolumeOperatingPoint }),
    );
  return Object.freeze({
    configurationRole:
      "fixed-aortic-outflow-distortion-transient-ablation-arm" as const,
    arm,
    materialPoint,
    periodicResult,
    claim: Object.freeze({
      sourceResearchRunnerOnly: true as const,
      independentCanonicalColdStart: true as const,
      warmStartApplied: false as const,
      genericParameterPatchAccepted: false as const,
      valveDiseaseBracketApplied: false as const,
      circulationRuntimeChanged: false as const,
      calciumDriveChanged: false as const,
      aorticValveConstitutiveLawChanged: false as const,
      acceptedStateOrCheckpointTopologyChanged: false as const,
    }),
  });
}

/** Fixed common-ventricular Land Aeff amplitude envelope. */
export function runMainWireNormalAdultFiveWallAorticOutflowVelocityDistortionAmplitudeResearchArmV1(
  options: MainWireNormalAdultFiveWallAorticOutflowResearchOptionsV1,
  armId: MainWireAorticOutflowVelocityDistortionAmplitudeArmIdV1,
): MainWireNormalAdultFiveWallAorticOutflowVelocityDistortionAmplitudeResearchRunV1 {
  assertExactAorticOutflowResearchOptions(options);
  const arm =
    resolveMainWireAorticOutflowVelocityDistortionAmplitudeArmV1(armId);
  const runtime = normalAdultMainWireRuntimeV1();
  const provider = createFixedResearchMainWireNormalAdultFiveWallProviderV1(
    arm.ventricularMaterialPointId,
  );
  const materialPoint =
    resolveMainWireNormalAdultVentricularMaterialResearchPointV1(
      arm.ventricularMaterialPointId,
    );
  const bloodVolumeOperatingPoint =
    resolveMainWireNormalAdultBloodVolumeOperatingPointV1(runtime);
  const periodicResult =
    runMainWireNormalAdultFiveWallPeriodicSteadyResolvedRuntimeV1(
      Object.freeze({
        dtSec: options.dtSec,
        ...(options.maximumBeatCount === undefined
          ? {}
          : { maximumBeatCount: options.maximumBeatCount }),
        laSlsMode: "on" as const,
        pericardiumMode: "on" as const,
        pericardiumCase: "healthy-slack" as const,
        initialization: "canonical" as const,
        valveDiseaseBracketIds: Object.freeze([]),
      }),
      runtime,
      Object.freeze({ provider, bloodVolumeOperatingPoint }),
    );
  return Object.freeze({
    configurationRole:
      "fixed-aortic-outflow-velocity-distortion-amplitude-arm" as const,
    arm,
    materialPoint,
    periodicResult,
    claim: Object.freeze({
      sourceResearchRunnerOnly: true as const,
      independentCanonicalColdStart: true as const,
      warmStartApplied: false as const,
      genericParameterPatchAccepted: false as const,
      valveDiseaseBracketApplied: false as const,
      circulationRuntimeChanged: false as const,
      calciumDriveChanged: false as const,
      aorticValveConstitutiveLawChanged: false as const,
      acceptedStateOrCheckpointTopologyChanged: false as const,
    }),
  });
}

/** Fixed Aeff-by-stressed-venous-volume factorial arm. */
export function runMainWireNormalAdultFiveWallAorticOutflowVelocityDistortionPreloadResearchArmV1(
  options: MainWireNormalAdultFiveWallAorticOutflowResearchOptionsV1,
  armId: MainWireAorticOutflowVelocityDistortionPreloadArmIdV1,
): MainWireNormalAdultFiveWallAorticOutflowVelocityDistortionPreloadResearchRunV1 {
  assertExactAorticOutflowResearchOptions(options);
  const arm = resolveMainWireAorticOutflowVelocityDistortionPreloadArmV1(
    armId,
  );
  const runtime = normalAdultMainWireRuntimeV1();
  const provider = createFixedResearchMainWireNormalAdultFiveWallProviderV1(
    arm.ventricularMaterialPointId,
  );
  const materialPoint =
    resolveMainWireNormalAdultVentricularMaterialResearchPointV1(
      arm.ventricularMaterialPointId,
    );
  const bloodVolume = resolveMainWireNormalAdultBloodVolumeResearchPointV1(
    runtime,
    arm.stressedVenousVolumePointId,
  );
  const periodicResult =
    runMainWireNormalAdultFiveWallPeriodicSteadyResolvedRuntimeV1(
      Object.freeze({
        dtSec: options.dtSec,
        ...(options.maximumBeatCount === undefined
          ? {}
          : { maximumBeatCount: options.maximumBeatCount }),
        laSlsMode: "on" as const,
        pericardiumMode: "on" as const,
        pericardiumCase: "healthy-slack" as const,
        initialization: "canonical" as const,
        valveDiseaseBracketIds: Object.freeze([]),
      }),
      runtime,
      Object.freeze({
        provider,
        bloodVolumeOperatingPoint: bloodVolume.operatingPoint,
      }),
    );
  return Object.freeze({
    configurationRole:
      "fixed-aortic-outflow-velocity-distortion-preload-arm" as const,
    arm,
    materialPoint,
    stressedVenousVolumePoint: bloodVolume.point,
    periodicResult,
    claim: Object.freeze({
      sourceResearchRunnerOnly: true as const,
      independentCanonicalColdStart: true as const,
      warmStartApplied: false as const,
      genericParameterPatchAccepted: false as const,
      valveDiseaseBracketApplied: false as const,
      circulationRuntimeChanged: false as const,
      calciumDriveChanged: false as const,
      aorticValveConstitutiveLawChanged: false as const,
      acceptedStateOrCheckpointTopologyChanged: false as const,
      exactProtocolIdentityIncludesMechanicsAndBloodVolume: true as const,
    }),
  });
}

/** Fixed Aeff-by-Tref factorial arm for ET-versus-force-scale separation. */
export function runMainWireNormalAdultFiveWallAorticOutflowVelocityDistortionTrefResearchArmV1(
  options: MainWireNormalAdultFiveWallAorticOutflowResearchOptionsV1,
  armId: MainWireAorticOutflowVelocityDistortionTrefArmIdV1,
): MainWireNormalAdultFiveWallAorticOutflowVelocityDistortionTrefResearchRunV1 {
  assertExactAorticOutflowResearchOptions(options);
  const arm = resolveMainWireAorticOutflowVelocityDistortionTrefArmV1(armId);
  const runtime = normalAdultMainWireRuntimeV1();
  const provider = createFixedResearchMainWireNormalAdultFiveWallProviderV1(
    arm.ventricularMaterialPointId,
  );
  const materialPoint =
    resolveMainWireNormalAdultVentricularMaterialResearchPointV1(
      arm.ventricularMaterialPointId,
    );
  const bloodVolumeOperatingPoint =
    resolveMainWireNormalAdultBloodVolumeOperatingPointV1(runtime);
  const periodicResult =
    runMainWireNormalAdultFiveWallPeriodicSteadyResolvedRuntimeV1(
      Object.freeze({
        dtSec: options.dtSec,
        ...(options.maximumBeatCount === undefined
          ? {}
          : { maximumBeatCount: options.maximumBeatCount }),
        laSlsMode: "on" as const,
        pericardiumMode: "on" as const,
        pericardiumCase: "healthy-slack" as const,
        initialization: "canonical" as const,
        valveDiseaseBracketIds: Object.freeze([]),
      }),
      runtime,
      Object.freeze({ provider, bloodVolumeOperatingPoint }),
    );
  return Object.freeze({
    configurationRole:
      "fixed-aortic-outflow-velocity-distortion-tref-arm" as const,
    arm,
    materialPoint,
    periodicResult,
    claim: Object.freeze({
      sourceResearchRunnerOnly: true as const,
      independentCanonicalColdStart: true as const,
      warmStartApplied: false as const,
      genericParameterPatchAccepted: false as const,
      valveDiseaseBracketApplied: false as const,
      circulationRuntimeChanged: false as const,
      calciumDriveChanged: false as const,
      bloodVolumeChanged: false as const,
      aorticValveConstitutiveLawChanged: false as const,
      acceptedStateOrCheckpointTopologyChanged: false as const,
    }),
  });
}

/** Fixed 2x2 Land beta0/beta1 length-mechanism research arm. */
export function runMainWireNormalAdultFiveWallAorticOutflowLengthMechanismResearchArmV1(
  options: MainWireNormalAdultFiveWallAorticOutflowResearchOptionsV1,
  armId: MainWireAorticOutflowLengthMechanismArmIdV1,
): MainWireNormalAdultFiveWallAorticOutflowLengthMechanismResearchRunV1 {
  assertExactAorticOutflowResearchOptions(options);
  const arm = resolveMainWireAorticOutflowLengthMechanismArmV1(armId);
  const runtime = normalAdultMainWireRuntimeV1();
  const provider = createFixedResearchMainWireNormalAdultFiveWallProviderV1(
    arm.ventricularMaterialPointId,
  );
  const materialPoint =
    resolveMainWireNormalAdultVentricularMaterialResearchPointV1(
      arm.ventricularMaterialPointId,
    );
  const bloodVolumeOperatingPoint =
    resolveMainWireNormalAdultBloodVolumeOperatingPointV1(runtime);
  const periodicResult =
    runMainWireNormalAdultFiveWallPeriodicSteadyResolvedRuntimeV1(
      Object.freeze({
        dtSec: options.dtSec,
        ...(options.maximumBeatCount === undefined
          ? {}
          : { maximumBeatCount: options.maximumBeatCount }),
        laSlsMode: "on" as const,
        pericardiumMode: "on" as const,
        pericardiumCase: "healthy-slack" as const,
        initialization: "canonical" as const,
        valveDiseaseBracketIds: Object.freeze([]),
      }),
      runtime,
      Object.freeze({ provider, bloodVolumeOperatingPoint }),
    );
  return Object.freeze({
    configurationRole:
      "fixed-aortic-outflow-length-mechanism-ablation-arm" as const,
    arm,
    materialPoint,
    periodicResult,
    claim: Object.freeze({
      sourceResearchRunnerOnly: true as const,
      independentCanonicalColdStart: true as const,
      warmStartApplied: false as const,
      genericParameterPatchAccepted: false as const,
      valveDiseaseBracketApplied: false as const,
      circulationRuntimeChanged: false as const,
      calciumDriveChanged: false as const,
      aorticValveConstitutiveLawChanged: false as const,
      acceptedStateOrCheckpointTopologyChanged: false as const,
    }),
  });
}

/** Fixed candidate-by-load context from an independent canonical cold start. */
export function runMainWireNormalAdultFiveWallAorticOutflowMechanismCandidateLoadResearchV1(
  options: MainWireNormalAdultFiveWallAorticOutflowResearchOptionsV1,
  candidateId: MainWireAorticOutflowMechanismCandidateIdV1,
  contextId: MainWireAorticOutflowMechanismLoadContextIdV1,
): MainWireNormalAdultFiveWallAorticOutflowMechanismCandidateLoadResearchRunV1 {
  assertExactAorticOutflowResearchOptions(options);
  const candidate = resolveMainWireAorticOutflowMechanismCandidateV1(candidateId);
  const context = resolveMainWireAorticOutflowMechanismLoadContextV1(contextId);
  const runtime = resolveMainWireNormalAdultFiveWallCirculatoryLoadRuntimeV1(
    context.circulatoryLoadPointId,
  );
  const circulatoryLoadPoint =
    resolveMainWireNormalAdultFiveWallCirculatoryLoadPointV1(
      context.circulatoryLoadPointId,
    );
  const bloodVolume = resolveMainWireNormalAdultBloodVolumeResearchPointV1(
    runtime,
    context.stressedVenousVolumePointId,
  );
  const provider = createFixedResearchMainWireNormalAdultFiveWallProviderV1(
    candidate.ventricularMaterialPointId,
  );
  const materialPoint =
    resolveMainWireNormalAdultVentricularMaterialResearchPointV1(
      candidate.ventricularMaterialPointId,
    );
  const periodicResult =
    runMainWireNormalAdultFiveWallPeriodicSteadyResolvedRuntimeV1(
      Object.freeze({
        dtSec: options.dtSec,
        ...(options.maximumBeatCount === undefined
          ? {}
          : { maximumBeatCount: options.maximumBeatCount }),
        laSlsMode: "on" as const,
        pericardiumMode: "on" as const,
        pericardiumCase: "healthy-slack" as const,
        initialization: "canonical" as const,
        valveDiseaseBracketIds: Object.freeze([]),
      }),
      runtime,
      Object.freeze({
        provider,
        bloodVolumeOperatingPoint: bloodVolume.operatingPoint,
      }),
    );
  return Object.freeze({
    configurationRole:
      "fixed-aortic-outflow-mechanism-candidate-load-envelope-run" as const,
    candidate,
    context,
    materialPoint,
    circulatoryLoadPoint,
    stressedVenousVolumePoint: bloodVolume.point,
    periodicResult,
    claim: Object.freeze({
      sourceResearchRunnerOnly: true as const,
      independentCanonicalColdStart: true as const,
      warmStartApplied: false as const,
      genericParameterPatchAccepted: false as const,
      valveDiseaseBracketApplied: false as const,
      calciumDriveChanged: false as const,
      aorticValveConstitutiveLawChanged: false as const,
      acceptedStateOrCheckpointTopologyChanged: false as const,
      exactProtocolIdentityIncludesCandidateLoadAndBloodVolume: true as const,
    }),
  });
}

/** ET-first candidate paired with canonical across fixed load contexts. */
export function runMainWireNormalAdultFiveWallAorticOutflowEjectionTimingCandidateLoadResearchV1(
  options: MainWireNormalAdultFiveWallAorticOutflowResearchOptionsV1,
  candidateId: MainWireAorticOutflowEjectionTimingCandidateIdV1,
  contextId: MainWireAorticOutflowEjectionTimingLoadContextIdV1,
): MainWireNormalAdultFiveWallAorticOutflowEjectionTimingCandidateLoadResearchRunV1 {
  assertExactAorticOutflowResearchOptions(options);
  const candidate = resolveMainWireAorticOutflowEjectionTimingCandidateV1(
    candidateId,
  );
  const context = resolveMainWireAorticOutflowEjectionTimingLoadContextV1(
    contextId,
  );
  const runtime = resolveMainWireNormalAdultFiveWallCirculatoryLoadRuntimeV1(
    context.circulatoryLoadPointId,
  );
  const circulatoryLoadPoint =
    resolveMainWireNormalAdultFiveWallCirculatoryLoadPointV1(
      context.circulatoryLoadPointId,
    );
  const bloodVolume = resolveMainWireNormalAdultBloodVolumeResearchPointV1(
    runtime,
    context.stressedVenousVolumePointId,
  );
  const provider = createFixedResearchMainWireNormalAdultFiveWallProviderV1(
    candidate.ventricularMaterialPointId,
  );
  const materialPoint =
    resolveMainWireNormalAdultVentricularMaterialResearchPointV1(
      candidate.ventricularMaterialPointId,
    );
  const periodicResult =
    runMainWireNormalAdultFiveWallPeriodicSteadyResolvedRuntimeV1(
      Object.freeze({
        dtSec: options.dtSec,
        ...(options.maximumBeatCount === undefined
          ? {}
          : { maximumBeatCount: options.maximumBeatCount }),
        laSlsMode: "on" as const,
        pericardiumMode: "on" as const,
        pericardiumCase: "healthy-slack" as const,
        initialization: "canonical" as const,
        valveDiseaseBracketIds: Object.freeze([]),
      }),
      runtime,
      Object.freeze({
        provider,
        bloodVolumeOperatingPoint: bloodVolume.operatingPoint,
      }),
    );
  return Object.freeze({
    configurationRole:
      "fixed-aortic-outflow-ejection-timing-candidate-load-envelope-run" as const,
    candidate,
    context,
    materialPoint,
    circulatoryLoadPoint,
    stressedVenousVolumePoint: bloodVolume.point,
    periodicResult,
    claim: Object.freeze({
      sourceResearchRunnerOnly: true as const,
      independentCanonicalColdStart: true as const,
      warmStartApplied: false as const,
      genericParameterPatchAccepted: false as const,
      valveDiseaseBracketApplied: false as const,
      calciumDriveChanged: false as const,
      aorticValveConstitutiveLawChanged: false as const,
      acceptedStateOrCheckpointTopologyChanged: false as const,
      exactProtocolIdentityIncludesCandidateLoadAndBloodVolume: true as const,
    }),
  });
}

/** Fixed ET-refinement candidate at nominal or prior worst-ET load. */
export function runMainWireNormalAdultFiveWallAorticOutflowEjectionTimingRefinementResearchV1(
  options: MainWireNormalAdultFiveWallAorticOutflowResearchOptionsV1,
  candidateId: MainWireAorticOutflowEjectionTimingRefinementCandidateIdV1,
  contextId: MainWireAorticOutflowEjectionTimingRefinementContextIdV1,
): MainWireNormalAdultFiveWallAorticOutflowEjectionTimingRefinementResearchRunV1 {
  assertExactAorticOutflowResearchOptions(options);
  const candidate = resolveMainWireVentricularLandEtRefinementCandidateV1(
    candidateId,
  );
  const context = resolveMainWireAorticOutflowEjectionTimingRefinementContextV1(
    contextId,
  );
  const runtime = resolveMainWireNormalAdultFiveWallCirculatoryLoadRuntimeV1(
    context.circulatoryLoadPointId,
  );
  const circulatoryLoadPoint =
    resolveMainWireNormalAdultFiveWallCirculatoryLoadPointV1(
      context.circulatoryLoadPointId,
    );
  const provider =
    createMainWireNormalAdultFiveWallProviderWithVentricularLandEtRefinementCandidateV1(
      candidateId,
    );
  const bloodVolumeOperatingPoint =
    resolveMainWireNormalAdultBloodVolumeOperatingPointV1(runtime);
  const periodicResult =
    runMainWireNormalAdultFiveWallPeriodicSteadyResolvedRuntimeV1(
      Object.freeze({
        dtSec: options.dtSec,
        ...(options.maximumBeatCount === undefined
          ? {}
          : { maximumBeatCount: options.maximumBeatCount }),
        laSlsMode: "on" as const,
        pericardiumMode: "on" as const,
        pericardiumCase: "healthy-slack" as const,
        initialization: "canonical" as const,
        valveDiseaseBracketIds: Object.freeze([]),
      }),
      runtime,
      Object.freeze({ provider, bloodVolumeOperatingPoint }),
    );
  return Object.freeze({
    configurationRole:
      "fixed-aortic-outflow-ejection-timing-refinement-run" as const,
    candidate,
    context,
    circulatoryLoadPoint,
    periodicResult,
    claim: Object.freeze({
      sourceResearchRunnerOnly: true as const,
      independentCanonicalColdStart: true as const,
      warmStartApplied: false as const,
      genericParameterPatchAccepted: false as const,
      valveDiseaseBracketApplied: false as const,
      calciumDriveChanged: false as const,
      bloodVolumeChanged: false as const,
      aorticValveConstitutiveLawChanged: false as const,
      acceptedStateOrCheckpointTopologyChanged: false as const,
      exactProtocolIdentityIncludesCandidateAndLoad: true as const,
    }),
  });
}

/** Fixed ET-mechanics by valve-local-inertance interaction arm. */
export function runMainWireNormalAdultFiveWallAorticOutflowEjectionTimingLocalInertanceInteractionResearchV1(
  options: MainWireNormalAdultFiveWallAorticOutflowResearchOptionsV1,
  armId:
    MainWireAorticOutflowEjectionTimingLocalInertanceInteractionArmIdV1,
): MainWireNormalAdultFiveWallAorticOutflowEjectionTimingLocalInertanceInteractionResearchRunV1 {
  assertExactAorticOutflowResearchOptions(options);
  const arm =
    resolveMainWireAorticOutflowEjectionTimingLocalInertanceInteractionArmV1(
      armId,
    );
  const localInertanceProfile = arm.localInertanceProfileId === null
    ? null
    : resolveMainWireAorticValveLocalInertanceProfileV1(
      arm.localInertanceProfileId,
    );
  const baselineRuntime = normalAdultMainWireRuntimeV1();
  const runtime: NonCoronaryCirculationRuntimeParamsV1 = Object.freeze({
    ...baselineRuntime,
    ...(localInertanceProfile === null
      ? {}
      : { aorticValveLocalInertanceResearchProfile: localInertanceProfile }),
  });
  const provider = createFixedResearchMainWireNormalAdultFiveWallProviderV1(
    arm.ventricularMaterialPointId,
  );
  const materialPoint =
    resolveMainWireNormalAdultVentricularMaterialResearchPointV1(
      arm.ventricularMaterialPointId,
    );
  const bloodVolumeOperatingPoint =
    resolveMainWireNormalAdultBloodVolumeOperatingPointV1(runtime);
  const periodicResult =
    runMainWireNormalAdultFiveWallPeriodicSteadyResolvedRuntimeV1(
      Object.freeze({
        dtSec: options.dtSec,
        ...(options.maximumBeatCount === undefined
          ? {}
          : { maximumBeatCount: options.maximumBeatCount }),
        laSlsMode: "on" as const,
        pericardiumMode: "on" as const,
        pericardiumCase: "healthy-slack" as const,
        initialization: "canonical" as const,
        valveDiseaseBracketIds: Object.freeze([]),
      }),
      runtime,
      Object.freeze({ provider, bloodVolumeOperatingPoint }),
    );
  const audit = periodicResult.aorticValveLocalInertanceResearchAudit ?? null;
  if (localInertanceProfile !== null && audit === null) {
    throw new Error("ET/local-inertance arm omitted external q audit");
  }
  if (localInertanceProfile === null && audit !== null) {
    throw new Error("ET/local-inertance L-off arm emitted external q audit");
  }
  return Object.freeze({
    configurationRole:
      "fixed-aortic-outflow-ejection-timing-local-inertance-interaction-arm" as const,
    arm,
    materialPoint,
    localInertanceProfile,
    periodicResult,
    externalFlowStateAudit: audit,
    claim: Object.freeze({
      sourceResearchRunnerOnly: true as const,
      independentCanonicalColdStart: true as const,
      warmStartApplied: false as const,
      genericParameterPatchAccepted: false as const,
      valveDiseaseBracketApplied: false as const,
      calciumDriveChanged: false as const,
      bloodVolumeChanged: false as const,
      pressureRecoveryChanged: false as const,
      openingModeChanged: false as const,
      aorticMaximumForwardEoaChanged: false as const,
      externalFlowPromotedOnlyAfterSuccessfulCoupledStepWhenApplicable:
        true as const,
      canonicalAcceptedStateOrCheckpointChanged: false as const,
      exactProtocolIdentityIncludesMechanicsAndLocalInertance: true as const,
    }),
  });
}

/** Fixed 2x2 Land velocity-distortion/arterial-stiffness research arm. */
export function runMainWireNormalAdultFiveWallAorticOutflowVelocityStiffnessResearchArmV1(
  options: MainWireNormalAdultFiveWallAorticOutflowResearchOptionsV1,
  armId: MainWireAorticOutflowVelocityStiffnessArmIdV1,
): MainWireNormalAdultFiveWallAorticOutflowVelocityStiffnessResearchRunV1 {
  assertExactAorticOutflowResearchOptions(options);
  const arm = resolveMainWireAorticOutflowVelocityStiffnessArmV1(armId);
  const runtime = resolveMainWireNormalAdultFiveWallCirculatoryLoadRuntimeV1(
    arm.circulatoryLoadPointId,
  );
  const circulatoryLoadPoint =
    resolveMainWireNormalAdultFiveWallCirculatoryLoadPointV1(
      arm.circulatoryLoadPointId,
    );
  const provider = createFixedResearchMainWireNormalAdultFiveWallProviderV1(
    arm.ventricularMaterialPointId,
  );
  const materialPoint =
    resolveMainWireNormalAdultVentricularMaterialResearchPointV1(
      arm.ventricularMaterialPointId,
    );
  const bloodVolumeOperatingPoint =
    resolveMainWireNormalAdultBloodVolumeOperatingPointV1(runtime);
  const periodicResult =
    runMainWireNormalAdultFiveWallPeriodicSteadyResolvedRuntimeV1(
      Object.freeze({
        dtSec: options.dtSec,
        ...(options.maximumBeatCount === undefined
          ? {}
          : { maximumBeatCount: options.maximumBeatCount }),
        laSlsMode: "on" as const,
        pericardiumMode: "on" as const,
        pericardiumCase: "healthy-slack" as const,
        initialization: "canonical" as const,
        valveDiseaseBracketIds: Object.freeze([]),
      }),
      runtime,
      Object.freeze({ provider, bloodVolumeOperatingPoint }),
    );
  return Object.freeze({
    configurationRole:
      "fixed-aortic-outflow-velocity-stiffness-ablation-arm" as const,
    arm,
    materialPoint,
    circulatoryLoadPoint,
    periodicResult,
    claim: Object.freeze({
      sourceResearchRunnerOnly: true as const,
      independentCanonicalColdStart: true as const,
      warmStartApplied: false as const,
      genericParameterPatchAccepted: false as const,
      valveDiseaseBracketApplied: false as const,
      calciumDriveChanged: false as const,
      aorticValveConstitutiveLawChanged: false as const,
      acceptedStateOrCheckpointTopologyChanged: false as const,
      exactRuntimeIdentityIncludesLoadPoint: true as const,
    }),
  });
}

/** Fixed Ao-to-SA exponential-PV capacity redistribution from a cold start. */
export function runMainWireNormalAdultFiveWallAorticCompliancePartitionResearchV1(
  options: MainWireNormalAdultFiveWallAorticOutflowResearchOptionsV1,
  profileId: MainWireAorticCompliancePartitionResearchProfileIdV1,
): MainWireNormalAdultFiveWallAorticCompliancePartitionResearchRunV1 {
  assertExactAorticOutflowResearchOptions(options);
  const profile =
    resolveMainWireAorticCompliancePartitionResearchProfileV1(profileId);
  const capacitySnapshot =
    resolveMainWireAorticCompliancePartitionCapacitySnapshotV1(profile);
  const baselineRuntime = normalAdultMainWireRuntimeV1();
  const runtime: NonCoronaryCirculationRuntimeParamsV1 = Object.freeze({
    ...baselineRuntime,
    vascular: Object.freeze({
      ...baselineRuntime.vascular,
      aorticCompliancePartitionResearchProfile: profile,
    }),
  });
  const periodicResult =
    runMainWireNormalAdultFiveWallPeriodicSteadyResolvedRuntimeV1(
      Object.freeze({
        dtSec: options.dtSec,
        ...(options.maximumBeatCount === undefined
          ? {}
          : { maximumBeatCount: options.maximumBeatCount }),
        laSlsMode: "on" as const,
        pericardiumMode: "on" as const,
        pericardiumCase: "healthy-slack" as const,
        initialization: "canonical" as const,
        valveDiseaseBracketIds: Object.freeze([]),
      }),
      runtime,
    );
  return Object.freeze({
    configurationRole:
      "fixed-aortic-compliance-partition-research-profile" as const,
    profile,
    capacitySnapshot,
    periodicResult,
    claim: Object.freeze({
      sourceResearchRunnerOnly: true as const,
      independentCanonicalColdStart: true as const,
      warmStartApplied: false as const,
      genericParameterPatchAccepted: false as const,
      valveDiseaseBracketApplied: false as const,
      aorticValveConstitutiveLawChanged: false as const,
      globalArterialStiffnessChanged: false as const,
      aorticRootPlusSystemicArteryVsSumPreservedExactly: true as const,
      acceptedStateOrCheckpointTopologyChanged: false as const,
      exactRuntimeIdentityIncludesPartitionProfile: true as const,
    }),
  });
}

/** Fixed global arterial-compliance physiology bracket from a cold start. */
export function runMainWireNormalAdultFiveWallArterialCompliancePhysiologyResearchV1(
  options: MainWireNormalAdultFiveWallAorticOutflowResearchOptionsV1,
  profileId: MainWireArterialCompliancePhysiologyProfileIdV1,
): MainWireNormalAdultFiveWallArterialCompliancePhysiologyResearchRunV1 {
  assertExactAorticOutflowResearchOptions(options);
  const profile = resolveMainWireArterialCompliancePhysiologyProfileV1(
    profileId,
  );
  const runtime = resolveMainWireArterialCompliancePhysiologyRuntimeV1(
    profileId,
  );
  const periodicResult =
    runMainWireNormalAdultFiveWallPeriodicSteadyResolvedRuntimeV1(
      Object.freeze({
        dtSec: options.dtSec,
        ...(options.maximumBeatCount === undefined
          ? {}
          : { maximumBeatCount: options.maximumBeatCount }),
        laSlsMode: "on" as const,
        pericardiumMode: "on" as const,
        pericardiumCase: "healthy-slack" as const,
        initialization: "canonical" as const,
        valveDiseaseBracketIds: Object.freeze([]),
      }),
      runtime,
    );
  return Object.freeze({
    configurationRole:
      "fixed-arterial-compliance-physiology-research-profile" as const,
    profile,
    periodicResult,
    claim: Object.freeze({
      sourceResearchRunnerOnly: true as const,
      independentCanonicalColdStart: true as const,
      warmStartApplied: false as const,
      genericParameterPatchAccepted: false as const,
      valveDiseaseBracketApplied: false as const,
      bloodVolumeChanged: false as const,
      systemicOrPulmonaryResistanceChanged: false as const,
      aorticValveConstitutiveLawChanged: false as const,
      mechanicsOrCalciumChanged: false as const,
      acceptedStateOrCheckpointTopologyChanged: false as const,
      exactRuntimeIdentityIncludesProfile: true as const,
    }),
  });
}

/** Fixed combination of the retained low-order ET mechanism axes. */
export function runMainWireNormalAdultFiveWallAorticOutflowLowOrderMechanismCombinationResearchV1(
  options: MainWireNormalAdultFiveWallAorticOutflowResearchOptionsV1,
  complianceProfileId: MainWireArterialCompliancePhysiologyProfileIdV1,
  placementProfileId:
    MainWireAorticCharacteristicResistancePlacementProfileIdV1 | null,
  twitchTimingCandidateId: MainWireVentricularLandTwitchTimingCandidateIdV1,
  rootInertanceProfileId:
    MainWireAorticRootInertanceResearchProfileIdV1 | null = null,
  compliancePartitionProfileId:
    MainWireAorticCompliancePartitionResearchProfileIdV1 | null = null,
  circulatoryLoadPointId:
    MainWireNormalAdultFiveWallCirculatoryLoadPointIdV1 = "baseline",
  stressedVenousVolumePointId:
    MainWireNormalAdultStressedVenousVolumeResearchPointIdV1 = "baseline",
): MainWireNormalAdultFiveWallAorticOutflowLowOrderMechanismCombinationResearchRunV1 {
  assertExactAorticOutflowResearchOptions(options);
  const complianceProfile =
    resolveMainWireArterialCompliancePhysiologyProfileV1(complianceProfileId);
  const placementProfile = placementProfileId === null
    ? null
    : resolveMainWireAorticCharacteristicResistancePlacementProfileV1(
      placementProfileId,
    );
  const twitchTimingCandidate =
    resolveMainWireVentricularLandTwitchTimingCandidateV1(
      twitchTimingCandidateId,
    );
  const rootInertanceProfile = rootInertanceProfileId === null
    ? null
    : resolveMainWireAorticRootInertanceResearchProfileV1(
      rootInertanceProfileId,
    );
  const compliancePartitionProfile = compliancePartitionProfileId === null
    ? null
    : resolveMainWireAorticCompliancePartitionResearchProfileV1(
      compliancePartitionProfileId,
    );
  const circulatoryLoadPoint =
    resolveMainWireNormalAdultFiveWallCirculatoryLoadPointV1(
      circulatoryLoadPointId,
    );
  if (circulatoryLoadPoint.arterialStiffnessScaleFromBaseline !== 1) {
    throw new Error(
      "low-order combination owns arterial stiffness; load point must not",
    );
  }
  const loadRuntime =
    resolveMainWireNormalAdultFiveWallCirculatoryLoadRuntimeV1(
      circulatoryLoadPointId,
    );
  const baselineRuntime = normalAdultMainWireRuntimeV1();
  const runtime: NonCoronaryCirculationRuntimeParamsV1 = Object.freeze({
    ...loadRuntime,
    vascular: Object.freeze({
      ...loadRuntime.vascular,
      systemicArterialStiffnessScaleFromGlobal:
        complianceProfile.arterialStiffnessScaleFromBaseline,
      ...(compliancePartitionProfile === null
        ? {}
        : {
        aorticCompliancePartitionResearchProfile:
          compliancePartitionProfile,
        }),
    }),
    ...(placementProfile === null
      ? {}
      : {
        aorticCharacteristicResistancePlacementResearchProfile:
          placementProfile,
      }),
    ...(rootInertanceProfile === null
      ? {}
      : { aorticRootInertanceResearchProfile: rootInertanceProfile }),
  });
  const provider =
    createMainWireNormalAdultFiveWallProviderWithVentricularLandTwitchTimingCandidateV1(
      twitchTimingCandidateId,
    );
  const calciumDriveParams = FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1;
  const bloodVolume = resolveMainWireNormalAdultBloodVolumeResearchPointV1(
    runtime,
    stressedVenousVolumePointId,
  );
  const periodicResult =
    runMainWireNormalAdultFiveWallPeriodicSteadyResolvedRuntimeV1(
      Object.freeze({
        dtSec: options.dtSec,
        ...(options.maximumBeatCount === undefined
          ? {}
          : { maximumBeatCount: options.maximumBeatCount }),
        laSlsMode: "on" as const,
        pericardiumMode: "on" as const,
        pericardiumCase: "healthy-slack" as const,
        initialization: "canonical" as const,
        valveDiseaseBracketIds: Object.freeze([]),
      }),
      runtime,
      Object.freeze({
        provider,
        bloodVolumeOperatingPoint: bloodVolume.operatingPoint,
        calciumDriveParams,
      }),
    );
  if (
    periodicResult.protocolIdentity.calciumDrive.parameterSetId
      !== calciumDriveParams.parameterSetId
    || periodicResult.protocolIdentity.mechanicsProvider.parameterIdentityHash
      !== provider.parameterIdentityHash
  ) {
    throw new Error("low-order ET mechanism combination identity mismatch");
  }
  return Object.freeze({
    configurationRole:
      "fixed-aortic-outflow-low-order-mechanism-combination-arm" as const,
    complianceProfile,
    compliancePartitionProfile,
    placementProfile,
    rootInertanceProfile,
    twitchTimingCandidate,
    circulatoryLoadPoint,
    bloodVolumePoint: bloodVolume.point,
    calciumDriveParams,
    periodicResult,
    claim: Object.freeze({
      sourceResearchRunnerOnly: true as const,
      independentCanonicalColdStart: true as const,
      warmStartApplied: false as const,
      genericParameterPatchAccepted: false as const,
      valveDiseaseBracketApplied: false as const,
      bloodVolumeChanged: false as const,
      aorticMaximumForwardEoaChanged: false as const,
      calciumDriveChanged: false as const,
      calciumOrMechanicsStateAdded: false as const,
      acceptedStateOrCheckpointTopologyChanged: false as const,
      exactProtocolIdentityIncludesAllSevenFactors: true as const,
    }),
  });
}

/**
 * Fixed research arm that relocates, rather than duplicates, the existing
 * Ao_SA accepted flow memory to the inflow side of the aortic compliance.
 */
export function runMainWireNormalAdultFiveWallAorticRootFlowStateRelocationResearchV1(
  options: MainWireNormalAdultFiveWallAorticOutflowResearchOptionsV1,
  relocationProfileId:
    MainWireAorticRootFlowStateRelocationProfileIdV1,
  complianceProfileId: MainWireArterialCompliancePhysiologyProfileIdV1,
  twitchTimingCandidateId: MainWireVentricularLandTwitchTimingCandidateIdV1,
): MainWireNormalAdultFiveWallAorticRootFlowStateRelocationResearchRunV1 {
  assertExactAorticOutflowResearchOptions(options);
  const relocationProfile =
    resolveMainWireAorticRootFlowStateRelocationProfileV1(
      relocationProfileId,
    );
  const complianceProfile =
    resolveMainWireArterialCompliancePhysiologyProfileV1(
      complianceProfileId,
    );
  const twitchTimingCandidate =
    resolveMainWireVentricularLandTwitchTimingCandidateV1(
      twitchTimingCandidateId,
    );
  const baselineRuntime = normalAdultMainWireRuntimeV1();
  const runtime: NonCoronaryCirculationRuntimeParamsV1 = Object.freeze({
    ...baselineRuntime,
    vascular: Object.freeze({
      ...baselineRuntime.vascular,
      systemicArterialStiffnessScaleFromGlobal:
        complianceProfile.arterialStiffnessScaleFromBaseline,
    }),
    aorticRootFlowStateRelocationResearchProfile: relocationProfile,
  });
  const provider =
    createMainWireNormalAdultFiveWallProviderWithVentricularLandTwitchTimingCandidateV1(
      twitchTimingCandidateId,
    );
  const calciumDriveParams = FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1;
  const bloodVolumeOperatingPoint =
    resolveMainWireNormalAdultBloodVolumeOperatingPointV1(runtime);
  const periodicResult =
    runMainWireNormalAdultFiveWallPeriodicSteadyResolvedRuntimeV1(
      Object.freeze({
        dtSec: options.dtSec,
        ...(options.maximumBeatCount === undefined
          ? {}
          : { maximumBeatCount: options.maximumBeatCount }),
        laSlsMode: "on" as const,
        pericardiumMode: "on" as const,
        pericardiumCase: "healthy-slack" as const,
        initialization: "canonical" as const,
        valveDiseaseBracketIds: Object.freeze([]),
      }),
      runtime,
      Object.freeze({
        provider,
        bloodVolumeOperatingPoint,
        calciumDriveParams,
      }),
    );
  if (
    periodicResult.protocolIdentity.calciumDrive.parameterSetId
      !== calciumDriveParams.parameterSetId
    || periodicResult.protocolIdentity.mechanicsProvider.parameterIdentityHash
      !== provider.parameterIdentityHash
    || periodicResult.protocolComponentHashes.circulationRuntimeStableHash
      !== hashProtocolValue(runtime)
  ) {
    throw new Error("aortic-root flow-state relocation identity mismatch");
  }
  return Object.freeze({
    configurationRole:
      "fixed-aortic-root-flow-state-relocation-research-arm" as const,
    relocationProfile,
    complianceProfile,
    twitchTimingCandidate,
    calciumDriveParams,
    periodicResult,
    claim: Object.freeze({
      sourceResearchRunnerOnly: true as const,
      independentCanonicalColdStart: true as const,
      warmStartApplied: false as const,
      genericParameterPatchAccepted: false as const,
      valveDiseaseBracketApplied: false as const,
      bloodVolumeChanged: false as const,
      aorticMaximumForwardEoaChanged: false as const,
      calciumDriveChanged: false as const,
      dynamicFlowStateSlotCountChanged: false as const,
      dynamicFlowStateSlotSemanticsChanged: true as const,
      canonicalCheckpointCompatible: false as const,
      exactProtocolIdentityIncludesAllThreeFactors: true as const,
    }),
  });
}

/**
 * Source-explicit whole-organ kuw bracket crossed with fixed Windkessel
 * structure. Aeff, Tref, calcium, AVA, blood volume, and state topology stay
 * fixed so the incompletely identified crossbridge attachment axis is isolated.
 */
export function runMainWireNormalAdultFiveWallAorticOutflowWholeOrganKuwWindkesselResearchV1(
  options: MainWireNormalAdultFiveWallAorticOutflowResearchOptionsV1,
  kuwProfileId: MainWireVentricularLandWholeOrganKuwProfileIdV1,
  complianceProfileId: MainWireArterialCompliancePhysiologyProfileIdV1,
  placementProfileId:
    MainWireAorticCharacteristicResistancePlacementProfileIdV1 | null,
  rootInertanceProfileId:
    MainWireAorticRootInertanceResearchProfileIdV1 | null,
): MainWireNormalAdultFiveWallAorticOutflowWholeOrganKuwWindkesselResearchRunV1 {
  assertExactAorticOutflowResearchOptions(options);
  const kuwProfile = resolveMainWireVentricularLandWholeOrganKuwProfileV1(
    kuwProfileId,
  );
  const complianceProfile =
    resolveMainWireArterialCompliancePhysiologyProfileV1(
      complianceProfileId,
    );
  const placementProfile = placementProfileId === null
    ? null
    : resolveMainWireAorticCharacteristicResistancePlacementProfileV1(
      placementProfileId,
    );
  const rootInertanceProfile = rootInertanceProfileId === null
    ? null
    : resolveMainWireAorticRootInertanceResearchProfileV1(
      rootInertanceProfileId,
    );
  const baselineRuntime = normalAdultMainWireRuntimeV1();
  const runtime: NonCoronaryCirculationRuntimeParamsV1 = Object.freeze({
    ...baselineRuntime,
    vascular: Object.freeze({
      ...baselineRuntime.vascular,
      systemicArterialStiffnessScaleFromGlobal:
        complianceProfile.arterialStiffnessScaleFromBaseline,
    }),
    ...(placementProfile === null
      ? {}
      : {
        aorticCharacteristicResistancePlacementResearchProfile:
          placementProfile,
      }),
    ...(rootInertanceProfile === null
      ? {}
      : { aorticRootInertanceResearchProfile: rootInertanceProfile }),
  });
  const provider =
    createMainWireNormalAdultFiveWallProviderWithVentricularLandWholeOrganKuwProfileV1(
      kuwProfileId,
    );
  const calciumDriveParams = FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1;
  const bloodVolumeOperatingPoint =
    resolveMainWireNormalAdultBloodVolumeOperatingPointV1(runtime);
  const periodicResult =
    runMainWireNormalAdultFiveWallPeriodicSteadyResolvedRuntimeV1(
      Object.freeze({
        dtSec: options.dtSec,
        ...(options.maximumBeatCount === undefined
          ? {}
          : { maximumBeatCount: options.maximumBeatCount }),
        laSlsMode: "on" as const,
        pericardiumMode: "on" as const,
        pericardiumCase: "healthy-slack" as const,
        initialization: "canonical" as const,
        valveDiseaseBracketIds: Object.freeze([]),
      }),
      runtime,
      Object.freeze({
        provider,
        bloodVolumeOperatingPoint,
        calciumDriveParams,
      }),
    );
  if (
    periodicResult.protocolIdentity.calciumDrive.parameterSetId
      !== calciumDriveParams.parameterSetId
    || periodicResult.protocolIdentity.mechanicsProvider.parameterIdentityHash
      !== provider.parameterIdentityHash
    || periodicResult.protocolComponentHashes.circulationRuntimeStableHash
      !== hashProtocolValue(runtime)
  ) throw new Error("whole-organ kuw/Windkessel identity mismatch");
  return Object.freeze({
    configurationRole:
      "fixed-aortic-outflow-whole-organ-kuw-windkessel-arm" as const,
    kuwProfile,
    complianceProfile,
    placementProfile,
    rootInertanceProfile,
    calciumDriveParams,
    periodicResult,
    claim: Object.freeze({
      sourceResearchRunnerOnly: true as const,
      independentCanonicalColdStart: true as const,
      warmStartApplied: false as const,
      genericParameterPatchAccepted: false as const,
      valveDiseaseBracketApplied: false as const,
      bloodVolumeChanged: false as const,
      aorticMaximumForwardEoaChanged: false as const,
      sourceFittedAeffChanged: false as const,
      sourceWholeOrganTrefChanged: false as const,
      calciumDriveChanged: false as const,
      acceptedStateOrCheckpointTopologyChanged: false as const,
      exactProtocolIdentityIncludesAllFourFactors: true as const,
    }),
  });
}

type MainWireNormalAdultFiveWallAorticOutflowLandCoppiniNonCalciumAssemblyIdsV1 =
  Readonly<{
    kuwProfileId: MainWireVentricularLandWholeOrganKuwProfileIdV1;
    complianceProfileId: MainWireArterialCompliancePhysiologyProfileIdV1;
    placementProfileId: MainWireAorticCharacteristicResistancePlacementProfileIdV1 | null;
    rootInertanceProfileId: MainWireAorticRootInertanceResearchProfileIdV1 | null;
    sarcomereReferenceProfileId: MainWireVentricularLandSarcomereReferenceProfileIdV1;
    calciumSensitivityLengthProfileId: MainWireVentricularLandCalciumSensitivityLengthProfileIdV1;
    sourceTwitchRetentionCandidateId: MainWireVentricularLandSourceTwitchRetentionCandidateIdV1;
    circulatoryLoadPointId: MainWireNormalAdultFiveWallCirculatoryLoadPointIdV1;
    stressedVenousVolumePointId: MainWireNormalAdultStressedVenousVolumeResearchPointIdV1;
    trefForceLoadProfileId: MainWireVentricularLandTrefForceLoadProfileIdV1;
    sourceVelocityDistortionProfileId: MainWireVentricularLandSourceVelocityDistortionProfileIdV1;
    strongBridgeDeactivationExitProfileId: MainWireVentricularLandStrongBridgeDeactivationExitProfileIdV1;
    aorticValveResearchProfileId: MainWireAorticValveResearchProfileIdV1 | null;
    recoveredRootPortValveProfileId: MainWireAorticRecoveredRootPortValveProfileIdV1 | null;
  }>;

type MainWireNormalAdultFiveWallAorticOutflowLandCoppiniNonCalciumAssemblyV1 =
  Readonly<{
    kuwProfile: MainWireVentricularLandWholeOrganKuwProfileV1;
    complianceProfile: MainWireArterialCompliancePhysiologyProfileV1;
    placementProfile: MainWireAorticCharacteristicResistancePlacementProfileV1 | null;
    rootInertanceProfile: MainWireAorticRootInertanceResearchProfileV1 | null;
    aorticValveResearchProfile: MainWireAorticValveResearchProfileV1 | null;
    recoveredRootPortValveProfile: MainWireAorticRecoveredRootPortValveProfileV1 | null;
    sarcomereReferenceProfile: MainWireVentricularLandSarcomereReferenceProfileV1;
    calciumSensitivityLengthProfile: MainWireVentricularLandCalciumSensitivityLengthProfileV1;
    sourceTwitchRetentionCandidate: MainWireVentricularLandSourceTwitchRetentionCandidateV1;
    circulatoryLoadPoint: MainWireNormalAdultFiveWallCirculatoryLoadPointV1;
    trefForceLoadProfile: MainWireVentricularLandTrefForceLoadProfileV1;
    sourceVelocityDistortionProfile: MainWireVentricularLandSourceVelocityDistortionProfileV1;
    strongBridgeDeactivationExitProfile: MainWireVentricularLandStrongBridgeDeactivationExitProfileV1;
    runtime: NonCoronaryCirculationRuntimeParamsV1;
    provider: MainWireNormalAdultFiveWallProviderV1;
    bloodVolume: ReturnType<
      typeof resolveMainWireNormalAdultBloodVolumeResearchPointV1
    >;
  }>;

function resolveMainWireNormalAdultFiveWallAorticOutflowLandCoppiniNonCalciumAssemblyV1(
  ids: MainWireNormalAdultFiveWallAorticOutflowLandCoppiniNonCalciumAssemblyIdsV1,
): MainWireNormalAdultFiveWallAorticOutflowLandCoppiniNonCalciumAssemblyV1 {
  const kuwProfile = resolveMainWireVentricularLandWholeOrganKuwProfileV1(
    ids.kuwProfileId,
  );
  const complianceProfile =
    resolveMainWireArterialCompliancePhysiologyProfileV1(
      ids.complianceProfileId,
    );
  const placementProfile =
    ids.placementProfileId === null
      ? null
      : resolveMainWireAorticCharacteristicResistancePlacementProfileV1(
          ids.placementProfileId,
        );
  const rootInertanceProfile =
    ids.rootInertanceProfileId === null
      ? null
      : resolveMainWireAorticRootInertanceResearchProfileV1(
          ids.rootInertanceProfileId,
        );
  const aorticValveResearchProfile =
    ids.aorticValveResearchProfileId === null
      ? null
      : resolveMainWireAorticValveResearchProfileV1(
          ids.aorticValveResearchProfileId,
        );
  const recoveredRootPortValveProfile =
    ids.recoveredRootPortValveProfileId === null
      ? null
      : resolveMainWireAorticRecoveredRootPortValveProfileV1(
          ids.recoveredRootPortValveProfileId,
        );
  const sarcomereReferenceProfile =
    resolveMainWireVentricularLandSarcomereReferenceProfileV1(
      ids.sarcomereReferenceProfileId,
    );
  const calciumSensitivityLengthProfile =
    resolveMainWireVentricularLandCalciumSensitivityLengthProfileV1(
      ids.calciumSensitivityLengthProfileId,
    );
  const sourceTwitchRetentionCandidate =
    resolveMainWireVentricularLandSourceTwitchRetentionCandidateV1(
      ids.sourceTwitchRetentionCandidateId,
    );
  const circulatoryLoadPoint =
    resolveMainWireNormalAdultFiveWallCirculatoryLoadPointV1(
      ids.circulatoryLoadPointId,
    );
  const trefForceLoadProfile =
    resolveMainWireVentricularLandTrefForceLoadProfileV1(
      ids.trefForceLoadProfileId,
    );
  const sourceVelocityDistortionProfile =
    resolveMainWireVentricularLandSourceVelocityDistortionProfileV1(
      ids.sourceVelocityDistortionProfileId,
    );
  const strongBridgeDeactivationExitProfile =
    resolveMainWireVentricularLandStrongBridgeDeactivationExitProfileV1(
      ids.strongBridgeDeactivationExitProfileId,
    );
  if (
    calciumSensitivityLengthProfile.beta1ScaleFromSource !== 1
    && (
      sourceTwitchRetentionCandidate.changedKineticParameters.length !== 0
      || trefForceLoadProfile.trefScaleFromRetainedCandidate !== 1
      || sourceVelocityDistortionProfile.aeffScaleFromIntactHumanSource !== 1
      || strongBridgeDeactivationExitProfile.maximumRatePerSec !== 0
    )
  ) {
    throw new Error(
      "Land source-trace runner does not compose beta1 with twitch-retention or Tref force-load research changes",
    );
  }
  const loadRuntime =
    resolveMainWireNormalAdultFiveWallCirculatoryLoadRuntimeV1(
      ids.circulatoryLoadPointId,
    );
  const runtime: NonCoronaryCirculationRuntimeParamsV1 = Object.freeze({
    ...loadRuntime,
    vascular: Object.freeze({
      ...loadRuntime.vascular,
      systemicArterialStiffnessScaleFromGlobal:
        complianceProfile.arterialStiffnessScaleFromBaseline,
    }),
    ...(placementProfile === null
      ? {}
      : {
        aorticCharacteristicResistancePlacementResearchProfile:
          placementProfile,
      }),
    ...(rootInertanceProfile === null
      ? {}
      : { aorticRootInertanceResearchProfile: rootInertanceProfile }),
    ...(aorticValveResearchProfile === null
      ? {}
      : { aorticValveResearchProfile }),
    ...(recoveredRootPortValveProfile === null
      ? {}
      : {
        aorticRecoveredRootPortValveResearchProfile:
          recoveredRootPortValveProfile,
      }),
  });
  const provider =
    strongBridgeDeactivationExitProfile.maximumRatePerSec !== 0
      ? createMainWireNormalAdultFiveWallProviderWithVentricularLandStrongBridgeDeactivationExitV1(
          ids.strongBridgeDeactivationExitProfileId,
          ids.sourceVelocityDistortionProfileId,
          ids.sourceTwitchRetentionCandidateId,
          ids.trefForceLoadProfileId,
          ids.sarcomereReferenceProfileId,
          ids.kuwProfileId,
        )
      : sourceVelocityDistortionProfile.aeffScaleFromIntactHumanSource !== 1
        ? createMainWireNormalAdultFiveWallProviderWithVentricularLandSourceVelocityDistortionV1(
            ids.sourceVelocityDistortionProfileId,
            ids.sourceTwitchRetentionCandidateId,
            ids.trefForceLoadProfileId,
            ids.sarcomereReferenceProfileId,
            ids.kuwProfileId,
          )
        : trefForceLoadProfile.trefScaleFromRetainedCandidate !== 1
          ? createMainWireNormalAdultFiveWallProviderWithVentricularLandSourceTwitchRetentionTrefForceLoadV1(
              ids.sourceTwitchRetentionCandidateId,
              ids.trefForceLoadProfileId,
              ids.sarcomereReferenceProfileId,
              ids.kuwProfileId,
            )
          : sourceTwitchRetentionCandidate.changedKineticParameters.length === 0
            ? createMainWireNormalAdultFiveWallProviderWithVentricularLandCalciumSensitivityLengthProfileV1(
                ids.calciumSensitivityLengthProfileId,
                ids.sarcomereReferenceProfileId,
                ids.kuwProfileId,
              )
            : createMainWireNormalAdultFiveWallProviderWithVentricularLandSourceTwitchRetentionCandidateV1(
                ids.sourceTwitchRetentionCandidateId,
                ids.sarcomereReferenceProfileId,
                ids.kuwProfileId,
              );
  const bloodVolume = resolveMainWireNormalAdultBloodVolumeResearchPointV1(
    runtime,
    ids.stressedVenousVolumePointId,
  );
  return Object.freeze({
    kuwProfile,
    complianceProfile,
    placementProfile,
    rootInertanceProfile,
    aorticValveResearchProfile,
    recoveredRootPortValveProfile,
    sarcomereReferenceProfile,
    calciumSensitivityLengthProfile,
    sourceTwitchRetentionCandidate,
    circulatoryLoadPoint,
    trefForceLoadProfile,
    sourceVelocityDistortionProfile,
    strongBridgeDeactivationExitProfile,
    runtime,
    provider,
    bloodVolume,
  });
}

function runMainWireNormalAdultFiveWallAorticOutflowLandCoppiniResolvedAssemblyV1(
  options: MainWireNormalAdultFiveWallAorticOutflowResearchOptionsV1,
  assembly: MainWireNormalAdultFiveWallAorticOutflowLandCoppiniNonCalciumAssemblyV1,
  calciumDriveParams: FiveWallNormalCalciumDriveParamsV1,
  identityMismatchMessage: string,
  executionControl?: MainWireNormalAdultFiveWallPeriodicExecutionControlV1,
): MainWireNormalAdultFiveWallPeriodicResultV1 {
  const periodicResult =
    runMainWireNormalAdultFiveWallPeriodicSteadyResolvedRuntimeV1(
      Object.freeze({
        dtSec: options.dtSec,
        ...(options.maximumBeatCount === undefined
          ? {}
          : { maximumBeatCount: options.maximumBeatCount }),
        laSlsMode: "on" as const,
        pericardiumMode: "on" as const,
        pericardiumCase: "healthy-slack" as const,
        initialization: "canonical" as const,
        valveDiseaseBracketIds: Object.freeze([]),
      }),
      assembly.runtime,
      Object.freeze({
        provider: assembly.provider,
        bloodVolumeOperatingPoint: assembly.bloodVolume.operatingPoint,
        calciumDriveParams,
      }),
      executionControl,
    );
  if (
    periodicResult.protocolIdentity.calciumDrive.parameterSetId !==
      calciumDriveParams.parameterSetId ||
    periodicResult.protocolIdentity.mechanicsProvider.parameterIdentityHash !==
      assembly.provider.parameterIdentityHash ||
    periodicResult.protocolComponentHashes.circulationRuntimeStableHash !==
      hashProtocolValue(assembly.runtime)
  )
    throw new Error(identityMismatchMessage);
  return periodicResult;
}

/** Primary-repository Coppini calcium trace × whole-organ kuw × Windkessel. */
export function runMainWireNormalAdultFiveWallAorticOutflowLandCoppiniSourceTraceWindkesselResearchV1(
  options: MainWireNormalAdultFiveWallAorticOutflowResearchOptionsV1,
  kuwProfileId: MainWireVentricularLandWholeOrganKuwProfileIdV1,
  complianceProfileId: MainWireArterialCompliancePhysiologyProfileIdV1,
  placementProfileId: MainWireAorticCharacteristicResistancePlacementProfileIdV1 | null,
  rootInertanceProfileId: MainWireAorticRootInertanceResearchProfileIdV1 | null,
  sarcomereReferenceProfileId: MainWireVentricularLandSarcomereReferenceProfileIdV1 = "land-sarcomere-reference-canonical",
  calciumSensitivityLengthProfileId: MainWireVentricularLandCalciumSensitivityLengthProfileIdV1 = "land-beta1-canonical",
  sourceTwitchRetentionCandidateId: MainWireVentricularLandSourceTwitchRetentionCandidateIdV1 = "source-twitch-retention-canonical",
  circulatoryLoadPointId: MainWireNormalAdultFiveWallCirculatoryLoadPointIdV1 = "baseline",
  stressedVenousVolumePointId: MainWireNormalAdultStressedVenousVolumeResearchPointIdV1 = "baseline",
  trefForceLoadProfileId: MainWireVentricularLandTrefForceLoadProfileIdV1 = "tref-force-load-baseline",
  sourceVelocityDistortionProfileId: MainWireVentricularLandSourceVelocityDistortionProfileIdV1 = "source-Aeff-canonical",
  strongBridgeDeactivationExitProfileId: MainWireVentricularLandStrongBridgeDeactivationExitProfileIdV1 = "strong-to-blocked-deactivation-off",
  atrioventricularDelayProfileId: MainWireAtrioventricularDelayProfileIdV1 = "coppini-source-atrioventricular-delay-160ms",
  aorticValveResearchProfileId: MainWireAorticValveResearchProfileIdV1 | null = null,
  recoveredRootPortValveProfileId: MainWireAorticRecoveredRootPortValveProfileIdV1 | null = null,
): MainWireNormalAdultFiveWallAorticOutflowLandCoppiniSourceTraceWindkesselResearchRunV1 {
  assertExactAorticOutflowResearchOptions(options);
  const assembly =
    resolveMainWireNormalAdultFiveWallAorticOutflowLandCoppiniNonCalciumAssemblyV1(
      Object.freeze({
        kuwProfileId,
        complianceProfileId,
        placementProfileId,
        rootInertanceProfileId,
        sarcomereReferenceProfileId,
        calciumSensitivityLengthProfileId,
        sourceTwitchRetentionCandidateId,
        circulatoryLoadPointId,
        stressedVenousVolumePointId,
        trefForceLoadProfileId,
        sourceVelocityDistortionProfileId,
        strongBridgeDeactivationExitProfileId,
        aorticValveResearchProfileId,
        recoveredRootPortValveProfileId,
      }),
    );
  const atrioventricularDelayProfile =
    resolveMainWireAtrioventricularDelayProfileV1(
      atrioventricularDelayProfileId,
    );
  const calciumDriveParams =
    resolveMainWireAtrioventricularDelayCalciumParamsV1(
      atrioventricularDelayProfileId,
    );
  const periodicResult =
    runMainWireNormalAdultFiveWallAorticOutflowLandCoppiniResolvedAssemblyV1(
      options,
      assembly,
      calciumDriveParams,
      "Land/Coppini source-trace Windkessel identity mismatch",
    );
  const {
    kuwProfile,
    complianceProfile,
    placementProfile,
    rootInertanceProfile,
    aorticValveResearchProfile,
    recoveredRootPortValveProfile,
    sarcomereReferenceProfile,
    calciumSensitivityLengthProfile,
    sourceTwitchRetentionCandidate,
    circulatoryLoadPoint,
    trefForceLoadProfile,
    sourceVelocityDistortionProfile,
    strongBridgeDeactivationExitProfile,
    bloodVolume,
  } = assembly;
  return Object.freeze({
    configurationRole:
      "fixed-aortic-outflow-land-coppini-source-trace-windkessel-arm" as const,
    kuwProfile,
    sourceTraceProfile:
      MAIN_WIRE_VENTRICULAR_CALCIUM_LAND_COPPINI_SOURCE_TRACE_PROFILE_V1,
    sarcomereReferenceProfile,
    calciumSensitivityLengthProfile,
    sourceTwitchRetentionCandidate,
    trefForceLoadProfile,
    sourceVelocityDistortionProfile,
    strongBridgeDeactivationExitProfile,
    atrioventricularDelayProfile,
    circulatoryLoadPoint,
    stressedVenousVolumePoint: bloodVolume.point,
    complianceProfile,
    placementProfile,
    rootInertanceProfile,
    aorticValveResearchProfile,
    recoveredRootPortValveProfile,
    calciumDriveParams,
    periodicResult,
    claim: Object.freeze({
      sourceResearchRunnerOnly: true as const,
      independentCanonicalColdStart: true as const,
      warmStartApplied: false as const,
      genericParameterPatchAccepted: false as const,
      valveDiseaseBracketApplied: false as const,
      bloodVolumeChanged: stressedVenousVolumePointId !== "baseline",
      systemicOrPulmonaryResistanceChanged:
        circulatoryLoadPoint.systemicResistanceScaleFromBaseline !== 1
        || circulatoryLoadPoint.pulmonaryResistanceScaleFromBaseline !== 1,
      arterialStiffnessLoadScaleChanged:
        circulatoryLoadPoint.arterialStiffnessScaleFromBaseline !== 1,
      aorticValveConstitutiveLawChanged:
        aorticValveResearchProfile !== null
        || recoveredRootPortValveProfile !== null,
      aorticValvePressureStationOwnershipChanged:
        recoveredRootPortValveProfile !== null,
      aorticMaximumForwardEoaChanged: false as const,
      sourceFittedAeffChanged:
        sourceVelocityDistortionProfile.aeffScaleFromIntactHumanSource !== 1,
      sourceWholeOrganTrefChanged:
        sourceTwitchRetentionCandidate.ventricularTrefScaleFromSource !== 1
        || trefForceLoadProfile.trefScaleFromRetainedCandidate !== 1
        || strongBridgeDeactivationExitProfile
          .trefScaleFromUncompensatedBase !== 1,
      primaryNumericSourceCalciumTraceUsed: true as const,
      sourceLandParametersOutsideExplicitResearchAxesChanged: false as const,
      sourceLandBeta1Changed:
        calciumSensitivityLengthProfile.beta1ScaleFromSource !== 1,
      sourceLandTwitchRetentionParametersChanged:
        sourceTwitchRetentionCandidate.changedKineticParameters.length !== 0,
      sourceLandTrefForceLoadChanged:
        trefForceLoadProfile.trefScaleFromRetainedCandidate !== 1,
      sourceLandVelocityDistortionChanged:
        sourceVelocityDistortionProfile.aeffScaleFromIntactHumanSource !== 1,
      sourceLandStrongBridgeDeactivationExitChanged:
        strongBridgeDeactivationExitProfile.maximumRatePerSec !== 0,
      sourceLandStrongBridgeDeactivationExitPeakCompensationChanged:
        strongBridgeDeactivationExitProfile
          .trefScaleFromUncompensatedBase !== 1,
      atrioventricularDelayChanged:
        !atrioventricularDelayProfile.sourceAtrioventricularDelayRetained,
      sourceTwitchRetentionCandidateDerivedFromIsometricOnly:
        !sourceTwitchRetentionCandidate
          .loadedOrHemodynamicOutcomeUsedToDeriveCandidate,
      sourceTwitchRetentionCandidateInformedByPriorLoadedEnvelope:
        sourceTwitchRetentionCandidate
          .loadedOrHemodynamicOutcomeUsedToDeriveCandidate,
      referenceLengthIsometricLandValuesChanged: false as const,
      referenceLengthIsometricPeakTargetChangedByTrefForceLoad:
        trefForceLoadProfile.trefScaleFromRetainedCandidate !== 1,
      landSarcomereReferenceCouplingChanged:
        sarcomereReferenceProfile.landSlackStretchScaleFromBaseline !== 1,
      calciumOrMechanicsStateAdded: false as const,
      acceptedStateOrCheckpointTopologyChanged: false as const,
      exactProtocolIdentityIncludesAllExplicitFactors: true as const,
    }),
  });
}

type MainWireNormalAdultFiveWallAorticOutflowV10ReferenceAssemblyExecutionV1 =
  Readonly<{
    reference: typeof MAIN_WIRE_AORTIC_OUTFLOW_V10_HEART_RATE_CALCIUM_REFERENCE_NON_CALCIUM_ASSEMBLY_V1;
    assembly: MainWireNormalAdultFiveWallAorticOutflowLandCoppiniNonCalciumAssemblyV1;
    placementProfile: MainWireAorticCharacteristicResistancePlacementProfileV1;
    rootInertanceProfile: MainWireAorticRootInertanceResearchProfileV1;
    aorticValveResearchProfile: MainWireAorticValveResearchProfileV1;
    recoveredRootPortValveProfile: MainWireAorticRecoveredRootPortValveProfileV1;
    periodicResult: MainWireNormalAdultFiveWallPeriodicResultV1;
    exactAssemblyAudit: Readonly<{
      mechanicsProviderParameterIdentityHash: string;
      circulationRuntimeStableHash: string;
      bloodVolumeOperatingPointStableHash: string;
      calciumDriveFixedParamsStableHash: string;
    }>;
  }>;

type MainWireNormalAdultFiveWallAorticOutflowV10ReferenceAssemblyMismatchMessagesV1 =
  Readonly<{
    protocolIdentity: string;
    nonCalciumAssemblyIdentity: string;
    exactProtocolReadback: string;
  }>;

/**
 * Private execution boundary for experiments that change only a fixed,
 * catalog-resolved calcium profile around the V10 reference non-Ca assembly.
 */
function runMainWireNormalAdultFiveWallAorticOutflowV10ReferenceAssemblyV1(
  options: MainWireNormalAdultFiveWallAorticOutflowResearchOptionsV1,
  calciumDriveParams: FiveWallNormalCalciumDriveParamsV1,
  expectedHeartRateBpm: number,
  mismatchMessages: MainWireNormalAdultFiveWallAorticOutflowV10ReferenceAssemblyMismatchMessagesV1,
  executionControl?: MainWireNormalAdultFiveWallPeriodicExecutionControlV1,
): MainWireNormalAdultFiveWallAorticOutflowV10ReferenceAssemblyExecutionV1 {
  const reference =
    MAIN_WIRE_AORTIC_OUTFLOW_V10_HEART_RATE_CALCIUM_REFERENCE_NON_CALCIUM_ASSEMBLY_V1;
  const assembly =
    resolveMainWireNormalAdultFiveWallAorticOutflowLandCoppiniNonCalciumAssemblyV1(
      Object.freeze({
        kuwProfileId: reference.kuwProfileId,
        complianceProfileId: reference.complianceProfileId,
        placementProfileId:
          reference.characteristicResistancePlacementProfileId,
        rootInertanceProfileId: reference.rootInertanceProfileId,
        sarcomereReferenceProfileId: reference.sarcomereReferenceProfileId,
        calciumSensitivityLengthProfileId:
          reference.calciumSensitivityLengthProfileId,
        sourceTwitchRetentionCandidateId: reference.twitchRetentionCandidateId,
        circulatoryLoadPointId: "baseline" as const,
        stressedVenousVolumePointId: "baseline" as const,
        trefForceLoadProfileId: reference.trefForceLoadProfileId,
        sourceVelocityDistortionProfileId:
          reference.sourceVelocityDistortionProfileId,
        strongBridgeDeactivationExitProfileId:
          reference.strongBridgeDeactivationExitProfileId,
        aorticValveResearchProfileId: reference.pressureRecoveryProfileId,
        recoveredRootPortValveProfileId:
          reference.recoveredRootPortValveProfileId,
      }),
    );
  const periodicResult =
    runMainWireNormalAdultFiveWallAorticOutflowLandCoppiniResolvedAssemblyV1(
      options,
      assembly,
      calciumDriveParams,
      mismatchMessages.protocolIdentity,
      executionControl,
    );
  const {
    placementProfile,
    rootInertanceProfile,
    aorticValveResearchProfile,
    recoveredRootPortValveProfile,
  } = assembly;
  if (
    placementProfile === null ||
    rootInertanceProfile === null ||
    aorticValveResearchProfile === null ||
    recoveredRootPortValveProfile === null ||
    assembly.kuwProfile.profileId !== reference.kuwProfileId ||
    assembly.sarcomereReferenceProfile.profileId !==
      reference.sarcomereReferenceProfileId ||
    assembly.calciumSensitivityLengthProfile.profileId !==
      reference.calciumSensitivityLengthProfileId ||
    assembly.sourceTwitchRetentionCandidate.candidateId !==
      reference.twitchRetentionCandidateId ||
    assembly.trefForceLoadProfile.profileId !==
      reference.trefForceLoadProfileId ||
    assembly.sourceVelocityDistortionProfile.profileId !==
      reference.sourceVelocityDistortionProfileId ||
    assembly.strongBridgeDeactivationExitProfile.profileId !==
      reference.strongBridgeDeactivationExitProfileId ||
    assembly.complianceProfile.profileId !== reference.complianceProfileId ||
    placementProfile.profileId !==
      reference.characteristicResistancePlacementProfileId ||
    rootInertanceProfile.profileId !== reference.rootInertanceProfileId ||
    aorticValveResearchProfile.profileId !==
      reference.pressureRecoveryProfileId ||
    recoveredRootPortValveProfile.profileId !==
      reference.recoveredRootPortValveProfileId ||
    assembly.circulatoryLoadPoint.pointId !== "baseline" ||
    assembly.bloodVolume.point.pointId !== "baseline" ||
    periodicResult.valveResearchInput.valves.AoV.maximumForwardEoaCm2 !==
      reference.aorticMaximumForwardEoaCm2
  ) {
    throw new Error(mismatchMessages.nonCalciumAssemblyIdentity);
  }
  const expectedCalciumHash = hashProtocolValue(calciumDriveParams);
  const expectedBloodVolumeHash = hashProtocolValue(
    assembly.bloodVolume.operatingPoint.identity,
  );
  if (
    periodicResult.claim.heartRateBpm !== expectedHeartRateBpm ||
    periodicResult.protocolComponentHashes.calciumDriveFixedParamsStableHash !==
      expectedCalciumHash ||
    periodicResult.protocolComponentHashes
      .bloodVolumeOperatingPointStableHash !== expectedBloodVolumeHash ||
    periodicResult.protocolIdentity.mechanicsProvider.parameterIdentityHash !==
      assembly.provider.parameterIdentityHash ||
    (expectedHeartRateBpm !== 60 &&
      periodicResult.terminalCycleBoundaryWarmStart !== null)
  ) {
    throw new Error(mismatchMessages.exactProtocolReadback);
  }
  return Object.freeze({
    reference,
    assembly,
    placementProfile,
    rootInertanceProfile,
    aorticValveResearchProfile,
    recoveredRootPortValveProfile,
    periodicResult,
    exactAssemblyAudit: Object.freeze({
      mechanicsProviderParameterIdentityHash:
        assembly.provider.parameterIdentityHash,
      circulationRuntimeStableHash:
        periodicResult.protocolComponentHashes.circulationRuntimeStableHash,
      bloodVolumeOperatingPointStableHash:
        periodicResult.protocolComponentHashes
          .bloodVolumeOperatingPointStableHash,
      calciumDriveFixedParamsStableHash:
        periodicResult.protocolComponentHashes
          .calciumDriveFixedParamsStableHash,
    }),
  });
}

/**
 * Fixed heart-rate/calcium hypothesis on the V10-derived non-calcium assembly.
 * The calcium profile is the sole discrete experimental input; every mechanics,
 * vascular, blood-volume, and aortic-port selection is fixed here by ID.
 */
export function runMainWireNormalAdultFiveWallAorticOutflowV10HeartRateCalciumHypothesisResearchV1(
  options: MainWireNormalAdultFiveWallAorticOutflowResearchOptionsV1,
  profileId: MainWireVentricularCalciumHeartRateHypothesisProfileIdV1,
): MainWireNormalAdultFiveWallAorticOutflowV10HeartRateCalciumHypothesisResearchRunV1 {
  assertExactAorticOutflowResearchOptions(options);
  const calciumHypothesisProfile =
    resolveMainWireVentricularCalciumHeartRateHypothesisProfileV1(profileId);
  const calciumDriveParams =
    resolveMainWireVentricularCalciumHeartRateHypothesisParamsV1(profileId);
  if (
    calciumDriveParams.cycleLengthSec !==
      calciumHypothesisProfile.cycleLengthSec ||
    calciumDriveParams.atrioventricularDelaySec !==
      calciumHypothesisProfile.atrioventricularDelaySec ||
    60 / calciumDriveParams.cycleLengthSec !==
      calciumHypothesisProfile.heartRateBpm
  ) {
    throw new Error(
      "V10 heart-rate calcium hypothesis profile/parameter identity mismatch",
    );
  }
  const {
    reference,
    assembly,
    placementProfile,
    rootInertanceProfile,
    aorticValveResearchProfile,
    recoveredRootPortValveProfile,
    periodicResult,
    exactAssemblyAudit,
  } = runMainWireNormalAdultFiveWallAorticOutflowV10ReferenceAssemblyV1(
    options,
    calciumDriveParams,
    calciumHypothesisProfile.heartRateBpm,
    Object.freeze({
      protocolIdentity:
        "V10 heart-rate calcium hypothesis protocol identity mismatch",
      nonCalciumAssemblyIdentity:
        "V10 heart-rate non-calcium assembly identity mismatch",
      exactProtocolReadback:
        "V10 heart-rate exact protocol readback mismatch",
    }),
  );
  return Object.freeze({
    configurationRole:
      "fixed-v10-reference-non-calcium-heart-rate-calcium-hypothesis-arm" as const,
    referenceNonCalciumAssembly: reference,
    calciumHypothesisProfile,
    kuwProfile: assembly.kuwProfile,
    sarcomereReferenceProfile: assembly.sarcomereReferenceProfile,
    calciumSensitivityLengthProfile: assembly.calciumSensitivityLengthProfile,
    sourceTwitchRetentionCandidate: assembly.sourceTwitchRetentionCandidate,
    trefForceLoadProfile: assembly.trefForceLoadProfile,
    sourceVelocityDistortionProfile: assembly.sourceVelocityDistortionProfile,
    strongBridgeDeactivationExitProfile:
      assembly.strongBridgeDeactivationExitProfile,
    circulatoryLoadPoint: assembly.circulatoryLoadPoint,
    stressedVenousVolumePoint: assembly.bloodVolume.point,
    complianceProfile: assembly.complianceProfile,
    placementProfile,
    rootInertanceProfile,
    aorticValveResearchProfile,
    recoveredRootPortValveProfile,
    calciumDriveParams,
    periodicResult,
    exactAssemblyAudit,
    claim: Object.freeze({
      sourceResearchRunnerOnly: true as const,
      independentCanonicalColdStart: true as const,
      warmStartApplied: false as const,
      genericParameterPatchAccepted: false as const,
      fixedCalciumHypothesisProfileOnly: true as const,
      valveDiseaseBracketApplied: false as const,
      referenceAssemblyDerivedFromCandidateV10: true as const,
      fullV10CandidateIdentityRetained: false as const,
      V10ReferenceNonCalciumAssemblyHeldExactly: true as const,
      V10CalciumAndAtrioventricularTimingIdentityHeldFixed: false as const,
      ventricularNumericSourceTraceUsed:
        calciumHypothesisProfile.ventricularNumericSourceTraceUsed,
      oldLandCoppiniSourceTraceProfileReturned: false as const,
      oldAtrioventricularDelayProfileReturned: false as const,
      circulatoryLoadHeldAtBaseline: true as const,
      bloodVolumeHeldAtBaseline: true as const,
      systemicOrBloodVolumeRecalibrationApplied: false as const,
      aorticMaximumForwardEoaHeldAtCm2: 3.5 as const,
      calciumOrMechanicsStateAdded: false as const,
      acceptedStateOrCheckpointTopologyChanged: false as const,
      nonHr60V3WarmStartEmissionSuppressed: true as const,
      nonHr60V3WarmStartRestoreRejected: true as const,
      exactProtocolIdentityIncludesActiveCalciumAndAllNonCalciumFactors:
        true as const,
      parameterSearchOrFitting: false as const,
      clinicalValidationClaimed: false as const,
      canonicalAdoptionEstablished: false as const,
    }),
  });
}

type MainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaResolvedProfileV1 =
  Readonly<{
    matchedAlphaTimingPolicyBridgeProfile:
      MainWireVentricularCalciumMatchedAlphaTimingPolicyBridgeProfileV1;
    calciumDriveParams: FiveWallNormalCalciumDriveParamsV1;
  }>;

function resolveMainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaProfileV1(
  profileId: MainWireVentricularCalciumMatchedAlphaTimingPolicyBridgeProfileIdV1,
): MainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaResolvedProfileV1 {
  const arm =
    resolveMainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeArmV1(
      profileId,
    );
  const matchedAlphaTimingPolicyBridgeProfile =
    resolveMainWireVentricularCalciumMatchedAlphaTimingPolicyBridgeProfileV1(
      profileId,
    );
  const calciumDriveParams =
    resolveMainWireVentricularCalciumMatchedAlphaTimingPolicyBridgeParamsV1(
      profileId,
    );
  if (
    arm.armId !== profileId ||
    arm.calciumProfileId !== profileId ||
    arm.timingPolicy !== matchedAlphaTimingPolicyBridgeProfile.timingPolicy ||
    arm.heartRateBpm !==
      matchedAlphaTimingPolicyBridgeProfile.heartRateBpm ||
    arm.cycleLengthSec !==
      matchedAlphaTimingPolicyBridgeProfile.cycleLengthSec ||
    calciumDriveParams.cycleLengthSec !==
      matchedAlphaTimingPolicyBridgeProfile.cycleLengthSec ||
    60 / calciumDriveParams.cycleLengthSec !==
      matchedAlphaTimingPolicyBridgeProfile.heartRateBpm ||
    calciumDriveParams.atrioventricularDelaySec !==
      matchedAlphaTimingPolicyBridgeProfile.atrioventricularDelaySec ||
    calciumDriveParams.ventricular.riseTimeConstantSec !==
      matchedAlphaTimingPolicyBridgeProfile.ventricularRiseTimeConstantSec ||
    calciumDriveParams.ventricular.decayTimeConstantSec !==
      matchedAlphaTimingPolicyBridgeProfile.ventricularDecayTimeConstantSec ||
    calciumDriveParams.ventricular.electricalToCalciumDelaySec !==
      matchedAlphaTimingPolicyBridgeProfile
        .ventricularElectricalToCalciumDelaySec ||
    calciumDriveParams.ventricular.diastolicCalciumUM !==
      matchedAlphaTimingPolicyBridgeProfile.ventricularDiastolicCalciumUM ||
    calciumDriveParams.ventricular.diastolicCalciumUM
      + calciumDriveParams.ventricular.peakAmplitudeUM !==
      matchedAlphaTimingPolicyBridgeProfile.ventricularPeakCalciumUM
  ) {
    throw new Error(
      "V10 matched-alpha timing-policy bridge profile/parameter identity mismatch",
    );
  }
  return Object.freeze({
    matchedAlphaTimingPolicyBridgeProfile,
    calciumDriveParams,
  });
}

function runMainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaResolvedProfileV1(
  options: MainWireNormalAdultFiveWallAorticOutflowResearchOptionsV1,
  resolvedProfile: MainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaResolvedProfileV1,
  executionControl?: MainWireNormalAdultFiveWallPeriodicExecutionControlV1,
): MainWireNormalAdultFiveWallAorticOutflowV10ReferenceAssemblyExecutionV1 {
  const execution =
    runMainWireNormalAdultFiveWallAorticOutflowV10ReferenceAssemblyV1(
      options,
      resolvedProfile.calciumDriveParams,
      resolvedProfile.matchedAlphaTimingPolicyBridgeProfile.heartRateBpm,
      Object.freeze({
        protocolIdentity:
          "V10 matched-alpha timing-policy bridge protocol identity mismatch",
        nonCalciumAssemblyIdentity:
          "V10 matched-alpha timing-policy bridge non-calcium assembly identity mismatch",
        exactProtocolReadback:
          "V10 matched-alpha timing-policy bridge exact protocol readback mismatch",
      }),
      executionControl,
    );
  if (
    execution.reference !==
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_REFERENCE_NON_CALCIUM_ASSEMBLY_V1
  ) {
    throw new Error(
      "V10 matched-alpha timing-policy bridge reference assembly identity mismatch",
    );
  }
  return execution;
}

/**
 * Matched-alpha timing-policy bridge on the fixed V10 reference non-Ca
 * assembly. The profile ID is the only experimental input beyond integration
 * resolution and execution beat limit.
 */
export function runMainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaTimingPolicyBridgeResearchV1(
  options: MainWireNormalAdultFiveWallAorticOutflowResearchOptionsV1,
  profileId: MainWireVentricularCalciumMatchedAlphaTimingPolicyBridgeProfileIdV1,
): MainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaTimingPolicyBridgeResearchRunV1 {
  assertExactAorticOutflowResearchOptions(options);
  const resolvedProfile =
    resolveMainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaProfileV1(
      profileId,
    );
  const {
    matchedAlphaTimingPolicyBridgeProfile,
    calciumDriveParams,
  } = resolvedProfile;
  const {
    assembly,
    placementProfile,
    rootInertanceProfile,
    aorticValveResearchProfile,
    recoveredRootPortValveProfile,
    periodicResult,
    exactAssemblyAudit,
  } = runMainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaResolvedProfileV1(
    options,
    resolvedProfile,
  );
  return Object.freeze({
    configurationRole:
      "fixed-v10-reference-non-calcium-matched-alpha-timing-policy-bridge-arm" as const,
    referenceNonCalciumAssembly:
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_REFERENCE_NON_CALCIUM_ASSEMBLY_V1,
    matchedAlphaTimingPolicyBridgeProfile,
    kuwProfile: assembly.kuwProfile,
    sarcomereReferenceProfile: assembly.sarcomereReferenceProfile,
    calciumSensitivityLengthProfile: assembly.calciumSensitivityLengthProfile,
    sourceTwitchRetentionCandidate: assembly.sourceTwitchRetentionCandidate,
    trefForceLoadProfile: assembly.trefForceLoadProfile,
    sourceVelocityDistortionProfile: assembly.sourceVelocityDistortionProfile,
    strongBridgeDeactivationExitProfile:
      assembly.strongBridgeDeactivationExitProfile,
    circulatoryLoadPoint: assembly.circulatoryLoadPoint,
    stressedVenousVolumePoint: assembly.bloodVolume.point,
    complianceProfile: assembly.complianceProfile,
    placementProfile,
    rootInertanceProfile,
    aorticValveResearchProfile,
    recoveredRootPortValveProfile,
    calciumDriveParams,
    periodicResult,
    exactAssemblyAudit,
    claim: Object.freeze({
      sourceResearchRunnerOnly: true as const,
      independentCanonicalColdStart: true as const,
      warmStartApplied: false as const,
      genericParameterPatchAccepted: false as const,
      fixedMatchedAlphaTimingPolicyBridgeProfileOnly: true as const,
      valveDiseaseBracketApplied: false as const,
      referenceAssemblyDerivedFromCandidateV10: true as const,
      fullV10CandidateIdentityRetained: false as const,
      V10ReferenceNonCalciumAssemblyHeldExactly: true as const,
      V10CalciumAndAtrioventricularTimingIdentityHeldFixed: false as const,
      matchedAlphaWaveformFamilyHeldExactly: true as const,
      ventricularCalciumExtremaHeldExactly: true as const,
      ventricularElectricalToCalciumDelayHeldAtSec: 0.012 as const,
      atrioventricularDelayHeldAtSec: 0.12 as const,
      onlyVentricularRiseAndDecayTimeConstantsDifferAcrossTimingPolicy:
        true as const,
      oldLandCoppiniSourceTraceProfileReturned: false as const,
      oldAtrioventricularDelayProfileReturned: false as const,
      circulatoryLoadHeldAtBaseline: true as const,
      bloodVolumeHeldAtBaseline: true as const,
      systemicOrBloodVolumeRecalibrationApplied: false as const,
      aorticMaximumForwardEoaHeldAtCm2: 3.5 as const,
      calciumOrMechanicsStateAdded: false as const,
      acceptedStateOrCheckpointTopologyChanged: false as const,
      nonHr60V3WarmStartEmissionSuppressed: true as const,
      nonHr60V3WarmStartRestoreRejected: true as const,
      profileToCalciumParamsIdentityChecked: true as const,
      exactProtocolIdentityIncludesCalciumParamsAndAllNonCalciumFactors:
        true as const,
      parameterSearchOrFitting: false as const,
      clinicalValidationClaimed: false as const,
      canonicalAdoptionEstablished: false as const,
    }),
  });
}

/**
 * Fixed 48-second sentinel for the four matched-alpha bridge profiles. This
 * runner exposes no integration options: resolution and horizon are fixed so
 * periodic classification is an endpoint readback rather than an early stop.
 */
export function runMainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaTimingPolicyBridgeFixedPhysicalHorizonSentinelResearchV1(
  profileId: MainWireVentricularCalciumMatchedAlphaTimingPolicyBridgeProfileIdV1,
): MainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaTimingPolicyBridgeFixedPhysicalHorizonSentinelResearchRunV1 {
  if (arguments.length !== 1 || typeof profileId !== "string") {
    throw new Error(
      "matched-alpha fixed-horizon sentinel accepts only one fixed bridge profile ID and no execution options",
    );
  }
  const resolvedProfile =
    resolveMainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaProfileV1(
      profileId,
    );
  const {
    matchedAlphaTimingPolicyBridgeProfile,
    calciumDriveParams,
  } = resolvedProfile;
  const beatCount =
    matchedAlphaTimingPolicyBridgeProfile.heartRateBpm === 50
      ? 40 as const
      : 72 as const;
  const executionPolicy = Object.freeze({
    policyId:
      "matched-alpha-fixed-physical-horizon-48s-sentinel-v1" as const,
    fixedPhysicalHorizonSec:
      MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_FIXED_PHYSICAL_HORIZON_SENTINEL_SEC_V1,
    stepsPerCycle:
      MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_FIXED_PHYSICAL_HORIZON_SENTINEL_STEPS_PER_CYCLE_V1,
    minimumCompletedBeatCountBeforePeriodicTermination: beatCount,
    maximumBeatCount: beatCount,
    periodicTerminationBeforeFixedHorizonAccepted: false as const,
  });
  const {
    assembly,
    placementProfile,
    rootInertanceProfile,
    aorticValveResearchProfile,
    recoveredRootPortValveProfile,
    periodicResult,
    exactAssemblyAudit,
  } = runMainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaResolvedProfileV1(
    Object.freeze({
      dtSec:
        matchedAlphaTimingPolicyBridgeProfile.cycleLengthSec
        / executionPolicy.stepsPerCycle,
      maximumBeatCount: executionPolicy.maximumBeatCount,
    }),
    resolvedProfile,
    Object.freeze({
      minimumCompletedBeatCountBeforePeriodicTermination:
        executionPolicy.minimumCompletedBeatCountBeforePeriodicTermination,
    }),
  );
  if (
    periodicResult.stepsPerBeat !== executionPolicy.stepsPerCycle ||
    periodicResult.requestedMaximumBeatCount !==
      executionPolicy.maximumBeatCount ||
    periodicResult.completedBeatCount !== executionPolicy.maximumBeatCount ||
    periodicResult.completedBeatCount
      * matchedAlphaTimingPolicyBridgeProfile.cycleLengthSec !==
      executionPolicy.fixedPhysicalHorizonSec ||
    periodicResult.integrationCompletedWithoutFailure !== true ||
    periodicResult.failure !== null ||
    periodicResult.retainedCompleteBeats.at(-1)?.beatIndex !==
      executionPolicy.maximumBeatCount
  ) {
    throw new Error(
      "matched-alpha fixed-horizon sentinel did not complete its exact 48-second execution policy",
    );
  }
  return Object.freeze({
    configurationRole:
      "fixed-v10-reference-non-calcium-matched-alpha-timing-policy-bridge-48s-sentinel-arm" as const,
    referenceNonCalciumAssembly:
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_REFERENCE_NON_CALCIUM_ASSEMBLY_V1,
    matchedAlphaTimingPolicyBridgeProfile,
    kuwProfile: assembly.kuwProfile,
    sarcomereReferenceProfile: assembly.sarcomereReferenceProfile,
    calciumSensitivityLengthProfile: assembly.calciumSensitivityLengthProfile,
    sourceTwitchRetentionCandidate: assembly.sourceTwitchRetentionCandidate,
    trefForceLoadProfile: assembly.trefForceLoadProfile,
    sourceVelocityDistortionProfile: assembly.sourceVelocityDistortionProfile,
    strongBridgeDeactivationExitProfile:
      assembly.strongBridgeDeactivationExitProfile,
    circulatoryLoadPoint: assembly.circulatoryLoadPoint,
    stressedVenousVolumePoint: assembly.bloodVolume.point,
    complianceProfile: assembly.complianceProfile,
    placementProfile,
    rootInertanceProfile,
    aorticValveResearchProfile,
    recoveredRootPortValveProfile,
    calciumDriveParams,
    periodicResult,
    exactAssemblyAudit,
    executionPolicy,
    claim: Object.freeze({
      sourceResearchRunnerOnly: true as const,
      independentCanonicalColdStart: true as const,
      warmStartApplied: false as const,
      publicExecutionOptionsAccepted: false as const,
      genericParameterPatchAccepted: false as const,
      fixedMatchedAlphaTimingPolicyBridgeProfileOnly: true as const,
      fixedPhysicalHorizonSentinelOnly: true as const,
      fixedPhysicalHorizonSec: 48 as const,
      fixedStepsPerCycle: 4_000 as const,
      minimumAndMaximumBeatCountsEqual: true as const,
      periodicTerminationBeforeFixedHorizonAccepted: false as const,
      endpointPeriodicClassificationStillRequiredForP1Claim: true as const,
      executionHorizonIsExactRunnerPolicyNotPhysiologicalProtocolParameter:
        true as const,
      valveDiseaseBracketApplied: false as const,
      referenceAssemblyDerivedFromCandidateV10: true as const,
      fullV10CandidateIdentityRetained: false as const,
      V10ReferenceNonCalciumAssemblyHeldExactly: true as const,
      matchedAlphaWaveformFamilyHeldExactly: true as const,
      ventricularCalciumExtremaHeldExactly: true as const,
      circulatoryLoadHeldAtBaseline: true as const,
      bloodVolumeHeldAtBaseline: true as const,
      systemicOrBloodVolumeRecalibrationApplied: false as const,
      aorticMaximumForwardEoaHeldAtCm2: 3.5 as const,
      calciumOrMechanicsStateAdded: false as const,
      acceptedStateOrCheckpointTopologyChanged: false as const,
      nonHr60V3WarmStartEmissionSuppressed: true as const,
      nonHr60V3WarmStartRestoreRejected: true as const,
      profileToCalciumParamsIdentityChecked: true as const,
      exactProtocolIdentityIncludesCalciumParamsAndAllNonCalciumFactors:
        true as const,
      derivedAnalysisStored: false as const,
      parameterSearchOrFitting: false as const,
      clinicalValidationClaimed: false as const,
      canonicalAdoptionEstablished: false as const,
    }),
  });
}

/** Source-isometric calcium-amplitude/Tref pair × whole-organ coupling × RLC. */
export function runMainWireNormalAdultFiveWallAorticOutflowLandCoppiniAmplitudeTrefWindkesselResearchV1(
  options: MainWireNormalAdultFiveWallAorticOutflowResearchOptionsV1,
  pairId: MainWireVentricularLandCoppiniAmplitudeTrefPairIdV1,
  kuwProfileId: MainWireVentricularLandWholeOrganKuwProfileIdV1,
  complianceProfileId: MainWireArterialCompliancePhysiologyProfileIdV1,
  placementProfileId:
    MainWireAorticCharacteristicResistancePlacementProfileIdV1 | null,
  rootInertanceProfileId:
    MainWireAorticRootInertanceResearchProfileIdV1 | null,
  sarcomereReferenceProfileId:
    MainWireVentricularLandSarcomereReferenceProfileIdV1 =
      "land-sarcomere-reference-canonical",
): MainWireNormalAdultFiveWallAorticOutflowLandCoppiniAmplitudeTrefWindkesselResearchRunV1 {
  assertExactAorticOutflowResearchOptions(options);
  const amplitudeTrefPair =
    resolveMainWireVentricularLandCoppiniAmplitudeTrefPairV1(pairId);
  const kuwProfile = resolveMainWireVentricularLandWholeOrganKuwProfileV1(
    kuwProfileId,
  );
  const sarcomereReferenceProfile =
    resolveMainWireVentricularLandSarcomereReferenceProfileV1(
      sarcomereReferenceProfileId,
    );
  const complianceProfile =
    resolveMainWireArterialCompliancePhysiologyProfileV1(
      complianceProfileId,
    );
  const placementProfile = placementProfileId === null
    ? null
    : resolveMainWireAorticCharacteristicResistancePlacementProfileV1(
      placementProfileId,
    );
  const rootInertanceProfile = rootInertanceProfileId === null
    ? null
    : resolveMainWireAorticRootInertanceResearchProfileV1(
      rootInertanceProfileId,
    );
  const baselineRuntime = normalAdultMainWireRuntimeV1();
  const runtime: NonCoronaryCirculationRuntimeParamsV1 = Object.freeze({
    ...baselineRuntime,
    vascular: Object.freeze({
      ...baselineRuntime.vascular,
      systemicArterialStiffnessScaleFromGlobal:
        complianceProfile.arterialStiffnessScaleFromBaseline,
    }),
    ...(placementProfile === null
      ? {}
      : {
        aorticCharacteristicResistancePlacementResearchProfile:
          placementProfile,
      }),
    ...(rootInertanceProfile === null
      ? {}
      : { aorticRootInertanceResearchProfile: rootInertanceProfile }),
  });
  const provider =
    createMainWireNormalAdultFiveWallProviderWithVentricularLandCoppiniAmplitudeTrefPairV1(
      pairId,
      sarcomereReferenceProfileId,
      kuwProfileId,
    );
  const calciumDriveParams =
    resolveMainWireVentricularCalciumLandCoppiniAmplitudeParamsV1(
      amplitudeTrefPair.calciumAmplitudeProfileId,
    );
  const bloodVolumeOperatingPoint =
    resolveMainWireNormalAdultBloodVolumeOperatingPointV1(runtime);
  const periodicResult =
    runMainWireNormalAdultFiveWallPeriodicSteadyResolvedRuntimeV1(
      Object.freeze({
        dtSec: options.dtSec,
        ...(options.maximumBeatCount === undefined
          ? {}
          : { maximumBeatCount: options.maximumBeatCount }),
        laSlsMode: "on" as const,
        pericardiumMode: "on" as const,
        pericardiumCase: "healthy-slack" as const,
        initialization: "canonical" as const,
        valveDiseaseBracketIds: Object.freeze([]),
      }),
      runtime,
      Object.freeze({
        provider,
        bloodVolumeOperatingPoint,
        calciumDriveParams,
      }),
    );
  if (
    periodicResult.protocolIdentity.calciumDrive.parameterSetId
      !== calciumDriveParams.parameterSetId
    || periodicResult.protocolIdentity.mechanicsProvider.parameterIdentityHash
      !== provider.parameterIdentityHash
    || periodicResult.protocolComponentHashes.circulationRuntimeStableHash
      !== hashProtocolValue(runtime)
  ) throw new Error("Land/Coppini amplitude-Tref Windkessel identity mismatch");
  return Object.freeze({
    configurationRole:
      "fixed-aortic-outflow-land-coppini-amplitude-tref-windkessel-arm" as const,
    amplitudeTrefPair,
    kuwProfile,
    sarcomereReferenceProfile,
    complianceProfile,
    placementProfile,
    rootInertanceProfile,
    calciumDriveParams,
    periodicResult,
    claim: Object.freeze({
      sourceResearchRunnerOnly: true as const,
      independentCanonicalColdStart: true as const,
      warmStartApplied: false as const,
      genericParameterPatchAccepted: false as const,
      valveDiseaseBracketApplied: false as const,
      bloodVolumeChanged: false as const,
      aorticMaximumForwardEoaChanged: false as const,
      sourceLandParametersExceptTrefChanged: false as const,
      amplitudeAndTrefPairDerivedFromSourceIsometricPeakOnly: true as const,
      loadedOrHemodynamicOutcomeUsedToDerivePair: false as const,
      calciumOrMechanicsStateAdded: false as const,
      acceptedStateOrCheckpointTopologyChanged: false as const,
      exactProtocolIdentityIncludesAllSevenFactors: true as const,
    }),
  });
}

/**
 * Fixed interaction of the source-explicit whole-organ kuw bracket with the
 * existing exposure-preserving delayed-calcium ablation and Windkessel
 * structure. This is a causal interaction screen, not an activation-dispersion
 * adoption: the delayed mixture predates and remains separately identified
 * from any future whole-organ activation model.
 */
export function runMainWireNormalAdultFiveWallAorticOutflowWholeOrganKuwCalciumWindkesselResearchV1(
  options: MainWireNormalAdultFiveWallAorticOutflowResearchOptionsV1,
  kuwProfileId: MainWireVentricularLandWholeOrganKuwProfileIdV1,
  calciumProfileId:
    MainWireVentricularCalciumDelayedMixtureProfileIdV1 | null,
  complianceProfileId: MainWireArterialCompliancePhysiologyProfileIdV1,
  placementProfileId:
    MainWireAorticCharacteristicResistancePlacementProfileIdV1 | null,
  rootInertanceProfileId:
    MainWireAorticRootInertanceResearchProfileIdV1 | null,
): MainWireNormalAdultFiveWallAorticOutflowWholeOrganKuwCalciumWindkesselResearchRunV1 {
  assertExactAorticOutflowResearchOptions(options);
  const kuwProfile = resolveMainWireVentricularLandWholeOrganKuwProfileV1(
    kuwProfileId,
  );
  const calciumProfile = calciumProfileId === null
    ? null
    : resolveMainWireVentricularCalciumDelayedMixtureProfileV1(
      calciumProfileId,
    );
  const complianceProfile =
    resolveMainWireArterialCompliancePhysiologyProfileV1(
      complianceProfileId,
    );
  const placementProfile = placementProfileId === null
    ? null
    : resolveMainWireAorticCharacteristicResistancePlacementProfileV1(
      placementProfileId,
    );
  const rootInertanceProfile = rootInertanceProfileId === null
    ? null
    : resolveMainWireAorticRootInertanceResearchProfileV1(
      rootInertanceProfileId,
    );
  const baselineRuntime = normalAdultMainWireRuntimeV1();
  const runtime: NonCoronaryCirculationRuntimeParamsV1 = Object.freeze({
    ...baselineRuntime,
    vascular: Object.freeze({
      ...baselineRuntime.vascular,
      systemicArterialStiffnessScaleFromGlobal:
        complianceProfile.arterialStiffnessScaleFromBaseline,
    }),
    ...(placementProfile === null
      ? {}
      : {
        aorticCharacteristicResistancePlacementResearchProfile:
          placementProfile,
      }),
    ...(rootInertanceProfile === null
      ? {}
      : { aorticRootInertanceResearchProfile: rootInertanceProfile }),
  });
  const provider =
    createMainWireNormalAdultFiveWallProviderWithVentricularLandWholeOrganKuwProfileV1(
      kuwProfileId,
    );
  const calciumDriveParams = calciumProfileId === null
    ? FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1
    : resolveMainWireVentricularCalciumDelayedMixtureParamsV1(
      calciumProfileId,
    );
  const bloodVolumeOperatingPoint =
    resolveMainWireNormalAdultBloodVolumeOperatingPointV1(runtime);
  const periodicResult =
    runMainWireNormalAdultFiveWallPeriodicSteadyResolvedRuntimeV1(
      Object.freeze({
        dtSec: options.dtSec,
        ...(options.maximumBeatCount === undefined
          ? {}
          : { maximumBeatCount: options.maximumBeatCount }),
        laSlsMode: "on" as const,
        pericardiumMode: "on" as const,
        pericardiumCase: "healthy-slack" as const,
        initialization: "canonical" as const,
        valveDiseaseBracketIds: Object.freeze([]),
      }),
      runtime,
      Object.freeze({
        provider,
        bloodVolumeOperatingPoint,
        calciumDriveParams,
      }),
    );
  if (
    periodicResult.protocolIdentity.calciumDrive.parameterSetId
      !== calciumDriveParams.parameterSetId
    || periodicResult.protocolIdentity.mechanicsProvider.parameterIdentityHash
      !== provider.parameterIdentityHash
    || periodicResult.protocolComponentHashes.circulationRuntimeStableHash
      !== hashProtocolValue(runtime)
  ) throw new Error("whole-organ kuw/calcium/Windkessel identity mismatch");
  return Object.freeze({
    configurationRole:
      "fixed-aortic-outflow-whole-organ-kuw-calcium-windkessel-arm" as const,
    kuwProfile,
    calciumProfile,
    complianceProfile,
    placementProfile,
    rootInertanceProfile,
    calciumDriveParams,
    periodicResult,
    claim: Object.freeze({
      sourceResearchRunnerOnly: true as const,
      independentCanonicalColdStart: true as const,
      warmStartApplied: false as const,
      genericParameterPatchAccepted: false as const,
      valveDiseaseBracketApplied: false as const,
      bloodVolumeChanged: false as const,
      aorticMaximumForwardEoaChanged: false as const,
      sourceFittedAeffChanged: false as const,
      sourceWholeOrganTrefChanged: false as const,
      calciumOrMechanicsStateAdded: false as const,
      acceptedStateOrCheckpointTopologyChanged: false as const,
      exactProtocolIdentityIncludesAllFiveFactors: true as const,
    }),
  });
}

/** Fixed unresolved activation-distribution × kuw × Windkessel arm. */
export function runMainWireNormalAdultFiveWallAorticOutflowActivationDistributionWindkesselResearchV1(
  options: MainWireNormalAdultFiveWallAorticOutflowResearchOptionsV1,
  activationDistributionProfileId:
    MainWireVentricularCalciumActivationDistributionProfileIdV1,
  kuwProfileId: MainWireVentricularLandWholeOrganKuwProfileIdV1,
  complianceProfileId: MainWireArterialCompliancePhysiologyProfileIdV1,
  placementProfileId:
    MainWireAorticCharacteristicResistancePlacementProfileIdV1 | null,
  rootInertanceProfileId:
    MainWireAorticRootInertanceResearchProfileIdV1 | null,
): MainWireNormalAdultFiveWallAorticOutflowActivationDistributionWindkesselResearchRunV1 {
  assertExactAorticOutflowResearchOptions(options);
  const activationDistributionProfile =
    resolveMainWireVentricularCalciumActivationDistributionProfileV1(
      activationDistributionProfileId,
    );
  const kuwProfile = resolveMainWireVentricularLandWholeOrganKuwProfileV1(
    kuwProfileId,
  );
  const complianceProfile =
    resolveMainWireArterialCompliancePhysiologyProfileV1(
      complianceProfileId,
    );
  const placementProfile = placementProfileId === null
    ? null
    : resolveMainWireAorticCharacteristicResistancePlacementProfileV1(
      placementProfileId,
    );
  const rootInertanceProfile = rootInertanceProfileId === null
    ? null
    : resolveMainWireAorticRootInertanceResearchProfileV1(
      rootInertanceProfileId,
    );
  const baselineRuntime = normalAdultMainWireRuntimeV1();
  const runtime: NonCoronaryCirculationRuntimeParamsV1 = Object.freeze({
    ...baselineRuntime,
    vascular: Object.freeze({
      ...baselineRuntime.vascular,
      systemicArterialStiffnessScaleFromGlobal:
        complianceProfile.arterialStiffnessScaleFromBaseline,
    }),
    ...(placementProfile === null
      ? {}
      : {
        aorticCharacteristicResistancePlacementResearchProfile:
          placementProfile,
      }),
    ...(rootInertanceProfile === null
      ? {}
      : { aorticRootInertanceResearchProfile: rootInertanceProfile }),
  });
  const provider =
    createMainWireNormalAdultFiveWallProviderWithVentricularLandWholeOrganKuwProfileV1(
      kuwProfileId,
    );
  const calciumDriveParams =
    resolveMainWireVentricularCalciumActivationDistributionParamsV1(
      activationDistributionProfileId,
    );
  const bloodVolumeOperatingPoint =
    resolveMainWireNormalAdultBloodVolumeOperatingPointV1(runtime);
  const periodicResult =
    runMainWireNormalAdultFiveWallPeriodicSteadyResolvedRuntimeV1(
      Object.freeze({
        dtSec: options.dtSec,
        ...(options.maximumBeatCount === undefined
          ? {}
          : { maximumBeatCount: options.maximumBeatCount }),
        laSlsMode: "on" as const,
        pericardiumMode: "on" as const,
        pericardiumCase: "healthy-slack" as const,
        initialization: "canonical" as const,
        valveDiseaseBracketIds: Object.freeze([]),
      }),
      runtime,
      Object.freeze({
        provider,
        bloodVolumeOperatingPoint,
        calciumDriveParams,
      }),
    );
  if (
    periodicResult.protocolIdentity.calciumDrive.parameterSetId
      !== calciumDriveParams.parameterSetId
    || periodicResult.protocolIdentity.mechanicsProvider.parameterIdentityHash
      !== provider.parameterIdentityHash
    || periodicResult.protocolComponentHashes.circulationRuntimeStableHash
      !== hashProtocolValue(runtime)
  ) throw new Error("activation-distribution/Windkessel identity mismatch");
  return Object.freeze({
    configurationRole:
      "fixed-aortic-outflow-activation-distribution-windkessel-arm" as const,
    kuwProfile,
    activationDistributionProfile,
    complianceProfile,
    placementProfile,
    rootInertanceProfile,
    calciumDriveParams,
    periodicResult,
    claim: Object.freeze({
      sourceResearchRunnerOnly: true as const,
      independentCanonicalColdStart: true as const,
      warmStartApplied: false as const,
      genericParameterPatchAccepted: false as const,
      valveDiseaseBracketApplied: false as const,
      bloodVolumeChanged: false as const,
      aorticMaximumForwardEoaChanged: false as const,
      sourceFittedAeffChanged: false as const,
      sourceWholeOrganTrefChanged: false as const,
      localCellCalciumPulseChanged: false as const,
      calciumOrMechanicsStateAdded: false as const,
      acceptedStateOrCheckpointTopologyChanged: false as const,
      exactProtocolIdentityIncludesAllFiveFactors: true as const,
    }),
  });
}

/** Fixed independent material-cohort activation distribution × kuw × load. */
export function runMainWireNormalAdultFiveWallAorticOutflowIndependentActivationCohortWindkesselResearchV1(
  options: MainWireNormalAdultFiveWallAorticOutflowResearchOptionsV1,
  activationCohortProfileId:
    MainWireVentricularLandActivationCohortProfileIdV1,
  kuwProfileId: MainWireVentricularLandWholeOrganKuwProfileIdV1,
  complianceProfileId: MainWireArterialCompliancePhysiologyProfileIdV1,
  placementProfileId:
    MainWireAorticCharacteristicResistancePlacementProfileIdV1 | null,
  rootInertanceProfileId:
    MainWireAorticRootInertanceResearchProfileIdV1 | null,
): MainWireNormalAdultFiveWallAorticOutflowIndependentActivationCohortWindkesselResearchRunV1 {
  assertExactAorticOutflowResearchOptions(options);
  const activationCohortProfile =
    resolveMainWireVentricularLandActivationCohortProfileV1(
      activationCohortProfileId,
    );
  const kuwProfile = resolveMainWireVentricularLandWholeOrganKuwProfileV1(
    kuwProfileId,
  );
  const complianceProfile =
    resolveMainWireArterialCompliancePhysiologyProfileV1(
      complianceProfileId,
    );
  const placementProfile = placementProfileId === null
    ? null
    : resolveMainWireAorticCharacteristicResistancePlacementProfileV1(
      placementProfileId,
    );
  const rootInertanceProfile = rootInertanceProfileId === null
    ? null
    : resolveMainWireAorticRootInertanceResearchProfileV1(
      rootInertanceProfileId,
    );
  const baselineRuntime = normalAdultMainWireRuntimeV1();
  const runtime: NonCoronaryCirculationRuntimeParamsV1 = Object.freeze({
    ...baselineRuntime,
    vascular: Object.freeze({
      ...baselineRuntime.vascular,
      systemicArterialStiffnessScaleFromGlobal:
        complianceProfile.arterialStiffnessScaleFromBaseline,
    }),
    ...(placementProfile === null
      ? {}
      : {
        aorticCharacteristicResistancePlacementResearchProfile:
          placementProfile,
      }),
    ...(rootInertanceProfile === null
      ? {}
      : { aorticRootInertanceResearchProfile: rootInertanceProfile }),
  });
  const provider =
    createMainWireNormalAdultFiveWallProviderWithVentricularLandActivationCohortsV1(
      activationCohortProfileId,
      kuwProfileId,
    );
  const calciumDriveParams =
    resolveMainWireVentricularCalciumActivationDistributionParamsV1(
      activationCohortProfileId,
    );
  const bloodVolumeOperatingPoint =
    resolveMainWireNormalAdultBloodVolumeOperatingPointV1(runtime);
  const periodicResult =
    runMainWireNormalAdultFiveWallPeriodicSteadyResolvedRuntimeV1(
      Object.freeze({
        dtSec: options.dtSec,
        ...(options.maximumBeatCount === undefined
          ? {}
          : { maximumBeatCount: options.maximumBeatCount }),
        laSlsMode: "on" as const,
        pericardiumMode: "on" as const,
        pericardiumCase: "healthy-slack" as const,
        initialization: "canonical" as const,
        valveDiseaseBracketIds: Object.freeze([]),
      }),
      runtime,
      Object.freeze({
        provider,
        bloodVolumeOperatingPoint,
        calciumDriveParams,
      }),
    );
  if (
    periodicResult.protocolIdentity.calciumDrive.parameterSetId
      !== calciumDriveParams.parameterSetId
    || periodicResult.protocolIdentity.mechanicsProvider.parameterIdentityHash
      !== provider.parameterIdentityHash
    || periodicResult.protocolComponentHashes.circulationRuntimeStableHash
      !== hashProtocolValue(runtime)
  ) throw new Error("independent activation-cohort/Windkessel identity mismatch");
  return Object.freeze({
    configurationRole:
      "fixed-aortic-outflow-independent-activation-cohort-windkessel-arm" as const,
    kuwProfile,
    activationCohortProfile,
    complianceProfile,
    placementProfile,
    rootInertanceProfile,
    calciumDriveParams,
    periodicResult,
    claim: Object.freeze({
      sourceResearchRunnerOnly: true as const,
      independentCanonicalColdStart: true as const,
      warmStartApplied: false as const,
      genericParameterPatchAccepted: false as const,
      valveDiseaseBracketApplied: false as const,
      bloodVolumeChanged: false as const,
      aorticMaximumForwardEoaChanged: false as const,
      sourceFittedAeffChanged: false as const,
      sourceWholeOrganTrefChanged: false as const,
      localCellCalciumPulseChanged: false as const,
      ventricularLandStateCountPerWall: 18 as const,
      calciumOrMechanicsStateAdded: true as const,
      acceptedStateOrCheckpointTopologyChanged: true as const,
      canonicalCheckpointCompatible: false as const,
      exactProtocolIdentityIncludesAllFiveFactors: true as const,
    }),
  });
}

/** Fixed calcium-decay causal upper bound crossed with kuw and Windkessel. */
export function runMainWireNormalAdultFiveWallAorticOutflowCalciumDecayWindkesselResearchV1(
  options: MainWireNormalAdultFiveWallAorticOutflowResearchOptionsV1,
  calciumProfileId: MainWireVentricularCalciumFixedAmplitudeDecayProfileIdV1,
  kuwProfileId: MainWireVentricularLandWholeOrganKuwProfileIdV1,
  complianceProfileId: MainWireArterialCompliancePhysiologyProfileIdV1,
  placementProfileId:
    MainWireAorticCharacteristicResistancePlacementProfileIdV1 | null,
  rootInertanceProfileId:
    MainWireAorticRootInertanceResearchProfileIdV1 | null,
): MainWireNormalAdultFiveWallAorticOutflowCalciumDecayWindkesselResearchRunV1 {
  assertExactAorticOutflowResearchOptions(options);
  const calciumProfile =
    resolveMainWireVentricularCalciumFixedAmplitudeDecayProfileV1(
      calciumProfileId,
    );
  const kuwProfile = resolveMainWireVentricularLandWholeOrganKuwProfileV1(
    kuwProfileId,
  );
  const complianceProfile =
    resolveMainWireArterialCompliancePhysiologyProfileV1(
      complianceProfileId,
    );
  const placementProfile = placementProfileId === null
    ? null
    : resolveMainWireAorticCharacteristicResistancePlacementProfileV1(
      placementProfileId,
    );
  const rootInertanceProfile = rootInertanceProfileId === null
    ? null
    : resolveMainWireAorticRootInertanceResearchProfileV1(
      rootInertanceProfileId,
    );
  const baselineRuntime = normalAdultMainWireRuntimeV1();
  const runtime: NonCoronaryCirculationRuntimeParamsV1 = Object.freeze({
    ...baselineRuntime,
    vascular: Object.freeze({
      ...baselineRuntime.vascular,
      systemicArterialStiffnessScaleFromGlobal:
        complianceProfile.arterialStiffnessScaleFromBaseline,
    }),
    ...(placementProfile === null
      ? {}
      : {
        aorticCharacteristicResistancePlacementResearchProfile:
          placementProfile,
      }),
    ...(rootInertanceProfile === null
      ? {}
      : { aorticRootInertanceResearchProfile: rootInertanceProfile }),
  });
  const provider =
    createMainWireNormalAdultFiveWallProviderWithVentricularLandWholeOrganKuwProfileV1(
      kuwProfileId,
    );
  const calciumDriveParams =
    resolveMainWireVentricularCalciumFixedAmplitudeDecayParamsV1(
      calciumProfileId,
    );
  const bloodVolumeOperatingPoint =
    resolveMainWireNormalAdultBloodVolumeOperatingPointV1(runtime);
  const periodicResult =
    runMainWireNormalAdultFiveWallPeriodicSteadyResolvedRuntimeV1(
      Object.freeze({
        dtSec: options.dtSec,
        ...(options.maximumBeatCount === undefined
          ? {}
          : { maximumBeatCount: options.maximumBeatCount }),
        laSlsMode: "on" as const,
        pericardiumMode: "on" as const,
        pericardiumCase: "healthy-slack" as const,
        initialization: "canonical" as const,
        valveDiseaseBracketIds: Object.freeze([]),
      }),
      runtime,
      Object.freeze({
        provider,
        bloodVolumeOperatingPoint,
        calciumDriveParams,
      }),
    );
  if (
    periodicResult.protocolIdentity.calciumDrive.parameterSetId
      !== calciumDriveParams.parameterSetId
    || periodicResult.protocolIdentity.mechanicsProvider.parameterIdentityHash
      !== provider.parameterIdentityHash
    || periodicResult.protocolComponentHashes.circulationRuntimeStableHash
      !== hashProtocolValue(runtime)
  ) throw new Error("calcium-decay/Windkessel identity mismatch");
  return Object.freeze({
    configurationRole:
      "fixed-aortic-outflow-calcium-decay-windkessel-arm" as const,
    calciumProfile,
    kuwProfile,
    complianceProfile,
    placementProfile,
    rootInertanceProfile,
    calciumDriveParams,
    periodicResult,
    claim: Object.freeze({
      sourceResearchRunnerOnly: true as const,
      independentCanonicalColdStart: true as const,
      warmStartApplied: false as const,
      genericParameterPatchAccepted: false as const,
      valveDiseaseBracketApplied: false as const,
      bloodVolumeChanged: false as const,
      aorticMaximumForwardEoaChanged: false as const,
      sourceFittedAeffChanged: false as const,
      sourceWholeOrganTrefChanged: false as const,
      calciumOrMechanicsStateAdded: false as const,
      acceptedStateOrCheckpointTopologyChanged: false as const,
      exactProtocolIdentityIncludesAllFiveFactors: true as const,
    }),
  });
}

/** Fixed root-compliance partition by existing Ao-SA R/L damping arm. */
export function runMainWireNormalAdultFiveWallAorticRootRlcDampingResearchV1(
  options: MainWireNormalAdultFiveWallAorticOutflowResearchOptionsV1,
  compliancePartitionProfileId:
    MainWireAorticCompliancePartitionResearchProfileIdV1 | null,
  rootResistanceProfileId:
    MainWireAorticRootResistanceResearchProfileIdV1 | null,
  rootInertanceProfileId:
    MainWireAorticRootInertanceResearchProfileIdV1 | null,
  twitchTimingCandidateId: MainWireVentricularLandTwitchTimingCandidateIdV1,
): MainWireNormalAdultFiveWallAorticRootRlcDampingResearchRunV1 {
  assertExactAorticOutflowResearchOptions(options);
  const compliancePartitionProfile = compliancePartitionProfileId === null
    ? null
    : resolveMainWireAorticCompliancePartitionResearchProfileV1(
      compliancePartitionProfileId,
    );
  const rootResistanceProfile = rootResistanceProfileId === null
    ? null
    : resolveMainWireAorticRootResistanceResearchProfileV1(
      rootResistanceProfileId,
    );
  const rootInertanceProfile = rootInertanceProfileId === null
    ? null
    : resolveMainWireAorticRootInertanceResearchProfileV1(
      rootInertanceProfileId,
    );
  const twitchTimingCandidate =
    resolveMainWireVentricularLandTwitchTimingCandidateV1(
      twitchTimingCandidateId,
    );
  const baselineRuntime = normalAdultMainWireRuntimeV1();
  const runtime: NonCoronaryCirculationRuntimeParamsV1 = Object.freeze({
    ...baselineRuntime,
    vascular: compliancePartitionProfile === null
      ? baselineRuntime.vascular
      : Object.freeze({
        ...baselineRuntime.vascular,
        aorticCompliancePartitionResearchProfile:
          compliancePartitionProfile,
      }),
    ...(rootResistanceProfile === null
      ? {}
      : { aorticRootResistanceResearchProfile: rootResistanceProfile }),
    ...(rootInertanceProfile === null
      ? {}
      : { aorticRootInertanceResearchProfile: rootInertanceProfile }),
  });
  const provider =
    createMainWireNormalAdultFiveWallProviderWithVentricularLandTwitchTimingCandidateV1(
      twitchTimingCandidateId,
    );
  const calciumDriveParams = FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1;
  const bloodVolumeOperatingPoint =
    resolveMainWireNormalAdultBloodVolumeOperatingPointV1(runtime);
  const periodicResult =
    runMainWireNormalAdultFiveWallPeriodicSteadyResolvedRuntimeV1(
      Object.freeze({
        dtSec: options.dtSec,
        ...(options.maximumBeatCount === undefined
          ? {}
          : { maximumBeatCount: options.maximumBeatCount }),
        laSlsMode: "on" as const,
        pericardiumMode: "on" as const,
        pericardiumCase: "healthy-slack" as const,
        initialization: "canonical" as const,
        valveDiseaseBracketIds: Object.freeze([]),
      }),
      runtime,
      Object.freeze({
        provider,
        bloodVolumeOperatingPoint,
        calciumDriveParams,
      }),
    );
  if (
    periodicResult.protocolIdentity.calciumDrive.parameterSetId
      !== calciumDriveParams.parameterSetId
    || periodicResult.protocolIdentity.mechanicsProvider.parameterIdentityHash
      !== provider.parameterIdentityHash
  ) throw new Error("aortic-root RLC damping identity mismatch");
  return Object.freeze({
    configurationRole: "fixed-aortic-root-rlc-damping-research-arm" as const,
    compliancePartitionProfile,
    rootResistanceProfile,
    rootInertanceProfile,
    twitchTimingCandidate,
    calciumDriveParams,
    periodicResult,
    claim: Object.freeze({
      sourceResearchRunnerOnly: true as const,
      independentCanonicalColdStart: true as const,
      warmStartApplied: false as const,
      genericParameterPatchAccepted: false as const,
      valveDiseaseBracketApplied: false as const,
      bloodVolumeChanged: false as const,
      aorticMaximumForwardEoaChanged: false as const,
      calciumDriveChanged: false as const,
      dynamicFlowStateOwnerChanged: false as const,
      acceptedStateOrCheckpointTopologyChanged: false as const,
      exactProtocolIdentityIncludesAllFourFactors: true as const,
    }),
  });
}

/** Fixed ET mechanics by proximal characteristic-resistance placement arm. */
export function runMainWireNormalAdultFiveWallAorticOutflowEjectionTimingCharacteristicResistancePlacementResearchV1(
  options: MainWireNormalAdultFiveWallAorticOutflowResearchOptionsV1,
  armId:
    MainWireAorticOutflowEjectionTimingCharacteristicResistancePlacementArmIdV1,
): MainWireNormalAdultFiveWallAorticOutflowEjectionTimingCharacteristicResistancePlacementResearchRunV1 {
  assertExactAorticOutflowResearchOptions(options);
  const arm =
    resolveMainWireAorticOutflowEjectionTimingCharacteristicResistancePlacementArmV1(
      armId,
    );
  const placementProfile = arm.placementProfileId === null
    ? null
    : resolveMainWireAorticCharacteristicResistancePlacementProfileV1(
      arm.placementProfileId,
    );
  const baselineRuntime = normalAdultMainWireRuntimeV1();
  const runtime: NonCoronaryCirculationRuntimeParamsV1 = Object.freeze({
    ...baselineRuntime,
    ...(placementProfile === null
      ? {}
      : {
        aorticCharacteristicResistancePlacementResearchProfile:
          placementProfile,
      }),
  });
  const provider = createFixedResearchMainWireNormalAdultFiveWallProviderV1(
    arm.ventricularMaterialPointId,
  );
  const materialPoint =
    resolveMainWireNormalAdultVentricularMaterialResearchPointV1(
      arm.ventricularMaterialPointId,
    );
  const bloodVolumeOperatingPoint =
    resolveMainWireNormalAdultBloodVolumeOperatingPointV1(runtime);
  const periodicResult =
    runMainWireNormalAdultFiveWallPeriodicSteadyResolvedRuntimeV1(
      Object.freeze({
        dtSec: options.dtSec,
        ...(options.maximumBeatCount === undefined
          ? {}
          : { maximumBeatCount: options.maximumBeatCount }),
        laSlsMode: "on" as const,
        pericardiumMode: "on" as const,
        pericardiumCase: "healthy-slack" as const,
        initialization: "canonical" as const,
        valveDiseaseBracketIds: Object.freeze([]),
      }),
      runtime,
      Object.freeze({ provider, bloodVolumeOperatingPoint }),
    );
  return Object.freeze({
    configurationRole:
      "fixed-aortic-outflow-ejection-timing-characteristic-resistance-placement-arm" as const,
    arm,
    materialPoint,
    placementProfile,
    periodicResult,
    claim: Object.freeze({
      sourceResearchRunnerOnly: true as const,
      independentCanonicalColdStart: true as const,
      warmStartApplied: false as const,
      genericParameterPatchAccepted: false as const,
      valveDiseaseBracketApplied: false as const,
      calciumDriveChanged: false as const,
      bloodVolumeChanged: false as const,
      aorticMaximumForwardEoaChanged: false as const,
      aorticValveOpeningLawChanged: false as const,
      aorticRootComplianceOrInertanceChanged: false as const,
      sourceTopologyLinearResistanceSumPreservedExactly: true as const,
      acceptedStateOrCheckpointTopologyChanged: false as const,
      exactProtocolIdentityIncludesMechanicsAndPlacement: true as const,
    }),
  });
}

/** Fixed common-ventricular calcium waveform arm from a canonical cold start. */
export function runMainWireNormalAdultFiveWallVentricularCalciumWaveformResearchV1(
  options:
    MainWireNormalAdultFiveWallVentricularCalciumWaveformResearchOptionsV1,
  profileId: MainWireVentricularCalciumWaveformProfileIdV1,
): MainWireNormalAdultFiveWallVentricularCalciumWaveformResearchRunV1 {
  assertExactVentricularCalciumWaveformResearchOptions(options);
  const profile = resolveMainWireVentricularCalciumWaveformProfileV1(profileId);
  const calciumDriveParams =
    resolveMainWireVentricularCalciumWaveformParamsV1(profileId);
  const runtime = normalAdultMainWireRuntimeV1();
  const provider = createCanonicalMainWireNormalAdultFiveWallProviderV1();
  const bloodVolumeOperatingPoint =
    resolveMainWireNormalAdultBloodVolumeOperatingPointV1(runtime);
  const periodicResult =
    runMainWireNormalAdultFiveWallPeriodicSteadyResolvedRuntimeV1(
      Object.freeze({
        dtSec: options.dtSec,
        ...(options.maximumBeatCount === undefined
          ? {}
          : { maximumBeatCount: options.maximumBeatCount }),
        laSlsMode: "on" as const,
        pericardiumMode: "on" as const,
        pericardiumCase: "healthy-slack" as const,
        initialization: "canonical" as const,
        valveDiseaseBracketIds: Object.freeze([]),
      }),
      runtime,
      Object.freeze({
        provider,
        bloodVolumeOperatingPoint,
        calciumDriveParams,
      }),
    );
  return Object.freeze({
    configurationRole:
      "fixed-ventricular-calcium-waveform-research-profile" as const,
    profile,
    calciumDriveParams,
    periodicResult,
    claim: Object.freeze({
      sourceResearchRunnerOnly: true as const,
      independentCanonicalColdStart: true as const,
      warmStartApplied: false as const,
      genericParameterPatchAccepted: false as const,
      valveDiseaseBracketApplied: false as const,
      circulationRuntimeChanged: false as const,
      mechanicsProviderChanged: false as const,
      calciumOrMechanicsStateAdded: false as const,
      acceptedStateOrCheckpointTopologyChanged: false as const,
      exactProtocolIdentityIncludesCalciumParams: true as const,
    }),
  });
}

/**
 * One-axis-at-a-time ET causal bracket. Each arm starts from the same canonical
 * cold construction and changes either fixed-amplitude calcium decay or the
 * existing Land gammaW shortening-deactivation coefficient, never both.
 */
export function runMainWireNormalAdultFiveWallAorticOutflowEjectionTimingResearchArmV1(
  options:
    MainWireNormalAdultFiveWallVentricularCalciumWaveformResearchOptionsV1,
  armId: MainWireAorticOutflowEjectionTimingArmIdV1,
): MainWireNormalAdultFiveWallAorticOutflowEjectionTimingResearchRunV1 {
  assertExactVentricularCalciumWaveformResearchOptions(options);
  const arm = resolveMainWireAorticOutflowEjectionTimingArmV1(armId);
  const calciumProfile =
    resolveMainWireVentricularCalciumFixedAmplitudeDecayProfileV1(
      arm.calciumProfileId,
    );
  const gammaWProfile =
    resolveMainWireNormalAdultVentricularGammaWResearchProfileV1(
      arm.gammaWProfileId,
    );
  if (
    arm.calciumProfileId !== "canonical"
    && arm.gammaWProfileId !== "canonical"
  ) {
    throw new Error("ejection-timing ablation arms may change only one axis");
  }
  const calciumDriveParams =
    resolveMainWireVentricularCalciumFixedAmplitudeDecayParamsV1(
      arm.calciumProfileId,
    );
  const provider =
    createMainWireNormalAdultFiveWallProviderWithVentricularGammaWResearchProfileV1(
      arm.gammaWProfileId,
    );
  const runtime = normalAdultMainWireRuntimeV1();
  const bloodVolumeOperatingPoint =
    resolveMainWireNormalAdultBloodVolumeOperatingPointV1(runtime);
  const periodicResult =
    runMainWireNormalAdultFiveWallPeriodicSteadyResolvedRuntimeV1(
      Object.freeze({
        dtSec: options.dtSec,
        ...(options.maximumBeatCount === undefined
          ? {}
          : { maximumBeatCount: options.maximumBeatCount }),
        laSlsMode: "on" as const,
        pericardiumMode: "on" as const,
        pericardiumCase: "healthy-slack" as const,
        initialization: "canonical" as const,
        valveDiseaseBracketIds: Object.freeze([]),
      }),
      runtime,
      Object.freeze({
        provider,
        bloodVolumeOperatingPoint,
        calciumDriveParams,
      }),
    );
  if (
    periodicResult.protocolIdentity.calciumDrive.parameterSetId
      !== calciumDriveParams.parameterSetId
    || periodicResult.protocolIdentity.mechanicsProvider.parameterIdentityHash
      !== provider.parameterIdentityHash
  ) {
    throw new Error("ejection-timing ablation protocol identity mismatch");
  }
  // Resolve at the runner boundary so profile and material identities cannot
  // silently diverge even though analysis owns the material readback itself.
  resolveMainWireNormalAdultVentricularGammaWWallMaterialV1(
    arm.gammaWProfileId,
  );
  return Object.freeze({
    configurationRole:
      "fixed-aortic-outflow-ejection-timing-causal-ablation-arm" as const,
    arm,
    calciumProfile,
    gammaWProfile,
    calciumDriveParams,
    periodicResult,
    claim: Object.freeze({
      sourceResearchRunnerOnly: true as const,
      independentCanonicalColdStart: true as const,
      warmStartApplied: false as const,
      genericParameterPatchAccepted: false as const,
      valveDiseaseBracketApplied: false as const,
      circulationRuntimeChanged: false as const,
      aorticValveConstitutiveLawChanged: false as const,
      calciumOrMechanicsStateAdded: false as const,
      acceptedStateOrCheckpointTopologyChanged: false as const,
      calciumAndGammaWAxesCombined: false as const,
      exactProtocolIdentityIncludesCalciumAndMechanicsParams: true as const,
    }),
  });
}

/** Fixed isometric-informed ventricular Land kinetic candidate from cold start. */
export function runMainWireNormalAdultFiveWallVentricularLandTwitchTimingResearchV1(
  options:
    MainWireNormalAdultFiveWallVentricularCalciumWaveformResearchOptionsV1,
  candidateId: MainWireVentricularLandTwitchTimingCandidateIdV1,
): MainWireNormalAdultFiveWallVentricularLandTwitchTimingResearchRunV1 {
  assertExactVentricularCalciumWaveformResearchOptions(options);
  const candidate =
    resolveMainWireVentricularLandTwitchTimingCandidateV1(candidateId);
  const calciumDriveParams = FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1;
  const provider =
    createMainWireNormalAdultFiveWallProviderWithVentricularLandTwitchTimingCandidateV1(
      candidateId,
    );
  const runtime = normalAdultMainWireRuntimeV1();
  const bloodVolumeOperatingPoint =
    resolveMainWireNormalAdultBloodVolumeOperatingPointV1(runtime);
  const periodicResult =
    runMainWireNormalAdultFiveWallPeriodicSteadyResolvedRuntimeV1(
      Object.freeze({
        dtSec: options.dtSec,
        ...(options.maximumBeatCount === undefined
          ? {}
          : { maximumBeatCount: options.maximumBeatCount }),
        laSlsMode: "on" as const,
        pericardiumMode: "on" as const,
        pericardiumCase: "healthy-slack" as const,
        initialization: "canonical" as const,
        valveDiseaseBracketIds: Object.freeze([]),
      }),
      runtime,
      Object.freeze({ provider, bloodVolumeOperatingPoint, calciumDriveParams }),
    );
  if (
    periodicResult.protocolIdentity.mechanicsProvider.parameterIdentityHash
      !== provider.parameterIdentityHash
    || periodicResult.protocolIdentity.calciumDrive.parameterSetId
      !== calciumDriveParams.parameterSetId
  ) throw new Error("Land twitch timing candidate protocol identity mismatch");
  return Object.freeze({
    configurationRole:
      "fixed-ventricular-land-twitch-timing-candidate" as const,
    candidate,
    calciumDriveParams,
    periodicResult,
    claim: Object.freeze({
      sourceResearchRunnerOnly: true as const,
      independentCanonicalColdStart: true as const,
      warmStartApplied: false as const,
      genericParameterPatchAccepted: false as const,
      valveDiseaseBracketApplied: false as const,
      circulationRuntimeChanged: false as const,
      calciumDriveChanged: false as const,
      aorticValveConstitutiveLawChanged: false as const,
      calciumOrMechanicsStateAdded: false as const,
      acceptedStateOrCheckpointTopologyChanged: false as const,
      exactProtocolIdentityIncludesMechanicsParams: true as const,
    }),
  });
}

/** Fixed source-constrained ventricular calcium prior from a canonical cold start. */
export function runMainWireNormalAdultFiveWallVentricularCalciumSourceConstrainedResearchV1(
  options:
    MainWireNormalAdultFiveWallVentricularCalciumWaveformResearchOptionsV1,
  profileId: MainWireVentricularCalciumSourceConstrainedProfileIdV1,
): MainWireNormalAdultFiveWallVentricularCalciumSourceConstrainedResearchRunV1 {
  assertExactVentricularCalciumWaveformResearchOptions(options);
  const profile =
    resolveMainWireVentricularCalciumSourceConstrainedProfileV1(profileId);
  const calciumDriveParams =
    resolveMainWireVentricularCalciumSourceConstrainedParamsV1(profileId);
  const runtime = normalAdultMainWireRuntimeV1();
  const provider = createCanonicalMainWireNormalAdultFiveWallProviderV1();
  const bloodVolumeOperatingPoint =
    resolveMainWireNormalAdultBloodVolumeOperatingPointV1(runtime);
  const periodicResult =
    runMainWireNormalAdultFiveWallPeriodicSteadyResolvedRuntimeV1(
      Object.freeze({
        dtSec: options.dtSec,
        ...(options.maximumBeatCount === undefined
          ? {}
          : { maximumBeatCount: options.maximumBeatCount }),
        laSlsMode: "on" as const,
        pericardiumMode: "on" as const,
        pericardiumCase: "healthy-slack" as const,
        initialization: "canonical" as const,
        valveDiseaseBracketIds: Object.freeze([]),
      }),
      runtime,
      Object.freeze({
        provider,
        bloodVolumeOperatingPoint,
        calciumDriveParams,
      }),
    );
  return Object.freeze({
    configurationRole:
      "fixed-ventricular-calcium-source-constrained-research-profile" as const,
    profile,
    calciumDriveParams,
    periodicResult,
    claim: Object.freeze({
      sourceResearchRunnerOnly: true as const,
      independentCanonicalColdStart: true as const,
      warmStartApplied: false as const,
      genericParameterPatchAccepted: false as const,
      valveDiseaseBracketApplied: false as const,
      circulationRuntimeChanged: false as const,
      mechanicsProviderChanged: false as const,
      calciumOrMechanicsStateAdded: false as const,
      acceptedStateOrCheckpointTopologyChanged: false as const,
      exactProtocolIdentityIncludesCalciumParams: true as const,
    }),
  });
}

/** Fixed source-calcium by isometric-informed Land-timing factorial arm. */
export function runMainWireNormalAdultFiveWallVentricularCalciumLandTwitchTimingResearchV1(
  options:
    MainWireNormalAdultFiveWallVentricularCalciumWaveformResearchOptionsV1,
  calciumProfileId: MainWireVentricularCalciumSourceConstrainedProfileIdV1,
  twitchTimingCandidateId: MainWireVentricularLandTwitchTimingCandidateIdV1,
): MainWireNormalAdultFiveWallVentricularCalciumLandTwitchTimingResearchRunV1 {
  assertExactVentricularCalciumWaveformResearchOptions(options);
  const calciumProfile =
    resolveMainWireVentricularCalciumSourceConstrainedProfileV1(
      calciumProfileId,
    );
  const twitchTimingCandidate =
    resolveMainWireVentricularLandTwitchTimingCandidateV1(
      twitchTimingCandidateId,
    );
  const calciumDriveParams =
    resolveMainWireVentricularCalciumSourceConstrainedParamsV1(
      calciumProfileId,
    );
  const provider =
    createMainWireNormalAdultFiveWallProviderWithVentricularLandTwitchTimingCandidateV1(
      twitchTimingCandidateId,
    );
  const runtime = normalAdultMainWireRuntimeV1();
  const bloodVolumeOperatingPoint =
    resolveMainWireNormalAdultBloodVolumeOperatingPointV1(runtime);
  const periodicResult =
    runMainWireNormalAdultFiveWallPeriodicSteadyResolvedRuntimeV1(
      Object.freeze({
        dtSec: options.dtSec,
        ...(options.maximumBeatCount === undefined
          ? {}
          : { maximumBeatCount: options.maximumBeatCount }),
        laSlsMode: "on" as const,
        pericardiumMode: "on" as const,
        pericardiumCase: "healthy-slack" as const,
        initialization: "canonical" as const,
        valveDiseaseBracketIds: Object.freeze([]),
      }),
      runtime,
      Object.freeze({
        provider,
        bloodVolumeOperatingPoint,
        calciumDriveParams,
      }),
    );
  if (
    periodicResult.protocolIdentity.calciumDrive.parameterSetId
      !== calciumDriveParams.parameterSetId
    || periodicResult.protocolIdentity.mechanicsProvider.parameterIdentityHash
      !== provider.parameterIdentityHash
  ) {
    throw new Error(
      "calcium by Land twitch timing factorial protocol identity mismatch",
    );
  }
  return Object.freeze({
    configurationRole:
      "fixed-ventricular-calcium-land-twitch-timing-factorial-arm" as const,
    calciumProfile,
    twitchTimingCandidate,
    calciumDriveParams,
    periodicResult,
    claim: Object.freeze({
      sourceResearchRunnerOnly: true as const,
      independentCanonicalColdStart: true as const,
      warmStartApplied: false as const,
      genericParameterPatchAccepted: false as const,
      valveDiseaseBracketApplied: false as const,
      circulationRuntimeChanged: false as const,
      aorticValveConstitutiveLawChanged: false as const,
      calciumOrMechanicsStateAdded: false as const,
      acceptedStateOrCheckpointTopologyChanged: false as const,
      exactProtocolIdentityIncludesCalciumAndMechanicsParams: true as const,
    }),
  });
}

/** Fixed whole-trace source fit from an independent canonical cold start. */
export function runMainWireNormalAdultFiveWallVentricularCalciumSourceTraceFitResearchV1(
  options:
    MainWireNormalAdultFiveWallVentricularCalciumWaveformResearchOptionsV1,
): MainWireNormalAdultFiveWallVentricularCalciumSourceTraceFitResearchRunV1 {
  assertExactVentricularCalciumWaveformResearchOptions(options);
  const profile = MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_PROFILE_V1;
  const calciumDriveParams =
    resolveMainWireVentricularCalciumSourceTraceFitParamsV1();
  const runtime = normalAdultMainWireRuntimeV1();
  const provider = createCanonicalMainWireNormalAdultFiveWallProviderV1();
  const bloodVolumeOperatingPoint =
    resolveMainWireNormalAdultBloodVolumeOperatingPointV1(runtime);
  const periodicResult =
    runMainWireNormalAdultFiveWallPeriodicSteadyResolvedRuntimeV1(
      Object.freeze({
        dtSec: options.dtSec,
        ...(options.maximumBeatCount === undefined
          ? {}
          : { maximumBeatCount: options.maximumBeatCount }),
        laSlsMode: "on" as const,
        pericardiumMode: "on" as const,
        pericardiumCase: "healthy-slack" as const,
        initialization: "canonical" as const,
        valveDiseaseBracketIds: Object.freeze([]),
      }),
      runtime,
      Object.freeze({
        provider,
        bloodVolumeOperatingPoint,
        calciumDriveParams,
      }),
    );
  return Object.freeze({
    configurationRole:
      "fixed-ventricular-calcium-source-trace-fit-research-profile" as const,
    profile,
    calciumDriveParams,
    periodicResult,
    claim: Object.freeze({
      sourceResearchRunnerOnly: true as const,
      independentCanonicalColdStart: true as const,
      warmStartApplied: false as const,
      genericParameterPatchAccepted: false as const,
      valveDiseaseBracketApplied: false as const,
      circulationRuntimeChanged: false as const,
      mechanicsProviderChanged: false as const,
      calciumOrMechanicsStateAdded: false as const,
      acceptedStateOrCheckpointTopologyChanged: false as const,
      exactProtocolIdentityIncludesCalciumParams: true as const,
    }),
  });
}

/**
 * Fixed one-factor recalibration point with the whole-trace calcium profile.
 * Every semantic owner is resolved before an independent canonical cold start;
 * arbitrary runtime, material, blood-volume, or calcium patches are absent.
 */
export function runMainWireNormalAdultFiveWallVentricularCalciumSourceTraceFitRecalibrationResearchV1(
  options:
    MainWireNormalAdultFiveWallVentricularCalciumWaveformResearchOptionsV1,
  pointId:
    MainWireVentricularCalciumSourceTraceFitRecalibrationPointIdV1,
): MainWireNormalAdultFiveWallVentricularCalciumSourceTraceFitRecalibrationResearchRunV1 {
  assertExactVentricularCalciumWaveformResearchOptions(options);
  const point =
    resolveMainWireVentricularCalciumSourceTraceFitRecalibrationPointV1(
      pointId,
    );
  const runtime = resolveMainWireNormalAdultFiveWallCirculatoryLoadRuntimeV1(
    point.circulatoryLoadPointId,
  );
  const circulatoryLoadPoint =
    resolveMainWireNormalAdultFiveWallCirculatoryLoadPointV1(
      point.circulatoryLoadPointId,
    );
  const provider = createFixedResearchMainWireNormalAdultFiveWallProviderV1(
    point.ventricularMaterialPointId,
  );
  const ventricularMaterialPoint =
    resolveMainWireNormalAdultVentricularMaterialResearchPointV1(
      point.ventricularMaterialPointId,
    );
  const bloodVolume = resolveMainWireNormalAdultBloodVolumeResearchPointV1(
    runtime,
    point.stressedVenousVolumePointId,
  );
  const calciumProfile =
    MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_PROFILE_V1;
  const calciumDriveParams =
    resolveMainWireVentricularCalciumSourceTraceFitParamsV1();
  const periodicResult =
    runMainWireNormalAdultFiveWallPeriodicSteadyResolvedRuntimeV1(
      Object.freeze({
        dtSec: options.dtSec,
        ...(options.maximumBeatCount === undefined
          ? {}
          : { maximumBeatCount: options.maximumBeatCount }),
        laSlsMode: "on" as const,
        pericardiumMode: "on" as const,
        pericardiumCase: "healthy-slack" as const,
        initialization: "canonical" as const,
        valveDiseaseBracketIds: Object.freeze([]),
      }),
      runtime,
      Object.freeze({
        provider,
        bloodVolumeOperatingPoint: bloodVolume.operatingPoint,
        calciumDriveParams,
      }),
    );
  const resolvedProviderIdentity = Object.freeze({
    providerId: provider.providerId,
    parameterSetId: provider.parameterSetId,
    parameterIdentityHash: provider.parameterIdentityHash,
    stateSchemaVersion: provider.stateSchemaVersion,
  });
  if (
    periodicResult.protocolIdentity.mechanicsProvider.providerId
      !== resolvedProviderIdentity.providerId
    || periodicResult.protocolIdentity.mechanicsProvider.parameterSetId
      !== resolvedProviderIdentity.parameterSetId
    || periodicResult.protocolIdentity.mechanicsProvider.parameterIdentityHash
      !== resolvedProviderIdentity.parameterIdentityHash
    || periodicResult.protocolIdentity.bloodVolumeOperatingPoint
      .fixedTotalBloodVolumeMl
      !== bloodVolume.operatingPoint.fixedTotalBloodVolumeMl
  ) {
    throw new Error(
      "calcium source-trace recalibration assembly drifted from protocol identity",
    );
  }
  return Object.freeze({
    configurationRole:
      "fixed-ventricular-calcium-source-trace-fit-recalibration-point" as const,
    point,
    calciumProfile,
    calciumDriveParams,
    circulatoryLoadPoint,
    ventricularMaterialPoint,
    stressedVenousVolumePoint: bloodVolume.point,
    resolvedProviderIdentity,
    resolvedBloodVolumeIdentity: bloodVolume.operatingPoint.identity,
    periodicResult,
    claim: Object.freeze({
      sourceResearchRunnerOnly: true as const,
      independentCanonicalColdStart: true as const,
      warmStartApplied: false as const,
      genericParameterPatchAccepted: false as const,
      oneFactorAtATime: true as const,
      ventricularCalciumProfileHeldFixedAcrossPoints: true as const,
      aorticValveAreaOrLawChanged: false as const,
      vascularUnstressedVolumesChanged: false as const,
      acceptedStateOrCheckpointTopologyChanged: false as const,
      exactProtocolIdentityIncludesAllResolvedOwners: true as const,
      parameterOptimizationOrPatientFit: false as const,
    }),
  });
}

/** Three fixed, bounded post-SVD corner probes; no continuous fit surface. */
export function runMainWireNormalAdultFiveWallVentricularCalciumSourceTraceFitRecalibrationCandidateResearchV1(
  options:
    MainWireNormalAdultFiveWallVentricularCalciumWaveformResearchOptionsV1,
  candidateId:
    MainWireVentricularCalciumSourceTraceFitRecalibrationCandidateIdV1,
): MainWireNormalAdultFiveWallVentricularCalciumSourceTraceFitRecalibrationCandidateResearchRunV1 {
  assertExactVentricularCalciumWaveformResearchOptions(options);
  const candidate =
    resolveMainWireVentricularCalciumSourceTraceFitRecalibrationCandidateV1(
      candidateId,
    );
  const runtime = resolveMainWireNormalAdultFiveWallCirculatoryLoadRuntimeV1(
    candidate.circulatoryLoadPointId,
  );
  const circulatoryLoadPoint =
    resolveMainWireNormalAdultFiveWallCirculatoryLoadPointV1(
      candidate.circulatoryLoadPointId,
    );
  const provider = createFixedResearchMainWireNormalAdultFiveWallProviderV1(
    candidate.ventricularMaterialPointId,
  );
  const ventricularMaterialPoint =
    resolveMainWireNormalAdultVentricularMaterialResearchPointV1(
      candidate.ventricularMaterialPointId,
    );
  const bloodVolume = resolveMainWireNormalAdultBloodVolumeResearchPointV1(
    runtime,
    candidate.stressedVenousVolumePointId,
  );
  const calciumProfile =
    MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_PROFILE_V1;
  const calciumDriveParams =
    resolveMainWireVentricularCalciumSourceTraceFitParamsV1();
  const periodicResult =
    runMainWireNormalAdultFiveWallPeriodicSteadyResolvedRuntimeV1(
      Object.freeze({
        dtSec: options.dtSec,
        ...(options.maximumBeatCount === undefined
          ? {}
          : { maximumBeatCount: options.maximumBeatCount }),
        laSlsMode: "on" as const,
        pericardiumMode: "on" as const,
        pericardiumCase: "healthy-slack" as const,
        initialization: "canonical" as const,
        valveDiseaseBracketIds: Object.freeze([]),
      }),
      runtime,
      Object.freeze({
        provider,
        bloodVolumeOperatingPoint: bloodVolume.operatingPoint,
        calciumDriveParams,
      }),
    );
  const resolvedProviderIdentity = Object.freeze({
    providerId: provider.providerId,
    parameterSetId: provider.parameterSetId,
    parameterIdentityHash: provider.parameterIdentityHash,
    stateSchemaVersion: provider.stateSchemaVersion,
  });
  if (
    periodicResult.protocolIdentity.mechanicsProvider.providerId
      !== resolvedProviderIdentity.providerId
    || periodicResult.protocolIdentity.mechanicsProvider.parameterSetId
      !== resolvedProviderIdentity.parameterSetId
    || periodicResult.protocolIdentity.mechanicsProvider.parameterIdentityHash
      !== resolvedProviderIdentity.parameterIdentityHash
    || periodicResult.protocolIdentity.bloodVolumeOperatingPoint
      .fixedTotalBloodVolumeMl
      !== bloodVolume.operatingPoint.fixedTotalBloodVolumeMl
  ) {
    throw new Error(
      "calcium source-trace recalibration candidate drifted from protocol identity",
    );
  }
  return Object.freeze({
    configurationRole:
      "fixed-ventricular-calcium-source-trace-fit-recalibration-candidate" as const,
    candidate,
    calciumProfile,
    calciumDriveParams,
    circulatoryLoadPoint,
    ventricularMaterialPoint,
    stressedVenousVolumePoint: bloodVolume.point,
    resolvedProviderIdentity,
    resolvedBloodVolumeIdentity: bloodVolume.operatingPoint.identity,
    periodicResult,
    claim: Object.freeze({
      sourceResearchRunnerOnly: true as const,
      independentCanonicalColdStart: true as const,
      warmStartApplied: false as const,
      genericParameterPatchAccepted: false as const,
      fixedCandidateOnly: true as const,
      ventricularCalciumProfileHeldFixedAcrossCandidates: true as const,
      aorticValveAreaOrLawChanged: false as const,
      vascularUnstressedVolumesChanged: false as const,
      acceptedStateOrCheckpointTopologyChanged: false as const,
      exactProtocolIdentityIncludesAllResolvedOwners: true as const,
      numericTargetOptimizationApplied: false as const,
      patientFitOrCanonicalAdoption: false as const,
    }),
  });
}

/**
 * One member of the fixed source-calcium Tref/passive factorial. The mechanics
 * input is resolved from the named profile before assembly; callers cannot pass
 * a free-form material patch or alter circulation, TBV, or valve ownership.
 */
export function runMainWireNormalAdultFiveWallVentricularCalciumSourceTraceFitTrefPassiveResearchV1(
  options:
    MainWireNormalAdultFiveWallVentricularCalciumWaveformResearchOptionsV1,
  profileId:
    MainWireVentricularCalciumSourceTraceFitTrefPassiveProfileIdV1,
): MainWireNormalAdultFiveWallVentricularCalciumSourceTraceFitTrefPassiveResearchRunV1 {
  assertExactVentricularCalciumWaveformResearchOptions(options);
  const profile =
    resolveMainWireVentricularCalciumSourceTraceFitTrefPassiveProfileV1(
      profileId,
    );
  const mechanicsResearchInput =
    resolveMainWireVentricularCalciumSourceTraceFitTrefPassiveMechanicsInputV1(
      profileId,
    );
  const runtime = normalAdultMainWireRuntimeV1();
  const provider =
    createMainWireNormalAdultFiveWallProviderWithMechanicsResearchInputsV1(
      mechanicsResearchInput,
    );
  const bloodVolumeOperatingPoint =
    resolveMainWireNormalAdultBloodVolumeOperatingPointV1(runtime);
  const calciumProfile =
    MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_PROFILE_V1;
  const calciumDriveParams =
    resolveMainWireVentricularCalciumSourceTraceFitParamsV1();
  const periodicResult =
    runMainWireNormalAdultFiveWallPeriodicSteadyResolvedRuntimeV1(
      Object.freeze({
        dtSec: options.dtSec,
        ...(options.maximumBeatCount === undefined
          ? {}
          : { maximumBeatCount: options.maximumBeatCount }),
        laSlsMode: "on" as const,
        pericardiumMode: "on" as const,
        pericardiumCase: "healthy-slack" as const,
        initialization: "canonical" as const,
        valveDiseaseBracketIds: Object.freeze([]),
      }),
      runtime,
      Object.freeze({
        provider,
        bloodVolumeOperatingPoint,
        calciumDriveParams,
      }),
    );
  const resolvedProviderIdentity = Object.freeze({
    providerId: provider.providerId,
    parameterSetId: provider.parameterSetId,
    parameterIdentityHash: provider.parameterIdentityHash,
    stateSchemaVersion: provider.stateSchemaVersion,
  });
  const protocol = periodicResult.protocolIdentity;
  if (
    protocol.mechanicsProvider.providerId
      !== resolvedProviderIdentity.providerId
    || protocol.mechanicsProvider.parameterSetId
      !== resolvedProviderIdentity.parameterSetId
    || protocol.mechanicsProvider.parameterIdentityHash
      !== resolvedProviderIdentity.parameterIdentityHash
    || protocol.mechanicsProvider.stateSchemaVersion
      !== resolvedProviderIdentity.stateSchemaVersion
    || protocol.bloodVolumeOperatingPoint.fixedTotalBloodVolumeMl
      !== bloodVolumeOperatingPoint.fixedTotalBloodVolumeMl
    || protocol.calciumDrive.parameterSetId
      !== calciumDriveParams.parameterSetId
    || protocol.calciumDrive.fixedParamsStableHash
      !== hashProtocolValue(calciumDriveParams)
  ) {
    throw new Error(
      "source-calcium Tref/passive assembly drifted from protocol identity",
    );
  }
  return Object.freeze({
    configurationRole:
      "fixed-ventricular-calcium-source-trace-fit-tref-passive-profile" as const,
    profile,
    mechanicsResearchInput,
    calciumProfile,
    calciumDriveParams,
    resolvedProviderIdentity,
    periodicResult,
    claim: Object.freeze({
      sourceResearchRunnerOnly: true as const,
      independentCanonicalColdStart: true as const,
      warmStartApplied: false as const,
      genericParameterPatchAccepted: false as const,
      fixedFactorialProfileOnly: true as const,
      ventricularCalciumProfileHeldFixedAcrossProfiles: true as const,
      circulationRuntimeChanged: false as const,
      fixedTotalBloodVolumeChanged: false as const,
      aorticValveAreaOrLawChanged: false as const,
      vascularUnstressedVolumesChanged: false as const,
      calciumOrMechanicsStateAdded: false as const,
      acceptedStateOrCheckpointTopologyChanged: false as const,
      exactProtocolIdentityIncludesAllResolvedOwners: true as const,
      numericTargetOptimizationApplied: false as const,
      patientFitOrCanonicalAdoption: false as const,
    }),
  });
}

/** Fixed existing-Land distortion transient on one post-Pareto mechanics arm. */
export function runMainWireNormalAdultFiveWallVentricularCalciumSourceTraceFitTrefPassiveDistortionResearchV1(
  options:
    MainWireNormalAdultFiveWallVentricularCalciumWaveformResearchOptionsV1,
  candidateId:
    MainWireVentricularCalciumSourceTraceFitTrefPassiveDistortionCandidateIdV1,
): MainWireNormalAdultFiveWallVentricularCalciumSourceTraceFitTrefPassiveDistortionResearchRunV1 {
  assertExactVentricularCalciumWaveformResearchOptions(options);
  const candidate =
    resolveMainWireVentricularCalciumSourceTraceFitTrefPassiveDistortionCandidateV1(
      candidateId,
    );
  const mechanicsResearchInput =
    resolveMainWireVentricularCalciumSourceTraceFitTrefPassiveMechanicsInputV1(
      candidate.pairedBaselineProfileId,
    );
  const runtime = normalAdultMainWireRuntimeV1();
  const provider =
    createMainWireNormalAdultFiveWallProviderWithMechanicsResearchInputsAndFixedVentricularDistortionTransientV1(
      mechanicsResearchInput,
    );
  const bloodVolumeOperatingPoint =
    resolveMainWireNormalAdultBloodVolumeOperatingPointV1(runtime);
  const calciumProfile =
    MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_PROFILE_V1;
  const calciumDriveParams =
    resolveMainWireVentricularCalciumSourceTraceFitParamsV1();
  const periodicResult =
    runMainWireNormalAdultFiveWallPeriodicSteadyResolvedRuntimeV1(
      Object.freeze({
        dtSec: options.dtSec,
        ...(options.maximumBeatCount === undefined
          ? {}
          : { maximumBeatCount: options.maximumBeatCount }),
        laSlsMode: "on" as const,
        pericardiumMode: "on" as const,
        pericardiumCase: "healthy-slack" as const,
        initialization: "canonical" as const,
        valveDiseaseBracketIds: Object.freeze([]),
      }),
      runtime,
      Object.freeze({
        provider,
        bloodVolumeOperatingPoint,
        calciumDriveParams,
      }),
    );
  const resolvedProviderIdentity = Object.freeze({
    providerId: provider.providerId,
    parameterSetId: provider.parameterSetId,
    parameterIdentityHash: provider.parameterIdentityHash,
    stateSchemaVersion: provider.stateSchemaVersion,
  });
  const protocol = periodicResult.protocolIdentity;
  if (
    protocol.mechanicsProvider.providerId
      !== resolvedProviderIdentity.providerId
    || protocol.mechanicsProvider.parameterSetId
      !== resolvedProviderIdentity.parameterSetId
    || protocol.mechanicsProvider.parameterIdentityHash
      !== resolvedProviderIdentity.parameterIdentityHash
    || protocol.mechanicsProvider.stateSchemaVersion
      !== resolvedProviderIdentity.stateSchemaVersion
    || protocol.bloodVolumeOperatingPoint.fixedTotalBloodVolumeMl
      !== bloodVolumeOperatingPoint.fixedTotalBloodVolumeMl
    || protocol.calciumDrive.parameterSetId
      !== calciumDriveParams.parameterSetId
    || protocol.calciumDrive.fixedParamsStableHash
      !== hashProtocolValue(calciumDriveParams)
  ) {
    throw new Error(
      "source-calcium Tref/passive distortion assembly drifted from protocol identity",
    );
  }
  return Object.freeze({
    configurationRole:
      "fixed-ventricular-calcium-source-trace-fit-tref-passive-distortion-candidate" as const,
    candidate,
    mechanicsResearchInput,
    calciumProfile,
    calciumDriveParams,
    resolvedProviderIdentity,
    periodicResult,
    claim: Object.freeze({
      sourceResearchRunnerOnly: true as const,
      independentCanonicalColdStart: true as const,
      warmStartApplied: false as const,
      genericParameterPatchAccepted: false as const,
      fixedPostParetoCandidateOnly: true as const,
      pairedBaselineChangesOnlyExistingLandDistortionTransient: true as const,
      ventricularCalciumProfileHeldFixedAcrossCandidates: true as const,
      circulationRuntimeChanged: false as const,
      fixedTotalBloodVolumeChanged: false as const,
      aorticValveAreaOrLawChanged: false as const,
      vascularUnstressedVolumesChanged: false as const,
      calciumOrMechanicsStateAdded: false as const,
      acceptedStateOrCheckpointTopologyChanged: false as const,
      exactProtocolIdentityIncludesAllResolvedOwners: true as const,
      numericTargetOptimizationApplied: false as const,
      patientFitOrCanonicalAdoption: false as const,
    }),
  });
}

/**
 * Fixed shortlist-by-load arm from an independent cold start. Load coordinates
 * are deliberately resolved before the run and are never accepted as generic
 * runtime patches or interpreted as fitted compensation parameters.
 */
export function runMainWireNormalAdultFiveWallVentricularCalciumSourceTraceFitShortlistLoadResearchV1(
  options:
    MainWireNormalAdultFiveWallVentricularCalciumWaveformResearchOptionsV1,
  armId: MainWireVentricularCalciumSourceTraceFitShortlistArmIdV1,
  contextId:
    MainWireVentricularCalciumSourceTraceFitShortlistLoadContextIdV1,
): MainWireNormalAdultFiveWallVentricularCalciumSourceTraceFitShortlistLoadResearchRunV1 {
  assertExactVentricularCalciumWaveformResearchOptions(options);
  const arm = resolveMainWireVentricularCalciumSourceTraceFitShortlistArmV1(
    armId,
  );
  const context =
    resolveMainWireVentricularCalciumSourceTraceFitShortlistLoadContextV1(
      contextId,
    );
  const runtime = resolveMainWireNormalAdultFiveWallCirculatoryLoadRuntimeV1(
    context.circulatoryLoadPointId,
  );
  const circulatoryLoadPoint =
    resolveMainWireNormalAdultFiveWallCirculatoryLoadPointV1(
      context.circulatoryLoadPointId,
    );
  const bloodVolume = resolveMainWireNormalAdultBloodVolumeResearchPointV1(
    runtime,
    context.stressedVenousVolumePointId,
  );
  const mechanicsResearchInput = arm.candidate === null
    ? null
    : resolveMainWireVentricularCalciumSourceTraceFitTrefPassiveMechanicsInputV1(
      arm.candidate.pairedBaselineProfileId,
    );
  const provider = mechanicsResearchInput === null
    ? createCanonicalMainWireNormalAdultFiveWallProviderV1()
    : createMainWireNormalAdultFiveWallProviderWithMechanicsResearchInputsAndFixedVentricularDistortionTransientV1(
      mechanicsResearchInput,
    );
  const calciumDriveParams = arm.candidate === null
    ? FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1
    : resolveMainWireVentricularCalciumSourceTraceFitParamsV1();
  const periodicResult =
    runMainWireNormalAdultFiveWallPeriodicSteadyResolvedRuntimeV1(
      Object.freeze({
        dtSec: options.dtSec,
        ...(options.maximumBeatCount === undefined
          ? {}
          : { maximumBeatCount: options.maximumBeatCount }),
        laSlsMode: "on" as const,
        pericardiumMode: "on" as const,
        pericardiumCase: "healthy-slack" as const,
        initialization: "canonical" as const,
        valveDiseaseBracketIds: Object.freeze([]),
      }),
      runtime,
      Object.freeze({
        provider,
        bloodVolumeOperatingPoint: bloodVolume.operatingPoint,
        calciumDriveParams,
      }),
    );
  const resolvedProviderIdentity = Object.freeze({
    providerId: provider.providerId,
    parameterSetId: provider.parameterSetId,
    parameterIdentityHash: provider.parameterIdentityHash,
    stateSchemaVersion: provider.stateSchemaVersion,
  });
  const protocol = periodicResult.protocolIdentity;
  if (
    protocol.mechanicsProvider.providerId
      !== resolvedProviderIdentity.providerId
    || protocol.mechanicsProvider.parameterSetId
      !== resolvedProviderIdentity.parameterSetId
    || protocol.mechanicsProvider.parameterIdentityHash
      !== resolvedProviderIdentity.parameterIdentityHash
    || protocol.mechanicsProvider.stateSchemaVersion
      !== resolvedProviderIdentity.stateSchemaVersion
    || protocol.bloodVolumeOperatingPoint.fixedTotalBloodVolumeMl
      !== bloodVolume.operatingPoint.fixedTotalBloodVolumeMl
    || protocol.calciumDrive.parameterSetId
      !== calciumDriveParams.parameterSetId
    || protocol.calciumDrive.fixedParamsStableHash
      !== hashProtocolValue(calciumDriveParams)
  ) {
    throw new Error(
      "source-calcium shortlist load assembly drifted from protocol identity",
    );
  }
  return Object.freeze({
    configurationRole:
      "fixed-ventricular-calcium-source-trace-fit-shortlist-load-envelope-run" as const,
    arm,
    context,
    mechanicsResearchInput,
    calciumDriveParams,
    circulatoryLoadPoint,
    stressedVenousVolumePoint: bloodVolume.point,
    resolvedProviderIdentity,
    resolvedBloodVolumeIdentity: bloodVolume.operatingPoint.identity,
    periodicResult,
    claim: Object.freeze({
      sourceResearchRunnerOnly: true as const,
      independentCanonicalColdStart: true as const,
      warmStartApplied: false as const,
      genericParameterPatchAccepted: false as const,
      fixedShortlistAndLoadContextOnly: true as const,
      loadContextIsRobustnessCoordinateNotCalibrationKnob: true as const,
      canonicalControlUsesCanonicalCalciumAndMechanics: true as const,
      shortlistUsesCommonSourceCalcium: true as const,
      shortlistUsesOnlyPredeclaredMechanicsComposition: true as const,
      aorticValveAreaOrLawChanged: false as const,
      pulmonaryValveAreaOrLawChanged: false as const,
      vascularUnstressedVolumesChanged: false as const,
      calciumOrMechanicsStateAdded: false as const,
      acceptedStateOrCheckpointTopologyChanged: false as const,
      exactProtocolIdentityIncludesAllResolvedOwners: true as const,
      numericTargetOptimizationApplied: false as const,
      patientFitOrCanonicalAdoption: false as const,
    }),
  });
}

/** Fixed delayed-mixture calcium arm from an independent canonical cold start. */
export function runMainWireNormalAdultFiveWallVentricularCalciumDelayedMixtureResearchV1(
  options:
    MainWireNormalAdultFiveWallVentricularCalciumWaveformResearchOptionsV1,
  profileId: MainWireVentricularCalciumDelayedMixtureProfileIdV1 =
    MAIN_WIRE_VENTRICULAR_CALCIUM_DELAYED_MIXTURE_PROFILE_V1_ID,
): MainWireNormalAdultFiveWallVentricularCalciumDelayedMixtureResearchRunV1 {
  assertExactVentricularCalciumWaveformResearchOptions(options);
  const profile =
    resolveMainWireVentricularCalciumDelayedMixtureProfileV1(profileId);
  const calciumDriveParams =
    resolveMainWireVentricularCalciumDelayedMixtureParamsV1(profileId);
  const runtime = normalAdultMainWireRuntimeV1();
  const provider = createCanonicalMainWireNormalAdultFiveWallProviderV1();
  const bloodVolumeOperatingPoint =
    resolveMainWireNormalAdultBloodVolumeOperatingPointV1(runtime);
  const periodicResult =
    runMainWireNormalAdultFiveWallPeriodicSteadyResolvedRuntimeV1(
      Object.freeze({
        dtSec: options.dtSec,
        ...(options.maximumBeatCount === undefined
          ? {}
          : { maximumBeatCount: options.maximumBeatCount }),
        laSlsMode: "on" as const,
        pericardiumMode: "on" as const,
        pericardiumCase: "healthy-slack" as const,
        initialization: "canonical" as const,
        valveDiseaseBracketIds: Object.freeze([]),
      }),
      runtime,
      Object.freeze({
        provider,
        bloodVolumeOperatingPoint,
        calciumDriveParams,
      }),
    );
  return Object.freeze({
    configurationRole:
      "fixed-ventricular-calcium-delayed-mixture-research-profile" as const,
    profile,
    calciumDriveParams,
    periodicResult,
    claim: Object.freeze({
      sourceResearchRunnerOnly: true as const,
      independentCanonicalColdStart: true as const,
      warmStartApplied: false as const,
      genericParameterPatchAccepted: false as const,
      valveDiseaseBracketApplied: false as const,
      circulationRuntimeChanged: false as const,
      mechanicsProviderChanged: false as const,
      calciumOrMechanicsStateAdded: false as const,
      acceptedStateOrCheckpointTopologyChanged: false as const,
      exactProtocolIdentityIncludesCalciumParams: true as const,
    }),
  });
}

/** Peak-time-locked biexponential tail arm from an independent cold start. */
export function runMainWireNormalAdultFiveWallVentricularCalciumPeakLockedTailResearchV1(
  options:
    MainWireNormalAdultFiveWallVentricularCalciumWaveformResearchOptionsV1,
  profileId: MainWireVentricularCalciumPeakLockedTailProfileIdV1,
): MainWireNormalAdultFiveWallVentricularCalciumPeakLockedTailResearchRunV1 {
  assertExactVentricularCalciumWaveformResearchOptions(options);
  const profile =
    resolveMainWireVentricularCalciumPeakLockedTailProfileV1(profileId);
  const calciumDriveParams =
    resolveMainWireVentricularCalciumPeakLockedTailParamsV1(profileId);
  const runtime = normalAdultMainWireRuntimeV1();
  const provider = createCanonicalMainWireNormalAdultFiveWallProviderV1();
  const bloodVolumeOperatingPoint =
    resolveMainWireNormalAdultBloodVolumeOperatingPointV1(runtime);
  const periodicResult =
    runMainWireNormalAdultFiveWallPeriodicSteadyResolvedRuntimeV1(
      Object.freeze({
        dtSec: options.dtSec,
        ...(options.maximumBeatCount === undefined
          ? {}
          : { maximumBeatCount: options.maximumBeatCount }),
        laSlsMode: "on" as const,
        pericardiumMode: "on" as const,
        pericardiumCase: "healthy-slack" as const,
        initialization: "canonical" as const,
        valveDiseaseBracketIds: Object.freeze([]),
      }),
      runtime,
      Object.freeze({
        provider,
        bloodVolumeOperatingPoint,
        calciumDriveParams,
      }),
    );
  return Object.freeze({
    configurationRole:
      "fixed-ventricular-calcium-peak-locked-tail-research-profile" as const,
    profile,
    calciumDriveParams,
    periodicResult,
    claim: Object.freeze({
      sourceResearchRunnerOnly: true as const,
      independentCanonicalColdStart: true as const,
      warmStartApplied: false as const,
      genericParameterPatchAccepted: false as const,
      valveDiseaseBracketApplied: false as const,
      circulationRuntimeChanged: false as const,
      mechanicsProviderChanged: false as const,
      calciumOrMechanicsStateAdded: false as const,
      acceptedStateOrCheckpointTopologyChanged: false as const,
      exactProtocolIdentityIncludesCalciumParams: true as const,
    }),
  });
}

/** Fixed delayed-mixture × circulatory-load point from a cold start. */
export function runMainWireNormalAdultFiveWallVentricularCalciumDelayedMixtureLoadResearchV1(
  options:
    MainWireNormalAdultFiveWallVentricularCalciumWaveformResearchOptionsV1,
  profileId: MainWireVentricularCalciumDelayedMixtureProfileIdV1,
  loadPointId: MainWireNormalAdultFiveWallCirculatoryLoadPointIdV1,
): MainWireNormalAdultFiveWallVentricularCalciumDelayedMixtureLoadResearchRunV1 {
  assertExactVentricularCalciumWaveformResearchOptions(options);
  const profile =
    resolveMainWireVentricularCalciumDelayedMixtureProfileV1(profileId);
  const loadPoint =
    resolveMainWireNormalAdultFiveWallCirculatoryLoadPointV1(loadPointId);
  const calciumDriveParams =
    resolveMainWireVentricularCalciumDelayedMixtureParamsV1(profileId);
  const runtime =
    resolveMainWireNormalAdultFiveWallCirculatoryLoadRuntimeV1(loadPointId);
  const provider = createCanonicalMainWireNormalAdultFiveWallProviderV1();
  const bloodVolumeOperatingPoint =
    resolveMainWireNormalAdultBloodVolumeOperatingPointV1(runtime);
  const periodicResult =
    runMainWireNormalAdultFiveWallPeriodicSteadyResolvedRuntimeV1(
      Object.freeze({
        dtSec: options.dtSec,
        ...(options.maximumBeatCount === undefined
          ? {}
          : { maximumBeatCount: options.maximumBeatCount }),
        laSlsMode: "on" as const,
        pericardiumMode: "on" as const,
        pericardiumCase: "healthy-slack" as const,
        initialization: "canonical" as const,
        valveDiseaseBracketIds: Object.freeze([]),
      }),
      runtime,
      Object.freeze({
        provider,
        bloodVolumeOperatingPoint,
        calciumDriveParams,
      }),
    );
  return Object.freeze({
    configurationRole:
      "fixed-ventricular-calcium-delayed-mixture-load-research-point" as const,
    profile,
    loadPoint,
    calciumDriveParams,
    periodicResult,
    claim: Object.freeze({
      sourceResearchRunnerOnly: true as const,
      independentCanonicalColdStart: true as const,
      warmStartApplied: false as const,
      genericParameterPatchAccepted: false as const,
      valveDiseaseBracketApplied: false as const,
      mechanicsProviderChanged: false as const,
      calciumOrMechanicsStateAdded: false as const,
      acceptedStateOrCheckpointTopologyChanged: false as const,
      exactProtocolIdentityIncludesCalciumAndLoadParams: true as const,
    }),
  });
}

/** Fixed delayed-mixture × Ao-to-SA capacity redistribution from a cold start. */
export function runMainWireNormalAdultFiveWallVentricularCalciumDelayedMixtureCompliancePartitionResearchV1(
  options:
    MainWireNormalAdultFiveWallVentricularCalciumWaveformResearchOptionsV1,
  calciumProfileId: MainWireVentricularCalciumDelayedMixtureProfileIdV1,
  compliancePartitionProfileId:
    MainWireAorticCompliancePartitionResearchProfileIdV1,
): MainWireNormalAdultFiveWallVentricularCalciumDelayedMixtureCompliancePartitionResearchRunV1 {
  assertExactVentricularCalciumWaveformResearchOptions(options);
  const calciumProfile =
    resolveMainWireVentricularCalciumDelayedMixtureProfileV1(calciumProfileId);
  const compliancePartitionProfile =
    resolveMainWireAorticCompliancePartitionResearchProfileV1(
      compliancePartitionProfileId,
    );
  const capacitySnapshot =
    resolveMainWireAorticCompliancePartitionCapacitySnapshotV1(
      compliancePartitionProfile,
    );
  const calciumDriveParams =
    resolveMainWireVentricularCalciumDelayedMixtureParamsV1(calciumProfileId);
  const baselineRuntime = normalAdultMainWireRuntimeV1();
  const runtime: NonCoronaryCirculationRuntimeParamsV1 = Object.freeze({
    ...baselineRuntime,
    vascular: Object.freeze({
      ...baselineRuntime.vascular,
      aorticCompliancePartitionResearchProfile: compliancePartitionProfile,
    }),
  });
  const provider = createCanonicalMainWireNormalAdultFiveWallProviderV1();
  const bloodVolumeOperatingPoint =
    resolveMainWireNormalAdultBloodVolumeOperatingPointV1(runtime);
  const periodicResult =
    runMainWireNormalAdultFiveWallPeriodicSteadyResolvedRuntimeV1(
      Object.freeze({
        dtSec: options.dtSec,
        ...(options.maximumBeatCount === undefined
          ? {}
          : { maximumBeatCount: options.maximumBeatCount }),
        laSlsMode: "on" as const,
        pericardiumMode: "on" as const,
        pericardiumCase: "healthy-slack" as const,
        initialization: "canonical" as const,
        valveDiseaseBracketIds: Object.freeze([]),
      }),
      runtime,
      Object.freeze({
        provider,
        bloodVolumeOperatingPoint,
        calciumDriveParams,
      }),
    );
  return Object.freeze({
    configurationRole:
      "fixed-delayed-mixture-compliance-partition-research-arm" as const,
    calciumProfile,
    compliancePartitionProfile,
    capacitySnapshot,
    calciumDriveParams,
    periodicResult,
    claim: Object.freeze({
      sourceResearchRunnerOnly: true as const,
      independentCanonicalColdStart: true as const,
      warmStartApplied: false as const,
      genericParameterPatchAccepted: false as const,
      valveDiseaseBracketApplied: false as const,
      mechanicsProviderChanged: false as const,
      calciumOrMechanicsStateAdded: false as const,
      aorticValveConstitutiveLawChanged: false as const,
      globalArterialStiffnessChanged: false as const,
      aorticRootPlusSystemicArteryVsSumPreservedExactly: true as const,
      acceptedStateOrCheckpointTopologyChanged: false as const,
      exactProtocolIdentityIncludesCalciumAndPartitionProfiles: true as const,
    }),
  });
}

/** Coupled historical AoV-L retest with runner-owned q and no warm start. */
export function runMainWireNormalAdultFiveWallAorticValveLocalInertanceResearchV1(
  options: MainWireNormalAdultFiveWallAorticValveResearchOptionsV1,
): MainWireNormalAdultFiveWallAorticValveLocalInertanceResearchRunV1 {
  assertExactAorticValveResearchOptions(options);
  const baselineRuntime = normalAdultMainWireRuntimeV1();
  const runtime: NonCoronaryCirculationRuntimeParamsV1 = Object.freeze({
    ...baselineRuntime,
    aorticValveLocalInertanceResearchProfile:
      MAIN_WIRE_AORTIC_VALVE_LOCAL_INERTANCE_PROFILE_V1,
  });
  const periodicResult =
    runMainWireNormalAdultFiveWallPeriodicSteadyResolvedRuntimeV1(
      Object.freeze({
        dtSec: options.dtSec,
        ...(options.maximumBeatCount === undefined
          ? {}
          : { maximumBeatCount: options.maximumBeatCount }),
        laSlsMode: "on" as const,
        pericardiumMode: "on" as const,
        pericardiumCase: "healthy-slack" as const,
        initialization: "canonical" as const,
        valveDiseaseBracketIds: Object.freeze([]),
      }),
      runtime,
    );
  const externalFlowStateAudit =
    periodicResult.aorticValveLocalInertanceResearchAudit;
  if (externalFlowStateAudit === undefined) {
    throw new Error("AoV local-inertance runner omitted external q audit");
  }
  return Object.freeze({
    configurationRole:
      "fixed-aortic-valve-local-inertance-research-profile" as const,
    profile: MAIN_WIRE_AORTIC_VALVE_LOCAL_INERTANCE_PROFILE_V1,
    periodicResult,
    externalFlowStateAudit,
    claim: Object.freeze({
      sourceResearchRunnerOnly: true as const,
      independentCanonicalColdStart: true as const,
      genericParameterPatchAccepted: false as const,
      valveDiseaseBracketApplied: false as const,
      externalFlowPromotedOnlyAfterSuccessfulCoupledStep: true as const,
      canonicalAcceptedStateOrCheckpointChanged: false as const,
      standardWarmStartEmitted: false as const,
    }),
  });
}

/** Fixed upper-physical-L x pressure-recovery 2x2 from independent cold starts. */
export function runMainWireNormalAdultFiveWallAorticValveLocalInertancePressureRecoveryArmV1(
  options: MainWireNormalAdultFiveWallAorticValveResearchOptionsV1,
  armId: MainWireAorticValveLocalInertancePressureRecoveryArmIdV1,
): MainWireNormalAdultFiveWallAorticValveLocalInertancePressureRecoveryRunV1 {
  assertExactAorticValveResearchOptions(options);
  const arm =
    resolveMainWireAorticValveLocalInertancePressureRecoveryArmV1(armId);
  const localInertanceProfile = arm.localInertanceProfileId === null
    ? null
    : resolveMainWireAorticValveLocalInertanceProfileV1(
      arm.localInertanceProfileId,
    );
  const pressureRecoveryProfile = arm.pressureRecoveryProfileId === null
    ? null
    : resolveMainWireAorticValveResearchProfileV1(
      arm.pressureRecoveryProfileId,
    );
  const baselineRuntime = normalAdultMainWireRuntimeV1();
  const runtime: NonCoronaryCirculationRuntimeParamsV1 = Object.freeze({
    ...baselineRuntime,
    ...(localInertanceProfile === null
      ? {}
      : { aorticValveLocalInertanceResearchProfile: localInertanceProfile }),
    ...(pressureRecoveryProfile === null
      ? {}
      : { aorticValveResearchProfile: pressureRecoveryProfile }),
  });
  const periodicResult =
    runMainWireNormalAdultFiveWallPeriodicSteadyResolvedRuntimeV1(
      Object.freeze({
        dtSec: options.dtSec,
        ...(options.maximumBeatCount === undefined
          ? {}
          : { maximumBeatCount: options.maximumBeatCount }),
        laSlsMode: "on" as const,
        pericardiumMode: "on" as const,
        pericardiumCase: "healthy-slack" as const,
        initialization: "canonical" as const,
        valveDiseaseBracketIds: Object.freeze([]),
      }),
      runtime,
    );
  const audit = periodicResult.aorticValveLocalInertanceResearchAudit ?? null;
  if (localInertanceProfile !== null && audit === null) {
    throw new Error("AoV L x pressure-recovery arm omitted external q audit");
  }
  if (localInertanceProfile === null && audit !== null) {
    throw new Error("AoV L-off arm unexpectedly emitted external q audit");
  }
  return Object.freeze({
    configurationRole:
      "fixed-aortic-valve-local-inertance-pressure-recovery-factorial-arm" as const,
    arm,
    localInertanceProfile,
    pressureRecoveryProfile,
    periodicResult,
    externalFlowStateAudit: audit,
    claim: Object.freeze({
      sourceResearchRunnerOnly: true as const,
      independentCanonicalColdStart: true as const,
      warmStartApplied: false as const,
      genericParameterPatchAccepted: false as const,
      valveDiseaseBracketApplied: false as const,
      openingModeChanged: false as const,
      aorticMaximumForwardEoaChanged: false as const,
      externalFlowPromotedOnlyAfterSuccessfulCoupledStepWhenApplicable:
        true as const,
      canonicalAcceptedStateOrCheckpointChanged: false as const,
      standardWarmStartEmittedWhenLocalInertanceOn: false as const,
      exactRuntimeIdentityIncludesBothFactorProfiles: true as const,
    }),
  });
}

/**
 * Runs one of the fixed circulatory-load sensitivity points from an independent
 * canonical cold start. The intentionally narrow option surface prevents this
 * research seam from becoming a generic parameter-patch or warm-start API.
 */
export function runMainWireNormalAdultFiveWallCirculatoryLoadResearchPointV1(
  options: MainWireNormalAdultFiveWallCirculatoryLoadResearchOptionsV1,
  pointId: MainWireNormalAdultFiveWallCirculatoryLoadPointIdV1,
): MainWireNormalAdultFiveWallPeriodicResultV1 {
  assertExactCirculatoryLoadResearchOptions(options);
  const runtime =
    resolveMainWireNormalAdultFiveWallCirculatoryLoadRuntimeV1(pointId);
  return runMainWireNormalAdultFiveWallPeriodicSteadyResolvedRuntimeV1(
    Object.freeze({
      dtSec: options.dtSec,
      ...(options.maximumBeatCount === undefined
        ? {}
        : { maximumBeatCount: options.maximumBeatCount }),
      laSlsMode: "on" as const,
      pericardiumMode: "on" as const,
      pericardiumCase: "healthy-slack" as const,
      initialization: "canonical" as const,
      valveDiseaseBracketIds: Object.freeze([]),
    }),
    runtime,
  );
}

/**
 * Fixed-ID-only source research runner. Every call constructs a new provider,
 * a new fixed-TBV cold state, and iterates ordinary beats without warm start.
 */
export function runMainWireNormalAdultFiveWallMacroPhysiologyResearchPointV1(
  options: MainWireNormalAdultFiveWallMacroPhysiologyResearchOptionsV1,
  pointId: MainWireNormalAdultFiveWallMacroPhysiologyPointIdV1,
): MainWireNormalAdultFiveWallMacroPhysiologyResearchRunV1 {
  assertExactMacroPhysiologyResearchOptions(options);
  const point = resolveMainWireNormalAdultFiveWallMacroPhysiologyPointV1(pointId);
  const runtime = normalAdultMainWireRuntimeV1();
  const provider = createFixedResearchMainWireNormalAdultFiveWallProviderV1(
    point.materialPointId,
  );
  const materialPoint =
    resolveMainWireNormalAdultVentricularMaterialResearchPointV1(
      point.materialPointId,
    );
  const bloodVolume = resolveMainWireNormalAdultBloodVolumeResearchPointV1(
    runtime,
    point.stressedVenousVolumePointId,
  );
  const periodicResult =
    runMainWireNormalAdultFiveWallPeriodicSteadyResolvedRuntimeV1(
      Object.freeze({
        dtSec: options.dtSec,
        ...(options.maximumBeatCount === undefined
          ? {}
          : { maximumBeatCount: options.maximumBeatCount }),
        laSlsMode: "on" as const,
        pericardiumMode: "on" as const,
        pericardiumCase: "healthy-slack" as const,
        initialization: "canonical" as const,
        valveDiseaseBracketIds: Object.freeze([]),
      }),
      runtime,
      Object.freeze({
        provider,
        bloodVolumeOperatingPoint: bloodVolume.operatingPoint,
      }),
    );
  const resolvedProviderIdentity = Object.freeze({
    providerId: provider.providerId,
    parameterSetId: provider.parameterSetId,
    parameterIdentityHash: provider.parameterIdentityHash,
    stateSchemaVersion: provider.stateSchemaVersion,
  });
  if (
    periodicResult.protocolIdentity.mechanicsProvider.providerId
      !== resolvedProviderIdentity.providerId
    || periodicResult.protocolIdentity.mechanicsProvider.parameterSetId
      !== resolvedProviderIdentity.parameterSetId
    || periodicResult.protocolIdentity.mechanicsProvider.parameterIdentityHash
      !== resolvedProviderIdentity.parameterIdentityHash
    || periodicResult.protocolIdentity.bloodVolumeOperatingPoint
      .fixedTotalBloodVolumeMl
      !== bloodVolume.operatingPoint.fixedTotalBloodVolumeMl
  ) throw new Error("macro physiology resolved assembly drifted from protocol identity");
  return Object.freeze({
    configurationRole: "fixed-research-point" as const,
    point,
    materialPoint,
    stressedVenousVolumePoint: bloodVolume.point,
    resolvedProviderIdentity,
    resolvedBloodVolumeIdentity: bloodVolume.operatingPoint.identity,
    periodicResult,
    claim: Object.freeze({
      sourceResearchRunnerOnly: true as const,
      independentCanonicalColdStart: true as const,
      warmStartApplied: false as const,
      genericParameterPatchAccepted: false as const,
      wholeLoopDirectionIsDescriptiveNotAcceptance: true as const,
    }),
  });
}

function runMainWireNormalAdultFiveWallPeriodicSteadyResolvedRuntimeV1(
  options: MainWireNormalAdultFiveWallPeriodicOptionsV1,
  runtime: NonCoronaryCirculationRuntimeParamsV1,
  resolvedAssembly?: ResolvedPeriodicAssemblyV1,
  executionControl?: MainWireNormalAdultFiveWallPeriodicExecutionControlV1,
): MainWireNormalAdultFiveWallPeriodicResultV1 {
  const calciumDriveParams =
    resolvedAssembly?.calciumDriveParams ??
    FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1;
  const resolved = validateAndResolveOptions(
    options,
    calciumDriveParams.cycleLengthSec,
  );
  const minimumCompletedBeatCountBeforePeriodicTermination =
    executionControl?.minimumCompletedBeatCountBeforePeriodicTermination ?? 0;
  if (
    !Number.isInteger(minimumCompletedBeatCountBeforePeriodicTermination)
    || minimumCompletedBeatCountBeforePeriodicTermination < 0
    || minimumCompletedBeatCountBeforePeriodicTermination
      > resolved.maximumBeatCount
  ) {
    throw new Error(
      "minimum completed beat count before periodic termination must be a nonnegative integer no greater than maximumBeatCount",
    );
  }
  if (
    resolved.warmStart !== null &&
    resolved.cycleLengthSec !== STANDARD_WARM_START_CYCLE_LENGTH_SEC
  ) {
    throw new Error(
      "non-HR60 calcium cycles do not emit or restore the V3 warm-start schema",
    );
  }
  const localAorticValveInertanceProfile =
    runtime.aorticValveLocalInertanceResearchProfile;
  if (
    localAorticValveInertanceProfile !== undefined
    && resolved.warmStart !== null
  ) {
    throw new Error("AoV local-inertance research does not accept standard warm start");
  }
  const provider = resolvedAssembly?.provider
    ?? createCanonicalMainWireNormalAdultFiveWallProviderV1(resolved.laSlsMode);
  const pericardium = createMainWireNormalAdultCommonPericardiumV1(
    resolved.pericardiumMode,
    resolved.pericardiumCase,
  );
  const bloodVolumeOperatingPoint =
    resolvedAssembly?.bloodVolumeOperatingPoint ??
    resolveMainWireNormalAdultBloodVolumeOperatingPointV1(runtime);
  const protocol = buildPeriodicProtocolIdentity(
    provider,
    runtime,
    pericardium,
    bloodVolumeOperatingPoint.identity,
    calciumDriveParams,
  );
  const canonicalCirculation = createInitialNonCoronaryCirculationStateV1({
    timeSec: 0,
    runtime,
    fixedTotalBloodVolumeMl:
      bloodVolumeOperatingPoint.fixedTotalBloodVolumeMl,
    nodeVolumesMl: bloodVolumeOperatingPoint.nodeVolumesMl,
  });
  const canonicalCold = initializeMainWireFiveWallNonCoronaryV1({
    provider,
    runtime,
    calciumDriveParams,
    pericardium,
    circulationInitial: initialStateInput(canonicalCirculation),
  });
  const initializedState = resolved.warmStart !== null
    ? restoreWarmStart(provider, protocol, resolved.warmStart)
    : resolved.initialization === "canonical"
      ? canonicalCold.acceptedState
      : initializeMainWireFiveWallNonCoronaryV1({
        provider,
        runtime,
        calciumDriveParams,
        pericardium,
        circulationInitial: pulmonaryRedistributionInitialState(
          canonicalCirculation,
        ),
      }).acceptedState;
  const initializationAudit = resolved.warmStart === null
    ? auditInitialization(
      provider,
      canonicalCold.acceptedState,
      initializedState,
      resolved.initialization,
    )
    : auditWarmStartInitialization(
      provider,
      canonicalCold.acceptedState,
      initializedState,
      resolved.warmStart,
      protocol,
    );

  let state = initializedState;
  let localAorticValveAcceptedFlowMlPerSec =
    localAorticValveInertanceProfile === undefined ? null : 0;
  const localAorticValveBoundaryFlowsMlPerSec: number[] =
    localAorticValveInertanceProfile === undefined ? [] : [0];
  const boundaryStates: AcceptedState[] = [state];
  const observations: MainWireFiveWallPeriodicBeatObservationV1[] = [];
  const retainedCompleteBeats: MainWireNormalAdultFiveWallRetainedBeatV1[] = [];
  let retainedPartialBeat: MainWireNormalAdultFiveWallDiagnosticSampleV2[] = [];
  let classification = classify(observations);
  let failure: MainWireNormalAdultFiveWallPeriodicResultV1["failure"] = null;

  beatLoop:
  for (
    let beatIndex = 1;
    beatIndex <= resolved.maximumBeatCount;
    beatIndex += 1
  ) {
    const beatSamples: MainWireNormalAdultFiveWallDiagnosticSampleV2[] = [];
    const startTimeSec = state.acceptedTimeSec;
    for (
      let stepWithinBeat = 1;
      stepWithinBeat <= resolved.stepsPerBeat;
      stepWithinBeat += 1
    ) {
      const stepped = stepMainWireFiveWallNonCoronaryV1(provider, state, {
        dtSec: resolved.dtSec,
        runtime,
        calciumDriveParams,
        pericardium,
        ...(localAorticValveAcceptedFlowMlPerSec === null
          ? {}
          : {
            aorticValveLocalInertancePreviousAcceptedFlowMlPerSec:
              localAorticValveAcceptedFlowMlPerSec,
          }),
      });
      if (stepped.converged === false) {
        retainedPartialBeat = beatSamples;
        failure = Object.freeze({
          beatIndex,
          stepWithinBeat,
          globalStepIndex:
            (beatIndex - 1) * resolved.stepsPerBeat + stepWithinBeat,
          timeSec: state.acceptedTimeSec + resolved.dtSec,
          message: stepped.message,
          reason: stepped.reason,
          circulationFailureReason: stepped.circulationFailureReason,
          finalizationFailureStage: stepped.finalizationFailureStage,
          lastAcceptedCandidateNodeVolumesMl:
            stepped.lastAcceptedCandidateNodeVolumesMl,
          circulationDiagnostics: stepped.circulationDiagnostics,
        });
        break beatLoop;
      }
      state = stepped.acceptedState;
      if (localAorticValveAcceptedFlowMlPerSec !== null) {
        localAorticValveAcceptedFlowMlPerSec =
          stepped.circulationTrial.edgeFlowsMlPerSec.AoV;
      }
      beatSamples.push(
        samplePeriodicDiagnosticStep(stepped, resolved.cycleLengthSec),
      );
    }

    boundaryStates.push(state);
    if (localAorticValveAcceptedFlowMlPerSec !== null) {
      localAorticValveBoundaryFlowsMlPerSec.push(
        localAorticValveAcceptedFlowMlPerSec,
      );
    }
    const currentBoundaryIndex = boundaryStates.length - 1;
    const period1 = compareMainWireFiveWallAcceptedStatesV1(
      state,
      boundaryStates[currentBoundaryIndex - 1]!,
      MAIN_WIRE_FIVE_WALL_PERIODIC_REFERENCE_SCALES_V1,
    );
    const period2 = currentBoundaryIndex >= 2
      ? compareMainWireFiveWallAcceptedStatesV1(
        state,
        boundaryStates[currentBoundaryIndex - 2]!,
        MAIN_WIRE_FIVE_WALL_PERIODIC_REFERENCE_SCALES_V1,
      )
      : null;
    observations.push(Object.freeze({ beatIndex, period1, period2 }));
    classification = classify(observations);
    retainedCompleteBeats.push(Object.freeze({
      beatIndex,
      startTimeSec,
      endTimeSec: state.acceptedTimeSec,
      samples: Object.freeze(beatSamples),
    }));
    if (
      retainedCompleteBeats.length
      > MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_POLICY_V1
        .retainedCompleteBeatCount
    ) retainedCompleteBeats.shift();
    if (boundaryStates.length > 3) boundaryStates.shift();
    const externalClosure = classifyAorticValveLocalFlowClosure(
      localAorticValveBoundaryFlowsMlPerSec,
    );
    if (
      beatIndex >= minimumCompletedBeatCountBeforePeriodicTermination
      && (
        (
          classification.status === "period1-converged"
          && externalClosure.period1BoundaryClosureSatisfied
        )
        || (
          classification.status === "period2-suspect"
          && externalClosure.period2BoundaryClosureSatisfied
        )
      )
    ) break;
  }

  const externalClosure = classifyAorticValveLocalFlowClosure(
    localAorticValveBoundaryFlowsMlPerSec,
  );
  const terminationReason = resolveTerminationReason(
    failure,
    classification,
    externalClosure,
  );
  const terminalCycleBoundaryWarmStart =
    failure === null &&
    observations.length > 0 &&
    localAorticValveInertanceProfile === undefined &&
    resolved.cycleLengthSec === STANDARD_WARM_START_CYCLE_LENGTH_SEC
      ? buildCycleBoundaryWarmStart(
          provider,
          state,
          protocol,
          resolved.dtSec,
          observations.length,
        )
      : null;
  return Object.freeze({
    experimentId: MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_STEADY_V1_ID,
    mode: "canonical" as const,
    protocolIdentity: protocol.identity,
    protocolIdentityHash: protocol.identityHash,
    protocolComponentHashes: protocol.componentHashes,
    bloodVolumeOperatingPointAudit: bloodVolumeOperatingPoint.audit,
    laSlsMode: resolved.laSlsMode,
    pericardiumMode: resolved.pericardiumMode,
    pericardiumCase: resolved.pericardiumCase,
    pericardiumParameterSetId: pericardium.parameterSetId,
    valveResearchInput: runtime.valveResearchInput,
    initialization: resolved.initialization,
    dtSec: resolved.dtSec,
    stepsPerBeat: resolved.stepsPerBeat,
    requestedMaximumBeatCount: resolved.maximumBeatCount,
    completedBeatCount: observations.length,
    terminationReason,
    integrationCompletedWithoutFailure: failure === null,
    periodicSteadyStateClaimed: terminationReason === "period1-converged",
    period2OrbitSuspected: terminationReason === "period2-suspect",
    periodicity: classification,
    beatClosure: Object.freeze(observations),
    retainedCompleteBeats: Object.freeze(retainedCompleteBeats),
    retainedPartialBeat: Object.freeze(retainedPartialBeat),
    terminalCycleBoundaryWarmStart,
    ...(localAorticValveInertanceProfile === undefined
      || localAorticValveAcceptedFlowMlPerSec === null
      ? {}
      : {
        aorticValveLocalInertanceResearchAudit: Object.freeze({
          profileId: localAorticValveInertanceProfile.profileId,
          initialAcceptedFlowMlPerSec: 0 as const,
          terminalAcceptedFlowMlPerSec:
            localAorticValveAcceptedFlowMlPerSec,
          cycleBoundaryAcceptedFlowsMlPerSec: Object.freeze([
            ...localAorticValveBoundaryFlowsMlPerSec,
          ]),
          ...externalClosure,
          externalFlowPromotedOnlyAfterSuccessfulCoupledStep: true as const,
          canonicalAcceptedStateOrCheckpointChanged: false as const,
          standardWarmStartEmitted: false as const,
        }),
      }),
    failure,
    initializationAudit,
    policy: MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_POLICY_V1,
    claim: Object.freeze({
      heartRateBpm: 60 / resolved.cycleLengthSec,
      circulation: "main-wire-derived-noncoronary-experimental" as const,
      ordinaryBeatIterationOnly: true as const,
      shootingOrAndersonAccelerationApplied: false as const,
      parameterSearch: false as const,
      initializationVariantChangesRuntimeOrMaterialParameters: false as const,
      pulmonaryRedistributionIsInitialConditionBasinAuditOnly: true as const,
      samePeriodicOrbitAcrossInitializationsClaimed: false as const,
      retainedSamplesAreAtMostTheLastThreeCompleteBeats: true as const,
      smoothingAppliedToSamples: false as const,
      pericardialConstraintInterfaceIncluded: true as const,
      pericardialConstraintEnabled: resolved.pericardiumMode === "on",
      pericardialConstraintMayBeSlackAtHealthyBaseline: true as const,
      warmStartIsInitialConditionOnly: true as const,
      valveDiseaseResearchInputIsProtocolParameterNotAcceptedState: true as const,
      valveDiseaseBracketIsClinicalDiagnosis: false as const,
    }),
  });
}

function assertExactCirculatoryLoadResearchOptions(
  options: MainWireNormalAdultFiveWallCirculatoryLoadResearchOptionsV1,
): void {
  if (options === null || typeof options !== "object" || Array.isArray(options)) {
    throw new Error("circulatory load research options must be an object");
  }
  const allowed = new Set(["dtSec", "maximumBeatCount"]);
  for (const key of Object.keys(options)) {
    if (!allowed.has(key)) {
      throw new Error(
        `circulatory load research options reject unsupported field: ${key}`,
      );
    }
  }
}

function assertExactAorticValveResearchOptions(
  options: MainWireNormalAdultFiveWallAorticValveResearchOptionsV1,
): void {
  if (options === null || typeof options !== "object" || Array.isArray(options)) {
    throw new Error("aortic-valve research options must be an object");
  }
  const allowed = new Set(["dtSec", "maximumBeatCount"]);
  for (const key of Object.keys(options)) {
    if (!allowed.has(key)) {
      throw new Error(
        `aortic-valve research options reject unsupported field: ${key}`,
      );
    }
  }
}

function assertExactAorticOutflowResearchOptions(
  options: MainWireNormalAdultFiveWallAorticOutflowResearchOptionsV1,
): void {
  if (options === null || typeof options !== "object" || Array.isArray(options)) {
    throw new Error("aortic-outflow research options must be an object");
  }
  const allowed = new Set(["dtSec", "maximumBeatCount"]);
  for (const key of Object.keys(options)) {
    if (!allowed.has(key)) {
      throw new Error(
        `aortic-outflow research options reject unsupported field: ${key}`,
      );
    }
  }
}

function assertExactVentricularCalciumWaveformResearchOptions(
  options:
    MainWireNormalAdultFiveWallVentricularCalciumWaveformResearchOptionsV1,
): void {
  if (options === null || typeof options !== "object" || Array.isArray(options)) {
    throw new Error(
      "ventricular calcium waveform research options must be an object",
    );
  }
  const allowed = new Set(["dtSec", "maximumBeatCount"]);
  for (const key of Object.keys(options)) {
    if (!allowed.has(key)) {
      throw new Error(
        "ventricular calcium waveform research options reject unsupported field: "
        + key,
      );
    }
  }
}

function assertExactMacroPhysiologyResearchOptions(
  options: MainWireNormalAdultFiveWallMacroPhysiologyResearchOptionsV1,
): void {
  if (options === null || typeof options !== "object" || Array.isArray(options)) {
    throw new Error("macro physiology research options must be an object");
  }
  const allowed = new Set(["dtSec", "maximumBeatCount"]);
  for (const key of Object.keys(options)) {
    if (!allowed.has(key)) {
      throw new Error(
        `macro physiology research options reject unsupported field: ${key}`,
      );
    }
  }
}

function buildPeriodicProtocolIdentity(
  provider: ReturnType<typeof createCanonicalMainWireNormalAdultFiveWallProviderV1>,
  runtime: NonCoronaryCirculationRuntimeParamsV1,
  pericardium: MainWireCommonPericardiumBindingV1,
  bloodVolumeOperatingPoint:
    MainWireNormalAdultBloodVolumeOperatingPointIdentityV1,
  calciumDriveParams: FiveWallNormalCalciumDriveParamsV1,
): Readonly<{
  identity: MainWireNormalAdultFiveWallPeriodicProtocolIdentityV1;
  identityHash: string;
  componentHashes: MainWireNormalAdultFiveWallPeriodicProtocolComponentHashesV1;
}> {
  const mechanicsProvider = deepFreezeProtocolValue({
    providerId: provider.providerId,
    parameterSetId: provider.parameterSetId,
    parameterIdentityHash: provider.parameterIdentityHash,
    stateSchemaVersion: provider.stateSchemaVersion,
  });
  const topologyGraph = buildNonCoronaryCirculationGraphV1();
  const commonPericardium = deepFreezeProtocolValue({
    bindingId: pericardium.bindingId,
    parameterSetId: pericardium.parameterSetId,
    mode: pericardium.mode,
    parameters: pericardium.parameters,
    wallMaterialVolumesM3: pericardium.wallMaterialVolumesM3,
    prescribedPericardialFluidVolumeM3:
      pericardium.prescribedPericardialFluidVolumeM3,
  });
  const topologyGraphSnapshot = deepFreezeProtocolValue({
    topologyId: topologyGraph.topologyId,
    nodes: topologyGraph.nodes,
    edges: topologyGraph.edges,
    scope: topologyGraph.scope,
  }) as MainWireNormalAdultFiveWallPeriodicProtocolIdentityV1["circulation"]["topologyGraphSnapshot"];
  const componentHashes = Object.freeze({
    mechanicsProviderMetadataStableHash: hashProtocolValue(mechanicsProvider),
    calciumDriveFixedParamsStableHash:
      hashProtocolValue(calciumDriveParams),
    circulationTopologyGraphStableHash:
      hashProtocolValue(topologyGraphSnapshot),
    circulationRuntimeStableHash: hashProtocolValue(runtime),
    bloodVolumeOperatingPointStableHash:
      hashProtocolValue(bloodVolumeOperatingPoint),
    commonPericardiumStableHash: hashProtocolValue(commonPericardium),
    periodicPolicyStableHash:
      hashProtocolValue(MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_POLICY_V1),
  });
  const identity = deepFreezeProtocolValue({
    identityId:
      MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_PROTOCOL_IDENTITY_V1_ID,
    mechanicsProvider,
    calciumDrive: {
      driveId: FIVE_WALL_NORMAL_CALCIUM_DRIVE_V1_ID,
      parameterSetId: calciumDriveParams.parameterSetId,
      fixedParamsStableHash:
        componentHashes.calciumDriveFixedParamsStableHash,
    },
    circulation: {
      topologyGraphSnapshot,
      topologyGraphStableHash:
        componentHashes.circulationTopologyGraphStableHash,
      runtimeStableHash: componentHashes.circulationRuntimeStableHash,
      valveResearchInputStableHash: hashProtocolValue(runtime.valveResearchInput),
      valveResearchInputSnapshot: runtime.valveResearchInput,
    },
    bloodVolumeOperatingPoint,
    commonPericardium: {
      bindingId: pericardium.bindingId,
      parameterSetId: pericardium.parameterSetId,
      mode: pericardium.mode,
      stableHash: componentHashes.commonPericardiumStableHash,
      bindingSnapshot: commonPericardium,
    },
    periodicPolicy: {
      policyId: MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_POLICY_V1.policyId,
      policyStableHash: componentHashes.periodicPolicyStableHash,
    },
  }) as MainWireNormalAdultFiveWallPeriodicProtocolIdentityV1;
  return Object.freeze({
    identity,
    identityHash: hashProtocolValue(identity),
    componentHashes,
  });
}

function hashProtocolValue(value: unknown): string {
  return stableHash(sanitizeForStableHash(value));
}

function deepFreezeProtocolValue<T>(value: T): Readonly<T> {
  const sanitized = sanitizeForStableHash(value) as T;
  return deepFreezeObject(sanitized);
}

function deepFreezeObject<T>(value: T): Readonly<T> {
  if (value !== null && typeof value === "object") {
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreezeObject(child);
    }
    Object.freeze(value);
  }
  return value;
}

function initialStateInput(
  state: ReturnType<typeof createInitialNonCoronaryCirculationStateV1>,
): Omit<NonCoronaryCirculationInitialStateInputV1, "timeSec" | "runtime"> {
  return Object.freeze({
    fixedTotalBloodVolumeMl: state.totalBloodVolumeMl,
    nodeVolumesMl: state.nodeVolumesMl,
    dynamicEdgeFlowsMlPerSec: state.dynamicEdgeFlowsMlPerSec,
    valveStates: state.valveStates,
  });
}

function pulmonaryRedistributionInitialState(
  canonical: ReturnType<typeof createInitialNonCoronaryCirculationStateV1>,
): Omit<NonCoronaryCirculationInitialStateInputV1, "timeSec" | "runtime"> {
  const transfer =
    MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PULMONARY_REDISTRIBUTION_V1
      .transferredVolumeMl;
  const nodeVolumesMl = Object.freeze({
    ...canonical.nodeVolumesMl,
    PVen: canonical.nodeVolumesMl.PVen - transfer,
    PVein: canonical.nodeVolumesMl.PVein + transfer,
  });
  if (!(nodeVolumesMl.PVen > 0)) {
    throw new Error("fixed pulmonary redistribution made PVen nonpositive");
  }
  const before = sumNodeVolumes(canonical.nodeVolumesMl);
  const after = sumNodeVolumes(nodeVolumesMl);
  if (Math.abs(after - before) > 1e-12) {
    throw new Error("fixed pulmonary redistribution changed total blood volume");
  }
  return Object.freeze({
    fixedTotalBloodVolumeMl: canonical.totalBloodVolumeMl,
    nodeVolumesMl,
    dynamicEdgeFlowsMlPerSec: canonical.dynamicEdgeFlowsMlPerSec,
    valveStates: canonical.valveStates,
  });
}

function samplePeriodicDiagnosticStep(
  step: Parameters<typeof sampleMainWireNormalAdultFiveWallDiagnosticStepV2>[0],
  cycleLengthSec: number,
): MainWireNormalAdultFiveWallDiagnosticSampleV2 {
  const sample = sampleMainWireNormalAdultFiveWallDiagnosticStepV2(step);
  if (cycleLengthSec === STANDARD_WARM_START_CYCLE_LENGTH_SEC) return sample;
  return Object.freeze({
    ...sample,
    cyclePhase01:
      positiveModulo(sample.timeSec, cycleLengthSec) / cycleLengthSec,
  });
}

function auditInitialization(
  provider: ReturnType<typeof createCanonicalMainWireNormalAdultFiveWallProviderV1>,
  canonical: AcceptedState,
  initialized: AcceptedState,
  variant: MainWireNormalAdultFiveWallPeriodicInitializationV1,
): MainWireNormalAdultFiveWallPeriodicResultV1["initializationAudit"] {
  if (variant === "cycle-boundary-warm-start") {
    throw new Error("warm-start initialization requires its dedicated audit");
  }
  const canonicalTotal = canonical.circulation.totalBloodVolumeMl;
  const initializedTotal = initialized.circulation.totalBloodVolumeMl;
  const totalDifference = initializedTotal - canonicalTotal;
  if (Math.abs(totalDifference) > 1e-12) {
    throw new Error("periodic initialization basin audit changed total blood volume");
  }
  const redistributed = variant !== "canonical";
  const transfer = redistributed
    ? MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PULMONARY_REDISTRIBUTION_V1
      .transferredVolumeMl
    : 0;
  for (const node of NON_CORONARY_NODE_NAMES_V1) {
    const expectedDelta = node === "PVen"
      ? -transfer
      : node === "PVein" ? transfer : 0;
    const actualDelta = initialized.circulation.nodeVolumesMl[node]
      - canonical.circulation.nodeVolumesMl[node];
    if (Math.abs(actualDelta - expectedDelta) > 1e-12) {
      throw new Error(`periodic basin audit changed unexpected node ${node}`);
    }
  }
  for (const chamber of ["LA", "LV", "RA", "RV"] as const) {
    if (
      initialized.circulation.nodeVolumesMl[chamber]
      !== canonical.circulation.nodeVolumesMl[chamber]
    ) throw new Error("periodic basin audit changed a chamber cold volume");
  }
  if (
    JSON.stringify(initialized.circulation.dynamicEdgeFlowsMlPerSec)
      !== JSON.stringify(canonical.circulation.dynamicEdgeFlowsMlPerSec)
  ) throw new Error("periodic basin audit changed a dynamic edge flow");
  if (
    JSON.stringify(initialized.circulation.valveStates)
      !== JSON.stringify(canonical.circulation.valveStates)
  ) throw new Error("periodic basin audit changed a valve opening state");
  const mechanicsChanged = initialized.mechanics.materialStateFingerprint
    !== canonical.mechanics.materialStateFingerprint
    || JSON.stringify(provider.stateCodec.encode(initialized.mechanics.materialState))
      !== JSON.stringify(provider.stateCodec.encode(canonical.mechanics.materialState));
  if (mechanicsChanged) {
    throw new Error("periodic basin audit changed the mechanics cold state");
  }
  return Object.freeze({
    canonicalTotalBloodVolumeMl: canonicalTotal,
    initializedTotalBloodVolumeMl: initializedTotal,
    totalBloodVolumeDifferenceMl: totalDifference,
    chamberVolumesChanged: false as const,
    dynamicEdgeFlowsChanged: false as const,
    valveOpeningStatesChanged: false as const,
    mechanicsColdInputChanged: false as const,
    mechanicsColdStateFingerprintChanged: false as const,
    transferredVolumeMl: transfer,
    sourceNode: redistributed ? "PVen" as const : null,
    destinationNode: redistributed ? "PVein" as const : null,
    pulmonaryNodeVolumeDeltaMl: Object.freeze({
      PVen: -transfer,
      PVein: transfer,
    }),
    warmStartSourceProtocolIdentityHash: null,
    warmStartTargetProtocolIdentityHash: null,
    warmStartSourcePericardiumStableHash: null,
    warmStartTargetPericardiumStableHash: null,
    warmStartProtocolDifference: "not-a-warm-start" as const,
  });
}

function restoreWarmStart(
  provider: ReturnType<typeof createCanonicalMainWireNormalAdultFiveWallProviderV1>,
  targetProtocol: ReturnType<typeof buildPeriodicProtocolIdentity>,
  warmStart: MainWireNormalAdultFiveWallCycleWarmStartV1,
): AcceptedState {
  if (
    warmStart.warmStartId
      !== MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CYCLE_WARM_START_V1_ID
    || warmStart.schemaVersion !== 3
  ) throw new Error("unsupported five-wall cycle warm start");
  const { envelopeFingerprint, ...fingerprintedEnvelope } = warmStart;
  if (hashProtocolValue(fingerprintedEnvelope) !== envelopeFingerprint) {
    throw new Error("warm-start envelope fingerprint mismatch");
  }
  if (
    hashProtocolValue(warmStart.sourceProtocolIdentity)
      !== warmStart.sourceProtocolIdentityHash
  ) throw new Error("warm-start source protocol identity hash mismatch");
  validateWarmStartSourceProtocolConsistency(warmStart);
  const targetHashes = targetProtocol.componentHashes;
  for (const key of [
    "mechanicsProviderMetadataStableHash",
    "calciumDriveFixedParamsStableHash",
    "circulationTopologyGraphStableHash",
    "circulationRuntimeStableHash",
    "bloodVolumeOperatingPointStableHash",
    "periodicPolicyStableHash",
  ] as const) {
    if (warmStart.sourceComponentHashes[key] !== targetHashes[key]) {
      throw new Error(`warm-start component mismatch: ${key}`);
    }
  }
  const pericardiumMatches = warmStart.sourceComponentHashes
    .commonPericardiumStableHash === targetHashes.commonPericardiumStableHash;
  const sourceAndTargetIdentityMatch = warmStart.sourceProtocolIdentityHash
    === targetProtocol.identityHash;
  if (pericardiumMatches !== sourceAndTargetIdentityMatch) {
    throw new Error("warm-start protocol difference is not common-pericardium-only");
  }
  const checkpointBloodVolumeOwnerMl =
    warmStart.checkpoint.circulation.state.totalBloodVolumeMl;
  if (
    !Number.isFinite(checkpointBloodVolumeOwnerMl)
    || checkpointBloodVolumeOwnerMl
      !== warmStart.sourceProtocolIdentity.bloodVolumeOperatingPoint
        .fixedTotalBloodVolumeMl
    || checkpointBloodVolumeOwnerMl
      !== targetProtocol.identity.bloodVolumeOperatingPoint.fixedTotalBloodVolumeMl
  ) {
    throw new Error("warm-start checkpoint TBV owner does not match protocol identity");
  }
  const phase = positiveModulo(
    warmStart.checkpoint.acceptedTimeSec,
    STANDARD_WARM_START_CYCLE_LENGTH_SEC,
  );
  if (Math.min(phase, STANDARD_WARM_START_CYCLE_LENGTH_SEC - phase) > 1e-9) {
    throw new Error("warm start must be captured at the HR60 cycle boundary");
  }
  const sourceSteps =
    STANDARD_WARM_START_CYCLE_LENGTH_SEC / warmStart.sourceDtSec;
  const sourceStepsPerBeat = Math.round(sourceSteps);
  if (
    !(warmStart.sourceDtSec > 0) ||
    !Number.isInteger(sourceStepsPerBeat) ||
    Math.abs(sourceSteps - sourceStepsPerBeat) > 1e-12 ||
    !Number.isInteger(warmStart.sourceCompletedBeatCount) ||
    warmStart.sourceCompletedBeatCount <= 0 ||
    warmStart.checkpoint.revision !==
      sourceStepsPerBeat * warmStart.sourceCompletedBeatCount ||
    Math.abs(
      warmStart.checkpoint.acceptedTimeSec -
        warmStart.sourceCompletedBeatCount *
          STANDARD_WARM_START_CYCLE_LENGTH_SEC,
    ) > 1e-9
  ) throw new Error("warm-start source dt/beat/checkpoint provenance mismatch");
  return restoreMainWireFiveWallNonCoronaryV1(
    provider,
    warmStart.checkpoint,
    { revision: 0, acceptedTimeSec: 0 },
  );
}

function validateWarmStartSourceProtocolConsistency(
  warmStart: MainWireNormalAdultFiveWallCycleWarmStartV1,
): void {
  const identity = warmStart.sourceProtocolIdentity;
  const hashes = warmStart.sourceComponentHashes;
  if (
    identity.identityId
      !== MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_PROTOCOL_IDENTITY_V1_ID
    || hashProtocolValue(identity.mechanicsProvider)
      !== hashes.mechanicsProviderMetadataStableHash
    || identity.calciumDrive.fixedParamsStableHash
      !== hashes.calciumDriveFixedParamsStableHash
    || identity.circulation.topologyGraphStableHash
      !== hashes.circulationTopologyGraphStableHash
    || hashProtocolValue(identity.circulation.topologyGraphSnapshot)
      !== hashes.circulationTopologyGraphStableHash
    || identity.circulation.runtimeStableHash
      !== hashes.circulationRuntimeStableHash
    || hashProtocolValue(identity.circulation.valveResearchInputSnapshot)
      !== identity.circulation.valveResearchInputStableHash
    || identity.bloodVolumeOperatingPoint === undefined
    || hashProtocolValue(identity.bloodVolumeOperatingPoint)
      !== hashes.bloodVolumeOperatingPointStableHash
    || identity.commonPericardium.stableHash
      !== hashes.commonPericardiumStableHash
    || hashProtocolValue(identity.commonPericardium.bindingSnapshot)
      !== hashes.commonPericardiumStableHash
    || identity.commonPericardium.bindingId
      !== identity.commonPericardium.bindingSnapshot.bindingId
    || identity.commonPericardium.parameterSetId
      !== identity.commonPericardium.bindingSnapshot.parameterSetId
    || identity.commonPericardium.mode
      !== identity.commonPericardium.bindingSnapshot.mode
    || identity.periodicPolicy.policyStableHash
      !== hashes.periodicPolicyStableHash
    || identity.commonPericardium.mode !== warmStart.sourcePericardiumMode
    || identity.commonPericardium.parameterSetId
      !== warmStart.sourcePericardiumParameterSetId
    || warmStart.claim.cycleBoundaryPhase01 !== 0
    || warmStart.claim.timeRebasedToZeroOnRestore !== true
    || warmStart.claim.parameterSearch !== false
    || warmStart.claim.pericardiumStateStored !== false
  ) throw new Error("warm-start source protocol provenance mismatch");
}

function buildCycleBoundaryWarmStart(
  provider: ReturnType<typeof createCanonicalMainWireNormalAdultFiveWallProviderV1>,
  state: AcceptedState,
  protocol: ReturnType<typeof buildPeriodicProtocolIdentity>,
  dtSec: number,
  completedBeatCount: number,
): MainWireNormalAdultFiveWallCycleWarmStartV1 {
  const phase = positiveModulo(
    state.acceptedTimeSec,
    STANDARD_WARM_START_CYCLE_LENGTH_SEC,
  );
  if (Math.min(phase, STANDARD_WARM_START_CYCLE_LENGTH_SEC - phase) > 1e-9) {
    throw new Error("terminal warm start is not on a cycle boundary");
  }
  const envelope = {
    warmStartId: MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CYCLE_WARM_START_V1_ID,
    schemaVersion: 3 as const,
    sourceProtocolIdentity: protocol.identity,
    sourceProtocolIdentityHash: protocol.identityHash,
    sourceComponentHashes: Object.freeze({ ...protocol.componentHashes }),
    sourcePericardiumMode: protocol.identity.commonPericardium.mode,
    sourcePericardiumParameterSetId:
      protocol.identity.commonPericardium.parameterSetId,
    sourceDtSec: dtSec,
    sourceCompletedBeatCount: completedBeatCount,
    checkpoint: checkpointMainWireFiveWallNonCoronaryV1(provider, state),
    claim: Object.freeze({
      cycleBoundaryPhase01: 0 as const,
      timeRebasedToZeroOnRestore: true as const,
      parameterSearch: false as const,
      pericardiumStateStored: false as const,
    }),
  };
  return Object.freeze({
    ...envelope,
    envelopeFingerprint: hashProtocolValue(envelope),
  });
}

function auditWarmStartInitialization(
  provider: ReturnType<typeof createCanonicalMainWireNormalAdultFiveWallProviderV1>,
  canonical: AcceptedState,
  initialized: AcceptedState,
  warmStart: MainWireNormalAdultFiveWallCycleWarmStartV1,
  targetProtocol: ReturnType<typeof buildPeriodicProtocolIdentity>,
): MainWireNormalAdultFiveWallPeriodicResultV1["initializationAudit"] {
  const canonicalTotal = canonical.circulation.totalBloodVolumeMl;
  const initializedTotal = initialized.circulation.totalBloodVolumeMl;
  const totalDifference = initializedTotal - canonicalTotal;
  if (Math.abs(totalDifference) > 1e-9) {
    throw new Error("cycle warm start changed total blood volume");
  }
  const chamberVolumesChanged = (["LA", "LV", "RA", "RV"] as const)
    .some((chamber) => initialized.circulation.nodeVolumesMl[chamber]
      !== canonical.circulation.nodeVolumesMl[chamber]);
  const dynamicEdgeFlowsChanged = JSON.stringify(
    initialized.circulation.dynamicEdgeFlowsMlPerSec,
  ) !== JSON.stringify(canonical.circulation.dynamicEdgeFlowsMlPerSec);
  const valveOpeningStatesChanged = JSON.stringify(
    initialized.circulation.valveStates,
  ) !== JSON.stringify(canonical.circulation.valveStates);
  const mechanicsColdStateFingerprintChanged =
    initialized.mechanics.materialStateFingerprint
      !== canonical.mechanics.materialStateFingerprint
    || JSON.stringify(provider.stateCodec.encode(initialized.mechanics.materialState))
      !== JSON.stringify(provider.stateCodec.encode(canonical.mechanics.materialState));
  return Object.freeze({
    canonicalTotalBloodVolumeMl: canonicalTotal,
    initializedTotalBloodVolumeMl: initializedTotal,
    totalBloodVolumeDifferenceMl: totalDifference,
    chamberVolumesChanged,
    dynamicEdgeFlowsChanged,
    valveOpeningStatesChanged,
    mechanicsColdInputChanged: chamberVolumesChanged,
    mechanicsColdStateFingerprintChanged,
    transferredVolumeMl: 0,
    sourceNode: null,
    destinationNode: null,
    pulmonaryNodeVolumeDeltaMl: Object.freeze({
      PVen: initialized.circulation.nodeVolumesMl.PVen
        - canonical.circulation.nodeVolumesMl.PVen,
      PVein: initialized.circulation.nodeVolumesMl.PVein
        - canonical.circulation.nodeVolumesMl.PVein,
    }),
    warmStartSourceProtocolIdentityHash:
      warmStart.sourceProtocolIdentityHash,
    warmStartTargetProtocolIdentityHash: targetProtocol.identityHash,
    warmStartSourcePericardiumStableHash:
      warmStart.sourceComponentHashes.commonPericardiumStableHash,
    warmStartTargetPericardiumStableHash:
      targetProtocol.componentHashes.commonPericardiumStableHash,
    warmStartProtocolDifference:
      warmStart.sourceProtocolIdentityHash === targetProtocol.identityHash
        ? "none" as const
        : "common-pericardium-only" as const,
  });
}

function classify(
  observations: readonly MainWireFiveWallPeriodicBeatObservationV1[],
): MainWireFiveWallPeriodicClassificationV1 {
  const policy = MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_POLICY_V1;
  return classifyMainWireFiveWallPeriodicityV1(observations, {
    period1NormalizedTolerance: policy.period1NormalizedTolerance,
    period2NormalizedTolerance: policy.period2NormalizedTolerance,
    period2MinimumPeriod1NormalizedDelta:
      policy.period2MinimumPeriod1NormalizedDelta,
    consecutiveBeats: policy.consecutiveBeats,
  });
}

type MainWireAorticValveLocalFlowClosureV1 = Readonly<{
  period1BoundaryClosureSatisfied: boolean;
  period2BoundaryClosureSatisfied: boolean;
}>;

function classifyAorticValveLocalFlowClosure(
  boundaryFlowsMlPerSec: readonly number[],
): MainWireAorticValveLocalFlowClosureV1 {
  if (boundaryFlowsMlPerSec.length === 0) {
    return Object.freeze({
      period1BoundaryClosureSatisfied: true,
      period2BoundaryClosureSatisfied: true,
    });
  }
  const policy = MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_POLICY_V1;
  const scaleMlPerSec = 1_000;
  const consecutive = policy.consecutiveBeats;
  const period1BoundaryClosureSatisfied =
    boundaryFlowsMlPerSec.length >= consecutive + 1
    && Array.from({ length: consecutive }, (_, offset) => {
      const index = boundaryFlowsMlPerSec.length - 1 - offset;
      return Math.abs(
        boundaryFlowsMlPerSec[index]!
          - boundaryFlowsMlPerSec[index - 1]!,
      ) / scaleMlPerSec;
    }).every((delta) => delta <= policy.period1NormalizedTolerance);
  const period2BoundaryClosureSatisfied =
    boundaryFlowsMlPerSec.length >= consecutive + 2
    && Array.from({ length: consecutive }, (_, offset) => {
      const index = boundaryFlowsMlPerSec.length - 1 - offset;
      return Math.abs(
        boundaryFlowsMlPerSec[index]!
          - boundaryFlowsMlPerSec[index - 2]!,
      ) / scaleMlPerSec;
    }).every((delta) => delta <= policy.period2NormalizedTolerance);
  return Object.freeze({
    period1BoundaryClosureSatisfied,
    period2BoundaryClosureSatisfied,
  });
}

function resolveTerminationReason(
  failure: MainWireNormalAdultFiveWallPeriodicResultV1["failure"],
  classification: MainWireFiveWallPeriodicClassificationV1,
  externalClosure: MainWireAorticValveLocalFlowClosureV1,
): MainWireNormalAdultFiveWallPeriodicTerminationReasonV1 {
  if (failure !== null) return "step-failure";
  if (
    classification.status === "period1-converged"
    && externalClosure.period1BoundaryClosureSatisfied
  ) {
    return "period1-converged";
  }
  if (
    classification.status === "period2-suspect"
    && externalClosure.period2BoundaryClosureSatisfied
  ) return "period2-suspect";
  return "maximum-beats-reached";
}

function validateAndResolveOptions(
  options: MainWireNormalAdultFiveWallPeriodicOptionsV1,
  cycleLengthSec: number,
): Readonly<{
  dtSec: number;
  cycleLengthSec: number;
  stepsPerBeat: number;
  maximumBeatCount: number;
  laSlsMode: MainWireNormalAdultLaSlsModeV1;
  pericardiumMode: MainWireCommonPericardiumModeV1;
  pericardiumCase: MainWireNormalAdultCommonPericardiumCaseV1;
  valveDiseaseBracketIds: readonly MainWireFourValveDiseaseBracketIdV1[];
  initialization: MainWireNormalAdultFiveWallPeriodicInitializationV1;
  warmStart: MainWireNormalAdultFiveWallCycleWarmStartV1 | null;
}> {
  if (!(options.dtSec > 0) || !Number.isFinite(options.dtSec)) {
    throw new Error("dtSec must be positive and finite");
  }
  if (!(cycleLengthSec > 0) || !Number.isFinite(cycleLengthSec)) {
    throw new Error("calcium cycleLengthSec must be positive and finite");
  }
  const steps = cycleLengthSec / options.dtSec;
  const stepsPerBeat = Math.round(steps);
  const exactDivisionError = Math.abs(
    stepsPerBeat * options.dtSec - cycleLengthSec,
  );
  const divisionTolerance = 1e-12 * Math.max(1, cycleLengthSec);
  if (
    !Number.isInteger(stepsPerBeat) ||
    stepsPerBeat <= 0 ||
    Math.abs(steps - stepsPerBeat) > 1e-12 * Math.max(1, steps) ||
    exactDivisionError > divisionTolerance
  ) {
    throw new Error(
      "dtSec must divide the calcium cycleLengthSec into an exact integer step count",
    );
  }
  const maximumBeatCount = options.maximumBeatCount
    ?? MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_POLICY_V1
      .defaultMaximumBeatCount;
  if (!Number.isInteger(maximumBeatCount) || maximumBeatCount <= 0) {
    throw new Error("maximumBeatCount must be a positive integer");
  }
  const laSlsMode = options.laSlsMode ?? "on";
  if (laSlsMode !== "on" && laSlsMode !== "exact-off") {
    throw new Error("unsupported LA SLS mode");
  }
  const pericardiumMode = options.pericardiumMode ?? "on";
  if (pericardiumMode !== "on" && pericardiumMode !== "exact-off") {
    throw new Error("unsupported common-pericardium mode");
  }
  const pericardiumCase = options.pericardiumCase ?? "healthy-slack";
  if (
    pericardiumCase !== "healthy-slack"
    && pericardiumCase !== "effusion-300ml-positive-control"
    && pericardiumCase
      !== "global-capacity-vh0-430ml-positive-control"
  ) throw new Error("unsupported common-pericardium case");
  const warmStart = options.warmStart ?? null;
  const requestedInitialization = options.initialization ?? "canonical";
  if (warmStart !== null && requestedInitialization !== "canonical"
    && requestedInitialization !== "cycle-boundary-warm-start") {
    throw new Error("warm start cannot be combined with another initialization variant");
  }
  if (warmStart === null
    && requestedInitialization === "cycle-boundary-warm-start") {
    throw new Error("cycle-boundary-warm-start requires a warmStart payload");
  }
  if (
    requestedInitialization !== "canonical"
    && requestedInitialization !== "cycle-boundary-warm-start"
    && requestedInitialization
      !== MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PULMONARY_REDISTRIBUTION_V1.variant
  ) throw new Error("unsupported periodic initialization variant");
  const initialization = warmStart === null
    ? requestedInitialization
    : "cycle-boundary-warm-start" as const;
  return Object.freeze({
    dtSec: options.dtSec,
    cycleLengthSec,
    stepsPerBeat,
    maximumBeatCount,
    laSlsMode,
    pericardiumMode,
    pericardiumCase,
    valveDiseaseBracketIds: Object.freeze([
      ...(options.valveDiseaseBracketIds ?? []),
    ]),
    initialization,
    warmStart,
  });
}

function sumNodeVolumes(
  volumes: Readonly<Record<(typeof NON_CORONARY_NODE_NAMES_V1)[number], number>>,
): number {
  return NON_CORONARY_NODE_NAMES_V1.reduce(
    (sum, node) => sum + volumes[node],
    0,
  );
}

function positiveModulo(value: number, modulus: number): number {
  const result = value % modulus;
  return result < 0 ? result + modulus : result;
}
