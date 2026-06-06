import type { ParameterPatch } from "@/engine/protocol";

// Opt-out preset: revert LV/RV to time-varying elastance.
// The engine default (defaultParams) now uses the active-stress ventricle.
export const stableElastanceBaseline: ParameterPatch = {
  heartModel: "elastance",
  systemicResistance: 1.6,
  arterialStiffness: 1.0,
  projectTBV: true,
};

// Calibrated active-stress operating point. This is now the engine default;
// kept as a named preset for explicit re-application after an elastance swap.
export const activeStressBaseline: ParameterPatch = {
  heartModel: "activeStress",
  lvTmaxScale: 0.70,
  rvTmaxScale: 1.0,
  caReleaseScale: 1.0,
  rvCaReleaseScale: 1.0,
  lvGeomScale: 1.0,
  rvGeomScale: 1.0,
  systemicResistance: 0.80,
  pulmonaryResistance: 0.625,
  venousTone: 0.15,
  projectTBV: true,
};

/** @deprecated Renamed to `activeStressBaseline` (now the engine default). */
export const experimentalActiveStressCandidate = activeStressBaseline;

export const anteriorAmiFromElastanceBaseline: ParameterPatch = {
  ...stableElastanceBaseline,
  HR: 95,
  contractility: 0.55,
  relaxation: 0.8,
  systemicResistance: 1.45,
  venousTone: 0.35,
};

export const anteriorAmiDobutamineFromElastanceBaseline: ParameterPatch = {
  ...stableElastanceBaseline,
  HR: 100,
  contractility: 0.95,
  relaxation: 1.05,
  systemicResistance: 1.25,
  venousTone: 0.32,
};
