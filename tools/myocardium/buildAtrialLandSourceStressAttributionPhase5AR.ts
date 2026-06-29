import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { CASE_SCHEMA_VERSION, DEFAULT_SOLVER, ENGINE_VERSION, caseDocumentToSimInstances, type CaseDocument } from "@/caseDoc";
import { KNOB_MAPPING_VERSION, type ClinicalKnobs } from "@/engine/knobs";
import { measureSteady, settleToSteadyState } from "@/engine/measure";
import type { Chamber, ChamberInternal } from "@/engine/chambers";
import type { ModelCoreExperimentalActiveSourceProvider, ModelCoreExperimentalOptions } from "@/engine/ModelCore";
import {
  createModelCoreLand2017LvSourceProviderInstrumentation,
  type ModelCoreLand2017LvRangeAudit,
  type ModelCoreLand2017LvSignalAudit,
  type ModelCoreLand2017LvSourceProviderInstrumentation,
} from "@/engine/myocardium/modelCoreLand2017LvSourceProvider";
import {
  MODELCORE_RUNTIME_ALL_CHAMBER_LAND_DEFAULT_CANDIDATE_MODE,
  MODELCORE_RUNTIME_LV_RV_LAND_DEFAULT_MODE,
  resolveModelCoreRuntimeActiveSource,
  type ModelCoreRuntimeActiveSourceMode,
} from "@/engine/myocardium/runtimeActiveSource";
import { MODELCORE_RUNTIME_ROOT_ZC_SOURCED_BOUNDARY_ROOT_DEFAULT_MODE } from "@/engine/myocardium/runtimeRootZc";
import type { CoreRuntimeParams, SimMetrics, SimulationHealth } from "@/engine/protocol";

export const ATRIAL_LAND_SOURCE_STRESS_ATTRIBUTION_PHASE5AR_ID =
  "atrial-land-source-stress-attribution-phase5ar-result-v1";

export const ATRIAL_LAND_SOURCE_STRESS_ATTRIBUTION_PHASE5AR_RESULT_PATH =
  "data/myocardium/protocols/atrial-land-source-stress-attribution-phase5ar-result-v1.json";

const DT_SEC = 0.001 as const;
const SAMPLE_HZ = 1000 as const;
const MEASURE_BEATS = 3 as const;

type AtrialChamber = "LA" | "RA";
type LandChamber = "LV" | "RV" | "LA" | "RA";
type CandidateId =
  | "current-lv-rv-land-default"
  | "la-only-land-candidate"
  | "ra-only-land-candidate"
  | "all-chamber-land-candidate";

const POINTS = [
  { id: "normal-hr75", label: "normal HR75", HR: 75, targetTBVMl: 5600, preloadClass: "normal", knobs: {} },
  { id: "low-preload-hr75", label: "low preload HR75", HR: 75, targetTBVMl: 4800, preloadClass: "low-preload", knobs: {} },
  { id: "high-preload-hr75", label: "high preload HR75", HR: 75, targetTBVMl: 6200, preloadClass: "high-preload", knobs: {} },
  { id: "normal-hr90", label: "normal HR90", HR: 90, targetTBVMl: 5600, preloadClass: "normal", knobs: {} },
  { id: "low-preload-hr90", label: "low preload HR90", HR: 90, targetTBVMl: 4800, preloadClass: "low-preload", knobs: {} },
  { id: "high-preload-hr90", label: "high preload HR90", HR: 90, targetTBVMl: 6200, preloadClass: "high-preload", knobs: {} },
] as const satisfies readonly Phase5ARPointSpec[];

const CANDIDATES = [
  {
    id: "current-lv-rv-land-default",
    runtimeActiveSourceMode: MODELCORE_RUNTIME_LV_RV_LAND_DEFAULT_MODE,
    atrialProviders: [],
  },
  {
    id: "la-only-land-candidate",
    runtimeActiveSourceMode: MODELCORE_RUNTIME_ALL_CHAMBER_LAND_DEFAULT_CANDIDATE_MODE,
    atrialProviders: ["LA"],
  },
  {
    id: "ra-only-land-candidate",
    runtimeActiveSourceMode: MODELCORE_RUNTIME_ALL_CHAMBER_LAND_DEFAULT_CANDIDATE_MODE,
    atrialProviders: ["RA"],
  },
  {
    id: "all-chamber-land-candidate",
    runtimeActiveSourceMode: MODELCORE_RUNTIME_ALL_CHAMBER_LAND_DEFAULT_CANDIDATE_MODE,
    atrialProviders: ["LA", "RA"],
  },
] as const;

export type Phase5ARPointSpec = {
  readonly id: string;
  readonly label: string;
  readonly HR: 75 | 90;
  readonly targetTBVMl: number;
  readonly preloadClass: "normal" | "low-preload" | "high-preload";
  readonly knobs: Partial<ClinicalKnobs>;
};

type Phase5ARCandidate = typeof CANDIDATES[number];

type RangeCompact = {
  readonly min: number | null;
  readonly max: number | null;
};

type SignalAuditCompact = {
  readonly sampleCount: number;
  readonly sourceActiveFiberStressPa: RangeCompact;
  readonly fiberEngineeringStrain: RangeCompact;
  readonly fiberEngineeringStrainRatePerSec: RangeCompact;
  readonly freeCalciumUM: RangeCompact;
  readonly boundFraction: RangeCompact;
  readonly minimumPopulation: RangeCompact;
  readonly stateS: RangeCompact;
  readonly stateW: RangeCompact;
  readonly stateZetaS: RangeCompact;
  readonly stateZetaW: RangeCompact;
  readonly finiteHealthAllSamples: boolean;
};

export type Phase5ARInstrumentationCompact = {
  readonly providerActive: boolean;
  readonly sourceActiveStressPaCalls: number;
  readonly commitProviderStateAfterStepCalls: number;
  readonly landSolveOkCount: number;
  readonly landSolveFailureCount: number;
  readonly maxSolverResidualNorm: number;
  readonly lastFailureReason: string | null;
  readonly sourcePathAudit: SignalAuditCompact;
  readonly commitPathAudit: SignalAuditCompact;
};

export type Phase5ARRun = {
  readonly pointId: string;
  readonly candidateId: CandidateId;
  readonly runtimeActiveSourceMode: ModelCoreRuntimeActiveSourceMode;
  readonly activeAtrialProviders: readonly AtrialChamber[];
  readonly targetTBVMl: number;
  readonly HR: 75 | 90;
  readonly status: "measured" | "settle-failed" | "runtime-error";
  readonly settled: boolean;
  readonly settleReason: string;
  readonly settleBeats: number;
  readonly settleActualSeconds: number | null;
  readonly health: Pick<
    SimulationHealth,
    "status" | "periodBeats" | "cycleMetricDelta" | "tbvDriftMl" | "leftRightFlowMismatchLMin" | "messages"
  > | null;
  readonly metrics: Pick<
    SimMetrics,
    "CO_L" | "CO_R" | "AoPMean" | "PAPMean" | "LAPMean" | "RAPMean" | "LVEDPApprox" | "RVEDPApprox"
  > | null;
  readonly providerIds: Partial<Record<LandChamber, string>>;
  readonly providerInstrumentation: Partial<Record<LandChamber, Phase5ARInstrumentationCompact>>;
  readonly negativeSourceStressChambers: readonly LandChamber[];
  readonly negativeCommitStressChambers: readonly LandChamber[];
  readonly pressureAdapterNonnegativeError: boolean;
  readonly sourceStressAttribution: Phase5ARRunAttribution;
  readonly errorMessage: string | null;
};

export type Phase5ARRunAttribution =
  | "current-reference"
  | "measured-no-negative-source-stress"
  | "runtime-error-negative-raw-land-source-stress-before-pressure-adapter"
  | "runtime-error-without-recorded-negative-source-stress"
  | "settle-failed";

export type Phase5ARNegativeStressFinding = {
  readonly pointId: string;
  readonly candidateId: CandidateId;
  readonly chamber: LandChamber;
  readonly path: "source" | "commit";
  readonly minSourceActiveFiberStressPa: number;
};

export type Phase5AREvidence = {
  readonly schemaVersion: 1;
  readonly id: typeof ATRIAL_LAND_SOURCE_STRESS_ATTRIBUTION_PHASE5AR_ID;
  readonly phase: "Phase 5AR";
  readonly claimBoundary: "atrial-land-source-stress-attribution-no-runtime-flip";
  readonly protocol: {
    readonly pointSource: "hr75-hr90-normal-low-high-preload";
    readonly candidates: typeof CANDIDATES;
    readonly dtSec: typeof DT_SEC;
    readonly sampleHz: typeof SAMPLE_HZ;
    readonly measureBeats: typeof MEASURE_BEATS;
    readonly rootZcMode: typeof MODELCORE_RUNTIME_ROOT_ZC_SOURCED_BOUNDARY_ROOT_DEFAULT_MODE;
    readonly noRuntimeDefaultFlip: true;
    readonly noSourceStressClampOrTuning: true;
    readonly noPermanentVerifierOrNpmScriptAdded: true;
  };
  readonly points: typeof POINTS;
  readonly runs: readonly Phase5ARRun[];
  readonly summary: {
    readonly pointCount: number;
    readonly candidateCount: number;
    readonly runCount: number;
    readonly measuredHealthOkCountByCandidate: Record<CandidateId, number>;
    readonly runtimeErrorCountByCandidate: Record<CandidateId, number>;
    readonly pressureAdapterNonnegativeErrorCount: number;
    readonly negativeSourceStressFindingCount: number;
    readonly negativeCommitStressFindingCount: number;
    readonly negativeStressFindings: readonly Phase5ARNegativeStressFinding[];
    readonly lowPreloadHr90Attribution: string;
    readonly candidateSupport: "attributed-negative-raw-land-source-stress" | "not-attributed";
    readonly currentInterpretation: string;
    readonly recommendedNext: readonly string[];
    readonly blockers: readonly string[];
  };
  readonly boundary: {
    readonly noAllChamberRuntimeDefaultFlip: true;
    readonly noLegacyDeletion: true;
    readonly noOfficialCaseTuning: true;
    readonly noAtrialFigureEightFinality: true;
    readonly noAtrialLandPhysiologyAcceptance: true;
    readonly noSourceStressClampOrTuning: true;
    readonly noTrefTuning: true;
    readonly noQDotClampRemoval: true;
    readonly noValveLoadTimingAcceptance: true;
    readonly noClinicalScientificValidationClaim: true;
  };
  readonly doesNotUnlock: readonly string[];
  readonly normalizedSha256: string;
};

export function buildAtrialLandSourceStressAttributionPhase5AREvidence(): Phase5AREvidence {
  const runs = POINTS.flatMap((point) => CANDIDATES.map((candidate) => runPoint(point, candidate)));
  const negativeStressFindings = collectNegativeStressFindings(runs);
  const lowPreloadHr90Runs = runs.filter((run) => run.pointId === "low-preload-hr90");
  const lowPreloadHr90Attribution = summarizeLowPreloadHr90(lowPreloadHr90Runs);
  const pressureAdapterNonnegativeErrorCount = runs.filter((run) => run.pressureAdapterNonnegativeError).length;
  const candidateSupport = pressureAdapterNonnegativeErrorCount > 0
    && negativeStressFindings.some((finding) => finding.path === "source")
      ? "attributed-negative-raw-land-source-stress" as const
      : "not-attributed" as const;
  const evidenceWithoutHash: Omit<Phase5AREvidence, "normalizedSha256"> = {
    schemaVersion: 1,
    id: ATRIAL_LAND_SOURCE_STRESS_ATTRIBUTION_PHASE5AR_ID,
    phase: "Phase 5AR",
    claimBoundary: "atrial-land-source-stress-attribution-no-runtime-flip",
    protocol: {
      pointSource: "hr75-hr90-normal-low-high-preload",
      candidates: CANDIDATES,
      dtSec: DT_SEC,
      sampleHz: SAMPLE_HZ,
      measureBeats: MEASURE_BEATS,
      rootZcMode: MODELCORE_RUNTIME_ROOT_ZC_SOURCED_BOUNDARY_ROOT_DEFAULT_MODE,
      noRuntimeDefaultFlip: true,
      noSourceStressClampOrTuning: true,
      noPermanentVerifierOrNpmScriptAdded: true,
    },
    points: POINTS,
    runs,
    summary: {
      pointCount: POINTS.length,
      candidateCount: CANDIDATES.length,
      runCount: runs.length,
      measuredHealthOkCountByCandidate: countByCandidate(runs, isMeasuredHealthOk),
      runtimeErrorCountByCandidate: countByCandidate(runs, (run) => run.status === "runtime-error"),
      pressureAdapterNonnegativeErrorCount,
      negativeSourceStressFindingCount: negativeStressFindings.filter((finding) => finding.path === "source").length,
      negativeCommitStressFindingCount: negativeStressFindings.filter((finding) => finding.path === "commit").length,
      negativeStressFindings,
      lowPreloadHr90Attribution,
      candidateSupport,
      currentInterpretation: interpretation({
        candidateSupport,
        pressureAdapterNonnegativeErrorCount,
        negativeStressFindings,
        lowPreloadHr90Attribution,
      }),
      recommendedNext: [
        "keep LA/RA on legacy active-stress and keep all-chamber Land off by default",
        "split atrial chamber replacement from figure-eight bridge selection; do not tune source stress to force support",
        "next test an atrial-source convention or pressure-adapter design explicitly, with source-stress sign semantics stated before any runtime flip",
      ],
      blockers: [
        "all-chamber Land runtime default remains blocked",
        "negative atrial raw Land source-stress sign semantics remain unresolved",
        "atrial figure-eight readability remains unaccepted and separate",
      ],
    },
    boundary: boundary(),
    doesNotUnlock: doesNotUnlock(),
  };
  return {
    ...evidenceWithoutHash,
    normalizedSha256: hashStable(evidenceWithoutHash),
  };
}

function runPoint(point: typeof POINTS[number], candidate: Phase5ARCandidate): Phase5ARRun {
  const [instance] = caseDocumentToSimInstances(syntheticCaseDocument(point));
  if (!instance) throw new Error(`No synthetic instance for ${point.id}`);
  const resolution = resolveCandidate(candidate, instance.params);
  const common = {
    pointId: point.id,
    candidateId: candidate.id,
    runtimeActiveSourceMode: candidate.runtimeActiveSourceMode,
    activeAtrialProviders: candidate.atrialProviders,
    targetTBVMl: point.targetTBVMl,
    HR: point.HR,
    providerIds: providerIds(resolution.experimentalOptions),
  } as const;
  try {
    const settled = settleToSteadyState(instance.params, {
      targetTBV: point.targetTBVMl,
      dt: DT_SEC,
      sampleHz: SAMPLE_HZ,
      measureBeats: MEASURE_BEATS,
      requireProjectorQuiet: false,
      experimentalOptions: resolution.experimentalOptions,
    });
    if (!settled.ok) {
      return classifyRun({
        ...common,
        status: "settle-failed" as const,
        settled: false,
        settleReason: settled.settleStatus.reason,
        settleBeats: settled.settleStatus.beats,
        settleActualSeconds: null,
        health: compactHealth(settled.core.health()),
        metrics: null,
        providerInstrumentation: compactInstrumentation(
          resolution.instrumentationByChamber,
          resolution.experimentalOptions,
        ),
        errorMessage: null,
      });
    }
    const measurement = measureSteady(settled.core, settled.settleStatus, {
      targetTBV: point.targetTBVMl,
      dt: DT_SEC,
      sampleHz: SAMPLE_HZ,
      measureBeats: MEASURE_BEATS,
      requireProjectorQuiet: false,
      experimentalOptions: resolution.experimentalOptions,
    });
    return classifyRun({
      ...common,
      status: "measured" as const,
      settled: true,
      settleReason: settled.settleStatus.reason,
      settleBeats: settled.settleStatus.beats,
      settleActualSeconds: round(settled.settleStatus.actualSeconds),
      health: compactHealth(measurement.health),
      metrics: compactMetrics(measurement.metrics),
      providerInstrumentation: compactInstrumentation(
        resolution.instrumentationByChamber,
        resolution.experimentalOptions,
      ),
      errorMessage: null,
    });
  } catch (error) {
    return classifyRun({
      ...common,
      status: "runtime-error" as const,
      settled: false,
      settleReason: "error",
      settleBeats: 0,
      settleActualSeconds: null,
      health: null,
      metrics: null,
      providerInstrumentation: compactInstrumentation(
        resolution.instrumentationByChamber,
        resolution.experimentalOptions,
      ),
      errorMessage: error instanceof Error ? error.message : String(error),
    });
  }
}

function resolveCandidate(candidate: Phase5ARCandidate, runtimeParams: CoreRuntimeParams) {
  const instrumentationByChamber: Record<LandChamber, ModelCoreLand2017LvSourceProviderInstrumentation> = {
    LV: createModelCoreLand2017LvSourceProviderInstrumentation(),
    RV: createModelCoreLand2017LvSourceProviderInstrumentation(),
    LA: createModelCoreLand2017LvSourceProviderInstrumentation(),
    RA: createModelCoreLand2017LvSourceProviderInstrumentation(),
  };
  const resolved = resolveModelCoreRuntimeActiveSource({
    mode: candidate.runtimeActiveSourceMode,
    instrumentation: instrumentationByChamber.LV,
    rvInstrumentation: instrumentationByChamber.RV,
    laInstrumentation: instrumentationByChamber.LA,
    raInstrumentation: instrumentationByChamber.RA,
    runtimeParams,
  });
  if (candidate.id === "current-lv-rv-land-default") {
    return {
      experimentalOptions: resolved.experimentalOptions,
      instrumentationByChamber,
    };
  }
  const providers = resolved.experimentalOptions.activeSourceProviders ?? {};
  const activeSourceProviders: Partial<Record<Chamber, ModelCoreExperimentalActiveSourceProvider>> = {
    LV: providers.LV,
    RV: providers.RV,
  };
  for (const chamber of candidate.atrialProviders) {
    activeSourceProviders[chamber] = providers[chamber];
  }
  return {
    experimentalOptions: {
      ...resolved.experimentalOptions,
      activeSourceProviders,
    },
    instrumentationByChamber,
  };
}

function providerIds(options: ModelCoreExperimentalOptions): Partial<Record<LandChamber, string>> {
  const providers = options.activeSourceProviders ?? {};
  return Object.fromEntries(
    (["LV", "RV", "LA", "RA"] as const).flatMap((chamber) => {
      const provider = providers[chamber];
      return provider ? [[chamber, provider.sourceProviderId]] : [];
    }),
  ) as Partial<Record<LandChamber, string>>;
}

function classifyRun(
  run: Omit<
    Phase5ARRun,
    "negativeSourceStressChambers" | "negativeCommitStressChambers" | "pressureAdapterNonnegativeError" | "sourceStressAttribution"
  >,
): Phase5ARRun {
  const negativeSourceStressChambers = chambersWithNegativeStress(run.providerInstrumentation, "sourcePathAudit");
  const negativeCommitStressChambers = chambersWithNegativeStress(run.providerInstrumentation, "commitPathAudit");
  const pressureAdapterNonnegativeError =
    run.errorMessage === "source active-fiber stress must be nonnegative";
  const sourceStressAttribution = attributionForRun(
    run,
    negativeSourceStressChambers,
    pressureAdapterNonnegativeError,
  );
  return {
    ...run,
    negativeSourceStressChambers,
    negativeCommitStressChambers,
    pressureAdapterNonnegativeError,
    sourceStressAttribution,
  };
}

function attributionForRun(
  run: Pick<Phase5ARRun, "candidateId" | "status">,
  negativeSourceStressChambers: readonly LandChamber[],
  pressureAdapterNonnegativeError: boolean,
): Phase5ARRunAttribution {
  if (run.candidateId === "current-lv-rv-land-default") return "current-reference";
  if (run.status === "settle-failed") return "settle-failed";
  if (run.status === "runtime-error") {
    return pressureAdapterNonnegativeError && negativeSourceStressChambers.length > 0
      ? "runtime-error-negative-raw-land-source-stress-before-pressure-adapter"
      : "runtime-error-without-recorded-negative-source-stress";
  }
  return negativeSourceStressChambers.length > 0
    ? "runtime-error-negative-raw-land-source-stress-before-pressure-adapter"
    : "measured-no-negative-source-stress";
}

function compactInstrumentation(
  input: Record<LandChamber, ModelCoreLand2017LvSourceProviderInstrumentation>,
  options: ModelCoreExperimentalOptions,
): Partial<Record<LandChamber, Phase5ARInstrumentationCompact>> {
  return Object.fromEntries(
    (["LV", "RV", "LA", "RA"] as const).map((chamber) => {
      const instrumentation = input[chamber];
      return [chamber, {
        providerActive: Boolean(options.activeSourceProviders?.[chamber]),
        sourceActiveStressPaCalls: instrumentation.sourceActiveStressPa,
        commitProviderStateAfterStepCalls: instrumentation.commitProviderStateAfterStep,
        landSolveOkCount: instrumentation.landSolveOkCount,
        landSolveFailureCount: instrumentation.landSolveFailureCount,
        maxSolverResidualNorm: round(instrumentation.maxSolverResidualNorm),
        lastFailureReason: instrumentation.lastFailureReason,
        sourcePathAudit: compactSignalAudit(instrumentation.sourcePathAudit),
        commitPathAudit: compactSignalAudit(instrumentation.commitPathAudit),
      } satisfies Phase5ARInstrumentationCompact];
    }),
  ) as Partial<Record<LandChamber, Phase5ARInstrumentationCompact>>;
}

function compactSignalAudit(audit: ModelCoreLand2017LvSignalAudit): SignalAuditCompact {
  return {
    sampleCount: audit.sampleCount,
    sourceActiveFiberStressPa: compactRange(audit.sourceActiveFiberStressPa),
    fiberEngineeringStrain: compactRange(audit.fiberEngineeringStrain),
    fiberEngineeringStrainRatePerSec: compactRange(audit.fiberEngineeringStrainRatePerSec),
    freeCalciumUM: compactRange(audit.freeCalciumUM),
    boundFraction: compactRange(audit.boundFraction),
    minimumPopulation: compactRange(audit.minimumPopulation),
    stateS: compactRange(audit.stateRanges.S),
    stateW: compactRange(audit.stateRanges.W),
    stateZetaS: compactRange(audit.stateRanges.zetaS),
    stateZetaW: compactRange(audit.stateRanges.zetaW),
    finiteHealthAllSamples: audit.finiteHealthAllSamples,
  };
}

function compactRange(range: ModelCoreLand2017LvRangeAudit | undefined): RangeCompact {
  return {
    min: finiteOrNull(range?.min ?? null),
    max: finiteOrNull(range?.max ?? null),
  };
}

function chambersWithNegativeStress(
  input: Partial<Record<LandChamber, Phase5ARInstrumentationCompact>>,
  pathKey: "sourcePathAudit" | "commitPathAudit",
): readonly LandChamber[] {
  return (["LV", "RV", "LA", "RA"] as const).filter((chamber) =>
    (input[chamber]?.[pathKey].sourceActiveFiberStressPa.min ?? 0) < 0
  );
}

function collectNegativeStressFindings(runs: readonly Phase5ARRun[]): readonly Phase5ARNegativeStressFinding[] {
  return runs.flatMap((run) =>
    (["LV", "RV", "LA", "RA"] as const).flatMap((chamber) => {
      const instrumentation = run.providerInstrumentation[chamber];
      if (!instrumentation) return [];
      const findings: Phase5ARNegativeStressFinding[] = [];
      const sourceMin = instrumentation.sourcePathAudit.sourceActiveFiberStressPa.min;
      if (sourceMin != null && sourceMin < 0) {
        findings.push({
          pointId: run.pointId,
          candidateId: run.candidateId,
          chamber,
          path: "source",
          minSourceActiveFiberStressPa: sourceMin,
        });
      }
      const commitMin = instrumentation.commitPathAudit.sourceActiveFiberStressPa.min;
      if (commitMin != null && commitMin < 0) {
        findings.push({
          pointId: run.pointId,
          candidateId: run.candidateId,
          chamber,
          path: "commit",
          minSourceActiveFiberStressPa: commitMin,
        });
      }
      return findings;
    }),
  );
}

function summarizeLowPreloadHr90(runs: readonly Phase5ARRun[]): string {
  const byCandidate = Object.fromEntries(runs.map((run) => [run.candidateId, run]));
  const laOnly = byCandidate["la-only-land-candidate"];
  const raOnly = byCandidate["ra-only-land-candidate"];
  const all = byCandidate["all-chamber-land-candidate"];
  if (!laOnly || !raOnly || !all) return "missing-low-preload-hr90-candidate-run";
  const pieces = [
    `LA-only=${runShortStatus(laOnly)}`,
    `RA-only=${runShortStatus(raOnly)}`,
    `all-chamber=${runShortStatus(all)}`,
  ];
  return pieces.join("; ");
}

function runShortStatus(run: Phase5ARRun): string {
  const negative = run.negativeSourceStressChambers.length > 0
    ? `negative-source:${run.negativeSourceStressChambers.join("+")}`
    : "no-negative-source";
  return `${run.status}/${run.sourceStressAttribution}/${negative}`;
}

function countByCandidate(
  runs: readonly Phase5ARRun[],
  predicate: (run: Phase5ARRun) => boolean,
): Record<CandidateId, number> {
  return Object.fromEntries(
    CANDIDATES.map((candidate) => [
      candidate.id,
      runs.filter((run) => run.candidateId === candidate.id && predicate(run)).length,
    ]),
  ) as Record<CandidateId, number>;
}

function syntheticCaseDocument(point: typeof POINTS[number]): CaseDocument {
  return {
    schemaVersion: CASE_SCHEMA_VERSION,
    engineVersion: ENGINE_VERSION,
    knobMappingVersion: KNOB_MAPPING_VERSION,
    solver: DEFAULT_SOLVER,
    meta: {
      id: `phase5ar-atrial-source-stress-${point.id}`,
      title: `Phase 5AR ${point.label}`,
      author: "CircleHeart",
      createdAt: 0,
      updatedAt: 0,
    },
    kind: "case",
    status: "draft",
    visibility: "private",
    spec: {
      title: `Phase 5AR ${point.label}`,
      description: "Synthetic atrial Land source-stress attribution point; not an official case.",
      modelLimitations: [
        "Explicit diagnostic only.",
        "No all-chamber default flip, source-stress clamp, figure-eight finality, official-case tuning, or legacy deletion.",
      ],
    },
    instances: [{
      id: point.id,
      name: point.label,
      color: "#38bdf8",
      isVisible: true,
      baseline: "active-normal",
      knobs: { ...point.knobs, HR: point.HR },
      interventions: [],
      rawPatch: {},
      targetVolume: point.targetTBVMl,
    }],
    panels: [],
  };
}

function compactHealth(health: SimulationHealth): Phase5ARRun["health"] {
  return {
    status: health.status,
    periodBeats: health.periodBeats,
    cycleMetricDelta: round(health.cycleMetricDelta),
    tbvDriftMl: round(health.tbvDriftMl),
    leftRightFlowMismatchLMin: round(health.leftRightFlowMismatchLMin),
    messages: health.messages,
  };
}

function compactMetrics(metrics: SimMetrics): Phase5ARRun["metrics"] {
  return {
    CO_L: finiteOrNull(metrics.CO_L),
    CO_R: finiteOrNull(metrics.CO_R),
    AoPMean: finiteOrNull(metrics.AoPMean),
    PAPMean: finiteOrNull(metrics.PAPMean),
    LAPMean: finiteOrNull(metrics.LAPMean),
    RAPMean: finiteOrNull(metrics.RAPMean),
    LVEDPApprox: finiteOrNull(metrics.LVEDPApprox),
    RVEDPApprox: finiteOrNull(metrics.RVEDPApprox),
  };
}

function isMeasuredHealthOk(run: Pick<Phase5ARRun, "status" | "health">): boolean {
  return run.status === "measured" && run.health?.status === "ok";
}

function interpretation(input: {
  readonly candidateSupport: Phase5AREvidence["summary"]["candidateSupport"];
  readonly pressureAdapterNonnegativeErrorCount: number;
  readonly negativeStressFindings: readonly Phase5ARNegativeStressFinding[];
  readonly lowPreloadHr90Attribution: string;
}): string {
  if (input.candidateSupport === "attributed-negative-raw-land-source-stress") {
    const chambers = Array.from(new Set(input.negativeStressFindings.map((finding) => finding.chamber))).join("+");
    return [
      "The Phase 5AQ blocker is attributed to raw Land source-stress sign behavior before the pressure adapter.",
      `The nonnegative pressure-adapter invariant fired ${input.pressureAdapterNonnegativeErrorCount} time(s), and negative raw source stress was recorded in ${chambers}.`,
      `Low-preload HR90 split: ${input.lowPreloadHr90Attribution}.`,
      "This is not a solver failure or provider reachability blocker, and it does not justify clamping/tuning source stress.",
    ].join(" ");
  }
  return [
    "The Phase 5AQ blocker is not attributed by this artifact.",
    `Low-preload HR90 split: ${input.lowPreloadHr90Attribution}.`,
    "Keep all-chamber Land off by default and inspect the runtime error path before any chamber replacement.",
  ].join(" ");
}

function boundary(): Phase5AREvidence["boundary"] {
  return {
    noAllChamberRuntimeDefaultFlip: true,
    noLegacyDeletion: true,
    noOfficialCaseTuning: true,
    noAtrialFigureEightFinality: true,
    noAtrialLandPhysiologyAcceptance: true,
    noSourceStressClampOrTuning: true,
    noTrefTuning: true,
    noQDotClampRemoval: true,
    noValveLoadTimingAcceptance: true,
    noClinicalScientificValidationClaim: true,
  };
}

function doesNotUnlock(): readonly string[] {
  return [
    "all-chamber Land runtime default",
    "legacy active-stress deletion",
    "source-stress clamping or retuning",
    "Tref tuning",
    "atrial figure-eight model selection",
    "official case tuning",
    "official morphology acceptance",
    "qDot clamp removal",
    "valve/load timing acceptance",
    "clinical or scientific validation",
  ];
}

function finiteOrNull(value: number | null): number | null {
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

function writeEvidence(): Phase5AREvidence {
  const evidence = buildAtrialLandSourceStressAttributionPhase5AREvidence();
  const outPath = path.resolve(process.cwd(), ATRIAL_LAND_SOURCE_STRESS_ATTRIBUTION_PHASE5AR_RESULT_PATH);
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
    candidateSupport: evidence.summary.candidateSupport,
    lowPreloadHr90Attribution: evidence.summary.lowPreloadHr90Attribution,
    pressureAdapterNonnegativeErrorCount: evidence.summary.pressureAdapterNonnegativeErrorCount,
    negativeSourceStressFindingCount: evidence.summary.negativeSourceStressFindingCount,
  }, null, 2));
}
