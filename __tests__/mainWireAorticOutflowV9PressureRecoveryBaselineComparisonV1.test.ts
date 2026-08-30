import { describe, expect, it } from "vitest";

import {
  compareMainWireAorticOutflowV9PressureRecoveryBaselineV1,
  evaluateMainWireAorticOutflowV9ForwardStationSampleV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowV9PressureRecoveryBaselineComparisonV1";
import {
  MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V9 as CANDIDATE,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowPhysiologyCandidateV9";
import {
  MAIN_WIRE_AORTIC_OUTFLOW_V9_PRESSURE_RECOVERY_BASELINE_ARM_IDS_V1,
  resolveMainWireAorticOutflowV9PressureRecoveryBaselineArmV1,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowV9PressureRecoveryBaselineAblationV1";
import {
  runMainWireNormalAdultFiveWallAorticOutflowLandCoppiniSourceTraceWindkesselResearchV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";
import {
  idealBernoulliLossFromEffectiveOrificeAreaV2,
} from "@/engine/valves/MainWireQuasiSteadyOrificeValveV2";
import type {
  MainWireAorticValveResearchProfileIdV1,
} from "@/engine/valves/MainWireAorticValvePressureRecoveryAblationV1";

describe("main-wire V9 pressure-station and recovery baseline comparison V1", () => {
  it("separates valve, characteristic, recovered-static, and Doppler stations", () => {
    const flowMlPerSec = 500;
    const activeEoaCm2 = 3.5;
    const sourceResistance = 0.0015;
    const characteristicResistance = 0.035;
    const lvPressureMmHg = 110;
    const reservoirPressureMmHg = 80;
    const fullPortGradientMmHg = sourceResistance * flowMlPerSec
      + idealBernoulliLossFromEffectiveOrificeAreaV2(activeEoaCm2)
        * flowMlPerSec ** 2;
    const off = evaluateMainWireAorticOutflowV9ForwardStationSampleV1({
      flowMlPerSec,
      activeEoaCm2,
      leftVentricularPressureMmHg: lvPressureMmHg,
      aorticReservoirNodePressureMmHg: reservoirPressureMmHg,
      rawNodeGradientMmHg:
        characteristicResistance * flowMlPerSec + fullPortGradientMmHg,
      sourceValveLinearResistanceMmHgSecPerMl: sourceResistance,
      proximalCharacteristicResistanceMmHgSecPerMl:
        characteristicResistance,
      exactForwardPortMode: "full-vena-contracta-drop",
    });
    const recoveredRawGradientMmHg = characteristicResistance * flowMlPerSec
      + off.recoveredStaticPortGradientMmHg;
    const on = evaluateMainWireAorticOutflowV9ForwardStationSampleV1({
      flowMlPerSec,
      activeEoaCm2,
      leftVentricularPressureMmHg: lvPressureMmHg,
      aorticReservoirNodePressureMmHg: reservoirPressureMmHg,
      rawNodeGradientMmHg: recoveredRawGradientMmHg,
      sourceValveLinearResistanceMmHgSecPerMl: sourceResistance,
      proximalCharacteristicResistanceMmHgSecPerMl:
        characteristicResistance,
      exactForwardPortMode:
        "garcia-energy-loss-plus-downstream-kinetic-flux",
    });

    expect(off.proximalCharacteristicPressureMmHg).toBe(17.5);
    expect(off.exactValvePortGradientMmHg).toBeCloseTo(
      off.fullVenaContractaPortGradientMmHg,
      12,
    );
    expect(on.exactValvePortGradientMmHg).toBeCloseTo(
      on.recoveredStaticPortGradientMmHg,
      12,
    );
    expect(on.recoveredStaticPortGradientMmHg)
      .toBeLessThan(off.fullVenaContractaPortGradientMmHg);
    expect(on.lvotCorrectedDopplerGradientMmHg)
      .toBeLessThan(on.simplifiedDopplerGradientMmHg);
    expect(off.exactPortReconstructionResidualMmHg).toBeCloseTo(0, 12);
    expect(on.exactPortReconstructionResidualMmHg).toBeCloseTo(0, 12);
    expect(off.exactPowerReconstructionResidualMmHgMlPerSec)
      .toBeCloseTo(0, 9);
    expect(on.exactPowerReconstructionResidualMmHgMlPerSec)
      .toBeCloseTo(0, 9);
  });

  it("runs only the bounded-memory recovery composition on the frozen V9 factors", () => {
    const inputs = MAIN_WIRE_AORTIC_OUTFLOW_V9_PRESSURE_RECOVERY_BASELINE_ARM_IDS_V1
      .map((armId) => {
        const arm =
          resolveMainWireAorticOutflowV9PressureRecoveryBaselineArmV1(armId);
        const run = runCandidate(arm.pressureRecoveryProfileId);
        return Object.freeze({ arm, run });
      });
    const comparison =
      compareMainWireAorticOutflowV9PressureRecoveryBaselineV1(inputs);

    expect(comparison.allExpectedArmsPresent).toBe(true);
    expect(comparison.allProtocolIdentitiesDistinct).toBe(true);
    expect(comparison.allExactStationResidualsWithinTolerance).toBe(true);
    expect(comparison.arms).toHaveLength(2);
    expect(comparison.arms[0]!.pressureStations.exactForwardPortMode)
      .toBe("full-vena-contracta-drop");
    expect(comparison.arms[1]!.pressureStations.exactForwardPortMode)
      .toBe("garcia-energy-loss-plus-downstream-kinetic-flux");
    expect(comparison.arms[1]!.pressureStations.timeMeanGradientMmHg
      .exactLvMinusProximalPort)
      .toBeLessThan(comparison.arms[0]!.pressureStations.timeMeanGradientMmHg
        .exactLvMinusProximalPort);
    expect(comparison.experimentClaim.acceptedStateOrCheckpointTopologyChanged)
      .toBe(false);
    expect(comparison.analysisClaim.characteristicPressureIsArterialNotValvular)
      .toBe(true);

    expect(() => runCandidate(
      "pressure-recovery-aa-d3p0cm-instantaneous-opening",
    )).toThrow(/combines only with bounded-memory Garcia pressure recovery/);
  });
});

function runCandidate(
  pressureRecoveryProfileId: MainWireAorticValveResearchProfileIdV1 | null,
) {
  return runMainWireNormalAdultFiveWallAorticOutflowLandCoppiniSourceTraceWindkesselResearchV1(
    { dtSec: 0.02, maximumBeatCount: 1 },
    CANDIDATE.kuwProfileId,
    CANDIDATE.complianceProfileId,
    CANDIDATE.characteristicResistancePlacementProfileId,
    CANDIDATE.rootInertanceProfileId,
    CANDIDATE.sarcomereReferenceProfileId,
    CANDIDATE.calciumSensitivityLengthProfileId,
    CANDIDATE.twitchRetentionCandidateId,
    "baseline",
    "baseline",
    CANDIDATE.trefForceLoadProfileId,
    CANDIDATE.sourceVelocityDistortionProfileId,
    CANDIDATE.strongBridgeDeactivationExitProfileId,
    CANDIDATE.atrioventricularDelayProfileId,
    pressureRecoveryProfileId,
  );
}
