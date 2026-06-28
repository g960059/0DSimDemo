import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  PHASE5C_F_TRIAGE_AUDIT_PLAN_PATH,
  loadChangedFilePaths,
  loadPhase5CPositiveControlTriageAuditValidationInput,
  validatePhase5CPositiveControlTriageAudit,
  type Phase5CPositiveControlTriageAuditValidationInput,
} from "@/tools/myocardium/verifyPhase5CPositiveControlTriageAudit";

const baseValidationInput =
  loadPhase5CPositiveControlTriageAuditValidationInput(process.cwd());

describe("myocardium Phase 5C-F positive-control triage audit", () => {
  it("validates the triage audit plan while keeping Phase 5C-E entry blocked", () => {
    const input = fixture();
    const validation = validatePhase5CPositiveControlTriageAudit(input);

    expect(validation.errors).toEqual([]);
    expect(validation.pass).toBe(true);
    expect(validation.triageStatus).toBe("triage-audit-only-entry-still-blocked");
    expect(validation.diagnosticLaneIds).toEqual([
      "same-closure-source-provider-audit",
      "closure-event-surface-diagnostic",
      "owner-replacement-criterion-prep",
    ]);
    expect(input.triageGate.inheritedNoGo.gateStatus).toBe("entry-blocked-until-route-satisfied");
    expect(input.triageGate.blockedClaims.sameClosurePeriod2RouteSatisfied).toBe(false);
    expect(input.triageGate.blockedClaims.ownerApprovedReplacementCriterionPresent).toBe(false);
    expect(input.triageGate.nonGoals.qDotTuning).toBe(false);
    expect(eventSurfaceLane(input).diagnosticAxes).toEqual([
      "qDot",
      "valveThresholds",
      "arterialLoad",
      "preloadAfterloadClosure",
      "LandParameters",
    ]);
  });

  it("scans broad runtime and workbench surfaces for Phase 5C-F leaks", () => {
    const runtimePaths = fixture().runtimeIntegrationFiles.map((file) => file.path);

    expect(runtimePaths).toContain("WorkbenchPage.tsx");
    expect(runtimePaths).toContain("workbenchLoad.ts");
    expect(runtimePaths).toContain("engine/myocardium/protocols/landNewMyocardiumLowPreloadCheck.ts");
    expect(runtimePaths).toContain("features/workbench/WorkbenchRoute.tsx");
  });

  it("fails validation if inherited no-go state strengthens the Phase 5C-E gate", () => {
    const input = fixture();
    input.triageGate.inheritedNoGo.artifactGateExpectedPass = true;
    input.triageGate.inheritedNoGo.landRunInterpretation = "interpretable-no-alternans";
    input.triageGate.inheritedNoGo.finalNoAlternansClaim = "claimed";

    const validation = validatePhase5CPositiveControlTriageAudit(input);

    expect(validation.pass).toBe(false);
    expect(validation.errors.map((issue) => issue.code)).toContain("phase5c_f_inherited_no_go");
  });

  it("fails validation if diagnostic lanes add a shortcut lane", () => {
    const input = fixture();
    input.triageGate.diagnosticLanes.push({
      laneId: "phase5b-sdirk2-shortcut",
      status: "ready",
    });

    const validation = validatePhase5CPositiveControlTriageAudit(input);

    expect(validation.pass).toBe(false);
    expect(validation.errors.map((issue) => issue.code)).toContain("phase5c_f_diagnostic_lanes");
  });

  it("fails validation if the event-surface lane becomes tuning", () => {
    const input = fixture();
    const lane = eventSurfaceLane(input);
    lane.status = "tuning-ready";
    lane.forbiddenActions = [];
    lane.allowedOutput = "closure-update";
    lane.doesNotSatisfyEntryRoute = false;

    const validation = validatePhase5CPositiveControlTriageAudit(input);

    expect(validation.pass).toBe(false);
    expect(validation.errors.map((issue) => issue.code)).toContain("phase5c_f_event_surface_lane");
  });

  it("fails validation if owner replacement prep self-authorizes", () => {
    const input = fixture();
    const lane = ownerPrepLane(input);
    lane.status = "approved";
    lane.requiredOwnerProvenanceFields = ["acceptedBy"];
    lane.doesNotSelfAuthorizeReplacementCriterion = false;

    const validation = validatePhase5CPositiveControlTriageAudit(input);

    expect(validation.pass).toBe(false);
    expect(validation.errors.map((issue) => issue.code)).toContain("phase5c_f_owner_prep_lane");
  });

  it("fails validation if blocked claims are promoted", () => {
    const input = fixture();
    input.triageGate.blockedClaims.sameClosurePeriod2RouteSatisfied = true;
    input.triageGate.blockedClaims.ownerApprovedReplacementCriterionPresent = true;
    input.triageGate.blockedClaims.finalNoAlternansClaim = "claimed";

    const validation = validatePhase5CPositiveControlTriageAudit(input);

    expect(validation.pass).toBe(false);
    expect(validation.errors.map((issue) => issue.code)).toContain("phase5c_f_blocked_claims");
  });

  it("fails validation if runtime, tuning, or TriSeg non-goals are enabled", () => {
    const input = fixture();
    input.triageGate.nonGoals.runtimeReplacement = true;
    input.triageGate.nonGoals.qDotTuning = true;
    input.triageGate.nonGoals.triSegAdoption = true;

    const validation = validatePhase5CPositiveControlTriageAudit(input);

    expect(validation.pass).toBe(false);
    expect(validation.errors.map((issue) => issue.code)).toContain("phase5c_f_non_goals");
  });

  it("fails validation if Phase 5C-F tokens leak into runtime integration files", () => {
    const input = fixture();
    input.runtimeIntegrationFiles = [
      ...input.runtimeIntegrationFiles,
      {
        path: "engine/ModelCore.ts",
        text: "const gate = 'phase5c-positive-control-triage-audit-v1';",
      },
    ];

    const validation = validatePhase5CPositiveControlTriageAudit(input);

    expect(validation.pass).toBe(false);
    expect(validation.errors.map((issue) => issue.code)).toContain("phase5c_f_runtime_leak");
  });

  it("fails validation if source prose self-authorizes entry or runtime adoption", () => {
    const input = fixture();
    appendSourceText(
      input,
      PHASE5C_F_TRIAGE_AUDIT_PLAN_PATH,
      "\nThis gate authorizes owner-approved-replacement-criterion. Runtime replacement can be enabled. TriSeg adopted.\n",
    );

    const validation = validatePhase5CPositiveControlTriageAudit(input);

    expect(validation.pass).toBe(false);
    expect(validation.errors.map((issue) => issue.code)).toContain("phase5c_f_forbidden_claim");
  });

  it("fails validation if the diff includes runtime or workbench changes", () => {
    const input = fixture();
    input.changedFilePaths = [
      ...input.changedFilePaths,
      "engine/myocardium/protocols/landNewMyocardiumLowPreloadCheck.ts",
      "WorkbenchPage.tsx",
    ];

    const validation = validatePhase5CPositiveControlTriageAudit(input);

    expect(validation.pass).toBe(false);
    expect(validation.errors.map((issue) => issue.code)).toContain("phase5c_f_changed_file_scope");
  });

  it("loads deleted runtime files from git changed paths", () => {
    const rootDir = path.join(tmpdir(), `phase5c-f-git-${process.pid}-${Date.now()}`);
    try {
      mkdirSync(path.join(rootDir, "engine"), { recursive: true });
      writeFileSync(path.join(rootDir, "engine/ModelCore.ts"), "export const modelCore = true;\n");
      git(rootDir, "init");
      git(rootDir, "config", "user.email", "phase5c-f@example.test");
      git(rootDir, "config", "user.name", "Phase 5C-F Test");
      git(rootDir, "add", ".");
      git(rootDir, "commit", "-m", "base");
      rmSync(path.join(rootDir, "engine/ModelCore.ts"));

      expect(loadChangedFilePaths(rootDir)).toContain("engine/ModelCore.ts");
    } finally {
      rmSync(rootDir, { recursive: true, force: true });
    }
  });

  it("fails validation if the plan drops triage-audit lane boundaries", () => {
    const input = fixture();
    replaceSourceText(
      input,
      PHASE5C_F_TRIAGE_AUDIT_PLAN_PATH,
      "closure-event-surface-diagnostic",
      "closure-event-surface-update",
    );

    const validation = validatePhase5CPositiveControlTriageAudit(input);

    expect(validation.pass).toBe(false);
    expect(validation.errors.map((issue) => issue.code)).toContain("phase5c_f_source_scan");
  });
});

function fixture(): MutableValidationInput {
  return structuredClone(baseValidationInput) as MutableValidationInput;
}

function eventSurfaceLane(input: MutableValidationInput): any {
  return input.triageGate.diagnosticLanes.find((lane: any) =>
    lane.laneId === "closure-event-surface-diagnostic"
  );
}

function ownerPrepLane(input: MutableValidationInput): any {
  return input.triageGate.diagnosticLanes.find((lane: any) =>
    lane.laneId === "owner-replacement-criterion-prep"
  );
}

function replaceSourceText(
  input: MutableValidationInput,
  sourcePath: string,
  search: string | RegExp,
  replacement: string,
): void {
  const sourceIndex = input.sourceFiles.findIndex((file) => file.path === sourcePath);
  expect(sourceIndex).toBeGreaterThanOrEqual(0);
  input.sourceFiles[sourceIndex] = {
    ...input.sourceFiles[sourceIndex],
    text: input.sourceFiles[sourceIndex].text.replace(search, replacement),
  };
}

function appendSourceText(
  input: MutableValidationInput,
  sourcePath: string,
  suffix: string,
): void {
  const sourceIndex = input.sourceFiles.findIndex((file) => file.path === sourcePath);
  expect(sourceIndex).toBeGreaterThanOrEqual(0);
  input.sourceFiles[sourceIndex] = {
    ...input.sourceFiles[sourceIndex],
    text: `${input.sourceFiles[sourceIndex].text}${suffix}`,
  };
}

function git(rootDir: string, ...args: string[]): void {
  execFileSync("git", args, {
    cwd: rootDir,
    stdio: ["ignore", "ignore", "ignore"],
  });
}

type MutableValidationInput = Phase5CPositiveControlTriageAuditValidationInput & {
  triageGate: any;
  entryGate: any;
  fidelityAuditEvidence: any;
  sourceFiles: any[];
  runtimeIntegrationFiles: any[];
  changedFilePaths: string[];
};
