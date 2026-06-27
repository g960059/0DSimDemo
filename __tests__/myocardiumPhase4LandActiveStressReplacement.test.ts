import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import protocolDescriptor from "@/data/myocardium/protocols/land-active-stress-replacement-phase4b-protocols.json";
import {
  LAND_ACTIVE_STRESS_REPLACEMENT_PHASE4B_CLAIM_BOUNDARY,
  LAND_ACTIVE_STRESS_REPLACEMENT_PHASE4B_EXECUTABLE_KINEMATICS_MODEL_ID,
  LAND_ACTIVE_STRESS_REPLACEMENT_PHASE4B_PROTOCOL_SET_ID,
  LAND_ACTIVE_STRESS_REPLACEMENT_PHASE4B_SELECTED_BACKEND,
  LAND_ACTIVE_STRESS_REPLACEMENT_PHASE4B_SELECTED_CANDIDATE_ID,
  runLandActiveStressReplacementReadinessReport,
} from "@/engine/myocardium/protocols/landActiveStressReplacementReadiness";
import {
  loadLandActiveStressReplacementValidationInput,
  validateLandActiveStressReplacementReadiness,
  type LandActiveStressReplacementValidationInput,
  type TextFileInput,
} from "@/tools/myocardium/verifyLandActiveStressReplacement";

describe("myocardium Phase 4B-A Land active-stress replacement readiness", () => {
  it("passes the current shadow readiness artifacts without runtime replacement claims", () => {
    const input = fixture();
    const validation = validateLandActiveStressReplacementReadiness(input);
    const report = runLandActiveStressReplacementReadinessReport();
    const serialized = JSON.stringify({ descriptor: protocolDescriptor, report });

    expect(validation.pass).toBe(true);
    expect(validation.errors).toEqual([]);
    expect(protocolDescriptor.protocolSetId).toBe(LAND_ACTIVE_STRESS_REPLACEMENT_PHASE4B_PROTOCOL_SET_ID);
    expect(protocolDescriptor.statusBoundary).toBe(LAND_ACTIVE_STRESS_REPLACEMENT_PHASE4B_CLAIM_BOUNDARY);
    expect(protocolDescriptor.selectedBackend).toBe(LAND_ACTIVE_STRESS_REPLACEMENT_PHASE4B_SELECTED_BACKEND);
    expect(protocolDescriptor.selectedCandidateId).toBe(
      LAND_ACTIVE_STRESS_REPLACEMENT_PHASE4B_SELECTED_CANDIDATE_ID,
    );
    expect(report.readinessPass).toBe(true);
    expect(report.sections).toHaveLength(5);
    expect(report.sections.every((section) => section.status === "readiness-pass")).toBe(true);
    expect(report.morphologyProxy.morphologyProxyOutcome).toBe("proxy-ready");
    expect(report.prescribedCaBeatStability.stateCarryPolicy).toBe(
      "state-carry-chained-cycle-runs",
    );
    expect(report.prescribedCaBeatStability.preconditioningCycles).toBe(6);
    expect(report.prescribedCaBeatStability.warmupCycles).toBe(1);
    expect(report.prescribedCaBeatStability.evaluatedCycles).toHaveLength(3);
    expect(report.prescribedCaBeatStability.warmupCycle.cycleIndex).toBe(6);
    expect(report.prescribedCaBeatStability.evaluatedCycles.map((cycle) => cycle.cycleIndex)).toEqual([7, 8, 9]);
    expect(report.prescribedCaBeatStability.alternansPatternDetected).toBe(false);
    expect(report.prescribedCaBeatStability.driftRelativeTolerance).toBe(0.05);
    expect(report.prescribedCaBeatStability.alternansRelativeTolerance).toBe(0.01);
    expect(report.prescribedCaBeatStability.alternansRelativeTolerance).toBeLessThan(
      report.prescribedCaBeatStability.driftRelativeTolerance,
    );
    expect(
      Math.max(
        ...report.prescribedCaBeatStability.cycleToCyclePeakStressRelativeDeltas,
        ...report.prescribedCaBeatStability.cycleToCyclePeakPressureRelativeDeltas,
        ...report.prescribedCaBeatStability.cycleToCycleStrokeProxyRelativeDeltas,
      ),
    ).toBeLessThanOrEqual(0.05);
    expect(report.prescribedCaBeatStability.maxCycleToCycleRelativeDelta).toBeLessThanOrEqual(0.05);
    expect(report.executableCoordinatePath.currentExecutableKinematicsModelId).toBe(
      LAND_ACTIVE_STRESS_REPLACEMENT_PHASE4B_EXECUTABLE_KINEMATICS_MODEL_ID,
    );
    expect(serialized).not.toMatch(
      /\bmorphologyPass\b|\bofficialMorphologyPass\b|\bproductionMechanicsPass\b|\bvalidationPass\b|\bofficialCaseWired\b/i,
    );
  });

  it("fails when Decision 19 accepted owner selection is missing", () => {
    const input = fixture();
    input.ownerSelection.status = "PENDING OWNER";
    input.ownerSelection.selectedCandidateId = "triseg-lite-compatible";

    const validation = validateLandActiveStressReplacementReadiness(input);

    expect(validation.pass).toBe(false);
    expect(validation.errors.some((issue) => issue.code === "phase4b_decision19_owner_selection")).toBe(true);
  });

  it("fails hollow prescribed-Ca beat-stability metrics", () => {
    const input = fixture();
    input.report.prescribedCaBeatStability.evaluatedCycles = [];
    input.report.prescribedCaBeatStability.preconditioningCycles = 0;
    input.report.prescribedCaBeatStability.stateCarryPolicy = "fixed-initial-condition-repeat";
    input.report.prescribedCaBeatStability.cycleToCyclePeakStressRelativeDeltas = [];
    input.report.prescribedCaBeatStability.cycleToCyclePeakPressureRelativeDeltas = [];
    input.report.prescribedCaBeatStability.cycleToCycleStrokeProxyRelativeDeltas = [];
    input.report.prescribedCaBeatStability.smokeReady = false;

    const validation = validateLandActiveStressReplacementReadiness(input);

    expect(validation.pass).toBe(false);
    expect(validation.errors.some((issue) => issue.code === "phase4b_beat_stability_hollow")).toBe(true);
  });

  it("fails official morphology pass overclaims", () => {
    const input = fixture();
    input.report.officialMorphologyPass = true;
    input.descriptor.morphologyPass = true;

    const validation = validateLandActiveStressReplacementReadiness(input);

    expect(validation.pass).toBe(false);
    expect(validation.errors.some((issue) => issue.code === "phase4b_forbidden_claim")).toBe(true);
  });

  it("fails when Phase 4B identifiers leak into runtime or official-case targets", () => {
    const input = fixture();
    input.runtimeIntegrationFiles = [
      {
        path: "engine/ModelCore.ts",
        text: "const id = 'land-active-stress-replacement-phase4b-protocols-v1';",
      },
      {
        path: "officialCases.ts",
        text: "const productionMechanicsEnabled = true;",
      },
    ];

    const validation = validateLandActiveStressReplacementReadiness(input);

    expect(validation.pass).toBe(false);
    expect(validation.errors.some((issue) => issue.code === "phase4b_runtime_leak")).toBe(true);
  });

  it("fails when the thick-sphere-v2 naming gap disclosure is missing", () => {
    const input = fixture();
    delete input.descriptor.executableCoordinatePath.namingGapDisclosure;
    input.descriptor.executableCoordinatePath.currentExecutableKinematicsModelId = "thick-sphere-v2";

    const validation = validateLandActiveStressReplacementReadiness(input);

    expect(validation.pass).toBe(false);
    expect(validation.errors.some((issue) => issue.code === "phase4b_naming_gap_disclosure")).toBe(true);
  });

  it("fails when the future TriSeg path is missing", () => {
    const input = fixture();
    delete input.descriptor.futureTriSegPath;

    const validation = validateLandActiveStressReplacementReadiness(input);

    expect(validation.pass).toBe(false);
    expect(validation.errors.some((issue) => issue.code === "phase4b_future_triseg_path")).toBe(true);
  });

  it("keeps ActiveStressChamberModel out of the Phase 3C core protocol file", () => {
    const phase3CText = readFileSync(
      path.join(process.cwd(), "engine/myocardium/protocols/minimalLoadedAfterloadFamily.ts"),
      "utf8",
    );

    expect(phase3CText).not.toMatch(/ActiveStressChamberModel|legacyActiveStress|oldActiveStress/);
    expect(phase3CText).not.toMatch(
      /\bfrom\s+["']@\/engine\/(?:ModelCore|chambers|harness|runtime|protocol|stateContract|core\/stateLayout)/m,
    );
  });
});

type MutableValidationInput = LandActiveStressReplacementValidationInput & {
  descriptor: Record<string, any>;
  ownerSelection: Record<string, any>;
  phase4ADossier: Record<string, any>;
  report: any;
  runtimeIntegrationFiles: TextFileInput[];
  docs: TextFileInput[];
};

function fixture(): MutableValidationInput {
  const input = loadLandActiveStressReplacementValidationInput(process.cwd());
  return {
    descriptor: clone(input.descriptor),
    ownerSelection: clone(input.ownerSelection),
    phase4ADossier: clone(input.phase4ADossier),
    report: clone(input.report),
    runtimeIntegrationFiles: input.runtimeIntegrationFiles.map((file) => ({ ...file })),
    docs: input.docs.map((file) => ({ ...file })),
    phase3CProtocolText: { ...input.phase3CProtocolText },
  };
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
