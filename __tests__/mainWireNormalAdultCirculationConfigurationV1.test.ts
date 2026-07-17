import { describe, expect, it } from "vitest";

import { defaultParams } from "@/engine/core/params";
import {
  buildNonCoronaryCirculationGraphV1,
  createInitialNonCoronaryCirculationStateV1,
} from "@/engine/core/nonCoronaryCirculationBackwardEulerV1";
import {
  assertMainWireNormalAdultCirculationConfigurationMatchesFixedRegistryV1,
  resolveMainWireNormalAdultCirculationConfigurationV1,
  type MainWireNormalAdultCirculationConfigurationSnapshotV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultCirculationConfigurationV1";
import {
  sanitizeForStableHash,
  stableHash,
} from "@/engine/myocardium/kinematics/stableHash";

describe("main-wire normal-adult circulation configuration snapshot V1", () => {
  it("materializes the pre-snapshot runtime, topology, cold volumes, and TBV exactly", () => {
    const resolved = resolveMainWireNormalAdultCirculationConfigurationV1();
    const graph = buildNonCoronaryCirculationGraphV1();
    const cold = createInitialNonCoronaryCirculationStateV1({
      timeSec: 0,
      runtime: resolved.runtime,
    });

    expect(resolved.runtime).toEqual({
      vascular: { venousTone: 0.15, arterialStiffness: 0.75 },
      losses: { systemicResistance: 1, pulmonaryResistance: 0.625 },
      respiratory: {
        PEEP: 0,
        Pth0: 0,
        respAmpTh: 0,
        respAmpAlv: 0,
        respRate: 0,
      },
    });
    expect(resolved.snapshot.effective.topology.nodes).toEqual(graph.nodes);
    expect(resolved.snapshot.effective.topology.edges).toEqual(graph.edges);
    expect(resolved.snapshot.effective.initialVolumeConstruction.nodeVolumesMl)
      .toEqual(cold.nodeVolumesMl);
    expect(resolved.snapshot.effective.initialVolumeConstruction
      .coldSeedTotalBloodVolumeMl)
      .toBe(cold.totalBloodVolumeMl);
    expect(cold.totalBloodVolumeMl).toBeCloseTo(4589.457569593876, 10);
    expect(resolved.snapshotStableHash)
      .toBe(stableHash(sanitizeForStableHash(resolved.snapshot)));
    expect(resolved.snapshot.exclusions.coronary).toEqual({
      sourceEnabled: true,
      effectiveIncluded: false,
      reason: "noncoronary-sidecar-scope",
    });
    expect(resolved.snapshot.exclusions.respiration).toMatchObject({
      sourceRatePerSec: 0.25,
      effectiveRatePerSec: 0,
      sourceAmplitudesAreZero: true,
    });
    expect(resolved.snapshot.source.officialOperatingPoint).toEqual({
      baselineId: "active-normal",
      fullGraphTargetBloodVolumeMl: 5600,
    });
    expect(resolved.snapshot.source.runtimeParameterSet.bloodVolumeLedger)
      .toEqual({
        projectTBV: true,
        bleedRateMlPerMin: 0,
        fluidRateMlPerMin: 0,
      });
    expect(resolved.snapshot.effective.initialVolumeConstruction).toMatchObject({
      officialTargetApplied: false,
      excludedCoronaryColdVolumeMl: 77.89,
      officialTargetMinusExcludedColdSeedVolumeMl: 5522.11,
      coldSeedShortfallFromOfficialMinusExcludedColdSeedMl:
        5522.11 - 4589.457569593876,
    });
  });

  it("records source valve L/B but applies only the fixed quasi-steady owner", () => {
    const { snapshot } = resolveMainWireNormalAdultCirculationConfigurationV1();
    for (const valveName of ["MV", "AoV", "TV", "PV"] as const) {
      const source = snapshot.source.runtimeParameterSet.valves[valveName];
      const effective = snapshot.effective.valves[valveName];
      const parameters = effective.parameters;
      expect(parameters.referenceAreaCm2).toBe(source.referenceAreaCm2);
      expect(parameters.maximumAreaCm2).toBe(source.maximumAreaCm2);
      expect(parameters.physiologicalLeakAreaCm2)
        .toBe(source.physiologicalLeakAreaCm2);
      expect(parameters.openingGainPerMmHg).toBe(source.openingGainPerMmHg);
      expect(parameters.openingTimeConstantSec)
        .toBe(source.openingTimeConstantSec);
      expect(parameters.closingTimeConstantSec)
        .toBe(source.closingTimeConstantSec);
      expect(parameters.openResistanceMmHgSecPerMl)
        .toBe(source.openResistanceMmHgSecPerMl);
      expect(effective.sourceInertanceRecordedButNotApplied)
        .toBe(source.sourceInertanceMmHgSec2PerMl);
      expect(effective.sourceQuadraticLossRecordedButNotApplied)
        .toBe(source.sourceQuadraticLossMmHgSec2PerMl2);
      expect(effective.acceptedMemory).toBe("leaflet-opening-fraction-only");
      expect(parameters.numericalAreaFloorCm2).toBe(1e-4);
      expect(parameters.openingDriveSmoothingMmHg).toBe(0.1);
      expect(parameters.quadraticFlowSmoothingMlPerSec).toBe(0.25);
      expect(effective.openingDriveDeadbandMmHg)
        .toBe(valveName === "MV" ? 0.6 : 0);
    }
    expect(snapshot.effective.numericalPolicy).toMatchObject({
      policyId: "noncoronary-circulation-newton-policy-v1",
      maxIterations: 30,
      scaledResidualInfinityTolerance: 2e-10,
      scaledUpdateInfinityTolerance: 2e-11,
      finiteDifferenceScaledStep: 2e-6,
      maximumLineSearchBacktracks: 24,
    });
    expect(snapshot.effective.pulmonaryVenousOstium).toMatchObject({
      effectiveKind: "resistive",
      sourceInertanceMmHgSec2PerMl: 0,
      inertanceApplied: false,
    });
  });

  it("is deeply frozen and registry comparison is independent of object key order", () => {
    const { snapshot } = resolveMainWireNormalAdultCirculationConfigurationV1();
    expect(Object.isFrozen(snapshot)).toBe(true);
    expect(Object.isFrozen(snapshot.effective)).toBe(true);
    expect(Object.isFrozen(snapshot.effective.topology.nodes)).toBe(true);
    expect(Object.isFrozen(snapshot.effective.initialVolumeConstruction.nodeVolumesMl))
      .toBe(true);

    const reordered = Object.fromEntries(
      Object.entries(snapshot).reverse(),
    ) as MainWireNormalAdultCirculationConfigurationSnapshotV1;
    expect(() =>
      assertMainWireNormalAdultCirculationConfigurationMatchesFixedRegistryV1(
        reordered,
      )).not.toThrow();
  });

  it.each([
    ["venousTone", 0.2, "vascular", "venousTone"],
    ["arterialStiffness", 0.9, "vascular", "arterialStiffness"],
    ["systemicResistance", 1.1, "losses", "systemicResistance"],
    ["pulmonaryResistance", 0.7, "losses", "pulmonaryResistance"],
    ["PEEP", 2, "respiratory", "PEEP"],
    ["Pth0", -2, "respiratory", "Pth0"],
  ] as const)(
    "materializes supported source scalar %s into the effective runtime",
    (sourceField, value, group, runtimeField) => {
      const canonical = resolveMainWireNormalAdultCirculationConfigurationV1();
      const changed = resolveMainWireNormalAdultCirculationConfigurationV1({
        ...defaultParams(),
        [sourceField]: value,
      });
      expect(changed.runtime[group][runtimeField]).toBe(value);
      expect(changed.snapshotStableHash).not.toBe(canonical.snapshotStableHash);
    },
  );

  it("records a source-only respiratory-rate change without applying oscillation", () => {
    const canonical = resolveMainWireNormalAdultCirculationConfigurationV1();
    const changed = resolveMainWireNormalAdultCirculationConfigurationV1({
      ...defaultParams(),
      respRate: 0.4,
    });
    expect(changed.snapshot.source.runtimeParameterSet.respiratory.respRate)
      .toBe(0.4);
    expect(changed.runtime.respiratory.respRate).toBe(0);
    expect(changed.snapshotStableHash).not.toBe(canonical.snapshotStableHash);
  });

  it.each([
    ["node override", { nodeOverrides: { SV: { Vu: 1700 } } }, /nodeOverrides/],
    ["edge override", { edgeOverrides: { PVein_LA: { R: 0.04 } } }, /edgeOverrides/],
    ["PV ostial inertance", {
      edgeOverrides: { PVein_LA: { pvOstialInertanceL: 0.001 } },
    }, /edgeOverrides/],
    ["chi", { useChiResistance: true }, /collapsible-tube chi/],
    ["thoracic respiration", { respAmpTh: 1 }, /respiratory oscillation/],
    ["alveolar respiration", { respAmpAlv: 1 }, /respiratory oscillation/],
    ["bleed", { bleedRate: 1 }, /fixed projected TBV ledger/],
    ["fluid", { fluidRate: 1 }, /fixed projected TBV ledger/],
    ["projector off", { projectTBV: false }, /fixed projected TBV ledger/],
    ["coronary control", { coronaryResistanceScale: 1.2 }, /coronaryResistanceScale/],
    ["coronary switch", { coronaryEnabled: false }, /coronaryEnabled/],
    ["coronary compression", { coronaryCompressionScale: 1.2 }, /coronaryCompressionScale/],
    ["coronary vasodilator", { coronaryVasodilator: 0.2 }, /coronaryVasodilator/],
    ["coronary reserve", { coronaryReserveMax: 4 }, /coronaryReserveMax/],
    ["LAD stenosis", { LADStenosis: 0.2 }, /LADStenosis/],
    ["LCx stenosis", { LCxStenosis: 0.2 }, /LCxStenosis/],
    ["RCA stenosis", { RCAStenosis: 0.2 }, /RCAStenosis/],
    ["valve scalar", { MV_Aref: 4.8 }, /MV_Aref differs from topology/],
    ["valve inertance", { MV_L: 0.0006 }, /MV L\/B differs from topology/],
    ["valve quadratic", { AoV_B: 2e-6 }, /AoV L\/B differs from topology/],
  ] as const)("fails closed for unsupported %s", (_label, patch, message) => {
    expect(() => resolveMainWireNormalAdultCirculationConfigurationV1({
      ...defaultParams(),
      ...patch,
    })).toThrow(message);
  });

  it("rejects tampering even when a caller presents a well-formed snapshot shape", () => {
    const { snapshot } = resolveMainWireNormalAdultCirculationConfigurationV1();
    const tampered = {
      ...snapshot,
      effective: {
        ...snapshot.effective,
        runtime: {
          ...snapshot.effective.runtime,
          vascular: {
            ...snapshot.effective.runtime.vascular,
            venousTone: 0.2,
          },
        },
      },
    } as MainWireNormalAdultCirculationConfigurationSnapshotV1;
    expect(() =>
      assertMainWireNormalAdultCirculationConfigurationMatchesFixedRegistryV1(
        tampered,
      )).toThrow(/does not match the fixed main-wire registry/);
    expect(() =>
      assertMainWireNormalAdultCirculationConfigurationMatchesFixedRegistryV1(
        undefined as never,
      )).toThrow(/missing or malformed/);
  });
});
