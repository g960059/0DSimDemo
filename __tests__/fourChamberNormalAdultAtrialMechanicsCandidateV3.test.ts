import { describe, expect, it } from "vitest";
import {
  buildNormalAdultAtrialMechanicsCenterCandidateV3,
  NORMAL_ADULT_ATRIAL_LOADED_PRESSURE_TARGETS_SI_V3,
} from "@/engine/myocardium/fourChamberV1/calibration/normalAdultAtrialMechanicsCandidateV3";
import {
  MOYER_2015_NORMAL_HUMAN_LA_EQUIBIAXIAL_PASSIVE_PRIOR_V3,
  compileMoyer2015AtrialEquibiaxialPassiveV3,
  evaluateMoyer2015AtrialEquibiaxialPassiveV3,
} from "@/engine/myocardium/fourChamberV1/passive/moyer2015AtrialEquibiaxialPassiveV3";

const PA_PER_MMHG = 133.322387415;
const PA_PER_MMHG_PER_ML = PA_PER_MMHG / 1e-6;

describe("Moyer 2015 atrial equibiaxial passive reduction v3", () => {
  it("derives energy, stress, and tangent from one strictly convex potential", () => {
    const compiled = compileMoyer2015AtrialEquibiaxialPassiveV3(
      MOYER_2015_NORMAL_HUMAN_LA_EQUIBIAXIAL_PASSIVE_PRIOR_V3,
    );
    const zero = evaluateMoyer2015AtrialEquibiaxialPassiveV3(0, compiled);
    expect(zero.storedEnergyDensityJPerM3).toBe(0);
    expect(zero.equilibriumKirchhoffStressPa).toBe(0);
    expect(zero.dStressDFiberLogStrainPa).toBeCloseTo(39_800.55, 7);
    expect(compiled.minimumSupportedTangentPa).toBeGreaterThan(0);

    for (const strain of [-0.2, -0.05, 0.05, 0.15, 0.3]) {
      const h = 1e-6;
      const lower = evaluateMoyer2015AtrialEquibiaxialPassiveV3(
        strain - h,
        compiled,
      );
      const center = evaluateMoyer2015AtrialEquibiaxialPassiveV3(
        strain,
        compiled,
      );
      const upper = evaluateMoyer2015AtrialEquibiaxialPassiveV3(
        strain + h,
        compiled,
      );
      const stressFromEnergy = (
        upper.storedEnergyDensityJPerM3 - lower.storedEnergyDensityJPerM3
      ) / (2 * h);
      const tangentFromStress = (
        upper.equilibriumKirchhoffStressPa
        - lower.equilibriumKirchhoffStressPa
      ) / (2 * h);
      expect(stressFromEnergy).toBeCloseTo(
        center.equilibriumKirchhoffStressPa,
        5,
      );
      expect(tangentFromStress).toBeCloseTo(
        center.dStressDFiberLogStrainPa,
        5,
      );
    }
  });
});

describe("normal adult atrial mechanics candidate v3", () => {
  it("inverse-unloads loaded CMR minima and predicts held-out LA/RA pressures", () => {
    const candidate = buildNormalAdultAtrialMechanicsCenterCandidateV3({
      bodySurfaceAreaM2: 1.9,
    });
    const laInverse = candidate.inverseUnloadingByAtrium.LA;
    const raInverse = candidate.inverseUnloadingByAtrium.RA;

    expect(laInverse.loadedMinimumFiberLogPrestrain)
      .toBeCloseTo(0.1019, 4);
    expect(laInverse.unloadedReferenceCavityVolumeM3 * 1e6)
      .toBeCloseTo(22.89, 2);
    expect(raInverse.loadedMinimumFiberLogPrestrain)
      .toBeCloseTo(0.0956, 4);
    expect(raInverse.unloadedReferenceCavityVolumeM3 * 1e6)
      .toBeCloseTo(32.60, 2);
    expect(Math.abs(laInverse.replayResidualPa)).toBeLessThan(1e-8);
    expect(Math.abs(raInverse.replayResidualPa)).toBeLessThan(1e-8);

    const la = candidate.passivePhaseEvaluationByAtrium.LA;
    const ra = candidate.passivePhaseEvaluationByAtrium.RA;
    expect(la.minimum.passiveTransmuralPressurePa / PA_PER_MMHG)
      .toBeCloseTo(5, 10);
    expect(la.preAtrialContraction.passiveTransmuralPressurePa / PA_PER_MMHG)
      .toBeCloseTo(7.487, 3);
    expect(la.maximum.passiveTransmuralPressurePa / PA_PER_MMHG)
      .toBeCloseTo(8.9565, 3);
    expect(candidate.heldOutReadback.leftAtrialReservoirPressureIncrementPa
      / PA_PER_MMHG).toBeCloseTo(3.9565, 3);
    expect(candidate.heldOutReadback.leftAtrialFillingSecantPaPerM3
      / PA_PER_MMHG_PER_ML).toBeCloseTo(0.08899, 4);

    expect(ra.minimum.passiveTransmuralPressurePa / PA_PER_MMHG)
      .toBeCloseTo(3.5, 10);
    expect(ra.maximum.passiveTransmuralPressurePa / PA_PER_MMHG)
      .toBeCloseTo(6.2824, 3);
    expect(candidate.heldOutReadback.rightAtrialVWaveResidualPa / PA_PER_MMHG)
      .toBeCloseTo(-0.2176, 3);
    expect(candidate.heldOutReadback.noneUsedForFit).toBe(true);
    expect(candidate.audit.pass).toBe(true);
  });

  it("keeps pulse, secant, v-wave, and PV shape outside identification", () => {
    const targets = NORMAL_ADULT_ATRIAL_LOADED_PRESSURE_TARGETS_SI_V3;
    expect(targets.claimBoundary).toEqual({
      onlyMinimumPressureUsedForInverseUnloading: true,
      reservoirPulseUsedForFit: false,
      fillingSecantUsedForFit: false,
      rightAtrialVWaveUsedForFit: false,
      pvLoopMorphologyUsedForFit: false,
    });
  });
});
