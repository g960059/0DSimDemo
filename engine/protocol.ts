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
  nodeOverrides?: Record<string, Record<string, number>>;
  edgeOverrides?: Record<string, Record<string, number>>;
};

export type ParameterPatch = Partial<CoreRuntimeParams>;

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
