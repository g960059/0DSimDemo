import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import targetPack from "@/data/myocardium/targets/atrial-waveform-targets-v1.json";
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
} from "@/engine/myocardium/atrialPhysiologyBridgeV2";
import {
  MODELCORE_RUNTIME_LV_RV_LAND_DEFAULT_MODE,
  resolveModelCoreRuntimeActiveSource,
} from "@/engine/myocardium/runtimeActiveSource";
import type { Chamber } from "@/engine/chambers";
import type { CoreRuntimeParams, SimSample, SimulationHealth } from "@/engine/protocol";
import { DEFAULT_SETTLE_POLICY, type SettlePolicy } from "@/engine/settling";
import { createAtrialBridgeProviders } from "@/tools/myocardium/buildAtrialBridgeShootout";

export const ATRIAL_WAVEFORM_TARGET_PACK_PHASE5AZ_ID =
  "atrial-waveform-target-pack-phase5az-result-v1";

export const ATRIAL_WAVEFORM_TARGET_PACK_PHASE5AZ_RESULT_PATH =
  "data/myocardium/protocols/atrial-waveform-target-pack-phase5az-result-v1.json";

type AtrialChamber = "LA" | "RA";
type CandidateId =
  | "runtime-default-atrial-active-reference"
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

type Range = readonly [number, number];

type AtrialVolumeFunction = {
  readonly beatCount: number;
  readonly maxVolumeMl: number | null;
  readonly preAtrialContractionVolumeMl: number | null;
  readonly minVolumeMl: number | null;
  readonly totalEmptyingFraction: number | null;
  readonly passiveEmptyingFraction: number | null;
  readonly activeEmptyingFraction: number | null;
  readonly totalBroadPass: boolean;
  readonly passiveBroadPass: boolean;
  readonly activeBroadPass: boolean;
  readonly allBroadPass: boolean;
  readonly broadRangeDistance: number | null;
};

type PressureWaveTiming = {
  readonly aWaveMaxMmHg: number | null;
  readonly vWaveMaxMmHg: number | null;
  readonly xDescentMinMmHg: number | null;
  readonly yDescentMinMmHg: number | null;
  readonly relationSignal: "la-v-ge-a" | "ra-a-ge-v" | "not-supported" | "missing";
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
  readonly LA: {
    readonly volumeFunction: AtrialVolumeFunction;
    readonly pressureWaveTiming: PressureWaveTiming;
  };
  readonly RA: {
    readonly volumeFunction: AtrialVolumeFunction;
    readonly pressureWaveTiming: PressureWaveTiming;
  };
};

type CandidateSummary = {
  readonly candidateId: CandidateId;
  readonly settledPointIds: readonly PointId[];
  readonly healthOkPointIds: readonly PointId[];
  readonly laVolumeFunctionPassPointIds: readonly PointId[];
  readonly raVolumeFunctionPassPointIds: readonly PointId[];
  readonly bothAtriaVolumeFunctionPassPointIds: readonly PointId[];
  readonly laPressureRelationSignalPointIds: readonly PointId[];
  readonly raPressureRelationSignalPointIds: readonly PointId[];
  readonly meanLaBroadRangeDistance: number | null;
  readonly meanRaBroadRangeDistance: number | null;
  readonly selectableByThisArtifact: false;
};

type Evidence = {
  readonly schemaVersion: 1;
  readonly id: typeof ATRIAL_WAVEFORM_TARGET_PACK_PHASE5AZ_ID;
  readonly phase: "Phase 5AZ";
  readonly claimBoundary: "sourced-atrial-target-pack-and-current-scoring-no-selection";
  readonly targetPackId: typeof targetPack.id;
  readonly protocol: {
    readonly runtimeActiveSourceMode: typeof MODELCORE_RUNTIME_LV_RV_LAND_DEFAULT_MODE;
    readonly pointSource: "hr75-hr90-normal-low-high-preload";
    readonly candidateIds: readonly CandidateId[];
    readonly dtSec: typeof DT_SEC;
    readonly sampleHz: typeof SAMPLE_HZ;
    readonly measureBeats: typeof MEASURE_BEATS;
    readonly scoredTargets: readonly [
      "volume-derived-total-emptying-fraction",
      "volume-derived-passive-emptying-fraction",
      "volume-derived-active-emptying-fraction",
      "pressure-wave-a-v-relation-orientation",
    ];
    readonly strainTargetsStoredButNotScored: true;
    readonly noRuntimeDefaultFlip: true;
    readonly noProductionBridgeSelection: true;
    readonly noPermanentVerifierOrNpmScriptAdded: true;
  };
  readonly targetPackDigest: {
    readonly sourceCount: number;
    readonly leftAtriumVolumeBroadRanges: Record<"total" | "passive" | "active", Range>;
    readonly rightAtriumVolumeBroadRanges: Record<"total" | "passive" | "active", Range>;
    readonly strainTargetsStoredForLater: true;
  };
  readonly points: readonly PointSpec[];
  readonly runs: readonly Run[];
  readonly candidateSummaries: readonly CandidateSummary[];
  readonly summary: {
    readonly bestCandidateByVolumeFunctionId: CandidateId | null;
    readonly bestCandidateBothAtriaPassPointIds: readonly PointId[];
    readonly currentInterpretation: string;
    readonly recommendedNext: readonly string[];
    readonly blockers: readonly string[];
  };
  readonly boundary: {
    readonly noAtrialBridgeSelection: true;
    readonly noAtrialParameterTuning: true;
    readonly noAllChamberRuntimeDefaultFlip: true;
    readonly noOfficialMorphologyAcceptance: true;
    readonly noAfValidationClaim: true;
  };
  readonly normalizedSha256: string;
};

const DT_SEC = 0.001 as const;
const SAMPLE_HZ = 1000 as const;
const MEASURE_BEATS = 3 as const;
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
  "runtime-default-atrial-active-reference",
  "a1-refined-reference",
  "atrial-a2-light-v1",
  "atrial-a2-conduit-v1",
  "atrial-a2-booster-v1",
] as const;

export function buildAtrialWaveformTargetPackPhase5AZEvidence(): Evidence {
  const runs = CANDIDATES.flatMap((candidateId) => POINTS.map((point) => runPoint(candidateId, point)));
  const candidateSummaries = CANDIDATES.map((candidateId) => summarizeCandidate(candidateId, runs));
  const best = candidateSummaries
    .slice()
    .sort((left, right) =>
      right.bothAtriaVolumeFunctionPassPointIds.length - left.bothAtriaVolumeFunctionPassPointIds.length
      || (left.meanLaBroadRangeDistance ?? Number.POSITIVE_INFINITY)
        + (left.meanRaBroadRangeDistance ?? Number.POSITIVE_INFINITY)
        - (right.meanLaBroadRangeDistance ?? Number.POSITIVE_INFINITY)
        - (right.meanRaBroadRangeDistance ?? Number.POSITIVE_INFINITY)
    )[0] ?? null;
  const evidenceWithoutHash: Omit<Evidence, "normalizedSha256"> = {
    schemaVersion: 1,
    id: ATRIAL_WAVEFORM_TARGET_PACK_PHASE5AZ_ID,
    phase: "Phase 5AZ",
    claimBoundary: "sourced-atrial-target-pack-and-current-scoring-no-selection",
    targetPackId: targetPack.id,
    protocol: {
      runtimeActiveSourceMode: MODELCORE_RUNTIME_LV_RV_LAND_DEFAULT_MODE,
      pointSource: "hr75-hr90-normal-low-high-preload",
      candidateIds: CANDIDATES,
      dtSec: DT_SEC,
      sampleHz: SAMPLE_HZ,
      measureBeats: MEASURE_BEATS,
      scoredTargets: [
        "volume-derived-total-emptying-fraction",
        "volume-derived-passive-emptying-fraction",
        "volume-derived-active-emptying-fraction",
        "pressure-wave-a-v-relation-orientation",
      ],
      strainTargetsStoredButNotScored: true,
      noRuntimeDefaultFlip: true,
      noProductionBridgeSelection: true,
      noPermanentVerifierOrNpmScriptAdded: true,
    },
    targetPackDigest: {
      sourceCount: targetPack.sources.length,
      leftAtriumVolumeBroadRanges: {
        total: asRange(targetPack.volumeDerivedFunctionTargets.leftAtrium.totalEmptyingFraction.broadRange),
        passive: asRange(targetPack.volumeDerivedFunctionTargets.leftAtrium.passiveEmptyingFraction.broadRange),
        active: asRange(targetPack.volumeDerivedFunctionTargets.leftAtrium.activeEmptyingFraction.broadRange),
      },
      rightAtriumVolumeBroadRanges: {
        total: asRange(targetPack.volumeDerivedFunctionTargets.rightAtrium.totalEmptyingFraction.broadRange),
        passive: asRange(targetPack.volumeDerivedFunctionTargets.rightAtrium.passiveEmptyingFraction.broadRange),
        active: asRange(targetPack.volumeDerivedFunctionTargets.rightAtrium.activeEmptyingFraction.broadRange),
      },
      strainTargetsStoredForLater: true,
    },
    points: POINTS,
    runs,
    candidateSummaries,
    summary: {
      bestCandidateByVolumeFunctionId: best?.candidateId ?? null,
      bestCandidateBothAtriaPassPointIds: best?.bothAtriaVolumeFunctionPassPointIds ?? [],
      currentInterpretation: interpretation(best),
      recommendedNext: [
        "use the target pack to constrain any next A2/AV-plane or LandAtrial tuning; do not tune against visual loop shape alone",
        "add explicit reservoir/conduit/booster decomposition to later atrial candidate evidence rather than promoting A1/A2 from readability alone",
        "keep strain targets stored until a wall/AV-plane strain proxy exists; current scoring is volume-derived only",
      ],
      blockers: [
        "no candidate is selected by this target-pack scoring artifact",
        "strain targets are sourced but not directly scored in the current 0D chamber geometry",
        "pressure wave timing remains orientation-only, not clinical waveform acceptance",
      ],
    },
    boundary: {
      noAtrialBridgeSelection: true,
      noAtrialParameterTuning: true,
      noAllChamberRuntimeDefaultFlip: true,
      noOfficialMorphologyAcceptance: true,
      noAfValidationClaim: true,
    },
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
  const core = new ModelCore(params, {
    ...runtimeResolution.experimentalOptions,
    activeSourceProviders: {
      ...(runtimeResolution.experimentalOptions.activeSourceProviders ?? {}),
      ...createCandidateProviders(candidateId),
    },
  });
  core.initializeVenousPressuresForTargetTBV(point.targetTBVMl);
  const settleStatus = core.settleToSteady(SETTLE_POLICY, DT_SEC, 480);
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
    LA: {
      volumeFunction: atrialVolumeFunction(samples, "LA"),
      pressureWaveTiming: pressureWaveTiming(samples, "LA"),
    },
    RA: {
      volumeFunction: atrialVolumeFunction(samples, "RA"),
      pressureWaveTiming: pressureWaveTiming(samples, "RA"),
    },
  };
}

function createCandidateProviders(candidateId: CandidateId):
Partial<Record<Chamber, ModelCoreExperimentalActiveSourceProvider>> {
  if (candidateId === "runtime-default-atrial-active-reference") return {};
  if (candidateId === "a1-refined-reference") {
    return createAtrialBridgeProviders("atrial-refined-reservoir-booster-bridge-v1");
  }
  return {
    LA: createAtrialPhysiologyBridgeV2SourceProvider(
      "LA",
      atrialPhysiologyBridgeV2CandidateParams(candidateId, "LA"),
    ),
    RA: createAtrialPhysiologyBridgeV2SourceProvider(
      "RA",
      atrialPhysiologyBridgeV2CandidateParams(candidateId, "RA"),
    ),
  };
}

function atrialVolumeFunction(samples: readonly SimSample[], chamber: AtrialChamber): AtrialVolumeFunction {
  const beatMetrics = beatGroups(samples)
    .map((beatSamples) => atrialVolumeFunctionForBeat(beatSamples, chamber))
    .filter((metric): metric is Required<Pick<AtrialVolumeFunction,
      "maxVolumeMl" | "preAtrialContractionVolumeMl" | "minVolumeMl"
      | "totalEmptyingFraction" | "passiveEmptyingFraction" | "activeEmptyingFraction"
    >> => metric != null);
  const averaged = {
    maxVolumeMl: finiteOrNull(mean(beatMetrics.map((metric) => metric.maxVolumeMl))),
    preAtrialContractionVolumeMl: finiteOrNull(mean(beatMetrics.map((metric) => metric.preAtrialContractionVolumeMl))),
    minVolumeMl: finiteOrNull(mean(beatMetrics.map((metric) => metric.minVolumeMl))),
    totalEmptyingFraction: finiteOrNull(mean(beatMetrics.map((metric) => metric.totalEmptyingFraction))),
    passiveEmptyingFraction: finiteOrNull(mean(beatMetrics.map((metric) => metric.passiveEmptyingFraction))),
    activeEmptyingFraction: finiteOrNull(mean(beatMetrics.map((metric) => metric.activeEmptyingFraction))),
  };
  const ranges = volumeRanges(chamber);
  const totalBroadPass = inRange(averaged.totalEmptyingFraction, ranges.total);
  const passiveBroadPass = inRange(averaged.passiveEmptyingFraction, ranges.passive);
  const activeBroadPass = inRange(averaged.activeEmptyingFraction, ranges.active);
  const distance = rangeDistance(averaged.totalEmptyingFraction, ranges.total)
    + rangeDistance(averaged.passiveEmptyingFraction, ranges.passive)
    + rangeDistance(averaged.activeEmptyingFraction, ranges.active);
  return {
    beatCount: beatMetrics.length,
    ...averaged,
    totalBroadPass,
    passiveBroadPass,
    activeBroadPass,
    allBroadPass: totalBroadPass && passiveBroadPass && activeBroadPass,
    broadRangeDistance: Number.isFinite(distance) ? round(distance) : null,
  };
}

function atrialVolumeFunctionForBeat(
  samples: readonly SimSample[],
  chamber: AtrialChamber,
): Required<Pick<AtrialVolumeFunction,
  "maxVolumeMl" | "preAtrialContractionVolumeMl" | "minVolumeMl"
  | "totalEmptyingFraction" | "passiveEmptyingFraction" | "activeEmptyingFraction"
>> | null {
  if (samples.length < 16) return null;
  const volume = (sample: SimSample): number => chamber === "LA" ? sample.VLA : sample.VRA;
  const volumes = samples.map(volume).filter(Number.isFinite);
  if (volumes.length === 0) return null;
  const maxVolumeMl = Math.max(...volumes);
  const minVolumeMl = Math.min(...volumes);
  const preAtrialContractionVolumeMl = volume(nearestThetaSample(samples, 0.76));
  const totalEmptyingFraction = (maxVolumeMl - minVolumeMl) / Math.max(maxVolumeMl, 1e-9);
  const passiveEmptyingFraction = (maxVolumeMl - preAtrialContractionVolumeMl) / Math.max(maxVolumeMl, 1e-9);
  const activeEmptyingFraction = (preAtrialContractionVolumeMl - minVolumeMl)
    / Math.max(preAtrialContractionVolumeMl, 1e-9);
  return {
    maxVolumeMl,
    preAtrialContractionVolumeMl,
    minVolumeMl,
    totalEmptyingFraction,
    passiveEmptyingFraction,
    activeEmptyingFraction,
  };
}

function pressureWaveTiming(samples: readonly SimSample[], chamber: AtrialChamber): PressureWaveTiming {
  const pressure = (sample: SimSample): number => chamber === "LA" ? sample.LAP : sample.RAP;
  const aWindow = samples.filter((sample) => thetaIn(sample.phi, [[0.76, 1], [0, 0.14]]));
  const vWindow = samples.filter((sample) => thetaIn(sample.phi, [[0.18, 0.72]]));
  const xWindow = samples.filter((sample) => thetaIn(sample.phi, [[0.1, 0.45]]));
  const yWindow = samples.filter((sample) => thetaIn(sample.phi, [[0.48, 0.76]]));
  const aWaveMax = maxNullable(aWindow.map(pressure));
  const vWaveMax = maxNullable(vWindow.map(pressure));
  let relationSignal: PressureWaveTiming["relationSignal"] = "missing";
  if (aWaveMax != null && vWaveMax != null) {
    if (chamber === "LA") {
      relationSignal = vWaveMax >= 0.85 * aWaveMax ? "la-v-ge-a" : "not-supported";
    } else {
      relationSignal = aWaveMax >= 0.85 * vWaveMax ? "ra-a-ge-v" : "not-supported";
    }
  }
  return {
    aWaveMaxMmHg: finiteOrNull(aWaveMax),
    vWaveMaxMmHg: finiteOrNull(vWaveMax),
    xDescentMinMmHg: finiteOrNull(minNullable(xWindow.map(pressure))),
    yDescentMinMmHg: finiteOrNull(minNullable(yWindow.map(pressure))),
    relationSignal,
  };
}

function summarizeCandidate(candidateId: CandidateId, runs: readonly Run[]): CandidateSummary {
  const candidateRuns = runs.filter((run) => run.candidateId === candidateId);
  return {
    candidateId,
    settledPointIds: candidateRuns.filter((run) => run.settled).map((run) => run.pointId),
    healthOkPointIds: candidateRuns.filter((run) => run.health.status === "ok").map((run) => run.pointId),
    laVolumeFunctionPassPointIds: candidateRuns
      .filter((run) => run.LA.volumeFunction.allBroadPass)
      .map((run) => run.pointId),
    raVolumeFunctionPassPointIds: candidateRuns
      .filter((run) => run.RA.volumeFunction.allBroadPass)
      .map((run) => run.pointId),
    bothAtriaVolumeFunctionPassPointIds: candidateRuns
      .filter((run) => run.LA.volumeFunction.allBroadPass && run.RA.volumeFunction.allBroadPass)
      .map((run) => run.pointId),
    laPressureRelationSignalPointIds: candidateRuns
      .filter((run) => run.LA.pressureWaveTiming.relationSignal === "la-v-ge-a")
      .map((run) => run.pointId),
    raPressureRelationSignalPointIds: candidateRuns
      .filter((run) => run.RA.pressureWaveTiming.relationSignal === "ra-a-ge-v")
      .map((run) => run.pointId),
    meanLaBroadRangeDistance: finiteOrNull(mean(candidateRuns.map((run) =>
      run.LA.volumeFunction.broadRangeDistance ?? Number.NaN))),
    meanRaBroadRangeDistance: finiteOrNull(mean(candidateRuns.map((run) =>
      run.RA.volumeFunction.broadRangeDistance ?? Number.NaN))),
    selectableByThisArtifact: false,
  };
}

function interpretation(best: CandidateSummary | null): string {
  if (!best) {
    return "Phase 5AZ created the sourced atrial target pack but did not rank any candidate.";
  }
  return [
    `Phase 5AZ stores sourced atrial waveform/function targets and scores current runtime, A1, and A2 candidates against volume-derived broad ranges.`,
    `Best volume-function candidate by this artifact: ${best.candidateId}.`,
    `Both-atria volume-function broad-pass points: ${best.bothAtriaVolumeFunctionPassPointIds.length > 0 ? best.bothAtriaVolumeFunctionPassPointIds.join(", ") : "none"}.`,
    "This is target-grounding only; it does not select an atrial bridge or tune parameters.",
  ].join(" ");
}

function volumeRanges(chamber: AtrialChamber): Record<"total" | "passive" | "active", Range> {
  if (chamber === "LA") {
    return {
      total: asRange(targetPack.volumeDerivedFunctionTargets.leftAtrium.totalEmptyingFraction.broadRange),
      passive: asRange(targetPack.volumeDerivedFunctionTargets.leftAtrium.passiveEmptyingFraction.broadRange),
      active: asRange(targetPack.volumeDerivedFunctionTargets.leftAtrium.activeEmptyingFraction.broadRange),
    };
  }
  return {
    total: asRange(targetPack.volumeDerivedFunctionTargets.rightAtrium.totalEmptyingFraction.broadRange),
    passive: asRange(targetPack.volumeDerivedFunctionTargets.rightAtrium.passiveEmptyingFraction.broadRange),
    active: asRange(targetPack.volumeDerivedFunctionTargets.rightAtrium.activeEmptyingFraction.broadRange),
  };
}

function asRange(value: readonly number[]): Range {
  if (value.length !== 2 || !Number.isFinite(value[0]) || !Number.isFinite(value[1])) {
    throw new Error("Atrial waveform target range must contain two finite numbers.");
  }
  return [value[0], value[1]];
}

function beatGroups(samples: readonly SimSample[]): readonly SimSample[][] {
  const groups = new Map<number, SimSample[]>();
  for (const sample of samples) {
    const beat = Math.floor(sample.phi);
    const group = groups.get(beat) ?? [];
    group.push(sample);
    groups.set(beat, group);
  }
  return Array.from(groups.values()).filter((group) => group.length >= 16).slice(-MEASURE_BEATS);
}

function nearestThetaSample(samples: readonly SimSample[], targetTheta: number): SimSample {
  return samples
    .slice()
    .sort((left, right) => thetaDistance(left.phi, targetTheta) - thetaDistance(right.phi, targetTheta))[0]
    ?? samples[0];
}

function thetaDistance(phi: number, targetTheta: number): number {
  const theta = frac(phi);
  const distance = Math.abs(theta - targetTheta);
  return Math.min(distance, 1 - distance);
}

function thetaIn(phi: number, windows: readonly (readonly [number, number])[]): boolean {
  const theta = frac(phi);
  return windows.some(([lo, hi]) => theta >= lo && theta < hi);
}

function inRange(value: number | null, range: Range): boolean {
  return value != null && value >= range[0] && value <= range[1];
}

function rangeDistance(value: number | null, range: Range): number {
  if (value == null) return Number.POSITIVE_INFINITY;
  if (value < range[0]) return range[0] - value;
  if (value > range[1]) return value - range[1];
  return 0;
}

function maxNullable(values: readonly number[]): number | null {
  const finite = values.filter(Number.isFinite);
  return finite.length === 0 ? null : Math.max(...finite);
}

function minNullable(values: readonly number[]): number | null {
  const finite = values.filter(Number.isFinite);
  return finite.length === 0 ? null : Math.min(...finite);
}

function finiteOrNull(value: number | null | undefined): number | null {
  return value != null && Number.isFinite(value) ? round(value) : null;
}

function mean(values: readonly number[]): number {
  const finite = values.filter(Number.isFinite);
  return finite.length === 0 ? Number.NaN : finite.reduce((sum, value) => sum + value, 0) / finite.length;
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
  const evidence = buildAtrialWaveformTargetPackPhase5AZEvidence();
  const outPath = path.resolve(process.cwd(), ATRIAL_WAVEFORM_TARGET_PACK_PHASE5AZ_RESULT_PATH);
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
    bestCandidateByVolumeFunctionId: evidence.summary.bestCandidateByVolumeFunctionId,
    bestCandidateBothAtriaPassPointIds: evidence.summary.bestCandidateBothAtriaPassPointIds,
  }, null, 2));
}
