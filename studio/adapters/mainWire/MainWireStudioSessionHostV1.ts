import type {
  MainWireScientificResearchControlTargetStateV0,
} from "@/engine/scientific/controls";
import type {
  HotPathIntegrityTierV1,
} from "@/engine/hotPathIntegrityTierV1";
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
import type {
  MAIN_WIRE_SCIENTIFIC_TRANSIENT_METRIC_INTEGRATION_POLICY_V1,
  MainWireScientificTransientMetricIntegrationResultV1,
} from "@/engine/scientific/metrics";
import type {
  SCIENTIFIC_TRANSIENT_RENDERER_RETENTION_POLICY_V1,
} from "@/engine/scientific/worker/scientificCommandProtocolV1";

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
  metricIntegration?:
    MainWireScientificTransientMetricIntegrationResultV1 | null;
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
    metricIntegrationPolicy?:
      typeof MAIN_WIRE_SCIENTIFIC_TRANSIENT_METRIC_INTEGRATION_POLICY_V1;
    rendererRetentionPolicy?:
      typeof SCIENTIFIC_TRANSIENT_RENDERER_RETENTION_POLICY_V1;
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

/**
 * Optional per-host request. Every field is optional and every implementation
 * may ignore it: a factory written as `() => host` stays assignable, and an
 * omitted field must select the conservative behaviour.
 */
export type MainWireStudioSessionHostRequestV1 = Readonly<{
  /**
   * Hot-path integrity tier the host's compute Worker should run. Omitted
   * means the full-invariant tier. See engine/hotPathIntegrityTierV1.ts.
   */
  integrityTier?: HotPathIntegrityTierV1;
  /**
   * Declared scheduling role. Omitted means an isolated Worker, preserving
   * the conservative behaviour for injected and non-product factories.
   */
  workerRole?:
    | "live-lane"
    | "strict-settlement"
    | "exact-signal-replay";
}>;

export type MainWireStudioSessionHostFactoryV1 =
  (request?: MainWireStudioSessionHostRequestV1) => MainWireStudioSessionHostV1;
