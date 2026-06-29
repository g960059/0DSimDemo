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
  type AtrialPhysiologyBridgeV2Params,
} from "@/engine/myocardium/atrialPhysiologyBridgeV2";
import {
  MODELCORE_RUNTIME_LV_RV_LAND_DEFAULT_MODE,
  resolveModelCoreRuntimeActiveSource,
} from "@/engine/myocardium/runtimeActiveSource";
import type { Chamber } from "@/engine/chambers";
import type { CoreRuntimeParams, SimSample, SimulationHealth } from "@/engine/protocol";
import { DEFAULT_SETTLE_POLICY, type SettlePolicy } from "@/engine/settling";
import { createAtrialBridgeProviders } from "@/tools/myocardium/buildAtrialBridgeShootout";

export const ATRIAL_A2_SENSITIVITY_PHASE5BA_ID =
  "atrial-a2-sensitivity-phase5ba-result-v1";

export const ATRIAL_A2_SENSITIVITY_PHASE5BA_RESULT_PATH =
  "data/myocardium/protocols/atrial-a2-sensitivity-phase5ba-result-v1.json";

type AtrialChamber = "LA" | "RA";
type Valve = "MV" | "TV";
type VariantId =
  | "runtime-default-atrial-active-reference"
  | "a1-refined-reference"
  | "a2-conduit-full"
  | "a2-conduit-no-viscous"
  | "a2-conduit-no-booster"
  | "a2-conduit-no-av-plane-extra";
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

type VolumeFunction = {
  readonly totalEmptyingFraction: number | null;
  readonly passiveEmptyingFraction: number | null;
  readonly activeEmptyingFraction: number | null;
  readonly allBroadPass: boolean;
  readonly broadRangeDistance: number | null;
};

type LoopShape = {
  readonly pressureRangeMmHg: number | null;
  readonly volumeRangeMl: number | null;
  readonly roughnessSamplingSpan: number | null;
};

type ValveAttribution = {
  readonly hitsPerBeat: number;
  readonly diodeImpulsePerBeat: number;
  readonly qDotClampHitFraction: number;
};

type Run = {
  readonly variantId: VariantId;
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
    readonly volumeFunction: VolumeFunction;
    readonly loopShape: LoopShape;
  };
  readonly RA: {
    readonly volumeFunction: VolumeFunction;
    readonly loopShape: LoopShape;
  };
  readonly valveAttribution: Record<Valve, ValveAttribution>;
};

type VariantSummary = {
  readonly variantId: VariantId;
  readonly settledPointIds: readonly PointId[];
  readonly healthOkPointIds: readonly PointId[];
  readonly bothAtriaVolumePassPointIds: readonly PointId[];
  readonly laVolumePassPointIds: readonly PointId[];
  readonly raVolumePassPointIds: readonly PointId[];
  readonly meanLaDistance: number | null;
  readonly meanRaDistance: number | null;
  readonly meanValveHitsPerBeat: number | null;
  readonly meanValveImpulsePerBeat: number | null;
  readonly maxRoughnessSamplingSpan: number | null;
};

type Evidence = {
  readonly schemaVersion: 1;
  readonly id: typeof ATRIAL_A2_SENSITIVITY_PHASE5BA_ID;
  readonly phase: "Phase 5BA";
  readonly claimBoundary: "a2-conduit-sensitivity-diagnostic-no-selection";
  readonly targetPackId: typeof targetPack.id;
  readonly protocol: {
    readonly runtimeActiveSourceMode: typeof MODELCORE_RUNTIME_LV_RV_LAND_DEFAULT_MODE;
    readonly pointSource: "hr75-hr90-normal-low-high-preload";
    readonly variantIds: readonly VariantId[];
    readonly dtSec: typeof DT_SEC;
    readonly sampleHz: typeof SAMPLE_HZ;
    readonly measureBeats: typeof MEASURE_BEATS;
    readonly sensitivityAxis: readonly [
      "full-a2-conduit",
      "remove-viscous-conduit-term",
      "remove-tension-booster-term",
      "remove-av-plane-extra-term",
    ];
    readonly noRuntimeDefaultFlip: true;
    readonly noProductionBridgeSelection: true;
    readonly noParameterTuning: true;
    readonly noPermanentVerifierOrNpmScriptAdded: true;
  };
  readonly points: readonly PointSpec[];
  readonly runs: readonly Run[];
  readonly variantSummaries: readonly VariantSummary[];
  readonly termAttribution: {
    readonly fullA2BothAtriaPassPointIds: readonly PointId[];
    readonly noViscousBothAtriaPassPointIds: readonly PointId[];
    readonly noBoosterBothAtriaPassPointIds: readonly PointId[];
    readonly noAvPlaneExtraBothAtriaPassPointIds: readonly PointId[];
    readonly normalHr75FullSignalPreservedBy: readonly VariantId[];
    readonly currentInterpretation: string;
  };
  readonly summary: {
    readonly bestVariantId: VariantId | null;
    readonly bestVariantStatus: "limited-local-signal" | "not-supported";
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
const ROUGHNESS_SAMPLE_HZ = [240, 480, 960] as const;
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

const VARIANTS: readonly VariantId[] = [
  "runtime-default-atrial-active-reference",
  "a1-refined-reference",
  "a2-conduit-full",
  "a2-conduit-no-viscous",
  "a2-conduit-no-booster",
  "a2-conduit-no-av-plane-extra",
] as const;

export function buildAtrialA2SensitivityPhase5BAEvidence(): Evidence {
  const runs = VARIANTS.flatMap((variantId) => POINTS.map((point) => runPoint(variantId, point)));
  const variantSummaries = VARIANTS.map((variantId) => summarizeVariant(variantId, runs));
  const best = variantSummaries
    .slice()
    .sort((left, right) =>
      right.bothAtriaVolumePassPointIds.length - left.bothAtriaVolumePassPointIds.length
      || totalDistance(left) - totalDistance(right)
    )[0] ?? null;
  const termAttribution = buildTermAttribution(variantSummaries);
  const evidenceWithoutHash: Omit<Evidence, "normalizedSha256"> = {
    schemaVersion: 1,
    id: ATRIAL_A2_SENSITIVITY_PHASE5BA_ID,
    phase: "Phase 5BA",
    claimBoundary: "a2-conduit-sensitivity-diagnostic-no-selection",
    targetPackId: targetPack.id,
    protocol: {
      runtimeActiveSourceMode: MODELCORE_RUNTIME_LV_RV_LAND_DEFAULT_MODE,
      pointSource: "hr75-hr90-normal-low-high-preload",
      variantIds: VARIANTS,
      dtSec: DT_SEC,
      sampleHz: SAMPLE_HZ,
      measureBeats: MEASURE_BEATS,
      sensitivityAxis: [
        "full-a2-conduit",
        "remove-viscous-conduit-term",
        "remove-tension-booster-term",
        "remove-av-plane-extra-term",
      ],
      noRuntimeDefaultFlip: true,
      noProductionBridgeSelection: true,
      noParameterTuning: true,
      noPermanentVerifierOrNpmScriptAdded: true,
    },
    points: POINTS,
    runs,
    variantSummaries,
    termAttribution,
    summary: {
      bestVariantId: best?.variantId ?? null,
      bestVariantStatus: best && best.bothAtriaVolumePassPointIds.length > 0
        ? "limited-local-signal"
        : "not-supported",
      recommendedNext: [
        "if continuing A2, keep conduit-like viscous input explicit and evaluate valve contamination before any gain changes",
        "do not promote A2 from the normal-hr75 volume-function signal alone; require envelope-wide function and figure-eight readability",
        "use LandAtrial shadow work for final active mechanics once AV-plane reservoir coupling is factored into a reusable component",
      ],
      blockers: [
        "A2 remains off-by-default and unselected",
        "no variant provides envelope-wide both-atria volume-function broad pass",
        "figure-eight readability remains unaccepted",
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

function runPoint(variantId: VariantId, point: PointSpec): Run {
  const params: Partial<CoreRuntimeParams> = { ...defaultParams(), HR: point.HR };
  const runtimeResolution = resolveModelCoreRuntimeActiveSource({
    mode: MODELCORE_RUNTIME_LV_RV_LAND_DEFAULT_MODE,
    runtimeParams: params,
  });
  const core = new ModelCore(params, {
    ...runtimeResolution.experimentalOptions,
    activeSourceProviders: {
      ...(runtimeResolution.experimentalOptions.activeSourceProviders ?? {}),
      ...createVariantProviders(variantId),
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
    variantId,
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
      loopShape: loopShape(samples, "LA"),
    },
    RA: {
      volumeFunction: atrialVolumeFunction(samples, "RA"),
      loopShape: loopShape(samples, "RA"),
    },
    valveAttribution: {
      MV: valveAttribution(samples, "MV"),
      TV: valveAttribution(samples, "TV"),
    },
  };
}

function createVariantProviders(variantId: VariantId):
Partial<Record<Chamber, ModelCoreExperimentalActiveSourceProvider>> {
  if (variantId === "runtime-default-atrial-active-reference") return {};
  if (variantId === "a1-refined-reference") {
    return createAtrialBridgeProviders("atrial-refined-reservoir-booster-bridge-v1");
  }
  return {
    LA: createAtrialPhysiologyBridgeV2SourceProvider("LA", a2ParamsForVariant(variantId, "LA")),
    RA: createAtrialPhysiologyBridgeV2SourceProvider("RA", a2ParamsForVariant(variantId, "RA")),
  };
}

function a2ParamsForVariant(variantId: VariantId, chamber: AtrialChamber): AtrialPhysiologyBridgeV2Params {
  const base = atrialPhysiologyBridgeV2CandidateParams("atrial-a2-conduit-v1", chamber);
  if (variantId === "a2-conduit-no-viscous") {
    return { ...base, viscousConduitGainMmHgPerMlPerSec: 0 };
  }
  if (variantId === "a2-conduit-no-booster") {
    return { ...base, activeBoosterGain: 0 };
  }
  if (variantId === "a2-conduit-no-av-plane-extra") {
    return { ...base, avPlaneDeltaGain: 0 };
  }
  return base;
}

function summarizeVariant(variantId: VariantId, runs: readonly Run[]): VariantSummary {
  const variantRuns = runs.filter((run) => run.variantId === variantId);
  const roughnessSpans = variantRuns.flatMap((run) => [
    run.LA.loopShape.roughnessSamplingSpan ?? Number.NaN,
    run.RA.loopShape.roughnessSamplingSpan ?? Number.NaN,
  ]);
  return {
    variantId,
    settledPointIds: variantRuns.filter((run) => run.settled).map((run) => run.pointId),
    healthOkPointIds: variantRuns.filter((run) => run.health.status === "ok").map((run) => run.pointId),
    bothAtriaVolumePassPointIds: variantRuns
      .filter((run) => run.LA.volumeFunction.allBroadPass && run.RA.volumeFunction.allBroadPass)
      .map((run) => run.pointId),
    laVolumePassPointIds: variantRuns
      .filter((run) => run.LA.volumeFunction.allBroadPass)
      .map((run) => run.pointId),
    raVolumePassPointIds: variantRuns
      .filter((run) => run.RA.volumeFunction.allBroadPass)
      .map((run) => run.pointId),
    meanLaDistance: finiteOrNull(mean(variantRuns.map((run) =>
      run.LA.volumeFunction.broadRangeDistance ?? Number.NaN))),
    meanRaDistance: finiteOrNull(mean(variantRuns.map((run) =>
      run.RA.volumeFunction.broadRangeDistance ?? Number.NaN))),
    meanValveHitsPerBeat: finiteOrNull(mean(variantRuns.map((run) =>
      run.valveAttribution.MV.hitsPerBeat + run.valveAttribution.TV.hitsPerBeat))),
    meanValveImpulsePerBeat: finiteOrNull(mean(variantRuns.map((run) =>
      run.valveAttribution.MV.diodeImpulsePerBeat + run.valveAttribution.TV.diodeImpulsePerBeat))),
    maxRoughnessSamplingSpan: finiteOrNull(maxFinite(roughnessSpans)),
  };
}

function buildTermAttribution(summaries: readonly VariantSummary[]): Evidence["termAttribution"] {
  const full = summaryById(summaries, "a2-conduit-full");
  const noViscous = summaryById(summaries, "a2-conduit-no-viscous");
  const noBooster = summaryById(summaries, "a2-conduit-no-booster");
  const noAvPlane = summaryById(summaries, "a2-conduit-no-av-plane-extra");
  const normalPreservers = [full, noViscous, noBooster, noAvPlane]
    .filter((summary): summary is VariantSummary => summary != null)
    .filter((summary) => summary.bothAtriaVolumePassPointIds.includes("normal-hr75"))
    .map((summary) => summary.variantId);
  return {
    fullA2BothAtriaPassPointIds: full?.bothAtriaVolumePassPointIds ?? [],
    noViscousBothAtriaPassPointIds: noViscous?.bothAtriaVolumePassPointIds ?? [],
    noBoosterBothAtriaPassPointIds: noBooster?.bothAtriaVolumePassPointIds ?? [],
    noAvPlaneExtraBothAtriaPassPointIds: noAvPlane?.bothAtriaVolumePassPointIds ?? [],
    normalHr75FullSignalPreservedBy: normalPreservers,
    currentInterpretation: [
      "Phase 5BA tests whether the Phase 5AZ A2-conduit normal-hr75 volume-function signal depends on a single added term.",
      `The signal is preserved by: ${normalPreservers.length > 0 ? normalPreservers.join(", ") : "none"}.`,
      "This is diagnostic term attribution only, not parameter tuning or bridge selection.",
    ].join(" "),
  };
}

function summaryById(summaries: readonly VariantSummary[], variantId: VariantId): VariantSummary | undefined {
  return summaries.find((summary) => summary.variantId === variantId);
}

function atrialVolumeFunction(samples: readonly SimSample[], chamber: AtrialChamber): VolumeFunction {
  const beatMetrics = beatGroups(samples)
    .map((beatSamples) => atrialVolumeFunctionForBeat(beatSamples, chamber))
    .filter((metric): metric is Required<Pick<VolumeFunction,
      "totalEmptyingFraction" | "passiveEmptyingFraction" | "activeEmptyingFraction"
    >> => metric != null);
  const totalEmptyingFraction = finiteOrNull(mean(beatMetrics.map((metric) => metric.totalEmptyingFraction)));
  const passiveEmptyingFraction = finiteOrNull(mean(beatMetrics.map((metric) => metric.passiveEmptyingFraction)));
  const activeEmptyingFraction = finiteOrNull(mean(beatMetrics.map((metric) => metric.activeEmptyingFraction)));
  const ranges = volumeRanges(chamber);
  const totalPass = inRange(totalEmptyingFraction, ranges.total);
  const passivePass = inRange(passiveEmptyingFraction, ranges.passive);
  const activePass = inRange(activeEmptyingFraction, ranges.active);
  const distance = rangeDistance(totalEmptyingFraction, ranges.total)
    + rangeDistance(passiveEmptyingFraction, ranges.passive)
    + rangeDistance(activeEmptyingFraction, ranges.active);
  return {
    totalEmptyingFraction,
    passiveEmptyingFraction,
    activeEmptyingFraction,
    allBroadPass: totalPass && passivePass && activePass,
    broadRangeDistance: Number.isFinite(distance) ? round(distance) : null,
  };
}

function atrialVolumeFunctionForBeat(
  samples: readonly SimSample[],
  chamber: AtrialChamber,
): Required<Pick<VolumeFunction,
  "totalEmptyingFraction" | "passiveEmptyingFraction" | "activeEmptyingFraction"
>> | null {
  if (samples.length < 16) return null;
  const volume = (sample: SimSample): number => chamber === "LA" ? sample.VLA : sample.VRA;
  const volumes = samples.map(volume).filter(Number.isFinite);
  if (volumes.length === 0) return null;
  const maxVolumeMl = Math.max(...volumes);
  const minVolumeMl = Math.min(...volumes);
  const preAtrialContractionVolumeMl = volume(nearestThetaSample(samples, 0.76));
  return {
    totalEmptyingFraction: (maxVolumeMl - minVolumeMl) / Math.max(maxVolumeMl, 1e-9),
    passiveEmptyingFraction: (maxVolumeMl - preAtrialContractionVolumeMl) / Math.max(maxVolumeMl, 1e-9),
    activeEmptyingFraction: (preAtrialContractionVolumeMl - minVolumeMl)
      / Math.max(preAtrialContractionVolumeMl, 1e-9),
  };
}

function loopShape(samples: readonly SimSample[], chamber: AtrialChamber): LoopShape {
  if (samples.length < 16) {
    return { pressureRangeMmHg: null, volumeRangeMl: null, roughnessSamplingSpan: null };
  }
  const loopSamples = samples.map((sample) => ({
    t: sample.t,
    volumeMl: chamber === "LA" ? sample.VLA : sample.VRA,
    pressureMmHg: chamber === "LA" ? sample.LAP : sample.RAP,
  }));
  const volumes = loopSamples.map((sample) => sample.volumeMl);
  const pressures = loopSamples.map((sample) => sample.pressureMmHg);
  const roughnessValues = ROUGHNESS_SAMPLE_HZ.map((hz) => pvLoopRoughness(downsample(loopSamples, hz)));
  return {
    pressureRangeMmHg: finiteOrNull(Math.max(...pressures) - Math.min(...pressures)),
    volumeRangeMl: finiteOrNull(Math.max(...volumes) - Math.min(...volumes)),
    roughnessSamplingSpan: finiteOrNull(relativeSpan(roughnessValues)),
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
    throw new Error("Atrial waveform target range must contain two finite numbers.");
  }
  return [value[0], value[1]];
}

function totalDistance(summary: VariantSummary): number {
  return (summary.meanLaDistance ?? Number.POSITIVE_INFINITY)
    + (summary.meanRaDistance ?? Number.POSITIVE_INFINITY);
}

function valueAt(sample: SimSample, key: string): number {
  const value = (sample as unknown as Record<string, number | undefined>)[key];
  return Number.isFinite(value) ? value! : 0;
}

function maxFinite(values: readonly number[]): number {
  const finite = values.filter(Number.isFinite);
  return finite.length === 0 ? Number.NaN : Math.max(...finite);
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
  const evidence = buildAtrialA2SensitivityPhase5BAEvidence();
  const outPath = path.resolve(process.cwd(), ATRIAL_A2_SENSITIVITY_PHASE5BA_RESULT_PATH);
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
    bestVariantId: evidence.summary.bestVariantId,
    bestVariantStatus: evidence.summary.bestVariantStatus,
    fullA2BothAtriaPassPointIds: evidence.termAttribution.fullA2BothAtriaPassPointIds,
    normalHr75FullSignalPreservedBy: evidence.termAttribution.normalHr75FullSignalPreservedBy,
  }, null, 2));
}
