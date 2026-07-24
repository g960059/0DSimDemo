import React from "react";

import type {
  MainWireScientificWorkspaceDocumentV1,
} from "@/engine/scientific/documents";
import {
  MAIN_WIRE_SCIENTIFIC_OBSERVABLE_CATALOG_V1,
  MAIN_WIRE_SCIENTIFIC_OBSERVABLE_FRAME_V1_ID,
  MAIN_WIRE_SCIENTIFIC_OBSERVABLE_REGISTRY_V1_ID,
  MAIN_WIRE_SCIENTIFIC_OBSERVABLE_REGISTRY_V1_SCHEMA_VERSION,
  type MainWireScientificObservableFrameV1,
} from "@/engine/scientific/observables";
import {
  MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_VALUE_DOMAINS_V0,
  MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_SCALE_VALUES_V0,
  type MainWireScientificResearchControlIdV0,
  type MainWireScientificResearchControlScaleV0,
} from "@/engine/scientific/controls/MainWireScientificResearchControlCatalogV0";
import {
  createMainWireScientificResearchControlTargetStateV0,
  type MainWireScientificResearchControlTargetStateV0,
} from "@/engine/scientific/controls/MainWireScientificResearchControlTargetStateV0";
import {
  sameSimulationReleaseRef,
} from "@/engine/scientific/release";
import {
  SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
  type ScientificResearchControlContextV0,
} from "@/engine/scientific/worker";
import type {
  MainWireScientificWorkerClientV1,
  MainWireScientificWorkerResponseV1,
} from "@/engine/scientificBrowser";
import {
  MAIN_WIRE_SCIENTIFIC_BROWSER_RUNTIME_LIMITS_V1,
} from "@/engine/scientificBrowser";

import { ScientificWorkspaceRendererV1 } from "./ScientificWorkspaceRendererV1";
import {
  assertScientificWorkbenchResearchSettlementProgressV1,
} from "./scientificWorkbenchResearchCycleV1";
import {
  SCIENTIFIC_WORKBENCH_TERMINAL_CYCLE_V1,
  assembleScientificWorkbenchResearchTerminalCycleV1,
} from "./scientificWorkbenchTerminalCycleV1";
import type {
  ScientificWorkbenchSurfaceV1,
} from "./ScientificWorkbenchPageV1";
import {
  createScientificWorkbenchResearchControlStoreV0,
  useScientificWorkbenchResearchControlSnapshotV0,
  type ScientificWorkbenchResearchControlCandidateV0,
  type ScientificWorkbenchResearchControlDraftV0,
  type ScientificWorkbenchResearchControlOwnerActionsV0,
  type ScientificWorkbenchResearchControlSnapshotInputV0,
  type ScientificWorkbenchResearchControlSnapshotV0,
  type ScientificWorkbenchResearchControlSourceV0,
  type ScientificWorkbenchResearchControlStoreV0,
  type ScientificWorkbenchResearchTransitionModeV0,
  type ScientificWorkbenchResearchTransitionPhaseV0,
} from "./ScientificWorkbenchResearchControlStoreV0";

export type {
  ScientificWorkbenchResearchControlActionsV0,
  ScientificWorkbenchResearchControlCandidateV0,
  ScientificWorkbenchResearchControlDraftV0,
  ScientificWorkbenchResearchControlProvenanceV0,
  ScientificWorkbenchResearchControlSnapshotV0,
  ScientificWorkbenchResearchControlSourceV0,
  ScientificWorkbenchResearchControlStoreV0,
  ScientificWorkbenchResearchTransitionModeV0,
  ScientificWorkbenchResearchTransitionPhaseV0,
} from "./ScientificWorkbenchResearchControlStoreV0";
export {
  createScientificWorkbenchResearchControlStoreV0,
  useScientificWorkbenchResearchControlFramesV0,
  useScientificWorkbenchResearchControlSnapshotV0,
} from "./ScientificWorkbenchResearchControlStoreV0";

export type ScientificWorkbenchResearchControlV0Props = Readonly<{
  client: MainWireScientificWorkerClientV1;
  workspaceDocument: MainWireScientificWorkspaceDocumentV1;
  initialSource: ScientificWorkbenchResearchControlSourceV0;
  store?: ScientificWorkbenchResearchControlStoreV0;
  renderController?: boolean;
  renderWorkspace?: boolean;
  surface?: ScientificWorkbenchSurfaceV1;
  onTransitionActivityChange?: (active: boolean) => void;
  /**
   * Product Workbench playback gate. This is intentionally separate from the
   * scientific session state: pausing retains the accepted candidate boundary
   * and merely stops requesting further transient chunks.
   */
  playbackRunning?: boolean;
  /**
   * Real-time pacing multiplier for accepted live-transition chunks. It never
   * changes dt, step count, or any scientific parameter.
   */
  playbackTimeScale?: number;
}>;

type CandidateV0 = ScientificWorkbenchResearchControlCandidateV0;

type TransitionViewV0 = Readonly<{
  phase: ScientificWorkbenchResearchTransitionPhaseV0;
  mode: ScientificWorkbenchResearchTransitionModeV0;
  source: ScientificWorkbenchResearchControlSourceV0;
  candidate: CandidateV0 | null;
  frames: readonly MainWireScientificObservableFrameV1[];
  targetControlStateSha256: string | null;
  liveTransitionOriginAcceptedTimeSec: number | null;
  inFlight: boolean;
  periodicStatus: string;
  completedBeatCount: number;
  capturedStepCount: number;
  sourceRetirementPending: boolean;
  remainingRegularRequestCount: number;
  message: string;
  errorMessage: string | null;
}>;

type ControlDraftV0 = ScientificWorkbenchResearchControlDraftV0;

type LiveIntentV0 = "running" | "paused" | "reset";

const LIVE_RENDER_INTERVAL_MS = 1_000 / 30;
export const SCIENTIFIC_WORKBENCH_LIVE_STEPS_PER_COMMAND_V0 =
  MAIN_WIRE_SCIENTIFIC_BROWSER_RUNTIME_LIMITS_V1
    .maximumTransientStepCountPerCommand;
const LIVE_SIMULATED_CHUNK_MS =
  SCIENTIFIC_WORKBENCH_TERMINAL_CYCLE_V1.dtSec
  * SCIENTIFIC_WORKBENCH_LIVE_STEPS_PER_COMMAND_V0
  * 1_000;
const MAXIMUM_STEADY_SETTLEMENT_BEAT_COUNT = 32;
/** Matches the maximum product Workbench waveform window. */
export const SCIENTIFIC_WORKBENCH_LIVE_HISTORY_WINDOW_SEC_V0 = 20 as const;
export const SCIENTIFIC_WORKBENCH_LIVE_HISTORY_FRAME_LIMIT_V0 =
  Math.round(
    SCIENTIFIC_WORKBENCH_LIVE_HISTORY_WINDOW_SEC_V0
      / SCIENTIFIC_WORKBENCH_TERMINAL_CYCLE_V1.dtSec,
  ) + 1;
export const SCIENTIFIC_WORKBENCH_REQUEST_CAPACITY_V0 =
  MAIN_WIRE_SCIENTIFIC_BROWSER_RUNTIME_LIMITS_V1
    .maximumRequestCountPerLifetime;
export const SCIENTIFIC_WORKBENCH_OFFICIAL_BOOTSTRAP_REQUEST_COUNT_V0 =
  2 + SCIENTIFIC_WORKBENCH_TERMINAL_CYCLE_V1.workerCommandCount;

let transitionSessionOrdinal = 0;

/**
 * Release-bound research controller. It accepts only the enumerated SVR/PVR
 * scales. A steady transition is computed on a hidden fork and promoted only
 * after P1 plus one validated following cycle. A live transition keeps its
 * source session and exact source plot so reset is lossless.
 */
export function ScientificWorkbenchResearchControlV0({
  client,
  workspaceDocument,
  initialSource,
  store,
  renderController = true,
  renderWorkspace = true,
  surface = "research",
  onTransitionActivityChange,
  playbackRunning = true,
  playbackTimeScale = 1,
}: ScientificWorkbenchResearchControlV0Props) {
  assertLivePlaybackTimeScaleV0(playbackTimeScale);
  const [ownedStore] = React.useState(() =>
    createScientificWorkbenchResearchControlStoreV0(
      initialSource,
      SCIENTIFIC_WORKBENCH_REQUEST_CAPACITY_V0
        - SCIENTIFIC_WORKBENCH_OFFICIAL_BOOTSTRAP_REQUEST_COUNT_V0,
    ));
  const controlStore = store ?? ownedStore;
  const initialView = React.useMemo<TransitionViewV0>(() => ({
    phase: "idle",
    mode: "live",
    source: initialSource,
    candidate: null,
    frames: initialSource.frames,
    targetControlStateSha256: null,
    liveTransitionOriginAcceptedTimeSec: null,
    inFlight: false,
    periodicStatus: "idle",
    completedBeatCount: 0,
    capturedStepCount: 0,
    sourceRetirementPending: false,
    remainingRegularRequestCount:
      SCIENTIFIC_WORKBENCH_REQUEST_CAPACITY_V0
      - SCIENTIFIC_WORKBENCH_OFFICIAL_BOOTSTRAP_REQUEST_COUNT_V0,
    message: "Choose a complete release-bound target and transition mode.",
    errorMessage: null,
  }), [initialSource]);
  const [view, setView] = React.useState(initialView);
  const viewRef = React.useRef(view);
  const [draft, setDraft] = React.useState<ControlDraftV0>(() =>
    draftFromContext(initialSource.context));
  const draftRef = React.useRef(draft);
  const replaceDraft = React.useCallback((next: ControlDraftV0): void => {
    const frozen = Object.freeze({ ...next });
    draftRef.current = frozen;
    setDraft(frozen);
  }, []);
  const patchDraft = React.useCallback((
    patch: Partial<ControlDraftV0>,
  ): ControlDraftV0 => {
    const next = Object.freeze({ ...draftRef.current, ...patch });
    draftRef.current = next;
    setDraft(next);
    return next;
  }, []);
  const mountedRef = React.useRef(true);
  const operationGenerationRef = React.useRef(0);
  const requestOrdinalRef = React.useRef(0);
  const consumedRequestCountRef = React.useRef(
    SCIENTIFIC_WORKBENCH_OFFICIAL_BOOTSTRAP_REQUEST_COUNT_V0,
  );
  const cancelSteadyRef = React.useRef(false);
  const liveIntentRef = React.useRef<LiveIntentV0>("paused");
  const visibilityAutoPausedRef = React.useRef(false);
  const playbackRunningRef = React.useRef(playbackRunning);
  const playbackTimeScaleRef = React.useRef(playbackTimeScale);
  const playbackResumePendingRef = React.useRef(false);
  const runLiveLoopRef = React.useRef<(
    generation: number,
    candidate: CandidateV0,
  ) => Promise<void>>(async () => undefined);
  const liveLoopActiveRef = React.useRef(false);
  const pendingLiveRetargetDraftRef = React.useRef<ControlDraftV0 | null>(null);
  const liveFramesRef = React.useRef<readonly MainWireScientificObservableFrameV1[]>(
    initialSource.frames,
  );
  const liveAnimationFrameRef = React.useRef<number | null>(null);
  const liveRenderTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const lastLiveRenderAtMsRef = React.useRef(0);

  const commitView = React.useCallback((next: TransitionViewV0): void => {
    viewRef.current = next;
    if (mountedRef.current) setView(next);
  }, []);

  const patchView = React.useCallback((patch: Partial<TransitionViewV0>): void => {
    commitView({ ...viewRef.current, ...patch });
  }, [commitView]);

  const nextRequestId = React.useCallback((
    sessionId: string,
    action: string,
  ): string => {
    requestOrdinalRef.current += 1;
    return `${sessionId}:control-v0:${action}:${requestOrdinalRef.current}`;
  }, []);

  const reserveControllerRequest = React.useCallback((
    recoveryCommand = false,
  ): void => {
    const reservation = reserveScientificWorkbenchRequestIdentityV0(
      consumedRequestCountRef.current,
      recoveryCommand,
    );
    consumedRequestCountRef.current = reservation.consumedRequestCount;
    patchView({
      remainingRegularRequestCount: reservation.remainingRegularRequestCount,
    });
  }, [patchView]);

  const disposeSession = React.useCallback(async (
    sessionId: string,
  ): Promise<void> => {
    // The transport reserves recovery capacity for dispose even after regular
    // command capacity is exhausted. Count it so no later regular command
    // overestimates the shared client lifetime budget.
    reserveControllerRequest(true);
    const response = await client.request({
      protocolId: SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
      kind: "disposeSession",
      requestId: nextRequestId(sessionId, "dispose"),
      sessionId,
    });
    if (
      !response.ok
      || response.commandKind !== "disposeSession"
      || response.payload.kind !== "sessionDisposed"
      || response.payload.disposedSessionId !== sessionId
    ) {
      throw commandFailure("disposeSession", response);
    }
  }, [client, nextRequestId, reserveControllerRequest]);

  const scheduleLiveRender = React.useCallback((force = false): void => {
    if (!mountedRef.current) return;
    if (force) {
      if (
        liveAnimationFrameRef.current !== null
        && typeof cancelAnimationFrame === "function"
      ) {
        cancelAnimationFrame(liveAnimationFrameRef.current);
      }
      if (liveRenderTimerRef.current !== null) {
        clearTimeout(liveRenderTimerRef.current);
      }
      liveAnimationFrameRef.current = null;
      liveRenderTimerRef.current = null;
      lastLiveRenderAtMsRef.current = monotonicNowMs();
      // A forced flush is a command-boundary contract, not an animation hint:
      // publish the final accepted frames before exposing `live-paused`.
      patchView({ frames: liveFramesRef.current });
      return;
    }
    const publish = (): void => {
      liveAnimationFrameRef.current = null;
      const now = monotonicNowMs();
      const remaining = LIVE_RENDER_INTERVAL_MS
        - (now - lastLiveRenderAtMsRef.current);
      if (remaining > 0) {
        if (liveRenderTimerRef.current !== null) {
          clearTimeout(liveRenderTimerRef.current);
        }
        liveRenderTimerRef.current = setTimeout(() => {
          liveRenderTimerRef.current = null;
          scheduleLiveRender(true);
        }, remaining);
        return;
      }
      lastLiveRenderAtMsRef.current = now;
      patchView({ frames: liveFramesRef.current });
    };
    if (liveAnimationFrameRef.current !== null) return;
    if (typeof requestAnimationFrame === "function") {
      liveAnimationFrameRef.current = requestAnimationFrame(publish);
    } else {
      publish();
    }
  }, [patchView]);

  const restoreSourceAfterCandidate = React.useCallback(async (
    candidate: CandidateV0,
    nextPhase: "idle" | "failed",
    message: string,
    errorMessage: string | null,
  ): Promise<void> => {
    try {
      await disposeSession(candidate.sessionId);
    } catch (error) {
      patchView({
        phase: "reload-required",
        inFlight: false,
        message: "The candidate could not be retired safely.",
        errorMessage: errorMessageOf(error),
      });
      return;
    }
    if (!mountedRef.current) return;
    const source = viewRef.current.source;
    pendingLiveRetargetDraftRef.current = null;
    liveFramesRef.current = source.frames;
    commitView({
      ...viewRef.current,
      phase: nextPhase,
      candidate: null,
      frames: source.frames,
      targetControlStateSha256: null,
      liveTransitionOriginAcceptedTimeSec: null,
      inFlight: false,
      periodicStatus: nextPhase === "idle" ? "idle" : "rejected",
      completedBeatCount: 0,
      capturedStepCount: 0,
      message,
      errorMessage,
    });
  }, [commitView, disposeSession, patchView]);

  const failTransition = React.useCallback(async (
    error: unknown,
    candidate: CandidateV0 | null,
  ): Promise<void> => {
    const message = errorMessageOf(error);
    if (client.status !== "open") {
      patchView({
        phase: "reload-required",
        inFlight: false,
        message: "The scientific Worker transport failed closed.",
        errorMessage: message,
      });
      return;
    }
    if (candidate !== null) {
      await restoreSourceAfterCandidate(
        candidate,
        "failed",
        "Candidate rejected; the exact source plot and session were retained.",
        message,
      );
      return;
    }
    patchView({
      phase: "failed",
      inFlight: false,
      message: "Transition did not start; the source is unchanged.",
      errorMessage: message,
    });
  }, [client, patchView, restoreSourceAfterCandidate]);

  const captureSteadyCycle = React.useCallback(async (
    generation: number,
    candidate: CandidateV0,
    period1Boundary: MainWireScientificObservableFrameV1,
  ): Promise<void> => {
    const acceptedStepFrames: MainWireScientificObservableFrameV1[] = [];
    patchView({
      phase: "steady-capturing",
      periodicStatus: "period1-converged",
      inFlight: false,
      message: "P1 confirmed. Capturing and validating the following cycle while the source plot remains visible.",
    });
    for (
      let index = 0;
      index < SCIENTIFIC_WORKBENCH_TERMINAL_CYCLE_V1.workerCommandCount;
      index += 1
    ) {
      if (
        generation !== operationGenerationRef.current
        || cancelSteadyRef.current
      ) {
        await restoreSourceAfterCandidate(
          candidate,
          "idle",
          "Steady transition cancelled at a command boundary; source retained.",
          null,
        );
        return;
      }
      patchView({ inFlight: true });
      reserveControllerRequest();
      const response = await client.request({
        protocolId: SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
        kind: "runTransient",
        requestId: nextRequestId(candidate.sessionId, `steady-capture-${index}`),
        sessionId: candidate.sessionId,
        dtSec: SCIENTIFIC_WORKBENCH_TERMINAL_CYCLE_V1.dtSec,
        stepCount: SCIENTIFIC_WORKBENCH_TERMINAL_CYCLE_V1.stepsPerWorkerCommand,
        observationStride:
          SCIENTIFIC_WORKBENCH_TERMINAL_CYCLE_V1.observationStride,
      });
      const frames = acceptedTransientChunk(response);
      acceptedStepFrames.push(...frames);
      patchView({
        inFlight: false,
        capturedStepCount: acceptedStepFrames.length,
      });
    }
    const terminalCycle = assembleScientificWorkbenchResearchTerminalCycleV1(
      period1Boundary,
      acceptedStepFrames,
    );
    if (
      generation !== operationGenerationRef.current
      || cancelSteadyRef.current
    ) {
      await restoreSourceAfterCandidate(
        candidate,
        "idle",
        "Steady transition cancelled before promotion; source retained.",
        null,
      );
      return;
    }

    const oldSource = viewRef.current.source;
    const finalFrame = terminalCycle.frames.at(-1)!;
    const promotedSource: ScientificWorkbenchResearchControlSourceV0 = Object.freeze({
      sessionId: candidate.sessionId,
      context: Object.freeze({
        stateIdentity: Object.freeze({
          revision: finalFrame.revision,
          acceptedTimeSec: finalFrame.acceptedTimeSec,
          totalBloodVolumeMl:
            candidate.context.stateIdentity.totalBloodVolumeMl,
        }),
        controlState: candidate.context.controlState,
        parameterEpoch: candidate.context.parameterEpoch,
      }),
      frames: terminalCycle.frames,
    });
    liveFramesRef.current = terminalCycle.frames;
    commitView({
      ...viewRef.current,
      phase: "idle",
      source: promotedSource,
      candidate: null,
      frames: terminalCycle.frames,
      targetControlStateSha256:
        candidate.context.controlState.targetStateSha256,
      liveTransitionOriginAcceptedTimeSec: null,
      inFlight: false,
      periodicStatus: "period1-converged-and-cycle-validated",
      capturedStepCount: acceptedStepFrames.length,
      sourceRetirementPending: true,
      message: "Validated P1 target promoted atomically. The previous source session is being retired.",
      errorMessage: null,
    });
    replaceDraft(draftFromContext(promotedSource.context));
    try {
      await disposeSession(oldSource.sessionId);
      patchView({
        sourceRetirementPending: false,
        message: "Validated P1 target promoted atomically. The previous source session was retired.",
      });
    } catch (error) {
      patchView({
        phase: "reload-required",
        sourceRetirementPending: false,
        message: "Target was promoted, but the previous source could not be retired safely.",
        errorMessage: errorMessageOf(error),
      });
    }
  }, [
    client,
    commitView,
    disposeSession,
    nextRequestId,
    patchView,
    replaceDraft,
    reserveControllerRequest,
    restoreSourceAfterCandidate,
  ]);

  const settleSteadyCandidate = React.useCallback(async (
    generation: number,
    candidate: CandidateV0,
  ): Promise<void> => {
    patchView({
      phase: "steady-settling",
      periodicStatus: "tracking",
      message: "Settling the hidden target. The source plot remains unchanged until P1 is validated.",
    });
    for (
      let callIndex = 0;
      callIndex < MAXIMUM_STEADY_SETTLEMENT_BEAT_COUNT;
      callIndex += 1
    ) {
      if (
        generation !== operationGenerationRef.current
        || cancelSteadyRef.current
      ) {
        await restoreSourceAfterCandidate(
          candidate,
          "idle",
          "Steady transition cancelled at a beat boundary; source retained.",
          null,
        );
        return;
      }
      patchView({ inFlight: true });
      reserveControllerRequest();
      const response = await client.request({
        protocolId: SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
        kind: "settlePeriodic",
        requestId: nextRequestId(candidate.sessionId, `settle-${callIndex}`),
        sessionId: candidate.sessionId,
      });
      if (
        !response.ok
        || response.commandKind !== "settlePeriodic"
        || response.payload.kind !== "periodic-settlement-progress"
      ) throw commandFailure("settlePeriodic", response);
      const progress = response.payload;
      assertScientificWorkbenchResearchSettlementProgressV1(
        progress,
        callIndex + 1,
        candidate.boundaryFrame,
      );
      patchView({
        inFlight: false,
        periodicStatus: progress.status,
        completedBeatCount: progress.completedBeatCount,
      });
      if (progress.status === "period1-converged") {
        await captureSteadyCycle(
          generation,
          candidate,
          progress.finalObservableFrame,
        );
        return;
      }
      if (progress.status !== "tracking") {
        throw new Error(
          progress.status === "period2-suspect"
            ? "P2 orbit suspected; no steady target was promoted"
            : "maximum beat count reached without P1; no steady target was promoted",
        );
      }
    }
    throw new Error("bounded steady settlement ended without P1 convergence");
  }, [
    captureSteadyCycle,
    client,
    nextRequestId,
    patchView,
    reserveControllerRequest,
    restoreSourceAfterCandidate,
  ]);

  const finishLiveReset = React.useCallback(async (
    candidate: CandidateV0,
  ): Promise<void> => {
    liveIntentRef.current = "paused";
    visibilityAutoPausedRef.current = false;
    pendingLiveRetargetDraftRef.current = null;
    if (
      liveAnimationFrameRef.current !== null
      && typeof cancelAnimationFrame === "function"
    ) {
      cancelAnimationFrame(liveAnimationFrameRef.current);
      liveAnimationFrameRef.current = null;
    }
    if (liveRenderTimerRef.current !== null) {
      clearTimeout(liveRenderTimerRef.current);
      liveRenderTimerRef.current = null;
    }
    patchView({ phase: "resetting", inFlight: false });
    await restoreSourceAfterCandidate(
      candidate,
      "idle",
      "Live target discarded. The exact retained source plot and session were restored.",
      null,
    );
    replaceDraft(draftFromContext(viewRef.current.source.context));
  }, [patchView, replaceDraft, restoreSourceAfterCandidate]);

  const retargetLiveCandidate = React.useCallback(async (
    candidate: CandidateV0,
    committedDraft: ControlDraftV0,
  ): Promise<CandidateV0> => {
    if (!draftDiffersFromContext(committedDraft, candidate.context)) {
      return candidate;
    }
    const sourceBoundary = liveFramesRef.current.at(-1);
    if (sourceBoundary === undefined) {
      throw new Error("live retarget has no accepted-state boundary");
    }
    const source: ScientificWorkbenchResearchControlSourceV0 = Object.freeze({
      sessionId: candidate.sessionId,
      context: Object.freeze({
        stateIdentity: Object.freeze({
          revision: sourceBoundary.revision,
          acceptedTimeSec: sourceBoundary.acceptedTimeSec,
          totalBloodVolumeMl: candidate.context.stateIdentity.totalBloodVolumeMl,
        }),
        controlState: candidate.context.controlState,
        parameterEpoch: candidate.context.parameterEpoch,
      }),
      frames: Object.freeze([sourceBoundary]),
    });
    patchView({
      phase: "live-retargeting",
      inFlight: false,
      message: "Merging the updated parameter subset at the latest accepted-state boundary…",
    });
    const targetControlState =
      await createMainWireScientificResearchControlTargetStateV0(
        targetValuesFromDraftV0(committedDraft),
      );
    const targetSessionId = nextTransitionSessionId();
    patchView({
      targetControlStateSha256: targetControlState.targetStateSha256,
      inFlight: true,
    });
    reserveControllerRequest();
    const response = await client.request({
      protocolId: SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
      kind: "forkResearchControlSession",
      requestId: nextRequestId(targetSessionId, "live-retarget"),
      sessionId: targetSessionId,
      sourceSessionId: source.sessionId,
      expectedSource: {
        ...source.context.stateIdentity,
        controlStateSha256: source.context.controlState.targetStateSha256,
        parameterEpoch: source.context.parameterEpoch,
      },
      targetControlState,
    });
    if (
      !response.ok
      || response.commandKind !== "forkResearchControlSession"
      || response.payload.kind !== "researchControlSessionForked"
    ) throw commandFailure("forkResearchControlSession", response);
    const nextCandidate: CandidateV0 = Object.freeze({
      sessionId: targetSessionId,
      context: Object.freeze({
        stateIdentity: response.payload.targetStateIdentity,
        controlState: response.payload.targetControlState,
        parameterEpoch: response.payload.parameterEpoch,
      }),
      boundaryFrame: response.payload.observableFrame,
    });
    assertForkResponseV0(response, source, targetControlState);
    patchView({
      candidate: nextCandidate,
      phase: liveIntentRef.current === "paused" ? "live-paused" : "live-running",
      inFlight: false,
      message: "The cumulative live target was updated without restarting the displayed trajectory.",
    });
    try {
      await disposeSession(candidate.sessionId);
    } catch (error) {
      await disposeSession(nextCandidate.sessionId).catch(() => undefined);
      throw error;
    }
    return nextCandidate;
  }, [
    client,
    disposeSession,
    nextRequestId,
    patchView,
    reserveControllerRequest,
  ]);

  const runLiveLoop = React.useCallback(async (
    generation: number,
    candidate: CandidateV0,
  ): Promise<void> => {
    if (liveLoopActiveRef.current) return;
    liveLoopActiveRef.current = true;
    let activeCandidate = candidate;
    try {
      while (
        mountedRef.current
        && generation === operationGenerationRef.current
      ) {
        if (liveIntentRef.current === "reset") {
          await finishLiveReset(activeCandidate);
          return;
        }
        if (
          liveIntentRef.current === "paused"
          || !playbackRunningRef.current
          || (typeof document !== "undefined" && document.hidden)
        ) {
          if (typeof document !== "undefined" && document.hidden) {
            visibilityAutoPausedRef.current = true;
            liveIntentRef.current = "paused";
          }
          scheduleLiveRender(true);
          patchView({
            phase: "live-paused",
            inFlight: false,
            message: !playbackRunningRef.current
              ? "Live transition paused by the Workbench playback control at an accepted command boundary."
              : "Live transition paused at an accepted 4-step command boundary.",
          });
          return;
        }

        if (viewRef.current.remainingRegularRequestCount === 0) {
          liveIntentRef.current = "paused";
          scheduleLiveRender(true);
          patchView({
            phase: "live-paused",
            inFlight: false,
            periodicStatus: "live-request-capacity-reached",
            message: "Live transition auto-paused at a command boundary because the bounded request capacity was reached. Reset remains available.",
          });
          return;
        }

        const pendingTarget = pendingLiveRetargetDraftRef.current;
        if (pendingTarget !== null) {
          pendingLiveRetargetDraftRef.current = null;
          activeCandidate = await retargetLiveCandidate(
            activeCandidate,
            pendingTarget,
          );
          continue;
        }

        const commandStartedAtMs = monotonicNowMs();
        patchView({ phase: "live-running", inFlight: true });
        reserveControllerRequest();
        const response = await client.request({
          protocolId: SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
          kind: "runTransient",
          requestId: nextRequestId(activeCandidate.sessionId, "live"),
          sessionId: activeCandidate.sessionId,
          dtSec: SCIENTIFIC_WORKBENCH_TERMINAL_CYCLE_V1.dtSec,
          stepCount:
            SCIENTIFIC_WORKBENCH_LIVE_STEPS_PER_COMMAND_V0,
          observationStride:
            SCIENTIFIC_WORKBENCH_TERMINAL_CYCLE_V1.observationStride,
        });
        const frames = acceptedTransientChunk(
          response,
          SCIENTIFIC_WORKBENCH_LIVE_STEPS_PER_COMMAND_V0,
        );
        liveFramesRef.current = appendScientificWorkbenchLiveFramesV0(
          liveFramesRef.current,
          frames,
        );
        // React refs may be changed by pause/reset event handlers while the
        // awaited Worker command is in flight. Read through a function so the
        // value is not incorrectly control-flow-narrowed to the pre-await state.
        const intentAfterResponse = readLiveIntentV0(liveIntentRef);
        const playbackPausedAfterResponse = !playbackRunningRef.current;
        patchView({
          inFlight: false,
          phase: intentAfterResponse === "paused" || playbackPausedAfterResponse
            ? "live-pause-requested"
            : intentAfterResponse === "reset" ? "resetting" : "live-running",
        });
        scheduleLiveRender(
          intentAfterResponse !== "running" || playbackPausedAfterResponse,
        );

        if (intentAfterResponse === "reset") {
          await finishLiveReset(activeCandidate);
          return;
        }
        if (intentAfterResponse === "paused" || playbackPausedAfterResponse) {
          scheduleLiveRender(true);
          patchView({
            phase: "live-paused",
            inFlight: false,
            message: playbackPausedAfterResponse
              ? "Live transition paused by the Workbench playback control at an accepted command boundary."
              : "Live transition paused at an accepted 4-step command boundary.",
          });
          return;
        }
        const remainingMs = scientificWorkbenchLiveChunkDelayMsV0(
          monotonicNowMs() - commandStartedAtMs,
          playbackTimeScaleRef.current,
        );
        if (remainingMs > 0) await delay(remainingMs);
      }
    } catch (error) {
      await failTransition(error, activeCandidate);
    } finally {
      liveLoopActiveRef.current = false;
      if (playbackResumePendingRef.current) {
        playbackResumePendingRef.current = false;
        const current = viewRef.current;
        const pageHidden = typeof document !== "undefined" && document.hidden;
        if (
          mountedRef.current
          && generation === operationGenerationRef.current
          && playbackRunningRef.current
          && readLiveIntentV0(liveIntentRef) === "running"
          && !pageHidden
          && current.candidate !== null
          && current.remainingRegularRequestCount > 0
          && (current.phase === "live-paused"
            || current.phase === "live-pause-requested")
        ) {
          patchView({
            phase: "live-running",
            message: "Live accepted-step transition resumed from the Workbench playback control.",
          });
          globalThis.setTimeout(() => {
            const latest = viewRef.current;
            if (
              mountedRef.current
              && playbackRunningRef.current
              && latest.candidate !== null
              && latest.phase === "live-running"
              && !liveLoopActiveRef.current
            ) {
              void runLiveLoopRef.current(
                operationGenerationRef.current,
                latest.candidate,
              );
            }
          }, 0);
        }
      }
    }
  }, [
    client,
    failTransition,
    finishLiveReset,
    nextRequestId,
    patchView,
    reserveControllerRequest,
    retargetLiveCandidate,
    scheduleLiveRender,
  ]);
  runLiveLoopRef.current = runLiveLoop;

  const applyTransition = React.useCallback(async (
    committedDraft: ControlDraftV0 = draftRef.current,
  ): Promise<void> => {
    const current = viewRef.current;
    if (
      current.phase !== "idle"
      || !draftDiffersFromSource(committedDraft, current.source)
    ) {
      return;
    }
    const generation = operationGenerationRef.current + 1;
    operationGenerationRef.current = generation;
    cancelSteadyRef.current = false;
    pendingLiveRetargetDraftRef.current = null;
    const mode = current.mode;
    const forkPhase = mode === "steady" ? "steady-forking" : "live-forking";
    patchView({
      phase: forkPhase,
      candidate: null,
      targetControlStateSha256: null,
      liveTransitionOriginAcceptedTimeSec: null,
      inFlight: false,
      periodicStatus: "not-started",
      completedBeatCount: 0,
      capturedStepCount: 0,
      message: "Resolving the complete release-bound target state…",
      errorMessage: null,
    });

    let candidate: CandidateV0 | null = null;
    try {
      const targetControlState =
        await createMainWireScientificResearchControlTargetStateV0(
          targetValuesFromDraftV0(committedDraft),
        );
      if (generation !== operationGenerationRef.current) return;
      const source = viewRef.current.source;
      const targetSessionId = nextTransitionSessionId();
      patchView({
        targetControlStateSha256: targetControlState.targetStateSha256,
        inFlight: true,
        message: "Forking the exact accepted state into an isolated research target…",
      });
      reserveControllerRequest();
      const response = await client.request({
        protocolId: SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
        kind: "forkResearchControlSession",
        requestId: nextRequestId(targetSessionId, "fork"),
        sessionId: targetSessionId,
        sourceSessionId: source.sessionId,
        expectedSource: {
          ...source.context.stateIdentity,
          controlStateSha256: source.context.controlState.targetStateSha256,
          parameterEpoch: source.context.parameterEpoch,
        },
        targetControlState,
      });
      if (
        !response.ok
        || response.commandKind !== "forkResearchControlSession"
        || response.payload.kind !== "researchControlSessionForked"
      ) throw commandFailure("forkResearchControlSession", response);
      candidate = Object.freeze({
        sessionId: targetSessionId,
        context: Object.freeze({
          stateIdentity: response.payload.targetStateIdentity,
          controlState: response.payload.targetControlState,
          parameterEpoch: response.payload.parameterEpoch,
        }),
        boundaryFrame: response.payload.observableFrame,
      });
      // Assign the successfully allocated target before any UI-level evidence
      // assertion can throw, so the catch path always retires it.
      assertForkResponseV0(response, source, targetControlState);
      if (generation !== operationGenerationRef.current) {
        await restoreSourceAfterCandidate(
          candidate,
          "idle",
          "Live transition cancelled before presentation; source retained.",
          null,
        );
        return;
      }
      patchView({ candidate, inFlight: false });

      if (mode === "steady") {
        await settleSteadyCandidate(generation, candidate);
        return;
      }

      const pageHidden = typeof document !== "undefined" && document.hidden;
      const playbackPaused = !playbackRunningRef.current;
      visibilityAutoPausedRef.current = pageHidden;
      liveIntentRef.current = pageHidden
        ? "paused"
        : "running";
      liveFramesRef.current = Object.freeze([candidate.boundaryFrame]);
      lastLiveRenderAtMsRef.current = 0;
      commitView({
        ...viewRef.current,
        phase: liveIntentRef.current === "running" && !playbackPaused
          ? "live-running"
          : "live-paused",
        candidate,
        frames: liveFramesRef.current,
        liveTransitionOriginAcceptedTimeSec:
          candidate.boundaryFrame.acceptedTimeSec,
        inFlight: false,
        periodicStatus: "not-claimed-live-transition",
        message: liveIntentRef.current === "running" && !playbackPaused
          ? "Showing every accepted target step in real time; no steady-state claim is made."
          : playbackPaused
            ? "Workbench playback is paused, so the live target is retained at its fork boundary."
            : "Page is hidden, so the live target was paused at its fork boundary.",
      });
      void runLiveLoop(generation, candidate);
    } catch (error) {
      if (
        generation !== operationGenerationRef.current
        && readLiveIntentV0(liveIntentRef) === "reset"
        && client.status === "open"
      ) {
        if (candidate !== null) {
          await restoreSourceAfterCandidate(
            candidate,
            "idle",
            "Live transition cancelled before presentation; source retained.",
            null,
          );
        } else {
          const source = viewRef.current.source;
          liveFramesRef.current = source.frames;
          commitView({
            ...viewRef.current,
            phase: "idle",
            candidate: null,
            frames: source.frames,
            targetControlStateSha256: null,
            liveTransitionOriginAcceptedTimeSec: null,
            inFlight: false,
            periodicStatus: "idle",
            completedBeatCount: 0,
            capturedStepCount: 0,
            message: "Live transition cancelled before allocation; source retained.",
            errorMessage: null,
          });
        }
        return;
      }
      await failTransition(error, candidate);
    }
  }, [
    client,
    commitView,
    disposeSession,
    failTransition,
    nextRequestId,
    patchView,
    runLiveLoop,
    reserveControllerRequest,
    settleSteadyCandidate,
    restoreSourceAfterCandidate,
  ]);

  const cancelSteady = React.useCallback((): void => {
    if (
      viewRef.current.phase !== "steady-forking"
      && viewRef.current.phase !== "steady-settling"
      && viewRef.current.phase !== "steady-capturing"
    ) return;
    cancelSteadyRef.current = true;
    patchView({
      message: "Cancellation requested; the target will be discarded after the current command boundary.",
    });
  }, [patchView]);

  const pauseLive = React.useCallback((): void => {
    if (
      viewRef.current.phase !== "live-running"
      && viewRef.current.phase !== "live-retargeting"
    ) return;
    visibilityAutoPausedRef.current = false;
    liveIntentRef.current = "paused";
    patchView({
      phase: viewRef.current.inFlight
        ? "live-pause-requested"
        : "live-paused",
      message: "Pause requested; waiting for the current 4-step command boundary.",
    });
  }, [patchView]);

  const resumeLive = React.useCallback((): void => {
    const current = viewRef.current;
    if (
      current.phase !== "live-paused"
      || current.candidate === null
      || current.remainingRegularRequestCount === 0
    ) return;
    visibilityAutoPausedRef.current = false;
    liveIntentRef.current = "running";
    lastLiveRenderAtMsRef.current = monotonicNowMs();
    patchView({
      phase: "live-running",
      message: "Live accepted-step transition resumed.",
    });
    void runLiveLoop(operationGenerationRef.current, current.candidate);
  }, [patchView, runLiveLoop]);

  const resetLiveOrFailure = React.useCallback((): void => {
    const current = viewRef.current;
    if (current.phase === "resetting") return;
    visibilityAutoPausedRef.current = false;
    if (current.phase === "failed" && current.candidate === null) {
      commitView({
        ...current,
        phase: "idle",
        frames: current.source.frames,
        periodicStatus: "idle",
        message: "Choose a complete release-bound target and transition mode.",
        errorMessage: null,
      });
      replaceDraft(draftFromContext(current.source.context));
      return;
    }
    if (current.phase === "live-forking" && current.candidate === null) {
      liveIntentRef.current = "reset";
      operationGenerationRef.current += 1;
      if (current.inFlight) {
        patchView({
          phase: "resetting",
          message: "Reset requested; an allocated fork will be retired before it can be presented.",
        });
      } else {
        liveFramesRef.current = current.source.frames;
        commitView({
          ...current,
          phase: "idle",
          frames: current.source.frames,
          targetControlStateSha256: null,
          liveTransitionOriginAcceptedTimeSec: null,
          inFlight: false,
          periodicStatus: "idle",
          message: "Live transition cancelled before allocation; source retained.",
          errorMessage: null,
        });
      }
      return;
    }
    if (current.candidate === null) return;
    liveIntentRef.current = "reset";
    patchView({
      phase: "resetting",
      message: current.inFlight
        ? "Reset requested; waiting for the current 4-step command boundary."
        : "Discarding the live target and restoring the retained source…",
    });
    if (!current.inFlight && !liveLoopActiveRef.current) {
      void finishLiveReset(current.candidate).catch((error: unknown) => {
        void failTransition(error, current.candidate);
      });
    }
  }, [commitView, failTransition, finishLiveReset, patchView, replaceDraft]);

  const ownerTokenRef = React.useRef<symbol>(Symbol("scientific-control-owner-v0"));
  const ownerActionsRef = React.useRef<ScientificWorkbenchResearchControlOwnerActionsV0 | null>(
    null,
  );
  const commitControlDraft = (
    patch: Partial<ControlDraftV0>,
  ): void => {
    const current = viewRef.current;
    if (current.sourceRetirementPending) return;
    const target = patchDraft(patch);
    if (current.phase.startsWith("live-")) {
      pendingLiveRetargetDraftRef.current = target;
      patchView({
        message: current.phase === "live-paused"
          ? "Updated parameters queued; they will merge at the next accepted boundary when live transition resumes."
          : "Updated parameters queued for the next accepted live-transition boundary.",
      });
      return;
    }
    if (current.phase !== "idle") return;
    void applyTransition(target);
  };
  ownerActionsRef.current = {
    setControlValue: (controlId, value) => {
      const patch = draftPatchForControlValueV0(controlId, value);
      if (patch !== null) void patchDraft(patch);
    },
    commitControlValue: (controlId, value) => {
      const patch = draftPatchForControlValueV0(controlId, value);
      if (patch !== null) commitControlDraft(patch);
    },
    setSystemicScale: (systemic) => void patchDraft({ systemic }),
    setPulmonaryScale: (pulmonary) => void patchDraft({ pulmonary }),
    commitSystemicScale: (systemic) => commitControlDraft({ systemic }),
    commitPulmonaryScale: (pulmonary) => commitControlDraft({ pulmonary }),
    setMode: (mode) => {
      if (viewRef.current.phase === "idle") patchView({ mode });
    },
    applyTransition: () => void applyTransition(),
    cancelSteady,
    pauseLive,
    resumeLive,
    resetLiveOrFailure,
  };

  const busy = view.phase !== "idle" || view.sourceRetirementPending;
  const noChange = !draftDiffersFromSource(draft, view.source);
  const steadyActive = view.phase.startsWith("steady-");
  const liveActive = view.phase.startsWith("live-") || view.phase === "resetting";
  const displayingCandidateFrames =
    scientificWorkbenchDisplayedFrameOwnerV0(
      view.candidate !== null,
      view.frames,
      view.source.frames,
    ) === "candidate";
  const displayedParameterEpoch = displayingCandidateFrames
    ? view.candidate!.context.parameterEpoch
    : view.source.context.parameterEpoch;
  const displayedControlStateSha256 = displayingCandidateFrames
    ? view.candidate!.context.controlState.targetStateSha256
    : view.source.context.controlState.targetStateSha256;
  const displayedEvidence = displayingCandidateFrames
    ? "open-transient-no-periodic-claim" as const
    : view.periodicStatus === "period1-converged-and-cycle-validated"
      ? "target-period1-and-following-cycle-validated" as const
      : "retained-period1-source-cycle" as const;
  const requestCapacityExhausted = view.remainingRegularRequestCount === 0;
  const snapshotInput = React.useMemo<
    ScientificWorkbenchResearchControlSnapshotInputV0
  >(() => Object.freeze({
      ...view,
      draft: Object.freeze({ ...draft }),
      busy,
      noChange,
      steadyActive,
      liveActive,
      requestCapacityExhausted,
      provenance: Object.freeze({
        displayedFrameOwner: displayingCandidateFrames
          ? "candidate" as const
          : "source" as const,
        displayedParameterEpoch,
        displayedControlStateSha256,
        displayedEvidence,
      }),
    }), [draft, view]);
  const controllerSnapshot = React.useMemo<
    ScientificWorkbenchResearchControlSnapshotV0
  >(() => Object.freeze({
      ...snapshotInput,
      ownerConnected: true,
      actions: controlStore.actions,
    }), [controlStore.actions, snapshotInput]);

  React.useEffect(() => controlStore.connectOwner(
    ownerTokenRef.current,
    ownerActionsRef,
  ), [controlStore]);

  React.useEffect(() => {
    controlStore.publishOwnerSnapshot(ownerTokenRef.current, snapshotInput);
  }, [controlStore, snapshotInput]);

  React.useEffect(() => {
    const active = view.sourceRetirementPending
      || view.candidate !== null
      || !["idle", "failed", "reload-required"].includes(view.phase);
    onTransitionActivityChange?.(active);
  }, [
    onTransitionActivityChange,
    view.candidate,
    view.phase,
    view.sourceRetirementPending,
  ]);

  React.useEffect(() => {
    assertLivePlaybackTimeScaleV0(playbackTimeScale);
    playbackTimeScaleRef.current = playbackTimeScale;
  }, [playbackTimeScale]);

  React.useEffect(() => {
    playbackRunningRef.current = playbackRunning;
    const current = viewRef.current;
    if (current.candidate === null || !current.phase.startsWith("live-")) {
      return;
    }
    if (!playbackRunning) {
      playbackResumePendingRef.current = false;
      const pauseIsPending = current.inFlight || liveLoopActiveRef.current;
      patchView({
        phase: pauseIsPending ? "live-pause-requested" : "live-paused",
        message: pauseIsPending
          ? "Workbench pause requested; waiting for the live loop to publish its final accepted command boundary."
          : "Live transition paused by the Workbench playback control at an accepted command boundary.",
      });
      return;
    }
    if (
      current.remainingRegularRequestCount === 0
      || readLiveIntentV0(liveIntentRef) !== "running"
      || (typeof document !== "undefined" && document.hidden)
    ) return;
    if (
      (current.phase === "live-paused"
        || current.phase === "live-pause-requested")
      && liveLoopActiveRef.current
    ) {
      playbackResumePendingRef.current = true;
      return;
    }
    if (current.phase === "live-paused" && !liveLoopActiveRef.current) {
      lastLiveRenderAtMsRef.current = monotonicNowMs();
      patchView({
        phase: "live-running",
        message: "Live accepted-step transition resumed from the Workbench playback control.",
      });
      void runLiveLoop(operationGenerationRef.current, current.candidate);
    }
  }, [patchView, playbackRunning, runLiveLoop]);

  React.useEffect(() => {
    if (typeof document === "undefined") return undefined;
    const onVisibilityChange = (): void => {
      const current = viewRef.current;
      if (document.hidden) {
        if (
          current.candidate === null
          || !current.phase.startsWith("live-")
        ) return;
        visibilityAutoPausedRef.current = true;
        liveIntentRef.current = "paused";
        patchView({
          phase: current.inFlight
            ? "live-pause-requested"
            : "live-paused",
          message: "Live transition auto-paused while this tab is hidden and will resume when visible.",
        });
        return;
      }
      if (!visibilityAutoPausedRef.current) return;
      visibilityAutoPausedRef.current = false;
      const visible = viewRef.current;
      if (
        visible.candidate === null
        || visible.remainingRegularRequestCount === 0
        || visible.phase === "resetting"
      ) return;
      if (!playbackRunningRef.current) {
        liveIntentRef.current = "running";
        patchView({
          phase: "live-paused",
          message: "The tab is visible, but the Workbench playback control remains paused.",
        });
        return;
      }
      liveIntentRef.current = "running";
      lastLiveRenderAtMsRef.current = monotonicNowMs();
      patchView({
        phase: "live-running",
        message: "Live accepted-step transition resumed when the tab became visible.",
      });
      if (!liveLoopActiveRef.current) {
        void runLiveLoop(operationGenerationRef.current, visible.candidate);
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [patchView, runLiveLoop]);

  React.useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      operationGenerationRef.current += 1;
      cancelSteadyRef.current = true;
      liveIntentRef.current = "reset";
      if (liveAnimationFrameRef.current !== null
        && typeof cancelAnimationFrame === "function") {
        cancelAnimationFrame(liveAnimationFrameRef.current);
      }
      if (liveRenderTimerRef.current !== null) {
        clearTimeout(liveRenderTimerRef.current);
      }
      const candidate = viewRef.current.candidate;
      if (candidate !== null && client.status === "open") {
        void disposeSession(candidate.sessionId).catch(() => undefined);
      }
    };
  }, [client, disposeSession]);

  return (
    <>
      {renderController && (
        <ScientificWorkbenchResearchControlSurfaceV0
          snapshot={controllerSnapshot}
          surface={surface}
        />
      )}
      {renderWorkspace && (
        <ScientificWorkspaceRendererV1
          workspaceDocument={workspaceDocument}
          frames={view.frames}
        />
      )}
    </>
  );
}

export type ScientificWorkbenchResearchControlMirrorV0Props = Readonly<{
  store: ScientificWorkbenchResearchControlStoreV0;
  surface?: ScientificWorkbenchSurfaceV1;
}>;

/** Stateless controller mirror. It never owns a Worker or a simulation. */
export function ScientificWorkbenchResearchControlMirrorV0({
  store,
  surface = "product",
}: ScientificWorkbenchResearchControlMirrorV0Props) {
  const snapshot = useScientificWorkbenchResearchControlSnapshotV0(store);
  return (
    <ScientificWorkbenchResearchControlSurfaceV0
      snapshot={snapshot}
      surface={surface}
    />
  );
}

export type ScientificWorkbenchResearchControlSurfaceV0Props = Readonly<{
  snapshot: ScientificWorkbenchResearchControlSnapshotV0;
  surface?: ScientificWorkbenchSurfaceV1;
}>;

/**
 * Pure presentation of a research-control snapshot. Multiple panes and note
 * embeds may render this surface without creating competing state machines.
 */
export function ScientificWorkbenchResearchControlSurfaceV0({
  snapshot,
  surface = "research",
}: ScientificWorkbenchResearchControlSurfaceV0Props) {
  const modeGroupName = React.useId();
  const {
    actions,
    busy,
    draft,
    liveActive,
    noChange,
    ownerConnected,
    provenance,
    requestCapacityExhausted,
    steadyActive,
  } = snapshot;
  const disabled = busy || !ownerConnected;

  return (
      <section
        className="rounded-xl border border-cyan-900/80 bg-cyan-950/20 p-4"
        data-testid="scientific-transition-controller-v0"
        data-phase={snapshot.phase}
        data-mode={snapshot.mode}
        data-owner-connected={String(ownerConnected)}
        data-source-session-id={snapshot.source.sessionId}
        data-candidate-session-id={snapshot.candidate?.sessionId ?? ""}
        data-source-control-sha256={
          snapshot.source.context.controlState.targetStateSha256
        }
        data-target-control-sha256={snapshot.targetControlStateSha256 ?? ""}
        data-source-parameter-epoch={snapshot.source.context.parameterEpoch}
        data-candidate-parameter-epoch={
          snapshot.candidate?.context.parameterEpoch ?? ""
        }
        data-parameter-epoch={provenance.displayedParameterEpoch}
        data-displayed-control-sha256={
          provenance.displayedControlStateSha256
        }
        data-displayed-evidence={provenance.displayedEvidence}
        data-remaining-regular-request-count={
          snapshot.remainingRegularRequestCount
        }
        data-in-flight={String(snapshot.inFlight)}
        data-periodic-status={snapshot.periodicStatus}
        data-completed-beat-count={snapshot.completedBeatCount}
        data-captured-step-count={snapshot.capturedStepCount}
        data-source-retirement-pending={String(snapshot.sourceRetirementPending)}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
              {surface === "product"
                ? "Circulation controls"
                : "Experimental research transition V0"}
            </p>
            <h2 className="mt-1 text-base font-semibold text-slate-100">
              {surface === "product"
                ? "Adjust vascular resistance"
                : "Release-bound vascular resistance controls"}
            </h2>
          </div>
          <span className="rounded-full border border-amber-700/70 bg-amber-950/40 px-3 py-1 text-xs text-amber-200">
            {surface === "product"
              ? "Simulation only · not medical advice"
              : "Research only · not clinical · not patient fitting"}
          </span>
        </div>
        <p className="mt-2 max-w-5xl text-xs leading-5 text-slate-400">
          {surface === "product"
            ? "Choose systemic and pulmonary resistance, then either move directly to the next stable state or watch the accepted transition unfold in real time."
            : "The target is a complete, content-addressed SVR/PVR state. Steady mode hides the target until numerical P1 and a full following cycle are validated. Live mode shows accepted steps as they commit and makes no periodic steady-state claim."}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-2 text-xs">
          <span className="font-semibold uppercase tracking-wider text-slate-500">
            {surface === "product" ? "Current display" : "Displayed evidence"}
          </span>
          <span className="text-slate-200">
            {provenance.displayedEvidence === "open-transient-no-periodic-claim"
              ? "Open transient · no P1 claim"
              : provenance.displayedEvidence
                    === "target-period1-and-following-cycle-validated"
                ? "Target P1 + following cycle validated"
                : "Retained P1 source cycle"}
          </span>
          <code className="text-cyan-300">
            epoch {provenance.displayedParameterEpoch} · control {shortControlDigestV0(provenance.displayedControlStateSha256)}
          </code>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(16rem,1fr)]">
          <ControlScaleSelectV0
            label="Systemic vascular resistance"
            testId="scientific-control-svr-v0"
            value={draft.systemic}
            disabled={disabled}
            onChange={actions.setSystemicScale}
          />
          <ControlScaleSelectV0
            label="Pulmonary vascular resistance"
            testId="scientific-control-pvr-v0"
            value={draft.pulmonary}
            disabled={disabled}
            onChange={actions.setPulmonaryScale}
          />
          <fieldset className="rounded-lg border border-slate-800 px-3 py-2" disabled={disabled}>
            <legend className="px-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
              {surface === "product"
                ? "Update behavior"
                : "Transition presentation"}
            </legend>
            <label className="mr-4 inline-flex items-center gap-2 text-sm text-slate-200">
              <input
                type="radio"
                name={`scientific-transition-mode-v0-${modeGroupName}`}
                data-testid="scientific-transition-mode-steady-v0"
                checked={snapshot.mode === "steady"}
                onChange={() => actions.setMode("steady")}
              />
              {surface === "product" ? "Show next steady state" : "Next steady state"}
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-slate-200">
              <input
                type="radio"
                name={`scientific-transition-mode-v0-${modeGroupName}`}
                data-testid="scientific-transition-mode-live-v0"
                checked={snapshot.mode === "live"}
                onChange={() => actions.setMode("live")}
              />
              {surface === "product" ? "Play transition" : "Live transition"}
            </label>
          </fieldset>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="rounded-lg bg-cyan-700 px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
            data-testid="scientific-transition-apply-v0"
            disabled={disabled || noChange || requestCapacityExhausted}
            onClick={actions.applyTransition}
          >
            {surface === "product" ? "Apply changes" : "Apply complete target"}
          </button>
          {steadyActive && (
            <button
              type="button"
              className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200"
              data-testid="scientific-transition-cancel-v0"
              onClick={actions.cancelSteady}
            >
              Cancel at boundary
            </button>
          )}
          {(snapshot.phase === "live-running"
            || snapshot.phase === "live-pause-requested") && (
            <button
              type="button"
              className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200 disabled:opacity-40"
              data-testid="scientific-transition-pause-v0"
              disabled={!ownerConnected || snapshot.phase === "live-pause-requested"}
              onClick={actions.pauseLive}
            >
              Pause at boundary
            </button>
          )}
          {ownerConnected && snapshot.phase === "live-paused" && (
            <button
              type="button"
              className="rounded-lg border border-emerald-700 px-3 py-2 text-sm text-emerald-200"
              data-testid="scientific-transition-resume-v0"
              disabled={requestCapacityExhausted}
              onClick={actions.resumeLive}
            >
              Resume live
            </button>
          )}
          {(liveActive || snapshot.phase === "failed") && (
            <button
              type="button"
              className="rounded-lg border border-rose-800 px-3 py-2 text-sm text-rose-200"
              data-testid="scientific-transition-reset-v0"
              disabled={!ownerConnected || snapshot.phase === "resetting"}
              onClick={actions.resetLiveOrFailure}
            >
              {snapshot.phase === "failed" ? "Dismiss failure" : "Reset to source"}
            </button>
          )}
          <p className="text-xs text-slate-400" role="status">
            {snapshot.message}
          </p>
        </div>
        {snapshot.errorMessage !== null && (
          <p className="mt-3 rounded-lg border border-rose-900 bg-rose-950/30 px-3 py-2 text-xs text-rose-200" role="alert">
            {snapshot.errorMessage}
          </p>
        )}
      </section>
  );
}

export function appendScientificWorkbenchLiveFramesV0(
  retained: readonly MainWireScientificObservableFrameV1[],
  incoming: readonly MainWireScientificObservableFrameV1[],
  limit = SCIENTIFIC_WORKBENCH_LIVE_HISTORY_FRAME_LIMIT_V0,
): readonly MainWireScientificObservableFrameV1[] {
  if (!Number.isSafeInteger(limit) || limit < 1) {
    throw new Error("live transition history limit must be a positive safe integer");
  }
  if (incoming.length === 0) return retained;
  let previous = retained.at(-1) ?? null;
  for (const [index, frame] of incoming.entries()) {
    if (frame.source !== "accepted-step") {
      throw new Error(`live frame ${index} is not an accepted-step observation`);
    }
    if (previous !== null) {
      if (!sameSimulationReleaseRef(previous.releaseRef, frame.releaseRef)) {
        throw new Error(`live frame ${index} escaped the source release`);
      }
      if (frame.revision !== previous.revision + 1) {
        throw new Error(`live frame ${index} is not revision-contiguous`);
      }
      const dtSec = frame.acceptedTimeSec - previous.acceptedTimeSec;
      if (
        !Number.isFinite(dtSec)
        || Math.abs(dtSec - SCIENTIFIC_WORKBENCH_TERMINAL_CYCLE_V1.dtSec)
          > 1e-10
      ) {
        throw new Error(`live frame ${index} does not preserve 2 ms cadence`);
      }
    }
    previous = frame;
  }
  const combined = [...retained, ...incoming];
  return Object.freeze(combined.slice(Math.max(0, combined.length - limit)));
}

export function scientificWorkbenchDisplayedFrameOwnerV0(
  candidatePresent: boolean,
  displayedFrames: readonly unknown[],
  sourceFrames: readonly unknown[],
): "source" | "candidate" {
  return candidatePresent && displayedFrames !== sourceFrames
    ? "candidate"
    : "source";
}

function ControlScaleSelectV0({
  label,
  testId,
  value,
  disabled,
  onChange,
}: Readonly<{
  label: string;
  testId: string;
  value: MainWireScientificResearchControlScaleV0;
  disabled: boolean;
  onChange: (value: MainWireScientificResearchControlScaleV0) => void;
}>) {
  return (
    <label className="text-sm text-slate-300">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </span>
      <select
        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 disabled:opacity-50"
        data-testid={testId}
        value={String(value)}
        disabled={disabled}
        onChange={(event) => onChange(parseControlScale(event.currentTarget.value))}
      >
        {MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_SCALE_VALUES_V0.map((scale) => (
          <option key={scale} value={String(scale)}>
            {scale === 1 ? "1.00× (release baseline)" : `${scale.toFixed(2)}×`}
          </option>
        ))}
      </select>
    </label>
  );
}

function acceptedTransientChunk(
  response: MainWireScientificWorkerResponseV1,
  expectedStepCount: number =
    SCIENTIFIC_WORKBENCH_TERMINAL_CYCLE_V1.stepsPerWorkerCommand,
): readonly MainWireScientificObservableFrameV1[] {
  if (
    !response.ok
    || response.commandKind !== "runTransient"
    || response.payload.kind !== "transientCompleted"
    || response.payload.requestedStepCount
      !== expectedStepCount
    || response.payload.completedStepCount
      !== expectedStepCount
    || response.payload.observableFrames.length
      !== expectedStepCount
    || response.payload.executionProtocol.dtSec
      !== SCIENTIFIC_WORKBENCH_TERMINAL_CYCLE_V1.dtSec
    || response.payload.executionProtocol.observationPolicy.stride
      !== SCIENTIFIC_WORKBENCH_TERMINAL_CYCLE_V1.observationStride
    || response.payload.executionProtocol.classification
      !== "exploratory-parameterization"
    || response.payload.observableFrames.at(-1)?.revision
      !== response.payload.finalObservableFrame.revision
    || response.payload.observableFrames.at(-1)?.acceptedTimeSec
      !== response.payload.finalObservableFrame.acceptedTimeSec
  ) throw commandFailure("runTransient", response);
  return response.payload.observableFrames;
}

function assertForkResponseV0(
  response: Extract<
    MainWireScientificWorkerResponseV1,
    Readonly<{ ok: true; commandKind: "forkResearchControlSession" }>
  >,
  source: ScientificWorkbenchResearchControlSourceV0,
  target: MainWireScientificResearchControlTargetStateV0,
): void {
  const payload = response.payload;
  const sourceBoundary = source.frames.at(-1);
  if (
    sourceBoundary === undefined
    || sourceBoundary.revision !== source.context.stateIdentity.revision
    || sourceBoundary.acceptedTimeSec
      !== source.context.stateIdentity.acceptedTimeSec
    || payload.sourceSessionId !== source.sessionId
    || payload.sourceStateIdentity.revision
      !== source.context.stateIdentity.revision
    || payload.sourceStateIdentity.acceptedTimeSec
      !== source.context.stateIdentity.acceptedTimeSec
    || payload.sourceStateIdentity.totalBloodVolumeMl
      !== source.context.stateIdentity.totalBloodVolumeMl
    || payload.sourceControlStateSha256
      !== source.context.controlState.targetStateSha256
    || payload.targetControlState.targetStateSha256
      !== target.targetStateSha256
    || payload.targetStateIdentity.revision
      !== payload.sourceStateIdentity.revision
    || payload.targetStateIdentity.acceptedTimeSec
      !== payload.sourceStateIdentity.acceptedTimeSec
    || payload.targetStateIdentity.totalBloodVolumeMl
      !== payload.sourceStateIdentity.totalBloodVolumeMl
    || payload.parameterEpoch !== source.context.parameterEpoch + 1
    || !payload.acceptedStatePreservedAtFork
    || !payload.periodicTrackerResetAtFork
    || !payload.sourceSessionRetainedAtFork
    || payload.exactCheckpointAvailable !== true
    || payload.periodicSteadyStateClaimed
    || payload.observableFrame.source !== "research-control-state-fork"
    || payload.observableFrame.revision !== payload.targetStateIdentity.revision
    || payload.observableFrame.acceptedTimeSec
      !== payload.targetStateIdentity.acceptedTimeSec
  ) throw new Error("Worker returned invalid research-control fork evidence");
  assertScientificWorkbenchResearchForkBoundaryFrameV0(
    payload.observableFrame,
    sourceBoundary,
  );
}

/**
 * The fork observation is an accepted-state boundary, not an evaluated target
 * sample. State-owned volumes/opening memory may be rendered, while pressures,
 * flows, and solver readbacks must remain explicitly unavailable until the
 * first accepted target step.
 */
export function assertScientificWorkbenchResearchForkBoundaryFrameV0(
  frame: MainWireScientificObservableFrameV1,
  sourceBoundary: Pick<
    MainWireScientificObservableFrameV1,
    "releaseRef" | "values"
  >,
): void {
  if (
    frame.frameId !== MAIN_WIRE_SCIENTIFIC_OBSERVABLE_FRAME_V1_ID
    || frame.registryId !== MAIN_WIRE_SCIENTIFIC_OBSERVABLE_REGISTRY_V1_ID
    || frame.schemaVersion
      !== MAIN_WIRE_SCIENTIFIC_OBSERVABLE_REGISTRY_V1_SCHEMA_VERSION
    || frame.sourceObservationId
      !== "main-wire-scientific-session-observation-v1"
    || frame.source !== "research-control-state-fork"
    || !sameSimulationReleaseRef(frame.releaseRef, sourceBoundary.releaseRef)
    || !isRecordV0(frame.values)
    || Object.keys(frame.values).length
      !== MAIN_WIRE_SCIENTIFIC_OBSERVABLE_CATALOG_V1.length
  ) throw new Error("Worker returned an invalid research-control fork frame");

  for (const definition of MAIN_WIRE_SCIENTIFIC_OBSERVABLE_CATALOG_V1) {
    const value = frame.values[definition.observableId];
    if (
      !isRecordV0(value)
      || value.observableId !== definition.observableId
    ) throw new Error(`fork frame lacks ${definition.observableId}`);

    if (definition.sourceKind === "accepted-state") {
      const sourceValue = sourceBoundary.values[definition.observableId];
      if (
        value.availability !== "available"
        || typeof value.value !== "number"
        || !Number.isFinite(value.value)
        || value.quality !== "authoritative-state"
        || !isRecordV0(sourceValue)
        || sourceValue.observableId !== definition.observableId
        || sourceValue.availability !== "available"
        || typeof sourceValue.value !== "number"
        || !Number.isFinite(sourceValue.value)
        || sourceValue.quality !== "authoritative-state"
        || value.value !== sourceValue.value
      ) throw new Error(`fork frame corrupted state-owned ${definition.observableId}`);
      continue;
    }
    if (definition.sourceKind === "capability-placeholder") {
      if (
        value.availability !== "not-modeled"
        || value.value !== null
        || value.quality !== "not-assessed"
      ) throw new Error(`fork frame corrupted capability ${definition.observableId}`);
      continue;
    }
    if (definition.observableId === "conservation.total_blood_volume.error") {
      if (
        value.availability !== "available"
        || value.value !== 0
        || value.quality !== "solver-diagnostic"
      ) throw new Error("fork frame corrupted fixed-TBV conservation evidence");
      continue;
    }
    if (
      value.availability !== "not-evaluated-at-accepted-state"
      || value.value !== null
      || value.quality !== "not-assessed"
    ) {
      throw new Error(
        `fork frame evaluated ${definition.observableId} with stale losses`,
      );
    }
  }
}

function commandFailure(
  command: string,
  response: MainWireScientificWorkerResponseV1,
): Error {
  if (!response.ok) {
    return new Error(`${command} failed: ${response.error.code}: ${response.error.message}`);
  }
  return new Error(`${command} returned an incompatible success payload`);
}

function draftFromContext(
  context: ScientificResearchControlContextV0,
): ControlDraftV0 {
  return Object.freeze({
    systemic:
      context.controlState.controls[
        "circulation.systemic-vascular-resistance-scale"
      ],
    pulmonary:
      context.controlState.controls[
        "circulation.pulmonary-vascular-resistance-scale"
      ],
    venousTone:
      context.controlState.controls["circulation.venous-tone"],
    arterialStiffness:
      context.controlState.controls["circulation.arterial-stiffness"],
    peepCmH2O:
      context.controlState.controls["ventilation.peep-cm-h2o"],
    pericardialFluidVolumeMl:
      context.controlState.controls[
        "pericardium.prescribed-fluid-volume-ml"
      ],
  });
}

function targetValuesFromDraftV0(draft: ControlDraftV0) {
  return Object.freeze({
    "circulation.systemic-vascular-resistance-scale": draft.systemic,
    "circulation.pulmonary-vascular-resistance-scale": draft.pulmonary,
    "circulation.venous-tone": draft.venousTone,
    "circulation.arterial-stiffness": draft.arterialStiffness,
    "ventilation.peep-cm-h2o": draft.peepCmH2O,
    "pericardium.prescribed-fluid-volume-ml":
      draft.pericardialFluidVolumeMl,
  });
}

function draftPatchForControlValueV0(
  controlId: MainWireScientificResearchControlIdV0,
  value: number,
): Partial<ControlDraftV0> | null {
  const allowed = MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_VALUE_DOMAINS_V0[
    controlId
  ].allowedValues as readonly number[];
  if (!Number.isFinite(value) || !allowed.includes(value)) return null;
  switch (controlId) {
    case "circulation.systemic-vascular-resistance-scale":
      return { systemic: value as MainWireScientificResearchControlScaleV0 };
    case "circulation.pulmonary-vascular-resistance-scale":
      return { pulmonary: value as MainWireScientificResearchControlScaleV0 };
    case "circulation.venous-tone":
      return { venousTone: value };
    case "circulation.arterial-stiffness":
      return { arterialStiffness: value };
    case "ventilation.peep-cm-h2o":
      return { peepCmH2O: value };
    case "pericardium.prescribed-fluid-volume-ml":
      return { pericardialFluidVolumeMl: value };
  }
}

function draftDiffersFromSource(
  draft: ControlDraftV0,
  source: ScientificWorkbenchResearchControlSourceV0,
): boolean {
  const controls = source.context.controlState.controls;
  return draft.systemic
      !== controls["circulation.systemic-vascular-resistance-scale"]
    || draft.pulmonary
      !== controls["circulation.pulmonary-vascular-resistance-scale"]
    || draft.venousTone !== controls["circulation.venous-tone"]
    || draft.arterialStiffness !== controls["circulation.arterial-stiffness"]
    || draft.peepCmH2O !== controls["ventilation.peep-cm-h2o"]
    || draft.pericardialFluidVolumeMl
      !== controls["pericardium.prescribed-fluid-volume-ml"];
}

function draftDiffersFromContext(
  draft: ControlDraftV0,
  context: ScientificResearchControlContextV0,
): boolean {
  const controls = context.controlState.controls;
  return draft.systemic
      !== controls["circulation.systemic-vascular-resistance-scale"]
    || draft.pulmonary
      !== controls["circulation.pulmonary-vascular-resistance-scale"]
    || draft.venousTone !== controls["circulation.venous-tone"]
    || draft.arterialStiffness !== controls["circulation.arterial-stiffness"]
    || draft.peepCmH2O !== controls["ventilation.peep-cm-h2o"]
    || draft.pericardialFluidVolumeMl
      !== controls["pericardium.prescribed-fluid-volume-ml"];
}

function parseControlScale(value: string): MainWireScientificResearchControlScaleV0 {
  const numeric = Number(value);
  const match = MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_SCALE_VALUES_V0.find(
    (scale) => scale === numeric,
  );
  if (match === undefined) throw new Error("unsupported research-control scale");
  return match;
}

function shortControlDigestV0(value: string): string {
  return `${value.slice(0, 12)}…`;
}

export function remainingScientificWorkbenchRegularRequestCountV0(
  consumedRequestCount: number,
): number {
  if (!Number.isSafeInteger(consumedRequestCount) || consumedRequestCount < 0) {
    throw new Error("consumed request count must be a non-negative safe integer");
  }
  return Math.max(
    0,
    SCIENTIFIC_WORKBENCH_REQUEST_CAPACITY_V0 - consumedRequestCount,
  );
}

export function reserveScientificWorkbenchRequestIdentityV0(
  consumedRequestCount: number,
  recoveryCommand = false,
): Readonly<{
  consumedRequestCount: number;
  remainingRegularRequestCount: number;
}> {
  const remaining = remainingScientificWorkbenchRegularRequestCountV0(
    consumedRequestCount,
  );
  if (!recoveryCommand && remaining === 0) {
    throw new Error(
      "scientific transition request capacity is exhausted; reset remains available",
    );
  }
  const nextConsumedRequestCount = consumedRequestCount + 1;
  if (!Number.isSafeInteger(nextConsumedRequestCount)) {
    throw new Error("scientific transition request identity count overflowed");
  }
  return Object.freeze({
    consumedRequestCount: nextConsumedRequestCount,
    remainingRegularRequestCount:
      remainingScientificWorkbenchRegularRequestCountV0(
        nextConsumedRequestCount,
      ),
  });
}

function nextTransitionSessionId(): string {
  transitionSessionOrdinal += 1;
  return `scientific-control-${Date.now().toString(36)}-${transitionSessionOrdinal}`;
}

function monotonicNowMs(): number {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

export function scientificWorkbenchLiveChunkDelayMsV0(
  commandElapsedMs: number,
  timeScale: number,
): number {
  if (!Number.isFinite(commandElapsedMs) || commandElapsedMs < 0) {
    throw new Error("live command elapsed time must be non-negative and finite");
  }
  assertLivePlaybackTimeScaleV0(timeScale);
  return Math.max(0, LIVE_SIMULATED_CHUNK_MS / timeScale - commandElapsedMs);
}

function assertLivePlaybackTimeScaleV0(value: number): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error("live playback time scale must be positive and finite");
  }
}

function delay(durationMs: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, durationMs));
}

function readLiveIntentV0(
  ref: React.MutableRefObject<LiveIntentV0>,
): LiveIntentV0 {
  return ref.current;
}

function isRecordV0(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function errorMessageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
