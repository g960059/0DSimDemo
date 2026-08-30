import {
  resolveMainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeArmV1,
  type MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeArmV1,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeV1";

export const MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_FIXED_HORIZON_SENTINEL_V1_ID =
  "main-wire-aortic-outflow-v10-matched-alpha-saturating-robustness-envelope-fixed-horizon-sentinel-v1" as const;

export const MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_FIXED_HORIZON_SENTINEL_SELECTION_REASON_IDS_V1 =
  Object.freeze([
    "maximum-one-percent-flow-ejection-time",
    "maximum-acceleration-time",
    "maximum-mean-doppler-gradient",
    "maximum-peak-vena-contracta-velocity",
    "maximum-peak-doppler-gradient",
    "minimum-flow-weighted-functional-opening-utilization",
    "slowest-period1-convergence",
    "highest-terminal-period1-residual",
  ] as const);

export type MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeFixedHorizonSentinelSelectionReasonIdV1 =
  (typeof MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_FIXED_HORIZON_SENTINEL_SELECTION_REASON_IDS_V1)[number];

export const MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_FIXED_HORIZON_SENTINEL_ARM_IDS_V1 =
  Object.freeze([
    "guard__hr-50__rsys-low__stiffness-high__volume-high__tref-low",
    "fraction__hr-50__rsys-low__stiffness-low__volume-low__tref-high",
    "fraction__hr-50__rsys-low__stiffness-high__volume-high__tref-high",
    "fraction__hr-90__rsys-high__stiffness-high__volume-low__tref-low",
    "fraction__hr-90__rsys-high__stiffness-low__volume-high__tref-low",
    "centerline__hr-90",
  ] as const);

export type MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeFixedHorizonSentinelArmIdV1 =
  (typeof MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_FIXED_HORIZON_SENTINEL_ARM_IDS_V1)[number];

export type MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeFixedHorizonSentinelArmV1 =
  Readonly<{
    sentinelArmId: MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeFixedHorizonSentinelArmIdV1;
    selectionReasons: readonly MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeFixedHorizonSentinelSelectionReasonIdV1[];
    sourceEnvelopeArm: MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeArmV1;
    sourcePrimaryExecution: "cycle-over-2000-maximum-72-early-stop";
    selectionFrozenBeforeFixedHorizonExecution: true;
  }>;

const SELECTION_REASONS = Object.freeze({
  "guard__hr-50__rsys-low__stiffness-high__volume-high__tref-low":
    Object.freeze([
      "maximum-one-percent-flow-ejection-time",
      "maximum-acceleration-time",
    ] as const),
  "fraction__hr-50__rsys-low__stiffness-low__volume-low__tref-high":
    Object.freeze(["maximum-mean-doppler-gradient"] as const),
  "fraction__hr-50__rsys-low__stiffness-high__volume-high__tref-high":
    Object.freeze([
      "maximum-peak-vena-contracta-velocity",
      "maximum-peak-doppler-gradient",
    ] as const),
  "fraction__hr-90__rsys-high__stiffness-high__volume-low__tref-low":
    Object.freeze([
      "minimum-flow-weighted-functional-opening-utilization",
    ] as const),
  "fraction__hr-90__rsys-high__stiffness-low__volume-high__tref-low":
    Object.freeze(["slowest-period1-convergence"] as const),
  "centerline__hr-90": Object.freeze([
    "highest-terminal-period1-residual",
  ] as const),
} satisfies Readonly<
  Record<
    MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeFixedHorizonSentinelArmIdV1,
    readonly MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeFixedHorizonSentinelSelectionReasonIdV1[]
  >
>);

export const MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_FIXED_HORIZON_SENTINEL_ARMS_V1 =
  Object.freeze(
    MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_FIXED_HORIZON_SENTINEL_ARM_IDS_V1.map(
      (sentinelArmId) => {
        const sourceEnvelopeArm =
          resolveMainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeArmV1(
            sentinelArmId,
          );
        if (
          sourceEnvelopeArm.heartRateBpm !== 50 &&
          sourceEnvelopeArm.heartRateBpm !== 90
        ) {
          throw new Error(
            `${sentinelArmId} fixed-horizon sentinel must use HR50 or HR90`,
          );
        }
        return Object.freeze({
          sentinelArmId,
          selectionReasons: SELECTION_REASONS[sentinelArmId],
          sourceEnvelopeArm,
          sourcePrimaryExecution:
            "cycle-over-2000-maximum-72-early-stop" as const,
          selectionFrozenBeforeFixedHorizonExecution: true as const,
        });
      },
    ),
  );

export const MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_FIXED_HORIZON_SENTINEL_CLAIM_V1 =
  Object.freeze({
    role: "frozen-primary-limiting-union-fixed-physical-horizon-sentinel" as const,
    sourcePrimaryStepsPerCycle: 2_000 as const,
    sourcePrimaryMaximumBeatCount: 72 as const,
    sourcePrimaryUsesPeriodicEarlyStop: true as const,
    fixedSentinelStepsPerCycle: 4_000 as const,
    fixedPhysicalHorizonSec: 48 as const,
    fixedSentinelArmCount: 6 as const,
    frozenSelectionReasonCount: 8 as const,
    selectionFrozenBeforeFixedHorizonExecution: true as const,
    independentCanonicalColdStartPerExecution: true as const,
    publicNumericExecutionOverridesAccepted: false as const,
    limitingUnionCoversAllThirtySixEnvelopeArms: false as const,
    continuityEquivalentEoaVariationRecertifiedBySentinel: false as const,
    continuousEnvelopeCertificationClaimed: false as const,
    horizonAndTimeStepEffectsSeparatedByThisCompoundComparison: false as const,
    compoundMismatchRequiresPrespecifiedDecompositionBeforeAttribution:
      true as const,
    parameterSearchOrFitting: false as const,
    clinicalValidationClaimed: false as const,
    canonicalAdoptionEstablished: false as const,
  });

export function resolveMainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeFixedHorizonSentinelArmV1(
  sentinelArmId: MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeFixedHorizonSentinelArmIdV1,
): MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeFixedHorizonSentinelArmV1 {
  const resolved =
    MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_FIXED_HORIZON_SENTINEL_ARMS_V1.find(
      (candidate) => candidate.sentinelArmId === sentinelArmId,
    );
  if (resolved === undefined) {
    throw new Error(
      `unsupported V10 saturating robustness fixed-horizon sentinel arm: ${sentinelArmId}`,
    );
  }
  return resolved;
}
