import {
  advanceCoronaryAcceptedAutoregulationV3,
  createCoronaryAcceptedAutoregulationStateV3,
  createCoronaryAutoregulationWindowBindingV3,
  maximumCoronaryAutoregulationStepDurationV3,
  type CoronaryAcceptedAutoregulationStateV3,
  type CoronaryAutoregulationWindowControlV3,
} from "@/engine/coronary/acceptedAutoregulationWindowV3";
import {
  NORMAL_ADULT_CORONARY_AUTOREGULATION_PRIOR_V2,
} from "@/engine/coronary/autoregulationV2";
import {
  DEFAULT_CORONARY_BACKWARD_EULER_SOLVER_OPTIONS_V2,
  DEFAULT_CORONARY_PRESSURE_LADDER_INITIALIZER_OPTIONS_V2,
  NORMAL_CORONARY_DISEASE_INPUT_V2,
  NORMAL_VASODILATORY_TONE_MINIMUM_SCALE_V2,
  buildCoronaryCollapseHydraulicsPriorV2,
  initializePressureLadderCoronaryStateV2,
  mapFocalDiameterStenosisV2,
  solveCoronaryBackwardEulerTrialV2,
  type CoronaryAcceptedHydraulicStateV2,
  type CoronaryCollapseHydraulicsPriorV2,
  type CoronaryDiseaseInputV2,
  type CoronaryHydraulicBoundaryInputV2,
} from "@/engine/coronary/backwardEulerCoronaryNetworkV2";
import {
  NORMAL_ADULT_CORONARY_TOPOLOGY_PRIOR_V2,
  buildCoronaryTopologyV2,
  coronaryConfigurationFingerprintV2,
  coronaryTopologyPriorFingerprintV2,
  type CoronaryTopologyPriorV2,
  type CoronaryTopologyV2,
} from "@/engine/coronary/topologyPriorV2";
import {
  CORONARY_LAYER_IDS_V2,
  CORONARY_TERRITORY_IDS_V2,
  type CoronaryTerritoryLayerRecordV2,
  type CoronaryToneStateV2,
} from "@/engine/coronary/typesV2";

export const CORONARY_V3_LESION_STRUCTURAL_CMD_DIRECTIONAL_V1_ID =
  "coronary-v3-reduced-network-lesion-structural-cmd-directional-v1" as const;

export const CORONARY_V3_LESION_STRUCTURAL_CMD_LEVEL_IDS_V1 = Object.freeze([
  "none",
  "protocol-moderate",
  "protocol-severe",
] as const);

export type CoronaryV3LesionStructuralCmdLevelIdV1 =
  (typeof CORONARY_V3_LESION_STRUCTURAL_CMD_LEVEL_IDS_V1)[number];

export type CoronaryV3LesionStructuralCmdAxisV1 =
  | "focal-epicardial-lesion"
  | "structural-microvascular-resistance"
  | "impaired-vasodilatory-tone-floor";

export type CoronaryV3LesionStructuralCmdConditionV1 =
  | "fixed-rest-tone"
  | "fixed-hyperemic-tone"
  | "active-hyperemic-floor-fixed-point";

export const CORONARY_V3_FOCAL_LESION_LEVELS_V1 = Object.freeze([
  Object.freeze({
    levelId: "none" as const,
    diameterStenosisFraction01: 0 as const,
  }),
  Object.freeze({
    levelId: "protocol-moderate" as const,
    diameterStenosisFraction01: 0.50 as const,
  }),
  Object.freeze({
    levelId: "protocol-severe" as const,
    diameterStenosisFraction01: 0.70 as const,
  }),
]);

export const CORONARY_V3_STRUCTURAL_CMD_LEVELS_V1 = Object.freeze([
  Object.freeze({
    levelId: "none" as const,
    structuralR1ResistanceScale: 1 as const,
    structuralRmResistanceScale: 1 as const,
  }),
  Object.freeze({
    levelId: "protocol-moderate" as const,
    structuralR1ResistanceScale: 1.5 as const,
    structuralRmResistanceScale: 1.5 as const,
  }),
  Object.freeze({
    levelId: "protocol-severe" as const,
    structuralR1ResistanceScale: 2 as const,
    structuralRmResistanceScale: 2 as const,
  }),
]);

export const CORONARY_V3_VASODILATORY_FLOOR_LEVELS_V1 = Object.freeze([
  Object.freeze({
    levelId: "none" as const,
    vasodilatoryToneMinimumResistanceScale:
      NORMAL_VASODILATORY_TONE_MINIMUM_SCALE_V2,
  }),
  Object.freeze({
    levelId: "protocol-moderate" as const,
    vasodilatoryToneMinimumResistanceScale:
      2 * NORMAL_VASODILATORY_TONE_MINIMUM_SCALE_V2,
  }),
  Object.freeze({
    levelId: "protocol-severe" as const,
    vasodilatoryToneMinimumResistanceScale:
      4 * NORMAL_VASODILATORY_TONE_MINIMUM_SCALE_V2,
  }),
]);

const FIXED_IMP_MM_HG_BY_TERRITORY_LAYER_V1 = mapLayerRecord(() => 10);

/**
 * All values are protocol perturbations declared before characterization
 * output. "Moderate" and "severe" are ordinal protocol labels, not patient
 * categories or clinical cut points.
 */
export const CORONARY_V3_LESION_STRUCTURAL_CMD_POLICY_V1 = Object.freeze({
  policyId:
    "coronary-v3-lesion-structural-cmd-preregistered-directional-policy-v1" as const,
  targetTerritoryId: "LAD" as const,
  oneFactorSweepsOnly: true as const,
  fullFactorialApplied: false as const,
  coarseDtSec: 0.002 as const,
  fineDtSec: 0.001 as const,
  acceptedWindowDurationSec: 1 as const,
  exactRawWindowCountPerCondition: 3 as const,
  fixedAbsoluteAorticPressureMmHg: 100 as const,
  fixedAbsoluteRightAtrialPressureMmHg: 5 as const,
  fixedPerivascularExternalPressureMmHg: 0 as const,
  fixedIntramyocardialPressureMmHgByTerritoryLayer:
    FIXED_IMP_MM_HG_BY_TERRITORY_LAYER_V1,
  fixedRestToneResistanceScale: 1 as const,
  fixedHyperemicToneResistanceScale:
    NORMAL_VASODILATORY_TONE_MINIMUM_SCALE_V2,
  maximumAbsoluteInitializerContinuityResidualMlPerSec: 1e-8 as const,
  maximumAbsoluteStepLedgerResidualMl: 1e-8 as const,
  maximumAbsoluteNodeContinuityResidualMl: 1e-8 as const,
  maximumCrossDtRelativeDifference: 0.02 as const,
  minimumRelativeDifferenceDenominator: 1e-9 as const,
  maximumDirectionalImprovementDistalPressureMmHg: 1e-6 as const,
  maximumDirectionalImprovementTerritoryFlowMlPerSec: 1e-8 as const,
  maximumDirectionalImprovementFlowReserveRatio: 1e-6 as const,
  policyDeclaredBeforeCoarseAndFineOutput: true as const,
  outputUsedToChooseProtocolOrTolerance: false as const,
  parameterFittingApplied: false as const,
  biologicalTolerance: false as const,
  patientThresholdsApplied: false as const,
});

export const CORONARY_V3_LESION_STRUCTURAL_CMD_MEASUREMENT_CONTRACT_V1 =
  Object.freeze({
    network: "reduced-coronary-v2-fixed-boundary-component" as const,
    targetTerritoryId: "LAD" as const,
    distalPressureStation:
      "massless-post-focal-lesion-pressure-before-LAD-large-arterial-storage" as const,
    territoryFlowStation:
      "signed-Ao-to-LAD-large-arterial-inlet-flow" as const,
    reserveSurrogate:
      "same-station-hyperemic-LAD-inlet-flow-divided-by-rest-LAD-inlet-flow" as const,
    venousBoundary:
      "fixed-right-atrial-boundary-through-common-reduced-coronary-vein" as const,
    restDefinition:
      "independent-static-boundary-equilibrium-at-fixed-R1-tone-scale-one" as const,
    fixedHyperemiaDefinition:
      "independent-static-boundary-equilibrium-at-fixed-normal-minimum-R1-tone" as const,
    activeHyperemiaDefinition:
      "hyperemia-drive-one-evaluated-at-the-disease-floor-fixed-point" as const,
    activeHyperemiaOnsetKineticsCharacterized: false as const,
    exactPressureWireStationRepresented: false as const,
    exactThermodilutionOrDopplerStationRepresented: false as const,
    FFRClinicalEquivalent: false as const,
    CFRClinicalEquivalent: false as const,
    MRRClinicalEquivalent: false as const,
  });

export const CORONARY_V3_LESION_STRUCTURAL_CMD_OWNER_CONTRACT_V1 =
  Object.freeze({
    focalEpicardialLesion: Object.freeze({
      diseaseParameterOwner:
        "CoronaryDiseaseInputV2.LAD.focalStenosisAdditionalLinearResistanceMmHgSecPerMl+focalStenosisAdditionalQuadraticResistanceMmHgSec2PerMl2" as const,
      hydraulicEdge: "Ao_LAD.Art" as const,
      sourceLaw: "Young-Tsai-style-steady-linear-plus-separation-loss-v1" as const,
    }),
    structuralMicrovascularResistance: Object.freeze({
      diseaseParameterOwner:
        "CoronaryDiseaseInputV2.LAD.layers.*.structuralR1ResistanceScale+structuralRmResistanceScale" as const,
      hydraulicEdges:
        "LAD-layer-R1-and-Rm-only" as const,
    }),
    impairedVasodilatoryToneFloor: Object.freeze({
      diseaseParameterOwner:
        "CoronaryDiseaseInputV2.LAD.layers.*.vasodilatoryToneMinimumResistanceScale" as const,
      application:
        "max(accepted-R1-tone,disease-tone-minimum)" as const,
      clinicalFunctionalCmdEquivalent: false as const,
    }),
    threeOwnersAreDistinct: true as const,
  });

export const CORONARY_V3_LESION_STRUCTURAL_CMD_LITERATURE_ANCHORS_V1 =
  Object.freeze([
    Object.freeze({
      anchorId: "young-tsai-steady-stenosis-1973" as const,
      doi: "10.1016/0021-9290(73)90099-7" as const,
      role: "focal-stenosis-linear-and-separation-loss-anchor" as const,
      magnitudeFitApplied: false as const,
    }),
    Object.freeze({
      anchorId: "young-tsai-unsteady-stenosis-1973" as const,
      doi: "10.1016/0021-9290(73)90012-2" as const,
      role: "scope-boundary-unsteady-term-not-in-v1" as const,
      magnitudeFitApplied: false as const,
    }),
    Object.freeze({
      anchorId: "bai-coronary-pressure-flow-autoregulation-1994" as const,
      doi: "10.1152/ajpheart.1994.266.6.H2359" as const,
      role: "pressure-flow-autoregulation-directional-context" as const,
      protocolReproduced: false as const,
    }),
    Object.freeze({
      anchorId: "pradhan-open-loop-feedback-coronary-control-2016" as const,
      doi: "10.1152/ajpheart.00663.2015" as const,
      role: "separate-feedforward-feedback-control-context" as const,
      modelTranscribed: false as const,
    }),
    Object.freeze({
      anchorId: "rahman-cmd-physiological-stratification-2020" as const,
      pmcid: "PMC7242900" as const,
      role:
        "nonclaim-functional-CMD-high-rest-flow-is-not-a-high-tone-floor" as const,
      clinicalEndotypeMappingEstablished: false as const,
    }),
  ]);

export const CORONARY_V3_LESION_STRUCTURAL_CMD_BLOCKED_GATES_V1 =
  Object.freeze([
    blockedGate(
      "exact-FFR-clinical-equivalence",
      "no pressure-wire protocol or validated clinical distal/reference pressure station",
    ),
    blockedGate(
      "exact-CFR-clinical-equivalence",
      "reduced LAD inlet-flow ratio is not a validated Doppler, thermodilution, PET, or CMR CFR measurement",
    ),
    blockedGate(
      "exact-MRR-clinical-equivalence",
      "the artifact has no validated absolute microvascular resistance measurement or correction terms",
    ),
    blockedGate(
      "patient-threshold-classification",
      "protocol ordinal levels were not calibrated to patient thresholds",
    ),
    blockedGate(
      "structural-CMD-clinical-endotype-mapping",
      "R1/Rm multiplier levels are model mechanisms without patient-level structural CMD validation",
    ),
    blockedGate(
      "functional-CMD-clinical-endotype-mapping",
      "an impaired vasodilatory tone floor is not Rahman functional CMD, which includes high resting flow with normal or low minimal resistance",
    ),
  ]);

export const CORONARY_V3_LESION_STRUCTURAL_CMD_CLAIM_V1 = Object.freeze({
  purpose:
    "fit-free-reduced-network-three-owner-one-factor-directional-characterization" as const,
  directionalChecksAreModelMechanismChecksOnly: true as const,
  focalLesionStructuralResistanceAndToneFloorSeparated: true as const,
  interpolationApplied: false as const,
  smoothingApplied: false as const,
  shapeFittingApplied: false as const,
  parameterFittingApplied: false as const,
  fullFactorialApplied: false as const,
  clinicalFunctionalCmdClaimed: false as const,
  clinicalStructuralCmdClaimed: false as const,
  FFRClinicalEquivalenceClaimed: false as const,
  CFRClinicalEquivalenceClaimed: false as const,
  MRRClinicalEquivalenceClaimed: false as const,
  patientThresholdsClaimed: false as const,
  biologicalValidationEstablished: false as const,
  physiologicalAcceptanceEstablished: false as const,
  independentValidationEstablished: false as const,
  clinicalValidationEstablished: false as const,
  releaseAcceptanceEstablished: false as const,
});

export type CoronaryV3LesionStructuralCmdRawWindowV1 = Readonly<{
  windowIndex: number;
  startTimeSec: number;
  endTimeSec: number;
  acceptedStepCount: number;
  minimumAcceptedStepDurationSec: number;
  maximumAcceptedStepDurationSec: number;
  meanDistalPressureMmHg: number;
  meanTerritoryInletFlowMlPerSec: number;
  meanTerritoryLargeArterialOutflowMlPerSec: number;
  meanFocalLesionPressureLossMmHg: number;
  meanTotalCoronaryInletFlowMlPerSec: number;
  meanCoronaryBloodVolumeMl: number;
  startCoronaryBloodVolumeMl: number;
  endCoronaryBloodVolumeMl: number;
  signedBoundaryInletVolumeMl: number;
  signedBoundaryOutletVolumeMl: number;
  exactWindowBloodVolumeLedgerResidualMl: number;
  sumOfStepLedgerResidualsMl: number;
  maximumAbsoluteStepLedgerResidualMl: number;
  maximumAbsoluteNodeContinuityResidualMl: number;
  startToneResistanceScaleByTargetLayer: Readonly<{
    subepicardial: number;
    subendocardial: number;
  }>;
  endToneResistanceScaleByTargetLayer: Readonly<{
    subepicardial: number;
    subendocardial: number;
  }>;
  activeHyperemiaControlApplied: boolean;
  activeHyperemiaBoundedAtByTargetLayer: Readonly<{
    subepicardial: "minimum" | "maximum" | "interior";
    subendocardial: "minimum" | "maximum" | "interior";
  }> | null;
  allFinite: true;
  conservationToleranceSatisfied: true;
}>;

export type CoronaryV3LesionStructuralCmdSampleV1 = Readonly<{
  sampleId: string;
  role: "coarse" | "fine";
  dtSec: 0.002 | 0.001;
  axis: CoronaryV3LesionStructuralCmdAxisV1;
  levelId: CoronaryV3LesionStructuralCmdLevelIdV1;
  condition: CoronaryV3LesionStructuralCmdConditionV1;
  diseaseInput: CoronaryDiseaseInputV2;
  initialToneResistanceScaleByTerritoryLayer: CoronaryToneStateV2;
  diseaseFingerprint: string;
  initialToneFingerprint: string;
  initializerMaximumAbsoluteContinuityResidualMlPerSec: number;
  rawAcceptedWindows: readonly CoronaryV3LesionStructuralCmdRawWindowV1[];
  summary: Readonly<{
    acceptedWindowCount: 3;
    observationDurationSec: 3;
    meanDistalPressureMmHg: number;
    meanTerritoryInletFlowMlPerSec: number;
    meanTerritoryLargeArterialOutflowMlPerSec: number;
    meanFocalLesionPressureLossMmHg: number;
    terminalEffectiveToneResistanceScaleByTargetLayer: Readonly<{
      subepicardial: number;
      subendocardial: number;
    }>;
  }>;
  allFinite: true;
  conservationToleranceSatisfied: true;
  biologicalValidationEstablished: false;
  physiologicalAcceptanceEstablished: false;
}>;

export type CoronaryV3LesionStructuralCmdAtDtV1 = Readonly<{
  role: "coarse" | "fine";
  dtSec: 0.002 | 0.001;
  modelBinding: Readonly<{
    topologyId: string;
    topologyPriorFingerprint: string;
    collapseHydraulicsFingerprint: string;
    solverOptionsFingerprint: string;
  }>;
  samples: readonly CoronaryV3LesionStructuralCmdSampleV1[];
  allFiniteAndConserved: boolean;
  biologicalValidationEstablished: false;
  physiologicalAcceptanceEstablished: false;
}>;

export type CoronaryV3LesionStructuralCmdRelativeCheckV1 = Readonly<{
  coarseValue: number;
  fineValue: number;
  relativeDifference: number | null;
  denominatorGatePassed: boolean;
  maximumAllowedRelativeDifference: 0.02;
  passed: boolean;
}>;

export type CoronaryV3LesionStructuralCmdCrossDtSampleV1 = Readonly<{
  sampleId: string;
  distalPressure: CoronaryV3LesionStructuralCmdRelativeCheckV1;
  territoryInletFlow: CoronaryV3LesionStructuralCmdRelativeCheckV1;
  territoryLargeArterialOutflow:
    CoronaryV3LesionStructuralCmdRelativeCheckV1;
  passed: boolean;
}>;

export type CoronaryV3LesionStructuralCmdDirectionalGateV1 = Readonly<{
  gateId: string;
  direction: "non-increasing-with-protocol-level";
  tolerance: number;
  coarseValues: readonly number[];
  fineValues: readonly number[];
  coarseAdjacentImprovements: readonly number[];
  fineAdjacentImprovements: readonly number[];
  coarsePassed: boolean;
  finePassed: boolean;
  passed: boolean;
}>;

export type CoronaryV3LesionStructuralCmdOwnerSeparationGateV1 = Readonly<{
  focalLesionOwnerPath: string;
  structuralR1RmOwnerPath: string;
  vasodilatoryFloorOwnerPath: string;
  pathsArePairwiseDistinct: boolean;
  everyOneFactorSampleKeepsOtherAxesAtReference: boolean;
  passed: boolean;
}>;

export type CoronaryV3LesionStructuralCmdComparisonV1 = Readonly<{
  crossDtBySampleId:
    Readonly<Record<string, CoronaryV3LesionStructuralCmdCrossDtSampleV1>>;
  structuralReserveCrossDtByLevel:
    Readonly<Record<string, CoronaryV3LesionStructuralCmdRelativeCheckV1>>;
  vasodilatoryFloorReserveCrossDtByLevel:
    Readonly<Record<string, CoronaryV3LesionStructuralCmdRelativeCheckV1>>;
  lesionDistalPressure:
    CoronaryV3LesionStructuralCmdDirectionalGateV1;
  lesionTerritoryFlow:
    CoronaryV3LesionStructuralCmdDirectionalGateV1;
  structuralFixedToneTerritoryFlow:
    CoronaryV3LesionStructuralCmdDirectionalGateV1;
  structuralFixedToneFlowReserve:
    CoronaryV3LesionStructuralCmdDirectionalGateV1;
  impairedVasodilatoryFloorActiveHyperemicFlowReserve:
    CoronaryV3LesionStructuralCmdDirectionalGateV1;
  ownerSeparation: CoronaryV3LesionStructuralCmdOwnerSeparationGateV1;
  crossDtNumericalQaPassed: boolean;
  modelMechanismDirectionalChecksPassed: boolean;
  characterizationChecksPassed: boolean;
}>;

export type CoronaryV3LesionStructuralCmdDirectionalCharacterizationV1 =
  Readonly<{
    characterizationId:
      typeof CORONARY_V3_LESION_STRUCTURAL_CMD_DIRECTIONAL_V1_ID;
    policy: typeof CORONARY_V3_LESION_STRUCTURAL_CMD_POLICY_V1;
    claim: typeof CORONARY_V3_LESION_STRUCTURAL_CMD_CLAIM_V1;
    literatureAnchors:
      typeof CORONARY_V3_LESION_STRUCTURAL_CMD_LITERATURE_ANCHORS_V1;
    measurementContract:
      typeof CORONARY_V3_LESION_STRUCTURAL_CMD_MEASUREMENT_CONTRACT_V1;
    ownerContract:
      typeof CORONARY_V3_LESION_STRUCTURAL_CMD_OWNER_CONTRACT_V1;
    blockedGates:
      typeof CORONARY_V3_LESION_STRUCTURAL_CMD_BLOCKED_GATES_V1;
    coarse: CoronaryV3LesionStructuralCmdAtDtV1;
    fine: CoronaryV3LesionStructuralCmdAtDtV1;
    comparison: CoronaryV3LesionStructuralCmdComparisonV1;
    numericalQaPassed: boolean;
    modelMechanismDirectionalChecksPassed: boolean;
    characterizationChecksPassed: boolean;
    biologicalValidationEstablished: false;
    physiologicalAcceptanceEstablished: false;
    clinicalValidationEstablished: false;
    releaseAcceptanceEstablished: false;
  }>;

type MutableSampleStateV1 = {
  hydraulic: CoronaryAcceptedHydraulicStateV2;
  autoregulation: CoronaryAcceptedAutoregulationStateV3 | null;
};

type ExplicitModelV1 = Readonly<{
  prior: CoronaryTopologyPriorV2;
  topology: CoronaryTopologyV2;
  collapseHydraulics: CoronaryCollapseHydraulicsPriorV2;
}>;

/** Runs the preregistered coarse sweep before the preregistered fine sweep. */
export function runCoronaryV3LesionStructuralCmdDirectionalCharacterizationV1():
CoronaryV3LesionStructuralCmdDirectionalCharacterizationV1 {
  const model = createExplicitModel();
  const coarse = runAtDt("coarse", 0.002, model);
  const fine = runAtDt("fine", 0.001, model);
  const comparison = compareCoronaryV3LesionStructuralCmdNumericsV1(
    coarse,
    fine,
  );
  const numericalQaPassed = coarse.allFiniteAndConserved
    && fine.allFiniteAndConserved
    && comparison.crossDtNumericalQaPassed;
  return Object.freeze({
    characterizationId:
      CORONARY_V3_LESION_STRUCTURAL_CMD_DIRECTIONAL_V1_ID,
    policy: CORONARY_V3_LESION_STRUCTURAL_CMD_POLICY_V1,
    claim: CORONARY_V3_LESION_STRUCTURAL_CMD_CLAIM_V1,
    literatureAnchors:
      CORONARY_V3_LESION_STRUCTURAL_CMD_LITERATURE_ANCHORS_V1,
    measurementContract:
      CORONARY_V3_LESION_STRUCTURAL_CMD_MEASUREMENT_CONTRACT_V1,
    ownerContract: CORONARY_V3_LESION_STRUCTURAL_CMD_OWNER_CONTRACT_V1,
    blockedGates: CORONARY_V3_LESION_STRUCTURAL_CMD_BLOCKED_GATES_V1,
    coarse,
    fine,
    comparison,
    numericalQaPassed,
    modelMechanismDirectionalChecksPassed:
      comparison.modelMechanismDirectionalChecksPassed,
    characterizationChecksPassed:
      numericalQaPassed && comparison.modelMechanismDirectionalChecksPassed,
    biologicalValidationEstablished: false as const,
    physiologicalAcceptanceEstablished: false as const,
    clinicalValidationEstablished: false as const,
    releaseAcceptanceEstablished: false as const,
  });
}

export function compareCoronaryV3LesionStructuralCmdNumericsV1(
  coarse: CoronaryV3LesionStructuralCmdAtDtV1,
  fine: CoronaryV3LesionStructuralCmdAtDtV1,
): CoronaryV3LesionStructuralCmdComparisonV1 {
  const coarseSamples = validateAtDtAndIndex(coarse, "coarse", 0.002);
  const fineSamples = validateAtDtAndIndex(fine, "fine", 0.001);
  const expectedIds = expectedSampleDescriptors().map(({ sampleId }) => sampleId);
  const crossDtBySampleId = Object.freeze(Object.fromEntries(expectedIds.map(
    (sampleId) => {
      const coarseSample = coarseSamples[sampleId]!;
      const fineSample = fineSamples[sampleId]!;
      const distalPressure = relativeCheck(
        coarseSample.summary.meanDistalPressureMmHg,
        fineSample.summary.meanDistalPressureMmHg,
      );
      const territoryInletFlow = relativeCheck(
        coarseSample.summary.meanTerritoryInletFlowMlPerSec,
        fineSample.summary.meanTerritoryInletFlowMlPerSec,
      );
      const territoryLargeArterialOutflow = relativeCheck(
        coarseSample.summary.meanTerritoryLargeArterialOutflowMlPerSec,
        fineSample.summary.meanTerritoryLargeArterialOutflowMlPerSec,
      );
      return [sampleId, Object.freeze({
        sampleId,
        distalPressure,
        territoryInletFlow,
        territoryLargeArterialOutflow,
        passed: distalPressure.passed
          && territoryInletFlow.passed
          && territoryLargeArterialOutflow.passed,
      })];
    },
  ))) as Readonly<Record<string, CoronaryV3LesionStructuralCmdCrossDtSampleV1>>;

  const structuralReserve = reserveByLevel(
    coarseSamples,
    fineSamples,
    "structural-microvascular-resistance",
    "fixed-hyperemic-tone",
  );
  const floorReserve = reserveByLevel(
    coarseSamples,
    fineSamples,
    "impaired-vasodilatory-tone-floor",
    "active-hyperemic-floor-fixed-point",
  );
  const lesionDistalPressure = makeDirectionalGate(
    "focal-lesion-distal-pressure-does-not-improve",
    valuesByLevel(coarseSamples, "focal-epicardial-lesion",
      "fixed-hyperemic-tone", "meanDistalPressureMmHg"),
    valuesByLevel(fineSamples, "focal-epicardial-lesion",
      "fixed-hyperemic-tone", "meanDistalPressureMmHg"),
    CORONARY_V3_LESION_STRUCTURAL_CMD_POLICY_V1
      .maximumDirectionalImprovementDistalPressureMmHg,
  );
  const lesionTerritoryFlow = makeDirectionalGate(
    "focal-lesion-territory-flow-does-not-improve",
    valuesByLevel(coarseSamples, "focal-epicardial-lesion",
      "fixed-hyperemic-tone", "meanTerritoryInletFlowMlPerSec"),
    valuesByLevel(fineSamples, "focal-epicardial-lesion",
      "fixed-hyperemic-tone", "meanTerritoryInletFlowMlPerSec"),
    CORONARY_V3_LESION_STRUCTURAL_CMD_POLICY_V1
      .maximumDirectionalImprovementTerritoryFlowMlPerSec,
  );
  const structuralFixedToneTerritoryFlow = makeDirectionalGate(
    "structural-R1-Rm-fixed-tone-flow-does-not-improve",
    valuesByLevel(coarseSamples, "structural-microvascular-resistance",
      "fixed-hyperemic-tone", "meanTerritoryInletFlowMlPerSec"),
    valuesByLevel(fineSamples, "structural-microvascular-resistance",
      "fixed-hyperemic-tone", "meanTerritoryInletFlowMlPerSec"),
    CORONARY_V3_LESION_STRUCTURAL_CMD_POLICY_V1
      .maximumDirectionalImprovementTerritoryFlowMlPerSec,
  );
  const structuralFixedToneFlowReserve = makeDirectionalGate(
    "structural-R1-Rm-fixed-tone-reserve-does-not-improve",
    structuralReserve.coarseValues,
    structuralReserve.fineValues,
    CORONARY_V3_LESION_STRUCTURAL_CMD_POLICY_V1
      .maximumDirectionalImprovementFlowReserveRatio,
  );
  const impairedVasodilatoryFloorActiveHyperemicFlowReserve =
    makeDirectionalGate(
      "impaired-vasodilatory-floor-active-hyperemic-reserve-does-not-improve",
      floorReserve.coarseValues,
      floorReserve.fineValues,
      CORONARY_V3_LESION_STRUCTURAL_CMD_POLICY_V1
        .maximumDirectionalImprovementFlowReserveRatio,
    );
  const ownerSeparation = ownerSeparationGate(coarseSamples, fineSamples);
  const crossDtNumericalQaPassed = Object.values(crossDtBySampleId)
    .every(({ passed }) => passed)
    && Object.values(structuralReserve.crossDtByLevel)
      .every(({ passed }) => passed)
    && Object.values(floorReserve.crossDtByLevel)
      .every(({ passed }) => passed);
  const modelMechanismDirectionalChecksPassed = [
    lesionDistalPressure,
    lesionTerritoryFlow,
    structuralFixedToneTerritoryFlow,
    structuralFixedToneFlowReserve,
    impairedVasodilatoryFloorActiveHyperemicFlowReserve,
  ].every(({ passed }) => passed) && ownerSeparation.passed;
  return Object.freeze({
    crossDtBySampleId,
    structuralReserveCrossDtByLevel: structuralReserve.crossDtByLevel,
    vasodilatoryFloorReserveCrossDtByLevel: floorReserve.crossDtByLevel,
    lesionDistalPressure,
    lesionTerritoryFlow,
    structuralFixedToneTerritoryFlow,
    structuralFixedToneFlowReserve,
    impairedVasodilatoryFloorActiveHyperemicFlowReserve,
    ownerSeparation,
    crossDtNumericalQaPassed,
    modelMechanismDirectionalChecksPassed,
    characterizationChecksPassed:
      crossDtNumericalQaPassed && modelMechanismDirectionalChecksPassed,
  });
}

type SampleDescriptorV1 = Readonly<{
  sampleId: string;
  axis: CoronaryV3LesionStructuralCmdAxisV1;
  levelId: CoronaryV3LesionStructuralCmdLevelIdV1;
  condition: CoronaryV3LesionStructuralCmdConditionV1;
}>;

function createExplicitModel(): ExplicitModelV1 {
  const prior = NORMAL_ADULT_CORONARY_TOPOLOGY_PRIOR_V2;
  const topology = buildCoronaryTopologyV2(prior);
  return Object.freeze({
    prior,
    topology,
    collapseHydraulics: buildCoronaryCollapseHydraulicsPriorV2(
      topology,
      0.10,
    ),
  });
}

function runAtDt(
  role: "coarse" | "fine",
  dtSec: 0.002 | 0.001,
  model: ExplicitModelV1,
): CoronaryV3LesionStructuralCmdAtDtV1 {
  const samples = Object.freeze(expectedSampleDescriptors().map((descriptor) =>
    runSample(role, dtSec, descriptor, model)));
  return Object.freeze({
    role,
    dtSec,
    modelBinding: Object.freeze({
      topologyId: model.prior.topologyId,
      topologyPriorFingerprint:
        coronaryTopologyPriorFingerprintV2(model.prior),
      collapseHydraulicsFingerprint:
        coronaryConfigurationFingerprintV2(model.collapseHydraulics),
      solverOptionsFingerprint: coronaryConfigurationFingerprintV2(
        DEFAULT_CORONARY_BACKWARD_EULER_SOLVER_OPTIONS_V2,
      ),
    }),
    samples,
    allFiniteAndConserved: samples.every(
      ({ allFinite, conservationToleranceSatisfied }) =>
        allFinite && conservationToleranceSatisfied,
    ),
    biologicalValidationEstablished: false as const,
    physiologicalAcceptanceEstablished: false as const,
  });
}

function runSample(
  role: "coarse" | "fine",
  dtSec: 0.002 | 0.001,
  descriptor: SampleDescriptorV1,
  model: ExplicitModelV1,
): CoronaryV3LesionStructuralCmdSampleV1 {
  const disease = createCoronaryV3LesionStructuralCmdDiseaseInputV1(
    descriptor.axis,
    descriptor.levelId,
  );
  const initialTone = createCoronaryV3LesionStructuralCmdToneStateV1(
    descriptor.condition,
    disease,
  );
  const initialized = initializePressureLadderCoronaryStateV2({
    boundary: fixedBoundary(),
    disease,
    toneResistanceScaleByTerritoryLayer: initialTone,
    collapseHydraulics: model.collapseHydraulics,
    options: DEFAULT_CORONARY_PRESSURE_LADDER_INITIALIZER_OPTIONS_V2,
  }, model.prior, model.topology);
  requireFiniteNumbers(
    initialized.diagnostics,
    `${descriptor.sampleId} initializer diagnostics`,
  );
  if (initialized.diagnostics.maximumAbsoluteNodeContinuityResidualMlPerSec
      > CORONARY_V3_LESION_STRUCTURAL_CMD_POLICY_V1
        .maximumAbsoluteInitializerContinuityResidualMlPerSec) {
    throw new Error(`${descriptor.sampleId} initializer tolerance exceeded`);
  }
  const active = descriptor.condition
    === "active-hyperemic-floor-fixed-point";
  const binding = active
    ? createCoronaryAutoregulationWindowBindingV3({
      originAcceptedTimeSec: 0,
      durationSec: CORONARY_V3_LESION_STRUCTURAL_CMD_POLICY_V1
        .acceptedWindowDurationSec,
      interpretation: "irregular-rhythm-stationary",
    })
    : null;
  const control = active ? activeHyperemiaControl(disease) : null;
  const state: MutableSampleStateV1 = {
    hydraulic: initialized.acceptedState,
    autoregulation: binding === null
      ? null
      : createCoronaryAcceptedAutoregulationStateV3(binding, {
        acceptedTimeSec: 0,
        revision: 0,
      }),
  };
  const rawAcceptedWindows = Object.freeze(Array.from(
    {
      length: CORONARY_V3_LESION_STRUCTURAL_CMD_POLICY_V1
        .exactRawWindowCountPerCondition,
    },
    (_, windowIndex) => runRawWindow(
      state,
      windowIndex,
      dtSec,
      disease,
      model,
      binding,
      control,
    ),
  ));
  const duration = rawAcceptedWindows.reduce(
    (sum, window) => sum + window.endTimeSec - window.startTimeSec,
    0,
  );
  const weightedMean = (
    value: (window: CoronaryV3LesionStructuralCmdRawWindowV1) => number,
  ) => rawAcceptedWindows.reduce(
    (sum, window) => sum
      + (window.endTimeSec - window.startTimeSec) * value(window),
    0,
  ) / duration;
  const last = rawAcceptedWindows.at(-1)!;
  const summary = Object.freeze({
    acceptedWindowCount: 3 as const,
    observationDurationSec: 3 as const,
    meanDistalPressureMmHg:
      weightedMean((window) => window.meanDistalPressureMmHg),
    meanTerritoryInletFlowMlPerSec:
      weightedMean((window) => window.meanTerritoryInletFlowMlPerSec),
    meanTerritoryLargeArterialOutflowMlPerSec:
      weightedMean((window) =>
        window.meanTerritoryLargeArterialOutflowMlPerSec),
    meanFocalLesionPressureLossMmHg:
      weightedMean((window) => window.meanFocalLesionPressureLossMmHg),
    terminalEffectiveToneResistanceScaleByTargetLayer: Object.freeze({
      ...last.endToneResistanceScaleByTargetLayer,
    }),
  });
  const sample = Object.freeze({
    sampleId: descriptor.sampleId,
    role,
    dtSec,
    axis: descriptor.axis,
    levelId: descriptor.levelId,
    condition: descriptor.condition,
    diseaseInput: disease,
    initialToneResistanceScaleByTerritoryLayer: initialTone,
    diseaseFingerprint: coronaryConfigurationFingerprintV2(disease),
    initialToneFingerprint: coronaryConfigurationFingerprintV2(initialTone),
    initializerMaximumAbsoluteContinuityResidualMlPerSec:
      initialized.diagnostics
        .maximumAbsoluteNodeContinuityResidualMlPerSec,
    rawAcceptedWindows,
    summary,
    allFinite: true as const,
    conservationToleranceSatisfied: true as const,
    biologicalValidationEstablished: false as const,
    physiologicalAcceptanceEstablished: false as const,
  }) satisfies CoronaryV3LesionStructuralCmdSampleV1;
  requireFiniteNumbers(sample, `${descriptor.sampleId} sample`);
  return sample;
}

function runRawWindow(
  state: MutableSampleStateV1,
  windowIndex: number,
  nominalDtSec: 0.002 | 0.001,
  disease: CoronaryDiseaseInputV2,
  model: ExplicitModelV1,
  binding: ReturnType<typeof createCoronaryAutoregulationWindowBindingV3>
    | null,
  control: CoronaryAutoregulationWindowControlV3 | null,
): CoronaryV3LesionStructuralCmdRawWindowV1 {
  const policy = CORONARY_V3_LESION_STRUCTURAL_CMD_POLICY_V1;
  const boundary = fixedBoundary();
  const startTimeSec = state.hydraulic.acceptedTimeSec;
  const expectedStart = windowIndex * policy.acceptedWindowDurationSec;
  if (Math.abs(startTimeSec - expectedStart) > 1e-9) {
    throw new Error("coronary directional window start identity mismatch");
  }
  const endTarget = expectedStart + policy.acceptedWindowDurationSec;
  const startVolume = totalCoronaryVolume(state.hydraulic);
  const startTone = targetLayerTone(state.hydraulic
    .toneResistanceScaleByTerritoryLayer);
  let acceptedStepCount = 0;
  let minimumAcceptedStepDurationSec = Number.POSITIVE_INFINITY;
  let maximumAcceptedStepDurationSec = 0;
  let distalPressureIntegral = 0;
  let territoryInletFlowIntegral = 0;
  let territoryOutflowIntegral = 0;
  let focalLossIntegral = 0;
  let totalInletFlowIntegral = 0;
  let bloodVolumeIntegral = 0;
  let signedBoundaryInletVolumeMl = 0;
  let signedBoundaryOutletVolumeMl = 0;
  let sumOfStepLedgerResidualsMl = 0;
  let maximumAbsoluteStepLedgerResidualMl = 0;
  let maximumAbsoluteNodeContinuityResidualMl = 0;
  let activeBoundedAt:
    CoronaryV3LesionStructuralCmdRawWindowV1[
      "activeHyperemiaBoundedAtByTargetLayer"
    ] = null;
  const expectedAcceptedStepCount = Math.round(
    policy.acceptedWindowDurationSec / nominalDtSec,
  );
  while (acceptedStepCount < expectedAcceptedStepCount) {
    const remaining = endTarget - state.hydraulic.acceptedTimeSec;
    const autoregulationMaximum = binding === null
      ? remaining
      : maximumCoronaryAutoregulationStepDurationV3(
        binding,
        state.autoregulation!,
        state.hydraulic.acceptedTimeSec,
      );
    const finalScheduledStep = acceptedStepCount
      === expectedAcceptedStepCount - 1;
    const dtSec = finalScheduledStep
      ? Math.min(remaining, autoregulationMaximum)
      : Math.min(nominalDtSec, remaining, autoregulationMaximum);
    if (!(dtSec > 0)) {
      throw new Error("coronary directional window has no positive step");
    }
    const previousHydraulic = state.hydraulic;
    const trial = solveCoronaryBackwardEulerTrialV2(previousHydraulic, {
      dtSec,
      boundary,
      disease,
      collapseHydraulics: model.collapseHydraulics,
      solverOptions: DEFAULT_CORONARY_BACKWARD_EULER_SOLVER_OPTIONS_V2,
    }, model.prior, model.topology);
    validateStepDiagnostics(trial.diagnostics, acceptedStepCount);
    const hydraulics = trial.diagnostics.hydraulics;
    let appliedTone = trial.candidateAcceptedState
      .toneResistanceScaleByTerritoryLayer;
    if (binding !== null && control !== null) {
      const advanced = advanceCoronaryAcceptedAutoregulationV3(
        binding,
        state.autoregulation!,
        previousHydraulic.toneResistanceScaleByTerritoryLayer,
        {
          previousAcceptedTimeSec: previousHydraulic.acceptedTimeSec,
          candidateAcceptedTimeSec:
            trial.candidateAcceptedState.acceptedTimeSec,
          candidateRevision: trial.candidateAcceptedState.revision,
          finalQmInternalFlowMlPerSecByTerritoryLayer:
            hydraulics.layerQmInternalFlowMlPerSecByTerritory,
          finalPostFocalLesionPressureMmHgByTerritory:
            hydraulics.postFocalLesionAbsolutePressureMmHgByTerritory,
          finalCommonCoronaryVenousPressureMmHg:
            hydraulics.absolutePressureMmHgByNode.CV,
          control,
          topologyPrior: model.prior,
        },
      );
      state.autoregulation = advanced.nextState;
      appliedTone = advanced.nextToneResistanceScaleByTerritoryLayer;
      if (advanced.completedWindow !== null) {
        appliedTone = mapLayerRecord((territoryId, layerId) => {
          const layerStep = advanced.completedWindow!.toneStep
            .layerStepByTerritoryLayer[territoryId][layerId];
          return layerStep.boundedAt === "minimum"
            ? disease[territoryId].layers[layerId]
              .vasodilatoryToneMinimumResistanceScale
            : appliedTone[territoryId][layerId];
        });
        activeBoundedAt = Object.freeze({
          subepicardial: advanced.completedWindow.toneStep
            .layerStepByTerritoryLayer.LAD.subepicardial.boundedAt,
          subendocardial: advanced.completedWindow.toneStep
            .layerStepByTerritoryLayer.LAD.subendocardial.boundedAt,
        });
      }
    }
    state.hydraulic = freezeHydraulicStateWithTone(
      trial.candidateAcceptedState,
      appliedTone,
    );
    acceptedStepCount += 1;
    minimumAcceptedStepDurationSec = Math.min(
      minimumAcceptedStepDurationSec,
      dtSec,
    );
    maximumAcceptedStepDurationSec = Math.max(
      maximumAcceptedStepDurationSec,
      dtSec,
    );
    distalPressureIntegral += dtSec
      * hydraulics.postFocalLesionAbsolutePressureMmHgByTerritory.LAD;
    territoryInletFlowIntegral += dtSec
      * hydraulics.inletFlowMlPerSecByTerritory.LAD;
    territoryOutflowIntegral += dtSec
      * hydraulics.largeArterialOutflowMlPerSecByTerritory.LAD;
    focalLossIntegral += dtSec
      * hydraulics.focalStenosisPressureLossMmHgByTerritory.LAD;
    totalInletFlowIntegral += dtSec * hydraulics.totalInletFlowMlPerSec;
    bloodVolumeIntegral += dtSec
      * trial.diagnostics.candidateCoronaryBloodVolumeMl;
    signedBoundaryInletVolumeMl +=
      trial.diagnostics.signedBoundaryInletVolumeMl;
    signedBoundaryOutletVolumeMl +=
      trial.diagnostics.signedBoundaryOutletVolumeMl;
    sumOfStepLedgerResidualsMl +=
      trial.diagnostics.exactBloodVolumeLedgerResidualMl;
    maximumAbsoluteStepLedgerResidualMl = Math.max(
      maximumAbsoluteStepLedgerResidualMl,
      Math.abs(trial.diagnostics.exactBloodVolumeLedgerResidualMl),
    );
    maximumAbsoluteNodeContinuityResidualMl = Math.max(
      maximumAbsoluteNodeContinuityResidualMl,
      trial.diagnostics.maximumAbsoluteNodeContinuityResidualMl,
    );
  }
  const endTimeSec = state.hydraulic.acceptedTimeSec;
  const durationSec = endTimeSec - startTimeSec;
  if (Math.abs(durationSec - policy.acceptedWindowDurationSec) > 1e-9) {
    throw new Error("coronary directional raw window duration mismatch");
  }
  if ((binding === null) !== (activeBoundedAt === null)) {
    throw new Error(
      `active hyperemia completion identity mismatch at window ${windowIndex}: active=${binding !== null}, completion=${activeBoundedAt !== null}, end=${endTimeSec}`,
    );
  }
  const endVolume = totalCoronaryVolume(state.hydraulic);
  const windowLedger = endVolume - startVolume
    - (signedBoundaryInletVolumeMl - signedBoundaryOutletVolumeMl);
  if (Math.abs(windowLedger)
      > policy.maximumAbsoluteStepLedgerResidualMl * acceptedStepCount) {
    throw new Error("coronary directional window ledger tolerance exceeded");
  }
  const raw = Object.freeze({
    windowIndex,
    startTimeSec,
    endTimeSec,
    acceptedStepCount,
    minimumAcceptedStepDurationSec,
    maximumAcceptedStepDurationSec,
    meanDistalPressureMmHg: distalPressureIntegral / durationSec,
    meanTerritoryInletFlowMlPerSec:
      territoryInletFlowIntegral / durationSec,
    meanTerritoryLargeArterialOutflowMlPerSec:
      territoryOutflowIntegral / durationSec,
    meanFocalLesionPressureLossMmHg: focalLossIntegral / durationSec,
    meanTotalCoronaryInletFlowMlPerSec:
      totalInletFlowIntegral / durationSec,
    meanCoronaryBloodVolumeMl: bloodVolumeIntegral / durationSec,
    startCoronaryBloodVolumeMl: startVolume,
    endCoronaryBloodVolumeMl: endVolume,
    signedBoundaryInletVolumeMl,
    signedBoundaryOutletVolumeMl,
    exactWindowBloodVolumeLedgerResidualMl: windowLedger,
    sumOfStepLedgerResidualsMl,
    maximumAbsoluteStepLedgerResidualMl,
    maximumAbsoluteNodeContinuityResidualMl,
    startToneResistanceScaleByTargetLayer: startTone,
    endToneResistanceScaleByTargetLayer: targetLayerTone(
      state.hydraulic.toneResistanceScaleByTerritoryLayer,
    ),
    activeHyperemiaControlApplied: binding !== null,
    activeHyperemiaBoundedAtByTargetLayer: activeBoundedAt,
    allFinite: true as const,
    conservationToleranceSatisfied: true as const,
  }) satisfies CoronaryV3LesionStructuralCmdRawWindowV1;
  requireFiniteNumbers(raw, `coronary directional raw window ${windowIndex}`);
  return raw;
}

function validateStepDiagnostics(
  diagnostics: ReturnType<typeof solveCoronaryBackwardEulerTrialV2>["diagnostics"],
  stepIndex: number,
): void {
  const policy = CORONARY_V3_LESION_STRUCTURAL_CMD_POLICY_V1;
  requireFiniteNumbers(diagnostics, `coronary directional step ${stepIndex}`);
  if (Math.abs(diagnostics.exactBloodVolumeLedgerResidualMl)
      > policy.maximumAbsoluteStepLedgerResidualMl) {
    throw new Error("coronary directional step ledger tolerance exceeded");
  }
  if (diagnostics.maximumAbsoluteNodeContinuityResidualMl
      > policy.maximumAbsoluteNodeContinuityResidualMl) {
    throw new Error("coronary directional node continuity tolerance exceeded");
  }
}

function fixedBoundary(): CoronaryHydraulicBoundaryInputV2 {
  const policy = CORONARY_V3_LESION_STRUCTURAL_CMD_POLICY_V1;
  return Object.freeze({
    absoluteAorticPressureMmHg: policy.fixedAbsoluteAorticPressureMmHg,
    absoluteRightAtrialPressureMmHg:
      policy.fixedAbsoluteRightAtrialPressureMmHg,
    perivascularExternalPressureMmHg:
      policy.fixedPerivascularExternalPressureMmHg,
    intramyocardialPressureMmHgByTerritoryLayer:
      policy.fixedIntramyocardialPressureMmHgByTerritoryLayer,
  });
}

function activeHyperemiaControl(
  disease: CoronaryDiseaseInputV2,
): CoronaryAutoregulationWindowControlV3 {
  return Object.freeze({
    controlId:
      "coronary-v3-lesion-structural-cmd-active-hyperemia-floor-fixed-point-v1",
    demandScaleByTerritoryLayer: mapLayerRecord(() => 1),
    hyperemia01ByTerritoryLayer: mapLayerRecord(() => 1),
    effectiveMinimumToneScaleByTerritoryLayer: mapLayerRecord(
      (territoryId, layerId) => disease[territoryId].layers[layerId]
        .vasodilatoryToneMinimumResistanceScale,
    ),
  });
}

export function createCoronaryV3LesionStructuralCmdDiseaseInputV1(
  axis: CoronaryV3LesionStructuralCmdAxisV1,
  levelId: CoronaryV3LesionStructuralCmdLevelIdV1,
): CoronaryDiseaseInputV2 {
  const lesionLevel = levelById(
    CORONARY_V3_FOCAL_LESION_LEVELS_V1,
    levelId,
  );
  const structuralLevel = levelById(
    CORONARY_V3_STRUCTURAL_CMD_LEVELS_V1,
    levelId,
  );
  const floorLevel = levelById(
    CORONARY_V3_VASODILATORY_FLOOR_LEVELS_V1,
    levelId,
  );
  const focal = axis === "focal-epicardial-lesion"
    ? mapFocalDiameterStenosisV2(
      "LAD",
      lesionLevel.diameterStenosisFraction01,
    )
    : mapFocalDiameterStenosisV2("LAD", 0);
  return Object.freeze(Object.fromEntries(CORONARY_TERRITORY_IDS_V2.map(
    (territoryId) => {
      const normalTerritory = NORMAL_CORONARY_DISEASE_INPUT_V2[territoryId];
      const target = territoryId === "LAD";
      return [territoryId, Object.freeze({
        focalStenosisAdditionalLinearResistanceMmHgSecPerMl:
          target
            ? focal.focalStenosisAdditionalLinearResistanceMmHgSecPerMl
            : normalTerritory
              .focalStenosisAdditionalLinearResistanceMmHgSecPerMl,
        focalStenosisAdditionalQuadraticResistanceMmHgSec2PerMl2:
          target
            ? focal.focalStenosisAdditionalQuadraticResistanceMmHgSec2PerMl2
            : normalTerritory
              .focalStenosisAdditionalQuadraticResistanceMmHgSec2PerMl2,
        layers: Object.freeze(Object.fromEntries(CORONARY_LAYER_IDS_V2.map(
          (layerId) => {
            const normalLayer = normalTerritory.layers[layerId];
            return [layerId, Object.freeze({
              structuralR1ResistanceScale:
                target
                  && axis
                    === "structural-microvascular-resistance"
                  ? structuralLevel.structuralR1ResistanceScale
                  : normalLayer.structuralR1ResistanceScale,
              structuralRmResistanceScale:
                target
                  && axis
                    === "structural-microvascular-resistance"
                  ? structuralLevel.structuralRmResistanceScale
                  : normalLayer.structuralRmResistanceScale,
              vasodilatoryToneMinimumResistanceScale:
                target
                  && axis
                    === "impaired-vasodilatory-tone-floor"
                  ? floorLevel.vasodilatoryToneMinimumResistanceScale
                  : normalLayer.vasodilatoryToneMinimumResistanceScale,
            })];
          },
        ))) as CoronaryDiseaseInputV2[typeof territoryId]["layers"],
      })];
    },
  ))) as CoronaryDiseaseInputV2;
}

export function createCoronaryV3LesionStructuralCmdToneStateV1(
  condition: CoronaryV3LesionStructuralCmdConditionV1,
  disease: CoronaryDiseaseInputV2,
): CoronaryToneStateV2 {
  if (condition === "fixed-rest-tone") {
    return mapLayerRecord(() =>
      CORONARY_V3_LESION_STRUCTURAL_CMD_POLICY_V1
        .fixedRestToneResistanceScale);
  }
  if (condition === "fixed-hyperemic-tone") {
    return mapLayerRecord(() =>
      CORONARY_V3_LESION_STRUCTURAL_CMD_POLICY_V1
        .fixedHyperemicToneResistanceScale);
  }
  return mapLayerRecord((territoryId, layerId) =>
    disease[territoryId].layers[layerId]
      .vasodilatoryToneMinimumResistanceScale);
}

function expectedSampleDescriptors(): readonly SampleDescriptorV1[] {
  const output: SampleDescriptorV1[] = [];
  for (const { levelId } of CORONARY_V3_FOCAL_LESION_LEVELS_V1) {
    output.push(descriptor(
      "focal-epicardial-lesion",
      levelId,
      "fixed-hyperemic-tone",
    ));
  }
  for (const { levelId } of CORONARY_V3_STRUCTURAL_CMD_LEVELS_V1) {
    output.push(
      descriptor(
        "structural-microvascular-resistance",
        levelId,
        "fixed-rest-tone",
      ),
      descriptor(
        "structural-microvascular-resistance",
        levelId,
        "fixed-hyperemic-tone",
      ),
    );
  }
  for (const { levelId } of CORONARY_V3_VASODILATORY_FLOOR_LEVELS_V1) {
    output.push(
      descriptor(
        "impaired-vasodilatory-tone-floor",
        levelId,
        "fixed-rest-tone",
      ),
      descriptor(
        "impaired-vasodilatory-tone-floor",
        levelId,
        "active-hyperemic-floor-fixed-point",
      ),
    );
  }
  return Object.freeze(output);
}

function descriptor(
  axis: CoronaryV3LesionStructuralCmdAxisV1,
  levelId: CoronaryV3LesionStructuralCmdLevelIdV1,
  condition: CoronaryV3LesionStructuralCmdConditionV1,
): SampleDescriptorV1 {
  return Object.freeze({
    sampleId: `${axis}:${levelId}:${condition}`,
    axis,
    levelId,
    condition,
  });
}

function validateAtDtAndIndex(
  candidate: CoronaryV3LesionStructuralCmdAtDtV1,
  expectedRole: "coarse" | "fine",
  expectedDtSec: 0.002 | 0.001,
): Readonly<Record<string, CoronaryV3LesionStructuralCmdSampleV1>> {
  if (candidate.role !== expectedRole || candidate.dtSec !== expectedDtSec) {
    throw new Error(`${expectedRole} role/dt binding is invalid`);
  }
  if (!candidate.allFiniteAndConserved
    || candidate.biologicalValidationEstablished !== false
    || candidate.physiologicalAcceptanceEstablished !== false) {
    throw new Error(`${expectedRole} aggregate integrity/claim is invalid`);
  }
  validateModelBinding(candidate.modelBinding, expectedRole);
  const descriptors = expectedSampleDescriptors();
  if (candidate.samples.length !== descriptors.length) {
    throw new Error(`${expectedRole} must contain every declared one-factor sample`);
  }
  const byId: Record<string, CoronaryV3LesionStructuralCmdSampleV1> = {};
  for (const sample of candidate.samples) {
    if (sample.sampleId in byId) {
      throw new Error(`${expectedRole} duplicate sample ${sample.sampleId}`);
    }
    byId[sample.sampleId] = sample;
  }
  for (const descriptorValue of descriptors) {
    const sample = byId[descriptorValue.sampleId];
    if (sample === undefined) {
      throw new Error(`${expectedRole} missing sample ${descriptorValue.sampleId}`);
    }
    validateSample(sample, descriptorValue, expectedRole, expectedDtSec);
  }
  if (Object.keys(byId).some((sampleId) =>
    !descriptors.some((expected) => expected.sampleId === sampleId))) {
    throw new Error(`${expectedRole} contains an unknown sample identity`);
  }
  return Object.freeze(byId);
}

function validateModelBinding(
  binding: CoronaryV3LesionStructuralCmdAtDtV1["modelBinding"],
  label: string,
): void {
  const model = createExplicitModel();
  const expected = {
    topologyId: model.prior.topologyId,
    topologyPriorFingerprint: coronaryTopologyPriorFingerprintV2(model.prior),
    collapseHydraulicsFingerprint:
      coronaryConfigurationFingerprintV2(model.collapseHydraulics),
    solverOptionsFingerprint: coronaryConfigurationFingerprintV2(
      DEFAULT_CORONARY_BACKWARD_EULER_SOLVER_OPTIONS_V2,
    ),
  } as const;
  for (const key of Object.keys(expected) as (keyof typeof expected)[]) {
    if (binding[key] !== expected[key]) {
      throw new Error(`${label} model binding ${key} is invalid`);
    }
  }
}

function validateSample(
  sample: CoronaryV3LesionStructuralCmdSampleV1,
  descriptorValue: SampleDescriptorV1,
  expectedRole: "coarse" | "fine",
  expectedDtSec: 0.002 | 0.001,
): void {
  if (sample.sampleId !== descriptorValue.sampleId
    || sample.axis !== descriptorValue.axis
    || sample.levelId !== descriptorValue.levelId
    || sample.condition !== descriptorValue.condition
    || sample.role !== expectedRole
    || sample.dtSec !== expectedDtSec) {
    throw new Error(`${descriptorValue.sampleId} sample identity mismatch`);
  }
  if (!sample.allFinite || !sample.conservationToleranceSatisfied
    || sample.biologicalValidationEstablished !== false
    || sample.physiologicalAcceptanceEstablished !== false) {
    throw new Error(`${descriptorValue.sampleId} sample integrity/claim mismatch`);
  }
  requireFiniteNumbers(sample, `${descriptorValue.sampleId} sample`);
  const expectedDisease = createCoronaryV3LesionStructuralCmdDiseaseInputV1(
    descriptorValue.axis,
    descriptorValue.levelId,
  );
  const expectedTone = createCoronaryV3LesionStructuralCmdToneStateV1(
    descriptorValue.condition,
    expectedDisease,
  );
  const diseaseFingerprint = coronaryConfigurationFingerprintV2(
    sample.diseaseInput,
  );
  const toneFingerprint = coronaryConfigurationFingerprintV2(
    sample.initialToneResistanceScaleByTerritoryLayer,
  );
  if (sample.diseaseFingerprint !== diseaseFingerprint
    || diseaseFingerprint
      !== coronaryConfigurationFingerprintV2(expectedDisease)) {
    throw new Error(`${descriptorValue.sampleId} disease owner projection mismatch`);
  }
  if (sample.initialToneFingerprint !== toneFingerprint
    || toneFingerprint !== coronaryConfigurationFingerprintV2(expectedTone)) {
    throw new Error(`${descriptorValue.sampleId} initial tone projection mismatch`);
  }
  if (sample.initializerMaximumAbsoluteContinuityResidualMlPerSec
      > CORONARY_V3_LESION_STRUCTURAL_CMD_POLICY_V1
        .maximumAbsoluteInitializerContinuityResidualMlPerSec) {
    throw new Error(`${descriptorValue.sampleId} initializer tolerance exceeded`);
  }
  validateRawWindows(sample, descriptorValue, expectedDtSec);
}

function validateRawWindows(
  sample: CoronaryV3LesionStructuralCmdSampleV1,
  descriptorValue: SampleDescriptorV1,
  expectedDtSec: number,
): void {
  const policy = CORONARY_V3_LESION_STRUCTURAL_CMD_POLICY_V1;
  if (sample.rawAcceptedWindows.length
      !== policy.exactRawWindowCountPerCondition) {
    throw new Error(`${sample.sampleId} raw window count mismatch`);
  }
  const active = descriptorValue.condition
    === "active-hyperemic-floor-fixed-point";
  for (let index = 0; index < sample.rawAcceptedWindows.length; index += 1) {
    const window = sample.rawAcceptedWindows[index]!;
    const expectedStart = index * policy.acceptedWindowDurationSec;
    const expectedEnd = expectedStart + policy.acceptedWindowDurationSec;
    if (window.windowIndex !== index
      || Math.abs(window.startTimeSec - expectedStart) > 1e-9
      || Math.abs(window.endTimeSec - expectedEnd) > 1e-9) {
      throw new Error(`${sample.sampleId} raw window identity mismatch`);
    }
    if (!window.allFinite || !window.conservationToleranceSatisfied
      || !Number.isSafeInteger(window.acceptedStepCount)
      || window.acceptedStepCount <= 0
      || !(window.minimumAcceptedStepDurationSec > 0)
      || window.maximumAcceptedStepDurationSec > expectedDtSec + 1e-12) {
      throw new Error(`${sample.sampleId} raw window step integrity mismatch`);
    }
    if (Math.abs(window.maximumAbsoluteStepLedgerResidualMl)
        > policy.maximumAbsoluteStepLedgerResidualMl
      || Math.abs(window.maximumAbsoluteNodeContinuityResidualMl)
        > policy.maximumAbsoluteNodeContinuityResidualMl
      || Math.abs(window.exactWindowBloodVolumeLedgerResidualMl)
        > policy.maximumAbsoluteStepLedgerResidualMl
          * window.acceptedStepCount) {
      throw new Error(`${sample.sampleId} raw window conservation mismatch`);
    }
    if (window.activeHyperemiaControlApplied !== active
      || (window.activeHyperemiaBoundedAtByTargetLayer !== null) !== active) {
      throw new Error(`${sample.sampleId} active hyperemia identity mismatch`);
    }
    if (active && (
      window.activeHyperemiaBoundedAtByTargetLayer!.subepicardial
        !== "minimum"
      || window.activeHyperemiaBoundedAtByTargetLayer!.subendocardial
        !== "minimum"
    )) {
      throw new Error(`${sample.sampleId} active hyperemia is not at its floor fixed point`);
    }
    const expectedTone = targetLayerTone(
      sample.initialToneResistanceScaleByTerritoryLayer,
    );
    for (const layerId of CORONARY_LAYER_IDS_V2) {
      requireApproximatelyEqual(
        window.startToneResistanceScaleByTargetLayer[layerId],
        expectedTone[layerId],
        `${sample.sampleId} ${layerId} raw start tone`,
      );
      requireApproximatelyEqual(
        window.endToneResistanceScaleByTargetLayer[layerId],
        expectedTone[layerId],
        `${sample.sampleId} ${layerId} raw end tone`,
      );
    }
  }
  const summary = sample.summary;
  if (summary.acceptedWindowCount !== 3
    || summary.observationDurationSec !== 3) {
    throw new Error(`${sample.sampleId} summary horizon mismatch`);
  }
  const mean = (
    value: (window: CoronaryV3LesionStructuralCmdRawWindowV1) => number,
  ) => sample.rawAcceptedWindows.reduce(
    (sum, window) => sum + value(window),
    0,
  ) / sample.rawAcceptedWindows.length;
  requireApproximatelyEqual(
    summary.meanDistalPressureMmHg,
    mean((window) => window.meanDistalPressureMmHg),
    `${sample.sampleId} distal summary`,
  );
  requireApproximatelyEqual(
    summary.meanTerritoryInletFlowMlPerSec,
    mean((window) => window.meanTerritoryInletFlowMlPerSec),
    `${sample.sampleId} inlet-flow summary`,
  );
  requireApproximatelyEqual(
    summary.meanTerritoryLargeArterialOutflowMlPerSec,
    mean((window) => window.meanTerritoryLargeArterialOutflowMlPerSec),
    `${sample.sampleId} outflow summary`,
  );
  requireApproximatelyEqual(
    summary.meanFocalLesionPressureLossMmHg,
    mean((window) => window.meanFocalLesionPressureLossMmHg),
    `${sample.sampleId} focal-loss summary`,
  );
  const terminal = sample.rawAcceptedWindows.at(-1)!
    .endToneResistanceScaleByTargetLayer;
  for (const layerId of CORONARY_LAYER_IDS_V2) {
    requireApproximatelyEqual(
      summary.terminalEffectiveToneResistanceScaleByTargetLayer[layerId],
      terminal[layerId],
      `${sample.sampleId} terminal ${layerId} tone`,
    );
  }
}

function relativeCheck(
  coarseValue: number,
  fineValue: number,
): CoronaryV3LesionStructuralCmdRelativeCheckV1 {
  if (!Number.isFinite(coarseValue) || !Number.isFinite(fineValue)) {
    throw new Error("cross-dt values must be finite");
  }
  const policy = CORONARY_V3_LESION_STRUCTURAL_CMD_POLICY_V1;
  const denominatorGatePassed = Math.abs(fineValue)
    > policy.minimumRelativeDifferenceDenominator;
  const relativeDifference = denominatorGatePassed
    ? Math.abs(coarseValue - fineValue) / Math.abs(fineValue)
    : null;
  const passed = relativeDifference !== null
    && relativeDifference <= policy.maximumCrossDtRelativeDifference;
  return Object.freeze({
    coarseValue,
    fineValue,
    relativeDifference,
    denominatorGatePassed,
    maximumAllowedRelativeDifference:
      policy.maximumCrossDtRelativeDifference,
    passed,
  });
}

function reserveByLevel(
  coarse: Readonly<Record<string, CoronaryV3LesionStructuralCmdSampleV1>>,
  fine: Readonly<Record<string, CoronaryV3LesionStructuralCmdSampleV1>>,
  axis: "structural-microvascular-resistance"
    | "impaired-vasodilatory-tone-floor",
  hyperemicCondition: "fixed-hyperemic-tone"
    | "active-hyperemic-floor-fixed-point",
): Readonly<{
  coarseValues: readonly number[];
  fineValues: readonly number[];
  crossDtByLevel:
    Readonly<Record<string, CoronaryV3LesionStructuralCmdRelativeCheckV1>>;
}> {
  const coarseValues: number[] = [];
  const fineValues: number[] = [];
  const crossDtEntries: [string, CoronaryV3LesionStructuralCmdRelativeCheckV1][] = [];
  for (const levelId of CORONARY_V3_LESION_STRUCTURAL_CMD_LEVEL_IDS_V1) {
    const coarseRest = sampleFor(coarse, axis, levelId, "fixed-rest-tone")
      .summary.meanTerritoryInletFlowMlPerSec;
    const coarseHyper = sampleFor(coarse, axis, levelId, hyperemicCondition)
      .summary.meanTerritoryInletFlowMlPerSec;
    const fineRest = sampleFor(fine, axis, levelId, "fixed-rest-tone")
      .summary.meanTerritoryInletFlowMlPerSec;
    const fineHyper = sampleFor(fine, axis, levelId, hyperemicCondition)
      .summary.meanTerritoryInletFlowMlPerSec;
    for (const [label, value] of [
      ["coarse rest", coarseRest],
      ["coarse hyperemia", coarseHyper],
      ["fine rest", fineRest],
      ["fine hyperemia", fineHyper],
    ] as const) {
      if (!(value > CORONARY_V3_LESION_STRUCTURAL_CMD_POLICY_V1
        .minimumRelativeDifferenceDenominator)) {
        throw new Error(`${axis} ${levelId} ${label} flow denominator is invalid`);
      }
    }
    const coarseReserve = coarseHyper / coarseRest;
    const fineReserve = fineHyper / fineRest;
    coarseValues.push(coarseReserve);
    fineValues.push(fineReserve);
    crossDtEntries.push([
      levelId,
      relativeCheck(coarseReserve, fineReserve),
    ]);
  }
  return Object.freeze({
    coarseValues: Object.freeze(coarseValues),
    fineValues: Object.freeze(fineValues),
    crossDtByLevel: Object.freeze(Object.fromEntries(crossDtEntries)),
  });
}

function valuesByLevel(
  samples: Readonly<Record<string, CoronaryV3LesionStructuralCmdSampleV1>>,
  axis: CoronaryV3LesionStructuralCmdAxisV1,
  condition: CoronaryV3LesionStructuralCmdConditionV1,
  observable: "meanDistalPressureMmHg"
    | "meanTerritoryInletFlowMlPerSec",
): readonly number[] {
  return Object.freeze(CORONARY_V3_LESION_STRUCTURAL_CMD_LEVEL_IDS_V1.map(
    (levelId) => sampleFor(samples, axis, levelId, condition)
      .summary[observable],
  ));
}

function sampleFor(
  samples: Readonly<Record<string, CoronaryV3LesionStructuralCmdSampleV1>>,
  axis: CoronaryV3LesionStructuralCmdAxisV1,
  levelId: CoronaryV3LesionStructuralCmdLevelIdV1,
  condition: CoronaryV3LesionStructuralCmdConditionV1,
): CoronaryV3LesionStructuralCmdSampleV1 {
  const sampleId = descriptor(axis, levelId, condition).sampleId;
  const sample = samples[sampleId];
  if (sample === undefined) throw new Error(`missing sample ${sampleId}`);
  return sample;
}

function makeDirectionalGate(
  gateId: string,
  coarseValues: readonly number[],
  fineValues: readonly number[],
  tolerance: number,
): CoronaryV3LesionStructuralCmdDirectionalGateV1 {
  if (coarseValues.length !== 3 || fineValues.length !== 3
    || [...coarseValues, ...fineValues].some((value) =>
      !Number.isFinite(value))) {
    throw new Error(`${gateId} requires three finite ordered values per dt`);
  }
  const adjacent = (values: readonly number[]) => Object.freeze([
    values[1]! - values[0]!,
    values[2]! - values[1]!,
  ]);
  const coarseAdjacentImprovements = adjacent(coarseValues);
  const fineAdjacentImprovements = adjacent(fineValues);
  const coarsePassed = coarseAdjacentImprovements.every(
    (improvement) => improvement <= tolerance,
  );
  const finePassed = fineAdjacentImprovements.every(
    (improvement) => improvement <= tolerance,
  );
  return Object.freeze({
    gateId,
    direction: "non-increasing-with-protocol-level" as const,
    tolerance,
    coarseValues: Object.freeze([...coarseValues]),
    fineValues: Object.freeze([...fineValues]),
    coarseAdjacentImprovements,
    fineAdjacentImprovements,
    coarsePassed,
    finePassed,
    passed: coarsePassed && finePassed,
  });
}

function ownerSeparationGate(
  coarse: Readonly<Record<string, CoronaryV3LesionStructuralCmdSampleV1>>,
  fine: Readonly<Record<string, CoronaryV3LesionStructuralCmdSampleV1>>,
): CoronaryV3LesionStructuralCmdOwnerSeparationGateV1 {
  const owner = CORONARY_V3_LESION_STRUCTURAL_CMD_OWNER_CONTRACT_V1;
  const paths = [
    owner.focalEpicardialLesion.diseaseParameterOwner,
    owner.structuralMicrovascularResistance.diseaseParameterOwner,
    owner.impairedVasodilatoryToneFloor.diseaseParameterOwner,
  ];
  const pathsArePairwiseDistinct = new Set(paths).size === paths.length;
  const everyOneFactorSampleKeepsOtherAxesAtReference = [
    ...Object.values(coarse),
    ...Object.values(fine),
  ].every((sample) => sample.diseaseFingerprint
    === coronaryConfigurationFingerprintV2(
      createCoronaryV3LesionStructuralCmdDiseaseInputV1(
        sample.axis,
        sample.levelId,
      ),
    ));
  return Object.freeze({
    focalLesionOwnerPath: paths[0]!,
    structuralR1RmOwnerPath: paths[1]!,
    vasodilatoryFloorOwnerPath: paths[2]!,
    pathsArePairwiseDistinct,
    everyOneFactorSampleKeepsOtherAxesAtReference,
    passed: pathsArePairwiseDistinct
      && everyOneFactorSampleKeepsOtherAxesAtReference,
  });
}

function freezeHydraulicStateWithTone(
  state: CoronaryAcceptedHydraulicStateV2,
  tone: CoronaryToneStateV2,
): CoronaryAcceptedHydraulicStateV2 {
  return Object.freeze({
    acceptedTimeSec: state.acceptedTimeSec,
    revision: state.revision,
    volumeMlByNode: state.volumeMlByNode,
    toneResistanceScaleByTerritoryLayer: mapLayerRecord(
      (territoryId, layerId) => tone[territoryId][layerId],
    ),
  });
}

function targetLayerTone(tone: CoronaryToneStateV2): Readonly<{
  subepicardial: number;
  subendocardial: number;
}> {
  return Object.freeze({
    subepicardial: tone.LAD.subepicardial,
    subendocardial: tone.LAD.subendocardial,
  });
}

function totalCoronaryVolume(state: CoronaryAcceptedHydraulicStateV2): number {
  return Object.values(state.volumeMlByNode).reduce(
    (sum, value) => sum + value,
    0,
  );
}

function mapLayerRecord<T>(
  map: (
    territoryId: (typeof CORONARY_TERRITORY_IDS_V2)[number],
    layerId: (typeof CORONARY_LAYER_IDS_V2)[number],
  ) => T,
): CoronaryTerritoryLayerRecordV2<T> {
  return Object.freeze(Object.fromEntries(CORONARY_TERRITORY_IDS_V2.map(
    (territoryId) => [territoryId, Object.freeze(Object.fromEntries(
      CORONARY_LAYER_IDS_V2.map((layerId) => [
        layerId,
        map(territoryId, layerId),
      ]),
    ))],
  ))) as CoronaryTerritoryLayerRecordV2<T>;
}

function levelById<T extends Readonly<{
  levelId: CoronaryV3LesionStructuralCmdLevelIdV1;
}>>(
  levels: readonly T[],
  levelId: CoronaryV3LesionStructuralCmdLevelIdV1,
): T {
  const level = levels.find((candidate) => candidate.levelId === levelId);
  if (level === undefined) throw new Error(`unknown protocol level ${levelId}`);
  return level;
}

function blockedGate(gateId: string, reason: string) {
  return Object.freeze({
    gateId,
    status: "blocked" as const,
    value: null,
    reason,
    fabricatedFallbackApplied: false as const,
  });
}

function requireApproximatelyEqual(
  actual: number,
  expected: number,
  label: string,
): void {
  if (!Number.isFinite(actual) || !Number.isFinite(expected)) {
    throw new Error(`${label} must be finite`);
  }
  const tolerance = 1e-9 * Math.max(1, Math.abs(actual), Math.abs(expected));
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(`${label} is inconsistent`);
  }
}

function requireFiniteNumbers(value: unknown, label: string): void {
  const visit = (candidate: unknown, path: string): void => {
    if (typeof candidate === "number") {
      if (!Number.isFinite(candidate)) throw new Error(`${path} is nonfinite`);
      return;
    }
    if (candidate === null || typeof candidate !== "object") return;
    if (Array.isArray(candidate)) {
      candidate.forEach((entry, index) => visit(entry, `${path}[${index}]`));
      return;
    }
    for (const [key, entry] of Object.entries(candidate)) {
      visit(entry, `${path}.${key}`);
    }
  };
  visit(value, label);
}
