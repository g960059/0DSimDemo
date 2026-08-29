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
  type Land2017StrongToBlockedDeactivationExtensionV1,
} from "@/engine/myocardium/myofilament/land2017/parameterSets";

export const MAIN_WIRE_VENTRICULAR_LAND_STRONG_TO_BLOCKED_DEACTIVATION_BRACKET_V1_ID =
  "main-wire-ventricular-land-strong-to-blocked-deactivation-bracket-v1" as const;

export const MAIN_WIRE_VENTRICULAR_LAND_STRONG_TO_BLOCKED_DEACTIVATION_PROFILE_IDS_V1 =
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
  ] as const);

export type MainWireVentricularLandStrongToBlockedDeactivationProfileIdV1 =
  (typeof MAIN_WIRE_VENTRICULAR_LAND_STRONG_TO_BLOCKED_DEACTIVATION_PROFILE_IDS_V1)[number];

export type MainWireVentricularLandStrongToBlockedDeactivationProfileV1 =
  Readonly<{
    profileId:
      MainWireVentricularLandStrongToBlockedDeactivationProfileIdV1;
    maximumRatePerSec: 0 | 5 | 10 | 15 | 20 | 30 | 40 | 50 | 60;
    cooperativeGatePower: 1 | 2;
    deactivationDirectionGate:
      | "none"
      | "relative-CaTRPN-relaxation-excess";
    trefScaleFromUncompensatedBase: number;
    sourceIsometricPeakCompensationApplied: boolean;
    sourceIdentityClaimed: boolean;
    parameterSearchOrFitting: false;
    hemodynamicOutcomeUsedToSetProfile: false;
  }>;

export const MAIN_WIRE_VENTRICULAR_LAND_STRONG_TO_BLOCKED_DEACTIVATION_CLAIM_V1 =
  Object.freeze({
    role:
      "fixed-reduced-order-calcium-deactivation-strong-bridge-exit-bracket" as const,
    mechanisticInterpretation:
      "mean-field-S-to-B-exit-when-calcium-troponin-is-below-TRPN50" as const,
    sourceLandEquationExtension: true as const,
    sourceIdentityClaimedForNonzeroProfiles: false as const,
    calciumTroponinGate:
      "TRPN50-power-over-TRPN50-power-plus-CaTRPN-power" as const,
    cooperativeGatePowersCompared: Object.freeze([1, 2] as const),
    directionalGate:
      "positive-relative-CaTRPN-relaxation-excess-without-an-additional-scale-parameter" as const,
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

export const MAIN_WIRE_VENTRICULAR_LAND_STRONG_TO_BLOCKED_DEACTIVATION_PROFILES_V1 =
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
  } satisfies Readonly<Record<
    MainWireVentricularLandStrongToBlockedDeactivationProfileIdV1,
    MainWireVentricularLandStrongToBlockedDeactivationProfileV1
  >>);

export function resolveMainWireVentricularLandStrongToBlockedDeactivationProfileV1(
  profileId:
    MainWireVentricularLandStrongToBlockedDeactivationProfileIdV1,
): MainWireVentricularLandStrongToBlockedDeactivationProfileV1 {
  const resolved =
    MAIN_WIRE_VENTRICULAR_LAND_STRONG_TO_BLOCKED_DEACTIVATION_PROFILES_V1[
      profileId
    ];
  if (resolved === undefined) {
    throw new Error(
      `unsupported strong-to-blocked deactivation profile: ${String(profileId)}`,
    );
  }
  return resolved;
}

export function resolveMainWireVentricularLandStrongToBlockedDeactivationWallMaterialV1(
  profileId:
    MainWireVentricularLandStrongToBlockedDeactivationProfileIdV1,
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
    resolveMainWireVentricularLandStrongToBlockedDeactivationProfileV1(
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
  if (source.strongToBlockedDeactivation !== undefined) {
    throw new Error("strong-to-blocked deactivation extension already exists");
  }
  const extension: Land2017StrongToBlockedDeactivationExtensionV1 =
    Object.freeze({
      extensionId: "land2017-strong-to-blocked-deactivation-v1",
      maximumRatePerSec: profileValue.maximumRatePerSec,
      calciumTroponinGate:
        "TRPN50-power-over-TRPN50-power-plus-CaTRPN-power",
      cooperativeGatePower: profileValue.cooperativeGatePower,
      deactivationDirectionGate: profileValue.deactivationDirectionGate,
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
    strongToBlockedDeactivation: extension,
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
    MainWireVentricularLandStrongToBlockedDeactivationProfileIdV1,
  maximumRatePerSec: 0 | 5 | 10 | 15 | 20 | 30 | 40 | 50 | 60,
  trefScaleFromUncompensatedBase = 1,
  cooperativeGatePower: 1 | 2 = 1,
  deactivationDirectionGate:
    | "none"
    | "relative-CaTRPN-relaxation-excess" = "none",
): MainWireVentricularLandStrongToBlockedDeactivationProfileV1 {
  return Object.freeze({
    profileId,
    maximumRatePerSec,
    cooperativeGatePower,
    deactivationDirectionGate,
    trefScaleFromUncompensatedBase,
    sourceIsometricPeakCompensationApplied:
      trefScaleFromUncompensatedBase !== 1,
    sourceIdentityClaimed: maximumRatePerSec === 0,
    parameterSearchOrFitting: false as const,
    hemodynamicOutcomeUsedToSetProfile: false as const,
  });
}
