import type { SimSample } from "@/engine/protocol";
import type { ChamberId, PvLoopDebugTraceMode } from "@/types";
import { chamberPVPoint, type PvLoopBeatRange, type PvLoopRawPoint } from "@/components/pvLoopPoints";

export const PV_LOOP_DEBUG_TRACE_MODES: readonly PvLoopDebugTraceMode[] = ["raw", "resampled", "both"];

export type PvLoopDebugPhase =
  | "filling"
  | "atrial-kick"
  | "isovolumic-contraction"
  | "ejection"
  | "isovolumic-relaxation"
  | "transition"
  | "uncertain"
  | "unsupported";

export type PvLoopDebugMarkerKind = "valve" | "qdot-clamp" | "pressure-floor";

export type PvLoopDebugMarker = {
  kind: PvLoopDebugMarkerKind;
  label: string;
  value?: number;
};

export type PvLoopDebugSample = {
  source: "raw";
  chamber: string;
  sourceIndex: number;
  beatSampleIndex: number;
  beatIndex: number;
  beatTheta: number;
  theta: number;
  t: number;
  phi: number;
  point: PvLoopRawPoint;
  phase: PvLoopDebugPhase;
  transitionReason: string;
  markers: PvLoopDebugMarker[];
};

export type PvLoopDebugResampledPoint = {
  source: "resampled";
  chamber: string;
  beatSampleIndex: number;
  beatIndex: number;
  beatTheta: number;
  theta: number;
  t: number;
  phi: number;
  point: PvLoopRawPoint;
  phase: PvLoopDebugPhase;
  transitionReason: string;
  leftSourceIndex: number;
  rightSourceIndex: number;
  markers: PvLoopDebugMarker[];
};

export type PvLoopDebugPoint = PvLoopDebugSample | PvLoopDebugResampledPoint;

export type PvLoopDebugCanvasPoint<T extends PvLoopDebugPoint = PvLoopDebugPoint> = T & {
  x: number;
  y: number;
  label: string;
};

export type PvLoopDebugOptions = {
  enabled: boolean;
  traceMode: PvLoopDebugTraceMode;
};

type ValveName = "MV" | "AoV" | "TV" | "PV";
type ValveEventType = "open" | "close";

type ValveEvent = {
  valve: ValveName;
  eventType: ValveEventType;
  sourceIndex: number;
  timeSec: number;
};

const TRANSITION_GUARD_SEC = 0.012;
const OPEN_THRESHOLD = 0.5;
const PARTIAL_OPEN_EPS = 0.05;
const PRESSURE_DERIVATIVE_EPS_MMHG_PER_SEC = 80 / 133.322387415;
const VOLUME_DERIVATIVE_EPS_ML_PER_SEC = 0.2;
const ATRIAL_KICK_ACTIVATION_OPEN01 = 0.15;
const ATRIAL_KICK_THETA_LATE_MIN = 0.78;
const ATRIAL_KICK_THETA_EARLY_MAX = 0.08;
const QDOT_RAW_POST_DIVERGENCE_MIN = 1e-6;
const CLAMP_IMPULSE_ABS_MIN = 1e-9;
const EPS = 1e-9;

const TRACE_MODE_SET = new Set(PV_LOOP_DEBUG_TRACE_MODES);

const isSupportedPhaseChamber = (chamber: string): chamber is Extract<ChamberId, "LV" | "RV"> => (
  chamber === "LV" || chamber === "RV"
);

const finiteOr = (value: unknown, fallback = 0): number => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
};

const normalizedTheta = (phi: number): number => {
  if (!Number.isFinite(phi)) return 0;
  const theta = phi - Math.floor(phi);
  return theta < 0 ? theta + 1 : theta;
};

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

const sampleValue = (sample: SimSample, key: keyof SimSample, fallback = 0): number => (
  finiteOr(sample[key], fallback)
);

const volumeOf = (sample: SimSample, chamber: string): number => (
  chamber === "RV" ? sampleValue(sample, "VRV") : sampleValue(sample, "VLV")
);

const pressureOf = (sample: SimSample, chamber: string): number => (
  chamber === "RV" ? sampleValue(sample, "RVP") : sampleValue(sample, "LVP")
);

const inletOpen01 = (sample: SimSample, chamber: string): number => (
  chamber === "RV" ? sampleValue(sample, "xiTV") : sampleValue(sample, "xiMV")
);

const outletOpen01 = (sample: SimSample, chamber: string): number => (
  chamber === "RV" ? sampleValue(sample, "xiPV") : sampleValue(sample, "xiAoV")
);

const atrialActivation = (sample: SimSample, chamber: string): number => (
  chamber === "RV" ? sampleValue(sample, "aRA") : sampleValue(sample, "aLA")
);

const isPartialOpen = (value: number): boolean => (
  value > PARTIAL_OPEN_EPS && value < 1 - PARTIAL_OPEN_EPS
);

const derivative = (
  samples: readonly SimSample[],
  index: number,
  project: (sample: SimSample) => number,
): number => {
  if (samples.length < 2) return 0;
  const leftIndex = Math.max(0, index - 1);
  const rightIndex = Math.min(samples.length - 1, index + 1);
  if (leftIndex === rightIndex) return 0;
  const left = samples[leftIndex];
  const right = samples[rightIndex];
  const dt = sampleValue(right, "t") - sampleValue(left, "t");
  if (!Number.isFinite(dt) || Math.abs(dt) <= EPS) return 0;
  return (project(right) - project(left)) / dt;
};

const valveKey = (valve: ValveName): keyof SimSample => {
  if (valve === "MV") return "xiMV";
  if (valve === "AoV") return "xiAoV";
  if (valve === "TV") return "xiTV";
  return "xiPV";
};

const valveBelongsToChamber = (valve: ValveName, chamber: string): boolean => (
  chamber === "LV" ? valve === "MV" || valve === "AoV"
    : chamber === "RV" ? valve === "TV" || valve === "PV"
      : false
);

const detectValveEvents = (samples: readonly SimSample[], sourceIndices: readonly number[]): ValveEvent[] => {
  const valves: ValveName[] = ["MV", "AoV", "TV", "PV"];
  const events: ValveEvent[] = [];
  for (const valve of valves) {
    const key = valveKey(valve);
    for (let i = 1; i < samples.length; i++) {
      const prev = sampleValue(samples[i - 1], key);
      const cur = sampleValue(samples[i], key);
      if (prev < OPEN_THRESHOLD && cur >= OPEN_THRESHOLD) {
        events.push({ valve, eventType: "open", sourceIndex: sourceIndices[i], timeSec: sampleValue(samples[i], "t") });
      } else if (prev >= OPEN_THRESHOLD && cur < OPEN_THRESHOLD) {
        events.push({ valve, eventType: "close", sourceIndex: sourceIndices[i], timeSec: sampleValue(samples[i], "t") });
      }
    }
  }
  return events;
};

const phaseForSample = (
  samples: readonly SimSample[],
  index: number,
  chamber: string,
  valveEvents: readonly ValveEvent[],
): Pick<PvLoopDebugSample, "phase" | "transitionReason"> => {
  if (!isSupportedPhaseChamber(chamber)) {
    return { phase: "unsupported", transitionReason: "debug-phase-support-lv-rv-only" };
  }
  const sample = samples[index];
  const inletOpen = inletOpen01(sample, chamber);
  const outletOpen = outletOpen01(sample, chamber);
  const t = sampleValue(sample, "t");
  const nearEvent = valveEvents.find((event) => (
    valveBelongsToChamber(event.valve, chamber)
    && Math.abs(event.timeSec - t) <= TRANSITION_GUARD_SEC
  ));
  const partialOpen = isPartialOpen(inletOpen) || isPartialOpen(outletOpen);
  if (nearEvent || partialOpen) {
    return {
      phase: "transition",
      transitionReason: nearEvent
        ? `${nearEvent.valve}-${nearEvent.eventType}-within-${TRANSITION_GUARD_SEC}s`
        : "partial-valve-open01",
    };
  }

  const dVdt = derivative(samples, index, (entry) => volumeOf(entry, chamber));
  const dPdt = derivative(samples, index, (entry) => pressureOf(entry, chamber));
  if (!Number.isFinite(inletOpen) || !Number.isFinite(outletOpen) || !Number.isFinite(dVdt) || !Number.isFinite(dPdt)) {
    return { phase: "uncertain", transitionReason: "non-finite-evidence" };
  }

  if (inletOpen >= OPEN_THRESHOLD && outletOpen < OPEN_THRESHOLD && dVdt > VOLUME_DERIVATIVE_EPS_ML_PER_SEC) {
    const theta = normalizedTheta(sampleValue(sample, "phi"));
    const isAtrialKick = atrialActivation(sample, chamber) > ATRIAL_KICK_ACTIVATION_OPEN01
      || theta >= ATRIAL_KICK_THETA_LATE_MIN
      || theta <= ATRIAL_KICK_THETA_EARLY_MAX;
    return { phase: isAtrialKick ? "atrial-kick" : "filling", transitionReason: "" };
  }
  if (outletOpen >= OPEN_THRESHOLD && inletOpen < OPEN_THRESHOLD && dVdt < -VOLUME_DERIVATIVE_EPS_ML_PER_SEC) {
    return { phase: "ejection", transitionReason: "" };
  }
  if (inletOpen < OPEN_THRESHOLD && outletOpen < OPEN_THRESHOLD && dPdt > PRESSURE_DERIVATIVE_EPS_MMHG_PER_SEC) {
    return { phase: "isovolumic-contraction", transitionReason: "" };
  }
  if (inletOpen < OPEN_THRESHOLD && outletOpen < OPEN_THRESHOLD && dPdt < -PRESSURE_DERIVATIVE_EPS_MMHG_PER_SEC) {
    return { phase: "isovolumic-relaxation", transitionReason: "" };
  }
  return { phase: "uncertain", transitionReason: "mixed-evidence" };
};

const markersForSample = (
  sample: SimSample,
  chamber: string,
  sourceIndex: number,
  valveEvents: readonly ValveEvent[],
): PvLoopDebugMarker[] => {
  if (!isSupportedPhaseChamber(chamber)) return [];

  const markers: PvLoopDebugMarker[] = valveEvents
    .filter((event) => event.sourceIndex === sourceIndex && valveBelongsToChamber(event.valve, chamber))
    .map((event) => ({ kind: "valve", label: `${event.valve} ${event.eventType}` }));

  if (chamber === "LV") {
    const qDotRaw = sampleValue(sample, "AoV_qDotRaw");
    const qDotPost = sampleValue(sample, "AoV_qDotPost");
    const qDotDelta = qDotRaw - qDotPost;
    if (sampleValue(sample, "AoV_qDotClampHit01") > 0) {
      markers.push({ kind: "qdot-clamp", label: "AoV qDot clamp hit", value: sampleValue(sample, "AoV_qDotClampHit01") });
    }
    if (Math.abs(qDotDelta) > QDOT_RAW_POST_DIVERGENCE_MIN) {
      markers.push({ kind: "qdot-clamp", label: "AoV qDot raw-post", value: qDotDelta });
    }
    const qDotClampImpulse = sampleValue(sample, "AoV_qDotClampImpulse");
    if (Math.abs(qDotClampImpulse) > CLAMP_IMPULSE_ABS_MIN) {
      markers.push({ kind: "qdot-clamp", label: "AoV qDot impulse", value: qDotClampImpulse });
    }
    const diodeImpulse = sampleValue(sample, "AoV_diodeImpulse");
    if (Math.abs(diodeImpulse) > CLAMP_IMPULSE_ABS_MIN) {
      markers.push({ kind: "qdot-clamp", label: "AoV diode impulse", value: diodeImpulse });
    }
    const flowClampImpulse = sampleValue(sample, "AoV_flowClampImpulse");
    if (Math.abs(flowClampImpulse) > CLAMP_IMPULSE_ABS_MIN) {
      markers.push({ kind: "qdot-clamp", label: "AoV flow clamp impulse", value: flowClampImpulse });
    }
  }

  const floorValue = chamber === "LV" ? sampleValue(sample, "LVPressureFloorHit01") : sampleValue(sample, "RVPressureFloorHit01");
  if (floorValue > 0) {
    markers.push({ kind: "pressure-floor", label: `${chamber} pressure floor`, value: floorValue });
  }

  return markers;
};

const sourceIndicesForRange = (buffer: readonly SimSample[], beatRange: PvLoopBeatRange): number[] => {
  const indices: number[] = [];
  for (let i = beatRange.start; i < beatRange.end && i < buffer.length; i++) {
    if (i >= 0) indices.push(i);
  }
  if (beatRange.closingIndex >= 0 && beatRange.closingIndex < buffer.length) {
    indices.push(beatRange.closingIndex);
  }
  return indices;
};

const fallbackBeatIndexForRange = (buffer: readonly SimSample[], beatRange: PvLoopBeatRange): number => {
  const sample = buffer[beatRange.start] ?? buffer[0];
  return Math.max(0, Math.floor(sampleValue(sample, "phi")));
};

const beatIndexForSample = (sample: SimSample, fallback: number): number => {
  const phi = sampleValue(sample, "phi", Number.NaN);
  return Number.isFinite(phi) ? Math.max(0, Math.floor(phi)) : fallback;
};

export function buildPvLoopDebugSamples(
  buffer: readonly SimSample[],
  beatRange: PvLoopBeatRange,
  chamber: string,
): PvLoopDebugSample[] {
  const sourceIndices = sourceIndicesForRange(buffer, beatRange);
  const samples = sourceIndices.map((index) => buffer[index]).filter(Boolean);
  if (samples.length === 0) return [];

  const firstPhi = sampleValue(samples[0], "phi");
  const lastPhi = sampleValue(samples.at(-1), "phi", firstPhi + 1);
  const phiSpan = Math.max(EPS, lastPhi - firstPhi);
  const fallbackBeatIndex = fallbackBeatIndexForRange(buffer, beatRange);
  const valveEvents = detectValveEvents(samples, sourceIndices);

  return samples.map((sample, beatSampleIndex) => {
    const phi = sampleValue(sample, "phi");
    const phase = phaseForSample(samples, beatSampleIndex, chamber, valveEvents);
    return {
      source: "raw",
      chamber,
      sourceIndex: sourceIndices[beatSampleIndex],
      beatSampleIndex,
      beatIndex: beatIndexForSample(sample, fallbackBeatIndex),
      beatTheta: clamp01((phi - firstPhi) / phiSpan),
      theta: normalizedTheta(phi),
      t: sampleValue(sample, "t"),
      phi,
      point: chamberPVPoint(sample, chamber),
      phase: phase.phase,
      transitionReason: phase.transitionReason,
      markers: markersForSample(sample, chamber, sourceIndices[beatSampleIndex], valveEvents),
    };
  });
}

const interpolateNumber = (a: number, b: number, frac: number): number => a + (b - a) * frac;

export function resamplePvLoopDebugSamples(
  samples: readonly PvLoopDebugSample[],
  targetCount = 120,
): PvLoopDebugResampledPoint[] {
  if (samples.length === 0) return [];
  const count = Math.max(2, Math.min(360, Math.round(targetCount)));
  if (samples.length === 1) {
    const sample = samples[0];
    return [{
      source: "resampled",
      chamber: sample.chamber,
      beatSampleIndex: 0,
      beatIndex: sample.beatIndex,
      beatTheta: sample.beatTheta,
      theta: sample.theta,
      t: sample.t,
      phi: sample.phi,
      point: sample.point,
      phase: sample.phase,
      transitionReason: sample.transitionReason,
      leftSourceIndex: sample.sourceIndex,
      rightSourceIndex: sample.sourceIndex,
      markers: [],
    }];
  }

  const out: PvLoopDebugResampledPoint[] = [];
  for (let i = 0; i < count; i++) {
    const beatTheta = i / (count - 1);
    let rightIndex = samples.findIndex((sample) => sample.beatTheta >= beatTheta);
    if (rightIndex < 0) rightIndex = samples.length - 1;
    const leftIndex = Math.max(0, rightIndex - 1);
    const left = samples[leftIndex];
    const right = samples[rightIndex];
    const span = Math.max(EPS, right.beatTheta - left.beatTheta);
    const frac = rightIndex === leftIndex ? 0 : clamp01((beatTheta - left.beatTheta) / span);
    const nearest = frac < 0.5 ? left : right;
    out.push({
      source: "resampled",
      chamber: nearest.chamber,
      beatSampleIndex: i,
      beatIndex: nearest.beatIndex,
      beatTheta,
      theta: normalizedTheta(interpolateNumber(left.phi, right.phi, frac)),
      t: interpolateNumber(left.t, right.t, frac),
      phi: interpolateNumber(left.phi, right.phi, frac),
      point: {
        v: interpolateNumber(left.point.v, right.point.v, frac),
        p: interpolateNumber(left.point.p, right.point.p, frac),
      },
      phase: left.phase === right.phase ? left.phase : nearest.phase === "unsupported" ? "unsupported" : "transition",
      transitionReason: left.phase === right.phase ? left.transitionReason : "resampled-phase-boundary",
      leftSourceIndex: left.sourceIndex,
      rightSourceIndex: right.sourceIndex,
      markers: [],
    });
  }
  return out;
}

export function nearestPvLoopDebugCanvasPoint<T extends { x: number; y: number }>(
  points: readonly T[],
  pointer: { x: number; y: number } | null,
  maxDistancePx = 12,
): T | null {
  if (!pointer) return null;
  let best: { point: T; distanceSq: number } | null = null;
  const maxDistanceSq = maxDistancePx * maxDistancePx;
  for (const point of points) {
    const dx = point.x - pointer.x;
    const dy = point.y - pointer.y;
    const distanceSq = dx * dx + dy * dy;
    if (distanceSq > maxDistanceSq) continue;
    if (!best || distanceSq < best.distanceSq) best = { point, distanceSq };
  }
  return best?.point ?? null;
}

export function summarizePvLoopDebugSamples(samples: readonly PvLoopDebugSample[]) {
  const phaseCounts = Object.fromEntries(
    (["filling", "atrial-kick", "isovolumic-contraction", "ejection", "isovolumic-relaxation", "transition", "uncertain", "unsupported"] as const)
      .map((phase) => [phase, samples.filter((sample) => sample.phase === phase).length]),
  ) as Record<PvLoopDebugPhase, number>;
  const markerCounts = {
    valve: 0,
    qdotClamp: 0,
    pressureFloor: 0,
  };
  for (const sample of samples) {
    for (const marker of sample.markers) {
      if (marker.kind === "valve") markerCounts.valve++;
      if (marker.kind === "qdot-clamp") markerCounts.qdotClamp++;
      if (marker.kind === "pressure-floor") markerCounts.pressureFloor++;
    }
  }
  const beatIndices = samples.map((sample) => sample.beatIndex);
  const sourceIndices = samples.map((sample) => sample.sourceIndex);
  return {
    sampleCount: samples.length,
    supported: samples.some((sample) => sample.phase !== "unsupported"),
    phaseCounts,
    markerCounts,
    beatIndexMin: beatIndices.length ? Math.min(...beatIndices) : null,
    beatIndexMax: beatIndices.length ? Math.max(...beatIndices) : null,
    sourceIndexMin: sourceIndices.length ? Math.min(...sourceIndices) : null,
    sourceIndexMax: sourceIndices.length ? Math.max(...sourceIndices) : null,
  };
}

export function normalizePvLoopDebugTraceMode(
  value: unknown,
  fallback: PvLoopDebugTraceMode = "raw",
): PvLoopDebugTraceMode {
  const normalized = typeof value === "string" ? value.trim().toLowerCase() : "";
  return TRACE_MODE_SET.has(normalized as PvLoopDebugTraceMode) ? normalized as PvLoopDebugTraceMode : fallback;
}

function isFalseLike(value: string | null): boolean {
  if (value == null) return false;
  const normalized = value.trim().toLowerCase();
  return normalized === "0" || normalized === "false" || normalized === "off";
}

function isTrueLike(value: string | null | undefined): boolean {
  if (value == null) return false;
  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "on";
}

export function pvLoopDebugOptionsFromInputs({
  panelEnabled,
  panelTraceMode,
  search,
  storageEnabled,
  storageTraceMode,
  storageLegacyTraceMode,
}: {
  panelEnabled?: boolean;
  panelTraceMode?: PvLoopDebugTraceMode;
  search?: string;
  storageEnabled?: string | null;
  storageTraceMode?: string | null;
  storageLegacyTraceMode?: string | null;
}): PvLoopDebugOptions {
  const storedMode = normalizePvLoopDebugTraceMode(storageTraceMode ?? storageLegacyTraceMode, panelTraceMode ?? "raw");
  const baseMode = panelEnabled ? normalizePvLoopDebugTraceMode(panelTraceMode, storedMode) : storedMode;
  try {
    const params = new URLSearchParams((search ?? "").replace(/^\?/, ""));
    if (params.has("pvDebug")) {
      const raw = params.get("pvDebug");
      if (isFalseLike(raw)) return { enabled: false, traceMode: baseMode };
      return {
        enabled: true,
        traceMode: normalizePvLoopDebugTraceMode(raw, baseMode),
      };
    }
  } catch {
    // Ignore malformed debug query strings; panel/localStorage state remains valid.
  }
  if (isTrueLike(storageEnabled)) return { enabled: true, traceMode: storedMode };
  return {
    enabled: Boolean(panelEnabled),
    traceMode: normalizePvLoopDebugTraceMode(panelTraceMode, "raw"),
  };
}
