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
  avDelaySec: number;
  atrialElectromechanicalDelaySec: number;
  ventricularElectromechanicalDelaySec: number;
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
  // Pericardium and ventricular interaction. These are calibration targets, not
  // fixed physiological constants.
  pericardiumEnabled: boolean;
  pericardialPressureScaleMmHg: number;
  pericardialSlackVolumeMl: number;
  pericardialVolumeScaleMl: number;
  pericardialSoftnessMl: number;
  pericardialBiasMmHg: number;
  pericardialFluidMl: number;
  septalCouplingEnabled: boolean;
  septalStiffnessScale: number;
  septalK1MmHgPerMl: number;
  septalK3MmHgPerMl3: number;
  septalDampingMmHgSecPerMl: number;
  septalMaxShiftMl: number;
  septalLvPressureWeight: number;
  // Coronary circulation: 3-territory 0D bed (LAD/LCx/RCA) with
  // intramyocardial external pressure, time-varying microvascular resistance,
  // stenosis head loss, and optional pharmacologic hyperemia.
  coronaryEnabled: boolean;
  coronaryResistanceScale: number;
  coronaryCompressionScale: number;
  coronaryVasodilator: number;
  coronaryReserveMax: number;
  LADStenosis: number;
  LCxStenosis: number;
  RCAStenosis: number;
  // Valve Parameters
  // MV
  MV_Aref: number;
  MV_Amax: number;
  MV_Aleak: number;
  MV_kOpen: number;
  MV_tauOpen: number;
  MV_tauClose: number;
  MV_R: number;
  MV_L: number;
  MV_B: number;
  // AoV
  AoV_Aref: number;
  AoV_Amax: number;
  AoV_Aleak: number;
  AoV_kOpen: number;
  AoV_tauOpen: number;
  AoV_tauClose: number;
  AoV_R: number;
  AoV_L: number;
  AoV_B: number;
  // TV
  TV_Aref: number;
  TV_Amax: number;
  TV_Aleak: number;
  TV_kOpen: number;
  TV_tauOpen: number;
  TV_tauClose: number;
  TV_R: number;
  TV_L: number;
  TV_B: number;
  // PV
  PV_Aref: number;
  PV_Amax: number;
  PV_Aleak: number;
  PV_kOpen: number;
  PV_tauOpen: number;
  PV_tauClose: number;
  PV_R: number;
  PV_L: number;
  PV_B: number;
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
  avDelaySec: [0.04, 0.30],
  atrialElectromechanicalDelaySec: [0, 0.12],
  ventricularElectromechanicalDelaySec: [0, 0.12],
  bleedRate: [0, 2000],
  fluidRate: [0, 2000],
  lvTmaxScale: [0.05, 2.5],
  rvTmaxScale: [0.05, 3.0],
  lvGeomScale: [0.5, 2.5],
  rvGeomScale: [0.5, 3.0],
  caReleaseScale: [0.25, 6],
  rvCaReleaseScale: [0.25, 8],
  pericardialPressureScaleMmHg: [0, 20],
  pericardialSlackVolumeMl: [150, 900],
  pericardialVolumeScaleMl: [10, 200],
  pericardialSoftnessMl: [1, 50],
  pericardialBiasMmHg: [-10, 20],
  pericardialFluidMl: [0, 1000],
  septalStiffnessScale: [0.1, 5],
  septalK1MmHgPerMl: [0.01, 5],
  septalK3MmHgPerMl3: [0, 0.1],
  septalDampingMmHgSecPerMl: [0.25, 20],
  septalMaxShiftMl: [0, 60],
  septalLvPressureWeight: [0, 1],
  coronaryResistanceScale: [0.2, 5.0],
  coronaryCompressionScale: [0, 2.0],
  coronaryVasodilator: [0, 1],
  coronaryReserveMax: [1, 5],
  LADStenosis: [0, 0.95],
  LCxStenosis: [0, 0.95],
  RCAStenosis: [0, 0.95],
};

/** Keys smoothParams() hard-clamps at runtime — must agree with HARD_CLAMP. */
export const RUNTIME_CLAMP_KEYS: (keyof CoreRuntimeParams)[] = [
  "HR", "contractility", "relaxation", "systemicResistance", "pulmonaryResistance",
  "venousTone", "arterialStiffness", "PEEP", "speed", "avDelaySec",
  "atrialElectromechanicalDelaySec", "ventricularElectromechanicalDelaySec",
  "bleedRate", "fluidRate",
  "lvTmaxScale", "rvTmaxScale", "lvGeomScale", "rvGeomScale",
  "caReleaseScale", "rvCaReleaseScale",
  "pericardialPressureScaleMmHg", "pericardialSlackVolumeMl",
  "pericardialVolumeScaleMl", "pericardialSoftnessMl",
  "pericardialBiasMmHg", "pericardialFluidMl",
  "septalStiffnessScale", "septalK1MmHgPerMl", "septalK3MmHgPerMl3",
  "septalDampingMmHgSecPerMl", "septalMaxShiftMl", "septalLvPressureWeight",
  "coronaryResistanceScale", "coronaryCompressionScale", "coronaryVasodilator",
  "coronaryReserveMax", "LADStenosis", "LCxStenosis", "RCAStenosis",
];

/** The numeric core knobs, rebuilt explicitly (so unknown keys are dropped). */
const CORE_NUMERIC_KEYS: (keyof CoreRuntimeParams)[] = [
  "HR", "contractility", "relaxation", "systemicResistance", "pulmonaryResistance",
  "venousTone", "arterialStiffness", "PEEP", "Pth0", "respAmpTh", "respAmpAlv",
  "respRate", "speed", "avDelaySec",
  "atrialElectromechanicalDelaySec", "ventricularElectromechanicalDelaySec",
  "bleedRate", "fluidRate",
  "lvTmaxScale", "rvTmaxScale", "lvGeomScale", "rvGeomScale",
  "caReleaseScale", "rvCaReleaseScale",
  "pericardialPressureScaleMmHg", "pericardialSlackVolumeMl",
  "pericardialVolumeScaleMl", "pericardialSoftnessMl",
  "pericardialBiasMmHg", "pericardialFluidMl",
  "septalStiffnessScale", "septalK1MmHgPerMl", "septalK3MmHgPerMl3",
  "septalDampingMmHgSecPerMl", "septalMaxShiftMl", "septalLvPressureWeight",
  "coronaryResistanceScale", "coronaryCompressionScale", "coronaryVasodilator",
  "coronaryReserveMax", "LADStenosis", "LCxStenosis", "RCAStenosis",
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
  // Kept in lock-step with defaultParams() (caseContract test).
  systemicResistance: 1.0, pulmonaryResistance: 0.625, venousTone: 0.15,
  arterialStiffness: 0.75, PEEP: 0, Pth0: 0, respAmpTh: 0, respAmpAlv: 0,
  respRate: 0.25, speed: 1,
  avDelaySec: 0.16, atrialElectromechanicalDelaySec: 0.00, ventricularElectromechanicalDelaySec: 0.05,
  bleedRate: 0, fluidRate: 0,
  heartModel: "activeStress", useChiResistance: false, projectTBV: true,
  lvTmaxScale: 0.70, rvTmaxScale: 1.0, lvGeomScale: 1, rvGeomScale: 1,
  caReleaseScale: 1, rvCaReleaseScale: 1,
  pericardiumEnabled: true,
  pericardialPressureScaleMmHg: 1.2,
  pericardialSlackVolumeMl: 340,
  pericardialVolumeScaleMl: 45,
  pericardialSoftnessMl: 8,
  pericardialBiasMmHg: 0,
  pericardialFluidMl: 0,
  septalCouplingEnabled: true,
  septalStiffnessScale: 1,
  septalK1MmHgPerMl: 1.4,
  septalK3MmHgPerMl3: 0.006,
  septalDampingMmHgSecPerMl: 4.0,
  septalMaxShiftMl: 25,
  septalLvPressureWeight: 0.28,
  coronaryEnabled: true,
  coronaryResistanceScale: 1,
  coronaryCompressionScale: 1.5,
  coronaryVasodilator: 0,
  coronaryReserveMax: 3.5,
  LADStenosis: 0,
  LCxStenosis: 0,
  RCAStenosis: 0,
  MV_Aref: 5.0, MV_Amax: 5.5, MV_Aleak: 0, MV_kOpen: 2.0, MV_tauOpen: 0.024, MV_tauClose: 0.016, MV_R: 0.0027, MV_L: 0.0005, MV_B: 8e-6,
  AoV_Aref: 3.5, AoV_Amax: 3.5, AoV_Aleak: 0, AoV_kOpen: 3.0, AoV_tauOpen: 0.006, AoV_tauClose: 0.008, AoV_R: 0.0015, AoV_L: 0.00025, AoV_B: 1e-6,
  TV_Aref: 8.0, TV_Amax: 8.0, TV_Aleak: 0, TV_kOpen: 2.0, TV_tauOpen: 0.018, TV_tauClose: 0.010, TV_R: 0.0035, TV_L: 0.0008, TV_B: 1e-5,
  PV_Aref: 4.0, PV_Amax: 4.0, PV_Aleak: 0, PV_kOpen: 2.0, PV_tauOpen: 0.010, PV_tauClose: 0.006, PV_R: 0.005, PV_L: 0.001, PV_B: 2e-6,
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
  out.pericardiumEnabled = typeof src.pericardiumEnabled === "boolean" ? src.pericardiumEnabled : NEUTRAL_PARAMS.pericardiumEnabled;
  out.septalCouplingEnabled = typeof src.septalCouplingEnabled === "boolean" ? src.septalCouplingEnabled : NEUTRAL_PARAMS.septalCouplingEnabled;
  out.coronaryEnabled = typeof src.coronaryEnabled === "boolean" ? src.coronaryEnabled : NEUTRAL_PARAMS.coronaryEnabled;

  // Valve params — PRESERVED. Areas/resistances/inductances >= 0; the open/close
  // time constants >= 1e-4 s (a zero tau would divide-by-zero in valve dynamics).
  for (const v of VALVE_PREFIXES) {
    const guard = (field: string, minVal: number) => {
      const key = `${v}_${field}` as keyof CoreRuntimeParams;
      const raw = src[key as string];
      const val = typeof raw === "number" && Number.isFinite(raw) ? raw : (NEUTRAL_PARAMS[key] as number);
      out[key as string] = Math.max(minVal, val);
    };
    guard("Aref", 1e-6); guard("Amax", 0); guard("Aleak", 0); guard("kOpen", 0);
    guard("tauOpen", 1e-4); guard("tauClose", 1e-4);
    guard("R", 0); guard("L", 0); guard("B", 0);
  }

  // Node/edge overrides — researcher escape hatch, but still the final gate
  // before the integrator: keep the shape strict (flat finite numbers; one level
  // of nesting ONLY under a node's `active` block), drop non-finite leaves and
  // wrong-shaped values, reject null/arrays/non-objects.
  const cleanOv = sanitizeOverrides(src.nodeOverrides, NODE_NESTED_KEYS);
  if (cleanOv) out.nodeOverrides = cleanOv;
  const cleanEdge = sanitizeOverrides(src.edgeOverrides, EDGE_NESTED_KEYS);
  if (cleanEdge) out.edgeOverrides = cleanEdge;

  return out as CoreRuntimeParams;
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Node fields allowed to be a nested numeric record (the chamber sub-block). */
const NODE_NESTED_KEYS: ReadonlySet<string> = new Set(["active"]);
/** Edges are always flat: no field may be a nested object. */
const EDGE_NESTED_KEYS: ReadonlySet<string> = new Set<string>();

/**
 * Validate an OverrideBlock: keep only plain-object groups whose leaves are
 * finite numbers. A field may be a one-level-nested record of finite numbers
 * ONLY if its key is in `nestedKeys` (e.g. a node's `active` chamber sub-block,
 * { LV: { active: { bPas: 20 } } } — which ModelCore honors and which MUST
 * survive sanitize or chamber overrides silently no-op). Any other nested/
 * wrong-shaped value is DROPPED, so a stray object can never reach numeric
 * ModelCore arithmetic. Returns undefined when nothing valid remains.
 */
function sanitizeOverrides(raw: unknown, nestedKeys: ReadonlySet<string>): OverrideBlock | undefined {
  if (!isPlainObject(raw)) return undefined;
  const out: OverrideBlock = {};
  for (const [group, fields] of Object.entries(raw)) {
    if (!isPlainObject(fields)) continue;
    const clean: Record<string, number | Record<string, number>> = {};
    for (const [k, v] of Object.entries(fields)) {
      if (typeof v === "number" && Number.isFinite(v)) {
        clean[k] = v;
      } else if (nestedKeys.has(k) && isPlainObject(v)) {
        const nested: Record<string, number> = {};
        for (const [k2, v2] of Object.entries(v)) {
          if (typeof v2 === "number" && Number.isFinite(v2)) nested[k2] = v2;
        }
        if (Object.keys(nested).length > 0) clean[k] = nested;
      }
      // else: wrong-shaped (object where a number is expected) -> dropped.
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
  QPV: number; // pulmonic valve flow (RV->PA); systolic ejection, not venous S/D/Ar
  QMV: number;
  QTV: number;
  PVF: number; // pulmonary venous inflow to LA (PVein->LA edge); S/D/Ar pattern
  SVF: number; // systemic venous return to RA (VC->RA edge)
  QCapSV: number; // systemic venous reservoir inflow (Cap->SV)
  QPArtPCap: number; // pulmonary venous group inflow (PArt->PCap)
  QCorLAD: number;
  QCorLCx: number;
  QCorRCA: number;
  QCorTotal: number;
  QCS: number;

  // Volumes
  VLV: number;
  VRV: number;
  VLA: number;
  VRA: number;
  VSystemicVenous: number;
  VPulmonaryVenous: number;
  P_PVein: number;
  // Included phi/aLV for charting internal states if needed
  phi: number;
  aLV: number;
  aRV: number;
  aLA: number;
  aRA: number;
  cRA: number;
  rLA: number;
  rRA: number;
  xiMV: number;
  xiAoV: number;
  xiTV: number;
  xiPV: number;
  dP_MV: number;
  dP_AoV: number;
  dP_TV: number;
  dP_PV: number;
  AoV_areaRatio: number;
  AoV_loss_R: number;
  AoV_loss_B: number;
  AoV_loss_residual: number;
  LVPressureFloorHit01: number;
  RVPressureFloorHit01: number;
  ELV_active: number;
  ERV_active: number;
  ELV_timeVarying: number;
  ERV_timeVarying: number;
  qLAReservoirMl?: number;
  VLABodyMl?: number;
  VLAReservoirMl?: number;
  PLABodyMmHg?: number;
  PLAReservoirMmHg?: number;
  PLAEquilibriumErrorMmHg?: number;
  twoBranchSolveFlag?: "ok" | "lowVolumeConstrained" | "unbracketedEndpoint";
  reservoirSleeveOverMax01?: number;
  PVFOstial?: number;
  pvOstialQ?: number;
  pvOstialInertialDrop?: number;
  pvOstialResistiveDrop?: number;
  Pperi: number;
  Ppc: number;
  VHeart: number;
  septumShiftMl: number;
  VLVeff: number;
  VRVeff: number;
  PLVfw: number;
  PRVfw: number;
  PVI_LV: number;
  PVI_RV: number;
  septalForceMmHg: number;
  PLADArt: number;
  PLCxArt: number;
  PRCAArt: number;
  PCS: number;
  PimLAD: number;
  PimLCx: number;
  PimRCA: number;
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
  AoVMeanGradient: number;
  AoVPeakGradient: number;

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
  CorFlowLADMlMin: number;
  CorFlowLCxMlMin: number;
  CorFlowRCAMlMin: number;
  CorFlowTotalMlMin: number;
  CorPctCO: number;
  CorDiastolicFractionLAD: number;
  CorDiastolicFractionLCx: number;
  CorDiastolicFractionRCA: number;
  FFR_LAD: number;
  FFR_LCx: number;
  FFR_RCA: number;
  CorSupplyDemandL: number;
  CorSupplyDemandR: number;
};

/** Instantaneous engine observables for verification/UI (read-only). */
export type SimObservables = {
  Pmsf: number;
  PmsfTm: number;
  PmsfAbs: number;
  vrGradient: number;
  RAP: number;
  stressedVolumeSystemic: number;
  unstressedVolumeSystemic: number;
  systemicComplianceEff: number;
  systemicExternalPressureWeighted: number;
  venousStressedVolume: number;   // SV+VC stressed volume (the reservoir)
  venousUnstressedVolume: number; // SV+VC unstressed volume
  pulmonaryVenousVolume: number;          // PCap+PVen+PVein total realised volume
  pulmonaryVenousStressedVolume: number;  // PCap+PVen+PVein stressed volume
  pulmonaryVenousUnstressedVolume: number;// PCap+PVen+PVein unstressed volume
  pulmonaryVenousComplianceEff: number;   // PCap+PVen+PVein effective compliance
  pulmonaryVenousExternalPressureWeighted: number;
  Pmpf: number;                           // pulmonary venous filling pressure, transmural convention
  PmpfTm: number;
  PmpfAbs: number;                        // pressure coordinate for LAP-axis Guyton view
  pulmonaryVenousReturnGradient: number;  // PmpfAbs - LAP
  pVeinVcGradient: number;                // P_PVein - P_VC (mmHg)
  tbvCorrectionMagPerBeat: number;         // mL applied by the conservative TBV ledger corrector over the last completed beat
  tbvCorrectionLastStepMl: number;         // mL applied by the conservative TBV ledger corrector on the last integrator step
  expectedTBV: number;                     // mL, current expected-TBV ledger value
  tbvErrorMl: number;                      // expectedTBV - actual TBV at the instant of this read
  Pth: number;
  Palv: number;
  Q_VC_RA: number;
  Q_TV: number;
  Q_PV: number;
  Q_PCap_PVen: number;
  xiTV: number;
  xiPV: number;
  dP_TV: number;
  dP_PV: number;
  P_SV: number;
  P_VC: number;
  P_PVen: number;
  P_PVein: number;
  Pperi: number;
  Ppc: number;
  VHeart: number;
  septumShiftMl: number;
  VLVeff: number;
  VRVeff: number;
  PLVfw: number;
  PRVfw: number;
  PVI_LV: number;
  PVI_RV: number;
  septalForceMmHg: number;
  Q_LAD: number;
  Q_LCx: number;
  Q_RCA: number;
  Q_Cor_total: number;
  Q_CS_RA: number;
  P_LAD_Art: number;
  P_LCx_Art: number;
  P_RCA_Art: number;
  P_CS: number;
  PimLAD: number;
  PimLCx: number;
  PimRCA: number;
  FFR_LAD: number;
  FFR_LCx: number;
  FFR_RCA: number;
  qLAReservoirMl?: number;
  VLABodyMl?: number;
  VLAReservoirMl?: number;
  PLABodyMmHg?: number;
  PLAReservoirMmHg?: number;
  PLAEquilibriumErrorMmHg?: number;
  twoBranchSolveFlag?: "ok" | "lowVolumeConstrained" | "unbracketedEndpoint";
  reservoirSleeveOverMax01?: number;
  PVFOstial?: number;
  pvOstialQ?: number;
  pvOstialInertialDrop?: number;
  pvOstialResistiveDrop?: number;
};

export type VenousGroupBalance = {
  volume: number;
  stressedVolume: number;
  unstressedVolume: number;
  inflowMlPerS: number;
  outflowMlPerS: number;
  netFlowMlPerS: number;
};

export type VenousGroupBalances = {
  systemicVenous: VenousGroupBalance;
  pulmonaryVenous: VenousGroupBalance;
  totalBloodVolume: number;
  expectedTBV: number;
  tbvErrorMl: number;
  tbvCorrectionMagPerBeat: number;
  tbvCorrectionLastStepMl: number;
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
