import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { ModelCore, defaultParams } from "@/engine/ModelCore";
import { measureSteady } from "@/engine/measure";
import type { CoreRuntimeParams, SimMetrics, SimSample } from "@/engine/protocol";
import { DEFAULT_SETTLE_POLICY, type SettlePolicy } from "@/engine/settling";
import {
  createAtrialBridgeProviders,
  type AtrialBridgeCandidateId,
} from "@/tools/myocardium/buildAtrialBridgeShootout";

export const ATRIAL_FIGURE_EIGHT_PHASE5AN_EVIDENCE_ID =
  "atrial-figure-eight-readability-phase5an-result-v1";

export const ATRIAL_FIGURE_EIGHT_PHASE5AN_RESULT_PATH =
  "data/myocardium/protocols/atrial-figure-eight-readability-phase5an-result-v1.json";

type AtrialFigureEightCandidateId = Extract<
  AtrialBridgeCandidateId,
  | "legacy-atrial-active-bridge-v0"
  | "atrial-reservoir-booster-bridge-v1"
  | "atrial-refined-reservoir-booster-bridge-v1"
>;
type AtrialChamber = "LA" | "RA";
type Valve = "MV" | "TV";

export type AtrialFigureEightPointId =
  | "normal-hr75"
  | "low-preload-hr75"
  | "high-preload-hr75"
  | "normal-hr90"
  | "low-preload-hr90"
  | "high-preload-hr90";

export type AtrialFigureEightPointSpec = {
  readonly id: AtrialFigureEightPointId;
  readonly preloadClass: "normal" | "low-preload" | "high-preload";
  readonly targetTBVMl: number;
  readonly HR: 75 | 90;
};

export type AtrialFigureEightEvidence = {
  readonly schemaVersion: 1;
  readonly id: typeof ATRIAL_FIGURE_EIGHT_PHASE5AN_EVIDENCE_ID;
  readonly phase: "Phase 5AN";
  readonly claimBoundary: "focused-atrial-figure-eight-diagnostic-no-selection";
  readonly sourceEvidence: readonly [
    "data/myocardium/protocols/atrial-bridge-shootout-phase5p5-result-v1.json",
    "data/myocardium/protocols/atrial-bridge-blocker-localization-phase5p5b-result-v1.json",
    "data/myocardium/protocols/atrial-bridge-high-hr-runtime-baseline-phase5p5c-result-v1.json",
  ];
  readonly implementationStatus: {
    readonly refinedA1ProviderImplemented: true;
    readonly candidateScope: "LA-RA-experimental-provider-only";
    readonly productionRuntimeWiring: "absent";
    readonly officialCaseWiring: "absent";
    readonly workbenchRuntimeWiring: "absent";
    readonly stateSchemaMigration: "absent";
  };
  readonly protocol: {
    readonly candidateIds: readonly AtrialFigureEightCandidateId[];
    readonly comparatorCandidateId: "legacy-atrial-active-bridge-v0";
    readonly refinedCandidateId: "atrial-refined-reservoir-booster-bridge-v1";
    readonly points: readonly AtrialFigureEightPointSpec[];
    readonly dtSec: number;
    readonly settleSampleHz: number;
    readonly measureSampleHz: number;
    readonly measureBeats: number;
    readonly capTailBeats: number;
    readonly settlePolicy: Pick<SettlePolicy, "tolPrimary" | "tolShape" | "consecutiveBeats" | "minBeats" | "capSeconds" | "postSettleBeats">;
    readonly sameBoundaryForAllCandidates: true;
    readonly hr105AndHr120AreEdgeEvidenceOnly: true;
    readonly noPermanentVerifierOrNpmScriptAdded: true;
    readonly readabilityThresholds: AtrialFigureEightReadabilityThresholds;
  };
  readonly runs: readonly AtrialFigureEightRun[];
  readonly valveComparisonsVsA0: readonly AtrialFigureEightValveComparison[];
  readonly candidateSummaries: readonly AtrialFigureEightCandidateSummary[];
  readonly summary: {
    readonly existingA1FixTargets: readonly string[];
    readonly figureEightMetricSet: readonly string[];
    readonly refinedA1Status:
      | "measured-candidate-for-owner-review"
      | "measured-partial-needs-follow-up"
      | "not-supported";
    readonly refinedA1ReadablePointIds: readonly AtrialFigureEightPointId[];
    readonly refinedA1ValveWorsePointIds: readonly AtrialFigureEightPointId[];
    readonly refinedA1SamplingUnboundedPointIds: readonly string[];
    readonly refinedA1SettledPointIds: readonly AtrialFigureEightPointId[];
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
    readonly noLvRvLandDefaultGate: true;
    readonly noMorphologyAcceptance: true;
  };
  readonly nextAllowedWork: readonly string[];
  readonly doesNotUnlock: readonly string[];
};

export type AtrialFigureEightReadabilityThresholds = {
  readonly minPressureRangeMmHg: number;
  readonly minVolumeRangeMl: number;
  readonly minLobeBalance: number;
  readonly maxRoughnessSamplingSpan: number;
  readonly requireAtLeastOnePvSelfIntersection: true;
};

export type AtrialFigureEightRun = {
  readonly protocolId: "atrial-figure-eight-readability-phase5an-v1";
  readonly candidateId: AtrialFigureEightCandidateId;
  readonly pointId: AtrialFigureEightPointId;
  readonly preloadClass: AtrialFigureEightPointSpec["preloadClass"];
  readonly targetTBVMl: number;
  readonly HR: 75 | 90;
  readonly settled: boolean;
  readonly settleReason: string;
  readonly settleActualSeconds: number | null;
  readonly settleBeats: number;
  readonly periodBeats: number;
  readonly adjacentDelta: number | null;
  readonly periodDelta: number | null;
  readonly healthStatus: string;
  readonly healthMessages: readonly string[];
  readonly windowKind: "settled-measure-window" | "cap-tail-window";
  readonly windowBeats: number;
  readonly sampleCount: number;
  readonly simulatedSeconds: number;
  readonly forwardCO_L: number | null;
  readonly forwardCO_R: number | null;
  readonly forwardCODiffLMin: number | null;
  readonly LVEDPApprox: number | null;
  readonly RVEDPApprox: number | null;
  readonly LAPMean: number | null;
  readonly RAPMean: number | null;
  readonly LA: AtrialFigureEightLoopMetrics | null;
  readonly RA: AtrialFigureEightLoopMetrics | null;
  readonly valveAttribution: Record<Valve, AtrialFigureEightValveAttribution>;
  readonly qDotClampHitFraction: number;
  readonly settledLvRvHealthInterpretable: boolean;
};

export type AtrialFigureEightLoopMetrics = {
  readonly pressureRangeMmHg: number;
  readonly volumeRangeMl: number;
  readonly pressureMeanMmHg: number;
  readonly pressureMinMmHg: number;
  readonly pressureMaxMmHg: number;
  readonly volumeMinMl: number;
  readonly volumeMaxMl: number;
  readonly boosterLoopSignedArea: number;
  readonly reservoirLoopSignedArea: number;
  readonly boosterLoopAreaAbs: number;
  readonly reservoirLoopAreaAbs: number;
  readonly lobeBalance: number;
  readonly signedLobesOpposed: boolean;
  readonly pvSelfIntersections: number;
  readonly pvLoopRoughnessByHz: Record<string, number>;
  readonly roughnessSamplingSpan: number;
  readonly pressureHighFrequencyEnergy: number;
  readonly dPdtSpikeCount: number;
  readonly educationalFigureEightReadable: boolean;
  readonly readabilityScore: number;
};

export type AtrialFigureEightValveAttribution = {
  readonly hitSamples: number;
  readonly hitFraction: number;
  readonly hitsPerBeat: number;
  readonly hitsPerSecond: number;
  readonly diodeImpulsePerBeat: number;
  readonly diodeImpulseMax: number;
  readonly qDotClampHitFraction: number;
};

export type AtrialFigureEightValveComparison = {
  readonly pointId: AtrialFigureEightPointId;
  readonly candidateId: Exclude<AtrialFigureEightCandidateId, "legacy-atrial-active-bridge-v0">;
  readonly comparatorCandidateId: "legacy-atrial-active-bridge-v0";
  readonly candidateHitsPerBeat: number;
  readonly comparatorHitsPerBeat: number;
  readonly hitsPerBeatRatio: number;
  readonly candidateImpulsePerBeat: number;
  readonly comparatorImpulsePerBeat: number;
  readonly impulsePerBeatRatio: number;
  readonly candidateQDotClampHitFraction: number;
  readonly comparatorQDotClampHitFraction: number;
  readonly noWorseThanA0: boolean;
};

export type AtrialFigureEightCandidateSummary = {
  readonly candidateId: AtrialFigureEightCandidateId;
  readonly role: "quarantined-comparator" | "existing-a1-baseline" | "refined-a1-candidate";
  readonly settledPointIds: readonly AtrialFigureEightPointId[];
  readonly readablePointIds: readonly AtrialFigureEightPointId[];
  readonly readableHr75Envelope: boolean;
  readonly readableHr90Envelope: boolean;
  readonly settledLvRvHealthOkPointIds: readonly AtrialFigureEightPointId[];
  readonly valveNoWorseThanA0PointIds: readonly AtrialFigureEightPointId[] | null;
  readonly valveWorseThanA0PointIds: readonly AtrialFigureEightPointId[] | null;
  readonly samplingBoundedSites: readonly string[];
  readonly samplingUnboundedSites: readonly string[];
  readonly meanReadabilityScore: number;
  readonly selectableByThisArtifact: false;
};

type LoopSample = {
  readonly t: number;
  readonly phi: number;
  readonly volumeMl: number;
  readonly pressureMmHg: number;
};

const CANDIDATES: readonly AtrialFigureEightCandidateId[] = [
  "legacy-atrial-active-bridge-v0",
  "atrial-reservoir-booster-bridge-v1",
  "atrial-refined-reservoir-booster-bridge-v1",
] as const;

const POINTS: readonly AtrialFigureEightPointSpec[] = [
  { id: "normal-hr75", preloadClass: "normal", targetTBVMl: 5600, HR: 75 },
  { id: "low-preload-hr75", preloadClass: "low-preload", targetTBVMl: 4800, HR: 75 },
  { id: "high-preload-hr75", preloadClass: "high-preload", targetTBVMl: 6200, HR: 75 },
  { id: "normal-hr90", preloadClass: "normal", targetTBVMl: 5600, HR: 90 },
  { id: "low-preload-hr90", preloadClass: "low-preload", targetTBVMl: 4800, HR: 90 },
  { id: "high-preload-hr90", preloadClass: "high-preload", targetTBVMl: 6200, HR: 90 },
] as const;

const DT_SEC = 0.001;
const SETTLE_SAMPLE_HZ = 480;
const MEASURE_SAMPLE_HZ = 1000;
const MEASURE_BEATS = 3;
const CAP_TAIL_BEATS = 4;
const ROUGHNESS_SAMPLE_HZ = [240, 480, 960] as const;
const VALVE_WORSE_TOLERANCE = 0.02;
const QDOT_WORSE_TOLERANCE = 0.001;
const READABILITY_THRESHOLDS: AtrialFigureEightReadabilityThresholds = {
  minPressureRangeMmHg: 1.5,
  minVolumeRangeMl: 12,
  minLobeBalance: 0.08,
  maxRoughnessSamplingSpan: 0.45,
  requireAtLeastOnePvSelfIntersection: true,
};
const SETTLE_POLICY: SettlePolicy = {
  ...DEFAULT_SETTLE_POLICY,
  capSeconds: 120,
  postSettleBeats: 2,
};

export function buildAtrialFigureEightReadabilityPhase5ANEvidence(): AtrialFigureEightEvidence {
  const runs = CANDIDATES.flatMap((candidateId) =>
    POINTS.map((point) => runFigureEightPoint(candidateId, point))
  );
  const valveComparisonsVsA0 = buildValveComparisonsVsA0(runs);
  const candidateSummaries = CANDIDATES.map((candidateId) =>
    summarizeCandidate(candidateId, runs, valveComparisonsVsA0)
  );
  const summary = buildSummary(runs, valveComparisonsVsA0, candidateSummaries);

  return {
    schemaVersion: 1,
    id: ATRIAL_FIGURE_EIGHT_PHASE5AN_EVIDENCE_ID,
    phase: "Phase 5AN",
    claimBoundary: "focused-atrial-figure-eight-diagnostic-no-selection",
    sourceEvidence: [
      "data/myocardium/protocols/atrial-bridge-shootout-phase5p5-result-v1.json",
      "data/myocardium/protocols/atrial-bridge-blocker-localization-phase5p5b-result-v1.json",
      "data/myocardium/protocols/atrial-bridge-high-hr-runtime-baseline-phase5p5c-result-v1.json",
    ],
    implementationStatus: {
      refinedA1ProviderImplemented: true,
      candidateScope: "LA-RA-experimental-provider-only",
      productionRuntimeWiring: "absent",
      officialCaseWiring: "absent",
      workbenchRuntimeWiring: "absent",
      stateSchemaMigration: "absent",
    },
    protocol: {
      candidateIds: CANDIDATES,
      comparatorCandidateId: "legacy-atrial-active-bridge-v0",
      refinedCandidateId: "atrial-refined-reservoir-booster-bridge-v1",
      points: POINTS,
      dtSec: DT_SEC,
      settleSampleHz: SETTLE_SAMPLE_HZ,
      measureSampleHz: MEASURE_SAMPLE_HZ,
      measureBeats: MEASURE_BEATS,
      capTailBeats: CAP_TAIL_BEATS,
      settlePolicy: {
        tolPrimary: SETTLE_POLICY.tolPrimary,
        tolShape: SETTLE_POLICY.tolShape,
        consecutiveBeats: SETTLE_POLICY.consecutiveBeats,
        minBeats: SETTLE_POLICY.minBeats,
        capSeconds: SETTLE_POLICY.capSeconds,
        postSettleBeats: SETTLE_POLICY.postSettleBeats,
      },
      sameBoundaryForAllCandidates: true,
      hr105AndHr120AreEdgeEvidenceOnly: true,
      noPermanentVerifierOrNpmScriptAdded: true,
      readabilityThresholds: READABILITY_THRESHOLDS,
    },
    runs,
    valveComparisonsVsA0,
    candidateSummaries,
    summary,
    boundary: {
      noProductionRuntimeWiring: true,
      noOfficialCaseReauthoring: true,
      noWorkbenchRuntimeWiring: true,
      noStateSchemaMigration: true,
      noAtrialLandRdqClaim: true,
      noAfValidationClaim: true,
      noFinalAtrialPhysiologyClaim: true,
      noLvRvLandDefaultGate: true,
      noMorphologyAcceptance: true,
    },
    nextAllowedWork: [
      "review the refined A1 readable-loop and contamination envelope before any owner selection request",
      "if refined A1 remains partial, localize which lobe or valve phase needs candidate-local changes without touching RV Land or root/Zc lanes",
      "keep HR105/120 as runtime edge evidence until a separate high-HR settling lane is explicitly opened",
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
      "LV Land default gating",
    ],
  };
}

function runFigureEightPoint(
  candidateId: AtrialFigureEightCandidateId,
  point: AtrialFigureEightPointSpec,
): AtrialFigureEightRun {
  const params: Partial<CoreRuntimeParams> = {
    ...defaultParams(),
    HR: point.HR,
  };
  const core = new ModelCore(params, {
    activeSourceProviders: createAtrialBridgeProviders(candidateId),
  });
  core.initializeVenousPressuresForTargetTBV(point.targetTBVMl);
  const settleStatus = core.settleToSteady(SETTLE_POLICY, DT_SEC, SETTLE_SAMPLE_HZ);
  const settled = settleStatus.settled && settleStatus.actualSeconds != null;
  if (settled) {
    const measured = measureSteady(core, settleStatus as typeof settleStatus & { actualSeconds: number }, {
      dt: DT_SEC,
      sampleHz: MEASURE_SAMPLE_HZ,
      measureBeats: MEASURE_BEATS,
      requireProjectorQuiet: false,
    });
    return buildRunRecord(candidateId, point, settleStatus, measured.samples, "settled-measure-window", MEASURE_BEATS, {
      metrics: measured.metrics,
      healthStatus: measured.health.status,
      healthMessages: measured.health.messages,
      forwardCO_L: measured.forwardCO_L,
      forwardCO_R: measured.forwardCO_R,
      forwardCODiffLMin: measured.forwardCODiffLMin,
    });
  }

  const tailSeconds = CAP_TAIL_BEATS * 60 / point.HR;
  const samples = core.runFor(tailSeconds, DT_SEC, MEASURE_SAMPLE_HZ, { recordHistory: false });
  const health = core.health();
  return buildRunRecord(candidateId, point, settleStatus, samples, "cap-tail-window", CAP_TAIL_BEATS, {
    metrics: null,
    healthStatus: health.status,
    healthMessages: health.messages,
    forwardCO_L: null,
    forwardCO_R: null,
    forwardCODiffLMin: null,
  });
}

function buildRunRecord(
  candidateId: AtrialFigureEightCandidateId,
  point: AtrialFigureEightPointSpec,
  settleStatus: ReturnType<ModelCore["settleToSteady"]>,
  samples: readonly SimSample[],
  windowKind: AtrialFigureEightRun["windowKind"],
  windowBeats: number,
  measured: {
    readonly metrics: SimMetrics | null;
    readonly healthStatus: string;
    readonly healthMessages: readonly string[];
    readonly forwardCO_L: number | null;
    readonly forwardCO_R: number | null;
    readonly forwardCODiffLMin: number | null;
  },
): AtrialFigureEightRun {
  const valves = {
    MV: valveAttribution(samples, "MV", point.HR, windowBeats),
    TV: valveAttribution(samples, "TV", point.HR, windowBeats),
  };
  return {
    protocolId: "atrial-figure-eight-readability-phase5an-v1",
    candidateId,
    pointId: point.id,
    preloadClass: point.preloadClass,
    targetTBVMl: point.targetTBVMl,
    HR: point.HR,
    settled: settleStatus.settled,
    settleReason: settleStatus.reason,
    settleActualSeconds: finiteOrNull(settleStatus.actualSeconds),
    settleBeats: settleStatus.beats,
    periodBeats: settleStatus.periodBeats,
    adjacentDelta: finiteOrNull(settleStatus.adjacentDelta),
    periodDelta: finiteOrNull(settleStatus.periodDelta),
    healthStatus: measured.healthStatus,
    healthMessages: measured.healthMessages,
    windowKind,
    windowBeats,
    sampleCount: samples.length,
    simulatedSeconds: round(samples.length > 1 ? samples.at(-1)!.t - samples[0].t : 0),
    forwardCO_L: finiteOrNull(measured.forwardCO_L),
    forwardCO_R: finiteOrNull(measured.forwardCO_R),
    forwardCODiffLMin: finiteOrNull(measured.forwardCODiffLMin),
    LVEDPApprox: finiteOrNull(measured.metrics?.LVEDPApprox),
    RVEDPApprox: finiteOrNull(measured.metrics?.RVEDPApprox),
    LAPMean: finiteOrNull(measured.metrics?.LAPMean ?? mean(samples.map((sample) => sample.LAP))),
    RAPMean: finiteOrNull(measured.metrics?.RAPMean ?? mean(samples.map((sample) => sample.RAP))),
    LA: loopMetrics(samples, "LA"),
    RA: loopMetrics(samples, "RA"),
    valveAttribution: valves,
    qDotClampHitFraction: round(mean([valves.MV.qDotClampHitFraction, valves.TV.qDotClampHitFraction])),
    settledLvRvHealthInterpretable:
      settleStatus.settled
      && measured.healthStatus === "ok"
      && isPositiveFinite(measured.forwardCO_L)
      && isPositiveFinite(measured.forwardCO_R)
      && measured.metrics != null
      && Number.isFinite(measured.metrics.LVEDPApprox)
      && Number.isFinite(measured.metrics.RVEDPApprox),
  };
}

function loopMetrics(samples: readonly SimSample[], chamber: AtrialChamber): AtrialFigureEightLoopMetrics | null {
  if (samples.length < 16) return null;
  const loopSamples = samples.map((sample) => ({
    t: sample.t,
    phi: sample.phi,
    volumeMl: chamber === "LA" ? sample.VLA : sample.VRA,
    pressureMmHg: chamber === "LA" ? sample.LAP : sample.RAP,
  }));
  const pressures = loopSamples.map((sample) => sample.pressureMmHg);
  const volumes = loopSamples.map((sample) => sample.volumeMl);
  const boosterSigned = phaseLoopArea(loopSamples, [
    [0.76, 1.0],
    [0.0, 0.14],
  ]);
  const reservoirSigned = phaseLoopArea(loopSamples, [[0.18, 0.72]]);
  const boosterAbs = Math.abs(boosterSigned);
  const reservoirAbs = Math.abs(reservoirSigned);
  const lobeBalance = Math.min(boosterAbs, reservoirAbs) / Math.max(boosterAbs, reservoirAbs, 1e-9);
  const roughnessByHz = Object.fromEntries(
    ROUGHNESS_SAMPLE_HZ.map((hz) => [String(hz), round(pvLoopRoughness(downsample(loopSamples, hz)))]),
  );
  const roughnessValues = Object.values(roughnessByHz);
  const roughnessSamplingSpan = relativeSpan(roughnessValues);
  const pressureRange = Math.max(...pressures) - Math.min(...pressures);
  const volumeRange = Math.max(...volumes) - Math.min(...volumes);
  const intersections = countSelfIntersections(volumes, pressures);
  const signedLobesOpposed = boosterSigned * reservoirSigned < 0;
  const pressureVolumeReadable =
    pressureRange >= READABILITY_THRESHOLDS.minPressureRangeMmHg
    && volumeRange >= READABILITY_THRESHOLDS.minVolumeRangeMl;
  const educationalFigureEightReadable =
    pressureVolumeReadable
    && signedLobesOpposed
    && lobeBalance >= READABILITY_THRESHOLDS.minLobeBalance
    && roughnessSamplingSpan <= READABILITY_THRESHOLDS.maxRoughnessSamplingSpan
    && intersections > 0;
  return {
    pressureRangeMmHg: round(pressureRange),
    volumeRangeMl: round(volumeRange),
    pressureMeanMmHg: round(mean(pressures)),
    pressureMinMmHg: round(Math.min(...pressures)),
    pressureMaxMmHg: round(Math.max(...pressures)),
    volumeMinMl: round(Math.min(...volumes)),
    volumeMaxMl: round(Math.max(...volumes)),
    boosterLoopSignedArea: round(boosterSigned),
    reservoirLoopSignedArea: round(reservoirSigned),
    boosterLoopAreaAbs: round(boosterAbs),
    reservoirLoopAreaAbs: round(reservoirAbs),
    lobeBalance: round(lobeBalance),
    signedLobesOpposed,
    pvSelfIntersections: intersections,
    pvLoopRoughnessByHz: roughnessByHz,
    roughnessSamplingSpan: round(roughnessSamplingSpan),
    pressureHighFrequencyEnergy: round(highFrequencyEnergy(pressures)),
    dPdtSpikeCount: dPdtSpikeCount(loopSamples),
    educationalFigureEightReadable,
    readabilityScore: round(readabilityScore({
      pressureRange,
      volumeRange,
      lobeBalance,
      roughnessSamplingSpan,
      intersections,
      signedLobesOpposed,
    })),
  };
}

function valveAttribution(
  samples: readonly SimSample[],
  valve: Valve,
  HR: number,
  windowBeats: number,
): AtrialFigureEightValveAttribution {
  const hitValues = samples.map((sample) => valueAt(sample, `${valve}_diodeImpulse`) > 0 ? 1 : 0);
  const impulses = samples.map((sample) => Math.max(0, valueAt(sample, `${valve}_diodeImpulse`)));
  const qDotHitValues = samples.map((sample) => valueAt(sample, `${valve}_qDotClampHit01`) > 0 ? 1 : 0);
  const hits = hitValues.reduce((sum, value) => sum + value, 0);
  const impulseSum = impulses.reduce((sum, value) => sum + value, 0);
  const simulatedSeconds = windowBeats * 60 / HR;
  return {
    hitSamples: hits,
    hitFraction: round(hits / Math.max(samples.length, 1)),
    hitsPerBeat: round(hits / Math.max(windowBeats, 1)),
    hitsPerSecond: round(hits / Math.max(simulatedSeconds, 1e-9)),
    diodeImpulsePerBeat: round(impulseSum / Math.max(windowBeats, 1)),
    diodeImpulseMax: round(Math.max(0, ...impulses)),
    qDotClampHitFraction: round(qDotHitValues.reduce((sum, value) => sum + value, 0) / Math.max(samples.length, 1)),
  };
}

function buildValveComparisonsVsA0(
  runs: readonly AtrialFigureEightRun[],
): readonly AtrialFigureEightValveComparison[] {
  return runs
    .filter((run): run is AtrialFigureEightRun & { candidateId: Exclude<AtrialFigureEightCandidateId, "legacy-atrial-active-bridge-v0"> } =>
      run.candidateId !== "legacy-atrial-active-bridge-v0"
    )
    .map((run) => {
      const comparator = runs.find((item) =>
        item.candidateId === "legacy-atrial-active-bridge-v0" && item.pointId === run.pointId
      );
      if (!comparator) throw new Error(`Missing A0 comparator for ${run.pointId}`);
      const candidateHits = totalValveHitsPerBeat(run);
      const comparatorHits = totalValveHitsPerBeat(comparator);
      const candidateImpulse = totalValveImpulsePerBeat(run);
      const comparatorImpulse = totalValveImpulsePerBeat(comparator);
      const qDotDelta = run.qDotClampHitFraction - comparator.qDotClampHitFraction;
      const hitRatio = candidateHits / Math.max(comparatorHits, 1e-9);
      const impulseRatio = candidateImpulse / Math.max(comparatorImpulse, 1e-9);
      return {
        pointId: run.pointId,
        candidateId: run.candidateId,
        comparatorCandidateId: "legacy-atrial-active-bridge-v0",
        candidateHitsPerBeat: round(candidateHits),
        comparatorHitsPerBeat: round(comparatorHits),
        hitsPerBeatRatio: round(hitRatio),
        candidateImpulsePerBeat: round(candidateImpulse),
        comparatorImpulsePerBeat: round(comparatorImpulse),
        impulsePerBeatRatio: round(impulseRatio),
        candidateQDotClampHitFraction: run.qDotClampHitFraction,
        comparatorQDotClampHitFraction: comparator.qDotClampHitFraction,
        noWorseThanA0:
          hitRatio <= 1 + VALVE_WORSE_TOLERANCE
          && impulseRatio <= 1 + VALVE_WORSE_TOLERANCE
          && qDotDelta <= QDOT_WORSE_TOLERANCE,
      };
    });
}

function summarizeCandidate(
  candidateId: AtrialFigureEightCandidateId,
  runs: readonly AtrialFigureEightRun[],
  valveComparisons: readonly AtrialFigureEightValveComparison[],
): AtrialFigureEightCandidateSummary {
  const candidateRuns = runs.filter((run) => run.candidateId === candidateId);
  const settledPointIds = candidateRuns
    .filter((run) => run.settled)
    .map((run) => run.pointId);
  const readablePointIds = candidateRuns
    .filter((run) => run.settled && run.LA?.educationalFigureEightReadable && run.RA?.educationalFigureEightReadable)
    .map((run) => run.pointId);
  const settledLvRvHealthOkPointIds = candidateRuns
    .filter((run) => run.settledLvRvHealthInterpretable)
    .map((run) => run.pointId);
  const samplingBoundedSites = candidateRuns.flatMap((run) =>
    (["LA", "RA"] as const)
      .filter((chamber) => (run[chamber]?.roughnessSamplingSpan ?? Number.POSITIVE_INFINITY) <= READABILITY_THRESHOLDS.maxRoughnessSamplingSpan)
      .map((chamber) => `${run.pointId}:${chamber}`)
  );
  const samplingUnboundedSites = candidateRuns.flatMap((run) =>
    (["LA", "RA"] as const)
      .filter((chamber) => (run[chamber]?.roughnessSamplingSpan ?? Number.POSITIVE_INFINITY) > READABILITY_THRESHOLDS.maxRoughnessSamplingSpan)
      .map((chamber) => `${run.pointId}:${chamber}`)
  );
  const comparisons = valveComparisons.filter((comparison) => comparison.candidateId === candidateId);
  return {
    candidateId,
    role: candidateId === "legacy-atrial-active-bridge-v0"
      ? "quarantined-comparator"
      : candidateId === "atrial-reservoir-booster-bridge-v1"
        ? "existing-a1-baseline"
        : "refined-a1-candidate",
    settledPointIds,
    readablePointIds,
    readableHr75Envelope: envelopeReadable(readablePointIds, 75),
    readableHr90Envelope: envelopeReadable(readablePointIds, 90),
    settledLvRvHealthOkPointIds,
    valveNoWorseThanA0PointIds: candidateId === "legacy-atrial-active-bridge-v0"
      ? null
      : comparisons.filter((comparison) => comparison.noWorseThanA0).map((comparison) => comparison.pointId),
    valveWorseThanA0PointIds: candidateId === "legacy-atrial-active-bridge-v0"
      ? null
      : comparisons.filter((comparison) => !comparison.noWorseThanA0).map((comparison) => comparison.pointId),
    samplingBoundedSites,
    samplingUnboundedSites,
    meanReadabilityScore: round(mean(candidateRuns.flatMap((run) => [
      run.LA?.readabilityScore ?? Number.NaN,
      run.RA?.readabilityScore ?? Number.NaN,
    ]))),
    selectableByThisArtifact: false,
  };
}

function buildSummary(
  runs: readonly AtrialFigureEightRun[],
  valveComparisons: readonly AtrialFigureEightValveComparison[],
  candidateSummaries: readonly AtrialFigureEightCandidateSummary[],
): AtrialFigureEightEvidence["summary"] {
  const refinedSummary = candidateSummaries.find((summary) =>
    summary.candidateId === "atrial-refined-reservoir-booster-bridge-v1"
  );
  if (!refinedSummary) throw new Error("Missing refined A1 summary.");
  const refinedComparisons = valveComparisons.filter((comparison) =>
    comparison.candidateId === "atrial-refined-reservoir-booster-bridge-v1"
  );
  const refinedRuns = runs.filter((run) =>
    run.candidateId === "atrial-refined-reservoir-booster-bridge-v1"
  );
  const refinedReadable = refinedSummary.readablePointIds;
  const refinedValveWorse = refinedComparisons
    .filter((comparison) => !comparison.noWorseThanA0)
    .map((comparison) => comparison.pointId);
  const refinedSamplingUnbounded = refinedSummary.samplingUnboundedSites;
  const refinedStatus = refinedSummary.readableHr75Envelope
    && refinedSummary.readableHr90Envelope
    && refinedValveWorse.length === 0
    && refinedSamplingUnbounded.length === 0
    && refinedSummary.settledLvRvHealthOkPointIds.length === POINTS.length
      ? "measured-candidate-for-owner-review"
      : refinedReadable.length > 0 && refinedSummary.settledPointIds.length > 0
        ? "measured-partial-needs-follow-up"
        : "not-supported";

  return {
    existingA1FixTargets: [
      "A1 valve diode contamination is worse than A0 after beat/time normalization in Phase 5.5B.",
      "A1 isolated roughness ordering versus A0 is not sampling-invariant in Phase 5.5B.",
      "A1 repeatability is no longer the primary blocker after full-beat phase-resampled localization.",
      "HR105/120 should remain edge/runtime-boundary evidence instead of the main atrial figure-eight gate.",
    ],
    figureEightMetricSet: [
      "settled HR75/90 normal, preload-low, and preload-high closed-loop windows",
      "LA/RA booster-loop and reservoir-loop signed PV areas",
      "lobe-balance ratio between booster and reservoir loop areas",
      "PV self-intersection count as a waist/readability proxy",
      "roughness sampling span from 240/480/960 Hz downsampled windows",
      "MV/TV diode hit and impulse rates versus A0",
      "settled LV/RV health readback with forward CO and LVEDP/RVEDP",
    ],
    refinedA1Status: refinedStatus,
    refinedA1ReadablePointIds: refinedReadable,
    refinedA1ValveWorsePointIds: refinedValveWorse,
    refinedA1SamplingUnboundedPointIds: refinedSamplingUnbounded,
    refinedA1SettledPointIds: refinedRuns
      .filter((run) => run.settled)
      .map((run) => run.pointId),
    selectedCandidateId: null,
    recommendedCandidateId: null,
    rationale: [
      "Phase 5AN compares A0, the existing A1 baseline, and a refined A1 reservoir/booster candidate under the same HR75/90 preload envelope.",
      `Refined A1 status: ${refinedStatus}.`,
      `Refined A1 readable points: ${refinedReadable.length > 0 ? refinedReadable.join(", ") : "none"}.`,
      refinedValveWorse.length > 0
        ? `Refined A1 remains worse than A0 on normalized valve contamination at: ${refinedValveWorse.join(", ")}.`
        : "Refined A1 is no worse than A0 on normalized MV/TV valve contamination across the measured envelope.",
      refinedSamplingUnbounded.length > 0
        ? `Refined A1 sampling roughness remains unbounded at: ${refinedSamplingUnbounded.join(", ")}.`
        : "Refined A1 roughness sampling span is bounded across LA/RA measured windows.",
    ],
    blockers: [
      "This artifact does not select or recommend a Phase 6 bridge.",
      "Production atrial bridge wiring remains blocked.",
      "Official case reauthoring, Workbench wiring, state schema migration, AF validation, and atrial Land/RDQ validation remain blocked.",
      "Any remaining refined A1 readability, sampling, or valve-contamination failures need candidate-local follow-up before owner selection.",
    ],
  };
}

function envelopeReadable(
  pointIds: readonly AtrialFigureEightPointId[],
  HR: 75 | 90,
): boolean {
  const suffix = `hr${HR}`;
  return (["normal", "low-preload", "high-preload"] as const).every((preload) =>
    pointIds.includes(`${preload}-${suffix}` as AtrialFigureEightPointId)
  );
}

function totalValveHitsPerBeat(run: AtrialFigureEightRun): number {
  return run.valveAttribution.MV.hitsPerBeat + run.valveAttribution.TV.hitsPerBeat;
}

function totalValveImpulsePerBeat(run: AtrialFigureEightRun): number {
  return run.valveAttribution.MV.diodeImpulsePerBeat + run.valveAttribution.TV.diodeImpulsePerBeat;
}

function phaseLoopArea(
  samples: readonly LoopSample[],
  windows: readonly (readonly [number, number])[],
): number {
  let area = 0;
  for (let i = 1; i < samples.length; i++) {
    const theta = frac(samples[i].phi);
    if (!windows.some(([lo, hi]) => theta >= lo && theta < hi)) continue;
    area += 0.5 * (
      samples[i - 1].volumeMl * samples[i].pressureMmHg
      - samples[i].volumeMl * samples[i - 1].pressureMmHg
    );
  }
  return area;
}

function pvLoopRoughness(samples: readonly LoopSample[]): number {
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

function downsample(samples: readonly LoopSample[], targetHz: number): readonly LoopSample[] {
  if (samples.length <= 2) return samples;
  const duration = samples.at(-1)!.t - samples[0].t;
  const sourceHz = (samples.length - 1) / Math.max(duration, 1e-9);
  const stride = Math.max(1, Math.round(sourceHz / targetHz));
  return samples.filter((_sample, index) => index % stride === 0);
}

function highFrequencyEnergy(values: readonly number[]): number {
  if (values.length < 4) return 0;
  let high = 0;
  let total = 0;
  for (let i = 2; i < values.length; i++) {
    const first = values[i] - values[i - 1];
    const prevFirst = values[i - 1] - values[i - 2];
    high += (first - prevFirst) ** 2;
    total += first ** 2 + prevFirst ** 2;
  }
  return high / Math.max(total, 1e-9);
}

function dPdtSpikeCount(samples: readonly LoopSample[]): number {
  if (samples.length < 4) return 0;
  const dpdt: number[] = [];
  for (let i = 1; i < samples.length; i++) {
    const dt = samples[i].t - samples[i - 1].t;
    if (dt > 0) dpdt.push((samples[i].pressureMmHg - samples[i - 1].pressureMmHg) / dt);
  }
  const abs = dpdt.map(Math.abs);
  const threshold = median(abs) + 6 * mad(abs);
  return abs.filter((value) => value > Math.max(threshold, 20)).length;
}

function countSelfIntersections(xs: readonly number[], ys: readonly number[]): number {
  let count = 0;
  for (let i = 0; i < xs.length - 1; i++) {
    for (let j = i + 2; j < xs.length - 1; j++) {
      if (i === 0 && j === xs.length - 2) continue;
      if (segmentsIntersect(xs[i], ys[i], xs[i + 1], ys[i + 1], xs[j], ys[j], xs[j + 1], ys[j + 1])) {
        count++;
      }
    }
  }
  return count;
}

function segmentsIntersect(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  cx: number,
  cy: number,
  dx: number,
  dy: number,
): boolean {
  const o1 = orient(ax, ay, bx, by, cx, cy);
  const o2 = orient(ax, ay, bx, by, dx, dy);
  const o3 = orient(cx, cy, dx, dy, ax, ay);
  const o4 = orient(cx, cy, dx, dy, bx, by);
  return o1 * o2 < 0 && o3 * o4 < 0;
}

function orient(ax: number, ay: number, bx: number, by: number, cx: number, cy: number): number {
  return (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
}

function readabilityScore(input: {
  readonly pressureRange: number;
  readonly volumeRange: number;
  readonly lobeBalance: number;
  readonly roughnessSamplingSpan: number;
  readonly intersections: number;
  readonly signedLobesOpposed: boolean;
}): number {
  const amplitude = Math.min(
    input.pressureRange / READABILITY_THRESHOLDS.minPressureRangeMmHg,
    input.volumeRange / READABILITY_THRESHOLDS.minVolumeRangeMl,
    1,
  );
  const lobe = clamp01(input.lobeBalance / Math.max(READABILITY_THRESHOLDS.minLobeBalance, 1e-9));
  const sampling = clamp01(1 - input.roughnessSamplingSpan / Math.max(READABILITY_THRESHOLDS.maxRoughnessSamplingSpan, 1e-9));
  const waist = input.intersections > 0 ? 1 : 0;
  const opposition = input.signedLobesOpposed ? 1 : 0.5;
  return mean([amplitude, lobe, sampling, waist, opposition]);
}

function relativeSpan(values: readonly number[]): number {
  const finiteValues = values.filter(Number.isFinite);
  if (finiteValues.length === 0) return Number.POSITIVE_INFINITY;
  const minValue = Math.min(...finiteValues);
  const maxValue = Math.max(...finiteValues);
  return (maxValue - minValue) / Math.max(1, Math.abs(maxValue));
}

function median(values: readonly number[]): number {
  const sorted = [...values.filter(Number.isFinite)].sort((a, b) => a - b);
  if (sorted.length === 0) return 0;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? 0.5 * (sorted[mid - 1] + sorted[mid]) : sorted[mid];
}

function mad(values: readonly number[]): number {
  const m = median(values);
  return median(values.map((value) => Math.abs(value - m)));
}

function valueAt(sample: SimSample, key: string): number {
  const value = (sample as unknown as Record<string, unknown>)[key];
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function isPositiveFinite(value: number | null | undefined): boolean {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
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

function frac(value: number): number {
  return value - Math.floor(value);
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function round(value: number, digits = 6): number {
  if (!Number.isFinite(value)) return value;
  const scale = 10 ** digits;
  return Math.round(value * scale) / scale;
}

export function writeAtrialFigureEightReadabilityPhase5ANEvidence(rootDir = process.cwd()): string {
  const evidence = buildAtrialFigureEightReadabilityPhase5ANEvidence();
  const outputPath = path.join(rootDir, ATRIAL_FIGURE_EIGHT_PHASE5AN_RESULT_PATH);
  mkdirSync(path.dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(evidence, null, 2)}\n`);
  return outputPath;
}

export function readbackAtrialFigureEightReadabilityPhase5ANEvidence(rootDir = process.cwd()): unknown {
  const outputPath = path.join(rootDir, ATRIAL_FIGURE_EIGHT_PHASE5AN_RESULT_PATH);
  const evidence = JSON.parse(readFileSync(outputPath, "utf8")) as AtrialFigureEightEvidence;
  return {
    id: evidence.id,
    phase: evidence.phase,
    claimBoundary: evidence.claimBoundary,
    summary: evidence.summary,
    candidateSummaries: evidence.candidateSummaries,
    runTable: evidence.runs.map((run) => ({
      candidateId: run.candidateId,
      pointId: run.pointId,
      settled: run.settled,
      healthStatus: run.healthStatus,
      LAReadable: run.LA?.educationalFigureEightReadable ?? null,
      RAReadable: run.RA?.educationalFigureEightReadable ?? null,
      LAReadabilityScore: run.LA?.readabilityScore ?? null,
      RAReadabilityScore: run.RA?.readabilityScore ?? null,
      valveHitsPerBeat: round(totalValveHitsPerBeat(run)),
      qDotClampHitFraction: run.qDotClampHitFraction,
    })),
  };
}

function isDirectExecution(): boolean {
  const entrypoint = process.argv[1];
  if (entrypoint && import.meta.url === pathToFileURL(path.resolve(entrypoint)).href) return true;
  const normalizedScriptPath =
    path.normalize("tools/myocardium/buildAtrialFigureEightReadabilityPhase5AN.ts");
  return process.argv.some((arg) => path.normalize(arg).endsWith(normalizedScriptPath));
}

if (isDirectExecution()) {
  if (process.argv.includes("--readback")) {
    console.log(JSON.stringify(readbackAtrialFigureEightReadabilityPhase5ANEvidence(), null, 2));
  } else if (process.argv.includes("--write")) {
    const outputPath = writeAtrialFigureEightReadabilityPhase5ANEvidence();
    console.log(`Wrote ${outputPath}`);
  } else {
    console.log(JSON.stringify(buildAtrialFigureEightReadabilityPhase5ANEvidence(), null, 2));
  }
}
