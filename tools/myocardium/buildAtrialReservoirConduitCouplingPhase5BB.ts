import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  ModelCore,
  defaultParams,
} from "@/engine/ModelCore";
import { measureSteady } from "@/engine/measure";
import {
  atrialPhysiologyBridgeV2CandidateParams,
  createAtrialPhysiologyBridgeV2SourceProvider,
  type AtrialPhysiologyBridgeV2ContributionSample,
} from "@/engine/myocardium/atrialPhysiologyBridgeV2";
import {
  MODELCORE_RUNTIME_LV_RV_LAND_DEFAULT_MODE,
  resolveModelCoreRuntimeActiveSource,
} from "@/engine/myocardium/runtimeActiveSource";
import type { CoreRuntimeParams, SimulationHealth } from "@/engine/protocol";
import { DEFAULT_SETTLE_POLICY, type SettlePolicy } from "@/engine/settling";

export const ATRIAL_RESERVOIR_CONDUIT_COUPLING_PHASE5BB_ID =
  "atrial-reservoir-conduit-coupling-phase5bb-result-v1";

export const ATRIAL_RESERVOIR_CONDUIT_COUPLING_PHASE5BB_RESULT_PATH =
  "data/myocardium/protocols/atrial-reservoir-conduit-coupling-phase5bb-result-v1.json";

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

type ContributionSummary = {
  readonly sampleCount: number;
  readonly finiteSampleCount: number;
  readonly viscousConduitPressureMmHg: RangeCompact;
  readonly tensionBoosterPressureMmHg: RangeCompact;
  readonly avPlaneExtraPressureMmHg: RangeCompact;
  readonly totalAddedPressureMmHg: RangeCompact;
  readonly boosterGateMean: number | null;
};

type Run = {
  readonly pointId: PointId;
  readonly HR: 75 | 90;
  readonly targetTBVMl: number;
  readonly settled: boolean;
  readonly settleReason: string;
  readonly settleBeats: number;
  readonly health: Pick<SimulationHealth, "status" | "periodBeats" | "messages">;
  readonly forwardCO_L: number | null;
  readonly forwardCO_R: number | null;
  readonly contribution: Record<AtrialChamber, ContributionSummary | null>;
};

type Evidence = {
  readonly schemaVersion: 1;
  readonly id: typeof ATRIAL_RESERVOIR_CONDUIT_COUPLING_PHASE5BB_ID;
  readonly phase: "Phase 5BB";
  readonly claimBoundary: "atrial-reservoir-conduit-coupling-componentization-smoke-no-selection";
  readonly protocol: {
    readonly runtimeActiveSourceMode: typeof MODELCORE_RUNTIME_LV_RV_LAND_DEFAULT_MODE;
    readonly pointSource: "hr75-hr90-normal-low-high-preload";
    readonly candidateId: "atrial-a2-conduit-v1";
    readonly dtSec: typeof DT_SEC;
    readonly sampleHz: typeof SAMPLE_HZ;
    readonly measureBeats: typeof MEASURE_BEATS;
    readonly couplingModule: "engine/myocardium/atrialReservoirConduitCoupling.ts";
    readonly noRuntimeDefaultFlip: true;
    readonly noProductionBridgeSelection: true;
    readonly noParameterTuning: true;
    readonly noPermanentVerifierOrNpmScriptAdded: true;
  };
  readonly runs: readonly Run[];
  readonly summary: {
    readonly measuredPointCount: number;
    readonly healthOkPointCount: number;
    readonly finiteContributionPointCount: number;
    readonly boundedContributionPointCount: number;
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

export function buildAtrialReservoirConduitCouplingPhase5BBEvidence(): Evidence {
  const runs = POINTS.map(runPoint);
  const finiteContributionPointCount = runs.filter((run) =>
    finiteContribution(run.contribution.LA) && finiteContribution(run.contribution.RA)
  ).length;
  const boundedContributionPointCount = runs.filter((run) =>
    boundedContribution(run.contribution.LA) && boundedContribution(run.contribution.RA)
  ).length;
  const evidenceWithoutHash: Omit<Evidence, "normalizedSha256"> = {
    schemaVersion: 1,
    id: ATRIAL_RESERVOIR_CONDUIT_COUPLING_PHASE5BB_ID,
    phase: "Phase 5BB",
    claimBoundary: "atrial-reservoir-conduit-coupling-componentization-smoke-no-selection",
    protocol: {
      runtimeActiveSourceMode: MODELCORE_RUNTIME_LV_RV_LAND_DEFAULT_MODE,
      pointSource: "hr75-hr90-normal-low-high-preload",
      candidateId: "atrial-a2-conduit-v1",
      dtSec: DT_SEC,
      sampleHz: SAMPLE_HZ,
      measureBeats: MEASURE_BEATS,
      couplingModule: "engine/myocardium/atrialReservoirConduitCoupling.ts",
      noRuntimeDefaultFlip: true,
      noProductionBridgeSelection: true,
      noParameterTuning: true,
      noPermanentVerifierOrNpmScriptAdded: true,
    },
    runs,
    summary: {
      measuredPointCount: runs.length,
      healthOkPointCount: runs.filter((run) => run.health.status === "ok").length,
      finiteContributionPointCount,
      boundedContributionPointCount,
      currentInterpretation:
        "Phase 5BB factors A2 reservoir/conduit pressure terms into a reusable coupling module and confirms the A2 conduit provider still records finite, bounded contribution readbacks across the HR75/90 preload envelope.",
      recommendedNext: [
        "use the reusable coupling module from LandAtrial shadow work instead of adding another A2-only path",
        "keep A2 off-by-default and avoid gain tuning from the normal-hr75 local signal alone",
        "add wall/AV-plane strain proxy before scoring stored strain targets",
      ],
      blockers: [
        "A2 remains unselected",
        "LandAtrial shadow remains absent",
        "strain targets remain stored but unscored",
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

function runPoint(point: PointSpec): Run {
  const params: Partial<CoreRuntimeParams> = { ...defaultParams(), HR: point.HR };
  const runtimeResolution = resolveModelCoreRuntimeActiveSource({
    mode: MODELCORE_RUNTIME_LV_RV_LAND_DEFAULT_MODE,
    runtimeParams: params,
  });
  const collector = new ContributionCollector();
  const core = new ModelCore(params, {
    ...runtimeResolution.experimentalOptions,
    activeSourceProviders: {
      ...(runtimeResolution.experimentalOptions.activeSourceProviders ?? {}),
      LA: createAtrialPhysiologyBridgeV2SourceProvider(
        "LA",
        atrialPhysiologyBridgeV2CandidateParams("atrial-a2-conduit-v1", "LA"),
        collector,
      ),
      RA: createAtrialPhysiologyBridgeV2SourceProvider(
        "RA",
        atrialPhysiologyBridgeV2CandidateParams("atrial-a2-conduit-v1", "RA"),
        collector,
      ),
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
  if (!measurement) {
    core.runFor(MEASURE_BEATS * 60 / point.HR, DT_SEC, SAMPLE_HZ, { recordHistory: false });
  }
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
    forwardCO_L: finiteOrNull(measurement?.forwardCO_L),
    forwardCO_R: finiteOrNull(measurement?.forwardCO_R),
    contribution: {
      LA: collector.summary("LA"),
      RA: collector.summary("RA"),
    },
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

  summary(chamber: AtrialChamber): ContributionSummary | null {
    const samples = this.samples.filter((sample) => sample.chamber === chamber);
    if (samples.length === 0) return null;
    const finiteSampleCount = samples.filter((sample) =>
      Number.isFinite(sample.viscousConduitPressureMmHg)
      && Number.isFinite(sample.tensionBoosterPressureMmHg)
      && Number.isFinite(sample.avPlaneExtraPressureMmHg)
      && Number.isFinite(sample.totalAddedPressureMmHg)
    ).length;
    return {
      sampleCount: samples.length,
      finiteSampleCount,
      viscousConduitPressureMmHg: rangeCompact(samples.map((sample) => sample.viscousConduitPressureMmHg)),
      tensionBoosterPressureMmHg: rangeCompact(samples.map((sample) => sample.tensionBoosterPressureMmHg)),
      avPlaneExtraPressureMmHg: rangeCompact(samples.map((sample) => sample.avPlaneExtraPressureMmHg)),
      totalAddedPressureMmHg: rangeCompact(samples.map((sample) => sample.totalAddedPressureMmHg)),
      boosterGateMean: finiteOrNull(mean(samples.map((sample) => sample.boosterGate01))),
    };
  }
}

function finiteContribution(summary: ContributionSummary | null): boolean {
  return summary != null && summary.sampleCount > 0 && summary.finiteSampleCount === summary.sampleCount;
}

function boundedContribution(summary: ContributionSummary | null): boolean {
  return finiteContribution(summary)
    && Math.max(
      Math.abs(summary!.totalAddedPressureMmHg.min ?? Number.NaN),
      Math.abs(summary!.totalAddedPressureMmHg.max ?? Number.NaN),
    ) <= 8;
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

function mean(values: readonly number[]): number {
  const finite = values.filter(Number.isFinite);
  return finite.length === 0 ? Number.NaN : finite.reduce((sum, value) => sum + value, 0) / finite.length;
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
  const evidence = buildAtrialReservoirConduitCouplingPhase5BBEvidence();
  const outPath = path.resolve(process.cwd(), ATRIAL_RESERVOIR_CONDUIT_COUPLING_PHASE5BB_RESULT_PATH);
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
    healthOkPointCount: evidence.summary.healthOkPointCount,
    finiteContributionPointCount: evidence.summary.finiteContributionPointCount,
    boundedContributionPointCount: evidence.summary.boundedContributionPointCount,
  }, null, 2));
}
