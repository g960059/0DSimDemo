export const REQUIRED_PHASE0_DECISION_IDS = [1, 2, 3, 9, 11, 14, 15, 17, 20] as const;

export const REQUIRED_CLAIM_FREEZE_CATEGORY_IDS = [
  "cell-intact-target",
  "prescribed-trajectories",
  "loaded-morphology-measurement",
  "low-normal-high-afterload-family",
  "baseline-artifact",
  "performance-hardware",
  "prescribed-ca-claim-boundary",
] as const;

export type RequiredPhase0DecisionId = (typeof REQUIRED_PHASE0_DECISION_IDS)[number];
export type RequiredClaimFreezeCategoryId = (typeof REQUIRED_CLAIM_FREEZE_CATEGORY_IDS)[number];

export type ValidationSeverity = "error" | "warning";

export type ValidationIssue = {
  severity: ValidationSeverity;
  code: string;
  path: string;
  message: string;
};

export type PendingDecision = {
  id: RequiredPhase0DecisionId;
  title: string;
  decideBy: string;
};

export type Phase0ValidationReport = {
  pass: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  pendingDecisions: PendingDecision[];
  summary: {
    sourceCount: number;
    requiredDecisionCount: number;
    pendingDecisionCount: number;
    acceptedDecisionCount: number;
    claimFreezeCategoryCount: number;
    errorCount: number;
    warningCount: number;
  };
};

export type Phase0ValidationInput = {
  sourcesRegistry: unknown;
  decisionsArtifact: unknown;
  claimFreezeArtifact: unknown;
};

type JsonRecord = Record<string, unknown>;

type SourceRecord = {
  id: string;
  verificationStatus: string;
  normativeForPhaseA: boolean;
  roles: string[];
};

type AdrDocumentStatus = "Proposed" | "Accepted";

type SourceRegistryValidation = {
  sourceMap: Map<string, SourceRecord>;
  sourceCount: number;
};

const VERIFIED = "verified";
const ACCEPTED_DECISION_STATUS = "accepted";
const PENDING_DECISION_STATUS = "pending-owner";
const allowedAdrDocumentStatuses = new Set(["Proposed", "Accepted"]);

// These are the Phase A source-reference uses that can carry implementation,
// target-pack, or acceptance-threshold authority in the current artifacts.
const guardedSourceUses = new Set([
  "acceptance-threshold",
  "acceptance-thresholds",
  "equations",
  "implementation",
  "parameters",
  "source-parameters",
  "target",
  "target-pack",
  "thresholds",
]);

const compatibleSourceRolesByUse: Record<string, readonly string[]> = {
  "acceptance-threshold": ["acceptance-threshold", "acceptance-thresholds", "target-pack", "targets"],
  "acceptance-thresholds": ["acceptance-threshold", "acceptance-thresholds", "target-pack", "targets"],
  equations: ["equations"],
  implementation: [
    "cell-tissue-protocols",
    "closed-loop-coupling",
    "energy-accounting",
    "equations",
    "partitioned-coupling",
    "reference-configuration-context",
    "reference-solver-comparison",
    "source-parameters",
    "stabilization",
  ],
  parameters: ["parameters", "source-parameters"],
  "source-parameters": ["parameters", "source-parameters"],
  target: ["cell-tissue-protocols", "target-pack", "targets"],
  "target-pack": ["cell-tissue-protocols", "target-pack", "targets"],
  thresholds: ["acceptance-threshold", "acceptance-thresholds", "target-pack", "targets"],
};

export function validatePhase0Artifacts(input: Phase0ValidationInput): Phase0ValidationReport {
  const issues: ValidationIssue[] = [];
  const pendingDecisions: PendingDecision[] = [];

  const sourceValidation = validateSourcesRegistry(input.sourcesRegistry, issues);
  const decisionSummary = validateDecisionsArtifact(input.decisionsArtifact, issues, pendingDecisions);
  const claimFreezeCategoryCount = validateClaimFreezeArtifact(input.claimFreezeArtifact, issues);

  validateArtifactSourceReferences(
    input.decisionsArtifact,
    "phase0Decisions",
    sourceValidation.sourceMap,
    issues,
  );
  validateArtifactSourceReferences(
    input.claimFreezeArtifact,
    "claimFreeze",
    sourceValidation.sourceMap,
    issues,
  );

  const errors = issues.filter((issue) => issue.severity === "error");
  const warnings = issues.filter((issue) => issue.severity === "warning");

  return {
    pass: errors.length === 0,
    errors,
    warnings,
    pendingDecisions,
    summary: {
      sourceCount: sourceValidation.sourceCount,
      requiredDecisionCount: REQUIRED_PHASE0_DECISION_IDS.length,
      pendingDecisionCount: pendingDecisions.length,
      acceptedDecisionCount: decisionSummary.acceptedDecisionCount,
      claimFreezeCategoryCount,
      errorCount: errors.length,
      warningCount: warnings.length,
    },
  };
}

export function validateSourcesRegistry(
  registry: unknown,
  issues: ValidationIssue[] = [],
): SourceRegistryValidation {
  const sourceMap = new Map<string, SourceRecord>();
  if (!isRecord(registry)) {
    addIssue(issues, "error", "sources_registry_shape", "sources", "sources.json must be a JSON object.");
    return { sourceMap, sourceCount: 0 };
  }

  if (registry.schemaVersion !== 1) {
    addIssue(
      issues,
      "error",
      "sources_registry_schema_version",
      "sources.schemaVersion",
      "sources.json schemaVersion must be 1.",
    );
  }

  if (!Array.isArray(registry.sources)) {
    addIssue(issues, "error", "sources_registry_sources_array", "sources.sources", "sources must be an array.");
    return { sourceMap, sourceCount: 0 };
  }

  registry.sources.forEach((source, index) => {
    const path = `sources.sources[${index}]`;
    if (!isRecord(source)) {
      addIssue(issues, "error", "source_record_shape", path, "Source record must be an object.");
      return;
    }

    const id = stringField(source, "id");
    const title = stringField(source, "title");
    const venue = stringField(source, "venue");
    const verificationStatus = stringField(source, "verificationStatus");
    const normativeForPhaseA = source.normativeForPhaseA;
    const roles = source.roles;

    if (!id) addIssue(issues, "error", "source_missing_id", `${path}.id`, "Source id is required.");
    if (!title) addIssue(issues, "error", "source_missing_title", `${path}.title`, "Source title is required.");
    if (!venue) addIssue(issues, "error", "source_missing_venue", `${path}.venue`, "Source venue is required.");
    if (!verificationStatus) {
      addIssue(
        issues,
        "error",
        "source_missing_verification_status",
        `${path}.verificationStatus`,
        "Source verificationStatus is required.",
      );
    }
    if (typeof normativeForPhaseA !== "boolean") {
      addIssue(
        issues,
        "error",
        "source_missing_normative_for_phasea",
        `${path}.normativeForPhaseA`,
        "Source normativeForPhaseA must be a boolean.",
      );
    }
    if (!Array.isArray(roles) || roles.some((role) => typeof role !== "string")) {
      addIssue(issues, "error", "source_roles_shape", `${path}.roles`, "Source roles must be an array of strings.");
    }

    if (!id || !verificationStatus || typeof normativeForPhaseA !== "boolean") return;
    if (sourceMap.has(id)) {
      addIssue(issues, "error", "source_duplicate_id", `${path}.id`, `Duplicate source id: ${id}.`);
      return;
    }

    const sourceRecord = {
      id,
      verificationStatus,
      normativeForPhaseA,
      roles: Array.isArray(roles) ? roles.filter((role): role is string => typeof role === "string") : [],
    };
    sourceMap.set(id, sourceRecord);

    if (sourceRecord.normativeForPhaseA && sourceRecord.verificationStatus !== VERIFIED) {
      addIssue(
        issues,
        "error",
        "phasea_normative_source_unverified",
        `${path}.verificationStatus`,
        `Normative Phase A source ${id} must have verificationStatus "${VERIFIED}".`,
      );
    }
    if (sourceRecord.normativeForPhaseA) {
      validateNormativeSourceBibliography(source, path, id, issues);
    }
  });

  return { sourceMap, sourceCount: sourceMap.size };
}

function validateDecisionsArtifact(
  artifact: unknown,
  issues: ValidationIssue[],
  pendingDecisions: PendingDecision[],
): { acceptedDecisionCount: number } {
  let acceptedDecisionCount = 0;
  let artifactStatus: string | undefined;
  if (!isRecord(artifact)) {
    addIssue(
      issues,
      "error",
      "decisions_artifact_shape",
      "phase0Decisions",
      "phase0-decisions.json must be a JSON object.",
    );
    return { acceptedDecisionCount };
  }

  if (artifact.schemaVersion !== 1) {
    addIssue(
      issues,
      "error",
      "decisions_schema_version",
      "phase0Decisions.schemaVersion",
      "phase0-decisions.json schemaVersion must be 1.",
    );
  }

  if (!isRecord(artifact.artifact)) {
    addIssue(
      issues,
      "error",
      "decisions_artifact_metadata_missing",
      "phase0Decisions.artifact",
      "Decision artifact metadata is required.",
    );
  } else {
    if (stringField(artifact.artifact, "derivedFrom") !== "ADR-MYO-001") {
      addIssue(
        issues,
        "error",
        "decisions_not_derived_from_adr_myo_001",
        "phase0Decisions.artifact.derivedFrom",
        "Decision artifact must be derived from ADR-MYO-001.",
      );
    }
    artifactStatus = stringField(artifact.artifact, "status");
    if (artifactStatus !== PENDING_DECISION_STATUS && artifactStatus !== ACCEPTED_DECISION_STATUS) {
      addIssue(
        issues,
        "error",
        "decisions_artifact_status",
        "phase0Decisions.artifact.status",
        `Decision artifact status must be "${PENDING_DECISION_STATUS}" or "${ACCEPTED_DECISION_STATUS}".`,
      );
    }
    const purpose = stringField(artifact.artifact, "purpose");
    if (purpose && !purpose.toLowerCase().includes("not owner sign-off")) {
      addIssue(
        issues,
        "warning",
        "decisions_purpose_owner_signoff_ambiguous",
        "phase0Decisions.artifact.purpose",
        "Decision artifact purpose should clearly state that the artifact is not owner sign-off.",
      );
    }
  }

  const adrStatus = validateDecisionSourceDocuments(artifact.sourceDocuments, issues);
  validateRequiredDecisionGate(artifact.gate, issues);

  if (!Array.isArray(artifact.decisions)) {
    addIssue(
      issues,
      "error",
      "decisions_array_missing",
      "phase0Decisions.decisions",
      "Decision artifact must include a decisions array.",
    );
    return { acceptedDecisionCount };
  }

  const byId = new Map<number, JsonRecord>();
  artifact.decisions.forEach((decision, index) => {
    const path = `phase0Decisions.decisions[${index}]`;
    if (!isRecord(decision)) {
      addIssue(issues, "error", "decision_record_shape", path, "Decision record must be an object.");
      return;
    }

    const id = numericId(decision.id);
    if (id === undefined) {
      addIssue(issues, "error", "decision_missing_id", `${path}.id`, "Decision id must be numeric.");
      return;
    }

    if (byId.has(id)) {
      addIssue(issues, "error", "decision_duplicate_id", `${path}.id`, `Duplicate decision id: ${id}.`);
    }
    byId.set(id, decision);
  });

  for (const requiredId of REQUIRED_PHASE0_DECISION_IDS) {
    const decision = byId.get(requiredId);
    if (!decision) {
      addIssue(
        issues,
        "error",
        "phase0_decision_missing",
        `phase0Decisions.decisions[#${requiredId}]`,
        `Required ADR-MYO-001 Phase 0 decision ${requiredId} is missing.`,
      );
      continue;
    }

    validateRequiredDecisionRecord(requiredId, decision, issues);
    const status = stringField(decision, "status");
    if (status === ACCEPTED_DECISION_STATUS) acceptedDecisionCount += 1;
    if (status === PENDING_DECISION_STATUS) {
      pendingDecisions.push({
        id: requiredId,
        title: stringField(decision, "title") ?? `Decision ${requiredId}`,
        decideBy: stringField(decision, "decideBy") ?? "unknown",
      });
    }
  }

  for (const id of byId.keys()) {
    if (!isRequiredDecisionId(id)) {
      addIssue(
        issues,
        "error",
        "decision_outside_phase0_acceptance_gate",
        `phase0Decisions.decisions[#${id}]`,
        `Decision ${id} is outside the ADR-MYO-001 Phase 0 acceptance artifact gate.`,
      );
    }
  }

  if (adrStatus === "Proposed" && artifactStatus === ACCEPTED_DECISION_STATUS) {
    addIssue(
      issues,
      "error",
      "decisions_artifact_status",
      "phase0Decisions.artifact.status",
      "Decision artifact cannot claim accepted while ADR-MYO-001 remains Proposed.",
    );
  }

  if (adrStatus === "Accepted") {
    if (artifactStatus !== ACCEPTED_DECISION_STATUS) {
      addIssue(
        issues,
        "error",
        "decisions_artifact_status",
        "phase0Decisions.artifact.status",
        "Decision artifact must be accepted once ADR-MYO-001 is Accepted.",
      );
    }
    for (const requiredId of REQUIRED_PHASE0_DECISION_IDS) {
      const decision = byId.get(requiredId);
      if (!decision) continue;
      if (stringField(decision, "status") !== ACCEPTED_DECISION_STATUS) {
        addIssue(
          issues,
          "error",
          "adr_accepted_decision_not_accepted",
          `phase0Decisions.decisions[#${requiredId}].status`,
          `Decision ${requiredId} must be accepted when ADR-MYO-001 is Accepted.`,
        );
      }
    }
  }

  return { acceptedDecisionCount };
}

function validateDecisionSourceDocuments(sourceDocuments: unknown, issues: ValidationIssue[]): AdrDocumentStatus | null {
  if (!Array.isArray(sourceDocuments)) {
    addIssue(
      issues,
      "error",
      "decisions_source_documents_missing",
      "phase0Decisions.sourceDocuments",
      "Decision artifact must cite ADR-MYO-001 as its source document.",
    );
    return null;
  }

  const adrDocs = sourceDocuments.filter((document): document is JsonRecord => {
    return isRecord(document) && stringField(document, "id") === "ADR-MYO-001";
  });
  if (adrDocs.length !== 1) {
    addIssue(
      issues,
      "error",
      "decisions_adr_source_document_missing",
      "phase0Decisions.sourceDocuments",
      "Decision artifact must cite exactly one ADR-MYO-001 source document.",
    );
  }

  let adrStatus: AdrDocumentStatus | null = null;
  sourceDocuments.forEach((document, index) => {
    const path = `phase0Decisions.sourceDocuments[${index}]`;
    if (!isRecord(document)) {
      addIssue(issues, "error", "decisions_source_document_shape", path, "Source document must be an object.");
      return;
    }
    if (stringField(document, "id") !== "ADR-MYO-001") {
      addIssue(
        issues,
        "error",
        "decisions_competing_source_document",
        `${path}.id`,
        "Decision artifact must not introduce a competing normative source document.",
      );
    }
    const status = stringField(document, "status");
    if (!isAllowedAdrDocumentStatus(status)) {
      addIssue(
        issues,
        "error",
        "decisions_adr_status_invalid",
        `${path}.status`,
        "ADR-MYO-001 source document status must be Proposed or Accepted.",
      );
    }
    if (stringField(document, "id") === "ADR-MYO-001" && isAllowedAdrDocumentStatus(status)) {
      adrStatus = status;
    }
  });
  return adrStatus;
}

function validateRequiredDecisionGate(gate: unknown, issues: ValidationIssue[]): void {
  if (!isRecord(gate)) {
    addIssue(
      issues,
      "error",
      "decisions_gate_missing",
      "phase0Decisions.gate",
      "Decision artifact must include gate metadata.",
    );
    return;
  }

  const requiredDecisionIds = gate.requiredDecisionIds;
  if (!Array.isArray(requiredDecisionIds)) {
    addIssue(
      issues,
      "error",
      "decisions_gate_required_ids_missing",
      "phase0Decisions.gate.requiredDecisionIds",
      "Gate metadata must list required decision ids.",
    );
    return;
  }

  const ids = requiredDecisionIds.map(numericId).filter((id): id is number => id !== undefined);
  if (!sameNumberSet(ids, REQUIRED_PHASE0_DECISION_IDS)) {
    addIssue(
      issues,
      "error",
      "decisions_gate_required_ids_mismatch",
      "phase0Decisions.gate.requiredDecisionIds",
      `Gate requiredDecisionIds must exactly match ${REQUIRED_PHASE0_DECISION_IDS.join(", ")}.`,
    );
  }
}

function validateRequiredDecisionRecord(
  id: RequiredPhase0DecisionId,
  decision: JsonRecord,
  issues: ValidationIssue[],
): void {
  const path = `phase0Decisions.decisions[#${id}]`;
  for (const field of ["title", "decision", "recommendedDefault", "decideBy", "status"]) {
    if (!stringField(decision, field)) {
      addIssue(issues, "error", "decision_missing_field", `${path}.${field}`, `Decision ${id} requires ${field}.`);
    }
  }

  const status = stringField(decision, "status");
  if (status !== PENDING_DECISION_STATUS && status !== ACCEPTED_DECISION_STATUS) {
    addIssue(
      issues,
      "error",
      "decision_invalid_status",
      `${path}.status`,
      `Decision ${id} status must be "${PENDING_DECISION_STATUS}" or "${ACCEPTED_DECISION_STATUS}".`,
    );
    return;
  }

  if (status === ACCEPTED_DECISION_STATUS) validateAcceptanceMetadata(id, decision, path, issues);
}

function validateClaimFreezeArtifact(artifact: unknown, issues: ValidationIssue[]): number {
  if (!isRecord(artifact)) {
    addIssue(
      issues,
      "error",
      "claim_freeze_artifact_shape",
      "claimFreeze",
      "claim-freeze-v1.json must be a JSON object.",
    );
    return 0;
  }

  if (artifact.schemaVersion !== 1) {
    addIssue(
      issues,
      "error",
      "claim_freeze_schema_version",
      "claimFreeze.schemaVersion",
      "claim-freeze-v1.json schemaVersion must be 1.",
    );
  }

  const artifactStatus = isRecord(artifact.artifact) ? stringField(artifact.artifact, "status") : undefined;
  const freeze = isRecord(artifact.freeze) ? artifact.freeze : {};
  const freezeStatus = stringField(freeze, "status");
  const ownerAcceptanceStatus = stringField(freeze, "ownerAcceptanceStatus");
  if (artifactStatus !== "candidate") {
    addIssue(
      issues,
      "error",
      "claim_freeze_artifact_status",
      "claimFreeze.artifact.status",
      "Claim-freeze artifact status must be candidate, not owner acceptance.",
    );
  }
  if (freezeStatus !== "candidate") {
    addIssue(
      issues,
      "error",
      "claim_freeze_status",
      "claimFreeze.freeze.status",
      "Claim-freeze metadata status must be candidate, not owner acceptance.",
    );
  }
  if (ownerAcceptanceStatus === ACCEPTED_DECISION_STATUS) {
    addIssue(
      issues,
      "error",
      "claim_freeze_owner_acceptance_status",
      "claimFreeze.freeze.ownerAcceptanceStatus",
      "Claim-freeze metadata must not claim owner acceptance.",
    );
  }

  validateClaimFreezeSourceDocuments(artifact.sourceDocuments, issues);

  if (!Array.isArray(artifact.categories)) {
    addIssue(
      issues,
      "error",
      "claim_freeze_categories_missing",
      "claimFreeze.categories",
      "Claim-freeze artifact must include categories.",
    );
    return 0;
  }

  const byId = new Map<string, JsonRecord>();
  artifact.categories.forEach((category, index) => {
    const path = `claimFreeze.categories[${index}]`;
    if (!isRecord(category)) {
      addIssue(issues, "error", "claim_freeze_category_shape", path, "Claim-freeze category must be an object.");
      return;
    }

    const id = stringField(category, "id");
    if (!id) {
      addIssue(issues, "error", "claim_freeze_category_missing_id", `${path}.id`, "Category id is required.");
      return;
    }
    if (byId.has(id)) {
      addIssue(issues, "error", "claim_freeze_duplicate_category", `${path}.id`, `Duplicate category id: ${id}.`);
    }
    byId.set(id, category);

    if (!stringField(category, "category")) {
      addIssue(
        issues,
        "error",
        "claim_freeze_category_missing_label",
        `${path}.category`,
        `Category ${id} requires a category label.`,
      );
    }
    if (stringField(category, "status") !== "candidate") {
      addIssue(
        issues,
        "error",
        "claim_freeze_category_status",
        `${path}.status`,
        `Category ${id} status must be candidate.`,
      );
    }
    validateMeasurementDefinition(category.measurementDefinition, `${path}.measurementDefinition`, issues);
  });

  for (const requiredId of REQUIRED_CLAIM_FREEZE_CATEGORY_IDS) {
    if (!byId.has(requiredId)) {
      addIssue(
        issues,
        "error",
        "claim_freeze_category_missing",
        `claimFreeze.categories[#${requiredId}]`,
        `Required target/claim freeze category "${requiredId}" is missing.`,
      );
    }
  }

  validateNoClaimFreezeResults(artifact, "claimFreeze", issues);

  return byId.size;
}

function validateMeasurementDefinition(
  measurementDefinition: unknown,
  path: string,
  issues: ValidationIssue[],
): void {
  if (!isRecord(measurementDefinition)) {
    addIssue(
      issues,
      "error",
      "measurement_definition_missing",
      path,
      "Category requires a measurementDefinition object.",
    );
    return;
  }

  if (!stringField(measurementDefinition, "id")) {
    addIssue(
      issues,
      "error",
      "measurement_definition_missing_id",
      `${path}.id`,
      "Measurement definition requires an id.",
    );
  }
  if (measurementDefinition.kind !== "metadata-only") {
    addIssue(
      issues,
      "error",
      "measurement_definition_kind",
      `${path}.kind`,
      "Measurement definition kind must be metadata-only.",
    );
  }
  if (measurementDefinition.noFittedMeasurements !== true) {
    addIssue(
      issues,
      "error",
      "measurement_definition_no_fitted_measurements",
      `${path}.noFittedMeasurements`,
      "Measurement definition must explicitly exclude fitted measurements.",
    );
  }
}

function validateArtifactSourceReferences(
  value: unknown,
  rootPath: string,
  sourceMap: Map<string, SourceRecord>,
  issues: ValidationIssue[],
): void {
  walk(value, rootPath, (current, path) => {
    if (!isRecord(current)) return;
    for (const key of ["sourceReferences", "registrySourceReferences"]) {
      const references = current[key];
      if (references === undefined) continue;
      if (!Array.isArray(references)) {
        addIssue(issues, "error", "artifact_source_refs_shape", `${path}.${key}`, `${key} must be an array.`);
        continue;
      }

      references.forEach((reference, index) => {
        const refPath = `${path}.${key}[${index}]`;
        if (!isRecord(reference)) {
          addIssue(issues, "error", "artifact_source_ref_shape", refPath, "Source reference must be an object.");
          return;
        }

        const sourceId = stringField(reference, "sourceId");
        if (!sourceId) {
          addIssue(issues, "error", "artifact_source_ref_missing_id", `${refPath}.sourceId`, "sourceId is required.");
          return;
        }

        const source = sourceMap.get(sourceId);
        if (!source) {
          addIssue(
            issues,
            "error",
            "artifact_source_ref_unknown",
            `${refPath}.sourceId`,
            `Artifact references unknown source id: ${sourceId}.`,
          );
          return;
        }

        const use = stringField(reference, "use");
        if (use && guardedSourceUses.has(use) && source.verificationStatus !== VERIFIED) {
          addIssue(
            issues,
            "error",
            "artifact_source_unverified_for_phasea_use",
            refPath,
            `Artifact references unverified source ${sourceId} for Phase A ${use}.`,
          );
        }
        if (use && guardedSourceUses.has(use) && !isSourceRoleCompatible(use, source.roles)) {
          addIssue(
            issues,
            "error",
            "artifact_source_role_incompatible",
            refPath,
            `Artifact references source ${sourceId} for Phase A ${use}, but source roles are ${source.roles.join(", ") || "empty"}.`,
          );
        }
      });
    }
  });
}

function validateNoClaimFreezeResults(value: unknown, rootPath: string, issues: ValidationIssue[]): void {
  const forbiddenKeys = new Set([
    "acceptanceThreshold",
    "acceptanceThresholds",
    "acceptedResults",
    "fitResults",
    "fittedMeasurement",
    "fittedMeasurements",
    "measuredValues",
    "scientificAcceptanceClaim",
    "scientificAcceptanceClaims",
  ]);

  walk(value, rootPath, (current, path) => {
    if (!isRecord(current)) return;
    for (const key of Object.keys(current)) {
      if (!forbiddenKeys.has(key)) continue;
      addIssue(
        issues,
        "error",
        "claim_freeze_contains_results_or_claims",
        `${path}.${key}`,
        "Claim-freeze artifact must remain metadata-only and cannot contain fitted measurements, thresholds, results, or scientific acceptance claims.",
      );
    }
  });
}

function validateNormativeSourceBibliography(
  source: JsonRecord,
  path: string,
  sourceId: string,
  issues: ValidationIssue[],
): void {
  if (typeof source.year !== "number" || !Number.isInteger(source.year)) {
    addIssue(
      issues,
      "error",
      "phasea_normative_source_missing_year",
      `${path}.year`,
      `Normative Phase A source ${sourceId} must include an integer year.`,
    );
  }
  const authors = source.authors;
  if (!Array.isArray(authors) || authors.some((author) => typeof author !== "string" || author.trim() === "")) {
    addIssue(
      issues,
      "error",
      "phasea_normative_source_missing_authors",
      `${path}.authors`,
      `Normative Phase A source ${sourceId} must include a non-empty authors array.`,
    );
  }

  const doi = stringField(source, "doi");
  const persistentId = stringField(source, "persistentId");
  const url = stringField(source, "url");
  if (!doi && !persistentId && !url) {
    addIssue(
      issues,
      "error",
      "phasea_normative_source_missing_persistent_identifier",
      path,
      `Normative Phase A source ${sourceId} must include doi, persistentId, or url.`,
    );
  }
  if (!doi && !url && persistentId && /^pmid:?/i.test(persistentId.trim())) {
    addIssue(
      issues,
      "error",
      "phasea_normative_source_pmid_only",
      `${path}.persistentId`,
      `Normative Phase A source ${sourceId} must not use a PMID-only persistent identifier.`,
    );
  }
}

function validateClaimFreezeSourceDocuments(sourceDocuments: unknown, issues: ValidationIssue[]): void {
  if (!Array.isArray(sourceDocuments)) {
    addIssue(
      issues,
      "error",
      "claim_freeze_source_documents_missing",
      "claimFreeze.sourceDocuments",
      "Claim-freeze artifact must cite ADR-MYO-001 and the verification plan.",
    );
    return;
  }

  const requiredDocuments = new Set(["ADR-MYO-001", "myocardium-v1-verification"]);
  const seen = new Set<string>();
  sourceDocuments.forEach((document, index) => {
    const path = `claimFreeze.sourceDocuments[${index}]`;
    if (!isRecord(document)) {
      addIssue(issues, "error", "claim_freeze_source_document_shape", path, "Source document must be an object.");
      return;
    }
    const id = stringField(document, "id");
    if (id) seen.add(id);
    const status = stringField(document, "status");
    if (!isAllowedAdrDocumentStatus(status)) {
      addIssue(
        issues,
        "error",
        "claim_freeze_source_document_status_invalid",
        `${path}.status`,
        "Claim-freeze source document status must be Proposed or Accepted.",
      );
    }
  });

  for (const requiredId of requiredDocuments) {
    if (!seen.has(requiredId)) {
      addIssue(
        issues,
        "error",
        "claim_freeze_source_document_missing",
        "claimFreeze.sourceDocuments",
        `Claim-freeze artifact must cite ${requiredId}.`,
      );
    }
  }
}

function validateAcceptanceMetadata(
  id: RequiredPhase0DecisionId,
  decision: JsonRecord,
  path: string,
  issues: ValidationIssue[],
): void {
  const acceptance = isRecord(decision.acceptance) ? decision.acceptance : {};
  const acceptedBy = stringField(decision, "acceptedBy") ?? stringField(acceptance, "acceptedBy");
  const acceptedAt = stringField(decision, "acceptedAt") ?? stringField(acceptance, "acceptedAt");
  const acceptedSource = stringField(decision, "acceptedSource") ?? stringField(acceptance, "acceptedSource");
  if (!acceptedBy || !acceptedAt || !acceptedSource) {
    addIssue(
      issues,
      "error",
      "decision_accepted_missing_owner_metadata",
      path,
      `Decision ${id} is accepted but lacks acceptedBy, acceptedAt, and acceptedSource metadata.`,
    );
    return;
  }
  if (!isIsoDateLike(acceptedAt)) {
    addIssue(
      issues,
      "error",
      "decision_accepted_invalid_date",
      `${path}.acceptedAt`,
      `Decision ${id} acceptedAt must be an ISO date or timestamp.`,
    );
  }
}

function isSourceRoleCompatible(use: string, roles: readonly string[]): boolean {
  const compatibleRoles = compatibleSourceRolesByUse[use];
  if (!compatibleRoles) return true;
  return compatibleRoles.some((role) => roles.includes(role));
}

function isAllowedAdrDocumentStatus(status: string | undefined): status is AdrDocumentStatus {
  return Boolean(status && allowedAdrDocumentStatuses.has(status));
}

function isIsoDateLike(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}(?:T.+)?$/.test(value) && !Number.isNaN(Date.parse(value));
}

function walk(value: unknown, path: string, visit: (value: unknown, path: string) => void): void {
  visit(value, path);
  if (Array.isArray(value)) {
    value.forEach((item, index) => walk(item, `${path}[${index}]`, visit));
    return;
  }
  if (!isRecord(value)) return;
  for (const [key, child] of Object.entries(value)) {
    walk(child, `${path}.${key}`, visit);
  }
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringField(record: JsonRecord, key: string): string | undefined {
  const value = record[key];
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}

function numericId(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isInteger(value)) return value;
  if (typeof value === "string" && /^\d+$/.test(value)) return Number(value);
  return undefined;
}

function isRequiredDecisionId(id: number): id is RequiredPhase0DecisionId {
  return REQUIRED_PHASE0_DECISION_IDS.includes(id as RequiredPhase0DecisionId);
}

function sameNumberSet(actual: readonly number[], expected: readonly number[]): boolean {
  if (actual.length !== expected.length) return false;
  const actualSorted = [...actual].sort((a, b) => a - b);
  const expectedSorted = [...expected].sort((a, b) => a - b);
  return actualSorted.every((value, index) => value === expectedSorted[index]);
}

function addIssue(
  issues: ValidationIssue[],
  severity: ValidationSeverity,
  code: string,
  path: string,
  message: string,
): void {
  issues.push({ severity, code, path, message });
}
