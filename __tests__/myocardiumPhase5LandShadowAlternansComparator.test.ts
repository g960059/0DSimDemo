import { describe, expect, it } from "vitest";
import {
  LAND_SHADOW_ALTERNANS_COMPARATOR_PHASE5C_A_CLAIM_BOUNDARY,
  LAND_SHADOW_ALTERNANS_COMPARATOR_PHASE5C_A_PHASE,
  LAND_SHADOW_ALTERNANS_COMPARATOR_PHASE5C_A_PROTOCOL_SET_ID,
} from "@/engine/myocardium/protocols/landShadowAlternansComparatorReadiness";
import {
  loadLandShadowAlternansComparatorValidationInput,
  validateLandShadowAlternansComparatorReadiness,
  type LandShadowAlternansComparatorValidationInput,
} from "@/tools/myocardium/verifyLandShadowAlternansComparatorReadiness";

const baseValidationInput =
  loadLandShadowAlternansComparatorValidationInput(process.cwd());

describe("myocardium Phase 5C-A Land shadow alternans comparator readiness", () => {
  it("validates the harness while preserving the current artifactGate failure instead of claiming a Land alternans verdict", () => {
    const input = fixture();
    const validation = validateLandShadowAlternansComparatorReadiness(input);
    const report = input.report;

    expect(validation.errors).toEqual([]);
    expect(validation.pass).toBe(true);
    expect(validation.artifactGatePass).toBe(false);
    expect(validation.artifactGateStatus).toBe("land-shadow-comparator-review");
    expect(validation.artifactGateFindings.join("\n")).toMatch(
      /selected-v2 LV calibration-domain coverage failed/,
    );
    expect(report.protocolSetId).toBe(LAND_SHADOW_ALTERNANS_COMPARATOR_PHASE5C_A_PROTOCOL_SET_ID);
    expect(report.phase).toBe(LAND_SHADOW_ALTERNANS_COMPARATOR_PHASE5C_A_PHASE);
    expect(report.claimBoundary).toBe(LAND_SHADOW_ALTERNANS_COMPARATOR_PHASE5C_A_CLAIM_BOUNDARY);
    expect(report.productionRuntimeStatus).toBe("not-live-runtime-replacement");
    expect(report.officialMorphologyPass).toBe("not-claimed");
    expect(report.finalNoAlternansClaim).toBe("not-claimed");
    expect(report.readinessPass).toBe(false);
    expect(report.sections.find((section) => section.id === "land-feedforward-shadow-replay-v1")?.status)
      .toBe("readiness-fail");
  });

  it("reproduces the fixed legacy activeStress low-preload period-2 protocol before feeding the prescribed VLV trajectory to Land", () => {
    const report = fixture().report;
    const legacy = report.legacyReproduction.observed;

    expect(report.legacyReproduction.fixedProtocolPass).toBe(true);
    expect(report.legacyReproduction.reproductionPass).toBe(true);
    expect(legacy.baselineTotalBloodVolumeMl).toBe(5600);
    expect(legacy.deltaTotalBloodVolumeMl).toBe(-1250);
    expect(legacy.effectiveTotalBloodVolumeMl).toBe(4350);
    expect(legacy.heartModel).toBe("activeStress");
    expect(legacy.integrationDtSec).toBe(0.001);
    expect(legacy.sampleHz).toBe(120);
    expect(legacy.traceBeats).toBe(4);
    expect(legacy.returnMapAcceptance).toBe("not-used");
    expect(legacy.returnMapPointLimit).toBe(0);
    expect(legacy.settled).toBe(true);
    expect(legacy.periodBeats).toBe(2);
    expect(legacy.adjacentDelta).toBeGreaterThan(0.1);
    expect(legacy.periodDelta).toBeLessThan(0.05);
    expect(legacy.tbvClassification).toBe("clean");
    expect(legacy.tbvSanitizeAbsMl).toBeLessThanOrEqual(0.05);
    expect(legacy.tbvProjectionAppliedMl).toBeLessThanOrEqual(0.05);
    expect(legacy.maxValveReverseMl).toBeLessThanOrEqual(0.05);
  });

  it("keeps the Land replay feedforward-only and exposes the selected-v2 calibration-domain blocker", () => {
    const replay = fixture().report.landFeedforwardReplay;

    expect(replay.replayStatus).toBe("feedforward-shadow-replay-complete");
    expect(replay.volumeReplayPolicy.sourceVolume).toBe("legacy-activeStress-VLV-mL");
    expect(replay.volumeReplayPolicy.conversion).toBe("mL-to-m3");
    expect(replay.volumeReplayPolicy.clipping).toBe(false);
    expect(replay.volumeReplayPolicy.rescale).toBe(false);
    expect(replay.volumeReplayPolicy.freeGain).toBe(false);
    expect(replay.calciumSource.phaseAlignment)
      .toBe("legacy-sample-phase-to-prescribed-calcium-time-since-activation");
    expect(replay.calciumSource.calciumCyclingAlternans).toBe("not-modeled-not-claimed");
    expect(replay.branchDeltaInterpretation)
      .toBe("inherited-from-prescribed-alternating-legacy-volume-not-generated-by-Land");
    expect(replay.officialMorphologyPassStatus).toBe("not-evaluated");
    expect(replay.robustNoAlternansClaim).toBe("not-claimed");
    expect(replay.replayBeatCount).toBe(4);
    expect(replay.beats).toHaveLength(4);
    expect(replay.trajectorySampleCount).toBeGreaterThan(0);
    expect(replay.allFiniteHealth).toBe(true);
    expect(replay.projectionUsedAny).toBe(false);
    expect(replay.allSamplesInCalibrationDomain).toBe(false);
    expect(replay.replayPass).toBe(false);
    expect(replay.replayStableHash).toMatch(/^[0-9a-f]{8}$/);
    expect(replay.beats.some((beat) =>
      beat.minPrescribedLegacyVlvM3 < replay.selectedLvCalibrationDomainM3.min,
    )).toBe(true);
    for (const beat of replay.beats) {
      expect(beat.sampleCount).toBeGreaterThan(0);
      expect(beat.peakSourceActiveFiberStressPa).toBeGreaterThan(0);
      expect(beat.finiteHealth.pass).toBe(true);
      expect(beat.projectionUsed).toBe(false);
      expect(beat.deterministicHash).toMatch(/^[0-9a-f]{8}$/);
    }
  });

  it("does not satisfy the policy newMyocardiumCheck or final no-alternans requirement with a feedforward shadow replay", () => {
    const policy = fixture().report.policyBoundary;

    expect(policy.legacyReproductionRequired).toBe(true);
    expect(policy.newMyocardiumCheckRequired).toBe(true);
    expect(policy.secondOrderReferenceRequired).toBe(true);
    expect(policy.newMyocardiumCheckStatus).toBe("not-performed-not-satisfied");
    expect(policy.feedforwardShadowReplayEvidenceStatus)
      .toBe("performed-distinct-from-new-myocardium-check");
    expect(policy.finalNoAlternansClaim).toBe("not-claimed");
    expect(policy.beOnlyInterpretation).toMatch(/smoke evidence only/i);
  });

  it("fails validation if the legacy reproduction or claim boundary is weakened", () => {
    const input = fixture();
    input.report.legacyReproduction.observed.periodBeats = 1;
    input.report.legacyReproduction.reproductionPass = false;
    input.report.policyBoundary.newMyocardiumCheckStatus = "performed" as any;
    input.report.finalNoAlternansClaim = "claimed" as any;

    const validation = validateLandShadowAlternansComparatorReadiness(input);
    const codes = validation.errors.map((issue) => issue.code);

    expect(validation.pass).toBe(false);
    expect(codes).toContain("phase5c_legacy_reproduction");
    expect(codes).toContain("phase5c_policy_boundary");
    expect(codes).toContain("phase5c_forbidden_claim");
  });

  it("fails validation when Phase 5C-A tokens leak into runtime integration targets", () => {
    const input = fixture();
    input.runtimeIntegrationFiles = [
      ...input.runtimeIntegrationFiles,
      {
        path: "engine/ModelCore.ts",
        text: "runLandShadowAlternansComparatorReadinessReport();",
      },
    ];

    const validation = validateLandShadowAlternansComparatorReadiness(input);

    expect(validation.pass).toBe(false);
    expect(validation.errors.map((issue) => issue.code)).toContain("phase5c_runtime_leak");
  });
});

function fixture(): MutableValidationInput {
  return structuredClone(baseValidationInput) as MutableValidationInput;
}

type MutableValidationInput = LandShadowAlternansComparatorValidationInput & {
  report: any;
  runtimeIntegrationFiles: any[];
};
