import {
  MAIN_WIRE_HEART_BOUNDARY_NODE_NAMES_V1,
  MAIN_WIRE_NON_CORONARY_CIRCULATION_NODE_NAMES_V1,
  MAIN_WIRE_NON_CORONARY_VASCULAR_EDGE_NAMES_V1,
  MAIN_WIRE_NON_CORONARY_VASCULAR_NODE_NAMES_V1,
  resolveMainWireNonCoronaryHemodynamicGraphV1,
  type MainWireHeartBoundaryNodeNameV1,
  type MainWireHemodynamicRuntimeControlsV1,
  type MainWireNonCoronaryCirculationNodeNameV1,
  type MainWireNonCoronaryVascularEdgeNameV1,
  type MainWireNonCoronaryVascularNodeNameV1,
  type ResolvedMainWireNonCoronaryHemodynamicGraphV1,
  type ResolvedMainWireVascularEdgeV1,
} from "@/engine/core/mainWireHemodynamicGraphV1";
import {
  compileMainWireDynamicValveParametersByFlowV1,
  evaluateMainWireDynamicValveMomentumV1,
  type CompiledMainWireDynamicValveParametersV1,
  type MainWireDynamicValveMomentumV1,
} from "@/engine/myocardium/fourChamberV1/hydromechanics/mainWireDynamicValveApertureV1";
import { assertExactPlainRecordV1 } from
  "@/engine/myocardium/fourChamberV1/validation/strictClosedRecordV1";
import {
  compileMainWireVascularPvLawSiV1,
  evaluateMainWireVascularPvAtVolumeSiV1,
  type CompiledMainWireVascularPvLawSiV1,
  type MainWireVascularPvEvaluationSiV1,
} from "@/engine/myocardium/fourChamberV1/vascular/mainWireVascularPvLawSiV1";
import {
  MAIN_WIRE_INERTANCE_SI_FACTOR_V1,
  MAIN_WIRE_PASCAL_PER_MMHG_V1,
  MAIN_WIRE_QUADRATIC_LOSS_SI_FACTOR_V1,
  MAIN_WIRE_RESISTANCE_SI_FACTOR_V1,
} from "@/engine/myocardium/fourChamberV1/vascular/mainWireNonCoronaryVascularTopologyV1";

export const MAIN_WIRE_NON_CORONARY_SAME_TIME_LEVEL_V1_ID =
  "four-chamber-main-wire-non-coronary-same-time-level-v1" as const;

export const MAIN_WIRE_NON_CORONARY_PRECOMPILED_CONTEXT_V1_ID =
  "four-chamber-main-wire-non-coronary-precompiled-context-v1" as const;

export const MAIN_WIRE_PHASE_B1_VALVE_FLOW_NAMES_V1 = Object.freeze([
  "Q_MV",
  "Q_AoV",
  "Q_TV",
  "Q_PuV",
] as const);

export const MAIN_WIRE_NON_CORONARY_DYNAMIC_FLOW_NAMES_V1 = Object.freeze([
  ...MAIN_WIRE_PHASE_B1_VALVE_FLOW_NAMES_V1,
  "Ao_SA",
  "PA_PArt",
] as const);

export const MAIN_WIRE_NON_CORONARY_ALGEBRAIC_FLOW_NAMES_V1 = Object.freeze([
  "SA_Art",
  "Art_Cap",
  "Cap_SV",
  "SV_VC",
  "VC_RA",
  "PArt_PCap",
  "PCap_PVen",
  "PVen_PVein",
  "PVein_LA",
] as const);

export const MAIN_WIRE_NON_CORONARY_ALL_FLOW_NAMES_V1 = Object.freeze([
  ...MAIN_WIRE_PHASE_B1_VALVE_FLOW_NAMES_V1,
  ...MAIN_WIRE_NON_CORONARY_VASCULAR_EDGE_NAMES_V1,
] as const);

export type MainWirePhaseB1ValveFlowNameV1 =
  (typeof MAIN_WIRE_PHASE_B1_VALVE_FLOW_NAMES_V1)[number];
export type MainWireNonCoronaryDynamicFlowNameV1 =
  (typeof MAIN_WIRE_NON_CORONARY_DYNAMIC_FLOW_NAMES_V1)[number];
export type MainWireNonCoronaryAlgebraicFlowNameV1 =
  (typeof MAIN_WIRE_NON_CORONARY_ALGEBRAIC_FLOW_NAMES_V1)[number];
export type MainWireNonCoronaryAllFlowNameV1 =
  (typeof MAIN_WIRE_NON_CORONARY_ALL_FLOW_NAMES_V1)[number];

type DirectedEdgeV1 = Readonly<{
  flowName: MainWireNonCoronaryAllFlowNameV1;
  upstream: MainWireNonCoronaryCirculationNodeNameV1;
  downstream: MainWireNonCoronaryCirculationNodeNameV1;
  owner: "heart-boundary-valve-adapter" | "main-wire-vascular-graph";
}>;

const PHASE_B1_VALVE_DIRECTED_EDGES_V1 = Object.freeze([
  Object.freeze({
    flowName: "Q_MV" as const,
    upstream: "LA" as const,
    downstream: "LV" as const,
    owner: "heart-boundary-valve-adapter" as const,
  }),
  Object.freeze({
    flowName: "Q_AoV" as const,
    upstream: "LV" as const,
    downstream: "Ao" as const,
    owner: "heart-boundary-valve-adapter" as const,
  }),
  Object.freeze({
    flowName: "Q_TV" as const,
    upstream: "RA" as const,
    downstream: "RV" as const,
    owner: "heart-boundary-valve-adapter" as const,
  }),
  Object.freeze({
    flowName: "Q_PuV" as const,
    upstream: "RV" as const,
    downstream: "PA" as const,
    owner: "heart-boundary-valve-adapter" as const,
  }),
]);

export const MAIN_WIRE_NON_CORONARY_DIRECTED_EDGES_V1: readonly DirectedEdgeV1[] =
  buildDirectedEdgesV1();

export const MAIN_WIRE_NON_CORONARY_INCIDENCE_MATRIX_V1 =
  buildIncidenceMatrixV1(MAIN_WIRE_NON_CORONARY_DIRECTED_EDGES_V1);

export const MAIN_WIRE_NON_CORONARY_INCIDENCE_COLUMN_SUMS_V1 = Object.freeze(
  MAIN_WIRE_NON_CORONARY_ALL_FLOW_NAMES_V1.map((_, columnIndex) => {
    const sum = MAIN_WIRE_NON_CORONARY_INCIDENCE_MATRIX_V1.reduce<number>(
      (total, row) => total + row[columnIndex]!,
      0,
    );
    if (sum !== 0) throw new Error(`incidence column ${columnIndex} does not conserve volume`);
    return 0 as const;
  }),
);

export const MAIN_WIRE_NON_CORONARY_KERNEL_OWNERSHIP_AUDIT_V1 = Object.freeze({
  vascularGraphOwner: "main-wire",
  vascularGraphResolver:
    "engine/core/mainWireHemodynamicGraphV1.ts#resolveMainWireNonCoronaryHemodynamicGraphV1",
  vascularPvOwner: "engine/vascularPv.ts",
  valveFlowIdentityOwner: "phase-b1-four-chamber-valve-ids",
  valveTopologyOwner: "same-time-level-heart-boundary-adapter",
  valveConstitutiveOwner: "engine-core-dynamic-aperture-condensed-be",
  valvePhysicalParameterOwner: "engine/core/topology.ts+engine/core/params.ts",
  valveApertureState: "four-stored-states-statically-condensed-from-newton",
  coronaryNetwork: "excluded",
  integrationMode: "replace-not-augment",
  fixedDynamicFlowVariant: "six-flow-plus-four-condensed-aperture-states-v1",
  positivePVeinLaOstialInertanceSupport:
    "unsupported-requires-seven-dynamic-flow-variant",
  modelCoreNumericalRuntimeParityClaimed: false,
  numericalSemantics: Object.freeze({
    flowClamp: "absent",
    stateProjection: "absent",
    vascularPvOutOfDomain: "throw-not-modelcore-clip",
  }),
  projectionApplied: false,
  flowClampApplied: false,
  fallbackApplied: false,
  duplicateAggregatePeripheralFlows: false,
  intendedMonolithicNewtonUnknownCount: Object.freeze({
    slsOn: 58,
    slsOff: 53,
    derivation:
      "15 blood volumes + 6 dynamic flows + 30 Land states + 5/0 SLS states + 2 TriSeg coordinates",
  }),
  intendedMonolithicStoredDifferentialStateCount: Object.freeze({
    slsOn: 70,
    slsOff: 65,
    derivation:
      "15 blood volumes + 6 dynamic flows + 4 valve apertures + 10 prescribed-calcium states + 30 Land states + 5/0 SLS states; valve apertures are exactly BE-condensed and TriSeg coordinates are algebraic",
  }),
} as const);

export type MainWireNonCoronaryKernelStateV1 = Readonly<{
  bloodVolumesM3: Readonly<Record<MainWireNonCoronaryCirculationNodeNameV1, number>>;
  dynamicFlowsM3PerSec: Readonly<Record<MainWireNonCoronaryDynamicFlowNameV1, number>>;
  valveApertureState01ByFlow: Readonly<
    Record<MainWirePhaseB1ValveFlowNameV1, number>
  >;
}>;

export type MainWireNonCoronarySameTimeLevelInputV1 = Readonly<{
  state: MainWireNonCoronaryKernelStateV1;
  chamberAbsolutePressurePa: Readonly<Record<MainWireHeartBoundaryNodeNameV1, number>>;
  externalPressurePa: Readonly<{ pth: number; palv: number }>;
  mainWireRuntimeControls: MainWireHemodynamicRuntimeControlsV1;
}>;

export type MainWireNonCoronaryPrecompiledContextV1 = Readonly<{
  contextId: typeof MAIN_WIRE_NON_CORONARY_PRECOMPILED_CONTEXT_V1_ID;
  resolvedGraph: ResolvedMainWireNonCoronaryHemodynamicGraphV1;
  vascularPvLawByNode: Readonly<Record<
    MainWireNonCoronaryVascularNodeNameV1,
    CompiledMainWireVascularPvLawSiV1
  >>;
  dynamicValveParametersByFlow: Readonly<Record<
    MainWirePhaseB1ValveFlowNameV1,
    CompiledMainWireDynamicValveParametersV1
  >>;
  internalPerformanceContextOnly: true;
  physiologyOrNumericalAcceptanceClaimed: false;
  claimBoundary:
    "immutable parameter compilation only; pressure, flow, residual, inverse, and energy semantics unchanged";
}>;

type MainWireNonCoronaryPrecompiledContextSourceBindingV1 = Readonly<{
  resolvedGraph: ResolvedMainWireNonCoronaryHemodynamicGraphV1;
  vascularPvLawByNode: MainWireNonCoronaryPrecompiledContextV1["vascularPvLawByNode"];
  dynamicValveParametersByFlow:
    MainWireNonCoronaryPrecompiledContextV1["dynamicValveParametersByFlow"];
}>;

// A structural type and frozen public fields are not an authenticity boundary:
// callers could otherwise splice a graph from one compilation together with
// PV laws from another.  This module-private binding makes the public context
// compiler-issued and binds its two parameter-bearing components by identity.
const MAIN_WIRE_NON_CORONARY_PRECOMPILED_CONTEXT_SOURCE_BINDINGS_V1 =
  new WeakMap<
    MainWireNonCoronaryPrecompiledContextV1,
    MainWireNonCoronaryPrecompiledContextSourceBindingV1
  >();

export type MainWireNonCoronaryPrecompiledSameTimeLevelInputV1 = Readonly<
  Omit<MainWireNonCoronarySameTimeLevelInputV1, "mainWireRuntimeControls"> & {
    precompiledContext: MainWireNonCoronaryPrecompiledContextV1;
  }
>;

export type MainWireVascularAlgebraicFlowEvaluationV1 = Readonly<{
  integrationClass: "algebraic-flow";
  flowName: MainWireNonCoronaryAlgebraicFlowNameV1;
  upstreamAbsolutePressurePa: number;
  downstreamAbsolutePressurePa: number;
  effectiveDownstreamPressurePa: number;
  waterfallCollapsePressurePa: number | null;
  pressureGradientPa: number;
  linearResistancePaSecPerM3: number;
  quadraticResistancePaSec2PerM6: number;
  flowM3PerSec: number;
  signedLossPressurePa: number;
  momentumResidualPa: number;
  dissipationW: number;
}>;

export type MainWireVascularDynamicFlowEvaluationV1 = Readonly<{
  integrationClass: "dynamic-flow-state";
  flowName: Extract<MainWireNonCoronaryVascularEdgeNameV1, "Ao_SA" | "PA_PArt">;
  upstreamAbsolutePressurePa: number;
  downstreamAbsolutePressurePa: number;
  effectiveDownstreamPressurePa: number;
  waterfallCollapsePressurePa: null;
  pressureGradientPa: number;
  linearResistancePaSecPerM3: number;
  inertancePaSec2PerM3: number;
  quadraticResistancePaSec2PerM6: number;
  flowM3PerSec: number;
  signedLossPressurePa: number;
  flowAccelerationM3PerSec2: number;
  momentumResidualPa: number;
  lossDerivativePaSecPerM3: number;
  kineticEnergyJ: number;
  dissipationW: number;
}>;

export type MainWireVascularFlowEvaluationV1 =
  | MainWireVascularAlgebraicFlowEvaluationV1
  | MainWireVascularDynamicFlowEvaluationV1;

export type MainWireNonCoronaryEnergyAccountingV1 = Readonly<{
  vascularElasticStoredEnergyJ: number;
  vascularDynamicFlowKineticEnergyJ: number;
  valveFlowKineticEnergyJ: number;
  vascularHydraulicDissipationW: number;
  valveHydraulicDissipationW: number;
  externalPressureWorkIncluded: false;
  chamberWallEnergyIncluded: false;
  wholeHeartEnergyClosureClaimed: false;
  claimBoundary:
    "same-level vascular storage, vascular inertance, and hydraulic losses only";
}>;

export type MainWireNonCoronarySameTimeLevelEvaluationV1 = Readonly<{
  evaluationId: typeof MAIN_WIRE_NON_CORONARY_SAME_TIME_LEVEL_V1_ID;
  state: MainWireNonCoronaryKernelStateV1;
  ownershipAudit: typeof MAIN_WIRE_NON_CORONARY_KERNEL_OWNERSHIP_AUDIT_V1;
  vascularPressureByNode: Readonly<
    Record<MainWireNonCoronaryVascularNodeNameV1, MainWireVascularPvEvaluationSiV1>
  >;
  absolutePressurePaByNode: Readonly<
    Record<MainWireNonCoronaryCirculationNodeNameV1, number>
  >;
  valveMomentumByFlow: Readonly<
    Record<MainWirePhaseB1ValveFlowNameV1, MainWireDynamicValveMomentumV1>
  >;
  vascularFlowEvaluationByFlow: Readonly<
    Record<MainWireNonCoronaryVascularEdgeNameV1, MainWireVascularFlowEvaluationV1>
  >;
  allFlowsM3PerSec: Readonly<Record<MainWireNonCoronaryAllFlowNameV1, number>>;
  dynamicFlowAccelerationM3PerSec2: Readonly<
    Record<MainWireNonCoronaryDynamicFlowNameV1, number>
  >;
  bloodVolumeRateM3PerSec: Readonly<
    Record<MainWireNonCoronaryCirculationNodeNameV1, number>
  >;
  energyAccounting: MainWireNonCoronaryEnergyAccountingV1;
}>;

export type MainWireNonCoronaryBackwardEulerVolumeResidualV1 = Readonly<{
  timeStepSec: number;
  residualM3PerSecByNode: Readonly<
    Record<MainWireNonCoronaryCirculationNodeNameV1, number>
  >;
  totalBloodVolumeChangeRateM3PerSec: number;
  summedResidualM3PerSec: number;
  summedIncidenceVolumeRateM3PerSec: number;
}>;

export function compileMainWireNonCoronaryPrecompiledContextV1(
  runtimeControls: MainWireHemodynamicRuntimeControlsV1,
): MainWireNonCoronaryPrecompiledContextV1 {
  const resolvedGraph = resolveMainWireNonCoronaryHemodynamicGraphV1(runtimeControls);
  assertSixFlowGraphBoundaryV1(resolvedGraph);
  const vascularPvLawByNode = freezeRecordFromKeysV1(
    MAIN_WIRE_NON_CORONARY_VASCULAR_NODE_NAMES_V1,
    (nodeName) => compileMainWireVascularPvLawSiV1(nodeName, {
      venousTone: resolvedGraph.runtimeControls.venousTone,
      arterialStiffness: resolvedGraph.runtimeControls.arterialStiffness,
      ...(resolvedGraph.runtimeControls.nodeOverrides === undefined
        ? {}
        : { nodeOverrides: resolvedGraph.runtimeControls.nodeOverrides }),
    }),
  );
  const dynamicValveParametersByFlow =
    compileMainWireDynamicValveParametersByFlowV1();
  const context = Object.freeze({
    contextId: MAIN_WIRE_NON_CORONARY_PRECOMPILED_CONTEXT_V1_ID,
    resolvedGraph,
    vascularPvLawByNode,
    dynamicValveParametersByFlow,
    internalPerformanceContextOnly: true as const,
    physiologyOrNumericalAcceptanceClaimed: false as const,
    claimBoundary:
      "immutable parameter compilation only; pressure, flow, residual, inverse, and energy semantics unchanged" as const,
  });
  MAIN_WIRE_NON_CORONARY_PRECOMPILED_CONTEXT_SOURCE_BINDINGS_V1.set(
    context,
    Object.freeze({
      resolvedGraph,
      vascularPvLawByNode,
      dynamicValveParametersByFlow,
    }),
  );
  return context;
}

export function evaluateMainWireNonCoronarySameTimeLevelV1(
  input: MainWireNonCoronarySameTimeLevelInputV1,
): MainWireNonCoronarySameTimeLevelEvaluationV1 {
  validateSameTimeLevelInputV1(input);
  const precompiledContext = compileMainWireNonCoronaryPrecompiledContextV1(
    input.mainWireRuntimeControls,
  );
  return evaluateMainWireNonCoronaryWithPrecompiledContextUncheckedV1(
    input,
    precompiledContext,
  );
}

export function evaluateMainWireNonCoronaryWithPrecompiledContextV1(
  input: MainWireNonCoronaryPrecompiledSameTimeLevelInputV1,
): MainWireNonCoronarySameTimeLevelEvaluationV1 {
  assertExactPlainRecordV1(input, [
    "state",
    "chamberAbsolutePressurePa",
    "externalPressurePa",
    "precompiledContext",
  ], "precompiled main-wire same-time-level input");
  assertPrecompiledContextV1(input.precompiledContext);
  const compatibilityInput: MainWireNonCoronarySameTimeLevelInputV1 = {
    state: input.state,
    chamberAbsolutePressurePa: input.chamberAbsolutePressurePa,
    externalPressurePa: input.externalPressurePa,
    mainWireRuntimeControls: input.precompiledContext.resolvedGraph.runtimeControls,
  };
  validateSameTimeLevelInputV1(compatibilityInput);
  return evaluateMainWireNonCoronaryWithPrecompiledContextUncheckedV1(
    compatibilityInput,
    input.precompiledContext,
  );
}

function evaluateMainWireNonCoronaryWithPrecompiledContextUncheckedV1(
  input: MainWireNonCoronarySameTimeLevelInputV1,
  precompiledContext: MainWireNonCoronaryPrecompiledContextV1,
): MainWireNonCoronarySameTimeLevelEvaluationV1 {
  const graph = precompiledContext.resolvedGraph;
  const vascularPressureEntries = graph.vascularNodes.map((node) => {
    const compiled = precompiledContext.vascularPvLawByNode[node.name];
    const externalPressurePa = externalPressureForKindV1(
      node.externalPressureKind,
      input.externalPressurePa,
    );
    return [
      node.name,
      evaluateMainWireVascularPvAtVolumeSiV1(
        compiled,
        input.state.bloodVolumesM3[node.name],
        externalPressurePa,
      ),
    ] as const;
  });
  const vascularPressureByNode = Object.freeze(Object.fromEntries(
    vascularPressureEntries,
  )) as Readonly<Record<
    MainWireNonCoronaryVascularNodeNameV1,
    MainWireVascularPvEvaluationSiV1
  >>;
  const absolutePressurePaByNode = freezeRecordFromKeysV1(
    MAIN_WIRE_NON_CORONARY_CIRCULATION_NODE_NAMES_V1,
    (nodeName) => MAIN_WIRE_HEART_BOUNDARY_NODE_NAMES_V1.includes(
      nodeName as MainWireHeartBoundaryNodeNameV1,
    )
      ? input.chamberAbsolutePressurePa[nodeName as MainWireHeartBoundaryNodeNameV1]
      : vascularPressureByNode[nodeName as MainWireNonCoronaryVascularNodeNameV1]
        .absolutePressurePa,
  );

  const pressureGradient = (
    upstream: MainWireNonCoronaryCirculationNodeNameV1,
    downstream: MainWireNonCoronaryCirculationNodeNameV1,
  ) => absolutePressurePaByNode[upstream] - absolutePressurePaByNode[downstream];
  const valveMomentumByFlow = Object.freeze({
    Q_MV: evaluateMainWireDynamicValveMomentumV1({
      parameters: precompiledContext.dynamicValveParametersByFlow.Q_MV,
      valveApertureState01: input.state.valveApertureState01ByFlow.Q_MV,
      pressureGradientPa: pressureGradient("LA", "LV"),
      flowM3PerSec: input.state.dynamicFlowsM3PerSec.Q_MV,
    }),
    Q_AoV: evaluateMainWireDynamicValveMomentumV1({
      parameters: precompiledContext.dynamicValveParametersByFlow.Q_AoV,
      valveApertureState01: input.state.valveApertureState01ByFlow.Q_AoV,
      pressureGradientPa: pressureGradient("LV", "Ao"),
      flowM3PerSec: input.state.dynamicFlowsM3PerSec.Q_AoV,
    }),
    Q_TV: evaluateMainWireDynamicValveMomentumV1({
      parameters: precompiledContext.dynamicValveParametersByFlow.Q_TV,
      valveApertureState01: input.state.valveApertureState01ByFlow.Q_TV,
      pressureGradientPa: pressureGradient("RA", "RV"),
      flowM3PerSec: input.state.dynamicFlowsM3PerSec.Q_TV,
    }),
    Q_PuV: evaluateMainWireDynamicValveMomentumV1({
      parameters: precompiledContext.dynamicValveParametersByFlow.Q_PuV,
      valveApertureState01: input.state.valveApertureState01ByFlow.Q_PuV,
      pressureGradientPa: pressureGradient("RV", "PA"),
      flowM3PerSec: input.state.dynamicFlowsM3PerSec.Q_PuV,
    }),
  });

  const vascularFlowEntries = graph.edges.map((edge) => {
    const evaluated = evaluateResolvedVascularEdgeV1(
      edge,
      absolutePressurePaByNode,
      input.externalPressurePa,
      input.state.dynamicFlowsM3PerSec,
    );
    return [edge.name, evaluated] as const;
  });
  const vascularFlowEvaluationByFlow = Object.freeze(Object.fromEntries(
    vascularFlowEntries,
  )) as Readonly<Record<
    MainWireNonCoronaryVascularEdgeNameV1,
    MainWireVascularFlowEvaluationV1
  >>;
  const allFlowsM3PerSec = freezeRecordFromKeysV1(
    MAIN_WIRE_NON_CORONARY_ALL_FLOW_NAMES_V1,
    (flowName) => MAIN_WIRE_PHASE_B1_VALVE_FLOW_NAMES_V1.includes(
      flowName as MainWirePhaseB1ValveFlowNameV1,
    )
      ? input.state.dynamicFlowsM3PerSec[flowName as MainWirePhaseB1ValveFlowNameV1]
      : vascularFlowEvaluationByFlow[flowName as MainWireNonCoronaryVascularEdgeNameV1]
        .flowM3PerSec,
  );
  const dynamicFlowAccelerationM3PerSec2 = Object.freeze({
    Q_MV: valveMomentumByFlow.Q_MV.flowAccelerationM3PerSec2,
    Q_AoV: valveMomentumByFlow.Q_AoV.flowAccelerationM3PerSec2,
    Q_TV: valveMomentumByFlow.Q_TV.flowAccelerationM3PerSec2,
    Q_PuV: valveMomentumByFlow.Q_PuV.flowAccelerationM3PerSec2,
    Ao_SA: requireDynamicVascularFlowV1(
      vascularFlowEvaluationByFlow.Ao_SA,
    ).flowAccelerationM3PerSec2,
    PA_PArt: requireDynamicVascularFlowV1(
      vascularFlowEvaluationByFlow.PA_PArt,
    ).flowAccelerationM3PerSec2,
  });
  const bloodVolumeRateM3PerSec =
    computeMainWireNonCoronaryVolumeRatesV1(allFlowsM3PerSec);
  const vascularFlowEvaluations = Object.values(vascularFlowEvaluationByFlow);
  const vascularElasticStoredEnergyJ = Object.values(vascularPressureByNode)
    .reduce((total, evaluation) => total + evaluation.elasticEnergyJ, 0);
  const energyAccounting = Object.freeze({
    vascularElasticStoredEnergyJ,
    vascularDynamicFlowKineticEnergyJ: vascularFlowEvaluations.reduce(
      (total, evaluation) => total + (
        evaluation.integrationClass === "dynamic-flow-state"
          ? evaluation.kineticEnergyJ
          : 0
      ),
      0,
    ),
    valveFlowKineticEnergyJ: Object.values(valveMomentumByFlow).reduce(
      (total, evaluation) => total + evaluation.kineticEnergyJ,
      0,
    ),
    vascularHydraulicDissipationW: vascularFlowEvaluations.reduce(
      (total, evaluation) => total + evaluation.dissipationW,
      0,
    ),
    valveHydraulicDissipationW: Object.values(valveMomentumByFlow).reduce(
      (total, evaluation) => total + evaluation.dissipationW,
      0,
    ),
    externalPressureWorkIncluded: false as const,
    chamberWallEnergyIncluded: false as const,
    wholeHeartEnergyClosureClaimed: false as const,
    claimBoundary:
      "same-level vascular storage, vascular inertance, and hydraulic losses only" as const,
  });

  return Object.freeze({
    evaluationId: MAIN_WIRE_NON_CORONARY_SAME_TIME_LEVEL_V1_ID,
    state: input.state,
    ownershipAudit: MAIN_WIRE_NON_CORONARY_KERNEL_OWNERSHIP_AUDIT_V1,
    vascularPressureByNode,
    absolutePressurePaByNode,
    valveMomentumByFlow,
    vascularFlowEvaluationByFlow,
    allFlowsM3PerSec,
    dynamicFlowAccelerationM3PerSec2,
    bloodVolumeRateM3PerSec,
    energyAccounting,
  });
}

export function computeMainWireNonCoronaryVolumeRatesV1(
  flowsM3PerSec: Readonly<Record<MainWireNonCoronaryAllFlowNameV1, number>>,
): Readonly<Record<MainWireNonCoronaryCirculationNodeNameV1, number>> {
  assertExactPlainRecordV1(
    flowsM3PerSec,
    MAIN_WIRE_NON_CORONARY_ALL_FLOW_NAMES_V1,
    "flowsM3PerSec",
  );
  for (const flowName of MAIN_WIRE_NON_CORONARY_ALL_FLOW_NAMES_V1) {
    requireFinite(flowsM3PerSec[flowName], `flowsM3PerSec.${flowName}`);
  }
  return freezeRecordFromKeysV1(
    MAIN_WIRE_NON_CORONARY_CIRCULATION_NODE_NAMES_V1,
    (_, rowIndex) => MAIN_WIRE_NON_CORONARY_ALL_FLOW_NAMES_V1.reduce(
      (rate, flowName, columnIndex) => rate
        + MAIN_WIRE_NON_CORONARY_INCIDENCE_MATRIX_V1[rowIndex]![columnIndex]!
          * flowsM3PerSec[flowName],
      0,
    ),
  );
}

export function evaluateMainWireNonCoronaryBackwardEulerVolumeResidualV1(input: Readonly<{
  previousBloodVolumesM3: Readonly<
    Record<MainWireNonCoronaryCirculationNodeNameV1, number>
  >;
  nextBloodVolumesM3: Readonly<
    Record<MainWireNonCoronaryCirculationNodeNameV1, number>
  >;
  nextFlowsM3PerSec: Readonly<Record<MainWireNonCoronaryAllFlowNameV1, number>>;
  timeStepSec: number;
}>): MainWireNonCoronaryBackwardEulerVolumeResidualV1 {
  assertExactPlainRecordV1(input, [
    "previousBloodVolumesM3",
    "nextBloodVolumesM3",
    "nextFlowsM3PerSec",
    "timeStepSec",
  ], "input");
  assertExactPlainRecordV1(
    input.previousBloodVolumesM3,
    MAIN_WIRE_NON_CORONARY_CIRCULATION_NODE_NAMES_V1,
    "input.previousBloodVolumesM3",
  );
  assertExactPlainRecordV1(
    input.nextBloodVolumesM3,
    MAIN_WIRE_NON_CORONARY_CIRCULATION_NODE_NAMES_V1,
    "input.nextBloodVolumesM3",
  );
  const timeStepSec = requirePositiveFinite(input.timeStepSec, "input.timeStepSec");
  const nextRate = computeMainWireNonCoronaryVolumeRatesV1(
    input.nextFlowsM3PerSec,
  );
  const residualM3PerSecByNode = freezeRecordFromKeysV1(
    MAIN_WIRE_NON_CORONARY_CIRCULATION_NODE_NAMES_V1,
    (nodeName) => {
      const previous = requirePositiveFinite(
        input.previousBloodVolumesM3[nodeName],
        `input.previousBloodVolumesM3.${nodeName}`,
      );
      const next = requirePositiveFinite(
        input.nextBloodVolumesM3[nodeName],
        `input.nextBloodVolumesM3.${nodeName}`,
      );
      return (next - previous) / timeStepSec - nextRate[nodeName];
    },
  );
  const totalBloodVolumeChangeRateM3PerSec =
    MAIN_WIRE_NON_CORONARY_CIRCULATION_NODE_NAMES_V1.reduce(
      (total, nodeName) => total
        + (input.nextBloodVolumesM3[nodeName]
          - input.previousBloodVolumesM3[nodeName]) / timeStepSec,
      0,
    );
  const summedResidualM3PerSec = Object.values(residualM3PerSecByNode)
    .reduce((total, residual) => total + residual, 0);
  const summedIncidenceVolumeRateM3PerSec = Object.values(nextRate)
    .reduce((total, rate) => total + rate, 0);
  return Object.freeze({
    timeStepSec,
    residualM3PerSecByNode,
    totalBloodVolumeChangeRateM3PerSec,
    summedResidualM3PerSec,
    summedIncidenceVolumeRateM3PerSec,
  });
}

function buildDirectedEdgesV1(): readonly DirectedEdgeV1[] {
  const graph = resolveMainWireNonCoronaryHemodynamicGraphV1();
  const vascularEdges = graph.edges.map((edge) => Object.freeze({
    flowName: edge.name,
    upstream: edge.upstream,
    downstream: edge.downstream,
    owner: "main-wire-vascular-graph" as const,
  }));
  const edges: readonly DirectedEdgeV1[] = Object.freeze([
    ...PHASE_B1_VALVE_DIRECTED_EDGES_V1,
    ...vascularEdges,
  ]);
  const actualNames = edges.map((edge) => edge.flowName);
  if (actualNames.join(",") !== MAIN_WIRE_NON_CORONARY_ALL_FLOW_NAMES_V1.join(",")) {
    throw new Error("same-level edge order drifted from its declared flow order");
  }
  if (new Set(actualNames).size !== actualNames.length) {
    throw new Error("same-level directed graph contains duplicate flow names");
  }
  return edges;
}

function buildIncidenceMatrixV1(
  edges: readonly DirectedEdgeV1[],
): readonly (readonly (-1 | 0 | 1)[])[] {
  const matrix = MAIN_WIRE_NON_CORONARY_CIRCULATION_NODE_NAMES_V1.map(
    (nodeName) => Object.freeze(edges.map((edge) =>
      edge.upstream === nodeName ? -1 as const
        : edge.downstream === nodeName ? 1 as const
          : 0 as const)),
  );
  for (let columnIndex = 0; columnIndex < edges.length; columnIndex += 1) {
    const column = matrix.map((row) => row[columnIndex]!);
    if (column.filter((entry) => entry === -1).length !== 1
        || column.filter((entry) => entry === 1).length !== 1
        || column.reduce<number>((sum, entry) => sum + entry, 0) !== 0) {
      throw new Error(`flow ${edges[columnIndex]!.flowName} has invalid incidence`);
    }
  }
  return Object.freeze(matrix);
}

function evaluateResolvedVascularEdgeV1(
  edge: ResolvedMainWireVascularEdgeV1,
  pressureByNode: Readonly<Record<MainWireNonCoronaryCirculationNodeNameV1, number>>,
  externalPressurePa: Readonly<{ pth: number; palv: number }>,
  dynamicFlowsM3PerSec: Readonly<Record<MainWireNonCoronaryDynamicFlowNameV1, number>>,
): MainWireVascularFlowEvaluationV1 {
  const upstreamAbsolutePressurePa = pressureByNode[edge.upstream];
  const downstreamAbsolutePressurePa = pressureByNode[edge.downstream];
  const waterfallCollapsePressurePa = edge.waterfall
    ? externalPressureForKindV1(edge.externalPressureKind, externalPressurePa)
      + edge.criticalTransmuralPressureMmHg * MAIN_WIRE_PASCAL_PER_MMHG_V1
    : null;
  const effectiveDownstreamPressurePa = waterfallCollapsePressurePa === null
    ? downstreamAbsolutePressurePa
    : smoothMaximumV1(
      downstreamAbsolutePressurePa,
      waterfallCollapsePressurePa,
      0.25 * MAIN_WIRE_PASCAL_PER_MMHG_V1,
    );
  const pressureGradientPa = upstreamAbsolutePressurePa - effectiveDownstreamPressurePa;
  const linearResistancePaSecPerM3 = edge.effectiveResistanceMmHgSecPerMl
    * MAIN_WIRE_RESISTANCE_SI_FACTOR_V1;
  const inertancePaSec2PerM3 = edge.effectiveInertanceMmHgSec2PerMl
    * MAIN_WIRE_INERTANCE_SI_FACTOR_V1;
  const quadraticResistancePaSec2PerM6 = edge.effectiveQuadraticLossMmHgSec2PerMl2
    * MAIN_WIRE_QUADRATIC_LOSS_SI_FACTOR_V1;
  if (edge.integrationClass === "algebraic-flow") {
    if (inertancePaSec2PerM3 !== 0) {
      throw new Error(`${edge.name} is algebraic but retains positive inertance`);
    }
    const flowM3PerSec = solveSignedLinearQuadraticLossV1(
      pressureGradientPa,
      linearResistancePaSecPerM3,
      quadraticResistancePaSec2PerM6,
    );
    const signedLossPressurePa = signedLinearQuadraticLossPressureV1(
      flowM3PerSec,
      linearResistancePaSecPerM3,
      quadraticResistancePaSec2PerM6,
    );
    return Object.freeze({
      integrationClass: "algebraic-flow" as const,
      flowName: edge.name as MainWireNonCoronaryAlgebraicFlowNameV1,
      upstreamAbsolutePressurePa,
      downstreamAbsolutePressurePa,
      effectiveDownstreamPressurePa,
      waterfallCollapsePressurePa,
      pressureGradientPa,
      linearResistancePaSecPerM3,
      quadraticResistancePaSec2PerM6,
      flowM3PerSec,
      signedLossPressurePa,
      momentumResidualPa: pressureGradientPa - signedLossPressurePa,
      dissipationW: flowM3PerSec * signedLossPressurePa,
    });
  }
  if (edge.name !== "Ao_SA" && edge.name !== "PA_PArt") {
    throw new Error(`unexpected dynamic main-wire vascular edge ${edge.name}`);
  }
  const flowM3PerSec = dynamicFlowsM3PerSec[edge.name];
  const signedLossPressurePa = signedLinearQuadraticLossPressureV1(
    flowM3PerSec,
    linearResistancePaSecPerM3,
    quadraticResistancePaSec2PerM6,
  );
  const flowAccelerationM3PerSec2 =
    (pressureGradientPa - signedLossPressurePa) / inertancePaSec2PerM3;
  return Object.freeze({
    integrationClass: "dynamic-flow-state" as const,
    flowName: edge.name,
    upstreamAbsolutePressurePa,
    downstreamAbsolutePressurePa,
    effectiveDownstreamPressurePa,
    waterfallCollapsePressurePa: null,
    pressureGradientPa,
    linearResistancePaSecPerM3,
    inertancePaSec2PerM3,
    quadraticResistancePaSec2PerM6,
    flowM3PerSec,
    signedLossPressurePa,
    flowAccelerationM3PerSec2,
    momentumResidualPa:
      inertancePaSec2PerM3 * flowAccelerationM3PerSec2
      + signedLossPressurePa - pressureGradientPa,
    lossDerivativePaSecPerM3:
      linearResistancePaSecPerM3
      + 2 * quadraticResistancePaSec2PerM6 * Math.abs(flowM3PerSec),
    kineticEnergyJ: 0.5 * inertancePaSec2PerM3 * flowM3PerSec * flowM3PerSec,
    dissipationW: flowM3PerSec * signedLossPressurePa,
  });
}

function solveSignedLinearQuadraticLossV1(
  pressureGradientPa: number,
  linearResistancePaSecPerM3: number,
  quadraticResistancePaSec2PerM6: number,
): number {
  const gradient = requireFinite(pressureGradientPa, "pressureGradientPa");
  const linear = requirePositiveFinite(
    linearResistancePaSecPerM3,
    "linearResistancePaSecPerM3",
  );
  const quadratic = requireNonNegativeFinite(
    quadraticResistancePaSec2PerM6,
    "quadraticResistancePaSec2PerM6",
  );
  if (gradient === 0) return 0;
  if (quadratic === 0) return gradient / linear;
  const magnitude = Math.abs(gradient);
  const discriminantRoot = Math.hypot(linear, 2 * Math.sqrt(quadratic * magnitude));
  const flowMagnitude = 2 * magnitude / (linear + discriminantRoot);
  return Math.sign(gradient) * flowMagnitude;
}

function signedLinearQuadraticLossPressureV1(
  flowM3PerSec: number,
  linearResistancePaSecPerM3: number,
  quadraticResistancePaSec2PerM6: number,
): number {
  const flow = requireFinite(flowM3PerSec, "flowM3PerSec");
  return linearResistancePaSecPerM3 * flow
    + quadraticResistancePaSec2PerM6 * flow * Math.abs(flow);
}

function smoothMaximumV1(first: number, second: number, width: number): number {
  const a = requireFinite(first, "smoothMaximum.first");
  const b = requireFinite(second, "smoothMaximum.second");
  const epsilon = requirePositiveFinite(width, "smoothMaximum.width");
  return 0.5 * (a + b + Math.hypot(a - b, epsilon));
}

function externalPressureForKindV1(
  kind: string,
  pressure: Readonly<{ pth: number; palv: number }>,
): number {
  if (kind === "none") return 0;
  if (kind === "pth") return pressure.pth;
  if (kind === "palv") return pressure.palv;
  throw new Error(`unsupported non-coronary external-pressure kind ${kind}`);
}

function requireDynamicVascularFlowV1(
  evaluation: MainWireVascularFlowEvaluationV1,
): MainWireVascularDynamicFlowEvaluationV1 {
  if (evaluation.integrationClass !== "dynamic-flow-state") {
    throw new Error(`${evaluation.flowName} is not a dynamic vascular edge`);
  }
  return evaluation;
}

function assertSixFlowGraphBoundaryV1(
  graph: ResolvedMainWireNonCoronaryHemodynamicGraphV1,
): void {
  const pulmonaryVenousOstium = graph.edges.find((edge) => edge.name === "PVein_LA");
  if (pulmonaryVenousOstium?.integrationClass === "dynamic-flow-state") {
    throw new Error(
      "main-wire six-flow V1 does not support PVein_LA L>0; use a separate seven-dynamic-flow variant",
    );
  }
  if (graph.dynamicEdgeNames.join(",") !== "Ao_SA,PA_PArt") {
    throw new Error("resolved main-wire vascular dynamic state boundary changed");
  }
  if (graph.algebraicEdgeNames.join(",")
      !== MAIN_WIRE_NON_CORONARY_ALGEBRAIC_FLOW_NAMES_V1.join(",")) {
    throw new Error("resolved main-wire vascular algebraic boundary changed");
  }
}

function assertPrecompiledContextV1(
  context: MainWireNonCoronaryPrecompiledContextV1,
): void {
  const sourceBinding =
    MAIN_WIRE_NON_CORONARY_PRECOMPILED_CONTEXT_SOURCE_BINDINGS_V1.get(context);
  if (sourceBinding === undefined) {
    throw new Error(
      "main-wire precompiled context must be compiler-issued and source-bound",
    );
  }
  assertExactPlainRecordV1(context, [
    "contextId",
    "resolvedGraph",
    "vascularPvLawByNode",
    "dynamicValveParametersByFlow",
    "internalPerformanceContextOnly",
    "physiologyOrNumericalAcceptanceClaimed",
    "claimBoundary",
  ], "main-wire precompiled context");
  if (context.contextId !== MAIN_WIRE_NON_CORONARY_PRECOMPILED_CONTEXT_V1_ID
      || context.internalPerformanceContextOnly !== true
      || context.physiologyOrNumericalAcceptanceClaimed !== false
      || context.claimBoundary
        !== "immutable parameter compilation only; pressure, flow, residual, inverse, and energy semantics unchanged") {
    throw new Error("main-wire precompiled context metadata is invalid");
  }
  if (!Object.isFrozen(context)
      || !Object.isFrozen(context.resolvedGraph)
      || !Object.isFrozen(context.resolvedGraph.runtimeControls)
      || !Object.isFrozen(context.vascularPvLawByNode)
      || !Object.isFrozen(context.dynamicValveParametersByFlow)) {
    throw new Error("main-wire precompiled context must be immutable");
  }
  if (context.resolvedGraph !== sourceBinding.resolvedGraph
      || context.vascularPvLawByNode !== sourceBinding.vascularPvLawByNode
      || context.dynamicValveParametersByFlow
        !== sourceBinding.dynamicValveParametersByFlow) {
    throw new Error(
      "main-wire precompiled context graph and PV laws lost their compiler source binding",
    );
  }
  assertSixFlowGraphBoundaryV1(context.resolvedGraph);
  assertExactPlainRecordV1(
    context.vascularPvLawByNode,
    MAIN_WIRE_NON_CORONARY_VASCULAR_NODE_NAMES_V1,
    "main-wire precompiled vascular PV laws",
  );
  for (const nodeName of MAIN_WIRE_NON_CORONARY_VASCULAR_NODE_NAMES_V1) {
    const compiled = context.vascularPvLawByNode[nodeName];
    if (!Object.isFrozen(compiled) || compiled.nodeName !== nodeName) {
      throw new Error(`main-wire precompiled PV law ${nodeName} is invalid`);
    }
  }
  assertExactPlainRecordV1(
    context.dynamicValveParametersByFlow,
    MAIN_WIRE_PHASE_B1_VALVE_FLOW_NAMES_V1,
    "main-wire precompiled dynamic valve parameters",
  );
  for (const flowName of MAIN_WIRE_PHASE_B1_VALVE_FLOW_NAMES_V1) {
    const compiled = context.dynamicValveParametersByFlow[flowName];
    if (!Object.isFrozen(compiled) || compiled.flowName !== flowName) {
      throw new Error(`main-wire dynamic valve parameter ${flowName} is invalid`);
    }
  }
}

function validateSameTimeLevelInputV1(
  input: MainWireNonCoronarySameTimeLevelInputV1,
): void {
  assertExactPlainRecordV1(input, [
    "state",
    "chamberAbsolutePressurePa",
    "externalPressurePa",
    "mainWireRuntimeControls",
  ], "input");
  assertExactPlainRecordV1(input.state, [
    "bloodVolumesM3",
    "dynamicFlowsM3PerSec",
    "valveApertureState01ByFlow",
  ], "input.state");
  assertExactPlainRecordV1(
    input.state.bloodVolumesM3,
    MAIN_WIRE_NON_CORONARY_CIRCULATION_NODE_NAMES_V1,
    "input.state.bloodVolumesM3",
  );
  assertExactPlainRecordV1(
    input.state.dynamicFlowsM3PerSec,
    MAIN_WIRE_NON_CORONARY_DYNAMIC_FLOW_NAMES_V1,
    "input.state.dynamicFlowsM3PerSec",
  );
  assertExactPlainRecordV1(
    input.state.valveApertureState01ByFlow,
    MAIN_WIRE_PHASE_B1_VALVE_FLOW_NAMES_V1,
    "input.state.valveApertureState01ByFlow",
  );
  assertExactPlainRecordV1(
    input.chamberAbsolutePressurePa,
    MAIN_WIRE_HEART_BOUNDARY_NODE_NAMES_V1,
    "input.chamberAbsolutePressurePa",
  );
  assertExactPlainRecordV1(
    input.externalPressurePa,
    ["pth", "palv"],
    "input.externalPressurePa",
  );
  for (const nodeName of MAIN_WIRE_NON_CORONARY_CIRCULATION_NODE_NAMES_V1) {
    requirePositiveFinite(
      input.state.bloodVolumesM3[nodeName],
      `input.state.bloodVolumesM3.${nodeName}`,
    );
  }
  for (const flowName of MAIN_WIRE_NON_CORONARY_DYNAMIC_FLOW_NAMES_V1) {
    requireFinite(
      input.state.dynamicFlowsM3PerSec[flowName],
      `input.state.dynamicFlowsM3PerSec.${flowName}`,
    );
  }
  for (const flowName of MAIN_WIRE_PHASE_B1_VALVE_FLOW_NAMES_V1) {
    const xi = requireFinite(
      input.state.valveApertureState01ByFlow[flowName],
      `input.state.valveApertureState01ByFlow.${flowName}`,
    );
    if (xi < 0 || xi > 1) {
      throw new Error(
        `input.state.valveApertureState01ByFlow.${flowName} must lie in [0,1]`,
      );
    }
  }
  for (const chamberName of MAIN_WIRE_HEART_BOUNDARY_NODE_NAMES_V1) {
    requireFinite(
      input.chamberAbsolutePressurePa[chamberName],
      `input.chamberAbsolutePressurePa.${chamberName}`,
    );
  }
  requireFinite(input.externalPressurePa.pth, "input.externalPressurePa.pth");
  requireFinite(input.externalPressurePa.palv, "input.externalPressurePa.palv");
}

function freezeRecordFromKeysV1<Key extends string, Value>(
  keys: readonly Key[],
  value: (key: Key, index: number) => Value,
): Readonly<Record<Key, Value>> {
  return Object.freeze(Object.fromEntries(
    keys.map((key, index) => [key, value(key, index)]),
  )) as Readonly<Record<Key, Value>>;
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
