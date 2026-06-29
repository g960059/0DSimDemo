import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import phase5AKArtifact from "@/data/myocardium/protocols/user0-lv-land-default-flip-phase5ak-result-v1.json";
import { defaultParams, ModelCore } from "@/engine/ModelCore";
import {
  MODELCORE_RUNTIME_LEGACY_ACTIVE_STRESS_ROLLBACK_MODE,
  MODELCORE_RUNTIME_LV_LAND_DEFAULT_MODE,
  MODELCORE_RUNTIME_LV_LAND_SOURCE_PROVIDER_ID,
  MODELCORE_RUNTIME_LV_RV_LAND_DEFAULT_CANDIDATE_MODE,
  MODELCORE_RUNTIME_RV_LAND_SOURCE_PROVIDER_ID,
  type ModelCoreRuntimeActiveSourceMode,
  resolveModelCoreRuntimeActiveSource,
} from "@/engine/myocardium/runtimeActiveSource";
import type { ModelCoreLand2017LvSourceProviderInstrumentation } from "@/engine/myocardium/modelCoreLand2017LvSourceProvider";
import type { CoreRuntimeParams, SimMetrics, SimulationHealthStatus } from "@/engine/protocol";
import { PREVIEW_SETTLE_POLICY, type SettleStatus } from "@/engine/settling";

export const RV_LAND_DEFAULT_CANDIDATE_PHASE5AL_ID =
  "rv-land-default-candidate-phase5al-result-v1";

export const RV_LAND_DEFAULT_CANDIDATE_PHASE5AL_RESULT_PATH =
  "data/myocardium/protocols/rv-land-default-candidate-phase5al-result-v1.json";

const DT = 0.001;
const SAMPLE_HZ = 120;
const SETTLE_POLICY = { ...PREVIEW_SETTLE_POLICY, capSeconds: 45 };

const SMOKE_POINTS = [
  { id: "normal-hr75-tbv5600", params: { HR: 75 }, targetTBV: 5600 },
  { id: "normal-hr90-tbv5600", params: { HR: 90 }, targetTBV: 5600 },
  { id: "preload-low-hr75-tbv4350", params: { HR: 75 }, targetTBV: 4350 },
  { id: "preload-high-hr75-tbv6600", params: { HR: 75 }, targetTBV: 6600 },
  { id: "rv-afterload-high-hr75-tbv5600", params: { HR: 75, pulmonaryResistance: 1.0 }, targetTBV: 5600 },
] as const;

const MODES = [
  MODELCORE_RUNTIME_LV_RV_LAND_DEFAULT_CANDIDATE_MODE,
  MODELCORE_RUNTIME_LV_LAND_DEFAULT_MODE,
  MODELCORE_RUNTIME_LEGACY_ACTIVE_STRESS_ROLLBACK_MODE,
] as const;

export type RvLandDefaultCandidatePhase5ALSmokeRun = {
  readonly pointId: string;
  readonly mode: ModelCoreRuntimeActiveSourceMode;
  readonly targetTBV: number;
  readonly HR: number;
  readonly pulmonaryResistance: number;
  readonly providerIds: Record<string, string>;
  readonly settle: {
    readonly settled: boolean;
    readonly reason: SettleStatus["reason"];
    readonly beats: number;
    readonly periodBeats: number | null;
    readonly actualSeconds: number | null;
    readonly worstSignal: string | null;
    readonly worstDelta: number | null;
  };
  readonly health: {
    readonly status: SimulationHealthStatus;
    readonly clampHitCount: number;
    readonly leftRightFlowMismatchLMin: number;
    readonly tbvDriftMl: number;
  };
  readonly metrics: Pick<
    SimMetrics,
    | "CO_L"
    | "CO_R"
    | "SV_L"
    | "SV_R"
    | "AoPMean"
    | "PAPMean"
    | "LAPMean"
    | "RAPMean"
    | "LVEDPApprox"
    | "RVEDPApprox"
    | "EF_LApprox"
    | "EF_RApprox"
  >;
  readonly landInstrumentationByChamber: {
    readonly LV: LandInstrumentationSnapshot | null;
    readonly RV: LandInstrumentationSnapshot | null;
  };
  readonly providerStateSidecar: {
    readonly hasLV: boolean;
    readonly hasRV: boolean;
    readonly lvSourceProviderId: string | null;
    readonly rvSourceProviderId: string | null;
    readonly lvStateVersion: number | null;
    readonly rvStateVersion: number | null;
  };
};

export type LandInstrumentationSnapshot = {
  readonly sourceActiveStressPa: number;
  readonly commitProviderStateAfterStep: number;
  readonly landSolveOkCount: number;
  readonly landSolveFailureCount: number;
  readonly maxSolverResidualNorm: number;
  readonly sourcePathFiniteHealthAllSamples: boolean;
  readonly commitPathFiniteHealthAllSamples: boolean;
  readonly lastFailureReason: string | null;
};

export type RvLandDefaultCandidatePhase5ALEvidence = {
  readonly schemaVersion: 1;
  readonly id: typeof RV_LAND_DEFAULT_CANDIDATE_PHASE5AL_ID;
  readonly phase: "Phase 5AL";
  readonly claimBoundary: "rv-land-default-candidate-evidence-no-runtime-flip";
  readonly upstreamPhase5AKArtifactId: typeof phase5AKArtifact.id;
  readonly implementation: {
    readonly currentRuntimeDefaultMode: typeof MODELCORE_RUNTIME_LV_LAND_DEFAULT_MODE;
    readonly candidateMode: typeof MODELCORE_RUNTIME_LV_RV_LAND_DEFAULT_CANDIDATE_MODE;
    readonly rollbackMode: typeof MODELCORE_RUNTIME_LEGACY_ACTIVE_STRESS_ROLLBACK_MODE;
    readonly currentRuntimeDefaultScope: "LV-only";
    readonly candidateScope: "LV+RV-explicit-candidate";
    readonly candidateSourceProviderIds: {
      readonly LV: typeof MODELCORE_RUNTIME_LV_LAND_SOURCE_PROVIDER_ID;
      readonly RV: typeof MODELCORE_RUNTIME_RV_LAND_SOURCE_PROVIDER_ID;
    };
    readonly runtimeDefaultChangedInThisPhase: false;
    readonly legacyActiveStressRole: "frozen-reference-rollback-debug";
    readonly stateSchemaMigration: "not-changed";
    readonly providerStateRuntimeSidecar: "transition-steady-protocol-only";
    readonly runtimeContractilityControl: "existing-tmax-contractility-knob-multiplies-land-calcium-input-normalized-to-chamber-default";
  };
  readonly smokeMatrix: readonly RvLandDefaultCandidatePhase5ALSmokeRun[];
  readonly summary: {
    readonly candidateSmokeCount: number;
    readonly candidateSettledCount: number;
    readonly candidateHealthOkCount: number;
    readonly candidateLvLandSolveFailureCount: number;
    readonly candidateRvLandSolveFailureCount: number;
    readonly candidateBothProviderCallPoints: number;
    readonly currentDefaultSmokeCount: number;
    readonly currentDefaultRvProviderFreeCount: number;
    readonly rollbackSmokeCount: number;
    readonly rollbackProviderFreeCount: number;
    readonly rollbackHealthNonFailedCount: number;
  };
  readonly boundary: {
    readonly noRuntimeDefaultFlip: true;
    readonly noLegacyActiveStressDeletion: true;
    readonly noRootZcAdoption: true;
    readonly noAtrialFigureEightGate: true;
    readonly noOfficialCaseReauthoring: true;
    readonly noOfficialCaseTuning: true;
    readonly noAcceptedPreloadTuning: true;
    readonly noAcceptedVenousToneTuning: true;
    readonly noAcceptedPassiveTuning: true;
    readonly noAcceptedGeometryTuning: true;
    readonly noAcceptedSourceCalciumRecalibration: true;
    readonly noTrefFudge: true;
    readonly noLandParameterTuning: true;
    readonly noQDotTuning: true;
    readonly noValveTuning: true;
    readonly noBoundaryRootInertanceDefault: true;
    readonly noQDotClampRemoval: true;
    readonly noOfficialMorphologyAcceptance: true;
    readonly noFinalNoAlternansAcceptance: true;
    readonly noClinicalScientificValidationClaim: true;
    readonly noAllChamberLandDefaultClaim: true;
  };
  readonly doesNotUnlock: readonly string[];
  readonly normalizedSha256: string;
};

export function buildRvLandDefaultCandidatePhase5ALEvidence():
RvLandDefaultCandidatePhase5ALEvidence {
  const smokeMatrix = SMOKE_POINTS.flatMap((point) => MODES.map((mode) => runSmokePoint(mode, point)));
  const candidateRuns = smokeMatrix.filter((run) => run.mode === MODELCORE_RUNTIME_LV_RV_LAND_DEFAULT_CANDIDATE_MODE);
  const currentDefaultRuns = smokeMatrix.filter((run) => run.mode === MODELCORE_RUNTIME_LV_LAND_DEFAULT_MODE);
  const rollbackRuns = smokeMatrix.filter((run) => run.mode === MODELCORE_RUNTIME_LEGACY_ACTIVE_STRESS_ROLLBACK_MODE);
  const evidenceWithoutHash: Omit<RvLandDefaultCandidatePhase5ALEvidence, "normalizedSha256"> = {
    schemaVersion: 1,
    id: RV_LAND_DEFAULT_CANDIDATE_PHASE5AL_ID,
    phase: "Phase 5AL",
    claimBoundary: "rv-land-default-candidate-evidence-no-runtime-flip",
    upstreamPhase5AKArtifactId: phase5AKArtifact.id,
    implementation: {
      currentRuntimeDefaultMode: MODELCORE_RUNTIME_LV_LAND_DEFAULT_MODE,
      candidateMode: MODELCORE_RUNTIME_LV_RV_LAND_DEFAULT_CANDIDATE_MODE,
      rollbackMode: MODELCORE_RUNTIME_LEGACY_ACTIVE_STRESS_ROLLBACK_MODE,
      currentRuntimeDefaultScope: "LV-only",
      candidateScope: "LV+RV-explicit-candidate",
      candidateSourceProviderIds: {
        LV: MODELCORE_RUNTIME_LV_LAND_SOURCE_PROVIDER_ID,
        RV: MODELCORE_RUNTIME_RV_LAND_SOURCE_PROVIDER_ID,
      },
      runtimeDefaultChangedInThisPhase: false,
      legacyActiveStressRole: "frozen-reference-rollback-debug",
      stateSchemaMigration: "not-changed",
      providerStateRuntimeSidecar: "transition-steady-protocol-only",
      runtimeContractilityControl:
        "existing-tmax-contractility-knob-multiplies-land-calcium-input-normalized-to-chamber-default",
    },
    smokeMatrix,
    summary: {
      candidateSmokeCount: candidateRuns.length,
      candidateSettledCount: candidateRuns.filter((run) => run.settle.settled).length,
      candidateHealthOkCount: candidateRuns.filter((run) => run.health.status === "ok").length,
      candidateLvLandSolveFailureCount:
        sum(candidateRuns, (run) => run.landInstrumentationByChamber.LV?.landSolveFailureCount ?? 0),
      candidateRvLandSolveFailureCount:
        sum(candidateRuns, (run) => run.landInstrumentationByChamber.RV?.landSolveFailureCount ?? 0),
      candidateBothProviderCallPoints: candidateRuns.filter(
        (run) =>
          (run.landInstrumentationByChamber.LV?.sourceActiveStressPa ?? 0) > 0
          && (run.landInstrumentationByChamber.RV?.sourceActiveStressPa ?? 0) > 0,
      ).length,
      currentDefaultSmokeCount: currentDefaultRuns.length,
      currentDefaultRvProviderFreeCount: currentDefaultRuns.filter((run) => run.providerIds.RV === undefined).length,
      rollbackSmokeCount: rollbackRuns.length,
      rollbackProviderFreeCount: rollbackRuns.filter((run) => Object.keys(run.providerIds).length === 0).length,
      rollbackHealthNonFailedCount: rollbackRuns.filter((run) => run.health.status !== "failed").length,
    },
    boundary: boundary(),
    doesNotUnlock: doesNotUnlock(),
  };
  return {
    ...evidenceWithoutHash,
    normalizedSha256: hashStable(evidenceWithoutHash),
  };
}

function runSmokePoint(
  mode: ModelCoreRuntimeActiveSourceMode,
  point: typeof SMOKE_POINTS[number],
): RvLandDefaultCandidatePhase5ALSmokeRun {
  const resolved = resolveModelCoreRuntimeActiveSource({ mode });
  const params: Partial<CoreRuntimeParams> = { ...defaultParams(), ...point.params };
  const core = new ModelCore(params, resolved.experimentalOptions);
  core.initializeVenousPressuresForTargetTBV(point.targetTBV);
  const settle = core.settleToSteady(SETTLE_POLICY, DT, SAMPLE_HZ);
  const metrics = core.metrics();
  const health = core.health();
  const sidecar = core.packExperimentalActiveProviderRuntimeState();
  const instrumentationByChamber = resolved.instrumentationByChamber as {
    readonly LV?: ModelCoreLand2017LvSourceProviderInstrumentation;
    readonly RV?: ModelCoreLand2017LvSourceProviderInstrumentation;
  };
  return {
    pointId: point.id,
    mode,
    targetTBV: point.targetTBV,
    HR: params.HR ?? defaultParams().HR,
    pulmonaryResistance: params.pulmonaryResistance ?? defaultParams().pulmonaryResistance,
    providerIds: core.debugExperimentalActiveSourceProviderIds(),
    settle: {
      settled: settle.settled,
      reason: settle.reason,
      beats: settle.beats,
      periodBeats: settle.periodBeats ?? null,
      actualSeconds: settle.actualSeconds ?? null,
      worstSignal: settle.worstSignal ?? null,
      worstDelta: finiteOrNull(settle.worstDelta),
    },
    health: {
      status: health.status,
      clampHitCount: health.clampHitCount,
      leftRightFlowMismatchLMin: round6(health.leftRightFlowMismatchLMin),
      tbvDriftMl: round6(health.tbvDriftMl),
    },
    metrics: {
      CO_L: round6(metrics.CO_L),
      CO_R: round6(metrics.CO_R),
      SV_L: round6(metrics.SV_L),
      SV_R: round6(metrics.SV_R),
      AoPMean: round6(metrics.AoPMean),
      PAPMean: round6(metrics.PAPMean),
      LAPMean: round6(metrics.LAPMean),
      RAPMean: round6(metrics.RAPMean),
      LVEDPApprox: round6(metrics.LVEDPApprox),
      RVEDPApprox: round6(metrics.RVEDPApprox),
      EF_LApprox: round6(metrics.EF_LApprox),
      EF_RApprox: round6(metrics.EF_RApprox),
    },
    landInstrumentationByChamber: {
      LV: snapshotInstrumentation(instrumentationByChamber.LV),
      RV: snapshotInstrumentation(instrumentationByChamber.RV),
    },
    providerStateSidecar: {
      hasLV: sidecar.LV !== undefined,
      hasRV: sidecar.RV !== undefined,
      lvSourceProviderId: sidecar.LV?.sourceProviderId ?? null,
      rvSourceProviderId: sidecar.RV?.sourceProviderId ?? null,
      lvStateVersion: sidecar.LV?.version ?? null,
      rvStateVersion: sidecar.RV?.version ?? null,
    },
  };
}

function snapshotInstrumentation(
  instrumentation: ModelCoreLand2017LvSourceProviderInstrumentation | undefined,
): LandInstrumentationSnapshot | null {
  if (!instrumentation) return null;
  return {
    sourceActiveStressPa: instrumentation.sourceActiveStressPa,
    commitProviderStateAfterStep: instrumentation.commitProviderStateAfterStep,
    landSolveOkCount: instrumentation.landSolveOkCount,
    landSolveFailureCount: instrumentation.landSolveFailureCount,
    maxSolverResidualNorm: round12(instrumentation.maxSolverResidualNorm),
    sourcePathFiniteHealthAllSamples: instrumentation.sourcePathAudit.finiteHealthAllSamples,
    commitPathFiniteHealthAllSamples: instrumentation.commitPathAudit.finiteHealthAllSamples,
    lastFailureReason: instrumentation.lastFailureReason,
  };
}

function boundary(): RvLandDefaultCandidatePhase5ALEvidence["boundary"] {
  return {
    noRuntimeDefaultFlip: true,
    noLegacyActiveStressDeletion: true,
    noRootZcAdoption: true,
    noAtrialFigureEightGate: true,
    noOfficialCaseReauthoring: true,
    noOfficialCaseTuning: true,
    noAcceptedPreloadTuning: true,
    noAcceptedVenousToneTuning: true,
    noAcceptedPassiveTuning: true,
    noAcceptedGeometryTuning: true,
    noAcceptedSourceCalciumRecalibration: true,
    noTrefFudge: true,
    noLandParameterTuning: true,
    noQDotTuning: true,
    noValveTuning: true,
    noBoundaryRootInertanceDefault: true,
    noQDotClampRemoval: true,
    noOfficialMorphologyAcceptance: true,
    noFinalNoAlternansAcceptance: true,
    noClinicalScientificValidationClaim: true,
    noAllChamberLandDefaultClaim: true,
  };
}

function doesNotUnlock(): readonly string[] {
  return [
    "runtimeDefaultFlip",
    "legacyActiveStressDeletion",
    "rootZcAdoption",
    "atrialFigureEightGate",
    "officialCaseReauthoring",
    "officialCaseTuning",
    "acceptedPreloadTuning",
    "acceptedVenousToneTuning",
    "acceptedPassiveTuning",
    "acceptedGeometryTuning",
    "acceptedSourceCalciumRecalibration",
    "TrefFudge",
    "LandParameterTuning",
    "qDotTuning",
    "valveTuning",
    "boundaryRootInertanceDefault",
    "qDotClampRemoval",
    "officialMorphologyAcceptance",
    "finalNoAlternansAcceptance",
    "clinicalScientificValidationClaim",
    "allChamberLandDefaultClaim",
  ];
}

function sum<T>(items: readonly T[], selector: (item: T) => number): number {
  return items.reduce((acc, item) => acc + selector(item), 0);
}

function finiteOrNull(value: number | null | undefined): number | null {
  return value == null || !Number.isFinite(value) ? null : round12(value);
}

function round6(value: number): number {
  return Number.isFinite(value) ? Number(value.toFixed(6)) : value;
}

function round12(value: number): number {
  return Number.isFinite(value) ? Number(value.toFixed(12)) : value;
}

function hashStable(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(sortJson(value))).digest("hex");
}

function sortJson(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortJson);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, item]) => [key, sortJson(item)]),
  );
}

function writeMain() {
  const outPath = path.resolve(process.cwd(), RV_LAND_DEFAULT_CANDIDATE_PHASE5AL_RESULT_PATH);
  mkdirSync(path.dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(buildRvLandDefaultCandidatePhase5ALEvidence(), null, 2)}\n`);
  console.log(`wrote ${RV_LAND_DEFAULT_CANDIDATE_PHASE5AL_RESULT_PATH}`);
}

const isMain = process.argv[1]
  ? import.meta.url === pathToFileURL(process.argv[1]).href
  : false;

if (isMain) writeMain();
