import protocolDescriptor from "@/data/myocardium/protocols/calcium-land-phase2b-isometric-protocols.json";
import {
  PRESCRIBED_CALCIUM_SYNTHETIC_SMOKE_PARAMETER_SET,
  stepPrescribedCalciumTransientV1,
  type PrescribedCalciumParams,
} from "@/engine/myocardium/calcium";
import {
  LAND2017_STATE_INDEX,
  solveLand2017BackwardEulerSubsteps,
  type Land2017SubstepSolveOptions,
  type LandStepInput,
} from "@/engine/myocardium/myofilament/land2017";

export const CALCIUM_LAND_ISOMETRIC_PHASE2B_CLAIM_BOUNDARY =
  "standalone-isometric-ca-land-only";
export const CALCIUM_LAND_ISOMETRIC_PHASE2B_EVIDENCE_STATUS =
  "synthetic-coupling-smoke-only";

export type CalciumLandIsometricProtocolStatus =
  | "closure-pass"
  | "closure-fail"
  | "deferred-target";

export type CalciumLandIsometricProtocolSection = {
  readonly id: string;
  readonly status: CalciumLandIsometricProtocolStatus;
  readonly metrics: Record<string, number | string | boolean | readonly number[]>;
};

export type CalciumLandIsometricProtocolReport = {
  readonly protocolSetId: string;
  readonly claimBoundary: typeof CALCIUM_LAND_ISOMETRIC_PHASE2B_CLAIM_BOUNDARY;
  readonly evidenceStatus: typeof CALCIUM_LAND_ISOMETRIC_PHASE2B_EVIDENCE_STATUS;
  readonly experimentalTargets: "deferred";
  readonly ownerAcceptanceStatus: "not-owner-acceptance";
  readonly sections: readonly CalciumLandIsometricProtocolSection[];
  readonly closurePass: boolean;
  readonly stableSummaryHash: string;
};

export type CalciumLandIsometricTrajectoryOptions = {
  readonly params?: PrescribedCalciumParams;
  readonly initialLandState?: ArrayLike<number>;
  readonly initialCalciumState?: ArrayLike<number>;
  readonly cycleLengthSec?: number;
  readonly durationSec?: number;
  readonly dtSec?: number;
  readonly fixedFiberEngineeringStrain?: number;
  readonly landSolveOptions?: Land2017SubstepSolveOptions;
};

type CalciumLandSample = {
  readonly timeSec: number;
  readonly freeCalciumUM: number;
  readonly sourceActiveFiberStressPa: number;
  readonly minimumPopulation: number;
  readonly stateConservationResidual: number;
  readonly projectionUsed: boolean;
  readonly solverIterations: number;
  readonly solverResidualNorm: number;
};

type CalciumLandTrajectory = {
  readonly ok: boolean;
  readonly samples: readonly CalciumLandSample[];
  readonly finalLandState: Float64Array;
  readonly finalCalciumState: Float64Array;
  readonly failureReason?: string;
  readonly failureMessage?: string;
};

type IsometricMetrics = {
  readonly peakStressPa: number;
  readonly meanStressPa: number;
  readonly peakMeanRatio: number;
  readonly timeToPeakMs: number;
  readonly fwhmMs: number;
  readonly width80Ms: number;
  readonly width90Ms: number;
  readonly relaxationTauMs: number;
  readonly relaxationTauR2: number;
  readonly maxUpstrokePaPerSec: number;
  readonly maxRelaxationPaPerSec: number;
  readonly minimumPopulation: number;
  readonly maxConservationResidual: number;
  readonly projectionUsed: boolean;
  readonly solverFailureCount: number;
};

const DEFAULT_INITIAL_LAND_STATE = Float64Array.from([0.18, 0.22, 0.04, 0.02, 0, 0]);
const DEFAULT_INITIAL_CALCIUM_STATE = Float64Array.from([0, 0]);
const DEFAULT_LAND_SOLVE_OPTIONS: Land2017SubstepSolveOptions = {
  maxIterations: 16,
  residualTolerance: 1e-8,
  lineSearchMinStep: 1 / 2048,
};

export function runCalciumLandIsometricPhase2BReport(
  options: CalciumLandIsometricTrajectoryOptions = {},
): CalciumLandIsometricProtocolReport {
  const sections: CalciumLandIsometricProtocolSection[] = [
    runIsometricTwitchMetricsSection(options),
    runCalciumAmplitudeDirectionalitySection(options),
    runLandSolverFailureReportingSection(options),
    runClaimBoundarySection(),
    runDeterministicReplaySection(options),
  ];
  sections.push({
    id: "deferred-experimental-targets",
    status: "deferred-target",
    metrics: {
      count: protocolDescriptor.pendingOwnerDecisions.length,
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
    claimBoundary: CALCIUM_LAND_ISOMETRIC_PHASE2B_CLAIM_BOUNDARY,
    evidenceStatus: CALCIUM_LAND_ISOMETRIC_PHASE2B_EVIDENCE_STATUS,
    experimentalTargets: "deferred",
    ownerAcceptanceStatus: "not-owner-acceptance",
    sections,
    closurePass,
    stableSummaryHash: stableHash(sanitizeForStableHash(hashInput)),
  };
}

export function runCalciumLandIsometricTrajectory(
  options: CalciumLandIsometricTrajectoryOptions = {},
): CalciumLandTrajectory {
  const params = options.params ?? PRESCRIBED_CALCIUM_SYNTHETIC_SMOKE_PARAMETER_SET;
  const cycleLengthSec = options.cycleLengthSec ?? 0.8;
  const durationSec = options.durationSec ?? 0.8;
  const dtSec = options.dtSec ?? 0.001;
  const fixedFiberEngineeringStrain = options.fixedFiberEngineeringStrain ?? 0.02;
  let calciumState = Float64Array.from(options.initialCalciumState ?? DEFAULT_INITIAL_CALCIUM_STATE);
  let landState = Float64Array.from(options.initialLandState ?? DEFAULT_INITIAL_LAND_STATE);
  const landSolveOptions = { ...DEFAULT_LAND_SOLVE_OPTIONS, ...options.landSolveOptions };
  let previousFreeCalciumUM = params.rateTargets[0]?.diastolicCalciumUM ?? 0.12;
  const samples: CalciumLandSample[] = [];
  const steps = Math.max(1, Math.round(durationSec / dtSec));

  for (let step = 1; step <= steps; step += 1) {
    const timeSec = step * dtSec;
    const cycleIndex = Math.floor((timeSec + 1e-12) / cycleLengthSec);
    const timeSinceActivationSec = Math.max(0, timeSec - cycleIndex * cycleLengthSec);
    const calciumStep = stepPrescribedCalciumTransientV1(
      calciumState,
      {
        targetId: "lv-free-wall",
        activationEventId: cycleIndex + 1,
        timeSinceActivationSec,
        cycleLengthSec,
        activationStrength01: 1,
        dtSec,
      },
      params,
    );
    calciumState = calciumStep.nextState;
    const landInput: LandStepInput = {
      freeCalciumUM: calciumStep.output.freeCalciumUM,
      previousFiberEngineeringStrain: fixedFiberEngineeringStrain,
      stageFiberEngineeringStrain: fixedFiberEngineeringStrain,
      dtSec,
      stage: { scheme: "BE", stageIndex: 0 },
    };
    const solved = solveLand2017BackwardEulerSubsteps(
      landState,
      landInput,
      { ...landSolveOptions, previousFreeCalciumUM },
    );
    if (!solved.ok || !solved.output) {
      return {
        ok: false,
        samples,
        finalLandState: landState,
        finalCalciumState: calciumState,
        failureReason: solved.failureReason ?? "unknown",
        failureMessage: solved.failureMessage,
      };
    }
    landState = solved.nextState;
    previousFreeCalciumUM = calciumStep.output.freeCalciumUM;
    samples.push({
      timeSec,
      freeCalciumUM: calciumStep.output.freeCalciumUM,
      sourceActiveFiberStressPa: solved.output.sourceActiveFiberStressPa,
      minimumPopulation: solved.output.health.minimumPopulation,
      stateConservationResidual: solved.output.health.stateConservationResidual,
      projectionUsed: solved.output.health.projectionUsed,
      solverIterations: solved.iterations,
      solverResidualNorm: solved.residualNorm,
    });
  }

  return { ok: true, samples, finalLandState: landState, finalCalciumState: calciumState };
}

export function scalePrescribedCalciumPeakAmplitude(
  params: PrescribedCalciumParams,
  multiplier: number,
): PrescribedCalciumParams {
  if (!Number.isFinite(multiplier) || multiplier <= 0) {
    throw new Error("Calcium amplitude multiplier must be positive and finite");
  }
  return {
    ...params,
    rateTargets: params.rateTargets.map((target) => ({
      ...target,
      peakAmplitudeUM: target.peakAmplitudeUM * multiplier,
    })),
  };
}

function runIsometricTwitchMetricsSection(
  options: CalciumLandIsometricTrajectoryOptions,
): CalciumLandIsometricProtocolSection {
  const trajectory = runCalciumLandIsometricTrajectory(options);
  const metrics = computeIsometricMetrics(trajectory);
  const ok =
    trajectory.ok
    && finiteMetrics(metrics)
    && metrics.peakStressPa > 0
    && metrics.fwhmMs > 0
    && metrics.width80Ms >= 0
    && metrics.width90Ms >= 0
    && metrics.relaxationTauMs > 0
    && metrics.relaxationTauR2 >= 0
    && metrics.maxUpstrokePaPerSec > 0
    && metrics.maxRelaxationPaPerSec < 0
    && metrics.minimumPopulation >= -1e-10
    && !metrics.projectionUsed;
  return section("isometric-ca-land-twitch-metrics-v1", ok, {
    ...metrics,
    trajectoryComplete: trajectory.ok,
    failureReason: trajectory.failureReason ?? "none",
    sourceStressOnly: true,
  });
}

function runCalciumAmplitudeDirectionalitySection(
  options: CalciumLandIsometricTrajectoryOptions,
): CalciumLandIsometricProtocolSection {
  const low = runCalciumLandIsometricTrajectory({
    ...options,
    params: scalePrescribedCalciumPeakAmplitude(
      options.params ?? PRESCRIBED_CALCIUM_SYNTHETIC_SMOKE_PARAMETER_SET,
      0.8,
    ),
  });
  const high = runCalciumLandIsometricTrajectory({
    ...options,
    params: scalePrescribedCalciumPeakAmplitude(
      options.params ?? PRESCRIBED_CALCIUM_SYNTHETIC_SMOKE_PARAMETER_SET,
      1.2,
    ),
  });
  const lowPeakStressPa = peakStress(low.samples);
  const highPeakStressPa = peakStress(high.samples);
  const ok =
    low.ok
    && high.ok
    && Number.isFinite(lowPeakStressPa)
    && Number.isFinite(highPeakStressPa)
    && highPeakStressPa > lowPeakStressPa;
  return section("ca-amplitude-directionality-v1", ok, {
    lowPeakStressPa,
    highPeakStressPa,
    highGreaterThanLow: highPeakStressPa > lowPeakStressPa,
    sourceStressOnly: true,
  });
}

function runLandSolverFailureReportingSection(
  options: CalciumLandIsometricTrajectoryOptions,
): CalciumLandIsometricProtocolSection {
  const invalidLandState = Float64Array.from(DEFAULT_INITIAL_LAND_STATE);
  invalidLandState[LAND2017_STATE_INDEX.CaTRPN] = 0;
  const failed = runCalciumLandIsometricTrajectory({
    ...options,
    initialLandState: invalidLandState,
    durationSec: 0.01,
  });
  return section("land-solver-failure-reporting-v1", !failed.ok && failed.failureReason === "domain-error", {
    structuredFailure: !failed.ok,
    failureReason: failed.failureReason ?? "none",
    failureMessage: failed.failureMessage ?? "",
    partialSampleCount: failed.samples.length,
  });
}

function runClaimBoundarySection(): CalciumLandIsometricProtocolSection {
  const descriptorOk =
    protocolDescriptor.claimBoundary === CALCIUM_LAND_ISOMETRIC_PHASE2B_CLAIM_BOUNDARY
    && protocolDescriptor.evidenceStatus === CALCIUM_LAND_ISOMETRIC_PHASE2B_EVIDENCE_STATUS
    && protocolDescriptor.experimentalTargets === "deferred"
    && protocolDescriptor.ownerAcceptanceStatus === "not-owner-acceptance";
  const reportKeys = Object.keys(computeIsometricMetrics(runCalciumLandIsometricTrajectory()));
  const forbiddenPattern = /(LVP|pressure|valve|qDot|loaded|generalizedForce|homogenization)/i;
  const forbiddenFieldCount = reportKeys.filter((key) => forbiddenPattern.test(key)).length;
  return section("isometric-claim-boundary-v1", descriptorOk && forbiddenFieldCount === 0, {
    claimBoundary: protocolDescriptor.claimBoundary,
    evidenceStatus: protocolDescriptor.evidenceStatus,
    experimentalTargets: protocolDescriptor.experimentalTargets,
    ownerAcceptanceStatus: protocolDescriptor.ownerAcceptanceStatus,
    forbiddenFieldCount,
    metricFields: reportKeys.join(","),
  });
}

function runDeterministicReplaySection(
  options: CalciumLandIsometricTrajectoryOptions,
): CalciumLandIsometricProtocolSection {
  const first = compactTrajectory(runCalciumLandIsometricTrajectory(options));
  const second = compactTrajectory(runCalciumLandIsometricTrajectory(options));
  const firstHash = stableHash(sanitizeForStableHash(first));
  const secondHash = stableHash(sanitizeForStableHash(second));
  return section("deterministic-replay-v1", firstHash === secondHash, {
    firstHash,
    secondHash,
    deterministic: firstHash === secondHash,
  });
}

function computeIsometricMetrics(trajectory: CalciumLandTrajectory): IsometricMetrics {
  if (trajectory.samples.length === 0) {
    return emptyMetrics(trajectory);
  }
  const samples = trajectory.samples;
  const stresses = samples.map((sample) => sample.sourceActiveFiberStressPa);
  const times = samples.map((sample) => sample.timeSec);
  const baseline = stresses[0];
  const peak = Math.max(...stresses);
  const peakIndex = stresses.indexOf(peak);
  const mean = stresses.reduce((sum, stress) => sum + stress, 0) / stresses.length;
  const derivatives = stressDerivatives(samples);
  const relaxation = relaxationTauFit(samples, baseline, peak, peakIndex);
  const minimumPopulation = Math.min(...samples.map((sample) => sample.minimumPopulation));
  const maxConservationResidual = Math.max(
    ...samples.map((sample) => Math.abs(sample.stateConservationResidual)),
  );
  return {
    peakStressPa: peak,
    meanStressPa: mean,
    peakMeanRatio: peak / mean,
    timeToPeakMs: (times[peakIndex] ?? 0) * 1000,
    fwhmMs: widthAtFractionMs(times, stresses, baseline, peak, 0.5),
    width80Ms: widthAtFractionMs(times, stresses, baseline, peak, 0.8),
    width90Ms: widthAtFractionMs(times, stresses, baseline, peak, 0.9),
    relaxationTauMs: relaxation.tauMs,
    relaxationTauR2: relaxation.r2,
    maxUpstrokePaPerSec: Math.max(...derivatives),
    maxRelaxationPaPerSec: Math.min(...derivatives),
    minimumPopulation,
    maxConservationResidual,
    projectionUsed: samples.some((sample) => sample.projectionUsed),
    solverFailureCount: trajectory.ok ? 0 : 1,
  };
}

function emptyMetrics(trajectory: CalciumLandTrajectory): IsometricMetrics {
  return {
    peakStressPa: Number.NaN,
    meanStressPa: Number.NaN,
    peakMeanRatio: Number.NaN,
    timeToPeakMs: Number.NaN,
    fwhmMs: Number.NaN,
    width80Ms: Number.NaN,
    width90Ms: Number.NaN,
    relaxationTauMs: Number.NaN,
    relaxationTauR2: Number.NaN,
    maxUpstrokePaPerSec: Number.NaN,
    maxRelaxationPaPerSec: Number.NaN,
    minimumPopulation: Number.NaN,
    maxConservationResidual: Number.NaN,
    projectionUsed: false,
    solverFailureCount: trajectory.ok ? 0 : 1,
  };
}

function relaxationTauFit(
  samples: readonly CalciumLandSample[],
  baseline: number,
  peak: number,
  peakIndex: number,
): { tauMs: number; r2: number } {
  const amplitude = peak - baseline;
  if (!(amplitude > 0)) return { tauMs: Number.NaN, r2: Number.NaN };
  const points = samples
    .slice(peakIndex + 1)
    .map((sample) => ({
      x: sample.timeSec - samples[peakIndex].timeSec,
      y: (sample.sourceActiveFiberStressPa - baseline) / amplitude,
    }))
    .filter((point) => point.x > 0 && point.y > 0.05 && point.y < 0.95)
    .map((point) => ({ x: point.x, logY: Math.log(point.y) }));
  if (points.length < 3) return { tauMs: Number.NaN, r2: Number.NaN };
  const meanX = points.reduce((sum, point) => sum + point.x, 0) / points.length;
  const meanY = points.reduce((sum, point) => sum + point.logY, 0) / points.length;
  const ssXX = points.reduce((sum, point) => sum + (point.x - meanX) ** 2, 0);
  const ssXY = points.reduce((sum, point) => sum + (point.x - meanX) * (point.logY - meanY), 0);
  if (!(ssXX > 0)) return { tauMs: Number.NaN, r2: Number.NaN };
  const slope = ssXY / ssXX;
  if (!(slope < 0)) return { tauMs: Number.NaN, r2: Number.NaN };
  const intercept = meanY - slope * meanX;
  const ssTot = points.reduce((sum, point) => sum + (point.logY - meanY) ** 2, 0);
  const ssRes = points.reduce((sum, point) => {
    const residual = point.logY - (intercept + slope * point.x);
    return sum + residual * residual;
  }, 0);
  return {
    tauMs: (-1 / slope) * 1000,
    r2: ssTot > 0 ? Math.max(0, 1 - ssRes / ssTot) : 1,
  };
}

function stressDerivatives(samples: readonly CalciumLandSample[]): readonly number[] {
  const derivatives: number[] = [];
  for (let index = 1; index < samples.length; index += 1) {
    const dt = samples[index].timeSec - samples[index - 1].timeSec;
    derivatives.push((samples[index].sourceActiveFiberStressPa - samples[index - 1].sourceActiveFiberStressPa) / dt);
  }
  return derivatives.length > 0 ? derivatives : [Number.NaN];
}

function widthAtFractionMs(
  times: readonly number[],
  stresses: readonly number[],
  baseline: number,
  peak: number,
  fraction: number,
): number {
  const threshold = baseline + fraction * (peak - baseline);
  const indices = stresses.flatMap((stress, index) => (stress >= threshold ? [index] : []));
  if (indices.length === 0) return Number.NaN;
  return ((times[indices[indices.length - 1]] ?? 0) - (times[indices[0]] ?? 0)) * 1000;
}

function peakStress(samples: readonly CalciumLandSample[]): number {
  if (samples.length === 0) return Number.NaN;
  return Math.max(...samples.map((sample) => sample.sourceActiveFiberStressPa));
}

function finiteMetrics(metrics: IsometricMetrics): boolean {
  return Object.values(metrics).every((value) => typeof value !== "number" || Number.isFinite(value));
}

function section(
  id: string,
  ok: boolean,
  metrics: Record<string, number | string | boolean | readonly number[]>,
): CalciumLandIsometricProtocolSection {
  return {
    id,
    status: ok ? "closure-pass" : "closure-fail",
    metrics,
  };
}

function compactTrajectory(trajectory: CalciumLandTrajectory): unknown {
  return {
    ok: trajectory.ok,
    samples: trajectory.samples.map((sample) => ({
      timeSec: round(sample.timeSec),
      freeCalciumUM: round(sample.freeCalciumUM),
      sourceActiveFiberStressPa: round(sample.sourceActiveFiberStressPa),
      minimumPopulation: round(sample.minimumPopulation),
      stateConservationResidual: round(sample.stateConservationResidual),
      projectionUsed: sample.projectionUsed,
    })),
    finalLandState: Array.from(trajectory.finalLandState).map(round),
    finalCalciumState: Array.from(trajectory.finalCalciumState).map(round),
    failureReason: trajectory.failureReason,
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
