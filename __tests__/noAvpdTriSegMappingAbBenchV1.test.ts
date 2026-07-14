import { describe, expect, it } from "vitest";

import {
  NO_AVPD_TRISEG_MAPPING_AB_FIXED_VOLUMES_V1,
  buildNoAvpdTriSegMappingParamsV1,
  runNoAvpdTriSegMappingAbBenchV1,
} from "@/engine/mechanics2/benches/NoAvpdTriSegMappingAbBenchV1";
import {
  initialNoAvpdFourChamberHillTriSegStateV1,
  solveNoAvpdPassiveTriSegEquilibriumV1,
  type NoAvpdFourChamberHillTriSegParamsV1,
} from "@/engine/mechanics2/subsystems/NoAvpdFourChamberHillTriSegV1";

describe("NoAvpdTriSegMappingAbBenchV1", () => {
  it("varies only the mapping while using the same passive cold protocol", () => {
    const lumens = buildNoAvpdTriSegMappingParamsV1(
      "lumens-2009-representative-tension-area-work",
    );
    const fullGradient = buildNoAvpdTriSegMappingParamsV1(
      "full-fiber-energy-gradient",
    );

    expect(lumens.triSegColdInitialization).toBe("passive-reequilibrated");
    expect(fullGradient.triSegColdInitialization).toBe(
      "passive-reequilibrated",
    );
    expect(withoutMapping(lumens)).toEqual(withoutMapping(fullGradient));
  });

  it("initializes both accepted-state layouts at their own passive equilibrium without crossing mappings", () => {
    for (const mappingMode of [
      "lumens-2009-representative-tension-area-work",
      "full-fiber-energy-gradient",
    ] as const) {
      const params = buildNoAvpdTriSegMappingParamsV1(mappingMode);
      const passive = solveNoAvpdPassiveTriSegEquilibriumV1(
        NO_AVPD_TRISEG_MAPPING_AB_FIXED_VOLUMES_V1,
        params,
      );
      const initial = initialNoAvpdFourChamberHillTriSegStateV1(params);

      expect(passive.converged, mappingMode).toBe(true);
      expect(passive.geometry.valid, mappingMode).toBe(true);
      expect(initial.triSegGeneralizedForceMapping).toBe(mappingMode);
      expect(initial.triSegContinuation.junctionRadiusCm).toBeCloseTo(
        passive.coordinates.junctionRadiusCm,
        12,
      );
      expect(initial.triSegContinuation.septalCapVolumeMl).toBeCloseTo(
        passive.coordinates.septalCapVolumeMl,
        12,
      );
      if (!passive.geometry.valid)
        throw new Error("unreachable invalid geometry");
      expect(initial.walls.leftFreeWall.totalStrain).toBeCloseTo(
        passive.geometry.walls.leftFreeWall.fiberNaturalStrain,
        12,
      );
      expect(initial.walls.septum.totalStrain).toBeCloseTo(
        passive.geometry.walls.septum.fiberNaturalStrain,
        12,
      );
      expect(initial.walls.rightFreeWall.totalStrain).toBeCloseTo(
        passive.geometry.walls.rightFreeWall.fiberNaturalStrain,
        12,
      );
    }
  });

  it("retains coarse-step candidate failures instead of dropping either arm", () => {
    const report = runNoAvpdTriSegMappingAbBenchV1({
      beats: 1,
      dtSec: 0.01,
      sampleEverySteps: 1,
    });

    expect(report.candidates).toHaveLength(2);
    expect(
      report.candidates.every(
        (candidate) =>
          candidate.passiveReequilibration.executionStatus === "pass",
      ),
    ).toBe(true);
    expect(
      report.candidates.map((candidate) => ({
        mappingMode: candidate.mappingMode,
        structuralStatus: candidate.closedLoop.structuralStatus,
        sourceReportRetained: candidate.closedLoopSourceReport !== null,
        usedEAForGate:
          candidate.closedLoop.reportOnlyMitralEA?.usedForGateOrRanking ??
          false,
      })),
    ).toEqual([
      {
        mappingMode: "lumens-2009-representative-tension-area-work",
        structuralStatus: "fail",
        sourceReportRetained: true,
        usedEAForGate: false,
      },
      {
        mappingMode: "full-fiber-energy-gradient",
        structuralStatus: "fail",
        sourceReportRetained: true,
        usedEAForGate: false,
      },
    ]);
  });
});

function withoutMapping(params: NoAvpdFourChamberHillTriSegParamsV1) {
  const { triSegGeneralizedForceMapping: _mapping, ...rest } = params;
  return rest;
}
