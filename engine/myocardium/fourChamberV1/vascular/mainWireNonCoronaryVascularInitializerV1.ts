import {
  MAIN_WIRE_HEART_BOUNDARY_NODE_NAMES_V1,
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
import { assertExactPlainRecordV1 } from
  "@/engine/myocardium/fourChamberV1/validation/strictClosedRecordV1";
import {
  compileMainWireVascularPvLawSiV1,
  evaluateMainWireVascularPvAtPressureSiV1,
  type CompiledMainWireVascularPvLawSiV1,
  type MainWireVascularPvEvaluationSiV1,
} from "@/engine/myocardium/fourChamberV1/vascular/mainWireVascularPvLawSiV1";
import {
  MAIN_WIRE_PASCAL_PER_MMHG_V1,
  MAIN_WIRE_QUADRATIC_LOSS_SI_FACTOR_V1,
  MAIN_WIRE_RESISTANCE_SI_FACTOR_V1,
} from
  "@/engine/myocardium/fourChamberV1/vascular/mainWireNonCoronaryVascularTopologyV1";

export const MAIN_WIRE_NON_CORONARY_VASCULAR_INITIALIZER_V1_ID =
  "main-wire-non-coronary-vascular-initializer-v1" as const;

export const MAIN_WIRE_NON_CORONARY_INITIAL_DYNAMIC_ROOT_NAMES_V1 = Object.freeze([
  "Ao_SA",
  "PA_PArt",
] as const);

export const MAIN_WIRE_NON_CORONARY_INITIAL_ALGEBRAIC_FLOW_NAMES_V1 = Object.freeze([
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

export type MainWireNonCoronaryInitialDynamicRootNameV1 =
  (typeof MAIN_WIRE_NON_CORONARY_INITIAL_DYNAMIC_ROOT_NAMES_V1)[number];
export type MainWireNonCoronaryInitialAlgebraicFlowNameV1 =
  (typeof MAIN_WIRE_NON_CORONARY_INITIAL_ALGEBRAIC_FLOW_NAMES_V1)[number];

export type MainWireNonCoronaryVascularInitializerInputV1 = Readonly<{
  targetTotalBloodVolumeM3: number;
  chamberVolumeM3ByNode: Readonly<Record<MainWireHeartBoundaryNodeNameV1, number>>;
  chamberAbsolutePressurePaByNode: Readonly<
    Record<MainWireHeartBoundaryNodeNameV1, number>
  >;
  mainWireRuntimeControls: MainWireHemodynamicRuntimeControlsV1;
  externalPressurePa: Readonly<{
    pth: number;
    palv: number;
  }>;
}>;

export type MainWireNonCoronaryInitialVascularFlowPartitionV1 = Readonly<{
  dynamicRootFlowsM3PerSec: Readonly<
    Record<MainWireNonCoronaryInitialDynamicRootNameV1, number>
  >;
  algebraicFlowsM3PerSec: Readonly<
    Record<MainWireNonCoronaryInitialAlgebraicFlowNameV1, number>
  >;
}>;

export type MainWireNonCoronaryInitialEdgePressureDropAuditV1 = Readonly<{
  edgeName: MainWireNonCoronaryVascularEdgeNameV1;
  integrationClass: "dynamic-flow-state" | "algebraic-flow";
  upstreamAbsolutePressurePa: number;
  downstreamAbsolutePressurePa: number;
  effectiveDownstreamPressurePa: number;
  waterfallCollapsePressurePa: number | null;
  forwardFlowM3PerSec: number;
  signedLossPressurePa: number;
  pressureDropResidualPa: number;
}>;

export type MainWireNonCoronaryVascularInitializationV1 = Readonly<{
  initializerId: typeof MAIN_WIRE_NON_CORONARY_VASCULAR_INITIALIZER_V1_ID;
  units: Readonly<{
    volume: "m^3";
    pressure: "Pa";
    flow: "m^3/s";
  }>;
  targetTotalBloodVolumeM3: number;
  chamberVolumeM3ByNode: Readonly<Record<MainWireHeartBoundaryNodeNameV1, number>>;
  chamberAbsolutePressurePaByNode: Readonly<
    Record<MainWireHeartBoundaryNodeNameV1, number>
  >;
  vascularPvEvaluationByNode: Readonly<
    Record<MainWireNonCoronaryVascularNodeNameV1, MainWireVascularPvEvaluationSiV1>
  >;
  vascularVolumeM3ByNode: Readonly<
    Record<MainWireNonCoronaryVascularNodeNameV1, number>
  >;
  vascularAbsolutePressurePaByNode: Readonly<
    Record<MainWireNonCoronaryVascularNodeNameV1, number>
  >;
  commonConstructionFlowM3PerSec: number;
  vascularEdgeFlowM3PerSecByName: Readonly<
    Record<MainWireNonCoronaryVascularEdgeNameV1, number>
  >;
  solverFlowPartition: MainWireNonCoronaryInitialVascularFlowPartitionV1;
  edgePressureDropAuditByName: Readonly<
    Record<
      MainWireNonCoronaryVascularEdgeNameV1,
      MainWireNonCoronaryInitialEdgePressureDropAuditV1
    >
  >;
  audit: Readonly<{
    chamberBloodVolumeM3: number;
    vascularBloodVolumeM3: number;
    reconstructedTotalBloodVolumeM3: number;
    totalBloodVolumeResidualM3: number;
    relativeTotalBloodVolumeResidual: number;
    relativeTotalBloodVolumeTolerance: 1e-12;
    exactTotalBloodVolumeClosurePass: true;
    allVascularVolumesPositive: true;
    maximumAbsoluteEdgePressureDropResidualPa: number;
    edgePressureDropResidualTolerancePa: 1e-9;
    allEdgePressureDropResidualsPass: true;
    root: Readonly<{
      method: "deterministic-bracket-expansion-plus-bisection";
      lowerBracketFlowM3PerSec: number;
      upperBracketFlowM3PerSec: number;
      expansionIterations: number;
      supportBoundaryBisectionIterations: number;
      rootBisectionIterations: number;
    }>;
    provenance: Readonly<{
      graphAndParameterOwner:
        "engine/core/mainWireHemodynamicGraphV1.ts#resolveMainWireNonCoronaryHemodynamicGraphV1";
      vascularPvOwner:
        "engine/myocardium/fourChamberV1/vascular/mainWireVascularPvLawSiV1.ts";
      edgePressureApplicationReference:
        "engine/myocardium/fourChamberV1/hydromechanics/mainWireNonCoronarySameTimeLevelV1.ts";
      modelCoreNumericalRuntimeParityClaimed: false;
      coronaryNetworkIncluded: false;
      heartValvesIncluded: false;
    }>;
    claimBoundary: Readonly<{
      commonFlowPurpose: "quasi-steady fixed-boundary state construction";
      commonFlowIsNormalCardiacOutputClaim: false;
      cardiacOutputOrBloodPressureTargetUsed: false;
      pressureOrVolumePostProjectionApplied: false;
      runtimeControlOrPvParameterAdjustedAfterRoot: false;
      leftAndRightVentricularPressuresUsedForVascularRecursion: false;
      coronaryInitialStateClaimed: false;
    }>;
  }>;
}>;

type TrialV1 = Readonly<{
  commonForwardFlowM3PerSec: number;
  vascularPvEvaluationByNode: Readonly<
    Record<MainWireNonCoronaryVascularNodeNameV1, MainWireVascularPvEvaluationSiV1>
  >;
  edgePressureDropAuditByName: Readonly<
    Record<
      MainWireNonCoronaryVascularEdgeNameV1,
      MainWireNonCoronaryInitialEdgePressureDropAuditV1
    >
  >;
  vascularBloodVolumeM3: number;
  reconstructedTotalBloodVolumeM3: number;
  totalBloodVolumeResidualM3: number;
}>;

type RootResultV1 = Readonly<{
  trial: TrialV1;
  lowerBracketFlowM3PerSec: number;
  upperBracketFlowM3PerSec: number;
  expansionIterations: number;
  supportBoundaryBisectionIterations: number;
  rootBisectionIterations: number;
}>;

const SYSTEMIC_REVERSE_EDGE_ORDER_V1 = Object.freeze([
  "VC_RA",
  "SV_VC",
  "Cap_SV",
  "Art_Cap",
  "SA_Art",
  "Ao_SA",
] as const);

const PULMONARY_REVERSE_EDGE_ORDER_V1 = Object.freeze([
  "PVein_LA",
  "PVen_PVein",
  "PCap_PVen",
  "PArt_PCap",
  "PA_PArt",
] as const);

const RELATIVE_TBV_AUDIT_TOLERANCE_V1 = 1e-12 as const;
const RELATIVE_TBV_ROOT_TOLERANCE_V1 = 2e-14;
const EDGE_PRESSURE_DROP_RESIDUAL_TOLERANCE_PA_V1 = 1e-9 as const;
const INITIAL_UPPER_FLOW_M3_PER_SEC_V1 = 1e-6;
const MAXIMUM_EXPANSION_ITERATIONS_V1 = 64;
const MAXIMUM_SUPPORT_BOUNDARY_BISECTION_ITERATIONS_V1 = 128;
const MAXIMUM_ROOT_BISECTION_ITERATIONS_V1 = 128;
const WATERFALL_SMOOTHING_WIDTH_PA_V1 = 0.25 * MAIN_WIRE_PASCAL_PER_MMHG_V1;

/**
 * Construct the distributed non-coronary vascular state at fixed chamber
 * boundary pressures.  A single non-negative forward flow is the only solved
 * scalar.  No volume, pressure, PV parameter, or runtime control is projected
 * after that root.
 */
export function initializeMainWireNonCoronaryVascularStateV1(
  input: MainWireNonCoronaryVascularInitializerInputV1,
): MainWireNonCoronaryVascularInitializationV1 {
  validateInputV1(input);
  const targetTotalBloodVolumeM3 = requirePositiveFinite(
    input.targetTotalBloodVolumeM3,
    "input.targetTotalBloodVolumeM3",
  );
  const chamberBloodVolumeM3 = compensatedSumV1(
    MAIN_WIRE_HEART_BOUNDARY_NODE_NAMES_V1.map((nodeName) =>
      input.chamberVolumeM3ByNode[nodeName]),
  );
  if (!(chamberBloodVolumeM3 < targetTotalBloodVolumeM3)) {
    throw new Error("target TBV must exceed the fixed four-chamber blood volume");
  }

  const graph = resolveMainWireNonCoronaryHemodynamicGraphV1(
    input.mainWireRuntimeControls,
  );
  assertInitializerGraphBoundaryV1(graph);
  const compiledPvByNode = freezeRecordFromKeysV1(
    MAIN_WIRE_NON_CORONARY_VASCULAR_NODE_NAMES_V1,
    (nodeName) => compileMainWireVascularPvLawSiV1(nodeName, {
      venousTone: graph.runtimeControls.venousTone,
      arterialStiffness: graph.runtimeControls.arterialStiffness,
      ...(graph.runtimeControls.nodeOverrides === undefined
        ? {}
        : { nodeOverrides: graph.runtimeControls.nodeOverrides }),
    }),
  );
  const evaluateTrial = (commonForwardFlowM3PerSec: number) => evaluateTrialV1(
    commonForwardFlowM3PerSec,
    targetTotalBloodVolumeM3,
    chamberBloodVolumeM3,
    input.chamberAbsolutePressurePaByNode,
    input.externalPressurePa,
    graph,
    compiledPvByNode,
  );
  const root = solveCommonConstructionFlowV1(
    targetTotalBloodVolumeM3,
    evaluateTrial,
  );
  const trial = root.trial;
  const vascularVolumeM3ByNode = freezeRecordFromKeysV1(
    MAIN_WIRE_NON_CORONARY_VASCULAR_NODE_NAMES_V1,
    (nodeName) => trial.vascularPvEvaluationByNode[nodeName].physicalVolumeM3,
  );
  const vascularAbsolutePressurePaByNode = freezeRecordFromKeysV1(
    MAIN_WIRE_NON_CORONARY_VASCULAR_NODE_NAMES_V1,
    (nodeName) => trial.vascularPvEvaluationByNode[nodeName].absolutePressurePa,
  );
  const vascularEdgeFlowM3PerSecByName = freezeRecordFromKeysV1(
    MAIN_WIRE_NON_CORONARY_VASCULAR_EDGE_NAMES_V1,
    () => trial.commonForwardFlowM3PerSec,
  );
  const solverFlowPartition = buildMainWireNonCoronaryInitialVascularFlowsV1(
    trial.commonForwardFlowM3PerSec,
    graph.runtimeControls,
  );
  const relativeTotalBloodVolumeResidual = Math.abs(
    trial.totalBloodVolumeResidualM3,
  ) / targetTotalBloodVolumeM3;
  const allVascularVolumesPositive = MAIN_WIRE_NON_CORONARY_VASCULAR_NODE_NAMES_V1
    .every((nodeName) => vascularVolumeM3ByNode[nodeName] > 0);
  const maximumAbsoluteEdgePressureDropResidualPa = Math.max(
    ...MAIN_WIRE_NON_CORONARY_VASCULAR_EDGE_NAMES_V1.map((edgeName) => Math.abs(
      trial.edgePressureDropAuditByName[edgeName].pressureDropResidualPa,
    )),
  );
  if (!allVascularVolumesPositive) {
    throw new Error("main-wire initializer produced a non-positive vascular volume");
  }
  if (relativeTotalBloodVolumeResidual > RELATIVE_TBV_AUDIT_TOLERANCE_V1) {
    throw new Error("main-wire initializer did not close total blood volume");
  }
  if (
    maximumAbsoluteEdgePressureDropResidualPa
      > EDGE_PRESSURE_DROP_RESIDUAL_TOLERANCE_PA_V1
  ) {
    throw new Error("main-wire initializer did not close an edge pressure-drop residual");
  }

  return Object.freeze({
    initializerId: MAIN_WIRE_NON_CORONARY_VASCULAR_INITIALIZER_V1_ID,
    units: Object.freeze({
      volume: "m^3" as const,
      pressure: "Pa" as const,
      flow: "m^3/s" as const,
    }),
    targetTotalBloodVolumeM3,
    chamberVolumeM3ByNode: freezeRecordFromKeysV1(
      MAIN_WIRE_HEART_BOUNDARY_NODE_NAMES_V1,
      (nodeName) => input.chamberVolumeM3ByNode[nodeName],
    ),
    chamberAbsolutePressurePaByNode: freezeRecordFromKeysV1(
      MAIN_WIRE_HEART_BOUNDARY_NODE_NAMES_V1,
      (nodeName) => input.chamberAbsolutePressurePaByNode[nodeName],
    ),
    vascularPvEvaluationByNode: trial.vascularPvEvaluationByNode,
    vascularVolumeM3ByNode,
    vascularAbsolutePressurePaByNode,
    commonConstructionFlowM3PerSec: trial.commonForwardFlowM3PerSec,
    vascularEdgeFlowM3PerSecByName,
    solverFlowPartition,
    edgePressureDropAuditByName: trial.edgePressureDropAuditByName,
    audit: Object.freeze({
      chamberBloodVolumeM3,
      vascularBloodVolumeM3: trial.vascularBloodVolumeM3,
      reconstructedTotalBloodVolumeM3: trial.reconstructedTotalBloodVolumeM3,
      totalBloodVolumeResidualM3: trial.totalBloodVolumeResidualM3,
      relativeTotalBloodVolumeResidual,
      relativeTotalBloodVolumeTolerance: RELATIVE_TBV_AUDIT_TOLERANCE_V1,
      exactTotalBloodVolumeClosurePass: true as const,
      allVascularVolumesPositive: true as const,
      maximumAbsoluteEdgePressureDropResidualPa,
      edgePressureDropResidualTolerancePa:
        EDGE_PRESSURE_DROP_RESIDUAL_TOLERANCE_PA_V1,
      allEdgePressureDropResidualsPass: true as const,
      root: Object.freeze({
        method: "deterministic-bracket-expansion-plus-bisection" as const,
        lowerBracketFlowM3PerSec: root.lowerBracketFlowM3PerSec,
        upperBracketFlowM3PerSec: root.upperBracketFlowM3PerSec,
        expansionIterations: root.expansionIterations,
        supportBoundaryBisectionIterations:
          root.supportBoundaryBisectionIterations,
        rootBisectionIterations: root.rootBisectionIterations,
      }),
      provenance: Object.freeze({
        graphAndParameterOwner: (
          "engine/core/mainWireHemodynamicGraphV1.ts#resolveMainWireNonCoronaryHemodynamicGraphV1"
        ) as const,
        vascularPvOwner: (
          "engine/myocardium/fourChamberV1/vascular/mainWireVascularPvLawSiV1.ts"
        ) as const,
        edgePressureApplicationReference: (
          "engine/myocardium/fourChamberV1/hydromechanics/mainWireNonCoronarySameTimeLevelV1.ts"
        ) as const,
        modelCoreNumericalRuntimeParityClaimed: false as const,
        coronaryNetworkIncluded: false as const,
        heartValvesIncluded: false as const,
      }),
      claimBoundary: Object.freeze({
        commonFlowPurpose: "quasi-steady fixed-boundary state construction" as const,
        commonFlowIsNormalCardiacOutputClaim: false as const,
        cardiacOutputOrBloodPressureTargetUsed: false as const,
        pressureOrVolumePostProjectionApplied: false as const,
        runtimeControlOrPvParameterAdjustedAfterRoot: false as const,
        leftAndRightVentricularPressuresUsedForVascularRecursion: false as const,
        coronaryInitialStateClaimed: false as const,
      }),
    }),
  });
}

/**
 * Future solver hand-off: the two inertial root-flow states and the nine
 * algebraic edge roots, all initialized to the same construction flow.
 */
export function buildMainWireNonCoronaryInitialVascularFlowsV1(
  commonConstructionFlowM3PerSec: number,
  runtimeControls: MainWireHemodynamicRuntimeControlsV1,
): MainWireNonCoronaryInitialVascularFlowPartitionV1 {
  const flow = requireNonNegativeFinite(
    commonConstructionFlowM3PerSec,
    "commonConstructionFlowM3PerSec",
  );
  const graph = resolveMainWireNonCoronaryHemodynamicGraphV1(runtimeControls);
  assertInitializerGraphBoundaryV1(graph);
  return Object.freeze({
    dynamicRootFlowsM3PerSec: freezeRecordFromKeysV1(
      MAIN_WIRE_NON_CORONARY_INITIAL_DYNAMIC_ROOT_NAMES_V1,
      () => flow,
    ),
    algebraicFlowsM3PerSec: freezeRecordFromKeysV1(
      MAIN_WIRE_NON_CORONARY_INITIAL_ALGEBRAIC_FLOW_NAMES_V1,
      () => flow,
    ),
  });
}

function solveCommonConstructionFlowV1(
  targetTotalBloodVolumeM3: number,
  evaluateTrial: (flowM3PerSec: number) => TrialV1,
): RootResultV1 {
  let lowerTrial = evaluateTrial(0);
  if (Math.abs(lowerTrial.totalBloodVolumeResidualM3)
      <= targetTotalBloodVolumeM3 * RELATIVE_TBV_ROOT_TOLERANCE_V1) {
    return Object.freeze({
      trial: lowerTrial,
      lowerBracketFlowM3PerSec: 0,
      upperBracketFlowM3PerSec: 0,
      expansionIterations: 0,
      supportBoundaryBisectionIterations: 0,
      rootBisectionIterations: 0,
    });
  }
  if (lowerTrial.totalBloodVolumeResidualM3 > 0) {
    throw new Error(
      "target TBV is below the minimum supported non-negative-flow vascular volume",
    );
  }

  let expansionIterations = 0;
  let supportBoundaryBisectionIterations = 0;
  let candidateFlowM3PerSec = INITIAL_UPPER_FLOW_M3_PER_SEC_V1;
  let upperTrial: TrialV1 | null = null;
  let invalidUpperFlowM3PerSec: number | null = null;
  while (expansionIterations < MAXIMUM_EXPANSION_ITERATIONS_V1) {
    expansionIterations += 1;
    try {
      const candidateTrial = evaluateTrial(candidateFlowM3PerSec);
      assertMonotoneVolumeTrialV1(lowerTrial, candidateTrial);
      if (candidateTrial.totalBloodVolumeResidualM3 >= 0) {
        upperTrial = candidateTrial;
        break;
      }
      lowerTrial = candidateTrial;
      candidateFlowM3PerSec *= 2;
      if (!Number.isFinite(candidateFlowM3PerSec)) {
        throw new Error("main-wire initializer flow bracket overflowed");
      }
    } catch (error) {
      if (!isPvSupportErrorV1(error)) throw error;
      invalidUpperFlowM3PerSec = candidateFlowM3PerSec;
      break;
    }
  }

  if (upperTrial === null && invalidUpperFlowM3PerSec !== null) {
    let invalidFlow = invalidUpperFlowM3PerSec;
    for (
      let iteration = 0;
      iteration < MAXIMUM_SUPPORT_BOUNDARY_BISECTION_ITERATIONS_V1;
      iteration += 1
    ) {
      supportBoundaryBisectionIterations += 1;
      const midpointFlow = 0.5
        * (lowerTrial.commonForwardFlowM3PerSec + invalidFlow);
      if (!(midpointFlow > lowerTrial.commonForwardFlowM3PerSec)
          || !(midpointFlow < invalidFlow)) break;
      try {
        const midpointTrial = evaluateTrial(midpointFlow);
        assertMonotoneVolumeTrialV1(lowerTrial, midpointTrial);
        if (midpointTrial.totalBloodVolumeResidualM3 >= 0) {
          upperTrial = midpointTrial;
          break;
        }
        lowerTrial = midpointTrial;
      } catch (error) {
        if (!isPvSupportErrorV1(error)) throw error;
        invalidFlow = midpointFlow;
      }
    }
  }
  if (upperTrial === null) {
    throw new Error(
      "target TBV cannot be bracketed by a non-negative flow within main-wire PV support",
    );
  }

  let bestTrial = Math.abs(lowerTrial.totalBloodVolumeResidualM3)
      < Math.abs(upperTrial.totalBloodVolumeResidualM3)
    ? lowerTrial
    : upperTrial;
  const reportedLowerBracketFlowM3PerSec = lowerTrial.commonForwardFlowM3PerSec;
  const reportedUpperBracketFlowM3PerSec = upperTrial.commonForwardFlowM3PerSec;
  let rootBisectionIterations = 0;
  while (rootBisectionIterations < MAXIMUM_ROOT_BISECTION_ITERATIONS_V1) {
    if (Math.abs(bestTrial.totalBloodVolumeResidualM3)
        <= targetTotalBloodVolumeM3 * RELATIVE_TBV_ROOT_TOLERANCE_V1) break;
    const midpointFlow = 0.5 * (
      lowerTrial.commonForwardFlowM3PerSec
      + upperTrial.commonForwardFlowM3PerSec
    );
    if (!(midpointFlow > lowerTrial.commonForwardFlowM3PerSec)
        || !(midpointFlow < upperTrial.commonForwardFlowM3PerSec)) break;
    rootBisectionIterations += 1;
    const midpointTrial = evaluateTrial(midpointFlow);
    if (Math.abs(midpointTrial.totalBloodVolumeResidualM3)
        < Math.abs(bestTrial.totalBloodVolumeResidualM3)) {
      bestTrial = midpointTrial;
    }
    if (midpointTrial.totalBloodVolumeResidualM3 < 0) lowerTrial = midpointTrial;
    else upperTrial = midpointTrial;
  }
  if (Math.abs(bestTrial.totalBloodVolumeResidualM3)
      > targetTotalBloodVolumeM3 * RELATIVE_TBV_AUDIT_TOLERANCE_V1) {
    throw new Error("main-wire initializer bisection failed the TBV closure tolerance");
  }
  return Object.freeze({
    trial: bestTrial,
    lowerBracketFlowM3PerSec: reportedLowerBracketFlowM3PerSec,
    upperBracketFlowM3PerSec: reportedUpperBracketFlowM3PerSec,
    expansionIterations,
    supportBoundaryBisectionIterations,
    rootBisectionIterations,
  });
}

function evaluateTrialV1(
  commonForwardFlowM3PerSec: number,
  targetTotalBloodVolumeM3: number,
  chamberBloodVolumeM3: number,
  chamberAbsolutePressurePaByNode: Readonly<
    Record<MainWireHeartBoundaryNodeNameV1, number>
  >,
  externalPressurePa: Readonly<{ pth: number; palv: number }>,
  graph: ResolvedMainWireNonCoronaryHemodynamicGraphV1,
  compiledPvByNode: Readonly<
    Record<MainWireNonCoronaryVascularNodeNameV1, CompiledMainWireVascularPvLawSiV1>
  >,
): TrialV1 {
  const flow = requireNonNegativeFinite(
    commonForwardFlowM3PerSec,
    "commonForwardFlowM3PerSec",
  );
  const edgeByName = new Map(graph.edges.map((edge) => [edge.name, edge]));
  const absolutePressurePaByNode = new Map<
    MainWireNonCoronaryCirculationNodeNameV1,
    number
  >([
    ["LA", chamberAbsolutePressurePaByNode.LA],
    ["RA", chamberAbsolutePressurePaByNode.RA],
  ]);
  const edgeAuditByName = new Map<
    MainWireNonCoronaryVascularEdgeNameV1,
    MainWireNonCoronaryInitialEdgePressureDropAuditV1
  >();
  for (const edgeName of [
    ...SYSTEMIC_REVERSE_EDGE_ORDER_V1,
    ...PULMONARY_REVERSE_EDGE_ORDER_V1,
  ]) {
    const edge = edgeByName.get(edgeName);
    if (edge === undefined) throw new Error(`resolved main-wire edge ${edgeName} is missing`);
    const downstreamAbsolutePressurePa = absolutePressurePaByNode.get(edge.downstream);
    if (downstreamAbsolutePressurePa === undefined) {
      throw new Error(`downstream pressure for ${edge.name} is not recursively available`);
    }
    const waterfallCollapsePressurePa = edge.waterfall
      ? externalPressureForKindV1(edge.externalPressureKind, externalPressurePa)
        + edge.criticalTransmuralPressureMmHg * MAIN_WIRE_PASCAL_PER_MMHG_V1
      : null;
    const effectiveDownstreamPressurePa = waterfallCollapsePressurePa === null
      ? downstreamAbsolutePressurePa
      : smoothMaximumV1(
        downstreamAbsolutePressurePa,
        waterfallCollapsePressurePa,
        WATERFALL_SMOOTHING_WIDTH_PA_V1,
      );
    const signedLossPressurePa = edgePressureLossPaV1(edge, flow);
    const upstreamAbsolutePressurePa = requireFinite(
      effectiveDownstreamPressurePa + signedLossPressurePa,
      `${edge.name}.upstreamAbsolutePressurePa`,
    );
    if (absolutePressurePaByNode.has(edge.upstream)) {
      throw new Error(`upstream pressure for ${edge.name} was constructed twice`);
    }
    absolutePressurePaByNode.set(edge.upstream, upstreamAbsolutePressurePa);
    const pressureDropResidualPa = upstreamAbsolutePressurePa
      - effectiveDownstreamPressurePa - signedLossPressurePa;
    edgeAuditByName.set(edge.name, Object.freeze({
      edgeName: edge.name,
      integrationClass: edge.integrationClass,
      upstreamAbsolutePressurePa,
      downstreamAbsolutePressurePa,
      effectiveDownstreamPressurePa,
      waterfallCollapsePressurePa,
      forwardFlowM3PerSec: flow,
      signedLossPressurePa,
      pressureDropResidualPa,
    }));
  }
  if (edgeAuditByName.size !== MAIN_WIRE_NON_CORONARY_VASCULAR_EDGE_NAMES_V1.length) {
    throw new Error("main-wire initializer did not visit every vascular edge exactly once");
  }

  const vascularPvEvaluationByNode = freezeRecordFromKeysV1(
    MAIN_WIRE_NON_CORONARY_VASCULAR_NODE_NAMES_V1,
    (nodeName) => {
      const absolutePressurePa = absolutePressurePaByNode.get(nodeName);
      if (absolutePressurePa === undefined) {
        throw new Error(`vascular pressure for ${nodeName} was not constructed`);
      }
      const compiled = compiledPvByNode[nodeName];
      const nodeExternalPressurePa = externalPressureForKindV1(
        compiled.externalPressureKind,
        externalPressurePa,
      );
      const evaluated = evaluateMainWireVascularPvAtPressureSiV1(
        compiled,
        absolutePressurePa - nodeExternalPressurePa,
        nodeExternalPressurePa,
      );
      if (!(evaluated.physicalVolumeM3 > 0)) {
        throw new Error(`${nodeName} physical vascular volume must be positive`);
      }
      return evaluated;
    },
  );
  const vascularBloodVolumeM3 = compensatedSumV1(
    MAIN_WIRE_NON_CORONARY_VASCULAR_NODE_NAMES_V1.map((nodeName) =>
      vascularPvEvaluationByNode[nodeName].physicalVolumeM3),
  );
  const reconstructedTotalBloodVolumeM3 = requirePositiveFinite(
    chamberBloodVolumeM3 + vascularBloodVolumeM3,
    "reconstructedTotalBloodVolumeM3",
  );
  return Object.freeze({
    commonForwardFlowM3PerSec: flow,
    vascularPvEvaluationByNode,
    edgePressureDropAuditByName: freezeRecordFromKeysV1(
      MAIN_WIRE_NON_CORONARY_VASCULAR_EDGE_NAMES_V1,
      (edgeName) => {
        const audit = edgeAuditByName.get(edgeName);
        if (audit === undefined) throw new Error(`edge audit for ${edgeName} is missing`);
        return audit;
      },
    ),
    vascularBloodVolumeM3,
    reconstructedTotalBloodVolumeM3,
    totalBloodVolumeResidualM3:
      reconstructedTotalBloodVolumeM3 - targetTotalBloodVolumeM3,
  });
}

function edgePressureLossPaV1(
  edge: ResolvedMainWireVascularEdgeV1,
  forwardFlowM3PerSec: number,
): number {
  const linearResistancePaSecPerM3 = edge.effectiveResistanceMmHgSecPerMl
    * MAIN_WIRE_RESISTANCE_SI_FACTOR_V1;
  const quadraticResistancePaSec2PerM6 = edge.effectiveQuadraticLossMmHgSec2PerMl2
    * MAIN_WIRE_QUADRATIC_LOSS_SI_FACTOR_V1;
  return requireNonNegativeFinite(
    linearResistancePaSecPerM3 * forwardFlowM3PerSec
      + quadraticResistancePaSec2PerM6
        * forwardFlowM3PerSec * forwardFlowM3PerSec,
    `${edge.name}.signedLossPressurePa`,
  );
}

function assertInitializerGraphBoundaryV1(
  graph: ResolvedMainWireNonCoronaryHemodynamicGraphV1,
): void {
  if (graph.scope.coronaryNetworkIncluded || graph.scope.valvesIncluded) {
    throw new Error("main-wire initializer graph scope unexpectedly includes coronary or valve edges");
  }
  if (graph.dynamicEdgeNames.join(",")
      !== MAIN_WIRE_NON_CORONARY_INITIAL_DYNAMIC_ROOT_NAMES_V1.join(",")) {
    throw new Error("main-wire initializer dynamic root-flow boundary changed");
  }
  if (graph.algebraicEdgeNames.join(",")
      !== MAIN_WIRE_NON_CORONARY_INITIAL_ALGEBRAIC_FLOW_NAMES_V1.join(",")) {
    throw new Error("main-wire initializer algebraic-flow boundary changed");
  }
}

function assertMonotoneVolumeTrialV1(lower: TrialV1, upper: TrialV1): void {
  if (!(upper.commonForwardFlowM3PerSec > lower.commonForwardFlowM3PerSec)) {
    throw new Error("main-wire initializer trial flow did not increase");
  }
  const roundoffToleranceM3 = 8 * Number.EPSILON * Math.max(
    1,
    Math.abs(lower.reconstructedTotalBloodVolumeM3),
    Math.abs(upper.reconstructedTotalBloodVolumeM3),
  );
  if (upper.reconstructedTotalBloodVolumeM3
      < lower.reconstructedTotalBloodVolumeM3 - roundoffToleranceM3) {
    throw new Error("main-wire initializer TBV map decreased as flow increased");
  }
}

function validateInputV1(input: MainWireNonCoronaryVascularInitializerInputV1): void {
  assertExactPlainRecordV1(input, [
    "targetTotalBloodVolumeM3",
    "chamberVolumeM3ByNode",
    "chamberAbsolutePressurePaByNode",
    "mainWireRuntimeControls",
    "externalPressurePa",
  ], "input");
  assertExactPlainRecordV1(
    input.chamberVolumeM3ByNode,
    MAIN_WIRE_HEART_BOUNDARY_NODE_NAMES_V1,
    "input.chamberVolumeM3ByNode",
  );
  assertExactPlainRecordV1(
    input.chamberAbsolutePressurePaByNode,
    MAIN_WIRE_HEART_BOUNDARY_NODE_NAMES_V1,
    "input.chamberAbsolutePressurePaByNode",
  );
  assertRequiredAndOptionalPlainRecordKeysV1(input.mainWireRuntimeControls, [
    "venousTone",
    "arterialStiffness",
    "systemicResistance",
    "pulmonaryResistance",
    "useChiResistance",
  ], [
    "nodeOverrides",
    "edgeOverrides",
  ], "input.mainWireRuntimeControls");
  assertExactPlainRecordV1(input.externalPressurePa, [
    "pth",
    "palv",
  ], "input.externalPressurePa");
  requirePositiveFinite(
    input.targetTotalBloodVolumeM3,
    "input.targetTotalBloodVolumeM3",
  );
  for (const nodeName of MAIN_WIRE_HEART_BOUNDARY_NODE_NAMES_V1) {
    requirePositiveFinite(
      input.chamberVolumeM3ByNode[nodeName],
      `input.chamberVolumeM3ByNode.${nodeName}`,
    );
    requireFinite(
      input.chamberAbsolutePressurePaByNode[nodeName],
      `input.chamberAbsolutePressurePaByNode.${nodeName}`,
    );
  }
  requireFinite(input.externalPressurePa.pth, "input.externalPressurePa.pth");
  requireFinite(input.externalPressurePa.palv, "input.externalPressurePa.palv");
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

function smoothMaximumV1(first: number, second: number, width: number): number {
  const a = requireFinite(first, "smoothMaximum.first");
  const b = requireFinite(second, "smoothMaximum.second");
  const epsilon = requirePositiveFinite(width, "smoothMaximum.width");
  return 0.5 * (a + b + Math.hypot(a - b, epsilon));
}

function isPvSupportErrorV1(error: unknown): boolean {
  return error instanceof Error
    && /outside main-wire inverse support/.test(error.message);
}

function assertRequiredAndOptionalPlainRecordKeysV1(
  value: unknown,
  requiredKeys: readonly string[],
  optionalKeys: readonly string[],
  field: string,
): asserts value is Record<string, unknown> {
  if (
    value === null
    || typeof value !== "object"
    || Object.getPrototypeOf(value) !== Object.prototype
  ) {
    throw new Error(`${field} must be a plain object`);
  }
  const ownNames = Object.getOwnPropertyNames(value);
  const allowed = new Set([...requiredKeys, ...optionalKeys]);
  const undeclared = ownNames.filter((key) => !allowed.has(key));
  const missing = requiredKeys.filter((key) => !ownNames.includes(key));
  if (undeclared.length !== 0 || missing.length !== 0) {
    throw new Error(
      `${field} has invalid keys; undeclared=[${undeclared.join(", ")}], `
      + `missing=[${missing.join(", ")}]`,
    );
  }
}

function compensatedSumV1(values: readonly number[]): number {
  let sum = 0;
  let correction = 0;
  for (const rawValue of values) {
    const value = requireFinite(rawValue, "sum.value");
    const adjusted = value - correction;
    const next = sum + adjusted;
    correction = (next - sum) - adjusted;
    sum = next;
  }
  return requireFinite(sum, "sum.total");
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
