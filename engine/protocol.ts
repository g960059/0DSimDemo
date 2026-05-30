export type HeartModelMode = "activeStress" | "elastance";

export type CoreRuntimeParams = {
  HR: number;
  contractility: number;
  relaxation: number;
  systemicResistance: number;
  pulmonaryResistance: number;
  venousTone: number;
  arterialStiffness: number;
  PEEP: number;
  Pth0: number;
  respAmpTh: number;
  respAmpAlv: number;
  respRate: number;
  speed: number;
  // Hemorrhage / fluid (Phase A M5a), mL/min. Drive an expected-TBV ledger that
  // the TBV projector follows; health checks mass conservation vs the ledger.
  bleedRate: number;
  fluidRate: number;
  heartModel: HeartModelMode;
  useChiResistance: boolean;
  projectTBV: boolean;
  lvTmaxScale: number;
  rvTmaxScale: number;
  lvGeomScale: number;
  rvGeomScale: number;
  caReleaseScale: number;
  rvCaReleaseScale: number;
  // Valve Parameters
  // MV
  MV_Amax: number;
  MV_Aleak: number;
  MV_kOpen: number;
  MV_tauOpen: number;
  MV_tauClose: number;
  MV_R: number;
  MV_L: number;
  // AoV
  AoV_Amax: number;
  AoV_Aleak: number;
  AoV_kOpen: number;
  AoV_tauOpen: number;
  AoV_tauClose: number;
  AoV_R: number;
  AoV_L: number;
  // TV
  TV_Amax: number;
  TV_Aleak: number;
  TV_kOpen: number;
  TV_tauOpen: number;
  TV_tauClose: number;
  TV_R: number;
  TV_L: number;
  // PV
  PV_Amax: number;
  PV_Aleak: number;
  PV_kOpen: number;
  PV_tauOpen: number;
  PV_tauClose: number;
  PV_R: number;
  PV_L: number;
  // Node overrides allow one level of nesting (the `active` chamber sub-block,
  // e.g. { LV: { active: { bPas: 20 } } }); edges are always flat numeric.
  nodeOverrides?: OverrideBlock;
  edgeOverrides?: Record<string, Record<string, number>>;
};

/**
 * Researcher-tier node overrides: node -> field -> value. A field value is
 * normally a number, but a node's `active` field is itself a record of
 * active-chamber params (e.g. { active: { bPas: 20 } }) which ModelCore
 * deep-merges onto the chamber model. So one level of nesting is allowed.
 */
export type OverrideBlock = Record<string, Record<string, number | Record<string, number>>>;

export type ParameterPatch = Partial<CoreRuntimeParams>;

// =============================================================================
// sanitizeParams — the engine's authoritative parameter-sanitation boundary.
//
// This is the FINAL gate every resolved parameter set passes through before it
// reaches the integrator (caseOps.resolveInstance() calls it last). Its job:
//   1. Clamp known physiology knobs to hard, integrator-safe ranges.
//   2. Coerce non-finite values to a neutral fallback (defends against
//      LLM/import-authored or corrupted cases).
//   3. Drop unknown junk keys (rebuilds the object from the known schema).
//
// CRITICAL — valvular interventions: the valve params (MV_*/AoV_*/TV_*/PV_*),
// the deep scale knobs, and node/edge overrides are PRESERVED (guarded for
// finiteness/non-negativity, never dropped). A naive whitelist that kept only
// the "core" knobs would make every valve lesion (AS/MR/...) silently no-op —
// see caseOps.ts §"Raw-patch clamp & review policy".
// =============================================================================

/**
 * Hard, integrator-safe clamp ranges for the core physiology knobs. This is the
 * SINGLE SOURCE OF TRUTH: ModelCore.smoothParams() applies the same table at
 * runtime, so a sanitized CoreRuntimeParams is exactly what the integrator runs
 * (no divergent downstream re-clamp that would silently move deep-scale edits).
 * The numeric scale ranges are deliberately re-centred on the active-stress 1.0
 * baseline (e.g. lvTmaxScale floor 0.05 keeps the cardiogenic-shock regime).
 * The respiratory guards (Pth0, respAmpTh, respAmpAlv, respRate) are
 * sanitize-only — smoothParams does not re-clamp them, so they cannot diverge.
 */
export const HARD_CLAMP: Partial<Record<keyof CoreRuntimeParams, [number, number]>> = {
  HR: [30, 180],
  contractility: [0.25, 2.5],
  relaxation: [0.25, 2.5],
  systemicResistance: [0.2, 3.5],
  pulmonaryResistance: [0.2, 4.0],
  venousTone: [0, 1],
  arterialStiffness: [0.4, 3.0],
  PEEP: [0, 25],
  Pth0: [-20, 30],
  respAmpTh: [-20, 20],
  respAmpAlv: [-20, 20],
  respRate: [0, 1],
  speed: [0.1, 10],
  bleedRate: [0, 2000],
  fluidRate: [0, 2000],
  lvTmaxScale: [0.05, 2.5],
  rvTmaxScale: [0.05, 3.0],
  lvGeomScale: [0.5, 2.5],
  rvGeomScale: [0.5, 3.0],
  caReleaseScale: [0.25, 6],
  rvCaReleaseScale: [0.25, 8],
};

/** Keys smoothParams() hard-clamps at runtime — must agree with HARD_CLAMP. */
export const RUNTIME_CLAMP_KEYS: (keyof CoreRuntimeParams)[] = [
  "HR", "contractility", "relaxation", "systemicResistance", "pulmonaryResistance",
  "venousTone", "arterialStiffness", "PEEP", "speed", "bleedRate", "fluidRate",
  "lvTmaxScale", "rvTmaxScale", "lvGeomScale", "rvGeomScale",
  "caReleaseScale", "rvCaReleaseScale",
];

/** The numeric core knobs, rebuilt explicitly (so unknown keys are dropped). */
const CORE_NUMERIC_KEYS: (keyof CoreRuntimeParams)[] = [
  "HR", "contractility", "relaxation", "systemicResistance", "pulmonaryResistance",
  "venousTone", "arterialStiffness", "PEEP", "Pth0", "respAmpTh", "respAmpAlv",
  "respRate", "speed", "bleedRate", "fluidRate",
  "lvTmaxScale", "rvTmaxScale", "lvGeomScale", "rvGeomScale",
  "caReleaseScale", "rvCaReleaseScale",
];

const VALVE_PREFIXES = ["MV", "AoV", "TV", "PV"] as const;

/**
 * Neutral fallback for non-finite inputs. Mirrors defaultParams(); a guard test
 * (caseContract.test.ts) asserts the two stay in lock-step so this copy cannot
 * silently drift. Kept here so sanitizeParams has NO engine import (it is a
 * standalone safety boundary that caseOps/MCP can call without the simulator).
 */
export const NEUTRAL_PARAMS: CoreRuntimeParams = {
  HR: 75, contractility: 1.0, relaxation: 1.0,
  systemicResistance: 1.25, pulmonaryResistance: 1.0, venousTone: 0.2,
  arterialStiffness: 1.0, PEEP: 0, Pth0: 0, respAmpTh: 0, respAmpAlv: 0,
  respRate: 0.25, speed: 1, bleedRate: 0, fluidRate: 0,
  heartModel: "activeStress", useChiResistance: false, projectTBV: true,
  lvTmaxScale: 1.0, rvTmaxScale: 1.0, lvGeomScale: 1, rvGeomScale: 1,
  caReleaseScale: 1, rvCaReleaseScale: 1,
  MV_Amax: 5.0, MV_Aleak: 1e-4, MV_kOpen: 2.0, MV_tauOpen: 0.012, MV_tauClose: 0.025, MV_R: 0.002, MV_L: 0.0002,
  AoV_Amax: 3.5, AoV_Aleak: 1e-4, AoV_kOpen: 2.0, AoV_tauOpen: 0.010, AoV_tauClose: 0.030, AoV_R: 0.005, AoV_L: 0.001,
  TV_Amax: 8.0, TV_Aleak: 1e-4, TV_kOpen: 2.0, TV_tauOpen: 0.012, TV_tauClose: 0.025, TV_R: 0.002, TV_L: 0.0002,
  PV_Amax: 4.0, PV_Aleak: 1e-4, PV_kOpen: 2.0, PV_tauOpen: 0.010, PV_tauClose: 0.020, PV_R: 0.005, PV_L: 0.001,
};

export function sanitizeParams(p: CoreRuntimeParams): CoreRuntimeParams {
  const src = (p ?? {}) as Record<string, unknown>;
  const out: Record<string, unknown> = {};

  const numAt = (key: keyof CoreRuntimeParams): number => {
    const raw = src[key as string];
    const fallback = NEUTRAL_PARAMS[key] as number;
    const v = typeof raw === "number" && Number.isFinite(raw) ? raw : fallback;
    const r = HARD_CLAMP[key];
    return r ? Math.min(r[1], Math.max(r[0], v)) : v;
  };

  for (const key of CORE_NUMERIC_KEYS) out[key] = numAt(key);

  // Enums / booleans. Non-boolean junk falls back to the NEUTRAL value (not to
  // false) — symmetric with heartModel, so a corrupted `projectTBV: 1` does not
  // silently disable the mass-conservation projector.
  out.heartModel = src.heartModel === "elastance" ? "elastance" : "activeStress";
  out.useChiResistance = typeof src.useChiResistance === "boolean" ? src.useChiResistance : NEUTRAL_PARAMS.useChiResistance;
  out.projectTBV = typeof src.projectTBV === "boolean" ? src.projectTBV : NEUTRAL_PARAMS.projectTBV;

  // Valve params — PRESERVED. Areas/resistances/inductances >= 0; the open/close
  // time constants >= 1e-4 s (a zero tau would divide-by-zero in valve dynamics).
  for (const v of VALVE_PREFIXES) {
    const guard = (field: string, minVal: number) => {
      const key = `${v}_${field}` as keyof CoreRuntimeParams;
      const raw = src[key as string];
      const val = typeof raw === "number" && Number.isFinite(raw) ? raw : (NEUTRAL_PARAMS[key] as number);
      out[key as string] = Math.max(minVal, val);
    };
    guard("Amax", 0); guard("Aleak", 0); guard("kOpen", 0);
    guard("tauOpen", 1e-4); guard("tauClose", 1e-4);
    guard("R", 0); guard("L", 0);
  }

  // Node/edge overrides — researcher escape hatch, but still the final gate
  // before the integrator: keep the two-level shape, drop any non-finite leaf
  // (a NaN here would poison the solver), reject null/arrays/non-objects.
  const cleanOv = sanitizeOverrides(src.nodeOverrides);
  if (cleanOv) out.nodeOverrides = cleanOv;
  const cleanEdge = sanitizeOverrides(src.edgeOverrides);
  if (cleanEdge) out.edgeOverrides = cleanEdge;

  return out as CoreRuntimeParams;
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/**
 * Validate an OverrideBlock: keep only plain-object groups whose leaves are
 * finite numbers, OR a one-level-nested record of finite numbers (the `active`
 * chamber sub-block, e.g. { LV: { active: { bPas: 20 } } } — which ModelCore
 * honors and which MUST survive sanitize or diastolic-stiffness / chamber
 * overrides silently no-op). Returns undefined when nothing valid remains.
 */
function sanitizeOverrides(raw: unknown): OverrideBlock | undefined {
  if (!isPlainObject(raw)) return undefined;
  const out: OverrideBlock = {};
  for (const [group, fields] of Object.entries(raw)) {
    if (!isPlainObject(fields)) continue;
    const clean: Record<string, number | Record<string, number>> = {};
    for (const [k, v] of Object.entries(fields)) {
      if (typeof v === "number" && Number.isFinite(v)) {
        clean[k] = v;
      } else if (isPlainObject(v)) {
        const nested: Record<string, number> = {};
        for (const [k2, v2] of Object.entries(v)) {
          if (typeof v2 === "number" && Number.isFinite(v2)) nested[k2] = v2;
        }
        if (Object.keys(nested).length > 0) clean[k] = nested;
      }
    }
    if (Object.keys(clean).length > 0) out[group] = clean;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

export type SimSample = {
  t: number;

  // Pressures
  AoP: number;
  PAP: number;
  LAP: number;
  RAP: number;
  LVP: number;
  RVP: number;

  // Flows
  QAo: number;
  QPA: number;
  QMV: number;
  QTV: number;

  // Volumes
  VLV: number;
  VRV: number;
  VLA: number;
  VRA: number;
  // Included phi/aLV for charting internal states if needed
  phi: number;
  aLV: number;
  aRV: number;
  TBV: number;
};

export type SimMetrics = {
  HR: number;

  AoPMean: number;
  AoPSys: number;
  AoPDia: number;
  PAPMean: number;
  RAPMean: number;
  LAPMean: number;
  LVEDPApprox: number;
  RVEDPApprox: number;

  SV_L: number;
  SV_R: number;
  CO_L: number;
  CO_R: number;

  EF_LApprox: number;
  EF_RApprox: number;

  TBV: number;

  // Phase A / M0bs observability (instantaneous, at metrics() time).
  Pmsf: number;                      // mean systemic filling pressure (mmHg), textbook (Vstressed/C)
  vrGradient: number;                // Pmsf - RAP (mmHg), the venous-return driving gradient
  stressedVolumeSystemic: number;    // mL, systemic vascular stressed volume
  unstressedVolumeSystemic: number;  // mL, systemic vascular unstressed volume
};

/** Instantaneous engine observables for verification/UI (read-only). */
export type SimObservables = {
  Pmsf: number;
  vrGradient: number;
  RAP: number;
  stressedVolumeSystemic: number;
  unstressedVolumeSystemic: number;
  venousStressedVolume: number;   // SV+VC stressed volume (the reservoir)
  venousUnstressedVolume: number; // SV+VC unstressed volume
  Pth: number;
  Palv: number;
  Q_VC_RA: number;
  Q_PCap_PVen: number;
  P_SV: number;
  P_VC: number;
  P_PVen: number;
  P_PVein: number;
};

export type SimulationHealthStatus = "ok" | "warning" | "failed";

export type SimulationHealth = {
  status: SimulationHealthStatus;
  tbvDriftMl: number;
  tbvDriftPercent: number;
  leftRightFlowMismatchLMin: number;
  cycleMetricDelta: number;
  clampHitCount: number;
  numericalStability: SimulationHealthStatus;
  massConservation: SimulationHealthStatus;
  flowBalance: SimulationHealthStatus;
  physiologicalRange: SimulationHealthStatus;
  messages: string[];
};
