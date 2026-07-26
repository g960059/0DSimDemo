import { describe, expect, it } from "vitest";

import {
  NORMAL_CORONARY_DISEASE_INPUT_V2,
} from "@/engine/coronary/backwardEulerCoronaryNetworkV2";
import {
  NORMAL_ADULT_CORONARY_SHORTENING_IMP_GAIN_PRIOR_V2,
} from "@/engine/coronary/mainWireCoronaryBoundaryV2";
import {
  MAIN_WIRE_PROVISIONAL_NORMAL_ADULT_CORONARY_COLLAPSE_V2,
  MAIN_WIRE_PROVISIONAL_NORMAL_ADULT_CORONARY_PRIOR_V2,
} from "@/engine/coronary/mainWireNormalAdultCoronaryV2";
import {
  createDynamicMechanicalSupportDeviceProfileBindingV1,
  createDynamicMechanicalSupportInertanceProfileV1,
  type DynamicMechanicalSupportInertanceProfileV1,
} from "@/engine/devices/dynamicNetworkV1";
import {
  DYNAMIC_ROTARY_PUMP_UNIT_SYSTEM_V1_ID,
  type DynamicRotaryPumpCircuitInertanceV1,
} from "@/engine/devices/dynamicRotaryPumpV1";
import {
  HEARTMATE_II_LITERATURE_CIRCUIT_INERTANCE_V1,
} from "@/engine/devices/defaultsV1";
import { mechanicalSupportPresetV1 } from "@/engine/devices/presetsV1";
import type { RotarySupportDeviceIdV1 } from "@/engine/devices/typesV1";
import {
  checkpointMainWireIntegratedModelV1,
  restoreMainWireIntegratedModelV1,
} from "@/engine/myocardium/MainWireIntegratedModelCheckpointV1";
import {
  initializeMainWireIntegratedModelV1,
  maximumMainWireIntegratedModelStepDurationV1,
  stepMainWireIntegratedModelV1,
} from "@/engine/myocardium/MainWireIntegratedModelTransactionV1";
import {
  FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import {
  MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CORONARY_CIRCULATION_NEWTON_POLICY_V2,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallCoronaryPeriodicSteadyV2";
import {
  normalAdultMainWireRuntimeV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallClosedLoopV1";
import {
  MAIN_WIRE_NORMAL_ADULT_BLOOD_VOLUME_PROVENANCE_V1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultBloodVolumeOperatingPointV1";
import {
  createMainWireNormalAdultCommonPericardiumV1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultCommonPericardiumV1";
import {
  createCanonicalMainWireNormalAdultFiveWallProviderV1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";
import {
  createPeriodicSinusFiveWallRhythmCalciumReplayV1,
} from "@/engine/myocardium/rhythm/acceptedFiveWallRhythmCalciumOwnerV1";

const DT_SEC = 0.002;
const CYCLE_SEC = 1;
const STEPS_PER_CYCLE = CYCLE_SEC / DT_SEC;

describe("integrated model V1 canonical-provider bounded smoke", () => {
  it("advances coronary, rhythm, and a dynamic HeartMate-II circuit atomically and resumes exactly", async () => {
    const provider = createCanonicalMainWireNormalAdultFiveWallProviderV1();
    const runtime = normalAdultMainWireRuntimeV1();
    const pericardium = createMainWireNormalAdultCommonPericardiumV1();
    const rhythmReplay = createPeriodicSinusFiveWallRhythmCalciumReplayV1(
      FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
      {
        scheduleId: "integrated-real-provider-sinus-schedule-v1",
        bindingId: "integrated-real-provider-sinus-binding-v1",
        acceptedTimeSec: 0,
        endTimeSec: CYCLE_SEC,
        revision: 0,
      },
    );
    const dynamicProfile = heartMateIiOnlyTestProfile();
    const config = mechanicalSupportPresetV1("lvad-hmii-9000");
    const rhythm = Object.freeze({
      binding: rhythmReplay.binding,
      schedule: rhythmReplay.schedule,
    });
    const dynamicMechanicalSupport = Object.freeze({
      config,
      heartRateBpm: 60,
      profile: dynamicProfile,
    });
    const coronaryStepInput = Object.freeze({
      runtime,
      calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
      pericardium,
      coronaryPrior: MAIN_WIRE_PROVISIONAL_NORMAL_ADULT_CORONARY_PRIOR_V2,
      coronaryDisease: NORMAL_CORONARY_DISEASE_INPUT_V2,
      collapseHydraulics:
        MAIN_WIRE_PROVISIONAL_NORMAL_ADULT_CORONARY_COLLAPSE_V2,
      impMechanism: "cep-shortening-induced" as const,
      shorteningImpPrior:
        NORMAL_ADULT_CORONARY_SHORTENING_IMP_GAIN_PRIOR_V2,
      circulationNewtonOptions:
        MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CORONARY_CIRCULATION_NEWTON_POLICY_V2,
    });
    const cold = initializeMainWireIntegratedModelV1({
      coronary: {
        provider,
        runtime,
        calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
        pericardium,
        coronaryPrior: MAIN_WIRE_PROVISIONAL_NORMAL_ADULT_CORONARY_PRIOR_V2,
        coronaryDisease: NORMAL_CORONARY_DISEASE_INPUT_V2,
        collapseHydraulics:
          MAIN_WIRE_PROVISIONAL_NORMAL_ADULT_CORONARY_COLLAPSE_V2,
        impMechanism: "cep-shortening-induced" as const,
        shorteningImpPrior:
          NORMAL_ADULT_CORONARY_SHORTENING_IMP_GAIN_PRIOR_V2,
        fixedGlobalTotalBloodVolumeMl:
          MAIN_WIRE_NORMAL_ADULT_BLOOD_VOLUME_PROVENANCE_V1
            .fullGraphReferenceTotalBloodVolumeMl,
        autoregulationWindow: Object.freeze({
          durationSec: CYCLE_SEC,
          interpretation: "periodic-sinus-cycle-aligned" as const,
        }),
      },
      rhythm: {
        ...rhythm,
        acceptedState: rhythmReplay.acceptedState,
      },
      dynamicMechanicalSupport,
    });

    let uninterrupted = cold.acceptedState;
    let mid: typeof uninterrupted | null = null;
    let maximumBloodVolumeErrorMl = 0;
    let maximumCoronaryLedgerResidualMl = 0;
    let maximumMcsConservationResidualMlPerSec = 0;
    for (let stepIndex = 1; stepIndex <= STEPS_PER_CYCLE; stepIndex += 1) {
      const targetTimeSec = stepIndex * DT_SEC;
      const requestedStepSec = targetTimeSec - uninterrupted.acceptedTimeSec;
      const maximum = maximumMainWireIntegratedModelStepDurationV1(
        uninterrupted,
        requestedStepSec,
        rhythm,
        dynamicProfile,
        dynamicMechanicalSupport.config,
      );
      expect(maximum.maximumStepSec).toBeCloseTo(requestedStepSec, 14);
      const stepped = stepMainWireIntegratedModelV1(
        provider,
        uninterrupted,
        {
          dtSec: maximum.maximumStepSec,
          coronary: coronaryStepInput,
          rhythm,
          dynamicMechanicalSupport,
        },
      );
      expect(stepped.converged).toBe(true);
      if (stepped.converged === false) throw new Error(stepped.message);
      uninterrupted = stepped.acceptedState;
      maximumBloodVolumeErrorMl = Math.max(
        maximumBloodVolumeErrorMl,
        Math.abs(
          stepped.coronaryStep.baseStep.circulationTrial.diagnostics
            .totalBloodVolumeErrorMl,
        ),
      );
      maximumCoronaryLedgerResidualMl = Math.max(
        maximumCoronaryLedgerResidualMl,
        Math.abs(
          stepped.coronaryStep.baseStep.coronaryTrial.diagnostics
            .exactBloodVolumeLedgerResidualMl,
        ),
      );
      maximumMcsConservationResidualMlPerSec = Math.max(
        maximumMcsConservationResidualMlPerSec,
        Math.abs(
          stepped.dynamicMechanicalSupportTrial.conservationResidualMlPerSec,
        ),
      );
      if (stepIndex === STEPS_PER_CYCLE / 2) mid = uninterrupted;
    }

    expect(mid).not.toBeNull();
    if (mid === null) throw new Error("mid-cycle state was not captured");
    const checkpointContext = Object.freeze({
      provider,
      coronaryPrior: MAIN_WIRE_PROVISIONAL_NORMAL_ADULT_CORONARY_PRIOR_V2,
      collapseHydraulics:
        MAIN_WIRE_PROVISIONAL_NORMAL_ADULT_CORONARY_COLLAPSE_V2,
      impMechanism: "cep-shortening-induced" as const,
      shorteningImpPrior:
        NORMAL_ADULT_CORONARY_SHORTENING_IMP_GAIN_PRIOR_V2,
      coronaryAutoregulationBinding: mid.coronary.coronaryAutoregulationBinding,
      rhythm,
      dynamicMechanicalSupportProfile: dynamicProfile,
      dynamicMechanicalSupportConfig: dynamicMechanicalSupport.config,
    });
    const checkpoint = await checkpointMainWireIntegratedModelV1(
      checkpointContext,
      mid,
    );
    let resumed = await restoreMainWireIntegratedModelV1(
      checkpointContext,
      JSON.parse(JSON.stringify(checkpoint)),
    );
    for (
      let stepIndex = STEPS_PER_CYCLE / 2 + 1;
      stepIndex <= STEPS_PER_CYCLE;
      stepIndex += 1
    ) {
      const targetTimeSec = stepIndex * DT_SEC;
      const requestedStepSec = targetTimeSec - resumed.acceptedTimeSec;
      const maximum = maximumMainWireIntegratedModelStepDurationV1(
        resumed,
        requestedStepSec,
        rhythm,
        dynamicProfile,
        dynamicMechanicalSupport.config,
      );
      const stepped = stepMainWireIntegratedModelV1(provider, resumed, {
        dtSec: maximum.maximumStepSec,
        coronary: coronaryStepInput,
        rhythm,
        dynamicMechanicalSupport,
      });
      if (stepped.converged === false) throw new Error(stepped.message);
      resumed = stepped.acceptedState;
    }

    expect(resumed).toEqual(uninterrupted);
    expect(uninterrupted.revision).toBe(STEPS_PER_CYCLE);
    expect(uninterrupted.acceptedTimeSec).toBe(CYCLE_SEC);
    expect(uninterrupted.coronary.coronaryAutoregulation).toMatchObject({
      windowIndex: 1,
      acceptedDurationSec: 0,
      acceptedStepCount: 0,
      windowControl: null,
    });
    expect(uninterrupted.rhythmCalcium.rhythmSchedule.cursor)
      .toBe(rhythmReplay.schedule.eventCount);
    const terminalLvadFlowMlPerSec = uninterrupted.dynamicMechanicalSupport
      .acceptedFlowMlPerSec.LVAD;
    expect(Number.isFinite(terminalLvadFlowMlPerSec)).toBe(true);
    expect(Math.abs(terminalLvadFlowMlPerSec)).toBeGreaterThan(1e-6);
    // HMII capacity is an evidence-domain readback, not an instantaneous clamp.
    expect(config.lvad.maximumForwardFlowLMin).toBeNull();
    expect(config.lvad.forwardFlowEvidenceDomain).toEqual({
      publishedExperimentalTraversalUpperLMin: 9,
      advertisedCapacityLMin: 10,
    });
    expect(maximumBloodVolumeErrorMl).toBeLessThan(1e-8);
    expect(maximumCoronaryLedgerResidualMl).toBeLessThan(1e-10);
    expect(maximumMcsConservationResidualMlPerSec).toBeLessThan(1e-12);
  }, 30_000);
});

function heartMateIiOnlyTestProfile():
DynamicMechanicalSupportInertanceProfileV1 {
  const zero = Object.freeze({
    unitSystemId: DYNAMIC_ROTARY_PUMP_UNIT_SYSTEM_V1_ID,
    pumpInternalMmHgSec2PerMl: 0,
    drainageMmHgSec2PerMl: 0,
    oxygenatorMmHgSec2PerMl: 0,
    returnPathMmHgSec2PerMl: 0,
  }) satisfies DynamicRotaryPumpCircuitInertanceV1;
  return createDynamicMechanicalSupportInertanceProfileV1({
    profileId: "heartmate-ii-literature-r-l-real-provider-smoke-not-release-approved",
    profileBindingSha256: "a".repeat(64),
    deviceProfileBindingByDevice: Object.freeze({
      LVAD: binding("LVAD", "1"),
      IMPELLA: binding("IMPELLA", "2"),
      VA_ECMO: binding("VA_ECMO", "3"),
      VV_ECMO: binding("VV_ECMO", "4"),
    }),
    inertanceByDevice: Object.freeze({
      LVAD: HEARTMATE_II_LITERATURE_CIRCUIT_INERTANCE_V1,
      IMPELLA: zero,
      VA_ECMO: zero,
      VV_ECMO: zero,
    }),
  });
}

function binding(deviceId: RotarySupportDeviceIdV1, digit: string) {
  return createDynamicMechanicalSupportDeviceProfileBindingV1({
    deviceId,
    circuitProfileId:
      `integrated-real-provider-${deviceId.toLowerCase()}-smoke-not-approved`,
    circuitProfileBindingSha256: digit.repeat(64),
  });
}
