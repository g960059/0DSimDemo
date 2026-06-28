import resultArtifact from "@/data/myocardium/protocols/myocardium-developer-only-lv-land-envelope-phase5w-result-v1.json";
import { validateDeveloperOnlyLvLandEnvelopePhase5W } from "@/tools/myocardium/verifyDeveloperOnlyLvLandEnvelopePhase5W";
import { describe, expect, it } from "vitest";

describe("myocardium Phase 5W developer-only LV Land envelope", () => {
  it("records a diagnostic developer-only envelope without production replacement", () => {
    expect(resultArtifact.id).toBe("myocardium-developer-only-lv-land-envelope-phase5w-result-v1");
    expect(resultArtifact.phase).toBe("Phase 5W");
    expect(resultArtifact.claimBoundary).toBe("developer-only-lv-land-envelope-expansion-diagnostic-only");
    expect(resultArtifact.summary.productionReplacementReadiness).toBe("not-ready-diagnostic-envelope-only");
    expect(resultArtifact.boundary.noRuntimeReplacement).toBe(true);
    expect(resultArtifact.boundary.noOfficialCaseReauthoring).toBe(true);
    expect(resultArtifact.boundary.noWorkbenchRuntimeWiring).toBe(true);
    expect(resultArtifact.boundary.noStateSchemaMigration).toBe(true);
  });

  it("covers HR75/90 x TBV 4350/5600/6600 for stock and developer-only Land", () => {
    expect(resultArtifact.protocol.modelPathIds).toEqual([
      "stock-active-no-provider-v0",
      "developer-only-lv-land-v0",
    ]);
    expect(resultArtifact.protocol.points.map((point) => point.id)).toEqual([
      "hr75-tbv4350-low-edge",
      "hr75-tbv5600-main",
      "hr75-tbv6600-main-high",
      "hr90-tbv4350-low-edge",
      "hr90-tbv5600-main",
      "hr90-tbv6600-main-high",
    ]);
    expect(resultArtifact.runs).toHaveLength(12);
    expect(resultArtifact.comparisons).toHaveLength(6);
    expect(resultArtifact.runHealth.mainDomainLandRunCount).toBe(4);
    expect(resultArtifact.runHealth.mainDomainLandSettledCount).toBe(4);
    expect(resultArtifact.protocol.settleSampleHz).toBe(240);
    expect(resultArtifact.protocol.requestedMeasurementSampleHz).toBe(240);
    expect(resultArtifact.protocol.measurementSampleHz).toBe(1000);
    expect(resultArtifact.protocol.capTailMeasurementSampleHz).toBe(1000);
  });

  it("keeps paired closure invariants and period-aware windows", () => {
    for (const comparison of resultArtifact.comparisons) {
      expect(comparison.sameClosureInvariant).toBe(true);
      expect(comparison.landSourceAndCommitPresent).toBe(true);
      expect(comparison.landSolveFailureCount).toBe(0);
    }
    for (const run of resultArtifact.runs) {
      expect([3, 4]).toContain(run.window.measureBeats);
      expect([1, 2]).toContain(run.window.metricWindowBeats);
      if (run.periodBeats === 2) {
        expect(run.window.measureBeats).toBe(4);
        expect(run.window.metricWindowBeats).toBe(2);
      }
      if (run.periodBeats === 1) {
        expect(run.window.measureBeats).toBe(3);
        expect(run.window.metricWindowBeats).toBe(1);
      }
      if (run.modelPathId === "developer-only-lv-land-v0") {
        expect(run.providerInstrumentation?.sourceActiveStressCallCount).toBeGreaterThan(0);
        expect(run.providerInstrumentation?.commitProviderStateAfterStepCount).toBeGreaterThan(0);
        expect(run.providerInstrumentation?.landSolveFailureCount).toBe(0);
      }
    }
  });

  it("passes the verifier in non-rebuild mode", () => {
    const report = validateDeveloperOnlyLvLandEnvelopePhase5W(process.cwd(), { rebuildEvidence: false });
    expect(report.pass).toBe(true);
    expect(report.errors).toEqual([]);
    expect(report.warnings.map((warning) => warning.code)).toEqual(
      expect.arrayContaining([
        "phase5w_main_domain_period2_present",
        "phase5w_rebuild_not_run_by_default",
        "phase5w_developer_only_not_runtime_acceptance",
      ]),
    );
  });
});
