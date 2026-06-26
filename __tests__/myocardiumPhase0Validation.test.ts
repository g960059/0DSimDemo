import { describe, expect, it } from "vitest";
import sourcesRegistry from "@/data/myocardium/sources.json";
import decisionsArtifact from "@/data/myocardium/phase0-decisions.json";
import claimFreezeArtifact from "@/data/myocardium/targets/claim-freeze-v1.json";
import {
  REQUIRED_PHASE0_DECISION_IDS,
  validatePhase0Artifacts,
  type Phase0ValidationInput,
} from "@/tools/myocardium/phase0Validation";

describe("myocardium Phase 0 artifact validation", () => {
  it("passes current artifacts and reports pending owner decisions", () => {
    const report = validatePhase0Artifacts(fixture());

    expect(report.pass).toBe(true);
    expect(report.errors).toEqual([]);
    expect(report.pendingDecisions.map((decision) => decision.id)).toEqual(REQUIRED_PHASE0_DECISION_IDS);
    expect(report.summary.pendingDecisionCount).toBe(REQUIRED_PHASE0_DECISION_IDS.length);
  });

  it("fails when a required ADR acceptance decision is missing", () => {
    const input = fixture();
    input.decisionsArtifact.decisions = input.decisionsArtifact.decisions.filter((decision) => decision.id !== 9);

    const report = validatePhase0Artifacts(input);

    expect(report.pass).toBe(false);
    expect(report.errors.some((issue) => issue.code === "phase0_decision_missing")).toBe(true);
  });

  it("fails when the decision artifact expands beyond the ADR acceptance gate", () => {
    const input = fixture();
    input.decisionsArtifact.gate.requiredDecisionIds.push(8);
    input.decisionsArtifact.decisions.push({
      ...input.decisionsArtifact.decisions[0],
      id: 8,
      title: "Stiffness/tangent semantics",
    });

    const report = validatePhase0Artifacts(input);

    expect(report.pass).toBe(false);
    expect(report.errors.some((issue) => issue.code === "decisions_gate_required_ids_mismatch")).toBe(true);
    expect(report.errors.some((issue) => issue.code === "decision_outside_phase0_acceptance_gate")).toBe(true);
  });

  it("fails when the decision artifact itself claims acceptance", () => {
    const input = fixture();
    input.decisionsArtifact.artifact.status = "accepted";

    const report = validatePhase0Artifacts(input);

    expect(report.pass).toBe(false);
    expect(report.errors.some((issue) => issue.code === "decisions_artifact_status")).toBe(true);
  });

  it("fails when a required claim-freeze category is missing", () => {
    const input = fixture();
    input.claimFreezeArtifact.categories = input.claimFreezeArtifact.categories.filter(
      (category) => category.id !== "loaded-morphology-measurement",
    );

    const report = validatePhase0Artifacts(input);

    expect(report.pass).toBe(false);
    expect(report.errors.some((issue) => issue.code === "claim_freeze_category_missing")).toBe(true);
  });

  it("fails when claim-freeze source documents do not cite the verification plan", () => {
    const input = fixture();
    input.claimFreezeArtifact.sourceDocuments = input.claimFreezeArtifact.sourceDocuments.filter(
      (document) => document.id !== "myocardium-v1-verification",
    );

    const report = validatePhase0Artifacts(input);

    expect(report.pass).toBe(false);
    expect(report.errors.some((issue) => issue.code === "claim_freeze_source_document_missing")).toBe(true);
  });

  it("fails when claim-freeze metadata contains fitted results or acceptance claims", () => {
    const input = fixture();
    input.claimFreezeArtifact.categories[0].measurementDefinition.kind = "result";
    input.claimFreezeArtifact.categories[0].measurementDefinition.noFittedMeasurements = false;
    (input.claimFreezeArtifact.categories[0] as Record<string, unknown>).scientificAcceptanceClaim = "passes source protocol";

    const report = validatePhase0Artifacts(input);

    expect(report.pass).toBe(false);
    expect(report.errors.some((issue) => issue.code === "measurement_definition_kind")).toBe(true);
    expect(report.errors.some((issue) => issue.code === "measurement_definition_no_fitted_measurements")).toBe(true);
    expect(report.errors.some((issue) => issue.code === "claim_freeze_contains_results_or_claims")).toBe(true);
  });

  it("fails when a Phase A normative source is not verified", () => {
    const input = fixture();
    firstNormativeSource(input).verificationStatus = "bibliography-pending-persistent-id";

    const report = validatePhase0Artifacts(input);

    expect(report.pass).toBe(false);
    expect(report.errors.some((issue) => issue.code === "phasea_normative_source_unverified")).toBe(true);
  });

  it("fails when a Phase A normative source lacks source-policy bibliography fields", () => {
    const input = fixture();
    const source = firstNormativeSource(input);
    delete source.authors;
    delete source.doi;
    delete source.persistentId;
    delete source.url;

    const report = validatePhase0Artifacts(input);

    expect(report.pass).toBe(false);
    expect(report.errors.some((issue) => issue.code === "phasea_normative_source_missing_authors")).toBe(true);
    expect(
      report.errors.some((issue) => issue.code === "phasea_normative_source_missing_persistent_identifier"),
    ).toBe(true);
  });

  it("fails when an artifact references an unverified source for Phase A target or implementation use", () => {
    const input = fixture();
    input.claimFreezeArtifact.categories[0].sourceReferences.push({
      sourceId: "chapelle-et-al2012-energy-preserving-bcs",
      use: "implementation",
      detail: "Invalid unverified implementation reference for test coverage.",
    });

    const report = validatePhase0Artifacts(input);

    expect(report.pass).toBe(false);
    expect(report.errors.some((issue) => issue.code === "artifact_source_unverified_for_phasea_use")).toBe(true);
  });

  it("fails when an artifact source reference use is incompatible with source roles", () => {
    const input = fixture();
    input.decisionsArtifact.decisions[1].sourceReferences = [
      {
        sourceId: "regazzoni-quarteroni2020-active-stiffness",
        use: "equations",
        detail: "Invalid equation reference for test coverage.",
      },
    ];

    const report = validatePhase0Artifacts(input);

    expect(report.pass).toBe(false);
    expect(report.errors.some((issue) => issue.code === "artifact_source_role_incompatible")).toBe(true);
  });

  it("fails when an accepted owner decision lacks owner provenance metadata", () => {
    const input = fixture();
    input.decisionsArtifact.decisions[0].status = "accepted";

    const report = validatePhase0Artifacts(input);

    expect(report.pass).toBe(false);
    expect(report.errors.some((issue) => issue.code === "decision_accepted_missing_owner_metadata")).toBe(true);
  });

  it("fails when accepted owner decision metadata has an invalid date", () => {
    const input = fixture();
    const decision = input.decisionsArtifact.decisions[0] as Record<string, unknown>;
    decision.status = "accepted";
    decision.acceptedBy = "owner";
    decision.acceptedAt = "not-a-date";
    decision.acceptedSource = "ADR-MYO-001";

    const report = validatePhase0Artifacts(input);

    expect(report.pass).toBe(false);
    expect(report.errors.some((issue) => issue.code === "decision_accepted_invalid_date")).toBe(true);
  });

  it("fails when ADR-MYO-001 is accepted but required decisions remain pending", () => {
    const input = fixture();
    input.decisionsArtifact.sourceDocuments[0].status = "Accepted";

    const report = validatePhase0Artifacts(input);

    expect(report.pass).toBe(false);
    expect(report.errors.some((issue) => issue.code === "adr_accepted_decision_not_accepted")).toBe(true);
    expect(report.errors.some((issue) => issue.code === "decisions_adr_status_invalid")).toBe(false);
  });
});

function fixture(): Phase0ValidationInput & {
  sourcesRegistry: typeof sourcesRegistry;
  decisionsArtifact: typeof decisionsArtifact;
  claimFreezeArtifact: typeof claimFreezeArtifact;
} {
  return clone({
    sourcesRegistry,
    decisionsArtifact,
    claimFreezeArtifact,
  });
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function firstNormativeSource(input: Phase0ValidationInput & { sourcesRegistry: typeof sourcesRegistry }) {
  const source = input.sourcesRegistry.sources.find((candidate) => candidate.normativeForPhaseA);
  expect(source).toBeDefined();
  return source as Record<string, unknown> & { verificationStatus: string };
}
