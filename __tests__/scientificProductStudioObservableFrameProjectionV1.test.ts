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
  projectRuntimePresentationSampleToMainWireScientificObservableFrameV1,
  ScientificProductStudioObservableFrameProjectionErrorV1,
} from "@/components/scientificProduct/ScientificProductStudioObservableFrameProjectionV1";
import type {
  RuntimePresentationSampleV1,
} from "@/studio/contracts/v1";

const RELEASE_REF_V1: SimulationReleaseRef = Object.freeze({
  id: "circleheart-main-wire-test",
  version: "1.2.3",
  sha256: "a".repeat(64),
});

describe("Scientific Product Studio observable frame projection V1", () => {
  it("projects catalog-shaped chart values without promoting presentation coverage", () => {
    const sample: RuntimePresentationSampleV1 = {
      coverage: "decimated-presentation",
      presentationOrdinal: 17,
      acceptedRevision: 42,
      acceptedTimeSec: 12.5,
      acceptedStepSpanFromPrevious: 16,
      phase: 0.5,
      values: {
        "hemodynamics.volume.LV": 123,
        "valve.AoV.flow": 45.6,
        "solver.mechanics.iterations": 3,
        "solver.mechanics.residual_norm": 0,
      },
      retentionReason: "observation-stride",
    };

    const frame =
      projectRuntimePresentationSampleToMainWireScientificObservableFrameV1({
        sample,
        releaseRef: RELEASE_REF_V1,
      });

    expect(frame).toMatchObject({
      frameId: MAIN_WIRE_SCIENTIFIC_OBSERVABLE_FRAME_V1_ID,
      registryId: MAIN_WIRE_SCIENTIFIC_OBSERVABLE_REGISTRY_V1_ID,
      schemaVersion:
        MAIN_WIRE_SCIENTIFIC_OBSERVABLE_REGISTRY_V1_SCHEMA_VERSION,
      sourceObservationId: "main-wire-scientific-session-observation-v1",
      source: "accepted-step",
      revision: sample.acceptedRevision,
      acceptedTimeSec: sample.acceptedTimeSec,
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

  it("uses accepted identity rather than the retained presentation ordinal", () => {
    const sample = validSampleV1({
      presentationOrdinal: 3,
      acceptedRevision: 0,
      acceptedTimeSec: 0,
      phase: 0,
      retentionReason: "canonical-beat-boundary",
    });

    const frame =
      projectRuntimePresentationSampleToMainWireScientificObservableFrameV1({
        sample,
        releaseRef: RELEASE_REF_V1,
      });

    expect(frame.revision).toBe(0);
    expect(frame.acceptedTimeSec).toBe(0);
    expect(frame.revision).not.toBe(sample.presentationOrdinal);
  });

  it.each([
    ["negative acceptedRevision", { acceptedRevision: -1 }],
    ["fractional acceptedRevision", { acceptedRevision: 1.5 }],
    ["unsafe acceptedRevision", { acceptedRevision: Number.MAX_SAFE_INTEGER + 1 }],
    ["negative presentation ordinal", { presentationOrdinal: -1 }],
    ["negative declared span", { acceptedStepSpanFromPrevious: -1 }],
    ["negative time", { acceptedTimeSec: -0.001 }],
    ["NaN time", { acceptedTimeSec: Number.NaN }],
    ["infinite time", { acceptedTimeSec: Number.POSITIVE_INFINITY }],
    ["negative phase", { phase: -0.001 }],
    ["phase at upper bound", { phase: 1 }],
    ["NaN phase", { phase: Number.NaN }],
    ["infinite phase", { phase: Number.POSITIVE_INFINITY }],
    ["wrong coverage", { coverage: "exact-signal-replay-v1" }],
    ["unknown retention reason", { retentionReason: "because" }],
  ])("rejects an invalid %s", (_label, overrides) => {
    expect(() =>
      projectRuntimePresentationSampleToMainWireScientificObservableFrameV1({
        sample: validSampleV1(overrides),
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
    const sample = validSampleV1({
      values: {
        "hemodynamics.volume.LV": invalidValue,
      },
    });

    expect(() =>
      projectRuntimePresentationSampleToMainWireScientificObservableFrameV1({
        sample,
        releaseRef: RELEASE_REF_V1,
      })
    ).toThrow(/hemodynamics\.volume\.LV must be finite/);
  });

  it("rejects unknown observables", () => {
    const sample = validSampleV1({
      values: {
        "hemodynamics.volume.LV": 123,
        "unknown.observable": 1,
      },
    });

    expect(() =>
      projectRuntimePresentationSampleToMainWireScientificObservableFrameV1({
        sample,
        releaseRef: RELEASE_REF_V1,
      })
    ).toThrow(/unknown observable unknown\.observable/);
  });

  it("rejects values for catalog entries declared not-modeled", () => {
    const sample = validSampleV1({
      values: {
        "coronary.flow.total": 0,
      },
    });

    expect(() =>
      projectRuntimePresentationSampleToMainWireScientificObservableFrameV1({
        sample,
        releaseRef: RELEASE_REF_V1,
      })
    ).toThrow(/coronary\.flow\.total is cataloged as not-modeled/);
  });

  it("rejects malformed values containers and release references", () => {
    expect(() =>
      projectRuntimePresentationSampleToMainWireScientificObservableFrameV1({
        sample: validSampleV1({ values: [] }),
        releaseRef: RELEASE_REF_V1,
      })
    ).toThrow(/values must be an object/);

    expect(() =>
      projectRuntimePresentationSampleToMainWireScientificObservableFrameV1({
        sample: validSampleV1(),
        releaseRef: {
          ...RELEASE_REF_V1,
          sha256: "not-a-digest",
        },
      })
    ).toThrow(/simulation release reference is invalid/);
  });

  it("revalidates a mutable release ref instead of trusting a cached verdict", () => {
    // The projection caches validation results by reference identity. An
    // unfrozen object can be mutated behind its identity, so a cached verdict
    // would outlive the data it was made about. These two mutations are the
    // ways that could go wrong: a validated ref turning invalid, and a
    // validated ref turning into a different valid ref.
    const mutable: Record<string, unknown> = { ...RELEASE_REF_V1 };
    expect(
      projectRuntimePresentationSampleToMainWireScientificObservableFrameV1({
        sample: validSampleV1(),
        releaseRef: mutable as unknown as typeof RELEASE_REF_V1,
      }).releaseRef,
    ).toMatchObject({ sha256: RELEASE_REF_V1.sha256 });

    mutable["sha256"] = "not-a-digest";
    expect(() =>
      projectRuntimePresentationSampleToMainWireScientificObservableFrameV1({
        sample: validSampleV1(),
        releaseRef: mutable as unknown as typeof RELEASE_REF_V1,
      })
    ).toThrow(/simulation release reference is invalid/);

    const otherSha256 = "b".repeat(64);
    mutable["sha256"] = otherSha256;
    expect(
      projectRuntimePresentationSampleToMainWireScientificObservableFrameV1({
        sample: validSampleV1(),
        releaseRef: mutable as unknown as typeof RELEASE_REF_V1,
      }).releaseRef,
    ).toMatchObject({ sha256: otherSha256 });
  });

  it("reuses the validated result for a frozen release ref identity", () => {
    const frozen = Object.freeze({ ...RELEASE_REF_V1 });
    const first =
      projectRuntimePresentationSampleToMainWireScientificObservableFrameV1({
        sample: validSampleV1(),
        releaseRef: frozen,
      }).releaseRef;
    const second =
      projectRuntimePresentationSampleToMainWireScientificObservableFrameV1({
        sample: validSampleV1(),
        releaseRef: frozen,
      }).releaseRef;
    expect(second).toBe(first);
  });
});

function validSampleV1(
  overrides: Readonly<Record<string, unknown>> = {},
): RuntimePresentationSampleV1 {
  return {
    coverage: "decimated-presentation",
    presentationOrdinal: 7,
    acceptedRevision: 7,
    acceptedTimeSec: 1.25,
    acceptedStepSpanFromPrevious: 1,
    phase: 0.25,
    values: {},
    retentionReason: "observation-stride",
    ...overrides,
  } as unknown as RuntimePresentationSampleV1;
}
