import { describe, expect, it } from "vitest";

import {
  PRE_A_OPERATING_POINT_HEMODYNAMIC_CONSTRUCTION_PRIOR_V2,
  assertPreAOperatingPointHemodynamicConstructionPriorV2,
  getPreAOperatingPointFixedHemodynamicInitializerInputsV2,
} from "@/engine/myocardium/fourChamberV1/physiology/preAOperatingPointHemodynamicConstructionPriorV2";

const PASCAL_PER_MMHG = 133.322387415;
const VASCULAR_IDS = ["SA", "SV", "PA", "PV"] as const;

describe("pre-A operating-point hemodynamic construction prior V2", () => {
  it("keeps the literature evidence boundary explicit and does not promote construction inputs to validation", () => {
    const prior = PRE_A_OPERATING_POINT_HEMODYNAMIC_CONSTRUCTION_PRIOR_V2;

    expect(prior.status)
      .toBe("literature-grounded-construction-prior-not-calibration-or-validation");
    expect(prior.evidenceSources.heldt2002.doi)
      .toBe("10.1152/japplphysiol.00241.2001");
    expect(prior.evidenceSources.magder1998.doi)
      .toBe("10.1097/00003246-199806000-00028");
    expect(prior.evidenceBoundary).toMatchObject({
      heldtDistributionUsedAsConstructionPrior: true,
      heldtCompartmentVolumesClaimedAsDirectHumanMeasurements: false,
      pulmonaryArterialVenousSplitClaimedAsDirectReportedPair: false,
      complianceIdentifiedByHeldt: false,
      pressureShapeIdentifiedByHeldt: false,
      magderUsedOnlyAsBroadConsistencyContext: true,
      normalHumanCalibrationClaimed: false,
      physiologicalValidationClaimed: false,
      patientSpecificFitClaimed: false,
      runtimeAdoptionClaimed: false,
    });
    expect(prior.units).toEqual({
      volume: "m^3",
      pressure: "Pa",
      compliance: "m^3/Pa",
    });
  });

  it("replays the 5.6 L Heldt pool construction and the declared PA/PV normalization exactly", () => {
    const { referenceConstruction: reference, audit } =
      PRE_A_OPERATING_POINT_HEMODYNAMIC_CONSTRUCTION_PRIOR_V2;

    expect(reference.referenceTotalBloodVolumeM3).toBeCloseTo(5.6e-3, 15);
    expect(reference.heldtPoolFractionByPool).toEqual({
      systemicArteries: 0.15,
      systemicCapillariesVenulesAndVeins: 0.69,
      pulmonaryCirculation: 0.09,
      heart: 0.07,
    });
    const expectedTargetByPool = {
      systemicArteries: 840e-6,
      systemicCapillariesVenulesAndVeins: 3_864e-6,
      pulmonaryCirculation: 504e-6,
      heart: 392e-6,
    } as const;
    for (const [pool, expected] of Object.entries(expectedTargetByPool)) {
      expect(reference.targetBloodVolumeM3ByPool[
        pool as keyof typeof expectedTargetByPool
      ]).toBeCloseTo(expected, 15);
    }
    const expectedVascularTarget = {
      SA: 840e-6,
      SV: 3_864e-6,
      PA: 106e-6,
      PV: 398e-6,
    } as const;
    for (const id of VASCULAR_IDS) {
      expect(reference.vascularTargetBloodVolumeM3ByCompartment[id])
        .toBeCloseTo(expectedVascularTarget[id], 15);
    }
    expect(audit.heldtPoolFractionSum).toBeCloseTo(1, 15);
    expect(audit.targetBloodVolumeSumM3).toBeCloseTo(5.6e-3, 15);
    expect(audit.vascularTargetBloodVolumeSumM3).toBeCloseTo(5.208e-3, 15);
    expect(audit.cardiacBloodVolumeRemainderM3).toBeCloseTo(392e-6, 15);
    expect(audit.maximumAbsoluteHeldtFractionReplayResidualM3).toBeLessThan(1e-15);
    expect(Math.abs(audit.pulmonarySplitDifferenceM3)).toBeLessThan(1e-15);
    expect(audit.pass).toBe(true);
  });

  it("provides the SI pressure shape relative to SV and the fixed current compliance vector", () => {
    const fixed = getPreAOperatingPointFixedHemodynamicInitializerInputsV2();
    const shape = fixed.pressureShapePaRelativeToSvByCompartment;

    const expectedShape = {
      LA: 0.5 * PASCAL_PER_MMHG,
      LV: -2 * PASCAL_PER_MMHG,
      SA: 83 * PASCAL_PER_MMHG,
      SV: 0,
      RA: -1.7 * PASCAL_PER_MMHG,
      RV: -3.5 * PASCAL_PER_MMHG,
      PA: 7 * PASCAL_PER_MMHG,
      PV: 1.5 * PASCAL_PER_MMHG,
    } as const;
    for (const [id, expected] of Object.entries(expectedShape)) {
      expect(shape[id as keyof typeof expectedShape]).toBeCloseTo(expected, 12);
    }
    expect(Object.fromEntries(VASCULAR_IDS.map((id) => [
      id,
      fixed.vascularComplianceParametersByCompartment[id].complianceM3PerPa,
    ]))).toEqual({
      SA: 11.25e-9,
      SV: 750e-9,
      PA: 30e-9,
      PV: 112.5e-9,
    });
    expect(Object.values(fixed.vascularComplianceParametersByCompartment)
      .every((parameters) => parameters.externalPressurePa === 0)).toBe(true);
    expect(PRE_A_OPERATING_POINT_HEMODYNAMIC_CONSTRUCTION_PRIOR_V2
      .referenceConstruction).toMatchObject({
      referenceCardiacPhase:
        "atrial-activation-free-end-diastasis-pre-a-not-post-a-end-diastole",
      postAEndDiastolicPressureUsedAsPreATarget: false,
      meanLeftAtrialPressureUsedAsPreAPointTarget: false,
    });
  });

  it("constructs V0 once, replays every vascular target, and exposes no TBV-dependent V0 builder", () => {
    const prior = PRE_A_OPERATING_POINT_HEMODYNAMIC_CONSTRUCTION_PRIOR_V2;
    const fixed = getPreAOperatingPointFixedHemodynamicInitializerInputsV2();
    const reference = prior.referenceConstruction;

    for (const id of VASCULAR_IDS) {
      const parameters = fixed.vascularComplianceParametersByCompartment[id];
      const referencePressurePa = reference.absoluteReferencePressurePaByCompartment[id];
      const expectedV0 = reference.vascularTargetBloodVolumeM3ByCompartment[id]
        - parameters.complianceM3PerPa
          * (referencePressurePa - parameters.externalPressurePa);
      const replayedTarget = parameters.unstressedVolumeM3
        + parameters.complianceM3PerPa
          * (referencePressurePa - parameters.externalPressurePa);

      expect(parameters.unstressedVolumeM3).toBeCloseTo(expectedV0, 15);
      expect(replayedTarget)
        .toBeCloseTo(reference.vascularTargetBloodVolumeM3ByCompartment[id], 15);
    }

    expect(getPreAOperatingPointFixedHemodynamicInitializerInputsV2()).toBe(fixed);
    expect(reference.runtimeTbvChangeMayRecomputeV0).toBe(false);
    expect(prior.audit.fixedV0IndependentOfRuntimeTbv).toBe(true);
    expect(prior.audit.maximumAbsoluteV0ConstructionResidualM3).toBeLessThan(1e-15);
    expect(prior.audit.maximumAbsoluteReferenceVolumeReplayResidualM3).toBeLessThan(1e-15);
    expect(prior.audit.maximumAbsolutePressureShapeResidualPa).toBeLessThan(1e-9);
    expect(prior.audit.minimumFixedVascularUnstressedVolumeM3).toBeGreaterThan(0);
  });

  it("labels the non-V0 volume only as broad Magder context, never as an identified stressed-volume target", () => {
    const { audit, evidenceBoundary } =
      PRE_A_OPERATING_POINT_HEMODYNAMIC_CONSTRUCTION_PRIOR_V2;

    expect(audit.fixedVascularUnstressedVolumeSumM3)
      .toBeCloseTo(4.189583613133669e-3, 12);
    expect(audit.bloodVolumeOutsideFixedVascularV0AtReferenceM3)
      .toBeCloseTo(1.410416386866331e-3, 12);
    expect(audit.bloodVolumeOutsideFixedVascularV0Fraction)
      .toBeCloseTo(0.25186006908327335, 12);
    expect(audit.magderUsedForQuantitativeIdentification).toBe(false);
    expect(evidenceBoundary.magderUsedOnlyAsBroadConsistencyContext).toBe(true);
  });

  it("fails closed on undeclared fields and a V0 that no longer follows the fixed construction", () => {
    const prior = PRE_A_OPERATING_POINT_HEMODYNAMIC_CONSTRUCTION_PRIOR_V2;
    expect(() => assertPreAOperatingPointHemodynamicConstructionPriorV2({
      ...prior,
      hiddenPreloadGain: 1,
    })).toThrow(/must contain exactly/);

    const tampered = {
      ...prior,
      fixedInitializerInputs: {
        ...prior.fixedInitializerInputs,
        vascularComplianceParametersByCompartment: {
          ...prior.fixedInitializerInputs.vascularComplianceParametersByCompartment,
          SA: {
            ...prior.fixedInitializerInputs.vascularComplianceParametersByCompartment.SA,
            unstressedVolumeM3:
              prior.fixedInitializerInputs.vascularComplianceParametersByCompartment.SA
                .unstressedVolumeM3 + 1e-6,
          },
        },
      },
    };
    expect(() => assertPreAOperatingPointHemodynamicConstructionPriorV2(tampered))
      .toThrow(/fixed vascular/);
  });
});
