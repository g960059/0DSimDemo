import protocolDescriptor from "@/data/myocardium/protocols/prescribed-calcium-phase2a-synthetic-protocols.json";
import {
  PRESCRIBED_CALCIUM_PHASE2A_CLAIM_BOUNDARY,
  PRESCRIBED_CALCIUM_PHASE2A_EVIDENCE_STATUS,
  PRESCRIBED_CALCIUM_SYNTHETIC_SMOKE_PARAMETER_SET,
  effectiveCalciumRateTargetAtCycleLength,
  normalizePrescribedCalciumParams,
  stepPrescribedCalciumTransientV1,
  validatePrescribedCalciumInput,
  type PrescribedCalciumInput,
  type PrescribedCalciumParams,
  type PrescribedCalciumOutput,
} from "@/engine/myocardium/calcium/PrescribedCalciumTransientV1";

export type PrescribedCalciumProtocolStatus = "closure-pass" | "closure-fail" | "deferred-target";

export type PrescribedCalciumProtocolSection = {
  readonly id: string;
  readonly status: PrescribedCalciumProtocolStatus;
  readonly metrics: Record<string, number | string | boolean | readonly number[]>;
};

export type PrescribedCalciumProtocolReport = {
  readonly protocolSetId: string;
  readonly claimBoundary: typeof PRESCRIBED_CALCIUM_PHASE2A_CLAIM_BOUNDARY;
  readonly evidenceStatus: typeof PRESCRIBED_CALCIUM_PHASE2A_EVIDENCE_STATUS;
  readonly experimentalTargets: "deferred";
  readonly ownerAcceptanceStatus: "not-owner-acceptance";
  readonly sections: readonly PrescribedCalciumProtocolSection[];
  readonly deferredExperimentalTargets: readonly unknown[];
  readonly closurePass: boolean;
  readonly stableSummaryHash: string;
};

type CalciumSample = {
  readonly timeSec: number;
  readonly activationEventId: number;
  readonly timeSinceActivationSec: number;
  readonly freeCalciumUM: number;
  readonly riseState01: number;
  readonly decayState01: number;
};

type CalciumTrajectory = {
  readonly samples: readonly CalciumSample[];
  readonly finalState: Float64Array;
};

export function runPrescribedCalciumPhase2AProtocolReport(
  params: PrescribedCalciumParams = PRESCRIBED_CALCIUM_SYNTHETIC_SMOKE_PARAMETER_SET,
): PrescribedCalciumProtocolReport {
  const sections: PrescribedCalciumProtocolSection[] = [
    runSyntheticWaveformShapeSection(params),
    runEventCycleContinuitySection(params),
    runKnotPolicySection(params),
    runDtSelfConsistencySection(params),
    runNonnegativeCalciumSection(params),
    runClaimBoundarySection(),
    runDeterministicReplaySection(params),
  ];
  sections.push({
    id: "deferred-experimental-targets",
    status: "deferred-target",
    metrics: {
      count: protocolDescriptor.deferredExperimentalTargets.length,
      experimentalTargets: "deferred",
    },
  });

  const closureSections = sections.filter((section) => section.status !== "deferred-target");
  const closurePass = closureSections.every((section) => section.status === "closure-pass");
  const hashInput = sections.map((section) => ({
    id: section.id,
    status: section.status,
    metrics: section.metrics,
  }));

  return {
    protocolSetId: protocolDescriptor.protocolSetId,
    claimBoundary: PRESCRIBED_CALCIUM_PHASE2A_CLAIM_BOUNDARY,
    evidenceStatus: PRESCRIBED_CALCIUM_PHASE2A_EVIDENCE_STATUS,
    experimentalTargets: "deferred",
    ownerAcceptanceStatus: "not-owner-acceptance",
    sections,
    deferredExperimentalTargets: protocolDescriptor.deferredExperimentalTargets,
    closurePass,
    stableSummaryHash: stableHash(sanitizeForStableHash(hashInput)),
  };
}

function runSyntheticWaveformShapeSection(params: PrescribedCalciumParams): PrescribedCalciumProtocolSection {
  const cycleLengthSec = 0.8;
  const normalizedParams = normalizePrescribedCalciumParams(params);
  const target = effectiveCalciumRateTargetAtCycleLength(params, cycleLengthSec);
  const trajectory = runCalciumTrajectory(params, cycleLengthSec, 0.00025, 1);
  const metrics = waveformMetrics(trajectory.samples, target.diastolicCalciumUM);
  const peakAmplitudeErrorUM = Math.abs(metrics.peakAmplitudeUM - target.peakAmplitudeUM);
  const releaseRelativeTimeToPeakSec = metrics.timeToPeakSec - normalizedParams.activationDelaySec;
  const timeToPeakErrorSec = Math.abs(releaseRelativeTimeToPeakSec - target.riseTimeSec);
  const decayHalfRatio = metrics.decayHalfTimeSec / target.decayHalfTimeSec;
  const ok =
    peakAmplitudeErrorUM <= Math.max(0.015, 0.02 * target.peakAmplitudeUM)
    && timeToPeakErrorSec <= 0.004
    && decayHalfRatio >= 0.5
    && decayHalfRatio <= 1.8;
  return section("synthetic-waveform-shape-v1", ok, {
    cycleLengthSec,
    targetPeakAmplitudeUM: target.peakAmplitudeUM,
    peakAmplitudeUM: metrics.peakAmplitudeUM,
    peakAmplitudeErrorUM,
    targetRiseTimeSec: target.riseTimeSec,
    eventRelativeTimeToPeakSec: metrics.timeToPeakSec,
    activationDelaySec: normalizedParams.activationDelaySec,
    releaseRelativeTimeToPeakSec,
    timeToPeakErrorSec,
    targetDecayHalfTimeSec: target.decayHalfTimeSec,
    decayHalfTimeSec: metrics.decayHalfTimeSec,
    decayHalfRatio,
    syntheticSmokeOnly: true,
  });
}

function runEventCycleContinuitySection(params: PrescribedCalciumParams): PrescribedCalciumProtocolSection {
  const cycleLengthSec = 0.8;
  const dtSec = 0.001;
  const trajectory = runCalciumTrajectory(params, cycleLengthSec, dtSec, 1.25);
  const eventOneSamples = trajectory.samples.filter((sample) => sample.activationEventId === 1);
  const beforeIncrement = eventOneSamples[eventOneSamples.length - 1];
  const afterIncrement = trajectory.samples.find((sample) => sample.activationEventId === 2);
  const residualCarried =
    beforeIncrement !== undefined
    && afterIncrement !== undefined
    && afterIncrement.decayState01 > 0
    && afterIncrement.decayState01 < beforeIncrement.decayState01 + 1e-12;
  return section("event-cycle-continuity-v1", residualCarried, {
    cycleLengthSec,
    beforeEventId: beforeIncrement?.activationEventId ?? -1,
    afterEventId: afterIncrement?.activationEventId ?? -1,
    beforeDecayState01: beforeIncrement?.decayState01 ?? Number.NaN,
    afterDecayState01: afterIncrement?.decayState01 ?? Number.NaN,
    stateResetOnEventIncrement: false,
    activationDelayIsCalciumReleaseLatency: true,
  });
}

function runKnotPolicySection(params: PrescribedCalciumParams): PrescribedCalciumProtocolSection {
  const normalized = normalizePrescribedCalciumParams(params);
  const low = effectiveCalciumRateTargetAtCycleLength(normalized, 0.5);
  const mid = effectiveCalciumRateTargetAtCycleLength(normalized, 0.7);
  const high = effectiveCalciumRateTargetAtCycleLength(normalized, 1.2);
  const first = normalized.rateTargets[0];
  const second = normalized.rateTargets[1];
  const last = normalized.rateTargets[normalized.rateTargets.length - 1];
  const expectedMidAmplitude = (first.peakAmplitudeUM + second.peakAmplitudeUM) / 2;
  let monotoneCubicRejected = false;
  try {
    normalizePrescribedCalciumParams({ ...params, interpolation: "monotone-cubic" });
  } catch {
    monotoneCubicRejected = true;
  }
  const ok =
    low.interpolationPolicy === "endpoint-clamp"
    && high.interpolationPolicy === "endpoint-clamp"
    && mid.interpolationPolicy === "piecewise-linear"
    && low.peakAmplitudeUM === first.peakAmplitudeUM
    && high.peakAmplitudeUM === last.peakAmplitudeUM
    && Math.abs(mid.peakAmplitudeUM - expectedMidAmplitude) < 1e-12
    && monotoneCubicRejected;
  return section("cycle-length-knot-policy-v1", ok, {
    lowPolicy: low.interpolationPolicy,
    midPolicy: mid.interpolationPolicy,
    highPolicy: high.interpolationPolicy,
    midPeakAmplitudeUM: mid.peakAmplitudeUM,
    expectedMidPeakAmplitudeUM: expectedMidAmplitude,
    monotoneCubicRejected,
  });
}

function runDtSelfConsistencySection(params: PrescribedCalciumParams): PrescribedCalciumProtocolSection {
  const cycleLengthSec = 0.8;
  const dtValuesSec = [0.001, 0.0005, 0.00025];
  const peaks = dtValuesSec.map((dtSec) => waveformMetrics(
    runCalciumTrajectory(params, cycleLengthSec, dtSec, 1).samples,
    effectiveCalciumRateTargetAtCycleLength(params, cycleLengthSec).diastolicCalciumUM,
  ).peakCalciumUM);
  const fine = peaks[2];
  const coarseError = Math.abs(peaks[0] - fine);
  const midError = Math.abs(peaks[1] - fine);
  const monotoneSelfConsistency = midError <= Math.max(coarseError * 1.2, 1e-7);
  return section("dt-self-consistency-v1", peaks.every(Number.isFinite) && monotoneSelfConsistency, {
    dtValuesSec,
    peakCalciumUM: peaks,
    coarseErrorUM: coarseError,
    midErrorUM: midError,
    monotoneSelfConsistency,
  });
}

function runNonnegativeCalciumSection(params: PrescribedCalciumParams): PrescribedCalciumProtocolSection {
  const trajectories = [0.6, 0.8, 1].map((cycleLengthSec) =>
    runCalciumTrajectory(params, cycleLengthSec, 0.001, 1.5),
  );
  const calciumValues = trajectories.flatMap((trajectory) =>
    trajectory.samples.map((sample) => sample.freeCalciumUM),
  );
  const minCalciumUM = Math.min(...calciumValues);
  return section("nonnegative-calcium-v1", Number.isFinite(minCalciumUM) && minCalciumUM >= 0, {
    minCalciumUM,
    sampleCount: calciumValues.length,
  });
}

function runClaimBoundarySection(): PrescribedCalciumProtocolSection {
  const sampleOutputKeys = Object.keys(
    stepPrescribedCalciumTransientV1(
      Float64Array.from([0, 0]),
      representativeInput(0.02, 0.8, 0.001, 1),
    ).output,
  );
  const forbiddenOutputKeys = [
    "releaseFlux",
    "removalFlux",
    "sercaFlux",
    "ryrFlux",
    "srLoad",
    "temperatureK",
  ];
  const forbiddenRuntimeOutputFieldCount = sampleOutputKeys.filter((key) =>
    forbiddenOutputKeys.includes(key),
  ).length;
  const descriptorOk =
    protocolDescriptor.claimBoundary === PRESCRIBED_CALCIUM_PHASE2A_CLAIM_BOUNDARY
    && protocolDescriptor.evidenceStatus === PRESCRIBED_CALCIUM_PHASE2A_EVIDENCE_STATUS
    && protocolDescriptor.experimentalTargets === "deferred"
    && protocolDescriptor.ownerAcceptanceStatus === "not-owner-acceptance";
  return section("claim-boundary-v1", descriptorOk && forbiddenRuntimeOutputFieldCount === 0, {
    claimBoundary: protocolDescriptor.claimBoundary,
    evidenceStatus: protocolDescriptor.evidenceStatus,
    experimentalTargets: protocolDescriptor.experimentalTargets,
    ownerAcceptanceStatus: protocolDescriptor.ownerAcceptanceStatus,
    forbiddenRuntimeOutputFieldCount,
    outputFields: sampleOutputKeys.join(","),
  });
}

function runDeterministicReplaySection(params: PrescribedCalciumParams): PrescribedCalciumProtocolSection {
  const first = compactTrajectory(runCalciumTrajectory(params, 0.8, 0.001, 1.2));
  const second = compactTrajectory(runCalciumTrajectory(params, 0.8, 0.001, 1.2));
  const firstHash = stableHash(sanitizeForStableHash(first));
  const secondHash = stableHash(sanitizeForStableHash(second));
  return section("deterministic-replay-v1", firstHash === secondHash, {
    firstHash,
    secondHash,
    deterministic: firstHash === secondHash,
  });
}

function runCalciumTrajectory(
  params: PrescribedCalciumParams,
  cycleLengthSec: number,
  dtSec: number,
  cycles: number,
): CalciumTrajectory {
  const steps = Math.max(1, Math.round((cycleLengthSec * cycles) / dtSec));
  let state = Float64Array.from([0, 0]);
  const samples: CalciumSample[] = [];
  for (let step = 1; step <= steps; step += 1) {
    const timeSec = step * dtSec;
    const cycleIndex = Math.floor((timeSec + 1e-12) / cycleLengthSec);
    const timeSinceActivationSec = Math.max(0, timeSec - cycleIndex * cycleLengthSec);
    const input = representativeInput(timeSinceActivationSec, cycleLengthSec, dtSec, cycleIndex + 1);
    const result = stepPrescribedCalciumTransientV1(state, input, params);
    state = result.nextState;
    samples.push({
      timeSec,
      activationEventId: input.activationEventId,
      timeSinceActivationSec: input.timeSinceActivationSec,
      freeCalciumUM: result.output.freeCalciumUM,
      riseState01: result.output.riseState01,
      decayState01: result.output.decayState01,
    });
  }
  return { samples, finalState: state };
}

function waveformMetrics(samples: readonly CalciumSample[], diastolicCalciumUM: number) {
  const peakCalciumUM = Math.max(...samples.map((sample) => sample.freeCalciumUM));
  const peak = samples.find((sample) => sample.freeCalciumUM === peakCalciumUM);
  const peakAmplitudeUM = peakCalciumUM - diastolicCalciumUM;
  const halfThreshold = diastolicCalciumUM + peakAmplitudeUM / 2;
  const afterPeak = peak
    ? samples.filter((sample) => sample.timeSec > peak.timeSec)
    : [];
  const halfDecay = afterPeak.find((sample) => sample.freeCalciumUM <= halfThreshold);
  return {
    peakCalciumUM,
    peakAmplitudeUM,
    timeToPeakSec: peak?.timeSinceActivationSec ?? Number.NaN,
    decayHalfTimeSec: peak && halfDecay ? halfDecay.timeSec - peak.timeSec : Number.NaN,
  };
}

function representativeInput(
  timeSinceActivationSec: number,
  cycleLengthSec: number,
  dtSec: number,
  activationEventId: number,
): PrescribedCalciumInput {
  return validatePrescribedCalciumInput({
    targetId: "lv-free-wall",
    activationEventId,
    timeSinceActivationSec,
    cycleLengthSec,
    activationStrength01: 1,
    dtSec,
  });
}

function section(
  id: string,
  ok: boolean,
  metrics: Record<string, number | string | boolean | readonly number[]>,
): PrescribedCalciumProtocolSection {
  return {
    id,
    status: ok ? "closure-pass" : "closure-fail",
    metrics,
  };
}

function compactTrajectory(trajectory: CalciumTrajectory): unknown {
  return {
    samples: trajectory.samples.map((sample) => ({
      timeSec: round(sample.timeSec),
      activationEventId: sample.activationEventId,
      timeSinceActivationSec: round(sample.timeSinceActivationSec),
      freeCalciumUM: round(sample.freeCalciumUM),
      riseState01: round(sample.riseState01),
      decayState01: round(sample.decayState01),
    })),
    finalState: Array.from(trajectory.finalState).map(round),
  };
}

function stableHash(value: unknown): string {
  const text = stableStringify(value);
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const entries = Object.entries(value as Record<string, unknown>).sort(([left], [right]) =>
    left < right ? -1 : left > right ? 1 : 0,
  );
  return `{${entries.map(([key, child]) => `${JSON.stringify(key)}:${stableStringify(child)}`).join(",")}}`;
}

function sanitizeForStableHash(value: unknown): unknown {
  if (typeof value === "number") {
    return Number.isFinite(value) ? round(value) : String(value);
  }
  if (Array.isArray(value)) return value.map(sanitizeForStableHash);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, child]) => [key, sanitizeForStableHash(child)]),
    );
  }
  return value;
}

function round(value: number): number {
  return Math.round(value * 1e12) / 1e12;
}
