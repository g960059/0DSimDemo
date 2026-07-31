import type {
  ExperimentDraftCapturePortV2,
  ExperimentSnapshotGatePortV2,
} from "./authoring";
import type {
  ModelIdV2,
} from "./ids";
import type {
  ModelContractV2,
  RegisteredModelCaptureAdapterV2,
} from "./model";
import type {
  StudioModelFixtureAdapterV2,
} from "./runtime";
import type {
  RegisteredModelSimulationAdapterV2,
} from "./simulation";

export type RegisteredModelDraftCaptureAdapterV2 =
  ExperimentDraftCapturePortV2 & Readonly<{
    modelId: ModelIdV2;
    fixtureSchemaId: string;
    checkpointCodecId: string;
  }>;

export type RegisteredModelSnapshotGateAdapterV2 =
  ExperimentSnapshotGatePortV2 & Readonly<{
    modelId: ModelIdV2;
    snapshotGateId: string;
  }>;

/** Executable functions admitted atomically with one exact package artifact. */
export type RegisteredModelExecutableBundleV2 = Readonly<{
  modelId: ModelIdV2;
  fixtureSchemaId: string;
  checkpointCodecId: string;
  snapshotGateId: string;
  captureAdapter: RegisteredModelCaptureAdapterV2;
  draftCapture: RegisteredModelDraftCaptureAdapterV2;
  snapshotGate: RegisteredModelSnapshotGateAdapterV2;
  fixtureAdapter: StudioModelFixtureAdapterV2;
  simulationAdapter: RegisteredModelSimulationAdapterV2;
}>;

/** Hash-free exact runtime projection. Artifact bytes and digest stay private. */
export type ResolvedExactModelRuntimeV2 = Readonly<{
  contract: ModelContractV2;
  captureAdapter: RegisteredModelCaptureAdapterV2;
  draftCapture: RegisteredModelDraftCaptureAdapterV2;
  snapshotGate: RegisteredModelSnapshotGateAdapterV2;
  fixtureAdapter: StudioModelFixtureAdapterV2;
  simulationAdapter: RegisteredModelSimulationAdapterV2;
}>;

export interface ExactModelRuntimeResolverPortV2 {
  resolveExactRuntime(modelId: ModelIdV2): ResolvedExactModelRuntimeV2;
}
