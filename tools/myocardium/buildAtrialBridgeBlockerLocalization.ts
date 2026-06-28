import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import shootoutArtifact from "@/data/myocardium/protocols/atrial-bridge-shootout-phase5p5-result-v1.json";
import { ModelCore, defaultParams } from "@/engine/ModelCore";
import { measureSteady } from "@/engine/measure";
import type { ChamberCtx, ChamberInternal } from "@/engine/chambers";
import type { CoreRuntimeParams, SimSample } from "@/engine/protocol";
import { DEFAULT_SETTLE_POLICY, type SettlePolicy } from "@/engine/settling";
import {
  createAtrialBridgeProviders,
  createAtrialBridgeRuntime,
  type AtrialBridgeCandidateId,
  type AtrialBridgeClosedLoopRun,
  type AtrialBridgeDiagnosticVariantId,
  type AtrialBridgeShootoutEvidence,
} from "@/tools/myocardium/buildAtrialBridgeShootout";

export const ATRIAL_BRIDGE_LOCALIZATION_EVIDENCE_ID =
  "atrial-bridge-blocker-localization-phase5p5b-result-v1";

export const ATRIAL_BRIDGE_LOCALIZATION_RESULT_PATH =
  "data/myocardium/protocols/atrial-bridge-blocker-localization-phase5p5b-result-v1.json";

type AtrialChamber = "LA" | "RA";
type Valve = "MV" | "TV";
type PointId = "normal" | "low-preload" | "high-preload" | "high-hr";

export type AtrialBridgeBlockerLocalizationEvidence = {
  readonly schemaVersion: 1;
  readonly id: typeof ATRIAL_BRIDGE_LOCALIZATION_EVIDENCE_ID;
  readonly phase: "Phase 5.5B";
  readonly claimBoundary: "diagnostic-localization-only-no-bridge-selection";
  readonly sourceShootout: "data/myocardium/protocols/atrial-bridge-shootout-phase5p5-result-v1.json";
  readonly verifierScript: "verify:myocardium-atrial-bridge-localization";
  readonly protocol: {
    readonly candidateIds: readonly AtrialBridgeCandidateId[];
    readonly diagnosticVariantIds: readonly AtrialBridgeDiagnosticVariantId[];
    readonly highHrSweepPoints: readonly AtrialBridgeHighHrSweepPoint[];
    readonly repeatabilityPoints: readonly AtrialBridgeRepeatabilityPoint[];
    readonly isolatedSamplingRatesHz: readonly number[];
    readonly dtSec: number;
    readonly sampleHz: number;
    readonly tailWindowBeats: number;
    readonly measureBeats: number;
    readonly settlePolicy: Pick<SettlePolicy, "tolPrimary" | "tolShape" | "consecutiveBeats" | "minBeats" | "capSeconds" | "postSettleBeats">;
    readonly sameBoundaryForAllCandidates: true;
    readonly variantsNeverSelectable: true;
  };
  readonly highHrSweepRuns: readonly AtrialBridgeHighHrSweepRun[];
  readonly diagnosticVariantRuns: readonly AtrialBridgeDiagnosticVariantRun[];
  readonly valveRateDiagnostics: readonly AtrialBridgeValveRateDiagnostic[];
  readonly a1ValveComparisons: readonly AtrialBridgeA1ValveComparison[];
  readonly repeatabilityDiagnostics: readonly AtrialBridgeRepeatabilityDiagnostic[];
  readonly isolatedSamplingDiagnostics: readonly AtrialBridgeIsolatedSamplingDiagnostic[];
  readonly summary: {
    readonly highHrGapStatus: "hr105-common-nonsettle-persists" | "resolved-or-not-reproduced";
    readonly highestAllCandidateSettledHr: number | null;
    readonly commonNonSettledSweepPointIds: readonly string[];
    readonly highHrFailureClasses: readonly string[];
    readonly a1ValveBlockerAfterNormalization: "supported" | "not-supported";
    readonly a1ValveWorsePointIds: readonly string[];
    readonly a1RepeatabilityBlockerLocalized: "supported" | "not-supported";
    readonly a1RepeatabilityFailureSites: readonly string[];
    readonly a1SamplingInvariantBlockerLocalized: "supported" | "not-supported";
    readonly a1SamplingFailureSites: readonly string[];
    readonly diagnosticVariantsRemainNonSelectable: true;
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

export type AtrialBridgeHighHrSweepPoint = {
  readonly id:
    | "normal-hr75-reference"
    | "normal-hr90"
    | "normal-hr105";
  readonly targetTBVMl: number;
  readonly HR: number;
};

export type AtrialBridgeTailWindowMetrics = {
  readonly windowKind: "settled-measure-window" | "cap-tail-window";
  readonly windowBeats: number;
  readonly sampleCount: number;
  readonly simulatedSeconds: number;
  readonly forwardCO_L: number | null;
  readonly forwardCO_R: number | null;
  readonly LAPMean: number | null;
  readonly RAPMean: number | null;
  readonly LA: AtrialBridgeWindowLoopMetrics | null;
  readonly RA: AtrialBridgeWindowLoopMetrics | null;
  readonly valveAttribution: Record<Valve, AtrialBridgeValveWindowAttribution>;
  readonly qDotClampHitFraction: number;
};

export type AtrialBridgeWindowLoopMetrics = {
  readonly pressureMeanMmHg: number;
  readonly pressureMinMmHg: number;
  readonly pressureMaxMmHg: number;
  readonly volumeMinMl: number;
  readonly volumeMaxMl: number;
  readonly pvLoopRoughness: number;
  readonly beatRepeatabilityDelta: number | null;
};

export type AtrialBridgeValveWindowAttribution = {
  readonly hitSamples: number;
  readonly hitFraction: number;
  readonly hitsPerBeat: number;
  readonly hitsPerSecond: number;
  readonly diodeImpulseSum: number;
  readonly diodeImpulseMax: number;
  readonly qDotClampHitFraction: number;
  readonly phaseHistogram8: readonly number[];
};

export type AtrialBridgeHighHrSweepRun = {
  readonly protocolId: "high-hr-threshold-matrix-v1";
  readonly sweepPointId: AtrialBridgeHighHrSweepPoint["id"];
  readonly candidateId: AtrialBridgeCandidateId;
  readonly targetTBVMl: number;
  readonly HR: number;
  readonly settled: boolean;
  readonly settleReason: string;
  readonly settleActualSeconds: number | null;
  readonly settleBeats: number;
  readonly periodBeats: number;
  readonly worstSignal: string | null;
  readonly worstDelta: number | null;
  readonly adjacentDelta: number | null;
  readonly periodDelta: number | null;
  readonly adjacentDeltaToTolPrimary: number | null;
  readonly periodDeltaToTolShape: number | null;
  readonly failureClass: "settled" | "near-converged-at-cap" | "periodic-but-outside-tolerance" | "cap-with-valve-activity" | "health-warning" | "monotone-drift";
  readonly healthStatus: string;
  readonly healthMessages: readonly string[];
  readonly projectorQuiet: boolean;
  readonly tailWindow: AtrialBridgeTailWindowMetrics;
};

export type AtrialBridgeDiagnosticVariantRun = {
  readonly protocolId: "a1-diagnostic-variant-high-hr-v1";
  readonly diagnosticVariantId: AtrialBridgeDiagnosticVariantId;
  readonly candidateId: "atrial-reservoir-booster-bridge-v1";
  readonly selectable: false;
  readonly targetTBVMl: number;
  readonly HR: number;
  readonly settled: boolean;
  readonly settleReason: string;
  readonly adjacentDelta: number | null;
  readonly periodDelta: number | null;
  readonly failureClass: AtrialBridgeHighHrSweepRun["failureClass"];
  readonly valveDiodeHitsPerBeat: number;
  readonly valveDiodeHitsPerSecond: number;
};

export type AtrialBridgeValveRateDiagnostic = {
  readonly sourcePointId: PointId;
  readonly candidateId: AtrialBridgeCandidateId;
  readonly HR: number;
  readonly settled: boolean;
  readonly totalValveDiodeHits: number;
  readonly simulatedSeconds: number;
  readonly simulatedBeats: number;
  readonly hitsPerSecond: number;
  readonly hitsPerBeat: number;
  readonly denominatorStatus: "normalized-by-simulated-time-and-beats";
};

export type AtrialBridgeA1ValveComparison = {
  readonly sourcePointId: PointId;
  readonly a1HitsPerBeat: number;
  readonly a0HitsPerBeat: number;
  readonly a1ToA0HitsPerBeatRatio: number;
  readonly a1HitsPerSecond: number;
  readonly a0HitsPerSecond: number;
  readonly a1ToA0HitsPerSecondRatio: number;
  readonly a1WorseAfterNormalization: boolean;
};

export type AtrialBridgeRepeatabilityPoint = {
  readonly id: "normal" | "low-preload" | "high-preload";
  readonly targetTBVMl: number;
  readonly HR: number;
};

export type AtrialBridgeRepeatabilityDiagnostic = {
  readonly protocolId: "phase-resampled-repeatability-v1";
  readonly pointId: AtrialBridgeRepeatabilityPoint["id"];
  readonly candidateId: AtrialBridgeCandidateId;
  readonly threshold: number;
  readonly status: "pass" | "true-loop-drift" | "data-quality-missing";
  readonly sampleCountsByBeat: readonly number[];
  readonly chamberValues: Partial<Record<AtrialChamber, number | null>>;
  readonly failedChambers: readonly AtrialChamber[];
  readonly missingChambers: readonly AtrialChamber[];
};

export type AtrialBridgeIsolatedSamplingDiagnostic = {
  readonly protocolId: "isolated-phase-resampled-roughness-v1";
  readonly candidateId: AtrialBridgeCandidateId;
  readonly chamber: AtrialChamber;
  readonly samplingRatesHz: readonly number[];
  readonly roughnessByHz: Record<string, number>;
  readonly rankingVsA0ByHz: Record<string, "better" | "worse" | "same" | "not-applicable">;
  readonly samplingInvariantVsA0: boolean | null;
};

type WindowSample = {
  readonly t: number;
  readonly phi: number;
  readonly LA: { readonly volumeMl: number; readonly pressureMmHg: number };
  readonly RA: { readonly volumeMl: number; readonly pressureMmHg: number };
};

type SyntheticAtrialSample = {
  readonly t: number;
  readonly phi: number;
  readonly volumeMl: number;
  readonly pressureMmHg: number;
};

const shootout = shootoutArtifact as unknown as AtrialBridgeShootoutEvidence;

const CANDIDATES: readonly AtrialBridgeCandidateId[] = [
  "atrial-elastance-negative-control-v0",
  "legacy-atrial-active-bridge-v0",
  "atrial-reservoir-booster-bridge-v1",
] as const;

const DIAGNOSTIC_VARIANTS: readonly AtrialBridgeDiagnosticVariantId[] = [
  "a1-reservoir-off",
  "a1-recoil-slower",
  "a1-valve-threshold-higher",
] as const;

const HIGH_HR_SWEEP: readonly AtrialBridgeHighHrSweepPoint[] = [
  { id: "normal-hr75-reference", targetTBVMl: 5600, HR: 75 },
  { id: "normal-hr90", targetTBVMl: 5600, HR: 90 },
  { id: "normal-hr105", targetTBVMl: 5600, HR: 105 },
] as const;

const REPEATABILITY_POINTS: readonly AtrialBridgeRepeatabilityPoint[] = [
  { id: "normal", targetTBVMl: 5600, HR: 75 },
  { id: "low-preload", targetTBVMl: 4800, HR: 75 },
  { id: "high-preload", targetTBVMl: 6200, HR: 75 },
] as const;

const DT_SEC = 0.001;
const SAMPLE_HZ = 480;
const TAIL_WINDOW_BEATS = 4;
const MEASURE_BEATS = 3;
const REPEATABILITY_THRESHOLD = 0.05;
const VALVE_RATE_WORSE_TOLERANCE = 0.01;
const ISOLATED_SAMPLE_RATES_HZ = [120, 240, 480, 960] as const;
const SETTLE_POLICY: SettlePolicy = {
  ...DEFAULT_SETTLE_POLICY,
  capSeconds: 120,
  postSettleBeats: 2,
};

export function buildAtrialBridgeBlockerLocalizationEvidence(): AtrialBridgeBlockerLocalizationEvidence {
  const highHrSweepRuns = CANDIDATES.flatMap((candidateId) =>
    HIGH_HR_SWEEP.map((point) => runHighHrSweep(candidateId, point))
  );
  const diagnosticVariantRuns = DIAGNOSTIC_VARIANTS.map((diagnosticVariantId) =>
    runDiagnosticVariant(diagnosticVariantId)
  );
  const valveRateDiagnostics = buildValveRateDiagnostics();
  const a1ValveComparisons = buildA1ValveComparisons(valveRateDiagnostics);
  const repeatabilityDiagnostics = CANDIDATES.flatMap((candidateId) =>
    REPEATABILITY_POINTS.map((point) => runRepeatabilityDiagnostic(candidateId, point))
  );
  const isolatedSamplingDiagnostics = buildIsolatedSamplingDiagnostics();
  const summary = buildSummary(
    highHrSweepRuns,
    a1ValveComparisons,
    repeatabilityDiagnostics,
    isolatedSamplingDiagnostics,
  );

  return {
    schemaVersion: 1,
    id: ATRIAL_BRIDGE_LOCALIZATION_EVIDENCE_ID,
    phase: "Phase 5.5B",
    claimBoundary: "diagnostic-localization-only-no-bridge-selection",
    sourceShootout: "data/myocardium/protocols/atrial-bridge-shootout-phase5p5-result-v1.json",
    verifierScript: "verify:myocardium-atrial-bridge-localization",
    protocol: {
      candidateIds: CANDIDATES,
      diagnosticVariantIds: DIAGNOSTIC_VARIANTS,
      highHrSweepPoints: HIGH_HR_SWEEP,
      repeatabilityPoints: REPEATABILITY_POINTS,
      isolatedSamplingRatesHz: ISOLATED_SAMPLE_RATES_HZ,
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
      sameBoundaryForAllCandidates: true,
      variantsNeverSelectable: true,
    },
    highHrSweepRuns,
    diagnosticVariantRuns,
    valveRateDiagnostics,
    a1ValveComparisons,
    repeatabilityDiagnostics,
    isolatedSamplingDiagnostics,
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
      "oracle broad direction review after this group of model PRs if cadence reaches 3-5 PRs",
      "if high-HR non-settle is shared across candidates, add a same-boundary no-provider or stock-active baseline before tuning atrial providers",
      "if A1 blockers remain supported after normalization, either tune A1 as a new candidate in a later PR or defer to atrial Land/RDQ path",
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

function runHighHrSweep(
  candidateId: AtrialBridgeCandidateId,
  point: AtrialBridgeHighHrSweepPoint,
): AtrialBridgeHighHrSweepRun {
  const core = createCore(candidateId, point.targetTBVMl, point.HR);
  const settleStatus = core.settleToSteady(SETTLE_POLICY, DT_SEC, SAMPLE_HZ);
  const health = core.health();
  const settled = settleStatus.settled && settleStatus.actualSeconds != null;
  const tailWindow = settled
    ? settledWindow(core, settleStatus as typeof settleStatus & { actualSeconds: number }, point.HR)
    : capTailWindow(core, point.HR);
  const projectorQuiet = settled ? tailWindow.forwardCO_L != null : false;
  return {
    protocolId: "high-hr-threshold-matrix-v1",
    sweepPointId: point.id,
    candidateId,
    targetTBVMl: point.targetTBVMl,
    HR: point.HR,
    settled: settleStatus.settled,
    settleReason: settleStatus.reason,
    settleActualSeconds: finiteOrNull(settleStatus.actualSeconds),
    settleBeats: settleStatus.beats,
    periodBeats: settleStatus.periodBeats,
    worstSignal: settleStatus.worstSignal,
    worstDelta: finiteOrNull(settleStatus.worstDelta),
    adjacentDelta: finiteOrNull(settleStatus.adjacentDelta),
    periodDelta: finiteOrNull(settleStatus.periodDelta),
    adjacentDeltaToTolPrimary: finiteOrNull(settleStatus.adjacentDelta / SETTLE_POLICY.tolPrimary),
    periodDeltaToTolShape: finiteOrNull(settleStatus.periodDelta / SETTLE_POLICY.tolShape),
    failureClass: classifySettleFailure(settleStatus.reason, health.status, tailWindow),
    healthStatus: health.status,
    healthMessages: health.messages,
    projectorQuiet,
    tailWindow,
  };
}

function runDiagnosticVariant(
  diagnosticVariantId: AtrialBridgeDiagnosticVariantId,
): AtrialBridgeDiagnosticVariantRun {
  const point = HIGH_HR_SWEEP.find((item) => item.id === "normal-hr105")!;
  const core = createCore("atrial-reservoir-booster-bridge-v1", point.targetTBVMl, point.HR, diagnosticVariantId);
  const settleStatus = core.settleToSteady(SETTLE_POLICY, DT_SEC, SAMPLE_HZ);
  const health = core.health();
  const window = settleStatus.settled && settleStatus.actualSeconds != null
    ? settledWindow(core, settleStatus as typeof settleStatus & { actualSeconds: number }, point.HR)
    : capTailWindow(core, point.HR);
  return {
    protocolId: "a1-diagnostic-variant-high-hr-v1",
    diagnosticVariantId,
    candidateId: "atrial-reservoir-booster-bridge-v1",
    selectable: false,
    targetTBVMl: point.targetTBVMl,
    HR: point.HR,
    settled: settleStatus.settled,
    settleReason: settleStatus.reason,
    adjacentDelta: finiteOrNull(settleStatus.adjacentDelta),
    periodDelta: finiteOrNull(settleStatus.periodDelta),
    failureClass: classifySettleFailure(settleStatus.reason, health.status, window),
    valveDiodeHitsPerBeat: round(window.valveAttribution.MV.hitsPerBeat + window.valveAttribution.TV.hitsPerBeat),
    valveDiodeHitsPerSecond: round(window.valveAttribution.MV.hitsPerSecond + window.valveAttribution.TV.hitsPerSecond),
  };
}

function createCore(
  candidateId: AtrialBridgeCandidateId,
  targetTBVMl: number,
  HR: number,
  diagnosticVariantId: AtrialBridgeDiagnosticVariantId = "none",
): ModelCore {
  const params: Partial<CoreRuntimeParams> = {
    ...defaultParams(),
    HR,
  };
  const core = new ModelCore(params, {
    activeSourceProviders: createAtrialBridgeProviders(candidateId, { diagnosticVariantId }),
  });
  core.initializeVenousPressuresForTargetTBV(targetTBVMl);
  return core;
}

function settledWindow(
  core: ModelCore,
  settleStatus: ReturnType<ModelCore["settleToSteady"]> & { actualSeconds: number },
  HR: number,
): AtrialBridgeTailWindowMetrics {
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

function capTailWindow(core: ModelCore, HR: number): AtrialBridgeTailWindowMetrics {
  const seconds = TAIL_WINDOW_BEATS * 60 / HR;
  const samples = core.runFor(seconds, DT_SEC, SAMPLE_HZ, { recordHistory: false });
  return windowMetrics(samples, HR, "cap-tail-window", TAIL_WINDOW_BEATS, null, null);
}

function windowMetrics(
  samples: readonly SimSample[],
  HR: number,
  windowKind: AtrialBridgeTailWindowMetrics["windowKind"],
  windowBeats: number,
  forwardCO_L: number | null,
  forwardCO_R: number | null,
): AtrialBridgeTailWindowMetrics {
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
    qDotClampHitFraction: round(mean([
      valveAttribution(samples, "MV", HR, windowBeats).qDotClampHitFraction,
      valveAttribution(samples, "TV", HR, windowBeats).qDotClampHitFraction,
    ])),
  };
}

function loopMetricsFromWindow(
  samples: readonly WindowSample[],
  chamber: AtrialChamber,
): AtrialBridgeWindowLoopMetrics | null {
  if (samples.length < 8) return null;
  const pressures = samples.map((sample) => sample[chamber].pressureMmHg);
  const volumes = samples.map((sample) => sample[chamber].volumeMl);
  return {
    pressureMeanMmHg: round(mean(pressures)),
    pressureMinMmHg: round(Math.min(...pressures)),
    pressureMaxMmHg: round(Math.max(...pressures)),
    volumeMinMl: round(Math.min(...volumes)),
    volumeMaxMl: round(Math.max(...volumes)),
    pvLoopRoughness: round(pvLoopRoughness(samples.map((sample) => ({
      t: sample.t,
      phi: sample.phi,
      volumeMl: sample[chamber].volumeMl,
      pressureMmHg: sample[chamber].pressureMmHg,
    })))),
    beatRepeatabilityDelta: finiteOrNull(phaseResampledRepeatability(samples, chamber)),
  };
}

function valveAttribution(
  samples: readonly SimSample[],
  valve: Valve,
  HR: number,
  windowBeats: number,
): AtrialBridgeValveWindowAttribution {
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
    phaseHistogram8: phaseHistogram(samples, hitValues),
  };
}

function buildValveRateDiagnostics(): AtrialBridgeValveRateDiagnostic[] {
  return shootout.closedLoopRuns.map((run) => {
    const totalValveDiodeHits = valveHitTotal(run.clampHits.valveDiodeClampHits);
    const simulatedSeconds = simulatedSecondsFor(run);
    const simulatedBeats = simulatedBeatsFor(run);
    return {
      sourcePointId: run.pointId as PointId,
      candidateId: run.candidateId,
      HR: run.HR,
      settled: run.settled,
      totalValveDiodeHits,
      simulatedSeconds: round(simulatedSeconds),
      simulatedBeats,
      hitsPerSecond: round(totalValveDiodeHits / Math.max(simulatedSeconds, 1e-9)),
      hitsPerBeat: round(totalValveDiodeHits / Math.max(simulatedBeats, 1)),
      denominatorStatus: "normalized-by-simulated-time-and-beats",
    };
  });
}

function buildA1ValveComparisons(
  diagnostics: readonly AtrialBridgeValveRateDiagnostic[],
): AtrialBridgeA1ValveComparison[] {
  return (["normal", "low-preload", "high-preload", "high-hr"] as const).map((sourcePointId) => {
    const a1 = diagnostics.find((diagnostic) =>
      diagnostic.candidateId === "atrial-reservoir-booster-bridge-v1" && diagnostic.sourcePointId === sourcePointId
    );
    const a0 = diagnostics.find((diagnostic) =>
      diagnostic.candidateId === "legacy-atrial-active-bridge-v0" && diagnostic.sourcePointId === sourcePointId
    );
    if (!a1 || !a0) throw new Error(`Missing A1/A0 valve diagnostic for ${sourcePointId}`);
    const beatRatio = a1.hitsPerBeat / Math.max(a0.hitsPerBeat, 1e-9);
    const secondRatio = a1.hitsPerSecond / Math.max(a0.hitsPerSecond, 1e-9);
    return {
      sourcePointId,
      a1HitsPerBeat: a1.hitsPerBeat,
      a0HitsPerBeat: a0.hitsPerBeat,
      a1ToA0HitsPerBeatRatio: round(beatRatio),
      a1HitsPerSecond: a1.hitsPerSecond,
      a0HitsPerSecond: a0.hitsPerSecond,
      a1ToA0HitsPerSecondRatio: round(secondRatio),
      a1WorseAfterNormalization:
        beatRatio > 1 + VALVE_RATE_WORSE_TOLERANCE
        || secondRatio > 1 + VALVE_RATE_WORSE_TOLERANCE,
    };
  });
}

function runRepeatabilityDiagnostic(
  candidateId: AtrialBridgeCandidateId,
  point: AtrialBridgeRepeatabilityPoint,
): AtrialBridgeRepeatabilityDiagnostic {
  const core = createCore(candidateId, point.targetTBVMl, point.HR);
  const settleStatus = core.settleToSteady(SETTLE_POLICY, DT_SEC, SAMPLE_HZ);
  if (!settleStatus.settled || settleStatus.actualSeconds == null) {
    return {
      protocolId: "phase-resampled-repeatability-v1",
      pointId: point.id,
      candidateId,
      threshold: REPEATABILITY_THRESHOLD,
      status: "data-quality-missing",
      sampleCountsByBeat: [],
      chamberValues: { LA: null, RA: null },
      failedChambers: [],
      missingChambers: ["LA", "RA"],
    };
  }
  const measured = measureSteady(core, settleStatus as typeof settleStatus & { actualSeconds: number }, {
    dt: DT_SEC,
    sampleHz: SAMPLE_HZ,
    measureBeats: MEASURE_BEATS,
    requireProjectorQuiet: false,
  });
  const windowSamples = measured.samples.map((sample) => ({
    t: sample.t,
    phi: sample.phi,
    LA: { volumeMl: sample.VLA, pressureMmHg: sample.LAP },
    RA: { volumeMl: sample.VRA, pressureMmHg: sample.RAP },
  }));
  const chamberValues: Partial<Record<AtrialChamber, number | null>> = {
    LA: finiteOrNull(phaseResampledRepeatability(windowSamples, "LA")),
    RA: finiteOrNull(phaseResampledRepeatability(windowSamples, "RA")),
  };
  const missingChambers = (["LA", "RA"] as const).filter((chamber) => chamberValues[chamber] == null);
  const failedChambers = (["LA", "RA"] as const).filter((chamber) =>
    chamberValues[chamber] != null && chamberValues[chamber]! > REPEATABILITY_THRESHOLD
  );
  return {
    protocolId: "phase-resampled-repeatability-v1",
    pointId: point.id,
    candidateId,
    threshold: REPEATABILITY_THRESHOLD,
    status: missingChambers.length > 0
      ? "data-quality-missing"
      : failedChambers.length > 0
        ? "true-loop-drift"
        : "pass",
    sampleCountsByBeat: sampleCountsByBeat(measured.samples),
    chamberValues,
    failedChambers,
    missingChambers,
  };
}

function buildIsolatedSamplingDiagnostics(): AtrialBridgeIsolatedSamplingDiagnostic[] {
  const diagnostics = CANDIDATES.flatMap((candidateId) =>
    (["LA", "RA"] as const).map((chamber) => isolatedSamplingDiagnostic(candidateId, chamber))
  );
  return diagnostics.map((diagnostic) => {
    if (diagnostic.candidateId === "legacy-atrial-active-bridge-v0") return diagnostic;
    if (diagnostic.candidateId === "atrial-elastance-negative-control-v0") return diagnostic;
    const a0 = diagnostics.find((item) =>
      item.candidateId === "legacy-atrial-active-bridge-v0" && item.chamber === diagnostic.chamber
    );
    if (!a0) return diagnostic;
    const rankingVsA0ByHz = Object.fromEntries(
      ISOLATED_SAMPLE_RATES_HZ.map((hz) => {
        const key = String(hz);
        return [key, compareRoughness(diagnostic.roughnessByHz[key], a0.roughnessByHz[key])];
      }),
    ) as Record<string, "better" | "worse" | "same" | "not-applicable">;
    const rankings = Object.values(rankingVsA0ByHz).filter((value) => value !== "not-applicable");
    return {
      ...diagnostic,
      rankingVsA0ByHz,
      samplingInvariantVsA0: rankings.length > 0 && new Set(rankings).size === 1,
    };
  });
}

function isolatedSamplingDiagnostic(
  candidateId: AtrialBridgeCandidateId,
  chamber: AtrialChamber,
): AtrialBridgeIsolatedSamplingDiagnostic {
  const roughnessByHz: Record<string, number> = {};
  for (const hz of ISOLATED_SAMPLE_RATES_HZ) {
    const samples = runIsolatedSynthetic(candidateId, chamber, hz);
    roughnessByHz[String(hz)] = round(pvLoopRoughness(samples));
  }
  return {
    protocolId: "isolated-phase-resampled-roughness-v1",
    candidateId,
    chamber,
    samplingRatesHz: ISOLATED_SAMPLE_RATES_HZ,
    roughnessByHz,
    rankingVsA0ByHz: Object.fromEntries(
      ISOLATED_SAMPLE_RATES_HZ.map((hz) => [String(hz), candidateId === "legacy-atrial-active-bridge-v0" ? "same" : "not-applicable"]),
    ) as Record<string, "better" | "worse" | "same" | "not-applicable">,
    samplingInvariantVsA0: candidateId === "legacy-atrial-active-bridge-v0" ? true : null,
  };
}

function runIsolatedSynthetic(
  candidateId: AtrialBridgeCandidateId,
  chamber: AtrialChamber,
  sampleHz: number,
): SyntheticAtrialSample[] {
  const runtime = createAtrialBridgeRuntime(candidateId, chamber);
  const beatSec = 60 / 75;
  const warmupBeats = 10;
  const measureBeats = 3;
  let internal: ChamberInternal = runtime.initialInternal();
  const samples: SyntheticAtrialSample[] = [];
  const sampleInterval = 1 / sampleHz;
  let sampleAt = warmupBeats * beatSec;
  const totalSeconds = (warmupBeats + measureBeats) * beatSec;
  for (let step = 0; step <= Math.round(totalSeconds / DT_SEC); step++) {
    const t = step * DT_SEC;
    const phi = t / beatSec;
    const ctx = syntheticAtrialCtx(chamber, phi);
    const volumeMl = syntheticAtrialVolumeMl(chamber, phi);
    const pressureMmHg = runtime.pressure(volumeMl, internal, ctx);
    if (t >= sampleAt - 1e-9 && t >= warmupBeats * beatSec) {
      samples.push({ t, phi, volumeMl, pressureMmHg });
      sampleAt += sampleInterval;
    }
    const d = runtime.internalDerivatives(volumeMl, internal, ctx);
    internal = {
      c: finite(internal.c + DT_SEC * d.cDot),
      a: clamp01(finite(internal.a + DT_SEC * d.aDot)),
      r: Math.max(0, finite((internal.r ?? 0) + DT_SEC * d.rDot)),
      tensionPa: Math.max(0, finite((internal.tensionPa ?? 0) + DT_SEC * (d.tensionPaDot ?? 0))),
      lambdaAct: finite((internal.lambdaAct ?? 1) + DT_SEC * (d.lambdaActDot ?? 0)),
    };
  }
  return samples;
}

function buildSummary(
  highHrSweepRuns: readonly AtrialBridgeHighHrSweepRun[],
  a1ValveComparisons: readonly AtrialBridgeA1ValveComparison[],
  repeatabilityDiagnostics: readonly AtrialBridgeRepeatabilityDiagnostic[],
  isolatedSamplingDiagnostics: readonly AtrialBridgeIsolatedSamplingDiagnostic[],
): AtrialBridgeBlockerLocalizationEvidence["summary"] {
  const allCandidateSettled = HIGH_HR_SWEEP.filter((point) =>
    CANDIDATES.every((candidateId) =>
      highHrSweepRuns.some((run) =>
        run.candidateId === candidateId && run.sweepPointId === point.id && run.settled
      )
    )
  );
  const commonNonSettled = HIGH_HR_SWEEP.filter((point) =>
    CANDIDATES.every((candidateId) =>
      highHrSweepRuns.some((run) =>
        run.candidateId === candidateId && run.sweepPointId === point.id && !run.settled
      )
    )
  );
  const a1ValveWorsePointIds = a1ValveComparisons
    .filter((comparison) => comparison.a1WorseAfterNormalization)
    .map((comparison) => comparison.sourcePointId);
  const a1RepeatabilityFailures = repeatabilityDiagnostics
    .filter((diagnostic) => diagnostic.candidateId === "atrial-reservoir-booster-bridge-v1" && diagnostic.status !== "pass")
    .flatMap((diagnostic) => [
      ...diagnostic.failedChambers.map((chamber) => `${diagnostic.pointId}:${chamber}`),
      ...diagnostic.missingChambers.map((chamber) => `${diagnostic.pointId}:${chamber}:missing`),
    ]);
  const a1SamplingFailures = isolatedSamplingDiagnostics
    .filter((diagnostic) =>
      diagnostic.candidateId === "atrial-reservoir-booster-bridge-v1"
      && diagnostic.samplingInvariantVsA0 === false
    )
    .map((diagnostic) => `isolated-${diagnostic.chamber}`);
  const highHrGapStatus = commonNonSettled.some((point) => point.id === "normal-hr105")
    ? "hr105-common-nonsettle-persists"
    : "resolved-or-not-reproduced";
  const highHrFailureClasses = Array.from(new Set(
    highHrSweepRuns
      .filter((run) => !run.settled)
      .map((run) => run.failureClass),
  )).sort();

  return {
    highHrGapStatus,
    highestAllCandidateSettledHr: allCandidateSettled.length > 0
      ? Math.max(...allCandidateSettled.map((point) => point.HR))
      : null,
    commonNonSettledSweepPointIds: commonNonSettled.map((point) => point.id),
    highHrFailureClasses,
    a1ValveBlockerAfterNormalization: a1ValveWorsePointIds.length > 0 ? "supported" : "not-supported",
    a1ValveWorsePointIds,
    a1RepeatabilityBlockerLocalized: a1RepeatabilityFailures.length > 0 ? "supported" : "not-supported",
    a1RepeatabilityFailureSites: a1RepeatabilityFailures,
    a1SamplingInvariantBlockerLocalized: a1SamplingFailures.length > 0 ? "supported" : "not-supported",
    a1SamplingFailureSites: a1SamplingFailures,
    diagnosticVariantsRemainNonSelectable: true,
    selectedCandidateId: null,
    recommendedCandidateId: null,
    rationale: [
      "Phase 5.5B localizes the measured Phase 5.5 blockers; it does not select a Phase 6 bridge.",
      highHrGapStatus === "hr105-common-nonsettle-persists"
        ? "HR105/min remains a common non-settle boundary across E0/A0/A1 under the normal-TBV high-HR sweep."
        : "The HR105/min common non-settle boundary did not reproduce in this sweep.",
      `Highest HR where all candidates settled: ${allCandidateSettled.length > 0 ? Math.max(...allCandidateSettled.map((point) => point.HR)) : "none"}/min.`,
      a1ValveWorsePointIds.length > 0
        ? `A1 remains worse than A0 after valve diode hit normalization at: ${a1ValveWorsePointIds.join(", ")}.`
        : "A1 valve diode blocker is not supported after beat/second normalization.",
      a1RepeatabilityFailures.length > 0
        ? `A1 repeatability failures localize to: ${a1RepeatabilityFailures.join(", ")}.`
        : "A1 repeatability blocker is not supported after phase-resampled repeatability.",
      a1SamplingFailures.length > 0
        ? `A1 sampling-invariance failures localize to: ${a1SamplingFailures.join(", ")}.`
        : "A1 sampling-invariance blocker is not supported after phase-normalized roughness sampling.",
    ],
    blockers: [
      "Phase 6 bridge selection remains owner/oracle gated.",
      "Common high-HR non-settle must be resolved or explicitly bounded before bridge selection.",
      "A1 cannot be selected while normalized valve, repeatability, or sampling-invariance blockers remain supported.",
      "Diagnostic variants are non-selectable and cannot be promoted by this artifact.",
      "This artifact does not tune A1, alter qDot/valves, or wire production runtime.",
    ],
  };
}

function classifySettleFailure(
  reason: string,
  healthStatus: string,
  window: AtrialBridgeTailWindowMetrics,
): AtrialBridgeHighHrSweepRun["failureClass"] {
  if (reason !== "cap") return "settled";
  if (healthStatus !== "ok") return "health-warning";
  const valveActivity =
    window.valveAttribution.MV.hitFraction > 0.25
    || window.valveAttribution.TV.hitFraction > 0.25;
  if (valveActivity) return "cap-with-valve-activity";
  const repeatability = Math.max(
    window.LA?.beatRepeatabilityDelta ?? 0,
    window.RA?.beatRepeatabilityDelta ?? 0,
  );
  if (repeatability > 0.20) return "periodic-but-outside-tolerance";
  if (repeatability <= 0.08) return "near-converged-at-cap";
  return "monotone-drift";
}

function simulatedSecondsFor(run: AtrialBridgeClosedLoopRun): number {
  const settleSeconds = run.settleActualSeconds ?? 0;
  return run.settled
    ? settleSeconds + shootout.protocol.closedLoopMeasureBeats * 60 / run.HR
    : settleSeconds;
}

function simulatedBeatsFor(run: AtrialBridgeClosedLoopRun): number {
  return run.settleBeats + (run.settled ? shootout.protocol.closedLoopMeasureBeats : 0);
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

function sampleCountsByBeat(samples: readonly SimSample[]): number[] {
  const counts = new Map<number, number>();
  for (const sample of samples) {
    const beat = Math.floor(sample.phi);
    counts.set(beat, (counts.get(beat) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => a[0] - b[0]).map((entry) => entry[1]);
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

function phaseHistogram(samples: readonly SimSample[], hitValues: readonly number[]): readonly number[] {
  const bins = Array.from({ length: 8 }, () => 0);
  for (let i = 0; i < samples.length; i++) {
    if (hitValues[i] <= 0) continue;
    const theta = samples[i].phi - Math.floor(samples[i].phi);
    const bin = Math.min(7, Math.max(0, Math.floor(theta * 8)));
    bins[bin]++;
  }
  return bins;
}

function pvLoopRoughness(samples: readonly SyntheticAtrialSample[]): number {
  if (samples.length < 5) return Number.POSITIVE_INFINITY;
  let curvature = 0;
  let slope = 0;
  for (let i = 2; i < samples.length; i++) {
    const p0 = samples[i - 2].pressureMmHg;
    const p1 = samples[i - 1].pressureMmHg;
    const p2 = samples[i].pressureMmHg;
    const v0 = samples[i - 2].volumeMl;
    const v1 = samples[i - 1].volumeMl;
    const v2 = samples[i].volumeMl;
    const dv1 = v1 - v0;
    const dv2 = v2 - v1;
    const dp1 = p1 - p0;
    const dp2 = p2 - p1;
    const s1 = dp1 / Math.max(Math.abs(dv1), 1e-6);
    const s2 = dp2 / Math.max(Math.abs(dv2), 1e-6);
    curvature += Math.abs(s2 - s1);
    slope += Math.abs(s1) + Math.abs(s2);
  }
  return curvature / Math.max(slope, 1e-9);
}

function syntheticAtrialCtx(chamber: AtrialChamber, phi: number): ChamberCtx {
  const theta = frac(phi);
  return {
    HR: 75,
    contractility: 1,
    relaxation: 1,
    phi,
    chamber,
    avDelaySec: 0.16,
    atrialElectromechanicalDelaySec: 0,
    ventricularElectromechanicalDelaySec: 0.05,
    tmaxScale: 1,
    geomScale: 1,
    caReleaseScale: 1,
    pairedVentricleVolumeMl: chamber === "LA" ? 95 : 110,
    pairedVentricleShortening01: systolicGate(theta),
    pairedVentricleShorteningVelocity01PerSec: 0,
    inletValveOpen01: diastolicInletGate(theta),
    outletValveOpen01: systolicGate(theta),
    side: chamber === "RA" ? "right" : "left",
    lvVolumeMl: 95,
    lvShortening01: systolicGate(theta),
    mvOpen01: chamber === "LA" ? diastolicInletGate(theta) : 0,
    aovOpen01: chamber === "LA" ? systolicGate(theta) : 0,
  };
}

function syntheticAtrialVolumeMl(chamber: AtrialChamber, phi: number): number {
  const theta = frac(phi);
  const mean = chamber === "LA" ? 45 : 52;
  const reservoir = chamber === "LA" ? 9 : 11;
  const booster = chamber === "LA" ? 5 : 6;
  return mean
    + reservoir * Math.sin(2 * Math.PI * (theta - 0.18))
    - booster * raisedCosineWindow(theta, 0.82, 0.98);
}

function systolicGate(theta: number): number {
  return raisedCosineWindow(theta, 0.05, 0.40);
}

function diastolicInletGate(theta: number): number {
  return Math.max(raisedCosineWindow(theta, 0.45, 0.78), raisedCosineWindow(theta, 0.82, 0.98));
}

function raisedCosineWindow(theta: number, start: number, end: number): number {
  const t = frac(theta);
  if (start <= end) {
    if (t < start || t > end) return 0;
    return 0.5 * (1 - Math.cos(2 * Math.PI * (t - start) / Math.max(end - start, 1e-9)));
  }
  if (t >= start) return raisedCosineWindow(t, start, 1);
  return raisedCosineWindow(t, 0, end);
}

function compareRoughness(a: number, b: number): "better" | "worse" | "same" | "not-applicable" {
  if (!Number.isFinite(a) || !Number.isFinite(b)) return "not-applicable";
  if (Math.abs(a - b) <= 1e-6) return "same";
  return a < b ? "better" : "worse";
}

function valveHitTotal(hits: Partial<Record<Valve, number>>): number {
  return (hits.MV ?? 0) + (hits.TV ?? 0);
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

function finite(value: number): number {
  return Number.isFinite(value) ? value : 0;
}

function finiteOrNull(value: number | null | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) ? round(value) : null;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function frac(value: number): number {
  return value - Math.floor(value);
}

function round(value: number, digits = 6): number {
  if (!Number.isFinite(value)) return value;
  const scale = 10 ** digits;
  return Math.round(value * scale) / scale;
}

export function writeAtrialBridgeBlockerLocalizationEvidence(rootDir = process.cwd()): string {
  const evidence = buildAtrialBridgeBlockerLocalizationEvidence();
  const outputPath = path.join(rootDir, ATRIAL_BRIDGE_LOCALIZATION_RESULT_PATH);
  mkdirSync(path.dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(evidence, null, 2)}\n`);
  return outputPath;
}

function isDirectExecution(): boolean {
  const entrypoint = process.argv[1];
  if (entrypoint && import.meta.url === pathToFileURL(path.resolve(entrypoint)).href) return true;
  const normalizedScriptPath =
    path.normalize("tools/myocardium/buildAtrialBridgeBlockerLocalization.ts");
  return process.argv.some((arg) => path.normalize(arg).endsWith(normalizedScriptPath));
}

if (isDirectExecution()) {
  const shouldWrite = process.argv.includes("--write");
  const evidence = buildAtrialBridgeBlockerLocalizationEvidence();
  if (shouldWrite) {
    const outputPath = writeAtrialBridgeBlockerLocalizationEvidence();
    console.log(`Wrote ${outputPath}`);
  } else {
    console.log(JSON.stringify(evidence, null, 2));
  }
}
