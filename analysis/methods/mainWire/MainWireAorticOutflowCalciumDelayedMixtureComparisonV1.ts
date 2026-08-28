import {
  measureMainWireAorticOutflowCalciumWaveformCycleV1,
  screenMainWireAorticOutflowCalciumCandidateV1,
  type MainWireAorticOutflowCalciumCandidateScreenResultV1,
  type MainWireAorticOutflowCalciumWaveformCycleMetricsV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowCalciumWaveformComparisonV1";
import {
  evaluateMainWireAorticOutflowExternalReferenceCompatibilityV1,
  type MainWireAorticOutflowExternalReferenceCompatibilityV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowExternalReferenceCompatibilityV1";
import {
  measureMainWireAorticOutflowKinematicFloorV1,
  type MainWireAorticOutflowKinematicFloorV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowKinematicFloorV1";
import {
  evaluateMainWireAorticOutflowPreservedMacroFeasibilityV1,
  type MainWireAorticOutflowPreservedMacroFeasibilityV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowPreservedMacroFeasibilityV1";
import {
  countMainWireStrictLocalMaximaV1,
} from "@/analysis/methods/mainWire/MainWireAorticValveAblationComparisonV1";
import {
  FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
  type FiveWallNormalCalciumDriveParamsV1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import {
  MAIN_WIRE_VENTRICULAR_CALCIUM_DELAYED_MIXTURE_PROFILE_IDS_V1,
  resolveMainWireVentricularCalciumDelayedMixtureParamsV1,
  resolveMainWireVentricularCalciumDelayedMixtureProfileV1,
  type MainWireVentricularCalciumDelayedMixtureProfileIdV1,
  type MainWireVentricularCalciumDelayedMixtureProfileV1,
} from "@/engine/myocardium/calcium/MainWireVentricularCalciumDelayedMixtureAblationV1";
import type {
  MainWireNormalAdultFiveWallPeriodicResultV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";

export const MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_DELAYED_MIXTURE_COMPARISON_V1_ID =
  "main-wire-aortic-outflow-calcium-delayed-mixture-comparison-v1" as const;

export const MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_DELAYED_MIXTURE_COMPARISON_CLAIM_V1 =
  Object.freeze({
    source: "last-retained-complete-beat-per-independent-cold-run" as const,
    exactFrameMutation: false as const,
    waveformPeakCounting:
      "strict-unsmoothed-interior-local-maxima-above-five-percent" as const,
    candidateScreen:
      "shared-aortic-outflow-calcium-candidate-retention-screen" as const,
    morphologyScreen:
      "one-calcium-peak-and-one-LVFW-active-stress-peak-required" as const,
    factorialContrast:
      "fixed-delayed-weight-by-delay-reference-difference-of-differences" as const,
    calciumExposurePreservedAnalytically: true as const,
    stateOrCheckpointTopologyChanged: false as const,
    aorticValveConstitutiveLawChanged: false as const,
    smoothingApplied: false as const,
    interpolationApplied: false as const,
    externalReferenceRole:
      "descriptive-falsification-screen-not-clinical-target-fit" as const,
    preservedMacroFeasibilityRole:
      "necessary-fixed-EOA-kinematic-screen-not-sufficient-acceptance" as const,
    parameterSearchOrFitting: false as const,
    clinicalValidationClaimed: false as const,
    canonicalAdoptionEstablished: false as const,
  });

export type MainWireAorticOutflowCalciumDelayedMixtureArmInputV1 = Readonly<{
  profileId: MainWireVentricularCalciumDelayedMixtureProfileIdV1;
  periodicResult: MainWireNormalAdultFiveWallPeriodicResultV1;
}>;

export type MainWireAorticOutflowCalciumDelayedMixtureArmV1 = Readonly<{
  role: "canonical" | "delayed-mixture";
  profile: MainWireVentricularCalciumDelayedMixtureProfileV1 | null;
  cycle: MainWireAorticOutflowCalciumWaveformCycleMetricsV1;
  ventricularCalciumStrictLocalPeakCountAboveFivePercent: number;
  lvfwActiveStressStrictLocalPeakCountAboveFivePercent: number;
  externalReferenceCompatibility:
    MainWireAorticOutflowExternalReferenceCompatibilityV1;
  kinematicFloor: MainWireAorticOutflowKinematicFloorV1;
  preservedMacroFeasibility:
    MainWireAorticOutflowPreservedMacroFeasibilityV1;
  candidateScreen: MainWireAorticOutflowCalciumCandidateScreenResultV1 | null;
  morphologyScreen: null | Readonly<{
    singleVentricularCalciumPeakPreserved: boolean;
    singleLvfwActiveStressPeakPreserved: boolean;
    morphologyPreserved: boolean;
    retainedMorphologySafeDirectionalCandidate: boolean;
    referenceNormalizedMorphologySafeCandidate: boolean;
  }>;
}>;

export type MainWireAorticOutflowCalciumDelayedMixtureFactorialMetricIdV1 =
  | "aortic-maximum-flow"
  | "aortic-ejection-time-proxy"
  | "mean-doppler-gradient"
  | "peak-doppler-gradient"
  | "aortic-forward-volume"
  | "left-ventricular-ejection-fraction"
  | "right-ventricular-ejection-fraction"
  | "cardiac-output"
  | "mean-aortic-pressure"
  | "peak-left-ventricular-pressure"
  | "lvfw-active-stress-integral"
  | "aortic-root-storage-at-aortic-flow-peak";

export type MainWireAorticOutflowCalciumDelayedMixtureFactorialContrastV1 =
  Readonly<{
    metricId:
      MainWireAorticOutflowCalciumDelayedMixtureFactorialMetricIdV1;
    canonicalValue: number;
    quarterRiseValue: number;
    halfWeightEffectAtRiseDelay: number;
    decayDelayEffectAtQuarterWeight: number;
    interactionDifferenceOfDifferences: number;
    halfWeightEffectAtDecayDelay: number;
    decayDelayEffectAtHalfWeight: number;
  }>;

export type MainWireAorticOutflowCalciumDelayedMixtureComparisonV1 = Readonly<{
  methodId:
    typeof MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_DELAYED_MIXTURE_COMPARISON_V1_ID;
  canonical: MainWireAorticOutflowCalciumDelayedMixtureArmV1;
  delayedMixtures:
    readonly MainWireAorticOutflowCalciumDelayedMixtureArmV1[];
  factorialContrasts:
    readonly MainWireAorticOutflowCalciumDelayedMixtureFactorialContrastV1[];
  externalReferenceSelection: Readonly<{
    morphologySafeCandidateRank:
      readonly MainWireVentricularCalciumDelayedMixtureProfileIdV1[];
    bestMorphologySafeCandidateId:
      MainWireVentricularCalciumDelayedMixtureProfileIdV1 | null;
    bestMorphologySafeCandidateImprovesCanonical: boolean;
    anyMorphologySafeCandidateMatchesAllPrimaryReferenceIntervals: boolean;
    anyMorphologySafeCandidatePassesPreservedOutputFixedEoaUpperBand: boolean;
    nextStepDecision:
      | "stop-delayed-mixture-waveform-axis"
      | "extend-unimodal-temporal-redistribution-with-fixed-bracket"
      | "proceed-to-dt-and-load-refinement";
  }>;
  claim:
    typeof MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_DELAYED_MIXTURE_COMPARISON_CLAIM_V1;
}>;

export function compareMainWireAorticOutflowCalciumDelayedMixtureV1(
  canonicalResult: MainWireNormalAdultFiveWallPeriodicResultV1,
  inputs: readonly MainWireAorticOutflowCalciumDelayedMixtureArmInputV1[],
): MainWireAorticOutflowCalciumDelayedMixtureComparisonV1 {
  const byId = new Map<
    MainWireVentricularCalciumDelayedMixtureProfileIdV1,
    MainWireNormalAdultFiveWallPeriodicResultV1
  >();
  for (const input of inputs) {
    if (byId.has(input.profileId)) {
      throw new Error(`duplicate delayed-mixture arm: ${input.profileId}`);
    }
    byId.set(input.profileId, input.periodicResult);
  }
  for (const profileId of
    MAIN_WIRE_VENTRICULAR_CALCIUM_DELAYED_MIXTURE_PROFILE_IDS_V1) {
    if (!byId.has(profileId)) {
      throw new Error(`missing delayed-mixture arm: ${profileId}`);
    }
  }
  if (
    byId.size
      !== MAIN_WIRE_VENTRICULAR_CALCIUM_DELAYED_MIXTURE_PROFILE_IDS_V1.length
  ) {
    throw new Error("delayed-mixture comparison accepts exactly four arms");
  }
  const canonicalRaw = measureArm(
    "canonical",
    null,
    canonicalResult,
    FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
  );
  const canonical = Object.freeze({
    ...canonicalRaw,
    candidateScreen: null,
    morphologyScreen: null,
  });
  const delayedMixtures = Object.freeze(
    MAIN_WIRE_VENTRICULAR_CALCIUM_DELAYED_MIXTURE_PROFILE_IDS_V1.map(
      (profileId) => {
        const profile =
          resolveMainWireVentricularCalciumDelayedMixtureProfileV1(profileId);
        const raw = measureArm(
          "delayed-mixture",
          profile,
          byId.get(profileId)!,
          resolveMainWireVentricularCalciumDelayedMixtureParamsV1(profileId),
        );
        const candidateScreen =
          screenMainWireAorticOutflowCalciumCandidateV1(
            raw.cycle,
            canonical.cycle,
          );
        const singleVentricularCalciumPeakPreserved =
          raw.ventricularCalciumStrictLocalPeakCountAboveFivePercent === 1;
        const singleLvfwActiveStressPeakPreserved =
          raw.lvfwActiveStressStrictLocalPeakCountAboveFivePercent === 1;
        const morphologyPreserved =
          singleVentricularCalciumPeakPreserved
          && singleLvfwActiveStressPeakPreserved;
        return Object.freeze({
          ...raw,
          candidateScreen,
          morphologyScreen: Object.freeze({
            singleVentricularCalciumPeakPreserved,
            singleLvfwActiveStressPeakPreserved,
            morphologyPreserved,
            retainedMorphologySafeDirectionalCandidate:
              morphologyPreserved
              && candidateScreen.retainedDirectionalCandidate,
            referenceNormalizedMorphologySafeCandidate:
              morphologyPreserved
              && candidateScreen.referenceNormalizedCandidate,
          }),
        });
      },
    ),
  );
  const [quarterRise, halfRise, quarterDecay, halfDecay] = delayedMixtures;
  const contrast = (
    metricId: MainWireAorticOutflowCalciumDelayedMixtureFactorialMetricIdV1,
    read: (arm: MainWireAorticOutflowCalciumDelayedMixtureArmV1) => number,
  ): MainWireAorticOutflowCalciumDelayedMixtureFactorialContrastV1 => {
    const baseline = read(quarterRise!);
    const weight = read(halfRise!);
    const delay = read(quarterDecay!);
    const both = read(halfDecay!);
    return Object.freeze({
      metricId,
      canonicalValue: read(canonical),
      quarterRiseValue: baseline,
      halfWeightEffectAtRiseDelay: weight - baseline,
      decayDelayEffectAtQuarterWeight: delay - baseline,
      interactionDifferenceOfDifferences:
        both - weight - delay + baseline,
      halfWeightEffectAtDecayDelay: both - delay,
      decayDelayEffectAtHalfWeight: both - weight,
    });
  };
  const factorialContrasts = Object.freeze([
    contrast("aortic-maximum-flow", (arm) =>
      arm.cycle.aorticMaximumFlowMlPerSec),
    contrast("aortic-ejection-time-proxy", (arm) =>
      arm.cycle.aorticEjectionTimeProxySec),
    contrast("mean-doppler-gradient", (arm) =>
      arm.cycle.meanDopplerGradientMmHg),
    contrast("peak-doppler-gradient", (arm) =>
      arm.cycle.peakDopplerGradientMmHg),
    contrast("aortic-forward-volume", (arm) =>
      arm.cycle.aorticForwardVolumeMl),
    contrast("left-ventricular-ejection-fraction", (arm) =>
      arm.cycle.leftVentricularEjectionFraction01),
    contrast("right-ventricular-ejection-fraction", (arm) =>
      arm.cycle.rightVentricularEjectionFraction01),
    contrast("cardiac-output", (arm) =>
      arm.cycle.netAorticCardiacOutputLPerMin),
    contrast("mean-aortic-pressure", (arm) =>
      arm.cycle.meanAorticAbsolutePressureMmHg),
    contrast("peak-left-ventricular-pressure", (arm) =>
      arm.cycle.peakLeftVentricularPressureMmHg),
    contrast("lvfw-active-stress-integral", (arm) =>
      arm.cycle.positiveActiveStressCycleIntegralPaSecByWall.LVFW),
    contrast("aortic-root-storage-at-aortic-flow-peak", (arm) =>
      arm.cycle.aorticPressureFlowCoupling.summary.aorticRootStorage
        .flowAtAorticValveFlowPeakMlPerSec),
  ]);
  const morphologySafe = delayedMixtures.filter((arm) =>
    arm.morphologyScreen!.morphologyPreserved);
  const morphologySafeRank = Object.freeze([...morphologySafe]
    .sort((left, right) =>
      left.externalReferenceCompatibility.primaryReferenceBandDistanceRms
      - right.externalReferenceCompatibility.primaryReferenceBandDistanceRms)
    .map((arm) => arm.profile!.profileId));
  const best = morphologySafeRank.length === 0
    ? null
    : delayedMixtures.find((arm) =>
      arm.profile!.profileId === morphologySafeRank[0])!;
  const bestImprovesCanonical = best !== null
    && best.externalReferenceCompatibility.primaryReferenceBandDistanceRms
      < canonical.externalReferenceCompatibility.primaryReferenceBandDistanceRms;
  const anyMatchesAll = morphologySafe.some((arm) =>
    arm.externalReferenceCompatibility.allPrimaryComparisonIntervalsMatched);
  const anyPassesPreservedOutput = morphologySafe.some((arm) =>
    arm.preservedMacroFeasibility
      .preservedOutputFixedEoaUpperBandFeasibleAtCurrentWaveform);
  const nextStepDecision = !bestImprovesCanonical
    ? "stop-delayed-mixture-waveform-axis" as const
    : anyMatchesAll && anyPassesPreservedOutput
      ? "proceed-to-dt-and-load-refinement" as const
      : "extend-unimodal-temporal-redistribution-with-fixed-bracket" as const;
  return Object.freeze({
    methodId:
      MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_DELAYED_MIXTURE_COMPARISON_V1_ID,
    canonical,
    delayedMixtures,
    factorialContrasts,
    externalReferenceSelection: Object.freeze({
      morphologySafeCandidateRank: morphologySafeRank,
      bestMorphologySafeCandidateId: best?.profile!.profileId ?? null,
      bestMorphologySafeCandidateImprovesCanonical: bestImprovesCanonical,
      anyMorphologySafeCandidateMatchesAllPrimaryReferenceIntervals:
        anyMatchesAll,
      anyMorphologySafeCandidatePassesPreservedOutputFixedEoaUpperBand:
        anyPassesPreservedOutput,
      nextStepDecision,
    }),
    claim:
      MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_DELAYED_MIXTURE_COMPARISON_CLAIM_V1,
  });
}

function measureArm(
  role: MainWireAorticOutflowCalciumDelayedMixtureArmV1["role"],
  profile: MainWireVentricularCalciumDelayedMixtureProfileV1 | null,
  result: MainWireNormalAdultFiveWallPeriodicResultV1,
  calciumParams: FiveWallNormalCalciumDriveParamsV1,
): Omit<
  MainWireAorticOutflowCalciumDelayedMixtureArmV1,
  "candidateScreen" | "morphologyScreen"
> {
  const beat = result.retainedCompleteBeats.at(-1);
  if (beat === undefined || beat.samples.length === 0) {
    throw new Error(`${role} delayed-mixture comparison arm requires a beat`);
  }
  const cycle = measureMainWireAorticOutflowCalciumWaveformCycleV1(
    result,
    calciumParams,
    profile?.profileId ?? role,
  );
  const kinematicFloor = measureMainWireAorticOutflowKinematicFloorV1(result);
  const externalReferenceCompatibility =
    evaluateMainWireAorticOutflowExternalReferenceCompatibilityV1({
      aorticEjectionTimeProxySec: cycle.aorticEjectionTimeProxySec,
      aorticAccelerationTimeProxySec:
        cycle.timeFromAorticFlowOnsetToPeakSec,
      peakVenaContractaVelocityMPerSec:
        cycle.peakVenaContractaVelocityMPerSec,
      timeMeanSimplifiedDopplerGradientMmHg:
        cycle.meanDopplerGradientMmHg,
      configuredMaximumForwardEoaCm2:
        kinematicFloor.source.configuredMaximumForwardEoaCm2,
    });
  const preservedMacroFeasibility =
    evaluateMainWireAorticOutflowPreservedMacroFeasibilityV1({
      forwardVolumeMl: kinematicFloor.source.forwardVolumeMl,
      forwardFlowTimeSec: kinematicFloor.source.forwardFlowTimeSec,
      maximumForwardFlowMlPerSec:
        kinematicFloor.source.maximumForwardFlowMlPerSec,
      configuredMaximumForwardEoaCm2:
        kinematicFloor.source.configuredMaximumForwardEoaCm2,
    });
  const ventricularCalcium = beat.samples.map((sample) => Math.max(
    0,
    sample.freeCalciumUM.LVFW
      - calciumParams.ventricular.diastolicCalciumUM,
  ));
  const lvfwActiveStress = beat.samples.map((sample) =>
    Math.max(0, sample.wallStressPa.LVFW.active));
  return Object.freeze({
    role,
    profile,
    cycle,
    ventricularCalciumStrictLocalPeakCountAboveFivePercent:
      countMainWireStrictLocalMaximaV1(
        ventricularCalcium,
        0.05 * maximum(ventricularCalcium),
      ),
    lvfwActiveStressStrictLocalPeakCountAboveFivePercent:
      countMainWireStrictLocalMaximaV1(
        lvfwActiveStress,
        0.05 * maximum(lvfwActiveStress),
      ),
    externalReferenceCompatibility,
    kinematicFloor,
    preservedMacroFeasibility,
  });
}

function maximum(values: readonly number[]): number {
  let result = Number.NEGATIVE_INFINITY;
  for (const value of values) result = Math.max(result, value);
  return result === Number.NEGATIVE_INFINITY ? 0 : result;
}
