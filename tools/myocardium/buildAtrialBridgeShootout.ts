import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  ModelCore,
  defaultParams,
  type ModelCoreExperimentalActiveSourceProvider,
} from "@/engine/ModelCore";
import {
  ActiveStressChamberModel,
  ElastanceChamberModel,
  defaultActiveLA,
  defaultActiveRA,
  type ActiveChamberParams,
  type Chamber,
  type ChamberCtx,
  type ChamberInternal,
  type ChamberInternalDerivatives,
} from "@/engine/chambers";
import { measureSteady } from "@/engine/measure";
import type { CoreRuntimeParams, SimSample } from "@/engine/protocol";
import { DEFAULT_SETTLE_POLICY, type SettlePolicy } from "@/engine/settling";

export const ATRIAL_BRIDGE_SHOOTOUT_EVIDENCE_ID =
  "atrial-bridge-shootout-phase5p5-result-v1";

export const ATRIAL_BRIDGE_SHOOTOUT_RESULT_PATH =
  "data/myocardium/protocols/atrial-bridge-shootout-phase5p5-result-v1.json";

export type AtrialBridgeCandidateId =
  | "atrial-elastance-negative-control-v0"
  | "legacy-atrial-active-bridge-v0"
  | "atrial-reservoir-booster-bridge-v1"
  | "atrial-refined-reservoir-booster-bridge-v1";

type AtrialChamber = "LA" | "RA";

export type AtrialBridgeDiagnosticVariantId =
  | "none"
  | "a1-reservoir-off"
  | "a1-recoil-slower"
  | "a1-valve-threshold-higher";

export type AtrialBridgeProviderOptions = {
  readonly diagnosticVariantId?: AtrialBridgeDiagnosticVariantId;
};

export type AtrialBridgeRuntime = {
  readonly candidateId: AtrialBridgeCandidateId;
  readonly chamber: AtrialChamber;
  readonly role: "negative-control" | "quarantined-comparator" | "preferred-new-bridge-candidate";
  initialInternal(): ChamberInternal;
  pressure(volumeMl: number, internal: ChamberInternal, ctx: ChamberCtx): number;
  passivePressure(volumeMl: number, ctx: ChamberCtx): number;
  internalDerivatives(volumeMl: number, internal: ChamberInternal, ctx: ChamberCtx): ChamberInternalDerivatives;
};

export type AtrialBridgeShootoutEvidence = {
  readonly schemaVersion: 1;
  readonly id: typeof ATRIAL_BRIDGE_SHOOTOUT_EVIDENCE_ID;
  readonly phase: "Phase 5.5";
  readonly claimBoundary: "temporary-atrial-bridge-shootout-recommendation-only";
  readonly verifierScript: "verify:myocardium-atrial-bridge-shootout";
  readonly relatedProtocol: "data/myocardium/protocols/atrial-bridge-shootout-phase5p5-protocols.json";
  readonly relatedTargets: "data/myocardium/targets/atrial-bridge-targets-v1.json";
  readonly relatedDecision: "data/myocardium/decisions/atrial-bridge-decision21-phase6-selection-v1.json";
  readonly ownerDirection: {
    readonly atriaModeling: "correct-refined-model-through-oracle-staged-introduction";
    readonly studioWorkbenchMock: "owner-led-not-in-this-lane";
    readonly morphologyLane: "allowed-later-when-timing-is-appropriate";
  };
  readonly implementationStatus: {
    readonly experimentalAtrialProvidersImplemented: true;
    readonly candidateScope: "LA-RA-only";
    readonly productionRuntimeWiring: "absent";
    readonly officialCaseWiring: "absent";
    readonly workbenchRuntimeWiring: "absent";
    readonly stateSchemaMigration: "absent";
    readonly atrialLandRdqImplementation: "absent";
  };
  readonly protocol: {
    readonly candidateIds: readonly AtrialBridgeCandidateId[];
    readonly isolatedChambers: readonly AtrialChamber[];
    readonly closedLoopSmokePoints: readonly AtrialBridgeClosedLoopPointSpec[];
    readonly dtSec: number;
    readonly sampleHz: number;
    readonly isolatedWarmupBeats: number;
    readonly isolatedMeasureBeats: number;
    readonly closedLoopMeasureBeats: number;
    readonly settlePolicy: Pick<SettlePolicy, "tolPrimary" | "tolShape" | "consecutiveBeats" | "minBeats" | "capSeconds" | "postSettleBeats">;
    readonly sameBoundaryForAllCandidates: true;
    readonly sameSamplingGridsForAllCandidates: true;
  };
  readonly isolatedRuns: readonly AtrialBridgeIsolatedRun[];
  readonly closedLoopRuns: readonly AtrialBridgeClosedLoopRun[];
  readonly candidateSummaries: readonly AtrialBridgeCandidateSummary[];
  readonly runHealth: {
    readonly isolatedRunCount: number;
    readonly isolatedFiniteRunCount: number;
    readonly closedLoopRunCount: number;
    readonly closedLoopSettledCount: number;
    readonly closedLoopHealthOkCount: number;
    readonly closedLoopProjectorQuietCount: number;
    readonly allCandidatesMeasuredUnderSameProtocol: boolean;
    readonly allClosedLoopRunsRecordSettleStatus: boolean;
  };
  readonly recommendation: {
    readonly selectedCandidateId: null;
    readonly recommendedCandidateId: AtrialBridgeCandidateId | null;
    readonly status: "recommendation-only-owner-selection-still-required";
    readonly rationale: readonly string[];
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
    readonly noLvRvLandAcceptance: true;
    readonly noMorphologyAcceptance: true;
  };
  readonly nextAllowedWork: readonly string[];
  readonly doesNotUnlock: readonly string[];
};

export type AtrialBridgeClosedLoopPointSpec = {
  readonly id: "normal" | "low-preload" | "high-preload" | "high-hr";
  readonly targetTBVMl: number;
  readonly HR: number;
};

export type AtrialBridgeLoopMetrics = {
  readonly pvLoopRoughness240: number;
  readonly pvLoopRoughness480: number;
  readonly roughnessSamplingRelativeDelta: number;
  readonly pressureHighFrequencyEnergy: number;
  readonly dPdtSpikeCount: number;
  readonly aLoopAreaProxy: number;
  readonly vLoopAreaProxy: number;
  readonly aOverVLoopRatio: number;
  readonly boosterPressureFraction: number;
  readonly selfIntersections: number;
  readonly volumeMinMl: number;
  readonly volumeMaxMl: number;
  readonly pressureMeanMmHg: number;
  readonly pressureMinMmHg: number;
  readonly pressureMaxMmHg: number;
  readonly beatRepeatabilityDelta: number;
};

export type AtrialBridgeIsolatedRun = {
  readonly protocolId: "isolated-la-v1" | "isolated-ra-v1";
  readonly candidateId: AtrialBridgeCandidateId;
  readonly chamber: AtrialChamber;
  readonly finite: boolean;
  readonly metrics: AtrialBridgeLoopMetrics;
};

export type AtrialBridgeClosedLoopRun = {
  readonly protocolId: "closed-loop-smoke-v1";
  readonly pointId: AtrialBridgeClosedLoopPointSpec["id"];
  readonly candidateId: AtrialBridgeCandidateId;
  readonly targetTBVMl: number;
  readonly HR: number;
  readonly settled: boolean;
  readonly settleReason: string;
  readonly settleActualSeconds: number | null;
  readonly settleBeats: number;
  readonly periodBeats: number;
  readonly adjacentDelta: number;
  readonly periodDelta: number;
  readonly healthStatus: string;
  readonly healthMessages: readonly string[];
  readonly projectorQuiet: boolean;
  readonly forwardCO_L: number | null;
  readonly forwardCO_R: number | null;
  readonly LAPMean: number | null;
  readonly RAPMean: number | null;
  readonly LA: AtrialBridgeLoopMetrics | null;
  readonly RA: AtrialBridgeLoopMetrics | null;
  readonly clampHits: {
    readonly totalClampHits: number;
    readonly qDotClampHitFraction: number;
    readonly valveDiodeClampHits: Partial<Record<"MV" | "TV", number>>;
  };
};

export type AtrialBridgeCandidateSummary = {
  readonly candidateId: AtrialBridgeCandidateId;
  readonly role: "negative-control" | "quarantined-comparator" | "preferred-new-bridge-candidate";
  readonly isolatedFinite: boolean;
  readonly closedLoopSettledCount: number;
  readonly closedLoopHealthOkCount: number;
  readonly roughnessScore: number;
  readonly highFrequencyEnergyScore: number;
  readonly boosterPreserved: boolean;
  readonly roughnessSamplingInvariantVsA0: boolean | null;
  readonly qDotContaminationNoWorseThanA0: boolean | null;
  readonly valveDiodeContaminationNoWorseThanA0: boolean | null;
  readonly contaminationNoWorseThanA0: boolean | null;
  readonly repeatabilityOkCount: number;
  readonly repeatabilityAllSettledMainPointsOk: boolean;
  readonly selectableByScript: boolean;
};

const CANDIDATES: readonly AtrialBridgeCandidateId[] = [
  "atrial-elastance-negative-control-v0",
  "legacy-atrial-active-bridge-v0",
  "atrial-reservoir-booster-bridge-v1",
] as const;

const ATRIAL_CHAMBERS: readonly AtrialChamber[] = ["LA", "RA"] as const;

const DT_SEC = 0.001;
const SAMPLE_HZ = 480;
const ISOLATED_WARMUP_BEATS = 10;
const ISOLATED_MEASURE_BEATS = 2;
const CLOSED_LOOP_MEASURE_BEATS = 3;
const SETTLE_POLICY: SettlePolicy = {
  ...DEFAULT_SETTLE_POLICY,
  capSeconds: 120,
  postSettleBeats: 2,
};

const CLOSED_LOOP_POINTS: readonly AtrialBridgeClosedLoopPointSpec[] = [
  { id: "normal", targetTBVMl: 5600, HR: 75 },
  { id: "low-preload", targetTBVMl: 4800, HR: 75 },
  { id: "high-preload", targetTBVMl: 6200, HR: 75 },
  { id: "high-hr", targetTBVMl: 5600, HR: 105 },
] as const;
const CLOSED_LOOP_MAIN_POINT_IDS = ["normal", "low-preload", "high-preload"] as const;
const ATRIAL_LOOP_REPEATABILITY_THRESHOLD = 0.05;

export function createAtrialBridgeProviders(
  candidateId: AtrialBridgeCandidateId,
  options: AtrialBridgeProviderOptions = {},
): Partial<Record<Chamber, ModelCoreExperimentalActiveSourceProvider>> {
  return {
    LA: modelCoreAtrialProvider(candidateId, "LA", options),
    RA: modelCoreAtrialProvider(candidateId, "RA", options),
  };
}

export function buildAtrialBridgeShootoutEvidence(): AtrialBridgeShootoutEvidence {
  const isolatedRuns = CANDIDATES.flatMap((candidateId) =>
    ATRIAL_CHAMBERS.map((chamber) => runIsolatedProtocol(candidateId, chamber))
  );
  const closedLoopRuns = CANDIDATES.flatMap((candidateId) =>
    CLOSED_LOOP_POINTS.map((point) => runClosedLoopSmoke(candidateId, point))
  );
  const candidateSummaries = CANDIDATES.map((candidateId) =>
    summarizeCandidate(candidateId, isolatedRuns, closedLoopRuns)
  );
  const recommendation = buildRecommendation(candidateSummaries, closedLoopRuns);

  return {
    schemaVersion: 1,
    id: ATRIAL_BRIDGE_SHOOTOUT_EVIDENCE_ID,
    phase: "Phase 5.5",
    claimBoundary: "temporary-atrial-bridge-shootout-recommendation-only",
    verifierScript: "verify:myocardium-atrial-bridge-shootout",
    relatedProtocol: "data/myocardium/protocols/atrial-bridge-shootout-phase5p5-protocols.json",
    relatedTargets: "data/myocardium/targets/atrial-bridge-targets-v1.json",
    relatedDecision: "data/myocardium/decisions/atrial-bridge-decision21-phase6-selection-v1.json",
    ownerDirection: {
      atriaModeling: "correct-refined-model-through-oracle-staged-introduction",
      studioWorkbenchMock: "owner-led-not-in-this-lane",
      morphologyLane: "allowed-later-when-timing-is-appropriate",
    },
    implementationStatus: {
      experimentalAtrialProvidersImplemented: true,
      candidateScope: "LA-RA-only",
      productionRuntimeWiring: "absent",
      officialCaseWiring: "absent",
      workbenchRuntimeWiring: "absent",
      stateSchemaMigration: "absent",
      atrialLandRdqImplementation: "absent",
    },
    protocol: {
      candidateIds: CANDIDATES,
      isolatedChambers: ATRIAL_CHAMBERS,
      closedLoopSmokePoints: CLOSED_LOOP_POINTS,
      dtSec: DT_SEC,
      sampleHz: SAMPLE_HZ,
      isolatedWarmupBeats: ISOLATED_WARMUP_BEATS,
      isolatedMeasureBeats: ISOLATED_MEASURE_BEATS,
      closedLoopMeasureBeats: CLOSED_LOOP_MEASURE_BEATS,
      settlePolicy: {
        tolPrimary: SETTLE_POLICY.tolPrimary,
        tolShape: SETTLE_POLICY.tolShape,
        consecutiveBeats: SETTLE_POLICY.consecutiveBeats,
        minBeats: SETTLE_POLICY.minBeats,
        capSeconds: SETTLE_POLICY.capSeconds,
        postSettleBeats: SETTLE_POLICY.postSettleBeats,
      },
      sameBoundaryForAllCandidates: true,
      sameSamplingGridsForAllCandidates: true,
    },
    isolatedRuns,
    closedLoopRuns,
    candidateSummaries,
    runHealth: {
      isolatedRunCount: isolatedRuns.length,
      isolatedFiniteRunCount: isolatedRuns.filter((run) => run.finite).length,
      closedLoopRunCount: closedLoopRuns.length,
      closedLoopSettledCount: closedLoopRuns.filter((run) => run.settled).length,
      closedLoopHealthOkCount: closedLoopRuns.filter((run) => run.healthStatus === "ok").length,
      closedLoopProjectorQuietCount: closedLoopRuns.filter((run) => run.projectorQuiet).length,
      allCandidatesMeasuredUnderSameProtocol: true,
      allClosedLoopRunsRecordSettleStatus: closedLoopRuns.every((run) => run.settleReason.length > 0),
    },
    recommendation,
    boundary: {
      noProductionRuntimeWiring: true,
      noOfficialCaseReauthoring: true,
      noWorkbenchRuntimeWiring: true,
      noStateSchemaMigration: true,
      noAtrialLandRdqClaim: true,
      noAfValidationClaim: true,
      noFinalAtrialPhysiologyClaim: true,
      noLvRvLandAcceptance: true,
      noMorphologyAcceptance: true,
    },
    nextAllowedWork: [
      "owner/oracle review of recommendation before Phase 6 bridge selection",
      "if A1 is not selectable, localize exact failure mode with the same runner before tuning",
      "after selected bridge owner decision, run LV/RV Land closed-loop with the selected atrial bridge",
      "later Phase 7 atrial Land/RDQ model only after bridge evidence and atrial target audit",
    ],
    doesNotUnlock: [
      "production atrial bridge wiring",
      "official case reauthoring",
      "Workbench runtime wiring",
      "state schema migration",
      "atrial Land/RDQ physiology claim",
      "AF validation",
      "final atrial physiology acceptance",
    ],
  };
}

function modelCoreAtrialProvider(
  candidateId: AtrialBridgeCandidateId,
  chamber: AtrialChamber,
  options: AtrialBridgeProviderOptions = {},
): ModelCoreExperimentalActiveSourceProvider {
  let runtime: AtrialBridgeRuntime | null = null;
  const resolve = (activeModel: ActiveStressChamberModel): AtrialBridgeRuntime => {
    runtime ??= createAtrialBridgeRuntime(candidateId, chamber, activeModel.ap, options);
    return runtime;
  };
  return {
    sourceProviderId: candidateId,
    initialInternal: ({ activeModel }) => resolve(activeModel).initialInternal(),
    pressure: ({ activeModel, volumeMl, internal, chamberCtx }) =>
      resolve(activeModel).pressure(volumeMl, internal, chamberCtx),
    passivePressure: ({ activeModel, volumeMl, chamberCtx }) =>
      resolve(activeModel).passivePressure(volumeMl, chamberCtx),
    internalDerivatives: ({ activeModel, volumeMl, internal, chamberCtx }) =>
      resolve(activeModel).internalDerivatives(volumeMl, internal, chamberCtx),
  };
}

export function createAtrialBridgeRuntime(
  candidateId: AtrialBridgeCandidateId,
  chamber: AtrialChamber,
  baseParams = chamber === "LA" ? defaultActiveLA : defaultActiveRA,
  options: AtrialBridgeProviderOptions = {},
): AtrialBridgeRuntime {
  if (candidateId === "atrial-elastance-negative-control-v0") {
    const ep = elastanceParamsFor(chamber);
    const model = new ElastanceChamberModel(ep);
    return {
      candidateId,
      chamber,
      role: "negative-control",
      initialInternal: () => ({ c: 0, a: 0, r: 0, tensionPa: 0, lambdaAct: 1 }),
      pressure: (volumeMl, _internal, ctx) => model.pressure(volumeMl, { c: 0, a: 0, r: 0, tensionPa: 0 }, ctx),
      passivePressure: (volumeMl) => elastancePassivePressureMmHg(volumeMl, ep),
      internalDerivatives: () => ({ cDot: 0, aDot: 0, rDot: 0, tensionPaDot: 0, lambdaActDot: 0 }),
    };
  }

  const role = candidateId === "legacy-atrial-active-bridge-v0"
    ? "quarantined-comparator"
    : "preferred-new-bridge-candidate";
  const params = candidateId === "legacy-atrial-active-bridge-v0"
    ? frozenLegacyAtrialParams(baseParams)
    : candidateId === "atrial-refined-reservoir-booster-bridge-v1"
      ? refinedReservoirBoosterAtrialParams(baseParams, chamber)
      : reservoirBoosterAtrialParams(baseParams, chamber, options.diagnosticVariantId ?? "none");
  const model = new ActiveStressChamberModel(params);
  return {
    candidateId,
    chamber,
    role,
    initialInternal: () => model.initialInternal(),
    pressure: (volumeMl, internal, ctx) => model.pressure(volumeMl, internal, ctx),
    passivePressure: (volumeMl, ctx) => model.passivePressure(volumeMl, ctx),
    internalDerivatives: (volumeMl, internal, ctx) => model.internalDerivatives(volumeMl, internal, ctx),
  };
}

function frozenLegacyAtrialParams(base: ActiveChamberParams): ActiveChamberParams {
  return {
    ...base,
    reservoirBranchGain: 0,
    reservoirStrokeMl: 0,
  };
}

function reservoirBoosterAtrialParams(
  base: ActiveChamberParams,
  chamber: AtrialChamber,
  diagnosticVariantId: AtrialBridgeDiagnosticVariantId = "none",
): ActiveChamberParams {
  const params: ActiveChamberParams = {
    ...base,
    reservoirBranchGain: 1,
    reservoirStrokeMl: chamber === "LA" ? 12 : 14,
    reservoirSleeveVuMl: chamber === "LA" ? 8 : 10,
    reservoirSleeveCompliance: chamber === "LA" ? 3.0 : 4.0,
    reservoirSleeveP0: 0,
    reservoirSleeveMinVolumeMl: 1,
    reservoirSleeveMaxVolumeMl: chamber === "LA" ? 35 : 42,
    reservoirQPressureFloorGuard: 1,
    reservoirSleeveMinPressureGuard: 1,
    reservoirSleeveMinPressureGuardWidthMl: 4,
    reservoirTauFill: 0.10,
    reservoirTauRecoilIVR: 0.035,
    reservoirValveThreshold: 0.15,
  };
  if (diagnosticVariantId === "a1-reservoir-off") {
    return {
      ...params,
      reservoirBranchGain: 0,
      reservoirStrokeMl: 0,
    };
  }
  if (diagnosticVariantId === "a1-recoil-slower") {
    return {
      ...params,
      reservoirTauRecoilIVR: 0.07,
    };
  }
  if (diagnosticVariantId === "a1-valve-threshold-higher") {
    return {
      ...params,
      reservoirValveThreshold: 0.30,
    };
  }
  return params;
}

function refinedReservoirBoosterAtrialParams(
  base: ActiveChamberParams,
  chamber: AtrialChamber,
): ActiveChamberParams {
  const params = reservoirBoosterAtrialParams(base, chamber, "none");
  return {
    ...params,
    reservoirBranchGain: chamber === "LA" ? 0.72 : 0.70,
    reservoirStrokeMl: chamber === "LA" ? 8 : 10,
    reservoirSleeveVuMl: chamber === "LA" ? 10 : 13,
    reservoirSleeveCompliance: chamber === "LA" ? 4.5 : 5.25,
    reservoirSleeveMaxVolumeMl: chamber === "LA" ? 30 : 36,
    reservoirQPressureFloorGuard: 1,
    reservoirSleeveMinPressureGuard: 1,
    reservoirTauFill: chamber === "LA" ? 0.135 : 0.150,
    reservoirTauRecoilIVR: chamber === "LA" ? 0.070 : 0.080,
    reservoirValveThreshold: 0.28,
  };
}

function elastanceParamsFor(chamber: AtrialChamber) {
  return chamber === "LA"
    ? { V0: 5, alpha: 0.05, beta: 0.4, Ees: 0.25, chamber }
    : { V0: 5, alpha: 0.05, beta: 0.35, Ees: 0.22, chamber };
}

function elastancePassivePressureMmHg(
  volumeMl: number,
  ep: ReturnType<typeof elastanceParamsFor>,
): number {
  const vEff = Math.max(volumeMl - ep.V0, 0);
  return ep.beta * (Math.exp(Math.max(-20, Math.min(20, ep.alpha * vEff))) - 1);
}

function runIsolatedProtocol(
  candidateId: AtrialBridgeCandidateId,
  chamber: AtrialChamber,
): AtrialBridgeIsolatedRun {
  const runtime = createAtrialBridgeRuntime(candidateId, chamber);
  const beatSec = 60 / 75;
  const totalBeats = ISOLATED_WARMUP_BEATS + ISOLATED_MEASURE_BEATS;
  let internal = runtime.initialInternal();
  const samples: SyntheticAtrialSample[] = [];

  for (let step = 0; step <= Math.round(totalBeats * beatSec / DT_SEC); step++) {
    const t = step * DT_SEC;
    const phi = t / beatSec;
    const ctx = syntheticAtrialCtx(chamber, phi);
    const volumeMl = syntheticAtrialVolumeMl(chamber, phi);
    const pressureMmHg = runtime.pressure(volumeMl, internal, ctx);
    const passivePressureMmHg = runtime.passivePressure(volumeMl, ctx);
    if (phi >= ISOLATED_WARMUP_BEATS) {
      samples.push({
        t,
        phi,
        chamber,
        volumeMl,
        pressureMmHg,
        passivePressureMmHg,
      });
    }
    const d = runtime.internalDerivatives(volumeMl, internal, ctx);
    internal = integrateInternal(internal, d, DT_SEC);
  }

  const metrics = loopMetrics(samples);
  return {
    protocolId: chamber === "LA" ? "isolated-la-v1" : "isolated-ra-v1",
    candidateId,
    chamber,
    finite: samples.every((sample) =>
      Number.isFinite(sample.volumeMl)
      && Number.isFinite(sample.pressureMmHg)
      && Number.isFinite(sample.passivePressureMmHg)
    ),
    metrics: candidateId === "atrial-elastance-negative-control-v0"
      ? { ...metrics, boosterPressureFraction: 0 }
      : metrics,
  };
}

function runClosedLoopSmoke(
  candidateId: AtrialBridgeCandidateId,
  point: AtrialBridgeClosedLoopPointSpec,
): AtrialBridgeClosedLoopRun {
  const params: Partial<CoreRuntimeParams> = {
    ...defaultParams(),
    HR: point.HR,
  };
  const core = new ModelCore(params, {
    activeSourceProviders: createAtrialBridgeProviders(candidateId),
  });
  core.initializeVenousPressuresForTargetTBV(point.targetTBVMl);
  const settleStatus = core.settleToSteady(SETTLE_POLICY, DT_SEC, SAMPLE_HZ);
  const health = core.health();
  const clamp = core.debugClampDiagnostics();
  if (!settleStatus.settled || settleStatus.actualSeconds == null) {
    return {
      protocolId: "closed-loop-smoke-v1",
      pointId: point.id,
      candidateId,
      targetTBVMl: point.targetTBVMl,
      HR: point.HR,
      settled: false,
      settleReason: settleStatus.reason,
      settleActualSeconds: settleStatus.actualSeconds ?? null,
      settleBeats: settleStatus.beats,
      periodBeats: settleStatus.periodBeats,
      adjacentDelta: round(settleStatus.adjacentDelta),
      periodDelta: round(settleStatus.periodDelta),
      healthStatus: health.status,
      healthMessages: health.messages,
      projectorQuiet: false,
      forwardCO_L: null,
      forwardCO_R: null,
      LAPMean: null,
      RAPMean: null,
      LA: null,
      RA: null,
      clampHits: closedLoopClampMetrics(clamp),
    };
  }

  const measured = measureSteady(core, settleStatus as typeof settleStatus & { actualSeconds: number }, {
    dt: DT_SEC,
    sampleHz: SAMPLE_HZ,
    measureBeats: CLOSED_LOOP_MEASURE_BEATS,
    requireProjectorQuiet: false,
  });
  const measuredClamp = core.debugClampDiagnostics();
  return {
    protocolId: "closed-loop-smoke-v1",
    pointId: point.id,
    candidateId,
    targetTBVMl: point.targetTBVMl,
    HR: point.HR,
    settled: true,
    settleReason: settleStatus.reason,
    settleActualSeconds: round(settleStatus.actualSeconds),
    settleBeats: settleStatus.beats,
    periodBeats: settleStatus.periodBeats,
    adjacentDelta: round(settleStatus.adjacentDelta),
    periodDelta: round(settleStatus.periodDelta),
    healthStatus: measured.health.status,
    healthMessages: measured.health.messages,
    projectorQuiet: measured.projectorQuiet,
    forwardCO_L: round(measured.forwardCO_L),
    forwardCO_R: round(measured.forwardCO_R),
    LAPMean: round(measured.metrics.LAPMean),
    RAPMean: round(measured.metrics.RAPMean),
    LA: loopMetrics(fromSimSamples(measured.samples, "LA")),
    RA: loopMetrics(fromSimSamples(measured.samples, "RA")),
    clampHits: closedLoopClampMetrics(measuredClamp, measured.samples),
  };
}

type SyntheticAtrialSample = {
  readonly t: number;
  readonly phi: number;
  readonly chamber: AtrialChamber;
  readonly volumeMl: number;
  readonly pressureMmHg: number;
  readonly passivePressureMmHg: number;
};

function syntheticAtrialCtx(chamber: AtrialChamber, phi: number): ChamberCtx {
  const theta = frac(phi);
  return {
    HR: 75,
    contractility: 1,
    relaxation: 1,
    phi,
    chamber,
    avDelaySec: 0.16,
    atrialElectromechanicalDelaySec: 0,
    ventricularElectromechanicalDelaySec: 0.05,
    tmaxScale: 1,
    geomScale: 1,
    caReleaseScale: 1,
    pairedVentricleVolumeMl: chamber === "LA" ? 95 : 110,
    pairedVentricleShortening01: systolicGate(theta),
    pairedVentricleShorteningVelocity01PerSec: 0,
    inletValveOpen01: diastolicInletGate(theta),
    outletValveOpen01: systolicGate(theta),
    side: chamber === "RA" ? "right" : "left",
    lvVolumeMl: 95,
    lvShortening01: systolicGate(theta),
    mvOpen01: chamber === "LA" ? diastolicInletGate(theta) : 0,
    aovOpen01: chamber === "LA" ? systolicGate(theta) : 0,
  };
}

function syntheticAtrialVolumeMl(chamber: AtrialChamber, phi: number): number {
  const theta = frac(phi);
  const mean = chamber === "LA" ? 45 : 52;
  const reservoir = chamber === "LA" ? 9 : 11;
  const booster = chamber === "LA" ? 5 : 6;
  return mean
    + reservoir * Math.sin(2 * Math.PI * (theta - 0.18))
    - booster * raisedCosineWindow(theta, 0.82, 0.98);
}

function integrateInternal(
  internal: ChamberInternal,
  d: ChamberInternalDerivatives,
  dt: number,
): ChamberInternal {
  return {
    c: finite(internal.c + dt * d.cDot),
    a: clamp01(finite(internal.a + dt * d.aDot)),
    r: Math.max(0, finite((internal.r ?? 0) + dt * d.rDot)),
    tensionPa: Math.max(0, finite((internal.tensionPa ?? 0) + dt * (d.tensionPaDot ?? 0))),
    lambdaAct: finite((internal.lambdaAct ?? 1) + dt * (d.lambdaActDot ?? 0)),
  };
}

function fromSimSamples(samples: readonly SimSample[], chamber: AtrialChamber): SyntheticAtrialSample[] {
  return samples.map((sample) => ({
    t: sample.t,
    phi: sample.phi,
    chamber,
    volumeMl: chamber === "LA" ? sample.VLA : sample.VRA,
    pressureMmHg: chamber === "LA" ? sample.LAP : sample.RAP,
    passivePressureMmHg: Number.NaN,
  }));
}

function loopMetrics(samples: readonly SyntheticAtrialSample[]): AtrialBridgeLoopMetrics {
  const pressures = samples.map((sample) => sample.pressureMmHg);
  const volumes = samples.map((sample) => sample.volumeMl);
  const passives = samples.map((sample) => sample.passivePressureMmHg);
  const rough240 = pvLoopRoughness(downsample(samples, 240));
  const rough480 = pvLoopRoughness(downsample(samples, 480));
  const aArea = phaseLoopArea(samples, 0.75, 1.0) + phaseLoopArea(samples, 0.0, 0.15);
  const vArea = phaseLoopArea(samples, 0.20, 0.75);
  return {
    pvLoopRoughness240: round(rough240),
    pvLoopRoughness480: round(rough480),
    roughnessSamplingRelativeDelta: round(relativeDelta(rough240, rough480)),
    pressureHighFrequencyEnergy: round(highFrequencyEnergy(pressures)),
    dPdtSpikeCount: dPdtSpikeCount(samples),
    aLoopAreaProxy: round(Math.abs(aArea)),
    vLoopAreaProxy: round(Math.abs(vArea)),
    aOverVLoopRatio: round(Math.abs(aArea) / Math.max(Math.abs(vArea), 1e-9)),
    boosterPressureFraction: round(boosterFraction(pressures, passives)),
    selfIntersections: countSelfIntersections(volumes, pressures),
    volumeMinMl: round(Math.min(...volumes)),
    volumeMaxMl: round(Math.max(...volumes)),
    pressureMeanMmHg: round(mean(pressures)),
    pressureMinMmHg: round(Math.min(...pressures)),
    pressureMaxMmHg: round(Math.max(...pressures)),
    beatRepeatabilityDelta: round(beatRepeatabilityDelta(samples)),
  };
}

function downsample(samples: readonly SyntheticAtrialSample[], targetHz: number): readonly SyntheticAtrialSample[] {
  if (samples.length <= 2) return samples;
  const duration = samples.at(-1)!.t - samples[0].t;
  const sourceHz = samples.length / Math.max(duration, 1e-9);
  const stride = Math.max(1, Math.round(sourceHz / targetHz));
  return samples.filter((_sample, index) => index % stride === 0);
}

function pvLoopRoughness(samples: readonly SyntheticAtrialSample[]): number {
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
    const dv1 = v1 - v0;
    const dv2 = v2 - v1;
    const dp1 = p1 - p0;
    const dp2 = p2 - p1;
    const s1 = dp1 / Math.max(Math.abs(dv1), 1e-6);
    const s2 = dp2 / Math.max(Math.abs(dv2), 1e-6);
    curvature += Math.abs(s2 - s1);
    slope += Math.abs(s1) + Math.abs(s2);
  }
  return curvature / Math.max(slope, 1e-9);
}

function highFrequencyEnergy(values: readonly number[]): number {
  if (values.length < 4) return 0;
  let high = 0;
  let total = 0;
  for (let i = 2; i < values.length; i++) {
    const first = values[i] - values[i - 1];
    const prevFirst = values[i - 1] - values[i - 2];
    high += (first - prevFirst) ** 2;
    total += first ** 2 + prevFirst ** 2;
  }
  return high / Math.max(total, 1e-9);
}

function dPdtSpikeCount(samples: readonly SyntheticAtrialSample[]): number {
  if (samples.length < 4) return 0;
  const dpdt: number[] = [];
  for (let i = 1; i < samples.length; i++) {
    const dt = samples[i].t - samples[i - 1].t;
    if (dt > 0) dpdt.push((samples[i].pressureMmHg - samples[i - 1].pressureMmHg) / dt);
  }
  const abs = dpdt.map(Math.abs);
  const threshold = median(abs) + 6 * mad(abs);
  return abs.filter((value) => value > Math.max(threshold, 20)).length;
}

function phaseLoopArea(samples: readonly SyntheticAtrialSample[], lo: number, hi: number): number {
  let area = 0;
  for (let i = 1; i < samples.length; i++) {
    const theta = frac(samples[i].phi);
    if (theta < lo || theta >= hi) continue;
    area += 0.5 * (
      samples[i - 1].volumeMl * samples[i].pressureMmHg
      - samples[i].volumeMl * samples[i - 1].pressureMmHg
    );
  }
  return area;
}

function boosterFraction(pressures: readonly number[], passives: readonly number[]): number {
  if (!passives.every(Number.isFinite)) return 0;
  const booster = pressures.map((pressure, index) => Math.max(0, pressure - passives[index]));
  return Math.max(...booster) / Math.max(1, Math.max(...pressures.map((value) => Math.abs(value))));
}

function beatRepeatabilityDelta(samples: readonly SyntheticAtrialSample[]): number {
  const lastBeat = Math.floor(samples.at(-1)?.phi ?? 0);
  const a = samples.filter((sample) => Math.floor(sample.phi) === lastBeat - 1);
  const b = samples.filter((sample) => Math.floor(sample.phi) === lastBeat);
  if (a.length < 8 || b.length < 8) return Number.NaN;
  return Math.max(
    relativeDelta(mean(a.map((sample) => sample.pressureMmHg)), mean(b.map((sample) => sample.pressureMmHg))),
    relativeDelta(pvLoopRoughness(a), pvLoopRoughness(b)),
  );
}

function closedLoopClampMetrics(
  clamp: ReturnType<ModelCore["debugClampDiagnostics"]>,
  samples: readonly SimSample[] = [],
): AtrialBridgeClosedLoopRun["clampHits"] {
  const mvHits = samples.filter((sample) => (sample.MV_qDotClampHit01 ?? 0) > 0).length;
  const tvHits = samples.filter((sample) => (sample.TV_qDotClampHit01 ?? 0) > 0).length;
  return {
    totalClampHits: clamp.totalClampHits,
    qDotClampHitFraction: round((mvHits + tvHits) / Math.max(samples.length * 2, 1)),
    valveDiodeClampHits: {
      MV: clamp.valveDiodeClampHits.MV ?? 0,
      TV: clamp.valveDiodeClampHits.TV ?? 0,
    },
  };
}

function summarizeCandidate(
  candidateId: AtrialBridgeCandidateId,
  isolatedRuns: readonly AtrialBridgeIsolatedRun[],
  closedLoopRuns: readonly AtrialBridgeClosedLoopRun[],
): AtrialBridgeCandidateSummary {
  const isolated = isolatedRuns.filter((run) => run.candidateId === candidateId);
  const closed = closedLoopRuns.filter((run) => run.candidateId === candidateId);
  const a0Closed = closedLoopRuns.filter((run) => run.candidateId === "legacy-atrial-active-bridge-v0");
  const a0Isolated = isolatedRuns.filter((run) => run.candidateId === "legacy-atrial-active-bridge-v0");
  const roughnessScore = mean(isolated.flatMap((run) => [
    run.metrics.pvLoopRoughness240,
    run.metrics.pvLoopRoughness480,
  ]));
  const highFrequencyEnergyScore = mean(isolated.map((run) => run.metrics.pressureHighFrequencyEnergy));
  const boosterPreserved = candidateId === "atrial-elastance-negative-control-v0"
    ? false
    : isolated.every((run) => run.metrics.boosterPressureFraction > 0.05 || run.metrics.aLoopAreaProxy > 0.25);
  const qDotContaminationNoWorseThanA0 = candidateId === "legacy-atrial-active-bridge-v0"
    ? true
    : candidateId === "atrial-elastance-negative-control-v0"
      ? null
      : closed.every((run) => {
        const comparator = a0Closed.find((a0) => a0.pointId === run.pointId);
        if (!comparator) return false;
        return run.clampHits.qDotClampHitFraction <= comparator.clampHits.qDotClampHitFraction + 0.001;
      });
  const valveDiodeContaminationNoWorseThanA0 = candidateId === "legacy-atrial-active-bridge-v0"
    ? true
    : candidateId === "atrial-elastance-negative-control-v0"
      ? null
      : closed.every((run) => {
        const comparator = a0Closed.find((a0) => a0.pointId === run.pointId);
        if (!comparator) return false;
        return valveDiodeHitTotal(run) <= valveDiodeHitTotal(comparator);
      });
  const contaminationNoWorseThanA0 = qDotContaminationNoWorseThanA0 == null || valveDiodeContaminationNoWorseThanA0 == null
    ? null
    : qDotContaminationNoWorseThanA0 && valveDiodeContaminationNoWorseThanA0;
  const mainPointRuns = closed.filter((run) =>
    (CLOSED_LOOP_MAIN_POINT_IDS as readonly string[]).includes(run.pointId)
  );
  const repeatabilityOkCount = mainPointRuns.filter((run) => closedLoopRepeatabilityOk(run)).length;
  const repeatabilityAllSettledMainPointsOk =
    repeatabilityOkCount === mainPointRuns.length && mainPointRuns.length === CLOSED_LOOP_MAIN_POINT_IDS.length;
  const roughnessSamplingInvariantVsA0 = candidateId === "legacy-atrial-active-bridge-v0"
    ? true
    : candidateId === "atrial-elastance-negative-control-v0"
      ? null
      : isolated.every((run) => {
        const comparator = a0Isolated.find((a0) => a0.protocolId === run.protocolId);
        if (!comparator) return false;
        const improves240 = run.metrics.pvLoopRoughness240 <= comparator.metrics.pvLoopRoughness240;
        const improves480 = run.metrics.pvLoopRoughness480 <= comparator.metrics.pvLoopRoughness480;
        return improves240 === improves480;
      });
  return {
    candidateId,
    role: candidateId === "atrial-elastance-negative-control-v0"
      ? "negative-control"
      : candidateId === "legacy-atrial-active-bridge-v0"
        ? "quarantined-comparator"
        : "preferred-new-bridge-candidate",
    isolatedFinite: isolated.every((run) => run.finite),
    closedLoopSettledCount: closed.filter((run) => run.settled).length,
    closedLoopHealthOkCount: closed.filter((run) => run.healthStatus === "ok").length,
    roughnessScore: round(roughnessScore),
    highFrequencyEnergyScore: round(highFrequencyEnergyScore),
    boosterPreserved,
    roughnessSamplingInvariantVsA0,
    qDotContaminationNoWorseThanA0,
    valveDiodeContaminationNoWorseThanA0,
    contaminationNoWorseThanA0,
    repeatabilityOkCount,
    repeatabilityAllSettledMainPointsOk,
    selectableByScript:
      candidateId === "atrial-reservoir-booster-bridge-v1"
      && isolated.every((run) => run.finite)
	      && closed.every((run) => run.settled && run.healthStatus === "ok" && run.projectorQuiet)
	      && boosterPreserved
	      && contaminationNoWorseThanA0 === true
	      && repeatabilityAllSettledMainPointsOk
	      && roughnessSamplingInvariantVsA0 === true,
  };
}

function buildRecommendation(
  summaries: readonly AtrialBridgeCandidateSummary[],
  closedLoopRuns: readonly AtrialBridgeClosedLoopRun[] = [],
): AtrialBridgeShootoutEvidence["recommendation"] {
  const a1 = summaries.find((summary) => summary.candidateId === "atrial-reservoir-booster-bridge-v1");
  const commonUnsettledPointIds = CLOSED_LOOP_POINTS
    .map((point) => point.id)
    .filter((pointId) =>
      CANDIDATES.every((candidateId) =>
        closedLoopRuns.some((run) =>
          run.candidateId === candidateId && run.pointId === pointId && !run.settled
        )
      )
    );
  const recommended = commonUnsettledPointIds.length === 0 && a1?.selectableByScript
    ? a1.candidateId
    : null;
  return {
    selectedCandidateId: null,
    recommendedCandidateId: recommended,
    status: "recommendation-only-owner-selection-still-required",
    rationale: [
      "E0/A0/A1 were measured under the same synthetic isolated protocols and the same closed-loop smoke points.",
      "A1 can be recommended only if it preserves booster/A-loop structure, is no worse than A0 on qDot and valve-event contamination, passes atrial loop repeatability, and has sampling-invariant roughness evidence.",
      "A0 remains a quarantined fallback, not a production backward-compatibility path.",
      commonUnsettledPointIds.length > 0
        ? `No candidate is recommended yet because all candidates failed to settle at: ${commonUnsettledPointIds.join(", ")}.`
        : "No common unsettled smoke point blocked the recommendation rule.",
      a1?.valveDiodeContaminationNoWorseThanA0 === false
        ? "A1 currently worsens valve diode hit counts versus A0 in at least one smoke point."
        : "A1 did not worsen valve diode hit counts versus A0.",
      a1?.repeatabilityAllSettledMainPointsOk === false
        ? "A1 does not yet pass the atrial loop repeatability gate on all settled main smoke points."
        : "A1 passes the atrial loop repeatability gate on settled main smoke points.",
      a1?.roughnessSamplingInvariantVsA0 === false
        ? "A1 roughness ordering versus A0 is not sampling-invariant in the isolated protocols."
        : "A1 roughness ordering versus A0 is sampling-invariant in the isolated protocols.",
    ],
    blockers: [
      "owner selection remains explicit in data/myocardium/decisions/atrial-bridge-decision21-phase6-selection-v1.json",
      "oracle-staged introduction is still required before Phase 6 runtime wiring",
      "atrial Land/RDQ and AF physiology remain future research claims, not Phase 5.5 outcomes",
      "A1 valve-event contamination, repeatability, and sampling-invariance gaps must be resolved or explicitly bounded before A1 selection",
    ],
  };
}

function valveDiodeHitTotal(run: AtrialBridgeClosedLoopRun): number {
  return (run.clampHits.valveDiodeClampHits.MV ?? 0) + (run.clampHits.valveDiodeClampHits.TV ?? 0);
}

function closedLoopRepeatabilityOk(run: AtrialBridgeClosedLoopRun): boolean {
  if (!run.settled || run.healthStatus !== "ok" || !run.projectorQuiet || !run.LA || !run.RA) return false;
  return repeatabilityValueOk(run.LA.beatRepeatabilityDelta)
    && repeatabilityValueOk(run.RA.beatRepeatabilityDelta);
}

function repeatabilityValueOk(value: number): boolean {
  return Number.isFinite(value) && value <= ATRIAL_LOOP_REPEATABILITY_THRESHOLD;
}

function systolicGate(theta: number): number {
  return raisedCosineWindow(theta, 0.05, 0.40);
}

function diastolicInletGate(theta: number): number {
  return Math.max(raisedCosineWindow(theta, 0.45, 0.78), raisedCosineWindow(theta, 0.82, 0.98));
}

function raisedCosineWindow(theta: number, start: number, end: number): number {
  const t = frac(theta);
  if (start <= end) {
    if (t < start || t > end) return 0;
    return 0.5 * (1 - Math.cos(2 * Math.PI * (t - start) / Math.max(end - start, 1e-9)));
  }
  if (t >= start) return raisedCosineWindow(t, start, 1);
  return raisedCosineWindow(t, 0, end);
}

function countSelfIntersections(xs: readonly number[], ys: readonly number[]): number {
  let count = 0;
  for (let i = 0; i < xs.length - 1; i++) {
    for (let j = i + 2; j < xs.length - 1; j++) {
      if (i === 0 && j === xs.length - 2) continue;
      if (segmentsIntersect(xs[i], ys[i], xs[i + 1], ys[i + 1], xs[j], ys[j], xs[j + 1], ys[j + 1])) {
        count++;
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
  const o1 = orient(ax, ay, bx, by, cx, cy);
  const o2 = orient(ax, ay, bx, by, dx, dy);
  const o3 = orient(cx, cy, dx, dy, ax, ay);
  const o4 = orient(cx, cy, dx, dy, bx, by);
  return o1 * o2 < 0 && o3 * o4 < 0;
}

function orient(ax: number, ay: number, bx: number, by: number, cx: number, cy: number): number {
  return (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
}

function median(values: readonly number[]): number {
  const sorted = [...values.filter(Number.isFinite)].sort((a, b) => a - b);
  if (sorted.length === 0) return 0;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? 0.5 * (sorted[mid - 1] + sorted[mid]) : sorted[mid];
}

function mad(values: readonly number[]): number {
  const m = median(values);
  return median(values.map((value) => Math.abs(value - m)));
}

function mean(values: readonly number[]): number {
  const finiteValues = values.filter(Number.isFinite);
  return finiteValues.length > 0
    ? finiteValues.reduce((sum, value) => sum + value, 0) / finiteValues.length
    : Number.NaN;
}

function relativeDelta(a: number, b: number): number {
  if (!Number.isFinite(a) || !Number.isFinite(b)) return Number.POSITIVE_INFINITY;
  return Math.abs(a - b) / Math.max(1, Math.abs(a), Math.abs(b));
}

function frac(value: number): number {
  return value - Math.floor(value);
}

function finite(value: number): number {
  return Number.isFinite(value) ? value : 0;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function round(value: number | null, digits = 6): number | null {
  if (value == null) return null;
  if (!Number.isFinite(value)) return value;
  const scale = 10 ** digits;
  return Math.round(value * scale) / scale;
}

function isDirectExecution(): boolean {
  const entrypoint = process.argv[1];
  if (entrypoint && import.meta.url === pathToFileURL(path.resolve(entrypoint)).href) return true;
  const normalizedScriptPath =
    path.normalize("tools/myocardium/buildAtrialBridgeShootout.ts");
  return process.argv.some((arg) => path.normalize(arg).endsWith(normalizedScriptPath));
}

if (isDirectExecution()) {
  const evidence = buildAtrialBridgeShootoutEvidence();
  if (process.argv.includes("--write")) {
    const outputPath = path.resolve(ATRIAL_BRIDGE_SHOOTOUT_RESULT_PATH);
    mkdirSync(path.dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, `${JSON.stringify(evidence, null, 2)}\n`);
  } else {
    console.log(JSON.stringify(evidence, null, 2));
  }
}
