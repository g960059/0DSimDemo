import type {
  MainWireIntegratedModelObservationV3,
  MainWireIntegratedModelPresentationAdvanceV3,
} from "@/engine/myocardium/MainWireIntegratedModelSessionV3";
import {
  MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_COUNT_V1,
  MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_LAYOUT_V1,
  MAIN_WIRE_FIVE_WALL_ACCEPTED_READBACK_ABSOLUTE_PRESSURE_ORDER_V1,
  MAIN_WIRE_FIVE_WALL_ACCEPTED_READBACK_CHAMBER_ORDER_V1,
  MAIN_WIRE_FIVE_WALL_ACCEPTED_READBACK_VALVE_ORDER_V1,
} from "@/engine/myocardium/MainWireFiveWallCoronaryTransactionV2";
import {
  evaluateOxygenTransportV1,
  type OxygenTransportEvaluationV1,
} from "@/engine/physiology/oxygenTransportV1";

export const MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_REGISTRY_V3_ID =
  "main-wire-integrated-model-output-registry-v10" as const;
export const MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_REGISTRY_V3_SCHEMA_VERSION =
  8 as const;
export const MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_FRAME_V3_ID =
  "main-wire-integrated-model-output-frame-v10" as const;

const MMHG_ML_TO_MILLIJOULE_V1 = 0.133322;

// PVA-owned derived outputs only. The familiar LVSW output remains owned by
// completed-beat path work and must not be overridden by an analysis snapshot.
export const MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_PVA_OUTPUT_IDS_V1 =
  Object.freeze({
    potentialEnergyMilliJoule:
      "myocardium.energy.potential.LV-pressure-volume-area" as const,
    pressureVolumeAreaMilliJoule:
      "myocardium.energy.pressure-volume-area.LV" as const,
    estimatedMvo2PerBeatPer100G:
      "oxygen.consumption.estimated-myocardial.LV-per-beat-per-100g" as const,
    estimatedMvo2PerMinPer100G:
      "oxygen.consumption.estimated-myocardial.LV-per-min-per-100g" as const,
  });

export const MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_PVA_ANALYSIS_OUTPUT_IDS_V1 =
  Object.freeze([
    MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_PVA_OUTPUT_IDS_V1.potentialEnergyMilliJoule,
    MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_PVA_OUTPUT_IDS_V1.pressureVolumeAreaMilliJoule,
    MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_PVA_OUTPUT_IDS_V1.estimatedMvo2PerBeatPer100G,
    MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_PVA_OUTPUT_IDS_V1.estimatedMvo2PerMinPer100G,
  ] as const);

export type MainWireIntegratedModelOutputUnitV3 =
  | "1"
  | "bpm"
  | "L/min"
  | "mL"
  | "mL O2/dL"
  | "mL O2/beat/100g"
  | "mL O2/min"
  | "mL O2/min/100g"
  | "mL/mmHg"
  | "mmHg*min/L"
  | "mmHg*mL"
  | "mmHg*mL/s"
  | "mJ"
  | "mmHg"
  | "mmHg/s"
  | "mL/s";

export type MainWireIntegratedModelOutputQuantityKindV3 =
  | "volume"
  | "pressure"
  | "pressure-rate"
  | "flow"
  | "phase"
  | "rate"
  | "work"
  | "power"
  | "energy"
  | "oxygen-content"
  | "oxygen-rate"
  | "resistance"
  | "compliance"
  | "derived";

export type MainWireIntegratedModelOutputSourceKindV3 =
  | "accepted-state"
  | "accepted-step-readback"
  | "completed-beat"
  | "analysis-result";

export type MainWireIntegratedModelOutputDefinitionV3<
  TId extends string = string,
> = Readonly<{
  outputId: TId;
  kind: "signal" | "metric";
  quantityKind: MainWireIntegratedModelOutputQuantityKindV3;
  unit: MainWireIntegratedModelOutputUnitV3;
  modelingStatus: "modeled";
  sourceKind: MainWireIntegratedModelOutputSourceKindV3;
  sourcePath: string;
  significantDigits: number;
  scope?: "beat" | "window";
  dependencies?: readonly string[];
}>;

export const MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_CATALOG_V3 = Object.freeze([
  ...(["LA", "LV", "RA", "RV"] as const).map((chamber) =>
    definition(
      `hemodynamics.volume.${chamber}` as const,
      "volume",
      "mL",
      "accepted-state",
      `accepted.coronary.circulation.nodeVolumesMl.${chamber}`,
    ),
  ),
  ...(["LA", "LV", "RA", "RV"] as const).map((chamber) =>
    definition(
      `hemodynamics.pressure.absolute.${chamber}` as const,
      "pressure",
      "mmHg",
      "accepted-step-readback",
      `step.coronaryStep.baseStep.circulationTrial.nodeAbsolutePressuresMmHg.${chamber}`,
    ),
  ),
  ...(["LA", "LV", "RA", "RV"] as const).map((chamber) =>
    definition(
      `hemodynamics.pressure.transmural.${chamber}` as const,
      "pressure",
      "mmHg",
      "accepted-step-readback",
      `step.coronaryStep.baseStep.mechanicsTrial.transmuralPressuresMmHg.${chamber}`,
    ),
  ),
  ...(["Ao", "SA", "PA", "PVein", "VC"] as const).map((vessel) =>
    definition(
      `hemodynamics.pressure.absolute.${vessel}` as const,
      "pressure",
      "mmHg",
      "accepted-step-readback",
      `step.coronaryStep.baseStep.circulationTrial.nodeAbsolutePressuresMmHg.${vessel}`,
    ),
  ),
  ...(["MV", "AoV", "TV", "PV"] as const).map((valve) =>
    definition(
      `hemodynamics.flow.valve.${valve}` as const,
      "flow",
      "mL/s",
      "accepted-step-readback",
      `step.coronaryStep.baseStep.circulationTrial.valveEvaluations.${valve}.flowMlPerSec`,
    ),
  ),
  definition(
    "hemodynamics.flow.systemic.SA_Art",
    "flow",
    "mL/s",
    "accepted-step-readback",
    "step.coronaryStep.baseStep.circulationTrial.edgeFlowsMlPerSec.SA_Art",
  ),
  definition(
    "hemodynamics.flow.pulmonary.PA_PArt",
    "flow",
    "mL/s",
    "accepted-step-readback",
    "step.coronaryStep.baseStep.circulationTrial.edgeFlowsMlPerSec.PA_PArt",
  ),
  definition(
    "hemodynamics.flow.venous.VC_RA",
    "flow",
    "mL/s",
    "accepted-step-readback",
    "step.coronaryStep.baseStep.circulationTrial.edgeFlowsMlPerSec.VC_RA",
  ),
  definition(
    "hemodynamics.flow.venous.PVein_LA",
    "flow",
    "mL/s",
    "accepted-step-readback",
    "step.coronaryStep.baseStep.circulationTrial.edgeFlowsMlPerSec.PVein_LA",
  ),
  definition(
    "pericardium.pressure.excess",
    "pressure",
    "mmHg",
    "accepted-step-readback",
    "step.coronaryStep.baseStep.pericardium.excessPressureMmHg",
  ),
  definition(
    "pericardium.volume.heart",
    "volume",
    "mL",
    "accepted-step-readback",
    "step.coronaryStep.baseStep.pericardium.heartVolumeM3*1e6",
  ),
  definition(
    "pericardium.volume.fluid",
    "volume",
    "mL",
    "accepted-step-readback",
    "step.coronaryStep.baseStep.pericardium.prescribedPericardialFluidVolumeM3*1e6",
  ),
  definition(
    "pericardium.volume.total-occupied",
    "volume",
    "mL",
    "accepted-step-readback",
    "step.coronaryStep.baseStep.pericardium.totalOccupiedVolumeM3*1e6",
  ),
  definition(
    "pericardium.energy.stored",
    "energy",
    "mJ",
    "accepted-step-readback",
    "step.coronaryStep.baseStep.pericardium.storedEnergyJ*1e3",
  ),
  definition(
    "respiration.pressure.pleural",
    "pressure",
    "mmHg",
    "accepted-state",
    "observation.runtimeSignals.pleuralPressureMmHg",
  ),
  definition(
    "respiration.pressure.alveolar",
    "pressure",
    "mmHg",
    "accepted-state",
    "observation.runtimeSignals.alveolarPressureMmHg",
  ),
  definition(
    "rhythm.heart-rate.instantaneous",
    "rate",
    "bpm",
    "accepted-state",
    "derive.60/accepted.composedRhythm.regularAtrialSourceState.configuration.cycleLengthSec",
  ),
  definition(
    "coronary.flow.total",
    "flow",
    "mL/s",
    "accepted-step-readback",
    "step.coronaryStep.baseStep.coronaryTrial.diagnostics.hydraulics.totalInletFlowMlPerSec",
  ),
  definition(
    "coronary.flow.inlet.LAD",
    "flow",
    "mL/s",
    "accepted-step-readback",
    "step.coronaryStep.baseStep.coronaryTrial.diagnostics.hydraulics.inletFlowMlPerSecByTerritory.LAD",
  ),
  definition(
    "coronary.flow.inlet.LCx",
    "flow",
    "mL/s",
    "accepted-step-readback",
    "step.coronaryStep.baseStep.coronaryTrial.diagnostics.hydraulics.inletFlowMlPerSecByTerritory.LCx",
  ),
  definition(
    "coronary.flow.inlet.RCA",
    "flow",
    "mL/s",
    "accepted-step-readback",
    "step.coronaryStep.baseStep.coronaryTrial.diagnostics.hydraulics.inletFlowMlPerSecByTerritory.RCA",
  ),
  definition(
    "coronary.flow.venous-outlet",
    "flow",
    "mL/s",
    "accepted-step-readback",
    "step.coronaryStep.baseStep.coronaryTrial.diagnostics.hydraulics.commonCoronaryVenousOutletFlowMlPerSec",
  ),
  ...(["LAD", "LCx", "RCA"] as const).flatMap((territory) => [
    definition(
      `coronary.flow.large-arterial-outflow.${territory}` as const,
      "flow",
      "mL/s",
      "accepted-step-readback",
      `step.coronaryStep.baseStep.coronaryTrial.diagnostics.hydraulics.largeArterialOutflowMlPerSecByTerritory.${territory}`,
    ),
    definition(
      `coronary.flow.large-arterial-storage-rate.${territory}` as const,
      "flow",
      "mL/s",
      "accepted-step-readback",
      `step.coronaryStep.baseStep.coronaryTrial.diagnostics.hydraulics.largeArterialStorageRateMlPerSecByTerritory.${territory}`,
    ),
  ]),
  ...(["LAD", "LCx", "RCA"] as const).flatMap((territory) =>
    (["subepicardial", "subendocardial"] as const).flatMap((layer) => [
      definition(
        `coronary.flow.layer-r1.${territory}.${layer}` as const,
        "flow",
        "mL/s",
        "accepted-step-readback",
        `step.coronaryStep.baseStep.coronaryTrial.diagnostics.hydraulics.layerR1FlowMlPerSecByTerritory.${territory}.${layer}`,
      ),
      definition(
        `coronary.flow.layer-qm-internal.${territory}.${layer}` as const,
        "flow",
        "mL/s",
        "accepted-step-readback",
        `step.coronaryStep.baseStep.coronaryTrial.diagnostics.hydraulics.layerQmInternalFlowMlPerSecByTerritory.${territory}.${layer}`,
      ),
      definition(
        `coronary.flow.layer-r2.${territory}.${layer}` as const,
        "flow",
        "mL/s",
        "accepted-step-readback",
        `step.coronaryStep.baseStep.coronaryTrial.diagnostics.hydraulics.layerR2FlowMlPerSecByTerritory.${territory}.${layer}`,
      ),
      definition(
        `coronary.tone-resistance-scale.${territory}.${layer}` as const,
        "derived",
        "1",
        "accepted-step-readback",
        `step.coronaryStep.baseStep.coronaryTrial.diagnostics.hydraulics.effectiveToneResistanceScaleByTerritoryLayer.${territory}.${layer}`,
      ),
    ]),
  ),
  ...(["LAD", "LCx", "RCA"] as const).flatMap((territory) => [
    definition(
      `coronary.pressure.post-focal.${territory}` as const,
      "pressure",
      "mmHg",
      "accepted-step-readback",
      `step.coronaryStep.baseStep.coronaryTrial.diagnostics.hydraulics.postFocalLesionAbsolutePressureMmHgByTerritory.${territory}`,
    ),
    definition(
      `coronary.pressure-loss.focal.${territory}` as const,
      "pressure",
      "mmHg",
      "accepted-step-readback",
      `step.coronaryStep.baseStep.coronaryTrial.diagnostics.hydraulics.focalStenosisPressureLossMmHgByTerritory.${territory}`,
    ),
  ]),
  definition(
    "coronary.power.dissipated.total",
    "power",
    "mmHg*mL/s",
    "accepted-step-readback",
    "step.coronaryStep.baseStep.coronaryTrial.diagnostics.hydraulics.totalDissipatedPowerMmHgMlPerSec",
  ),
  definition(
    "device.LVAD.flow",
    "flow",
    "mL/s",
    "accepted-state",
    "accepted.dynamicMechanicalSupport.acceptedFlowMlPerSec.LVAD",
  ),
  definition(
    "rhythm.phase.regular-sinus",
    "phase",
    "1",
    "accepted-state",
    "derive.regularSinusPhase01(accepted.composedRhythm.acceptedTimeSec,accepted.composedRhythm.regularAtrialSourceState.nextActivationTimeSec,accepted.composedRhythm.regularAtrialSourceState.configuration.cycleLengthSec)",
  ),
  metricDefinition(
    "hemodynamics.pressure.mean.Ao",
    "pressure",
    "mmHg",
    ["hemodynamics.pressure.absolute.Ao"],
    "completedBeatMetrics.pressureSummaries.Ao.timeWeightedMeanMmHg",
  ),
  metricDefinition(
    "hemodynamics.pressure.systolic.Ao",
    "pressure",
    "mmHg",
    ["hemodynamics.pressure.absolute.Ao"],
    "completedBeatMetrics.pressureSummaries.Ao.maximumMmHg",
  ),
  metricDefinition(
    "hemodynamics.pressure.diastolic.Ao",
    "pressure",
    "mmHg",
    ["hemodynamics.pressure.absolute.Ao"],
    "completedBeatMetrics.pressureSummaries.Ao.minimumMmHg",
  ),
  metricDefinition(
    "hemodynamics.pressure.pulse.Ao",
    "pressure",
    "mmHg",
    ["hemodynamics.pressure.systolic.Ao", "hemodynamics.pressure.diastolic.Ao"],
    "completedBeatMetrics.pressureSummaries.Ao.pulseMmHg",
  ),
  ...(["SA", "PA"] as const).flatMap((node) => [
    metricDefinition(
      `hemodynamics.pressure.mean.${node}` as const,
      "pressure",
      "mmHg",
      [`hemodynamics.pressure.absolute.${node}`],
      `completedBeatMetrics.pressureSummaries.${node}.timeWeightedMeanMmHg`,
    ),
    metricDefinition(
      `hemodynamics.pressure.systolic.${node}` as const,
      "pressure",
      "mmHg",
      [`hemodynamics.pressure.absolute.${node}`],
      `completedBeatMetrics.pressureSummaries.${node}.maximumMmHg`,
    ),
    metricDefinition(
      `hemodynamics.pressure.diastolic.${node}` as const,
      "pressure",
      "mmHg",
      [`hemodynamics.pressure.absolute.${node}`],
      `completedBeatMetrics.pressureSummaries.${node}.minimumMmHg`,
    ),
    metricDefinition(
      `hemodynamics.pressure.pulse.${node}` as const,
      "pressure",
      "mmHg",
      [
        `hemodynamics.pressure.systolic.${node}`,
        `hemodynamics.pressure.diastolic.${node}`,
      ],
      `completedBeatMetrics.pressureSummaries.${node}.pulseMmHg`,
    ),
  ]),
  metricDefinition(
    "hemodynamics.pressure.mean.PVein",
    "pressure",
    "mmHg",
    ["hemodynamics.pressure.absolute.PVein"],
    "completedBeatMetrics.pressureSummaries.PVein.timeWeightedMeanMmHg",
  ),
  metricDefinition(
    "hemodynamics.pressure.mean.VC",
    "pressure",
    "mmHg",
    ["hemodynamics.pressure.absolute.VC"],
    "completedBeatMetrics.pressureSummaries.VC.timeWeightedMeanMmHg",
  ),
  metricDefinition(
    "hemodynamics.pressure.mean.LA",
    "pressure",
    "mmHg",
    ["hemodynamics.pressure.absolute.LA"],
    "completedBeatMetrics.pressureSummaries.LA.timeWeightedMeanMmHg",
  ),
  metricDefinition(
    "hemodynamics.pressure.mean.RA",
    "pressure",
    "mmHg",
    ["hemodynamics.pressure.absolute.RA"],
    "completedBeatMetrics.pressureSummaries.RA.timeWeightedMeanMmHg",
  ),
  ...(["LV", "RV"] as const).map((ventricle) =>
    metricDefinition(
      `hemodynamics.pressure.systolic.${ventricle}` as const,
      "pressure",
      "mmHg",
      [`hemodynamics.pressure.absolute.${ventricle}`],
      `completedBeatMetrics.pressureSummaries.${ventricle}.maximumMmHg`,
    ),
  ),
  metricDefinition(
    "hemodynamics.pressure-gradient.mean.systemic-circuit",
    "pressure",
    "mmHg",
    ["hemodynamics.pressure.mean.SA", "hemodynamics.pressure.mean.RA"],
    "derive.completedBeatMetrics.pressureSummaries.SA.mean-minus-RA.mean",
  ),
  metricDefinition(
    "hemodynamics.pressure-gradient.mean.pulmonary-circuit",
    "pressure",
    "mmHg",
    ["hemodynamics.pressure.mean.PA", "hemodynamics.pressure.mean.PVein"],
    "derive.completedBeatMetrics.pressureSummaries.PA.mean-minus-PVein.mean",
  ),
  metricDefinition(
    "hemodynamics.volume.maximum.LV",
    "volume",
    "mL",
    ["hemodynamics.volume.LV"],
    "completedBeatMetrics.maximumLeftVentricularVolumeMl",
  ),
  metricDefinition(
    "hemodynamics.volume.minimum.LV",
    "volume",
    "mL",
    ["hemodynamics.volume.LV"],
    "completedBeatMetrics.minimumLeftVentricularVolumeMl",
  ),
  metricDefinition(
    "hemodynamics.stroke-volume.LV-extrema",
    "derived",
    "mL",
    ["hemodynamics.volume.maximum.LV", "hemodynamics.volume.minimum.LV"],
    "completedBeatMetrics.extremaLeftVentricularStrokeVolumeMl",
  ),
  metricDefinition(
    "hemodynamics.ejection-fraction.LV-extrema",
    "derived",
    "1",
    ["hemodynamics.volume.maximum.LV", "hemodynamics.volume.minimum.LV"],
    "completedBeatMetrics.extremaLeftVentricularEjectionFraction01",
  ),
  ...(
    [
      {
        ventricle: "LV",
        inletValve: "MV",
        semilunarValve: "AoV",
        source: "leftVentricularValveEventMetrics",
      },
      {
        ventricle: "RV",
        inletValve: "TV",
        semilunarValve: "PV",
        source: "rightVentricularValveEventMetrics",
      },
    ] as const
  ).flatMap(({ ventricle, inletValve, semilunarValve, source }) => [
    metricDefinition(
      `hemodynamics.volume.end-diastolic.${ventricle}-at-${inletValve}-closure` as const,
      "volume",
      "mL",
      [
        `hemodynamics.volume.${ventricle}`,
        `hemodynamics.flow.valve.${inletValve}`,
      ],
      `completedBeatMetrics.${source}.endDiastolic.volumeMl`,
    ),
    metricDefinition(
      `hemodynamics.pressure.absolute.end-diastolic.${ventricle}-at-${inletValve}-closure` as const,
      "pressure",
      "mmHg",
      [
        `hemodynamics.pressure.absolute.${ventricle}`,
        `hemodynamics.flow.valve.${inletValve}`,
      ],
      `completedBeatMetrics.${source}.endDiastolic.absolutePressureMmHg`,
    ),
    metricDefinition(
      `hemodynamics.pressure.transmural.end-diastolic.${ventricle}-at-${inletValve}-closure` as const,
      "pressure",
      "mmHg",
      [
        `hemodynamics.pressure.transmural.${ventricle}`,
        `hemodynamics.flow.valve.${inletValve}`,
      ],
      `completedBeatMetrics.${source}.endDiastolic.transmuralPressureMmHg`,
    ),
    metricDefinition(
      `hemodynamics.volume.end-systolic.${ventricle}-at-${semilunarValve}-closure` as const,
      "volume",
      "mL",
      [
        `hemodynamics.volume.${ventricle}`,
        `hemodynamics.flow.valve.${semilunarValve}`,
      ],
      `completedBeatMetrics.${source}.endSystolic.volumeMl`,
    ),
    metricDefinition(
      `hemodynamics.pressure.absolute.end-systolic.${ventricle}-at-${semilunarValve}-closure` as const,
      "pressure",
      "mmHg",
      [
        `hemodynamics.pressure.absolute.${ventricle}`,
        `hemodynamics.flow.valve.${semilunarValve}`,
      ],
      `completedBeatMetrics.${source}.endSystolic.absolutePressureMmHg`,
    ),
    metricDefinition(
      `hemodynamics.pressure.transmural.end-systolic.${ventricle}-at-${semilunarValve}-closure` as const,
      "pressure",
      "mmHg",
      [
        `hemodynamics.pressure.transmural.${ventricle}`,
        `hemodynamics.flow.valve.${semilunarValve}`,
      ],
      `completedBeatMetrics.${source}.endSystolic.transmuralPressureMmHg`,
    ),
    metricDefinition(
      `hemodynamics.stroke-volume.${ventricle}-event-defined` as const,
      "derived",
      "mL",
      [
        `hemodynamics.volume.end-diastolic.${ventricle}-at-${inletValve}-closure`,
        `hemodynamics.volume.end-systolic.${ventricle}-at-${semilunarValve}-closure`,
      ],
      `completedBeatMetrics.${source}.eventDefinedStrokeVolumeMl`,
    ),
    metricDefinition(
      `hemodynamics.ejection-fraction.${ventricle}-event-defined` as const,
      "derived",
      "1",
      [
        `hemodynamics.stroke-volume.${ventricle}-event-defined`,
        `hemodynamics.volume.end-diastolic.${ventricle}-at-${inletValve}-closure`,
      ],
      `completedBeatMetrics.${source}.eventDefinedEjectionFraction01`,
    ),
  ]),
  ...(["MV", "AoV", "TV", "PV"] as const).flatMap((valve) => [
    metricDefinition(
      `hemodynamics.valve-volume.forward.${valve}` as const,
      "volume",
      "mL",
      [`hemodynamics.flow.valve.${valve}`],
      `completedBeatMetrics.valveFlowVolumes.${valve}.forwardVolumeMl`,
    ),
    metricDefinition(
      `hemodynamics.valve-volume.reverse.${valve}` as const,
      "volume",
      "mL",
      [`hemodynamics.flow.valve.${valve}`],
      `completedBeatMetrics.valveFlowVolumes.${valve}.reverseVolumeMl`,
    ),
    metricDefinition(
      `hemodynamics.valve-volume.net.${valve}` as const,
      "volume",
      "mL",
      [
        `hemodynamics.valve-volume.forward.${valve}`,
        `hemodynamics.valve-volume.reverse.${valve}`,
      ],
      `completedBeatMetrics.valveFlowVolumes.${valve}.netVolumeMl`,
    ),
    metricDefinition(
      `hemodynamics.valve-regurgitant-fraction.same-valve.${valve}` as const,
      "derived",
      "1",
      [
        `hemodynamics.valve-volume.forward.${valve}`,
        `hemodynamics.valve-volume.reverse.${valve}`,
      ],
      `completedBeatMetrics.valveFlowVolumes.${valve}.sameValveRegurgitantFraction`,
    ),
  ]),
  ...(["MV", "AoV", "TV", "PV"] as const).flatMap((valve) => [
    metricDefinition(
      `hemodynamics.pressure-gradient.valve.mean-hydraulic-forward.${valve}` as const,
      "pressure",
      "mmHg",
      [
        `hemodynamics.flow.valve.${valve}`,
        ...valvePressureDependencyIdsV3(valve),
      ],
      `completedBeatMetrics.valveForwardPressureGradients.${valve}.timeWeightedMeanMmHg`,
    ),
    metricDefinition(
      `hemodynamics.pressure-gradient.valve.peak-hydraulic-forward.${valve}` as const,
      "pressure",
      "mmHg",
      [
        `hemodynamics.flow.valve.${valve}`,
        ...valvePressureDependencyIdsV3(valve),
      ],
      `completedBeatMetrics.valveForwardPressureGradients.${valve}.peakMmHg`,
    ),
  ]),
  metricDefinition(
    "myocardium.work.external.RV-transmural-pressure-volume-path",
    "work",
    "mmHg*mL",
    ["hemodynamics.volume.RV", "hemodynamics.pressure.transmural.RV"],
    "completedBeatMetrics.rightVentricularTransmuralPressureVolumePathWorkMmHgMl",
  ),
  metricDefinition(
    "myocardium.work.stroke.LV",
    "work",
    "mJ",
    ["hemodynamics.volume.LV", "hemodynamics.pressure.transmural.LV"],
    "derive.completedBeatMetrics.leftVentricularTransmuralPressureVolumePathWorkMmHgMl*0.133322",
  ),
  analysisMetricDefinition(
    MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_PVA_OUTPUT_IDS_V1.potentialEnergyMilliJoule,
    "energy",
    "mJ",
    ["hemodynamics.volume.LV", "hemodynamics.pressure.transmural.LV"],
    "analysis.periodicPva.LV.potentialEnergy.joule*1e3",
  ),
  analysisMetricDefinition(
    MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_PVA_OUTPUT_IDS_V1.pressureVolumeAreaMilliJoule,
    "energy",
    "mJ",
    [
      "myocardium.work.stroke.LV",
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_PVA_OUTPUT_IDS_V1.potentialEnergyMilliJoule,
    ],
    "analysis.periodicPva.LV.pva.joule*1e3",
  ),
  analysisMetricDefinition(
    MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_PVA_OUTPUT_IDS_V1.estimatedMvo2PerBeatPer100G,
    "derived",
    "mL O2/beat/100g",
    [
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_PVA_OUTPUT_IDS_V1.pressureVolumeAreaMilliJoule,
    ],
    "analysis.periodicPva.LV.estimatedMvo2.oxygenDemand.totalMlO2PerBeatPer100G",
  ),
  analysisMetricDefinition(
    MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_PVA_OUTPUT_IDS_V1.estimatedMvo2PerMinPer100G,
    "oxygen-rate",
    "mL O2/min/100g",
    [
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_PVA_OUTPUT_IDS_V1.estimatedMvo2PerBeatPer100G,
      "rhythm.heart-rate.instantaneous",
    ],
    "analysis.periodicPva.LV.estimatedMvo2.oxygenDemand.totalMlO2PerMinPer100G",
  ),
  ...(["LV", "RV"] as const).flatMap((ventricle) => [
    metricDefinition(
      `hemodynamics.pressure-rate.maximum-accepted-step.absolute.${ventricle}` as const,
      "pressure-rate",
      "mmHg/s",
      [`hemodynamics.pressure.absolute.${ventricle}`],
      `completedBeatMetrics.ventricularAbsolutePressureRateExtrema.${ventricle}.maximumMmHgPerSec`,
    ),
    metricDefinition(
      `hemodynamics.pressure-rate.minimum-accepted-step.absolute.${ventricle}` as const,
      "pressure-rate",
      "mmHg/s",
      [`hemodynamics.pressure.absolute.${ventricle}`],
      `completedBeatMetrics.ventricularAbsolutePressureRateExtrema.${ventricle}.minimumMmHgPerSec`,
    ),
  ]),
  metricDefinition(
    "hemodynamics.output.native-left",
    "flow",
    "L/min",
    ["hemodynamics.flow.valve.AoV"],
    "completedBeatMetrics.nativeLeftCardiacOutputLPerMin",
  ),
  metricDefinition(
    "hemodynamics.output.native-right",
    "flow",
    "L/min",
    ["hemodynamics.flow.valve.PV"],
    "completedBeatMetrics.nativeRightCardiacOutputLPerMin",
  ),
  metricDefinition(
    "hemodynamics.output.effective-native-left",
    "flow",
    "L/min",
    ["hemodynamics.valve-volume.net.AoV"],
    "completedBeatMetrics.effectiveNativeLeftCardiacOutputLPerMin",
  ),
  metricDefinition(
    "hemodynamics.output.effective-native-right",
    "flow",
    "L/min",
    ["hemodynamics.valve-volume.net.PV"],
    "completedBeatMetrics.effectiveNativeRightCardiacOutputLPerMin",
  ),
  metricDefinition(
    "hemodynamics.return.systemic-venous",
    "flow",
    "L/min",
    ["hemodynamics.flow.venous.VC_RA", "coronary.flow.venous-outlet"],
    "completedBeatMetrics.systemicVenousReturnLPerMin",
  ),
  metricDefinition(
    "hemodynamics.return.pulmonary-venous",
    "flow",
    "L/min",
    ["hemodynamics.flow.venous.PVein_LA"],
    "completedBeatMetrics.pulmonaryVenousReturnLPerMin",
  ),
  metricDefinition(
    "hemodynamics.output.systemic-tissue",
    "flow",
    "L/min",
    ["hemodynamics.flow.systemic.SA_Art"],
    "completedBeatMetrics.systemicTissueOutputLPerMin",
  ),
  metricDefinition(
    "hemodynamics.output.pulmonary",
    "flow",
    "L/min",
    ["hemodynamics.flow.pulmonary.PA_PArt"],
    "completedBeatMetrics.pulmonaryOutputLPerMin",
  ),
  metricDefinition(
    "hemodynamics.resistance.systemic-effective",
    "resistance",
    "mmHg*min/L",
    [
      "hemodynamics.pressure-gradient.mean.systemic-circuit",
      "hemodynamics.output.systemic-tissue",
    ],
    "derive.systemicMeanPressureGradient/systemicTissueOutput",
  ),
  metricDefinition(
    "hemodynamics.resistance.pulmonary-effective",
    "resistance",
    "mmHg*min/L",
    [
      "hemodynamics.pressure-gradient.mean.pulmonary-circuit",
      "hemodynamics.output.pulmonary",
    ],
    "derive.pulmonaryMeanPressureGradient/pulmonaryOutput",
  ),
  metricDefinition(
    "hemodynamics.compliance.pulmonary-arterial-effective",
    "compliance",
    "mL/mmHg",
    ["hemodynamics.valve-volume.net.PV", "hemodynamics.pressure.pulse.PA"],
    "derive.completedBeatMetrics.valveFlowVolumes.PV.netVolumeMl/pressureSummaries.PA.pulseMmHg",
  ),
  metricDefinition(
    "coronary.pressure-perfusion.surrogate.Ao-diastolic-minus-LVEDP",
    "pressure",
    "mmHg",
    [
      "hemodynamics.pressure.diastolic.Ao",
      "hemodynamics.pressure.absolute.end-diastolic.LV-at-MV-closure",
    ],
    "derive.aorticDiastolicPressure-minus-eventDefinedAbsoluteLVEDP",
  ),
  metricDefinition(
    "oxygen.pressure.alveolar",
    "pressure",
    "mmHg",
    ["hemodynamics.output.systemic-tissue"],
    "derive.oxygenTransport.alveolarOxygenPressureMmHg",
  ),
  metricDefinition(
    "oxygen.pressure.arterial",
    "pressure",
    "mmHg",
    ["oxygen.pressure.alveolar", "hemodynamics.output.systemic-tissue"],
    "derive.oxygenTransport.arterialOxygenPressureMmHg",
  ),
  metricDefinition(
    "oxygen.pressure.gradient.alveolar-arterial",
    "pressure",
    "mmHg",
    ["oxygen.pressure.alveolar", "oxygen.pressure.arterial"],
    "derive.oxygenTransport.alveolarArterialOxygenGradientMmHg",
  ),
  metricDefinition(
    "oxygen.saturation.end-capillary",
    "derived",
    "1",
    ["oxygen.pressure.alveolar"],
    "derive.oxygenTransport.endCapillaryOxygenSaturation01",
  ),
  metricDefinition(
    "oxygen.saturation.arterial",
    "derived",
    "1",
    ["oxygen.pressure.arterial"],
    "derive.oxygenTransport.arterialOxygenSaturation01",
  ),
  metricDefinition(
    "oxygen.content.end-capillary",
    "oxygen-content",
    "mL O2/dL",
    ["oxygen.saturation.end-capillary"],
    "derive.oxygenTransport.endCapillaryOxygenContentMlPerDl",
  ),
  metricDefinition(
    "oxygen.content.arterial",
    "oxygen-content",
    "mL O2/dL",
    ["oxygen.saturation.arterial"],
    "derive.oxygenTransport.arterialOxygenContentMlPerDl",
  ),
  metricDefinition(
    "oxygen.content.required-mixed-venous",
    "oxygen-content",
    "mL O2/dL",
    ["oxygen.content.arterial", "hemodynamics.output.systemic-tissue"],
    "derive.oxygenTransport.requiredMixedVenousOxygenContentMlPerDl",
  ),
  metricDefinition(
    "oxygen.saturation.required-mixed-venous",
    "derived",
    "1",
    ["oxygen.content.required-mixed-venous"],
    "derive.oxygenTransport.requiredMixedVenousOxygenSaturation01",
  ),
  metricDefinition(
    "oxygen.pressure.required-mixed-venous",
    "pressure",
    "mmHg",
    ["oxygen.content.required-mixed-venous"],
    "derive.oxygenTransport.requiredMixedVenousOxygenPressureMmHg",
  ),
  metricDefinition(
    "oxygen.delivery.systemic",
    "oxygen-rate",
    "mL O2/min",
    ["oxygen.content.arterial", "hemodynamics.output.systemic-tissue"],
    "derive.oxygenTransport.oxygenDeliveryMlPerMin",
  ),
  metricDefinition(
    "oxygen.consumption.target",
    "oxygen-rate",
    "mL O2/min",
    ["hemodynamics.output.systemic-tissue"],
    "derive.oxygenTransport.targetOxygenConsumptionMlPerMin",
  ),
  metricDefinition(
    "oxygen.extraction-ratio.required",
    "derived",
    "1",
    ["oxygen.delivery.systemic", "oxygen.consumption.target"],
    "derive.oxygenTransport.requiredOxygenExtractionRatio01",
  ),
  metricDefinition(
    "oxygen.delivery-to-consumption-ratio",
    "derived",
    "1",
    ["oxygen.delivery.systemic", "oxygen.consumption.target"],
    "derive.oxygenTransport.oxygenDeliveryToConsumptionRatio",
  ),
] as const);

export type MainWireIntegratedModelOutputIdV3 =
  (typeof MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_CATALOG_V3)[number]["outputId"];

export const MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_IDS_V3 = Object.freeze(
  MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_CATALOG_V3.map(({ outputId }) => outputId),
) as readonly MainWireIntegratedModelOutputIdV3[];

/**
 * Runtime status fields remain outside the output catalog and durable data.
 */
export const MAIN_WIRE_INTEGRATED_MODEL_STATUS_FIELDS_V3 = Object.freeze([
  "model-time",
  "accepted-revision",
  "internal-substep-count",
  "atrial-capture-count",
  "ventricular-capture-count",
  "rhythm-label",
  "mcs-label",
  "pacing-state",
] as const);

export type MainWireIntegratedModelOutputValueV3 = Readonly<{
  outputId: MainWireIntegratedModelOutputIdV3;
  value: number | null;
  availability: "available" | "not-evaluated-at-accepted-state";
  quality: "authoritative-state" | "accepted-derived" | "not-assessed";
}>;

/**
 * Model time, accepted revision, substep and capture counts, rhythm and MCS
 * labels, and pacing belong to runtime status. This frame does not publish
 * them.
 */
export type MainWireIntegratedModelOutputFrameV3 = Readonly<{
  frameId: typeof MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_FRAME_V3_ID;
  registryId: typeof MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_REGISTRY_V3_ID;
  schemaVersion: typeof MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_REGISTRY_V3_SCHEMA_VERSION;
  values: Readonly<
    Record<
      MainWireIntegratedModelOutputIdV3,
      MainWireIntegratedModelOutputValueV3
    >
  >;
}>;

export const MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_REGISTRY_SNAPSHOT_V3 =
  Object.freeze({
    registryId: MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_REGISTRY_V3_ID,
    schemaVersion: MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_REGISTRY_V3_SCHEMA_VERSION,
    frameId: MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_FRAME_V3_ID,
    catalog: MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_CATALOG_V3,
    unavailableValuePolicy: "null-never-zero" as const,
    availabilityAndQualityAreSeparate: true as const,
  });

export class MainWireIntegratedModelOutputProjectionErrorV3 extends Error {
  constructor(message: string) {
    super(`Main Wire Integrated V3 output projection rejected: ${message}`);
    this.name = "MainWireIntegratedModelOutputProjectionErrorV3";
  }
}

/**
 * Projects the session's retained observation. Cold and restored observations
 * have no accepted-step readback, so only accepted-state values are available.
 */
export function projectMainWireIntegratedModelObservationV3(
  observation: MainWireIntegratedModelObservationV3,
): MainWireIntegratedModelOutputFrameV3 {
  const values = projectMainWireIntegratedModelSelectedValuesV3(
    observation,
    MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_IDS_V3,
  ) as Readonly<
    Record<
      MainWireIntegratedModelOutputIdV3,
      MainWireIntegratedModelOutputValueV3
    >
  >;

  return Object.freeze({
    frameId: MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_FRAME_V3_ID,
    registryId: MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_REGISTRY_V3_ID,
    schemaVersion: MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_REGISTRY_V3_SCHEMA_VERSION,
    values: Object.freeze(values),
  });
}

/**
 * Projects only the exact scalar signals requested by the presentation owner.
 * It shares the same projector as the complete frame, so adding autonomic,
 * oxygen-delivery or multipatch outputs does not force hidden signals into the
 * live hot path and cannot create a second numerical meaning.
 */
export function projectMainWireIntegratedModelSelectedValuesV3(
  observation: MainWireIntegratedModelObservationV3,
  outputIds: readonly MainWireIntegratedModelOutputIdV3[],
): Readonly<Record<string, MainWireIntegratedModelOutputValueV3>> {
  assertObservationReadbackPairV3(observation);
  const oxygenTransport = oxygenTransportForCompletedBeatV3(
    observation.mechanismResearchInputs.oxygenTransport,
    observation.completedBeatMetrics,
  );
  const values: Record<string, MainWireIntegratedModelOutputValueV3> = {};
  const seen = new Set<MainWireIntegratedModelOutputIdV3>();
  for (const outputId of outputIds) {
    if (seen.has(outputId)) {
      throw new MainWireIntegratedModelOutputProjectionErrorV3(
        `selected output ${outputId} is duplicated`,
      );
    }
    seen.add(outputId);
    values[outputId] = projectMainWireIntegratedModelOutputValueV3(
      observation.acceptedState,
      observation.runtimeSignals,
      observation.completedBeatMetrics,
      oxygenTransport,
      observation.lastAcceptedStep,
      null,
      outputId,
    );
  }
  return Object.freeze(values);
}

export type MainWireIntegratedModelNumericalProjectionInputV1 = Readonly<{
  acceptedTimeSec: number;
  regularSinusCycleLengthSec: number;
  regularSinusNextActivationTimeSec: number;
  dynamicMechanicalSupportLvadFlowMlPerSec: number;
  runtimeSignals: MainWireIntegratedModelObservationV3["runtimeSignals"];
  completedBeatMetrics: MainWireIntegratedModelObservationV3["completedBeatMetrics"];
  mechanismResearchInputs: MainWireIntegratedModelObservationV3["mechanismResearchInputs"];
  /** Borrowed selected-root readback; projection never retains this buffer. */
  acceptedNumericalReadback: Float64Array;
}>;

/**
 * Projects directly from the admitted fixed readback. No public accepted-step
 * trial or coronary hydraulic diagnostic graph is required.
 */
export function projectMainWireIntegratedModelSelectedValuesFromNumericalReadbackV1(
  input: MainWireIntegratedModelNumericalProjectionInputV1,
  outputIds: readonly MainWireIntegratedModelOutputIdV3[],
): Readonly<Record<string, MainWireIntegratedModelOutputValueV3>> {
  const readback = input.acceptedNumericalReadback;
  if (
    !(readback instanceof Float64Array) ||
    readback.length !== MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_COUNT_V1
  ) {
    throw new MainWireIntegratedModelOutputProjectionErrorV3(
      "accepted numerical readback must contain exactly " +
        `${MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_COUNT_V1} f64 values`,
    );
  }
  const acceptedTimeSec = input.acceptedTimeSec;
  if (
    !Number.isFinite(acceptedTimeSec) ||
    readback[
      MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_LAYOUT_V1.timeSec
    ] !== acceptedTimeSec
  ) {
    throw new MainWireIntegratedModelOutputProjectionErrorV3(
      "accepted numerical readback clock differs from typed presentation state",
    );
  }
  const values: Record<string, MainWireIntegratedModelOutputValueV3> = {};
  const oxygenTransport = oxygenTransportForCompletedBeatV3(
    input.mechanismResearchInputs.oxygenTransport,
    input.completedBeatMetrics,
  );
  const seen = new Set<MainWireIntegratedModelOutputIdV3>();
  for (const outputId of outputIds) {
    if (seen.has(outputId)) {
      throw new MainWireIntegratedModelOutputProjectionErrorV3(
        `selected output ${outputId} is duplicated`,
      );
    }
    seen.add(outputId);
    values[outputId] = projectMainWireIntegratedModelOutputValueV3(
      undefined,
      input.runtimeSignals,
      input.completedBeatMetrics,
      oxygenTransport,
      null,
      readback,
      outputId,
      Object.freeze({
        acceptedTimeSec,
        regularSinusCycleLengthSec: input.regularSinusCycleLengthSec,
        regularSinusNextActivationTimeSec:
          input.regularSinusNextActivationTimeSec,
        dynamicMechanicalSupportLvadFlowMlPerSec:
          input.dynamicMechanicalSupportLvadFlowMlPerSec,
      }),
    );
  }
  return Object.freeze(values);
}

function projectMainWireIntegratedModelOutputValueV3(
  accepted: MainWireIntegratedModelObservationV3["acceptedState"] | undefined,
  runtimeSignals: MainWireIntegratedModelObservationV3["runtimeSignals"],
  completedBeatMetrics: MainWireIntegratedModelObservationV3["completedBeatMetrics"],
  oxygenTransport: OxygenTransportEvaluationV1 | null,
  step: MainWireIntegratedModelObservationV3["lastAcceptedStep"],
  numericalReadback: Float64Array | null,
  outputId: MainWireIntegratedModelOutputIdV3,
  typedState?: Readonly<{
    acceptedTimeSec: number;
    regularSinusCycleLengthSec: number;
    regularSinusNextActivationTimeSec: number;
    dynamicMechanicalSupportLvadFlowMlPerSec: number;
  }>,
): MainWireIntegratedModelOutputValueV3 {
  const layout = MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_LAYOUT_V1;
  if (outputId.startsWith("hemodynamics.valve-volume.")) {
    const [, , direction, valve] = outputId.split(".") as [
      "hemodynamics",
      "valve-volume",
      "forward" | "reverse" | "net",
      "MV" | "AoV" | "TV" | "PV",
    ];
    const volumes = completedBeatMetrics?.valveFlowVolumes[valve];
    return beatMetricValue(
      outputId,
      direction === "forward"
        ? volumes?.forwardVolumeMl
        : direction === "reverse"
          ? volumes?.reverseVolumeMl
          : volumes?.netVolumeMl,
    );
  }
  if (
    outputId.startsWith("hemodynamics.valve-regurgitant-fraction.same-valve.")
  ) {
    const valve = outputId.slice(
      "hemodynamics.valve-regurgitant-fraction.same-valve.".length,
    ) as "MV" | "AoV" | "TV" | "PV";
    return beatMetricValue(
      outputId,
      completedBeatMetrics?.valveFlowVolumes[valve]
        .sameValveRegurgitantFraction,
    );
  }
  if (outputId.startsWith("hemodynamics.pressure-gradient.valve.")) {
    const [, , , statistic, valve] = outputId.split(".") as [
      "hemodynamics",
      "pressure-gradient",
      "valve",
      "mean-hydraulic-forward" | "peak-hydraulic-forward",
      "MV" | "AoV" | "TV" | "PV",
    ];
    const gradient = completedBeatMetrics?.valveForwardPressureGradients[valve];
    return beatMetricValue(
      outputId,
      statistic === "mean-hydraulic-forward"
        ? gradient?.timeWeightedMeanMmHg
        : gradient?.peakMmHg,
    );
  }
  const pressureSummaryMatch =
    /^hemodynamics\.pressure\.(mean|systolic|diastolic|pulse)\.(LA|LV|RA|RV|Ao|SA|PA|PVein|VC)$/.exec(
      outputId,
    );
  if (pressureSummaryMatch !== null) {
    const statistic = pressureSummaryMatch[1] as
      "mean" | "systolic" | "diastolic" | "pulse";
    const node = pressureSummaryMatch[2] as
      "LA" | "LV" | "RA" | "RV" | "Ao" | "SA" | "PA" | "PVein" | "VC";
    const summary = completedBeatMetrics?.pressureSummaries[node];
    return beatMetricValue(
      outputId,
      statistic === "mean"
        ? summary?.timeWeightedMeanMmHg
        : statistic === "systolic"
          ? summary?.maximumMmHg
          : statistic === "diastolic"
            ? summary?.minimumMmHg
            : summary?.pulseMmHg,
    );
  }
  const pressureRateMatch =
    /^hemodynamics\.pressure-rate\.(maximum|minimum)-accepted-step\.absolute\.(LV|RV)$/.exec(
      outputId,
    );
  if (pressureRateMatch !== null) {
    const statistic = pressureRateMatch[1] as "maximum" | "minimum";
    const ventricle = pressureRateMatch[2] as "LV" | "RV";
    const extrema =
      completedBeatMetrics?.ventricularAbsolutePressureRateExtrema[ventricle];
    return beatMetricValue(
      outputId,
      statistic === "maximum"
        ? extrema?.maximumMmHgPerSec
        : extrema?.minimumMmHgPerSec,
    );
  }
  if (
    outputId.startsWith("coronary.flow.large-arterial-outflow.") ||
    outputId.startsWith("coronary.flow.large-arterial-storage-rate.")
  ) {
    const [, , kind, territory] = outputId.split(".") as [
      "coronary",
      "flow",
      "large-arterial-outflow" | "large-arterial-storage-rate",
      "LAD" | "LCx" | "RCA",
    ];
    const territoryIndex = coronaryTerritoryIndexV3(territory);
    const hydraulics =
      step?.coronaryStep.baseStep.coronaryTrial.diagnostics.hydraulics;
    return readbackValue(
      outputId,
      numericalReadback === null
        ? kind === "large-arterial-outflow"
          ? hydraulics?.largeArterialOutflowMlPerSecByTerritory[territory]
          : hydraulics?.largeArterialStorageRateMlPerSecByTerritory[territory]
        : numericalReadback[
            (kind === "large-arterial-outflow"
              ? layout.coronaryLargeArterialOutflowMlPerSec
              : layout.coronaryLargeArterialStorageRateMlPerSec) +
              territoryIndex
          ],
    );
  }
  if (
    outputId.startsWith("coronary.flow.layer-") ||
    outputId.startsWith("coronary.tone-resistance-scale.")
  ) {
    const parts = outputId.split(".");
    const isTone = parts[1] === "tone-resistance-scale";
    const kind = isTone ? "tone" : parts[2]!;
    const territory = parts[isTone ? 2 : 3] as "LAD" | "LCx" | "RCA";
    const layer = parts[isTone ? 3 : 4] as "subepicardial" | "subendocardial";
    const index =
      2 * coronaryTerritoryIndexV3(territory) + coronaryLayerIndexV3(layer);
    const hydraulics =
      step?.coronaryStep.baseStep.coronaryTrial.diagnostics.hydraulics;
    const typedValue =
      kind === "layer-r1"
        ? hydraulics?.layerR1FlowMlPerSecByTerritory[territory][layer]
        : kind === "layer-qm-internal"
          ? hydraulics?.layerQmInternalFlowMlPerSecByTerritory[territory][layer]
          : kind === "layer-r2"
            ? hydraulics?.layerR2FlowMlPerSecByTerritory[territory][layer]
            : hydraulics?.effectiveToneResistanceScaleByTerritoryLayer[
                territory
              ][layer];
    const offset =
      kind === "layer-r1"
        ? layout.coronaryLayerR1FlowMlPerSec
        : kind === "layer-qm-internal"
          ? layout.coronaryLayerQmFlowMlPerSec
          : kind === "layer-r2"
            ? layout.coronaryLayerR2FlowMlPerSec
            : layout.coronaryEffectiveToneResistanceScale;
    return readbackValue(
      outputId,
      numericalReadback === null
        ? typedValue
        : numericalReadback[offset + index],
    );
  }
  if (
    outputId.startsWith("coronary.pressure.post-focal.") ||
    outputId.startsWith("coronary.pressure-loss.focal.")
  ) {
    const parts = outputId.split(".");
    const isPostFocal = parts[1] === "pressure";
    const territory = parts[isPostFocal ? 3 : 3] as "LAD" | "LCx" | "RCA";
    const territoryIndex = coronaryTerritoryIndexV3(territory);
    const hydraulics =
      step?.coronaryStep.baseStep.coronaryTrial.diagnostics.hydraulics;
    return readbackValue(
      outputId,
      numericalReadback === null
        ? isPostFocal
          ? hydraulics?.postFocalLesionAbsolutePressureMmHgByTerritory[
              territory
            ]
          : hydraulics?.focalStenosisPressureLossMmHgByTerritory[territory]
        : numericalReadback[
            (isPostFocal
              ? layout.coronaryPostFocalPressureMmHg
              : layout.coronaryFocalPressureLossMmHg) + territoryIndex
          ],
    );
  }
  switch (outputId) {
    case "hemodynamics.volume.LA":
    case "hemodynamics.volume.LV":
    case "hemodynamics.volume.RA":
    case "hemodynamics.volume.RV": {
      const chamber = outputId.slice(-2) as "LA" | "LV" | "RA" | "RV";
      const readbackIndex =
        MAIN_WIRE_FIVE_WALL_ACCEPTED_READBACK_CHAMBER_ORDER_V1.indexOf(chamber);
      return availableValue(
        outputId,
        numericalReadback === null
          ? requiredAcceptedStateV3(accepted).coronary.circulation
              .nodeVolumesMl[chamber]
          : numericalReadback[layout.chamberVolumeMl + readbackIndex]!,
        "authoritative-state",
      );
    }
    case "hemodynamics.pressure.absolute.LA":
    case "hemodynamics.pressure.absolute.LV":
    case "hemodynamics.pressure.absolute.RA":
    case "hemodynamics.pressure.absolute.RV":
    case "hemodynamics.pressure.absolute.Ao":
    case "hemodynamics.pressure.absolute.SA":
    case "hemodynamics.pressure.absolute.PA":
    case "hemodynamics.pressure.absolute.PVein":
    case "hemodynamics.pressure.absolute.VC": {
      const node = outputId.slice("hemodynamics.pressure.absolute.".length) as
        "LA" | "LV" | "RA" | "RV" | "Ao" | "SA" | "PA" | "PVein" | "VC";
      return readbackValue(
        outputId,
        numericalReadback === null
          ? step?.coronaryStep.baseStep.circulationTrial
              .nodeAbsolutePressuresMmHg[node]
          : numericalReadback[
              layout.absolutePressureMmHg +
                MAIN_WIRE_FIVE_WALL_ACCEPTED_READBACK_ABSOLUTE_PRESSURE_ORDER_V1.indexOf(
                  node,
                )
            ],
      );
    }
    case "hemodynamics.pressure.transmural.LA":
    case "hemodynamics.pressure.transmural.LV":
    case "hemodynamics.pressure.transmural.RA":
    case "hemodynamics.pressure.transmural.RV": {
      const chamber = outputId.slice(-2) as "LA" | "LV" | "RA" | "RV";
      return readbackValue(
        outputId,
        numericalReadback === null
          ? step?.coronaryStep.baseStep.mechanicsTrial.transmuralPressuresMmHg[
              chamber
            ]
          : numericalReadback[
              layout.transmuralPressureMmHg +
                MAIN_WIRE_FIVE_WALL_ACCEPTED_READBACK_CHAMBER_ORDER_V1.indexOf(
                  chamber,
                )
            ],
      );
    }
    case "hemodynamics.flow.valve.MV":
    case "hemodynamics.flow.valve.AoV":
    case "hemodynamics.flow.valve.TV":
    case "hemodynamics.flow.valve.PV": {
      const valve = outputId.slice("hemodynamics.flow.valve.".length) as
        "MV" | "AoV" | "TV" | "PV";
      return readbackValue(
        outputId,
        numericalReadback === null
          ? step?.coronaryStep.baseStep.circulationTrial.valveEvaluations[valve]
              .flowMlPerSec
          : numericalReadback[
              layout.valveFlowMlPerSec +
                MAIN_WIRE_FIVE_WALL_ACCEPTED_READBACK_VALVE_ORDER_V1.indexOf(
                  valve,
                )
            ],
      );
    }
    case "hemodynamics.flow.systemic.SA_Art":
      return readbackValue(
        outputId,
        numericalReadback?.[layout.systemicTissueFlowMlPerSec] ??
          step?.coronaryStep.baseStep.circulationTrial.edgeFlowsMlPerSec.SA_Art,
      );
    case "hemodynamics.flow.pulmonary.PA_PArt":
      return readbackValue(
        outputId,
        numericalReadback?.[layout.pulmonaryFlowMlPerSec] ??
          step?.coronaryStep.baseStep.circulationTrial.edgeFlowsMlPerSec
            .PA_PArt,
      );
    case "hemodynamics.flow.venous.VC_RA":
      return readbackValue(
        outputId,
        numericalReadback?.[layout.systemicVenousFlowMlPerSec] ??
          step?.coronaryStep.baseStep.circulationTrial.edgeFlowsMlPerSec.VC_RA,
      );
    case "hemodynamics.flow.venous.PVein_LA":
      return readbackValue(
        outputId,
        numericalReadback?.[layout.pulmonaryVenousFlowMlPerSec] ??
          step?.coronaryStep.baseStep.circulationTrial.edgeFlowsMlPerSec
            .PVein_LA,
      );
    case "pericardium.pressure.excess":
      return readbackValue(
        outputId,
        numericalReadback?.[layout.pericardialExcessPressureMmHg] ??
          step?.coronaryStep.baseStep.pericardium.excessPressureMmHg,
      );
    case "pericardium.volume.heart":
      return readbackValue(
        outputId,
        numericalReadback?.[layout.pericardialHeartVolumeMl] ??
          (step === null
            ? undefined
            : step.coronaryStep.baseStep.pericardium.heartVolumeM3 * 1e6),
      );
    case "pericardium.volume.fluid":
      return readbackValue(
        outputId,
        numericalReadback?.[layout.pericardialFluidVolumeMl] ??
          (step === null
            ? undefined
            : step.coronaryStep.baseStep.pericardium
                .prescribedPericardialFluidVolumeM3 * 1e6),
      );
    case "pericardium.volume.total-occupied":
      return readbackValue(
        outputId,
        numericalReadback?.[layout.pericardialTotalOccupiedVolumeMl] ??
          (step === null
            ? undefined
            : step.coronaryStep.baseStep.pericardium.totalOccupiedVolumeM3 *
              1e6),
      );
    case "pericardium.energy.stored":
      return readbackValue(
        outputId,
        numericalReadback?.[layout.pericardialStoredEnergyMilliJ] ??
          (step === null
            ? undefined
            : step.coronaryStep.baseStep.pericardium.storedEnergyJ * 1e3),
      );
    case "respiration.pressure.pleural":
      return availableValue(
        outputId,
        runtimeSignals.pleuralPressureMmHg,
        "accepted-derived",
      );
    case "respiration.pressure.alveolar":
      return availableValue(
        outputId,
        runtimeSignals.alveolarPressureMmHg,
        "accepted-derived",
      );
    case "rhythm.heart-rate.instantaneous":
      return availableValue(
        outputId,
        typedState?.regularSinusCycleLengthSec === undefined
          ? regularSinusHeartRateBpmV3(
              requiredAcceptedStateV3(accepted).composedRhythm,
            )
          : 60 /
              positiveCycleLengthSecV3(typedState.regularSinusCycleLengthSec),
        "accepted-derived",
      );
    case "coronary.flow.total":
      return readbackValue(
        outputId,
        numericalReadback?.[layout.coronaryFlowMlPerSec] ??
          step?.coronaryStep.baseStep.coronaryTrial.diagnostics.hydraulics
            .totalInletFlowMlPerSec,
      );
    case "coronary.flow.inlet.LAD":
    case "coronary.flow.inlet.LCx":
    case "coronary.flow.inlet.RCA": {
      const territory = outputId.slice("coronary.flow.inlet.".length) as
        "LAD" | "LCx" | "RCA";
      const territoryIndex =
        territory === "LAD" ? 0 : territory === "LCx" ? 1 : 2;
      return readbackValue(
        outputId,
        numericalReadback?.[layout.coronaryFlowMlPerSec + 1 + territoryIndex] ??
          step?.coronaryStep.baseStep.coronaryTrial.diagnostics.hydraulics
            .inletFlowMlPerSecByTerritory[territory],
      );
    }
    case "coronary.flow.venous-outlet":
      return readbackValue(
        outputId,
        numericalReadback?.[layout.coronaryVenousOutletFlowMlPerSec] ??
          step?.coronaryStep.baseStep.coronaryTrial.diagnostics.hydraulics
            .commonCoronaryVenousOutletFlowMlPerSec,
      );
    case "coronary.power.dissipated.total":
      return readbackValue(
        outputId,
        numericalReadback?.[layout.coronaryDissipatedPowerMmHgMlPerSec] ??
          step?.coronaryStep.baseStep.coronaryTrial.diagnostics.hydraulics
            .totalDissipatedPowerMmHgMlPerSec,
      );
    case "device.LVAD.flow":
      return availableValue(
        outputId,
        typedState?.dynamicMechanicalSupportLvadFlowMlPerSec ??
          requiredAcceptedStateV3(accepted).dynamicMechanicalSupport
            .acceptedFlowMlPerSec.LVAD,
        "authoritative-state",
      );
    case "rhythm.phase.regular-sinus":
      return availableValue(
        outputId,
        typedState?.regularSinusCycleLengthSec === undefined ||
          typedState.regularSinusNextActivationTimeSec === undefined
          ? regularSinusPhase01V3(
              requiredAcceptedStateV3(accepted).composedRhythm,
            )
          : regularSinusPhaseFromClockV3(
              typedState.acceptedTimeSec,
              typedState.regularSinusCycleLengthSec,
              typedState.regularSinusNextActivationTimeSec,
            ),
        "accepted-derived",
      );
    case "hemodynamics.pressure.mean.Ao":
      return beatMetricValue(
        outputId,
        completedBeatMetrics?.meanAorticPressureMmHg,
      );
    case "hemodynamics.pressure.systolic.Ao":
      return beatMetricValue(
        outputId,
        completedBeatMetrics?.systolicAorticPressureMmHg,
      );
    case "hemodynamics.pressure.diastolic.Ao":
      return beatMetricValue(
        outputId,
        completedBeatMetrics?.diastolicAorticPressureMmHg,
      );
    case "hemodynamics.pressure.pulse.Ao":
      return beatMetricValue(
        outputId,
        completedBeatMetrics?.pulseAorticPressureMmHg,
      );
    case "hemodynamics.pressure.mean.PA":
      return beatMetricValue(
        outputId,
        completedBeatMetrics?.meanPulmonaryArterialPressureMmHg,
      );
    case "hemodynamics.pressure.mean.LA":
      return beatMetricValue(
        outputId,
        completedBeatMetrics?.meanLeftAtrialPressureMmHg,
      );
    case "hemodynamics.pressure.mean.RA":
      return beatMetricValue(
        outputId,
        completedBeatMetrics?.meanRightAtrialPressureMmHg,
      );
    case "hemodynamics.pressure-gradient.mean.systemic-circuit":
      return beatMetricValue(
        outputId,
        completedBeatMetrics === null
          ? null
          : completedBeatMetrics.pressureSummaries.SA.timeWeightedMeanMmHg -
              completedBeatMetrics.pressureSummaries.RA.timeWeightedMeanMmHg,
      );
    case "hemodynamics.pressure-gradient.mean.pulmonary-circuit":
      return beatMetricValue(
        outputId,
        completedBeatMetrics === null
          ? null
          : completedBeatMetrics.pressureSummaries.PA.timeWeightedMeanMmHg -
              completedBeatMetrics.pressureSummaries.PVein.timeWeightedMeanMmHg,
      );
    case "hemodynamics.volume.maximum.LV":
      return beatMetricValue(
        outputId,
        completedBeatMetrics?.maximumLeftVentricularVolumeMl,
      );
    case "hemodynamics.volume.minimum.LV":
      return beatMetricValue(
        outputId,
        completedBeatMetrics?.minimumLeftVentricularVolumeMl,
      );
    case "hemodynamics.stroke-volume.LV-extrema":
      return beatMetricValue(
        outputId,
        completedBeatMetrics?.extremaLeftVentricularStrokeVolumeMl,
      );
    case "hemodynamics.ejection-fraction.LV-extrema":
      return beatMetricValue(
        outputId,
        completedBeatMetrics?.extremaLeftVentricularEjectionFraction01,
      );
    case "hemodynamics.volume.end-diastolic.LV-at-MV-closure":
      return beatMetricValue(
        outputId,
        completedBeatMetrics?.leftVentricularValveEventMetrics.endDiastolic
          ?.volumeMl,
      );
    case "hemodynamics.pressure.absolute.end-diastolic.LV-at-MV-closure":
      return beatMetricValue(
        outputId,
        completedBeatMetrics?.leftVentricularValveEventMetrics.endDiastolic
          ?.absolutePressureMmHg,
      );
    case "hemodynamics.pressure.transmural.end-diastolic.LV-at-MV-closure":
      return beatMetricValue(
        outputId,
        completedBeatMetrics?.leftVentricularValveEventMetrics.endDiastolic
          ?.transmuralPressureMmHg,
      );
    case "hemodynamics.volume.end-systolic.LV-at-AoV-closure":
      return beatMetricValue(
        outputId,
        completedBeatMetrics?.leftVentricularValveEventMetrics.endSystolic
          ?.volumeMl,
      );
    case "hemodynamics.pressure.absolute.end-systolic.LV-at-AoV-closure":
      return beatMetricValue(
        outputId,
        completedBeatMetrics?.leftVentricularValveEventMetrics.endSystolic
          ?.absolutePressureMmHg,
      );
    case "hemodynamics.pressure.transmural.end-systolic.LV-at-AoV-closure":
      return beatMetricValue(
        outputId,
        completedBeatMetrics?.leftVentricularValveEventMetrics.endSystolic
          ?.transmuralPressureMmHg,
      );
    case "hemodynamics.stroke-volume.LV-event-defined":
      return beatMetricValue(
        outputId,
        completedBeatMetrics?.leftVentricularValveEventMetrics
          .eventDefinedStrokeVolumeMl,
      );
    case "hemodynamics.ejection-fraction.LV-event-defined":
      return beatMetricValue(
        outputId,
        completedBeatMetrics?.leftVentricularValveEventMetrics
          .eventDefinedEjectionFraction01,
      );
    case "hemodynamics.volume.end-diastolic.RV-at-TV-closure":
      return beatMetricValue(
        outputId,
        completedBeatMetrics?.rightVentricularValveEventMetrics.endDiastolic
          ?.volumeMl,
      );
    case "hemodynamics.pressure.absolute.end-diastolic.RV-at-TV-closure":
      return beatMetricValue(
        outputId,
        completedBeatMetrics?.rightVentricularValveEventMetrics.endDiastolic
          ?.absolutePressureMmHg,
      );
    case "hemodynamics.pressure.transmural.end-diastolic.RV-at-TV-closure":
      return beatMetricValue(
        outputId,
        completedBeatMetrics?.rightVentricularValveEventMetrics.endDiastolic
          ?.transmuralPressureMmHg,
      );
    case "hemodynamics.volume.end-systolic.RV-at-PV-closure":
      return beatMetricValue(
        outputId,
        completedBeatMetrics?.rightVentricularValveEventMetrics.endSystolic
          ?.volumeMl,
      );
    case "hemodynamics.pressure.absolute.end-systolic.RV-at-PV-closure":
      return beatMetricValue(
        outputId,
        completedBeatMetrics?.rightVentricularValveEventMetrics.endSystolic
          ?.absolutePressureMmHg,
      );
    case "hemodynamics.pressure.transmural.end-systolic.RV-at-PV-closure":
      return beatMetricValue(
        outputId,
        completedBeatMetrics?.rightVentricularValveEventMetrics.endSystolic
          ?.transmuralPressureMmHg,
      );
    case "hemodynamics.stroke-volume.RV-event-defined":
      return beatMetricValue(
        outputId,
        completedBeatMetrics?.rightVentricularValveEventMetrics
          .eventDefinedStrokeVolumeMl,
      );
    case "hemodynamics.ejection-fraction.RV-event-defined":
      return beatMetricValue(
        outputId,
        completedBeatMetrics?.rightVentricularValveEventMetrics
          .eventDefinedEjectionFraction01,
      );
    case "myocardium.work.external.RV-transmural-pressure-volume-path":
      return beatMetricValue(
        outputId,
        completedBeatMetrics?.rightVentricularTransmuralPressureVolumePathWorkMmHgMl,
      );
    case "myocardium.work.stroke.LV":
      return beatMetricValue(
        outputId,
        completedBeatMetrics === null
          ? null
          : completedBeatMetrics.leftVentricularTransmuralPressureVolumePathWorkMmHgMl *
              MMHG_ML_TO_MILLIJOULE_V1,
      );
    case "myocardium.energy.potential.LV-pressure-volume-area":
    case "myocardium.energy.pressure-volume-area.LV":
    case "oxygen.consumption.estimated-myocardial.LV-per-beat-per-100g":
    case "oxygen.consumption.estimated-myocardial.LV-per-min-per-100g":
      return beatMetricValue(outputId, null);
    case "hemodynamics.output.native-left":
      return beatMetricValue(
        outputId,
        completedBeatMetrics?.nativeLeftCardiacOutputLPerMin,
      );
    case "hemodynamics.output.native-right":
      return beatMetricValue(
        outputId,
        completedBeatMetrics?.nativeRightCardiacOutputLPerMin,
      );
    case "hemodynamics.output.effective-native-left":
      return beatMetricValue(
        outputId,
        completedBeatMetrics?.effectiveNativeLeftCardiacOutputLPerMin,
      );
    case "hemodynamics.output.effective-native-right":
      return beatMetricValue(
        outputId,
        completedBeatMetrics?.effectiveNativeRightCardiacOutputLPerMin,
      );
    case "hemodynamics.return.systemic-venous":
      return beatMetricValue(
        outputId,
        completedBeatMetrics?.systemicVenousReturnLPerMin,
      );
    case "hemodynamics.return.pulmonary-venous":
      return beatMetricValue(
        outputId,
        completedBeatMetrics?.pulmonaryVenousReturnLPerMin,
      );
    case "hemodynamics.output.systemic-tissue":
      return beatMetricValue(
        outputId,
        completedBeatMetrics?.systemicTissueOutputLPerMin,
      );
    case "hemodynamics.output.pulmonary":
      return beatMetricValue(
        outputId,
        completedBeatMetrics?.pulmonaryOutputLPerMin,
      );
    case "hemodynamics.resistance.systemic-effective":
      return beatMetricValue(
        outputId,
        completedBeatMetrics === null
          ? null
          : positiveDenominatorRatioV3(
              completedBeatMetrics.pressureSummaries.SA.timeWeightedMeanMmHg -
                completedBeatMetrics.pressureSummaries.RA.timeWeightedMeanMmHg,
              completedBeatMetrics.systemicTissueOutputLPerMin,
            ),
      );
    case "hemodynamics.resistance.pulmonary-effective":
      return beatMetricValue(
        outputId,
        completedBeatMetrics === null
          ? null
          : positiveDenominatorRatioV3(
              completedBeatMetrics.pressureSummaries.PA.timeWeightedMeanMmHg -
                completedBeatMetrics.pressureSummaries.PVein
                  .timeWeightedMeanMmHg,
              completedBeatMetrics.pulmonaryOutputLPerMin,
            ),
      );
    case "hemodynamics.compliance.pulmonary-arterial-effective":
      return beatMetricValue(
        outputId,
        completedBeatMetrics === null
          ? null
          : positiveDenominatorRatioV3(
              completedBeatMetrics.valveFlowVolumes.PV.netVolumeMl,
              completedBeatMetrics.pressureSummaries.PA.pulseMmHg,
            ),
      );
    case "coronary.pressure-perfusion.surrogate.Ao-diastolic-minus-LVEDP":
      return beatMetricValue(
        outputId,
        completedBeatMetrics?.leftVentricularValveEventMetrics.endDiastolic ===
          null || completedBeatMetrics === null
          ? null
          : completedBeatMetrics.pressureSummaries.Ao.minimumMmHg -
              completedBeatMetrics.leftVentricularValveEventMetrics.endDiastolic
                .absolutePressureMmHg,
      );
    case "oxygen.pressure.alveolar":
      return beatMetricValue(
        outputId,
        oxygenTransport?.alveolarOxygenPressureMmHg,
      );
    case "oxygen.pressure.arterial":
      return beatMetricValue(
        outputId,
        oxygenTransport?.arterialOxygenPressureMmHg,
      );
    case "oxygen.pressure.gradient.alveolar-arterial":
      return beatMetricValue(
        outputId,
        oxygenTransport?.alveolarArterialOxygenGradientMmHg,
      );
    case "oxygen.saturation.end-capillary":
      return beatMetricValue(
        outputId,
        oxygenTransport?.endCapillaryOxygenSaturation01,
      );
    case "oxygen.saturation.arterial":
      return beatMetricValue(
        outputId,
        oxygenTransport?.arterialOxygenSaturation01,
      );
    case "oxygen.content.end-capillary":
      return beatMetricValue(
        outputId,
        oxygenTransport?.endCapillaryOxygenContentMlPerDl,
      );
    case "oxygen.content.arterial":
      return beatMetricValue(
        outputId,
        oxygenTransport?.arterialOxygenContentMlPerDl,
      );
    case "oxygen.content.required-mixed-venous":
      return beatMetricValue(
        outputId,
        oxygenTransport?.requiredMixedVenousOxygenContentMlPerDl,
      );
    case "oxygen.saturation.required-mixed-venous":
      return beatMetricValue(
        outputId,
        oxygenTransport?.requiredMixedVenousOxygenSaturation01,
      );
    case "oxygen.pressure.required-mixed-venous":
      return beatMetricValue(
        outputId,
        oxygenTransport?.requiredMixedVenousOxygenPressureMmHg,
      );
    case "oxygen.delivery.systemic":
      return beatMetricValue(outputId, oxygenTransport?.oxygenDeliveryMlPerMin);
    case "oxygen.consumption.target":
      return beatMetricValue(
        outputId,
        oxygenTransport?.targetOxygenConsumptionMlPerMin,
      );
    case "oxygen.extraction-ratio.required":
      return beatMetricValue(
        outputId,
        oxygenTransport?.requiredOxygenExtractionRatio01,
      );
    case "oxygen.delivery-to-consumption-ratio":
      return beatMetricValue(
        outputId,
        oxygenTransport?.oxygenDeliveryToConsumptionRatio,
      );
  }
}

/**
 * Presentation calls emit a frame only for an advanced result. Already-at-
 * target and failed calls do not represent a newly accepted sample.
 */
export function projectMainWireIntegratedModelAdvancedFrameV3(
  advance: MainWireIntegratedModelPresentationAdvanceV3,
): MainWireIntegratedModelOutputFrameV3 {
  if (advance.status !== "advanced") {
    throw new MainWireIntegratedModelOutputProjectionErrorV3(
      `${advance.status} presentation advance has no new sample`,
    );
  }
  return projectMainWireIntegratedModelObservationV3(advance.observation);
}

function oxygenTransportForCompletedBeatV3(
  inputs: MainWireIntegratedModelObservationV3["mechanismResearchInputs"]["oxygenTransport"],
  completedBeatMetrics: MainWireIntegratedModelObservationV3["completedBeatMetrics"],
): OxygenTransportEvaluationV1 | null {
  return completedBeatMetrics === null
    ? null
    : evaluateOxygenTransportV1(
        inputs,
        completedBeatMetrics.systemicTissueOutputLPerMin,
      );
}

function definition<TId extends string>(
  outputId: TId,
  quantityKind: MainWireIntegratedModelOutputQuantityKindV3,
  unit: MainWireIntegratedModelOutputUnitV3,
  sourceKind: MainWireIntegratedModelOutputSourceKindV3,
  sourcePath: string,
): MainWireIntegratedModelOutputDefinitionV3<TId> {
  return Object.freeze({
    outputId,
    kind: "signal" as const,
    quantityKind,
    unit,
    modelingStatus: "modeled" as const,
    sourceKind,
    sourcePath,
    significantDigits: 3,
  });
}

function metricDefinition<TId extends string>(
  outputId: TId,
  quantityKind: MainWireIntegratedModelOutputQuantityKindV3,
  unit: MainWireIntegratedModelOutputUnitV3,
  dependencies: readonly string[],
  sourcePath: string,
): MainWireIntegratedModelOutputDefinitionV3<TId> {
  return Object.freeze({
    outputId,
    kind: "metric" as const,
    quantityKind,
    unit,
    modelingStatus: "modeled" as const,
    sourceKind: "completed-beat" as const,
    sourcePath,
    significantDigits: 3,
    scope: "beat" as const,
    dependencies: Object.freeze([...dependencies]),
  });
}

function analysisMetricDefinition<TId extends string>(
  outputId: TId,
  quantityKind: MainWireIntegratedModelOutputQuantityKindV3,
  unit: MainWireIntegratedModelOutputUnitV3,
  dependencies: readonly string[],
  sourcePath: string,
): MainWireIntegratedModelOutputDefinitionV3<TId> {
  return Object.freeze({
    outputId,
    kind: "metric" as const,
    quantityKind,
    unit,
    modelingStatus: "modeled" as const,
    sourceKind: "analysis-result" as const,
    sourcePath,
    significantDigits: 3,
    scope: "window" as const,
    dependencies: Object.freeze([...dependencies]),
  });
}

function valvePressureDependencyIdsV3(
  valve: "MV" | "AoV" | "TV" | "PV",
): readonly string[] {
  switch (valve) {
    case "MV":
      return [
        "hemodynamics.pressure.absolute.LA",
        "hemodynamics.pressure.absolute.LV",
      ];
    case "AoV":
      return [
        "hemodynamics.pressure.absolute.LV",
        "hemodynamics.pressure.absolute.Ao",
      ];
    case "TV":
      return [
        "hemodynamics.pressure.absolute.RA",
        "hemodynamics.pressure.absolute.RV",
      ];
    case "PV":
      return [
        "hemodynamics.pressure.absolute.RV",
        "hemodynamics.pressure.absolute.PA",
      ];
  }
}

function availableValue(
  outputId: MainWireIntegratedModelOutputIdV3,
  value: number,
  quality: "authoritative-state" | "accepted-derived",
): MainWireIntegratedModelOutputValueV3 {
  if (!Number.isFinite(value)) {
    throw new MainWireIntegratedModelOutputProjectionErrorV3(
      `${outputId} is available but is not finite`,
    );
  }
  return Object.freeze({
    outputId,
    value,
    availability: "available" as const,
    quality,
  });
}

function readbackValue(
  outputId: MainWireIntegratedModelOutputIdV3,
  value: number | undefined,
): MainWireIntegratedModelOutputValueV3 {
  return value === undefined
    ? Object.freeze({
        outputId,
        value: null,
        availability: "not-evaluated-at-accepted-state" as const,
        quality: "not-assessed" as const,
      })
    : availableValue(outputId, value, "accepted-derived");
}

function beatMetricValue(
  outputId: MainWireIntegratedModelOutputIdV3,
  value: number | null | undefined,
): MainWireIntegratedModelOutputValueV3 {
  return value === undefined || value === null
    ? Object.freeze({
        outputId,
        value: null,
        availability: "not-evaluated-at-accepted-state" as const,
        quality: "not-assessed" as const,
      })
    : availableValue(outputId, value, "accepted-derived");
}

function positiveDenominatorRatioV3(
  numerator: number,
  denominator: number,
): number | null {
  return denominator > 0 ? numerator / denominator : null;
}

function coronaryTerritoryIndexV3(territory: "LAD" | "LCx" | "RCA"): number {
  return territory === "LAD" ? 0 : territory === "LCx" ? 1 : 2;
}

function coronaryLayerIndexV3(
  layer: "subepicardial" | "subendocardial",
): number {
  return layer === "subepicardial" ? 0 : 1;
}

function regularSinusHeartRateBpmV3(
  state: MainWireIntegratedModelObservationV3["acceptedState"]["composedRhythm"],
): number {
  const source = state.regularAtrialSourceState;
  if (
    source === null ||
    source.configuration.rhythmClass !== "sinus" ||
    !(source.configuration.cycleLengthSec > 0)
  ) {
    throw new MainWireIntegratedModelOutputProjectionErrorV3(
      "regular-sinus heart rate is unavailable for the accepted rhythm state",
    );
  }
  return 60 / source.configuration.cycleLengthSec;
}

function regularSinusPhase01V3(
  state: MainWireIntegratedModelObservationV3["acceptedState"]["composedRhythm"],
): number {
  const source = state.regularAtrialSourceState;
  if (
    source === null ||
    source.configuration.rhythmClass !== "sinus" ||
    !(source.configuration.cycleLengthSec > 0)
  ) {
    throw new MainWireIntegratedModelOutputProjectionErrorV3(
      "regular-sinus phase is unavailable for the accepted rhythm state",
    );
  }
  const cycleLengthSec = source.configuration.cycleLengthSec;
  const previousActivationTimeSec =
    source.nextActivationTimeSec - cycleLengthSec;
  const elapsedSec = state.acceptedTimeSec - previousActivationTimeSec;
  const wrappedSec =
    ((elapsedSec % cycleLengthSec) + cycleLengthSec) % cycleLengthSec;
  const phase01 = wrappedSec / cycleLengthSec;
  if (!Number.isFinite(phase01) || phase01 < 0 || phase01 >= 1) {
    throw new MainWireIntegratedModelOutputProjectionErrorV3(
      "regular-sinus phase is outside [0,1)",
    );
  }
  return phase01;
}

function requiredAcceptedStateV3(
  accepted: MainWireIntegratedModelObservationV3["acceptedState"] | undefined,
): MainWireIntegratedModelObservationV3["acceptedState"] {
  if (accepted === undefined) {
    throw new MainWireIntegratedModelOutputProjectionErrorV3(
      "selected output requires an accepted-state readback",
    );
  }
  return accepted;
}

function positiveCycleLengthSecV3(value: number): number {
  if (!Number.isFinite(value) || !(value > 0)) {
    throw new MainWireIntegratedModelOutputProjectionErrorV3(
      "regular-sinus cycle length is invalid",
    );
  }
  return value;
}

function regularSinusPhaseFromClockV3(
  acceptedTimeSec: number,
  cycleLengthSec: number,
  nextActivationTimeSec: number,
): number {
  const cycle = positiveCycleLengthSecV3(cycleLengthSec);
  if (
    !Number.isFinite(acceptedTimeSec) ||
    acceptedTimeSec < 0 ||
    !Number.isFinite(nextActivationTimeSec) ||
    !(nextActivationTimeSec > acceptedTimeSec)
  ) {
    throw new MainWireIntegratedModelOutputProjectionErrorV3(
      "regular-sinus accepted/activation clock is invalid",
    );
  }
  const previousActivationTimeSec = nextActivationTimeSec - cycle;
  const elapsedSec = acceptedTimeSec - previousActivationTimeSec;
  const wrappedSec = ((elapsedSec % cycle) + cycle) % cycle;
  return wrappedSec / cycle;
}

function assertObservationReadbackPairV3(
  observation: MainWireIntegratedModelObservationV3,
): void {
  if (
    observation.source === "presentation-target" &&
    observation.lastAcceptedStep === null
  ) {
    throw new MainWireIntegratedModelOutputProjectionErrorV3(
      "presentation observation lacks its accepted-step readback",
    );
  }
  if (
    observation.source !== "presentation-target" &&
    observation.lastAcceptedStep !== null
  ) {
    throw new MainWireIntegratedModelOutputProjectionErrorV3(
      `${observation.source} observation unexpectedly carries a step readback`,
    );
  }
}
