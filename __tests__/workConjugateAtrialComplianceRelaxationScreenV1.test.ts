import { describe, expect, it } from "vitest";

import { expectMechanics2ReportArtifactParity } from
  "@/__tests__/helpers/mechanics2ReportParity";
import artifact from
  "@/data/mechanics2/reports/work-conjugate-atrial-compliance-relaxation-screen-v1.json";
import {
  runWorkConjugateAtrialComplianceRelaxationScreenV1,
  type WorkConjugateAtrialComplianceRelaxationCaseV1,
} from
  "@/engine/mechanics2/benches/WorkConjugateAtrialComplianceRelaxationScreenV1";

describe("WorkConjugateAtrialComplianceRelaxationScreen V1", () => {
  const report = runWorkConjugateAtrialComplianceRelaxationScreenV1();

  it("runs a declared 3x3 passive-stress by active-relaxation screen", () => {
    expect(report.role).toBe("report-only-two-factor-mechanism-screen");
    expect(report.modelBoundary).toEqual({
      sidecar: "WorkConjugateAVPlaneLeftHeartV1",
      runtimeWiring: false,
      clinicalFit: false,
      atrialComplianceMeasurement: false,
    });
    expect(report.cases).toHaveLength(9);
    expect(new Set(report.cases.map((row) => row.laPassiveStressScale)))
      .toEqual(new Set([0.4, 0.7, 1]));
    expect(new Set(report.cases.map((row) => row.contractileOffRatePerSec)))
      .toEqual(new Set([20, 30, 50]));
    expect(caseByDose(1, 30).changedParameterPaths).toEqual([]);
    expect(caseByDose(0.4, 30).changedParameterPaths).toEqual([
      "params.laWall.axes.circumferential.passiveStressScaleKPa",
      "params.laWall.axes.longitudinal.passiveStressScaleKPa",
    ]);
    expect(caseByDose(1, 50).changedParameterPaths).toEqual([
      "activationModel.params.contractileKinetics.offRatePerSec",
    ]);
  });

  it("keeps local passive compliance distinct from active relaxation", () => {
    const lowPassive = caseByDose(0.4, 30);
    const baseline = caseByDose(1, 30);
    const fastRelaxation = caseByDose(1, 50);

    expect(lowPassive.fixedZPassiveComplianceReadback.role)
      .toBe("local-tangent-diagnostic-not-global-atrial-compliance");
    expect(lowPassive.fixedZPassiveComplianceReadback.complianceMlPerMmHg)
      .toBeGreaterThan(baseline.fixedZPassiveComplianceReadback.complianceMlPerMmHg);
    expect(caseByDose(0.4, 20).fixedZPassiveComplianceReadback)
      .toEqual(caseByDose(0.4, 50).fixedZPassiveComplianceReadback);
    expect(fastRelaxation.activationReadback.rt50Sec)
      .toBeLessThan(baseline.activationReadback.rt50Sec!);
    expect(caseByDose(0.4, 30).activationReadback.rt50Sec)
      .toBeCloseTo(baseline.activationReadback.rt50Sec!, 12);
  });

  it("records that passive expansibility advances x but does not separate E/A", () => {
    const compliant = caseByDose(0.4, 30);
    const baseline = caseByDose(1, 30);

    expect(compliant.waveformReadback.xTheta)
      .toBeLessThan(baseline.waveformReadback.xTheta);
    expect(compliant.waveformReadback.postMitralClosingSecondaryRiseMmHg)
      .toBe(0);
    expect(compliant.waveformReadback.yDepthMmHg)
      .toBeLessThan(baseline.waveformReadback.yDepthMmHg);
    expect(compliant.waveformReadback.velocityAtAtrialActivationOnsetCmPerSec)
      .toBeGreaterThan(
        baseline.waveformReadback.velocityAtAtrialActivationOnsetCmPerSec,
      );
    expect(report.result).toEqual({
      allCasesPassMechanicalHardGates: true,
      anySeparatedEa: false,
      anyPositiveDiastasis: false,
      lowerPassiveStressCanAdvanceX: true,
      lowerPassiveStressMakesYShallowerAtBaselineOffRate: true,
      lowerPassiveStressIncreasesResidualEAtAtrialOnsetAtBaselineOffRate: true,
      fasterActiveRelaxationAloneSeparatesEaAtBaselinePassiveStress: false,
      verdict:
        "passive-expansibility-is-an-x-lever-not-a-sufficient-ea-or-y-solution",
    });
  });

  it("passes mechanical gates and matches the checked-in artifact", () => {
    expect(report.cases.every((row) => row.mechanicalHardGates.pass)).toBe(true);
    expect(report.discretizationRobustness.allMechanicalHardGatesPass).toBe(true);
    expect(report.discretizationRobustness.allClassificationsStable).toBe(true);
    expect(report.discretizationRobustness.anchors).toHaveLength(2);
    for (const anchor of report.discretizationRobustness.anchors) {
      expect(anchor.replicas.map((row) => row.dtSec))
        .toEqual([0.0005, 0.001, 0.002]);
      expect(new Set(anchor.replicas.map((row) => row.mitralFusionClass)))
        .toEqual(new Set(["complete-fusion"]));
      expect(anchor.coarseToFineAbsoluteDifference.xTheta)
        .toBeLessThan(0.01);
      expect(anchor.coarseToFineAbsoluteDifference.yDepthMmHg)
        .toBeLessThan(0.1);
    }
    expectMechanics2ReportArtifactParity(artifact, report);
  });

  function caseByDose(
    passiveScale: number,
    offRatePerSec: number,
  ): WorkConjugateAtrialComplianceRelaxationCaseV1 {
    const row = report.cases.find((candidate) =>
      candidate.laPassiveStressScale === passiveScale &&
      candidate.contractileOffRatePerSec === offRatePerSec
    );
    if (row === undefined) throw new Error("screen case is missing");
    return row;
  }
});
