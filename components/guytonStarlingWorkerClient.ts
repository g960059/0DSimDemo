import type {
  GuytonStarlingBrowserTiming,
  GuytonStarlingWorkerMessage,
  StarlingSweepRequest,
} from "../engine/guytonStarling";

export type GuytonStarlingWorkerLike = {
  onmessage: ((event: MessageEvent<GuytonStarlingWorkerMessage>) => void) | null;
  onerror: ((event: ErrorEvent) => void) | null;
  postMessage: (request: StarlingSweepRequest) => void;
  terminate: () => void;
};

export type GuytonStarlingWorkerSubscription = {
  onStart?: () => void;
  onMessage: (message: GuytonStarlingWorkerMessage) => void;
  onError?: (message: string) => void;
  onDone?: () => void;
};

export type GuytonStarlingWorkerClientOptions = {
  createWorker?: () => GuytonStarlingWorkerLike;
  delayMs?: number;
  workerMode?: "persistent" | "per-request";
  idleTimeoutMs?: number;
};

export type GuytonStarlingBrowserTimingOptions = {
  createWorker?: () => GuytonStarlingWorkerLike;
};

type Subscriber = GuytonStarlingWorkerSubscription;

type InFlightEntry = {
  request: StarlingSweepRequest;
  subscribers: Set<Subscriber>;
  messages: GuytonStarlingWorkerMessage[];
  started: boolean;
  doneNotified: boolean;
  timer?: ReturnType<typeof setTimeout>;
  worker?: GuytonStarlingWorkerLike;
  workerMode: "persistent" | "per-request";
  idleTimeoutMs: number;
};

const DEFAULT_IDLE_TIMEOUT_MS = 60_000;
const inFlightBySignature = new Map<string, InFlightEntry>();
let persistentWorker: GuytonStarlingWorkerLike | undefined;
let persistentIdleTimer: ReturnType<typeof setTimeout> | undefined;

export function requestGuytonStarlingWorkerMessages(
  request: StarlingSweepRequest,
  subscription: GuytonStarlingWorkerSubscription,
  options: GuytonStarlingWorkerClientOptions = {},
): () => void {
  const delayMs = options.delayMs ?? 450;
  const workerMode = options.workerMode ?? "persistent";
  const idleTimeoutMs = options.idleTimeoutMs ?? DEFAULT_IDLE_TIMEOUT_MS;
  let entry = inFlightBySignature.get(request.signature);

  if (!entry) {
    entry = {
      request,
      subscribers: new Set(),
      messages: [],
      started: false,
      doneNotified: false,
      workerMode,
      idleTimeoutMs,
    };
    inFlightBySignature.set(request.signature, entry);
    entry.timer = setTimeout(() => startEntry(request.signature, options.createWorker), delayMs);
  }

  entry.subscribers.add(subscription);
  for (const message of entry.messages) subscription.onMessage(message);
  if (entry.started) subscription.onStart?.();

  return () => {
    const current = inFlightBySignature.get(request.signature);
    if (!current) return;
    current.subscribers.delete(subscription);
    if (current.subscribers.size > 0) return;
    cleanupEntry(request.signature);
  };
}

export function measureGuytonStarlingBrowserWorkerTiming(
  request: StarlingSweepRequest,
  options: GuytonStarlingBrowserTimingOptions = {},
): Promise<GuytonStarlingBrowserTiming> {
  const started = performanceNow();
  const beforeCreate = performanceNow();
  let worker: GuytonStarlingWorkerLike;
  try {
    worker = options.createWorker ? options.createWorker() : createDefaultWorker();
  } catch (err) {
    return Promise.reject(err instanceof Error ? err : new Error("Steady map worker unavailable"));
  }
  const afterCreate = performanceNow();
  const timing: GuytonStarlingBrowserTiming = {
    workerCreateMs: afterCreate - beforeCreate,
    baseMapMs: null,
    firstProgressMs: null,
    firstFitMs: null,
    finalSweepMs: null,
    totalMs: 0,
  };

  return new Promise((resolve, reject) => {
    let finished = false;
    const finish = (fn: () => void) => {
      if (finished) return;
      finished = true;
      timing.totalMs = performanceNow() - started;
      worker.terminate();
      fn();
    };

    worker.onmessage = (event: MessageEvent<GuytonStarlingWorkerMessage>) => {
      const message = event.data;
      const elapsed = performanceNow() - started;
      if (message.type === "base-map" && timing.baseMapMs === null) {
        timing.baseMapMs = elapsed;
      } else if (message.type === "starling-sweep-progress") {
        if (timing.firstProgressMs === null) timing.firstProgressMs = elapsed;
        const hasFit = Boolean(message.right?.fit || message.left?.fit);
        if (hasFit && timing.firstFitMs === null) timing.firstFitMs = elapsed;
      } else if (message.type === "starling-sweep") {
        timing.finalSweepMs = elapsed;
        finish(() => resolve(timing));
      }
    };
    worker.onerror = (event: ErrorEvent) => {
      finish(() => reject(new Error(event.message || "Starling sweep worker failed")));
    };
    worker.postMessage(request);
  });
}

function startEntry(
  signature: string,
  createWorker: (() => GuytonStarlingWorkerLike) | undefined,
): void {
  const entry = inFlightBySignature.get(signature);
  if (!entry) return;
  entry.timer = undefined;
  entry.started = true;
  notifyStart(entry);

  let worker: GuytonStarlingWorkerLike;
  try {
    worker = entry.workerMode === "persistent"
      ? getPersistentWorker(createWorker, entry.idleTimeoutMs)
      : (createWorker ? createWorker() : createDefaultWorker());
  } catch (err) {
    failEntry(signature, err instanceof Error ? err.message : "Steady map worker unavailable");
    return;
  }

  if (entry.workerMode === "per-request") {
    entry.worker = worker;
    worker.onmessage = (event: MessageEvent<GuytonStarlingWorkerMessage>) => {
      handleWorkerMessage(event.data);
    };
    worker.onerror = (event: ErrorEvent) => {
      failEntry(signature, event.message || "Starling sweep worker failed");
    };
  }
  worker.postMessage(entry.request);
}

function notifyStart(entry: InFlightEntry): void {
  for (const subscriber of entry.subscribers) subscriber.onStart?.();
}

function failEntry(signature: string, message: string): void {
  const entry = inFlightBySignature.get(signature);
  if (!entry) return;
  for (const subscriber of entry.subscribers) {
    subscriber.onError?.(message);
    subscriber.onDone?.();
  }
  cleanupEntry(signature);
}

function cleanupEntry(signature: string): void {
  const entry = inFlightBySignature.get(signature);
  if (!entry) return;
  if (entry.timer) clearTimeout(entry.timer);
  if (entry.workerMode === "per-request") entry.worker?.terminate();
  inFlightBySignature.delete(signature);
  if (entry.workerMode === "persistent") schedulePersistentIdleTermination(entry.idleTimeoutMs);
}

function createDefaultWorker(): GuytonStarlingWorkerLike {
  return new Worker(new URL("../engine/guytonStarlingWorker.ts", import.meta.url), { type: "module" });
}

function getPersistentWorker(
  createWorker: (() => GuytonStarlingWorkerLike) | undefined,
  idleTimeoutMs: number,
): GuytonStarlingWorkerLike {
  if (persistentIdleTimer) {
    clearTimeout(persistentIdleTimer);
    persistentIdleTimer = undefined;
  }
  if (persistentWorker) return persistentWorker;
  const worker = createWorker ? createWorker() : createDefaultWorker();
  persistentWorker = worker;
  worker.onmessage = (event: MessageEvent<GuytonStarlingWorkerMessage>) => {
    handleWorkerMessage(event.data);
  };
  worker.onerror = (event: ErrorEvent) => {
    failAllEntries(event.message || "Starling sweep worker failed");
    disposePersistentWorker();
  };
  schedulePersistentIdleTermination(idleTimeoutMs);
  return worker;
}

function handleWorkerMessage(message: GuytonStarlingWorkerMessage): void {
  const current = inFlightBySignature.get(message.signature);
  if (!current) return;
  current.messages.push(message);
  for (const subscriber of current.subscribers) subscriber.onMessage(message);
  if (message.type === "starling-sweep") {
    notifyDoneOnce(current);
    cleanupEntry(message.signature);
  }
  if (message.type === "starling-sweep-audit") {
    notifyDoneOnce(current);
    cleanupEntry(message.signature);
  }
}

function notifyDoneOnce(entry: InFlightEntry): void {
  if (entry.doneNotified) return;
  entry.doneNotified = true;
  for (const subscriber of entry.subscribers) subscriber.onDone?.();
}

function failAllEntries(message: string): void {
  for (const signature of Array.from(inFlightBySignature.keys())) failEntry(signature, message);
}

function schedulePersistentIdleTermination(idleTimeoutMs: number): void {
  if (!persistentWorker || inFlightBySignature.size > 0) return;
  if (persistentIdleTimer) clearTimeout(persistentIdleTimer);
  persistentIdleTimer = setTimeout(() => {
    if (inFlightBySignature.size > 0) return;
    disposePersistentWorker();
  }, Math.max(0, idleTimeoutMs));
}

function disposePersistentWorker(): void {
  if (persistentIdleTimer) {
    clearTimeout(persistentIdleTimer);
    persistentIdleTimer = undefined;
  }
  persistentWorker?.terminate();
  persistentWorker = undefined;
}

function performanceNow(): number {
  if (typeof performance !== "undefined" && typeof performance.now === "function") return performance.now();
  return Date.now();
}

export function __clearGuytonStarlingWorkerClientForTests(): void {
  for (const signature of inFlightBySignature.keys()) cleanupEntry(signature);
  disposePersistentWorker();
}
