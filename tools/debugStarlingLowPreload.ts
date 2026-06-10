import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { DEFAULT_PARAMS } from "@/constants";
import { ModelCore, type ModelCoreActiveStressDiagnostics, type ModelCoreClampDiagnostics } from "@/engine/ModelCore";
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
  traceBeats: number;
  sampleHz: number;
};

type ActiveBeatSummary = {
  lambdaMean: number;
  lambdaMin: number;
  lambdaMax: number;
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
  nodeClampHits: Record<string, number>;
  dynamicFlowClampHits: Record<string, number>;
  valveDiodeClampHits: Record<string, number>;
};

type DebugReport = {
  schemaVersion: 2;
  generatedAt: string;
  measurementMode: string;
  targetVolumeMl: number;
  deltasMl: number[];
  dtValues: number[];
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
const DEFAULT_SAMPLE_HZ = 120;
const SETTLE_POLICY = { ...PREVIEW_SETTLE_POLICY, capSeconds: 45 };
const RUN_OPTIONS = {
  collectSamples: false,
  recordHistory: true,
  historyLimit: 720,
};
const CSV_COLUMNS = [
  "dt",
  "deltaVolumeMl",
  "targetVolumeMl",
  "beat",
  "LAPMean",
  "CO_L",
  "CO_R",
  "EDV_L",
  "ESV_L",
  "LV_lambdaMean",
  "LV_KdMean",
  "LV_aInfMean",
  "LV_sigmaActMean",
  "LV_fIsoMean",
  "LV_forceVelocityScaleMean",
];

export function runLowPreloadDebug(opts: DebugOptions): DebugReport {
  const dtValues = opts.dtValues.length > 0 ? opts.dtValues : DEFAULT_DT_VALUES;
  const dtScenarios = dtValues.map((dt) => runDtScenario(opts, dt));
  const primary = dtScenarios[0] ?? runDtScenario(opts, 0.001);
  return {
    schemaVersion: 2,
    generatedAt: new Date().toISOString(),
    measurementMode: "continuous low-preload march; period-aware metrics; active-stress/clamp/valve diagnostics; dt sensitivity",
    targetVolumeMl: opts.targetVolumeMl,
    deltasMl: opts.deltasMl,
    dtValues,
    traceBeats: opts.traceBeats,
    sampleHz: opts.sampleHz,
    points: primary.points,
    summary: primary.summary,
    dtScenarios,
    interpretation: {
      dtSensitivity: "If period-2 disappears or strongly changes at smaller dt, numerical coupling is implicated; if it persists, active-stress model dynamics are implicated.",
      activeStressFields: ["lambda", "Kd", "aInf", "tauA", "c", "a", "sigmaActTarget", "sigmaAct", "sigmaPas", "fIso", "gOver", "forceVelocityScale"],
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
  lines.push("| dt | points | period-2 | max adjacent delta | max period delta | max valve reverse mL | max clamp hits |");
  lines.push("| ---: | ---: | ---: | ---: | ---: | ---: | ---: |");
  for (const scenario of report.dtScenarios) {
    lines.push([
      round(scenario.dt, 5),
      scenario.summary.pointCount,
      scenario.summary.period2Count,
      round(scenario.summary.maxAdjacentDelta, 4),
      round(scenario.summary.maxPeriodDelta, 4),
      round(scenario.summary.maxValveReverseMl, 6),
      scenario.summary.maxClampHitCount,
    ].join(" | ").replace(/^/, "| ").replace(/$/, " |"));
  }
  lines.push("");
  lines.push("## Primary dt points");
  lines.push("");
  lines.push("| delta | target TBV | seed | period | reason | actual s | worst signal | worst delta | adj delta | period delta | LAP | CO_L period | CO_L last beat | CO_R period | PV return | clamp hits | valve reverse max | LV lambda mean | LV Kd mean | LV fIso mean |");
  lines.push("| ---: | ---: | ---: | --- | --- | ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |");
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
      round(lv?.lambdaMean ?? NaN, 4),
      round(lv?.KdMean ?? NaN, 4),
      round(lv?.fIsoMean ?? NaN, 4),
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
          point.deltaVolumeMl,
          point.targetVolumeMl,
          beat.beat,
          beat.LAPMean,
          beat.CO_L,
          beat.CO_R,
          beat.EDV_L,
          beat.ESV_L,
          lv?.lambdaMean ?? "",
          lv?.KdMean ?? "",
          lv?.aInfMean ?? "",
          lv?.sigmaActMean ?? "",
          lv?.fIsoMean ?? "",
          lv?.forceVelocityScaleMean ?? "",
        ].map(csvCell).join(","));
      }
    }
  }
  return `${rows.join("\n")}\n`;
}

function runDtScenario(opts: DebugOptions, dt: number): DtScenarioReport {
  const req: StarlingSweepRequest = {
    requestId: "debug-starling-low-preload",
    signature: "debug-starling-low-preload",
    instanceId: "debug",
    params: DEFAULT_PARAMS,
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
  return { dt, points, summary: summarizePoints(points) };
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

function summarizeBeatTrace(traceSamples: TraceSample[], HR: number, traceBeats: number): BeatTraceRow[] {
  const groups = new Map<number, TraceSample[]>();
  for (const entry of traceSamples) {
    const beat = Math.floor(entry.sample.phi);
    const arr = groups.get(beat) ?? [];
    arr.push(entry);
    groups.set(beat, arr);
  }
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
    traceBeats: 10,
    sampleHz: DEFAULT_SAMPLE_HZ,
  };
  for (const arg of args) {
    const [key, value] = arg.split("=", 2);
    if (key === "--out" && value) opts.outDir = value;
    else if (key === "--target-volume" && value) opts.targetVolumeMl = Number(value);
    else if (key === "--deltas" && value) opts.deltasMl = parseNumberList(value);
    else if (key === "--dt" && value) opts.dtValues = parseNumberList(value);
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
    "       [--deltas=0,-900,-1000,-1100] [--dt=0.001,0.0005,0.002] [--trace-beats=10] [--sample-hz=120]",
    "",
    "Examples:",
    "  npm run debug:starling-low-preload",
    "  npm run debug:starling-low-preload -- --out=artifacts/starling-low-preload-debug/manual",
    "  npm run debug:starling-low-preload -- --dt=0.001 --deltas=0,-1250 --trace-beats=4",
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
