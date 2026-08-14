import {
  NON_CORONARY_DYNAMIC_EDGE_NAMES_V1,
  NON_CORONARY_EDGE_NAMES_V1,
  NON_CORONARY_INDEPENDENT_NODE_NAMES_V1,
  NON_CORONARY_NODE_NAMES_V1,
  NON_CORONARY_VALVE_NAMES_V1,
} from "@/engine/core/nonCoronaryCirculationBackwardEulerV1";
import { buildEdges, buildNodes } from "@/engine/core/topology";
import { buildCoronaryTopologyV2 } from "@/engine/coronary/topologyPriorV2";
import {
  CORONARY_CONSERVED_VOLUME_NODE_IDS_V2,
  CORONARY_LAYER_IDS_V2,
  CORONARY_TERRITORY_IDS_V2,
} from "@/engine/coronary/typesV2";
import {
  MAIN_WIRE_COUPLED_HEMODYNAMICS_SOLVE_GROUP_ID_V1,
  MAIN_WIRE_COUPLED_HEMODYNAMICS_UPDATE_GROUP_ID_V1,
  MAIN_WIRE_NUMERICAL_BASE_TICK_SEC_V1,
  MAIN_WIRE_NUMERICAL_PRESENTATION_PERIOD_TICKS_V1,
} from "./MainWireNumericalClockV1";
import {
  MAIN_WIRE_FIVE_WALL_IDS_V1,
} from "@/engine/myocardium/mechanics/MainWireFiveWallLandTriSegProviderV1";
import {
  COUPLED_HEMODYNAMICS_TRISEG_UNKNOWN_IDS_V1,
  MAIN_WIRE_FIVE_WALL_COUPLED_SYSTEM_KERNEL_V1_ID,
} from "@/engine/vnext/coupled/CoupledHemodynamicsLayoutV1";
import {
  MODEL_DEFINITION_V1_SCHEMA_ID,
  NUMERICAL_POLICY_V1_SCHEMA_ID,
  type ModelComponentDefinitionV1,
  type ModelDefinitionV1,
  type ModelStateDefinitionV1,
  type NumericalPolicyV1,
} from "./ModelDefinitionV1";

export const MAIN_WIRE_MODEL_DEFINITION_V1_ID =
  "main-wire-hemodynamic-model-definition-v1" as const;

export const MAIN_WIRE_NUMERICAL_POLICY_V1_ID =
  "main-wire-static-condensed-be-policy-v1" as const;

const ACCEPTED_COMPONENT_ID = "accepted-transaction";
const NON_CORONARY_COMPONENT_ID = "noncoronary-circulation";
const CORONARY_COMPONENT_ID = "coronary-circulation";
const MECHANICS_COMPONENT_ID = "five-wall-mechanics";

const FIXED_TOTAL_BLOOD_VOLUME_STATE_ID =
  "circulation.fixedTotalBloodVolumeMl";
const DEPENDENT_SYSTEMIC_VENOUS_STATE_ID = "noncoronary.volume.SV";

/**
 * Checked-in scientific definition for the current one-patch hemodynamic
 * slice. It is build input only. The development exact runtime consumes its
 * compiled state/workspace layout and solve-block dispatch; component
 * equations and accepted-state promotion remain owned by the existing
 * scientific kernels until their later cutover gates are satisfied.
 */
export function createMainWireModelDefinitionV1(): ModelDefinitionV1 {
  const nonCoronaryNodeSpecs = new Map(
    buildNodes().map((node) => [node.name, node] as const),
  );
  const nonCoronaryEdgeSpecs = new Map(
    buildEdges().map((edge) => [edge.name, edge] as const),
  );
  const coronaryTopology = buildCoronaryTopologyV2();

  const components = Object.freeze([
    component(
      ACCEPTED_COMPONENT_ID,
      0,
      "accepted-transaction-kernel-v1",
      Object.freeze([
        state(
          "accepted.timeSec",
          0,
          "continuous-f64",
          "s",
          "/acceptedTimeSec",
        ),
        state(
          "accepted.revision",
          1,
          "continuous-f64",
          "1",
          "/revision",
        ),
        state(FIXED_TOTAL_BLOOD_VOLUME_STATE_ID, 2,
          "continuous-f64", "mL",
          "/coronary/fixedGlobalTotalBloodVolumeMl"),
      ]),
    ),
    component(
      NON_CORONARY_COMPONENT_ID,
      1,
      "noncoronary-backward-euler-kernel-v1",
      nonCoronaryStates(),
    ),
    component(
      CORONARY_COMPONENT_ID,
      2,
      "coronary-backward-euler-kernel-v2",
      coronaryStates(),
    ),
    component(
      MECHANICS_COMPONENT_ID,
      3,
      "five-wall-land-triseg-kernel-v1",
      mechanicsStates(),
    ),
  ]);

  const nonCoronaryNodes = NON_CORONARY_NODE_NAMES_V1.map(
    (nodeId, ordinal) => {
      if (!nonCoronaryNodeSpecs.has(nodeId)) {
        throw new Error(`Main Wire definition is missing node ${nodeId}`);
      }
      return Object.freeze({
        nodeId,
        ordinal,
        componentId: NON_CORONARY_COMPONENT_ID,
        storageStateId: `noncoronary.volume.${nodeId}`,
      });
    },
  );
  const coronaryNodes = coronaryTopology.nodes.map((node, index) =>
    Object.freeze({
      nodeId: node.nodeId,
      ordinal: nonCoronaryNodes.length + index,
      componentId: CORONARY_COMPONENT_ID,
      storageStateId: `coronary.volume.${node.nodeId}`,
    }));
  const nonCoronaryPaths = NON_CORONARY_EDGE_NAMES_V1.map(
    (pathId, ordinal) => {
      const edge = nonCoronaryEdgeSpecs.get(pathId);
      if (edge === undefined) {
        throw new Error(`Main Wire definition is missing path ${pathId}`);
      }
      return Object.freeze({
        pathId,
        ordinal,
        componentId: NON_CORONARY_COMPONENT_ID,
        upstreamNodeId: edge.up,
        downstreamNodeId: edge.down,
        kernelId: `noncoronary-flow/${edge.kind}`,
      });
    },
  );
  const coronaryPaths = coronaryTopology.edges.map((edge, index) =>
    Object.freeze({
      pathId: edge.edgeId,
      ordinal: nonCoronaryPaths.length + index,
      componentId: CORONARY_COMPONENT_ID,
      upstreamNodeId: edge.upstreamNodeId,
      downstreamNodeId: edge.downstreamNodeId,
      kernelId: `coronary-flow/${edge.kind}`,
    }));
  const bloodVolumeStateIds = Object.freeze([
    ...NON_CORONARY_NODE_NAMES_V1.map((nodeId) =>
      `noncoronary.volume.${nodeId}`),
    ...CORONARY_CONSERVED_VOLUME_NODE_IDS_V2.map((nodeId) =>
      `coronary.volume.${nodeId}`),
  ]);

  return Object.freeze({
    schemaId: MODEL_DEFINITION_V1_SCHEMA_ID,
    definitionId: MAIN_WIRE_MODEL_DEFINITION_V1_ID,
    components,
    hydraulicTopology: Object.freeze({
      nodes: Object.freeze([...nonCoronaryNodes, ...coronaryNodes]),
      paths: Object.freeze([...nonCoronaryPaths, ...coronaryPaths]),
      conservationPools: Object.freeze([
        Object.freeze({
          poolId: "global-blood-volume",
          ordinal: 0,
          ledgerStateId: FIXED_TOTAL_BLOOD_VOLUME_STATE_ID,
          memberStateIds: bloodVolumeStateIds,
          dependentStateId: DEPENDENT_SYSTEMIC_VENOUS_STATE_ID,
        }),
      ]),
    }),
  });
}

/** Current solver policy expressed independently from model topology. */
export function createMainWireNumericalPolicyV1(): NumericalPolicyV1 {
  const nonCoronaryStateIds = Object.freeze(
    NON_CORONARY_INDEPENDENT_NODE_NAMES_V1.map((nodeId) =>
      `noncoronary.volume.${nodeId}`),
  );
  const coronaryStateIds = Object.freeze(
    CORONARY_CONSERVED_VOLUME_NODE_IDS_V2.map((nodeId) =>
      `coronary.volume.${nodeId}`),
  );
  return Object.freeze({
    schemaId: NUMERICAL_POLICY_V1_SCHEMA_ID,
    policyId: MAIN_WIRE_NUMERICAL_POLICY_V1_ID,
    timebase: Object.freeze({
      baseTickSec: MAIN_WIRE_NUMERICAL_BASE_TICK_SEC_V1,
      presentationPeriodTicks:
        MAIN_WIRE_NUMERICAL_PRESENTATION_PERIOD_TICKS_V1,
    }),
    solveGroups: Object.freeze([
      Object.freeze({
        solveGroupId: MAIN_WIRE_COUPLED_HEMODYNAMICS_SOLVE_GROUP_ID_V1,
        ordinal: 0,
        systemKernelId: MAIN_WIRE_FIVE_WALL_COUPLED_SYSTEM_KERNEL_V1_ID,
        unknownBlocks: Object.freeze([
          Object.freeze({
            blockId: "nonCoronary",
            ordinal: 0,
            disposition: "retained" as const,
            stateIds: nonCoronaryStateIds,
            residualIds: Object.freeze(nonCoronaryStateIds.map((stateId) =>
              `${stateId}.balance`)),
          }),
          Object.freeze({
            blockId: "coronary",
            ordinal: 1,
            disposition: "retained" as const,
            stateIds: coronaryStateIds,
            residualIds: Object.freeze(coronaryStateIds.map((stateId) =>
              `${stateId}.balance`)),
          }),
          Object.freeze({
            blockId: "triSeg",
            ordinal: 2,
            disposition: "statically-condensed" as const,
            stateIds: COUPLED_HEMODYNAMICS_TRISEG_UNKNOWN_IDS_V1,
            residualIds: Object.freeze([
              "TriSeg.septalMidwallCapVolume.virtualWork",
              "TriSeg.junctionRadius.virtualWork",
            ]),
          }),
        ]),
        dependentStateIds: Object.freeze([
          DEPENDENT_SYSTEMIC_VENOUS_STATE_ID,
        ]),
        solver: Object.freeze({
          nonlinearMethod: "newton" as const,
          globalization: "armijo-line-search" as const,
          jacobian:
            "component-analytic-with-finite-difference-audit" as const,
          linearSolver: "dense-lu" as const,
          matrixStorage: "row-major-f64" as const,
        }),
      }),
    ]),
    updateGroups: Object.freeze([
      Object.freeze({
        updateGroupId: MAIN_WIRE_COUPLED_HEMODYNAMICS_UPDATE_GROUP_ID_V1,
        ordinal: 0,
        integration: "fixed-step-backward-euler" as const,
        periodTicks: 1,
        phaseTicks: 0,
        solveGroupId: MAIN_WIRE_COUPLED_HEMODYNAMICS_SOLVE_GROUP_ID_V1,
      }),
    ]),
  });
}

function nonCoronaryStates(): readonly ModelStateDefinitionV1[] {
  const states: ModelStateDefinitionV1[] = [];
  for (const nodeId of NON_CORONARY_NODE_NAMES_V1) {
    states.push(state(
      `noncoronary.volume.${nodeId}`,
      states.length,
      "continuous-f64",
      "mL",
      `/coronary/circulation/nodeVolumesMl/${nodeId}`,
    ));
  }
  for (const edgeId of NON_CORONARY_DYNAMIC_EDGE_NAMES_V1) {
    states.push(state(
      `noncoronary.flow.${edgeId}`,
      states.length,
      "continuous-f64",
      "mL/s",
      `/coronary/circulation/dynamicEdgeFlowsMlPerSec/${edgeId}`,
    ));
  }
  for (const valveId of NON_CORONARY_VALVE_NAMES_V1) {
    states.push(state(
      `noncoronary.valve.${valveId}.openingFraction01`,
      states.length,
      "continuous-f64",
      "1",
      "/coronary/circulation/valveStates/"
        + `${valveId}/leafletOpeningFraction01`,
    ));
  }
  return Object.freeze(states);
}

function coronaryStates(): readonly ModelStateDefinitionV1[] {
  const states: ModelStateDefinitionV1[] = [];
  for (const nodeId of CORONARY_CONSERVED_VOLUME_NODE_IDS_V2) {
    states.push(state(
      `coronary.volume.${nodeId}`,
      states.length,
      "continuous-f64",
      "mL",
      `/coronary/coronary/volumeMlByNode/${nodeId}`,
    ));
  }
  for (const territoryId of CORONARY_TERRITORY_IDS_V2) {
    for (const layerId of CORONARY_LAYER_IDS_V2) {
      states.push(state(
        `coronary.tone.${territoryId}.${layerId}`,
        states.length,
        "continuous-f64",
        "1",
        "/coronary/coronary/toneResistanceScaleByTerritoryLayer/"
          + `${territoryId}/${layerId}`,
      ));
    }
  }
  return Object.freeze(states);
}

function mechanicsStates(): readonly ModelStateDefinitionV1[] {
  const states: ModelStateDefinitionV1[] = [];
  for (const wallId of MAIN_WIRE_FIVE_WALL_IDS_V1) {
    for (let index = 0; index < 6; index += 1) {
      states.push(state(
        `mechanics.wall.${wallId}.land.${index}`,
        states.length,
        "continuous-f64",
        "model-state",
        "/coronary/mechanics/materialState/wallStateByWall/"
          + `${wallId}/landState/${index}`,
      ));
    }
    states.push(
      state(
        `mechanics.wall.${wallId}.sls.viscousLogStrain`,
        states.length,
        "continuous-f64",
        "1",
        "/coronary/mechanics/materialState/wallStateByWall/"
          + `${wallId}/slsState/viscousLogStrain`,
      ),
      state(
        `mechanics.wall.${wallId}.previousFiberLogStrain`,
        states.length + 1,
        "continuous-f64",
        "1",
        "/coronary/mechanics/materialState/wallStateByWall/"
          + `${wallId}/previousFiberLogStrain`,
      ),
      state(
        `mechanics.wall.${wallId}.previousFreeCalciumUM`,
        states.length + 2,
        "continuous-f64",
        "uM",
        "/coronary/mechanics/materialState/wallStateByWall/"
          + `${wallId}/previousFreeCalciumUM`,
      ),
    );
  }
  states.push(
    state(
      COUPLED_HEMODYNAMICS_TRISEG_UNKNOWN_IDS_V1[0],
      states.length,
      "continuous-f64",
      "m3",
      "/coronary/mechanics/materialState/trisegCoordinates/"
        + "septalMidwallCapVolumeM3",
    ),
    state(
      COUPLED_HEMODYNAMICS_TRISEG_UNKNOWN_IDS_V1[1],
      states.length + 1,
      "continuous-f64",
      "m",
      "/coronary/mechanics/materialState/trisegCoordinates/junctionRadiusM",
    ),
  );
  const mvcStates = Object.freeze([
    [
      "mechanics.mvc.referenceFiberLogStrain.LVFW",
      "continuous-f64",
      "1",
      "/coronary/mvcReferenceState/reference/"
        + "referenceFiberLogStrainByWall/LVFW",
    ],
    [
      "mechanics.mvc.referenceFiberLogStrain.SEP",
      "continuous-f64",
      "1",
      "/coronary/mvcReferenceState/reference/"
        + "referenceFiberLogStrainByWall/SEP",
    ],
    [
      "mechanics.mvc.referenceFiberLogStrain.RVFW",
      "continuous-f64",
      "1",
      "/coronary/mvcReferenceState/reference/"
        + "referenceFiberLogStrainByWall/RVFW",
    ],
    [
      "mechanics.mvc.referenceAcceptedTimeSec",
      "continuous-f64",
      "s",
      "/coronary/mvcReferenceState/referenceAcceptedTimeSec",
    ],
    [
      "mechanics.mvc.referenceRevision",
      "continuous-f64",
      "1",
      "/coronary/mvcReferenceState/referenceRevision",
    ],
    [
      "mechanics.mvc.mitralForwardFlowActive",
      "boolean-u8",
      "1",
      "/coronary/mvcReferenceState/mitralForwardFlowActive",
    ],
    [
      "mechanics.mvc.acceptedMitralClosureEventCount",
      "continuous-f64",
      "1",
      "/coronary/mvcReferenceState/acceptedMitralClosureEventCount",
    ],
  ] as const);
  for (const [stateId, storageKind, unit, authorityPointer] of mvcStates) {
    states.push(state(
      stateId,
      states.length,
      storageKind,
      unit,
      authorityPointer,
    ));
  }
  return Object.freeze(states);
}

function component(
  componentId: string,
  ordinal: number,
  kernelId: string,
  states: readonly ModelStateDefinitionV1[],
): ModelComponentDefinitionV1 {
  return Object.freeze({ componentId, ordinal, kernelId, states });
}

function state(
  stateId: string,
  ordinal: number,
  storageKind: ModelStateDefinitionV1["storageKind"],
  unit: string,
  authorityPointer: string,
): ModelStateDefinitionV1 {
  return Object.freeze({
    stateId,
    ordinal,
    storageKind,
    unit,
    authorityPointer,
  });
}
