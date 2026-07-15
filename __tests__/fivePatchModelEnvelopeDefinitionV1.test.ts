import { describe, expect, it } from "vitest";

import {
  FIVE_PATCH_MODEL_ENVELOPE_ARM_DESIGNS_V1,
  FIVE_PATCH_MODEL_ENVELOPE_DT_REFINEMENT_INDICES_V1,
  FIVE_PATCH_MODEL_ENVELOPE_PARAMETER_DIMENSIONS_V1,
  FIVE_PATCH_MODEL_ENVELOPE_PROTOCOL_MATRIX_V1,
  FIVE_PATCH_MODEL_ENVELOPE_SAMPLE_COUNT_V1,
  FIVE_PATCH_MODEL_ENVELOPE_STRESS_VALIDATION_INDICES_V1,
  FIVE_PATCH_MODEL_ENVELOPE_UNIT_DESIGN_V1,
  fivePatchEnvelopeCandidateIdV1,
  fivePatchEnvelopeParametersAtIndexV1,
  mapFivePatchEnvelopeUnitPointV1,
} from "@/engine/mechanics2/envelope/FivePatchModelEnvelopeDefinitionV1";

describe("FivePatchModelEnvelopeDefinitionV1", () => {
  it("shares one 64-point unit design across all nested SLS arms", () => {
    expect(FIVE_PATCH_MODEL_ENVELOPE_SAMPLE_COUNT_V1).toBe(64);
    expect(FIVE_PATCH_MODEL_ENVELOPE_ARM_DESIGNS_V1.map((arm) =>
      arm.slsTopology
    )).toEqual(["off", "atrial-only", "all-patch"]);
    for (const arm of FIVE_PATCH_MODEL_ENVELOPE_ARM_DESIGNS_V1) {
      expect(arm.unitPoints).toBe(
        FIVE_PATCH_MODEL_ENVELOPE_UNIT_DESIGN_V1.points,
      );
    }
    expect(FIVE_PATCH_MODEL_ENVELOPE_ARM_DESIGNS_V1[0]!.slsEnabledPatches)
      .toEqual([]);
    expect(FIVE_PATCH_MODEL_ENVELOPE_ARM_DESIGNS_V1[1]!.slsEnabledPatches)
      .toEqual(["leftAtrium", "rightAtrium"]);
    expect(FIVE_PATCH_MODEL_ENVELOPE_ARM_DESIGNS_V1[2]!.slsEnabledPatches)
      .toEqual([
        "leftAtrium",
        "rightAtrium",
        "leftFreeWall",
        "septum",
        "rightFreeWall",
      ]);
  });

  it("uses shared atrial and ventricular priors rather than wall-specific micro-rates", () => {
    expect(FIVE_PATCH_MODEL_ENVELOPE_PARAMETER_DIMENSIONS_V1).toHaveLength(16);
    for (const dimension of FIVE_PATCH_MODEL_ENVELOPE_PARAMETER_DIMENSIONS_V1) {
      expect(dimension.sharedByPatches).toEqual(
        dimension.ownerGroup === "atrial"
          ? ["leftAtrium", "rightAtrium"]
          : ["leftFreeWall", "septum", "rightFreeWall"],
      );
      expect(dimension.minimum).toBeLessThan(dimension.maximum);
      if (dimension.transform === "log") {
        expect(dimension.minimum).toBeGreaterThan(0);
      }
    }
    expect(
      FIVE_PATCH_MODEL_ENVELOPE_PARAMETER_DIMENSIONS_V1.some(
        (dimension) => /leftAtrium|rightAtrium|septum/.test(dimension.dimensionId),
      ),
    ).toBe(false);
  });

  it("makes inactive SLS dimensions explicit for nested structural controls", () => {
    const [off, atrialOnly, allPatch] =
      FIVE_PATCH_MODEL_ENVELOPE_ARM_DESIGNS_V1;
    expect(off!.inactiveSlsDimensionIds).toEqual([
      "atrialSlsModulusOverEquilibriumTangent",
      "atrialSlsRelaxationTimeSec",
      "ventricularSlsModulusOverEquilibriumTangent",
      "ventricularSlsRelaxationTimeSec",
    ]);
    expect(atrialOnly!.inactiveSlsDimensionIds).toEqual([
      "ventricularSlsModulusOverEquilibriumTangent",
      "ventricularSlsRelaxationTimeSec",
    ]);
    expect(allPatch!.inactiveSlsDimensionIds).toEqual([]);
  });

  it("maps every candidate into its committed prior bounds", () => {
    for (let index = 0; index < FIVE_PATCH_MODEL_ENVELOPE_SAMPLE_COUNT_V1; index += 1) {
      const mapped = fivePatchEnvelopeParametersAtIndexV1(index);
      for (const dimension of FIVE_PATCH_MODEL_ENVELOPE_PARAMETER_DIMENSIONS_V1) {
        expect(mapped[dimension.dimensionId]).toBeGreaterThan(
          dimension.minimum,
        );
        expect(mapped[dimension.dimensionId]).toBeLessThan(
          dimension.maximum,
        );
      }
    }
    expect(() => mapFivePatchEnvelopeUnitPointV1([0.5])).toThrow(/dimensions/);
    expect(() => mapFivePatchEnvelopeUnitPointV1(Array(16).fill(0))).toThrow(
      /strictly inside/,
    );
  });

  it("pins the broad stress and dt subsets independently of outcomes", () => {
    expect(FIVE_PATCH_MODEL_ENVELOPE_STRESS_VALIDATION_INDICES_V1).toEqual(
      Array.from({ length: 16 }, (_, index) => index * 4),
    );
    expect(FIVE_PATCH_MODEL_ENVELOPE_DT_REFINEMENT_INDICES_V1).toEqual([
      0,
      16,
      32,
      48,
    ]);
    expect(FIVE_PATCH_MODEL_ENVELOPE_PROTOCOL_MATRIX_V1.map(
      (scenario) => scenario.scenarioId
    )).toEqual(expect.arrayContaining([
      "hr50-reference",
      "hr60-reference",
      "hr75-reference",
      "hr100-reference",
      "hr60-blood-volume-low",
      "hr60-blood-volume-high",
      "hr60-afterload-low",
      "hr60-afterload-high",
      "hr60-pvr-low",
      "hr60-pvr-high",
    ]));
  });

  it("uses stable arm-and-index candidate identities", () => {
    expect(fivePatchEnvelopeCandidateIdV1(
      "land-equilibrium-passive-sls-off",
      0,
    )).toBe("land-equilibrium-passive-sls-off::lhs-00");
    expect(fivePatchEnvelopeCandidateIdV1(
      "land-equilibrium-passive-sls-all-patch",
      63,
    )).toBe("land-equilibrium-passive-sls-all-patch::lhs-63");
    expect(() => fivePatchEnvelopeCandidateIdV1(
      "land-equilibrium-passive-sls-off",
      64,
    )).toThrow(/outside/);
  });
});
