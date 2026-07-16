import { describe, expect, it } from "vitest";
import {
  KLOTZ_2006_NORMALIZED_EDPVR_TARGET_SI_V1,
  MYOCARDIAL_DENSITY_PRIOR_SI_V1,
  POOLED_CMR_SEX_NEUTRAL_BSA_1P9_ANCHOR_SI_V1,
  POOLED_CMR_VENTRICULAR_INDEX_REFERENCE_SI_V1,
  TRISEG_2009_INITIALIZATION_LV_SEPTAL_PARTITION_PRIOR_V1,
  TRISEG_2009_ORIGINAL_INITIALIZATION_SEED_SI_V1,
  VENTRICULAR_ANATOMY_EDPVR_EVIDENCE_SOURCES_V1,
  createPooledCmrVentricularBsaAnchorV1,
  evaluateKlotz2006NormalizedEdpvrTargetV1,
  invertKlotz2006SinglePointEdpvrV1,
  partitionCmrVentricularMassToTriSegWallsV1,
  type KlotzSinglePointEdpvrInversionV1,
} from "@/engine/myocardium/fourChamberV1/anatomy/ventricularAnatomyEdpvrTargetsV1";

describe("four-chamber ventricular anatomy and EDPVR target layer v1", () => {
  it("keeps the pooled CMR population anchor separate from the original TriSeg initialization seed", () => {
    const sources = VENTRICULAR_ANATOMY_EDPVR_EVIDENCE_SOURCES_V1;
    expect(sources.pooledCmr.evidenceClass).toBe("pooled-adult-cmr-meta-analysis");
    expect(sources.triSegInitialization.evidenceClass)
      .toBe("primary-model-initialization-seed");
    expect(sources.pooledCmr.sourceId).not.toBe(sources.triSegInitialization.sourceId);

    const cmr = POOLED_CMR_SEX_NEUTRAL_BSA_1P9_ANCHOR_SI_V1;
    expect(cmr.evidenceStatus)
      .toBe("population-anchor-not-unloaded-geometry-or-wall-parameter-set");
    expect(cmr.bodySurfaceAreaM2).toBe(1.9);
    expect(cmr.leftVentricle.massOwnership)
      .toBe("cmr-lv-mass-includes-interventricular-septum");
    expect(cmr.rightVentricle.triSegMassOwnership)
      .toBe("rv-free-wall-with-septum-owned-by-cmr-lv-mass");

    expectIntervalClose(cmr.leftVentricle.endDiastolicVolumeM3, {
      lower: 100.7e-6,
      center: 144.4e-6,
      upper: 188.1e-6,
    });
    expectIntervalClose(cmr.leftVentricle.endSystolicVolumeM3, {
      lower: 28.5e-6,
      center: 53.2e-6,
      upper: 76e-6,
    });
    expectIntervalClose(cmr.leftVentricle.myocardialMassIncludingSeptumKg, {
      lower: 0.0741,
      center: 0.1083,
      upper: 0.1425,
    });
    expectIntervalClose(cmr.rightVentricle.endDiastolicVolumeM3, {
      lower: 108.3e-6,
      center: 155.8e-6,
      upper: 205.2e-6,
    });
    expectIntervalClose(cmr.rightVentricle.myocardialMassKg, {
      lower: 0.0247,
      center: 0.038,
      upper: 0.0513,
    });
    expectIntervalClose(cmr.leftVentricle.ejectionFraction, {
      lower: 0.53,
      center: 0.64,
      upper: 0.74,
    });
    expectIntervalClose(cmr.rightVentricle.ejectionFraction, {
      lower: 0.47,
      center: 0.58,
      upper: 0.69,
    });

    const seed = TRISEG_2009_ORIGINAL_INITIALIZATION_SEED_SI_V1;
    expect(seed.evidenceStatus)
      .toBe("published-model-initialization-seed-not-cmr-population-anchor");
    expect(seed.walls.LVFW.sourceWallLabel).toBe("LW");
    expect(seed.walls.LVFW.wallMaterialVolumeM3).toBeCloseTo(75e-6, 16);
    expect(seed.walls.LVFW.referenceMidwallAreaM2).toBeCloseTo(80e-4, 16);
    expect(seed.walls.SEP.sourceWallLabel).toBe("SW");
    expect(seed.walls.SEP.wallMaterialVolumeM3).toBeCloseTo(40e-6, 16);
    expect(seed.walls.SEP.referenceMidwallAreaM2).toBeCloseTo(45e-4, 16);
    expect(seed.walls.RVFW.sourceWallLabel).toBe("RW");
    expect(seed.walls.RVFW.wallMaterialVolumeM3).toBeCloseTo(30e-6, 16);
    expect(seed.walls.RVFW.referenceMidwallAreaM2).toBeCloseTo(100e-4, 16);
    expect(seed.claimBoundary).toMatchObject({
      normalHumanPopulationReference: false,
      unloadedGeometryForBsa1p9Anchor: false,
      eligibleAsExplicitInitializationOrPartitionPrior: true,
    });
    expect(Object.isFrozen(cmr.leftVentricle.endDiastolicVolumeM3)).toBe(true);
    expect(Object.isFrozen(seed.walls.LVFW)).toBe(true);
    expect(Object.isFrozen(POOLED_CMR_VENTRICULAR_INDEX_REFERENCE_SI_V1)).toBe(true);
  });

  it("scales the pooled indexed CMR reference linearly with positive finite BSA", () => {
    const atTwoSquareMeters = createPooledCmrVentricularBsaAnchorV1(2);
    expect(atTwoSquareMeters.leftVentricle.endDiastolicVolumeM3.center)
      .toBeCloseTo(152e-6, 16);
    expect(atTwoSquareMeters.leftVentricle.myocardialMassIncludingSeptumKg.center)
      .toBeCloseTo(0.114, 16);
    expect(atTwoSquareMeters.rightVentricle.strokeVolumeM3.center)
      .toBeCloseTo(94e-6, 16);
    expect(atTwoSquareMeters.leftVentricle.ejectionFraction)
      .toBe(POOLED_CMR_VENTRICULAR_INDEX_REFERENCE_SI_V1.leftVentricle.ejectionFraction);
    expect(Object.isFrozen(atTwoSquareMeters.rightVentricle)).toBe(true);

    for (const invalidBsa of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() => createPooledCmrVentricularBsaAnchorV1(invalidBsa))
        .toThrow(/bodySurfaceAreaM2 must be positive and finite/);
    }
  });

  it("partitions inclusive CMR LV mass exactly once before converting mass to TriSeg wall volume", () => {
    const cmr = POOLED_CMR_SEX_NEUTRAL_BSA_1P9_ANCHOR_SI_V1;
    const prior = TRISEG_2009_INITIALIZATION_LV_SEPTAL_PARTITION_PRIOR_V1;
    expect(prior.septalFractionOfCmrLeftVentricularMass)
      .toBeCloseTo(40 / (75 + 40), 16);
    expect(prior.evidenceStatus)
      .toBe("model-seed-ratio-not-population-septal-mass-fraction");

    const partition = partitionCmrVentricularMassToTriSegWallsV1({
      leftVentricularMassIncludingSeptumKg:
        cmr.leftVentricle.myocardialMassIncludingSeptumKg.center,
      rightVentricularFreeWallMassKg: cmr.rightVentricle.myocardialMassKg.center,
      septalFractionOfLeftVentricularMass:
        prior.septalFractionOfCmrLeftVentricularMass,
      partitionPriorId: prior.partitionPriorId,
    });

    expect(partition.cmrMassOwnership).toEqual({
      leftVentricularInput: "includes-interventricular-septum",
      rightVentricularInput: "rv-free-wall-with-septum-excluded",
    });
    expect(partition.wallMassKg.LVFW + partition.wallMassKg.SEP)
      .toBeCloseTo(cmr.leftVentricle.myocardialMassIncludingSeptumKg.center, 16);
    expect(partition.audit.inputTotalCmrVentricularMassKg)
      .toBeCloseTo(0.1083 + 0.038, 16);
    expect(partition.audit.triSegWallMassSumKg)
      .toBeCloseTo(partition.audit.inputTotalCmrVentricularMassKg, 16);
    expect(partition.audit.absoluteMassClosureErrorKg).toBeLessThanOrEqual(Number.EPSILON);
    expect(partition.audit.septumCountedExactlyOnce).toBe(true);
    expect(partition.audit.triSegWallMassSumKg)
      .toBeLessThan(0.1083 + partition.wallMassKg.SEP + 0.038);

    expect(partition.myocardialDensityKgPerM3)
      .toBe(MYOCARDIAL_DENSITY_PRIOR_SI_V1.densityKgPerM3);
    for (const wallId of ["LVFW", "SEP", "RVFW"] as const) {
      expect(partition.wallMaterialVolumeM3[wallId]
        * MYOCARDIAL_DENSITY_PRIOR_SI_V1.densityKgPerM3)
        .toBeCloseTo(partition.wallMassKg[wallId], 16);
    }
    expect(partition.wallMaterialVolumeM3).toMatchObject({
      LVFW: 0.00006707543664065403,
      SEP: 0.000035773566208348813,
      RVFW: 0.00003608736942070275,
    });
    expect(Object.isFrozen(partition.wallMassKg)).toBe(true);
    expect(Object.isFrozen(partition.audit)).toBe(true);
  });

  it("rejects ambiguous, double-count-prone, or nonphysical CMR mass partition inputs", () => {
    const valid = {
      leftVentricularMassIncludingSeptumKg: 0.1083,
      rightVentricularFreeWallMassKg: 0.038,
      septalFractionOfLeftVentricularMass: 40 / 115,
      partitionPriorId: "explicit-test-prior",
    };
    const evaluate = (overrides: Partial<typeof valid>) =>
      partitionCmrVentricularMassToTriSegWallsV1({ ...valid, ...overrides });

    expect(() => evaluate({ leftVentricularMassIncludingSeptumKg: 0 }))
      .toThrow(/leftVentricularMassIncludingSeptumKg must be positive and finite/);
    expect(() => evaluate({ rightVentricularFreeWallMassKg: Number.NaN }))
      .toThrow(/rightVentricularFreeWallMassKg must be positive and finite/);
    expect(() => evaluate({ septalFractionOfLeftVentricularMass: 0 }))
      .toThrow(/strictly between 0 and 1/);
    expect(() => evaluate({ septalFractionOfLeftVentricularMass: 1 }))
      .toThrow(/strictly between 0 and 1/);
    expect(() => evaluate({ partitionPriorId: " " }))
      .toThrow(/partitionPriorId must be a non-empty string/);
    expect(() => partitionCmrVentricularMassToTriSegWallsV1({
      ...valid,
      separatelyAddedSeptalMassKg: 0.03,
    } as never)).toThrow(/must contain exactly/);
  });

  it("inverts a single SI pressure-volume point and exactly recovers it on the normalized Klotz target", () => {
    const target = KLOTZ_2006_NORMALIZED_EDPVR_TARGET_SI_V1;
    const measuredVolumeM3 = 144.4e-6;
    const measuredPressurePa = 8 * (target.sourceV30PressurePa / 30);
    const inversion = invertKlotz2006SinglePointEdpvrV1({
      measuredEndDiastolicVolumeM3: measuredVolumeM3,
      measuredEndDiastolicPressurePa: measuredPressurePa,
    });

    expect(inversion.estimatedZeroPressureVolumeM3)
      .toBeCloseTo(79.7088e-6, 15);
    expect(inversion.estimatedV30NormalizationVolumeM3)
      .toBeCloseTo(181.32421323749687e-6, 15);
    expect(inversion.normalizedMeasuredVolume)
      .toBeCloseTo(0.636627829764397, 15);
    expect(inversion.normalizationVolumeSpanM3)
      .toBeCloseTo(
        inversion.estimatedV30NormalizationVolumeM3
        - inversion.estimatedZeroPressureVolumeM3,
        16,
      );

    const recovered = evaluateKlotz2006NormalizedEdpvrTargetV1(
      measuredVolumeM3,
      inversion,
    );
    expect(recovered.pressurePa).toBeCloseTo(measuredPressurePa, 12);
    expect(recovered.normalizedVolume).toBeCloseTo(inversion.normalizedMeasuredVolume, 15);
    expect(recovered.tangentPaPerM3).toBeGreaterThan(0);

    const zero = evaluateKlotz2006NormalizedEdpvrTargetV1(
      inversion.estimatedZeroPressureVolumeM3,
      inversion,
    );
    expect(zero).toMatchObject({
      normalizedVolume: 0,
      pressurePa: 0,
      tangentPaPerM3: 0,
      withinV30NormalizationVolumeScale: true,
    });

    const atV30Scale = evaluateKlotz2006NormalizedEdpvrTargetV1(
      inversion.estimatedV30NormalizationVolumeM3,
      inversion,
    );
    expect(atV30Scale.normalizedVolume).toBeCloseTo(1, 15);
    expect(atV30Scale.pressurePa).toBeCloseTo(target.normalizedPressureScalePa, 12);
    expect(atV30Scale.pressurePa).not.toBeCloseTo(target.sourceV30PressurePa, 5);
    expect(atV30Scale.withinV30NormalizationVolumeScale).toBe(true);
    expect(target.sourceFormulaCaveat).toContain("28.2 rather than exactly 30 mmHg");
    expect(Object.isFrozen(inversion)).toBe(true);
    expect(Object.isFrozen(recovered)).toBe(true);
  });

  it("has a finite nonnegative monotone Klotz target and an analytic tangent matching finite differences", () => {
    const target = KLOTZ_2006_NORMALIZED_EDPVR_TARGET_SI_V1;
    const inversion = invertKlotz2006SinglePointEdpvrV1({
      measuredEndDiastolicVolumeM3: 144.4e-6,
      measuredEndDiastolicPressurePa: 8 * (target.sourceV30PressurePa / 30),
    });
    const samples = [0, 0.25, 0.5, 0.75, 1, 1.25].map((normalizedVolume) =>
      evaluateKlotz2006NormalizedEdpvrTargetV1(
        inversion.estimatedZeroPressureVolumeM3
          + normalizedVolume * inversion.normalizationVolumeSpanM3,
        inversion,
      ));
    expect(samples.every((sample) =>
      Number.isFinite(sample.pressurePa)
      && sample.pressurePa >= 0
      && Number.isFinite(sample.tangentPaPerM3)
      && sample.tangentPaPerM3 >= 0)).toBe(true);
    for (let index = 1; index < samples.length; index += 1) {
      expect(samples[index]!.pressurePa).toBeGreaterThan(samples[index - 1]!.pressurePa);
    }
    expect(samples.at(-1)?.withinV30NormalizationVolumeScale).toBe(false);

    const centerVolumeM3 = inversion.estimatedZeroPressureVolumeM3
      + 0.6 * inversion.normalizationVolumeSpanM3;
    const stepM3 = 1e-8 * inversion.normalizationVolumeSpanM3;
    const lower = evaluateKlotz2006NormalizedEdpvrTargetV1(
      centerVolumeM3 - stepM3,
      inversion,
    );
    const upper = evaluateKlotz2006NormalizedEdpvrTargetV1(
      centerVolumeM3 + stepM3,
      inversion,
    );
    const analytic = evaluateKlotz2006NormalizedEdpvrTargetV1(centerVolumeM3, inversion);
    const finiteDifferencePaPerM3 = (upper.pressurePa - lower.pressurePa) / (2 * stepM3);
    expect(relativeError(analytic.tangentPaPerM3, finiteDifferencePaPerM3))
      .toBeLessThan(2e-8);
  });

  it("rejects nonphysical Klotz measurements, unsupported pressure anchors, and forged inversions", () => {
    const target = KLOTZ_2006_NORMALIZED_EDPVR_TARGET_SI_V1;
    const pressure8MmHgPa = 8 * (target.sourceV30PressurePa / 30);
    const validInput = {
      measuredEndDiastolicVolumeM3: 144.4e-6,
      measuredEndDiastolicPressurePa: pressure8MmHgPa,
    };
    const invert = (overrides: Partial<typeof validInput>) =>
      invertKlotz2006SinglePointEdpvrV1({ ...validInput, ...overrides });

    for (const invalidVolume of [0, -1e-6, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() => invert({ measuredEndDiastolicVolumeM3: invalidVolume }))
        .toThrow(/measuredEndDiastolicVolumeM3 must be positive and finite/);
    }
    for (const invalidPressure of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() => invert({ measuredEndDiastolicPressurePa: invalidPressure }))
        .toThrow(/measuredEndDiastolicPressurePa must be positive and finite/);
    }
    expect(() => invert({ measuredEndDiastolicPressurePa: target.sourceV30PressurePa }))
      .toThrow(/must be below the 30 mmHg/);
    expect(() => invert({ measuredEndDiastolicPressurePa: 31 / 30 * target.sourceV30PressurePa }))
      .toThrow(/must be below the 30 mmHg/);
    expect(() => invertKlotz2006SinglePointEdpvrV1({
      ...validInput,
      pressureWasActuallyMmHg: true,
    } as never)).toThrow(/must contain exactly/);

    const inversion = invertKlotz2006SinglePointEdpvrV1(validInput);
    expect(() => evaluateKlotz2006NormalizedEdpvrTargetV1(
      inversion.estimatedZeroPressureVolumeM3 - 1e-12,
      inversion,
    )).toThrow(/must be at least the Klotz estimated zero-pressure volume/);
    expect(() => evaluateKlotz2006NormalizedEdpvrTargetV1(Number.NaN, inversion))
      .toThrow(/cavityVolumeM3 must be finite/);
    expect(() => evaluateKlotz2006NormalizedEdpvrTargetV1(
      validInput.measuredEndDiastolicVolumeM3,
      structuredClone(inversion) as KlotzSinglePointEdpvrInversionV1,
    )).toThrow(/must be produced by invertKlotz2006SinglePointEdpvrV1/);
  });
});

function relativeError(left: number, right: number): number {
  return Math.abs(left - right) / Math.max(1, Math.abs(left), Math.abs(right));
}

function expectIntervalClose(
  actual: Readonly<{ lower: number; center: number; upper: number }>,
  expected: Readonly<{ lower: number; center: number; upper: number }>,
): void {
  expect(actual.lower).toBeCloseTo(expected.lower, 15);
  expect(actual.center).toBeCloseTo(expected.center, 15);
  expect(actual.upper).toBeCloseTo(expected.upper, 15);
}
