import {
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD_CHECKPOINT_V2_ID,
  validateMainWireIntegratedModelStandardCheckpointV2,
} from "@/engine/myocardium/MainWireIntegratedModelStandardCheckpointV2";
import {
  EXECUTION_PLAN_NEWTON_WORKSPACE_V1_CAPABILITY,
  EXECUTION_PLAN_TYPED_AUTHORITY_BINDING_V1_CAPABILITY,
  assertBoundExecutionPlanV1,
  bindExecutionPlanV1,
  bindExecutionPlanSolveSystemRuntimeV1,
  executionPlanBaseTickAtTimeV1,
  executionPlanPresentationBaseTickV1,
  executionPlanTimeAtBaseTickV1,
  executionPlanUpdateGroupIsDueAtBaseTickV1,
  prepareBoundExecutionPlanSolveGroupV1,
  resolveBoundExecutionPlanUpdateScheduleV1,
  validateAndOwnExecutionPlanDescriptorV1,
  validateAndOwnExecutionPlanKernelCatalogV1,
  type BoundExecutionPlanV1,
  type BoundExecutionPlanUpdateGroupDispatchV1,
  type BoundExecutionPlanUpdateScheduleV1,
} from "@/runtime/executionPlan/BoundExecutionPlanV1";
import {
  bindMainWireFiveWallCoupledExecutionPlanRuntimeV1,
  MAIN_WIRE_FIVE_WALL_COUPLED_SYSTEM_KERNEL_V1_ID,
} from "@/engine/vnext/coupled/MainWireFiveWallCoupledNewtonShadowV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRESSURE_VOLUME_RELATIONS_V3_ID,
  MAIN_WIRE_INTEGRATED_MODEL_GUYTON_STARLING_ORIENTATION_V3_ID,
  MAIN_WIRE_INTEGRATED_MODEL_RESPONSIVE_STARLING_HYPERVOLEMIC_PARTITION_V3,
  MAIN_WIRE_INTEGRATED_MODEL_RESPONSIVE_STARLING_HYPOVOLEMIC_PARTITION_V3,
} from "@/engine/myocardium/MainWireIntegratedModelAnalysisContractV3";
import { buildMainWireIntegratedModelGuytonStarlingOrientationV3 } from "@/engine/myocardium/MainWireIntegratedModelGuytonStarlingOrientationV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
  MAIN_WIRE_INTEGRATED_MODEL_HEMODYNAMIC_RESEARCH_RANGES_V3,
  validateAndOwnMainWireIntegratedModelHemodynamicResearchInputsV3,
  type MainWireIntegratedModelHemodynamicResearchInputKeyV3,
  type MainWireIntegratedModelHemodynamicResearchInputsV3,
} from "@/engine/myocardium/MainWireIntegratedModelHemodynamicResearchInputsV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_MECHANISM_RESEARCH_INPUTS_V3,
  validateAndOwnMainWireIntegratedModelMechanismResearchInputsV3,
  type MainWireIntegratedModelMechanismResearchInputsV3,
} from "@/engine/myocardium/MainWireIntegratedModelMechanismResearchInputsV3";
import {
  MAIN_WIRE_FIVE_WALL_MECHANICS_RESEARCH_SCALE_RANGES_V1,
  type MainWireFiveWallMechanicsScaleKindV1,
} from "@/engine/myocardium/mechanics/MainWireFiveWallMechanicsResearchInputsV1";
import {
  MAIN_WIRE_FIVE_WALL_IDS_V1,
  type MainWireFiveWallIdV1,
} from "@/engine/myocardium/mechanics/MainWireFiveWallLandTriSegProviderV1";
import {
  MAIN_WIRE_FOUR_VALVE_AREA_INPUT_RANGES_V1,
  MAIN_WIRE_FOUR_VALVE_IDS_V1,
} from "@/engine/valves/MainWireFourValveDiseaseResearchBracketsV1";
import {
  OXYGEN_TRANSPORT_INPUT_RANGES_V1,
  type OxygenTransportInputsV1,
} from "@/engine/physiology/oxygenTransportV1";
import {
  MAIN_WIRE_COMMON_PERICARDIUM_RESEARCH_INPUT_RANGES_V1,
  type MainWireCommonPericardiumResearchInputKeyV1,
} from "@/engine/myocardium/mechanics/MainWireCommonPericardiumResearchInputsV1";
import { MAIN_WIRE_CORONARY_DISEASE_RESEARCH_INPUT_RANGES_V2 } from "@/engine/coronary/MainWireCoronaryDiseaseResearchInputsV2";
import {
  MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_CATALOG_V3,
  MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_IDS_V3,
  projectMainWireIntegratedModelSelectedValuesV3,
  type MainWireIntegratedModelOutputIdV3,
  type MainWireIntegratedModelOutputValueV3,
} from "@/engine/myocardium/MainWireIntegratedModelOutputRegistryV3";
import { MAIN_WIRE_INTEGRATED_MODEL_BEAT_METRICS_V3_ID } from "@/engine/myocardium/MainWireIntegratedModelBeatMetricsV3";
import {
  MainWireIntegratedModelSessionV3,
  type MainWireIntegratedModelObservationV3,
} from "@/engine/myocardium/MainWireIntegratedModelSessionV3";
import {
  MAIN_WIRE_COUPLED_HEMODYNAMICS_SOLVE_GROUP_ID_V1,
  MAIN_WIRE_COUPLED_HEMODYNAMICS_UPDATE_GROUP_ID_V1,
  MAIN_WIRE_NUMERICAL_BASE_TICK_SEC_V1,
  MAIN_WIRE_NUMERICAL_PRESENTATION_PERIOD_TICKS_V1,
} from "@/engine/executionPlan/MainWireNumericalClockV1";
import {
  MAIN_WIRE_INTEGRATED_TYPED_AUTHORITY_SESSION_V1_ID,
  MainWireIntegratedTypedAuthoritySessionV1,
  type MainWireFlatModelOwnedProjectionAdvanceV1,
  type MainWireTypedExecutionPlanInitializationV1,
} from "@/engine/vnext/MainWireIntegratedTypedAuthoritySessionV1";
import {
  runMainWireIntegratedModelFormalPressureVolumeProtocolV3,
  runMainWireIntegratedModelResponsiveStarlingProtocolV3,
  type MainWireIntegratedModelResponsiveStarlingPartitionV3,
} from "@/engine/myocardium/MainWireIntegratedModelResponsiveStarlingProtocolV3";
import { MAIN_WIRE_INTEGRATED_MODEL_TRANSACTION_V3_ID } from "@/engine/myocardium/MainWireIntegratedModelTransactionV3";
import { admitMainWireIntegratedModelSnapshotV3 } from "@/engine/myocardium/experiments/MainWireIntegratedModelSnapshotAdmissionV3";
import type {
  ExperimentCaptureResultV2,
  ExperimentSnapshotAdmissionResultV2,
} from "@/studio/contracts/v2/authoring";
import type {
  ExperimentContentV2,
  ScenarioCaptureV2,
  ScenarioCheckpointV2,
} from "@/studio/contracts/v2/content";
import {
  REGISTERED_MODEL_EXECUTION_PLAN_ADAPTER_V1_SCHEMA_ID,
  type RegisteredModelExecutableBundleV2,
} from "@/studio/contracts/v2/executable";
import type { StudioJsonValueV2 } from "@/studio/contracts/v2/json";
import type {
  ControlDefinitionV2,
  MetricOutputDefinitionV2,
  ModelContractV2,
  SignalOutputDefinitionV2,
} from "@/studio/contracts/v2/model";
import { studioNumericControlValueIssueV2 } from "@/studio/contracts/v2/control";
import {
  STUDIO_COMMON_SNAPSHOT_ADMISSION_ID_V1,
  STUDIO_EXACT_MODEL_KERNEL_V3_SCHEMA_ID,
  assertExactModelKernelManifestV3,
  type ExactModelKernelManifestV3,
} from "@/studio/contracts/v2/modelSurface";
import type {
  StudioControlActionV2,
  StudioFixturePatchV2,
} from "@/studio/contracts/v2/runtime";
import type {
  RegisteredModelPresentationBatchV2,
  StudioSimulationAnalysisV2,
  StudioSimulationFrameV2,
} from "@/studio/contracts/v2/simulation";
import { STUDIO_EXACT_PRESENTATION_BATCH_CAPABILITY_V1 } from "@/studio/contracts/v2/simulation";
import { validateAndOwnStudioSimulationPortableJsonV2 } from "@/studio/contracts/v2/simulation";
import {
  cloneAndFreezeStudioJson,
  studioCanonicalJsonStringify,
} from "@/domain/json/CanonicalJson";
import {
  MAIN_WIRE_INTEGRATED_STUDIO_MODEL_FAMILY_ID_V3,
  MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_MODEL_ID_V1,
} from "./MainWireIntegratedStudioModelIdentityV1";
import generatedExecutionPlanV1 from "./MainWireIntegratedExecutionPlanV1.generated.json";

export const MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_FIXTURE_SCHEMA_ID_V1 =
  "circleheart.main-wire-integrated-v3-regular-sinus-all-off-fixture.standard-v3" as const;
export const MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_CHECKPOINT_CODEC_ID_V1 =
  "circleheart.main-wire-integrated-v3-studio-checkpoint-codec.standard-v6" as const;
export const MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_HOT_PATH_INTEGRITY_TIER_V1 =
  "hot-path-lean" as const;

const MAIN_WIRE_EXECUTION_PLAN_DESCRIPTOR_V1 =
  validateAndOwnExecutionPlanDescriptorV1(generatedExecutionPlanV1);
const MAIN_WIRE_EXECUTION_PLAN_PRESENTATION_DT_SEC_V1 =
  MAIN_WIRE_EXECUTION_PLAN_DESCRIPTOR_V1.updateSchedule.presentationStepSec;
const MAIN_WIRE_EXECUTION_PLAN_SOLVE_SYSTEM_BINDINGS_V1 = Object.freeze([
  Object.freeze({
    systemKernelId: MAIN_WIRE_FIVE_WALL_COUPLED_SYSTEM_KERNEL_V1_ID,
    bind: bindMainWireFiveWallCoupledExecutionPlanRuntimeV1,
  }),
]);
const MAIN_WIRE_EXECUTION_PLAN_KERNEL_BINDINGS_V1 =
  validateAndOwnExecutionPlanKernelCatalogV1(
    Object.freeze({
      componentKernelIds: Object.freeze([
        "accepted-transaction-kernel-v1",
        "noncoronary-backward-euler-kernel-v1",
        "coronary-backward-euler-kernel-v2",
        "five-wall-land-triseg-kernel-v1",
      ]),
      hydraulicPathKernelIds: Object.freeze([
        "noncoronary-flow/resistive",
        "noncoronary-flow/valve",
        "noncoronary-flow/dynamic",
        "coronary-flow/large-arterial",
        "coronary-flow/micro-proximal-arteriolar",
        "coronary-flow/micro-intermediate-capillary",
        "coronary-flow/micro-distal-venular",
        "coronary-flow/large-venous-outlet",
      ]),
      solveSystemKernelIds: Object.freeze(
        MAIN_WIRE_EXECUTION_PLAN_SOLVE_SYSTEM_BINDINGS_V1.map(
          ({ systemKernelId }) => systemKernelId,
        ),
      ),
    }),
  );

export function bindMainWireIntegratedStudioExecutionPlanV1(): BoundExecutionPlanV1 {
  return bindExecutionPlanV1(
    MAIN_WIRE_EXECUTION_PLAN_DESCRIPTOR_V1,
    MAIN_WIRE_EXECUTION_PLAN_KERNEL_BINDINGS_V1,
  );
}

export const MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_CONTROL_IDS_V1 =
  Object.freeze({
    systemicResistance: "hemodynamics.systemic-resistance",
    pulmonaryResistance: "hemodynamics.pulmonary-resistance",
    venousTone: "hemodynamics.venous-tone",
    arterialStiffness: "hemodynamics.arterial-stiffness",
    heartRateBpm: "rhythm.heart-rate-bpm",
    totalBloodVolumeMl: "hemodynamics.total-blood-volume-ml",
    peepCmH2O: "ventilation.peep-cm-h2o",
    ventricularContractilityScale: "myocardium.contractility",
    activeTensionLA: "myocardium.active-tension-scale.LA",
    activeTensionLVFW: "myocardium.active-tension-scale.LVFW",
    activeTensionSEP: "myocardium.active-tension-scale.SEP",
    activeTensionRVFW: "myocardium.active-tension-scale.RVFW",
    activeTensionRA: "myocardium.active-tension-scale.RA",
    passiveStiffnessLA: "myocardium.passive-stiffness-scale.LA",
    passiveStiffnessLVFW: "myocardium.passive-stiffness-scale.LVFW",
    passiveStiffnessSEP: "myocardium.passive-stiffness-scale.SEP",
    passiveStiffnessRVFW: "myocardium.passive-stiffness-scale.RVFW",
    passiveStiffnessRA: "myocardium.passive-stiffness-scale.RA",
    calciumDecayTimeLA: "myocardium.calcium-decay-time-scale.LA",
    calciumDecayTimeLVFW: "myocardium.calcium-decay-time-scale.LVFW",
    calciumDecayTimeSEP: "myocardium.calcium-decay-time-scale.SEP",
    calciumDecayTimeRVFW: "myocardium.calcium-decay-time-scale.RVFW",
    calciumDecayTimeRA: "myocardium.calcium-decay-time-scale.RA",
    mvMaximumForwardEoaCm2: "valve.maximum-forward-eoa-cm2.MV",
    mvClosedReverseEroaCm2: "valve.closed-reverse-eroa-cm2.MV",
    aovMaximumForwardEoaCm2: "valve.maximum-forward-eoa-cm2.AoV",
    aovClosedReverseEroaCm2: "valve.closed-reverse-eroa-cm2.AoV",
    tvMaximumForwardEoaCm2: "valve.maximum-forward-eoa-cm2.TV",
    tvClosedReverseEroaCm2: "valve.closed-reverse-eroa-cm2.TV",
    pvMaximumForwardEoaCm2: "valve.maximum-forward-eoa-cm2.PV",
    pvClosedReverseEroaCm2: "valve.closed-reverse-eroa-cm2.PV",
    oxygenHemoglobinGPerDl: "oxygen.hemoglobin-g-per-dl",
    oxygenInspiredOxygenFraction01: "oxygen.inspired-oxygen-fraction",
    oxygenArterialCarbonDioxidePressureMmHg:
      "oxygen.arterial-carbon-dioxide-pressure-mm-hg",
    oxygenRespiratoryExchangeRatio: "oxygen.respiratory-exchange-ratio",
    oxygenBarometricPressureMmHg: "oxygen.barometric-pressure-mm-hg",
    oxygenTrueShuntFraction01: "oxygen.true-shunt-fraction",
    oxygenTargetConsumptionMlPerMin: "oxygen.target-consumption-ml-per-min",
    pericardiumReferenceCapacityScale: "pericardium.reference-capacity-scale",
    pericardiumPressureScale: "pericardium.pressure-scale",
    pericardiumExponentialStiffnessScale:
      "pericardium.exponential-stiffness-scale",
    pericardiumPrescribedFluidVolumeMl:
      "pericardium.prescribed-fluid-volume-ml",
    coronaryFocalDiameterLossLAD: "coronary.focal-diameter-loss-fraction.LAD",
    coronaryFocalDiameterLossLCx: "coronary.focal-diameter-loss-fraction.LCx",
    coronaryFocalDiameterLossRCA: "coronary.focal-diameter-loss-fraction.RCA",
    coronaryStructuralR1LADSubepicardial:
      "coronary.structural-r1-resistance-scale.LAD.subepicardial",
    coronaryStructuralR1LADSubendocardial:
      "coronary.structural-r1-resistance-scale.LAD.subendocardial",
    coronaryStructuralR1LCxSubepicardial:
      "coronary.structural-r1-resistance-scale.LCx.subepicardial",
    coronaryStructuralR1LCxSubendocardial:
      "coronary.structural-r1-resistance-scale.LCx.subendocardial",
    coronaryStructuralR1RCASubepicardial:
      "coronary.structural-r1-resistance-scale.RCA.subepicardial",
    coronaryStructuralR1RCASubendocardial:
      "coronary.structural-r1-resistance-scale.RCA.subendocardial",
    coronaryStructuralRmLADSubepicardial:
      "coronary.structural-rm-resistance-scale.LAD.subepicardial",
    coronaryStructuralRmLADSubendocardial:
      "coronary.structural-rm-resistance-scale.LAD.subendocardial",
    coronaryStructuralRmLCxSubepicardial:
      "coronary.structural-rm-resistance-scale.LCx.subepicardial",
    coronaryStructuralRmLCxSubendocardial:
      "coronary.structural-rm-resistance-scale.LCx.subendocardial",
    coronaryStructuralRmRCASubepicardial:
      "coronary.structural-rm-resistance-scale.RCA.subepicardial",
    coronaryStructuralRmRCASubendocardial:
      "coronary.structural-rm-resistance-scale.RCA.subendocardial",
  } as const);

export type MainWireIntegratedStudioStandardFixtureV1 = Readonly<{
  schemaId: typeof MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_FIXTURE_SCHEMA_ID_V1;
  rhythm: Readonly<{ mode: "regular-sinus-v3" }>;
  coronary: Readonly<{ topologyProfile: "coronary-network-v2" }>;
  dynamicMechanicalSupport: Readonly<{
    mode: "all-off-zero-inertance-v3";
  }>;
  hemodynamicResearchInputs: MainWireIntegratedModelHemodynamicResearchInputsV3;
  mechanismResearchInputs: MainWireIntegratedModelMechanismResearchInputsV3;
}>;

export type MainWireIntegratedStudioStandardExactReleaseV1 = Readonly<{
  manifest: ExactModelKernelManifestV3;
  executables: RegisteredModelExecutableBundleV2;
}>;

export type MainWireIntegratedStudioStandardAbsoluteControlAssignmentV1 =
  Readonly<{ controlId: string; value: number }>;

export const MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_DEFAULT_FIXTURE_V1: MainWireIntegratedStudioStandardFixtureV1 =
  Object.freeze({
    schemaId: MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_FIXTURE_SCHEMA_ID_V1,
    rhythm: Object.freeze({ mode: "regular-sinus-v3" }),
    coronary: Object.freeze({ topologyProfile: "coronary-network-v2" }),
    dynamicMechanicalSupport: Object.freeze({
      mode: "all-off-zero-inertance-v3",
    }),
    hemodynamicResearchInputs:
      MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
    mechanismResearchInputs:
      MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_MECHANISM_RESEARCH_INPUTS_V3,
  });

type RuntimeScenarioV1 = {
  fixture: MainWireIntegratedStudioStandardFixtureV1;
  inputEpoch: number;
  modelSession: MainWireIntegratedTypedAuthoritySessionV1;
  presentationOrdinal: number;
  executionPlanBinding: Readonly<{
    boundExecutionPlan: BoundExecutionPlanV1;
    modelSession: MainWireIntegratedTypedAuthoritySessionV1;
    updateSchedule: BoundExecutionPlanUpdateScheduleV1;
    presentationOriginBaseTick: number;
  }>;
};

type RuntimeSessionV1 = {
  scenarios: Map<string, RuntimeScenarioV1>;
};

const STANDARD_CONTROL_INPUT_KEYS_V1 = Object.freeze([
  Object.freeze({
    inputKey: "systemicResistance" as const,
    controlId:
      MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_CONTROL_IDS_V1.systemicResistance,
  }),
  Object.freeze({
    inputKey: "pulmonaryResistance" as const,
    controlId:
      MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_CONTROL_IDS_V1.pulmonaryResistance,
  }),
  Object.freeze({
    inputKey: "venousTone" as const,
    controlId: MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_CONTROL_IDS_V1.venousTone,
  }),
  Object.freeze({
    inputKey: "arterialStiffness" as const,
    controlId:
      MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_CONTROL_IDS_V1.arterialStiffness,
  }),
  Object.freeze({
    inputKey: "heartRateBpm" as const,
    controlId: MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_CONTROL_IDS_V1.heartRateBpm,
  }),
  Object.freeze({
    inputKey: "totalBloodVolumeMl" as const,
    controlId:
      MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_CONTROL_IDS_V1.totalBloodVolumeMl,
  }),
  Object.freeze({
    inputKey: "peepCmH2O" as const,
    controlId: MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_CONTROL_IDS_V1.peepCmH2O,
  }),
] satisfies readonly Readonly<{
  inputKey: MainWireIntegratedModelHemodynamicResearchInputKeyV3;
  controlId: string;
}>[]);

const STANDARD_PERICARDIUM_CONTROL_BINDINGS_V1 = Object.freeze([
  Object.freeze({
    inputKey: "referenceCapacityScale" as const,
    controlId:
      MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_CONTROL_IDS_V1.pericardiumReferenceCapacityScale,
  }),
  Object.freeze({
    inputKey: "pressureScale" as const,
    controlId:
      MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_CONTROL_IDS_V1.pericardiumPressureScale,
  }),
  Object.freeze({
    inputKey: "exponentialStiffnessScale" as const,
    controlId:
      MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_CONTROL_IDS_V1.pericardiumExponentialStiffnessScale,
  }),
  Object.freeze({
    inputKey: "prescribedFluidVolumeMl" as const,
    controlId:
      MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_CONTROL_IDS_V1.pericardiumPrescribedFluidVolumeMl,
  }),
] satisfies readonly Readonly<{
  inputKey: MainWireCommonPericardiumResearchInputKeyV1;
  controlId: string;
}>[]);

const STANDARD_CORONARY_TERRITORY_IDS_V1 = Object.freeze([
  "LAD",
  "LCx",
  "RCA",
] as const);
const STANDARD_CORONARY_LAYER_IDS_V1 = Object.freeze([
  "subepicardial",
  "subendocardial",
] as const);

const STANDARD_CORONARY_FOCAL_CONTROL_BINDINGS_V1 = Object.freeze(
  STANDARD_CORONARY_TERRITORY_IDS_V1.map((territoryId) =>
    Object.freeze({
      territoryId,
      controlId: `coronary.focal-diameter-loss-fraction.${territoryId}`,
    }),
  ),
);

const STANDARD_CORONARY_STRUCTURAL_CONTROL_BINDINGS_V1 = Object.freeze(
  (
    [
      Object.freeze({
        inputKey: "structuralR1ResistanceScaleByTerritoryLayer" as const,
        rangeKey: "structuralR1ResistanceScale" as const,
        controlPrefix: "coronary.structural-r1-resistance-scale",
      }),
      Object.freeze({
        inputKey: "structuralRmResistanceScaleByTerritoryLayer" as const,
        rangeKey: "structuralRmResistanceScale" as const,
        controlPrefix: "coronary.structural-rm-resistance-scale",
      }),
    ] as const
  ).flatMap(({ inputKey, rangeKey, controlPrefix }) =>
    STANDARD_CORONARY_TERRITORY_IDS_V1.flatMap((territoryId) =>
      STANDARD_CORONARY_LAYER_IDS_V1.map((layerId) =>
        Object.freeze({
          inputKey,
          rangeKey,
          territoryId,
          layerId,
          controlId: `${controlPrefix}.${territoryId}.${layerId}`,
        }),
      ),
    ),
  ),
);

const STANDARD_MECHANICS_CONTROL_BINDINGS_V1 = Object.freeze([
  ...mechanicsBindingsV1(
    "activeTensionScaleByWall",
    "myocardium.active-tension-scale",
  ),
  ...mechanicsBindingsV1(
    "passiveStiffnessScaleByWall",
    "myocardium.passive-stiffness-scale",
  ),
  ...mechanicsBindingsV1(
    "calciumDecayTimeScaleByWall",
    "myocardium.calcium-decay-time-scale",
  ),
]);

const STANDARD_VALVE_CONTROL_BINDINGS_V1 = Object.freeze([
  ...MAIN_WIRE_FOUR_VALVE_IDS_V1.flatMap((valveId) => [
    Object.freeze({
      areaKey: "maximumForwardEoaCm2" as const,
      valveId,
      controlId: `valve.maximum-forward-eoa-cm2.${valveId}`,
    }),
    Object.freeze({
      areaKey: "closedReverseEroaCm2" as const,
      valveId,
      controlId: `valve.closed-reverse-eroa-cm2.${valveId}`,
    }),
  ]),
]);

type OxygenTransportNumericInputKeyV1 = Exclude<
  keyof OxygenTransportInputsV1,
  "inputId"
>;

const STANDARD_OXYGEN_CONTROL_BINDINGS_V1 = Object.freeze([
  Object.freeze({
    inputKey: "hemoglobinGPerDl" as const,
    controlId:
      MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_CONTROL_IDS_V1.oxygenHemoglobinGPerDl,
  }),
  Object.freeze({
    inputKey: "inspiredOxygenFraction01" as const,
    controlId:
      MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_CONTROL_IDS_V1.oxygenInspiredOxygenFraction01,
  }),
  Object.freeze({
    inputKey: "arterialCarbonDioxidePressureMmHg" as const,
    controlId:
      MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_CONTROL_IDS_V1.oxygenArterialCarbonDioxidePressureMmHg,
  }),
  Object.freeze({
    inputKey: "respiratoryExchangeRatio" as const,
    controlId:
      MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_CONTROL_IDS_V1.oxygenRespiratoryExchangeRatio,
  }),
  Object.freeze({
    inputKey: "barometricPressureMmHg" as const,
    controlId:
      MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_CONTROL_IDS_V1.oxygenBarometricPressureMmHg,
  }),
  Object.freeze({
    inputKey: "trueShuntFraction01" as const,
    controlId:
      MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_CONTROL_IDS_V1.oxygenTrueShuntFraction01,
  }),
  Object.freeze({
    inputKey: "targetOxygenConsumptionMlPerMin" as const,
    controlId:
      MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_CONTROL_IDS_V1.oxygenTargetConsumptionMlPerMin,
  }),
] satisfies readonly Readonly<{
  inputKey: OxygenTransportNumericInputKeyV1;
  controlId: string;
}>[]);

const STANDARD_PRIMITIVE_SIGNAL_DEFINITIONS_V1 = Object.freeze(
  MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_CATALOG_V3.filter(
    (definition) => definition.kind === "signal",
  ).map((definition): SignalOutputDefinitionV2 =>
    Object.freeze({
      outputId: definition.outputId,
      kind: "signal",
      unit: definition.unit,
      significantDigits: definition.significantDigits,
      shape: "scalar",
      sampling: "accepted-step",
    }),
  ),
);

const STANDARD_PRIMITIVE_SIGNAL_IDS_V1 = new Set(
  STANDARD_PRIMITIVE_SIGNAL_DEFINITIONS_V1.map(({ outputId }) => outputId),
);

const STANDARD_MODEL_METRIC_DEFINITIONS_V1 = Object.freeze(
  MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_CATALOG_V3.filter(
    (definition) => definition.kind === "metric",
  ).map((definition): MetricOutputDefinitionV2 =>
    Object.freeze({
      outputId: definition.outputId,
      kind: "metric",
      unit: definition.unit,
      significantDigits: definition.significantDigits,
      shape: "scalar",
      scope: definition.scope ?? "beat",
      dependencies: Object.freeze([...(definition.dependencies ?? [])]),
    }),
  ),
);

const STANDARD_EXACT_OUTPUT_IDS_V1 = new Set([
  ...STANDARD_PRIMITIVE_SIGNAL_IDS_V1,
  ...STANDARD_MODEL_METRIC_DEFINITIONS_V1.map(({ outputId }) => outputId),
]);

/** Standard numerical runtime used by every Studio Session. */
export class MainWireIntegratedStudioStandardRuntimeHostV1 {
  readonly #sessions = new Map<string, RuntimeSessionV1>();
  readonly #retiredSessionIds = new Set<string>();
  readonly #executionPlanScenarioOwners = new WeakMap<
    object,
    Readonly<{ runtimeSessionId: string; scenarioId: string }>
  >();

  async createSession(
    runtimeSessionId: string,
    scenarioInputs: readonly Readonly<{
      scenarioId: string;
      fixture: StudioJsonValueV2;
      checkpoint?: ScenarioCheckpointV2;
    }>[],
    suppliedExecutionPlans?: ReadonlyMap<string, BoundExecutionPlanV1>,
  ): Promise<void> {
    requiredIdV1(runtimeSessionId, "runtimeSessionId");
    if (
      this.#sessions.has(runtimeSessionId) ||
      this.#retiredSessionIds.has(runtimeSessionId)
    ) {
      throw new Error(
        `Standard runtime session ID is active or retired: ${runtimeSessionId}`,
      );
    }
    if (scenarioInputs.length === 0) {
      throw new Error(
        "Standard runtime session requires at least one Scenario",
      );
    }
    if (
      suppliedExecutionPlans !== undefined &&
      suppliedExecutionPlans.size !== scenarioInputs.length
    ) {
      throw new Error(
        "Standard runtime execution-plan Scenario set is incomplete",
      );
    }
    const scenarios = new Map<string, RuntimeScenarioV1>();
    for (const input of scenarioInputs) {
      requiredIdV1(input.scenarioId, "scenarioId");
      if (scenarios.has(input.scenarioId)) {
        throw new Error(
          `duplicate Standard runtime Scenario: ${input.scenarioId}`,
        );
      }
      const fixture = validateAndOwnStandardFixtureV1(input.fixture);
      const checkpoint =
        input.checkpoint === undefined
          ? undefined
          : validateScenarioCheckpointV1(input.checkpoint);
      const boundExecutionPlan =
        suppliedExecutionPlans?.get(input.scenarioId) ??
        bindMainWireIntegratedStudioExecutionPlanV1();
      if (
        suppliedExecutionPlans !== undefined &&
        !suppliedExecutionPlans.has(input.scenarioId)
      ) {
        throw new Error(
          `Standard runtime execution plan is unavailable for Scenario ${input.scenarioId}`,
        );
      }
      const preparedExecutionPlan = this.#prepareExecutionPlan(
        runtimeSessionId,
        input.scenarioId,
        boundExecutionPlan,
      );
      const modelSession =
        checkpoint === undefined
          ? await MainWireIntegratedTypedAuthoritySessionV1.create(
              fixture.hemodynamicResearchInputs,
              1,
              preparedExecutionPlan.initialization,
              fixture.mechanismResearchInputs,
            )
          : await MainWireIntegratedTypedAuthoritySessionV1.restoreStandardExactCheckpoint(
              checkpoint.payload,
              fixture.hemodynamicResearchInputs,
              1,
              preparedExecutionPlan.initialization,
              fixture.mechanismResearchInputs,
            );
      if (
        checkpoint !== undefined &&
        (modelSession.currentAcceptedState().revision !==
          checkpoint.acceptedRevision ||
          modelSession.currentAcceptedState().acceptedTimeSec !==
            checkpoint.acceptedTimeSec)
      ) {
        throw new Error(
          `Standard Scenario ${input.scenarioId} checkpoint clock mismatch`,
        );
      }
      scenarios.set(input.scenarioId, {
        fixture,
        inputEpoch: 0,
        modelSession,
        presentationOrdinal: 0,
        executionPlanBinding: Object.freeze({
          boundExecutionPlan,
          modelSession,
          updateSchedule: preparedExecutionPlan.updateSchedule,
          presentationOriginBaseTick: executionPlanBaseTickAtTimeV1(
            preparedExecutionPlan.updateSchedule,
            modelSession.currentAcceptedState().acceptedTimeSec,
          ),
        }),
      });
    }
    this.#sessions.set(runtimeSessionId, { scenarios });
  }

  closeSession(runtimeSessionId: string): void {
    if (this.#sessions.delete(runtimeSessionId)) {
      this.#retiredSessionIds.add(runtimeSessionId);
    }
  }

  currentInputEpoch(runtimeSessionId: string, scenarioId: string): number {
    return this.#requiredScenario(runtimeSessionId, scenarioId).inputEpoch;
  }

  currentFrame(
    runtimeSessionId: string,
    scenarioId: string,
  ): StudioSimulationFrameV2 {
    const scenario = this.#requiredScenario(runtimeSessionId, scenarioId);
    const accepted = scenario.modelSession.currentAcceptedState();
    return standardFrameFromValuesV1({
      runtimeSessionId,
      scenarioId,
      inputEpoch: scenario.inputEpoch,
      acceptedRevision: accepted.revision,
      acceptedTimeSec: accepted.acceptedTimeSec,
      values: scenario.modelSession.projectCurrentAcceptedValuesV1(
        MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_IDS_V3,
      ),
    });
  }

  #prepareExecutionPlan(
    runtimeSessionId: string,
    scenarioId: string,
    boundExecutionPlan: BoundExecutionPlanV1,
  ): Readonly<{
    initialization: MainWireTypedExecutionPlanInitializationV1;
    updateSchedule: BoundExecutionPlanUpdateScheduleV1;
  }> {
    assertBoundExecutionPlanV1(
      boundExecutionPlan,
      MAIN_WIRE_EXECUTION_PLAN_DESCRIPTOR_V1,
    );
    const owner = this.#executionPlanScenarioOwners.get(boundExecutionPlan);
    if (owner === undefined) {
      this.#executionPlanScenarioOwners.set(
        boundExecutionPlan,
        Object.freeze({
          runtimeSessionId,
          scenarioId,
        }),
      );
    } else if (
      owner.runtimeSessionId !== runtimeSessionId ||
      owner.scenarioId !== scenarioId
    ) {
      throw new Error(
        "Standard execution plan cannot be shared between Scenarios",
      );
    }
    const updateSchedule =
      resolveBoundExecutionPlanUpdateScheduleV1(boundExecutionPlan);
    const updateGroup =
      assertMainWireExecutionPlanUpdateScheduleV1(updateSchedule);
    const prepared = prepareBoundExecutionPlanSolveGroupV1(
      boundExecutionPlan,
      updateGroup.solveGroupId,
    );
    return Object.freeze({
      initialization: Object.freeze({
        boundExecutionPlan,
        coupledNewtonWorkspace: bindExecutionPlanSolveSystemRuntimeV1(
          boundExecutionPlan,
          updateGroup.solveGroupId,
          prepared,
          MAIN_WIRE_EXECUTION_PLAN_SOLVE_SYSTEM_BINDINGS_V1,
        ),
      }),
      updateSchedule,
    });
  }

  advanceOnePresentationStep(
    runtimeSessionId: string,
    scenarioId: string,
  ): StudioSimulationFrameV2 {
    const scenario = this.#requiredScenario(runtimeSessionId, scenarioId);
    const projection = this.#advanceScenarioProjection(
      scenario,
      MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_IDS_V3,
    );
    const advance = projection.advance;
    if (projection.projectedValues === null) {
      throw new Error("Standard presentation projection is unavailable");
    }
    return standardFrameFromValuesV1({
      runtimeSessionId,
      scenarioId,
      inputEpoch: scenario.inputEpoch,
      acceptedRevision: advance.acceptedRevision,
      acceptedTimeSec: advance.acceptedTimeSec,
      values: projection.projectedValues,
    });
  }

  advancePresentationBatch(
    runtimeSessionId: string,
    scenarioId: string,
    stepCount: number,
    presentationOutputIds: readonly string[],
  ): RegisteredModelPresentationBatchV2 {
    if (!Number.isSafeInteger(stepCount) || stepCount < 1 || stepCount > 256) {
      throw new Error("Standard presentation batch stepCount is invalid");
    }
    const outputIds = validateSelectedOutputIdsV1(presentationOutputIds);
    const scenario = this.#requiredScenario(runtimeSessionId, scenarioId);
    const acceptedRevisions = new Float64Array(stepCount);
    const acceptedTimesSec = new Float64Array(stepCount);
    const outputStates = new Uint8Array(stepCount * outputIds.length);
    const outputValues = new Float64Array(stepCount * outputIds.length);
    let terminalFrame: StudioSimulationFrameV2 | null = null;
    for (let index = 0; index < stepCount; index += 1) {
      const terminal = index === stepCount - 1;
      const projection = this.#advanceScenarioProjection(
        scenario,
        terminal ? MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_IDS_V3 : outputIds,
      );
      const advance = projection.advance;
      const values = projection.projectedValues;
      if (values === null) {
        throw new Error(
          "Standard presentation batch projection is unavailable",
        );
      }
      acceptedRevisions[index] = advance.acceptedRevision;
      acceptedTimesSec[index] = advance.acceptedTimeSec;
      for (
        let outputIndex = 0;
        outputIndex < outputIds.length;
        outputIndex += 1
      ) {
        const outputId = outputIds[outputIndex]!;
        const value = values[outputId];
        if (value === undefined) {
          throw new Error(
            `Standard presentation output ${outputId} is unavailable`,
          );
        }
        const packedIndex = index * outputIds.length + outputIndex;
        outputStates[packedIndex] = standardOutputStateCodeV1(value);
        if (value.value === null) {
          outputValues[packedIndex] = Number.NaN;
        } else if (typeof value.value === "number") {
          outputValues[packedIndex] = value.value;
        } else {
          throw new Error(
            `Standard presentation output ${outputId} must be scalar or null`,
          );
        }
      }
      if (terminal) {
        terminalFrame = standardFrameFromValuesV1({
          runtimeSessionId,
          scenarioId,
          inputEpoch: scenario.inputEpoch,
          acceptedRevision: advance.acceptedRevision,
          acceptedTimeSec: advance.acceptedTimeSec,
          values,
        });
      }
    }
    if (terminalFrame === null) {
      throw new Error(
        "Standard presentation batch terminal frame is unavailable",
      );
    }
    return Object.freeze({
      outputIds,
      acceptedRevisions,
      acceptedTimesSec,
      outputStates,
      outputValues,
      terminalFrame,
    });
  }

  #advanceScenarioProjection(
    scenario: RuntimeScenarioV1,
    outputIds: readonly MainWireIntegratedModelOutputIdV3[],
  ): Readonly<{
    advance: Extract<
      MainWireFlatModelOwnedProjectionAdvanceV1,
      { status: "advanced" }
    >;
    projectedValues: ReturnType<
      typeof projectMainWireIntegratedModelSelectedValuesV3
    >;
  }> {
    const executionPlanBinding = scenario.executionPlanBinding;
    if (
      executionPlanBinding === null ||
      executionPlanBinding.modelSession !== scenario.modelSession
    ) {
      throw new Error("Standard Scenario update schedule is not installed");
    }
    const nextOrdinal = scenario.presentationOrdinal + 1;
    const targetBaseTick = executionPlanPresentationBaseTickV1(
      executionPlanBinding.updateSchedule,
      executionPlanBinding.presentationOriginBaseTick,
      nextOrdinal,
    );
    const [updateGroup] = executionPlanBinding.updateSchedule.groups;
    if (
      updateGroup === undefined ||
      !executionPlanUpdateGroupIsDueAtBaseTickV1(
        executionPlanBinding.updateSchedule,
        updateGroup,
        targetBaseTick,
      )
    ) {
      throw new Error("Standard presentation target has no scheduled update");
    }
    const targetTimeSec = executionPlanTimeAtBaseTickV1(
      executionPlanBinding.updateSchedule,
      targetBaseTick,
    );
    const projection =
      scenario.modelSession.advanceToPresentationTimeWithSelectedOutputProjectionV1(
        targetTimeSec,
        outputIds,
      );
    if (projection.advance.status !== "advanced") {
      throw new Error(advanceFailureMessageV1(projection.advance));
    }
    if (projection.projectedValues === null) {
      throw new Error("Standard presentation projection is unavailable");
    }
    scenario.presentationOrdinal = nextOrdinal;
    return Object.freeze({
      advance: projection.advance,
      projectedValues: projection.projectedValues,
    });
  }

  async applyControl(
    runtimeSessionId: string,
    scenarioId: string,
    controlId: string,
    value: number,
    expectedInputEpoch: number,
  ): Promise<StudioSimulationFrameV2> {
    const scenario = this.#requiredScenario(runtimeSessionId, scenarioId);
    if (scenario.inputEpoch !== expectedInputEpoch) {
      throw new Error(
        `Standard control input epoch is stale: expected ${expectedInputEpoch}, current ${scenario.inputEpoch}`,
      );
    }
    const fixture =
      applyMainWireIntegratedStudioStandardAbsoluteControlAssignmentsV1(
        scenario.fixture,
        [Object.freeze({ controlId, value })],
      );
    return this.#warmStartFixtureAtomically(
      runtimeSessionId,
      scenarioId,
      fixture,
      expectedInputEpoch,
    );
  }

  async replaceFixture(
    runtimeSessionId: string,
    scenarioId: string,
    fixtureValue: StudioJsonValueV2,
  ): Promise<number> {
    const scenario = this.#requiredScenario(runtimeSessionId, scenarioId);
    await this.#warmStartFixtureAtomically(
      runtimeSessionId,
      scenarioId,
      validateAndOwnStandardFixtureV1(fixtureValue),
      scenario.inputEpoch,
    );
    return scenario.inputEpoch;
  }

  async requestAnalysis(
    runtimeSessionId: string,
    scenarioId: string,
    analysisId: string,
    expectedInputEpoch: number,
    expectedAcceptedRevision: number,
    expectedAcceptedTimeSec: number,
    analysisPartition?: string,
    onProgress?: (analysis: StudioSimulationAnalysisV2) => void,
  ): Promise<StudioSimulationAnalysisV2> {
    const scenario = this.#requiredScenario(runtimeSessionId, scenarioId);
    const observation = scenario.modelSession.observe();
    const accepted = observation.acceptedState;
    if (
      scenario.inputEpoch !== expectedInputEpoch ||
      accepted.revision !== expectedAcceptedRevision ||
      accepted.acceptedTimeSec !== expectedAcceptedTimeSec
    ) {
      throw new Error("Standard analysis source clocks are stale");
    }
    if (
      analysisId !==
        MAIN_WIRE_INTEGRATED_MODEL_GUYTON_STARLING_ORIENTATION_V3_ID &&
      analysisId !==
        MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRESSURE_VOLUME_RELATIONS_V3_ID
    ) {
      throw new Error(
        `Standard exact model analysis is not registered: ${analysisId}`,
      );
    }
    const responsivePartition:
      MainWireIntegratedModelResponsiveStarlingPartitionV3 | undefined =
      analysisPartition === undefined
        ? undefined
        : analysisPartition ===
              MAIN_WIRE_INTEGRATED_MODEL_RESPONSIVE_STARLING_HYPOVOLEMIC_PARTITION_V3 ||
            analysisPartition ===
              MAIN_WIRE_INTEGRATED_MODEL_RESPONSIVE_STARLING_HYPERVOLEMIC_PARTITION_V3
          ? analysisPartition
          : (() => {
              throw new Error(
                `Standard analysis partition is not registered: ${analysisPartition}`,
              );
            })();
    const toAnalysis = (
      starling:
        | Awaited<
            ReturnType<
              typeof runMainWireIntegratedModelResponsiveStarlingProtocolV3
            >
          >
        | Awaited<
            ReturnType<
              typeof runMainWireIntegratedModelFormalPressureVolumeProtocolV3
            >
          >
        | null,
      sourceObservation?: MainWireIntegratedModelObservationV3,
    ): StudioSimulationAnalysisV2 => {
      const payload = validateAndOwnStudioSimulationPortableJsonV2(
        buildMainWireIntegratedModelGuytonStarlingOrientationV3(
          starling?.anchorObservation ?? sourceObservation ?? observation,
          scenario.fixture.hemodynamicResearchInputs,
          starling === null
            ? undefined
            : Object.freeze({
                right: starling.right,
                left: starling.left,
              }),
        ),
        "$.mainWireIntegratedStandardAnalysis.payload",
      );
      return Object.freeze({
        modelId: MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_MODEL_ID_V1,
        runtimeSessionId,
        scenarioId,
        inputEpoch: scenario.inputEpoch,
        sourceAcceptedRevision: accepted.revision,
        sourceAcceptedTimeSec: accepted.acceptedTimeSec,
        analysisId,
        payload,
      });
    };
    // Analysis is a cold boundary. Rehydrate an isolated object Session from
    // the exact accepted checkpoint instead of pulling the live typed
    // authority back onto the presentation hot path.
    const exactCheckpoint =
      await scenario.modelSession.checkpointStandardExact();
    let analysisSource =
      await MainWireIntegratedModelSessionV3.restoreStandardExactCheckpoint(
        exactCheckpoint,
        scenario.fixture.hemodynamicResearchInputs,
        1,
        scenario.fixture.mechanismResearchInputs,
      );
    // A restored checkpoint deliberately omits the previous accepted-step
    // object. Reconstruct one readback on a disposable clone so the analytic
    // Guyton orientation can appear before the slow settled Starling family,
    // without advancing the actual analysis source.
    if (observation.lastAcceptedStep !== null) {
      onProgress?.(toAnalysis(null));
    } else {
      const previewAcceptedTimeSec =
        analysisSource.currentAcceptedState().acceptedTimeSec;
      const previewAdvance = analysisSource.advanceToPresentationTime(
        previewAcceptedTimeSec + MAIN_WIRE_EXECUTION_PLAN_PRESENTATION_DT_SEC_V1,
      );
      if (previewAdvance.status === "advanced") {
        onProgress?.(toAnalysis(null, previewAdvance.observation));
      }
      analysisSource =
        await MainWireIntegratedModelSessionV3.restoreStandardExactCheckpoint(
          exactCheckpoint,
          scenario.fixture.hemodynamicResearchInputs,
          1,
          scenario.fixture.mechanismResearchInputs,
        );
    }
    const starling =
      analysisId ===
      MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRESSURE_VOLUME_RELATIONS_V3_ID
        ? await runMainWireIntegratedModelFormalPressureVolumeProtocolV3(
            analysisSource,
            scenario.fixture.hemodynamicResearchInputs,
            (progress) => onProgress?.(toAnalysis(progress)),
            responsivePartition,
          )
        : runMainWireIntegratedModelResponsiveStarlingProtocolV3(
            analysisSource,
            (progress) => onProgress?.(toAnalysis(progress)),
            responsivePartition,
          );
    return toAnalysis(starling);
  }

  async captureDesiredContent(
    input: Readonly<{
      experimentId: string;
      model: ModelContractV2;
      desiredContent: Readonly<{
        modelId: string;
        scenarios: readonly Readonly<{
          scenarioId: string;
          label: string;
          fixture: StudioJsonValueV2;
        }>[];
        surface: ExperimentContentV2["surface"];
      }>;
      correlation: Readonly<{
        runtimeSessionId: string;
        scenarios: readonly Readonly<{
          scenarioId: string;
          expectedInputEpoch: number;
        }>[];
      }>;
    }>,
  ): Promise<ExperimentCaptureResultV2> {
    assertStandardModelV1(input.model);
    if (
      input.desiredContent.modelId !==
      MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_MODEL_ID_V1
    ) {
      throw new Error("Standard capture desired modelId mismatch");
    }
    const runtime = this.#requiredSession(input.correlation.runtimeSessionId);
    if (
      input.desiredContent.scenarios.length !==
      input.correlation.scenarios.length
    ) {
      throw new Error("Standard capture Scenario correlation length mismatch");
    }
    const candidates = input.desiredContent.scenarios.map((desired, index) => {
      const correlation = input.correlation.scenarios[index];
      if (correlation?.scenarioId !== desired.scenarioId) {
        throw new Error("Standard capture Scenario order mismatch");
      }
      const current = runtime.scenarios.get(desired.scenarioId);
      if (current === undefined) {
        throw new Error(
          `Standard capture Scenario not found: ${desired.scenarioId}`,
        );
      }
      const desiredFixture = validateAndOwnStandardFixtureV1(desired.fixture);
      if (
        studioCanonicalJsonStringify(current.fixture) !==
        studioCanonicalJsonStringify(desiredFixture)
      ) {
        throw new Error(
          `Standard capture fixture is stale: ${desired.scenarioId}`,
        );
      }
      if (current.inputEpoch !== correlation.expectedInputEpoch) {
        throw new Error(
          `Standard capture input epoch is stale: ${desired.scenarioId}`,
        );
      }
      return Object.freeze({ desired, correlation, current });
    });
    const payloads = await Promise.all(
      candidates.map(({ current }) =>
        current.modelSession.checkpointStandardExact(),
      ),
    );
    const scenarios = candidates.map(
      ({ desired, correlation, current }, index) => {
        if (current.inputEpoch !== correlation.expectedInputEpoch) {
          throw new Error(
            `Standard capture changed while freezing: ${desired.scenarioId}`,
          );
        }
        const payload = payloads[index]!;
        return Object.freeze({
          scenarioId: desired.scenarioId,
          label: desired.label,
          capture: Object.freeze({
            fixture: current.fixture,
            checkpoint: Object.freeze({
              acceptedRevision: payload.revision,
              acceptedTimeSec: payload.acceptedTimeSec,
              payload: cloneAndFreezeStudioJson(payload),
            }),
          }),
        });
      },
    );
    return Object.freeze({
      content: Object.freeze({
        modelId: MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_MODEL_ID_V1,
        scenarios: Object.freeze(scenarios),
        surface: input.desiredContent.surface,
      }),
      confirmation: Object.freeze({
        experimentId: input.experimentId,
        runtimeSessionId: input.correlation.runtimeSessionId,
        scenarios: Object.freeze(
          input.correlation.scenarios.map((value) =>
            Object.freeze({ ...value }),
          ),
        ),
      }),
    });
  }

  #requiredSession(runtimeSessionId: string): RuntimeSessionV1 {
    const session = this.#sessions.get(runtimeSessionId);
    if (session === undefined) {
      throw new Error(
        `Standard runtime session not found: ${runtimeSessionId}`,
      );
    }
    return session;
  }

  #requiredScenario(
    runtimeSessionId: string,
    scenarioId: string,
  ): RuntimeScenarioV1 {
    const scenario =
      this.#requiredSession(runtimeSessionId).scenarios.get(scenarioId);
    if (scenario === undefined) {
      throw new Error(
        `Standard runtime Scenario not found: ${runtimeSessionId}/${scenarioId}`,
      );
    }
    return scenario;
  }

  async #warmStartFixtureAtomically(
    runtimeSessionId: string,
    scenarioId: string,
    fixture: MainWireIntegratedStudioStandardFixtureV1,
    expectedInputEpoch: number,
  ): Promise<StudioSimulationFrameV2> {
    const original = this.#requiredScenario(runtimeSessionId, scenarioId);
    if (original.inputEpoch !== expectedInputEpoch) {
      throw new Error("Standard fixture warm start input epoch is stale");
    }
    const preparedExecutionPlan = this.#prepareExecutionPlan(
      runtimeSessionId,
      scenarioId,
      bindMainWireIntegratedStudioExecutionPlanV1(),
    );
    const candidate =
      await original.modelSession.warmStartWithHemodynamicResearchInputs(
        fixture.hemodynamicResearchInputs,
        1,
        preparedExecutionPlan.initialization,
        fixture.mechanismResearchInputs,
      );
    const accepted = candidate.currentAcceptedState();
    const sourceAccepted = original.modelSession.currentAcceptedState();
    if (
      accepted.revision !== sourceAccepted.revision ||
      accepted.acceptedTimeSec !== sourceAccepted.acceptedTimeSec
    ) {
      throw new Error("Standard fixture warm start changed the accepted clock");
    }
    if (
      fixture.hemodynamicResearchInputs.totalBloodVolumeMl !==
      original.fixture.hemodynamicResearchInputs.totalBloodVolumeMl
    ) {
      const preflightExecutionPlan = this.#prepareExecutionPlan(
        runtimeSessionId,
        scenarioId,
        bindMainWireIntegratedStudioExecutionPlanV1(),
      );
      const preflight =
        await MainWireIntegratedTypedAuthoritySessionV1.restoreCanonicalBinary(
          await candidate.checkpointCanonicalBinary(),
          fixture.hemodynamicResearchInputs,
          1,
          fixture.mechanismResearchInputs,
          preflightExecutionPlan.initialization,
        );
      const originBaseTick = executionPlanBaseTickAtTimeV1(
        preflightExecutionPlan.updateSchedule,
        accepted.acceptedTimeSec,
      );
      const endTimeSec =
        accepted.acceptedTimeSec +
        60 / fixture.hemodynamicResearchInputs.heartRateBpm;
      for (let ordinal = 1; ; ordinal += 1) {
        const targetBaseTick = executionPlanPresentationBaseTickV1(
          preflightExecutionPlan.updateSchedule,
          originBaseTick,
          ordinal,
        );
        const targetTimeSec = executionPlanTimeAtBaseTickV1(
          preflightExecutionPlan.updateSchedule,
          targetBaseTick,
        );
        if (targetTimeSec > endTimeSec + 1e-12) break;
        const preflightAdvance =
          preflight.advanceToPresentationTime(targetTimeSec);
        if (preflightAdvance.status !== "advanced") {
          throw new Error(
            `Standard TBV warm start rejected before commit: ${advanceFailureMessageV1(
              preflightAdvance,
            )}`,
          );
        }
      }
    }
    const current = this.#requiredScenario(runtimeSessionId, scenarioId);
    if (current !== original || current.inputEpoch !== expectedInputEpoch) {
      throw new Error("Standard fixture warm start became stale before swap");
    }
    current.fixture = fixture;
    current.modelSession = candidate;
    current.executionPlanBinding = Object.freeze({
      boundExecutionPlan:
        preparedExecutionPlan.initialization.boundExecutionPlan,
      modelSession: candidate,
      updateSchedule: preparedExecutionPlan.updateSchedule,
      presentationOriginBaseTick: executionPlanBaseTickAtTimeV1(
        preparedExecutionPlan.updateSchedule,
        accepted.acceptedTimeSec,
      ),
    });
    current.presentationOrdinal = 0;
    current.inputEpoch += 1;
    return this.currentFrame(runtimeSessionId, scenarioId);
  }
}

export function createCircleHeartExactModelReleaseV1(): MainWireIntegratedStudioStandardExactReleaseV1 {
  const host = new MainWireIntegratedStudioStandardRuntimeHostV1();
  return Object.freeze({
    manifest: createMainWireIntegratedStudioExactKernelV1(),
    executables: standardExecutableBundleV1(host),
  });
}

export function createMainWireIntegratedStudioExactKernelV1(): ExactModelKernelManifestV3 {
  const primitiveControlCatalog = standardControlCatalogV1();
  const manifest: ExactModelKernelManifestV3 = Object.freeze({
    schemaId: STUDIO_EXACT_MODEL_KERNEL_V3_SCHEMA_ID,
    modelId: MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_MODEL_ID_V1,
    modelFamilyId: MAIN_WIRE_INTEGRATED_STUDIO_MODEL_FAMILY_ID_V3,
    equations: Object.freeze({
      transactionId: MAIN_WIRE_INTEGRATED_MODEL_TRANSACTION_V3_ID,
      coronaryOwner: "main-wire-five-wall-coronary-transaction-v3",
      rhythmOwner: "accepted-composed-rhythm-transaction-v2",
      dynamicMechanicalSupportOwner:
        "circleheart-dynamic-mechanical-support-network-v1",
      chamberMechanicsOwner: "main-wire-five-wall-mechanics-research-input-v1",
      valveAreaOwner: "main-wire-four-valve-disease-research-input-v1",
      oxygenTransportOwner: "whole-body-beat-mean-oxygen-transport-v1",
      acceptedStepBeatMetricOwner:
        MAIN_WIRE_INTEGRATED_MODEL_BEAT_METRICS_V3_ID,
    }),
    runtime: Object.freeze({
      numericalSessionId: MAIN_WIRE_INTEGRATED_TYPED_AUTHORITY_SESSION_V1_ID,
      presentationDtSec: MAIN_WIRE_EXECUTION_PLAN_PRESENTATION_DT_SEC_V1,
      hotPathIntegrityTier:
        MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_HOT_PATH_INTEGRITY_TIER_V1,
      acceptedBoundaryCapture: true,
      fixtureChangeSemantics:
        "atomic-accepted-state-warm-start-same-clock-new-fixture-epoch",
      scope:
        "regular-sinus-all-off-zero-inertance-with-bounded-hemodynamic-mechanics-valve-pericardium-coronary-disease-and-oxygen-controls",
    }),
    solver: Object.freeze({
      candidateSemantics:
        "event-limited-atomic-composed-rhythm-coronary-dynamic-mcs",
      acceptedStateMutation: false,
      failureRollback: "previous-accepted-tuple",
    }),
    fixtureSchema: Object.freeze({
      fixtureSchemaId:
        MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_FIXTURE_SCHEMA_ID_V1,
      definition: Object.freeze({
        schemaId: MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_FIXTURE_SCHEMA_ID_V1,
        exactKeys: Object.freeze([
          "schemaId",
          "rhythm",
          "coronary",
          "dynamicMechanicalSupport",
          "hemodynamicResearchInputs",
          "mechanismResearchInputs",
        ]),
        hemodynamicResearchInputRanges:
          MAIN_WIRE_INTEGRATED_MODEL_HEMODYNAMIC_RESEARCH_RANGES_V3,
        mechanismResearchInputRanges: Object.freeze({
          chamberMechanics:
            MAIN_WIRE_FIVE_WALL_MECHANICS_RESEARCH_SCALE_RANGES_V1,
          valveAreas: MAIN_WIRE_FOUR_VALVE_AREA_INPUT_RANGES_V1,
          pericardium: MAIN_WIRE_COMMON_PERICARDIUM_RESEARCH_INPUT_RANGES_V1,
          coronaryDisease: MAIN_WIRE_CORONARY_DISEASE_RESEARCH_INPUT_RANGES_V2,
          oxygenTransport: OXYGEN_TRANSPORT_INPUT_RANGES_V1,
        }),
      }),
    }),
    checkpointCodec: Object.freeze({
      checkpointCodecId:
        MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_CHECKPOINT_CODEC_ID_V1,
      definition: Object.freeze({
        checkpointId: MAIN_WIRE_INTEGRATED_MODEL_STANDARD_CHECKPOINT_V2_ID,
        schemaVersion: 2,
        fixturePairing:
          "regular-sinus-all-off-and-complete-standard-fixture-identity",
        restoreSemantics: "exact-no-migration-no-clock-rebase",
      }),
    }),
    primitiveControlCatalog,
    primitiveSignalCatalog: STANDARD_PRIMITIVE_SIGNAL_DEFINITIONS_V1,
    modelMetricCatalog: STANDARD_MODEL_METRIC_DEFINITIONS_V1,
    capabilities: Object.freeze([
      STUDIO_EXACT_PRESENTATION_BATCH_CAPABILITY_V1,
      EXECUTION_PLAN_TYPED_AUTHORITY_BINDING_V1_CAPABILITY,
      EXECUTION_PLAN_NEWTON_WORKSPACE_V1_CAPABILITY,
      ...primitiveControlCatalog.map(({ controlId }) => `control/${controlId}`),
      ...STANDARD_PRIMITIVE_SIGNAL_DEFINITIONS_V1.map(
        ({ outputId }) => `output/${outputId}`,
      ),
      ...STANDARD_MODEL_METRIC_DEFINITIONS_V1.map(
        ({ outputId }) => `output/${outputId}`,
      ),
      `analysis/${MAIN_WIRE_INTEGRATED_MODEL_GUYTON_STARLING_ORIENTATION_V3_ID}`,
      `analysis/${MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRESSURE_VOLUME_RELATIONS_V3_ID}`,
    ]),
  });
  assertExactModelKernelManifestV3(manifest);
  return manifest;
}

export function applyMainWireIntegratedStudioStandardAbsoluteControlAssignmentsV1(
  fixture: MainWireIntegratedStudioStandardFixtureV1,
  assignments: readonly MainWireIntegratedStudioStandardAbsoluteControlAssignmentV1[],
): MainWireIntegratedStudioStandardFixtureV1 {
  const initial = validateAndOwnStandardFixtureV1(fixture);
  const candidate = assignments.reduce<MainWireIntegratedStudioStandardFixtureV1>(
    (current, assignment) => {
    const definition = requiredControlDefinitionV1(assignment.controlId);
    const issue = studioNumericControlValueIssueV2(
      assignment.value,
      definition,
    );
    if (issue !== undefined) {
      throw new Error(
        `Standard control ${assignment.controlId} value ${issue}`,
      );
    }
    if (
      assignment.controlId ===
      MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_CONTROL_IDS_V1.ventricularContractilityScale
    ) {
      return {
        ...current,
        mechanismResearchInputs: {
          ...current.mechanismResearchInputs,
          chamberMechanics: {
            ...current.mechanismResearchInputs.chamberMechanics,
            activeTensionScaleByWall: {
              ...current.mechanismResearchInputs.chamberMechanics
                .activeTensionScaleByWall,
              LVFW: assignment.value,
              SEP: assignment.value,
              RVFW: assignment.value,
            },
          },
        },
      };
    }
    const hemodynamicBinding = STANDARD_CONTROL_INPUT_KEYS_V1.find(
      ({ controlId }) => controlId === assignment.controlId,
    );
    if (hemodynamicBinding !== undefined) {
      return {
        ...current,
        hemodynamicResearchInputs: {
          ...current.hemodynamicResearchInputs,
          [hemodynamicBinding.inputKey]: assignment.value,
        },
      };
    }
    const mechanicsBinding = STANDARD_MECHANICS_CONTROL_BINDINGS_V1.find(
      ({ controlId }) => controlId === assignment.controlId,
    );
    if (mechanicsBinding !== undefined) {
      return {
        ...current,
        mechanismResearchInputs: {
          ...current.mechanismResearchInputs,
          chamberMechanics: {
            ...current.mechanismResearchInputs.chamberMechanics,
            [mechanicsBinding.scaleKind]: {
              ...current.mechanismResearchInputs.chamberMechanics[
                mechanicsBinding.scaleKind
              ],
              [mechanicsBinding.wallId]: assignment.value,
            },
          },
        },
      };
    }
    const valveBinding = STANDARD_VALVE_CONTROL_BINDINGS_V1.find(
      ({ controlId }) => controlId === assignment.controlId,
    );
    if (valveBinding !== undefined) {
      return {
        ...current,
        mechanismResearchInputs: {
          ...current.mechanismResearchInputs,
          valveAreas: {
            ...current.mechanismResearchInputs.valveAreas,
            [valveBinding.valveId]: {
              ...current.mechanismResearchInputs.valveAreas[
                valveBinding.valveId
              ],
              [valveBinding.areaKey]: assignment.value,
            },
          },
        },
      };
    }
    const oxygenBinding = STANDARD_OXYGEN_CONTROL_BINDINGS_V1.find(
      ({ controlId }) => controlId === assignment.controlId,
    );
    if (oxygenBinding !== undefined) {
      return {
        ...current,
        mechanismResearchInputs: {
          ...current.mechanismResearchInputs,
          oxygenTransport: {
            ...current.mechanismResearchInputs.oxygenTransport,
            [oxygenBinding.inputKey]: assignment.value,
          },
        },
      };
    }
    const pericardiumBinding = STANDARD_PERICARDIUM_CONTROL_BINDINGS_V1.find(
      ({ controlId }) => controlId === assignment.controlId,
    );
    if (pericardiumBinding !== undefined) {
      return {
        ...current,
        mechanismResearchInputs: {
          ...current.mechanismResearchInputs,
          pericardium: {
            ...current.mechanismResearchInputs.pericardium,
            [pericardiumBinding.inputKey]: assignment.value,
          },
        },
      };
    }
    const coronaryFocalBinding =
      STANDARD_CORONARY_FOCAL_CONTROL_BINDINGS_V1.find(
        ({ controlId }) => controlId === assignment.controlId,
      );
    if (coronaryFocalBinding !== undefined) {
      return {
        ...current,
        mechanismResearchInputs: {
          ...current.mechanismResearchInputs,
          coronaryDisease: {
            ...current.mechanismResearchInputs.coronaryDisease,
            focalDiameterLossFraction01ByTerritory: {
              ...current.mechanismResearchInputs.coronaryDisease
                .focalDiameterLossFraction01ByTerritory,
              [coronaryFocalBinding.territoryId]: assignment.value,
            },
          },
        },
      };
    }
    const coronaryStructuralBinding =
      STANDARD_CORONARY_STRUCTURAL_CONTROL_BINDINGS_V1.find(
        ({ controlId }) => controlId === assignment.controlId,
      );
    if (coronaryStructuralBinding !== undefined) {
      const disease = current.mechanismResearchInputs.coronaryDisease;
      const field = coronaryStructuralBinding.inputKey;
      return {
        ...current,
        mechanismResearchInputs: {
          ...current.mechanismResearchInputs,
          coronaryDisease: {
            ...disease,
            [field]: {
              ...disease[field],
              [coronaryStructuralBinding.territoryId]: {
                ...disease[field][coronaryStructuralBinding.territoryId],
                [coronaryStructuralBinding.layerId]: assignment.value,
              },
            },
          },
        },
      };
    }
    throw new Error(
      `Standard control is not registered: ${assignment.controlId}`,
    );
    },
    initial,
  );
  return validateAndOwnStandardFixtureV1(candidate);
}

function standardExecutableBundleV1(
  host: MainWireIntegratedStudioStandardRuntimeHostV1,
): RegisteredModelExecutableBundleV2 {
  const captureAdapter = Object.freeze({
    modelId: MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_MODEL_ID_V1,
    fixtureSchemaId: MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_FIXTURE_SCHEMA_ID_V1,
    checkpointCodecId:
      MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_CHECKPOINT_CODEC_ID_V1,
    validateFixture(
      input: Readonly<{ model: ModelContractV2; fixture: StudioJsonValueV2 }>,
    ) {
      assertStandardModelV1(input.model);
      validateAndOwnStandardFixtureV1(input.fixture);
      return undefined;
    },
    async validateCapture(
      input: Readonly<{
        model: ModelContractV2;
        capture: ScenarioCaptureV2;
      }>,
    ): Promise<void> {
      assertStandardModelV1(input.model);
      const fixture = validateAndOwnStandardFixtureV1(input.capture.fixture);
      const checkpoint = validateScenarioCheckpointV1(input.capture.checkpoint);
      const restored =
        await MainWireIntegratedModelSessionV3.restoreStandardExactCheckpoint(
          checkpoint.payload,
          fixture.hemodynamicResearchInputs,
          1,
          fixture.mechanismResearchInputs,
        );
      const accepted = restored.currentAcceptedState();
      if (
        accepted.revision !== checkpoint.acceptedRevision ||
        accepted.acceptedTimeSec !== checkpoint.acceptedTimeSec
      ) {
        throw new Error("Standard exact checkpoint restore clock mismatch");
      }
      const roundTrip = await restored.checkpointStandardExact();
      if (
        studioCanonicalJsonStringify(roundTrip) !==
        studioCanonicalJsonStringify(checkpoint.payload)
      ) {
        throw new Error("Standard exact checkpoint restore is not canonical");
      }
    },
  });
  const fixtureAdapter = Object.freeze({
    modelId: MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_MODEL_ID_V1,
    fixtureSchemaId: MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_FIXTURE_SCHEMA_ID_V1,
    validateCompleteFixture(
      input: Readonly<{
        context: Readonly<{ scenarioId: string; modelId: string }>;
        fixture: StudioJsonValueV2;
      }>,
    ) {
      assertRuntimeContextV1(input.context);
      validateAndOwnStandardFixtureV1(input.fixture);
      return undefined;
    },
    reduceControlAction(
      input: Readonly<{
        context: Readonly<{ scenarioId: string; modelId: string }>;
        fixture: StudioJsonValueV2;
        action: StudioControlActionV2;
      }>,
    ): StudioFixturePatchV2 {
      assertRuntimeContextV1(input.context);
      const fixture = validateAndOwnStandardFixtureV1(input.fixture);
      const next =
        applyMainWireIntegratedStudioStandardAbsoluteControlAssignmentsV1(
          fixture,
          [input.action],
        );
      const commonVentricularActiveTension =
        input.action.controlId ===
        MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_CONTROL_IDS_V1.ventricularContractilityScale;
      if (commonVentricularActiveTension) {
        return Object.freeze({
          changes: Object.freeze(
            (["LVFW", "SEP", "RVFW"] as const).map((wallId) =>
              Object.freeze({
                path: Object.freeze([
                  "mechanismResearchInputs",
                  "chamberMechanics",
                  "activeTensionScaleByWall",
                  wallId,
                ] as const),
                value:
                  next.mechanismResearchInputs.chamberMechanics
                    .activeTensionScaleByWall[wallId],
              }),
            ),
          ),
        });
      }
      const hemodynamicBinding = STANDARD_CONTROL_INPUT_KEYS_V1.find(
        ({ controlId }) => controlId === input.action.controlId,
      );
      if (hemodynamicBinding !== undefined) {
        return singleFixtureChangeV1(
          ["hemodynamicResearchInputs", hemodynamicBinding.inputKey],
          next.hemodynamicResearchInputs[hemodynamicBinding.inputKey],
        );
      }
      const mechanicsBinding = STANDARD_MECHANICS_CONTROL_BINDINGS_V1.find(
        ({ controlId }) => controlId === input.action.controlId,
      );
      if (mechanicsBinding !== undefined) {
        return singleFixtureChangeV1(
          [
            "mechanismResearchInputs",
            "chamberMechanics",
            mechanicsBinding.scaleKind,
            mechanicsBinding.wallId,
          ],
          next.mechanismResearchInputs.chamberMechanics[
            mechanicsBinding.scaleKind
          ][mechanicsBinding.wallId],
        );
      }
      const valveBinding = STANDARD_VALVE_CONTROL_BINDINGS_V1.find(
        ({ controlId }) => controlId === input.action.controlId,
      );
      if (valveBinding !== undefined) {
        return singleFixtureChangeV1(
          [
            "mechanismResearchInputs",
            "valveAreas",
            valveBinding.valveId,
            valveBinding.areaKey,
          ],
          next.mechanismResearchInputs.valveAreas[valveBinding.valveId][
            valveBinding.areaKey
          ],
        );
      }
      const oxygenBinding = STANDARD_OXYGEN_CONTROL_BINDINGS_V1.find(
        ({ controlId }) => controlId === input.action.controlId,
      );
      if (oxygenBinding !== undefined) {
        return singleFixtureChangeV1(
          [
            "mechanismResearchInputs",
            "oxygenTransport",
            oxygenBinding.inputKey,
          ],
          next.mechanismResearchInputs.oxygenTransport[oxygenBinding.inputKey],
        );
      }
      const pericardiumBinding = STANDARD_PERICARDIUM_CONTROL_BINDINGS_V1.find(
        ({ controlId }) => controlId === input.action.controlId,
      );
      if (pericardiumBinding !== undefined) {
        return singleFixtureChangeV1(
          [
            "mechanismResearchInputs",
            "pericardium",
            pericardiumBinding.inputKey,
          ],
          next.mechanismResearchInputs.pericardium[pericardiumBinding.inputKey],
        );
      }
      const coronaryFocalBinding =
        STANDARD_CORONARY_FOCAL_CONTROL_BINDINGS_V1.find(
          ({ controlId }) => controlId === input.action.controlId,
        );
      if (coronaryFocalBinding !== undefined) {
        return singleFixtureChangeV1(
          [
            "mechanismResearchInputs",
            "coronaryDisease",
            "focalDiameterLossFraction01ByTerritory",
            coronaryFocalBinding.territoryId,
          ],
          next.mechanismResearchInputs.coronaryDisease
            .focalDiameterLossFraction01ByTerritory[
            coronaryFocalBinding.territoryId
          ],
        );
      }
      const coronaryStructuralBinding =
        STANDARD_CORONARY_STRUCTURAL_CONTROL_BINDINGS_V1.find(
          ({ controlId }) => controlId === input.action.controlId,
        );
      if (coronaryStructuralBinding !== undefined) {
        return singleFixtureChangeV1(
          [
            "mechanismResearchInputs",
            "coronaryDisease",
            coronaryStructuralBinding.inputKey,
            coronaryStructuralBinding.territoryId,
            coronaryStructuralBinding.layerId,
          ],
          next.mechanismResearchInputs.coronaryDisease[
            coronaryStructuralBinding.inputKey
          ][coronaryStructuralBinding.territoryId][
            coronaryStructuralBinding.layerId
          ],
        );
      }
      throw new Error(
        `Standard control is not registered: ${input.action.controlId}`,
      );
    },
  });
  const simulationAdapter = Object.freeze({
    modelId: MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_MODEL_ID_V1,
    fixtureSchemaId: MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_FIXTURE_SCHEMA_ID_V1,
    checkpointCodecId:
      MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_CHECKPOINT_CODEC_ID_V1,
    createSession: (
      input: Readonly<{
        runtimeSessionId: string;
        scenarios: readonly Readonly<{
          scenarioId: string;
          fixture: StudioJsonValueV2;
          checkpoint?: ScenarioCheckpointV2;
        }>[];
      }>,
    ) => host.createSession(input.runtimeSessionId, input.scenarios),
    disposeSession: (runtimeSessionId: string) =>
      host.closeSession(runtimeSessionId),
    currentFrame: (
      input: Readonly<{ runtimeSessionId: string; scenarioId: string }>,
    ) => host.currentFrame(input.runtimeSessionId, input.scenarioId),
    advanceOnePresentationStep: async (
      input: Readonly<{ runtimeSessionId: string; scenarioId: string }>,
    ) =>
      host.advanceOnePresentationStep(input.runtimeSessionId, input.scenarioId),
    advancePresentationBatch: async (
      input: Readonly<{
        runtimeSessionId: string;
        scenarioId: string;
        stepCount: number;
        presentationOutputIds: readonly string[];
      }>,
    ) =>
      host.advancePresentationBatch(
        input.runtimeSessionId,
        input.scenarioId,
        input.stepCount,
        input.presentationOutputIds,
      ),
    applyControl: async (
      input: Readonly<{
        runtimeSessionId: string;
        scenarioId: string;
        controlId: string;
        value: number;
        expectedInputEpoch: number;
      }>,
    ) =>
      host.applyControl(
        input.runtimeSessionId,
        input.scenarioId,
        input.controlId,
        input.value,
        input.expectedInputEpoch,
      ),
    requestAnalysis: (
      input: Readonly<{
        runtimeSessionId: string;
        scenarioId: string;
        analysisId: string;
        expectedInputEpoch: number;
        expectedAcceptedRevision: number;
        expectedAcceptedTimeSec: number;
        analysisPartition?: string;
        onProgress?: (analysis: StudioSimulationAnalysisV2) => void;
      }>,
    ) =>
      host.requestAnalysis(
        input.runtimeSessionId,
        input.scenarioId,
        input.analysisId,
        input.expectedInputEpoch,
        input.expectedAcceptedRevision,
        input.expectedAcceptedTimeSec,
        input.analysisPartition,
        input.onProgress,
      ),
    replaceFixture: (
      input: Readonly<{
        runtimeSessionId: string;
        scenarioId: string;
        fixture: StudioJsonValueV2;
      }>,
    ) =>
      host.replaceFixture(
        input.runtimeSessionId,
        input.scenarioId,
        input.fixture,
      ),
    currentInputEpoch: (
      input: Readonly<{
        runtimeSessionId: string;
        scenarioId: string;
      }>,
    ) => host.currentInputEpoch(input.runtimeSessionId, input.scenarioId),
  });
  return Object.freeze({
    modelId: MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_MODEL_ID_V1,
    fixtureSchemaId: MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_FIXTURE_SCHEMA_ID_V1,
    checkpointCodecId:
      MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_CHECKPOINT_CODEC_ID_V1,
    snapshotGateId: STUDIO_COMMON_SNAPSHOT_ADMISSION_ID_V1,
    captureAdapter,
    experimentCapture: Object.freeze({
      modelId: MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_MODEL_ID_V1,
      fixtureSchemaId:
        MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_FIXTURE_SCHEMA_ID_V1,
      checkpointCodecId:
        MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_CHECKPOINT_CODEC_ID_V1,
      captureAcceptedCandidate: host.captureDesiredContent.bind(host),
    }),
    snapshotGate: Object.freeze({
      modelId: MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_MODEL_ID_V1,
      snapshotGateId: STUDIO_COMMON_SNAPSHOT_ADMISSION_ID_V1,
      async admitFrozenCandidate(
        input: Readonly<{
          model: ModelContractV2;
          content: ExperimentContentV2;
        }>,
      ): Promise<ExperimentSnapshotAdmissionResultV2> {
        assertStandardModelV1(input.model);
        if (
          input.content.modelId !==
          MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_MODEL_ID_V1
        ) {
          return Object.freeze({
            status: "rejected",
            reason: "content modelId mismatch",
          });
        }
        for (const scenario of input.content.scenarios) {
          await captureAdapter.validateCapture({
            model: input.model,
            capture: scenario.capture,
          });
          const fixture = validateAndOwnStandardFixtureV1(
            scenario.capture.fixture,
          );
          const standardCheckpoint =
            await validateMainWireIntegratedModelStandardCheckpointV2(
              scenario.capture.checkpoint.payload,
            );
          const admission = await admitMainWireIntegratedModelSnapshotV3({
            candidateCheckpoint: standardCheckpoint.numericalCheckpoint,
            hemodynamicResearchInputs: fixture.hemodynamicResearchInputs,
            mechanismResearchInputs: fixture.mechanismResearchInputs,
          });
          if (admission.status !== "accepted") {
            return Object.freeze({
              status: "rejected",
              reason: `${scenario.scenarioId}: ${admission.reason}`,
            });
          }
        }
        return Object.freeze({ status: "passed" });
      },
    }),
    fixtureAdapter,
    simulationAdapter,
    executionPlan: Object.freeze({
      schemaId: REGISTERED_MODEL_EXECUTION_PLAN_ADAPTER_V1_SCHEMA_ID,
      modelId: MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_MODEL_ID_V1,
      descriptor: MAIN_WIRE_EXECUTION_PLAN_DESCRIPTOR_V1,
      bind: bindMainWireIntegratedStudioExecutionPlanV1,
      createSession: (input) =>
        host.createSession(
          input.runtimeSessionId,
          input.scenarios,
          input.boundExecutionPlans,
        ),
    }),
  });
}

function standardControlCatalogV1(): readonly ControlDefinitionV2[] {
  return Object.freeze([
    ...STANDARD_CONTROL_INPUT_KEYS_V1.map(({ inputKey, controlId }) => {
      const range =
        MAIN_WIRE_INTEGRATED_MODEL_HEMODYNAMIC_RESEARCH_RANGES_V3[inputKey];
      return Object.freeze({
        controlId,
        valueType: "number" as const,
        unit: standardUnitV1(inputKey),
        minimum: range.minimum,
        maximum: range.maximum,
        step: range.step,
        defaultValue:
          MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3[
            inputKey
          ],
        changeSemantics: "accepted-state-warm-start" as const,
      });
    }),
    Object.freeze({
      controlId:
        MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_CONTROL_IDS_V1.ventricularContractilityScale,
      valueType: "number" as const,
      unit: "1",
      minimum:
        MAIN_WIRE_FIVE_WALL_MECHANICS_RESEARCH_SCALE_RANGES_V1
          .activeTensionScaleByWall.minimum,
      maximum:
        MAIN_WIRE_FIVE_WALL_MECHANICS_RESEARCH_SCALE_RANGES_V1
          .activeTensionScaleByWall.maximum,
      step: MAIN_WIRE_FIVE_WALL_MECHANICS_RESEARCH_SCALE_RANGES_V1
        .activeTensionScaleByWall.step,
      defaultValue: 1,
      changeSemantics: "accepted-state-warm-start" as const,
    }),
    ...STANDARD_MECHANICS_CONTROL_BINDINGS_V1.map((binding) => {
      const range =
        MAIN_WIRE_FIVE_WALL_MECHANICS_RESEARCH_SCALE_RANGES_V1[
          binding.scaleKind
        ];
      return Object.freeze({
        controlId: binding.controlId,
        valueType: "number" as const,
        unit: "1",
        minimum: range.minimum,
        maximum: range.maximum,
        step: range.step,
        defaultValue:
          MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_MECHANISM_RESEARCH_INPUTS_V3
            .chamberMechanics[binding.scaleKind][binding.wallId],
        changeSemantics: "accepted-state-warm-start" as const,
      });
    }),
    ...STANDARD_VALVE_CONTROL_BINDINGS_V1.map((binding) => {
      const range =
        MAIN_WIRE_FOUR_VALVE_AREA_INPUT_RANGES_V1[binding.valveId][
          binding.areaKey
        ];
      return Object.freeze({
        controlId: binding.controlId,
        valueType: "number" as const,
        unit: "cm2",
        minimum: range.minimum,
        maximum: range.maximum,
        step: range.step,
        defaultValue:
          MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_MECHANISM_RESEARCH_INPUTS_V3
            .valveAreas[binding.valveId][binding.areaKey],
        changeSemantics: "accepted-state-warm-start" as const,
      });
    }),
    ...STANDARD_OXYGEN_CONTROL_BINDINGS_V1.map((binding) => {
      const range = OXYGEN_TRANSPORT_INPUT_RANGES_V1[binding.inputKey];
      return Object.freeze({
        controlId: binding.controlId,
        valueType: "number" as const,
        unit: oxygenControlUnitV1(binding.inputKey),
        minimum: range.minimum,
        maximum: range.maximum,
        step: range.step,
        defaultValue:
          MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_MECHANISM_RESEARCH_INPUTS_V3
            .oxygenTransport[binding.inputKey],
        changeSemantics: "accepted-state-warm-start" as const,
      });
    }),
    ...STANDARD_PERICARDIUM_CONTROL_BINDINGS_V1.map((binding) => {
      const range =
        MAIN_WIRE_COMMON_PERICARDIUM_RESEARCH_INPUT_RANGES_V1[binding.inputKey];
      return Object.freeze({
        controlId: binding.controlId,
        valueType: "number" as const,
        unit: binding.inputKey === "prescribedFluidVolumeMl" ? "mL" : "1",
        minimum: range.minimum,
        maximum: range.maximum,
        step: range.step,
        defaultValue:
          MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_MECHANISM_RESEARCH_INPUTS_V3
            .pericardium[binding.inputKey],
        changeSemantics: "accepted-state-warm-start" as const,
      });
    }),
    ...STANDARD_CORONARY_FOCAL_CONTROL_BINDINGS_V1.map((binding) => {
      const range =
        MAIN_WIRE_CORONARY_DISEASE_RESEARCH_INPUT_RANGES_V2.focalDiameterLossFraction01;
      return Object.freeze({
        controlId: binding.controlId,
        valueType: "number" as const,
        unit: "1",
        minimum: range.minimum,
        maximum: range.maximum,
        step: range.step,
        defaultValue:
          MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_MECHANISM_RESEARCH_INPUTS_V3
            .coronaryDisease.focalDiameterLossFraction01ByTerritory[
            binding.territoryId
          ],
        changeSemantics: "accepted-state-warm-start" as const,
      });
    }),
    ...STANDARD_CORONARY_STRUCTURAL_CONTROL_BINDINGS_V1.map((binding) => {
      const range =
        MAIN_WIRE_CORONARY_DISEASE_RESEARCH_INPUT_RANGES_V2[binding.rangeKey];
      return Object.freeze({
        controlId: binding.controlId,
        valueType: "number" as const,
        unit: "1",
        minimum: range.minimum,
        maximum: range.maximum,
        step: range.step,
        defaultValue:
          MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_MECHANISM_RESEARCH_INPUTS_V3
            .coronaryDisease[binding.inputKey][binding.territoryId][
            binding.layerId
          ],
        changeSemantics: "accepted-state-warm-start" as const,
      });
    }),
  ]);
}

function requiredControlDefinitionV1(controlId: string): ControlDefinitionV2 {
  const matches = standardControlCatalogV1().filter(
    (definition) => definition.controlId === controlId,
  );
  if (matches.length !== 1) {
    throw new Error(`Standard control is not registered: ${controlId}`);
  }
  return matches[0]!;
}

function standardUnitV1(
  inputKey: MainWireIntegratedModelHemodynamicResearchInputKeyV3,
): string {
  switch (inputKey) {
    case "heartRateBpm":
      return "bpm";
    case "totalBloodVolumeMl":
      return "mL";
    case "peepCmH2O":
      return "cmH2O";
    default:
      return "1";
  }
}

function oxygenControlUnitV1(
  inputKey: OxygenTransportNumericInputKeyV1,
): string {
  switch (inputKey) {
    case "hemoglobinGPerDl":
      return "g/dL";
    case "arterialCarbonDioxidePressureMmHg":
    case "barometricPressureMmHg":
      return "mmHg";
    case "targetOxygenConsumptionMlPerMin":
      return "mL O2/min";
    default:
      return "1";
  }
}

function mechanicsBindingsV1(
  scaleKind: MainWireFiveWallMechanicsScaleKindV1,
  controlPrefix: string,
): readonly Readonly<{
  scaleKind: MainWireFiveWallMechanicsScaleKindV1;
  wallId: MainWireFiveWallIdV1;
  controlId: string;
}>[] {
  return Object.freeze(
    MAIN_WIRE_FIVE_WALL_IDS_V1.map((wallId) =>
      Object.freeze({
        scaleKind,
        wallId,
        controlId: `${controlPrefix}.${wallId}`,
      }),
    ),
  );
}

function singleFixtureChangeV1(
  path: readonly [string, ...string[]],
  value: number,
): StudioFixturePatchV2 {
  return Object.freeze({
    changes: Object.freeze([
      Object.freeze({
        path: Object.freeze([...path]) as readonly [string, ...string[]],
        value,
      }),
    ]),
  });
}

function validateAndOwnStandardFixtureV1(
  value: unknown,
): MainWireIntegratedStudioStandardFixtureV1 {
  const record = exactRecordV1(
    value,
    [
      "coronary",
      "dynamicMechanicalSupport",
      "hemodynamicResearchInputs",
      "mechanismResearchInputs",
      "rhythm",
      "schemaId",
    ],
    "Standard fixture",
  );
  if (
    record.schemaId !==
    MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_FIXTURE_SCHEMA_ID_V1
  ) {
    throw new Error("Standard fixture schemaId mismatch");
  }
  exactLiteralRecordV1(record.rhythm, "mode", "regular-sinus-v3", "rhythm");
  exactLiteralRecordV1(
    record.coronary,
    "topologyProfile",
    "coronary-network-v2",
    "coronary",
  );
  exactLiteralRecordV1(
    record.dynamicMechanicalSupport,
    "mode",
    "all-off-zero-inertance-v3",
    "dynamicMechanicalSupport",
  );
  const hemodynamicResearchInputs =
    validateAndOwnMainWireIntegratedModelHemodynamicResearchInputsV3(
      record.hemodynamicResearchInputs,
    );
  const mechanismResearchInputs =
    validateAndOwnMainWireIntegratedModelMechanismResearchInputsV3(
      record.mechanismResearchInputs,
    );
  return Object.freeze({
    schemaId: MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_FIXTURE_SCHEMA_ID_V1,
    rhythm: Object.freeze({ mode: "regular-sinus-v3" }),
    coronary: Object.freeze({ topologyProfile: "coronary-network-v2" }),
    dynamicMechanicalSupport: Object.freeze({
      mode: "all-off-zero-inertance-v3",
    }),
    hemodynamicResearchInputs,
    mechanismResearchInputs,
  });
}

function validateScenarioCheckpointV1(value: unknown): ScenarioCheckpointV2 {
  const record = exactRecordV1(
    value,
    ["acceptedRevision", "acceptedTimeSec", "payload"],
    "Standard checkpoint",
  );
  if (
    !Number.isSafeInteger(record.acceptedRevision) ||
    (record.acceptedRevision as number) < 0
  ) {
    throw new Error("Standard checkpoint acceptedRevision is invalid");
  }
  if (
    !Number.isFinite(record.acceptedTimeSec) ||
    (record.acceptedTimeSec as number) < 0
  ) {
    throw new Error("Standard checkpoint acceptedTimeSec is invalid");
  }
  const payload = cloneAndFreezeStudioJson<StudioJsonValueV2>(record.payload);
  const payloadRecord = payload as Record<string, unknown>;
  if (
    payloadRecord.revision !== record.acceptedRevision ||
    payloadRecord.acceptedTimeSec !== record.acceptedTimeSec
  ) {
    throw new Error("Standard checkpoint wrapper and payload clocks differ");
  }
  return Object.freeze({
    acceptedRevision: record.acceptedRevision as number,
    acceptedTimeSec: record.acceptedTimeSec as number,
    payload,
  });
}

function standardFrameFromValuesV1(
  input: Readonly<{
    runtimeSessionId: string;
    scenarioId: string;
    inputEpoch: number;
    acceptedRevision: number;
    acceptedTimeSec: number;
    values: Readonly<Record<string, MainWireIntegratedModelOutputValueV3>>;
  }>,
): StudioSimulationFrameV2 {
  const outputs = Object.fromEntries(
    Object.values(input.values)
      .filter(({ outputId }) => STANDARD_EXACT_OUTPUT_IDS_V1.has(outputId))
      .map((value) => [
        value.outputId,
        Object.freeze({
          outputId: value.outputId,
          value: value.value,
          availability: value.availability,
          quality: value.quality,
        }),
      ]),
  );
  return Object.freeze({
    modelId: MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_MODEL_ID_V1,
    runtimeSessionId: input.runtimeSessionId,
    scenarioId: input.scenarioId,
    inputEpoch: input.inputEpoch,
    acceptedRevision: input.acceptedRevision,
    acceptedTimeSec: input.acceptedTimeSec,
    outputs: Object.freeze(outputs),
  });
}

function validateSelectedOutputIdsV1(
  outputIds: readonly string[],
): readonly MainWireIntegratedModelOutputIdV3[] {
  const seen = new Set<string>();
  const validated = outputIds.map((outputId) => {
    if (!STANDARD_EXACT_OUTPUT_IDS_V1.has(outputId)) {
      throw new Error(
        `Standard presentation output ${outputId} is unavailable`,
      );
    }
    if (seen.has(outputId)) {
      throw new Error(`Standard presentation output ${outputId} is duplicated`);
    }
    seen.add(outputId);
    return outputId as MainWireIntegratedModelOutputIdV3;
  });
  return Object.freeze(validated);
}

function standardOutputStateCodeV1(
  output: MainWireIntegratedModelOutputValueV3,
): number {
  const availability = output.availability === "available" ? 0 : 3;
  const quality =
    output.quality === "authoritative-state"
      ? 0
      : output.quality === "accepted-derived"
        ? 1
        : 2;
  return availability + quality;
}

function assertStandardModelV1(model: ModelContractV2): void {
  if (
    model.modelId !== MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_MODEL_ID_V1 ||
    model.fixtureSchemaId !==
      MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_FIXTURE_SCHEMA_ID_V1 ||
    model.checkpointCodecId !==
      MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_CHECKPOINT_CODEC_ID_V1 ||
    model.snapshotGateId !== STUDIO_COMMON_SNAPSHOT_ADMISSION_ID_V1
  ) {
    throw new Error("Main Wire Standard exact model contract mismatch");
  }
}

function assertRuntimeContextV1(
  context: Readonly<{ scenarioId: string; modelId: string }>,
): void {
  if (context.modelId !== MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_MODEL_ID_V1) {
    throw new Error("Standard fixture runtime modelId mismatch");
  }
  requiredIdV1(context.scenarioId, "scenarioId");
}

function assertMainWireExecutionPlanUpdateScheduleV1(
  schedule: BoundExecutionPlanUpdateScheduleV1,
): BoundExecutionPlanUpdateGroupDispatchV1 {
  const [group] = schedule.groups;
  if (
    schedule.definitionId !==
      MAIN_WIRE_EXECUTION_PLAN_DESCRIPTOR_V1.definitionId ||
    schedule.policyId !== MAIN_WIRE_EXECUTION_PLAN_DESCRIPTOR_V1.policyId ||
    schedule.baseTickSec !== MAIN_WIRE_NUMERICAL_BASE_TICK_SEC_V1 ||
    schedule.presentationPeriodTicks !==
      MAIN_WIRE_NUMERICAL_PRESENTATION_PERIOD_TICKS_V1 ||
    schedule.presentationStepSec !==
      MAIN_WIRE_EXECUTION_PLAN_PRESENTATION_DT_SEC_V1 ||
    schedule.groups.length !== 1 ||
    group === undefined ||
    group.updateGroupId !== MAIN_WIRE_COUPLED_HEMODYNAMICS_UPDATE_GROUP_ID_V1 ||
    group.ordinal !== 0 ||
    group.periodTicks !== 1 ||
    group.phaseTicks !== 0 ||
    group.effectiveStepSec !== MAIN_WIRE_NUMERICAL_BASE_TICK_SEC_V1 ||
    group.integration !== "fixed-step-backward-euler" ||
    group.solveGroupId !== MAIN_WIRE_COUPLED_HEMODYNAMICS_SOLVE_GROUP_ID_V1 ||
    group.solveGroupIndex !== 0 ||
    group.systemKernelId !== MAIN_WIRE_FIVE_WALL_COUPLED_SYSTEM_KERNEL_V1_ID
  ) {
    throw new Error("Standard execution-plan update schedule drifted");
  }
  return group;
}

function requiredIdV1(value: string, label: string): void {
  if (!/^[A-Za-z0-9][A-Za-z0-9._:/@+-]{0,255}$/.test(value)) {
    throw new Error(`Standard ${label} is invalid`);
  }
}

function exactRecordV1(
  value: unknown,
  expectedKeys: readonly string[],
  label: string,
): Record<string, unknown> {
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    Object.getPrototypeOf(value) !== Object.prototype
  ) {
    throw new Error(`${label} must be a plain object`);
  }
  const record = value as Record<string, unknown>;
  const actual = Object.keys(record).sort();
  const expected = [...expectedKeys].sort();
  if (
    actual.length !== expected.length ||
    actual.some((key, index) => key !== expected[index])
  ) {
    throw new Error(`${label} keys must be exactly ${expected.join(", ")}`);
  }
  return record;
}

function exactLiteralRecordV1(
  value: unknown,
  key: string,
  literal: string,
  label: string,
): void {
  const record = exactRecordV1(value, [key], `Standard fixture ${label}`);
  if (record[key] !== literal) {
    throw new Error(`Standard fixture ${label}.${key} mismatch`);
  }
}

function advanceFailureMessageV1(
  advance: Exclude<
    MainWireFlatModelOwnedProjectionAdvanceV1,
    { status: "advanced" }
  >,
): string {
  return advance.status === "failed"
    ? `Standard presentation step failed: ${advance.reason}: ${advance.message}`
    : "Standard presentation step did not advance";
}
