import resultArtifact from "@/data/myocardium/protocols/myocardium-developer-only-lv-land-runtime-flag-suite-result-v1.json";
import { validateDeveloperOnlyLvLandRuntimeFlagSuite } from "@/tools/myocardium/verifyDeveloperOnlyLvLandRuntimeFlagSuite";
import { describe, expect, it } from "vitest";

describe("myocardium Phase 5V developer-only LV Land runtime flag suite", () => {
  it("records developer-only measured evidence without production adoption", () => {
    expect(resultArtifact.id).toBe("myocardium-developer-only-lv-land-runtime-flag-suite-result-v1");
    expect(resultArtifact.phase).toBe("Phase 5V");
    expect(resultArtifact.claimBoundary).toBe("developer-only-runtime-flag-implementation-diagnostic-only");
    expect(resultArtifact.ownerGoScope.status).toBe("go-developer-only-implementation-only");
    expect(resultArtifact.ownerGoScope.productionRuntimeReplacement).toBe("no-go");
    expect(resultArtifact.implementationStatus.developerOnlyFlagPathImplemented).toBe(true);
    expect(resultArtifact.implementationStatus.productionRuntimeWiring).toBe("absent");
    expect(resultArtifact.implementationStatus.officialCaseWiring).toBe("absent");
    expect(resultArtifact.implementationStatus.workbenchRuntimeWiring).toBe("absent");
    expect(resultArtifact.implementationStatus.stateSchemaMigration).toBe("absent");
  });

  it("runs the fixed Phase 5S operating suite through the developer-only helper", () => {
    expect(resultArtifact.diagnosticProtocol.diagnosticDeltasMl).toEqual([-1250, 0, 1000]);
    expect(resultArtifact.diagnosticProtocol.mainDomainDeltasMl).toEqual([0, 1000]);
    expect(resultArtifact.runHealth.pointCount).toBe(3);
    expect(resultArtifact.runHealth.pointsSettledByConvergence).toBe(3);
    expect(resultArtifact.runHealth.landSolveFailureCount).toBe(0);
    expect(resultArtifact.runHealth.sourceCallsPresentEveryPoint).toBe(true);
    expect(resultArtifact.runHealth.commitCallsPresentEveryPoint).toBe(true);
    expect(resultArtifact.runHealth.mainDomainAllPeriod1).toBe(true);
    expect(resultArtifact.runHealth.allPointsReproducePhase5S).toBe(true);
    for (const point of resultArtifact.points) {
      expect(point.sourceProviderId).toContain("phase5u-developer-only-be-phase5q-calcium");
      expect(point.providerInstrumentation.sourceActiveStressCallCount).toBeGreaterThan(0);
      expect(point.providerInstrumentation.commitProviderStateAfterStepCount).toBeGreaterThan(0);
      expect(point.providerInstrumentation.landSolveFailureCount).toBe(0);
      expect(point.phase5SComparison.metricsNearPhase5S).toBe(true);
    }
  });

  it("passes the live verifier", () => {
    const report = validateDeveloperOnlyLvLandRuntimeFlagSuite(process.cwd());

    expect(report.errors).toEqual([]);
    expect(report.pass).toBe(true);
    expect(report.warnings.map((warning) => warning.code))
      .toContain("phase5v_developer_only_not_runtime_acceptance");
  });
});
