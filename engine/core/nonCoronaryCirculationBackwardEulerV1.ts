import {
  baseNonValveEdgeLossV1,
  buildAuthoritativeCirculationGraphV1,
  downstreamEffectivePressureV1,
  effectiveUnstressedVolumeFromNodeV1,
  incidenceVolumeRatesFromEdgeFlowsV1,
  respiratoryExternalPressureForKindV1,
  vascularPvLawFromNodeV1,
  type BaseEdgeLossRuntimeParameterViewV1,
  type RespiratoryPressureParameterViewV1,
  type VascularPvRuntimeParameterViewV1,
} from "@/engine/core/circulationGraphKernelV1";
import type { EdgeSpec, NodeSpec } from "@/engine/core/topology";
import {
  initialMainWireFlowStateValveStateV2,
  mainWireFlowStateValveParamsFromEdgeV2,
  stepMainWireFlowStateValveV2,
  type MainWireFlowStateValveEvaluationV2,
  type MainWireFlowStateValveStateV2,
} from "@/engine/mechanics2/valve/MainWireFlowStateValveV2";
import {
  ptmFromStressedVolume,
  stressedVolumeFromPtm,
} from "@/engine/vascularPv";

export const NON_CORONARY_CIRCULATION_BE_V1_ID =
  "authoritative-main-wire-noncoronary-backward-euler-v1" as const;

export const NON_CORONARY_NODE_NAMES_V1 = Object.freeze([
  "LV", "LA", "RV", "RA",
  "Ao", "SA", "Art", "Cap", "SV", "VC",
  "PA", "PArt", "PCap", "PVen", "PVein",
] as const);
export type NonCoronaryNodeNameV1 =
  (typeof NON_CORONARY_NODE_NAMES_V1)[number];

export const NON_CORONARY_EDGE_NAMES_V1 = Object.freeze([
  "MV", "AoV", "TV", "PV",
  "Ao_SA", "SA_Art", "Art_Cap", "Cap_SV", "SV_VC", "VC_RA",
  "PA_PArt", "PArt_PCap", "PCap_PVen", "PVen_PVein", "PVein_LA",
] as const);
export type NonCoronaryEdgeNameV1 =
  (typeof NON_CORONARY_EDGE_NAMES_V1)[number];

export const NON_CORONARY_DYNAMIC_EDGE_NAMES_V1 = Object.freeze([
  "Ao_SA", "PA_PArt",
] as const);
export type NonCoronaryDynamicEdgeNameV1 =
  (typeof NON_CORONARY_DYNAMIC_EDGE_NAMES_V1)[number];

export const NON_CORONARY_VALVE_NAMES_V1 = Object.freeze([
  "MV", "AoV", "TV", "PV",
] as const);
export type NonCoronaryValveNameV1 =
  (typeof NON_CORONARY_VALVE_NAMES_V1)[number];

export const NON_CORONARY_CIRCULATION_SCOPE_V1 = Object.freeze({
  topologySource: "buildAuthoritativeCirculationGraphV1" as const,
  includedNodes: NON_CORONARY_NODE_NAMES_V1,
  includedEdges: NON_CORONARY_EDGE_NAMES_V1,
  excludedCoronaryNodes: Object.freeze([
    "LAD_Art", "LAD_IM", "LAD_Ven",
    "LCx_Art", "LCx_IM", "LCx_Ven",
    "RCA_Art", "RCA_IM", "RCA_Ven", "CS",
  ] as const),
  excludedCoronaryEdges: Object.freeze([
    "Ao_LAD", "LAD_Art_IM", "LAD_IM_Ven", "LAD_Ven_CS",
    "Ao_LCx", "LCx_Art_IM", "LCx_IM_Ven", "LCx_Ven_CS",
    "Ao_RCA", "RCA_Art_IM", "RCA_IM_Ven", "RCA_Ven_CS", "CS_RA",
  ] as const),
  dependentBloodVolumeNode: "SV" as const,
  valveOwner: "MainWireQuasiSteadyOrificeValveV2" as const,
  coronaryBloodVolumeIncluded: false as const,
  chamberPressureCallback: "absolute-pressure-mmHg" as const,
  pericardialConstraintOwnedHere: false as const,
  parameterFittingAllowed: false as const,
  reverseFlowCapOrClampOnNonvalveEdges: false as const,
});

export const NON_CORONARY_CIRCULATION_UNITS_V1 = Object.freeze({
  time: "s" as const,
  nodeVolume: "mL" as const,
  pressure: "mmHg" as const,
  edgeFlow: "mL/s" as const,
  linearResistance: "mmHg*s/mL" as const,
  inertance: "mmHg*s^2/mL" as const,
  quadraticResistance: "mmHg*s^2/mL^2" as const,
});

type NodeRecord<T> = Readonly<Record<NonCoronaryNodeNameV1, T>>;
type EdgeRecord<T> = Readonly<Record<NonCoronaryEdgeNameV1, T>>;
type DynamicEdgeRecord<T> = Readonly<Record<NonCoronaryDynamicEdgeNameV1, T>>;
type ValveRecord<T> = Readonly<Record<NonCoronaryValveNameV1, T>>;

export type NonCoronaryChamberVolumesMlV1 = Readonly<{
  LV: number;
  LA: number;
  RV: number;
  RA: number;
}>;

export type NonCoronaryChamberPressuresMmHgV1 = Readonly<{
  LV: number;
  LA: number;
  RV: number;
  RA: number;
}>;

export type NonCoronaryCandidateMechanicsResultV1<TEvaluation> = Readonly<{
  /** Absolute chamber-node pressures; callback owns any pericardial offset. */
  absolutePressuresMmHg: NonCoronaryChamberPressuresMmHgV1;
  /** Opaque readback only. This circulation kernel never commits mechanics. */
  evaluation: TEvaluation;
}>;

export type NonCoronaryCandidateMechanicsCallbackV1<TEvaluation> = (
  chamberVolumesMl: NonCoronaryChamberVolumesMlV1,
  candidateTimeSec: number,
) => NonCoronaryCandidateMechanicsResultV1<TEvaluation>;

export type NonCoronaryCirculationRuntimeParamsV1 = Readonly<{
  vascular: VascularPvRuntimeParameterViewV1;
  losses: BaseEdgeLossRuntimeParameterViewV1;
  respiratory: RespiratoryPressureParameterViewV1;
}>;

export type NonCoronaryCirculationGraphV1 = Readonly<{
  topologyId: typeof NON_CORONARY_CIRCULATION_BE_V1_ID;
  nodes: readonly NodeSpec[];
  edges: readonly EdgeSpec[];
  nodeIndex: ReadonlyMap<string, number>;
  edgeIndex: ReadonlyMap<string, number>;
  scope: typeof NON_CORONARY_CIRCULATION_SCOPE_V1;
}>;

export type NonCoronaryCirculationAcceptedStateV1 = Readonly<{
  transactionId: typeof NON_CORONARY_CIRCULATION_BE_V1_ID;
  revision: number;
  acceptedTimeSec: number;
  totalBloodVolumeMl: number;
  nodeVolumesMl: NodeRecord<number>;
  dynamicEdgeFlowsMlPerSec: DynamicEdgeRecord<number>;
  valveStates: ValveRecord<MainWireFlowStateValveStateV2>;
}>;

export type NonCoronaryCirculationInitialStateInputV1 = Readonly<{
  timeSec: number;
  runtime: NonCoronaryCirculationRuntimeParamsV1;
  nodeVolumesMl?: NodeRecord<number>;
  dynamicEdgeFlowsMlPerSec?: DynamicEdgeRecord<number>;
  valveStates?: ValveRecord<MainWireFlowStateValveStateV2>;
}>;

export type NonCoronaryCirculationNewtonOptionsV1 = Readonly<{
  maxIterations?: number;
  scaledResidualInfinityTolerance?: number;
  scaledUpdateInfinityTolerance?: number;
  finiteDifferenceScaledStep?: number;
  maximumLineSearchBacktracks?: number;
}>;

export type NonCoronaryCirculationTrialInputV1<TEvaluation> = Readonly<{
  previousAcceptedState: NonCoronaryCirculationAcceptedStateV1;
  dtSec: number;
  runtime: NonCoronaryCirculationRuntimeParamsV1;
  evaluateCandidateMechanics:
    NonCoronaryCandidateMechanicsCallbackV1<TEvaluation>;
  options?: NonCoronaryCirculationNewtonOptionsV1;
}>;

export type NonCoronaryCirculationTrialDiagnosticsV1 = Readonly<{
  iterations: number;
  acceptedLineSearchSteps: number;
  lineSearchBacktracks: number;
  finalScaledResidualInfinityNorm: number;
  finalMaximumContinuityResidualMl: number;
  dependentNodeContinuityResidualMl: number;
  totalBloodVolumeErrorMl: number;
  finiteDifferenceScaledStep: number;
  mechanicsCallbackCallCount: number;
  mechanicsCallbackCacheHitCount: number;
  mechanicsCallbackUniqueCandidateCount: number;
}>;

export type NonCoronaryCirculationTrialSuccessV1<TEvaluation> = Readonly<{
  converged: true;
  transactionId: typeof NON_CORONARY_CIRCULATION_BE_V1_ID;
  baseRevision: number;
  baseAcceptedTimeSec: number;
  candidateTimeSec: number;
  dtSec: number;
  candidateNodeVolumesMl: NodeRecord<number>;
  candidateDynamicEdgeFlowsMlPerSec: DynamicEdgeRecord<number>;
  candidateValveStates: ValveRecord<MainWireFlowStateValveStateV2>;
  nodeAbsolutePressuresMmHg: NodeRecord<number>;
  edgeFlowsMlPerSec: EdgeRecord<number>;
  valveEvaluations: ValveRecord<MainWireFlowStateValveEvaluationV2>;
  candidateMechanicsEvaluation: TEvaluation;
  diagnostics: NonCoronaryCirculationTrialDiagnosticsV1;
  mechanicsCommitted: false;
  reverseFlowCapOrClampOnNonvalveEdges: false;
  units: typeof NON_CORONARY_CIRCULATION_UNITS_V1;
}>;

export type NonCoronaryCirculationTrialFailureReasonV1 =
  | "invalid-input"
  | "initial-evaluation-failed"
  | "jacobian-failed"
  | "singular-jacobian"
  | "line-search-failed"
  | "maximum-iterations";

export type NonCoronaryCirculationTrialFailureV1 = Readonly<{
  converged: false;
  transactionId: typeof NON_CORONARY_CIRCULATION_BE_V1_ID;
  reason: NonCoronaryCirculationTrialFailureReasonV1;
  message: string;
  rollbackState: NonCoronaryCirculationAcceptedStateV1;
  lastAcceptedCandidateNodeVolumesMl: NodeRecord<number>;
  diagnostics: NonCoronaryCirculationTrialDiagnosticsV1;
  mechanicsCommitted: false;
  units: typeof NON_CORONARY_CIRCULATION_UNITS_V1;
}>;

export type NonCoronaryCirculationTrialResultV1<TEvaluation> =
  | NonCoronaryCirculationTrialSuccessV1<TEvaluation>
  | NonCoronaryCirculationTrialFailureV1;

type CandidateEvaluation<TEvaluation> = Readonly<{
  nodeVolumesMl: NodeRecord<number>;
  nodeAbsolutePressuresMmHg: NodeRecord<number>;
  edgeFlowsMlPerSec: EdgeRecord<number>;
  dynamicEdgeFlowsMlPerSec: DynamicEdgeRecord<number>;
  valveStates: ValveRecord<MainWireFlowStateValveStateV2>;
  valveEvaluations: ValveRecord<MainWireFlowStateValveEvaluationV2>;
  candidateMechanicsEvaluation: TEvaluation;
  continuityResidualMlByNode: NodeRecord<number>;
  scaledIndependentResidual: readonly number[];
}>;

type CandidateMechanicsCache<TEvaluation> = {
  readonly values: Map<
    string,
    NonCoronaryCandidateMechanicsResultV1<TEvaluation>
  >;
  callCount: number;
  hitCount: number;
};

const DEPENDENT_NODE: NonCoronaryNodeNameV1 = "SV";
const INDEPENDENT_NODE_NAMES = Object.freeze(
  NON_CORONARY_NODE_NAMES_V1.filter((name) => name !== DEPENDENT_NODE),
);
const DEFAULT_NEWTON_OPTIONS = Object.freeze({
  maxIterations: 30,
  scaledResidualInfinityTolerance: 2e-10,
  scaledUpdateInfinityTolerance: 2e-11,
  finiteDifferenceScaledStep: 2e-6,
  maximumLineSearchBacktracks: 24,
});

export function buildNonCoronaryCirculationGraphV1():
NonCoronaryCirculationGraphV1 {
  const sourceGraph = buildAuthoritativeCirculationGraphV1();
  const includedNodeNames = new Set<string>(NON_CORONARY_NODE_NAMES_V1);
  const nodes = Object.freeze(sourceGraph.nodes.filter((node) =>
    includedNodeNames.has(node.name)));
  const edges = Object.freeze(sourceGraph.edges.filter((edge) =>
    edge.group !== "coronary"));
  if (
    nodes.length !== NON_CORONARY_NODE_NAMES_V1.length
    || edges.length !== NON_CORONARY_EDGE_NAMES_V1.length
    || nodes.some((node, index) => node.name !== NON_CORONARY_NODE_NAMES_V1[index])
    || edges.some((edge, index) => edge.name !== NON_CORONARY_EDGE_NAMES_V1[index])
  ) throw new Error("authoritative non-coronary topology changed");
  for (const excluded of NON_CORONARY_CIRCULATION_SCOPE_V1.excludedCoronaryNodes) {
    if (nodes.some((node) => node.name === excluded)) {
      throw new Error(`coronary node ${excluded} entered the non-coronary graph`);
    }
  }
  for (const edge of edges) {
    if (!includedNodeNames.has(edge.up) || !includedNodeNames.has(edge.down)) {
      throw new Error(`non-coronary edge ${edge.name} left the included node set`);
    }
  }
  return Object.freeze({
    topologyId: NON_CORONARY_CIRCULATION_BE_V1_ID,
    nodes,
    edges,
    nodeIndex: uniqueIndex(nodes),
    edgeIndex: uniqueIndex(edges),
    scope: NON_CORONARY_CIRCULATION_SCOPE_V1,
  });
}

export function createInitialNonCoronaryCirculationStateV1(
  input: NonCoronaryCirculationInitialStateInputV1,
): NonCoronaryCirculationAcceptedStateV1 {
  requireNonnegative(input.timeSec, "timeSec");
  validateRuntime(input.runtime);
  const graph = buildNonCoronaryCirculationGraphV1();
  const nodeVolumesMl = input.nodeVolumesMl
    ? copyNodeRecord(input.nodeVolumesMl, "nodeVolumesMl", requirePositive)
    : initialNodeVolumes(graph, input.runtime);
  const dynamicEdgeFlowsMlPerSec = input.dynamicEdgeFlowsMlPerSec
    ? copyDynamicEdgeRecord(
      input.dynamicEdgeFlowsMlPerSec,
      "dynamicEdgeFlowsMlPerSec",
      requireFinite,
    )
    : dynamicEdgeRecord((name) => graph.edges[graph.edgeIndex.get(name)!].q0 ?? 0);
  const valveStates = input.valveStates
    ? copyValveStates(input.valveStates)
    : valveRecord((name) => {
      const edge = graph.edges[graph.edgeIndex.get(name)!];
      return initialMainWireFlowStateValveStateV2(edge.q0 ?? 0, edge.xi0 ?? 0);
    });
  return acceptedState({
    revision: 0,
    acceptedTimeSec: input.timeSec,
    nodeVolumesMl,
    dynamicEdgeFlowsMlPerSec,
    valveStates,
  });
}

export function evaluateNonCoronaryCirculationBackwardEulerTrialV1<TEvaluation>(
  input: NonCoronaryCirculationTrialInputV1<TEvaluation>,
): NonCoronaryCirculationTrialResultV1<TEvaluation> {
  // A malformed accepted state is a programmer/checkpoint error and cannot
  // provide a trustworthy rollback target.
  validateAcceptedState(input.previousAcceptedState);
  let graph: NonCoronaryCirculationGraphV1;
  let options: Required<NonCoronaryCirculationNewtonOptionsV1>;
  try {
    requirePositive(input.dtSec, "dtSec");
    validateRuntime(input.runtime);
    if (typeof input.evaluateCandidateMechanics !== "function") {
      throw new Error("evaluateCandidateMechanics must be a function");
    }
    graph = buildNonCoronaryCirculationGraphV1();
    options = resolveNewtonOptions(input.options);
  } catch (error) {
    return failure(
      input.previousAcceptedState,
      "invalid-input",
      errorMessage(error),
      input.previousAcceptedState.nodeVolumesMl,
      emptyDiagnostics(),
    );
  }
  const previous = input.previousAcceptedState;
  const candidateTimeSec = previous.acceptedTimeSec + input.dtSec;
  const mechanicsCache: CandidateMechanicsCache<TEvaluation> = {
    values: new Map(),
    callCount: 0,
    hitCount: 0,
  };
  const volumeScales = independentVolumeScales(previous.nodeVolumesMl);
  let scaledUnknowns = independentVolumesToScaled(
    previous.nodeVolumesMl,
    volumeScales,
  );
  let current: CandidateEvaluation<TEvaluation>;
  let acceptedLineSearchSteps = 0;
  let lineSearchBacktracks = 0;
  try {
    current = evaluateCandidate(
      graph,
      input,
      scaledUnknowns,
      volumeScales,
      candidateTimeSec,
      mechanicsCache,
    );
  } catch (error) {
    return failure(
      previous,
      "initial-evaluation-failed",
      errorMessage(error),
      previous.nodeVolumesMl,
      emptyDiagnostics(options.finiteDifferenceScaledStep, mechanicsCache),
    );
  }

  for (let iteration = 0; iteration <= options.maxIterations; iteration += 1) {
    const residualNorm = infinityNorm(current.scaledIndependentResidual);
    if (residualNorm <= options.scaledResidualInfinityTolerance) {
      return success(
        previous,
        input.dtSec,
        candidateTimeSec,
        current,
        trialDiagnostics(
          iteration,
          acceptedLineSearchSteps,
          lineSearchBacktracks,
          residualNorm,
          current,
          previous.totalBloodVolumeMl,
          options.finiteDifferenceScaledStep,
          mechanicsCache,
        ),
      );
    }
    if (iteration === options.maxIterations) {
      return failure(
        previous,
        "maximum-iterations",
        "non-coronary circulation Newton reached its iteration limit",
        current.nodeVolumesMl,
        trialDiagnostics(
          iteration,
          acceptedLineSearchSteps,
          lineSearchBacktracks,
          residualNorm,
          current,
          previous.totalBloodVolumeMl,
          options.finiteDifferenceScaledStep,
          mechanicsCache,
        ),
      );
    }
    let jacobian: number[][];
    try {
      jacobian = finiteDifferenceJacobian(
        (candidate) => evaluateCandidate(
          graph,
          input,
          candidate,
          volumeScales,
          candidateTimeSec,
          mechanicsCache,
        ).scaledIndependentResidual,
        scaledUnknowns,
        options.finiteDifferenceScaledStep,
      );
    } catch (error) {
      return failure(
        previous,
        "jacobian-failed",
        errorMessage(error),
        current.nodeVolumesMl,
        trialDiagnostics(
          iteration,
          acceptedLineSearchSteps,
          lineSearchBacktracks,
          residualNorm,
          current,
          previous.totalBloodVolumeMl,
          options.finiteDifferenceScaledStep,
          mechanicsCache,
        ),
      );
    }
    const update = solveDenseLinearSystem(
      jacobian,
      current.scaledIndependentResidual.map((value) => -value),
    );
    if (update === null) {
      return failure(
        previous,
        "singular-jacobian",
        "non-coronary circulation scaled Jacobian is singular",
        current.nodeVolumesMl,
        trialDiagnostics(
          iteration,
          acceptedLineSearchSteps,
          lineSearchBacktracks,
          residualNorm,
          current,
          previous.totalBloodVolumeMl,
          options.finiteDifferenceScaledStep,
          mechanicsCache,
        ),
      );
    }
    if (
      infinityNorm(update) <= options.scaledUpdateInfinityTolerance
      && residualNorm > options.scaledResidualInfinityTolerance
    ) {
      return failure(
        previous,
        "singular-jacobian",
        "non-coronary circulation Newton stagnated above tolerance",
        current.nodeVolumesMl,
        trialDiagnostics(
          iteration,
          acceptedLineSearchSteps,
          lineSearchBacktracks,
          residualNorm,
          current,
          previous.totalBloodVolumeMl,
          options.finiteDifferenceScaledStep,
          mechanicsCache,
        ),
      );
    }
    let accepted: Readonly<{
      scaledUnknowns: readonly number[];
      evaluation: CandidateEvaluation<TEvaluation>;
    }> | null = null;
    let stepLength = 1;
    for (
      let backtrack = 0;
      backtrack <= options.maximumLineSearchBacktracks;
      backtrack += 1
    ) {
      const candidateUnknowns = scaledUnknowns.map(
        (value, index) => value + stepLength * update[index]!,
      );
      try {
        const evaluation = evaluateCandidate(
          graph,
          input,
          candidateUnknowns,
          volumeScales,
          candidateTimeSec,
          mechanicsCache,
        );
        if (infinityNorm(evaluation.scaledIndependentResidual)
          <= (1 - 1e-4 * stepLength) * residualNorm) {
          accepted = Object.freeze({
            scaledUnknowns: Object.freeze(candidateUnknowns),
            evaluation,
          });
          break;
        }
      } catch {
        // Inadmissible volume or callback state follows the same backtracking path.
      }
      stepLength *= 0.5;
      lineSearchBacktracks += 1;
    }
    if (accepted === null) {
      return failure(
        previous,
        "line-search-failed",
        "non-coronary circulation Newton found no admissible residual-decreasing step",
        current.nodeVolumesMl,
        trialDiagnostics(
          iteration,
          acceptedLineSearchSteps,
          lineSearchBacktracks,
          residualNorm,
          current,
          previous.totalBloodVolumeMl,
          options.finiteDifferenceScaledStep,
          mechanicsCache,
        ),
      );
    }
    scaledUnknowns = accepted.scaledUnknowns;
    current = accepted.evaluation;
    acceptedLineSearchSteps += 1;
  }
  throw new Error("unreachable circulation Newton state");
}

/** Pure promotion of circulation state. Mechanics promotion remains external. */
export function commitNonCoronaryCirculationTrialV1<TEvaluation>(
  previous: NonCoronaryCirculationAcceptedStateV1,
  trial: NonCoronaryCirculationTrialSuccessV1<TEvaluation>,
): NonCoronaryCirculationAcceptedStateV1 {
  validateAcceptedState(previous);
  if (
    trial.transactionId !== NON_CORONARY_CIRCULATION_BE_V1_ID
    || trial.baseRevision !== previous.revision
    || !nearlyEqual(trial.baseAcceptedTimeSec, previous.acceptedTimeSec)
    || !nearlyEqual(trial.candidateTimeSec, previous.acceptedTimeSec + trial.dtSec)
  ) throw new Error("stale or foreign non-coronary circulation trial");
  const total = sumNodeRecord(trial.candidateNodeVolumesMl);
  if (!nearlyEqual(total, previous.totalBloodVolumeMl)) {
    throw new Error("candidate trial violates the accepted TBV constraint");
  }
  return acceptedState({
    revision: previous.revision + 1,
    acceptedTimeSec: trial.candidateTimeSec,
    nodeVolumesMl: trial.candidateNodeVolumesMl,
    dynamicEdgeFlowsMlPerSec: trial.candidateDynamicEdgeFlowsMlPerSec,
    valveStates: trial.candidateValveStates,
  });
}

function evaluateCandidate<TEvaluation>(
  graph: NonCoronaryCirculationGraphV1,
  input: NonCoronaryCirculationTrialInputV1<TEvaluation>,
  scaledIndependentVolumes: readonly number[],
  volumeScales: readonly number[],
  candidateTimeSec: number,
  mechanicsCache: CandidateMechanicsCache<TEvaluation>,
): CandidateEvaluation<TEvaluation> {
  const previous = input.previousAcceptedState;
  const nodeVolumesMl = scaledToNodeVolumes(
    scaledIndependentVolumes,
    volumeScales,
    previous.totalBloodVolumeMl,
  );
  const chamberVolumesMl = Object.freeze({
    LV: nodeVolumesMl.LV,
    LA: nodeVolumesMl.LA,
    RV: nodeVolumesMl.RV,
    RA: nodeVolumesMl.RA,
  });
  const mechanics = evaluateCandidateMechanicsCached(
    mechanicsCache,
    input.evaluateCandidateMechanics,
    chamberVolumesMl,
    candidateTimeSec,
  );
  const nodeAbsolutePressuresMmHg = nodeRecord((name) => {
    if (isChamberName(name)) return mechanics.absolutePressuresMmHg[name];
    const node = graph.nodes[graph.nodeIndex.get(name)!];
    const law = vascularPvLawFromNodeV1(node, input.runtime.vascular);
    const unstressedVolumeMl = effectiveUnstressedVolumeFromNodeV1(
      node,
      input.runtime.vascular,
    );
    const ptmMmHg = ptmFromStressedVolume(
      law,
      nodeVolumesMl[name] - unstressedVolumeMl,
    );
    const ext = respiratoryExternalPressureForKindV1(
      respiratoryKind(node.ext),
      candidateTimeSec,
      input.runtime.respiratory,
    );
    return requireFinite(ptmMmHg + ext, `${name} absolute pressure`);
  });
  const valveEvaluations = {} as Record<
    NonCoronaryValveNameV1,
    MainWireFlowStateValveEvaluationV2
  >;
  const flows = {} as Record<NonCoronaryEdgeNameV1, number>;
  const dynamicFlows = {} as Record<NonCoronaryDynamicEdgeNameV1, number>;
  for (const edge of graph.edges) {
    const name = edge.name as NonCoronaryEdgeNameV1;
    const upstreamPressure = nodeAbsolutePressuresMmHg[
      edge.up as NonCoronaryNodeNameV1
    ];
    const downstreamPressure = nodeAbsolutePressuresMmHg[
      edge.down as NonCoronaryNodeNameV1
    ];
    if (edge.kind === "valve") {
      const valveName = name as NonCoronaryValveNameV1;
      const evaluation = stepMainWireFlowStateValveV2(
        previous.valveStates[valveName],
        {
          dtSec: input.dtSec,
          upstreamPressureMmHg: upstreamPressure,
          downstreamPressureMmHg: downstreamPressure,
        },
        mainWireFlowStateValveParamsFromEdgeV2(edge),
      );
      if (!evaluation.valid || !evaluation.finite) {
        throw new Error(`${name} valve trial failed: ${evaluation.issues.join("; ")}`);
      }
      valveEvaluations[valveName] = evaluation;
      flows[name] = evaluation.state.qMlPerSec;
      continue;
    }
    const effectiveDownstreamPressure = downstreamEffectivePressureV1({
      edge,
      downstreamPressureMmHg: downstreamPressure,
      edgeExternalPressureMmHg: respiratoryExternalPressureForKindV1(
        respiratoryKind(edge.ext),
        candidateTimeSec,
        input.runtime.respiratory,
      ),
    });
    const gradientMmHg = upstreamPressure - effectiveDownstreamPressure;
    const losses = baseNonValveEdgeLossV1(edge, input.runtime.losses);
    if (edge.kind === "dynamic") {
      const dynamicName = name as NonCoronaryDynamicEdgeNameV1;
      const inertance = requirePositive(
        edge.L ?? 0,
        `${name} inertanceMmHgSec2PerMl`,
      );
      const flow = solveSignedLinearQuadraticFlowV1(
        gradientMmHg + inertance
          * previous.dynamicEdgeFlowsMlPerSec[dynamicName] / input.dtSec,
        losses.resistanceMmHgSecPerMl + inertance / input.dtSec,
        losses.quadraticLossMmHgSec2PerMl2,
      );
      dynamicFlows[dynamicName] = flow;
      flows[name] = flow;
    } else {
      flows[name] = solveSignedLinearQuadraticFlowV1(
        gradientMmHg,
        losses.resistanceMmHgSecPerMl,
        losses.quadraticLossMmHgSec2PerMl2,
      );
    }
  }
  const edgeFlowsMlPerSec = copyEdgeRecord(
    flows as EdgeRecord<number>,
    "edgeFlowsMlPerSec",
    requireFinite,
  );
  const localFlows = Float64Array.from(graph.edges, (edge) =>
    edgeFlowsMlPerSec[edge.name as NonCoronaryEdgeNameV1]);
  const localRates = incidenceVolumeRatesFromEdgeFlowsV1(graph, localFlows);
  const continuityResidualMlByNode = nodeRecord((name) => {
    const localIndex = graph.nodeIndex.get(name)!;
    return nodeVolumesMl[name] - previous.nodeVolumesMl[name]
      - input.dtSec * localRates[localIndex]!;
  });
  const scaledIndependentResidual = Object.freeze(
    INDEPENDENT_NODE_NAMES.map((name, index) =>
      continuityResidualMlByNode[name] / volumeScales[index]!),
  );
  return Object.freeze({
    nodeVolumesMl,
    nodeAbsolutePressuresMmHg,
    edgeFlowsMlPerSec,
    dynamicEdgeFlowsMlPerSec: copyDynamicEdgeRecord(
      dynamicFlows as DynamicEdgeRecord<number>,
      "dynamicEdgeFlowsMlPerSec",
      requireFinite,
    ),
    valveStates: valveRecord((name) => valveEvaluations[name].state),
    valveEvaluations: Object.freeze({ ...valveEvaluations }) as ValveRecord<
      MainWireFlowStateValveEvaluationV2
    >,
    candidateMechanicsEvaluation: mechanics.evaluation,
    continuityResidualMlByNode,
    scaledIndependentResidual,
  });
}

/** Exact signed solution of R q + B q |q| = pressure drive. */
export function solveSignedLinearQuadraticFlowV1(
  pressureDriveMmHg: number,
  linearCoefficientMmHgSecPerMl: number,
  quadraticCoefficientMmHgSec2PerMl2: number,
): number {
  requireFinite(pressureDriveMmHg, "pressureDriveMmHg");
  requirePositive(
    linearCoefficientMmHgSecPerMl,
    "linearCoefficientMmHgSecPerMl",
  );
  requireNonnegative(
    quadraticCoefficientMmHgSec2PerMl2,
    "quadraticCoefficientMmHgSec2PerMl2",
  );
  if (pressureDriveMmHg === 0) return 0;
  if (quadraticCoefficientMmHgSec2PerMl2 === 0) {
    return pressureDriveMmHg / linearCoefficientMmHgSecPerMl;
  }
  const magnitudeDrive = Math.abs(pressureDriveMmHg);
  const discriminant = Math.sqrt(
    linearCoefficientMmHgSecPerMl ** 2
      + 4 * quadraticCoefficientMmHgSec2PerMl2 * magnitudeDrive,
  );
  const magnitudeFlow = 2 * magnitudeDrive
    / (linearCoefficientMmHgSecPerMl + discriminant);
  return Math.sign(pressureDriveMmHg) * magnitudeFlow;
}

function initialNodeVolumes(
  graph: NonCoronaryCirculationGraphV1,
  runtime: NonCoronaryCirculationRuntimeParamsV1,
): NodeRecord<number> {
  return nodeRecord((name) => {
    const node = graph.nodes[graph.nodeIndex.get(name)!];
    if (isChamberName(name)) return requirePositive(node.x0, `${name}.x0`);
    const law = vascularPvLawFromNodeV1(node, runtime.vascular);
    const unstressed = effectiveUnstressedVolumeFromNodeV1(node, runtime.vascular);
    const volume = node.kind === "venousPressure"
      ? unstressed + stressedVolumeFromPtm(law, node.x0)
      : node.x0;
    return requirePositive(volume, `${name} initial volume`);
  });
}

function success<TEvaluation>(
  previous: NonCoronaryCirculationAcceptedStateV1,
  dtSec: number,
  candidateTimeSec: number,
  evaluation: CandidateEvaluation<TEvaluation>,
  diagnostics: NonCoronaryCirculationTrialDiagnosticsV1,
): NonCoronaryCirculationTrialSuccessV1<TEvaluation> {
  return Object.freeze({
    converged: true as const,
    transactionId: NON_CORONARY_CIRCULATION_BE_V1_ID,
    baseRevision: previous.revision,
    baseAcceptedTimeSec: previous.acceptedTimeSec,
    candidateTimeSec,
    dtSec,
    candidateNodeVolumesMl: evaluation.nodeVolumesMl,
    candidateDynamicEdgeFlowsMlPerSec: evaluation.dynamicEdgeFlowsMlPerSec,
    candidateValveStates: evaluation.valveStates,
    nodeAbsolutePressuresMmHg: evaluation.nodeAbsolutePressuresMmHg,
    edgeFlowsMlPerSec: evaluation.edgeFlowsMlPerSec,
    valveEvaluations: evaluation.valveEvaluations,
    candidateMechanicsEvaluation: evaluation.candidateMechanicsEvaluation,
    diagnostics,
    mechanicsCommitted: false as const,
    reverseFlowCapOrClampOnNonvalveEdges: false as const,
    units: NON_CORONARY_CIRCULATION_UNITS_V1,
  });
}

function failure(
  previous: NonCoronaryCirculationAcceptedStateV1,
  reason: NonCoronaryCirculationTrialFailureReasonV1,
  message: string,
  lastVolumes: NodeRecord<number>,
  diagnostics: NonCoronaryCirculationTrialDiagnosticsV1,
): NonCoronaryCirculationTrialFailureV1 {
  return Object.freeze({
    converged: false as const,
    transactionId: NON_CORONARY_CIRCULATION_BE_V1_ID,
    reason,
    message,
    rollbackState: cloneAcceptedState(previous),
    lastAcceptedCandidateNodeVolumesMl: copyNodeRecord(
      lastVolumes,
      "lastAcceptedCandidateNodeVolumesMl",
      requireFinite,
    ),
    diagnostics,
    mechanicsCommitted: false as const,
    units: NON_CORONARY_CIRCULATION_UNITS_V1,
  });
}

function acceptedState(input: Readonly<{
  revision: number;
  acceptedTimeSec: number;
  nodeVolumesMl: NodeRecord<number>;
  dynamicEdgeFlowsMlPerSec: DynamicEdgeRecord<number>;
  valveStates: ValveRecord<MainWireFlowStateValveStateV2>;
}>): NonCoronaryCirculationAcceptedStateV1 {
  requireInteger(input.revision, "revision");
  requireNonnegative(input.acceptedTimeSec, "acceptedTimeSec");
  const nodeVolumesMl = copyNodeRecord(
    input.nodeVolumesMl,
    "nodeVolumesMl",
    requirePositive,
  );
  return Object.freeze({
    transactionId: NON_CORONARY_CIRCULATION_BE_V1_ID,
    revision: input.revision,
    acceptedTimeSec: input.acceptedTimeSec,
    totalBloodVolumeMl: sumNodeRecord(nodeVolumesMl),
    nodeVolumesMl,
    dynamicEdgeFlowsMlPerSec: copyDynamicEdgeRecord(
      input.dynamicEdgeFlowsMlPerSec,
      "dynamicEdgeFlowsMlPerSec",
      requireFinite,
    ),
    valveStates: copyValveStates(input.valveStates),
  });
}

function cloneAcceptedState(
  state: NonCoronaryCirculationAcceptedStateV1,
): NonCoronaryCirculationAcceptedStateV1 {
  return acceptedState({
    revision: state.revision,
    acceptedTimeSec: state.acceptedTimeSec,
    nodeVolumesMl: state.nodeVolumesMl,
    dynamicEdgeFlowsMlPerSec: state.dynamicEdgeFlowsMlPerSec,
    valveStates: state.valveStates,
  });
}

function validateAcceptedState(
  state: NonCoronaryCirculationAcceptedStateV1,
): void {
  if (state.transactionId !== NON_CORONARY_CIRCULATION_BE_V1_ID) {
    throw new Error("accepted circulation transaction identity mismatch");
  }
  requireInteger(state.revision, "accepted revision");
  requireNonnegative(state.acceptedTimeSec, "acceptedTimeSec");
  copyNodeRecord(state.nodeVolumesMl, "accepted nodeVolumesMl", requirePositive);
  copyDynamicEdgeRecord(
    state.dynamicEdgeFlowsMlPerSec,
    "accepted dynamicEdgeFlowsMlPerSec",
    requireFinite,
  );
  copyValveStates(state.valveStates);
  if (!nearlyEqual(sumNodeRecord(state.nodeVolumesMl), state.totalBloodVolumeMl)) {
    throw new Error("accepted circulation state TBV identity is stale");
  }
}

function scaledToNodeVolumes(
  scaledIndependentVolumes: readonly number[],
  scales: readonly number[],
  totalBloodVolumeMl: number,
): NodeRecord<number> {
  if (
    scaledIndependentVolumes.length !== INDEPENDENT_NODE_NAMES.length
    || scales.length !== INDEPENDENT_NODE_NAMES.length
  ) throw new Error("circulation independent-volume vector has wrong length");
  const values = {} as Record<NonCoronaryNodeNameV1, number>;
  let independentSum = 0;
  for (let index = 0; index < INDEPENDENT_NODE_NAMES.length; index += 1) {
    const value = requirePositive(
      scaledIndependentVolumes[index]! * scales[index]!,
      `${INDEPENDENT_NODE_NAMES[index]} candidate volume`,
    );
    values[INDEPENDENT_NODE_NAMES[index]!] = value;
    independentSum += value;
  }
  values[DEPENDENT_NODE] = requirePositive(
    totalBloodVolumeMl - independentSum,
    `${DEPENDENT_NODE} dependent candidate volume`,
  );
  return copyNodeRecord(
    values as NodeRecord<number>,
    "candidate nodeVolumesMl",
    requirePositive,
  );
}

function independentVolumesToScaled(
  volumes: NodeRecord<number>,
  scales: readonly number[],
): readonly number[] {
  return Object.freeze(INDEPENDENT_NODE_NAMES.map((name, index) =>
    volumes[name] / scales[index]!));
}

function independentVolumeScales(
  volumes: NodeRecord<number>,
): readonly number[] {
  return Object.freeze(INDEPENDENT_NODE_NAMES.map((name) =>
    Math.max(10, Math.abs(volumes[name]))));
}

function finiteDifferenceJacobian(
  evaluate: (unknowns: readonly number[]) => readonly number[],
  center: readonly number[],
  requestedStep: number,
): number[][] {
  const centerValue = evaluate(center);
  const size = center.length;
  if (centerValue.length !== size) throw new Error("residual is not square");
  const jacobian = Array.from({ length: size }, () => Array(size).fill(0));
  for (let column = 0; column < size; column += 1) {
    let step = requestedStep;
    let derivative: readonly number[] | null = null;
    let lastLowerIssue = "not-evaluated";
    let lastUpperIssue = "not-evaluated";
    for (let attempt = 0; attempt < 8 && derivative === null; attempt += 1) {
      const lower = [...center];
      const upper = [...center];
      lower[column] -= step;
      upper[column] += step;
      const lowerAttempt = tryEvaluateVector(evaluate, lower);
      const upperAttempt = tryEvaluateVector(evaluate, upper);
      lastLowerIssue = lowerAttempt.issue;
      lastUpperIssue = upperAttempt.issue;
      if (lowerAttempt.value && upperAttempt.value) {
        derivative = upperAttempt.value.map((value, row) =>
          (value - lowerAttempt.value![row]!) / (2 * step));
      } else if (upperAttempt.value) {
        derivative = upperAttempt.value.map((value, row) =>
          (value - centerValue[row]!) / step);
      } else if (lowerAttempt.value) {
        derivative = lowerAttempt.value.map((_value, row) =>
          (centerValue[row]! - lowerAttempt.value![row]!) / step);
      }
      step *= 0.5;
    }
    if (derivative === null || derivative.some((value) => !Number.isFinite(value))) {
      throw new Error(
        `failed to differentiate circulation volume ${column} `
        + `(${INDEPENDENT_NODE_NAMES[column]}): lower=${lastLowerIssue}; `
        + `upper=${lastUpperIssue}`,
      );
    }
    for (let row = 0; row < size; row += 1) {
      jacobian[row]![column] = derivative[row]!;
    }
  }
  return jacobian;
}

function solveDenseLinearSystem(
  sourceMatrix: readonly (readonly number[])[],
  sourceRight: readonly number[],
): readonly number[] | null {
  const size = sourceRight.length;
  if (sourceMatrix.length !== size
    || sourceMatrix.some((row) => row.length !== size)) return null;
  const matrix = sourceMatrix.map((row) => [...row]);
  const right = [...sourceRight];
  for (let pivot = 0; pivot < size; pivot += 1) {
    let best = pivot;
    for (let row = pivot + 1; row < size; row += 1) {
      if (Math.abs(matrix[row]![pivot]!) > Math.abs(matrix[best]![pivot]!)) best = row;
    }
    const pivotValue = matrix[best]![pivot]!;
    const rowScale = Math.max(...matrix[best]!.map(Math.abs), Number.MIN_VALUE);
    if (!Number.isFinite(pivotValue) || Math.abs(pivotValue) <= 1e-13 * rowScale) {
      return null;
    }
    [matrix[pivot], matrix[best]] = [matrix[best]!, matrix[pivot]!];
    [right[pivot], right[best]] = [right[best]!, right[pivot]!];
    for (let row = pivot + 1; row < size; row += 1) {
      const factor = matrix[row]![pivot]! / matrix[pivot]![pivot]!;
      matrix[row]![pivot] = 0;
      for (let column = pivot + 1; column < size; column += 1) {
        matrix[row]![column] -= factor * matrix[pivot]![column]!;
      }
      right[row] -= factor * right[pivot]!;
    }
  }
  const solution = Array(size).fill(0) as number[];
  for (let row = size - 1; row >= 0; row -= 1) {
    let value = right[row]!;
    for (let column = row + 1; column < size; column += 1) {
      value -= matrix[row]![column]! * solution[column]!;
    }
    solution[row] = value / matrix[row]![row]!;
  }
  return solution.every(Number.isFinite) ? Object.freeze(solution) : null;
}

function trialDiagnostics<TEvaluation>(
  iterations: number,
  acceptedLineSearchSteps: number,
  lineSearchBacktracks: number,
  residualNorm: number,
  evaluation: CandidateEvaluation<TEvaluation>,
  expectedTbv: number,
  finiteDifferenceScaledStep: number,
  mechanicsCache: CandidateMechanicsCache<TEvaluation>,
): NonCoronaryCirculationTrialDiagnosticsV1 {
  return Object.freeze({
    iterations,
    acceptedLineSearchSteps,
    lineSearchBacktracks,
    finalScaledResidualInfinityNorm: residualNorm,
    finalMaximumContinuityResidualMl: Math.max(
      ...NON_CORONARY_NODE_NAMES_V1.map((name) =>
        Math.abs(evaluation.continuityResidualMlByNode[name])),
    ),
    dependentNodeContinuityResidualMl:
      evaluation.continuityResidualMlByNode[DEPENDENT_NODE],
    totalBloodVolumeErrorMl:
      sumNodeRecord(evaluation.nodeVolumesMl) - expectedTbv,
    finiteDifferenceScaledStep,
    mechanicsCallbackCallCount: mechanicsCache.callCount,
    mechanicsCallbackCacheHitCount: mechanicsCache.hitCount,
    mechanicsCallbackUniqueCandidateCount: mechanicsCache.values.size,
  });
}

function emptyDiagnostics<TEvaluation>(
  finiteDifferenceScaledStep = Number.NaN,
  mechanicsCache?: CandidateMechanicsCache<TEvaluation>,
): NonCoronaryCirculationTrialDiagnosticsV1 {
  return Object.freeze({
    iterations: 0,
    acceptedLineSearchSteps: 0,
    lineSearchBacktracks: 0,
    finalScaledResidualInfinityNorm: Number.POSITIVE_INFINITY,
    finalMaximumContinuityResidualMl: Number.POSITIVE_INFINITY,
    dependentNodeContinuityResidualMl: Number.NaN,
    totalBloodVolumeErrorMl: Number.NaN,
    finiteDifferenceScaledStep,
    mechanicsCallbackCallCount: mechanicsCache?.callCount ?? 0,
    mechanicsCallbackCacheHitCount: mechanicsCache?.hitCount ?? 0,
    mechanicsCallbackUniqueCandidateCount: mechanicsCache?.values.size ?? 0,
  });
}

function resolveNewtonOptions(
  options: NonCoronaryCirculationNewtonOptionsV1 | undefined,
): Required<NonCoronaryCirculationNewtonOptionsV1> {
  const resolved = { ...DEFAULT_NEWTON_OPTIONS, ...options };
  requireInteger(resolved.maxIterations, "maxIterations");
  requireInteger(
    resolved.maximumLineSearchBacktracks,
    "maximumLineSearchBacktracks",
  );
  if (resolved.maxIterations <= 0 || resolved.maximumLineSearchBacktracks <= 0) {
    throw new Error("Newton iteration limits must be positive");
  }
  requirePositive(
    resolved.scaledResidualInfinityTolerance,
    "scaledResidualInfinityTolerance",
  );
  requirePositive(
    resolved.scaledUpdateInfinityTolerance,
    "scaledUpdateInfinityTolerance",
  );
  requirePositive(resolved.finiteDifferenceScaledStep, "finiteDifferenceScaledStep");
  return Object.freeze(resolved);
}

function validateRuntime(runtime: NonCoronaryCirculationRuntimeParamsV1): void {
  requireFinite(runtime.vascular.venousTone, "venousTone");
  requirePositive(runtime.vascular.arterialStiffness, "arterialStiffness");
  requirePositive(runtime.losses.systemicResistance, "systemicResistance");
  requirePositive(runtime.losses.pulmonaryResistance, "pulmonaryResistance");
  requireFinite(runtime.respiratory.PEEP, "PEEP");
  requireFinite(runtime.respiratory.Pth0, "Pth0");
  requireFinite(runtime.respiratory.respAmpTh, "respAmpTh");
  requireFinite(runtime.respiratory.respAmpAlv, "respAmpAlv");
  requireNonnegative(runtime.respiratory.respRate, "respRate");
}

function validateChamberPressures(
  pressures: NonCoronaryChamberPressuresMmHgV1,
): void {
  if (pressures === null || typeof pressures !== "object") {
    throw new Error("mechanics callback must return chamber pressures");
  }
  for (const name of ["LV", "LA", "RV", "RA"] as const) {
    requireFinite(pressures[name], `${name} chamber pressure`);
  }
}

function evaluateCandidateMechanicsCached<TEvaluation>(
  cache: CandidateMechanicsCache<TEvaluation>,
  callback: NonCoronaryCandidateMechanicsCallbackV1<TEvaluation>,
  volumes: NonCoronaryChamberVolumesMlV1,
  candidateTimeSec: number,
): NonCoronaryCandidateMechanicsResultV1<TEvaluation> {
  const key = JSON.stringify([
    candidateTimeSec,
    volumes.LV,
    volumes.LA,
    volumes.RV,
    volumes.RA,
  ]);
  const cached = cache.values.get(key);
  if (cached !== undefined) {
    cache.hitCount += 1;
    return cached;
  }
  cache.callCount += 1;
  const raw = callback(Object.freeze({ ...volumes }), candidateTimeSec);
  validateChamberPressures(raw.absolutePressuresMmHg);
  const result = Object.freeze({
    absolutePressuresMmHg: Object.freeze({ ...raw.absolutePressuresMmHg }),
    evaluation: raw.evaluation,
  });
  cache.values.set(key, result);
  return result;
}

function copyNodeRecord(
  source: NodeRecord<number>,
  label: string,
  validate: (value: number, field: string) => number,
): NodeRecord<number> {
  assertExactKeys(source, NON_CORONARY_NODE_NAMES_V1, label);
  return nodeRecord((name) => validate(source[name], `${label}.${name}`));
}

function copyEdgeRecord(
  source: EdgeRecord<number>,
  label: string,
  validate: (value: number, field: string) => number,
): EdgeRecord<number> {
  assertExactKeys(source, NON_CORONARY_EDGE_NAMES_V1, label);
  return edgeRecord((name) => validate(source[name], `${label}.${name}`));
}

function copyDynamicEdgeRecord(
  source: DynamicEdgeRecord<number>,
  label: string,
  validate: (value: number, field: string) => number,
): DynamicEdgeRecord<number> {
  assertExactKeys(source, NON_CORONARY_DYNAMIC_EDGE_NAMES_V1, label);
  return dynamicEdgeRecord((name) => validate(source[name], `${label}.${name}`));
}

function copyValveStates(
  source: ValveRecord<MainWireFlowStateValveStateV2>,
): ValveRecord<MainWireFlowStateValveStateV2> {
  assertExactKeys(source, NON_CORONARY_VALVE_NAMES_V1, "valveStates");
  return valveRecord((name) => {
    const state = source[name];
    requireFinite(state.qMlPerSec, `${name}.qMlPerSec`);
    if (!Number.isFinite(state.openingFraction01)
      || state.openingFraction01 < 0
      || state.openingFraction01 > 1) {
      throw new Error(`${name}.openingFraction01 must lie in [0,1]`);
    }
    return Object.freeze({ ...state });
  });
}

function assertExactKeys<T extends string>(
  value: object,
  names: readonly T[],
  label: string,
): void {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be a record`);
  }
  const actual = Object.keys(value).sort();
  const expected = [...names].sort();
  if (actual.length !== expected.length
    || actual.some((key, index) => key !== expected[index])) {
    throw new Error(`${label} must contain exactly the authoritative scoped keys`);
  }
}

function nodeRecord<T>(build: (name: NonCoronaryNodeNameV1) => T): NodeRecord<T> {
  return Object.freeze(Object.fromEntries(
    NON_CORONARY_NODE_NAMES_V1.map((name) => [name, build(name)]),
  )) as NodeRecord<T>;
}

function edgeRecord<T>(build: (name: NonCoronaryEdgeNameV1) => T): EdgeRecord<T> {
  return Object.freeze(Object.fromEntries(
    NON_CORONARY_EDGE_NAMES_V1.map((name) => [name, build(name)]),
  )) as EdgeRecord<T>;
}

function dynamicEdgeRecord<T>(
  build: (name: NonCoronaryDynamicEdgeNameV1) => T,
): DynamicEdgeRecord<T> {
  return Object.freeze(Object.fromEntries(
    NON_CORONARY_DYNAMIC_EDGE_NAMES_V1.map((name) => [name, build(name)]),
  )) as DynamicEdgeRecord<T>;
}

function valveRecord<T>(
  build: (name: NonCoronaryValveNameV1) => T,
): ValveRecord<T> {
  return Object.freeze(Object.fromEntries(
    NON_CORONARY_VALVE_NAMES_V1.map((name) => [name, build(name)]),
  )) as ValveRecord<T>;
}

function uniqueIndex(values: readonly { readonly name: string }[]): Map<string, number> {
  const result = new Map<string, number>();
  values.forEach((value, index) => {
    if (result.has(value.name)) throw new Error(`duplicate topology name ${value.name}`);
    result.set(value.name, index);
  });
  return result;
}

function sumNodeRecord(values: NodeRecord<number>): number {
  return NON_CORONARY_NODE_NAMES_V1.reduce((sum, name) => sum + values[name], 0);
}

function isChamberName(
  name: NonCoronaryNodeNameV1,
): name is keyof NonCoronaryChamberVolumesMlV1 {
  return name === "LV" || name === "LA" || name === "RV" || name === "RA";
}

function respiratoryKind(ext: NodeSpec["ext"] | EdgeSpec["ext"]):
"none" | "pth" | "palv" {
  if (ext === undefined || ext === "none") return "none";
  if (ext === "pth" || ext === "palv") return ext;
  throw new Error(`coronary external-pressure kind ${ext} is outside scope`);
}

function tryEvaluateVector(
  evaluate: (unknowns: readonly number[]) => readonly number[],
  unknowns: readonly number[],
): Readonly<{ value: readonly number[] | null; issue: string }> {
  try {
    const value = evaluate(unknowns);
    return value.every(Number.isFinite)
      ? Object.freeze({ value, issue: "none" })
      : Object.freeze({ value: null, issue: "non-finite-residual" });
  } catch (error) {
    return Object.freeze({ value: null, issue: errorMessage(error) });
  }
}

function infinityNorm(values: readonly number[]): number {
  return values.reduce((maximum, value) => Math.max(maximum, Math.abs(value)), 0);
}

function nearlyEqual(left: number, right: number): boolean {
  return Math.abs(left - right) <= 1e-10 * Math.max(1, Math.abs(left), Math.abs(right));
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function requireFinite(value: number, label: string): number {
  if (!Number.isFinite(value)) throw new Error(`${label} must be finite`);
  return value;
}

function requirePositive(value: number, label: string): number {
  if (!Number.isFinite(value) || !(value > 0)) {
    throw new Error(`${label} must be positive and finite`);
  }
  return value;
}

function requireNonnegative(value: number, label: string): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${label} must be nonnegative and finite`);
  }
  return value;
}

function requireInteger(value: number, label: string): number {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${label} must be a nonnegative integer`);
  }
  return value;
}
