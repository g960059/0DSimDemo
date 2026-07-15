import { describe, expect, it } from "vitest";

import {
  NO_AVPD_FIVE_PATCH_LAND_WALL_IDS_V1,
  runNoAvpdFivePatchLandTriSegBenchV1,
} from "@/engine/mechanics2/benches/NoAvpdFivePatchLandTriSegBenchV1";
import {
  createDefaultNoAvpdFivePatchLandTriSegParamsV1,
  type NoAvpdFivePatchLandSlsVariantV1,
  type NoAvpdFivePatchLandTriSegParamsV1,
} from "@/engine/mechanics2/subsystems/NoAvpdFivePatchLandTriSegV1";
import { parseNoAvpdFivePatchLandTriSegCliArgsV1 } from "@/tools/mechanics2/runNoAvpdFivePatchLandTriSegBenchV1";

const VARIANTS: readonly NoAvpdFivePatchLandSlsVariantV1[] = [
  "off",
  "atrial-only",
  "all-patch",
];

describe("NoAvpdFivePatchLandTriSegBenchV1", () => {
  it.each(VARIANTS)(
    "runs a short cold structural case with the %s SLS variant",
    (slsVariant) => {
      const params = shortColdParams(slsVariant);
      const report = runNoAvpdFivePatchLandTriSegBenchV1({
        beats: 1,
        dtSec: 0.0025,
        params,
        slsVariant,
      });

      expect(
        report.status,
        JSON.stringify({
          failureReason: report.failureReason,
          numericalGates: report.numericalGates,
        }),
      ).toBe("pass");
      expect(report.statusScope).toBe("structural-numerical-only");
      expect(report.protocol.slsVariant).toBe(slsVariant);
      expect(report.protocol.physiologyGateApplied).toBe(false);
      expect(report.protocol.morphologyWinnerSelectionApplied).toBe(false);
      expect(report.rawLastCycleSamples).toHaveLength(20);
      expect(report.exactOneBeatFullStateReturnMap?.allComponentsFinite).toBe(
        true,
      );
      expect(report.fullStateReturnMapGate.applied).toBe(false);
      expect(report.fullStateReturnMapGate.pass).toBeNull();
      expect(Object.values(report.numericalGates).every(Boolean)).toBe(true);

      const sample = report.rawLastCycleSamples.at(-1)!;
      expect(Object.keys(sample.pressuresMmHg)).toHaveLength(8);
      expect(Object.keys(sample.flowsMlPerSec)).toHaveLength(8);
      expect(Object.keys(sample.walls)).toEqual(
        NO_AVPD_FIVE_PATCH_LAND_WALL_IDS_V1,
      );
      for (const wallId of NO_AVPD_FIVE_PATCH_LAND_WALL_IDS_V1) {
        expect(sample.walls[wallId].activeHomogenizationScale).toBe(1);
        expect(Object.keys(sample.walls[wallId].landStates).sort()).toEqual([
          "B",
          "CaTRPN",
          "S",
          "W",
          "zetaS",
          "zetaW",
        ]);
        expect(report.perWallNumericalGates[wallId].landWorkMapping).toBe(true);
        expect(
          report.perWallNumericalGates[wallId].landPopulationAndConservation,
        ).toBe(true);
        expect(report.perWallNumericalGates[wallId].slsWorkBalance).toBe(true);
      }
    },
    20_000,
  );

  it("parses the bounded CLI controls and keeps full output opt-in", () => {
    const parsed = parseNoAvpdFivePatchLandTriSegCliArgsV1([
      "--beats",
      "3",
      "--dt",
      "0.0025",
      "--sls",
      "atrial-only",
      "--return-map-tolerance",
      "0.01",
      "--output",
      "/tmp/five-patch.json",
    ]);
    expect(parsed.bench).toEqual({
      beats: 3,
      dtSec: 0.0025,
      slsVariant: "atrial-only",
      fullStateReturnMapMaxAbsDimensionlessTolerance: 0.01,
    });
    expect(parsed.outputPath).toBe("/tmp/five-patch.json");
    expect(parseNoAvpdFivePatchLandTriSegCliArgsV1([]).outputPath).toBeNull();
    expect(() =>
      parseNoAvpdFivePatchLandTriSegCliArgsV1(["--sls", "mixed"]),
    ).toThrow(/off, atrial-only, all-patch/);
  });
});

function shortColdParams(
  slsVariant: NoAvpdFivePatchLandSlsVariantV1,
): NoAvpdFivePatchLandTriSegParamsV1 {
  const base = createDefaultNoAvpdFivePatchLandTriSegParamsV1(slsVariant);
  const cycleLengthSec = 0.05;
  return {
    ...base,
    cycleLengthSec,
    calciumDrivers: Object.fromEntries(
      Object.entries(base.calciumDrivers).map(([wallId, driver]) => [
        wallId,
        {
          ...driver,
          cycleLengthSec,
          eventOnsetSec:
            (driver.eventOnsetSec / base.cycleLengthSec) * cycleLengthSec,
        },
      ]),
    ) as NoAvpdFivePatchLandTriSegParamsV1["calciumDrivers"],
  };
}
