import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  ModelCore,
  defaultParams,
  type ModelCoreExperimentalActiveSourceProvider,
  type ModelCoreExperimentalOptions,
} from "@/engine/ModelCore";
import { measureSteady } from "@/engine/measure";
import {
  MODELCORE_RUNTIME_LV_RV_LAND_DEFAULT_MODE,
  resolveModelCoreRuntimeActiveSource,
} from "@/engine/myocardium/runtimeActiveSource";
import type { Chamber } from "@/engine/chambers";
import type { CoreRuntimeParams, SimSample, SimulationHealth } from "@/engine/protocol";
import { DEFAULT_SETTLE_POLICY, type SettlePolicy } from "@/engine/settling";

export const ATRIAL_A2_INPUTS_PHASE5AW_ID =
  "atrial-a2-inputs-phase5aw-result-v1";

export const ATRIAL_A2_INPUTS_PHASE5AW_RESULT_PATH =
  "data/myocardium/protocols/atrial-a2-inputs-phase5aw-result-v1.json";

type AtrialChamber = "LA" | "RA";
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

type AtrialInputReadout = {
  readonly providerCtxCallCount: number;
  readonly providerCtxFiniteCallCount: number;
  readonly providerCtxSelfVolumeRateMlPerSec: RangeCompact;
  readonly sampleSelfVolumeRateMlPerSec: RangeCompact;
  readonly sampleFlowBalanceMaxAbsErrorMlPerSec: number | null;
};

type Run = {
  readonly pointId: PointId;
  readonly HR: 75 | 90;
  readonly targetTBVMl: number;
  readonly settled: boolean;
  readonly settleReason: string;
  readonly settleBeats: number;
  readonly health: Pick<SimulationHealth, "status" | "periodBeats" | "messages">;
  readonly LA: AtrialInputReadout | null;
  readonly RA: AtrialInputReadout | null;
};

type Evidence = {
  readonly schemaVersion: 1;
  readonly id: typeof ATRIAL_A2_INPUTS_PHASE5AW_ID;
  readonly phase: "Phase 5AW";
  readonly claimBoundary: "atrial-a2-input-groundwork-no-a2-model-selection";
  readonly protocol: {
    readonly runtimeActiveSourceMode: typeof MODELCORE_RUNTIME_LV_RV_LAND_DEFAULT_MODE;
    readonly pointSource: "hr75-hr90-normal-low-high-preload";
    readonly points: readonly PointSpec[];
    readonly dtSec: typeof DT_SEC;
    readonly sampleHz: typeof SAMPLE_HZ;
    readonly measureBeats: typeof MEASURE_BEATS;
    readonly providerCtxVolumeRateSemantics: "latest-resolved-flow-balance-explicit-estimate";
    readonly sampleVolumeRateSemantics: "same-sample-flow-balance-readback";
    readonly noA2Implementation: true;
    readonly noAtrialBridgeSelection: true;
    readonly noPermanentVerifierOrNpmScriptAdded: true;
  };
  readonly runs: readonly Run[];
  readonly summary: {
    readonly measuredPointCount: number;
    readonly healthOkPointCount: number;
    readonly ctxInputFinitePointCount: number;
    readonly sampleReadbackExactPointCount: number;
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

export function buildAtrialA2InputsPhase5AWEvidence(): Evidence {
  const runs = POINTS.map(runPoint);
  const ctxInputFinitePointCount = runs.filter((run) =>
    finiteCtx(run.LA) && finiteCtx(run.RA)
  ).length;
  const sampleReadbackExactPointCount = runs.filter((run) =>
    exactSampleReadback(run.LA) && exactSampleReadback(run.RA)
  ).length;
  const evidenceWithoutHash: Omit<Evidence, "normalizedSha256"> = {
    schemaVersion: 1,
    id: ATRIAL_A2_INPUTS_PHASE5AW_ID,
    phase: "Phase 5AW",
    claimBoundary: "atrial-a2-input-groundwork-no-a2-model-selection",
    protocol: {
      runtimeActiveSourceMode: MODELCORE_RUNTIME_LV_RV_LAND_DEFAULT_MODE,
      pointSource: "hr75-hr90-normal-low-high-preload",
      points: POINTS,
      dtSec: DT_SEC,
      sampleHz: SAMPLE_HZ,
      measureBeats: MEASURE_BEATS,
      providerCtxVolumeRateSemantics: "latest-resolved-flow-balance-explicit-estimate",
      sampleVolumeRateSemantics: "same-sample-flow-balance-readback",
      noA2Implementation: true,
      noAtrialBridgeSelection: true,
      noPermanentVerifierOrNpmScriptAdded: true,
    },
    runs,
    summary: {
      measuredPointCount: runs.length,
      healthOkPointCount: runs.filter((run) => run.health.status === "ok").length,
      ctxInputFinitePointCount,
      sampleReadbackExactPointCount,
      currentInterpretation:
        "Phase 5AW closes the A2 input API gap from Phase 5AU by exposing self chamber volumeRateMlPerSec to chamber/provider pressure calls. Provider context uses the latest resolved flow-balance estimate to avoid an implicit pressure-flow algebraic loop; SimSample exposes same-sample exact flow-balance readback for diagnostics.",
      recommendedNext: [
        "add pressure-decomposition debug output for passive, viscous/conduit, booster, and external AV-plane terms",
        "prototype AtrialPhysiologyBridgeV2/A2 with this input while keeping A1 as diagnostic bridge only",
        "keep AV-plane reservoir coupling reusable for A2 and later LandAtrial parameter-pack shadow work",
      ],
      blockers: [
        "A2 implementation remains absent",
        "absolute atrial waveform targets remain unsourced",
        "production atrial bridge selection remains blocked",
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
  };
  return {
    ...evidenceWithoutHash,
    normalizedSha256: hashStable(evidenceWithoutHash),
  };
}

function runPoint(point: PointSpec): Run {
  const params: Partial<CoreRuntimeParams> = { ...defaultParams(), HR: point.HR };
  const laCtxRates: number[] = [];
  const raCtxRates: number[] = [];
  const resolution = resolveModelCoreRuntimeActiveSource({
    mode: MODELCORE_RUNTIME_LV_RV_LAND_DEFAULT_MODE,
    runtimeParams: params,
  });
  const experimentalOptions: ModelCoreExperimentalOptions = {
    ...resolution.experimentalOptions,
    activeSourceProviders: {
      ...(resolution.experimentalOptions.activeSourceProviders ?? {}),
      LA: ctxLoggingProvider("LA", laCtxRates),
      RA: ctxLoggingProvider("RA", raCtxRates),
    },
  };
  const core = new ModelCore(params, experimentalOptions);
  core.initializeVenousPressuresForTargetTBV(point.targetTBVMl);
  const settleStatus = core.settleToSteady(SETTLE_POLICY, DT_SEC, 480);
  const settled = settleStatus.settled && settleStatus.actualSeconds != null;
  laCtxRates.length = 0;
  raCtxRates.length = 0;
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
    LA: atrialInputReadout(samples, "LA", laCtxRates),
    RA: atrialInputReadout(samples, "RA", raCtxRates),
  };
}

function ctxLoggingProvider(
  chamber: AtrialChamber,
  observedSelfVolumeRates: number[],
): ModelCoreExperimentalActiveSourceProvider {
  const record = (callChamber: Chamber, value: number | undefined) => {
    if (callChamber !== chamber || value === undefined) return;
    observedSelfVolumeRates.push(value);
  };
  return {
    sourceProviderId: `phase5aw-${chamber.toLowerCase()}-ctx-volume-rate-logger-v1`,
    initialInternal: ({ activeModel }) => activeModel.initialInternal(),
    pressure: ({ chamber: callChamber, activeModel, volumeMl, internal, chamberCtx }) => {
      record(callChamber, chamberCtx.selfChamberVolumeRateMlPerSec);
      return activeModel.pressure(volumeMl, internal, chamberCtx);
    },
    passivePressure: ({ chamber: callChamber, activeModel, volumeMl, chamberCtx }) => {
      record(callChamber, chamberCtx.selfChamberVolumeRateMlPerSec);
      return activeModel.passivePressure(volumeMl, chamberCtx);
    },
    internalDerivatives: ({ chamber: callChamber, activeModel, volumeMl, internal, chamberCtx }) => {
      record(callChamber, chamberCtx.selfChamberVolumeRateMlPerSec);
      return activeModel.internalDerivatives(volumeMl, internal, chamberCtx);
    },
  };
}

function atrialInputReadout(
  samples: readonly SimSample[],
  chamber: AtrialChamber,
  ctxRates: readonly number[],
): AtrialInputReadout | null {
  if (samples.length === 0) return null;
  const sampleRates = samples.map((sample) => chamber === "LA"
    ? valueAt(sample, "dVLAdtMlPerSec")
    : valueAt(sample, "dVRAdtMlPerSec"));
  const errors = samples.map((sample) => {
    const sampleRate = chamber === "LA"
      ? valueAt(sample, "dVLAdtMlPerSec")
      : valueAt(sample, "dVRAdtMlPerSec");
    const flowRate = chamber === "LA"
      ? sample.PVF - sample.QMV
      : sample.SVF + sample.QCS - sample.QTV;
    return Math.abs(sampleRate - flowRate);
  });
  const finiteCtxRates = ctxRates.filter(Number.isFinite);
  return {
    providerCtxCallCount: ctxRates.length,
    providerCtxFiniteCallCount: finiteCtxRates.length,
    providerCtxSelfVolumeRateMlPerSec: rangeCompact(finiteCtxRates),
    sampleSelfVolumeRateMlPerSec: rangeCompact(sampleRates),
    sampleFlowBalanceMaxAbsErrorMlPerSec: finiteOrNull(Math.max(...errors)),
  };
}

function finiteCtx(readout: AtrialInputReadout | null): boolean {
  return readout != null
    && readout.providerCtxCallCount > 0
    && readout.providerCtxCallCount === readout.providerCtxFiniteCallCount
    && readout.providerCtxSelfVolumeRateMlPerSec.min != null
    && readout.providerCtxSelfVolumeRateMlPerSec.max != null;
}

function exactSampleReadback(readout: AtrialInputReadout | null): boolean {
  return readout?.sampleFlowBalanceMaxAbsErrorMlPerSec != null
    && readout.sampleFlowBalanceMaxAbsErrorMlPerSec <= 1e-9;
}

function rangeCompact(values: readonly number[]): RangeCompact {
  let min = Infinity;
  let max = -Infinity;
  let count = 0;
  for (const value of values) {
    if (!Number.isFinite(value)) continue;
    min = Math.min(min, value);
    max = Math.max(max, value);
    count++;
  }
  if (count === 0) return { min: null, max: null };
  return {
    min: round(min),
    max: round(max),
  };
}

function valueAt(sample: SimSample, key: keyof SimSample): number {
  const value = sample[key];
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function finiteOrNull(value: number | null | undefined): number | null {
  return value != null && Number.isFinite(value) ? round(value) : null;
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
  const evidence = buildAtrialA2InputsPhase5AWEvidence();
  const outPath = path.resolve(process.cwd(), ATRIAL_A2_INPUTS_PHASE5AW_RESULT_PATH);
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
    ctxInputFinitePointCount: evidence.summary.ctxInputFinitePointCount,
    sampleReadbackExactPointCount: evidence.summary.sampleReadbackExactPointCount,
  }, null, 2));
}
