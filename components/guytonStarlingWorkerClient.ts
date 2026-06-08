import type {
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
};

type Subscriber = GuytonStarlingWorkerSubscription;

type InFlightEntry = {
  request: StarlingSweepRequest;
  subscribers: Set<Subscriber>;
  messages: GuytonStarlingWorkerMessage[];
  started: boolean;
  timer?: ReturnType<typeof setTimeout>;
  worker?: GuytonStarlingWorkerLike;
};

const inFlightBySignature = new Map<string, InFlightEntry>();

export function requestGuytonStarlingWorkerMessages(
  request: StarlingSweepRequest,
  subscription: GuytonStarlingWorkerSubscription,
  options: GuytonStarlingWorkerClientOptions = {},
): () => void {
  const delayMs = options.delayMs ?? 450;
  let entry = inFlightBySignature.get(request.signature);

  if (!entry) {
    entry = {
      request,
      subscribers: new Set(),
      messages: [],
      started: false,
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
    worker = createWorker ? createWorker() : createDefaultWorker();
  } catch (err) {
    failEntry(signature, err instanceof Error ? err.message : "Steady map worker unavailable");
    return;
  }

  entry.worker = worker;
  worker.onmessage = (event: MessageEvent<GuytonStarlingWorkerMessage>) => {
    const current = inFlightBySignature.get(signature);
    if (!current) return;
    const message = event.data;
    current.messages.push(message);
    for (const subscriber of current.subscribers) subscriber.onMessage(message);
    if (message.type === "starling-sweep") {
      for (const subscriber of current.subscribers) subscriber.onDone?.();
      cleanupEntry(signature);
    }
  };
  worker.onerror = (event: ErrorEvent) => {
    failEntry(signature, event.message || "Starling sweep worker failed");
  };
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
  entry.worker?.terminate();
  inFlightBySignature.delete(signature);
}

function createDefaultWorker(): GuytonStarlingWorkerLike {
  return new Worker(new URL("../engine/guytonStarlingWorker.ts", import.meta.url), { type: "module" });
}

export function __clearGuytonStarlingWorkerClientForTests(): void {
  for (const signature of inFlightBySignature.keys()) cleanupEntry(signature);
}
