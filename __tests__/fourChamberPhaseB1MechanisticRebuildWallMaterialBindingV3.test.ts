import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";

import {
  buildNormalAdultAtrialMechanicsCenterCandidateV3,
} from "@/engine/myocardium/fourChamberV1/calibration/normalAdultAtrialMechanicsCandidateV3";
import {
  buildNormalAdultVentricularMechanicsCandidateV2,
} from "@/engine/myocardium/fourChamberV1/calibration/normalAdultVentricularMechanicsCandidateV2";
import {
  sourceLand2017StateToRateFreeV1,
} from "@/engine/myocardium/fourChamberV1/land/rateFreeLand2017V1";
import {
  buildPhaseA1TissueManifestBundleV1,
} from "@/engine/myocardium/fourChamberV1/manifests/phaseA1TissueManifestBundleV1";
import {
  evaluateEquilibriumPassiveEnergyV1,
} from "@/engine/myocardium/fourChamberV1/passive/equilibriumPassiveEnergyC2V1";
import {
  MOYER_2015_ATRIAL_EQUIBIAXIAL_PASSIVE_V3_ID,
  evaluateMoyer2015AtrialEquibiaxialPassiveV3,
} from "@/engine/myocardium/fourChamberV1/passive/moyer2015AtrialEquibiaxialPassiveV3";
import {
  stepOneStateAlphaVSlsBackwardEulerV1,
} from "@/engine/myocardium/fourChamberV1/passive/oneStateAlphaVSlsV1";
import {
  PHASE_B1_MECHANISTIC_REBUILD_ATRIAL_PASSIVE_SLS_BINDING_V3_ID,
  PHASE_B1_MECHANISTIC_REBUILD_PASSIVE_SLS_BINDING_V2_ID,
  buildPhaseB1FullMechanisticRebuildWallMaterialBindingV3,
  type PhaseB1WallRuntimeMaterialV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1WallMaterialBindingV1";
import {
  evaluatePhaseB1WallMaterialStateV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1WallMaterialKernelV1";

const PA_PER_MMHG = 133.322387415;

describe("Phase B1 mechanistic rebuild wall-material binding V3", () => {
  const bundle = buildPhaseA1TissueManifestBundleV1(sha256);
  const atrialCandidate = buildNormalAdultAtrialMechanicsCenterCandidateV3({
    bodySurfaceAreaM2: 1.9,
  });
  const ventricularCandidate = buildNormalAdultVentricularMechanicsCandidateV2({
    bodySurfaceAreaM2: 1.9,
    leftVentricularEndDiastolicPressurePa: 8 * PA_PER_MMHG,
  });
  const binding = buildPhaseB1FullMechanisticRebuildWallMaterialBindingV3(
    bundle,
    ventricularCandidate.passiveFit,
    atrialCandidate,
    sha256,
  );

  it("assigns Moyer V3 only to both atria and the calibrated ventricular passive law to all three ventricular walls", () => {
    expect(binding.descriptor.atrialWalls).toEqual(["LA", "RA"]);
    expect(binding.descriptor.ventricularWalls).toEqual(["LVFW", "SEP", "RVFW"]);

    for (const wallId of ["LA", "RA"] as const) {
      const material = binding.runtimeByWall[wallId];
      expect(material.tissueClass).toBe("atrial");
      expect(material.passiveSls.bindingId)
        .toBe(PHASE_B1_MECHANISTIC_REBUILD_ATRIAL_PASSIVE_SLS_BINDING_V3_ID);
      expect(material.passiveSls.compiledPassive.modelId)
        .toBe(MOYER_2015_ATRIAL_EQUIBIAXIAL_PASSIVE_V3_ID);
      expect(material.passiveSls.compiledPassive).toBe(atrialCandidate.compiledPassive);
      expect("atrialConstruction" in material.passiveSls).toBe(true);
      expect("calibration" in material.passiveSls).toBe(false);
    }

    for (const wallId of ["LVFW", "SEP", "RVFW"] as const) {
      const material = binding.runtimeByWall[wallId];
      expect(material.tissueClass).toBe("ventricular");
      expect(material.passiveSls.bindingId)
        .toBe(PHASE_B1_MECHANISTIC_REBUILD_PASSIVE_SLS_BINDING_V2_ID);
      expect(material.passiveSls.compiledPassive.modelId)
        .not.toBe(MOYER_2015_ATRIAL_EQUIBIAXIAL_PASSIVE_V3_ID);
      expect("calibration" in material.passiveSls).toBe(true);
      expect("atrialConstruction" in material.passiveSls).toBe(false);
    }
  });

  it("rebinds one shared atrial SLS to the Moyer zero-strain tangent without changing the passive BE identity", () => {
    const left = binding.runtimeByWall.LA.passiveSls;
    const right = binding.runtimeByWall.RA.passiveSls;
    expect(left).toBe(right);
    expect(left.compiledSls).toBe(right.compiledSls);
    if (!("atrialConstruction" in left)) {
      throw new Error("LA did not receive the Moyer atrial construction");
    }

    const sls = left.compiledSls;
    expect(sls.equilibriumPassivePriorId)
      .toBe(left.compiledPassive.prior.priorId);
    expect(sls.equilibriumReferenceTangentPa)
      .toBe(left.compiledPassive.zeroStrainTangentPa);
    expect(sls.equilibriumReferenceTangentSource)
      .toBe("moyer-equibiaxial-zero-strain-tangent");
    expect(sls.prior.rClass).toBe(0.25);
    expect(sls.tauSec).toBe(0.05);
    expect(sls.EVPa).toBeCloseTo(9_950.1375, 8);
    expect(left.atrialConstruction.slsEquilibriumRebinding).toEqual({
      equilibriumPassivePriorId: left.compiledPassive.prior.priorId,
      equilibriumReferenceTangentPa: left.compiledPassive.zeroStrainTangentPa,
      equilibriumReferenceTangentSource:
        "moyer-equibiaxial-zero-strain-tangent",
      rClass: 0.25,
      tauSec: 0.05,
      derivedEVPa: sls.EVPa,
      sameClassPriorAppliedToLaAndRa: true,
      wallWiseFreeFitApplied: false,
      pvLoopMorphologyUsedForFit: false,
    });

    const step = stepOneStateAlphaVSlsBackwardEulerV1({
      previousFiberLogStrain: -0.01,
      previousAlphaV: 0.025,
      nextFiberLogStrain: 0.09,
      dtSec: 0.012,
    }, sls);
    expect(step.numericalDissipationIncrementDensityJPerM3)
      .toBeGreaterThanOrEqual(0);
    expect(step.physicalDissipationIncrementDensityJPerM3)
      .toBeGreaterThanOrEqual(0);
    expect(Math.abs(step.discretePassivityIdentityResidualJPerM3))
      .toBeLessThan(1e-10);
  });

  it("predicts the pre-A RV pressure from the coupled passive path instead of imposing an RV Klotz target", () => {
    const preA = ventricularCandidate.preAPassiveConstruction;
    expect(preA.leftVentricularTargetPressurePa / PA_PER_MMHG)
      .toBeCloseTo(5, 12);
    expect(preA.leftVentricularCavityVolumeM3 * 1e6).toBeGreaterThan(130);
    expect(preA.leftVentricularCavityVolumeM3 * 1e6).toBeLessThan(144.4);
    expect(preA.predictedRightVentricularPressurePa / PA_PER_MMHG)
      .toBeGreaterThan(1);
    expect(preA.predictedRightVentricularPressurePa / PA_PER_MMHG)
      .toBeLessThan(2);
    expect(preA.rightVentricularPressureSource)
      .toBe("runtime-energy-triseg-prediction-not-an-rv-klotz-target");
    expect(preA.usedToIdentifySharedTensileScale).toBe(false);
    expect(preA.pvLoopMorphologyUsed).toBe(false);
  });

  it.each([-0.05, 0.12])(
    "dispatches each wall through its direct passive evaluator at e_f=%s",
    (fiberLogStrain) => {
      for (const wallId of ["LA", "RA"] as const) {
        const material = binding.runtimeByWall[wallId];
        const runtime = evaluateRuntimePassive(material, fiberLogStrain);
        const direct = evaluateMoyer2015AtrialEquibiaxialPassiveV3(
          fiberLogStrain,
          atrialCandidate.compiledPassive,
        );
        expect(runtime).toEqual(direct);
      }

      for (const wallId of ["LVFW", "SEP", "RVFW"] as const) {
        const material = binding.runtimeByWall[wallId];
        if (material.passiveSls.compiledPassive.modelId
          === MOYER_2015_ATRIAL_EQUIBIAXIAL_PASSIVE_V3_ID) {
          throw new Error(`${wallId} unexpectedly received the atrial Moyer law`);
        }
        const runtime = evaluateRuntimePassive(material, fiberLogStrain);
        const direct = evaluateEquilibriumPassiveEnergyV1(
          fiberLogStrain,
          material.passiveSls.compiledPassive,
        );
        expect(runtime).toEqual(direct);
      }
    },
  );
});

function evaluateRuntimePassive(
  wallMaterial: PhaseB1WallRuntimeMaterialV1,
  fiberLogStrain: number,
) {
  const landStretch = wallMaterial.landWallAdapterContext.lambdaLandSlack
    * Math.exp(fiberLogStrain);
  const landState = sourceLand2017StateToRateFreeV1(
    [0.36, 0.10, 0.16, 0.19, 0.05, -0.2],
    landStretch,
    wallMaterial.landEquationParameters,
  );
  return evaluatePhaseB1WallMaterialStateV1({
    wallMaterial,
    fiberLogStrain,
    freeCalciumUM: 0.4,
    landState,
    slsMode: "off",
    alphaV: null,
  }).passive;
}

function sha256(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}
