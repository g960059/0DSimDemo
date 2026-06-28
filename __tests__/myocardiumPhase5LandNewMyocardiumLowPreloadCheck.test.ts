import { describe, expect, it } from "vitest";
import {
  LAND_NEW_MYOCARDIUM_LOW_PRELOAD_PHASE5C_CLAIM_BOUNDARY,
  LAND_NEW_MYOCARDIUM_LOW_PRELOAD_PHASE5C_PHASE,
  LAND_NEW_MYOCARDIUM_LOW_PRELOAD_PHASE5C_PROTOCOL_SET_ID,
  PHASE5C_C_STANDALONE_CLOSURE_MODEL_ID,
} from "@/engine/myocardium/protocols/landNewMyocardiumLowPreloadCheck";
import {
  LAND_NEW_MYOCARDIUM_PHASE5C_D_FIDELITY_AUDIT_EVIDENCE_PATH,
  loadLandNewMyocardiumLowPreloadValidationInput,
  validateLandNewMyocardiumLowPreloadCheck,
  type LandNewMyocardiumLowPreloadValidationInput,
} from "@/tools/myocardium/verifyLandNewMyocardiumLowPreloadCheck";

const baseValidationInput =
  loadLandNewMyocardiumLowPreloadValidationInput(process.cwd());

describe("myocardium Phase 5C-C Land new-myocardium low-preload check", () => {
  it("validates the standalone artifact without claiming runtime wiring or final no-alternans", () => {
    const input = fixture();
    const validation = validateLandNewMyocardiumLowPreloadCheck(input);
    const report = input.report;

    expect(validation.errors).toEqual([]);
    expect(validation.pass).toBe(true);
    expect(validation.artifactGatePass).toBe(false);
    expect(validation.artifactGateStatus).toBe("land-new-myocardium-low-preload-check-review");
    expect(validation.summary.sourceFileCount).toBe(6);
    expect(validation.artifactGateFindings).toContain(
      "legacy-activeStress-positive-control-v1: status=readiness-fail.",
    );
    expect(report.protocolSetId).toBe(LAND_NEW_MYOCARDIUM_LOW_PRELOAD_PHASE5C_PROTOCOL_SET_ID);
    expect(report.phase).toBe(LAND_NEW_MYOCARDIUM_LOW_PRELOAD_PHASE5C_PHASE);
    expect(report.claimBoundary).toBe(LAND_NEW_MYOCARDIUM_LOW_PRELOAD_PHASE5C_CLAIM_BOUNDARY);
    expect(report.closureModelId).toBe(PHASE5C_C_STANDALONE_CLOSURE_MODEL_ID);
    expect(report.closureEquivalenceToModelCore).toBe("not-claimed");
    expect(report.productionRuntimeStatus).toBe("not-live-runtime-replacement");
    expect(report.newMyocardiumCheckRequiredSatisfied).toBe(false);
    expect(report.secondOrderSameProtocolStatus).toBe("not-performed");
    expect(report.phase5BReadOnlySdirk2Status)
      .toBe("solver-reference-available-not-same-protocol");
    expect(report.finalNoAlternansClaim).toBe("not-claimed");
    expect(report.futureScope.rvPressureOverloadCoverage).toBe("not-covered");
    expect(report.futureScope.ventricularInterdependenceCoverage).toBe("not-covered");
    expect(report.futureScope.rightHeartFailureCoverage).toBe("not-covered");
    expect(report.futureScope.triSegAdoption).toBe("not-claimed");
    expect(report.stableSummaryHash).toMatch(/^[0-9a-f]{8}$/);
  });

  it("uses the same closure for the positive control and Land run, differing only by source provider", () => {
    const report = fixture().report;
    const sameClosure = report.sameClosureEvidence;

    expect(sameClosure.sourceProviderDifferenceOnly).toBe(true);
    expect(sameClosure.pass).toBe(true);
    expect(report.legacyPositiveControl.sourceProviderId).toBe("legacy-activeStress-positive-control");
    expect(report.landNewMyocardiumRun.sourceProviderId).toBe("land2017-new-myocardium");
    expect(report.legacyPositiveControl.hashes.closureConfigStableHash)
      .toBe(report.landNewMyocardiumRun.hashes.closureConfigStableHash);
    expect(report.legacyPositiveControl.hashes.initialStateStableHash)
      .toBe(report.landNewMyocardiumRun.hashes.initialStateStableHash);
    expect(report.legacyPositiveControl.hashes.branchMetricDefinitionsStableHash)
      .toBe(report.landNewMyocardiumRun.hashes.branchMetricDefinitionsStableHash);
  });

  it("uses a faithful legacy activeStress positive-control adapter and records the no-go result", () => {
    const input = fixture();
    const report = input.report;
    const run = report.legacyPositiveControl;

    expect(run.generatedTrajectoryStatus).toBe("generated-own-trajectory-finite");
    expect(run.sourceProviderProvenance.equationSource)
      .toBe("engine/chambers.ts:ActiveStressChamberModel");
    expect(run.sourceProviderProvenance.parameterSource).toBe("defaultActiveLV");
    expect(run.sourceProviderProvenance.stateSemantics)
      .toBe("legacy-ChamberInternal-c-a-r-tensionPa-lambdaAct");
    expect(run.sourceProviderProvenance.hardCodedBeatParityForcing).toBe(false);
    expect(run.trajectoryGenerationPolicy.noPrerecordedStressOrTraceReplay).toBe(true);
    expect(run.branchBehavior.settled).toBe(true);
    expect(run.branchBehavior.periodBeats).toBe(1);
    expect(run.branchBehavior.adjacentDelta).toBeLessThanOrEqual(0.1);
    expect(run.branchBehavior.periodDelta).toBeLessThan(0.05);
    expect(report.policyBoundary.legacyPositiveControlStatus).toBe("positive-control-failed");
    expect(report.policyBoundary.newMyocardiumCheckStatus)
      .toBe("not-performed-positive-control-failed");
    expect(report.readinessPass).toBe(false);
    expect(input.descriptor.policyStatuses.legacyPositiveControlStatus)
      .toBe("positive-control-failed");
    expect(input.descriptor.policyStatuses.positiveControlBranchStatus)
      .toBe("settled-period-1");
    expect(input.descriptor.policyStatuses.artifactGateExpectedPass).toBe(false);
    expect(input.descriptor.policyStatuses.landRunInterpretation)
      .toBe("not-interpretable-positive-control-failed");
    expect(input.descriptor.policyStatuses.sameProtocolSecondOrderAdvancementStatus)
      .toBe("blocked-until-positive-control-period2");
    expect(run.eventSurfaces.tbvProjectionEquivalentMl).toBeLessThanOrEqual(0.05);
    expect(run.eventSurfaces.maxReverseVolumeEquivalentMl).toBeLessThanOrEqual(0.05);
    expect(run.eventSurfaces.pressureFloorUse).toBe(false);
    expect(run.branchBehavior.beatWindow).toHaveLength(4);
    for (const beat of run.branchBehavior.beatWindow) {
      expect(beat.finiteHealth).toBe(true);
      expect(beat.selectedDomainCoverage).toBe(true);
      expect(beat.deterministicHash).toMatch(/^[0-9a-f]{8}$/);
    }
  });

  it("pins Phase 5C-D fidelity audit evidence to the live no-go outcome", () => {
    const input = fixture();
    const evidence = input.fidelityAuditEvidence;

    expect(evidence.id).toBe("land-new-myocardium-low-preload-phase5c-fidelity-audit-v1");
    expect(evidence.auditOutcome.legacyPositiveControlStatus)
      .toBe(input.report.policyBoundary.legacyPositiveControlStatus);
    expect(evidence.auditOutcome.positiveControlBranchStatus)
      .toBe(input.report.legacyPositiveControl.branchBehavior.settlingStatus);
    expect(evidence.auditOutcome.positiveControlObservedPeriodBeats)
      .toBe(input.report.legacyPositiveControl.branchBehavior.periodBeats);
    expect(evidence.auditOutcome.artifactGateExpectedPass).toBe(input.report.readinessPass);
    expect(evidence.auditOutcome.artifactGateStatus).toBe(input.report.readinessStatus);
    expect(evidence.auditOutcome.landRunInterpretation)
      .toBe("not-interpretable-positive-control-failed");
    expect(evidence.auditOutcome.sameProtocolSecondOrderAdvancementStatus)
      .toBe("blocked-until-positive-control-period2");
    expect(evidence.auditOutcome.finalNoAlternansClaim).toBe("not-claimed");
    expect(evidence.nonClaims.triSegAdoption).toBe(false);
    expect(evidence.interpretation.landRunInterpretation)
      .toContain("not interpretable as no-alternans evidence");
  });

  it("runs Land as a generated trajectory and reports morphology without wiring the official gate", () => {
    const run = fixture().report.landNewMyocardiumRun;

    expect(run.generatedTrajectoryStatus).toBe("generated-own-trajectory-finite");
    expect(run.trajectoryGenerationPolicy.generatesOwnVlvTrajectory).toBe(true);
    expect(run.trajectoryGenerationPolicy.consumesPhase5CALegacyVlvTrace).toBe(false);
    expect(run.trajectoryGenerationPolicy.consumesLegacyActiveStressTimeSeries).toBe(false);
    expect(run.finiteStateHealth).toBe(true);
    expect(run.selectedDomainCoverageFinite).toBe(true);
    expect(run.morphology.morphologyEvidenceStatus).toBe("reported-not-official");
    expect(run.morphology.officialMorphologyGateStatus).toBe("not-wired");
    expect(run.morphology.officialMorphologyPass).toBe("not-claimed");
    expect(run.morphology.finiteMetricSet).toBe(true);
    for (const value of Object.values(run.morphology.metrics)) {
      expect(Number.isFinite(value)).toBe(true);
    }
  });

  it("keeps Phase 5A and Phase 5B as read-only pins and does not treat 5B as same-protocol SDIRK2", () => {
    const report = fixture().report;

    expect(report.readOnlyPins.phase5A.reusePolicy).toBe("read-only");
    expect(report.readOnlyPins.phase5A.readinessPass).toBe(true);
    expect(report.readOnlyPins.phase5A.stableSummaryHash).toMatch(/^[0-9a-f]{8}$/);
    expect(report.readOnlyPins.phase5B.reusePolicy).toBe("read-only");
    expect(report.readOnlyPins.phase5B.readinessPass).toBe(true);
    expect(report.readOnlyPins.phase5B.phase5BReadOnlySdirk2Status)
      .toBe("solver-reference-available-not-same-protocol");
    expect(report.readOnlyPins.phase5B.sameProtocolAgreementClaim).toBe("not-claimed");
  });

  it("fails validation if generated runs consume legacy traces or replay outputs", () => {
    const input = fixture();
    input.report.landNewMyocardiumRun.trajectoryGenerationPolicy.consumesPhase5CALegacyVlvTrace = true;
    input.report.landNewMyocardiumRun.trajectoryGenerationPolicy.consumesRunLowPreloadDebugOutput = true;
    input.report.legacyPositiveControl.trajectoryGenerationPolicy.consumesLegacyActiveStressTimeSeries = true;

    const validation = validateLandNewMyocardiumLowPreloadCheck(input);
    const codes = validation.errors.map((issue) => issue.code);

    expect(validation.pass).toBe(false);
    expect(codes).toContain("phase5c_c_forbidden_replay");
  });

  it("fails validation if the positive control is marked as hard-coded beat-parity forcing", () => {
    const input = fixture();
    input.report.legacyPositiveControl.sourceProviderProvenance.hardCodedBeatParityForcing = true;

    const validation = validateLandNewMyocardiumLowPreloadCheck(input);

    expect(validation.pass).toBe(false);
    expect(validation.errors.map((issue) => issue.code))
      .toContain("phase5c_c_positive_control_provenance");
  });

  it("fails validation if the same-closure source-provider-only invariant is broken", () => {
    const input = fixture();
    input.report.landNewMyocardiumRun.hashes.closureConfigStableHash = "deadbeef";
    input.report.sameClosureEvidence.landClosureConfigStableHash = "deadbeef";
    input.report.sameClosureEvidence.sourceProviderDifferenceOnly = false;
    input.report.sameClosureEvidence.pass = false;

    const validation = validateLandNewMyocardiumLowPreloadCheck(input);

    expect(validation.pass).toBe(false);
    expect(validation.errors.map((issue) => issue.code)).toContain("phase5c_c_same_closure");
  });

  it("fails validation if policy, second-order, final no-alternans, or official morphology claims are strengthened", () => {
    const input = fixture();
    input.report.newMyocardiumCheckRequiredSatisfied = true;
    input.report.policyBoundary.newMyocardiumCheckRequiredSatisfied = true;
    input.report.secondOrderSameProtocolStatus = "performed" as any;
    input.report.policyBoundary.secondOrderSameProtocolStatus = "performed" as any;
    input.report.finalNoAlternansClaim = "claimed" as any;
    input.report.policyBoundary.finalNoAlternansClaim = "claimed" as any;
    input.report.landNewMyocardiumRun.morphology.officialMorphologyGateStatus = "wired" as any;
    input.report.landNewMyocardiumRun.morphology.officialMorphologyPass = "claimed" as any;

    const validation = validateLandNewMyocardiumLowPreloadCheck(input);
    const codes = validation.errors.map((issue) => issue.code);

    expect(validation.pass).toBe(false);
    expect(codes).toContain("phase5c_c_policy_boundary");
    expect(codes).toContain("phase5c_c_morphology_boundary");
  });

  it("fails validation if the descriptor allows advancement while the positive control is period-1", () => {
    const input = fixture();
    input.descriptor.policyStatuses.artifactGateExpectedPass = true;
    input.descriptor.policyStatuses.landRunInterpretation = "interpretable-no-alternans";
    input.descriptor.policyStatuses.sameProtocolSecondOrderAdvancementStatus = "ready";

    const validation = validateLandNewMyocardiumLowPreloadCheck(input);

    expect(validation.pass).toBe(false);
    expect(validation.errors.map((issue) => issue.code))
      .toContain("phase5c_c_advancement_block");
  });

  it("fails validation if the Phase 5C-D audit evidence claims the artifact gate can pass", () => {
    const input = fixture();
    input.fidelityAuditEvidence.auditOutcome.artifactGateExpectedPass = true;
    input.fidelityAuditEvidence.auditOutcome.landRunInterpretation = "interpretable-no-alternans";

    const validation = validateLandNewMyocardiumLowPreloadCheck(input);

    expect(validation.pass).toBe(false);
    expect(validation.errors.map((issue) => issue.code))
      .toContain("phase5c_d_fidelity_audit_evidence");
  });

  it("fails validation if the Phase 5C-D audit evidence enables a forbidden claim", () => {
    const input = fixture();
    input.fidelityAuditEvidence.nonClaims.triSegAdoption = true;

    const validation = validateLandNewMyocardiumLowPreloadCheck(input);

    expect(validation.pass).toBe(false);
    expect(validation.errors.map((issue) => issue.code))
      .toContain("phase5c_d_fidelity_audit_evidence");
  });

  it("fails validation if the Phase 5C-D audit evidence adds an unknown overclaim field", () => {
    const input = fixture();
    input.fidelityAuditEvidence.auditOutcome.finalNoAlternansEvidence = "claimed";

    const validation = validateLandNewMyocardiumLowPreloadCheck(input);

    expect(validation.pass).toBe(false);
    expect(validation.errors.map((issue) => issue.code))
      .toContain("phase5c_d_fidelity_audit_evidence");
  });

  it("fails validation if the Phase 5C-D audit evidence source file is missing", () => {
    const input = fixture();
    input.sourceFiles = input.sourceFiles.filter((file) =>
      file.path !== LAND_NEW_MYOCARDIUM_PHASE5C_D_FIDELITY_AUDIT_EVIDENCE_PATH
    );

    const validation = validateLandNewMyocardiumLowPreloadCheck(input);

    expect(validation.pass).toBe(false);
    expect(validation.errors.map((issue) => issue.code)).toContain("phase5c_c_source_scan");
  });

  it("fails validation if the Phase 5C-D audit plan drops the no-go boundary", () => {
    const input = fixture();
    replaceFidelityAuditPlanText(
      input,
      /cannot be interpreted as evidence that alternans\s+disappeared/,
      "can be interpreted as evidence that alternans disappeared",
    );

    const validation = validateLandNewMyocardiumLowPreloadCheck(input);

    expect(validation.pass).toBe(false);
    expect(validation.errors.map((issue) => issue.code))
      .toContain("phase5c_c_fidelity_plan_boundary");
  });

  it("fails validation if the Phase 5C-D audit plan flips the no-parallel-engine boundary", () => {
    const input = fixture();
    replaceFidelityAuditPlanText(
      input,
      /not\s+as a new standalone engine or duplicated verifier/,
      "as a new standalone engine or duplicated verifier",
    );

    const validation = validateLandNewMyocardiumLowPreloadCheck(input);

    expect(validation.pass).toBe(false);
    expect(validation.errors.map((issue) => issue.code))
      .toContain("phase5c_c_fidelity_plan_boundary");
  });

  it("fails validation if the Phase 5C-D audit plan drops the parallel-verifier no-go", () => {
    const input = fixture();
    replaceFidelityAuditPlanText(
      input,
      "Do not duplicate Phase 5C-C branch metrics in a parallel verifier.",
      "Do not duplicate Phase 5C-C branch metrics.",
    );

    const validation = validateLandNewMyocardiumLowPreloadCheck(input);

    expect(validation.pass).toBe(false);
    expect(validation.errors.map((issue) => issue.code))
      .toContain("phase5c_c_fidelity_plan_boundary");
  });

  it("fails validation if the Phase 5C-D audit plan drops the TriSeg no-claim boundary", () => {
    const input = fixture();
    replaceFidelityAuditPlanText(
      input,
      "Do not claim official morphology acceptance, final robust no-alternans,\n  calcium-cycling alternans validation, RV pressure-overload coverage,\n  ventricular interdependence, right-heart failure coverage, or TriSeg adoption.",
      "Do not claim official morphology acceptance, final robust no-alternans,\n  calcium-cycling alternans validation, RV pressure-overload coverage,\n  ventricular interdependence, or right-heart failure coverage.",
    );

    const validation = validateLandNewMyocardiumLowPreloadCheck(input);

    expect(validation.pass).toBe(false);
    expect(validation.errors.map((issue) => issue.code))
      .toContain("phase5c_c_fidelity_plan_boundary");
  });

  it("fails validation if the Phase 5C-D audit plan adds a contradictory adoption claim", () => {
    const input = fixture();
    appendFidelityAuditPlanText(
      input,
      "\nThis audit may now be implemented as a new standalone engine, duplicate Phase 5C-C branch metrics in a parallel verifier, and claim TriSeg adoption.\n",
    );

    const validation = validateLandNewMyocardiumLowPreloadCheck(input);

    expect(validation.pass).toBe(false);
    expect(validation.errors.map((issue) => issue.code))
      .toContain("phase5c_c_fidelity_plan_boundary");
  });

  it("fails validation if the Phase 5C-D audit plan adds affirmative TriSeg adoption prose", () => {
    const input = fixture();
    appendFidelityAuditPlanText(input, "\nThis audit may now adopt TriSeg.\n");

    const validation = validateLandNewMyocardiumLowPreloadCheck(input);

    expect(validation.pass).toBe(false);
    expect(validation.errors.map((issue) => issue.code))
      .toContain("phase5c_c_fidelity_plan_boundary");
  });

  it("fails validation if the Phase 5C-D audit plan adds affirmative ModelCore wiring prose", () => {
    const input = fixture();
    appendFidelityAuditPlanText(input, "\nThis audit may now wire ModelCore.\n");

    const validation = validateLandNewMyocardiumLowPreloadCheck(input);

    expect(validation.pass).toBe(false);
    expect(validation.errors.map((issue) => issue.code))
      .toContain("phase5c_c_fidelity_plan_boundary");
  });

  it("fails validation if the Phase 5C-D audit plan hides adoption prose behind an unrelated negation", () => {
    const input = fixture();
    appendFidelityAuditPlanText(
      input,
      "\nThis is not a runtime change, but this audit may now adopt TriSeg.\n",
    );

    const validation = validateLandNewMyocardiumLowPreloadCheck(input);

    expect(validation.pass).toBe(false);
    expect(validation.errors.map((issue) => issue.code))
      .toContain("phase5c_c_fidelity_plan_boundary");
  });

  it("fails validation if the Phase 5C-D audit plan adds an official morphology prose claim", () => {
    const input = fixture();
    appendFidelityAuditPlanText(input, "\nThis audit may now claim official morphology pass.\n");

    const validation = validateLandNewMyocardiumLowPreloadCheck(input);

    expect(validation.pass).toBe(false);
    expect(validation.errors.map((issue) => issue.code))
      .toContain("phase5c_c_fidelity_plan_boundary");
  });

  it("fails validation if the Phase 5C-D audit plan adds inflected affirmative adoption prose", () => {
    const input = fixture();
    appendFidelityAuditPlanText(input, "\nThis audit adopts TriSeg.\nThe audit wires ModelCore.\n");

    const validation = validateLandNewMyocardiumLowPreloadCheck(input);

    expect(validation.pass).toBe(false);
    expect(validation.errors.map((issue) => issue.code))
      .toContain("phase5c_c_fidelity_plan_boundary");
  });

  it("fails validation if the Phase 5C-D audit plan permits official morphology prose", () => {
    const input = fixture();
    appendFidelityAuditPlanText(input, "\nThis plan permits official morphology pass.\n");

    const validation = validateLandNewMyocardiumLowPreloadCheck(input);

    expect(validation.pass).toBe(false);
    expect(validation.errors.map((issue) => issue.code))
      .toContain("phase5c_c_fidelity_plan_boundary");
  });

  it("fails validation if the Phase 5C-D audit plan hides adoption prose with without or and", () => {
    const input = fixture();
    appendFidelityAuditPlanText(
      input,
      "\nThis audit may now adopt TriSeg without runtime changes. This is not a runtime change and this audit may now wire ModelCore.\n",
    );

    const validation = validateLandNewMyocardiumLowPreloadCheck(input);

    expect(validation.pass).toBe(false);
    expect(validation.errors.map((issue) => issue.code))
      .toContain("phase5c_c_fidelity_plan_boundary");
  });

  it("fails validation if the Phase 5C-D audit plan adds a no-alternans evidence claim", () => {
    const input = fixture();
    appendFidelityAuditPlanText(
      input,
      "\nThe Land generated run can now be interpreted as no-alternans evidence. This result can now be interpreted as evidence that alternans disappeared.\n",
    );

    const validation = validateLandNewMyocardiumLowPreloadCheck(input);

    expect(validation.pass).toBe(false);
    expect(validation.errors.map((issue) => issue.code))
      .toContain("phase5c_c_fidelity_plan_boundary");
  });

  it("fails validation if the Phase 5C-D audit plan says the Land run is interpretable evidence", () => {
    const input = fixture();
    replaceFidelityAuditPlanText(
      input,
      "The Land generated run is not interpretable as no-alternans evidence while\n  the positive control fails.",
      "The Land generated run is interpretable as no-alternans evidence while\n  the positive control fails.",
    );

    const validation = validateLandNewMyocardiumLowPreloadCheck(input);

    expect(validation.pass).toBe(false);
    expect(validation.errors.map((issue) => issue.code))
      .toContain("phase5c_c_fidelity_plan_boundary");
  });

  it("fails validation if the Phase 5C-D audit plan adds runtime wiring prose beyond ModelCore", () => {
    const input = fixture();
    appendFidelityAuditPlanText(
      input,
      "\nDo not wire ModelCore, but this audit may now wire Workbench and runtime schema.\n",
    );

    const validation = validateLandNewMyocardiumLowPreloadCheck(input);

    expect(validation.pass).toBe(false);
    expect(validation.errors.map((issue) => issue.code))
      .toContain("phase5c_c_fidelity_plan_boundary");
  });

  it("fails validation if the Phase 5C-D audit plan adds tuning prose beyond qDot", () => {
    const input = fixture();
    appendFidelityAuditPlanText(
      input,
      "\nDo not tune qDot, but this audit may now tune valve thresholds and preload/afterload closure settings.\n",
    );

    const validation = validateLandNewMyocardiumLowPreloadCheck(input);

    expect(validation.pass).toBe(false);
    expect(validation.errors.map((issue) => issue.code))
      .toContain("phase5c_c_fidelity_plan_boundary");
  });

  it("fails validation if the Phase 5C-D audit plan adds same-protocol advancement prose", () => {
    const input = fixture();
    appendFidelityAuditPlanText(input, "\nSame-protocol second-order advancement can now proceed.\n");

    const validation = validateLandNewMyocardiumLowPreloadCheck(input);

    expect(validation.pass).toBe(false);
    expect(validation.errors.map((issue) => issue.code))
      .toContain("phase5c_c_fidelity_plan_boundary");
  });

  it("fails validation when Phase 5C-C tokens leak into runtime integration targets", () => {
    const input = fixture();
    input.runtimeIntegrationFiles = [
      ...input.runtimeIntegrationFiles,
      {
        path: "engine/ModelCore.ts",
        text: "runLandNewMyocardiumLowPreloadCheckReport();",
      },
    ];

    const validation = validateLandNewMyocardiumLowPreloadCheck(input);

    expect(validation.pass).toBe(false);
    expect(validation.errors.map((issue) => issue.code)).toContain("phase5c_c_runtime_leak");
  });
});

function fixture(): MutableValidationInput {
  return structuredClone(baseValidationInput) as MutableValidationInput;
}

function appendFidelityAuditPlanText(
  input: MutableValidationInput,
  suffix: string,
): void {
  const planIndex = input.sourceFiles.findIndex((file) =>
    file.path === "docs/myocardium/roadmap/phase5c-positive-control-fidelity-audit-plan.md"
  );
  expect(planIndex).toBeGreaterThanOrEqual(0);
  input.sourceFiles[planIndex] = {
    ...input.sourceFiles[planIndex],
    text: `${input.sourceFiles[planIndex].text}${suffix}`,
  };
}

function replaceFidelityAuditPlanText(
  input: MutableValidationInput,
  search: string | RegExp,
  replacement: string,
): void {
  const planIndex = input.sourceFiles.findIndex((file) =>
    file.path === "docs/myocardium/roadmap/phase5c-positive-control-fidelity-audit-plan.md"
  );
  expect(planIndex).toBeGreaterThanOrEqual(0);
  input.sourceFiles[planIndex] = {
    ...input.sourceFiles[planIndex],
    text: input.sourceFiles[planIndex].text.replace(search, replacement),
  };
}

type MutableValidationInput = LandNewMyocardiumLowPreloadValidationInput & {
  descriptor: any;
  fidelityAuditEvidence: any;
  report: any;
  sourceFiles: any[];
  runtimeIntegrationFiles: any[];
};
