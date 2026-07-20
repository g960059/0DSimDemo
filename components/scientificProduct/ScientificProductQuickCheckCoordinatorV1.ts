import type {
  MainWireFiveWallPeriodicClassificationV1,
} from "@/engine/myocardium/experiments/MainWireFiveWallPeriodicClosureV1";
import type {
  MainWireScientificResearchControlTargetStateV0,
} from "@/engine/scientific/controls/MainWireScientificResearchControlTargetStateV0";
import {
  sameSimulationReleaseRef,
  SHA256_HEX_PATTERN,
  type SimulationReleaseRef,
} from "@/engine/scientific/release";
import type {
  MainWireScientificObservableFrameV1,
} from "@/engine/scientific/observables";
import {
  SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
  type ScientificCommandV1,
  type ScientificResearchControlContextV0,
} from "@/engine/scientific/worker/scientificCommandProtocolV1";
import type {
  MainWireScientificWorkerClientStatusV1,
  MainWireScientificWorkerResponseV1,
} from "@/engine/scientificBrowser/MainWireScientificWorkerClientV1";
import {
  SCIENTIFIC_WORKBENCH_TERMINAL_CYCLE_V1,
  assembleScientificWorkbenchResearchTerminalCycleV1,
  assembleScientificWorkbenchTerminalCycleV1,
  type ScientificWorkbenchResearchTerminalCycleV1,
  type ScientificWorkbenchTerminalCycleV1,
} from "@/components/scientificWorkbench/scientificWorkbenchTerminalCycleV1";
import type {
  ScientificProductCaseV1,
} from "./scientificProductCaseCatalogV1";

export const SCIENTIFIC_PRODUCT_QUICK_CHECK_COORDINATOR_V1_ID =
  "scientific-product-quick-check-coordinator-v1" as const;
export const SCIENTIFIC_PRODUCT_QUICK_CHECK_PROVENANCE_V1 =
  "independent-case-source-hidden-period1-quick-check" as const;

export type ScientificProductQuickCheckClientV1 = Readonly<{
  status: MainWireScientificWorkerClientStatusV1;
  request: (
    command: ScientificCommandV1,
  ) => Promise<MainWireScientificWorkerResponseV1>;
  terminate: () => void;
}>;

export type ScientificProductQuickCheckBootstrapSourceV1 = Readonly<{
  sessionId: string;
  context: ScientificResearchControlContextV0;
}>;

export type ScientificProductQuickCheckRequestV1 = Readonly<{
  requestToken: string;
  targetControlState: MainWireScientificResearchControlTargetStateV0;
  visibleParameterEpoch: number;
  visibleControlStateSha256: string;
}>;

export type ScientificProductQuickCheckEvidenceV1 = Readonly<{
  coordinatorId: typeof SCIENTIFIC_PRODUCT_QUICK_CHECK_COORDINATOR_V1_ID;
  provenance: typeof SCIENTIFIC_PRODUCT_QUICK_CHECK_PROVENANCE_V1;
  targetControlStateSha256: string;
  parameterEpoch: number;
  releaseRef: SimulationReleaseRef;
  period1BoundaryFrame: MainWireScientificObservableFrameV1;
  finalObservableFrame: MainWireScientificObservableFrameV1;
  terminalCycle:
    | ScientificWorkbenchTerminalCycleV1
    | ScientificWorkbenchResearchTerminalCycleV1;
  periodicity: MainWireFiveWallPeriodicClassificationV1;
  completedBeatCount: number;
  periodicSteadyStateClaimed: true;
  period2OrbitSuspected: false;
  followingCompleteCycleCaptured: true;
  claim: Readonly<{
    quickPeriod1VerificationOnly: true;
    committedTargetSteadyStateDiagnosticsOnly: true;
    fullVerificationAndValidationClaimed: false;
    physiologyAcceptanceClaimed: false;
    timeStepRefinementClaimed: false;
    multiStartEvidenceClaimed: false;
  }>;
}>;

export type ScientificProductQuickCheckCompleteEventV1 = Readonly<{
  requestToken: string;
  visibleParameterEpoch: number;
  visibleControlStateSha256: string;
  evidence: ScientificProductQuickCheckEvidenceV1;
  cacheHit: boolean;
}>;

export type ScientificProductQuickCheckErrorPhaseV1 =
  | "request-validation"
  | "bootstrap"
  | "fork"
  | "settlement";

export type ScientificProductQuickCheckErrorEventV1 = Readonly<{
  requestToken: string;
  visibleParameterEpoch: number;
  visibleControlStateSha256: string;
  phase: ScientificProductQuickCheckErrorPhaseV1;
  message: string;
}>;

export type ScientificProductQuickCheckCoordinatorOptionsV1 = Readonly<{
  caseEntry: ScientificProductCaseV1;
  createClient: () => ScientificProductQuickCheckClientV1;
  loadBootstrapSource: (
    caseEntry: ScientificProductCaseV1,
    client: ScientificProductQuickCheckClientV1,
  ) => Promise<ScientificProductQuickCheckBootstrapSourceV1>;
  onComplete: (event: ScientificProductQuickCheckCompleteEventV1) => void;
  onError: (event: ScientificProductQuickCheckErrorEventV1) => void;
  maximumSettlementBeatCount?: number;
  maximumCacheEntries?: number;
}>;

type RequestRecordV1 = ScientificProductQuickCheckRequestV1 & Readonly<{
  generation: number;
  validationError: string | null;
}>;

type StableSourceV1 = ScientificProductQuickCheckBootstrapSourceV1;

type CandidateV1 = Readonly<{
  sessionId: string;
  context: ScientificResearchControlContextV0;
}>;

type QuickCheckPhaseErrorV1 = Error & Readonly<{
  phase: ScientificProductQuickCheckErrorPhaseV1;
}>;

const DEFAULT_MAXIMUM_SETTLEMENT_BEAT_COUNT_V1 = 32;
const DEFAULT_MAXIMUM_CACHE_ENTRIES_V1 = 8;
let coordinatorOrdinalV1 = 0;

/**
 * Runs only a hidden period-1 settlement check. It never owns visible frames
 * and deliberately does not start a hemodynamic analysis or Full V&V job.
 */
export class ScientificProductQuickCheckCoordinatorV1 {
  private readonly caseEntry: ScientificProductCaseV1;
  private readonly createClient:
    ScientificProductQuickCheckCoordinatorOptionsV1["createClient"];
  private readonly loadBootstrapSource:
    ScientificProductQuickCheckCoordinatorOptionsV1["loadBootstrapSource"];
  private readonly onComplete:
    ScientificProductQuickCheckCoordinatorOptionsV1["onComplete"];
  private readonly onError:
    ScientificProductQuickCheckCoordinatorOptionsV1["onError"];
  private readonly maximumSettlementBeatCount: number;
  private readonly maximumCacheEntries: number;
  private readonly coordinatorOrdinal = ++coordinatorOrdinalV1;
  private readonly cache = new Map<
    string,
    ScientificProductQuickCheckEvidenceV1
  >();

  private client: ScientificProductQuickCheckClientV1 | null = null;
  private stableSource: StableSourceV1 | null = null;
  private candidate: CandidateV1 | null = null;
  private latestRequest: RequestRecordV1 | null = null;
  private failedRequestGeneration: number | null = null;
  private requestGeneration = 0;
  private commandOrdinal = 0;
  private sessionOrdinal = 0;
  private driveRequested = false;
  private drivePromise: Promise<void> | null = null;
  private lastPublishedRequestToken: string | null = null;
  private disposed = false;

  constructor(options: ScientificProductQuickCheckCoordinatorOptionsV1) {
    this.caseEntry = options.caseEntry;
    this.createClient = options.createClient;
    this.loadBootstrapSource = options.loadBootstrapSource;
    this.onComplete = options.onComplete;
    this.onError = options.onError;
    this.maximumSettlementBeatCount = boundedPositiveIntegerV1(
      options.maximumSettlementBeatCount
        ?? DEFAULT_MAXIMUM_SETTLEMENT_BEAT_COUNT_V1,
      "maximumSettlementBeatCount",
    );
    this.maximumCacheEntries = boundedPositiveIntegerV1(
      options.maximumCacheEntries ?? DEFAULT_MAXIMUM_CACHE_ENTRIES_V1,
      "maximumCacheEntries",
    );
  }

  requestLatest(request: ScientificProductQuickCheckRequestV1): void {
    if (this.disposed) return;
    if (sameQuickCheckRequestV1(this.latestRequest, request)
        && this.failedRequestGeneration !== this.latestRequest?.generation) {
      return;
    }
    const validationError = validateRequestV1(request);
    const coalescedGeneration = this.latestRequest !== null
      && this.failedRequestGeneration !== this.latestRequest.generation
      && this.latestRequest.validationError === null
      && validationError === null
      && this.latestRequest.targetControlState.targetStateSha256
        === request.targetControlState.targetStateSha256
        ? this.latestRequest.generation
        : null;
    const generation = coalescedGeneration ?? ++this.requestGeneration;
    this.latestRequest = Object.freeze({
      ...request,
      generation,
      validationError,
    });
    this.failedRequestGeneration = null;
    this.lastPublishedRequestToken = null;
    this.requestDrive();
  }

  async dispose(): Promise<void> {
    if (this.disposed) return;
    this.disposed = true;
    this.requestGeneration += 1;
    this.latestRequest = null;
    this.driveRequested = false;
    await this.drivePromise?.catch(() => undefined);
    const client = this.client;
    if (client !== null && client.status === "open") {
      const sessions = new Set<string>();
      if (this.candidate !== null) sessions.add(this.candidate.sessionId);
      if (this.stableSource !== null) sessions.add(this.stableSource.sessionId);
      for (const sessionId of sessions) {
        await this.disposeSessionBestEffort(sessionId);
      }
    }
    this.cache.clear();
    this.candidate = null;
    this.stableSource = null;
    client?.terminate();
    this.client = null;
  }

  private requestDrive(): void {
    if (this.disposed) return;
    this.driveRequested = true;
    if (this.drivePromise !== null) return;
    this.drivePromise = this.drive().catch(() => undefined).finally(() => {
      this.drivePromise = null;
      if (this.driveRequested && !this.disposed) this.requestDrive();
    });
  }

  private async drive(): Promise<void> {
    while (this.driveRequested && !this.disposed) {
      this.driveRequested = false;
      const request = this.latestRequest;
      if (request === null || this.failedRequestGeneration === request.generation) {
        return;
      }
      try {
        await this.reconcile(request);
      } catch (error) {
        await this.handleRequestFailure(request, error);
      }
    }
  }

  private async reconcile(request: RequestRecordV1): Promise<void> {
    if (request.validationError !== null) {
      this.reportError(request, "request-validation", request.validationError);
      this.failedRequestGeneration = request.generation;
      return;
    }
    const cached = this.cache.get(
      request.targetControlState.targetStateSha256,
    );
    if (cached !== undefined) {
      touchCacheEntryV1(
        this.cache,
        request.targetControlState.targetStateSha256,
        cached,
      );
      this.publishComplete(request, cached, true);
      return;
    }

    const source = await this.ensureStableSource(request);
    if (source === null || !this.requestIsCurrent(request)) return;

    if (source.context.controlState.targetStateSha256
        !== request.targetControlState.targetStateSha256) {
      await this.transitionStableSource(request, source);
      return;
    }
    const latest = this.latestRequest;
    const current = this.stableSource;
    if (latest === null
        || latest.validationError !== null
        || current === null
        || current.context.controlState.targetStateSha256
          !== latest.targetControlState.targetStateSha256) return;
    await this.settleAndPublish(latest, current);
  }

  private async ensureStableSource(
    request: RequestRecordV1,
  ): Promise<StableSourceV1 | null> {
    if (this.stableSource !== null) return this.stableSource;
    try {
      const client = this.ensureClient();
      const loaded = await this.loadBootstrapSource(this.caseEntry, client);
      assertBootstrapSourceV1(loaded);
      if (this.disposed) {
        await this.disposeSessionBestEffort(loaded.sessionId);
        return null;
      }
      this.stableSource = Object.freeze({
        sessionId: loaded.sessionId,
        context: loaded.context,
      });
      return this.stableSource;
    } catch (error) {
      await this.resetWorkerAfterFailure();
      if (!this.requestIsCurrent(request) || this.disposed) return null;
      this.reportError(request, "bootstrap", errorMessageV1(error));
      this.failedRequestGeneration = request.generation;
      return null;
    }
  }

  private async transitionStableSource(
    request: RequestRecordV1,
    source: StableSourceV1,
  ): Promise<void> {
    const client = this.requiredOpenClient();
    const targetSessionId = this.nextSessionId("target");
    let response: MainWireScientificWorkerResponseV1;
    try {
      response = await client.request(Object.freeze({
        protocolId: SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
        kind: "forkResearchControlSession" as const,
        requestId: this.nextRequestId("fork"),
        sessionId: targetSessionId,
        sourceSessionId: source.sessionId,
        expectedSource: Object.freeze({
          ...source.context.stateIdentity,
          controlStateSha256:
            source.context.controlState.targetStateSha256,
          parameterEpoch: source.context.parameterEpoch,
        }),
        targetControlState: request.targetControlState,
      }));
    } catch (error) {
      throw phaseErrorV1("fork", errorMessageV1(error));
    }
    if (!response.ok
        || response.commandKind !== "forkResearchControlSession"
        || response.payload.kind !== "researchControlSessionForked") {
      throw phaseErrorV1("fork", commandErrorMessageV1(response));
    }
    if (response.payload.sourceSessionId !== source.sessionId
        || response.payload.targetControlState.targetStateSha256
          !== request.targetControlState.targetStateSha256
        || response.payload.parameterEpoch
          !== source.context.parameterEpoch + 1) {
      throw phaseErrorV1("fork", "hidden Quick Check fork identity mismatch");
    }
    const candidate: CandidateV1 = Object.freeze({
      sessionId: targetSessionId,
      context: Object.freeze({
        stateIdentity: response.payload.targetStateIdentity,
        controlState: response.payload.targetControlState,
        parameterEpoch: response.payload.parameterEpoch,
      }),
    });
    this.candidate = candidate;
    if (!this.latestTargetMatches(request) || this.disposed) {
      await this.disposeCandidateStrict(candidate);
      return;
    }
    const settled = await this.settleCandidateToPeriod1(request, candidate);
    if (settled === null) return;
    const captured = await this.captureFollowingCycle(
      request,
      candidate.sessionId,
      settled,
    );
    if (captured === null) {
      if (this.candidate === candidate) {
        await this.disposeCandidateStrict(candidate);
      }
      return;
    }
    await this.disposeSessionStrict(source.sessionId);
    this.stableSource = Object.freeze({
      sessionId: candidate.sessionId,
      context: Object.freeze({
        stateIdentity: Object.freeze({
          revision: captured.finalObservableFrame.revision,
          acceptedTimeSec: captured.finalObservableFrame.acceptedTimeSec,
          totalBloodVolumeMl:
            candidate.context.stateIdentity.totalBloodVolumeMl,
        }),
        controlState: candidate.context.controlState,
        parameterEpoch: candidate.context.parameterEpoch,
      }),
    });
    this.candidate = null;
    this.cacheAndPublish(request, this.stableSource, captured, false);
  }

  private async settleAndPublish(
    request: RequestRecordV1,
    source: StableSourceV1,
  ): Promise<void> {
    const settled = await this.settleSessionToPeriod1(
      request,
      source.sessionId,
    );
    if (settled === null || !this.latestTargetMatches(request)) return;
    const captured = await this.captureFollowingCycle(
      request,
      source.sessionId,
      settled,
    );
    if (captured === null || !this.latestTargetMatches(request)) return;
    this.stableSource = Object.freeze({
      sessionId: source.sessionId,
      context: Object.freeze({
        stateIdentity: Object.freeze({
          revision: captured.finalObservableFrame.revision,
          acceptedTimeSec: captured.finalObservableFrame.acceptedTimeSec,
          totalBloodVolumeMl: source.context.stateIdentity.totalBloodVolumeMl,
        }),
        controlState: source.context.controlState,
        parameterEpoch: source.context.parameterEpoch,
      }),
    });
    this.cacheAndPublish(request, this.stableSource, captured, false);
  }

  private async settleCandidateToPeriod1(
    request: RequestRecordV1,
    candidate: CandidateV1,
  ): Promise<SettlementEvidenceV1 | null> {
    const settled = await this.settleSessionToPeriod1(
      request,
      candidate.sessionId,
    );
    if (settled === null) {
      if (this.candidate === candidate) {
        await this.disposeCandidateStrict(candidate);
      }
      return null;
    }
    return settled;
  }

  private async settleSessionToPeriod1(
    request: RequestRecordV1,
    sessionId: string,
  ): Promise<SettlementEvidenceV1 | null> {
    for (
      let beatIndex = 0;
      beatIndex < this.maximumSettlementBeatCount;
      beatIndex += 1
    ) {
      let response: MainWireScientificWorkerResponseV1;
      try {
        response = await this.requiredOpenClient().request(Object.freeze({
          protocolId: SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
          kind: "settlePeriodic" as const,
          requestId: this.nextRequestId(`settle-${beatIndex + 1}`),
          sessionId,
        }));
      } catch (error) {
        throw phaseErrorV1("settlement", errorMessageV1(error));
      }
      if (!response.ok
          || response.commandKind !== "settlePeriodic"
          || response.payload.kind !== "periodic-settlement-progress") {
        throw phaseErrorV1("settlement", commandErrorMessageV1(response));
      }
      this.refreshStableSourceStateV1(
        sessionId,
        response.payload.finalObservableFrame,
      );
      if (!this.latestTargetMatches(request) || this.disposed) return null;
      if (response.payload.status === "period1-converged") {
        if (!response.payload.periodicSteadyStateClaimed
            || response.payload.period2OrbitSuspected
            || response.payload.periodicity.status !== "period1-converged") {
          throw phaseErrorV1(
            "settlement",
            "hidden Quick Check P1 response carried inconsistent evidence",
          );
        }
        return Object.freeze({
          releaseRef: response.releaseRef,
          period1BoundaryFrame: response.payload.finalObservableFrame,
          periodicity: response.payload.periodicity,
          completedBeatCount: response.payload.completedBeatCount,
        });
      }
      if (response.payload.status !== "tracking") {
        throw phaseErrorV1(
          "settlement",
          response.payload.status === "period2-suspect"
            ? "hidden Quick Check reached a period-2-suspect orbit"
            : "hidden Quick Check reached the bounded settlement cap without P1",
        );
      }
    }
    throw phaseErrorV1(
      "settlement",
      `hidden Quick Check exceeded ${this.maximumSettlementBeatCount} settlement calls`,
    );
  }

  private async captureFollowingCycle(
    request: RequestRecordV1,
    sessionId: string,
    settled: SettlementEvidenceV1,
  ): Promise<CapturedCycleEvidenceV1 | null> {
    const acceptedStepFrames: MainWireScientificObservableFrameV1[] = [];
    let finalObservableFrame = settled.period1BoundaryFrame;
    for (
      let commandIndex = 0;
      commandIndex < SCIENTIFIC_WORKBENCH_TERMINAL_CYCLE_V1.workerCommandCount;
      commandIndex += 1
    ) {
      let response: MainWireScientificWorkerResponseV1;
      try {
        response = await this.requiredOpenClient().request(Object.freeze({
          protocolId: SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
          kind: "runTransient" as const,
          requestId: this.nextRequestId(`capture-${commandIndex + 1}`),
          sessionId,
          dtSec: SCIENTIFIC_WORKBENCH_TERMINAL_CYCLE_V1.dtSec,
          stepCount:
            SCIENTIFIC_WORKBENCH_TERMINAL_CYCLE_V1.stepsPerWorkerCommand,
          observationStride:
            SCIENTIFIC_WORKBENCH_TERMINAL_CYCLE_V1.observationStride,
        }));
      } catch (error) {
        throw phaseErrorV1("settlement", errorMessageV1(error));
      }
      if (!response.ok
          || response.commandKind !== "runTransient"
          || response.payload.kind !== "transientCompleted"
          || response.payload.requestedStepCount
            !== SCIENTIFIC_WORKBENCH_TERMINAL_CYCLE_V1.stepsPerWorkerCommand
          || response.payload.completedStepCount
            !== SCIENTIFIC_WORKBENCH_TERMINAL_CYCLE_V1.stepsPerWorkerCommand
          || response.payload.observableFrames.length
            !== SCIENTIFIC_WORKBENCH_TERMINAL_CYCLE_V1.stepsPerWorkerCommand
          || response.payload.executionProtocol.dtSec
            !== SCIENTIFIC_WORKBENCH_TERMINAL_CYCLE_V1.dtSec
          || response.payload.executionProtocol.observationPolicy.stride
            !== SCIENTIFIC_WORKBENCH_TERMINAL_CYCLE_V1.observationStride) {
        throw phaseErrorV1(
          "settlement",
          `hidden Quick Check did not complete following-cycle chunk ${commandIndex + 1}`,
        );
      }
      if (!sameSimulationReleaseRef(response.releaseRef, settled.releaseRef)) {
        throw phaseErrorV1(
          "settlement",
          "hidden Quick Check following-cycle release identity changed",
        );
      }
      acceptedStepFrames.push(...response.payload.observableFrames);
      finalObservableFrame = response.payload.finalObservableFrame;
      this.refreshStableSourceStateV1(sessionId, finalObservableFrame);
      if (!this.latestTargetMatches(request) || this.disposed) return null;
    }

    let terminalCycle:
      | ScientificWorkbenchTerminalCycleV1
      | ScientificWorkbenchResearchTerminalCycleV1;
    try {
      terminalCycle = settled.period1BoundaryFrame.source
        === "exact-checkpoint-restore"
        ? assembleScientificWorkbenchTerminalCycleV1(
          settled.period1BoundaryFrame,
          acceptedStepFrames,
        )
        : assembleScientificWorkbenchResearchTerminalCycleV1(
          settled.period1BoundaryFrame,
          acceptedStepFrames,
        );
    } catch (error) {
      throw phaseErrorV1("settlement", errorMessageV1(error));
    }
    const validatedFinalFrame = terminalCycle.frames.at(-1)!;
    if (!sameFrameIdentityV1(validatedFinalFrame, finalObservableFrame)) {
      throw phaseErrorV1(
        "settlement",
        "hidden Quick Check following-cycle final frame does not match Worker state",
      );
    }
    return Object.freeze({
      ...settled,
      finalObservableFrame: validatedFinalFrame,
      terminalCycle,
    });
  }

  private cacheAndPublish(
    request: RequestRecordV1,
    source: StableSourceV1,
    settled: CapturedCycleEvidenceV1,
    cacheHit: boolean,
  ): void {
    const evidence = Object.freeze({
      coordinatorId: SCIENTIFIC_PRODUCT_QUICK_CHECK_COORDINATOR_V1_ID,
      provenance: SCIENTIFIC_PRODUCT_QUICK_CHECK_PROVENANCE_V1,
      targetControlStateSha256:
        source.context.controlState.targetStateSha256,
      parameterEpoch: source.context.parameterEpoch,
      releaseRef: Object.freeze({ ...settled.releaseRef }),
      period1BoundaryFrame: settled.period1BoundaryFrame,
      finalObservableFrame: settled.finalObservableFrame,
      terminalCycle: settled.terminalCycle,
      periodicity: settled.periodicity,
      completedBeatCount: settled.completedBeatCount,
      periodicSteadyStateClaimed: true as const,
      period2OrbitSuspected: false as const,
      followingCompleteCycleCaptured: true as const,
      claim: Object.freeze({
        quickPeriod1VerificationOnly: true as const,
        committedTargetSteadyStateDiagnosticsOnly: true as const,
        fullVerificationAndValidationClaimed: false as const,
        physiologyAcceptanceClaimed: false as const,
        timeStepRefinementClaimed: false as const,
        multiStartEvidenceClaimed: false as const,
      }),
    });
    addCacheEntryV1(
      this.cache,
      evidence.targetControlStateSha256,
      evidence,
      this.maximumCacheEntries,
    );
    this.publishComplete(request, evidence, cacheHit);
  }

  private publishComplete(
    request: RequestRecordV1,
    evidence: ScientificProductQuickCheckEvidenceV1,
    cacheHit: boolean,
  ): void {
    const latest = this.latestRequest;
    if (latest === null
        || latest.generation !== request.generation
        || !this.requestIsCurrent(request)
        || this.lastPublishedRequestToken === latest.requestToken) return;
    this.lastPublishedRequestToken = latest.requestToken;
    callSafelyV1(this.onComplete, Object.freeze({
      requestToken: latest.requestToken,
      visibleParameterEpoch: latest.visibleParameterEpoch,
      visibleControlStateSha256: latest.visibleControlStateSha256,
      evidence,
      cacheHit,
    }));
  }

  private async handleRequestFailure(
    request: RequestRecordV1,
    error: unknown,
  ): Promise<void> {
    await this.resetWorkerAfterFailure();
    if (!this.requestIsCurrent(request) || this.disposed) return;
    const phase = isPhaseErrorV1(error) ? error.phase : "settlement";
    this.reportError(request, phase, errorMessageV1(error));
    this.failedRequestGeneration = request.generation;
  }

  /**
   * A failed Worker command leaves both session state and request capacity
   * uncertain. Tear down the entire hidden Worker so the next committed target
   * bootstraps from a fresh client instead of inheriting a poisoned source.
   */
  private async resetWorkerAfterFailure(): Promise<void> {
    const client = this.client;
    if (client !== null && client.status === "open") {
      const sessions = new Set<string>();
      if (this.candidate !== null) sessions.add(this.candidate.sessionId);
      if (this.stableSource !== null) sessions.add(this.stableSource.sessionId);
      for (const sessionId of sessions) {
        await this.disposeSessionBestEffort(sessionId);
      }
    }
    this.candidate = null;
    this.stableSource = null;
    client?.terminate();
    if (this.client === client) this.client = null;
  }

  private reportError(
    request: RequestRecordV1,
    phase: ScientificProductQuickCheckErrorPhaseV1,
    message: string,
  ): void {
    const latest = this.latestRequest;
    if (
      latest === null
      || latest.generation !== request.generation
      || !this.requestIsCurrent(request)
      || this.disposed
    ) return;
    callSafelyV1(this.onError, Object.freeze({
      requestToken: latest.requestToken,
      visibleParameterEpoch: latest.visibleParameterEpoch,
      visibleControlStateSha256: latest.visibleControlStateSha256,
      phase,
      message,
    }));
  }

  private ensureClient(): ScientificProductQuickCheckClientV1 {
    if (this.client?.status === "open") return this.client;
    this.client?.terminate();
    const created = this.createClient();
    if (created.status !== "open") {
      created.terminate();
      throw new Error("hidden Quick Check Worker client did not open");
    }
    this.client = created;
    return created;
  }

  private requiredOpenClient(): ScientificProductQuickCheckClientV1 {
    if (this.client === null || this.client.status !== "open") {
      throw new Error("hidden Quick Check Worker client is unavailable");
    }
    return this.client;
  }

  private async disposeCandidateStrict(candidate: CandidateV1): Promise<void> {
    await this.disposeSessionStrict(candidate.sessionId);
    if (this.candidate === candidate) this.candidate = null;
  }

  private refreshStableSourceStateV1(
    sessionId: string,
    frame: MainWireScientificObservableFrameV1,
  ): void {
    const source = this.stableSource;
    if (source === null || source.sessionId !== sessionId) return;
    this.stableSource = Object.freeze({
      sessionId: source.sessionId,
      context: Object.freeze({
        stateIdentity: Object.freeze({
          revision: frame.revision,
          acceptedTimeSec: frame.acceptedTimeSec,
          totalBloodVolumeMl: source.context.stateIdentity.totalBloodVolumeMl,
        }),
        controlState: source.context.controlState,
        parameterEpoch: source.context.parameterEpoch,
      }),
    });
  }

  private async disposeCandidateBestEffort(
    candidate: CandidateV1,
  ): Promise<void> {
    await this.disposeSessionBestEffort(candidate.sessionId);
    if (this.candidate === candidate) this.candidate = null;
  }

  private async disposeSessionStrict(sessionId: string): Promise<void> {
    const response = await this.requiredOpenClient().request(Object.freeze({
      protocolId: SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
      kind: "disposeSession" as const,
      requestId: this.nextRequestId("dispose"),
      sessionId,
    }));
    if (!response.ok
        || response.commandKind !== "disposeSession"
        || response.payload.kind !== "sessionDisposed") {
      throw new Error(commandErrorMessageV1(response));
    }
  }

  private async disposeSessionBestEffort(sessionId: string): Promise<void> {
    if (this.client?.status !== "open") return;
    try {
      await this.disposeSessionStrict(sessionId);
    } catch {
      // A failed teardown cannot make stale evidence current.
    }
  }

  private requestIsCurrent(request: RequestRecordV1): boolean {
    return !this.disposed
      && this.latestRequest?.generation === request.generation;
  }

  private latestTargetMatches(request: RequestRecordV1): boolean {
    return this.requestIsCurrent(request)
      && this.latestRequest?.targetControlState.targetStateSha256
        === request.targetControlState.targetStateSha256;
  }

  private nextSessionId(label: string): string {
    this.sessionOrdinal += 1;
    return `quick-check-${this.coordinatorOrdinal}-${label}-${this.sessionOrdinal}`;
  }

  private nextRequestId(label: string): string {
    this.commandOrdinal += 1;
    return `quick-check-${this.coordinatorOrdinal}-${label}-${this.commandOrdinal}`;
  }
}

type SettlementEvidenceV1 = Readonly<{
  releaseRef: SimulationReleaseRef;
  period1BoundaryFrame: MainWireScientificObservableFrameV1;
  periodicity: MainWireFiveWallPeriodicClassificationV1;
  completedBeatCount: number;
}>;

type CapturedCycleEvidenceV1 = SettlementEvidenceV1 & Readonly<{
  finalObservableFrame: MainWireScientificObservableFrameV1;
  terminalCycle:
    | ScientificWorkbenchTerminalCycleV1
    | ScientificWorkbenchResearchTerminalCycleV1;
}>;

function validateRequestV1(
  request: ScientificProductQuickCheckRequestV1,
): string | null {
  if (request.requestToken.trim().length === 0) {
    return "Quick Check request token must be non-empty";
  }
  if (!Number.isSafeInteger(request.visibleParameterEpoch)
      || request.visibleParameterEpoch < 0) {
    return "Quick Check visible parameter epoch is invalid";
  }
  if (!SHA256_HEX_PATTERN.test(request.visibleControlStateSha256)
      || !SHA256_HEX_PATTERN.test(
        request.targetControlState.targetStateSha256,
      )) {
    return "Quick Check control identity is not a SHA-256 digest";
  }
  if (request.visibleControlStateSha256
      !== request.targetControlState.targetStateSha256) {
    return "Quick Check visible and target control identities differ";
  }
  return null;
}

function sameQuickCheckRequestV1(
  previous: RequestRecordV1 | null,
  next: ScientificProductQuickCheckRequestV1,
): boolean {
  return previous !== null
    && previous.requestToken === next.requestToken
    && previous.visibleParameterEpoch === next.visibleParameterEpoch
    && previous.visibleControlStateSha256 === next.visibleControlStateSha256
    && previous.targetControlState.targetStateSha256
      === next.targetControlState.targetStateSha256;
}

function sameFrameIdentityV1(
  left: MainWireScientificObservableFrameV1,
  right: MainWireScientificObservableFrameV1,
): boolean {
  return left.revision === right.revision
    && left.acceptedTimeSec === right.acceptedTimeSec
    && left.source === right.source
    && sameSimulationReleaseRef(left.releaseRef, right.releaseRef);
}

function assertBootstrapSourceV1(
  source: ScientificProductQuickCheckBootstrapSourceV1,
): void {
  if (source.sessionId.trim().length === 0) {
    throw new Error("hidden Quick Check bootstrap returned an empty session id");
  }
  if (!SHA256_HEX_PATTERN.test(
    source.context.controlState.targetStateSha256,
  )) throw new Error("hidden Quick Check bootstrap returned invalid controls");
  const state = source.context.stateIdentity;
  if (!Number.isSafeInteger(state.revision)
      || state.revision < 0
      || !Number.isFinite(state.acceptedTimeSec)
      || !Number.isFinite(state.totalBloodVolumeMl)
      || state.totalBloodVolumeMl <= 0
      || !Number.isSafeInteger(source.context.parameterEpoch)
      || source.context.parameterEpoch < 0) {
    throw new Error("hidden Quick Check bootstrap returned invalid state identity");
  }
}

function phaseErrorV1(
  phase: ScientificProductQuickCheckErrorPhaseV1,
  message: string,
): QuickCheckPhaseErrorV1 {
  return Object.assign(new Error(message), { phase });
}

function isPhaseErrorV1(error: unknown): error is QuickCheckPhaseErrorV1 {
  return error instanceof Error
    && "phase" in error
    && typeof error.phase === "string";
}

function commandErrorMessageV1(
  response: MainWireScientificWorkerResponseV1,
): string {
  return response.ok
    ? `unexpected ${response.commandKind} response payload`
    : `${response.error.code}: ${response.error.message}`;
}

function boundedPositiveIntegerV1(value: number, label: string): number {
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new Error(`${label} must be a positive safe integer`);
  }
  return value;
}

function addCacheEntryV1(
  cache: Map<string, ScientificProductQuickCheckEvidenceV1>,
  key: string,
  value: ScientificProductQuickCheckEvidenceV1,
  maximumEntries: number,
): void {
  touchCacheEntryV1(cache, key, value);
  while (cache.size > maximumEntries) {
    const oldest = cache.keys().next().value as string | undefined;
    if (oldest === undefined) break;
    cache.delete(oldest);
  }
}

function touchCacheEntryV1(
  cache: Map<string, ScientificProductQuickCheckEvidenceV1>,
  key: string,
  value: ScientificProductQuickCheckEvidenceV1,
): void {
  cache.delete(key);
  cache.set(key, value);
}

function errorMessageV1(error: unknown): string {
  return error instanceof Error ? error.message : "hidden Quick Check failed";
}

function callSafelyV1<T>(callback: (value: T) => void, value: T): void {
  try {
    callback(value);
  } catch {
    // Consumer presentation errors must not mutate the hidden Worker lifecycle.
  }
}
