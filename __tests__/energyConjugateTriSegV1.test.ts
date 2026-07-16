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
  type TriSegCoordinatesV1,
  type TriSegGeometryInputV1,
  type TriSegGeometryV1,
  type TriSegWallRecordV1,
} from "@/engine/myocardium/mechanics/energyConjugateTriSegV1";
import {
  auditStableEnergyConjugateTriSegMultiStartV1,
  solveEnergyConjugateTriSegRootV1,
} from "@/engine/myocardium/mechanics/energyConjugateTriSegRootV1";

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

  it("finds one conservative strict-minimum branch from separated seeds", () => {
    const fixture = convexRootFixture(1);
    const first = solveEnergyConjugateTriSegRootV1({
      ...fixture.input,
      initialCoordinates: {
        septalMidwallCapVolumeM3: 34e-6,
        junctionRadiusM: 0.029,
      },
    });
    expect(first.converged).toBe(true);
    if (first.converged === false) throw new Error(first.message);
    expect(first.stable).toBe(true);
    expect(first.potentialStability.classification)
      .toBe("strict-local-potential-minimum");
    expect(first.potentialStability.antisymmetricPartRelativeToHessianInfinityNorm)
      .toBeLessThan(5e-5);
    expect(relativeError(
      first.coordinates.septalMidwallCapVolumeM3,
      fixture.targetCoordinates.septalMidwallCapVolumeM3,
    )).toBeLessThan(2e-7);
    expect(relativeError(
      first.coordinates.junctionRadiusM,
      fixture.targetCoordinates.junctionRadiusM,
    )).toBeLessThan(2e-7);

    const audit = auditStableEnergyConjugateTriSegMultiStartV1(
      fixture.input,
      [
        { septalMidwallCapVolumeM3: 34e-6, junctionRadiusM: 0.029 },
        { septalMidwallCapVolumeM3: 49e-6, junctionRadiusM: 0.037 },
        { septalMidwallCapVolumeM3: 44e-6, junctionRadiusM: 0.032 },
      ],
      1e-6,
    );
    expect(audit.allSeedsConvergedToStationaryPoints).toBe(true);
    expect(audit.stableRootCount).toBe(3);
    expect(audit.stableRootsSameBranchWithinTolerance).toBe(true);
    expect(audit.globalUniquenessClaimed).toBe(false);
    expect(audit.accepted).toBe(true);
  });

  it("does not label a converged negative-curvature stationary point as stable", () => {
    const fixture = convexRootFixture(-1);
    const result = solveEnergyConjugateTriSegRootV1({
      ...fixture.input,
      initialCoordinates: fixture.targetCoordinates,
    });
    expect(result.converged).toBe(true);
    if (result.converged === false) throw new Error(result.message);
    expect(result.stable).toBe(false);
    expect(result.potentialStability.symmetricPartPositiveDefinite).toBe(false);
    expect(result.potentialStability.classification)
      .toBe("stationary-point-not-a-strict-local-minimum");
  });

  it("returns the accepted input coordinates unchanged when root evaluation fails", () => {
    const fixture = convexRootFixture(1);
    const acceptedCoordinates = Object.freeze({
      septalMidwallCapVolumeM3: 37e-6,
      junctionRadiusM: 0.03,
    });
    const result = solveEnergyConjugateTriSegRootV1({
      ...fixture.input,
      initialCoordinates: acceptedCoordinates,
      evaluateWallStress: () => {
        throw new Error("intentional material failure");
      },
    });
    expect(result.converged).toBe(false);
    if (result.converged === true) throw new Error("expected root failure");
    expect(result.reason).toBe("invalid-initial-state");
    expect(result.rollbackCoordinates).toEqual(acceptedCoordinates);
    expect(result.rollbackOnFailure).toBe(true);
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

function convexRootFixture(stiffnessSign: 1 | -1) {
  const targetCoordinates: TriSegCoordinatesV1 = Object.freeze({
    septalMidwallCapVolumeM3: 42e-6,
    junctionRadiusM: 0.033,
  });
  const targetGeometry = evaluateTriSegGeometryV1({
    ...REFERENCE_INPUT,
    coordinates: targetCoordinates,
  });
  const targetStrain = Object.freeze({
    LVFW: targetGeometry.walls.LVFW.fiberLogStrain,
    SEP: targetGeometry.walls.SEP.fiberLogStrain,
    RVFW: targetGeometry.walls.RVFW.fiberLogStrain,
  });
  const stiffnessPa = Object.freeze({
    LVFW: stiffnessSign * 120_000,
    SEP: stiffnessSign * 90_000,
    RVFW: stiffnessSign * 75_000,
  });
  const evaluateWallStress = (geometry: TriSegGeometryV1) => Object.freeze({
    LVFW: stiffnessPa.LVFW
      * (geometry.walls.LVFW.fiberLogStrain - targetStrain.LVFW),
    SEP: stiffnessPa.SEP
      * (geometry.walls.SEP.fiberLogStrain - targetStrain.SEP),
    RVFW: stiffnessPa.RVFW
      * (geometry.walls.RVFW.fiberLogStrain - targetStrain.RVFW),
  });
  return Object.freeze({
    targetCoordinates,
    input: Object.freeze({
      leftVentricularCavityVolumeM3: REFERENCE_INPUT.leftVentricularCavityVolumeM3,
      rightVentricularCavityVolumeM3: REFERENCE_INPUT.rightVentricularCavityVolumeM3,
      walls: WALLS,
      bendingPrior: disableTriSegKoiterBendingV1("structural-ablation"),
      evaluateWallStress,
      unknownScales: Object.freeze({
        septalMidwallCapVolumeM3: 40e-6,
        junctionRadiusM: 0.03,
      }),
      equilibriumResidualScaleNPerM: 1_000,
      junctionRadiusLowerBoundM: 0.005,
      options: Object.freeze({
        finiteDifferenceScaledStep: 1e-5,
      }),
    }),
  });
}

function zeroStress(): TriSegWallRecordV1<number> {
  return Object.freeze({ LVFW: 0, SEP: 0, RVFW: 0 });
}

function relativeError(left: number, right: number): number {
  return Math.abs(left - right) / Math.max(1e-14, Math.abs(left), Math.abs(right));
}
