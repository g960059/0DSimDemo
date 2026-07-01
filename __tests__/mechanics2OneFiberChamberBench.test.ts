import { describe, expect, it } from "vitest";
import { buildExistingValveAuditV1 } from "@/engine/mechanics2/audits/ExistingValveAuditV1";
import {
  runOneFiberChamberPrescribedVolumeBenchV1,
} from "@/engine/mechanics2/benches/OneFiberChamberPrescribedVolumeBench";
import {
  REQUIRED_ONE_FIBER_CHAMBER_FIXTURE_IDS_V1,
  buildPrescribedVolumeFixturesV1,
  validatePrescribedVolumeFixtureV1,
} from "@/engine/mechanics2/fixtures/PrescribedVolumeFixtureV1";
import { computeShapeQualityMetricsV1 } from "@/engine/mechanics2/metrics/ShapeQualityMetricsV1";
import chamberReport from "@/data/mechanics2/reports/one-fiber-chamber-prescribed-volume-report-v1.json";
import valveAuditReport from "@/data/mechanics2/reports/existing-valve-audit-v1.json";

describe("MechanicsCore2 OneFiberChamber prescribed-volume bench", () => {
  it("keeps the prescribed-volume fixture contract explicit", () => {
    const fixtures = buildPrescribedVolumeFixturesV1();
    expect(fixtures.map((fixture) => fixture.fixtureId)).toEqual([...REQUIRED_ONE_FIBER_CHAMBER_FIXTURE_IDS_V1]);
    for (const fixture of fixtures) {
      expect(validatePrescribedVolumeFixtureV1(fixture)).toEqual([]);
      expect(fixture.annotation.morphologyProfileId).toBe("normal_sinus_default");
      expect(fixture.wallVolumeMl).toBeGreaterThan(0);
      expect(fixture.referenceCavityVolumeMl).toBeGreaterThan(0);
    }
  });

  it("reports a bounded prescribed-volume pressure mapping signal without runtime claims", () => {
    const report = runOneFiberChamberPrescribedVolumeBenchV1();
    expect(report.summary).toMatchObject({
      total: 4,
      pass: 4,
      fail: 0,
      inconclusive: 0,
    });
    expect(report.upstreamReplayGate).toMatchObject({
      observedStatus: "go",
      mayProceedObserved: true,
    });
    expect(report.decision.mayProceedToLeftHeartStrategicGate).toBe(true);
    expect(report.decision.mayProceedToValveBench).toBe(true);
    expect(report.claimBoundary.runtimeWiring).toBe(false);
    expect(report.claimBoundary.closedLoopMorphologyAcceptance).toBe(false);

    const lv = report.fixtureResults.find((result) => result.fixtureId === "onefiber-lv-normal-volume")!;
    const rv = report.fixtureResults.find((result) => result.fixtureId === "onefiber-rv-normal-volume")!;
    expect(lv.pressurePeakMmHg).toBeGreaterThan(90);
    expect(lv.pressurePeakMmHg).toBeLessThan(160);
    expect(rv.pressurePeakMmHg).toBeGreaterThan(20);
    expect(rv.pressurePeakMmHg).toBeLessThan(50);
    for (const result of report.fixtureResults) {
      expect(result.status).toBe("pass");
      expect(result.pressureShape.dominantPeakCount).toBe(1);
      expect(result.pressureShape.c1ContinuityScore).toBeLessThan(0.24);
      expect(result.maxAbsDPDVmmHgPerMl).toBeGreaterThan(0);
    }
  });

  it("fails closed when prescribed-volume fixture IDs are duplicated", () => {
    const fixtures = buildPrescribedVolumeFixturesV1();
    const report = runOneFiberChamberPrescribedVolumeBenchV1([...fixtures, fixtures[0]!]);
    expect(report.decision.mayProceedToLeftHeartStrategicGate).toBe(false);
    expect(report.decision.mayProceedToValveBench).toBe(false);
    expect(report.decision.reason).toContain("Duplicate prescribed-volume fixtures");
  });

  it("keeps the committed result artifact aligned with the rerun summary", () => {
    const report = runOneFiberChamberPrescribedVolumeBenchV1();
    expect(chamberReport.reportId).toBe(report.reportId);
    expect(chamberReport.summary).toEqual(report.summary);
    expect(chamberReport.decision).toEqual(report.decision);
    expect(typeof chamberReport.normalizedSha256).toBe("string");
    expect(chamberReport.normalizedSha256).toHaveLength(64);
  });

  it("audits existing valve q-state/loss semantics without changing runtime valves", () => {
    const report = buildExistingValveAuditV1();
    expect(report.valveParameters.map((valve) => valve.valveId)).toEqual(["MV", "AoV", "TV", "PV"]);
    expect(report.valveParameters.every((valve) =>
      valve.aRefCm2 > 0
      && valve.aMaxCm2 > 0
      && valve.tauOpenSec > 0
      && valve.tauCloseSec > 0
      && valve.resistanceMmHgSecPerMl > 0
      && valve.inertanceMmHgSec2PerMl > 0
    )).toBe(true);
    expect(report.claimBoundary.noRuntimeChange).toBe(true);
    expect(valveAuditReport.valveParameters).toEqual(report.valveParameters);
  });

  it("calibrates sharpness metrics against flat segments instead of treating silence as a spike", () => {
    const smoothDome = [
      ...Array.from({ length: 20 }, () => 0),
      ...Array.from({ length: 60 }, (_, i) => 0.5 - 0.5 * Math.cos(2 * Math.PI * i / 59)),
      ...Array.from({ length: 20 }, () => 0),
    ];
    const metrics = computeShapeQualityMetricsV1(smoothDome);
    expect(metrics.dominantPeakCount).toBe(1);
    expect(metrics.c1ContinuityScore).toBeLessThan(0.12);
    expect(metrics.dYdtSpikeRatio).toBeLessThan(4);
  });
});
