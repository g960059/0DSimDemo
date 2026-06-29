import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import phase5AJArtifact from "@/data/myocardium/protocols/user0-lv-land-default-flip-rfc-phase5aj-result-v1.json";
import { defaultParams, ModelCore } from "@/engine/ModelCore";
import {
  MODELCORE_RUNTIME_LEGACY_ACTIVE_STRESS_ROLLBACK_MODE,
  MODELCORE_RUNTIME_LV_LAND_DEFAULT_MODE,
  MODELCORE_RUNTIME_LV_LAND_SOURCE_PROVIDER_ID,
  type ModelCoreRuntimeActiveSourceMode,
  resolveModelCoreRuntimeActiveSource,
} from "@/engine/myocardium/runtimeActiveSource";
import type { CoreRuntimeParams, SimMetrics, SimulationHealthStatus } from "@/engine/protocol";
import { PREVIEW_SETTLE_POLICY, type SettleStatus } from "@/engine/settling";

export const USER0_LV_LAND_DEFAULT_FLIP_PHASE5AK_ID =
  "user0-lv-land-default-flip-phase5ak-result-v1";

export const USER0_LV_LAND_DEFAULT_FLIP_PHASE5AK_RESULT_PATH =
  "data/myocardium/protocols/user0-lv-land-default-flip-phase5ak-result-v1.json";

const VERIFIER_SCRIPT = "verify:myocardium-user0-lv-land-default-flip" as const;
const DT = 0.001;
const SAMPLE_HZ = 120;
const SETTLE_POLICY = { ...PREVIEW_SETTLE_POLICY, capSeconds: 45 };

const SMOKE_POINTS = [
  { id: "normal-hr75-tbv5600", params: { HR: 75 }, targetTBV: 5600 },
  { id: "normal-hr90-tbv5600", params: { HR: 90 }, targetTBV: 5600 },
  { id: "preload-low-hr75-tbv4350", params: { HR: 75 }, targetTBV: 4350 },
  { id: "preload-high-hr75-tbv6600", params: { HR: 75 }, targetTBV: 6600 },
] as const;

export type User0LvLandDefaultFlipPhase5AKSmokePoint = {
  readonly pointId: string;
  readonly mode: ModelCoreRuntimeActiveSourceMode;
  readonly targetTBV: number;
  readonly HR: number;
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
  readonly metrics: Pick<SimMetrics, "CO_L" | "CO_R" | "SV_L" | "AoPMean" | "LAPMean" | "RAPMean" | "LVEDPApprox" | "EF_LApprox">;
  readonly landInstrumentation: {
    readonly sourceActiveStressPa: number;
    readonly commitProviderStateAfterStep: number;
    readonly landSolveOkCount: number;
    readonly landSolveFailureCount: number;
    readonly maxSolverResidualNorm: number;
    readonly sourcePathFiniteHealthAllSamples: boolean;
    readonly commitPathFiniteHealthAllSamples: boolean;
  } | null;
  readonly providerStateSidecar: {
    readonly hasLV: boolean;
    readonly sourceProviderId: string | null;
    readonly stateVersion: number | null;
  };
};

export type User0LvLandDefaultFlipPhase5AKEvidence = {
  readonly schemaVersion: 1;
  readonly id: typeof USER0_LV_LAND_DEFAULT_FLIP_PHASE5AK_ID;
  readonly phase: "Phase 5AK";
  readonly claimBoundary: "user0-staged-lv-land-runtime-default-implemented";
  readonly verifierScript: typeof VERIFIER_SCRIPT;
  readonly ownerDecision: {
    readonly sourceArtifactId: typeof phase5AJArtifact.id;
    readonly acceptedOption: "GO";
    readonly acceptedAt: "2026-06-29";
  };
  readonly implementation: {
    readonly runtimeDefaultMode: typeof MODELCORE_RUNTIME_LV_LAND_DEFAULT_MODE;
    readonly rollbackMode: typeof MODELCORE_RUNTIME_LEGACY_ACTIVE_STRESS_ROLLBACK_MODE;
    readonly sourceProviderScope: "LV-only";
    readonly sourceProviderId: typeof MODELCORE_RUNTIME_LV_LAND_SOURCE_PROVIDER_ID;
    readonly legacyActiveStressRole: "frozen-reference-rollback-debug";
    readonly constructorDefaultPreservedForResearchReference: true;
    readonly stateSchemaMigration: "not-changed";
    readonly providerStateRuntimeSidecar: "transition-steady-protocol-only";
    readonly runtimeContractilityControl: "existing-tmax-contractility-knob-multiplies-land-calcium-input-normalized-to-default";
    readonly regressionHarnessDefaultMode: typeof MODELCORE_RUNTIME_LEGACY_ACTIVE_STRESS_ROLLBACK_MODE;
    readonly regressionHarnessLandMode: "explicit-runtimeActiveSourceMode-only";
    readonly allChamberReplacementTarget: "future-lane-not-in-this-pr";
  };
  readonly wiredRuntimeSurfaces: readonly string[];
  readonly smokeMatrix: readonly User0LvLandDefaultFlipPhase5AKSmokePoint[];
  readonly summary: {
    readonly defaultSmokeCount: number;
    readonly defaultSettledCount: number;
    readonly defaultHealthOkCount: number;
    readonly defaultLandSolveFailureCount: number;
    readonly defaultProviderCallPoints: number;
    readonly rollbackSmokeCount: number;
    readonly rollbackProviderFreeCount: number;
    readonly rollbackHealthNonFailedCount: number;
  };
  readonly boundary: {
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
  };
  readonly doesNotUnlock: readonly string[];
  readonly normalizedSha256: string;
};

export function buildUser0LvLandDefaultFlipPhase5AKEvidence():
User0LvLandDefaultFlipPhase5AKEvidence {
  const smokeMatrix = SMOKE_POINTS.flatMap((point) => [
    runSmokePoint(MODELCORE_RUNTIME_LV_LAND_DEFAULT_MODE, point),
    runSmokePoint(MODELCORE_RUNTIME_LEGACY_ACTIVE_STRESS_ROLLBACK_MODE, point),
  ]);
  const defaultRuns = smokeMatrix.filter((run) => run.mode === MODELCORE_RUNTIME_LV_LAND_DEFAULT_MODE);
  const rollbackRuns = smokeMatrix.filter((run) => run.mode === MODELCORE_RUNTIME_LEGACY_ACTIVE_STRESS_ROLLBACK_MODE);
  const evidenceWithoutHash: Omit<User0LvLandDefaultFlipPhase5AKEvidence, "normalizedSha256"> = {
    schemaVersion: 1,
    id: USER0_LV_LAND_DEFAULT_FLIP_PHASE5AK_ID,
    phase: "Phase 5AK",
    claimBoundary: "user0-staged-lv-land-runtime-default-implemented",
    verifierScript: VERIFIER_SCRIPT,
    ownerDecision: {
      sourceArtifactId: phase5AJArtifact.id,
      acceptedOption: "GO",
      acceptedAt: "2026-06-29",
    },
    implementation: {
      runtimeDefaultMode: MODELCORE_RUNTIME_LV_LAND_DEFAULT_MODE,
      rollbackMode: MODELCORE_RUNTIME_LEGACY_ACTIVE_STRESS_ROLLBACK_MODE,
      sourceProviderScope: "LV-only",
      sourceProviderId: MODELCORE_RUNTIME_LV_LAND_SOURCE_PROVIDER_ID,
      legacyActiveStressRole: "frozen-reference-rollback-debug",
      constructorDefaultPreservedForResearchReference: true,
      stateSchemaMigration: "not-changed",
      providerStateRuntimeSidecar: "transition-steady-protocol-only",
      runtimeContractilityControl: "existing-tmax-contractility-knob-multiplies-land-calcium-input-normalized-to-default",
      regressionHarnessDefaultMode: MODELCORE_RUNTIME_LEGACY_ACTIVE_STRESS_ROLLBACK_MODE,
      regressionHarnessLandMode: "explicit-runtimeActiveSourceMode-only",
      allChamberReplacementTarget: "future-lane-not-in-this-pr",
    },
    wiredRuntimeSurfaces: [
      "engine/myocardium/runtimeActiveSource.ts",
      "engine/harness.ts (explicit runtimeActiveSourceMode support; default frozen legacy regression reference)",
      "engine/steadyJob.ts (explicit runtimeActiveSourceMode support; default frozen legacy regression reference)",
      "engine/previewController.ts",
      "engine/previewWorker.ts",
      "engine/transitionSteadyProtocol.ts",
      "engine/transitionSteadyWorker.ts",
      "engine/guytonStarlingWorkerCore.ts",
      "components/Charts.tsx (Guyton/Starling worker request mode propagation)",
    ],
    smokeMatrix,
    summary: {
      defaultSmokeCount: defaultRuns.length,
      defaultSettledCount: defaultRuns.filter((run) => run.settle.settled).length,
      defaultHealthOkCount: defaultRuns.filter((run) => run.health.status === "ok").length,
      defaultLandSolveFailureCount: sum(defaultRuns, (run) => run.landInstrumentation?.landSolveFailureCount ?? 0),
      defaultProviderCallPoints: defaultRuns.filter((run) => (run.landInstrumentation?.sourceActiveStressPa ?? 0) > 0).length,
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
): User0LvLandDefaultFlipPhase5AKSmokePoint {
  const resolved = resolveModelCoreRuntimeActiveSource({ mode });
  const params: Partial<CoreRuntimeParams> = { ...defaultParams(), ...point.params };
  const core = new ModelCore(params, resolved.experimentalOptions);
  core.initializeVenousPressuresForTargetTBV(point.targetTBV);
  const settle = core.settleToSteady(SETTLE_POLICY, DT, SAMPLE_HZ);
  const metrics = core.metrics();
  const health = core.health();
  const sidecar = core.packExperimentalActiveProviderRuntimeState();
  const lvSidecar = sidecar.LV;
  return {
    pointId: point.id,
    mode,
    targetTBV: point.targetTBV,
    HR: params.HR ?? defaultParams().HR,
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
      AoPMean: round6(metrics.AoPMean),
      LAPMean: round6(metrics.LAPMean),
      RAPMean: round6(metrics.RAPMean),
      LVEDPApprox: round6(metrics.LVEDPApprox),
      EF_LApprox: round6(metrics.EF_LApprox),
    },
    landInstrumentation: resolved.instrumentation
      ? {
          sourceActiveStressPa: resolved.instrumentation.sourceActiveStressPa,
          commitProviderStateAfterStep: resolved.instrumentation.commitProviderStateAfterStep,
          landSolveOkCount: resolved.instrumentation.landSolveOkCount,
          landSolveFailureCount: resolved.instrumentation.landSolveFailureCount,
          maxSolverResidualNorm: round12(resolved.instrumentation.maxSolverResidualNorm),
          sourcePathFiniteHealthAllSamples: resolved.instrumentation.sourcePathAudit.finiteHealthAllSamples,
          commitPathFiniteHealthAllSamples: resolved.instrumentation.commitPathAudit.finiteHealthAllSamples,
        }
      : null,
    providerStateSidecar: {
      hasLV: lvSidecar !== undefined,
      sourceProviderId: lvSidecar?.sourceProviderId ?? null,
      stateVersion: lvSidecar?.version ?? null,
    },
  };
}

function boundary(): User0LvLandDefaultFlipPhase5AKEvidence["boundary"] {
  return {
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
  };
}

function doesNotUnlock(): readonly string[] {
  return [
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
    "allChamberLandReplacement",
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
  const outPath = path.resolve(process.cwd(), USER0_LV_LAND_DEFAULT_FLIP_PHASE5AK_RESULT_PATH);
  mkdirSync(path.dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(buildUser0LvLandDefaultFlipPhase5AKEvidence(), null, 2)}\n`);
  console.log(`wrote ${USER0_LV_LAND_DEFAULT_FLIP_PHASE5AK_RESULT_PATH}`);
}

const isMain = process.argv[1]
  ? import.meta.url === pathToFileURL(process.argv[1]).href
  : false;

if (isMain) writeMain();
