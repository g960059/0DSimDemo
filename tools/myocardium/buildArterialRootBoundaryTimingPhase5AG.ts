import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import phase5AFArtifact from "@/data/myocardium/protocols/arterial-root-zc-calibration-phase5af-result-v1.json";
import phase5XArtifact from "@/data/myocardium/protocols/lv-land-default-candidate-preflight-phase5x-result-v1.json";
import type { ClinicalKnobs } from "@/engine/knobs";
import {
  runArterialRootBoundaryInertancePoint,
  runsWithComparisons,
  type ArterialRootBoundaryInertancePhase5AECandidate,
  type ArterialRootBoundaryInertancePhase5AEDiagnosticPoint,
  type ArterialRootBoundaryInertancePhase5AEHealth,
  type ArterialRootBoundaryInertancePhase5AEMetrics,
  type ArterialRootBoundaryInertancePhase5AERun,
} from "@/tools/myocardium/buildArterialRootBoundaryInertancePhase5AE";

export const ARTERIAL_ROOT_BOUNDARY_TIMING_PHASE5AG_ID =
  "arterial-root-boundary-timing-phase5ag-result-v1";

export const ARTERIAL_ROOT_BOUNDARY_TIMING_PHASE5AG_RESULT_PATH =
  "data/myocardium/protocols/arterial-root-boundary-timing-phase5ag-result-v1.json";

const MODEL_PATH_IDS = ["stock-active-no-provider-v0", "developer-only-lv-land-v0"] as const;
const QDOT_REDUCTION_MIN = 0.25 as const;
const OUTPUT_RATIO_MIN = 0.75 as const;
const OUTPUT_RATIO_MAX = 1.25 as const;
const TIMING_RATIO_MIN = 0.75 as const;
const TIMING_RATIO_MAX = 1.35 as const;
const UPSTROKE_RATIO_SIGNAL_MIN = 1.05 as const;
const PEAK_FLOW_RATIO_SIGNAL_MAX = 0.98 as const;
const FORWARD_DURATION_RATIO_SIGNAL_MIN = 1.05 as const;

const LOW_PRELOAD_ALTERNANS_EDGE = {
  id: "low-preload-alternans-edge",
  label: "low preload alternans edge",
  role: "frozen-low-preload-edge",
  targetTBVMl: 4350,
  knobs: {},
} as const satisfies ArterialRootBoundaryInertancePhase5AEDiagnosticPoint;

const CURRENT_CANDIDATE = {
  id: "current-closure",
  role: "current-closure",
  aovBoundaryInertanceMultiple: 1,
  aoSaInertanceMultiple: 1,
  boundaryRootAdditionalMultipleOfAoVL: 0,
} as const satisfies ArterialRootBoundaryInertancePhase5AECandidate;

const SOURCED_CALIBRATED_CANDIDATE = {
  id: "boundary-root-l-plus-1x-aov-l-mechanism",
  role: "experimental-boundary-root-inertance-mechanism",
  aovBoundaryInertanceMultiple: 1,
  aoSaInertanceMultiple: 1,
  boundaryRootAdditionalMultipleOfAoVL: 1,
} as const satisfies ArterialRootBoundaryInertancePhase5AECandidate;

const CANDIDATES = [CURRENT_CANDIDATE, SOURCED_CALIBRATED_CANDIDATE] as const;

type ModelPathId = typeof MODEL_PATH_IDS[number];
type CandidateId = typeof CANDIDATES[number]["id"];
type Phase5AEComparison = ArterialRootBoundaryInertancePhase5AERun["comparisonVsCurrent"];
type Phase5AGComparisonClassification =
  | Phase5AEComparison["classification"]
  | "candidate-qdot-timing-output-preserved"
  | "candidate-qdot-only-output-preserved"
  | "candidate-timing-only-output-preserved"
  | "candidate-output-or-timing-cost";

export type ArterialRootBoundaryTimingPhase5AGDiagnosticPoint = {
  readonly id: string;
  readonly label: string;
  readonly role: string;
  readonly targetTBVMl: number;
  readonly knobs: Partial<ClinicalKnobs>;
};

export type ArterialRootBoundaryTimingPhase5AGRun = Omit<
  ArterialRootBoundaryInertancePhase5AERun,
  "modelPathId" | "candidateId" | "candidateRole" | "comparisonVsCurrent" | "health" | "metrics"
> & {
  readonly modelPathId: ModelPathId;
  readonly candidateId: CandidateId;
  readonly candidateRole: typeof CANDIDATES[number]["role"];
  readonly health: ArterialRootBoundaryInertancePhase5AEHealth | null;
  readonly metrics: ArterialRootBoundaryInertancePhase5AEMetrics | null;
  readonly comparisonVsCurrent: Omit<Phase5AEComparison, "classification"> & {
    readonly valveLoadTimingPreserved: boolean;
    readonly valveLoadTimingSignal: boolean;
    readonly qDotEngagementSignal: boolean;
    readonly classification: Phase5AGComparisonClassification;
  };
};

export type ArterialRootBoundaryTimingPhase5AGPoint = {
  readonly id: string;
  readonly label: string;
  readonly role: string;
  readonly targetTBVMl: number;
  readonly knobs: Partial<ClinicalKnobs>;
  readonly stock: readonly ArterialRootBoundaryTimingPhase5AGRun[];
  readonly land: readonly ArterialRootBoundaryTimingPhase5AGRun[];
};

export type ArterialRootBoundaryTimingPhase5AGEvidence = {
  readonly schemaVersion: 1;
  readonly id: typeof ARTERIAL_ROOT_BOUNDARY_TIMING_PHASE5AG_ID;
  readonly phase: "Phase 5AG";
  readonly claimBoundary: "closed-loop-sourced-boundary-root-timing-diagnostic-only";
  readonly upstreamPhase5AFArtifactId: typeof phase5AFArtifact.id;
  readonly verifierScript: "verify:myocardium-arterial-root-boundary-timing";
  readonly protocol: {
    readonly pointSource: "phase5x-full-synthetic-matrix-plus-frozen-low-preload-edge";
    readonly modelPathIds: typeof MODEL_PATH_IDS;
    readonly candidateSet: typeof CANDIDATES;
    readonly sourcedCalibrationCandidateId: typeof SOURCED_CALIBRATED_CANDIDATE.id;
    readonly sourcedCalibrationStatus: typeof phase5AFArtifact.phase5aeBoundaryRootMechanismCalibration.calibrationStatus;
    readonly pointCount: number;
    readonly comparisonThresholds: {
      readonly qDotReductionMin: typeof QDOT_REDUCTION_MIN;
      readonly outputRatioMin: typeof OUTPUT_RATIO_MIN;
      readonly outputRatioMax: typeof OUTPUT_RATIO_MAX;
      readonly timingRatioMin: typeof TIMING_RATIO_MIN;
      readonly timingRatioMax: typeof TIMING_RATIO_MAX;
      readonly upstrokeRatioSignalMin: typeof UPSTROKE_RATIO_SIGNAL_MIN;
      readonly peakFlowRatioSignalMax: typeof PEAK_FLOW_RATIO_SIGNAL_MAX;
      readonly forwardDurationRatioSignalMin: typeof FORWARD_DURATION_RATIO_SIGNAL_MIN;
    };
  };
  readonly points: readonly ArterialRootBoundaryTimingPhase5AGPoint[];
  readonly summary: {
    readonly pointCount: number;
    readonly runCount: number;
    readonly measuredRunCount: number;
    readonly healthOkRunCount: number;
    readonly candidateComparisonCount: number;
    readonly healthOkCandidateComparisonCount: number;
    readonly qDotEngagementSignalCount: number;
    readonly healthOkQDotEngagementSignalCount: number;
    readonly valveLoadTimingSignalCount: number;
    readonly healthOkValveLoadTimingSignalCount: number;
    readonly qDotAndTimingOutputPreservedCount: number;
    readonly stockQDotAndTimingOutputPreservedCount: number;
    readonly landQDotAndTimingOutputPreservedCount: number;
    readonly outputOrTimingCostCount: number;
    readonly landSolveFailureCount: number;
    readonly normalFloorLandClassification: ArterialRootBoundaryTimingPhase5AGRun["comparisonVsCurrent"]["classification"] | null;
    readonly nonOkOrUnmeasuredRuns: readonly {
      readonly pointId: string;
      readonly modelPathId: ModelPathId;
      readonly candidateId: CandidateId;
      readonly status: ArterialRootBoundaryTimingPhase5AGRun["status"];
      readonly healthStatus: ArterialRootBoundaryTimingPhase5AGRun["health"] extends null ? null : "ok" | "warning" | "failed" | null;
      readonly messages: readonly string[];
    }[];
    readonly currentInterpretation: string;
    readonly recommendedNext: readonly string[];
    readonly limitations: readonly string[];
  };
  readonly boundary: {
    readonly noModelCoreEquationChange: true;
    readonly noTopologyChange: true;
    readonly noStateLayoutChange: true;
    readonly noDefaultParamChange: true;
    readonly noRuntimeDefaultFlip: true;
    readonly noProductionRegistryIntegration: true;
    readonly noOfficialCaseWiring: true;
    readonly noOfficialCaseReauthoring: true;
    readonly noWorkbenchRuntimeWiring: true;
    readonly noStateSchemaMigration: true;
    readonly noQDotTuning: true;
    readonly noQDotClampRemoval: true;
    readonly noValveThresholdTuning: true;
    readonly noValveLossTuning: true;
    readonly noAfterloadTuning: true;
    readonly noPreloadTuning: true;
    readonly noLandParameterTuning: true;
    readonly noTrefFudge: true;
    readonly noSourceStressScaling: true;
    readonly noDirectAoSAAdoption: true;
    readonly noAoVBoundaryCarrierAdoption: true;
    readonly noBoundaryRootProductionAdoption: true;
    readonly noValveLoadTimingAcceptance: true;
    readonly noReflectionCoefficientClaim: true;
    readonly noRootCauseAcceptance: true;
    readonly noFixAcceptance: true;
    readonly noOfficialMorphologyAcceptance: true;
    readonly noFinalNoAlternansAcceptance: true;
    readonly noClinicalScientificValidationClaim: true;
  };
  readonly doesNotUnlock: readonly string[];
  readonly normalizedSha256: string;
};

export function buildArterialRootBoundaryTimingPhase5AGEvidence():
ArterialRootBoundaryTimingPhase5AGEvidence {
  const points = diagnosticPoints().map(buildPoint);
  const runs = points.flatMap((point) => [...point.stock, ...point.land]);
  const candidateRuns = runs.filter((run) => run.candidateId === SOURCED_CALIBRATED_CANDIDATE.id);
  const healthOkRuns = runs.filter(isMeasuredHealthOk);
  const healthOkCandidateRuns = candidateRuns.filter(isMeasuredHealthOk);
  const qDotSignals = candidateRuns.filter((run) => run.comparisonVsCurrent.qDotEngagementSignal);
  const timingSignals = candidateRuns.filter((run) => run.comparisonVsCurrent.valveLoadTimingSignal);
  const qDotAndTimingOutputPreserved = healthOkCandidateRuns.filter((run) =>
    run.comparisonVsCurrent.classification === "candidate-qdot-timing-output-preserved"
  );
  const outputOrTimingCost = candidateRuns.filter((run) =>
    run.comparisonVsCurrent.classification === "candidate-output-or-timing-cost"
  );
  const normalFloorLand = points
    .find((point) => point.id === "normal-floor")
    ?.land.find((run) => run.candidateId === SOURCED_CALIBRATED_CANDIDATE.id) ?? null;
  const nonOkOrUnmeasuredRuns = runs
    .filter((run) => run.status !== "measured" || run.health?.status !== "ok")
    .map((run) => ({
      pointId: run.pointId,
      modelPathId: run.modelPathId,
      candidateId: run.candidateId,
      status: run.status,
      healthStatus: run.health?.status ?? null,
      messages: run.health?.messages ?? (run.errorMessage ? [run.errorMessage] : []),
    }));
  const evidenceWithoutHash: Omit<ArterialRootBoundaryTimingPhase5AGEvidence, "normalizedSha256"> = {
    schemaVersion: 1 as const,
    id: ARTERIAL_ROOT_BOUNDARY_TIMING_PHASE5AG_ID,
    phase: "Phase 5AG" as const,
    claimBoundary: "closed-loop-sourced-boundary-root-timing-diagnostic-only" as const,
    upstreamPhase5AFArtifactId: phase5AFArtifact.id,
    verifierScript: "verify:myocardium-arterial-root-boundary-timing" as const,
    protocol: {
      pointSource: "phase5x-full-synthetic-matrix-plus-frozen-low-preload-edge" as const,
      modelPathIds: MODEL_PATH_IDS,
      candidateSet: CANDIDATES,
      sourcedCalibrationCandidateId: SOURCED_CALIBRATED_CANDIDATE.id,
      sourcedCalibrationStatus: phase5AFArtifact.phase5aeBoundaryRootMechanismCalibration.calibrationStatus,
      pointCount: points.length,
      comparisonThresholds: {
        qDotReductionMin: QDOT_REDUCTION_MIN,
        outputRatioMin: OUTPUT_RATIO_MIN,
        outputRatioMax: OUTPUT_RATIO_MAX,
        timingRatioMin: TIMING_RATIO_MIN,
        timingRatioMax: TIMING_RATIO_MAX,
        upstrokeRatioSignalMin: UPSTROKE_RATIO_SIGNAL_MIN,
        peakFlowRatioSignalMax: PEAK_FLOW_RATIO_SIGNAL_MAX,
        forwardDurationRatioSignalMin: FORWARD_DURATION_RATIO_SIGNAL_MIN,
      },
    },
    points,
    summary: {
      pointCount: points.length,
      runCount: runs.length,
      measuredRunCount: runs.filter((run) => run.status === "measured").length,
      healthOkRunCount: healthOkRuns.length,
      candidateComparisonCount: candidateRuns.length,
      healthOkCandidateComparisonCount: healthOkCandidateRuns.length,
      qDotEngagementSignalCount: qDotSignals.length,
      healthOkQDotEngagementSignalCount: qDotSignals.filter(isMeasuredHealthOk).length,
      valveLoadTimingSignalCount: timingSignals.length,
      healthOkValveLoadTimingSignalCount: timingSignals.filter(isMeasuredHealthOk).length,
      qDotAndTimingOutputPreservedCount: qDotAndTimingOutputPreserved.length,
      stockQDotAndTimingOutputPreservedCount: qDotAndTimingOutputPreserved
        .filter((run) => run.modelPathId === "stock-active-no-provider-v0").length,
      landQDotAndTimingOutputPreservedCount: qDotAndTimingOutputPreserved
        .filter((run) => run.modelPathId === "developer-only-lv-land-v0").length,
      outputOrTimingCostCount: outputOrTimingCost.length,
      landSolveFailureCount: runs.reduce((sum, run) => sum + (run.providerInstrumentation?.landSolveFailureCount ?? 0), 0),
      normalFloorLandClassification: normalFloorLand?.comparisonVsCurrent.classification ?? null,
      nonOkOrUnmeasuredRuns,
      currentInterpretation: interpretation({
        pointCount: points.length,
        healthOkCandidateComparisonCount: healthOkCandidateRuns.length,
        qDotAndTimingOutputPreservedCount: qDotAndTimingOutputPreserved.length,
        stockQDotAndTimingOutputPreservedCount: qDotAndTimingOutputPreserved
          .filter((run) => run.modelPathId === "stock-active-no-provider-v0").length,
        landQDotAndTimingOutputPreservedCount: qDotAndTimingOutputPreserved
          .filter((run) => run.modelPathId === "developer-only-lv-land-v0").length,
        outputOrTimingCostCount: outputOrTimingCost.length,
        nonOkOrUnmeasuredCount: nonOkOrUnmeasuredRuns.length,
        normalFloorLandClassification: normalFloorLand?.comparisonVsCurrent.classification ?? null,
      }),
      recommendedNext: [
        "inspect any Land normal-floor and matrix-wide output/timing-cost cases before production/default root/Zc adoption",
        "if qDot/timing gains are concentrated in stock but not Land, keep boundary/root mechanism diagnostic-only and move to valve/load timing attribution rather than qDot clamp removal",
        "keep qDot clamps, valve thresholds, valve loss terms, load/preload, Tref, source-stress scale, and Land parameters fixed",
        "do not claim reflection coefficient, qDot clamp removal, official morphology acceptance, production/default adoption, or final no-alternans from this timing diagnostic",
      ],
      limitations: [
        "This is a closed-loop diagnostic over synthetic user-knob points plus one frozen low-preload edge, not official-case tuning.",
        "Only current closure and the sourced-calibrated total 2x boundary/root mechanism are compared.",
        "The boundary/root mechanism remains off by default; the experiment does not change topology, default parameters, qDot clamps, or valve/load parameters.",
        "Timing signals are directional morphology diagnostics, not valve/load timing acceptance.",
      ],
    },
    boundary: {
      noModelCoreEquationChange: true,
      noTopologyChange: true,
      noStateLayoutChange: true,
      noDefaultParamChange: true,
      noRuntimeDefaultFlip: true,
      noProductionRegistryIntegration: true,
      noOfficialCaseWiring: true,
      noOfficialCaseReauthoring: true,
      noWorkbenchRuntimeWiring: true,
      noStateSchemaMigration: true,
      noQDotTuning: true,
      noQDotClampRemoval: true,
      noValveThresholdTuning: true,
      noValveLossTuning: true,
      noAfterloadTuning: true,
      noPreloadTuning: true,
      noLandParameterTuning: true,
      noTrefFudge: true,
      noSourceStressScaling: true,
      noDirectAoSAAdoption: true,
      noAoVBoundaryCarrierAdoption: true,
      noBoundaryRootProductionAdoption: true,
      noValveLoadTimingAcceptance: true,
      noReflectionCoefficientClaim: true,
      noRootCauseAcceptance: true,
      noFixAcceptance: true,
      noOfficialMorphologyAcceptance: true,
      noFinalNoAlternansAcceptance: true,
      noClinicalScientificValidationClaim: true,
    },
    doesNotUnlock: [
      "ModelCoreEquationChange",
      "topologyChange",
      "stateLayoutChange",
      "defaultParamChange",
      "runtimeDefaultFlip",
      "productionRegistryIntegration",
      "officialCaseWiring",
      "officialCaseReauthoring",
      "workbenchRuntimeWiring",
      "stateSchemaMigration",
      "qDotTuning",
      "qDotClampRemoval",
      "valveThresholdTuning",
      "valveLossTuning",
      "afterloadTuning",
      "preloadTuning",
      "LandParameterTuning",
      "TrefFudge",
      "sourceStressScaling",
      "directAoSAAdoption",
      "AoVBoundaryCarrierAdoption",
      "boundaryRootProductionAdoption",
      "valveLoadTimingAcceptance",
      "reflectionCoefficientClaim",
      "rootCauseAcceptance",
      "fixAcceptance",
      "officialMorphologyAcceptance",
      "finalNoAlternansAcceptance",
      "clinicalScientificValidationClaim",
    ],
  };
  return {
    ...evidenceWithoutHash,
    normalizedSha256: hashStable(evidenceWithoutHash),
  };
}

function diagnosticPoints(): readonly ArterialRootBoundaryTimingPhase5AGDiagnosticPoint[] {
  const sweepPoints = phase5XArtifact.protocol.sweepPoints as readonly ArterialRootBoundaryTimingPhase5AGDiagnosticPoint[];
  return [...sweepPoints, LOW_PRELOAD_ALTERNANS_EDGE];
}

function buildPoint(point: ArterialRootBoundaryTimingPhase5AGDiagnosticPoint): ArterialRootBoundaryTimingPhase5AGPoint {
  return {
    id: point.id,
    label: point.label,
    role: point.role,
    targetTBVMl: point.targetTBVMl,
    knobs: point.knobs,
    stock: runPair(point, "stock-active-no-provider-v0"),
    land: runPair(point, "developer-only-lv-land-v0"),
  };
}

function runPair(
  point: ArterialRootBoundaryTimingPhase5AGDiagnosticPoint,
  modelPathId: ModelPathId,
): readonly ArterialRootBoundaryTimingPhase5AGRun[] {
  return runsWithComparisons(CANDIDATES.map((candidate) =>
    runArterialRootBoundaryInertancePoint(point, modelPathId, candidate)
  )).map(enrichRun);
}

function enrichRun(run: ArterialRootBoundaryInertancePhase5AERun): ArterialRootBoundaryTimingPhase5AGRun {
  const comparison = run.comparisonVsCurrent;
  const outputPreserved = comparison.outputPreserved;
  const valveLoadTimingPreserved =
    outputPreserved
    && (comparison.forwardDurationRatioVsCurrent ?? 1) >= TIMING_RATIO_MIN
    && (comparison.forwardDurationRatioVsCurrent ?? 1) <= TIMING_RATIO_MAX
    && (comparison.qAoUpstrokeRatioVsCurrent ?? 1) >= TIMING_RATIO_MIN
    && (comparison.qAoUpstrokeRatioVsCurrent ?? 1) <= TIMING_RATIO_MAX;
  const qDotEngagementSignal =
    (comparison.qDotClampReductionVsCurrentAovOpen ?? 0) >= QDOT_REDUCTION_MIN;
  const valveLoadTimingSignal =
    valveLoadTimingPreserved
    && (
      (comparison.qAoUpstrokeRatioVsCurrent ?? 0) >= UPSTROKE_RATIO_SIGNAL_MIN
      || (comparison.qAoPeakRatioVsCurrent ?? Infinity) <= PEAK_FLOW_RATIO_SIGNAL_MAX
      || (comparison.forwardDurationRatioVsCurrent ?? 0) >= FORWARD_DURATION_RATIO_SIGNAL_MIN
    );
  return {
    ...run,
    modelPathId: run.modelPathId as ModelPathId,
    candidateId: run.candidateId as CandidateId,
    candidateRole: run.candidateRole as typeof CANDIDATES[number]["role"],
    comparisonVsCurrent: {
      ...comparison,
      valveLoadTimingPreserved,
      valveLoadTimingSignal,
      qDotEngagementSignal,
      classification: classificationFor({
        original: comparison.classification,
        outputPreserved,
        valveLoadTimingPreserved,
        qDotEngagementSignal,
        valveLoadTimingSignal,
      }),
    },
  };
}

function classificationFor(args: {
  readonly original: Phase5AEComparison["classification"];
  readonly outputPreserved: boolean;
  readonly valveLoadTimingPreserved: boolean;
  readonly qDotEngagementSignal: boolean;
  readonly valveLoadTimingSignal: boolean;
}): ArterialRootBoundaryTimingPhase5AGRun["comparisonVsCurrent"]["classification"] {
  if (args.original === "current-closure-reference" || args.original === "uninterpretable-health-or-settle") {
    return args.original;
  }
  if (!args.outputPreserved || !args.valveLoadTimingPreserved) return "candidate-output-or-timing-cost";
  if (args.qDotEngagementSignal && args.valveLoadTimingSignal) return "candidate-qdot-timing-output-preserved";
  if (args.qDotEngagementSignal) return "candidate-qdot-only-output-preserved";
  if (args.valveLoadTimingSignal) return "candidate-timing-only-output-preserved";
  return args.original;
}

function isMeasuredHealthOk(
  run: Pick<ArterialRootBoundaryTimingPhase5AGRun, "status" | "health"> | undefined,
): boolean {
  return run?.status === "measured" && run.health?.status === "ok";
}

function interpretation(args: {
  readonly pointCount: number;
  readonly healthOkCandidateComparisonCount: number;
  readonly qDotAndTimingOutputPreservedCount: number;
  readonly stockQDotAndTimingOutputPreservedCount: number;
  readonly landQDotAndTimingOutputPreservedCount: number;
  readonly outputOrTimingCostCount: number;
  readonly nonOkOrUnmeasuredCount: number;
  readonly normalFloorLandClassification: ArterialRootBoundaryTimingPhase5AGRun["comparisonVsCurrent"]["classification"] | null;
}): string {
  return `Phase 5AG reruns the sourced-calibrated total 2x boundary/root mechanism against current closure over ${args.pointCount} closed-loop points. It records ${args.qDotAndTimingOutputPreservedCount}/${args.healthOkCandidateComparisonCount} measured-health-ok candidate comparisons with both qDot-engagement and valve/load timing signals while preserving output (${args.stockQDotAndTimingOutputPreservedCount} stock, ${args.landQDotAndTimingOutputPreservedCount} Land). Output/timing cost count is ${args.outputOrTimingCostCount}; non-ok or unmeasured runs are ${args.nonOkOrUnmeasuredCount}; normal-floor Land is ${args.normalFloorLandClassification ?? "missing"}. Treat this as diagnostic timing evidence only, not valve/load timing acceptance or root/Zc adoption.`;
}

function hashStable(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(stable(value))).digest("hex");
}

function stable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== "object") return value;
  const object = value as Record<string, unknown>;
  return Object.fromEntries(Object.keys(object).sort().map((key) => [key, stable(object[key])]));
}

function main(): void {
  const evidence = buildArterialRootBoundaryTimingPhase5AGEvidence();
  const outPath = path.resolve(process.cwd(), ARTERIAL_ROOT_BOUNDARY_TIMING_PHASE5AG_RESULT_PATH);
  mkdirSync(path.dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(evidence, null, 2)}\n`);
  console.log(
    `Wrote ${ARTERIAL_ROOT_BOUNDARY_TIMING_PHASE5AG_RESULT_PATH} `
    + `points=${evidence.summary.pointCount} `
    + `qDotTiming=${evidence.summary.qDotAndTimingOutputPreservedCount} `
    + `cost=${evidence.summary.outputOrTimingCostCount}`,
  );
}

function isDirectExecution(): boolean {
  const entrypoint = process.argv[1];
  if (entrypoint && import.meta.url === pathToFileURL(path.resolve(entrypoint)).href) return true;
  const normalizedScriptPath = path.normalize("tools/myocardium/buildArterialRootBoundaryTimingPhase5AG.ts");
  return process.argv.some((arg) => path.normalize(arg).endsWith(normalizedScriptPath));
}

if (isDirectExecution()) {
  main();
}
