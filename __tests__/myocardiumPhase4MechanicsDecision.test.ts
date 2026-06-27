import { describe, expect, it } from "vitest";
import sourcesRegistry from "@/data/myocardium/sources.json";
import phase3OwnerGate from "@/data/myocardium/gates/phase3-owner-go-v1.json";
import mechanicsDossier from "@/data/myocardium/decisions/production-mechanics-phase4a-dossier-v1.json";
import phase3aDescriptor from "@/data/myocardium/protocols/thick-sphere-phase3a-kinematics-protocols.json";
import phase3bDescriptor from "@/data/myocardium/protocols/identity-force-phase3b-protocols.json";
import phase3cDescriptor from "@/data/myocardium/protocols/minimal-loaded-phase3c-afterload-protocols.json";
import {
  loadMechanicsDecisionValidationInput,
  validateMechanicsDecisionDossier,
  type MechanicsDecisionValidationInput,
} from "@/tools/myocardium/phase4aMechanicsDecisionValidation";

describe("myocardium Phase 4A mechanics decision dossier validation", () => {
  it("passes the current repository artifacts and boundary scans", () => {
    const input = loadMechanicsDecisionValidationInput(process.cwd());
    const report = validateMechanicsDecisionDossier(input);

    expect(report.pass).toBe(true);
    expect(report.errors).toEqual([]);
    expect(report.summary.candidateCount).toBe(3);
    expect(report.summary.criterionCount).toBeGreaterThanOrEqual(6);
    expect(input.integrationFiles.some((file) => file.path.startsWith("engine/myocardium/"))).toBe(true);
    expect(input.integrationFiles.some((file) => file.path.startsWith("engine/mechanics/"))).toBe(true);
    expect(
      input.integrationFiles.some(
        (file) => file.path === "engine/myocardium/protocols/landActiveStressReplacementReadiness.ts",
      ),
    ).toBe(false);
  });

  it("fails when the Phase 3 owner GO is missing or not GO", () => {
    const input = fixture();
    input.phase3OwnerGate.outcome = "REVISE";

    const report = validateMechanicsDecisionDossier(input);

    expect(report.pass).toBe(false);
    expect(report.errors.some((issue) => issue.code === "phase3_go_outcome")).toBe(true);
  });

  it("fails when the Phase 3 GO claims broader authorization", () => {
    const input = fixture();
    input.phase3OwnerGate.scope.unlocks = [
      {
        phase: "Phase 4B",
        work: "production mechanics integration",
      },
    ];

    const report = validateMechanicsDecisionDossier(input);

    expect(report.pass).toBe(false);
    expect(report.errors.some((issue) => issue.code === "phase3_go_broad_authorization")).toBe(true);
  });

  it("fails when the Phase 3 GO provenance is incomplete", () => {
    const input = fixture();
    delete (input.phase3OwnerGate as Record<string, unknown>).acceptedSourceRef;

    const report = validateMechanicsDecisionDossier(input);

    expect(report.pass).toBe(false);
    expect(report.errors.some((issue) => issue.code === "phase3_go_missing_owner_provenance")).toBe(true);
  });

  it("fails when required evidence references are not separate", () => {
    const input = fixture();
    (input.phase3OwnerGate as Record<string, unknown>).evidenceRefs = [
      {
        label: "PR #162",
        path: "data/myocardium/protocols/minimal-loaded-phase3c-afterload-protocols.json",
      },
    ];

    const report = validateMechanicsDecisionDossier(input);

    expect(report.pass).toBe(false);
    expect(report.errors.some((issue) => issue.code === "phase3_go_evidence_not_separate")).toBe(true);
  });

  it("fails when candidate ids or criteria are incomplete", () => {
    const input = fixture();
    input.dossier.candidateSet = input.dossier.candidateSet.slice(0, 2);
    input.dossier.criteria = input.dossier.criteria.filter(
      (criterion) => criterion.id !== "virtual-power-closure-readiness",
    );

    const report = validateMechanicsDecisionDossier(input);

    expect(report.pass).toBe(false);
    expect(report.errors.some((issue) => issue.code === "dossier_candidate_set")).toBe(true);
    expect(report.errors.some((issue) => issue.code === "dossier_criteria_missing")).toBe(true);
  });

  it("fails when the recommendation lacks required scope and TriSeg contingency", () => {
    const input = fixture();
    input.dossier.recommendation.scopeAssumption = "Use thick-sphere-v2 first.";
    delete (input.dossier.recommendation as Record<string, unknown>).contingency;

    const report = validateMechanicsDecisionDossier(input);

    expect(report.pass).toBe(false);
    expect(report.errors.some((issue) => issue.code === "dossier_recommendation_scope")).toBe(true);
    expect(report.errors.some((issue) => issue.code === "dossier_recommendation_contingency")).toBe(true);
  });

  it("fails when the thick-sphere recommendation scope omits RV pressure overload", () => {
    const input = fixture();
    input.dossier.recommendation.scopeAssumption =
      "The first integration scope is assumed to be global preload/afterload or normal/global LV/RV failure without septal bowing or ventricular interdependence as the primary mechanism.";

    const report = validateMechanicsDecisionDossier(input);

    expect(report.pass).toBe(false);
    expect(report.errors.some((issue) => issue.code === "dossier_recommendation_scope")).toBe(true);
  });

  it("fails when selectedCandidateId is set without owner provenance or dossier claims acceptance", () => {
    const input = fixture();
    input.dossier.selectedCandidateId = "thick-sphere-v2-explicit-external-septal-coupling";
    input.dossier.ownerAcceptanceStatus = "accepted";

    const report = validateMechanicsDecisionDossier(input);

    expect(report.pass).toBe(false);
    expect(
      report.errors.some((issue) => issue.code === "dossier_selected_candidate_requires_owner_provenance"),
    ).toBe(true);
    expect(report.errors.some((issue) => issue.code === "dossier_owner_acceptance_claim")).toBe(true);
  });

  it("fails when TriSeg source verification, role, or no-auto-adopt boundary is missing", () => {
    const input = fixture();
    const source = input.sourcesRegistry.sources.find((candidate) => candidate.id === "circadapt-triseg-docs-2407");
    expect(source).toBeDefined();
    source!.verificationStatus = "pending";
    source!.roles = ["general-reference"];
    input.dossier.sourceReferences[0].boundary = "candidate-definition";
    input.dossier.recommendation.noAutoAdoptTriSeg = false;

    const report = validateMechanicsDecisionDossier(input);

    expect(report.pass).toBe(false);
    expect(report.errors.some((issue) => issue.code === "triseg_source_unverified")).toBe(true);
    expect(report.errors.some((issue) => issue.code === "triseg_source_wrong_role")).toBe(true);
    expect(report.errors.some((issue) => issue.code === "dossier_no_auto_adopt")).toBe(true);
  });

  it("fails when the TriSeg dossier reference escalates use, role, or boundary independently", () => {
    for (const mutate of [
      (input: ReturnType<typeof fixture>) => {
        input.dossier.sourceReferences[0].use = "implementation";
      },
      (input: ReturnType<typeof fixture>) => {
        input.dossier.sourceReferences[0].role = "implementation";
      },
      (input: ReturnType<typeof fixture>) => {
        input.dossier.sourceReferences[0].boundary = "candidate-definition";
      },
    ]) {
      const input = fixture();
      mutate(input);

      const report = validateMechanicsDecisionDossier(input);

      expect(report.pass).toBe(false);
      expect(
        report.errors.some(
          (issue) =>
            issue.code === "triseg_dossier_source_ref_wrong_role"
            || issue.code === "dossier_no_auto_adopt",
        ),
      ).toBe(true);
    }
  });

  it("fails when prior Phase 3 descriptors are mutated to owner acceptance or production mechanics", () => {
    const input = fixture();
    const phase3c = input.phase3Descriptors[2].artifact;
    phase3c.ownerAcceptanceStatus = "accepted";
    phase3c.phaseOwnerGateStatus = "GO";
    phase3c.protocolSettings.useProductionMechanics = true;
    phase3c.pendingOwnerDecisions.find((decision) => decision.decisionId === 19)!.status = "ACCEPTED";

    const report = validateMechanicsDecisionDossier(input);

    expect(report.pass).toBe(false);
    expect(report.errors.some((issue) => issue.code === "phase3_descriptor_owner_acceptance")).toBe(true);
    expect(report.errors.some((issue) => issue.code === "phase3_descriptor_owner_gate")).toBe(true);
    expect(report.errors.some((issue) => issue.code === "phase3_descriptor_production_mechanics")).toBe(true);
    expect(report.errors.some((issue) => issue.code === "phase3_descriptor_decision19_status")).toBe(true);
  });

  it("fails when Decision 19 is removed from prior Phase 3 descriptors or decision docs", () => {
    const input = fixture();
    const phase3c = input.phase3Descriptors[2].artifact;
    phase3c.pendingOwnerDecisions = phase3c.pendingOwnerDecisions.filter((decision) => decision.decisionId !== 19);
    input.decisionDocs[1].text = input.decisionDocs[1].text.replace(
      "| 19 | production ventricular mechanics | thick-sphere / TriSeg-lite / TriSeg-compatible | before Phase 4B+ | PENDING OWNER |",
      "",
    );

    const report = validateMechanicsDecisionDossier(input);

    expect(report.pass).toBe(false);
    expect(report.errors.some((issue) => issue.code === "phase3_descriptor_decision19_missing")).toBe(true);
    expect(report.errors.some((issue) => issue.code === "decision19_row_missing")).toBe(true);
  });

  it("fails when dossier ids leak into runtime or official-case integration files", () => {
    const input = fixture();
    input.integrationFiles = [
      {
        path: "engine/ModelCore.ts",
        text: "const dossier = 'production-mechanics-phase4a-dossier-v1';",
      },
      {
        path: "engine/core/stateLayout.ts",
        text: "const selectedCandidateId = 'thick-sphere-v2';",
      },
      {
        path: "engine/myocardium/mechanics/index.ts",
        text: "const label = 'TriSeg-lite';",
      },
    ];

    const report = validateMechanicsDecisionDossier(input);

    expect(report.pass).toBe(false);
    expect(report.errors.some((issue) => issue.code === "mechanics_dossier_runtime_leak")).toBe(true);
  });

  it("allows Decision 19 docs to record accepted owner-selection prose", () => {
    const input = fixture();
    input.decisionDocs[0].text = input.decisionDocs[0].text.replace(
      "| 19 | production ventricular mechanics | thick-sphere / TriSeg-lite / TriSeg-compatible | before Phase 4B+ | PENDING OWNER |",
      "| 19 | production ventricular mechanics | thick-sphere / TriSeg-lite / TriSeg-compatible | before Phase 4B+ | ACCEPTED 2026-06-27 |",
    );
    input.decisionDocs[0].text += "\nDecision 19 owner selection recorded for thick-sphere-v2.";

    const report = validateMechanicsDecisionDossier(input);

    expect(report.pass).toBe(true);
    expect(report.errors).toEqual([]);
  });
});

function fixture(): MechanicsDecisionValidationInput & {
  phase3OwnerGate: typeof phase3OwnerGate;
  dossier: typeof mechanicsDossier;
  sourcesRegistry: typeof sourcesRegistry;
  phase3Descriptors: [
    { id: string; path: string; artifact: typeof phase3aDescriptor },
    { id: string; path: string; artifact: typeof phase3bDescriptor },
    { id: string; path: string; artifact: typeof phase3cDescriptor },
  ];
} {
  return {
    phase3OwnerGate: clone(phase3OwnerGate),
    dossier: clone(mechanicsDossier),
    sourcesRegistry: clone(sourcesRegistry),
    phase3Descriptors: [
      {
        id: "phase3a-thick-sphere-kinematics",
        path: "data/myocardium/protocols/thick-sphere-phase3a-kinematics-protocols.json",
        artifact: clone(phase3aDescriptor),
      },
      {
        id: "phase3b-identity-generalized-force",
        path: "data/myocardium/protocols/identity-force-phase3b-protocols.json",
        artifact: clone(phase3bDescriptor),
      },
      {
        id: "phase3c-minimal-loaded-afterload",
        path: "data/myocardium/protocols/minimal-loaded-phase3c-afterload-protocols.json",
        artifact: clone(phase3cDescriptor),
      },
    ],
    decisionDocs: [
      {
        path: "docs/myocardium/adr/ADR-MYO-001.md",
        text: "| 19 | production ventricular mechanics | thick-sphere / TriSeg-lite / TriSeg-compatible | before Phase 4B+ | PENDING OWNER |",
      },
      {
        path: "docs/myocardium/roadmap/myocardium-rebuild-roadmap.md",
        text: "| 19 | production ventricular mechanics | thick-sphere / TriSeg-lite / TriSeg-compatible | before Phase 4B+ | PENDING OWNER |",
      },
      {
        path: "docs/myocardium/research/myocardial-contraction-rebuild-design-record.md",
        text: "| 19 | production ventricular mechanics | thick-sphere / TriSeg-lite / TriSeg-compatible | before Phase 4B+ | PENDING OWNER |",
      },
    ],
    integrationFiles: [],
  };
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
