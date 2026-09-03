import { describe, expect, it } from "vitest";

import {
  MAIN_WIRE_ALGEBRAIC_PULMONARY_ARTERIAL_ROOT_PROFILE_V1,
  validateMainWireAlgebraicPulmonaryArterialRootProfileV1,
} from "@/engine/core/MainWireAlgebraicPulmonaryArterialRootProfileV1";
import {
  createMainWireIntegratedModelAlgebraicPulmonaryRootFixtureV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelAlgebraicPulmonaryRootFixtureV1";
import {
  runMainWireIntegratedModelRegularSinusAllOffCycleV3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3";

describe("fixed algebraic pulmonary arterial-root profile", () => {
  it("removes only pulmonary-root momentum memory", () => {
    expect(MAIN_WIRE_ALGEBRAIC_PULMONARY_ARTERIAL_ROOT_PROFILE_V1)
      .toEqual({
        profileId: "main-wire-algebraic-pulmonary-arterial-root-profile-v1",
        pulmonaryRootEdgeId: "PA_PArt",
        flowLaw: "same-candidate-algebraic-linear-quadratic",
        inertanceMmHgSec2PerMl: 0,
        sourceResistanceAndQuadraticLossPreserved: true,
        sourcePulmonaryArterialComplianceDistributionPreserved: true,
        systemicAndAorticBranchesUnchanged: true,
        acceptedRootFlowRecordRole:
          "exact-accepted-algebraic-flow-readback-not-continuation-memory",
        parameterSearchOrFitting: false,
        physiologicalValidationClaimed: false,
      });
    expect(validateMainWireAlgebraicPulmonaryArterialRootProfileV1(
      MAIN_WIRE_ALGEBRAIC_PULMONARY_ARTERIAL_ROOT_PROFILE_V1,
    )).toEqual([]);
  });

  it("rejects mutation and extra fields", () => {
    expect(validateMainWireAlgebraicPulmonaryArterialRootProfileV1({
      ...MAIN_WIRE_ALGEBRAIC_PULMONARY_ARTERIAL_ROOT_PROFILE_V1,
      inertanceMmHgSec2PerMl: 0.001,
      extra: true,
    } as unknown as typeof MAIN_WIRE_ALGEBRAIC_PULMONARY_ARTERIAL_ROOT_PROFILE_V1))
      .toEqual(expect.arrayContaining([
        "algebraic pulmonary arterial-root profile fields differ",
        "algebraic pulmonary arterial-root profile inertanceMmHgSec2PerMl differs",
      ]));
  });

  it("ignores only the accepted PA_PArt flow memory in the successor trajectory", () => {
    const fixture = createMainWireIntegratedModelAlgebraicPulmonaryRootFixtureV1();
    const cycleFixture = fixture as unknown as Parameters<
      typeof runMainWireIntegratedModelRegularSinusAllOffCycleV3
    >[0];
    const initial = fixture.cold.acceptedState;
    const withDynamicFlows = (
      Ao_SA: number,
      PA_PArt: number,
    ) => Object.freeze({
      ...initial,
      coronary: Object.freeze({
        ...initial.coronary,
        circulation: Object.freeze({
          ...initial.coronary.circulation,
          dynamicEdgeFlowsMlPerSec: Object.freeze({ Ao_SA, PA_PArt }),
        }),
      }),
    });
    const reference = runMainWireIntegratedModelRegularSinusAllOffCycleV3(
      cycleFixture,
      initial,
      1,
      0.002,
    );
    const pulmonaryReplay =
      runMainWireIntegratedModelRegularSinusAllOffCycleV3(
        cycleFixture,
        withDynamicFlows(
          initial.coronary.circulation.dynamicEdgeFlowsMlPerSec.Ao_SA,
          947,
        ),
        1,
        0.002,
      );
    expect(pulmonaryReplay.traceSamples).toEqual(reference.traceSamples);
    expect(pulmonaryReplay.terminalAcceptedState)
      .toEqual(reference.terminalAcceptedState);

    const aorticReplay = runMainWireIntegratedModelRegularSinusAllOffCycleV3(
      cycleFixture,
      withDynamicFlows(
        -731,
        initial.coronary.circulation.dynamicEdgeFlowsMlPerSec.PA_PArt,
      ),
      1,
      0.002,
    );
    expect(aorticReplay.traceSamples).not.toEqual(reference.traceSamples);
  }, 30_000);
});
