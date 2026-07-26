import type {
  MainWireScientificResearchControlTargetStateV0,
} from "@/engine/scientific/controls";
import type {
  MainWireScientificObservableFrameV1,
} from "@/engine/scientific/observables";
import type {
  MainWireScientificPeriodicBeatSummaryV1,
  MainWireScientificSessionExactCheckpointV4,
  MainWireScientificPeriodicSettlementStatusV1,
} from "@/engine/scientific/runtime";
import type {
  MainWireFiveWallPeriodicClassificationV1,
} from "@/engine/myocardium/experiments/MainWireFiveWallPeriodicClosureV1";

export type MainWireStudioAcceptedStateIdentityV1 = Readonly<{
  revision: number;
  acceptedTimeSec: number;
  totalBloodVolumeMl: number;
}>;

export type MainWireStudioHostedSessionV1 = Readonly<{
  hostId: string;
  sessionId: string;
  baseSessionInputSha256: string;
  controlState: MainWireScientificResearchControlTargetStateV0;
  parameterEpoch: number;
  stateIdentity: MainWireStudioAcceptedStateIdentityV1;
  observableFrame: MainWireScientificObservableFrameV1;
}>;

export type MainWireStudioTransientChunkV1 = Readonly<{
  session: MainWireStudioHostedSessionV1;
  observableFrames: readonly MainWireScientificObservableFrameV1[];
}>;

export type MainWireStudioPeriodicSettlementChunkV1 = Readonly<{
  session: MainWireStudioHostedSessionV1;
  status: MainWireScientificPeriodicSettlementStatusV1;
  periodicSteadyStateClaimed: boolean;
  period2OrbitSuspected: boolean;
  trackerStartedThisCall: boolean;
  beatCompletedThisCall: boolean;
  completedStepCountThisCall: number;
  completedBeatCount: number;
  anchorAcceptedTimeSec: number;
  anchorPhase01: number;
  periodicity: MainWireFiveWallPeriodicClassificationV1;
  retainedBeatClosure: readonly MainWireScientificPeriodicBeatSummaryV1[];
}>;

export type MainWireStudioCheckpointReceiptV1 = Readonly<{
  session: MainWireStudioHostedSessionV1;
  checkpointV4: MainWireScientificSessionExactCheckpointV4;
}>;

/**
 * One exclusive scientific execution host. The browser implementation owns
 * one Worker/kernel, so live and strict lanes are concurrent only when they
 * hold different host instances.
 */
export interface MainWireStudioSessionHostV1 {
  readonly hostId: string;
  /** Number of Worker requests issued by this exclusive host identity. */
  readonly requestCount: number;

  restoreV4(input: Readonly<{
    sessionId: string;
    resolvedSessionInput: unknown;
    checkpointV4: MainWireScientificSessionExactCheckpointV4;
  }>): Promise<MainWireStudioHostedSessionV1>;

  forkControl(input: Readonly<{
    source: MainWireStudioHostedSessionV1;
    targetSessionId: string;
    targetControlState: MainWireScientificResearchControlTargetStateV0;
  }>): Promise<MainWireStudioHostedSessionV1>;

  runTransient(input: Readonly<{
    session: MainWireStudioHostedSessionV1;
    dtSec: number;
    stepCount: number;
    observationStride: number;
  }>): Promise<MainWireStudioTransientChunkV1>;

  settlePeriodic(
    session: MainWireStudioHostedSessionV1,
  ): Promise<MainWireStudioPeriodicSettlementChunkV1>;

  checkpointV4(
    session: MainWireStudioHostedSessionV1,
  ): Promise<MainWireStudioCheckpointReceiptV1>;

  dispose(sessionId: string): Promise<void>;

  terminate(): void;
}

export type MainWireStudioSessionHostFactoryV1 =
  () => MainWireStudioSessionHostV1;
