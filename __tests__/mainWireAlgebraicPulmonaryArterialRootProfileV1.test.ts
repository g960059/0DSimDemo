import { describe, expect, it } from "vitest";

import {
  MAIN_WIRE_ALGEBRAIC_PULMONARY_ARTERIAL_ROOT_PROFILE_V1,
  validateMainWireAlgebraicPulmonaryArterialRootProfileV1,
} from "@/engine/core/MainWireAlgebraicPulmonaryArterialRootProfileV1";

describe("fixed algebraic pulmonary arterial-root profile", () => {
  it("removes only pulmonary root momentum while preserving source losses", () => {
    expect(MAIN_WIRE_ALGEBRAIC_PULMONARY_ARTERIAL_ROOT_PROFILE_V1)
      .toMatchObject({
        pulmonaryRootEdgeId: "PA_PArt",
        inertanceMmHgSec2PerMl: 0,
        sourceResistanceAndQuadraticLossPreserved: true,
        systemicRootMomentumUnchanged: true,
        parameterSearchOrFitting: false,
        physiologicalValidationClaimed: false,
      });
    expect(validateMainWireAlgebraicPulmonaryArterialRootProfileV1(
      MAIN_WIRE_ALGEBRAIC_PULMONARY_ARTERIAL_ROOT_PROFILE_V1,
    )).toEqual([]);
  });

  it("rejects altered and additional fields", () => {
    expect(validateMainWireAlgebraicPulmonaryArterialRootProfileV1({
      ...MAIN_WIRE_ALGEBRAIC_PULMONARY_ARTERIAL_ROOT_PROFILE_V1,
      inertanceMmHgSec2PerMl: 0.001,
      extra: true,
    } as unknown as typeof MAIN_WIRE_ALGEBRAIC_PULMONARY_ARTERIAL_ROOT_PROFILE_V1))
      .toEqual(expect.arrayContaining([
        "algebraic pulmonary arterial-root profile fields differ",
        "algebraic pulmonary arterial-root profile flow law differs",
        "algebraic pulmonary arterial-root profile accepted-flow role differs",
      ]));
  });
});
