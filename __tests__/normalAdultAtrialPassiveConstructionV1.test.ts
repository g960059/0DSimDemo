import { describe, expect, it } from "vitest";

import {
  sanitizeForStableHash,
  stableHash,
} from "@/engine/myocardium/kinematics/stableHash";
import {
  NORMAL_ADULT_ATRIAL_PASSIVE_CONSTRUCTION_CLAIM_V1,
  NORMAL_ADULT_ATRIAL_PASSIVE_CONSTRUCTION_V1,
  assertNormalAdultAtrialPassiveConstructionV1,
  evaluateNormalAdultAtrialEquilibriumPassiveV1,
  evaluateNormalAdultAtrialPassivePressureReplayFromBundleV1,
  normalAdultAtrialPassiveConstructionHashInputV1,
  normalAdultAtrialPassiveGeometryV1,
  resolveNormalAdultAtrialParallelSlsParamsV1,
  type NormalAdultAtrialPassiveConstructionV1,
} from "@/engine/myocardium/mechanics/normalAdultAtrialPassiveConstructionV1";
import {
  MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_ADAPTER_V1_ID,
  MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_ADAPTER_V1_CLAIM,
  createMainWireNormalAdultFiveWallMaterialKernelsV1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";
import {
  NORMAL_ADULT_FIVE_WALL_PRIOR_V1,
} from "@/engine/myocardium/mechanics/normalAdultFiveWallPriorV1";

describe("normal-adult atrial passive construction bundle V1", () => {
  it("owns one immutable Moyer/geometry/reference/SLS identity with static gates", () => {
    const bundle = NORMAL_ADULT_ATRIAL_PASSIVE_CONSTRUCTION_V1;
    assertNormalAdultAtrialPassiveConstructionV1(bundle);
    expect(bundle.parameterIdentityHash).toBe(stableHash(sanitizeForStableHash(
      normalAdultAtrialPassiveConstructionHashInputV1(bundle),
    )));
    expect(bundle.parameterIdentityHash).toBe("0791114f");
    expect(Object.isFrozen(bundle)).toBe(true);
    expect(Object.isFrozen(bundle.atria.LA)).toBe(true);
    expect(Object.isFrozen(bundle.slsByAtrium.RA)).toBe(true);
    expect(bundle.claim).toBe(NORMAL_ADULT_ATRIAL_PASSIVE_CONSTRUCTION_CLAIM_V1);
    expect(bundle.claim.alternatePassiveLawIncluded).toBe(false);
    expect(bundle.claim.parameterScanIncluded).toBe(false);
    expect(bundle.claim.parameterFittingIncluded).toBe(false);
    expect(() => assertNormalAdultAtrialPassiveConstructionV1({
      ...bundle,
    } as NormalAdultAtrialPassiveConstructionV1)).toThrow(/live immutable/i);
  });

  it("replays the pre-refactor anatomy, passive law, and five-wall prior exactly", () => {
    const bundle = NORMAL_ADULT_ATRIAL_PASSIVE_CONSTRUCTION_V1;
    expect(bundle.atria.LA).toEqual({
      atriumId: "LA",
      cavityBloodVolumeMl: { maximum: 80.18, preA: 57.95, minimum: 35.72 },
      wallMaterialVolumeMl: 25.982905982906,
      inverseUnloadedReferenceCavityVolumeMl: 22.8900425619,
      baseFiberLogStrain: {
        maximum: 0.3180732193289124,
        preA: 0.22721107090062528,
        minimum: 0.1018974861303203,
      },
      inverseUnloadingAnchor: {
        cavityBloodVolumeMl: 35.72,
        transmuralPressureMmHg: 5,
        pressureEvidenceBoundary:
          "Moyer-human-LA-FE-filling-anchor-interpreted-as-transmural-at-zero-external-pressure",
      },
      patientFitPolicy:
        "replace-volumes-and-wall-mass-from-imaging-and-reference-only-from-independent-pressure-volume-data",
    });
    expect(bundle.atria.RA).toEqual({
      atriumId: "RA",
      cavityBloodVolumeMl: { maximum: 98.04, preA: 72.58, minimum: 47.31 },
      wallMaterialVolumeMl: 23.399810066477,
      inverseUnloadedReferenceCavityVolumeMl: 32.5968711181,
      baseFiberLogStrain: {
        maximum: 0.30240038831843363,
        preA: 0.21441052027971844,
        minimum: 0.09559780347963599,
      },
      inverseUnloadingAnchor: {
        cavityBloodVolumeMl: 47.31,
        transmuralPressureMmHg: 3.5,
        pressureEvidenceBoundary:
          "control-x-descent-intracavitary-pressure-used-as-zero-external-pressure-construction-not-direct-transmural-measurement",
      },
      patientFitPolicy:
        "replace-volumes-and-wall-mass-from-imaging-and-reference-only-from-independent-pressure-volume-data",
    });
    expect(bundle.atria).toBe(NORMAL_ADULT_FIVE_WALL_PRIOR_V1.anatomy.atria);
    expect(bundle.equilibriumPassive.compiled)
      .toBe(NORMAL_ADULT_FIVE_WALL_PRIOR_V1.passive.atrial.compiled);
    expect(bundle.slsByAtrium.LA.derivedOnParams)
      .toBe(NORMAL_ADULT_FIVE_WALL_PRIOR_V1.sls.atrial);
    expect(normalAdultAtrialPassiveGeometryV1("LA")).toEqual({
      wallMaterialVolumeM3: 25.982905982906 * 1e-6,
      referenceCavityBloodVolumeM3: 22.8900425619 * 1e-6,
    });
    expect(normalAdultAtrialPassiveGeometryV1("RA")).toEqual({
      wallMaterialVolumeM3: 23.399810066477 * 1e-6,
      referenceCavityBloodVolumeM3: 32.5968711181 * 1e-6,
    });

    const passiveBaselines = [
      { e: 0, stressPa: 0, tangentPa: 39_800.55 },
      {
        e: 0.09559780347963599,
        stressPa: 3530.2459582775414,
        tangentPa: 34835.79267910854,
      },
      {
        e: 0.1018974861303203,
        stressPa: 3749.1921871041004,
        tangentPa: 34678.2990427885,
      },
      {
        e: 0.2,
        stressPa: 7154.986253127373,
        tangentPa: 36282.18584638268,
      },
      {
        e: 0.3,
        stressPa: 11635.798069020746,
        tangentPa: 61108.803577438244,
      },
    ];
    for (const baseline of passiveBaselines) {
      const evaluated = evaluateNormalAdultAtrialEquilibriumPassiveV1(baseline.e);
      expect(evaluated.equilibriumKirchhoffStressPa).toBe(baseline.stressPa);
      expect(evaluated.dStressDFiberLogStrainPa).toBe(baseline.tangentPa);
    }
    for (const atriumId of ["LA", "RA"] as const) {
      const anatomy = bundle.atria[atriumId];
      const unloaded = evaluateNormalAdultAtrialPassivePressureReplayFromBundleV1(
        atriumId,
        anatomy.inverseUnloadedReferenceCavityVolumeMl,
      );
      const anchor = evaluateNormalAdultAtrialPassivePressureReplayFromBundleV1(
        atriumId,
        anatomy.inverseUnloadingAnchor.cavityBloodVolumeMl,
      );
      expect(unloaded.transmuralPressurePa).toBe(0);
      expect(anchor.transmuralPressureMmHg).toBeCloseTo(
        anatomy.inverseUnloadingAnchor.transmuralPressureMmHg,
        10,
      );
    }
  });

  it("derives Ev from the source relaxation ratio and Kref, then applies one explicit rounding rule", () => {
    const bundle = NORMAL_ADULT_ATRIAL_PASSIVE_CONSTRUCTION_V1;
    const expectedRatio = 0.13 / (1 - 0.13);
    const expectedKrefPa = 24 * 1_650 + 15 * 13.37;
    const expectedUnroundedEvPa = expectedRatio * expectedKrefPa;
    expect(bundle.equilibriumPassive.referenceFiberLogStrain).toBe(0);
    expect(bundle.equilibriumPassive.referenceEquilibriumTangentPa)
      .toBe(expectedKrefPa);
    for (const atriumId of ["LA", "RA"] as const) {
      const sls = bundle.slsByAtrium[atriumId];
      expect(sls.atriumId).toBe(atriumId);
      expect(sls.sourcePronyCoefficient).toBe(0.13);
      expect(sls.unroundedRelaxationRatio).toBe(expectedRatio);
      expect(sls.unroundedBranchModulusPa).toBe(expectedUnroundedEvPa);
      expect(sls.branchModulusRoundingRule).toBe("round-to-nearest-Pa");
      expect(resolveNormalAdultAtrialParallelSlsParamsV1(
        atriumId,
        "derived-on",
      )).toEqual({
        parameterSetId: "fixed-normal-atrial-fast-branch-sls-v1",
        branchModulusPa: Math.round(expectedUnroundedEvPa),
        relaxationTimeSec: 0.3,
      });
      expect(resolveNormalAdultAtrialParallelSlsParamsV1(
        atriumId,
        "exact-off",
      )).toEqual({
        parameterSetId:
          `fixed-normal-atrial-fast-branch-sls-v1-${atriumId.toLowerCase()}-exact-off`,
        branchModulusPa: 0,
        relaxationTimeSec: 0.3,
      });
    }
    expect(Math.round(expectedUnroundedEvPa)).toBe(5_947);
    expect(bundle.slsByAtrium.LA.derivedOnParams)
      .toBe(bundle.slsByAtrium.RA.derivedOnParams);
    expect(MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_ADAPTER_V1_CLAIM
      .atrialPassiveConstructionIdentityHash).toBe(bundle.parameterIdentityHash);
  });

  it("propagates the bundle identity only into atrial wall parameter hashes", () => {
    const bundle = NORMAL_ADULT_ATRIAL_PASSIVE_CONSTRUCTION_V1;
    const prior = NORMAL_ADULT_FIVE_WALL_PRIOR_V1;
    const kernels = createMainWireNormalAdultFiveWallMaterialKernelsV1();
    for (const wallId of ["LA", "RA", "LVFW", "SEP", "RVFW"] as const) {
      const isAtrium = wallId === "LA" || wallId === "RA";
      const passive = isAtrium
        ? bundle.equilibriumPassive.compiled
        : prior.passive.ventricular.compiled;
      const params = prior.active.wallMaterialByWall[wallId];
      const legacyPayload = {
        adapterId: MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_ADAPTER_V1_ID,
        priorIdentityHash: prior.parameterIdentityHash,
        wallId,
        passiveModelId: passive.modelId,
        passiveParameterIdentityHash: passive.parameterIdentityHash,
        landSls: {
          parameterSetId: params.parameterSetId,
          landParameterSetStableHash:
            params.landEquationParameters.parameterSetStableHash,
          landSlackStretch: params.landSlackStretch,
          orientationFraction01: params.orientationFraction01,
          viableActiveFraction01: params.viableActiveFraction01,
          sls: params.sls,
        },
      };
      const legacyHash = stableHash(sanitizeForStableHash(legacyPayload));
      const expectedHash = stableHash(sanitizeForStableHash({
        ...legacyPayload,
        ...(isAtrium
          ? { atrialPassiveConstructionIdentityHash: bundle.parameterIdentityHash }
          : {}),
      }));
      expect(kernels[wallId].parameterIdentityHash).toBe(expectedHash);
      if (isAtrium) expect(expectedHash).not.toBe(legacyHash);
      else expect(expectedHash).toBe(legacyHash);
    }
  });
});
