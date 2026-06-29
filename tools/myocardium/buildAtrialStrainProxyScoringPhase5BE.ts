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

export const ATRIAL_STRAIN_PROXY_SCORING_PHASE5BE_ID =
  "atrial-strain-proxy-scoring-phase5be-result-v1";

export const ATRIAL_STRAIN_PROXY_SCORING_PHASE5BE_RESULT_PATH =
  "data/myocardium/protocols/atrial-strain-proxy-scoring-phase5be-result-v1.json";

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
  readonly allBroadPass: boolean;
  readonly broadRangeDistance: number | null;
};

type AtrialStrainProxy = {
  readonly proxyId: "cuberoot-volume-wall-strain-v1";
  readonly beatCount: number;
  readonly reservoirStrain: number | null;
  readonly conduitStrain: number | null;
  readonly contractileStrain: number | null;
  readonly reservoirRangePass: boolean;
  readonly conduitRangePass: boolean;
  readonly contractileRangePass: boolean;
  readonly allRangePass: boolean;
  readonly sourceRangeDistance: number | null;
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
    readonly strainProxy: AtrialStrainProxy;
  };
  readonly RA: {
    readonly volumeFunction: AtrialVolumeFunction;
    readonly strainProxy: AtrialStrainProxy;
  };
};

type CandidateSummary = {
  readonly candidateId: CandidateId;
  readonly healthOkPointIds: readonly PointId[];
  readonly bothAtriaVolumeFunctionPassPointIds: readonly PointId[];
  readonly bothAtriaStrainProxyPassPointIds: readonly PointId[];
  readonly laStrainProxyPassPointIds: readonly PointId[];
  readonly raStrainProxyPassPointIds: readonly PointId[];
  readonly meanLaVolumeDistance: number | null;
  readonly meanRaVolumeDistance: number | null;
  readonly meanLaStrainDistance: number | null;
  readonly meanRaStrainDistance: number | null;
  readonly selectableByThisArtifact: false;
};

type Evidence = {
  readonly schemaVersion: 1;
  readonly id: typeof ATRIAL_STRAIN_PROXY_SCORING_PHASE5BE_ID;
  readonly phase: "Phase 5BE";
  readonly claimBoundary: "atrial-wall-strain-proxy-scoring-no-selection";
  readonly targetPackId: typeof targetPack.id;
  readonly sourceEvidence: readonly [
    "data/myocardium/protocols/atrial-waveform-target-pack-phase5az-result-v1.json",
    "data/myocardium/protocols/atrial-av-valve-smoothing-phase5bd-result-v1.json",
  ];
  readonly protocol: {
    readonly runtimeActiveSourceMode: typeof MODELCORE_RUNTIME_LV_RV_LAND_DEFAULT_MODE;
    readonly pointSource: "hr75-hr90-normal-low-high-preload";
    readonly candidateIds: readonly CandidateId[];
    readonly dtSec: typeof DT_SEC;
    readonly sampleHz: typeof SAMPLE_HZ;
    readonly measureBeats: typeof MEASURE_BEATS;
    readonly scoredTargets: readonly [
      "volume-derived-emptying-fractions",
      "cuberoot-volume-wall-strain-proxy",
    ];
    readonly avPlaneDisplacementNotDirectlyScored: true;
    readonly noRuntimeDefaultFlip: true;
    readonly noProductionBridgeSelection: true;
    readonly noAtrialParameterTuning: true;
    readonly noPermanentVerifierOrNpmScriptAdded: true;
  };
  readonly targetPackDigest: {
    readonly sourceCount: number;
    readonly leftAtriumStrainSourceRanges: Record<"reservoir" | "conduit" | "contractile", Range>;
    readonly rightAtriumStrainSourceRanges: Record<"reservoir" | "conduit" | "contractile", Range>;
    readonly proxyLimitation: string;
  };
  readonly points: readonly PointSpec[];
  readonly runs: readonly Run[];
  readonly candidateSummaries: readonly CandidateSummary[];
  readonly summary: {
    readonly bestCandidateByCombinedTargetDistanceId: CandidateId | null;
    readonly bestCandidateBothAtriaStrainProxyPassPointIds: readonly PointId[];
    readonly diagnosticStatus: "proxy-scored-no-selection";
    readonly currentInterpretation: string;
    readonly recommendedNext: readonly string[];
    readonly blockers: readonly string[];
  };
  readonly boundary: {
    readonly noAtrialBridgeSelection: true;
    readonly noAtrialParameterTuning: true;
    readonly noLandAtrialValidationClaim: true;
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

export function buildAtrialStrainProxyScoringPhase5BEEvidence(): Evidence {
  const runs = CANDIDATES.flatMap((candidateId) => POINTS.map((point) => runPoint(candidateId, point)));
  const candidateSummaries = CANDIDATES.map((candidateId) => summarizeCandidate(candidateId, runs));
  const best = candidateSummaries
    .slice()
    .sort((left, right) => combinedDistance(left) - combinedDistance(right))[0] ?? null;
  const evidenceWithoutHash: Omit<Evidence, "normalizedSha256"> = {
    schemaVersion: 1,
    id: ATRIAL_STRAIN_PROXY_SCORING_PHASE5BE_ID,
    phase: "Phase 5BE",
    claimBoundary: "atrial-wall-strain-proxy-scoring-no-selection",
    targetPackId: targetPack.id,
    sourceEvidence: [
      "data/myocardium/protocols/atrial-waveform-target-pack-phase5az-result-v1.json",
      "data/myocardium/protocols/atrial-av-valve-smoothing-phase5bd-result-v1.json",
    ],
    protocol: {
      runtimeActiveSourceMode: MODELCORE_RUNTIME_LV_RV_LAND_DEFAULT_MODE,
      pointSource: "hr75-hr90-normal-low-high-preload",
      candidateIds: CANDIDATES,
      dtSec: DT_SEC,
      sampleHz: SAMPLE_HZ,
      measureBeats: MEASURE_BEATS,
      scoredTargets: [
        "volume-derived-emptying-fractions",
        "cuberoot-volume-wall-strain-proxy",
      ],
      avPlaneDisplacementNotDirectlyScored: true,
      noRuntimeDefaultFlip: true,
      noProductionBridgeSelection: true,
      noAtrialParameterTuning: true,
      noPermanentVerifierOrNpmScriptAdded: true,
    },
    targetPackDigest: {
      sourceCount: targetPack.sources.length,
      leftAtriumStrainSourceRanges: {
        reservoir: asRange(targetPack.strainTargets.leftAtrium.reservoirStrain.normalRange95Ci),
        conduit: asRange(targetPack.strainTargets.leftAtrium.conduitStrain.normalRange95Ci),
        contractile: asRange(targetPack.strainTargets.leftAtrium.contractileStrain.normalRange95Ci),
      },
      rightAtriumStrainSourceRanges: {
        reservoir: asRange(targetPack.strainTargets.rightAtrium.reservoirStrain.normalRange95Ci),
        conduit: asRange(targetPack.strainTargets.rightAtrium.conduitStrain.normalRange95Ci),
        contractile: asRange(targetPack.strainTargets.rightAtrium.contractileStrain.normalRange95Ci),
      },
      proxyLimitation:
        "The strain proxy uses cuberoot volume ratios as a wall-length surrogate. It does not directly measure AV-plane displacement, chamber wall strain, or speckle-tracking strain.",
    },
    points: POINTS,
    runs,
    candidateSummaries,
    summary: {
      bestCandidateByCombinedTargetDistanceId: best?.candidateId ?? null,
      bestCandidateBothAtriaStrainProxyPassPointIds: best?.bothAtriaStrainProxyPassPointIds ?? [],
      diagnosticStatus: "proxy-scored-no-selection",
      currentInterpretation: interpretation(best),
      recommendedNext: [
        "use strain-proxy distances with volume-function distances when comparing LandAtrial shadow candidates",
        "do not select A1/A2 from cuberoot volume strain proxy alone; it is a scoring bridge, not direct atrial strain",
        "add direct AV-plane displacement or wall-strain readbacks before claiming physiologic strain acceptance",
      ],
      blockers: [
        "no candidate is selected by this proxy scoring artifact",
        "direct AV-plane displacement and wall strain are not sampled",
        "LandAtrial shadow remains absent",
      ],
    },
    boundary: {
      noAtrialBridgeSelection: true,
      noAtrialParameterTuning: true,
      noLandAtrialValidationClaim: true,
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
      strainProxy: atrialStrainProxy(samples, "LA"),
    },
    RA: {
      volumeFunction: atrialVolumeFunction(samples, "RA"),
      strainProxy: atrialStrainProxy(samples, "RA"),
    },
  };
}

function createCandidateProviders(
  candidateId: CandidateId,
): Partial<Record<Chamber, ModelCoreExperimentalActiveSourceProvider>> {
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

function summarizeCandidate(candidateId: CandidateId, runs: readonly Run[]): CandidateSummary {
  const candidateRuns = runs.filter((run) => run.candidateId === candidateId);
  return {
    candidateId,
    healthOkPointIds: candidateRuns.filter((run) => run.health.status === "ok").map((run) => run.pointId),
    bothAtriaVolumeFunctionPassPointIds: candidateRuns
      .filter((run) => run.LA.volumeFunction.allBroadPass && run.RA.volumeFunction.allBroadPass)
      .map((run) => run.pointId),
    bothAtriaStrainProxyPassPointIds: candidateRuns
      .filter((run) => run.LA.strainProxy.allRangePass && run.RA.strainProxy.allRangePass)
      .map((run) => run.pointId),
    laStrainProxyPassPointIds: candidateRuns
      .filter((run) => run.LA.strainProxy.allRangePass)
      .map((run) => run.pointId),
    raStrainProxyPassPointIds: candidateRuns
      .filter((run) => run.RA.strainProxy.allRangePass)
      .map((run) => run.pointId),
    meanLaVolumeDistance: finiteOrNull(mean(candidateRuns.map((run) =>
      run.LA.volumeFunction.broadRangeDistance ?? Number.NaN))),
    meanRaVolumeDistance: finiteOrNull(mean(candidateRuns.map((run) =>
      run.RA.volumeFunction.broadRangeDistance ?? Number.NaN))),
    meanLaStrainDistance: finiteOrNull(mean(candidateRuns.map((run) =>
      run.LA.strainProxy.sourceRangeDistance ?? Number.NaN))),
    meanRaStrainDistance: finiteOrNull(mean(candidateRuns.map((run) =>
      run.RA.strainProxy.sourceRangeDistance ?? Number.NaN))),
    selectableByThisArtifact: false,
  };
}

function atrialVolumeFunction(samples: readonly SimSample[], chamber: AtrialChamber): AtrialVolumeFunction {
  const beatMetrics = beatGroups(samples)
    .map((beatSamples) => atrialVolumeFunctionForBeat(beatSamples, chamber))
    .filter((metric): metric is Required<Pick<AtrialVolumeFunction,
      "maxVolumeMl"
      | "preAtrialContractionVolumeMl"
      | "minVolumeMl"
      | "totalEmptyingFraction"
      | "passiveEmptyingFraction"
      | "activeEmptyingFraction"
    >> => metric != null);
  const maxVolumeMl = finiteOrNull(mean(beatMetrics.map((metric) => metric.maxVolumeMl)));
  const preAtrialContractionVolumeMl = finiteOrNull(mean(beatMetrics.map((metric) =>
    metric.preAtrialContractionVolumeMl)));
  const minVolumeMl = finiteOrNull(mean(beatMetrics.map((metric) => metric.minVolumeMl)));
  const totalEmptyingFraction = finiteOrNull(mean(beatMetrics.map((metric) => metric.totalEmptyingFraction)));
  const passiveEmptyingFraction = finiteOrNull(mean(beatMetrics.map((metric) => metric.passiveEmptyingFraction)));
  const activeEmptyingFraction = finiteOrNull(mean(beatMetrics.map((metric) => metric.activeEmptyingFraction)));
  const ranges = volumeRanges(chamber);
  const distance = rangeDistance(totalEmptyingFraction, ranges.total)
    + rangeDistance(passiveEmptyingFraction, ranges.passive)
    + rangeDistance(activeEmptyingFraction, ranges.active);
  return {
    beatCount: beatMetrics.length,
    maxVolumeMl,
    preAtrialContractionVolumeMl,
    minVolumeMl,
    totalEmptyingFraction,
    passiveEmptyingFraction,
    activeEmptyingFraction,
    allBroadPass:
      inRange(totalEmptyingFraction, ranges.total)
      && inRange(passiveEmptyingFraction, ranges.passive)
      && inRange(activeEmptyingFraction, ranges.active),
    broadRangeDistance: Number.isFinite(distance) ? round(distance) : null,
  };
}

function atrialVolumeFunctionForBeat(
  samples: readonly SimSample[],
  chamber: AtrialChamber,
): Required<Pick<AtrialVolumeFunction,
  "maxVolumeMl"
  | "preAtrialContractionVolumeMl"
  | "minVolumeMl"
  | "totalEmptyingFraction"
  | "passiveEmptyingFraction"
  | "activeEmptyingFraction"
>> | null {
  if (samples.length < 16) return null;
  const volume = (sample: SimSample): number => chamber === "LA" ? sample.VLA : sample.VRA;
  const volumes = samples.map(volume).filter(Number.isFinite);
  if (volumes.length === 0) return null;
  const maxVolumeMl = Math.max(...volumes);
  const minVolumeMl = Math.min(...volumes);
  const preAtrialContractionVolumeMl = volume(nearestThetaSample(samples, 0.76));
  return {
    maxVolumeMl,
    preAtrialContractionVolumeMl,
    minVolumeMl,
    totalEmptyingFraction: (maxVolumeMl - minVolumeMl) / Math.max(maxVolumeMl, 1e-9),
    passiveEmptyingFraction: (maxVolumeMl - preAtrialContractionVolumeMl) / Math.max(maxVolumeMl, 1e-9),
    activeEmptyingFraction: (preAtrialContractionVolumeMl - minVolumeMl)
      / Math.max(preAtrialContractionVolumeMl, 1e-9),
  };
}

function atrialStrainProxy(samples: readonly SimSample[], chamber: AtrialChamber): AtrialStrainProxy {
  const beatMetrics = beatGroups(samples)
    .map((beatSamples) => atrialStrainProxyForBeat(beatSamples, chamber))
    .filter((metric): metric is Required<Pick<AtrialStrainProxy,
      "reservoirStrain" | "conduitStrain" | "contractileStrain"
    >> => metric != null);
  const reservoirStrain = finiteOrNull(mean(beatMetrics.map((metric) => metric.reservoirStrain)));
  const conduitStrain = finiteOrNull(mean(beatMetrics.map((metric) => metric.conduitStrain)));
  const contractileStrain = finiteOrNull(mean(beatMetrics.map((metric) => metric.contractileStrain)));
  const ranges = strainRanges(chamber);
  const distance = rangeDistance(reservoirStrain, ranges.reservoir)
    + rangeDistance(conduitStrain, ranges.conduit)
    + rangeDistance(contractileStrain, ranges.contractile);
  const reservoirRangePass = inRange(reservoirStrain, ranges.reservoir);
  const conduitRangePass = inRange(conduitStrain, ranges.conduit);
  const contractileRangePass = inRange(contractileStrain, ranges.contractile);
  return {
    proxyId: "cuberoot-volume-wall-strain-v1",
    beatCount: beatMetrics.length,
    reservoirStrain,
    conduitStrain,
    contractileStrain,
    reservoirRangePass,
    conduitRangePass,
    contractileRangePass,
    allRangePass: reservoirRangePass && conduitRangePass && contractileRangePass,
    sourceRangeDistance: Number.isFinite(distance) ? round(distance) : null,
  };
}

function atrialStrainProxyForBeat(
  samples: readonly SimSample[],
  chamber: AtrialChamber,
): Required<Pick<AtrialStrainProxy, "reservoirStrain" | "conduitStrain" | "contractileStrain">> | null {
  if (samples.length < 16) return null;
  const volume = (sample: SimSample): number => chamber === "LA" ? sample.VLA : sample.VRA;
  const volumes = samples.map(volume).filter((value) => Number.isFinite(value) && value > 0);
  if (volumes.length === 0) return null;
  const maxVolumeMl = Math.max(...volumes);
  const minVolumeMl = Math.min(...volumes);
  const preAtrialContractionVolumeMl = Math.max(volume(nearestThetaSample(samples, 0.76)), 1e-9);
  const lMax = Math.cbrt(maxVolumeMl);
  const lMin = Math.cbrt(Math.max(minVolumeMl, 1e-9));
  const lPreA = Math.cbrt(preAtrialContractionVolumeMl);
  return {
    reservoirStrain: (lMax - lMin) / Math.max(lMin, 1e-9),
    conduitStrain: (lMax - lPreA) / Math.max(lMin, 1e-9),
    contractileStrain: (lPreA - lMin) / Math.max(lMin, 1e-9),
  };
}

function interpretation(best: CandidateSummary | null): string {
  if (!best) {
    return "Phase 5BE adds cuberoot volume wall-strain proxy scoring but does not select a candidate.";
  }
  const passPoints = best.bothAtriaStrainProxyPassPointIds.length > 0
    ? best.bothAtriaStrainProxyPassPointIds.join(", ")
    : "none";
  return [
    "Phase 5BE converts the stored atrial strain targets into a cuberoot-volume wall-strain proxy score.",
    `The best combined-distance candidate is ${best.candidateId}; both-atria strain-proxy pass points: ${passPoints}.`,
    "This is a target-scoring bridge for future LandAtrial shadow work, not direct strain validation or bridge selection.",
  ].join(" ");
}

function combinedDistance(summary: CandidateSummary): number {
  return (summary.meanLaVolumeDistance ?? Number.POSITIVE_INFINITY)
    + (summary.meanRaVolumeDistance ?? Number.POSITIVE_INFINITY)
    + (summary.meanLaStrainDistance ?? Number.POSITIVE_INFINITY)
    + (summary.meanRaStrainDistance ?? Number.POSITIVE_INFINITY);
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

function strainRanges(chamber: AtrialChamber): Record<"reservoir" | "conduit" | "contractile", Range> {
  if (chamber === "LA") {
    return {
      reservoir: asRange(targetPack.strainTargets.leftAtrium.reservoirStrain.normalRange95Ci),
      conduit: asRange(targetPack.strainTargets.leftAtrium.conduitStrain.normalRange95Ci),
      contractile: asRange(targetPack.strainTargets.leftAtrium.contractileStrain.normalRange95Ci),
    };
  }
  return {
    reservoir: asRange(targetPack.strainTargets.rightAtrium.reservoirStrain.normalRange95Ci),
    conduit: asRange(targetPack.strainTargets.rightAtrium.conduitStrain.normalRange95Ci),
    contractile: asRange(targetPack.strainTargets.rightAtrium.contractileStrain.normalRange95Ci),
  };
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

function inRange(value: number | null, range: Range): boolean {
  return value != null && value >= range[0] && value <= range[1];
}

function rangeDistance(value: number | null, range: Range): number {
  if (value == null) return Number.POSITIVE_INFINITY;
  if (value < range[0]) return range[0] - value;
  if (value > range[1]) return value - range[1];
  return 0;
}

function asRange(value: readonly number[]): Range {
  if (value.length !== 2 || !Number.isFinite(value[0]) || !Number.isFinite(value[1])) {
    throw new Error("Atrial target range must contain two finite numbers.");
  }
  return [value[0], value[1]];
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
  const evidence = buildAtrialStrainProxyScoringPhase5BEEvidence();
  const outPath = path.resolve(process.cwd(), ATRIAL_STRAIN_PROXY_SCORING_PHASE5BE_RESULT_PATH);
  mkdirSync(path.dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(evidence, null, 2)}\n`);
  return evidence;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const evidence = writeEvidence();
  console.log(JSON.stringify({
    id: evidence.id,
    normalizedSha256: evidence.normalizedSha256,
    bestCandidateByCombinedTargetDistanceId: evidence.summary.bestCandidateByCombinedTargetDistanceId,
    bestCandidateBothAtriaStrainProxyPassPointIds: evidence.summary.bestCandidateBothAtriaStrainProxyPassPointIds,
  }, null, 2));
}
