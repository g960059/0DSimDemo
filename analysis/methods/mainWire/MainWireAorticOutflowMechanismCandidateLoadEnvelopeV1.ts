import {
  measureMainWireAorticOutflowCalciumWaveformCycleV1,
  screenMainWireAorticOutflowCalciumCandidateV1,
  type MainWireAorticOutflowCalciumCandidateScreenResultV1,
  type MainWireAorticOutflowCalciumWaveformCycleMetricsV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowCalciumWaveformComparisonV1";
import {
  FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import {
  MAIN_WIRE_AORTIC_OUTFLOW_MECHANISM_CANDIDATE_IDS_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_MECHANISM_LOAD_CONTEXT_IDS_V1,
  resolveMainWireAorticOutflowMechanismCandidateV1,
  resolveMainWireAorticOutflowMechanismLoadContextV1,
  type MainWireAorticOutflowMechanismCandidateIdV1,
  type MainWireAorticOutflowMechanismCandidateV1,
  type MainWireAorticOutflowMechanismLoadContextIdV1,
  type MainWireAorticOutflowMechanismLoadContextV1,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowMechanismCandidateLoadEnvelopeV1";
import type {
  MainWireNormalAdultFiveWallPeriodicResultV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";
import {
  createFixedResearchMainWireNormalAdultFiveWallProviderV1,
  resolveMainWireNormalAdultVentricularMaterialResearchPointV1,
  type MainWireNormalAdultVentricularMaterialResearchPointV1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";

export const MAIN_WIRE_AORTIC_OUTFLOW_MECHANISM_CANDIDATE_LOAD_ENVELOPE_ANALYSIS_V1_ID =
  "main-wire-aortic-outflow-mechanism-candidate-load-envelope-analysis-v1" as const;

export const MAIN_WIRE_AORTIC_OUTFLOW_MECHANISM_STRESS_PEAK_MINIMUM_PROMINENCE_FRACTION_V1 =
  0.01 as const;

export const MAIN_WIRE_AORTIC_OUTFLOW_MECHANISM_CANDIDATE_LOAD_ENVELOPE_ANALYSIS_CLAIM_V1 =
  Object.freeze({
    source: "last-retained-complete-beat-per-independent-cold-run" as const,
    design: "paired-canonical-comparator-at-five-fixed-load-contexts" as const,
    retentionScreen: "within-context-canonical-relative" as const,
    morphologyScreen:
      "single-prominent-LVFW-active-stress-and-single-strict-aortic-flow-peak" as const,
    stressPeakCounting:
      "unsmoothed-interior-strict-local-maxima-above-five-percent-with-one-percent-global-peak-prominence" as const,
    preloadDefinition:
      "fixed-total-blood-volume-source-points-not-transient-occlusion" as const,
    exactFrameMutation: false as const,
    smoothingApplied: false as const,
    interpolationApplied: false as const,
    numericParameterSearchOrFitting: false as const,
    clinicalValidationClaimed: false as const,
    canonicalAdoptionEstablished: false as const,
  });

export type MainWireAorticOutflowMechanismCandidateLoadInputV1 = Readonly<{
  candidateId: MainWireAorticOutflowMechanismCandidateIdV1;
  contextId: MainWireAorticOutflowMechanismLoadContextIdV1;
  periodicResult: MainWireNormalAdultFiveWallPeriodicResultV1;
}>;

export type MainWireAorticOutflowMechanismCandidateLoadArmV1 = Readonly<{
  candidate: MainWireAorticOutflowMechanismCandidateV1;
  context: MainWireAorticOutflowMechanismLoadContextV1;
  materialPoint: MainWireNormalAdultVentricularMaterialResearchPointV1;
  protocolIdentityHash: string;
  cycle: MainWireAorticOutflowCalciumWaveformCycleMetricsV1;
  aorticPulsePressureMmHg: number;
  lvfwActiveStressStrictLocalPeaksAboveFivePercent:
    readonly MainWireAorticOutflowMechanismStressPeakV1[];
  lvfwActiveStressDistinctPeakCountAboveFivePercent: number;
  morphologyPreserved: boolean;
  candidateScreen: MainWireAorticOutflowCalciumCandidateScreenResultV1 | null;
}>;

export type MainWireAorticOutflowMechanismStressPeakV1 = Readonly<{
  sampleIndex: number;
  cyclePhase01: number;
  activeStressPa: number;
  fractionOfGlobalPeak: number;
  prominencePa: number;
  prominenceFractionOfGlobalPeak: number;
  distinctAtFixedProminence: boolean;
}>;

export type MainWireAorticOutflowMechanismCandidateLoadSummaryV1 = Readonly<{
  candidateId: Exclude<
    MainWireAorticOutflowMechanismCandidateIdV1,
    "canonical"
  >;
  allRunsPeriod1AndIntegrated: boolean;
  morphologyPreservedAcrossEnvelope: boolean;
  peakFlowLoweredAcrossEnvelope: boolean;
  meanDopplerGradientLoweredAcrossEnvelope: boolean;
  peakDopplerGradientLoweredAcrossEnvelope: boolean;
  retainedDirectionalCandidateAcrossEnvelope: boolean;
  referenceNormalizedAcrossEnvelope: boolean;
  maximumAbsoluteRelativeAorticForwardVolumeChangeFromContextCanonical: number;
  maximumAbsoluteRelativeCardiacOutputChangeFromContextCanonical: number;
  systemicResistanceResponse: Readonly<{
    peakFlowStrictlyDecreasesWithResistance: boolean;
    aorticForwardVolumeStrictlyDecreasesWithResistance: boolean;
  }>;
  stressedVenousVolumeResponse: Readonly<{
    peakFlowStrictlyIncreasesWithPreload: boolean;
    aorticForwardVolumeStrictlyIncreasesWithPreload: boolean;
  }>;
}>;

export type MainWireAorticOutflowMechanismCandidateLoadEnvelopeV1 = Readonly<{
  methodId:
    typeof MAIN_WIRE_AORTIC_OUTFLOW_MECHANISM_CANDIDATE_LOAD_ENVELOPE_ANALYSIS_V1_ID;
  arms: readonly MainWireAorticOutflowMechanismCandidateLoadArmV1[];
  candidateSummaries:
    readonly MainWireAorticOutflowMechanismCandidateLoadSummaryV1[];
  nextCalibrationCandidateDecision: Readonly<{
    eligibilityRule:
      "P1-and-integration-plus-morphology-plus-lower-flow-and-gradients-plus-within-context-retention-plus-monotone-load-responses";
    eligibleCandidateIds: readonly Exclude<
      MainWireAorticOutflowMechanismCandidateIdV1,
      "canonical"
    >[];
    preferredForSourceCalibrationCandidateId: Exclude<
      MainWireAorticOutflowMechanismCandidateIdV1,
      "canonical"
    > | null;
    canonicalAdoptionEstablished: false;
  }>;
  allRunsPeriod1AndIntegrated: boolean;
  allProtocolIdentitiesDistinct: boolean;
  claim:
    typeof MAIN_WIRE_AORTIC_OUTFLOW_MECHANISM_CANDIDATE_LOAD_ENVELOPE_ANALYSIS_CLAIM_V1;
}>;

export function measureMainWireAorticOutflowMechanismCandidateLoadEnvelopeV1(
  inputs: readonly MainWireAorticOutflowMechanismCandidateLoadInputV1[],
): MainWireAorticOutflowMechanismCandidateLoadEnvelopeV1 {
  const byKey = new Map<string, MainWireNormalAdultFiveWallPeriodicResultV1>();
  for (const input of inputs) {
    const key = armKey(input.contextId, input.candidateId);
    if (byKey.has(key)) throw new Error(`duplicate candidate-load arm: ${key}`);
    byKey.set(key, input.periodicResult);
  }
  for (const contextId of
    MAIN_WIRE_AORTIC_OUTFLOW_MECHANISM_LOAD_CONTEXT_IDS_V1) {
    for (const candidateId of
      MAIN_WIRE_AORTIC_OUTFLOW_MECHANISM_CANDIDATE_IDS_V1) {
      const key = armKey(contextId, candidateId);
      if (!byKey.has(key)) throw new Error(`missing candidate-load arm: ${key}`);
    }
  }
  const expectedCount =
    MAIN_WIRE_AORTIC_OUTFLOW_MECHANISM_LOAD_CONTEXT_IDS_V1.length
    * MAIN_WIRE_AORTIC_OUTFLOW_MECHANISM_CANDIDATE_IDS_V1.length;
  if (byKey.size !== expectedCount) {
    throw new Error(`candidate-load envelope accepts exactly ${expectedCount} arms`);
  }
  assertPairedProtocolAxes(byKey);
  const arms: MainWireAorticOutflowMechanismCandidateLoadArmV1[] = [];
  for (const contextId of
    MAIN_WIRE_AORTIC_OUTFLOW_MECHANISM_LOAD_CONTEXT_IDS_V1) {
    const canonicalResult = byKey.get(armKey(contextId, "canonical"))!;
    const canonicalCycle = measureMainWireAorticOutflowCalciumWaveformCycleV1(
      canonicalResult,
      FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
      `${contextId}-canonical`,
    );
    for (const candidateId of
      MAIN_WIRE_AORTIC_OUTFLOW_MECHANISM_CANDIDATE_IDS_V1) {
      arms.push(measureArm(
        contextId,
        candidateId,
        byKey.get(armKey(contextId, candidateId))!,
        canonicalCycle,
      ));
    }
  }
  const frozenArms = Object.freeze(arms);
  const candidateSummaries = Object.freeze(([
    "distortion-transient-four-thirds",
    "peak-tension-length-half",
  ] as const).map((candidateId) => summarizeCandidate(
    candidateId,
    frozenArms,
  )));
  const identityCount = new Set(frozenArms.map((arm) =>
    arm.protocolIdentityHash)).size;
  const eligibleCandidateIds = Object.freeze(candidateSummaries
    .filter(candidatePassesNextCalibrationScreen)
    .map((summary) => summary.candidateId));
  return Object.freeze({
    methodId:
      MAIN_WIRE_AORTIC_OUTFLOW_MECHANISM_CANDIDATE_LOAD_ENVELOPE_ANALYSIS_V1_ID,
    arms: frozenArms,
    candidateSummaries,
    nextCalibrationCandidateDecision: Object.freeze({
      eligibilityRule:
        "P1-and-integration-plus-morphology-plus-lower-flow-and-gradients-plus-within-context-retention-plus-monotone-load-responses" as const,
      eligibleCandidateIds,
      preferredForSourceCalibrationCandidateId:
        eligibleCandidateIds.length === 1 ? eligibleCandidateIds[0]! : null,
      canonicalAdoptionEstablished: false as const,
    }),
    allRunsPeriod1AndIntegrated: frozenArms.every((arm) =>
      arm.cycle.periodicSteadyStateClaimed
      && arm.cycle.integrationCompletedWithoutFailure),
    allProtocolIdentitiesDistinct: identityCount === expectedCount,
    claim:
      MAIN_WIRE_AORTIC_OUTFLOW_MECHANISM_CANDIDATE_LOAD_ENVELOPE_ANALYSIS_CLAIM_V1,
  });
}

function candidatePassesNextCalibrationScreen(
  summary: MainWireAorticOutflowMechanismCandidateLoadSummaryV1,
): boolean {
  return summary.allRunsPeriod1AndIntegrated
    && summary.morphologyPreservedAcrossEnvelope
    && summary.peakFlowLoweredAcrossEnvelope
    && summary.meanDopplerGradientLoweredAcrossEnvelope
    && summary.peakDopplerGradientLoweredAcrossEnvelope
    && summary.retainedDirectionalCandidateAcrossEnvelope
    && summary.systemicResistanceResponse
      .peakFlowStrictlyDecreasesWithResistance
    && summary.systemicResistanceResponse
      .aorticForwardVolumeStrictlyDecreasesWithResistance
    && summary.stressedVenousVolumeResponse
      .peakFlowStrictlyIncreasesWithPreload
    && summary.stressedVenousVolumeResponse
      .aorticForwardVolumeStrictlyIncreasesWithPreload;
}

function measureArm(
  contextId: MainWireAorticOutflowMechanismLoadContextIdV1,
  candidateId: MainWireAorticOutflowMechanismCandidateIdV1,
  result: MainWireNormalAdultFiveWallPeriodicResultV1,
  canonicalCycle: MainWireAorticOutflowCalciumWaveformCycleMetricsV1,
): MainWireAorticOutflowMechanismCandidateLoadArmV1 {
  const context = resolveMainWireAorticOutflowMechanismLoadContextV1(contextId);
  const candidate = resolveMainWireAorticOutflowMechanismCandidateV1(candidateId);
  const materialPoint =
    resolveMainWireNormalAdultVentricularMaterialResearchPointV1(
      candidate.ventricularMaterialPointId,
    );
  const provider = createFixedResearchMainWireNormalAdultFiveWallProviderV1(
    candidate.ventricularMaterialPointId,
  );
  if (
    result.protocolIdentity.mechanicsProvider.parameterIdentityHash
    !== provider.parameterIdentityHash
  ) throw new Error(`${contextId}/${candidateId} provider identity mismatch`);
  const cycle = candidateId === "canonical"
    ? canonicalCycle
    : measureMainWireAorticOutflowCalciumWaveformCycleV1(
      result,
      FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
      `${contextId}-${candidateId}`,
    );
  const beat = result.retainedCompleteBeats.at(-1);
  if (beat === undefined || beat.samples.length === 0) {
    throw new Error(`${contextId}/${candidateId} requires a complete beat`);
  }
  const activeStress = beat.samples.map((sample) =>
    Math.max(0, sample.wallStressPa.LVFW.active));
  const activeStressPeaks =
    measureMainWireAorticOutflowMechanismStressPeaksV1(
      activeStress,
      beat.samples.map((sample) => sample.cyclePhase01),
    );
  const distinctActiveStressPeakCount = activeStressPeaks.filter((peak) =>
    peak.distinctAtFixedProminence).length;
  const morphologyPreserved = distinctActiveStressPeakCount === 1
    && cycle.aorticFlowPeakCountAboveFivePercent === 1;
  return Object.freeze({
    candidate,
    context,
    materialPoint,
    protocolIdentityHash: result.protocolIdentityHash,
    cycle,
    aorticPulsePressureMmHg:
      cycle.maximumAorticRootPressureMmHg
      - cycle.minimumAorticRootPressureMmHg,
    lvfwActiveStressStrictLocalPeaksAboveFivePercent: activeStressPeaks,
    lvfwActiveStressDistinctPeakCountAboveFivePercent:
      distinctActiveStressPeakCount,
    morphologyPreserved,
    candidateScreen: candidateId === "canonical"
      ? null
      : screenMainWireAorticOutflowCalciumCandidateV1(cycle, canonicalCycle),
  });
}

export function measureMainWireAorticOutflowMechanismStressPeaksV1(
  activeStressPa: readonly number[],
  cyclePhase01: readonly number[],
): readonly MainWireAorticOutflowMechanismStressPeakV1[] {
  if (activeStressPa.length !== cyclePhase01.length) {
    throw new Error("stress peak signals require equal lengths");
  }
  if (activeStressPa.length < 3) return Object.freeze([]);
  if (activeStressPa.some((value) => !(value >= 0) || !Number.isFinite(value))) {
    throw new Error("stress peak signal must be finite and nonnegative");
  }
  if (cyclePhase01.some((value) => !Number.isFinite(value))) {
    throw new Error("stress peak phases must be finite");
  }
  const globalPeak = maximum(activeStressPa);
  if (!(globalPeak > 0)) return Object.freeze([]);
  const minimumHeight = 0.05 * globalPeak;
  const peaks: MainWireAorticOutflowMechanismStressPeakV1[] = [];
  for (let index = 1; index < activeStressPa.length - 1; index += 1) {
    const peak = activeStressPa[index]!;
    if (
      peak < minimumHeight
      || peak <= activeStressPa[index - 1]!
      || peak <= activeStressPa[index + 1]!
    ) continue;
    let leftMinimum = peak;
    for (let left = index - 1; left >= 0; left -= 1) {
      const value = activeStressPa[left]!;
      if (value > peak) break;
      leftMinimum = Math.min(leftMinimum, value);
    }
    let rightMinimum = peak;
    for (let right = index + 1; right < activeStressPa.length; right += 1) {
      const value = activeStressPa[right]!;
      if (value > peak) break;
      rightMinimum = Math.min(rightMinimum, value);
    }
    const prominence = peak - Math.max(leftMinimum, rightMinimum);
    const prominenceFraction = prominence / globalPeak;
    peaks.push(Object.freeze({
      sampleIndex: index,
      cyclePhase01: cyclePhase01[index]!,
      activeStressPa: peak,
      fractionOfGlobalPeak: peak / globalPeak,
      prominencePa: prominence,
      prominenceFractionOfGlobalPeak: prominenceFraction,
      distinctAtFixedProminence:
        prominenceFraction
          >= MAIN_WIRE_AORTIC_OUTFLOW_MECHANISM_STRESS_PEAK_MINIMUM_PROMINENCE_FRACTION_V1,
    }));
  }
  return Object.freeze(peaks);
}

function summarizeCandidate(
  candidateId: Exclude<
    MainWireAorticOutflowMechanismCandidateIdV1,
    "canonical"
  >,
  arms: readonly MainWireAorticOutflowMechanismCandidateLoadArmV1[],
): MainWireAorticOutflowMechanismCandidateLoadSummaryV1 {
  const candidateArms = MAIN_WIRE_AORTIC_OUTFLOW_MECHANISM_LOAD_CONTEXT_IDS_V1
    .map((contextId) => requiredArm(arms, contextId, candidateId));
  const canonicalArms = MAIN_WIRE_AORTIC_OUTFLOW_MECHANISM_LOAD_CONTEXT_IDS_V1
    .map((contextId) => requiredArm(arms, contextId, "canonical"));
  const systemic = ([
    "systemic-resistance-low",
    "baseline",
    "systemic-resistance-high",
  ] as const).map((contextId) => requiredArm(arms, contextId, candidateId));
  const preload = ([
    "stressed-venous-volume-low",
    "baseline",
    "stressed-venous-volume-high",
  ] as const).map((contextId) => requiredArm(arms, contextId, candidateId));
  return Object.freeze({
    candidateId,
    allRunsPeriod1AndIntegrated: candidateArms.every((arm) =>
      arm.cycle.periodicSteadyStateClaimed
      && arm.cycle.integrationCompletedWithoutFailure),
    morphologyPreservedAcrossEnvelope:
      candidateArms.every((arm) => arm.morphologyPreserved),
    peakFlowLoweredAcrossEnvelope: candidateArms.every((arm, index) =>
      arm.cycle.aorticMaximumFlowMlPerSec
        < canonicalArms[index]!.cycle.aorticMaximumFlowMlPerSec),
    meanDopplerGradientLoweredAcrossEnvelope:
      candidateArms.every((arm, index) =>
        arm.cycle.meanDopplerGradientMmHg
          < canonicalArms[index]!.cycle.meanDopplerGradientMmHg),
    peakDopplerGradientLoweredAcrossEnvelope:
      candidateArms.every((arm, index) =>
        arm.cycle.peakDopplerGradientMmHg
          < canonicalArms[index]!.cycle.peakDopplerGradientMmHg),
    retainedDirectionalCandidateAcrossEnvelope: candidateArms.every((arm) =>
      arm.morphologyPreserved
      && arm.candidateScreen!.retainedDirectionalCandidate),
    referenceNormalizedAcrossEnvelope: candidateArms.every((arm) =>
      arm.morphologyPreserved
      && arm.candidateScreen!.referenceNormalizedCandidate),
    maximumAbsoluteRelativeAorticForwardVolumeChangeFromContextCanonical:
      maximum(candidateArms.map((arm, index) => relativeDifference(
        arm.cycle.aorticForwardVolumeMl,
        canonicalArms[index]!.cycle.aorticForwardVolumeMl,
      ))),
    maximumAbsoluteRelativeCardiacOutputChangeFromContextCanonical:
      maximum(candidateArms.map((arm, index) => relativeDifference(
        arm.cycle.netAorticCardiacOutputLPerMin,
        canonicalArms[index]!.cycle.netAorticCardiacOutputLPerMin,
      ))),
    systemicResistanceResponse: Object.freeze({
      peakFlowStrictlyDecreasesWithResistance:
        strictlyDecreases(systemic.map((arm) =>
          arm.cycle.aorticMaximumFlowMlPerSec)),
      aorticForwardVolumeStrictlyDecreasesWithResistance:
        strictlyDecreases(systemic.map((arm) =>
          arm.cycle.aorticForwardVolumeMl)),
    }),
    stressedVenousVolumeResponse: Object.freeze({
      peakFlowStrictlyIncreasesWithPreload:
        strictlyIncreases(preload.map((arm) =>
          arm.cycle.aorticMaximumFlowMlPerSec)),
      aorticForwardVolumeStrictlyIncreasesWithPreload:
        strictlyIncreases(preload.map((arm) =>
          arm.cycle.aorticForwardVolumeMl)),
    }),
  });
}

function assertPairedProtocolAxes(
  byKey: ReadonlyMap<string, MainWireNormalAdultFiveWallPeriodicResultV1>,
): void {
  for (const contextId of
    MAIN_WIRE_AORTIC_OUTFLOW_MECHANISM_LOAD_CONTEXT_IDS_V1) {
    const results = MAIN_WIRE_AORTIC_OUTFLOW_MECHANISM_CANDIDATE_IDS_V1
      .map((candidateId) => byKey.get(armKey(contextId, candidateId))!);
    for (const key of [
      "calciumDriveFixedParamsStableHash",
      "circulationTopologyGraphStableHash",
      "circulationRuntimeStableHash",
      "bloodVolumeOperatingPointStableHash",
      "commonPericardiumStableHash",
      "periodicPolicyStableHash",
    ] as const) {
      if (new Set(results.map((result) =>
        result.protocolComponentHashes[key])).size !== 1) {
        throw new Error(`${contextId} candidate pairing changed ${key}`);
      }
    }
    if (new Set(results.map((result) =>
      result.protocolComponentHashes.mechanicsProviderMetadataStableHash)).size
      !== MAIN_WIRE_AORTIC_OUTFLOW_MECHANISM_CANDIDATE_IDS_V1.length) {
      throw new Error(`${contextId} candidate mechanics identities not distinct`);
    }
  }
}

function requiredArm(
  arms: readonly MainWireAorticOutflowMechanismCandidateLoadArmV1[],
  contextId: MainWireAorticOutflowMechanismLoadContextIdV1,
  candidateId: MainWireAorticOutflowMechanismCandidateIdV1,
): MainWireAorticOutflowMechanismCandidateLoadArmV1 {
  const arm = arms.find((candidate) =>
    candidate.context.contextId === contextId
    && candidate.candidate.candidateId === candidateId);
  if (arm === undefined) throw new Error(`missing measured arm: ${armKey(contextId, candidateId)}`);
  return arm;
}

function armKey(
  contextId: MainWireAorticOutflowMechanismLoadContextIdV1,
  candidateId: MainWireAorticOutflowMechanismCandidateIdV1,
): string {
  return `${contextId}::${candidateId}`;
}

function relativeDifference(value: number, reference: number): number {
  return Math.abs(value - reference) / Math.max(Math.abs(reference), 1e-12);
}

function strictlyDecreases(values: readonly number[]): boolean {
  return values.slice(1).every((value, index) => value < values[index]!);
}

function strictlyIncreases(values: readonly number[]): boolean {
  return values.slice(1).every((value, index) => value > values[index]!);
}

function maximum(values: readonly number[]): number {
  if (values.length === 0) throw new Error("maximum requires values");
  return Math.max(...values);
}
