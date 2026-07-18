import {
  evaluateCollapsibleIntramyocardialPvV1,
  evaluateVolumeDependentCoronaryResistanceV1,
} from "@/engine/coronary/collapsibleIntramyocardialBedV1";
import {
  CORONARY_CONSERVED_VOLUME_NODE_IDS_V1,
  CORONARY_EDGE_IDS_V1,
  NORMAL_ADULT_CORONARY_TOPOLOGY_PRIOR_V1,
  buildCoronaryTopologyV1,
  type CoronaryConservedVolumeNodeIdV1,
  type CoronaryEdgeIdV1,
  type CoronaryHydraulicNodeIdV1,
  type CoronaryTopologyPriorV1,
} from "@/engine/coronary/topologyPriorV1";
import {
  CORONARY_LAYER_IDS_V1,
  CORONARY_TERRITORY_IDS_V1,
  type CoronaryTerritoryLayerRecordV1,
  type CoronaryTerritoryRecordV1,
} from "@/engine/coronary/typesV1";
import {
  evaluateSignedLinearQuadraticLossV1,
  mapYoungTsaiCoronaryStenosisV1,
} from "@/engine/coronary/youngTsaiStenosisV1";

export type CoronaryConservedVolumeStateV1 = Readonly<
  Record<CoronaryConservedVolumeNodeIdV1, number>
>;

export type CoronaryToneResistanceScaleStateV1 =
  CoronaryTerritoryRecordV1<number>;

export type CoronaryAcceptedHydraulicStateV1 = Readonly<{
  acceptedTimeSec: number;
  revision: number;
  volumeMlByNode: CoronaryConservedVolumeStateV1;
  /** Held fixed throughout every Newton trial from this accepted state. */
  toneResistanceScaleByTerritory: CoronaryToneResistanceScaleStateV1;
}>;

export type CoronaryTerritoryDiseaseInputV1 = Readonly<{
  /** Fractional diameter loss, not area loss. */
  diameterStenosisFraction01: number;
  /**
   * Structural microvascular resistance multiplier (for example rarefaction).
   * Pharmacologic hyperemia is deliberately not a hydraulic disease input: it
   * owns the slow accepted-tone target in `autoregulationV1` exactly once.
   */
  microvascularStructuralResistanceScale: number;
}>;

export type CoronaryDiseaseInputV1 =
  CoronaryTerritoryRecordV1<CoronaryTerritoryDiseaseInputV1>;

export type CoronaryHydraulicBoundaryInputV1 = Readonly<{
  absoluteAorticPressureMmHg: number;
  absoluteRightAtrialPressureMmHg: number;
  /** External pressure for epicardial arteries and coronary sinus. */
  perivascularExternalPressureMmHg: number;
  /** Absolute, mechanics-derived pressure surrounding each IM compartment. */
  intramyocardialPressureMmHgByTerritoryLayer:
    CoronaryTerritoryLayerRecordV1<number>;
}>;

export type CoronaryBackwardEulerSolverOptionsV1 = Readonly<{
  maximumNewtonIterations: number;
  maximumLineSearchBacktracks: number;
  absoluteResidualToleranceMl: number;
  relativeResidualTolerance: number;
  finiteDifferenceRelativeStep: number;
  minimumVolumeFractionOfColdSeed: number;
}>;

export type CoronaryBackwardEulerTrialInputV1 = Readonly<{
  dtSec: number;
  boundary: CoronaryHydraulicBoundaryInputV1;
  disease?: CoronaryDiseaseInputV1;
  solverOptions?: Partial<CoronaryBackwardEulerSolverOptionsV1>;
}>;

export type CoronaryHydraulicEvaluationV1 = Readonly<{
  absolutePressureMmHgByNode:
    Readonly<Record<CoronaryHydraulicNodeIdV1, number>>;
  signedFlowMlPerSecByEdge: Readonly<Record<CoronaryEdgeIdV1, number>>;
  effectiveToneResistanceScaleByTerritory:
    CoronaryToneResistanceScaleStateV1;
  distributedArterialResistanceScaleByTerritory:
    CoronaryToneResistanceScaleStateV1;
  /** Massless sampling point immediately distal to the focal lesion. */
  postLesionAbsolutePressureMmHgByTerritory:
    CoronaryTerritoryRecordV1<number>;
  additionalStenosisPressureLossMmHgByTerritory:
    CoronaryTerritoryRecordV1<number>;
  totalInletFlowMlPerSec: number;
  coronarySinusOutletFlowMlPerSec: number;
  inletFlowMlPerSecByTerritory: CoronaryTerritoryRecordV1<number>;
  layerArteriolarFlowMlPerSecByTerritory:
    CoronaryTerritoryLayerRecordV1<number>;
  layerVenularFlowMlPerSecByTerritory:
    CoronaryTerritoryLayerRecordV1<number>;
}>;

export type CoronaryBackwardEulerDiagnosticsV1 = Readonly<{
  converged: true;
  newtonIterations: number;
  totalLineSearchBacktracks: number;
  finalResidualInfinityNormMl: number;
  maximumAbsoluteNodeContinuityResidualMl: number;
  continuityResidualMlByNode: CoronaryConservedVolumeStateV1;
  storageRateMlPerSecByNode: CoronaryConservedVolumeStateV1;
  previousCoronaryBloodVolumeMl: number;
  candidateCoronaryBloodVolumeMl: number;
  coronaryBloodVolumeChangeMl: number;
  signedBoundaryInletVolumeMl: number;
  signedBoundaryOutletVolumeMl: number;
  exactBloodVolumeLedgerResidualMl: number;
  hydraulics: CoronaryHydraulicEvaluationV1;
}>;

export type CoronaryBackwardEulerTrialV1 = Readonly<{
  baseAcceptedRevision: number;
  baseAcceptedTimeSec: number;
  dtSec: number;
  candidateAcceptedState: CoronaryAcceptedHydraulicStateV1;
  diagnostics: CoronaryBackwardEulerDiagnosticsV1;
}>;

export type CoronaryHydraulicCheckpointV1 = Readonly<{
  schema: "circleheart.coronary-hydraulic-checkpoint.v1";
  topologyId: CoronaryTopologyPriorV1["topologyId"];
  acceptedState: CoronaryAcceptedHydraulicStateV1;
}>;

export const NORMAL_CORONARY_DISEASE_INPUT_V1 = Object.freeze(
  Object.fromEntries(CORONARY_TERRITORY_IDS_V1.map((territoryId) => [
    territoryId,
    Object.freeze({
      diameterStenosisFraction01: 0,
      microvascularStructuralResistanceScale: 1,
    }),
  ])),
) as CoronaryDiseaseInputV1;

export const DEFAULT_CORONARY_BACKWARD_EULER_SOLVER_OPTIONS_V1 = Object.freeze({
  maximumNewtonIterations: 30,
  maximumLineSearchBacktracks: 20,
  absoluteResidualToleranceMl: 1e-10,
  relativeResidualTolerance: 1e-10,
  finiteDifferenceRelativeStep: 1e-6,
  minimumVolumeFractionOfColdSeed: 1e-6,
}) satisfies CoronaryBackwardEulerSolverOptionsV1;

type MutableHydraulicEvaluation = {
  pressureByNode: number[];
  flowByEdge: number[];
  effectiveToneScale: number[];
  distributedArterialResistanceScale: number[];
  postLesionAbsolutePressureMmHg: number[];
  additionalStenosisPressureLossMmHg: number[];
};

type ResidualEvaluation = {
  residual: number[];
  hydraulics: MutableHydraulicEvaluation;
};

const NODE_INDEX = Object.freeze(Object.fromEntries(
  CORONARY_CONSERVED_VOLUME_NODE_IDS_V1.map((nodeId, index) => [nodeId, index]),
)) as Readonly<Record<CoronaryConservedVolumeNodeIdV1, number>>;

const EDGE_INDEX = Object.freeze(Object.fromEntries(
  CORONARY_EDGE_IDS_V1.map((edgeId, index) => [edgeId, index]),
)) as Readonly<Record<CoronaryEdgeIdV1, number>>;

const HYDRAULIC_NODE_IDS = Object.freeze([
  "Ao",
  ...CORONARY_CONSERVED_VOLUME_NODE_IDS_V1,
  "RA",
] as const);

export class CoronaryNetworkConvergenceErrorV1 extends Error {
  readonly finalResidualInfinityNormMl: number;
  readonly attemptedNewtonIterations: number;

  constructor(
    message: string,
    finalResidualInfinityNormMl: number,
    attemptedNewtonIterations: number,
  ) {
    super(message);
    this.name = "CoronaryNetworkConvergenceErrorV1";
    this.finalResidualInfinityNormMl = finalResidualInfinityNormMl;
    this.attemptedNewtonIterations = attemptedNewtonIterations;
  }
}

export function createInitialCoronaryAcceptedHydraulicStateV1(
  prior: CoronaryTopologyPriorV1 = NORMAL_ADULT_CORONARY_TOPOLOGY_PRIOR_V1,
  toneResistanceScaleByTerritory:
    CoronaryToneResistanceScaleStateV1 = uniformTerritoryRecord(1),
): CoronaryAcceptedHydraulicStateV1 {
  const topology = buildCoronaryTopologyV1(prior);
  const volumes = {} as Record<CoronaryConservedVolumeNodeIdV1, number>;
  for (const node of topology.nodes) volumes[node.nodeId] = node.coldSeedVolumeMl;
  return freezeAcceptedState({
    acceptedTimeSec: 0,
    revision: 0,
    volumeMlByNode: volumes,
    toneResistanceScaleByTerritory,
  }, prior);
}

export function evaluateCoronaryHydraulicsV1(
  volumeMlByNode: CoronaryConservedVolumeStateV1,
  toneResistanceScaleByTerritory: CoronaryToneResistanceScaleStateV1,
  boundary: CoronaryHydraulicBoundaryInputV1,
  disease: CoronaryDiseaseInputV1 = NORMAL_CORONARY_DISEASE_INPUT_V1,
  prior: CoronaryTopologyPriorV1 = NORMAL_ADULT_CORONARY_TOPOLOGY_PRIOR_V1,
): CoronaryHydraulicEvaluationV1 {
  validateBoundary(boundary);
  validateDisease(disease);
  validateTone(toneResistanceScaleByTerritory, prior);
  const volumes = volumeRecordToArray(volumeMlByNode);
  validateVolumes(volumes, prior, 0);
  return freezeHydraulicEvaluation(
    evaluateHydraulicsInternal(
      volumes,
      toneResistanceScaleByTerritory,
      boundary,
      disease,
      prior,
    ),
  );
}

/**
 * Solve one fully implicit hydraulic step. Tone is copied from the previous
 * accepted state and remains fixed for every residual/Jacobian evaluation.
 * The function is pure: repeated calls from the same accepted state are
 * deterministic and do not consume a hidden warm start.
 */
export function solveCoronaryBackwardEulerTrialV1(
  previousAcceptedState: CoronaryAcceptedHydraulicStateV1,
  input: CoronaryBackwardEulerTrialInputV1,
  prior: CoronaryTopologyPriorV1 = NORMAL_ADULT_CORONARY_TOPOLOGY_PRIOR_V1,
): CoronaryBackwardEulerTrialV1 {
  validateAcceptedState(previousAcceptedState, prior);
  validateTrialInput(input);
  const disease = input.disease ?? NORMAL_CORONARY_DISEASE_INPUT_V1;
  validateDisease(disease);
  const options = resolveSolverOptions(input.solverOptions);
  const previous = volumeRecordToArray(previousAcceptedState.volumeMlByNode);
  const coldSeeds = coldSeedArray(prior);
  const minimumVolumes = coldSeeds.map(
    (volume) => volume * options.minimumVolumeFractionOfColdSeed,
  );
  validateVolumes(previous, prior, options.minimumVolumeFractionOfColdSeed);

  const evaluateResidual = (candidate: number[]): ResidualEvaluation => {
    const hydraulics = evaluateHydraulicsInternal(
      candidate,
      previousAcceptedState.toneResistanceScaleByTerritory,
      input.boundary,
      disease,
      prior,
    );
    const residual = candidate.map((volume, nodeIndex) =>
      volume - previous[nodeIndex],
    );
    accumulateFlowContinuity(residual, hydraulics.flowByEdge, input.dtSec);
    return { residual, hydraulics };
  };

  let candidate = previous.slice();
  let evaluated = evaluateResidual(candidate);
  let residualNorm = infinityNorm(evaluated.residual);
  const convergenceTolerance =
    options.absoluteResidualToleranceMl
    + options.relativeResidualTolerance * Math.max(1, ...previous);
  let iterations = 0;
  let totalBacktracks = 0;

  while (residualNorm > convergenceTolerance) {
    if (iterations >= options.maximumNewtonIterations) {
      throw new CoronaryNetworkConvergenceErrorV1(
        `coronary backward-Euler Newton failed after ${iterations} iterations`,
        residualNorm,
        iterations,
      );
    }
    const jacobian = numericalJacobian(
      candidate,
      evaluated.residual,
      evaluateResidual,
      minimumVolumes,
      options.finiteDifferenceRelativeStep,
    );
    const step = solveDenseLinearSystem(
      jacobian,
      evaluated.residual.map((value) => -value),
    );

    let alpha = maximumPositiveStep(candidate, step, minimumVolumes);
    let accepted: { candidate: number[]; evaluated: ResidualEvaluation; norm: number } | null = null;
    let best: { candidate: number[]; evaluated: ResidualEvaluation; norm: number } | null = null;
    for (let backtrack = 0; backtrack <= options.maximumLineSearchBacktracks; backtrack += 1) {
      const nextCandidate = candidate.map(
        (volume, index) => volume + alpha * step[index],
      );
      const nextEvaluated = evaluateResidual(nextCandidate);
      const nextNorm = infinityNorm(nextEvaluated.residual);
      if (best === null || nextNorm < best.norm) {
        best = { candidate: nextCandidate, evaluated: nextEvaluated, norm: nextNorm };
      }
      if (nextNorm <= residualNorm * (1 - 1e-4 * alpha)) {
        accepted = best;
        totalBacktracks += backtrack;
        break;
      }
      alpha *= 0.5;
    }
    if (accepted === null && best !== null && best.norm < residualNorm) {
      accepted = best;
      totalBacktracks += options.maximumLineSearchBacktracks;
    }
    if (accepted === null) {
      throw new CoronaryNetworkConvergenceErrorV1(
        "coronary backward-Euler Newton line search did not reduce the residual",
        residualNorm,
        iterations,
      );
    }
    candidate = accepted.candidate;
    evaluated = accepted.evaluated;
    residualNorm = accepted.norm;
    iterations += 1;
  }

  const candidateVolumes = arrayToVolumeRecord(candidate);
  const previousTotal = sum(previous);
  const candidateTotal = sum(candidate);
  const inletFlow = totalInletFlow(evaluated.hydraulics.flowByEdge);
  const outletFlow = evaluated.hydraulics.flowByEdge[EDGE_INDEX.CS_RA];
  const continuityResidual = arrayToVolumeRecord(evaluated.residual);
  const storageRate = arrayToVolumeRecord(candidate.map(
    (volume, index) => (volume - previous[index]) / input.dtSec,
  ));
  const ledgerResidual =
    candidateTotal - previousTotal
    - input.dtSec * (inletFlow - outletFlow);
  const candidateAcceptedState = freezeAcceptedState({
    acceptedTimeSec: previousAcceptedState.acceptedTimeSec + input.dtSec,
    revision: previousAcceptedState.revision + 1,
    volumeMlByNode: candidateVolumes,
    toneResistanceScaleByTerritory:
      previousAcceptedState.toneResistanceScaleByTerritory,
  }, prior);

  return Object.freeze({
    baseAcceptedRevision: previousAcceptedState.revision,
    baseAcceptedTimeSec: previousAcceptedState.acceptedTimeSec,
    dtSec: input.dtSec,
    candidateAcceptedState,
    diagnostics: Object.freeze({
      converged: true as const,
      newtonIterations: iterations,
      totalLineSearchBacktracks: totalBacktracks,
      finalResidualInfinityNormMl: residualNorm,
      maximumAbsoluteNodeContinuityResidualMl:
        infinityNorm(evaluated.residual),
      continuityResidualMlByNode: continuityResidual,
      storageRateMlPerSecByNode: storageRate,
      previousCoronaryBloodVolumeMl: previousTotal,
      candidateCoronaryBloodVolumeMl: candidateTotal,
      coronaryBloodVolumeChangeMl: candidateTotal - previousTotal,
      signedBoundaryInletVolumeMl: input.dtSec * inletFlow,
      signedBoundaryOutletVolumeMl: input.dtSec * outletFlow,
      exactBloodVolumeLedgerResidualMl: ledgerResidual,
      hydraulics: freezeHydraulicEvaluation(evaluated.hydraulics),
    }),
  });
}

/**
 * Small transactional owner around the pure trial solver. Trials never mutate
 * the accepted state; commit is explicit, and rollback merely invalidates the
 * candidate. A trial created before a commit/restore cannot later be committed.
 */
export class CoronaryBackwardEulerTransactionV1 {
  readonly prior: CoronaryTopologyPriorV1;
  private acceptedState: CoronaryAcceptedHydraulicStateV1;
  private epoch = 0;
  private readonly trialEpoch = new WeakMap<object, number>();

  constructor(
    prior: CoronaryTopologyPriorV1 = NORMAL_ADULT_CORONARY_TOPOLOGY_PRIOR_V1,
    initialState: CoronaryAcceptedHydraulicStateV1 =
      createInitialCoronaryAcceptedHydraulicStateV1(prior),
  ) {
    buildCoronaryTopologyV1(prior);
    validateAcceptedState(initialState, prior);
    this.prior = prior;
    this.acceptedState = cloneAcceptedState(initialState, prior);
  }

  getAcceptedState(): CoronaryAcceptedHydraulicStateV1 {
    return this.acceptedState;
  }

  beginTrial(input: CoronaryBackwardEulerTrialInputV1): CoronaryBackwardEulerTrialV1 {
    const trial = solveCoronaryBackwardEulerTrialV1(
      this.acceptedState,
      input,
      this.prior,
    );
    this.trialEpoch.set(trial, this.epoch);
    return trial;
  }

  commit(trial: CoronaryBackwardEulerTrialV1): CoronaryAcceptedHydraulicStateV1 {
    this.assertLiveTrial(trial);
    this.acceptedState = cloneAcceptedState(trial.candidateAcceptedState, this.prior);
    this.epoch += 1;
    return this.acceptedState;
  }

  rollback(trial: CoronaryBackwardEulerTrialV1): CoronaryAcceptedHydraulicStateV1 {
    this.assertLiveTrial(trial);
    this.trialEpoch.delete(trial);
    return this.acceptedState;
  }

  createCheckpoint(): CoronaryHydraulicCheckpointV1 {
    return Object.freeze({
      schema: "circleheart.coronary-hydraulic-checkpoint.v1" as const,
      topologyId: this.prior.topologyId,
      acceptedState: cloneAcceptedState(this.acceptedState, this.prior),
    });
  }

  restoreCheckpoint(checkpoint: CoronaryHydraulicCheckpointV1): CoronaryAcceptedHydraulicStateV1 {
    if (checkpoint.schema !== "circleheart.coronary-hydraulic-checkpoint.v1") {
      throw new RangeError("unsupported coronary hydraulic checkpoint schema");
    }
    if (checkpoint.topologyId !== this.prior.topologyId) {
      throw new RangeError("coronary hydraulic checkpoint topology mismatch");
    }
    validateAcceptedState(checkpoint.acceptedState, this.prior);
    this.acceptedState = cloneAcceptedState(checkpoint.acceptedState, this.prior);
    this.epoch += 1;
    return this.acceptedState;
  }

  private assertLiveTrial(trial: CoronaryBackwardEulerTrialV1): void {
    if (
      this.trialEpoch.get(trial) !== this.epoch
      || trial.baseAcceptedRevision !== this.acceptedState.revision
      || trial.baseAcceptedTimeSec !== this.acceptedState.acceptedTimeSec
    ) {
      throw new Error("stale or foreign coronary hydraulic trial");
    }
  }
}

function evaluateHydraulicsInternal(
  volumes: readonly number[],
  tone: CoronaryToneResistanceScaleStateV1,
  boundary: CoronaryHydraulicBoundaryInputV1,
  disease: CoronaryDiseaseInputV1,
  prior: CoronaryTopologyPriorV1,
): MutableHydraulicEvaluation {
  const pressureByNode = Array<number>(HYDRAULIC_NODE_IDS.length).fill(0);
  const flowByEdge = Array<number>(CORONARY_EDGE_IDS_V1.length).fill(0);
  const effectiveToneScale = Array<number>(CORONARY_TERRITORY_IDS_V1.length).fill(0);
  const distributedArterialResistanceScale =
    Array<number>(CORONARY_TERRITORY_IDS_V1.length).fill(0);
  const postLesionAbsolutePressureMmHg =
    Array<number>(CORONARY_TERRITORY_IDS_V1.length).fill(0);
  const additionalStenosisPressureLossMmHg =
    Array<number>(CORONARY_TERRITORY_IDS_V1.length).fill(0);
  pressureByNode[hydraulicPressureIndex("Ao")] = boundary.absoluteAorticPressureMmHg;
  pressureByNode[hydraulicPressureIndex("RA")] = boundary.absoluteRightAtrialPressureMmHg;

  for (let territoryIndex = 0; territoryIndex < CORONARY_TERRITORY_IDS_V1.length; territoryIndex += 1) {
    const territoryId = CORONARY_TERRITORY_IDS_V1[territoryIndex];
    const territory = prior.territories[territoryId];
    const diseaseInput = disease[territoryId];
    const baseNodeIndex = 3 * territoryIndex;
    const arteryVolume = volumes[baseNodeIndex];
    const arteryPressure = boundary.perivascularExternalPressureMmHg
      + (arteryVolume - territory.distalArterialNode.unstressedVolumeMl)
        / territory.distalArterialNode.complianceMlPerMmHg;
    pressureByNode[hydraulicPressureIndex(`${territoryId}.Art`)] = arteryPressure;

    const effectiveTone = tone[territoryId];
    effectiveToneScale[territoryIndex] = effectiveTone;
    const arterialResistanceScale =
      effectiveTone ** territory.distributedArterialToneExponent;
    distributedArterialResistanceScale[territoryIndex] =
      arterialResistanceScale;

    const stenosis = mapYoungTsaiCoronaryStenosisV1(
      diseaseInput.diameterStenosisFraction01,
      territory.stenosisGeometry,
    );
    const inletDeltaPressure =
      boundary.absoluteAorticPressureMmHg - arteryPressure;
    const inletFlow = solveSignedLinearQuadraticFlow(
      inletDeltaPressure,
      territory.healthyDistributedArterialResistanceMmHgSecPerMl
        * arterialResistanceScale
        + stenosis.additionalLinearResistanceMmHgSecPerMl,
      stenosis.additionalQuadraticResistanceMmHgSec2PerMl2,
    );
    flowByEdge[5 * territoryIndex] = inletFlow;
    const stenosisLoss = evaluateSignedLinearQuadraticLossV1(
      inletFlow,
      stenosis.additionalLinearResistanceMmHgSecPerMl,
      stenosis.additionalQuadraticResistanceMmHgSec2PerMl2,
    ).pressureLossMmHg;
    additionalStenosisPressureLossMmHg[territoryIndex] = stenosisLoss;
    postLesionAbsolutePressureMmHg[territoryIndex] =
      boundary.absoluteAorticPressureMmHg - stenosisLoss;

    for (let layerIndex = 0; layerIndex < CORONARY_LAYER_IDS_V1.length; layerIndex += 1) {
      const layerId = CORONARY_LAYER_IDS_V1[layerIndex];
      const nodeIndex = baseNodeIndex + 1 + layerIndex;
      const layer = territory.layers[layerId];
      const transmural = evaluateCollapsibleIntramyocardialPvV1(
        volumes[nodeIndex],
        layer.collapsiblePv,
      );
      const imPressure =
        boundary.intramyocardialPressureMmHgByTerritoryLayer[territoryId][layerId]
        + transmural.transmuralPressureMmHg;
      pressureByNode[hydraulicPressureIndex(`${territoryId}.IM.${layerId}`)] = imPressure;
      const arteriolar = evaluateVolumeDependentCoronaryResistanceV1(
        volumes[nodeIndex],
        layer.arteriolarResistance,
      );
      const venular = evaluateVolumeDependentCoronaryResistanceV1(
        volumes[nodeIndex],
        layer.venularResistance,
      );
      const flowOffset = 5 * territoryIndex + 1 + 2 * layerIndex;
      flowByEdge[flowOffset] = (arteryPressure - imPressure) /
        (
          arteriolar.resistanceMmHgSecPerMl
          * effectiveTone
          * diseaseInput.microvascularStructuralResistanceScale
        );
      // CS pressure is assigned below; defer the venular flow.
      flowByEdge[flowOffset + 1] = venular.resistanceMmHgSecPerMl;
    }
  }

  const csIndex = NODE_INDEX.CS;
  const csPressure = boundary.perivascularExternalPressureMmHg
    + (volumes[csIndex] - prior.coronarySinus.unstressedVolumeMl)
      / prior.coronarySinus.complianceMlPerMmHg;
  pressureByNode[hydraulicPressureIndex("CS")] = csPressure;
  for (let territoryIndex = 0; territoryIndex < CORONARY_TERRITORY_IDS_V1.length; territoryIndex += 1) {
    const territoryId = CORONARY_TERRITORY_IDS_V1[territoryIndex];
    for (let layerIndex = 0; layerIndex < CORONARY_LAYER_IDS_V1.length; layerIndex += 1) {
      const layerId = CORONARY_LAYER_IDS_V1[layerIndex];
      const flowOffset = 5 * territoryIndex + 1 + 2 * layerIndex;
      const venularResistance = flowByEdge[flowOffset + 1];
      const imPressure = pressureByNode[
        hydraulicPressureIndex(`${territoryId}.IM.${layerId}`)
      ];
      flowByEdge[flowOffset + 1] = (imPressure - csPressure) / venularResistance;
    }
  }
  flowByEdge[EDGE_INDEX.CS_RA] =
    (csPressure - boundary.absoluteRightAtrialPressureMmHg)
    / prior.coronarySinus.outletResistanceMmHgSecPerMl;
  return {
    pressureByNode,
    flowByEdge,
    effectiveToneScale,
    distributedArterialResistanceScale,
    postLesionAbsolutePressureMmHg,
    additionalStenosisPressureLossMmHg,
  };
}

function accumulateFlowContinuity(
  residual: number[],
  flowByEdge: readonly number[],
  dtSec: number,
): void {
  for (let territoryIndex = 0; territoryIndex < CORONARY_TERRITORY_IDS_V1.length; territoryIndex += 1) {
    const baseNode = 3 * territoryIndex;
    const flowOffset = 5 * territoryIndex;
    const inlet = flowByEdge[flowOffset];
    const artToEpi = flowByEdge[flowOffset + 1];
    const epiToCs = flowByEdge[flowOffset + 2];
    const artToEndo = flowByEdge[flowOffset + 3];
    const endoToCs = flowByEdge[flowOffset + 4];
    residual[baseNode] -= dtSec * (inlet - artToEpi - artToEndo);
    residual[baseNode + 1] -= dtSec * (artToEpi - epiToCs);
    residual[baseNode + 2] -= dtSec * (artToEndo - endoToCs);
    residual[NODE_INDEX.CS] -= dtSec * (epiToCs + endoToCs);
  }
  residual[NODE_INDEX.CS] += dtSec * flowByEdge[EDGE_INDEX.CS_RA];
}

function numericalJacobian(
  candidate: readonly number[],
  baseResidual: readonly number[],
  evaluate: (candidate: number[]) => ResidualEvaluation,
  minimumVolumes: readonly number[],
  relativeStep: number,
): number[][] {
  const n = candidate.length;
  const jacobian = Array.from({ length: n }, () => Array<number>(n).fill(0));
  for (let column = 0; column < n; column += 1) {
    const requestedStep = Math.max(1e-8, relativeStep * Math.max(1, Math.abs(candidate[column])));
    const canUseCentral = candidate[column] - requestedStep > minimumVolumes[column];
    const plus = candidate.slice();
    plus[column] += requestedStep;
    const plusResidual = evaluate(plus).residual;
    if (canUseCentral) {
      const minus = candidate.slice();
      minus[column] -= requestedStep;
      const minusResidual = evaluate(minus).residual;
      for (let row = 0; row < n; row += 1) {
        jacobian[row][column] =
          (plusResidual[row] - minusResidual[row]) / (2 * requestedStep);
      }
    } else {
      for (let row = 0; row < n; row += 1) {
        jacobian[row][column] =
          (plusResidual[row] - baseResidual[row]) / requestedStep;
      }
    }
  }
  return jacobian;
}

function solveDenseLinearSystem(matrix: readonly (readonly number[])[], rhs: readonly number[]): number[] {
  const n = rhs.length;
  const augmented = matrix.map((row, index) => [...row, rhs[index]]);
  for (let pivotColumn = 0; pivotColumn < n; pivotColumn += 1) {
    let pivotRow = pivotColumn;
    for (let row = pivotColumn + 1; row < n; row += 1) {
      if (Math.abs(augmented[row][pivotColumn]) > Math.abs(augmented[pivotRow][pivotColumn])) {
        pivotRow = row;
      }
    }
    if (Math.abs(augmented[pivotRow][pivotColumn]) < 1e-14) {
      throw new CoronaryNetworkConvergenceErrorV1(
        "singular coronary backward-Euler Newton Jacobian",
        Number.POSITIVE_INFINITY,
        0,
      );
    }
    [augmented[pivotColumn], augmented[pivotRow]] =
      [augmented[pivotRow], augmented[pivotColumn]];
    const pivot = augmented[pivotColumn][pivotColumn];
    for (let row = pivotColumn + 1; row < n; row += 1) {
      const factor = augmented[row][pivotColumn] / pivot;
      augmented[row][pivotColumn] = 0;
      for (let column = pivotColumn + 1; column <= n; column += 1) {
        augmented[row][column] -= factor * augmented[pivotColumn][column];
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

function solveSignedLinearQuadraticFlow(
  pressureDropMmHg: number,
  linearResistanceMmHgSecPerMl: number,
  quadraticResistanceMmHgSec2PerMl2: number,
): number {
  if (quadraticResistanceMmHgSec2PerMl2 <= 1e-14) {
    return pressureDropMmHg / linearResistanceMmHgSecPerMl;
  }
  const magnitudePressure = Math.abs(pressureDropMmHg);
  const root = Math.sqrt(
    linearResistanceMmHgSecPerMl ** 2
    + 4 * quadraticResistanceMmHgSec2PerMl2 * magnitudePressure,
  );
  const magnitudeFlow = 2 * magnitudePressure /
    (linearResistanceMmHgSecPerMl + root);
  return Math.sign(pressureDropMmHg) * magnitudeFlow;
}

function freezeHydraulicEvaluation(
  evaluated: MutableHydraulicEvaluation,
): CoronaryHydraulicEvaluationV1 {
  const pressures = {} as Record<CoronaryHydraulicNodeIdV1, number>;
  for (const nodeId of HYDRAULIC_NODE_IDS) {
    pressures[nodeId] = evaluated.pressureByNode[hydraulicPressureIndex(nodeId)];
  }
  const flows = {} as Record<CoronaryEdgeIdV1, number>;
  for (const edgeId of CORONARY_EDGE_IDS_V1) {
    flows[edgeId] = evaluated.flowByEdge[EDGE_INDEX[edgeId]];
  }
  const inletByTerritory = {} as Record<(typeof CORONARY_TERRITORY_IDS_V1)[number], number>;
  const toneByTerritory = {} as Record<(typeof CORONARY_TERRITORY_IDS_V1)[number], number>;
  const arterialScaleByTerritory = {} as Record<
    (typeof CORONARY_TERRITORY_IDS_V1)[number],
    number
  >;
  const postLesionPressureByTerritory = {} as Record<
    (typeof CORONARY_TERRITORY_IDS_V1)[number],
    number
  >;
  const stenosisLossByTerritory = {} as Record<
    (typeof CORONARY_TERRITORY_IDS_V1)[number],
    number
  >;
  const arteriolar = {} as Record<string, Readonly<Record<string, number>>>;
  const venular = {} as Record<string, Readonly<Record<string, number>>>;
  CORONARY_TERRITORY_IDS_V1.forEach((territoryId, territoryIndex) => {
    inletByTerritory[territoryId] = evaluated.flowByEdge[5 * territoryIndex];
    toneByTerritory[territoryId] = evaluated.effectiveToneScale[territoryIndex];
    arterialScaleByTerritory[territoryId] =
      evaluated.distributedArterialResistanceScale[territoryIndex];
    postLesionPressureByTerritory[territoryId] =
      evaluated.postLesionAbsolutePressureMmHg[territoryIndex];
    stenosisLossByTerritory[territoryId] =
      evaluated.additionalStenosisPressureLossMmHg[territoryIndex];
    const artLayer: Record<string, number> = {};
    const venLayer: Record<string, number> = {};
    CORONARY_LAYER_IDS_V1.forEach((layerId, layerIndex) => {
      const offset = 5 * territoryIndex + 1 + 2 * layerIndex;
      artLayer[layerId] = evaluated.flowByEdge[offset];
      venLayer[layerId] = evaluated.flowByEdge[offset + 1];
    });
    arteriolar[territoryId] = Object.freeze(artLayer);
    venular[territoryId] = Object.freeze(venLayer);
  });
  return Object.freeze({
    absolutePressureMmHgByNode: Object.freeze(pressures),
    signedFlowMlPerSecByEdge: Object.freeze(flows),
    effectiveToneResistanceScaleByTerritory: Object.freeze(toneByTerritory) as
      CoronaryToneResistanceScaleStateV1,
    distributedArterialResistanceScaleByTerritory:
      Object.freeze(arterialScaleByTerritory) as
        CoronaryToneResistanceScaleStateV1,
    postLesionAbsolutePressureMmHgByTerritory:
      Object.freeze(postLesionPressureByTerritory) as
        CoronaryTerritoryRecordV1<number>,
    additionalStenosisPressureLossMmHgByTerritory:
      Object.freeze(stenosisLossByTerritory) as
        CoronaryTerritoryRecordV1<number>,
    totalInletFlowMlPerSec: totalInletFlow(evaluated.flowByEdge),
    coronarySinusOutletFlowMlPerSec: evaluated.flowByEdge[EDGE_INDEX.CS_RA],
    inletFlowMlPerSecByTerritory: Object.freeze(inletByTerritory) as
      CoronaryTerritoryRecordV1<number>,
    layerArteriolarFlowMlPerSecByTerritory: Object.freeze(arteriolar) as
      CoronaryTerritoryLayerRecordV1<number>,
    layerVenularFlowMlPerSecByTerritory: Object.freeze(venular) as
      CoronaryTerritoryLayerRecordV1<number>,
  });
}

function hydraulicPressureIndex(nodeId: CoronaryHydraulicNodeIdV1): number {
  if (nodeId === "Ao") return 0;
  if (nodeId === "RA") return HYDRAULIC_NODE_IDS.length - 1;
  return 1 + NODE_INDEX[nodeId];
}

function totalInletFlow(flowByEdge: readonly number[]): number {
  return flowByEdge[0] + flowByEdge[5] + flowByEdge[10];
}

function maximumPositiveStep(
  candidate: readonly number[],
  step: readonly number[],
  minimumVolumes: readonly number[],
): number {
  let alpha = 1;
  for (let index = 0; index < candidate.length; index += 1) {
    if (step[index] < 0) {
      alpha = Math.min(
        alpha,
        0.99 * (candidate[index] - minimumVolumes[index]) / -step[index],
      );
    }
  }
  return Math.max(alpha, Number.EPSILON);
}

function resolveSolverOptions(
  partial?: Partial<CoronaryBackwardEulerSolverOptionsV1>,
): CoronaryBackwardEulerSolverOptionsV1 {
  const resolved = Object.freeze({
    ...DEFAULT_CORONARY_BACKWARD_EULER_SOLVER_OPTIONS_V1,
    ...partial,
  });
  for (const [name, value] of Object.entries(resolved)) {
    if (!Number.isFinite(value) || value <= 0) {
      throw new RangeError(`${name} must be positive and finite`);
    }
  }
  if (!Number.isInteger(resolved.maximumNewtonIterations)
    || !Number.isInteger(resolved.maximumLineSearchBacktracks)) {
    throw new RangeError("coronary solver iteration limits must be integers");
  }
  if (resolved.minimumVolumeFractionOfColdSeed >= 1) {
    throw new RangeError("minimum coronary volume fraction must be below one");
  }
  return resolved;
}

function validateTrialInput(input: CoronaryBackwardEulerTrialInputV1): void {
  if (!Number.isFinite(input.dtSec) || input.dtSec <= 0) {
    throw new RangeError("coronary backward-Euler dt must be positive and finite");
  }
  validateBoundary(input.boundary);
}

function validateBoundary(boundary: CoronaryHydraulicBoundaryInputV1): void {
  for (const [name, value] of [
    ["absoluteAorticPressureMmHg", boundary.absoluteAorticPressureMmHg],
    ["absoluteRightAtrialPressureMmHg", boundary.absoluteRightAtrialPressureMmHg],
    ["perivascularExternalPressureMmHg", boundary.perivascularExternalPressureMmHg],
  ] as const) {
    if (!Number.isFinite(value)) throw new RangeError(`${name} must be finite`);
  }
  for (const territoryId of CORONARY_TERRITORY_IDS_V1) {
    for (const layerId of CORONARY_LAYER_IDS_V1) {
      const value = boundary.intramyocardialPressureMmHgByTerritoryLayer[territoryId][layerId];
      if (!Number.isFinite(value)) {
        throw new RangeError(`${territoryId}.${layerId} IMP must be finite`);
      }
    }
  }
}

function validateDisease(disease: CoronaryDiseaseInputV1): void {
  for (const territoryId of CORONARY_TERRITORY_IDS_V1) {
    const value = disease[territoryId];
    if (!Number.isFinite(value.diameterStenosisFraction01)
      || value.diameterStenosisFraction01 < 0
      || value.diameterStenosisFraction01 >= 1) {
      throw new RangeError(`${territoryId} diameter stenosis must lie in [0, 1)`);
    }
    if (!Number.isFinite(value.microvascularStructuralResistanceScale)
      || value.microvascularStructuralResistanceScale <= 0) {
      throw new RangeError(`${territoryId} structural microvascular resistance scale must be positive`);
    }
  }
}

function validateTone(
  tone: CoronaryToneResistanceScaleStateV1,
  prior: CoronaryTopologyPriorV1,
): void {
  for (const territoryId of CORONARY_TERRITORY_IDS_V1) {
    const value = tone[territoryId];
    const bounds = prior.territories[territoryId].autoregulation;
    if (!Number.isFinite(value)
      || value < bounds.minimumResistanceScale
      || value > bounds.maximumResistanceScale) {
      throw new RangeError(`${territoryId} accepted tone resistance scale must lie within prior bounds`);
    }
  }
}

function validateAcceptedState(
  state: CoronaryAcceptedHydraulicStateV1,
  prior: CoronaryTopologyPriorV1,
): void {
  if (!Number.isFinite(state.acceptedTimeSec) || state.acceptedTimeSec < 0) {
    throw new RangeError("accepted coronary time must be finite and non-negative");
  }
  if (!Number.isInteger(state.revision) || state.revision < 0) {
    throw new RangeError("accepted coronary revision must be a non-negative integer");
  }
  validateTone(state.toneResistanceScaleByTerritory, prior);
  validateVolumes(volumeRecordToArray(state.volumeMlByNode), prior, 0);
}

function validateVolumes(
  volumes: readonly number[],
  prior: CoronaryTopologyPriorV1,
  minimumFraction: number,
): void {
  if (volumes.length !== CORONARY_CONSERVED_VOLUME_NODE_IDS_V1.length) {
    throw new RangeError("coronary hydraulic state must own exactly ten volumes");
  }
  const cold = coldSeedArray(prior);
  volumes.forEach((volume, index) => {
    if (!Number.isFinite(volume) || volume <= cold[index] * minimumFraction) {
      throw new RangeError(`${CORONARY_CONSERVED_VOLUME_NODE_IDS_V1[index]} volume is outside the positive physical domain`);
    }
  });
}

function freezeAcceptedState(
  state: {
    acceptedTimeSec: number;
    revision: number;
    volumeMlByNode: Readonly<Record<CoronaryConservedVolumeNodeIdV1, number>>;
    toneResistanceScaleByTerritory: CoronaryToneResistanceScaleStateV1;
  },
  prior: CoronaryTopologyPriorV1,
): CoronaryAcceptedHydraulicStateV1 {
  const frozen = Object.freeze({
    acceptedTimeSec: state.acceptedTimeSec,
    revision: state.revision,
    volumeMlByNode: Object.freeze({ ...state.volumeMlByNode }),
    toneResistanceScaleByTerritory: Object.freeze({
      ...state.toneResistanceScaleByTerritory,
    }) as CoronaryToneResistanceScaleStateV1,
  });
  validateAcceptedState(frozen, prior);
  return frozen;
}

function cloneAcceptedState(
  state: CoronaryAcceptedHydraulicStateV1,
  prior: CoronaryTopologyPriorV1,
): CoronaryAcceptedHydraulicStateV1 {
  return freezeAcceptedState(state, prior);
}

function volumeRecordToArray(volumes: CoronaryConservedVolumeStateV1): number[] {
  return CORONARY_CONSERVED_VOLUME_NODE_IDS_V1.map((nodeId) => volumes[nodeId]);
}

function arrayToVolumeRecord(volumes: readonly number[]): CoronaryConservedVolumeStateV1 {
  return Object.freeze(Object.fromEntries(
    CORONARY_CONSERVED_VOLUME_NODE_IDS_V1.map((nodeId, index) => [nodeId, volumes[index]]),
  )) as CoronaryConservedVolumeStateV1;
}

function coldSeedArray(prior: CoronaryTopologyPriorV1): number[] {
  const topology = buildCoronaryTopologyV1(prior);
  return topology.nodes.map((node) => node.coldSeedVolumeMl);
}

function uniformTerritoryRecord(value: number): CoronaryToneResistanceScaleStateV1 {
  return Object.freeze(Object.fromEntries(
    CORONARY_TERRITORY_IDS_V1.map((territoryId) => [territoryId, value]),
  )) as CoronaryToneResistanceScaleStateV1;
}

function infinityNorm(values: readonly number[]): number {
  return values.reduce((maximum, value) => Math.max(maximum, Math.abs(value)), 0);
}

function sum(values: readonly number[]): number {
  return values.reduce((total, value) => total + value, 0);
}
