import { describe, expect, it } from "vitest";

import {
  MAIN_WIRE_SCIENTIFIC_OBSERVABLE_CATALOG_V1,
  MAIN_WIRE_SCIENTIFIC_OBSERVABLE_FRAME_V1_ID,
  MAIN_WIRE_SCIENTIFIC_OBSERVABLE_IDS_V1,
  MAIN_WIRE_SCIENTIFIC_OBSERVABLE_REGISTRY_V1_ID,
  MAIN_WIRE_SCIENTIFIC_OBSERVABLE_REGISTRY_V1_SCHEMA_VERSION,
} from "@/engine/scientific/observables";
import type {
  SimulationReleaseRef,
} from "@/engine/scientific/release";
import {
  projectRuntimeObservablePointToMainWireScientificObservableFrameV1,
  ScientificProductStudioObservableFrameProjectionErrorV1,
} from "@/components/scientificProduct/ScientificProductStudioObservableFrameProjectionV1";
import type {
  RuntimeObservablePointV1,
} from "@/studio/contracts/v1";

const RELEASE_REF_V1: SimulationReleaseRef = Object.freeze({
  id: "circleheart-main-wire-test",
  version: "1.2.3",
  sha256: "a".repeat(64),
});

describe("Scientific Product Studio observable frame projection V1", () => {
  it("projects the complete catalog with exact identity and source-kind quality", () => {
    const point: RuntimeObservablePointV1 = {
      sequence: 42,
      simulationTimeSec: 12.5,
      phase01: 0.5,
      values: {
        "hemodynamics.volume.LV": 123,
        "valve.AoV.flow": 45.6,
        "solver.mechanics.iterations": 3,
        "solver.mechanics.residual_norm": 0,
      },
    };

    const frame =
      projectRuntimeObservablePointToMainWireScientificObservableFrameV1({
        point,
        releaseRef: RELEASE_REF_V1,
      });

    expect(frame).toMatchObject({
      frameId: MAIN_WIRE_SCIENTIFIC_OBSERVABLE_FRAME_V1_ID,
      registryId: MAIN_WIRE_SCIENTIFIC_OBSERVABLE_REGISTRY_V1_ID,
      schemaVersion:
        MAIN_WIRE_SCIENTIFIC_OBSERVABLE_REGISTRY_V1_SCHEMA_VERSION,
      sourceObservationId: "main-wire-scientific-session-observation-v1",
      source: "accepted-step",
      revision: point.sequence,
      acceptedTimeSec: point.simulationTimeSec,
      releaseRef: RELEASE_REF_V1,
    });
    expect(Object.keys(frame.values)).toEqual(
      MAIN_WIRE_SCIENTIFIC_OBSERVABLE_IDS_V1,
    );
    expect(Object.keys(frame.values)).toHaveLength(
      MAIN_WIRE_SCIENTIFIC_OBSERVABLE_CATALOG_V1.length,
    );
    expect(frame.values["hemodynamics.volume.LV"]).toEqual({
      observableId: "hemodynamics.volume.LV",
      value: 123,
      availability: "available",
      quality: "authoritative-state",
    });
    expect(frame.values["valve.AoV.flow"]).toEqual({
      observableId: "valve.AoV.flow",
      value: 45.6,
      availability: "available",
      quality: "accepted-derived",
    });
    expect(frame.values["solver.mechanics.iterations"]).toEqual({
      observableId: "solver.mechanics.iterations",
      value: 3,
      availability: "available",
      quality: "solver-diagnostic",
    });
    expect(frame.values["solver.mechanics.residual_norm"]).toEqual({
      observableId: "solver.mechanics.residual_norm",
      value: 0,
      availability: "available",
      quality: "solver-diagnostic",
    });
    expect(frame.values["hemodynamics.volume.LA"]).toEqual({
      observableId: "hemodynamics.volume.LA",
      value: null,
      availability: "not-evaluated-at-accepted-state",
      quality: "not-assessed",
    });
    expect(frame.values["coronary.flow.total"]).toEqual({
      observableId: "coronary.flow.total",
      value: null,
      availability: "not-modeled",
      quality: "not-assessed",
    });
    expect(frame.values["device.LVAD.flow"]).toEqual({
      observableId: "device.LVAD.flow",
      value: null,
      availability: "not-modeled",
      quality: "not-assessed",
    });
    expect(Object.isFrozen(frame)).toBe(true);
    expect(Object.isFrozen(frame.releaseRef)).toBe(true);
    expect(frame.releaseRef).not.toBe(RELEASE_REF_V1);
    expect(Object.isFrozen(frame.values)).toBe(true);
    expect(Object.values(frame.values).every(Object.isFrozen)).toBe(true);
  });

  it("accepts a null phase while retaining the exact sequence and time", () => {
    const point = validPointV1({
      sequence: 0,
      simulationTimeSec: 0,
      phase01: null,
    });

    const frame =
      projectRuntimeObservablePointToMainWireScientificObservableFrameV1({
        point,
        releaseRef: RELEASE_REF_V1,
      });

    expect(frame.revision).toBe(0);
    expect(frame.acceptedTimeSec).toBe(0);
  });

  it.each([
    ["negative sequence", { sequence: -1 }],
    ["fractional sequence", { sequence: 1.5 }],
    ["unsafe sequence", { sequence: Number.MAX_SAFE_INTEGER + 1 }],
    ["negative time", { simulationTimeSec: -0.001 }],
    ["NaN time", { simulationTimeSec: Number.NaN }],
    ["infinite time", { simulationTimeSec: Number.POSITIVE_INFINITY }],
    ["negative phase", { phase01: -0.001 }],
    ["phase at upper bound", { phase01: 1 }],
    ["NaN phase", { phase01: Number.NaN }],
    ["infinite phase", { phase01: Number.POSITIVE_INFINITY }],
  ])("rejects an invalid %s", (_label, overrides) => {
    expect(() =>
      projectRuntimeObservablePointToMainWireScientificObservableFrameV1({
        point: validPointV1(overrides),
        releaseRef: RELEASE_REF_V1,
      })
    ).toThrow(ScientificProductStudioObservableFrameProjectionErrorV1);
  });

  it.each([
    Number.NaN,
    Number.POSITIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
    "12",
    null,
  ])("rejects a non-finite numeric observable value %j", (invalidValue) => {
    const point = validPointV1({
      values: {
        "hemodynamics.volume.LV": invalidValue,
      },
    });

    expect(() =>
      projectRuntimeObservablePointToMainWireScientificObservableFrameV1({
        point,
        releaseRef: RELEASE_REF_V1,
      })
    ).toThrow(/hemodynamics\.volume\.LV must be finite/);
  });

  it("rejects unknown observables", () => {
    const point = validPointV1({
      values: {
        "hemodynamics.volume.LV": 123,
        "unknown.observable": 1,
      },
    });

    expect(() =>
      projectRuntimeObservablePointToMainWireScientificObservableFrameV1({
        point,
        releaseRef: RELEASE_REF_V1,
      })
    ).toThrow(/unknown observable unknown\.observable/);
  });

  it("rejects values for catalog entries declared not-modeled", () => {
    const point = validPointV1({
      values: {
        "coronary.flow.total": 0,
      },
    });

    expect(() =>
      projectRuntimeObservablePointToMainWireScientificObservableFrameV1({
        point,
        releaseRef: RELEASE_REF_V1,
      })
    ).toThrow(/coronary\.flow\.total is cataloged as not-modeled/);
  });

  it("rejects malformed values containers and release references", () => {
    expect(() =>
      projectRuntimeObservablePointToMainWireScientificObservableFrameV1({
        point: validPointV1({ values: [] }),
        releaseRef: RELEASE_REF_V1,
      })
    ).toThrow(/values must be an object/);

    expect(() =>
      projectRuntimeObservablePointToMainWireScientificObservableFrameV1({
        point: validPointV1(),
        releaseRef: {
          ...RELEASE_REF_V1,
          sha256: "not-a-digest",
        },
      })
    ).toThrow(/simulation release reference is invalid/);
  });
});

function validPointV1(
  overrides: Readonly<Record<string, unknown>> = {},
): RuntimeObservablePointV1 {
  return {
    sequence: 7,
    simulationTimeSec: 1.25,
    phase01: 0.25,
    values: {},
    ...overrides,
  } as unknown as RuntimeObservablePointV1;
}
