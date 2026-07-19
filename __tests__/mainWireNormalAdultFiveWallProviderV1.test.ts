import { describe, expect, it } from "vitest";

import {
  evaluateFiveWallNormalCalciumDriveV1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import type {
  MainWireFiveWallLandTriSegReadbackV1,
  MainWireFiveWallLandSlsMaterialKernelV1,
  MainWireFiveWallRecordV1,
} from "@/engine/myocardium/mechanics/MainWireFiveWallLandTriSegProviderV1";
import {
  createMainWireFiveWallLandTriSegProviderV1,
} from "@/engine/myocardium/mechanics/MainWireFiveWallLandTriSegProviderV1";
import {
  MAIN_WIRE_NORMAL_ADULT_MECHANICS_FIXTURE_VOLUMES_ML_V1,
  MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_ADAPTER_V1_CLAIM,
  MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_NOMINAL_JACOBIAN_SCALED_STEP_V1,
  asMainWireFiveWallFreeCalciumDriveV1,
  createCanonicalMainWireNormalAdultFiveWallProviderV1,
  createMainWireNormalAdultFiveWallMaterialKernelsV1,
  type MainWireNormalAdultWallMaterialReadbackV1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";
import type {
  LandSlsWallMaterialStateV1,
} from "@/engine/myocardium/mechanics/landSlsWallMaterialV1";
import {
  NORMAL_ADULT_FIVE_WALL_PRIOR_V1,
} from "@/engine/myocardium/mechanics/normalAdultFiveWallPriorV1";
import {
  checkpointWholeHeartMechanicsStateV1,
  commitWholeHeartMechanicsTrialV1,
  evaluateWholeHeartMechanicsTrialV1,
  initializeWholeHeartMechanicsColdV1,
  restoreWholeHeartMechanicsStateV1,
  type WholeHeartMechanicsSerializableValueV1,
  type WholeHeartMechanicsPressureVolumeTangentMmHgPerMlV1,
} from "@/engine/myocardium/wholeHeartMechanicsContractV1";

describe("main-wire normal-adult five-wall provider adapter V1", () => {
  it("cold-starts the canonical actual Land/SLS/Moyer/Klotz provider", () => {
    const provider = createCanonicalMainWireNormalAdultFiveWallProviderV1();
    const coldDrive = asMainWireFiveWallFreeCalciumDriveV1(
      evaluateFiveWallNormalCalciumDriveV1(0).freeCalciumUMByWall,
    );
    const cold = initializeWholeHeartMechanicsColdV1(provider, {
      timeSec: 0,
      volumesMl: MAIN_WIRE_NORMAL_ADULT_MECHANICS_FIXTURE_VOLUMES_ML_V1,
      drivingInputs: coldDrive,
    });
    const rb = providerReadback(cold.diagnostics.readback);

    expect(cold.diagnostics.converged).toBe(true);
    expect(cold.diagnostics.finite).toBe(true);
    expect(Object.keys(rb.internalCoordinates).sort())
      .toEqual(["junctionRadiusM", "septalMidwallCapVolumeM3"]);
    expect(rb.strictLocalStableEquilibrium).toBe(true);
    expect(rb.jacobianSymmetricWithinTolerance).toBe(true);
    expect(rb.totalAlgorithmicStressPrimitiveJ).toBeNull();
    expect(Object.values(cold.transmuralPressuresMmHg).every(Number.isFinite))
      .toBe(true);

    for (const wallId of ["LA", "RA", "LVFW", "SEP", "RVFW"] as const) {
      const wall = wallReadback(rb.wallMaterialReadbackByWall[wallId]);
      expect(wall.passiveModelId).toBe(
        wallId === "LA" || wallId === "RA"
          ? "moyer-2015-atrial-equibiaxial-passive-v1"
          : "equilibrium-one-fiber-passive-log-strain-v1",
      );
      expect(wall.energyLedger.equilibriumPassiveStoredEnergyDensityJPerM3)
        .toBeGreaterThanOrEqual(0);
      expect(wall.energyLedger.slsNextStoredEnergyDensityJPerM3).toBe(0);
      expect(wall.energyLedger.slsPassive).toBe(true);
      expect(wall.coldLandMaximumStateUpdate).not.toBeNull();
      expect(wall.coldLandMaximumStateUpdate!).toBeLessThanOrEqual(1e-10);
      expect(wall.energyLedger.landThermodynamicStoredEnergyClaimed).toBe(false);
      expect(wall.energyLedger.totalThermodynamicPotentialIncludingLandClaimed)
        .toBe(false);
    }

    const nextTimeSec = 0.005;
    const nextDrive = asMainWireFiveWallFreeCalciumDriveV1(
      evaluateFiveWallNormalCalciumDriveV1(nextTimeSec).freeCalciumUMByWall,
    );
    const acceptedBeforeTrial = provider.stateCodec.encode(
      cold.acceptedState.materialState,
    );
    const trial = evaluateWholeHeartMechanicsTrialV1(provider, {
      previousAcceptedState: cold.acceptedState,
      candidateTimeSec: nextTimeSec,
      stepDtSec: nextTimeSec,
      candidateVolumesMl: MAIN_WIRE_NORMAL_ADULT_MECHANICS_FIXTURE_VOLUMES_ML_V1,
      drivingInputs: nextDrive,
    });
    const repeatedTrial = evaluateWholeHeartMechanicsTrialV1(provider, {
      previousAcceptedState: cold.acceptedState,
      candidateTimeSec: nextTimeSec,
      stepDtSec: nextTimeSec,
      candidateVolumesMl: MAIN_WIRE_NORMAL_ADULT_MECHANICS_FIXTURE_VOLUMES_ML_V1,
      drivingInputs: nextDrive,
    });
    expect(trial.diagnostics.converged).toBe(true);
    expect(provider.stateCodec.encode(repeatedTrial.candidateMaterialState))
      .toEqual(provider.stateCodec.encode(trial.candidateMaterialState));
    expect(repeatedTrial.transmuralPressuresMmHg)
      .toEqual(trial.transmuralPressuresMmHg);
    expect(provider.stateCodec.encode(cold.acceptedState.materialState))
      .toEqual(acceptedBeforeTrial);
    const trialReadback = providerReadback(trial.diagnostics.readback);
    for (const wallId of ["LA", "RA", "LVFW", "SEP", "RVFW"] as const) {
      const ledger = wallReadback(
        trialReadback.wallMaterialReadbackByWall[wallId],
      ).energyLedger;
      expect(ledger.slsPreviousStoredEnergyDensityJPerM3).toBeGreaterThanOrEqual(0);
      expect(ledger.slsNextStoredEnergyDensityJPerM3).toBeGreaterThanOrEqual(0);
      expect(ledger.slsPhysicalDissipationIncrementDensityJPerM3)
        .toBeGreaterThanOrEqual(0);
      expect(ledger.slsBackwardEulerNumericalDissipationIncrementDensityJPerM3)
        .toBeGreaterThanOrEqual(0);
      expect(Math.abs(ledger.slsDiscreteEnergyBalanceResidualJPerM3))
        .toBeLessThan(1e-8);
      expect(ledger.slsPassive).toBe(true);
    }
    const accepted = commitWholeHeartMechanicsTrialV1(
      provider,
      cold.acceptedState,
      trial,
    );
    const checkpoint = checkpointWholeHeartMechanicsStateV1(provider, accepted);
    expect(restoreWholeHeartMechanicsStateV1(
      provider,
      JSON.parse(JSON.stringify(checkpoint)) as typeof checkpoint,
    )).toEqual(accepted);
    expect(MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_ADAPTER_V1_CLAIM
      .landThermodynamicStoredEnergyClaimed).toBe(false);
    expect(MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_ADAPTER_V1_CLAIM.providerTopology)
      .toBe("fixed-two-coordinate-TriSeg");
    expect(MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_ADAPTER_V1_CLAIM
      .fullLandKernelOnAllFiveWalls).toBe(true);
    expect(MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_ADAPTER_V1_CLAIM
      .atrialPopulationOnlyReductionApplied).toBe(false);
    expect(MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_ADAPTER_V1_CLAIM
      .externalSeriesElementApplied).toBe(false);
  }, 60_000);

  it("makes the paired LA-only SLS ablation mechanically exact-off", () => {
    const on = createMainWireNormalAdultFiveWallMaterialKernelsV1("on");
    const off = createMainWireNormalAdultFiveWallMaterialKernelsV1("exact-off");
    const cold = off.LA.initializeColdAtFixedInput({
      fiberLogStrain: 0,
      freeCalciumUM: 0.1,
    });
    const trial = off.LA.evaluateTrialFromAccepted({
      previousAcceptedState: cold.state,
      candidateFiberLogStrain: 0.08,
      candidateFreeCalciumUM: 0.1,
      stepDtSec: 0.002,
    });
    const rb = wallReadback(trial.readback);

    expect(Number.isFinite(trial.fiberKirchhoffStressPa)).toBe(true);
    expect(rb.slsOverstressPa).toBe(0);
    expect(rb.energyLedger.slsPreviousStoredEnergyDensityJPerM3).toBe(0);
    expect(rb.energyLedger.slsNextStoredEnergyDensityJPerM3).toBe(0);
    expect(rb.energyLedger.slsPhysicalDissipationIncrementDensityJPerM3).toBe(0);
    expect(rb.energyLedger.slsBackwardEulerNumericalDissipationIncrementDensityJPerM3)
      .toBe(0);
    expect(rb.energyLedger.slsDiscreteEnergyBalanceResidualJPerM3).toBe(0);
    expect(off.LA.parameterIdentityHash).not.toBe(on.LA.parameterIdentityHash);
    expect(off.RA.parameterIdentityHash).toBe(on.RA.parameterIdentityHash);
    expect(off.LVFW.parameterIdentityHash).toBe(on.LVFW.parameterIdentityHash);
  }, 60_000);

  it("matches the canonical consistent-tangent path to a test-only full-FD shadow", () => {
    const fast = createCanonicalMainWireNormalAdultFiveWallProviderV1();
    const shadow = createTestOnlyFullFiniteDifferenceShadowProvider();
    const coldDrive = asMainWireFiveWallFreeCalciumDriveV1(
      evaluateFiveWallNormalCalciumDriveV1(0).freeCalciumUMByWall,
    );
    const fastCold = initializeWholeHeartMechanicsColdV1(fast, {
      timeSec: 0,
      volumesMl: MAIN_WIRE_NORMAL_ADULT_MECHANICS_FIXTURE_VOLUMES_ML_V1,
      drivingInputs: coldDrive,
    });
    const shadowCold = initializeWholeHeartMechanicsColdV1(shadow, {
      timeSec: 0,
      volumesMl: MAIN_WIRE_NORMAL_ADULT_MECHANICS_FIXTURE_VOLUMES_ML_V1,
      drivingInputs: coldDrive,
    });
    const candidateTimeSec = 0.005;
    const candidateDrive = asMainWireFiveWallFreeCalciumDriveV1(
      evaluateFiveWallNormalCalciumDriveV1(candidateTimeSec).freeCalciumUMByWall,
    );
    const fastTrial = evaluateWholeHeartMechanicsTrialV1(fast, {
      previousAcceptedState: fastCold.acceptedState,
      candidateTimeSec,
      stepDtSec: candidateTimeSec,
      candidateVolumesMl: MAIN_WIRE_NORMAL_ADULT_MECHANICS_FIXTURE_VOLUMES_ML_V1,
      drivingInputs: candidateDrive,
    });
    const shadowTrial = evaluateWholeHeartMechanicsTrialV1(shadow, {
      previousAcceptedState: shadowCold.acceptedState,
      candidateTimeSec,
      stepDtSec: candidateTimeSec,
      candidateVolumesMl: MAIN_WIRE_NORMAL_ADULT_MECHANICS_FIXTURE_VOLUMES_ML_V1,
      drivingInputs: candidateDrive,
    });
    const fastReadback = providerReadback(fastTrial.diagnostics.readback);
    const shadowReadback = providerReadback(shadowTrial.diagnostics.readback);
    const pressureTangentShadow = fullResolvedCanonicalPressureVolumeTangent(
      fast,
      fastCold.acceptedState,
      candidateTimeSec,
      candidateDrive,
    );

    expect(fastTrial.diagnostics.converged).toBe(true);
    expect(shadowTrial.diagnostics.converged).toBe(true);
    expect(maximumMatrixRelativeError(
      fastReadback.scaledAlgorithmicJacobianByOneJ,
      shadowReadback.scaledAlgorithmicJacobianByOneJ,
    )).toBeLessThan(1e-4);
    for (const chamber of ["LA", "LV", "RA", "RV"] as const) {
      expect(relativeError(
        fastTrial.transmuralPressuresMmHg[chamber],
        shadowTrial.transmuralPressuresMmHg[chamber],
      )).toBeLessThan(2e-7);
    }
    expect(shadowTrial.transmuralPressureVolumeTangentMmHgPerMl)
      .toBeUndefined();
    expect(fastTrial.transmuralPressureVolumeTangentMmHgPerMl).toBeDefined();
    expect(maximumPressureTangentAbsoluteError(
      fastTrial.transmuralPressureVolumeTangentMmHgPerMl!,
      pressureTangentShadow,
    )).toBeLessThan(2e-5);
    expect(maximumPressureTangentAntisymmetry(
      fastTrial.transmuralPressureVolumeTangentMmHgPerMl!,
    )).toBeLessThan(1e-8);
    expect(Math.abs(
      fastTrial.transmuralPressureVolumeTangentMmHgPerMl!.LV.RV,
    )).toBeGreaterThan(1e-3);
    expect(fastTrial.transmuralPressureVolumeTangentMmHgPerMl!.LA.LV).toBe(0);
    expect(fastTrial.transmuralPressureVolumeTangentMmHgPerMl!.LV.LA).toBe(0);
  }, 60_000);
});

function createTestOnlyFullFiniteDifferenceShadowProvider() {
  const prior = NORMAL_ADULT_FIVE_WALL_PRIOR_V1;
  const canonical = createMainWireNormalAdultFiveWallMaterialKernelsV1();
  const materialByWall = Object.freeze(Object.fromEntries(
    (["LA", "LVFW", "SEP", "RVFW", "RA"] as const).map((wallId) => [
      wallId,
      stripConsistentTangent(canonical[wallId]),
    ]),
  )) as MainWireFiveWallRecordV1<
    MainWireFiveWallLandSlsMaterialKernelV1<LandSlsWallMaterialStateV1>
  >;
  return createMainWireFiveWallLandTriSegProviderV1(Object.freeze({
    parameterSetId: `${prior.priorId}-test-only-full-fd-shadow`,
    materialByWall,
    atria: Object.freeze({
      LA: Object.freeze({
        wallMaterialVolumeM3:
          prior.anatomy.atria.LA.wallMaterialVolumeMl * 1e-6,
        referenceCavityBloodVolumeM3:
          prior.anatomy.atria.LA.inverseUnloadedReferenceCavityVolumeMl * 1e-6,
      }),
      RA: Object.freeze({
        wallMaterialVolumeM3:
          prior.anatomy.atria.RA.wallMaterialVolumeMl * 1e-6,
        referenceCavityBloodVolumeM3:
          prior.anatomy.atria.RA.inverseUnloadedReferenceCavityVolumeMl * 1e-6,
      }),
    }),
    trisegWalls: prior.anatomy.triSeg.wallGeometryParameters,
    initialTriSegCoordinates: prior.anatomy.triSeg.loadedCoordinates,
    internalCoordinateScales: Object.freeze({
      septalMidwallCapVolumeM3:
        Math.abs(prior.anatomy.triSeg.loadedCoordinates.septalMidwallCapVolumeM3),
      junctionRadiusM: prior.anatomy.triSeg.loadedCoordinates.junctionRadiusM,
    }),
    solver: Object.freeze({
      finiteDifferenceScaledStep:
        MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_NOMINAL_JACOBIAN_SCALED_STEP_V1,
    }),
  }));
}

function stripConsistentTangent(
  kernel: MainWireFiveWallLandSlsMaterialKernelV1<LandSlsWallMaterialStateV1>,
): MainWireFiveWallLandSlsMaterialKernelV1<LandSlsWallMaterialStateV1> {
  return Object.freeze({
    ...kernel,
    evaluateTrialFromAccepted: (input) => {
      const evaluated = kernel.evaluateTrialFromAccepted(input);
      const { algorithmicFiberTangentPa: _ignored, ...fullFdEvaluation } =
        evaluated;
      return Object.freeze(fullFdEvaluation);
    },
  });
}

function providerReadback(
  value: WholeHeartMechanicsSerializableValueV1 | null,
): MainWireFiveWallLandTriSegReadbackV1 {
  return value as unknown as MainWireFiveWallLandTriSegReadbackV1;
}

function wallReadback(
  value: WholeHeartMechanicsSerializableValueV1 | null,
): MainWireNormalAdultWallMaterialReadbackV1 {
  return value as unknown as MainWireNormalAdultWallMaterialReadbackV1;
}

function maximumMatrixRelativeError(
  left: readonly (readonly number[])[],
  right: readonly (readonly number[])[],
): number {
  return Math.max(...left.flatMap((row, rowIndex) =>
    row.map((value, columnIndex) =>
      relativeError(value, right[rowIndex]![columnIndex]!))));
}

function relativeError(left: number, right: number): number {
  return Math.abs(left - right) / Math.max(1, Math.abs(left), Math.abs(right));
}

function fullResolvedCanonicalPressureVolumeTangent(
  provider: ReturnType<typeof createCanonicalMainWireNormalAdultFiveWallProviderV1>,
  acceptedState: Parameters<
    ReturnType<
      typeof createCanonicalMainWireNormalAdultFiveWallProviderV1
    >["evaluateTrial"]
  >[0]["previousAcceptedState"],
  candidateTimeSec: number,
  drivingInputs: ReturnType<typeof asMainWireFiveWallFreeCalciumDriveV1>,
): WholeHeartMechanicsPressureVolumeTangentMmHgPerMlV1 {
  const chambers = ["LA", "LV", "RA", "RV"] as const;
  const stepMl = 0.001;
  return Object.fromEntries(chambers.map((row) => [
    row,
    Object.fromEntries(chambers.map((column) => {
      const lowerVolumes = {
        ...MAIN_WIRE_NORMAL_ADULT_MECHANICS_FIXTURE_VOLUMES_ML_V1,
        [column]:
          MAIN_WIRE_NORMAL_ADULT_MECHANICS_FIXTURE_VOLUMES_ML_V1[column]
          - stepMl,
      };
      const upperVolumes = {
        ...MAIN_WIRE_NORMAL_ADULT_MECHANICS_FIXTURE_VOLUMES_ML_V1,
        [column]:
          MAIN_WIRE_NORMAL_ADULT_MECHANICS_FIXTURE_VOLUMES_ML_V1[column]
          + stepMl,
      };
      const lower = evaluateWholeHeartMechanicsTrialV1(provider, {
        previousAcceptedState: acceptedState,
        candidateTimeSec,
        stepDtSec: candidateTimeSec - acceptedState.acceptedTimeSec,
        candidateVolumesMl: lowerVolumes,
        drivingInputs,
      });
      const upper = evaluateWholeHeartMechanicsTrialV1(provider, {
        previousAcceptedState: acceptedState,
        candidateTimeSec,
        stepDtSec: candidateTimeSec - acceptedState.acceptedTimeSec,
        candidateVolumesMl: upperVolumes,
        drivingInputs,
      });
      return [column, (
        upper.transmuralPressuresMmHg[row]
        - lower.transmuralPressuresMmHg[row]
      ) / (2 * stepMl)];
    })),
  ])) as WholeHeartMechanicsPressureVolumeTangentMmHgPerMlV1;
}

function maximumPressureTangentAbsoluteError(
  left: WholeHeartMechanicsPressureVolumeTangentMmHgPerMlV1,
  right: WholeHeartMechanicsPressureVolumeTangentMmHgPerMlV1,
): number {
  const chambers = ["LA", "LV", "RA", "RV"] as const;
  return Math.max(...chambers.flatMap((row) => chambers.map((column) =>
    Math.abs(left[row][column] - right[row][column]))));
}

function maximumPressureTangentAntisymmetry(
  tangent: WholeHeartMechanicsPressureVolumeTangentMmHgPerMlV1,
): number {
  const chambers = ["LA", "LV", "RA", "RV"] as const;
  return Math.max(...chambers.flatMap((row) => chambers.map((column) =>
    Math.abs(tangent[row][column] - tangent[column][row]))));
}
