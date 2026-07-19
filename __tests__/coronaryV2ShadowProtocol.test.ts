import { describe, expect, it } from "vitest";

import {
  buildCoronaryV2ShorteningImpReference,
  fingerprintCoronaryV2ShadowBoundarySource,
  resolveCoronaryV2ShadowBoundary,
  snapshotCoronaryV2ShadowBoundary,
  validateCoronaryV2R1ReferenceNumerics,
  type CoronaryV2R1ReferenceNumericalReport,
  type CoronaryV2ShadowSourceSample,
} from "@/tools/coronary/coronaryV2ShadowProtocol";

const PHASE = Object.freeze({
  mitralClosurePhase01: 0.9,
  aorticOpeningPhase01: 0.02,
  aorticClosurePhase01: 0.25,
});

describe("coronary V2 fixed-boundary shadow protocol", () => {
  it("reports the exact CEP/SIP boundary used by the hydraulic solver", () => {
    const mvc = sample(0.9, 0);
    const shortened = sample(0.2, -0.1);
    const reference = buildCoronaryV2ShorteningImpReference(
      { samples: [mvc, shortened] },
      PHASE,
    );
    const source = resolveCoronaryV2ShadowBoundary(
      shortened,
      "source-cep-land-active",
      null,
    );
    const cep = resolveCoronaryV2ShadowBoundary(
      shortened,
      "cep-only-control",
      null,
    );
    const sip = resolveCoronaryV2ShadowBoundary(
      shortened,
      "cep-shortening-induced",
      reference,
    );

    expect(source.intramyocardialPressureMmHgByTerritoryLayer.LAD)
      .toEqual({ subepicardial: 91, subendocardial: 99 });
    for (const territoryId of ["LAD", "LCx", "RCA"] as const) {
      for (const layerId of ["subepicardial", "subendocardial"] as const) {
        expect(
          sip.intramyocardialPressureMmHgByTerritoryLayer[territoryId][layerId]
          - cep.intramyocardialPressureMmHgByTerritoryLayer[territoryId][layerId],
        ).toBeCloseTo(15, 12);
      }
    }
    const snapshot = snapshotCoronaryV2ShadowBoundary(sip);
    expect(snapshot).toEqual({
      Ao: sip.absoluteAorticPressureMmHg,
      RA: sip.absoluteRightAtrialPressureMmHg,
      perivascularExternal: sip.perivascularExternalPressureMmHg,
      intramyocardialByTerritoryLayer:
        sip.intramyocardialPressureMmHgByTerritoryLayer,
    });
    expect(snapshot.intramyocardialByTerritoryLayer.LAD.subendocardial)
      .not.toBe(99);
  });

  it("binds the fingerprint to mechanics as well as pressure", () => {
    const source = report([sample(0.9, 0), sample(0.2, -0.1)]);
    const altered = report([
      sample(0.9, 0),
      {
        ...sample(0.2, -0.1),
        mechanics: {
          ...sample(0.2, -0.1).mechanics,
          effectiveFiberLogStrainByWall: {
            ...sample(0.2, -0.1).mechanics.effectiveFiberLogStrainByWall,
            LVFW: -0.11,
          },
        },
      },
    ]);
    const shorteningReference = buildCoronaryV2ShorteningImpReference(
      source,
      PHASE,
    );
    const protocol = Object.freeze({
      phaseDefinition: PHASE,
      impMechanism: "cep-shortening-induced" as const,
      shorteningReference,
    });
    expect(fingerprintCoronaryV2ShadowBoundarySource(altered, protocol))
      .not.toBe(fingerprintCoronaryV2ShadowBoundarySource(source, protocol));
    expect(fingerprintCoronaryV2ShadowBoundarySource(source, {
      ...protocol,
      phaseDefinition: { ...PHASE, mitralClosurePhase01: 0.88 },
    })).not.toBe(fingerprintCoronaryV2ShadowBoundarySource(source, protocol));
  });

  it("rejects a nonperiodic or numerically invalid R1 reference", () => {
    const valid = numericalReference();
    expect(() => validateCoronaryV2R1ReferenceNumerics(valid)).not.toThrow();
    expect(() => validateCoronaryV2R1ReferenceNumerics({
      ...valid,
      finalSummary: {
        ...valid.finalSummary,
        closure: {
          ...valid.finalSummary.closure,
          maximumRelative01: 2e-5,
        },
      },
    })).toThrow(/volume periodicity/);
    expect(() => validateCoronaryV2R1ReferenceNumerics({
      ...valid,
      runHealth: {
        ...valid.runHealth,
        allPassiveEdgesNonnegativePower: false,
      },
    })).toThrow(/passive-edge/);
    expect(() => validateCoronaryV2R1ReferenceNumerics(
      numericalReference({ achievedFlow: 0.98 }),
    )).toThrow(/mean-Qm target/);
    expect(() => validateCoronaryV2R1ReferenceNumerics(
      numericalReference({ boundedAt: "minimum" }),
    )).toThrow(/interior resistance reserve/);
  });
});

function sample(
  cyclePhase01: number,
  fiberLogStrain: number,
): CoronaryV2ShadowSourceSample {
  const layers = (epicardial: number, endocardial: number) => Object.freeze({
    subepicardial: epicardial,
    subendocardial: endocardial,
  });
  return Object.freeze({
    cyclePhase01,
    pressureMmHg: Object.freeze({
      Ao: 95,
      LV: 110,
      RV: 25,
      RA: 5,
      perivascularExternal: 2,
      intramyocardialByTerritoryLayer: Object.freeze({
        LAD: layers(91, 99),
        LCx: layers(81, 89),
        RCA: layers(31, 39),
      }),
    }),
    mechanics: Object.freeze({
      chamberTransmuralPressureMmHg: Object.freeze({ LV: 108, RV: 23 }),
      effectiveFiberLogStrainByWall: Object.freeze({
        LVFW: fiberLogStrain,
        SEP: fiberLogStrain,
        RVFW: fiberLogStrain,
      }),
      landActiveFiberStressPaByWall: Object.freeze({
        LVFW: 100_000,
        SEP: 80_000,
        RVFW: 40_000,
      }),
    }),
  });
}

function report(samples: readonly CoronaryV2ShadowSourceSample[]) {
  return Object.freeze({
    schema: "source-report-v1",
    configuration: Object.freeze({ dtSec: 0.002, cycleLengthSec: 1 }),
    samples,
  });
}

function numericalReference(options: Readonly<{
  achievedFlow?: number;
  boundedAt?: "minimum" | "maximum" | "interior";
}> = {}): CoronaryV2R1ReferenceNumericalReport {
  const layer = () => Object.freeze({
    achievedMeanTissueFlowMlPerSec: options.achievedFlow ?? 1,
    demandTargetFlowMlPerSec: 1,
    boundedAt: options.boundedAt ?? "interior",
  });
  const territory = () => Object.freeze({
    subepicardial: layer(),
    subendocardial: layer(),
  });
  const layerStep = Object.freeze({
    LAD: territory(),
    LCx: territory(),
    RCA: territory(),
  });
  return Object.freeze({
    completed: true,
    finalSummary: Object.freeze({
      closure: Object.freeze({
        maximumAbsoluteMl: 1e-9,
        maximumRelative01: 1e-9,
      }),
      summary: Object.freeze({
        maximumSolverResidualInfinityNormMl: 1e-9,
      }),
      toneStep: Object.freeze({
        layerStepByTerritoryLayer: layerStep,
      }),
    }),
    runHealth: Object.freeze({
      maximumAbsoluteLedgerResidualMl: 1e-9,
      minimumEdgeDissipatedPowerMmHgMlPerSec: 0,
      allPassiveEdgesNonnegativePower: true,
    }),
  });
}
