import { defaultParams } from "@/engine/core/params";
import {
  buildEdges,
  buildNodes,
  type EdgeKind,
  type EdgeSpec,
  type ExtKind,
  type NodeKind,
  type NodeSpec,
} from "@/engine/core/topology";
import type { CoreRuntimeParams } from "@/engine/protocol";
import type { VascularPvLaw } from "@/engine/vascularPv";

/**
 * Shared, pure resolver for the reviewed non-coronary slice of the main-wire
 * hemodynamic graph.  buildNodes(), buildEdges(), and defaultParams() remain
 * the only owners of baseline topology and parameters.
 */

export const MAIN_WIRE_HEART_BOUNDARY_NODE_NAMES_V1 = Object.freeze([
  "LV",
  "LA",
  "RV",
  "RA",
] as const);

export const MAIN_WIRE_NON_CORONARY_VASCULAR_NODE_NAMES_V1 = Object.freeze([
  "Ao",
  "SA",
  "Art",
  "Cap",
  "SV",
  "VC",
  "PA",
  "PArt",
  "PCap",
  "PVen",
  "PVein",
] as const);

export const MAIN_WIRE_NON_CORONARY_CIRCULATION_NODE_NAMES_V1 = Object.freeze([
  ...MAIN_WIRE_HEART_BOUNDARY_NODE_NAMES_V1,
  ...MAIN_WIRE_NON_CORONARY_VASCULAR_NODE_NAMES_V1,
] as const);

export const MAIN_WIRE_NON_CORONARY_VASCULAR_EDGE_NAMES_V1 = Object.freeze([
  "Ao_SA",
  "SA_Art",
  "Art_Cap",
  "Cap_SV",
  "SV_VC",
  "VC_RA",
  "PA_PArt",
  "PArt_PCap",
  "PCap_PVen",
  "PVen_PVein",
  "PVein_LA",
] as const);

export type MainWireHeartBoundaryNodeNameV1 =
  (typeof MAIN_WIRE_HEART_BOUNDARY_NODE_NAMES_V1)[number];
export type MainWireNonCoronaryVascularNodeNameV1 =
  (typeof MAIN_WIRE_NON_CORONARY_VASCULAR_NODE_NAMES_V1)[number];
export type MainWireNonCoronaryCirculationNodeNameV1 =
  (typeof MAIN_WIRE_NON_CORONARY_CIRCULATION_NODE_NAMES_V1)[number];
export type MainWireNonCoronaryVascularEdgeNameV1 =
  (typeof MAIN_WIRE_NON_CORONARY_VASCULAR_EDGE_NAMES_V1)[number];

export type MainWireHemodynamicRuntimeControlsV1 = Readonly<
  Pick<
    CoreRuntimeParams,
    | "venousTone"
    | "arterialStiffness"
    | "systemicResistance"
    | "pulmonaryResistance"
    | "useChiResistance"
  > & Pick<CoreRuntimeParams, "nodeOverrides" | "edgeOverrides">
>;

export type ResolvedMainWireHeartBoundaryNodeV1 = Readonly<{
  name: MainWireHeartBoundaryNodeNameV1;
  role: "heart-boundary";
  sourceKind: Extract<NodeKind, "heartActive" | "heartElastance">;
}>;

export type ResolvedMainWireVascularNodeV1 = Readonly<{
  name: MainWireNonCoronaryVascularNodeNameV1;
  role: "vascular-storage";
  sourceKind: Extract<NodeKind, "arterial" | "linear" | "venousPressure">;
  externalPressureKind: ExtKind;
  effectiveUnstressedVolumeMl: number;
  pvLawMainWireUnits: Readonly<VascularPvLaw>;
  sourceSpecMainWireUnits: Readonly<NodeSpec>;
}>;

export type MainWireEdgeIntegrationClassV1 = "dynamic-flow-state" | "algebraic-flow";

export type ResolvedMainWireVascularEdgeV1 = Readonly<{
  name: MainWireNonCoronaryVascularEdgeNameV1;
  upstream: MainWireNonCoronaryCirculationNodeNameV1;
  downstream: MainWireNonCoronaryCirculationNodeNameV1;
  sourceKind: EdgeKind;
  normalizedKind: Extract<EdgeKind, "resistive" | "dynamic">;
  integrationClass: MainWireEdgeIntegrationClassV1;
  externalPressureKind: ExtKind;
  waterfall: boolean;
  criticalTransmuralPressureMmHg: number;
  effectiveResistanceMmHgSecPerMl: number;
  effectiveInertanceMmHgSec2PerMl: number;
  effectiveQuadraticLossMmHgSec2PerMl2: number;
  resistanceRuntimeMultiplierOwner:
    | "none"
    | "CoreRuntimeParams.systemicResistance"
    | "CoreRuntimeParams.pulmonaryResistance";
  sourceSpecMainWireUnits: Readonly<EdgeSpec>;
}>;

export type ResolvedMainWireNonCoronaryHemodynamicGraphV1 = Readonly<{
  resolverId: "main-wire-non-coronary-hemodynamic-graph-resolver-v1";
  provenance: Readonly<{
    topologyOwnerModule: "engine/core/topology.ts";
    nodeOwnerExport: "buildNodes";
    edgeOwnerExport: "buildEdges";
    defaultParameterOwner: "engine/core/params.ts#defaultParams";
    modelCoreParameterApplicationReference:
      "engine/ModelCore.ts#setImmediateParameters";
    modelCoreNumericalRuntimeParityClaimed: false;
    numericalSemanticsOwner:
      "four-chamber-main-wire-non-coronary-kernel";
  }>;
  runtimeControls: MainWireHemodynamicRuntimeControlsV1;
  scope: Readonly<{
    coronaryNetworkIncluded: false;
    valvesIncluded: false;
    chamberBoundaryNodesIncluded: true;
    pressureDependentChiResolved: false;
  }>;
  boundaryNodes: readonly ResolvedMainWireHeartBoundaryNodeV1[];
  vascularNodes: readonly ResolvedMainWireVascularNodeV1[];
  circulationNodeNames: readonly MainWireNonCoronaryCirculationNodeNameV1[];
  edges: readonly ResolvedMainWireVascularEdgeV1[];
  dynamicEdgeNames: readonly MainWireNonCoronaryVascularEdgeNameV1[];
  algebraicEdgeNames: readonly MainWireNonCoronaryVascularEdgeNameV1[];
}>;

export function mainWireDefaultHemodynamicRuntimeControlsV1():
MainWireHemodynamicRuntimeControlsV1 {
  const parameters = defaultParams();
  return Object.freeze({
    venousTone: parameters.venousTone,
    arterialStiffness: parameters.arterialStiffness,
    systemicResistance: parameters.systemicResistance,
    pulmonaryResistance: parameters.pulmonaryResistance,
    useChiResistance: parameters.useChiResistance,
  });
}

/**
 * Resolve the source graph at one parameter state.  Pressure-dependent chi
 * losses need instantaneous upstream/downstream pressures and are therefore
 * intentionally rejected here rather than approximated.
 */
export function resolveMainWireNonCoronaryHemodynamicGraphV1(
  runtimeControls: MainWireHemodynamicRuntimeControlsV1 =
    mainWireDefaultHemodynamicRuntimeControlsV1(),
): ResolvedMainWireNonCoronaryHemodynamicGraphV1 {
  assertExactRuntimeControls(runtimeControls);
  const controls = Object.freeze({
    venousTone: requireFinite(runtimeControls.venousTone, "runtimeControls.venousTone"),
    arterialStiffness: requirePositiveFinite(
      runtimeControls.arterialStiffness,
      "runtimeControls.arterialStiffness",
    ),
    systemicResistance: requirePositiveFinite(
      runtimeControls.systemicResistance,
      "runtimeControls.systemicResistance",
    ),
    pulmonaryResistance: requirePositiveFinite(
      runtimeControls.pulmonaryResistance,
      "runtimeControls.pulmonaryResistance",
    ),
    useChiResistance: requireBoolean(
      runtimeControls.useChiResistance,
      "runtimeControls.useChiResistance",
    ),
    ...(runtimeControls.nodeOverrides === undefined
      ? {}
      : { nodeOverrides: copyNodeOverridesV1(runtimeControls.nodeOverrides) }),
    ...(runtimeControls.edgeOverrides === undefined
      ? {}
      : { edgeOverrides: copyEdgeOverridesV1(runtimeControls.edgeOverrides) }),
  });
  if (controls.useChiResistance) {
    throw new Error(
      "main-wire graph resolver cannot resolve pressure-dependent chi without same-level pressures",
    );
  }

  const sourceNodes = buildNodes().map((source) =>
    applyNodeOverrideLikeModelCoreV1(source, controls));
  const sourceEdges = buildEdges().map((source) =>
    applyEdgeOverrideLikeModelCoreV1(source, controls));
  requireUniqueNames(sourceNodes, "buildNodes()");
  requireUniqueNames(sourceEdges, "buildEdges()");
  const nodeByName = new Map(sourceNodes.map((node) => [node.name, node]));
  const edgeByName = new Map(sourceEdges.map((edge) => [edge.name, edge]));

  const boundaryNodes = Object.freeze(MAIN_WIRE_HEART_BOUNDARY_NODE_NAMES_V1.map((name) => {
    const source = requireNamed(nodeByName, name, "node");
    if (source.kind !== "heartActive" && source.kind !== "heartElastance") {
      throw new Error(`main-wire boundary node ${name} is not a heart node`);
    }
    return Object.freeze({
      name,
      role: "heart-boundary" as const,
      sourceKind: source.kind,
    });
  }));

  const vascularNodes = Object.freeze(MAIN_WIRE_NON_CORONARY_VASCULAR_NODE_NAMES_V1.map((name) => {
    const source = requireNamed(nodeByName, name, "node");
    if (
      source.kind !== "arterial"
      && source.kind !== "linear"
      && source.kind !== "venousPressure"
    ) {
      throw new Error(`main-wire vascular node ${name} has unsupported kind ${source.kind}`);
    }
    if (source.active !== undefined || source.chamber !== undefined) {
      throw new Error(`vascular source node ${name} unexpectedly owns heart material`);
    }
    const effectiveUnstressedVolumeMl = requireNonNegativeFinite(
      (source.Vu ?? 0) - (source.venousToneGain ?? 0) * controls.venousTone,
      `${name}.effectiveUnstressedVolumeMl`,
    );
    return Object.freeze({
      name,
      role: "vascular-storage" as const,
      sourceKind: source.kind,
      externalPressureKind: source.ext ?? "none",
      effectiveUnstressedVolumeMl,
      pvLawMainWireUnits: resolveVascularPvLaw(source, controls, effectiveUnstressedVolumeMl),
      sourceSpecMainWireUnits: Object.freeze({ ...source }),
    });
  }));

  const selectedNodeNames = new Set<string>(MAIN_WIRE_NON_CORONARY_CIRCULATION_NODE_NAMES_V1);
  const edges = Object.freeze(MAIN_WIRE_NON_CORONARY_VASCULAR_EDGE_NAMES_V1.map((name) => {
    const source = requireNamed(edgeByName, name, "edge");
    if (!selectedNodeNames.has(source.up)
        || !selectedNodeNames.has(source.down)
        || source.up === source.down) {
      throw new Error(`main-wire vascular edge ${name} leaves its reviewed 15-node boundary`);
    }
    return resolveVascularEdge(source, controls);
  }));

  return Object.freeze({
    resolverId: "main-wire-non-coronary-hemodynamic-graph-resolver-v1",
    provenance: Object.freeze({
      topologyOwnerModule: "engine/core/topology.ts",
      nodeOwnerExport: "buildNodes",
      edgeOwnerExport: "buildEdges",
      defaultParameterOwner: "engine/core/params.ts#defaultParams",
      modelCoreParameterApplicationReference:
        "engine/ModelCore.ts#setImmediateParameters",
      modelCoreNumericalRuntimeParityClaimed: false,
      numericalSemanticsOwner: "four-chamber-main-wire-non-coronary-kernel",
    }),
    runtimeControls: controls,
    scope: Object.freeze({
      coronaryNetworkIncluded: false,
      valvesIncluded: false,
      chamberBoundaryNodesIncluded: true,
      pressureDependentChiResolved: false,
    }),
    boundaryNodes,
    vascularNodes,
    circulationNodeNames: MAIN_WIRE_NON_CORONARY_CIRCULATION_NODE_NAMES_V1,
    edges,
    dynamicEdgeNames: Object.freeze(edges
      .filter((edge) => edge.integrationClass === "dynamic-flow-state")
      .map((edge) => edge.name)),
    algebraicEdgeNames: Object.freeze(edges
      .filter((edge) => edge.integrationClass === "algebraic-flow")
      .map((edge) => edge.name)),
  });
}

export const MAIN_WIRE_NON_CORONARY_DEFAULT_HEMODYNAMIC_GRAPH_V1 =
  resolveMainWireNonCoronaryHemodynamicGraphV1();

/**
 * Mirrors the parameter-application part of ModelCore#setImmediateParameters.
 * This deliberately does not import ModelCore's integration, clipping, or
 * projection semantics.
 */
function applyNodeOverrideLikeModelCoreV1(
  source: NodeSpec,
  controls: MainWireHemodynamicRuntimeControlsV1,
): NodeSpec {
  const override = controls.nodeOverrides?.[source.name];
  if (override === undefined) return source;
  const updated = { ...source, ...override } as NodeSpec;
  const activeOverride = override.active;
  if (source.active !== undefined
      && activeOverride !== undefined
      && activeOverride !== null
      && typeof activeOverride === "object"
      && !Array.isArray(activeOverride)) {
    updated.active = {
      ...source.active,
      ...activeOverride,
    } as typeof source.active;
  }
  return updated;
}

/**
 * Mirrors ModelCore's flat edge merge and its PVein_LA R/L/B aliases before
 * configurePVOstialEdge selects the algebraic or dynamic form.
 */
function applyEdgeOverrideLikeModelCoreV1(
  source: EdgeSpec,
  controls: MainWireHemodynamicRuntimeControlsV1,
): EdgeSpec {
  const override = controls.edgeOverrides?.[source.name];
  if (override === undefined) return source;
  const updated = { ...source, ...override } as EdgeSpec;
  if (source.name === "PVein_LA") {
    if (Object.hasOwn(override, "R") && !Object.hasOwn(override, "pvOstialResistanceR")) {
      updated.pvOstialResistanceR = override.R;
    }
    if (Object.hasOwn(override, "L") && !Object.hasOwn(override, "pvOstialInertanceL")) {
      updated.pvOstialInertanceL = override.L;
    }
    if (Object.hasOwn(override, "B") && !Object.hasOwn(override, "pvOstialQuadraticB")) {
      updated.pvOstialQuadraticB = override.B;
    }
  }
  return updated;
}

function resolveVascularPvLaw(
  source: NodeSpec,
  controls: MainWireHemodynamicRuntimeControlsV1,
  effectiveUnstressedVolumeMl: number,
): Readonly<VascularPvLaw> {
  if (source.kind === "arterial") {
    return Object.freeze({
      kind: "arterial" as const,
      Vu: effectiveUnstressedVolumeMl,
      P0: requirePositiveFinite(source.P0 ?? 50, `${source.name}.P0`),
      VsEff: requirePositiveFinite(
        requirePositiveFinite(source.Vs ?? 100, `${source.name}.Vs`)
          / controls.arterialStiffness,
        `${source.name}.VsEff`,
      ),
    });
  }
  if (source.kind === "linear") {
    return Object.freeze({
      kind: "linear" as const,
      Vu: effectiveUnstressedVolumeMl,
      C: requirePositiveFinite(source.C ?? 1, `${source.name}.C`),
    });
  }
  if (source.kind === "venousPressure") {
    return Object.freeze({
      kind: "venous3" as const,
      Vu: effectiveUnstressedVolumeMl,
      Ccoll: source.Ccoll ?? 5,
      Copen: source.Copen ?? 50,
      Cdist: source.Cdist ?? 15,
      Popen: source.Popen ?? -1,
      Pstiff: source.Pstiff ?? 14,
      dOpen: requirePositiveFinite(source.dOpen ?? 1, `${source.name}.dOpen`),
      dStiff: requirePositiveFinite(source.dStiff ?? 3, `${source.name}.dStiff`),
    });
  }
  throw new Error(`node ${source.name} has no vascular PV law`);
}

function resolveVascularEdge(
  source: EdgeSpec,
  controls: MainWireHemodynamicRuntimeControlsV1,
): ResolvedMainWireVascularEdgeV1 {
  let normalizedKind: "resistive" | "dynamic";
  let resistance = source.R;
  let inertance = source.L ?? 0;
  let quadraticLoss = source.B ?? 0;
  let groupMultiplierOwner:
  ResolvedMainWireVascularEdgeV1["resistanceRuntimeMultiplierOwner"] = "none";

  if (source.name === "PVein_LA") {
    inertance = requireNonNegativeFinite(
      source.pvOstialInertanceL ?? 0,
      `${source.name}.pvOstialInertanceL`,
    );
    if (inertance <= 0) {
      // Exact configurePVOstialEdge baseline: R and B remain the edge values.
      normalizedKind = "resistive";
      inertance = 0;
    } else {
      normalizedKind = "dynamic";
      resistance = requirePositiveFinite(
        source.pvOstialResistanceR ?? source.R,
        `${source.name}.pvOstialResistanceR`,
      );
      quadraticLoss = requireNonNegativeFinite(
        source.pvOstialQuadraticB ?? 0,
        `${source.name}.pvOstialQuadraticB`,
      );
    }
  } else {
    if (source.kind === "valve") {
      throw new Error(`non-coronary vascular slice unexpectedly includes valve ${source.name}`);
    }
    normalizedKind = source.kind;
    if (source.group === "systemic") {
      resistance *= controls.systemicResistance;
      groupMultiplierOwner = "CoreRuntimeParams.systemicResistance";
    } else if (source.group === "pulmonary") {
      resistance *= controls.pulmonaryResistance;
      groupMultiplierOwner = "CoreRuntimeParams.pulmonaryResistance";
    }
  }
  resistance = requirePositiveFinite(resistance, `${source.name}.effectiveR`);
  inertance = requireNonNegativeFinite(inertance, `${source.name}.effectiveL`);
  quadraticLoss = requireNonNegativeFinite(
    quadraticLoss,
    `${source.name}.effectiveB`,
  );
  const integrationClass: MainWireEdgeIntegrationClassV1 =
    normalizedKind === "dynamic" && inertance > 0
      ? "dynamic-flow-state"
      : "algebraic-flow";

  return Object.freeze({
    name: source.name as MainWireNonCoronaryVascularEdgeNameV1,
    upstream: source.up as MainWireNonCoronaryCirculationNodeNameV1,
    downstream: source.down as MainWireNonCoronaryCirculationNodeNameV1,
    sourceKind: source.kind,
    normalizedKind,
    integrationClass,
    externalPressureKind: source.ext ?? "none",
    waterfall: Boolean(source.waterfall),
    criticalTransmuralPressureMmHg: source.Pcrit ?? 0,
    effectiveResistanceMmHgSecPerMl: resistance,
    effectiveInertanceMmHgSec2PerMl: inertance,
    effectiveQuadraticLossMmHgSec2PerMl2: quadraticLoss,
    resistanceRuntimeMultiplierOwner: groupMultiplierOwner,
    sourceSpecMainWireUnits: Object.freeze({ ...source }),
  });
}

function assertExactRuntimeControls(value: MainWireHemodynamicRuntimeControlsV1): void {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("runtimeControls must be a plain object");
  }
  const required = [
    "venousTone",
    "arterialStiffness",
    "systemicResistance",
    "pulmonaryResistance",
    "useChiResistance",
  ];
  const optional = ["nodeOverrides", "edgeOverrides"];
  const keys = Object.keys(value);
  const unknown = keys.filter((key) => !required.includes(key) && !optional.includes(key));
  const missing = required.filter((key) => !Object.hasOwn(value, key));
  if (unknown.length > 0) throw new Error(`runtimeControls contains unknown fields: ${unknown.join(", ")}`);
  if (missing.length > 0) throw new Error(`runtimeControls is missing fields: ${missing.join(", ")}`);
}

function copyNodeOverridesV1(
  value: NonNullable<CoreRuntimeParams["nodeOverrides"]>,
): NonNullable<CoreRuntimeParams["nodeOverrides"]> {
  requirePlainRecord(value, "runtimeControls.nodeOverrides");
  return Object.freeze(Object.fromEntries(Object.entries(value).map(([nodeName, override]) => {
    requirePlainRecord(override, `runtimeControls.nodeOverrides.${nodeName}`);
    const copied = Object.fromEntries(Object.entries(override).map(([field, fieldValue]) => {
      if (fieldValue !== null && typeof fieldValue === "object" && !Array.isArray(fieldValue)) {
        requirePlainRecord(fieldValue, `runtimeControls.nodeOverrides.${nodeName}.${field}`);
        const nested = Object.freeze(Object.fromEntries(Object.entries(fieldValue).map(
          ([nestedField, nestedValue]) => {
            if (typeof nestedValue === "number") {
              requireFinite(
                nestedValue,
                `runtimeControls.nodeOverrides.${nodeName}.${field}.${nestedField}`,
              );
            } else if (typeof nestedValue !== "string") {
              throw new Error(
                `runtimeControls.nodeOverrides.${nodeName}.${field}.${nestedField} must be finite numeric or string`,
              );
            }
            return [nestedField, nestedValue];
          },
        )));
        return [field, nested];
      }
      if (typeof fieldValue === "number") {
        requireFinite(fieldValue, `runtimeControls.nodeOverrides.${nodeName}.${field}`);
      } else {
        throw new Error(
          `runtimeControls.nodeOverrides.${nodeName}.${field} must be finite numeric or a plain nested record`,
        );
      }
      return [field, fieldValue];
    }));
    return [nodeName, Object.freeze(copied)];
  }))) as NonNullable<CoreRuntimeParams["nodeOverrides"]>;
}

function copyEdgeOverridesV1(
  value: NonNullable<CoreRuntimeParams["edgeOverrides"]>,
): NonNullable<CoreRuntimeParams["edgeOverrides"]> {
  requirePlainRecord(value, "runtimeControls.edgeOverrides");
  return Object.freeze(Object.fromEntries(Object.entries(value).map(([edgeName, override]) => {
    requirePlainRecord(override, `runtimeControls.edgeOverrides.${edgeName}`);
    const copied = Object.freeze(Object.fromEntries(Object.entries(override).map(([field, fieldValue]) => [
      field,
      requireFinite(fieldValue, `runtimeControls.edgeOverrides.${edgeName}.${field}`),
    ])));
    return [edgeName, copied];
  }))) as NonNullable<CoreRuntimeParams["edgeOverrides"]>;
}

function requirePlainRecord(value: object, field: string): void {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${field} must be a plain object`);
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    throw new Error(`${field} must be a plain object`);
  }
}

function requireNamed<T extends { readonly name: string }>(
  values: ReadonlyMap<string, T>,
  name: string,
  kind: string,
): T {
  const value = values.get(name);
  if (value === undefined) throw new Error(`main-wire ${kind} ${name} is missing`);
  return value;
}

function requireUniqueNames(values: readonly { readonly name: string }[], source: string): void {
  const names = values.map((value) => value.name);
  if (new Set(names).size !== names.length) throw new Error(`${source} contains duplicate names`);
}

function requireBoolean(value: boolean, field: string): boolean {
  if (typeof value !== "boolean") throw new Error(`${field} must be boolean`);
  return value;
}

function requireFinite(value: number, field: string): number {
  if (!Number.isFinite(value)) throw new Error(`${field} must be finite`);
  return value;
}

function requireNonNegativeFinite(value: number, field: string): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${field} must be non-negative and finite`);
  }
  return value;
}

function requirePositiveFinite(value: number, field: string): number {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${field} must be positive and finite`);
  }
  return value;
}
