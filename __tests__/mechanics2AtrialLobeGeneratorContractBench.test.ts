import { beforeAll, describe, expect, it } from "vitest";
import { expectMechanics2ReportArtifactParity } from "@/__tests__/helpers/mechanics2ReportParity";
import {
  runAtrialLobeGeneratorContractBenchV1,
  type AtrialLobeGeneratorContractReportV1,
} from "@/engine/mechanics2/benches/AtrialLobeGeneratorContractBench";
import lobeGeneratorReport
  from "@/data/mechanics2/reports/atrial-lobe-generator-contract-report-v1.json";

describe("AtrialLobeGeneratorContractBench V1", () => {
  let report: AtrialLobeGeneratorContractReportV1;

  beforeAll(() => {
    report = runAtrialLobeGeneratorContractBenchV1();
  }, 600_000);

  it("classifies simple display-piston and phase-pressure oracles as insufficient", () => {
    expect(report.decision.atrialLobeGeneratorStatus)
      .toBe("atrial-lobe-generator-contract-mixed");
    expect(report.summary).toMatchObject({
      totalProfiles: 7,
      bestVariantId: "blood-volume-fiber-pressure",
      bestPass: 2,
      bestLobeQualityPass: 2,
      bestOpposedLobeCount: 2,
      bestHiddenBloodVolumeCleanCount: 7,
    });
    expect(report.bestVariant).toMatchObject({
      variantId: "blood-volume-fiber-pressure",
      pass: 2,
      selfIntersectionCount: 7,
      opposedLobeCount: 2,
      hiddenBloodVolumeCleanCount: 7,
      maxALoopArea: 82.585179,
      maxVLoopArea: 9.90639,
      maxVolumeSeparationMl: 17.603197,
    });
  });

  it("shows piston display volume does not increase lobe-quality pass count", () => {
    const pistonFiber = report.variantSummaries.find((variant) =>
      variant.variantId === "piston-display-volume-fiber-pressure-gain18"
    );
    expect(pistonFiber).toMatchObject({
      pass: 2,
      lobeQualityPass: 2,
      selfIntersectionCount: 7,
      opposedLobeCount: 2,
      hiddenBloodVolumeCleanCount: 7,
      meanMaxDisplayVolumeDeltaMl: 17.998078,
    });
  });

  it("keeps runtime, AV-plane enablement, blood-ledger mutation, and LandAtrial blocked", () => {
    expect(report.decision.blockedClaims).toEqual(expect.arrayContaining([
      "runtime-wiring",
      "morphology-acceptance",
      "AV-plane-enable",
      "a-prime-physiology",
      "blood-ledger-mutation",
      "LandAtrial-unlock",
    ]));
    expect(report.claimBoundary.runtimeWiring).toBe(false);
    expect(report.claimBoundary.morphologyAcceptance).toBe(false);
    expect(report.claimBoundary.AVPlaneEnablement).toBe(false);
    expect(report.claimBoundary.aPrimePhysiologyClaim).toBe(false);
    expect(report.claimBoundary.bloodLedgerMutation).toBe(false);
    expect(report.claimBoundary.LandAtrialUnlock).toBe(false);
  });

  it("keeps the committed atrial lobe-generator artifact aligned", () => {
    expectMechanics2ReportArtifactParity(lobeGeneratorReport, report);
  });
});
