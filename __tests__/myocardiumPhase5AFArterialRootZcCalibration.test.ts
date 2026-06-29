import resultArtifact from "@/data/myocardium/protocols/arterial-root-zc-calibration-phase5af-result-v1.json";
import { validateArterialRootZcCalibrationPhase5AF } from "@/tools/myocardium/verifyArterialRootZcCalibrationPhase5AF";
import { describe, expect, it } from "vitest";

describe("myocardium Phase 5AF arterial root/Zc calibration", () => {
  it("records sourced calibration without runtime adoption", () => {
    expect(resultArtifact.id).toBe("arterial-root-zc-calibration-phase5af-result-v1");
    expect(resultArtifact.phase).toBe("Phase 5AF");
    expect(resultArtifact.claimBoundary).toBe("sourced-arterial-root-zc-calibration-diagnostic-only");
    expect(resultArtifact.upstreamPhase5ACArtifactId).toBe("arterial-root-zc-impedance-bench-phase5ac-result-v1");
    expect(resultArtifact.upstreamPhase5AEArtifactId).toBe("arterial-root-boundary-inertance-phase5ae-result-v1");
    expect(resultArtifact.protocol.calibrationMode).toBe("source-range-comparison-against-phase5ac-direct-linear-bench");
    expect(resultArtifact.protocol.benchReadoutSource).toBe("phase5ac-20hz-high-frequency-input-impedance");
    expect(resultArtifact.boundary.noModelCoreEquationChange).toBe(true);
    expect(resultArtifact.boundary.noTopologyChange).toBe(true);
    expect(resultArtifact.boundary.noQDotClampRemoval).toBe(true);
    expect(resultArtifact.boundary.noDirectAoSAAdoption).toBe(true);
    expect(resultArtifact.boundary.noBoundaryRootProductionAdoption).toBe(true);
    expect(resultArtifact.boundary.noOfficialMorphologyAcceptance).toBe(true);
  });

  it("uses an explicit source range and keeps only total 2x inside the range", () => {
    expect(resultArtifact.sources).toHaveLength(1);
    expect(resultArtifact.sources[0].id).toBe("bikia-2021-virtual-aortic-impedance");
    expect(resultArtifact.sources[0].meanMmHgSecPerMl).toBe(0.056);
    expect(resultArtifact.sources[0].sdMmHgSecPerMl).toBe(0.012);
    expect(resultArtifact.sourceRanges.preferred).toMatchObject({
      sdMultiple: 1,
      minMmHgSecPerMl: 0.044,
      maxMmHgSecPerMl: 0.068,
    });
    expect(resultArtifact.sourceRanges.broad).toMatchObject({
      sdMultiple: 2,
      minMmHgSecPerMl: 0.032,
      maxMmHgSecPerMl: 0.08,
    });
    expect(resultArtifact.candidates.map((candidate) => candidate.candidateId)).toEqual([
      "current-aov-l",
      "phase5ab-pareto-total-2x-aov-l",
      "phase5ab-pareto-total-3x-aov-l",
      "phase5ab-pareto-total-4x-aov-l",
    ]);
    expect(resultArtifact.candidates.map((candidate) => candidate.candidateCalibrationStatus)).toEqual([
      "below-physiological-calibration-range",
      "preferred-physiological-calibration-candidate",
      "above-physiological-calibration-range",
      "above-physiological-calibration-range",
    ]);
    expect(resultArtifact.summary.preferredCandidateIds).toEqual(["phase5ab-pareto-total-2x-aov-l"]);
    expect(resultArtifact.summary.broadCandidateIds).toEqual(["phase5ab-pareto-total-2x-aov-l"]);
  });

  it("maps the Phase 5AE boundary/root mechanism to the sourced-Zc candidate", () => {
    expect(resultArtifact.phase5aeBoundaryRootMechanismCalibration).toMatchObject({
      mechanismId: "phase5ae-experimental-aortic-boundary-root-inertance-v1",
      equivalentPhase5ACCandidateId: "phase5ab-pareto-total-2x-aov-l",
      equivalentEffectiveAoVInertanceMultiple: 2,
      phase5aeMechanismAssessment: "matches-carrier-diagnostic-only",
      calibrationStatus: "preferred-physiological-calibration-candidate",
      preferredRangeClassification: "inside-preferred-source-range",
      broadRangeClassification: "inside-broad-source-range",
    });
    expect(resultArtifact.summary.currentStatus).toBe("below-physiological-calibration-range");
    expect(resultArtifact.summary.phase5aeBoundaryRootCalibrationStatus)
      .toBe("preferred-physiological-calibration-candidate");
    expect(resultArtifact.summary.currentInterpretation).toContain("current closure is below");
    expect(resultArtifact.summary.currentInterpretation).toContain("total 2x AoV/root candidate");
  });

  it("passes the verifier", () => {
    const report = validateArterialRootZcCalibrationPhase5AF(process.cwd());
    expect(report.pass).toBe(true);
    expect(report.errors).toEqual([]);
    expect(report.warnings.map((warning) => warning.code)).toEqual([
      "phase5af_runtime_not_unlocked",
    ]);
  });

  it("rejects source and boundary erosion", () => {
    const artifact = resultArtifact as Record<string, any>;
    const originalMean = artifact.sources[0].meanMmHgSecPerMl;
    const originalBoundary = artifact.boundary.noQDotClampRemoval;
    try {
      artifact.sources[0].meanMmHgSecPerMl = 0.09;
      artifact.boundary.noQDotClampRemoval = false;

      const report = validateArterialRootZcCalibrationPhase5AF(process.cwd());

      expect(report.pass).toBe(false);
      expect(report.errors.map((error) => error.code)).toEqual(expect.arrayContaining([
        "phase5af_stale_artifact",
        "phase5af_source_anchor",
        "phase5af_boundary",
      ]));
    } finally {
      artifact.sources[0].meanMmHgSecPerMl = originalMean;
      artifact.boundary.noQDotClampRemoval = originalBoundary;
    }
  });
});
