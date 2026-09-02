import { createMainWireCoronaryDiseaseInputV2 } from "@/engine/coronary/MainWireCoronaryDiseaseResearchInputsV2";
import { NORMAL_ADULT_CORONARY_SHORTENING_IMP_GAIN_PRIOR_V2 } from "@/engine/coronary/mainWireCoronaryBoundaryV2";
import {
  MAIN_WIRE_PROVISIONAL_NORMAL_ADULT_CORONARY_COLLAPSE_V2,
  MAIN_WIRE_PROVISIONAL_NORMAL_ADULT_CORONARY_PRIOR_V2,
} from "@/engine/coronary/mainWireNormalAdultCoronaryV2";
import { createMechanicalSupportConfigV1 } from "@/engine/devices/defaultsV1";
import {
  MAIN_WIRE_SELECTED_AORTIC_OUTFLOW_CIRCULATION_PROFILE_V1,
  MAIN_WIRE_SELECTED_AORTIC_OUTFLOW_CIRCULATION_PROFILE_V1_ID,
} from "@/engine/core/MainWireSelectedAorticOutflowCirculationProfileV1";
import {
  MAIN_WIRE_ALGEBRAIC_PROXIMAL_ARTERIAL_ROOTS_PROFILE_V1,
  MAIN_WIRE_ALGEBRAIC_PROXIMAL_ARTERIAL_ROOTS_PROFILE_V1_ID,
} from "@/engine/core/MainWireAlgebraicProximalArterialRootsProfileV1";
import {
  createDynamicMechanicalSupportDeviceProfileBindingV1,
  createDynamicMechanicalSupportInertanceProfileV1,
  type DynamicMechanicalSupportInertanceProfileV1,
} from "@/engine/devices/dynamicNetworkV1";
import {
  DYNAMIC_ROTARY_PUMP_UNIT_SYSTEM_V1_ID,
  type DynamicRotaryPumpCircuitInertanceV1,
} from "@/engine/devices/dynamicRotaryPumpV1";
import type {
  MechanicalSupportConfigV1,
  RotarySupportDeviceIdV1,
} from "@/engine/devices/typesV1";
import {
  checkpointMainWireIntegratedModelV3,
  restoreMainWireIntegratedModelV3,
  type MainWireIntegratedModelCheckpointContextV3,
  type MainWireIntegratedModelCheckpointV3,
} from "@/engine/myocardium/MainWireIntegratedModelCheckpointV3";
import {
  evaluateMainWireIntegratedModelCalciumDriveV3,
  initializeMainWireIntegratedModelV3,
  limitMainWireIntegratedModelCandidateTimeV3,
  stepMainWireIntegratedModelV3,
  type MainWireIntegratedModelAcceptedStateV3,
  type MainWireIntegratedModelStepInputV3,
  type MainWireIntegratedModelStepSuccessV3,
} from "@/engine/myocardium/MainWireIntegratedModelTransactionV3";
import {
  MAIN_WIRE_INTEGRATED_MATCHED_ALPHA_FIXED_REGULAR_SINUS_PROFILE_V1_ID,
  createMainWireIntegratedRegularSinusRhythmV3,
} from "@/engine/myocardium/MainWireIntegratedRegularSinusRhythmV3";
import {
  FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
  type FiveWallNormalCalciumDriveParamsV1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import {
  resolveMainWireVentricularCalciumMatchedAlphaExactPersistenceV1,
} from "@/engine/myocardium/calcium/MainWireVentricularCalciumMatchedAlphaExactPersistenceV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
  validateAndOwnMainWireIntegratedModelHemodynamicResearchInputsV3,
  type MainWireIntegratedModelHemodynamicResearchInputsV3,
} from "@/engine/myocardium/MainWireIntegratedModelHemodynamicResearchInputsV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_MECHANISM_RESEARCH_INPUTS_V3,
  validateAndOwnMainWireIntegratedModelMechanismResearchInputsV3,
  type MainWireIntegratedModelMechanismResearchInputsV3,
} from "@/engine/myocardium/MainWireIntegratedModelMechanismResearchInputsV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_NUMERICAL_POLICY_V3,
  MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicPolicyV3";
import {
  classifyMainWireIntegratedModelPeriodicityV3,
  type MainWireIntegratedModelPeriodicClassificationV3,
  type MainWireIntegratedModelPeriodicCycleObservationV3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicClassifierV3";
import {
  compareMainWireIntegratedModelAcceptedStatesV3,
  type MainWireIntegratedModelPeriodicClosureReportV3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicClosureV3";
import { MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_REFERENCE_SCALES_V3 } from "@/engine/myocardium/experiments/MainWireIntegratedModelReferenceScalesV3";
import { MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CORONARY_CIRCULATION_NEWTON_POLICY_V2 } from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallCoronaryPeriodicSteadyV2";
import {
  normalAdultMainWireRuntimeV1,
  type MainWireNormalAdultFiveWallMechanicsStateV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallClosedLoopV1";
import { createMainWireCommonPericardiumWithResearchInputsV1 } from "@/engine/myocardium/mechanics/MainWireCommonPericardiumResearchInputsV1";
import {
  createMainWireNormalAdultFiveWallProviderWithMechanicsResearchInputsV1,
  createMainWireNormalAdultFiveWallProviderWithVentricularLandEtRelaxationProfileAndMechanicsResearchInputsV1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";
import { withCommonVentricularActiveTensionScaleV1 } from "@/engine/myocardium/mechanics/MainWireFiveWallMechanicsResearchInputsV1";
import {
  MAIN_WIRE_VENTRICULAR_LAND_ET_RELAXATION_PROFILE_V1_ID,
} from "@/engine/myocardium/mechanics/MainWireVentricularLandEtRelaxationProfileV1";
import { createMainWireFourValveContinuousAreaResearchInputV1 } from "@/engine/valves/MainWireFourValveDiseaseResearchBracketsV1";
import {
  canonicalJsonStringify,
  sha256CanonicalJsonHex,
} from "@/engine/integrity";
import {
  MAIN_WIRE_INTEGRATED_MODEL_HEALTHY_REFERENCE_CONTEXT_V3,
  type MainWireIntegratedModelHealthyReferenceGateV3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelHealthyReferenceContextV3";

export const MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_STEADY_V3_ID =
  "main-wire-integrated-composed-regular-sinus-all-off-periodic-steady-v3" as const;

export const MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_STEADY_CLAIM_V3 = deepFreeze({
  scope:
    "canonical-provider-coronary-v3-accepted-composed-regular-sinus-and-explicit-all-off-zero-inertance-dynamic-MCS" as const,
  dedicatedV3Fixture: true as const,
  activeHeartMateIiBaselineUsed: false as const,
  allFourMcsDevicesDisabled: true as const,
  allFourMcsInertanceCircuitsExplicitAndZero: true as const,
  completeAcceptedStateP1P2Comparator: true as const,
  exactMainV3CheckpointStoredAndRoundTripVerified: true as const,
  terminalCycleTrace:
    "raw-accepted-endpoints-with-event-clipped-dt-no-resampling" as const,
  finiteConservationEventIdentityAndSingleCalciumOwnerFailClosed: true as const,
  canonicalV3ThresholdPolicyOwned: true as const,
  maximumHorizon:
    "ten-times-25-second-coronary-controller-time-constant-equals-250-one-second-cycles" as const,
  thresholdsChangedAfterInspectingV3Output: false as const,
  fixedHorizonCharacterizationEvidenceRole: "bounded-exploration-only" as const,
  fixedHorizonCharacterizationCanEstablishCanonicalPeriodicity: false as const,
  healthyReferenceAssessment:
    "reported-only-after-canonical-numerical-P1-eligibility" as const,
  healthyReferenceRole:
    "construction-context-not-independent-validation" as const,
  healthyReferencePassIsPhysiologicalValidation: false as const,
  numericalPeriodicityIsPhysiologicalAcceptance: false as const,
  normalConstructionTargetIsIndependentValidation: false as const,
  patientFittingApplied: false as const,
  waveformOrParameterFittingApplied: false as const,
  clinicalValidationClaimed: false as const,
  releaseAcceptanceClaimed: false as const,
  releaseReadyClaimed: false as const,
});

export const MAIN_WIRE_INTEGRATED_MODEL_SELECTED_AORTIC_OUTFLOW_FIXTURE_V1_ID =
  "main-wire-integrated-model-selected-aortic-outflow-fixture-v1" as const;

/**
 * Fixed opt-in assembly selected by the archived aortic-outflow investigation.
 * This is one inseparable construction, not a catalog or an arbitrary runtime
 * axis. The legacy default factory remains a separate explicit path.
 */
export const MAIN_WIRE_INTEGRATED_MODEL_SELECTED_AORTIC_OUTFLOW_FIXTURE_V1_CLAIM =
  Object.freeze({
    fixtureId:
      MAIN_WIRE_INTEGRATED_MODEL_SELECTED_AORTIC_OUTFLOW_FIXTURE_V1_ID,
    ventricularMaterialProfileId:
      MAIN_WIRE_VENTRICULAR_LAND_ET_RELAXATION_PROFILE_V1_ID,
    aorticOutflowCirculationProfileId:
      MAIN_WIRE_SELECTED_AORTIC_OUTFLOW_CIRCULATION_PROFILE_V1_ID,
    regularSinusProfileId:
      MAIN_WIRE_INTEGRATED_MATCHED_ALPHA_FIXED_REGULAR_SINUS_PROFILE_V1_ID,
    assemblyScope: "cold-fixture-and-same-configuration-stepping" as const,
    composedRhythmCalciumOwner:
      "accepted-exact-event-matched-alpha-state" as const,
    coronaryCalciumDriveParamsRole:
      "matched-alpha-descriptor-and-cycle-contract-not-calcium-state-owner" as const,
    boundedHemodynamicResearchInputsRetained: true as const,
    activeAndPassiveWallResearchInputsRetained: true as const,
    valvePericardialAndCoronaryResearchInputsRetained: true as const,
    oxygenTransportInputRetainedForAnalysis: true as const,
    calciumDecayTimeScaleResearchInput:
      "fixed-unit-only-to-preserve-selected-matched-alpha-law" as const,
    dynamicMechanicalSupport:
      "existing-explicit-all-off-zero-inertance" as const,
    warmRuntimeRebindingSupported: false as const,
    newContinuousStateAdded: false as const,
    legacyDefaultFixtureSelection:
      "canonical-provider-and-absent-selected-aortic-outflow-profile" as const,
    parameterSearchOrFitting: false as const,
    clinicalValidationClaimed: false as const,
  });

export const MAIN_WIRE_INTEGRATED_MODEL_ALGEBRAIC_PROXIMAL_ROOTS_FIXTURE_V1_ID =
  "main-wire-integrated-model-algebraic-proximal-roots-fixture-v1" as const;

/** Fixed successor assembly; the only numerical change from Standard66 is L=0
 * on Ao_SA and PA_PArt. Existing R, B, compliance, valve, calcium, rhythm,
 * myocardial, coronary, and device semantics are retained exactly. */
export const MAIN_WIRE_INTEGRATED_MODEL_ALGEBRAIC_PROXIMAL_ROOTS_FIXTURE_V1_CLAIM =
  Object.freeze({
    fixtureId:
      MAIN_WIRE_INTEGRATED_MODEL_ALGEBRAIC_PROXIMAL_ROOTS_FIXTURE_V1_ID,
    predecessorFixtureId:
      MAIN_WIRE_INTEGRATED_MODEL_SELECTED_AORTIC_OUTFLOW_FIXTURE_V1_ID,
    ventricularMaterialProfileId:
      MAIN_WIRE_VENTRICULAR_LAND_ET_RELAXATION_PROFILE_V1_ID,
    aorticOutflowCirculationProfileId:
      MAIN_WIRE_SELECTED_AORTIC_OUTFLOW_CIRCULATION_PROFILE_V1_ID,
    proximalArterialRootsProfileId:
      MAIN_WIRE_ALGEBRAIC_PROXIMAL_ARTERIAL_ROOTS_PROFILE_V1_ID,
    regularSinusProfileId:
      MAIN_WIRE_INTEGRATED_MATCHED_ALPHA_FIXED_REGULAR_SINUS_PROFILE_V1_ID,
    composedRhythmCalciumOwner:
      "accepted-exact-event-matched-alpha-state" as const,
    calciumDecayTimeScaleResearchInput:
      "fixed-unit-only-to-preserve-selected-matched-alpha-law" as const,
    changedMomentumEdges: Object.freeze(["Ao_SA", "PA_PArt"] as const),
    sourceResistanceAndQuadraticLossPreserved: true as const,
    newContinuousStateAdded: false as const,
    acceptedRootFlowRecords:
      "same-step-exact-readback-not-next-step-memory" as const,
    parameterSearchOrFitting: false as const,
    physiologicalValidationClaimed: false as const,
  });

export type MainWireIntegratedModelPeriodicExecutionPurposeV3 =
  "canonical-evidence" | "bounded-smoke" | "fixed-horizon-characterization";

export type MainWireIntegratedModelPeriodicSteadyOptionsV3 = Readonly<{
  nominalDtSec: number;
  maximumCycleCount?: number;
  executionPurpose?: MainWireIntegratedModelPeriodicExecutionPurposeV3;
  hemodynamicResearchInputs?: MainWireIntegratedModelHemodynamicResearchInputsV3;
  ventricularContractilityScale?: number;
  mechanismResearchInputs?: MainWireIntegratedModelMechanismResearchInputsV3;
}>;

export type MainWireIntegratedModelPeriodicTerminalTraceSampleV3 = Readonly<{
  cycleIndex: number;
  acceptedStepIndexWithinCycle: number;
  acceptedTimeSec: number;
  cyclePhase01: number;
  acceptedDtSec: number;
  chamberVolumeMl: Readonly<{ LA: number; LV: number; RA: number; RV: number }>;
  absolutePressureMmHg: Readonly<{
    LA: number;
    LV: number;
    RA: number;
    RV: number;
    Ao: number;
    PA: number;
    PVein: number;
  }>;
  transmuralPressureMmHg: Readonly<{
    LV: number;
    RV: number;
  }>;
  valveFlowMlPerSec: Readonly<{
    MV: number;
    AoV: number;
    TV: number;
    PV: number;
  }>;
  coronary: Readonly<{
    totalInletFlowMlPerSec: number;
    ladSubendocardialQmFlowMlPerSec: number;
  }>;
  freeCalciumUMByWall: Readonly<{
    LA: number;
    LVFW: number;
    SEP: number;
    RVFW: number;
    RA: number;
  }>;
  dynamicMcsAcceptedFlowMlPerSec: Readonly<
    Record<RotarySupportDeviceIdV1, number>
  >;
  acceptedEventIdentity: Readonly<{
    atrialCapturedActivationId: string | null;
    ventricularCapturedActivationId: string | null;
    deliveredCalciumDepositIds: readonly string[];
    scheduledCalciumDepositIds: readonly string[];
  }>;
  diagnostics: Readonly<{
    mechanicsResidualNorm: number;
    circulationScaledResidualInfinityNorm: number;
    maximumContinuityResidualMl: number;
    totalBloodVolumeErrorMl: number;
    coronaryBloodVolumeLedgerResidualMl: number;
    dynamicMcsConservationResidualMlPerSec: number;
  }>;
}>;

export type MainWireIntegratedModelPeriodicTerminalCycleTraceV3 = Readonly<{
  cycleIndex: number;
  startTimeSec: number;
  endTimeSec: number;
  sampleCount: number;
  samples: readonly MainWireIntegratedModelPeriodicTerminalTraceSampleV3[];
  retainedForGraphShapeInspection: true;
  resamplingApplied: false;
  shapeAcceptanceClaimed: false;
  interpretation: "raw-accepted-endpoint-samples-no-resampling-no-shape-acceptance";
}>;

export type MainWireIntegratedModelHealthyReferenceProjectionV3 = Readonly<{
  projectionId: "main-wire-integrated-v3-terminal-cycle-healthy-reference-projection-v1";
  referenceContextId: typeof MAIN_WIRE_INTEGRATED_MODEL_HEALTHY_REFERENCE_CONTEXT_V3.contextId;
  referenceBodySurfaceAreaM2: number;
  referenceBodySurfaceAreaProvenance: "MainWireIntegratedModelHealthyReferenceContextV3.resting-adult-research-reference";
  metric: Readonly<{
    lvEndDiastolicVolumeMl: number;
    lvEndSystolicVolumeMl: number;
    lvEndDiastolicVolumeIndexMlPerM2: number;
    lvEndSystolicVolumeIndexMlPerM2: number;
    lvEjectionFraction01: number;
    nativeAorticForwardVolumeMl: number;
    nativeAorticCardiacOutputLPerMin: number;
    nativeAorticCardiacIndexLPerMinPerM2: number;
    pulmonaryArterySystolicPressureMmHg: number;
    leftAtrialTimeWeightedMeanPressureMmHg: number;
  }>;
  assessmentEligibility: Readonly<{
    eligible: boolean;
    requirement: "canonical-evidence-and-numerical-period1-converged";
    numericalPeriod1Established: boolean;
    executionPurpose: MainWireIntegratedModelPeriodicExecutionPurposeV3;
  }>;
  gateResults: readonly Readonly<{
    gateId: string;
    metricId: string;
    value: number;
    lowerInclusive: number | null;
    upperInclusive: number | null;
    status: "pass" | "fail" | "not-assessed";
    sourceIds: readonly string[];
  }>[];
  comparisonRole: "construction-context-not-independent-validation";
  physiologyValidated: false;
  clinicalValidationClaimed: false;
}>;

export type MainWireIntegratedModelPeriodicSteadyCycleV3 = Readonly<{
  cycleIndex: number;
  startTimeSec: number;
  endTimeSec: number;
  acceptedStepCount: number;
  coronaryAutoregulationWindow: Readonly<{
    windowIndex: number;
    startTimeSec: number;
    endTimeSec: number;
    acceptedDurationSec: number;
    acceptedStepCount: number;
  }>;
  period1: MainWireIntegratedModelPeriodicClosureReportV3;
  period2: MainWireIntegratedModelPeriodicClosureReportV3 | null;
  period1MaximumNormalizedDelta: number;
  period2MaximumNormalizedDelta: number | null;
  worstPeriod1Group: string;
  worstPeriod1Path: string;
  acceptedAtrialCaptureIds: readonly string[];
  acceptedVentricularCaptureIds: readonly string[];
  deliveredCalciumDepositIds: readonly string[];
  conservation: Readonly<{
    maximumGlobalTotalBloodVolumeErrorMl: number;
    maximumCoronaryBloodVolumeLedgerResidualMl: number;
    maximumDynamicMcsConservationResidualMlPerSec: number;
    withinInheritedConstructionTolerances: boolean;
  }>;
  finiteAndEventIdentityChecks: Readonly<{
    allRawValuesFinite: boolean;
    exactlyOneAtrialCapture: boolean;
    exactlyOneVentricularCapture: boolean;
    exactlyTwoDeliveredCalciumDeposits: boolean;
    oneComposedCalciumOwnerOnly: boolean;
    allDynamicMcsAcceptedFlowsExactlyZero: boolean;
    passed: boolean;
  }>;
  rawHealthyMetrics: MainWireIntegratedModelHealthyReferenceProjectionV3["metric"];
}>;

export type MainWireIntegratedModelPeriodicSteadyResultV3 = Readonly<{
  experimentId: typeof MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_STEADY_V3_ID;
  executionPurpose: MainWireIntegratedModelPeriodicExecutionPurposeV3;
  protocolIdentityHash: string;
  nominalDtSec: number;
  cycleLengthSec: number;
  requestedMaximumCycleCount: number;
  completedCycleCount: number;
  terminationReason:
    "period1-converged" | "period2-suspect" | "maximum-cycles-reached";
  classification: MainWireIntegratedModelPeriodicClassificationV3;
  numericalPeriod1Established: boolean;
  period2OrbitSuspected: boolean;
  requestedHorizonCompleted: boolean;
  earlyClassificationStopEligible: boolean;
  allCyclesFiniteConservedAndEventExact: boolean;
  physiologicalAcceptanceEstablished: false;
  independentValidationEstablished: false;
  releaseAcceptanceEstablished: false;
  cycles: readonly MainWireIntegratedModelPeriodicSteadyCycleV3[];
  observations: readonly MainWireIntegratedModelPeriodicCycleObservationV3[];
  terminalCycleTrace: MainWireIntegratedModelPeriodicTerminalCycleTraceV3;
  terminalHealthyReferenceProjection: MainWireIntegratedModelHealthyReferenceProjectionV3;
  terminalAcceptedState: MainWireIntegratedModelAcceptedStateV3<MainWireNormalAdultFiveWallMechanicsStateV1>;
  terminalCheckpoint: MainWireIntegratedModelCheckpointV3;
  terminalCheckpointExactRoundTripVerified: true;
  policy: typeof MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3;
  claim: typeof MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_STEADY_CLAIM_V3;
}>;

type Provider = ReturnType<
  typeof createMainWireNormalAdultFiveWallProviderWithMechanicsResearchInputsV1
>;
type WallState = MainWireNormalAdultFiveWallMechanicsStateV1;
type AcceptedState = MainWireIntegratedModelAcceptedStateV3<WallState>;
type SuccessfulStep = MainWireIntegratedModelStepSuccessV3<WallState>;

export type MainWireIntegratedModelRegularSinusAllOffFixtureV3 = ReturnType<
  typeof createMainWireIntegratedModelRegularSinusAllOffFixtureV3
>;

type MainWireIntegratedModelCheckpointFixtureViewV3 = Readonly<
  Pick<
    MainWireIntegratedModelRegularSinusAllOffFixtureV3,
    | "provider"
    | "cold"
    | "rhythm"
    | "profile"
    | "config"
    | "hemodynamicResearchInputs"
  > & {
    coronaryStepInput: Pick<
      MainWireIntegratedModelRegularSinusAllOffFixtureV3["coronaryStepInput"],
      | "coronaryPrior"
      | "collapseHydraulics"
      | "impMechanism"
      | "shorteningImpPrior"
    >;
  }
>;

export function createMainWireIntegratedModelRegularSinusAllOffFixtureV3(
  requestedHemodynamicResearchInputs: MainWireIntegratedModelHemodynamicResearchInputsV3 = MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
  ventricularContractilityScale = 1,
  requestedMechanismResearchInputs: MainWireIntegratedModelMechanismResearchInputsV3 = MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_MECHANISM_RESEARCH_INPUTS_V3,
) {
  const prepared = prepareMainWireIntegratedModelFixtureInputsV3(
    requestedHemodynamicResearchInputs,
    ventricularContractilityScale,
    requestedMechanismResearchInputs,
  );
  return assembleMainWireIntegratedModelRegularSinusAllOffFixtureV3(
    prepared,
    {
      createProvider: () =>
        createMainWireNormalAdultFiveWallProviderWithMechanicsResearchInputsV1(
          prepared.chamberMechanics,
        ),
      createVascularRuntime: () => Object.freeze({
        venousTone: prepared.hemodynamicResearchInputs.venousTone,
        arterialStiffness:
          prepared.hemodynamicResearchInputs.arterialStiffness,
      }),
      createCalciumDriveParams: (cycleLengthSec) => Object.freeze({
        ...FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
        parameterSetId:
          `${FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1.parameterSetId}` +
          `-hr-${prepared.hemodynamicResearchInputs.heartRateBpm}-bpm`,
        cycleLengthSec,
        decayTimeScaleByWall:
          prepared.chamberMechanics.calciumDecayTimeScaleByWall,
      }),
      createRhythm: (cycleLengthSec) =>
        createMainWireIntegratedRegularSinusRhythmV3({
          idPrefix: "periodic-v3",
          parameterProvenanceSourceId: "bounded-periodic-v3-construction",
          cycleLengthSec,
        }),
    },
  );
}

export type MainWireIntegratedModelSelectedAorticOutflowFixtureV1 = ReturnType<
  typeof createMainWireIntegratedModelSelectedAorticOutflowFixtureV1
>;

export type MainWireIntegratedModelAlgebraicProximalRootsFixtureV1 = ReturnType<
  typeof createMainWireIntegratedModelAlgebraicProximalRootsFixtureV1
>;

/**
 * Opts into the fixed Land / recovered-root circulation / matched-alpha
 * regular-sinus assembly while retaining its admitted cold-fixture coordinates.
 * Non-unit calcium-decay scales are outside this matched-alpha construction.
 */
export function createMainWireIntegratedModelSelectedAorticOutflowFixtureV1(
  requestedHemodynamicResearchInputs: MainWireIntegratedModelHemodynamicResearchInputsV3 = MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
  ventricularContractilityScale = 1,
  requestedMechanismResearchInputs: MainWireIntegratedModelMechanismResearchInputsV3 = MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_MECHANISM_RESEARCH_INPUTS_V3,
) {
  const prepared = prepareMainWireIntegratedModelFixtureInputsV3(
    requestedHemodynamicResearchInputs,
    ventricularContractilityScale,
    requestedMechanismResearchInputs,
  );
  assertSelectedMatchedAlphaCompatibleCalciumScalesV1(
    prepared.chamberMechanics,
  );
  const fixture = assembleMainWireIntegratedModelRegularSinusAllOffFixtureV3(
    prepared,
    {
      createProvider: () =>
        createMainWireNormalAdultFiveWallProviderWithVentricularLandEtRelaxationProfileAndMechanicsResearchInputsV1(
          prepared.chamberMechanics,
        ),
      createVascularRuntime: () => Object.freeze({
        venousTone: prepared.hemodynamicResearchInputs.venousTone,
        arterialStiffness:
          prepared.hemodynamicResearchInputs.arterialStiffness,
        selectedAorticOutflowProfile:
          MAIN_WIRE_SELECTED_AORTIC_OUTFLOW_CIRCULATION_PROFILE_V1,
      }),
      createCalciumDriveParams: () =>
        resolveMainWireVentricularCalciumMatchedAlphaExactPersistenceV1(
          prepared.hemodynamicResearchInputs.heartRateBpm,
        ),
      createRhythm: (cycleLengthSec) =>
        createMainWireIntegratedRegularSinusRhythmV3(
          {
            idPrefix: "selected-aortic-outflow-v1",
            parameterProvenanceSourceId:
              MAIN_WIRE_INTEGRATED_MODEL_SELECTED_AORTIC_OUTFLOW_FIXTURE_V1_ID,
            cycleLengthSec,
          },
          {
            profileId:
              MAIN_WIRE_INTEGRATED_MATCHED_ALPHA_FIXED_REGULAR_SINUS_PROFILE_V1_ID,
            heartRateBpm: prepared.hemodynamicResearchInputs.heartRateBpm,
          },
        ),
    },
  );
  return Object.freeze({
    ...fixture,
    fixedAssemblyId:
      MAIN_WIRE_INTEGRATED_MODEL_SELECTED_AORTIC_OUTFLOW_FIXTURE_V1_ID,
    fixedAssemblyClaim:
      MAIN_WIRE_INTEGRATED_MODEL_SELECTED_AORTIC_OUTFLOW_FIXTURE_V1_CLAIM,
  });
}

/**
 * Production candidate distilled from the causal root-inertance ablation.
 * This remains a fixed construction rather than a user-selectable model axis.
 */
export function createMainWireIntegratedModelAlgebraicProximalRootsFixtureV1(
  requestedHemodynamicResearchInputs: MainWireIntegratedModelHemodynamicResearchInputsV3 = MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
  ventricularContractilityScale = 1,
  requestedMechanismResearchInputs: MainWireIntegratedModelMechanismResearchInputsV3 = MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_MECHANISM_RESEARCH_INPUTS_V3,
) {
  const prepared = prepareMainWireIntegratedModelFixtureInputsV3(
    requestedHemodynamicResearchInputs,
    ventricularContractilityScale,
    requestedMechanismResearchInputs,
  );
  assertSelectedMatchedAlphaCompatibleCalciumScalesV1(
    prepared.chamberMechanics,
  );
  const fixture = assembleMainWireIntegratedModelRegularSinusAllOffFixtureV3(
    prepared,
    {
      createProvider: () =>
        createMainWireNormalAdultFiveWallProviderWithVentricularLandEtRelaxationProfileAndMechanicsResearchInputsV1(
          prepared.chamberMechanics,
        ),
      createVascularRuntime: () => Object.freeze({
        venousTone: prepared.hemodynamicResearchInputs.venousTone,
        arterialStiffness:
          prepared.hemodynamicResearchInputs.arterialStiffness,
        selectedAorticOutflowProfile:
          MAIN_WIRE_SELECTED_AORTIC_OUTFLOW_CIRCULATION_PROFILE_V1,
        algebraicProximalArterialRootsProfile:
          MAIN_WIRE_ALGEBRAIC_PROXIMAL_ARTERIAL_ROOTS_PROFILE_V1,
      }),
      createCalciumDriveParams: () =>
        resolveMainWireVentricularCalciumMatchedAlphaExactPersistenceV1(
          prepared.hemodynamicResearchInputs.heartRateBpm,
        ),
      createRhythm: (cycleLengthSec) =>
        createMainWireIntegratedRegularSinusRhythmV3(
          {
            idPrefix: "algebraic-proximal-roots-v1",
            parameterProvenanceSourceId:
              MAIN_WIRE_INTEGRATED_MODEL_ALGEBRAIC_PROXIMAL_ROOTS_FIXTURE_V1_ID,
            cycleLengthSec,
          },
          {
            profileId:
              MAIN_WIRE_INTEGRATED_MATCHED_ALPHA_FIXED_REGULAR_SINUS_PROFILE_V1_ID,
            heartRateBpm: prepared.hemodynamicResearchInputs.heartRateBpm,
          },
        ),
    },
  );
  return Object.freeze({
    ...fixture,
    fixedAssemblyId:
      MAIN_WIRE_INTEGRATED_MODEL_ALGEBRAIC_PROXIMAL_ROOTS_FIXTURE_V1_ID,
    fixedAssemblyClaim:
      MAIN_WIRE_INTEGRATED_MODEL_ALGEBRAIC_PROXIMAL_ROOTS_FIXTURE_V1_CLAIM,
  });
}

export function prepareMainWireIntegratedModelFixtureInputsV3(
  requestedHemodynamicResearchInputs: MainWireIntegratedModelHemodynamicResearchInputsV3,
  ventricularContractilityScale: number,
  requestedMechanismResearchInputs: MainWireIntegratedModelMechanismResearchInputsV3,
) {
  const hemodynamicResearchInputs =
    validateAndOwnMainWireIntegratedModelHemodynamicResearchInputsV3(
      requestedHemodynamicResearchInputs,
    );
  const requestedMechanismInputs =
    validateAndOwnMainWireIntegratedModelMechanismResearchInputsV3(
      requestedMechanismResearchInputs,
    );
  const chamberMechanics =
    ventricularContractilityScale === 1
      ? requestedMechanismInputs.chamberMechanics
      : withCommonVentricularActiveTensionScaleV1(
          requestedMechanismInputs.chamberMechanics,
          ventricularContractilityScale,
        );
  const mechanismResearchInputs = Object.freeze({
    ...requestedMechanismInputs,
    chamberMechanics,
  });
  return Object.freeze({
    hemodynamicResearchInputs,
    ventricularContractilityScale,
    mechanismResearchInputs,
    chamberMechanics,
  });
}

export function assembleMainWireIntegratedModelRegularSinusAllOffFixtureV3<
  TVascularRuntime extends Readonly<{
    venousTone: number;
    arterialStiffness: number;
  }>,
  TCalciumDriveParams extends FiveWallNormalCalciumDriveParamsV1,
  TRhythm extends ReturnType<
    typeof createMainWireIntegratedRegularSinusRhythmV3
  >,
>(
  prepared: ReturnType<typeof prepareMainWireIntegratedModelFixtureInputsV3>,
  fixedAssembly: Readonly<{
    createProvider: () => Provider;
    createVascularRuntime: () => TVascularRuntime;
    createCalciumDriveParams: (
      cycleLengthSec: number,
    ) => TCalciumDriveParams;
    createRhythm: (cycleLengthSec: number) => TRhythm;
  }>,
) {
  const {
    hemodynamicResearchInputs,
    ventricularContractilityScale,
    mechanismResearchInputs,
  } = prepared;
  const provider = fixedAssembly.createProvider();
  const canonicalRuntime = normalAdultMainWireRuntimeV1();
  const cycleLengthSec = 60 / hemodynamicResearchInputs.heartRateBpm;
  const peepMmHg = hemodynamicResearchInputs.peepCmH2O * 0.7355592401;
  const calciumDriveParams =
    fixedAssembly.createCalciumDriveParams(cycleLengthSec);
  const runtime = Object.freeze({
    vascular: fixedAssembly.createVascularRuntime(),
    losses: Object.freeze({
      systemicResistance: hemodynamicResearchInputs.systemicResistance,
      pulmonaryResistance: hemodynamicResearchInputs.pulmonaryResistance,
    }),
    respiratory: Object.freeze({
      ...canonicalRuntime.respiratory,
      PEEP: peepMmHg,
    }),
    valveResearchInput: createMainWireFourValveContinuousAreaResearchInputV1(
      mechanismResearchInputs.valveAreas,
    ),
  });
  const pericardium = createMainWireCommonPericardiumWithResearchInputsV1(
    mechanismResearchInputs.pericardium,
  );
  const coronaryDisease = createMainWireCoronaryDiseaseInputV2(
    mechanismResearchInputs.coronaryDisease,
  );
  const rhythm = fixedAssembly.createRhythm(cycleLengthSec);
  const profile = createAllOffZeroInertanceProfileV3();
  const config = createMechanicalSupportConfigV1();
  assertAllOffConfig(config);
  const dynamicMechanicalSupport = Object.freeze({
    config,
    profile,
  });
  const coronaryStepInput = Object.freeze({
    runtime,
    calciumDriveParams,
    pericardium,
    coronaryPrior: MAIN_WIRE_PROVISIONAL_NORMAL_ADULT_CORONARY_PRIOR_V2,
    coronaryDisease,
    collapseHydraulics: MAIN_WIRE_PROVISIONAL_NORMAL_ADULT_CORONARY_COLLAPSE_V2,
    impMechanism: "cep-shortening-induced" as const,
    shorteningImpPrior: NORMAL_ADULT_CORONARY_SHORTENING_IMP_GAIN_PRIOR_V2,
    circulationNewtonOptions:
      MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CORONARY_CIRCULATION_NEWTON_POLICY_V2,
  });
  const cold = initializeMainWireIntegratedModelV3({
    coronary: {
      provider,
      runtime,
      calciumDriveParams,
      pericardium,
      coronaryPrior: MAIN_WIRE_PROVISIONAL_NORMAL_ADULT_CORONARY_PRIOR_V2,
      coronaryDisease,
      collapseHydraulics:
        MAIN_WIRE_PROVISIONAL_NORMAL_ADULT_CORONARY_COLLAPSE_V2,
      impMechanism: "cep-shortening-induced" as const,
      shorteningImpPrior: NORMAL_ADULT_CORONARY_SHORTENING_IMP_GAIN_PRIOR_V2,
      fixedGlobalTotalBloodVolumeMl:
        hemodynamicResearchInputs.totalBloodVolumeMl,
      autoregulationWindow: Object.freeze({
        durationSec: cycleLengthSec,
        interpretation: "periodic-sinus-cycle-aligned" as const,
      }),
    },
    rhythm: {
      configuration: rhythm.configuration,
      acceptedState: rhythm.state,
    },
    dynamicMechanicalSupport,
  });
  assertAllOffAcceptedQ(cold.acceptedState);
  return Object.freeze({
    hemodynamicResearchInputs,
    ventricularContractilityScale,
    mechanismResearchInputs,
    provider,
    runtime,
    pericardium,
    rhythm,
    profile,
    config,
    dynamicMechanicalSupport,
    coronaryStepInput,
    cycleLengthSec,
    cold,
  });
}

export async function runMainWireIntegratedModelPeriodicSteadyV3(
  options: MainWireIntegratedModelPeriodicSteadyOptionsV3,
): Promise<MainWireIntegratedModelPeriodicSteadyResultV3> {
  const resolved = resolveOptions(options);
  const fixture = createMainWireIntegratedModelRegularSinusAllOffFixtureV3(
    resolved.hemodynamicResearchInputs,
    resolved.ventricularContractilityScale,
    resolved.mechanismResearchInputs,
  );
  const protocolIdentityHash = await sha256CanonicalJsonHex(
    Object.freeze({
      experimentId: MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_STEADY_V3_ID,
      executionPurpose: resolved.executionPurpose,
      nominalDtSec: resolved.nominalDtSec,
      maximumCycleCount: resolved.maximumCycleCount,
      periodicPolicy: MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3,
      referenceScales: MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_REFERENCE_SCALES_V3,
      provider: providerIdentity(fixture.provider),
      composedRhythmConfiguration: fixture.rhythm.configuration,
      dynamicMechanicalSupportProfile: fixture.profile,
      dynamicMechanicalSupportConfig: fixture.config,
      coronaryStepInput: fixture.coronaryStepInput,
    }),
  );
  const classifierOptions = Object.freeze({
    period1NormalizedTolerance:
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3.period1NormalizedTolerance,
    period2NormalizedTolerance:
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3.period2NormalizedTolerance,
    period2MinimumPeriod1NormalizedDelta:
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3.period2MinimumPeriod1NormalizedDelta,
    consecutiveCycles:
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3.consecutiveCycles,
  });
  let accepted = fixture.cold.acceptedState;
  const boundaries: AcceptedState[] = [accepted];
  const observations: MainWireIntegratedModelPeriodicCycleObservationV3[] = [];
  const cycles: MainWireIntegratedModelPeriodicSteadyCycleV3[] = [];
  let classification = classifyMainWireIntegratedModelPeriodicityV3(
    observations,
    classifierOptions,
  );
  let terminalTraceSamples: MainWireIntegratedModelPeriodicTerminalTraceSampleV3[] =
    [];
  const allAtrialCaptureIds = new Set<string>();
  const allVentricularCaptureIds = new Set<string>();
  const allDepositIds = new Set<string>();

  for (
    let zeroBasedCycleIndex = 0;
    zeroBasedCycleIndex < resolved.maximumCycleCount;
    zeroBasedCycleIndex += 1
  ) {
    const start = accepted;
    const run = runMainWireIntegratedModelRegularSinusAllOffCycleV3(
      fixture,
      start,
      zeroBasedCycleIndex + 1,
      resolved.nominalDtSec,
    );
    accepted = run.terminalAcceptedState;
    rejectDuplicateIds(
      allAtrialCaptureIds,
      run.acceptedAtrialCaptureIds,
      "atrial capture",
    );
    rejectDuplicateIds(
      allVentricularCaptureIds,
      run.acceptedVentricularCaptureIds,
      "ventricular capture",
    );
    rejectDuplicateIds(
      allDepositIds,
      run.deliveredCalciumDepositIds,
      "calcium deposit",
    );
    const previous = boundaries.at(-1)!;
    const twoBack = boundaries.length >= 2 ? boundaries.at(-2)! : null;
    const period1 = compareMainWireIntegratedModelAcceptedStatesV3(
      accepted,
      previous,
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_REFERENCE_SCALES_V3,
      fixture.config,
    );
    const period2 =
      twoBack === null
        ? null
        : compareMainWireIntegratedModelAcceptedStatesV3(
            accepted,
            twoBack,
            MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_REFERENCE_SCALES_V3,
            fixture.config,
          );
    const cycleIndex = zeroBasedCycleIndex + 1;
    observations.push(
      Object.freeze({
        cycleIndex,
        evidenceRole:
          resolved.executionPurpose === "canonical-evidence"
            ? ("canonical-periodic-protocol" as const)
            : ("bounded-exploration-only" as const),
        protocolIdentityHash,
        period1,
        period2,
      }),
    );
    classification = classifyMainWireIntegratedModelPeriodicityV3(
      observations,
      classifierOptions,
    );
    cycles.push(buildCycleSummary(cycleIndex, run, period1, period2));
    terminalTraceSamples = [...run.traceSamples];
    boundaries.push(accepted);
    if (boundaries.length > 3) boundaries.shift();
    if (
      resolved.executionPurpose !== "fixed-horizon-characterization" &&
      classification.status !== "not-converged"
    ) {
      break;
    }
  }

  const terminalCycle = cycles.at(-1);
  if (
    terminalCycle === undefined ||
    terminalTraceSamples.length !== terminalCycle.acceptedStepCount
  ) {
    throw new Error("V3 periodic experiment lacks a complete terminal trace");
  }
  const terminalCycleTrace = deepFreeze({
    cycleIndex: terminalCycle.cycleIndex,
    startTimeSec: terminalCycle.startTimeSec,
    endTimeSec: terminalCycle.endTimeSec,
    sampleCount: terminalTraceSamples.length,
    samples: terminalTraceSamples,
    retainedForGraphShapeInspection: true as const,
    resamplingApplied: false as const,
    shapeAcceptanceClaimed: false as const,
    interpretation:
      "raw-accepted-endpoint-samples-no-resampling-no-shape-acceptance" as const,
  });
  const canonicalPeriod1 =
    resolved.executionPurpose === "canonical-evidence" &&
    classification.status === "period1-converged";
  const terminalHealthyReferenceProjection = healthyReferenceProjection(
    terminalCycleTrace,
    resolved.executionPurpose,
    canonicalPeriod1,
  );
  const checkpointContext =
    createMainWireIntegratedModelRegularSinusAllOffCheckpointContextV3(fixture);
  const terminalCheckpoint = await checkpointMainWireIntegratedModelV3(
    checkpointContext,
    accepted,
  );
  const restored = await restoreMainWireIntegratedModelV3(
    checkpointContext,
    JSON.parse(canonicalJsonStringify(terminalCheckpoint)),
  );
  const restoredCheckpoint = await checkpointMainWireIntegratedModelV3(
    checkpointContext,
    restored,
  );
  if (
    canonicalJsonStringify(restoredCheckpoint) !==
    canonicalJsonStringify(terminalCheckpoint)
  ) {
    throw new Error("V3 periodic terminal checkpoint exact round-trip differs");
  }
  const terminationReason =
    classification.status === "period1-converged"
      ? ("period1-converged" as const)
      : classification.status === "period2-suspect"
        ? ("period2-suspect" as const)
        : ("maximum-cycles-reached" as const);
  return deepFreeze({
    experimentId: MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_STEADY_V3_ID,
    executionPurpose: resolved.executionPurpose,
    protocolIdentityHash,
    nominalDtSec: resolved.nominalDtSec,
    cycleLengthSec: fixture.cycleLengthSec,
    requestedMaximumCycleCount: resolved.maximumCycleCount,
    completedCycleCount: cycles.length,
    terminationReason,
    classification,
    numericalPeriod1Established: canonicalPeriod1,
    period2OrbitSuspected:
      resolved.executionPurpose === "canonical-evidence" &&
      classification.status === "period2-suspect",
    requestedHorizonCompleted: cycles.length === resolved.maximumCycleCount,
    earlyClassificationStopEligible:
      resolved.executionPurpose !== "fixed-horizon-characterization",
    allCyclesFiniteConservedAndEventExact: cycles.every(
      (cycle) =>
        cycle.conservation.withinInheritedConstructionTolerances &&
        cycle.finiteAndEventIdentityChecks.passed,
    ),
    physiologicalAcceptanceEstablished: false as const,
    independentValidationEstablished: false as const,
    releaseAcceptanceEstablished: false as const,
    cycles,
    observations,
    terminalCycleTrace,
    terminalHealthyReferenceProjection,
    terminalAcceptedState: accepted,
    terminalCheckpoint,
    terminalCheckpointExactRoundTripVerified: true as const,
    policy: MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3,
    claim: MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_STEADY_CLAIM_V3,
  });
}

export type MainWireIntegratedModelRegularSinusAllOffCycleRunV3 = Readonly<{
  startTimeSec: number;
  endTimeSec: number;
  acceptedStepCount: number;
  terminalAcceptedState: AcceptedState;
  traceSamples: readonly MainWireIntegratedModelPeriodicTerminalTraceSampleV3[];
  coronaryAutoregulationWindow: MainWireIntegratedModelPeriodicSteadyCycleV3["coronaryAutoregulationWindow"];
  acceptedAtrialCaptureIds: readonly string[];
  acceptedVentricularCaptureIds: readonly string[];
  deliveredCalciumDepositIds: readonly string[];
  maximumGlobalTotalBloodVolumeErrorMl: number;
  maximumCoronaryBloodVolumeLedgerResidualMl: number;
  maximumDynamicMcsConservationResidualMlPerSec: number;
  allRawValuesFinite: boolean;
  oneComposedCalciumOwnerOnly: boolean;
  allDynamicMcsAcceptedFlowsExactlyZero: boolean;
}>;

export type MainWireIntegratedModelRegularSinusAllOffAlignmentV3 = Readonly<{
  alignmentRequired: boolean;
  sourceAcceptedTimeSec: number;
  boundaryAcceptedTimeSec: number;
  acceptedStepCount: number;
  completedWindowIndex: number | null;
  terminalAcceptedState: AcceptedState;
  acceptedAtrialCaptureIds: readonly string[];
  acceptedVentricularCaptureIds: readonly string[];
  deliveredCalciumDepositIds: readonly string[];
  maximumGlobalTotalBloodVolumeErrorMl: number;
  maximumCoronaryBloodVolumeLedgerResidualMl: number;
  maximumDynamicMcsConservationResidualMlPerSec: number;
  allRawValuesFinite: true;
  oneComposedCalciumOwnerOnly: true;
  allDynamicMcsAcceptedFlowsExactlyZero: true;
}>;

/**
 * Finishes only the candidate's already-open autoregulation window. This
 * preserves its accepted aggregates and event queues, then hands the periodic
 * comparator a complete regular-sinus/window boundary without cold-starting.
 */
export function alignMainWireIntegratedModelRegularSinusAllOffCandidateV3(
  fixture: MainWireIntegratedModelRegularSinusAllOffFixtureV3,
  initial: AcceptedState,
  nominalDtSec: number,
): MainWireIntegratedModelRegularSinusAllOffAlignmentV3 {
  assertPeriodicNominalDtSec(nominalDtSec);
  assertAllOffConfig(fixture.config);
  assertAllOffAcceptedQ(initial);
  const binding = initial.coronary.coronaryAutoregulationBinding;
  const window = initial.coronary.coronaryAutoregulation;
  const sourceAcceptedTimeSec = initial.acceptedTimeSec;
  if (
    binding.windowPolicy.interpretation !== "periodic-sinus-cycle-aligned" ||
    !nearlyEqual(binding.windowPolicy.durationSec, fixture.cycleLengthSec)
  ) {
    throw new Error("V3 qualification candidate window policy differs");
  }
  if (sourceAcceptedTimeSec === window.windowStartAcceptedTimeSec) {
    if (window.acceptedDurationSec !== 0 || window.acceptedStepCount !== 0) {
      throw new Error("V3 qualification boundary has a nonempty open window");
    }
    return deepFreeze({
      alignmentRequired: false,
      sourceAcceptedTimeSec,
      boundaryAcceptedTimeSec: sourceAcceptedTimeSec,
      acceptedStepCount: 0,
      completedWindowIndex: null,
      terminalAcceptedState: initial,
      acceptedAtrialCaptureIds: [],
      acceptedVentricularCaptureIds: [],
      deliveredCalciumDepositIds: [],
      maximumGlobalTotalBloodVolumeErrorMl: 0,
      maximumCoronaryBloodVolumeLedgerResidualMl: 0,
      maximumDynamicMcsConservationResidualMlPerSec: 0,
      allRawValuesFinite: true as const,
      oneComposedCalciumOwnerOnly: true as const,
      allDynamicMcsAcceptedFlowsExactlyZero: true as const,
    });
  }

  const boundaryAcceptedTimeSec =
    binding.windowPolicy.originAcceptedTimeSec +
    (window.windowIndex + 1) * binding.windowPolicy.durationSec;
  if (!(boundaryAcceptedTimeSec > sourceAcceptedTimeSec)) {
    throw new Error("V3 qualification candidate passed its window boundary");
  }
  let accepted = initial;
  let acceptedStepCount = 0;
  let nominalGridIndex = 1;
  let maximumGlobalTotalBloodVolumeErrorMl = 0;
  let maximumCoronaryBloodVolumeLedgerResidualMl = 0;
  let maximumDynamicMcsConservationResidualMlPerSec = 0;
  let oneComposedCalciumOwnerOnly = true;
  let allRawValuesFinite = true;
  let allDynamicMcsAcceptedFlowsExactlyZero = true;
  const acceptedAtrialCaptureIds: string[] = [];
  const acceptedVentricularCaptureIds: string[] = [];
  const deliveredCalciumDepositIds: string[] = [];
  const completedWindowIndices: number[] = [];

  while (accepted.acceptedTimeSec < boundaryAcceptedTimeSec) {
    if (
      acceptedStepCount >=
      MAIN_WIRE_INTEGRATED_MODEL_NUMERICAL_POLICY_V3.maximumAcceptedStepCountPerRun
    ) {
      throw new Error(
        "V3 qualification alignment exceeded accepted-step bound",
      );
    }
    const nominalTargetTimeSec = Math.min(
      boundaryAcceptedTimeSec,
      sourceAcceptedTimeSec + nominalGridIndex * nominalDtSec,
    );
    if (!(nominalTargetTimeSec > accepted.acceptedTimeSec)) {
      nominalGridIndex += 1;
      continue;
    }
    const maximum = limitMainWireIntegratedModelCandidateTimeV3(
      accepted,
      nominalTargetTimeSec,
      {
        configuration: fixture.rhythm.configuration,
        externalAfNextBoundaryTimeSec: null,
      },
      fixture.profile,
      fixture.config,
    );
    if (
      !(maximum.candidateTimeSec > accepted.acceptedTimeSec) ||
      maximum.candidateTimeSec > nominalTargetTimeSec
    ) {
      throw new Error(
        "V3 qualification alignment scheduler returned an invalid step",
      );
    }
    const acceptedDtSec = maximum.candidateTimeSec - accepted.acceptedTimeSec;
    const stepped = stepMainWireIntegratedModelV3(
      fixture.provider,
      accepted,
      stepInput(fixture, maximum.candidateTimeSec),
    );
    if (stepped.converged === false) {
      throw new Error(
        `V3 qualification alignment step failed at ${accepted.acceptedTimeSec}s: ${stepped.message}`,
      );
    }
    accepted = stepped.acceptedState;
    acceptedStepCount += 1;
    if (Math.abs(accepted.acceptedTimeSec - nominalTargetTimeSec) <= 1e-14) {
      nominalGridIndex += 1;
    }
    if (stepped.coronaryStep.autoregulationWindowCompleted) {
      const completion = stepped.coronaryStep.autoregulationCompletion;
      if (completion === null) {
        throw new Error(
          "V3 qualification completion flag lacks completion state",
        );
      }
      if (
        completion.windowIndex !== window.windowIndex ||
        completion.windowStartAcceptedTimeSec !==
          window.windowStartAcceptedTimeSec ||
        completion.windowEndAcceptedTimeSec !== boundaryAcceptedTimeSec ||
        !nearlyEqual(
          completion.aggregate.acceptedWindowDurationSec,
          fixture.cycleLengthSec,
        )
      ) {
        throw new Error("V3 qualification alignment window identity differs");
      }
      completedWindowIndices.push(completion.windowIndex);
    }
    const expectedCalcium = evaluateMainWireIntegratedModelCalciumDriveV3(
      accepted.composedRhythm,
    );
    oneComposedCalciumOwnerOnly =
      oneComposedCalciumOwnerOnly &&
      canonicalJsonStringify(expectedCalcium) ===
        canonicalJsonStringify(stepped.calciumDrive) &&
      canonicalJsonStringify(stepped.coronaryStep.baseStep.calciumDrive) ===
        canonicalJsonStringify(stepped.calciumDrive) &&
      !("generatedRhythmCalcium" in accepted) &&
      !("rhythmCalcium" in accepted) &&
      !("fixedPeriodicCalcium" in accepted);
    assertAllOffAcceptedQ(accepted);
    allDynamicMcsAcceptedFlowsExactlyZero =
      allDynamicMcsAcceptedFlowsExactlyZero &&
      Object.values(
        accepted.dynamicMechanicalSupport.acceptedFlowMlPerSec,
      ).every((value) => value === 0);
    const candidate = stepped.composedRhythmCandidate;
    if (candidate.capturedAtrialActivation !== null) {
      acceptedAtrialCaptureIds.push(
        candidate.capturedAtrialActivation.capturedActivationId,
      );
    }
    if (candidate.capturedVentricularActivation !== null) {
      acceptedVentricularCaptureIds.push(
        candidate.capturedVentricularActivation.capturedActivationId,
      );
    }
    deliveredCalciumDepositIds.push(
      ...candidate.deliveredCalciumDeposits.map((deposit) => deposit.depositId),
    );
    const sample = traceSample(
      0,
      acceptedStepCount,
      window.windowStartAcceptedTimeSec,
      fixture.cycleLengthSec,
      acceptedDtSec,
      stepped,
    );
    allRawValuesFinite = allRawValuesFinite && allNumericLeavesFinite(sample);
    maximumGlobalTotalBloodVolumeErrorMl = Math.max(
      maximumGlobalTotalBloodVolumeErrorMl,
      Math.abs(sample.diagnostics.totalBloodVolumeErrorMl),
    );
    maximumCoronaryBloodVolumeLedgerResidualMl = Math.max(
      maximumCoronaryBloodVolumeLedgerResidualMl,
      Math.abs(sample.diagnostics.coronaryBloodVolumeLedgerResidualMl),
    );
    maximumDynamicMcsConservationResidualMlPerSec = Math.max(
      maximumDynamicMcsConservationResidualMlPerSec,
      Math.abs(sample.diagnostics.dynamicMcsConservationResidualMlPerSec),
    );
  }

  if (
    accepted.acceptedTimeSec !== boundaryAcceptedTimeSec ||
    completedWindowIndices.length !== 1 ||
    completedWindowIndices[0] !== window.windowIndex
  ) {
    throw new Error("V3 qualification did not reach one exact window boundary");
  }
  if (!oneComposedCalciumOwnerOnly) {
    throw new Error(
      "V3 qualification alignment detected split calcium ownership",
    );
  }
  if (!allRawValuesFinite) {
    throw new Error("V3 qualification alignment contains nonfinite raw values");
  }
  if (!allDynamicMcsAcceptedFlowsExactlyZero) {
    throw new Error("V3 qualification alignment produced nonzero MCS q");
  }
  const tolerance =
    MAIN_WIRE_INTEGRATED_MODEL_NUMERICAL_POLICY_V3.invariantTolerance;
  if (
    maximumGlobalTotalBloodVolumeErrorMl >
      tolerance.globalTotalBloodVolumeErrorMl ||
    maximumCoronaryBloodVolumeLedgerResidualMl >
      tolerance.coronaryBloodVolumeLedgerResidualMl ||
    maximumDynamicMcsConservationResidualMlPerSec >
      tolerance.dynamicMcsConservationResidualMlPerSec
  ) {
    throw new Error(
      "V3 qualification alignment exceeds conservation tolerance",
    );
  }
  rejectDuplicateIds(
    new Set<string>(),
    acceptedAtrialCaptureIds,
    "alignment atrial capture",
  );
  rejectDuplicateIds(
    new Set<string>(),
    acceptedVentricularCaptureIds,
    "alignment ventricular capture",
  );
  rejectDuplicateIds(
    new Set<string>(),
    deliveredCalciumDepositIds,
    "alignment calcium deposit",
  );
  return deepFreeze({
    alignmentRequired: true,
    sourceAcceptedTimeSec,
    boundaryAcceptedTimeSec,
    acceptedStepCount,
    completedWindowIndex: window.windowIndex,
    terminalAcceptedState: accepted,
    acceptedAtrialCaptureIds,
    acceptedVentricularCaptureIds,
    deliveredCalciumDepositIds,
    maximumGlobalTotalBloodVolumeErrorMl,
    maximumCoronaryBloodVolumeLedgerResidualMl,
    maximumDynamicMcsConservationResidualMlPerSec,
    allRawValuesFinite: true as const,
    oneComposedCalciumOwnerOnly: true as const,
    allDynamicMcsAcceptedFlowsExactlyZero: true as const,
  });
}

/**
 * Executes one complete canonical regular-sinus/autoregulation cycle from an
 * already accepted coronary-window boundary. Unlike the cold-start experiment
 * loop, the boundary may occur at any absolute accepted time/window index.
 */
export function runMainWireIntegratedModelRegularSinusAllOffCycleV3(
  fixture: MainWireIntegratedModelRegularSinusAllOffFixtureV3,
  initial: AcceptedState,
  cycleIndex: number,
  nominalDtSec: number,
  acceptedStepObserver?: (step: SuccessfulStep) => void,
): MainWireIntegratedModelRegularSinusAllOffCycleRunV3 {
  assertPeriodicNominalDtSec(nominalDtSec);
  if (!Number.isSafeInteger(cycleIndex) || cycleIndex < 1) {
    throw new Error("V3 periodic cycle index must be a positive integer");
  }
  const window = initial.coronary.coronaryAutoregulation;
  const windowPolicy =
    initial.coronary.coronaryAutoregulationBinding.windowPolicy;
  const startTimeSec = initial.acceptedTimeSec;
  // The autoregulation owner defines the exact accepted boundary. Rebuilding
  // it by repeatedly adding a non-binary regular-sinus period can differ by a
  // few ulps and request a step across that boundary at non-integer rates.
  const endTimeSec = windowPolicy.originAcceptedTimeSec
    + (window.windowIndex + 1) * windowPolicy.durationSec;
  if (
    startTimeSec !== window.windowStartAcceptedTimeSec ||
    window.acceptedDurationSec !== 0 ||
    window.acceptedStepCount !== 0 ||
    !nearlyEqual(windowPolicy.durationSec, fixture.cycleLengthSec)
  ) {
    throw new Error(
      "V3 periodic continuation does not start on cycle boundary",
    );
  }
  const expectedWindowIndex = window.windowIndex;
  let accepted = initial;
  let acceptedStepCount = 0;
  let nominalGridIndex = 1;
  let maximumGlobalTotalBloodVolumeErrorMl = 0;
  let maximumCoronaryBloodVolumeLedgerResidualMl = 0;
  let maximumDynamicMcsConservationResidualMlPerSec = 0;
  let oneComposedCalciumOwnerOnly = true;
  let allRawValuesFinite = true;
  let allDynamicMcsAcceptedFlowsExactlyZero = true;
  const traceSamples: MainWireIntegratedModelPeriodicTerminalTraceSampleV3[] =
    [];
  const acceptedAtrialCaptureIds: string[] = [];
  const acceptedVentricularCaptureIds: string[] = [];
  const deliveredCalciumDepositIds: string[] = [];
  const completions: MainWireIntegratedModelPeriodicSteadyCycleV3["coronaryAutoregulationWindow"][] =
    [];

  while (accepted.acceptedTimeSec < endTimeSec) {
    if (
      acceptedStepCount >=
      MAIN_WIRE_INTEGRATED_MODEL_NUMERICAL_POLICY_V3.maximumAcceptedStepCountPerRun
    ) {
      throw new Error("V3 periodic cycle exceeded accepted-step bound");
    }
    const nominalTargetTimeSec = Math.min(
      endTimeSec,
      startTimeSec + nominalGridIndex * nominalDtSec,
    );
    const requestedStepSec = nominalTargetTimeSec - accepted.acceptedTimeSec;
    if (!(requestedStepSec > 0)) {
      nominalGridIndex += 1;
      continue;
    }
    const maximum = limitMainWireIntegratedModelCandidateTimeV3(
      accepted,
      nominalTargetTimeSec,
      {
        configuration: fixture.rhythm.configuration,
        externalAfNextBoundaryTimeSec: null,
      },
      fixture.profile,
      fixture.config,
    );
    if (
      !(maximum.candidateTimeSec > accepted.acceptedTimeSec) ||
      maximum.candidateTimeSec > nominalTargetTimeSec
    ) {
      throw new Error("V3 periodic scheduler returned an invalid step");
    }
    const acceptedDtSec = maximum.candidateTimeSec - accepted.acceptedTimeSec;
    const stepped = stepMainWireIntegratedModelV3(
      fixture.provider,
      accepted,
      stepInput(fixture, maximum.candidateTimeSec),
    );
    if (stepped.converged === false) {
      throw new Error(
        `V3 periodic step failed at ${accepted.acceptedTimeSec}s: ${stepped.message}`,
      );
    }
    accepted = stepped.acceptedState;
    acceptedStepObserver?.(stepped);
    acceptedStepCount += 1;
    if (Math.abs(accepted.acceptedTimeSec - nominalTargetTimeSec) <= 1e-14) {
      nominalGridIndex += 1;
    }
    if (stepped.coronaryStep.autoregulationWindowCompleted) {
      const completion = stepped.coronaryStep.autoregulationCompletion;
      if (completion === null) {
        throw new Error("V3 coronary completion flag lacks completion state");
      }
      completions.push(
        Object.freeze({
          windowIndex: completion.windowIndex,
          startTimeSec: completion.windowStartAcceptedTimeSec,
          endTimeSec: completion.windowEndAcceptedTimeSec,
          acceptedDurationSec: completion.aggregate.acceptedWindowDurationSec,
          acceptedStepCount: completion.acceptedStepCount,
        }),
      );
    }
    const expectedCalcium = evaluateMainWireIntegratedModelCalciumDriveV3(
      accepted.composedRhythm,
    );
    oneComposedCalciumOwnerOnly =
      oneComposedCalciumOwnerOnly &&
      canonicalJsonStringify(expectedCalcium) ===
        canonicalJsonStringify(stepped.calciumDrive) &&
      canonicalJsonStringify(stepped.coronaryStep.baseStep.calciumDrive) ===
        canonicalJsonStringify(stepped.calciumDrive) &&
      !("generatedRhythmCalcium" in accepted) &&
      !("rhythmCalcium" in accepted) &&
      !("fixedPeriodicCalcium" in accepted);
    assertAllOffAcceptedQ(accepted);
    allDynamicMcsAcceptedFlowsExactlyZero =
      allDynamicMcsAcceptedFlowsExactlyZero &&
      Object.values(
        accepted.dynamicMechanicalSupport.acceptedFlowMlPerSec,
      ).every((value) => value === 0);
    const candidate = stepped.composedRhythmCandidate;
    if (candidate.capturedAtrialActivation !== null) {
      acceptedAtrialCaptureIds.push(
        candidate.capturedAtrialActivation.capturedActivationId,
      );
    }
    if (candidate.capturedVentricularActivation !== null) {
      acceptedVentricularCaptureIds.push(
        candidate.capturedVentricularActivation.capturedActivationId,
      );
    }
    deliveredCalciumDepositIds.push(
      ...candidate.deliveredCalciumDeposits.map((deposit) => deposit.depositId),
    );
    const sample = traceSample(
      cycleIndex,
      acceptedStepCount,
      startTimeSec,
      fixture.cycleLengthSec,
      acceptedDtSec,
      stepped,
    );
    traceSamples.push(sample);
    allRawValuesFinite = allRawValuesFinite && allNumericLeavesFinite(sample);
    maximumGlobalTotalBloodVolumeErrorMl = Math.max(
      maximumGlobalTotalBloodVolumeErrorMl,
      Math.abs(sample.diagnostics.totalBloodVolumeErrorMl),
    );
    maximumCoronaryBloodVolumeLedgerResidualMl = Math.max(
      maximumCoronaryBloodVolumeLedgerResidualMl,
      Math.abs(sample.diagnostics.coronaryBloodVolumeLedgerResidualMl),
    );
    maximumDynamicMcsConservationResidualMlPerSec = Math.max(
      maximumDynamicMcsConservationResidualMlPerSec,
      Math.abs(sample.diagnostics.dynamicMcsConservationResidualMlPerSec),
    );
  }
  if (
    accepted.acceptedTimeSec !== endTimeSec ||
    completions.length !== 1 ||
    completions[0]!.windowIndex !== expectedWindowIndex ||
    completions[0]!.startTimeSec !== startTimeSec ||
    completions[0]!.endTimeSec !== endTimeSec ||
    !nearlyEqual(completions[0]!.acceptedDurationSec, fixture.cycleLengthSec)
  ) {
    throw new Error(
      "V3 periodic cycle/coronary window boundary differs: "
        + JSON.stringify({
          acceptedTimeSec: accepted.acceptedTimeSec,
          endTimeSec,
          expectedWindowIndex,
          completions,
        }),
    );
  }
  if (!oneComposedCalciumOwnerOnly) {
    throw new Error("V3 periodic cycle detected split calcium ownership");
  }
  if (!allRawValuesFinite) {
    throw new Error("V3 periodic cycle contains nonfinite raw values");
  }
  if (!allDynamicMcsAcceptedFlowsExactlyZero) {
    throw new Error("V3 all-off periodic cycle produced nonzero MCS q");
  }
  if (
    acceptedAtrialCaptureIds.length !== 1 ||
    acceptedVentricularCaptureIds.length !== 1 ||
    deliveredCalciumDepositIds.length !== 2
  ) {
    throw new Error("V3 regular-sinus cycle event identity count differs");
  }
  const tolerance =
    MAIN_WIRE_INTEGRATED_MODEL_NUMERICAL_POLICY_V3.invariantTolerance;
  if (
    maximumGlobalTotalBloodVolumeErrorMl >
      tolerance.globalTotalBloodVolumeErrorMl ||
    maximumCoronaryBloodVolumeLedgerResidualMl >
      tolerance.coronaryBloodVolumeLedgerResidualMl ||
    maximumDynamicMcsConservationResidualMlPerSec >
      tolerance.dynamicMcsConservationResidualMlPerSec
  ) {
    throw new Error("V3 periodic cycle exceeds conservation tolerance");
  }
  return deepFreeze({
    startTimeSec,
    endTimeSec,
    acceptedStepCount,
    terminalAcceptedState: accepted,
    traceSamples,
    coronaryAutoregulationWindow: completions[0]!,
    acceptedAtrialCaptureIds,
    acceptedVentricularCaptureIds,
    deliveredCalciumDepositIds,
    maximumGlobalTotalBloodVolumeErrorMl,
    maximumCoronaryBloodVolumeLedgerResidualMl,
    maximumDynamicMcsConservationResidualMlPerSec,
    allRawValuesFinite,
    oneComposedCalciumOwnerOnly,
    allDynamicMcsAcceptedFlowsExactlyZero,
  });
}

function buildCycleSummary(
  cycleIndex: number,
  run: MainWireIntegratedModelRegularSinusAllOffCycleRunV3,
  period1: MainWireIntegratedModelPeriodicClosureReportV3,
  period2: MainWireIntegratedModelPeriodicClosureReportV3 | null,
): MainWireIntegratedModelPeriodicSteadyCycleV3 {
  const tolerance =
    MAIN_WIRE_INTEGRATED_MODEL_NUMERICAL_POLICY_V3.invariantTolerance;
  const conservation = Object.freeze({
    maximumGlobalTotalBloodVolumeErrorMl:
      run.maximumGlobalTotalBloodVolumeErrorMl,
    maximumCoronaryBloodVolumeLedgerResidualMl:
      run.maximumCoronaryBloodVolumeLedgerResidualMl,
    maximumDynamicMcsConservationResidualMlPerSec:
      run.maximumDynamicMcsConservationResidualMlPerSec,
    withinInheritedConstructionTolerances:
      run.maximumGlobalTotalBloodVolumeErrorMl <=
        tolerance.globalTotalBloodVolumeErrorMl &&
      run.maximumCoronaryBloodVolumeLedgerResidualMl <=
        tolerance.coronaryBloodVolumeLedgerResidualMl &&
      run.maximumDynamicMcsConservationResidualMlPerSec <=
        tolerance.dynamicMcsConservationResidualMlPerSec,
  });
  const finiteAndEventIdentityChecks = Object.freeze({
    allRawValuesFinite: run.allRawValuesFinite,
    exactlyOneAtrialCapture: run.acceptedAtrialCaptureIds.length === 1,
    exactlyOneVentricularCapture:
      run.acceptedVentricularCaptureIds.length === 1,
    exactlyTwoDeliveredCalciumDeposits:
      run.deliveredCalciumDepositIds.length === 2,
    oneComposedCalciumOwnerOnly: run.oneComposedCalciumOwnerOnly,
    allDynamicMcsAcceptedFlowsExactlyZero:
      run.allDynamicMcsAcceptedFlowsExactlyZero,
    passed:
      run.allRawValuesFinite &&
      run.acceptedAtrialCaptureIds.length === 1 &&
      run.acceptedVentricularCaptureIds.length === 1 &&
      run.deliveredCalciumDepositIds.length === 2 &&
      run.oneComposedCalciumOwnerOnly &&
      run.allDynamicMcsAcceptedFlowsExactlyZero,
  });
  return deepFreeze({
    cycleIndex,
    startTimeSec: run.startTimeSec,
    endTimeSec: run.endTimeSec,
    acceptedStepCount: run.acceptedStepCount,
    coronaryAutoregulationWindow: run.coronaryAutoregulationWindow,
    period1,
    period2,
    period1MaximumNormalizedDelta: period1.overall.maximumNormalizedDelta,
    period2MaximumNormalizedDelta:
      period2?.overall.maximumNormalizedDelta ?? null,
    worstPeriod1Group: period1.overall.worstGroup,
    worstPeriod1Path: period1.overall.worstPath,
    acceptedAtrialCaptureIds: run.acceptedAtrialCaptureIds,
    acceptedVentricularCaptureIds: run.acceptedVentricularCaptureIds,
    deliveredCalciumDepositIds: run.deliveredCalciumDepositIds,
    conservation,
    finiteAndEventIdentityChecks,
    rawHealthyMetrics: rawHealthyMetrics(
      run.traceSamples,
      run.endTimeSec - run.startTimeSec,
    ),
  });
}

function traceSample(
  cycleIndex: number,
  acceptedStepIndexWithinCycle: number,
  cycleStartTimeSec: number,
  cycleLengthSec: number,
  acceptedDtSec: number,
  stepped: SuccessfulStep,
): MainWireIntegratedModelPeriodicTerminalTraceSampleV3 {
  const base = stepped.coronaryStep.baseStep;
  const circulation = base.circulationTrial;
  const pressures = circulation.nodeAbsolutePressuresMmHg;
  const volumes = circulation.candidateNodeVolumesMl;
  const valves = circulation.valveEvaluations;
  const hydraulics = base.coronaryTrial.diagnostics.hydraulics;
  const candidate = stepped.composedRhythmCandidate;
  return deepFreeze({
    cycleIndex,
    acceptedStepIndexWithinCycle,
    acceptedTimeSec: stepped.acceptedState.acceptedTimeSec,
    cyclePhase01:
      (stepped.acceptedState.acceptedTimeSec - cycleStartTimeSec) /
      cycleLengthSec,
    acceptedDtSec,
    chamberVolumeMl: {
      LA: volumes.LA,
      LV: volumes.LV,
      RA: volumes.RA,
      RV: volumes.RV,
    },
    absolutePressureMmHg: {
      LA: pressures.LA,
      LV: pressures.LV,
      RA: pressures.RA,
      RV: pressures.RV,
      Ao: pressures.Ao,
      PA: pressures.PA,
      PVein: pressures.PVein,
    },
    transmuralPressureMmHg: {
      LV: base.mechanicsTrial.transmuralPressuresMmHg.LV,
      RV: base.mechanicsTrial.transmuralPressuresMmHg.RV,
    },
    valveFlowMlPerSec: {
      MV: valves.MV.flowMlPerSec,
      AoV: valves.AoV.flowMlPerSec,
      TV: valves.TV.flowMlPerSec,
      PV: valves.PV.flowMlPerSec,
    },
    coronary: {
      totalInletFlowMlPerSec: hydraulics.totalInletFlowMlPerSec,
      ladSubendocardialQmFlowMlPerSec:
        hydraulics.layerQmInternalFlowMlPerSecByTerritory.LAD.subendocardial,
    },
    freeCalciumUMByWall: stepped.calciumDrive.freeCalciumUMByWall,
    dynamicMcsAcceptedFlowMlPerSec:
      stepped.acceptedState.dynamicMechanicalSupport.acceptedFlowMlPerSec,
    acceptedEventIdentity: {
      atrialCapturedActivationId:
        candidate.capturedAtrialActivation?.capturedActivationId ?? null,
      ventricularCapturedActivationId:
        candidate.capturedVentricularActivation?.capturedActivationId ?? null,
      deliveredCalciumDepositIds: candidate.deliveredCalciumDeposits.map(
        (deposit) => deposit.depositId,
      ),
      scheduledCalciumDepositIds: candidate.scheduledCalciumDeposits.map(
        (deposit) => deposit.depositId,
      ),
    },
    diagnostics: {
      mechanicsResidualNorm: base.mechanicsTrial.diagnostics.residualNorm,
      circulationScaledResidualInfinityNorm:
        circulation.diagnostics.finalScaledResidualInfinityNorm,
      maximumContinuityResidualMl:
        circulation.diagnostics.finalMaximumContinuityResidualMl,
      totalBloodVolumeErrorMl: circulation.diagnostics.totalBloodVolumeErrorMl,
      coronaryBloodVolumeLedgerResidualMl:
        base.coronaryTrial.diagnostics.exactBloodVolumeLedgerResidualMl,
      dynamicMcsConservationResidualMlPerSec:
        stepped.dynamicMechanicalSupportTrial.conservationResidualMlPerSec,
    },
  });
}

function rawHealthyMetrics(
  samples: readonly MainWireIntegratedModelPeriodicTerminalTraceSampleV3[],
  expectedCycleDurationSec: number,
): MainWireIntegratedModelHealthyReferenceProjectionV3["metric"] {
  if (samples.length === 0)
    throw new Error("healthy metrics require raw samples");
  const bsa =
    MAIN_WIRE_INTEGRATED_MODEL_HEALTHY_REFERENCE_CONTEXT_V3.referenceSubject
      .bodySurfaceAreaM2;
  const lvVolumes = samples.map((sample) => sample.chamberVolumeMl.LV);
  const lvEndDiastolicVolumeMl = Math.max(...lvVolumes);
  const lvEndSystolicVolumeMl = Math.min(...lvVolumes);
  const durationSec = samples.reduce(
    (sum, sample) => sum + sample.acceptedDtSec,
    0,
  );
  if (!nearlyEqual(durationSec, expectedCycleDurationSec)) {
    throw new Error("healthy metrics raw trace does not span one cycle");
  }
  const nativeAorticForwardVolumeMl = samples.reduce(
    (sum, sample) =>
      sum + Math.max(0, sample.valveFlowMlPerSec.AoV) * sample.acceptedDtSec,
    0,
  );
  const nativeAorticCardiacOutputLPerMin =
    (nativeAorticForwardVolumeMl * 60) / durationSec / 1_000;
  return deepFreeze({
    lvEndDiastolicVolumeMl,
    lvEndSystolicVolumeMl,
    lvEndDiastolicVolumeIndexMlPerM2: lvEndDiastolicVolumeMl / bsa,
    lvEndSystolicVolumeIndexMlPerM2: lvEndSystolicVolumeMl / bsa,
    lvEjectionFraction01:
      (lvEndDiastolicVolumeMl - lvEndSystolicVolumeMl) / lvEndDiastolicVolumeMl,
    nativeAorticForwardVolumeMl,
    nativeAorticCardiacOutputLPerMin,
    nativeAorticCardiacIndexLPerMinPerM2:
      nativeAorticCardiacOutputLPerMin / bsa,
    pulmonaryArterySystolicPressureMmHg: Math.max(
      ...samples.map((sample) => sample.absolutePressureMmHg.PA),
    ),
    leftAtrialTimeWeightedMeanPressureMmHg:
      samples.reduce(
        (sum, sample) =>
          sum + sample.absolutePressureMmHg.LA * sample.acceptedDtSec,
        0,
      ) / durationSec,
  });
}

function healthyReferenceProjection(
  trace: MainWireIntegratedModelPeriodicTerminalCycleTraceV3,
  executionPurpose: MainWireIntegratedModelPeriodicExecutionPurposeV3,
  numericalPeriod1Established: boolean,
): MainWireIntegratedModelHealthyReferenceProjectionV3 {
  const metric = rawHealthyMetrics(
    trace.samples,
    trace.endTimeSec - trace.startTimeSec,
  );
  const eligible =
    executionPurpose === "canonical-evidence" && numericalPeriod1Established;
  const valueByMetricId: Readonly<Record<string, number>> = Object.freeze({
    "hemodynamics.lv.edv_index_ml_per_m2":
      metric.lvEndDiastolicVolumeIndexMlPerM2,
    "hemodynamics.lv.esv_index_ml_per_m2":
      metric.lvEndSystolicVolumeIndexMlPerM2,
    "hemodynamics.lv.ejection_fraction_01": metric.lvEjectionFraction01,
    "hemodynamics.aortic.cardiac_index_l_per_min_per_m2":
      metric.nativeAorticCardiacIndexLPerMinPerM2,
    "hemodynamics.pressure.pulmonary_artery.systolic_mmhg":
      metric.pulmonaryArterySystolicPressureMmHg,
    "hemodynamics.pressure.left_atrium.mean_mmhg":
      metric.leftAtrialTimeWeightedMeanPressureMmHg,
  });
  const selectedGates =
    MAIN_WIRE_INTEGRATED_MODEL_HEALTHY_REFERENCE_CONTEXT_V3.gates.filter(
      (gate) => valueByMetricId[gate.metricId] !== undefined,
    );
  if (selectedGates.length !== 6) {
    throw new Error("healthy reference projection does not cover six gates");
  }
  return deepFreeze({
    projectionId:
      "main-wire-integrated-v3-terminal-cycle-healthy-reference-projection-v1" as const,
    referenceContextId:
      MAIN_WIRE_INTEGRATED_MODEL_HEALTHY_REFERENCE_CONTEXT_V3.contextId,
    referenceBodySurfaceAreaM2:
      MAIN_WIRE_INTEGRATED_MODEL_HEALTHY_REFERENCE_CONTEXT_V3.referenceSubject
        .bodySurfaceAreaM2,
    referenceBodySurfaceAreaProvenance:
      "MainWireIntegratedModelHealthyReferenceContextV3.resting-adult-research-reference" as const,
    metric,
    assessmentEligibility: {
      eligible,
      requirement:
        "canonical-evidence-and-numerical-period1-converged" as const,
      numericalPeriod1Established,
      executionPurpose,
    },
    gateResults: selectedGates.map((gate) =>
      gateResult(gate, valueByMetricId[gate.metricId]!, eligible),
    ),
    comparisonRole: "construction-context-not-independent-validation" as const,
    physiologyValidated: false as const,
    clinicalValidationClaimed: false as const,
  });
}

function gateResult(
  gate: MainWireIntegratedModelHealthyReferenceGateV3,
  value: number,
  eligible: boolean,
): MainWireIntegratedModelHealthyReferenceProjectionV3["gateResults"][number] {
  const within =
    (gate.lowerInclusive === null || value >= gate.lowerInclusive) &&
    (gate.upperInclusive === null || value <= gate.upperInclusive);
  return Object.freeze({
    gateId: gate.gateId,
    metricId: gate.metricId,
    value,
    lowerInclusive: gate.lowerInclusive,
    upperInclusive: gate.upperInclusive,
    status: !eligible
      ? ("not-assessed" as const)
      : within
        ? ("pass" as const)
        : ("fail" as const),
    sourceIds: gate.sourceIds,
  });
}

function createAllOffZeroInertanceProfileV3(): DynamicMechanicalSupportInertanceProfileV1 {
  const zero = Object.freeze({
    unitSystemId: DYNAMIC_ROTARY_PUMP_UNIT_SYSTEM_V1_ID,
    pumpInternalMmHgSec2PerMl: 0,
    drainageMmHgSec2PerMl: 0,
    oxygenatorMmHgSec2PerMl: 0,
    returnPathMmHgSec2PerMl: 0,
  }) satisfies DynamicRotaryPumpCircuitInertanceV1;
  return createDynamicMechanicalSupportInertanceProfileV1({
    profileId: "periodic-v3-explicit-all-off-zero-inertance-profile",
    profileBindingSha256: "0".repeat(64),
    deviceProfileBindingByDevice: Object.freeze({
      LVAD: allOffBinding("LVAD", "1"),
      IMPELLA: allOffBinding("IMPELLA", "2"),
      VA_ECMO: allOffBinding("VA_ECMO", "3"),
      VV_ECMO: allOffBinding("VV_ECMO", "4"),
    }),
    inertanceByDevice: Object.freeze({
      LVAD: zero,
      IMPELLA: zero,
      VA_ECMO: zero,
      VV_ECMO: zero,
    }),
  });
}

function allOffBinding(deviceId: RotarySupportDeviceIdV1, digit: string) {
  return createDynamicMechanicalSupportDeviceProfileBindingV1({
    deviceId,
    circuitProfileId: `periodic-v3-${deviceId.toLowerCase()}-all-off-zero-inertance`,
    circuitProfileBindingSha256: digit.repeat(64),
  });
}

function stepInput(
  fixture: MainWireIntegratedModelRegularSinusAllOffFixtureV3,
  candidateTimeSec: number,
): MainWireIntegratedModelStepInputV3 {
  return Object.freeze({
    candidateTimeSec,
    coronary: fixture.coronaryStepInput,
    rhythm: Object.freeze({
      configuration: fixture.rhythm.configuration,
      externalAfNextBoundaryTimeSec: null,
      externalAtrialSourceBatch: null,
    }),
    dynamicMechanicalSupport: fixture.dynamicMechanicalSupport,
  });
}

export function createMainWireIntegratedModelRegularSinusAllOffCheckpointContextV3(
  fixture: MainWireIntegratedModelCheckpointFixtureViewV3,
): MainWireIntegratedModelCheckpointContextV3<WallState> {
  return Object.freeze({
    provider: fixture.provider,
    coronaryPrior: fixture.coronaryStepInput.coronaryPrior,
    collapseHydraulics: fixture.coronaryStepInput.collapseHydraulics,
    impMechanism: fixture.coronaryStepInput.impMechanism,
    shorteningImpPrior: fixture.coronaryStepInput.shorteningImpPrior,
    coronaryAutoregulationBinding:
      fixture.cold.acceptedState.coronary.coronaryAutoregulationBinding,
    rhythm: Object.freeze({ configuration: fixture.rhythm.configuration }),
    dynamicMechanicalSupportProfile: fixture.profile,
    dynamicMechanicalSupportConfig: fixture.config,
    hemodynamicResearchInputs: fixture.hemodynamicResearchInputs,
  });
}

function resolveOptions(
  options: MainWireIntegratedModelPeriodicSteadyOptionsV3,
) {
  if (
    options === null ||
    typeof options !== "object" ||
    Array.isArray(options)
  ) {
    throw new Error("V3 periodic options must be an object");
  }
  const keys = Object.keys(options);
  if (
    keys.some(
      (key) =>
        ![
          "nominalDtSec",
          "maximumCycleCount",
          "executionPurpose",
          "hemodynamicResearchInputs",
          "ventricularContractilityScale",
          "mechanismResearchInputs",
        ].includes(key),
    )
  ) {
    throw new Error("V3 periodic options contain unexpected fields");
  }
  const policy = MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3;
  assertPeriodicNominalDtSec(options.nominalDtSec);
  const executionPurpose = options.executionPurpose ?? "canonical-evidence";
  if (
    executionPurpose !== "canonical-evidence" &&
    executionPurpose !== "bounded-smoke" &&
    executionPurpose !== "fixed-horizon-characterization"
  ) {
    throw new Error("unsupported V3 periodic execution purpose");
  }
  const maximumCycleCount =
    options.maximumCycleCount ??
    (executionPurpose === "bounded-smoke"
      ? policy.boundedSmokeDefaultMaximumCycleCount
      : policy.defaultMaximumCycleCount);
  const maximumAllowed =
    executionPurpose === "bounded-smoke"
      ? policy.boundedSmokeMaximumCycleCount
      : policy.maximumCycleCount;
  if (
    !Number.isSafeInteger(maximumCycleCount) ||
    maximumCycleCount < 1 ||
    maximumCycleCount > maximumAllowed
  ) {
    throw new RangeError(
      `maximumCycleCount must be an integer from 1 through ${maximumAllowed}`,
    );
  }
  return Object.freeze({
    nominalDtSec: options.nominalDtSec,
    maximumCycleCount,
    executionPurpose,
    hemodynamicResearchInputs:
      validateAndOwnMainWireIntegratedModelHemodynamicResearchInputsV3(
        options.hemodynamicResearchInputs ??
          MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
      ),
    ventricularContractilityScale: options.ventricularContractilityScale ?? 1,
    mechanismResearchInputs:
      validateAndOwnMainWireIntegratedModelMechanismResearchInputsV3(
        options.mechanismResearchInputs ??
          MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_MECHANISM_RESEARCH_INPUTS_V3,
      ),
  });
}

function assertPeriodicNominalDtSec(nominalDtSec: number): void {
  const policy = MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3;
  if (
    !Number.isFinite(nominalDtSec) ||
    nominalDtSec < policy.minimumNominalDtSec ||
    nominalDtSec > policy.maximumNominalDtSec
  ) {
    throw new RangeError(
      `nominalDtSec must be from ${policy.minimumNominalDtSec} through ${policy.maximumNominalDtSec}`,
    );
  }
}

function assertSelectedMatchedAlphaCompatibleCalciumScalesV1(
  chamberMechanics: MainWireIntegratedModelMechanismResearchInputsV3["chamberMechanics"],
): void {
  const nonUnitWalls = Object.entries(
    chamberMechanics.calciumDecayTimeScaleByWall,
  ).filter(([, scale]) => scale !== 1).map(([wallId]) => wallId);
  if (nonUnitWalls.length > 0) {
    throw new Error(
      "selected aortic-outflow fixture requires unit calcium decay-time "
        + "scales to preserve its fixed matched-alpha calcium law; "
        + `non-unit walls: ${nonUnitWalls.join(", ")}`,
    );
  }
}

function providerIdentity(provider: Provider) {
  return Object.freeze({
    contractId: provider.contractId,
    providerId: provider.providerId,
    parameterSetId: provider.parameterSetId,
    parameterIdentityHash: provider.parameterIdentityHash,
    stateSchemaVersion: provider.stateSchemaVersion,
  });
}

function assertAllOffConfig(config: MechanicalSupportConfigV1): void {
  if (
    config.lvad.enabled ||
    config.impella.enabled ||
    config.vaEcmo.enabled ||
    config.vvEcmo.enabled ||
    config.iabp.enabled
  ) {
    throw new Error("periodic V3 fixture requires all MCS devices disabled");
  }
}

function assertAllOffAcceptedQ(state: AcceptedState): void {
  if (
    !Object.values(state.dynamicMechanicalSupport.acceptedFlowMlPerSec).every(
      (value) => value === 0,
    )
  ) {
    throw new Error("periodic V3 all-off accepted q must be exactly zero");
  }
}

function rejectDuplicateIds(
  accepted: Set<string>,
  candidate: readonly string[],
  label: string,
): void {
  for (const id of candidate) {
    if (accepted.has(id)) throw new Error(`duplicate V3 ${label} identity`);
    accepted.add(id);
  }
}

function allNumericLeavesFinite(value: unknown): boolean {
  if (typeof value === "number") return Number.isFinite(value);
  if (value === null || typeof value !== "object") return true;
  return Object.values(value as Record<string, unknown>).every(
    allNumericLeavesFinite,
  );
}

function nearlyEqual(left: number, right: number): boolean {
  return (
    Math.abs(left - right) <=
    64 * Number.EPSILON * Math.max(1, Math.abs(left), Math.abs(right))
  );
}

function deepFreeze<T>(value: T): T {
  if (
    value !== null &&
    typeof value === "object" &&
    !ArrayBuffer.isView(value)
  ) {
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child);
    }
    Object.freeze(value);
  }
  return value;
}
