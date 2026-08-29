import { describe, expect, it } from "vitest";

import {
  compareMainWireAorticOutflowDistortionTransientFactorialV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowDistortionTransientFactorialV1";
import {
  measureMainWireAorticOutflowSourceTwitchRetentionLoadEnvelopeV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowSourceTwitchRetentionLoadEnvelopeV1";
import {
  measureMainWireAorticOutflowPhysiologyCandidateCombinedLoadEnvelopeV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowPhysiologyCandidateCombinedLoadEnvelopeV1";
import {
  measureMainWireAorticProximalCharacteristicImpedanceDecompositionV1,
} from "@/analysis/methods/mainWire/MainWireAorticProximalCharacteristicImpedanceDecompositionV1";
import {
  compareMainWireAorticOutflowLengthMechanismFactorialV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowLengthMechanismFactorialV1";
import {
  measureMainWireAorticOutflowMechanismCandidateLoadEnvelopeV1,
  measureMainWireAorticOutflowMechanismStressPeaksV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowMechanismCandidateLoadEnvelopeV1";
import {
  compareMainWireAorticOutflowDriverRootAblationV1,
  type MainWireAorticOutflowDriverRootArmInputV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowDriverRootComparisonV1";
import {
  compareMainWireAorticOutflowLengthDependenceRootResistanceFactorialV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowLengthDependenceRootResistanceFactorialV1";
import {
  MAIN_WIRE_AORTIC_OUTFLOW_LENGTH_DEPENDENCE_POINT_IDS_V1,
  compareMainWireAorticOutflowLengthDependenceEnvelopeV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowLengthDependenceEnvelopeV1";
import {
  compareMainWireAorticOutflowLengthVelocityFactorialV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowLengthVelocityFactorialV1";
import {
  compareMainWireAorticOutflowVelocityStiffnessFactorialV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowVelocityStiffnessFactorialV1";
import {
  MAIN_WIRE_AORTIC_OUTFLOW_ARTERIAL_STIFFNESS_POINT_IDS_V1,
  measureMainWireAorticOutflowArterialStiffnessAblationV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowArterialStiffnessAblationV1";
import {
  compareMainWireAorticOutflowCompliancePartitionV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowCompliancePartitionComparisonV1";
import {
  MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_COMPLIANCE_CALCIUM_PROFILE_ID_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_COMPLIANCE_PARTITION_PROFILE_ID_V1,
  compareMainWireAorticOutflowCalciumComplianceFactorialV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowCalciumComplianceFactorialV1";
import {
  replayMainWireAorticValveLocalInertanceV1,
} from "@/analysis/methods/mainWire/MainWireAorticValveLocalInertanceReplayV1";
import {
  MAIN_WIRE_AORTIC_ROOT_INERTANCE_RESEARCH_CLAIM_V1,
  resolveMainWireAorticRootInertanceResearchProfileV1,
  validateMainWireAorticRootInertanceResearchProfileV1,
} from "@/engine/core/MainWireAorticRootInertanceResearchProfileV1";
import {
  deriveLand2017DerivedParameters,
} from "@/engine/myocardium/myofilament/land2017/parameterSets";
import {
  MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V1_CLAIM,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowPhysiologyCandidateV1";
import {
  MAIN_WIRE_AORTIC_OUTFLOW_CANDIDATE_CIRCULATORY_RECALIBRATION_CLAIM_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_CANDIDATE_CIRCULATORY_RECALIBRATION_CONTEXT_IDS_V1,
  resolveMainWireAorticOutflowCandidateCirculatoryRecalibrationContextV1,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowCandidateCirculatoryRecalibrationV1";
import {
  MAIN_WIRE_AORTIC_OUTFLOW_SOURCE_TWITCH_RETENTION_LOAD_CONTEXT_IDS_V1,
  resolveMainWireAorticOutflowSourceTwitchRetentionLoadContextV1,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowSourceTwitchRetentionLoadEnvelopeV1";
import {
  MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_COMBINED_LOAD_CONTEXTS_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_COMBINED_LOAD_ENVELOPE_CLAIM_V1,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowPhysiologyCandidateCombinedLoadEnvelopeV1";
import {
  MAIN_WIRE_VENTRICULAR_LAND_SOURCE_TWITCH_RETENTION_CANDIDATES_CLAIM_V1,
  MAIN_WIRE_VENTRICULAR_LAND_TREF_FORCE_LOAD_CLAIM_V1,
  resolveMainWireVentricularLandSourceTwitchRetentionCandidateV1,
  resolveMainWireVentricularLandSourceTwitchRetentionTrefForceLoadWallMaterialV1,
  resolveMainWireVentricularLandSourceTwitchRetentionWallMaterialV1,
} from "@/engine/myocardium/mechanics/MainWireVentricularLandSourceTwitchRetentionCandidatesV1";
import {
  MAIN_WIRE_VENTRICULAR_LAND_SOURCE_VELOCITY_DISTORTION_CLAIM_V1,
  MAIN_WIRE_VENTRICULAR_LAND_SOURCE_VELOCITY_DISTORTION_PROFILE_IDS_V1,
  resolveMainWireVentricularLandSourceVelocityDistortionProfileV1,
  resolveMainWireVentricularLandSourceVelocityDistortionWallMaterialV1,
} from "@/engine/myocardium/mechanics/MainWireVentricularLandSourceVelocityDistortionBracketV1";
import {
  resolveMainWireVentricularLandSarcomereReferenceWallMaterialV1,
} from "@/engine/myocardium/mechanics/MainWireVentricularLandSarcomereReferenceBracketV1";
import {
  MAIN_WIRE_AORTIC_CHARACTERISTIC_RESISTANCE_PLACEMENT_CLAIM_V1,
  resolveMainWireAorticCharacteristicResistancePlacementProfileV1,
  resolveMainWireAorticCharacteristicResistanceValveParamsV1,
  validateMainWireAorticCharacteristicResistancePlacementProfileV1,
} from "@/engine/valves/MainWireAorticCharacteristicResistancePlacementV1";
import {
  MAIN_WIRE_AORTIC_COMPLIANCE_PARTITION_RESEARCH_PROFILE_IDS_V1,
} from "@/engine/core/MainWireAorticCompliancePartitionResearchProfileV1";
import {
  MAIN_WIRE_AORTIC_VALVE_LOCAL_INERTANCE_PROFILE_V1,
  stepMainWireAorticValveLocalInertanceScalarsV1,
  validateMainWireAorticValveLocalInertanceProfileV1,
} from "@/engine/valves/MainWireAorticValveLocalInertanceAblationV1";
import {
  MAIN_WIRE_FOUR_VALVE_NORMAL_RESEARCH_INPUT_V1,
} from "@/engine/valves/MainWireFourValveDiseaseResearchBracketsV1";
import {
  MAIN_WIRE_AORTIC_OUTFLOW_DISTORTION_TRANSIENT_ARM_IDS_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_DISTORTION_TRANSIENT_CLAIM_V1,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowDistortionTransientAblationV1";
import {
  MAIN_WIRE_AORTIC_OUTFLOW_LENGTH_MECHANISM_ARM_IDS_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_LENGTH_MECHANISM_CLAIM_V1,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowLengthMechanismAblationV1";
import {
  MAIN_WIRE_AORTIC_OUTFLOW_MECHANISM_CANDIDATE_IDS_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_MECHANISM_CANDIDATE_LOAD_CLAIM_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_MECHANISM_LOAD_CONTEXT_IDS_V1,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowMechanismCandidateLoadEnvelopeV1";
import {
  MAIN_WIRE_AORTIC_OUTFLOW_DRIVER_ROOT_ABLATION_ARM_IDS_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_DRIVER_ROOT_ABLATION_CLAIM_V1,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowDriverRootAblationV1";
import {
  MAIN_WIRE_AORTIC_OUTFLOW_LENGTH_DEPENDENCE_ROOT_RESISTANCE_ARM_IDS_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_LENGTH_DEPENDENCE_ROOT_RESISTANCE_CLAIM_V1,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowLengthDependenceRootResistanceAblationV1";
import {
  MAIN_WIRE_AORTIC_OUTFLOW_LENGTH_VELOCITY_ARM_IDS_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_LENGTH_VELOCITY_CLAIM_V1,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowLengthVelocityAblationV1";
import {
  MAIN_WIRE_AORTIC_OUTFLOW_VELOCITY_STIFFNESS_ARM_IDS_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_VELOCITY_STIFFNESS_CLAIM_V1,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowVelocityStiffnessAblationV1";
import {
  runMainWireNormalAdultFiveWallAorticValveLocalInertanceResearchV1,
  runMainWireNormalAdultFiveWallAorticCompliancePartitionResearchV1,
  runMainWireNormalAdultFiveWallAorticOutflowResearchArmV1,
  runMainWireNormalAdultFiveWallAorticOutflowDistortionTransientResearchArmV1,
  runMainWireNormalAdultFiveWallAorticOutflowLengthMechanismResearchArmV1,
  runMainWireNormalAdultFiveWallAorticOutflowMechanismCandidateLoadResearchV1,
  runMainWireNormalAdultFiveWallAorticOutflowLengthDependenceRootResistanceResearchArmV1,
  runMainWireNormalAdultFiveWallAorticOutflowLengthVelocityResearchArmV1,
  runMainWireNormalAdultFiveWallAorticOutflowLandCoppiniSourceTraceWindkesselResearchV1,
  runMainWireNormalAdultFiveWallAorticOutflowVelocityStiffnessResearchArmV1,
  runMainWireNormalAdultFiveWallCirculatoryLoadResearchPointV1,
  runMainWireNormalAdultFiveWallPeriodicSteadyV1,
  runMainWireNormalAdultFiveWallVentricularLengthDependenceResearchV1,
  runMainWireNormalAdultFiveWallVentricularCalciumDelayedMixtureCompliancePartitionResearchV1,
  runMainWireNormalAdultFiveWallVentricularCalciumDelayedMixtureResearchV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";

describe("main-wire aortic outflow driver/root ablation V1", () => {
  it("seals the graph-owned Ao_SA inertance scale as a fixed profile", () => {
    const profile = resolveMainWireAorticRootInertanceResearchProfileV1(
      "aortic-root-inertance-high",
    );
    expect(profile).toEqual({
      profileId: "aortic-root-inertance-high",
      dynamicEdgeId: "Ao_SA",
      inertanceScaleFromTopology: 4 / 3,
      parameterSearchOrFitting: false,
    });
    expect(validateMainWireAorticRootInertanceResearchProfileV1(profile))
      .toEqual([]);
    expect(validateMainWireAorticRootInertanceResearchProfileV1({
      ...profile,
      inertanceScaleFromTopology: 2,
    })).toContain(
      "aortic-root inertance research profile inertanceScaleFromTopology differs from its fixed value",
    );
    expect(MAIN_WIRE_AORTIC_ROOT_INERTANCE_RESEARCH_CLAIM_V1)
      .toMatchObject({
        dynamicFlowStateOwnerChanged: false,
        acceptedStateOrCheckpointTopologyChanged: false,
        valveLocalFlowStateAdded: false,
        valveLocalInertanceAdded: false,
      });
  });

  it("matches the moved Ao_SA resistance to the source characteristic impedance", () => {
    const profile =
      resolveMainWireAorticCharacteristicResistancePlacementProfileV1(
        "Land2017-characteristic-impedance-matched",
      );
    const sourceAoV = MAIN_WIRE_FOUR_VALVE_NORMAL_RESEARCH_INPUT_V1.valves.AoV;
    const resolvedAoV =
      resolveMainWireAorticCharacteristicResistanceValveParamsV1(
        sourceAoV,
        profile,
      );
    expect(profile.derivation)
      .toBe("Land2017-source-characteristic-impedance");
    expect(profile.upstreamValveLinearResistanceAdditionMmHgSecPerMl)
      .toBeCloseTo(0.035, 14);
    expect(profile.sourceCharacteristicImpedanceMmHgSecPerMl)
      .toBe(0.035);
    expect(
      profile.upstreamValveLinearResistanceAdditionMmHgSecPerMl
      + profile.sourceTopologyResistanceMmHgSecPerMl
        * profile.downstreamDynamicEdgeResistanceScaleFromTopology,
    ).toBeCloseTo(profile.sourceTopologyResistanceMmHgSecPerMl, 14);
    expect(resolvedAoV.backgroundLinearResistanceMmHgSecPerMl)
      .toBeCloseTo(
        sourceAoV.backgroundLinearResistanceMmHgSecPerMl + 0.035,
        14,
      );
    expect(validateMainWireAorticCharacteristicResistancePlacementProfileV1(
      profile,
    )).toEqual([]);
    expect(validateMainWireAorticCharacteristicResistancePlacementProfileV1({
      ...profile,
      fractionMovedUpstreamOfAorticRootCompliance01: 1,
    })).toContain(
      "aortic characteristic-resistance placement fractionMovedUpstreamOfAorticRootCompliance01 differs from its fixed value",
    );
    expect(MAIN_WIRE_AORTIC_CHARACTERISTIC_RESISTANCE_PLACEMENT_CLAIM_V1)
      .toMatchObject({
        sourceTopologyLinearResistanceSumPreservedExactly: true,
        preExistingValveLinearResistanceExcludedFromArterialImpedanceMatch:
          true,
        newStateAdded: false,
        parameterSearchOrFitting: false,
      });

    const allProximal =
      resolveMainWireAorticCharacteristicResistancePlacementProfileV1(
        "all-Ao-SA-resistance-upstream-of-root-compliance",
      );
    expect(allProximal).toMatchObject({
      derivation:
        "source-topology-proximal-characteristic-impedance-reinterpretation",
      fractionMovedUpstreamOfAorticRootCompliance01: 1,
      downstreamDynamicEdgeResistanceScaleFromTopology: 0,
      sourceCharacteristicImpedanceMmHgSecPerMl:
        allProximal.sourceTopologyResistanceMmHgSecPerMl,
      sourceDoi: "10.1152/ajpheart.01207.2005",
      healthyHumanAscendingAorticCharacteristicImpedanceContext: {
        meanMmHgSecPerMl: 0.065,
        standardDeviationMmHgSecPerMl: 0.019,
      },
      hemodynamicOutcomeUsedToDeriveProfile: false,
    });
    expect(validateMainWireAorticCharacteristicResistancePlacementProfileV1(
      allProximal,
    )).toEqual([]);
  });

  it("seals the ET-completion candidate as a bounded effective-rate calibration", () => {
    const exact = MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V1;
    const selected =
      resolveMainWireVentricularLandSourceTwitchRetentionCandidateV1(
        exact.twitchRetentionCandidateId,
      );
    const sourceMapped =
      resolveMainWireVentricularLandSarcomereReferenceWallMaterialV1(
        exact.sarcomereReferenceProfileId,
        exact.kuwProfileId,
      );
    const selectedMaterial =
      resolveMainWireVentricularLandSourceTwitchRetentionWallMaterialV1(
        exact.twitchRetentionCandidateId,
        exact.sarcomereReferenceProfileId,
        exact.kuwProfileId,
    );
    expect(selected).toMatchObject({
      changedKineticParameters: ["kws", "nTm"],
      kineticParameterScaleFromSourceByParameter: { kws: 0.65, nTm: 0.8 },
      selectionStage: "bounded-ET-completion-after-load-envelope",
      loadedOrHemodynamicOutcomeUsedToDeriveCandidate: true,
    });
    expect(selected.sourceOnlyIsometricScreen).toMatchObject({
      fivePercentRiseToPeakMs: 166.7736920961073,
      relaxationTime50Ms: 143.00830665601825,
      relaxationTime95Ms: 361.3418949968062,
      localPeakCountAboveFivePercent: 1,
    });
    expect(selectedMaterial.landEquationParameters.values.kws)
      .toBeCloseTo(
        sourceMapped.landEquationParameters.values.kws * 0.65,
        14,
      );
    expect(selectedMaterial.landEquationParameters.values.nTm)
      .toBeCloseTo(
        sourceMapped.landEquationParameters.values.nTm * 0.8,
        14,
      );
    expect(selectedMaterial.landEquationParameters.values.Tref)
      .toBeCloseTo(
        sourceMapped.landEquationParameters.values.Tref
          * selected.ventricularTrefScaleFromSource,
        10,
      );
    expect({
      ...selectedMaterial.landEquationParameters.values,
      kws: 0,
      nTm: 0,
      Tref: 0,
    }).toEqual({
      ...sourceMapped.landEquationParameters.values,
      kws: 0,
      nTm: 0,
      Tref: 0,
    });
    expect(selectedMaterial.landEquationParameters.derived).toEqual(
      deriveLand2017DerivedParameters(
        selectedMaterial.landEquationParameters.values,
      ),
    );
    const sourceLand = sourceMapped.landEquationParameters;
    const selectedLand = selectedMaterial.landEquationParameters;
    const sourceWeakAggregateExitRate =
      sourceLand.derived.kwu + sourceLand.values.kws;
    const selectedWeakAggregateExitRate =
      selectedLand.derived.kwu + selectedLand.values.kws;
    expect(selectedWeakAggregateExitRate).toBeCloseTo(
      sourceWeakAggregateExitRate,
      14,
    );
    expect(selectedLand.values.kuw / selectedWeakAggregateExitRate)
      .toBeCloseTo(
        sourceLand.values.kuw / sourceWeakAggregateExitRate,
        14,
      );
    expect(selectedLand.values.kws / selectedLand.derived.ksu)
      .toBeCloseTo(
        sourceLand.values.kws / sourceLand.derived.ksu,
        14,
      );
    expect(selectedLand.derived.ksu / sourceLand.derived.ksu)
      .toBeCloseTo(0.65, 14);
    expect(selectedLand.derived.cs / sourceLand.derived.cs)
      .toBeCloseTo(0.65, 14);
    expect(selectedLand.derived.cw).toBeCloseTo(sourceLand.derived.cw, 14);
    expect(selectedLand.values.rw).toBe(sourceLand.values.rw);
    expect(selectedLand.values.rs).toBe(sourceLand.values.rs);
    const rwAlternative =
      resolveMainWireVentricularLandSourceTwitchRetentionWallMaterialV1(
        "source-twitch-retention-rw-three-quarters-peak-compensated",
        exact.sarcomereReferenceProfileId,
        exact.kuwProfileId,
      ).landEquationParameters;
    expect(rwAlternative.values.kuw
      / (rwAlternative.derived.kwu + rwAlternative.values.kws))
      .not.toBeCloseTo(
        sourceLand.values.kuw / sourceWeakAggregateExitRate,
        12,
      );
    expect(rwAlternative.values.kws / rwAlternative.derived.ksu)
      .not.toBeCloseTo(
        sourceLand.values.kws / sourceLand.derived.ksu,
        12,
      );
    const highForce =
      resolveMainWireVentricularLandSourceTwitchRetentionTrefForceLoadWallMaterialV1(
        exact.twitchRetentionCandidateId,
        "tref-force-load-high",
        exact.sarcomereReferenceProfileId,
        exact.kuwProfileId,
      );
    expect(highForce.landEquationParameters.values.Tref)
      .toBeCloseTo(
        selectedMaterial.landEquationParameters.values.Tref * 1.1,
        10,
      );
    expect({ ...highForce.landEquationParameters.values, Tref: 0 })
      .toEqual({ ...selectedMaterial.landEquationParameters.values, Tref: 0 });
    expect(MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V1_CLAIM)
      .toMatchObject({
        sourceLandIdentityClaimed: false,
        numericOptimizerApplied: false,
        ejectionTimingUsedToSelectBoundedCandidate: true,
        zeroDistortionEquilibriumPopulationRatiosPreservedByKwsScale: true,
        weakStateAggregateZeroDistortionExitRatePreservedByDerivedKwu: true,
        effectiveThinFilamentCooperativityScaleFromIntactSource: 0.8,
        thinFilamentCooperativityChangesActivationShapeWithoutAddingState:
          true,
        effectiveSystemicArterialTangentStiffnessScaleFromCanonical: 2,
        systemicArterialTopologyDesignPressurePreservedAtGlobalLawReferenceVolume:
          true,
        arterialStiffnessCoordinateExistedInPriorLoadEnvelope: true,
        fullSourceAoSaResistanceReinterpretedAsProximalCharacteristicImpedance:
          true,
        proximalCharacteristicImpedanceSeparatedFromValveLossInAnalysis:
          true,
        aorticValveAreaOrOpeningLawChanged: false,
        calciumOrMechanicsStateAdded: false,
      });
    expect(MAIN_WIRE_VENTRICULAR_LAND_SOURCE_TWITCH_RETENTION_CANDIDATES_CLAIM_V1)
      .toMatchObject({
        ETCompletionCandidateScalesInformedByPriorLoadEnvelope: true,
        kwsScalingWithDerivedRateRecomputationPreservesRwRsEquilibriumCoordinates:
          true,
        kwsScalingPreservesZeroDistortionWeakAggregateExitRate: true,
        numericOptimizerApplied: false,
      });
    expect(MAIN_WIRE_VENTRICULAR_LAND_TREF_FORCE_LOAD_CLAIM_V1)
      .toMatchObject({
        completePhysiologicalInotropyModelClaimed: false,
        stateCountChanged: false,
      });
  });

  it("defines a one-factor-at-a-time load envelope around one exact candidate", () => {
    expect(MAIN_WIRE_AORTIC_OUTFLOW_SOURCE_TWITCH_RETENTION_LOAD_CONTEXT_IDS_V1)
      .toHaveLength(11);
    for (const contextId of
      MAIN_WIRE_AORTIC_OUTFLOW_SOURCE_TWITCH_RETENTION_LOAD_CONTEXT_IDS_V1) {
      const context =
        resolveMainWireAorticOutflowSourceTwitchRetentionLoadContextV1(
          contextId,
        );
      const changedOwnerCount = [
        context.circulatoryLoadPointId !== "baseline",
        context.complianceProfileId
          !== MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V1
            .complianceProfileId,
        context.stressedVenousVolumePointId !== "baseline",
        context.trefForceLoadProfileId !== "tref-force-load-baseline",
      ].filter(Boolean).length;
      expect(changedOwnerCount).toBe(contextId === "baseline" ? 0 : 1);
      expect(Object.isFrozen(context)).toBe(true);
    }
    expect(MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V1)
      .toMatchObject({
        aorticMaximumForwardEoaCm2: 3.5,
        complianceProfileId: "arterial-stiffness-twofold",
        characteristicResistancePlacementProfileId:
          "all-Ao-SA-resistance-upstream-of-root-compliance",
        rootInertanceProfileId: "aortic-root-inertance-two-fifths",
      });
  });

  it("defines the fixed PVR-by-stressed-volume side-effect factorial", () => {
    expect(
      MAIN_WIRE_AORTIC_OUTFLOW_CANDIDATE_CIRCULATORY_RECALIBRATION_CONTEXT_IDS_V1,
    ).toHaveLength(9);
    const coordinatePairs = new Set<string>();
    for (const contextId of
      MAIN_WIRE_AORTIC_OUTFLOW_CANDIDATE_CIRCULATORY_RECALIBRATION_CONTEXT_IDS_V1) {
      const context =
        resolveMainWireAorticOutflowCandidateCirculatoryRecalibrationContextV1(
          contextId,
        );
      coordinatePairs.add(
        `${context.pulmonaryResistanceLevel}/${context.stressedVenousVolumeLevel}`,
      );
      expect(context.pulmonaryResistanceScaleFromBaseline)
        .toBe(context.pulmonaryResistanceLevel === "low"
          ? 0.75
          : context.pulmonaryResistanceLevel === "high" ? 4 / 3 : 1);
      expect(context.canonicalAdditionalStressedVenousVolumeScale)
        .toBe(context.stressedVenousVolumeLevel === "low"
          ? 0.75
          : context.stressedVenousVolumeLevel === "high" ? 4 / 3 : 1);
      expect(Object.isFrozen(context)).toBe(true);
    }
    expect(coordinatePairs.size).toBe(9);
    expect(
      MAIN_WIRE_AORTIC_OUTFLOW_CANDIDATE_CIRCULATORY_RECALIBRATION_CLAIM_V1,
    ).toMatchObject({
      systemicResistanceHeldAtBaseline: true,
      aorticEtMechanismHeldFixed: true,
      fixedGridNotNumericOptimization: true,
      calibrationTargetApplied: false,
    });
  });

  it("seals the source-referenced Aeff bracket as one derived-identity axis", () => {
    const profileScales =
      MAIN_WIRE_VENTRICULAR_LAND_SOURCE_VELOCITY_DISTORTION_PROFILE_IDS_V1
        .map((profileId) =>
          resolveMainWireVentricularLandSourceVelocityDistortionProfileV1(
            profileId,
          ).aeffScaleFromIntactHumanSource);
    expect(profileScales).toEqual([1, 1.25, 4 / 3, 1.5, 5 / 3, 2]);

    const canonical =
      resolveMainWireVentricularLandSourceVelocityDistortionWallMaterialV1(
        "source-Aeff-canonical",
        "source-twitch-retention-canonical",
        "tref-force-load-baseline",
        "land-sarcomere-reference-plus-5-percent",
        "land-whole-organ-kuw-nu4",
      );
    const threeHalves =
      resolveMainWireVentricularLandSourceVelocityDistortionWallMaterialV1(
        "source-Aeff-three-halves",
        "source-twitch-retention-canonical",
        "tref-force-load-baseline",
        "land-sarcomere-reference-plus-5-percent",
        "land-whole-organ-kuw-nu4",
      );
    expect(threeHalves.landEquationParameters.values.Aeff)
      .toBeCloseTo(canonical.landEquationParameters.values.Aeff * 1.5, 14);
    expect({ ...threeHalves.landEquationParameters.values, Aeff: 0 })
      .toEqual({ ...canonical.landEquationParameters.values, Aeff: 0 });
    expect(threeHalves.landEquationParameters.derived).toEqual(
      deriveLand2017DerivedParameters(
        threeHalves.landEquationParameters.values,
      ),
    );
    expect(threeHalves.landEquationParameters.parameterSetStableHash)
      .not.toBe(canonical.landEquationParameters.parameterSetStableHash);
    expect(MAIN_WIRE_VENTRICULAR_LAND_SOURCE_VELOCITY_DISTORTION_CLAIM_V1)
      .toMatchObject({
        sourceAeff: 25,
        noncanonicalProfilesAreEffectiveWholeOrganCouplingHypotheses: true,
        fixedLengthIsometricTrajectoryUnchangedByAeff: true,
        passiveOrSlsChanged: false,
        landStateCountChanged: false,
        loadedOrHemodynamicOutcomeUsedToSetProfiles: false,
      });
  });

  it("binds every load-envelope arm to the exact candidate identity", () => {
    const candidate = MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V1;
    const inputs =
      MAIN_WIRE_AORTIC_OUTFLOW_SOURCE_TWITCH_RETENTION_LOAD_CONTEXT_IDS_V1.map(
        (contextId) => {
          const context =
            resolveMainWireAorticOutflowSourceTwitchRetentionLoadContextV1(
              contextId,
            );
          const run =
            runMainWireNormalAdultFiveWallAorticOutflowLandCoppiniSourceTraceWindkesselResearchV1(
              { dtSec: 0.02, maximumBeatCount: 1 },
              candidate.kuwProfileId,
              context.complianceProfileId,
              candidate.characteristicResistancePlacementProfileId,
              candidate.rootInertanceProfileId,
              candidate.sarcomereReferenceProfileId,
              candidate.calciumSensitivityLengthProfileId,
              candidate.twitchRetentionCandidateId,
              context.circulatoryLoadPointId,
              context.stressedVenousVolumePointId,
              context.trefForceLoadProfileId,
            );
          return Object.freeze({ contextId, run });
        },
      );
    const envelope =
      measureMainWireAorticOutflowSourceTwitchRetentionLoadEnvelopeV1(inputs);
    expect(envelope.arms).toHaveLength(11);
    expect(envelope.allProtocolIdentitiesDistinct).toBe(true);
    expect(envelope.arms.every((arm) =>
      arm.cycle.integrationCompletedWithoutFailure)).toBe(true);
    for (const arm of envelope.arms) {
      expect(arm.cycle.aorticDynamicAreaDopplerPenaltyFactor)
        .toBeGreaterThanOrEqual(1);
      expect(arm.cycle.aorticJetVelocityWaveformNonuniformityFactor)
        .toBeGreaterThanOrEqual(1);
      expect(
        arm.cycle.aorticFullyOpenUniformFlowDopplerGradientLowerBoundMmHg
          * arm.cycle.aorticDynamicAreaDopplerPenaltyFactor
          * arm.cycle.aorticJetVelocityWaveformNonuniformityFactor,
      ).toBeCloseTo(arm.cycle.meanDopplerGradientMmHg, 10);
    }
    expect(envelope.ranges.ejectionTimeSec.maximum)
      .toBeGreaterThanOrEqual(envelope.ranges.ejectionTimeSec.minimum);
    expect(envelope.ranges.meanDopplerGradientMmHg.minimum).toBeGreaterThan(0);
    expect(envelope.claim.parameterOptimizationOrFitApplied).toBe(false);
    expect(allNumbersFinite(envelope)).toBe(true);
    const baselineRun = inputs.find((input) =>
      input.contextId === "baseline")!.run;
    const proximalDecomposition =
      measureMainWireAorticProximalCharacteristicImpedanceDecompositionV1(
        baselineRun.periodicResult,
        baselineRun.placementProfile!,
      );
    expect(proximalDecomposition.proximalCharacteristicResistanceMmHgSecPerMl)
      .toBeCloseTo(0.0465088, 14);
    expect(
      proximalDecomposition.meanValveOnlyPressureGradientMmHg
      + proximalDecomposition.meanProximalCharacteristicPressureMmHg,
    ).toBeCloseTo(
      proximalDecomposition.meanReservoirNodeGradientMmHg,
      12,
    );
    expect(proximalDecomposition.meanValveOnlyPressureGradientMmHg)
      .toBeLessThan(proximalDecomposition.meanReservoirNodeGradientMmHg);
    expect(
      proximalDecomposition.maximumAbsoluteValveOnlyReconstructionResidualMmHg,
    ).toBeLessThan(1e-9);
    expect(() =>
      measureMainWireAorticOutflowSourceTwitchRetentionLoadEnvelopeV1(
        inputs.slice(1),
      )).toThrow("missing source-twitch load context: baseline");
  }, 60_000);

  it("decomposes all 16 simultaneous load corners without changing the fixed candidate", () => {
    const candidate = MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V1;
    expect(
      MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_COMBINED_LOAD_CONTEXTS_V1,
    ).toHaveLength(16);
    expect(new Set(
      MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_COMBINED_LOAD_CONTEXTS_V1
        .map((context) => context.contextId),
    ).size).toBe(16);
    const inputs =
      MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_COMBINED_LOAD_CONTEXTS_V1
        .map((context) => Object.freeze({
          contextId: context.contextId,
          run:
            runMainWireNormalAdultFiveWallAorticOutflowLandCoppiniSourceTraceWindkesselResearchV1(
              { dtSec: 0.02, maximumBeatCount: 1 },
              candidate.kuwProfileId,
              context.complianceProfileId,
              candidate.characteristicResistancePlacementProfileId,
              candidate.rootInertanceProfileId,
              candidate.sarcomereReferenceProfileId,
              candidate.calciumSensitivityLengthProfileId,
              candidate.twitchRetentionCandidateId,
              context.circulatoryLoadPointId,
              context.stressedVenousVolumePointId,
              context.trefForceLoadProfileId,
              candidate.sourceVelocityDistortionProfileId,
            ),
        }));
    const envelope =
      measureMainWireAorticOutflowPhysiologyCandidateCombinedLoadEnvelopeV1(
        inputs,
      );

    expect(envelope.arms).toHaveLength(16);
    expect(envelope.factorialTerms).toHaveLength(15);
    expect(envelope.factorialTerms.filter((term) => term.order === 1))
      .toHaveLength(4);
    expect(envelope.allProtocolIdentitiesDistinct).toBe(true);
    expect(envelope.arms.every((arm) =>
      arm.cycle.integrationCompletedWithoutFailure)).toBe(true);
    expect(Math.max(...Object.values(
      envelope.maximumAbsoluteFactorialReconstructionResidual,
    ))).toBeLessThan(1e-12);
    const systemicResistanceMainEffect = envelope.factorialTerms.find(
      (term) => term.termId === "systemic-resistance",
    )!;
    const highValues = envelope.arms
      .filter((arm) =>
        arm.context.levels["systemic-resistance"] === "high")
      .map((arm) => arm.coreMetrics.ejectionTimeSec);
    const lowValues = envelope.arms
      .filter((arm) =>
        arm.context.levels["systemic-resistance"] === "low")
      .map((arm) => arm.coreMetrics.ejectionTimeSec);
    const highMean = highValues.reduce((sum, value) => sum + value, 0)
      / highValues.length;
    const lowMean = lowValues.reduce((sum, value) => sum + value, 0)
      / lowValues.length;
    expect(
      systemicResistanceMainEffect.metrics.ejectionTimeSec.orthogonalEffect,
    ).toBeCloseTo(highMean - lowMean, 14);
    expect(
      MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_COMBINED_LOAD_ENVELOPE_CLAIM_V1,
    ).toMatchObject({
      fullFactorialCornerCount: 16,
      valveAreaOrOpeningLawChanged: false,
      parameterSearchOrFitting: false,
    });
    expect(() =>
      measureMainWireAorticOutflowPhysiologyCandidateCombinedLoadEnvelopeV1(
        inputs.slice(1),
      )).toThrow("missing combined-load context");
  }, 60_000);

  it("uses an energy-consistent unilateral BE law for the isolated AoV local L", () => {
    const profile = MAIN_WIRE_AORTIC_VALVE_LOCAL_INERTANCE_PROFILE_V1;
    const params = MAIN_WIRE_FOUR_VALVE_NORMAL_RESEARCH_INPUT_V1.valves.AoV;
    expect(validateMainWireAorticValveLocalInertanceProfileV1(profile))
      .toEqual([]);
    const evaluate = (upstreamPressureMmHg: number) =>
      stepMainWireAorticValveLocalInertanceScalarsV1(
        0.8,
        500,
        0.001,
        upstreamPressureMmHg,
        90,
        params,
        0.00025,
        profile,
      );
    const center = evaluate(110);
    expect(center.flowMlPerSec).toBeGreaterThan(0);
    expect(center.tangentBranch).toBe("forward-inertial-open-orifice");
    expect(Math.abs(center.openOrificeResidualMmHg)).toBeLessThan(1e-10);
    expect(Math.abs(center.powerBalanceResidualMmHgMlPerSec))
      .toBeLessThan(1e-8);
    const epsilon = 1e-5;
    const finiteDifference = (
      evaluate(110 + epsilon).flowMlPerSec
      - evaluate(110 - epsilon).flowMlPerSec
    ) / (2 * epsilon);
    expect(center.dFlowDPressureGradientMlPerSecPerMmHg)
      .toBeCloseTo(finiteDifference, 5);

    const adverse = stepMainWireAorticValveLocalInertanceScalarsV1(
      0.8,
      500,
      0.001,
      85,
      90,
      params,
      0.00025,
      profile,
    );
    expect(adverse.flowMlPerSec).toBeGreaterThan(0);
    expect(adverse.activeDirection).toBe("forward");
    expect(adverse.inertialPressureMmHg).toBeLessThan(0);
  });

  it("runs the fixed 2x2 arms with exact identities and no state-topology change", () => {
    const canonical = runMainWireNormalAdultFiveWallPeriodicSteadyV1({
      dtSec: 0.02,
      maximumBeatCount: 1,
      laSlsMode: "on",
      pericardiumMode: "on",
      pericardiumCase: "healthy-slack",
      initialization: "canonical",
      valveDiseaseBracketIds: Object.freeze([]),
    });
    const runs = MAIN_WIRE_AORTIC_OUTFLOW_DRIVER_ROOT_ABLATION_ARM_IDS_V1.map(
      (armId) => runMainWireNormalAdultFiveWallAorticOutflowResearchArmV1(
        { dtSec: 0.02, maximumBeatCount: 1 },
        armId,
      ),
    );
    const byId = new Map(runs.map((run) => [run.arm.armId, run]));
    const baseline = byId.get("canonical")!;
    const lowDriver = byId.get("ventricular-tref-low")!;
    const highRoot = byId.get("aortic-root-inertance-high")!;
    const combined = byId.get(
      "ventricular-tref-low-plus-aortic-root-inertance-high",
    )!;

    expect(baseline.periodicResult.protocolIdentityHash)
      .toBe(canonical.protocolIdentityHash);
    expect(baseline.periodicResult.retainedCompleteBeats)
      .toEqual(canonical.retainedCompleteBeats);
    expect(lowDriver.periodicResult.protocolComponentHashes
      .mechanicsProviderMetadataStableHash).not.toBe(
        baseline.periodicResult.protocolComponentHashes
          .mechanicsProviderMetadataStableHash,
      );
    expect(highRoot.periodicResult.protocolComponentHashes
      .mechanicsProviderMetadataStableHash).toBe(
        baseline.periodicResult.protocolComponentHashes
          .mechanicsProviderMetadataStableHash,
      );
    expect(highRoot.periodicResult.protocolComponentHashes
      .circulationRuntimeStableHash).not.toBe(
        baseline.periodicResult.protocolComponentHashes
          .circulationRuntimeStableHash,
      );
    expect(combined.periodicResult.protocolComponentHashes
      .circulationRuntimeStableHash).toBe(
        highRoot.periodicResult.protocolComponentHashes
          .circulationRuntimeStableHash,
      );
    expect(combined.periodicResult.protocolComponentHashes
      .mechanicsProviderMetadataStableHash).toBe(
        lowDriver.periodicResult.protocolComponentHashes
          .mechanicsProviderMetadataStableHash,
      );
    for (const run of runs) {
      expect(run.periodicResult.integrationCompletedWithoutFailure).toBe(true);
      expect(run.claim.aorticValveConstitutiveLawChanged).toBe(false);
      expect(run.claim.acceptedStateOrCheckpointTopologyChanged).toBe(false);
      expect(Object.keys(run.periodicResult.terminalCycleBoundaryWarmStart!
        .checkpoint.circulation.state.dynamicEdgeFlowsMlPerSec))
        .toEqual(["Ao_SA", "PA_PArt"]);
    }
    expect(MAIN_WIRE_AORTIC_OUTFLOW_DRIVER_ROOT_ABLATION_CLAIM_V1)
      .toMatchObject({
        oneSidedFactorial: true,
        mainEffectsAndInteractionEstimable: true,
        aorticValveConstitutiveLawChanged: false,
      });
  }, 60_000);

  it("couples the historical local L with runner-owned atomic q promotion", () => {
    const run =
      runMainWireNormalAdultFiveWallAorticValveLocalInertanceResearchV1({
        dtSec: 0.02,
        maximumBeatCount: 2,
      });
    expect(run.periodicResult.integrationCompletedWithoutFailure).toBe(true);
    expect(run.periodicResult.terminalCycleBoundaryWarmStart).toBeNull();
    expect(run.externalFlowStateAudit.standardWarmStartEmitted).toBe(false);
    expect(run.externalFlowStateAudit
      .externalFlowPromotedOnlyAfterSuccessfulCoupledStep).toBe(true);
    expect(run.externalFlowStateAudit.cycleBoundaryAcceptedFlowsMlPerSec)
      .toHaveLength(3);
    expect(run.externalFlowStateAudit.cycleBoundaryAcceptedFlowsMlPerSec
      .every((flow) => flow === 0)).toBe(true);
    expect(run.externalFlowStateAudit.period1BoundaryClosureSatisfied)
      .toBe(false);
    const beat = run.periodicResult.retainedCompleteBeats.at(-1)!;
    expect(beat.samples.some((sample) =>
      sample.circulationEdgeFlowMlPerSec.AoV > 0)).toBe(true);
    expect(beat.samples.every((sample) =>
      Number.isFinite(
        sample.valveHydraulics.AoV.powerBalanceResidualMmHgMlPerSec,
      ))).toBe(true);
    expect(Object.keys(run.periodicResult.terminalCycleBoundaryWarmStart ?? {}))
      .toEqual([]);
  }, 60_000);

  it("separates driver and root main effects with exact root balance diagnostics", () => {
    const inputs: MainWireAorticOutflowDriverRootArmInputV1[] =
      MAIN_WIRE_AORTIC_OUTFLOW_DRIVER_ROOT_ABLATION_ARM_IDS_V1.map(
        (armId) => {
          const run = runMainWireNormalAdultFiveWallAorticOutflowResearchArmV1(
            { dtSec: 0.02, maximumBeatCount: 2 },
            armId,
          );
          return { armId, periodicResult: run.periodicResult };
        },
      );
    const comparison =
      compareMainWireAorticOutflowDriverRootAblationV1(inputs);
    expect(comparison.arms).toHaveLength(4);
    expect(comparison.factorialContrasts).toHaveLength(14);
    expect(comparison.claim.nodeAndDopplerGradientsAreNotInterchangeable)
      .toBe(true);
    const canonical = comparison.arms[0]!;
    const lowDriver = comparison.arms[1]!;
    const highRoot = comparison.arms[2]!;
    const combined = comparison.arms[3]!;
    expect(canonical.ventricularLandTrefScaleFromBaseline).toBe(1);
    expect(lowDriver.ventricularLandTrefScaleFromBaseline).toBe(0.75);
    expect(highRoot.aorticRootInertanceScaleFromTopology).toBeCloseTo(4 / 3);
    expect(combined.aorticRootEffectiveInertanceMmHgSec2PerMl)
      .toBeCloseTo(
        canonical.aorticRootTopologyInertanceMmHgSec2PerMl * 4 / 3,
        14,
      );
    for (const arm of comparison.arms) {
      expect(arm.aorticMaximumFlowMlPerSec).toBeGreaterThan(0);
      expect(arm.aorticFlowPeakCountAboveFivePercent).toBeGreaterThanOrEqual(1);
      expect(arm.aorticFlowAcEnergyFraction10To50Hz).toBeGreaterThanOrEqual(0);
      expect(arm.aorticFlowAcEnergyFraction10To50Hz).toBeLessThanOrEqual(1);
      expect(arm.maximumAbsoluteAorticRootPressureBalanceResidualMmHg)
        .toBeLessThan(1e-8);
      expect(allNumbersFinite(arm)).toBe(true);
    }
    expect(comparison.factorialContrasts.every(allNumbersFinite)).toBe(true);
    const replay = replayMainWireAorticValveLocalInertanceV1(
      inputs[0]!.periodicResult,
    );
    expect(replay.profiles).toHaveLength(2);
    expect(replay.profiles[0]!
      .maximumAbsoluteFlowDifferenceFromExactSourceMlPerSec).toBeLessThan(1e-8);
    expect(replay.profiles[1]!.localInertanceMmHgSec2PerMl)
      .toBe(replay.source
        .topologyHistoricalAorticValveInertanceMmHgSec2PerMl);
    expect(replay.profiles.every(allNumbersFinite)).toBe(true);
    expect(replay.claim.exactModelStateOrCheckpointChanged).toBe(false);
    expect(replay.claim.coupledModelAcceptanceEstablished).toBe(false);
    expect(() => compareMainWireAorticOutflowDriverRootAblationV1(
      inputs.slice(0, 3),
    )).toThrow("missing aortic-outflow ablation arm");
  }, 60_000);

  it("separates loaded Land length dependence from graph-owned root resistance", () => {
    const runs =
      MAIN_WIRE_AORTIC_OUTFLOW_LENGTH_DEPENDENCE_ROOT_RESISTANCE_ARM_IDS_V1.map(
        (armId) =>
          runMainWireNormalAdultFiveWallAorticOutflowLengthDependenceRootResistanceResearchArmV1(
            { dtSec: 0.02, maximumBeatCount: 1 },
            armId,
          ),
      );
    const comparison =
      compareMainWireAorticOutflowLengthDependenceRootResistanceFactorialV1(
        runs.map((run) => ({
          armId: run.arm.armId,
          periodicResult: run.periodicResult,
        })),
      );
    expect(comparison.arms).toHaveLength(4);
    expect(comparison.factorialContrasts).toHaveLength(14);
    expect(comparison.referenceLengthIsometricInvariance).toEqual({
      maximumAbsoluteActiveTwitchMetricDifference: 0,
      exactAtFloatingPoint: true,
    });
    expect(comparison.arms.map((arm) =>
      arm.lengthDependenceScaleFromBaseline)).toEqual([1, 0.75, 1, 0.75]);
    expect(comparison.arms.map((arm) =>
      arm.rootResistanceScaleFromTopology)).toEqual([1, 1, 4 / 3, 4 / 3]);
    expect(new Set(comparison.arms.map((arm) =>
      arm.protocolIdentityHash)).size).toBe(4);
    for (const arm of comparison.arms) {
      expect(arm.cycle.integrationCompletedWithoutFailure).toBe(true);
      expect(arm.rootResistanceBalance
        .maximumAbsolutePressureBalanceResidualMmHg).toBeLessThan(1e-8);
      expect(arm.loadedWallTimingByWall.LVFW.minimumLandStretch)
        .toBeLessThan(arm.loadedWallTimingByWall.LVFW.maximumLandStretch);
      expect(allNumbersFinite(arm)).toBe(true);
    }
    expect(comparison.factorialContrasts.every(allNumbersFinite)).toBe(true);
    expect(MAIN_WIRE_AORTIC_OUTFLOW_LENGTH_DEPENDENCE_ROOT_RESISTANCE_CLAIM_V1)
      .toMatchObject({
        calciumDriveChanged: false,
        ventricularTrefChanged: false,
        passiveOrSlsChanged: false,
        acceptedStateOrCheckpointTopologyChanged: false,
      });
    expect(() =>
      compareMainWireAorticOutflowLengthDependenceRootResistanceFactorialV1(
        runs.slice(0, 3).map((run) => ({
          armId: run.arm.armId,
          periodicResult: run.periodicResult,
        })),
      )).toThrow("missing length-dependence/root-resistance arm");
  }, 60_000);

  it("uses exact-off only as a diagnostic boundary for Land length dependence", () => {
    const runs = MAIN_WIRE_AORTIC_OUTFLOW_LENGTH_DEPENDENCE_POINT_IDS_V1.map(
      (pointId) => Object.freeze({
        pointId,
        run: runMainWireNormalAdultFiveWallVentricularLengthDependenceResearchV1(
          { dtSec: 0.01, maximumBeatCount: 1 },
          pointId,
        ),
      }),
    );
    const envelope = compareMainWireAorticOutflowLengthDependenceEnvelopeV1(
      runs.map(({ pointId, run }) => ({
        pointId,
        periodicResult: run.periodicResult,
      })),
    );
    expect(envelope.arms.map((arm) => arm.materialPoint
      .ventricularLandLengthDependenceScaleFromBaseline)).toEqual([
        1,
        0.75,
        0.5,
        0.25,
        0,
      ]);
    expect(envelope.referenceLengthIsometricInvariance)
      .toEqual({
        maximumAbsoluteActiveTwitchMetricDifference: 0,
        exactAtFloatingPointAcrossEnvelope: true,
      });
    expect(Object.values(envelope.stableNonzeroBranchDirectionality)
      .every((value) => typeof value === "boolean")).toBe(true);
    expect(envelope.arms.every((arm) =>
      arm.cycle.integrationCompletedWithoutFailure)).toBe(true);
    expect(envelope.claim.exactOffRole)
      .toBe("mechanism-removal-boundary-not-physiological-candidate");
    expect(allNumbersFinite(envelope)).toBe(true);
    expect(() => compareMainWireAorticOutflowLengthDependenceEnvelopeV1(
      runs.slice(0, 2).map(({ pointId, run }) => ({
        pointId,
        periodicResult: run.periodicResult,
      })),
    )).toThrow("missing length-dependence point");
  }, 60_000);

  it("separates existing Land length and velocity dependence without new state", () => {
    const runs = MAIN_WIRE_AORTIC_OUTFLOW_LENGTH_VELOCITY_ARM_IDS_V1.map(
      (armId) => runMainWireNormalAdultFiveWallAorticOutflowLengthVelocityResearchArmV1(
        { dtSec: 0.02, maximumBeatCount: 1 },
        armId,
      ),
    );
    const factorial = compareMainWireAorticOutflowLengthVelocityFactorialV1(
      runs.map((run) => ({
        armId: run.arm.armId,
        periodicResult: run.periodicResult,
      })),
    );
    expect(factorial.arms).toHaveLength(4);
    expect(factorial.factorialContrasts).toHaveLength(14);
    expect(factorial.arms.map((arm) => arm.materialPoint
      .ventricularLandLengthDependenceScaleFromBaseline))
      .toEqual([1, 0.75, 1, 0.75]);
    expect(factorial.arms.map((arm) => arm.materialPoint
      .ventricularLandVelocityDistortionScaleFromBaseline))
      .toEqual([1, 1, 4 / 3, 4 / 3]);
    expect(factorial.referenceLengthIsometricInvariance).toEqual({
      maximumAbsoluteActiveTwitchMetricDifference: 0,
      exactAtFloatingPointAcrossFactorial: true,
    });
    expect(factorial.arms.every((arm) =>
      arm.cycle.integrationCompletedWithoutFailure)).toBe(true);
    for (const arm of factorial.arms) {
      expect(arm.loadedShortening.walls.LVFW.replayConsistency
        .maximumRelativeRecordedVsFullReplayStressResidual).toBeLessThan(0.05);
      expect(allNumbersFinite(arm)).toBe(true);
    }
    expect(MAIN_WIRE_AORTIC_OUTFLOW_LENGTH_VELOCITY_CLAIM_V1)
      .toMatchObject({
        existingLandStateCountChanged: false,
        calciumDriveChanged: false,
        circulationRuntimeChanged: false,
        acceptedStateOrCheckpointTopologyChanged: false,
      });
    expect(() => compareMainWireAorticOutflowLengthVelocityFactorialV1(
      runs.slice(0, 3).map((run) => ({
        armId: run.arm.armId,
        periodicResult: run.periodicResult,
      })),
    )).toThrow("missing length/velocity arm");
  }, 60_000);

  it("tests velocity distortion against the fixed high arterial-stiffness load", () => {
    const runs = MAIN_WIRE_AORTIC_OUTFLOW_VELOCITY_STIFFNESS_ARM_IDS_V1.map(
      (armId) => runMainWireNormalAdultFiveWallAorticOutflowVelocityStiffnessResearchArmV1(
        { dtSec: 0.02, maximumBeatCount: 1 },
        armId,
      ),
    );
    const factorial = compareMainWireAorticOutflowVelocityStiffnessFactorialV1(
      runs.map((run) => ({
        armId: run.arm.armId,
        periodicResult: run.periodicResult,
      })),
    );
    expect(factorial.arms).toHaveLength(4);
    expect(factorial.factorialContrasts).toHaveLength(15);
    expect(factorial.arms.map((arm) => arm.materialPoint
      .ventricularLandVelocityDistortionScaleFromBaseline))
      .toEqual([1, 4 / 3, 1, 4 / 3]);
    expect(factorial.arms.map((arm) => arm.circulatoryLoadPoint
      .arterialStiffnessScaleFromBaseline))
      .toEqual([1, 1, 4 / 3, 4 / 3]);
    expect(factorial.referenceLengthIsometricInvariance).toEqual({
      maximumAbsoluteActiveTwitchMetricDifference: 0,
      exactAtFloatingPointAcrossFactorial: true,
    });
    expect(factorial.arms.every((arm) =>
      arm.cycle.integrationCompletedWithoutFailure)).toBe(true);
    expect(new Set(factorial.arms.map((arm) =>
      arm.protocolIdentityHash)).size).toBe(4);
    for (const arm of factorial.arms) {
      expect(arm.loadedShortening.walls.LVFW.replayConsistency
        .maximumRelativeRecordedVsFullReplayStressResidual).toBeLessThan(0.1);
      expect(allNumbersFinite(arm)).toBe(true);
    }
    expect(MAIN_WIRE_AORTIC_OUTFLOW_VELOCITY_STIFFNESS_CLAIM_V1)
      .toMatchObject({
        existingLandStateCountChanged: false,
        outcomeInformedFactorCombination: true,
        numericParameterSearchOrFitting: false,
        acceptedStateOrCheckpointTopologyChanged: false,
      });
    expect(() => compareMainWireAorticOutflowVelocityStiffnessFactorialV1(
      runs.slice(0, 3).map((run) => ({
        armId: run.arm.armId,
        periodicResult: run.periodicResult,
      })),
    )).toThrow("missing velocity/stiffness arm");
  }, 60_000);

  it("separates Land distortion amplitude from recovery and seals the proportional envelope", () => {
    const runs = MAIN_WIRE_AORTIC_OUTFLOW_DISTORTION_TRANSIENT_ARM_IDS_V1.map(
      (armId) =>
        runMainWireNormalAdultFiveWallAorticOutflowDistortionTransientResearchArmV1(
          { dtSec: 0.01, maximumBeatCount: 1 },
          armId,
        ),
    );
    const factorial =
      compareMainWireAorticOutflowDistortionTransientFactorialV1(
        runs.map((run) => ({
          armId: run.arm.armId,
          periodicResult: run.periodicResult,
        })),
      );
    expect(factorial.arms).toHaveLength(6);
    expect(factorial.factorialContrasts).toHaveLength(15);
    expect(factorial.arms.map((arm) => arm.materialPoint
      .ventricularLandVelocityDistortionScaleFromBaseline))
      .toEqual([1, 4 / 3, 1, 4 / 3, 2, 4]);
    expect(factorial.arms.map((arm) => arm.materialPoint
      .ventricularLandDistortionRecoveryScaleFromBaseline))
      .toEqual([1, 1, 4 / 3, 4 / 3, 2, 4]);
    expect(factorial.referenceLengthIsometricInvariance).toEqual({
      maximumAbsoluteActiveTwitchMetricDifference: 0,
      exactAtFloatingPointAcrossFactorial: true,
    });
    expect(factorial.combinedConstantRateSteadyGainPreservation)
      .toMatchObject({
        preservedWithinFloatingPointTolerance: true,
        weakRecoveryTimeConstantScaleFromCanonical: 0.75,
        strongRecoveryTimeConstantScaleFromCanonical: 0.75,
      });
    expect(factorial.proportionalTransientEnvelope.points.map((point) =>
      point.commonAeffAndPhiScaleFromCanonical)).toEqual([1, 4 / 3, 2, 4]);
    expect(factorial.proportionalDistortionProtocolAudit)
      .toMatchObject({
        quickEndRampStressFractionStrictlyDecreasesWithFasterTransient: true,
      });
    expect(factorial.proportionalDistortionProtocolAudit
      .maximumAbsoluteConstantVelocityEndRampStressFractionDifference)
      .toBeLessThan(0.001);
    expect(factorial.proportionalDistortionProtocolAudit
      .maximumAbsoluteQuickRecoveryEndHoldStressFractionDifference)
      .toBeLessThan(0.005);
    expect(factorial.arms.every((arm) =>
      arm.cycle.integrationCompletedWithoutFailure)).toBe(true);
    expect(new Set(factorial.arms.map((arm) =>
      arm.protocolIdentityHash)).size).toBe(6);
    expect(MAIN_WIRE_AORTIC_OUTFLOW_DISTORTION_TRANSIENT_CLAIM_V1)
      .toMatchObject({
        combinedZetaSteadyGainPreservedAtFixedStrainRate: true,
        quickStretchResponsePreserved: false,
        existingLandStateCountChanged: false,
        acceptedStateOrCheckpointTopologyChanged: false,
      });
    expect(allNumbersFinite(factorial)).toBe(true);
    expect(() => compareMainWireAorticOutflowDistortionTransientFactorialV1(
      runs.slice(0, 5).map((run) => ({
        armId: run.arm.armId,
        periodicResult: run.periodicResult,
      })),
    )).toThrow("missing distortion-transient arm");
  }, 60_000);

  it("separates Land peak-tension and calcium-sensitivity length effects", () => {
    const runs = MAIN_WIRE_AORTIC_OUTFLOW_LENGTH_MECHANISM_ARM_IDS_V1.map(
      (armId) =>
        runMainWireNormalAdultFiveWallAorticOutflowLengthMechanismResearchArmV1(
          { dtSec: 0.01, maximumBeatCount: 1 },
          armId,
        ),
    );
    const factorial = compareMainWireAorticOutflowLengthMechanismFactorialV1(
      runs.map((run) => ({
        armId: run.arm.armId,
        periodicResult: run.periodicResult,
      })),
    );
    expect(factorial.arms).toHaveLength(7);
    expect(factorial.factorialContrasts).toHaveLength(15);
    expect(factorial.arms.map((arm) => arm.materialPoint
      .ventricularLandPeakTensionLengthDependenceScaleFromBaseline))
      .toEqual([1, 0.75, 1, 0.75, 0.5, 1, 0.5]);
    expect(factorial.arms.map((arm) => arm.materialPoint
      .ventricularLandCalciumSensitivityLengthDependenceScaleFromBaseline))
      .toEqual([1, 1, 0.75, 0.75, 1, 0.5, 0.5]);
    expect(factorial.referenceLengthIsometricInvariance).toEqual({
      maximumAbsoluteActiveTwitchMetricDifference: 0,
      exactAtFloatingPointAcrossFactorial: true,
    });
    expect(new Set(factorial.arms.map((arm) =>
      arm.protocolIdentityHash)).size).toBe(7);
    expect(MAIN_WIRE_AORTIC_OUTFLOW_LENGTH_MECHANISM_CLAIM_V1)
      .toMatchObject({
        sourceLengthDependenceCalibrationPreserved: false,
        existingLandStateCountChanged: false,
        acceptedStateOrCheckpointTopologyChanged: false,
      });
    expect(allNumbersFinite(factorial)).toBe(true);
    expect(() => compareMainWireAorticOutflowLengthMechanismFactorialV1(
      runs.slice(1).map((run) => ({
        armId: run.arm.armId,
        periodicResult: run.periodicResult,
      })),
    )).toThrow("missing length-mechanism arm");
  }, 60_000);

  it("smoke-wires the paired load envelope without making a calibration decision", () => {
    const runs = MAIN_WIRE_AORTIC_OUTFLOW_MECHANISM_LOAD_CONTEXT_IDS_V1
      .flatMap((contextId) =>
        MAIN_WIRE_AORTIC_OUTFLOW_MECHANISM_CANDIDATE_IDS_V1.map(
          (candidateId) =>
            runMainWireNormalAdultFiveWallAorticOutflowMechanismCandidateLoadResearchV1(
              { dtSec: 0.02, maximumBeatCount: 1 },
              candidateId,
              contextId,
            ),
        ));
    const envelope =
      measureMainWireAorticOutflowMechanismCandidateLoadEnvelopeV1(
        runs.map((run) => ({
          candidateId: run.candidate.candidateId,
          contextId: run.context.contextId,
          periodicResult: run.periodicResult,
        })),
      );
    expect(envelope.arms).toHaveLength(15);
    expect(envelope.candidateSummaries).toHaveLength(2);
    expect(envelope.allProtocolIdentitiesDistinct).toBe(true);
    expect(envelope.allRunsPeriod1AndIntegrated).toBe(false);
    expect(envelope.arms.every((arm) =>
      !arm.cycle.periodicSteadyStateClaimed)).toBe(true);
    expect(envelope.nextCalibrationCandidateDecision
      .canonicalAdoptionEstablished).toBe(false);
    expect(envelope.arms.map((arm) => arm.context.contextId))
      .toEqual(MAIN_WIRE_AORTIC_OUTFLOW_MECHANISM_LOAD_CONTEXT_IDS_V1
        .flatMap((contextId) => [contextId, contextId, contextId]));
    expect(envelope.arms.map((arm) => arm.candidate.candidateId))
      .toEqual(MAIN_WIRE_AORTIC_OUTFLOW_MECHANISM_LOAD_CONTEXT_IDS_V1
        .flatMap(() => MAIN_WIRE_AORTIC_OUTFLOW_MECHANISM_CANDIDATE_IDS_V1));
    for (const run of runs) {
      expect(run.claim).toMatchObject({
        independentCanonicalColdStart: true,
        aorticValveConstitutiveLawChanged: false,
        acceptedStateOrCheckpointTopologyChanged: false,
        exactProtocolIdentityIncludesCandidateLoadAndBloodVolume: true,
      });
    }
    expect(MAIN_WIRE_AORTIC_OUTFLOW_MECHANISM_CANDIDATE_LOAD_CLAIM_V1)
      .toMatchObject({
        oneLoadAxisAtATime: true,
        canonicalComparatorAtEveryContext: true,
        numericParameterSearchOrFitting: false,
      });
    expect(allNumbersFinite(envelope)).toBe(true);
    expect(() =>
      measureMainWireAorticOutflowMechanismCandidateLoadEnvelopeV1(
        runs.slice(1).map((run) => ({
          candidateId: run.candidate.candidateId,
          contextId: run.context.contextId,
          periodicResult: run.periodicResult,
        })),
      )).toThrow("missing candidate-load arm");
  }, 60_000);

  it("does not classify a sub-resolution stress-plateau ripple as a distinct peak", () => {
    const plateauRipple =
      measureMainWireAorticOutflowMechanismStressPeaksV1(
        [0, 10, 9.999, 9.9995, 0],
        [0, 0.1, 0.2, 0.3, 0.4],
      );
    expect(plateauRipple).toHaveLength(2);
    expect(plateauRipple.map((peak) => peak.distinctAtFixedProminence))
      .toEqual([true, false]);
    const separatedPeaks =
      measureMainWireAorticOutflowMechanismStressPeaksV1(
        [0, 10, 5, 9, 0],
        [0, 0.1, 0.2, 0.3, 0.4],
      );
    expect(separatedPeaks.map((peak) => peak.distinctAtFixedProminence))
      .toEqual([true, true]);
  });

  it("brackets the exact global arterial PV stiffness without adding state", () => {
    const inputs =
      MAIN_WIRE_AORTIC_OUTFLOW_ARTERIAL_STIFFNESS_POINT_IDS_V1.map(
        (pointId) => ({
          pointId,
          periodicResult:
            runMainWireNormalAdultFiveWallCirculatoryLoadResearchPointV1(
              { dtSec: 0.02, maximumBeatCount: 1 },
              pointId,
            ),
        }),
      );
    const ablation =
      measureMainWireAorticOutflowArterialStiffnessAblationV1(inputs);
    expect(ablation.arms.map((arm) => arm.arterialStiffness))
      .toEqual([0.5625, 0.75, 1]);
    expect(ablation.arms.map((arm) => arm.point.axis))
      .toEqual(["arterial-stiffness", "baseline", "arterial-stiffness"]);
    expect(ablation.arms[0]!.summedArterialNodeTangentCompliance
      .arithmeticMeanMlPerMmHg).toBeGreaterThan(
        ablation.arms[1]!.summedArterialNodeTangentCompliance
          .arithmeticMeanMlPerMmHg,
      );
    expect(ablation.arms[1]!.summedArterialNodeTangentCompliance
      .arithmeticMeanMlPerMmHg).toBeGreaterThan(
        ablation.arms[2]!.summedArterialNodeTangentCompliance
          .arithmeticMeanMlPerMmHg,
      );
    expect(new Set(inputs.map((input) => input.periodicResult
      .protocolComponentHashes.circulationRuntimeStableHash)).size).toBe(3);
    expect(ablation.claim.proximalAorticComplianceIsolated).toBe(false);
    expect(ablation.claim
      .localAreaComplianceComparisonRequiresAnatomicalSupportLength).toBe(true);
    expect(allNumbersFinite(ablation)).toBe(true);
    expect(() => measureMainWireAorticOutflowArterialStiffnessAblationV1(
      inputs.slice(1),
    )).toThrow("missing arterial-stiffness point");
  }, 60_000);

  it("isolates root compliance placement while preserving Ao-plus-SA capacity", () => {
    const canonical = runMainWireNormalAdultFiveWallPeriodicSteadyV1({
      dtSec: 0.02,
      maximumBeatCount: 1,
      laSlsMode: "on",
      pericardiumMode: "on",
      pericardiumCase: "healthy-slack",
      initialization: "canonical",
      valveDiseaseBracketIds: Object.freeze([]),
    });
    const profileRuns =
      MAIN_WIRE_AORTIC_COMPLIANCE_PARTITION_RESEARCH_PROFILE_IDS_V1.map(
        (profileId) =>
          runMainWireNormalAdultFiveWallAorticCompliancePartitionResearchV1(
            { dtSec: 0.02, maximumBeatCount: 1 },
            profileId,
          ),
      );
    const comparison = compareMainWireAorticOutflowCompliancePartitionV1([
      { armId: "canonical", periodicResult: canonical },
      ...profileRuns.map((run) => ({
        armId: run.profile.profileId,
        periodicResult: run.periodicResult,
      })),
    ]);
    expect(comparison.arms.map((arm) =>
      arm.capacity.resolvedAorticRootVsMl))
      .toEqual([150, 50, 75, 112.5, 200]);
    expect(comparison.arms.map((arm) =>
      arm.capacity.resolvedAoSaTotalVsMl))
      .toEqual([550, 550, 550, 550, 550]);
    expect(comparison.arms.every((arm) =>
      arm.capacity.totalVsResidualMl === 0)).toBe(true);
    expect(new Set(comparison.arms.map((arm) =>
      arm.cycle.protocolIdentityHash)).size).toBe(5);
    expect(comparison.claim.globalArterialStiffnessChanged).toBe(false);
    expect(comparison.claim.acceptedStateOrCheckpointTopologyChanged)
      .toBe(false);
    expect(comparison.claim.anatomicalSupportLengthIdentified).toBe(false);
    expect(allNumbersFinite(comparison)).toBe(true);
    expect(() => compareMainWireAorticOutflowCompliancePartitionV1([
      { armId: "canonical", periodicResult: canonical },
      {
        armId: profileRuns[0]!.profile.profileId,
        periodicResult: profileRuns[0]!.periodicResult,
      },
    ])).toThrow("missing aortic compliance partition arm");
  }, 60_000);

  it("measures the fixed delayed-calcium by root-capacity factorial", () => {
    const options = { dtSec: 0.02, maximumBeatCount: 1 } as const;
    const canonical = runMainWireNormalAdultFiveWallPeriodicSteadyV1({
      ...options,
      laSlsMode: "on",
      pericardiumMode: "on",
      pericardiumCase: "healthy-slack",
      initialization: "canonical",
      valveDiseaseBracketIds: Object.freeze([]),
    });
    const calcium =
      runMainWireNormalAdultFiveWallVentricularCalciumDelayedMixtureResearchV1(
        options,
        MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_COMPLIANCE_CALCIUM_PROFILE_ID_V1,
      );
    const capacity =
      runMainWireNormalAdultFiveWallAorticCompliancePartitionResearchV1(
        options,
        MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_COMPLIANCE_PARTITION_PROFILE_ID_V1,
      );
    const combined =
      runMainWireNormalAdultFiveWallVentricularCalciumDelayedMixtureCompliancePartitionResearchV1(
        options,
        MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_COMPLIANCE_CALCIUM_PROFILE_ID_V1,
        MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_COMPLIANCE_PARTITION_PROFILE_ID_V1,
      );
    const inputs = [
      { armId: "canonical" as const, periodicResult: canonical },
      {
        armId: "delayed-calcium-only" as const,
        periodicResult: calcium.periodicResult,
      },
      {
        armId: "low-root-capacity-only" as const,
        periodicResult: capacity.periodicResult,
      },
      {
        armId: "delayed-calcium-plus-low-root-capacity" as const,
        periodicResult: combined.periodicResult,
      },
    ];
    const factorial =
      compareMainWireAorticOutflowCalciumComplianceFactorialV1(inputs);
    expect(factorial.arms).toHaveLength(4);
    expect(factorial.factorialContrasts).toHaveLength(13);
    expect(factorial.allRunsPeriod1AndIntegrated).toBe(false);
    expect(factorial.arms.every((arm) =>
      arm.cycle.integrationCompletedWithoutFailure)).toBe(true);
    expect(factorial.morphologyPreservedAcrossFactorial).toBe(true);
    expect(new Set(factorial.arms.map((arm) =>
      arm.cycle.protocolIdentityHash)).size).toBe(4);
    expect(factorial.arms[0]!.morphologySafeDirectionalCandidate).toBe(false);
    expect(factorial.arms[3]!.capacity.resolvedAoSaTotalVsMl).toBe(550);
    for (const arm of factorial.arms) {
      expect(arm.kinematicFloor.currentDuration
        .cauchySchwarzFloorSatisfied).toBe(true);
      expect(arm.kinematicFloor.currentDuration
        .timeVaryingAreaFloorSatisfied).toBe(true);
      expect(Math.abs(arm.kinematicFloor.currentDuration
        .multiplicativeReconstructionResidualMmHg)).toBeLessThan(1e-10);
      expect(arm.kinematicFloor.healthyLvetContext
        .modelForwardFlowDurationGapToLower95PiSec).toBeGreaterThan(0);
      expect(arm.kinematicFloor.healthyLvetContext.projections[0]!
        .meanAndPeakGradientFloorMmHg).toBeLessThan(
          arm.kinematicFloor.currentDuration.meanAndPeakGradientFloorMmHg,
        );
    }
    expect(factorial.claim.aorticValveConstitutiveLawChanged).toBe(false);
    expect(factorial.claim.acceptedStateOrCheckpointTopologyChanged)
      .toBe(false);
    expect(allNumbersFinite(factorial)).toBe(true);
    expect(() => compareMainWireAorticOutflowCalciumComplianceFactorialV1(
      inputs.slice(0, 3),
    )).toThrow("missing calcium-compliance arm");
  }, 60_000);

  it("rejects generic parameter patches on the research runner", () => {
    expect(() => runMainWireNormalAdultFiveWallAorticOutflowResearchArmV1(
      { dtSec: 0.02, maximumBeatCount: 1, rootL: 0.01 } as never,
      "canonical",
    )).toThrow("reject unsupported field: rootL");
  });
});

function allNumbersFinite(value: unknown): boolean {
  if (typeof value === "number") return Number.isFinite(value);
  if (Array.isArray(value)) return value.every(allNumbersFinite);
  if (value !== null && typeof value === "object") {
    return Object.values(value).every(allNumbersFinite);
  }
  return true;
}
