import { describe, expect, it } from "vitest";

import {
  MAIN_WIRE_FIVE_WALL_MECHANICAL_ENERGY_WALL_IDS_V1,
  type MainWireFiveWallMechanicalEnergyLedgerAcceptedStepSampleV1,
  type MainWireFiveWallMechanicalEnergyStressReadbackV1,
  type MainWireFiveWallMechanicalEnergyWallIdV1,
  type MainWireFiveWallMechanicalEnergyWallRecordV1,
} from "@/engine/myocardium/diagnostics/MainWireFiveWallMechanicalEnergyLedgerV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_ENERGY_OFFICIAL_EVIDENCE_POLICY_V1,
  remeasureMainWireIntegratedModelPeriodicFiveWallMechanicalEnergyEvidenceV1,
  remeasureMainWireIntegratedModelPeriodicFiveWallMechanicalEnergyQuadratureBridgesV1,
  runMainWireIntegratedModelPeriodicFiveWallMechanicalEnergyEvidenceV1,
  verifyMainWireIntegratedModelPeriodicFiveWallMechanicalEnergyHashBindingsV1,
  type MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyHashPreimagesV1,
  type MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyPublishedHashesV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyEvidenceV1";
import { MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_ENERGY_POLICY_V1 } from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyV1";
import { sha256CanonicalJsonHex } from "@/engine/integrity";

const WALL_MATERIAL_VOLUME_ML = wallRecord(() => 1_000);
const ASSEMBLED_STRESS = Object.freeze({
  total: 100,
  landActive: 20,
  equilibriumPassive: 30,
  parallelSls: 50,
});

describe("periodic five-wall mechanical-energy canonical evidence V1", () => {
  it("keeps the official cold-run entrypoint argument-free and non-public", () => {
    expect(
      runMainWireIntegratedModelPeriodicFiveWallMechanicalEnergyEvidenceV1,
    ).toHaveLength(0);
    expect(
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_ENERGY_OFFICIAL_EVIDENCE_POLICY_V1,
    ).toMatchObject({
      officialRunnerArguments: "none",
      coarseDtSec: 0.001,
      fineDtSec: 0.0005,
      requestedMaximumCycleCount: 250,
      executionPurpose: "canonical-evidence",
      coldStartOwnership: "internal-independent-per-arm",
      rawRuntimeInputsReturned: false,
      callerSuppliedProjectionAcceptedByOfficialRunner: false,
      callerSuppliedColdStartClaimAcceptedByOfficialRunner: false,
      publicLiveOutputCatalogAdmissionEstablished: false,
      publicGraphCatalogAdmissionEstablished: false,
      PEEstablished: false,
      PVAEstablished: false,
      MVO2Established: false,
      ATPUseEstablished: false,
      mechanicalEfficiencyEstablished: false,
      physiologicalValidationEstablished: false,
      clinicalValidationClaimed: false,
    });
  });

  it("recomputes all five owned SHA-256 bindings", async () => {
    const fixture = await hashFixture();

    const assessed =
      await verifyMainWireIntegratedModelPeriodicFiveWallMechanicalEnergyHashBindingsV1(
        fixture.published,
        fixture.preimages,
      );

    expect(assessed.allMatch).toBe(true);
    expect(
      Object.values(assessed).filter(
        (value) => typeof value === "object" && value !== null,
      ),
    ).toHaveLength(5);
    expect(assessed.sourceCheckpoint).toMatchObject({
      embeddedSha256: fixture.published.sourceCheckpointSha256,
      matches: true,
    });
    expect(assessed.terminalCheckpoint).toMatchObject({
      embeddedSha256: fixture.published.terminalCheckpointSha256,
      matches: true,
    });
  });

  it("fails closed when any digest owner or embedded checkpoint digest is tampered", async () => {
    const fixture = await hashFixture();
    const cases: readonly Readonly<{
      expectedMismatch:
        | "sourceCheckpoint"
        | "terminalCheckpoint"
        | "rawMechanicalTrace"
        | "bridgeTerminalAcceptedStepSample"
        | "materialVolumeBinding";
      published?: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyPublishedHashesV1;
      preimages?: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyHashPreimagesV1;
    }>[] = [
      {
        expectedMismatch: "sourceCheckpoint",
        preimages: Object.freeze({
          ...fixture.preimages,
          sourceCheckpoint: Object.freeze({
            ...fixture.preimages.sourceCheckpoint,
            checkpointSha256: "0".repeat(64),
          }),
        }),
      },
      {
        expectedMismatch: "terminalCheckpoint",
        preimages: Object.freeze({
          ...fixture.preimages,
          terminalCheckpoint: Object.freeze({
            ...fixture.preimages.terminalCheckpoint,
            acceptedTimeSec: 3,
          }),
        }),
      },
      {
        expectedMismatch: "rawMechanicalTrace",
        preimages: Object.freeze({
          ...fixture.preimages,
          measurementInputEvidence: Object.freeze({
            preceding: 11,
            accepted: Object.freeze([12, 14]),
          }),
        }),
      },
      {
        expectedMismatch: "bridgeTerminalAcceptedStepSample",
        preimages: Object.freeze({
          ...fixture.preimages,
          bridgeTerminalAcceptedStepSample: Object.freeze({ sample: 12 }),
        }),
      },
      {
        expectedMismatch: "materialVolumeBinding",
        published: Object.freeze({
          ...fixture.published,
          materialVolumeBindingSha256: "f".repeat(64),
        }),
      },
    ];

    for (const testCase of cases) {
      const assessed =
        await verifyMainWireIntegratedModelPeriodicFiveWallMechanicalEnergyHashBindingsV1(
          testCase.published ?? fixture.published,
          testCase.preimages ?? fixture.preimages,
        );
      expect(assessed.allMatch, testCase.expectedMismatch).toBe(false);
      expect(assessed[testCase.expectedMismatch].matches).toBe(false);
    }
  });

  it("remeasures the ledger and both quadrature bridges from raw accepted samples", () => {
    const preceding = sample({
      strain: 0,
      volumeMl: { LA: 10, LV: 20, RA: 30, RV: 40 },
      pressureMmHg: { LA: 0, LV: 0, RA: 0, RV: 0 },
    });
    const first = sample({
      strain: 0.1,
      stress: ASSEMBLED_STRESS,
      volumeMl: { LA: 11, LV: 18, RA: 33, RV: 36 },
      pressureMmHg: { LA: 2, LV: 5, RA: 3, RV: 4 },
    });
    const second = sample({
      strain: 0.3,
      stress: ASSEMBLED_STRESS,
      volumeMl: { LA: 13, LV: 19, RA: 31, RV: 37 },
      pressureMmHg: { LA: 4, LV: 6, RA: 2, RV: 5 },
    });
    const ledger =
      remeasureMainWireIntegratedModelPeriodicFiveWallMechanicalEnergyEvidenceV1(
        {
          precedingAcceptedStepSample: preceding,
          measurementAcceptedStepSamples: [first, second],
          wallMaterialVolumeMlByWall: WALL_MATERIAL_VOLUME_ML,
        },
      );

    expect(ledger.acceptedStepSampleCount).toBe(2);
    expect(ledger.perWall.LA.stressWorkOnWallMilliJ.total).toBeCloseTo(30, 12);
    const bridges =
      remeasureMainWireIntegratedModelPeriodicFiveWallMechanicalEnergyQuadratureBridgesV1(
        {
          precedingAcceptedStepSample: preceding,
          measurementAcceptedStepSamples: [first, second],
          wallMaterialVolumeMlByWall: WALL_MATERIAL_VOLUME_ML,
          ledger,
          trapezoidalExternalWorkMmHgMl: Object.freeze({
            LV: -0.5,
            RV: 3.5,
          }),
        },
      );

    expect(bridges).toHaveLength(2);
    expect(bridges.every(({ passed }) => passed)).toBe(true);
    expect(bridges[0]!.endpointCorrectionMilliJ).toBeCloseTo(
      -4.5 * conversionMilliJPerMmHgMl(),
      12,
    );
    expect(bridges[1]!.endpointCorrectionMilliJ).toBeCloseTo(
      -7.5 * conversionMilliJPerMmHgMl(),
      12,
    );
    expect(Math.abs(bridges[0]!.residualMilliJ)).toBeLessThanOrEqual(1e-8);
    expect(Math.abs(bridges[1]!.residualMilliJ)).toBeLessThanOrEqual(1e-8);
  });

  it("exposes raw-ledger and quadrature tampering to independent remeasurement", () => {
    const preceding = sample({
      strain: 0,
      volumeMl: { LA: 10, LV: 20, RA: 30, RV: 40 },
      pressureMmHg: { LA: 0, LV: 0, RA: 0, RV: 0 },
    });
    const accepted = sample({
      strain: 0.2,
      stress: ASSEMBLED_STRESS,
      volumeMl: { LA: 11, LV: 18, RA: 31, RV: 38 },
      pressureMmHg: { LA: 1, LV: 5, RA: 1, RV: 4 },
    });
    const ledger =
      remeasureMainWireIntegratedModelPeriodicFiveWallMechanicalEnergyEvidenceV1(
        {
          precedingAcceptedStepSample: preceding,
          measurementAcceptedStepSamples: [accepted],
          wallMaterialVolumeMlByWall: WALL_MATERIAL_VOLUME_ML,
        },
      );
    const tamperedAccepted = Object.freeze({
      ...accepted,
      nodeVolumeMl: Object.freeze({ ...accepted.nodeVolumeMl, LV: 19 }),
    });
    const tamperedLedger =
      remeasureMainWireIntegratedModelPeriodicFiveWallMechanicalEnergyEvidenceV1(
        {
          precedingAcceptedStepSample: preceding,
          measurementAcceptedStepSamples: [tamperedAccepted],
          wallMaterialVolumeMlByWall: WALL_MATERIAL_VOLUME_ML,
        },
      );
    expect(tamperedLedger.cavityWorkOnWallMilliJ.LV).not.toBe(
      ledger.cavityWorkOnWallMilliJ.LV,
    );

    const endpointCorrectionMmHgMl = 0.5 * 5 * -2;
    const backwardEulerMmHgMl = 5 * -2;
    const requiredExternalWorkMmHgMl =
      endpointCorrectionMmHgMl - backwardEulerMmHgMl;
    const baseline =
      remeasureMainWireIntegratedModelPeriodicFiveWallMechanicalEnergyQuadratureBridgesV1(
        {
          precedingAcceptedStepSample: preceding,
          measurementAcceptedStepSamples: [accepted],
          wallMaterialVolumeMlByWall: WALL_MATERIAL_VOLUME_ML,
          ledger,
          trapezoidalExternalWorkMmHgMl: Object.freeze({
            LV: requiredExternalWorkMmHgMl,
            RV: 4,
          }),
        },
      );
    const tampered =
      remeasureMainWireIntegratedModelPeriodicFiveWallMechanicalEnergyQuadratureBridgesV1(
        {
          precedingAcceptedStepSample: preceding,
          measurementAcceptedStepSamples: [accepted],
          wallMaterialVolumeMlByWall: WALL_MATERIAL_VOLUME_ML,
          ledger,
          trapezoidalExternalWorkMmHgMl: Object.freeze({
            LV: requiredExternalWorkMmHgMl + 1,
            RV: 4,
          }),
        },
      );

    expect(baseline[0]!.passed).toBe(true);
    expect(tampered[0]!.passed).toBe(false);
    expect(
      tampered[0]!.residualMilliJ - baseline[0]!.residualMilliJ,
    ).toBeCloseTo(conversionMilliJPerMmHgMl(), 12);
  });
});

async function hashFixture(): Promise<
  Readonly<{
    published: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyPublishedHashesV1;
    preimages: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyHashPreimagesV1;
  }>
> {
  const sourcePayload = Object.freeze({ kind: "source", revision: 10 });
  const terminalPayload = Object.freeze({
    kind: "terminal",
    revision: 20,
    acceptedTimeSec: 2,
  });
  const sourceCheckpointSha256 = await sha256CanonicalJsonHex(sourcePayload);
  const terminalCheckpointSha256 =
    await sha256CanonicalJsonHex(terminalPayload);
  const measurementInputEvidence = Object.freeze({
    preceding: 11,
    accepted: Object.freeze([12, 13]),
  });
  const bridgeTerminalAcceptedStepSample = Object.freeze({ sample: 11 });
  const materialVolumeBindingPayload = Object.freeze({
    prior: "normal-adult",
    wallVolumesMl: Object.freeze({ LA: 1, LVFW: 2, SEP: 3, RVFW: 4, RA: 5 }),
  });
  const preimages = Object.freeze({
    sourceCheckpoint: Object.freeze({
      ...sourcePayload,
      checkpointSha256: sourceCheckpointSha256,
    }),
    terminalCheckpoint: Object.freeze({
      ...terminalPayload,
      checkpointSha256: terminalCheckpointSha256,
    }),
    measurementInputEvidence,
    bridgeTerminalAcceptedStepSample,
    materialVolumeBindingPayload,
  });
  const published = Object.freeze({
    sourceCheckpointSha256,
    terminalCheckpointSha256,
    rawMechanicalTraceSha256: await sha256CanonicalJsonHex(
      measurementInputEvidence,
    ),
    bridgeTerminalAcceptedStepSampleSha256: await sha256CanonicalJsonHex(
      bridgeTerminalAcceptedStepSample,
    ),
    materialVolumeBindingSha256: await sha256CanonicalJsonHex(
      materialVolumeBindingPayload,
    ),
  });
  return Object.freeze({ published, preimages });
}

type SampleOptions = Readonly<{
  strain: number;
  stress?: MainWireFiveWallMechanicalEnergyStressReadbackV1;
  volumeMl?: Readonly<{ LA: number; LV: number; RA: number; RV: number }>;
  pressureMmHg?: Readonly<{ LA: number; LV: number; RA: number; RV: number }>;
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
      excessPressureMmHg: 0,
      storedEnergyMilliJ: 0,
    }),
    wallStressPa: wallRecord(() => Object.freeze({ ...stress })),
    wallFiberLogStrain: wallRecord(() => options.strain),
    wallEnergyLedgerDensity: wallRecord(() =>
      Object.freeze({
        equilibriumPassiveStoredEnergyDensityJPerM3: 0,
        slsPreviousStoredEnergyDensityJPerM3: 0,
        slsNextStoredEnergyDensityJPerM3: 0,
        slsPhysicalDissipationIncrementDensityJPerM3: 0,
        slsBackwardEulerNumericalDissipationIncrementDensityJPerM3: 0,
        slsDiscreteEnergyBalanceResidualJPerM3: 0,
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

function conversionMilliJPerMmHgMl(): number {
  return MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_ENERGY_POLICY_V1.pressureVolumeConversionMilliJPerMmHgMl;
}
