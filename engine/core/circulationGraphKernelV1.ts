import { smoothMax } from "@/engine/math";
import {
  buildEdges,
  buildNodes,
  type EdgeSpec,
  type NodeSpec,
} from "@/engine/core/topology";
import type { VascularPvLaw } from "@/engine/vascularPv";

/**
 * Explicit Phase-1 boundary: this kernel owns the shipped graph topology,
 * vascular PV laws, respiratory external pressure, base non-coronary losses,
 * and incidence continuity. Coronary compression/stenosis and collapsible-tube
 * chi multipliers remain ModelCore-owned until they are extracted with their
 * activation inputs.
 */
export const CIRCULATION_GRAPH_KERNEL_V1_BOUNDARY = {
  topology: "buildNodes/buildEdges",
  edgeLosses: "base-nonvalve-noncoronary",
  excluded: ["coronary-compression", "coronary-stenosis", "collapsible-tube-chi"] as const,
} as const;

export type AuthoritativeCirculationGraphV1 = {
  readonly nodes: readonly NodeSpec[];
  readonly edges: readonly EdgeSpec[];
  readonly nodeIndex: ReadonlyMap<string, number>;
  readonly edgeIndex: ReadonlyMap<string, number>;
};

export function buildAuthoritativeCirculationGraphV1(): AuthoritativeCirculationGraphV1 {
  const nodes = buildNodes();
  const edges = buildEdges();
  const nodeIndex = uniqueNameIndex(nodes, "node");
  const edgeIndex = uniqueNameIndex(edges, "edge");

  for (const edge of edges) {
    if (!nodeIndex.has(edge.up) || !nodeIndex.has(edge.down)) {
      throw new Error(`Edge ${edge.name} references a node outside the authoritative graph`);
    }
  }
  return { nodes, edges, nodeIndex, edgeIndex };
}

export type VascularPvRuntimeParameterViewV1 = {
  readonly venousTone: number;
  readonly arterialStiffness: number;
};

export function effectiveUnstressedVolumeFromNodeV1(
  node: NodeSpec,
  params: Pick<VascularPvRuntimeParameterViewV1, "venousTone">,
): number {
  return (node.Vu ?? 0) - (node.venousToneGain ?? 0) * params.venousTone;
}

export function vascularPvLawFromNodeV1(
  node: NodeSpec,
  params: VascularPvRuntimeParameterViewV1,
): VascularPvLaw {
  const Vu = effectiveUnstressedVolumeFromNodeV1(node, params);
  if (node.kind === "arterial") {
    return {
      kind: "arterial",
      Vu,
      P0: node.P0 ?? 50,
      VsEff: Math.max((node.Vs ?? 100) / Math.max(params.arterialStiffness, 0.25), 1),
    };
  }
  if (node.kind === "linear") {
    return {
      kind: "linear",
      Vu,
      C: Math.max(node.C ?? 1, 1e-6),
    };
  }
  if (node.kind === "venousPressure") {
    return {
      kind: "venous3",
      Vu,
      Ccoll: node.Ccoll ?? 5,
      Copen: node.Copen ?? 50,
      Cdist: node.Cdist ?? 15,
      Popen: node.Popen ?? -1,
      Pstiff: node.Pstiff ?? 14,
      dOpen: Math.max(node.dOpen ?? 1, 1e-6),
      dStiff: Math.max(node.dStiff ?? 3, 1e-6),
    };
  }
  throw new Error(`Node ${node.name} has no vascular PV law`);
}

export type RespiratoryPressureParameterViewV1 = {
  readonly PEEP: number;
  readonly Pth0: number;
  readonly respAmpTh: number;
  readonly respAmpAlv: number;
  readonly respRate: number;
};

export type RespiratoryExternalPressuresV1 = {
  readonly pthMmHg: number;
  readonly palvMmHg: number;
};

export function respiratoryExternalPressuresV1(
  timeSec: number,
  params: RespiratoryPressureParameterViewV1,
): RespiratoryExternalPressuresV1 {
  const respiratorySignal = Math.sin(2 * Math.PI * params.respRate * timeSec);
  return {
    pthMmHg: params.Pth0 + 0.20 * params.PEEP + params.respAmpTh * respiratorySignal,
    palvMmHg: params.PEEP + params.respAmpAlv * respiratorySignal,
  };
}

export function respiratoryExternalPressureForKindV1(
  kind: "none" | "pth" | "palv",
  timeSec: number,
  params: RespiratoryPressureParameterViewV1,
): number {
  if (kind === "none") return 0;
  const pressures = respiratoryExternalPressuresV1(timeSec, params);
  return kind === "pth" ? pressures.pthMmHg : pressures.palvMmHg;
}

export type DownstreamWaterfallInputV1 = {
  readonly edge: Pick<EdgeSpec, "waterfall" | "Pcrit">;
  readonly downstreamPressureMmHg: number;
  readonly edgeExternalPressureMmHg: number;
  readonly smoothingMmHg?: number;
};

export function downstreamEffectivePressureV1(input: DownstreamWaterfallInputV1): number {
  if (!input.edge.waterfall) return input.downstreamPressureMmHg;
  const collapsePressureMmHg = input.edgeExternalPressureMmHg + (input.edge.Pcrit ?? 0);
  return smoothMax(
    input.downstreamPressureMmHg,
    collapsePressureMmHg,
    input.smoothingMmHg ?? 0.25,
  );
}

export type BaseEdgeLossRuntimeParameterViewV1 = {
  readonly systemicResistance: number;
  readonly pulmonaryResistance: number;
};

export type BaseNonValveEdgeLossV1 = {
  readonly resistanceMmHgSecPerMl: number;
  readonly quadraticLossMmHgSec2PerMl2: number;
  readonly collapsibleTubeCorrectionExcluded: boolean;
};

/**
 * Resolve the same base R/B scaling used by ModelCore for non-valve edges.
 *
 * Valve R/B/A/L has exactly one owner: MainWireFlowStateValveV2. This function
 * therefore rejects valves as well as coronary edges, and reports (but does
 * not apply) collapsible-tube chi scaling. Those mechanisms require additional
 * pressure and myocardial-activation inputs and are outside the Phase-1 kernel.
 */
export function baseNonValveEdgeLossV1(
  edge: EdgeSpec,
  params: BaseEdgeLossRuntimeParameterViewV1,
): BaseNonValveEdgeLossV1 {
  if (edge.kind === "valve" || edge.group === "coronary") {
    throw new Error(`Edge ${edge.name} is outside the base non-valve loss boundary`);
  }

  let resistance = edge.R;
  let quadraticLoss = edge.B ?? 0;
  if (edge.group === "systemic") resistance *= params.systemicResistance;
  if (edge.group === "pulmonary") resistance *= params.pulmonaryResistance;

  return {
    resistanceMmHgSecPerMl: Math.max(resistance, 1e-8),
    quadraticLossMmHgSec2PerMl2: Math.max(quadraticLoss, 0),
    collapsibleTubeCorrectionExcluded: Boolean(edge.useChiResistance || edge.useChiQuadratic),
  };
}

/**
 * Apply the directed graph incidence operator to edge flows. Positive flow is
 * from edge.up to edge.down; the returned vector follows graph.nodes order.
 */
export function incidenceVolumeRatesFromEdgeFlowsV1(
  graph: AuthoritativeCirculationGraphV1,
  edgeFlowsMlPerSec: ArrayLike<number>,
): Float64Array {
  if (edgeFlowsMlPerSec.length !== graph.edges.length) {
    throw new RangeError(
      `Expected ${graph.edges.length} edge flows, received ${edgeFlowsMlPerSec.length}`,
    );
  }
  const rates = new Float64Array(graph.nodes.length);
  for (let edgeIndex = 0; edgeIndex < graph.edges.length; edgeIndex++) {
    const edge = graph.edges[edgeIndex]!;
    const flow = edgeFlowsMlPerSec[edgeIndex]!;
    if (!Number.isFinite(flow)) throw new RangeError(`Edge flow ${edge.name} must be finite`);
    rates[graph.nodeIndex.get(edge.up)!] -= flow;
    rates[graph.nodeIndex.get(edge.down)!] += flow;
  }
  return rates;
}

function uniqueNameIndex<T extends { readonly name: string }>(
  values: readonly T[],
  kind: "node" | "edge",
): Map<string, number> {
  const index = new Map<string, number>();
  for (let i = 0; i < values.length; i++) {
    const name = values[i]!.name;
    if (index.has(name)) throw new Error(`Duplicate ${kind} name ${name}`);
    index.set(name, i);
  }
  return index;
}
