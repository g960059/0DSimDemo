import type { ParameterPatch } from "@/engine/protocol";

export const stableElastanceBaseline: ParameterPatch = {
  heartModel: "elastance",
  systemicResistance: 1.6,
  arterialStiffness: 1.0,
  projectTBV: true,
};

export const experimentalActiveStressCandidate: ParameterPatch = {
  heartModel: "activeStress",
  lvTmaxScale: 4.5,
  rvTmaxScale: 4.5,
  caReleaseScale: 1.0,
  rvCaReleaseScale: 1.0,
  lvGeomScale: 1.0,
  rvGeomScale: 1.0,
  systemicResistance: 1.25,
  pulmonaryResistance: 1.0,
  venousTone: 0.2,
  projectTBV: true,
};

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
