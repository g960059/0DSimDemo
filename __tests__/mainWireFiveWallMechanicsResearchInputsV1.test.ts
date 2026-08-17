import { describe, expect, it } from "vitest";

import { MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3 } from "@/engine/myocardium/MainWireIntegratedModelHemodynamicResearchInputsV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_MECHANISM_RESEARCH_INPUTS_V3,
  validateAndOwnMainWireIntegratedModelMechanismResearchInputsV3,
} from "@/engine/myocardium/MainWireIntegratedModelMechanismResearchInputsV3";
import { createMainWireIntegratedModelRegularSinusAllOffFixtureV3 } from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3";
import {
  MAIN_WIRE_FIVE_WALL_DEFAULT_MECHANICS_RESEARCH_INPUTS_V1,
  validateAndOwnMainWireFiveWallMechanicsResearchInputsV1,
  withCommonVentricularActiveTensionScaleV1,
} from "@/engine/myocardium/mechanics/MainWireFiveWallMechanicsResearchInputsV1";
import {
  createCanonicalMainWireNormalAdultFiveWallProviderV1,
  createMainWireNormalAdultFiveWallProviderWithMechanicsResearchInputsV1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";
import {
  FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
  evaluateFiveWallNormalCalciumDriveV1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";

describe("Main Wire five-wall mechanics research inputs V1", () => {
  it("owns five explicit walls and applies the common ventricular helper", () => {
    const common = withCommonVentricularActiveTensionScaleV1(
      MAIN_WIRE_FIVE_WALL_DEFAULT_MECHANICS_RESEARCH_INPUTS_V1,
      1.2,
    );

    expect(common.activeTensionScaleByWall).toEqual({
      LA: 1,
      LVFW: 1.2,
      SEP: 1.2,
      RVFW: 1.2,
      RA: 1,
    });
    expect(common.passiveStiffnessScaleByWall).toEqual({
      LA: 1,
      LVFW: 1,
      SEP: 1,
      RVFW: 1,
      RA: 1,
    });
    expect(Object.isFrozen(common.activeTensionScaleByWall)).toBe(true);
  });

  it("changes material identity only for active/passive material controls", () => {
    const canonical = createCanonicalMainWireNormalAdultFiveWallProviderV1();
    const active = validateAndOwnMainWireFiveWallMechanicsResearchInputsV1({
      ...MAIN_WIRE_FIVE_WALL_DEFAULT_MECHANICS_RESEARCH_INPUTS_V1,
      activeTensionScaleByWall: {
        ...MAIN_WIRE_FIVE_WALL_DEFAULT_MECHANICS_RESEARCH_INPUTS_V1.activeTensionScaleByWall,
        LVFW: 1.2,
      },
    });
    const calciumDecayOnly =
      validateAndOwnMainWireFiveWallMechanicsResearchInputsV1({
        ...MAIN_WIRE_FIVE_WALL_DEFAULT_MECHANICS_RESEARCH_INPUTS_V1,
        calciumDecayTimeScaleByWall: {
          ...MAIN_WIRE_FIVE_WALL_DEFAULT_MECHANICS_RESEARCH_INPUTS_V1.calciumDecayTimeScaleByWall,
          RVFW: 1.4,
        },
      });

    const activeProvider =
      createMainWireNormalAdultFiveWallProviderWithMechanicsResearchInputsV1(
        active,
      );
    const decayProvider =
      createMainWireNormalAdultFiveWallProviderWithMechanicsResearchInputsV1(
        calciumDecayOnly,
      );
    expect(activeProvider.parameterIdentityHash).not.toBe(
      canonical.parameterIdentityHash,
    );
    expect(activeProvider.parameterSetId).toContain("wall-mechanics");
    expect(decayProvider.parameterIdentityHash).toBe(
      canonical.parameterIdentityHash,
    );
  });

  it("keeps a wall-specific calcium-decay perturbation out of other walls", () => {
    const baseline = evaluateFiveWallNormalCalciumDriveV1(
      0.3,
      FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
    );
    const slowedRv = evaluateFiveWallNormalCalciumDriveV1(0.3, {
      ...FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
      decayTimeScaleByWall: {
        LA: 1,
        LVFW: 1,
        SEP: 1,
        RVFW: 1.5,
        RA: 1,
      },
    });

    expect(slowedRv.freeCalciumUMByWall.LVFW).toBe(
      baseline.freeCalciumUMByWall.LVFW,
    );
    expect(slowedRv.freeCalciumUMByWall.SEP).toBe(
      baseline.freeCalciumUMByWall.SEP,
    );
    expect(slowedRv.freeCalciumUMByWall.RVFW).not.toBe(
      baseline.freeCalciumUMByWall.RVFW,
    );
  });

  it("threads mechanics, valve areas, and oxygen inputs through one fixture", () => {
    const mechanism =
      validateAndOwnMainWireIntegratedModelMechanismResearchInputsV3({
        ...MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_MECHANISM_RESEARCH_INPUTS_V3,
        chamberMechanics: {
          ...MAIN_WIRE_FIVE_WALL_DEFAULT_MECHANICS_RESEARCH_INPUTS_V1,
          passiveStiffnessScaleByWall: {
            ...MAIN_WIRE_FIVE_WALL_DEFAULT_MECHANICS_RESEARCH_INPUTS_V1.passiveStiffnessScaleByWall,
            LVFW: 1.2,
          },
        },
        valveAreas: {
          ...MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_MECHANISM_RESEARCH_INPUTS_V3.valveAreas,
          AoV: {
            maximumForwardEoaCm2: 0.8,
            closedReverseEroaCm2: 0.2,
          },
        },
        oxygenTransport: {
          ...MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_MECHANISM_RESEARCH_INPUTS_V3.oxygenTransport,
          hemoglobinGPerDl: 10,
        },
      });
    const fixture = createMainWireIntegratedModelRegularSinusAllOffFixtureV3(
      MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
      1,
      mechanism,
    );

    expect(fixture.mechanismResearchInputs).toEqual(mechanism);
    expect(fixture.runtime.valveResearchInput.valves.AoV).toMatchObject({
      maximumForwardEoaCm2: 0.8,
      closedReverseEroaCm2: 0.2,
    });
    expect(
      fixture.coronaryStepInput.calciumDriveParams.decayTimeScaleByWall,
    ).toEqual(mechanism.chamberMechanics.calciumDecayTimeScaleByWall);
    expect(fixture.provider.parameterSetId).toContain("wall-mechanics");
  });

  it("rejects out-of-range or structurally ambiguous wall records", () => {
    expect(() =>
      validateAndOwnMainWireFiveWallMechanicsResearchInputsV1({
        ...MAIN_WIRE_FIVE_WALL_DEFAULT_MECHANICS_RESEARCH_INPUTS_V1,
        activeTensionScaleByWall: {
          ...MAIN_WIRE_FIVE_WALL_DEFAULT_MECHANICS_RESEARCH_INPUTS_V1.activeTensionScaleByWall,
          LVFW: 1.34,
        },
      }),
    ).toThrow(/activeTensionScaleByWall.LVFW/);
    expect(() =>
      validateAndOwnMainWireFiveWallMechanicsResearchInputsV1({
        ...MAIN_WIRE_FIVE_WALL_DEFAULT_MECHANICS_RESEARCH_INPUTS_V1,
        activeTensionScaleByWall: {
          LVFW: 1,
          SEP: 1,
          RVFW: 1,
          LA: 1,
        },
      }),
    ).toThrow(/fields must match exactly/);
  });
});
