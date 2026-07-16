import { describe, expect, it } from "vitest";

import {
  evaluateLand2017ContinuousOutput,
  land2017ParameterSetHashInput,
  stableHash,
} from "@/engine/myocardium/myofilament/land2017";
import {
  LAND2017_HUMAN_ATRIAL_EFFECTIVE_PARAMETER_SET_V1,
  LAND2017_HUMAN_ATRIAL_LEWALLE_FORCE_SCALE_PARAMETER_SET_V1,
  LAND2017_HUMAN_ATRIAL_LEWALLE_FORCE_SCALE_PRIOR_V1,
} from "@/engine/myocardium/myofilament/land2017/atrialPrior";

const SATURATED_ATRIAL_STEADY_STATE = Float64Array.from([
  0.9992609466038918,
  0.0052439943959882995,
  0.37303350210150443,
  0.24868900140100295,
  0,
  0,
]);

describe("Land atrial Lewalle human-force-scale prior V1", () => {
  it("changes only Tref from the atrial kinetic prior", () => {
    const kinetics = LAND2017_HUMAN_ATRIAL_EFFECTIVE_PARAMETER_SET_V1;
    const scaled = LAND2017_HUMAN_ATRIAL_LEWALLE_FORCE_SCALE_PARAMETER_SET_V1;
    for (const name of Object.keys(kinetics.values) as Array<keyof typeof kinetics.values>) {
      if (name !== "Tref") expect(scaled.values[name]).toBe(kinetics.values[name]);
    }
    expect(scaled.values.Tref).toBeCloseTo(11_661.151010550097, 10);
    expect(scaled.derived).toEqual(kinetics.derived);
    expect(scaled.parameterSetStableHash)
      .toBe(stableHash(land2017ParameterSetHashInput(scaled)));
  });

  it("replays the declared 11.6 kPa pCa 4.5 force anchor", () => {
    const params = LAND2017_HUMAN_ATRIAL_LEWALLE_FORCE_SCALE_PARAMETER_SET_V1;
    const output = evaluateLand2017ContinuousOutput(
      SATURATED_ATRIAL_STEADY_STATE,
      {
        freeCalciumUM: LAND2017_HUMAN_ATRIAL_LEWALLE_FORCE_SCALE_PRIOR_V1
          .sourceFreeCalciumUM,
        fiberEngineeringStrain: 0,
        fiberEngineeringStrainRatePerSec: 0,
      },
      params,
    );
    expect(output.health.finite).toBe(true);
    expect(output.sourceActiveFiberStressPa).toBeCloseTo(11_600, 8);
    expect(LAND2017_HUMAN_ATRIAL_LEWALLE_FORCE_SCALE_PRIOR_V1
      .pvLoopShapeFitIncluded).toBe(false);
    expect(LAND2017_HUMAN_ATRIAL_LEWALLE_FORCE_SCALE_PRIOR_V1
      .rightAtriumEvidenceBoundary).toMatch(/extrapolated-to-RA/);
  });
});
