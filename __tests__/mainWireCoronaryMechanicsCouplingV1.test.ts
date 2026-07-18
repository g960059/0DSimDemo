import { describe, expect, it } from "vitest";
import { evaluateMainWireCoronaryMechanicsCouplingV1 } from
  "@/engine/coronary/mainWireMechanicsCouplingV1";
import { MAIN_WIRE_FIVE_WALL_LAND_TRISEG_PROVIDER_V1_ID } from
  "@/engine/myocardium/mechanics/MainWireFiveWallLandTriSegProviderV1";
import { MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_ADAPTER_V1_ID } from
  "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";
import type { WholeHeartMechanicsTrialV1 } from
  "@/engine/myocardium/wholeHeartMechanicsContractV1";

function trial(
  stresses: Readonly<{ LVFW: number; SEP: number; RVFW: number }>,
): WholeHeartMechanicsTrialV1<never> {
  const wall = (landActiveKirchhoffStressPa: number) => ({
    adapterId: MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_ADAPTER_V1_ID,
    landActiveKirchhoffStressPa,
  });
  return {
    transmuralPressuresMmHg: { LA: 9, LV: 118, RA: 5, RV: 28 },
    diagnostics: {
      readback: {
        providerModelId: MAIN_WIRE_FIVE_WALL_LAND_TRISEG_PROVIDER_V1_ID,
        wallMaterialReadbackByWall: {
          LA: null,
          LVFW: wall(stresses.LVFW),
          SEP: wall(stresses.SEP),
          RVFW: wall(stresses.RVFW),
          RA: null,
        },
      },
    },
  } as unknown as WholeHeartMechanicsTrialV1<never>;
}

describe("main-wire coronary mechanics coupling", () => {
  it("uses same-candidate transmural pressure and Land active stress only", () => {
    const result = evaluateMainWireCoronaryMechanicsCouplingV1(
      trial({ LVFW: 120_000, SEP: 95_000, RVFW: 42_000 }),
      {
        commonIntrathoracicPressureMmHg: -2,
        commonPericardialExcessPressureMmHg: 6,
      },
    );
    expect(result.input).toEqual({
      externalPressureMmHg: 4,
      chamberTransmuralPressureMmHg: { LV: 118, RV: 28 },
      landActiveFiberStressPaByWall: {
        LVFW: 120_000,
        SEP: 95_000,
        RVFW: 42_000,
      },
    });
    expect(result.source).toEqual({
      chamberPressure: "same-candidate-five-wall-transmural-pressure",
      activeStress: "same-candidate-land-active-kirchhoff-stress-only",
      passiveAndSlsStressIncludedInActiveStressTerm: false,
      epicardialExternalPressure:
        "common-intrathoracic-plus-common-pericardial-excess",
    });
  });

  it("fails closed when the typed Land readback is absent or invalid", () => {
    const missing = {
      ...trial({ LVFW: 1, SEP: 1, RVFW: 1 }),
      diagnostics: { readback: null },
    } as unknown as WholeHeartMechanicsTrialV1<never>;
    expect(() => evaluateMainWireCoronaryMechanicsCouplingV1(missing, {
      commonIntrathoracicPressureMmHg: 0,
      commonPericardialExcessPressureMmHg: 0,
    })).toThrow(/readback/);
    expect(() => evaluateMainWireCoronaryMechanicsCouplingV1(
      trial({ LVFW: -1, SEP: 1, RVFW: 1 }),
      {
        commonIntrathoracicPressureMmHg: 0,
        commonPericardialExcessPressureMmHg: 0,
      },
    )).toThrow(/non-negative/);
  });
});
