import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";

import {
  buildNormalAdultAtrialMechanicsCenterCandidateV3,
} from "@/engine/myocardium/fourChamberV1/calibration/normalAdultAtrialMechanicsCandidateV3";
import {
  buildNormalAdultVentricularMechanicsCandidateV2,
} from "@/engine/myocardium/fourChamberV1/calibration/normalAdultVentricularMechanicsCandidateV2";
import {
  NORMAL_ADULT_VENTRICULAR_EXACT_EVENT_CALCIUM_CANDIDATE_PRIOR_V1,
  buildNormalAdultActiveTissueClassPriorAuditV1,
} from "@/engine/myocardium/fourChamberV1/land/normalAdultActiveTissueClassPriorV1";
import {
  NORMAL_ADULT_HUMAN_ATRIAL_EXACT_EVENT_CALCIUM_CANDIDATE_V2,
} from "@/engine/myocardium/fourChamberV1/calcium/normalAdultHumanAtrialCalciumTimingCandidateV2";
import {
  buildPhaseA1TissueManifestBundleV1,
  VENTRICULAR_EXACT_EVENT_CALCIUM_CANDIDATE_PRIOR_V1,
} from "@/engine/myocardium/fourChamberV1/manifests/phaseA1TissueManifestBundleV1";
import {
  buildPhaseB1MechanisticRebuildWallMaterialBindingV4,
  buildPhaseB1MechanisticRebuildVentricularCalciumAblationBindingV5,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1WallMaterialBindingV1";

const PA_PER_MMHG = 133.322387415;

describe("Phase B1 mechanistic rebuild wall-material binding V4", () => {
  const bundle = buildPhaseA1TissueManifestBundleV1(sha256);
  const atrialCandidate = buildNormalAdultAtrialMechanicsCenterCandidateV3({
    bodySurfaceAreaM2: 1.9,
  });
  const ventricularCandidate = buildNormalAdultVentricularMechanicsCandidateV2({
    bodySurfaceAreaM2: 1.9,
    leftVentricularEndDiastolicPressurePa: 8 * PA_PER_MMHG,
  });
  const activePrior = buildNormalAdultActiveTissueClassPriorAuditV1(sha256);
  const binding = buildPhaseB1MechanisticRebuildWallMaterialBindingV4(
    bundle,
    ventricularCandidate.passiveFit,
    atrialCandidate,
    activePrior,
    sha256,
  );
  const ventricularCalciumAblation =
    buildPhaseB1MechanisticRebuildVentricularCalciumAblationBindingV5(
      bundle,
      ventricularCandidate.passiveFit,
      atrialCandidate,
      activePrior,
      sha256,
    );

  it("binds one immutable human-LA-anchored active material and calcium prior to both atria", () => {
    const la = binding.runtimeByWall.LA;
    const ra = binding.runtimeByWall.RA;

    expect(la.landEquationParameters).toBe(ra.landEquationParameters);
    expect(la.prescribedCalciumParameters).toBe(ra.prescribedCalciumParameters);
    expect(la.prescribedCalciumParameters)
      .toBe(NORMAL_ADULT_HUMAN_ATRIAL_EXACT_EVENT_CALCIUM_CANDIDATE_V2);
    expect(la.landEquationParameters.values.Tref)
      .toBeCloseTo(11_661.151010550097, 10);
    expect(la.landEquationParameters.parameterSetStableHash)
      .not.toBe(activePrior.atrialClass.parameterSetStableHash);
    expect(la.landEquationParameters.values.Aeff).toBe(0);
    expect(la.landEquationParameters.derived.Aw).toBe(0);
    expect(la.landEquationParameters.derived.As).toBe(0);

    for (const wallId of ["LA", "RA"] as const) {
      const descriptor = binding.descriptor.wallBindings.find(
        (entry) => entry.wallId === wallId,
      );
      expect(descriptor?.atrialActiveConstruction).toMatchObject({
        targetSaturatedActiveStressPa: 11_600,
        saturationPca: 4.5,
        sameParameterObjectAppliedToLaAndRa: true,
        rightAtriumIsLaDerivedTissueClassExtrapolation: true,
        chamberSpecificActiveGainApplied: false,
        moyerTmaxUsedAsLandTref: false,
        pvLoopMorphologyUsedForFit: false,
        globalAtrialVolumeRateUsedAsSarcomereRate: false,
        microscopicForceVelocityIdentifiedForRuntime: false,
        activeSeriesElementPresent: false,
        landAeff: 0,
        landAw: 0,
        landAs: 0,
      });
    }
  });

  it("retains one 120 kPa ventricular Land class and legacy calcium so V4 isolates the atrial change", () => {
    const [lvfw, sep, rvfw] = ["LVFW", "SEP", "RVFW"] as const;
    expect(binding.runtimeByWall[lvfw].landEquationParameters)
      .toBe(binding.runtimeByWall[sep].landEquationParameters);
    expect(binding.runtimeByWall[lvfw].landEquationParameters)
      .toBe(binding.runtimeByWall[rvfw].landEquationParameters);
    expect(binding.runtimeByWall[lvfw].landEquationParameters.values.Tref)
      .toBe(120_000);
    expect(binding.runtimeByWall[lvfw].prescribedCalciumParameters)
      .toBe(VENTRICULAR_EXACT_EVENT_CALCIUM_CANDIDATE_PRIOR_V1);
    expect(binding.runtimeByWall[lvfw].prescribedCalciumParameters)
      .toBe(binding.runtimeByWall[sep].prescribedCalciumParameters);
    expect(binding.runtimeByWall[lvfw].prescribedCalciumParameters)
      .toBe(binding.runtimeByWall[rvfw].prescribedCalciumParameters);

    for (const wallId of [lvfw, sep, rvfw]) {
      const descriptor = binding.descriptor.wallBindings.find(
        (entry) => entry.wallId === wallId,
      );
      expect(descriptor?.atrialActiveConstruction).toBeUndefined();
      expect(descriptor?.passiveCalibration?.sharedTensileEnergyScale)
        .toBe(ventricularCandidate.passiveFit.sharedTensileEnergyScale);
    }
  });

  it("keeps the incomplete ventricular timing reconstruction in a named V5 causal ablation", () => {
    for (const wallId of ["LVFW", "SEP", "RVFW"] as const) {
      expect(ventricularCalciumAblation.runtimeByWall[wallId]
        .prescribedCalciumParameters)
        .toBe(NORMAL_ADULT_VENTRICULAR_EXACT_EVENT_CALCIUM_CANDIDATE_PRIOR_V1);
      expect(ventricularCalciumAblation.runtimeByWall[wallId]
        .landEquationParameters)
        .toBe(binding.runtimeByWall[wallId].landEquationParameters);
      expect(ventricularCalciumAblation.runtimeByWall[wallId].passiveSls)
        .toEqual(binding.runtimeByWall[wallId].passiveSls);
    }
    expect(ventricularCalciumAblation.runtimeByWall.LA
      .prescribedCalciumParameters)
      .toBe(binding.runtimeByWall.LA.prescribedCalciumParameters);
    expect(activePrior.calciumTiming.ventricular.replay.rt90ContextReproduced)
      .toBe(false);
  });
});

function sha256(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}
