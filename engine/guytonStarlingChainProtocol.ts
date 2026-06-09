import type { RetargetTBVStatus } from "@/engine/ModelCore";
import type { CoreRuntimeParams, SimMetrics, SimObservables, SimulationHealth } from "@/engine/protocol";
import type { SettleStatus } from "@/engine/settling";
import type { SerializedModelState } from "@/engine/stateContract";

export type GuytonWorkerCoreSource = "cold" | "warm-retarget" | "warm-retarget-fallback";

export type GuytonWorkerSettledRun = {
  settle: SettleStatus;
  metrics: SimMetrics;
  observables: SimObservables;
  health: SimulationHealth;
  state: SerializedModelState;
  targetVolumeMl: number;
  wallMs: number;
  source: GuytonWorkerCoreSource;
  retarget?: RetargetTBVStatus;
  retargetFallback: boolean;
};

export type GuytonChainId = "positive" | "negative";

export type GuytonChainWorkerRequest = {
  type: "solve-chain";
  chainId: GuytonChainId;
  requestId: string;
  signature: string;
  instanceId: string;
  params: CoreRuntimeParams;
  targetVolumeMl: number;
  baselineState: SerializedModelState;
  chainDeltas: number[];
};

export type GuytonChainRunResult = {
  deltaVolumeMl: number;
  run: GuytonWorkerSettledRun;
};

export type GuytonChainWorkerResponse = {
  type: "chain-result";
  chainId: GuytonChainId;
  requestId: string;
  signature: string;
  instanceId: string;
  runs: GuytonChainRunResult[];
  chainMs: number;
  retargetFallbackCount: number;
  error?: string;
};

export type GuytonChainWorkerProgress = {
  type: "chain-progress";
  chainId: GuytonChainId;
  requestId: string;
  signature: string;
  instanceId: string;
  result: GuytonChainRunResult;
  completedInChain: number;
  totalInChain: number;
};

export type GuytonChainWorkerMessage = GuytonChainWorkerResponse | GuytonChainWorkerProgress;
