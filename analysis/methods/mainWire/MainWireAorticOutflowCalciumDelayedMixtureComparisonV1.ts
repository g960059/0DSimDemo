import {
  measureMainWireAorticOutflowCalciumWaveformCycleV1,
  screenMainWireAorticOutflowCalciumCandidateV1,
  type MainWireAorticOutflowCalciumCandidateScreenResultV1,
  type MainWireAorticOutflowCalciumWaveformCycleMetricsV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowCalciumWaveformComparisonV1";
import {
  countMainWireStrictLocalMaximaV1,
} from "@/analysis/methods/mainWire/MainWireAorticValveAblationComparisonV1";
import {
  FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import {
  MAIN_WIRE_VENTRICULAR_CALCIUM_DELAYED_MIXTURE_PROFILE_V1,
  resolveMainWireVentricularCalciumDelayedMixtureParamsV1,
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
    calciumExposurePreservedAnalytically: true as const,
    stateOrCheckpointTopologyChanged: false as const,
    aorticValveConstitutiveLawChanged: false as const,
    smoothingApplied: false as const,
    interpolationApplied: false as const,
    parameterSearchOrFitting: false as const,
    clinicalValidationClaimed: false as const,
    canonicalAdoptionEstablished: false as const,
  });

export type MainWireAorticOutflowCalciumDelayedMixtureArmV1 = Readonly<{
  role: "canonical" | "delayed-mixture";
  cycle: MainWireAorticOutflowCalciumWaveformCycleMetricsV1;
  ventricularCalciumStrictLocalPeakCountAboveFivePercent: number;
  lvfwActiveStressStrictLocalPeakCountAboveFivePercent: number;
}>;

export type MainWireAorticOutflowCalciumDelayedMixtureComparisonV1 = Readonly<{
  methodId:
    typeof MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_DELAYED_MIXTURE_COMPARISON_V1_ID;
  profile: typeof MAIN_WIRE_VENTRICULAR_CALCIUM_DELAYED_MIXTURE_PROFILE_V1;
  canonical: MainWireAorticOutflowCalciumDelayedMixtureArmV1;
  delayedMixture: MainWireAorticOutflowCalciumDelayedMixtureArmV1;
  candidateScreen: MainWireAorticOutflowCalciumCandidateScreenResultV1;
  claim:
    typeof MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_DELAYED_MIXTURE_COMPARISON_CLAIM_V1;
}>;

export function compareMainWireAorticOutflowCalciumDelayedMixtureV1(
  canonicalResult: MainWireNormalAdultFiveWallPeriodicResultV1,
  delayedMixtureResult: MainWireNormalAdultFiveWallPeriodicResultV1,
): MainWireAorticOutflowCalciumDelayedMixtureComparisonV1 {
  const delayedParams =
    resolveMainWireVentricularCalciumDelayedMixtureParamsV1();
  const canonical = measureArm(
    "canonical",
    canonicalResult,
    FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
  );
  const delayedMixture = measureArm(
    "delayed-mixture",
    delayedMixtureResult,
    delayedParams,
  );
  return Object.freeze({
    methodId:
      MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_DELAYED_MIXTURE_COMPARISON_V1_ID,
    profile: MAIN_WIRE_VENTRICULAR_CALCIUM_DELAYED_MIXTURE_PROFILE_V1,
    canonical,
    delayedMixture,
    candidateScreen: screenMainWireAorticOutflowCalciumCandidateV1(
      delayedMixture.cycle,
      canonical.cycle,
    ),
    claim:
      MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_DELAYED_MIXTURE_COMPARISON_CLAIM_V1,
  });
}

function measureArm(
  role: MainWireAorticOutflowCalciumDelayedMixtureArmV1["role"],
  result: MainWireNormalAdultFiveWallPeriodicResultV1,
  calciumParams: typeof FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
): MainWireAorticOutflowCalciumDelayedMixtureArmV1 {
  const beat = result.retainedCompleteBeats.at(-1);
  if (beat === undefined || beat.samples.length === 0) {
    throw new Error(`${role} delayed-mixture comparison arm requires a beat`);
  }
  const cycle = measureMainWireAorticOutflowCalciumWaveformCycleV1(
    result,
    calciumParams,
    role,
  );
  const ventricularCalcium = beat.samples.map((sample) => Math.max(
    0,
    sample.freeCalciumUM.LVFW
      - calciumParams.ventricular.diastolicCalciumUM,
  ));
  const lvfwActiveStress = beat.samples.map((sample) =>
    Math.max(0, sample.wallStressPa.LVFW.active));
  return Object.freeze({
    role,
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
  });
}

function maximum(values: readonly number[]): number {
  let result = Number.NEGATIVE_INFINITY;
  for (const value of values) result = Math.max(result, value);
  return result === Number.NEGATIVE_INFINITY ? 0 : result;
}
