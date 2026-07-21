import {
  advanceCoronaryAcceptedAutoregulationV3,
  createCoronaryAcceptedAutoregulationStateV3,
  createCoronaryAutoregulationWindowBindingV3,
  maximumCoronaryAutoregulationStepDurationV3,
  type CoronaryAcceptedAutoregulationCompletionV3,
  type CoronaryAcceptedAutoregulationStateV3,
  type CoronaryAutoregulationWindowControlV3,
} from "@/engine/coronary/acceptedAutoregulationWindowV3";
import { NORMAL_ADULT_CORONARY_AUTOREGULATION_PRIOR_V2 } from "@/engine/coronary/autoregulationV2";
import {
  DEFAULT_CORONARY_BACKWARD_EULER_SOLVER_OPTIONS_V2,
  DEFAULT_CORONARY_PRESSURE_LADDER_INITIALIZER_OPTIONS_V2,
  buildCoronaryCollapseHydraulicsPriorV2,
  initializePressureLadderCoronaryStateV2,
  solveCoronaryBackwardEulerTrialV2,
  type CoronaryAcceptedHydraulicStateV2,
  type CoronaryCollapseHydraulicsPriorV2,
  type CoronaryDiseaseInputV2,
  type CoronaryHydraulicBoundaryInputV2,
} from "@/engine/coronary/backwardEulerCoronaryNetworkV2";
import {
  CORONARY_V3_LESION_STRUCTURAL_CMD_DIRECTIONAL_V1_ID,
  CORONARY_V3_STRUCTURAL_CMD_LEVELS_V1,
  createCoronaryV3LesionStructuralCmdDiseaseInputV1,
  type CoronaryV3LesionStructuralCmdLevelIdV1,
} from "@/engine/coronary/experiments/CoronaryV3LesionStructuralCmdDirectionalCharacterizationV1";
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

export const CORONARY_V3_STRUCTURAL_CMD_ACTIVE_RESERVE_V2_ID =
  "coronary-v3-reduced-network-structural-cmd-active-rest-to-hyperemic-reserve-v2" as const;

export const CORONARY_V3_STRUCTURAL_CMD_ACTIVE_RESERVE_LEVEL_IDS_V2 =
  Object.freeze(["none", "protocol-moderate", "protocol-severe"] as const);

export type CoronaryV3StructuralCmdActiveReserveLevelIdV2 =
  (typeof CORONARY_V3_STRUCTURAL_CMD_ACTIVE_RESERVE_LEVEL_IDS_V2)[number];

export const CORONARY_V3_STRUCTURAL_CMD_ACTIVE_RESERVE_LEVELS_V2 =
  Object.freeze(
    CORONARY_V3_STRUCTURAL_CMD_LEVELS_V1.map((level) =>
      Object.freeze({ ...level }),
    ),
  );

const FIXED_IMP_MM_HG_BY_TERRITORY_LAYER_V2 = mapLayerRecord(() => 10);
const TEN_TIME_CONSTANT_FLOOR_DISTANCE_FRACTION_V2 = Math.exp(-10) * (1 + 1e-8);

/**
 * Prospective policy. These constants are declared before the V2 coarse/fine
 * run and are never relaxed in response to its output.
 */
export const CORONARY_V3_STRUCTURAL_CMD_ACTIVE_RESERVE_POLICY_V2 =
  Object.freeze({
    policyId:
      "coronary-v3-structural-cmd-active-reserve-preregistered-policy-v2" as const,
    targetTerritoryId: "LAD" as const,
    structuralOwner: "LAD-layer-R1-and-Rm-fixed-scale-one-factor-axis" as const,
    coarseDtSec: 0.002 as const,
    fineDtSec: 0.001 as const,
    acceptedWindowDurationSec: 1 as const,
    autoregulationResponseTimeConstantSec:
      NORMAL_ADULT_CORONARY_AUTOREGULATION_PRIOR_V2.responseTimeConstantSec,
    restDemandScale: 1 as const,
    restHyperemia01: 0 as const,
    hyperemicDemandScale: 1 as const,
    hyperemicDrive01: 1 as const,
    initialToneResistanceScale: 1 as const,
    maximumRestWindowCount: 250 as const,
    maximumHyperemicWindowCount: 250 as const,
    maximumPhaseDurationInTimeConstants: 10 as const,
    restMaximumAbsoluteLogToneChangePerWindow: 1e-5 as const,
    restRequiredConsecutiveToneWindows: 3 as const,
    restMaximumRelativeTargetFlowErrorByLadLayer: 0.01 as const,
    hyperemicMaximumNormalizedLogToneDistanceToFloor:
      TEN_TIME_CONSTANT_FLOOR_DISTANCE_FRACTION_V2,
    hyperemicFloorDefinition:
      "normalized-LAD-log-tone-distance-at-or-below-exp(-10)-with-roundoff-margin" as const,
    exactFiniteTimeFloorBoundRequired: false as const,
    exactTerminalRawWindowCountPerPhase: 3 as const,
    fixedAbsoluteAorticPressureMmHg: 100 as const,
    fixedAbsoluteRightAtrialPressureMmHg: 5 as const,
    fixedPerivascularExternalPressureMmHg: 0 as const,
    fixedIntramyocardialPressureMmHgByTerritoryLayer:
      FIXED_IMP_MM_HG_BY_TERRITORY_LAYER_V2,
    maximumAbsoluteInitializerContinuityResidualMlPerSec: 1e-8 as const,
    maximumAbsoluteStepLedgerResidualMl: 1e-8 as const,
    maximumAbsoluteNodeContinuityResidualMl: 1e-8 as const,
    maximumCrossDtRelativeDifference: 0.02 as const,
    maximumCrossDtWindowCountDifference: 1 as const,
    minimumRelativeDifferenceDenominator: 1e-9 as const,
    maximumDirectionalImprovementTerritoryFlowMlPerSec: 1e-8 as const,
    maximumDirectionalImprovementFlowReserveRatio: 1e-6 as const,
    policyDeclaredBeforeCoarseAndFineOutput: true as const,
    outputUsedToChooseProtocolOrTolerance: false as const,
    parameterFittingApplied: false as const,
    biologicalTolerance: false as const,
    patientThresholdsApplied: false as const,
  });

export const CORONARY_V3_STRUCTURAL_CMD_ACTIVE_RESERVE_V1_FAILURE_REFERENCE_V2 =
  Object.freeze({
    sourceCharacterizationId:
      CORONARY_V3_LESION_STRUCTURAL_CMD_DIRECTIONAL_V1_ID,
    sourceArtifactRelativePath:
      "artifacts/coronary-v3/lesion-structural-cmd-directional-v1.json" as const,
    sourceArtifactSha256AtV2ProtocolDeclaration:
      "cb82a8fedcc036b9d0f8f9270445a1145bc3a4189e8b7952d400b3aafefcc165" as const,
    sourceGateJsonPointer:
      "/comparison/structuralFixedToneFlowReserve" as const,
    sourceGateId:
      "structural-R1-Rm-fixed-tone-reserve-does-not-improve" as const,
    sourceGatePassed: false as const,
    sourceCoarseReserveValues: Object.freeze([
      1.5916808149406, 1.7425633893647314, 1.8503712479404402,
    ] as const),
    sourceFineReserveValues: Object.freeze([
      1.5916808149405834, 1.7425633893647432, 1.8503712479404695,
    ] as const),
    retainedFailureInterpretation:
      "with fixed rest tone, increasing structural R1+Rm lowered rest flow proportionally more than fixed-tone hyperemic flow, so the ratio increased" as const,
    v2DoesNotRepairReclassifyOrOverwriteV1: true as const,
  });

export const CORONARY_V3_STRUCTURAL_CMD_ACTIVE_RESERVE_MEASUREMENT_CONTRACT_V2 =
  Object.freeze({
    network: "reduced-coronary-v2-fixed-boundary-component" as const,
    targetTerritoryId: "LAD" as const,
    restDefinition:
      "active-integral-flow-homeostasis-v2-with-demand-one-and-hyperemia-zero" as const,
    hyperemiaDefinition:
      "same-rest-terminal-state-then-active-hyperemia-one-to-ten-time-constant-numerical-floor" as const,
    terminalFlowObservable:
      "last-accepted-one-second-window-mean-signed-Ao-to-LAD-large-arterial-inlet-flow" as const,
    reserveObservable:
      "terminal-hyperemic-window-mean-LAD-inlet-flow-divided-by-terminal-rest-window-mean-LAD-inlet-flow" as const,
    controllerTargetObservable:
      "accepted-window-mean-layer-Qm-divided-by-layer-demand-target" as const,
    finiteTimeHyperemicFloorIsAsymptotic: true as const,
    numericalFloorSaturationIsExactBoundHit: false as const,
    exactPressureWireStationRepresented: false as const,
    exactThermodilutionOrDopplerStationRepresented: false as const,
    FFRClinicalEquivalent: false as const,
    CFRClinicalEquivalent: false as const,
    MRRClinicalEquivalent: false as const,
  });

export const CORONARY_V3_STRUCTURAL_CMD_ACTIVE_RESERVE_LITERATURE_ANCHORS_V2 =
  Object.freeze([
    Object.freeze({
      anchorId: "chilian-dipyridamole-resistance-1989" as const,
      doi: "10.1152/ajpheart.1989.256.2.H383" as const,
      role: "order-prior-for-maximum-dilation-resistance-floor" as const,
      patientStructuralCmdCalibrationApplied: false as const,
    }),
    Object.freeze({
      anchorId: "dankelman-metabolic-adaptation-1989" as const,
      doi: "10.1113/jphysiol.1989.sp017460" as const,
      role: "order-context-for-live-response-time-prior" as const,
      experimentalProtocolReproduced: false as const,
    }),
    Object.freeze({
      anchorId: "bai-coronary-pressure-flow-autoregulation-1994" as const,
      doi: "10.1152/ajpheart.1994.266.6.H2359" as const,
      role: "coronary-pressure-flow-autoregulation-context" as const,
      protocolReproduced: false as const,
    }),
    Object.freeze({
      anchorId: "rahman-cmd-physiological-stratification-2020" as const,
      pmcid: "PMC7242900" as const,
      role: "clinical-endotype-non-equivalence-boundary" as const,
      clinicalEndotypeMappingEstablished: false as const,
    }),
  ]);

export const CORONARY_V3_STRUCTURAL_CMD_ACTIVE_RESERVE_BLOCKED_GATES_V2 =
  Object.freeze([
    blockedGate(
      "exact-FFR-clinical-equivalence",
      "no validated pressure-wire station or clinical protocol",
    ),
    blockedGate(
      "exact-CFR-clinical-equivalence",
      "the reduced LAD inlet-flow ratio is not a validated Doppler, thermodilution, PET, or CMR CFR measurement",
    ),
    blockedGate(
      "exact-MRR-clinical-equivalence",
      "no validated absolute microvascular resistance measurement or correction terms are represented",
    ),
    blockedGate(
      "structural-CMD-clinical-endotype-mapping",
      "R1/Rm protocol multipliers are model mechanisms without patient-level structural CMD validation",
    ),
    blockedGate(
      "patient-threshold-classification",
      "ordinal protocol levels were not calibrated to patient thresholds",
    ),
  ]);

export const CORONARY_V3_STRUCTURAL_CMD_ACTIVE_RESERVE_CLAIM_V2 = Object.freeze(
  {
    purpose:
      "fit-free-reduced-network-active-rest-to-active-hyperemia-structural-R1-Rm-characterization" as const,
    priorFixedToneFailureRetainedAndReferenced: true as const,
    interpolationApplied: false as const,
    smoothingApplied: false as const,
    shapeFittingApplied: false as const,
    parameterFittingApplied: false as const,
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
  },
);

type TargetLayerRecordV2<T> = Readonly<{
  subepicardial: T;
  subendocardial: T;
}>;

export type CoronaryV3StructuralCmdActiveReserveRawWindowV2 = Readonly<{
  phase: "active-rest" | "active-hyperemia";
  phaseWindowIndex: number;
  globalWindowIndex: number;
  startTimeSec: number;
  endTimeSec: number;
  acceptedStepCount: number;
  minimumAcceptedStepDurationSec: number;
  maximumAcceptedStepDurationSec: number;
  meanLadDistalPressureMmHg: number;
  meanLadInletFlowMlPerSec: number;
  meanLadLargeArterialOutflowMlPerSec: number;
  meanTotalCoronaryInletFlowMlPerSec: number;
  meanCoronaryBloodVolumeMl: number;
  meanQmInternalFlowMlPerSecByTargetLayer: TargetLayerRecordV2<number>;
  demandTargetFlowMlPerSecByTargetLayer: TargetLayerRecordV2<number>;
  relativeDemandFlowErrorByTargetLayer: TargetLayerRecordV2<number>;
  startToneResistanceScaleByTargetLayer: TargetLayerRecordV2<number>;
  endToneResistanceScaleByTargetLayer: TargetLayerRecordV2<number>;
  boundedAtByTargetLayer: TargetLayerRecordV2<
    "minimum" | "maximum" | "interior"
  >;
  maximumAbsoluteLogToneChange: number;
  normalizedLogToneDistanceToFloorByTargetLayer: TargetLayerRecordV2<number> | null;
  startCoronaryBloodVolumeMl: number;
  endCoronaryBloodVolumeMl: number;
  signedBoundaryInletVolumeMl: number;
  signedBoundaryOutletVolumeMl: number;
  exactWindowBloodVolumeLedgerResidualMl: number;
  sumOfStepLedgerResidualsMl: number;
  maximumAbsoluteStepLedgerResidualMl: number;
  maximumAbsoluteNodeContinuityResidualMl: number;
  allFinite: true;
  conservationToleranceSatisfied: true;
}>;

export type CoronaryV3StructuralCmdRestConvergenceTraceV2 = Readonly<{
  phaseWindowIndex: number;
  globalWindowIndex: number;
  endTimeSec: number;
  maximumAbsoluteLogToneChange: number;
  toneThresholdSatisfied: boolean;
  consecutiveToneThresholdWindowCount: number;
  maximumRelativeDemandFlowErrorByTargetLayer: number;
  terminalWindowMeanLadInletFlowMlPerSec: number;
}>;

export type CoronaryV3StructuralCmdHyperemicFloorTraceV2 = Readonly<{
  phaseWindowIndex: number;
  globalWindowIndex: number;
  endTimeSec: number;
  maximumNormalizedLogToneDistanceToFloor: number;
  numericalFloorCriterionSatisfied: boolean;
  exactFloorBoundReachedByBothTargetLayers: boolean;
  terminalWindowMeanLadInletFlowMlPerSec: number;
}>;

export type CoronaryV3StructuralCmdActiveRestPhaseV2 = Readonly<{
  controlId: string;
  controlFingerprint: string;
  startingHydraulicStateFingerprint: string;
  startingAutoregulationStateFingerprint: string;
  terminalHydraulicStateFingerprint: string;
  terminalAutoregulationStateFingerprint: string;
  completedWindowCount: number;
  maximumWindowCount: 250;
  stopReason: "tone-change-converged" | "maximum-window-cap-reached";
  convergenceTrace: readonly CoronaryV3StructuralCmdRestConvergenceTraceV2[];
  terminalConsecutiveToneThresholdWindowCount: number;
  toneChangeConvergenceAchieved: boolean;
  targetFlowAchievedByTargetLayer: TargetLayerRecordV2<boolean>;
  restTargetFlowAchieved: boolean;
  terminalWindowMeanLadInletFlowMlPerSec: number;
  terminalToneResistanceScaleByTargetLayer: TargetLayerRecordV2<number>;
  terminalRawAcceptedWindows: readonly CoronaryV3StructuralCmdActiveReserveRawWindowV2[];
  allFiniteAndConserved: boolean;
}>;

export type CoronaryV3StructuralCmdActiveHyperemicPhaseV2 = Readonly<{
  controlId: string;
  controlFingerprint: string;
  startingHydraulicStateFingerprint: string;
  startingAutoregulationStateFingerprint: string;
  terminalHydraulicStateFingerprint: string;
  terminalAutoregulationStateFingerprint: string;
  completedWindowCount: number;
  maximumWindowCount: 250;
  stopReason: "numerical-floor-saturated" | "maximum-window-cap-reached";
  floorTrace: readonly CoronaryV3StructuralCmdHyperemicFloorTraceV2[];
  initialLogToneDistanceToFloorByTargetLayer: TargetLayerRecordV2<number>;
  terminalNormalizedLogToneDistanceToFloorByTargetLayer: TargetLayerRecordV2<number>;
  numericalFloorSaturationAchieved: boolean;
  exactFloorBoundReachedByBothTargetLayers: boolean;
  terminalWindowMeanLadInletFlowMlPerSec: number;
  terminalToneResistanceScaleByTargetLayer: TargetLayerRecordV2<number>;
  terminalRawAcceptedWindows: readonly CoronaryV3StructuralCmdActiveReserveRawWindowV2[];
  allFiniteAndConserved: boolean;
}>;

export type CoronaryV3StructuralCmdActiveReserveSampleV2 = Readonly<{
  sampleId: string;
  role: "coarse" | "fine";
  dtSec: 0.002 | 0.001;
  levelId: CoronaryV3StructuralCmdActiveReserveLevelIdV2;
  structuralR1ResistanceScale: number;
  structuralRmResistanceScale: number;
  diseaseInput: CoronaryDiseaseInputV2;
  diseaseFingerprint: string;
  initialToneResistanceScaleByTerritoryLayer: CoronaryToneStateV2;
  initialToneFingerprint: string;
  initializerMaximumAbsoluteContinuityResidualMlPerSec: number;
  rest: CoronaryV3StructuralCmdActiveRestPhaseV2;
  restToHyperemiaHandoff: Readonly<{
    restTerminalHydraulicStateFingerprint: string;
    hyperemiaStartingHydraulicStateFingerprint: string;
    restTerminalAutoregulationStateFingerprint: string;
    hyperemiaStartingAutoregulationStateFingerprint: string;
    exactSameTerminalStateUsed: boolean;
  }>;
  hyperemia: CoronaryV3StructuralCmdActiveHyperemicPhaseV2;
  terminalFlowReserveRatio: number;
  allFiniteAndConserved: boolean;
  biologicalValidationEstablished: false;
  physiologicalAcceptanceEstablished: false;
}>;

export type CoronaryV3StructuralCmdActiveReserveAtDtV2 = Readonly<{
  role: "coarse" | "fine";
  dtSec: 0.002 | 0.001;
  modelBinding: Readonly<{
    topologyId: string;
    topologyPriorFingerprint: string;
    collapseHydraulicsFingerprint: string;
    solverOptionsFingerprint: string;
    autoregulationPriorFingerprint: string;
  }>;
  samples: readonly CoronaryV3StructuralCmdActiveReserveSampleV2[];
  allFiniteAndConserved: boolean;
  allRestToneConvergenceAchieved: boolean;
  allRestTargetFlowsAchieved: boolean;
  allHyperemicFloorSaturationAchieved: boolean;
  allExactSameStateHandoffs: boolean;
  biologicalValidationEstablished: false;
  physiologicalAcceptanceEstablished: false;
}>;

export type CoronaryV3StructuralCmdActiveReserveRelativeCheckV2 = Readonly<{
  coarseValue: number;
  fineValue: number;
  relativeDifference: number | null;
  denominatorGatePassed: boolean;
  maximumAllowedRelativeDifference: 0.02;
  passed: boolean;
}>;

export type CoronaryV3StructuralCmdActiveReserveCrossDtLevelV2 = Readonly<{
  levelId: CoronaryV3StructuralCmdActiveReserveLevelIdV2;
  restTerminalLadInletFlow: CoronaryV3StructuralCmdActiveReserveRelativeCheckV2;
  hyperemicTerminalLadInletFlow: CoronaryV3StructuralCmdActiveReserveRelativeCheckV2;
  terminalFlowReserveRatio: CoronaryV3StructuralCmdActiveReserveRelativeCheckV2;
  restTerminalToneByTargetLayer: TargetLayerRecordV2<CoronaryV3StructuralCmdActiveReserveRelativeCheckV2>;
  hyperemicTerminalToneByTargetLayer: TargetLayerRecordV2<CoronaryV3StructuralCmdActiveReserveRelativeCheckV2>;
  restWindowCountDifference: number;
  hyperemicWindowCountDifference: number;
  phaseTerminationAgreementPassed: boolean;
  passed: boolean;
}>;

export type CoronaryV3StructuralCmdActiveReserveDirectionalGateV2 = Readonly<{
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

export type CoronaryV3StructuralCmdActiveReserveComparisonV2 = Readonly<{
  crossDtByLevel: Readonly<
    Record<
      CoronaryV3StructuralCmdActiveReserveLevelIdV2,
      CoronaryV3StructuralCmdActiveReserveCrossDtLevelV2
    >
  >;
  restTerminalLadInletFlowByLevel: Readonly<{
    coarse: readonly number[];
    fine: readonly number[];
  }>;
  hyperemicTerminalLadInletFlowByLevel: Readonly<{
    coarse: readonly number[];
    fine: readonly number[];
  }>;
  terminalFlowReserveRatioByLevel: Readonly<{
    coarse: readonly number[];
    fine: readonly number[];
  }>;
  structuralHyperemicFlowDoesNotImprove: CoronaryV3StructuralCmdActiveReserveDirectionalGateV2;
  structuralActiveReserveDoesNotImprove: CoronaryV3StructuralCmdActiveReserveDirectionalGateV2;
  crossDtNumericalQaPassed: boolean;
  restToneConvergenceChecksPassed: boolean;
  restTargetFlowChecksPassed: boolean;
  hyperemicFloorSaturationChecksPassed: boolean;
  exactSameStateHandoffChecksPassed: boolean;
  modelMechanismDirectionalChecksPassed: boolean;
  characterizationChecksPassed: boolean;
}>;

export type CoronaryV3StructuralCmdActiveReserveCharacterizationV2 = Readonly<{
  characterizationId: typeof CORONARY_V3_STRUCTURAL_CMD_ACTIVE_RESERVE_V2_ID;
  policy: typeof CORONARY_V3_STRUCTURAL_CMD_ACTIVE_RESERVE_POLICY_V2;
  priorV1FixedToneFailureReference: typeof CORONARY_V3_STRUCTURAL_CMD_ACTIVE_RESERVE_V1_FAILURE_REFERENCE_V2;
  measurementContract: typeof CORONARY_V3_STRUCTURAL_CMD_ACTIVE_RESERVE_MEASUREMENT_CONTRACT_V2;
  literatureAnchors: typeof CORONARY_V3_STRUCTURAL_CMD_ACTIVE_RESERVE_LITERATURE_ANCHORS_V2;
  blockedGates: typeof CORONARY_V3_STRUCTURAL_CMD_ACTIVE_RESERVE_BLOCKED_GATES_V2;
  claim: typeof CORONARY_V3_STRUCTURAL_CMD_ACTIVE_RESERVE_CLAIM_V2;
  coarse: CoronaryV3StructuralCmdActiveReserveAtDtV2;
  fine: CoronaryV3StructuralCmdActiveReserveAtDtV2;
  comparison: CoronaryV3StructuralCmdActiveReserveComparisonV2;
  numericalQaPassed: boolean;
  modelMechanismDirectionalChecksPassed: boolean;
  characterizationChecksPassed: boolean;
  biologicalValidationEstablished: false;
  physiologicalAcceptanceEstablished: false;
  clinicalValidationEstablished: false;
  releaseAcceptanceEstablished: false;
}>;

type MutableRunStateV2 = {
  hydraulic: CoronaryAcceptedHydraulicStateV2;
  autoregulation: CoronaryAcceptedAutoregulationStateV3;
};

type ExplicitModelV2 = Readonly<{
  prior: CoronaryTopologyPriorV2;
  topology: CoronaryTopologyV2;
  collapseHydraulics: CoronaryCollapseHydraulicsPriorV2;
  binding: ReturnType<typeof createCoronaryAutoregulationWindowBindingV3>;
}>;

/** Runs the prospectively fixed 2 ms arm before the 1 ms arm. */
export function runCoronaryV3StructuralCmdActiveReserveCharacterizationV2(): CoronaryV3StructuralCmdActiveReserveCharacterizationV2 {
  const model = createExplicitModel();
  const coarse = runAtDt("coarse", 0.002, model);
  const fine = runAtDt("fine", 0.001, model);
  const comparison = compareCoronaryV3StructuralCmdActiveReserveNumericsV2(
    coarse,
    fine,
  );
  const numericalQaPassed =
    coarse.allFiniteAndConserved &&
    fine.allFiniteAndConserved &&
    comparison.crossDtNumericalQaPassed &&
    comparison.restToneConvergenceChecksPassed &&
    comparison.hyperemicFloorSaturationChecksPassed;
  return Object.freeze({
    characterizationId: CORONARY_V3_STRUCTURAL_CMD_ACTIVE_RESERVE_V2_ID,
    policy: CORONARY_V3_STRUCTURAL_CMD_ACTIVE_RESERVE_POLICY_V2,
    priorV1FixedToneFailureReference:
      CORONARY_V3_STRUCTURAL_CMD_ACTIVE_RESERVE_V1_FAILURE_REFERENCE_V2,
    measurementContract:
      CORONARY_V3_STRUCTURAL_CMD_ACTIVE_RESERVE_MEASUREMENT_CONTRACT_V2,
    literatureAnchors:
      CORONARY_V3_STRUCTURAL_CMD_ACTIVE_RESERVE_LITERATURE_ANCHORS_V2,
    blockedGates: CORONARY_V3_STRUCTURAL_CMD_ACTIVE_RESERVE_BLOCKED_GATES_V2,
    claim: CORONARY_V3_STRUCTURAL_CMD_ACTIVE_RESERVE_CLAIM_V2,
    coarse,
    fine,
    comparison,
    numericalQaPassed,
    modelMechanismDirectionalChecksPassed:
      comparison.modelMechanismDirectionalChecksPassed,
    characterizationChecksPassed:
      numericalQaPassed &&
      comparison.restTargetFlowChecksPassed &&
      comparison.exactSameStateHandoffChecksPassed &&
      comparison.modelMechanismDirectionalChecksPassed,
    biologicalValidationEstablished: false as const,
    physiologicalAcceptanceEstablished: false as const,
    clinicalValidationEstablished: false as const,
    releaseAcceptanceEstablished: false as const,
  });
}

export function compareCoronaryV3StructuralCmdActiveReserveNumericsV2(
  coarse: CoronaryV3StructuralCmdActiveReserveAtDtV2,
  fine: CoronaryV3StructuralCmdActiveReserveAtDtV2,
): CoronaryV3StructuralCmdActiveReserveComparisonV2 {
  const coarseByLevel = validateAtDtAndIndex(coarse, "coarse", 0.002);
  const fineByLevel = validateAtDtAndIndex(fine, "fine", 0.001);
  const crossDtEntries =
    CORONARY_V3_STRUCTURAL_CMD_ACTIVE_RESERVE_LEVEL_IDS_V2.map((levelId) => {
      const coarseSample = coarseByLevel[levelId];
      const fineSample = fineByLevel[levelId];
      const restTerminalLadInletFlow = relativeCheck(
        coarseSample.rest.terminalWindowMeanLadInletFlowMlPerSec,
        fineSample.rest.terminalWindowMeanLadInletFlowMlPerSec,
      );
      const hyperemicTerminalLadInletFlow = relativeCheck(
        coarseSample.hyperemia.terminalWindowMeanLadInletFlowMlPerSec,
        fineSample.hyperemia.terminalWindowMeanLadInletFlowMlPerSec,
      );
      const terminalFlowReserveRatio = relativeCheck(
        coarseSample.terminalFlowReserveRatio,
        fineSample.terminalFlowReserveRatio,
      );
      const restTerminalToneByTargetLayer = targetLayerRecord((layerId) =>
        relativeCheck(
          coarseSample.rest.terminalToneResistanceScaleByTargetLayer[layerId],
          fineSample.rest.terminalToneResistanceScaleByTargetLayer[layerId],
        ),
      );
      const hyperemicTerminalToneByTargetLayer = targetLayerRecord((layerId) =>
        relativeCheck(
          coarseSample.hyperemia.terminalToneResistanceScaleByTargetLayer[
            layerId
          ],
          fineSample.hyperemia.terminalToneResistanceScaleByTargetLayer[
            layerId
          ],
        ),
      );
      const restWindowCountDifference = Math.abs(
        coarseSample.rest.completedWindowCount -
          fineSample.rest.completedWindowCount,
      );
      const hyperemicWindowCountDifference = Math.abs(
        coarseSample.hyperemia.completedWindowCount -
          fineSample.hyperemia.completedWindowCount,
      );
      const phaseTerminationAgreementPassed =
        coarseSample.rest.stopReason === fineSample.rest.stopReason &&
        coarseSample.hyperemia.stopReason === fineSample.hyperemia.stopReason &&
        restWindowCountDifference <=
          CORONARY_V3_STRUCTURAL_CMD_ACTIVE_RESERVE_POLICY_V2.maximumCrossDtWindowCountDifference &&
        hyperemicWindowCountDifference <=
          CORONARY_V3_STRUCTURAL_CMD_ACTIVE_RESERVE_POLICY_V2.maximumCrossDtWindowCountDifference;
      const passed =
        [
          restTerminalLadInletFlow,
          hyperemicTerminalLadInletFlow,
          terminalFlowReserveRatio,
          ...Object.values(restTerminalToneByTargetLayer),
          ...Object.values(hyperemicTerminalToneByTargetLayer),
        ].every((check) => check.passed) && phaseTerminationAgreementPassed;
      return [
        levelId,
        Object.freeze({
          levelId,
          restTerminalLadInletFlow,
          hyperemicTerminalLadInletFlow,
          terminalFlowReserveRatio,
          restTerminalToneByTargetLayer,
          hyperemicTerminalToneByTargetLayer,
          restWindowCountDifference,
          hyperemicWindowCountDifference,
          phaseTerminationAgreementPassed,
          passed,
        }),
      ] as const;
    });
  const crossDtByLevel = Object.freeze(
    Object.fromEntries(crossDtEntries),
  ) as Readonly<
    Record<
      CoronaryV3StructuralCmdActiveReserveLevelIdV2,
      CoronaryV3StructuralCmdActiveReserveCrossDtLevelV2
    >
  >;
  const restTerminalLadInletFlowByLevel = valuesByLevel(
    coarseByLevel,
    fineByLevel,
    (sample) => sample.rest.terminalWindowMeanLadInletFlowMlPerSec,
  );
  const hyperemicTerminalLadInletFlowByLevel = valuesByLevel(
    coarseByLevel,
    fineByLevel,
    (sample) => sample.hyperemia.terminalWindowMeanLadInletFlowMlPerSec,
  );
  const terminalFlowReserveRatioByLevel = valuesByLevel(
    coarseByLevel,
    fineByLevel,
    (sample) => sample.terminalFlowReserveRatio,
  );
  const structuralHyperemicFlowDoesNotImprove = makeDirectionalGate(
    "structural-R1-Rm-active-hyperemic-terminal-flow-does-not-improve",
    hyperemicTerminalLadInletFlowByLevel.coarse,
    hyperemicTerminalLadInletFlowByLevel.fine,
    CORONARY_V3_STRUCTURAL_CMD_ACTIVE_RESERVE_POLICY_V2.maximumDirectionalImprovementTerritoryFlowMlPerSec,
  );
  const structuralActiveReserveDoesNotImprove = makeDirectionalGate(
    "structural-R1-Rm-active-rest-to-active-hyperemic-reserve-does-not-improve",
    terminalFlowReserveRatioByLevel.coarse,
    terminalFlowReserveRatioByLevel.fine,
    CORONARY_V3_STRUCTURAL_CMD_ACTIVE_RESERVE_POLICY_V2.maximumDirectionalImprovementFlowReserveRatio,
  );
  const allSamples = [
    ...Object.values(coarseByLevel),
    ...Object.values(fineByLevel),
  ];
  const crossDtNumericalQaPassed = Object.values(crossDtByLevel).every(
    ({ passed }) => passed,
  );
  const restToneConvergenceChecksPassed = allSamples.every(
    ({ rest }) => rest.toneChangeConvergenceAchieved,
  );
  const restTargetFlowChecksPassed = allSamples.every(
    ({ rest }) => rest.restTargetFlowAchieved,
  );
  const hyperemicFloorSaturationChecksPassed = allSamples.every(
    ({ hyperemia }) => hyperemia.numericalFloorSaturationAchieved,
  );
  const exactSameStateHandoffChecksPassed = allSamples.every(
    ({ restToHyperemiaHandoff }) =>
      restToHyperemiaHandoff.exactSameTerminalStateUsed,
  );
  const modelMechanismDirectionalChecksPassed =
    structuralHyperemicFlowDoesNotImprove.passed &&
    structuralActiveReserveDoesNotImprove.passed;
  return Object.freeze({
    crossDtByLevel,
    restTerminalLadInletFlowByLevel,
    hyperemicTerminalLadInletFlowByLevel,
    terminalFlowReserveRatioByLevel,
    structuralHyperemicFlowDoesNotImprove,
    structuralActiveReserveDoesNotImprove,
    crossDtNumericalQaPassed,
    restToneConvergenceChecksPassed,
    restTargetFlowChecksPassed,
    hyperemicFloorSaturationChecksPassed,
    exactSameStateHandoffChecksPassed,
    modelMechanismDirectionalChecksPassed,
    characterizationChecksPassed:
      crossDtNumericalQaPassed &&
      restToneConvergenceChecksPassed &&
      restTargetFlowChecksPassed &&
      hyperemicFloorSaturationChecksPassed &&
      exactSameStateHandoffChecksPassed &&
      modelMechanismDirectionalChecksPassed,
  });
}

function createExplicitModel(): ExplicitModelV2 {
  const prior = NORMAL_ADULT_CORONARY_TOPOLOGY_PRIOR_V2;
  const topology = buildCoronaryTopologyV2(prior);
  return Object.freeze({
    prior,
    topology,
    collapseHydraulics: buildCoronaryCollapseHydraulicsPriorV2(topology, 0.1),
    binding: createCoronaryAutoregulationWindowBindingV3({
      originAcceptedTimeSec: 0,
      durationSec:
        CORONARY_V3_STRUCTURAL_CMD_ACTIVE_RESERVE_POLICY_V2.acceptedWindowDurationSec,
      interpretation: "irregular-rhythm-stationary",
    }),
  });
}

function runAtDt(
  role: "coarse" | "fine",
  dtSec: 0.002 | 0.001,
  model: ExplicitModelV2,
): CoronaryV3StructuralCmdActiveReserveAtDtV2 {
  const samples = Object.freeze(
    CORONARY_V3_STRUCTURAL_CMD_ACTIVE_RESERVE_LEVEL_IDS_V2.map((levelId) =>
      runSample(role, dtSec, levelId, model),
    ),
  );
  return Object.freeze({
    role,
    dtSec,
    modelBinding: modelBinding(model),
    samples,
    allFiniteAndConserved: samples.every(
      ({ allFiniteAndConserved }) => allFiniteAndConserved,
    ),
    allRestToneConvergenceAchieved: samples.every(
      ({ rest }) => rest.toneChangeConvergenceAchieved,
    ),
    allRestTargetFlowsAchieved: samples.every(
      ({ rest }) => rest.restTargetFlowAchieved,
    ),
    allHyperemicFloorSaturationAchieved: samples.every(
      ({ hyperemia }) => hyperemia.numericalFloorSaturationAchieved,
    ),
    allExactSameStateHandoffs: samples.every(
      ({ restToHyperemiaHandoff }) =>
        restToHyperemiaHandoff.exactSameTerminalStateUsed,
    ),
    biologicalValidationEstablished: false as const,
    physiologicalAcceptanceEstablished: false as const,
  });
}

function runSample(
  role: "coarse" | "fine",
  dtSec: 0.002 | 0.001,
  levelId: CoronaryV3StructuralCmdActiveReserveLevelIdV2,
  model: ExplicitModelV2,
): CoronaryV3StructuralCmdActiveReserveSampleV2 {
  const level = structuralLevel(levelId);
  const disease = createCoronaryV3LesionStructuralCmdDiseaseInputV1(
    "structural-microvascular-resistance",
    levelId as CoronaryV3LesionStructuralCmdLevelIdV1,
  );
  const initialTone = mapLayerRecord(
    () =>
      CORONARY_V3_STRUCTURAL_CMD_ACTIVE_RESERVE_POLICY_V2.initialToneResistanceScale,
  );
  const initialized = initializePressureLadderCoronaryStateV2(
    {
      boundary: fixedBoundary(),
      disease,
      toneResistanceScaleByTerritoryLayer: initialTone,
      collapseHydraulics: model.collapseHydraulics,
      options: DEFAULT_CORONARY_PRESSURE_LADDER_INITIALIZER_OPTIONS_V2,
    },
    model.prior,
    model.topology,
  );
  requireFiniteNumbers(
    initialized.diagnostics,
    `${levelId} initializer diagnostics`,
  );
  if (
    initialized.diagnostics.maximumAbsoluteNodeContinuityResidualMlPerSec >
    CORONARY_V3_STRUCTURAL_CMD_ACTIVE_RESERVE_POLICY_V2.maximumAbsoluteInitializerContinuityResidualMlPerSec
  ) {
    throw new Error(`${levelId} initializer tolerance exceeded`);
  }
  const state: MutableRunStateV2 = {
    hydraulic: initialized.acceptedState,
    autoregulation: createCoronaryAcceptedAutoregulationStateV3(model.binding, {
      acceptedTimeSec: 0,
      revision: 0,
    }),
  };
  const rest = runRestPhase(state, dtSec, disease, model);
  const restTerminalHydraulicStateFingerprint =
    coronaryConfigurationFingerprintV2(state.hydraulic);
  const restTerminalAutoregulationStateFingerprint =
    coronaryConfigurationFingerprintV2(state.autoregulation);
  const hyperemiaStartingHydraulicStateFingerprint =
    coronaryConfigurationFingerprintV2(state.hydraulic);
  const hyperemiaStartingAutoregulationStateFingerprint =
    coronaryConfigurationFingerprintV2(state.autoregulation);
  const hyperemia = runHyperemicPhase(state, dtSec, disease, model);
  const restToHyperemiaHandoff = Object.freeze({
    restTerminalHydraulicStateFingerprint,
    hyperemiaStartingHydraulicStateFingerprint,
    restTerminalAutoregulationStateFingerprint,
    hyperemiaStartingAutoregulationStateFingerprint,
    exactSameTerminalStateUsed:
      restTerminalHydraulicStateFingerprint ===
        hyperemiaStartingHydraulicStateFingerprint &&
      restTerminalAutoregulationStateFingerprint ===
        hyperemiaStartingAutoregulationStateFingerprint,
  });
  const restFlow = rest.terminalWindowMeanLadInletFlowMlPerSec;
  const hyperemicFlow = hyperemia.terminalWindowMeanLadInletFlowMlPerSec;
  if (
    !(
      restFlow >
      CORONARY_V3_STRUCTURAL_CMD_ACTIVE_RESERVE_POLICY_V2.minimumRelativeDifferenceDenominator
    )
  ) {
    throw new Error(`${levelId} rest flow cannot define reserve`);
  }
  const sample = Object.freeze({
    sampleId: `structural-R1-Rm:${levelId}:active-rest-to-hyperemia`,
    role,
    dtSec,
    levelId,
    structuralR1ResistanceScale: level.structuralR1ResistanceScale,
    structuralRmResistanceScale: level.structuralRmResistanceScale,
    diseaseInput: disease,
    diseaseFingerprint: coronaryConfigurationFingerprintV2(disease),
    initialToneResistanceScaleByTerritoryLayer: initialTone,
    initialToneFingerprint: coronaryConfigurationFingerprintV2(initialTone),
    initializerMaximumAbsoluteContinuityResidualMlPerSec:
      initialized.diagnostics.maximumAbsoluteNodeContinuityResidualMlPerSec,
    rest,
    restToHyperemiaHandoff,
    hyperemia,
    terminalFlowReserveRatio: hyperemicFlow / restFlow,
    allFiniteAndConserved:
      rest.allFiniteAndConserved && hyperemia.allFiniteAndConserved,
    biologicalValidationEstablished: false as const,
    physiologicalAcceptanceEstablished: false as const,
  }) satisfies CoronaryV3StructuralCmdActiveReserveSampleV2;
  requireFiniteNumbers(sample, `${levelId} active-reserve sample`);
  return sample;
}

function runRestPhase(
  state: MutableRunStateV2,
  dtSec: 0.002 | 0.001,
  disease: CoronaryDiseaseInputV2,
  model: ExplicitModelV2,
): CoronaryV3StructuralCmdActiveRestPhaseV2 {
  const policy = CORONARY_V3_STRUCTURAL_CMD_ACTIVE_RESERVE_POLICY_V2;
  const control = phaseControl("active-rest", disease);
  const startingHydraulicStateFingerprint = coronaryConfigurationFingerprintV2(
    state.hydraulic,
  );
  const startingAutoregulationStateFingerprint =
    coronaryConfigurationFingerprintV2(state.autoregulation);
  const trace: CoronaryV3StructuralCmdRestConvergenceTraceV2[] = [];
  const rawTerminalRing: CoronaryV3StructuralCmdActiveReserveRawWindowV2[] = [];
  let consecutive = 0;
  let toneChangeConvergenceAchieved = false;
  for (
    let phaseWindowIndex = 0;
    phaseWindowIndex < policy.maximumRestWindowCount;
    phaseWindowIndex += 1
  ) {
    const globalWindowIndex = state.autoregulation.windowIndex;
    const raw = runAcceptedWindow(
      state,
      "active-rest",
      phaseWindowIndex,
      globalWindowIndex,
      dtSec,
      disease,
      control,
      model,
      null,
    );
    const toneThresholdSatisfied =
      raw.maximumAbsoluteLogToneChange <=
      policy.restMaximumAbsoluteLogToneChangePerWindow;
    consecutive = toneThresholdSatisfied ? consecutive + 1 : 0;
    trace.push(
      Object.freeze({
        phaseWindowIndex,
        globalWindowIndex,
        endTimeSec: raw.endTimeSec,
        maximumAbsoluteLogToneChange: raw.maximumAbsoluteLogToneChange,
        toneThresholdSatisfied,
        consecutiveToneThresholdWindowCount: consecutive,
        maximumRelativeDemandFlowErrorByTargetLayer: Math.max(
          ...Object.values(raw.relativeDemandFlowErrorByTargetLayer),
        ),
        terminalWindowMeanLadInletFlowMlPerSec: raw.meanLadInletFlowMlPerSec,
      }),
    );
    pushTerminalRawWindow(rawTerminalRing, raw);
    if (consecutive >= policy.restRequiredConsecutiveToneWindows) {
      toneChangeConvergenceAchieved = true;
      break;
    }
  }
  const last = rawTerminalRing.at(-1);
  if (last === undefined) throw new Error("active-rest produced no window");
  const targetFlowAchievedByTargetLayer = targetLayerRecord(
    (layerId) =>
      last.relativeDemandFlowErrorByTargetLayer[layerId] <=
      policy.restMaximumRelativeTargetFlowErrorByLadLayer,
  );
  const terminalHydraulicStateFingerprint = coronaryConfigurationFingerprintV2(
    state.hydraulic,
  );
  const terminalAutoregulationStateFingerprint =
    coronaryConfigurationFingerprintV2(state.autoregulation);
  const phase = Object.freeze({
    controlId: control.controlId,
    controlFingerprint: coronaryConfigurationFingerprintV2(control),
    startingHydraulicStateFingerprint,
    startingAutoregulationStateFingerprint,
    terminalHydraulicStateFingerprint,
    terminalAutoregulationStateFingerprint,
    completedWindowCount: trace.length,
    maximumWindowCount: policy.maximumRestWindowCount,
    stopReason: toneChangeConvergenceAchieved
      ? ("tone-change-converged" as const)
      : ("maximum-window-cap-reached" as const),
    convergenceTrace: Object.freeze(trace),
    terminalConsecutiveToneThresholdWindowCount: consecutive,
    toneChangeConvergenceAchieved,
    targetFlowAchievedByTargetLayer,
    restTargetFlowAchieved: Object.values(
      targetFlowAchievedByTargetLayer,
    ).every(Boolean),
    terminalWindowMeanLadInletFlowMlPerSec: last.meanLadInletFlowMlPerSec,
    terminalToneResistanceScaleByTargetLayer: targetLayerTone(
      state.hydraulic.toneResistanceScaleByTerritoryLayer,
    ),
    terminalRawAcceptedWindows: Object.freeze([...rawTerminalRing]),
    allFiniteAndConserved: rawTerminalRing.every(
      ({ allFinite, conservationToleranceSatisfied }) =>
        allFinite && conservationToleranceSatisfied,
    ),
  }) satisfies CoronaryV3StructuralCmdActiveRestPhaseV2;
  requireFiniteNumbers(phase, "active-rest phase");
  return phase;
}

function runHyperemicPhase(
  state: MutableRunStateV2,
  dtSec: 0.002 | 0.001,
  disease: CoronaryDiseaseInputV2,
  model: ExplicitModelV2,
): CoronaryV3StructuralCmdActiveHyperemicPhaseV2 {
  const policy = CORONARY_V3_STRUCTURAL_CMD_ACTIVE_RESERVE_POLICY_V2;
  const control = phaseControl("active-hyperemia", disease);
  const startingHydraulicStateFingerprint = coronaryConfigurationFingerprintV2(
    state.hydraulic,
  );
  const startingAutoregulationStateFingerprint =
    coronaryConfigurationFingerprintV2(state.autoregulation);
  const initialTone = targetLayerTone(
    state.hydraulic.toneResistanceScaleByTerritoryLayer,
  );
  const floor = targetLayerRecord(
    (layerId) =>
      disease.LAD.layers[layerId].vasodilatoryToneMinimumResistanceScale,
  );
  const initialLogToneDistanceToFloorByTargetLayer = targetLayerRecord(
    (layerId) =>
      nonnegativeLogToneDistance(
        initialTone[layerId],
        floor[layerId],
        `initial ${layerId}`,
      ),
  );
  const trace: CoronaryV3StructuralCmdHyperemicFloorTraceV2[] = [];
  const rawTerminalRing: CoronaryV3StructuralCmdActiveReserveRawWindowV2[] = [];
  let numericalFloorSaturationAchieved = false;
  for (
    let phaseWindowIndex = 0;
    phaseWindowIndex < policy.maximumHyperemicWindowCount;
    phaseWindowIndex += 1
  ) {
    const globalWindowIndex = state.autoregulation.windowIndex;
    const raw = runAcceptedWindow(
      state,
      "active-hyperemia",
      phaseWindowIndex,
      globalWindowIndex,
      dtSec,
      disease,
      control,
      model,
      initialLogToneDistanceToFloorByTargetLayer,
    );
    const normalized = raw.normalizedLogToneDistanceToFloorByTargetLayer;
    if (normalized === null) {
      throw new Error("hyperemic window omitted floor distance");
    }
    const maximumNormalizedLogToneDistanceToFloor = Math.max(
      ...Object.values(normalized),
    );
    const numericalFloorCriterionSatisfied =
      maximumNormalizedLogToneDistanceToFloor <=
      policy.hyperemicMaximumNormalizedLogToneDistanceToFloor;
    const exactFloorBoundReachedByBothTargetLayers = Object.values(
      raw.boundedAtByTargetLayer,
    ).every((boundedAt) => boundedAt === "minimum");
    trace.push(
      Object.freeze({
        phaseWindowIndex,
        globalWindowIndex,
        endTimeSec: raw.endTimeSec,
        maximumNormalizedLogToneDistanceToFloor,
        numericalFloorCriterionSatisfied,
        exactFloorBoundReachedByBothTargetLayers,
        terminalWindowMeanLadInletFlowMlPerSec: raw.meanLadInletFlowMlPerSec,
      }),
    );
    pushTerminalRawWindow(rawTerminalRing, raw);
    if (numericalFloorCriterionSatisfied) {
      numericalFloorSaturationAchieved = true;
      break;
    }
  }
  const last = rawTerminalRing.at(-1);
  if (last === undefined)
    throw new Error("active-hyperemia produced no window");
  const terminalNormalizedLogToneDistanceToFloorByTargetLayer =
    last.normalizedLogToneDistanceToFloorByTargetLayer;
  if (terminalNormalizedLogToneDistanceToFloorByTargetLayer === null) {
    throw new Error("terminal hyperemia omitted floor distance");
  }
  const exactFloorBoundReachedByBothTargetLayers = Object.values(
    last.boundedAtByTargetLayer,
  ).every((boundedAt) => boundedAt === "minimum");
  const phase = Object.freeze({
    controlId: control.controlId,
    controlFingerprint: coronaryConfigurationFingerprintV2(control),
    startingHydraulicStateFingerprint,
    startingAutoregulationStateFingerprint,
    terminalHydraulicStateFingerprint: coronaryConfigurationFingerprintV2(
      state.hydraulic,
    ),
    terminalAutoregulationStateFingerprint: coronaryConfigurationFingerprintV2(
      state.autoregulation,
    ),
    completedWindowCount: trace.length,
    maximumWindowCount: policy.maximumHyperemicWindowCount,
    stopReason: numericalFloorSaturationAchieved
      ? ("numerical-floor-saturated" as const)
      : ("maximum-window-cap-reached" as const),
    floorTrace: Object.freeze(trace),
    initialLogToneDistanceToFloorByTargetLayer,
    terminalNormalizedLogToneDistanceToFloorByTargetLayer,
    numericalFloorSaturationAchieved,
    exactFloorBoundReachedByBothTargetLayers,
    terminalWindowMeanLadInletFlowMlPerSec: last.meanLadInletFlowMlPerSec,
    terminalToneResistanceScaleByTargetLayer: targetLayerTone(
      state.hydraulic.toneResistanceScaleByTerritoryLayer,
    ),
    terminalRawAcceptedWindows: Object.freeze([...rawTerminalRing]),
    allFiniteAndConserved: rawTerminalRing.every(
      ({ allFinite, conservationToleranceSatisfied }) =>
        allFinite && conservationToleranceSatisfied,
    ),
  }) satisfies CoronaryV3StructuralCmdActiveHyperemicPhaseV2;
  requireFiniteNumbers(phase, "active-hyperemia phase");
  return phase;
}

function runAcceptedWindow(
  state: MutableRunStateV2,
  phase: "active-rest" | "active-hyperemia",
  phaseWindowIndex: number,
  globalWindowIndex: number,
  nominalDtSec: 0.002 | 0.001,
  disease: CoronaryDiseaseInputV2,
  control: CoronaryAutoregulationWindowControlV3,
  model: ExplicitModelV2,
  initialLogDistanceToFloor: TargetLayerRecordV2<number> | null,
): CoronaryV3StructuralCmdActiveReserveRawWindowV2 {
  const policy = CORONARY_V3_STRUCTURAL_CMD_ACTIVE_RESERVE_POLICY_V2;
  const boundary = fixedBoundary();
  if (state.autoregulation.windowIndex !== globalWindowIndex) {
    throw new Error("active reserve global autoregulation window mismatch");
  }
  const startTimeSec = state.hydraulic.acceptedTimeSec;
  const expectedStart = globalWindowIndex * policy.acceptedWindowDurationSec;
  if (Math.abs(startTimeSec - expectedStart) > 1e-9) {
    throw new Error("active reserve raw window start identity mismatch");
  }
  const endTarget = expectedStart + policy.acceptedWindowDurationSec;
  const startVolume = totalCoronaryVolume(state.hydraulic);
  const startTone = targetLayerTone(
    state.hydraulic.toneResistanceScaleByTerritoryLayer,
  );
  let acceptedStepCount = 0;
  let minimumAcceptedStepDurationSec = Number.POSITIVE_INFINITY;
  let maximumAcceptedStepDurationSec = 0;
  let ladDistalPressureIntegral = 0;
  let ladInletFlowIntegral = 0;
  let ladOutflowIntegral = 0;
  let totalInletFlowIntegral = 0;
  let bloodVolumeIntegral = 0;
  let signedBoundaryInletVolumeMl = 0;
  let signedBoundaryOutletVolumeMl = 0;
  let sumOfStepLedgerResidualsMl = 0;
  let maximumAbsoluteStepLedgerResidualMl = 0;
  let maximumAbsoluteNodeContinuityResidualMl = 0;
  let completion: CoronaryAcceptedAutoregulationCompletionV3 | null = null;
  const expectedAcceptedStepCount = Math.round(
    policy.acceptedWindowDurationSec / nominalDtSec,
  );
  while (acceptedStepCount < expectedAcceptedStepCount) {
    const remaining = endTarget - state.hydraulic.acceptedTimeSec;
    const autoregulationMaximum = maximumCoronaryAutoregulationStepDurationV3(
      model.binding,
      state.autoregulation,
      state.hydraulic.acceptedTimeSec,
    );
    const finalScheduledStep =
      acceptedStepCount === expectedAcceptedStepCount - 1;
    const stepDtSec = finalScheduledStep
      ? Math.min(remaining, autoregulationMaximum)
      : Math.min(nominalDtSec, remaining, autoregulationMaximum);
    if (!(stepDtSec > 0)) {
      throw new Error("active reserve raw window has no positive step");
    }
    const previousHydraulic = state.hydraulic;
    const trial = solveCoronaryBackwardEulerTrialV2(
      previousHydraulic,
      {
        dtSec: stepDtSec,
        boundary,
        disease,
        collapseHydraulics: model.collapseHydraulics,
        solverOptions: DEFAULT_CORONARY_BACKWARD_EULER_SOLVER_OPTIONS_V2,
      },
      model.prior,
      model.topology,
    );
    validateStepDiagnostics(
      trial.diagnostics,
      phase,
      phaseWindowIndex,
      acceptedStepCount,
    );
    const hydraulics = trial.diagnostics.hydraulics;
    const advanced = advanceCoronaryAcceptedAutoregulationV3(
      model.binding,
      state.autoregulation,
      previousHydraulic.toneResistanceScaleByTerritoryLayer,
      {
        previousAcceptedTimeSec: previousHydraulic.acceptedTimeSec,
        candidateAcceptedTimeSec: trial.candidateAcceptedState.acceptedTimeSec,
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
    state.hydraulic = freezeHydraulicStateWithTone(
      trial.candidateAcceptedState,
      advanced.nextToneResistanceScaleByTerritoryLayer,
    );
    if (advanced.completedWindow !== null) {
      if (completion !== null) {
        throw new Error("active reserve window completed more than once");
      }
      completion = advanced.completedWindow;
    }
    acceptedStepCount += 1;
    minimumAcceptedStepDurationSec = Math.min(
      minimumAcceptedStepDurationSec,
      stepDtSec,
    );
    maximumAcceptedStepDurationSec = Math.max(
      maximumAcceptedStepDurationSec,
      stepDtSec,
    );
    ladDistalPressureIntegral +=
      stepDtSec * hydraulics.postFocalLesionAbsolutePressureMmHgByTerritory.LAD;
    ladInletFlowIntegral +=
      stepDtSec * hydraulics.inletFlowMlPerSecByTerritory.LAD;
    ladOutflowIntegral +=
      stepDtSec * hydraulics.largeArterialOutflowMlPerSecByTerritory.LAD;
    totalInletFlowIntegral += stepDtSec * hydraulics.totalInletFlowMlPerSec;
    bloodVolumeIntegral +=
      stepDtSec * trial.diagnostics.candidateCoronaryBloodVolumeMl;
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
  if (completion === null) {
    throw new Error("active reserve window did not complete autoregulation");
  }
  const endTimeSec = state.hydraulic.acceptedTimeSec;
  const durationSec = endTimeSec - startTimeSec;
  if (Math.abs(durationSec - policy.acceptedWindowDurationSec) > 1e-9) {
    throw new Error("active reserve raw window duration mismatch");
  }
  const endVolume = totalCoronaryVolume(state.hydraulic);
  const exactWindowBloodVolumeLedgerResidualMl =
    endVolume -
    startVolume -
    (signedBoundaryInletVolumeMl - signedBoundaryOutletVolumeMl);
  if (
    Math.abs(exactWindowBloodVolumeLedgerResidualMl) >
    policy.maximumAbsoluteStepLedgerResidualMl * acceptedStepCount
  ) {
    throw new Error("active reserve window ledger tolerance exceeded");
  }
  const meanQmInternalFlowMlPerSecByTargetLayer = targetLayerRecord(
    (layerId) =>
      completion!.toneStep.layerStepByTerritoryLayer.LAD[layerId]
        .achievedMeanTissueFlowMlPerSec,
  );
  const demandTargetFlowMlPerSecByTargetLayer = targetLayerRecord(
    (layerId) =>
      completion!.toneStep.layerStepByTerritoryLayer.LAD[layerId]
        .demandTargetFlowMlPerSec,
  );
  const relativeDemandFlowErrorByTargetLayer = targetLayerRecord(
    (layerId) =>
      Math.abs(
        meanQmInternalFlowMlPerSecByTargetLayer[layerId] -
          demandTargetFlowMlPerSecByTargetLayer[layerId],
      ) / demandTargetFlowMlPerSecByTargetLayer[layerId],
  );
  const endTone = targetLayerTone(
    state.hydraulic.toneResistanceScaleByTerritoryLayer,
  );
  const normalizedLogToneDistanceToFloorByTargetLayer =
    initialLogDistanceToFloor === null
      ? null
      : targetLayerRecord((layerId) => {
          const floor =
            disease.LAD.layers[layerId].vasodilatoryToneMinimumResistanceScale;
          const distance = nonnegativeLogToneDistance(
            endTone[layerId],
            floor,
            `terminal ${layerId}`,
          );
          const initialDistance = initialLogDistanceToFloor[layerId];
          return initialDistance <= 1e-15 ? 0 : distance / initialDistance;
        });
  const raw = Object.freeze({
    phase,
    phaseWindowIndex,
    globalWindowIndex,
    startTimeSec,
    endTimeSec,
    acceptedStepCount,
    minimumAcceptedStepDurationSec,
    maximumAcceptedStepDurationSec,
    meanLadDistalPressureMmHg: ladDistalPressureIntegral / durationSec,
    meanLadInletFlowMlPerSec: ladInletFlowIntegral / durationSec,
    meanLadLargeArterialOutflowMlPerSec: ladOutflowIntegral / durationSec,
    meanTotalCoronaryInletFlowMlPerSec: totalInletFlowIntegral / durationSec,
    meanCoronaryBloodVolumeMl: bloodVolumeIntegral / durationSec,
    meanQmInternalFlowMlPerSecByTargetLayer,
    demandTargetFlowMlPerSecByTargetLayer,
    relativeDemandFlowErrorByTargetLayer,
    startToneResistanceScaleByTargetLayer: startTone,
    endToneResistanceScaleByTargetLayer: endTone,
    boundedAtByTargetLayer: targetLayerRecord(
      (layerId) =>
        completion!.toneStep.layerStepByTerritoryLayer.LAD[layerId].boundedAt,
    ),
    maximumAbsoluteLogToneChange:
      completion.toneStep.maximumAbsoluteLogToneChange,
    normalizedLogToneDistanceToFloorByTargetLayer,
    startCoronaryBloodVolumeMl: startVolume,
    endCoronaryBloodVolumeMl: endVolume,
    signedBoundaryInletVolumeMl,
    signedBoundaryOutletVolumeMl,
    exactWindowBloodVolumeLedgerResidualMl,
    sumOfStepLedgerResidualsMl,
    maximumAbsoluteStepLedgerResidualMl,
    maximumAbsoluteNodeContinuityResidualMl,
    allFinite: true as const,
    conservationToleranceSatisfied: true as const,
  }) satisfies CoronaryV3StructuralCmdActiveReserveRawWindowV2;
  requireFiniteNumbers(raw, `${phase} raw window ${phaseWindowIndex}`);
  return raw;
}

function validateAtDtAndIndex(
  candidate: CoronaryV3StructuralCmdActiveReserveAtDtV2,
  expectedRole: "coarse" | "fine",
  expectedDtSec: 0.002 | 0.001,
): Readonly<
  Record<
    CoronaryV3StructuralCmdActiveReserveLevelIdV2,
    CoronaryV3StructuralCmdActiveReserveSampleV2
  >
> {
  if (candidate.role !== expectedRole || candidate.dtSec !== expectedDtSec) {
    throw new Error(`${expectedRole} role/dt binding is invalid`);
  }
  if (
    !candidate.allFiniteAndConserved ||
    candidate.biologicalValidationEstablished !== false ||
    candidate.physiologicalAcceptanceEstablished !== false
  ) {
    throw new Error(`${expectedRole} aggregate integrity/claim is invalid`);
  }
  validateModelBinding(candidate.modelBinding, expectedRole);
  if (
    candidate.samples.length !==
    CORONARY_V3_STRUCTURAL_CMD_ACTIVE_RESERVE_LEVEL_IDS_V2.length
  ) {
    throw new Error(`${expectedRole} must contain every structural level`);
  }
  const byLevel = {} as Record<
    CoronaryV3StructuralCmdActiveReserveLevelIdV2,
    CoronaryV3StructuralCmdActiveReserveSampleV2
  >;
  for (const sample of candidate.samples) {
    if (
      !CORONARY_V3_STRUCTURAL_CMD_ACTIVE_RESERVE_LEVEL_IDS_V2.includes(
        sample.levelId,
      )
    )
      throw new Error(`${expectedRole} contains an unknown structural level`);
    if (byLevel[sample.levelId] !== undefined) {
      throw new Error(`${expectedRole} duplicate level ${sample.levelId}`);
    }
    byLevel[sample.levelId] = sample;
  }
  for (const levelId of CORONARY_V3_STRUCTURAL_CMD_ACTIVE_RESERVE_LEVEL_IDS_V2) {
    const sample = byLevel[levelId];
    if (sample === undefined) {
      throw new Error(`${expectedRole} missing structural level ${levelId}`);
    }
    validateSample(sample, expectedRole, expectedDtSec, levelId);
  }
  const aggregateChecks = {
    allRestToneConvergenceAchieved: candidate.samples.every(
      ({ rest }) => rest.toneChangeConvergenceAchieved,
    ),
    allRestTargetFlowsAchieved: candidate.samples.every(
      ({ rest }) => rest.restTargetFlowAchieved,
    ),
    allHyperemicFloorSaturationAchieved: candidate.samples.every(
      ({ hyperemia }) => hyperemia.numericalFloorSaturationAchieved,
    ),
    allExactSameStateHandoffs: candidate.samples.every(
      ({ restToHyperemiaHandoff }) =>
        restToHyperemiaHandoff.exactSameTerminalStateUsed,
    ),
  } as const;
  for (const key of Object.keys(
    aggregateChecks,
  ) as (keyof typeof aggregateChecks)[]) {
    if (candidate[key] !== aggregateChecks[key]) {
      throw new Error(`${expectedRole} aggregate ${key} is inconsistent`);
    }
  }
  return Object.freeze(byLevel);
}

function validateSample(
  sample: CoronaryV3StructuralCmdActiveReserveSampleV2,
  expectedRole: "coarse" | "fine",
  expectedDtSec: 0.002 | 0.001,
  expectedLevelId: CoronaryV3StructuralCmdActiveReserveLevelIdV2,
): void {
  const expectedLevel = structuralLevel(expectedLevelId);
  const expectedSampleId = `structural-R1-Rm:${expectedLevelId}:active-rest-to-hyperemia`;
  if (
    sample.sampleId !== expectedSampleId ||
    sample.role !== expectedRole ||
    sample.dtSec !== expectedDtSec ||
    sample.levelId !== expectedLevelId ||
    sample.structuralR1ResistanceScale !==
      expectedLevel.structuralR1ResistanceScale ||
    sample.structuralRmResistanceScale !==
      expectedLevel.structuralRmResistanceScale
  ) {
    throw new Error(`${expectedLevelId} sample identity mismatch`);
  }
  if (
    !sample.allFiniteAndConserved ||
    sample.biologicalValidationEstablished !== false ||
    sample.physiologicalAcceptanceEstablished !== false
  ) {
    throw new Error(`${expectedLevelId} sample integrity/claim mismatch`);
  }
  requireFiniteNumbers(sample, `${expectedLevelId} sample`);
  const expectedDisease = createCoronaryV3LesionStructuralCmdDiseaseInputV1(
    "structural-microvascular-resistance",
    expectedLevelId as CoronaryV3LesionStructuralCmdLevelIdV1,
  );
  const expectedTone = mapLayerRecord(
    () =>
      CORONARY_V3_STRUCTURAL_CMD_ACTIVE_RESERVE_POLICY_V2.initialToneResistanceScale,
  );
  if (
    sample.diseaseFingerprint !==
      coronaryConfigurationFingerprintV2(sample.diseaseInput) ||
    sample.diseaseFingerprint !==
      coronaryConfigurationFingerprintV2(expectedDisease)
  ) {
    throw new Error(`${expectedLevelId} disease owner projection mismatch`);
  }
  if (
    sample.initialToneFingerprint !==
      coronaryConfigurationFingerprintV2(
        sample.initialToneResistanceScaleByTerritoryLayer,
      ) ||
    sample.initialToneFingerprint !==
      coronaryConfigurationFingerprintV2(expectedTone)
  ) {
    throw new Error(`${expectedLevelId} initial tone projection mismatch`);
  }
  if (
    sample.initializerMaximumAbsoluteContinuityResidualMlPerSec >
    CORONARY_V3_STRUCTURAL_CMD_ACTIVE_RESERVE_POLICY_V2.maximumAbsoluteInitializerContinuityResidualMlPerSec
  ) {
    throw new Error(`${expectedLevelId} initializer tolerance exceeded`);
  }
  validateRestPhase(sample.rest, expectedDtSec, expectedLevelId);
  validateHyperemicPhase(sample.hyperemia, expectedDtSec, expectedLevelId);
  const handoff = sample.restToHyperemiaHandoff;
  const sameState =
    handoff.restTerminalHydraulicStateFingerprint ===
      sample.rest.terminalHydraulicStateFingerprint &&
    handoff.hyperemiaStartingHydraulicStateFingerprint ===
      sample.hyperemia.startingHydraulicStateFingerprint &&
    handoff.restTerminalAutoregulationStateFingerprint ===
      sample.rest.terminalAutoregulationStateFingerprint &&
    handoff.hyperemiaStartingAutoregulationStateFingerprint ===
      sample.hyperemia.startingAutoregulationStateFingerprint &&
    handoff.restTerminalHydraulicStateFingerprint ===
      handoff.hyperemiaStartingHydraulicStateFingerprint &&
    handoff.restTerminalAutoregulationStateFingerprint ===
      handoff.hyperemiaStartingAutoregulationStateFingerprint;
  if (handoff.exactSameTerminalStateUsed !== sameState) {
    throw new Error(`${expectedLevelId} exact state handoff is inconsistent`);
  }
  const expectedReserve =
    sample.hyperemia.terminalWindowMeanLadInletFlowMlPerSec /
    sample.rest.terminalWindowMeanLadInletFlowMlPerSec;
  requireApproximatelyEqual(
    sample.terminalFlowReserveRatio,
    expectedReserve,
    `${expectedLevelId} reserve ratio`,
  );
}

function validateRestPhase(
  rest: CoronaryV3StructuralCmdActiveRestPhaseV2,
  expectedDtSec: 0.002 | 0.001,
  label: string,
): void {
  const policy = CORONARY_V3_STRUCTURAL_CMD_ACTIVE_RESERVE_POLICY_V2;
  if (
    rest.maximumWindowCount !== policy.maximumRestWindowCount ||
    rest.completedWindowCount !== rest.convergenceTrace.length ||
    rest.completedWindowCount <= 0 ||
    rest.completedWindowCount > rest.maximumWindowCount
  ) {
    throw new Error(`${label} rest window horizon mismatch`);
  }
  const lastTrace = rest.convergenceTrace.at(-1)!;
  const expectedConverged =
    lastTrace.consecutiveToneThresholdWindowCount >=
    policy.restRequiredConsecutiveToneWindows;
  if (
    rest.toneChangeConvergenceAchieved !== expectedConverged ||
    rest.stopReason !==
      (expectedConverged
        ? "tone-change-converged"
        : "maximum-window-cap-reached") ||
    (!expectedConverged &&
      rest.completedWindowCount !== rest.maximumWindowCount) ||
    rest.terminalConsecutiveToneThresholdWindowCount !==
      lastTrace.consecutiveToneThresholdWindowCount
  ) {
    throw new Error(`${label} rest convergence classification mismatch`);
  }
  let consecutive = 0;
  for (let index = 0; index < rest.convergenceTrace.length; index += 1) {
    const trace = rest.convergenceTrace[index]!;
    const thresholdSatisfied =
      trace.maximumAbsoluteLogToneChange <=
      policy.restMaximumAbsoluteLogToneChangePerWindow;
    consecutive = thresholdSatisfied ? consecutive + 1 : 0;
    if (
      trace.phaseWindowIndex !== index ||
      trace.toneThresholdSatisfied !== thresholdSatisfied ||
      trace.consecutiveToneThresholdWindowCount !== consecutive
    ) {
      throw new Error(`${label} rest convergence trace mismatch`);
    }
  }
  const expectedTarget = targetLayerRecord((layerId) => {
    const lastRaw = rest.terminalRawAcceptedWindows.at(-1)!;
    return (
      lastRaw.relativeDemandFlowErrorByTargetLayer[layerId] <=
      policy.restMaximumRelativeTargetFlowErrorByLadLayer
    );
  });
  for (const layerId of CORONARY_LAYER_IDS_V2) {
    if (
      rest.targetFlowAchievedByTargetLayer[layerId] !== expectedTarget[layerId]
    ) {
      throw new Error(`${label} rest target flow classification mismatch`);
    }
  }
  if (
    rest.restTargetFlowAchieved !== Object.values(expectedTarget).every(Boolean)
  ) {
    throw new Error(`${label} rest target aggregate mismatch`);
  }
  validateTerminalRawWindows(
    rest.terminalRawAcceptedWindows,
    "active-rest",
    rest.completedWindowCount,
    expectedDtSec,
    label,
  );
  const last = rest.terminalRawAcceptedWindows.at(-1)!;
  requireApproximatelyEqual(
    rest.terminalWindowMeanLadInletFlowMlPerSec,
    last.meanLadInletFlowMlPerSec,
    `${label} rest terminal flow`,
  );
  for (const layerId of CORONARY_LAYER_IDS_V2) {
    requireApproximatelyEqual(
      rest.terminalToneResistanceScaleByTargetLayer[layerId],
      last.endToneResistanceScaleByTargetLayer[layerId],
      `${label} rest terminal ${layerId} tone`,
    );
  }
}

function validateHyperemicPhase(
  hyperemia: CoronaryV3StructuralCmdActiveHyperemicPhaseV2,
  expectedDtSec: 0.002 | 0.001,
  label: string,
): void {
  const policy = CORONARY_V3_STRUCTURAL_CMD_ACTIVE_RESERVE_POLICY_V2;
  if (
    hyperemia.maximumWindowCount !== policy.maximumHyperemicWindowCount ||
    hyperemia.completedWindowCount !== hyperemia.floorTrace.length ||
    hyperemia.completedWindowCount <= 0 ||
    hyperemia.completedWindowCount > hyperemia.maximumWindowCount
  ) {
    throw new Error(`${label} hyperemia window horizon mismatch`);
  }
  const lastTrace = hyperemia.floorTrace.at(-1)!;
  const expectedSaturated =
    lastTrace.maximumNormalizedLogToneDistanceToFloor <=
    policy.hyperemicMaximumNormalizedLogToneDistanceToFloor;
  if (
    hyperemia.numericalFloorSaturationAchieved !== expectedSaturated ||
    hyperemia.stopReason !==
      (expectedSaturated
        ? "numerical-floor-saturated"
        : "maximum-window-cap-reached") ||
    (!expectedSaturated &&
      hyperemia.completedWindowCount !== hyperemia.maximumWindowCount)
  ) {
    throw new Error(`${label} hyperemia floor classification mismatch`);
  }
  for (let index = 0; index < hyperemia.floorTrace.length; index += 1) {
    const trace = hyperemia.floorTrace[index]!;
    const criterion =
      trace.maximumNormalizedLogToneDistanceToFloor <=
      policy.hyperemicMaximumNormalizedLogToneDistanceToFloor;
    if (
      trace.phaseWindowIndex !== index ||
      trace.numericalFloorCriterionSatisfied !== criterion
    ) {
      throw new Error(`${label} hyperemia floor trace mismatch`);
    }
  }
  validateTerminalRawWindows(
    hyperemia.terminalRawAcceptedWindows,
    "active-hyperemia",
    hyperemia.completedWindowCount,
    expectedDtSec,
    label,
  );
  const last = hyperemia.terminalRawAcceptedWindows.at(-1)!;
  if (last.normalizedLogToneDistanceToFloorByTargetLayer === null) {
    throw new Error(`${label} hyperemia raw floor distance is absent`);
  }
  requireApproximatelyEqual(
    hyperemia.terminalWindowMeanLadInletFlowMlPerSec,
    last.meanLadInletFlowMlPerSec,
    `${label} hyperemic terminal flow`,
  );
  for (const layerId of CORONARY_LAYER_IDS_V2) {
    requireApproximatelyEqual(
      hyperemia.terminalToneResistanceScaleByTargetLayer[layerId],
      last.endToneResistanceScaleByTargetLayer[layerId],
      `${label} hyperemic terminal ${layerId} tone`,
    );
    requireApproximatelyEqual(
      hyperemia.terminalNormalizedLogToneDistanceToFloorByTargetLayer[layerId],
      last.normalizedLogToneDistanceToFloorByTargetLayer[layerId],
      `${label} hyperemic terminal ${layerId} floor distance`,
    );
  }
  const exactFloor = Object.values(last.boundedAtByTargetLayer).every(
    (boundedAt) => boundedAt === "minimum",
  );
  if (hyperemia.exactFloorBoundReachedByBothTargetLayers !== exactFloor) {
    throw new Error(`${label} exact floor-bound classification mismatch`);
  }
}

function validateTerminalRawWindows(
  windows: readonly CoronaryV3StructuralCmdActiveReserveRawWindowV2[],
  expectedPhase: "active-rest" | "active-hyperemia",
  phaseWindowCount: number,
  expectedDtSec: 0.002 | 0.001,
  label: string,
): void {
  const policy = CORONARY_V3_STRUCTURAL_CMD_ACTIVE_RESERVE_POLICY_V2;
  if (windows.length !== policy.exactTerminalRawWindowCountPerPhase) {
    throw new Error(`${label} ${expectedPhase} terminal raw count mismatch`);
  }
  const expectedFirstPhaseIndex = phaseWindowCount - windows.length;
  for (let index = 0; index < windows.length; index += 1) {
    const window = windows[index]!;
    const acceptedClockRoundoffToleranceSec =
      64 *
      Number.EPSILON *
      Math.max(1, Math.abs(window.startTimeSec), Math.abs(window.endTimeSec)) *
      window.acceptedStepCount;
    if (
      window.phase !== expectedPhase ||
      window.phaseWindowIndex !== expectedFirstPhaseIndex + index ||
      !window.allFinite ||
      !window.conservationToleranceSatisfied ||
      !Number.isSafeInteger(window.acceptedStepCount) ||
      window.acceptedStepCount <= 0 ||
      !(window.minimumAcceptedStepDurationSec > 0) ||
      window.maximumAcceptedStepDurationSec >
        expectedDtSec + acceptedClockRoundoffToleranceSec ||
      Math.abs(
        window.endTimeSec -
          window.startTimeSec -
          policy.acceptedWindowDurationSec,
      ) > 1e-9
    ) {
      throw new Error(`${label} ${expectedPhase} raw window identity mismatch`);
    }
    if (
      Math.abs(window.maximumAbsoluteStepLedgerResidualMl) >
        policy.maximumAbsoluteStepLedgerResidualMl ||
      Math.abs(window.maximumAbsoluteNodeContinuityResidualMl) >
        policy.maximumAbsoluteNodeContinuityResidualMl ||
      Math.abs(window.exactWindowBloodVolumeLedgerResidualMl) >
        policy.maximumAbsoluteStepLedgerResidualMl * window.acceptedStepCount
    ) {
      throw new Error(`${label} ${expectedPhase} raw conservation mismatch`);
    }
    if (
      (window.normalizedLogToneDistanceToFloorByTargetLayer === null) !==
      (expectedPhase === "active-rest")
    ) {
      throw new Error(`${label} ${expectedPhase} raw floor identity mismatch`);
    }
  }
}

function validateModelBinding(
  binding: CoronaryV3StructuralCmdActiveReserveAtDtV2["modelBinding"],
  label: string,
): void {
  const expected = modelBinding(createExplicitModel());
  for (const key of Object.keys(expected) as (keyof typeof expected)[]) {
    if (binding[key] !== expected[key]) {
      throw new Error(`${label} model binding ${key} is invalid`);
    }
  }
}

function relativeCheck(
  coarseValue: number,
  fineValue: number,
): CoronaryV3StructuralCmdActiveReserveRelativeCheckV2 {
  if (!Number.isFinite(coarseValue) || !Number.isFinite(fineValue)) {
    throw new Error("cross-dt values must be finite");
  }
  const policy = CORONARY_V3_STRUCTURAL_CMD_ACTIVE_RESERVE_POLICY_V2;
  const denominatorGatePassed =
    Math.abs(fineValue) > policy.minimumRelativeDifferenceDenominator;
  const relativeDifference = denominatorGatePassed
    ? Math.abs(coarseValue - fineValue) / Math.abs(fineValue)
    : null;
  return Object.freeze({
    coarseValue,
    fineValue,
    relativeDifference,
    denominatorGatePassed,
    maximumAllowedRelativeDifference: policy.maximumCrossDtRelativeDifference,
    passed:
      relativeDifference !== null &&
      relativeDifference <= policy.maximumCrossDtRelativeDifference,
  });
}

function valuesByLevel(
  coarse: Readonly<
    Record<
      CoronaryV3StructuralCmdActiveReserveLevelIdV2,
      CoronaryV3StructuralCmdActiveReserveSampleV2
    >
  >,
  fine: Readonly<
    Record<
      CoronaryV3StructuralCmdActiveReserveLevelIdV2,
      CoronaryV3StructuralCmdActiveReserveSampleV2
    >
  >,
  read: (sample: CoronaryV3StructuralCmdActiveReserveSampleV2) => number,
): Readonly<{ coarse: readonly number[]; fine: readonly number[] }> {
  return Object.freeze({
    coarse: Object.freeze(
      CORONARY_V3_STRUCTURAL_CMD_ACTIVE_RESERVE_LEVEL_IDS_V2.map((levelId) =>
        read(coarse[levelId]),
      ),
    ),
    fine: Object.freeze(
      CORONARY_V3_STRUCTURAL_CMD_ACTIVE_RESERVE_LEVEL_IDS_V2.map((levelId) =>
        read(fine[levelId]),
      ),
    ),
  });
}

function makeDirectionalGate(
  gateId: string,
  coarseValues: readonly number[],
  fineValues: readonly number[],
  tolerance: number,
): CoronaryV3StructuralCmdActiveReserveDirectionalGateV2 {
  if (
    coarseValues.length !== 3 ||
    fineValues.length !== 3 ||
    [...coarseValues, ...fineValues].some((value) => !Number.isFinite(value))
  ) {
    throw new Error(`${gateId} requires three finite ordered values per dt`);
  }
  const adjacent = (values: readonly number[]) =>
    Object.freeze([values[1]! - values[0]!, values[2]! - values[1]!]);
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

function phaseControl(
  phase: "active-rest" | "active-hyperemia",
  disease: CoronaryDiseaseInputV2,
): CoronaryAutoregulationWindowControlV3 {
  const policy = CORONARY_V3_STRUCTURAL_CMD_ACTIVE_RESERVE_POLICY_V2;
  return Object.freeze({
    controlId:
      phase === "active-rest"
        ? "coronary-v3-structural-cmd-active-rest-v2"
        : "coronary-v3-structural-cmd-active-hyperemia-v2",
    demandScaleByTerritoryLayer: mapLayerRecord(() =>
      phase === "active-rest"
        ? policy.restDemandScale
        : policy.hyperemicDemandScale,
    ),
    hyperemia01ByTerritoryLayer: mapLayerRecord(() =>
      phase === "active-rest"
        ? policy.restHyperemia01
        : policy.hyperemicDrive01,
    ),
    effectiveMinimumToneScaleByTerritoryLayer: mapLayerRecord(
      (territoryId, layerId) =>
        disease[territoryId].layers[layerId]
          .vasodilatoryToneMinimumResistanceScale,
    ),
  });
}

function fixedBoundary(): CoronaryHydraulicBoundaryInputV2 {
  const policy = CORONARY_V3_STRUCTURAL_CMD_ACTIVE_RESERVE_POLICY_V2;
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

function modelBinding(
  model: ExplicitModelV2,
): CoronaryV3StructuralCmdActiveReserveAtDtV2["modelBinding"] {
  return Object.freeze({
    topologyId: model.prior.topologyId,
    topologyPriorFingerprint: coronaryTopologyPriorFingerprintV2(model.prior),
    collapseHydraulicsFingerprint: coronaryConfigurationFingerprintV2(
      model.collapseHydraulics,
    ),
    solverOptionsFingerprint: coronaryConfigurationFingerprintV2(
      DEFAULT_CORONARY_BACKWARD_EULER_SOLVER_OPTIONS_V2,
    ),
    autoregulationPriorFingerprint: model.binding.priorFingerprint,
  });
}

function structuralLevel(
  levelId: CoronaryV3StructuralCmdActiveReserveLevelIdV2,
) {
  const level = CORONARY_V3_STRUCTURAL_CMD_ACTIVE_RESERVE_LEVELS_V2.find(
    (candidate) => candidate.levelId === levelId,
  );
  if (level === undefined)
    throw new Error(`unknown structural level ${levelId}`);
  return level;
}

function pushTerminalRawWindow(
  ring: CoronaryV3StructuralCmdActiveReserveRawWindowV2[],
  raw: CoronaryV3StructuralCmdActiveReserveRawWindowV2,
): void {
  ring.push(raw);
  if (
    ring.length >
    CORONARY_V3_STRUCTURAL_CMD_ACTIVE_RESERVE_POLICY_V2.exactTerminalRawWindowCountPerPhase
  ) {
    ring.shift();
  }
}

function validateStepDiagnostics(
  diagnostics: ReturnType<
    typeof solveCoronaryBackwardEulerTrialV2
  >["diagnostics"],
  phase: string,
  phaseWindowIndex: number,
  stepIndex: number,
): void {
  const policy = CORONARY_V3_STRUCTURAL_CMD_ACTIVE_RESERVE_POLICY_V2;
  requireFiniteNumbers(
    diagnostics,
    `${phase} window ${phaseWindowIndex} step ${stepIndex}`,
  );
  if (
    Math.abs(diagnostics.exactBloodVolumeLedgerResidualMl) >
    policy.maximumAbsoluteStepLedgerResidualMl
  ) {
    throw new Error("active reserve step ledger tolerance exceeded");
  }
  if (
    diagnostics.maximumAbsoluteNodeContinuityResidualMl >
    policy.maximumAbsoluteNodeContinuityResidualMl
  ) {
    throw new Error("active reserve node continuity tolerance exceeded");
  }
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

function nonnegativeLogToneDistance(
  tone: number,
  floor: number,
  label: string,
): number {
  if (
    !Number.isFinite(tone) ||
    !Number.isFinite(floor) ||
    !(tone > 0) ||
    !(floor > 0)
  ) {
    throw new Error(`${label} tone/floor must be positive and finite`);
  }
  const distance = Math.log(tone) - Math.log(floor);
  if (distance < -1e-12) {
    throw new Error(`${label} tone is below its effective floor`);
  }
  return Math.max(0, distance);
}

function targetLayerTone(
  tone: CoronaryToneStateV2,
): TargetLayerRecordV2<number> {
  return Object.freeze({
    subepicardial: tone.LAD.subepicardial,
    subendocardial: tone.LAD.subendocardial,
  });
}

function targetLayerRecord<T>(
  map: (layerId: (typeof CORONARY_LAYER_IDS_V2)[number]) => T,
): TargetLayerRecordV2<T> {
  return Object.freeze({
    subepicardial: map("subepicardial"),
    subendocardial: map("subendocardial"),
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
  return Object.freeze(
    Object.fromEntries(
      CORONARY_TERRITORY_IDS_V2.map((territoryId) => [
        territoryId,
        Object.freeze(
          Object.fromEntries(
            CORONARY_LAYER_IDS_V2.map((layerId) => [
              layerId,
              map(territoryId, layerId),
            ]),
          ),
        ),
      ]),
    ),
  ) as CoronaryTerritoryLayerRecordV2<T>;
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
