import { describe, expect, it } from "vitest";

import {
  MAIN_WIRE_ALGEBRAIC_PULMONARY_ARTERIAL_ROOT_PROFILE_V1,
  validateMainWireAlgebraicPulmonaryArterialRootProfileV1,
} from "@/engine/core/MainWireAlgebraicPulmonaryArterialRootProfileV1";

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
});
