import { readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

export const PV_LOOP_CURRENT_MAIN_BASELINE_SNAPSHOT_PATH =
  "data/myocardium/protocols/pv-loop-current-main-baseline-snapshot-v1.json";
export const PV_LOOP_CURRENT_MAIN_BASELINE_SNAPSHOT_DOC_PATH =
  "docs/myocardium/verification/pv-loop-current-main-baseline-snapshot-v1.md";
export const MYOCARDIUM_MORPHOLOGY_README_PATH = "docs/myocardium/morphology/README.md";
export const CURRENT_LANES_PATH = "docs/status/current-lanes.md";

export type ValidationSeverity = "error" | "warning";

export type ValidationIssue = {
  readonly severity: ValidationSeverity;
  readonly code: string;
  readonly path: string;
  readonly message: string;
};

export type TextFileInput = {
  readonly path: string;
  readonly text: string;
};

export type PvLoopCurrentMainBaselineSnapshotValidationInput = {
  readonly snapshot: unknown;
  readonly docs: readonly TextFileInput[];
};

export type PvLoopCurrentMainBaselineSnapshotValidationReport = {
  readonly pass: boolean;
  readonly errors: readonly ValidationIssue[];
  readonly warnings: readonly ValidationIssue[];
  readonly summary: {
    readonly snapshotId: string;
    readonly docCount: number;
    readonly errorCount: number;
    readonly warningCount: number;
  };
};

type JsonRecord = Record<string, unknown>;

const SNAPSHOT_ID = "pv-loop-current-main-baseline-snapshot-v1";
const CLAIM_BOUNDARY = "diagnostic-only-current-baseline-no-acceptance";
const BASE_COMMIT = "5aecda2d1b494aa74fe6c336dde13e8a585c8bf3";
const GENERATED_AT = "2026-06-28T05:31:19.322Z";
const ARTIFACT_ROOT = "artifacts/myocardium/pv-loop-morphology/current-main-baseline-2026-06-28";
const RUNNER_SHA = "054ab09984fb8b966bfd02941d8f5c7665ccfb6963c70133b660f8f9c8cc6de2";
const FILLING_SHA = "d8864a70e6f00c29971c59a3003cbdf312f424169b1d718322b2a25ba69f4b9e";
const ARTERIAL_SHA = "c484b5d6d4445863a2066b459ec6012967c591adbdb28273b08f55fd8e5471c5";
const FILLING_COMPARATOR_COMMAND =
  `npx vite-node tools/myocardium/buildFillingLimbDiagnosticComparator.ts --input=${ARTIFACT_ROOT} --out=${ARTIFACT_ROOT}/filling-limb-diagnostic-comparator`;
const ARTERIAL_COMPARATOR_COMMAND =
  `npx vite-node tools/myocardium/buildArterialLoadZcReflectionDiagnosticComparator.ts --input=${ARTIFACT_ROOT} --out=${ARTIFACT_ROOT}/arterial-load-zc-reflection-diagnostic-comparator`;

const EXPECTED_CASE_IDS = [
  "normal-sinus",
  "acute-anterior-mi",
  "systolic-heart-failure",
  "lv-failure-dobutamine",
] as const;

const EXPECTED_HYPOTHESES = [
  "aov-qdot-clamp-correlation",
  "filling-event-window-correlation",
  "rv-filling-valve-chatter-correlation",
  "sampling-or-display-sensitivity",
] as const;

const EXPECTED_OBSERVATIONS = [
  {
    id: "filling-limb-roughness",
    lane: "filling-limb",
    supportCount: 45,
    metricIds: [
      "lowerLimbKinkCount",
      "tvOpenLowerLimbRoughness",
      "valveOpenCloseChatterCount",
    ],
  },
  {
    id: "event-window-correlation",
    lane: "filling-limb",
    supportCount: 42,
    metricIds: [
      "eventCorrelationWindowHitFraction",
    ],
  },
  {
    id: "aov-qdot-clamp-activity",
    lane: "ejection-limb",
    supportCount: 16635,
    metricIds: [
      "qDotClampHitFraction",
    ],
  },
  {
    id: "sampling-sensitive-metrics",
    lane: "sampling",
    supportCount: 2788,
    metricIds: [
      "aovOpenAoPIncisuraScore",
      "aovOpenEjectionSquareness",
      "arterialPressureIncisuraDepth",
      "cornerSharpnessAtClose",
      "cornerSharpnessAtOpen",
      "ejectionDuration",
      "ejectionPlateauFraction",
      "ejectionTopCurvature",
      "flowChatterCount",
      "incisuraPresenceScore",
      "inletForwardVolume",
      "lowerLimbD2PDV2Integral",
      "lowerLimbDPDVSignChangeCount",
      "lowerLimbKinkCount",
      "lvRvAsymmetryIndex",
      "mvOpenLowerLimbRoughness",
      "openAvLowerLimbRoughness",
      "peakPressureTimingAsFractionOfEjection",
      "phaseCoverageFraction.atrial-kick",
      "phaseCoverageFraction.ejection",
      "phaseCoverageFraction.filling",
      "phaseCoverageFraction.isovolumic-contraction",
      "phaseCoverageFraction.isovolumic-relaxation",
      "phaseCoverageFraction.transition",
    ],
  },
] as const;

const FORBIDDEN_POSITIVE_CLAIM_PATTERN =
  /\b(?:accepted[-\s]+root[-\s]+causes?|root[-\s]+causes?(?:[-\s]+is|[-\s]+are)?[-\s]+accepted|root[-\s]+cause[-\s]+acceptance|accepts?[-\s]+(?:the[-\s]+)?root[-\s]+causes?|root[-\s]+cause\s*\/\s*fix[-\s]+acceptance|accepted[-\s]+fix(?:es)?|fix(?:es)?(?:[-\s]+is|[-\s]+are)?[-\s]+accepted|fix[-\s]+acceptance|accepts?[-\s]+(?:the[-\s]+)?fix(?:es)?|official[-\s]+morphology[-\s]+pass(?:[-\s]+accepted)?|official[-\s]+morphology[-\s]+acceptance|official[-\s]+morphology[-\s]+accepted|runtime[-\s]+replacement|runtime[-\s]+ready|production[-\s]+ready|final[-\s]+no[-\s]+alternans|TriSeg[-\s]+adoption|qDot[-\s]+tuning|tunes?[-\s]+qDot|valve[-\s]+tuning|tunes?[-\s]+valves?|arterial[-\s]+load[-\s]+tuning|tunes?[-\s]+arterial[-\s]+load|Land[-\s]+parameter[-\s]+tuning|tunes?[-\s]+Land[-\s]+parameters?)\b/gi;
const NEGATED_CLAIM_PREFIX_PATTERN =
  /\b(?:no|not|never|without|rejects?|forbid(?:s|den)?|must not|does not|do not|cannot|can not|non[-\s]+acceptance|out[-\s]+of[-\s]+scope)\b(?:[-\s]+(?:an?|the|any|this|that|claim(?:s|ed)?|accept(?:s|ed|ance)?|authorize(?:s|d)?|establish(?:es|ed)?|promote(?:s|d)?|make(?:s)?|root[-\s]+causes?|fix(?:es)?|official|morphology|case|production|runtime|default|accepted|acceptance|pass|ready|final|no[-\s]+alternans|alternans|qDot|valves?|arterial|load|Land|parameters?|tuning|TriSeg|adoption|or|and))*[-\s]*$/i;
const NEGATED_CLAIM_SUFFIX_PATTERN =
  /^\s+(?:(?:is|are|was|were|remains?|must remain)[-\s]+)?(?:not[-\s]+(?:a[-\s]+claim|an[-\s]+acceptance|claimed|authorized|accepted|evidence|covered|used|supported|available|modeled|promoted|validated|a[-\s]+pass|acceptance)|blocked|unsupported|out[-\s]+of[-\s]+scope|deferred)\b/i;
const SENTENCE_BOUNDARY_PATTERN = /[.!?]/g;
const CLAIM_PREFIX_SCOPE_BOUNDARY_PATTERN =
  /[.!?]|\b(?:but|however|yet|nevertheless|nonetheless|while|whereas|although)\b/gi;
const CLAIM_SUFFIX_SCOPE_BOUNDARY_PATTERN =
  /[.!?,;:()[\]\/\u2013\u2014]|\b(?:and|but|however|yet|nevertheless|nonetheless|while|whereas|although)\b/i;
const CLAIM_NEGATION_CONTEXT_CHARS = 160;

export function loadPvLoopCurrentMainBaselineSnapshotValidationInput(
  rootDir = process.cwd(),
): PvLoopCurrentMainBaselineSnapshotValidationInput {
  return {
    snapshot: readJson(path.join(rootDir, PV_LOOP_CURRENT_MAIN_BASELINE_SNAPSHOT_PATH)),
    docs: [
      readTextFile(rootDir, PV_LOOP_CURRENT_MAIN_BASELINE_SNAPSHOT_DOC_PATH),
      readTextFile(rootDir, MYOCARDIUM_MORPHOLOGY_README_PATH),
      readTextFile(rootDir, CURRENT_LANES_PATH),
    ],
  };
}

export function validatePvLoopCurrentMainBaselineSnapshot(
  input: PvLoopCurrentMainBaselineSnapshotValidationInput,
): PvLoopCurrentMainBaselineSnapshotValidationReport {
  const issues: ValidationIssue[] = [];
  const snapshot = isRecord(input.snapshot) ? input.snapshot : {};

  validateSnapshot(snapshot, issues);
  validateNoForbiddenPositiveClaims(PV_LOOP_CURRENT_MAIN_BASELINE_SNAPSHOT_PATH, JSON.stringify(snapshot), issues);
  validateNoLocalAbsolutePaths(PV_LOOP_CURRENT_MAIN_BASELINE_SNAPSHOT_PATH, JSON.stringify(snapshot), issues);
  validateDocs(input.docs, issues);

  const errors = issues.filter((issue) => issue.severity === "error");
  const warnings = issues.filter((issue) => issue.severity === "warning");
  return {
    pass: errors.length === 0,
    errors,
    warnings,
    summary: {
      snapshotId: stringField(snapshot, "id") ?? "unknown",
      docCount: input.docs.length,
      errorCount: errors.length,
      warningCount: warnings.length,
    },
  };
}

function validateSnapshot(snapshot: JsonRecord, issues: ValidationIssue[]): void {
  if (
    snapshot.schemaVersion !== 1
    || snapshot.id !== SNAPSHOT_ID
    || snapshot.status !== "current-main-baseline-snapshot"
    || snapshot.claimBoundary !== CLAIM_BOUNDARY
    || snapshot.baseCommit !== BASE_COMMIT
    || snapshot.generatedAt !== GENERATED_AT
    || snapshot.artifactRoot !== ARTIFACT_ROOT
  ) {
    addIssue(issues, "error", "pv_loop_current_baseline_identity", PV_LOOP_CURRENT_MAIN_BASELINE_SNAPSHOT_PATH, "Current-main baseline snapshot identity, timestamp, base commit, and artifact root must remain fixed.");
  }

  validateRunnerSnapshot(recordField(snapshot, "runnerSnapshot"), issues);
  validateMorphologyEvidence(recordField(snapshot, "morphologyEvidenceSnapshot"), issues);
  validateComparatorSnapshots(recordField(snapshot, "comparatorSnapshots"), issues);
  validateClaimExclusions(recordField(snapshot, "claimExclusions"), issues);
  validateNextExperiments(arrayField(snapshot, "nextRecommendedExperiments"), issues);
  validateDoesNotUnlock(arrayField(snapshot, "doesNotUnlock"), issues);
}

function validateRunnerSnapshot(runner: JsonRecord | undefined, issues: ValidationIssue[]): void {
  if (!runner) {
    addIssue(issues, "error", "pv_loop_current_baseline_runner", "snapshot.runnerSnapshot", "Runner snapshot is missing.");
    return;
  }
  if (
    runner.runnerId !== "pv-loop-morphology-quality-runner-v1"
    || runner.targetPackId !== "pv-loop-morphology-quality-v1"
    || runner.protocolId !== "pv-loop-morphology-quality-v1"
    || runner.claimBoundary !== "diagnostic-only-no-model-change"
    || runner.command !== `npx vite-node tools/myocardium/verifyPvLoopMorphologyQuality.ts --out=${ARTIFACT_ROOT}`
    || runner.summaryArtifactPath !== `${ARTIFACT_ROOT}/summary.json`
    || runner.summarySha256 !== RUNNER_SHA
    || runner.branchCount !== 7
    || runner.metricRowCount !== 17304
    || runner.sampleRowCount !== 60572
  ) {
    addIssue(issues, "error", "pv_loop_current_baseline_runner", "snapshot.runnerSnapshot", "Runner command, hashes, counts, and diagnostic boundary must remain fixed.");
  }
  if (!arrayEquals(arrayField(runner, "caseIds"), EXPECTED_CASE_IDS)) {
    addIssue(issues, "error", "pv_loop_current_baseline_cases", "snapshot.runnerSnapshot.caseIds", "Current baseline must preserve the canonical morphology case list.");
  }
}

function validateMorphologyEvidence(evidence: JsonRecord | undefined, issues: ValidationIssue[]): void {
  if (!evidence) {
    addIssue(issues, "error", "pv_loop_current_baseline_evidence", "snapshot.morphologyEvidenceSnapshot", "Morphology evidence snapshot is missing.");
    return;
  }
  if (
    evidence.snapshotRole !== "current-baseline-diagnostic-context"
    || evidence.acceptanceStatus !== "non-acceptance-context"
  ) {
    addIssue(issues, "error", "pv_loop_current_baseline_evidence", "snapshot.morphologyEvidenceSnapshot", "Evidence snapshot must remain diagnostic non-acceptance context.");
  }

  const observations = arrayField(evidence, "observations").filter(isRecord);
  for (const expected of EXPECTED_OBSERVATIONS) {
    const observation = observations.find((candidate) => candidate.id === expected.id);
    if (
      !observation
      || observation.lane !== expected.lane
      || observation.score !== 1
      || observation.supportCount !== expected.supportCount
      || !arrayEquals(arrayField(observation, "metricIds"), expected.metricIds)
      || !arrayEquals(arrayField(observation, "missingSignals"), [])
    ) {
      addIssue(issues, "error", "pv_loop_current_baseline_observations", `snapshot.morphologyEvidenceSnapshot.observations.${expected.id}`, `Observation ${expected.id} must preserve lane, score, support count, metric ids, and missing-signal boundary.`);
    }
  }

  const hypotheses = arrayField(evidence, "hypotheses").filter(isRecord);
  if (!arrayEquals(hypotheses.map((hypothesis) => String(hypothesis.id)), EXPECTED_HYPOTHESES)) {
    addIssue(issues, "error", "pv_loop_current_baseline_hypotheses", "snapshot.morphologyEvidenceSnapshot.hypotheses", "Hypothesis ids must remain the current supported-correlation set.");
  }
  for (const hypothesis of hypotheses) {
    if (
      hypothesis.evidenceStatus !== "supported-correlation"
      || hypothesis.confidence !== "medium"
      || hypothesis.score !== 1
    ) {
      addIssue(issues, "error", "pv_loop_current_baseline_hypotheses", `snapshot.morphologyEvidenceSnapshot.hypotheses.${String(hypothesis.id)}`, "Current morphology hypotheses must remain medium-confidence supported correlations only.");
    }
  }

  const gaps = arrayField(evidence, "evidenceGaps").filter(isRecord);
  const arterialGap = gaps.find((gap) => gap.id === "ejection-limb-arterial-load-signal-gap");
  if (
    !arterialGap
    || !arrayEquals(arrayField(arterialGap, "missingSignals"), [
      "characteristicImpedancePaSecPerM3",
      "arterialReflectionCoefficient",
    ])
  ) {
    addIssue(issues, "error", "pv_loop_current_baseline_gap", "snapshot.morphologyEvidenceSnapshot.evidenceGaps", "Current baseline must preserve the ejection-limb arterial-load Zc/reflection signal gap.");
  }

  const availability = recordField(evidence, "signalAvailability");
  if (
    !availability
    || availability.aorticRootComplianceM3PerPa !== true
    || availability.pulmonaryRootComplianceM3PerPa !== true
    || availability.characteristicImpedancePaSecPerM3 !== false
    || availability.arterialReflectionCoefficient !== false
  ) {
    addIssue(issues, "error", "pv_loop_current_baseline_signal_availability", "snapshot.morphologyEvidenceSnapshot.signalAvailability", "Signal availability must preserve root compliance available and Zc/reflection unavailable.");
  }
}

function validateComparatorSnapshots(comparators: JsonRecord | undefined, issues: ValidationIssue[]): void {
  if (!comparators) {
    addIssue(issues, "error", "pv_loop_current_baseline_comparators", "snapshot.comparatorSnapshots", "Comparator snapshots are missing.");
    return;
  }
  const filling = recordField(comparators, "fillingLimbDiagnosticComparator");
  if (
    !filling
    || filling.comparatorId !== "filling-limb-diagnostic-comparator-v1"
    || filling.claimBoundary !== "off-by-default-diagnostic-comparison-only"
    || filling.command !== FILLING_COMPARATOR_COMMAND
    || filling.summaryArtifactPath !== `${ARTIFACT_ROOT}/filling-limb-diagnostic-comparator/summary.json`
    || filling.summarySha256 !== FILLING_SHA
    || filling.groupCount !== 42
    || filling.interpretableGroupCount !== 12
    || !arrayEquals(arrayField(filling, "missingAntiGamingReadouts"), ["eaLikeInflowProxy"])
  ) {
    addIssue(issues, "error", "pv_loop_current_baseline_filling_comparator", "snapshot.comparatorSnapshots.fillingLimbDiagnosticComparator", "Filling comparator snapshot must preserve hash, counts, and E/A-like proxy missingness.");
  }

  const arterial = recordField(comparators, "arterialLoadZcReflectionDiagnosticComparator");
  if (
    !arterial
    || arterial.comparatorId !== "arterial-load-zc-reflection-diagnostic-comparator-v1"
    || arterial.claimBoundary !== "off-by-default-diagnostic-comparison-only"
    || arterial.command !== ARTERIAL_COMPARATOR_COMMAND
    || arterial.summaryArtifactPath !== `${ARTIFACT_ROOT}/arterial-load-zc-reflection-diagnostic-comparator/summary.json`
    || arterial.summarySha256 !== ARTERIAL_SHA
    || arterial.groupCount !== 42
    || arterial.interpretableGroupCount !== 42
  ) {
    addIssue(issues, "error", "pv_loop_current_baseline_arterial_comparator", "snapshot.comparatorSnapshots.arterialLoadZcReflectionDiagnosticComparator", "Arterial comparator snapshot must preserve hash, counts, and diagnostic boundary.");
  }
  const missingNoProxy = arrayField(arterial, "missingNoProxySignals").filter(isRecord);
  for (const name of [
    "characteristicImpedancePaSecPerM3",
    "arterialReflectionCoefficient",
    "arterialReflectionDelaySec",
  ] as const) {
    if (!missingNoProxy.some((record) =>
      record.name === name
      && record.status === "missing-no-proxy"
      && record.proxyPolicy === "forbidden"
    )) {
      addIssue(issues, "error", "pv_loop_current_baseline_no_proxy", `snapshot.comparatorSnapshots.arterialLoadZcReflectionDiagnosticComparator.${name}`, `${name} must remain missing-no-proxy with forbidden proxy policy.`);
    }
  }
}

function validateClaimExclusions(exclusions: JsonRecord | undefined, issues: ValidationIssue[]): void {
  if (!exclusions) {
    addIssue(issues, "error", "pv_loop_current_baseline_claim_exclusions", "snapshot.claimExclusions", "Claim exclusions are missing.");
    return;
  }
  for (const key of [
    "rootCauseAccepted",
    "fixAccepted",
    "officialMorphologyAcceptance",
    "runtimeReplacement",
    "officialCaseWiring",
    "qDotTuning",
    "valveTuning",
    "arterialLoadTuning",
    "landParameterTuning",
    "finalNoAlternans",
    "TriSegAdoption",
  ] as const) {
    if (exclusions[key] !== false) {
      addIssue(issues, "error", "pv_loop_current_baseline_claim_exclusions", `snapshot.claimExclusions.${key}`, `${key} must remain false.`);
    }
  }
}

function validateNextExperiments(experiments: readonly unknown[], issues: ValidationIssue[]): void {
  const text = experiments.join("\n");
  for (const token of [
    "E/A-like inflow proxy",
    "isolated arterial bench",
    "BLOCKER, ADVISORY, or OUT-OF-SCOPE-FOR-MYOCARDIUM",
  ] as const) {
    if (!text.includes(token)) {
      addIssue(issues, "error", "pv_loop_current_baseline_next_experiments", "snapshot.nextRecommendedExperiments", `Next experiments must mention ${token}.`);
    }
  }
}

function validateDoesNotUnlock(values: readonly unknown[], issues: ValidationIssue[]): void {
  for (const token of [
    "runtimeReplacement",
    "officialMorphologyAcceptance",
    "rootCauseAcceptance",
    "fixAcceptance",
    "finalNoAlternans",
  ] as const) {
    if (!values.includes(token)) {
      addIssue(issues, "error", "pv_loop_current_baseline_does_not_unlock", "snapshot.doesNotUnlock", `doesNotUnlock must include ${token}.`);
    }
  }
}

function validateDocs(docs: readonly TextFileInput[], issues: ValidationIssue[]): void {
  for (const doc of docs) {
    validateNoForbiddenPositiveClaims(doc.path, doc.text, issues);
    validateNoLocalAbsolutePaths(doc.path, doc.text, issues);
  }
  const snapshotDoc = docs.find((doc) => doc.path === PV_LOOP_CURRENT_MAIN_BASELINE_SNAPSHOT_DOC_PATH);
  if (!snapshotDoc) {
    addIssue(issues, "error", "pv_loop_current_baseline_docs", PV_LOOP_CURRENT_MAIN_BASELINE_SNAPSHOT_DOC_PATH, "Current baseline snapshot doc is missing.");
    return;
  }
  for (const token of [
    CLAIM_BOUNDARY,
    RUNNER_SHA,
    FILLING_SHA,
    ARTERIAL_SHA,
    "missing-no-proxy",
    "not root-cause or fix acceptance",
  ] as const) {
    if (!snapshotDoc.text.includes(token)) {
      addIssue(issues, "error", "pv_loop_current_baseline_docs", snapshotDoc.path, `Snapshot doc must include ${token}.`);
    }
  }
}

function validateNoForbiddenPositiveClaims(pathLabel: string, text: string, issues: ValidationIssue[]): void {
  for (const match of text.matchAll(FORBIDDEN_POSITIVE_CLAIM_PATTERN)) {
    const start = match.index ?? 0;
    if (hasLocalClaimNegation(text, start, match[0].length)) continue;
    if (hasNearbyBoundaryNegation(text, start, match[0].length)) continue;
    addIssue(issues, "error", "pv_loop_current_baseline_forbidden_claim", pathLabel, `Current baseline snapshot must not add acceptance or tuning claims: ${match[0]}.`);
  }
}

function hasNearbyBoundaryNegation(text: string, matchIndex: number, matchLength: number): boolean {
  const window = text
    .slice(Math.max(0, matchIndex - 200), matchIndex + matchLength + 200)
    .toLowerCase();
  return /\b(?:not claimed|not accepted|not authorized|not part of this phase|blocked|unsupported|deferred|does not claim|do not claim|cannot claim|must not claim)\b/.test(window);
}

function hasLocalClaimNegation(text: string, matchIndex: number, matchLength: number): boolean {
  const before = text.slice(0, matchIndex);
  let sentenceStart = 0;
  for (const match of before.matchAll(SENTENCE_BOUNDARY_PATTERN)) {
    sentenceStart = (match.index ?? 0) + match[0].length;
  }
  const localPrefix = claimLocalPrefix(before.slice(sentenceStart))
    .slice(-CLAIM_NEGATION_CONTEXT_CHARS);
  if (NEGATED_CLAIM_PREFIX_PATTERN.test(localPrefix)) return true;
  if (/\b(?:no|not|without|must not|does not|do not|cannot|can not)\b[^.!?]{0,180}$/i.test(localPrefix)) {
    return true;
  }

  const localSuffix = text
    .slice(matchIndex + matchLength, matchIndex + matchLength + CLAIM_NEGATION_CONTEXT_CHARS);
  const suffixBoundaryIndex = localSuffix.search(CLAIM_SUFFIX_SCOPE_BOUNDARY_PATTERN);
  const claimLocalSuffix = localSuffix.slice(
    0,
    suffixBoundaryIndex === -1 ? localSuffix.length : suffixBoundaryIndex,
  );
  return (
    !containsForbiddenPositiveClaim(claimLocalSuffix)
    && NEGATED_CLAIM_SUFFIX_PATTERN.test(claimLocalSuffix)
  );
}

function claimLocalPrefix(sentencePrefix: string): string {
  let scopeStart = 0;
  for (const match of sentencePrefix.matchAll(CLAIM_PREFIX_SCOPE_BOUNDARY_PATTERN)) {
    scopeStart = (match.index ?? 0) + match[0].length;
  }
  return sentencePrefix.slice(scopeStart);
}

function containsForbiddenPositiveClaim(text: string): boolean {
  return new RegExp(FORBIDDEN_POSITIVE_CLAIM_PATTERN.source, "i").test(text);
}

function validateNoLocalAbsolutePaths(pathLabel: string, text: string, issues: ValidationIssue[]): void {
  if (/\/Users\/|\/tmp\//.test(text)) {
    addIssue(issues, "error", "pv_loop_current_baseline_local_path", pathLabel, "Committed snapshot/docs must not contain local absolute artifact paths.");
  }
}

function readJson(filePath: string): unknown {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function readTextFile(rootDir: string, relativePath: string): TextFileInput {
  return {
    path: relativePath,
    text: readFileSync(path.join(rootDir, relativePath), "utf8"),
  };
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function recordField(record: JsonRecord | undefined, key: string): JsonRecord | undefined {
  if (!record) return undefined;
  const value = record[key];
  return isRecord(value) ? value : undefined;
}

function arrayField(record: JsonRecord | undefined, key: string): readonly unknown[] {
  if (!record) return [];
  const value = record[key];
  return Array.isArray(value) ? value : [];
}

function stringField(record: JsonRecord, key: string): string | undefined {
  const value = record[key];
  return typeof value === "string" ? value : undefined;
}

function arrayEquals(actual: readonly unknown[], expected: readonly unknown[]): boolean {
  return actual.length === expected.length
    && expected.every((value, index) => actual[index] === value);
}

function addIssue(
  issues: ValidationIssue[],
  severity: ValidationSeverity,
  code: string,
  issuePath: string,
  message: string,
): void {
  issues.push({ severity, code, path: issuePath, message });
}

function printReport(report: PvLoopCurrentMainBaselineSnapshotValidationReport): void {
  const status = report.pass ? "PASS" : "FAIL";
  // eslint-disable-next-line no-console
  console.log(
    `PV-loop current-main baseline snapshot validation ${status} `
      + `snapshot=${report.summary.snapshotId} errors=${report.summary.errorCount} `
      + `warnings=${report.summary.warningCount} docs=${report.summary.docCount}`,
  );
  for (const issue of [...report.errors, ...report.warnings]) {
    // eslint-disable-next-line no-console
    console.log(`${issue.severity.toUpperCase()} ${issue.code} ${issue.path}: ${issue.message}`);
  }
}

function printUsage(): void {
  // eslint-disable-next-line no-console
  console.log([
    "Usage: npx vite-node tools/myocardium/verifyPvLoopCurrentMainBaselineSnapshot.ts",
    "",
    "Validates the diagnostic-only current-main PV-loop morphology baseline snapshot.",
    "This verifier reads committed snapshot/docs only; generated artifacts remain ignored outputs.",
  ].join("\n"));
}

function isDirectExecution(): boolean {
  const entrypoint = process.argv[1];
  const normalizedScriptPath = path.normalize("tools/myocardium/verifyPvLoopCurrentMainBaselineSnapshot.ts");
  if (entrypoint && import.meta.url === pathToFileURL(path.resolve(entrypoint)).href) return true;
  const isViteNodeEntrypoint = Boolean(entrypoint) && path.basename(entrypoint) === "vite-node";
  const isThisModule = path.normalize(new URL(import.meta.url).pathname).endsWith(normalizedScriptPath);
  return isViteNodeEntrypoint && isThisModule;
}

if (isDirectExecution()) {
  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    printUsage();
    process.exit(0);
  }
  const report = validatePvLoopCurrentMainBaselineSnapshot(
    loadPvLoopCurrentMainBaselineSnapshotValidationInput(),
  );
  printReport(report);
  if (!report.pass) process.exit(1);
}
