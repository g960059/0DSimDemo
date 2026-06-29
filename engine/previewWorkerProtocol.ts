import type {
  CoreRuntimeParams,
  SimMetrics,
  SimObservables,
  SimSample,
  SimulationHealth,
} from "@/engine/protocol";
import type { ModelCoreExperimentalActiveSourceProviderRuntimeState } from "@/engine/ModelCore";
import type { ModelCoreRuntimeActiveSourceMode } from "@/engine/myocardium/runtimeActiveSource";
import type { SettleStatus } from "@/engine/settling";
import type { SerializedModelState } from "@/engine/stateContract";
import type { SimInstance } from "@/types";

export type PreviewCoreSnapshot = {
  t: number;
  p: CoreRuntimeParams;
  metrics: SimMetrics;
  health: SimulationHealth;
  observables: SimObservables;
  settleStatus?: SettleStatus;
};

export type PreviewWorkerRequest =
  | { type: "configure"; dt: number; sampleHz: number; runtimeActiveSourceMode: ModelCoreRuntimeActiveSourceMode }
  | { type: "setInstances"; generation: number; instances: SimInstance[]; runtimeActiveSourceMode: ModelCoreRuntimeActiveSourceMode }
  | { type: "resetInstances"; generation: number; ids: string[]; runtimeActiveSourceMode: ModelCoreRuntimeActiveSourceMode }
  | { type: "setInstanceVolume"; generation: number; id: string; volume: number }
  | {
      type: "promoteTransitionSteady";
      generation: number;
      instance: SimInstance;
      state: SerializedModelState;
      runtimeActiveSourceMode: ModelCoreRuntimeActiveSourceMode;
      experimentalActiveProviderStates?: ModelCoreExperimentalActiveSourceProviderRuntimeState;
    }
  | { type: "tick"; generation: number; requestId: number; now: number; simSeconds: number };

export type PreviewWorkerFrameInstance = {
  id: string;
  t: number;
  samples: SimSample[];
  settling: boolean;
  snapshot?: PreviewCoreSnapshot;
};

export type PreviewWorkerFramePerf = {
  coreWallMs: number;
  samples: number;
  instanceCount: number;
  settlingCount: number;
};

export type PreviewWorkerResponse =
  | {
      type: "frame";
      generation: number;
      requestId: number;
      now: number;
      instances: PreviewWorkerFrameInstance[];
      perf: PreviewWorkerFramePerf;
    }
  | {
      type: "settleProgress";
      generation: number;
      id: string;
      snapshot: PreviewCoreSnapshot;
      actualSeconds: number;
      settling: boolean;
      samples?: SimSample[];
    }
  | {
      type: "error";
      message: string;
      stack?: string;
    };
