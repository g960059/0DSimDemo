import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  PHASE_B1_NORMAL_SINUS_BE_PAIRED_PERIODIC_MODE_ORDER_V1,
  PHASE_B1_NORMAL_SINUS_BE_PAIRED_PERIODIC_NOMINAL_DT_SEC_V1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1NormalSinusBeTerminalCycleCapsuleV1";
import {
  PHASE_B1_PAIRED_LIVE_PERIODIC_DIAGNOSTIC_CONFIG_V1,
  PHASE_B1_PAIRED_LIVE_PERIODIC_DIAGNOSTIC_CONFIG_V1_ID,
  decidePhaseB1PairedLivePeriodicModeDispositionV1,
} from "@/tools/myocardium/phaseB1PairedLivePeriodicDiagnosticConfigV1";
import {
  runPhaseB1LivePeriodicRetainedModeV1,
  type PhaseB1LivePeriodicRetainedModeRunFailureV1,
} from "@/tools/myocardium/phaseB1LivePeriodicRetainedModeRunV1";

describe("four-chamber Phase B1 paired live-periodic diagnostic", () => {
  it("has one frozen no-environment off-then-on configuration", () => {
    const config = PHASE_B1_PAIRED_LIVE_PERIODIC_DIAGNOSTIC_CONFIG_V1;
    expect(config.configId)
      .toBe(PHASE_B1_PAIRED_LIVE_PERIODIC_DIAGNOSTIC_CONFIG_V1_ID);
    expect(Object.isFrozen(config)).toBe(true);
    expect(config.modeOrder)
      .toBe(PHASE_B1_NORMAL_SINUS_BE_PAIRED_PERIODIC_MODE_ORDER_V1);
    expect(config.modeOrder).toEqual(["off", "on"]);
    expect(config.nominalDtSec)
      .toBe(PHASE_B1_NORMAL_SINUS_BE_PAIRED_PERIODIC_NOMINAL_DT_SEC_V1);
    expect(config.nominalDtMs).toBe(1);
    expect(config.maximumSupercycles).toBe(100);
    expect(config.requiredConsecutivePassingSupercycles).toBe(3);
    expect(config.environmentOverridesAccepted).toBe(false);
    expect(config.parentAndScheduleBuiltOnce).toBe(true);
    expect(config.bothControllersInitializedBeforeFirstAdvance).toBe(true);
    expect(config.globalMonotonicJsonlSequenceAcrossModes).toBe(true);
    expect(config.stopOnFirstModeFailure).toBe(true);
    expect(config.externalPairedFailureRecompositionAllowed).toBe(false);
    expect(config.builderIssuedAuthenticationSurvivesSerialization)
      .toBe(false);
  });

  it("continues only after off convergence and finalizes only after on convergence", () => {
    expect(decidePhaseB1PairedLivePeriodicModeDispositionV1({
      mode: "off",
      classification: "converged",
    })).toEqual({
      mode: "off",
      classification: "converged",
      action: "continue-to-on",
      continueToNextMode: true,
      pairedEvidenceEligible: false,
      stopImmediately: false,
      exitCode: null,
    });
    expect(decidePhaseB1PairedLivePeriodicModeDispositionV1({
      mode: "on",
      classification: "converged",
    })).toMatchObject({
      action: "finalize-paired-success",
      pairedEvidenceEligible: true,
      stopImmediately: false,
      exitCode: null,
    });
  });

  it.each([
    ["off", "live-periodic-cycle-failure"],
    ["off", "maximum-supercycles-exhausted"],
    ["on", "live-periodic-cycle-failure"],
    ["on", "maximum-supercycles-exhausted"],
  ] as const)("fails fast for mode=%s classification=%s", (mode,
    classification) => {
    expect(decidePhaseB1PairedLivePeriodicModeDispositionV1({
      mode,
      classification,
    })).toMatchObject({
      action: "emit-paired-evidence-not-issued",
      continueToNextMode: false,
      pairedEvidenceEligible: false,
      stopImmediately: true,
      exitCode: 1,
    });
  });

  it("routes the retained runner live-failure discriminator to both failure records", () => {
    const outcome = Object.freeze({
      completed: false as const,
      mode: "off" as const,
      failureKind: "live-periodic-cycle-failure" as const,
      livePeriodicFailure: Object.freeze({}),
      terminalCycleCapsuleFailure: null,
    }) as PhaseB1LivePeriodicRetainedModeRunFailureV1;
    expect(decidePhaseB1PairedLivePeriodicModeDispositionV1({
      mode: outcome.mode,
      classification: outcome.failureKind,
    })).toMatchObject({
      classification: outcome.failureKind,
      action: "emit-paired-evidence-not-issued",
      stopImmediately: true,
      exitCode: 1,
    });

    const source = readFileSync(
      new URL(
        "../tools/myocardium/diagnoseFourChamberTrisegLandPhaseB1PairedLivePeriodicBe.ts",
        import.meta.url,
      ),
      "utf8",
    );
    const failureBranch = source.slice(
      source.indexOf("if (outcome.completed === false)"),
      source.indexOf("process.exitCode = 1", source.indexOf(
        "if (outcome.completed === false)",
      )),
    );
    expect(failureBranch).toContain("classification: outcome.failureKind");
    expect(failureBranch).toContain(
      'outcome.failureKind === "live-periodic-cycle-failure"',
    );
    expect(failureBranch).toContain('"mode-live-periodic-cycle-failure"');
    expect(failureBranch).toContain("printPairedEvidenceNotIssued({");
  });

  it("rejects open disposition inputs and caller-supplied success gates", () => {
    expect(() => decidePhaseB1PairedLivePeriodicModeDispositionV1({
      mode: "off",
      classification: "converged",
      pairedEvidenceEligible: true,
    })).toThrow(/must contain exactly/i);
    expect(() => decidePhaseB1PairedLivePeriodicModeDispositionV1({
      mode: "OFF",
      classification: "converged",
    })).toThrow(/must be exactly off or on/i);
    expect(() => decidePhaseB1PairedLivePeriodicModeDispositionV1({
      mode: "off",
      classification: "running",
    })).toThrow(/classification is not closed/i);

    expect(() => runPhaseB1LivePeriodicRetainedModeV1({
      parentManifest: Object.freeze({}),
      parentNumericalEvidence: Object.freeze({}),
      schedule: Object.freeze({}),
      initialController: Object.freeze({}),
      emitCycleRecord: () => undefined,
      pairedOneMillisecondPeriodicEvidencePass: true,
      sha256Hex: sha256,
    } as never)).toThrow(/must contain exactly/i);
    expect(() => runPhaseB1LivePeriodicRetainedModeV1({
      parentManifest: Object.freeze({}),
      parentNumericalEvidence: Object.freeze({}),
      schedule: Object.freeze({}),
      initialController: Object.freeze({}),
      emitCycleRecord: null,
      sha256Hex: sha256,
    } as never)).toThrow(/requires a cycle-record emitter/i);
  });

  it("keeps numerical config no-env, permits output-path env only, initializes both modes first, and never invokes paired failure recomposition", () => {
    const source = readFileSync(
      new URL(
        "../tools/myocardium/diagnoseFourChamberTrisegLandPhaseB1PairedLivePeriodicBe.ts",
        import.meta.url,
      ),
      "utf8",
    );
    const controllerInitialization = source.indexOf(
      "const initialControllers = Object.freeze",
    );
    const modeLoop = source.indexOf("for (", controllerInitialization);
    const comparisonManifest = source.indexOf(
      "const comparisonManifest =",
    );
    const morphologyManifest = source.indexOf(
      "const morphologyAnalysisManifest =",
    );
    const matchedVolumeManifest = source.indexOf(
      "const matchedVolumeAnalysisManifest =",
    );
    expect(controllerInitialization).toBeGreaterThan(-1);
    expect(modeLoop).toBeGreaterThan(controllerInitialization);
    expect(comparisonManifest).toBeGreaterThan(-1);
    expect(comparisonManifest).toBeLessThan(controllerInitialization);
    expect(morphologyManifest).toBeGreaterThan(controllerInitialization);
    expect(morphologyManifest).toBeLessThan(modeLoop);
    expect(matchedVolumeManifest).toBeGreaterThan(controllerInitialization);
    expect(matchedVolumeManifest).toBeLessThan(modeLoop);
    expect(source).toContain("process.env");
    expect(source).toContain("PHASE_B1_PAIRED_ATRIAL_PV_MORPHOLOGY_OUTPUT");
    expect(source).toContain("PHASE_B1_PAIRED_TERMINAL_WAVEFORM_OUTPUT");
    expect(source).toContain("PHASE_B1_PAIRED_MATCHED_VOLUME_OUTPUT");
    expect(source).not.toContain("process.env.PHASE_B1_PAIRED_LIVE_PERIODIC");
    expect(source).toContain("numericalEnvironmentOverridesAccepted: false");
    expect(source).toContain("outputPathEnvironmentOverridesAccepted: true");
    expect(source).toContain("runPhaseB1LivePeriodicRetainedModeV1");
    expect(source).toContain(
      "finalizePhaseB1NormalSinusBePairedPeriodicEvidenceFromRetainedCapsulesV1",
    );
    expect(source).toContain('stage: "paired-evidence-not-issued"');
    expect(source).toContain(
      "externalPairedFailureRecompositionPerformed: false",
    );
    expect(source).not.toContain(
      "runPhaseB1NormalSinusBePairedPeriodicEvidenceV1",
    );
    expect(source).not.toContain("issuePairedFailure");
  });

  it("retains the monitoring fields needed to audit flow, SLS, and run-end coalescence", () => {
    const source = readFileSync(
      new URL(
        "../tools/myocardium/phaseB1LivePeriodicRetainedModeRunV1.ts",
        import.meta.url,
      ),
      "utf8",
    );
    for (const field of [
      "definitionContentSha256",
      "scheduleContentSha256",
      "maximumRelativeSignedNetFlowMismatch",
      "systemicNetFlowUsableAsRelativeDenominator",
      "maximumSignedDecompositionRelativeResidual",
      "adjacentMaximumSlsNormalizedDistance",
      "streakWindowMaximumSlsNormalizedDistance",
      "oneUlpRunEndNominalGridBoundaryCoalescenceCount",
    ]) expect(source).toContain(field);
    expect(source).toContain("Object.is(successor.sourceCase, sourceCase)");
    expect(source).toContain("Object.is(successor.schedule, schedule)");
  });

  it("wires both in-process terminal observations to paired visual artifacts without a morphology outcome exit gate", () => {
    const source = readFileSync(
      new URL(
        "../tools/myocardium/diagnoseFourChamberTrisegLandPhaseB1PairedLivePeriodicBe.ts",
        import.meta.url,
      ),
      "utf8",
    );
    const finalStage = source.slice(source.indexOf(
      'stage: "paired-visual-artifacts-final"',
    ));
    expect(source).toContain(
      "buildPhaseB1NormalSinusBeTerminalTimestepObservationV1",
    );
    expect(source).toContain(
      "buildPhaseB1PairedAtrialPvMorphologyArtifactV1",
    );
    expect(source).toContain("buildPhaseB1PairedTerminalWaveformArtifactV1");
    expect(source).toContain(
      "buildPhaseB1PairedAtrialMatchedVolumeTerminalObservationAdapterV1",
    );
    expect(source).toContain(
      "buildPhaseB1PairedAtrialMatchedVolumePressureAttributionArtifactV1",
    );
    expect(source).toContain("writeAtomically(morphologyOutputPath");
    expect(source).toContain("writeAtomically(pairedWaveformOutputPath");
    expect(source).toContain("writeAtomically(matchedVolumeOutputPath");
    expect(finalStage).toContain("morphologyClassificationAffectsExitCode: false");
    expect(finalStage).toContain(
      "matchedVolumeArtifactIntegrityAffectsExitCode: false",
    );
    expect(finalStage).toContain(
      "pressureDeltaSignUsedAsAcceptanceGate: false",
    );
    expect(finalStage).toContain(
      "slsOffNearZeroAuditUsedAsAcceptanceGate: false",
    );
    expect(finalStage).toContain(
      "reservoirConduitPumpPhaseOwnershipIncluded: true",
    );
    expect(finalStage).toContain(
      "matchedVolumePressureAttributionIncluded: true",
    );
    expect(finalStage).toContain("claimBoundaryByArtifact:");
    expect(finalStage).toContain(
      "matchedVolume: matchedVolumeArtifact.claimBoundary",
    );
    expect(finalStage).not.toContain(
      "claimBoundary: morphologyArtifact.claimBoundary",
    );
    expect(finalStage).toContain("fullRequiredSlsAblationReportComplete: false");
    expect(finalStage.indexOf("process.exitCode = 0")).toBeGreaterThan(-1);
  });
});

function sha256(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}
