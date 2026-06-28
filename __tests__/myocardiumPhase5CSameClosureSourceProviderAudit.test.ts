import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import {
  PHASE5C_G_SOURCE_PROVIDER_AUDIT_PLAN_PATH,
  loadChangedFilePaths,
  loadPhase5CSameClosureSourceProviderAuditValidationInput,
  validatePhase5CSameClosureSourceProviderAudit,
  type Phase5CSameClosureSourceProviderAuditValidationInput,
} from "@/tools/myocardium/verifyPhase5CSameClosureSourceProviderAudit";

let baseValidationInput: Phase5CSameClosureSourceProviderAuditValidationInput;

beforeAll(async () => {
  baseValidationInput = await loadPhase5CSameClosureSourceProviderAuditValidationInput(process.cwd());
});

describe("myocardium Phase 5C-G same-closure source-provider audit", () => {
  it("validates the source-provider audit while preserving the Phase 5C-E/F no-go", () => {
    const input = fixture();
    const validation = validatePhase5CSameClosureSourceProviderAudit(input);

    expect(validation.errors).toEqual([]);
    expect(validation.pass).toBe(true);
    expect(validation.auditStatus).toBe("audit-snapshot-only-entry-still-blocked");
    expect(validation.providerIds).toEqual([
      "legacy-activeStress-positive-control",
      "land2017-new-myocardium",
    ]);
    expect(input.audit.inheritedNoGo.legacyPositiveControlStatus).toBe("positive-control-failed");
    expect(input.audit.inheritedNoGo.positiveControlObservedPeriodBeats).toBe(1);
    expect(input.audit.blockedClaims.modelCoreEquivalentClosureRouteSatisfied).toBe(false);
    expect(input.audit.pr193HandoffBoundary.modelCoreEquivalentRouteStatus).toBe(
      "proposed-next-route-not-implemented",
    );
  });

  it("compares provider hashes, branch hashes, and final beat metrics to the live report", () => {
    const input = fixture();
    const validation = validatePhase5CSameClosureSourceProviderAudit(input);
    const legacy = provider(input, "legacy-activeStress-positive-control");
    const land = provider(input, "land2017-new-myocardium");

    expect(validation.pass).toBe(true);
    expect(input.audit.liveReportSnapshot.sameClosureEvidence.closureConfigStableHash).toBe("22981661");
    expect(input.audit.liveReportSnapshot.sameClosureEvidence.sourceProviderDifferenceOnly).toBe(true);
    expect(legacy.branchBehavior.beatWindowDeterministicHashes).toEqual([
      "34123b78",
      "d60c924c",
      "f07effe5",
      "0c189b36",
    ]);
    expect(land.branchBehavior.lastBeatMetrics.deterministicHash).toBe("cbff51ee");
  });

  it("allows platform-sensitive trajectory hashes to differ when audit context shape remains valid", () => {
    const input = fixture();
    input.audit.liveReportSnapshot.reportStableSummaryHash = "deadbeef";
    for (const providerAudit of input.audit.providerAudits) {
      providerAudit.trajectoryStableHash = "abcdef12";
      providerAudit.branchBehavior.beatWindowDeterministicHashes =
        providerAudit.branchBehavior.beatWindowDeterministicHashes.map(() => "1234abcd");
      providerAudit.branchBehavior.lastBeatMetrics.deterministicHash = "bead1234";
      providerAudit.branchBehavior.lastBeatMetrics.peakSourceActiveFiberStressPa *= 0.9;
    }

    const validation = validatePhase5CSameClosureSourceProviderAudit(input);

    expect(validation.errors).toEqual([]);
    expect(validation.pass).toBe(true);
  });

  it("fails validation if the audit turns into a period-2 or interpretable route", () => {
    const input = fixture();
    input.audit.inheritedNoGo.positiveControlBranchStatus = "settled-period-2";
    input.audit.inheritedNoGo.positiveControlObservedPeriodBeats = 2;
    input.audit.liveReportSnapshot.readinessPass = true;
    input.audit.blockedClaims.landRunInterpretation = "interpretable-no-alternans";
    input.audit.blockedClaims.finalNoAlternansClaim = "claimed";
    provider(input, "legacy-activeStress-positive-control").branchBehavior.periodBeats = 2;

    const validation = validatePhase5CSameClosureSourceProviderAudit(input);

    expect(validation.pass).toBe(false);
    expect(validation.errors.map((issue) => issue.code)).toContain("phase5c_g_inherited_no_go");
    expect(validation.errors.map((issue) => issue.code)).toContain("phase5c_g_live_report_snapshot");
    expect(validation.errors.map((issue) => issue.code)).toContain("phase5c_g_branch_status");
    expect(validation.errors.map((issue) => issue.code)).toContain("phase5c_g_blocked_claims");
  });

  it("fails validation if PR 193 modelcore-equivalent route is treated as implemented", () => {
    const input = fixture();
    input.audit.pr193HandoffBoundary.modelCoreEquivalentRouteStatus = "implemented";
    input.audit.pr193HandoffBoundary.doesNotImplementModelCoreEquivalentClosure = false;
    input.audit.pr193HandoffBoundary.doesNotSatisfyRecommendedAdditionalRoute = false;
    input.audit.blockedClaims.modelCoreEquivalentClosureRouteSatisfied = true;
    input.audit.nonGoals.modelCoreEquivalentClosureImplementation = true;

    const validation = validatePhase5CSameClosureSourceProviderAudit(input);

    expect(validation.pass).toBe(false);
    expect(validation.errors.map((issue) => issue.code)).toContain("phase5c_g_pr193_boundary");
    expect(validation.errors.map((issue) => issue.code)).toContain("phase5c_g_blocked_claims");
    expect(validation.errors.map((issue) => issue.code)).toContain("phase5c_g_non_goals");
  });

  it("fails validation if provider provenance or branch metrics drift from the live report", () => {
    const input = fixture();
    const legacy = provider(input, "legacy-activeStress-positive-control");
    legacy.sourceProviderStableHash = "changed";
    legacy.trajectoryStableHash = "not-a-hash";
    legacy.sourceProviderProvenance.usesModelCoreRuntimeWiring = true;
    legacy.eventSurfaces.qDotCapStatus = "used";
    legacy.branchBehavior.beatWindowDeterministicHashes[0] = "bad-hash";
    legacy.branchBehavior.lastBeatMetrics.strokeWorkJ += 1;
    legacy.branchBehavior.lastBeatMetrics.peakSourceActiveFiberStressPa = 0;
    legacy.branchBehavior.lastBeatMetrics.deterministicHash = "bad-hash";

    const validation = validatePhase5CSameClosureSourceProviderAudit(input);

    expect(validation.pass).toBe(false);
    expect(validation.errors.map((issue) => issue.code)).toContain("phase5c_g_provider_snapshot");
    expect(validation.errors.map((issue) => issue.code)).toContain("phase5c_g_provider_runtime_boundary");
    expect(validation.errors.map((issue) => issue.code)).toContain("phase5c_g_event_surface_snapshot");
    expect(validation.errors.map((issue) => issue.code)).toContain("phase5c_g_beat_hashes");
    expect(validation.errors.map((issue) => issue.code)).toContain("phase5c_g_last_beat_metric");
  });

  it("fails validation if source prose authorizes runtime adoption or a final claim", () => {
    const input = fixture();
    appendSourceText(
      input,
      PHASE5C_G_SOURCE_PROVIDER_AUDIT_PLAN_PATH,
      "\nThis audit authorizes runtime replacement and final no-alternans. TriSeg adopted.\n",
    );

    const validation = validatePhase5CSameClosureSourceProviderAudit(input);

    expect(validation.pass).toBe(false);
    expect(validation.errors.map((issue) => issue.code)).toContain("phase5c_g_forbidden_claim");
  });

  it("does not apply the Phase 5C-G diff allowlist to unrelated PR diffs", () => {
    const input = fixture();
    input.changedFilePaths = [
      "__tests__/pvLoopFillingLimbDiagnosticComparator.test.ts",
      "data/myocardium/protocols/filling-limb-diagnostic-comparator-v1.json",
      "docs/myocardium/verification/filling-limb-diagnostic-comparator-v1.md",
      "tools/myocardium/buildFillingLimbDiagnosticComparator.ts",
    ];

    const validation = validatePhase5CSameClosureSourceProviderAudit(input);

    expect(validation.pass).toBe(true);
    expect(validation.errors.map((issue) => issue.code)).not.toContain("phase5c_g_changed_file_scope");
  });

  it("fails validation if a Phase 5C-G PR diff includes runtime or workbench changes", () => {
    const input = fixture();
    input.changedFilePaths = [
      PHASE5C_G_SOURCE_PROVIDER_AUDIT_PLAN_PATH,
      "engine/myocardium/protocols/landNewMyocardiumLowPreloadCheck.ts",
      "WorkbenchPage.tsx",
    ];

    const validation = validatePhase5CSameClosureSourceProviderAudit(input);

    expect(validation.pass).toBe(false);
    expect(validation.errors.map((issue) => issue.code)).toContain("phase5c_g_changed_file_scope");
  });

  it("fails validation if Phase 5C-G companion-file diffs include runtime or workbench changes", () => {
    for (const companionPath of [
      "docs/myocardium/README.md",
      "docs/myocardium/roadmap/myocardium-rebuild-roadmap.md",
      "package.json",
    ]) {
      const input = fixture();
      input.changedFilePaths = [
        companionPath,
        "WorkbenchPage.tsx",
      ];

      const validation = validatePhase5CSameClosureSourceProviderAudit(input);

      expect(validation.pass).toBe(false);
      expect(validation.errors.map((issue) => issue.code)).toContain("phase5c_g_changed_file_scope");
    }
  });

  it("loads deleted runtime files from git changed paths", () => {
    const rootDir = path.join(tmpdir(), `phase5c-g-git-${process.pid}-${Date.now()}`);
    try {
      mkdirSync(path.join(rootDir, "engine"), { recursive: true });
      writeFileSync(path.join(rootDir, "engine/ModelCore.ts"), "export const modelCore = true;\n");
      git(rootDir, "init");
      git(rootDir, "config", "user.email", "phase5c-g@example.test");
      git(rootDir, "config", "user.name", "Phase 5C-G Test");
      git(rootDir, "add", ".");
      git(rootDir, "commit", "-m", "base");
      rmSync(path.join(rootDir, "engine/ModelCore.ts"));

      expect(loadChangedFilePaths(rootDir)).toContain("engine/ModelCore.ts");
    } finally {
      rmSync(rootDir, { recursive: true, force: true });
    }
  });
});

function fixture(): MutableValidationInput {
  return structuredClone(baseValidationInput) as MutableValidationInput;
}

function provider(input: MutableValidationInput, sourceProviderId: string): any {
  return input.audit.providerAudits.find((candidate: any) =>
    candidate.sourceProviderId === sourceProviderId
  );
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

type MutableValidationInput = Phase5CSameClosureSourceProviderAuditValidationInput & {
  audit: any;
  triageGate: any;
  entryGate: any;
  patchPlan: any;
  modelCoreEquivalentClosure: any;
  liveReport: any;
  sourceFiles: any[];
  runtimeIntegrationFiles: any[];
  changedFilePaths: string[];
};
