import { describe, expect, it } from "vitest";

import {
  LA_EFFECTIVE_CAVITY_SIGN_AUDIT_REPORT_ID_V1,
  runLAEffectiveCavitySignAuditBenchV1,
} from "@/engine/mechanics2/benches/LAEffectiveCavitySignAuditBench";

describe("LAEffectiveCavitySignAuditBenchV1", () => {
  const report = runLAEffectiveCavitySignAuditBenchV1();

  it("records a diagnostic-only LA effective cavity sign audit", () => {
    expect(report.reportId).toBe(LA_EFFECTIVE_CAVITY_SIGN_AUDIT_REPORT_ID_V1);
    expect(report.mode).toBe("diagnostic-only-no-runtime-la-effective-cavity-sign-audit");
    expect(report.rows.length).toBeGreaterThanOrEqual(42);
    expect(report.claimBoundary.runtimeWiring).toBe(false);
    expect(report.claimBoundary.morphologyAcceptance).toBe(false);
    expect(report.claimBoundary.bloodVolumePvRemainsAuthoritative).toBe(true);
    expect(report.claimBoundary.capacityAxisIsShadowOnly).toBe(true);
  });

  it("shows the current reference/capacity mechanism has the pressure-lowering sign at fixed blood volume", () => {
    expect(report.summary.avPlanePositivePressureSourceRows).toBe(0);
    expect(report.summary.counterfactualSignCorrectRows).toBeGreaterThan(0);
    expect(report.summary.appliedSignCorrectRows).toBeGreaterThan(0);
    expect(report.summary.maxCounterfactualPressureReliefMmHg).toBeGreaterThan(2);
    expect(report.summary.maxAppliedPressureReliefMmHg).toBeGreaterThan(2);
    expect(report.rows.every((row) => row.fixedVolumeCounterfactualPass)).toBe(true);
    expect(report.rows.every((row) => row.fixedVolumeProbePass)).toBe(true);
  });

  it("keeps V8 as counterfactual-only pressure relief and V9/V10 as applied pressure relief", () => {
    const v8Rows = report.rows.filter((row) => row.traceRole === "bestV8ReferenceCapacityVenous");
    const v9Rows = report.rows.filter((row) => row.traceRole === "bestV9DynamicReferencePressure");
    const v10Rows = report.rows.filter((row) => row.traceRole === "bestV10SeparatedCapacity");
    expect(v8Rows).toHaveLength(7);
    expect(v9Rows).toHaveLength(7);
    expect(v10Rows).toHaveLength(7);
    expect(v8Rows.every((row) => row.maxAvPlaneReferenceCapacityMl > 10)).toBe(true);
    expect(v8Rows.every((row) => row.maxPressureReferenceCapacityMl === 0)).toBe(true);
    expect(v8Rows.every((row) => row.fixedVolumeProbeMaxPressureReliefMmHg === 0)).toBe(true);
    expect(v8Rows.every((row) => row.fixedVolumeCounterfactualMaxPressureReliefMmHg > 1.8)).toBe(true);
    expect(Math.max(...v8Rows.map((row) => row.fixedVolumeCounterfactualMaxPressureReliefMmHg)))
      .toBeGreaterThan(2);
    expect(v9Rows.every((row) => row.maxPressureReferenceCapacityMl > 10)).toBe(true);
    expect(v9Rows.every((row) => row.fixedVolumeProbeMaxPressureReliefMmHg > 1.8)).toBe(true);
    expect(Math.max(...v9Rows.map((row) => row.fixedVolumeProbeMaxPressureReliefMmHg)))
      .toBeGreaterThan(2);
    expect(v10Rows.every((row) => row.maxPressureReferenceCapacityMl > 10)).toBe(true);
    expect(v10Rows.every((row) => row.fixedVolumeProbeMaxPressureReliefMmHg > 2)).toBe(true);
  });

  it("does not promote capacity-axis or effective-cavity loops as strict blood-volume figure-eight morphology", () => {
    const v8Rows = report.rows.filter((row) => row.traceRole === "bestV8ReferenceCapacityVenous");
    const v9Rows = report.rows.filter((row) => row.traceRole === "bestV9DynamicReferencePressure");
    const v10Rows = report.rows.filter((row) => row.traceRole === "bestV10SeparatedCapacity");
    expect(v8Rows.every((row) => !row.bloodPvPhasePass)).toBe(true);
    expect(v9Rows.every((row) => !row.bloodPvPhasePass)).toBe(true);
    expect(v10Rows.every((row) => !row.bloodPvPhasePass)).toBe(true);
    expect(report.summary.capacityAxisPhaseRows).toBeGreaterThan(report.summary.strictBloodPhaseRows);
    expect(report.summary.capacityAxisHiddenRows).toBeGreaterThan(0);
    expect(report.summary.referenceCapacityStrictBloodPhaseAndC1Rows).toBe(0);
    expect(report.summary.reviewStatus).toBe("sign-correct-but-blood-loop-not-solved");
    expect(report.summary.nextOwner).toBe("accepted-state-la-wall-avplane-mv-pv-residual");
  });

  it("keeps hidden-volume and display filtering boundaries explicit", () => {
    expect(report.summary.hiddenVolumeCleanRows).toBe(report.summary.totalRows);
    const hiddenCapacityRows = report.rows.filter((row) => row.capacityAxisHiddenByStrictBloodGate);
    expect(hiddenCapacityRows.length).toBeGreaterThan(0);
    expect(hiddenCapacityRows.every((row) => row.failureReasons.includes("capacity-axis-hidden-by-strict-blood-gate")))
      .toBe(true);
    expect(report.decision.blockedClaims).toContain("capacity-axis-pv-acceptance");
    expect(report.decision.interpretation.join(" ")).toContain("Rows that only create a V-loop");
  });
});
