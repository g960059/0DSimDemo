import * as React from "react";

import type {
  MainWireScientificResearchControlScaleV0,
} from "@/engine/scientific/controls/MainWireScientificResearchControlCatalogV0";
import type {
  MainWireScientificObservableFrameV1,
} from "@/engine/scientific/observables";
import type {
  ScientificResearchControlContextV0,
} from "@/engine/scientific/worker";

export type ScientificWorkbenchResearchTransitionModeV0 = "steady" | "live";

export type ScientificWorkbenchResearchTransitionPhaseV0 =
  | "idle"
  | "steady-forking"
  | "steady-settling"
  | "steady-capturing"
  | "live-forking"
  | "live-retargeting"
  | "live-running"
  | "live-pause-requested"
  | "live-paused"
  | "resetting"
  | "failed"
  | "reload-required";

export type ScientificWorkbenchResearchControlSourceV0 = Readonly<{
  sessionId: string;
  context: ScientificResearchControlContextV0;
  frames: readonly MainWireScientificObservableFrameV1[];
}>;

export type ScientificWorkbenchResearchControlCandidateV0 = Readonly<{
  sessionId: string;
  context: ScientificResearchControlContextV0;
  boundaryFrame: MainWireScientificObservableFrameV1;
}>;

export type ScientificWorkbenchResearchControlDraftV0 = Readonly<{
  systemic: MainWireScientificResearchControlScaleV0;
  pulmonary: MainWireScientificResearchControlScaleV0;
}>;

export type ScientificWorkbenchDisplayedEvidenceV0 =
  | "open-transient-no-periodic-claim"
  | "target-period1-and-following-cycle-validated"
  | "retained-period1-source-cycle";

export type ScientificWorkbenchResearchControlProvenanceV0 = Readonly<{
  displayedFrameOwner: "source" | "candidate";
  displayedParameterEpoch: number;
  displayedControlStateSha256: string;
  displayedEvidence: ScientificWorkbenchDisplayedEvidenceV0;
}>;

export type ScientificWorkbenchResearchControlActionsV0 = Readonly<{
  setSystemicScale: (
    value: MainWireScientificResearchControlScaleV0,
  ) => void;
  setPulmonaryScale: (
    value: MainWireScientificResearchControlScaleV0,
  ) => void;
  commitSystemicScale: (
    value: MainWireScientificResearchControlScaleV0,
  ) => void;
  commitPulmonaryScale: (
    value: MainWireScientificResearchControlScaleV0,
  ) => void;
  setMode: (mode: ScientificWorkbenchResearchTransitionModeV0) => void;
  applyTransition: () => void;
  cancelSteady: () => void;
  pauseLive: () => void;
  resumeLive: () => void;
  resetLiveOrFailure: () => void;
}>;

export type ScientificWorkbenchResearchControlSnapshotV0 = Readonly<{
  ownerConnected: boolean;
  phase: ScientificWorkbenchResearchTransitionPhaseV0;
  mode: ScientificWorkbenchResearchTransitionModeV0;
  source: ScientificWorkbenchResearchControlSourceV0;
  candidate: ScientificWorkbenchResearchControlCandidateV0 | null;
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
  draft: ScientificWorkbenchResearchControlDraftV0;
  busy: boolean;
  noChange: boolean;
  steadyActive: boolean;
  liveActive: boolean;
  requestCapacityExhausted: boolean;
  provenance: ScientificWorkbenchResearchControlProvenanceV0;
  actions: ScientificWorkbenchResearchControlActionsV0;
}>;

export type ScientificWorkbenchResearchControlSnapshotInputV0 = Omit<
  ScientificWorkbenchResearchControlSnapshotV0,
  "actions" | "ownerConnected"
>;

export type ScientificWorkbenchResearchControlOwnerActionsV0 =
  ScientificWorkbenchResearchControlActionsV0;

export type ScientificWorkbenchResearchControlOwnerActionRefV0 = Readonly<{
  current: ScientificWorkbenchResearchControlOwnerActionsV0 | null;
}>;

export type ScientificWorkbenchResearchControlStoreV0 = Readonly<{
  actions: ScientificWorkbenchResearchControlActionsV0;
  getSnapshot: () => ScientificWorkbenchResearchControlSnapshotV0;
  getFramesSnapshot: () => readonly MainWireScientificObservableFrameV1[];
  subscribe: (listener: () => void) => () => void;
  subscribeFrames: (listener: () => void) => () => void;
  connectOwner: (
    ownerToken: symbol,
    actionRef: ScientificWorkbenchResearchControlOwnerActionRefV0,
  ) => () => void;
  publishOwnerSnapshot: (
    ownerToken: symbol,
    snapshot: ScientificWorkbenchResearchControlSnapshotInputV0,
  ) => void;
}>;

/**
 * A small external store shared by the single Worker-owning controller and any
 * number of graph/controller/note mirrors. Commands are stable proxy functions;
 * only the connected owner can provide their implementation. The store never
 * synthesizes scientific values when the owner disconnects: it retains the
 * last immutable frame snapshot and marks the command surface disconnected.
 */
export function createScientificWorkbenchResearchControlStoreV0(
  initialSource: ScientificWorkbenchResearchControlSourceV0,
  remainingRegularRequestCount: number,
): ScientificWorkbenchResearchControlStoreV0 {
  if (
    !Number.isSafeInteger(remainingRegularRequestCount)
    || remainingRegularRequestCount < 0
  ) {
    throw new Error(
      "remaining scientific request count must be a non-negative safe integer",
    );
  }

  const listeners = new Set<() => void>();
  const frameListeners = new Set<() => void>();
  let owner: Readonly<{
    token: symbol;
    actionRef: ScientificWorkbenchResearchControlOwnerActionRefV0;
  }> | null = null;
  let lastPublishedInput: ScientificWorkbenchResearchControlSnapshotInputV0
    | null = null;

  const invoke = <K extends keyof ScientificWorkbenchResearchControlOwnerActionsV0>(
    action: K,
    ...args: Parameters<ScientificWorkbenchResearchControlOwnerActionsV0[K]>
  ): void => {
    const implementation = owner?.actionRef.current?.[action];
    if (implementation === undefined) {
      throw new Error(
        `scientific research-control owner is not connected for ${action}`,
      );
    }
    (implementation as (...values: typeof args) => void)(...args);
  };

  const actions: ScientificWorkbenchResearchControlActionsV0 = Object.freeze({
    setSystemicScale: (value) => invoke("setSystemicScale", value),
    setPulmonaryScale: (value) => invoke("setPulmonaryScale", value),
    commitSystemicScale: (value) => invoke("commitSystemicScale", value),
    commitPulmonaryScale: (value) => invoke("commitPulmonaryScale", value),
    setMode: (mode) => invoke("setMode", mode),
    applyTransition: () => invoke("applyTransition"),
    cancelSteady: () => invoke("cancelSteady"),
    pauseLive: () => invoke("pauseLive"),
    resumeLive: () => invoke("resumeLive"),
    resetLiveOrFailure: () => invoke("resetLiveOrFailure"),
  });

  const draft = draftFromSourceV0(initialSource);
  let snapshot = freezeSnapshotV0({
    ownerConnected: false,
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
    remainingRegularRequestCount,
    message: "Waiting for the release-bound scientific controller.",
    errorMessage: null,
    draft,
    busy: false,
    noChange: true,
    steadyActive: false,
    liveActive: false,
    requestCapacityExhausted: remainingRegularRequestCount === 0,
    provenance: Object.freeze({
      displayedFrameOwner: "source",
      displayedParameterEpoch: initialSource.context.parameterEpoch,
      displayedControlStateSha256:
        initialSource.context.controlState.targetStateSha256,
      displayedEvidence: "retained-period1-source-cycle",
    }),
    actions,
  });

  const notify = (): void => {
    for (const listener of [...listeners]) listener();
  };

  return Object.freeze({
    actions,
    getSnapshot: () => snapshot,
    getFramesSnapshot: () => snapshot.frames,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    subscribeFrames: (listener) => {
      frameListeners.add(listener);
      return () => frameListeners.delete(listener);
    },
    connectOwner: (ownerToken, actionRef) => {
      if (owner !== null && owner.token !== ownerToken) {
        throw new Error("scientific research-control store already has an owner");
      }
      owner = Object.freeze({ token: ownerToken, actionRef });
      lastPublishedInput = null;
      if (!snapshot.ownerConnected) {
        snapshot = freezeSnapshotV0({ ...snapshot, ownerConnected: true });
        notify();
      }
      return () => {
        if (owner?.token !== ownerToken) return;
        owner = null;
        lastPublishedInput = null;
        if (snapshot.ownerConnected) {
          snapshot = freezeSnapshotV0({
            ...snapshot,
            ownerConnected: false,
            message: "The release-bound scientific controller disconnected.",
          });
          notify();
        }
      };
    },
    publishOwnerSnapshot: (ownerToken, next) => {
      if (owner?.token !== ownerToken) {
        throw new Error(
          "only the connected scientific research-control owner may publish",
        );
      }
      if (lastPublishedInput === next) return;
      const previousFrames = snapshot.frames;
      snapshot = freezeSnapshotV0({
        ...next,
        ownerConnected: true,
        actions,
      });
      lastPublishedInput = next;
      notify();
      if (snapshot.frames !== previousFrames) {
        for (const listener of [...frameListeners]) listener();
      }
    },
  });
}

export function useScientificWorkbenchResearchControlSnapshotV0(
  store: ScientificWorkbenchResearchControlStoreV0,
): ScientificWorkbenchResearchControlSnapshotV0 {
  return React.useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot,
  );
}

/** Frame-only subscription used by graphs so 30 fps frame publication is not
 * defeated by higher-frequency status/in-flight controller updates. */
export function useScientificWorkbenchResearchControlFramesV0(
  store: ScientificWorkbenchResearchControlStoreV0,
): readonly MainWireScientificObservableFrameV1[] {
  return React.useSyncExternalStore(
    store.subscribeFrames,
    store.getFramesSnapshot,
    store.getFramesSnapshot,
  );
}

function freezeSnapshotV0(
  snapshot: ScientificWorkbenchResearchControlSnapshotV0,
): ScientificWorkbenchResearchControlSnapshotV0 {
  return Object.freeze({
    ...snapshot,
    draft: Object.freeze({ ...snapshot.draft }),
    provenance: Object.freeze({ ...snapshot.provenance }),
  });
}

function draftFromSourceV0(
  source: ScientificWorkbenchResearchControlSourceV0,
): ScientificWorkbenchResearchControlDraftV0 {
  return Object.freeze({
    systemic:
      source.context.controlState.controls[
        "circulation.systemic-vascular-resistance-scale"
      ],
    pulmonary:
      source.context.controlState.controls[
        "circulation.pulmonary-vascular-resistance-scale"
      ],
  });
}
