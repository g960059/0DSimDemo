import { readFileSync } from "node:fs";
import path from "node:path";
import {
  PHASE4A_MECHANICS_DOSSIER_PATH,
  loadMechanicsDecisionValidationInput,
  validateMechanicsDecisionDossier,
  type MechanicsDecisionValidationInput,
  type TextFileInput,
  type ValidationIssue,
  type ValidationSeverity,
} from "./phase4aMechanicsDecisionValidation";

export const PHASE4A_MECHANICS_OWNER_SELECTION_PATH =
  "data/myocardium/decisions/production-mechanics-decision19-owner-selection-v1.json";

export const EXPECTED_DECISION19_OWNER_SELECTION = {
  schemaVersion: 1,
  selectionId: "production-mechanics-decision19-owner-selection-v1",
  phase: "Phase 4A",
  decisionId: 19,
  decisionName: "production ventricular mechanics",
  status: "ACCEPTED",
  selectedCandidateId: "thick-sphere-v2-explicit-external-septal-coupling",
  selectedBackend: "thick-sphere-v2",
  ownerAcceptedBy: "g960059",
  ownerAcceptedAt: "2026-06-27",
  ownerAcceptedSourceType: "codex-thread",
  ownerAcceptedSourceRef:
    "codex-thread:019f03b3-a60b-7921-b0b2-ae7809ec90f3#turn=019f06c2-f8fa-7bc0-8578-36bcd6b288cb",
  sourceDossierId: "production-mechanics-phase4a-dossier-v1",
} as const;

type JsonRecord = Record<string, unknown>;

export type MechanicsOwnerSelectionValidationInput = MechanicsDecisionValidationInput & {
  ownerSelection: unknown;
};

export type MechanicsOwnerSelectionValidationReport = {
  pass: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  summary: {
    candidateCount: number;
    criterionCount: number;
    phase3DescriptorCount: number;
    decisionDocCount: number;
    integrationFileCount: number;
    ownerSelectionPresent: boolean;
    errorCount: number;
    warningCount: number;
  };
};

const REQUIRED_NON_COVERAGE = [
  {
    id: "rv-pressure-overload",
    pattern: /RV pressure overload/i,
  },
  {
    id: "septal-bowing",
    pattern: /septal bowing/i,
  },
  {
    id: "ventricular-interdependence",
    pattern: /ventricular interdependence/i,
  },
  {
    id: "right-heart-failure",
    pattern: /right[- ]heart failure/i,
  },
] as const;

const COVERAGE_CLAIM_PATTERNS = [
  /\b(?:cover(?:s|ed)?|support(?:s|ed)?|include(?:s|d)?)\s+(?:RV pressure overload|septal bowing|ventricular interdependence|right[- ]heart failure)/gi,
  /(?:RV pressure overload|septal bowing|ventricular interdependence|right[- ]heart failure)\s+(?:is|are|as)?\s*(?:now\s+)?(?:covered|supported|included)\b/gi,
] as const;

const FORBIDDEN_ALTERNANS_CALCIUM_VALIDATION =
  /(?:alternans[^.]{0,120}calcium[^.]{0,80}validation|calcium[^.]{0,80}validation[^.]{0,120}alternans)/i;

export function loadMechanicsOwnerSelectionValidationInput(
  rootDir = process.cwd(),
): MechanicsOwnerSelectionValidationInput {
  return {
    ...loadMechanicsDecisionValidationInput(rootDir),
    ownerSelection: readJson(path.join(rootDir, PHASE4A_MECHANICS_OWNER_SELECTION_PATH)),
  };
}

export function validateMechanicsOwnerSelection(
  input: MechanicsOwnerSelectionValidationInput,
): MechanicsOwnerSelectionValidationReport {
  const baseReport = validateMechanicsDecisionDossier(input);
  const issues: ValidationIssue[] = [...baseReport.errors, ...baseReport.warnings];

  validateOwnerSelectionArtifact(input.ownerSelection, input.dossier, issues);
  validateOwnerSelectionDocs(input.decisionDocs, issues);
  validateNoOwnerSelectionRuntimeLeak(input.integrationFiles, input.ownerSelection, issues);

  const errors = issues.filter((issue) => issue.severity === "error");
  const warnings = issues.filter((issue) => issue.severity === "warning");

  return {
    pass: errors.length === 0,
    errors,
    warnings,
    summary: {
      candidateCount: baseReport.summary.candidateCount,
      criterionCount: baseReport.summary.criterionCount,
      phase3DescriptorCount: baseReport.summary.phase3DescriptorCount,
      decisionDocCount: input.decisionDocs.length,
      integrationFileCount: input.integrationFiles.length,
      ownerSelectionPresent: isRecord(input.ownerSelection),
      errorCount: errors.length,
      warningCount: warnings.length,
    },
  };
}

function validateOwnerSelectionArtifact(
  ownerSelection: unknown,
  dossier: unknown,
  issues: ValidationIssue[],
): void {
  const pathPrefix = "ownerSelection";
  if (!isRecord(ownerSelection)) {
    addIssue(issues, "error", "owner_selection_shape", pathPrefix, "Owner selection artifact must be an object.");
    return;
  }

  if (ownerSelection.schemaVersion !== EXPECTED_DECISION19_OWNER_SELECTION.schemaVersion) {
    addIssue(issues, "error", "owner_selection_schema_version", `${pathPrefix}.schemaVersion`, "schemaVersion must be 1.");
  }
  for (const field of [
    "selectionId",
    "phase",
    "decisionName",
    "status",
    "selectedCandidateId",
    "selectedBackend",
    "ownerAcceptedBy",
    "ownerAcceptedAt",
    "ownerAcceptedSourceType",
    "ownerAcceptedSourceRef",
  ] as const) {
    if (stringField(ownerSelection, field) !== EXPECTED_DECISION19_OWNER_SELECTION[field]) {
      addIssue(
        issues,
        "error",
        "owner_selection_exact_field",
        `${pathPrefix}.${field}`,
        `${field} must match the recorded Decision 19 owner-selection source.`,
      );
    }
  }
  if (numericId(ownerSelection.decisionId) !== EXPECTED_DECISION19_OWNER_SELECTION.decisionId) {
    addIssue(issues, "error", "owner_selection_decision_id", `${pathPrefix}.decisionId`, "decisionId must be 19.");
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(stringField(ownerSelection, "ownerAcceptedAt") ?? "")) {
    addIssue(
      issues,
      "error",
      "owner_selection_acceptance_date",
      `${pathPrefix}.ownerAcceptedAt`,
      "ownerAcceptedAt must be YYYY-MM-DD.",
    );
  }

  validateSourceDossierRef(ownerSelection.sourceDossierRef, issues);
  validateSelectedCandidateAgainstDossier(ownerSelection, dossier, issues);
  validateCurrentPriority(ownerSelection, issues);
  validateOfficialCaseScope(ownerSelection.officialCaseScope, issues);
  validateNonCoverage(ownerSelection.nonCoverage, issues);
  validateFutureMechanicsEscalation(ownerSelection.futureRequiredMechanicsEscalation, issues);
  validateInitialScopeDoesNotClaimNonCoverage(ownerSelection.officialCaseScope, issues);
}

function validateSourceDossierRef(sourceDossierRef: unknown, issues: ValidationIssue[]): void {
  const pathPrefix = "ownerSelection.sourceDossierRef";
  if (!isRecord(sourceDossierRef)) {
    addIssue(issues, "error", "owner_selection_source_dossier_ref", pathPrefix, "sourceDossierRef is required.");
    return;
  }
  if (stringField(sourceDossierRef, "path") !== PHASE4A_MECHANICS_DOSSIER_PATH) {
    addIssue(
      issues,
      "error",
      "owner_selection_source_dossier_ref",
      `${pathPrefix}.path`,
      `sourceDossierRef.path must be ${PHASE4A_MECHANICS_DOSSIER_PATH}.`,
    );
  }
  if (stringField(sourceDossierRef, "dossierId") !== EXPECTED_DECISION19_OWNER_SELECTION.sourceDossierId) {
    addIssue(
      issues,
      "error",
      "owner_selection_source_dossier_ref",
      `${pathPrefix}.dossierId`,
      "sourceDossierRef.dossierId must match the Phase 4A dossier id.",
    );
  }
}

function validateSelectedCandidateAgainstDossier(
  ownerSelection: JsonRecord,
  dossier: unknown,
  issues: ValidationIssue[],
): void {
  const selectedCandidateId = stringField(ownerSelection, "selectedCandidateId");
  const dossierRecord = isRecord(dossier) ? dossier : {};
  const requiredOwnerAction = isRecord(dossierRecord.requiredOwnerAction) ? dossierRecord.requiredOwnerAction : {};
  const allowedCandidateIds = strings(requiredOwnerAction.allowedCandidateIds);

  if (!selectedCandidateId || !allowedCandidateIds.includes(selectedCandidateId)) {
    addIssue(
      issues,
      "error",
      "owner_selection_candidate_not_allowed",
      "ownerSelection.selectedCandidateId",
      "Selected candidate must be listed in dossier.requiredOwnerAction.allowedCandidateIds.",
    );
  }
  if (selectedCandidateId !== stringField(dossierRecord, "recommendedCandidateId")) {
    addIssue(
      issues,
      "error",
      "owner_selection_candidate_not_recommended",
      "ownerSelection.selectedCandidateId",
      "Selected candidate must equal the Phase 4A dossier recommendedCandidateId.",
    );
  }
}

function validateCurrentPriority(ownerSelection: JsonRecord, issues: ValidationIssue[]): void {
  const text = deepText(ownerSelection.currentPriority);
  if (!/Land/i.test(text) || !/active[- ]stress/i.test(text) || !/replac/i.test(text)) {
    addIssue(
      issues,
      "error",
      "owner_selection_current_priority",
      "ownerSelection.currentPriority",
      "Current priority must include replacing current active stress with Land.",
    );
  }
  if (!/morphology/i.test(text) || !/gate/i.test(text) || !/pass\/fail|pass[- ]fail|pass fail/i.test(text)) {
    addIssue(
      issues,
      "error",
      "owner_selection_current_priority",
      "ownerSelection.currentPriority",
      "Current priority must include morphology gate pass/fail.",
    );
  }
  if (!/beat[- ]stability|beat stability/i.test(text) || !/no[- ]alternans|no alternans/i.test(text)) {
    addIssue(
      issues,
      "error",
      "owner_selection_current_priority",
      "ownerSelection.currentPriority",
      "Current priority must include beat-stability/no-alternans.",
    );
  }
  if (FORBIDDEN_ALTERNANS_CALCIUM_VALIDATION.test(text)) {
    addIssue(
      issues,
      "error",
      "owner_selection_alternans_scope",
      "ownerSelection.currentPriority",
      "No-alternans must be framed as beat stability, not calcium validation.",
    );
  }
}

function validateNonCoverage(nonCoverage: unknown, issues: ValidationIssue[]): void {
  const pathPrefix = "ownerSelection.nonCoverage";
  const entries = strings(nonCoverage);
  const text = entries.join(" ");
  for (const required of REQUIRED_NON_COVERAGE) {
    const entry = entries.find((candidate) => required.pattern.test(candidate));
    if (!entry) {
      addIssue(
        issues,
        "error",
        "owner_selection_non_coverage_missing",
        pathPrefix,
        `nonCoverage must explicitly include ${required.id}.`,
      );
      continue;
    }
    if (!/not covered|not the covered|does not cover|non[- ]coverage/i.test(entry)) {
      addIssue(
        issues,
        "error",
        "owner_selection_non_coverage_claim",
        pathPrefix,
        `${required.id} must be recorded as not covered by the initial backend.`,
      );
    }
    if (!/primary|final/i.test(entry)) {
      addIssue(
        issues,
        "error",
        "owner_selection_non_coverage_scope",
        pathPrefix,
        `${required.id} non-coverage must mention primary or final scope.`,
      );
    }
  }
  if (hasPositiveCoverageClaim(text)) {
    addIssue(
      issues,
      "error",
      "owner_selection_non_coverage_claim",
      pathPrefix,
      "nonCoverage must not imply RV/interdependence mechanisms are covered by the initial backend.",
    );
  }
}

function validateOfficialCaseScope(officialCaseScope: unknown, issues: ValidationIssue[]): void {
  const pathPrefix = "ownerSelection.officialCaseScope";
  if (!isRecord(officialCaseScope)) {
    addIssue(issues, "error", "owner_selection_official_case_scope_missing", pathPrefix, "officialCaseScope is required.");
    return;
  }

  const initialBackendScope = stringField(officialCaseScope, "initialBackendScope");
  if (!initialBackendScope) {
    addIssue(
      issues,
      "error",
      "owner_selection_official_case_scope_missing",
      `${pathPrefix}.initialBackendScope`,
      "initialBackendScope is required.",
    );
  }

  const limitedScopeBoundary = stringField(officialCaseScope, "limitedScopeBoundary");
  if (!limitedScopeBoundary) {
    addIssue(
      issues,
      "error",
      "owner_selection_official_case_scope_missing",
      `${pathPrefix}.limitedScopeBoundary`,
      "limitedScopeBoundary is required.",
    );
  }

  const text = deepText(officialCaseScope);
  if (
    !text.includes(EXPECTED_DECISION19_OWNER_SELECTION.selectedCandidateId)
    || !text.includes(EXPECTED_DECISION19_OWNER_SELECTION.selectedBackend)
  ) {
    addIssue(
      issues,
      "error",
      "owner_selection_official_case_scope_backend",
      pathPrefix,
      "officialCaseScope must identify the selected initial thick-sphere-v2 backend.",
    );
  }
  if (!/initial backend|initial selected backend|initialBackendScope/i.test(text) || !/limited[- ]scope|initial backend only/i.test(text)) {
    addIssue(
      issues,
      "error",
      "owner_selection_official_case_scope_limited",
      pathPrefix,
      "officialCaseScope must preserve initial-backend and limited-scope framing.",
    );
  }
  if (!/Land/i.test(text) || !/active[- ]stress/i.test(text) || !/replac/i.test(text)) {
    addIssue(
      issues,
      "error",
      "owner_selection_official_case_scope_priority",
      pathPrefix,
      "officialCaseScope must include Land active-stress replacement.",
    );
  }
  if (!/morphology/i.test(text) || !/gate/i.test(text) || !/pass\/fail|pass[- ]fail|pass fail/i.test(text)) {
    addIssue(
      issues,
      "error",
      "owner_selection_official_case_scope_priority",
      pathPrefix,
      "officialCaseScope must include morphology gate pass/fail.",
    );
  }
  if (!/beat[- ]stability|beat stability/i.test(text) || !/no[- ]alternans|no alternans/i.test(text)) {
    addIssue(
      issues,
      "error",
      "owner_selection_official_case_scope_priority",
      pathPrefix,
      "officialCaseScope must include beat-stability/no-alternans.",
    );
  }
  for (const required of REQUIRED_NON_COVERAGE) {
    if (!required.pattern.test(text)) {
      addIssue(
        issues,
        "error",
        "owner_selection_official_case_scope_non_coverage",
        pathPrefix,
        `officialCaseScope must preserve non-coverage language for ${required.id}.`,
      );
    }
  }
}

function validateFutureMechanicsEscalation(futureEscalation: unknown, issues: ValidationIssue[]): void {
  const text = deepText(futureEscalation);
  if (!/triseg-lite-compatible/i.test(text)) {
    addIssue(
      issues,
      "error",
      "owner_selection_future_triseg_path",
      "ownerSelection.futureRequiredMechanicsEscalation",
      "Future mechanics escalation must preserve triseg-lite-compatible.",
    );
  }
  if (!/full-triseg-compatible/i.test(text)) {
    addIssue(
      issues,
      "error",
      "owner_selection_future_triseg_path",
      "ownerSelection.futureRequiredMechanicsEscalation",
      "Future mechanics escalation must preserve full-triseg-compatible.",
    );
  }
  if (!/full TriSeg/i.test(text) || !/before[^.]{0,120}claim/i.test(text)) {
    addIssue(
      issues,
      "error",
      "owner_selection_future_triseg_path",
      "ownerSelection.futureRequiredMechanicsEscalation",
      "Future mechanics escalation must preserve a full TriSeg path before those mechanisms are claimed.",
    );
  }
}

function validateInitialScopeDoesNotClaimNonCoverage(officialCaseScope: unknown, issues: ValidationIssue[]): void {
  const text = deepText(officialCaseScope);
  if (hasPositiveCoverageClaim(text)) {
    addIssue(
      issues,
      "error",
      "owner_selection_scope_overclaim",
      "ownerSelection.officialCaseScope",
      "Initial official-case scope must not claim RV/interdependence/right-heart coverage.",
    );
  }
}

function validateOwnerSelectionDocs(decisionDocs: readonly TextFileInput[], issues: ValidationIssue[]): void {
  for (const doc of decisionDocs) {
    const lines = doc.text.split(/\r?\n/);
    const decision19Rows = lines
      .map((line, index) => ({ line, index }))
      .filter(({ line }) => /^\|\s*19\s*\|/.test(line));

    if (decision19Rows.length !== 1) {
      addIssue(
        issues,
        "error",
        "owner_selection_doc_decision19_row_count",
        doc.path,
        "Decision 19 table row must appear exactly once.",
      );
      continue;
    }

    const [{ line, index }] = decision19Rows;
    if (!/ACCEPTED 2026-06-27/.test(line)) {
      addIssue(
        issues,
        "error",
        "owner_selection_doc_not_accepted",
        `${doc.path}:${index + 1}`,
        "Decision 19 row must mark ACCEPTED 2026-06-27.",
      );
    }
    if (
      !line.includes(EXPECTED_DECISION19_OWNER_SELECTION.selectedCandidateId)
      || !line.includes(EXPECTED_DECISION19_OWNER_SELECTION.selectedBackend)
    ) {
      addIssue(
        issues,
        "error",
        "owner_selection_doc_backend_missing",
        `${doc.path}:${index + 1}`,
        "Decision 19 row must identify the selected thick-sphere-v2 backend.",
      );
    }

    validateOwnerSelectionDocProse(doc, issues);
  }
}

function validateOwnerSelectionDocProse(doc: TextFileInput, issues: ValidationIssue[]): void {
  const text = doc.text.replace(/\s+/g, " ");
  const pathPrefix = doc.path;

  if (!/Land/i.test(text) || !/active[- ]stress/i.test(text) || !/replac/i.test(text)) {
    addIssue(
      issues,
      "error",
      "owner_selection_doc_current_priority",
      pathPrefix,
      "Decision docs must describe the Land active-stress replacement priority.",
    );
  }
  if (!/morphology/i.test(text) || !/gate/i.test(text) || !/pass\/fail|pass[- ]fail|pass fail/i.test(text)) {
    addIssue(
      issues,
      "error",
      "owner_selection_doc_current_priority",
      pathPrefix,
      "Decision docs must describe morphology gate pass/fail.",
    );
  }
  if (!/beat[- ]stability|beat stability/i.test(text) || !/no[- ]alternans|no alternans/i.test(text)) {
    addIssue(
      issues,
      "error",
      "owner_selection_doc_current_priority",
      pathPrefix,
      "Decision docs must describe beat-stability/no-alternans.",
    );
  }
  if (FORBIDDEN_ALTERNANS_CALCIUM_VALIDATION.test(text)) {
    addIssue(
      issues,
      "error",
      "owner_selection_doc_alternans_scope",
      pathPrefix,
      "No-alternans prose must not be framed as calcium validation.",
    );
  }
  if (!/limited[- ]scope|limited scope|initial backend only|initial selected backend/i.test(text)) {
    addIssue(
      issues,
      "error",
      "owner_selection_doc_limited_scope",
      pathPrefix,
      "Decision docs must preserve limited-scope wording.",
    );
  }
  for (const required of REQUIRED_NON_COVERAGE) {
    if (!required.pattern.test(text)) {
      addIssue(
        issues,
        "error",
        "owner_selection_doc_non_coverage",
        pathPrefix,
        `Decision docs must preserve non-coverage language for ${required.id}.`,
      );
    }
  }
  if (hasPositiveCoverageClaim(text)) {
    addIssue(
      issues,
      "error",
      "owner_selection_doc_scope_overclaim",
      pathPrefix,
      "Decision docs must not imply RV/interdependence/right-heart mechanisms are covered by the initial backend.",
    );
  }
  if (!/future[^.]{0,120}TriSeg|TriSeg[^.]{0,120}future/i.test(text)) {
    addIssue(
      issues,
      "error",
      "owner_selection_doc_future_triseg",
      pathPrefix,
      "Decision docs must preserve the future TriSeg path.",
    );
  }
}

function validateNoOwnerSelectionRuntimeLeak(
  integrationFiles: readonly TextFileInput[],
  ownerSelection: unknown,
  issues: ValidationIssue[],
): void {
  const selectedCandidateId = isRecord(ownerSelection)
    ? stringField(ownerSelection, "selectedCandidateId") ?? EXPECTED_DECISION19_OWNER_SELECTION.selectedCandidateId
    : EXPECTED_DECISION19_OWNER_SELECTION.selectedCandidateId;
  const selectedBackend = isRecord(ownerSelection)
    ? stringField(ownerSelection, "selectedBackend") ?? EXPECTED_DECISION19_OWNER_SELECTION.selectedBackend
    : EXPECTED_DECISION19_OWNER_SELECTION.selectedBackend;
  const forbiddenTokens = [
    PHASE4A_MECHANICS_OWNER_SELECTION_PATH,
    EXPECTED_DECISION19_OWNER_SELECTION.selectionId,
    selectedCandidateId,
    selectedBackend,
    "mechanics-selection",
    "mechanics selection",
  ];

  for (const file of integrationFiles) {
    for (const forbiddenToken of forbiddenTokens) {
      if (file.text.includes(forbiddenToken)) {
        addIssue(
          issues,
          "error",
          "mechanics_owner_selection_runtime_leak",
          file.path,
          `Runtime/official-case integration file must not reference ${forbiddenToken}.`,
        );
      }
    }
  }
}

function readJson(filePath: string): unknown {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function stringField(record: JsonRecord, field: string): string | undefined {
  const value = record[field];
  return typeof value === "string" ? value : undefined;
}

function numericId(value: unknown): number | undefined {
  return typeof value === "number" && Number.isInteger(value) ? value : undefined;
}

function deepText(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map((entry) => deepText(entry)).join(" ");
  if (isRecord(value)) return Object.values(value).map((entry) => deepText(entry)).join(" ");
  return "";
}

function hasPositiveCoverageClaim(text: string): boolean {
  const normalized = text.replace(/\s+/g, " ");
  for (const pattern of COVERAGE_CLAIM_PATTERNS) {
    pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(normalized)) !== null) {
      const before = normalized.slice(Math.max(0, match.index - 40), match.index);
      if (/\b(?:does not|do not|must not|is not|are not|not|without|cannot|can not)\b/i.test(before)) {
        continue;
      }
      return true;
    }
  }
  return false;
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
