import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

export const PHASE3_OWNER_GO_ARTIFACT_PATH = "data/myocardium/gates/phase3-owner-go-v1.json";
export const PHASE4A_MECHANICS_DOSSIER_PATH =
  "data/myocardium/decisions/production-mechanics-phase4a-dossier-v1.json";

export const REQUIRED_PHASE4A_CANDIDATES = [
  {
    id: "thick-sphere-v2-explicit-external-septal-coupling",
    label: "A. thick-sphere-v2 + explicit external septal coupling",
  },
  {
    id: "triseg-lite-compatible",
    label: "B. TriSeg-lite compatible backend",
  },
  {
    id: "full-triseg-compatible",
    label: "C. full TriSeg-compatible backend",
  },
] as const;

const SHADOW_PROTOCOL_SCAN_EXCLUSIONS = new Set([
  // Phase 4B-A shadow protocol artifacts are not runtime integration surfaces.
  // Their own verifier scans runtime/case surfaces for Phase 4B-A references.
  "engine/myocardium/protocols/landActiveStressReplacementReadiness.ts",
]);

export const REQUIRED_PHASE4A_CRITERION_IDS = [
  "official-case-scope",
  "validation-data",
  "identifiability-rank-readiness",
  "virtual-power-closure-readiness",
  "performance-risk-readiness",
  "implementation-dependency-risk",
] as const;

type JsonRecord = Record<string, unknown>;

export type ValidationSeverity = "error" | "warning";

export type ValidationIssue = {
  severity: ValidationSeverity;
  code: string;
  path: string;
  message: string;
};

export type Phase3DescriptorInput = {
  id: string;
  path: string;
  artifact: unknown;
};

export type TextFileInput = {
  path: string;
  text: string;
};

export type MechanicsDecisionValidationInput = {
  phase3OwnerGate: unknown;
  dossier: unknown;
  sourcesRegistry: unknown;
  phase3Descriptors: readonly Phase3DescriptorInput[];
  decisionDocs: readonly TextFileInput[];
  integrationFiles: readonly TextFileInput[];
};

export type MechanicsDecisionValidationReport = {
  pass: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  summary: {
    candidateCount: number;
    criterionCount: number;
    phase3DescriptorCount: number;
    decisionDocCount: number;
    integrationFileCount: number;
    errorCount: number;
    warningCount: number;
  };
};

const EXPECTED_PHASE3_GO_PROVENANCE = {
  acceptedBy: "g960059",
  acceptedAt: "2026-06-27",
  acceptedSourceType: "codex-thread",
  acceptedSourceRef: "codex-thread:019f03b3-a60b-7921-b0b2-ae7809ec90f3#turn=019f0681-728f-7963-8099-e0ee81b86320",
  acceptedSourceText: "GOでよいです。引き続き、お願いします。",
} as const;

const REQUIRED_GO_EXCLUSION_PATTERNS = [
  { id: "phase4b-plus", pattern: /Phase 4B\+|Phase 4B|later/i },
  { id: "production-mechanics-integration", pattern: /production mechanics integration/i },
  { id: "runtime-schema-official-case-wiring", pattern: /runtime.*schema.*official-case|runtime.*official-case.*schema|ModelCore.*chamber.*schema.*official-case/i },
  { id: "passive-law-acceptance", pattern: /passive law acceptance/i },
  { id: "triseg-adoption", pattern: /TriSeg adoption/i },
  { id: "decision19-acceptance", pattern: /Decision 19 acceptance/i },
] as const;

const BROAD_GO_UNLOCK_PATTERN =
  /Phase 4B|Phase 5|production mechanics integration|runtime|ModelCore|chamber|schema|official-case|official case|passive law acceptance|TriSeg adoption|Decision 19 acceptance/i;

const TRISEG_SOURCE_ID = "circadapt-triseg-docs-2407";
const TRISEG_SOURCE_ROLE = "phase4-mechanics-candidate-definition";

export function loadMechanicsDecisionValidationInput(rootDir = process.cwd()): MechanicsDecisionValidationInput {
  const fromRoot = (relativePath: string) => path.join(rootDir, relativePath);

  return {
    phase3OwnerGate: readJson(fromRoot(PHASE3_OWNER_GO_ARTIFACT_PATH)),
    dossier: readJson(fromRoot(PHASE4A_MECHANICS_DOSSIER_PATH)),
    sourcesRegistry: readJson(fromRoot("data/myocardium/sources.json")),
    phase3Descriptors: [
      {
        id: "phase3a-thick-sphere-kinematics",
        path: "data/myocardium/protocols/thick-sphere-phase3a-kinematics-protocols.json",
        artifact: readJson(fromRoot("data/myocardium/protocols/thick-sphere-phase3a-kinematics-protocols.json")),
      },
      {
        id: "phase3b-identity-generalized-force",
        path: "data/myocardium/protocols/identity-force-phase3b-protocols.json",
        artifact: readJson(fromRoot("data/myocardium/protocols/identity-force-phase3b-protocols.json")),
      },
      {
        id: "phase3c-minimal-loaded-afterload",
        path: "data/myocardium/protocols/minimal-loaded-phase3c-afterload-protocols.json",
        artifact: readJson(fromRoot("data/myocardium/protocols/minimal-loaded-phase3c-afterload-protocols.json")),
      },
    ],
    decisionDocs: [
      readTextFile(rootDir, "docs/myocardium/adr/ADR-MYO-001.md"),
      readTextFile(rootDir, "docs/myocardium/roadmap/myocardium-rebuild-roadmap.md"),
      readTextFile(rootDir, "docs/myocardium/research/myocardial-contraction-rebuild-design-record.md"),
    ],
    integrationFiles: loadIntegrationFiles(rootDir),
  };
}

export function validateMechanicsDecisionDossier(
  input: MechanicsDecisionValidationInput,
): MechanicsDecisionValidationReport {
  const issues: ValidationIssue[] = [];

  validatePhase3OwnerGate(input.phase3OwnerGate, issues);
  validateDossier(input.dossier, issues);
  validateTriSegSource(input.sourcesRegistry, input.dossier, issues);
  validatePhase3Descriptors(input.phase3Descriptors, issues);
  validateDecision19Docs(input.decisionDocs, issues);
  validateNoIntegrationLeak(input.integrationFiles, issues);

  const errors = issues.filter((issue) => issue.severity === "error");
  const warnings = issues.filter((issue) => issue.severity === "warning");
  const dossier = isRecord(input.dossier) ? input.dossier : {};

  return {
    pass: errors.length === 0,
    errors,
    warnings,
    summary: {
      candidateCount: records(dossier.candidateSet).length,
      criterionCount: records(dossier.criteria).length,
      phase3DescriptorCount: input.phase3Descriptors.length,
      decisionDocCount: input.decisionDocs.length,
      integrationFileCount: input.integrationFiles.length,
      errorCount: errors.length,
      warningCount: warnings.length,
    },
  };
}

function validatePhase3OwnerGate(gate: unknown, issues: ValidationIssue[]): void {
  const pathPrefix = "phase3OwnerGate";
  if (!isRecord(gate)) {
    addIssue(issues, "error", "phase3_go_shape", pathPrefix, "Phase 3 owner GO artifact must be an object.");
    return;
  }

  if (gate.schemaVersion !== 1) {
    addIssue(issues, "error", "phase3_go_schema_version", `${pathPrefix}.schemaVersion`, "schemaVersion must be 1.");
  }
  if (stringField(gate, "gateId") !== "phase3-owner-go-v1") {
    addIssue(issues, "error", "phase3_go_id", `${pathPrefix}.gateId`, "gateId must be phase3-owner-go-v1.");
  }
  if (stringField(gate, "phase") !== "Phase 3" || stringField(gate, "outcome") !== "GO") {
    addIssue(issues, "error", "phase3_go_outcome", pathPrefix, "Phase 3 gate must record outcome GO.");
  }

  validatePhase3GoProvenance(gate, pathPrefix, issues);
  validatePhase3GoEvidence(gate.evidenceRefs, issues);
  validatePhase3GoScope(gate.scope, issues);

  const decisionBoundary = isRecord(gate.decisionBoundary) ? gate.decisionBoundary : {};
  if (stringField(decisionBoundary, "decision19Status") !== "PENDING OWNER") {
    addIssue(
      issues,
      "error",
      "phase3_go_decision19_boundary",
      `${pathPrefix}.decisionBoundary.decision19Status`,
      "Phase 3 GO must leave Decision 19 PENDING OWNER.",
    );
  }
  if (stringField(decisionBoundary, "productionMechanicsOwnerAcceptance") !== "not-authorized") {
    addIssue(
      issues,
      "error",
      "phase3_go_decision19_boundary",
      `${pathPrefix}.decisionBoundary.productionMechanicsOwnerAcceptance`,
      "Phase 3 GO must not authorize production mechanics owner acceptance.",
    );
  }
  if (stringField(decisionBoundary, "triSegAdoption") !== "not-authorized") {
    addIssue(
      issues,
      "error",
      "phase3_go_decision19_boundary",
      `${pathPrefix}.decisionBoundary.triSegAdoption`,
      "Phase 3 GO must not authorize TriSeg adoption.",
    );
  }
}

function validatePhase3GoProvenance(gate: JsonRecord, pathPrefix: string, issues: ValidationIssue[]): void {
  for (const [field, expected] of Object.entries(EXPECTED_PHASE3_GO_PROVENANCE)) {
    if (field === "acceptedSourceText") continue;
    if (stringField(gate, field) !== expected) {
      addIssue(
        issues,
        "error",
        "phase3_go_missing_owner_provenance",
        `${pathPrefix}.${field}`,
        `Phase 3 GO owner provenance field ${field} must match the approved owner source.`,
      );
    }
  }

  const acceptedAt = stringField(gate, "acceptedAt");
  if (acceptedAt && !/^\d{4}-\d{2}-\d{2}$/.test(acceptedAt)) {
    addIssue(
      issues,
      "error",
      "phase3_go_invalid_acceptance_date",
      `${pathPrefix}.acceptedAt`,
      "acceptedAt must be YYYY-MM-DD.",
    );
  }

  const acceptedSource = stringField(gate, "acceptedSource");
  if (!acceptedSource?.includes(EXPECTED_PHASE3_GO_PROVENANCE.acceptedSourceText)) {
    addIssue(
      issues,
      "error",
      "phase3_go_source_text",
      `${pathPrefix}.acceptedSource`,
      "acceptedSource must include the owner Codex thread instruction text.",
    );
  }
}

function validatePhase3GoEvidence(evidenceRefs: unknown, issues: ValidationIssue[]): void {
  const refs = records(evidenceRefs);
  const prIndex = refs.findIndex((ref) => {
    return String(ref.ref ?? ref.label ?? ref.id ?? "").includes("/pull/162")
      || String(ref.ref ?? ref.label ?? ref.id ?? "").includes("PR #162");
  });
  const protocolIndex = refs.findIndex((ref) => {
    return stringField(ref, "path") === "data/myocardium/protocols/minimal-loaded-phase3c-afterload-protocols.json";
  });

  if (prIndex === -1) {
    addIssue(
      issues,
      "error",
      "phase3_go_evidence_pr162",
      "phase3OwnerGate.evidenceRefs",
      "Phase 3 GO evidenceRefs must cite PR #162.",
    );
  }
  if (protocolIndex === -1) {
    addIssue(
      issues,
      "error",
      "phase3_go_evidence_phase3c",
      "phase3OwnerGate.evidenceRefs",
      "Phase 3 GO evidenceRefs must cite the Phase 3C minimal-loaded descriptor artifact.",
    );
  }
  if (prIndex !== -1 && protocolIndex !== -1 && prIndex === protocolIndex) {
    addIssue(
      issues,
      "error",
      "phase3_go_evidence_not_separate",
      "phase3OwnerGate.evidenceRefs",
      "PR #162 and the Phase 3C protocol artifact must be separate evidenceRefs entries.",
    );
  }
}

function validatePhase3GoScope(scope: unknown, issues: ValidationIssue[]): void {
  const pathPrefix = "phase3OwnerGate.scope";
  if (!isRecord(scope)) {
    addIssue(issues, "error", "phase3_go_scope_missing", pathPrefix, "Phase 3 GO scope metadata is required.");
    return;
  }

  const unlocks = records(scope.unlocks);
  if (unlocks.length !== 1) {
    addIssue(
      issues,
      "error",
      "phase3_go_unlock_scope",
      `${pathPrefix}.unlocks`,
      "Phase 3 GO must unlock exactly one work item.",
    );
  }

  const unlockText = unlocks.map((unlock) => recordText(unlock)).join(" ");
  if (!/Phase 4A/i.test(unlockText) || !/Decision 19/i.test(unlockText) || !/dossier/i.test(unlockText)) {
    addIssue(
      issues,
      "error",
      "phase3_go_unlock_scope",
      `${pathPrefix}.unlocks`,
      "Phase 3 GO must unlock only Phase 4A Decision 19 dossier work.",
    );
  }
  if (BROAD_GO_UNLOCK_PATTERN.test(unlockText)) {
    addIssue(
      issues,
      "error",
      "phase3_go_broad_authorization",
      `${pathPrefix}.unlocks`,
      "Phase 3 GO unlocks must not authorize Phase 4B+, runtime/schema/case wiring, passive law acceptance, TriSeg adoption, or Decision 19 acceptance.",
    );
  }

  const exclusions = strings(scope.doesNotAuthorize);
  const exclusionsText = exclusions.join(" ");
  for (const required of REQUIRED_GO_EXCLUSION_PATTERNS) {
    if (!required.pattern.test(exclusionsText)) {
      addIssue(
        issues,
        "error",
        "phase3_go_missing_exclusion",
        `${pathPrefix}.doesNotAuthorize`,
        `Phase 3 GO must explicitly exclude ${required.id}.`,
      );
    }
  }
}

function validateDossier(dossier: unknown, issues: ValidationIssue[]): void {
  const pathPrefix = "mechanicsDossier";
  if (!isRecord(dossier)) {
    addIssue(issues, "error", "dossier_shape", pathPrefix, "Phase 4A mechanics dossier must be an object.");
    return;
  }

  if (dossier.schemaVersion !== 1) {
    addIssue(issues, "error", "dossier_schema_version", `${pathPrefix}.schemaVersion`, "schemaVersion must be 1.");
  }
  if (stringField(dossier, "dossierId") !== "production-mechanics-phase4a-dossier-v1") {
    addIssue(
      issues,
      "error",
      "dossier_id",
      `${pathPrefix}.dossierId`,
      "dossierId must be production-mechanics-phase4a-dossier-v1.",
    );
  }

  validateDossierState(dossier, issues);
  validateCandidateSet(dossier.candidateSet, issues);
  validateCriteria(dossier.criteria, issues);
  validateCandidateAssessments(dossier.candidateAssessments, issues);
  validateRecommendation(dossier.recommendation, dossier, issues);
  validateRequiredOwnerAction(dossier.requiredOwnerAction, issues);
}

function validateDossierState(dossier: JsonRecord, issues: ValidationIssue[]): void {
  const pathPrefix = "mechanicsDossier";
  if (numericId(dossier.decisionId) !== 19) {
    addIssue(issues, "error", "dossier_decision_state", `${pathPrefix}.decisionId`, "Dossier must be for Decision 19.");
  }
  if (stringField(dossier, "decision19Status") !== "PENDING OWNER") {
    addIssue(
      issues,
      "error",
      "dossier_decision_state",
      `${pathPrefix}.decision19Status`,
      "Decision 19 must remain PENDING OWNER.",
    );
  }
  if (stringField(dossier, "ownerAcceptanceStatus") !== "not-owner-acceptance") {
    addIssue(
      issues,
      "error",
      "dossier_owner_acceptance_claim",
      `${pathPrefix}.ownerAcceptanceStatus`,
      "Dossier must not claim owner acceptance.",
    );
  }
  if (dossier.selectedCandidateId !== null) {
    addIssue(
      issues,
      "error",
      "dossier_decision_state",
      `${pathPrefix}.selectedCandidateId`,
      "Current Phase 4A dossier must not set selectedCandidateId.",
    );
    if (!hasOwnerSelectionProvenance(dossier)) {
      addIssue(
        issues,
        "error",
        "dossier_selected_candidate_requires_owner_provenance",
        `${pathPrefix}.selectedCandidateId`,
        "Non-null selectedCandidateId requires owner selection provenance.",
      );
    }
  }
  if (stringField(dossier, "recommendedCandidateId") !== REQUIRED_PHASE4A_CANDIDATES[0].id) {
    addIssue(
      issues,
      "error",
      "dossier_recommendation_state",
      `${pathPrefix}.recommendedCandidateId`,
      "Dossier must recommend thick-sphere-v2 only as the conditional recommendation.",
    );
  }
  if (stringField(dossier, "recommendationStatus") !== "conditional-recommendation-only") {
    addIssue(
      issues,
      "error",
      "dossier_recommendation_state",
      `${pathPrefix}.recommendationStatus`,
      "Recommendation status must be conditional-recommendation-only.",
    );
  }
  if (
    hasOwn(dossier, "acceptedBy")
    || hasOwn(dossier, "acceptedAt")
    || hasOwn(dossier, "acceptedSource")
    || hasOwn(dossier, "acceptedSourceType")
    || hasOwn(dossier, "acceptedSourceRef")
  ) {
    addIssue(
      issues,
      "error",
      "dossier_owner_acceptance_claim",
      pathPrefix,
      "Dossier must not include top-level owner acceptance provenance.",
    );
  }
}

function validateCandidateSet(candidateSet: unknown, issues: ValidationIssue[]): void {
  const candidates = records(candidateSet);
  if (candidates.length !== REQUIRED_PHASE4A_CANDIDATES.length) {
    addIssue(
      issues,
      "error",
      "dossier_candidate_set",
      "mechanicsDossier.candidateSet",
      "Candidate set must contain exactly the three approved Phase 4A candidates.",
    );
  }

  REQUIRED_PHASE4A_CANDIDATES.forEach((expected, index) => {
    const candidate = candidates[index];
    if (!candidate) return;
    if (stringField(candidate, "id") !== expected.id) {
      addIssue(
        issues,
        "error",
        "dossier_candidate_set",
        `mechanicsDossier.candidateSet[${index}].id`,
        `Candidate ${index + 1} id must be ${expected.id}.`,
      );
    }
    if (stringField(candidate, "label") !== expected.label) {
      addIssue(
        issues,
        "error",
        "dossier_candidate_label",
        `mechanicsDossier.candidateSet[${index}].label`,
        `Candidate ${expected.id} label must be ${expected.label}.`,
      );
    }
  });

  const ids = candidates.map((candidate) => stringField(candidate, "id")).filter((id): id is string => Boolean(id));
  if (new Set(ids).size !== ids.length) {
    addIssue(
      issues,
      "error",
      "dossier_candidate_set",
      "mechanicsDossier.candidateSet",
      "Candidate ids must be unique.",
    );
  }
}

function validateCriteria(criteria: unknown, issues: ValidationIssue[]): void {
  const criterionRecords = records(criteria);
  const criterionIds = new Set(
    criterionRecords.map((criterion) => stringField(criterion, "id")).filter((id): id is string => Boolean(id)),
  );
  for (const requiredId of REQUIRED_PHASE4A_CRITERION_IDS) {
    if (!criterionIds.has(requiredId)) {
      addIssue(
        issues,
        "error",
        "dossier_criteria_missing",
        "mechanicsDossier.criteria",
        `Dossier criteria must include ${requiredId}.`,
      );
    }
  }
  if (criterionIds.size !== criterionRecords.length) {
    addIssue(
      issues,
      "error",
      "dossier_criteria_duplicate",
      "mechanicsDossier.criteria",
      "Dossier criteria ids must be unique.",
    );
  }
}

function validateCandidateAssessments(candidateAssessments: unknown, issues: ValidationIssue[]): void {
  const assessments = records(candidateAssessments);
  const assessmentByCandidate = new Map(
    assessments.map((assessment) => [stringField(assessment, "candidateId"), assessment] as const),
  );
  for (const candidate of REQUIRED_PHASE4A_CANDIDATES) {
    const assessment = assessmentByCandidate.get(candidate.id);
    if (!assessment) {
      addIssue(
        issues,
        "error",
        "dossier_candidate_assessment_missing",
        "mechanicsDossier.candidateAssessments",
        `Dossier must include an assessment for ${candidate.id}.`,
      );
      continue;
    }
    const notes = isRecord(assessment.criterionNotes) ? assessment.criterionNotes : {};
    for (const criterionId of REQUIRED_PHASE4A_CRITERION_IDS) {
      if (!stringField(notes, criterionId)) {
        addIssue(
          issues,
          "error",
          "dossier_candidate_assessment_incomplete",
          `mechanicsDossier.candidateAssessments[${candidate.id}].criterionNotes.${criterionId}`,
          `Candidate ${candidate.id} must address ${criterionId}.`,
        );
      }
    }
  }
}

function validateRecommendation(recommendation: unknown, dossier: JsonRecord, issues: ValidationIssue[]): void {
  const pathPrefix = "mechanicsDossier.recommendation";
  if (!isRecord(recommendation)) {
    addIssue(issues, "error", "dossier_recommendation_missing", pathPrefix, "Recommendation metadata is required.");
    return;
  }

  if (stringField(recommendation, "recommendedCandidateId") !== stringField(dossier, "recommendedCandidateId")) {
    addIssue(
      issues,
      "error",
      "dossier_recommendation_state",
      `${pathPrefix}.recommendedCandidateId`,
      "Recommendation candidate must match dossier.recommendedCandidateId.",
    );
  }
  if (stringField(recommendation, "status") !== "conditional-recommendation-only") {
    addIssue(
      issues,
      "error",
      "dossier_recommendation_state",
      `${pathPrefix}.status`,
      "Recommendation status must be conditional-recommendation-only.",
    );
  }
  if (recommendation.notProductionValidation !== true) {
    addIssue(
      issues,
      "error",
      "dossier_recommendation_not_validation",
      `${pathPrefix}.notProductionValidation`,
      "Recommendation must explicitly state it is not production validation.",
    );
  }

  const scopeAssumption = stringField(recommendation, "scopeAssumption") ?? "";
  if (
    !/global preload\/afterload/i.test(scopeAssumption)
    || !/normal\/global LV\/RV failure/i.test(scopeAssumption)
    || !/without RV pressure overload, septal bowing, or ventricular interdependence/i.test(scopeAssumption)
    || !/primary mechanism/i.test(scopeAssumption)
  ) {
    addIssue(
      issues,
      "error",
      "dossier_recommendation_scope",
      `${pathPrefix}.scopeAssumption`,
      "Conditional recommendation must state the limited first-integration scope assumption.",
    );
  }

  const contingency = stringField(recommendation, "contingency") ?? "";
  if (
    !/RV pressure overload/i.test(contingency)
    || !/septal bowing/i.test(contingency)
    || !/ventricular interdependence/i.test(contingency)
    || !/TriSeg-lite/i.test(contingency)
    || !/full TriSeg/i.test(contingency)
    || !/preferred/i.test(contingency)
  ) {
    addIssue(
      issues,
      "error",
      "dossier_recommendation_contingency",
      `${pathPrefix}.contingency`,
      "Conditional recommendation must state the TriSeg contingency for RV pressure overload, septal bowing, or ventricular interdependence.",
    );
  }

  const officialCaseBoundary = stringField(recommendation, "officialCasePendingBoundary") ?? "";
  if (
    !/official-case scope remains pending/i.test(officialCaseBoundary)
    || !/cannot be promoted to owner selection/i.test(officialCaseBoundary)
    || recommendation.canPromoteWithoutOfficialCaseScope !== false
  ) {
    addIssue(
      issues,
      "error",
      "dossier_recommendation_official_case_boundary",
      `${pathPrefix}.officialCasePendingBoundary`,
      "Recommendation cannot be promoted while official-case scope remains pending.",
    );
  }

  if (recommendation.noAutoAdoptTriSeg !== true) {
    addIssue(
      issues,
      "error",
      "dossier_no_auto_adopt",
      `${pathPrefix}.noAutoAdoptTriSeg`,
      "Recommendation must include the no-auto-adopt TriSeg boundary.",
    );
  }
}

function validateRequiredOwnerAction(requiredOwnerAction: unknown, issues: ValidationIssue[]): void {
  const pathPrefix = "mechanicsDossier.requiredOwnerAction";
  if (!isRecord(requiredOwnerAction)) {
    addIssue(
      issues,
      "error",
      "dossier_required_owner_action",
      pathPrefix,
      "Dossier must include machine-checkable required owner action metadata.",
    );
    return;
  }

  if (requiredOwnerAction.required !== true) {
    addIssue(issues, "error", "dossier_required_owner_action", `${pathPrefix}.required`, "required must be true.");
  }
  if (stringField(requiredOwnerAction, "beforePhase") !== "Phase 4B+") {
    addIssue(
      issues,
      "error",
      "dossier_required_owner_action",
      `${pathPrefix}.beforePhase`,
      "Owner action must be required before Phase 4B+.",
    );
  }
  if (requiredOwnerAction.blocksPhase4BPlusUntilOwnerSelection !== true) {
    addIssue(
      issues,
      "error",
      "dossier_required_owner_action",
      `${pathPrefix}.blocksPhase4BPlusUntilOwnerSelection`,
      "Owner action must block Phase 4B+ until owner selection.",
    );
  }

  const allowedCandidateIds = strings(requiredOwnerAction.allowedCandidateIds);
  if (!sameOrderedStrings(allowedCandidateIds, REQUIRED_PHASE4A_CANDIDATES.map((candidate) => candidate.id))) {
    addIssue(
      issues,
      "error",
      "dossier_required_owner_action",
      `${pathPrefix}.allowedCandidateIds`,
      "Owner action must list the exact approved candidate ids.",
    );
  }

  const mustRecord = new Set(strings(requiredOwnerAction.mustRecord));
  for (const requiredField of [
    "selectedCandidateId",
    "ownerAcceptedBy",
    "ownerAcceptedAt",
    "ownerAcceptedSourceType",
    "ownerAcceptedSourceRef",
    "officialCaseScope",
  ]) {
    if (!mustRecord.has(requiredField)) {
      addIssue(
        issues,
        "error",
        "dossier_required_owner_action",
        `${pathPrefix}.mustRecord`,
        `Owner action must require ${requiredField}.`,
      );
    }
  }
}

function validateTriSegSource(sourcesRegistry: unknown, dossier: unknown, issues: ValidationIssue[]): void {
  const pathPrefix = "sources";
  const sources = isRecord(sourcesRegistry) ? records(sourcesRegistry.sources) : [];
  const source = sources.find((candidate) => stringField(candidate, "id") === TRISEG_SOURCE_ID);

  if (!source) {
    addIssue(issues, "error", "triseg_source_missing", pathPrefix, `Missing source ${TRISEG_SOURCE_ID}.`);
    return;
  }
  if (stringField(source, "verificationStatus") !== "verified") {
    addIssue(
      issues,
      "error",
      "triseg_source_unverified",
      `${pathPrefix}.${TRISEG_SOURCE_ID}.verificationStatus`,
      `${TRISEG_SOURCE_ID} must be verified.`,
    );
  }
  if (!strings(source.roles).includes(TRISEG_SOURCE_ROLE)) {
    addIssue(
      issues,
      "error",
      "triseg_source_wrong_role",
      `${pathPrefix}.${TRISEG_SOURCE_ID}.roles`,
      `${TRISEG_SOURCE_ID} must carry role ${TRISEG_SOURCE_ROLE}.`,
    );
  }

  const dossierRecord = isRecord(dossier) ? dossier : {};
  const sourceRefs = records(dossierRecord.sourceReferences);
  const dossierRef = sourceRefs.find((ref) => stringField(ref, "sourceId") === TRISEG_SOURCE_ID);
  if (!dossierRef) {
    addIssue(
      issues,
      "error",
      "triseg_dossier_source_ref_missing",
      "mechanicsDossier.sourceReferences",
      `Dossier must cite ${TRISEG_SOURCE_ID}.`,
    );
  } else if (
    stringField(dossierRef, "role") !== TRISEG_SOURCE_ROLE
    || stringField(dossierRef, "use") !== TRISEG_SOURCE_ROLE
  ) {
    addIssue(
      issues,
      "error",
      "triseg_dossier_source_ref_wrong_role",
      "mechanicsDossier.sourceReferences",
      `Dossier ${TRISEG_SOURCE_ID} reference must use role ${TRISEG_SOURCE_ROLE}.`,
    );
  }

  const refBoundary = dossierRef ? `${stringField(dossierRef, "boundary") ?? ""} ${stringField(dossierRef, "detail") ?? ""}` : "";
  const recommendation = isRecord(dossierRecord.recommendation) ? dossierRecord.recommendation : {};
  if (
    (dossierRef && stringField(dossierRef, "boundary") !== "no-auto-adopt")
    || !/no-auto-adopt/i.test(refBoundary)
    || recommendation.noAutoAdoptTriSeg !== true
  ) {
    addIssue(
      issues,
      "error",
      "dossier_no_auto_adopt",
      "mechanicsDossier.sourceReferences",
      "TriSeg source citation must include the no-auto-adopt boundary.",
    );
  }
}

function validatePhase3Descriptors(descriptors: readonly Phase3DescriptorInput[], issues: ValidationIssue[]): void {
  for (const descriptor of descriptors) {
    const artifact = descriptor.artifact;
    const pathPrefix = `phase3Descriptors.${descriptor.id}`;
    if (!isRecord(artifact)) {
      addIssue(issues, "error", "phase3_descriptor_shape", pathPrefix, `${descriptor.path} must be an object.`);
      continue;
    }

    if (stringField(artifact, "ownerAcceptanceStatus") !== "not-owner-acceptance") {
      addIssue(
        issues,
        "error",
        "phase3_descriptor_owner_acceptance",
        `${pathPrefix}.ownerAcceptanceStatus`,
        "Prior Phase 3 descriptors must not be mutated to owner acceptance.",
      );
    }
    if (hasOwn(artifact, "phaseOwnerGateStatus") && stringField(artifact, "phaseOwnerGateStatus") !== "not-recorded") {
      addIssue(
        issues,
        "error",
        "phase3_descriptor_owner_gate",
        `${pathPrefix}.phaseOwnerGateStatus`,
        "Phase 3 descriptor phaseOwnerGateStatus must remain not-recorded.",
      );
    }

    const protocolSettings = isRecord(artifact.protocolSettings) ? artifact.protocolSettings : {};
    if (protocolSettings.useProductionMechanics !== undefined && protocolSettings.useProductionMechanics !== false) {
      addIssue(
        issues,
        "error",
        "phase3_descriptor_production_mechanics",
        `${pathPrefix}.protocolSettings.useProductionMechanics`,
        "Prior Phase 3 descriptors must not enable production mechanics.",
      );
    }
    if (protocolSettings.usePassiveLawAcceptance !== undefined && protocolSettings.usePassiveLawAcceptance !== false) {
      addIssue(
        issues,
        "error",
        "phase3_descriptor_passive_law",
        `${pathPrefix}.protocolSettings.usePassiveLawAcceptance`,
        "Prior Phase 3 descriptors must not accept a passive law.",
      );
    }

    const pendingOwnerDecisions = records(artifact.pendingOwnerDecisions);
    const decision19 = pendingOwnerDecisions.find((decision) => numericId(decision.decisionId) === 19);
    if (!decision19) {
      addIssue(
        issues,
        "error",
        "phase3_descriptor_decision19_missing",
        `${pathPrefix}.pendingOwnerDecisions`,
        "Prior Phase 3 descriptors must keep Decision 19 listed as PENDING OWNER.",
      );
    }
    for (const decision of pendingOwnerDecisions) {
      const decisionId = numericId(decision.decisionId);
      const status = stringField(decision, "status");
      if (decisionId === 19 && status !== "PENDING OWNER") {
        addIssue(
          issues,
          "error",
          "phase3_descriptor_decision19_status",
          `${pathPrefix}.pendingOwnerDecisions[#19].status`,
          "Decision 19 must remain PENDING OWNER in prior Phase 3 descriptors.",
        );
      }
      if (status && status !== "PENDING OWNER") {
        addIssue(
          issues,
          "error",
          "phase3_descriptor_owner_acceptance",
          `${pathPrefix}.pendingOwnerDecisions[#${decisionId ?? "unknown"}].status`,
          "Prior Phase 3 pending-owner decisions must not be mutated to owner acceptance or GO.",
        );
      }
    }

    const claimExclusions = isRecord(artifact.claimExclusions) ? artifact.claimExclusions : {};
    for (const key of [
      "ownerGateOutcome",
      "ownerAcceptance",
      "productionMechanics",
      "productionHomogenization",
      "passiveLawAcceptance",
    ]) {
      if (hasOwn(claimExclusions, key) && stringField(claimExclusions, key) !== "not-claimed") {
        addIssue(
          issues,
          "error",
          "phase3_descriptor_claim_exclusion",
          `${pathPrefix}.claimExclusions.${key}`,
          "Prior Phase 3 claim exclusions must remain not-claimed.",
        );
      }
    }
  }
}

function validateDecision19Docs(decisionDocs: readonly TextFileInput[], issues: ValidationIssue[]): void {
  for (const doc of decisionDocs) {
    const lines = doc.text.split(/\r?\n/);
    const decision19Rows = lines
      .map((line, index) => ({ line, index }))
      .filter(({ line }) => /^\|\s*19\s*\|/.test(line));

    if (decision19Rows.length !== 1) {
      addIssue(
        issues,
        "error",
        "decision19_row_missing",
        doc.path,
        "Decision 19 table row must appear exactly once.",
      );
    }
  }
}

function validateNoIntegrationLeak(integrationFiles: readonly TextFileInput[], issues: ValidationIssue[]): void {
  const forbiddenIds = [
    "phase3-owner-go-v1",
    "production-mechanics-phase4a-dossier-v1",
    ...REQUIRED_PHASE4A_CANDIDATES.map((candidate) => candidate.id),
  ];
  const forbiddenSelectionTokens = [
    "thick-sphere-v2",
    "TriSeg-lite",
    "full TriSeg",
    "recommendedCandidateId",
    "selectedCandidateId",
  ];

  for (const file of integrationFiles) {
    for (const forbiddenId of forbiddenIds) {
      if (file.text.includes(forbiddenId)) {
        addIssue(
          issues,
          "error",
          "mechanics_dossier_runtime_leak",
          file.path,
          `Runtime/official-case integration file must not reference ${forbiddenId}.`,
        );
      }
    }
    for (const forbiddenToken of forbiddenSelectionTokens) {
      if (file.text.includes(forbiddenToken)) {
        addIssue(
          issues,
          "error",
          "mechanics_dossier_runtime_leak",
          file.path,
          `Runtime/official-case integration file must not reference mechanics-selection token ${forbiddenToken}.`,
        );
      }
    }
  }
}

function hasOwnerSelectionProvenance(record: JsonRecord): boolean {
  return Boolean(
    stringField(record, "ownerAcceptedBy")
      && stringField(record, "ownerAcceptedAt")
      && stringField(record, "ownerAcceptedSourceType")
      && stringField(record, "ownerAcceptedSourceRef"),
  );
}

function loadIntegrationFiles(rootDir: string): TextFileInput[] {
  const targets = [
    "components",
    "contexts",
    "engine",
    "features",
    "hooks",
    "officialCases.ts",
    "data/cases",
    "public/cases",
    "utils",
  ];

  return targets.flatMap((target) => {
    const fullPath = path.join(rootDir, target);
    if (!existsSync(fullPath)) return [];
    return listFiles(fullPath)
      .filter((filePath) => isRuntimeScanFile(rootDir, filePath))
      .map((filePath) => ({
        path: path.relative(rootDir, filePath),
        text: readFileSync(filePath, "utf8"),
      }));
  });
}

function isRuntimeScanFile(rootDir: string, filePath: string): boolean {
  const relativePath = path.relative(rootDir, filePath).split(path.sep).join("/");
  const segments = relativePath.split("/");
  return !segments.includes("__tests__") && !SHADOW_PROTOCOL_SCAN_EXCLUSIONS.has(relativePath);
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

function records(value: unknown): JsonRecord[] {
  return Array.isArray(value) ? value.filter(isRecord) : [];
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

function recordText(record: JsonRecord): string {
  return Object.values(record)
    .map((value) => {
      if (typeof value === "string") return value;
      if (typeof value === "number" || typeof value === "boolean") return String(value);
      return "";
    })
    .join(" ");
}

function sameOrderedStrings(actual: readonly string[], expected: readonly string[]): boolean {
  return actual.length === expected.length && expected.every((value, index) => actual[index] === value);
}

function hasOwn(record: JsonRecord, field: string): boolean {
  return Object.prototype.hasOwnProperty.call(record, field);
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
