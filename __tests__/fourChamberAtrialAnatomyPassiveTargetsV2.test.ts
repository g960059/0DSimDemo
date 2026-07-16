import { describe, expect, it } from "vitest";
import {
  ATRIAL_ANATOMY_EVIDENCE_SOURCES_V2,
  ATRIAL_WALL_MASS_CONSTRUCTION_REFERENCE_SI_V2,
  LI_2017_ATRIAL_INDEXED_PHASIC_VOLUME_REFERENCE_SI_V2,
  assertNormalAdultAtrialAnatomyAnchorV2,
  buildNormalAdultAtrialAnatomyAnchorV2,
  createNormalAdultAtrialAnatomyCenterInputV2,
  createNormalAdultAtrialAnatomyInputFromSensitivityCornersV2,
  type AtrialSensitivityCornerV2,
} from "@/engine/myocardium/fourChamberV1/anatomy/atrialAnatomyPassiveTargetsV2";

describe("four-chamber atrial anatomy and passive target layer v2", () => {
  it("records distinct CMR, LA-mass, total-mass, and density evidence with narrow claims", () => {
    const sources = ATRIAL_ANATOMY_EVIDENCE_SOURCES_V2;
    expect(sources.phasicCmr).toMatchObject({
      evidenceClass: "primary-healthy-adult-ssfp-cmr",
      doi: "10.1038/s41598-017-03377-6",
    });
    expect(sources.leftAtrialMass).toMatchObject({
      evidenceClass: "primary-autopsy-la-mass-with-normal-echo-volume",
      doi: "10.1016/j.carpath.2020.107265",
    });
    expect(sources.totalAtrialMass).toMatchObject({
      evidenceClass: "primary-forensic-autopsy-total-atrial-mass",
      doi: null,
      url: "https://hdl.handle.net/20.500.12512/83288",
    });
    expect(sources.myocardialDensity.evidenceClass)
      .toBe("myocardial-composition-density-prior");
    expect(new Set(Object.values(sources).map((source) => source.sourceId)).size)
      .toBe(4);

    const volumes = LI_2017_ATRIAL_INDEXED_PHASIC_VOLUME_REFERENCE_SI_V2;
    expect(volumes.measurement.volumeMethod).toBe("contiguous-short-axis-Simpson");
    expectIntervalClose(volumes.indexedCavityVolumeM3PerM2ByAtrium.LA.maximum,
      { lower: 25.4e-6, center: 42.2e-6, upper: 59.1e-6 });
    expectIntervalClose(
      volumes.indexedCavityVolumeM3PerM2ByAtrium.LA.preAtrialContraction,
      { lower: 15.4e-6, center: 30.5e-6, upper: 45.6e-6 },
    );
    expectIntervalClose(volumes.indexedCavityVolumeM3PerM2ByAtrium.LA.minimum,
      { lower: 9.8e-6, center: 18.8e-6, upper: 27.8e-6 });
    expectIntervalClose(volumes.indexedCavityVolumeM3PerM2ByAtrium.RA.maximum,
      { lower: 29.6e-6, center: 51.6e-6, upper: 73.6e-6 });
    expectIntervalClose(
      volumes.indexedCavityVolumeM3PerM2ByAtrium.RA.preAtrialContraction,
      { lower: 20.2e-6, center: 38.2e-6, upper: 56.2e-6 },
    );
    expectIntervalClose(volumes.indexedCavityVolumeM3PerM2ByAtrium.RA.minimum,
      { lower: 9.5e-6, center: 24.9e-6, upper: 40.4e-6 });
    expect(volumes.claimBoundary).toMatchObject({
      pressureDataIncluded: false,
      passiveMaterialParametersIncluded: false,
      unloadedReferenceVolumeIncluded: false,
      pvLoopMorphologyIncluded: false,
    });
    expect(Object.isFrozen(volumes.indexedCavityVolumeM3PerM2ByAtrium.LA.maximum))
      .toBe(true);
  });

  it("constructs the BSA-scaled center anatomy with exact total-minus-LA mass closure", () => {
    const input = createNormalAdultAtrialAnatomyCenterInputV2({
      bodySurfaceAreaM2: 1.9,
    });
    const anchor = buildNormalAdultAtrialAnatomyAnchorV2(input);

    expectPhasicClose(anchor.phasicCavityVolumeM3ByAtrium.LA, {
      maximum: 80.18e-6,
      preAtrialContraction: 57.95e-6,
      minimum: 35.72e-6,
    });
    expectPhasicClose(anchor.phasicCavityVolumeM3ByAtrium.RA, {
      maximum: 98.04e-6,
      preAtrialContraction: 72.58e-6,
      minimum: 47.31e-6,
    });
    expect(anchor.wallMassKgByAtrium.LA).toBeCloseTo(27.36e-3, 15);
    expect(anchor.massConstruction.totalAtrialMassAtRequestedBsaKg)
      .toBeCloseTo(52e-3, 15);
    expect(anchor.wallMassKgByAtrium.RA).toBeCloseTo(24.64e-3, 15);
    expect(anchor.wallReferenceMaterialVolumeM3ByAtrium.LA)
      .toBeCloseTo(25.982905982905983e-6, 15);
    expect(anchor.wallReferenceMaterialVolumeM3ByAtrium.RA)
      .toBeCloseTo(23.399810066476736e-6, 15);
    expect(anchor.geometryReferenceConvention.referenceCavityVolumeM3ByAtrium)
      .toEqual({
        LA: anchor.phasicCavityVolumeM3ByAtrium.LA.minimum,
        RA: anchor.phasicCavityVolumeM3ByAtrium.RA.minimum,
      });
    expect(anchor.geometryReferenceConvention).toMatchObject({
      stressFreeMeasurementClaimed: false,
      unloadedMeasurementClaimed: false,
    });
    expect(anchor.massConstruction.absoluteMassClosureErrorKg).toBeLessThan(1e-16);
    expect(anchor.audit.pass).toBe(true);
    expect(anchor.claimBoundary).toMatchObject({
      rightAtrialMassDirectlyMeasured: false,
      minimumCavityVolumeIsStressFreeMeasurement: false,
      pvLoopPathUsed: false,
      patientSpecific: false,
      physiologicalValidationClaimed: false,
    });
    expect(assertNormalAdultAtrialAnatomyAnchorV2(anchor)).toBe(anchor);
    expect(Object.isFrozen(anchor)).toBe(true);
    expect(Object.isFrozen(anchor.input.leftAtrialPhasicVolumeIndexM3PerM2)).toBe(true);
  });

  it("keeps all declared low/high volume and mass sensitivity corners finite and closed", () => {
    const corners: AtrialSensitivityCornerV2[] = ["lower", "upper"];
    for (const phasicVolumeCorner of corners) {
      for (const leftAtrialWallMassCorner of corners) {
        for (const totalAtrialMassCorner of corners) {
          const input = createNormalAdultAtrialAnatomyInputFromSensitivityCornersV2({
            bodySurfaceAreaM2: 1.9,
            phasicVolumeCorner,
            leftAtrialWallMassCorner,
            totalAtrialMassCorner,
          });
          const anchor = buildNormalAdultAtrialAnatomyAnchorV2(input);
          for (const atriumId of ["LA", "RA"] as const) {
            const volumes = anchor.phasicCavityVolumeM3ByAtrium[atriumId];
            expect(volumes.maximum).toBeGreaterThan(volumes.preAtrialContraction);
            expect(volumes.preAtrialContraction).toBeGreaterThan(volumes.minimum);
            expect(anchor.wallMassKgByAtrium[atriumId]).toBeGreaterThan(0);
            expect(anchor.wallReferenceMaterialVolumeM3ByAtrium[atriumId])
              .toBeGreaterThan(0);
          }
          expect(anchor.massConstruction.absoluteMassClosureErrorKg).toBeLessThan(1e-15);
          expect(anchor.audit.pass).toBe(true);
        }
      }
    }
  });

  it("scales extensive cavity volumes and wall masses linearly with BSA", () => {
    const small = buildNormalAdultAtrialAnatomyAnchorV2(
      createNormalAdultAtrialAnatomyCenterInputV2({ bodySurfaceAreaM2: 1.5 }),
    );
    const large = buildNormalAdultAtrialAnatomyAnchorV2(
      createNormalAdultAtrialAnatomyCenterInputV2({ bodySurfaceAreaM2: 2.1 }),
    );
    const expectedRatio = 2.1 / 1.5;
    expect(large.phasicCavityVolumeM3ByAtrium.LA.maximum
      / small.phasicCavityVolumeM3ByAtrium.LA.maximum).toBeCloseTo(expectedRatio, 15);
    expect(large.phasicCavityVolumeM3ByAtrium.RA.minimum
      / small.phasicCavityVolumeM3ByAtrium.RA.minimum).toBeCloseTo(expectedRatio, 15);
    expect(large.wallMassKgByAtrium.LA / small.wallMassKgByAtrium.LA)
      .toBeCloseTo(expectedRatio, 15);
    expect(large.wallMassKgByAtrium.RA / small.wallMassKgByAtrium.RA)
      .toBeCloseTo(expectedRatio, 15);
  });

  it("fails closed on forged artifacts, undeclared keys, out-of-envelope values, and invalid phasic order", () => {
    const center = createNormalAdultAtrialAnatomyCenterInputV2({
      bodySurfaceAreaM2: 1.9,
    });
    const anchor = buildNormalAdultAtrialAnatomyAnchorV2(center);
    expect(() => assertNormalAdultAtrialAnatomyAnchorV2({ ...anchor }))
      .toThrow(/live canonical artifact/);
    expect(() => buildNormalAdultAtrialAnatomyAnchorV2({
      ...center,
      undeclared: true,
    } as never)).toThrow(/must contain exactly/);
    expect(() => buildNormalAdultAtrialAnatomyAnchorV2({
      ...center,
      leftAtrialWallMassIndexKgPerM2:
        ATRIAL_WALL_MASS_CONSTRUCTION_REFERENCE_SI_V2
          .leftAtrialWallMassIndexKgPerM2.upper * 1.01,
    })).toThrow(/declared normal-adult sensitivity interval/);
    expect(() => buildNormalAdultAtrialAnatomyAnchorV2({
      ...center,
      leftAtrialPhasicVolumeIndexM3PerM2: {
        ...center.leftAtrialPhasicVolumeIndexM3PerM2,
        maximum: LI_2017_ATRIAL_INDEXED_PHASIC_VOLUME_REFERENCE_SI_V2
          .indexedCavityVolumeM3PerM2ByAtrium.LA.maximum.lower,
      },
    })).toThrow(/maximum > preAtrialContraction > minimum/);
    expect(() => createNormalAdultAtrialAnatomyCenterInputV2({
      bodySurfaceAreaM2: 0,
    })).toThrow(/bodySurfaceAreaM2 must be positive and finite/);
  });
});

function expectIntervalClose(
  actual: Readonly<{ lower: number; center: number; upper: number }>,
  expected: Readonly<{ lower: number; center: number; upper: number }>,
): void {
  expect(actual.lower).toBeCloseTo(expected.lower, 15);
  expect(actual.center).toBeCloseTo(expected.center, 15);
  expect(actual.upper).toBeCloseTo(expected.upper, 15);
}

function expectPhasicClose(
  actual: Readonly<{ maximum: number; preAtrialContraction: number; minimum: number }>,
  expected: Readonly<{ maximum: number; preAtrialContraction: number; minimum: number }>,
): void {
  expect(actual.maximum).toBeCloseTo(expected.maximum, 15);
  expect(actual.preAtrialContraction).toBeCloseTo(expected.preAtrialContraction, 15);
  expect(actual.minimum).toBeCloseTo(expected.minimum, 15);
}
