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
  resolveMainWireVentricularCalciumDelayedMixtureParamsV1,
  resolveMainWireVentricularCalciumDelayedMixtureProfileV1,
} from "@/engine/myocardium/calcium/MainWireVentricularCalciumDelayedMixtureAblationV1";
import {
  resolveMainWireNormalAdultFiveWallCirculatoryLoadPointV1,
  type MainWireNormalAdultFiveWallCirculatoryLoadPointIdV1,
  type MainWireNormalAdultFiveWallCirculatoryLoadPointV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallCirculatoryLoadPointsV1";
import type {
  MainWireNormalAdultFiveWallPeriodicResultV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";

export const MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_DELAYED_MIXTURE_LOAD_ENVELOPE_V1_ID =
  "main-wire-aortic-outflow-calcium-delayed-mixture-load-envelope-v1" as const;

export const MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_DELAYED_MIXTURE_LOAD_PROFILE_ID_V1 =
  "ventricular-calcium-half-delayed-by-rise-time-exposure-preserving" as const;

export const MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_DELAYED_MIXTURE_LOAD_POINT_IDS_V1 =
  Object.freeze([
    "systemic-resistance-low",
    "baseline",
    "systemic-resistance-high",
  ] as const);

type SystemicLoadPointId =
  (typeof MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_DELAYED_MIXTURE_LOAD_POINT_IDS_V1)[number];

export const MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_DELAYED_MIXTURE_LOAD_ENVELOPE_CLAIM_V1 =
  Object.freeze({
    source: "last-retained-complete-beat-per-independent-cold-run" as const,
    candidateProfileSelection:
      "strongest-single-peaked-fixed-rise-delay-bracket-arm" as const,
    outcomeInformedProfileSelection: true as const,
    numericParameterFittingOrOptimization: false as const,
    loadAxis: "systemic-resistance-only" as const,
    loadScales: Object.freeze([0.75, 1, 4 / 3] as const),
    canonicalComparatorAtEveryLoad: true as const,
    morphologyRequirement:
      "single-calcium-single-LVFW-active-stress-single-aortic-flow-peak" as const,
    exactFrameMutation: false as const,
    clinicalValidationClaimed: false as const,
    canonicalAdoptionEstablished: false as const,
  });

export type MainWireAorticOutflowCalciumDelayedMixtureLoadInputV1 = Readonly<{
  loadPointId: SystemicLoadPointId;
  canonicalResult: MainWireNormalAdultFiveWallPeriodicResultV1;
  candidateResult: MainWireNormalAdultFiveWallPeriodicResultV1;
}>;

export type MainWireAorticOutflowCalciumDelayedMixtureLoadArmV1 = Readonly<{
  loadPoint: MainWireNormalAdultFiveWallCirculatoryLoadPointV1;
  canonical: MainWireAorticOutflowCalciumWaveformCycleMetricsV1;
  candidate: MainWireAorticOutflowCalciumWaveformCycleMetricsV1;
  candidateScreen: MainWireAorticOutflowCalciumCandidateScreenResultV1;
  candidateVentricularCalciumPeakCountAboveFivePercent: number;
  candidateLvfwActiveStressPeakCountAboveFivePercent: number;
  candidateAorticFlowPeakCountAboveFivePercent: number;
  morphologyPreserved: boolean;
  morphologySafeDirectionalCandidate: boolean;
}>;

export type MainWireAorticOutflowCalciumDelayedMixtureLoadEnvelopeV1 =
  Readonly<{
    methodId:
      typeof MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_DELAYED_MIXTURE_LOAD_ENVELOPE_V1_ID;
    profile: ReturnType<
      typeof resolveMainWireVentricularCalciumDelayedMixtureProfileV1
    >;
    arms:
      readonly MainWireAorticOutflowCalciumDelayedMixtureLoadArmV1[];
    allRunsPeriod1AndIntegrated: boolean;
    morphologyPreservedAcrossEnvelope: boolean;
    peakFlowLoweredAcrossEnvelope: boolean;
    meanDopplerGradientLoweredAcrossEnvelope: boolean;
    peakDopplerGradientLoweredAcrossEnvelope: boolean;
    morphologySafeDirectionalCandidateAcrossEnvelope: boolean;
    referenceNormalizedAcrossEnvelope: boolean;
    claim:
      typeof MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_DELAYED_MIXTURE_LOAD_ENVELOPE_CLAIM_V1;
  }>;

export function measureMainWireAorticOutflowCalciumDelayedMixtureLoadEnvelopeV1(
  inputs: readonly MainWireAorticOutflowCalciumDelayedMixtureLoadInputV1[],
): MainWireAorticOutflowCalciumDelayedMixtureLoadEnvelopeV1 {
  const byId = new Map<SystemicLoadPointId,
    MainWireAorticOutflowCalciumDelayedMixtureLoadInputV1>();
  for (const input of inputs) {
    if (byId.has(input.loadPointId)) {
      throw new Error(`duplicate delayed-mixture load point: ${input.loadPointId}`);
    }
    byId.set(input.loadPointId, input);
  }
  for (const loadPointId of
    MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_DELAYED_MIXTURE_LOAD_POINT_IDS_V1) {
    if (!byId.has(loadPointId)) {
      throw new Error(`missing delayed-mixture load point: ${loadPointId}`);
    }
  }
  if (
    byId.size
      !== MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_DELAYED_MIXTURE_LOAD_POINT_IDS_V1
        .length
  ) {
    throw new Error("delayed-mixture load envelope accepts exactly three points");
  }
  const candidateParams =
    resolveMainWireVentricularCalciumDelayedMixtureParamsV1(
      MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_DELAYED_MIXTURE_LOAD_PROFILE_ID_V1,
    );
  const arms = Object.freeze(
    MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_DELAYED_MIXTURE_LOAD_POINT_IDS_V1.map(
      (loadPointId) => {
        const input = byId.get(loadPointId)!;
        assertPairedProtocol(input);
        const canonical =
          measureMainWireAorticOutflowCalciumWaveformCycleV1(
            input.canonicalResult,
            FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
            `${loadPointId}-canonical`,
          );
        const candidate =
          measureMainWireAorticOutflowCalciumWaveformCycleV1(
            input.candidateResult,
            candidateParams,
            `${loadPointId}-candidate`,
          );
        const candidateScreen =
          screenMainWireAorticOutflowCalciumCandidateV1(candidate, canonical);
        const beat = input.candidateResult.retainedCompleteBeats.at(-1)!;
        const calcium = beat.samples.map((sample) => Math.max(
          0,
          sample.freeCalciumUM.LVFW
            - candidateParams.ventricular.diastolicCalciumUM,
        ));
        const activeStress = beat.samples.map((sample) =>
          Math.max(0, sample.wallStressPa.LVFW.active));
        const calciumPeakCount = countMainWireStrictLocalMaximaV1(
          calcium,
          0.05 * maximum(calcium),
        );
        const activeStressPeakCount = countMainWireStrictLocalMaximaV1(
          activeStress,
          0.05 * maximum(activeStress),
        );
        const flowPeakCount = candidate.aorticFlowPeakCountAboveFivePercent;
        const morphologyPreserved = calciumPeakCount === 1
          && activeStressPeakCount === 1
          && flowPeakCount === 1;
        return Object.freeze({
          loadPoint:
            resolveMainWireNormalAdultFiveWallCirculatoryLoadPointV1(
              loadPointId,
            ),
          canonical,
          candidate,
          candidateScreen,
          candidateVentricularCalciumPeakCountAboveFivePercent:
            calciumPeakCount,
          candidateLvfwActiveStressPeakCountAboveFivePercent:
            activeStressPeakCount,
          candidateAorticFlowPeakCountAboveFivePercent: flowPeakCount,
          morphologyPreserved,
          morphologySafeDirectionalCandidate:
            morphologyPreserved
            && candidateScreen.retainedDirectionalCandidate,
        });
      },
    ),
  );
  return Object.freeze({
    methodId:
      MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_DELAYED_MIXTURE_LOAD_ENVELOPE_V1_ID,
    profile: resolveMainWireVentricularCalciumDelayedMixtureProfileV1(
      MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_DELAYED_MIXTURE_LOAD_PROFILE_ID_V1,
    ),
    arms,
    allRunsPeriod1AndIntegrated: arms.every((arm) =>
      arm.candidateScreen.period1AndIntegrationPassed
      && arm.canonical.periodicSteadyStateClaimed
      && arm.canonical.integrationCompletedWithoutFailure),
    morphologyPreservedAcrossEnvelope:
      arms.every((arm) => arm.morphologyPreserved),
    peakFlowLoweredAcrossEnvelope: arms.every((arm) =>
      arm.candidate.aorticMaximumFlowMlPerSec
        < arm.canonical.aorticMaximumFlowMlPerSec),
    meanDopplerGradientLoweredAcrossEnvelope: arms.every((arm) =>
      arm.candidate.meanDopplerGradientMmHg
        < arm.canonical.meanDopplerGradientMmHg),
    peakDopplerGradientLoweredAcrossEnvelope: arms.every((arm) =>
      arm.candidate.peakDopplerGradientMmHg
        < arm.canonical.peakDopplerGradientMmHg),
    morphologySafeDirectionalCandidateAcrossEnvelope:
      arms.every((arm) => arm.morphologySafeDirectionalCandidate),
    referenceNormalizedAcrossEnvelope: arms.every((arm) =>
      arm.morphologyPreserved
      && arm.candidateScreen.referenceNormalizedCandidate),
    claim:
      MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_DELAYED_MIXTURE_LOAD_ENVELOPE_CLAIM_V1,
  });
}

function assertPairedProtocol(
  input: MainWireAorticOutflowCalciumDelayedMixtureLoadInputV1,
): void {
  const canonical = input.canonicalResult;
  const candidate = input.candidateResult;
  if (canonical.dtSec !== candidate.dtSec) {
    throw new Error(`${input.loadPointId} paired dt mismatch`);
  }
  for (const key of [
    "mechanicsProviderMetadataStableHash",
    "circulationTopologyGraphStableHash",
    "circulationRuntimeStableHash",
    "bloodVolumeOperatingPointStableHash",
    "commonPericardiumStableHash",
    "periodicPolicyStableHash",
  ] as const) {
    if (
      canonical.protocolComponentHashes[key]
        !== candidate.protocolComponentHashes[key]
    ) {
      throw new Error(`${input.loadPointId} paired protocol mismatch: ${key}`);
    }
  }
  if (
    canonical.protocolComponentHashes.calciumDriveFixedParamsStableHash
      === candidate.protocolComponentHashes.calciumDriveFixedParamsStableHash
  ) {
    throw new Error(`${input.loadPointId} candidate calcium identity unchanged`);
  }
}

function maximum(values: readonly number[]): number {
  let result = Number.NEGATIVE_INFINITY;
  for (const value of values) result = Math.max(result, value);
  return result === Number.NEGATIVE_INFINITY ? 0 : result;
}
