import {
  decodePhaseB1StoredDifferentialStateV1,
  decodePhaseB1NewtonUnknownStateV1,
  encodePhaseB1NewtonUnknownStateV1,
  encodePhaseB1StoredDifferentialStateV1,
  type PhaseB1PrescribedCalciumStateV1,
  type PhaseB1SlsModeV1,
  type PhaseB1StoredDifferentialStateV1,
  type PhaseB1TriSegCoordinatesV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1StoredStateNewtonTopologyV1";
import {
  WALL_IDS,
  type FourChamberWallId,
} from "@/engine/myocardium/fourChamberV1/topology/contracts";
import {
  assertDensePlainArrayV1,
  assertExactPlainRecordV1,
} from "@/engine/myocardium/fourChamberV1/validation/strictClosedRecordV1";

export const PHASE_B1_ENDPOINT_STATE_V1_ID =
  "four-chamber-phase-b1-endpoint-state-v1" as const;

export type PhaseB1CalciumStateByWallV1 = Readonly<Record<
  FourChamberWallId,
  PhaseB1PrescribedCalciumStateV1
>>;

export type PhaseB1EndpointStateV1 = Readonly<{
  stateId: typeof PHASE_B1_ENDPOINT_STATE_V1_ID;
  timeSec: number;
  differentialState: PhaseB1StoredDifferentialStateV1;
  triSegCoordinates: PhaseB1TriSegCoordinatesV1;
}>;

export type PhaseB1EndpointTopologyVectorsV1 = Readonly<{
  slsMode: PhaseB1SlsModeV1;
  calciumByWall: PhaseB1CalciumStateByWallV1;
  nonCalciumDifferentialState: readonly number[];
  algebraicState: readonly [V_m_S: number, y_m: number];
}>;

export function createPhaseB1EndpointStateV1(input: Readonly<{
  timeSec: number;
  differentialState: PhaseB1StoredDifferentialStateV1;
  triSegCoordinates: PhaseB1TriSegCoordinatesV1;
}>): PhaseB1EndpointStateV1 {
  assertExactPlainRecordV1(
    input,
    ["timeSec", "differentialState", "triSegCoordinates"],
    "Phase B1 endpoint input",
  );
  const timeSec = requireNonNegativeFinite(input.timeSec, "timeSec");
  const differentialState = canonicalDifferentialState(input.differentialState);
  assertExactPlainRecordV1(
    input.triSegCoordinates,
    ["V_m_S", "y_m"],
    "triSegCoordinates",
  );
  const triSegCoordinates = Object.freeze({
    V_m_S: requireFinite(input.triSegCoordinates.V_m_S, "triSegCoordinates.V_m_S"),
    y_m: requirePositiveFinite(input.triSegCoordinates.y_m, "triSegCoordinates.y_m"),
  });
  return Object.freeze({
    stateId: PHASE_B1_ENDPOINT_STATE_V1_ID,
    timeSec,
    differentialState,
    triSegCoordinates,
  });
}

export function encodePhaseB1EndpointTopologyVectorsV1(
  endpoint: PhaseB1EndpointStateV1,
): PhaseB1EndpointTopologyVectorsV1 {
  assertEndpointIdentity(endpoint);
  const state = endpoint.differentialState;
  const newton = state.slsMode === "on"
    ? {
      slsMode: "on" as const,
      bloodVolumesM3: state.bloodVolumesM3,
      inertialFlowsM3PerSec: state.inertialFlowsM3PerSec,
      landByWall: state.landByWall,
      slsAlphaVByWall: state.slsAlphaVByWall,
      triSegCoordinates: endpoint.triSegCoordinates,
    }
    : {
      slsMode: "off" as const,
      bloodVolumesM3: state.bloodVolumesM3,
      inertialFlowsM3PerSec: state.inertialFlowsM3PerSec,
      landByWall: state.landByWall,
      triSegCoordinates: endpoint.triSegCoordinates,
    };
  const encodedNewton = encodePhaseB1NewtonUnknownStateV1(newton);
  const expected = state.slsMode === "on" ? 51 : 46;
  if (encodedNewton.length !== expected) {
    throw new Error("Phase B1 endpoint Newton topology dimension drifted");
  }
  return Object.freeze({
    slsMode: state.slsMode,
    calciumByWall: copyCalciumByWall(state.calciumByWall),
    nonCalciumDifferentialState: Object.freeze(encodedNewton.slice(0, -2)),
    algebraicState: Object.freeze([
      encodedNewton[encodedNewton.length - 2],
      encodedNewton[encodedNewton.length - 1],
    ] as [number, number]),
  });
}

export function decodePhaseB1EndpointTopologyVectorsV1(input: Readonly<{
  timeSec: number;
  slsMode: PhaseB1SlsModeV1;
  calciumByWall: PhaseB1CalciumStateByWallV1;
  nonCalciumDifferentialState: readonly number[];
  algebraicState: readonly number[];
}>): PhaseB1EndpointStateV1 {
  assertExactPlainRecordV1(input, [
    "timeSec",
    "slsMode",
    "calciumByWall",
    "nonCalciumDifferentialState",
    "algebraicState",
  ], "Phase B1 endpoint topology vectors");
  if (input.slsMode !== "on" && input.slsMode !== "off") {
    throw new Error("slsMode must be on or off");
  }
  const differentialCount = input.slsMode === "on" ? 49 : 44;
  assertDensePlainArrayV1(
    input.nonCalciumDifferentialState,
    differentialCount,
    "nonCalciumDifferentialState",
  );
  assertDensePlainArrayV1(input.algebraicState, 2, "algebraicState");
  const newton = decodePhaseB1NewtonUnknownStateV1(
    [...input.nonCalciumDifferentialState, ...input.algebraicState],
    input.slsMode,
  );
  const calciumByWall = copyCalciumByWall(input.calciumByWall);
  const differentialState: PhaseB1StoredDifferentialStateV1 =
    newton.slsMode === "on"
      ? Object.freeze({
        slsMode: "on" as const,
        bloodVolumesM3: newton.bloodVolumesM3,
        inertialFlowsM3PerSec: newton.inertialFlowsM3PerSec,
        calciumByWall,
        landByWall: newton.landByWall,
        slsAlphaVByWall: newton.slsAlphaVByWall,
      })
      : Object.freeze({
        slsMode: "off" as const,
        bloodVolumesM3: newton.bloodVolumesM3,
        inertialFlowsM3PerSec: newton.inertialFlowsM3PerSec,
        calciumByWall,
        landByWall: newton.landByWall,
      });
  return createPhaseB1EndpointStateV1({
    timeSec: input.timeSec,
    differentialState,
    triSegCoordinates: newton.triSegCoordinates,
  });
}

function canonicalDifferentialState(
  input: PhaseB1StoredDifferentialStateV1,
): PhaseB1StoredDifferentialStateV1 {
  const encoded = encodePhaseB1StoredDifferentialStateV1(input);
  const mode = input.slsMode;
  if (encoded.length !== (mode === "on" ? 59 : 54)) {
    throw new Error("Phase B1 stored endpoint dimension drifted");
  }
  // An endpoint is a transactional snapshot. Decode the validated vector so
  // mutable caller-owned records cannot change it after construction, and so
  // the SLS-off representation cannot retain a hidden placeholder.
  return decodePhaseB1StoredDifferentialStateV1(encoded, mode);
}

function copyCalciumByWall(input: unknown): PhaseB1CalciumStateByWallV1 {
  assertExactPlainRecordV1(input, WALL_IDS, "calciumByWall");
  return Object.freeze(Object.fromEntries(WALL_IDS.map((wallId) => {
    const state = input[wallId];
    assertExactPlainRecordV1(state, ["r", "d"], `calciumByWall.${wallId}`);
    const r = requireNonNegativeFinite(state.r, `calciumByWall.${wallId}.r`);
    const d = requireNonNegativeFinite(state.d, `calciumByWall.${wallId}.d`);
    if (d < r) {
      throw new Error(`calciumByWall.${wallId} requires d >= r`);
    }
    return [wallId, Object.freeze({ r, d })];
  }))) as PhaseB1CalciumStateByWallV1;
}

function assertEndpointIdentity(endpoint: PhaseB1EndpointStateV1): void {
  assertExactPlainRecordV1(
    endpoint,
    ["stateId", "timeSec", "differentialState", "triSegCoordinates"],
    "Phase B1 endpoint state",
  );
  if (endpoint.stateId !== PHASE_B1_ENDPOINT_STATE_V1_ID) {
    throw new Error("Phase B1 endpoint state ID is invalid");
  }
  requireNonNegativeFinite(endpoint.timeSec, "endpoint.timeSec");
  canonicalDifferentialState(endpoint.differentialState);
}

function requireFinite(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${field} must be finite`);
  }
  return value;
}

function requireNonNegativeFinite(value: unknown, field: string): number {
  const result = requireFinite(value, field);
  if (result < 0) throw new Error(`${field} must be non-negative`);
  return result;
}

function requirePositiveFinite(value: unknown, field: string): number {
  const result = requireFinite(value, field);
  if (result <= 0) throw new Error(`${field} must be positive`);
  return result;
}
