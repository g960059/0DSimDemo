import { describe, expect, it } from "vitest";

import {
  evaluateFiveWallNormalCalciumDriveV1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import type {
  MainWireFiveWallLandTriSegReadbackV1,
} from "@/engine/myocardium/mechanics/MainWireFiveWallLandTriSegProviderV1";
import {
  MAIN_WIRE_NORMAL_ADULT_COLD_VOLUMES_ML_V1,
  MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_ADAPTER_V1_CLAIM,
  asMainWireFiveWallFreeCalciumDriveV1,
  createCanonicalMainWireNormalAdultFiveWallProviderV1,
  createMainWireNormalAdultFiveWallMaterialKernelsV1,
  type MainWireNormalAdultWallMaterialReadbackV1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";
import {
  checkpointWholeHeartMechanicsStateV1,
  commitWholeHeartMechanicsTrialV1,
  evaluateWholeHeartMechanicsTrialV1,
  initializeWholeHeartMechanicsColdV1,
  restoreWholeHeartMechanicsStateV1,
  type WholeHeartMechanicsSerializableValueV1,
} from "@/engine/myocardium/wholeHeartMechanicsContractV1";

describe("main-wire normal-adult five-wall provider adapter V1", () => {
  it("cold-starts the canonical actual Land/SLS/Moyer/Klotz provider", () => {
    const provider = createCanonicalMainWireNormalAdultFiveWallProviderV1();
    const coldDrive = asMainWireFiveWallFreeCalciumDriveV1(
      evaluateFiveWallNormalCalciumDriveV1(0).freeCalciumUMByWall,
    );
    const cold = initializeWholeHeartMechanicsColdV1(provider, {
      timeSec: 0,
      volumesMl: MAIN_WIRE_NORMAL_ADULT_COLD_VOLUMES_ML_V1,
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
    expect(rb.triseg.bendingStoredEnergyJ).toBe(0);
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
      candidateVolumesMl: MAIN_WIRE_NORMAL_ADULT_COLD_VOLUMES_ML_V1,
      drivingInputs: nextDrive,
    });
    const repeatedTrial = evaluateWholeHeartMechanicsTrialV1(provider, {
      previousAcceptedState: cold.acceptedState,
      candidateTimeSec: nextTimeSec,
      stepDtSec: nextTimeSec,
      candidateVolumesMl: MAIN_WIRE_NORMAL_ADULT_COLD_VOLUMES_ML_V1,
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
});

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
