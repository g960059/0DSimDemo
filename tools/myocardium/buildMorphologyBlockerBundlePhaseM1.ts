import { createHash } from "node:crypto";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import phase5WArtifact from "@/data/myocardium/protocols/myocardium-developer-only-lv-land-envelope-phase5w-result-v1.json";
import {
  runPvLoopMorphologyDiagnostic,
  type MetricRow,
  type MorphologyEvidenceSummary,
  type RootCauseHypothesis,
  type MorphologyObservation,
} from "@/tools/myocardium/verifyPvLoopMorphologyQuality";
import {
  buildFillingLimbDiagnosticComparison,
  type ComparatorMetricRow as FillingComparatorMetricRow,
  type FillingLimbDiagnosticComparatorSummary,
} from "@/tools/myocardium/buildFillingLimbDiagnosticComparator";
import {
  buildArterialLoadZcReflectionDiagnosticComparison,
  type ComparatorMetricRow as ArterialComparatorMetricRow,
  type ArterialLoadZcReflectionDiagnosticComparatorSummary,
} from "@/tools/myocardium/buildArterialLoadZcReflectionDiagnosticComparator";

export const MORPHOLOGY_BLOCKER_BUNDLE_PHASE_M1_ID =
  "morphology-blocker-bundle-phase-m1-result-v1";

export const MORPHOLOGY_BLOCKER_BUNDLE_PHASE_M1_RESULT_PATH =
  "data/myocardium/protocols/morphology-blocker-bundle-phase-m1-result-v1.json";

const BASE_COMMIT = "503d6555f4ff46cf677abcc620dd939580efa238";
const REFERENCE_ARTIFACT_ROOT =
  "artifacts/myocardium/pv-loop-morphology/morphology-blocker-bundle-phase-m1";
const CASE_IDS = [
  "normal-sinus",
  "acute-anterior-mi",
  "systolic-heart-failure",
  "lv-failure-dobutamine",
] as const;

type ResidualFillingGroup = {
  readonly caseId: string;
  readonly branchId: string;
  readonly branchName: string;
  readonly beatIndex: number;
  readonly chamber: "LV" | "RV";
  readonly uninterpretableReasons: readonly string[];
  readonly missingReadouts: readonly string[];
  readonly availableAntiGamingReadouts: readonly string[];
  readonly missingOnlyEaLikeInflowProxy: boolean;
};

type NoProxySignal = {
  readonly name: string;
  readonly status: "missing-no-proxy";
  readonly proxyPolicy: "forbidden";
  readonly promotesHypothesis: false;
};

type BlockerClassification = {
  readonly id: string;
  readonly lane: "filling-limb" | "arterial-load" | "sampling";
  readonly resultClass: "BLOCKER" | "ADVISORY" | "OUT-OF-SCOPE-FOR-MYOCARDIUM";
  readonly status: string;
  readonly interpretation: string;
  readonly blocks: readonly string[];
};

export type MorphologyBlockerBundlePhaseM1Evidence = {
  readonly schemaVersion: 1;
  readonly id: typeof MORPHOLOGY_BLOCKER_BUNDLE_PHASE_M1_ID;
  readonly phase: "Phase M1";
  readonly claimBoundary: "diagnostic-only-current-main-morphology-blocker-classification-no-acceptance";
  readonly baseCommit: typeof BASE_COMMIT;
  readonly upstreamPhase5WArtifactId: typeof phase5WArtifact.id;
  readonly verifierScript: "verify:myocardium-morphology-blocker-bundle";
  readonly scope: {
    readonly name: "post-pr219-current-main-morphology-blocker-classification";
    readonly doesNotResolveFullMorphologyBlockerSet: true;
    readonly doesNotRunPairedLvLandVsStockMorphologyMatrix: true;
    readonly doesNotRunIsolatedArterialBench: true;
  };
  readonly runner: {
    readonly runnerVersion: string;
    readonly targetPackId: string;
    readonly protocolId: string;
    readonly claimBoundary: string;
    readonly reproducibleCommand: string;
    readonly referenceArtifactRoot: typeof REFERENCE_ARTIFACT_ROOT;
    readonly artifactRetention: "large-runner-artifacts-generated-in-temp-and-not-committed";
    readonly normalizedSummarySha256: string;
    readonly inputArtifactHashes: Record<string, string>;
    readonly caseIds: readonly string[];
    readonly branchCount: number;
    readonly metricRowCount: number;
    readonly sampleRowCount: number;
    readonly warningCount: number;
    readonly errorCount: number;
  };
  readonly morphologyEvidenceSnapshot: {
    readonly observations: readonly Pick<MorphologyObservation, "id" | "lane" | "score" | "supportCount" | "metricIds" | "missingSignals">[];
    readonly hypotheses: readonly Pick<RootCauseHypothesis, "id" | "lane" | "evidenceStatus" | "confidence" | "score" | "observations" | "missingSignals">[];
    readonly evidenceGaps: MorphologyEvidenceSummary["evidenceGaps"];
  };
  readonly filling: {
    readonly comparatorId: "filling-limb-diagnostic-comparator-v1";
    readonly claimBoundary: "off-by-default-diagnostic-comparison-only";
    readonly reproducibleCommand: string;
    readonly normalizedSummarySha256: string;
    readonly groupCount: number;
    readonly interpretableGroupCount: number;
    readonly uninterpretableGroupCount: number;
    readonly residualClassification: "ea-like-proxy-specific-missingness";
    readonly residualGroups: readonly ResidualFillingGroup[];
    readonly allOtherAntiGamingReadoutsAvailableForResidualGroups: boolean;
  };
  readonly arterial: {
    readonly comparatorId: "arterial-load-zc-reflection-diagnostic-comparator-v1";
    readonly claimBoundary: "off-by-default-diagnostic-comparison-only";
    readonly reproducibleCommand: string;
    readonly normalizedSummarySha256: string;
    readonly groupCount: number;
    readonly interpretableGroupCount: number;
    readonly missingNoProxySignals: readonly NoProxySignal[];
    readonly noProxySignalsAllForbidden: boolean;
    readonly hypothesisPromotion: "not-promoted-no-proxy";
    readonly directZcReflectionEvidenceStatus: "missing-no-proxy";
  };
  readonly blockerClassifications: readonly BlockerClassification[];
  readonly boundary: {
    readonly noRuntimeReplacement: true;
    readonly noOfficialCaseWiring: true;
    readonly noWorkbenchRuntimeWiring: true;
    readonly noProductionRegistryIntegration: true;
    readonly noStateSchemaMigration: true;
    readonly noRootCauseAcceptance: true;
    readonly noFixAcceptance: true;
    readonly noOfficialMorphologyAcceptance: true;
    readonly noFinalNoAlternansAcceptance: true;
    readonly noQDotTuning: true;
    readonly noValveTuning: true;
    readonly noArterialLoadTuning: true;
    readonly noPreloadTuning: true;
    readonly noLandParameterTuning: true;
    readonly noSourceStressScaling: true;
  };
  readonly doesNotUnlock: readonly string[];
  readonly nextRecommendedExperiments: readonly string[];
};

export function buildMorphologyBlockerBundlePhaseM1Evidence():
MorphologyBlockerBundlePhaseM1Evidence {
  const tempDir = mkdtempSync(path.join(tmpdir(), "morphology-blocker-bundle-phase-m1-"));
  try {
    const runnerOutDir = path.join(tempDir, "pv-loop-morphology");
    const diagnostic = runPvLoopMorphologyDiagnostic({ outDir: runnerOutDir, caseIds: [...CASE_IDS] });
    const metricRows = diagnostic.metricRows;
    const filling = buildFillingLimbDiagnosticComparison(
      metricRows as unknown as FillingComparatorMetricRow[],
      { inputDir: REFERENCE_ARTIFACT_ROOT, sourceSummary: diagnostic.summary },
    );
    const arterial = buildArterialLoadZcReflectionDiagnosticComparison(
      metricRows as unknown as ArterialComparatorMetricRow[],
      { inputDir: REFERENCE_ARTIFACT_ROOT, sourceSummary: diagnostic.summary },
    );

    const residualGroups = residualFillingGroups(filling);
    const missingNoProxySignals = arterialNoProxySignals(arterial);

    return {
      schemaVersion: 1,
      id: MORPHOLOGY_BLOCKER_BUNDLE_PHASE_M1_ID,
      phase: "Phase M1",
      claimBoundary: "diagnostic-only-current-main-morphology-blocker-classification-no-acceptance",
      baseCommit: BASE_COMMIT,
      upstreamPhase5WArtifactId: phase5WArtifact.id,
      verifierScript: "verify:myocardium-morphology-blocker-bundle",
      scope: {
        name: "post-pr219-current-main-morphology-blocker-classification",
        doesNotResolveFullMorphologyBlockerSet: true,
        doesNotRunPairedLvLandVsStockMorphologyMatrix: true,
        doesNotRunIsolatedArterialBench: true,
      },
      runner: {
        runnerVersion: diagnostic.summary.runnerVersion,
        targetPackId: diagnostic.summary.targetPackId,
        protocolId: diagnostic.summary.protocolId,
        claimBoundary: diagnostic.summary.claimBoundary,
        reproducibleCommand:
          `npx vite-node --script tools/myocardium/verifyPvLoopMorphologyQuality.ts --out=${REFERENCE_ARTIFACT_ROOT}`,
        referenceArtifactRoot: REFERENCE_ARTIFACT_ROOT,
        artifactRetention: "large-runner-artifacts-generated-in-temp-and-not-committed",
        normalizedSummarySha256: sha256Stable(normalizedRunnerSummary(diagnostic.summary, metricRows, diagnostic.phaseRows)),
        inputArtifactHashes: diagnostic.summary.inputArtifactHashes,
        caseIds: diagnostic.summary.caseIds,
        branchCount: diagnostic.summary.branches.length,
        metricRowCount: metricRows.length,
        sampleRowCount: diagnostic.phaseRows.length,
        warningCount: diagnostic.summary.warnings.length,
        errorCount: diagnostic.summary.errors.length,
      },
      morphologyEvidenceSnapshot: compactMorphologyEvidence(diagnostic.summary.morphologyEvidence),
      filling: {
        comparatorId: filling.comparatorId,
        claimBoundary: filling.claimBoundary,
        reproducibleCommand:
          `npx vite-node --script tools/myocardium/buildFillingLimbDiagnosticComparator.ts --input=${REFERENCE_ARTIFACT_ROOT} --out=${REFERENCE_ARTIFACT_ROOT}/filling-limb-diagnostic-comparator`,
        normalizedSummarySha256: sha256Stable(normalizedFillingSummary(filling)),
        groupCount: filling.groupCount,
        interpretableGroupCount: filling.interpretableGroupCount,
        uninterpretableGroupCount: filling.groupCount - filling.interpretableGroupCount,
        residualClassification: "ea-like-proxy-specific-missingness",
        residualGroups,
        allOtherAntiGamingReadoutsAvailableForResidualGroups:
          residualGroups.every((group) => group.missingOnlyEaLikeInflowProxy),
      },
      arterial: {
        comparatorId: arterial.comparatorId,
        claimBoundary: arterial.claimBoundary,
        reproducibleCommand:
          `npx vite-node --script tools/myocardium/buildArterialLoadZcReflectionDiagnosticComparator.ts --input=${REFERENCE_ARTIFACT_ROOT} --out=${REFERENCE_ARTIFACT_ROOT}/arterial-load-zc-reflection-diagnostic-comparator`,
        normalizedSummarySha256: sha256Stable(normalizedArterialSummary(arterial)),
        groupCount: arterial.groupCount,
        interpretableGroupCount: arterial.interpretableGroupCount,
        missingNoProxySignals,
        noProxySignalsAllForbidden: missingNoProxySignals.every((signal) =>
          signal.status === "missing-no-proxy"
          && signal.proxyPolicy === "forbidden"
          && signal.promotesHypothesis === false
        ),
        hypothesisPromotion: "not-promoted-no-proxy",
        directZcReflectionEvidenceStatus: "missing-no-proxy",
      },
      blockerClassifications: [
        {
          id: "rv-dobutamine-filling-ea-proxy-gap",
          lane: "filling-limb",
          resultClass: "BLOCKER",
          status: "residual-ea-like-proxy-specific-missingness",
          interpretation:
            "Only lv-failure-dobutamine branch 1 RV beats 1-3 remain filling-comparator uninterpretable, because eaLikeInflowProxy is missing while the other anti-gaming readouts are available.",
          blocks: [
            "official RV filling morphology interpretation for the dobutamine LV-failure branch",
            "using the residual filling result as a myocardium source acceptance argument",
          ],
        },
        {
          id: "arterial-zc-reflection-no-proxy-gap",
          lane: "arterial-load",
          resultClass: "OUT-OF-SCOPE-FOR-MYOCARDIUM",
          status: "direct-zc-reflection-signal-gap",
          interpretation:
            "Arterial comparator groups are internally interpretable, but characteristic impedance and reflection signals are explicitly missing with proxy use forbidden.",
          blocks: [
            "arterial-load root-cause acceptance",
            "Zc/reflection fix acceptance",
            "myocardium parameter tuning to buy ejection morphology",
          ],
        },
        {
          id: "sampling-sensitive-morphology-metrics",
          lane: "sampling",
          resultClass: "ADVISORY",
          status: "sampling-sensitive-metrics-present",
          interpretation:
            "Sampling-sensitive PV-loop metrics remain diagnostic context and must not be converted into a model fix without raw-trace confirmation.",
          blocks: [
            "display-only morphology pass claims",
          ],
        },
      ],
      boundary: {
        noRuntimeReplacement: true,
        noOfficialCaseWiring: true,
        noWorkbenchRuntimeWiring: true,
        noProductionRegistryIntegration: true,
        noStateSchemaMigration: true,
        noRootCauseAcceptance: true,
        noFixAcceptance: true,
        noOfficialMorphologyAcceptance: true,
        noFinalNoAlternansAcceptance: true,
        noQDotTuning: true,
        noValveTuning: true,
        noArterialLoadTuning: true,
        noPreloadTuning: true,
        noLandParameterTuning: true,
        noSourceStressScaling: true,
      },
      doesNotUnlock: [
        "runtimeReplacement",
        "officialCaseWiring",
        "workbenchRuntimeWiring",
        "productionRegistryIntegration",
        "stateSchemaMigration",
        "rootCauseAcceptance",
        "fixAcceptance",
        "officialMorphologyAcceptance",
        "finalNoAlternans",
        "qDotTuning",
        "valveTuning",
        "arterialLoadTuning",
        "preloadTuning",
        "landParameterTuning",
        "sourceStressScaling",
        "pairedLvLandVsStockMorphologyAcceptance",
        "isolatedArterialBenchAcceptance",
      ],
      nextRecommendedExperiments: [
        "run a paired stock-active versus developer-only LV Land morphology matrix under the same official-case diagnostic runner",
        "run an isolated arterial bench that emits direct Zc/reflection evidence rather than proxying from waveform shape",
        "derive or emit the missing dobutamine RV eaLikeInflowProxy for the three residual filling groups",
      ],
    };
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
}

function residualFillingGroups(summary: FillingLimbDiagnosticComparatorSummary): ResidualFillingGroup[] {
  return summary.groups
    .filter((group) => !group.interpretable)
    .map((group) => {
      const missingReadouts = group.antiGamingReadouts
        .filter((readout) => readout.status === "missing")
        .map((readout) => readout.name);
      const availableAntiGamingReadouts = group.antiGamingReadouts
        .filter((readout) => readout.status === "available")
        .map((readout) => readout.name);
      return {
        caseId: group.caseId,
        branchId: group.branchId,
        branchName: group.branchName,
        beatIndex: group.beatIndex,
        chamber: group.chamber,
        uninterpretableReasons: group.uninterpretableReasons,
        missingReadouts,
        availableAntiGamingReadouts,
        missingOnlyEaLikeInflowProxy:
          missingReadouts.length === 1 && missingReadouts[0] === "eaLikeInflowProxy",
      };
    });
}

function arterialNoProxySignals(summary: ArterialLoadZcReflectionDiagnosticComparatorSummary): NoProxySignal[] {
  const byName = new Map<string, NoProxySignal>();
  for (const group of summary.groups) {
    for (const signal of group.missingNoProxySignals) {
      byName.set(signal.name, {
        name: signal.name,
        status: signal.status,
        proxyPolicy: signal.proxyPolicy,
        promotesHypothesis: signal.promotesHypothesis,
      });
    }
  }
  return [...byName.values()].sort((left, right) => left.name.localeCompare(right.name));
}

function compactMorphologyEvidence(evidence: MorphologyEvidenceSummary):
MorphologyBlockerBundlePhaseM1Evidence["morphologyEvidenceSnapshot"] {
  return {
    observations: evidence.observations.map((observation) => ({
      id: observation.id,
      lane: observation.lane,
      score: observation.score,
      supportCount: observation.supportCount,
      metricIds: observation.metricIds,
      missingSignals: observation.missingSignals,
    })),
    hypotheses: evidence.rootCauseHypotheses.map((hypothesis) => ({
      id: hypothesis.id,
      lane: hypothesis.lane,
      evidenceStatus: hypothesis.evidenceStatus,
      confidence: hypothesis.confidence,
      score: hypothesis.score,
      observations: hypothesis.observations,
      missingSignals: hypothesis.missingSignals,
    })),
    evidenceGaps: evidence.evidenceGaps,
  };
}

function normalizedRunnerSummary(
  summary: ReturnType<typeof runPvLoopMorphologyDiagnostic>["summary"],
  metricRows: readonly MetricRow[],
  phaseRows: readonly unknown[],
): unknown {
  return {
    targetPackId: summary.targetPackId,
    protocolId: summary.protocolId,
    claimBoundary: summary.claimBoundary,
    runnerVersion: summary.runnerVersion,
    measurementProfile: summary.measurementProfile,
    derivativeProfile: summary.derivativeProfile,
    classificationProfile: summary.classificationProfile,
    caseIds: summary.caseIds,
    samplingModes: summary.samplingModes,
    transitionPolicies: summary.transitionPolicies,
    signalAvailability: summary.signalAvailability,
    inputArtifactHashes: summary.inputArtifactHashes,
    guardrailResults: summary.guardrailResults,
    morphologyEvidence: summary.morphologyEvidence,
    samplingInvarianceDelta: summary.samplingInvarianceDelta,
    branches: summary.branches.map((branch) => ({
      caseId: branch.caseId,
      branchId: branch.branchId,
      branchName: branch.branchName,
      settle: branch.settle,
      metricCount: branch.metricCount,
      sampleCount: branch.sampleCount,
    })),
    warnings: summary.warnings,
    errors: summary.errors,
    metricRowCount: metricRows.length,
    sampleRowCount: phaseRows.length,
  };
}

function normalizedFillingSummary(summary: FillingLimbDiagnosticComparatorSummary): unknown {
  return {
    comparatorId: summary.comparatorId,
    claimBoundary: summary.claimBoundary,
    identityRequirements: summary.identityRequirements,
    antiGamingReadoutRequirements: summary.antiGamingReadoutRequirements,
    rowCount: summary.rowCount,
    groupCount: summary.groupCount,
    interpretableGroupCount: summary.interpretableGroupCount,
    groups: summary.groups,
    warnings: summary.warnings,
  };
}

function normalizedArterialSummary(summary: ArterialLoadZcReflectionDiagnosticComparatorSummary): unknown {
  return {
    comparatorId: summary.comparatorId,
    claimBoundary: summary.claimBoundary,
    identityRequirements: summary.identityRequirements,
    primaryEjectionMetricIds: summary.primaryEjectionMetricIds,
    noProxySignalRequirements: summary.noProxySignalRequirements,
    antiGamingReadoutRequirements: summary.antiGamingReadoutRequirements,
    rowCount: summary.rowCount,
    groupCount: summary.groupCount,
    interpretableGroupCount: summary.interpretableGroupCount,
    groups: summary.groups,
    warnings: summary.warnings,
  };
}

function sha256Stable(value: unknown): string {
  return createHash("sha256").update(stableStringify(value)).digest("hex");
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const entries = Object.entries(value as Record<string, unknown>).sort(([left], [right]) =>
    left < right ? -1 : left > right ? 1 : 0
  );
  return `{${entries.map(([key, child]) => `${JSON.stringify(key)}:${stableStringify(child)}`).join(",")}}`;
}

function isDirectExecution(): boolean {
  const entrypoint = process.argv[1];
  if (entrypoint && import.meta.url === pathToFileURL(path.resolve(entrypoint)).href) return true;
  const normalizedScriptPath = path.normalize("tools/myocardium/buildMorphologyBlockerBundlePhaseM1.ts");
  return process.argv.some((arg) => path.normalize(arg).endsWith(normalizedScriptPath));
}

if (isDirectExecution()) {
  const evidence = buildMorphologyBlockerBundlePhaseM1Evidence();
  if (process.argv.includes("--write")) {
    const outPath = path.join(process.cwd(), MORPHOLOGY_BLOCKER_BUNDLE_PHASE_M1_RESULT_PATH);
    mkdirSync(path.dirname(outPath), { recursive: true });
    writeFileSync(outPath, `${JSON.stringify(evidence, null, 2)}\n`);
    console.log(`Wrote ${outPath}`);
  } else {
    console.log(JSON.stringify(evidence, null, 2));
  }
}
