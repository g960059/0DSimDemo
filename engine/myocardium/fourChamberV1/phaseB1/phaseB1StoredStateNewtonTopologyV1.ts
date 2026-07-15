import {
  computeCanonicalSha256,
  type CanonicalSha256HexProvider,
} from "@/engine/myocardium/fourChamberV1/manifests/canonicalJson";
import {
  FOUR_CHAMBER_BASELINE_STATE_LAYOUT_V1,
} from "@/engine/myocardium/fourChamberV1/state/fourChamberStateLayoutV1";
import {
  BLOOD_COMPARTMENT_IDS,
  INERTIAL_FLOW_IDS,
  TRISEG_ALGEBRAIC_COORDINATES,
  WALL_IDS,
  type BloodCompartmentId,
  type FourChamberWallId,
  type InertialFlowId,
} from "@/engine/myocardium/fourChamberV1/topology/contracts";
import {
  assertDensePlainArrayV1,
  assertExactPlainRecordV1,
} from "@/engine/myocardium/fourChamberV1/validation/strictClosedRecordV1";
import {
  RATE_FREE_LAND2017_STATE_LABELS_V1,
  type RateFreeLand2017StateV1,
} from "@/engine/myocardium/fourChamberV1/land/rateFreeLand2017V1";
import { NORMATIVE_MANIFEST_HASH_ALGORITHM } from
  "@/engine/myocardium/fourChamberV1/ids";

export const PHASE_B1_STORED_STATE_NEWTON_TOPOLOGY_V1_ID =
  "four-chamber-phase-b1-stored-state-newton-topology-v1" as const;

export type PhaseB1SlsModeV1 = "on" | "off";

export type PhaseB1PrescribedCalciumStateV1 = Readonly<{
  r: number;
  d: number;
}>;

export type PhaseB1StoredStateCommonV1 = Readonly<{
  bloodVolumesM3: Readonly<Record<BloodCompartmentId, number>>;
  inertialFlowsM3PerSec: Readonly<Record<InertialFlowId, number>>;
  calciumByWall: Readonly<
    Record<FourChamberWallId, PhaseB1PrescribedCalciumStateV1>
  >;
  landByWall: Readonly<
    Record<FourChamberWallId, RateFreeLand2017StateV1>
  >;
}>;

export type PhaseB1StoredDifferentialStateV1 =
  | (PhaseB1StoredStateCommonV1 & Readonly<{
    slsMode: "on";
    slsAlphaVByWall: Readonly<Record<FourChamberWallId, number>>;
  }>)
  | (PhaseB1StoredStateCommonV1 & Readonly<{
    slsMode: "off";
  }>);

export type PhaseB1TriSegCoordinatesV1 = Readonly<{
  V_m_S: number;
  y_m: number;
}>;

export type PhaseB1NewtonUnknownStateV1 =
  | Readonly<{
    slsMode: "on";
    bloodVolumesM3: Readonly<Record<BloodCompartmentId, number>>;
    inertialFlowsM3PerSec: Readonly<Record<InertialFlowId, number>>;
    landByWall: Readonly<Record<FourChamberWallId, RateFreeLand2017StateV1>>;
    slsAlphaVByWall: Readonly<Record<FourChamberWallId, number>>;
    triSegCoordinates: PhaseB1TriSegCoordinatesV1;
  }>
  | Readonly<{
    slsMode: "off";
    bloodVolumesM3: Readonly<Record<BloodCompartmentId, number>>;
    inertialFlowsM3PerSec: Readonly<Record<InertialFlowId, number>>;
    landByWall: Readonly<Record<FourChamberWallId, RateFreeLand2017StateV1>>;
    triSegCoordinates: PhaseB1TriSegCoordinatesV1;
  }>;

const BASELINE_VOLUME_LABELS = labelsOwnedBy("circulation-volume");
const BASELINE_FLOW_LABELS = labelsOwnedBy("circulation-inertial-flow");
const BASELINE_CALCIUM_LABELS = labelsOwnedBy("prescribed-calcium");
const BASELINE_LAND_LABELS = labelsOwnedBy(
  "land2017-active-only-rate-free",
);
const BASELINE_SLS_LABELS = labelsOwnedBy("passive-wall-sls");
const TRISEG_UNKNOWN_LABELS = Object.freeze(
  TRISEG_ALGEBRAIC_COORDINATES.map((coordinate) =>
    `algebraic.triseg.${coordinate}`),
);
const TRISEG_RESIDUAL_LABELS = Object.freeze([
  "residual.triseg.equilibrium.axialNPerM",
  "residual.triseg.equilibrium.radialNPerM",
] as const);

const STORED_LABELS_ON = Object.freeze(
  FOUR_CHAMBER_BASELINE_STATE_LAYOUT_V1.states.map((state) => state.key),
);
const STORED_LABELS_OFF = Object.freeze(
  FOUR_CHAMBER_BASELINE_STATE_LAYOUT_V1.states
    .filter((state) => state.owner !== "passive-wall-sls")
    .map((state) => state.key),
);
const NEWTON_UNKNOWN_LABELS_ON = newtonUnknownLabels("on");
const NEWTON_UNKNOWN_LABELS_OFF = newtonUnknownLabels("off");
const NEWTON_RESIDUAL_LABELS_ON = newtonResidualLabels("on");
const NEWTON_RESIDUAL_LABELS_OFF = newtonResidualLabels("off");

export type PhaseB1StateNewtonTopologyPayloadV1 = Readonly<{
  schemaId: typeof PHASE_B1_STORED_STATE_NEWTON_TOPOLOGY_V1_ID;
  baselineStateLayoutBinding: Readonly<{
    schemaId: typeof FOUR_CHAMBER_BASELINE_STATE_LAYOUT_V1.schemaId;
    layoutDiagnosticHash: string;
  }>;
  orderContract: Readonly<{
    bloodCompartments: typeof BLOOD_COMPARTMENT_IDS;
    inertialFlows: typeof INERTIAL_FLOW_IDS;
    walls: typeof WALL_IDS;
    calciumStatesPerWall: readonly ["r", "d"];
    rateFreeLandStatesPerWall: typeof RATE_FREE_LAND2017_STATE_LABELS_V1;
    triSegAlgebraicCoordinates: typeof TRISEG_ALGEBRAIC_COORDINATES;
    storedStateOrder: "baseline-layout-interleaved-per-wall";
    newtonUnknownOrder:
      "8-volume-6-flow-30-land-optional-5-sls-2-triseg";
    newtonResidualOrder:
      "8-volume-6-flow-30-land-optional-5-sls-2-triseg-equilibrium";
  }>;
  exactCalciumContract: Readonly<{
    storedStateCount: 10;
    storedStateReachableDomain:
      "nonnegative-and-decay-drive-greater-than-or-equal-to-rise-drive";
    exactlyPropagatedKnownForcing: true;
    newtonUnknownCount: 0;
    backwardEulerResidualCount: 0;
  }>;
  slsOn: PhaseB1ModeTopologyV1;
  slsOff: PhaseB1ModeTopologyV1;
}>;

export type PhaseB1ModeTopologyV1 = Readonly<{
  slsMode: PhaseB1SlsModeV1;
  storedDifferentialStateCount: 59 | 54;
  storedDifferentialLabels: readonly string[];
  storedBlockCounts: Readonly<{
    bloodVolumes: 8;
    inertialFlows: 6;
    exactCalcium: 10;
    rateFreeLand: 30;
    sls: 5 | 0;
    triSegAlgebraic: 0;
  }>;
  slsStatePresence: "present-five-states" | "physically-absent-no-placeholder";
  newtonUnknownCount: 51 | 46;
  newtonResidualCount: 51 | 46;
  newtonUnknownLabels: readonly string[];
  newtonResidualLabels: readonly string[];
  newtonBlockCounts: Readonly<{
    bloodVolumes: 8;
    inertialFlows: 6;
    exactCalcium: 0;
    rateFreeLand: 30;
    sls: 5 | 0;
    triSegAlgebraic: 2;
  }>;
}>;

export type PhaseB1StateNewtonTopologyV1 =
  PhaseB1StateNewtonTopologyPayloadV1 & Readonly<{
    hashAlgorithm: typeof NORMATIVE_MANIFEST_HASH_ALGORITHM;
    contentSha256: string;
  }>;

export function buildPhaseB1StateNewtonTopologyV1(
  sha256Hex: CanonicalSha256HexProvider,
): PhaseB1StateNewtonTopologyV1 {
  assertStaticLayoutInvariants();
  const payload: PhaseB1StateNewtonTopologyPayloadV1 = Object.freeze({
    schemaId: PHASE_B1_STORED_STATE_NEWTON_TOPOLOGY_V1_ID,
    baselineStateLayoutBinding: Object.freeze({
      schemaId: FOUR_CHAMBER_BASELINE_STATE_LAYOUT_V1.schemaId,
      layoutDiagnosticHash:
        FOUR_CHAMBER_BASELINE_STATE_LAYOUT_V1.layoutDiagnosticHash,
    }),
    orderContract: Object.freeze({
      bloodCompartments: BLOOD_COMPARTMENT_IDS,
      inertialFlows: INERTIAL_FLOW_IDS,
      walls: WALL_IDS,
      calciumStatesPerWall: Object.freeze(["r", "d"] as const),
      rateFreeLandStatesPerWall: RATE_FREE_LAND2017_STATE_LABELS_V1,
      triSegAlgebraicCoordinates: TRISEG_ALGEBRAIC_COORDINATES,
      storedStateOrder: "baseline-layout-interleaved-per-wall",
      newtonUnknownOrder:
        "8-volume-6-flow-30-land-optional-5-sls-2-triseg",
      newtonResidualOrder:
        "8-volume-6-flow-30-land-optional-5-sls-2-triseg-equilibrium",
    }),
    exactCalciumContract: Object.freeze({
      storedStateCount: 10,
      storedStateReachableDomain:
        "nonnegative-and-decay-drive-greater-than-or-equal-to-rise-drive",
      exactlyPropagatedKnownForcing: true,
      newtonUnknownCount: 0,
      backwardEulerResidualCount: 0,
    }),
    slsOn: buildModeTopology("on"),
    slsOff: buildModeTopology("off"),
  });
  return Object.freeze({
    ...payload,
    hashAlgorithm: NORMATIVE_MANIFEST_HASH_ALGORITHM,
    contentSha256: computeCanonicalSha256(payload, sha256Hex),
  });
}

export function phaseB1StateNewtonTopologyHashPayloadV1(
  descriptor: PhaseB1StateNewtonTopologyV1,
): PhaseB1StateNewtonTopologyPayloadV1 {
  const {
    hashAlgorithm: _hashAlgorithm,
    contentSha256: _contentSha256,
    ...payload
  } = descriptor;
  return Object.freeze(payload);
}

export function buildPhaseB1StoredDifferentialLabelsV1(
  mode: PhaseB1SlsModeV1,
): readonly string[] {
  return mode === "on" ? STORED_LABELS_ON : STORED_LABELS_OFF;
}

export function buildPhaseB1NewtonUnknownLabelsV1(
  mode: PhaseB1SlsModeV1,
): readonly string[] {
  return mode === "on" ? NEWTON_UNKNOWN_LABELS_ON : NEWTON_UNKNOWN_LABELS_OFF;
}

export function buildPhaseB1NewtonResidualLabelsV1(
  mode: PhaseB1SlsModeV1,
): readonly string[] {
  return mode === "on" ? NEWTON_RESIDUAL_LABELS_ON : NEWTON_RESIDUAL_LABELS_OFF;
}

export function encodePhaseB1StoredDifferentialStateV1(
  value: unknown,
): readonly number[] {
  const state = normalizeStoredState(value);
  const encoded: number[] = [
    ...BLOOD_COMPARTMENT_IDS.map((id) => state.bloodVolumesM3[id]),
    ...INERTIAL_FLOW_IDS.map((id) => state.inertialFlowsM3PerSec[id]),
  ];
  for (const wallId of WALL_IDS) {
    encoded.push(state.calciumByWall[wallId].r, state.calciumByWall[wallId].d);
    encoded.push(...state.landByWall[wallId]);
    if (state.slsMode === "on") encoded.push(state.slsAlphaVByWall[wallId]);
  }
  const expected = state.slsMode === "on" ? 59 : 54;
  if (encoded.length !== expected) {
    throw new Error(`Phase B1 stored-state encoder expected ${expected} values`);
  }
  return Object.freeze(encoded);
}

export function decodePhaseB1StoredDifferentialStateV1(
  encoded: unknown,
  mode: unknown,
): PhaseB1StoredDifferentialStateV1 {
  const slsMode = requireSlsModeValue(mode, "Phase B1 stored-state mode");
  const expected = slsMode === "on" ? 59 : 54;
  assertDensePlainArrayV1(encoded, expected, "Phase B1 stored-state vector");
  let offset = 0;
  const bloodVolumesM3 = decodeNumericRecord(
    encoded,
    BLOOD_COMPARTMENT_IDS,
    () => offset++,
    "bloodVolumesM3",
    requirePositiveFinite,
  );
  const inertialFlowsM3PerSec = decodeNumericRecord(
    encoded,
    INERTIAL_FLOW_IDS,
    () => offset++,
    "inertialFlowsM3PerSec",
    requireFinite,
  );
  const calciumEntries: [FourChamberWallId, PhaseB1PrescribedCalciumStateV1][] = [];
  const landEntries: [FourChamberWallId, RateFreeLand2017StateV1][] = [];
  const slsEntries: [FourChamberWallId, number][] = [];
  for (const wallId of WALL_IDS) {
    const riseDrive = requireNonNegativeFinite(
      encoded[offset++],
      `calciumByWall.${wallId}.r`,
    );
    const decayDrive = requireNonNegativeFinite(
      encoded[offset++],
      `calciumByWall.${wallId}.d`,
    );
    assertReachableCalciumPair(riseDrive, decayDrive, `calciumByWall.${wallId}`);
    calciumEntries.push([wallId, Object.freeze({
      r: riseDrive,
      d: decayDrive,
    })]);
    landEntries.push([wallId, decodeLandVector(encoded, () => offset++, wallId)]);
    if (slsMode === "on") {
      slsEntries.push([
        wallId,
        requireFinite(encoded[offset++], `slsAlphaVByWall.${wallId}`),
      ]);
    }
  }
  if (offset !== expected) throw new Error("Phase B1 stored-state decoder offset drifted");
  const common = Object.freeze({
    bloodVolumesM3,
    inertialFlowsM3PerSec,
    calciumByWall: Object.freeze(Object.fromEntries(calciumEntries)) as Readonly<
      Record<FourChamberWallId, PhaseB1PrescribedCalciumStateV1>
    >,
    landByWall: Object.freeze(Object.fromEntries(landEntries)) as Readonly<
      Record<FourChamberWallId, RateFreeLand2017StateV1>
    >,
  });
  return slsMode === "on"
    ? Object.freeze({
      ...common,
      slsMode: "on" as const,
      slsAlphaVByWall: Object.freeze(Object.fromEntries(slsEntries)) as Readonly<
        Record<FourChamberWallId, number>
      >,
    })
    : Object.freeze({ ...common, slsMode: "off" as const });
}

export function encodePhaseB1NewtonUnknownStateV1(
  value: unknown,
): readonly number[] {
  const state = normalizeNewtonState(value);
  const encoded = [
    ...BLOOD_COMPARTMENT_IDS.map((id) => state.bloodVolumesM3[id]),
    ...INERTIAL_FLOW_IDS.map((id) => state.inertialFlowsM3PerSec[id]),
    ...WALL_IDS.flatMap((wallId) => state.landByWall[wallId]),
    ...(state.slsMode === "on"
      ? WALL_IDS.map((wallId) => state.slsAlphaVByWall[wallId])
      : []),
    state.triSegCoordinates.V_m_S,
    state.triSegCoordinates.y_m,
  ];
  const expected = state.slsMode === "on" ? 51 : 46;
  if (encoded.length !== expected) {
    throw new Error(`Phase B1 Newton encoder expected ${expected} values`);
  }
  return Object.freeze(encoded);
}

export function decodePhaseB1NewtonUnknownStateV1(
  encoded: unknown,
  mode: unknown,
): PhaseB1NewtonUnknownStateV1 {
  const slsMode = requireSlsModeValue(mode, "Phase B1 Newton mode");
  const expected = slsMode === "on" ? 51 : 46;
  assertDensePlainArrayV1(encoded, expected, "Phase B1 Newton unknown vector");
  let offset = 0;
  const bloodVolumesM3 = decodeNumericRecord(
    encoded,
    BLOOD_COMPARTMENT_IDS,
    () => offset++,
    "bloodVolumesM3",
    requirePositiveFinite,
  );
  const inertialFlowsM3PerSec = decodeNumericRecord(
    encoded,
    INERTIAL_FLOW_IDS,
    () => offset++,
    "inertialFlowsM3PerSec",
    requireFinite,
  );
  const landEntries = WALL_IDS.map((wallId) => [
    wallId,
    decodeLandVector(encoded, () => offset++, wallId),
  ] as const);
  const landByWall = Object.freeze(Object.fromEntries(landEntries)) as Readonly<
    Record<FourChamberWallId, RateFreeLand2017StateV1>
  >;
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
  if (offset !== expected) throw new Error("Phase B1 Newton decoder offset drifted");
  const common = Object.freeze({
    bloodVolumesM3,
    inertialFlowsM3PerSec,
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

function labelsOwnedBy(
  owner: (typeof FOUR_CHAMBER_BASELINE_STATE_LAYOUT_V1.states)[number]["owner"],
): readonly string[] {
  return Object.freeze(
    FOUR_CHAMBER_BASELINE_STATE_LAYOUT_V1.states
      .filter((state) => state.owner === owner)
      .map((state) => state.key),
  );
}

function newtonUnknownLabels(mode: PhaseB1SlsModeV1): readonly string[] {
  return Object.freeze([
    ...BASELINE_VOLUME_LABELS,
    ...BASELINE_FLOW_LABELS,
    ...BASELINE_LAND_LABELS,
    ...(mode === "on" ? BASELINE_SLS_LABELS : []),
    ...TRISEG_UNKNOWN_LABELS,
  ]);
}

function newtonResidualLabels(mode: PhaseB1SlsModeV1): readonly string[] {
  return Object.freeze([
    ...BASELINE_VOLUME_LABELS.map((label) => `residual.${label}`),
    ...BASELINE_FLOW_LABELS.map((label) => `residual.${label}`),
    ...BASELINE_LAND_LABELS.map((label) => `residual.${label}`),
    ...(mode === "on"
      ? BASELINE_SLS_LABELS.map((label) => `residual.${label}`)
      : []),
    ...TRISEG_RESIDUAL_LABELS,
  ]);
}

function buildModeTopology(mode: PhaseB1SlsModeV1): PhaseB1ModeTopologyV1 {
  const on = mode === "on";
  return Object.freeze({
    slsMode: mode,
    storedDifferentialStateCount: on ? 59 : 54,
    storedDifferentialLabels: on ? STORED_LABELS_ON : STORED_LABELS_OFF,
    storedBlockCounts: Object.freeze({
      bloodVolumes: 8,
      inertialFlows: 6,
      exactCalcium: 10,
      rateFreeLand: 30,
      sls: on ? 5 : 0,
      triSegAlgebraic: 0,
    }),
    slsStatePresence: on
      ? "present-five-states"
      : "physically-absent-no-placeholder",
    newtonUnknownCount: on ? 51 : 46,
    newtonResidualCount: on ? 51 : 46,
    newtonUnknownLabels: on
      ? NEWTON_UNKNOWN_LABELS_ON
      : NEWTON_UNKNOWN_LABELS_OFF,
    newtonResidualLabels: on
      ? NEWTON_RESIDUAL_LABELS_ON
      : NEWTON_RESIDUAL_LABELS_OFF,
    newtonBlockCounts: Object.freeze({
      bloodVolumes: 8,
      inertialFlows: 6,
      exactCalcium: 0,
      rateFreeLand: 30,
      sls: on ? 5 : 0,
      triSegAlgebraic: 2,
    }),
  });
}

function normalizeStoredState(value: unknown): PhaseB1StoredDifferentialStateV1 {
  const mode = readSlsMode(value, "Phase B1 stored state");
  assertExactPlainRecordV1(
    value,
    mode === "on"
      ? [
        "slsMode",
        "bloodVolumesM3",
        "inertialFlowsM3PerSec",
        "calciumByWall",
        "landByWall",
        "slsAlphaVByWall",
      ]
      : [
        "slsMode",
        "bloodVolumesM3",
        "inertialFlowsM3PerSec",
        "calciumByWall",
        "landByWall",
      ],
    "Phase B1 stored state",
  );
  const common = Object.freeze({
    bloodVolumesM3: copyNumericRecord(
      value.bloodVolumesM3,
      BLOOD_COMPARTMENT_IDS,
      "bloodVolumesM3",
      requirePositiveFinite,
    ),
    inertialFlowsM3PerSec: copyNumericRecord(
      value.inertialFlowsM3PerSec,
      INERTIAL_FLOW_IDS,
      "inertialFlowsM3PerSec",
      requireFinite,
    ),
    calciumByWall: copyCalciumByWall(value.calciumByWall),
    landByWall: copyLandByWall(value.landByWall),
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

function normalizeNewtonState(value: unknown): PhaseB1NewtonUnknownStateV1 {
  const mode = readSlsMode(value, "Phase B1 Newton state");
  assertExactPlainRecordV1(
    value,
    mode === "on"
      ? [
        "slsMode",
        "bloodVolumesM3",
        "inertialFlowsM3PerSec",
        "landByWall",
        "slsAlphaVByWall",
        "triSegCoordinates",
      ]
      : [
        "slsMode",
        "bloodVolumesM3",
        "inertialFlowsM3PerSec",
        "landByWall",
        "triSegCoordinates",
      ],
    "Phase B1 Newton state",
  );
  const common = Object.freeze({
    bloodVolumesM3: copyNumericRecord(
      value.bloodVolumesM3,
      BLOOD_COMPARTMENT_IDS,
      "bloodVolumesM3",
      requirePositiveFinite,
    ),
    inertialFlowsM3PerSec: copyNumericRecord(
      value.inertialFlowsM3PerSec,
      INERTIAL_FLOW_IDS,
      "inertialFlowsM3PerSec",
      requireFinite,
    ),
    landByWall: copyLandByWall(value.landByWall),
    triSegCoordinates: copyTriSegCoordinates(value.triSegCoordinates),
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

function readSlsMode(value: unknown, field: string): PhaseB1SlsModeV1 {
  if (
    value === null
    || typeof value !== "object"
    || Object.getPrototypeOf(value) !== Object.prototype
  ) {
    throw new Error(`${field} must be a plain object`);
  }
  const descriptor = Object.getOwnPropertyDescriptor(value, "slsMode");
  if (
    descriptor === undefined
    || !("value" in descriptor)
    || descriptor.enumerable !== true
    || (descriptor.value !== "on" && descriptor.value !== "off")
  ) {
    throw new Error(`${field}.slsMode must be an enumerable on/off data property`);
  }
  return descriptor.value;
}

function requireSlsModeValue(value: unknown, field: string): PhaseB1SlsModeV1 {
  if (value !== "on" && value !== "off") {
    throw new Error(`${field} must be on or off`);
  }
  return value;
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

function copyCalciumByWall(value: unknown): Readonly<
  Record<FourChamberWallId, PhaseB1PrescribedCalciumStateV1>
> {
  assertExactPlainRecordV1(value, WALL_IDS, "calciumByWall");
  return Object.freeze(Object.fromEntries(WALL_IDS.map((wallId) => {
    const field = `calciumByWall.${wallId}`;
    const state = value[wallId];
    assertExactPlainRecordV1(state, ["r", "d"], field);
    const riseDrive = requireNonNegativeFinite(state.r, `${field}.r`);
    const decayDrive = requireNonNegativeFinite(state.d, `${field}.d`);
    assertReachableCalciumPair(riseDrive, decayDrive, field);
    return [wallId, Object.freeze({
      r: riseDrive,
      d: decayDrive,
    })];
  }))) as Readonly<Record<FourChamberWallId, PhaseB1PrescribedCalciumStateV1>>;
}

function copyLandByWall(value: unknown): Readonly<
  Record<FourChamberWallId, RateFreeLand2017StateV1>
> {
  assertExactPlainRecordV1(value, WALL_IDS, "landByWall");
  return Object.freeze(Object.fromEntries(WALL_IDS.map((wallId) => [
    wallId,
    copyLandVector(value[wallId], `landByWall.${wallId}`),
  ]))) as Readonly<Record<FourChamberWallId, RateFreeLand2017StateV1>>;
}

function copyLandVector(value: unknown, field: string): RateFreeLand2017StateV1 {
  assertDensePlainArrayV1(value, RATE_FREE_LAND2017_STATE_LABELS_V1.length, field);
  const copy = value.map((entry, index) => requireFinite(
    entry,
    `${field}.${RATE_FREE_LAND2017_STATE_LABELS_V1[index]}`,
  ));
  return Object.freeze(copy) as unknown as RateFreeLand2017StateV1;
}

function copyTriSegCoordinates(value: unknown): PhaseB1TriSegCoordinatesV1 {
  assertExactPlainRecordV1(
    value,
    TRISEG_ALGEBRAIC_COORDINATES,
    "triSegCoordinates",
  );
  return Object.freeze({
    V_m_S: requireFinite(value.V_m_S, "triSegCoordinates.V_m_S"),
    y_m: requirePositiveFinite(value.y_m, "triSegCoordinates.y_m"),
  });
}

function decodeNumericRecord<Key extends string>(
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

function decodeLandVector(
  encoded: unknown[],
  nextIndex: () => number,
  wallId: FourChamberWallId,
): RateFreeLand2017StateV1 {
  const decoded = RATE_FREE_LAND2017_STATE_LABELS_V1.map((label) =>
    requireFinite(encoded[nextIndex()], `landByWall.${wallId}.${label}`));
  return Object.freeze(decoded) as unknown as RateFreeLand2017StateV1;
}

function requireFinite(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${field} must be finite`);
  }
  return value;
}

function requirePositiveFinite(value: unknown, field: string): number {
  const finite = requireFinite(value, field);
  if (!(finite > 0)) throw new Error(`${field} must be positive`);
  return finite;
}

function requireNonNegativeFinite(value: unknown, field: string): number {
  const finite = requireFinite(value, field);
  if (finite < 0) throw new Error(`${field} must be nonnegative`);
  return finite;
}

function assertReachableCalciumPair(
  riseDrive: number,
  decayDrive: number,
  field: string,
): void {
  if (decayDrive < riseDrive) {
    throw new Error(`${field} must satisfy decay drive >= rise drive`);
  }
}

function assertStaticLayoutInvariants(): void {
  const expectedCounts = [
    [BASELINE_VOLUME_LABELS.length, 8, "volume"],
    [BASELINE_FLOW_LABELS.length, 6, "flow"],
    [BASELINE_CALCIUM_LABELS.length, 10, "calcium"],
    [BASELINE_LAND_LABELS.length, 30, "Land"],
    [BASELINE_SLS_LABELS.length, 5, "SLS"],
    [STORED_LABELS_ON.length, 59, "SLS-on stored"],
    [STORED_LABELS_OFF.length, 54, "SLS-off stored"],
    [NEWTON_UNKNOWN_LABELS_ON.length, 51, "SLS-on Newton"],
    [NEWTON_UNKNOWN_LABELS_OFF.length, 46, "SLS-off Newton"],
    [NEWTON_RESIDUAL_LABELS_ON.length, 51, "SLS-on residual"],
    [NEWTON_RESIDUAL_LABELS_OFF.length, 46, "SLS-off residual"],
  ] as const;
  for (const [actual, expected, field] of expectedCounts) {
    if (actual !== expected) {
      throw new Error(`${field} topology count drifted: ${actual} !== ${expected}`);
    }
  }
  for (const [field, labels] of [
    ["SLS-on stored", STORED_LABELS_ON],
    ["SLS-off stored", STORED_LABELS_OFF],
    ["SLS-on Newton", NEWTON_UNKNOWN_LABELS_ON],
    ["SLS-off Newton", NEWTON_UNKNOWN_LABELS_OFF],
    ["SLS-on residual", NEWTON_RESIDUAL_LABELS_ON],
    ["SLS-off residual", NEWTON_RESIDUAL_LABELS_OFF],
  ] as const) {
    if (new Set(labels).size !== labels.length) {
      throw new Error(`${field} labels must be duplicate-free`);
    }
  }
  if (
    [...NEWTON_UNKNOWN_LABELS_ON, ...NEWTON_RESIDUAL_LABELS_ON]
      .some((label) => label.includes(".calcium."))
  ) {
    throw new Error("Exactly propagated calcium must be absent from Newton topology");
  }
}
