import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

export const FILLING_LIMB_CORRELATION_READINESS_PROTOCOL_PATH =
  "data/myocardium/protocols/filling-limb-correlation-readiness-v1.json";
export const FILLING_LIMB_CORRELATION_READINESS_DOC_PATH =
  "docs/myocardium/verification/filling-limb-correlation-readiness-v1.md";
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

export type FillingLimbCorrelationReadinessValidationInput = {
  readonly protocol: unknown;
  readonly docs: readonly TextFileInput[];
  readonly runtimeIntegrationFiles: readonly TextFileInput[];
  readonly packageJsonText: string;
};

export type FillingLimbCorrelationReadinessValidationReport = {
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

const PROTOCOL_ID = "filling-limb-correlation-readiness-v1";
const CLAIM_BOUNDARY = "filling-limb-correlation-readiness-only";

const RUNTIME_SOURCE_EXTENSIONS = new Set([".ts", ".tsx"]);
const CASE_DATA_EXTENSIONS = new Set([".json"]);
const RUNTIME_CASE_DATA_TARGETS = [
  "data/cases",
  "public/cases",
] as const;
const RUNTIME_SCAN_EXCLUDED_DIR_NAMES = new Set([
  ".git",
  "node_modules",
  "dist",
  "build",
  "coverage",
  "artifacts",
  "docs",
  "__tests__",
  "test-results",
  "playwright-report",
  "tmp",
]);

const ALLOWED_COMPARATOR_TOKEN_PATHS = new Set([
  FILLING_LIMB_CORRELATION_READINESS_PROTOCOL_PATH,
  FILLING_LIMB_CORRELATION_READINESS_DOC_PATH,
  "tools/myocardium/buildFillingLimbDiagnosticComparator.ts",
  "tools/myocardium/verifyFillingLimbCorrelationReadiness.ts",
  "__tests__/pvLoopFillingLimbDiagnosticComparator.test.ts",
  "__tests__/pvLoopFillingLimbCorrelationReadiness.test.ts",
]);

const COMPARATOR_RUNTIME_TOKENS = [
  PROTOCOL_ID,
  "filling-limb-diagnostic-comparator-v1",
  "buildFillingLimbDiagnosticComparator",
  "fillingLimbCorrelationComparator",
  "FillingLimbCorrelationComparator",
  "runFillingLimbCorrelationComparator",
  "verifyFillingLimbCorrelationReadiness",
] as const;

const PACKAGE_SCRIPT_TOKENS = [
  "tools/myocardium/buildFillingLimbDiagnosticComparator.ts",
  "filling-limb-diagnostic-comparator-v1",
  "verify:myocardium-filling-limb-correlation-readiness",
  "tools/myocardium/verifyFillingLimbCorrelationReadiness.ts",
  ...COMPARATOR_RUNTIME_TOKENS,
] as const;

const REQUIRED_OBSERVATIONS = [
  {
    id: "filling-limb-roughness",
    lane: "filling-limb",
    score: 1,
    supportCount: 45,
    metricIds: [
      "lowerLimbKinkCount",
      "tvOpenLowerLimbRoughness",
      "valveOpenCloseChatterCount",
    ],
    labels: [],
  },
  {
    id: "event-window-correlation",
    lane: "filling-limb",
    score: 1,
    supportCount: 42,
    metricIds: [
      "eventCorrelationWindowHitFraction",
    ],
    labels: [
      "event-sensitive",
      "event-window-correlation",
    ],
  },
] as const;

const REQUIRED_HYPOTHESES = [
  {
    id: "filling-event-window-correlation",
    lane: "filling-limb",
    evidenceStatus: "supported-correlation",
    confidence: "medium",
    score: 1,
    observationIds: [
      "filling-limb-roughness",
      "event-window-correlation",
    ],
    nextEvidence: [
      "off-by-default valve/qDot diagnostic comparator with unchanged official defaults",
    ],
  },
  {
    id: "rv-filling-valve-chatter-correlation",
    lane: "filling-limb",
    evidenceStatus: "supported-correlation",
    confidence: "medium",
    score: 1,
    observationIds: [
      "filling-limb-roughness",
    ],
    nextEvidence: [
      "check TV marker density",
      "add per-sample dynamic clamp evidence before changing valve dynamics",
    ],
  },
] as const;

const REQUIRED_IDENTITY_FIELDS = [
  "caseId",
  "branchId",
  "beatIndex",
  "chamber",
  "samplingMode",
  "transitionPolicy",
] as const;

const REQUIRED_ANTI_GAMING_READOUTS = [
  "endDiastolicVolumeM3",
  "strokeVolumeM3",
  "cardiacOutputM3PerSec",
  "meanLeftAtrialPressurePa",
  "meanRightAtrialPressurePa",
  "eaLikeInflowProxy",
  "inletForwardVolumeM3",
  "inletReverseVolumeM3",
  "qDotClampHitFraction",
  "valveDiodeClampHitFraction",
  "dynamicFlowClampHitFraction",
  "pressureFloorHitFraction",
  "atrialKickBoosterPreservation",
] as const;

const FORBIDDEN_POSITIVE_CLAIM_PATTERN =
  /\b(?:accepted[-\s]+root[-\s]+cause|root[-\s]+cause(?:[-\s]+is)?[-\s]+accepted|accepts?[-\s]+(?:the[-\s]+)?root[-\s]+cause|root[-\s]+cause[-\s]+acceptance|root[-\s]+cause\s*\/\s*fix[-\s]+acceptance|accepted[-\s]+fix|fix(?:[-\s]+is)?[-\s]+accepted|accepts?[-\s]+(?:the[-\s]+)?fix|fix[-\s]+acceptance|production[-\s]?ready|runtime[-\s]?ready|default[-\s]?ready|default[-\s]+runtime[-\s]+ready|production[-\s]+runtime[-\s]+ready|official[-\s]+morphology[-\s]+pass(?:[-\s]+accepted)?|accepted[-\s]+official[-\s]+morphology[-\s]+pass|official[-\s]+morphology[-\s]+accepted|production[-\s]+morphology[-\s]+pass|official[-\s]+case[-\s]+ready|valve\/qdot[-\s]+fix[-\s]+accepted|valve[-\s]+qdot[-\s]+fix[-\s]+accepted|pressure[-\s]+floor[-\s]+tuning[-\s]+accepted|smoothing[-\s]+accepted)\b/gi;
const NEGATED_CLAIM_PREFIX_PATTERN =
  /\b(?:no|not|never|without|rejects?|forbid(?:s|den)?|must not|does not|do not|makes no)\b(?:[-\s]+(?:an?|the|any|this|that|claim(?:s|ed)?|accept(?:s|ed)?|promote(?:s|d)?|make(?:s)?|root[-\s]+cause|fix|official|morphology|case|production|runtime|default|accepted|acceptance|pass|ready|valve\/qdot|valve[-\s]+qdot|pressure[-\s]+floor|tuning|smoothing|or))*[-\s]*$/i;
const NEGATED_CLAIM_SUFFIX_PATTERN =
  /\b(?:(?:is|are|was|were|remains?|must remain)[-\s]+)?(?:not[-\s]+claimed|not[-\s]+covered|future[-\s]+work|out[-\s]+of[-\s]+scope)\b/i;
const SENTENCE_BOUNDARY_PATTERN = /[.!?]/g;
const CLAIM_PREFIX_SCOPE_BOUNDARY_PATTERN =
  /[.!?,;:()[\]\/\u2013\u2014]|\b(?:and|but|however|yet|nevertheless|nonetheless|while|whereas|although)\b/gi;
const CLAIM_SUFFIX_SCOPE_BOUNDARY_PATTERN =
  /[.!?,;:()[\]\/\u2013\u2014]|\b(?:and|but|however|yet|nevertheless|nonetheless|while|whereas|although)\b/i;
const CLAIM_NEGATION_CONTEXT_CHARS = 120;

export function loadFillingLimbCorrelationReadinessValidationInput(
  rootDir = process.cwd(),
): FillingLimbCorrelationReadinessValidationInput {
  return {
    protocol: readJson(path.join(rootDir, FILLING_LIMB_CORRELATION_READINESS_PROTOCOL_PATH)),
    docs: [
      readTextFile(rootDir, FILLING_LIMB_CORRELATION_READINESS_DOC_PATH),
      readTextFile(rootDir, MYOCARDIUM_README_PATH),
    ],
    runtimeIntegrationFiles: loadRuntimeIntegrationFiles(rootDir),
    packageJsonText: readFileSync(path.join(rootDir, "package.json"), "utf8"),
  };
}

export function validateFillingLimbCorrelationReadiness(
  input: FillingLimbCorrelationReadinessValidationInput,
): FillingLimbCorrelationReadinessValidationReport {
  const issues: ValidationIssue[] = [];
  const protocol = isRecord(input.protocol) ? input.protocol : {};

  validateProtocol(protocol, issues);
  validateNoForbiddenPositiveClaims(FILLING_LIMB_CORRELATION_READINESS_PROTOCOL_PATH, JSON.stringify(protocol), issues);
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
    addIssue(issues, "error", "filling_limb_protocol_identity", FILLING_LIMB_CORRELATION_READINESS_PROTOCOL_PATH, "Protocol identity must remain proposed readiness-only v1.");
  }

  validateRuntimeBoundary(recordField(protocol, "runtimeBoundary"), issues);
  validateEvidenceSnapshot(recordField(protocol, "currentEvidenceSnapshot"), issues);
  validateFutureRequirements(recordField(protocol, "futureComparatorRequirements"), issues);
  validateClaimExclusions(recordField(protocol, "claimExclusions"), issues);
}

function validateRuntimeBoundary(boundary: JsonRecord | undefined, issues: ValidationIssue[]): void {
  if (!boundary) {
    addIssue(issues, "error", "filling_limb_runtime_boundary", "protocol.runtimeBoundary", "Runtime boundary is missing.");
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
      addIssue(issues, "error", "filling_limb_runtime_boundary", `protocol.runtimeBoundary.${key}`, `${key} must remain ${expected}.`);
    }
  }
}

function validateEvidenceSnapshot(snapshot: JsonRecord | undefined, issues: ValidationIssue[]): void {
  if (!snapshot) {
    addIssue(issues, "error", "filling_limb_evidence_snapshot", "protocol.currentEvidenceSnapshot", "Current evidence snapshot is missing.");
    return;
  }
  if (
    snapshot.source !== "runner-supported-correlation-baseline"
    || snapshot.snapshotRole !== "historical-non-acceptance-context"
    || snapshot.acceptanceStatus !== "non-acceptance-context"
  ) {
    addIssue(issues, "error", "filling_limb_evidence_snapshot", "protocol.currentEvidenceSnapshot", "Snapshot must remain runner-supported-correlation historical non-acceptance context.");
  }

  const provenance = recordField(snapshot, "provenance");
  if (
    !provenance
    || provenance.baseCommit !== "77d7cd7aa2ff4306a9a4841cb6c7d14d0f940251"
    || provenance.runnerCommand !== "npx vite-node tools/myocardium/verifyPvLoopMorphologyQuality.ts --out=artifacts/myocardium/pv-loop-morphology/filling-limb-correlation-baseline-2026-06-28"
    || provenance.summaryArtifactPath !== "artifacts/myocardium/pv-loop-morphology/filling-limb-correlation-baseline-2026-06-28/summary.json"
    || provenance.summarySha256 !== "7e570a3116eadd4d51c2a64af9f383a45475c64b2a7c0e1b39997a4a90046338"
  ) {
    addIssue(issues, "error", "filling_limb_evidence_snapshot", "protocol.currentEvidenceSnapshot.provenance", "Snapshot must preserve base commit, runner command, summary artifact path, and summary SHA-256 provenance.");
  }

  const scoringProfile = recordField(snapshot, "scoringProfile");
  if (!scoringProfile || scoringProfile.maxConfidence !== "medium") {
    addIssue(issues, "error", "filling_limb_correlation_evidence", "protocol.currentEvidenceSnapshot.scoringProfile.maxConfidence", "scoringProfile.maxConfidence must remain medium.");
  }

  const observations = arrayField(snapshot, "observations").filter(isRecord);
  for (const required of REQUIRED_OBSERVATIONS) {
    const observed = observations.find((candidate) => candidate.id === required.id);
    if (
      !observed
      || observed.lane !== required.lane
      || observed.score !== required.score
      || observed.supportCount !== required.supportCount
      || !arrayIncludesAllStrings(arrayField(observed, "metricIds"), required.metricIds)
      || !arrayIncludesAllStrings(arrayField(observed, "labels"), required.labels)
    ) {
      addIssue(issues, "error", "filling_limb_correlation_evidence", `protocol.currentEvidenceSnapshot.observations.${required.id}`, `${required.id} must preserve lane, score, supportCount, metrics, and labels from morphologyEvidence.`);
    }
  }

  const hypotheses = arrayField(snapshot, "hypotheses").filter(isRecord);
  for (const required of REQUIRED_HYPOTHESES) {
    const hypothesis = hypotheses.find((candidate) => candidate.id === required.id);
    if (
      !hypothesis
      || hypothesis.lane !== required.lane
      || hypothesis.evidenceStatus !== required.evidenceStatus
      || hypothesis.confidence !== required.confidence
      || hypothesis.score !== required.score
      || !arrayIncludesAllStrings(arrayField(hypothesis, "observationIds"), required.observationIds)
      || !arrayIncludesAllStrings(arrayField(hypothesis, "nextEvidence"), required.nextEvidence)
    ) {
      addIssue(issues, "error", "filling_limb_correlation_evidence", `protocol.currentEvidenceSnapshot.hypotheses.${required.id}`, `${required.id} must remain supported-correlation, medium confidence, and pin the required observations and next evidence.`);
    }
  }

  const summaryInterpretation = stringField(snapshot, "summaryInterpretation") ?? "";
  if (
    !summaryInterpretation.includes("supported-correlation only")
    || !summaryInterpretation.includes("medium confidence")
    || !summaryInterpretation.includes("do not accept a root cause or fix")
  ) {
    addIssue(issues, "error", "filling_limb_correlation_evidence", "protocol.currentEvidenceSnapshot.summaryInterpretation", "Snapshot interpretation must state supported-correlation only, medium confidence, and no root-cause/fix acceptance.");
  }
}

function validateFutureRequirements(requirements: JsonRecord | undefined, issues: ValidationIssue[]): void {
  if (!requirements) {
    addIssue(issues, "error", "filling_limb_future_requirements", "protocol.futureComparatorRequirements", "Future comparator requirements are missing.");
    return;
  }

  const activation = recordField(requirements, "activation");
  if (
    !activation
    || activation.mode !== "off-by-default"
    || activation.defaultEnabled !== false
    || activation.requiresExplicitDiagnosticInvocation !== true
    || activation.noPackageJsonScript !== true
    || activation.noOfficialCaseDefaultRuntimeWiring !== true
    || activation.noDefaultRuntimeWiring !== true
    || activation.noUiProductionWiring !== true
  ) {
    addIssue(issues, "error", "filling_limb_off_by_default", "protocol.futureComparatorRequirements.activation", "Future comparator must remain off-by-default with explicit diagnostic invocation only and no package/default/official/UI/production wiring.");
  }

  const evidence = recordField(requirements, "evidence");
  if (
    !evidence
    || evidence.rawBeforeResampled !== true
    || evidence.comparativeRawVsResampledRequired !== true
    || evidence.transitionInclusiveAndExcludedRequired !== true
    || evidence.sameCaseBranchBeatChamberSamplingTransitionPolicyIdentityRequired !== true
    || !arrayIncludesAllStrings(arrayField(evidence, "requiredIdentityFields"), REQUIRED_IDENTITY_FIELDS)
  ) {
    addIssue(issues, "error", "filling_limb_evidence_requirements", "protocol.futureComparatorRequirements.evidence", "Future comparator requires raw-before-resampled, comparative raw-vs-resampled, transition-inclusive/excluded, and same case/branch/beatIndex/chamber/samplingMode/transition identity evidence.");
  }

  const readouts = arrayField(requirements, "antiGamingReadouts").filter(isRecord);
  for (const name of REQUIRED_ANTI_GAMING_READOUTS) {
    const readout = readouts.find((candidate) => candidate.name === name);
    if (!readout || readout.required !== true) {
      addIssue(issues, "error", "filling_limb_anti_gaming_readouts", `protocol.futureComparatorRequirements.antiGamingReadouts.${name}`, `${name} anti-gaming readout is required.`);
    }
  }

  const candidatePolicy = recordField(requirements, "candidateFieldPolicy");
  if (
    !candidatePolicy
    || candidatePolicy.candidateFieldsAloneMustNotPromoteRootCauseOrFixHypotheses !== true
    || !String(candidatePolicy.statement ?? "").includes("Candidate fields alone must not promote root-cause or fix hypotheses")
  ) {
    addIssue(issues, "error", "filling_limb_candidate_field_boundary", "protocol.futureComparatorRequirements.candidateFieldPolicy", "Candidate fields alone must not promote root-cause or fix hypotheses.");
  }
}

function validateClaimExclusions(claims: JsonRecord | undefined, issues: ValidationIssue[]): void {
  if (!claims) {
    addIssue(issues, "error", "filling_limb_forbidden_claim", "protocol.claimExclusions", "Claim exclusions are missing.");
    return;
  }
  for (const key of [
    "acceptedRootCause",
    "rootCauseAcceptance",
    "fixAcceptance",
    "productionRuntimeReady",
    "defaultRuntimeReady",
    "officialCaseReady",
    "officialMorphologyPass",
    "valveQDotFixAccepted",
    "pressureFloorTuningAccepted",
    "smoothingAccepted",
    "modelEquationChange",
    "solverBehaviorChange",
    "comparatorImplementationComplete",
  ] as const) {
    if (claims[key] !== "not-claimed") {
      addIssue(issues, "error", "filling_limb_forbidden_claim", `protocol.claimExclusions.${key}`, `${key} must remain not-claimed.`);
    }
  }
  if (claims.noForbiddenClaims !== true) {
    addIssue(issues, "error", "filling_limb_forbidden_claim", "protocol.claimExclusions.noForbiddenClaims", "Boundary must explicitly forbid accepted root-cause, production/default/runtime ready, official morphology pass, official-case ready, valve/qDot fix, pressure-floor tuning, and smoothing acceptance claims.");
  }
}

function validateDocs(docs: readonly TextFileInput[], issues: ValidationIssue[]): void {
  const doc = docs.find((file) => file.path === FILLING_LIMB_CORRELATION_READINESS_DOC_PATH);
  if (!doc) {
    addIssue(issues, "error", "filling_limb_docs_boundary", FILLING_LIMB_CORRELATION_READINESS_DOC_PATH, "Filling-limb readiness doc is missing.");
  } else {
    const normalizedDocText = normalizeWhitespace(doc.text);
    for (const required of [
      PROTOCOL_ID,
      CLAIM_BOUNDARY,
      "docs/data/verifier/test-only",
      "off-by-default",
      "supported-correlation only, medium confidence",
      "historical non-acceptance context",
      "77d7cd7aa2ff4306a9a4841cb6c7d14d0f940251",
      "npx vite-node tools/myocardium/verifyPvLoopMorphologyQuality.ts --out=artifacts/myocardium/pv-loop-morphology/filling-limb-correlation-baseline-2026-06-28",
      "artifacts/myocardium/pv-loop-morphology/filling-limb-correlation-baseline-2026-06-28/summary.json",
      "7e570a3116eadd4d51c2a64af9f383a45475c64b2a7c0e1b39997a4a90046338",
      "scoringProfile.maxConfidence=medium",
      "filling-limb-roughness",
      "supportCount 45",
      "lowerLimbKinkCount",
      "tvOpenLowerLimbRoughness",
      "valveOpenCloseChatterCount",
      "event-window-correlation",
      "supportCount 42",
      "eventCorrelationWindowHitFraction",
      "event-sensitive",
      "filling-event-window-correlation",
      "rv-filling-valve-chatter-correlation",
      "off-by-default valve/qDot diagnostic comparator with unchanged official defaults",
      "check TV marker density",
      "add per-sample dynamic clamp evidence before changing valve dynamics",
      "raw-before-resampled",
      "comparative raw-vs-resampled",
      "transition-inclusive and transition-excluded-core",
      "same case/branch/beatIndex/chamber/samplingMode/transition policy identity",
      "Candidate fields alone must not promote root-cause or fix hypotheses",
      "endDiastolicVolumeM3",
      "strokeVolumeM3",
      "cardiacOutputM3PerSec",
      "meanLeftAtrialPressurePa",
      "meanRightAtrialPressurePa",
      "eaLikeInflowProxy",
      "inletForwardVolumeM3",
      "inletReverseVolumeM3",
      "qDotClampHitFraction",
      "valveDiodeClampHitFraction",
      "dynamicFlowClampHitFraction",
      "pressureFloorHitFraction",
      "atrialKickBoosterPreservation",
    ] as const) {
      if (!normalizedDocText.includes(required)) {
        addIssue(issues, "error", "filling_limb_docs_boundary", doc.path, `Doc must include ${required}.`);
      }
    }
  }

  const readme = docs.find((file) => file.path === MYOCARDIUM_README_PATH);
  if (!readme) {
    addIssue(issues, "warning", "filling_limb_readme_index", MYOCARDIUM_README_PATH, "README index was not loaded.");
  } else if (
    !readme.text.includes("verification/filling-limb-correlation-readiness-v1.md")
    || !readme.text.includes(FILLING_LIMB_CORRELATION_READINESS_PROTOCOL_PATH)
  ) {
    addIssue(issues, "error", "filling_limb_readme_index", readme.path, "README must index the filling-limb readiness doc and data artifact.");
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
    if (ALLOWED_COMPARATOR_TOKEN_PATHS.has(file.path)) continue;
    for (const token of COMPARATOR_RUNTIME_TOKENS) {
      if (file.text.includes(token)) {
        addIssue(issues, "error", "filling_limb_runtime_leak", file.path, `Runtime/default/official-case file must not reference comparator token ${token}.`);
      }
    }
  }
}

function validatePackageScripts(packageJsonText: string, issues: ValidationIssue[]): void {
  for (const script of packageScriptEntries(packageJsonText)) {
    for (const token of PACKAGE_SCRIPT_TOKENS) {
      if (script.key.includes(token) || script.value.includes(token)) {
        addIssue(issues, "error", "filling_limb_package_script_leak", `package.json.scripts.${script.key}`, `package scripts must not wire the filling-limb comparator readiness token ${token}.`);
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
    if (hasLocalClaimNegation(text, index, match[0].length)) continue;
    addIssue(issues, "error", "filling_limb_forbidden_claim", label, "Forbidden accepted-root-cause/production/default/runtime/official-case/fix/tuning/smoothing wording detected.");
    return;
  }
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

function packageScriptEntries(packageJsonText: string): Array<{ key: string; value: string }> {
  const parsed = JSON.parse(packageJsonText) as unknown;
  const scripts = isRecord(parsed) && isRecord(parsed.scripts) ? parsed.scripts : {};
  return Object.entries(scripts)
    .filter((entry): entry is [string, string] => typeof entry[1] === "string")
    .map(([key, value]) => ({ key, value }));
}

function loadRuntimeIntegrationFiles(rootDir: string): TextFileInput[] {
  const filePaths = [
    ...listFiles(rootDir, rootDir, RUNTIME_SOURCE_EXTENSIONS),
    ...RUNTIME_CASE_DATA_TARGETS.flatMap((target) => (
      listFiles(path.join(rootDir, target), rootDir, CASE_DATA_EXTENSIONS)
    )),
  ];
  return Array.from(new Set(filePaths))
    .sort()
    .map((filePath) => ({
      path: path.relative(rootDir, filePath).split(path.sep).join("/"),
      text: readFileSync(filePath, "utf8"),
    }));
}

function listFiles(target: string, rootDir: string, extensions: ReadonlySet<string>): string[] {
  if (!existsSync(target)) return [];
  const stats = statSync(target);
  if (stats.isFile()) return extensions.has(path.extname(target)) ? [target] : [];

  const relativePath = path.relative(rootDir, target).split(path.sep).join("/");
  if (shouldSkipRuntimeScanDirectory(relativePath, path.basename(target))) return [];

  const files: string[] = [];
  for (const entry of readdirSync(target, { withFileTypes: true })) {
    const fullPath = path.join(target, entry.name);
    if (entry.isDirectory()) {
      files.push(...listFiles(fullPath, rootDir, extensions));
    } else if (entry.isFile() && extensions.has(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }
  return files;
}

function shouldSkipRuntimeScanDirectory(relativePath: string, directoryName: string): boolean {
  return relativePath !== "" && RUNTIME_SCAN_EXCLUDED_DIR_NAMES.has(directoryName);
}

function containsForbiddenPositiveClaim(text: string): boolean {
  return new RegExp(FORBIDDEN_POSITIVE_CLAIM_PATTERN.source, "i").test(text);
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

function arrayIncludesAllStrings(
  values: readonly unknown[],
  requiredValues: readonly string[],
): boolean {
  return requiredValues.every((required) => values.includes(required));
}

function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, " ");
}

function addIssue(
  issues: ValidationIssue[],
  severity: ValidationSeverity,
  issueCode: string,
  issuePath: string,
  message: string,
): void {
  issues.push({ severity, code: issueCode, path: issuePath, message });
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

function printReport(report: FillingLimbCorrelationReadinessValidationReport): void {
  const status = report.pass ? "PASS" : "FAIL";
  // eslint-disable-next-line no-console
  console.log(
    `filling-limb correlation readiness ${status} `
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
    "Usage: npx vite-node tools/myocardium/verifyFillingLimbCorrelationReadiness.ts -- [--root=DIR]",
    "",
    "Validates the docs/data/verifier/test-only filling-limb correlation readiness boundary.",
    "This verifier rejects comparator-specific runtime/default/official-case/package-script wiring, positive root-cause/fix/production/default/runtime/official claims, missing non-acceptance supported-correlation evidence, missing off-by-default requirements, and missing anti-gaming readouts.",
  ].join("\n"));
}

const runningUnderVitest = process.env.VITEST === "true" || process.env.VITEST_WORKER_ID !== undefined;
if (!runningUnderVitest) {
  const options = parseArgs(process.argv.slice(2));
  const report = validateFillingLimbCorrelationReadiness(
    loadFillingLimbCorrelationReadinessValidationInput(options.rootDir),
  );
  printReport(report);
  if (!report.pass) process.exitCode = 1;
}
