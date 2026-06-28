import { describe, expect, it } from "vitest";
import {
  LAND_NEW_MYOCARDIUM_LOW_PRELOAD_PHASE5C_CLAIM_BOUNDARY,
  LAND_NEW_MYOCARDIUM_LOW_PRELOAD_PHASE5C_PHASE,
  LAND_NEW_MYOCARDIUM_LOW_PRELOAD_PHASE5C_PROTOCOL_SET_ID,
  PHASE5C_C_STANDALONE_CLOSURE_MODEL_ID,
} from "@/engine/myocardium/protocols/landNewMyocardiumLowPreloadCheck";
import {
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

type MutableValidationInput = LandNewMyocardiumLowPreloadValidationInput & {
  descriptor: any;
  report: any;
  runtimeIntegrationFiles: any[];
};
