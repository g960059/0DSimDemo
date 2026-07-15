export const BLOOD_COMPARTMENT_IDS = Object.freeze(["LA", "LV", "SA", "SV", "RA", "RV", "PA", "PV"] as const);
export type BloodCompartmentId = (typeof BLOOD_COMPARTMENT_IDS)[number];

export const INERTIAL_FLOW_IDS = Object.freeze(["Q_MV", "Q_AoV", "Q_TV", "Q_PuV", "Q_VC", "Q_PV"] as const);
export type InertialFlowId = (typeof INERTIAL_FLOW_IDS)[number];

export const ALGEBRAIC_FLOW_IDS = Object.freeze(["Q_sys", "Q_pul"] as const);
export type AlgebraicFlowId = (typeof ALGEBRAIC_FLOW_IDS)[number];
export type FourChamberFlowId = InertialFlowId | AlgebraicFlowId;

export const WALL_IDS = Object.freeze(["LA", "RA", "LVFW", "SEP", "RVFW"] as const);
export type FourChamberWallId = (typeof WALL_IDS)[number];

export const TRISEG_WALL_IDS = Object.freeze(["LVFW", "SEP", "RVFW"] as const);
export type TriSegWallId = (typeof TRISEG_WALL_IDS)[number];

export const TRISEG_ALGEBRAIC_COORDINATES = Object.freeze(["V_m_S", "y_m"] as const);

export type DirectedFlowEdge<FlowId extends FourChamberFlowId = FourChamberFlowId> = {
  readonly flowId: FlowId;
  readonly upstream: BloodCompartmentId;
  readonly downstream: BloodCompartmentId;
  readonly anatomicalName: string;
};

export const DIRECTED_INERTIAL_EDGES: readonly DirectedFlowEdge<InertialFlowId>[] = Object.freeze([
  Object.freeze({ flowId: "Q_MV", upstream: "LA", downstream: "LV", anatomicalName: "mitral valve" }),
  Object.freeze({ flowId: "Q_AoV", upstream: "LV", downstream: "SA", anatomicalName: "aortic valve" }),
  Object.freeze({ flowId: "Q_TV", upstream: "RA", downstream: "RV", anatomicalName: "tricuspid valve" }),
  Object.freeze({ flowId: "Q_PuV", upstream: "RV", downstream: "PA", anatomicalName: "pulmonary valve" }),
  Object.freeze({ flowId: "Q_VC", upstream: "SV", downstream: "RA", anatomicalName: "vena-caval inlet" }),
  Object.freeze({ flowId: "Q_PV", upstream: "PV", downstream: "LA", anatomicalName: "pulmonary-venous inlet" }),
]);

export const DIRECTED_ALGEBRAIC_EDGES: readonly DirectedFlowEdge<AlgebraicFlowId>[] = Object.freeze([
  Object.freeze({ flowId: "Q_sys", upstream: "SA", downstream: "SV", anatomicalName: "systemic periphery" }),
  Object.freeze({ flowId: "Q_pul", upstream: "PA", downstream: "PV", anatomicalName: "pulmonary periphery" }),
]);

export const DIRECTED_CLOSED_LOOP_EDGES: readonly DirectedFlowEdge[] = Object.freeze([
  DIRECTED_INERTIAL_EDGES[5],
  DIRECTED_INERTIAL_EDGES[0],
  DIRECTED_INERTIAL_EDGES[1],
  DIRECTED_ALGEBRAIC_EDGES[0],
  DIRECTED_INERTIAL_EDGES[4],
  DIRECTED_INERTIAL_EDGES[2],
  DIRECTED_INERTIAL_EDGES[3],
  DIRECTED_ALGEBRAIC_EDGES[1],
]);

export const FOUR_CHAMBER_SI_UNITS = Object.freeze({
  time: "s",
  volume: "m^3",
  flow: "m^3/s",
  pressure: "Pa",
  stress: "Pa",
  length: "m",
  area: "m^2",
  wallMaterialVolume: "m^3",
  calciumAtLandInterface: "uM",
  strain: "1",
} as const);

export const FOUR_CHAMBER_SIGN_CONVENTIONS = Object.freeze({
  directedFlow: "positive from upstream to downstream",
  edgePressureDrop: "P_upstream - P_downstream",
  transmuralPressure: "P_cavity - P_external",
  cavityPressure: "P_transmural + P_intrathoracic + P_pericardial",
  activeStressPower: "V_wall_reference * tau_active * fiber_log_strain_rate",
  activeMechanicalOutputPower: "-activeStressPower",
} as const);

export const FOUR_CHAMBER_OWNERSHIP = Object.freeze({
  bloodVolume: "circulation-ledger",
  inertialFlow: "circulation-momentum",
  geometryStretch: "wall-geometry",
  passiveStress: "equilibrium-passive-material",
  passiveViscousStress: "one-state-wall-sls",
  landLengthReference: "tissue-manifest",
  activeSourceStress: "land2017-active-only",
  activeStressMeasureConversion: "land-nominal-to-wall-kirchhoff-adapter",
  viableFraction: "independent-scar-viability-evidence",
} as const);

export const FOUR_CHAMBER_ACUTE_WALL_CONSTRAINTS = Object.freeze({
  deformationJacobianJ: 1,
  myocardialIncompressibility: true,
  currentWallMaterialVolumeEqualsReference: true,
  wallMaterialVolumeRemodelingWithinAcuteBeat: false,
  kirchhoffFiberStressEqualsCauchyFiberStress: true,
  workConjugateStrain: "fiber-log-strain",
  workConjugateStress: "scalar-kirchhoff-fiber-stress",
  wallPowerDensityReferenceMeasure: "tau_f * fiber_log_strain_rate",
  totalWallPower: "V_wall_reference * tau_f * fiber_log_strain_rate",
} as const);
