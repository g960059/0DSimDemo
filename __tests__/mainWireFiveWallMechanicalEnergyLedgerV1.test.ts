import { describe, expect, it } from "vitest";

import {
  MAIN_WIRE_FIVE_WALL_MECHANICAL_ENERGY_LEDGER_CLAIM_V1,
  MAIN_WIRE_FIVE_WALL_MECHANICAL_ENERGY_WALL_IDS_V1,
  measureMainWireFiveWallMechanicalEnergyLedgerV1,
  type MainWireFiveWallMechanicalEnergyLedgerAcceptedStepSampleV1,
  type MainWireFiveWallMechanicalEnergyStressReadbackV1,
  type MainWireFiveWallMechanicalEnergyWallIdV1,
  type MainWireFiveWallMechanicalEnergyWallRecordV1,
} from "@/engine/myocardium/diagnostics/MainWireFiveWallMechanicalEnergyLedgerV1";

const MMHG_ML_TO_MILLIJ = 0.133322;
const WALL_MATERIAL_VOLUME_ML = wallRecord(() => 1_000);
const ASSEMBLED_STRESS = Object.freeze({
  total: 100,
  landActive: 20,
  equilibriumPassive: 30,
  parallelSls: 50,
});

describe("main-wire five-wall mechanical-energy ledger V1", () => {
  it("measures analytic BE wall, cavity, pericardial, and phase ledgers", () => {
    const preceding = sample({
      strain: 0,
      stress: ASSEMBLED_STRESS,
      equilibriumStoredEnergyDensity: 0,
      slsPreviousStoredEnergyDensity: 0,
      slsNextStoredEnergyDensity: 0,
      slsPhysicalDissipationDensity: 0,
      slsBackwardEulerDissipationDensity: 0,
      volumeMl: { LA: 10, LV: 20, RA: 30, RV: 40 },
      pressureMmHg: { LA: 0, LV: 0, RA: 0, RV: 0 },
      pericardialPressureMmHg: 0,
      pericardialStoredEnergyMilliJ: 1,
    });
    const first = sample({
      strain: 0.1,
      stress: ASSEMBLED_STRESS,
      equilibriumStoredEnergyDensity: 3,
      slsPreviousStoredEnergyDensity: 0,
      slsNextStoredEnergyDensity: 2,
      slsPhysicalDissipationDensity: 1,
      slsBackwardEulerDissipationDensity: 2,
      volumeMl: { LA: 11, LV: 18, RA: 33, RV: 36 },
      pressureMmHg: { LA: 2, LV: 5, RA: 3, RV: 4 },
      pericardialPressureMmHg: 1,
      pericardialStoredEnergyMilliJ: 2,
    });
    const second = sample({
      strain: 0.3,
      stress: ASSEMBLED_STRESS,
      equilibriumStoredEnergyDensity: 9,
      slsPreviousStoredEnergyDensity: 2,
      slsNextStoredEnergyDensity: 4,
      slsPhysicalDissipationDensity: 2,
      slsBackwardEulerDissipationDensity: 6,
      volumeMl: { LA: 13, LV: 19, RA: 31, RV: 37 },
      pressureMmHg: { LA: 4, LV: 6, RA: 2, RV: 5 },
      pericardialPressureMmHg: 3,
      pericardialStoredEnergyMilliJ: 3,
    });

    const measured = measureMainWireFiveWallMechanicalEnergyLedgerV1({
      acceptedStepSamples: [first, second],
      precedingAcceptedStepSample: preceding,
      wallMaterialVolumeMlByWall: WALL_MATERIAL_VOLUME_ML,
      leftAtrialPhaseByAcceptedStep: ["reservoir", "pumping"],
    });

    expect(measured.acceptedStepSampleCount).toBe(2);
    expect(measured.pairedAcceptedStepCount).toBe(2);
    expect(measured.stressWorkCoverageFraction).toBe(1);
    for (const wallId of MAIN_WIRE_FIVE_WALL_MECHANICAL_ENERGY_WALL_IDS_V1) {
      const wall = measured.perWall[wallId];
      expect(wall.stressWorkOnWallMilliJ).toMatchObject({
        total: 30,
        landActive: 6,
        equilibriumPassive: 9,
        parallelSls: 15,
      });
      expect(wall.stressAssemblyResidualMilliJ).toBeCloseTo(0, 12);
      expect(wall.equilibriumPassiveStoredEnergyChangeMilliJ).toBe(9);
      expect(wall.equilibriumPassiveBackwardEulerRemainderMilliJ).toBeCloseTo(
        0,
        12,
      );
      expect(wall.parallelSls).toMatchObject({
        storedEnergyChangeMilliJ: 4,
        physicalDissipationMilliJ: 3,
        backwardEulerNumericalDissipationMilliJ: 8,
        reportedDiscreteBalanceResidualMilliJ: 0,
        reconstructedDiscreteBalanceResidualMilliJ: 0,
        readbackAgreementResidualMilliJ: 0,
      });
    }
    const leftAtrialByPhase = measured.leftAtrialStressWorkOnWallByPhaseMilliJ!;
    expect(leftAtrialByPhase.reservoir).toEqual({
      total: 10,
      landActive: 2,
      equilibriumPassive: 3,
      parallelSls: 5,
    });
    expect(leftAtrialByPhase.conduit).toEqual({
      total: 0,
      landActive: 0,
      equilibriumPassive: 0,
      parallelSls: 0,
    });
    expect(leftAtrialByPhase.pumping.total).toBeCloseTo(20, 12);
    expect(leftAtrialByPhase.pumping.landActive).toBeCloseTo(4, 12);
    expect(leftAtrialByPhase.pumping.equilibriumPassive).toBeCloseTo(6, 12);
    expect(leftAtrialByPhase.pumping.parallelSls).toBeCloseTo(10, 12);
    expect(measured.cavityWorkOnWallMilliJ.LA).toBeCloseTo(
      10 * MMHG_ML_TO_MILLIJ,
      12,
    );
    expect(measured.cavityWorkOnWallMilliJ.LV).toBeCloseTo(
      -4 * MMHG_ML_TO_MILLIJ,
      12,
    );
    expect(measured.cavityWorkOnWallMilliJ.RA).toBeCloseTo(
      5 * MMHG_ML_TO_MILLIJ,
      12,
    );
    expect(measured.cavityWorkOnWallMilliJ.RV).toBeCloseTo(
      -11 * MMHG_ML_TO_MILLIJ,
      12,
    );
    expect(measured.commonPericardium.pressureWorkOnBagMilliJ).toBeCloseTo(
      4 * MMHG_ML_TO_MILLIJ,
      12,
    );
    expect(measured.commonPericardium.storedEnergyChangeMilliJ).toBe(2);
    expect(measured.commonPericardium.backwardEulerRemainderMilliJ).toBeCloseTo(
      4 * MMHG_ML_TO_MILLIJ - 2,
      12,
    );
    expect(measured.workConjugacyResidualMilliJ.leftAtrium).toBeCloseTo(
      30 - 10 * MMHG_ML_TO_MILLIJ,
      12,
    );
    expect(measured.workConjugacyResidualMilliJ.rightAtrium).toBeCloseTo(
      30 - 5 * MMHG_ML_TO_MILLIJ,
      12,
    );
    expect(
      measured.workConjugacyResidualMilliJ.ventricularWallsCombined,
    ).toBeCloseTo(90 + 15 * MMHG_ML_TO_MILLIJ, 12);
    expect(measured.workConjugacyResidualMilliJ.allFiveWalls).toBeCloseTo(
      150,
      12,
    );
    expect(measured.claim.landThermodynamicStoredEnergyClaimed).toBe(false);
  });

  it("reports incomplete coverage without an exact preceding sample", () => {
    const first = sample({ strain: 0.1, stress: ASSEMBLED_STRESS });
    const second = sample({ strain: 0.3, stress: ASSEMBLED_STRESS });

    const measured = measureMainWireFiveWallMechanicalEnergyLedgerV1({
      acceptedStepSamples: [first, second],
      wallMaterialVolumeMlByWall: WALL_MATERIAL_VOLUME_ML,
    });

    expect(measured.acceptedStepSampleCount).toBe(2);
    expect(measured.pairedAcceptedStepCount).toBe(1);
    expect(measured.stressWorkCoverageFraction).toBe(0.5);
    expect(measured.perWall.LA.stressWorkOnWallMilliJ.total).toBeCloseTo(
      20,
      12,
    );
    expect(measured.leftAtrialStressWorkOnWallByPhaseMilliJ).toBeNull();
  });

  it("retains SLS passivity terms and exposes assembly/readback residuals", () => {
    const preceding = sample({ strain: 0 });
    const accepted = sample({
      strain: 1,
      stress: {
        total: 12,
        landActive: 2,
        equilibriumPassive: 3,
        parallelSls: 4,
      },
      equilibriumStoredEnergyDensity: 2,
      slsPreviousStoredEnergyDensity: 0,
      slsNextStoredEnergyDensity: 1,
      slsPhysicalDissipationDensity: 1,
      slsBackwardEulerDissipationDensity: 1,
      slsReportedResidualDensity: 0.5,
    });

    const measured = measureMainWireFiveWallMechanicalEnergyLedgerV1({
      acceptedStepSamples: [accepted],
      precedingAcceptedStepSample: preceding,
      wallMaterialVolumeMlByWall: WALL_MATERIAL_VOLUME_ML,
    });
    const wall = measured.perWall.SEP;

    expect(wall.stressWorkOnWallMilliJ).toEqual({
      total: 12,
      landActive: 2,
      equilibriumPassive: 3,
      parallelSls: 4,
    });
    expect(wall.stressAssemblyResidualMilliJ).toBe(3);
    expect(wall.equilibriumPassiveStoredEnergyChangeMilliJ).toBe(2);
    expect(wall.equilibriumPassiveBackwardEulerRemainderMilliJ).toBe(1);
    expect(wall.parallelSls).toEqual({
      storedEnergyChangeMilliJ: 1,
      physicalDissipationMilliJ: 1,
      backwardEulerNumericalDissipationMilliJ: 1,
      reportedDiscreteBalanceResidualMilliJ: 0.5,
      reconstructedDiscreteBalanceResidualMilliJ: 1,
      readbackAgreementResidualMilliJ: 0.5,
    });
    expect(
      MAIN_WIRE_FIVE_WALL_MECHANICAL_ENERGY_LEDGER_CLAIM_V1.landThermodynamicStoredEnergyClaimed,
    ).toBe(false);
    expect(MAIN_WIRE_FIVE_WALL_MECHANICAL_ENERGY_LEDGER_CLAIM_V1).toMatchObject(
      {
        scientificInterpretation:
          "mechanical-port-passive-storage-and-dissipation-ledger-only",
        activeStressWorkSign:
          "positive-is-work-on-wall-negative-is-net-active-mechanical-delivery",
        activeDeliveryAbsorptionSplitEstablished: false,
        instantaneousPowerEstablished: false,
      },
    );
  });
});

type SampleOptions = Readonly<{
  strain: number;
  stress?: MainWireFiveWallMechanicalEnergyStressReadbackV1;
  equilibriumStoredEnergyDensity?: number;
  slsPreviousStoredEnergyDensity?: number;
  slsNextStoredEnergyDensity?: number;
  slsPhysicalDissipationDensity?: number;
  slsBackwardEulerDissipationDensity?: number;
  slsReportedResidualDensity?: number;
  volumeMl?: Readonly<{ LA: number; LV: number; RA: number; RV: number }>;
  pressureMmHg?: Readonly<{ LA: number; LV: number; RA: number; RV: number }>;
  pericardialPressureMmHg?: number;
  pericardialStoredEnergyMilliJ?: number;
}>;

function sample(
  options: SampleOptions,
): MainWireFiveWallMechanicalEnergyLedgerAcceptedStepSampleV1 {
  const stress =
    options.stress ??
    Object.freeze({
      total: 0,
      landActive: 0,
      equilibriumPassive: 0,
      parallelSls: 0,
    });
  return Object.freeze({
    nodeVolumeMl: Object.freeze(
      options.volumeMl ?? {
        LA: 10,
        LV: 20,
        RA: 30,
        RV: 40,
      },
    ),
    chamberTransmuralPressureMmHg: Object.freeze(
      options.pressureMmHg ?? {
        LA: 0,
        LV: 0,
        RA: 0,
        RV: 0,
      },
    ),
    commonPericardium: Object.freeze({
      excessPressureMmHg: options.pericardialPressureMmHg ?? 0,
      storedEnergyMilliJ: options.pericardialStoredEnergyMilliJ ?? 0,
    }),
    wallStressPa: wallRecord(() => Object.freeze({ ...stress })),
    wallFiberLogStrain: wallRecord(() => options.strain),
    wallEnergyLedgerDensity: wallRecord(() =>
      Object.freeze({
        equilibriumPassiveStoredEnergyDensityJPerM3:
          options.equilibriumStoredEnergyDensity ?? 0,
        slsPreviousStoredEnergyDensityJPerM3:
          options.slsPreviousStoredEnergyDensity ?? 0,
        slsNextStoredEnergyDensityJPerM3:
          options.slsNextStoredEnergyDensity ?? 0,
        slsPhysicalDissipationIncrementDensityJPerM3:
          options.slsPhysicalDissipationDensity ?? 0,
        slsBackwardEulerNumericalDissipationIncrementDensityJPerM3:
          options.slsBackwardEulerDissipationDensity ?? 0,
        slsDiscreteEnergyBalanceResidualJPerM3:
          options.slsReportedResidualDensity ?? 0,
      }),
    ),
  });
}

function wallRecord<T>(
  build: (wallId: MainWireFiveWallMechanicalEnergyWallIdV1) => T,
): MainWireFiveWallMechanicalEnergyWallRecordV1<T> {
  return Object.freeze(
    Object.fromEntries(
      MAIN_WIRE_FIVE_WALL_MECHANICAL_ENERGY_WALL_IDS_V1.map((wallId) => [
        wallId,
        build(wallId),
      ]),
    ),
  ) as MainWireFiveWallMechanicalEnergyWallRecordV1<T>;
}
