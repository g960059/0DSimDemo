import type { CoreRuntimeParams, SimMetrics, SimSample, SimulationHealth } from "@/engine/protocol";
import type { SettlePolicy, SignalKey } from "@/engine/settling";

export const MODEL_STATE_SCHEMA_VERSION = 1;
export const MODEL_VERSION = "0dsim-modelcore-v1";

export type ModelStateLayout = {
  nodes: readonly string[];
  dynamicEdges: readonly string[];
  valves: readonly string[];
  activeChambers: readonly string[];
  size: number;
};

export type SerializedModelState = {
  schemaVersion: typeof MODEL_STATE_SCHEMA_VERSION;
  modelVersion: typeof MODEL_VERSION;
  stateLayoutHash: string;
  /** Hash of the current effective runtime parameters (`p`), excluding speed. */
  paramsHash: string;
  /** Hash of the current target runtime parameters (`pTarget`), excluding speed. */
  targetParamsHash: string;
  t: number;
  phi: number;
  x: number[];
  /** Dynamic TBV anchor only; TBV projector enablement and counters are intentionally not serialized. */
  initialTBV: number;
  expectedTBV: number;
};

export type UnpackModelStateOptions = {
  allowParameterMismatch?: boolean;
};

export type ComparableState = {
  schemaVersion: typeof MODEL_STATE_SCHEMA_VERSION;
  modelVersion: typeof MODEL_VERSION;
  stateLayoutHash: string;
  paramsHash: string;
  targetParamsHash: string;
  t: number;
  phi: number;
  values: Record<string, number>;
};

export type SteadyStatus =
  | "converged"
  | "cap"
  | "forced-trend"
  | "projector-not-quiet"
  | "unstable";

export type SteadyResiduals = {
  worstSignal: SignalKey | null;
  worstDelta: number | null;
  leftRightSvMismatchLMin: number;
  leftRightSvMismatchPct: number;
  tbvDriftMl: number;
  tbvDriftPctPer60s: number | null;
  venousMaxResidualMl: number | null;
  projectorQuiet: boolean;
};

export type SolverStats = {
  kind: "fixed-heun";
  dt: number;
  sampleHz: number;
  nSteps: number;
  settleSeconds: number;
  measureSeconds: number;
  wallMs?: number;
};

export type RunToPeriodicSteadyOptions = {
  targetTBV?: number;
  dt?: number;
  sampleHz?: number;
  settlePolicy?: SettlePolicy;
  measureBeats?: number;
  requireProjectorQuiet?: boolean;
  includeLastBeatSamples?: boolean;
  includeWallMs?: boolean;
};

export type SteadyResult = {
  ok: boolean;
  status: SteadyStatus;
  metrics: SimMetrics;
  health: SimulationHealth;
  state: SerializedModelState;
  comparableState: ComparableState;
  residuals: SteadyResiduals;
  solverStats: SolverStats;
  lastBeatSamples?: SimSample[];
};

export type RunnerParams = Partial<CoreRuntimeParams>;

export function stableStringify(value: unknown): string {
  return stringifyStable(value);
}

export function simpleStableHash(value: unknown): string {
  const text = stableStringify(value);
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

export function finiteNumber(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${label} must be a finite number`);
  }
  return value;
}

export function finiteNumberArray(value: unknown, label: string): number[] {
  if (!Array.isArray(value)) throw new Error(`${label} must be an array`);
  return value.map((v, i) => finiteNumber(v, `${label}[${i}]`));
}

export function finiteRecord(record: Record<string, number>, label: string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [key, value] of Object.entries(record)) {
    out[key] = finiteNumber(value, `${label}.${key}`);
  }
  return out;
}

function stringifyStable(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error("stableStringify cannot encode non-finite numbers");
    return JSON.stringify(value);
  }
  if (typeof value === "string" || typeof value === "boolean") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((item) => stringifyStable(item)).join(",")}]`;
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const keys = Object.keys(record).filter((key) => record[key] !== undefined).sort();
    return `{${keys.map((key) => `${JSON.stringify(key)}:${stringifyStable(record[key])}`).join(",")}}`;
  }
  throw new Error(`stableStringify cannot encode ${typeof value}`);
}
