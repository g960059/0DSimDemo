import { describe, expect, it } from "vitest";

import {
  MAIN_WIRE_FIVE_WALL_MECHANICAL_PORT_LEDGER_ENGINEERING_V1_CLAIM,
  MAIN_WIRE_FIVE_WALL_MECHANICAL_PORT_WALL_IDS_V1,
  measureMainWireFiveWallMechanicalPortLedgerV1,
  type MainWireFiveWallMechanicalPortAcceptedEndpointV1,
  type MainWireFiveWallMechanicalPortAcceptedIntervalV1,
  type MainWireFiveWallMechanicalPortChamberRecordV1,
  type MainWireFiveWallMechanicalPortStressReadbackV1,
  type MainWireFiveWallMechanicalPortWallRecordV1,
} from "@/engine/myocardium/diagnostics/MainWireFiveWallMechanicalPortLedgerEngineeringV1";

const MATERIAL_BINDING = Object.freeze({
  ownerId: "synthetic-five-wall-material-binding-v1",
  parameterIdentityHash: "synthetic-parameter-identity",
  mechanicsProviderIdentity: Object.freeze({
    contractId: "synthetic-contract-v1",
    providerId: "synthetic-provider-v1",
    parameterSetId: "synthetic-parameter-set-v1",
    parameterIdentityHash: "synthetic-provider-parameter-identity",
    stateSchemaVersion: 1,
  }),
  wallMaterialVolumeMlByWall: wallRecord(() => 1_000),
});

describe("five-wall mechanical-port ledger Engineering V1", () => {
  it("separates BE audit work, trapezoidal display work, storage, and dissipation", () => {
    const initial = endpoint({
      revision: 10,
      timeSec: 2,
      strain: 0,
      stress: stress({ total: 100, active: 20, passive: 30, sls: 50 }),
      equilibriumStored: 0,
      slsPrevious: 0,
      slsNext: 0,
      slsPhysical: 0,
      slsNumerical: 0,
      volumes: { LA: 10, LV: 20, RA: 30, RV: 40 },
      pressures: { LA: 0, LV: 2, RA: 0, RV: 0 },
      pericardialPressure: 0,
      pericardialEnergy: 1,
    });
    const first = endpoint({
      revision: 11,
      timeSec: 2.001,
      strain: 0.1,
      stress: stress({ total: 100, active: 20, passive: 30, sls: 50 }),
      equilibriumStored: 3,
      slsPrevious: 0,
      slsNext: 2,
      slsPhysical: 1,
      slsNumerical: 2,
      volumes: { LA: 11, LV: 18, RA: 33, RV: 36 },
      pressures: { LA: 2, LV: 4, RA: 3, RV: 4 },
      pericardialPressure: 1,
      pericardialEnergy: 2,
    });
    const second = endpoint({
      revision: 12,
      timeSec: 2.0015,
      strain: -0.1,
      stress: stress({ total: 100, active: 20, passive: 30, sls: 50 }),
      equilibriumStored: 9,
      slsPrevious: 2,
      slsNext: 4,
      slsPhysical: 2,
      slsNumerical: 6,
      volumes: { LA: 13, LV: 19, RA: 31, RV: 37 },
      pressures: { LA: 4, LV: 6, RA: 2, RV: 5 },
      pericardialPressure: 3,
      pericardialEnergy: 3,
    });

    const measured = measureMainWireFiveWallMechanicalPortLedgerV1({
      materialBinding: MATERIAL_BINDING,
      acceptedIntervals: [interval(initial, first), interval(first, second)],
    });

    expect(measured.intervalCount).toBe(2);
    expect(measured.initialAcceptedRevision).toBe(10);
    expect(measured.terminalAcceptedRevision).toBe(12);
    expect(measured.elapsedTimeSec).toBeCloseTo(0.0015, 15);
    expect(measured.minimumAcceptedDtSec).toBeCloseTo(0.0005, 15);
    expect(measured.maximumAcceptedDtSec).toBeCloseTo(0.001, 15);

    for (const wallId of MAIN_WIRE_FIVE_WALL_MECHANICAL_PORT_WALL_IDS_V1) {
      const wall = measured.perWall[wallId];
      expect(wall.backwardEulerStressWorkOnWallMilliJ).toEqual({
        total: -10,
        landActive: -2,
        equilibriumPassive: -3,
        parallelSls: -5,
      });
      expect(wall.stressAssemblyResidualMilliJ).toBe(0);
      expect(wall.activeMechanical).toEqual({
        workOnWallMilliJ: -2,
        deliveryPositiveMilliJ: 4,
        absorptionMagnitudeMilliJ: 2,
        netDeliveryMilliJ: 2,
        deliveryIntervalCount: 1,
        absorptionIntervalCount: 1,
        zeroIntervalCount: 0,
      });
      expect(wall.equilibriumPassiveStoredEnergyChangeMilliJ).toBe(9);
      expect(wall.equilibriumPassiveBackwardEulerRemainderMilliJ).toBe(-12);
      expect(wall.parallelSls).toEqual({
        storedEnergyChangeMilliJ: 4,
        physicalDissipationMilliJ: 3,
        backwardEulerNumericalDissipationMilliJ: 8,
        reportedDiscreteBalanceResidualMilliJ: 0,
        reconstructedDiscreteBalanceResidualMilliJ: -20,
        readbackAgreementResidualMilliJ: -20,
      });
    }

    const expectedLvBe = -0.266644;
    const expectedLvTrap = -0.133322;
    expect(measured.cavityWork.backwardEulerWorkOnWallMilliJ.LV).toBeCloseTo(
      expectedLvBe,
      15,
    );
    expect(measured.cavityWork.trapezoidalWorkOnWallMilliJ.LV).toBeCloseTo(
      expectedLvTrap,
      15,
    );
    expect(measured.cavityWork.quadratureDifferenceMilliJ.LV).toBeCloseTo(
      expectedLvBe - expectedLvTrap,
      15,
    );

    expect(measured.commonPericardium.storedEnergyChangeMilliJ).toBe(2);
    expect(
      measured.commonPericardium.backwardEulerPressureWorkOnBagMilliJ,
    ).toBeCloseTo(0.533288, 15);
    expect(
      measured.commonPericardium.trapezoidalPressureWorkOnBagMilliJ,
    ).toBeCloseTo(0.399966, 15);
    expect(measured.claim).toBe(
      MAIN_WIRE_FIVE_WALL_MECHANICAL_PORT_LEDGER_ENGINEERING_V1_CLAIM,
    );
    expect(measured.claim.landThermodynamicStoredEnergyClaimed).toBe(false);
    expect(measured.claim.pressureVolumeAreaClaimed).toBe(false);
    expect(measured.claim.officialQualificationEstablished).toBe(false);
    expect(measured.claim.acceptedEndpointProvenanceVerified).toBe(false);
    expect(measured.claim.historicalQualificationTransferred).toBe(false);
  });

  it("classifies zero active intervals without inventing continuous power crossings", () => {
    const initial = endpoint({
      revision: 0,
      timeSec: 0,
      strain: 0,
      stress: stress({ total: 0, active: 0, passive: 0, sls: 0 }),
    });
    const next = endpoint({
      revision: 1,
      timeSec: 0.001,
      strain: 0.1,
      stress: stress({ total: 0, active: 0, passive: 0, sls: 0 }),
    });
    const measured = measureMainWireFiveWallMechanicalPortLedgerV1({
      materialBinding: MATERIAL_BINDING,
      acceptedIntervals: [interval(initial, next)],
    });

    expect(measured.perWall.LVFW.activeMechanical).toMatchObject({
      deliveryPositiveMilliJ: 0,
      absorptionMagnitudeMilliJ: 0,
      netDeliveryMilliJ: 0,
      zeroIntervalCount: 1,
    });
    expect(measured.claim.continuousPowerZeroCrossingResolved).toBe(false);
    expect(measured.claim.instantaneousPowerEstablished).toBe(false);
  });

  it("rejects non-contiguous accepted lineage and invalid material bindings", () => {
    const initial = endpoint({ revision: 0, timeSec: 0 });
    const first = endpoint({ revision: 1, timeSec: 0.001 });
    const wrongPrevious = endpoint({
      revision: 1,
      timeSec: 0.001,
      strain: 0.01,
    });
    const second = endpoint({ revision: 2, timeSec: 0.002 });

    expect(() =>
      measureMainWireFiveWallMechanicalPortLedgerV1({
        materialBinding: MATERIAL_BINDING,
        acceptedIntervals: [
          interval(initial, first),
          interval(wrongPrevious, second),
        ],
      }),
    ).toThrow(/contiguous lineage/);

    expect(() =>
      measureMainWireFiveWallMechanicalPortLedgerV1({
        materialBinding: {
          ...MATERIAL_BINDING,
          ownerId: "",
        },
        acceptedIntervals: [interval(initial, first)],
      }),
    ).toThrow(/must be identified/);

    expect(() =>
      measureMainWireFiveWallMechanicalPortLedgerV1({
        materialBinding: {
          ...MATERIAL_BINDING,
          mechanicsProviderIdentity: {
            ...MATERIAL_BINDING.mechanicsProviderIdentity,
            providerId: "",
          },
        },
        acceptedIntervals: [interval(initial, first)],
      }),
    ).toThrow(/identify the mechanics provider/);

    const brokenSlsLineage = endpoint({
      revision: 1,
      timeSec: 0.001,
      slsPrevious: 1,
    });
    expect(() =>
      measureMainWireFiveWallMechanicalPortLedgerV1({
        materialBinding: MATERIAL_BINDING,
        acceptedIntervals: [interval(initial, brokenSlsLineage)],
      }),
    ).toThrow(/SLS previous storage/);

    expect(() =>
      measureMainWireFiveWallMechanicalPortLedgerV1({
        materialBinding: MATERIAL_BINDING,
        acceptedIntervals: [
          interval(initial, endpoint({ revision: 2, timeSec: 0.001 })),
        ],
      }),
    ).toThrow(/revisions must be consecutive/);
    expect(() =>
      measureMainWireFiveWallMechanicalPortLedgerV1({
        materialBinding: MATERIAL_BINDING,
        acceptedIntervals: [
          interval(initial, endpoint({ revision: 1, timeSec: 0 })),
        ],
      }),
    ).toThrow(/time must increase/);
    expect(() =>
      measureMainWireFiveWallMechanicalPortLedgerV1({
        materialBinding: MATERIAL_BINDING,
        acceptedIntervals: [
          interval(initial, endpoint({ revision: 1, timeSec: Number.NaN })),
        ],
      }),
    ).toThrow(/time must be finite/);
  });

  it("fails closed when finite interval arithmetic overflows", () => {
    const initial = endpoint({
      revision: 0,
      timeSec: 0,
      strain: -Number.MAX_VALUE,
      stress: stress({ total: 1, active: 1, passive: 0, sls: 0 }),
    });
    const next = endpoint({
      revision: 1,
      timeSec: 0.001,
      strain: Number.MAX_VALUE,
      stress: stress({ total: 1, active: 1, passive: 0, sls: 0 }),
    });

    expect(() =>
      measureMainWireFiveWallMechanicalPortLedgerV1({
        materialBinding: MATERIAL_BINDING,
        acceptedIntervals: [interval(initial, next)],
      }),
    ).toThrow(/accumulated/);

    const earliest = endpoint({
      revision: 0,
      timeSec: 0,
      pericardialEnergy: -Number.MAX_VALUE,
    });
    const latest = endpoint({
      revision: 1,
      timeSec: 0.001,
      pericardialEnergy: Number.MAX_VALUE,
    });
    expect(() =>
      measureMainWireFiveWallMechanicalPortLedgerV1({
        materialBinding: MATERIAL_BINDING,
        acceptedIntervals: [interval(earliest, latest)],
      }),
    ).toThrow(/output must contain only finite numbers/);
  });
});

type EndpointOptions = Readonly<{
  revision: number;
  timeSec: number;
  strain?: number;
  stress?: MainWireFiveWallMechanicalPortStressReadbackV1;
  equilibriumStored?: number;
  slsPrevious?: number;
  slsNext?: number;
  slsPhysical?: number;
  slsNumerical?: number;
  volumes?: MainWireFiveWallMechanicalPortChamberRecordV1<number>;
  pressures?: MainWireFiveWallMechanicalPortChamberRecordV1<number>;
  pericardialPressure?: number;
  pericardialEnergy?: number;
}>;

function endpoint(
  options: EndpointOptions,
): MainWireFiveWallMechanicalPortAcceptedEndpointV1 {
  const wallStress =
    options.stress ??
    stress({
      total: 0,
      active: 0,
      passive: 0,
      sls: 0,
    });
  return Object.freeze({
    acceptedRevision: options.revision,
    acceptedTimeSec: options.timeSec,
    nodeVolumeMl: options.volumes ?? chamberRecord(0),
    chamberTransmuralPressureMmHg: options.pressures ?? chamberRecord(0),
    commonPericardium: Object.freeze({
      excessPressureMmHg: options.pericardialPressure ?? 0,
      storedEnergyMilliJ: options.pericardialEnergy ?? 0,
    }),
    wallStressPa: wallRecord(() => wallStress),
    wallFiberLogStrain: wallRecord(() => options.strain ?? 0),
    wallEnergyLedgerDensity: wallRecord(() =>
      Object.freeze({
        equilibriumPassiveStoredEnergyDensityJPerM3:
          options.equilibriumStored ?? 0,
        slsPreviousStoredEnergyDensityJPerM3: options.slsPrevious ?? 0,
        slsNextStoredEnergyDensityJPerM3: options.slsNext ?? 0,
        slsPhysicalDissipationIncrementDensityJPerM3: options.slsPhysical ?? 0,
        slsBackwardEulerNumericalDissipationIncrementDensityJPerM3:
          options.slsNumerical ?? 0,
        slsDiscreteEnergyBalanceResidualJPerM3: 0,
      }),
    ),
  });
}

function interval(
  previous: MainWireFiveWallMechanicalPortAcceptedEndpointV1,
  next: MainWireFiveWallMechanicalPortAcceptedEndpointV1,
): MainWireFiveWallMechanicalPortAcceptedIntervalV1 {
  return Object.freeze({ previous, next });
}

function stress(
  input: Readonly<{
    total: number;
    active: number;
    passive: number;
    sls: number;
  }>,
): MainWireFiveWallMechanicalPortStressReadbackV1 {
  return Object.freeze({
    total: input.total,
    landActive: input.active,
    equilibriumPassive: input.passive,
    parallelSls: input.sls,
  });
}

function chamberRecord(
  value: number,
): MainWireFiveWallMechanicalPortChamberRecordV1<number> {
  return Object.freeze({ LA: value, LV: value, RA: value, RV: value });
}

function wallRecord<T>(
  build: () => T,
): MainWireFiveWallMechanicalPortWallRecordV1<T> {
  return Object.freeze({
    LA: build(),
    LVFW: build(),
    SEP: build(),
    RVFW: build(),
    RA: build(),
  });
}
