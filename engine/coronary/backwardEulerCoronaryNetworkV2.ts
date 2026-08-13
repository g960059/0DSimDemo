import {
  evaluateVolumeDependentCoronaryResistanceV1,
} from "@/engine/coronary/collapsibleIntramyocardialBedV1";
import {
  NORMAL_ADULT_CORONARY_TOPOLOGY_PRIOR_V2,
  buildCoronaryTopologyV2,
  coronaryConfigurationFingerprintV2,
  coronaryColdSeedBloodVolumeMlV2,
  coronaryTopologyPriorFingerprintV2,
  evaluateCrefAnchoredCollapsiblePvV2,
  initialCoronaryToneStateV2,
  invertCrefAnchoredCollapsiblePvV2,
  validateCoronaryTopologyV2,
  type CoronaryConservedVolumeNodeSpecV2,
  type CoronaryTopologyPriorV2,
  type CoronaryTopologyV2,
} from "@/engine/coronary/topologyPriorV2";
import {
  CORONARY_CONSERVED_VOLUME_NODE_IDS_V2,
  CORONARY_EDGE_IDS_V2,
  CORONARY_LAYER_IDS_V2,
  CORONARY_TERRITORY_IDS_V2,
  type CoronaryConservedVolumeNodeIdV2,
  type CoronaryConservedVolumeRecordV2,
  type CoronaryEdgeIdV2,
  type CoronaryHydraulicNodeIdV2,
  type CoronaryTerritoryLayerRecordV2,
  type CoronaryTerritoryRecordV2,
  type CoronaryToneStateV2,
} from "@/engine/coronary/typesV2";
import {
  evaluateSignedLinearQuadraticLossV1,
  mapYoungTsaiCoronaryStenosisV1,
  type YoungTsaiCoronaryStenosisGeometryV1,
} from "@/engine/coronary/youngTsaiStenosisV1";

export type CoronaryConservedVolumeStateV2 =
  CoronaryConservedVolumeRecordV2<number>;

export type CoronaryAcceptedHydraulicStateV2 = Readonly<{
  acceptedTimeSec: number;
  revision: number;
  volumeMlByNode: CoronaryConservedVolumeStateV2;
  /** Six accepted slow states; fixed throughout a hydraulic Newton trial. */
  toneResistanceScaleByTerritoryLayer: CoronaryToneStateV2;
}>;

export type CoronaryLayerDiseaseInputV2 = Readonly<{
  /** Fixed structural CMD multiplier owned only by precapillary R1. */
  structuralR1ResistanceScale: number;
  /** Fixed structural CMD multiplier owned only by capillary/intermediate Rm. */
  structuralRmResistanceScale: number;
  /** Disease-dependent floor on the separate accepted R1 tone state. */
  vasodilatoryToneMinimumResistanceScale: number;
}>;

export type CoronaryTerritoryDiseaseInputV2 = Readonly<{
  /** Explicit odd loss coefficients for a focal epicardial lesion. */
  focalStenosisAdditionalLinearResistanceMmHgSecPerMl: number;
  focalStenosisAdditionalQuadraticResistanceMmHgSec2PerMl2: number;
  layers: Readonly<Record<
    (typeof CORONARY_LAYER_IDS_V2)[number],
    CoronaryLayerDiseaseInputV2
  >>;
}>;

export type CoronaryDiseaseInputV2 = CoronaryTerritoryRecordV2<
  CoronaryTerritoryDiseaseInputV2
>;

export type CoronaryHydraulicBoundaryInputV2 = Readonly<{
  absoluteAorticPressureMmHg: number;
  absoluteRightAtrialPressureMmHg: number;
  /** External pressure for the three epicardial Art nodes and common CV. */
  perivascularExternalPressureMmHg: number;
  /** Mechanics-derived absolute external pressure shared by C1 and C2. */
  intramyocardialPressureMmHgByTerritoryLayer:
    CoronaryTerritoryLayerRecordV2<number>;
}>;

export type CoronaryBackwardEulerSolverOptionsV2 = Readonly<{
  maximumNewtonIterations: number;
  maximumLineSearchBacktracks: number;
  absoluteResidualToleranceMl: number;
  relativeResidualTolerance: number;
  finiteDifferenceRelativeStep: number;
  minimumVolumeFractionOfReference: number;
}>;

export type CoronaryBackwardEulerTrialInputV2 = Readonly<{
  dtSec: number;
  boundary: CoronaryHydraulicBoundaryInputV2;
  disease?: CoronaryDiseaseInputV2;
  collapseHydraulics?: CoronaryCollapseHydraulicsPriorV2;
  solverOptions?: Partial<CoronaryBackwardEulerSolverOptionsV2>;
  /** Opt-in measurement only; omitted on the production/default hot path. */
  evaluationCounterCollection?: "enabled";
}>;

export type CoronaryHydraulicEvaluationV2 = Readonly<{
  absolutePressureMmHgByNode: Readonly<
    Record<CoronaryHydraulicNodeIdV2, number>
  >;
  transmuralPressureMmHgByConservedNode:
    CoronaryConservedVolumeRecordV2<number>;
  signedFlowMlPerSecByEdge: Readonly<Record<CoronaryEdgeIdV2, number>>;
  effectiveLinearResistanceMmHgSecPerMlByEdge:
    Readonly<Record<CoronaryEdgeIdV2, number>>;
  quadraticResistanceMmHgSec2PerMl2ByEdge:
    Readonly<Record<CoronaryEdgeIdV2, number>>;
  dissipatedPowerMmHgMlPerSecByEdge:
    Readonly<Record<CoronaryEdgeIdV2, number>>;
  effectiveToneResistanceScaleByTerritoryLayer: CoronaryToneStateV2;
  /**
   * Signed flow from the aortic root into each lumped epicardial/prearterial
   * reservoir. This is the model's proximal coronary-inlet observable.
   */
  inletFlowMlPerSecByTerritory: CoronaryTerritoryRecordV2<number>;
  /**
   * Signed flow leaving each lumped epicardial/prearterial reservoir, summed
   * across its subepicardial and subendocardial R1 branches. This is a distal
   * lumped-boundary observable, not an additional hydraulic edge.
   */
  largeArterialOutflowMlPerSecByTerritory:
    CoronaryTerritoryRecordV2<number>;
  /** Exact territory Art-node storage identity: inlet minus R1 outflow. */
  largeArterialStorageRateMlPerSecByTerritory:
    CoronaryTerritoryRecordV2<number>;
  layerR1FlowMlPerSecByTerritory:
    CoronaryTerritoryLayerRecordV2<number>;
  /** Signed hidden C1-to-C2 transfer through Rm; not a direct tissue observable. */
  layerQmInternalFlowMlPerSecByTerritory:
    CoronaryTerritoryLayerRecordV2<number>;
  /** @deprecated Use layerQmInternalFlowMlPerSecByTerritory. */
  layerTissueFlowMlPerSecByTerritory:
    CoronaryTerritoryLayerRecordV2<number>;
  layerR2FlowMlPerSecByTerritory:
    CoronaryTerritoryLayerRecordV2<number>;
  postFocalLesionAbsolutePressureMmHgByTerritory:
    CoronaryTerritoryRecordV2<number>;
  focalStenosisPressureLossMmHgByTerritory:
    CoronaryTerritoryRecordV2<number>;
  totalInletFlowMlPerSec: number;
  commonCoronaryVenousOutletFlowMlPerSec: number;
  totalDissipatedPowerMmHgMlPerSec: number;
}>;

export type CoronaryBackwardEulerDiagnosticsV2 = Readonly<{
  converged: true;
  newtonIterations: number;
  totalLineSearchBacktracks: number;
  /** Present only when the trial input opts into evaluation measurement. */
  hydraulicResidualEvaluationCount?: number;
  finalResidualInfinityNormMl: number;
  maximumAbsoluteNodeContinuityResidualMl: number;
  continuityResidualMlByNode: CoronaryConservedVolumeStateV2;
  storageRateMlPerSecByNode: CoronaryConservedVolumeStateV2;
  previousCoronaryBloodVolumeMl: number;
  candidateCoronaryBloodVolumeMl: number;
  coronaryBloodVolumeChangeMl: number;
  signedBoundaryInletVolumeMl: number;
  signedBoundaryOutletVolumeMl: number;
  exactBloodVolumeLedgerResidualMl: number;
  hydraulics: CoronaryHydraulicEvaluationV2;
}>;

export type CoronaryBackwardEulerTrialV2 = Readonly<{
  baseAcceptedRevision: number;
  baseAcceptedTimeSec: number;
  dtSec: number;
  candidateAcceptedState: CoronaryAcceptedHydraulicStateV2;
  diagnostics: CoronaryBackwardEulerDiagnosticsV2;
}>;

export type CoronaryImplicitBoundaryDirectionV2 = Readonly<{
  /** Positive central-difference half step in the caller's scaled variable. */
  scaledStep: number;
  minusBoundary: CoronaryHydraulicBoundaryInputV2;
  plusBoundary: CoronaryHydraulicBoundaryInputV2;
}>;

/** Structurally assignable to NonCoronaryConservativeCompanionSensitivitiesV1. */
export type CoronaryConservativeCompanionSensitivitiesV2 = Readonly<{
  dCandidateCompanionBloodVolumeMlDScaledIndependentVolume:
    readonly number[];
  dOuterBoundaryNetVolumeRateMlPerSecDScaledIndependentVolume: Readonly<{
    Ao: readonly number[];
    RA: readonly number[];
  }>;
}>;

export type CoronaryBackwardEulerImplicitDirectionalSensitivitiesV2 =
  Readonly<{
    dCandidateVolumeMlByNodeDScaledVariable:
      readonly CoronaryConservedVolumeStateV2[];
    dCandidateCoronaryBloodVolumeMlDScaledVariable: readonly number[];
    dTotalInletFlowMlPerSecDScaledVariable: readonly number[];
    dCommonCoronaryVenousOutletFlowMlPerSecDScaledVariable:
      readonly number[];
    conservativeCompanionSensitivities:
      CoronaryConservativeCompanionSensitivitiesV2;
    diagnostics: Readonly<{
      baseTrialReusedWithoutResolve: true;
      candidateTrialResolveCount: 0;
      directionCount: number;
      exactZeroBoundaryDirectionCount: number;
      baseResidualProbeEvaluationCount: number;
      volumeJacobianProbeEvaluationCount: number;
      boundaryResidualProbeEvaluationCount: number;
      observableProbeEvaluationCount: number;
      implicitLinearSolveCount: number;
      hydraulicResidualEvaluationCount: number;
      maximumAbsoluteReconstructedBaseResidualMl: number;
      maximumAbsoluteLinearizedResidualMlPerScaledVariable: number;
    }>;
  }>;

export type CoronaryBackwardEulerImplicitSensitivityRequestV2 = Readonly<{
  previousAcceptedState: CoronaryAcceptedHydraulicStateV2;
  trialInput: CoronaryBackwardEulerTrialInputV2;
  prior?: CoronaryTopologyPriorV2;
  topology?: CoronaryTopologyV2;
  baseTrial: CoronaryBackwardEulerTrialV2;
  boundaryDirections: readonly CoronaryImplicitBoundaryDirectionV2[];
  scratchWorkspace?: CoronaryBackwardEulerScratchWorkspaceV2;
}>;

export type CoronaryPressureLadderInitializerOptionsV2 = Readonly<{
  maximumNewtonIterations: number;
  maximumLineSearchBacktracks: number;
  absoluteContinuityToleranceMlPerSec: number;
  finiteDifferenceRelativeStep: number;
}>;

export type CoronaryPressureLadderInitializationV2 = Readonly<{
  acceptedState: CoronaryAcceptedHydraulicStateV2;
  diagnostics: Readonly<{
    converged: true;
    newtonIterations: number;
    totalLineSearchBacktracks: number;
    maximumAbsoluteNodeContinuityResidualMlPerSec: number;
    /** Anatomical construction ledger; not an isolated fixed-volume constraint. */
    structuralPriorCoronaryBloodVolumeMl: number;
    pressureConsistentCoronaryBloodVolumeMl: number;
    /** Positive means the coupled circulation must transfer blood into coronary storage. */
    requiredCoronaryVolumeTransferMl: number;
    hydraulics: CoronaryHydraulicEvaluationV2;
  }>;
}>;

export type CoronaryHydraulicCheckpointV2 = Readonly<{
  schema: "circleheart.coronary-hydraulic-checkpoint.v2";
  topologyId: CoronaryTopologyPriorV2["topologyId"];
  priorFingerprint: string;
  collapseHydraulicsFingerprint: string;
  acceptedState: CoronaryAcceptedHydraulicStateV2;
}>;

export const NORMAL_VASODILATORY_TONE_MINIMUM_SCALE_V2 = 4 / 45;
export const NORMAL_CORONARY_TONE_MAXIMUM_SCALE_V2 = 2;

export type CoronaryCollapseHydraulicsPriorV2 = Readonly<{
  mode: "smooth-area-collapse-v1" | "disabled-mechanism-ablation";
  residualHydraulicAreaFraction: number;
  hydraulicAreaReferenceVolumeMlByNode:
    CoronaryConservedVolumeRecordV2<number>;
  referenceOwner: "loaded-cold-volume-ablation-prior-not-zero-ptm-pv-volume";
}>;

export function buildCoronaryCollapseHydraulicsPriorV2(
  topology: CoronaryTopologyV2 = buildCoronaryTopologyV2(),
  residualHydraulicAreaFraction = 0.10,
): CoronaryCollapseHydraulicsPriorV2 {
  if (
    !Number.isFinite(residualHydraulicAreaFraction)
    || residualHydraulicAreaFraction <= 0
    || residualHydraulicAreaFraction >= 1
  ) {
    throw new RangeError("collapse residual hydraulic area must lie in (0, 1)");
  }
  validateCoronaryTopologyV2(topology);
  return Object.freeze({
    mode: "smooth-area-collapse-v1" as const,
    residualHydraulicAreaFraction,
    hydraulicAreaReferenceVolumeMlByNode: Object.freeze(Object.fromEntries(
      topology.nodes.map((node) => [node.nodeId, node.coldSeedVolumeMl]),
    )) as CoronaryConservedVolumeRecordV2<number>,
    referenceOwner:
      "loaded-cold-volume-ablation-prior-not-zero-ptm-pv-volume" as const,
  });
}

export const NORMAL_CORONARY_COLLAPSE_HYDRAULICS_PRIOR_V2 =
  buildCoronaryCollapseHydraulicsPriorV2();

export function disableCoronaryCollapseHydraulicsV2(
  prior: CoronaryCollapseHydraulicsPriorV2 =
    NORMAL_CORONARY_COLLAPSE_HYDRAULICS_PRIOR_V2,
  topology: CoronaryTopologyV2 = buildCoronaryTopologyV2(),
): CoronaryCollapseHydraulicsPriorV2 {
  validateCollapseHydraulicsV2(prior, topology);
  return Object.freeze({
    ...prior,
    mode: "disabled-mechanism-ablation" as const,
  });
}

function normalLayerDiseaseV2(): CoronaryLayerDiseaseInputV2 {
  return Object.freeze({
    structuralR1ResistanceScale: 1,
    structuralRmResistanceScale: 1,
    vasodilatoryToneMinimumResistanceScale:
      NORMAL_VASODILATORY_TONE_MINIMUM_SCALE_V2,
  });
}

export const NORMAL_CORONARY_DISEASE_INPUT_V2 = Object.freeze(
  Object.fromEntries(CORONARY_TERRITORY_IDS_V2.map((territoryId) => [
    territoryId,
    Object.freeze({
      focalStenosisAdditionalLinearResistanceMmHgSecPerMl: 0,
      focalStenosisAdditionalQuadraticResistanceMmHgSec2PerMl2: 0,
      layers: Object.freeze({
        subepicardial: normalLayerDiseaseV2(),
        subendocardial: normalLayerDiseaseV2(),
      }),
    }),
  ])),
) as CoronaryDiseaseInputV2;

export const CORONARY_STENOSIS_GEOMETRY_PRIOR_V2 = Object.freeze({
  LAD: Object.freeze({
    healthyDiameterMm: 3.2,
    lesionLengthMm: 10,
    bloodDynamicViscosityPaSec: 0.0035,
    bloodDensityKgPerM3: 1060,
    separationLossCoefficient: 1.52,
  }),
  LCx: Object.freeze({
    healthyDiameterMm: 3.0,
    lesionLengthMm: 10,
    bloodDynamicViscosityPaSec: 0.0035,
    bloodDensityKgPerM3: 1060,
    separationLossCoefficient: 1.52,
  }),
  RCA: Object.freeze({
    healthyDiameterMm: 3.2,
    lesionLengthMm: 10,
    bloodDynamicViscosityPaSec: 0.0035,
    bloodDensityKgPerM3: 1060,
    separationLossCoefficient: 1.52,
  }),
}) satisfies CoronaryTerritoryRecordV2<YoungTsaiCoronaryStenosisGeometryV1>;

/** Optional disease-authoring adapter; the hydraulic solver consumes coefficients. */
export function mapFocalDiameterStenosisV2(
  territoryId: (typeof CORONARY_TERRITORY_IDS_V2)[number],
  diameterStenosisFraction01: number,
): Readonly<{
  focalStenosisAdditionalLinearResistanceMmHgSecPerMl: number;
  focalStenosisAdditionalQuadraticResistanceMmHgSec2PerMl2: number;
}> {
  const mapped = mapYoungTsaiCoronaryStenosisV1(
    diameterStenosisFraction01,
    CORONARY_STENOSIS_GEOMETRY_PRIOR_V2[territoryId],
  );
  return Object.freeze({
    focalStenosisAdditionalLinearResistanceMmHgSecPerMl:
      mapped.additionalLinearResistanceMmHgSecPerMl,
    focalStenosisAdditionalQuadraticResistanceMmHgSec2PerMl2:
      mapped.additionalQuadraticResistanceMmHgSec2PerMl2,
  });
}

export const DEFAULT_CORONARY_BACKWARD_EULER_SOLVER_OPTIONS_V2 = Object.freeze({
  maximumNewtonIterations: 35,
  maximumLineSearchBacktracks: 24,
  absoluteResidualToleranceMl: 1e-10,
  relativeResidualTolerance: 1e-10,
  finiteDifferenceRelativeStep: 1e-6,
  minimumVolumeFractionOfReference: 1e-8,
}) satisfies CoronaryBackwardEulerSolverOptionsV2;

export const DEFAULT_CORONARY_PRESSURE_LADDER_INITIALIZER_OPTIONS_V2 =
  Object.freeze({
    maximumNewtonIterations: 50,
    maximumLineSearchBacktracks: 24,
    absoluteContinuityToleranceMlPerSec: 1e-10,
    finiteDifferenceRelativeStep: 1e-6,
  }) satisfies CoronaryPressureLadderInitializerOptionsV2;

type MutableHydraulicEvaluationV2 = {
  pressureByNode: number[];
  transmuralPressureByNode: number[];
  flowByEdge: number[];
  linearResistanceByEdge: number[];
  quadraticResistanceByEdge: number[];
  dissipatedPowerByEdge: number[];
  edgeIndexById: Readonly<Record<CoronaryEdgeIdV2, number>>;
  effectiveTone: number[][];
  postLesionPressure: number[];
  focalStenosisLoss: number[];
};

type ResidualEvaluationV2 = Readonly<{
  residual: number[];
  hydraulics: MutableHydraulicEvaluationV2;
}>;

type MutableDenseLinearFactorizationV2 = {
  upper: number[][];
  stages: Array<{
    pivotRow: number;
    factorByRow: number[];
  }>;
};

function createSquareMatrixV2(size: number): number[][] {
  return Array.from({ length: size }, () => Array<number>(size).fill(0));
}

function createMutableDenseLinearFactorizationV2(
  size: number,
): MutableDenseLinearFactorizationV2 {
  return {
    upper: createSquareMatrixV2(size),
    stages: Array.from({ length: size }, () => ({
      pivotRow: 0,
      factorByRow: Array<number>(size).fill(0),
    })),
  };
}

/**
 * Opaque, session-owned scratch storage for repeated backward-Euler trials.
 *
 * The workspace is not accepted scientific state and is never checkpointed.
 * A solve borrows it exclusively, resets its high-water buffer cursor, and
 * returns only frozen copies of accepted state and diagnostics. Keeping the
 * mutable storage behind a WeakMap prevents callers from aliasing numerical
 * intermediates into a durable trial.
 */
export type CoronaryBackwardEulerScratchWorkspaceV2 = Readonly<{
  schemaId: "circleheart-coronary-backward-euler-scratch-workspace-v2";
  topologyId: CoronaryTopologyV2["topologyId"];
}>;

type CoronaryBackwardEulerScratchStorageV2 = {
  readonly nodeIds: readonly CoronaryConservedVolumeNodeIdV2[];
  readonly edgeIds: readonly CoronaryEdgeIdV2[];
  readonly previous: number[];
  readonly minimumVolumes: number[];
  readonly jacobian: number[][];
  readonly pressureDerivativeByVolume: number[];
  readonly linearRhs: number[];
  readonly linearFactorization: MutableDenseLinearFactorizationV2;
  readonly transformedLinearRhs: number[];
  readonly linearSolution: number[];
  readonly residualEvaluations: Array<{
    residual: number[];
    hydraulics: MutableHydraulicEvaluationV2;
  }>;
  residualEvaluationCursor: number;
  inUse: boolean;
};

const CORONARY_BACKWARD_EULER_SCRATCH_STORAGE_V2 = new WeakMap<
  CoronaryBackwardEulerScratchWorkspaceV2,
  CoronaryBackwardEulerScratchStorageV2
>();

const MAXIMUM_RETAINED_CORONARY_RESIDUAL_EVALUATIONS_V2 = 64;

/** Create reusable allocation storage without making it numerical authority. */
export function createCoronaryBackwardEulerScratchWorkspaceV2(
  topology: CoronaryTopologyV2 = buildCoronaryTopologyV2(),
): CoronaryBackwardEulerScratchWorkspaceV2 {
  validateCoronaryTopologyV2(topology);
  const workspace = Object.freeze({
    schemaId:
      "circleheart-coronary-backward-euler-scratch-workspace-v2" as const,
    topologyId: topology.topologyId,
  });
  CORONARY_BACKWARD_EULER_SCRATCH_STORAGE_V2.set(workspace, {
    nodeIds: Object.freeze(topology.nodes.map((node) => node.nodeId)),
    edgeIds: Object.freeze(topology.edges.map((edge) => edge.edgeId)),
    previous: Array<number>(topology.nodes.length).fill(0),
    minimumVolumes: Array<number>(topology.nodes.length).fill(0),
    jacobian: createSquareMatrixV2(topology.nodes.length),
    pressureDerivativeByVolume:
      Array<number>(topology.nodes.length).fill(0),
    linearRhs: Array<number>(topology.nodes.length).fill(0),
    linearFactorization:
      createMutableDenseLinearFactorizationV2(topology.nodes.length),
    transformedLinearRhs: Array<number>(topology.nodes.length).fill(0),
    linearSolution: Array<number>(topology.nodes.length).fill(0),
    residualEvaluations: [],
    residualEvaluationCursor: 0,
    inUse: false,
  });
  return workspace;
}

function borrowCoronaryBackwardEulerScratchWorkspaceV2(
  workspace: CoronaryBackwardEulerScratchWorkspaceV2,
  topology: CoronaryTopologyV2,
): CoronaryBackwardEulerScratchStorageV2 {
  const storage = CORONARY_BACKWARD_EULER_SCRATCH_STORAGE_V2.get(workspace);
  if (storage === undefined) {
    throw new TypeError("coronary backward-Euler scratch workspace is foreign");
  }
  if (
    workspace.schemaId
      !== "circleheart-coronary-backward-euler-scratch-workspace-v2"
    || workspace.topologyId !== topology.topologyId
    || storage.nodeIds.length !== topology.nodes.length
    || storage.edgeIds.length !== topology.edges.length
    || storage.nodeIds.some((nodeId, index) =>
      nodeId !== topology.nodes[index]?.nodeId)
    || storage.edgeIds.some((edgeId, index) =>
      edgeId !== topology.edges[index]?.edgeId)
  ) {
    throw new RangeError(
      "coronary backward-Euler scratch workspace topology mismatch",
    );
  }
  if (storage.inUse) {
    throw new Error("coronary backward-Euler scratch workspace is already in use");
  }
  storage.inUse = true;
  storage.residualEvaluationCursor = 0;
  return storage;
}

function releaseCoronaryBackwardEulerScratchWorkspaceV2(
  storage: CoronaryBackwardEulerScratchStorageV2,
): void {
  storage.inUse = false;
}

function createMutableHydraulicEvaluationV2(
  topology: CoronaryTopologyV2,
  edgeIndexById: Readonly<Record<CoronaryEdgeIdV2, number>>,
): MutableHydraulicEvaluationV2 {
  return {
    pressureByNode: Array<number>(HYDRAULIC_NODE_IDS_V2.length).fill(0),
    transmuralPressureByNode: Array<number>(topology.nodes.length).fill(0),
    flowByEdge: Array<number>(topology.edges.length).fill(0),
    linearResistanceByEdge: Array<number>(topology.edges.length).fill(0),
    quadraticResistanceByEdge: Array<number>(topology.edges.length).fill(0),
    dissipatedPowerByEdge: Array<number>(topology.edges.length).fill(0),
    edgeIndexById,
    effectiveTone: CORONARY_TERRITORY_IDS_V2.map(() =>
      Array<number>(CORONARY_LAYER_IDS_V2.length).fill(0)),
    postLesionPressure:
      Array<number>(CORONARY_TERRITORY_IDS_V2.length).fill(0),
    focalStenosisLoss:
      Array<number>(CORONARY_TERRITORY_IDS_V2.length).fill(0),
  };
}

function nextCoronaryResidualEvaluationV2(
  storage: CoronaryBackwardEulerScratchStorageV2,
  topology: CoronaryTopologyV2,
  edgeIndexById: Readonly<Record<CoronaryEdgeIdV2, number>>,
): { residual: number[]; hydraulics: MutableHydraulicEvaluationV2 } {
  const index = storage.residualEvaluationCursor;
  storage.residualEvaluationCursor += 1;
  if (index < MAXIMUM_RETAINED_CORONARY_RESIDUAL_EVALUATIONS_V2) {
    const existing = storage.residualEvaluations[index];
    if (existing !== undefined) return existing;
  }
  const created = {
    residual: Array<number>(topology.nodes.length).fill(0),
    hydraulics: createMutableHydraulicEvaluationV2(topology, edgeIndexById),
  };
  if (index < MAXIMUM_RETAINED_CORONARY_RESIDUAL_EVALUATIONS_V2) {
    storage.residualEvaluations.push(created);
  }
  return created;
}

const HYDRAULIC_NODE_IDS_V2 = Object.freeze([
  "Ao",
  ...CORONARY_CONSERVED_VOLUME_NODE_IDS_V2,
  "RA",
] as const);

const CANONICAL_NODE_INDEX_V2 = Object.freeze(Object.fromEntries(
  CORONARY_CONSERVED_VOLUME_NODE_IDS_V2.map((nodeId, index) => [nodeId, index]),
)) as CoronaryConservedVolumeRecordV2<number>;

export class CoronaryNetworkConvergenceErrorV2 extends Error {
  readonly finalResidualInfinityNorm: number;
  readonly attemptedNewtonIterations: number;

  constructor(
    message: string,
    finalResidualInfinityNorm: number,
    attemptedNewtonIterations: number,
  ) {
    super(message);
    this.name = "CoronaryNetworkConvergenceErrorV2";
    this.finalResidualInfinityNorm = finalResidualInfinityNorm;
    this.attemptedNewtonIterations = attemptedNewtonIterations;
  }
}

/** Edge-array order is runtime data; incidence and hydraulic lookup share this map. */
export function buildCoronaryEdgeIndexV2(
  topology: CoronaryTopologyV2,
): Readonly<Record<CoronaryEdgeIdV2, number>> {
  validateCoronaryTopologyV2(topology);
  return topology.edgeIndexById;
}

/**
 * Evaluate all 22 odd signed passive edge laws. There is no diode and no
 * inertance. Collapse changes only R1/Rm/R2, and distension never lowers the
 * reference resistance below one.
 */
export function evaluateCoronaryHydraulicsV2(
  volumeMlByNode: CoronaryConservedVolumeStateV2,
  toneResistanceScaleByTerritoryLayer: CoronaryToneStateV2,
  boundary: CoronaryHydraulicBoundaryInputV2,
  disease: CoronaryDiseaseInputV2 = NORMAL_CORONARY_DISEASE_INPUT_V2,
  prior: CoronaryTopologyPriorV2 = NORMAL_ADULT_CORONARY_TOPOLOGY_PRIOR_V2,
  topology: CoronaryTopologyV2 = buildCoronaryTopologyV2(prior),
  collapseHydraulics: CoronaryCollapseHydraulicsPriorV2 =
    buildCoronaryCollapseHydraulicsPriorV2(topology),
): CoronaryHydraulicEvaluationV2 {
  validateBoundaryV2(boundary);
  validateDiseaseV2(disease);
  validateToneV2(toneResistanceScaleByTerritoryLayer);
  validateCoronaryTopologyV2(topology);
  validateCollapseHydraulicsV2(collapseHydraulics, topology);
  const volumes = volumeRecordToArrayV2(volumeMlByNode);
  validateVolumesV2(volumes, topology, 0);
  return freezeHydraulicEvaluationV2(evaluateHydraulicsInternalV2(
    volumes,
    toneResistanceScaleByTerritoryLayer,
    boundary,
    disease,
    topology,
    buildCoronaryEdgeIndexV2(topology),
    collapseHydraulics,
  ));
}

/**
 * Build a static-boundary equilibrium without imposing the Kassab structural
 * sum as an isolated volume constraint. The returned transfer is owned later
 * by the coupled fixed-TBV transaction.
 */
export function initializePressureLadderCoronaryStateV2(
  input: Readonly<{
    boundary: CoronaryHydraulicBoundaryInputV2;
    disease?: CoronaryDiseaseInputV2;
    toneResistanceScaleByTerritoryLayer?: CoronaryToneStateV2;
    collapseHydraulics?: CoronaryCollapseHydraulicsPriorV2;
    options?: Partial<CoronaryPressureLadderInitializerOptionsV2>;
  }>,
  prior: CoronaryTopologyPriorV2 = NORMAL_ADULT_CORONARY_TOPOLOGY_PRIOR_V2,
  topology: CoronaryTopologyV2 = buildCoronaryTopologyV2(prior),
): CoronaryPressureLadderInitializationV2 {
  validateBoundaryV2(input.boundary);
  const disease = input.disease ?? NORMAL_CORONARY_DISEASE_INPUT_V2;
  const tone = input.toneResistanceScaleByTerritoryLayer
    ?? initialCoronaryToneStateV2(prior);
  validateDiseaseV2(disease);
  validateToneV2(tone);
  validateCoronaryTopologyV2(topology);
  const collapseHydraulics = input.collapseHydraulics
    ?? buildCoronaryCollapseHydraulicsPriorV2(topology);
  validateCollapseHydraulicsV2(collapseHydraulics, topology);
  const options = resolveInitializerOptionsV2(input.options);
  const edgeIndex = buildCoronaryEdgeIndexV2(topology);
  let candidatePressure = referencePressureLadderV2(input.boundary, prior);

  const evaluate = (pressures: number[]): ResidualEvaluationV2 => {
    const volumes = pressuresToVolumeArrayV2(pressures, input.boundary, topology);
    const hydraulics = evaluateHydraulicsInternalV2(
      volumes,
      tone,
      input.boundary,
      disease,
      topology,
      edgeIndex,
      collapseHydraulics,
    );
    return {
      residual: flowContinuityRateV2(hydraulics.flowByEdge, topology),
      hydraulics,
    };
  };

  let evaluated = evaluate(candidatePressure);
  let residualNorm = infinityNormV2(evaluated.residual);
  let iterations = 0;
  let backtracks = 0;
  while (residualNorm > options.absoluteContinuityToleranceMlPerSec) {
    if (iterations >= options.maximumNewtonIterations) {
      throw new CoronaryNetworkConvergenceErrorV2(
        "coronary V2 pressure-ladder initializer failed to converge",
        residualNorm,
        iterations,
      );
    }
    const jacobian = numericalJacobianUnboundedV2(
      candidatePressure,
      evaluated.residual,
      evaluate,
      options.finiteDifferenceRelativeStep,
    );
    const step = solveDenseLinearSystemV2(
      jacobian,
      evaluated.residual.map((value) => -value),
    );
    const accepted = lineSearchV2(
      candidatePressure,
      step,
      residualNorm,
      evaluate,
      options.maximumLineSearchBacktracks,
      1,
    );
    candidatePressure = accepted.candidate;
    evaluated = accepted.evaluated;
    residualNorm = accepted.norm;
    backtracks += accepted.backtracks;
    iterations += 1;
  }

  const volumes = pressuresToVolumeArrayV2(
    candidatePressure,
    input.boundary,
    topology,
  );
  const acceptedState = freezeAcceptedStateV2({
    acceptedTimeSec: 0,
    revision: 0,
    volumeMlByNode: arrayToVolumeRecordV2(volumes),
    toneResistanceScaleByTerritoryLayer: tone,
  }, topology);
  const structuralPrior = coronaryColdSeedBloodVolumeMlV2(prior);
  const pressureConsistent = sumV2(volumes);
  return Object.freeze({
    acceptedState,
    diagnostics: Object.freeze({
      converged: true as const,
      newtonIterations: iterations,
      totalLineSearchBacktracks: backtracks,
      maximumAbsoluteNodeContinuityResidualMlPerSec: residualNorm,
      structuralPriorCoronaryBloodVolumeMl: structuralPrior,
      pressureConsistentCoronaryBloodVolumeMl: pressureConsistent,
      requiredCoronaryVolumeTransferMl: pressureConsistent - structuralPrior,
      hydraulics: freezeHydraulicEvaluationV2(evaluated.hydraulics),
    }),
  });
}

/** Pure fully implicit hydraulic trial; accepted tone is never updated here. */
export function solveCoronaryBackwardEulerTrialV2(
  previousAcceptedState: CoronaryAcceptedHydraulicStateV2,
  input: CoronaryBackwardEulerTrialInputV2,
  prior: CoronaryTopologyPriorV2 = NORMAL_ADULT_CORONARY_TOPOLOGY_PRIOR_V2,
  topology: CoronaryTopologyV2 = buildCoronaryTopologyV2(prior),
  scratchWorkspace?: CoronaryBackwardEulerScratchWorkspaceV2,
): CoronaryBackwardEulerTrialV2 {
  validateCoronaryTopologyV2(topology);
  const scratchStorage = scratchWorkspace === undefined
    ? null
    : borrowCoronaryBackwardEulerScratchWorkspaceV2(
      scratchWorkspace,
      topology,
    );
  try {
    return solveCoronaryBackwardEulerTrialInternalV2(
      previousAcceptedState,
      input,
      topology,
      scratchStorage,
    );
  } finally {
    if (scratchStorage !== null) {
      releaseCoronaryBackwardEulerScratchWorkspaceV2(scratchStorage);
    }
  }
}

function solveCoronaryBackwardEulerTrialInternalV2(
  previousAcceptedState: CoronaryAcceptedHydraulicStateV2,
  input: CoronaryBackwardEulerTrialInputV2,
  topology: CoronaryTopologyV2,
  scratchStorage: CoronaryBackwardEulerScratchStorageV2 | null,
): CoronaryBackwardEulerTrialV2 {
  validateAcceptedStateV2(previousAcceptedState, topology);
  validateTrialInputV2(input);
  const disease = input.disease ?? NORMAL_CORONARY_DISEASE_INPUT_V2;
  const collapseHydraulics = input.collapseHydraulics
    ?? buildCoronaryCollapseHydraulicsPriorV2(topology);
  validateDiseaseV2(disease);
  validateCollapseHydraulicsV2(collapseHydraulics, topology);
  const options = resolveSolverOptionsV2(input.solverOptions);
  const edgeIndex = buildCoronaryEdgeIndexV2(topology);
  const previous = scratchStorage?.previous
    ?? Array<number>(topology.nodes.length).fill(0);
  const minimumVolumes = scratchStorage?.minimumVolumes
    ?? Array<number>(topology.nodes.length).fill(0);
  for (let index = 0; index < topology.nodes.length; index += 1) {
    previous[index] = previousAcceptedState.volumeMlByNode[
      CORONARY_CONSERVED_VOLUME_NODE_IDS_V2[index]
    ];
    minimumVolumes[index] = topology.nodes[index].pressureVolume.referenceVolumeMl
      * options.minimumVolumeFractionOfReference;
  }
  validateVolumesV2(
    previous,
    topology,
    options.minimumVolumeFractionOfReference,
  );

  const evaluate = (candidate: number[]): ResidualEvaluationV2 => {
    if (input.evaluationCounterCollection === "enabled") {
      hydraulicResidualEvaluationCount += 1;
    }
    const reusableEvaluation = scratchStorage === null
      ? null
      : nextCoronaryResidualEvaluationV2(
        scratchStorage,
        topology,
        edgeIndex,
      );
    const hydraulics = evaluateHydraulicsInternalV2(
      candidate,
      previousAcceptedState.toneResistanceScaleByTerritoryLayer,
      input.boundary,
      disease,
      topology,
      edgeIndex,
      collapseHydraulics,
      reusableEvaluation?.hydraulics,
    );
    const residual = reusableEvaluation?.residual
      ?? Array<number>(candidate.length).fill(0);
    for (let index = 0; index < candidate.length; index += 1) {
      residual[index] = candidate[index] - previous[index];
    }
    accumulateFlowContinuityV2(
      residual,
      hydraulics.flowByEdge,
      input.dtSec,
      topology,
    );
    return { residual, hydraulics };
  };

  let hydraulicResidualEvaluationCount = 0;
  let candidate = previous.slice();
  let evaluated = evaluate(candidate);
  let residualNorm = infinityNormV2(evaluated.residual);
  const convergenceTolerance = options.absoluteResidualToleranceMl
    + options.relativeResidualTolerance * Math.max(1, ...previous);
  let iterations = 0;
  let backtracks = 0;
  while (residualNorm > convergenceTolerance) {
    if (iterations >= options.maximumNewtonIterations) {
      throw new CoronaryNetworkConvergenceErrorV2(
        "coronary V2 backward-Euler Newton failed to converge",
        residualNorm,
        iterations,
      );
    }
    const jacobian = analyticSparseCoronaryVolumeJacobianV2(
      candidate,
      evaluated.hydraulics,
      input.dtSec,
      topology,
      collapseHydraulics,
      scratchStorage ?? undefined,
    );
    const linearRhs = scratchStorage?.linearRhs
      ?? Array<number>(evaluated.residual.length).fill(0);
    for (let index = 0; index < evaluated.residual.length; index += 1) {
      linearRhs[index] = -evaluated.residual[index];
    }
    const step = solveDenseLinearSystemV2(
      jacobian,
      linearRhs,
      scratchStorage ?? undefined,
    );
    const maximumStep = maximumPositiveStepV2(
      candidate,
      step,
      minimumVolumes,
    );
    const accepted = lineSearchV2(
      candidate,
      step,
      residualNorm,
      evaluate,
      options.maximumLineSearchBacktracks,
      maximumStep,
    );
    candidate = accepted.candidate;
    evaluated = accepted.evaluated;
    residualNorm = accepted.norm;
    backtracks += accepted.backtracks;
    iterations += 1;
  }

  const previousTotal = sumV2(previous);
  const candidateTotal = sumV2(candidate);
  const inletFlow = totalInletFlowV2(
    evaluated.hydraulics.flowByEdge,
    edgeIndex,
  );
  const outletFlow = evaluated.hydraulics.flowByEdge[edgeIndex.CV_RA];
  const continuityResidual = arrayToVolumeRecordV2(evaluated.residual);
  const storageRate = arrayToVolumeRecordV2(candidate.map(
    (volume, index) => (volume - previous[index]) / input.dtSec,
  ));
  const ledgerResidual = candidateTotal - previousTotal
    - input.dtSec * (inletFlow - outletFlow);
  validateVolumesV2(
    candidate,
    topology,
    options.minimumVolumeFractionOfReference,
  );
  const candidateAcceptedState = freezeAcceptedStateV2({
    acceptedTimeSec: previousAcceptedState.acceptedTimeSec + input.dtSec,
    revision: previousAcceptedState.revision + 1,
    volumeMlByNode: arrayToVolumeRecordV2(candidate),
    toneResistanceScaleByTerritoryLayer:
      previousAcceptedState.toneResistanceScaleByTerritoryLayer,
  }, topology);

  return Object.freeze({
    baseAcceptedRevision: previousAcceptedState.revision,
    baseAcceptedTimeSec: previousAcceptedState.acceptedTimeSec,
    dtSec: input.dtSec,
    candidateAcceptedState,
    diagnostics: Object.freeze({
      converged: true as const,
      newtonIterations: iterations,
      totalLineSearchBacktracks: backtracks,
      ...(input.evaluationCounterCollection === "enabled"
        ? { hydraulicResidualEvaluationCount }
        : {}),
      finalResidualInfinityNormMl: residualNorm,
      maximumAbsoluteNodeContinuityResidualMl:
        infinityNormV2(evaluated.residual),
      continuityResidualMlByNode: continuityResidual,
      storageRateMlPerSecByNode: storageRate,
      previousCoronaryBloodVolumeMl: previousTotal,
      candidateCoronaryBloodVolumeMl: candidateTotal,
      coronaryBloodVolumeChangeMl: candidateTotal - previousTotal,
      signedBoundaryInletVolumeMl: input.dtSec * inletFlow,
      signedBoundaryOutletVolumeMl: input.dtSec * outletFlow,
      exactBloodVolumeLedgerResidualMl: ledgerResidual,
      hydraulics: freezeHydraulicEvaluationV2(evaluated.hydraulics),
    }),
  });
}

/**
 * Reconstruct the converged BE trial's implicit directional derivative without
 * resolving any candidate trial. Exact local tangents use the same candidate,
 * accepted tone, disease, and collapse ownership as the converged base trial.
 */
export function computeCoronaryBackwardEulerImplicitDirectionalSensitivitiesV2(
  request: CoronaryBackwardEulerImplicitSensitivityRequestV2,
): CoronaryBackwardEulerImplicitDirectionalSensitivitiesV2 {
  const prior = request.prior ?? NORMAL_ADULT_CORONARY_TOPOLOGY_PRIOR_V2;
  const topology = request.topology ?? buildCoronaryTopologyV2(prior);
  validateCoronaryTopologyV2(topology);
  const scratchStorage = request.scratchWorkspace === undefined
    ? null
    : borrowCoronaryBackwardEulerScratchWorkspaceV2(
      request.scratchWorkspace,
      topology,
    );
  try {
    return computeCoronaryBackwardEulerImplicitDirectionalSensitivitiesInternalV2(
      request,
      prior,
      topology,
      scratchStorage,
    );
  } finally {
    if (scratchStorage !== null) {
      releaseCoronaryBackwardEulerScratchWorkspaceV2(scratchStorage);
    }
  }
}

function computeCoronaryBackwardEulerImplicitDirectionalSensitivitiesInternalV2(
  request: CoronaryBackwardEulerImplicitSensitivityRequestV2,
  prior: CoronaryTopologyPriorV2,
  topology: CoronaryTopologyV2,
  scratchStorage: CoronaryBackwardEulerScratchStorageV2 | null,
): CoronaryBackwardEulerImplicitDirectionalSensitivitiesV2 {
  validateAcceptedStateV2(request.previousAcceptedState, topology);
  validateTrialInputV2(request.trialInput);
  if (request.boundaryDirections.length === 0) {
    throw new RangeError("coronary implicit sensitivity requires a direction");
  }
  const baseTrial = request.baseTrial;
  if (
    baseTrial.baseAcceptedRevision !== request.previousAcceptedState.revision
    || baseTrial.baseAcceptedTimeSec
      !== request.previousAcceptedState.acceptedTimeSec
    || baseTrial.dtSec !== request.trialInput.dtSec
    || baseTrial.candidateAcceptedState.revision
      !== request.previousAcceptedState.revision + 1
    || baseTrial.candidateAcceptedState.acceptedTimeSec
      !== request.previousAcceptedState.acceptedTimeSec
        + request.trialInput.dtSec
  ) {
    throw new RangeError(
      "coronary implicit sensitivity base trial does not match previous/input",
    );
  }
  const disease = request.trialInput.disease ?? NORMAL_CORONARY_DISEASE_INPUT_V2;
  const collapseHydraulics = request.trialInput.collapseHydraulics
    ?? buildCoronaryCollapseHydraulicsPriorV2(topology);
  validateDiseaseV2(disease);
  validateCollapseHydraulicsV2(collapseHydraulics, topology);
  const options = resolveSolverOptionsV2(request.trialInput.solverOptions);
  const edgeIndex = buildCoronaryEdgeIndexV2(topology);
  const previous = volumeRecordToArrayV2(
    request.previousAcceptedState.volumeMlByNode,
  );
  const candidate = volumeRecordToArrayV2(
    baseTrial.candidateAcceptedState.volumeMlByNode,
  );
  validateVolumesV2(
    candidate,
    topology,
    options.minimumVolumeFractionOfReference,
  );

  // Exact scalar equality is intentional: a tolerance could erase a real,
  // small outer-Newton direction and silently corrupt its Jacobian column.
  const exactZeroBoundaryDirection = request.boundaryDirections.map(
    (direction) => {
      if (!Number.isFinite(direction.scaledStep) || direction.scaledStep <= 0) {
        throw new RangeError("scaledStep must be positive and finite");
      }
      validateBoundaryV2(direction.minusBoundary);
      validateBoundaryV2(direction.plusBoundary);
      return hydraulicBoundaryExactlyEqualV2(
        direction.minusBoundary,
        request.trialInput.boundary,
      ) && hydraulicBoundaryExactlyEqualV2(
        direction.plusBoundary,
        request.trialInput.boundary,
      );
    },
  );
  const exactZeroBoundaryDirectionCount = exactZeroBoundaryDirection.reduce(
    (count, isZero) => count + (isZero ? 1 : 0),
    0,
  );
  let hydraulicResidualEvaluationCount = 0;
  let baseResidualProbeEvaluationCount = 0;
  let volumeJacobianProbeEvaluationCount = 0;
  const boundaryResidualProbeEvaluationCount = 0;
  const observableProbeEvaluationCount = 0;
  let implicitLinearSolveCount = 0;

  const evaluate = (
    candidateVolumes: number[],
    boundary: CoronaryHydraulicBoundaryInputV2,
  ): ResidualEvaluationV2 => {
    hydraulicResidualEvaluationCount += 1;
    validateBoundaryV2(boundary);
    validateVolumesV2(
      candidateVolumes,
      topology,
      options.minimumVolumeFractionOfReference,
    );
    const reusableEvaluation = scratchStorage === null
      ? null
      : nextCoronaryResidualEvaluationV2(
        scratchStorage,
        topology,
        edgeIndex,
      );
    const hydraulics = evaluateHydraulicsInternalV2(
      candidateVolumes,
      request.previousAcceptedState.toneResistanceScaleByTerritoryLayer,
      boundary,
      disease,
      topology,
      edgeIndex,
      collapseHydraulics,
      reusableEvaluation?.hydraulics,
    );
    const residual = reusableEvaluation?.residual
      ?? Array<number>(candidateVolumes.length).fill(0);
    for (let index = 0; index < candidateVolumes.length; index += 1) {
      residual[index] = candidateVolumes[index] - previous[index];
    }
    accumulateFlowContinuityV2(
      residual,
      hydraulics.flowByEdge,
      request.trialInput.dtSec,
      topology,
    );
    return { residual, hydraulics };
  };

  const dVolumeByDirection: CoronaryConservedVolumeStateV2[] = [];
  const dTotalVolume: number[] = [];
  const dTotalInlet: number[] = [];
  const dCommonVenousOutlet: number[] = [];
  const zeroVolumeDerivative = arrayToVolumeRecordV2(
    Array(candidate.length).fill(0),
  );
  baseResidualProbeEvaluationCount += 1;
  const base = evaluate(candidate.slice(), request.trialInput.boundary);
  const baseResidualNorm = infinityNormV2(base.residual);
  const baseResidualLimit = Math.max(
    1e-8,
    100 * (
      baseTrial.diagnostics.finalResidualInfinityNormMl
      + options.absoluteResidualToleranceMl
    ),
  );
  if (baseResidualNorm > baseResidualLimit) {
    throw new RangeError(
      "coronary implicit sensitivity base trial is not converged for supplied input",
    );
  }
  let maximumLinearizedResidual = 0;
  let jacobian: number[][] | null = null;
  let jacobianFactorization: DenseLinearFactorizationV2 | null = null;
  if (exactZeroBoundaryDirectionCount < request.boundaryDirections.length) {
    jacobian = analyticSparseCoronaryVolumeJacobianV2(
      candidate,
      base.hydraulics,
      request.trialInput.dtSec,
      topology,
      collapseHydraulics,
      scratchStorage ?? undefined,
    );
    jacobianFactorization = factorDenseLinearSystemV2(
      jacobian,
      scratchStorage?.linearFactorization,
    );
  }

  for (
    let directionIndex = 0;
    directionIndex < request.boundaryDirections.length;
    directionIndex += 1
  ) {
    const direction = request.boundaryDirections[directionIndex];
    if (exactZeroBoundaryDirection[directionIndex]) {
      dVolumeByDirection.push(zeroVolumeDerivative);
      dTotalVolume.push(0);
      dTotalInlet.push(0);
      dCommonVenousOutlet.push(0);
      continue;
    }
    if (jacobian === null || jacobianFactorization === null) {
      throw new Error("nonzero coronary direction is missing its Jacobian");
    }
    const dResidualDScaledVariable =
      analyticCoronaryBoundaryResidualDirectionalDerivativeV2(
        base.hydraulics,
        direction,
        request.trialInput.dtSec,
        topology,
      );
    requireFiniteVectorV2(
      dResidualDScaledVariable,
      "coronary boundary residual directional derivative",
    );
    const linearRhs = scratchStorage?.linearRhs
      ?? Array<number>(dResidualDScaledVariable.length).fill(0);
    for (let index = 0; index < dResidualDScaledVariable.length; index += 1) {
      linearRhs[index] = -dResidualDScaledVariable[index];
    }
    const dVolume = solveFactoredDenseLinearSystemV2(
      jacobianFactorization,
      linearRhs,
      scratchStorage?.transformedLinearRhs,
      scratchStorage?.linearSolution,
    );
    implicitLinearSolveCount += 1;
    requireFiniteVectorV2(
      dVolume,
      "coronary implicit volume directional derivative",
    );
    const linearizedResidual = jacobian.map((row, rowIndex) =>
      row.reduce(
        (sum, value, columnIndex) => sum + value * dVolume[columnIndex],
        dResidualDScaledVariable[rowIndex],
      ));
    maximumLinearizedResidual = Math.max(
      maximumLinearizedResidual,
      infinityNormV2(linearizedResidual),
    );

    const combinedPlusVolume = candidate.map(
      (value, index) => value + direction.scaledStep * dVolume[index],
    );
    const combinedMinusVolume = candidate.map(
      (value, index) => value - direction.scaledStep * dVolume[index],
    );
    validateVolumesV2(
      combinedPlusVolume,
      topology,
      options.minimumVolumeFractionOfReference,
    );
    validateVolumesV2(
      combinedMinusVolume,
      topology,
      options.minimumVolumeFractionOfReference,
    );
    const {
      totalVolumeDerivative,
      totalInletDerivative,
      commonVenousOutletDerivative,
    } = analyticCoronaryObservableDirectionalDerivativesV2(
      candidate,
      dVolume,
      base.hydraulics,
      direction,
      topology,
      edgeIndex,
    );
    requireFiniteVectorV2(
      [
        totalVolumeDerivative,
        totalInletDerivative,
        commonVenousOutletDerivative,
      ],
      "coronary implicit observable directional derivative",
    );
    dVolumeByDirection.push(arrayToVolumeRecordV2(dVolume));
    dTotalVolume.push(totalVolumeDerivative);
    dTotalInlet.push(totalInletDerivative);
    dCommonVenousOutlet.push(commonVenousOutletDerivative);
  }

  const frozenTotalVolume = Object.freeze(dTotalVolume);
  const frozenTotalInlet = Object.freeze(dTotalInlet);
  const frozenCommonVenousOutlet = Object.freeze(dCommonVenousOutlet);
  return Object.freeze({
    dCandidateVolumeMlByNodeDScaledVariable:
      Object.freeze(dVolumeByDirection),
    dCandidateCoronaryBloodVolumeMlDScaledVariable: frozenTotalVolume,
    dTotalInletFlowMlPerSecDScaledVariable: frozenTotalInlet,
    dCommonCoronaryVenousOutletFlowMlPerSecDScaledVariable:
      frozenCommonVenousOutlet,
    conservativeCompanionSensitivities: Object.freeze({
      dCandidateCompanionBloodVolumeMlDScaledIndependentVolume:
        frozenTotalVolume,
      dOuterBoundaryNetVolumeRateMlPerSecDScaledIndependentVolume:
        Object.freeze({
          Ao: Object.freeze(frozenTotalInlet.map(
            (value) => value === 0 ? 0 : -value,
          )),
          RA: frozenCommonVenousOutlet,
        }),
    }),
    diagnostics: Object.freeze({
      baseTrialReusedWithoutResolve: true as const,
      candidateTrialResolveCount: 0 as const,
      directionCount: request.boundaryDirections.length,
      exactZeroBoundaryDirectionCount,
      baseResidualProbeEvaluationCount,
      volumeJacobianProbeEvaluationCount,
      boundaryResidualProbeEvaluationCount,
      observableProbeEvaluationCount,
      implicitLinearSolveCount,
      hydraulicResidualEvaluationCount,
      maximumAbsoluteReconstructedBaseResidualMl: baseResidualNorm,
      maximumAbsoluteLinearizedResidualMlPerScaledVariable:
        maximumLinearizedResidual,
    }),
  });
}

export class CoronaryBackwardEulerTransactionV2 {
  readonly prior: CoronaryTopologyPriorV2;
  readonly topology: CoronaryTopologyV2;
  readonly collapseHydraulics: CoronaryCollapseHydraulicsPriorV2;
  private acceptedState: CoronaryAcceptedHydraulicStateV2;
  private epoch = 0;
  private readonly trialEpoch = new WeakMap<object, number>();

  constructor(
    prior: CoronaryTopologyPriorV2,
    initialState: CoronaryAcceptedHydraulicStateV2,
    topology: CoronaryTopologyV2 = buildCoronaryTopologyV2(prior),
    collapseHydraulics: CoronaryCollapseHydraulicsPriorV2 =
      buildCoronaryCollapseHydraulicsPriorV2(topology),
  ) {
    validateCoronaryTopologyV2(topology);
    validateCollapseHydraulicsV2(collapseHydraulics, topology);
    validateAcceptedStateV2(initialState, topology);
    this.prior = prior;
    this.topology = topology;
    this.collapseHydraulics = collapseHydraulics;
    this.acceptedState = cloneAcceptedStateV2(initialState, topology);
  }

  getAcceptedState(): CoronaryAcceptedHydraulicStateV2 {
    return this.acceptedState;
  }

  beginTrial(input: CoronaryBackwardEulerTrialInputV2): CoronaryBackwardEulerTrialV2 {
    if (input.collapseHydraulics !== undefined) {
      throw new RangeError(
        "coronary transaction owns collapse hydraulics; use the pure solver for ablation",
      );
    }
    const trial = solveCoronaryBackwardEulerTrialV2(
      this.acceptedState,
      Object.freeze({ ...input, collapseHydraulics: this.collapseHydraulics }),
      this.prior,
      this.topology,
    );
    this.trialEpoch.set(trial, this.epoch);
    return trial;
  }

  commit(trial: CoronaryBackwardEulerTrialV2): CoronaryAcceptedHydraulicStateV2 {
    this.assertLiveTrial(trial);
    this.acceptedState = cloneAcceptedStateV2(
      trial.candidateAcceptedState,
      this.topology,
    );
    this.epoch += 1;
    return this.acceptedState;
  }

  rollback(trial: CoronaryBackwardEulerTrialV2): CoronaryAcceptedHydraulicStateV2 {
    this.assertLiveTrial(trial);
    this.trialEpoch.delete(trial);
    return this.acceptedState;
  }

  createCheckpoint(): CoronaryHydraulicCheckpointV2 {
    return Object.freeze({
      schema: "circleheart.coronary-hydraulic-checkpoint.v2" as const,
      topologyId: this.prior.topologyId,
      priorFingerprint: coronaryTopologyPriorFingerprintV2(this.prior),
      collapseHydraulicsFingerprint:
        coronaryConfigurationFingerprintV2(this.collapseHydraulics),
      acceptedState: cloneAcceptedStateV2(this.acceptedState, this.topology),
    });
  }

  restoreCheckpoint(
    checkpoint: CoronaryHydraulicCheckpointV2,
  ): CoronaryAcceptedHydraulicStateV2 {
    if (checkpoint.schema !== "circleheart.coronary-hydraulic-checkpoint.v2") {
      throw new RangeError("unsupported coronary V2 hydraulic checkpoint schema");
    }
    if (checkpoint.topologyId !== this.prior.topologyId) {
      throw new RangeError("coronary V2 hydraulic checkpoint topology mismatch");
    }
    if (
      checkpoint.priorFingerprint !== coronaryTopologyPriorFingerprintV2(this.prior)
      || checkpoint.collapseHydraulicsFingerprint
        !== coronaryConfigurationFingerprintV2(this.collapseHydraulics)
    ) {
      throw new RangeError("coronary V2 hydraulic checkpoint parameter mismatch");
    }
    validateAcceptedStateV2(checkpoint.acceptedState, this.topology);
    this.acceptedState = cloneAcceptedStateV2(
      checkpoint.acceptedState,
      this.topology,
    );
    this.epoch += 1;
    return this.acceptedState;
  }

  private assertLiveTrial(trial: CoronaryBackwardEulerTrialV2): void {
    if (
      this.trialEpoch.get(trial) !== this.epoch
      || trial.baseAcceptedRevision !== this.acceptedState.revision
      || trial.baseAcceptedTimeSec !== this.acceptedState.acceptedTimeSec
    ) {
      throw new Error("stale or foreign coronary V2 hydraulic trial");
    }
  }
}

function evaluateHydraulicsInternalV2(
  volumes: readonly number[],
  tone: CoronaryToneStateV2,
  boundary: CoronaryHydraulicBoundaryInputV2,
  disease: CoronaryDiseaseInputV2,
  topology: CoronaryTopologyV2,
  edgeIndexById: Readonly<Record<CoronaryEdgeIdV2, number>>,
  collapseHydraulics: CoronaryCollapseHydraulicsPriorV2,
  destination?: MutableHydraulicEvaluationV2,
): MutableHydraulicEvaluationV2 {
  validateVolumesV2(volumes, topology, 0);
  const evaluated = destination
    ?? createMutableHydraulicEvaluationV2(topology, edgeIndexById);
  if (
    evaluated.pressureByNode.length !== HYDRAULIC_NODE_IDS_V2.length
    || evaluated.transmuralPressureByNode.length !== topology.nodes.length
    || evaluated.flowByEdge.length !== topology.edges.length
    || evaluated.linearResistanceByEdge.length !== topology.edges.length
    || evaluated.quadraticResistanceByEdge.length !== topology.edges.length
    || evaluated.dissipatedPowerByEdge.length !== topology.edges.length
    || evaluated.effectiveTone.length !== CORONARY_TERRITORY_IDS_V2.length
    || evaluated.effectiveTone.some((layers) =>
      layers.length !== CORONARY_LAYER_IDS_V2.length)
    || evaluated.postLesionPressure.length
      !== CORONARY_TERRITORY_IDS_V2.length
    || evaluated.focalStenosisLoss.length !== CORONARY_TERRITORY_IDS_V2.length
  ) {
    throw new RangeError("coronary hydraulic destination dimensions differ");
  }
  const {
    pressureByNode,
    transmuralPressureByNode,
    flowByEdge,
    linearResistanceByEdge,
    quadraticResistanceByEdge,
    dissipatedPowerByEdge,
    effectiveTone,
    postLesionPressure,
    focalStenosisLoss,
  } = evaluated;
  pressureByNode.fill(0);
  transmuralPressureByNode.fill(0);
  flowByEdge.fill(0);
  linearResistanceByEdge.fill(0);
  quadraticResistanceByEdge.fill(0);
  dissipatedPowerByEdge.fill(0);
  effectiveTone.forEach((layers) => layers.fill(0));
  postLesionPressure.fill(boundary.absoluteAorticPressureMmHg);
  focalStenosisLoss.fill(0);
  pressureByNode[hydraulicPressureIndexV2("Ao")] =
    boundary.absoluteAorticPressureMmHg;
  pressureByNode[hydraulicPressureIndexV2("RA")] =
    boundary.absoluteRightAtrialPressureMmHg;
  for (const node of topology.nodes) {
    const nodeIndex = CANONICAL_NODE_INDEX_V2[node.nodeId];
    const transmural = evaluateCrefAnchoredCollapsiblePvV2(
      volumes[nodeIndex],
      node.pressureVolume,
    ).transmuralPressureMmHg;
    transmuralPressureByNode[nodeIndex] = transmural;
    pressureByNode[hydraulicPressureIndexV2(node.nodeId)] =
      externalPressureForNodeV2(node, boundary) + transmural;
  }

  for (const edge of topology.edges) {
    const edgeIndex = edgeIndexById[edge.edgeId];
    let linearResistance = edge.referenceResistanceMmHgSecPerMl;
    let quadraticResistance = 0;
    if (edge.kind === "micro-proximal-arteriolar") {
      const owner = edge.toneOwner!;
      const layerDisease = disease[owner.territoryId].layers[owner.layerId];
      const effective = Math.max(
        tone[owner.territoryId][owner.layerId],
        layerDisease.vasodilatoryToneMinimumResistanceScale,
      );
      effectiveTone[territoryIndexV2(owner.territoryId)][layerIndexV2(owner.layerId)] =
        effective;
      const c1Volume = volumes[
        CANONICAL_NODE_INDEX_V2[edge.downstreamNodeId as CoronaryConservedVolumeNodeIdV2]
      ];
      linearResistance *= effective
        * layerDisease.structuralR1ResistanceScale
        * collapseScaleForNodeV2(c1Volume, nodeByIdV2(
          edge.downstreamNodeId as CoronaryConservedVolumeNodeIdV2,
          topology,
        ), collapseHydraulics);
    } else if (edge.kind === "micro-intermediate-capillary") {
      const owner = edge.structuralCmdOwner!;
      const upstreamNode = nodeByIdV2(
        edge.upstreamNodeId as CoronaryConservedVolumeNodeIdV2,
        topology,
      );
      const downstreamNode = nodeByIdV2(
        edge.downstreamNodeId as CoronaryConservedVolumeNodeIdV2,
        topology,
      );
      const upstreamScale = collapseScaleForNodeV2(
        volumes[CANONICAL_NODE_INDEX_V2[upstreamNode.nodeId]],
        upstreamNode,
        collapseHydraulics,
      );
      const downstreamScale = collapseScaleForNodeV2(
        volumes[CANONICAL_NODE_INDEX_V2[downstreamNode.nodeId]],
        downstreamNode,
        collapseHydraulics,
      );
      linearResistance *= disease[owner.territoryId].layers[owner.layerId]
        .structuralRmResistanceScale * Math.sqrt(upstreamScale * downstreamScale);
    } else if (edge.kind === "micro-distal-venular") {
      const upstreamNode = nodeByIdV2(
        edge.upstreamNodeId as CoronaryConservedVolumeNodeIdV2,
        topology,
      );
      linearResistance *= collapseScaleForNodeV2(
        volumes[CANONICAL_NODE_INDEX_V2[upstreamNode.nodeId]],
        upstreamNode,
        collapseHydraulics,
      );
    } else if (edge.kind === "large-arterial") {
      const territoryId = edge.territoryId!;
      linearResistance += disease[territoryId]
        .focalStenosisAdditionalLinearResistanceMmHgSecPerMl;
      quadraticResistance = disease[territoryId]
        .focalStenosisAdditionalQuadraticResistanceMmHgSec2PerMl2;
    }
    const pressureDrop =
      pressureByNode[hydraulicPressureIndexV2(edge.upstreamNodeId)]
      - pressureByNode[hydraulicPressureIndexV2(edge.downstreamNodeId)];
    const flow = solveSignedLinearQuadraticFlowV2(
      pressureDrop,
      linearResistance,
      quadraticResistance,
    );
    const totalLoss = evaluateSignedLinearQuadraticLossV1(
      flow,
      linearResistance,
      quadraticResistance,
    );
    flowByEdge[edgeIndex] = flow;
    linearResistanceByEdge[edgeIndex] = linearResistance;
    quadraticResistanceByEdge[edgeIndex] = quadraticResistance;
    dissipatedPowerByEdge[edgeIndex] = totalLoss.dissipatedPowerMmHgMlPerSec;
    if (edge.kind === "large-arterial") {
      const territoryId = edge.territoryId!;
      const territoryIndex = territoryIndexV2(territoryId);
      const focalLoss = evaluateSignedLinearQuadraticLossV1(
        flow,
        disease[territoryId]
          .focalStenosisAdditionalLinearResistanceMmHgSecPerMl,
        disease[territoryId]
          .focalStenosisAdditionalQuadraticResistanceMmHgSec2PerMl2,
      ).pressureLossMmHg;
      focalStenosisLoss[territoryIndex] = focalLoss;
      postLesionPressure[territoryIndex] =
        boundary.absoluteAorticPressureMmHg - focalLoss;
    }
  }
  return evaluated;
}

function freezeHydraulicEvaluationV2(
  evaluated: MutableHydraulicEvaluationV2,
): CoronaryHydraulicEvaluationV2 {
  const pressure = Object.fromEntries(HYDRAULIC_NODE_IDS_V2.map((nodeId) => [
    nodeId,
    evaluated.pressureByNode[hydraulicPressureIndexV2(nodeId)],
  ])) as Record<CoronaryHydraulicNodeIdV2, number>;
  const transmural = Object.fromEntries(
    CORONARY_CONSERVED_VOLUME_NODE_IDS_V2.map((nodeId, index) => [
      nodeId,
      evaluated.transmuralPressureByNode[index],
    ]),
  ) as Record<CoronaryConservedVolumeNodeIdV2, number>;
  const flows = edgeArrayToRecordV2(evaluated.flowByEdge, evaluated.edgeIndexById);
  const linear = edgeArrayToRecordV2(
    evaluated.linearResistanceByEdge,
    evaluated.edgeIndexById,
  );
  const quadratic = edgeArrayToRecordV2(
    evaluated.quadraticResistanceByEdge,
    evaluated.edgeIndexById,
  );
  const power = edgeArrayToRecordV2(
    evaluated.dissipatedPowerByEdge,
    evaluated.edgeIndexById,
  );
  const inlet = territoryRecordV2((territoryId) =>
    flows[`Ao_${territoryId}.Art` as CoronaryEdgeIdV2]);
  const r1 = territoryLayerRecordV2((territoryId, layerId) =>
    flows[`${territoryId}.Art_${territoryId}.IM.Art.${layerId}` as CoronaryEdgeIdV2]);
  const largeArterialOutflow = territoryRecordV2((territoryId) =>
    sumV2(Object.values(r1[territoryId])));
  const largeArterialStorageRate = territoryRecordV2((territoryId) =>
    inlet[territoryId] - largeArterialOutflow[territoryId]);
  const rm = territoryLayerRecordV2((territoryId, layerId) =>
    flows[`${territoryId}.IM.Art.${layerId}_${territoryId}.IM.Ven.${layerId}` as CoronaryEdgeIdV2]);
  const r2 = territoryLayerRecordV2((territoryId, layerId) =>
    flows[`${territoryId}.IM.Ven.${layerId}_CV` as CoronaryEdgeIdV2]);
  const effectiveTone = territoryLayerRecordV2((territoryId, layerId) =>
    evaluated.effectiveTone[territoryIndexV2(territoryId)][layerIndexV2(layerId)]);
  const postLesion = territoryRecordV2((territoryId) =>
    evaluated.postLesionPressure[territoryIndexV2(territoryId)]);
  const stenosisLoss = territoryRecordV2((territoryId) =>
    evaluated.focalStenosisLoss[territoryIndexV2(territoryId)]);
  return Object.freeze({
    absolutePressureMmHgByNode: Object.freeze(pressure),
    transmuralPressureMmHgByConservedNode: Object.freeze(transmural),
    signedFlowMlPerSecByEdge: flows,
    effectiveLinearResistanceMmHgSecPerMlByEdge: linear,
    quadraticResistanceMmHgSec2PerMl2ByEdge: quadratic,
    dissipatedPowerMmHgMlPerSecByEdge: power,
    effectiveToneResistanceScaleByTerritoryLayer: effectiveTone,
    inletFlowMlPerSecByTerritory: inlet,
    largeArterialOutflowMlPerSecByTerritory: largeArterialOutflow,
    largeArterialStorageRateMlPerSecByTerritory: largeArterialStorageRate,
    layerR1FlowMlPerSecByTerritory: r1,
    layerQmInternalFlowMlPerSecByTerritory: rm,
    layerTissueFlowMlPerSecByTerritory: rm,
    layerR2FlowMlPerSecByTerritory: r2,
    postFocalLesionAbsolutePressureMmHgByTerritory: postLesion,
    focalStenosisPressureLossMmHgByTerritory: stenosisLoss,
    totalInletFlowMlPerSec: sumV2(Object.values(inlet)),
    commonCoronaryVenousOutletFlowMlPerSec: flows.CV_RA,
    totalDissipatedPowerMmHgMlPerSec: sumV2(Object.values(power)),
  });
}

function referencePressureLadderV2(
  boundary: CoronaryHydraulicBoundaryInputV2,
  prior: CoronaryTopologyPriorV2,
): number[] {
  const pressureDrop = boundary.absoluteAorticPressureMmHg
    - boundary.absoluteRightAtrialPressureMmHg;
  if (pressureDrop <= 0) {
    throw new RangeError("pressure-ladder initialization requires Ao pressure above RA");
  }
  const macro = prior.construction.baselineResistancePartition
    .macroPathPressureDropFraction01;
  const byNode = {} as Record<CoronaryConservedVolumeNodeIdV2, number>;
  byNode.CV = boundary.absoluteRightAtrialPressureMmHg
    + macro.largeVenous * pressureDrop;
  for (const territoryId of CORONARY_TERRITORY_IDS_V2) {
    byNode[`${territoryId}.Art`] = boundary.absoluteAorticPressureMmHg
      - macro.largeArterial * pressureDrop;
    for (const layerId of CORONARY_LAYER_IDS_V2) {
      const layer = prior.territories[territoryId].layers[layerId];
      const microvascularResistance =
        layer.proximalArteriolarResistanceMmHgSecPerMl
        + layer.intermediateCapillaryResistanceMmHgSecPerMl
        + layer.distalVenularResistanceMmHgSecPerMl;
      const r1Fraction =
        layer.proximalArteriolarResistanceMmHgSecPerMl
        / microvascularResistance;
      const rmFraction =
        layer.intermediateCapillaryResistanceMmHgSecPerMl
        / microvascularResistance;
      byNode[`${territoryId}.IM.Art.${layerId}`] = byNode[`${territoryId}.Art`]
        - macro.microvascular * r1Fraction * pressureDrop;
      byNode[`${territoryId}.IM.Ven.${layerId}`] =
        byNode[`${territoryId}.IM.Art.${layerId}`]
        - macro.microvascular * rmFraction * pressureDrop;
    }
  }
  return CORONARY_CONSERVED_VOLUME_NODE_IDS_V2.map((nodeId) => byNode[nodeId]);
}

function pressuresToVolumeArrayV2(
  absolutePressureByConservedNode: readonly number[],
  boundary: CoronaryHydraulicBoundaryInputV2,
  topology: CoronaryTopologyV2,
): number[] {
  if (absolutePressureByConservedNode.length !== topology.nodes.length) {
    throw new RangeError("coronary V2 pressure ladder must own sixteen pressures");
  }
  return topology.nodes.map((node) => invertCrefAnchoredCollapsiblePvV2(
    absolutePressureByConservedNode[CANONICAL_NODE_INDEX_V2[node.nodeId]]
      - externalPressureForNodeV2(node, boundary),
    node.pressureVolume,
  ));
}

function externalPressureForNodeV2(
  node: CoronaryConservedVolumeNodeSpecV2,
  boundary: CoronaryHydraulicBoundaryInputV2,
): number {
  if (node.territoryId !== null && node.layerId !== null) {
    return boundary.intramyocardialPressureMmHgByTerritoryLayer[
      node.territoryId
    ][node.layerId];
  }
  return boundary.perivascularExternalPressureMmHg;
}

function collapseScaleForNodeV2(
  volumeMl: number,
  node: CoronaryConservedVolumeNodeSpecV2,
  prior: CoronaryCollapseHydraulicsPriorV2,
): number {
  return evaluateCollapseScaleAndDerivativeForNodeV2(
    volumeMl,
    node,
    prior,
  ).resistanceScale;
}

function evaluateCollapseScaleAndDerivativeForNodeV2(
  volumeMl: number,
  node: CoronaryConservedVolumeNodeSpecV2,
  prior: CoronaryCollapseHydraulicsPriorV2,
): Readonly<{
  resistanceScale: number;
  dResistanceScaleDVolumePerMl: number;
}> {
  if (prior.mode === "disabled-mechanism-ablation") {
    return {
      resistanceScale: 1,
      dResistanceScaleDVolumePerMl: 0,
    };
  }
  const evaluated = evaluateVolumeDependentCoronaryResistanceV1(volumeMl, {
    referenceResistanceMmHgSecPerMl: 1,
    referenceVolumeMl: prior.hydraulicAreaReferenceVolumeMlByNode[node.nodeId],
    residualHydraulicAreaFraction: prior.residualHydraulicAreaFraction,
  });
  return {
    resistanceScale: evaluated.resistanceScale,
    dResistanceScaleDVolumePerMl:
      evaluated.dResistanceDVolumeMmHgSecPerMl2,
  };
}

function nodeByIdV2(
  nodeId: CoronaryConservedVolumeNodeIdV2,
  topology: CoronaryTopologyV2,
): CoronaryConservedVolumeNodeSpecV2 {
  const node = topology.nodes[CANONICAL_NODE_INDEX_V2[nodeId]];
  if (node?.nodeId !== nodeId) {
    throw new RangeError(`coronary V2 node index mismatch for ${nodeId}`);
  }
  return node;
}

function flowContinuityRateV2(
  flowByEdge: readonly number[],
  topology: CoronaryTopologyV2,
): number[] {
  const residual = Array<number>(topology.nodes.length).fill(0);
  accumulateFlowContinuityV2(residual, flowByEdge, 1, topology);
  return residual;
}

function accumulateFlowContinuityV2(
  residual: number[],
  flowByEdge: readonly number[],
  scale: number,
  topology: CoronaryTopologyV2,
): void {
  topology.edges.forEach((edge, edgeIndex) => {
    const flow = flowByEdge[edgeIndex];
    if (isConservedNodeV2(edge.upstreamNodeId)) {
      residual[CANONICAL_NODE_INDEX_V2[edge.upstreamNodeId]] += scale * flow;
    }
    if (isConservedNodeV2(edge.downstreamNodeId)) {
      residual[CANONICAL_NODE_INDEX_V2[edge.downstreamNodeId]] -= scale * flow;
    }
  });
}

/**
 * Edge-local assembly of the exact same-candidate BE volume Jacobian.
 *
 * The returned storage is dense because the existing 16x16 pivoted solver
 * consumes rows, but assembly touches only the identity and edge-incidence
 * pattern. Collapse resistance tangents can add only an edge endpoint column.
 */
function analyticSparseCoronaryVolumeJacobianV2(
  candidate: readonly number[],
  hydraulics: MutableHydraulicEvaluationV2,
  dtSec: number,
  topology: CoronaryTopologyV2,
  collapseHydraulics: CoronaryCollapseHydraulicsPriorV2,
  scratchStorage?: CoronaryBackwardEulerScratchStorageV2,
): number[][] {
  const n = candidate.length;
  const jacobian = scratchStorage?.jacobian ?? createSquareMatrixV2(n);
  if (jacobian.length !== n || jacobian.some((row) => row.length !== n)) {
    throw new RangeError("coronary analytic Jacobian destination differs");
  }
  jacobian.forEach((row) => row.fill(0));
  const dPressureDVolumeMmHgPerMl =
    scratchStorage?.pressureDerivativeByVolume
    ?? Array<number>(n).fill(0);
  topology.nodes.forEach((node, nodeIndex) => {
    const compliance = evaluateCrefAnchoredCollapsiblePvV2(
      candidate[nodeIndex],
      node.pressureVolume,
    ).complianceMlPerMmHg;
    if (!Number.isFinite(compliance) || compliance <= 0) {
      throw new Error(
        `${node.nodeId} coronary pressure-volume compliance is not positive and finite`,
      );
    }
    dPressureDVolumeMmHgPerMl[nodeIndex] = 1 / compliance;
  });
  for (let diagonal = 0; diagonal < n; diagonal += 1) {
    jacobian[diagonal][diagonal] = 1;
  }

  const flowNumeratorDerivativeColumn = Array<number>(n).fill(0);
  const flowNumeratorDerivative = Array<number>(n).fill(0);
  topology.edges.forEach((edge, edgeIndex) => {
    const flow = hydraulics.flowByEdge[edgeIndex];
    const linearResistance = hydraulics.linearResistanceByEdge[edgeIndex];
    const quadraticResistance = hydraulics.quadraticResistanceByEdge[edgeIndex];
    const dPressureLossDFlowMmHgSecPerMl =
      coronaryPressureFlowTangentV2(
        flow,
        linearResistance,
        quadraticResistance,
        edge.edgeId,
      );

    let flowNumeratorDerivativeCount = 0;
    const accumulateFlowNumeratorDerivative = (
      column: number,
      derivative: number,
    ): void => {
      let existingIndex = -1;
      for (let index = 0; index < flowNumeratorDerivativeCount; index += 1) {
        if (flowNumeratorDerivativeColumn[index] === column) {
          existingIndex = index;
          break;
        }
      }
      if (existingIndex === -1) {
        flowNumeratorDerivativeColumn[flowNumeratorDerivativeCount] = column;
        flowNumeratorDerivative[flowNumeratorDerivativeCount] = derivative;
        flowNumeratorDerivativeCount += 1;
      } else {
        flowNumeratorDerivative[existingIndex] += derivative;
      }
    };
    if (isConservedNodeV2(edge.upstreamNodeId)) {
      const column = CANONICAL_NODE_INDEX_V2[edge.upstreamNodeId];
      accumulateFlowNumeratorDerivative(
        column,
        dPressureDVolumeMmHgPerMl[column],
      );
    }
    if (isConservedNodeV2(edge.downstreamNodeId)) {
      const column = CANONICAL_NODE_INDEX_V2[edge.downstreamNodeId];
      accumulateFlowNumeratorDerivative(
        column,
        -dPressureDVolumeMmHgPerMl[column],
      );
    }

    const accumulateCollapseResistanceDerivative = (
      nodeId: CoronaryConservedVolumeNodeIdV2,
      logarithmicResistanceFactor: number,
    ): void => {
      const column = CANONICAL_NODE_INDEX_V2[nodeId];
      const collapse = evaluateCollapseScaleAndDerivativeForNodeV2(
        candidate[column],
        nodeByIdV2(nodeId, topology),
        collapseHydraulics,
      );
      const dLinearResistanceDVolume =
        logarithmicResistanceFactor * linearResistance
        * collapse.dResistanceScaleDVolumePerMl
        / collapse.resistanceScale;
      accumulateFlowNumeratorDerivative(
        column,
        -flow * dLinearResistanceDVolume,
      );
    };
    if (edge.kind === "micro-proximal-arteriolar") {
      accumulateCollapseResistanceDerivative(
        edge.downstreamNodeId as CoronaryConservedVolumeNodeIdV2,
        1,
      );
    } else if (edge.kind === "micro-intermediate-capillary") {
      accumulateCollapseResistanceDerivative(
        edge.upstreamNodeId as CoronaryConservedVolumeNodeIdV2,
        0.5,
      );
      accumulateCollapseResistanceDerivative(
        edge.downstreamNodeId as CoronaryConservedVolumeNodeIdV2,
        0.5,
      );
    } else if (edge.kind === "micro-distal-venular") {
      accumulateCollapseResistanceDerivative(
        edge.upstreamNodeId as CoronaryConservedVolumeNodeIdV2,
        1,
      );
    }

    const upstreamRow = isConservedNodeV2(edge.upstreamNodeId)
      ? CANONICAL_NODE_INDEX_V2[edge.upstreamNodeId]
      : null;
    const downstreamRow = isConservedNodeV2(edge.downstreamNodeId)
      ? CANONICAL_NODE_INDEX_V2[edge.downstreamNodeId]
      : null;
    for (let derivativeIndex = 0;
      derivativeIndex < flowNumeratorDerivativeCount;
      derivativeIndex += 1) {
      const column = flowNumeratorDerivativeColumn[derivativeIndex];
      const dFlowDVolume =
        flowNumeratorDerivative[derivativeIndex]
        / dPressureLossDFlowMmHgSecPerMl;
      if (upstreamRow !== null) {
        jacobian[upstreamRow][column] += dtSec * dFlowDVolume;
      }
      if (downstreamRow !== null) {
        jacobian[downstreamRow][column] -= dtSec * dFlowDVolume;
      }
    }
  });
  jacobian.forEach((row, index) => {
    requireFiniteVectorV2(row, `coronary analytic residual Jacobian row ${index}`);
  });
  return jacobian;
}

/**
 * Exact local directional derivatives of the three conservative companion
 * observables. Only the Ao-to-Art and CV-to-RA edge laws are needed here;
 * their candidate-volume response is already present in dVolume.
 */
function analyticCoronaryObservableDirectionalDerivativesV2(
  candidate: readonly number[],
  dVolume: readonly number[],
  hydraulics: MutableHydraulicEvaluationV2,
  direction: CoronaryImplicitBoundaryDirectionV2,
  topology: CoronaryTopologyV2,
  edgeIndex: Readonly<Record<CoronaryEdgeIdV2, number>>,
): Readonly<{
  totalVolumeDerivative: number;
  totalInletDerivative: number;
  commonVenousOutletDerivative: number;
}> {
  const boundaryDerivative =
    centralCoronaryBoundaryDirectionalDerivativeV2(direction);
  const conservedNodeAbsolutePressureDerivative = (
    nodeId: CoronaryConservedVolumeNodeIdV2,
  ): number => {
    const nodeIndex = CANONICAL_NODE_INDEX_V2[nodeId];
    const compliance = evaluateCrefAnchoredCollapsiblePvV2(
      candidate[nodeIndex],
      nodeByIdV2(nodeId, topology).pressureVolume,
    ).complianceMlPerMmHg;
    if (!Number.isFinite(compliance) || compliance <= 0) {
      throw new Error(
        `${nodeId} coronary pressure-volume compliance is not positive and finite`,
      );
    }
    return boundaryDerivative.perivascularExternalPressureMmHg
      + dVolume[nodeIndex] / compliance;
  };
  const flowDerivative = (
    edgeId: CoronaryEdgeIdV2,
    pressureDropDerivative: number,
  ): number => {
    const index = edgeIndex[edgeId];
    return pressureDropDerivative / coronaryPressureFlowTangentV2(
      hydraulics.flowByEdge[index],
      hydraulics.linearResistanceByEdge[index],
      hydraulics.quadraticResistanceByEdge[index],
      edgeId,
    );
  };
  const totalInletDerivative = CORONARY_TERRITORY_IDS_V2.reduce(
    (total, territoryId) => total + flowDerivative(
      `Ao_${territoryId}.Art`,
      boundaryDerivative.absoluteAorticPressureMmHg
        - conservedNodeAbsolutePressureDerivative(`${territoryId}.Art`),
    ),
    0,
  );
  const commonVenousOutletDerivative = flowDerivative(
    "CV_RA",
    conservedNodeAbsolutePressureDerivative("CV")
      - boundaryDerivative.absoluteRightAtrialPressureMmHg,
  );
  const totalVolumeDerivative = sumV2(dVolume);
  requireFiniteVectorV2(
    [
      totalVolumeDerivative,
      totalInletDerivative,
      commonVenousOutletDerivative,
    ],
    "coronary analytic observable directional derivative",
  );
  return {
    totalVolumeDerivative,
    totalInletDerivative,
    commonVenousOutletDerivative,
  };
}

function analyticCoronaryBoundaryResidualDirectionalDerivativeV2(
  hydraulics: MutableHydraulicEvaluationV2,
  direction: CoronaryImplicitBoundaryDirectionV2,
  dtSec: number,
  topology: CoronaryTopologyV2,
): number[] {
  const boundaryDerivative =
    centralCoronaryBoundaryDirectionalDerivativeV2(direction);
  const absolutePressureDerivative = (
    nodeId: CoronaryHydraulicNodeIdV2,
  ): number => {
    if (nodeId === "Ao") {
      return boundaryDerivative.absoluteAorticPressureMmHg;
    }
    if (nodeId === "RA") {
      return boundaryDerivative.absoluteRightAtrialPressureMmHg;
    }
    return externalPressureForNodeV2(
      nodeByIdV2(nodeId, topology),
      boundaryDerivative,
    );
  };
  const flowDerivative = topology.edges.map((edge, edgeIndex) => {
    const pressureDropDerivative =
      absolutePressureDerivative(edge.upstreamNodeId)
      - absolutePressureDerivative(edge.downstreamNodeId);
    return pressureDropDerivative / coronaryPressureFlowTangentV2(
      hydraulics.flowByEdge[edgeIndex],
      hydraulics.linearResistanceByEdge[edgeIndex],
      hydraulics.quadraticResistanceByEdge[edgeIndex],
      edge.edgeId,
    );
  });
  const residualDerivative = Array<number>(topology.nodes.length).fill(0);
  accumulateFlowContinuityV2(
    residualDerivative,
    flowDerivative,
    dtSec,
    topology,
  );
  requireFiniteVectorV2(
    residualDerivative,
    "coronary analytic boundary residual directional derivative",
  );
  return residualDerivative;
}

function centralCoronaryBoundaryDirectionalDerivativeV2(
  direction: CoronaryImplicitBoundaryDirectionV2,
): CoronaryHydraulicBoundaryInputV2 {
  const denominator = 2 * direction.scaledStep;
  const derivative = (
    plus: number,
    minus: number,
  ): number => (plus - minus) / denominator;
  return {
    absoluteAorticPressureMmHg: derivative(
      direction.plusBoundary.absoluteAorticPressureMmHg,
      direction.minusBoundary.absoluteAorticPressureMmHg,
    ),
    absoluteRightAtrialPressureMmHg: derivative(
      direction.plusBoundary.absoluteRightAtrialPressureMmHg,
      direction.minusBoundary.absoluteRightAtrialPressureMmHg,
    ),
    perivascularExternalPressureMmHg: derivative(
      direction.plusBoundary.perivascularExternalPressureMmHg,
      direction.minusBoundary.perivascularExternalPressureMmHg,
    ),
    intramyocardialPressureMmHgByTerritoryLayer: territoryLayerRecordV2(
      (territoryId, layerId) => derivative(
        direction.plusBoundary
          .intramyocardialPressureMmHgByTerritoryLayer[territoryId][layerId],
        direction.minusBoundary
          .intramyocardialPressureMmHgByTerritoryLayer[territoryId][layerId],
      ),
    ),
  };
}

function coronaryPressureFlowTangentV2(
  flowMlPerSec: number,
  linearResistanceMmHgSecPerMl: number,
  quadraticResistanceMmHgSec2PerMl2: number,
  edgeId: CoronaryEdgeIdV2,
): number {
  // solveSignedLinearQuadraticFlowV2 intentionally treats coefficients at or
  // below this threshold as the linear algorithmic branch. Match that branch
  // exactly; above it, use the exported Young-Tsai signed-loss tangent.
  const tangent = quadraticResistanceMmHgSec2PerMl2 <= 1e-14
    ? linearResistanceMmHgSecPerMl
    : evaluateSignedLinearQuadraticLossV1(
      flowMlPerSec,
      linearResistanceMmHgSecPerMl,
      quadraticResistanceMmHgSec2PerMl2,
    ).dPressureLossDFlowMmHgSecPerMl;
  if (!Number.isFinite(tangent) || tangent <= 0) {
    throw new Error(
      `${edgeId} coronary pressure-flow tangent is not positive and finite`,
    );
  }
  return tangent;
}

function numericalJacobianUnboundedV2(
  candidate: readonly number[],
  _baseResidual: readonly number[],
  evaluate: (candidate: number[]) => ResidualEvaluationV2,
  relativeStep: number,
): number[][] {
  const n = candidate.length;
  const jacobian = Array.from({ length: n }, () => Array<number>(n).fill(0));
  for (let column = 0; column < n; column += 1) {
    const step = Math.max(1e-7, relativeStep * Math.max(1, Math.abs(candidate[column])));
    const plus = candidate.slice();
    const minus = candidate.slice();
    plus[column] += step;
    minus[column] -= step;
    const plusResidual = evaluate(plus).residual;
    const minusResidual = evaluate(minus).residual;
    for (let row = 0; row < n; row += 1) {
      jacobian[row][column] =
        (plusResidual[row] - minusResidual[row]) / (2 * step);
    }
  }
  return jacobian;
}

function lineSearchV2(
  candidate: readonly number[],
  step: readonly number[],
  residualNorm: number,
  evaluate: (candidate: number[]) => ResidualEvaluationV2,
  maximumBacktracks: number,
  maximumAlpha: number,
): Readonly<{
  candidate: number[];
  evaluated: ResidualEvaluationV2;
  norm: number;
  backtracks: number;
}> {
  let alpha = maximumAlpha;
  let best: {
    candidate: number[];
    evaluated: ResidualEvaluationV2;
    norm: number;
    backtracks: number;
  } | null = null;
  for (let backtrack = 0; backtrack <= maximumBacktracks; backtrack += 1) {
    const next = candidate.map((value, index) => value + alpha * step[index]);
    const evaluated = evaluate(next);
    const norm = infinityNormV2(evaluated.residual);
    if (best === null || norm < best.norm) {
      best = { candidate: next, evaluated, norm, backtracks: backtrack };
    }
    if (norm <= residualNorm * (1 - 1e-4 * alpha)) return best;
    alpha *= 0.5;
  }
  if (best !== null && best.norm < residualNorm) return best;
  throw new CoronaryNetworkConvergenceErrorV2(
    "coronary V2 Newton line search did not reduce residual",
    residualNorm,
    0,
  );
}

function solveDenseLinearSystemV2(
  matrix: readonly (readonly number[])[],
  rhs: readonly number[],
  scratchStorage?: CoronaryBackwardEulerScratchStorageV2,
): number[] {
  return solveFactoredDenseLinearSystemV2(
    factorDenseLinearSystemV2(
      matrix,
      scratchStorage?.linearFactorization,
    ),
    rhs,
    scratchStorage?.transformedLinearRhs,
    scratchStorage?.linearSolution,
  );
}

type DenseLinearFactorizationV2 = Readonly<{
  upper: readonly (readonly number[])[];
  stages: readonly Readonly<{
    pivotRow: number;
    factorByRow: readonly number[];
  }>[];
}>;

/**
 * Factors one Jacobian once so all implicit boundary directions can reuse it.
 * The recorded row swaps and elimination factors are replayed against each
 * right-hand side in the exact order used by the former augmented solve.
 */
function factorDenseLinearSystemV2(
  matrix: readonly (readonly number[])[],
  destination?: MutableDenseLinearFactorizationV2,
): DenseLinearFactorizationV2 {
  const n = matrix.length;
  const factorization = destination
    ?? createMutableDenseLinearFactorizationV2(n);
  const { upper, stages } = factorization;
  if (
    upper.length !== n
    || upper.some((row) => row.length !== n)
    || stages.length !== n
    || stages.some((stage) => stage.factorByRow.length !== n)
  ) {
    throw new RangeError("coronary V2 factorization destination differs");
  }
  for (let row = 0; row < n; row += 1) {
    if (matrix[row]!.length !== n) {
      throw new RangeError("coronary V2 linear system matrix must be square");
    }
    for (let column = 0; column < n; column += 1) {
      upper[row]![column] = matrix[row]![column]!;
    }
  }
  for (let column = 0; column < n; column += 1) {
    let pivotRow = column;
    for (let row = column + 1; row < n; row += 1) {
      if (Math.abs(upper[row]![column]!) > Math.abs(upper[pivotRow]![column]!)) {
        pivotRow = row;
      }
    }
    if (Math.abs(upper[pivotRow]![column]!) < 1e-14) {
      throw new CoronaryNetworkConvergenceErrorV2(
        "singular coronary V2 Newton Jacobian",
        Number.POSITIVE_INFINITY,
        0,
      );
    }
    [upper[column], upper[pivotRow]] = [upper[pivotRow]!, upper[column]!];
    const stage = stages[column]!;
    stage.pivotRow = pivotRow;
    const factorByRow = stage.factorByRow;
    factorByRow.fill(0);
    for (let row = column + 1; row < n; row += 1) {
      const factor = upper[row]![column]! / upper[column]![column]!;
      factorByRow[row] = factor;
      upper[row]![column] = 0;
      for (let j = column + 1; j < n; j += 1) {
        upper[row]![j] -= factor * upper[column]![j]!;
      }
    }
  }
  return factorization;
}

function solveFactoredDenseLinearSystemV2(
  factorization: DenseLinearFactorizationV2,
  rhs: readonly number[],
  transformedRhsDestination?: number[],
  solutionDestination?: number[],
): number[] {
  const n = rhs.length;
  if (
    factorization.upper.length !== n
    || factorization.stages.length !== n
  ) {
    throw new RangeError(
      "coronary V2 factorization and right-hand side dimensions differ",
    );
  }
  const transformedRhs = transformedRhsDestination ?? Array<number>(n).fill(0);
  const solution = solutionDestination ?? Array<number>(n).fill(0);
  if (transformedRhs.length !== n || solution.length !== n) {
    throw new RangeError(
      "coronary V2 linear solution destination dimensions differ",
    );
  }
  for (let index = 0; index < n; index += 1) {
    transformedRhs[index] = rhs[index]!;
  }
  for (let column = 0; column < n; column += 1) {
    const stage = factorization.stages[column]!;
    [transformedRhs[column], transformedRhs[stage.pivotRow]] =
      [transformedRhs[stage.pivotRow]!, transformedRhs[column]!];
    for (let row = column + 1; row < n; row += 1) {
      transformedRhs[row] -= stage.factorByRow[row]! * transformedRhs[column]!;
    }
  }
  solution.fill(0);
  for (let row = n - 1; row >= 0; row -= 1) {
    let value = transformedRhs[row]!;
    for (let column = row + 1; column < n; column += 1) {
      value -= factorization.upper[row]![column]! * solution[column]!;
    }
    solution[row] = value / factorization.upper[row]![row]!;
  }
  return solution;
}

function solveSignedLinearQuadraticFlowV2(
  pressureDrop: number,
  linearResistance: number,
  quadraticResistance: number,
): number {
  if (quadraticResistance <= 1e-14) return pressureDrop / linearResistance;
  const magnitudePressure = Math.abs(pressureDrop);
  const root = Math.sqrt(
    linearResistance ** 2 + 4 * quadraticResistance * magnitudePressure,
  );
  return Math.sign(pressureDrop) * 2 * magnitudePressure
    / (linearResistance + root);
}

function maximumPositiveStepV2(
  candidate: readonly number[],
  step: readonly number[],
  minimum: readonly number[],
): number {
  let alpha = 1;
  candidate.forEach((value, index) => {
    if (step[index] < 0) {
      alpha = Math.min(alpha, 0.99 * (value - minimum[index]) / -step[index]);
    }
  });
  return Math.max(alpha, Number.EPSILON);
}

function totalInletFlowV2(
  flows: readonly number[],
  edgeIndex: Readonly<Record<CoronaryEdgeIdV2, number>>,
): number {
  return CORONARY_TERRITORY_IDS_V2.reduce(
    (total, territoryId) => total
      + flows[edgeIndex[`Ao_${territoryId}.Art`]],
    0,
  );
}

function edgeArrayToRecordV2(
  values: readonly number[],
  edgeIndex: Readonly<Record<CoronaryEdgeIdV2, number>>,
): Readonly<Record<CoronaryEdgeIdV2, number>> {
  return Object.freeze(Object.fromEntries(CORONARY_EDGE_IDS_V2.map((edgeId) => [
    edgeId,
    values[edgeIndex[edgeId]],
  ]))) as Readonly<Record<CoronaryEdgeIdV2, number>>;
}

function territoryRecordV2(
  value: (territoryId: (typeof CORONARY_TERRITORY_IDS_V2)[number]) => number,
): CoronaryTerritoryRecordV2<number> {
  return Object.freeze(Object.fromEntries(CORONARY_TERRITORY_IDS_V2.map(
    (territoryId) => [territoryId, value(territoryId)],
  ))) as CoronaryTerritoryRecordV2<number>;
}

function territoryLayerRecordV2(
  value: (
    territoryId: (typeof CORONARY_TERRITORY_IDS_V2)[number],
    layerId: (typeof CORONARY_LAYER_IDS_V2)[number],
  ) => number,
): CoronaryTerritoryLayerRecordV2<number> {
  return Object.freeze(Object.fromEntries(CORONARY_TERRITORY_IDS_V2.map(
    (territoryId) => [territoryId, Object.freeze(Object.fromEntries(
      CORONARY_LAYER_IDS_V2.map((layerId) => [
        layerId,
        value(territoryId, layerId),
      ]),
    ))],
  ))) as CoronaryTerritoryLayerRecordV2<number>;
}

function freezeAcceptedStateV2(
  state: CoronaryAcceptedHydraulicStateV2,
  topology: CoronaryTopologyV2,
): CoronaryAcceptedHydraulicStateV2 {
  const frozen = Object.freeze({
    acceptedTimeSec: state.acceptedTimeSec,
    revision: state.revision,
    volumeMlByNode: Object.freeze({ ...state.volumeMlByNode }),
    toneResistanceScaleByTerritoryLayer: territoryLayerRecordV2(
      (territoryId, layerId) =>
        state.toneResistanceScaleByTerritoryLayer[territoryId][layerId],
    ),
  });
  validateAcceptedStateV2(frozen, topology);
  return frozen;
}

function cloneAcceptedStateV2(
  state: CoronaryAcceptedHydraulicStateV2,
  topology: CoronaryTopologyV2,
): CoronaryAcceptedHydraulicStateV2 {
  return freezeAcceptedStateV2(state, topology);
}

function validateAcceptedStateV2(
  state: CoronaryAcceptedHydraulicStateV2,
  topology: CoronaryTopologyV2,
): void {
  if (!Number.isFinite(state.acceptedTimeSec) || state.acceptedTimeSec < 0) {
    throw new RangeError("accepted coronary V2 time must be non-negative and finite");
  }
  if (!Number.isInteger(state.revision) || state.revision < 0) {
    throw new RangeError("accepted coronary V2 revision must be a non-negative integer");
  }
  validateToneV2(state.toneResistanceScaleByTerritoryLayer);
  validateVolumesV2(volumeRecordToArrayV2(state.volumeMlByNode), topology, 0);
}

function validateVolumesV2(
  volumes: readonly number[],
  topology: CoronaryTopologyV2,
  minimumReferenceFraction: number,
): void {
  if (volumes.length !== CORONARY_CONSERVED_VOLUME_NODE_IDS_V2.length) {
    throw new RangeError("coronary V2 state must own exactly sixteen volumes");
  }
  volumes.forEach((volume, index) => {
    const minimum = topology.nodes[index].pressureVolume.referenceVolumeMl
      * minimumReferenceFraction;
    if (!Number.isFinite(volume) || volume <= minimum) {
      throw new RangeError(
        `${CORONARY_CONSERVED_VOLUME_NODE_IDS_V2[index]} volume is outside positive domain`,
      );
    }
  });
}

function validateTrialInputV2(input: CoronaryBackwardEulerTrialInputV2): void {
  if (!Number.isFinite(input.dtSec) || input.dtSec <= 0) {
    throw new RangeError("coronary V2 dt must be positive and finite");
  }
  validateBoundaryV2(input.boundary);
}

function validateBoundaryV2(boundary: CoronaryHydraulicBoundaryInputV2): void {
  for (const [name, value] of [
    ["absoluteAorticPressureMmHg", boundary.absoluteAorticPressureMmHg],
    ["absoluteRightAtrialPressureMmHg", boundary.absoluteRightAtrialPressureMmHg],
    ["perivascularExternalPressureMmHg", boundary.perivascularExternalPressureMmHg],
  ] as const) {
    if (!Number.isFinite(value)) throw new RangeError(`${name} must be finite`);
  }
  for (const territoryId of CORONARY_TERRITORY_IDS_V2) {
    for (const layerId of CORONARY_LAYER_IDS_V2) {
      if (!Number.isFinite(
        boundary.intramyocardialPressureMmHgByTerritoryLayer[territoryId][layerId],
      )) {
        throw new RangeError(`${territoryId}.${layerId} V2 IMP must be finite`);
      }
    }
  }
}

function hydraulicBoundaryExactlyEqualV2(
  left: CoronaryHydraulicBoundaryInputV2,
  right: CoronaryHydraulicBoundaryInputV2,
): boolean {
  return left.absoluteAorticPressureMmHg
      === right.absoluteAorticPressureMmHg
    && left.absoluteRightAtrialPressureMmHg
      === right.absoluteRightAtrialPressureMmHg
    && left.perivascularExternalPressureMmHg
      === right.perivascularExternalPressureMmHg
    && CORONARY_TERRITORY_IDS_V2.every((territoryId) =>
      CORONARY_LAYER_IDS_V2.every((layerId) =>
        left.intramyocardialPressureMmHgByTerritoryLayer[territoryId][layerId]
          === right.intramyocardialPressureMmHgByTerritoryLayer[territoryId][
            layerId
          ]
      ));
}

function validateDiseaseV2(disease: CoronaryDiseaseInputV2): void {
  for (const territoryId of CORONARY_TERRITORY_IDS_V2) {
    const territory = disease[territoryId];
    for (const [name, value] of [
      ["focalStenosisAdditionalLinearResistanceMmHgSecPerMl",
        territory.focalStenosisAdditionalLinearResistanceMmHgSecPerMl],
      ["focalStenosisAdditionalQuadraticResistanceMmHgSec2PerMl2",
        territory.focalStenosisAdditionalQuadraticResistanceMmHgSec2PerMl2],
    ] as const) {
      if (!Number.isFinite(value) || value < 0) {
        throw new RangeError(`${territoryId}.${name} must be non-negative`);
      }
    }
    for (const layerId of CORONARY_LAYER_IDS_V2) {
      const layer = territory.layers[layerId];
      for (const [name, value] of [
        ["structuralR1ResistanceScale", layer.structuralR1ResistanceScale],
        ["structuralRmResistanceScale", layer.structuralRmResistanceScale],
        ["vasodilatoryToneMinimumResistanceScale", layer.vasodilatoryToneMinimumResistanceScale],
      ] as const) {
        if (!Number.isFinite(value) || value <= 0) {
          throw new RangeError(`${territoryId}.${layerId}.${name} must be positive`);
        }
      }
      if (
        layer.vasodilatoryToneMinimumResistanceScale
          > NORMAL_CORONARY_TONE_MAXIMUM_SCALE_V2
      ) {
        throw new RangeError(
          `${territoryId}.${layerId} vasodilatory floor must not exceed maximum tone`,
        );
      }
    }
  }
}

function validateToneV2(tone: CoronaryToneStateV2): void {
  for (const territoryId of CORONARY_TERRITORY_IDS_V2) {
    for (const layerId of CORONARY_LAYER_IDS_V2) {
      const value = tone[territoryId][layerId];
      if (
        !Number.isFinite(value)
        || value < NORMAL_VASODILATORY_TONE_MINIMUM_SCALE_V2
        || value > NORMAL_CORONARY_TONE_MAXIMUM_SCALE_V2
      ) {
        throw new RangeError(
          `${territoryId}.${layerId} tone must lie in [4/45, 2]`,
        );
      }
    }
  }
}

function validateCollapseHydraulicsV2(
  prior: CoronaryCollapseHydraulicsPriorV2,
  topology: CoronaryTopologyV2,
): void {
  if (
    prior.mode !== "smooth-area-collapse-v1"
    && prior.mode !== "disabled-mechanism-ablation"
  ) {
    throw new RangeError("coronary V2 collapse-hydraulics mode is invalid");
  }
  if (
    !Number.isFinite(prior.residualHydraulicAreaFraction)
    || prior.residualHydraulicAreaFraction <= 0
    || prior.residualHydraulicAreaFraction >= 1
  ) {
    throw new RangeError("collapse residual hydraulic area must lie in (0, 1)");
  }
  if (
    prior.referenceOwner
    !== "loaded-cold-volume-ablation-prior-not-zero-ptm-pv-volume"
  ) {
    throw new RangeError("coronary V2 collapse reference owner is invalid");
  }
  for (const node of topology.nodes) {
    const reference = prior.hydraulicAreaReferenceVolumeMlByNode[node.nodeId];
    if (!Number.isFinite(reference) || reference <= 0) {
      throw new RangeError(`${node.nodeId} hydraulic-area reference must be positive`);
    }
  }
}

function resolveSolverOptionsV2(
  partial?: Partial<CoronaryBackwardEulerSolverOptionsV2>,
): CoronaryBackwardEulerSolverOptionsV2 {
  const resolved = Object.freeze({
    ...DEFAULT_CORONARY_BACKWARD_EULER_SOLVER_OPTIONS_V2,
    ...partial,
  });
  validatePositiveOptionsV2(resolved);
  if (
    !Number.isInteger(resolved.maximumNewtonIterations)
    || !Number.isInteger(resolved.maximumLineSearchBacktracks)
  ) {
    throw new RangeError("coronary V2 solver iteration limits must be integers");
  }
  if (resolved.minimumVolumeFractionOfReference >= 1) {
    throw new RangeError("minimum coronary V2 volume fraction must be below one");
  }
  return resolved;
}

function resolveInitializerOptionsV2(
  partial?: Partial<CoronaryPressureLadderInitializerOptionsV2>,
): CoronaryPressureLadderInitializerOptionsV2 {
  const resolved = Object.freeze({
    ...DEFAULT_CORONARY_PRESSURE_LADDER_INITIALIZER_OPTIONS_V2,
    ...partial,
  });
  validatePositiveOptionsV2(resolved);
  if (
    !Number.isInteger(resolved.maximumNewtonIterations)
    || !Number.isInteger(resolved.maximumLineSearchBacktracks)
  ) {
    throw new RangeError("coronary V2 initializer iteration limits must be integers");
  }
  return resolved;
}

function validatePositiveOptionsV2(options: Readonly<Record<string, number>>): void {
  for (const [name, value] of Object.entries(options)) {
    if (!Number.isFinite(value) || value <= 0) {
      throw new RangeError(`${name} must be positive and finite`);
    }
  }
}

function volumeRecordToArrayV2(
  record: CoronaryConservedVolumeStateV2,
): number[] {
  return CORONARY_CONSERVED_VOLUME_NODE_IDS_V2.map((nodeId) => record[nodeId]);
}

function arrayToVolumeRecordV2(
  volumes: readonly number[],
): CoronaryConservedVolumeStateV2 {
  return Object.freeze(Object.fromEntries(
    CORONARY_CONSERVED_VOLUME_NODE_IDS_V2.map((nodeId, index) => [
      nodeId,
      volumes[index],
    ]),
  )) as CoronaryConservedVolumeStateV2;
}

function hydraulicPressureIndexV2(nodeId: CoronaryHydraulicNodeIdV2): number {
  if (nodeId === "Ao") return 0;
  if (nodeId === "RA") return HYDRAULIC_NODE_IDS_V2.length - 1;
  return 1 + CANONICAL_NODE_INDEX_V2[nodeId];
}

function isConservedNodeV2(
  nodeId: CoronaryHydraulicNodeIdV2,
): nodeId is CoronaryConservedVolumeNodeIdV2 {
  return nodeId !== "Ao" && nodeId !== "RA";
}

function territoryIndexV2(
  territoryId: (typeof CORONARY_TERRITORY_IDS_V2)[number],
): number {
  return CORONARY_TERRITORY_IDS_V2.indexOf(territoryId);
}

function layerIndexV2(
  layerId: (typeof CORONARY_LAYER_IDS_V2)[number],
): number {
  return CORONARY_LAYER_IDS_V2.indexOf(layerId);
}

function requireFiniteVectorV2(values: readonly number[], label: string): void {
  values.forEach((value, index) => {
    if (!Number.isFinite(value)) {
      throw new RangeError(`${label}[${index}] must be finite`);
    }
  });
}

function infinityNormV2(values: readonly number[]): number {
  return values.reduce((maximum, value) => Math.max(maximum, Math.abs(value)), 0);
}

function sumV2(values: readonly number[]): number {
  return values.reduce((total, value) => total + value, 0);
}
