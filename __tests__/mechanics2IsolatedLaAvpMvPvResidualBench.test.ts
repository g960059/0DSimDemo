import { beforeAll, describe, expect, it } from "vitest";

import { expectMechanics2ReportArtifactParity } from "@/__tests__/helpers/mechanics2ReportParity";
import {
  runIsolatedLaAvpMvPvResidualBenchV1,
  type IsolatedLaAvpMvPvResidualReportV1,
} from "@/engine/mechanics2/benches/IsolatedLaAvpMvPvResidualBench";
import isolatedLaAvpMvPvResidualReport
  from "@/data/mechanics2/reports/isolated-la-avp-mv-pv-residual-report-v1.json";

describe("IsolatedLaAvpMvPvResidualBench V1", () => {
  let report: IsolatedLaAvpMvPvResidualReportV1;

  beforeAll(() => {
    report = runIsolatedLaAvpMvPvResidualBenchV1();
  }, 600_000);

  it("keeps the isolated LA-AV-plane residual as mixed evidence rather than an enablement path", () => {
    expect(report.summary).toMatchObject({
      totalProfiles: 7,
      bestResidualVariantId: "residual-drive8-cap36-hyd004",
      bestResidualFigureEightPass: 0,
      bestResidualSourcePreservingFigureEight: 0,
      bestResidualMvfClean: 3,
      bestResidualPrimePass: 0,
      variantsWithAnySourcePreservingFigureEight: 0,
      variantsWithCleanHiddenVolume: 0,
      reviewStatus: "la-avp-residual-mixed",
    });
    expect(report.bestResidualVariant).toMatchObject({
      variantId: "residual-drive8-cap36-hyd004",
      figureEightPass: 0,
      sourcePreservingFigureEight: 0,
      hiddenVolumeClean: 6,
      mvfClean: 3,
      primePass: 0,
    });
    const bestNormalForm = report.variantSummaries
      .filter((summary) => summary.variantId.startsWith("normal-form-"))
      .sort((a, b) =>
        b.sourceBoundaryClean - a.sourceBoundaryClean
        || b.mvfClean - a.mvfClean
        || b.maxVLoopArea - a.maxVLoopArea
      )[0]!;
    expect(bestNormalForm).toMatchObject({
      variantId: "normal-form-r10-b2-release045-cap40",
      figureEightPass: 0,
      sourcePreservingFigureEight: 0,
      sourceBoundaryClean: 7,
      hiddenVolumeClean: 6,
      mvfClean: 3,
    });
  });

  it("classifies the remaining blocker as phase-oriented blood-volume PV plus source/MVF hygiene", () => {
    const bestRows = report.rows.filter((row) => row.variantId === report.summary.bestResidualVariantId);
    expect(bestRows).toHaveLength(7);
    expect(bestRows.some((row) => row.figureEight.failureReasons.includes("mv-opening-conduit-not-pressure-downward")))
      .toBe(true);
    expect(bestRows.some((row) => row.figureEight.failureReasons.includes("mv-opening-conduit-not-volume-leftward")))
      .toBe(true);
    expect(bestRows.some((row) => row.failureReasons.includes("source-boundary-not-clean")))
      .toBe(true);
    expect(bestRows.some((row) => row.failureReasons.includes("mass-ledger-residual")))
      .toBe(true);
  });

  it("keeps runtime and acceptance claims blocked", () => {
    expect(report.decision.nextAction).toContain("stronger implicit residual");
    expect(report.decision.blockedClaims).toEqual(expect.arrayContaining([
      "runtime-wiring",
      "morphology-acceptance",
      "AV-plane-enable",
      "pressure-substitution",
      "LandAtrial-unlock",
    ]));
    expect(report.claimBoundary.runtimeWiring).toBe(false);
    expect(report.claimBoundary.morphologyAcceptance).toBe(false);
    expect(report.claimBoundary.AVPlaneEnablement).toBe(false);
    expect(report.claimBoundary.pressureSubstitution).toBe(false);
    expect(report.claimBoundary.LandAtrialUnlock).toBe(false);
  });

  it("keeps the committed isolated residual artifact aligned", () => {
    expectMechanics2ReportArtifactParity(isolatedLaAvpMvPvResidualReport, report);
  });
});
