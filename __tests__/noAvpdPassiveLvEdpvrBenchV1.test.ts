import { describe, expect, it } from "vitest";
import {
  DEFAULT_NO_AVPD_PASSIVE_LV_EDPVR_BOUNDARY_V1,
  NO_AVPD_PASSIVE_LV_EDPVR_VOLUME_GRID_ML_V1,
  evaluateNoAvpdPassiveLvEdpvrPointV1,
  runNoAvpdPassiveLvEdpvrBenchV1,
  type NoAvpdPassiveLvEdpvrAvailablePointV1,
} from "@/engine/mechanics2/benches/NoAvpdPassiveLvEdpvrBenchV1";
import {
  evaluateHillPassiveEquilibriumV1,
  initialHillCeSeeSlsStateV1,
  trialHillCeSeeSlsV1,
  type HillCeSeeSlsParamsV1,
} from "@/engine/mechanics2/constitutive/HillCeSeeSlsV1";
import {
  DEFAULT_NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_PARAMS_V1,
  type NoAvpdFourChamberHillTriSegParamsV1,
} from "@/engine/mechanics2/subsystems/NoAvpdFourChamberHillTriSegV1";

describe("NoAvpdPassiveLvEdpvrBenchV1", () => {
  it("exposes the same equilibrium-passive branch as a zero-Ca relaxed Hill trial", () => {
    const material = DEFAULT_NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_PARAMS_V1
      .triSeg.leftFreeWall.material;
    for (const strain of [-0.12, -0.04, 0.04, 0.12]) {
      const passive = evaluateHillPassiveEquilibriumV1(strain, material);
      const trial = trialHillCeSeeSlsV1(
        initialHillCeSeeSlsStateV1(strain, strain, 0, 0),
        {
          dtSec: 0.01,
          totalStrain: strain,
          freeCalciumUm: 0,
          midpointFreeCalciumUm: 0,
        },
        material,
      );

      expect(passive.valid, passive.failureReason ?? undefined).toBe(true);
      expect(trial.valid, trial.issues.map((issue) => issue.message).join("; ")).toBe(true);
      expect(trial.solver.converged).toBe(true);
      expect(trial.readback.caTroponin01).toBe(0);
      expect(trial.readback.thinFilamentAvailability01).toBe(0);
      expect(trial.readback.stresses.contractileElementTensionPa).toBe(0);
      expect(trial.readback.stresses.seriesElasticTensionPa).toBe(0);
      expect(trial.readback.stresses.slsOverstressPa).toBe(0);
      expect(trial.readback.stresses.passiveEquilibriumPa).toBe(passive.stressPa);
      expect(trial.readback.tangentsPa.passiveEquilibriumPa).toBe(passive.tangentPa);
      expect(trial.readback.energies.passiveEquilibriumStorageJPerM3)
        .toBe(passive.storageJPerM3);
    }

    expect(evaluateHillPassiveEquilibriumV1(Number.NaN, material)).toMatchObject({
      valid: false,
      finite: false,
      stressPa: null,
    });
  });

  it("constructs a monotone, fully relaxed curve at the prescribed RV load", () => {
    const defaultParamsBefore = JSON.stringify(
      DEFAULT_NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_PARAMS_V1,
    );
    const report = baselineReport();
    expect(JSON.stringify(DEFAULT_NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_PARAMS_V1))
      .toBe(defaultParamsBefore);
    expect(report.parameterSnapshot)
      .toBe(DEFAULT_NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_PARAMS_V1);
    expect(report.points.map((point) => point.lvVolumeMl))
      .toEqual(NO_AVPD_PASSIVE_LV_EDPVR_VOLUME_GRID_ML_V1);
    expect(report.summary.allPointsAvailable).toBe(true);
    expect(report.summary.pressureNondecreasingAcrossAvailableAdjacentPoints).toBe(true);
    expect(report.summary.minimumCenteredSecantSlopeMmHgPerMl).toBeGreaterThanOrEqual(0);

    for (const point of report.points) {
      expect(point.status, point.failureReason ?? undefined).toBe("available");
      if (point.status !== "available") continue;
      expect(Math.abs(point.rvPressureTargetResidualMmHg))
        .toBeLessThanOrEqual(DEFAULT_NO_AVPD_PASSIVE_LV_EDPVR_BOUNDARY_V1.rvPressureToleranceMmHg);
      expect(point.rvTransmuralPressureMmHg).toBeGreaterThan(0);
      expect(point.lvTransmuralPressureMmHg).toBeGreaterThan(0);
      expect(point.triSegRelativeResidual)
        .toBeLessThanOrEqual(DEFAULT_NO_AVPD_PASSIVE_LV_EDPVR_BOUNDARY_V1.triSegRelativeResidualTolerance);
      for (const residual of Object.values(point.triSegVirtualWorkIdentityResiduals)) {
        expect(Math.abs(residual)).toBeLessThan(1e-7);
      }
      expect(point.outerDiagnostics.brackets).toHaveLength(1);
      expect(point.outerDiagnostics.sampledRvPressureMonotoneNondecreasing).toBe(true);
      expect(point.outerDiagnostics.innerFailureCount).toBe(0);
      expect(point.outerDiagnostics.innerTriSegSolveCount).toBeLessThanOrEqual(
        point.outerDiagnostics.scan.length
        + DEFAULT_NO_AVPD_PASSIVE_LV_EDPVR_BOUNDARY_V1.maximumOuterIterations,
      );
      let storedEnergySumJ = 0;
      for (const wallId of ["leftFreeWall", "septum", "rightFreeWall"] as const) {
        const wall = point.walls[wallId];
        expect(wall.activation01).toBe(0);
        expect(wall.contractileElementTensionPa).toBe(0);
        expect(wall.seriesElasticTensionPa).toBe(0);
        expect(wall.slsOverstressPa).toBe(0);
        expect(wall.totalTransmittedPa).toBe(wall.passiveEquilibriumStressPa);
        expect(wall.passiveEquilibriumStorageJPerM3).toBeGreaterThanOrEqual(0);
        expect(wall.passiveEquilibriumStorageJ).toBeGreaterThanOrEqual(0);
        expect(wall.passiveEquilibriumStorageJ).toBeCloseTo(
          wall.passiveEquilibriumStorageJPerM3
          * report.parameterSnapshot.triSeg[wallId].wallVolumeMl * 1e-6,
          13,
        );
        storedEnergySumJ += wall.passiveEquilibriumStorageJ;
      }
      expect(point.totalPassiveStoredEnergyJ).toBe(storedEnergySumJ);
    }
  });

  it("is invariant to active, SEE, SLS, calcium, valve, and vascular parameters", () => {
    const baseline = requireAvailable(evaluateNoAvpdPassiveLvEdpvrPointV1(140));
    const altered = requireAvailable(evaluateNoAvpdPassiveLvEdpvrPointV1(
      140,
      passiveInvariantParameterVariant(),
    ));

    expect(altered.lvTransmuralPressureMmHg).toBeCloseTo(baseline.lvTransmuralPressureMmHg, 11);
    expect(altered.rvVolumeMl).toBeCloseTo(baseline.rvVolumeMl, 11);
    expect(altered.triSegCoordinates.junctionRadiusCm)
      .toBeCloseTo(baseline.triSegCoordinates.junctionRadiusCm, 11);
    expect(altered.triSegCoordinates.septalCapVolumeMl)
      .toBeCloseTo(baseline.triSegCoordinates.septalCapVolumeMl, 11);
  });

  it("responds to LV passive stiffness and is robust to RV bracket scan resolution", () => {
    const baseline = requireAvailable(evaluateNoAvpdPassiveLvEdpvrPointV1(160));
    const stiffer = requireAvailable(evaluateNoAvpdPassiveLvEdpvrPointV1(
      160,
      withLvPassiveTangentScale(1.5),
    ));
    expect(stiffer.lvTransmuralPressureMmHg).toBeGreaterThan(baseline.lvTransmuralPressureMmHg);

    const coarse = requireAvailable(evaluateNoAvpdPassiveLvEdpvrPointV1(
      160,
      DEFAULT_NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_PARAMS_V1,
      { ...DEFAULT_NO_AVPD_PASSIVE_LV_EDPVR_BOUNDARY_V1, rvVolumeScanStepMl: 20 },
    ));
    expect(coarse.lvTransmuralPressureMmHg).toBeCloseTo(baseline.lvTransmuralPressureMmHg, 4);
    expect(coarse.rvVolumeMl).toBeCloseTo(baseline.rvVolumeMl, 3);

    const exactScanSample = baseline.outerDiagnostics.scan.find((sample) =>
      sample.status === "available" && sample.rvVolumeMl === 300
    );
    expect(exactScanSample?.rvTransmuralPressureMmHg).not.toBeNull();
    const exact = requireAvailable(evaluateNoAvpdPassiveLvEdpvrPointV1(
      160,
      DEFAULT_NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_PARAMS_V1,
      {
        ...DEFAULT_NO_AVPD_PASSIVE_LV_EDPVR_BOUNDARY_V1,
        targetRvTransmuralPressureMmHg: exactScanSample!.rvTransmuralPressureMmHg!,
      },
    ));
    expect(exact.outerDiagnostics.brackets).toHaveLength(1);
    expect(exact.outerDiagnostics.outerIterations).toBe(0);
    expect(exact.rvVolumeMl).toBe(300);

    const lowerRvLoad = requireAvailable(evaluateNoAvpdPassiveLvEdpvrPointV1(
      160,
      DEFAULT_NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_PARAMS_V1,
      {
        ...DEFAULT_NO_AVPD_PASSIVE_LV_EDPVR_BOUNDARY_V1,
        targetRvTransmuralPressureMmHg: 2,
      },
    ));
    expect(lowerRvLoad.rvTransmuralPressureMmHg).toBeCloseTo(2, 3);
    expect(lowerRvLoad.rvVolumeMl).toBeLessThan(baseline.rvVolumeMl);
    expect(lowerRvLoad.triSegCoordinates.septalCapVolumeMl)
      .not.toBeCloseTo(baseline.triSegCoordinates.septalCapVolumeMl, 3);
  });

  it("returns a structured unavailable point when the RV target cannot be bracketed", () => {
    const point = evaluateNoAvpdPassiveLvEdpvrPointV1(
      140,
      DEFAULT_NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_PARAMS_V1,
      {
        ...DEFAULT_NO_AVPD_PASSIVE_LV_EDPVR_BOUNDARY_V1,
        targetRvTransmuralPressureMmHg: 1e6,
      },
    );
    expect(point.status).toBe("unavailable");
    expect(point.failureReason).toMatch(/no RV-volume bracket/);
    expect(point.rvVolumeMl).toBeNull();
    expect(point.outerDiagnostics.brackets).toHaveLength(0);
  });

  it("does not claim root uniqueness across incomplete scans or multiple exact roots", () => {
    const base = DEFAULT_NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_PARAMS_V1;
    const material = base.triSeg.leftFreeWall.material;
    const invalidMaterialParams: NoAvpdFourChamberHillTriSegParamsV1 = {
      ...base,
      triSeg: {
        ...base.triSeg,
        leftFreeWall: {
          ...base.triSeg.leftFreeWall,
          material: {
            ...material,
            passive: { ...material.passive, tangentModulusPa: -1 },
          },
        },
      },
    };
    const incomplete = evaluateNoAvpdPassiveLvEdpvrPointV1(140, invalidMaterialParams);
    expect(incomplete.status).toBe("unavailable");
    expect(incomplete.failureReason).toMatch(/inner TriSeg failures/);
    expect(incomplete.outerDiagnostics.innerFailureCount).toBeGreaterThan(0);

    const multipleExactRoots = evaluateNoAvpdPassiveLvEdpvrPointV1(
      140,
      base,
      {
        ...DEFAULT_NO_AVPD_PASSIVE_LV_EDPVR_BOUNDARY_V1,
        targetRvTransmuralPressureMmHg: 0,
      },
    );
    expect(multipleExactRoots.status).toBe("ambiguous");
    expect(multipleExactRoots.failureReason).toMatch(/multiple RV-volume brackets/);
    expect(multipleExactRoots.outerDiagnostics.brackets.length).toBeGreaterThan(1);
  });
});

let cachedBaselineReport: ReturnType<typeof runNoAvpdPassiveLvEdpvrBenchV1> | null = null;

function baselineReport(): ReturnType<typeof runNoAvpdPassiveLvEdpvrBenchV1> {
  cachedBaselineReport ??= runNoAvpdPassiveLvEdpvrBenchV1();
  return cachedBaselineReport;
}

function requireAvailable(
  point: ReturnType<typeof evaluateNoAvpdPassiveLvEdpvrPointV1>,
): NoAvpdPassiveLvEdpvrAvailablePointV1 {
  expect(point.status, point.failureReason ?? undefined).toBe("available");
  if (point.status !== "available") throw new Error(point.failureReason);
  return point;
}

function passiveInvariantParameterVariant(): NoAvpdFourChamberHillTriSegParamsV1 {
  const base = DEFAULT_NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_PARAMS_V1;
  const changedMaterial = (material: HillCeSeeSlsParamsV1): HillCeSeeSlsParamsV1 => ({
    ...material,
    contractileElement: {
      ...material.contractileElement,
      maximumIsometricTensionPa: 0.7 * material.contractileElement.maximumIsometricTensionPa,
    },
    seriesElasticElement: {
      ...material.seriesElasticElement,
      linearStiffnessPa: 1.8 * material.seriesElasticElement.linearStiffnessPa,
    },
    sls: {
      ...material.sls,
      modulusPa: 2.3 * material.sls.modulusPa,
      relaxationTimeSec: 1.7 * material.sls.relaxationTimeSec,
    },
  });
  return {
    ...base,
    calciumDrivers: {
      ...base.calciumDrivers,
      leftFreeWall: { ...base.calciumDrivers.leftFreeWall, eventStrength01: 0.5 },
    },
    triSeg: {
      leftFreeWall: {
        ...base.triSeg.leftFreeWall,
        material: changedMaterial(base.triSeg.leftFreeWall.material),
      },
      septum: {
        ...base.triSeg.septum,
        material: changedMaterial(base.triSeg.septum.material),
      },
      rightFreeWall: {
        ...base.triSeg.rightFreeWall,
        material: changedMaterial(base.triSeg.rightFreeWall.material),
      },
    },
    vascular: {
      ...base.vascular,
      systemicResistanceMmHgSecPerMl: 1.5 * base.vascular.systemicResistanceMmHgSecPerMl,
    },
    valves: {
      ...base.valves,
      mitral: {
        ...base.valves.mitral,
        openInertanceMmHgSec2PerMl: 2 * base.valves.mitral.openInertanceMmHgSec2PerMl,
      },
    },
  };
}

function withLvPassiveTangentScale(scale: number): NoAvpdFourChamberHillTriSegParamsV1 {
  const base = DEFAULT_NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_PARAMS_V1;
  const material = base.triSeg.leftFreeWall.material;
  return {
    ...base,
    triSeg: {
      ...base.triSeg,
      leftFreeWall: {
        ...base.triSeg.leftFreeWall,
        material: {
          ...material,
          passive: {
            ...material.passive,
            tangentModulusPa: scale * material.passive.tangentModulusPa,
          },
        },
      },
    },
  };
}
