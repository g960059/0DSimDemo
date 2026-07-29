import { describe, expect, it } from "vitest";

import {
  NORMAL_ADULT_CORONARY_SHORTENING_IMP_GAIN_PRIOR_V2,
  evaluateMainWireCoronaryShorteningImpV2,
  resolveMainWireCoronaryBoundaryV2,
} from "@/engine/coronary/mainWireCoronaryBoundaryV2";

describe("main-wire coronary V2 mechanics boundary", () => {
  it("rejects an unknown IMP mechanism instead of silently falling back", () => {
    expect(() => resolveMainWireCoronaryBoundaryV2(
      boundarySample(-0.10),
      "unknown-mechanism" as never,
      null,
    )).toThrow(/unsupported coronary IMP mechanism/);
  });

  it("freezes the accepted normal SIP calibration without scenario renormalization", () => {
    const prior = NORMAL_ADULT_CORONARY_SHORTENING_IMP_GAIN_PRIOR_V2;
    for (const territoryId of ["LAD", "LCx", "RCA"] as const) {
      expect(
        prior.pressureGainMmHgPerUnitShorteningByTerritory[territoryId]
        * prior.normalReferenceCalibration
          .peakWeightedFractionalShorteningByTerritory[territoryId],
      ).toBeCloseTo(15, 14);
    }

    const reference = Object.freeze({
      referenceFiberLogStrainByWall: walls(0),
    });
    const weak = evaluateMainWireCoronaryShorteningImpV2(
      walls(-0.05),
      reference,
    );
    const strong = evaluateMainWireCoronaryShorteningImpV2(
      walls(-0.10),
      reference,
    );
    for (const territoryId of ["LAD", "LCx", "RCA"] as const) {
      expect(weak[territoryId]).toBeGreaterThan(0);
      expect(strong[territoryId]).toBeGreaterThan(weak[territoryId]);
      expect(strong[territoryId]).toBeLessThan(15);
    }
  });

  it("resolves source, CEP, and fixed-gain SIP through one pure engine API", () => {
    const sample = boundarySample(-0.10);
    const reference = Object.freeze({
      referenceFiberLogStrainByWall: walls(0),
    });
    const source = resolveMainWireCoronaryBoundaryV2(
      sample,
      "source-cep-land-active",
      null,
    );
    const cep = resolveMainWireCoronaryBoundaryV2(
      sample,
      "cep-only-control",
      null,
    );
    const sip = resolveMainWireCoronaryBoundaryV2(
      sample,
      "cep-shortening-induced",
      reference,
    );
    const shorteningPressure = evaluateMainWireCoronaryShorteningImpV2(
      sample.effectiveFiberLogStrainByWall,
      reference,
    );

    expect(source.intramyocardialPressureMmHgByTerritoryLayer.LAD)
      .toEqual({ subepicardial: 91, subendocardial: 99 });
    expect(source.perivascularExternalPressureMmHg).toBe(2);
    for (const territoryId of ["LAD", "LCx", "RCA"] as const) {
      for (const layerId of ["subepicardial", "subendocardial"] as const) {
        expect(
          sip.intramyocardialPressureMmHgByTerritoryLayer[territoryId][layerId]
          - cep.intramyocardialPressureMmHgByTerritoryLayer[territoryId][layerId],
        ).toBeCloseTo(shorteningPressure[territoryId], 13);
      }
    }
  });

  it("requires the historical source IMP only for its source mechanism", () => {
    const { sourceIntramyocardialPressureMmHgByTerritoryLayer: _, ...sample } =
      boundarySample(-0.10);
    const reference = Object.freeze({
      referenceFiberLogStrainByWall: walls(0),
    });

    expect(() => resolveMainWireCoronaryBoundaryV2(
      sample,
      "source-cep-land-active",
      null,
    )).toThrow(/requires source intramyocardial pressure/);
    expect(() => resolveMainWireCoronaryBoundaryV2(
      sample,
      "cep-shortening-induced",
      reference,
    )).not.toThrow();
  });

  it("validates all same-candidate mechanics fields in every mechanism", () => {
    const sample = boundarySample(-0.10);
    expect(() => resolveMainWireCoronaryBoundaryV2({
      ...sample,
      mechanicsInput: {
        ...sample.mechanicsInput,
        externalPressureMmHg: Number.NaN,
      },
    }, "source-cep-land-active", null)).toThrow(/externalPressureMmHg/);
    expect(() => resolveMainWireCoronaryBoundaryV2({
      ...sample,
      mechanicsInput: {
        ...sample.mechanicsInput,
        chamberTransmuralPressureMmHg: {
          ...sample.mechanicsInput.chamberTransmuralPressureMmHg,
          LV: Number.POSITIVE_INFINITY,
        },
      },
    }, "source-cep-land-active", null)).toThrow(/chamberTransmuralPressureMmHg.LV/);
    expect(() => resolveMainWireCoronaryBoundaryV2({
      ...sample,
      mechanicsInput: {
        ...sample.mechanicsInput,
        landActiveFiberStressPaByWall: {
          ...sample.mechanicsInput.landActiveFiberStressPaByWall,
          SEP: -1,
        },
      },
    }, "source-cep-land-active", null)).toThrow(/SEP Land active stress/);
  });
});

function walls(value: number) {
  return Object.freeze({ LVFW: value, SEP: value, RVFW: value });
}

function boundarySample(fiberLogStrain: number) {
  const layers = (subepicardial: number, subendocardial: number) =>
    Object.freeze({ subepicardial, subendocardial });
  return Object.freeze({
    absoluteAorticPressureMmHg: 95,
    absoluteRightAtrialPressureMmHg: 5,
    sourceIntramyocardialPressureMmHgByTerritoryLayer: Object.freeze({
      LAD: layers(91, 99),
      LCx: layers(81, 89),
      RCA: layers(31, 39),
    }),
    mechanicsInput: Object.freeze({
      externalPressureMmHg: 2,
      chamberTransmuralPressureMmHg: Object.freeze({ LV: 108, RV: 23 }),
      landActiveFiberStressPaByWall: Object.freeze({
        LVFW: 100_000,
        SEP: 80_000,
        RVFW: 40_000,
      }),
    }),
    effectiveFiberLogStrainByWall: walls(fiberLogStrain),
  });
}
