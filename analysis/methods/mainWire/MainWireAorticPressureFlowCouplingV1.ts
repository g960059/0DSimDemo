import type {
  MainWireNormalAdultFiveWallPeriodicResultV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";

export const MAIN_WIRE_AORTIC_PRESSURE_FLOW_COUPLING_V1_ID =
  "main-wire-aortic-pressure-flow-coupling-v1" as const;

export const MAIN_WIRE_AORTIC_PRESSURE_FLOW_COUPLING_V1_CLAIM =
  Object.freeze({
    source: "last-retained-complete-beat" as const,
    pressureSignal: "central-aortic-node-absolute-pressure" as const,
    flowSignal: "graph-owned-Ao-SA-edge-flow" as const,
    proxyEquation:
      "backward-difference-Ao-pressure-times-backward-difference-Ao-SA-flow" as const,
    firstSampleDerivative:
      "previous-retained-beat-final-endpoint-when-available-otherwise-cyclic" as const,
    ejectionEpisode:
      "one-percent-positive-AoV-maximum-with-one-mL-per-second-floor" as const,
    compressionLikeSign: "positive-pressure-rate-and-positive-flow-rate" as const,
    decompressionLikeSign: "negative-pressure-rate-and-negative-flow-rate" as const,
    mismatchSign: "opposite-nonzero-pressure-and-flow-rates" as const,
    constantAreaRelationship:
      "positive-constant-multiple-of-dP-dt-times-dU-dt" as const,
    clinicalWaveIntensityAnalysis: false as const,
    ascendingAorticAreaIdentified: false as const,
    separatesForwardAndBackwardWaves: false as const,
    magnitudeComparableAcrossDifferentAreaAssumptions: false as const,
    pressureRecoveryInferred: false as const,
    smoothingApplied: false as const,
    interpolationApplied: false as const,
    exactFrameMutation: false as const,
    clinicalThresholdOrPassFailJudgment: false as const,
  });

export type MainWireAorticPressureFlowCouplingSampleV1 = Readonly<{
  cyclePhase01: number;
  aorticRootAbsolutePressureMmHg: number;
  aorticRootFlowMlPerSec: number;
  aorticValveFlowMlPerSec: number;
}>;

export type MainWireAorticPressureFlowCouplingPrecedingEndpointV1 = Readonly<{
  aorticRootAbsolutePressureMmHg: number;
  aorticRootFlowMlPerSec: number;
}>;

export type MainWireAorticPressureFlowCouplingSummaryV1 = Readonly<{
  sampleCount: number;
  dtSec: number;
  sampledCycleDurationSec: number;
  ejectionEpisode: Readonly<{
    flowThresholdMlPerSec: number;
    onsetPhase01: number;
    aorticValveFlowPeakPhase01: number;
    lastThresholdActivePhase01: number;
    durationSec: number;
    maximumAorticValveFlowMlPerSec: number;
    maximumAorticRootFlowDuringEjectionMlPerSec: number;
    signedAorticRootFlowPeakLagFromAorticValveFlowPeakSec: number;
  }>;
  pressureFlowCouplingProxy: Readonly<{
    maximumCompressionLikeIntensityMmHgMlPerSec3: number;
    compressionLikePeakPhase01: number | null;
    compressionLikeEjectionIntegralMmHgMlPerSec2: number;
    maximumDecompressionLikeIntensityMmHgMlPerSec3: number;
    decompressionLikePeakPhase01: number | null;
    decompressionLikeEjectionIntegralMmHgMlPerSec2: number;
    maximumMismatchMagnitudeMmHgMlPerSec3: number;
    mismatchMagnitudeEjectionIntegralMmHgMlPerSec2: number;
    absoluteEjectionIntegralMmHgMlPerSec2: number;
    compressionLikeFractionOfAbsoluteEjectionIntegral01: number;
    decompressionLikeFractionOfAbsoluteEjectionIntegral01: number;
    mismatchFractionOfAbsoluteEjectionIntegral01: number;
    signedCycleIntegralMmHgMlPerSec2: number;
    absoluteCycleIntegralMmHgMlPerSec2: number;
    maximumPositiveAorticPressureRateDuringEjectionMmHgPerSec: number;
    minimumAorticPressureRateDuringEjectionMmHgPerSec: number;
    maximumPositiveAorticRootFlowAccelerationDuringEjectionMlPerSec2: number;
    minimumAorticRootFlowAccelerationDuringEjectionMlPerSec2: number;
  }>;
  aorticRootStorage: Readonly<{
    flowAtAorticValveFlowPeakMlPerSec: number;
    maximumFlowDuringEjectionMlPerSec: number;
    minimumFlowDuringEjectionMlPerSec: number;
    rmsFlowDuringEjectionMlPerSec: number;
    positiveAccumulationVolumeDuringEjectionMl: number;
    positiveReleaseVolumeDuringEjectionMl: number;
  }>;
}>;

export type MainWireAorticPressureFlowCouplingV1 = Readonly<{
  methodId: typeof MAIN_WIRE_AORTIC_PRESSURE_FLOW_COUPLING_V1_ID;
  source: Readonly<{
    beatIndex: number;
    protocolIdentityHash: string;
    periodicSteadyStateClaimed: boolean;
    integrationCompletedWithoutFailure: boolean;
  }>;
  interpretationEligible: boolean;
  summary: MainWireAorticPressureFlowCouplingSummaryV1;
  claim: typeof MAIN_WIRE_AORTIC_PRESSURE_FLOW_COUPLING_V1_CLAIM;
}>;

export function measureMainWireAorticPressureFlowCouplingV1(
  result: MainWireNormalAdultFiveWallPeriodicResultV1,
): MainWireAorticPressureFlowCouplingV1 {
  const beat = result.retainedCompleteBeats.at(-1);
  if (beat === undefined || beat.samples.length === 0) {
    throw new Error("a retained complete beat is required for aortic pressure-flow coupling");
  }
  const rootEdge = result.protocolIdentity.circulation.topologyGraphSnapshot
    .edges.find((edge) => edge.name === "Ao_SA");
  if (
    rootEdge === undefined
    || rootEdge.up !== "Ao"
    || rootEdge.down !== "SA"
  ) {
    throw new Error("aortic pressure-flow coupling requires the graph-owned Ao_SA edge");
  }
  const precedingSample = result.retainedCompleteBeats.at(-2)?.samples.at(-1);
  const summary = measurePeriodicAorticPressureFlowCouplingV1(
    beat.samples.map((sample) => Object.freeze({
      cyclePhase01: sample.cyclePhase01,
      aorticRootAbsolutePressureMmHg:
        sample.circulationNodeAbsolutePressureMmHg.Ao,
      aorticRootFlowMlPerSec:
        sample.circulationEdgeFlowMlPerSec.Ao_SA,
      aorticValveFlowMlPerSec:
        sample.circulationEdgeFlowMlPerSec.AoV,
    })),
    result.dtSec,
    precedingSample === undefined
      ? undefined
      : Object.freeze({
        aorticRootAbsolutePressureMmHg:
          precedingSample.circulationNodeAbsolutePressureMmHg.Ao,
        aorticRootFlowMlPerSec:
          precedingSample.circulationEdgeFlowMlPerSec.Ao_SA,
      }),
  );
  return Object.freeze({
    methodId: MAIN_WIRE_AORTIC_PRESSURE_FLOW_COUPLING_V1_ID,
    source: Object.freeze({
      beatIndex: beat.beatIndex,
      protocolIdentityHash: result.protocolIdentityHash,
      periodicSteadyStateClaimed: result.periodicSteadyStateClaimed,
      integrationCompletedWithoutFailure:
        result.integrationCompletedWithoutFailure,
    }),
    interpretationEligible:
      result.periodicSteadyStateClaimed
      && result.integrationCompletedWithoutFailure,
    summary,
    claim: MAIN_WIRE_AORTIC_PRESSURE_FLOW_COUPLING_V1_CLAIM,
  });
}

export function measurePeriodicAorticPressureFlowCouplingV1(
  samples: readonly MainWireAorticPressureFlowCouplingSampleV1[],
  dtSec: number,
  precedingEndpoint?: MainWireAorticPressureFlowCouplingPrecedingEndpointV1,
): MainWireAorticPressureFlowCouplingSummaryV1 {
  if (!(dtSec > 0) || !Number.isFinite(dtSec) || samples.length < 3) {
    throw new Error("aortic pressure-flow coupling requires at least three samples and positive finite dt");
  }
  samples.forEach((sample, index) => {
    for (const [field, value] of Object.entries(sample)) {
      if (!Number.isFinite(value)) {
        throw new Error(`aortic pressure-flow coupling sample ${index} ${field} must be finite`);
      }
    }
    if (sample.cyclePhase01 < 0 || sample.cyclePhase01 >= 1) {
      throw new Error(`aortic pressure-flow coupling sample ${index} phase must be in [0, 1)`);
    }
  });
  if (precedingEndpoint !== undefined) {
    for (const [field, value] of Object.entries(precedingEndpoint)) {
      if (!Number.isFinite(value)) {
        throw new Error(`aortic pressure-flow coupling preceding ${field} must be finite`);
      }
    }
  }

  const aorticValveFlows = samples.map((sample) =>
    sample.aorticValveFlowMlPerSec);
  const maximumAorticValveFlow = maximum(aorticValveFlows);
  if (!(maximumAorticValveFlow > 0)) {
    throw new Error("aortic pressure-flow coupling requires positive aortic valve flow");
  }
  const flowThreshold = Math.max(1, 0.01 * maximum(
    aorticValveFlows.map(Math.abs),
  ));
  const ejectionMask = aorticValveFlows.map((flow) =>
    flow > 0 && flow >= flowThreshold);
  const onsetIndices = ejectionMask.flatMap((active, index) =>
    active && !ejectionMask[(index - 1 + samples.length) % samples.length]!
      ? [index]
      : []);
  if (onsetIndices.length !== 1) {
    throw new Error("aortic pressure-flow coupling requires one thresholded aortic ejection episode");
  }
  const onsetIndex = onsetIndices[0]!;
  const ejectionIndices: number[] = [];
  for (let offset = 0; offset < samples.length; offset += 1) {
    const index = (onsetIndex + offset) % samples.length;
    if (!ejectionMask[index]!) break;
    ejectionIndices.push(index);
  }
  if (ejectionIndices.length === 0) {
    throw new Error("aortic pressure-flow coupling ejection episode is empty");
  }

  const pressures = samples.map((sample) =>
    sample.aorticRootAbsolutePressureMmHg);
  const rootFlows = samples.map((sample) => sample.aorticRootFlowMlPerSec);
  const pressureRates = backwardDifferences(
    pressures,
    dtSec,
    precedingEndpoint?.aorticRootAbsolutePressureMmHg,
  );
  const rootFlowRates = backwardDifferences(
    rootFlows,
    dtSec,
    precedingEndpoint?.aorticRootFlowMlPerSec,
  );
  const intensities = pressureRates.map((pressureRate, index) =>
    pressureRate * rootFlowRates[index]!);
  const compressionLikeIndices = ejectionIndices.filter((index) =>
    pressureRates[index]! > 0 && rootFlowRates[index]! > 0);
  const decompressionLikeIndices = ejectionIndices.filter((index) =>
    pressureRates[index]! < 0 && rootFlowRates[index]! < 0);
  const mismatchIndices = ejectionIndices.filter((index) =>
    pressureRates[index]! * rootFlowRates[index]! < 0);
  const compressionLikeIntegral = sum(compressionLikeIndices.map((index) =>
    intensities[index]!)) * dtSec;
  const decompressionLikeIntegral = sum(decompressionLikeIndices.map((index) =>
    intensities[index]!)) * dtSec;
  const mismatchMagnitudeIntegral = sum(mismatchIndices.map((index) =>
    -intensities[index]!)) * dtSec;
  const absoluteEjectionIntegral = sum(ejectionIndices.map((index) =>
    Math.abs(intensities[index]!))) * dtSec;
  const compressionPeakIndex = indexOfMaximumFromIndices(
    intensities,
    compressionLikeIndices,
  );
  const decompressionPeakIndex = indexOfMaximumFromIndices(
    intensities,
    decompressionLikeIndices,
  );
  const aorticValvePeakIndex = indexOfMaximum(aorticValveFlows);
  const rootFlowPeakIndex = indexOfMaximumFromIndices(
    rootFlows,
    ejectionIndices,
  )!;
  const storageFlows = aorticValveFlows.map((flow, index) =>
    flow - rootFlows[index]!);
  const ejectionStorageFlows = ejectionIndices.map((index) =>
    storageFlows[index]!);
  const cycleDurationSec = samples.length * dtSec;
  return Object.freeze({
    sampleCount: samples.length,
    dtSec,
    sampledCycleDurationSec: cycleDurationSec,
    ejectionEpisode: Object.freeze({
      flowThresholdMlPerSec: flowThreshold,
      onsetPhase01: samples[onsetIndex]!.cyclePhase01,
      aorticValveFlowPeakPhase01:
        samples[aorticValvePeakIndex]!.cyclePhase01,
      lastThresholdActivePhase01:
        samples[ejectionIndices.at(-1)!]!.cyclePhase01,
      durationSec: ejectionIndices.length * dtSec,
      maximumAorticValveFlowMlPerSec: maximumAorticValveFlow,
      maximumAorticRootFlowDuringEjectionMlPerSec:
        rootFlows[rootFlowPeakIndex]!,
      signedAorticRootFlowPeakLagFromAorticValveFlowPeakSec:
        signedShortestIndexDistance(
          aorticValvePeakIndex,
          rootFlowPeakIndex,
          samples.length,
        ) * dtSec,
    }),
    pressureFlowCouplingProxy: Object.freeze({
      maximumCompressionLikeIntensityMmHgMlPerSec3:
        compressionPeakIndex === null ? 0 : intensities[compressionPeakIndex]!,
      compressionLikePeakPhase01: compressionPeakIndex === null
        ? null
        : samples[compressionPeakIndex]!.cyclePhase01,
      compressionLikeEjectionIntegralMmHgMlPerSec2:
        compressionLikeIntegral,
      maximumDecompressionLikeIntensityMmHgMlPerSec3:
        decompressionPeakIndex === null
          ? 0
          : intensities[decompressionPeakIndex]!,
      decompressionLikePeakPhase01: decompressionPeakIndex === null
        ? null
        : samples[decompressionPeakIndex]!.cyclePhase01,
      decompressionLikeEjectionIntegralMmHgMlPerSec2:
        decompressionLikeIntegral,
      maximumMismatchMagnitudeMmHgMlPerSec3: maximum(
        mismatchIndices.map((index) => -intensities[index]!),
      ),
      mismatchMagnitudeEjectionIntegralMmHgMlPerSec2:
        mismatchMagnitudeIntegral,
      absoluteEjectionIntegralMmHgMlPerSec2: absoluteEjectionIntegral,
      compressionLikeFractionOfAbsoluteEjectionIntegral01: safeFraction(
        compressionLikeIntegral,
        absoluteEjectionIntegral,
      ),
      decompressionLikeFractionOfAbsoluteEjectionIntegral01: safeFraction(
        decompressionLikeIntegral,
        absoluteEjectionIntegral,
      ),
      mismatchFractionOfAbsoluteEjectionIntegral01: safeFraction(
        mismatchMagnitudeIntegral,
        absoluteEjectionIntegral,
      ),
      signedCycleIntegralMmHgMlPerSec2: sum(intensities) * dtSec,
      absoluteCycleIntegralMmHgMlPerSec2:
        sum(intensities.map(Math.abs)) * dtSec,
      maximumPositiveAorticPressureRateDuringEjectionMmHgPerSec: Math.max(
        0,
        maximum(ejectionIndices.map((index) => pressureRates[index]!)),
      ),
      minimumAorticPressureRateDuringEjectionMmHgPerSec: minimum(
        ejectionIndices.map((index) => pressureRates[index]!),
      ),
      maximumPositiveAorticRootFlowAccelerationDuringEjectionMlPerSec2:
        Math.max(
          0,
          maximum(ejectionIndices.map((index) => rootFlowRates[index]!)),
        ),
      minimumAorticRootFlowAccelerationDuringEjectionMlPerSec2: minimum(
        ejectionIndices.map((index) => rootFlowRates[index]!),
      ),
    }),
    aorticRootStorage: Object.freeze({
      flowAtAorticValveFlowPeakMlPerSec:
        storageFlows[aorticValvePeakIndex]!,
      maximumFlowDuringEjectionMlPerSec: maximum(ejectionStorageFlows),
      minimumFlowDuringEjectionMlPerSec: minimum(ejectionStorageFlows),
      rmsFlowDuringEjectionMlPerSec: rootMeanSquare(ejectionStorageFlows),
      positiveAccumulationVolumeDuringEjectionMl: sum(
        ejectionStorageFlows.map((flow) => Math.max(0, flow)),
      ) * dtSec,
      positiveReleaseVolumeDuringEjectionMl: sum(
        ejectionStorageFlows.map((flow) => Math.max(0, -flow)),
      ) * dtSec,
    }),
  });
}

function backwardDifferences(
  values: readonly number[],
  dtSec: number,
  precedingValue?: number,
): readonly number[] {
  const initialPrevious = precedingValue ?? values.at(-1)!;
  return Object.freeze(values.map((value, index) =>
    (value - (index === 0 ? initialPrevious : values[index - 1]!)) / dtSec));
}

function signedShortestIndexDistance(
  fromIndex: number,
  toIndex: number,
  count: number,
): number {
  const forward = (toIndex - fromIndex + count) % count;
  return forward > count / 2 ? forward - count : forward;
}

function safeFraction(numerator: number, denominator: number): number {
  return denominator > 0 ? numerator / denominator : 0;
}

function indexOfMaximum(values: readonly number[]): number {
  let index = 0;
  for (let candidate = 1; candidate < values.length; candidate += 1) {
    if (values[candidate]! > values[index]!) index = candidate;
  }
  return index;
}

function indexOfMaximumFromIndices(
  values: readonly number[],
  indices: readonly number[],
): number | null {
  if (indices.length === 0) return null;
  let index = indices[0]!;
  for (const candidate of indices.slice(1)) {
    if (values[candidate]! > values[index]!) index = candidate;
  }
  return index;
}

function maximum(values: readonly number[]): number {
  let result = Number.NEGATIVE_INFINITY;
  for (const value of values) result = Math.max(result, value);
  return result === Number.NEGATIVE_INFINITY ? 0 : result;
}

function minimum(values: readonly number[]): number {
  let result = Number.POSITIVE_INFINITY;
  for (const value of values) result = Math.min(result, value);
  return result === Number.POSITIVE_INFINITY ? 0 : result;
}

function sum(values: readonly number[]): number {
  return values.reduce((result, value) => result + value, 0);
}

function rootMeanSquare(values: readonly number[]): number {
  return values.length === 0
    ? 0
    : Math.sqrt(sum(values.map((value) => value * value)) / values.length);
}
