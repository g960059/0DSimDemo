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
  DYNAMIC_MECHANICAL_SUPPORT_DEVICE_PROFILE_BINDING_V1_ID,
  DYNAMIC_MECHANICAL_SUPPORT_INERTANCE_PROFILE_V1_ID,
  createDynamicMechanicalSupportDeviceProfileBindingV1,
  createDynamicMechanicalSupportInertanceProfileV1,
  validateDynamicMechanicalSupportInertanceProfileV1,
  type DynamicMechanicalSupportInertanceProfileV1,
} from "@/engine/devices/dynamicNetworkV1";
import {
  DYNAMIC_ROTARY_PUMP_UNIT_SYSTEM_V1_ID,
  type DynamicRotaryPumpCircuitInertanceV1,
} from "@/engine/devices/dynamicRotaryPumpV1";
import { mechanicalSupportPresetV1 } from "@/engine/devices/presetsV1";
import {
  ROTARY_SUPPORT_DEVICE_IDS_V1,
  type RotarySupportDeviceIdV1,
} from "@/engine/devices/typesV1";
import {
  type MainWireIntegratedModelCheckpointContextV3,
} from "@/engine/myocardium/MainWireIntegratedModelCheckpointV3";
import {
  initializeMainWireIntegratedModelV3,
  type MainWireIntegratedModelAcceptedStateV3,
} from "@/engine/myocardium/MainWireIntegratedModelTransactionV3";
import {
  createMainWireIntegratedRegularSinusRhythmV3,
} from "@/engine/myocardium/MainWireIntegratedRegularSinusRhythmV3";
import { FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1 } from
  "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import { MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CORONARY_CIRCULATION_NEWTON_POLICY_V2 } from
  "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallCoronaryPeriodicSteadyV2";
import {
  normalAdultMainWireRuntimeV1,
  type MainWireNormalAdultFiveWallMechanicsStateV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallClosedLoopV1";
import { MAIN_WIRE_NORMAL_ADULT_BLOOD_VOLUME_PROVENANCE_V1 } from
  "@/engine/myocardium/experiments/MainWireNormalAdultBloodVolumeOperatingPointV1";
import { createMainWireNormalAdultCommonPericardiumV1 } from
  "@/engine/myocardium/mechanics/MainWireNormalAdultCommonPericardiumV1";
import { createCanonicalMainWireNormalAdultFiveWallProviderV1 } from
  "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";
import { sha256CanonicalJsonHex } from "@/engine/integrity";

export const INTEGRATED_LANE_RHYTHM_ID_PREFIX_V1 =
  "integrated-lane-v1" as const;
export const INTEGRATED_LANE_RHYTHM_PARAMETER_PROVENANCE_SOURCE_ID_V1 =
  "integrated-lane-v1-construction" as const;
export const INTEGRATED_LANE_DYNAMIC_MCS_PROFILE_ID_V1 =
  "heartmate-ii-literature-r-l-lane-v1-experimental-not-release-approved" as const;

export const INTEGRATED_LANE_DYNAMIC_MCS_CIRCUIT_PROFILE_ID_BY_DEVICE_V1 =
  Object.freeze({
    LVAD:
      "integrated-lane-v1-lvad-experimental-not-release-approved",
    IMPELLA:
      "integrated-lane-v1-impella-experimental-not-release-approved",
    VA_ECMO:
      "integrated-lane-v1-va_ecmo-experimental-not-release-approved",
    VV_ECMO:
      "integrated-lane-v1-vv_ecmo-experimental-not-release-approved",
  } as const satisfies Readonly<Record<RotarySupportDeviceIdV1, string>>);

type WallState = MainWireNormalAdultFiveWallMechanicsStateV1;

export type MainWireIntegratedLaneBootstrapV1 = Awaited<ReturnType<
  typeof createMainWireIntegratedLaneBootstrapV1
>>;

/**
 * Model-owned numerical bootstrap for the fixed coronary, regular-sinus, and
 * HMII 9000 lane. This is neither a Studio ScenarioPreset nor registered
 * product content. Its experimental profile identities say that explicitly.
 */
export async function createMainWireIntegratedLaneBootstrapV1() {
  const provider = createCanonicalMainWireNormalAdultFiveWallProviderV1();
  const runtime = normalAdultMainWireRuntimeV1();
  const pericardium = createMainWireNormalAdultCommonPericardiumV1();
  const rhythm = createMainWireIntegratedRegularSinusRhythmV3({
    idPrefix: INTEGRATED_LANE_RHYTHM_ID_PREFIX_V1,
    parameterProvenanceSourceId:
      INTEGRATED_LANE_RHYTHM_PARAMETER_PROVENANCE_SOURCE_ID_V1,
  });
  const profile =
    await createMainWireIntegratedLaneDynamicMcsInertanceProfileV1();
  const config = mechanicalSupportPresetV1("lvad-hmii-9000");
  const dynamicMechanicalSupport = Object.freeze({ config, profile });
  const coronaryStepInput = Object.freeze({
    runtime,
    calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
    pericardium,
    coronaryPrior: MAIN_WIRE_PROVISIONAL_NORMAL_ADULT_CORONARY_PRIOR_V2,
    coronaryDisease: NORMAL_CORONARY_DISEASE_INPUT_V2,
    collapseHydraulics: MAIN_WIRE_PROVISIONAL_NORMAL_ADULT_CORONARY_COLLAPSE_V2,
    impMechanism: "cep-shortening-induced" as const,
    shorteningImpPrior: NORMAL_ADULT_CORONARY_SHORTENING_IMP_GAIN_PRIOR_V2,
    circulationNewtonOptions:
      MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CORONARY_CIRCULATION_NEWTON_POLICY_V2,
  });
  const coronaryInitializeInput = Object.freeze({
    provider,
    runtime,
    calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
    pericardium,
    coronaryPrior: MAIN_WIRE_PROVISIONAL_NORMAL_ADULT_CORONARY_PRIOR_V2,
    coronaryDisease: NORMAL_CORONARY_DISEASE_INPUT_V2,
    collapseHydraulics:
      MAIN_WIRE_PROVISIONAL_NORMAL_ADULT_CORONARY_COLLAPSE_V2,
    impMechanism: "cep-shortening-induced" as const,
    shorteningImpPrior: NORMAL_ADULT_CORONARY_SHORTENING_IMP_GAIN_PRIOR_V2,
    fixedGlobalTotalBloodVolumeMl:
      MAIN_WIRE_NORMAL_ADULT_BLOOD_VOLUME_PROVENANCE_V1
        .fullGraphReferenceTotalBloodVolumeMl,
    autoregulationWindow: Object.freeze({
      durationSec: 1,
      interpretation: "periodic-sinus-cycle-aligned" as const,
    }),
  });
  const cold = initializeMainWireIntegratedModelV3({
    coronary: coronaryInitializeInput,
    rhythm: Object.freeze({
      configuration: rhythm.configuration,
      acceptedState: rhythm.state,
    }),
    dynamicMechanicalSupport,
  });
  return Object.freeze({
    provider,
    runtime,
    pericardium,
    rhythm,
    profile,
    config,
    dynamicMechanicalSupport,
    coronaryInitializeInput,
    coronaryStepInput,
    cold,
  });
}

export function mainWireIntegratedLaneCheckpointContextV1(
  bootstrap: MainWireIntegratedLaneBootstrapV1,
  state: MainWireIntegratedModelAcceptedStateV3<WallState>,
): MainWireIntegratedModelCheckpointContextV3<WallState> {
  return Object.freeze({
    provider: bootstrap.provider,
    coronaryPrior: bootstrap.coronaryStepInput.coronaryPrior,
    collapseHydraulics: bootstrap.coronaryStepInput.collapseHydraulics,
    impMechanism: bootstrap.coronaryStepInput.impMechanism,
    shorteningImpPrior: bootstrap.coronaryStepInput.shorteningImpPrior,
    coronaryAutoregulationBinding:
      state.coronary.coronaryAutoregulationBinding,
    rhythm: Object.freeze({ configuration: bootstrap.rhythm.configuration }),
    dynamicMechanicalSupportProfile: bootstrap.profile,
    dynamicMechanicalSupportConfig: bootstrap.config,
  });
}

export async function createMainWireIntegratedLaneDynamicMcsInertanceProfileV1():
Promise<DynamicMechanicalSupportInertanceProfileV1> {
  const zero = Object.freeze({
    unitSystemId: DYNAMIC_ROTARY_PUMP_UNIT_SYSTEM_V1_ID,
    pumpInternalMmHgSec2PerMl: 0,
    drainageMmHgSec2PerMl: 0,
    oxygenatorMmHgSec2PerMl: 0,
    returnPathMmHgSec2PerMl: 0,
  }) satisfies DynamicRotaryPumpCircuitInertanceV1;
  const inertanceByDevice = Object.freeze({
    LVAD: HEARTMATE_II_LITERATURE_CIRCUIT_INERTANCE_V1,
    IMPELLA: zero,
    VA_ECMO: zero,
    VV_ECMO: zero,
  });
  const bindings = await Promise.all(
    ROTARY_SUPPORT_DEVICE_IDS_V1.map(async (deviceId) => {
      const circuitProfileId =
        INTEGRATED_LANE_DYNAMIC_MCS_CIRCUIT_PROFILE_ID_BY_DEVICE_V1[deviceId];
      const digestContent = circuitDigestContent(
        deviceId,
        circuitProfileId,
        inertanceByDevice[deviceId],
      );
      return createDynamicMechanicalSupportDeviceProfileBindingV1({
        deviceId,
        circuitProfileId,
        circuitProfileBindingSha256:
          await sha256CanonicalJsonHex(digestContent),
      });
    }),
  );
  const deviceProfileBindingByDevice = Object.freeze(Object.fromEntries(
    bindings.map((binding) => [binding.deviceId, binding]),
  )) as DynamicMechanicalSupportInertanceProfileV1[
    "deviceProfileBindingByDevice"
  ];
  const profileDigestContent = Object.freeze({
    profileSchemaId: DYNAMIC_MECHANICAL_SUPPORT_INERTANCE_PROFILE_V1_ID,
    schemaVersion: 1 as const,
    unitSystemId: DYNAMIC_ROTARY_PUMP_UNIT_SYSTEM_V1_ID,
    profileId: INTEGRATED_LANE_DYNAMIC_MCS_PROFILE_ID_V1,
    deviceProfileBindingByDevice,
    inertanceByDevice,
  });
  const profile = createDynamicMechanicalSupportInertanceProfileV1({
    profileId: INTEGRATED_LANE_DYNAMIC_MCS_PROFILE_ID_V1,
    profileBindingSha256:
      await sha256CanonicalJsonHex(profileDigestContent),
    deviceProfileBindingByDevice,
    inertanceByDevice,
  });
  await assertMainWireIntegratedLaneDynamicMcsInertanceProfileV1(profile);
  return profile;
}

/** Canonical bytes covered by the profile-level binding digest. */
export function mainWireIntegratedLaneDynamicMcsProfileDigestContentV1(
  profile: DynamicMechanicalSupportInertanceProfileV1,
) {
  validateDynamicMechanicalSupportInertanceProfileV1(profile);
  const { profileBindingSha256: _digest, ...content } = profile;
  return Object.freeze(content);
}

/** Canonical bytes covered by one circuit-level binding digest. */
export function mainWireIntegratedLaneDynamicMcsCircuitDigestContentV1(
  profile: DynamicMechanicalSupportInertanceProfileV1,
  deviceId: RotarySupportDeviceIdV1,
) {
  validateDynamicMechanicalSupportInertanceProfileV1(profile);
  const binding = profile.deviceProfileBindingByDevice[deviceId];
  return circuitDigestContent(
    deviceId,
    binding.circuitProfileId,
    profile.inertanceByDevice[deviceId],
  );
}

/**
 * Lane-specific construction guard. The generic dynamic-MCS validator checks
 * digest syntax only; this guard checks the fixed lane identities and content.
 */
export async function assertMainWireIntegratedLaneDynamicMcsInertanceProfileV1(
  profile: unknown,
): Promise<void> {
  validateDynamicMechanicalSupportInertanceProfileV1(profile);
  if (profile.profileId !== INTEGRATED_LANE_DYNAMIC_MCS_PROFILE_ID_V1) {
    throw new Error("integrated lane dynamic MCS profile identity mismatch");
  }
  if (!profile.profileId.endsWith("-experimental-not-release-approved")) {
    throw new Error(
      "integrated lane dynamic MCS profile approval disclaimer is missing",
    );
  }
  for (const deviceId of ROTARY_SUPPORT_DEVICE_IDS_V1) {
    const binding = profile.deviceProfileBindingByDevice[deviceId];
    const expectedId =
      INTEGRATED_LANE_DYNAMIC_MCS_CIRCUIT_PROFILE_ID_BY_DEVICE_V1[deviceId];
    if (
      binding.circuitProfileId !== expectedId
      || !binding.circuitProfileId.endsWith(
        "-experimental-not-release-approved",
      )
    ) {
      throw new Error(
        `integrated lane ${deviceId} circuit profile identity mismatch`,
      );
    }
    const expectedCircuitDigest = await sha256CanonicalJsonHex(
      mainWireIntegratedLaneDynamicMcsCircuitDigestContentV1(
        profile,
        deviceId,
      ),
    );
    if (binding.circuitProfileBindingSha256 !== expectedCircuitDigest) {
      throw new Error(
        `integrated lane ${deviceId} circuit profile SHA-256 mismatch`,
      );
    }
  }
  const expectedProfileDigest = await sha256CanonicalJsonHex(
    mainWireIntegratedLaneDynamicMcsProfileDigestContentV1(profile),
  );
  if (profile.profileBindingSha256 !== expectedProfileDigest) {
    throw new Error("integrated lane dynamic MCS profile SHA-256 mismatch");
  }
}

function circuitDigestContent(
  deviceId: RotarySupportDeviceIdV1,
  circuitProfileId: string,
  inertance: DynamicRotaryPumpCircuitInertanceV1,
) {
  return Object.freeze({
    bindingSchemaId:
      DYNAMIC_MECHANICAL_SUPPORT_DEVICE_PROFILE_BINDING_V1_ID,
    schemaVersion: 1 as const,
    deviceId,
    circuitProfileId,
    inertance,
  });
}
