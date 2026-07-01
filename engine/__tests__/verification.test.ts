import { describe, expect, it } from "vitest";
import { DEFAULT_PARAMS } from "@/constants";
import { evaluateCandidate, rankCandidates, rankCandidatesByObjective } from "@/engine/fitting/evaluateCandidate";
import type { ObjectiveEvaluation } from "@/engine/fitting/objective";
import { makeCandidatePatch } from "@/engine/fitting/parameterSpace";
import { collectNormalBaselineGates } from "@/engine/verification/gates";
import { generateVerificationSvgs } from "@/engine/verification/artifacts";
import { morphologyCheckSummaryFromSamples } from "@/engine/verification/morphologyCheck";
import { VERIFICATION_PROFILES } from "@/engine/verification/profiles";
import { reportToMarkdown, runVerification, toVerificationArtifact } from "@/engine/verification/report";
import { lastCompleteBeat } from "@/engine/verification/shapeMetrics";

describe("fitting/verification mode foundation", () => {
  it("defaults to validity-only gates so pathologic cases opt into their own gates", () => {
    const report = runVerification(DEFAULT_PARAMS, {
      profile: "fitFast",
      now: new Date("2026-06-05T00:00:00.000Z"),
    });

    expect(report.gateSet).toBe("validityOnly");
    expect(report.steady?.status).toBe("converged");
    expect(report.steady?.ok).toBe(true);
    expect(report.shape).toBeNull();
    expect(report.gates.map((gate) => gate.id)).not.toContain("aop-mean");
    expect(report.gates.filter((gate) => gate.severity === "hard" && gate.status === "fail")).toEqual([]);
  });

  it("runs a headless fit-fast normal-baseline verification report", () => {
    const report = runVerification(DEFAULT_PARAMS, {
      profile: "fitFast",
      gateSet: "normalBaseline",
      now: new Date("2026-06-05T00:00:00.000Z"),
    });

    const hardFailures = report.gates
      .filter((gate) => gate.severity === "hard" && gate.status === "fail")
      .map((gate) => ({ id: gate.id, value: gate.value, threshold: gate.threshold }));
    expect(hardFailures).toEqual([]);
    expect(report.summary.pass).toBe(true);
    expect(report.metrics).not.toBeNull();
    expect(report.steady).not.toBeNull();
    expect(report.steady?.status).toBe("converged");
    expect(report.steady?.state.paramsHash).toMatch(/^[0-9a-f]{8}$/);
    expect(report.steady?.state.targetParamsHash).toMatch(/^[0-9a-f]{8}$/);
    expect(report.steady?.state.stateLayoutHash).toMatch(/^[0-9a-f]{8}$/);
    expect(report.steady?.state.xLength).toBeGreaterThan(0);
    expect(report.steady?.residuals.worstSignal === null || typeof report.steady?.residuals.worstSignal === "string").toBe(true);
    expect(report.steady?.solverStats.kind).toBe("fixed-heun");
    expect(report.steady?.solverStats.nSteps).toBeGreaterThan(0);
    expect(report.steady?.solverStats.nBeats).toBe(report.settleStatus?.beats);
    expect(report.measurement).not.toBeNull();
    expect(report.metrics?.CO_L).toBeCloseTo(report.measurement!.metrics.CO_L, 12);
    expect(report.steady?.solverStats.measureSeconds).toBeCloseTo(report.measurement!.measureSeconds, 12);
    expect(report.steady?.residuals.leftRightSvMismatchLMin).toBeCloseTo(report.measurement!.forwardCODiffLMin, 12);
    expect(report.steady?.state.t).toBeCloseTo(report.measurement!.core.packState().t, 12);
    expect(report.steady?.state.phi).toBeCloseTo(report.measurement!.core.packState().phi, 12);
    expect(report.shape).not.toBeNull();
    expect(report.morphology).not.toBeNull();
    expect(report.morphology?.version).toBe("morphology-check-v1");
    expect(report.shape?.pvfSFraction).toBeGreaterThan(0.40);
    expect(report.shape?.laSelfIntersections).toBeGreaterThanOrEqual(1);
    const ids = report.gates.map((gate) => gate.id);
    for (const id of [
      "qmv-e-peak",
      "qmv-a-peak",
      "qmv-a-over-e",
      "qmv-extra-peaks",
      "lap-oscillation-index",
      "lv-filling-edge-roughness",
      "pvf-ar-present",
      "pvf-s-fraction",
      "pvf-reverse-fraction",
      "mv-gradient-e-peak",
      "rv-stroke-fraction",
      "ra-emptying-fraction",
    ]) {
      expect(ids).toContain(id);
    }
    expect(ids).not.toContain("qmv-biphasic");
    expect(ids).not.toContain("pvf-readable");
    expect(ids).not.toContain("mv-gradient");
    expect(ids).not.toContain("right-heart");

    const markdown = reportToMarkdown(report);
    expect(markdown).toContain("Verification Report");
    expect(markdown).toContain("Profile: Fit fast");
    expect(markdown).toContain("Steady State");
    expect(markdown).toContain("Params hash:");
    expect(markdown).toContain("State layout hash:");
    expect(markdown).toContain("settle beats");
    expect(markdown).toContain("PVF S fraction");
    expect(markdown).toContain("Morphology Check");
  });

  it("enforces final normal-baseline gates under verify-accurate mode", () => {
    const report = runVerification(DEFAULT_PARAMS, {
      profile: "verifyAccurate",
      gateSet: "normalBaseline",
      now: new Date("2026-06-05T00:00:00.000Z"),
    });
    expect(report.gates.filter((gate) => gate.severity === "hard" && gate.status === "fail")).toEqual([]);
    expect(report.gates.filter((gate) => gate.severity === "soft" && gate.status === "fail")).toEqual([]);
    expect(report.summary.pass).toBe(true);
  });

  it("reports settle failure without attempting morphology gates", () => {
    const report = runVerification(DEFAULT_PARAMS, {
      profile: {
        ...VERIFICATION_PROFILES.fitFast,
        settlePolicy: {
          ...VERIFICATION_PROFILES.fitFast.settlePolicy,
          minBeats: 100,
          capSeconds: 0.001,
        },
      },
      gateSet: "normalBaseline",
      now: new Date("2026-06-05T00:00:00.000Z"),
    });

    expect(report.summary.pass).toBe(false);
    expect(report.steady?.status).toBe("cap");
    expect(report.steady?.ok).toBe(false);
    expect(report.steady?.state.xLength).toBeGreaterThan(0);
    expect(report.steady?.residuals.venousMaxResidualMl).toBeNull();
    expect(report.steady?.solverStats.measureSeconds).toBe(0);
    expect(report.steady?.solverStats.nBeats).toBe(report.settleStatus?.beats);
    expect(report.metrics).toBeNull();
    expect(report.measurement).toBeNull();
    expect(report.shape).toBeNull();
    expect(report.gates).toHaveLength(1);
    expect(report.gates[0].id).toBe("settled");
  });

  it("serializes verification artifacts without measurement samples or steady state vectors", () => {
    const report = runVerification(DEFAULT_PARAMS, {
      profile: "fitFast",
      gateSet: "normalBaseline",
      now: new Date("2026-06-05T00:00:00.000Z"),
    });

    const artifact = toVerificationArtifact(report);
    expect(artifact.measurement).toBeNull();
    expect(artifact.steady?.state.paramsHash).toMatch(/^[0-9a-f]{8}$/);
    expect(artifact.steady?.state.xLength).toBeGreaterThan(0);
    expect("x" in (artifact.steady?.state as Record<string, unknown>)).toBe(false);
    expect(JSON.stringify(artifact)).not.toContain('"samples"');
  });

  it("requires pulmonary venous Ar to be truly retrograde in the Ar window", () => {
    const report = runVerification(DEFAULT_PARAMS, {
      profile: "verifyAccurate",
      gateSet: "normalBaseline",
      now: new Date("2026-06-05T00:00:00.000Z"),
    });
    expect(report.measurement).not.toBeNull();
    const measurement = report.measurement!;
    const noArMeasurement = {
      ...measurement,
      samples: measurement.samples.map((sample) => {
        const theta = sample.phi - Math.floor(sample.phi);
        if (theta < 0.84 || theta >= 0.98) return sample;
        return { ...sample, PVF: Math.abs(sample.PVF) + 1 };
      }),
    };

    const pvfGate = collectNormalBaselineGates(noArMeasurement)
      .find((gate) => gate.id === "pvf-ar-present");
    expect(pvfGate?.status).toBe("fail");
    expect(String(pvfGate?.value)).toContain("Ar=");
  });

  it("detects mitral inflow chatter as extra diastolic peaks", () => {
    const report = runVerification(DEFAULT_PARAMS, {
      profile: "verifyAccurate",
      gateSet: "normalBaseline",
      now: new Date("2026-06-05T00:00:00.000Z"),
    });
    expect(report.measurement).not.toBeNull();
    const measurement = report.measurement!;
    const chatteringMeasurement = {
      ...measurement,
      samples: measurement.samples.map((sample) => {
        const theta = sample.phi - Math.floor(sample.phi);
        const extraE1 = 160 * Math.exp(-0.5 * ((theta - 0.48) / 0.012) ** 2);
        const extraE2 = 160 * Math.exp(-0.5 * ((theta - 0.66) / 0.012) ** 2);
        const extraMid = 160 * Math.exp(-0.5 * ((theta - 0.80) / 0.012) ** 2);
        return { ...sample, QMV: sample.QMV + extraE1 + extraE2 + extraMid };
      }),
    };

    const chatterGate = collectNormalBaselineGates(chatteringMeasurement)
      .find((gate) => gate.id === "qmv-extra-peaks");
    expect(chatterGate?.status).toBe("fail");
    expect(chatterGate?.value).toBeGreaterThan(0);

    const morphology = morphologyCheckSummaryFromSamples(chatteringMeasurement.samples);
    const mvf = morphology.results.find((result) => result.id === "mvf");
    expect(mvf?.status).toBe("failed");
    expect(mvf?.metrics.extraPeakCount).toBeGreaterThan(0);
  });

  it("detects double-humped LV systolic PV-loop morphology", () => {
    const report = runVerification(DEFAULT_PARAMS, {
      profile: "verifyAccurate",
      gateSet: "normalBaseline",
      now: new Date("2026-06-05T00:00:00.000Z"),
    });
    expect(report.measurement).not.toBeNull();
    const measurement = report.measurement!;
    const beat = lastCompleteBeat(measurement.samples);
    const ejectionIndices = new Set<number>();
    const flowMax = Math.max(0, ...beat.map((sample) => sample.QAo));
    const ejection = beat
      .map((sample, localIndex) => ({ sample, localIndex }))
      .filter(({ sample }) => sample.QAo > Math.max(10, 0.08 * flowMax));
    for (const { localIndex } of ejection) ejectionIndices.add(localIndex);
    const beatStart = measurement.samples.indexOf(beat[0]);
    const doubleDomeSamples = measurement.samples.map((sample, index) => {
      const localIndex = index - beatStart;
      if (!ejectionIndices.has(localIndex) || ejection.length < 12) return sample;
      const sequenceIndex = ejection.findIndex((entry) => entry.localIndex === localIndex);
      const x = sequenceIndex / Math.max(ejection.length - 1, 1);
      const twoPeaks = 22 * Math.exp(-0.5 * ((x - 0.28) / 0.08) ** 2)
        + 24 * Math.exp(-0.5 * ((x - 0.72) / 0.08) ** 2)
        - 18 * Math.exp(-0.5 * ((x - 0.50) / 0.07) ** 2);
      return { ...sample, LVP: 85 + twoPeaks };
    });

    const morphology = morphologyCheckSummaryFromSamples(doubleDomeSamples);
    const lvPv = morphology.results.find((result) => result.id === "lv-pv-loop");
    expect(lvPv?.status).toBe("failed");
    expect(lvPv?.metrics.ejectionPeakCount).toBeGreaterThan(1);
  });

  it("detects early LA active-kick timing", () => {
    const report = runVerification(DEFAULT_PARAMS, {
      profile: "verifyAccurate",
      gateSet: "normalBaseline",
      now: new Date("2026-06-05T00:00:00.000Z"),
    });
    expect(report.measurement).not.toBeNull();
    const earlyKickSamples = report.measurement!.samples.map((sample) => {
      const theta = sample.phi - Math.floor(sample.phi);
      const earlyBoost = 1_000 * Math.exp(-0.5 * ((theta - 0.55) / 0.015) ** 2);
      return { ...sample, aLA: sample.aLA + earlyBoost };
    });

    const morphology = morphologyCheckSummaryFromSamples(earlyKickSamples);
    const lap = morphology.results.find((result) => result.id === "lap-waveform");
    expect(lap?.status).toBe("failed");
    expect(lap?.metrics.activePeakTheta).toBeGreaterThan(0.5);
    expect(lap?.metrics.activePeakTheta).toBeLessThan(0.6);
  });

  it("detects excessive LA-to-LV upstroke delay even when the LA active phase is late-diastolic", () => {
    const report = runVerification(DEFAULT_PARAMS, {
      profile: "verifyAccurate",
      gateSet: "normalBaseline",
      now: new Date("2026-06-05T00:00:00.000Z"),
    });
    expect(report.measurement).not.toBeNull();
    const delayedUpstrokeSamples = report.measurement!.samples.map((sample) => {
      const theta = sample.phi - Math.floor(sample.phi);
      const delayedStep = theta >= 0.35 && theta < 0.37 ? 500 * (theta - 0.35) / 0.02 : 0;
      return { ...sample, LVP: sample.LVP + delayedStep };
    });

    const morphology = morphologyCheckSummaryFromSamples(delayedUpstrokeSamples);
    const leftDelay = morphology.results.find((result) => result.id === "left-av-delay");
    expect(leftDelay?.status).toBe("failed");
    expect(leftDelay?.metrics.activeToVentricularUpstrokeLeadMs).toBeGreaterThan(240);
    expect(morphology.badges.lapWaveform).toBe("failed");
  });

  it("detects the old underdamped left-filling configuration", () => {
    const report = runVerification({
      ...DEFAULT_PARAMS,
      MV_Amax: 5.0,
      MV_R: 0.002,
      MV_L: 0.0003,
      MV_B: 5e-6,
      MV_tauOpen: 0.020,
      MV_tauClose: 0.012,
      edgeOverrides: {
        PVein_LA: {
          R: 0.028,
          pvOstialResistanceR: 0.028,
          L: 0.002,
          pvOstialInertanceL: 0.002,
          B: 0,
          pvOstialQuadraticB: 0,
        },
      },
    }, {
      profile: "verifyAccurate",
      gateSet: "normalBaseline",
      now: new Date("2026-06-05T00:00:00.000Z"),
    });
    const failures = new Set(report.gates.filter((gate) => gate.status === "fail").map((gate) => gate.id));
    expect(failures).toContain("qmv-extra-peaks");
    expect(failures).toContain("lv-filling-edge-curvature");
    expect(report.failureLocations.some((location) => {
      return location.gateId === "qmv-extra-peaks"
        && location.artifactFile === "waveforms.svg"
        && location.panelId === "inflow";
    })).toBe(true);
    expect(report.failureLocations.some((location) => {
      return location.gateId === "lv-filling-edge-curvature"
        && location.artifactFile === "pv-loops.svg"
        && location.panelId === "lv-pv-loop";
    })).toBe(true);
    expect(reportToMarkdown(report)).toContain("Failure Localization");
  });

  it("generates structural SVG artifacts with waveform and PV-loop panels", () => {
    const report = runVerification(DEFAULT_PARAMS, {
      profile: "verifyAccurate",
      gateSet: "normalBaseline",
      now: new Date("2026-06-05T00:00:00.000Z"),
    });
    const svgs = generateVerificationSvgs(report);
    expect(svgs["waveforms.svg"]).toContain("Verification Waveforms");
    expect(svgs["waveforms.svg"]).toContain('id="inflow"');
    expect(svgs["waveforms.svg"]).toContain('id="pulmonary-venous-flow"');
    expect(svgs["waveforms.svg"]).toContain("PVF model flow (mL/s, not Doppler velocity)");
    expect(svgs["waveforms.svg"]).toContain("pvf-ar-present");
    expect(svgs["waveforms.svg"]).toContain("mv-gradient-e-peak");
    expect(svgs["waveforms.svg"]).toContain("qmv-extra-peaks");
    expect(svgs["pv-loops.svg"]).toContain("lv-filling-edge-roughness");
    expect(svgs["pv-loops.svg"]).toContain("lv-filling-edge-curvature");
    expect(svgs["pv-loops.svg"]).toContain('id="lv-pv-loop"');
    expect(svgs["pv-loops.svg"]).toContain("LV filling edge run");
    expect(svgs["pv-loops.svg"]).toContain("Verification PV Loops");
    expect(svgs["pv-loops.svg"]).toContain("LA PV loop");
    expect(svgs["pv-loops.svg"]).toContain("RA PV loop");
  });

  it("evaluates and ranks fitting candidates using hard-gate failures first", () => {
    const neutral = makeCandidatePatch("neutral-rv", [
      { id: "rvTmaxScale", value: DEFAULT_PARAMS.rvTmaxScale },
    ]);
    const excessiveMitralLoss = makeCandidatePatch("excessive-mv-r", [
      { id: "MV_R", value: 0.08 },
    ]);

    const neutralEval = evaluateCandidate(neutral, DEFAULT_PARAMS, { profile: "fitFast", gateSet: "normalBaseline" });
    const badEval = evaluateCandidate(excessiveMitralLoss, DEFAULT_PARAMS, { profile: "fitFast", gateSet: "normalBaseline" });
    const ranked = rankCandidates([badEval, neutralEval]);

    expect(neutralEval.hardFailures.map((gate) => gate.id)).toEqual([]);
    expect(neutralEval.accepted).toBe(true);
    expect(neutralEval.objective.ok).toBe(true);
    expect(neutralEval.objective.steady?.status).toBe("converged");
    expect(badEval.accepted).toBe(false);
    expect(Number.isFinite(badEval.objective.totalLoss)).toBe(true);
    expect(badEval.rejectStage).not.toBe("none");
    expect(ranked[0].id).toBe("neutral-rv");
  });

  it("rejects non-finite candidate patches before integration", () => {
    const badEval = evaluateCandidate({ HR: Number.NaN }, DEFAULT_PARAMS);
    expect(badEval.accepted).toBe(false);
    expect(badEval.rejectStage).toBe("validity");
    expect(badEval.hardFailures.map((gate) => gate.id)).toEqual(["candidate-patch-finite"]);
    expect(badEval.report.metrics).toBeNull();
    expect(badEval.report.steady).toBeNull();
    expect(badEval.objective.steady).toBeNull();
    expect(badEval.objective.rejectReasons).toContain("invalid-patch");
  });

  it("uses deterministic candidate ranking tie-breakers", () => {
    const ranked = rankCandidates([
      { id: "b", accepted: true, rejectStage: "none", hardFailures: [], softFailures: [], score: Number.NaN, objective: dummyObjective(2, true), report: null as any },
      { id: "a", accepted: true, rejectStage: "none", hardFailures: [], softFailures: [], score: Number.NaN, objective: dummyObjective(1, true), report: null as any },
    ]);
    expect(ranked.map((item) => item.id)).toEqual(["a", "b"]);
  });

  it("can rank candidates by objective without changing legacy ranking", () => {
    const legacyWinner = {
      id: "legacy-winner",
      accepted: true,
      rejectStage: "none" as const,
      hardFailures: [],
      softFailures: [],
      score: 1,
      objective: dummyObjective(100, true),
      report: null as any,
    };
    const objectiveWinner = {
      id: "objective-winner",
      accepted: true,
      rejectStage: "none" as const,
      hardFailures: [],
      softFailures: [],
      score: 0.5,
      objective: dummyObjective(1, true),
      report: null as any,
    };

    expect(rankCandidates([objectiveWinner, legacyWinner])[0].id).toBe("legacy-winner");
    expect(rankCandidatesByObjective([legacyWinner, objectiveWinner])[0].id).toBe("objective-winner");
  });

  it("keeps objective-ok candidates ahead of lower-loss rejected candidates", () => {
    const converged = {
      id: "converged-large-loss",
      accepted: true,
      rejectStage: "none" as const,
      hardFailures: [],
      softFailures: [],
      score: 0,
      objective: dummyObjective(1e12, true),
      report: null as any,
    };
    const rejected = {
      id: "rejected-small-loss",
      accepted: false,
      rejectStage: "settle" as const,
      hardFailures: [],
      softFailures: [],
      score: 1,
      objective: dummyObjective(0, false),
      report: null as any,
    };

    expect(rankCandidatesByObjective([rejected, converged])[0].id).toBe("converged-large-loss");
  });

  it("falls back deterministically when objective loss is non-finite", () => {
    const finite = {
      id: "finite-loss",
      accepted: true,
      rejectStage: "none" as const,
      hardFailures: [],
      softFailures: [],
      score: 0,
      objective: dummyObjective(10, true),
      report: null as any,
    };
    const nanLoss = {
      id: "nan-loss",
      accepted: true,
      rejectStage: "none" as const,
      hardFailures: [],
      softFailures: [],
      score: 1,
      objective: dummyObjective(Number.NaN, true),
      report: null as any,
    };
    const infLoss = {
      id: "inf-loss",
      accepted: true,
      rejectStage: "none" as const,
      hardFailures: [],
      softFailures: [],
      score: Number.NaN,
      objective: dummyObjective(Number.POSITIVE_INFINITY, true),
      report: null as any,
    };

    expect(rankCandidatesByObjective([nanLoss, finite])[0].id).toBe("finite-loss");
    expect(rankCandidatesByObjective([infLoss, nanLoss]).map((item) => item.id)).toEqual(["nan-loss", "inf-loss"]);
  });
});

function dummyObjective(totalLoss: number, ok: boolean): ObjectiveEvaluation {
  return {
    ok,
    totalLoss,
    targetLoss: 0,
    gatePenalty: 0,
    convergencePenalty: 0,
    residualPenalty: 0,
    scoreLoss: 0,
    rejectReasons: [],
    steady: null,
    observables: {},
    targetBreakdown: [],
  };
}
