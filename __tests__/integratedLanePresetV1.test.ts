import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { NORMAL_CORONARY_DISEASE_INPUT_V2 } from
  "@/engine/coronary/backwardEulerCoronaryNetworkV2";
import { NORMAL_ADULT_CORONARY_SHORTENING_IMP_GAIN_PRIOR_V2 } from
  "@/engine/coronary/mainWireCoronaryBoundaryV2";
import {
  MAIN_WIRE_PROVISIONAL_NORMAL_ADULT_CORONARY_COLLAPSE_V2,
  MAIN_WIRE_PROVISIONAL_NORMAL_ADULT_CORONARY_PRIOR_V2,
} from "@/engine/coronary/mainWireNormalAdultCoronaryV2";
import { HEARTMATE_II_LITERATURE_CIRCUIT_INERTANCE_V1 } from
  "@/engine/devices/defaultsV1";
import {
  createDynamicMechanicalSupportDeviceProfileBindingV1,
  createDynamicMechanicalSupportInertanceProfileV1,
  validateDynamicMechanicalSupportInertanceProfileV1,
} from "@/engine/devices/dynamicNetworkV1";
import { ROTARY_SUPPORT_DEVICE_IDS_V1 } from "@/engine/devices/typesV1";
import {
  INTEGRATED_LANE_DYNAMIC_MCS_CIRCUIT_PROFILE_ID_BY_DEVICE_V1,
  INTEGRATED_LANE_DYNAMIC_MCS_PROFILE_ID_V1,
  INTEGRATED_LANE_RHYTHM_ID_PREFIX_V1,
  INTEGRATED_LANE_RHYTHM_PARAMETER_PROVENANCE_SOURCE_ID_V1,
  assertMainWireIntegratedLaneDynamicMcsInertanceProfileV1,
  createMainWireIntegratedLanePresetV1,
  mainWireIntegratedLaneDynamicMcsCircuitDigestContentV1,
  mainWireIntegratedLaneDynamicMcsProfileDigestContentV1,
} from "@/engine/myocardium/MainWireIntegratedLanePresetV1";
import {
  createMainWireIntegratedModelRegularSinusAllOffFixtureV3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3";
import { sha256CanonicalJsonHex } from "@/engine/scientific/release";

describe("integrated lane production preset V1", () => {
  it("owns the frozen regular-sinus, coronary, and HMII 9000 configuration", async () => {
    const preset = await createMainWireIntegratedLanePresetV1();
    const configuration = preset.rhythm.configuration;
    const regular = configuration.atrialSource.regularSourceConfiguration;

    expect(configuration.configurationId).toBe(
      `${INTEGRATED_LANE_RHYTHM_ID_PREFIX_V1}-composed-sinus-configuration`,
    );
    expect(JSON.stringify(configuration)).not.toContain("periodic-v3-");
    expect(regular).toMatchObject({
      configurationId: "integrated-lane-v1-regular-sinus-configuration",
      ownerInstanceId: "integrated-lane-v1-regular-sinus-owner",
      sourceId: "integrated-lane-v1-sinus-source",
      rhythmClass: "sinus",
      cycleLengthSec: 1,
    });
    expect(configuration.electricalCaptureOwner).toMatchObject({
      atrialGate: { refractoryPeriodSec: 0.2 },
      ventricularGate: { refractoryPeriodSec: 0.25 },
    });
    expect(configuration.avGateParameters).toMatchObject({
      parameterProvenance: {
        sourceId: INTEGRATED_LANE_RHYTHM_PARAMETER_PROVENANCE_SOURCE_ID_V1,
      },
      minimumConductionDelaySec: 0.125,
      recoveryDelayAmplitudeSec: 0,
      recoveryTimeConstantSec: 1,
      postConductionRefractorySec: 0.25,
      concealedRefractoryExtensionSec: 0,
    });
    expect(configuration.distalGate).toMatchObject({
      parameterProvenance: {
        sourceId: INTEGRATED_LANE_RHYTHM_PARAMETER_PROVENANCE_SOURCE_ID_V1,
      },
      hvConductionDelaySec: 0.0625,
      distalEffectiveRefractoryPeriodSec: 0,
      modeConfiguration: { mode: "pass" },
    });
    expect(configuration.ventricularBackup).toMatchObject({
      parameterProvenance: {
        sourceId: INTEGRATED_LANE_RHYTHM_PARAMETER_PROVENANCE_SOURCE_ID_V1,
      },
      intrinsicEscapeCycleLengthSec: 2,
      vviLowerRateLimitPerMin: 30,
    });
    expect(configuration.ventricularIntervalStrength).toMatchObject({
      parameterProvenance: {
        sourceId: INTEGRATED_LANE_RHYTHM_PARAMETER_PROVENANCE_SOURCE_ID_V1,
      },
      recoveryTimeConstantSec: 0.5,
      releaseFractionBeta: 0.8,
      releasedLoadReturnFractionR: 0.5,
      intervalInfluxInhibitionFractionH: 0.2,
      referenceCycleLengthSec: 1,
    });
    expect(configuration.authoredEctopySchedule.events).toEqual([]);
    expect(configuration.authoredVentricularPacingReplay).toBeNull();
    expect(configuration.sinusAtrialCalciumDeposit
      .electricalToCalciumDelaySec).toBe(0.0625);
    expect(configuration.pacAtrialCalciumDeposit).toBeNull();
    expect(configuration.ventricularCalciumDeposit
      .electricalToCalciumDelaySec).toBe(0.0625);
    expect(preset.rhythm.state).toMatchObject({
      revision: 0,
      acceptedTimeSec: 0,
      regularAtrialSourceState: {
        nextActivationTimeSec: 0.625,
      },
    });

    expect(preset.coronaryStepInput.coronaryPrior).toBe(
      MAIN_WIRE_PROVISIONAL_NORMAL_ADULT_CORONARY_PRIOR_V2,
    );
    expect(preset.coronaryStepInput.coronaryDisease).toBe(
      NORMAL_CORONARY_DISEASE_INPUT_V2,
    );
    expect(preset.coronaryStepInput.collapseHydraulics).toBe(
      MAIN_WIRE_PROVISIONAL_NORMAL_ADULT_CORONARY_COLLAPSE_V2,
    );
    expect(preset.coronaryStepInput).toMatchObject({
      impMechanism: "cep-shortening-induced",
      shorteningImpPrior:
        NORMAL_ADULT_CORONARY_SHORTENING_IMP_GAIN_PRIOR_V2,
    });
    expect(preset.coronaryInitializeInput.autoregulationWindow).toEqual({
      durationSec: 1,
      interpretation: "periodic-sinus-cycle-aligned",
    });
    expect(preset.coronaryInitializeInput).not.toHaveProperty(
      "coronaryAutoregulationDrive",
    );

    expect(preset.config.lvad).toMatchObject({
      enabled: true,
      speedRpm: 9_000,
      maximumForwardFlowLMin: null,
      forwardFlowEvidenceDomain: {
        publishedExperimentalTraversalUpperLMin: 9,
        advertisedCapacityLMin: 10,
      },
    });
    expect(preset.config.iabp.enabled).toBe(false);
    expect(preset.profile.inertanceByDevice.LVAD).toEqual(
      HEARTMATE_II_LITERATURE_CIRCUIT_INERTANCE_V1,
    );
    for (const deviceId of ["IMPELLA", "VA_ECMO", "VV_ECMO"] as const) {
      expect(Object.values(preset.profile.inertanceByDevice[deviceId])
        .filter((value) => typeof value === "number")).toEqual([0, 0, 0, 0]);
    }
    expect(preset.cold.acceptedState).toMatchObject({
      revision: 0,
      acceptedTimeSec: 0,
    });
  });

  it("preserves the periodic fixture identity while sharing its numeric rhythm construction", async () => {
    const lane = await createMainWireIntegratedLanePresetV1();
    const periodic =
      createMainWireIntegratedModelRegularSinusAllOffFixtureV3();

    expect(periodic.rhythm.configuration.configurationId).toBe(
      "periodic-v3-composed-sinus-configuration",
    );
    expect(periodic.rhythm.configuration.avGateParameters
      .parameterProvenance.sourceId).toBe(
        "bounded-periodic-v3-construction",
      );
    expect(lane.rhythm.configuration.configurationId).not.toBe(
      periodic.rhythm.configuration.configurationId,
    );
    expect(numericRhythmProjection(lane.rhythm.configuration)).toEqual(
      numericRhythmProjection(periodic.rhythm.configuration),
    );
  });

  it("T7/T11 — computes and verifies every disclaimer-bearing profile digest", async () => {
    const { profile } = await createMainWireIntegratedLanePresetV1();

    expect(profile.profileId).toBe(INTEGRATED_LANE_DYNAMIC_MCS_PROFILE_ID_V1);
    expect(profile.profileId).toMatch(
      /-experimental-not-release-approved$/,
    );
    expect(profile.profileBindingSha256).toBe(
      await sha256CanonicalJsonHex(
        mainWireIntegratedLaneDynamicMcsProfileDigestContentV1(profile),
      ),
    );
    for (const deviceId of ROTARY_SUPPORT_DEVICE_IDS_V1) {
      const binding = profile.deviceProfileBindingByDevice[deviceId];
      expect(binding.circuitProfileId).toBe(
        INTEGRATED_LANE_DYNAMIC_MCS_CIRCUIT_PROFILE_ID_BY_DEVICE_V1[deviceId],
      );
      expect(binding.circuitProfileId).toMatch(
        /-experimental-not-release-approved$/,
      );
      expect(binding.circuitProfileBindingSha256).toBe(
        await sha256CanonicalJsonHex(
          mainWireIntegratedLaneDynamicMcsCircuitDigestContentV1(
            profile,
            deviceId,
          ),
        ),
      );
    }
  });

  it("T7 negative — rejects placeholder profile and circuit digests during the lane construction guard", async () => {
    const { profile } = await createMainWireIntegratedLanePresetV1();
    const placeholder = "0".padEnd(64, "0");
    const placeholderProfile = createDynamicMechanicalSupportInertanceProfileV1({
      profileId: profile.profileId,
      profileBindingSha256: placeholder,
      deviceProfileBindingByDevice: profile.deviceProfileBindingByDevice,
      inertanceByDevice: profile.inertanceByDevice,
    });
    expect(() =>
      validateDynamicMechanicalSupportInertanceProfileV1(
        placeholderProfile,
      )).not.toThrow();
    await expect(
      assertMainWireIntegratedLaneDynamicMcsInertanceProfileV1(
        placeholderProfile,
      ),
    ).rejects.toThrow(/profile SHA-256 mismatch/);

    const placeholderLvad =
      createDynamicMechanicalSupportDeviceProfileBindingV1({
        deviceId: "LVAD",
        circuitProfileId:
          profile.deviceProfileBindingByDevice.LVAD.circuitProfileId,
        circuitProfileBindingSha256: placeholder,
      });
    const placeholderCircuitProfile =
      createDynamicMechanicalSupportInertanceProfileV1({
        profileId: profile.profileId,
        profileBindingSha256: profile.profileBindingSha256,
        deviceProfileBindingByDevice: Object.freeze({
          ...profile.deviceProfileBindingByDevice,
          LVAD: placeholderLvad,
        }),
        inertanceByDevice: profile.inertanceByDevice,
      });
    await expect(
      assertMainWireIntegratedLaneDynamicMcsInertanceProfileV1(
        placeholderCircuitProfile,
      ),
    ).rejects.toThrow(/LVAD circuit profile SHA-256 mismatch/);
  });

  it("keeps the step-2/3 lane source free of the frozen contract traps", () => {
    const laneSource = [
      "../engine/myocardium/MainWireIntegratedRegularSinusRhythmV3.ts",
      "../engine/myocardium/MainWireIntegratedLanePresetV1.ts",
      "../engine/myocardium/MainWireIntegratedScientificSession.ts",
    ].map((relativePath) =>
      readFileSync(new URL(relativePath, import.meta.url), "utf8")).join("\n");

    expect(laneSource).not.toMatch(
      /MainWireScientificExactCheckpointV3|MainWireScientificExactCheckpointV4|MainWireScientificSessionExactCheckpointV[34]/,
    );
    expect(laneSource).not.toMatch(
      /projectMainWireScientificObservationV1|ScientificProductStudioObservableFrameProjectionV1|MAIN_WIRE_SCIENTIFIC_OBSERVABLE_CATALOG_V1/,
    );
    expect(laneSource).not.toMatch(/ExactSignalExport|EXACT_SIGNAL/);
    expect(laneSource).not.toMatch(
      /runtimePresentationCanonicalPhaseV1|runtimePresentationStepsToNextCanonicalBoundaryV1/,
    );
    expect(laneSource).not.toMatch(
      /main-wire-adult-five-wall-noncoronary|0\.2\.0|verified-research/,
    );
    expect(laneSource).not.toMatch(/StudioRunArtifactContentV1|artifactStore/);
    expect(laneSource).not.toContain("repeat(64)");
  });
});

function numericRhythmProjection(configuration: {
  electricalCaptureOwner: {
    atrialGate: { refractoryPeriodSec: number };
    ventricularGate: { refractoryPeriodSec: number };
  };
  avGateParameters: {
    minimumConductionDelaySec: number;
    recoveryDelayAmplitudeSec: number;
    recoveryTimeConstantSec: number;
    postConductionRefractorySec: number;
    concealedRefractoryExtensionSec: number;
  };
  distalGate: {
    hvConductionDelaySec: number;
    distalEffectiveRefractoryPeriodSec: number;
  };
  ventricularBackup: {
    intrinsicEscapeCycleLengthSec: number;
    vviLowerRateLimitPerMin: number;
  };
  ventricularIntervalStrength: {
    recoveryTimeConstantSec: number;
    releaseFractionBeta: number;
    releasedLoadReturnFractionR: number;
    intervalInfluxInhibitionFractionH: number;
    referenceCycleLengthSec: number;
  };
}) {
  return {
    atrialRefractoryPeriodSec:
      configuration.electricalCaptureOwner.atrialGate.refractoryPeriodSec,
    ventricularRefractoryPeriodSec:
      configuration.electricalCaptureOwner.ventricularGate.refractoryPeriodSec,
    avGate: {
      minimumConductionDelaySec:
        configuration.avGateParameters.minimumConductionDelaySec,
      recoveryDelayAmplitudeSec:
        configuration.avGateParameters.recoveryDelayAmplitudeSec,
      recoveryTimeConstantSec:
        configuration.avGateParameters.recoveryTimeConstantSec,
      postConductionRefractorySec:
        configuration.avGateParameters.postConductionRefractorySec,
      concealedRefractoryExtensionSec:
        configuration.avGateParameters.concealedRefractoryExtensionSec,
    },
    distal: {
      hvConductionDelaySec: configuration.distalGate.hvConductionDelaySec,
      distalEffectiveRefractoryPeriodSec:
        configuration.distalGate.distalEffectiveRefractoryPeriodSec,
    },
    backup: {
      intrinsicEscapeCycleLengthSec:
        configuration.ventricularBackup.intrinsicEscapeCycleLengthSec,
      vviLowerRateLimitPerMin:
        configuration.ventricularBackup.vviLowerRateLimitPerMin,
    },
    interval: {
      recoveryTimeConstantSec:
        configuration.ventricularIntervalStrength.recoveryTimeConstantSec,
      releaseFractionBeta:
        configuration.ventricularIntervalStrength.releaseFractionBeta,
      releasedLoadReturnFractionR:
        configuration.ventricularIntervalStrength
          .releasedLoadReturnFractionR,
      intervalInfluxInhibitionFractionH:
        configuration.ventricularIntervalStrength
          .intervalInfluxInhibitionFractionH,
      referenceCycleLengthSec:
        configuration.ventricularIntervalStrength.referenceCycleLengthSec,
    },
  };
}
