import { describe, expect, it } from "vitest";
import {
  createPhaseB1EndpointStateV1,
  decodePhaseB1EndpointTopologyVectorsV1,
  encodePhaseB1EndpointTopologyVectorsV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1EndpointStateV1";
import {
  decodePhaseB1StoredDifferentialStateV1,
  encodePhaseB1StoredDifferentialStateV1,
  type PhaseB1SlsModeV1,
  type PhaseB1StoredDifferentialStateV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1StoredStateNewtonTopologyV1";
import {
  BLOOD_COMPARTMENT_IDS,
  WALL_IDS,
} from "@/engine/myocardium/fourChamberV1/topology/contracts";

describe("four-chamber Phase B1 endpoint state", () => {
  it.each([
    ["on", 59, 49],
    ["off", 54, 44],
  ] as const)(
    "round-trips SLS-%s from %i stored states through non-calcium %i plus two algebraics",
    (mode, storedCount, nonCalciumCount) => {
      const differentialState = storedState(mode);
      const storedVector = encodePhaseB1StoredDifferentialStateV1(
        differentialState,
      );
      expect(storedVector).toHaveLength(storedCount);
      const endpoint = createPhaseB1EndpointStateV1({
        timeSec: 0.125,
        differentialState,
        triSegCoordinates: { V_m_S: 2e-5, y_m: 0.03 },
      });
      const vectors = encodePhaseB1EndpointTopologyVectorsV1(endpoint);
      expect(vectors.nonCalciumDifferentialState)
        .toHaveLength(nonCalciumCount);
      expect(vectors.algebraicState).toHaveLength(2);
      expect(Object.values(vectors.calciumByWall)
        .flatMap(({ r, d }) => [r, d])).toHaveLength(10);

      const decoded = decodePhaseB1EndpointTopologyVectorsV1({
        timeSec: endpoint.timeSec,
        ...vectors,
      });
      expect(encodePhaseB1StoredDifferentialStateV1(
        decoded.differentialState,
      )).toEqual(storedVector);
      expect(decoded.triSegCoordinates).toEqual(endpoint.triSegCoordinates);
      expect(encodePhaseB1EndpointTopologyVectorsV1(decoded)).toEqual(vectors);
      if (mode === "off") {
        expect(Object.hasOwn(
          endpoint.differentialState,
          "slsAlphaVByWall",
        )).toBe(false);
        expect(Object.hasOwn(
          decoded.differentialState,
          "slsAlphaVByWall",
        )).toBe(false);
      }
    },
  );

  it("copies a deeply immutable endpoint snapshot from mutable caller records", () => {
    const canonical = storedState("off");
    const mutable = mutableCopy(canonical);
    const before = encodePhaseB1StoredDifferentialStateV1(mutable);
    const endpoint = createPhaseB1EndpointStateV1({
      timeSec: 0.25,
      differentialState: mutable,
      triSegCoordinates: { V_m_S: 1e-5, y_m: 0.02 },
    });
    (mutable.bloodVolumesM3 as Record<string, number>)[
      BLOOD_COMPARTMENT_IDS[0]
    ] = 9;
    (mutable.landByWall.LA as unknown as number[])[0] = 0.99;
    expect(encodePhaseB1StoredDifferentialStateV1(
      endpoint.differentialState,
    )).toEqual(before);
    expect(Object.isFrozen(endpoint.differentialState)).toBe(true);
    expect(Object.isFrozen(endpoint.differentialState.bloodVolumesM3)).toBe(true);
    expect(Object.isFrozen(endpoint.differentialState.landByWall.LA)).toBe(true);
  });

  it("rejects exact-record violations and an SLS-off ghost state", () => {
    const off = storedState("off");
    expect(() => createPhaseB1EndpointStateV1({
      timeSec: 0,
      differentialState: off,
      triSegCoordinates: { V_m_S: 0, y_m: 0.03 },
      undeclared: true,
    } as never)).toThrow(/must contain exactly/);
    expect(() => createPhaseB1EndpointStateV1({
      timeSec: 0,
      differentialState: {
        ...off,
        slsAlphaVByWall: Object.fromEntries(
          WALL_IDS.map((wallId) => [wallId, 0]),
        ),
      } as never,
      triSegCoordinates: { V_m_S: 0, y_m: 0.03 },
    })).toThrow(/undeclared=\[slsAlphaVByWall\]/);

    const endpoint = createPhaseB1EndpointStateV1({
      timeSec: 0,
      differentialState: off,
      triSegCoordinates: { V_m_S: 0, y_m: 0.03 },
    });
    const vectors = encodePhaseB1EndpointTopologyVectorsV1(endpoint);
    expect(() => decodePhaseB1EndpointTopologyVectorsV1({
      timeSec: 0,
      ...vectors,
      undeclared: true,
    } as never)).toThrow(/must contain exactly/);
    const algebraicWithExtra = [...vectors.algebraicState];
    Object.defineProperty(algebraicWithExtra, "extra", {
      value: true,
      enumerable: true,
    });
    expect(() => decodePhaseB1EndpointTopologyVectorsV1({
      timeSec: 0,
      ...vectors,
      algebraicState: algebraicWithExtra,
    })).toThrow(/extra properties/);
  });
});

function storedState(mode: PhaseB1SlsModeV1): PhaseB1StoredDifferentialStateV1 {
  const vector: number[] = [];
  vector.push(...Array.from(
    { length: 8 },
    (_, index) => (index + 1) * 1e-5,
  ));
  vector.push(...Array.from(
    { length: 6 },
    (_, index) => (index - 2) * 1e-6,
  ));
  for (let index = 0; index < WALL_IDS.length; index += 1) {
    vector.push(0.1 + 0.01 * index, 0.2 + 0.01 * index);
    vector.push(
      0.4 + 0.01 * index,
      0.1,
      0.15,
      0.2,
      -0.4 + 0.01 * index,
      -0.2 + 0.01 * index,
    );
    if (mode === "on") vector.push(0.02 + 0.001 * index);
  }
  return decodePhaseB1StoredDifferentialStateV1(vector, mode);
}

function mutableCopy(
  state: PhaseB1StoredDifferentialStateV1,
): PhaseB1StoredDifferentialStateV1 {
  const common = {
    bloodVolumesM3: { ...state.bloodVolumesM3 },
    inertialFlowsM3PerSec: { ...state.inertialFlowsM3PerSec },
    calciumByWall: Object.fromEntries(WALL_IDS.map((wallId) => [
      wallId,
      { ...state.calciumByWall[wallId] },
    ])) as PhaseB1StoredDifferentialStateV1["calciumByWall"],
    landByWall: Object.fromEntries(WALL_IDS.map((wallId) => [
      wallId,
      [...state.landByWall[wallId]],
    ])) as unknown as PhaseB1StoredDifferentialStateV1["landByWall"],
  };
  return state.slsMode === "on"
    ? {
      ...common,
      slsMode: "on",
      slsAlphaVByWall: { ...state.slsAlphaVByWall },
    }
    : { ...common, slsMode: "off" };
}
