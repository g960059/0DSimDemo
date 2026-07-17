import { describe, expect, it } from "vitest";
import {
  createMainWireAdultFiveWallNonCoronaryReleaseV1,
} from "@/engine/scientific/assembly";
import {
  MAIN_WIRE_SCIENTIFIC_OBSERVABLE_CATALOG_V1,
  MAIN_WIRE_SCIENTIFIC_OBSERVABLE_IDS_V1,
  MAIN_WIRE_SCIENTIFIC_OBSERVABLE_REGISTRY_SNAPSHOT_V1,
  MAIN_WIRE_SCIENTIFIC_OBSERVABLE_REGISTRY_V1_ID,
  MAIN_WIRE_SCIENTIFIC_OBSERVABLE_REGISTRY_V1_SCHEMA_VERSION,
  projectMainWireScientificObservationV1,
  SCIENTIFIC_OBSERVABLE_AVAILABILITY_VALUES_V1,
} from "@/engine/scientific/observables";
import {
  createMainWireScientificSessionV1,
} from "@/engine/scientific/runtime";

describe("main-wire scientific observable registry V1", () => {
  it("defines unique stable IDs, physical units, and explicit capability gaps", () => {
    expect(new Set(MAIN_WIRE_SCIENTIFIC_OBSERVABLE_IDS_V1).size)
      .toBe(MAIN_WIRE_SCIENTIFIC_OBSERVABLE_IDS_V1.length);
    expect(MAIN_WIRE_SCIENTIFIC_OBSERVABLE_IDS_V1).toHaveLength(
      MAIN_WIRE_SCIENTIFIC_OBSERVABLE_CATALOG_V1.length,
    );
    expect(SCIENTIFIC_OBSERVABLE_AVAILABILITY_VALUES_V1).toEqual([
      "available",
      "not-modeled",
      "not-measurable",
      "not-converged",
      "not-evaluated-at-accepted-state",
    ]);
    expect(definition("hemodynamics.volume.LA")).toMatchObject({
      quantityKind: "volume",
      unit: "mL",
      modelingStatus: "modeled",
      sourceKind: "accepted-state",
    });
    expect(definition("hemodynamics.pressure.absolute.Ao")).toMatchObject({
      quantityKind: "pressure",
      unit: "mmHg",
      modelingStatus: "modeled",
    });
    expect(definition("valve.MV.flow")).toMatchObject({
      quantityKind: "flow",
      unit: "mL/s",
    });
    expect(definition("coronary.flow.total")).toMatchObject({
      modelingStatus: "not-modeled",
      sourceKind: "capability-placeholder",
    });
    expect(definition("device.LVAD.flow")).toMatchObject({
      modelingStatus: "not-modeled",
      sourceKind: "capability-placeholder",
    });
    expect(MAIN_WIRE_SCIENTIFIC_OBSERVABLE_REGISTRY_SNAPSHOT_V1)
      .toMatchObject({
        unavailableValuePolicy: "null-never-zero",
        availabilityAndQualityAreSeparate: true,
        frameProvenance: "exact-simulation-release-ref-required",
      });
    expect(Object.isFrozen(MAIN_WIRE_SCIENTIFIC_OBSERVABLE_CATALOG_V1)).toBe(true);
    expect(MAIN_WIRE_SCIENTIFIC_OBSERVABLE_CATALOG_V1.every(Object.isFrozen))
      .toBe(true);
  });

  it("projects cold state without inventing unevaluated or unmodeled zeros", async () => {
    const session = await createMainWireScientificSessionV1();
    const observation = session.observe();
    const first = projectMainWireScientificObservationV1(observation);
    const replay = projectMainWireScientificObservationV1(observation);

    expect(replay).toEqual(first);
    expect(replay).not.toBe(first);
    expect(first.registryId).toBe(MAIN_WIRE_SCIENTIFIC_OBSERVABLE_REGISTRY_V1_ID);
    expect(first.releaseRef).toEqual(session.releaseRef);
    expect(Object.isFrozen(first.releaseRef)).toBe(true);
    expect(first.schemaVersion)
      .toBe(MAIN_WIRE_SCIENTIFIC_OBSERVABLE_REGISTRY_V1_SCHEMA_VERSION);
    expect(Object.keys(first.values)).toHaveLength(
      MAIN_WIRE_SCIENTIFIC_OBSERVABLE_CATALOG_V1.length,
    );
    expect(first.values["hemodynamics.volume.LA"]).toMatchObject({
      value: expect.any(Number),
      availability: "available",
      quality: "authoritative-state",
    });
    expect(first.values["hemodynamics.pressure.absolute.LA"]).toMatchObject({
      value: expect.any(Number),
      availability: "available",
      quality: "accepted-derived",
    });
    for (const node of ["Ao", "PA", "PVein"] as const) {
      expect(first.values[`hemodynamics.pressure.absolute.${node}`]).toEqual({
        observableId: `hemodynamics.pressure.absolute.${node}`,
        value: null,
        availability: "not-evaluated-at-accepted-state",
        quality: "not-assessed",
      });
    }
    expect(first.values["valve.MV.flow"]).toMatchObject({
      value: null,
      availability: "not-evaluated-at-accepted-state",
      quality: "not-assessed",
    });
    expect(first.values["valve.MV.opening_fraction"]).toMatchObject({
      value: expect.any(Number),
      availability: "available",
      quality: "authoritative-state",
    });
    expect(first.values["coronary.flow.total"]).toEqual({
      observableId: "coronary.flow.total",
      value: null,
      availability: "not-modeled",
      quality: "not-assessed",
    });
    expect(first.values["device.LVAD.flow"]).toEqual({
      observableId: "device.LVAD.flow",
      value: null,
      availability: "not-modeled",
      quality: "not-assessed",
    });
    expect(first.values["conservation.total_blood_volume.error"])
      .toMatchObject({
        value: 0,
        availability: "available",
        quality: "solver-diagnostic",
      });
    expect(Object.isFrozen(first)).toBe(true);
    expect(Object.isFrozen(first.values)).toBe(true);
    expect(Object.values(first.values).every(Object.isFrozen)).toBe(true);
  });

  it("projects accepted-step vascular pressure, valve flow, and diagnostics", async () => {
    const session = await createMainWireScientificSessionV1();
    const step = session.step(0.002);
    expect(step.converged).toBe(true);
    if (step.converged === false) throw new Error(step.message);
    const frame = projectMainWireScientificObservationV1(step.observation);

    for (const node of ["Ao", "PA", "PVein"] as const) {
      expect(frame.values[`hemodynamics.pressure.absolute.${node}`])
        .toMatchObject({
          value: expect.any(Number),
          availability: "available",
          quality: "accepted-derived",
        });
    }
    for (const valve of ["MV", "AoV", "TV", "PV"] as const) {
      expect(frame.values[`valve.${valve}.flow`]).toMatchObject({
        value: expect.any(Number),
        availability: "available",
        quality: "accepted-derived",
      });
    }
    expect(frame.values["hemodynamics.flow.pulmonary_venous"])
      .toMatchObject({
        value: expect.any(Number),
        availability: "available",
        quality: "accepted-derived",
      });
    for (const id of [
      "solver.mechanics.residual_norm",
      "solver.mechanics.iterations",
      "solver.circulation.scaled_residual_infinity_norm",
      "solver.continuity.maximum_residual",
      "solver.mechanics.callback_count",
      "solver.mechanics.callback_cache_hits",
      "pericardium.excess_pressure",
    ] as const) {
      expect(frame.values[id]).toMatchObject({
        value: expect.any(Number),
        availability: "available",
        quality: "solver-diagnostic",
      });
    }
  });

  it("locks the exact registry catalog into the canonical release", async () => {
    const release = await createMainWireAdultFiveWallNonCoronaryReleaseV1();
    expect(release.manifest.observableSchema).toMatchObject({
      schemaId: MAIN_WIRE_SCIENTIFIC_OBSERVABLE_REGISTRY_V1_ID,
      schemaVersion:
        MAIN_WIRE_SCIENTIFIC_OBSERVABLE_REGISTRY_V1_SCHEMA_VERSION,
      snapshot: {
        registry: MAIN_WIRE_SCIENTIFIC_OBSERVABLE_REGISTRY_SNAPSHOT_V1,
      },
    });
    expect((release.manifest.observableSchema.snapshot.registry as any).catalog)
      .toEqual(MAIN_WIRE_SCIENTIFIC_OBSERVABLE_CATALOG_V1);
  });
});

function definition(observableId: string) {
  const found = MAIN_WIRE_SCIENTIFIC_OBSERVABLE_CATALOG_V1.find((entry) =>
    entry.observableId === observableId);
  if (!found) throw new Error(`missing observable definition ${observableId}`);
  return found;
}
