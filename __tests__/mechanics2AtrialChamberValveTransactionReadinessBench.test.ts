import { beforeAll, describe, expect, it } from "vitest";
import { expectMechanics2ReportArtifactParity } from "@/__tests__/helpers/mechanics2ReportParity";
import {
  runAtrialChamberValveTransactionReadinessBenchV1,
  type AtrialChamberValveTransactionReadinessReportV1,
} from "@/engine/mechanics2/benches/AtrialChamberValveTransactionReadinessBench";
import readinessReport
  from "@/data/mechanics2/reports/atrial-chamber-valve-transaction-readiness-report-v1.json";

describe("AtrialChamberValveTransactionReadinessBench V1", () => {
  let report: AtrialChamberValveTransactionReadinessReportV1;

  beforeAll(() => {
    report = runAtrialChamberValveTransactionReadinessBenchV1();
  }, 600_000);

  it("blocks atrial transaction readiness on the four measured owners", () => {
    expect(report.readiness.status).toBe("atrial-chamber-valve-transaction-blocked");
    expect(report.summary).toMatchObject({
      requiredOwnerCount: 4,
      currentPressureLobeQualityPass: 0,
      atrialFiberLobeQualityPass: 1,
      statefulLaSourceSurfacePass: 1,
      statefulLaContractPass: 0,
      avValveBestFixedPass: 4,
      avValveBestOraclePass: 14,
      avPlaneReadbackCount: 2,
      avPlaneEnabledCount: 0,
      aPrimeReadbackPresentCount: 0,
    });
    expect(report.readiness.requiredOwners).toEqual([
      "atrial-pv-figure-eight-lobe-quality",
      "stateful-atrial-chamber-pressure-volume-contract",
      "same-step-av-valve-pressure-flow-energy-contract",
      "av-plane-position-velocity-readbacks",
    ]);
  });

  it("keeps AV-plane/a-prime as disabled readbacks, not model enablement", () => {
    expect(report.evidence.avPlaneReadbacks).toHaveLength(2);
    expect(report.evidence.avPlaneReadbacks.every((readback) =>
      readback.readbackStatus === "disabled-placeholder-no-velocity-claim"
      && readback.hiddenBloodVolumeSourceMl === 0
      && readback.aPrimeProxyCmPerSec == null
    )).toBe(true);
    expect(report.decision.blockedClaims).toContain("AV-plane-enable");
    expect(report.decision.blockedClaims).toContain("a-prime-readback");
    expect(report.claimBoundary.AVPlaneEnablement).toBe(false);
    expect(report.claimBoundary.aPrimeReadback).toBe(false);
  });

  it("keeps the committed atrial transaction readiness artifact aligned", () => {
    expectMechanics2ReportArtifactParity(readinessReport, report);
  });
});
