import { describe, expect, it } from "vitest";
import {
  DEFAULT_TRISEG_GENERALIZED_FORCE_MAPPING_V1,
  TRISEG_FULL_FIBER_ENERGY_GRADIENT_CLAIM_BOUNDARY_V1,
  TRISEG_GENERALIZED_FORCE_UNITS_SI_V1,
  TRISEG_GEOMETRY_CLAIM_BOUNDARY_V1,
  TRISEG_WALL_IDS_V1,
  evaluateTriSegGeometryV1,
  evaluateTriSegFullFiberEnergyGradientV1,
  evaluateTriSegVirtualWorkV1,
  representativeTriSegMidwallTensionFromFiberStressV1,
  solveTriSegAlgebraicEquilibriumV1,
  solveTriSegFullFiberEnergyGradientEquilibriumV1,
  triSegWallTensionsFromFiberStressesV1,
  type TriSegGeometryBaseInputV1,
  type TriSegGeometryCoordinateSIV1,
  type TriSegGeometryInputV1,
  type TriSegGeometryValidOutputV1,
  type TriSegWallTensionsV1,
} from "@/engine/mechanics2/geometry/TriSegGeometryV1";

const BASE_INPUT: TriSegGeometryBaseInputV1 = {
  leftVentricleCavityVolumeMl: 140,
  rightVentricleCavityVolumeMl: 150,
  walls: {
    leftFreeWall: { wallVolumeMl: 75, referenceMidwallAreaCm2: 80 },
    septum: { wallVolumeMl: 40, referenceMidwallAreaCm2: 45 },
    rightFreeWall: { wallVolumeMl: 30, referenceMidwallAreaCm2: 100 },
  },
};

const GEOMETRY_INPUT: TriSegGeometryInputV1 = {
  ...BASE_INPUT,
  algebraic: { junctionRadiusCm: 3.3, septalCapVolumeMl: 42 },
};

describe("TriSegGeometryV1", () => {
  it("reconstructs the three signed spherical caps without an AV-plane state", () => {
    const geometry = requireValidGeometry(
      evaluateTriSegGeometryV1(GEOMETRY_INPUT),
    );

    expect(TRISEG_GEOMETRY_CLAIM_BOUNDARY_V1.adoption).toBe(
      "research-sidecar-only",
    );
    expect(TRISEG_GEOMETRY_CLAIM_BOUNDARY_V1.avPlaneOrLongAxisState).toBe(
      false,
    );
    expect(TRISEG_GEOMETRY_CLAIM_BOUNDARY_V1.artificialMassOrDamping).toBe(
      false,
    );
    expect(geometry.walls.leftFreeWall.signedMidwallCapVolumeMl).toBeLessThan(
      0,
    );
    expect(geometry.walls.septum.signedMidwallCapVolumeMl).toBeGreaterThan(0);
    expect(
      geometry.walls.rightFreeWall.signedMidwallCapVolumeMl,
    ).toBeGreaterThan(0);
    expect(geometry.walls.leftFreeWall.curvaturePerM).toBeLessThan(0);
    expect(geometry.walls.septum.curvaturePerM).toBeGreaterThan(0);
    expect(geometry.walls.rightFreeWall.curvaturePerM).toBeGreaterThan(0);

    for (const wallId of TRISEG_WALL_IDS_V1) {
      const wall = geometry.walls[wallId];
      const reconstructedCapVolumeMl =
        (Math.PI / 6) *
        wall.axialDistanceCm *
        (wall.axialDistanceCm ** 2 + 3 * wall.junctionRadiusCm ** 2);
      expectRelativeClose(
        reconstructedCapVolumeMl,
        wall.signedMidwallCapVolumeMl,
        2e-14,
        1e-12,
      );
      expect(wall.midwallAreaCm2).toBeCloseTo(
        Math.PI * (wall.axialDistanceCm ** 2 + wall.junctionRadiusCm ** 2),
        12,
      );
      expect(Number.isFinite(wall.fiberNaturalStrain)).toBe(true);
    }
  });

  it("matches analytic area, curvature, and one-fiber strain derivatives", () => {
    const geometry = requireValidGeometry(
      evaluateTriSegGeometryV1(GEOMETRY_INPUT),
    );
    const perturbations: Readonly<
      Record<TriSegGeometryCoordinateSIV1, number>
    > = {
      leftVentricleCavityVolumeM3: 1e-8,
      rightVentricleCavityVolumeM3: 1e-8,
      septalCapVolumeM3: 1e-8,
      junctionRadiusM: 1e-6,
    };

    for (const coordinateId of Object.keys(
      perturbations,
    ) as TriSegGeometryCoordinateSIV1[]) {
      const h = perturbations[coordinateId];
      const minus = requireValidGeometry(
        evaluateTriSegGeometryV1(
          perturbGeometryInput(GEOMETRY_INPUT, coordinateId, -h),
        ),
      );
      const plus = requireValidGeometry(
        evaluateTriSegGeometryV1(
          perturbGeometryInput(GEOMETRY_INPUT, coordinateId, h),
        ),
      );
      for (const wallId of TRISEG_WALL_IDS_V1) {
        const analytic = geometry.walls[wallId].derivativesSI[coordinateId];
        const finiteDifferenceArea =
          (plus.walls[wallId].midwallAreaM2 -
            minus.walls[wallId].midwallAreaM2) /
          (2 * h);
        const finiteDifferenceCurvature =
          (plus.walls[wallId].curvaturePerM -
            minus.walls[wallId].curvaturePerM) /
          (2 * h);
        const finiteDifferenceStrain =
          (plus.walls[wallId].fiberNaturalStrain -
            minus.walls[wallId].fiberNaturalStrain) /
          (2 * h);
        expectRelativeClose(
          analytic.dMidwallAreaM2,
          finiteDifferenceArea,
          2e-7,
          2e-10,
        );
        expectRelativeClose(
          analytic.dCurvaturePerM,
          finiteDifferenceCurvature,
          3e-7,
          2e-7,
        );
        expectRelativeClose(
          analytic.dFiberNaturalStrain,
          finiteDifferenceStrain,
          3e-7,
          2e-8,
        );
      }
    }
  });

  it("derives LV/RV pressure and both algebraic residuals from the same virtual work", () => {
    const tensions: TriSegWallTensionsV1 = {
      leftFreeWall: 360,
      septum: 190,
      rightFreeWall: 240,
    };
    const geometry = requireValidGeometry(
      evaluateTriSegGeometryV1(GEOMETRY_INPUT),
    );
    const mechanics = evaluateTriSegVirtualWorkV1(geometry, tensions);
    expect(mechanics.valid).toBe(true);
    if (!mechanics.valid) {
      throw new Error(mechanics.failureReason);
    }

    expect(
      Math.abs(mechanics.virtualWorkIdentityResiduals.leftVentriclePressurePa),
    ).toBeLessThan(1e-11);
    expect(
      Math.abs(mechanics.virtualWorkIdentityResiduals.rightVentriclePressurePa),
    ).toBeLessThan(1e-11);
    expect(
      Math.abs(mechanics.virtualWorkIdentityResiduals.septalCapPressurePa),
    ).toBeLessThan(1e-11);
    expect(
      Math.abs(mechanics.virtualWorkIdentityResiduals.junctionRadiusForceN),
    ).toBeLessThan(1e-12);

    const volumeStepM3 = 1e-9;
    const radiusStepM = 1e-7;
    expectRelativeClose(
      fixedTensionAreaWorkDerivative(
        GEOMETRY_INPUT,
        tensions,
        "leftVentricleCavityVolumeM3",
        volumeStepM3,
      ),
      mechanics.pressures.leftVentricleTransmuralPa,
      2e-8,
      1e-5,
    );
    expectRelativeClose(
      fixedTensionAreaWorkDerivative(
        GEOMETRY_INPUT,
        tensions,
        "rightVentricleCavityVolumeM3",
        volumeStepM3,
      ),
      mechanics.pressures.rightVentricleTransmuralPa,
      2e-8,
      1e-5,
    );
    expectRelativeClose(
      fixedTensionAreaWorkDerivative(
        GEOMETRY_INPUT,
        tensions,
        "septalCapVolumeM3",
        volumeStepM3,
      ),
      mechanics.residuals.septalCapPressurePa,
      2e-8,
      1e-5,
    );
    expectRelativeClose(
      fixedTensionAreaWorkDerivative(
        GEOMETRY_INPUT,
        tensions,
        "junctionRadiusM",
        radiusStepM,
      ),
      mechanics.residuals.junctionRadiusForceN,
      2e-8,
      1e-7,
    );
  });

  it("maps fiber stress to representative wall tension with the TriSeg correction", () => {
    const geometry = requireValidGeometry(
      evaluateTriSegGeometryV1(GEOMETRY_INPUT),
    );
    const stresses = {
      leftFreeWall: 82_000,
      septum: 75_000,
      rightFreeWall: 38_000,
    };
    const tensions = triSegWallTensionsFromFiberStressesV1(geometry, stresses);
    expect(tensions).not.toBeNull();
    if (tensions === null) {
      return;
    }
    for (const wallId of TRISEG_WALL_IDS_V1) {
      const wall = geometry.walls[wallId];
      const z2 = wall.curvatureThicknessRatioZ ** 2;
      const expected =
        ((wall.wallVolumeM3 * stresses[wallId]) / (2 * wall.midwallAreaM2)) *
        (1 + z2 / 3 + z2 ** 2 / 5);
      expect(tensions[wallId]).toBeCloseTo(expected, 12);
      expect(
        representativeTriSegMidwallTensionFromFiberStressV1(
          wall,
          stresses[wallId],
        ),
      ).toBeCloseTo(expected, 12);
    }
  });

  it("keeps the Lumens representative-tension mapping as the literature-faithful default", () => {
    expect(DEFAULT_TRISEG_GENERALIZED_FORCE_MAPPING_V1).toBe(
      "lumens-2009-representative-tension-area-work",
    );
    expect(TRISEG_FULL_FIBER_ENERGY_GRADIENT_CLAIM_BOUNDARY_V1.adoption).toBe(
      "research-sidecar-opt-in",
    );
    expect(
      TRISEG_FULL_FIBER_ENERGY_GRADIENT_CLAIM_BOUNDARY_V1.literatureFaithfulTriSegDefaultPreserved,
    ).toBe(true);
    expect(
      TRISEG_FULL_FIBER_ENERGY_GRADIENT_CLAIM_BOUNDARY_V1.correctedOrExactOriginalTriSegClaimed,
    ).toBe(false);
    expect(
      TRISEG_FULL_FIBER_ENERGY_GRADIENT_CLAIM_BOUNDARY_V1.activeStressStoredEnergyPotentialClaimed,
    ).toBe(false);
  });

  it("maps the full Hill fiber work pair to signed SI generalized forces", () => {
    const geometry = requireValidGeometry(
      evaluateTriSegGeometryV1(GEOMETRY_INPUT),
    );
    const stresses = {
      leftFreeWall: 82_000,
      septum: 75_000,
      rightFreeWall: 38_000,
    };
    const work = evaluateTriSegFullFiberEnergyGradientV1(geometry, stresses);
    expect(work.valid).toBe(true);
    if (!work.valid) throw new Error(work.failureReason);

    expect(TRISEG_GENERALIZED_FORCE_UNITS_SI_V1).toEqual({
      leftVentricleCavityVolumeM3: "Pa",
      rightVentricleCavityVolumeM3: "Pa",
      septalCapVolumeM3: "Pa",
      junctionRadiusM: "N",
    });
    for (const wallId of TRISEG_WALL_IDS_V1) {
      const wall = geometry.walls[wallId];
      for (const coordinateId of Object.keys(
        TRISEG_GENERALIZED_FORCE_UNITS_SI_V1,
      ) as TriSegGeometryCoordinateSIV1[]) {
        expect(work.wallContributionsSI[wallId][coordinateId]).toBeCloseTo(
          wall.wallVolumeM3 *
            stresses[wallId] *
            wall.derivativesSI[coordinateId].dFiberNaturalStrain,
          12,
        );
      }
    }
    expect(work.pressures.leftVentricleTransmuralPa).toBeGreaterThan(0);
    expect(work.pressures.rightVentricleTransmuralPa).toBeGreaterThan(0);
    expect(work.generalizedForcesSI.leftVentricleCavityVolumeM3).toBe(
      work.pressures.leftVentricleTransmuralPa,
    );
    expect(work.generalizedForcesSI.rightVentricleCavityVolumeM3).toBe(
      work.pressures.rightVentricleTransmuralPa,
    );
    expect(
      work.wallContributionsSI.leftFreeWall.septalCapVolumeM3,
    ).toBeLessThan(0);
    expect(work.wallContributionsSI.septum.septalCapVolumeM3).toBeGreaterThan(
      0,
    );
  });

  it("matches an infinitesimal centered directional derivative of a fiber potential", () => {
    const geometry = requireValidGeometry(
      evaluateTriSegGeometryV1(GEOMETRY_INPUT),
    );
    const moduliPa = {
      leftFreeWall: 95_000,
      septum: 110_000,
      rightFreeWall: 70_000,
    };
    const stresses = Object.fromEntries(
      TRISEG_WALL_IDS_V1.map((wallId) => [
        wallId,
        moduliPa[wallId] * geometry.walls[wallId].fiberNaturalStrain,
      ]),
    ) as Readonly<Record<(typeof TRISEG_WALL_IDS_V1)[number], number>>;
    const work = evaluateTriSegFullFiberEnergyGradientV1(geometry, stresses);
    expect(work.valid).toBe(true);
    if (!work.valid) throw new Error(work.failureReason);

    const directionSI: Readonly<Record<TriSegGeometryCoordinateSIV1, number>> =
      {
        leftVentricleCavityVolumeM3: 0.8e-9,
        rightVentricleCavityVolumeM3: -0.6e-9,
        septalCapVolumeM3: 0.5e-9,
        junctionRadiusM: 0.7e-7,
      };
    const minus = requireValidGeometry(
      evaluateTriSegGeometryV1(
        perturbGeometryInputAlongDirection(GEOMETRY_INPUT, directionSI, -1),
      ),
    );
    const plus = requireValidGeometry(
      evaluateTriSegGeometryV1(
        perturbGeometryInputAlongDirection(GEOMETRY_INPUT, directionSI, 1),
      ),
    );
    const centeredDirectionalEnergyJ =
      (quadraticFiberPotentialJ(plus, moduliPa) -
        quadraticFiberPotentialJ(minus, moduliPa)) /
      2;
    const analyticDirectionalWorkJ = (
      Object.keys(directionSI) as TriSegGeometryCoordinateSIV1[]
    ).reduce(
      (sum, coordinateId) =>
        sum +
        work.generalizedForcesSI[coordinateId] * directionSI[coordinateId],
      0,
    );
    expectRelativeClose(
      analyticDirectionalWorkJ,
      centeredDirectionalEnergyJ,
      3e-8,
      1e-14,
    );
  });

  it("solves the full-fiber mapping without manufacturing representative tensions", () => {
    const solution = solveTriSegFullFiberEnergyGradientEquilibriumV1(
      symmetricBaseInput(),
      (geometry) => ({
        leftFreeWall: 90_000 * geometry.walls.leftFreeWall.fiberNaturalStrain,
        septum: 90_000 * geometry.walls.septum.fiberNaturalStrain,
        rightFreeWall: 90_000 * geometry.walls.rightFreeWall.fiberNaturalStrain,
      }),
      { junctionRadiusCm: 3.3, septalCapVolumeMl: 0 },
    );

    expect(
      solution.converged,
      solution.diagnostics.failureReason ?? undefined,
    ).toBe(true);
    expect(solution.generalizedForceMapping).toBe("full-fiber-energy-gradient");
    expect(
      solution.fullFiberEnergyGradient?.residuals.relativeMagnitude,
    ).toBeLessThan(1e-9);
    expect(solution.diagnostics.normalization).toBe(
      "separate-sum-absolute-wall-contributions-with-base-scale-fixed-per-jacobian",
    );
    expect(solution.diagnostics.jacobianEvaluations).toBeGreaterThan(0);
    expect("tensionsNPerM" in solution).toBe(false);
    expect("virtualWork" in solution).toBe(false);
  });

  it("fails the full-fiber mapping structurally on a non-finite stress provider", () => {
    const geometry = evaluateTriSegGeometryV1(GEOMETRY_INPUT);
    const invalid = evaluateTriSegFullFiberEnergyGradientV1(geometry, {
      leftFreeWall: 80_000,
      septum: Number.NaN,
      rightFreeWall: 40_000,
    });
    expect(invalid.valid).toBe(false);
    expect(invalid.generalizedForcesSI).toBeNull();

    const solution = solveTriSegFullFiberEnergyGradientEquilibriumV1(
      BASE_INPUT,
      { leftFreeWall: 80_000, septum: Number.NaN, rightFreeWall: 40_000 },
      GEOMETRY_INPUT.algebraic,
    );
    expect(solution.converged).toBe(false);
    expect(solution.diagnostics.termination).toBe(
      "fiber-stress-provider-failure",
    );
    expect(solution.fullFiberEnergyGradient).toBeNull();
    expect(solution.fiberStressesPa).toBeNull();
  });

  it("preserves left-right symmetry in the algebraic equilibrium", () => {
    const symmetricInput = symmetricBaseInput();
    const solution = solveTriSegAlgebraicEquilibriumV1(
      symmetricInput,
      { leftFreeWall: 300, septum: 150, rightFreeWall: 300 },
      { junctionRadiusCm: 3.3, septalCapVolumeMl: 0 },
    );

    expect(
      solution.converged,
      solution.diagnostics.failureReason ?? undefined,
    ).toBe(true);
    expect(Math.abs(solution.coordinates.septalCapVolumeMl)).toBeLessThan(1e-9);
    expect(solution.virtualWork).not.toBeNull();
    if (solution.virtualWork === null) {
      return;
    }
    expect(
      solution.virtualWork.pressures.leftVentricleTransmuralPa,
    ).toBeCloseTo(solution.virtualWork.pressures.rightVentricleTransmuralPa, 8);
    expect(solution.virtualWork.residuals.relativeMagnitude).toBeLessThan(1e-9);
  });

  it("re-evaluates geometry-dependent stress-to-tension coupling at solver trials", () => {
    let providerCalls = 0;
    const solution = solveTriSegAlgebraicEquilibriumV1(
      symmetricBaseInput(),
      (geometry) => {
        providerCalls += 1;
        const tensions = triSegWallTensionsFromFiberStressesV1(geometry, {
          leftFreeWall: 70_000,
          septum: 30_000,
          rightFreeWall: 70_000,
        });
        if (tensions === null) {
          throw new Error("finite stress-to-tension mapping expected");
        }
        return tensions;
      },
      { junctionRadiusCm: 3.3, septalCapVolumeMl: 0 },
    );

    expect(
      solution.converged,
      solution.diagnostics.failureReason ?? undefined,
    ).toBe(true);
    expect(providerCalls).toBeGreaterThan(1);
    expect(Math.abs(solution.coordinates.septalCapVolumeMl)).toBeLessThan(1e-8);
    expect(solution.virtualWork?.residuals.relativeMagnitude).toBeLessThan(
      1e-9,
    );
  });

  it("bows the septum toward the RV when left-wall tension and LV pressure dominate", () => {
    const input = symmetricBaseInput();
    const balanced = solveTriSegAlgebraicEquilibriumV1(
      input,
      { leftFreeWall: 300, septum: 170, rightFreeWall: 300 },
      { junctionRadiusCm: 3.3, septalCapVolumeMl: 0 },
    );
    const leftDominant = solveTriSegAlgebraicEquilibriumV1(
      input,
      { leftFreeWall: 380, septum: 170, rightFreeWall: 250 },
      balanced.coordinates,
    );

    expect(
      balanced.converged,
      balanced.diagnostics.failureReason ?? undefined,
    ).toBe(true);
    expect(
      leftDominant.converged,
      leftDominant.diagnostics.failureReason ?? undefined,
    ).toBe(true);
    expect(leftDominant.coordinates.septalCapVolumeMl).toBeGreaterThan(0);
    expect(leftDominant.virtualWork).not.toBeNull();
    if (leftDominant.virtualWork === null) {
      return;
    }
    expect(
      leftDominant.virtualWork.pressures.leftVentricleTransmuralPa,
    ).toBeGreaterThan(
      leftDominant.virtualWork.pressures.rightVentricleTransmuralPa,
    );
  });

  it("fails safely on invalid geometry, invalid bounds, and non-finite tension providers", () => {
    const invalidGeometry = evaluateTriSegGeometryV1({
      ...GEOMETRY_INPUT,
      leftVentricleCavityVolumeMl: -1,
    });
    expect(invalidGeometry.valid).toBe(false);
    expect(invalidGeometry.walls).toBeNull();

    const invalidBounds = solveTriSegAlgebraicEquilibriumV1(
      BASE_INPUT,
      { leftFreeWall: 300, septum: 150, rightFreeWall: 300 },
      GEOMETRY_INPUT.algebraic,
      { bounds: { junctionRadiusCm: [3, 3] } },
    );
    expect(invalidBounds.converged).toBe(false);
    expect(invalidBounds.diagnostics.termination).toBe("invalid-bounds");

    const providerFailure = solveTriSegAlgebraicEquilibriumV1(
      BASE_INPUT,
      () => ({ leftFreeWall: 300, septum: Number.NaN, rightFreeWall: 250 }),
      GEOMETRY_INPUT.algebraic,
    );
    expect(providerFailure.converged).toBe(false);
    expect(providerFailure.diagnostics.termination).toBe(
      "tension-provider-failure",
    );
    expect(providerFailure.virtualWork).toBeNull();
    expect(providerFailure.geometry.valid).toBe(true);
    expect(Number.isFinite(providerFailure.coordinates.junctionRadiusCm)).toBe(
      true,
    );
    expect(Number.isFinite(providerFailure.coordinates.septalCapVolumeMl)).toBe(
      true,
    );

    // No exact junction equilibrium exists when one fixed tension exceeds the
    // sum of the other two. The solver must preserve its best finite iterate.
    const infeasibleForceTriangle = solveTriSegAlgebraicEquilibriumV1(
      symmetricBaseInput(),
      { leftFreeWall: 430, septum: 170, rightFreeWall: 250 },
      { junctionRadiusCm: 3.3, septalCapVolumeMl: 0 },
    );
    expect(infeasibleForceTriangle.converged).toBe(false);
    expect(infeasibleForceTriangle.geometry.valid).toBe(true);
    expect(infeasibleForceTriangle.virtualWork).not.toBeNull();
    expect(
      Number.isFinite(
        infeasibleForceTriangle.diagnostics.relativeResidualMagnitude,
      ),
    ).toBe(true);
  });
});

function symmetricBaseInput(): TriSegGeometryBaseInputV1 {
  return {
    leftVentricleCavityVolumeMl: 120,
    rightVentricleCavityVolumeMl: 120,
    walls: {
      leftFreeWall: { wallVolumeMl: 60, referenceMidwallAreaCm2: 80 },
      septum: { wallVolumeMl: 30, referenceMidwallAreaCm2: 45 },
      rightFreeWall: { wallVolumeMl: 60, referenceMidwallAreaCm2: 80 },
    },
  };
}

function requireValidGeometry(
  geometry: ReturnType<typeof evaluateTriSegGeometryV1>,
): TriSegGeometryValidOutputV1 {
  expect(geometry.valid, geometry.failureReason ?? undefined).toBe(true);
  if (!geometry.valid) {
    throw new Error(geometry.failureReason);
  }
  return geometry;
}

function perturbGeometryInput(
  input: TriSegGeometryInputV1,
  coordinateId: TriSegGeometryCoordinateSIV1,
  incrementSI: number,
): TriSegGeometryInputV1 {
  switch (coordinateId) {
    case "leftVentricleCavityVolumeM3":
      return {
        ...input,
        leftVentricleCavityVolumeMl:
          input.leftVentricleCavityVolumeMl + incrementSI / 1e-6,
      };
    case "rightVentricleCavityVolumeM3":
      return {
        ...input,
        rightVentricleCavityVolumeMl:
          input.rightVentricleCavityVolumeMl + incrementSI / 1e-6,
      };
    case "septalCapVolumeM3":
      return {
        ...input,
        algebraic: {
          ...input.algebraic,
          septalCapVolumeMl:
            input.algebraic.septalCapVolumeMl + incrementSI / 1e-6,
        },
      };
    case "junctionRadiusM":
      return {
        ...input,
        algebraic: {
          ...input.algebraic,
          junctionRadiusCm:
            input.algebraic.junctionRadiusCm + incrementSI / 1e-2,
        },
      };
  }
}

function fixedTensionAreaWorkDerivative(
  input: TriSegGeometryInputV1,
  tensions: TriSegWallTensionsV1,
  coordinateId: TriSegGeometryCoordinateSIV1,
  hSI: number,
): number {
  const minus = requireValidGeometry(
    evaluateTriSegGeometryV1(perturbGeometryInput(input, coordinateId, -hSI)),
  );
  const plus = requireValidGeometry(
    evaluateTriSegGeometryV1(perturbGeometryInput(input, coordinateId, hSI)),
  );
  return (
    (fixedTensionAreaWorkJ(plus, tensions) -
      fixedTensionAreaWorkJ(minus, tensions)) /
    (2 * hSI)
  );
}

function fixedTensionAreaWorkJ(
  geometry: TriSegGeometryValidOutputV1,
  tensions: TriSegWallTensionsV1,
): number {
  return TRISEG_WALL_IDS_V1.reduce(
    (sum, wallId) =>
      sum + tensions[wallId] * geometry.walls[wallId].midwallAreaM2,
    0,
  );
}

function perturbGeometryInputAlongDirection(
  input: TriSegGeometryInputV1,
  directionSI: Readonly<Record<TriSegGeometryCoordinateSIV1, number>>,
  scale: number,
): TriSegGeometryInputV1 {
  return {
    ...input,
    leftVentricleCavityVolumeMl:
      input.leftVentricleCavityVolumeMl +
      (scale * directionSI.leftVentricleCavityVolumeM3) / 1e-6,
    rightVentricleCavityVolumeMl:
      input.rightVentricleCavityVolumeMl +
      (scale * directionSI.rightVentricleCavityVolumeM3) / 1e-6,
    algebraic: {
      junctionRadiusCm:
        input.algebraic.junctionRadiusCm +
        (scale * directionSI.junctionRadiusM) / 1e-2,
      septalCapVolumeMl:
        input.algebraic.septalCapVolumeMl +
        (scale * directionSI.septalCapVolumeM3) / 1e-6,
    },
  };
}

function quadraticFiberPotentialJ(
  geometry: TriSegGeometryValidOutputV1,
  moduliPa: Readonly<Record<(typeof TRISEG_WALL_IDS_V1)[number], number>>,
): number {
  return TRISEG_WALL_IDS_V1.reduce((sum, wallId) => {
    const wall = geometry.walls[wallId];
    return (
      sum +
      0.5 * wall.wallVolumeM3 * moduliPa[wallId] * wall.fiberNaturalStrain ** 2
    );
  }, 0);
}

function expectRelativeClose(
  actual: number,
  expected: number,
  relativeTolerance: number,
  absoluteTolerance: number,
): void {
  expect(Number.isFinite(actual)).toBe(true);
  expect(Number.isFinite(expected)).toBe(true);
  const scale = Math.max(Math.abs(actual), Math.abs(expected));
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(
    absoluteTolerance + relativeTolerance * scale,
  );
}
