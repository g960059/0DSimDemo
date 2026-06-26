export type ModelProvenance = {
  equationsVersion: string;
  parameterSetId: string;
  parameterSetSha256: string;
  activationSchedulerFamilyId: typeof ACTIVATION_SCHEDULER_FAMILY_ID;
  activationModelId: string;
  calciumModelId: string;
  homogenizationModelId: string;
  mechanicsModelId: string;
  generalizedForceModelId: string;
  calibrationDatasetIds: readonly string[];
  validationTargetPackIds: readonly string[];
  calibrationCodeVersion: string;
  solverVersion: string;
  stateSchemaVersion: number;
  temperatureModelId: "fixed-310.15K-v1" | string;
  decisionBaselineId: string;
  sourceReferences: readonly string[];
  modelLimitations: readonly string[];
};

export type ModelInstancePath = {
  chamber?: "LV" | "RV" | "LA" | "RA";
  wallId?: string;
  regionId?: string;
  patchId?: string;
  moduleId: string;
  instanceId: string;
};

export const ACTIVATION_SCHEDULER_FAMILY_ID = "activation-scheduler-v1";
export const PERIODIC_ACTIVATION_SCHEDULER_V1_ID = "periodic-activation-scheduler-v1";

export type StateBlockDescriptor = {
  blockId: string;
  owner: "activation" | "calcium" | "myofilament" | "mechanics";
  instance: ModelInstancePath;
  labels: readonly string[];
  size: number;
  equationsVersion: string;
};

export type StateBlockSlice = {
  descriptor: StateBlockDescriptor;
  offset: number;
  size: number;
};

export type DynamicStateLayout = {
  blocks: readonly StateBlockSlice[];
  size: number;
  layoutHash: string;
};

export type ActivationTargetId = string;

export type ActivationEventInput = {
  targetId: ActivationTargetId;
  activationEventId: number;
  timeSinceActivationSec: number;
  cycleLengthSec: number;
  activationStrength01: number;
};

export type ActivationSchedulerOutput = {
  events: readonly ActivationEventInput[];
  rhythmCycleId: number;
};

export interface ActivationScheduler<Params> {
  readonly id: typeof PERIODIC_ACTIVATION_SCHEDULER_V1_ID | string;
  reset(timeSec: number, params: Params): void;
  advance(previousTimeSec: number, nextTimeSec: number, params: Params): ActivationSchedulerOutput;
}

export type MyocardiumInstanceSpec = {
  path: ModelInstancePath;

  activation: {
    schedulerFamilyId: typeof ACTIVATION_SCHEDULER_FAMILY_ID;
    schedulerModelId: typeof PERIODIC_ACTIVATION_SCHEDULER_V1_ID;
    parameterSetId: string;
  };

  calcium?: {
    modelId: "prescribed-calcium-transient-v1";
    parameterSetId: string;
  };

  myofilament?: {
    modelId: "land2017-myofilament-v1";
    parameterSetId: string;
  };

  homogenization?: {
    modelId: string;
    parameterSetId: string;
  };

  kinematics: {
    modelId: string;
    parameterSetId: string;
  };

  passiveMaterial: {
    modelId: "passive-exponential-energy-v1";
    parameterSetId: string;
  };

  generalizedForceMapper: {
    modelId: "virtual-power-generalized-force-v1";
  };

  coupling: {
    modelId: "active-stiffness-partitioned-v1" | "atrial-elastance-bridge-v1";
    referenceModelId?: "local-monolithic-be-v1" | "local-monolithic-sdirk2-v1";
  };

  temperatureModelId: "fixed-310.15K-v1";
};

export const MYOCARDIUM_PHASE1A_CONTRACT_SCOPE = {
  phase: "Phase 1A",
  purpose: "standalone myocardium activation/state/provenance contracts",
  modelCoreIntegration: false,
  legacyRuntimeSchemaMigration: false,
  oldSnapshotLoaderRejection: false,
  deferredSpecSection: "7.2",
  deferredSchemaBreakingItems: ["MODEL_STATE_SCHEMA_VERSION", "old loader rejection"] as const,
} as const;
