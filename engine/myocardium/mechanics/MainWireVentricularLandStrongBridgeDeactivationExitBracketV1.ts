import type {
  LandSlsWallMaterialParamsV1,
} from "@/engine/myocardium/mechanics/landSlsWallMaterialV1";
import type {
  MainWireVentricularLandSarcomereReferenceProfileIdV1,
} from "@/engine/myocardium/mechanics/MainWireVentricularLandSarcomereReferenceBracketV1";
import type {
  MainWireVentricularLandSourceTwitchRetentionCandidateIdV1,
  MainWireVentricularLandTrefForceLoadProfileIdV1,
} from "@/engine/myocardium/mechanics/MainWireVentricularLandSourceTwitchRetentionCandidatesV1";
import {
  resolveMainWireVentricularLandSourceVelocityDistortionWallMaterialV1,
  type MainWireVentricularLandSourceVelocityDistortionProfileIdV1,
} from "@/engine/myocardium/mechanics/MainWireVentricularLandSourceVelocityDistortionBracketV1";
import type {
  MainWireVentricularLandWholeOrganKuwProfileIdV1,
} from "@/engine/myocardium/mechanics/MainWireVentricularLandWholeOrganKuwBracketV1";
import {
  stableHash as stableLandParameterHash,
  type Land2017SourceParameterSet,
  type Land2017StrongBridgeDeactivationExitExtensionV1,
} from "@/engine/myocardium/myofilament/land2017/parameterSets";

export const MAIN_WIRE_VENTRICULAR_LAND_STRONG_BRIDGE_DEACTIVATION_EXIT_BRACKET_V1_ID =
  "main-wire-ventricular-land-strong-bridge-deactivation-exit-bracket-v1" as const;

export const MAIN_WIRE_VENTRICULAR_LAND_STRONG_BRIDGE_DEACTIVATION_EXIT_PROFILE_IDS_V1 =
  Object.freeze([
    "strong-to-blocked-deactivation-off",
    "strong-to-blocked-deactivation-five-per-sec",
    "strong-to-blocked-deactivation-ten-per-sec",
    "strong-to-blocked-deactivation-fifteen-per-sec",
    "strong-to-blocked-deactivation-twenty-per-sec",
    "strong-to-blocked-deactivation-thirty-per-sec",
    "strong-to-blocked-deactivation-five-per-sec-isometric-peak-compensated",
    "strong-to-blocked-deactivation-ten-per-sec-isometric-peak-compensated",
    "strong-to-blocked-deactivation-fifteen-per-sec-isometric-peak-compensated",
    "strong-to-blocked-deactivation-ten-per-sec-squared-gate",
    "strong-to-blocked-deactivation-fifteen-per-sec-squared-gate",
    "strong-to-blocked-deactivation-twenty-per-sec-squared-gate",
    "strong-to-blocked-deactivation-thirty-per-sec-squared-gate",
    "strong-to-blocked-deactivation-twenty-per-sec-directional-gate",
    "strong-to-blocked-deactivation-thirty-per-sec-directional-gate",
    "strong-to-blocked-deactivation-forty-per-sec-directional-gate",
    "strong-to-blocked-deactivation-fifty-per-sec-directional-gate",
    "strong-to-blocked-deactivation-sixty-per-sec-directional-gate",
    "strong-to-blocked-deactivation-forty-per-sec-directional-squared-gate",
    "strong-to-blocked-deactivation-fifty-per-sec-directional-squared-gate",
    "strong-to-blocked-deactivation-sixty-per-sec-directional-squared-gate",
    "strong-to-blocked-deactivation-thirty-per-sec-directional-equilibrium-excess-gate",
    "strong-to-blocked-deactivation-forty-per-sec-directional-equilibrium-excess-gate",
    "strong-to-blocked-deactivation-fifty-per-sec-directional-equilibrium-excess-gate",
    "strong-to-unbound-deactivation-twenty-per-sec-directional-equilibrium-excess-gate",
    "strong-to-unbound-deactivation-thirty-per-sec-directional-equilibrium-excess-gate",
    "strong-to-unbound-deactivation-forty-per-sec-directional-equilibrium-excess-gate",
    "strong-to-unbound-deactivation-fifty-per-sec-directional-equilibrium-excess-gate",
    "strong-to-unbound-deactivation-forty-per-sec-directional-squared-equilibrium-excess-gate",
    "strong-to-unbound-deactivation-fifty-per-sec-directional-squared-equilibrium-excess-gate",
    "strong-to-unbound-deactivation-five-per-sec-squared-equilibrium-excess-gate",
  ] as const);

export type MainWireVentricularLandStrongBridgeDeactivationExitProfileIdV1 =
  (typeof MAIN_WIRE_VENTRICULAR_LAND_STRONG_BRIDGE_DEACTIVATION_EXIT_PROFILE_IDS_V1)[number];

export type MainWireVentricularLandStrongBridgeDeactivationExitProfileV1 =
  Readonly<{
    profileId:
      MainWireVentricularLandStrongBridgeDeactivationExitProfileIdV1;
    maximumRatePerSec: 0 | 5 | 10 | 15 | 20 | 30 | 40 | 50 | 60;
    cooperativeGatePower: 1 | 2;
    deactivationDirectionGate:
      | "none"
      | "relative-CaTRPN-relaxation-excess";
    strongPopulationGate:
      | "none"
      | "positive-excess-over-zero-distortion-equilibrium";
    exitDestination: "blocked" | "unbound";
    trefScaleFromUncompensatedBase: number;
    sourceIsometricPeakCompensationApplied: boolean;
    sourceIdentityClaimed: boolean;
    parameterSearchOrFitting: false;
    hemodynamicOutcomeUsedToSetProfile: false;
  }>;

export const MAIN_WIRE_VENTRICULAR_LAND_STRONG_BRIDGE_DEACTIVATION_EXIT_CLAIM_V1 =
  Object.freeze({
    role:
      "fixed-reduced-order-calcium-deactivation-strong-bridge-exit-bracket" as const,
    mechanisticInterpretation:
      "mean-field-strong-bridge-exit-during-thin-filament-deactivation" as const,
    sourceLandEquationExtension: true as const,
    sourceIdentityClaimedForNonzeroProfiles: false as const,
    calciumTroponinGate:
      "TRPN50-power-over-TRPN50-power-plus-CaTRPN-power" as const,
    cooperativeGatePowersCompared: Object.freeze([1, 2] as const),
    directionalGate:
      "positive-relative-CaTRPN-relaxation-excess-without-an-additional-scale-parameter" as const,
    strongPopulationGate:
      "positive-S-excess-over-source-zero-distortion-equilibrium-S-to-W-ratio-without-an-additional-scale-parameter" as const,
    exitDestinationsCompared: Object.freeze(["blocked", "unbound"] as const),
    oneAdditionalMaximumRateParameter: true as const,
    isometricPeakCompensationUsesExistingTrefScaleOnly: true as const,
    isometricPeakCompensationAddsIndependentFreeParameter: false as const,
    stateCountChanged: false as const,
    populationConservationChanged: false as const,
    passiveOrSlsChanged: false as const,
    acceptedStateOrCheckpointTopologyChanged: false as const,
    parameterSearchOrFitting: false as const,
    hemodynamicOutcomeUsedToSetProfiles: false as const,
    completeMolecularMechanismClaimed: false as const,
    clinicalValidationClaimed: false as const,
  });

export const MAIN_WIRE_VENTRICULAR_LAND_STRONG_BRIDGE_DEACTIVATION_EXIT_PROFILES_V1 =
  Object.freeze({
    "strong-to-blocked-deactivation-off": profile(
      "strong-to-blocked-deactivation-off",
      0,
    ),
    "strong-to-blocked-deactivation-five-per-sec": profile(
      "strong-to-blocked-deactivation-five-per-sec",
      5,
    ),
    "strong-to-blocked-deactivation-ten-per-sec": profile(
      "strong-to-blocked-deactivation-ten-per-sec",
      10,
    ),
    "strong-to-blocked-deactivation-fifteen-per-sec": profile(
      "strong-to-blocked-deactivation-fifteen-per-sec",
      15,
    ),
    "strong-to-blocked-deactivation-twenty-per-sec": profile(
      "strong-to-blocked-deactivation-twenty-per-sec",
      20,
    ),
    "strong-to-blocked-deactivation-thirty-per-sec": profile(
      "strong-to-blocked-deactivation-thirty-per-sec",
      30,
    ),
    "strong-to-blocked-deactivation-five-per-sec-isometric-peak-compensated":
      profile(
        "strong-to-blocked-deactivation-five-per-sec-isometric-peak-compensated",
        5,
        1.1530807420706863,
      ),
    "strong-to-blocked-deactivation-ten-per-sec-isometric-peak-compensated":
      profile(
        "strong-to-blocked-deactivation-ten-per-sec-isometric-peak-compensated",
        10,
        1.3029010355346275,
      ),
    "strong-to-blocked-deactivation-fifteen-per-sec-isometric-peak-compensated":
      profile(
        "strong-to-blocked-deactivation-fifteen-per-sec-isometric-peak-compensated",
        15,
        1.4511707219218664,
      ),
    "strong-to-blocked-deactivation-ten-per-sec-squared-gate": profile(
      "strong-to-blocked-deactivation-ten-per-sec-squared-gate",
      10,
      1,
      2,
    ),
    "strong-to-blocked-deactivation-fifteen-per-sec-squared-gate": profile(
      "strong-to-blocked-deactivation-fifteen-per-sec-squared-gate",
      15,
      1,
      2,
    ),
    "strong-to-blocked-deactivation-twenty-per-sec-squared-gate": profile(
      "strong-to-blocked-deactivation-twenty-per-sec-squared-gate",
      20,
      1,
      2,
    ),
    "strong-to-blocked-deactivation-thirty-per-sec-squared-gate": profile(
      "strong-to-blocked-deactivation-thirty-per-sec-squared-gate",
      30,
      1,
      2,
    ),
    "strong-to-blocked-deactivation-twenty-per-sec-directional-gate": profile(
      "strong-to-blocked-deactivation-twenty-per-sec-directional-gate",
      20,
      1,
      1,
      "relative-CaTRPN-relaxation-excess",
    ),
    "strong-to-blocked-deactivation-thirty-per-sec-directional-gate": profile(
      "strong-to-blocked-deactivation-thirty-per-sec-directional-gate",
      30,
      1,
      1,
      "relative-CaTRPN-relaxation-excess",
    ),
    "strong-to-blocked-deactivation-forty-per-sec-directional-gate": profile(
      "strong-to-blocked-deactivation-forty-per-sec-directional-gate",
      40,
      1,
      1,
      "relative-CaTRPN-relaxation-excess",
    ),
    "strong-to-blocked-deactivation-fifty-per-sec-directional-gate": profile(
      "strong-to-blocked-deactivation-fifty-per-sec-directional-gate",
      50,
      1,
      1,
      "relative-CaTRPN-relaxation-excess",
    ),
    "strong-to-blocked-deactivation-sixty-per-sec-directional-gate": profile(
      "strong-to-blocked-deactivation-sixty-per-sec-directional-gate",
      60,
      1,
      1,
      "relative-CaTRPN-relaxation-excess",
    ),
    "strong-to-blocked-deactivation-forty-per-sec-directional-squared-gate":
      profile(
        "strong-to-blocked-deactivation-forty-per-sec-directional-squared-gate",
        40,
        1,
        2,
        "relative-CaTRPN-relaxation-excess",
      ),
    "strong-to-blocked-deactivation-fifty-per-sec-directional-squared-gate":
      profile(
        "strong-to-blocked-deactivation-fifty-per-sec-directional-squared-gate",
        50,
        1,
        2,
        "relative-CaTRPN-relaxation-excess",
      ),
    "strong-to-blocked-deactivation-sixty-per-sec-directional-squared-gate":
      profile(
        "strong-to-blocked-deactivation-sixty-per-sec-directional-squared-gate",
        60,
        1,
        2,
        "relative-CaTRPN-relaxation-excess",
      ),
    "strong-to-blocked-deactivation-thirty-per-sec-directional-equilibrium-excess-gate":
      profile(
        "strong-to-blocked-deactivation-thirty-per-sec-directional-equilibrium-excess-gate",
        30,
        1,
        1,
        "relative-CaTRPN-relaxation-excess",
        "positive-excess-over-zero-distortion-equilibrium",
      ),
    "strong-to-blocked-deactivation-forty-per-sec-directional-equilibrium-excess-gate":
      profile(
        "strong-to-blocked-deactivation-forty-per-sec-directional-equilibrium-excess-gate",
        40,
        1,
        1,
        "relative-CaTRPN-relaxation-excess",
        "positive-excess-over-zero-distortion-equilibrium",
      ),
    "strong-to-blocked-deactivation-fifty-per-sec-directional-equilibrium-excess-gate":
      profile(
        "strong-to-blocked-deactivation-fifty-per-sec-directional-equilibrium-excess-gate",
        50,
        1,
        1,
        "relative-CaTRPN-relaxation-excess",
        "positive-excess-over-zero-distortion-equilibrium",
      ),
    "strong-to-unbound-deactivation-thirty-per-sec-directional-equilibrium-excess-gate":
      profile(
        "strong-to-unbound-deactivation-thirty-per-sec-directional-equilibrium-excess-gate",
        30,
        1,
        1,
        "relative-CaTRPN-relaxation-excess",
        "positive-excess-over-zero-distortion-equilibrium",
        "unbound",
      ),
    "strong-to-unbound-deactivation-twenty-per-sec-directional-equilibrium-excess-gate":
      profile(
        "strong-to-unbound-deactivation-twenty-per-sec-directional-equilibrium-excess-gate",
        20,
        1,
        1,
        "relative-CaTRPN-relaxation-excess",
        "positive-excess-over-zero-distortion-equilibrium",
        "unbound",
      ),
    "strong-to-unbound-deactivation-forty-per-sec-directional-equilibrium-excess-gate":
      profile(
        "strong-to-unbound-deactivation-forty-per-sec-directional-equilibrium-excess-gate",
        40,
        1,
        1,
        "relative-CaTRPN-relaxation-excess",
        "positive-excess-over-zero-distortion-equilibrium",
        "unbound",
      ),
    "strong-to-unbound-deactivation-fifty-per-sec-directional-equilibrium-excess-gate":
      profile(
        "strong-to-unbound-deactivation-fifty-per-sec-directional-equilibrium-excess-gate",
        50,
        1,
        1,
        "relative-CaTRPN-relaxation-excess",
        "positive-excess-over-zero-distortion-equilibrium",
        "unbound",
      ),
    "strong-to-unbound-deactivation-forty-per-sec-directional-squared-equilibrium-excess-gate":
      profile(
        "strong-to-unbound-deactivation-forty-per-sec-directional-squared-equilibrium-excess-gate",
        40,
        1,
        2,
        "relative-CaTRPN-relaxation-excess",
        "positive-excess-over-zero-distortion-equilibrium",
        "unbound",
      ),
    "strong-to-unbound-deactivation-fifty-per-sec-directional-squared-equilibrium-excess-gate":
      profile(
        "strong-to-unbound-deactivation-fifty-per-sec-directional-squared-equilibrium-excess-gate",
        50,
        1,
        2,
        "relative-CaTRPN-relaxation-excess",
        "positive-excess-over-zero-distortion-equilibrium",
        "unbound",
      ),
    "strong-to-unbound-deactivation-five-per-sec-squared-equilibrium-excess-gate":
      profile(
        "strong-to-unbound-deactivation-five-per-sec-squared-equilibrium-excess-gate",
        5,
        1,
        2,
        "none",
        "positive-excess-over-zero-distortion-equilibrium",
        "unbound",
      ),
  } satisfies Readonly<Record<
    MainWireVentricularLandStrongBridgeDeactivationExitProfileIdV1,
    MainWireVentricularLandStrongBridgeDeactivationExitProfileV1
  >>);

export function resolveMainWireVentricularLandStrongBridgeDeactivationExitProfileV1(
  profileId:
    MainWireVentricularLandStrongBridgeDeactivationExitProfileIdV1,
): MainWireVentricularLandStrongBridgeDeactivationExitProfileV1 {
  const resolved =
    MAIN_WIRE_VENTRICULAR_LAND_STRONG_BRIDGE_DEACTIVATION_EXIT_PROFILES_V1[
      profileId
    ];
  if (resolved === undefined) {
    throw new Error(
      `unsupported strong-bridge deactivation-exit profile: ${String(profileId)}`,
    );
  }
  return resolved;
}

export function resolveMainWireVentricularLandStrongBridgeDeactivationExitWallMaterialV1(
  profileId:
    MainWireVentricularLandStrongBridgeDeactivationExitProfileIdV1,
  velocityDistortionProfileId:
    MainWireVentricularLandSourceVelocityDistortionProfileIdV1,
  sourceTwitchRetentionCandidateId:
    MainWireVentricularLandSourceTwitchRetentionCandidateIdV1,
  trefForceLoadProfileId: MainWireVentricularLandTrefForceLoadProfileIdV1,
  sarcomereReferenceProfileId:
    MainWireVentricularLandSarcomereReferenceProfileIdV1,
  kuwProfileId: MainWireVentricularLandWholeOrganKuwProfileIdV1,
): LandSlsWallMaterialParamsV1 {
  const profileValue =
    resolveMainWireVentricularLandStrongBridgeDeactivationExitProfileV1(
      profileId,
    );
  const base =
    resolveMainWireVentricularLandSourceVelocityDistortionWallMaterialV1(
      velocityDistortionProfileId,
      sourceTwitchRetentionCandidateId,
      trefForceLoadProfileId,
      sarcomereReferenceProfileId,
      kuwProfileId,
    );
  if (profileValue.maximumRatePerSec === 0) return base;
  const source = base.landEquationParameters;
  if (source.strongBridgeDeactivationExit !== undefined) {
    throw new Error("strong-bridge deactivation-exit extension already exists");
  }
  const extension: Land2017StrongBridgeDeactivationExitExtensionV1 =
    Object.freeze({
      extensionId: "land2017-strong-bridge-deactivation-exit-v1",
      maximumRatePerSec: profileValue.maximumRatePerSec,
      calciumTroponinGate:
        "TRPN50-power-over-TRPN50-power-plus-CaTRPN-power",
      cooperativeGatePower: profileValue.cooperativeGatePower,
      deactivationDirectionGate: profileValue.deactivationDirectionGate,
      strongPopulationGate: profileValue.strongPopulationGate,
      exitDestination: profileValue.exitDestination,
      sourceIdentityClaimed: false,
    });
  const values = profileValue.trefScaleFromUncompensatedBase === 1
    ? source.values
    : Object.freeze({
      ...source.values,
      Tref:
        source.values.Tref * profileValue.trefScaleFromUncompensatedBase,
    });
  const hashInput: Omit<Land2017SourceParameterSet, "parameterSetStableHash"> = {
    parameterSetId: `${source.parameterSetId}-${profileId}`,
    sourceId: source.sourceId,
    doi: source.doi,
    values,
    derived: source.derived,
    sourceParameters: profileValue.trefScaleFromUncompensatedBase === 1
      ? source.sourceParameters
      : Object.freeze(source.sourceParameters.map((entry) =>
        entry.parameter === "Tref"
          ? Object.freeze({
            ...entry,
            location:
              `${entry.location}; exact primary-source-trace isometric peak compensation for ${profileId}`,
            original: Object.freeze({ ...entry.original }),
            runtime: Object.freeze({ ...entry.runtime, value: values.Tref }),
          })
          : Object.freeze({
            ...entry,
            original: Object.freeze({ ...entry.original }),
            runtime: Object.freeze({ ...entry.runtime }),
          }))),
    derivedParameters: source.derivedParameters,
    strongBridgeDeactivationExit: extension,
  };
  const parameterSet: Land2017SourceParameterSet = Object.freeze({
    ...hashInput,
    parameterSetStableHash: stableLandParameterHash(hashInput),
  });
  return Object.freeze({
    ...base,
    parameterSetId: `${base.parameterSetId}-${profileId}`,
    landEquationParameters: parameterSet,
  });
}

function profile(
  profileId:
    MainWireVentricularLandStrongBridgeDeactivationExitProfileIdV1,
  maximumRatePerSec: 0 | 5 | 10 | 15 | 20 | 30 | 40 | 50 | 60,
  trefScaleFromUncompensatedBase = 1,
  cooperativeGatePower: 1 | 2 = 1,
  deactivationDirectionGate:
    | "none"
    | "relative-CaTRPN-relaxation-excess" = "none",
  strongPopulationGate:
    | "none"
    | "positive-excess-over-zero-distortion-equilibrium" = "none",
  exitDestination: "blocked" | "unbound" = "blocked",
): MainWireVentricularLandStrongBridgeDeactivationExitProfileV1 {
  return Object.freeze({
    profileId,
    maximumRatePerSec,
    cooperativeGatePower,
    deactivationDirectionGate,
    strongPopulationGate,
    exitDestination,
    trefScaleFromUncompensatedBase,
    sourceIsometricPeakCompensationApplied:
      trefScaleFromUncompensatedBase !== 1,
    sourceIdentityClaimed: maximumRatePerSec === 0,
    parameterSearchOrFitting: false as const,
    hemodynamicOutcomeUsedToSetProfile: false as const,
  });
}
