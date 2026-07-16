import {
  MAIN_WIRE_HEART_BOUNDARY_NODE_NAMES_V1,
  MAIN_WIRE_NON_CORONARY_CIRCULATION_NODE_NAMES_V1,
  MAIN_WIRE_NON_CORONARY_DEFAULT_HEMODYNAMIC_GRAPH_V1,
  MAIN_WIRE_NON_CORONARY_VASCULAR_EDGE_NAMES_V1,
  MAIN_WIRE_NON_CORONARY_VASCULAR_NODE_NAMES_V1,
  type MainWireHeartBoundaryNodeNameV1,
  type MainWireNonCoronaryCirculationNodeNameV1,
  type MainWireNonCoronaryVascularEdgeNameV1,
  type MainWireNonCoronaryVascularNodeNameV1,
} from "@/engine/core/mainWireHemodynamicGraphV1";
import type { EdgeKind, EdgeSpec, ExtKind, NodeKind, NodeSpec } from "@/engine/core/topology";

export {
  MAIN_WIRE_HEART_BOUNDARY_NODE_NAMES_V1,
  MAIN_WIRE_NON_CORONARY_CIRCULATION_NODE_NAMES_V1,
  MAIN_WIRE_NON_CORONARY_VASCULAR_EDGE_NAMES_V1,
  MAIN_WIRE_NON_CORONARY_VASCULAR_NODE_NAMES_V1,
} from "@/engine/core/mainWireHemodynamicGraphV1";
export type {
  MainWireHeartBoundaryNodeNameV1,
  MainWireNonCoronaryCirculationNodeNameV1,
  MainWireNonCoronaryVascularEdgeNameV1,
  MainWireNonCoronaryVascularNodeNameV1,
} from "@/engine/core/mainWireHemodynamicGraphV1";

/**
 * SI-facing contract for the exact non-coronary projection resolved by the
 * shared main-wire graph owner.  This is an adapter, not a second parameter or
 * topology owner.  It is consumed by the research-only Phase-B1 distributed
 * solver, but is not wired into ModelCore, the browser product, or release
 * runtime.
 */

export type MainWireIncidenceEntryV1 = -1 | 0 | 1;
export type MainWireNonCoronaryIncidenceMatrixV1 = readonly (
  readonly MainWireIncidenceEntryV1[]
)[];

export type MainWireBoundaryNodeContractV1 = Readonly<{
  name: MainWireHeartBoundaryNodeNameV1;
  role: "heart-boundary";
  sourceKind: Extract<NodeKind, "heartActive" | "heartElastance">;
  vascularPvLawOwnedHere: false;
}>;

export type MainWireVascularNodeContractV1 = Readonly<{
  name: MainWireNonCoronaryVascularNodeNameV1;
  role: "vascular-storage";
  sourceKind: Extract<NodeKind, "arterial" | "linear" | "venousPressure">;
  externalPressureKind: ExtKind;
  effectiveUnstressedVolumeMlAtMainWireDefaults: number;
  sourceSpecMainWireUnits: Readonly<NodeSpec>;
}>;

export type MainWireVascularEdgeIntegrationClassV1 = "dynamic-flow-state" | "algebraic-flow";

export type MainWireVascularEdgeContractV1 = Readonly<{
  name: MainWireNonCoronaryVascularEdgeNameV1;
  upstream: MainWireNonCoronaryCirculationNodeNameV1;
  downstream: MainWireNonCoronaryCirculationNodeNameV1;
  sourceKind: EdgeKind;
  normalizedKindAtMainWireDefaults: Extract<EdgeKind, "resistive" | "dynamic">;
  integrationClass: MainWireVascularEdgeIntegrationClassV1;
  sourceSpecMainWireUnits: Readonly<EdgeSpec>;
  coefficients: Readonly<{
    rawTopologySource: Readonly<{
      resistanceMmHgSecPerMl: number;
      inertanceMmHgSec2PerMl: number;
      quadraticLossMmHgSec2PerMl2: number;
    }>;
    resolvedMainWireDefaults: Readonly<{
      resistanceMmHgSecPerMl: number;
      inertanceMmHgSec2PerMl: number;
      quadraticLossMmHgSec2PerMl2: number;
    }>;
    resolvedMainWireDefaultsSi: Readonly<{
      resistancePaSecPerM3: number;
      inertancePaSec2PerM3: number;
      quadraticLossPaSec2PerM6: number;
    }>;
    resistanceRuntimeMultiplierOwner:
      | "none"
      | "CoreRuntimeParams.systemicResistance"
      | "CoreRuntimeParams.pulmonaryResistance";
  }>;
  incidenceColumn: readonly MainWireIncidenceEntryV1[];
}>;

export type MainWireNonCoronaryVascularTopologyContractV1 = Readonly<{
  contractId: "main-wire-non-coronary-vascular-topology-adapter-v1";
  provenance: Readonly<{
    graphResolverOwner: "engine/core/mainWireHemodynamicGraphV1.ts";
    topologyOwnerModule: "engine/core/topology.ts";
    nodeOwnerExport: "buildNodes";
    edgeOwnerExport: "buildEdges";
    defaultParameterOwner: "engine/core/params.ts#defaultParams";
    unitTransformationOnly: true;
    sourceMainWireUnits: "mmHg,mL,s";
    adapterUnits: "Pa,m^3,s";
  }>;
  scope: Readonly<{
    coronaryNetworkIncluded: false;
    heartValvesIncluded: false;
    heartChambersAreBoundaryNodes: true;
    solverIntegrationOwnedByThisContract: false;
    legacyAggregateFlowsIncludedInThisContract: false;
    legacyAggregateSolverCoexistsElsewhere: true;
    intendedIntegrationMode: "replace-not-augment";
  }>;
  boundaryNodes: readonly MainWireBoundaryNodeContractV1[];
  vascularNodes: readonly MainWireVascularNodeContractV1[];
  circulationNodeNames: readonly MainWireNonCoronaryCirculationNodeNameV1[];
  edges: readonly MainWireVascularEdgeContractV1[];
  dynamicEdgeNames: readonly MainWireNonCoronaryVascularEdgeNameV1[];
  algebraicEdgeNames: readonly MainWireNonCoronaryVascularEdgeNameV1[];
  incidenceMatrix: MainWireNonCoronaryIncidenceMatrixV1;
  incidenceColumnSums: readonly 0[];
}>;

export const MAIN_WIRE_PASCAL_PER_MMHG_V1 = 133.322387415;
export const MAIN_WIRE_CUBIC_METRE_PER_ML_V1 = 1e-6;
export const MAIN_WIRE_RESISTANCE_SI_FACTOR_V1 =
  MAIN_WIRE_PASCAL_PER_MMHG_V1 * 1e6;
export const MAIN_WIRE_INERTANCE_SI_FACTOR_V1 =
  MAIN_WIRE_PASCAL_PER_MMHG_V1 * 1e6;
export const MAIN_WIRE_QUADRATIC_LOSS_SI_FACTOR_V1 =
  MAIN_WIRE_PASCAL_PER_MMHG_V1 * 1e12;

export const MAIN_WIRE_NON_CORONARY_VASCULAR_TOPOLOGY_V1:
MainWireNonCoronaryVascularTopologyContractV1 = buildCanonicalContractV1();

function buildCanonicalContractV1(): MainWireNonCoronaryVascularTopologyContractV1 {
  const resolved = MAIN_WIRE_NON_CORONARY_DEFAULT_HEMODYNAMIC_GRAPH_V1;
  const boundaryNodes = Object.freeze(resolved.boundaryNodes.map((node) => Object.freeze({
    ...node,
    vascularPvLawOwnedHere: false as const,
  })));
  const vascularNodes = Object.freeze(resolved.vascularNodes.map((node) => Object.freeze({
    name: node.name,
    role: node.role,
    sourceKind: node.sourceKind,
    externalPressureKind: node.externalPressureKind,
    effectiveUnstressedVolumeMlAtMainWireDefaults: node.effectiveUnstressedVolumeMl,
    sourceSpecMainWireUnits: node.sourceSpecMainWireUnits,
  })));

  const incidenceColumns: MainWireIncidenceEntryV1[][] = [];
  const edges = Object.freeze(resolved.edges.map((edge) => {
    const incidenceColumn = MAIN_WIRE_NON_CORONARY_CIRCULATION_NODE_NAMES_V1.map((nodeName) =>
      nodeName === edge.upstream ? -1 as const : nodeName === edge.downstream ? 1 as const : 0 as const);
    assertIncidenceColumn(incidenceColumn, edge.name);
    incidenceColumns.push(incidenceColumn);
    const source = edge.sourceSpecMainWireUnits;
    const rawInertance = source.name === "PVein_LA"
      ? Math.max(source.pvOstialInertanceL ?? 0, 0)
      : Math.max(source.L ?? 0, 0);

    return Object.freeze({
      name: edge.name,
      upstream: edge.upstream,
      downstream: edge.downstream,
      sourceKind: edge.sourceKind,
      normalizedKindAtMainWireDefaults: edge.normalizedKind,
      integrationClass: edge.integrationClass,
      sourceSpecMainWireUnits: source,
      coefficients: Object.freeze({
        rawTopologySource: Object.freeze({
          resistanceMmHgSecPerMl: source.R,
          inertanceMmHgSec2PerMl: rawInertance,
          quadraticLossMmHgSec2PerMl2: source.B ?? 0,
        }),
        resolvedMainWireDefaults: Object.freeze({
          resistanceMmHgSecPerMl: edge.effectiveResistanceMmHgSecPerMl,
          inertanceMmHgSec2PerMl: edge.effectiveInertanceMmHgSec2PerMl,
          quadraticLossMmHgSec2PerMl2: edge.effectiveQuadraticLossMmHgSec2PerMl2,
        }),
        resolvedMainWireDefaultsSi: Object.freeze({
          resistancePaSecPerM3:
            edge.effectiveResistanceMmHgSecPerMl * MAIN_WIRE_RESISTANCE_SI_FACTOR_V1,
          inertancePaSec2PerM3:
            edge.effectiveInertanceMmHgSec2PerMl * MAIN_WIRE_INERTANCE_SI_FACTOR_V1,
          quadraticLossPaSec2PerM6:
            edge.effectiveQuadraticLossMmHgSec2PerMl2
            * MAIN_WIRE_QUADRATIC_LOSS_SI_FACTOR_V1,
        }),
        resistanceRuntimeMultiplierOwner: edge.resistanceRuntimeMultiplierOwner,
      }),
      incidenceColumn: Object.freeze(incidenceColumn.slice()),
    });
  }));

  const incidenceMatrix = Object.freeze(MAIN_WIRE_NON_CORONARY_CIRCULATION_NODE_NAMES_V1.map(
    (_, rowIndex) => Object.freeze(incidenceColumns.map((column) => column[rowIndex])),
  ));
  const incidenceColumnSums = Object.freeze(edges.map((_, columnIndex) => {
    const sum = incidenceMatrix.reduce<number>((total, row) => total + row[columnIndex], 0);
    if (sum !== 0) throw new Error(`main-wire incidence column ${columnIndex} lost conservation`);
    return 0 as const;
  }));

  return Object.freeze({
    contractId: "main-wire-non-coronary-vascular-topology-adapter-v1",
    provenance: Object.freeze({
      graphResolverOwner: "engine/core/mainWireHemodynamicGraphV1.ts",
      topologyOwnerModule: "engine/core/topology.ts",
      nodeOwnerExport: "buildNodes",
      edgeOwnerExport: "buildEdges",
      defaultParameterOwner: "engine/core/params.ts#defaultParams",
      unitTransformationOnly: true,
      sourceMainWireUnits: "mmHg,mL,s",
      adapterUnits: "Pa,m^3,s",
    }),
    scope: Object.freeze({
      coronaryNetworkIncluded: false,
      heartValvesIncluded: false,
      heartChambersAreBoundaryNodes: true,
      solverIntegrationOwnedByThisContract: false,
      legacyAggregateFlowsIncludedInThisContract: false,
      legacyAggregateSolverCoexistsElsewhere: true,
      intendedIntegrationMode: "replace-not-augment",
    }),
    boundaryNodes,
    vascularNodes,
    circulationNodeNames: MAIN_WIRE_NON_CORONARY_CIRCULATION_NODE_NAMES_V1,
    edges,
    dynamicEdgeNames: resolved.dynamicEdgeNames,
    algebraicEdgeNames: resolved.algebraicEdgeNames,
    incidenceMatrix,
    incidenceColumnSums,
  });
}

function assertIncidenceColumn(
  column: readonly MainWireIncidenceEntryV1[],
  edgeName: string,
): void {
  const upstreamCount = column.filter((value) => value === -1).length;
  const downstreamCount = column.filter((value) => value === 1).length;
  const sum = column.reduce<number>((total, value) => total + value, 0);
  if (upstreamCount !== 1 || downstreamCount !== 1 || sum !== 0) {
    throw new Error(`main-wire edge ${edgeName} must have one -1, one +1, and zero column sum`);
  }
}
