import {
  createMainWireScientificSessionV1,
} from "@/engine/scientific/runtime";
import {
  sha256CanonicalJsonHex,
} from "@/engine/scientific/release";
import {
  HOT_PATH_INTEGRITY_TIERS_V1,
  hotPathIntegrityTierV1,
  selectHotPathIntegrityTierV1,
  type HotPathIntegrityTierV1,
} from "@/engine/hotPathIntegrityTierV1";

selectHotPathIntegrityTierV1(integrityTierArgument());

const dtSec = numericArgument("--dt", 0.002);
const beatCount = integerArgument("--beats", 1);
const warmupBeatCount = nonnegativeIntegerArgument("--warmup-beats", 0);
const stepsPerBeat = Math.round(1 / dtSec);
if (Math.abs(stepsPerBeat * dtSec - 1) > 1e-12) {
  throw new Error("dt must divide the fixed one-second cycle exactly");
}

const processStartMs = performance.now();
const session = await createMainWireScientificSessionV1();
const initializationCompletedMs = performance.now();
const requestedWarmupStepCount = warmupBeatCount * stepsPerBeat;
for (let stepIndex = 0; stepIndex < requestedWarmupStepCount; stepIndex += 1) {
  const stepped = session.step(dtSec);
  if (stepped.converged === false) {
    throw new Error(
      `scientific session warmup failed after ${stepIndex} steps: `
        + stepped.message,
    );
  }
}
const warmupCompletedMs = performance.now();
const requestedStepCount = beatCount * stepsPerBeat;
const stepWallClockMs: number[] = [];
const mechanicsIterations: number[] = [];
const mechanicsCallbackCounts: number[] = [];
const mechanicsCallbackCacheHits: number[] = [];
const circulationResiduals: number[] = [];
const observationTrajectory: unknown[] = [];
const diagnosticsTrajectory: unknown[] = [];
for (let stepIndex = 0; stepIndex < requestedStepCount; stepIndex += 1) {
  const stepStartedMs = performance.now();
  const stepped = session.step(dtSec);
  stepWallClockMs.push(performance.now() - stepStartedMs);
  if (stepped.converged === false) {
    throw new Error(
      `scientific session benchmark failed after ${stepIndex} steps: `
        + stepped.message,
    );
  }
  const diagnostics = stepped.observation.diagnostics;
  observationTrajectory.push(stepped.observation);
  diagnosticsTrajectory.push(diagnostics);
  pushFinite(mechanicsIterations, diagnostics.mechanicsIterations);
  pushFinite(mechanicsCallbackCounts, diagnostics.mechanicsCallbackCount);
  pushFinite(
    mechanicsCallbackCacheHits,
    diagnostics.mechanicsCallbackCacheHits,
  );
  pushFinite(
    circulationResiduals,
    diagnostics.circulationScaledResidualInfinityNorm,
  );
}
const runCompletedMs = performance.now();
const [observationTrajectorySha256, diagnosticsTrajectorySha256, checkpoint] =
  await Promise.all([
    sha256CanonicalJsonHex(observationTrajectory),
    sha256CanonicalJsonHex(diagnosticsTrajectory),
    session.checkpointExactV3(),
  ]);

const initializationMs = initializationCompletedMs - processStartMs;
const warmupMs = warmupCompletedMs - initializationCompletedMs;
const integrationMs = runCompletedMs - warmupCompletedMs;
console.log(JSON.stringify({
  benchmarkId: "main-wire-scientific-session-v1-wall-clock-smoke",
  benchmarkLabel: process.env.CIRCLEHEART_BENCHMARK_LABEL ?? null,
  role: "measurement-only-no-performance-acceptance-claim",
  hotPathIntegrityTier: hotPathIntegrityTierV1(),
  dtSec,
  beatCount,
  warmupBeatCount,
  stepsPerBeat,
  requestedWarmupStepCount,
  requestedStepCount,
  initializationMs,
  warmupMs,
  integrationMs,
  totalMs: runCompletedMs - processStartMs,
  integrationStepsPerSecond: requestedStepCount / (integrationMs / 1000),
  stepWallClockMs: distribution(stepWallClockMs),
  mechanicsIterations: distribution(mechanicsIterations),
  mechanicsCallbackCounts: distribution(mechanicsCallbackCounts),
  mechanicsCallbackCacheHits: distribution(mechanicsCallbackCacheHits),
  circulationScaledResidualInfinityNorm: distribution(circulationResiduals),
  observationTrajectorySha256,
  diagnosticsTrajectorySha256,
  finalExactCheckpointSha256: checkpoint.checkpointSha256,
  finalState: session.stateIdentity(),
}, null, 2));

type Distribution = Readonly<{
  count: number;
  minimum: number | null;
  p50: number | null;
  p95: number | null;
  maximum: number | null;
  mean: number | null;
}>;

function distribution(source: readonly number[]): Distribution {
  if (source.length === 0) {
    return Object.freeze({
      count: 0,
      minimum: null,
      p50: null,
      p95: null,
      maximum: null,
      mean: null,
    });
  }
  const sorted = [...source].sort((left, right) => left - right);
  return Object.freeze({
    count: sorted.length,
    minimum: sorted[0]!,
    p50: quantile(sorted, 0.5),
    p95: quantile(sorted, 0.95),
    maximum: sorted.at(-1)!,
    mean: sorted.reduce((sum, value) => sum + value, 0) / sorted.length,
  });
}

function quantile(sorted: readonly number[], fraction: number): number {
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil(sorted.length * fraction) - 1),
  );
  return sorted[index]!;
}

function pushFinite(target: number[], value: number | null): void {
  if (value !== null && Number.isFinite(value)) target.push(value);
}

/**
 * Selects the hot-path integrity tier for this measurement. The default is the
 * full-invariant tier, so an unqualified run measures the same code every
 * harness and every test runs. `--integrity hot-path-lean` measures what the
 * live simulation Worker runs. The two tiers are pinned equal by
 * `__tests__/hotPathIntegrityTierV1.test.ts`; the trajectory hashes this
 * benchmark prints are the same comparison, one run at a time.
 */
function integrityTierArgument(): HotPathIntegrityTierV1 {
  const index = process.argv.indexOf("--integrity");
  if (index < 0) return "full-invariant";
  const value = process.argv[index + 1];
  if (
    value === undefined
    || !HOT_PATH_INTEGRITY_TIERS_V1.includes(value as HotPathIntegrityTierV1)
  ) {
    throw new Error(
      `--integrity must be one of ${HOT_PATH_INTEGRITY_TIERS_V1.join(", ")}`,
    );
  }
  return value as HotPathIntegrityTierV1;
}

function numericArgument(name: string, fallback: number): number {
  const index = process.argv.indexOf(name);
  const value = index < 0 ? fallback : Number(process.argv[index + 1]);
  if (!(value > 0) || !Number.isFinite(value)) {
    throw new Error(`${name} must be a positive finite number`);
  }
  return value;
}

function integerArgument(name: string, fallback: number): number {
  const value = numericArgument(name, fallback);
  if (!Number.isSafeInteger(value)) {
    throw new Error(`${name} must be a positive safe integer`);
  }
  return value;
}

function nonnegativeIntegerArgument(name: string, fallback: number): number {
  const index = process.argv.indexOf(name);
  const value = index < 0 ? fallback : Number(process.argv[index + 1]);
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${name} must be a nonnegative safe integer`);
  }
  return value;
}
