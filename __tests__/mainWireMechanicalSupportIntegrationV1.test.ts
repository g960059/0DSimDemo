import { describe, expect, it } from "vitest";

import {
  createMechanicalSupportConfigV1,
  defaultMechanicalSupportConfigV1,
} from "@/engine/devices/defaultsV1";
import {
  runMainWireMechanicalSupportSimulationV1,
} from "@/engine/devices/MainWireMechanicalSupportSimulationV1";
import { mechanicalSupportPresetV1 } from "@/engine/devices/presetsV1";
import {
  initializeMainWireFiveWallNonCoronaryV1,
  stepMainWireFiveWallNonCoronaryV1,
} from "@/engine/myocardium/MainWireFiveWallNonCoronaryTransactionV1";
import {
  FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import {
  normalAdultMainWireRuntimeV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallClosedLoopV1";
import {
  createMainWireNormalAdultCommonPericardiumV1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultCommonPericardiumV1";
import {
  createCanonicalMainWireNormalAdultFiveWallProviderV1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";

const DT_SEC = 0.002;

describe("main-wire mechanical-support transaction integration V1", () => {
  it("is bit-exact for the all-off device extension", () => {
    const withoutDevices = oneStep(undefined);
    const allOff = oneStep({
      config: defaultMechanicalSupportConfigV1(),
      heartRateBpm: 60,
    });
    expect(withoutDevices.converged).toBe(true);
    expect(allOff.converged).toBe(true);
    if (!withoutDevices.converged || !allOff.converged) return;
    expect(allOff.acceptedState).toEqual(withoutDevices.acceptedState);
    expect(allOff.circulationTrial.candidateNodeVolumesMl)
      .toEqual(withoutDevices.circulationTrial.candidateNodeVolumesMl);
    expect(allOff.circulationTrial.nodeAbsolutePressuresMmHg)
      .toEqual(withoutDevices.circulationTrial.nodeAbsolutePressuresMmHg);
    expect(allOff.circulationTrial.edgeFlowsMlPerSec)
      .toEqual(withoutDevices.circulationTrial.edgeFlowsMlPerSec);
    expect(allOff.circulationTrial.mechanicalSupport).toBeDefined();
    expect(withoutDevices.circulationTrial.mechanicalSupport).toBeUndefined();
  });

  it("couples an LVAD candidate conservatively with the semismooth Jacobian", () => {
    const config = createMechanicalSupportConfigV1({
      lvad: { enabled: true, speedRpm: 4_500 },
    });
    const result = oneStep({ config, heartRateBpm: 60 }, true);
    expect(result.converged).toBe(true);
    if (!result.converged) return;
    const support = result.circulationTrial.mechanicalSupport!;
    expect(support.pump.LVAD.flowLMin).toBeGreaterThan(0);
    expect(support.nodeNetVolumeRateMlPerSec.LV).toBeLessThan(0);
    expect(support.nodeNetVolumeRateMlPerSec.Ao).toBeGreaterThan(0);
    expect(Math.abs(support.conservationResidualMlPerSec)).toBeLessThan(1e-12);
    expect(Math.abs(result.circulationTrial.diagnostics.totalBloodVolumeErrorMl))
      .toBeLessThan(1e-8);
    expect(result.circulationTrial.diagnostics.jacobianMode)
      .toBe("analytic-semismooth");
    expect(result.circulationTrial.diagnostics.finiteDifferenceJacobianFallbackReason)
      .toBeNull();
    expect(result.circulationTrial.diagnostics.finiteDifferenceJacobianShadowCount)
      .toBeGreaterThan(0);
    expect(result.circulationTrial.diagnostics
      .jacobianMaximumRelativeFrobeniusShadowDifference)
      .toBeLessThan(2e-5);
  });

  it("represents IABP as blood-volume-neutral aortic displacement", () => {
    const config = createMechanicalSupportConfigV1({
      iabp: {
        enabled: true,
        assistRatio: 1,
        inflationPhase01: 0.001,
        deflationPhase01: 0.9,
        inflationDurationSec: 0.0001,
      },
    });
    const result = oneStep({ config, heartRateBpm: 60 });
    expect(result.converged).toBe(true);
    if (!result.converged) return;
    const support = result.circulationTrial.mechanicalSupport!;
    expect(support.iabp.balloonVolumeMl).toBeGreaterThan(39);
    expect(Object.values(support.nodeNetVolumeRateMlPerSec)
      .every((value) => value === 0)).toBe(true);
    expect(Math.abs(result.circulationTrial.diagnostics.totalBloodVolumeErrorMl))
      .toBeLessThan(1e-8);
  });

  it("rejects malformed support controls without publishing either state", () => {
    const malformed = {
      ...defaultMechanicalSupportConfigV1(),
      lvad: {
        ...defaultMechanicalSupportConfigV1().lvad,
        enabled: true,
        speedRpm: Number.NaN,
      },
    } as ReturnType<typeof defaultMechanicalSupportConfigV1>;
    const result = oneStep({ config: malformed, heartRateBpm: 60 });
    expect(result.converged).toBe(false);
    if (result.converged !== false) return;
    expect(result.circulationFailureReason).toBe("invalid-input");
    expect(result.rollbackState.revision).toBe(0);
    expect(result.circulationCommitted).toBe(false);
    expect(result.mechanicsCommitted).toBe(false);
  });

  it("runs the reproducible baseline-to-support scenario envelope", () => {
    const result = runMainWireMechanicalSupportSimulationV1({
      patientCaseId: "lv-systolic-failure",
      support: mechanicalSupportPresetV1("impella-cp-p6"),
      dtSec: 0.005,
      baselineBeats: 1,
      supportBeats: 1,
      sampleEverySteps: 2,
    });
    expect(result.completed).toBe(true);
    expect(result.failure).toBeNull();
    expect(result.baselineMetrics).not.toBeNull();
    expect(result.supportMetrics).not.toBeNull();
    expect(result.supportMetrics!.meanPumpFlowLMin.IMPELLA).toBeGreaterThan(0);
    expect(result.supportMetrics!.maximumAbsoluteTotalBloodVolumeErrorMl)
      .toBeLessThan(1e-8);
    expect(result.claim.parameterFittingToOutputWaveforms).toBe(false);
  });
});

function oneStep(
  mechanicalSupport: Parameters<
    typeof stepMainWireFiveWallNonCoronaryV1
  >[2]["mechanicalSupport"],
  auditJacobian = false,
) {
  const provider = createCanonicalMainWireNormalAdultFiveWallProviderV1("on");
  const runtime = normalAdultMainWireRuntimeV1();
  const pericardium = createMainWireNormalAdultCommonPericardiumV1(
    "on",
    "healthy-slack",
  );
  const cold = initializeMainWireFiveWallNonCoronaryV1({
    provider,
    runtime,
    calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
    pericardium,
  });
  return stepMainWireFiveWallNonCoronaryV1(provider, cold.acceptedState, {
    dtSec: DT_SEC,
    runtime,
    calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
    pericardium,
    mechanicalSupport,
    circulationNewtonOptions: auditJacobian
      ? { analyticJacobianFiniteDifferenceShadow: true }
      : undefined,
  });
}
