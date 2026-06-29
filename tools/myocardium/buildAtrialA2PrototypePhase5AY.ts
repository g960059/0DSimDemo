import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  ModelCore,
  defaultParams,
  type ModelCoreExperimentalActiveSourceProvider,
} from "@/engine/ModelCore";
import { measureSteady } from "@/engine/measure";
import {
  atrialPhysiologyBridgeV2CandidateParams,
  createAtrialPhysiologyBridgeV2SourceProvider,
  type AtrialPhysiologyBridgeV2CandidateId,
  type AtrialPhysiologyBridgeV2ContributionSample,
} from "@/engine/myocardium/atrialPhysiologyBridgeV2";
import {
  MODELCORE_RUNTIME_LV_RV_LAND_DEFAULT_MODE,
  resolveModelCoreRuntimeActiveSource,
} from "@/engine/myocardium/runtimeActiveSource";
import type { Chamber } from "@/engine/chambers";
import type { CoreRuntimeParams, SimSample, SimulationHealth } from "@/engine/protocol";
import { DEFAULT_SETTLE_POLICY, type SettlePolicy } from "@/engine/settling";
import { createAtrialBridgeProviders } from "@/tools/myocardium/buildAtrialBridgeShootout";

export const ATRIAL_A2_PROTOTYPE_PHASE5AY_ID =
  "atrial-a2-prototype-phase5ay-result-v1";

export const ATRIAL_A2_PROTOTYPE_PHASE5AY_RESULT_PATH =
  "data/myocardium/protocols/atrial-a2-prototype-phase5ay-result-v1.json";

type AtrialChamber = "LA" | "RA";
type Valve = "MV" | "TV";
type CandidateId =
  | "a1-refined-reference"
  | AtrialPhysiologyBridgeV2CandidateId;
type PointId =
  | "normal-hr75"
  | "low-preload-hr75"
  | "high-preload-hr75"
  | "normal-hr90"
  | "low-preload-hr90"
  | "high-preload-hr90";

type PointSpec = {
  readonly id: PointId;
  readonly targetTBVMl: number;
  readonly HR: 75 | 90;
};

type RangeCompact = {
  readonly min: number | null;
  readonly max: number | null;
};

type LoopMetrics = {
  readonly pressureRangeMmHg: number;
  readonly volumeRangeMl: number;
  readonly boosterLoopSignedArea: number;
  readonly reservoirLoopSignedArea: number;
  readonly lobeBalance: number;
  readonly signedLobesOpposed: boolean;
  readonly pvSelfIntersections: number;
  readonly roughnessSamplingSpan: number;
  readonly educationalFigureEightReadable: boolean;
  readonly readabilityScore: number;
};

type ValveAttribution = {
  readonly hitsPerBeat: number;
  readonly diodeImpulsePerBeat: number;
  readonly qDotClampHitFraction: number;
};

type ContributionSummary = {
  readonly sampleCount: number;
  readonly finiteSampleCount: number;
  readonly selfVolumeRateMlPerSec: RangeCompact;
  readonly basePressureMmHg: RangeCompact;
  readonly passivePressureMmHg: RangeCompact;
  readonly activePressureMmHg: RangeCompact;
  readonly avPlanePressureDeltaMmHg: RangeCompact;
  readonly viscousConduitPressureMmHg: RangeCompact;
  readonly tensionBoosterPressureMmHg: RangeCompact;
  readonly avPlaneExtraPressureMmHg: RangeCompact;
  readonly totalAddedPressureMmHg: RangeCompact;
  readonly boosterGateMean: number | null;
};

type Run = {
  readonly candidateId: CandidateId;
  readonly pointId: PointId;
  readonly HR: 75 | 90;
  readonly targetTBVMl: number;
  readonly settled: boolean;
  readonly settleReason: string;
  readonly settleBeats: number;
  readonly health: Pick<SimulationHealth, "status" | "periodBeats" | "messages">;
  readonly forwardCO_L: number | null;
  readonly forwardCO_R: number | null;
  readonly LVEDPApprox: number | null;
  readonly RVEDPApprox: number | null;
  readonly LA: LoopMetrics | null;
  readonly RA: LoopMetrics | null;
  readonly contribution: Partial<Record<AtrialChamber, ContributionSummary>>;
  readonly valveAttribution: Record<Valve, ValveAttribution>;
  readonly settledLvRvHealthInterpretable: boolean;
};

type CandidateSummary = {
  readonly candidateId: CandidateId;
  readonly role: "a1-diagnostic-bridge-comparator" | "a2-prototype-diagnostic";
  readonly settledPointIds: readonly PointId[];
  readonly healthOkPointIds: readonly PointId[];
  readonly readableLaPointIds: readonly PointId[];
  readonly readableRaPointIds: readonly PointId[];
  readonly readableBothPointIds: readonly PointId[];
  readonly meanLaReadabilityScore: number;
  readonly meanRaReadabilityScore: number;
  readonly valveImpulsePerBeatMean: number;
  readonly valveHitPerBeatMean: number;
  readonly contributionFinitePointIds: readonly PointId[];
  readonly selectableByThisArtifact: false;
};

type Evidence = {
  readonly schemaVersion: 1;
  readonly id: typeof ATRIAL_A2_PROTOTYPE_PHASE5AY_ID;
  readonly phase: "Phase 5AY";
  readonly claimBoundary: "atrial-a2-prototype-diagnostic-no-selection";
  readonly protocol: {
    readonly runtimeActiveSourceMode: typeof MODELCORE_RUNTIME_LV_RV_LAND_DEFAULT_MODE;
    readonly pointSource: "hr75-hr90-normal-low-high-preload";
    readonly candidateIds: readonly CandidateId[];
    readonly a1Comparator: "atrial-refined-reservoir-booster-bridge-v1";
    readonly dtSec: typeof DT_SEC;
    readonly sampleHz: typeof SAMPLE_HZ;
    readonly measureBeats: typeof MEASURE_BEATS;
    readonly noRuntimeDefaultFlip: true;
    readonly noProductionBridgeSelection: true;
    readonly noPermanentVerifierOrNpmScriptAdded: true;
  };
  readonly points: readonly PointSpec[];
  readonly runs: readonly Run[];
  readonly candidateSummaries: readonly CandidateSummary[];
  readonly summary: {
    readonly a1ReferenceCandidateId: "a1-refined-reference";
    readonly bestA2CandidateId: AtrialPhysiologyBridgeV2CandidateId | null;
    readonly bestA2CandidateStatus: "candidate-local-signal" | "measured-no-readable-improvement";
    readonly bestA2ReadableBothPointIds: readonly PointId[];
    readonly currentInterpretation: string;
    readonly recommendedNext: readonly string[];
    readonly blockers: readonly string[];
  };
  readonly boundary: {
    readonly noAllChamberRuntimeDefaultFlip: true;
    readonly noProductionAtrialBridgeWiring: true;
    readonly noAtrialLandPhysiologyAcceptance: true;
    readonly noAfValidationClaim: true;
    readonly noLvRvLandDefaultGate: true;
    readonly noOfficialMorphologyAcceptance: true;
  };
  readonly doesNotUnlock: readonly string[];
  readonly normalizedSha256: string;
};

const DT_SEC = 0.001 as const;
const SAMPLE_HZ = 1000 as const;
const MEASURE_BEATS = 3 as const;
const ROUGHNESS_SAMPLE_HZ = [240, 480, 960] as const;
const READABILITY = {
  minPressureRangeMmHg: 1.5,
  minVolumeRangeMl: 12,
  minLobeBalance: 0.08,
  maxRoughnessSamplingSpan: 0.45,
} as const;
const SETTLE_POLICY: SettlePolicy = {
  ...DEFAULT_SETTLE_POLICY,
  capSeconds: 120,
  postSettleBeats: 2,
};

const POINTS: readonly PointSpec[] = [
  { id: "normal-hr75", targetTBVMl: 5600, HR: 75 },
  { id: "low-preload-hr75", targetTBVMl: 4800, HR: 75 },
  { id: "high-preload-hr75", targetTBVMl: 6200, HR: 75 },
  { id: "normal-hr90", targetTBVMl: 5600, HR: 90 },
  { id: "low-preload-hr90", targetTBVMl: 4800, HR: 90 },
  { id: "high-preload-hr90", targetTBVMl: 6200, HR: 90 },
] as const;

const CANDIDATES: readonly CandidateId[] = [
  "a1-refined-reference",
  "atrial-a2-light-v1",
  "atrial-a2-conduit-v1",
  "atrial-a2-booster-v1",
] as const;

export function buildAtrialA2PrototypePhase5AYEvidence(): Evidence {
  const runs = CANDIDATES.flatMap((candidateId) => POINTS.map((point) => runPoint(candidateId, point)));
  const candidateSummaries = CANDIDATES.map((candidateId) => summarizeCandidate(candidateId, runs));
  const a1 = candidateSummaries.find((summary) => summary.candidateId === "a1-refined-reference");
  const a2Candidates = candidateSummaries
    .filter((summary): summary is CandidateSummary & { readonly candidateId: AtrialPhysiologyBridgeV2CandidateId } =>
      summary.candidateId !== "a1-refined-reference"
    )
    .sort((left, right) =>
      right.readableBothPointIds.length - left.readableBothPointIds.length
      || right.readableLaPointIds.length + right.readableRaPointIds.length
        - left.readableLaPointIds.length - left.readableRaPointIds.length
      || right.meanLaReadabilityScore + right.meanRaReadabilityScore
        - left.meanLaReadabilityScore - left.meanRaReadabilityScore
    );
  const best = a2Candidates[0] ?? null;
  const a1Score = (a1?.meanLaReadabilityScore ?? 0) + (a1?.meanRaReadabilityScore ?? 0);
  const bestScore = (best?.meanLaReadabilityScore ?? 0) + (best?.meanRaReadabilityScore ?? 0);
  const bestA2CandidateStatus =
    best != null
    && (
      best.readableBothPointIds.length > (a1?.readableBothPointIds.length ?? 0)
      || bestScore > a1Score + 0.02
    )
      ? "candidate-local-signal" as const
      : "measured-no-readable-improvement" as const;
  const evidenceWithoutHash: Omit<Evidence, "normalizedSha256"> = {
    schemaVersion: 1,
    id: ATRIAL_A2_PROTOTYPE_PHASE5AY_ID,
    phase: "Phase 5AY",
    claimBoundary: "atrial-a2-prototype-diagnostic-no-selection",
    protocol: {
      runtimeActiveSourceMode: MODELCORE_RUNTIME_LV_RV_LAND_DEFAULT_MODE,
      pointSource: "hr75-hr90-normal-low-high-preload",
      candidateIds: CANDIDATES,
      a1Comparator: "atrial-refined-reservoir-booster-bridge-v1",
      dtSec: DT_SEC,
      sampleHz: SAMPLE_HZ,
      measureBeats: MEASURE_BEATS,
      noRuntimeDefaultFlip: true,
      noProductionBridgeSelection: true,
      noPermanentVerifierOrNpmScriptAdded: true,
    },
    points: POINTS,
    runs,
    candidateSummaries,
    summary: {
      a1ReferenceCandidateId: "a1-refined-reference",
      bestA2CandidateId: best?.candidateId ?? null,
      bestA2CandidateStatus,
      bestA2ReadableBothPointIds: best?.readableBothPointIds ?? [],
      currentInterpretation: interpretation(best, a1, bestA2CandidateStatus),
      recommendedNext: [
        "source absolute atrial waveform and reservoir/conduit/booster targets before parameter tuning or production selection",
        "if A2 shows candidate-local signal, run a narrower A2-on/off sensitivity pass against valve contamination and sampling invariance",
        "keep AV-plane reservoir coupling as shared mechanism for A2 and later LandAtrial shadow work",
      ],
      blockers: [
        "absolute atrial waveform targets remain unsourced",
        "production atrial bridge selection remains blocked",
        "LandAtrial remains shadow target rather than user-0 gate",
      ],
    },
    boundary: {
      noAllChamberRuntimeDefaultFlip: true,
      noProductionAtrialBridgeWiring: true,
      noAtrialLandPhysiologyAcceptance: true,
      noAfValidationClaim: true,
      noLvRvLandDefaultGate: true,
      noOfficialMorphologyAcceptance: true,
    },
    doesNotUnlock: [
      "all-chamber Land runtime default",
      "production atrial bridge wiring",
      "atrial Land physiology acceptance",
      "AF validation",
      "LV/RV Land default gating",
      "official morphology acceptance",
    ],
  };
  return {
    ...evidenceWithoutHash,
    normalizedSha256: hashStable(evidenceWithoutHash),
  };
}

function runPoint(candidateId: CandidateId, point: PointSpec): Run {
  const params: Partial<CoreRuntimeParams> = { ...defaultParams(), HR: point.HR };
  const runtimeResolution = resolveModelCoreRuntimeActiveSource({
    mode: MODELCORE_RUNTIME_LV_RV_LAND_DEFAULT_MODE,
    runtimeParams: params,
  });
  const collector = new ContributionCollector();
  const candidateProviders = createCandidateProviders(candidateId, collector);
  const core = new ModelCore(params, {
    ...runtimeResolution.experimentalOptions,
    activeSourceProviders: {
      ...(runtimeResolution.experimentalOptions.activeSourceProviders ?? {}),
      ...candidateProviders,
    },
  });
  core.initializeVenousPressuresForTargetTBV(point.targetTBVMl);
  const settleStatus = core.settleToSteady(SETTLE_POLICY, DT_SEC, 480);
  collector.reset();
  const settled = settleStatus.settled && settleStatus.actualSeconds != null;
  const measurement = settled
    ? measureSteady(core, settleStatus as typeof settleStatus & { actualSeconds: number }, {
      dt: DT_SEC,
      sampleHz: SAMPLE_HZ,
      measureBeats: MEASURE_BEATS,
      requireProjectorQuiet: false,
    })
    : null;
  const samples = measurement?.samples
    ?? core.runFor(MEASURE_BEATS * 60 / point.HR, DT_SEC, SAMPLE_HZ, { recordHistory: false });
  const health = measurement?.health ?? core.health();
  const metrics = measurement?.metrics ?? null;
  return {
    candidateId,
    pointId: point.id,
    HR: point.HR,
    targetTBVMl: point.targetTBVMl,
    settled,
    settleReason: settleStatus.reason,
    settleBeats: settleStatus.beats,
    health: {
      status: health.status,
      periodBeats: health.periodBeats,
      messages: health.messages,
    },
    forwardCO_L: finiteOrNull(measurement?.forwardCO_L),
    forwardCO_R: finiteOrNull(measurement?.forwardCO_R),
    LVEDPApprox: finiteOrNull(metrics?.LVEDPApprox),
    RVEDPApprox: finiteOrNull(metrics?.RVEDPApprox),
    LA: loopMetrics(samples, "LA"),
    RA: loopMetrics(samples, "RA"),
    contribution: {
      LA: collector.summary("LA"),
      RA: collector.summary("RA"),
    },
    valveAttribution: {
      MV: valveAttribution(samples, "MV"),
      TV: valveAttribution(samples, "TV"),
    },
    settledLvRvHealthInterpretable:
      settled
      && health.status === "ok"
      && metrics != null
      && isPositiveFinite(measurement?.forwardCO_L)
      && isPositiveFinite(measurement?.forwardCO_R)
      && Number.isFinite(metrics.LVEDPApprox)
      && Number.isFinite(metrics.RVEDPApprox),
  };
}

function createCandidateProviders(
  candidateId: CandidateId,
  instrumentation: ContributionCollector,
): Partial<Record<Chamber, ModelCoreExperimentalActiveSourceProvider>> {
  if (candidateId === "a1-refined-reference") {
    return createAtrialBridgeProviders("atrial-refined-reservoir-booster-bridge-v1");
  }
  return {
    LA: createAtrialPhysiologyBridgeV2SourceProvider(
      "LA",
      atrialPhysiologyBridgeV2CandidateParams(candidateId, "LA"),
      instrumentation,
    ),
    RA: createAtrialPhysiologyBridgeV2SourceProvider(
      "RA",
      atrialPhysiologyBridgeV2CandidateParams(candidateId, "RA"),
      instrumentation,
    ),
  };
}

function summarizeCandidate(candidateId: CandidateId, runs: readonly Run[]): CandidateSummary {
  const candidateRuns = runs.filter((run) => run.candidateId === candidateId);
  return {
    candidateId,
    role: candidateId === "a1-refined-reference" ? "a1-diagnostic-bridge-comparator" : "a2-prototype-diagnostic",
    settledPointIds: candidateRuns.filter((run) => run.settled).map((run) => run.pointId),
    healthOkPointIds: candidateRuns.filter((run) => run.health.status === "ok").map((run) => run.pointId),
    readableLaPointIds: candidateRuns
      .filter((run) => run.LA?.educationalFigureEightReadable)
      .map((run) => run.pointId),
    readableRaPointIds: candidateRuns
      .filter((run) => run.RA?.educationalFigureEightReadable)
      .map((run) => run.pointId),
    readableBothPointIds: candidateRuns
      .filter((run) => run.LA?.educationalFigureEightReadable && run.RA?.educationalFigureEightReadable)
      .map((run) => run.pointId),
    meanLaReadabilityScore: round(mean(candidateRuns.map((run) => run.LA?.readabilityScore ?? Number.NaN))),
    meanRaReadabilityScore: round(mean(candidateRuns.map((run) => run.RA?.readabilityScore ?? Number.NaN))),
    valveImpulsePerBeatMean: round(mean(candidateRuns.map(totalValveImpulsePerBeat))),
    valveHitPerBeatMean: round(mean(candidateRuns.map(totalValveHitsPerBeat))),
    contributionFinitePointIds: candidateRuns
      .filter((run) => finiteContribution(run.contribution.LA) && finiteContribution(run.contribution.RA))
      .map((run) => run.pointId),
    selectableByThisArtifact: false,
  };
}

class ContributionCollector {
  private samples: AtrialPhysiologyBridgeV2ContributionSample[] = [];

  record = (sample: AtrialPhysiologyBridgeV2ContributionSample): void => {
    this.samples.push(sample);
  };

  reset(): void {
    this.samples = [];
  }

  summary(chamber: AtrialChamber): ContributionSummary | undefined {
    const samples = this.samples.filter((sample) => sample.chamber === chamber);
    if (samples.length === 0) return undefined;
    const finiteSampleCount = samples.filter((sample) =>
      Number.isFinite(sample.selfVolumeRateMlPerSec)
      && Number.isFinite(sample.basePressureMmHg)
      && Number.isFinite(sample.passivePressureMmHg)
      && Number.isFinite(sample.activePressureMmHg)
      && Number.isFinite(sample.avPlanePressureDeltaMmHg)
      && Number.isFinite(sample.viscousConduitPressureMmHg)
      && Number.isFinite(sample.tensionBoosterPressureMmHg)
      && Number.isFinite(sample.avPlaneExtraPressureMmHg)
      && Number.isFinite(sample.totalAddedPressureMmHg)
      && Number.isFinite(sample.pressureMmHg)
    ).length;
    return {
      sampleCount: samples.length,
      finiteSampleCount,
      selfVolumeRateMlPerSec: rangeCompact(samples.map((sample) => sample.selfVolumeRateMlPerSec)),
      basePressureMmHg: rangeCompact(samples.map((sample) => sample.basePressureMmHg)),
      passivePressureMmHg: rangeCompact(samples.map((sample) => sample.passivePressureMmHg)),
      activePressureMmHg: rangeCompact(samples.map((sample) => sample.activePressureMmHg)),
      avPlanePressureDeltaMmHg: rangeCompact(samples.map((sample) => sample.avPlanePressureDeltaMmHg)),
      viscousConduitPressureMmHg: rangeCompact(samples.map((sample) => sample.viscousConduitPressureMmHg)),
      tensionBoosterPressureMmHg: rangeCompact(samples.map((sample) => sample.tensionBoosterPressureMmHg)),
      avPlaneExtraPressureMmHg: rangeCompact(samples.map((sample) => sample.avPlaneExtraPressureMmHg)),
      totalAddedPressureMmHg: rangeCompact(samples.map((sample) => sample.totalAddedPressureMmHg)),
      boosterGateMean: finiteOrNull(mean(samples.map((sample) => sample.boosterGate01))),
    };
  }
}

function loopMetrics(samples: readonly SimSample[], chamber: AtrialChamber): LoopMetrics | null {
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
  const roughnessValues = ROUGHNESS_SAMPLE_HZ.map((hz) => pvLoopRoughness(downsample(loopSamples, hz)));
  const roughnessSamplingSpan = relativeSpan(roughnessValues);
  const pressureRange = Math.max(...pressures) - Math.min(...pressures);
  const volumeRange = Math.max(...volumes) - Math.min(...volumes);
  const intersections = countSelfIntersections(volumes, pressures);
  const signedLobesOpposed = boosterSigned * reservoirSigned < 0;
  const educationalFigureEightReadable =
    pressureRange >= READABILITY.minPressureRangeMmHg
    && volumeRange >= READABILITY.minVolumeRangeMl
    && signedLobesOpposed
    && lobeBalance >= READABILITY.minLobeBalance
    && roughnessSamplingSpan <= READABILITY.maxRoughnessSamplingSpan
    && intersections > 0;
  return {
    pressureRangeMmHg: round(pressureRange),
    volumeRangeMl: round(volumeRange),
    boosterLoopSignedArea: round(boosterSigned),
    reservoirLoopSignedArea: round(reservoirSigned),
    lobeBalance: round(lobeBalance),
    signedLobesOpposed,
    pvSelfIntersections: intersections,
    roughnessSamplingSpan: round(roughnessSamplingSpan),
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

function valveAttribution(samples: readonly SimSample[], valve: Valve): ValveAttribution {
  const hitValues = samples.map((sample) => valueAt(sample, `${valve}_diodeImpulse`) > 0 ? 1 : 0);
  const impulses = samples.map((sample) => Math.max(0, valueAt(sample, `${valve}_diodeImpulse`)));
  const qDotHitValues = samples.map((sample) => valueAt(sample, `${valve}_qDotClampHit01`) > 0 ? 1 : 0);
  return {
    hitsPerBeat: round(hitValues.reduce((sum, value) => sum + value, 0) / MEASURE_BEATS),
    diodeImpulsePerBeat: round(impulses.reduce((sum, value) => sum + value, 0) / MEASURE_BEATS),
    qDotClampHitFraction: round(qDotHitValues.reduce((sum, value) => sum + value, 0) / Math.max(samples.length, 1)),
  };
}

function totalValveHitsPerBeat(run: Run): number {
  return run.valveAttribution.MV.hitsPerBeat + run.valveAttribution.TV.hitsPerBeat;
}

function totalValveImpulsePerBeat(run: Run): number {
  return run.valveAttribution.MV.diodeImpulsePerBeat + run.valveAttribution.TV.diodeImpulsePerBeat;
}

function finiteContribution(summary: ContributionSummary | undefined): boolean {
  return summary != null && summary.sampleCount > 0 && summary.finiteSampleCount === summary.sampleCount;
}

function interpretation(
  best: (CandidateSummary & { readonly candidateId: AtrialPhysiologyBridgeV2CandidateId }) | null,
  a1: CandidateSummary | undefined,
  status: Evidence["summary"]["bestA2CandidateStatus"],
): string {
  if (!best) {
    return "Phase 5AY measured the A1 refined bridge comparator but no A2 prototype candidate was available.";
  }
  if (status === "candidate-local-signal") {
    return [
      `${best.candidateId} produced a candidate-local A2 signal versus the A1 refined bridge comparator.`,
      `Readable both-chamber points: ${best.readableBothPointIds.length > 0 ? best.readableBothPointIds.join(", ") : "none"}.`,
      `A1 readable both-chamber points: ${(a1?.readableBothPointIds.length ?? 0) > 0 ? a1!.readableBothPointIds.join(", ") : "none"}.`,
      "This is an off-by-default diagnostic prototype only, not an atrial bridge selection.",
    ].join(" ");
  }
  return [
    "The A2 prototypes were finite under the HR75/90 preload envelope but did not produce a readable-improvement signal over the A1 refined bridge comparator.",
    "The result is still useful as a live implementation/readback smoke for self dV/dt, tension-state booster, and AV-plane delta terms.",
  ].join(" ");
}

function phaseLoopArea(
  samples: readonly { readonly volumeMl: number; readonly pressureMmHg: number; readonly phi: number }[],
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

function pvLoopRoughness(
  samples: readonly { readonly volumeMl: number; readonly pressureMmHg: number }[],
): number {
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
    const s1 = (p1 - p0) / Math.max(Math.abs(v1 - v0), 1e-6);
    const s2 = (p2 - p1) / Math.max(Math.abs(v2 - v1), 1e-6);
    curvature += Math.abs(s2 - s1);
    slope += Math.abs(s2);
  }
  return curvature / Math.max(slope, 1e-9);
}

function downsample<T extends { readonly t: number }>(samples: readonly T[], targetHz: number): readonly T[] {
  if (samples.length <= 2) return samples;
  const duration = samples.at(-1)!.t - samples[0].t;
  const sourceHz = samples.length / Math.max(duration, 1e-9);
  const stride = Math.max(1, Math.round(sourceHz / targetHz));
  return samples.filter((_sample, index) => index % stride === 0);
}

function relativeSpan(values: readonly number[]): number {
  const finite = values.filter(Number.isFinite);
  if (finite.length === 0) return Number.POSITIVE_INFINITY;
  const min = Math.min(...finite);
  const max = Math.max(...finite);
  return (max - min) / Math.max(Math.abs(max), Math.abs(min), 1e-9);
}

function readabilityScore(input: {
  readonly pressureRange: number;
  readonly volumeRange: number;
  readonly lobeBalance: number;
  readonly roughnessSamplingSpan: number;
  readonly intersections: number;
  readonly signedLobesOpposed: boolean;
}): number {
  const pressureScore = clamp01(input.pressureRange / READABILITY.minPressureRangeMmHg);
  const volumeScore = clamp01(input.volumeRange / READABILITY.minVolumeRangeMl);
  const balanceScore = clamp01(input.lobeBalance / READABILITY.minLobeBalance);
  const roughnessScore = clamp01(1 - input.roughnessSamplingSpan / READABILITY.maxRoughnessSamplingSpan);
  const intersectionScore = input.intersections > 0 ? 1 : 0;
  const signScore = input.signedLobesOpposed ? 1 : 0;
  return (pressureScore + volumeScore + balanceScore + roughnessScore + intersectionScore + signScore) / 6;
}

function countSelfIntersections(xs: readonly number[], ys: readonly number[]): number {
  let count = 0;
  for (let i = 0; i < xs.length - 3; i++) {
    for (let j = i + 2; j < xs.length - 1; j++) {
      if (j === i + 1) continue;
      if (segmentsIntersect(
        xs[i], ys[i],
        xs[i + 1], ys[i + 1],
        xs[j], ys[j],
        xs[j + 1], ys[j + 1],
      )) {
        count += 1;
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
  const abx = bx - ax;
  const aby = by - ay;
  const cdx = dx - cx;
  const cdy = dy - cy;
  const denom = abx * cdy - aby * cdx;
  if (Math.abs(denom) < 1e-9) return false;
  const acx = cx - ax;
  const acy = cy - ay;
  const t = (acx * cdy - acy * cdx) / denom;
  const u = (acx * aby - acy * abx) / denom;
  return t > 0 && t < 1 && u > 0 && u < 1;
}

function valueAt(sample: SimSample, key: string): number {
  const value = (sample as unknown as Record<string, number | undefined>)[key];
  return Number.isFinite(value) ? value! : 0;
}

function rangeCompact(values: readonly number[]): RangeCompact {
  const finite = values.filter(Number.isFinite);
  if (finite.length === 0) return { min: null, max: null };
  return {
    min: round(Math.min(...finite)),
    max: round(Math.max(...finite)),
  };
}

function finiteOrNull(value: number | null | undefined): number | null {
  return value != null && Number.isFinite(value) ? round(value) : null;
}

function isPositiveFinite(value: number | null | undefined): boolean {
  return value != null && Number.isFinite(value) && value > 0;
}

function mean(values: readonly number[]): number {
  const finite = values.filter(Number.isFinite);
  return finite.length === 0 ? Number.NaN : finite.reduce((sum, value) => sum + value, 0) / finite.length;
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function frac(value: number): number {
  return value - Math.floor(value);
}

function round(value: number): number {
  return Number.isFinite(value) ? Number(value.toFixed(6)) : value;
}

function hashStable(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(sortForHash(value))).digest("hex");
}

function sortForHash(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortForHash);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, sortForHash(entry)]),
  );
}

function writeEvidence(): Evidence {
  const evidence = buildAtrialA2PrototypePhase5AYEvidence();
  const outPath = path.resolve(process.cwd(), ATRIAL_A2_PROTOTYPE_PHASE5AY_RESULT_PATH);
  mkdirSync(path.dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(evidence, null, 2)}\n`);
  return evidence;
}

const isDirectRun = process.argv[1] != null
  && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  const evidence = writeEvidence();
  console.log(JSON.stringify({
    id: evidence.id,
    hash: evidence.normalizedSha256,
    bestA2CandidateId: evidence.summary.bestA2CandidateId,
    bestA2CandidateStatus: evidence.summary.bestA2CandidateStatus,
    bestA2ReadableBothPointIds: evidence.summary.bestA2ReadableBothPointIds,
  }, null, 2));
}
