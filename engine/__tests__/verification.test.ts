import { describe, expect, it } from "vitest";
import { DEFAULT_PARAMS } from "@/constants";
import { evaluateCandidate, rankCandidates } from "@/engine/fitting/evaluateCandidate";
import { makeCandidatePatch } from "@/engine/fitting/parameterSpace";
import { collectNormalBaselineGates } from "@/engine/verification/gates";
import { generateVerificationSvgs } from "@/engine/verification/artifacts";
import { VERIFICATION_PROFILES } from "@/engine/verification/profiles";
import { reportToMarkdown, runVerification } from "@/engine/verification/report";

describe("fitting/verification mode foundation", () => {
  it("defaults to validity-only gates so pathologic cases opt into their own gates", () => {
    const report = runVerification(DEFAULT_PARAMS, {
      profile: "fitFast",
      now: new Date("2026-06-05T00:00:00.000Z"),
    });

    expect(report.gateSet).toBe("validityOnly");
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
    expect(report.shape).not.toBeNull();
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
    expect(markdown).toContain("PVF S fraction");
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
    expect(report.metrics).toBeNull();
    expect(report.shape).toBeNull();
    expect(report.gates).toHaveLength(1);
    expect(report.gates[0].id).toBe("settled");
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
    expect(badEval.accepted).toBe(false);
    expect(badEval.rejectStage).not.toBe("none");
    expect(ranked[0].id).toBe("neutral-rv");
  });

  it("rejects non-finite candidate patches before integration", () => {
    const badEval = evaluateCandidate({ HR: Number.NaN }, DEFAULT_PARAMS);
    expect(badEval.accepted).toBe(false);
    expect(badEval.rejectStage).toBe("validity");
    expect(badEval.hardFailures.map((gate) => gate.id)).toEqual(["candidate-patch-finite"]);
    expect(badEval.report.metrics).toBeNull();
  });

  it("uses deterministic candidate ranking tie-breakers", () => {
    const ranked = rankCandidates([
      { id: "b", accepted: true, rejectStage: "none", hardFailures: [], softFailures: [], score: Number.NaN, report: null as any },
      { id: "a", accepted: true, rejectStage: "none", hardFailures: [], softFailures: [], score: Number.NaN, report: null as any },
    ]);
    expect(ranked.map((item) => item.id)).toEqual(["a", "b"]);
  });
});
