import { describe, expect, it } from "vitest";

import {
  MAIN_WIRE_ALGEBRAIC_PROXIMAL_ARTERIAL_ROOTS_PROFILE_V1,
  validateMainWireAlgebraicProximalArterialRootsProfileV1,
} from "@/engine/core/MainWireAlgebraicProximalArterialRootsProfileV1";
import {
  createMainWireIntegratedModelAlgebraicProximalRootsFixtureV1,
  createMainWireIntegratedModelSelectedAorticOutflowFixtureV1,
  runMainWireIntegratedModelRegularSinusAllOffCycleV3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3";

describe("fixed algebraic proximal arterial roots profile V1", () => {
  it("owns one exact fixed profile without a fitted parameter axis", () => {
    const profile =
      MAIN_WIRE_ALGEBRAIC_PROXIMAL_ARTERIAL_ROOTS_PROFILE_V1;
    expect(validateMainWireAlgebraicProximalArterialRootsProfileV1(profile))
      .toEqual([]);
    expect(profile.aorticRootEdgeId).toBe("Ao_SA");
    expect(profile.pulmonaryRootEdgeId).toBe("PA_PArt");
    expect(profile.inertanceMmHgSec2PerMl).toBe(0);
    expect(profile.sourceResistanceAndQuadraticLossPreserved).toBe(true);
    expect(profile.parameterSearchOrFitting).toBe(false);
    expect(profile.physiologicalValidationClaimed).toBe(false);

    expect(validateMainWireAlgebraicProximalArterialRootsProfileV1({
      ...profile,
      inertanceMmHgSec2PerMl: 1,
    } as never)).toContain(
      "algebraic proximal arterial roots profile inertanceMmHgSec2PerMl differs",
    );
  });

  it("keeps Standard66 absent and ignores prior root-flow records in the successor trajectory", () => {
    const standard66 =
      createMainWireIntegratedModelSelectedAorticOutflowFixtureV1();
    const successor =
      createMainWireIntegratedModelAlgebraicProximalRootsFixtureV1();
    expect(
      "algebraicProximalArterialRootsProfile" in standard66.runtime.vascular,
    ).toBe(false);
    expect(successor.runtime.vascular.algebraicProximalArterialRootsProfile)
      .toBe(MAIN_WIRE_ALGEBRAIC_PROXIMAL_ARTERIAL_ROOTS_PROFILE_V1);
    const cycleFixture = successor as unknown as Parameters<
      typeof runMainWireIntegratedModelRegularSinusAllOffCycleV3
    >[0];

    const initial = successor.cold.acceptedState;
    const perturbed = Object.freeze({
      ...initial,
      coronary: Object.freeze({
        ...initial.coronary,
        circulation: Object.freeze({
          ...initial.coronary.circulation,
          dynamicEdgeFlowsMlPerSec: Object.freeze({
            Ao_SA: -731,
            PA_PArt: 947,
          }),
        }),
      }),
    });
    const reference = runMainWireIntegratedModelRegularSinusAllOffCycleV3(
      cycleFixture,
      initial,
      1,
      0.002,
    );
    const replay = runMainWireIntegratedModelRegularSinusAllOffCycleV3(
      cycleFixture,
      perturbed,
      1,
      0.002,
    );
    expect(replay.traceSamples).toEqual(reference.traceSamples);
    expect(replay.terminalAcceptedState)
      .toEqual(reference.terminalAcceptedState);
  }, 30_000);
});
