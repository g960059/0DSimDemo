import { describe, expect, it } from "vitest";

import {
  evaluateSharedAtrioventricularLongAxisKinematicsV1,
  evaluateSharedAtrioventricularLongAxisModeV1,
  evaluateSharedAtrioventricularLongAxisPassiveColdEquilibriumV1,
  validateSharedAtrioventricularLongAxisModeParamsV1,
  type SharedAtrioventricularLongAxisModeParamsV1,
} from "@/engine/mechanics2/atrial/SharedAtrioventricularLongAxisModeV1";

const PARAMS: SharedAtrioventricularLongAxisModeParamsV1 = Object.freeze({
  parameterSetId: "trace-free-left-heart-fixture-v1",
  atrialEffectiveStrainGain: 0.35,
  leftFreeWallEffectiveStrainGain: -0.2,
  septalEffectiveStrainGain: -0.1,
  maximumAbsoluteCoordinate: 0.5,
  generalizedForceScaleJ: 0.1,
});

const BASE = Object.freeze({
  leftAtrium: 0.1,
  rightAtrium: 0.08,
  leftVentricularFreeWall: -0.04,
  rightVentricularFreeWall: -0.03,
  septum: -0.02,
});

const VOLUMES = Object.freeze({
  leftAtriumMl: 20,
  leftVentricularFreeWallMl: 120,
  septumMl: 60,
});

const STRESS = Object.freeze({
  leftAtriumPa: 2_000,
  leftVentricularFreeWallPa: 12_000,
  septumPa: 7_000,
});

describe("SharedAtrioventricularLongAxisModeV1", () => {
  it("projects one left-heart trace-free mode without shifting cavity volume", () => {
    const q = 0.2;
    const kinematics = evaluateSharedAtrioventricularLongAxisKinematicsV1(
      q,
      BASE,
      PARAMS,
    )!;

    expect(kinematics.effectiveLogStrains.leftAtrium).toBeCloseTo(
      BASE.leftAtrium + PARAMS.atrialEffectiveStrainGain * q,
      14,
    );
    expect(kinematics.effectiveLogStrains.leftVentricularFreeWall).toBeCloseTo(
      BASE.leftVentricularFreeWall +
        PARAMS.leftFreeWallEffectiveStrainGain * q,
      14,
    );
    expect(kinematics.effectiveLogStrains.septum).toBeCloseTo(
      BASE.septum + PARAMS.septalEffectiveStrainGain * q,
      14,
    );
    expect(kinematics.effectiveLogStrains.rightAtrium).toBe(BASE.rightAtrium);
    expect(kinematics.effectiveLogStrains.rightVentricularFreeWall).toBe(
      BASE.rightVentricularFreeWall,
    );
    expect(kinematics.cavityVolumeShiftMl).toBe(0);
    expect(kinematics.modeInterpretation).toContain("trace-free-tensor-mode");
  });

  it("satisfies the finite-difference virtual-work identity", () => {
    const q = 0.12;
    const evaluation = evaluateSharedAtrioventricularLongAxisModeV1(
      q,
      BASE,
      VOLUMES,
      STRESS,
      PARAMS,
    );
    expect(evaluation.valid).toBe(true);

    const wallWorkJ = (coordinate: number): number => {
      const strain = evaluateSharedAtrioventricularLongAxisKinematicsV1(
        coordinate,
        BASE,
        PARAMS,
      )!.effectiveLogStrains;
      return (
        VOLUMES.leftAtriumMl * 1e-6 * STRESS.leftAtriumPa *
          strain.leftAtrium +
        VOLUMES.leftVentricularFreeWallMl * 1e-6 *
          STRESS.leftVentricularFreeWallPa *
          strain.leftVentricularFreeWall +
        VOLUMES.septumMl * 1e-6 * STRESS.septumPa * strain.septum
      );
    };
    const h = 1e-6;
    const finiteDifference = (wallWorkJ(q + h) - wallWorkJ(q - h)) /
      (2 * h);
    expect(finiteDifference).toBeCloseTo(evaluation.totalGeneralizedForceJ!, 9);
    expect(evaluation.normalizedResidual).toBeCloseTo(
      evaluation.totalGeneralizedForceJ! / PARAMS.generalizedForceScaleJ,
      14,
    );
    expect(evaluation.claim.fullWallTotalEnergyClaim).toBe(false);
    expect(evaluation.claim.ownsDynamicState).toBe(false);
  });

  it("preserves the signs of atrial versus ventricular and septal work", () => {
    const evaluation = evaluateSharedAtrioventricularLongAxisModeV1(
      0,
      BASE,
      VOLUMES,
      STRESS,
      PARAMS,
    );
    const contributions = evaluation.wallGeneralizedWorkContributionsJ!;
    expect(contributions.leftAtrium).toBeGreaterThan(0);
    expect(contributions.leftVentricularFreeWall).toBeLessThan(0);
    expect(contributions.septum).toBeLessThan(0);
    expect(contributions.leftAtrium).toBeCloseTo(
      VOLUMES.leftAtriumMl * 1e-6 *
        PARAMS.atrialEffectiveStrainGain * STRESS.leftAtriumPa,
      14,
    );
  });

  it("forms a positive passive generalized tangent and matches dGq/dq", () => {
    const q = 0.06;
    const tangentPa = Object.freeze({
      leftAtrium: 16_000,
      leftVentricularFreeWall: 120_000,
      septum: 80_000,
    });
    const offsetsPa = Object.freeze({
      leftAtrium: 500,
      leftVentricularFreeWall: 1_000,
      septum: 800,
    });
    const responseAt = (coordinate: number) => {
      const strain = evaluateSharedAtrioventricularLongAxisKinematicsV1(
        coordinate,
        BASE,
        PARAMS,
      )!.effectiveLogStrains;
      return {
        leftAtrium: {
          stressPa: offsetsPa.leftAtrium + tangentPa.leftAtrium *
            strain.leftAtrium,
          tangentPa: tangentPa.leftAtrium,
        },
        leftVentricularFreeWall: {
          stressPa: offsetsPa.leftVentricularFreeWall +
            tangentPa.leftVentricularFreeWall *
              strain.leftVentricularFreeWall,
          tangentPa: tangentPa.leftVentricularFreeWall,
        },
        septum: {
          stressPa: offsetsPa.septum + tangentPa.septum * strain.septum,
          tangentPa: tangentPa.septum,
        },
      };
    };
    const response = responseAt(q);
    const cold =
      evaluateSharedAtrioventricularLongAxisPassiveColdEquilibriumV1(
        q,
        BASE,
        VOLUMES,
        response,
        PARAMS,
      );
    expect(cold.valid).toBe(true);
    expect(cold.positiveGeneralizedTangent).toBe(true);
    expect(cold.wallGeneralizedTangentContributionsJ!.leftAtrium)
      .toBeGreaterThan(0);
    expect(cold.wallGeneralizedTangentContributionsJ!.leftVentricularFreeWall)
      .toBeGreaterThan(0);
    expect(cold.wallGeneralizedTangentContributionsJ!.septum)
      .toBeGreaterThan(0);

    const generalizedForceAt = (coordinate: number): number => {
      const responseHere = responseAt(coordinate);
      return evaluateSharedAtrioventricularLongAxisModeV1(
        coordinate,
        BASE,
        VOLUMES,
        {
          leftAtriumPa: responseHere.leftAtrium.stressPa,
          leftVentricularFreeWallPa:
            responseHere.leftVentricularFreeWall.stressPa,
          septumPa: responseHere.septum.stressPa,
        },
        PARAMS,
      ).totalGeneralizedForceJ!;
    };
    const h = 1e-6;
    const finiteDifference =
      (generalizedForceAt(q + h) - generalizedForceAt(q - h)) / (2 * h);
    expect(finiteDifference).toBeCloseTo(cold.generalizedTangentJ!, 9);
  });

  it("fails closed for wrong gain signs, invalid bounds, or invalid wall inputs", () => {
    const invalidParams = {
      ...PARAMS,
      parameterSetId: "",
      atrialEffectiveStrainGain: 0,
      leftFreeWallEffectiveStrainGain: 0.1,
      septalEffectiveStrainGain: 0,
    };
    expect(
      validateSharedAtrioventricularLongAxisModeParamsV1(invalidParams),
    ).toEqual(expect.arrayContaining([
      "parameterSetId must be non-empty",
      "atrialEffectiveStrainGain must be positive and finite",
      "leftFreeWallEffectiveStrainGain must be negative and finite",
      "septalEffectiveStrainGain must be negative and finite",
    ]));
    expect(
      evaluateSharedAtrioventricularLongAxisKinematicsV1(0.51, BASE, PARAMS),
    ).toBeNull();
    const invalidEvaluation = evaluateSharedAtrioventricularLongAxisModeV1(
      0,
      BASE,
      { ...VOLUMES, septumMl: 0 },
      { ...STRESS, septumPa: Number.NaN },
      PARAMS,
    );
    expect(invalidEvaluation.valid).toBe(false);
    expect(invalidEvaluation.finite).toBe(false);
    expect(invalidEvaluation.wallGeneralizedWorkContributionsJ).toBeNull();
    expect(invalidEvaluation.issues).toEqual(expect.arrayContaining([
      "septumMl must be positive and finite",
      "transmitted wall stresses must be finite",
    ]));
    const invalidCold =
      evaluateSharedAtrioventricularLongAxisPassiveColdEquilibriumV1(
        0,
        BASE,
        VOLUMES,
        {
          leftAtrium: { stressPa: 0, tangentPa: 0 },
          leftVentricularFreeWall: { stressPa: 0, tangentPa: 1 },
          septum: { stressPa: 0, tangentPa: 1 },
        },
        PARAMS,
      );
    expect(invalidCold.valid).toBe(false);
    expect(invalidCold.generalizedTangentJ).toBeNull();
  });
});
