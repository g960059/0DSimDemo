import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  buildPhaseB1NewtonResidualLabelsV1,
  buildPhaseB1NewtonUnknownLabelsV1,
  buildPhaseB1StateNewtonTopologyV1,
  buildPhaseB1StoredDifferentialLabelsV1,
  decodePhaseB1NewtonUnknownStateV1,
  decodePhaseB1StoredDifferentialStateV1,
  encodePhaseB1NewtonUnknownStateV1,
  encodePhaseB1StoredDifferentialStateV1,
  phaseB1StateNewtonTopologyHashPayloadV1,
  type PhaseB1NewtonUnknownStateV1,
  type PhaseB1SlsModeV1,
  type PhaseB1StoredDifferentialStateV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1StoredStateNewtonTopologyV1";
import {
  canonicalizeJson,
} from "@/engine/myocardium/fourChamberV1/manifests/canonicalJson";
import {
  FOUR_CHAMBER_BASELINE_STATE_LAYOUT_V1,
} from "@/engine/myocardium/fourChamberV1/state/fourChamberStateLayoutV1";
import {
  BLOOD_COMPARTMENT_IDS,
  INERTIAL_FLOW_IDS,
  WALL_IDS,
} from "@/engine/myocardium/fourChamberV1/topology/contracts";

describe("four-chamber Phase B1 stored-state/Newton topology", () => {
  const descriptor = buildPhaseB1StateNewtonTopologyV1(sha256);

  it("freezes the content-hashed 59/54 stored and 51/46 Newton contracts", () => {
    expect(descriptor.contentSha256).toBe(
      "24ff7f39e3ecc2edc4d453b3af00348ff7f457e18b88d13a3ea2d2ca87df94ce",
    );
    expect(descriptor.contentSha256).toBe(sha256(canonicalizeJson(
      phaseB1StateNewtonTopologyHashPayloadV1(descriptor),
    )));
    expect(descriptor.slsOn.storedDifferentialStateCount).toBe(59);
    expect(descriptor.slsOff.storedDifferentialStateCount).toBe(54);
    expect(descriptor.slsOn.newtonUnknownCount).toBe(51);
    expect(descriptor.slsOff.newtonUnknownCount).toBe(46);
    expect(descriptor.slsOn.newtonResidualCount).toBe(51);
    expect(descriptor.slsOff.newtonResidualCount).toBe(46);
    expect(descriptor.exactCalciumContract).toEqual({
      storedStateCount: 10,
      storedStateReachableDomain:
        "nonnegative-and-decay-drive-greater-than-or-equal-to-rise-drive",
      exactlyPropagatedKnownForcing: true,
      newtonUnknownCount: 0,
      backwardEulerResidualCount: 0,
    });
    expect(descriptor.slsOff.slsStatePresence)
      .toBe("physically-absent-no-placeholder");
  });

  it.each(["on", "off"] as const)(
    "round-trips the %s stored differential state",
    (mode) => {
      const state = storedState(mode);
      const encoded = encodePhaseB1StoredDifferentialStateV1(state);
      expect(encoded).toHaveLength(mode === "on" ? 59 : 54);
      const decoded = decodePhaseB1StoredDifferentialStateV1(encoded, mode);
      expect(encodePhaseB1StoredDifferentialStateV1(decoded)).toEqual(encoded);
      if (mode === "off") {
        expect(Object.hasOwn(decoded, "slsAlphaVByWall")).toBe(false);
      }
    },
  );

  it.each(["on", "off"] as const)(
    "round-trips the %s Newton unknown vector",
    (mode) => {
      const state = newtonState(mode);
      const encoded = encodePhaseB1NewtonUnknownStateV1(state);
      expect(encoded).toHaveLength(mode === "on" ? 51 : 46);
      const decoded = decodePhaseB1NewtonUnknownStateV1(encoded, mode);
      expect(encodePhaseB1NewtonUnknownStateV1(decoded)).toEqual(encoded);
      if (mode === "off") {
        expect(Object.hasOwn(decoded, "slsAlphaVByWall")).toBe(false);
      }
    },
  );

  it.each(["on", "off"] as const)(
    "uses the baseline stored order and mandated %s Newton block order",
    (mode) => {
      const storedLabels = buildPhaseB1StoredDifferentialLabelsV1(mode);
      const expectedStored = FOUR_CHAMBER_BASELINE_STATE_LAYOUT_V1.states
        .filter((state) => mode === "on" || state.owner !== "passive-wall-sls")
        .map((state) => state.key);
      expect(storedLabels).toEqual(expectedStored);
      expect(new Set(storedLabels).size).toBe(storedLabels.length);

      const unknownLabels = buildPhaseB1NewtonUnknownLabelsV1(mode);
      const residualLabels = buildPhaseB1NewtonResidualLabelsV1(mode);
      expect(unknownLabels.slice(0, 8)).toEqual(
        FOUR_CHAMBER_BASELINE_STATE_LAYOUT_V1.states
          .filter((state) => state.owner === "circulation-volume")
          .map((state) => state.key),
      );
      expect(unknownLabels.slice(8, 14)).toEqual(
        FOUR_CHAMBER_BASELINE_STATE_LAYOUT_V1.states
          .filter((state) => state.owner === "circulation-inertial-flow")
          .map((state) => state.key),
      );
      expect(unknownLabels.slice(14, 44)).toEqual(
        FOUR_CHAMBER_BASELINE_STATE_LAYOUT_V1.states
          .filter((state) => state.owner === "land2017-active-only-rate-free")
          .map((state) => state.key),
      );
      const triSegStart = mode === "on" ? 49 : 44;
      expect(unknownLabels.slice(triSegStart)).toEqual([
        "algebraic.triseg.V_m_S",
        "algebraic.triseg.y_m",
      ]);
      if (mode === "on") {
        expect(unknownLabels.slice(44, 49)).toEqual(
          FOUR_CHAMBER_BASELINE_STATE_LAYOUT_V1.states
            .filter((state) => state.owner === "passive-wall-sls")
            .map((state) => state.key),
        );
      } else {
        expect(unknownLabels.some((label) => label.includes(".sls."))).toBe(false);
      }
      expect(new Set(unknownLabels).size).toBe(unknownLabels.length);
      expect(new Set(residualLabels).size).toBe(residualLabels.length);
      expect(unknownLabels.some((label) => label.includes(".calcium."))).toBe(false);
      expect(residualLabels.some((label) => label.includes(".calcium."))).toBe(false);
      expect(residualLabels.slice(0, triSegStart)).toEqual(
        unknownLabels.slice(0, triSegStart).map((label) => `residual.${label}`),
      );
      expect(residualLabels.slice(triSegStart)).toEqual([
        "residual.triseg.equilibrium.axialNPerM",
        "residual.triseg.equilibrium.radialNPerM",
      ]);
    },
  );

  it("rejects invalid stored and Newton vector lengths", () => {
    expect(() => decodePhaseB1StoredDifferentialStateV1(
      Array.from({ length: 58 }, () => 1),
      "on",
    )).toThrow(/length 59/);
    expect(() => decodePhaseB1StoredDifferentialStateV1(
      Array.from({ length: 53 }, () => 1),
      "off",
    )).toThrow(/length 54/);
    expect(() => decodePhaseB1NewtonUnknownStateV1(
      Array.from({ length: 50 }, () => 1),
      "on",
    )).toThrow(/length 51/);
    expect(() => decodePhaseB1NewtonUnknownStateV1(
      Array.from({ length: 45 }, () => 1),
      "off",
    )).toThrow(/length 46/);
    expect(() => decodePhaseB1NewtonUnknownStateV1(
      Array.from({ length: 46 }, () => 1),
      "invalid",
    )).toThrow(/must be on or off/);
  });

  it("rejects extraneous fields and SLS placeholders in the off topology", () => {
    const offStored = storedState("off");
    expect(() => encodePhaseB1StoredDifferentialStateV1({
      ...offStored,
      slsAlphaVByWall: numericWallRecord(0.1),
    })).toThrow(/undeclared=\[slsAlphaVByWall\]/);

    const onNewton = newtonState("on");
    expect(() => encodePhaseB1NewtonUnknownStateV1({
      ...onNewton,
      calciumByWall: calciumRecord(),
    })).toThrow(/undeclared=\[calciumByWall\]/);

    const nestedExtra = {
      ...offStored,
      calciumByWall: {
        ...offStored.calciumByWall,
        LA: { ...offStored.calciumByWall.LA, extra: 1 },
      },
    };
    expect(() => encodePhaseB1StoredDifferentialStateV1(nestedExtra))
      .toThrow(/undeclared=\[extra\]/);

    const vector = Array.from({ length: 46 }, () => 1);
    Object.defineProperty(vector, "extra", { value: 1, enumerable: true });
    expect(() => decodePhaseB1NewtonUnknownStateV1(vector, "off"))
      .toThrow(/extra properties/);
  });

  it("rejects prescribed-calcium states outside the reachable drive domain", () => {
    const state = storedState("off");
    expect(() => encodePhaseB1StoredDifferentialStateV1({
      ...state,
      calciumByWall: {
        ...state.calciumByWall,
        LA: { r: 0.4, d: 0.2 },
      },
    })).toThrow(/decay drive >= rise drive/);
    const encoded = [...encodePhaseB1StoredDifferentialStateV1(state)];
    encoded[14] = 0.4;
    encoded[15] = 0.2;
    expect(() => decodePhaseB1StoredDifferentialStateV1(encoded, "off"))
      .toThrow(/decay drive >= rise drive/);
  });
});

function storedState(mode: PhaseB1SlsModeV1): PhaseB1StoredDifferentialStateV1 {
  const common = {
    bloodVolumesM3: Object.freeze(Object.fromEntries(
      BLOOD_COMPARTMENT_IDS.map((id, index) => [id, (index + 1) * 1e-5]),
    )) as PhaseB1StoredDifferentialStateV1["bloodVolumesM3"],
    inertialFlowsM3PerSec: Object.freeze(Object.fromEntries(
      INERTIAL_FLOW_IDS.map((id, index) => [id, (index - 2) * 1e-6]),
    )) as PhaseB1StoredDifferentialStateV1["inertialFlowsM3PerSec"],
    calciumByWall: calciumRecord(),
    landByWall: landRecord(),
  };
  return mode === "on"
    ? Object.freeze({
      ...common,
      slsMode: "on" as const,
      slsAlphaVByWall: numericWallRecord(0.05),
    })
    : Object.freeze({ ...common, slsMode: "off" as const });
}

function newtonState(mode: PhaseB1SlsModeV1): PhaseB1NewtonUnknownStateV1 {
  const stored = storedState(mode);
  const common = {
    bloodVolumesM3: stored.bloodVolumesM3,
    inertialFlowsM3PerSec: stored.inertialFlowsM3PerSec,
    landByWall: stored.landByWall,
    triSegCoordinates: Object.freeze({ V_m_S: 2e-5, y_m: 0.03 }),
  };
  return mode === "on" && stored.slsMode === "on"
    ? Object.freeze({
      ...common,
      slsMode: "on" as const,
      slsAlphaVByWall: stored.slsAlphaVByWall,
    })
    : Object.freeze({ ...common, slsMode: "off" as const });
}

function calciumRecord() {
  return Object.freeze(Object.fromEntries(WALL_IDS.map((wallId, index) => [
    wallId,
    Object.freeze({ r: 0.1 + index * 0.01, d: 0.2 + index * 0.01 }),
  ]))) as PhaseB1StoredDifferentialStateV1["calciumByWall"];
}

function landRecord() {
  return Object.freeze(Object.fromEntries(WALL_IDS.map((wallId, index) => [
    wallId,
    Object.freeze([
      0.1 + index * 0.01,
      0.2,
      0.05,
      0.03,
      -0.4 + index * 0.01,
      -0.2 + index * 0.01,
    ]),
  ]))) as PhaseB1StoredDifferentialStateV1["landByWall"];
}

function numericWallRecord(base: number) {
  return Object.freeze(Object.fromEntries(WALL_IDS.map((wallId, index) => [
    wallId,
    base + index * 0.01,
  ]))) as Readonly<Record<(typeof WALL_IDS)[number], number>>;
}

function sha256(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}
