import { describe, expect, it } from "vitest";

import { runNoAvpdFourChamberHillTriSegBenchV1 } from "@/engine/mechanics2/benches/NoAvpdFourChamberHillTriSegBenchV1";
import { prepareHillCeSeeSlsParamsV1 } from "@/engine/mechanics2/constitutive/HillCeSeeSlsV1";
import {
  DEFAULT_NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_PARAMS_V1,
  type NoAvpdFourChamberHillTriSegParamsV1,
  initialNoAvpdFourChamberHillTriSegStateV1,
  stepNoAvpdFourChamberHillTriSegV1,
} from "@/engine/mechanics2/subsystems/NoAvpdFourChamberHillTriSegV1";

describe("NoAvpd dynamic thin-filament cold initialization", () => {
  it("initializes the opt-in LA availability state at equilibrium and accepts the first step", () => {
    const params = dynamicLaParams();

    const initial = initialNoAvpdFourChamberHillTriSegStateV1(params);
    expect(initial.walls.leftAtrium.thinFilamentAvailability01).toBeTypeOf(
      "number",
    );
    expect(
      initial.walls.leftAtrium.thinFilamentAvailability01,
    ).toBeGreaterThanOrEqual(0);
    expect(
      initial.walls.leftAtrium.thinFilamentAvailability01,
    ).toBeLessThanOrEqual(1);

    const output = stepNoAvpdFourChamberHillTriSegV1(initial, 0.005, params);
    expect(output.accepted).toBe(true);
    expect(output.failureReasons).toEqual([]);
    expect(output.state.walls.leftAtrium.thinFilamentAvailability01).toBeTypeOf(
      "number",
    );
  });

  it("preserves the legacy algebraic LA state shape", () => {
    const initial = initialNoAvpdFourChamberHillTriSegStateV1();
    expect(
      Object.prototype.hasOwnProperty.call(
        initial.walls.leftAtrium,
        "thinFilamentAvailability01",
      ),
    ).toBe(false);
  });

  it("includes the optional availability state in exact and sampled cycle drift", () => {
    const result = runNoAvpdFourChamberHillTriSegBenchV1({
      beats: 2,
      dtSec: 0.005,
      sampleEverySteps: 4,
      params: dynamicLaParams(),
    });

    expect(result.status, result.failureReason ?? undefined).toBe("pass");
    const exact =
      result.reportOnlyExactBeatBoundaryReturnMap.oneBeatMapResidual;
    expect(exact).not.toBeNull();
    expect(
      exact?.rawDriftByNativeUnit.wallThinFilamentAvailability01.componentCount,
    ).toBe(1);
    expect(exact?.normalizedFullStateDrift.componentCount).toBe(47);

    const sampled = result.reportOnlyCycleConvergence;
    expect(sampled).not.toBeNull();
    expect(
      sampled?.dynamicStateDrift.walls.leftAtrium.thinFilamentAvailability01,
    ).toBeTypeOf("number");
    expect(
      sampled?.maxAbsWallThinFilamentAvailabilityDrift01,
    ).toBeGreaterThanOrEqual(0);
  });
});

function dynamicLaParams(): NoAvpdFourChamberHillTriSegParamsV1 {
  const baseline = DEFAULT_NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_PARAMS_V1;
  const source = baseline.atria.left.material;
  const material = prepareHillCeSeeSlsParamsV1({
    ...source,
    parameterSetId: `${source.parameterSetId}::la-thin-filament-lag-25ms-test`,
    calciumTroponinActivation: {
      ...source.calciumTroponinActivation,
      parameterSetId: `${source.calciumTroponinActivation.parameterSetId}::la-thin-filament-lag-25ms-test`,
      thinFilamentDynamics: {
        mode: "one-state-normalized-lag",
        timeConstantSec: 0.025,
      },
    },
  });
  return {
    ...baseline,
    atria: {
      ...baseline.atria,
      left: { ...baseline.atria.left, material },
    },
  };
}
