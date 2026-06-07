import type { Chamber } from "@/engine/chambers";
import { simpleStableHash, type ModelStateLayout } from "@/engine/stateContract";
import {
  activeChambersFromNodes,
  buildNodes,
  dynamicEdgeNames,
  nodeNames,
  valveNames,
  type DynamicEdgeName,
  type NodeName,
  type ValveName,
} from "@/engine/core/topology";

export type StateIndex = {
  node: Record<NodeName, number>;
  q: Record<DynamicEdgeName, number>;
  xi: Record<ValveName, number>;
  phi: number;
  septumShift: number;
  activeInternal: Partial<Record<Chamber, { c: number; a: number; r: number; tensionPa: number }>>;
  size: number;
};

export function makeIndex(): StateIndex {
  let i = 0;
  const node = {} as Record<NodeName, number>;
  for (const n of nodeNames) node[n] = i++;
  const q = {} as Record<DynamicEdgeName, number>;
  for (const e of dynamicEdgeNames) q[e] = i++;
  const xi = {} as Record<ValveName, number>;
  for (const v of valveNames) xi[v] = i++;
  const phi = i++;
  const septumShift = i++;
  const activeInternal: Partial<Record<Chamber, { c: number; a: number; r: number; tensionPa: number }>> = {};
  for (const ch of activeChambersFromNodes(buildNodes())) {
    activeInternal[ch] = { c: i++, a: i++, r: i++, tensionPa: i++ };
  }
  return {
    node,
    q,
    xi,
    phi,
    septumShift,
    activeInternal,
    size: i
  };
}

export function stateLayout(): ModelStateLayout {
  return {
    nodes: [...nodeNames],
    dynamicEdges: [...dynamicEdgeNames],
    valves: [...valveNames],
    activeChambers: activeChambersFromNodes(buildNodes()),
    size: makeIndex().size,
  };
}

export const MODEL_STATE_LAYOUT = stateLayout();
export const MODEL_STATE_LAYOUT_HASH = simpleStableHash(MODEL_STATE_LAYOUT);
