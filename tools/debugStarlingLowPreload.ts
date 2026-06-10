import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { DEFAULT_PARAMS } from "@/constants";
import { ModelCore, type ModelCoreActiveStressDiagnostics, type ModelCoreClampDiagnostics } from "@/engine/ModelCore";
import { makeIndex } from "@/engine/core/stateLayout";
import type { StarlingSweepRequest } from "@/engine/guytonStarling";
import { PREVIEW_SETTLE_POLICY, type SettleStatus } from "@/engine/settling";
import type { CoreRuntimeParams, SimMetrics, SimObservables, SimSample, SimulationHealth } from "@/engine/protocol";
import type { Chamber } from "@/engine/chambers";
import type { SerializedModelState } from "@/engine/stateContract";

type DebugOptions = {
  outDir: string;
  targetVolumeMl: number;
  deltasMl: number[];
  dtValues: number[];
  lambdaActTauSecValues: number[];
  traceBeats: number;
  sampleHz: number;
};

type ActiveBeatSummary = {
  lambdaMean: number;
  lambdaMin: number;
  lambdaMax: number;
  lambdaRawMean: number;
  lambdaActMean: number;
  tauLambdaActSecMean: number;
  KdMean: number;
  aInfMean: number;
  tauAMean: number;
  cMean: number;
  aMean: number;
  sigmaActTargetMean: number;
  sigmaActMean: number;
  sigmaPasMean: number;
  fIsoMean: number;
  gOverMean: number;
  forceVelocityScaleMean: number;
  dLogAInf_dLambdaActMean: number;
  dLogFIso_dLambdaActMean: number;
  dLogGOver_dLambdaRawMean: number;
  dLogCompositeActive_dLambdaActMean: number;
  lambdaActMinusRawMean: number;
  dLogAInf_dLambdaMean: number;
  dLogFIso_dLambdaMean: number;
  dLogGOver_dLambdaMean: number;
  dLogCompositeActive_dLambdaMean: number;
  pressureFloorHitFraction: number;
};

type BeatTraceRow = {
  beat: number;
  sampleCount: number;
  LAPMean: number;
  RAPMean: number;
  CO_L: number;
  CO_R: number;
  SV_L: number;
  SV_R: number;
  EDV_L: number;
  ESV_L: number;
  EDV_R: number;
  ESV_R: number;
  LVPMax: number;
  QAoMax: number;
  active: Partial<Record<Chamber, ActiveBeatSummary>>;
};

type ValveTraceSummary = {
  minQ: number;
  maxQ: number;
  forwardVolumeMl: number;
  reverseVolumeMl: number;
  negativeSampleCount: number;
};

type ReturnMapFeature = {
  plus: number;
  minus: number;
  centralSlope: number;
  absCentralSlope: number;
};

type ReturnMapFeatureKey = "EDV_L" | "ESV_L" | "CO_L" | "LAPMean";
type ReturnMapModeKey = "volumeLambdaActFixed" | "volumeLambdaActReset";

type ReturnMapPhaseDiagnostic = {
  measuredBeatPlus: number | null;
  measuredBeatMinus: number | null;
  features: Partial<Record<ReturnMapFeatureKey, ReturnMapFeature>>;
  clampCrossing: boolean;
  nonsmooth: boolean;
  plusClampHits: number;
  minusClampHits: number;
};

type ReturnMapDiagnostic = {
  status: "ok" | "failed";
  method: "edv-section-volume-preserving-lv-pvein-central-difference";
  sectionInterpolation: "sample-peak";
  perturbationMl: number;
  primaryMode: ReturnMapModeKey;
  sourcePhi: number;
  sectionBeat: number | null;
  sectionPhi: number | null;
  sectionVlvMl: number | null;
  measuredBeatPlus: number | null;
  measuredBeatMinus: number | null;
  features: Partial<Record<ReturnMapFeatureKey, ReturnMapFeature>>;
  oneBeat: ReturnMapPhaseDiagnostic | null;
  twoBeatSamePhase: ReturnMapPhaseDiagnostic | null;
  modes: Partial<Record<ReturnMapModeKey, {
    description: string;
    oneBeat: ReturnMapPhaseDiagnostic | null;
    twoBeatSamePhase: ReturnMapPhaseDiagnostic | null;
  }>>;
  branchAmplitude: Partial<Record<ReturnMapFeatureKey, number>>;
  branchAmplitudeFraction: Partial<Record<ReturnMapFeatureKey, number>>;
  clampCrossing: boolean;
  nonsmooth: boolean;
  failureReason?: string;
};

type DebugPoint = {
  deltaVolumeMl: number;
  targetVolumeMl: number;
  seededFromDeltaMl: number | null;
  wallMs: number;
  settle: Pick<SettleStatus, "settled" | "reason" | "periodBeats" | "periodDelta" | "adjacentDelta" | "worstSignal" | "worstDelta" | "beats"> & {
    actualSeconds: number | null;
  };
  health: {
    status: string;
    clampHitCount: number;
    leftRightFlowMismatchLMin: number;
    cycleMetricDelta: number;
    messages: string[];
  };
  periodMetrics: MetricSummary;
  lastBeatMetrics: Omit<MetricSummary, "SV_L" | "SV_R" | "LVEDPApprox" | "RVEDPApprox">;
  valveVolumesMl: {
    MVReverse: number;
    AoVReverse: number;
    TVReverse: number;
    PVReverse: number;
    MVForward: number;
    AoVForward: number;
    TVForward: number;
    PVForward: number;
  };
  valveTrace: Record<"MV" | "AoV" | "TV" | "PV", ValveTraceSummary>;
  clampDiagnostics: ModelCoreClampDiagnostics;
  activeStressTerminal: ModelCoreActiveStressDiagnostics;
  beatTrace: BeatTraceRow[];
  returnMap: ReturnMapDiagnostic;
  observables: Pick<SimObservables, "P_PVein" | "Pperi" | "Ppc" | "VLVeff" | "VRVeff" | "PLVfw" | "PVI_LV" | "septumShiftMl">;
};

type MetricSummary = {
  LAPMean: number;
  RAPMean: number;
  CO_L: number;
  CO_R: number;
  pulmonaryVenousReturnLMin: number;
  systemicVenousReturnLMin: number;
  SV_L: number;
  SV_R: number;
  LVEDPApprox: number;
  RVEDPApprox: number;
};

type DtScenarioReport = {
  dt: number;
  lambdaActTauSec: number;
  points: DebugPoint[];
  summary: DebugSummary;
};

type DebugSummary = {
  pointCount: number;
  period2Count: number;
  maxAdjacentDelta: number;
  maxPeriodDelta: number;
  maxValveReverseMl: number;
  maxClampHitCount: number;
  maxAbsReturnMapSlopeEDVL: number;
  maxAbsTwoBeatReturnMapSlopeEDVL: number;
  maxAbsReturnMapSlopeCOL: number;
  maxAbsTwoBeatReturnMapSlopeCOL: number;
  maxBranchAmplitudeCOL: number;
  maxBranchAmplitudeFractionCOL: number;
  maxBranchAmplitudeEDVL: number;
  maxBranchAmplitudeFractionEDVL: number;
  maxBranchAmplitudeESVL: number;
  maxBranchAmplitudeFractionESVL: number;
  nodeClampHits: Record<string, number>;
  dynamicFlowClampHits: Record<string, number>;
  valveDiodeClampHits: Record<string, number>;
};

type DebugReport = {
  schemaVersion: 5;
  generatedAt: string;
  measurementMode: string;
  targetVolumeMl: number;
  deltasMl: number[];
  dtValues: number[];
  lambdaActTauSecValues: number[];
  traceBeats: number;
  sampleHz: number;
  points: DebugPoint[];
  summary: DebugSummary;
  dtScenarios: DtScenarioReport[];
  interpretation: {
    dtSensitivity: string;
    activeStressFields: string[];
    clampFields: string[];
  };
};

type TraceSample = {
  sample: SimSample;
  active: ModelCoreActiveStressDiagnostics;
};

type DebugRun = {
  core: ModelCore;
  settle: SettleStatus;
  metrics: SimMetrics;
  lastBeatMetrics: SimMetrics;
  health: SimulationHealth;
  observables: SimObservables;
  state: SerializedModelState;
  wallMs: number;
};

const DEFAULT_DELTAS = [0, -900, -1000, -1100, -1200, -1300, -1400, -1500, -1600];
const DEFAULT_DT_VALUES = [0.001, 0.0005, 0.002];
const DEFAULT_LAMBDA_ACT_TAU_SEC_VALUES = [0];
const DEFAULT_SAMPLE_HZ = 120;
const RETURN_MAP_PERTURBATION_ML = 0.5;
const SETTLE_POLICY = { ...PREVIEW_SETTLE_POLICY, capSeconds: 45 };
const RUN_OPTIONS = {
  collectSamples: false,
  recordHistory: true,
  historyLimit: 720,
};
const CSV_COLUMNS = [
  "dt",
  "lambdaActTauSec",
  "deltaVolumeMl",
  "targetVolumeMl",
  "beat",
  "LAPMean",
  "CO_L",
  "CO_R",
  "EDV_L",
  "ESV_L",
  "LV_lambdaMean",
  "LV_lambdaActMean",
  "LV_lambdaActMinusRawMean",
  "LV_KdMean",
  "LV_aInfMean",
  "LV_sigmaActMean",
  "LV_fIsoMean",
  "LV_forceVelocityScaleMean",
  "branchAmplitudeCO_L",
  "branchAmplitudeFractionCO_L",
  "branchAmplitudeEDV_L",
  "branchAmplitudeFractionEDV_L",
  "returnMapEDVSlope",
  "returnMapTwoBeatEDVSlope",
  "returnMapResetLambdaActTwoBeatEDVSlope",
  "returnMapCOSlope",
  "returnMapTwoBeatCOSlope",
];

export function runLowPreloadDebug(opts: DebugOptions): DebugReport {
  const dtValues = opts.dtValues.length > 0 ? opts.dtValues : DEFAULT_DT_VALUES;
  const lambdaActTauSecValues = opts.lambdaActTauSecValues.length > 0
    ? opts.lambdaActTauSecValues
    : DEFAULT_LAMBDA_ACT_TAU_SEC_VALUES;
  const dtScenarios = lambdaActTauSecValues.flatMap((tau) => dtValues.map((dt) => runDtScenario(opts, dt, tau)));
  const primary = dtScenarios[0] ?? runDtScenario(opts, 0.001, 0);
  return {
    schemaVersion: 5,
    generatedAt: new Date().toISOString(),
    measurementMode: "continuous low-preload march; period-aware metrics; active-stress/clamp/valve diagnostics; branch-amplitude primary gate; EDV-section volume-preserving LV/PVein one-beat/two-beat return-map slopes with lambdaAct consistency modes; dt and off-by-default lambdaAct sensitivity",
    targetVolumeMl: opts.targetVolumeMl,
    deltasMl: opts.deltasMl,
    dtValues,
    lambdaActTauSecValues,
    traceBeats: opts.traceBeats,
    sampleHz: opts.sampleHz,
    points: primary.points,
    summary: primary.summary,
    dtScenarios,
    interpretation: {
      dtSensitivity: "If period-2 disappears or strongly changes at smaller dt, numerical coupling is implicated; if it persists, active-stress model dynamics are implicated.",
      activeStressFields: ["lambdaRaw", "lambdaAct", "tauLambdaActSec", "lambdaActMinusRaw", "Kd", "aInf", "tauA", "c", "a", "sigmaActTarget", "sigmaAct", "sigmaPas", "fIso", "gOver", "forceVelocityScale", "dLogAInf_dLambdaAct", "dLogFIso_dLambdaAct", "dLogGOver_dLambdaRaw", "dLogCompositeActive_dLambdaAct"],
      clampFields: ["nodeClampHits", "dynamicFlowClampHits", "valveDiodeClampHits"],
    },
  };
}

export function reportToMarkdown(report: DebugReport): string {
  const lines: string[] = [];
  lines.push("# Starling low-preload root-cause diagnostics");
  lines.push("");
  lines.push(`Generated: ${report.generatedAt}`);
  lines.push(`Measurement: ${report.measurementMode}`);
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push("| tau lambdaAct s | dt | points | period-2 | max adjacent delta | max period delta | max CO branch amp | max CO branch frac | max EDV branch amp | max EDV branch frac | max valve reverse mL | max clamp hits | max one-beat EDV slope | max two-beat EDV slope |");
  lines.push("| ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |");
  for (const scenario of report.dtScenarios) {
    lines.push([
      round(scenario.lambdaActTauSec, 4),
      round(scenario.dt, 5),
      scenario.summary.pointCount,
      scenario.summary.period2Count,
      round(scenario.summary.maxAdjacentDelta, 4),
      round(scenario.summary.maxPeriodDelta, 4),
      round(scenario.summary.maxBranchAmplitudeCOL, 4),
      round(scenario.summary.maxBranchAmplitudeFractionCOL, 4),
      round(scenario.summary.maxBranchAmplitudeEDVL, 4),
      round(scenario.summary.maxBranchAmplitudeFractionEDVL, 4),
      round(scenario.summary.maxValveReverseMl, 6),
      scenario.summary.maxClampHitCount,
      round(scenario.summary.maxAbsReturnMapSlopeEDVL, 4),
      round(scenario.summary.maxAbsTwoBeatReturnMapSlopeEDVL, 4),
    ].join(" | ").replace(/^/, "| ").replace(/$/, " |"));
  }
  lines.push("");
  lines.push("## Primary dt points");
  lines.push("");
  lines.push("| delta | target TBV | seed | period | reason | actual s | worst signal | worst delta | adj delta | period delta | LAP | CO_L period | CO_L last beat | CO_R period | PV return | clamp hits | valve reverse max | LV lambda raw | LV lambda act | LV lambdaAct-raw | LV Kd mean | LV fIso mean | branch CO amp | branch CO frac | branch EDV amp | branch EDV frac | one-beat EDV slope | two-beat EDV slope | reset-lambdaAct two-beat EDV slope | nonsmooth |");
  lines.push("| ---: | ---: | ---: | --- | --- | ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |");
  for (const p of report.points) {
    const lastBeat = p.beatTrace.at(-1);
    const lv = lastBeat?.active.LV;
    lines.push([
      p.deltaVolumeMl,
      p.targetVolumeMl,
      p.seededFromDeltaMl ?? "",
      `period-${p.settle.periodBeats ?? 1}`,
      p.settle.reason,
      round(p.settle.actualSeconds ?? NaN, 3),
      p.settle.worstSignal ?? "",
      round(p.settle.worstDelta, 4),
      round(p.settle.adjacentDelta, 4),
      round(p.settle.periodDelta, 4),
      round(p.periodMetrics.LAPMean, 3),
      round(p.periodMetrics.CO_L, 3),
      round(p.lastBeatMetrics.CO_L, 3),
      round(p.periodMetrics.CO_R, 3),
      round(p.periodMetrics.pulmonaryVenousReturnLMin, 3),
      p.health.clampHitCount,
      round(maxValveReverse(p), 6),
      round(lv?.lambdaRawMean ?? lv?.lambdaMean ?? NaN, 4),
      round(lv?.lambdaActMean ?? NaN, 4),
      round(lv?.lambdaActMinusRawMean ?? NaN, 4),
      round(lv?.KdMean ?? NaN, 4),
      round(lv?.fIsoMean ?? NaN, 4),
      round(p.returnMap.branchAmplitude.CO_L ?? NaN, 4),
      round(p.returnMap.branchAmplitudeFraction.CO_L ?? NaN, 4),
      round(p.returnMap.branchAmplitude.EDV_L ?? NaN, 4),
      round(p.returnMap.branchAmplitudeFraction.EDV_L ?? NaN, 4),
      round(returnMapSlope(p, "EDV_L"), 4),
      round(twoBeatReturnMapSlope(p, "EDV_L"), 4),
      round(modeTwoBeatSlope(p, "volumeLambdaActReset", "EDV_L"), 4),
      p.returnMap.nonsmooth ? "yes" : "no",
    ].join(" | ").replace(/^/, "| ").replace(/$/, " |"));
  }
  lines.push("");
  lines.push("## Clamp attribution, primary dt");
  lines.push("");
  lines.push("### Node clamps");
  appendRecordTable(lines, report.summary.nodeClampHits);
  lines.push("### Dynamic-flow clamps");
  appendRecordTable(lines, report.summary.dynamicFlowClampHits);
  lines.push("### Valve diode clamps");
  appendRecordTable(lines, report.summary.valveDiodeClampHits);
  lines.push("");
  lines.push("## Notes for model review");
  lines.push("");
  lines.push("- `CO_L last beat` is intentionally shown next to period-aware `CO_L period`; large separation is expected in period-2 alternans.");
  lines.push("- Nominal valve reverse volumes should remain near zero. Diode clamp hits show how often no-leak valve reverse predictions were clipped before becoming state flow.");
  lines.push("- Node-specific clamp attribution separates low-volume pressure/volume bounds from aggregate health warnings.");
  lines.push("- Return-map slopes are central differences from a volume-preserving LV/PVein perturbation at the next LV EDV section. `one-beat` measures the next beat; `two-beat` measures the same phase two beats later. EDV/ESV slopes are one-coordinate section slopes; CO/LAP slopes are response slopes. None of them change model dynamics.");
  lines.push("- Branch amplitude and branch amplitude fraction are classifier-independent high/low beat measurements from the trace; treat them as the primary stabilization signal before interpreting period labels or local slopes.");
  lines.push("- `volumeLambdaActFixed` keeps the active-stretch memory fixed after a volume perturbation; `volumeLambdaActReset` resets LV `lambdaAct` to the post-perturbation raw LV stretch before measuring the return map. The latter is a quasi-static consistency check for lambdaAct experiments, not a model change.");
  lines.push("- `tau lambdaAct s` is an off-by-default experiment. `tau=0` is the shipped model. Positive tau values lag only the length input used by Kd/fIso, not passive pressure, geometry, gOver, force-velocity, or valves.");
  lines.push("- Smaller-dt persistence supports a model-dynamics interpretation; strong dt sensitivity supports an explicit-coupling/numerical interpretation.");
  lines.push("");
  return `${lines.join("\n")}\n`;
}

export function reportToCsv(report: DebugReport): string {
  const rows = [CSV_COLUMNS.join(",")];
  for (const scenario of report.dtScenarios) {
    for (const point of scenario.points) {
      for (const beat of point.beatTrace) {
        const lv = beat.active.LV;
        rows.push([
          scenario.dt,
          scenario.lambdaActTauSec,
          point.deltaVolumeMl,
          point.targetVolumeMl,
          beat.beat,
          beat.LAPMean,
          beat.CO_L,
          beat.CO_R,
          beat.EDV_L,
          beat.ESV_L,
          lv?.lambdaMean ?? "",
          lv?.lambdaActMean ?? "",
          lv?.lambdaActMinusRawMean ?? "",
          lv?.KdMean ?? "",
          lv?.aInfMean ?? "",
          lv?.sigmaActMean ?? "",
          lv?.fIsoMean ?? "",
          lv?.forceVelocityScaleMean ?? "",
          point.returnMap.branchAmplitude.CO_L ?? "",
          point.returnMap.branchAmplitudeFraction.CO_L ?? "",
          point.returnMap.branchAmplitude.EDV_L ?? "",
          point.returnMap.branchAmplitudeFraction.EDV_L ?? "",
          point.returnMap.features.EDV_L?.centralSlope ?? "",
          point.returnMap.twoBeatSamePhase?.features.EDV_L?.centralSlope ?? "",
          point.returnMap.modes.volumeLambdaActReset?.twoBeatSamePhase?.features.EDV_L?.centralSlope ?? "",
          point.returnMap.features.CO_L?.centralSlope ?? "",
          point.returnMap.twoBeatSamePhase?.features.CO_L?.centralSlope ?? "",
        ].map(csvCell).join(","));
      }
    }
  }
  return `${rows.join("\n")}\n`;
}

function runDtScenario(opts: DebugOptions, dt: number, lambdaActTauSec: number): DtScenarioReport {
  const params = paramsWithLambdaActTau(DEFAULT_PARAMS, lambdaActTauSec);
  const req: StarlingSweepRequest = {
    requestId: "debug-starling-low-preload",
    signature: "debug-starling-low-preload",
    instanceId: "debug",
    params,
    targetVolumeMl: opts.targetVolumeMl,
    deltasMl: opts.deltasMl,
    sweepMode: "adaptive",
  };
  const points: DebugPoint[] = [];
  let seedState: SerializedModelState | undefined;
  let seededFromDeltaMl = 0;
  for (const delta of opts.deltasMl) {
    const run = settleDebugCore(req.params, opts.targetVolumeMl + delta, dt, opts.sampleHz, seedState);
    const traceCore = new ModelCore(req.params);
    traceCore.unpackState(run.state);
    const traceSamples = collectTraceSamples(traceCore, opts.traceBeats, dt, opts.sampleHz);
    const beatTrace = summarizeBeatTrace(traceSamples, req.params.HR, opts.traceBeats);
    const returnMap = estimateReturnMapDiagnostic(run.state, req.params, dt, opts.sampleHz);
    points.push({
      deltaVolumeMl: delta,
      targetVolumeMl: opts.targetVolumeMl + delta,
      seededFromDeltaMl: delta === opts.deltasMl[0] ? null : seededFromDeltaMl,
      wallMs: run.wallMs,
      settle: {
        settled: run.settle.settled,
        reason: run.settle.reason,
        periodBeats: run.settle.periodBeats ?? 1,
        periodDelta: run.settle.periodDelta,
        adjacentDelta: run.settle.adjacentDelta,
        worstSignal: run.settle.worstSignal,
        worstDelta: run.settle.worstDelta,
        beats: run.settle.beats,
        actualSeconds: run.settle.actualSeconds ?? null,
      },
      health: {
        status: run.health.status,
        clampHitCount: run.health.clampHitCount,
        leftRightFlowMismatchLMin: run.health.leftRightFlowMismatchLMin,
        cycleMetricDelta: run.health.cycleMetricDelta,
        messages: run.health.messages,
      },
      periodMetrics: metricSummary(run.metrics),
      lastBeatMetrics: {
        LAPMean: run.lastBeatMetrics.LAPMean,
        RAPMean: run.lastBeatMetrics.RAPMean,
        CO_L: run.lastBeatMetrics.CO_L,
        CO_R: run.lastBeatMetrics.CO_R,
        pulmonaryVenousReturnLMin: run.lastBeatMetrics.pulmonaryVenousReturnLMin,
        systemicVenousReturnLMin: run.lastBeatMetrics.systemicVenousReturnLMin,
      },
      valveVolumesMl: {
        MVReverse: run.metrics.MVReverseVolumeMl,
        AoVReverse: run.metrics.AoVReverseVolumeMl,
        TVReverse: run.metrics.TVReverseVolumeMl,
        PVReverse: run.metrics.PVReverseVolumeMl,
        MVForward: run.metrics.MVForwardVolumeMl,
        AoVForward: run.metrics.AoVForwardVolumeMl,
        TVForward: run.metrics.TVForwardVolumeMl,
        PVForward: run.metrics.PVForwardVolumeMl,
      },
      valveTrace: summarizeValves(traceSamples.map((entry) => entry.sample)),
      clampDiagnostics: run.core.debugClampDiagnostics(),
      activeStressTerminal: run.core.debugActiveStressDiagnostics(),
      beatTrace,
      returnMap,
      observables: {
        P_PVein: run.observables.P_PVein,
        Pperi: run.observables.Pperi,
        Ppc: run.observables.Ppc,
        VLVeff: run.observables.VLVeff,
        VRVeff: run.observables.VRVeff,
        PLVfw: run.observables.PLVfw,
        PVI_LV: run.observables.PVI_LV,
        septumShiftMl: run.observables.septumShiftMl,
      },
    });
    seedState = run.state;
    seededFromDeltaMl = delta;
  }
  return { dt, lambdaActTauSec, points, summary: summarizePoints(points) };
}

function paramsWithLambdaActTau(params: CoreRuntimeParams, tauSec: number): CoreRuntimeParams {
  const tau = Math.max(Number.isFinite(tauSec) ? tauSec : 0, 0);
  if (tau <= 0) return params;
  const activeOverride = { tauLambdaActSec: tau };
  return {
    ...params,
    nodeOverrides: {
      ...(params.nodeOverrides ?? {}),
      LV: { ...(params.nodeOverrides?.LV ?? {}), active: { ...((params.nodeOverrides?.LV?.active as Record<string, number> | undefined) ?? {}), ...activeOverride } },
      RV: { ...(params.nodeOverrides?.RV ?? {}), active: { ...((params.nodeOverrides?.RV?.active as Record<string, number> | undefined) ?? {}), ...activeOverride } },
      LA: { ...(params.nodeOverrides?.LA ?? {}), active: { ...((params.nodeOverrides?.LA?.active as Record<string, number> | undefined) ?? {}), ...activeOverride } },
      RA: { ...(params.nodeOverrides?.RA ?? {}), active: { ...((params.nodeOverrides?.RA?.active as Record<string, number> | undefined) ?? {}), ...activeOverride } },
    },
  };
}

function settleDebugCore(
  params: CoreRuntimeParams,
  targetVolumeMl: number,
  dt: number,
  sampleHz: number,
  seedState?: SerializedModelState,
): DebugRun {
  const started = performance.now();
  const core = new ModelCore(params);
  if (seedState) {
    core.unpackState(seedState);
    const retarget = core.retargetTBVFromCurrentState(targetVolumeMl);
    if (!retarget.ok) core.initializeVenousPressuresForTargetTBV(targetVolumeMl);
  } else {
    core.initializeVenousPressuresForTargetTBV(targetVolumeMl);
  }
  const settle = core.settleToSteady(SETTLE_POLICY, dt, sampleHz, RUN_OPTIONS);
  const periodBeats = settle.periodBeats ?? 1;
  const metrics = core.metrics({ windowBeats: periodBeats });
  const lastBeatMetrics = core.metrics({ windowBeats: 1 });
  const health = core.health({ periodBeats });
  const observables = core.debugObservables();
  return {
    core,
    settle,
    metrics,
    lastBeatMetrics,
    health,
    observables,
    state: core.packState(),
    wallMs: performance.now() - started,
  };
}

function collectTraceSamples(core: ModelCore, beats: number, dt: number, sampleHz: number): TraceSample[] {
  const samples: TraceSample[] = [];
  const seconds = (60 / Math.max(core.p.HR, 1)) * (beats + 2);
  const interval = 1 / sampleHz;
  let sampleAt = Math.floor((core.t + 1e-9) / interval) * interval + interval;
  const tEnd = core.t + seconds - 1e-9;
  while (core.t < tEnd) {
    core.step(dt);
    if (core.t >= sampleAt) {
      const sample = core.sample();
      samples.push({ sample, active: core.debugActiveStressDiagnostics() });
      sampleAt += interval;
    }
  }
  return samples;
}

function estimateReturnMapDiagnostic(
  state: SerializedModelState,
  params: CoreRuntimeParams,
  dt: number,
  sampleHz: number,
): ReturnMapDiagnostic {
  try {
    const section = findNextLvEdvSection(state, params, dt);
    const fixedMode = returnMapModeDiagnostic(section.state, params, dt, sampleHz, "volumeLambdaActFixed");
    const resetMode = returnMapModeDiagnostic(section.state, params, dt, sampleHz, "volumeLambdaActReset");
    const branchTraceSamples = collectTraceSamples(newCoreFromState(state, params), 4, dt, sampleHz);
    const branchAmplitude = branchAmplitudeFromTrace(branchTraceSamples, params.HR);
    const branchAmplitudeFraction = branchAmplitudeFractionFromTrace(branchTraceSamples, params.HR);
    const oneBeat = fixedMode.oneBeat;
    const twoBeatSamePhase = fixedMode.twoBeatSamePhase;
    const nonsmooth = oneBeat.nonsmooth || twoBeatSamePhase.nonsmooth;
    return {
      status: "ok",
      method: "edv-section-volume-preserving-lv-pvein-central-difference",
      sectionInterpolation: "sample-peak",
      perturbationMl: RETURN_MAP_PERTURBATION_ML,
      primaryMode: "volumeLambdaActFixed",
      sourcePhi: section.state.phi,
      sectionBeat: section.beat,
      sectionPhi: section.state.phi,
      sectionVlvMl: section.vlvMl,
      measuredBeatPlus: oneBeat.measuredBeatPlus,
      measuredBeatMinus: oneBeat.measuredBeatMinus,
      features: oneBeat.features,
      oneBeat,
      twoBeatSamePhase,
      modes: {
        volumeLambdaActFixed: {
          description: "volume-preserving LV/PVein perturbation; active-stretch memory remains unchanged",
          oneBeat,
          twoBeatSamePhase,
        },
        volumeLambdaActReset: {
          description: "same perturbation, with LV lambdaAct reset to post-perturbation raw LV stretch before marching",
          oneBeat: resetMode.oneBeat,
          twoBeatSamePhase: resetMode.twoBeatSamePhase,
        },
      },
      branchAmplitude,
      branchAmplitudeFraction,
      clampCrossing: oneBeat.clampCrossing || twoBeatSamePhase.clampCrossing,
      nonsmooth,
    };
  } catch (error) {
    return {
      status: "failed",
      method: "edv-section-volume-preserving-lv-pvein-central-difference",
      sectionInterpolation: "sample-peak",
      perturbationMl: RETURN_MAP_PERTURBATION_ML,
      primaryMode: "volumeLambdaActFixed",
      sourcePhi: state.phi,
      sectionBeat: null,
      sectionPhi: null,
      sectionVlvMl: null,
      measuredBeatPlus: null,
      measuredBeatMinus: null,
      features: {},
      oneBeat: null,
      twoBeatSamePhase: null,
      modes: {},
      branchAmplitude: {},
      branchAmplitudeFraction: {},
      clampCrossing: false,
      nonsmooth: false,
      failureReason: error instanceof Error ? error.message : String(error),
    };
  }
}

function returnMapModeDiagnostic(
  sectionState: SerializedModelState,
  params: CoreRuntimeParams,
  dt: number,
  sampleHz: number,
  mode: ReturnMapModeKey,
): { oneBeat: ReturnMapPhaseDiagnostic; twoBeatSamePhase: ReturnMapPhaseDiagnostic } {
  let plusState = perturbLvAgainstPVein(sectionState, RETURN_MAP_PERTURBATION_ML);
  let minusState = perturbLvAgainstPVein(sectionState, -RETURN_MAP_PERTURBATION_ML);
  if (mode === "volumeLambdaActReset") {
    plusState = resetLvLambdaActToRaw(plusState, params);
    minusState = resetLvLambdaActToRaw(minusState, params);
  }
  const plus = postPerturbationBeats(plusState, params, dt, sampleHz);
  const minus = postPerturbationBeats(minusState, params, dt, sampleHz);
  return {
    oneBeat: phaseDiagnostic(plus.oneBeat, minus.oneBeat, plus.clampHits, minus.clampHits),
    twoBeatSamePhase: phaseDiagnostic(plus.twoBeat, minus.twoBeat, plus.clampHits, minus.clampHits),
  };
}

function findNextLvEdvSection(
  state: SerializedModelState,
  params: CoreRuntimeParams,
  dt: number,
): { state: SerializedModelState; beat: number; vlvMl: number } {
  const core = new ModelCore(params);
  core.unpackState(state);
  const targetBeat = Math.floor(core.sample().phi) + 1;
  const maxSeconds = (60 / Math.max(core.p.HR, 1)) * 3.5;
  const tEnd = core.t + maxSeconds;
  let bestState: SerializedModelState | undefined;
  let bestVlv = -Infinity;
  while (core.t < tEnd - 1e-9) {
    core.step(dt);
    const sample = core.sample();
    const beat = Math.floor(sample.phi);
    if (beat === targetBeat && sample.VLV > bestVlv) {
      bestVlv = sample.VLV;
      bestState = core.packState();
    }
    if (beat > targetBeat && bestState) break;
  }
  if (!bestState || !Number.isFinite(bestVlv)) {
    throw new Error("could not find next LV EDV section for return-map diagnostic");
  }
  return { state: bestState, beat: targetBeat, vlvMl: bestVlv };
}

function perturbLvAgainstPVein(state: SerializedModelState, lvDeltaMl: number): SerializedModelState {
  const idx = makeIndex();
  const x = [...state.x];
  const lvIndex = idx.node.LV;
  const pVeinIndex = idx.node.PVein;
  const nextLv = x[lvIndex] + lvDeltaMl;
  const nextPVein = x[pVeinIndex] - lvDeltaMl;
  if (!Number.isFinite(nextLv) || !Number.isFinite(nextPVein) || nextLv <= 1 || nextPVein <= 1) {
    throw new Error("perturbation would create non-finite or non-positive LV/PVein volume");
  }
  x[lvIndex] = nextLv;
  x[pVeinIndex] = nextPVein;
  return { ...state, x };
}

function resetLvLambdaActToRaw(state: SerializedModelState, params: CoreRuntimeParams): SerializedModelState {
  const core = new ModelCore(params);
  core.unpackState(state);
  const lambdaRaw = core.debugActiveStressDiagnostics().LV?.lambdaRaw;
  if (!Number.isFinite(lambdaRaw)) return state;
  const idx = makeIndex();
  const lambdaActIndex = idx.activeInternal.LV?.lambdaAct;
  if (lambdaActIndex == null) return state;
  const x = [...state.x];
  x[lambdaActIndex] = Number(lambdaRaw);
  return { ...state, x };
}

function newCoreFromState(state: SerializedModelState, params: CoreRuntimeParams): ModelCore {
  const core = new ModelCore(params);
  core.unpackState(state);
  return core;
}

function postPerturbationBeats(
  state: SerializedModelState,
  params: CoreRuntimeParams,
  dt: number,
  sampleHz: number,
): { oneBeat: BeatTraceRow; twoBeat: BeatTraceRow; clampHits: number } {
  const core = newCoreFromState(state, params);
  void sampleHz;
  const firstTargetBeat = Math.floor(core.sample().phi) + 1;
  const secondTargetBeat = firstTargetBeat + 1;
  const beatSeconds = 60 / Math.max(core.p.HR, 1);
  const entries: TraceSample[] = [];
  const tEnd = core.t + beatSeconds * 3.5;
  while (core.t < tEnd - 1e-9) {
    core.step(dt);
    const sample = core.sample();
    const beat = Math.floor(sample.phi);
    if (beat === firstTargetBeat || beat === secondTargetBeat) entries.push({ sample, active: core.debugActiveStressDiagnostics() });
    if (beat > secondTargetBeat && entries.length >= 10) break;
  }
  const groups = groupTraceSamplesByBeat(entries);
  const oneEntries = groups.get(firstTargetBeat) ?? [];
  const twoEntries = groups.get(secondTargetBeat) ?? [];
  if (oneEntries.length < 5 || twoEntries.length < 5) {
    throw new Error("could not collect complete one-beat and two-beat post-perturbation responses");
  }
  return {
    oneBeat: summarizeBeat(firstTargetBeat, oneEntries, params.HR),
    twoBeat: summarizeBeat(secondTargetBeat, twoEntries, params.HR),
    clampHits: core.debugClampDiagnostics().totalClampHits,
  };
}

function phaseDiagnostic(
  plusBeat: BeatTraceRow,
  minusBeat: BeatTraceRow,
  plusClampHits: number,
  minusClampHits: number,
): ReturnMapPhaseDiagnostic {
  const clampCrossing = plusClampHits > 0 || minusClampHits > 0 || plusClampHits !== minusClampHits;
  return {
    measuredBeatPlus: plusBeat.beat,
    measuredBeatMinus: minusBeat.beat,
    features: {
      EDV_L: centralFeature(plusBeat.EDV_L, minusBeat.EDV_L),
      ESV_L: centralFeature(plusBeat.ESV_L, minusBeat.ESV_L),
      CO_L: centralFeature(plusBeat.CO_L, minusBeat.CO_L),
      LAPMean: centralFeature(plusBeat.LAPMean, minusBeat.LAPMean),
    },
    clampCrossing,
    nonsmooth: clampCrossing,
    plusClampHits,
    minusClampHits,
  };
}

function branchAmplitudeFromTrace(traceSamples: TraceSample[], HR: number): Partial<Record<ReturnMapFeatureKey, number>> {
  const trace = summarizeBeatTrace(traceSamples, HR, 4);
  if (trace.length < 2) return {};
  const a = trace[trace.length - 1];
  const b = trace[trace.length - 2];
  return {
    EDV_L: Math.abs(a.EDV_L - b.EDV_L),
    ESV_L: Math.abs(a.ESV_L - b.ESV_L),
    CO_L: Math.abs(a.CO_L - b.CO_L),
    LAPMean: Math.abs(a.LAPMean - b.LAPMean),
  };
}

function branchAmplitudeFractionFromTrace(traceSamples: TraceSample[], HR: number): Partial<Record<ReturnMapFeatureKey, number>> {
  const trace = summarizeBeatTrace(traceSamples, HR, 4);
  if (trace.length < 2) return {};
  const a = trace[trace.length - 1];
  const b = trace[trace.length - 2];
  return {
    EDV_L: fractionalDifference(a.EDV_L, b.EDV_L, 1),
    ESV_L: fractionalDifference(a.ESV_L, b.ESV_L, 1),
    CO_L: fractionalDifference(a.CO_L, b.CO_L, 0.05),
    LAPMean: fractionalDifference(a.LAPMean, b.LAPMean, 0.1),
  };
}

function groupTraceSamplesByBeat(traceSamples: TraceSample[]): Map<number, TraceSample[]> {
  const groups = new Map<number, TraceSample[]>();
  for (const entry of traceSamples) {
    const beat = Math.floor(entry.sample.phi);
    const arr = groups.get(beat) ?? [];
    arr.push(entry);
    groups.set(beat, arr);
  }
  return groups;
}

function centralFeature(plus: number, minus: number): ReturnMapFeature {
  const centralSlope = (plus - minus) / (2 * RETURN_MAP_PERTURBATION_ML);
  return {
    plus,
    minus,
    centralSlope,
    absCentralSlope: Math.abs(centralSlope),
  };
}

function fractionalDifference(a: number, b: number, floor: number): number {
  const denom = Math.max(Math.abs(a), Math.abs(b), floor);
  return Math.abs(a - b) / denom;
}

function summarizeBeatTrace(traceSamples: TraceSample[], HR: number, traceBeats: number): BeatTraceRow[] {
  const groups = groupTraceSamplesByBeat(traceSamples);
  const beatIds = Array.from(groups.keys()).sort((a, b) => a - b);
  const completeIds = beatIds.slice(1, -1).filter((beat) => (groups.get(beat)?.length ?? 0) >= 5);
  return completeIds.slice(-traceBeats).map((beat) => summarizeBeat(beat, groups.get(beat) ?? [], HR));
}

function summarizeBeat(beat: number, entries: TraceSample[], HR: number): BeatTraceRow {
  const samples = entries.map((entry) => entry.sample);
  const mean = (key: keyof SimSample) => meanNumbers(samples.map((sample) => Number(sample[key])));
  const max = (key: keyof SimSample) => Math.max(...samples.map((sample) => Number(sample[key])));
  const min = (key: keyof SimSample) => Math.min(...samples.map((sample) => Number(sample[key])));
  const svL = integratePositive(samples, "QAo");
  const svR = integratePositive(samples, "QPA");
  return {
    beat,
    sampleCount: samples.length,
    LAPMean: mean("LAP"),
    RAPMean: mean("RAP"),
    CO_L: (svL * HR) / 1000,
    CO_R: (svR * HR) / 1000,
    SV_L: svL,
    SV_R: svR,
    EDV_L: max("VLV"),
    ESV_L: min("VLV"),
    EDV_R: max("VRV"),
    ESV_R: min("VRV"),
    LVPMax: max("LVP"),
    QAoMax: max("QAo"),
    active: summarizeActive(entries),
  };
}

function summarizeActive(entries: TraceSample[]): Partial<Record<Chamber, ActiveBeatSummary>> {
  const chambers: Chamber[] = ["LV", "RV", "LA", "RA"];
  const out: Partial<Record<Chamber, ActiveBeatSummary>> = {};
  for (const chamber of chambers) {
    const terms = entries.map((entry) => entry.active[chamber]).filter((term): term is NonNullable<typeof term> => !!term);
    if (terms.length === 0) continue;
    out[chamber] = {
      lambdaMean: meanNumbers(terms.map((term) => term.lambda)),
      lambdaMin: Math.min(...terms.map((term) => term.lambda)),
      lambdaMax: Math.max(...terms.map((term) => term.lambda)),
      lambdaRawMean: meanNumbers(terms.map((term) => term.lambdaRaw)),
      lambdaActMean: meanNumbers(terms.map((term) => term.lambdaAct)),
      tauLambdaActSecMean: meanNumbers(terms.map((term) => term.tauLambdaActSec)),
      KdMean: meanNumbers(terms.map((term) => term.Kd)),
      aInfMean: meanNumbers(terms.map((term) => term.aInf)),
      tauAMean: meanNumbers(terms.map((term) => term.tauA)),
      cMean: meanNumbers(terms.map((term) => term.c)),
      aMean: meanNumbers(terms.map((term) => term.a)),
      sigmaActTargetMean: meanNumbers(terms.map((term) => term.sigmaActTarget)),
      sigmaActMean: meanNumbers(terms.map((term) => term.sigmaAct)),
      sigmaPasMean: meanNumbers(terms.map((term) => term.sigmaPas)),
      fIsoMean: meanNumbers(terms.map((term) => term.fIso)),
      gOverMean: meanNumbers(terms.map((term) => term.gOver)),
      forceVelocityScaleMean: meanNumbers(terms.map((term) => term.forceVelocityScale)),
      dLogAInf_dLambdaActMean: meanNumbers(terms.map((term) => term.dLogAInf_dLambdaAct)),
      dLogFIso_dLambdaActMean: meanNumbers(terms.map((term) => term.dLogFIso_dLambdaAct)),
      dLogGOver_dLambdaRawMean: meanNumbers(terms.map((term) => term.dLogGOver_dLambdaRaw)),
      dLogCompositeActive_dLambdaActMean: meanNumbers(terms.map((term) => term.dLogCompositeActive_dLambdaAct)),
      lambdaActMinusRawMean: meanNumbers(terms.map((term) => term.lambdaActMinusRaw)),
      dLogAInf_dLambdaMean: meanNumbers(terms.map((term) => term.dLogAInf_dLambda)),
      dLogFIso_dLambdaMean: meanNumbers(terms.map((term) => term.dLogFIso_dLambda)),
      dLogGOver_dLambdaMean: meanNumbers(terms.map((term) => term.dLogGOver_dLambda)),
      dLogCompositeActive_dLambdaMean: meanNumbers(terms.map((term) => term.dLogCompositeActive_dLambda)),
      pressureFloorHitFraction: meanNumbers(terms.map((term) => term.pressureFloorHit01)),
    };
  }
  return out;
}

function summarizeValves(samples: SimSample[]): Record<"MV" | "AoV" | "TV" | "PV", ValveTraceSummary> {
  return {
    MV: valveSummary(samples, "QMV"),
    AoV: valveSummary(samples, "QAo"),
    TV: valveSummary(samples, "QTV"),
    PV: valveSummary(samples, "QPV"),
  };
}

function valveSummary(samples: SimSample[], key: keyof SimSample): ValveTraceSummary {
  const values = samples.map((sample) => Number(sample[key]));
  return {
    minQ: Math.min(...values),
    maxQ: Math.max(...values),
    forwardVolumeMl: integratePositive(samples, key),
    reverseVolumeMl: integrateNegativeMagnitude(samples, key),
    negativeSampleCount: values.filter((value) => value < -1e-9).length,
  };
}

function summarizePoints(points: DebugPoint[]): DebugSummary {
  const maxValveReverseMl = Math.max(0, ...points.flatMap((p) => [
    p.valveVolumesMl.MVReverse,
    p.valveVolumesMl.AoVReverse,
    p.valveVolumesMl.TVReverse,
    p.valveVolumesMl.PVReverse,
    p.valveTrace.MV.reverseVolumeMl,
    p.valveTrace.AoV.reverseVolumeMl,
    p.valveTrace.TV.reverseVolumeMl,
    p.valveTrace.PV.reverseVolumeMl,
  ]));
  return {
    pointCount: points.length,
    period2Count: points.filter((p) => p.settle.periodBeats === 2).length,
    maxAdjacentDelta: Math.max(0, ...points.map((p) => p.settle.adjacentDelta)),
    maxPeriodDelta: Math.max(0, ...points.map((p) => p.settle.periodDelta)),
    maxValveReverseMl,
    maxClampHitCount: Math.max(0, ...points.map((p) => p.health.clampHitCount)),
    maxAbsReturnMapSlopeEDVL: Math.max(0, ...points.map((p) => p.returnMap.features.EDV_L?.absCentralSlope ?? 0)),
    maxAbsTwoBeatReturnMapSlopeEDVL: Math.max(0, ...points.map((p) => p.returnMap.twoBeatSamePhase?.features.EDV_L?.absCentralSlope ?? 0)),
    maxAbsReturnMapSlopeCOL: Math.max(0, ...points.map((p) => p.returnMap.features.CO_L?.absCentralSlope ?? 0)),
    maxAbsTwoBeatReturnMapSlopeCOL: Math.max(0, ...points.map((p) => p.returnMap.twoBeatSamePhase?.features.CO_L?.absCentralSlope ?? 0)),
    maxBranchAmplitudeCOL: Math.max(0, ...points.map((p) => p.returnMap.branchAmplitude.CO_L ?? 0)),
    maxBranchAmplitudeFractionCOL: Math.max(0, ...points.map((p) => p.returnMap.branchAmplitudeFraction.CO_L ?? 0)),
    maxBranchAmplitudeEDVL: Math.max(0, ...points.map((p) => p.returnMap.branchAmplitude.EDV_L ?? 0)),
    maxBranchAmplitudeFractionEDVL: Math.max(0, ...points.map((p) => p.returnMap.branchAmplitudeFraction.EDV_L ?? 0)),
    maxBranchAmplitudeESVL: Math.max(0, ...points.map((p) => p.returnMap.branchAmplitude.ESV_L ?? 0)),
    maxBranchAmplitudeFractionESVL: Math.max(0, ...points.map((p) => p.returnMap.branchAmplitudeFraction.ESV_L ?? 0)),
    nodeClampHits: mergeCountRecords(points.map((p) => p.clampDiagnostics.nodeClampHits)),
    dynamicFlowClampHits: mergeCountRecords(points.map((p) => p.clampDiagnostics.dynamicFlowClampHits)),
    valveDiodeClampHits: mergeCountRecords(points.map((p) => p.clampDiagnostics.valveDiodeClampHits)),
  };
}

function metricSummary(m: SimMetrics): MetricSummary {
  return {
    LAPMean: m.LAPMean,
    RAPMean: m.RAPMean,
    CO_L: m.CO_L,
    CO_R: m.CO_R,
    pulmonaryVenousReturnLMin: m.pulmonaryVenousReturnLMin,
    systemicVenousReturnLMin: m.systemicVenousReturnLMin,
    SV_L: m.SV_L,
    SV_R: m.SV_R,
    LVEDPApprox: m.LVEDPApprox,
    RVEDPApprox: m.RVEDPApprox,
  };
}

function integratePositive(samples: SimSample[], key: keyof SimSample): number {
  return integrateFlow(samples, key, (value) => Math.max(0, value));
}

function integrateNegativeMagnitude(samples: SimSample[], key: keyof SimSample): number {
  return integrateFlow(samples, key, (value) => Math.max(0, -value));
}

function integrateFlow(samples: SimSample[], key: keyof SimSample, project: (value: number) => number): number {
  if (samples.length < 2) return 0;
  let area = 0;
  for (let i = 1; i < samples.length; i++) {
    const dt = samples[i].t - samples[i - 1].t;
    area += 0.5 * dt * (project(Number(samples[i][key])) + project(Number(samples[i - 1][key])));
  }
  return area;
}

function mergeCountRecords(records: Partial<Record<string, number>>[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const record of records) {
    for (const [key, value] of Object.entries(record)) out[key] = (out[key] ?? 0) + (value ?? 0);
  }
  return out;
}

function appendRecordTable(lines: string[], record: Record<string, number>): void {
  const entries = Object.entries(record).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) {
    lines.push("");
    lines.push("_none_");
    lines.push("");
    return;
  }
  lines.push("");
  lines.push("| name | count |");
  lines.push("| --- | ---: |");
  for (const [key, value] of entries) lines.push(`| ${key} | ${value} |`);
  lines.push("");
}

function maxValveReverse(p: DebugPoint): number {
  return Math.max(
    p.valveVolumesMl.MVReverse,
    p.valveVolumesMl.AoVReverse,
    p.valveVolumesMl.TVReverse,
    p.valveVolumesMl.PVReverse,
    p.valveTrace.MV.reverseVolumeMl,
    p.valveTrace.AoV.reverseVolumeMl,
    p.valveTrace.TV.reverseVolumeMl,
    p.valveTrace.PV.reverseVolumeMl,
  );
}

function returnMapSlope(p: DebugPoint, key: keyof ReturnMapDiagnostic["features"]): number {
  return p.returnMap.features[key]?.centralSlope ?? Number.NaN;
}

function twoBeatReturnMapSlope(p: DebugPoint, key: keyof ReturnMapDiagnostic["features"]): number {
  return p.returnMap.twoBeatSamePhase?.features[key]?.centralSlope ?? Number.NaN;
}

function modeTwoBeatSlope(p: DebugPoint, mode: ReturnMapModeKey, key: ReturnMapFeatureKey): number {
  return p.returnMap.modes[mode]?.twoBeatSamePhase?.features[key]?.centralSlope ?? Number.NaN;
}

function meanNumbers(values: number[]): number {
  const finite = values.filter(Number.isFinite);
  if (finite.length === 0) return Number.NaN;
  return finite.reduce((acc, value) => acc + value, 0) / finite.length;
}

function parseArgs(args: string[]): DebugOptions {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const opts: DebugOptions = {
    outDir: path.join("artifacts", "starling-low-preload-debug", timestamp),
    targetVolumeMl: 5600,
    deltasMl: DEFAULT_DELTAS,
    dtValues: DEFAULT_DT_VALUES,
    lambdaActTauSecValues: DEFAULT_LAMBDA_ACT_TAU_SEC_VALUES,
    traceBeats: 10,
    sampleHz: DEFAULT_SAMPLE_HZ,
  };
  for (const arg of args) {
    const [key, value] = arg.split("=", 2);
    if (key === "--out" && value) opts.outDir = value;
    else if (key === "--target-volume" && value) opts.targetVolumeMl = Number(value);
    else if (key === "--deltas" && value) opts.deltasMl = parseNumberList(value);
    else if (key === "--dt" && value) opts.dtValues = parseNumberList(value);
    else if (key === "--lambda-act-tau" && value) opts.lambdaActTauSecValues = parseNumberList(value);
    else if (key === "--trace-beats" && value) opts.traceBeats = Math.max(2, Math.floor(Number(value)));
    else if (key === "--sample-hz" && value) opts.sampleHz = Math.max(20, Math.floor(Number(value)));
    else if (key === "--help") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return opts;
}

function parseNumberList(value: string): number[] {
  return value.split(",").map((v) => Number(v.trim())).filter(Number.isFinite);
}

function printHelp(): void {
  // eslint-disable-next-line no-console
  console.log([
    "Usage: npm run debug:starling-low-preload -- [--out=DIR] [--target-volume=5600]",
    "       [--deltas=0,-900,-1000,-1100] [--dt=0.001,0.0005,0.002] [--lambda-act-tau=0,0.15,0.25,0.4] [--trace-beats=10] [--sample-hz=120]",
    "",
    "Examples:",
    "  npm run debug:starling-low-preload",
    "  npm run debug:starling-low-preload -- --out=artifacts/starling-low-preload-debug/manual",
    "  npm run debug:starling-low-preload -- --dt=0.001 --deltas=0,-1250 --trace-beats=4",
    "  npm run debug:starling-low-preload -- --deltas=0,-1200,-1250 --dt=0.001,0.0005 --lambda-act-tau=0,0.15,0.25,0.4",
  ].join("\n"));
}

function round(value: number, digits: number): number {
  if (!Number.isFinite(value)) return value;
  const scale = 10 ** digits;
  return Math.round(value * scale) / scale;
}

function csvCell(value: unknown): string {
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "";
  const s = String(value ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function main(): void {
  const options = parseArgs(process.argv.slice(2));
  mkdirSync(options.outDir, { recursive: true });
  const report = runLowPreloadDebug(options);
  writeFileSync(path.join(options.outDir, "report.json"), `${JSON.stringify(report, null, 2)}\n`);
  writeFileSync(path.join(options.outDir, "report.md"), reportToMarkdown(report));
  writeFileSync(path.join(options.outDir, "beat-trace.csv"), reportToCsv(report));

  // eslint-disable-next-line no-console
  console.log(`Wrote Starling low-preload debug report to ${options.outDir}`);
  // eslint-disable-next-line no-console
  console.log(
    `points=${report.summary.pointCount} period2=${report.summary.period2Count} ` +
    `maxAdjacentDelta=${round(report.summary.maxAdjacentDelta, 4)} maxReverseMl=${round(report.summary.maxValveReverseMl, 6)}`,
  );
}

if (!process.env.VITEST) main();
