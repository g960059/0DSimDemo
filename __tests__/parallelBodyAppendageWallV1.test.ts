import { describe, expect, it } from "vitest";
import {
  commitParallelBodyAppendageWallTrialV1,
  initialParallelBodyAppendageWallStateV1,
  trialParallelBodyAppendageWallAtPartitionV1,
  trialParallelBodyAppendageWallV1,
  type ParallelBodyAppendageWallParamsV1,
} from "@/engine/mechanics2/atrial/ParallelBodyAppendageWallV1";
import {
  createDefaultNoAvpdFivePatchLandTriSegParamsV1,
} from "@/engine/mechanics2/subsystems/NoAvpdFivePatchLandTriSegV1";

function fixture(
  minimumAppendageFraction01 = 0.03,
  maximumAppendageFraction01 = 0.35,
): ParallelBodyAppendageWallParamsV1 {
  const source = createDefaultNoAvpdFivePatchLandTriSegParamsV1("all-patch")
    .atria.left;
  return Object.freeze({
    body: Object.freeze({
      geometry: Object.freeze({
        ...source.geometry,
        wallVolumeMl: 17,
        referenceCavityVolumeMl: 51,
      }),
      material: source.material,
    }),
    appendage: Object.freeze({
      geometry: Object.freeze({
        ...source.geometry,
        wallVolumeMl: 3,
        referenceCavityVolumeMl: 9,
      }),
      material: source.material,
    }),
    initialAppendageFraction01:
      minimumAppendageFraction01 < 0.15 &&
      0.15 < maximumAppendageFraction01
        ? 0.15
        : 0.5 *
          (minimumAppendageFraction01 + maximumAppendageFraction01),
    minimumAppendageFraction01,
    maximumAppendageFraction01,
    solver: Object.freeze({
      scanIntervals: 16,
      maxBracketedIterations: 48,
      pressureToleranceMmHg: 1e-7,
      volumeToleranceMl: 1e-9,
      monotonicityToleranceMmHg: 1e-9,
    }),
  });
}

describe("ParallelBodyAppendageWallV1", () => {
  it("solves one shared-pressure partition without adding blood volume", () => {
    const params = fixture();
    const state = initialParallelBodyAppendageWallStateV1(
      65,
      0.1,
      params,
    );
    const trial = trialParallelBodyAppendageWallV1(
      state,
      { dtSec: 0.005, totalVolumeMl: 65, freeCalciumUm: 0.1 },
      params,
    );

    expect(trial.valid).toBe(true);
    expect(trial.pressureBracketCount).toBe(1);
    expect(trial.residualMonotone).toBe(true);
    expect(trial.body!.volumeMl + trial.appendage!.volumeMl).toBeCloseTo(
      65,
      12,
    );
    expect(trial.appendage!.volumeMl / 65).toBeCloseTo(0.15, 7);
    expect(Math.abs(trial.pressureMismatchMmHg!)).toBeLessThanOrEqual(1e-7);
    expect(commitParallelBodyAppendageWallTrialV1(trial)).toBe(
      trial.nextState,
    );
  });

  it("satisfies the constrained virtual-work identity", () => {
    const params = fixture();
    const state = initialParallelBodyAppendageWallStateV1(
      65,
      0.1,
      params,
    );
    const trial = trialParallelBodyAppendageWallV1(
      state,
      { dtSec: 0.005, totalVolumeMl: 66, freeCalciumUm: 0.1 },
      params,
    );
    expect(trial.valid).toBe(true);
    const dTotal = 0.4;
    const dPartition = -0.12;
    const dBody = dTotal - dPartition;
    const regionWork =
      trial.body!.pressureMmHg * dBody +
      trial.appendage!.pressureMmHg * dPartition;
    const reducedWork = trial.commonPressureMmHg! * dTotal;
    expect(regionWork).toBeCloseTo(reducedWork, 7);
  });

  it("exposes a pure partition trial for the monolithic global residual", () => {
    const params = fixture();
    const state = initialParallelBodyAppendageWallStateV1(
      65,
      0.1,
      params,
    );
    const trial = trialParallelBodyAppendageWallAtPartitionV1(
      state,
      {
        dtSec: 0.005,
        totalVolumeMl: 65,
        appendageVolumeMl: state.appendageVolumeMl,
        freeCalciumUm: 0.1,
      },
      params,
    );
    expect(trial.valid).toBe(true);
    expect(trial.body!.volumeMl + trial.appendage!.volumeMl).toBe(65);
    expect(trial.pressureMismatchMmHg).toBeCloseTo(0, 8);
    expect(trial.nextState!.appendageVolumeMl).toBe(
      state.appendageVolumeMl,
    );
  });

  it("is invariant to exchanging the two named branches", () => {
    const params = fixture();
    const state = initialParallelBodyAppendageWallStateV1(
      65,
      0.1,
      params,
    );
    const forward = trialParallelBodyAppendageWallV1(
      state,
      { dtSec: 0.005, totalVolumeMl: 65, freeCalciumUm: 0.1 },
      params,
    );
    const swappedParams: ParallelBodyAppendageWallParamsV1 = Object.freeze({
      ...params,
      body: params.appendage,
      appendage: params.body,
      initialAppendageFraction01: 0.85,
      minimumAppendageFraction01: 0.65,
      maximumAppendageFraction01: 0.97,
    });
    const swappedState = Object.freeze({
      ...state,
      body: state.appendage,
      appendage: state.body,
    });
    const swapped = trialParallelBodyAppendageWallV1(
      swappedState,
      { dtSec: 0.005, totalVolumeMl: 65, freeCalciumUm: 0.1 },
      swappedParams,
    );
    expect(swapped.valid).toBe(true);
    expect(swapped.commonPressureMmHg).toBeCloseTo(
      forward.commonPressureMmHg!,
      10,
    );
    expect(swapped.appendage!.volumeMl).toBeCloseTo(
      forward.body!.volumeMl,
      8,
    );
  });

  it("fails closed when the physical partition bracket excludes equilibrium", () => {
    const params = fixture(0.2, 0.3);
    const state = initialParallelBodyAppendageWallStateV1(
      65,
      0.1,
      params,
    );
    const trial = trialParallelBodyAppendageWallV1(
      state,
      { dtSec: 0.005, totalVolumeMl: 65, freeCalciumUm: 0.1 },
      params,
    );
    expect(trial.valid).toBe(false);
    expect(trial.nextState).toBeNull();
    expect(trial.issues).toContain("no-pressure-equilibrium-bracket");
    expect(() => commitParallelBodyAppendageWallTrialV1(trial)).toThrow(
      /invalid parallel body-appendage trial/,
    );
  });
});
