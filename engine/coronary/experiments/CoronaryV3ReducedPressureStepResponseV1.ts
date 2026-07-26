import {
  advanceCoronaryAcceptedAutoregulationV3,
  createCoronaryAcceptedAutoregulationStateV3,
  createCoronaryAutoregulationWindowBindingV3,
  createDefaultCoronaryAutoregulationWindowControlV3,
  maximumCoronaryAutoregulationStepDurationV3,
  type CoronaryAcceptedAutoregulationCompletionV3,
  type CoronaryAcceptedAutoregulationStateV3,
  type CoronaryAutoregulationWindowBindingV3,
  type CoronaryAutoregulationWindowControlV3,
} from "@/engine/coronary/acceptedAutoregulationWindowV3";
import {
  DEFAULT_CORONARY_BACKWARD_EULER_SOLVER_OPTIONS_V2,
  DEFAULT_CORONARY_PRESSURE_LADDER_INITIALIZER_OPTIONS_V2,
  NORMAL_CORONARY_DISEASE_INPUT_V2,
  buildCoronaryCollapseHydraulicsPriorV2,
  initializePressureLadderCoronaryStateV2,
  solveCoronaryBackwardEulerTrialV2,
  type CoronaryAcceptedHydraulicStateV2,
  type CoronaryBackwardEulerDiagnosticsV2,
  type CoronaryCollapseHydraulicsPriorV2,
  type CoronaryDiseaseInputV2,
  type CoronaryHydraulicBoundaryInputV2,
  type CoronaryPressureLadderInitializationV2,
} from "@/engine/coronary/backwardEulerCoronaryNetworkV2";
import {
  NORMAL_ADULT_CORONARY_TOPOLOGY_PRIOR_V2,
  buildCoronaryTopologyV2,
  coronaryConfigurationFingerprintV2,
  coronaryTopologyPriorFingerprintV2,
  initialCoronaryToneStateV2,
  type CoronaryTopologyPriorV2,
  type CoronaryTopologyV2,
} from "@/engine/coronary/topologyPriorV2";
import {
  CORONARY_LAYER_IDS_V2,
  CORONARY_TERRITORY_IDS_V2,
  type CoronaryTerritoryLayerRecordV2,
  type CoronaryTerritoryRecordV2,
  type CoronaryToneStateV2,
} from "@/engine/coronary/typesV2";
import type {
  CoronaryStepMeasurementStationV1,
  CoronaryStepResponseBeatV1,
  CoronaryStepResponseMetricsInputV1,
} from "@/engine/coronary/experiments/CoronaryV3StepResponseMetricsV1";

export const CORONARY_V3_REDUCED_PRESSURE_STEP_RESPONSE_V1_ID =
  "coronary-v3-fixed-imp-venous-boundary-pressure-step-v1" as const;

export const CORONARY_V3_REDUCED_PRESSURE_STEP_RESPONSE_CLAIM_V1 = Object.freeze({
  characterization:
    "fixed-imp-fixed-right-atrial-venous-boundary-pressure-flow-surrogate" as const,
  pressureProtocolMmHg: Object.freeze({ low: 80 as const, high: 100 as const }),
  directions: Object.freeze(["80-to-100", "100-to-80"] as const),
  boundaryConditions: Object.freeze({
    absoluteAorticPressureIsExternallyClamped: true as const,
    absoluteRightAtrialPressureIsExternallyClamped: true as const,
    perivascularExternalPressureIsFixed: true as const,
    intramyocardialPressureIsFixedByTerritoryLayer: true as const,
    demandScale: "normal-resting-one" as const,
    hyperemiaDrive: "zero" as const,
  }),
  observations: Object.freeze({
    flow: "summed-aortic-root-coronary-inlet-flow" as const,
    downstreamPressure: "fixed-right-atrial-boundary-pressure" as const,
    controllerFlow:
      "accepted-window-mean-layer-qm-internal-flow" as const,
    controllerPerfusionPressure:
      "accepted-window-mean-post-focal-lesion-minus-common-cv-pressure" as const,
    windowProxyIsBiologicalHeartbeat: false as const,
    subWindowInstantaneousPassiveExtremumResolved: false as const,
    passiveResponseResolution: "one-second-window-means-only" as const,
    rhythmSimulationIncluded: false as const,
    acceptedWindowInterpretation:
      "stationary-physical-time-use-of-irregular-rhythm-stationary-enum" as const,
  }),
  initializerAndSolverDefaultsUsedImplicitly: false as const,
  normalModelBindingRecorded: true as const,
  leftMainCannulaRepresented: false as const,
  distalZeroFlowWedgeRepresented: false as const,
  constantFlowBoundaryRepresented: false as const,
  dankelmanProtocolReproduced: false as const,
  parameterFittingApplied: false as const,
  biologicalValidationEstablished: false as const,
  physiologicalAcceptanceEstablished: false as const,
  independentValidationEstablished: false as const,
  clinicalValidationEstablished: false as const,
} as const);

export type CoronaryV3ReducedPressureModelBindingV1 = Readonly<{
  topologyPriorSource: "NORMAL_ADULT_CORONARY_TOPOLOGY_PRIOR_V2";
  topologyId: CoronaryTopologyPriorV2["topologyId"];
  constructionSeedSchemaId:
    CoronaryTopologyPriorV2["constructionSeedSchemaId"];
  topologyPriorFingerprint: string;
  diseaseSource: "NORMAL_CORONARY_DISEASE_INPUT_V2";
  normalDiseaseFingerprint: string;
  collapseHydraulicsConstruction:
    "buildCoronaryCollapseHydraulicsPriorV2-normal-topology-residual-area-0.10";
  collapseHydraulicsFingerprint: string;
  initialToneSource: "initialCoronaryToneStateV2-normal-prior";
  initialToneFingerprint: string;
  initializerOptionsSource:
    "DEFAULT_CORONARY_PRESSURE_LADDER_INITIALIZER_OPTIONS_V2-explicit";
  initializerOptionsFingerprint: string;
  backwardEulerSolverOptionsSource:
    "DEFAULT_CORONARY_BACKWARD_EULER_SOLVER_OPTIONS_V2-explicit";
  backwardEulerSolverOptionsFingerprint: string;
  autoregulationBindingId: CoronaryAutoregulationWindowBindingV3["bindingId"];
  autoregulationLaw: CoronaryAutoregulationWindowBindingV3["law"];
  autoregulationWindowInterpretation:
    CoronaryAutoregulationWindowBindingV3["windowPolicy"]["interpretation"];
  autoregulationPriorFingerprint: string;
  normalControlId: string;
  normalControlFingerprint: string;
}>;

export const CORONARY_V3_REDUCED_PRESSURE_STEP_MEASUREMENT_STATION_V1 =
  Object.freeze({
    kind: "venous-boundary-pressure-flow-surrogate",
    upstreamPressureStation: "fixed-reduced-network-aortic-boundary",
    flowStation: "summed-aortic-root-to-territory-inlet-flow",
    downstreamReferenceStation: "fixed-right-atrial-venous-boundary",
    reasonExactWedgeUnavailable:
      "the reduced component topology has neither a left-main perfusion line nor a distal zero-flow occlusion owner",
  } as const satisfies CoronaryStepMeasurementStationV1);

export type CoronaryV3ReducedPressureStepProtocolV1 = Readonly<{
  dtSec: number;
  acceptedAutoregulationWindowSec: number;
  baselineEquilibrationMaximumDurationSec: number;
  equilibriumRequiredConsecutiveWindows: number;
  equilibriumMaximumAbsoluteLogToneChangePerWindow: number;
  equilibriumMaximumAbsoluteLogQmTargetRatio: number;
  baselineObservationDurationSec: number;
  postStepObservationDurationSec: number;
  baselineMetricsWindowDurationSec: number;
  finalMetricsWindowDurationSec: number;
  fixedAbsoluteRightAtrialPressureMmHg: number;
  fixedPerivascularExternalPressureMmHg: number;
  fixedIntramyocardialPressureMmHgByTerritoryLayer:
    CoronaryTerritoryLayerRecordV2<number>;
  maximumAbsoluteInitializerContinuityResidualMlPerSec: number;
  maximumAbsoluteStepLedgerResidualMl: number;
  maximumAbsoluteNodeContinuityResidualMl: number;
}>;

export type CoronaryV3ReducedPressureEquilibriumWindowV1 = Readonly<{
  windowIndex: number;
  startTimeSec: number;
  endTimeSec: number;
  maximumAbsoluteLogToneChange: number;
  maximumAbsoluteLogQmTargetRatio: number;
  criteriaSatisfied: boolean;
}>;

export type CoronaryV3ReducedPressureBaselineCheckpointV1 = Readonly<{
  independentlyInitialized: true;
  baselineAorticPressureMmHg: 80 | 100;
  initializerDiagnostics: CoronaryPressureLadderInitializationV2["diagnostics"];
  acceptedHydraulicState: CoronaryAcceptedHydraulicStateV2;
  acceptedAutoregulationState: CoronaryAcceptedAutoregulationStateV3;
  equilibriumWindows: readonly CoronaryV3ReducedPressureEquilibriumWindowV1[];
  equilibriumCriteriaSatisfied: true;
  terminalConsecutiveSatisfiedWindowCount: number;
}>;

export type CoronaryV3ReducedPressureLayerWindowDiagnosticV1 = Readonly<{
  meanQmInternalFlowMlPerSec: number;
  demandTargetFlowMlPerSec: number;
  meanQmTargetRatio: number;
  endpointQmInternalFlowMlPerSec: number;
  endpointQmTargetRatio: number;
  startToneResistanceScale: number;
  proposedEndToneResistanceScale: number;
  appliedEndToneResistanceScale: number;
  boundedAt: "minimum" | "maximum" | "interior";
}>;

export type CoronaryV3ReducedPressureWindowDiagnosticV1 = Readonly<{
  beat: CoronaryStepResponseBeatV1;
  controlMode: "tone-active" | "tone-frozen";
  boundaryAorticPressureMmHg: 80 | 100;
  acceptedStepCount: number;
  minimumAcceptedStepDurationSec: number;
  maximumAcceptedStepDurationSec: number;
  layerByTerritory:
    CoronaryTerritoryLayerRecordV2<CoronaryV3ReducedPressureLayerWindowDiagnosticV1>;
  meanPostFocalLesionMinusCommonCvPressureMmHgByTerritory:
    CoronaryTerritoryRecordV2<number>;
  endpointPostFocalLesionMinusCommonCvPressureMmHgByTerritory:
    CoronaryTerritoryRecordV2<number>;
  endpointCommonCvPressureMmHg: number;
  startCoronaryBloodVolumeMl: number;
  endCoronaryBloodVolumeMl: number;
  signedBoundaryInletVolumeMl: number;
  signedBoundaryOutletVolumeMl: number;
  bloodVolumeLedgerResidualMl: number;
  sumOfStepLedgerResidualsMl: number;
  maximumAbsoluteStepLedgerResidualMl: number;
  maximumAbsoluteNodeContinuityResidualMl: number;
  allFinite: true;
  conservationToleranceSatisfied: true;
}>;

export type CoronaryV3ReducedPressureCharacterizationArmV1 = Readonly<{
  controlMode: "tone-active" | "tone-frozen";
  startedFromSharedDirectionCheckpoint: true;
  interventionTimeSec: number;
  baselineWindows: readonly CoronaryV3ReducedPressureWindowDiagnosticV1[];
  postStepWindows: readonly CoronaryV3ReducedPressureWindowDiagnosticV1[];
  allWindows: readonly CoronaryV3ReducedPressureWindowDiagnosticV1[];
  metricInput: CoronaryStepResponseMetricsInputV1;
  terminalHydraulicState: CoronaryAcceptedHydraulicStateV2;
  terminalAutoregulationState: CoronaryAcceptedAutoregulationStateV3;
  allFinite: true;
  conservationToleranceSatisfied: true;
  biologicalValidationEstablished: false;
  physiologicalAcceptanceEstablished: false;
}>;

export type CoronaryV3ReducedPressureStepDirectionV1 = Readonly<{
  direction: "80-to-100" | "100-to-80";
  baselineAorticPressureMmHg: 80 | 100;
  steppedAorticPressureMmHg: 80 | 100;
  baselineCheckpoint: CoronaryV3ReducedPressureBaselineCheckpointV1;
  toneActive: CoronaryV3ReducedPressureCharacterizationArmV1;
  toneFrozen: CoronaryV3ReducedPressureCharacterizationArmV1;
}>;

export type CoronaryV3ReducedPressureStepResponseV1 = Readonly<{
  characterizationId: typeof CORONARY_V3_REDUCED_PRESSURE_STEP_RESPONSE_V1_ID;
  claim: typeof CORONARY_V3_REDUCED_PRESSURE_STEP_RESPONSE_CLAIM_V1;
  modelBinding: CoronaryV3ReducedPressureModelBindingV1;
  protocol: CoronaryV3ReducedPressureStepProtocolV1;
  measurementStation: typeof CORONARY_V3_REDUCED_PRESSURE_STEP_MEASUREMENT_STATION_V1;
  up: CoronaryV3ReducedPressureStepDirectionV1;
  down: CoronaryV3ReducedPressureStepDirectionV1;
  baselinesInitializedIndependently: true;
  parameterFittingApplied: false;
  biologicalValidationEstablished: false;
  physiologicalAcceptanceEstablished: false;
}>;

type MutableRunStateV1 = {
  hydraulic: CoronaryAcceptedHydraulicStateV2;
  autoregulation: CoronaryAcceptedAutoregulationStateV3;
};

type ExplicitNormalModelV1 = Readonly<{
  prior: CoronaryTopologyPriorV2;
  topology: CoronaryTopologyV2;
  disease: CoronaryDiseaseInputV2;
  collapseHydraulics: CoronaryCollapseHydraulicsPriorV2;
  initialTone: CoronaryToneStateV2;
  control: CoronaryAutoregulationWindowControlV3;
  binding: CoronaryAutoregulationWindowBindingV3;
  outputBinding: CoronaryV3ReducedPressureModelBindingV1;
}>;

/**
 * Characterize the accepted coronary V3 component under fixed pressure
 * boundaries. This is intentionally not a whole-heart or cannulated-left-main
 * experiment. All protocol tolerances and durations are caller-owned inputs.
 */
export function runCoronaryV3ReducedPressureStepResponseV1(
  protocol: CoronaryV3ReducedPressureStepProtocolV1,
): CoronaryV3ReducedPressureStepResponseV1 {
  validateProtocol(protocol);
  const frozenProtocol = freezeProtocol(protocol);
  const model = createExplicitNormalModel(frozenProtocol);
  const lowCheckpoint = equilibrateIndependentBaseline(
    80,
    frozenProtocol,
    model,
  );
  const highCheckpoint = equilibrateIndependentBaseline(
    100,
    frozenProtocol,
    model,
  );
  return Object.freeze({
    characterizationId: CORONARY_V3_REDUCED_PRESSURE_STEP_RESPONSE_V1_ID,
    claim: CORONARY_V3_REDUCED_PRESSURE_STEP_RESPONSE_CLAIM_V1,
    modelBinding: model.outputBinding,
    protocol: frozenProtocol,
    measurementStation: CORONARY_V3_REDUCED_PRESSURE_STEP_MEASUREMENT_STATION_V1,
    up: characterizeDirection(
      "80-to-100",
      80,
      100,
      lowCheckpoint,
      frozenProtocol,
      model,
    ),
    down: characterizeDirection(
      "100-to-80",
      100,
      80,
      highCheckpoint,
      frozenProtocol,
      model,
    ),
    baselinesInitializedIndependently: true as const,
    parameterFittingApplied: false as const,
    biologicalValidationEstablished: false as const,
    physiologicalAcceptanceEstablished: false as const,
  });
}

function createExplicitNormalModel(
  protocol: CoronaryV3ReducedPressureStepProtocolV1,
): ExplicitNormalModelV1 {
  const prior = NORMAL_ADULT_CORONARY_TOPOLOGY_PRIOR_V2;
  const topology = buildCoronaryTopologyV2(prior);
  const disease = NORMAL_CORONARY_DISEASE_INPUT_V2;
  const collapseHydraulics = buildCoronaryCollapseHydraulicsPriorV2(
    topology,
    0.10,
  );
  const initialTone = initialCoronaryToneStateV2(prior);
  const control = createDefaultCoronaryAutoregulationWindowControlV3();
  const binding = createCoronaryAutoregulationWindowBindingV3({
    originAcceptedTimeSec: 0,
    durationSec: protocol.acceptedAutoregulationWindowSec,
    interpretation: "irregular-rhythm-stationary",
  });
  const outputBinding = Object.freeze({
    topologyPriorSource:
      "NORMAL_ADULT_CORONARY_TOPOLOGY_PRIOR_V2" as const,
    topologyId: prior.topologyId,
    constructionSeedSchemaId: prior.constructionSeedSchemaId,
    topologyPriorFingerprint: coronaryTopologyPriorFingerprintV2(prior),
    diseaseSource: "NORMAL_CORONARY_DISEASE_INPUT_V2" as const,
    normalDiseaseFingerprint:
      coronaryConfigurationFingerprintV2(disease),
    collapseHydraulicsConstruction:
      "buildCoronaryCollapseHydraulicsPriorV2-normal-topology-residual-area-0.10" as const,
    collapseHydraulicsFingerprint:
      coronaryConfigurationFingerprintV2(collapseHydraulics),
    initialToneSource: "initialCoronaryToneStateV2-normal-prior" as const,
    initialToneFingerprint: coronaryConfigurationFingerprintV2(initialTone),
    initializerOptionsSource:
      "DEFAULT_CORONARY_PRESSURE_LADDER_INITIALIZER_OPTIONS_V2-explicit" as const,
    initializerOptionsFingerprint: coronaryConfigurationFingerprintV2(
      DEFAULT_CORONARY_PRESSURE_LADDER_INITIALIZER_OPTIONS_V2,
    ),
    backwardEulerSolverOptionsSource:
      "DEFAULT_CORONARY_BACKWARD_EULER_SOLVER_OPTIONS_V2-explicit" as const,
    backwardEulerSolverOptionsFingerprint: coronaryConfigurationFingerprintV2(
      DEFAULT_CORONARY_BACKWARD_EULER_SOLVER_OPTIONS_V2,
    ),
    autoregulationBindingId: binding.bindingId,
    autoregulationLaw: binding.law,
    autoregulationWindowInterpretation:
      binding.windowPolicy.interpretation,
    autoregulationPriorFingerprint: binding.priorFingerprint,
    normalControlId: control.controlId,
    normalControlFingerprint: coronaryConfigurationFingerprintV2(control),
  }) satisfies CoronaryV3ReducedPressureModelBindingV1;
  return Object.freeze({
    prior,
    topology,
    disease,
    collapseHydraulics,
    initialTone,
    control,
    binding,
    outputBinding,
  });
}

function equilibrateIndependentBaseline(
  pressureMmHg: 80 | 100,
  protocol: CoronaryV3ReducedPressureStepProtocolV1,
  model: ExplicitNormalModelV1,
): CoronaryV3ReducedPressureBaselineCheckpointV1 {
  const initialized = initializePressureLadderCoronaryStateV2({
    boundary: makeBoundary(pressureMmHg, protocol),
    disease: model.disease,
    toneResistanceScaleByTerritoryLayer: model.initialTone,
    collapseHydraulics: model.collapseHydraulics,
    options: DEFAULT_CORONARY_PRESSURE_LADDER_INITIALIZER_OPTIONS_V2,
  }, model.prior, model.topology);
  requireFiniteNumbers(
    initialized.diagnostics,
    "coronary pressure-ladder initializer diagnostics",
  );
  if (initialized.diagnostics.maximumAbsoluteNodeContinuityResidualMlPerSec
      > protocol.maximumAbsoluteInitializerContinuityResidualMlPerSec) {
    throw new Error(
      "coronary pressure-ladder initializer continuity tolerance exceeded",
    );
  }
  const state: MutableRunStateV1 = {
    hydraulic: initialized.acceptedState,
    autoregulation: createCoronaryAcceptedAutoregulationStateV3(model.binding, {
      acceptedTimeSec: 0,
      revision: 0,
    }),
  };
  const maximumWindowCount = exactWindowCount(
    protocol.baselineEquilibrationMaximumDurationSec,
    protocol.acceptedAutoregulationWindowSec,
    "baselineEquilibrationMaximumDurationSec",
  );
  const evidence: CoronaryV3ReducedPressureEquilibriumWindowV1[] = [];
  let consecutive = 0;
  for (let index = 0; index < maximumWindowCount; index += 1) {
    const window = advanceOneWindow(
      state,
      pressureMmHg,
      "tone-active",
      protocol,
      model,
      index,
    );
    const maximumAbsoluteLogQmTargetRatio = maximumLayerValue(
      window.layerByTerritory,
      (layer) => Math.abs(Math.log(layer.meanQmTargetRatio)),
    );
    const maximumAbsoluteLogToneChange = maximumLayerValue(
      window.layerByTerritory,
      (layer) => Math.abs(Math.log(
        layer.proposedEndToneResistanceScale
          / layer.startToneResistanceScale,
      )),
    );
    const criteriaSatisfied = maximumAbsoluteLogQmTargetRatio
        <= protocol.equilibriumMaximumAbsoluteLogQmTargetRatio
      && maximumAbsoluteLogToneChange
        <= protocol.equilibriumMaximumAbsoluteLogToneChangePerWindow;
    consecutive = criteriaSatisfied ? consecutive + 1 : 0;
    evidence.push(Object.freeze({
      windowIndex: index,
      startTimeSec: window.beat.startTimeSec,
      endTimeSec: window.beat.endTimeSec,
      maximumAbsoluteLogToneChange,
      maximumAbsoluteLogQmTargetRatio,
      criteriaSatisfied,
    }));
    if (consecutive >= protocol.equilibriumRequiredConsecutiveWindows) {
      return Object.freeze({
        independentlyInitialized: true as const,
        baselineAorticPressureMmHg: pressureMmHg,
        initializerDiagnostics: initialized.diagnostics,
        acceptedHydraulicState: state.hydraulic,
        acceptedAutoregulationState: state.autoregulation,
        equilibriumWindows: Object.freeze(evidence),
        equilibriumCriteriaSatisfied: true as const,
        terminalConsecutiveSatisfiedWindowCount: consecutive,
      });
    }
  }
  throw new Error(
    `coronary ${pressureMmHg} mmHg baseline did not satisfy the explicit equilibrium criteria within the supplied horizon`,
  );
}

function characterizeDirection(
  direction: "80-to-100" | "100-to-80",
  baselinePressure: 80 | 100,
  steppedPressure: 80 | 100,
  checkpoint: CoronaryV3ReducedPressureBaselineCheckpointV1,
  protocol: CoronaryV3ReducedPressureStepProtocolV1,
  model: ExplicitNormalModelV1,
): CoronaryV3ReducedPressureStepDirectionV1 {
  return Object.freeze({
    direction,
    baselineAorticPressureMmHg: baselinePressure,
    steppedAorticPressureMmHg: steppedPressure,
    baselineCheckpoint: checkpoint,
    toneActive: characterizeArm(
      checkpoint,
      baselinePressure,
      steppedPressure,
      "tone-active",
      protocol,
      model,
    ),
    toneFrozen: characterizeArm(
      checkpoint,
      baselinePressure,
      steppedPressure,
      "tone-frozen",
      protocol,
      model,
    ),
  });
}

function characterizeArm(
  checkpoint: CoronaryV3ReducedPressureBaselineCheckpointV1,
  baselinePressure: 80 | 100,
  steppedPressure: 80 | 100,
  controlMode: "tone-active" | "tone-frozen",
  protocol: CoronaryV3ReducedPressureStepProtocolV1,
  model: ExplicitNormalModelV1,
): CoronaryV3ReducedPressureCharacterizationArmV1 {
  const state: MutableRunStateV1 = {
    hydraulic: checkpoint.acceptedHydraulicState,
    autoregulation: checkpoint.acceptedAutoregulationState,
  };
  const baselineCount = exactWindowCount(
    protocol.baselineObservationDurationSec,
    protocol.acceptedAutoregulationWindowSec,
    "baselineObservationDurationSec",
  );
  const postCount = exactWindowCount(
    protocol.postStepObservationDurationSec,
    protocol.acceptedAutoregulationWindowSec,
    "postStepObservationDurationSec",
  );
  const baselineWindows: CoronaryV3ReducedPressureWindowDiagnosticV1[] = [];
  for (let index = 0; index < baselineCount; index += 1) {
    baselineWindows.push(advanceOneWindow(
      state,
      baselinePressure,
      controlMode,
      protocol,
      model,
      index,
    ));
  }
  const interventionTimeSec = state.hydraulic.acceptedTimeSec;
  const postStepWindows: CoronaryV3ReducedPressureWindowDiagnosticV1[] = [];
  for (let index = 0; index < postCount; index += 1) {
    postStepWindows.push(advanceOneWindow(
      state,
      steppedPressure,
      controlMode,
      protocol,
      model,
      baselineCount + index,
    ));
  }
  const allWindows = Object.freeze([...baselineWindows, ...postStepWindows]);
  const baselineMetricStart = interventionTimeSec
    - protocol.baselineMetricsWindowDurationSec;
  const finalTime = state.hydraulic.acceptedTimeSec;
  const metricInput = Object.freeze({
    interventionTimeSec,
    baselineWindow: Object.freeze({
      startTimeSec: baselineMetricStart,
      endTimeSec: interventionTimeSec,
    }),
    finalWindow: Object.freeze({
      startTimeSec: finalTime - protocol.finalMetricsWindowDurationSec,
      endTimeSec: finalTime,
    }),
    persistenceBeatCount: 3 as const,
    measurementStation:
      CORONARY_V3_REDUCED_PRESSURE_STEP_MEASUREMENT_STATION_V1,
    beats: Object.freeze(allWindows.map((window) => window.beat)),
  }) satisfies CoronaryStepResponseMetricsInputV1;
  return Object.freeze({
    controlMode,
    startedFromSharedDirectionCheckpoint: true as const,
    interventionTimeSec,
    baselineWindows: Object.freeze(baselineWindows),
    postStepWindows: Object.freeze(postStepWindows),
    allWindows,
    metricInput,
    terminalHydraulicState: state.hydraulic,
    terminalAutoregulationState: state.autoregulation,
    allFinite: true as const,
    conservationToleranceSatisfied: true as const,
    biologicalValidationEstablished: false as const,
    physiologicalAcceptanceEstablished: false as const,
  });
}

function advanceOneWindow(
  state: MutableRunStateV1,
  pressureMmHg: 80 | 100,
  controlMode: "tone-active" | "tone-frozen",
  protocol: CoronaryV3ReducedPressureStepProtocolV1,
  model: ExplicitNormalModelV1,
  beatIndex: number,
): CoronaryV3ReducedPressureWindowDiagnosticV1 {
  const boundary = makeBoundary(pressureMmHg, protocol);
  const startTimeSec = state.hydraulic.acceptedTimeSec;
  const startVolume = totalCoronaryVolume(state.hydraulic);
  const startTone = state.hydraulic.toneResistanceScaleByTerritoryLayer;
  let acceptedStepCount = 0;
  let minimumAcceptedStepDurationSec = Number.POSITIVE_INFINITY;
  let maximumAcceptedStepDurationSec = 0;
  let integratedInletVolume = 0;
  let integratedOutletVolume = 0;
  let sumOfStepLedgerResiduals = 0;
  let maximumAbsoluteStepLedgerResidual = 0;
  let maximumAbsoluteNodeContinuityResidual = 0;
  let integratedInletFlow = 0;
  let integratedBloodVolume = 0;
  let completion: CoronaryAcceptedAutoregulationCompletionV3 | null = null;
  let finalDiagnostics: CoronaryBackwardEulerDiagnosticsV2 | null = null;
  while (completion === null) {
    const maximumDt = maximumCoronaryAutoregulationStepDurationV3(
      model.binding,
      state.autoregulation,
      state.hydraulic.acceptedTimeSec,
    );
    if (!(maximumDt > 0)) {
      throw new Error("coronary accepted window has no positive remaining time");
    }
    const dtSec = Math.min(protocol.dtSec, maximumDt);
    const trial = solveCoronaryBackwardEulerTrialV2(state.hydraulic, {
      dtSec,
      boundary,
      disease: model.disease,
      collapseHydraulics: model.collapseHydraulics,
      solverOptions: DEFAULT_CORONARY_BACKWARD_EULER_SOLVER_OPTIONS_V2,
    }, model.prior, model.topology);
    validateStepDiagnostics(trial.diagnostics, protocol);
    const hydraulics = trial.diagnostics.hydraulics;
    const advanced = advanceCoronaryAcceptedAutoregulationV3(
      model.binding,
      state.autoregulation,
      state.hydraulic.toneResistanceScaleByTerritoryLayer,
      {
        previousAcceptedTimeSec: state.hydraulic.acceptedTimeSec,
        candidateAcceptedTimeSec:
          trial.candidateAcceptedState.acceptedTimeSec,
        candidateRevision: trial.candidateAcceptedState.revision,
        finalQmInternalFlowMlPerSecByTerritoryLayer:
          hydraulics.layerQmInternalFlowMlPerSecByTerritory,
        finalPostFocalLesionPressureMmHgByTerritory:
          hydraulics.postFocalLesionAbsolutePressureMmHgByTerritory,
        finalCommonCoronaryVenousPressureMmHg:
          hydraulics.absolutePressureMmHgByNode.CV,
        control: model.control,
        topologyPrior: model.prior,
      },
    );
    const appliedTone = advanced.completedWindow !== null
        && controlMode === "tone-active"
      ? advanced.nextToneResistanceScaleByTerritoryLayer
      : state.hydraulic.toneResistanceScaleByTerritoryLayer;
    state.hydraulic = freezeHydraulicStateWithTone(
      trial.candidateAcceptedState,
      appliedTone,
    );
    state.autoregulation = advanced.nextState;
    completion = advanced.completedWindow;
    finalDiagnostics = trial.diagnostics;
    acceptedStepCount += 1;
    minimumAcceptedStepDurationSec = Math.min(
      minimumAcceptedStepDurationSec,
      dtSec,
    );
    maximumAcceptedStepDurationSec = Math.max(
      maximumAcceptedStepDurationSec,
      dtSec,
    );
    integratedInletVolume += trial.diagnostics.signedBoundaryInletVolumeMl;
    integratedOutletVolume += trial.diagnostics.signedBoundaryOutletVolumeMl;
    sumOfStepLedgerResiduals +=
      trial.diagnostics.exactBloodVolumeLedgerResidualMl;
    maximumAbsoluteStepLedgerResidual = Math.max(
      maximumAbsoluteStepLedgerResidual,
      Math.abs(trial.diagnostics.exactBloodVolumeLedgerResidualMl),
    );
    maximumAbsoluteNodeContinuityResidual = Math.max(
      maximumAbsoluteNodeContinuityResidual,
      trial.diagnostics.maximumAbsoluteNodeContinuityResidualMl,
    );
    integratedInletFlow += dtSec * hydraulics.totalInletFlowMlPerSec;
    integratedBloodVolume += dtSec
      * trial.diagnostics.candidateCoronaryBloodVolumeMl;
  }
  if (finalDiagnostics === null) {
    throw new Error("coronary accepted window completed without diagnostics");
  }
  const endTimeSec = state.hydraulic.acceptedTimeSec;
  const durationSec = endTimeSec - startTimeSec;
  const endVolume = totalCoronaryVolume(state.hydraulic);
  const ledgerResidual = endVolume - startVolume
    - (integratedInletVolume - integratedOutletVolume);
  if (Math.abs(ledgerResidual)
      > protocol.maximumAbsoluteStepLedgerResidualMl * acceptedStepCount) {
    throw new Error("coronary window blood-volume ledger tolerance exceeded");
  }
  const finalHydraulics = finalDiagnostics.hydraulics;
  const layerByTerritory = mapLayerRecord((territoryId, layerId) => {
    const layerStep = completion!.toneStep
      .layerStepByTerritoryLayer[territoryId][layerId];
    const endpointQm = finalHydraulics
      .layerQmInternalFlowMlPerSecByTerritory[territoryId][layerId];
    const appliedEndTone = state.hydraulic
      .toneResistanceScaleByTerritoryLayer[territoryId][layerId];
    return Object.freeze({
      meanQmInternalFlowMlPerSec: layerStep.achievedMeanTissueFlowMlPerSec,
      demandTargetFlowMlPerSec: layerStep.demandTargetFlowMlPerSec,
      meanQmTargetRatio:
        layerStep.achievedMeanTissueFlowMlPerSec
        / layerStep.demandTargetFlowMlPerSec,
      endpointQmInternalFlowMlPerSec: endpointQm,
      endpointQmTargetRatio: endpointQm / layerStep.demandTargetFlowMlPerSec,
      startToneResistanceScale: startTone[territoryId][layerId],
      proposedEndToneResistanceScale: layerStep.nextResistanceScale,
      appliedEndToneResistanceScale: appliedEndTone,
      boundedAt: layerStep.boundedAt,
    });
  });
  const meanPostFocalMinusCv = completion.aggregate
    .meanPerfusionPressureMmHgByTerritory;
  const endpointPostFocalMinusCv = mapTerritoryRecord((territoryId) =>
    finalHydraulics.postFocalLesionAbsolutePressureMmHgByTerritory[territoryId]
      - finalHydraulics.absolutePressureMmHgByNode.CV);
  const meanInletFlow = integratedInletFlow / durationSec;
  if (!(meanInletFlow > 0)) {
    throw new Error("coronary surrogate P/Q requires positive mean inlet flow");
  }
  const beat = Object.freeze({
    beatIndex,
    startTimeSec,
    endTimeSec,
    meanUpstreamPressureMmHg: pressureMmHg,
    meanDownstreamReferencePressureMmHg:
      protocol.fixedAbsoluteRightAtrialPressureMmHg,
    meanObservedFlowMlPerSec: meanInletFlow,
    meanCoronaryBloodVolumeMl: integratedBloodVolume / durationSec,
  }) satisfies CoronaryStepResponseBeatV1;
  const diagnostic = Object.freeze({
    beat,
    controlMode,
    boundaryAorticPressureMmHg: pressureMmHg,
    acceptedStepCount,
    minimumAcceptedStepDurationSec,
    maximumAcceptedStepDurationSec,
    layerByTerritory,
    meanPostFocalLesionMinusCommonCvPressureMmHgByTerritory:
      meanPostFocalMinusCv,
    endpointPostFocalLesionMinusCommonCvPressureMmHgByTerritory:
      endpointPostFocalMinusCv,
    endpointCommonCvPressureMmHg:
      finalHydraulics.absolutePressureMmHgByNode.CV,
    startCoronaryBloodVolumeMl: startVolume,
    endCoronaryBloodVolumeMl: endVolume,
    signedBoundaryInletVolumeMl: integratedInletVolume,
    signedBoundaryOutletVolumeMl: integratedOutletVolume,
    bloodVolumeLedgerResidualMl: ledgerResidual,
    sumOfStepLedgerResidualsMl: sumOfStepLedgerResiduals,
    maximumAbsoluteStepLedgerResidualMl:
      maximumAbsoluteStepLedgerResidual,
    maximumAbsoluteNodeContinuityResidualMl:
      maximumAbsoluteNodeContinuityResidual,
    allFinite: true as const,
    conservationToleranceSatisfied: true as const,
  }) satisfies CoronaryV3ReducedPressureWindowDiagnosticV1;
  validateWindowFinite(diagnostic);
  return diagnostic;
}

function validateStepDiagnostics(
  diagnostics: CoronaryBackwardEulerDiagnosticsV2,
  protocol: CoronaryV3ReducedPressureStepProtocolV1,
): void {
  if (!diagnostics.converged) {
    throw new Error("coronary backward-Euler trial did not converge");
  }
  if (Math.abs(diagnostics.exactBloodVolumeLedgerResidualMl)
      > protocol.maximumAbsoluteStepLedgerResidualMl) {
    throw new Error("coronary step blood-volume ledger tolerance exceeded");
  }
  if (diagnostics.maximumAbsoluteNodeContinuityResidualMl
      > protocol.maximumAbsoluteNodeContinuityResidualMl) {
    throw new Error("coronary step node-continuity tolerance exceeded");
  }
  requireFiniteNumbers(diagnostics, "coronary backward-Euler diagnostics");
}

function validateWindowFinite(
  diagnostic: CoronaryV3ReducedPressureWindowDiagnosticV1,
): void {
  requireFiniteNumbers(diagnostic, "coronary characterization window");
}

function makeBoundary(
  pressureMmHg: 80 | 100,
  protocol: CoronaryV3ReducedPressureStepProtocolV1,
): CoronaryHydraulicBoundaryInputV2 {
  return Object.freeze({
    absoluteAorticPressureMmHg: pressureMmHg,
    absoluteRightAtrialPressureMmHg:
      protocol.fixedAbsoluteRightAtrialPressureMmHg,
    perivascularExternalPressureMmHg:
      protocol.fixedPerivascularExternalPressureMmHg,
    intramyocardialPressureMmHgByTerritoryLayer:
      protocol.fixedIntramyocardialPressureMmHgByTerritoryLayer,
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

function totalCoronaryVolume(state: CoronaryAcceptedHydraulicStateV2): number {
  return Object.values(state.volumeMlByNode).reduce(
    (sum, volume) => sum + volume,
    0,
  );
}

function maximumLayerValue<T>(
  record: CoronaryTerritoryLayerRecordV2<T>,
  value: (entry: T) => number,
): number {
  let maximum = Number.NEGATIVE_INFINITY;
  for (const territoryId of CORONARY_TERRITORY_IDS_V2) {
    for (const layerId of CORONARY_LAYER_IDS_V2) {
      maximum = Math.max(maximum, value(record[territoryId][layerId]));
    }
  }
  return maximum;
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

function mapTerritoryRecord<T>(
  map: (territoryId: (typeof CORONARY_TERRITORY_IDS_V2)[number]) => T,
): CoronaryTerritoryRecordV2<T> {
  return Object.freeze(Object.fromEntries(CORONARY_TERRITORY_IDS_V2.map(
    (territoryId) => [territoryId, map(territoryId)],
  ))) as CoronaryTerritoryRecordV2<T>;
}

function exactWindowCount(
  durationSec: number,
  windowSec: number,
  label: string,
): number {
  const count = durationSec / windowSec;
  if (!Number.isSafeInteger(count) || count <= 0) {
    throw new RangeError(`${label} must be a positive integer window count`);
  }
  return count;
}

function validateProtocol(protocol: CoronaryV3ReducedPressureStepProtocolV1): void {
  assertPlainObject(protocol, "coronary step protocol");
  assertExactKeys(protocol, [
    "dtSec",
    "acceptedAutoregulationWindowSec",
    "baselineEquilibrationMaximumDurationSec",
    "equilibriumRequiredConsecutiveWindows",
    "equilibriumMaximumAbsoluteLogToneChangePerWindow",
    "equilibriumMaximumAbsoluteLogQmTargetRatio",
    "baselineObservationDurationSec",
    "postStepObservationDurationSec",
    "baselineMetricsWindowDurationSec",
    "finalMetricsWindowDurationSec",
    "fixedAbsoluteRightAtrialPressureMmHg",
    "fixedPerivascularExternalPressureMmHg",
    "fixedIntramyocardialPressureMmHgByTerritoryLayer",
    "maximumAbsoluteInitializerContinuityResidualMlPerSec",
    "maximumAbsoluteStepLedgerResidualMl",
    "maximumAbsoluteNodeContinuityResidualMl",
  ], "coronary step protocol");
  for (const [label, value] of Object.entries({
    dtSec: protocol.dtSec,
    acceptedAutoregulationWindowSec:
      protocol.acceptedAutoregulationWindowSec,
    baselineEquilibrationMaximumDurationSec:
      protocol.baselineEquilibrationMaximumDurationSec,
    equilibriumMaximumAbsoluteLogToneChangePerWindow:
      protocol.equilibriumMaximumAbsoluteLogToneChangePerWindow,
    equilibriumMaximumAbsoluteLogQmTargetRatio:
      protocol.equilibriumMaximumAbsoluteLogQmTargetRatio,
    baselineObservationDurationSec: protocol.baselineObservationDurationSec,
    postStepObservationDurationSec: protocol.postStepObservationDurationSec,
    baselineMetricsWindowDurationSec:
      protocol.baselineMetricsWindowDurationSec,
    finalMetricsWindowDurationSec: protocol.finalMetricsWindowDurationSec,
    maximumAbsoluteInitializerContinuityResidualMlPerSec:
      protocol.maximumAbsoluteInitializerContinuityResidualMlPerSec,
    maximumAbsoluteStepLedgerResidualMl:
      protocol.maximumAbsoluteStepLedgerResidualMl,
    maximumAbsoluteNodeContinuityResidualMl:
      protocol.maximumAbsoluteNodeContinuityResidualMl,
  })) requirePositiveFinite(value, label);
  if (protocol.acceptedAutoregulationWindowSec !== 1) {
    throw new RangeError(
      "stage-one coronary step characterization requires an explicit 1 s accepted window",
    );
  }
  if (protocol.dtSec > protocol.acceptedAutoregulationWindowSec) {
    throw new RangeError("dtSec cannot exceed the accepted window duration");
  }
  if (!Number.isSafeInteger(protocol.equilibriumRequiredConsecutiveWindows)
    || protocol.equilibriumRequiredConsecutiveWindows <= 0) {
    throw new RangeError(
      "equilibriumRequiredConsecutiveWindows must be a positive safe integer",
    );
  }
  exactWindowCount(
    protocol.baselineEquilibrationMaximumDurationSec,
    protocol.acceptedAutoregulationWindowSec,
    "baselineEquilibrationMaximumDurationSec",
  );
  exactWindowCount(
    protocol.baselineObservationDurationSec,
    protocol.acceptedAutoregulationWindowSec,
    "baselineObservationDurationSec",
  );
  exactWindowCount(
    protocol.postStepObservationDurationSec,
    protocol.acceptedAutoregulationWindowSec,
    "postStepObservationDurationSec",
  );
  exactWindowCount(
    protocol.baselineMetricsWindowDurationSec,
    protocol.acceptedAutoregulationWindowSec,
    "baselineMetricsWindowDurationSec",
  );
  exactWindowCount(
    protocol.finalMetricsWindowDurationSec,
    protocol.acceptedAutoregulationWindowSec,
    "finalMetricsWindowDurationSec",
  );
  if (protocol.baselineMetricsWindowDurationSec
      > protocol.baselineObservationDurationSec) {
    throw new RangeError("baseline metric window exceeds baseline observation");
  }
  if (protocol.finalMetricsWindowDurationSec
      > protocol.postStepObservationDurationSec) {
    throw new RangeError("final metric window exceeds post-step observation");
  }
  if (protocol.postStepObservationDurationSec < 5) {
    throw new RangeError(
      "post-step observation must cover the five-second passive-extremum window",
    );
  }
  requireFinite(
    protocol.fixedAbsoluteRightAtrialPressureMmHg,
    "fixedAbsoluteRightAtrialPressureMmHg",
  );
  requireFinite(
    protocol.fixedPerivascularExternalPressureMmHg,
    "fixedPerivascularExternalPressureMmHg",
  );
  if (protocol.fixedAbsoluteRightAtrialPressureMmHg >= 80) {
    throw new RangeError(
      "fixed right-atrial pressure must remain below both aortic step pressures",
    );
  }
  validateLayerFiniteRecord(
    protocol.fixedIntramyocardialPressureMmHgByTerritoryLayer,
    "fixed intramyocardial pressure",
  );
}

function freezeProtocol(
  protocol: CoronaryV3ReducedPressureStepProtocolV1,
): CoronaryV3ReducedPressureStepProtocolV1 {
  return Object.freeze({
    ...protocol,
    fixedIntramyocardialPressureMmHgByTerritoryLayer: mapLayerRecord(
      (territoryId, layerId) => protocol
        .fixedIntramyocardialPressureMmHgByTerritoryLayer[territoryId][layerId],
    ),
  });
}

function validateLayerFiniteRecord(
  record: CoronaryTerritoryLayerRecordV2<number>,
  label: string,
): void {
  assertPlainObject(record, label);
  assertExactKeys(record, CORONARY_TERRITORY_IDS_V2, label);
  for (const territoryId of CORONARY_TERRITORY_IDS_V2) {
    assertPlainObject(record[territoryId], `${label} ${territoryId}`);
    assertExactKeys(record[territoryId], CORONARY_LAYER_IDS_V2, label);
    for (const layerId of CORONARY_LAYER_IDS_V2) {
      requireFinite(record[territoryId][layerId], `${label} ${territoryId}.${layerId}`);
    }
  }
}

function requireFiniteNumbers(value: unknown, label: string): void {
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error(`${label} contains nonfinite data`);
    return;
  }
  if (value === null || typeof value !== "object") return;
  for (const nested of Object.values(value)) {
    requireFiniteNumbers(nested, label);
  }
}

function requireFinite(value: number, label: string): void {
  if (!Number.isFinite(value)) throw new RangeError(`${label} must be finite`);
}

function requirePositiveFinite(value: number, label: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${label} must be finite and positive`);
  }
}

function assertPlainObject(value: unknown, label: string): asserts value is object {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${label} must be a plain object`);
  }
}

function assertExactKeys(
  value: object,
  expectedKeys: readonly string[],
  label: string,
): void {
  const actual = Object.keys(value).sort();
  const expected = [...expectedKeys].sort();
  if (actual.length !== expected.length
    || actual.some((key, index) => key !== expected[index])) {
    throw new Error(`${label} keys mismatch`);
  }
}
