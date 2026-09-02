import {
  MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRESSURE_VOLUME_RELATIONS_V3_ID,
  MAIN_WIRE_INTEGRATED_MODEL_GUYTON_STARLING_ORIENTATION_V3_ID,
  MAIN_WIRE_INTEGRATED_MODEL_RESPONSIVE_STARLING_HYPERVOLEMIC_PARTITION_V3,
  MAIN_WIRE_INTEGRATED_MODEL_RESPONSIVE_STARLING_HYPOVOLEMIC_PARTITION_V3,
} from "@/analysis/methods/mainWire/MainWireStructuralAnalysisContractV3";
import {
  buildMainWireIntegratedModelGuytonStarlingOrientationV3,
} from "@/analysis/methods/mainWire/MainWireGuytonStarlingOrientationV3";
import {
  runMainWireIntegratedModelFormalPressureVolumeProtocolV3,
  runMainWireIntegratedModelResponsiveStarlingProtocolV3,
  type MainWireIntegratedModelResponsiveStarlingPartitionV3,
} from "@/analysis/methods/mainWire/MainWirePressureVolumeProtocolsV3";
import { MAIN_WIRE_INTEGRATED_MODEL_BEAT_METRICS_V3_ID } from "@/engine/myocardium/MainWireIntegratedModelBeatMetricsV3";
import type {
  MainWireIntegratedModelObservationV3,
} from "@/engine/myocardium/MainWireIntegratedModelSessionV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
  MAIN_WIRE_INTEGRATED_MODEL_HEMODYNAMIC_RESEARCH_RANGES_V3,
  validateAndOwnMainWireIntegratedModelHemodynamicResearchInputsV3,
  type MainWireIntegratedModelHemodynamicResearchInputsV3,
} from "@/engine/myocardium/MainWireIntegratedModelHemodynamicResearchInputsV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_MECHANISM_RESEARCH_INPUTS_V3,
  validateAndOwnMainWireIntegratedModelMechanismResearchInputsV3,
  type MainWireIntegratedModelMechanismResearchInputsV3,
} from "@/engine/myocardium/MainWireIntegratedModelMechanismResearchInputsV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_CHECKPOINT_V1_ID,
} from "@/engine/myocardium/MainWireIntegratedModelStandard66CheckpointV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD67_CHECKPOINT_V1_ID,
} from "@/engine/myocardium/MainWireIntegratedModelStandard67CheckpointV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD68_CHECKPOINT_V1_ID,
  type MainWireIntegratedModelStandard68CheckpointV1,
} from "@/engine/myocardium/MainWireIntegratedModelStandard68CheckpointV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD_66_OUTPUT_CATALOG_V1,
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD_66_OUTPUT_IDS_V1,
  type MainWireIntegratedModelStandard66OutputIdV1,
  type MainWireIntegratedModelStandard66OutputValueV1,
} from "@/engine/myocardium/MainWireIntegratedModelStandard66OutputRegistryV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD68_OUTPUT_CATALOG_V1,
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD68_OUTPUT_IDS_V1,
  type MainWireIntegratedModelStandard68OutputIdV1,
  type MainWireIntegratedModelStandard68OutputValueV1,
} from "@/engine/myocardium/MainWireIntegratedModelStandard68OutputRegistryV1";
import { MAIN_WIRE_INTEGRATED_MODEL_TRANSACTION_V3_ID } from "@/engine/myocardium/MainWireIntegratedModelTransactionV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_ALGEBRAIC_PROXIMAL_ROOTS_FIXTURE_V1_CLAIM,
  MAIN_WIRE_INTEGRATED_MODEL_ALGEBRAIC_PROXIMAL_ROOTS_FIXTURE_V1_ID,
  MAIN_WIRE_INTEGRATED_MODEL_SELECTED_AORTIC_OUTFLOW_FIXTURE_V1_CLAIM,
  MAIN_WIRE_INTEGRATED_MODEL_SELECTED_AORTIC_OUTFLOW_FIXTURE_V1_ID,
  createMainWireIntegratedModelAlgebraicProximalRootsFixtureV1,
  createMainWireIntegratedModelSelectedAorticOutflowFixtureV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_FIXTURE_V1_CLAIM,
  MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_FIXTURE_V1_ID,
  createMainWireIntegratedModelRoundedEjectionFixtureV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelRoundedEjectionFixtureV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_BASELINE_HEMODYNAMIC_INPUTS_V1,
  MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_BASELINE_MECHANISM_INPUTS_V1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelRoundedEjectionBaselineV1";
import {
  MAIN_WIRE_COUPLED_HEMODYNAMICS_SOLVE_GROUP_ID_V1,
  MAIN_WIRE_COUPLED_HEMODYNAMICS_UPDATE_GROUP_ID_V1,
  MAIN_WIRE_NUMERICAL_BASE_TICK_SEC_V1,
  MAIN_WIRE_NUMERICAL_PRESENTATION_PERIOD_TICKS_V1,
} from "@/engine/executionPlan/MainWireNumericalClockV1";
import {
  bindMainWireFiveWallCoupledExecutionPlanRuntimeV1,
  MAIN_WIRE_FIVE_WALL_COUPLED_SYSTEM_KERNEL_V1_ID,
} from "@/engine/vnext/coupled/MainWireFiveWallCoupledNewtonShadowV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_TYPED_AUTHORITY_SESSION_V1_ID,
  MainWireIntegratedModelStandard66TypedAuthoritySessionV1,
} from "@/engine/vnext/MainWireIntegratedModelStandard66TypedAuthoritySessionV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD67_TYPED_AUTHORITY_SESSION_V1_ID,
  MainWireIntegratedModelStandard67TypedAuthoritySessionV1,
} from "@/engine/vnext/MainWireIntegratedModelStandard67TypedAuthoritySessionV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD68_TYPED_AUTHORITY_SESSION_V1_ID,
  MainWireIntegratedModelStandard68TypedAuthoritySessionV1,
} from "@/engine/vnext/MainWireIntegratedModelStandard68TypedAuthoritySessionV1";
import type {
  MainWireFlatModelOwnedProjectionAdvanceV1,
  MainWireTypedExecutionPlanInitializationV1,
} from "@/engine/vnext/MainWireIntegratedTypedAuthoritySessionV1";
import {
  EXECUTION_PLAN_NEWTON_WORKSPACE_V1_CAPABILITY,
  EXECUTION_PLAN_TYPED_AUTHORITY_BINDING_V1_CAPABILITY,
  assertBoundExecutionPlanV1,
  bindExecutionPlanSolveSystemRuntimeV1,
  bindExecutionPlanV1,
  executionPlanBaseTickAtTimeV1,
  executionPlanPresentationBaseTickV1,
  executionPlanTimeAtBaseTickV1,
  executionPlanUpdateGroupIsDueAtBaseTickV1,
  prepareBoundExecutionPlanSolveGroupV1,
  resolveBoundExecutionPlanUpdateScheduleV1,
  validateAndOwnExecutionPlanDescriptorV1,
  validateAndOwnExecutionPlanKernelCatalogV1,
  type BoundExecutionPlanUpdateGroupDispatchV1,
  type BoundExecutionPlanUpdateScheduleV1,
  type BoundExecutionPlanV1,
} from "@/runtime/executionPlan/BoundExecutionPlanV1";
import type {
  ExperimentCaptureResultV2,
  ExperimentDesiredContentV2,
  ExperimentCaptureCorrelationV2,
  ExperimentSnapshotAdmissionResultV2,
} from "@/studio/contracts/v2/authoring";
import type {
  ExperimentContentV2,
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
import {
  STUDIO_EXACT_PRESENTATION_BATCH_CAPABILITY_V1,
  validateAndOwnStudioSimulationPortableJsonV2,
  type RegisteredModelPresentationBatchV2,
  type StudioSimulationAnalysisV2,
  type StudioSimulationFrameV2,
} from "@/studio/contracts/v2/simulation";
import {
  cloneAndFreezeStudioJson,
  studioCanonicalJsonStringify,
} from "@/domain/json/CanonicalJson";
import {
  MAIN_WIRE_INTEGRATED_STUDIO_MODEL_FAMILY_ID_V3,
  MAIN_WIRE_INTEGRATED_STUDIO_ALGEBRAIC_PROXIMAL_ROOTS_MODEL_ID_V1,
  MAIN_WIRE_INTEGRATED_STUDIO_ROUNDED_EJECTION_MODEL_ID_V1,
  MAIN_WIRE_INTEGRATED_STUDIO_SELECTED_AORTIC_OUTFLOW_FIXTURE_SCHEMA_ID_V1,
  MAIN_WIRE_INTEGRATED_STUDIO_SELECTED_AORTIC_OUTFLOW_MODEL_ID_V1,
} from "./MainWireIntegratedStudioModelIdentityV1";
import {
  MAIN_WIRE_INTEGRATED_STUDIO_ROUNDED_EJECTION_CONTROL_CATALOG_V1,
  applyMainWireIntegratedStudioRoundedEjectionControlV1,
  reduceMainWireIntegratedStudioRoundedEjectionControlV1,
} from "./MainWireIntegratedStudioRoundedEjectionControlsV1";
import generatedExecutionPlanV1 from "./MainWireIntegratedExecutionPlanV1.generated.json";

export {
  MAIN_WIRE_INTEGRATED_STUDIO_SELECTED_AORTIC_OUTFLOW_FIXTURE_SCHEMA_ID_V1,
} from "./MainWireIntegratedStudioModelIdentityV1";

export const MAIN_WIRE_INTEGRATED_STUDIO_SELECTED_AORTIC_OUTFLOW_CHECKPOINT_CODEC_ID_V1 =
  "circleheart.main-wire-integrated-v3-selected-aortic-outflow-checkpoint-codec.standard-v1" as const;

export const MAIN_WIRE_INTEGRATED_STUDIO_ALGEBRAIC_PROXIMAL_ROOTS_CHECKPOINT_CODEC_ID_V1 =
  "circleheart.main-wire-integrated-v3-algebraic-proximal-roots-checkpoint-codec.standard-v1" as const;

export const MAIN_WIRE_INTEGRATED_STUDIO_ROUNDED_EJECTION_CHECKPOINT_CODEC_ID_V1 =
  "circleheart.main-wire-integrated-v3-rounded-ejection-checkpoint-codec.standard-v1" as const;

export const MAIN_WIRE_INTEGRATED_STUDIO_SELECTED_AORTIC_OUTFLOW_HOT_PATH_INTEGRITY_TIER_V1 =
  "hot-path-lean" as const;

export const MAIN_WIRE_INTEGRATED_STUDIO_ALGEBRAIC_PROXIMAL_ROOTS_HOT_PATH_INTEGRITY_TIER_V1 =
  MAIN_WIRE_INTEGRATED_STUDIO_SELECTED_AORTIC_OUTFLOW_HOT_PATH_INTEGRITY_TIER_V1;

export const MAIN_WIRE_INTEGRATED_STUDIO_SELECTED_AORTIC_OUTFLOW_CONTROL_IDS_V1 =
  Object.freeze({
    heartRateBpm: "rhythm.heart-rate-bpm" as const,
  });

export type MainWireIntegratedStudioSelectedAorticOutflowFixtureV1 =
  Readonly<{
    schemaId:
      typeof MAIN_WIRE_INTEGRATED_STUDIO_SELECTED_AORTIC_OUTFLOW_FIXTURE_SCHEMA_ID_V1;
    rhythm: Readonly<{ mode: "regular-sinus-v3" }>;
    coronary: Readonly<{ topologyProfile: "coronary-network-v2" }>;
    dynamicMechanicalSupport: Readonly<{
      mode: "all-off-zero-inertance-v3";
    }>;
    hemodynamicResearchInputs:
      MainWireIntegratedModelHemodynamicResearchInputsV3;
    mechanismResearchInputs: MainWireIntegratedModelMechanismResearchInputsV3;
  }>;

export type MainWireIntegratedStudioSelectedAorticOutflowExactReleaseV1 =
  Readonly<{
    manifest: ExactModelKernelManifestV3;
    executables: RegisteredModelExecutableBundleV2;
  }>;

export const MAIN_WIRE_INTEGRATED_STUDIO_SELECTED_AORTIC_OUTFLOW_DEFAULT_FIXTURE_V1 =
  Object.freeze({
    schemaId:
      MAIN_WIRE_INTEGRATED_STUDIO_SELECTED_AORTIC_OUTFLOW_FIXTURE_SCHEMA_ID_V1,
    rhythm: Object.freeze({ mode: "regular-sinus-v3" as const }),
    coronary: Object.freeze({ topologyProfile: "coronary-network-v2" as const }),
    dynamicMechanicalSupport: Object.freeze({
      mode: "all-off-zero-inertance-v3" as const,
    }),
    hemodynamicResearchInputs:
      MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
    mechanismResearchInputs:
      MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_MECHANISM_RESEARCH_INPUTS_V3,
  });

export const MAIN_WIRE_INTEGRATED_STUDIO_ROUNDED_EJECTION_DEFAULT_FIXTURE_V1 =
  Object.freeze({
    ...MAIN_WIRE_INTEGRATED_STUDIO_SELECTED_AORTIC_OUTFLOW_DEFAULT_FIXTURE_V1,
    hemodynamicResearchInputs:
      MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_BASELINE_HEMODYNAMIC_INPUTS_V1,
    mechanismResearchInputs:
      MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_BASELINE_MECHANISM_INPUTS_V1,
  });

const SELECTED_STANDARD66_EXACT_VARIANT_V1 = Object.freeze({
  generation: 66 as const,
  label: "Standard66" as const,
  modelId:
    MAIN_WIRE_INTEGRATED_STUDIO_SELECTED_AORTIC_OUTFLOW_MODEL_ID_V1,
  fixtureId:
    MAIN_WIRE_INTEGRATED_MODEL_SELECTED_AORTIC_OUTFLOW_FIXTURE_V1_ID,
  fixtureClaim:
    MAIN_WIRE_INTEGRATED_MODEL_SELECTED_AORTIC_OUTFLOW_FIXTURE_V1_CLAIM,
  numericalSessionId:
    MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_TYPED_AUTHORITY_SESSION_V1_ID,
  checkpointId: MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_CHECKPOINT_V1_ID,
  checkpointCodecId:
    MAIN_WIRE_INTEGRATED_STUDIO_SELECTED_AORTIC_OUTFLOW_CHECKPOINT_CODEC_ID_V1,
  runtimeScope:
    "selected-aortic-outflow-recovered-root-land-et-matched-alpha-regular-sinus-all-off" as const,
  checkpointFixturePairing:
    "selected-aortic-outflow-complete-fixture-and-profile-identity" as const,
  proximalArterialRootsProfileId: null,
});

const SELECTED_STANDARD67_EXACT_VARIANT_V1 = Object.freeze({
  generation: 67 as const,
  label: "Standard67" as const,
  modelId:
    MAIN_WIRE_INTEGRATED_STUDIO_ALGEBRAIC_PROXIMAL_ROOTS_MODEL_ID_V1,
  fixtureId:
    MAIN_WIRE_INTEGRATED_MODEL_ALGEBRAIC_PROXIMAL_ROOTS_FIXTURE_V1_ID,
  fixtureClaim:
    MAIN_WIRE_INTEGRATED_MODEL_ALGEBRAIC_PROXIMAL_ROOTS_FIXTURE_V1_CLAIM,
  numericalSessionId:
    MAIN_WIRE_INTEGRATED_MODEL_STANDARD67_TYPED_AUTHORITY_SESSION_V1_ID,
  checkpointId: MAIN_WIRE_INTEGRATED_MODEL_STANDARD67_CHECKPOINT_V1_ID,
  checkpointCodecId:
    MAIN_WIRE_INTEGRATED_STUDIO_ALGEBRAIC_PROXIMAL_ROOTS_CHECKPOINT_CODEC_ID_V1,
  runtimeScope:
    "algebraic-proximal-arterial-roots-recovered-aortic-root-land-et-matched-alpha-regular-sinus-all-off" as const,
  checkpointFixturePairing:
    "algebraic-proximal-roots-complete-fixture-and-profile-identity" as const,
  proximalArterialRootsProfileId:
    MAIN_WIRE_INTEGRATED_MODEL_ALGEBRAIC_PROXIMAL_ROOTS_FIXTURE_V1_CLAIM
      .proximalArterialRootsProfileId,
});

const ROUNDED_EJECTION_STANDARD68_EXACT_VARIANT_V1 = Object.freeze({
  generation: 68 as const,
  label: "Standard68" as const,
  modelId: MAIN_WIRE_INTEGRATED_STUDIO_ROUNDED_EJECTION_MODEL_ID_V1,
  fixtureId: MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_FIXTURE_V1_ID,
  fixtureClaim: MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_FIXTURE_V1_CLAIM,
  numericalSessionId:
    MAIN_WIRE_INTEGRATED_MODEL_STANDARD68_TYPED_AUTHORITY_SESSION_V1_ID,
  checkpointId: MAIN_WIRE_INTEGRATED_MODEL_STANDARD68_CHECKPOINT_V1_ID,
  checkpointCodecId:
    MAIN_WIRE_INTEGRATED_STUDIO_ROUNDED_EJECTION_CHECKPOINT_CODEC_ID_V1,
  runtimeScope:
    "rounded-ejection-matched-alpha-source-aortic-topology-regular-sinus-all-off" as const,
  checkpointFixturePairing:
    "rounded-ejection-complete-fixture-and-profile-identity" as const,
  proximalArterialRootsProfileId: null,
});

type SelectedExactModelVariantV1 =
  | typeof SELECTED_STANDARD66_EXACT_VARIANT_V1
  | typeof SELECTED_STANDARD67_EXACT_VARIANT_V1
  | typeof ROUNDED_EJECTION_STANDARD68_EXACT_VARIANT_V1;

type SelectedNumericalSessionV1 =
  | MainWireIntegratedModelStandard66TypedAuthoritySessionV1
  | MainWireIntegratedModelStandard67TypedAuthoritySessionV1
  | MainWireIntegratedModelStandard68TypedAuthoritySessionV1;

type SelectedOutputIdV1 =
  | MainWireIntegratedModelStandard66OutputIdV1
  | MainWireIntegratedModelStandard68OutputIdV1;

type SelectedOutputValueV1 =
  | MainWireIntegratedModelStandard66OutputValueV1
  | MainWireIntegratedModelStandard68OutputValueV1;

const SELECTED_EXECUTION_PLAN_DESCRIPTOR_V1 =
  validateAndOwnExecutionPlanDescriptorV1(generatedExecutionPlanV1);
const SELECTED_PRESENTATION_DT_SEC_V1 =
  SELECTED_EXECUTION_PLAN_DESCRIPTOR_V1.updateSchedule.presentationStepSec;
// A failed direct TBV rebase falls back to a deterministic adaptive volume
// homotopy. Broad well-conditioned intervals stay fast; only a rejected
// interval is bisected down to the public 50-mL control resolution.
const STANDARD68_TBV_CONTINUATION_INITIAL_STEP_ML_V1 = 1_000;
const STANDARD68_TBV_CONTINUATION_MIN_STEP_ML_V1 = 50;
const STANDARD68_TBV_CONTINUATION_MAX_ATTEMPTS_V1 = 64;
const SELECTED_SOLVE_SYSTEM_BINDINGS_V1 = Object.freeze([
  Object.freeze({
    systemKernelId: MAIN_WIRE_FIVE_WALL_COUPLED_SYSTEM_KERNEL_V1_ID,
    bind: bindMainWireFiveWallCoupledExecutionPlanRuntimeV1,
  }),
]);
const SELECTED_EXECUTION_PLAN_KERNEL_BINDINGS_V1 =
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
      solveSystemKernelIds: Object.freeze([
        MAIN_WIRE_FIVE_WALL_COUPLED_SYSTEM_KERNEL_V1_ID,
      ]),
    }),
  );

export function bindMainWireIntegratedStudioSelectedAorticOutflowExecutionPlanV1():
  BoundExecutionPlanV1 {
  return bindExecutionPlanV1(
    SELECTED_EXECUTION_PLAN_DESCRIPTOR_V1,
    SELECTED_EXECUTION_PLAN_KERNEL_BINDINGS_V1,
  );
}

const SELECTED_CONTROL_CATALOG_V1 = Object.freeze([
  Object.freeze({
    controlId:
      MAIN_WIRE_INTEGRATED_STUDIO_SELECTED_AORTIC_OUTFLOW_CONTROL_IDS_V1
        .heartRateBpm,
    valueType: "number" as const,
    unit: "bpm",
    minimum:
      MAIN_WIRE_INTEGRATED_MODEL_HEMODYNAMIC_RESEARCH_RANGES_V3.heartRateBpm
        .minimum,
    maximum:
      MAIN_WIRE_INTEGRATED_MODEL_HEMODYNAMIC_RESEARCH_RANGES_V3.heartRateBpm
        .maximum,
    step:
      MAIN_WIRE_INTEGRATED_MODEL_HEMODYNAMIC_RESEARCH_RANGES_V3.heartRateBpm
        .step,
    defaultValue:
      MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3
        .heartRateBpm,
    changeSemantics: "cold-restart" as const,
  }),
] satisfies readonly ControlDefinitionV2[]);

function selectedControlCatalogV1(
  variant: SelectedExactModelVariantV1,
): readonly ControlDefinitionV2[] {
  return variant.generation === 68
    ? MAIN_WIRE_INTEGRATED_STUDIO_ROUNDED_EJECTION_CONTROL_CATALOG_V1
    : SELECTED_CONTROL_CATALOG_V1;
}

function selectedOutputCatalogV1(variant: SelectedExactModelVariantV1) {
  return variant.generation === 68
    ? MAIN_WIRE_INTEGRATED_MODEL_STANDARD68_OUTPUT_CATALOG_V1
    : MAIN_WIRE_INTEGRATED_MODEL_STANDARD_66_OUTPUT_CATALOG_V1;
}

function selectedOutputIdsV1(
  variant: SelectedExactModelVariantV1,
): readonly SelectedOutputIdV1[] {
  return variant.generation === 68
    ? MAIN_WIRE_INTEGRATED_MODEL_STANDARD68_OUTPUT_IDS_V1
    : MAIN_WIRE_INTEGRATED_MODEL_STANDARD_66_OUTPUT_IDS_V1;
}

function selectedSignalDefinitionsV1(variant: SelectedExactModelVariantV1) {
  return Object.freeze(
    selectedOutputCatalogV1(variant)
    .filter((definition) => definition.kind === "signal")
    .map((definition): SignalOutputDefinitionV2 => Object.freeze({
      outputId: definition.outputId,
      kind: "signal",
      unit: definition.unit,
      significantDigits: definition.significantDigits,
      shape: "scalar",
      sampling: "accepted-step",
    })),
  );
}

function selectedMetricDefinitionsV1(variant: SelectedExactModelVariantV1) {
  return Object.freeze(
    selectedOutputCatalogV1(variant)
    .filter((definition) => definition.kind === "metric")
    .map((definition): MetricOutputDefinitionV2 => Object.freeze({
      outputId: definition.outputId,
      kind: "metric",
      unit: definition.unit,
      significantDigits: definition.significantDigits,
      shape: "scalar",
      scope: "scope" in definition ? definition.scope : "beat",
      dependencies: Object.freeze([
        ...("dependencies" in definition ? definition.dependencies : []),
      ]),
    })),
  );
}

type SelectedRuntimeScenarioV1 = {
  fixture: MainWireIntegratedStudioSelectedAorticOutflowFixtureV1;
  inputEpoch: number;
  modelSession: SelectedNumericalSessionV1;
  presentationOrdinal: number;
  executionPlanBinding: Readonly<{
    boundExecutionPlan: BoundExecutionPlanV1;
    modelSession: SelectedNumericalSessionV1;
    updateSchedule: BoundExecutionPlanUpdateScheduleV1;
    presentationOriginBaseTick: number;
  }>;
};

type SelectedRuntimeSessionV1 = {
  scenarios: Map<string, SelectedRuntimeScenarioV1>;
};

async function createSelectedNumericalSessionV1(
  variant: SelectedExactModelVariantV1,
  inputs: MainWireIntegratedModelHemodynamicResearchInputsV3,
  ventricularContractilityScale: number,
  executionPlanInitialization: MainWireTypedExecutionPlanInitializationV1,
  mechanismResearchInputs: MainWireIntegratedModelMechanismResearchInputsV3,
): Promise<SelectedNumericalSessionV1> {
  return variant.generation === 68
    ? MainWireIntegratedModelStandard68TypedAuthoritySessionV1.create(
        inputs,
        ventricularContractilityScale,
        executionPlanInitialization,
        mechanismResearchInputs,
      )
    : variant.generation === 67
      ? MainWireIntegratedModelStandard67TypedAuthoritySessionV1.create(
        inputs,
        ventricularContractilityScale,
        executionPlanInitialization,
        mechanismResearchInputs,
      )
      : MainWireIntegratedModelStandard66TypedAuthoritySessionV1.create(
        inputs,
        ventricularContractilityScale,
        executionPlanInitialization,
        mechanismResearchInputs,
      );
}

async function restoreSelectedNumericalSessionV1(
  variant: SelectedExactModelVariantV1,
  checkpoint: unknown,
  inputs: MainWireIntegratedModelHemodynamicResearchInputsV3,
  ventricularContractilityScale: number,
  executionPlanInitialization:
    MainWireTypedExecutionPlanInitializationV1 | undefined,
  mechanismResearchInputs: MainWireIntegratedModelMechanismResearchInputsV3,
): Promise<SelectedNumericalSessionV1> {
  return variant.generation === 68
    ? MainWireIntegratedModelStandard68TypedAuthoritySessionV1
        .restoreStandard68ExactCheckpoint(
          checkpoint,
          inputs,
          ventricularContractilityScale,
          executionPlanInitialization,
          mechanismResearchInputs,
        )
    : variant.generation === 67
      ? MainWireIntegratedModelStandard67TypedAuthoritySessionV1
        .restoreStandard67ExactCheckpoint(
          checkpoint,
          inputs,
          ventricularContractilityScale,
          executionPlanInitialization,
          mechanismResearchInputs,
        )
      : MainWireIntegratedModelStandard66TypedAuthoritySessionV1
        .restoreStandard66ExactCheckpoint(
          checkpoint,
          inputs,
          ventricularContractilityScale,
          executionPlanInitialization,
          mechanismResearchInputs,
        );
}

function projectCurrentSelectedValuesV1(
  session: SelectedNumericalSessionV1,
  outputIds: readonly SelectedOutputIdV1[],
): Readonly<Record<string, SelectedOutputValueV1>> {
  return session instanceof MainWireIntegratedModelStandard68TypedAuthoritySessionV1
    ? session.projectCurrentAcceptedStandard68ValuesV1(
        outputIds as readonly MainWireIntegratedModelStandard68OutputIdV1[],
      )
    : session instanceof
      MainWireIntegratedModelStandard67TypedAuthoritySessionV1
      ? session.projectCurrentAcceptedStandard67ValuesV1(
          outputIds as readonly MainWireIntegratedModelStandard66OutputIdV1[],
        )
      : session.projectCurrentAcceptedStandard66ValuesV1(
          outputIds as readonly MainWireIntegratedModelStandard66OutputIdV1[],
        );
}

function advanceSelectedNumericalProjectionV1(
  session: SelectedNumericalSessionV1,
  targetTimeSec: number,
  outputIds: readonly SelectedOutputIdV1[],
) {
  return session instanceof MainWireIntegratedModelStandard68TypedAuthoritySessionV1
    ? session.advanceToPresentationTimeWithStandard68SelectedOutputProjectionV1(
        targetTimeSec,
        outputIds as readonly MainWireIntegratedModelStandard68OutputIdV1[],
      )
    : session instanceof
      MainWireIntegratedModelStandard67TypedAuthoritySessionV1
    ? session
        .advanceToPresentationTimeWithStandard67SelectedOutputProjectionV1(
          targetTimeSec,
          outputIds as readonly MainWireIntegratedModelStandard66OutputIdV1[],
        )
    : session
        .advanceToPresentationTimeWithStandard66SelectedOutputProjectionV1(
          targetTimeSec,
          outputIds as readonly MainWireIntegratedModelStandard66OutputIdV1[],
        );
}

function checkpointSelectedNumericalSessionV1(
  session: SelectedNumericalSessionV1,
) {
  return session instanceof MainWireIntegratedModelStandard68TypedAuthoritySessionV1
    ? session.checkpointStandard68Exact()
    : session instanceof
      MainWireIntegratedModelStandard67TypedAuthoritySessionV1
    ? session.checkpointStandard67Exact()
    : session.checkpointStandard66Exact();
}

function checkpointSelectedAnalysisSessionV1(
  session: SelectedNumericalSessionV1,
): Promise<Uint8Array | MainWireIntegratedModelStandard68CheckpointV1> {
  return session instanceof MainWireIntegratedModelStandard68TypedAuthoritySessionV1
    ? session.checkpointStandard68Exact()
    : session instanceof
      MainWireIntegratedModelStandard67TypedAuthoritySessionV1
    ? session.checkpointStandard67CanonicalBinaryV3()
    : session.checkpointStandard66CanonicalBinaryV3();
}

function restoreSelectedAnalysisSessionV1(
  variant: SelectedExactModelVariantV1,
  checkpoint: Uint8Array | MainWireIntegratedModelStandard68CheckpointV1,
  inputs: MainWireIntegratedModelHemodynamicResearchInputsV3,
  ventricularContractilityScale: number,
  mechanismResearchInputs: MainWireIntegratedModelMechanismResearchInputsV3,
  executionPlanInitialization: MainWireTypedExecutionPlanInitializationV1,
): Promise<SelectedNumericalSessionV1> {
  return variant.generation === 68
    ? MainWireIntegratedModelStandard68TypedAuthoritySessionV1
        .restoreStandard68ExactCheckpoint(
          checkpoint,
          inputs,
          ventricularContractilityScale,
          executionPlanInitialization,
          mechanismResearchInputs,
        )
    : variant.generation === 67
      ? MainWireIntegratedModelStandard67TypedAuthoritySessionV1
        .restoreStandard67CanonicalBinaryV3(
          checkpoint as Uint8Array,
          inputs,
          ventricularContractilityScale,
          mechanismResearchInputs,
          executionPlanInitialization,
        )
      : MainWireIntegratedModelStandard66TypedAuthoritySessionV1
        .restoreStandard66CanonicalBinaryV3(
          checkpoint as Uint8Array,
          inputs,
          ventricularContractilityScale,
          mechanismResearchInputs,
          executionPlanInitialization,
        );
}

function createSelectedNumericalFixtureV1(
  variant: SelectedExactModelVariantV1,
  inputs: MainWireIntegratedModelHemodynamicResearchInputsV3,
  mechanismResearchInputs: MainWireIntegratedModelMechanismResearchInputsV3,
) {
  return variant.generation === 68
    ? createMainWireIntegratedModelRoundedEjectionFixtureV1(
        inputs,
        1,
        mechanismResearchInputs,
      )
    : variant.generation === 67
      ? createMainWireIntegratedModelAlgebraicProximalRootsFixtureV1(
        inputs,
        1,
        mechanismResearchInputs,
      )
      : createMainWireIntegratedModelSelectedAorticOutflowFixtureV1(
        inputs,
        1,
        mechanismResearchInputs,
      );
}

/** Worker-local owner shared by the fixed Standard66/67 exact assemblies. */
export class MainWireIntegratedStudioSelectedAorticOutflowRuntimeHostV1 {
  readonly #variant: SelectedExactModelVariantV1;
  readonly #defaultBaselineCheckpoint:
    MainWireIntegratedModelStandard68CheckpointV1 | undefined;
  readonly #sessions = new Map<string, SelectedRuntimeSessionV1>();
  readonly #retiredSessionIds = new Set<string>();
  readonly #executionPlanScenarioOwners = new WeakMap<
    object,
    Readonly<{ runtimeSessionId: string; scenarioId: string }>
  >();

  constructor(
    variant: SelectedExactModelVariantV1 =
      SELECTED_STANDARD66_EXACT_VARIANT_V1,
    defaultBaselineCheckpoint?: MainWireIntegratedModelStandard68CheckpointV1,
  ) {
    this.#variant = variant;
    if (defaultBaselineCheckpoint !== undefined && variant.generation !== 68) {
      throw new Error(
        "A settled Standard68 baseline cannot be installed in an older exact variant",
      );
    }
    this.#defaultBaselineCheckpoint = defaultBaselineCheckpoint;
  }

  async createSession(
    runtimeSessionId: string,
    scenarioInputs: readonly Readonly<{
      scenarioId: string;
      fixture: StudioJsonValueV2;
      checkpoint?: ScenarioCheckpointV2;
    }>[],
    suppliedExecutionPlans?: ReadonlyMap<string, BoundExecutionPlanV1>,
  ): Promise<void> {
    requiredSelectedIdV1(runtimeSessionId, "runtimeSessionId");
    if (
      this.#sessions.has(runtimeSessionId)
      || this.#retiredSessionIds.has(runtimeSessionId)
    ) {
      throw new Error(
        `Selected Standard66 runtime session ID is active or retired: ${runtimeSessionId}`,
      );
    }
    if (scenarioInputs.length === 0) {
      throw new Error(
        "Selected Standard66 runtime session requires at least one Scenario",
      );
    }
    if (
      suppliedExecutionPlans !== undefined
      && suppliedExecutionPlans.size !== scenarioInputs.length
    ) {
      throw new Error(
        "Selected Standard66 runtime execution-plan Scenario set is incomplete",
      );
    }

    const scenarios = new Map<string, SelectedRuntimeScenarioV1>();
    for (const input of scenarioInputs) {
      requiredSelectedIdV1(input.scenarioId, "scenarioId");
      if (scenarios.has(input.scenarioId)) {
        throw new Error(
          `duplicate selected Standard66 runtime Scenario: ${input.scenarioId}`,
        );
      }
      const fixture = validateAndOwnSelectedFixtureV1(input.fixture, this.#variant);
      const checkpoint = input.checkpoint === undefined
        ? undefined
        : validateSelectedScenarioCheckpointV1(input.checkpoint);
      const defaultBaselineCheckpoint =
        checkpoint === undefined
        && this.#variant.generation === 68
        && this.#defaultBaselineCheckpoint !== undefined
        && studioCanonicalJsonStringify(fixture)
          === studioCanonicalJsonStringify(
            MAIN_WIRE_INTEGRATED_STUDIO_ROUNDED_EJECTION_DEFAULT_FIXTURE_V1,
          )
          ? this.#defaultBaselineCheckpoint
          : undefined;
      const boundExecutionPlan = suppliedExecutionPlans?.get(input.scenarioId)
        ?? bindMainWireIntegratedStudioSelectedAorticOutflowExecutionPlanV1();
      if (
        suppliedExecutionPlans !== undefined
        && !suppliedExecutionPlans.has(input.scenarioId)
      ) {
        throw new Error(
          `Selected Standard66 execution plan is unavailable for Scenario ${input.scenarioId}`,
        );
      }
      const preparedExecutionPlan = this.#prepareExecutionPlan(
        runtimeSessionId,
        input.scenarioId,
        boundExecutionPlan,
      );
      const modelSession = checkpoint === undefined
        && defaultBaselineCheckpoint === undefined
        ? await createSelectedNumericalSessionV1(
            this.#variant,
            fixture.hemodynamicResearchInputs,
            1,
            preparedExecutionPlan.initialization,
            fixture.mechanismResearchInputs,
          )
        : await restoreSelectedNumericalSessionV1(
              this.#variant,
              checkpoint?.payload ?? defaultBaselineCheckpoint,
              fixture.hemodynamicResearchInputs,
              1,
              preparedExecutionPlan.initialization,
              fixture.mechanismResearchInputs,
            );
      const accepted = modelSession.currentAcceptedState();
      const expectedCheckpointClock = checkpoint === undefined
        ? defaultBaselineCheckpoint === undefined
          ? undefined
          : Object.freeze({
              acceptedRevision: defaultBaselineCheckpoint.revision,
              acceptedTimeSec: defaultBaselineCheckpoint.acceptedTimeSec,
            })
        : checkpoint;
      if (
        expectedCheckpointClock !== undefined
        && (
          accepted.revision !== expectedCheckpointClock.acceptedRevision
          || accepted.acceptedTimeSec !== expectedCheckpointClock.acceptedTimeSec
        )
      ) {
        throw new Error(
          `Selected Standard66 Scenario ${input.scenarioId} checkpoint clock mismatch`,
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
            accepted.acceptedTimeSec,
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
    return selectedFrameFromValuesV1({
      modelId: this.#variant.modelId,
      runtimeSessionId,
      scenarioId,
      inputEpoch: scenario.inputEpoch,
      acceptedRevision: accepted.revision,
      acceptedTimeSec: accepted.acceptedTimeSec,
      values: projectCurrentSelectedValuesV1(
        scenario.modelSession,
        selectedOutputIdsV1(this.#variant),
      ),
    });
  }

  advanceOnePresentationStep(
    runtimeSessionId: string,
    scenarioId: string,
  ): StudioSimulationFrameV2 {
    const scenario = this.#requiredScenario(runtimeSessionId, scenarioId);
    const projection = this.#advanceScenarioProjection(
      scenario,
      selectedOutputIdsV1(this.#variant),
    );
    return selectedFrameFromValuesV1({
      modelId: this.#variant.modelId,
      runtimeSessionId,
      scenarioId,
      inputEpoch: scenario.inputEpoch,
      acceptedRevision: projection.advance.acceptedRevision,
      acceptedTimeSec: projection.advance.acceptedTimeSec,
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
      throw new Error(
        "Selected Standard66 presentation batch stepCount is invalid",
      );
    }
    const outputIds = validateSelectedOutputIdsV1(
      this.#variant,
      presentationOutputIds,
    );
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
        terminal
          ? selectedOutputIdsV1(this.#variant)
          : outputIds,
      );
      acceptedRevisions[index] = projection.advance.acceptedRevision;
      acceptedTimesSec[index] = projection.advance.acceptedTimeSec;
      for (let outputIndex = 0; outputIndex < outputIds.length; outputIndex += 1) {
        const outputId = outputIds[outputIndex]!;
        const value = projection.projectedValues[outputId];
        if (value === undefined) {
          throw new Error(
            `Selected Standard66 presentation output ${outputId} is unavailable`,
          );
        }
        const packedIndex = index * outputIds.length + outputIndex;
        outputStates[packedIndex] = selectedOutputStateCodeV1(value);
        outputValues[packedIndex] =
          portableSelectedOutputScalarV1(value.value) ?? Number.NaN;
      }
      if (terminal) {
        terminalFrame = selectedFrameFromValuesV1({
          modelId: this.#variant.modelId,
          runtimeSessionId,
          scenarioId,
          inputEpoch: scenario.inputEpoch,
          acceptedRevision: projection.advance.acceptedRevision,
          acceptedTimeSec: projection.advance.acceptedTimeSec,
          values: projection.projectedValues,
        });
      }
    }
    if (terminalFrame === null) {
      throw new Error(
        "Selected Standard66 presentation batch terminal frame is unavailable",
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
        `Selected Standard66 control input epoch is stale: expected ${expectedInputEpoch}, current ${scenario.inputEpoch}`,
      );
    }
    if (this.#variant.generation === 68) {
      const fixture = validateAndOwnSelectedFixtureV1(
        applyMainWireIntegratedStudioRoundedEjectionControlV1(
          scenario.fixture,
          controlId,
          value,
        ),
        this.#variant,
      );
      return this.#warmStartFixtureAtomically(
        runtimeSessionId,
        scenarioId,
        fixture,
        expectedInputEpoch,
      );
    }
    if (
      controlId
      !== MAIN_WIRE_INTEGRATED_STUDIO_SELECTED_AORTIC_OUTFLOW_CONTROL_IDS_V1
        .heartRateBpm
    ) {
      throw new Error(
        `Selected Standard66 control is not registered: ${controlId}`,
      );
    }
    const fixture = applySelectedHeartRateV1(
      scenario.fixture,
      value,
      this.#variant,
    );
    return this.#coldRestartFixtureAtomically(
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
    const fixture = validateAndOwnSelectedFixtureV1(
      fixtureValue,
      this.#variant,
    );
    if (this.#variant.generation === 68) {
      await this.#warmStartFixtureAtomically(
        runtimeSessionId,
        scenarioId,
        fixture,
        scenario.inputEpoch,
      );
    } else {
      await this.#coldRestartFixtureAtomically(
        runtimeSessionId,
        scenarioId,
        fixture,
        scenario.inputEpoch,
      );
    }
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
      scenario.inputEpoch !== expectedInputEpoch
      || accepted.revision !== expectedAcceptedRevision
      || accepted.acceptedTimeSec !== expectedAcceptedTimeSec
    ) {
      throw new Error("Selected Standard66 analysis source clocks are stale");
    }
    if (
      analysisId !==
        MAIN_WIRE_INTEGRATED_MODEL_GUYTON_STARLING_ORIENTATION_V3_ID
      && analysisId !==
        MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRESSURE_VOLUME_RELATIONS_V3_ID
    ) {
      throw new Error(
        `Selected ${this.#variant.label} exact model analysis is not registered: ${analysisId}`,
      );
    }
    const responsivePartition:
      MainWireIntegratedModelResponsiveStarlingPartitionV3 | undefined =
      analysisPartition === undefined
        ? undefined
        : analysisPartition ===
              MAIN_WIRE_INTEGRATED_MODEL_RESPONSIVE_STARLING_HYPOVOLEMIC_PARTITION_V3
            || analysisPartition ===
              MAIN_WIRE_INTEGRATED_MODEL_RESPONSIVE_STARLING_HYPERVOLEMIC_PARTITION_V3
          ? analysisPartition
          : (() => {
              throw new Error(
                `Selected ${this.#variant.label} analysis partition is not registered: ${analysisPartition}`,
              );
            })();
    let acceptedStepReadbackObservation:
      MainWireIntegratedModelObservationV3 | undefined =
      observation.lastAcceptedStep === null ? undefined : observation;
    const toAnalysis = (
      starling:
        | Awaited<ReturnType<
            typeof runMainWireIntegratedModelResponsiveStarlingProtocolV3
          >>
        | Awaited<ReturnType<
            typeof runMainWireIntegratedModelFormalPressureVolumeProtocolV3
          >>
        | null,
      sourceObservation?: MainWireIntegratedModelObservationV3,
    ): StudioSimulationAnalysisV2 => {
      const anchorObservation = starling?.anchorObservation;
      const analysisObservation =
        anchorObservation !== undefined &&
          anchorObservation.lastAcceptedStep !== null
          ? anchorObservation
          : sourceObservation ?? acceptedStepReadbackObservation ?? observation;
      const payload = validateAndOwnStudioSimulationPortableJsonV2(
        buildMainWireIntegratedModelGuytonStarlingOrientationV3(
          analysisObservation,
          scenario.fixture.hemodynamicResearchInputs,
          starling === null
            ? undefined
            : Object.freeze({
                right: starling.right,
                left: starling.left,
              }),
        ),
        `$.mainWireIntegrated${this.#variant.label}Analysis.payload`,
      );
      return Object.freeze({
        modelId: this.#variant.modelId,
        runtimeSessionId,
        scenarioId,
        inputEpoch: scenario.inputEpoch,
        sourceAcceptedRevision: accepted.revision,
        sourceAcceptedTimeSec: accepted.acceptedTimeSec,
        analysisId,
        payload,
      });
    };

    const exactCheckpoint =
      await checkpointSelectedAnalysisSessionV1(scenario.modelSession);
    const analysisExecutionPlan = this.#prepareExecutionPlan(
      runtimeSessionId,
      `${scenarioId}/analysis/${analysisId}/${analysisPartition ?? "complete"}`,
      bindMainWireIntegratedStudioSelectedAorticOutflowExecutionPlanV1(),
    );
    let analysisSource = await restoreSelectedAnalysisSessionV1(
      this.#variant,
      exactCheckpoint,
      scenario.fixture.hemodynamicResearchInputs,
      1,
      scenario.fixture.mechanismResearchInputs,
      analysisExecutionPlan.initialization,
    );
    if (observation.lastAcceptedStep !== null) {
      onProgress?.(toAnalysis(null));
    } else {
      const previewAcceptedTimeSec =
        analysisSource.currentAcceptedState().acceptedTimeSec;
      const previewAdvance = analysisSource.advanceToPresentationTime(
        previewAcceptedTimeSec + SELECTED_PRESENTATION_DT_SEC_V1,
      );
      if (previewAdvance.status === "advanced") {
        acceptedStepReadbackObservation = previewAdvance.observation;
        onProgress?.(toAnalysis(null, previewAdvance.observation));
      }
      analysisSource = await restoreSelectedAnalysisSessionV1(
        this.#variant,
        exactCheckpoint,
        scenario.fixture.hemodynamicResearchInputs,
        1,
        scenario.fixture.mechanismResearchInputs,
        analysisExecutionPlan.initialization,
      );
    }
    const starling = analysisId ===
        MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRESSURE_VOLUME_RELATIONS_V3_ID
      ? await runMainWireIntegratedModelFormalPressureVolumeProtocolV3(
          analysisSource,
          scenario.fixture.hemodynamicResearchInputs,
          (progress) => onProgress?.(
            toAnalysis(progress, acceptedStepReadbackObservation),
          ),
          responsivePartition,
        )
      : runMainWireIntegratedModelResponsiveStarlingProtocolV3(
          analysisSource,
          (progress) => onProgress?.(
            toAnalysis(progress, acceptedStepReadbackObservation),
          ),
          responsivePartition,
        );
    return toAnalysis(starling, acceptedStepReadbackObservation);
  }

  async captureDesiredContent(
    input: Readonly<{
      experimentId: string;
      model: ModelContractV2;
      desiredContent: ExperimentDesiredContentV2;
      correlation: ExperimentCaptureCorrelationV2;
    }>,
  ): Promise<ExperimentCaptureResultV2> {
    assertSelectedModelV1(input.model, this.#variant);
    if (
      input.desiredContent.modelId
      !== this.#variant.modelId
    ) {
      throw new Error("Selected Standard66 capture desired modelId mismatch");
    }
    const runtime = this.#requiredSession(input.correlation.runtimeSessionId);
    if (
      input.desiredContent.scenarios.length
      !== input.correlation.scenarios.length
    ) {
      throw new Error(
        "Selected Standard66 capture Scenario correlation length mismatch",
      );
    }
    const candidates = input.desiredContent.scenarios.map((desired, index) => {
      const correlation = input.correlation.scenarios[index];
      if (correlation?.scenarioId !== desired.scenarioId) {
        throw new Error("Selected Standard66 capture Scenario order mismatch");
      }
      const current = runtime.scenarios.get(desired.scenarioId);
      if (current === undefined) {
        throw new Error(
          `Selected Standard66 capture Scenario not found: ${desired.scenarioId}`,
        );
      }
      const desiredFixture = validateAndOwnSelectedFixtureV1(
        desired.fixture,
        this.#variant,
      );
      if (
        studioCanonicalJsonStringify(current.fixture)
        !== studioCanonicalJsonStringify(desiredFixture)
      ) {
        throw new Error(
          `Selected Standard66 capture fixture is stale: ${desired.scenarioId}`,
        );
      }
      if (current.inputEpoch !== correlation.expectedInputEpoch) {
        throw new Error(
          `Selected Standard66 capture input epoch is stale: ${desired.scenarioId}`,
        );
      }
      return Object.freeze({ desired, correlation, current });
    });
    const payloads = await Promise.all(
      candidates.map(({ current }) =>
        checkpointSelectedNumericalSessionV1(current.modelSession)),
    );
    const scenarios = candidates.map(
      ({ desired, correlation, current }, index) => {
        if (current.inputEpoch !== correlation.expectedInputEpoch) {
          throw new Error(
            `Selected Standard66 capture changed while freezing: ${desired.scenarioId}`,
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
        modelId: this.#variant.modelId,
        scenarios: Object.freeze(scenarios),
        surface: input.desiredContent.surface,
      }),
      confirmation: Object.freeze({
        experimentId: input.experimentId,
        runtimeSessionId: input.correlation.runtimeSessionId,
        scenarios: Object.freeze(
          input.correlation.scenarios.map((value) =>
            Object.freeze({ ...value })),
        ),
      }),
    });
  }

  #requiredSession(runtimeSessionId: string): SelectedRuntimeSessionV1 {
    const session = this.#sessions.get(runtimeSessionId);
    if (session === undefined) {
      throw new Error(
        `Selected Standard66 runtime session not found: ${runtimeSessionId}`,
      );
    }
    return session;
  }

  #requiredScenario(
    runtimeSessionId: string,
    scenarioId: string,
  ): SelectedRuntimeScenarioV1 {
    const scenario =
      this.#requiredSession(runtimeSessionId).scenarios.get(scenarioId);
    if (scenario === undefined) {
      throw new Error(
        `Selected Standard66 runtime Scenario not found: ${runtimeSessionId}/${scenarioId}`,
      );
    }
    return scenario;
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
      SELECTED_EXECUTION_PLAN_DESCRIPTOR_V1,
    );
    const owner = this.#executionPlanScenarioOwners.get(boundExecutionPlan);
    if (owner === undefined) {
      this.#executionPlanScenarioOwners.set(
        boundExecutionPlan,
        Object.freeze({ runtimeSessionId, scenarioId }),
      );
    } else if (
      owner.runtimeSessionId !== runtimeSessionId
      || owner.scenarioId !== scenarioId
    ) {
      throw new Error(
        "Selected Standard66 execution plan cannot be shared between Scenarios",
      );
    }
    const updateSchedule =
      resolveBoundExecutionPlanUpdateScheduleV1(boundExecutionPlan);
    const updateGroup = assertSelectedExecutionPlanUpdateScheduleV1(
      updateSchedule,
    );
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
          SELECTED_SOLVE_SYSTEM_BINDINGS_V1,
        ),
      }),
      updateSchedule,
    });
  }

  #advanceScenarioProjection(
    scenario: SelectedRuntimeScenarioV1,
    outputIds: readonly SelectedOutputIdV1[],
  ): Readonly<{
    advance: Extract<
      MainWireFlatModelOwnedProjectionAdvanceV1,
      { status: "advanced" }
    >;
    projectedValues: Readonly<
      Record<string, SelectedOutputValueV1>
    >;
  }> {
    const binding = scenario.executionPlanBinding;
    if (binding.modelSession !== scenario.modelSession) {
      throw new Error(
        "Selected Standard66 Scenario update schedule is not installed",
      );
    }
    const nextOrdinal = scenario.presentationOrdinal + 1;
    const targetBaseTick = executionPlanPresentationBaseTickV1(
      binding.updateSchedule,
      binding.presentationOriginBaseTick,
      nextOrdinal,
    );
    const [updateGroup] = binding.updateSchedule.groups;
    if (
      updateGroup === undefined
      || !executionPlanUpdateGroupIsDueAtBaseTickV1(
        binding.updateSchedule,
        updateGroup,
        targetBaseTick,
      )
    ) {
      throw new Error(
        "Selected Standard66 presentation target has no scheduled update",
      );
    }
    const projection = advanceSelectedNumericalProjectionV1(
        scenario.modelSession,
        executionPlanTimeAtBaseTickV1(
          binding.updateSchedule,
          targetBaseTick,
        ),
        outputIds,
      );
    if (projection.advance.status !== "advanced") {
      throw new Error(selectedAdvanceFailureMessageV1(projection.advance));
    }
    if (projection.projectedValues === null) {
      throw new Error(
        "Selected Standard66 presentation projection is unavailable",
      );
    }
    scenario.presentationOrdinal = nextOrdinal;
    return Object.freeze({
      advance: projection.advance,
      projectedValues: projection.projectedValues,
    });
  }

  async #warmStartFixtureAtomically(
    runtimeSessionId: string,
    scenarioId: string,
    fixture: MainWireIntegratedStudioSelectedAorticOutflowFixtureV1,
    expectedInputEpoch: number,
  ): Promise<StudioSimulationFrameV2> {
    if (this.#variant.generation !== 68) {
      throw new Error("Accepted-state warm start is owned only by Standard68");
    }
    const original = this.#requiredScenario(runtimeSessionId, scenarioId);
    if (original.inputEpoch !== expectedInputEpoch) {
      throw new Error("Standard68 fixture warm start input epoch is stale");
    }
    let preparedExecutionPlan = this.#prepareExecutionPlan(
      runtimeSessionId,
      scenarioId,
      bindMainWireIntegratedStudioSelectedAorticOutflowExecutionPlanV1(),
    );
    const warmedCandidate =
      await original.modelSession.warmStartWithHemodynamicResearchInputs(
        fixture.hemodynamicResearchInputs,
        1,
        preparedExecutionPlan.initialization,
        fixture.mechanismResearchInputs,
      );
    if (
      !(warmedCandidate instanceof
        MainWireIntegratedModelStandard68TypedAuthoritySessionV1)
    ) {
      throw new Error("Standard68 warm start returned the wrong exact owner");
    }
    let candidate = warmedCandidate;
    let accepted = candidate.currentAcceptedState();
    const sourceAccepted = original.modelSession.currentAcceptedState();
    if (
      accepted.revision !== sourceAccepted.revision
      || accepted.acceptedTimeSec !== sourceAccepted.acceptedTimeSec
    ) {
      throw new Error("Standard68 fixture warm start changed the accepted clock");
    }

    // Changing TBV is the one warm-start operation that redistributes stored
    // volume. Preflight a full target cycle on a detached exact restore before
    // committing the live owner. If a large instantaneous rebase fails, run a
    // deterministic adaptive homotopy on detached exact owners: each accepted
    // volume stage relaxes for one target cycle, while a failed interval is
    // bisected down to the public 50-mL resolution. The live owner is swapped
    // only after the final target stage succeeds.
    if (
      fixture.hemodynamicResearchInputs.totalBloodVolumeMl
      !== original.fixture.hemodynamicResearchInputs.totalBloodVolumeMl
    ) {
      const sourceTbvMl =
        original.fixture.hemodynamicResearchInputs.totalBloodVolumeMl;
      const targetTbvMl =
        fixture.hemodynamicResearchInputs.totalBloodVolumeMl;
      // A large downward jump can survive one deterministic cycle and still
      // enter the low-volume numerical boundary on the next beat.  Do not
      // mistake that transient survival for a safe direct rebase.
      const requiresBoundedContinuation =
        sourceTbvMl - targetTbvMl >
          STANDARD68_TBV_CONTINUATION_INITIAL_STEP_ML_V1;
      const preflightExecutionPlan = this.#prepareExecutionPlan(
        runtimeSessionId,
        scenarioId,
        bindMainWireIntegratedStudioSelectedAorticOutflowExecutionPlanV1(),
      );
      const preflight = await restoreSelectedNumericalSessionV1(
        this.#variant,
        await candidate.checkpointStandard68Exact(),
        fixture.hemodynamicResearchInputs,
        1,
        preflightExecutionPlan.initialization,
        fixture.mechanismResearchInputs,
      );
      if (!(preflight instanceof
        MainWireIntegratedModelStandard68TypedAuthoritySessionV1)) {
        throw new Error("Standard68 TBV preflight restored the wrong exact owner");
      }
      const directFailure = requiresBoundedContinuation
        ? "large downward TBV rebase requires bounded continuation"
        : this.#advanceDetachedStandard68Cycles(
            preflight,
            preflightExecutionPlan.updateSchedule,
            fixture.hemodynamicResearchInputs.heartRateBpm,
            1,
          );
      if (directFailure !== null) {
        if (!(original.modelSession instanceof
          MainWireIntegratedModelStandard68TypedAuthoritySessionV1)) {
          throw new Error("Standard68 TBV continuation source is unavailable");
        }
        let stageSource:
          MainWireIntegratedModelStandard68TypedAuthoritySessionV1 =
            original.modelSession;
        const direction = Math.sign(targetTbvMl - sourceTbvMl);
        let acceptedStageTbvMl = sourceTbvMl;
        let stepMagnitudeMl = Math.min(
          Math.abs(targetTbvMl - sourceTbvMl),
          STANDARD68_TBV_CONTINUATION_INITIAL_STEP_ML_V1,
        );
        let attempt = 0;
        while (Math.abs(targetTbvMl - acceptedStageTbvMl) > 1e-9) {
          attempt += 1;
          if (attempt > STANDARD68_TBV_CONTINUATION_MAX_ATTEMPTS_V1) {
            throw new Error(
              "Standard68 TBV continuation exhausted its bounded attempts",
            );
          }
          const remainingMagnitudeMl =
            Math.abs(targetTbvMl - acceptedStageTbvMl);
          const attemptedMagnitudeMl = Math.min(
            stepMagnitudeMl,
            remainingMagnitudeMl,
          );
          const stageTbvMl = attemptedMagnitudeMl >= remainingMagnitudeMl - 1e-9
            ? targetTbvMl
            : acceptedStageTbvMl + direction * attemptedMagnitudeMl;
          const stageInputs = Object.freeze({
            ...fixture.hemodynamicResearchInputs,
            totalBloodVolumeMl: stageTbvMl,
          });
          const stageExecutionPlan = this.#prepareExecutionPlan(
            runtimeSessionId,
            scenarioId,
            bindMainWireIntegratedStudioSelectedAorticOutflowExecutionPlanV1(),
          );
          const stageCandidate =
            await stageSource.warmStartWithHemodynamicResearchInputs(
              stageInputs,
              1,
              stageExecutionPlan.initialization,
              fixture.mechanismResearchInputs,
            );
          const stageSourceAccepted = stageSource.currentAcceptedState();
          const stageAccepted = stageCandidate.currentAcceptedState();
          if (
            stageAccepted.revision !== stageSourceAccepted.revision
            || stageAccepted.acceptedTimeSec
              !== stageSourceAccepted.acceptedTimeSec
          ) {
            throw new Error(
              "Standard68 TBV continuation changed a stage boundary clock",
            );
          }
          const stageFailure = this.#advanceDetachedStandard68Cycles(
            stageCandidate,
            stageExecutionPlan.updateSchedule,
            fixture.hemodynamicResearchInputs.heartRateBpm,
            1,
          );
          if (stageFailure !== null) {
            if (
              attemptedMagnitudeMl
              <= STANDARD68_TBV_CONTINUATION_MIN_STEP_ML_V1 + 1e-9
            ) {
              throw new Error(
                "Standard68 TBV warm start rejected before commit: direct "
                  + `${directFailure}; adaptive continuation from `
                  + `${acceptedStageTbvMl} to ${stageTbvMl} mL failed at the `
                  + `${STANDARD68_TBV_CONTINUATION_MIN_STEP_ML_V1}-mL `
                  + `resolution: ${stageFailure}`,
              );
            }
            stepMagnitudeMl = Math.max(
              STANDARD68_TBV_CONTINUATION_MIN_STEP_ML_V1,
              attemptedMagnitudeMl / 2,
            );
            continue;
          }
          stageSource = stageCandidate;
          candidate = stageCandidate;
          preparedExecutionPlan = stageExecutionPlan;
          acceptedStageTbvMl = stageTbvMl;
          stepMagnitudeMl = Math.min(
            STANDARD68_TBV_CONTINUATION_INITIAL_STEP_ML_V1,
            Math.max(
              STANDARD68_TBV_CONTINUATION_MIN_STEP_ML_V1,
              attemptedMagnitudeMl * 1.5,
            ),
          );
        }
        accepted = candidate.currentAcceptedState();
      }
    }

    const current = this.#requiredScenario(runtimeSessionId, scenarioId);
    if (current !== original || current.inputEpoch !== expectedInputEpoch) {
      throw new Error("Standard68 fixture warm start became stale before swap");
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

  #advanceDetachedStandard68Cycles(
    session: MainWireIntegratedModelStandard68TypedAuthoritySessionV1,
    updateSchedule: BoundExecutionPlanUpdateScheduleV1,
    heartRateBpm: number,
    cycleCount: number,
  ): string | null {
    const accepted = session.currentAcceptedState();
    const originBaseTick = executionPlanBaseTickAtTimeV1(
      updateSchedule,
      accepted.acceptedTimeSec,
    );
    const endTimeSec = accepted.acceptedTimeSec
      + cycleCount * 60 / heartRateBpm;
    for (let ordinal = 1; ; ordinal += 1) {
      const targetBaseTick = executionPlanPresentationBaseTickV1(
        updateSchedule,
        originBaseTick,
        ordinal,
      );
      const targetTimeSec = executionPlanTimeAtBaseTickV1(
        updateSchedule,
        targetBaseTick,
      );
      if (targetTimeSec > endTimeSec + 1e-12) return null;
      const advance = session.advanceToPresentationTime(targetTimeSec);
      if (advance.status !== "advanced") {
        return selectedAdvanceFailureMessageV1(advance);
      }
    }
  }

  async #coldRestartFixtureAtomically(
    runtimeSessionId: string,
    scenarioId: string,
    fixture: MainWireIntegratedStudioSelectedAorticOutflowFixtureV1,
    expectedInputEpoch: number,
  ): Promise<StudioSimulationFrameV2> {
    const original = this.#requiredScenario(runtimeSessionId, scenarioId);
    if (original.inputEpoch !== expectedInputEpoch) {
      throw new Error("Selected Standard66 cold restart input epoch is stale");
    }
    const boundExecutionPlan =
      bindMainWireIntegratedStudioSelectedAorticOutflowExecutionPlanV1();
    const preparedExecutionPlan = this.#prepareExecutionPlan(
      runtimeSessionId,
      scenarioId,
      boundExecutionPlan,
    );

    // The fixed matched-alpha assembly has no warm-rebinding contract. Build
    // and validate the complete replacement before touching the live owner.
    const candidate =
      await createSelectedNumericalSessionV1(
        this.#variant,
        fixture.hemodynamicResearchInputs,
        1,
        preparedExecutionPlan.initialization,
        fixture.mechanismResearchInputs,
      );
    const current = this.#requiredScenario(runtimeSessionId, scenarioId);
    if (current !== original || current.inputEpoch !== expectedInputEpoch) {
      throw new Error(
        "Selected Standard66 cold restart became stale before swap",
      );
    }
    const accepted = candidate.currentAcceptedState();
    current.fixture = fixture;
    current.modelSession = candidate;
    current.executionPlanBinding = Object.freeze({
      boundExecutionPlan,
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

/** Fixed artifact ABI consumed by DynamicExactModelRuntimeLoaderV2. */
export function createCircleHeartExactModelReleaseV1():
  MainWireIntegratedStudioSelectedAorticOutflowExactReleaseV1 {
  const host =
    new MainWireIntegratedStudioSelectedAorticOutflowRuntimeHostV1(
      SELECTED_STANDARD66_EXACT_VARIANT_V1,
    );
  return Object.freeze({
    manifest: createSelectedExactKernelV1(
      SELECTED_STANDARD66_EXACT_VARIANT_V1,
    ),
    executables: selectedExecutableBundleV1(
      host,
      SELECTED_STANDARD66_EXACT_VARIANT_V1,
    ),
  });
}

export const createMainWireIntegratedStudioSelectedAorticOutflowReleaseV1 =
  createCircleHeartExactModelReleaseV1;

export function createMainWireIntegratedStudioAlgebraicProximalRootsReleaseV1():
  MainWireIntegratedStudioSelectedAorticOutflowExactReleaseV1 {
  const host =
    new MainWireIntegratedStudioSelectedAorticOutflowRuntimeHostV1(
      SELECTED_STANDARD67_EXACT_VARIANT_V1,
    );
  return Object.freeze({
    manifest: createSelectedExactKernelV1(
      SELECTED_STANDARD67_EXACT_VARIANT_V1,
    ),
    executables: selectedExecutableBundleV1(
      host,
      SELECTED_STANDARD67_EXACT_VARIANT_V1,
    ),
  });
}

export function createMainWireIntegratedStudioRoundedEjectionReleaseV1(
  defaultBaselineCheckpoint?: MainWireIntegratedModelStandard68CheckpointV1,
):
  MainWireIntegratedStudioSelectedAorticOutflowExactReleaseV1 {
  const host =
    new MainWireIntegratedStudioSelectedAorticOutflowRuntimeHostV1(
      ROUNDED_EJECTION_STANDARD68_EXACT_VARIANT_V1,
      defaultBaselineCheckpoint,
    );
  return Object.freeze({
    manifest: createSelectedExactKernelV1(
      ROUNDED_EJECTION_STANDARD68_EXACT_VARIANT_V1,
    ),
    executables: selectedExecutableBundleV1(
      host,
      ROUNDED_EJECTION_STANDARD68_EXACT_VARIANT_V1,
    ),
  });
}

export function createMainWireIntegratedStudioSelectedAorticOutflowKernelV1():
  ExactModelKernelManifestV3 {
  return createSelectedExactKernelV1(
    SELECTED_STANDARD66_EXACT_VARIANT_V1,
  );
}

export function createMainWireIntegratedStudioAlgebraicProximalRootsKernelV1():
  ExactModelKernelManifestV3 {
  return createSelectedExactKernelV1(
    SELECTED_STANDARD67_EXACT_VARIANT_V1,
  );
}

export function createMainWireIntegratedStudioRoundedEjectionKernelV1():
  ExactModelKernelManifestV3 {
  return createSelectedExactKernelV1(
    ROUNDED_EJECTION_STANDARD68_EXACT_VARIANT_V1,
  );
}

function createSelectedExactKernelV1(
  variant: SelectedExactModelVariantV1,
): ExactModelKernelManifestV3 {
  const signalDefinitions = selectedSignalDefinitionsV1(variant);
  const metricDefinitions = selectedMetricDefinitionsV1(variant);
  const controlCatalog = selectedControlCatalogV1(variant);
  const manifest: ExactModelKernelManifestV3 = Object.freeze({
    schemaId: STUDIO_EXACT_MODEL_KERNEL_V3_SCHEMA_ID,
    modelId: variant.modelId,
    modelFamilyId: MAIN_WIRE_INTEGRATED_STUDIO_MODEL_FAMILY_ID_V3,
    equations: Object.freeze({
      transactionId: MAIN_WIRE_INTEGRATED_MODEL_TRANSACTION_V3_ID,
      fixtureId: variant.fixtureId,
      coronaryOwner: "main-wire-five-wall-coronary-transaction-v3",
      rhythmOwner:
        variant.fixtureClaim.regularSinusProfileId,
      calciumOwner:
        variant.fixtureClaim.composedRhythmCalciumOwner,
      ventricularMaterialProfileId:
        variant.fixtureClaim.ventricularMaterialProfileId,
      aorticOutflowCirculationProfileId:
        variant.fixtureClaim.aorticOutflowCirculationProfileId,
      ...(variant.proximalArterialRootsProfileId === null
        ? {}
        : {
            proximalArterialRootsProfileId:
              variant.proximalArterialRootsProfileId,
          }),
      acceptedStepBeatMetricOwners: Object.freeze([
        MAIN_WIRE_INTEGRATED_MODEL_BEAT_METRICS_V3_ID,
      ]),
    }),
    runtime: Object.freeze({
      numericalSessionId: variant.numericalSessionId,
      presentationDtSec: SELECTED_PRESENTATION_DT_SEC_V1,
      hotPathIntegrityTier:
        MAIN_WIRE_INTEGRATED_STUDIO_SELECTED_AORTIC_OUTFLOW_HOT_PATH_INTEGRITY_TIER_V1,
      acceptedBoundaryCapture: true,
      fixtureChangeSemantics:
        variant.generation === 68
          ? "atomic-accepted-state-warm-start-bounded-tbv-continuation-new-fixture-epoch"
          : "atomic-cold-restart-at-zero-clock-new-fixture-epoch",
      scope: variant.runtimeScope,
    }),
    solver: Object.freeze({
      candidateSemantics:
        "event-limited-atomic-composed-rhythm-coronary-dynamic-mcs",
      acceptedStateMutation: false,
      failureRollback: "previous-accepted-tuple",
    }),
    fixtureSchema: Object.freeze({
      fixtureSchemaId:
        MAIN_WIRE_INTEGRATED_STUDIO_SELECTED_AORTIC_OUTFLOW_FIXTURE_SCHEMA_ID_V1,
      definition: Object.freeze({
        schemaId:
          MAIN_WIRE_INTEGRATED_STUDIO_SELECTED_AORTIC_OUTFLOW_FIXTURE_SCHEMA_ID_V1,
        exactKeys: Object.freeze([
          "schemaId",
          "rhythm",
          "coronary",
          "dynamicMechanicalSupport",
          "hemodynamicResearchInputs",
          "mechanismResearchInputs",
        ]),
        hemodynamicResearchInputs:
          "main-wire-integrated-model-hemodynamic-research-inputs-v3",
        mechanismResearchInputs:
          "main-wire-integrated-model-mechanism-research-inputs-v3",
        calciumDecayTimeScaleResearchInput:
          variant.fixtureClaim.calciumDecayTimeScaleResearchInput,
      }),
    }),
    checkpointCodec: Object.freeze({
      checkpointCodecId: variant.checkpointCodecId,
      definition: Object.freeze({
        checkpointId: variant.checkpointId,
        schemaVersion: 1,
        fixturePairing: variant.checkpointFixturePairing,
        restoreSemantics:
          "exact-object-selected-identity-no-migration-no-clock-rebase",
      }),
    }),
    primitiveControlCatalog: controlCatalog,
    primitiveSignalCatalog: signalDefinitions,
    modelMetricCatalog: metricDefinitions,
    capabilities: Object.freeze([
      STUDIO_EXACT_PRESENTATION_BATCH_CAPABILITY_V1,
      EXECUTION_PLAN_TYPED_AUTHORITY_BINDING_V1_CAPABILITY,
      EXECUTION_PLAN_NEWTON_WORKSPACE_V1_CAPABILITY,
      ...controlCatalog.map(
        ({ controlId }) => `control/${controlId}`,
      ),
      ...signalDefinitions.map(
        ({ outputId }) => `output/${outputId}`,
      ),
      ...metricDefinitions.map(
        ({ outputId }) => `output/${outputId}`,
      ),
      ...(variant.generation === 68
        ? [
            `analysis/${MAIN_WIRE_INTEGRATED_MODEL_GUYTON_STARLING_ORIENTATION_V3_ID}`,
            `analysis/${MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRESSURE_VOLUME_RELATIONS_V3_ID}`,
          ]
        : []),
    ]),
  });
  assertExactModelKernelManifestV3(manifest);
  return manifest;
}

function selectedExecutableBundleV1(
  host: MainWireIntegratedStudioSelectedAorticOutflowRuntimeHostV1,
  variant: SelectedExactModelVariantV1,
): RegisteredModelExecutableBundleV2 {
  const captureAdapter = Object.freeze({
    modelId: variant.modelId,
    fixtureSchemaId:
      MAIN_WIRE_INTEGRATED_STUDIO_SELECTED_AORTIC_OUTFLOW_FIXTURE_SCHEMA_ID_V1,
    checkpointCodecId: variant.checkpointCodecId,
    validateFixture(
      input: Readonly<{ model: ModelContractV2; fixture: StudioJsonValueV2 }>,
    ) {
      assertSelectedModelV1(input.model, variant);
      validateAndOwnSelectedFixtureV1(input.fixture, variant);
      return undefined;
    },
    async validateCapture(
      input: Readonly<{
        model: ModelContractV2;
        capture: ExperimentContentV2["scenarios"][number]["capture"];
      }>,
    ): Promise<void> {
      assertSelectedModelV1(input.model, variant);
      const fixture = validateAndOwnSelectedFixtureV1(
        input.capture.fixture,
        variant,
      );
      const checkpoint = validateSelectedScenarioCheckpointV1(
        input.capture.checkpoint,
      );
      const restored = await restoreSelectedNumericalSessionV1(
            variant,
            checkpoint.payload,
            fixture.hemodynamicResearchInputs,
            1,
            undefined,
            fixture.mechanismResearchInputs,
          );
      const accepted = restored.currentAcceptedState();
      if (
        accepted.revision !== checkpoint.acceptedRevision
        || accepted.acceptedTimeSec !== checkpoint.acceptedTimeSec
      ) {
        throw new Error(
          "Selected Standard66 exact checkpoint restore clock mismatch",
        );
      }
      const roundTrip = await checkpointSelectedNumericalSessionV1(restored);
      if (
        studioCanonicalJsonStringify(roundTrip)
        !== studioCanonicalJsonStringify(checkpoint.payload)
      ) {
        throw new Error(
          "Selected Standard66 exact checkpoint restore is not canonical",
        );
      }
    },
  });

  const fixtureAdapter = Object.freeze({
    modelId: variant.modelId,
    fixtureSchemaId:
      MAIN_WIRE_INTEGRATED_STUDIO_SELECTED_AORTIC_OUTFLOW_FIXTURE_SCHEMA_ID_V1,
    validateCompleteFixture(
      input: Readonly<{
        context: Readonly<{ scenarioId: string; modelId: string }>;
        fixture: StudioJsonValueV2;
      }>,
    ) {
      assertSelectedRuntimeContextV1(input.context, variant);
      const fixture = validateAndOwnSelectedFixtureV1(input.fixture, variant);
      createSelectedNumericalFixtureV1(
        variant,
        fixture.hemodynamicResearchInputs,
        fixture.mechanismResearchInputs,
      );
      return undefined;
    },
    reduceControlAction(
      input: Readonly<{
        context: Readonly<{ scenarioId: string; modelId: string }>;
        fixture: StudioJsonValueV2;
        action: StudioControlActionV2;
      }>,
    ): StudioFixturePatchV2 {
      assertSelectedRuntimeContextV1(input.context, variant);
      const fixture = validateAndOwnSelectedFixtureV1(input.fixture, variant);
      if (variant.generation === 68) {
        return reduceMainWireIntegratedStudioRoundedEjectionControlV1(
          fixture,
          input.action.controlId,
          input.action.value,
        );
      }
      if (
        input.action.controlId
        !== MAIN_WIRE_INTEGRATED_STUDIO_SELECTED_AORTIC_OUTFLOW_CONTROL_IDS_V1
          .heartRateBpm
      ) {
        throw new Error(
          `Selected Standard66 control is not registered: ${input.action.controlId}`,
        );
      }
      const next = applySelectedHeartRateV1(
        fixture,
        input.action.value,
        variant,
      );
      return Object.freeze({
        changes: Object.freeze([
          Object.freeze({
            path: Object.freeze([
              "hemodynamicResearchInputs",
              "heartRateBpm",
            ] as const),
            value: next.hemodynamicResearchInputs.heartRateBpm,
          }),
        ]),
      });
    },
  });

  const simulationAdapter = Object.freeze({
    modelId: variant.modelId,
    fixtureSchemaId:
      MAIN_WIRE_INTEGRATED_STUDIO_SELECTED_AORTIC_OUTFLOW_FIXTURE_SCHEMA_ID_V1,
    checkpointCodecId: variant.checkpointCodecId,
    createSession: (input: Readonly<{
      runtimeSessionId: string;
      scenarios: readonly Readonly<{
        scenarioId: string;
        fixture: StudioJsonValueV2;
        checkpoint?: ScenarioCheckpointV2;
      }>[];
    }>) => host.createSession(input.runtimeSessionId, input.scenarios),
    disposeSession: (runtimeSessionId: string) =>
      host.closeSession(runtimeSessionId),
    currentFrame: (input: Readonly<{
      runtimeSessionId: string;
      scenarioId: string;
    }>) => host.currentFrame(input.runtimeSessionId, input.scenarioId),
    advanceOnePresentationStep: async (input: Readonly<{
      runtimeSessionId: string;
      scenarioId: string;
    }>) => host.advanceOnePresentationStep(
      input.runtimeSessionId,
      input.scenarioId,
    ),
    advancePresentationBatch: async (input: Readonly<{
      runtimeSessionId: string;
      scenarioId: string;
      stepCount: number;
      presentationOutputIds: readonly string[];
    }>) => host.advancePresentationBatch(
      input.runtimeSessionId,
      input.scenarioId,
      input.stepCount,
      input.presentationOutputIds,
    ),
    applyControl: async (input: Readonly<{
      runtimeSessionId: string;
      scenarioId: string;
      controlId: string;
      value: number;
      expectedInputEpoch: number;
    }>) => host.applyControl(
      input.runtimeSessionId,
      input.scenarioId,
      input.controlId,
      input.value,
      input.expectedInputEpoch,
    ),
    requestAnalysis: (input: Readonly<{
      runtimeSessionId: string;
      scenarioId: string;
      analysisId: string;
      expectedInputEpoch: number;
      expectedAcceptedRevision: number;
      expectedAcceptedTimeSec: number;
      analysisPartition?: string;
      onProgress?: (analysis: StudioSimulationAnalysisV2) => void;
    }>) => host.requestAnalysis(
      input.runtimeSessionId,
      input.scenarioId,
      input.analysisId,
      input.expectedInputEpoch,
      input.expectedAcceptedRevision,
      input.expectedAcceptedTimeSec,
      input.analysisPartition,
      input.onProgress,
    ),
    replaceFixture: (input: Readonly<{
      runtimeSessionId: string;
      scenarioId: string;
      fixture: StudioJsonValueV2;
    }>) => host.replaceFixture(
      input.runtimeSessionId,
      input.scenarioId,
      input.fixture,
    ),
    currentInputEpoch: (input: Readonly<{
      runtimeSessionId: string;
      scenarioId: string;
    }>) => host.currentInputEpoch(
      input.runtimeSessionId,
      input.scenarioId,
    ),
  });

  return Object.freeze({
    modelId: variant.modelId,
    fixtureSchemaId:
      MAIN_WIRE_INTEGRATED_STUDIO_SELECTED_AORTIC_OUTFLOW_FIXTURE_SCHEMA_ID_V1,
    checkpointCodecId: variant.checkpointCodecId,
    snapshotGateId: STUDIO_COMMON_SNAPSHOT_ADMISSION_ID_V1,
    captureAdapter,
    experimentCapture: Object.freeze({
      modelId: variant.modelId,
      fixtureSchemaId:
        MAIN_WIRE_INTEGRATED_STUDIO_SELECTED_AORTIC_OUTFLOW_FIXTURE_SCHEMA_ID_V1,
      checkpointCodecId: variant.checkpointCodecId,
      captureAcceptedCandidate: host.captureDesiredContent.bind(host),
    }),
    snapshotGate: Object.freeze({
      modelId: variant.modelId,
      snapshotGateId: STUDIO_COMMON_SNAPSHOT_ADMISSION_ID_V1,
      async admitFrozenCandidate(input: Readonly<{
        model: ModelContractV2;
        content: ExperimentContentV2;
      }>): Promise<ExperimentSnapshotAdmissionResultV2> {
        assertSelectedModelV1(input.model, variant);
        if (
          input.content.modelId
          !== variant.modelId
        ) {
          return Object.freeze({
            status: "rejected" as const,
            reason: "content modelId mismatch",
          });
        }
        for (const scenario of input.content.scenarios) {
          try {
            await captureAdapter.validateCapture({
              model: input.model,
              capture: scenario.capture,
            });
            const fixture = validateAndOwnSelectedFixtureV1(
              scenario.capture.fixture,
              variant,
            );
            const checkpoint = validateSelectedScenarioCheckpointV1(
              scenario.capture.checkpoint,
            );
            const fork = await restoreSelectedNumericalSessionV1(
                  variant,
                  checkpoint.payload,
                  fixture.hemodynamicResearchInputs,
                  1,
                  undefined,
                  fixture.mechanismResearchInputs,
                );
            const endTimeSec = checkpoint.acceptedTimeSec
              + 60 / fixture.hemodynamicResearchInputs.heartRateBpm;
            for (let ordinal = 1; ; ordinal += 1) {
              const targetTimeSec = Math.min(
                checkpoint.acceptedTimeSec
                  + ordinal * SELECTED_PRESENTATION_DT_SEC_V1,
                endTimeSec,
              );
              const advance = fork.advanceToPresentationTime(targetTimeSec);
              if (advance.status !== "advanced") {
                throw new Error(selectedAdvanceFailureMessageV1(advance));
              }
              if (targetTimeSec === endTimeSec) break;
            }
            const terminalCheckpoint =
              await checkpointSelectedNumericalSessionV1(fork);
            const terminalRestored = await restoreSelectedNumericalSessionV1(
                  variant,
                  terminalCheckpoint,
                  fixture.hemodynamicResearchInputs,
                  1,
                  undefined,
                  fixture.mechanismResearchInputs,
                );
            const terminalRoundTrip =
              await checkpointSelectedNumericalSessionV1(terminalRestored);
            if (
              studioCanonicalJsonStringify(terminalRoundTrip)
              !== studioCanonicalJsonStringify(terminalCheckpoint)
            ) {
              throw new Error(
                "selected terminal checkpoint exact round-trip differs",
              );
            }
          } catch (error) {
            return Object.freeze({
              status: "rejected" as const,
              reason: `${scenario.scenarioId}: ${
                error instanceof Error ? error.message : String(error)
              }`,
            });
          }
        }
        return Object.freeze({ status: "passed" as const });
      },
    }),
    fixtureAdapter,
    simulationAdapter,
    executionPlan: Object.freeze({
      schemaId: REGISTERED_MODEL_EXECUTION_PLAN_ADAPTER_V1_SCHEMA_ID,
      modelId: variant.modelId,
      descriptor: SELECTED_EXECUTION_PLAN_DESCRIPTOR_V1,
      bind: bindMainWireIntegratedStudioSelectedAorticOutflowExecutionPlanV1,
      createSession: (input) => host.createSession(
        input.runtimeSessionId,
        input.scenarios,
        input.boundExecutionPlans,
      ),
    }),
  });
}

function validateAndOwnSelectedFixtureV1(
  value: unknown,
  variant: SelectedExactModelVariantV1,
): MainWireIntegratedStudioSelectedAorticOutflowFixtureV1 {
  const owned = cloneAndFreezeStudioJson(value as StudioJsonValueV2);
  const record = exactSelectedRecordV1(
    owned,
    [
      "coronary",
      "dynamicMechanicalSupport",
      "hemodynamicResearchInputs",
      "mechanismResearchInputs",
      "rhythm",
      "schemaId",
    ],
    "fixture",
  );
  if (
    record.schemaId
    !== MAIN_WIRE_INTEGRATED_STUDIO_SELECTED_AORTIC_OUTFLOW_FIXTURE_SCHEMA_ID_V1
  ) {
    throw new Error("Selected Standard66 fixture schemaId mismatch");
  }
  exactSelectedLiteralRecordV1(
    record.rhythm,
    "mode",
    "regular-sinus-v3",
    "rhythm",
  );
  exactSelectedLiteralRecordV1(
    record.coronary,
    "topologyProfile",
    "coronary-network-v2",
    "coronary",
  );
  exactSelectedLiteralRecordV1(
    record.dynamicMechanicalSupport,
    "mode",
    "all-off-zero-inertance-v3",
    "dynamicMechanicalSupport",
  );
  const mechanismResearchInputs =
    validateAndOwnMainWireIntegratedModelMechanismResearchInputsV3(
      record.mechanismResearchInputs,
    );
  for (const [wallId, scale] of Object.entries(
    mechanismResearchInputs.chamberMechanics.calciumDecayTimeScaleByWall,
  )) {
    if (!Object.is(scale, 1)) {
      throw new Error(
        `Selected ${variant.label} fixture requires unit calcium decay-time `
          + `scale for ${wallId}`,
      );
    }
  }
  return Object.freeze({
    schemaId:
      MAIN_WIRE_INTEGRATED_STUDIO_SELECTED_AORTIC_OUTFLOW_FIXTURE_SCHEMA_ID_V1,
    rhythm: Object.freeze({ mode: "regular-sinus-v3" }),
    coronary: Object.freeze({ topologyProfile: "coronary-network-v2" }),
    dynamicMechanicalSupport: Object.freeze({
      mode: "all-off-zero-inertance-v3",
    }),
    hemodynamicResearchInputs:
      validateAndOwnMainWireIntegratedModelHemodynamicResearchInputsV3(
        record.hemodynamicResearchInputs,
      ),
    mechanismResearchInputs,
  });
}

function applySelectedHeartRateV1(
  fixture: MainWireIntegratedStudioSelectedAorticOutflowFixtureV1,
  heartRateBpm: number,
  variant: SelectedExactModelVariantV1,
): MainWireIntegratedStudioSelectedAorticOutflowFixtureV1 {
  const definition = SELECTED_CONTROL_CATALOG_V1[0]!;
  const issue = studioNumericControlValueIssueV2(heartRateBpm, definition);
  if (issue !== undefined) {
    throw new Error(
      `Selected Standard66 control ${definition.controlId} value ${issue}`,
    );
  }
  return validateAndOwnSelectedFixtureV1({
    ...fixture,
    hemodynamicResearchInputs: {
      ...fixture.hemodynamicResearchInputs,
      heartRateBpm,
    },
  }, variant);
}

function exactSelectedRecordV1(
  value: unknown,
  expectedKeys: readonly string[],
  label: string,
): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`Selected Standard66 ${label} must be a plain object`);
  }
  const record = value as Record<string, unknown>;
  const actual = Object.keys(record).sort();
  const expected = [...expectedKeys].sort();
  if (
    actual.length !== expected.length
    || actual.some((key, index) => key !== expected[index])
  ) {
    throw new Error(
      `Selected Standard66 ${label} keys must be exactly ${expected.join(", ")}`,
    );
  }
  return record;
}

function exactSelectedLiteralRecordV1(
  value: unknown,
  key: string,
  literal: string,
  label: string,
): void {
  const record = exactSelectedRecordV1(value, [key], `fixture ${label}`);
  if (record[key] !== literal) {
    throw new Error(`Selected Standard66 fixture ${label}.${key} mismatch`);
  }
}

function validateSelectedScenarioCheckpointV1(
  value: unknown,
): ScenarioCheckpointV2 {
  const owned = cloneAndFreezeStudioJson(value as StudioJsonValueV2);
  const record = exactSelectedRecordV1(
    owned,
    ["acceptedRevision", "acceptedTimeSec", "payload"],
    "checkpoint",
  );
  if (
    !Number.isSafeInteger(record.acceptedRevision)
    || (record.acceptedRevision as number) < 0
    || !Number.isFinite(record.acceptedTimeSec)
    || (record.acceptedTimeSec as number) < 0
  ) {
    throw new Error("Selected Standard66 checkpoint clock is invalid");
  }
  const payload = cloneAndFreezeStudioJson<StudioJsonValueV2>(record.payload);
  const payloadRecord = payload as Record<string, unknown>;
  if (
    payloadRecord.revision !== record.acceptedRevision
    || payloadRecord.acceptedTimeSec !== record.acceptedTimeSec
  ) {
    throw new Error(
      "Selected Standard66 checkpoint wrapper and payload clocks differ",
    );
  }
  return Object.freeze({
    acceptedRevision: record.acceptedRevision as number,
    acceptedTimeSec: record.acceptedTimeSec as number,
    payload,
  });
}

function validateSelectedOutputIdsV1(
  variant: SelectedExactModelVariantV1,
  outputIds: readonly string[],
): readonly SelectedOutputIdV1[] {
  const exactOutputIds = new Set<string>(selectedOutputIdsV1(variant));
  const seen = new Set<string>();
  const validated = outputIds.map((outputId) => {
    if (!exactOutputIds.has(outputId)) {
      throw new Error(
        `Selected ${variant.label} presentation output ${outputId} is unavailable`,
      );
    }
    if (seen.has(outputId)) {
      throw new Error(
        `Selected ${variant.label} presentation output ${outputId} is duplicated`,
      );
    }
    seen.add(outputId);
    return outputId as SelectedOutputIdV1;
  });
  return Object.freeze(validated);
}

function selectedFrameFromValuesV1(input: Readonly<{
  modelId: SelectedExactModelVariantV1["modelId"];
  runtimeSessionId: string;
  scenarioId: string;
  inputEpoch: number;
  acceptedRevision: number;
  acceptedTimeSec: number;
  values: Readonly<
    Record<string, SelectedOutputValueV1>
  >;
}>): StudioSimulationFrameV2 {
  const outputs = Object.fromEntries(
    Object.values(input.values).map((value) => [
      value.outputId,
      Object.freeze({
        outputId: value.outputId,
        value: portableSelectedOutputScalarV1(value.value),
        availability: value.availability,
        quality: value.quality,
      }),
    ]),
  );
  return Object.freeze({
    modelId: input.modelId,
    runtimeSessionId: input.runtimeSessionId,
    scenarioId: input.scenarioId,
    inputEpoch: input.inputEpoch,
    acceptedRevision: input.acceptedRevision,
    acceptedTimeSec: input.acceptedTimeSec,
    outputs: Object.freeze(outputs),
  });
}

function portableSelectedOutputScalarV1(value: number | null): number | null {
  return Object.is(value, -0) ? 0 : value;
}

function selectedOutputStateCodeV1(
  output: SelectedOutputValueV1,
): number {
  const availability = output.availability === "available" ? 0 : 3;
  const quality = output.quality === "authoritative-state"
    ? 0
    : output.quality === "accepted-derived"
      ? 1
      : 2;
  return availability + quality;
}

function assertSelectedModelV1(
  model: ModelContractV2,
  variant: SelectedExactModelVariantV1,
): void {
  if (
    model.modelId !== variant.modelId
    || model.fixtureSchemaId
      !== MAIN_WIRE_INTEGRATED_STUDIO_SELECTED_AORTIC_OUTFLOW_FIXTURE_SCHEMA_ID_V1
    || model.checkpointCodecId !== variant.checkpointCodecId
    || model.snapshotGateId !== STUDIO_COMMON_SNAPSHOT_ADMISSION_ID_V1
  ) {
    throw new Error("Selected Standard66 exact model contract mismatch");
  }
}

function assertSelectedRuntimeContextV1(
  context: Readonly<{ scenarioId: string; modelId: string }>,
  variant: SelectedExactModelVariantV1,
): void {
  if (context.modelId !== variant.modelId) {
    throw new Error("Selected Standard66 fixture runtime modelId mismatch");
  }
  requiredSelectedIdV1(context.scenarioId, "scenarioId");
}

function assertSelectedExecutionPlanUpdateScheduleV1(
  schedule: BoundExecutionPlanUpdateScheduleV1,
): BoundExecutionPlanUpdateGroupDispatchV1 {
  const [group] = schedule.groups;
  if (
    schedule.definitionId !== SELECTED_EXECUTION_PLAN_DESCRIPTOR_V1.definitionId
    || schedule.policyId !== SELECTED_EXECUTION_PLAN_DESCRIPTOR_V1.policyId
    || schedule.baseTickSec !== MAIN_WIRE_NUMERICAL_BASE_TICK_SEC_V1
    || schedule.presentationPeriodTicks
      !== MAIN_WIRE_NUMERICAL_PRESENTATION_PERIOD_TICKS_V1
    || schedule.presentationStepSec !== SELECTED_PRESENTATION_DT_SEC_V1
    || schedule.groups.length !== 1
    || group === undefined
    || group.updateGroupId
      !== MAIN_WIRE_COUPLED_HEMODYNAMICS_UPDATE_GROUP_ID_V1
    || group.ordinal !== 0
    || group.periodTicks !== 1
    || group.phaseTicks !== 0
    || group.effectiveStepSec !== MAIN_WIRE_NUMERICAL_BASE_TICK_SEC_V1
    || group.integration !== "fixed-step-backward-euler"
    || group.solveGroupId !== MAIN_WIRE_COUPLED_HEMODYNAMICS_SOLVE_GROUP_ID_V1
    || group.solveGroupIndex !== 0
    || group.systemKernelId !== MAIN_WIRE_FIVE_WALL_COUPLED_SYSTEM_KERNEL_V1_ID
  ) {
    throw new Error("Selected Standard66 execution-plan update schedule drifted");
  }
  return group;
}

function requiredSelectedIdV1(value: string, label: string): void {
  if (!/^[A-Za-z0-9][A-Za-z0-9._:/@+-]{0,255}$/.test(value)) {
    throw new Error(`Selected Standard66 ${label} is invalid`);
  }
}

function selectedAdvanceFailureMessageV1(
  advance: Exclude<
    MainWireFlatModelOwnedProjectionAdvanceV1,
    { status: "advanced" }
  >,
): string {
  return advance.status === "failed"
    ? `Selected Standard66 presentation step failed: ${advance.reason}: ${advance.message}`
    : "Selected Standard66 presentation step did not advance";
}
