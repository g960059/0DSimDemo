import { describe, expect, it } from "vitest";
import {
  createFixedLiteratureBoundedTriSegKoiterBendingPriorV1,
  disableTriSegKoiterBendingV1,
  evaluateEnergyConjugateTriSegV1,
  evaluateSignedSphericalCapVolumeV1,
  evaluateTriSegGeometryV1,
  evaluateTriSegWallDerivativeV1,
  evaluateTriSegWallGeometryV1,
  invertSignedSphericalCapVolumeV1,
  type TriSegGeometryInputV1,
  type TriSegGeometryV1,
  type TriSegWallRecordV1,
} from "@/engine/myocardium/mechanics/energyConjugateTriSegV1";

const WALLS = Object.freeze({
  LVFW: Object.freeze({
    wallMaterialVolumeM3: 67.07543664065403e-6,
    referenceMidwallAreaM2: 93.54352893865039e-4,
  }),
  SEP: Object.freeze({
    wallMaterialVolumeM3: 35.77356620834881e-6,
    referenceMidwallAreaM2: 39.65081992591075e-4,
  }),
  RVFW: Object.freeze({
    wallMaterialVolumeM3: 36.08736942070275e-6,
    referenceMidwallAreaM2: 129.11294586037828e-4,
  }),
});

const REFERENCE_INPUT: TriSegGeometryInputV1 = Object.freeze({
  leftVentricularCavityVolumeM3: 144.4e-6,
  rightVentricularCavityVolumeM3: 155.8e-6,
  coordinates: Object.freeze({
    septalMidwallCapVolumeM3: 42e-6,
    junctionRadiusM: 0.033,
  }),
  walls: WALLS,
});

const FROZEN_STRESS = Object.freeze({
  LVFW: 12_000,
  SEP: -800,
  RVFW: 5_000,
});

describe("pure energy-conjugate TriSeg v1", () => {
  it("inverts negative, flat, and positive signed spherical caps", () => {
    for (const height of [-0.08, -0.02, 0, 0.02, 0.08]) {
      const radius = 0.033;
      const volume = evaluateSignedSphericalCapVolumeV1(height, radius);
      const inverse = invertSignedSphericalCapVolumeV1(volume, radius);
      expect(inverse.signedCapHeightM).toBeCloseTo(height, 13);
      expect(evaluateSignedSphericalCapVolumeV1(
        inverse.signedCapHeightM,
        radius,
      )).toBeCloseTo(volume, 15);
      expect(inverse.dCapHeightDCapVolumePerM2).toBeGreaterThan(0);
    }
  });

  it("preserves the Lumens cap-volume identities and rejects degenerate geometry", () => {
    const geometry = trialGeometry();
    const leftRecovered = -geometry.walls.LVFW.signedMidwallCapVolumeM3
      + geometry.walls.SEP.signedMidwallCapVolumeM3
      - 0.5 * (
        WALLS.LVFW.wallMaterialVolumeM3 + WALLS.SEP.wallMaterialVolumeM3
      );
    const rightRecovered = geometry.walls.RVFW.signedMidwallCapVolumeM3
      - geometry.walls.SEP.signedMidwallCapVolumeM3
      - 0.5 * (
        WALLS.RVFW.wallMaterialVolumeM3 + WALLS.SEP.wallMaterialVolumeM3
      );
    expect(leftRecovered).toBeCloseTo(
      geometry.leftVentricularCavityVolumeM3,
      16,
    );
    expect(rightRecovered).toBeCloseTo(
      geometry.rightVentricularCavityVolumeM3,
      16,
    );
    expect(geometry.walls.LVFW.signedMidwallCapVolumeM3).toBeLessThan(0);
    expect(geometry.walls.RVFW.signedMidwallCapVolumeM3).toBeGreaterThan(0);
    expect(() => evaluateTriSegGeometryV1({
      ...trialInput(),
      coordinates: {
        ...trialInput().coordinates,
        junctionRadiusM: 0,
      },
    })).toThrow(/junction radius.*positive/i);
    expect(() => evaluateTriSegGeometryV1({
      ...trialInput(),
      leftVentricularCavityVolumeM3: -1e-6,
    })).toThrow(/LV cavity volume.*nonnegative/i);
  });

  it("matches analytic log-strain and curvature derivatives", () => {
    const geometry = trialGeometry();
    for (const wallId of ["LVFW", "SEP", "RVFW"] as const) {
      const wall = geometry.walls[wallId];
      const analytic = evaluateTriSegWallDerivativeV1(wall);
      const capStep = 1e-10;
      const radiusStep = 1e-7;
      const evaluateWall = (capVolume: number, radius: number) =>
        evaluateTriSegWallGeometryV1(
          wallId,
          capVolume,
          radius,
          wall.parameters,
        );
      const capLower = evaluateWall(
        wall.signedMidwallCapVolumeM3 - capStep,
        wall.junctionRadiusM,
      );
      const capUpper = evaluateWall(
        wall.signedMidwallCapVolumeM3 + capStep,
        wall.junctionRadiusM,
      );
      const radiusLower = evaluateWall(
        wall.signedMidwallCapVolumeM3,
        wall.junctionRadiusM - radiusStep,
      );
      const radiusUpper = evaluateWall(
        wall.signedMidwallCapVolumeM3,
        wall.junctionRadiusM + radiusStep,
      );
      const dStrainDVolume = (capUpper.fiberLogStrain - capLower.fiberLogStrain)
        / (2 * capStep);
      const dCurvatureDVolume = (
        capUpper.signedMidwallCurvaturePerM
          - capLower.signedMidwallCurvaturePerM
      ) / (2 * capStep);
      const dStrainDRadius = (
        radiusUpper.fiberLogStrain - radiusLower.fiberLogStrain
      ) / (2 * radiusStep);
      const dCurvatureDRadius = (
        radiusUpper.signedMidwallCurvaturePerM
          - radiusLower.signedMidwallCurvaturePerM
      ) / (2 * radiusStep);
      expect(relativeError(
        analytic.dFiberLogStrainDCapVolumePerM3,
        dStrainDVolume,
      )).toBeLessThan(2e-8);
      expect(relativeError(
        analytic.dCurvatureDCapVolumePerM4,
        dCurvatureDVolume,
      )).toBeLessThan(2e-8);
      expect(relativeError(
        analytic.dFiberLogStrainDJunctionRadiusPerM,
        dStrainDRadius,
      )).toBeLessThan(2e-8);
      expect(relativeError(
        analytic.dCurvatureDJunctionRadiusPerM2,
        dCurvatureDRadius,
      )).toBeLessThan(2e-8);
    }
  });

  it("derives cavity pressures and both shape forces from one frozen-state virtual potential", () => {
    const reference = evaluateTriSegGeometryV1(REFERENCE_INPUT);
    const bendingPrior = createFixedLiteratureBoundedTriSegKoiterBendingPriorV1(
      "fixed-loaded-reference-test-v1",
      reference,
    );
    const input = trialInput();
    const result = evaluateEnergyConjugateTriSegV1({
      geometry: evaluateTriSegGeometryV1(input),
      fiberKirchhoffStressPaByWall: FROZEN_STRESS,
      bendingPrior,
    });
    const volumeStep = 1e-10;
    const radiusStep = 1e-7;
    const potential = (candidate: TriSegGeometryInputV1) =>
      evaluateEnergyConjugateTriSegV1({
        geometry: evaluateTriSegGeometryV1(candidate),
        fiberKirchhoffStressPaByWall: FROZEN_STRESS,
        bendingPrior,
      }).frozenMaterialStatePotentialJ;
    const cavityDerivative = (
      field: "leftVentricularCavityVolumeM3" | "rightVentricularCavityVolumeM3",
    ) => (potential({ ...input, [field]: input[field] + volumeStep })
      - potential({ ...input, [field]: input[field] - volumeStep }))
      / (2 * volumeStep);
    const septalDerivative = (potential({
      ...input,
      coordinates: {
        ...input.coordinates,
        septalMidwallCapVolumeM3:
          input.coordinates.septalMidwallCapVolumeM3 + volumeStep,
      },
    }) - potential({
      ...input,
      coordinates: {
        ...input.coordinates,
        septalMidwallCapVolumeM3:
          input.coordinates.septalMidwallCapVolumeM3 - volumeStep,
      },
    })) / (2 * volumeStep);
    const radiusDerivative = (potential({
      ...input,
      coordinates: {
        ...input.coordinates,
        junctionRadiusM: input.coordinates.junctionRadiusM + radiusStep,
      },
    }) - potential({
      ...input,
      coordinates: {
        ...input.coordinates,
        junctionRadiusM: input.coordinates.junctionRadiusM - radiusStep,
      },
    })) / (2 * radiusStep);

    expect(relativeError(
      result.totalGeneralizedForce.leftVentricularPressurePa,
      cavityDerivative("leftVentricularCavityVolumeM3"),
    )).toBeLessThan(2e-7);
    expect(relativeError(
      result.totalGeneralizedForce.rightVentricularPressurePa,
      cavityDerivative("rightVentricularCavityVolumeM3"),
    )).toBeLessThan(2e-7);
    expect(relativeError(
      result.totalGeneralizedForce.septalMidwallCapVolumePa,
      septalDerivative,
    )).toBeLessThan(2e-7);
    expect(relativeError(
      result.totalGeneralizedForce.junctionRadiusN,
      radiusDerivative,
    )).toBeLessThan(2e-7);
    expect(result.fiberKirchhoffStressPaByWall.SEP).toBe(-800);
    expect(result.claim.negativeWallStressClipped).toBe(false);
    expect(result.claim.numericalShapeSpringApplied).toBe(false);
  });

  it("keeps Koiter bending fixed, moment-free at its reference, and exactly disable-able", () => {
    const reference = evaluateTriSegGeometryV1(REFERENCE_INPUT);
    const disabled = evaluateEnergyConjugateTriSegV1({
      geometry: trialGeometry(),
      fiberKirchhoffStressPaByWall: zeroStress(),
      bendingPrior: disableTriSegKoiterBendingV1("structural-ablation"),
    });
    expect(disabled.bendingStoredEnergyJ).toBe(0);
    expect(disabled.bendingGeneralizedForce).toEqual({
      leftVentricularPressurePa: 0,
      rightVentricularPressurePa: 0,
      septalMidwallCapVolumePa: 0,
      junctionRadiusN: 0,
    });
    for (const wallId of ["LVFW", "SEP", "RVFW"] as const) {
      expect(disabled.bendingByWall[wallId].enabled).toBe(false);
      expect(disabled.bendingByWall[wallId].plateFlexuralRigidityNm).toBe(0);
    }

    const prior = createFixedLiteratureBoundedTriSegKoiterBendingPriorV1(
      "fixed-not-pv-fit-v1",
      reference,
    );
    const enabledAtReference = evaluateEnergyConjugateTriSegV1({
      geometry: reference,
      fiberKirchhoffStressPaByWall: zeroStress(),
      bendingPrior: prior,
    });
    expect(prior.effectiveYoungModulusPa).toBe(3_000);
    expect(prior.poissonRatio).toBe(0.45);
    expect(prior.pvLoopMorphologyFitAllowed).toBe(false);
    expect(enabledAtReference.bendingStoredEnergyJ).toBe(0);
    expect(enabledAtReference.bendingGeneralizedForce).toEqual({
      leftVentricularPressurePa: 0,
      rightVentricularPressurePa: 0,
      septalMidwallCapVolumePa: 0,
      junctionRadiusN: 0,
    });

    const doubledWalls = Object.freeze({
      ...WALLS,
      LVFW: Object.freeze({
        ...WALLS.LVFW,
        wallMaterialVolumeM3: 2 * WALLS.LVFW.wallMaterialVolumeM3,
      }),
    });
    const doubledReference = evaluateTriSegGeometryV1({
      ...REFERENCE_INPUT,
      walls: doubledWalls,
    });
    const doubled = evaluateEnergyConjugateTriSegV1({
      geometry: doubledReference,
      fiberKirchhoffStressPaByWall: zeroStress(),
      bendingPrior: createFixedLiteratureBoundedTriSegKoiterBendingPriorV1(
        "fixed-double-thickness-test-v1",
        doubledReference,
      ),
    });
    expect(
      doubled.bendingByWall.LVFW.plateFlexuralRigidityNm
        / enabledAtReference.bendingByWall.LVFW.plateFlexuralRigidityNm,
    ).toBeCloseTo(8, 14);
  });

});

function trialInput(): TriSegGeometryInputV1 {
  return {
    ...REFERENCE_INPUT,
    leftVentricularCavityVolumeM3: 130e-6,
    rightVentricularCavityVolumeM3: 140e-6,
    coordinates: {
      septalMidwallCapVolumeM3: 35e-6,
      junctionRadiusM: 0.031,
    },
  };
}

function trialGeometry(): TriSegGeometryV1 {
  return evaluateTriSegGeometryV1(trialInput());
}

function zeroStress(): TriSegWallRecordV1<number> {
  return Object.freeze({ LVFW: 0, SEP: 0, RVFW: 0 });
}

function relativeError(left: number, right: number): number {
  return Math.abs(left - right) / Math.max(1e-14, Math.abs(left), Math.abs(right));
}
