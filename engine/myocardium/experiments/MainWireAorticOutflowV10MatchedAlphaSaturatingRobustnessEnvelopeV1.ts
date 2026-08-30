import type { MainWireNormalAdultStressedVenousVolumeResearchPointIdV1 } from "@/engine/myocardium/experiments/MainWireNormalAdultBloodVolumeOperatingPointV1";
import type { MainWireNormalAdultFiveWallCirculatoryLoadPointIdV1 } from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallCirculatoryLoadPointsV1";
import type { MainWireArterialCompliancePhysiologyProfileIdV1 } from "@/engine/myocardium/experiments/MainWireArterialCompliancePhysiologyBracketV1";
import type { MainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawMainProfileIdV1 } from "@/engine/myocardium/calcium/MainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawV1";
import type { MainWireVentricularLandTrefForceLoadProfileIdV1 } from "@/engine/myocardium/mechanics/MainWireVentricularLandSourceTwitchRetentionCandidatesV1";

export const MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_V1_ID =
  "main-wire-aortic-outflow-v10-matched-alpha-saturating-robustness-envelope-v1" as const;

export const MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_FACTOR_IDS_V1 =
  Object.freeze([
    "heart-rate",
    "systemic-resistance",
    "systemic-arterial-tangent-stiffness",
    "stressed-venous-volume",
    "ventricular-Tref-force-scale",
  ] as const);

export type MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeFactorIdV1 =
  (typeof MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_FACTOR_IDS_V1)[number];

export type MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeCornerCodeV1 =
  -1 | 1;

export type MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeDesignRoleV1 =
  | "resolution-v-primary-half-fraction"
  | "nominal-heart-rate-centerline"
  | "opposite-fraction-safety-guard"
  | "full-corner-certification-augmentation";

export type MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeArmIdV1 =
  string;

export type MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeArmV1 =
  Readonly<{
    armId: MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeArmIdV1;
    designRole: MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeDesignRoleV1;
    safetyGuardTarget:
      | "ejection-time"
      | "mean-doppler-gradient"
      | "peak-doppler-gradient"
      | "flow-derived-left-ventricular-tei-index"
      | null;
    calciumProfileId: MainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawMainProfileIdV1;
    heartRateBpm: 50 | 60 | 75 | 90;
    dimensionlessRateCoefficient: 0.4;
    systemicResistanceLevel: "low" | "baseline" | "high";
    systemicResistanceScaleFromBaseline: 0.75 | 1 | 1.3333333333333333;
    systemicArterialTangentStiffnessLevel: "low" | "baseline" | "high";
    systemicArterialTangentStiffnessAbsoluteScaleFromCanonical:
      1.5 | 2 | 2.6666666666666665;
    stressedVenousVolumeLevel: "low" | "baseline" | "high";
    canonicalAdditionalStressedVenousVolumeScale: 0.75 | 1 | 1.3333333333333333;
    fixedTotalBloodVolumeMl: 5288.946892398469 | 5522.11 | 5832.994143468708;
    ventricularTrefForceLevel: "low" | "baseline" | "high";
    ventricularTrefForceScaleFromCandidate: 0.9 | 1 | 1.1;
    codes: Readonly<
      Partial<
        Record<
          MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeFactorIdV1,
          MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeCornerCodeV1
        >
      >
    >;
    circulatoryLoadPointId: MainWireNormalAdultFiveWallCirculatoryLoadPointIdV1;
    complianceProfileId: MainWireArterialCompliancePhysiologyProfileIdV1;
    stressedVenousVolumePointId: MainWireNormalAdultStressedVenousVolumeResearchPointIdV1;
    trefForceLoadProfileId: MainWireVentricularLandTrefForceLoadProfileIdV1;
    initializationPolicy: "independent-canonical-cold-start";
    perArmOutcomeTargetedTuningApplied: false;
  }>;

const HEART_RATE = Object.freeze({
  low: Object.freeze({
    code: -1 as const,
    heartRateBpm: 50 as const,
    calciumProfileId: "matched-alpha-saturating-hr-law-a040-hr-50" as const,
  }),
  high: Object.freeze({
    code: 1 as const,
    heartRateBpm: 90 as const,
    calciumProfileId: "matched-alpha-saturating-hr-law-a040-hr-90" as const,
  }),
});

const SYSTEMIC_RESISTANCE = Object.freeze({
  low: Object.freeze({
    code: -1 as const,
    scale: 0.75 as const,
    pointId: "systemic-resistance-low" as const,
  }),
  baseline: Object.freeze({
    scale: 1 as const,
    pointId: "baseline" as const,
  }),
  high: Object.freeze({
    code: 1 as const,
    scale: (4 / 3) as 1.3333333333333333,
    pointId: "systemic-resistance-high" as const,
  }),
});

const SYSTEMIC_ARTERIAL_TANGENT_STIFFNESS = Object.freeze({
  low: Object.freeze({
    code: -1 as const,
    absoluteScale: 1.5 as const,
    profileId: "arterial-stiffness-three-halves" as const,
  }),
  baseline: Object.freeze({
    absoluteScale: 2 as const,
    profileId: "arterial-stiffness-twofold" as const,
  }),
  high: Object.freeze({
    code: 1 as const,
    absoluteScale: (8 / 3) as 2.6666666666666665,
    profileId: "arterial-stiffness-eight-thirds" as const,
  }),
});

const STRESSED_VENOUS_VOLUME = Object.freeze({
  low: Object.freeze({
    code: -1 as const,
    scale: 0.75 as const,
    fixedTotalBloodVolumeMl: 5288.946892398469 as const,
    pointId: "stressed-venous-volume-low" as const,
  }),
  baseline: Object.freeze({
    scale: 1 as const,
    fixedTotalBloodVolumeMl: 5522.11 as const,
    pointId: "baseline" as const,
  }),
  high: Object.freeze({
    code: 1 as const,
    scale: (4 / 3) as 1.3333333333333333,
    fixedTotalBloodVolumeMl: 5832.994143468708 as const,
    pointId: "stressed-venous-volume-high" as const,
  }),
});

const VENTRICULAR_TREF_FORCE = Object.freeze({
  low: Object.freeze({
    code: -1 as const,
    scale: 0.9 as const,
    profileId: "tref-force-load-low" as const,
  }),
  baseline: Object.freeze({
    scale: 1 as const,
    profileId: "tref-force-load-baseline" as const,
  }),
  high: Object.freeze({
    code: 1 as const,
    scale: 1.1 as const,
    profileId: "tref-force-load-high" as const,
  }),
});

type CornerLevel = "low" | "high";
type CenterlineHeartRate = 50 | 60 | 75 | 90;

function endpointArm(
  designRole:
    | "resolution-v-primary-half-fraction"
    | "opposite-fraction-safety-guard"
    | "full-corner-certification-augmentation",
  heartRateLevel: CornerLevel,
  systemicResistanceLevel: CornerLevel,
  systemicArterialTangentStiffnessLevel: CornerLevel,
  stressedVenousVolumeLevel: CornerLevel,
  ventricularTrefForceLevel: CornerLevel,
  safetyGuardTarget:
    | "ejection-time"
    | "mean-doppler-gradient"
    | "peak-doppler-gradient"
    | "flow-derived-left-ventricular-tei-index"
    | null = null,
): MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeArmV1 {
  const heartRate = HEART_RATE[heartRateLevel];
  const systemicResistance = SYSTEMIC_RESISTANCE[systemicResistanceLevel];
  const stiffness =
    SYSTEMIC_ARTERIAL_TANGENT_STIFFNESS[systemicArterialTangentStiffnessLevel];
  const stressedVolume = STRESSED_VENOUS_VOLUME[stressedVenousVolumeLevel];
  const tref = VENTRICULAR_TREF_FORCE[ventricularTrefForceLevel];
  const codes = Object.freeze({
    "heart-rate": heartRate.code,
    "systemic-resistance": systemicResistance.code,
    "systemic-arterial-tangent-stiffness": stiffness.code,
    "stressed-venous-volume": stressedVolume.code,
    "ventricular-Tref-force-scale": tref.code,
  });
  const armId = [
    designRole === "resolution-v-primary-half-fraction"
      ? "fraction"
      : designRole === "opposite-fraction-safety-guard"
        ? "guard"
        : "certification",
    `hr-${heartRate.heartRateBpm}`,
    `rsys-${systemicResistanceLevel}`,
    `stiffness-${systemicArterialTangentStiffnessLevel}`,
    `volume-${stressedVenousVolumeLevel}`,
    `tref-${ventricularTrefForceLevel}`,
  ].join("__");
  return Object.freeze({
    armId,
    designRole,
    safetyGuardTarget,
    calciumProfileId: heartRate.calciumProfileId,
    heartRateBpm: heartRate.heartRateBpm,
    dimensionlessRateCoefficient: 0.4 as const,
    systemicResistanceLevel,
    systemicResistanceScaleFromBaseline: systemicResistance.scale,
    systemicArterialTangentStiffnessLevel,
    systemicArterialTangentStiffnessAbsoluteScaleFromCanonical:
      stiffness.absoluteScale,
    stressedVenousVolumeLevel,
    canonicalAdditionalStressedVenousVolumeScale: stressedVolume.scale,
    fixedTotalBloodVolumeMl: stressedVolume.fixedTotalBloodVolumeMl,
    ventricularTrefForceLevel,
    ventricularTrefForceScaleFromCandidate: tref.scale,
    codes,
    circulatoryLoadPointId: systemicResistance.pointId,
    complianceProfileId: stiffness.profileId,
    stressedVenousVolumePointId: stressedVolume.pointId,
    trefForceLoadProfileId: tref.profileId,
    initializationPolicy: "independent-canonical-cold-start" as const,
    perArmOutcomeTargetedTuningApplied: false as const,
  });
}

function centerlineArm(
  heartRateBpm: CenterlineHeartRate,
): MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeArmV1 {
  const calciumProfileId =
    `matched-alpha-saturating-hr-law-a040-hr-${heartRateBpm}` as MainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawMainProfileIdV1;
  return Object.freeze({
    armId: `centerline__hr-${heartRateBpm}`,
    designRole: "nominal-heart-rate-centerline" as const,
    safetyGuardTarget: null,
    calciumProfileId,
    heartRateBpm,
    dimensionlessRateCoefficient: 0.4 as const,
    systemicResistanceLevel: "baseline" as const,
    systemicResistanceScaleFromBaseline: 1 as const,
    systemicArterialTangentStiffnessLevel: "baseline" as const,
    systemicArterialTangentStiffnessAbsoluteScaleFromCanonical: 2 as const,
    stressedVenousVolumeLevel: "baseline" as const,
    canonicalAdditionalStressedVenousVolumeScale: 1 as const,
    fixedTotalBloodVolumeMl: 5522.11 as const,
    ventricularTrefForceLevel: "baseline" as const,
    ventricularTrefForceScaleFromCandidate: 1 as const,
    codes: Object.freeze({}),
    circulatoryLoadPointId: "baseline" as const,
    complianceProfileId: "arterial-stiffness-twofold" as const,
    stressedVenousVolumePointId: "baseline" as const,
    trefForceLoadProfileId: "tref-force-load-baseline" as const,
    initializationPolicy: "independent-canonical-cold-start" as const,
    perArmOutcomeTargetedTuningApplied: false as const,
  });
}

const CORNER_LEVELS = Object.freeze(["low", "high"] as const);

export const MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_PRIMARY_FRACTION_ARMS_V1 =
  Object.freeze(
    CORNER_LEVELS.flatMap((systemicResistanceLevel) =>
      CORNER_LEVELS.flatMap((systemicArterialTangentStiffnessLevel) =>
        CORNER_LEVELS.flatMap((stressedVenousVolumeLevel) =>
          CORNER_LEVELS.map((ventricularTrefForceLevel) => {
            const loadProduct =
              SYSTEMIC_RESISTANCE[systemicResistanceLevel].code *
              SYSTEMIC_ARTERIAL_TANGENT_STIFFNESS[
                systemicArterialTangentStiffnessLevel
              ].code *
              STRESSED_VENOUS_VOLUME[stressedVenousVolumeLevel].code *
              VENTRICULAR_TREF_FORCE[ventricularTrefForceLevel].code;
            const heartRateLevel = loadProduct === 1 ? "high" : "low";
            return endpointArm(
              "resolution-v-primary-half-fraction",
              heartRateLevel,
              systemicResistanceLevel,
              systemicArterialTangentStiffnessLevel,
              stressedVenousVolumeLevel,
              ventricularTrefForceLevel,
            );
          }),
        ),
      ),
    ),
  );

export const MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_CENTERLINE_ARMS_V1 =
  Object.freeze([50, 60, 75, 90].map(centerlineArm));

/**
 * Four omitted-fraction guards are frozen before this saturating-law envelope
 * is executed. Their load directions come from the completed predecessor V10
 * full 2^4 load screen and physical stress directions; the heart-rate level is
 * then the unique level placing that load corner in the opposite fraction.
 * This is not adaptive augmentation based on an outcome from the 24-arm run.
 */
export const MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_SAFETY_GUARD_ARMS_V1 =
  Object.freeze([
    endpointArm(
      "opposite-fraction-safety-guard",
      "low",
      "low",
      "high",
      "high",
      "low",
      "ejection-time",
    ),
    endpointArm(
      "opposite-fraction-safety-guard",
      "low",
      "low",
      "low",
      "high",
      "high",
      "mean-doppler-gradient",
    ),
    endpointArm(
      "opposite-fraction-safety-guard",
      "high",
      "low",
      "high",
      "high",
      "high",
      "peak-doppler-gradient",
    ),
    endpointArm(
      "opposite-fraction-safety-guard",
      "high",
      "high",
      "low",
      "low",
      "low",
      "flow-derived-left-ventricular-tei-index",
    ),
  ]);

const OPPOSITE_FRACTION_CORNERS = Object.freeze(
  CORNER_LEVELS.flatMap((systemicResistanceLevel) =>
    CORNER_LEVELS.flatMap((systemicArterialTangentStiffnessLevel) =>
      CORNER_LEVELS.flatMap((stressedVenousVolumeLevel) =>
        CORNER_LEVELS.map((ventricularTrefForceLevel) => {
          const loadProduct =
            SYSTEMIC_RESISTANCE[systemicResistanceLevel].code *
            SYSTEMIC_ARTERIAL_TANGENT_STIFFNESS[
              systemicArterialTangentStiffnessLevel
            ].code *
            STRESSED_VENOUS_VOLUME[stressedVenousVolumeLevel].code *
            VENTRICULAR_TREF_FORCE[ventricularTrefForceLevel].code;
          const heartRateLevel = loadProduct === 1 ? "low" : "high";
          return endpointArm(
            "full-corner-certification-augmentation",
            heartRateLevel,
            systemicResistanceLevel,
            systemicArterialTangentStiffnessLevel,
            stressedVenousVolumeLevel,
            ventricularTrefForceLevel,
          );
        }),
      ),
    ),
  ),
);

export const MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_CERTIFICATION_AUGMENTATION_ARMS_V1 =
  Object.freeze(
    OPPOSITE_FRACTION_CORNERS.filter(
      (candidate) =>
        !MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_SAFETY_GUARD_ARMS_V1.some(
          (guard) => endpointCoordinatesEqual(candidate, guard),
        ),
    ),
  );

export const MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_SCREENING_ARMS_V1 =
  Object.freeze([
    ...MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_PRIMARY_FRACTION_ARMS_V1,
    ...MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_CENTERLINE_ARMS_V1,
    ...MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_SAFETY_GUARD_ARMS_V1,
  ]);

export const MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_ARMS_V1 =
  Object.freeze([
    ...MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_SCREENING_ARMS_V1,
    ...MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_CERTIFICATION_AUGMENTATION_ARMS_V1,
  ]);

function endpointCoordinatesEqual(
  left: MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeArmV1,
  right: MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeArmV1,
): boolean {
  return (
    left.heartRateBpm === right.heartRateBpm &&
    left.systemicResistanceLevel === right.systemicResistanceLevel &&
    left.systemicArterialTangentStiffnessLevel ===
      right.systemicArterialTangentStiffnessLevel &&
    left.stressedVenousVolumeLevel === right.stressedVenousVolumeLevel &&
    left.ventricularTrefForceLevel === right.ventricularTrefForceLevel
  );
}

export const MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_CLAIM_V1 =
  Object.freeze({
    role: "fixed-V10-matched-alpha-saturating-a040-five-factor-robustness-envelope" as const,
    primaryDesign:
      "resolution-V-half-fraction-H-times-R-times-K-times-V-times-T-equals-plus-one" as const,
    primaryFractionArmCount: 16 as const,
    nominalHeartRateCenterlineArmCount: 4 as const,
    oppositeFractionSafetyGuardArmCount: 4 as const,
    screeningArmCount: 24 as const,
    fullCornerCertificationAugmentationArmCount: 12 as const,
    fullCornerCount: 32 as const,
    closedCatalogArmCount: 36 as const,
    closedCatalogSamplesDiscretePointsOnly: true as const,
    continuousInteriorBetweenCatalogPointsEvaluated: false as const,
    continuousInteriorRobustnessEstablished: false as const,
    positiveClaimMeansClosedCatalogReadoutNotContinuousEnvelopeCertification:
      true as const,
    positiveFullEnvelopeClaimRequiresAllClosedCatalogArms: true as const,
    screeningPassingDoesNotCertifyTwelveUnobservedCorners: true as const,
    augmentationSelectionAdaptive: false as const,
    fixedHeartRatesBpm: Object.freeze([50, 60, 75, 90] as const),
    dimensionlessRateCoefficientHeldAt: 0.4 as const,
    atrioventricularDelayHeldAtSec: 0.12 as const,
    systemicResistanceScaleFromBaseline: Object.freeze({
      low: 0.75 as const,
      baseline: 1 as const,
      high: 1.3333333333333333 as const,
    }),
    systemicArterialTangentStiffnessAbsoluteScaleFromCanonical: Object.freeze({
      low: 1.5 as const,
      baseline: 2 as const,
      high: 2.6666666666666665 as const,
    }),
    stressedVenousVolumeOperatingPoint: Object.freeze({
      low: Object.freeze({
        canonicalAdditionalSvVcVolumeScale: 0.75 as const,
        fixedTotalBloodVolumeMl: 5288.946892398469 as const,
      }),
      baseline: Object.freeze({
        canonicalAdditionalSvVcVolumeScale: 1 as const,
        fixedTotalBloodVolumeMl: 5522.11 as const,
      }),
      high: Object.freeze({
        canonicalAdditionalSvVcVolumeScale: 1.3333333333333333 as const,
        fixedTotalBloodVolumeMl: 5832.994143468708 as const,
      }),
    }),
    ventricularTrefForceScaleFromCandidate: Object.freeze({
      low: 0.9 as const,
      baseline: 1 as const,
      high: 1.1 as const,
    }),
    pulmonaryResistanceHeldAtBaseline: true as const,
    aorticMaximumForwardEoaHeldAtCm2: 3.5 as const,
    V10PressureRecoveryAndProximalPortOwnershipHeldExactly: true as const,
    independentCanonicalColdStartPerArm: true as const,
    perArmOutcomeTargetedTuningApplied: false as const,
    safetyGuardsFrozenBeforeCurrentEnvelopeExecution: true as const,
    safetyGuardSelectionUsesPredecessorFullLoadScreenAndPhysicalDirections:
      true as const,
    certificationAugmentationPredeclaredBeforeCurrentEnvelopeExecution:
      true as const,
    fixedPhysicalHorizonAuditCompleted: false as const,
    arbitraryNumericParameterPatchAccepted: false as const,
    newContinuousStateAdded: false as const,
    acceptedStateOrCheckpointTopologyChanged: false as const,
    parameterSearchOrFitting: false as const,
    clinicalValidationClaimed: false as const,
    canonicalAdoptionEstablished: false as const,
  });

export function resolveMainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeArmV1(
  armId: MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeArmIdV1,
): MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeArmV1 {
  const resolved =
    MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_ARMS_V1.find(
      (candidate) => candidate.armId === armId,
    );
  if (resolved === undefined) {
    throw new Error(`unsupported V10 saturating robustness arm: ${armId}`);
  }
  return resolved;
}
