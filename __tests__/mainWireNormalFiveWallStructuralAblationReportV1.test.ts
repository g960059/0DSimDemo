import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const REPORT_PATH = new URL(
  "../data/myocardium/reports/mainwire-normal-five-wall-structural-ablation-v1.json",
  import.meta.url,
);

describe("main-wire normal five-wall structural ablation report V1", () => {
  it("keeps the executable reproduction boundary aligned with the minimal core", () => {
    const report = JSON.parse(readFileSync(REPORT_PATH, "utf8")) as any;

    expect(report.schemaVersion).toBe(1);
    expect(report.protocol.circulation)
      .toBe("main-wire-derived-noncoronary-experimental");
    expect(report.protocol.parameterSearch).toBe(false);
    expect(report.structuralDecisions.sharedLongAxisQ.decision)
      .toBe("reject-from-canonical-core");
    expect(report.structuralDecisions.directChamberPriorColdStart.decision)
      .toBe("reject-and-remove");
    expect(report.structuralDecisions.directChamberPriorColdStart.solverRescueAdded)
      .toBe(false);
    expect(report.structuralDecisions.valveHydraulics.acceptedValveMemory)
      .toBe("leafletOpeningFraction01-only");
    expect(report.structuralDecisions.valveHydraulics.valveFlowPersistedAsState)
      .toBe(false);
    expect(report.structuralDecisions.leftAtrialParallelSls.on.laPvSelfIntersectionCount)
      .toBe(1);
    expect(report.structuralDecisions.leftAtrialParallelSls.laExactOff
      .laPvSelfIntersectionCount).toBeGreaterThan(1);
    expect(report.structuralDecisions.crossWallParallelSlsFixedAblation.decision)
      .toBe("retain-one-state-per-wall-with-unvalidated-cross-wall-prior");
    expect(report.acceptanceBoundary.periodicSteadyStateClaimed).toBe(false);
    expect(report.acceptanceBoundary.browserRuntimeReplacementClaimed).toBe(false);

    for (const command of [
      report.reproduction.canonicalCommand,
      report.reproduction.laSlsExactOffCommand,
    ]) {
      expect(command).toContain("--mode canonical");
      expect(command).not.toContain("q-off-canonical");
      expect(command).toContain("--beats 8 --dt 0.002");
    }
    for (const key of [
      "canonicalRawSha256",
      "canonicalSummarySha256",
      "laSlsExactOffRawSha256",
      "laSlsExactOffSummarySha256",
    ]) expect(report.reproduction[key]).toMatch(/^[0-9a-f]{64}$/);
  });
});
