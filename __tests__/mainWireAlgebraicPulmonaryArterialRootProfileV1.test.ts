import { describe, expect, it } from "vitest";

import {
  MAIN_WIRE_ALGEBRAIC_PULMONARY_ARTERIAL_ROOT_PROFILE_V1,
  createMainWireAlgebraicPulmonaryArterialRootResistanceResearchProfileV1,
  validateMainWireAlgebraicPulmonaryArterialRootProfileV1,
} from "@/engine/core/MainWireAlgebraicPulmonaryArterialRootProfileV1";
import {
  vascularPvLawFromNodeV1,
  vascularTransmuralPressureFromPhysicalVolumeV1,
} from "@/engine/core/circulationGraphKernelV1";
import { buildNodes } from "@/engine/core/topology";

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

  it("redistributes existing PA/PArt compliance while preserving anchor pressure", () => {
    const profile =
      createMainWireAlgebraicPulmonaryArterialRootResistanceResearchProfileV1(
        0.024,
        0,
        {
          proximalPaStiffnessMultiplier: 0.5,
          distalPArtStiffnessMultiplier: 2.5,
        },
      );
    const baseRuntime = Object.freeze({
      venousTone: 0.15,
      arterialStiffness: 1.3,
    });
    const candidateRuntime = Object.freeze({
      ...baseRuntime,
      algebraicPulmonaryArterialRootProfile: profile,
    });

    for (const [nodeId, expectedComplianceScale] of [
      ["PA", 2],
      ["PArt", 0.4],
    ] as const) {
      const node = buildNodes().find((candidate) => candidate.name === nodeId)!;
      const baseLaw = vascularPvLawFromNodeV1(node, baseRuntime);
      const candidateLaw = vascularPvLawFromNodeV1(node, candidateRuntime);
      expect(baseLaw.kind).toBe("arterial");
      expect(candidateLaw.kind).toBe("arterial");
      if (baseLaw.kind !== "arterial" || candidateLaw.kind !== "arterial") {
        throw new Error("test requires arterial PA/PArt laws");
      }
      expect(candidateLaw.VsEff / baseLaw.VsEff).toBeCloseTo(
        expectedComplianceScale,
        12,
      );
      expect(vascularTransmuralPressureFromPhysicalVolumeV1(
        node,
        node.x0,
        baseRuntime,
        "fixed-32-iterations",
      )).toBeCloseTo(vascularTransmuralPressureFromPhysicalVolumeV1(
        node,
        node.x0,
        candidateRuntime,
        "fixed-32-iterations",
      ), 12);
    }
    expect(profile.sourcePulmonaryArterialComplianceDistributionPreserved)
      .toBe(false);
    expect(validateMainWireAlgebraicPulmonaryArterialRootProfileV1(profile))
      .toEqual([]);
  });

  it("rejects pulmonary compliance multipliers outside the research range", () => {
    expect(() =>
      createMainWireAlgebraicPulmonaryArterialRootResistanceResearchProfileV1(
        0.024,
        0,
        {
          proximalPaStiffnessMultiplier: 0.1,
          distalPArtStiffnessMultiplier: 1,
        },
      ),
    ).toThrow(/within \[0.25, 4\]/);
  });
});
