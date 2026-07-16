import {
  MAIN_WIRE_NON_CORONARY_CIRCULATION_NODE_NAMES_V1,
  MAIN_WIRE_NON_CORONARY_VASCULAR_NODE_NAMES_V1,
  type MainWireNonCoronaryCirculationNodeNameV1,
  type MainWireNonCoronaryVascularNodeNameV1,
} from "@/engine/core/mainWireHemodynamicGraphV1";
import {
  MAIN_WIRE_NON_CORONARY_DYNAMIC_FLOW_NAMES_V1,
  type MainWireNonCoronaryDynamicFlowNameV1,
} from "@/engine/myocardium/fourChamberV1/hydromechanics/mainWireNonCoronarySameTimeLevelV1";
import type {
  RateFreeLand2017StateV1,
} from "@/engine/myocardium/fourChamberV1/land/rateFreeLand2017V1";
import { RATE_FREE_LAND2017_STATE_LABELS_V1 } from
  "@/engine/myocardium/fourChamberV1/land/rateFreeLand2017V1";
import type {
  PhaseB1CalciumStateByWallV1,
  PhaseB1EndpointStateV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1EndpointStateV1";
import type {
  PhaseB1SlsModeV1,
  PhaseB1TriSegCoordinatesV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1StoredStateNewtonTopologyV1";
import {
  WALL_IDS,
  type FourChamberWallId,
} from "@/engine/myocardium/fourChamberV1/topology/contracts";
import {
  assertDensePlainArrayV1,
  assertExactPlainRecordV1,
} from "@/engine/myocardium/fourChamberV1/validation/strictClosedRecordV1";

export const PHASE_B1_MAIN_WIRE_DISTRIBUTED_ENDPOINT_V1_ID =
  "four-chamber-phase-b1-main-wire-distributed-endpoint-v1" as const;

export const PHASE_B1_MAIN_WIRE_DISTRIBUTED_TOPOLOGY_V1 = Object.freeze({
  topologyId: "four-chamber-phase-b1-main-wire-distributed-topology-v1",
  circulationNodeOrder: MAIN_WIRE_NON_CORONARY_CIRCULATION_NODE_NAMES_V1,
  dynamicFlowOrder: MAIN_WIRE_NON_CORONARY_DYNAMIC_FLOW_NAMES_V1,
  wallOrder: WALL_IDS,
  storedDifferentialStateCount: Object.freeze({
    slsOn: 66,
    slsOff: 61,
  }),
  newtonUnknownCount: Object.freeze({
    slsOn: 58,
    slsOff: 53,
  }),
  newtonResidualCount: Object.freeze({
    slsOn: 58,
    slsOff: 53,
  }),
  exactCalciumStoredStateCount: 10,
  exactCalciumNewtonUnknownCount: 0,
  exactCalciumResidualCount: 0,
  algebraicTriSegCoordinateCount: 2,
  slsOffRepresentation: "physically-absent-no-placeholder",
  projectionApplied: false,
  hiddenStateClippingApplied: false,
} as const);

type DistributedCommonStateV1 = Readonly<{
  bloodVolumesM3: Readonly<
    Record<MainWireNonCoronaryCirculationNodeNameV1, number>
  >;
  dynamicFlowsM3PerSec: Readonly<
    Record<MainWireNonCoronaryDynamicFlowNameV1, number>
  >;
  calciumByWall: PhaseB1CalciumStateByWallV1;
  landByWall: Readonly<Record<FourChamberWallId, RateFreeLand2017StateV1>>;
}>;

export type PhaseB1MainWireDistributedDifferentialStateV1 =
  | (DistributedCommonStateV1 & Readonly<{
      slsMode: "on";
      slsAlphaVByWall: Readonly<Record<FourChamberWallId, number>>;
    }>)
  | (DistributedCommonStateV1 & Readonly<{
      slsMode: "off";
    }>);

export type PhaseB1MainWireDistributedEndpointV1 = Readonly<{
  stateId: typeof PHASE_B1_MAIN_WIRE_DISTRIBUTED_ENDPOINT_V1_ID;
  timeSec: number;
  differentialState: PhaseB1MainWireDistributedDifferentialStateV1;
  triSegCoordinates: PhaseB1TriSegCoordinatesV1;
}>;

export type PhaseB1MainWireDistributedNewtonStateV1 =
  | Readonly<{
      slsMode: "on";
      bloodVolumesM3: Readonly<
        Record<MainWireNonCoronaryCirculationNodeNameV1, number>
      >;
      dynamicFlowsM3PerSec: Readonly<
        Record<MainWireNonCoronaryDynamicFlowNameV1, number>
      >;
      landByWall: Readonly<Record<FourChamberWallId, RateFreeLand2017StateV1>>;
      slsAlphaVByWall: Readonly<Record<FourChamberWallId, number>>;
      triSegCoordinates: PhaseB1TriSegCoordinatesV1;
    }>
  | Readonly<{
      slsMode: "off";
      bloodVolumesM3: Readonly<
        Record<MainWireNonCoronaryCirculationNodeNameV1, number>
      >;
      dynamicFlowsM3PerSec: Readonly<
        Record<MainWireNonCoronaryDynamicFlowNameV1, number>
      >;
      landByWall: Readonly<Record<FourChamberWallId, RateFreeLand2017StateV1>>;
      triSegCoordinates: PhaseB1TriSegCoordinatesV1;
    }>;

export type PhaseB1MainWireDistributedEndpointTransformV1 = Readonly<{
  endpoint: PhaseB1MainWireDistributedEndpointV1;
  audit: Readonly<{
    sourceEndpointStateId: PhaseB1EndpointStateV1["stateId"];
    chamberVolumesCopiedExactly: true;
    valveFlowsCopiedExactly: true;
    suppliedVascularVolumeCount: 11;
    suppliedRootDynamicFlowCount: 2;
    vascularInitializationInferred: false;
    parameterFitApplied: false;
    legacyAggregateVascularVolumesImported: false;
    legacyInletFlowsImported: false;
  }>;
}>;

const STORED_LABELS_ON = buildStoredLabels("on");
const STORED_LABELS_OFF = buildStoredLabels("off");
const NEWTON_LABELS_ON = buildNewtonLabels("on");
const NEWTON_LABELS_OFF = buildNewtonLabels("off");

export function createPhaseB1MainWireDistributedEndpointV1(input: Readonly<{
  timeSec: number;
  differentialState: PhaseB1MainWireDistributedDifferentialStateV1;
  triSegCoordinates: PhaseB1TriSegCoordinatesV1;
}>): PhaseB1MainWireDistributedEndpointV1 {
  assertExactPlainRecordV1(
    input,
    ["timeSec", "differentialState", "triSegCoordinates"],
    "Phase B1 main-wire distributed endpoint input",
  );
  const mode = readSlsMode(
    input.differentialState,
    "Phase B1 main-wire distributed differential state",
  );
  const differentialState = decodePhaseB1MainWireDistributedStoredStateV1(
    encodePhaseB1MainWireDistributedStoredStateV1(input.differentialState),
    mode,
  );
  return Object.freeze({
    stateId: PHASE_B1_MAIN_WIRE_DISTRIBUTED_ENDPOINT_V1_ID,
    timeSec: requireNonNegativeFinite(input.timeSec, "timeSec"),
    differentialState,
    triSegCoordinates: copyTriSeg(input.triSegCoordinates),
  });
}

export function encodePhaseB1MainWireDistributedStoredStateV1(
  value: unknown,
): readonly number[] {
  const state = normalizeDifferentialState(value);
  const encoded = [
    ...MAIN_WIRE_NON_CORONARY_CIRCULATION_NODE_NAMES_V1.map(
      (nodeName) => state.bloodVolumesM3[nodeName],
    ),
    ...MAIN_WIRE_NON_CORONARY_DYNAMIC_FLOW_NAMES_V1.map(
      (flowName) => state.dynamicFlowsM3PerSec[flowName],
    ),
  ];
  for (const wallId of WALL_IDS) {
    encoded.push(
      state.calciumByWall[wallId].r,
      state.calciumByWall[wallId].d,
      ...state.landByWall[wallId],
    );
    if (state.slsMode === "on") {
      encoded.push(state.slsAlphaVByWall[wallId]);
    }
  }
  const expected = storedCount(state.slsMode);
  if (encoded.length !== expected) {
    throw new Error(`distributed stored encoder expected ${expected} values`);
  }
  return Object.freeze(encoded);
}

export function decodePhaseB1MainWireDistributedStoredStateV1(
  encoded: unknown,
  mode: unknown,
): PhaseB1MainWireDistributedDifferentialStateV1 {
  const slsMode = requireSlsMode(mode, "distributed stored-state mode");
  const expected = storedCount(slsMode);
  assertDensePlainArrayV1(encoded, expected, "distributed stored-state vector");
  let offset = 0;
  const bloodVolumesM3 = numericRecordFromVector(
    encoded,
    MAIN_WIRE_NON_CORONARY_CIRCULATION_NODE_NAMES_V1,
    () => offset++,
    "bloodVolumesM3",
    requirePositiveFinite,
  );
  const dynamicFlowsM3PerSec = numericRecordFromVector(
    encoded,
    MAIN_WIRE_NON_CORONARY_DYNAMIC_FLOW_NAMES_V1,
    () => offset++,
    "dynamicFlowsM3PerSec",
    requireFinite,
  );
  const calciumEntries: Array<readonly [FourChamberWallId, Readonly<{
    r: number;
    d: number;
  }>]> = [];
  const landEntries: Array<readonly [FourChamberWallId, RateFreeLand2017StateV1]> = [];
  const slsEntries: Array<readonly [FourChamberWallId, number]> = [];
  for (const wallId of WALL_IDS) {
    const r = requireNonNegativeFinite(
      encoded[offset++],
      `calciumByWall.${wallId}.r`,
    );
    const d = requireNonNegativeFinite(
      encoded[offset++],
      `calciumByWall.${wallId}.d`,
    );
    if (d < r) throw new Error(`calciumByWall.${wallId} requires d >= r`);
    calciumEntries.push([wallId, Object.freeze({ r, d })]);
    landEntries.push([
      wallId,
      landVectorFromValues(encoded, () => offset++, wallId),
    ]);
    if (slsMode === "on") {
      slsEntries.push([
        wallId,
        requireFinite(encoded[offset++], `slsAlphaVByWall.${wallId}`),
      ]);
    }
  }
  if (offset !== expected) throw new Error("distributed stored decoder offset drifted");
  const common = Object.freeze({
    bloodVolumesM3,
    dynamicFlowsM3PerSec,
    calciumByWall: Object.freeze(Object.fromEntries(calciumEntries)) as
      PhaseB1CalciumStateByWallV1,
    landByWall: Object.freeze(Object.fromEntries(landEntries)) as Readonly<
      Record<FourChamberWallId, RateFreeLand2017StateV1>
    >,
  });
  return slsMode === "on"
    ? Object.freeze({
        ...common,
        slsMode: "on" as const,
        slsAlphaVByWall: Object.freeze(Object.fromEntries(slsEntries)) as
          Readonly<Record<FourChamberWallId, number>>,
      })
    : Object.freeze({ ...common, slsMode: "off" as const });
}

export function encodePhaseB1MainWireDistributedNewtonStateV1(
  value: unknown,
): readonly number[] {
  const state = normalizeNewtonState(value);
  const encoded = [
    ...MAIN_WIRE_NON_CORONARY_CIRCULATION_NODE_NAMES_V1.map(
      (nodeName) => state.bloodVolumesM3[nodeName],
    ),
    ...MAIN_WIRE_NON_CORONARY_DYNAMIC_FLOW_NAMES_V1.map(
      (flowName) => state.dynamicFlowsM3PerSec[flowName],
    ),
    ...WALL_IDS.flatMap((wallId) => state.landByWall[wallId]),
    ...(state.slsMode === "on"
      ? WALL_IDS.map((wallId) => state.slsAlphaVByWall[wallId])
      : []),
    state.triSegCoordinates.V_m_S,
    state.triSegCoordinates.y_m,
  ];
  const expected = newtonCount(state.slsMode);
  if (encoded.length !== expected) {
    throw new Error(`distributed Newton encoder expected ${expected} values`);
  }
  return Object.freeze(encoded);
}

export function decodePhaseB1MainWireDistributedNewtonStateV1(
  encoded: unknown,
  mode: unknown,
): PhaseB1MainWireDistributedNewtonStateV1 {
  const slsMode = requireSlsMode(mode, "distributed Newton mode");
  const expected = newtonCount(slsMode);
  assertDensePlainArrayV1(encoded, expected, "distributed Newton vector");
  let offset = 0;
  const bloodVolumesM3 = numericRecordFromVector(
    encoded,
    MAIN_WIRE_NON_CORONARY_CIRCULATION_NODE_NAMES_V1,
    () => offset++,
    "bloodVolumesM3",
    requirePositiveFinite,
  );
  const dynamicFlowsM3PerSec = numericRecordFromVector(
    encoded,
    MAIN_WIRE_NON_CORONARY_DYNAMIC_FLOW_NAMES_V1,
    () => offset++,
    "dynamicFlowsM3PerSec",
    requireFinite,
  );
  const landByWall = Object.freeze(Object.fromEntries(WALL_IDS.map((wallId) => [
    wallId,
    landVectorFromValues(encoded, () => offset++, wallId),
  ]))) as Readonly<Record<FourChamberWallId, RateFreeLand2017StateV1>>;
  const slsAlphaVByWall = slsMode === "on"
    ? Object.freeze(Object.fromEntries(WALL_IDS.map((wallId) => [
        wallId,
        requireFinite(encoded[offset++], `slsAlphaVByWall.${wallId}`),
      ]))) as Readonly<Record<FourChamberWallId, number>>
    : null;
  const triSegCoordinates = Object.freeze({
    V_m_S: requireFinite(encoded[offset++], "triSegCoordinates.V_m_S"),
    y_m: requirePositiveFinite(encoded[offset++], "triSegCoordinates.y_m"),
  });
  if (offset !== expected) throw new Error("distributed Newton decoder offset drifted");
  const common = Object.freeze({
    bloodVolumesM3,
    dynamicFlowsM3PerSec,
    landByWall,
    triSegCoordinates,
  });
  return slsMode === "on"
    ? Object.freeze({
        ...common,
        slsMode: "on" as const,
        slsAlphaVByWall: slsAlphaVByWall!,
      })
    : Object.freeze({ ...common, slsMode: "off" as const });
}

export function encodePhaseB1MainWireDistributedEndpointNewtonUnknownsV1(
  endpoint: PhaseB1MainWireDistributedEndpointV1,
): readonly number[] {
  assertEndpoint(endpoint);
  const state = endpoint.differentialState;
  return encodePhaseB1MainWireDistributedNewtonStateV1(
    state.slsMode === "on"
      ? {
          slsMode: "on",
          bloodVolumesM3: state.bloodVolumesM3,
          dynamicFlowsM3PerSec: state.dynamicFlowsM3PerSec,
          landByWall: state.landByWall,
          slsAlphaVByWall: state.slsAlphaVByWall,
          triSegCoordinates: endpoint.triSegCoordinates,
        }
      : {
          slsMode: "off",
          bloodVolumesM3: state.bloodVolumesM3,
          dynamicFlowsM3PerSec: state.dynamicFlowsM3PerSec,
          landByWall: state.landByWall,
          triSegCoordinates: endpoint.triSegCoordinates,
        },
  );
}

export function decodePhaseB1MainWireDistributedEndpointNewtonUnknownsV1(
  input: Readonly<{
    timeSec: number;
    slsMode: PhaseB1SlsModeV1;
    calciumByWall: PhaseB1CalciumStateByWallV1;
    unknowns: readonly number[];
  }>,
): PhaseB1MainWireDistributedEndpointV1 {
  assertExactPlainRecordV1(
    input,
    ["timeSec", "slsMode", "calciumByWall", "unknowns"],
    "distributed endpoint Newton decode input",
  );
  const state = decodePhaseB1MainWireDistributedNewtonStateV1(
    input.unknowns,
    input.slsMode,
  );
  const differentialState: PhaseB1MainWireDistributedDifferentialStateV1 =
    state.slsMode === "on"
      ? Object.freeze({
          slsMode: "on" as const,
          bloodVolumesM3: state.bloodVolumesM3,
          dynamicFlowsM3PerSec: state.dynamicFlowsM3PerSec,
          calciumByWall: copyCalcium(input.calciumByWall),
          landByWall: state.landByWall,
          slsAlphaVByWall: state.slsAlphaVByWall,
        })
      : Object.freeze({
          slsMode: "off" as const,
          bloodVolumesM3: state.bloodVolumesM3,
          dynamicFlowsM3PerSec: state.dynamicFlowsM3PerSec,
          calciumByWall: copyCalcium(input.calciumByWall),
          landByWall: state.landByWall,
        });
  return createPhaseB1MainWireDistributedEndpointV1({
    timeSec: input.timeSec,
    differentialState,
    triSegCoordinates: state.triSegCoordinates,
  });
}

export function buildPhaseB1MainWireDistributedStoredLabelsV1(
  mode: PhaseB1SlsModeV1,
): readonly string[] {
  return requireSlsMode(mode, "stored label mode") === "on"
    ? STORED_LABELS_ON
    : STORED_LABELS_OFF;
}

export function buildPhaseB1MainWireDistributedNewtonUnknownLabelsV1(
  mode: PhaseB1SlsModeV1,
): readonly string[] {
  return requireSlsMode(mode, "Newton label mode") === "on"
    ? NEWTON_LABELS_ON
    : NEWTON_LABELS_OFF;
}

export function buildPhaseB1MainWireDistributedNewtonResidualLabelsV1(
  mode: PhaseB1SlsModeV1,
): readonly string[] {
  const labels = buildPhaseB1MainWireDistributedNewtonUnknownLabelsV1(mode);
  return Object.freeze(labels.map((label) => label.startsWith("algebraic.triseg.")
    ? `residual.${label}.equilibrium`
    : `residual.${label}`));
}

export function transformPhaseB1EndpointToMainWireDistributedV1(input: Readonly<{
  sourceEndpoint: PhaseB1EndpointStateV1;
  vascularBloodVolumesM3: Readonly<
    Record<MainWireNonCoronaryVascularNodeNameV1, number>
  >;
  rootDynamicFlowsM3PerSec: Readonly<Record<"Ao_SA" | "PA_PArt", number>>;
}>): PhaseB1MainWireDistributedEndpointTransformV1 {
  assertExactPlainRecordV1(
    input,
    ["sourceEndpoint", "vascularBloodVolumesM3", "rootDynamicFlowsM3PerSec"],
    "Phase B1 main-wire distributed transform input",
  );
  assertExactPlainRecordV1(
    input.vascularBloodVolumesM3,
    MAIN_WIRE_NON_CORONARY_VASCULAR_NODE_NAMES_V1,
    "vascularBloodVolumesM3",
  );
  assertExactPlainRecordV1(
    input.rootDynamicFlowsM3PerSec,
    ["Ao_SA", "PA_PArt"],
    "rootDynamicFlowsM3PerSec",
  );
  const source = input.sourceEndpoint.differentialState;
  const bloodVolumesM3 = Object.freeze({
    LV: requirePositiveFinite(source.bloodVolumesM3.LV, "source LV volume"),
    LA: requirePositiveFinite(source.bloodVolumesM3.LA, "source LA volume"),
    RV: requirePositiveFinite(source.bloodVolumesM3.RV, "source RV volume"),
    RA: requirePositiveFinite(source.bloodVolumesM3.RA, "source RA volume"),
    ...copyNumericRecord(
      input.vascularBloodVolumesM3,
      MAIN_WIRE_NON_CORONARY_VASCULAR_NODE_NAMES_V1,
      "vascularBloodVolumesM3",
      requirePositiveFinite,
    ),
  });
  const dynamicFlowsM3PerSec = Object.freeze({
    Q_MV: requireFinite(source.inertialFlowsM3PerSec.Q_MV, "source Q_MV"),
    Q_AoV: requireFinite(source.inertialFlowsM3PerSec.Q_AoV, "source Q_AoV"),
    Q_TV: requireFinite(source.inertialFlowsM3PerSec.Q_TV, "source Q_TV"),
    Q_PuV: requireFinite(source.inertialFlowsM3PerSec.Q_PuV, "source Q_PuV"),
    Ao_SA: requireFinite(input.rootDynamicFlowsM3PerSec.Ao_SA, "root Ao_SA"),
    PA_PArt: requireFinite(
      input.rootDynamicFlowsM3PerSec.PA_PArt,
      "root PA_PArt",
    ),
  });
  const differentialState: PhaseB1MainWireDistributedDifferentialStateV1 =
    source.slsMode === "on"
      ? Object.freeze({
          slsMode: "on" as const,
          bloodVolumesM3,
          dynamicFlowsM3PerSec,
          calciumByWall: copyCalcium(source.calciumByWall),
          landByWall: copyLand(source.landByWall),
          slsAlphaVByWall: copyNumericRecord(
            source.slsAlphaVByWall,
            WALL_IDS,
            "source slsAlphaVByWall",
            requireFinite,
          ),
        })
      : Object.freeze({
          slsMode: "off" as const,
          bloodVolumesM3,
          dynamicFlowsM3PerSec,
          calciumByWall: copyCalcium(source.calciumByWall),
          landByWall: copyLand(source.landByWall),
        });
  const endpoint = createPhaseB1MainWireDistributedEndpointV1({
    timeSec: input.sourceEndpoint.timeSec,
    differentialState,
    triSegCoordinates: input.sourceEndpoint.triSegCoordinates,
  });
  return Object.freeze({
    endpoint,
    audit: Object.freeze({
      sourceEndpointStateId: input.sourceEndpoint.stateId,
      chamberVolumesCopiedExactly: true as const,
      valveFlowsCopiedExactly: true as const,
      suppliedVascularVolumeCount: 11 as const,
      suppliedRootDynamicFlowCount: 2 as const,
      vascularInitializationInferred: false as const,
      parameterFitApplied: false as const,
      legacyAggregateVascularVolumesImported: false as const,
      legacyInletFlowsImported: false as const,
    }),
  });
}

function buildStoredLabels(mode: PhaseB1SlsModeV1): readonly string[] {
  const labels = [
    ...MAIN_WIRE_NON_CORONARY_CIRCULATION_NODE_NAMES_V1.map(
      (node) => `circulation.main-wire.volume.${node}`,
    ),
    ...MAIN_WIRE_NON_CORONARY_DYNAMIC_FLOW_NAMES_V1.map(
      (flow) => `circulation.main-wire.dynamic-flow.${flow}`,
    ),
  ];
  for (const wallId of WALL_IDS) {
    labels.push(
      `tissue.${wallId}.patch-0.calcium.r`,
      `tissue.${wallId}.patch-0.calcium.d`,
      ...RATE_FREE_LAND2017_STATE_LABELS_V1.map(
        (label) => `tissue.${wallId}.patch-0.land.${label}`,
      ),
    );
    if (mode === "on") labels.push(`tissue.${wallId}.patch-0.sls.alphaV`);
  }
  const expected = storedCount(mode);
  if (labels.length !== expected || new Set(labels).size !== labels.length) {
    throw new Error("distributed stored labels drifted");
  }
  return Object.freeze(labels);
}

function buildNewtonLabels(mode: PhaseB1SlsModeV1): readonly string[] {
  const labels = [
    ...MAIN_WIRE_NON_CORONARY_CIRCULATION_NODE_NAMES_V1.map(
      (node) => `circulation.main-wire.volume.${node}`,
    ),
    ...MAIN_WIRE_NON_CORONARY_DYNAMIC_FLOW_NAMES_V1.map(
      (flow) => `circulation.main-wire.dynamic-flow.${flow}`,
    ),
    ...WALL_IDS.flatMap((wallId) => RATE_FREE_LAND2017_STATE_LABELS_V1.map(
      (label) => `tissue.${wallId}.patch-0.land.${label}`,
    )),
    ...(mode === "on"
      ? WALL_IDS.map((wallId) => `tissue.${wallId}.patch-0.sls.alphaV`)
      : []),
    "algebraic.triseg.V_m_S",
    "algebraic.triseg.y_m",
  ];
  const expected = newtonCount(mode);
  if (labels.length !== expected || new Set(labels).size !== labels.length) {
    throw new Error("distributed Newton labels drifted");
  }
  return Object.freeze(labels);
}

function normalizeDifferentialState(
  value: unknown,
): PhaseB1MainWireDistributedDifferentialStateV1 {
  const mode = readSlsMode(value, "distributed differential state");
  assertExactPlainRecordV1(
    value,
    mode === "on"
      ? [
          "slsMode",
          "bloodVolumesM3",
          "dynamicFlowsM3PerSec",
          "calciumByWall",
          "landByWall",
          "slsAlphaVByWall",
        ]
      : [
          "slsMode",
          "bloodVolumesM3",
          "dynamicFlowsM3PerSec",
          "calciumByWall",
          "landByWall",
        ],
    "distributed differential state",
  );
  const common = Object.freeze({
    bloodVolumesM3: copyNumericRecord(
      value.bloodVolumesM3,
      MAIN_WIRE_NON_CORONARY_CIRCULATION_NODE_NAMES_V1,
      "bloodVolumesM3",
      requirePositiveFinite,
    ),
    dynamicFlowsM3PerSec: copyNumericRecord(
      value.dynamicFlowsM3PerSec,
      MAIN_WIRE_NON_CORONARY_DYNAMIC_FLOW_NAMES_V1,
      "dynamicFlowsM3PerSec",
      requireFinite,
    ),
    calciumByWall: copyCalcium(value.calciumByWall),
    landByWall: copyLand(value.landByWall),
  });
  return mode === "on"
    ? Object.freeze({
        ...common,
        slsMode: "on" as const,
        slsAlphaVByWall: copyNumericRecord(
          value.slsAlphaVByWall,
          WALL_IDS,
          "slsAlphaVByWall",
          requireFinite,
        ),
      })
    : Object.freeze({ ...common, slsMode: "off" as const });
}

function normalizeNewtonState(
  value: unknown,
): PhaseB1MainWireDistributedNewtonStateV1 {
  const mode = readSlsMode(value, "distributed Newton state");
  assertExactPlainRecordV1(
    value,
    mode === "on"
      ? [
          "slsMode",
          "bloodVolumesM3",
          "dynamicFlowsM3PerSec",
          "landByWall",
          "slsAlphaVByWall",
          "triSegCoordinates",
        ]
      : [
          "slsMode",
          "bloodVolumesM3",
          "dynamicFlowsM3PerSec",
          "landByWall",
          "triSegCoordinates",
        ],
    "distributed Newton state",
  );
  const common = Object.freeze({
    bloodVolumesM3: copyNumericRecord(
      value.bloodVolumesM3,
      MAIN_WIRE_NON_CORONARY_CIRCULATION_NODE_NAMES_V1,
      "bloodVolumesM3",
      requirePositiveFinite,
    ),
    dynamicFlowsM3PerSec: copyNumericRecord(
      value.dynamicFlowsM3PerSec,
      MAIN_WIRE_NON_CORONARY_DYNAMIC_FLOW_NAMES_V1,
      "dynamicFlowsM3PerSec",
      requireFinite,
    ),
    landByWall: copyLand(value.landByWall),
    triSegCoordinates: copyTriSeg(value.triSegCoordinates),
  });
  return mode === "on"
    ? Object.freeze({
        ...common,
        slsMode: "on" as const,
        slsAlphaVByWall: copyNumericRecord(
          value.slsAlphaVByWall,
          WALL_IDS,
          "slsAlphaVByWall",
          requireFinite,
        ),
      })
    : Object.freeze({ ...common, slsMode: "off" as const });
}

function copyCalcium(value: unknown): PhaseB1CalciumStateByWallV1 {
  assertExactPlainRecordV1(value, WALL_IDS, "calciumByWall");
  return Object.freeze(Object.fromEntries(WALL_IDS.map((wallId) => {
    const state = value[wallId];
    assertExactPlainRecordV1(state, ["r", "d"], `calciumByWall.${wallId}`);
    const r = requireNonNegativeFinite(state.r, `calciumByWall.${wallId}.r`);
    const d = requireNonNegativeFinite(state.d, `calciumByWall.${wallId}.d`);
    if (d < r) throw new Error(`calciumByWall.${wallId} requires d >= r`);
    return [wallId, Object.freeze({ r, d })];
  }))) as PhaseB1CalciumStateByWallV1;
}

function copyLand(value: unknown): Readonly<
  Record<FourChamberWallId, RateFreeLand2017StateV1>
> {
  assertExactPlainRecordV1(value, WALL_IDS, "landByWall");
  return Object.freeze(Object.fromEntries(WALL_IDS.map((wallId) => [
    wallId,
    copyLandVector(value[wallId], `landByWall.${wallId}`),
  ]))) as Readonly<Record<FourChamberWallId, RateFreeLand2017StateV1>>;
}

function copyLandVector(value: unknown, field: string): RateFreeLand2017StateV1 {
  assertDensePlainArrayV1(
    value,
    RATE_FREE_LAND2017_STATE_LABELS_V1.length,
    field,
  );
  return Object.freeze(value.map((entry, index) => requireFinite(
    entry,
    `${field}.${RATE_FREE_LAND2017_STATE_LABELS_V1[index]}`,
  ))) as unknown as RateFreeLand2017StateV1;
}

function landVectorFromValues(
  encoded: unknown[],
  nextIndex: () => number,
  wallId: FourChamberWallId,
): RateFreeLand2017StateV1 {
  return Object.freeze(RATE_FREE_LAND2017_STATE_LABELS_V1.map((label) =>
    requireFinite(encoded[nextIndex()], `landByWall.${wallId}.${label}`))) as
      unknown as RateFreeLand2017StateV1;
}

function copyTriSeg(value: unknown): PhaseB1TriSegCoordinatesV1 {
  assertExactPlainRecordV1(value, ["V_m_S", "y_m"], "triSegCoordinates");
  return Object.freeze({
    V_m_S: requireFinite(value.V_m_S, "triSegCoordinates.V_m_S"),
    y_m: requirePositiveFinite(value.y_m, "triSegCoordinates.y_m"),
  });
}

function copyNumericRecord<Key extends string>(
  value: unknown,
  keys: readonly Key[],
  field: string,
  validate: (value: unknown, field: string) => number,
): Readonly<Record<Key, number>> {
  assertExactPlainRecordV1(value, keys, field);
  return Object.freeze(Object.fromEntries(keys.map((key) => [
    key,
    validate(value[key], `${field}.${key}`),
  ]))) as Readonly<Record<Key, number>>;
}

function numericRecordFromVector<Key extends string>(
  encoded: unknown[],
  keys: readonly Key[],
  nextIndex: () => number,
  field: string,
  validate: (value: unknown, field: string) => number,
): Readonly<Record<Key, number>> {
  return Object.freeze(Object.fromEntries(keys.map((key) => [
    key,
    validate(encoded[nextIndex()], `${field}.${key}`),
  ]))) as Readonly<Record<Key, number>>;
}

function assertEndpoint(endpoint: PhaseB1MainWireDistributedEndpointV1): void {
  assertExactPlainRecordV1(
    endpoint,
    ["stateId", "timeSec", "differentialState", "triSegCoordinates"],
    "distributed endpoint",
  );
  if (endpoint.stateId !== PHASE_B1_MAIN_WIRE_DISTRIBUTED_ENDPOINT_V1_ID) {
    throw new Error("distributed endpoint state ID is invalid");
  }
  createPhaseB1MainWireDistributedEndpointV1({
    timeSec: endpoint.timeSec,
    differentialState: endpoint.differentialState,
    triSegCoordinates: endpoint.triSegCoordinates,
  });
}

function readSlsMode(value: unknown, field: string): PhaseB1SlsModeV1 {
  if (
    value === null
    || typeof value !== "object"
    || Object.getPrototypeOf(value) !== Object.prototype
  ) {
    throw new Error(`${field} must be a plain object`);
  }
  const mode = Object.getOwnPropertyDescriptor(value, "slsMode");
  if (
    mode === undefined
    || !("value" in mode)
    || mode.enumerable !== true
    || (mode.value !== "on" && mode.value !== "off")
  ) {
    throw new Error(`${field}.slsMode must be on or off`);
  }
  return mode.value;
}

function requireSlsMode(value: unknown, field: string): PhaseB1SlsModeV1 {
  if (value !== "on" && value !== "off") throw new Error(`${field} must be on or off`);
  return value;
}

function storedCount(mode: PhaseB1SlsModeV1): 66 | 61 {
  return mode === "on" ? 66 : 61;
}

function newtonCount(mode: PhaseB1SlsModeV1): 58 | 53 {
  return mode === "on" ? 58 : 53;
}

function requireFinite(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${field} must be finite`);
  }
  return value;
}

function requireNonNegativeFinite(value: unknown, field: string): number {
  const finite = requireFinite(value, field);
  if (finite < 0) throw new Error(`${field} must be nonnegative`);
  return finite;
}

function requirePositiveFinite(value: unknown, field: string): number {
  const finite = requireFinite(value, field);
  if (!(finite > 0)) throw new Error(`${field} must be positive`);
  return finite;
}
