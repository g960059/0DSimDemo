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
  inletFlowMlPerSecByTerritory: CoronaryTerritoryRecordV2<number>;
  layerR1FlowMlPerSecByTerritory:
    CoronaryTerritoryLayerRecordV2<number>;
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
  const indexById = {} as Record<CoronaryEdgeIdV2, number>;
  topology.edges.forEach((edge, index) => {
    if (edge.edgeId in indexById) {
      throw new RangeError(`duplicate coronary V2 edge ${edge.edgeId}`);
    }
    indexById[edge.edgeId] = index;
  });
  return Object.freeze(indexById);
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
): CoronaryBackwardEulerTrialV2 {
  validateCoronaryTopologyV2(topology);
  validateAcceptedStateV2(previousAcceptedState, topology);
  validateTrialInputV2(input);
  const disease = input.disease ?? NORMAL_CORONARY_DISEASE_INPUT_V2;
  const collapseHydraulics = input.collapseHydraulics
    ?? buildCoronaryCollapseHydraulicsPriorV2(topology);
  validateDiseaseV2(disease);
  validateCollapseHydraulicsV2(collapseHydraulics, topology);
  const options = resolveSolverOptionsV2(input.solverOptions);
  const edgeIndex = buildCoronaryEdgeIndexV2(topology);
  const previous = volumeRecordToArrayV2(previousAcceptedState.volumeMlByNode);
  const minimumVolumes = topology.nodes.map(
    (node) => node.pressureVolume.referenceVolumeMl
      * options.minimumVolumeFractionOfReference,
  );
  validateVolumesV2(
    previous,
    topology,
    options.minimumVolumeFractionOfReference,
  );

  const evaluate = (candidate: number[]): ResidualEvaluationV2 => {
    const hydraulics = evaluateHydraulicsInternalV2(
      candidate,
      previousAcceptedState.toneResistanceScaleByTerritoryLayer,
      input.boundary,
      disease,
      topology,
      edgeIndex,
      collapseHydraulics,
    );
    const residual = candidate.map(
      (volume, index) => volume - previous[index],
    );
    accumulateFlowContinuityV2(
      residual,
      hydraulics.flowByEdge,
      input.dtSec,
      topology,
    );
    return { residual, hydraulics };
  };

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
    const jacobian = numericalJacobianPositiveV2(
      candidate,
      evaluated.residual,
      evaluate,
      minimumVolumes,
      options.finiteDifferenceRelativeStep,
    );
    const step = solveDenseLinearSystemV2(
      jacobian,
      evaluated.residual.map((value) => -value),
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
): MutableHydraulicEvaluationV2 {
  validateVolumesV2(volumes, topology, 0);
  const pressureByNode = Array<number>(HYDRAULIC_NODE_IDS_V2.length).fill(0);
  const transmuralPressureByNode = Array<number>(topology.nodes.length).fill(0);
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

  const flowByEdge = Array<number>(topology.edges.length).fill(0);
  const linearResistanceByEdge = Array<number>(topology.edges.length).fill(0);
  const quadraticResistanceByEdge = Array<number>(topology.edges.length).fill(0);
  const dissipatedPowerByEdge = Array<number>(topology.edges.length).fill(0);
  const effectiveTone = CORONARY_TERRITORY_IDS_V2.map(() => [0, 0]);
  const postLesionPressure = Array<number>(CORONARY_TERRITORY_IDS_V2.length).fill(
    boundary.absoluteAorticPressureMmHg,
  );
  const focalStenosisLoss = Array<number>(CORONARY_TERRITORY_IDS_V2.length).fill(0);

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
  return {
    pressureByNode,
    transmuralPressureByNode,
    flowByEdge,
    linearResistanceByEdge,
    quadraticResistanceByEdge,
    dissipatedPowerByEdge,
    edgeIndexById,
    effectiveTone,
    postLesionPressure,
    focalStenosisLoss,
  };
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
    layerR1FlowMlPerSecByTerritory: r1,
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
  return evaluateVolumeDependentCoronaryResistanceV1(volumeMl, {
    referenceResistanceMmHgSecPerMl: 1,
    referenceVolumeMl: prior.hydraulicAreaReferenceVolumeMlByNode[node.nodeId],
    residualHydraulicAreaFraction: prior.residualHydraulicAreaFraction,
  }).resistanceScale;
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

function numericalJacobianPositiveV2(
  candidate: readonly number[],
  baseResidual: readonly number[],
  evaluate: (candidate: number[]) => ResidualEvaluationV2,
  minimumVolumes: readonly number[],
  relativeStep: number,
): number[][] {
  const n = candidate.length;
  const jacobian = Array.from({ length: n }, () => Array<number>(n).fill(0));
  for (let column = 0; column < n; column += 1) {
    const step = Math.max(1e-9, relativeStep * Math.max(1, Math.abs(candidate[column])));
    const plus = candidate.slice();
    plus[column] += step;
    const plusResidual = evaluate(plus).residual;
    if (candidate[column] - step > minimumVolumes[column]) {
      const minus = candidate.slice();
      minus[column] -= step;
      const minusResidual = evaluate(minus).residual;
      for (let row = 0; row < n; row += 1) {
        jacobian[row][column] =
          (plusResidual[row] - minusResidual[row]) / (2 * step);
      }
    } else {
      for (let row = 0; row < n; row += 1) {
        jacobian[row][column] =
          (plusResidual[row] - baseResidual[row]) / step;
      }
    }
  }
  return jacobian;
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
): number[] {
  const n = rhs.length;
  const augmented = matrix.map((row, index) => [...row, rhs[index]]);
  for (let column = 0; column < n; column += 1) {
    let pivotRow = column;
    for (let row = column + 1; row < n; row += 1) {
      if (Math.abs(augmented[row][column]) > Math.abs(augmented[pivotRow][column])) {
        pivotRow = row;
      }
    }
    if (Math.abs(augmented[pivotRow][column]) < 1e-14) {
      throw new CoronaryNetworkConvergenceErrorV2(
        "singular coronary V2 Newton Jacobian",
        Number.POSITIVE_INFINITY,
        0,
      );
    }
    [augmented[column], augmented[pivotRow]] =
      [augmented[pivotRow], augmented[column]];
    for (let row = column + 1; row < n; row += 1) {
      const factor = augmented[row][column] / augmented[column][column];
      augmented[row][column] = 0;
      for (let j = column + 1; j <= n; j += 1) {
        augmented[row][j] -= factor * augmented[column][j];
      }
    }
  }
  const solution = Array<number>(n).fill(0);
  for (let row = n - 1; row >= 0; row -= 1) {
    let value = augmented[row][n];
    for (let column = row + 1; column < n; column += 1) {
      value -= augmented[row][column] * solution[column];
    }
    solution[row] = value / augmented[row][row];
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

function infinityNormV2(values: readonly number[]): number {
  return values.reduce((maximum, value) => Math.max(maximum, Math.abs(value)), 0);
}

function sumV2(values: readonly number[]): number {
  return values.reduce((total, value) => total + value, 0);
}
