import { describe, expect, it } from "vitest";

import {
  evaluateSharedAtrioventricularLongAxisKinematicsV1,
} from "@/engine/mechanics2/atrial/SharedAtrioventricularLongAxisModeV1";
import {
  sanitizeForStableHash,
  stableHash,
} from "@/engine/myocardium/kinematics/stableHash";
import {
  evaluateEnergyConjugateTriSegV1,
  evaluateTriSegGeometryV1,
} from "@/engine/myocardium/mechanics/energyConjugateTriSegV1";
import {
  assertNormalAdultFiveWallPriorV1,
  evaluateNormalAdultAtrialPassivePressureReplayV1,
  normalAdultFiveWallPriorHashInputV1,
  NORMAL_ADULT_FIVE_WALL_PRIOR_V1,
  type NormalAdultFiveWallPriorV1,
} from "@/engine/myocardium/mechanics/normalAdultFiveWallPriorV1";

const WALL_IDS = ["LVFW", "SEP", "RVFW"] as const;

describe("normal adult immutable five-wall prior V1", () => {
  it("freezes the BSA 1.9 atrial and TriSeg anatomy without a fitter", () => {
    const prior = NORMAL_ADULT_FIVE_WALL_PRIOR_V1;
    expect(prior.bodySurfaceAreaM2).toBe(1.9);
    expect(prior.myocardialDensityKgPerM3).toBe(1053);
    expect(prior.anatomy.sources).toMatchObject({
      atrialPhasicVolumeDoi: "10.1038/s41598-017-03377-6",
      leftAtrialMassDoi: "10.1016/j.carpath.2020.107265",
      ventricularCmrDoi: "10.1186/1532-429X-18-S1-O75",
      triSegGeometryDoi: "10.1007/s10439-009-9774-2",
      myocardialDensityDoi: "10.1152/ajpheart.00478.2003",
    });
    expect(prior.anatomy.atria.LA).toMatchObject({
      cavityBloodVolumeMl: { maximum: 80.18, preA: 57.95, minimum: 35.72 },
      wallMaterialVolumeMl: 25.982905982906,
      inverseUnloadedReferenceCavityVolumeMl: 22.8900425619,
      baseFiberLogStrain: {
        maximum: 0.3180732193289124,
        preA: 0.22721107090062528,
        minimum: 0.1018974861303203,
      },
    });
    expect(prior.anatomy.atria.RA).toMatchObject({
      cavityBloodVolumeMl: { maximum: 98.04, preA: 72.58, minimum: 47.31 },
      wallMaterialVolumeMl: 23.399810066477,
      inverseUnloadedReferenceCavityVolumeMl: 32.5968711181,
      baseFiberLogStrain: {
        maximum: 0.30240038831843363,
        preA: 0.21441052027971844,
        minimum: 0.09559780347963599,
      },
    });

    const triSeg = prior.anatomy.triSeg;
    expect(triSeg).toMatchObject({
      leftVentricularEndDiastolicVolumeMl: 144.4,
      leftVentricularEndSystolicVolumeMl: 53.2,
      rightVentricularEndDiastolicVolumeMl: 155.8,
      rightVentricularEndSystolicVolumeMl: 66.5,
      loadedCoordinates: {
        septalMidwallCapVolumeM3: 42e-6,
        junctionRadiusM: 0.033,
      },
      targetFiberStretchAtLoadedReference: 1.1,
      koiterRuntimeStatus:
        "available-fixed-reference-prior-not-enabled-by-this-bundle",
      canonicalBendingMode: "disabled",
      canonicalBendingPrior: {
        mode: "disabled",
        reason: "not-required-by-current-evidence",
      },
      koiterStopRule:
        "retain-bending-disabled-when-membrane-only-root-is-stable",
    });
    expect(triSeg.wallGeometryParameters).toEqual({
      LVFW: {
        wallMaterialVolumeM3: 67.07543664065403e-6,
        referenceMidwallAreaM2: 0.009354352893865039,
      },
      SEP: {
        wallMaterialVolumeM3: 35.77356620834881e-6,
        referenceMidwallAreaM2: 0.003965081992591075,
      },
      RVFW: {
        wallMaterialVolumeM3: 36.08736942070275e-6,
        referenceMidwallAreaM2: 0.012911294586037828,
      },
    });
    for (const wallId of WALL_IDS) {
      expect(triSeg.loadedReferenceGeometry.walls[wallId].geometryStretch)
        .toBeCloseTo(1.1, 14);
      expect(triSeg.koiterBendingPrior.referenceCurvaturePerMByWall[wallId])
        .toBe(triSeg.loadedReferenceGeometry.walls[wallId]
          .signedMidwallCurvaturePerM);
    }
    expect(prior.claim.parameterScanIncluded).toBe(false);
    expect(prior.claim.fitterIncluded).toBe(false);
    expect(prior.claim.providerIncluded).toBe(false);
    expect(Object.isFrozen(prior)).toBe(true);
    expect(Object.isFrozen(prior.anatomy)).toBe(true);
    expect(Object.isFrozen(triSeg.loadedReferenceGeometry.walls.LVFW)).toBe(true);
  });

  it("keeps the available Koiter prior moment-free at its fixed reference without enabling runtime", () => {
    const triSeg = NORMAL_ADULT_FIVE_WALL_PRIOR_V1.anatomy.triSeg;
    const zero = Object.freeze({ LVFW: 0, SEP: 0, RVFW: 0 });
    const evaluation = evaluateEnergyConjugateTriSegV1({
      geometry: triSeg.loadedReferenceGeometry,
      fiberKirchhoffStressPaByWall: zero,
      bendingPrior: triSeg.koiterBendingPrior,
    });
    expect(evaluation.bendingStoredEnergyJ).toBe(0);
    expect(evaluation.bendingGeneralizedForce).toEqual({
      leftVentricularPressurePa: 0,
      rightVentricularPressurePa: 0,
      septalMidwallCapVolumePa: 0,
      junctionRadiusN: 0,
    });
    const perturbedGeometry = evaluateTriSegGeometryV1({
      leftVentricularCavityVolumeM3:
        triSeg.loadedReferenceGeometry.leftVentricularCavityVolumeM3 + 2e-6,
      rightVentricularCavityVolumeM3:
        triSeg.loadedReferenceGeometry.rightVentricularCavityVolumeM3 - 2e-6,
      coordinates: triSeg.loadedCoordinates,
      walls: triSeg.wallGeometryParameters,
    });
    const canonicalOff = evaluateEnergyConjugateTriSegV1({
      geometry: perturbedGeometry,
      fiberKirchhoffStressPaByWall: zero,
      bendingPrior: triSeg.canonicalBendingPrior,
    });
    expect(canonicalOff.bendingStoredEnergyJ).toBe(0);
    expect(canonicalOff.bendingGeneralizedForce).toEqual({
      leftVentricularPressurePa: 0,
      rightVentricularPressurePa: 0,
      septalMidwallCapVolumePa: 0,
      junctionRadiusN: 0,
    });
    expect(triSeg.canonicalBendingMode).toBe("disabled");
    expect(triSeg.koiterRuntimeStatus).toMatch(/not-enabled/);
  });

  it("binds exactly two material classes to five walls with no hidden active gains", () => {
    const prior = NORMAL_ADULT_FIVE_WALL_PRIOR_V1;
    expect(prior.active.ventricularLand.values.Tref).toBe(120_000);
    expect(prior.passive.atrial.effectiveStrainOffsetBoundary)
      .toMatch(/reduced-scalar-extrapolation/);
    expect(prior.active.atrialLand.values.Tref)
      .toBeCloseTo(11_661.151010550097, 10);
    expect(Object.isFrozen(prior.active.atrialLand.sourceParameters)).toBe(true);
    expect(Object.isFrozen(prior.active.atrialLand.sourceParameters[0].runtime))
      .toBe(true);
    expect(prior.active.wallMaterialByWall.LA)
      .toBe(prior.active.atrialWallMaterial);
    expect(prior.active.wallMaterialByWall.RA)
      .toBe(prior.active.atrialWallMaterial);
    for (const wallId of WALL_IDS) {
      expect(prior.active.wallMaterialByWall[wallId])
        .toBe(prior.active.ventricularWallMaterial);
    }
    for (const material of [
      prior.active.atrialWallMaterial,
      prior.active.ventricularWallMaterial,
    ]) {
      expect(material.landSlackStretch).toBe(1);
      expect(material.orientationFraction01).toBe(1);
      expect(material.viableActiveFraction01).toBe(1);
    }
    expect(prior.sls.atrial).toEqual({
      parameterSetId: "fixed-normal-atrial-fast-branch-sls-v1",
      branchModulusPa: 5_947,
      relaxationTimeSec: 0.3,
    });
    expect(prior.sls.ventricular).toEqual({
      parameterSetId: "fixed-normal-ventricular-fast-branch-sls-v1",
      branchModulusPa: 18_565,
      relaxationTimeSec: 0.3,
    });
    expect(prior.active.atrialWallMaterial.sls).toBe(prior.sls.atrial);
    expect(prior.active.ventricularWallMaterial.sls)
      .toBe(prior.sls.ventricular);
    expect(prior.claim.maxwellBranchCountPerWall).toBe(1);
    expect(prior.excluded).toEqual({
      laaBodyCompartmentsIncluded: false,
      pericardiumIncluded: false,
      additionalMaxwellBranchesIncluded: false,
      wallWisePressureGainsIncluded: false,
    });
  });

  it("replays the independent inverse-unloaded LA and RA pressure anchors", () => {
    const prior = NORMAL_ADULT_FIVE_WALL_PRIOR_V1;
    for (const atriumId of ["LA", "RA"] as const) {
      const anatomy = prior.anatomy.atria[atriumId];
      const zero = evaluateNormalAdultAtrialPassivePressureReplayV1(
        atriumId,
        anatomy.inverseUnloadedReferenceCavityVolumeMl,
      );
      expect(zero.fiberLogStrain).toBe(0);
      expect(zero.transmuralPressurePa).toBe(0);
      const anchor = evaluateNormalAdultAtrialPassivePressureReplayV1(
        atriumId,
        anatomy.inverseUnloadingAnchor.cavityBloodVolumeMl,
      );
      expect(anchor.transmuralPressureMmHg).toBeCloseTo(
        anatomy.inverseUnloadingAnchor.transmuralPressureMmHg,
        10,
      );
      expect(anchor.hiddenBloodVolumeMl).toBe(0);
      expect(anchor.pressureFormula).toBe("V_wall*sigma*de/dV");
    }
  });

  it("fixes the q gauge, remains inside Moyer support, and rejects bound overflow", () => {
    const prior = NORMAL_ADULT_FIVE_WALL_PRIOR_V1;
    const params = prior.longAxis.params;
    expect(params).toEqual({
      parameterSetId: "fixed-normal-residual-isochoric-long-axis-v1",
      atrialEffectiveStrainGain: 1.6,
      leftFreeWallEffectiveStrainGain: -1,
      septalEffectiveStrainGain: -1,
      maximumAbsoluteCoordinate: 0.1,
      generalizedForceScaleJ: 1,
    });
    const base = {
      leftAtrium: prior.anatomy.atria.LA.baseFiberLogStrain.maximum,
      rightAtrium: prior.anatomy.atria.RA.baseFiberLogStrain.maximum,
      leftVentricularFreeWall: Math.log(1.1),
      rightVentricularFreeWall: Math.log(1.1),
      septum: Math.log(1.1),
    };
    const positive = evaluateSharedAtrioventricularLongAxisKinematicsV1(
      0.1,
      base,
      params,
    )!;
    expect(positive.effectiveLogStrains.leftAtrium)
      .toBeCloseTo(0.4780732193289124, 14);
    expect(positive.effectiveLogStrains.leftAtrium).toBeLessThan(0.5);
    expect(evaluateSharedAtrioventricularLongAxisKinematicsV1(
      0.1000001,
      base,
      params,
    )).toBeNull();
    const negativeBase = {
      ...base,
      leftAtrium: prior.anatomy.atria.LA.baseFiberLogStrain.minimum,
    };
    const negative = evaluateSharedAtrioventricularLongAxisKinematicsV1(
      -0.1,
      negativeBase,
      params,
    )!;
    expect(negative.effectiveLogStrains.leftAtrium).toBeGreaterThan(-0.5);
    expect(prior.longAxis.boundPolicy).toMatch(/structural-failure/);
  });

  it("pins one stable live identity and rejects structurally identical forgeries", () => {
    const prior = NORMAL_ADULT_FIVE_WALL_PRIOR_V1;
    assertNormalAdultFiveWallPriorV1(prior);
    expect(prior.parameterIdentityHash).toBe(stableHash(sanitizeForStableHash(
      normalAdultFiveWallPriorHashInputV1(prior),
    )));
    expect(prior.parameterIdentityHash).toBe("b8c9e918");
    expect(() => assertNormalAdultFiveWallPriorV1({
      ...prior,
    } as NormalAdultFiveWallPriorV1)).toThrow(/live immutable fixed prior/i);
  });
});
