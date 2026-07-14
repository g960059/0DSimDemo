import { describe, expect, it } from "vitest";

import {
  NO_AVPD_PASSIVE_RV_OWNER_FAMILY_DECLARATIONS_V1,
  NO_AVPD_PASSIVE_RV_OWNER_VOLUME_SEARCH_ML_V1,
  runNoAvpdPassiveRvOwnerSensitivityBenchV1,
} from "@/engine/mechanics2/benches/NoAvpdPassiveRvOwnerSensitivityBenchV1";
import { NO_AVPD_PASSIVE_LV_EDPVR_VOLUME_GRID_ML_V1 } from "@/engine/mechanics2/benches/NoAvpdPassiveLvEdpvrBenchV1";
import { DEFAULT_NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_PARAMS_V1 } from "@/engine/mechanics2/subsystems/NoAvpdFourChamberHillTriSegV1";

describe("NoAvpdPassiveRvOwnerSensitivityBenchV1", () => {
  it("predeclares two isolated one-factor families with their own references", () => {
    expect(NO_AVPD_PASSIVE_RV_OWNER_FAMILY_DECLARATIONS_V1).toHaveLength(2);
    const [loadFamily, materialFamily] =
      NO_AVPD_PASSIVE_RV_OWNER_FAMILY_DECLARATIONS_V1;

    expect(loadFamily).toMatchObject({
      familyId: "prescribed-rv-transmural-pressure",
      variedInput: "target-rv-transmural-pressure-only",
      invariants: {
        externalPressureMmHg: 0,
        referenceMidwallAreas: "baseline-unchanged",
        rightFreeWallPassiveTangentModulus: "baseline-unchanged",
      },
    });
    expect(
      loadFamily!.candidates.map((candidate) => ({
        target: candidate.targetRvTransmuralPressureMmHg,
        scale: candidate.rightFreeWallPassiveTangentModulusScale,
      })),
    ).toEqual([
      { target: 1.5, scale: 1 },
      { target: 2, scale: 1 },
      { target: 5, scale: 1 },
    ]);

    expect(materialFamily).toMatchObject({
      familyId: "rv-free-wall-passive-tangent-modulus",
      variedInput: "right-free-wall-passive-tangent-modulus-only",
      invariants: {
        externalPressureMmHg: 0,
        referenceMidwallAreas: "baseline-unchanged",
        targetRvTransmuralPressureMmHg: "fixed-at-5-mmHg",
      },
    });
    expect(
      materialFamily!.candidates.map((candidate) => ({
        target: candidate.targetRvTransmuralPressureMmHg,
        scale: candidate.rightFreeWallPassiveTangentModulusScale,
      })),
    ).toEqual([
      { target: 5, scale: 0.5 },
      { target: 5, scale: 1 },
      { target: 5, scale: 2 },
    ]);
    expect(
      Object.isFrozen(NO_AVPD_PASSIVE_RV_OWNER_FAMILY_DECLARATIONS_V1),
    ).toBe(true);
    expect(Object.isFrozen(loadFamily!.candidates)).toBe(true);
    expect(Object.isFrozen(materialFamily!.candidates)).toBe(true);
  });

  it("retains the complete volume grid and requested owner readbacks", () => {
    const defaultBefore = JSON.stringify(
      DEFAULT_NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_PARAMS_V1,
    );
    const report = cachedReport();
    expect(
      JSON.stringify(DEFAULT_NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_PARAMS_V1),
    ).toBe(defaultBefore);
    expect(report.summary).toEqual({
      familyCount: 2,
      candidateDeclarationCountIncludingFamilyReferences: 6,
      uniqueBenchExecutionCount: 5,
      reusedEffectiveInputCount: 1,
      allCandidatePointsAvailable: true,
      scalarWinnerSelected: false,
      physiologyGateApplied: false,
    });

    for (const family of report.families) {
      for (const candidate of family.candidates) {
        expect(candidate.edpvr.points.map((point) => point.lvVolumeMl)).toEqual(
          NO_AVPD_PASSIVE_LV_EDPVR_VOLUME_GRID_ML_V1,
        );
        expect(candidate.summary.requestedPointCount).toBe(25);
        expect(candidate.summary.rangePopulation).toBe(
          "available-points-only-no-imputation",
        );
        expect(candidate.summary.rootAvailability).toEqual({
          availablePointCount: 25,
          unavailablePointCount: 0,
          ambiguousPointCount: 0,
          allPointsAvailable: true,
        });
        expect(candidate.summary.requiredRvVolumeRangeMl).not.toBeNull();
        expect(candidate.summary.septalCapVolumeRangeMl).not.toBeNull();
        expect(candidate.summary.lvTransmuralPressureRangeMmHg).not.toBeNull();
        expect(
          candidate.summary.centeredSecantPressureSlopeRangeMmHgPerMl,
        ).not.toBeNull();
        expect(
          candidate.summary.maximumAbsoluteRvPressureTargetResidualMmHg,
        ).toBeLessThanOrEqual(candidate.edpvr.boundary.rvPressureToleranceMmHg);
        expect(
          candidate.summary.maximumTriSegRelativeResidual,
        ).toBeLessThanOrEqual(
          candidate.edpvr.boundary.triSegRelativeResidualTolerance,
        );
        expect(candidate.edpvr.boundary.rvVolumeSearchMl).toEqual(
          NO_AVPD_PASSIVE_RV_OWNER_VOLUME_SEARCH_ML_V1,
        );
        expect(candidate.summary.rootSearchHeadroom).toMatchObject({
          searchLowerBoundMl: 20,
          searchUpperBoundMl: 800,
          warningFractionOfUpperBound: 0.75,
          warningThresholdMl: 600,
          status: "below-search-headroom-warning-threshold",
          boundary:
            "engineering-search-headroom-only-not-physiologic-rv-volume-gate",
        });
        expect(
          candidate.summary.rootSearchHeadroom.minimumUpperHeadroomMl,
        ).toBeGreaterThan(0);
        expect(
          candidate.summary.rootSearchHeadroom.maximumRootFractionOfUpperBound,
        ).toBeLessThan(0.75);

        candidate.edpvr.points.forEach((point, index) => {
          expect(point.status, point.failureReason ?? undefined).toBe(
            "available",
          );
          if (point.status !== "available") return;
          expect(Number.isFinite(point.rvVolumeMl)).toBe(true);
          expect(
            Number.isFinite(point.triSegCoordinates.septalCapVolumeMl),
          ).toBe(true);
          expect(Number.isFinite(point.lvTransmuralPressureMmHg)).toBe(true);
          expect(point.outerDiagnostics.brackets).toHaveLength(1);
          if (index === 0 || index === candidate.edpvr.points.length - 1) {
            expect(point.centeredSecantPressureSlopeMmHgPerMl).toBeNull();
          } else {
            expect(
              Number.isFinite(point.centeredSecantPressureSlopeMmHgPerMl),
            ).toBe(true);
          }
        });
      }
    }
  });

  it("changes only the declared owner inside each family", () => {
    const baseline = DEFAULT_NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_PARAMS_V1;
    const baselineTangent =
      baseline.triSeg.rightFreeWall.material.passive.tangentModulusPa;
    const report = cachedReport();
    const [loadFamily, materialFamily] = report.families;

    for (const candidate of loadFamily!.candidates) {
      expect(candidate.edpvr.parameterSnapshot).toEqual(baseline);
      expect(candidate.edpvr.boundary.targetRvTransmuralPressureMmHg).toBe(
        candidate.declaration.targetRvTransmuralPressureMmHg,
      );
      expect(
        candidate.edpvr.parameterSnapshot.triSeg.rightFreeWall.material.passive
          .tangentModulusPa,
      ).toBe(baselineTangent);
    }

    for (const candidate of materialFamily!.candidates) {
      expect(candidate.edpvr.boundary.targetRvTransmuralPressureMmHg).toBe(5);
      expect(
        candidate.effectiveInputs.effectiveRightFreeWallPassiveTangentModulusPa,
      ).toBe(
        baselineTangent *
          candidate.declaration.rightFreeWallPassiveTangentModulusScale,
      );
      expect(normalizeRvTangent(candidate.edpvr.parameterSnapshot)).toEqual(
        baseline,
      );
    }

    const loadReference = loadFamily!.candidates[2]!;
    const materialReference = materialFamily!.candidates[1]!;
    expect(loadReference.edpvr).toBe(materialReference.edpvr);
    expect(loadReference.edpvr).toEqual(materialReference.edpvr);
    expect(loadReference.effectiveInputs).toEqual(
      materialReference.effectiveInputs,
    );

    const baselineRv = baseline.triSeg.rightFreeWall;
    for (const family of report.families) {
      for (const candidate of family.candidates) {
        const rv = candidate.edpvr.parameterSnapshot.triSeg.rightFreeWall;
        expect(rv.referenceMidwallAreaCm2).toBe(
          baselineRv.referenceMidwallAreaCm2,
        );
        expect(rv.wallVolumeMl).toBe(baselineRv.wallVolumeMl);
        expect(rv.material.passive.referenceStrain).toBe(
          baselineRv.material.passive.referenceStrain,
        );
      }
    }
  });
});

let reportCache: ReturnType<
  typeof runNoAvpdPassiveRvOwnerSensitivityBenchV1
> | null = null;

function cachedReport(): ReturnType<
  typeof runNoAvpdPassiveRvOwnerSensitivityBenchV1
> {
  reportCache ??= runNoAvpdPassiveRvOwnerSensitivityBenchV1();
  return reportCache;
}

function normalizeRvTangent(
  params: typeof DEFAULT_NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_PARAMS_V1,
) {
  const baseline = DEFAULT_NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_PARAMS_V1;
  return {
    ...params,
    triSeg: {
      ...params.triSeg,
      rightFreeWall: {
        ...params.triSeg.rightFreeWall,
        material: {
          ...params.triSeg.rightFreeWall.material,
          passive: {
            ...params.triSeg.rightFreeWall.material.passive,
            tangentModulusPa:
              baseline.triSeg.rightFreeWall.material.passive.tangentModulusPa,
          },
        },
      },
    },
  };
}
