import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

export const ARTERIAL_LOAD_ZC_REFLECTION_COMPARATOR_PROTOCOL_PATH =
  "data/myocardium/protocols/arterial-load-zc-reflection-comparator-v1.json";
export const ARTERIAL_LOAD_ZC_REFLECTION_COMPARATOR_DOC_PATH =
  "docs/myocardium/verification/arterial-load-zc-reflection-comparator-v1.md";
export const MYOCARDIUM_README_PATH = "docs/myocardium/README.md";

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

export type ArterialLoadZcReflectionComparatorValidationInput = {
  readonly protocol: unknown;
  readonly docs: readonly TextFileInput[];
  readonly runtimeIntegrationFiles: readonly TextFileInput[];
  readonly packageJsonText: string;
};

export type ArterialLoadZcReflectionComparatorValidationReport = {
  readonly pass: boolean;
  readonly errors: readonly ValidationIssue[];
  readonly warnings: readonly ValidationIssue[];
  readonly summary: {
    readonly protocolId: string;
    readonly docCount: number;
    readonly runtimeIntegrationFileCount: number;
    readonly packageScriptCount: number;
    readonly errorCount: number;
    readonly warningCount: number;
  };
};

type JsonRecord = Record<string, unknown>;

const PROTOCOL_ID = "arterial-load-zc-reflection-comparator-v1";
const CLAIM_BOUNDARY = "zc-reflection-comparator-readiness-only";

const RUNTIME_INTEGRATION_TARGETS = [
  "index.tsx",
  "WorkbenchPage.tsx",
  "caseCloud.ts",
  "caseDoc.ts",
  "casePersist.ts",
  "caseValidation.ts",
  "components",
  "components/workbench",
  "engine/ModelCore.ts",
  "engine/caseBaselines.ts",
  "engine/caseResolve.ts",
  "engine/chambers.ts",
  "engine/guytonStarlingChainWorker.ts",
  "engine/guytonStarlingChainWorkerCore.ts",
  "engine/guytonStarlingChainProtocol.ts",
  "engine/guytonStarlingWorker.ts",
  "engine/guytonStarlingWorkerCore.ts",
  "engine/harness.ts",
  "engine/previewController.ts",
  "engine/previewWorker.ts",
  "engine/previewWorkerProtocol.ts",
  "engine/protocol.ts",
  "engine/stateContract.ts",
  "engine/steadyJob.ts",
  "engine/transitionSteadyProtocol.ts",
  "engine/transitionSteadyWorker.ts",
  "engine/core/stateLayout.ts",
  "features/workbench",
  "officialCases.ts",
  "tools/myocardium/verifyPvLoopMorphologyQuality.ts",
  "tools/verifyCases.ts",
  "data/cases",
  "public/cases",
] as const;

const COMPARATOR_RUNTIME_TOKENS = [
  PROTOCOL_ID,
  "arterial-load-zc-reflection-comparator-readiness",
  "arterialLoadZcReflectionComparator",
  "ZcReflectionComparator",
  "runArterialLoadZcReflectionComparator",
  "verifyArterialLoadZcReflectionComparatorReadiness",
] as const;

const PACKAGE_SCRIPT_TOKENS = [
  "verify:myocardium-arterial-load-zc-reflection-comparator-readiness",
  "tools/myocardium/verifyArterialLoadZcReflectionComparatorReadiness.ts",
  ...COMPARATOR_RUNTIME_TOKENS,
] as const;

const REQUIRED_NO_PROXY_SIGNALS = [
  "characteristicImpedancePaSecPerM3",
  "arterialReflectionCoefficient",
  "arterialReflectionDelaySec",
] as const;

const REQUIRED_ANTI_GAMING_READOUTS = [
  "strokeVolumeM3",
  "cardiacOutputM3PerSec",
  "strokeWorkJ",
  "peakPressurePa",
  "ejectionDurationSec",
  "semilunarReverseVolumeM3",
  "qDotClampHitFraction",
] as const;

const FORBIDDEN_POSITIVE_CLAIM_PATTERN =
  /\b(?:production[-\s]?ready|runtime[-\s]?wired|default[-\s]+enabled|enabled by default|official morphology pass accepted|official morphology accepted|accepted official morphology|production morphology pass|official-case ready|official case ready)\b/gi;
const NEGATED_CLAIM_PREFIX_PATTERN =
  /\b(?:no|not|without|forbid(?:s|den)?|must not|does not|do not|makes no)\b/i;
const SENTENCE_BOUNDARY_PATTERN = /[.!?]/g;
const CLAIM_NEGATION_CONTEXT_CHARS = 120;

export function loadArterialLoadZcReflectionComparatorValidationInput(
  rootDir = process.cwd(),
): ArterialLoadZcReflectionComparatorValidationInput {
  return {
    protocol: readJson(path.join(rootDir, ARTERIAL_LOAD_ZC_REFLECTION_COMPARATOR_PROTOCOL_PATH)),
    docs: [
      readTextFile(rootDir, ARTERIAL_LOAD_ZC_REFLECTION_COMPARATOR_DOC_PATH),
      readTextFile(rootDir, MYOCARDIUM_README_PATH),
    ],
    runtimeIntegrationFiles: loadRuntimeIntegrationFiles(rootDir),
    packageJsonText: readFileSync(path.join(rootDir, "package.json"), "utf8"),
  };
}

export function validateArterialLoadZcReflectionComparatorReadiness(
  input: ArterialLoadZcReflectionComparatorValidationInput,
): ArterialLoadZcReflectionComparatorValidationReport {
  const issues: ValidationIssue[] = [];
  const protocol = isRecord(input.protocol) ? input.protocol : {};

  validateProtocol(protocol, issues);
  validateNoForbiddenPositiveClaims(ARTERIAL_LOAD_ZC_REFLECTION_COMPARATOR_PROTOCOL_PATH, JSON.stringify(protocol), issues);
  validateDocs(input.docs, issues);
  validateRuntimeIntegrationScan(input.runtimeIntegrationFiles, issues);
  validatePackageScripts(input.packageJsonText, issues);

  const errors = issues.filter((issue) => issue.severity === "error");
  const warnings = issues.filter((issue) => issue.severity === "warning");
  return {
    pass: errors.length === 0,
    errors,
    warnings,
    summary: {
      protocolId: stringField(protocol, "id") ?? "unknown",
      docCount: input.docs.length,
      runtimeIntegrationFileCount: input.runtimeIntegrationFiles.length,
      packageScriptCount: packageScriptEntries(input.packageJsonText).length,
      errorCount: errors.length,
      warningCount: warnings.length,
    },
  };
}

function validateProtocol(protocol: JsonRecord, issues: ValidationIssue[]): void {
  if (
    protocol.schemaVersion !== 1
    || protocol.id !== PROTOCOL_ID
    || protocol.status !== "proposed"
    || protocol.claimBoundary !== CLAIM_BOUNDARY
  ) {
    addIssue(issues, "error", "zc_reflection_protocol_identity", ARTERIAL_LOAD_ZC_REFLECTION_COMPARATOR_PROTOCOL_PATH, "Protocol identity must remain proposed readiness-only v1.");
  }

  validateRuntimeBoundary(recordField(protocol, "runtimeBoundary"), issues);
  validateEvidenceSnapshot(recordField(protocol, "pr181BaseEvidenceSnapshot"), issues);
  validateNoProxyBoundary(recordField(protocol, "currentRuntimeSignalBoundary"), issues);
  validateFutureRequirements(recordField(protocol, "futureComparatorRequirements"), issues);
  validateClaimExclusions(recordField(protocol, "claimExclusions"), issues);
}

function validateRuntimeBoundary(boundary: JsonRecord | undefined, issues: ValidationIssue[]): void {
  if (!boundary) {
    addIssue(issues, "error", "zc_reflection_runtime_boundary", "protocol.runtimeBoundary", "Runtime boundary is missing.");
    return;
  }
  for (const [key, expected] of Object.entries({
    implementationStatus: "not-implemented",
    comparatorActivation: "off-by-default",
    defaultRuntimeWiring: "forbidden",
    officialCaseWiring: "forbidden",
    packageScriptWiring: "forbidden",
    uiRuntimeWiring: "forbidden",
    productionWiring: "forbidden",
    modelEquationChange: "forbidden",
    solverBehaviorChange: "forbidden",
    officialCaseParameterChange: "forbidden",
    signalAvailabilityChange: "forbidden",
  })) {
    if (boundary[key] !== expected) {
      addIssue(issues, "error", "zc_reflection_runtime_boundary", `protocol.runtimeBoundary.${key}`, `${key} must remain ${expected}.`);
    }
  }
}

function validateEvidenceSnapshot(snapshot: JsonRecord | undefined, issues: ValidationIssue[]): void {
  if (!snapshot) {
    addIssue(issues, "error", "zc_reflection_evidence_snapshot", "protocol.pr181BaseEvidenceSnapshot", "PR #181-base evidence snapshot is missing.");
    return;
  }
  if (
    snapshot.source !== "PR #181-base"
    || snapshot.snapshotRole !== "historical-non-acceptance-context"
    || snapshot.acceptanceStatus !== "non-acceptance-context"
  ) {
    addIssue(issues, "error", "zc_reflection_evidence_snapshot", "protocol.pr181BaseEvidenceSnapshot", "Snapshot must be PR #181-base historical non-acceptance context.");
  }
  const provenance = recordField(snapshot, "provenance");
  if (
    !provenance
    || provenance.baseCommit !== "543b74434bbb42de629cccb760153ddcc06407ee"
    || provenance.runnerCommand !== "npx vite-node tools/myocardium/verifyPvLoopMorphologyQuality.ts --out=artifacts/myocardium/pv-loop-morphology/zc-reflection-baseline-2026-06-28"
    || provenance.summaryArtifactPath !== "artifacts/myocardium/pv-loop-morphology/zc-reflection-baseline-2026-06-28/summary.json"
    || provenance.summarySha256 !== "0c6c3c52a7799f8df712b76de4a3be0399089c251a4ed4e389a7353e78dcb1e4"
  ) {
    addIssue(issues, "error", "zc_reflection_evidence_snapshot", "protocol.pr181BaseEvidenceSnapshot.provenance", "Snapshot must preserve base commit, runner command, summary artifact path, and summary SHA-256 provenance.");
  }

  const observations = arrayField(snapshot, "observations");
  const requiredObservations = [
    { id: "max-raw-core-squareness", metric: "maxRawCoreSquareness", value: 0.328, comparison: "less-than", threshold: 0.55 },
    { id: "max-raw-core-plateau", metric: "maxRawCorePlateau", value: 0.229, comparison: "less-than", threshold: 0.45 },
    { id: "min-raw-core-incisura-score", metric: "minRawCoreIncisuraScore", value: 0.188, comparison: "greater-than", threshold: 0.1 },
  ] as const;
  for (const required of requiredObservations) {
    const observed = observations
      .filter(isRecord)
      .find((candidate) => candidate.id === required.id);
    if (
      !observed
      || observed.metric !== required.metric
      || observed.value !== required.value
      || observed.comparison !== required.comparison
      || observed.threshold !== required.threshold
      || !/not acceptance|non-acceptance/i.test(String(observed.interpretation ?? ""))
    ) {
      addIssue(issues, "error", "zc_reflection_evidence_snapshot", `protocol.pr181BaseEvidenceSnapshot.observations.${required.id}`, `${required.metric} snapshot must preserve ${required.value} ${required.comparison} ${required.threshold} as non-acceptance context.`);
    }
  }

  const runner = recordField(snapshot, "runnerEmissionSnapshot");
  if (
    !runner
    || runner.arterialLoadStructureHypothesis !== "not-emitted"
    || runner.zcReflectionHandoff !== "ejection-limb-arterial-load-signal-gap-only"
  ) {
    addIssue(issues, "error", "zc_reflection_evidence_snapshot", "protocol.pr181BaseEvidenceSnapshot.runnerEmissionSnapshot", "Runner snapshot must record no arterial-load-structure-hypothesis and only the ejection-limb Zc/reflection signal gap.");
  }
}

function validateNoProxyBoundary(boundary: JsonRecord | undefined, issues: ValidationIssue[]): void {
  if (!boundary) {
    addIssue(issues, "error", "zc_reflection_no_proxy_boundary", "protocol.currentRuntimeSignalBoundary", "Current no-proxy signal boundary is missing.");
    return;
  }
  if (
    boundary.status !== "zc-reflection-unavailable-no-proxy"
    || boundary.futureCandidateFieldPolicy !== "future-candidate-fields-alone-must-not-promote-hypotheses"
    || boundary.interpretabilityGate !== "comparative-raw-vs-resampled-metrics-plus-anti-gaming-readouts"
  ) {
    addIssue(issues, "error", "zc_reflection_no_proxy_boundary", "protocol.currentRuntimeSignalBoundary", "Current runtime must remain unavailable/no-proxy and candidate fields alone must not promote hypotheses.");
  }
  const signals = arrayField(boundary, "notModeledSignals").filter(isRecord);
  for (const signalName of REQUIRED_NO_PROXY_SIGNALS) {
    const signal = signals.find((candidate) => candidate.name === signalName);
    if (
      !signal
      || signal.boundary !== "unavailable-no-proxy"
      || signal.proxyPolicy !== "forbidden"
    ) {
      addIssue(issues, "error", "zc_reflection_no_proxy_boundary", `protocol.currentRuntimeSignalBoundary.notModeledSignals.${signalName}`, `${signalName} must remain unavailable-no-proxy with forbidden proxy policy.`);
    }
  }
}

function validateFutureRequirements(requirements: JsonRecord | undefined, issues: ValidationIssue[]): void {
  if (!requirements) {
    addIssue(issues, "error", "zc_reflection_future_requirements", "protocol.futureComparatorRequirements", "Future comparator requirements are missing.");
    return;
  }

  const activation = recordField(requirements, "activation");
  if (
    !activation
    || activation.mode !== "off-by-default"
    || activation.defaultEnabled !== false
    || activation.requiresExplicitDiagnosticInvocation !== true
    || activation.noOfficialCaseDefaultRuntimeWiring !== true
    || activation.noPackageJsonScript !== true
  ) {
    addIssue(issues, "error", "zc_reflection_off_by_default", "protocol.futureComparatorRequirements.activation", "Future comparator must remain off-by-default with no official-case/default runtime or package-script wiring.");
  }

  const evidence = recordField(requirements, "evidence");
  if (
    !evidence
    || evidence.rawBeforeResampled !== true
    || evidence.comparativeRawVsResampledRequired !== true
    || evidence.transitionInclusiveAndExcludedRequired !== true
    || evidence.interpretabilityRule !== "Only comparative raw-vs-resampled metrics plus anti-gaming readouts can make a future comparator interpretable."
  ) {
    addIssue(issues, "error", "zc_reflection_raw_resampled_boundary", "protocol.futureComparatorRequirements.evidence", "Future comparator requires raw-before-resampled, comparative raw-vs-resampled, and anti-gaming interpretability.");
  }

  const readouts = arrayField(requirements, "antiGamingReadouts").filter(isRecord);
  for (const name of REQUIRED_ANTI_GAMING_READOUTS) {
    const readout = readouts.find((candidate) => candidate.name === name);
    if (!readout || readout.required !== true) {
      addIssue(issues, "error", "zc_reflection_anti_gaming_readouts", `protocol.futureComparatorRequirements.antiGamingReadouts.${name}`, `${name} anti-gaming readout is required.`);
    }
  }
}

function validateClaimExclusions(claims: JsonRecord | undefined, issues: ValidationIssue[]): void {
  if (!claims) {
    addIssue(issues, "error", "zc_reflection_forbidden_claim", "protocol.claimExclusions", "Claim exclusions are missing.");
    return;
  }
  for (const key of [
    "productionComparator",
    "defaultRuntimeAdoption",
    "officialCaseWiring",
    "acceptedOfficialCaseOutcome",
    "officialMorphologyPass",
    "productionMorphologyPass",
    "comparatorImplementationComplete",
  ] as const) {
    if (claims[key] !== "not-claimed") {
      addIssue(issues, "error", "zc_reflection_forbidden_claim", `protocol.claimExclusions.${key}`, `${key} must remain not-claimed.`);
    }
  }
  if (claims.noProductionDefaultAcceptedOfficialMorphologyPassClaims !== true) {
    addIssue(issues, "error", "zc_reflection_forbidden_claim", "protocol.claimExclusions.noProductionDefaultAcceptedOfficialMorphologyPassClaims", "Boundary must explicitly forbid production/default/accepted/official morphology pass claims.");
  }
}

function validateDocs(docs: readonly TextFileInput[], issues: ValidationIssue[]): void {
  const doc = docs.find((file) => file.path === ARTERIAL_LOAD_ZC_REFLECTION_COMPARATOR_DOC_PATH);
  if (!doc) {
    addIssue(issues, "error", "zc_reflection_docs_boundary", ARTERIAL_LOAD_ZC_REFLECTION_COMPARATOR_DOC_PATH, "Comparator readiness doc is missing.");
  } else {
    const normalizedDocText = normalizeWhitespace(doc.text);
    for (const required of [
      PROTOCOL_ID,
      CLAIM_BOUNDARY,
      "off-by-default",
      "0.328 < 0.55",
      "0.229 < 0.45",
      "0.188 > 0.1",
      "unavailable/no-proxy",
      "Future candidate fields alone must not promote hypotheses",
      "Only comparative raw-vs-resampled metrics plus anti-gaming readouts",
      "ejection-limb-arterial-load-signal-gap",
      "strokeVolumeM3",
      "cardiacOutputM3PerSec",
      "strokeWorkJ",
      "peakPressurePa",
      "ejectionDurationSec",
      "semilunarReverseVolumeM3",
      "qDotClampHitFraction",
    ] as const) {
      if (!normalizedDocText.includes(required)) {
        addIssue(issues, "error", "zc_reflection_docs_boundary", doc.path, `Doc must include ${required}.`);
      }
    }
  }

  const readme = docs.find((file) => file.path === MYOCARDIUM_README_PATH);
  if (!readme) {
    addIssue(issues, "warning", "zc_reflection_readme_index", MYOCARDIUM_README_PATH, "README index was not loaded.");
  } else if (
    !readme.text.includes("verification/arterial-load-zc-reflection-comparator-v1.md")
    || !readme.text.includes(ARTERIAL_LOAD_ZC_REFLECTION_COMPARATOR_PROTOCOL_PATH)
  ) {
    addIssue(issues, "error", "zc_reflection_readme_index", readme.path, "README must index the comparator readiness doc and data artifact.");
  }
  for (const loadedDoc of docs) {
    validateNoForbiddenPositiveClaims(loadedDoc.path, loadedDoc.text, issues);
  }
}

function validateRuntimeIntegrationScan(
  runtimeIntegrationFiles: readonly TextFileInput[],
  issues: ValidationIssue[],
): void {
  for (const file of runtimeIntegrationFiles) {
    for (const token of COMPARATOR_RUNTIME_TOKENS) {
      if (file.text.includes(token)) {
        addIssue(issues, "error", "zc_reflection_runtime_leak", file.path, `Runtime/default/official-case file must not reference comparator token ${token}.`);
      }
    }
  }
}

function validatePackageScripts(packageJsonText: string, issues: ValidationIssue[]): void {
  for (const script of packageScriptEntries(packageJsonText)) {
    for (const token of PACKAGE_SCRIPT_TOKENS) {
      if (script.key.includes(token) || script.value.includes(token)) {
        addIssue(issues, "error", "zc_reflection_package_script_leak", `package.json.scripts.${script.key}`, `package scripts must not wire the comparator readiness token ${token}.`);
      }
    }
  }
}

function validateNoForbiddenPositiveClaims(
  label: string,
  text: string,
  issues: ValidationIssue[],
): void {
  for (const match of text.matchAll(FORBIDDEN_POSITIVE_CLAIM_PATTERN)) {
    const index = match.index ?? 0;
    if (hasLocalClaimNegation(text, index)) continue;
    addIssue(issues, "error", "zc_reflection_forbidden_claim", label, "Forbidden production/default/runtime/official morphology acceptance wording detected.");
    return;
  }
}

function hasLocalClaimNegation(text: string, matchIndex: number): boolean {
  const before = text.slice(0, matchIndex);
  let sentenceStart = 0;
  for (const match of before.matchAll(SENTENCE_BOUNDARY_PATTERN)) {
    sentenceStart = (match.index ?? 0) + match[0].length;
  }
  const sentencePrefix = before.slice(sentenceStart);
  const localPrefix = sentencePrefix.slice(-CLAIM_NEGATION_CONTEXT_CHARS);
  return NEGATED_CLAIM_PREFIX_PATTERN.test(localPrefix);
}

function packageScriptEntries(packageJsonText: string): Array<{ key: string; value: string }> {
  const parsed = JSON.parse(packageJsonText) as unknown;
  const scripts = isRecord(parsed) && isRecord(parsed.scripts) ? parsed.scripts : {};
  return Object.entries(scripts)
    .filter((entry): entry is [string, string] => typeof entry[1] === "string")
    .map(([key, value]) => ({ key, value }));
}

function loadRuntimeIntegrationFiles(rootDir: string): TextFileInput[] {
  return RUNTIME_INTEGRATION_TARGETS.flatMap((target) => {
    const fullPath = path.join(rootDir, target);
    if (!existsSync(fullPath)) return [];
    return listFiles(fullPath).map((filePath) => ({
      path: path.relative(rootDir, filePath).split(path.sep).join("/"),
      text: readFileSync(filePath, "utf8"),
    }));
  });
}

function listFiles(target: string): string[] {
  if (!existsSync(target)) return [];
  const stats = statSync(target);
  if (stats.isFile()) return /\.(ts|tsx|json)$/.test(target) ? [target] : [];

  const files: string[] = [];
  for (const entry of readdirSync(target, { withFileTypes: true })) {
    const fullPath = path.join(target, entry.name);
    if (entry.isDirectory()) {
      files.push(...listFiles(fullPath));
    } else if (entry.isFile() && /\.(ts|tsx|json)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }
  return files;
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

function recordField(record: JsonRecord, key: string): JsonRecord | undefined {
  const value = record[key];
  return isRecord(value) ? value : undefined;
}

function arrayField(record: JsonRecord, key: string): readonly unknown[] {
  const value = record[key];
  return Array.isArray(value) ? value : [];
}

function stringField(record: JsonRecord, key: string): string | undefined {
  const value = record[key];
  return typeof value === "string" ? value : undefined;
}

function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, " ");
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

function parseArgs(args: readonly string[]): { rootDir: string } {
  const options = { rootDir: process.cwd() };
  for (const arg of args) {
    const [key, value] = arg.split("=", 2);
    if (key === "--root" && value) options.rootDir = path.resolve(value);
    else if (key === "--help") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return options;
}

function printReport(report: ArterialLoadZcReflectionComparatorValidationReport): void {
  const status = report.pass ? "PASS" : "FAIL";
  // eslint-disable-next-line no-console
  console.log(
    `arterial-load Zc/reflection comparator readiness ${status} `
    + `protocol=${report.summary.protocolId} `
    + `errors=${report.summary.errorCount} warnings=${report.summary.warningCount} `
    + `runtimeFiles=${report.summary.runtimeIntegrationFileCount} `
    + `packageScripts=${report.summary.packageScriptCount} docs=${report.summary.docCount}`,
  );
  printIssues("errors", report.errors);
  printIssues("warnings", report.warnings);
}

function printIssues(label: string, issues: readonly ValidationIssue[]): void {
  if (issues.length === 0) return;
  // eslint-disable-next-line no-console
  console.log(`${label}:`);
  for (const issue of issues.slice(0, 40)) {
    // eslint-disable-next-line no-console
    console.log(`- [${issue.code}] ${issue.path}: ${issue.message}`);
  }
  if (issues.length > 40) {
    // eslint-disable-next-line no-console
    console.log(`- ... ${issues.length - 40} more`);
  }
}

function printHelp(): void {
  // eslint-disable-next-line no-console
  console.log([
    "Usage: npx vite-node tools/myocardium/verifyArterialLoadZcReflectionComparatorReadiness.ts -- [--root=DIR]",
    "",
    "Validates the docs/data-only arterial-load Zc/reflection comparator readiness boundary.",
    "This verifier rejects comparator-specific runtime/default/official-case/package-script wiring, positive production/default/official morphology claims, missing PR #181-base non-acceptance evidence, missing unavailable/no-proxy boundaries, missing off-by-default requirements, and missing anti-gaming readouts.",
  ].join("\n"));
}

const runningUnderVitest = process.env.VITEST === "true" || process.env.VITEST_WORKER_ID !== undefined;
if (!runningUnderVitest) {
  const options = parseArgs(process.argv.slice(2));
  const report = validateArterialLoadZcReflectionComparatorReadiness(
    loadArterialLoadZcReflectionComparatorValidationInput(options.rootDir),
  );
  printReport(report);
  if (!report.pass) process.exitCode = 1;
}
