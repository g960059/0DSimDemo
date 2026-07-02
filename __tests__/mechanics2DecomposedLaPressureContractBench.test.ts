import { beforeAll, describe, expect, it } from "vitest";
import { expectMechanics2ReportArtifactParity } from "@/__tests__/helpers/mechanics2ReportParity";
import {
  runDecomposedLaPressureContractBenchV1,
  type DecomposedLaPressureContractReportV1,
} from "@/engine/mechanics2/benches/DecomposedLaPressureContractBench";
import decomposedLaPressureReport
  from "@/data/mechanics2/reports/decomposed-la-pressure-contract-report-v1.json";

describe("DecomposedLaPressureContractBench V1", () => {
  let report: DecomposedLaPressureContractReportV1;

  beforeAll(() => {
    report = runDecomposedLaPressureContractBenchV1();
  }, 480_000);

  it("records a focused LA pressure-contract shadow signal without source substitution", () => {
    expect(report.upstreamAttribution.observedStatus).toBe("la-pressure-parity-attribution-signal");
    expect(report.contractMode).toBe("shadow-filling-baseline-plus-normalized-fiber-active-pulse");
    expect(report.decision.decomposedLaPressureContractStatus)
      .toBe("decomposed-la-pressure-contract-focused-shadow-signal");
    expect(report.summary).toMatchObject({
      total: 7,
      pass: 4,
      fail: 3,
      focusedResidualPass: 3,
    });
    expect(report.summary.meanRawFiberDeltaMmHg).toBeGreaterThan(8);
    expect(report.summary.meanDecomposedDeltaMmHg).toBeLessThan(0.3);
    expect(report.summary.meanImprovementFraction).toBeGreaterThan(0.96);
  });

  it("passes the three focused residual rows but keeps non-focused late-peak residuals visible", () => {
    const passing = new Set(report.rows.filter((row) => row.status === "pass").map((row) => row.profileId));
    expect(passing).toEqual(new Set([
      "preload-low",
      "preload-high",
      "afterload-high",
      "contractility-low",
    ]));
    const focused = report.rows.filter((row) =>
      ["preload-high", "afterload-high", "contractility-low"].includes(row.profileId)
    );
    expect(focused.every((row) => row.status === "pass")).toBe(true);
    const failed = report.rows.filter((row) => row.status === "fail");
    expect(failed.map((row) => row.profileId)).toEqual([
      "normal-hr75",
      "normal-hr90",
      "contractility-high",
    ]);
    expect(failed.every((row) => row.failureReasons.includes("decomposed-late-peak-phase-offset"))).toBe(true);
  });

  it("keeps source substitution, runtime, morphology, AV-plane, and LandAtrial locked", () => {
    expect(report.decision.blockedClaims).toContain("source-surface-substitution");
    expect(report.claimBoundary.sourceSurfaceSubstitution).toBe(false);
    expect(report.claimBoundary.runtimeWiring).toBe(false);
    expect(report.claimBoundary.morphologyAcceptance).toBe(false);
    expect(report.claimBoundary.AVPlaneGeometry).toBe(false);
    expect(report.claimBoundary.pistonVolumeMode).toBe(false);
    expect(report.claimBoundary.LandAtrialUnlock).toBe(false);
  });

  it("keeps the committed decomposed pressure artifact fully aligned with the rerun report", () => {
    expectMechanics2ReportArtifactParity(decomposedLaPressureReport, report);
  });
});
