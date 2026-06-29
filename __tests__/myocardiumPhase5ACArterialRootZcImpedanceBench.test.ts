import resultArtifact from "@/data/myocardium/protocols/arterial-root-zc-impedance-bench-phase5ac-result-v1.json";
import { validateArterialRootZcImpedanceBenchPhase5AC } from "@/tools/myocardium/verifyArterialRootZcImpedanceBenchPhase5AC";
import { describe, expect, it } from "vitest";

describe("myocardium Phase 5AC arterial root/Zc impedance bench", () => {
  it("records a diagnostic-only direct isolated impedance bench", () => {
    expect(resultArtifact.id).toBe("arterial-root-zc-impedance-bench-phase5ac-result-v1");
    expect(resultArtifact.phase).toBe("Phase 5AC");
    expect(resultArtifact.claimBoundary).toBe("isolated-arterial-root-zc-impedance-bench-diagnostic-only");
    expect(resultArtifact.upstreamPhase5ABArtifactId).toBe("arterial-root-inertance-closed-loop-phase5ab-result-v1");
    expect(resultArtifact.protocol.benchMode).toBe("linearized-current-systemic-arterial-load-with-prescribed-input-flow");
    expect(resultArtifact.summary.reflectionCoefficientAvailability).toBe("unavailable-no-proxy");
    expect(resultArtifact.boundary.noQDotClampRemoval).toBe(true);
    expect(resultArtifact.boundary.noDirectAoSAAdoption).toBe(true);
    expect(resultArtifact.boundary.noReflectionCoefficientClaim).toBe(true);
    expect(resultArtifact.boundary.noOfficialMorphologyAcceptance).toBe(true);
  });

  it("uses current plus Phase 5AB lower-output-preserving candidate region", () => {
    expect(resultArtifact.runs.map((run) => run.candidateId)).toEqual([
      "current-aov-l",
      "phase5ab-pareto-total-2x-aov-l",
      "phase5ab-pareto-total-3x-aov-l",
      "phase5ab-pareto-total-4x-aov-l",
    ]);
    expect(resultArtifact.runs.map((run) => run.effectiveAoVInertanceMultiple)).toEqual([1, 2, 3, 4]);
    expect(resultArtifact.protocol.inputFrequenciesHz).toEqual([0.5, 1, 2, 3, 5, 8, 12, 16, 20]);
    expect(resultArtifact.summary.runCount).toBe(4);
  });

  it("separates invariant DC resistance from candidate high-frequency readout", () => {
    const dcResistance = resultArtifact.runs.map((run) => run.lowFrequencyResistanceEstimateMmHgSecPerMl);
    expect(new Set(dcResistance.map((value) => value.toFixed(6))).size).toBe(1);
    expect(resultArtifact.summary.currentLowFrequencyResistanceMmHgSecPerMl).toBe(dcResistance[0]);

    const highFrequency = resultArtifact.runs.map((run) => run.highFrequencyImpedanceEstimatePaSecPerM3);
    expect(highFrequency).toEqual([...highFrequency].sort((a, b) => a - b));
    expect(new Set(highFrequency).size).toBe(highFrequency.length);
    expect(resultArtifact.summary.currentHighFrequencyImpedancePaSecPerM3).toBe(highFrequency[0]);
    expect(resultArtifact.summary.paretoHighFrequencyImpedanceRangePaSecPerM3).toEqual({
      min: highFrequency[1],
      max: highFrequency[3],
    });
  });

  it("labels downstream time response controls separately from candidate-sensitive series energy", () => {
    const seriesEnergy = resultArtifact.runs.map((run) => run.timeResponse.seriesInertivePeakEnergyProxyMmHgMl);
    expect(seriesEnergy).toEqual([...seriesEnergy].sort((a, b) => a - b));
    expect(new Set(seriesEnergy).size).toBe(seriesEnergy.length);

    const downstreamRootPressure = resultArtifact.runs.map((run) => run.timeResponse.peakRootPressureMmHg);
    const downstreamAoSaFlow = resultArtifact.runs.map((run) => run.timeResponse.peakAoSaFlowMlPerSec);
    const downstreamStored = resultArtifact.runs.map((run) => run.timeResponse.downstreamComplianceStoredEnergyProxyMmHgMl);
    const downstreamDissipated = resultArtifact.runs.map((run) => run.timeResponse.downstreamAoSaDissipatedEnergyProxyMmHgMl);
    expect(new Set(downstreamRootPressure.map((value) => value.toFixed(6))).size).toBe(1);
    expect(new Set(downstreamAoSaFlow.map((value) => value.toFixed(6))).size).toBe(1);
    expect(new Set(downstreamStored.map((value) => value.toFixed(6))).size).toBe(1);
    expect(new Set(downstreamDissipated.map((value) => value.toFixed(6))).size).toBe(1);

    expect(resultArtifact.summary.limitations).toEqual(expect.arrayContaining([
      expect.stringContaining("Downstream root pressure"),
      expect.stringContaining("series inertive energy"),
    ]));
  });

  it("keeps reflection unavailable instead of filling it with a pressure/flow proxy", () => {
    for (const run of resultArtifact.runs) {
      expect(run.candidateCharacteristicImpedanceStatus).toBe("available-direct-linear-bench");
      expect(run.candidateCharacteristicImpedancePaSecPerM3).toBe(run.highFrequencyImpedanceEstimatePaSecPerM3);
      expect(run.candidateReflectionCoefficientStatus).toBe("unavailable-no-proxy");
      expect(run.candidateReflectionCoefficient).toBeNull();
      expect(run.timeResponse.peakInputFlowMlPerSec).toBeGreaterThan(0);
      expect(run.timeResponse.peakAoSaFlowMlPerSec).toBeGreaterThan(0);
      expect(run.timeResponse.pressureFwhmSec).not.toBeNull();
      expect(run.timeResponse.rootPressureFwhmSec).not.toBeNull();
      expect(run.timeResponse.seriesInertivePeakEnergyProxyMmHgMl).toBeGreaterThan(0);
      expect(run.timeResponse.downstreamComplianceStoredEnergyProxyMmHgMl).toBeGreaterThan(0);
      expect(run.timeResponse.downstreamAoSaDissipatedEnergyProxyMmHgMl).toBeGreaterThan(0);
    }
  });

  it("passes the verifier", () => {
    const report = validateArterialRootZcImpedanceBenchPhase5AC(process.cwd());
    expect(report.pass).toBe(true);
    expect(report.errors).toEqual([]);
    expect(report.warnings.map((warning) => warning.code)).toEqual([
      "phase5ac_runtime_not_unlocked",
    ]);
  });

  it("rejects boundary and hash erosion", () => {
    const artifact = resultArtifact as Record<string, any>;
    const originalBoundary = artifact.boundary.noQDotClampRemoval;
    try {
      artifact.boundary.noQDotClampRemoval = false;

      const report = validateArterialRootZcImpedanceBenchPhase5AC(process.cwd());

      expect(report.pass).toBe(false);
      expect(report.errors.map((error) => error.code)).toEqual(expect.arrayContaining([
        "phase5ac_stale_artifact",
        "phase5ac_boundary",
      ]));
    } finally {
      artifact.boundary.noQDotClampRemoval = originalBoundary;
    }
  });
});
