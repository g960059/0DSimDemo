import type {
  CoreRuntimeParams,
  SimMetrics,
  SimObservables,
  SimSample,
  SimulationHealth,
} from "@/engine/protocol";
import type { SettleStatus } from "@/engine/settling";
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
  | { type: "configure"; dt: number; sampleHz: number }
  | { type: "setInstances"; generation: number; instances: SimInstance[] }
  | { type: "resetInstances"; generation: number; ids: string[] }
  | { type: "setInstanceVolume"; generation: number; id: string; volume: number }
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
    }
  | {
      type: "error";
      message: string;
      stack?: string;
    };
