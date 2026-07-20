import type {
  ScientificWorkbenchResearchControlSnapshotV0,
  ScientificWorkbenchResearchControlStoreV0,
} from "@/components/scientificWorkbench/ScientificWorkbenchResearchControlStoreV0";
import {
  MAIN_WIRE_SCIENTIFIC_QUICK_CHECK_V1_ID,
  evaluateMainWireScientificQuickCheckV1,
  type MainWireScientificQuickCheckInputV1,
  type MainWireScientificQuickCheckResultV1,
  type MainWireScientificQuickCheckSourceIdentityV1,
} from "@/components/scientificVerification/MainWireScientificQuickCheckDomainV1";
import {
  sameSimulationReleaseRef,
  SHA256_HEX_PATTERN,
  type SimulationReleaseRef,
} from "@/engine/scientific/release";

export const MAIN_WIRE_SCIENTIFIC_QUICK_CHECK_COORDINATOR_V1_ID =
  "main-wire-scientific-quick-check-coordinator-v1" as const;

export type MainWireScientificQuickCheckCoordinatorStatusV1 =
  | "checking"
  | "findings"
  | "verification-error";

export type MainWireScientificQuickCheckRequestedIdentityV1 = Readonly<{
  releaseRef: SimulationReleaseRef;
  committedControlStateSha256: string;
}>;

export type MainWireScientificQuickCheckCoordinatorSnapshotV1 = Readonly<{
  coordinatorId:
    typeof MAIN_WIRE_SCIENTIFIC_QUICK_CHECK_COORDINATOR_V1_ID;
  checkId: typeof MAIN_WIRE_SCIENTIFIC_QUICK_CHECK_V1_ID;
  status: MainWireScientificQuickCheckCoordinatorStatusV1;
  requestSequence: number;
  requestedIdentity: MainWireScientificQuickCheckRequestedIdentityV1;
  result: MainWireScientificQuickCheckResultV1 | null;
  errorMessage: string | null;
  cacheHit: boolean;
  waitingForCommittedEvidence: boolean;
}>;

export type MainWireScientificQuickCheckEvaluatorV1 = (
  input: MainWireScientificQuickCheckInputV1,
) => MainWireScientificQuickCheckResultV1
  | Promise<MainWireScientificQuickCheckResultV1>;

export type MainWireScientificQuickCheckControlStorePortV1 = Pick<
  ScientificWorkbenchResearchControlStoreV0,
  "getSnapshot" | "subscribe"
>;

export type MainWireScientificQuickCheckCoordinatorV1 = Readonly<{
  getSnapshot: () => MainWireScientificQuickCheckCoordinatorSnapshotV1;
  subscribe: (listener: () => void) => () => void;
  refresh: () => void;
  dispose: () => void;
}>;

export type MainWireScientificQuickCheckCoordinatorOptionsV1 = Readonly<{
  evaluate?: MainWireScientificQuickCheckEvaluatorV1;
  maximumCacheEntries?: number;
}>;

type SelectedRequestV1 = Readonly<{
  requestedIdentity: MainWireScientificQuickCheckRequestedIdentityV1;
  readyInput: MainWireScientificQuickCheckInputV1 | null;
  requestKey: string;
  cacheKey: string | null;
}>;

const DEFAULT_MAXIMUM_CACHE_ENTRIES_V1 = 16;

/**
 * Adapts the mutable Workbench presentation store to immutable Quick Check
 * requests. Draft controls are deliberately absent from request selection.
 */
export function createMainWireScientificQuickCheckCoordinatorV1(
  store: MainWireScientificQuickCheckControlStorePortV1,
  options: MainWireScientificQuickCheckCoordinatorOptionsV1 = {},
): MainWireScientificQuickCheckCoordinatorV1 {
  const evaluate = options.evaluate ?? evaluateMainWireScientificQuickCheckV1;
  const maximumCacheEntries = options.maximumCacheEntries
    ?? DEFAULT_MAXIMUM_CACHE_ENTRIES_V1;
  if (!Number.isSafeInteger(maximumCacheEntries) || maximumCacheEntries < 1) {
    throw new Error(
      "Quick Check maximum cache entries must be a positive safe integer",
    );
  }

  const listeners = new Set<() => void>();
  const cache = new Map<string, MainWireScientificQuickCheckResultV1>();
  let disposed = false;
  let requestSequence = 0;
  let activeRequestKey: string | null = null;
  let coordinatorSnapshot: MainWireScientificQuickCheckCoordinatorSnapshotV1;

  const initial = selectRequestV1(store.getSnapshot());
  coordinatorSnapshot = checkingSnapshotV1(
    ++requestSequence,
    initial.requestedIdentity,
    initial.readyInput === null,
  );

  const notify = (): void => {
    for (const listener of [...listeners]) listener();
  };
  const publish = (
    next: MainWireScientificQuickCheckCoordinatorSnapshotV1,
  ): void => {
    if (disposed || coordinatorSnapshot === next) return;
    coordinatorSnapshot = next;
    notify();
  };

  const drive = (): void => {
    if (disposed) return;
    let selected: SelectedRequestV1;
    try {
      selected = selectRequestV1(store.getSnapshot());
    } catch (error) {
      const sequence = ++requestSequence;
      activeRequestKey = `selection-error:${sequence}`;
      publish(errorSnapshotV1(
        sequence,
        fallbackRequestedIdentityV1(store.getSnapshot()),
        errorMessageV1(error),
      ));
      return;
    }

    if (selected.requestKey === activeRequestKey) return;
    activeRequestKey = selected.requestKey;
    const sequence = ++requestSequence;

    if (selected.readyInput === null || selected.cacheKey === null) {
      publish(checkingSnapshotV1(
        sequence,
        selected.requestedIdentity,
        true,
      ));
      return;
    }

    const cached = cache.get(selected.cacheKey);
    if (cached !== undefined) {
      touchCacheEntryV1(cache, selected.cacheKey, cached);
      publish(findingsSnapshotV1(
        sequence,
        selected.requestedIdentity,
        cached,
        true,
      ));
      return;
    }

    publish(checkingSnapshotV1(
      sequence,
      selected.requestedIdentity,
      false,
    ));
    Promise.resolve()
      .then(() => evaluate(selected.readyInput!))
      .then((result) => {
        if (disposed
            || sequence !== requestSequence
            || activeRequestKey !== selected.requestKey) return;
        assertEvaluatorResultV1(result, selected.readyInput!);
        addCacheEntryV1(
          cache,
          selected.cacheKey!,
          result,
          maximumCacheEntries,
        );
        publish(findingsSnapshotV1(
          sequence,
          selected.requestedIdentity,
          result,
          false,
        ));
      })
      .catch((error) => {
        if (disposed
            || sequence !== requestSequence
            || activeRequestKey !== selected.requestKey) return;
        publish(errorSnapshotV1(
          sequence,
          selected.requestedIdentity,
          errorMessageV1(error),
        ));
      });
  };

  const unsubscribeStore = store.subscribe(drive);
  drive();

  return Object.freeze({
    getSnapshot: () => coordinatorSnapshot,
    subscribe: (listener) => {
      if (disposed) return () => undefined;
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    refresh: () => {
      if (disposed) return;
      activeRequestKey = null;
      drive();
    },
    dispose: () => {
      if (disposed) return;
      disposed = true;
      requestSequence += 1;
      activeRequestKey = null;
      listeners.clear();
      cache.clear();
      unsubscribeStore();
    },
  });
}

function selectRequestV1(
  snapshot: ScientificWorkbenchResearchControlSnapshotV0,
): SelectedRequestV1 {
  const frames = snapshot.frames;
  const fallbackFrame = frames.at(-1) ?? snapshot.source.frames.at(-1);
  if (fallbackFrame === undefined) {
    throw new Error("Workbench Quick Check source has no observable frame");
  }
  const requestedControlStateSha256 = snapshot.targetControlStateSha256
    ?? snapshot.provenance.displayedControlStateSha256;
  if (!SHA256_HEX_PATTERN.test(requestedControlStateSha256)) {
    throw new Error("Workbench committed control state is not a SHA-256 digest");
  }
  const requestedIdentity = freezeRequestedIdentityV1({
    releaseRef: fallbackFrame.releaseRef,
    committedControlStateSha256: requestedControlStateSha256,
  });
  const displayedMatchesCommitted =
    snapshot.provenance.displayedControlStateSha256
      === requestedControlStateSha256;
  if (!displayedMatchesCommitted) {
    return Object.freeze({
      requestedIdentity,
      readyInput: null,
      requestKey: [
        "waiting",
        releaseKeyV1(requestedIdentity.releaseRef),
        requestedControlStateSha256,
      ].join(":"),
      cacheKey: null,
    });
  }
  if (frames.length === 0) {
    throw new Error("Workbench displayed evidence has no observable frames");
  }
  const first = frames[0]!;
  const last = frames.at(-1)!;
  if (!sameSimulationReleaseRef(first.releaseRef, fallbackFrame.releaseRef)) {
    throw new Error("Workbench displayed frame release identity is inconsistent");
  }
  const source: MainWireScientificQuickCheckSourceIdentityV1 = Object.freeze({
    releaseRef: Object.freeze({ ...first.releaseRef }),
    committedControlStateSha256: requestedControlStateSha256,
    parameterEpoch: snapshot.provenance.displayedParameterEpoch,
    displayedFrameOwner: snapshot.provenance.displayedFrameOwner,
    firstRevision: first.revision,
    finalRevision: last.revision,
    firstAcceptedTimeSec: first.acceptedTimeSec,
    finalAcceptedTimeSec: last.acceptedTimeSec,
  });
  const readyInput: MainWireScientificQuickCheckInputV1 = Object.freeze({
    source,
    displayedEvidence: snapshot.provenance.displayedEvidence,
    frames,
  });
  const cacheKey = [
    releaseKeyV1(source.releaseRef),
    source.committedControlStateSha256,
    source.parameterEpoch,
    snapshot.provenance.displayedEvidence,
    source.firstRevision,
    source.finalRevision,
    frames.length,
  ].join(":");
  return Object.freeze({
    requestedIdentity,
    readyInput,
    requestKey: `ready:${cacheKey}`,
    cacheKey,
  });
}

function checkingSnapshotV1(
  requestSequence: number,
  requestedIdentity: MainWireScientificQuickCheckRequestedIdentityV1,
  waitingForCommittedEvidence: boolean,
): MainWireScientificQuickCheckCoordinatorSnapshotV1 {
  return Object.freeze({
    coordinatorId: MAIN_WIRE_SCIENTIFIC_QUICK_CHECK_COORDINATOR_V1_ID,
    checkId: MAIN_WIRE_SCIENTIFIC_QUICK_CHECK_V1_ID,
    status: "checking",
    requestSequence,
    requestedIdentity,
    result: null,
    errorMessage: null,
    cacheHit: false,
    waitingForCommittedEvidence,
  });
}

function findingsSnapshotV1(
  requestSequence: number,
  requestedIdentity: MainWireScientificQuickCheckRequestedIdentityV1,
  result: MainWireScientificQuickCheckResultV1,
  cacheHit: boolean,
): MainWireScientificQuickCheckCoordinatorSnapshotV1 {
  return Object.freeze({
    coordinatorId: MAIN_WIRE_SCIENTIFIC_QUICK_CHECK_COORDINATOR_V1_ID,
    checkId: MAIN_WIRE_SCIENTIFIC_QUICK_CHECK_V1_ID,
    status: "findings",
    requestSequence,
    requestedIdentity,
    result,
    errorMessage: null,
    cacheHit,
    waitingForCommittedEvidence: false,
  });
}

function errorSnapshotV1(
  requestSequence: number,
  requestedIdentity: MainWireScientificQuickCheckRequestedIdentityV1,
  errorMessage: string,
): MainWireScientificQuickCheckCoordinatorSnapshotV1 {
  return Object.freeze({
    coordinatorId: MAIN_WIRE_SCIENTIFIC_QUICK_CHECK_COORDINATOR_V1_ID,
    checkId: MAIN_WIRE_SCIENTIFIC_QUICK_CHECK_V1_ID,
    status: "verification-error",
    requestSequence,
    requestedIdentity,
    result: null,
    errorMessage,
    cacheHit: false,
    waitingForCommittedEvidence: false,
  });
}

function fallbackRequestedIdentityV1(
  snapshot: ScientificWorkbenchResearchControlSnapshotV0,
): MainWireScientificQuickCheckRequestedIdentityV1 {
  const frame = snapshot.frames.at(-1) ?? snapshot.source.frames.at(-1);
  return freezeRequestedIdentityV1({
    releaseRef: frame?.releaseRef ?? Object.freeze({
      id: "unavailable",
      version: "unavailable",
      sha256: "0".repeat(64),
    }),
    committedControlStateSha256: snapshot.targetControlStateSha256
      ?? snapshot.provenance.displayedControlStateSha256,
  });
}

function freezeRequestedIdentityV1(
  identity: MainWireScientificQuickCheckRequestedIdentityV1,
): MainWireScientificQuickCheckRequestedIdentityV1 {
  return Object.freeze({
    releaseRef: Object.freeze({ ...identity.releaseRef }),
    committedControlStateSha256: identity.committedControlStateSha256,
  });
}

function assertEvaluatorResultV1(
  result: MainWireScientificQuickCheckResultV1,
  input: MainWireScientificQuickCheckInputV1,
): void {
  if (result.checkId !== MAIN_WIRE_SCIENTIFIC_QUICK_CHECK_V1_ID
      || result.status !== "findings") {
    throw new Error("Quick Check evaluator returned an unsupported result");
  }
  if (!sameSimulationReleaseRef(
    result.source.releaseRef,
    input.source.releaseRef,
  ) || result.source.committedControlStateSha256
      !== input.source.committedControlStateSha256) {
    throw new Error("Quick Check evaluator returned stale source identity");
  }
}

function addCacheEntryV1(
  cache: Map<string, MainWireScientificQuickCheckResultV1>,
  key: string,
  result: MainWireScientificQuickCheckResultV1,
  maximumCacheEntries: number,
): void {
  touchCacheEntryV1(cache, key, result);
  while (cache.size > maximumCacheEntries) {
    const oldest = cache.keys().next().value as string | undefined;
    if (oldest === undefined) break;
    cache.delete(oldest);
  }
}

function touchCacheEntryV1(
  cache: Map<string, MainWireScientificQuickCheckResultV1>,
  key: string,
  result: MainWireScientificQuickCheckResultV1,
): void {
  cache.delete(key);
  cache.set(key, result);
}

function releaseKeyV1(releaseRef: SimulationReleaseRef): string {
  return `${releaseRef.id}@${releaseRef.version}#${releaseRef.sha256}`;
}

function errorMessageV1(error: unknown): string {
  return error instanceof Error ? error.message : "Quick Check failed";
}
