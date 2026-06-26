import protocolDescriptor from "@/data/myocardium/protocols/land2017-phase1c-source-protocols.json";
import {
  LAND2017_ACTIVE_STIFFNESS_PROVENANCE,
  computeLand2017ActiveStiffnessPa,
} from "@/engine/myocardium/myofilament/land2017/stabilization";
import {
  computeLand2017AlgorithmicTangentPa,
  computeLand2017FrozenStateTangentPa,
  evaluateLand2017SolvedStepWithTangents,
} from "@/engine/myocardium/myofilament/land2017/tangents";
import {
  LAND2017_STATE_INDEX,
  type LandStepInput,
} from "@/engine/myocardium/myofilament/land2017/types";
import { stableHash } from "@/engine/myocardium/myofilament/land2017/parameterSets";
import {
  solveLand2017BackwardEulerSubsteps,
  type Land2017StepSolveResult,
} from "@/engine/myocardium/myofilament/land2017/solver";

export type Land2017ProtocolStatus = "closure-pass" | "closure-fail" | "deferred-target";

export type Land2017ProtocolSection = {
  readonly id: string;
  readonly status: Land2017ProtocolStatus;
  readonly metrics: Record<string, number | string | boolean | readonly number[]>;
};

export type Land2017ProtocolReport = {
  readonly protocolSetId: string;
  readonly claimBoundary: "algorithmic-source-closure-only";
  readonly experimentalTargets: "deferred";
  readonly sections: readonly Land2017ProtocolSection[];
  readonly deferredExperimentalTargets: readonly unknown[];
  readonly closurePass: boolean;
  readonly stableSummaryHash: string;
};

type TrajectoryPoint = {
  readonly freeCalciumUM: number;
  readonly strain: number;
};

type TrajectorySample = {
  readonly timeSec: number;
  readonly stressPa: number;
  readonly minimumPopulation: number;
  readonly stateConservationResidual: number;
  readonly projectionUsed: boolean;
};

type TrajectoryRun = {
  readonly ok: boolean;
  readonly samples: readonly TrajectorySample[];
  readonly finalState: Float64Array;
  readonly failureReason?: string;
};

type ScalarRunMetric = {
  readonly ok: boolean;
  readonly value: number;
  readonly failureReason?: string;
};

const DEFAULT_INITIAL_STATE = Float64Array.from([0.18, 0.22, 0.04, 0.02, 0, 0]);
const DEFAULT_SOLVE_OPTIONS = {
  maxIterations: 16,
  residualTolerance: 1e-8,
  lineSearchMinStep: 1 / 2048,
};

export function runLand2017Phase1CProtocolReport(): Land2017ProtocolReport {
  const sections: Land2017ProtocolSection[] = [
    runForceCaSection(),
    runSyntheticTwitchSection(),
    runLengthStepSection(),
    runConstantVelocitySection(),
    runForceVelocitySection(),
    runLengthDependentTwitchSection(),
    runPrescribedShorteningSection(),
    runStateConservationSection(),
    runDtConvergenceSection(),
    runStabilizationSourceSection(),
    runAlgorithmicTangentSection(),
    runDeterminismSection(),
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
    claimBoundary: protocolDescriptor.claimBoundary as "algorithmic-source-closure-only",
    experimentalTargets: "deferred",
    sections,
    deferredExperimentalTargets: protocolDescriptor.deferredExperimentalTargets,
    closurePass,
    stableSummaryHash: stableHash(sanitizeForStableHash(hashInput)),
  };
}

function runForceCaSection(): Land2017ProtocolSection {
  const calciumValues = [0.2, 0.4, 0.8, 1.2];
  const strainValues = [0, 0.06];
  const finalStressRunsByStrain = strainValues.map((strain) =>
    calciumValues.map((freeCalciumUM) => {
      const run = runTrajectory(
        `force-ca-${strain}-${freeCalciumUM}`,
        0.04,
        0.001,
        () => ({ freeCalciumUM, strain }),
      );
      return { ok: run.ok, value: finalStress(run), failureReason: run.failureReason };
    }),
  );
  const finalStressByStrain = finalStressRunsByStrain.map((row) => row.map((metric) => metric.value));
  const trajectoryComplete = finalStressRunsByStrain.flat().every((metric) => metric.ok);
  const monotonic = finalStressByStrain.every((values) => isNonDecreasing(values, 1e-6));
  return section("force-ca-multistrain-smoke", trajectoryComplete && monotonic && allNestedFinite(finalStressByStrain), {
    strainValues,
    calciumValues,
    finalStressByStrain: finalStressByStrain.flat(),
    trajectoryComplete,
    failedTrajectoryCount: finalStressRunsByStrain.flat().filter((metric) => !metric.ok).length,
    monotonic,
  });
}

function runSyntheticTwitchSection(): Land2017ProtocolSection {
  const run = runTwitchAtStrain(0);
  const metrics = twitchShapeMetrics(run.samples);
  return section("synthetic-isometric-twitch-shape", run.ok && finiteMetricRecord(metrics), metrics);
}

function runLengthStepSection(): Land2017ProtocolSection {
  const positive = runTrajectory("positive-length-step", 0.08, 0.001, (timeSec) => ({
    freeCalciumUM: 1.2,
    strain: timeSec < 0.02 ? 0 : 0.03,
  }));
  const negative = runTrajectory("negative-length-step", 0.08, 0.001, (timeSec) => ({
    freeCalciumUM: 1.2,
    strain: timeSec < 0.02 ? 0.03 : 0,
  }));
  return section("rapid-length-step-positive-negative", positive.ok && negative.ok, {
    positivePeakPa: peakStress(positive.samples),
    negativePeakPa: peakStress(negative.samples),
    projectionUsed: hasProjection(positive) || hasProjection(negative),
  });
}

function runConstantVelocitySection(): Land2017ProtocolSection {
  const velocities = [-0.6, -0.3, 0, 0.3];
  const stressMetrics = velocities.map((velocity) => constantVelocityMeanStressMetric(velocity));
  const stresses = stressMetrics.map((metric) => metric.value);
  const trajectoryComplete = stressMetrics.every((metric) => metric.ok);
  return section("constant-velocity-shortening-family", trajectoryComplete && stresses.every(Number.isFinite), {
    velocitiesPerSec: velocities,
    meanStressPa: stresses,
    trajectoryComplete,
    failedTrajectoryCount: stressMetrics.filter((metric) => !metric.ok).length,
  });
}

function runForceVelocitySection(): Land2017ProtocolSection {
  const velocities = [-0.8, -0.4, 0, 0.4];
  const stressMetrics = velocities.map((velocity) => constantVelocityMeanStressMetric(velocity));
  const forceVelocityStressPa = stressMetrics.map((metric) => metric.value);
  const trajectoryComplete = stressMetrics.every((metric) => metric.ok);
  return section("force-velocity-sweep-report", trajectoryComplete && forceVelocityStressPa.every(Number.isFinite), {
    velocitiesPerSec: velocities,
    forceVelocityStressPa,
    trajectoryComplete,
    failedTrajectoryCount: stressMetrics.filter((metric) => !metric.ok).length,
    curveReportOnly: true,
  });
}

function runLengthDependentTwitchSection(): Land2017ProtocolSection {
  const strains = [0, 0.04, 0.08];
  const runs = strains.map((strain) => runTwitchAtStrain(strain));
  const peaks = runs.map((run) => peakStress(run.samples));
  const trajectoryComplete = runs.every((run) => run.ok);
  return section("length-dependent-twitch-prolongation-smoke", trajectoryComplete && peaks.every(Number.isFinite) && isNonDecreasing(peaks, 1e-6), {
    strains,
    peakStressPa: peaks,
    trajectoryComplete,
    failedTrajectoryCount: runs.filter((run) => !run.ok).length,
    metricsOnly: true,
  });
}

function runPrescribedShorteningSection(): Land2017ProtocolSection {
  const run = runTrajectory("prescribed-shortening-replay", 0.12, 0.001, (timeSec) => ({
    freeCalciumUM: twitchCalcium(timeSec),
    strain: 0.04 - 0.03 * Math.sin(Math.PI * Math.min(timeSec / 0.12, 1)),
  }));
  return section("prescribed-shortening-replay-synthetic-v1", run.ok, {
    peakStressPa: peakStress(run.samples),
    finalStressPa: finalStress(run),
    trajectoryDescriptor: "synthetic-half-sine-shortening-v1",
  });
}

function runStateConservationSection(): Land2017ProtocolSection {
  const runs = [runTwitchAtStrain(0), runTwitchAtStrain(0.06)];
  const minPopulations = runs.flatMap((run) => run.samples.map((sample) => sample.minimumPopulation));
  const conservationResiduals = runs.flatMap((run) => run.samples.map((sample) => sample.stateConservationResidual));
  const minPopulation = minPopulations.length > 0 ? Math.min(...minPopulations) : Number.NaN;
  const maxConservationResidual =
    conservationResiduals.length > 0 ? Math.max(...conservationResiduals) : Number.NaN;
  return section("state-conservation-positivity-report", runs.every((run) => run.ok) && minPopulation >= -1e-10, {
    minimumPopulation: minPopulation,
    maxConservationResidual,
    projectionUsed: runs.some(hasProjection),
  });
}

function runDtConvergenceSection(): Land2017ProtocolSection {
  const dtValuesSec = [0.001, 0.0005, 0.00025];
  const runs = dtValuesSec.map((dtSec) =>
    runTrajectory("dt-convergence", 0.02, dtSec, () => ({
      freeCalciumUM: 1.1,
      strain: 0.02,
    })),
  );
  const finalStresses = runs.map(finalStress);
  const trajectoryComplete = runs.every((run) => run.ok);
  const fine = finalStresses[2];
  const coarseError = Math.abs(finalStresses[0] - fine);
  const midError = Math.abs(finalStresses[1] - fine);
  const monotoneSelfConsistency = midError <= Math.max(coarseError * 1.2, 1e-9);
  return section("dt-convergence-be-source-v1", trajectoryComplete && finalStresses.every(Number.isFinite) && monotoneSelfConsistency, {
    dtValuesSec,
    finalStressPa: finalStresses,
    coarseErrorPa: coarseError,
    midErrorPa: midError,
    trajectoryComplete,
    failedTrajectoryCount: runs.filter((run) => !run.ok).length,
    monotoneSelfConsistency,
  });
}

function runStabilizationSourceSection(): Land2017ProtocolSection {
  const input = representativeStepInput();
  const state = representativeState();
  const stiffness = computeLand2017ActiveStiffnessPa(state, {
    fiberEngineeringStrain: input.stageFiberEngineeringStrain,
  });
  return section("active-stiffness-provenance-v1", Number.isFinite(stiffness) && stiffness > 0, {
    stiffnessPa: stiffness,
    sourceId: LAND2017_ACTIVE_STIFFNESS_PROVENANCE.sourceId,
    persistentId: LAND2017_ACTIVE_STIFFNESS_PROVENANCE.persistentId,
    location: LAND2017_ACTIVE_STIFFNESS_PROVENANCE.location,
  });
}

function runAlgorithmicTangentSection(): Land2017ProtocolSection {
  const previous = representativeState();
  const input = representativeStepInput();
  let solved: ReturnType<typeof evaluateLand2017SolvedStepWithTangents>;
  try {
    solved = evaluateLand2017SolvedStepWithTangents(previous, input, DEFAULT_SOLVE_OPTIONS);
  } catch (error) {
    return section("algorithmic-tangent-resolved-fd-v1", false, {
      failureReason: "tangent-compute-error",
      failureMessage: (error as Error).message,
    });
  }
  if (!solved.ok || !solved.output) {
    return section("algorithmic-tangent-resolved-fd-v1", false, { failureReason: solved.failureReason ?? "unknown" });
  }
  const algorithmic = solved.output.algorithmicTangentPa ?? Number.NaN;
  const frozen = solved.output.frozenStateTangentPa ?? Number.NaN;
  const stabilization = solved.output.stabilizationStiffnessPa;
  const distinct =
    Math.abs(algorithmic - frozen) > 1e-6 &&
    Math.abs(algorithmic - stabilization) > 1e-6 &&
    Math.abs(frozen - stabilization) > 1e-6;
  return section("algorithmic-tangent-resolved-fd-v1", [algorithmic, frozen, stabilization].every(Number.isFinite) && distinct, {
    algorithmicTangentPa: algorithmic,
    frozenStateTangentPa: frozen,
    stabilizationStiffnessPa: stabilization,
    valuesDistinct: distinct,
  });
}

function runDeterminismSection(): Land2017ProtocolSection {
  const firstRun = runTwitchAtStrain(0.04);
  const secondRun = runTwitchAtStrain(0.04);
  const first = compactRun(firstRun);
  const second = compactRun(secondRun);
  const firstHash = stableHash(sanitizeForStableHash(first));
  const secondHash = stableHash(sanitizeForStableHash(second));
  const trajectoryComplete = firstRun.ok && secondRun.ok;
  return section("deterministic-reproducibility-v1", trajectoryComplete && firstHash === secondHash, {
    firstHash,
    secondHash,
    trajectoryComplete,
    deterministic: firstHash === secondHash,
  });
}

function runTwitchAtStrain(strain: number): TrajectoryRun {
  return runTrajectory("synthetic-twitch", 0.16, 0.001, (timeSec) => ({
    freeCalciumUM: twitchCalcium(timeSec),
    strain,
  }));
}

function constantVelocityMeanStressMetric(velocityPerSec: number): ScalarRunMetric {
  const run = runTrajectory("constant-velocity", 0.05, 0.001, (timeSec) => ({
    freeCalciumUM: 1.2,
    strain: 0.02 + velocityPerSec * timeSec,
  }));
  const lastHalf = run.samples.slice(Math.floor(run.samples.length / 2));
  const value =
    lastHalf.length > 0
      ? lastHalf.reduce((sum, sample) => sum + sample.stressPa, 0) / lastHalf.length
      : Number.NaN;
  return { ok: run.ok, value, failureReason: run.failureReason };
}

function runTrajectory(
  _id: string,
  durationSec: number,
  dtSec: number,
  trajectory: (timeSec: number) => TrajectoryPoint,
): TrajectoryRun {
  let state = Float64Array.from(DEFAULT_INITIAL_STATE);
  const samples: TrajectorySample[] = [];
  let previous = trajectory(0);
  const steps = Math.max(1, Math.round(durationSec / dtSec));

  for (let step = 1; step <= steps; step += 1) {
    const timeSec = step * dtSec;
    const current = trajectory(timeSec);
    const input: LandStepInput = {
      freeCalciumUM: current.freeCalciumUM,
      previousFiberEngineeringStrain: previous.strain,
      stageFiberEngineeringStrain: current.strain,
      dtSec,
      stage: { scheme: "BE", stageIndex: 0 },
    };
    const solved = solveLand2017BackwardEulerSubsteps(
      state,
      input,
      { ...DEFAULT_SOLVE_OPTIONS, previousFreeCalciumUM: previous.freeCalciumUM },
    );
    if (!solved.ok || !solved.output) {
      return {
        ok: false,
        samples,
        finalState: state,
        failureReason: solved.failureReason ?? "unknown",
      };
    }
    state = solved.nextState;
    samples.push({
      timeSec,
      stressPa: solved.output.sourceActiveFiberStressPa,
      minimumPopulation: solved.output.health.minimumPopulation,
      stateConservationResidual: solved.output.health.stateConservationResidual,
      projectionUsed: solved.output.health.projectionUsed,
    });
    previous = current;
  }

  return { ok: true, samples, finalState: state };
}

function twitchCalcium(timeSec: number): number {
  const riseTau = 0.018;
  const decayTau = 0.07;
  const activation = timeSec <= 0 ? 0 : (timeSec / riseTau) * Math.exp(1 - timeSec / riseTau);
  return 0.12 + 1.1 * Math.max(0, activation) * Math.exp(-timeSec / decayTau);
}

function twitchShapeMetrics(samples: readonly TrajectorySample[]): Record<string, number | boolean> {
  const stress = samples.map((sample) => sample.stressPa);
  const times = samples.map((sample) => sample.timeSec);
  const peak = Math.max(...stress);
  const peakIndex = stress.indexOf(peak);
  const baseline = stress[0] ?? 0;
  return {
    peakStressPa: peak,
    timeToPeakMs: (times[peakIndex] ?? 0) * 1000,
    fwhmMs: widthAtFractionMs(times, stress, baseline, peak, 0.5),
    width80Ms: widthAtFractionMs(times, stress, baseline, peak, 0.8),
    width90Ms: widthAtFractionMs(times, stress, baseline, peak, 0.9),
    relaxation50Ms: relaxationAfterPeakMs(times, stress, baseline, peak, peakIndex, 0.5),
    metricsOnly: true,
  };
}

function widthAtFractionMs(
  times: readonly number[],
  values: readonly number[],
  baseline: number,
  peak: number,
  fraction: number,
): number {
  const threshold = baseline + fraction * (peak - baseline);
  const indices = values.flatMap((value, index) => (value >= threshold ? [index] : []));
  if (indices.length === 0) return 0;
  return ((times[indices[indices.length - 1]] ?? 0) - (times[indices[0]] ?? 0)) * 1000;
}

function relaxationAfterPeakMs(
  times: readonly number[],
  values: readonly number[],
  baseline: number,
  peak: number,
  peakIndex: number,
  fraction: number,
): number {
  const threshold = baseline + fraction * (peak - baseline);
  for (let index = peakIndex; index < values.length; index += 1) {
    if (values[index] <= threshold) return ((times[index] ?? 0) - (times[peakIndex] ?? 0)) * 1000;
  }
  return ((times[times.length - 1] ?? times[peakIndex] ?? 0) - (times[peakIndex] ?? 0)) * 1000;
}

function section(
  id: string,
  ok: boolean,
  metrics: Record<string, number | string | boolean | readonly number[]>,
): Land2017ProtocolSection {
  return {
    id,
    status: ok ? "closure-pass" : "closure-fail",
    metrics,
  };
}

function finalStress(run: TrajectoryRun): number {
  return run.samples[run.samples.length - 1]?.stressPa ?? Number.NaN;
}

function peakStress(samples: readonly TrajectorySample[]): number {
  if (samples.length === 0) return Number.NaN;
  return Math.max(...samples.map((sample) => sample.stressPa));
}

function hasProjection(run: TrajectoryRun): boolean {
  return run.samples.some((sample) => sample.projectionUsed);
}

function allNestedFinite(values: readonly (readonly number[])[]): boolean {
  return values.every((row) => row.every(Number.isFinite));
}

function isNonDecreasing(values: readonly number[], tolerance: number): boolean {
  return values.every((value, index) => index === 0 || value + tolerance >= values[index - 1]);
}

function finiteMetricRecord(metrics: Record<string, number | boolean>): boolean {
  return Object.values(metrics).every((value) => typeof value !== "number" || Number.isFinite(value));
}

function compactRun(run: TrajectoryRun): unknown {
  return {
    ok: run.ok,
    samples: run.samples.map((sample) => ({
      timeSec: round(sample.timeSec),
      stressPa: round(sample.stressPa),
      minimumPopulation: round(sample.minimumPopulation),
      stateConservationResidual: round(sample.stateConservationResidual),
      projectionUsed: sample.projectionUsed,
    })),
    finalState: Array.from(run.finalState).map(round),
    failureReason: run.failureReason,
  };
}

function representativeState(): Float64Array {
  return Float64Array.from([0.55, 0.12, 0.08, 0.04, 0.06, 0.12]);
}

function representativeStepInput(): LandStepInput {
  return {
    freeCalciumUM: 0.92,
    previousFiberEngineeringStrain: 0.015,
    stageFiberEngineeringStrain: 0.02,
    dtSec: 0.0002,
    stage: { scheme: "BE", stageIndex: 0 },
  };
}

function round(value: number): number {
  return Math.round(value * 1e12) / 1e12;
}

function sanitizeForStableHash(value: unknown): unknown {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : String(value);
  }
  if (Array.isArray(value)) return value.map(sanitizeForStableHash);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, child]) => [key, sanitizeForStableHash(child)]),
    );
  }
  return value;
}
