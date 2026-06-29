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

export const ATRIAL_VALVE_DIODE_READABILITY_PHASE5BC_ID =
  "atrial-valve-diode-readability-phase5bc-result-v1";

export const ATRIAL_VALVE_DIODE_READABILITY_PHASE5BC_RESULT_PATH =
  "data/myocardium/protocols/atrial-valve-diode-readability-phase5bc-result-v1.json";

type AtrialChamber = "LA" | "RA";
type Valve = "MV" | "TV";
type LoopViewId = "raw" | "valve-hit-masked" | "valve-hit-pressure-interpolated";
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

type LoopMetrics = {
  readonly viewId: LoopViewId;
  readonly pressureRangeMmHg: number | null;
  readonly volumeRangeMl: number | null;
  readonly boosterLoopSignedArea: number | null;
  readonly reservoirLoopSignedArea: number | null;
  readonly lobeBalance: number | null;
  readonly signedLobesOpposed: boolean;
  readonly pvSelfIntersections: number | null;
  readonly roughnessSamplingSpan: number | null;
  readonly sampleFractionUsed: number;
  readonly educationalFigureEightReadable: boolean;
  readonly readabilityScore: number | null;
};

type ChamberReadabilityComparison = {
  readonly raw: LoopMetrics;
  readonly valveHitMasked: LoopMetrics;
  readonly valveHitPressureInterpolated: LoopMetrics;
  readonly maskedScoreGainVsRaw: number | null;
  readonly interpolatedScoreGainVsRaw: number | null;
  readonly maskedReadabilityJump: boolean;
  readonly interpolatedReadabilityJump: boolean;
};

type ValveAttribution = {
  readonly hitsPerBeat: number;
  readonly diodeImpulsePerBeat: number;
  readonly qDotClampHitFraction: number;
  readonly hitWindowSampleFraction: number;
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
  readonly LA: ChamberReadabilityComparison;
  readonly RA: ChamberReadabilityComparison;
  readonly valveAttribution: Record<Valve, ValveAttribution>;
};

type VariantSummary = {
  readonly variantId: VariantId;
  readonly healthOkPointIds: readonly PointId[];
  readonly rawReadableBothPointIds: readonly PointId[];
  readonly maskedReadableBothPointIds: readonly PointId[];
  readonly interpolatedReadableBothPointIds: readonly PointId[];
  readonly rawReadableEitherPointIds: readonly PointId[];
  readonly maskedReadableEitherPointIds: readonly PointId[];
  readonly interpolatedReadableEitherPointIds: readonly PointId[];
  readonly meanCombinedRawScore: number | null;
  readonly meanCombinedMaskedScore: number | null;
  readonly meanCombinedInterpolatedScore: number | null;
  readonly meanCombinedMaskedScoreGain: number | null;
  readonly meanCombinedInterpolatedScoreGain: number | null;
  readonly meanValveImpulsePerBeat: number | null;
  readonly meanValveHitsPerBeat: number | null;
  readonly meanValveHitWindowSampleFraction: number | null;
  readonly valveLimiterSignal: "readability-jump" | "score-only-signal" | "not-supported";
};

type Evidence = {
  readonly schemaVersion: 1;
  readonly id: typeof ATRIAL_VALVE_DIODE_READABILITY_PHASE5BC_ID;
  readonly phase: "Phase 5BC";
  readonly claimBoundary: "atrial-valve-diode-readability-diagnostic-no-valve-change";
  readonly protocol: {
    readonly runtimeActiveSourceMode: typeof MODELCORE_RUNTIME_LV_RV_LAND_DEFAULT_MODE;
    readonly pointSource: "hr75-hr90-normal-low-high-preload";
    readonly variantIds: readonly VariantId[];
    readonly dtSec: typeof DT_SEC;
    readonly sampleHz: typeof SAMPLE_HZ;
    readonly measureBeats: typeof MEASURE_BEATS;
    readonly valveHitWindowMs: typeof VALVE_HIT_WINDOW_MS;
    readonly loopViews: readonly LoopViewId[];
    readonly noRuntimeDefaultFlip: true;
    readonly noProductionBridgeSelection: true;
    readonly noValveModelChange: true;
    readonly noParameterTuning: true;
    readonly noPermanentVerifierOrNpmScriptAdded: true;
  };
  readonly points: readonly PointSpec[];
  readonly runs: readonly Run[];
  readonly variantSummaries: readonly VariantSummary[];
  readonly valveLimiterAttribution: {
    readonly status: "supported" | "partial-score-only" | "not-supported";
    readonly rawBestVariantId: VariantId | null;
    readonly cleanedBestVariantId: VariantId | null;
    readonly variantsWithReadabilityJump: readonly VariantId[];
    readonly variantsWithScoreOnlySignal: readonly VariantId[];
    readonly currentInterpretation: string;
  };
  readonly summary: {
    readonly recommendedNext: readonly string[];
    readonly blockers: readonly string[];
  };
  readonly boundary: {
    readonly noAtrialBridgeSelection: true;
    readonly noValveLoadTimingAcceptance: true;
    readonly noValveSmoothingAdoption: true;
    readonly noAllChamberRuntimeDefaultFlip: true;
    readonly noOfficialMorphologyAcceptance: true;
    readonly noAfValidationClaim: true;
  };
  readonly normalizedSha256: string;
};

const DT_SEC = 0.001 as const;
const SAMPLE_HZ = 1000 as const;
const MEASURE_BEATS = 3 as const;
const VALVE_HIT_WINDOW_MS = 0 as const;
const ROUGHNESS_SAMPLE_HZ = [240, 480, 960] as const;
const READABILITY = {
  minPressureRangeMmHg: 1.5,
  minVolumeRangeMl: 12,
  minLobeBalance: 0.08,
  maxRoughnessSamplingSpan: 0.45,
  minSampleFractionUsed: 0.75,
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

const VARIANTS: readonly VariantId[] = [
  "runtime-default-atrial-active-reference",
  "a1-refined-reference",
  "a2-conduit-full",
  "a2-conduit-no-viscous",
  "a2-conduit-no-booster",
  "a2-conduit-no-av-plane-extra",
] as const;

const LOOP_VIEWS: readonly LoopViewId[] = [
  "raw",
  "valve-hit-masked",
  "valve-hit-pressure-interpolated",
] as const;

export function buildAtrialValveDiodeReadabilityPhase5BCEvidence(): Evidence {
  const runs = VARIANTS.flatMap((variantId) => POINTS.map((point) => runPoint(variantId, point)));
  const variantSummaries = VARIANTS.map((variantId) => summarizeVariant(variantId, runs));
  const valveLimiterAttribution = buildValveLimiterAttribution(variantSummaries);
  const evidenceWithoutHash: Omit<Evidence, "normalizedSha256"> = {
    schemaVersion: 1,
    id: ATRIAL_VALVE_DIODE_READABILITY_PHASE5BC_ID,
    phase: "Phase 5BC",
    claimBoundary: "atrial-valve-diode-readability-diagnostic-no-valve-change",
    protocol: {
      runtimeActiveSourceMode: MODELCORE_RUNTIME_LV_RV_LAND_DEFAULT_MODE,
      pointSource: "hr75-hr90-normal-low-high-preload",
      variantIds: VARIANTS,
      dtSec: DT_SEC,
      sampleHz: SAMPLE_HZ,
      measureBeats: MEASURE_BEATS,
      valveHitWindowMs: VALVE_HIT_WINDOW_MS,
      loopViews: LOOP_VIEWS,
      noRuntimeDefaultFlip: true,
      noProductionBridgeSelection: true,
      noValveModelChange: true,
      noParameterTuning: true,
      noPermanentVerifierOrNpmScriptAdded: true,
    },
    points: POINTS,
    runs,
    variantSummaries,
    valveLimiterAttribution,
    summary: {
      recommendedNext: recommendedNext(valveLimiterAttribution.status),
      blockers: [
        "A2 remains off-by-default and unselected",
        "this artifact does not change the valve model or remove diode clamps",
        "masked/interpolated loop scoring is a diagnostic lens, not morphology acceptance",
      ],
    },
    boundary: {
      noAtrialBridgeSelection: true,
      noValveLoadTimingAcceptance: true,
      noValveSmoothingAdoption: true,
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
    LA: chamberComparison(samples, "LA"),
    RA: chamberComparison(samples, "RA"),
    valveAttribution: {
      MV: valveAttribution(samples, "MV"),
      TV: valveAttribution(samples, "TV"),
    },
  };
}

function createVariantProviders(
  variantId: VariantId,
): Partial<Record<Chamber, ModelCoreExperimentalActiveSourceProvider>> {
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

function chamberComparison(
  samples: readonly SimSample[],
  chamber: AtrialChamber,
): ChamberReadabilityComparison {
  const mask = valveHitWindowMask(samples, chamberValve(chamber), VALVE_HIT_WINDOW_MS);
  const raw = loopMetrics(samples, chamber, "raw", 1);
  const maskedSamples = samples.filter((_sample, index) => !mask[index]);
  const sampleFractionUsed = samples.length > 0 ? maskedSamples.length / samples.length : 0;
  const valveHitMasked = loopMetrics(maskedSamples, chamber, "valve-hit-masked", sampleFractionUsed);
  const interpolated = interpolatePressureAcrossMask(samples, chamber, mask);
  const valveHitPressureInterpolated = loopMetrics(
    interpolated,
    chamber,
    "valve-hit-pressure-interpolated",
    1,
  );
  return {
    raw,
    valveHitMasked,
    valveHitPressureInterpolated,
    maskedScoreGainVsRaw: scoreDelta(valveHitMasked, raw),
    interpolatedScoreGainVsRaw: scoreDelta(valveHitPressureInterpolated, raw),
    maskedReadabilityJump: !raw.educationalFigureEightReadable && valveHitMasked.educationalFigureEightReadable,
    interpolatedReadabilityJump:
      !raw.educationalFigureEightReadable && valveHitPressureInterpolated.educationalFigureEightReadable,
  };
}

function summarizeVariant(variantId: VariantId, runs: readonly Run[]): VariantSummary {
  const variantRuns = runs.filter((run) => run.variantId === variantId);
  const rawReadableBothPointIds = variantRuns
    .filter((run) => bothReadable(run, "raw"))
    .map((run) => run.pointId);
  const maskedReadableBothPointIds = variantRuns
    .filter((run) => bothReadable(run, "valve-hit-masked"))
    .map((run) => run.pointId);
  const interpolatedReadableBothPointIds = variantRuns
    .filter((run) => bothReadable(run, "valve-hit-pressure-interpolated"))
    .map((run) => run.pointId);
  const meanCombinedMaskedScoreGain = finiteOrNull(mean(variantRuns.map((run) =>
    combinedScore(run, "valve-hit-masked") - combinedScore(run, "raw"))));
  const meanCombinedInterpolatedScoreGain = finiteOrNull(mean(variantRuns.map((run) =>
    combinedScore(run, "valve-hit-pressure-interpolated") - combinedScore(run, "raw"))));
  const valveLimiterSignal = limiterSignal(
    rawReadableBothPointIds,
    maskedReadableBothPointIds,
    interpolatedReadableBothPointIds,
    meanCombinedMaskedScoreGain,
    meanCombinedInterpolatedScoreGain,
  );
  return {
    variantId,
    healthOkPointIds: variantRuns.filter((run) => run.health.status === "ok").map((run) => run.pointId),
    rawReadableBothPointIds,
    maskedReadableBothPointIds,
    interpolatedReadableBothPointIds,
    rawReadableEitherPointIds: variantRuns
      .filter((run) => eitherReadable(run, "raw"))
      .map((run) => run.pointId),
    maskedReadableEitherPointIds: variantRuns
      .filter((run) => eitherReadable(run, "valve-hit-masked"))
      .map((run) => run.pointId),
    interpolatedReadableEitherPointIds: variantRuns
      .filter((run) => eitherReadable(run, "valve-hit-pressure-interpolated"))
      .map((run) => run.pointId),
    meanCombinedRawScore: finiteOrNull(mean(variantRuns.map((run) => combinedScore(run, "raw")))),
    meanCombinedMaskedScore: finiteOrNull(mean(variantRuns.map((run) =>
      combinedScore(run, "valve-hit-masked")))),
    meanCombinedInterpolatedScore: finiteOrNull(mean(variantRuns.map((run) =>
      combinedScore(run, "valve-hit-pressure-interpolated")))),
    meanCombinedMaskedScoreGain,
    meanCombinedInterpolatedScoreGain,
    meanValveImpulsePerBeat: finiteOrNull(mean(variantRuns.map((run) =>
      run.valveAttribution.MV.diodeImpulsePerBeat + run.valveAttribution.TV.diodeImpulsePerBeat))),
    meanValveHitsPerBeat: finiteOrNull(mean(variantRuns.map((run) =>
      run.valveAttribution.MV.hitsPerBeat + run.valveAttribution.TV.hitsPerBeat))),
    meanValveHitWindowSampleFraction: finiteOrNull(mean(variantRuns.map((run) =>
      (run.valveAttribution.MV.hitWindowSampleFraction + run.valveAttribution.TV.hitWindowSampleFraction) / 2))),
    valveLimiterSignal,
  };
}

function buildValveLimiterAttribution(
  summaries: readonly VariantSummary[],
): Evidence["valveLimiterAttribution"] {
  const rawBest = summaries.slice().sort((left, right) =>
    right.rawReadableBothPointIds.length - left.rawReadableBothPointIds.length
    || finiteOrScore(right.meanCombinedRawScore) - finiteOrScore(left.meanCombinedRawScore)
  )[0] ?? null;
  const cleanedBest = summaries.slice().sort((left, right) =>
    right.interpolatedReadableBothPointIds.length - left.interpolatedReadableBothPointIds.length
    || finiteOrScore(right.meanCombinedInterpolatedScore) - finiteOrScore(left.meanCombinedInterpolatedScore)
  )[0] ?? null;
  const variantsWithReadabilityJump = summaries
    .filter((summary) => summary.valveLimiterSignal === "readability-jump")
    .map((summary) => summary.variantId);
  const variantsWithScoreOnlySignal = summaries
    .filter((summary) => summary.valveLimiterSignal === "score-only-signal")
    .map((summary) => summary.variantId);
  const status = variantsWithReadabilityJump.length > 0
    ? "supported"
    : variantsWithScoreOnlySignal.length > 0
      ? "partial-score-only"
      : "not-supported";
  return {
    status,
    rawBestVariantId: rawBest?.variantId ?? null,
    cleanedBestVariantId: cleanedBest?.variantId ?? null,
    variantsWithReadabilityJump,
    variantsWithScoreOnlySignal,
    currentInterpretation: interpretation(status, variantsWithReadabilityJump, variantsWithScoreOnlySignal),
  };
}

function recommendedNext(status: Evidence["valveLimiterAttribution"]["status"]): readonly string[] {
  if (status === "supported") {
    return [
      "treat valve-diode contamination as a likely binding constraint for atrial figure-eight readability and filling-edge roughness",
      "next run a narrow off-by-default AV-valve smoothing or complementarity diagnostic instead of adding another A2-only gain path",
      "keep A2 and A1 diagnostic-only until a real valve/load timing candidate preserves CO/SV and bounded regurgitation",
    ];
  }
  if (status === "partial-score-only") {
    return [
      "run one narrow AV-valve smoothing diagnostic to see whether score-only improvements become real readable loops",
      "continue LandAtrial shadow work in parallel, using the reusable reservoir/conduit coupling and target-pack scoring",
      "do not tune A2 gains from cleaned-loop score improvements alone",
    ];
  }
  return [
    "do not prioritize valve-diode smoothing from this artifact alone",
    "continue LandAtrial shadow and wall/AV-plane strain proxy work as the primary atrial physiology path",
    "keep A2 off-by-default and avoid another A2-only path unless it answers a distinct diagnostic question",
  ];
}

function interpretation(
  status: Evidence["valveLimiterAttribution"]["status"],
  jumpVariants: readonly VariantId[],
  scoreVariants: readonly VariantId[],
): string {
  if (status === "supported") {
    return [
      "Valve-hit pressure interpolation or masking creates at least one both-chamber readability jump.",
      `Jump variants: ${jumpVariants.join(", ")}.`,
      "This supports valve diode event contamination as a likely limiter for the current atrial loop readability metrics, without changing the valve model.",
    ].join(" ");
  }
  if (status === "partial-score-only") {
    return [
      "Valve-hit cleanup improves loop readability scores but does not create a both-chamber readable-loop jump.",
      `Score-only variants: ${scoreVariants.join(", ")}.`,
      "This is a weak valve-limiter signal and should only justify a narrow off-by-default valve smoothing diagnostic.",
    ].join(" ");
  }
  return "Valve-hit cleanup did not materially improve atrial figure-eight readability in this artifact; the binding constraint remains more likely atrial mechanics, wall/AV-plane strain representation, or target scoring.";
}

function limiterSignal(
  rawBoth: readonly PointId[],
  maskedBoth: readonly PointId[],
  interpolatedBoth: readonly PointId[],
  maskedGain: number | null,
  interpolatedGain: number | null,
): VariantSummary["valveLimiterSignal"] {
  if (
    maskedBoth.some((pointId) => !rawBoth.includes(pointId))
    || interpolatedBoth.some((pointId) => !rawBoth.includes(pointId))
  ) {
    return "readability-jump";
  }
  if (Math.max(maskedGain ?? Number.NEGATIVE_INFINITY, interpolatedGain ?? Number.NEGATIVE_INFINITY) >= 0.08) {
    return "score-only-signal";
  }
  return "not-supported";
}

function bothReadable(run: Run, viewId: LoopViewId): boolean {
  return loopForView(run.LA, viewId).educationalFigureEightReadable
    && loopForView(run.RA, viewId).educationalFigureEightReadable;
}

function eitherReadable(run: Run, viewId: LoopViewId): boolean {
  return loopForView(run.LA, viewId).educationalFigureEightReadable
    || loopForView(run.RA, viewId).educationalFigureEightReadable;
}

function combinedScore(run: Run, viewId: LoopViewId): number {
  const la = loopForView(run.LA, viewId).readabilityScore;
  const ra = loopForView(run.RA, viewId).readabilityScore;
  return (la ?? Number.NaN) + (ra ?? Number.NaN);
}

function loopForView(comparison: ChamberReadabilityComparison, viewId: LoopViewId): LoopMetrics {
  if (viewId === "raw") return comparison.raw;
  if (viewId === "valve-hit-masked") return comparison.valveHitMasked;
  return comparison.valveHitPressureInterpolated;
}

function loopMetrics(
  samples: readonly SimSample[],
  chamber: AtrialChamber,
  viewId: LoopViewId,
  sampleFractionUsed: number,
): LoopMetrics {
  if (samples.length < 16 || sampleFractionUsed < READABILITY.minSampleFractionUsed) {
    return emptyLoopMetrics(viewId, sampleFractionUsed);
  }
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
  const intersections = countSelfIntersections(downsample(loopSamples, 240));
  const signedLobesOpposed = boosterSigned * reservoirSigned < 0;
  const educationalFigureEightReadable =
    pressureRange >= READABILITY.minPressureRangeMmHg
    && volumeRange >= READABILITY.minVolumeRangeMl
    && signedLobesOpposed
    && lobeBalance >= READABILITY.minLobeBalance
    && roughnessSamplingSpan <= READABILITY.maxRoughnessSamplingSpan
    && intersections > 0;
  return {
    viewId,
    pressureRangeMmHg: finiteOrNull(pressureRange),
    volumeRangeMl: finiteOrNull(volumeRange),
    boosterLoopSignedArea: finiteOrNull(boosterSigned),
    reservoirLoopSignedArea: finiteOrNull(reservoirSigned),
    lobeBalance: finiteOrNull(lobeBalance),
    signedLobesOpposed,
    pvSelfIntersections: intersections,
    roughnessSamplingSpan: finiteOrNull(roughnessSamplingSpan),
    sampleFractionUsed: round(sampleFractionUsed),
    educationalFigureEightReadable,
    readabilityScore: finiteOrNull(readabilityScore({
      pressureRange,
      volumeRange,
      lobeBalance,
      roughnessSamplingSpan,
      intersections,
      signedLobesOpposed,
    })),
  };
}

function emptyLoopMetrics(viewId: LoopViewId, sampleFractionUsed: number): LoopMetrics {
  return {
    viewId,
    pressureRangeMmHg: null,
    volumeRangeMl: null,
    boosterLoopSignedArea: null,
    reservoirLoopSignedArea: null,
    lobeBalance: null,
    signedLobesOpposed: false,
    pvSelfIntersections: null,
    roughnessSamplingSpan: null,
    sampleFractionUsed: round(sampleFractionUsed),
    educationalFigureEightReadable: false,
    readabilityScore: null,
  };
}

function valveHitWindowMask(
  samples: readonly SimSample[],
  valve: Valve,
  windowMs: number,
): readonly boolean[] {
  const hitIndexes = samples
    .map((sample, index) => ({ index, hit: valueAt(sample, `${valve}_diodeImpulse`) > 0 }))
    .filter((entry) => entry.hit)
    .map((entry) => entry.index);
  if (hitIndexes.length === 0) return samples.map(() => false);
  const sourceHz = estimateSampleHz(samples);
  const radius = Math.max(0, Math.round(windowMs * sourceHz / 1000));
  const mask = samples.map(() => false);
  for (const index of hitIndexes) {
    const lo = Math.max(0, index - radius);
    const hi = Math.min(samples.length - 1, index + radius);
    for (let i = lo; i <= hi; i++) mask[i] = true;
  }
  return mask;
}

function interpolatePressureAcrossMask(
  samples: readonly SimSample[],
  chamber: AtrialChamber,
  mask: readonly boolean[],
): readonly SimSample[] {
  const pressureKey = chamber === "LA" ? "LAP" : "RAP";
  return samples.map((sample, index) => {
    if (!mask[index]) return sample;
    const previous = nearestCleanIndex(mask, index, -1);
    const next = nearestCleanIndex(mask, index, 1);
    if (previous == null || next == null || previous === next) return sample;
    const t0 = samples[previous].t;
    const t1 = samples[next].t;
    const alpha = (sample.t - t0) / Math.max(t1 - t0, 1e-9);
    const p0 = samples[previous][pressureKey];
    const p1 = samples[next][pressureKey];
    const pressure = p0 + alpha * (p1 - p0);
    return { ...sample, [pressureKey]: pressure };
  });
}

function nearestCleanIndex(mask: readonly boolean[], index: number, direction: -1 | 1): number | null {
  for (let cursor = index + direction; cursor >= 0 && cursor < mask.length; cursor += direction) {
    if (!mask[cursor]) return cursor;
  }
  return null;
}

function valveAttribution(samples: readonly SimSample[], valve: Valve): ValveAttribution {
  const hitValues = samples.map((sample) => valueAt(sample, `${valve}_diodeImpulse`) > 0 ? 1 : 0);
  const impulses = samples.map((sample) => Math.max(0, valueAt(sample, `${valve}_diodeImpulse`)));
  const qDotHitValues = samples.map((sample) => valueAt(sample, `${valve}_qDotClampHit01`) > 0 ? 1 : 0);
  const mask = valveHitWindowMask(samples, valve, VALVE_HIT_WINDOW_MS);
  return {
    hitsPerBeat: round(hitValues.reduce((sum, value) => sum + value, 0) / MEASURE_BEATS),
    diodeImpulsePerBeat: round(impulses.reduce((sum, value) => sum + value, 0) / MEASURE_BEATS),
    qDotClampHitFraction: round(qDotHitValues.reduce((sum, value) => sum + value, 0) / Math.max(samples.length, 1)),
    hitWindowSampleFraction: round(mask.filter(Boolean).length / Math.max(samples.length, 1)),
  };
}

function chamberValve(chamber: AtrialChamber): Valve {
  return chamber === "LA" ? "MV" : "TV";
}

function scoreDelta(left: LoopMetrics, right: LoopMetrics): number | null {
  if (left.readabilityScore == null || right.readabilityScore == null) return null;
  return round(left.readabilityScore - right.readabilityScore);
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

function countSelfIntersections(
  samples: readonly { readonly volumeMl: number; readonly pressureMmHg: number }[],
): number {
  let count = 0;
  for (let i = 0; i < samples.length - 3; i++) {
    for (let j = i + 2; j < samples.length - 1; j++) {
      if (segmentsIntersect(
        samples[i].volumeMl,
        samples[i].pressureMmHg,
        samples[i + 1].volumeMl,
        samples[i + 1].pressureMmHg,
        samples[j].volumeMl,
        samples[j].pressureMmHg,
        samples[j + 1].volumeMl,
        samples[j + 1].pressureMmHg,
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
  return t > 1e-6 && t < 1 - 1e-6 && u > 1e-6 && u < 1 - 1e-6;
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

function downsample<T extends { readonly t: number }>(samples: readonly T[], targetHz: number): readonly T[] {
  if (samples.length <= 2) return samples;
  const duration = samples.at(-1)!.t - samples[0].t;
  const sourceHz = samples.length / Math.max(duration, 1e-9);
  const stride = Math.max(1, Math.round(sourceHz / targetHz));
  return samples.filter((_sample, index) => index % stride === 0);
}

function estimateSampleHz(samples: readonly SimSample[]): number {
  if (samples.length < 2) return SAMPLE_HZ;
  const duration = samples.at(-1)!.t - samples[0].t;
  return samples.length / Math.max(duration, 1e-9);
}

function relativeSpan(values: readonly number[]): number {
  const finite = values.filter(Number.isFinite);
  if (finite.length === 0) return Number.POSITIVE_INFINITY;
  const min = Math.min(...finite);
  const max = Math.max(...finite);
  return (max - min) / Math.max(Math.abs(max), Math.abs(min), 1e-9);
}

function valueAt(sample: SimSample, key: string): number {
  const value = (sample as unknown as Record<string, number | undefined>)[key];
  return Number.isFinite(value) ? value! : 0;
}

function finiteOrNull(value: number | null | undefined): number | null {
  return value != null && Number.isFinite(value) ? round(value) : null;
}

function finiteOrScore(value: number | null): number {
  return value ?? Number.NEGATIVE_INFINITY;
}

function mean(values: readonly number[]): number {
  const finite = values.filter(Number.isFinite);
  return finite.length === 0 ? Number.NaN : finite.reduce((sum, value) => sum + value, 0) / finite.length;
}

function frac(value: number): number {
  return value - Math.floor(value);
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
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
  const evidence = buildAtrialValveDiodeReadabilityPhase5BCEvidence();
  const outPath = path.resolve(process.cwd(), ATRIAL_VALVE_DIODE_READABILITY_PHASE5BC_RESULT_PATH);
  mkdirSync(path.dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(evidence, null, 2)}\n`);
  return evidence;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const evidence = writeEvidence();
  console.log(JSON.stringify({
    id: evidence.id,
    normalizedSha256: evidence.normalizedSha256,
    valveLimiterStatus: evidence.valveLimiterAttribution.status,
    variantsWithReadabilityJump: evidence.valveLimiterAttribution.variantsWithReadabilityJump,
    variantsWithScoreOnlySignal: evidence.valveLimiterAttribution.variantsWithScoreOnlySignal,
  }, null, 2));
}
