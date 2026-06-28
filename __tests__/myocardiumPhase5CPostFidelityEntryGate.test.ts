import { describe, expect, it } from "vitest";
import {
  PHASE5C_MODELCORE_EQUIVALENT_ROUTE_GATE_PLAN_PATH,
  PHASE5C_POST_FIDELITY_ENTRY_GATE_PLAN_PATH,
  loadPhase5CPostFidelityEntryGateValidationInput,
  validatePhase5CPostFidelityEntryGate,
  type Phase5CPostFidelityEntryGateValidationInput,
} from "@/tools/myocardium/verifyPhase5CPostFidelityEntryGate";

const baseValidationInput =
  loadPhase5CPostFidelityEntryGateValidationInput(process.cwd());

describe("myocardium Phase 5C-E post-fidelity entry gate", () => {
  it("validates the post-fidelity gate without advancing runtime, morphology, or final no-alternans claims", () => {
    const input = fixture();
    const validation = validatePhase5CPostFidelityEntryGate(input);

    expect(validation.errors).toEqual([]);
    expect(validation.pass).toBe(true);
    expect(validation.gateStatus).toBe("entry-blocked-until-route-satisfied");
    expect(validation.allowedEntryRouteIds).toEqual([
      "same-closure-period2-positive-control",
      "modelcore-equivalent-closure-positive-control",
      "owner-approved-replacement-criterion",
    ]);
    expect(validation.summary.sourceFileCount).toBe(7);
    expect(validation.summary.runtimeIntegrationFileCount).toBeGreaterThan(0);
    expect(validation.summary.entryRouteCount).toBe(3);
    expect(input.gate.currentNoGo.artifactGateExpectedPass).toBe(false);
    expect(input.gate.currentNoGo.finalNoAlternansClaim).toBe("not-claimed");
    expect(input.gate.nonGoals.runtimeReplacement).toBe(false);
    expect(input.gate.nonGoals.qDotTuning).toBe(false);
    expect(input.gate.nonGoals.triSegAdoption).toBe(false);
  });

  it("pins currentNoGo to the Phase 5C-D fidelity audit evidence", () => {
    const input = fixture();
    const current = input.gate.currentNoGo;
    const audit = input.fidelityAuditEvidence.auditOutcome;

    expect(current.legacyPositiveControlStatus).toBe(audit.legacyPositiveControlStatus);
    expect(current.positiveControlBranchStatus).toBe(audit.positiveControlBranchStatus);
    expect(current.positiveControlObservedPeriodBeats).toBe(audit.positiveControlObservedPeriodBeats);
    expect(current.artifactGateExpectedPass).toBe(audit.artifactGateExpectedPass);
    expect(current.landRunInterpretation).toBe(audit.landRunInterpretation);
    expect(current.sameProtocolSecondOrderAdvancementStatus)
      .toBe(audit.sameProtocolSecondOrderAdvancementStatus);
    expect(current.replacementCriterionStatus).toBe(audit.replacementCriterionStatus);
  });

  it("fails validation if the gate adds an unknown top-level field", () => {
    const input = fixture();
    input.gate.approvalShortcut = true;

    const validation = validatePhase5CPostFidelityEntryGate(input);

    expect(validation.pass).toBe(false);
    expect(validation.errors.map((issue) => issue.code)).toContain("phase5c_e_closed_schema");
  });

  it("fails validation if currentNoGo strengthens artifact, Land, or final no-alternans claims", () => {
    const input = fixture();
    input.gate.currentNoGo.artifactGateExpectedPass = true;
    input.gate.currentNoGo.landRunInterpretation = "interpretable-no-alternans";
    input.gate.currentNoGo.finalNoAlternansClaim = "claimed";

    const validation = validatePhase5CPostFidelityEntryGate(input);
    const codes = validation.errors.map((issue) => issue.code);

    expect(validation.pass).toBe(false);
    expect(codes).toContain("phase5c_e_current_no_go");
  });

  it("fails validation if the same-closure route weakens the pinned period-2 thresholds", () => {
    const input = fixture();
    const route = sameClosureRoute(input);
    route.requiredEvidence.positiveControlObservedPeriodBeats = 1;
    route.requiredEvidence.adjacentDeltaRelation = "<";
    route.requiredEvidence.pressureFloorUse = true;

    const validation = validatePhase5CPostFidelityEntryGate(input);

    expect(validation.pass).toBe(false);
    expect(validation.errors.map((issue) => issue.code))
      .toContain("phase5c_e_same_closure_route");
  });

  it("fails validation if the ModelCore-equivalent route is treated as implemented or satisfied", () => {
    const input = fixture();
    const route = modelCoreEquivalentRoute(input);
    route.status = "satisfied";
    route.requiredEvidence.closureImplementationStatus = "implemented";
    route.requiredEvidence.routeSatisfactionStatus = "satisfied";
    route.requiredEvidence.closureEquivalenceToModelCore = "demonstrated";
    route.requiredEvidence.doesNotSatisfyCurrentNoGo = false;

    const validation = validatePhase5CPostFidelityEntryGate(input);
    const codes = validation.errors.map((issue) => issue.code);

    expect(validation.pass).toBe(false);
    expect(codes).toContain("phase5c_e_entry_routes");
    expect(codes).toContain("phase5c_e_modelcore_equivalent_route");
  });

  it("fails validation if the ModelCore-equivalent route drops event-surface evidence", () => {
    const input = fixture();
    const route = modelCoreEquivalentRoute(input);
    route.requiredEvidence.requiredEventSurfaces = ["valveOpenCloseTiming"];
    route.requiredEvidence.eventSurfacePreservationRequired = false;
    route.requiredEvidence.secondOrderReferenceStillRequired = false;

    const validation = validatePhase5CPostFidelityEntryGate(input);

    expect(validation.pass).toBe(false);
    expect(validation.errors.map((issue) => issue.code))
      .toContain("phase5c_e_modelcore_equivalent_route");
  });

  it("fails validation if route mayUnlock authorizes runtime, morphology, or TriSeg", () => {
    const input = fixture();
    const route = sameClosureRoute(input);
    route.mayUnlock = [
      "runtime replacement",
      "official morphology acceptance",
      "TriSeg adoption",
    ];

    const validation = validatePhase5CPostFidelityEntryGate(input);

    expect(validation.pass).toBe(false);
    expect(validation.errors.map((issue) => issue.code))
      .toContain("phase5c_e_entry_route_boundary");
  });

  it("fails validation if the owner replacement route is marked as already approved or self-authorizing", () => {
    const input = fixture();
    const route = ownerReplacementRoute(input);
    route.status = "approved";
    route.requiredEvidence.ownerApprovalArtifactPath = "data/myocardium/gates/fake-owner-approval.json";
    route.requiredEvidence.requiredOwnerProvenanceFields = ["acceptedBy"];
    route.requiredEvidence.doesNotSelfAuthorizeRuntimeAdoption = false;

    const validation = validatePhase5CPostFidelityEntryGate(input);
    const codes = validation.errors.map((issue) => issue.code);

    expect(validation.pass).toBe(false);
    expect(codes).toContain("phase5c_e_entry_routes");
    expect(codes).toContain("phase5c_e_owner_replacement_route");
  });

  it("fails validation if the owner replacement boundary omits RV/interdependence/RHF non-authorization", () => {
    const input = fixture();
    const boundary = ownerReplacementRoute(input).requiredEvidence.requiredDecisionBoundary;
    delete boundary.doesNotAuthorizeRVPressureOverloadCoverage;
    boundary.doesNotAuthorizeVentricularInterdependenceCoverage = false;
    boundary.doesNotAuthorizeRightHeartFailureCoverage = false;

    const validation = validatePhase5CPostFidelityEntryGate(input);

    expect(validation.pass).toBe(false);
    expect(validation.errors.map((issue) => issue.code))
      .toContain("phase5c_e_owner_replacement_route");
  });

  it("fails validation if tuning, runtime, or TriSeg non-goals are enabled", () => {
    const input = fixture();
    input.gate.nonGoals.qDotTuning = true;
    input.gate.nonGoals.runtimeReplacement = true;
    input.gate.nonGoals.triSegAdoption = true;

    const validation = validatePhase5CPostFidelityEntryGate(input);

    expect(validation.pass).toBe(false);
    expect(validation.errors.map((issue) => issue.code)).toContain("phase5c_e_non_goals");
  });

  it("fails validation if Phase 5B is added as a same-protocol shortcut", () => {
    const input = fixture();
    const route = sameClosureRoute(input);
    route.requiredEvidence.phase5BReadOnlySdirk2Status = "same-protocol-reference-pass";

    const validation = validatePhase5CPostFidelityEntryGate(input);

    expect(validation.pass).toBe(false);
    expect(validation.errors.map((issue) => issue.code)).toContain("phase5c_e_closed_schema");
  });

  it("fails validation if Phase 5C-E tokens leak into runtime integration files", () => {
    const input = fixture();
    input.runtimeIntegrationFiles = [
      ...input.runtimeIntegrationFiles,
      {
        path: "engine/ModelCore.ts",
        text: "const gate = 'phase5c-post-fidelity-entry-gate-v1';",
      },
    ];

    const validation = validatePhase5CPostFidelityEntryGate(input);

    expect(validation.pass).toBe(false);
    expect(validation.errors.map((issue) => issue.code)).toContain("phase5c_e_runtime_leak");
  });

  it("scans default adoption surfaces for Phase 5C-E tokens", () => {
    const expectedRuntimePaths = [
      "constants.ts",
      "engine/core/params.ts",
      "engine/presets.ts",
    ];
    const runtimePaths = fixture().runtimeIntegrationFiles.map((file) => file.path);

    expect(runtimePaths).toEqual(expect.arrayContaining(expectedRuntimePaths));

    for (const runtimePath of expectedRuntimePaths) {
      const input = fixture();
      appendRuntimeText(
        input,
        runtimePath,
        "\nconst phase5cEntryGate = 'phase5c-post-fidelity-entry-gate-v1';\n",
      );

      const validation = validatePhase5CPostFidelityEntryGate(input);

      expect(validation.pass).toBe(false);
      expect(validation.errors.map((issue) => issue.code)).toContain("phase5c_e_runtime_leak");
    }
  });

  it("fails validation if gate docs add affirmative runtime or TriSeg prose", () => {
    for (const sourcePath of [
      PHASE5C_POST_FIDELITY_ENTRY_GATE_PLAN_PATH,
      PHASE5C_MODELCORE_EQUIVALENT_ROUTE_GATE_PLAN_PATH,
      "docs/myocardium/roadmap/myocardium-rebuild-roadmap.md",
      "docs/myocardium/README.md",
    ]) {
      const input = fixture();
      appendPhase5CEntryGateSourceText(
        input,
        sourcePath,
        " This gate may now adopt TriSeg. This gate can enable runtime replacement.",
      );

      const validation = validatePhase5CPostFidelityEntryGate(input);

      expect(validation.pass).toBe(false);
      expect(validation.errors.map((issue) => issue.code)).toContain("phase5c_e_forbidden_claim");
    }
  });

  it("fails validation if gate docs self-authorize the owner replacement route", () => {
    for (const sourcePath of [
      PHASE5C_POST_FIDELITY_ENTRY_GATE_PLAN_PATH,
      PHASE5C_MODELCORE_EQUIVALENT_ROUTE_GATE_PLAN_PATH,
      "docs/myocardium/roadmap/myocardium-rebuild-roadmap.md",
      "docs/myocardium/README.md",
    ]) {
      const input = fixture();
      appendPhase5CEntryGateSourceText(
        input,
        sourcePath,
        " The owner-approved-replacement-criterion is approved by this gate.",
      );

      const validation = validatePhase5CPostFidelityEntryGate(input);

      expect(validation.pass).toBe(false);
      expect(validation.errors.map((issue) => issue.code)).toContain("phase5c_e_forbidden_claim");
    }
  });

  it("fails validation if the plan drops one of the three entry routes", () => {
    const input = fixture();
    replaceSourceText(
      input,
      PHASE5C_POST_FIDELITY_ENTRY_GATE_PLAN_PATH,
      "modelcore-equivalent-closure-positive-control",
      "modelcore-equivalent-closure-route",
    );

    const validation = validatePhase5CPostFidelityEntryGate(input);

    expect(validation.pass).toBe(false);
    expect(validation.errors.map((issue) => issue.code)).toContain("phase5c_e_source_scan");
  });
});

function fixture(): MutableValidationInput {
  return structuredClone(baseValidationInput) as MutableValidationInput;
}

function sameClosureRoute(input: MutableValidationInput): any {
  return input.gate.allowedEntryRoutes.find((route: any) =>
    route.routeId === "same-closure-period2-positive-control"
  );
}

function modelCoreEquivalentRoute(input: MutableValidationInput): any {
  return input.gate.allowedEntryRoutes.find((route: any) =>
    route.routeId === "modelcore-equivalent-closure-positive-control"
  );
}

function ownerReplacementRoute(input: MutableValidationInput): any {
  return input.gate.allowedEntryRoutes.find((route: any) =>
    route.routeId === "owner-approved-replacement-criterion"
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

function appendPhase5CEntryGateSourceText(
  input: MutableValidationInput,
  sourcePath: string,
  suffix: string,
): void {
  if (sourcePath === PHASE5C_POST_FIDELITY_ENTRY_GATE_PLAN_PATH) {
    appendSourceText(input, sourcePath, `\n${suffix}\n`);
    return;
  }
  const marker = sourcePath === "docs/myocardium/roadmap/myocardium-rebuild-roadmap.md"
    ? "### Phase 5C-E"
    : sourcePath === PHASE5C_MODELCORE_EQUIVALENT_ROUTE_GATE_PLAN_PATH
      ? "## Boundary"
    : "Phase 5C-E records that post-fidelity entry gate";
  replaceSourceText(input, sourcePath, marker, `${marker}${suffix}`);
}

function appendRuntimeText(
  input: MutableValidationInput,
  runtimePath: string,
  suffix: string,
): void {
  const runtimeIndex = input.runtimeIntegrationFiles.findIndex((file) => file.path === runtimePath);
  expect(runtimeIndex).toBeGreaterThanOrEqual(0);
  input.runtimeIntegrationFiles[runtimeIndex] = {
    ...input.runtimeIntegrationFiles[runtimeIndex],
    text: `${input.runtimeIntegrationFiles[runtimeIndex].text}${suffix}`,
  };
}

type MutableValidationInput = Phase5CPostFidelityEntryGateValidationInput & {
  gate: any;
  fidelityAuditEvidence: any;
  sourceFiles: any[];
  runtimeIntegrationFiles: any[];
};
