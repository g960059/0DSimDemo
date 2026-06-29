import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { ModelCore, defaultParams } from "@/engine/ModelCore";
import { measureSteady } from "@/engine/measure";
import {
  MODELCORE_RUNTIME_LV_RV_LAND_DEFAULT_MODE,
  resolveModelCoreRuntimeActiveSource,
} from "@/engine/myocardium/runtimeActiveSource";
import type { CoreRuntimeParams, SimSample, SimulationHealth } from "@/engine/protocol";
import { DEFAULT_SETTLE_POLICY, type SettlePolicy } from "@/engine/settling";

export const ATRIAL_PRESSURE_DECOMPOSITION_PHASE5AX_ID =
  "atrial-pressure-decomposition-phase5ax-result-v1";

export const ATRIAL_PRESSURE_DECOMPOSITION_PHASE5AX_RESULT_PATH =
  "data/myocardium/protocols/atrial-pressure-decomposition-phase5ax-result-v1.json";

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

type DecompositionReadout = {
  readonly finiteSampleCount: number;
  readonly sampleCount: number;
  readonly pressureUnclampedMmHg: RangeCompact;
  readonly passivePressureMmHg: RangeCompact;
  readonly activePressureMmHg: RangeCompact;
  readonly avPlanePressureDeltaMmHg: RangeCompact;
  readonly pressureFloorHitFraction: number | null;
  readonly passivePlusActiveClosureMaxAbsErrorMmHg: number | null;
  readonly avPlaneNonZeroFraction: number | null;
};

type Run = {
  readonly pointId: PointId;
  readonly HR: 75 | 90;
  readonly targetTBVMl: number;
  readonly settled: boolean;
  readonly settleReason: string;
  readonly settleBeats: number;
  readonly health: Pick<SimulationHealth, "status" | "periodBeats" | "messages">;
  readonly LA: DecompositionReadout | null;
  readonly RA: DecompositionReadout | null;
};

type Evidence = {
  readonly schemaVersion: 1;
  readonly id: typeof ATRIAL_PRESSURE_DECOMPOSITION_PHASE5AX_ID;
  readonly phase: "Phase 5AX";
  readonly claimBoundary: "atrial-pressure-decomposition-debug-no-a2-model-selection";
  readonly protocol: {
    readonly runtimeActiveSourceMode: typeof MODELCORE_RUNTIME_LV_RV_LAND_DEFAULT_MODE;
    readonly pointSource: "hr75-hr90-normal-low-high-preload";
    readonly points: readonly PointSpec[];
    readonly dtSec: typeof DT_SEC;
    readonly sampleHz: typeof SAMPLE_HZ;
    readonly measureBeats: typeof MEASURE_BEATS;
    readonly decompositionTerms: readonly [
      "passive-pressure",
      "active-pressure",
      "av-plane-pressure-delta",
      "pressure-floor-hit",
    ];
    readonly noA2Implementation: true;
    readonly noAtrialBridgeSelection: true;
    readonly noPermanentVerifierOrNpmScriptAdded: true;
  };
  readonly runs: readonly Run[];
  readonly summary: {
    readonly measuredPointCount: number;
    readonly healthOkPointCount: number;
    readonly finiteDecompositionPointCount: number;
    readonly closureExactPointCount: number;
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

export function buildAtrialPressureDecompositionPhase5AXEvidence(): Evidence {
  const runs = POINTS.map(runPoint);
  const finiteDecompositionPointCount = runs.filter((run) =>
    finiteReadout(run.LA) && finiteReadout(run.RA)
  ).length;
  const closureExactPointCount = runs.filter((run) =>
    closureExact(run.LA) && closureExact(run.RA)
  ).length;
  const evidenceWithoutHash: Omit<Evidence, "normalizedSha256"> = {
    schemaVersion: 1,
    id: ATRIAL_PRESSURE_DECOMPOSITION_PHASE5AX_ID,
    phase: "Phase 5AX",
    claimBoundary: "atrial-pressure-decomposition-debug-no-a2-model-selection",
    protocol: {
      runtimeActiveSourceMode: MODELCORE_RUNTIME_LV_RV_LAND_DEFAULT_MODE,
      pointSource: "hr75-hr90-normal-low-high-preload",
      points: POINTS,
      dtSec: DT_SEC,
      sampleHz: SAMPLE_HZ,
      measureBeats: MEASURE_BEATS,
      decompositionTerms: [
        "passive-pressure",
        "active-pressure",
        "av-plane-pressure-delta",
        "pressure-floor-hit",
      ],
      noA2Implementation: true,
      noAtrialBridgeSelection: true,
      noPermanentVerifierOrNpmScriptAdded: true,
    },
    runs,
    summary: {
      measuredPointCount: runs.length,
      healthOkPointCount: runs.filter((run) => run.health.status === "ok").length,
      finiteDecompositionPointCount,
      closureExactPointCount,
      currentInterpretation:
        "Phase 5AX adds atrial pressure-decomposition debug readbacks for passive pressure, active pressure, AV-plane pressure delta, and floor-hit signals. This prepares A2 viscous/conduit and tension-state booster prototyping without implementing A2 or selecting an atrial bridge.",
      recommendedNext: [
        "prototype AtrialPhysiologyBridgeV2/A2 viscous/conduit and tension-state booster terms against these debug readbacks",
        "source absolute atrial waveform targets before any parameter tuning",
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
  const resolution = resolveModelCoreRuntimeActiveSource({
    mode: MODELCORE_RUNTIME_LV_RV_LAND_DEFAULT_MODE,
    runtimeParams: params,
  });
  const core = new ModelCore(params, resolution.experimentalOptions);
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
    LA: decompositionReadout(samples, "LA"),
    RA: decompositionReadout(samples, "RA"),
  };
}

function decompositionReadout(
  samples: readonly SimSample[],
  chamber: AtrialChamber,
): DecompositionReadout | null {
  if (samples.length === 0) return null;
  const pressureUnclamped = samples.map((sample) => valueAt(sample, `${chamber}PressureUnclampedMmHg`));
  const passivePressure = samples.map((sample) => valueAt(sample, `${chamber}PassivePressureMmHg`));
  const activePressure = samples.map((sample) => valueAt(sample, `${chamber}ActivePressureMmHg`));
  const avPlanePressureDelta = samples.map((sample) => valueAt(sample, `${chamber}AvPlanePressureDeltaMmHg`));
  const floorHits = samples.map((sample) => valueAt(sample, `${chamber}PressureFloorHit01`));
  const closureErrors = pressureUnclamped.map((value, index) =>
    Math.abs(value - passivePressure[index] - activePressure[index]));
  const finiteSampleCount = pressureUnclamped.filter(Number.isFinite).length;
  const nonZeroAvPlane = avPlanePressureDelta.filter((value) => Number.isFinite(value) && Math.abs(value) > 1e-9).length;
  return {
    finiteSampleCount,
    sampleCount: samples.length,
    pressureUnclampedMmHg: rangeCompact(pressureUnclamped),
    passivePressureMmHg: rangeCompact(passivePressure),
    activePressureMmHg: rangeCompact(activePressure),
    avPlanePressureDeltaMmHg: rangeCompact(avPlanePressureDelta),
    pressureFloorHitFraction: finiteOrNull(sum(floorHits) / Math.max(floorHits.length, 1)),
    passivePlusActiveClosureMaxAbsErrorMmHg: finiteOrNull(maxFinite(closureErrors)),
    avPlaneNonZeroFraction: finiteOrNull(nonZeroAvPlane / Math.max(samples.length, 1)),
  };
}

function finiteReadout(readout: DecompositionReadout | null): boolean {
  return readout != null
    && readout.finiteSampleCount === readout.sampleCount
    && readout.pressureUnclampedMmHg.min != null
    && readout.passivePressureMmHg.min != null
    && readout.activePressureMmHg.min != null
    && readout.avPlanePressureDeltaMmHg.min != null;
}

function closureExact(readout: DecompositionReadout | null): boolean {
  return readout?.passivePlusActiveClosureMaxAbsErrorMmHg != null
    && readout.passivePlusActiveClosureMaxAbsErrorMmHg <= 1e-9;
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

function valueAt(sample: SimSample, key: string): number {
  const value = (sample as unknown as Record<string, number | undefined>)[key];
  return typeof value === "number" && Number.isFinite(value) ? value : Number.NaN;
}

function maxFinite(values: readonly number[]): number {
  let max = -Infinity;
  for (const value of values) {
    if (Number.isFinite(value)) max = Math.max(max, value);
  }
  return max;
}

function sum(values: readonly number[]): number {
  return values.reduce((acc, value) => acc + (Number.isFinite(value) ? value : 0), 0);
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
  const evidence = buildAtrialPressureDecompositionPhase5AXEvidence();
  const outPath = path.resolve(process.cwd(), ATRIAL_PRESSURE_DECOMPOSITION_PHASE5AX_RESULT_PATH);
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
    finiteDecompositionPointCount: evidence.summary.finiteDecompositionPointCount,
    closureExactPointCount: evidence.summary.closureExactPointCount,
  }, null, 2));
}
