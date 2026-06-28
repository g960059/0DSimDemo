import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import localizationArtifact from "@/data/myocardium/protocols/atrial-bridge-blocker-localization-phase5p5b-result-v1.json";
import { ModelCore, defaultParams } from "@/engine/ModelCore";
import { measureSteady } from "@/engine/measure";
import type { CoreRuntimeParams, HeartModelMode, SimSample } from "@/engine/protocol";
import { DEFAULT_SETTLE_POLICY, type SettlePolicy } from "@/engine/settling";
import type { AtrialBridgeBlockerLocalizationEvidence } from "@/tools/myocardium/buildAtrialBridgeBlockerLocalization";

export const ATRIAL_BRIDGE_RUNTIME_BASELINE_EVIDENCE_ID =
  "atrial-bridge-high-hr-runtime-baseline-phase5p5c-result-v1";

export const ATRIAL_BRIDGE_RUNTIME_BASELINE_RESULT_PATH =
  "data/myocardium/protocols/atrial-bridge-high-hr-runtime-baseline-phase5p5c-result-v1.json";

type AtrialChamber = "LA" | "RA";
type Valve = "MV" | "TV";

export type AtrialBridgeHighHrRuntimeBaselineEvidence = {
  readonly schemaVersion: 1;
  readonly id: typeof ATRIAL_BRIDGE_RUNTIME_BASELINE_EVIDENCE_ID;
  readonly phase: "Phase 5.5C";
  readonly claimBoundary: "diagnostic-runtime-boundary-baseline-only";
  readonly sourceLocalization: "data/myocardium/protocols/atrial-bridge-blocker-localization-phase5p5b-result-v1.json";
  readonly verifierScript: "verify:myocardium-atrial-bridge-runtime-baseline";
  readonly protocol: {
    readonly baselineIds: readonly AtrialBridgeRuntimeBaselineId[];
    readonly highHrSweepPoints: readonly AtrialBridgeRuntimeBaselinePoint[];
    readonly dtSec: number;
    readonly sampleHz: number;
    readonly tailWindowBeats: number;
    readonly measureBeats: number;
    readonly settlePolicy: Pick<SettlePolicy, "tolPrimary" | "tolShape" | "consecutiveBeats" | "minBeats" | "capSeconds" | "postSettleBeats">;
    readonly noExperimentalAtrialProviderForStockActive: true;
    readonly globalElastanceChangesWholeHeart: true;
  };
  readonly baselineRuns: readonly AtrialBridgeRuntimeBaselineRun[];
  readonly comparisonToPhase5p5b: {
    readonly sourceLocalizationEvidenceId: string;
    readonly sourceLocalizationPhase: string;
    readonly a0ExperimentalHr90Settled: boolean;
    readonly a0ExperimentalHr90SettleReason: string;
    readonly a0ExperimentalHr105Settled: boolean;
    readonly a0ExperimentalHr105SettleReason: string;
    readonly stockActiveHr90Settled: boolean;
    readonly stockActiveHr105Settled: boolean;
    readonly hr105BoundaryInterpretation:
      | "shared-stock-active-runtime-boundary-supported"
      | "experimental-provider-specific-boundary-supported"
      | "mixed-or-unresolved";
  };
  readonly summary: {
    readonly stockActiveNoProviderHr105Status: "settled" | "cap" | "other";
    readonly stockActiveNoProviderHr90Status: "settled" | "cap" | "other";
    readonly globalElastanceHr105Status: "settled" | "cap" | "other";
    readonly highHrBoundaryAttribution: "runtime-boundary-likely" | "provider-specific-likely" | "unresolved";
    readonly selectedCandidateId: null;
    readonly recommendedCandidateId: null;
    readonly rationale: readonly string[];
    readonly blockers: readonly string[];
  };
  readonly boundary: {
    readonly noProductionRuntimeWiring: true;
    readonly noOfficialCaseReauthoring: true;
    readonly noWorkbenchRuntimeWiring: true;
    readonly noStateSchemaMigration: true;
    readonly noAtrialLandRdqClaim: true;
    readonly noAfValidationClaim: true;
    readonly noFinalAtrialPhysiologyClaim: true;
    readonly noMorphologyAcceptance: true;
  };
  readonly nextAllowedWork: readonly string[];
  readonly doesNotUnlock: readonly string[];
};

export type AtrialBridgeRuntimeBaselineId =
  | "stock-active-no-provider-v0"
  | "global-elastance-mode-v0";

export type AtrialBridgeRuntimeBaselinePoint = {
  readonly id: "normal-hr75-reference" | "normal-hr90" | "normal-hr105";
  readonly targetTBVMl: number;
  readonly HR: number;
};

export type AtrialBridgeRuntimeBaselineRun = {
  readonly protocolId: "runtime-baseline-high-hr-sweep-v1";
  readonly baselineId: AtrialBridgeRuntimeBaselineId;
  readonly heartModel: HeartModelMode;
  readonly experimentalAtrialProvider: false;
  readonly targetTBVMl: number;
  readonly HR: number;
  readonly sweepPointId: AtrialBridgeRuntimeBaselinePoint["id"];
  readonly settled: boolean;
  readonly settleReason: string;
  readonly settleActualSeconds: number | null;
  readonly settleBeats: number;
  readonly periodBeats: number;
  readonly worstSignal: string | null;
  readonly worstDelta: number | null;
  readonly adjacentDelta: number | null;
  readonly periodDelta: number | null;
  readonly healthStatus: string;
  readonly healthMessages: readonly string[];
  readonly window: AtrialBridgeRuntimeBaselineWindow;
};

export type AtrialBridgeRuntimeBaselineWindow = {
  readonly windowKind: "settled-measure-window" | "cap-tail-window";
  readonly windowBeats: number;
  readonly sampleCount: number;
  readonly simulatedSeconds: number;
  readonly forwardCO_L: number | null;
  readonly forwardCO_R: number | null;
  readonly LAPMean: number | null;
  readonly RAPMean: number | null;
  readonly LA: AtrialBridgeRuntimeBaselineLoopMetrics | null;
  readonly RA: AtrialBridgeRuntimeBaselineLoopMetrics | null;
  readonly valveAttribution: Record<Valve, AtrialBridgeRuntimeBaselineValveAttribution>;
};

export type AtrialBridgeRuntimeBaselineLoopMetrics = {
  readonly pressureMeanMmHg: number;
  readonly pressureMinMmHg: number;
  readonly pressureMaxMmHg: number;
  readonly volumeMinMl: number;
  readonly volumeMaxMl: number;
  readonly beatRepeatabilityDelta: number | null;
};

export type AtrialBridgeRuntimeBaselineValveAttribution = {
  readonly hitSamples: number;
  readonly hitFraction: number;
  readonly hitsPerBeat: number;
  readonly hitsPerSecond: number;
  readonly diodeImpulseSum: number;
  readonly diodeImpulseMax: number;
  readonly qDotClampHitFraction: number;
};

type WindowSample = {
  readonly t: number;
  readonly phi: number;
  readonly LA: { readonly volumeMl: number; readonly pressureMmHg: number };
  readonly RA: { readonly volumeMl: number; readonly pressureMmHg: number };
};

const localization = localizationArtifact as unknown as AtrialBridgeBlockerLocalizationEvidence;

const BASELINES: readonly AtrialBridgeRuntimeBaselineId[] = [
  "stock-active-no-provider-v0",
  "global-elastance-mode-v0",
] as const;

const POINTS: readonly AtrialBridgeRuntimeBaselinePoint[] = [
  { id: "normal-hr75-reference", targetTBVMl: 5600, HR: 75 },
  { id: "normal-hr90", targetTBVMl: 5600, HR: 90 },
  { id: "normal-hr105", targetTBVMl: 5600, HR: 105 },
] as const;

const DT_SEC = 0.001;
const SAMPLE_HZ = 480;
const TAIL_WINDOW_BEATS = 4;
const MEASURE_BEATS = 3;
const SETTLE_POLICY: SettlePolicy = {
  ...DEFAULT_SETTLE_POLICY,
  capSeconds: 120,
  postSettleBeats: 2,
};

export function buildAtrialBridgeHighHrRuntimeBaselineEvidence(): AtrialBridgeHighHrRuntimeBaselineEvidence {
  const baselineRuns = BASELINES.flatMap((baselineId) =>
    POINTS.map((point) => runBaseline(baselineId, point))
  );
  const comparisonToPhase5p5b = buildComparisonToPhase5p5b(baselineRuns);
  const summary = buildSummary(baselineRuns, comparisonToPhase5p5b);

  return {
    schemaVersion: 1,
    id: ATRIAL_BRIDGE_RUNTIME_BASELINE_EVIDENCE_ID,
    phase: "Phase 5.5C",
    claimBoundary: "diagnostic-runtime-boundary-baseline-only",
    sourceLocalization: "data/myocardium/protocols/atrial-bridge-blocker-localization-phase5p5b-result-v1.json",
    verifierScript: "verify:myocardium-atrial-bridge-runtime-baseline",
    protocol: {
      baselineIds: BASELINES,
      highHrSweepPoints: POINTS,
      dtSec: DT_SEC,
      sampleHz: SAMPLE_HZ,
      tailWindowBeats: TAIL_WINDOW_BEATS,
      measureBeats: MEASURE_BEATS,
      settlePolicy: {
        tolPrimary: SETTLE_POLICY.tolPrimary,
        tolShape: SETTLE_POLICY.tolShape,
        consecutiveBeats: SETTLE_POLICY.consecutiveBeats,
        minBeats: SETTLE_POLICY.minBeats,
        capSeconds: SETTLE_POLICY.capSeconds,
        postSettleBeats: SETTLE_POLICY.postSettleBeats,
      },
      noExperimentalAtrialProviderForStockActive: true,
      globalElastanceChangesWholeHeart: true,
    },
    baselineRuns,
    comparisonToPhase5p5b,
    summary,
    boundary: {
      noProductionRuntimeWiring: true,
      noOfficialCaseReauthoring: true,
      noWorkbenchRuntimeWiring: true,
      noStateSchemaMigration: true,
      noAtrialLandRdqClaim: true,
      noAfValidationClaim: true,
      noFinalAtrialPhysiologyClaim: true,
      noMorphologyAcceptance: true,
    },
    nextAllowedWork: [
      "use oracle broad direction review after this PR group before Phase 6 bridge selection",
      "if stock-active no-provider also caps at HR105, treat HR105 as a shared runtime/settling boundary before tuning atrial bridge candidates",
      "if stock-active no-provider settles at HR105, localize experimental-provider lifecycle or candidate-specific causes before Phase 6 selection",
      "keep morphology diagnostics separate and diagnostic-only until morphology lane timing is appropriate",
    ],
    doesNotUnlock: [
      "Phase 6 bridge selection",
      "production atrial bridge wiring",
      "official case reauthoring",
      "Workbench runtime wiring",
      "state schema migration",
      "atrial Land/RDQ validation",
      "AF validation",
      "final atrial physiology acceptance",
    ],
  };
}

function runBaseline(
  baselineId: AtrialBridgeRuntimeBaselineId,
  point: AtrialBridgeRuntimeBaselinePoint,
): AtrialBridgeRuntimeBaselineRun {
  const heartModel: HeartModelMode = baselineId === "global-elastance-mode-v0"
    ? "elastance"
    : "activeStress";
  const params: Partial<CoreRuntimeParams> = {
    ...defaultParams(),
    HR: point.HR,
    heartModel,
  };
  const core = new ModelCore(params);
  core.initializeVenousPressuresForTargetTBV(point.targetTBVMl);
  const settleStatus = core.settleToSteady(SETTLE_POLICY, DT_SEC, SAMPLE_HZ);
  const health = core.health();
  const window = settleStatus.settled && settleStatus.actualSeconds != null
    ? settledWindow(core, settleStatus as typeof settleStatus & { actualSeconds: number }, point.HR)
    : capTailWindow(core, point.HR);

  return {
    protocolId: "runtime-baseline-high-hr-sweep-v1",
    baselineId,
    heartModel,
    experimentalAtrialProvider: false,
    targetTBVMl: point.targetTBVMl,
    HR: point.HR,
    sweepPointId: point.id,
    settled: settleStatus.settled,
    settleReason: settleStatus.reason,
    settleActualSeconds: finiteOrNull(settleStatus.actualSeconds),
    settleBeats: settleStatus.beats,
    periodBeats: settleStatus.periodBeats,
    worstSignal: settleStatus.worstSignal,
    worstDelta: finiteOrNull(settleStatus.worstDelta),
    adjacentDelta: finiteOrNull(settleStatus.adjacentDelta),
    periodDelta: finiteOrNull(settleStatus.periodDelta),
    healthStatus: health.status,
    healthMessages: health.messages,
    window,
  };
}

function buildComparisonToPhase5p5b(
  runs: readonly AtrialBridgeRuntimeBaselineRun[],
): AtrialBridgeHighHrRuntimeBaselineEvidence["comparisonToPhase5p5b"] {
  if (
    localization.id !== "atrial-bridge-blocker-localization-phase5p5b-result-v1"
    || localization.phase !== "Phase 5.5B"
  ) {
    throw new Error(`Unexpected Phase 5.5B localization source: ${localization.id}/${localization.phase}`);
  }
  const a0Hr90 = requireLocalizationRun("legacy-atrial-active-bridge-v0", "normal-hr90");
  const a0Hr105 = requireLocalizationRun("legacy-atrial-active-bridge-v0", "normal-hr105");
  const stockHr90 = requireBaselineRun(runs, "stock-active-no-provider-v0", "normal-hr90");
  const stockHr105 = requireBaselineRun(runs, "stock-active-no-provider-v0", "normal-hr105");
  const a0ExperimentalHr105Settled = a0Hr105.settled === true;
  const stockActiveHr105Settled = stockHr105.settled === true;
  const hr105BoundaryInterpretation = !a0ExperimentalHr105Settled && !stockActiveHr105Settled
    ? "shared-stock-active-runtime-boundary-supported"
    : !a0ExperimentalHr105Settled && stockActiveHr105Settled
      ? "experimental-provider-specific-boundary-supported"
      : "mixed-or-unresolved";
  return {
    sourceLocalizationEvidenceId: localization.id,
    sourceLocalizationPhase: localization.phase,
    a0ExperimentalHr90Settled: a0Hr90.settled === true,
    a0ExperimentalHr90SettleReason: a0Hr90.settleReason,
    a0ExperimentalHr105Settled,
    a0ExperimentalHr105SettleReason: a0Hr105.settleReason,
    stockActiveHr90Settled: stockHr90.settled === true,
    stockActiveHr105Settled,
    hr105BoundaryInterpretation,
  };
}

function requireLocalizationRun(
  candidateId: "legacy-atrial-active-bridge-v0",
  sweepPointId: "normal-hr90" | "normal-hr105",
) {
  const run = localization.highHrSweepRuns.find((item) =>
    item.candidateId === candidateId && item.sweepPointId === sweepPointId
  );
  if (!run) throw new Error(`Missing Phase 5.5B localization run: ${candidateId}/${sweepPointId}`);
  return run;
}

function requireBaselineRun(
  runs: readonly AtrialBridgeRuntimeBaselineRun[],
  baselineId: AtrialBridgeRuntimeBaselineId,
  pointId: AtrialBridgeRuntimeBaselinePoint["id"],
): AtrialBridgeRuntimeBaselineRun {
  const run = runs.find((item) => item.baselineId === baselineId && item.sweepPointId === pointId);
  if (!run) throw new Error(`Missing Phase 5.5C baseline run: ${baselineId}/${pointId}`);
  return run;
}

function buildSummary(
  runs: readonly AtrialBridgeRuntimeBaselineRun[],
  comparison: AtrialBridgeHighHrRuntimeBaselineEvidence["comparisonToPhase5p5b"],
): AtrialBridgeHighHrRuntimeBaselineEvidence["summary"] {
  const stockHr90 = statusFor(runs, "stock-active-no-provider-v0", "normal-hr90");
  const stockHr105 = statusFor(runs, "stock-active-no-provider-v0", "normal-hr105");
  const elastanceHr105 = statusFor(runs, "global-elastance-mode-v0", "normal-hr105");
  const highHrBoundaryAttribution =
    comparison.hr105BoundaryInterpretation === "shared-stock-active-runtime-boundary-supported"
      ? "runtime-boundary-likely"
      : comparison.hr105BoundaryInterpretation === "experimental-provider-specific-boundary-supported"
        ? "provider-specific-likely"
        : "unresolved";
  return {
    stockActiveNoProviderHr105Status: stockHr105,
    stockActiveNoProviderHr90Status: stockHr90,
    globalElastanceHr105Status: elastanceHr105,
    highHrBoundaryAttribution,
    selectedCandidateId: null,
    recommendedCandidateId: null,
    rationale: [
      "Phase 5.5C compares the experimental-provider high-HR boundary against stock ModelCore runtimes without selecting a bridge.",
      comparison.stockActiveHr105Settled
        ? "Stock active no-provider ModelCore settled at HR105/min, so the Phase 5.5B HR105 cap is more likely provider/candidate/lifecycle specific."
        : "Stock active no-provider ModelCore also capped at HR105/min, supporting a shared runtime/settling boundary rather than an atrial-bridge-specific failure.",
      comparison.stockActiveHr90Settled
        ? "Stock active no-provider ModelCore settled at HR90/min."
        : "Stock active no-provider ModelCore capped at HR90/min.",
      elastanceHr105 === "settled"
        ? "Global elastance mode settled at HR105/min, but it changes the whole-heart model and is reference-only."
        : "Global elastance mode did not settle at HR105/min; because it changes the whole-heart model, this is reference-only.",
    ],
    blockers: [
      "Phase 6 bridge selection remains owner/oracle gated.",
      "This baseline does not tune atrial candidates or relax settling criteria.",
      "Global elastance mode is a whole-heart comparator and cannot justify atrial bridge selection.",
      "Production/runtime/official case/Workbench/state schema wiring remain blocked.",
    ],
  };
}

function statusFor(
  runs: readonly AtrialBridgeRuntimeBaselineRun[],
  baselineId: AtrialBridgeRuntimeBaselineId,
  pointId: AtrialBridgeRuntimeBaselinePoint["id"],
): "settled" | "cap" | "other" {
  const run = runs.find((item) => item.baselineId === baselineId && item.sweepPointId === pointId);
  if (!run) return "other";
  if (run.settled) return "settled";
  return run.settleReason === "cap" ? "cap" : "other";
}

function settledWindow(
  core: ModelCore,
  settleStatus: ReturnType<ModelCore["settleToSteady"]> & { actualSeconds: number },
  HR: number,
): AtrialBridgeRuntimeBaselineWindow {
  const measured = measureSteady(core, settleStatus, {
    dt: DT_SEC,
    sampleHz: SAMPLE_HZ,
    measureBeats: MEASURE_BEATS,
    requireProjectorQuiet: false,
  });
  return windowMetrics(
    measured.samples,
    HR,
    "settled-measure-window",
    MEASURE_BEATS,
    measured.forwardCO_L,
    measured.forwardCO_R,
  );
}

function capTailWindow(core: ModelCore, HR: number): AtrialBridgeRuntimeBaselineWindow {
  const seconds = TAIL_WINDOW_BEATS * 60 / HR;
  const samples = core.runFor(seconds, DT_SEC, SAMPLE_HZ, { recordHistory: false });
  return windowMetrics(samples, HR, "cap-tail-window", TAIL_WINDOW_BEATS, null, null);
}

function windowMetrics(
  samples: readonly SimSample[],
  HR: number,
  windowKind: AtrialBridgeRuntimeBaselineWindow["windowKind"],
  windowBeats: number,
  forwardCO_L: number | null,
  forwardCO_R: number | null,
): AtrialBridgeRuntimeBaselineWindow {
  const windowSamples = samples.map((sample) => ({
    t: sample.t,
    phi: sample.phi,
    LA: { volumeMl: sample.VLA, pressureMmHg: sample.LAP },
    RA: { volumeMl: sample.VRA, pressureMmHg: sample.RAP },
  }));
  return {
    windowKind,
    windowBeats,
    sampleCount: samples.length,
    simulatedSeconds: round(samples.length > 1 ? samples.at(-1)!.t - samples[0].t : 0),
    forwardCO_L: finiteOrNull(forwardCO_L),
    forwardCO_R: finiteOrNull(forwardCO_R),
    LAPMean: finiteOrNull(mean(samples.map((sample) => sample.LAP))),
    RAPMean: finiteOrNull(mean(samples.map((sample) => sample.RAP))),
    LA: loopMetricsFromWindow(windowSamples, "LA"),
    RA: loopMetricsFromWindow(windowSamples, "RA"),
    valveAttribution: {
      MV: valveAttribution(samples, "MV", HR, windowBeats),
      TV: valveAttribution(samples, "TV", HR, windowBeats),
    },
  };
}

function loopMetricsFromWindow(
  samples: readonly WindowSample[],
  chamber: AtrialChamber,
): AtrialBridgeRuntimeBaselineLoopMetrics | null {
  if (samples.length < 8) return null;
  const pressures = samples.map((sample) => sample[chamber].pressureMmHg);
  const volumes = samples.map((sample) => sample[chamber].volumeMl);
  return {
    pressureMeanMmHg: round(mean(pressures)),
    pressureMinMmHg: round(Math.min(...pressures)),
    pressureMaxMmHg: round(Math.max(...pressures)),
    volumeMinMl: round(Math.min(...volumes)),
    volumeMaxMl: round(Math.max(...volumes)),
    beatRepeatabilityDelta: finiteOrNull(phaseResampledRepeatability(samples, chamber)),
  };
}

function valveAttribution(
  samples: readonly SimSample[],
  valve: Valve,
  HR: number,
  windowBeats: number,
): AtrialBridgeRuntimeBaselineValveAttribution {
  const hitValues = samples.map((sample) => valueAt(sample, `${valve}_diodeImpulse`) > 0 ? 1 : 0);
  const qDotHitValues = samples.map((sample) => valueAt(sample, `${valve}_qDotClampHit01`) > 0 ? 1 : 0);
  const impulses = samples.map((sample) => Math.max(0, valueAt(sample, `${valve}_diodeImpulse`)));
  const hitSamples = hitValues.reduce((sum, value) => sum + value, 0);
  const simulatedSeconds = windowBeats * 60 / HR;
  return {
    hitSamples,
    hitFraction: round(hitSamples / Math.max(samples.length, 1)),
    hitsPerBeat: round(hitSamples / Math.max(windowBeats, 1)),
    hitsPerSecond: round(hitSamples / Math.max(simulatedSeconds, 1e-9)),
    diodeImpulseSum: round(impulses.reduce((sum, value) => sum + value, 0)),
    diodeImpulseMax: round(Math.max(0, ...impulses)),
    qDotClampHitFraction: round(qDotHitValues.reduce((sum, value) => sum + value, 0) / Math.max(samples.length, 1)),
  };
}

function phaseResampledRepeatability(
  samples: readonly WindowSample[],
  chamber: AtrialChamber,
): number {
  const counts = new Map<number, number>();
  for (const sample of samples) {
    const beat = Math.floor(sample.phi);
    counts.set(beat, (counts.get(beat) ?? 0) + 1);
  }
  const maxCount = Math.max(0, ...counts.values());
  const beats = [...counts.entries()]
    .filter((entry) => entry[1] >= Math.max(16, 0.75 * maxCount))
    .map((entry) => entry[0])
    .sort((a, b) => a - b);
  if (beats.length < 2) return Number.NaN;
  const a = resampleBeat(samples, chamber, beats.at(-2)!);
  const b = resampleBeat(samples, chamber, beats.at(-1)!);
  if (a.length < 16 || b.length < 16 || a.length !== b.length) return Number.NaN;
  const pressureDelta = rmsRelativeDelta(
    a.map((point) => point.pressureMmHg),
    b.map((point) => point.pressureMmHg),
  );
  const volumeDelta = rmsRelativeDelta(
    a.map((point) => point.volumeMl),
    b.map((point) => point.volumeMl),
  );
  return Math.max(pressureDelta, volumeDelta);
}

function resampleBeat(
  samples: readonly WindowSample[],
  chamber: AtrialChamber,
  beat: number,
  n = 64,
): { readonly volumeMl: number; readonly pressureMmHg: number }[] {
  const beatSamples = samples
    .filter((sample) => Math.floor(sample.phi) === beat)
    .map((sample) => ({
      theta: sample.phi - Math.floor(sample.phi),
      volumeMl: sample[chamber].volumeMl,
      pressureMmHg: sample[chamber].pressureMmHg,
    }))
    .sort((a, b) => a.theta - b.theta);
  if (beatSamples.length < 8) return [];
  return Array.from({ length: n }, (_unused, index) => {
    const theta = index / n;
    return {
      volumeMl: interpolateAtTheta(beatSamples, theta, "volumeMl"),
      pressureMmHg: interpolateAtTheta(beatSamples, theta, "pressureMmHg"),
    };
  });
}

function interpolateAtTheta(
  samples: readonly { readonly theta: number; readonly volumeMl: number; readonly pressureMmHg: number }[],
  theta: number,
  key: "volumeMl" | "pressureMmHg",
): number {
  if (theta <= samples[0].theta) return samples[0][key];
  for (let i = 1; i < samples.length; i++) {
    if (theta <= samples[i].theta) {
      const lo = samples[i - 1];
      const hi = samples[i];
      const f = (theta - lo.theta) / Math.max(hi.theta - lo.theta, 1e-9);
      return lo[key] + f * (hi[key] - lo[key]);
    }
  }
  return samples.at(-1)![key];
}

function rmsRelativeDelta(a: readonly number[], b: readonly number[]): number {
  if (a.length !== b.length || a.length === 0) return Number.NaN;
  let sumSq = 0;
  let scaleSq = 0;
  for (let i = 0; i < a.length; i++) {
    sumSq += (a[i] - b[i]) ** 2;
    scaleSq += Math.max(1, Math.abs(a[i]), Math.abs(b[i])) ** 2;
  }
  return Math.sqrt(sumSq / Math.max(scaleSq, 1e-9));
}

function valueAt(sample: SimSample, key: string): number {
  const value = (sample as unknown as Record<string, unknown>)[key];
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function mean(values: readonly number[]): number {
  const finiteValues = values.filter(Number.isFinite);
  return finiteValues.length > 0
    ? finiteValues.reduce((sum, value) => sum + value, 0) / finiteValues.length
    : Number.NaN;
}

function finiteOrNull(value: number | null | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) ? round(value) : null;
}

function round(value: number, digits = 6): number {
  if (!Number.isFinite(value)) return value;
  const scale = 10 ** digits;
  return Math.round(value * scale) / scale;
}

export function writeAtrialBridgeHighHrRuntimeBaselineEvidence(rootDir = process.cwd()): string {
  const evidence = buildAtrialBridgeHighHrRuntimeBaselineEvidence();
  const outputPath = path.join(rootDir, ATRIAL_BRIDGE_RUNTIME_BASELINE_RESULT_PATH);
  mkdirSync(path.dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(evidence, null, 2)}\n`);
  return outputPath;
}

function isDirectExecution(): boolean {
  const entrypoint = process.argv[1];
  if (entrypoint && import.meta.url === pathToFileURL(path.resolve(entrypoint)).href) return true;
  const normalizedScriptPath =
    path.normalize("tools/myocardium/buildAtrialBridgeHighHrRuntimeBaseline.ts");
  return process.argv.some((arg) => path.normalize(arg).endsWith(normalizedScriptPath));
}

if (isDirectExecution()) {
  const shouldWrite = process.argv.includes("--write");
  const evidence = buildAtrialBridgeHighHrRuntimeBaselineEvidence();
  if (shouldWrite) {
    const outputPath = writeAtrialBridgeHighHrRuntimeBaselineEvidence();
    console.log(`Wrote ${outputPath}`);
  } else {
    console.log(JSON.stringify(evidence, null, 2));
  }
}
