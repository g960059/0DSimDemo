import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";

import {
  EQUILIBRIUM_PASSIVE_C2_LOGSTRAIN_V1_ID,
  EQUILIBRIUM_PASSIVE_TRANSITION_HALF_WIDTH_STRAIN_V1,
  PHASE_A1_ATRIAL_EFFECTIVE_ONE_FIBER_PASSIVE_PRIOR_V1,
  PHASE_A1_VENTRICULAR_EFFECTIVE_ONE_FIBER_PASSIVE_PRIOR_V1,
  compileEquilibriumPassivePriorV1,
  compileEquilibriumPassiveWidthSensitivityV1,
  evaluateEquilibriumPassiveEnergyV1,
  type EffectiveOneFiberPassivePriorV1,
} from "@/engine/myocardium/fourChamberV1/passive/equilibriumPassiveEnergyC2V1";
import {
  ONE_STATE_ALPHA_V_SLS_V1_ID,
  PHASE_A1_ATRIAL_CLASS_SHARED_SLS_PRIOR_V1,
  PHASE_A1_VENTRICULAR_CLASS_SHARED_SLS_PRIOR_V1,
  compileOneStateAlphaVSlsV1,
  evaluateOneStateAlphaVSlsContinuousV1,
  exactOneStateSlsStepStrainRelaxationV1,
  stepOneStateAlphaVSlsBackwardEulerV1,
  type ClassSharedPassiveSlsPriorV1,
} from "@/engine/myocardium/fourChamberV1/passive/oneStateAlphaVSlsV1";
import {
  ATRIAL_SELF_SIMILAR_ONE_FIBER_GEOMETRY_V1_ID,
  PHASE_A1_LA_SELF_SIMILAR_GEOMETRY_PRIOR_V1,
  PHASE_A1_RA_SELF_SIMILAR_GEOMETRY_PRIOR_V1,
  evaluateAtrialOneFiberGeometryV1,
  evaluateAtrialOneFiberPressureV1,
  evaluateAtrialVirtualWorkFiniteDifferenceOracleV1,
} from "@/engine/myocardium/fourChamberV1/atria/atrialOneFiberGeometryV1";
import { buildPhaseA1TissueManifestBundleV1 } from
  "@/engine/myocardium/fourChamberV1/manifests/phaseA1TissueManifestBundleV1";
import { bindPhaseA1PassiveSlsFromTissueManifestV1 } from
  "@/engine/myocardium/fourChamberV1/manifests/phaseA1PassiveSlsBindingV1";

describe("four-chamber TriSeg Land Phase A1 passive/SLS/atrial component gates", () => {
  const ventricularPassive = compileEquilibriumPassivePriorV1(
    PHASE_A1_VENTRICULAR_EFFECTIVE_ONE_FIBER_PASSIVE_PRIOR_V1,
  );
  const atrialPassive = compileEquilibriumPassivePriorV1(
    PHASE_A1_ATRIAL_EFFECTIVE_ONE_FIBER_PASSIVE_PRIOR_V1,
  );
  const ventricularSls = compileOneStateAlphaVSlsV1(
    ventricularPassive,
    PHASE_A1_VENTRICULAR_CLASS_SHARED_SLS_PRIOR_V1,
  );

  it("constructs the unique normalized-coordinate C2 transitions and matches all endpoint jets", () => {
    const delta = EQUILIBRIUM_PASSIVE_TRANSITION_HALF_WIDTH_STRAIN_V1;
    const prior = PHASE_A1_VENTRICULAR_EFFECTIVE_ONE_FIBER_PASSIVE_PRIOR_V1;
    const compressionJoin = evaluateEquilibriumPassiveEnergyV1(-delta, ventricularPassive);
    const center = evaluateEquilibriumPassiveEnergyV1(0, ventricularPassive);
    const tensionJoin = evaluateEquilibriumPassiveEnergyV1(delta, ventricularPassive);
    const expBd = Math.exp(prior.B * delta);

    expect(ventricularPassive.modelId).toBe(EQUILIBRIUM_PASSIVE_C2_LOGSTRAIN_V1_ID);
    expect(ventricularPassive.coefficientCoordinateSystem).toBe("normalized-unit-interval");
    expect(ventricularPassive.compressionTransitionCoefficientsNormalized).toHaveLength(6);
    expect(ventricularPassive.tensionTransitionCoefficientsNormalized).toHaveLength(6);
    expect(ventricularPassive.canonicalWidthPolicyEligible).toBe(true);
    expect(compressionJoin.storedEnergyDensityJPerM3)
      .toBeCloseTo(0.5 * prior.KCompEffPa * delta * delta, 14);
    expect(compressionJoin.equilibriumKirchhoffStressPa)
      .toBeCloseTo(-prior.KCompEffPa * delta, 12);
    expect(compressionJoin.dStressDFiberLogStrainPa).toBeCloseTo(prior.KCompEffPa, 10);
    expect(center.storedEnergyDensityJPerM3).toBe(0);
    expect(center.equilibriumKirchhoffStressPa).toBe(0);
    expect(center.dStressDFiberLogStrainPa).toBeCloseTo(ventricularPassive.centralTangentPa, 12);
    expect(tensionJoin.storedEnergyDensityJPerM3).toBeCloseTo(
      prior.APa / (prior.B * prior.B) * (Math.expm1(prior.B * delta) - prior.B * delta),
      14,
    );
    expect(tensionJoin.equilibriumKirchhoffStressPa)
      .toBeCloseTo(prior.APa / prior.B * Math.expm1(prior.B * delta), 11);
    expect(tensionJoin.dStressDFiberLogStrainPa).toBeCloseTo(prior.APa * expBd, 9);
  });

  it("runs the predeclared delta/2, delta, and 2delta diagnostic without changing release ownership", () => {
    const compiled = ([0.5, 1, 2] as const).map((factor) =>
      compileEquilibriumPassiveWidthSensitivityV1(
        PHASE_A1_VENTRICULAR_EFFECTIVE_ONE_FIBER_PASSIVE_PRIOR_V1,
        factor,
      ));
    expect(compiled.map((entry) => entry.prior.transitionHalfWidthStrain)).toEqual([
      0.5e-3,
      1e-3,
      2e-3,
    ]);
    for (const entry of compiled) {
      expect(entry.parameterizationUse).toBe("diagnostic-width-sensitivity");
      expect(entry.canonicalWidthPolicyEligible).toBe(false);
      expect(entry.compressionConvexity.minimumTangentPa).toBeGreaterThan(0);
      expect(entry.tensionConvexity.minimumTangentPa).toBeGreaterThan(0);
    }
    for (const strain of [-3e-3, 3e-3]) {
      const outputs = compiled.map((entry) => evaluateEquilibriumPassiveEnergyV1(strain, entry));
      expect(outputs[1].storedEnergyDensityJPerM3).toBeCloseTo(
        outputs[0].storedEnergyDensityJPerM3,
        14,
      );
      expect(outputs[2].equilibriumKirchhoffStressPa).toBeCloseTo(
        outputs[0].equilibriumKirchhoffStressPa,
        12,
      );
    }
    expect(() => compileEquilibriumPassiveWidthSensitivityV1(
      PHASE_A1_VENTRICULAR_EFFECTIVE_ONE_FIBER_PASSIVE_PRIOR_V1,
      3 as never,
    )).toThrow(/0.5, 1, or 2/);
  });

  it("derives stress and positive tangent from one energy without clipping", () => {
    const samples = [-0.4, -0.02, -7e-4, 0, 6e-4, 0.02, 0.2];
    for (const fiberLogStrain of samples) {
      const output = evaluateEquilibriumPassiveEnergyV1(fiberLogStrain, ventricularPassive);
      const h = 1e-7;
      const upper = evaluateEquilibriumPassiveEnergyV1(fiberLogStrain + h, ventricularPassive);
      const lower = evaluateEquilibriumPassiveEnergyV1(fiberLogStrain - h, ventricularPassive);
      const stressFromEnergy = (
        upper.storedEnergyDensityJPerM3 - lower.storedEnergyDensityJPerM3
      ) / (2 * h);
      const tangentFromStress = (
        upper.equilibriumKirchhoffStressPa - lower.equilibriumKirchhoffStressPa
      ) / (2 * h);

      expect(relativeError(output.equilibriumKirchhoffStressPa, stressFromEnergy, 1)).toBeLessThan(2e-7);
      expect(relativeError(output.dStressDFiberLogStrainPa, tangentFromStress, 1)).toBeLessThan(1e-6);
      expect(output.dStressDFiberLogStrainPa).toBeGreaterThan(0);
      expect(output.stressClipped).toBe(false);
    }
    expect(evaluateEquilibriumPassiveEnergyV1(-0.02, ventricularPassive).equilibriumKirchhoffStressPa)
      .toBeLessThan(0);
    expect(ventricularPassive.compressionConvexity.minimumTangentPa).toBeGreaterThan(0);
    expect(ventricularPassive.tensionConvexity.minimumTangentPa).toBeGreaterThan(0);
  });

  it("keeps zero strain as the unique zero-stress root and rejects a non-convex transition prior", () => {
    const roots = Array.from({ length: 1_001 }, (_, index) => -0.5 + index / 1_000)
      .filter((strain) =>
        Math.abs(evaluateEquilibriumPassiveEnergyV1(strain, ventricularPassive)
          .equilibriumKirchhoffStressPa) < 1e-12
      );
    expect(roots).toEqual([0]);

    const invalid: EffectiveOneFiberPassivePriorV1 = {
      ...PHASE_A1_VENTRICULAR_EFFECTIVE_ONE_FIBER_PASSIVE_PRIOR_V1,
      priorId: "non-convex-transition-negative-control",
      B: 10_000,
    };
    expect(() => compileEquilibriumPassivePriorV1(invalid)).toThrow(/not strictly convex/);
  });

  it("makes all passive/SLS values explicit effective one-fiber SI candidate priors", () => {
    expect(PHASE_A1_ATRIAL_EFFECTIVE_ONE_FIBER_PASSIVE_PRIOR_V1).toMatchObject({
      status: "candidate-prior",
      evidenceClass: "project-synthetic-implementation-verification",
      parameterMeaning: "effective-one-fiber-wall",
      APa: 700,
      B: 14,
      KCompEffPa: 700,
      transitionHalfWidthStrain: 1e-3,
      stressClippingAllowed: false,
      chamberPressureGainAllowed: false,
    });
    expect(PHASE_A1_ATRIAL_CLASS_SHARED_SLS_PRIOR_V1).toMatchObject({
      rClass: 0.25,
      tauSec: 0.05,
      derivedModulusRule: "E_v=r_class*K_0",
      wallWiseFreeFitAllowed: false,
      enabledInCanonical59StateBaseline: true,
    });
    expect(ventricularSls).toMatchObject({
      modelId: ONE_STATE_ALPHA_V_SLS_V1_ID,
      EVPa: 420,
      tauSec: 0.08,
      canonicalState: "alphaV",
      overstressIsAlgebraic: true,
    });
    expect(ventricularSls.dashpotViscosityPaSec).toBeCloseTo(33.6, 12);
  });

  it("binds canonical passive/SLS compilers to the validated content-hashed tissue owner", () => {
    const bundle = buildPhaseA1TissueManifestBundleV1(sha256);
    const ventricular = bindPhaseA1PassiveSlsFromTissueManifestV1(
      bundle,
      "ventricular",
      sha256,
    );
    const atrial = bindPhaseA1PassiveSlsFromTissueManifestV1(bundle, "atrial", sha256);
    expect(ventricular.completeParameterParity).toBe(true);
    expect(ventricular.compiledPassive.canonicalWidthPolicyEligible).toBe(true);
    expect(ventricular.tissueManifestSha256).toBe(bundle.ventricularManifest.contentSha256);
    expect(ventricular.compiledPassive.centralTangentPa).toBe(1_200);
    expect(ventricular.compiledSls.EVPa).toBe(420);
    expect(atrial.compiledPassive.centralTangentPa).toBe(700);
    expect(atrial.compiledSls.EVPa).toBe(175);
    expect(ventricular.closedLoopReleaseEligible).toBe(false);
  }, 30_000);

  it("rejects undeclared fields, accessors, and sparse class/shared parameter arrays", () => {
    const withFreeGain = {
      ...PHASE_A1_VENTRICULAR_EFFECTIVE_ONE_FIBER_PASSIVE_PRIOR_V1,
      freePressureGain: 2,
    } as unknown as EffectiveOneFiberPassivePriorV1;
    expect(() => compileEquilibriumPassivePriorV1(withFreeGain)).toThrow(/undeclared=\[freePressureGain\]/);

    const { APa: _APa, ...passiveWithoutA } =
      PHASE_A1_VENTRICULAR_EFFECTIVE_ONE_FIBER_PASSIVE_PRIOR_V1;
    const withAccessor = {
      ...passiveWithoutA,
      get APa() {
        return 1_200;
      },
    } as EffectiveOneFiberPassivePriorV1;
    expect(() => compileEquilibriumPassivePriorV1(withAccessor))
      .toThrow(/passivePrior\.APa must be an enumerable data property/);

    const sparseWalls = new Array<string>(2);
    sparseWalls[0] = "LA";
    const withSparseWalls = {
      ...PHASE_A1_ATRIAL_CLASS_SHARED_SLS_PRIOR_V1,
      sharedByWalls: sparseWalls,
    } as ClassSharedPassiveSlsPriorV1;
    expect(() => compileOneStateAlphaVSlsV1(atrialPassive, withSparseWalls))
      .toThrow(/must be dense/);

    expect(() => evaluateOneStateAlphaVSlsContinuousV1({
      fiberLogStrain: 0.1,
      fiberLogStrainRatePerSec: 0,
      alphaV: 0,
      hiddenGain: 2,
    } as unknown as Parameters<typeof evaluateOneStateAlphaVSlsContinuousV1>[0], ventricularSls))
      .toThrow(/undeclared=\[hiddenGain\]/);
  });

  it("satisfies continuous SLS power balance and nonnegative dissipation for either overstress sign", () => {
    for (const input of [
      { fiberLogStrain: 0.08, fiberLogStrainRatePerSec: -0.3, alphaV: 0.03 },
      { fiberLogStrain: -0.02, fiberLogStrainRatePerSec: 0.4, alphaV: 0.04 },
      { fiberLogStrain: 0.02, fiberLogStrainRatePerSec: 0, alphaV: 0.02 },
    ]) {
      const output = evaluateOneStateAlphaVSlsContinuousV1(input, ventricularSls);
      expect(output.dissipationDensityWPerM3).toBeGreaterThanOrEqual(0);
      expect(Math.abs(output.continuousPassivityResidualWPerM3)).toBeLessThan(1e-12);
      expect(output.stressPowerDensityWPerM3).toBeCloseTo(
        output.storedEnergyRateDensityWPerM3 + output.dissipationDensityWPerM3,
        12,
      );
    }
  });

  it("uses the closed-form alphaV backward-Euler elimination, exact tangent, and discrete passivity identity", () => {
    const input = {
      previousFiberLogStrain: -0.01,
      previousAlphaV: 0.025,
      nextFiberLogStrain: 0.09,
      dtSec: 0.012,
    };
    const output = stepOneStateAlphaVSlsBackwardEulerV1(input, ventricularSls);
    const h = 1e-7;
    const upper = stepOneStateAlphaVSlsBackwardEulerV1(
      { ...input, nextFiberLogStrain: input.nextFiberLogStrain + h },
      ventricularSls,
    );
    const lower = stepOneStateAlphaVSlsBackwardEulerV1(
      { ...input, nextFiberLogStrain: input.nextFiberLogStrain - h },
      ventricularSls,
    );
    const finiteDifferenceTangent = (upper.nextOverstressPa - lower.nextOverstressPa) / (2 * h);

    expect(Math.abs(output.stateResidual)).toBeLessThan(2e-17);
    expect(Math.abs(output.overstressEliminationResidualPa)).toBeLessThan(2e-13);
    expect(Math.abs(output.discretePassivityIdentityResidualJPerM3)).toBeLessThan(2e-13);
    expect(relativeError(
      output.dNextOverstressDNextFiberLogStrainPa,
      finiteDifferenceTangent,
      1,
    )).toBeLessThan(5e-11);
    expect(output.numericalDissipationIncrementDensityJPerM3).toBeGreaterThanOrEqual(0);
    expect(output.physicalDissipationIncrementDensityJPerM3).toBeGreaterThanOrEqual(0);
    expect(output.totalDissipationIncrementDensityJPerM3).toBeCloseTo(
      output.stressWorkIncrementDensityJPerM3
        - (output.nextStoredEnergyDensityJPerM3 - output.previousStoredEnergyDensityJPerM3),
      12,
    );
  });

  it("reproduces exact continuous step-strain relaxation and rejects invalid class-shared SLS priors", () => {
    const initialOverstressPa = 1_500;
    expect(exactOneStateSlsStepStrainRelaxationV1(
      initialOverstressPa,
      3 * ventricularSls.tauSec,
      ventricularSls,
    )).toBeCloseTo(initialOverstressPa * Math.exp(-3), 12);

    const invalid: ClassSharedPassiveSlsPriorV1 = {
      ...PHASE_A1_VENTRICULAR_CLASS_SHARED_SLS_PRIOR_V1,
      priorId: "zero-relaxation-modulus-negative-control",
      rClass: 0,
    };
    expect(() => compileOneStateAlphaVSlsV1(ventricularPassive, invalid))
      .toThrow(/rClass must be positive/);
  });

  it("produces nonnegative cyclic SLS stress work after periodic burn-in", () => {
    const dtSec = 0.002;
    const stepsPerCycle = 500;
    const totalCycles = 12;
    let previousFiberLogStrain = 0;
    let previousAlphaV = 0;
    let lastCycleStressWorkDensityJPerM3 = 0;
    let lastCycleDissipationDensityJPerM3 = 0;
    let lastCycleEnergyChangeDensityJPerM3 = 0;

    for (let step = 1; step <= totalCycles * stepsPerCycle; step += 1) {
      const phase = 2 * Math.PI * step / stepsPerCycle;
      const nextFiberLogStrain = 0.08 * Math.sin(phase);
      const output = stepOneStateAlphaVSlsBackwardEulerV1({
        previousFiberLogStrain,
        previousAlphaV,
        nextFiberLogStrain,
        dtSec,
      }, ventricularSls);
      if (step > (totalCycles - 1) * stepsPerCycle) {
        lastCycleStressWorkDensityJPerM3 += output.stressWorkIncrementDensityJPerM3;
        lastCycleDissipationDensityJPerM3 += output.totalDissipationIncrementDensityJPerM3;
        lastCycleEnergyChangeDensityJPerM3 += output.nextStoredEnergyDensityJPerM3
          - output.previousStoredEnergyDensityJPerM3;
      }
      previousFiberLogStrain = nextFiberLogStrain;
      previousAlphaV = output.nextAlphaV;
    }

    expect(lastCycleStressWorkDensityJPerM3).toBeGreaterThan(0);
    expect(lastCycleDissipationDensityJPerM3).toBeGreaterThan(0);
    expect(relativeError(
      lastCycleStressWorkDensityJPerM3,
      lastCycleDissipationDensityJPerM3 + lastCycleEnergyChangeDensityJPerM3,
      1,
    )).toBeLessThan(2e-13);
    expect(Math.abs(lastCycleEnergyChangeDensityJPerM3))
      .toBeLessThan(1e-10 * lastCycleDissipationDensityJPerM3);
  });

  it("implements self-similar atrial log strain and lets a fixed shape factor cancel", () => {
    const atReference = evaluateAtrialOneFiberGeometryV1(
      PHASE_A1_LA_SELF_SIMILAR_GEOMETRY_PRIOR_V1.referenceCavityVolumeM3,
      PHASE_A1_LA_SELF_SIMILAR_GEOMETRY_PRIOR_V1,
    );
    const alteredShapePrior = {
      ...PHASE_A1_LA_SELF_SIMILAR_GEOMETRY_PRIOR_V1,
      priorId: "la-shape-factor-cancellation-check",
      fixedSelfSimilarAreaShapeFactor: 1.7,
    } as const;
    const base = evaluateAtrialOneFiberGeometryV1(75e-6, PHASE_A1_LA_SELF_SIMILAR_GEOMETRY_PRIOR_V1);
    const alteredShape = evaluateAtrialOneFiberGeometryV1(75e-6, alteredShapePrior);

    expect(atReference.modelId).toBe(ATRIAL_SELF_SIMILAR_ONE_FIBER_GEOMETRY_V1_ID);
    expect(atReference.fiberLogStrain).toBe(0);
    expect(base.fiberLogStrain).toBeCloseTo(alteredShape.fiberLogStrain, 15);
    expect(alteredShape.midwallAreaM2 / base.midwallAreaM2).toBeCloseTo(1.7, 14);
    expect(base.shapeFactorCancelsFromStrain).toBe(true);
  });

  it("maps atrial stress to pressure by virtual work without gain, clipping, or an extra Laplace factor", () => {
    const geometry = evaluateAtrialOneFiberGeometryV1(75e-6, PHASE_A1_LA_SELF_SIMILAR_GEOMETRY_PRIOR_V1);
    const material = evaluateEquilibriumPassiveEnergyV1(geometry.fiberLogStrain, atrialPassive);
    const pressure = evaluateAtrialOneFiberPressureV1({
      cavityVolumeM3: geometry.cavityVolumeM3,
      kirchhoffFiberStressPa: material.equilibriumKirchhoffStressPa,
      dKirchhoffStressDFiberLogStrainPa: material.dStressDFiberLogStrainPa,
    }, PHASE_A1_LA_SELF_SIMILAR_GEOMETRY_PRIOR_V1);
    const oracle = evaluateAtrialVirtualWorkFiniteDifferenceOracleV1({
      cavityVolumeM3: geometry.cavityVolumeM3,
      kirchhoffFiberStressPa: material.equilibriumKirchhoffStressPa,
      symmetricVolumeStepM3: 1e-10,
    }, PHASE_A1_LA_SELF_SIMILAR_GEOMETRY_PRIOR_V1);

    expect(pressure.transmuralPressurePa).toBeCloseTo(
      pressure.wallReferenceMaterialVolumeM3 * pressure.kirchhoffFiberStressPa
        / (3 * pressure.midwallEnclosedVolumeM3),
      12,
    );
    expect(Math.abs(oracle.normalizedPressureResidual)).toBeLessThan(2e-10);
    expect(pressure.pressureGain).toBe(1);
    expect(pressure.extraSphericalLaplaceFactorApplied).toBe(false);
    expect(pressure.pressureClipped).toBe(false);
  });

  it("has a monotone passive atrial pressure-volume map and an analytic chamber tangent", () => {
    const volumesM3 = Array.from({ length: 81 }, (_, index) => 25e-6 + index * 1e-6);
    const outputs = volumesM3.map((cavityVolumeM3) => {
      const geometry = evaluateAtrialOneFiberGeometryV1(
        cavityVolumeM3,
        PHASE_A1_RA_SELF_SIMILAR_GEOMETRY_PRIOR_V1,
      );
      const material = evaluateEquilibriumPassiveEnergyV1(geometry.fiberLogStrain, atrialPassive);
      return evaluateAtrialOneFiberPressureV1({
        cavityVolumeM3,
        kirchhoffFiberStressPa: material.equilibriumKirchhoffStressPa,
        dKirchhoffStressDFiberLogStrainPa: material.dStressDFiberLogStrainPa,
      }, PHASE_A1_RA_SELF_SIMILAR_GEOMETRY_PRIOR_V1);
    });
    expect(outputs.every((output) => output.dTransmuralPressureDCavityVolumePaPerM3 > 0)).toBe(true);
    expect(outputs.slice(1).every((output, index) =>
      output.transmuralPressurePa > outputs[index].transmuralPressurePa
    )).toBe(true);

    const centerVolumeM3 = 75e-6;
    const h = 1e-10;
    const center = pressureFromPassive(centerVolumeM3);
    const upper = pressureFromPassive(centerVolumeM3 + h);
    const lower = pressureFromPassive(centerVolumeM3 - h);
    const finiteDifferenceTangent = (upper.transmuralPressurePa - lower.transmuralPressurePa) / (2 * h);
    expect(relativeError(
      center.dTransmuralPressureDCavityVolumePaPerM3,
      finiteDifferenceTangent,
      1,
    )).toBeLessThan(2e-9);
  });

  function pressureFromPassive(cavityVolumeM3: number) {
    const geometry = evaluateAtrialOneFiberGeometryV1(
      cavityVolumeM3,
      PHASE_A1_LA_SELF_SIMILAR_GEOMETRY_PRIOR_V1,
    );
    const material = evaluateEquilibriumPassiveEnergyV1(geometry.fiberLogStrain, atrialPassive);
    return evaluateAtrialOneFiberPressureV1({
      cavityVolumeM3,
      kirchhoffFiberStressPa: material.equilibriumKirchhoffStressPa,
      dKirchhoffStressDFiberLogStrainPa: material.dStressDFiberLogStrainPa,
    }, PHASE_A1_LA_SELF_SIMILAR_GEOMETRY_PRIOR_V1);
  }
});

function relativeError(left: number, right: number, floor: number): number {
  return Math.abs(left - right) / Math.max(floor, Math.abs(left), Math.abs(right));
}

function sha256(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}
