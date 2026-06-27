import { describe, expect, it } from "vitest";
import sourcesRegistry from "@/data/myocardium/sources.json";
import phase3OwnerGate from "@/data/myocardium/gates/phase3-owner-go-v1.json";
import mechanicsDossier from "@/data/myocardium/decisions/production-mechanics-phase4a-dossier-v1.json";
import ownerSelection from "@/data/myocardium/decisions/production-mechanics-decision19-owner-selection-v1.json";
import phase3aDescriptor from "@/data/myocardium/protocols/thick-sphere-phase3a-kinematics-protocols.json";
import phase3bDescriptor from "@/data/myocardium/protocols/identity-force-phase3b-protocols.json";
import phase3cDescriptor from "@/data/myocardium/protocols/minimal-loaded-phase3c-afterload-protocols.json";
import {
  loadMechanicsOwnerSelectionValidationInput,
  validateMechanicsOwnerSelection,
  type MechanicsOwnerSelectionValidationInput,
} from "@/tools/myocardium/phase4aMechanicsOwnerSelectionValidation";

describe("myocardium Phase 4A mechanics owner-selection validation", () => {
  it("passes the current repository artifacts and boundary scans", () => {
    const input = loadMechanicsOwnerSelectionValidationInput(process.cwd());
    const report = validateMechanicsOwnerSelection(input);

    expect(report.pass).toBe(true);
    expect(report.errors).toEqual([]);
    expect(report.summary.ownerSelectionPresent).toBe(true);
    expect(report.summary.decisionDocCount).toBe(3);
  });

  it("fails when owner-selection provenance is missing", () => {
    const input = fixture();
    delete (input.ownerSelection as Record<string, unknown>).ownerAcceptedSourceRef;

    const report = validateMechanicsOwnerSelection(input);

    expect(report.pass).toBe(false);
    expect(report.errors.some((issue) => issue.code === "owner_selection_exact_field")).toBe(true);
  });

  it("fails when the selected candidate does not match the dossier recommendation", () => {
    const input = fixture();
    input.ownerSelection.selectedCandidateId = "triseg-lite-compatible";

    const report = validateMechanicsOwnerSelection(input);

    expect(report.pass).toBe(false);
    expect(report.errors.some((issue) => issue.code === "owner_selection_candidate_not_recommended")).toBe(true);
  });

  it("fails when official-case scope is missing", () => {
    const input = fixture();
    delete (input.ownerSelection as Record<string, unknown>).officialCaseScope;

    const report = validateMechanicsOwnerSelection(input);

    expect(report.pass).toBe(false);
    expect(report.errors.some((issue) => issue.code === "owner_selection_official_case_scope_missing")).toBe(true);
  });

  it("fails when current priority is hollow even if official-case scope has scope text", () => {
    const input = fixture();
    input.ownerSelection.currentPriority = {
      summary: "Recorded elsewhere.",
      requiredChecks: [],
    };

    const report = validateMechanicsOwnerSelection(input);

    expect(report.pass).toBe(false);
    expect(report.errors.some((issue) => issue.code === "owner_selection_current_priority")).toBe(true);
  });

  it("fails when initial scope implies RV or interdependence coverage", () => {
    const input = fixture();
    input.ownerSelection.officialCaseScope.initialBackendScope +=
      " It covers RV pressure overload and ventricular interdependence in the initial backend.";

    const report = validateMechanicsOwnerSelection(input);

    expect(report.pass).toBe(false);
    expect(report.errors.some((issue) => issue.code === "owner_selection_scope_overclaim")).toBe(true);
  });

  it("allows explicit negative coverage wording in official-case scope", () => {
    const input = fixture();
    input.ownerSelection.officialCaseScope.limitedScopeBoundary =
      "This limited-scope initial backend only does not cover RV pressure overload, septal bowing, ventricular interdependence, or right-heart failure as primary or final scope.";

    const report = validateMechanicsOwnerSelection(input);

    expect(report.pass).toBe(true);
  });

  it("fails when the future TriSeg path is missing", () => {
    const input = fixture();
    const futureEscalation = input.ownerSelection.futureRequiredMechanicsEscalation as Record<string, unknown>;
    delete futureEscalation.fullTrisegCompatibleCandidateId;
    input.ownerSelection.futureRequiredMechanicsEscalation.fullTriSegPath = "No future escalation.";
    input.ownerSelection.futureRequiredMechanicsEscalation.requiredBeforeClaimingThoseMechanisms = [
      "triseg-lite-compatible review only",
    ];

    const report = validateMechanicsOwnerSelection(input);

    expect(report.pass).toBe(false);
    expect(report.errors.some((issue) => issue.code === "owner_selection_future_triseg_path")).toBe(true);
  });

  it("fails when decision docs imply RV or interdependence coverage", () => {
    const input = fixture();
    input.decisionDocs[0].text += "\nThe selected initial backend covers RV pressure overload.";

    const report = validateMechanicsOwnerSelection(input);

    expect(report.pass).toBe(false);
    expect(report.errors.some((issue) => issue.code === "owner_selection_doc_scope_overclaim")).toBe(true);
  });

  it("fails when owner-selection tokens leak into runtime or official-case files", () => {
    const input = fixture();
    input.integrationFiles = [
      {
        path: "engine/ModelCore.ts",
        text: "const selection = 'production-mechanics-decision19-owner-selection-v1';",
      },
      {
        path: "officialCases.ts",
        text: "const gate = 'mechanics-selection';",
      },
    ];

    const report = validateMechanicsOwnerSelection(input);

    expect(report.pass).toBe(false);
    expect(report.errors.some((issue) => issue.code === "mechanics_owner_selection_runtime_leak")).toBe(true);
  });
});

function fixture(): MechanicsOwnerSelectionValidationInput & {
  phase3OwnerGate: typeof phase3OwnerGate;
  dossier: typeof mechanicsDossier;
  ownerSelection: typeof ownerSelection;
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
    ownerSelection: clone(ownerSelection),
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
      acceptedDecisionDoc("docs/myocardium/adr/ADR-MYO-001.md"),
      acceptedDecisionDoc("docs/myocardium/roadmap/myocardium-rebuild-roadmap.md"),
      acceptedDecisionDoc("docs/myocardium/research/myocardial-contraction-rebuild-design-record.md"),
    ],
    integrationFiles: [],
  };
}

function acceptedDecisionDoc(path: string) {
  return {
    path,
    text: [
      "| 19 | production ventricular mechanics | thick-sphere-v2-explicit-external-septal-coupling (initial thick-sphere-v2 backend) | before Phase 4B+ | ACCEPTED 2026-06-27 |",
      "Decision 19 owner selection is limited-scope: replace current active stress with Land active stress, morphology gate pass/fail, and beat-stability/no-alternans.",
      "RV pressure overload, septal bowing, ventricular interdependence, and right-heart failure are not primary/final scope for this initial backend.",
      "The future TriSeg path preserves triseg-lite-compatible, full-triseg-compatible, and full TriSeg escalation before those mechanisms are claimed.",
    ].join("\n"),
  };
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
