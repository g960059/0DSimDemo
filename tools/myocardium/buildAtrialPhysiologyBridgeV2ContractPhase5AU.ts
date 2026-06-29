import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { ModelCore, defaultParams } from "@/engine/ModelCore";
import {
  MODELCORE_RUNTIME_LV_RV_LAND_DEFAULT_MODE,
  resolveModelCoreRuntimeActiveSource,
} from "@/engine/myocardium/runtimeActiveSource";
import { measureSteady } from "@/engine/measure";
import type { CoreRuntimeParams, SimMetrics, SimSample } from "@/engine/protocol";
import { DEFAULT_SETTLE_POLICY, type SettlePolicy } from "@/engine/settling";

export const ATRIAL_PHYSIOLOGY_BRIDGE_V2_CONTRACT_PHASE5AU_ID =
  "atrial-physiology-bridge-v2-contract-phase5au-result-v1";

export const ATRIAL_PHYSIOLOGY_BRIDGE_V2_CONTRACT_PHASE5AU_RESULT_PATH =
  "data/myocardium/protocols/atrial-physiology-bridge-v2-contract-phase5au-result-v1.json";

type AtrialChamber = "LA" | "RA";
type Valve = "MV" | "TV";
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

type VolumeRateReadout = {
  readonly finiteDifferenceMaxAbsMlPerSec: number | null;
  readonly flowBalanceMaxAbsMlPerSec: number | null;
  readonly finiteVsFlowMaxAbsErrorMlPerSec: number | null;
  readonly finiteVsFlowMedianAbsErrorMlPerSec: number | null;
};

type WaveformReadout = {
  readonly pressureMeanMmHg: number | null;
  readonly pressureMinMmHg: number | null;
  readonly pressureMaxMmHg: number | null;
  readonly volumeMinMl: number | null;
  readonly volumeMaxMl: number | null;
  readonly aWavePeakMmHg: number | null;
  readonly vWavePeakMmHg: number | null;
  readonly reservoirPressureSwingMmHg: number | null;
  readonly conduitPressureSwingMmHg: number | null;
  readonly boosterPressureSwingMmHg: number | null;
  readonly inflowEarlyPeakMlPerSec: number | null;
  readonly inflowAtrialPeakMlPerSec: number | null;
  readonly inflowEarlyToAtrialRatio: number | null;
};

type ValveReadout = {
  readonly hitsPerBeat: number;
  readonly diodeImpulsePerBeat: number;
  readonly qDotClampHitFraction: number;
};

type AtrialReadout = {
  readonly volumeRate: VolumeRateReadout;
  readonly waveform: WaveformReadout;
  readonly valve: ValveReadout;
};

type Run = {
  readonly pointId: PointId;
  readonly HR: 75 | 90;
  readonly targetTBVMl: number;
  readonly settled: boolean;
  readonly settleReason: string;
  readonly settleBeats: number;
  readonly healthStatus: string;
  readonly forwardCO_L: number | null;
  readonly forwardCO_R: number | null;
  readonly LVEDPApprox: number | null;
  readonly RVEDPApprox: number | null;
  readonly LA: AtrialReadout | null;
  readonly RA: AtrialReadout | null;
  readonly settledLvRvHealthInterpretable: boolean;
};

type Evidence = {
  readonly schemaVersion: 1;
  readonly id: typeof ATRIAL_PHYSIOLOGY_BRIDGE_V2_CONTRACT_PHASE5AU_ID;
  readonly phase: "Phase 5AU";
  readonly claimBoundary: "atrial-physiology-bridge-v2-contract-readout-no-model-change";
  readonly sourceEvidence: readonly [
    "data/myocardium/protocols/atrial-figure-eight-av-plane-candidate-phase5at-result-v1.json",
  ];
  readonly protocol: {
    readonly runtimeActiveSourceMode: typeof MODELCORE_RUNTIME_LV_RV_LAND_DEFAULT_MODE;
    readonly pointSource: "hr75-hr90-normal-low-high-preload";
    readonly points: readonly PointSpec[];
    readonly dtSec: typeof DT_SEC;
    readonly sampleHz: typeof SAMPLE_HZ;
    readonly measureBeats: typeof MEASURE_BEATS;
    readonly noA2Implementation: true;
    readonly noProductionBridgeSelection: true;
    readonly noPermanentVerifierOrNpmScriptAdded: true;
  };
  readonly a2Contract: {
    readonly requiredInputs: readonly string[];
    readonly requiredDebugOutputs: readonly string[];
    readonly requiredTargetFamilies: readonly string[];
    readonly currentApiGaps: readonly string[];
  };
  readonly runs: readonly Run[];
  readonly summary: {
    readonly measuredPointCount: number;
    readonly healthOkPointCount: number;
    readonly volumeRateReadoutAvailablePoints: readonly PointId[];
    readonly waveformReadoutAvailablePoints: readonly PointId[];
    readonly currentInterpretation: string;
    readonly recommendedNext: readonly string[];
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
  readonly normalizedSha256: string;
};

const DT_SEC = 0.001;
const SAMPLE_HZ = 1000;
const MEASURE_BEATS = 3;
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

export function buildAtrialPhysiologyBridgeV2ContractPhase5AUEvidence(): Evidence {
  const runs = POINTS.map(runPoint);
  const volumeRateReadoutAvailablePoints = runs
    .filter((run) => run.LA?.volumeRate.flowBalanceMaxAbsMlPerSec != null && run.RA?.volumeRate.flowBalanceMaxAbsMlPerSec != null)
    .map((run) => run.pointId);
  const waveformReadoutAvailablePoints = runs
    .filter((run) => run.LA?.waveform.aWavePeakMmHg != null && run.RA?.waveform.aWavePeakMmHg != null)
    .map((run) => run.pointId);
  const evidenceWithoutHash: Omit<Evidence, "normalizedSha256"> = {
    schemaVersion: 1,
    id: ATRIAL_PHYSIOLOGY_BRIDGE_V2_CONTRACT_PHASE5AU_ID,
    phase: "Phase 5AU",
    claimBoundary: "atrial-physiology-bridge-v2-contract-readout-no-model-change",
    sourceEvidence: [
      "data/myocardium/protocols/atrial-figure-eight-av-plane-candidate-phase5at-result-v1.json",
    ],
    protocol: {
      runtimeActiveSourceMode: MODELCORE_RUNTIME_LV_RV_LAND_DEFAULT_MODE,
      pointSource: "hr75-hr90-normal-low-high-preload",
      points: POINTS,
      dtSec: DT_SEC,
      sampleHz: SAMPLE_HZ,
      measureBeats: MEASURE_BEATS,
      noA2Implementation: true,
      noProductionBridgeSelection: true,
      noPermanentVerifierOrNpmScriptAdded: true,
    },
    a2Contract: {
      requiredInputs: [
        "chamber volume",
        "self chamber volumeRateMlPerSec",
        "HR and beat phase",
        "inlet/outlet valve opening signals",
        "paired ventricular shortening and shortening velocity",
        "pericardial/external coupling pressure or debug contribution",
      ],
      requiredDebugOutputs: [
        "passive pressure contribution",
        "viscous/conduit pressure contribution",
        "active booster tension and pressure contribution",
        "external AV-plane/pericardial pressure contribution",
        "reservoir/conduit/booster phase indices",
        "a/v wave, x/y descent, and E/A-like inflow readouts",
      ],
      requiredTargetFamilies: [
        "absolute LAP/RAP mean and a/v wave ranges",
        "absolute LA/RA volume range and emptying fractions",
        "reservoir/conduit/booster or A/V loop balance",
        "E/A-like AV-valve inflow ratio and atrial reversal bounds",
        "sampling-invariant roughness and valve/qDot contamination",
        "LV/RV preload and output preservation",
      ],
      currentApiGaps: [
        "ChamberCtx does not expose self chamber volumeRateMlPerSec to chamber/provider pressure calls",
        "Atrial bridge debug output is not decomposed into passive, viscous, active, and external pressure contributions",
        "absolute atrial waveform targets are not yet sourced or accepted",
      ],
    },
    runs,
    summary: {
      measuredPointCount: runs.length,
      healthOkPointCount: runs.filter((run) => run.healthStatus === "ok").length,
      volumeRateReadoutAvailablePoints,
      waveformReadoutAvailablePoints,
      currentInterpretation:
        "Phase 5AU defines and measures the readout contract needed before an AtrialPhysiologyBridgeV2/A2 implementation. It does not implement A2. The current runtime can derive self atrial dV/dt from closed-loop samples, but the chamber/provider pressure API does not yet expose that value as an input.",
      recommendedNext: [
        "add a narrow provider/chamber input for self chamber volumeRateMlPerSec before implementing viscous/conduit A2 pressure",
        "source and accept absolute atrial waveform targets before tuning A2 parameters",
        "prototype A2 with pressure-decomposition debug output before any production bridge selection",
      ],
      blockers: [
        "production atrial bridge selection remains blocked",
        "A2 implementation remains absent",
        "absolute atrial waveform target source audit remains absent",
      ],
    },
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
  };
  return {
    ...evidenceWithoutHash,
    normalizedSha256: hashStable(evidenceWithoutHash),
  };
}

function runPoint(point: PointSpec): Run {
  const params: Partial<CoreRuntimeParams> = { ...defaultParams(), HR: point.HR };
  const resolution = resolveModelCoreRuntimeActiveSource({
    mode: MODELCORE_RUNTIME_LV_RV_LAND_DEFAULT_MODE,
    runtimeParams: params,
  });
  const core = new ModelCore(params, resolution.experimentalOptions);
  core.initializeVenousPressuresForTargetTBV(point.targetTBVMl);
  const settleStatus = core.settleToSteady(SETTLE_POLICY, DT_SEC, 480);
  const settled = settleStatus.settled && settleStatus.actualSeconds != null;
  const samples = settled
    ? measureSteady(core, settleStatus as typeof settleStatus & { actualSeconds: number }, {
      dt: DT_SEC,
      sampleHz: SAMPLE_HZ,
      measureBeats: MEASURE_BEATS,
      requireProjectorQuiet: false,
    })
    : null;
  const tailSamples = samples == null
    ? core.runFor(MEASURE_BEATS * 60 / point.HR, DT_SEC, SAMPLE_HZ, { recordHistory: false })
    : null;
  const health = samples?.health ?? core.health();
  const metrics = samples?.metrics ?? null;
  const runSamples = samples?.samples ?? tailSamples ?? [];
  return {
    pointId: point.id,
    HR: point.HR,
    targetTBVMl: point.targetTBVMl,
    settled,
    settleReason: settleStatus.reason,
    settleBeats: settleStatus.beats,
    healthStatus: health.status,
    forwardCO_L: finiteOrNull(samples?.forwardCO_L),
    forwardCO_R: finiteOrNull(samples?.forwardCO_R),
    LVEDPApprox: finiteOrNull(metrics?.LVEDPApprox),
    RVEDPApprox: finiteOrNull(metrics?.RVEDPApprox),
    LA: atrialReadout(runSamples, "LA", metrics),
    RA: atrialReadout(runSamples, "RA", metrics),
    settledLvRvHealthInterpretable:
      settled
      && health.status === "ok"
      && metrics != null
      && isPositiveFinite(samples?.forwardCO_L)
      && isPositiveFinite(samples?.forwardCO_R)
      && Number.isFinite(metrics.LVEDPApprox)
      && Number.isFinite(metrics.RVEDPApprox),
  };
}

function atrialReadout(samples: readonly SimSample[], chamber: AtrialChamber, metrics: SimMetrics | null): AtrialReadout | null {
  if (samples.length < 16) return null;
  const valve: Valve = chamber === "LA" ? "MV" : "TV";
  return {
    volumeRate: volumeRateReadout(samples, chamber),
    waveform: waveformReadout(samples, chamber, valve, metrics),
    valve: valveReadout(samples, valve),
  };
}

function volumeRateReadout(samples: readonly SimSample[], chamber: AtrialChamber): VolumeRateReadout {
  const finiteRates: number[] = [];
  const flowRates: number[] = [];
  const errors: number[] = [];
  for (let i = 1; i < samples.length; i++) {
    const dt = Math.max(samples[i].t - samples[i - 1].t, 1e-9);
    const prevVolume = chamber === "LA" ? samples[i - 1].VLA : samples[i - 1].VRA;
    const volume = chamber === "LA" ? samples[i].VLA : samples[i].VRA;
    const finite = (volume - prevVolume) / dt;
    const flow = chamber === "LA"
      ? samples[i].PVF - samples[i].QMV
      : samples[i].SVF + samples[i].QCS - samples[i].QTV;
    finiteRates.push(finite);
    flowRates.push(flow);
    errors.push(Math.abs(finite - flow));
  }
  return {
    finiteDifferenceMaxAbsMlPerSec: finiteOrNull(maxAbs(finiteRates)),
    flowBalanceMaxAbsMlPerSec: finiteOrNull(maxAbs(flowRates)),
    finiteVsFlowMaxAbsErrorMlPerSec: finiteOrNull(Math.max(...errors)),
    finiteVsFlowMedianAbsErrorMlPerSec: finiteOrNull(median(errors)),
  };
}

function waveformReadout(
  samples: readonly SimSample[],
  chamber: AtrialChamber,
  valve: Valve,
  metrics: SimMetrics | null,
): WaveformReadout {
  const pressure = (sample: SimSample) => chamber === "LA" ? sample.LAP : sample.RAP;
  const volume = (sample: SimSample) => chamber === "LA" ? sample.VLA : sample.VRA;
  const inflow = (sample: SimSample) => valve === "MV" ? sample.QMV : sample.QTV;
  const pressures = samples.map(pressure);
  const volumes = samples.map(volume);
  const reservoirPressures = phaseValues(samples, [[0.18, 0.72]], pressure);
  const conduitPressures = phaseValues(samples, [[0.45, 0.76]], pressure);
  const boosterPressures = phaseValues(samples, [[0.76, 1.0], [0.0, 0.14]], pressure);
  const earlyInflow = phaseValues(samples, [[0.45, 0.76]], inflow);
  const atrialInflow = phaseValues(samples, [[0.76, 1.0], [0.0, 0.14]], inflow);
  const earlyPeak = maxPositive(earlyInflow);
  const atrialPeak = maxPositive(atrialInflow);
  return {
    pressureMeanMmHg: finiteOrNull(chamber === "LA" ? metrics?.LAPMean : metrics?.RAPMean),
    pressureMinMmHg: finiteOrNull(Math.min(...pressures)),
    pressureMaxMmHg: finiteOrNull(Math.max(...pressures)),
    volumeMinMl: finiteOrNull(Math.min(...volumes)),
    volumeMaxMl: finiteOrNull(Math.max(...volumes)),
    aWavePeakMmHg: finiteOrNull(Math.max(...boosterPressures)),
    vWavePeakMmHg: finiteOrNull(Math.max(...reservoirPressures)),
    reservoirPressureSwingMmHg: finiteOrNull(range(reservoirPressures)),
    conduitPressureSwingMmHg: finiteOrNull(range(conduitPressures)),
    boosterPressureSwingMmHg: finiteOrNull(range(boosterPressures)),
    inflowEarlyPeakMlPerSec: finiteOrNull(earlyPeak),
    inflowAtrialPeakMlPerSec: finiteOrNull(atrialPeak),
    inflowEarlyToAtrialRatio: finiteOrNull(earlyPeak / Math.max(atrialPeak, 1e-9)),
  };
}

function valveReadout(samples: readonly SimSample[], valve: Valve): ValveReadout {
  const hitValues = samples.map((sample) => valueAt(sample, `${valve}_diodeImpulse`) > 0 ? 1 : 0);
  const impulses = samples.map((sample) => Math.max(0, valueAt(sample, `${valve}_diodeImpulse`)));
  const qDotHitValues = samples.map((sample) => valueAt(sample, `${valve}_qDotClampHit01`) > 0 ? 1 : 0);
  return {
    hitsPerBeat: round(hitValues.reduce((sum, value) => sum + value, 0) / MEASURE_BEATS),
    diodeImpulsePerBeat: round(impulses.reduce((sum, value) => sum + value, 0) / MEASURE_BEATS),
    qDotClampHitFraction: round(qDotHitValues.reduce((sum, value) => sum + value, 0) / Math.max(samples.length, 1)),
  };
}

function phaseValues<T>(
  samples: readonly SimSample[],
  windows: readonly (readonly [number, number])[],
  read: (sample: SimSample) => T,
): T[] {
  return samples
    .filter((sample) => windows.some(([lo, hi]) => frac(sample.phi) >= lo && frac(sample.phi) < hi))
    .map(read);
}

function valueAt(sample: SimSample, key: string): number {
  const value = (sample as unknown as Record<string, number | undefined>)[key];
  return Number.isFinite(value) ? value! : 0;
}

function maxPositive(values: readonly number[]): number {
  return Math.max(0, ...values.filter(Number.isFinite));
}

function range(values: readonly number[]): number {
  const finite = values.filter(Number.isFinite);
  if (finite.length === 0) return Number.NaN;
  return Math.max(...finite) - Math.min(...finite);
}

function maxAbs(values: readonly number[]): number {
  const finite = values.filter(Number.isFinite);
  if (finite.length === 0) return Number.NaN;
  return Math.max(...finite.map((value) => Math.abs(value)));
}

function median(values: readonly number[]): number {
  const finite = values.filter(Number.isFinite).slice().sort((a, b) => a - b);
  if (finite.length === 0) return Number.NaN;
  const mid = Math.floor(finite.length / 2);
  return finite.length % 2 === 1 ? finite[mid] : 0.5 * (finite[mid - 1] + finite[mid]);
}

function finiteOrNull(value: number | null | undefined): number | null {
  return value != null && Number.isFinite(value) ? round(value) : null;
}

function isPositiveFinite(value: number | null | undefined): boolean {
  return value != null && Number.isFinite(value) && value > 0;
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
  const evidence = buildAtrialPhysiologyBridgeV2ContractPhase5AUEvidence();
  const outPath = path.resolve(process.cwd(), ATRIAL_PHYSIOLOGY_BRIDGE_V2_CONTRACT_PHASE5AU_RESULT_PATH);
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
    measuredPointCount: evidence.summary.measuredPointCount,
    healthOkPointCount: evidence.summary.healthOkPointCount,
    volumeRateReadoutAvailablePoints: evidence.summary.volumeRateReadoutAvailablePoints,
    waveformReadoutAvailablePoints: evidence.summary.waveformReadoutAvailablePoints,
  }, null, 2));
}
