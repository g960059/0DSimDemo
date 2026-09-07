import { describe, expect, it } from "vitest";
import baseline from "@/studio/integrations/mainWireIntegratedV3/algebraic-pulmonary-root-standard70-baseline-validation.json";
import { assertMainWireBaselineCheckCoverageV1, mainWireBaselineCheckBlocksV1,
  mainWireBaselineCheckWarnsV1, mainWireBaselineGateRoleV1 } from
  "@/analysis/policies/mainWire/MainWireBaselineGateRolesV1";
import { validateMainWireIntegratedStudioStandard70BaselineAssessmentV2 } from
  "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioStandard70BaselineAssessmentV2";
import { MAIN_WIRE_BASELINE_GATE_ROLES_V1_ID } from "@/analysis/policies/mainWire/MainWireBaselineGateRolesV1";
import { mainWireBaselineCheckBlocksUnderPolicyV1, mainWireBaselineGateRoleUnderPolicyV1 } from "@/analysis/policies/mainWire/MainWireBaselineGateRolesV1";
import { MAIN_WIRE_RELAXATION_TAU_V1_ID } from "@/analysis/methods/mainWire/MainWireRelaxationTauV1";
import { MAIN_WIRE_BASELINE_OBSERVATION_V2_ID } from "@/analysis/methods/mainWire/MainWireBaselineObservationV2";
import { MAIN_WIRE_BASELINE_PRESSURE_RATE_QUALITY_V1_ID, MAIN_WIRE_BASELINE_PRESSURE_RATE_QUALITY_POLICY_V1 } from
  "@/analysis/methods/mainWire/MainWireBaselinePressureRateQualityV1";
import { MAIN_WIRE_FIXED_TONE_SETTLEMENT_V2 } from "@/analysis/methods/mainWire/MainWireFixedToneSettlementV2";
import { MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRELOAD_RESERVE_PROTOCOL_V2_ID } from
  "@/analysis/methods/mainWire/MainWirePressureVolumeProtocolsV3";
import { buildMainWireIntegratedModelStandard70BaselineChecksV1, type MainWireIntegratedModelStandard70BaselineMeasurementsV1 } from
  "@/engine/myocardium/experiments/MainWireIntegratedModelStandard70BaselineValidationV1";
import { MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_IDENTITY_V1 } from "@/engine/myocardium/MainWireIntegratedModelStandard70CheckpointV1";

function check(id: string, actual: number) {
  const source = baseline.checks.find((row) => row.checkId === id)!;
  return { ...source, actual, status: actual >= source.minimum && actual <= source.maximum
    ? "passed" as const : "failed" as const };
}

describe("evidence-qualified baseline gate roles", () => {
  it("uses the same closed-boundary roundoff rule for observation, admission and warnings", () => {
    const source = baseline.checks.find(c => c.checkId === "aortic-valve.ejection-time")!;
    const boundary = { ...source, actual: 0.23999999999995225, status: "passed" as const };
    expect(mainWireBaselineCheckBlocksV1(boundary)).toBe(false);
    expect(mainWireBaselineCheckBlocksV1({ ...boundary, actual: .24 - 1e-10 })).toBe(true);
    expect(mainWireBaselineCheckBlocksV1({ ...boundary, status: "failed" })).toBe(true);
  });
  it("records both LV/RV reference failures without treating them as physiological rejection", () => {
    const values = { "left-ventricle.maximum-dpdt": 2502,
      "left-ventricle.minimum-dpdt": -1864, "right-ventricle.maximum-dpdt": 1200,
      "right-ventricle.minimum-dpdt": -800 };
    for (const [id, actual] of Object.entries(values)) {
      const value = check(id, actual);
      expect(value.status).toBe("failed");
      expect(mainWireBaselineGateRoleV1(id)).toBe("reference-warning");
      expect(mainWireBaselineCheckWarnsV1(value)).toBe(true);
      expect(mainWireBaselineCheckBlocksV1(value)).toBe(false);
    }
    const checks = baseline.checks.map((row) => row.checkId in values
      ? check(row.checkId, values[row.checkId as keyof typeof values]) : check(row.checkId, row.actual));
    expect(() => assertMainWireBaselineCheckCoverageV1(checks)).not.toThrow();
    expect(checks.some(mainWireBaselineCheckBlocksV1)).toBe(false);
  });

  it("does not soften missing/nonfinite signals, wrong signs, or unknown evidence", () => {
    for (const value of [NaN, Infinity, -Infinity, 0, -1]) {
      expect(mainWireBaselineCheckBlocksV1(check("left-ventricle.maximum-dpdt", value))).toBe(true);
    }
    expect(mainWireBaselineCheckBlocksV1(check("right-ventricle.minimum-dpdt", 1))).toBe(true);
    for (const actual of [NaN, Infinity, -0.01, 1.01]) {
      expect(mainWireBaselineCheckBlocksV1(check("waveform.LVP.rounded-not-plateau", actual))).toBe(true);
    }
    expect(() => mainWireBaselineGateRoleV1("unregistered" )).toThrow();
    expect(() => assertMainWireBaselineCheckCoverageV1(baseline.checks.slice(1) as never)).toThrow();
    expect(() => assertMainWireBaselineCheckCoverageV1([...baseline.checks, baseline.checks[0]!] as never)).toThrow();
  });

  it("retains contour measurements as warnings without inventing a wider normal corridor", () => {
    for (const id of ["waveform.LVP.rounded-not-plateau", "waveform.RVP.rounded-not-plateau"]) {
      const plateau = check(id, .02);
      const latePeak = { ...plateau, actual: .80083, minimum: .2, maximum: .8,
        unit: "ejection-peak-phase-fraction" };
      for (const value of [plateau, latePeak]) {
        expect(value.status).toBe("failed");
        expect(mainWireBaselineCheckWarnsV1(value)).toBe(true);
        expect(mainWireBaselineCheckBlocksV1(value)).toBe(false);
      }
    }
  });

  it("retains pressure, flow, ET and morphology as construction targets/guards", () => {
    for (const id of ["aortic-pressure.maximum", "systemic-forward-flow.cardiac-index",
      "aortic-valve.ejection-time", "waveform.LVP.single-peak-no-ringing"] ) {
      const source = baseline.checks.find((x) => x.checkId === id)!;
      expect(mainWireBaselineCheckBlocksV1(check(id, source.maximum + 1))).toBe(true);
    }
  });
  it("demotes method-mismatched timing and flow ratios only prospectively, without accepting invalid domains", () => {
    for (const id of ["mitral-flow.peak-e-to-a", "tricuspid-flow.peak-e-to-a", "timing.ict", "timing.irt",
      "timing.tei-index", "right-timing.ict", "right-timing.irt", "right-timing.tei-index"]) {
      const outlier = check(id, baseline.checks.find(c => c.checkId === id)!.maximum + .1);
      expect(mainWireBaselineCheckBlocksV1(outlier)).toBe(false);
      expect(mainWireBaselineCheckWarnsV1(outlier)).toBe(true);
      for (const policy of ["main-wire-standard70-baseline-evaluation-roles-v1", "main-wire-standard70-baseline-evaluation-roles-v2"]) {
        expect(mainWireBaselineCheckBlocksUnderPolicyV1(outlier, policy)).toBe(true);
      }
      for (const value of [NaN, Infinity, 0, -1]) expect(mainWireBaselineCheckBlocksV1(check(id, value))).toBe(true);
    }
    for (const c of baseline.checks) {
      const expected = c.checkId.endsWith("-dpdt") ? "reference-warning"
        : c.checkId === "settlement.period1" ? "numerical-quality"
        : c.checkId.startsWith("waveform.") || c.checkId.endsWith("-gradient") ? "construction-guard" : "physiological-target";
      expect(mainWireBaselineGateRoleUnderPolicyV1(c.checkId, "main-wire-standard70-baseline-evaluation-roles-v1")).toBe(expected);
      expect(mainWireBaselineGateRoleUnderPolicyV1(c.checkId, "main-wire-standard70-baseline-evaluation-roles-v2"))
        .toBe(c.checkId.endsWith(".rounded-not-plateau") ? "reference-warning" : expected);
    }
  });

  it("does not retroactively upgrade a historical report to the new admission policy", () => {
    expect(validateMainWireIntegratedStudioStandard70BaselineAssessmentV2(baseline)).toBe(baseline);
    const changed = structuredClone(baseline);
    changed.measurements.leftVentricle.maximumDpDtMmHgPerSec = 2502;
    const old = changed.checks.find((x) => x.checkId === "left-ventricle.maximum-dpdt")!;
    Object.assign(old, { actual: 2502, status: "failed" });
    expect(() => validateMainWireIntegratedStudioStandard70BaselineAssessmentV2(changed)).toThrow();
  });

  it("keeps the published policy admissible but never gives it the newer contour-warning semantics", () => {
    const report = currentReportFixtureV1();
    report.assessment.policyId = "main-wire-standard70-baseline-evaluation-roles-v1";
    expect(validateMainWireIntegratedStudioStandard70BaselineAssessmentV2(report)).toBe(report);
    report.measurements.LVP.peakPhase01 = .81;
    report.checks = buildMainWireIntegratedModelStandard70BaselineChecksV1(
      report.measurements as unknown as MainWireIntegratedModelStandard70BaselineMeasurementsV1, true);
    expect(() => validateMainWireIntegratedStudioStandard70BaselineAssessmentV2(report)).toThrow();
    report.assessment.policyId = MAIN_WIRE_BASELINE_GATE_ROLES_V1_ID;
    report.assessment.referenceWarningCheckIds = report.checks.filter(mainWireBaselineCheckWarnsV1).map(c => c.checkId);
    expect(validateMainWireIntegratedStudioStandard70BaselineAssessmentV2(report)).toBe(report);
    report.assessment.policyId = "unregistered-policy";
    expect(() => validateMainWireIntegratedStudioStandard70BaselineAssessmentV2(report)).toThrow(/Unknown baseline/);
  });

  it("admits a reference warning only with coherent current observations and numerical evidence", () => {
    const report = currentReportFixtureV1();
    expect(validateMainWireIntegratedStudioStandard70BaselineAssessmentV2(report)).toBe(report);
    expect(report.assessment.referenceWarningCheckIds).toEqual(["left-ventricle.maximum-dpdt"]);
  });

  it("rejects corrupted or missing current assessment evidence", () => {
    type Report = ReturnType<typeof currentReportFixtureV1>;
    const changes: ((r: Report) => void)[] = [
      r => { r.measurements.mitralFlow.peakEMlPerSec = Infinity; },
      r => { r.measurements.tricuspidFlow.peakAMlPerSec *= 2; },
      r => { r.periodicity.evidenceCycleIndices = []; },
      r => { r.periodicity.evidenceCycleIndices[1] = 1; },
      r => { r.periodicity.latestPeriod1MaximumNormalizedDelta = 100; },
      r => { r.measurements.timing.teiIndex = 0.5; },
      r => { r.assessment.referenceWarningCheckIds = []; },
      r => { r.assessment.pressureRateQuality.grids.coarse.checkpointSha256 = "e".repeat(64); },
      r => { r.assessment.pressureRateQuality.checks.pop(); },
      r => { r.preloadReserve.settlement.hypervolemic.maximumRecentRedistributedVolumeMl = 1; },
      r => { r.preloadReserve.endDiastolicDefinition = "maximum-volume"; },
      r => { r.assessment.relaxationTau.weiss.tauMs = NaN; },
      r => { r.assessment.relaxationTau.window.durationSec = -1; },
    ];
    for (const change of changes) {
      const report = currentReportFixtureV1();
      change(report);
      expect(() => validateMainWireIntegratedStudioStandard70BaselineAssessmentV2(report)).toThrow();
    }
  });
});

// Synthetic metadata for corruption tests, not a re-certification of the saved baseline.
function currentReportFixtureV1() {
  const report = structuredClone(baseline);
  const m = report.measurements;
  m.leftVentricle.maximumDpDtMmHgPerSec = 2502;
  m.timing.teiIndex = (m.timing.ictSec + m.timing.irtSec) / m.aorticValve.ejectionTimeSec;
  m.rightTiming.teiIndex = (m.rightTiming.ictSec + m.rightTiming.irtSec) / m.pulmonaryValve.ejectionTimeSec;
  const checks = buildMainWireIntegratedModelStandard70BaselineChecksV1(m as unknown as MainWireIntegratedModelStandard70BaselineMeasurementsV1, true);
  const rateChecks = checks.filter(c => c.checkId.endsWith("-dpdt")).map(c => {
    const peak = { status: "passed", issue: null, reportedMmHgPerSec: c.actual, observedMmHgPerSec: c.actual,
      peakStartTimeSec: 0.1, peakEndTimeSec: 0.101, peakPhase01: 0.2,
      previousSameSignFraction: 0.8, nextSameSignFraction: 0.8 };
    return { checkId: c.checkId, status: "passed", relativeDifference: 0, coarse: { ...peak }, fine: { ...peak } };
  });
  const grid = { nominalDtSec: report.nominalDtSec, checkpointSha256: report.checkpoint.checkpointSha256,
    candidateIdentitySha256: "c".repeat(64), modelIdentity: MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_IDENTITY_V1 };
  const evidence = { policyId: MAIN_WIRE_FIXED_TONE_SETTLEMENT_V2.policyId, completedBeatCount: 4,
    maximumRecentRedistributedVolumeMl: 0.01, maximumRecentNormalizedOutputDelta: 0.01,
    maximumRecentNormalizedLandmarkDelta: 0.1, measurementDurationSec: 4 };
  return { ...report, checks,
    preloadReserve: { ...report.preloadReserve,
      protocolId: MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRELOAD_RESERVE_PROTOCOL_V2_ID,
      endDiastolicDefinition: "inlet-valve-closure",
      settlement: { center: { ...evidence }, hypovolemic: { ...evidence }, hypervolemic: { ...evidence } } },
    assessment: { policyId: MAIN_WIRE_BASELINE_GATE_ROLES_V1_ID, observationMethodId: MAIN_WIRE_BASELINE_OBSERVATION_V2_ID,
      referenceWarningCheckIds: ["left-ventricle.maximum-dpdt"],
      relaxationTau: { methodId: MAIN_WIRE_RELAXATION_TAU_V1_ID, status: "measured", issue: null,
        window: { startTimeSec: .4, endTimeSec: .45, durationSec: .05, sampleCount: 26,
          nextEdpMmHg: 10, pressureDropMmHg: 50, maximumStepSec: .002 },
        weiss: { tauMs: 35, asymptoteMmHg: 0, rSquared: 1, pressureRmseMmHg: 0, normalizedPressureRmse: 0 },
        glantz: null, sensitivityStatus: "unavailable", referenceStatus: "not-above-prolongation-reference",
        relaxationTrace: { maximumDipAndRecoveryMmHg: 0, maximumRiseFromRunningMinimumMmHg: 0, excursions: [] },
        endpointSensitivity: { shortenedWindowTauMs: 35, relativeDifference: 0 } },
      pressureRateQuality: { methodId: MAIN_WIRE_BASELINE_PRESSURE_RATE_QUALITY_V1_ID,
        status: "passed", issue: null, policy: MAIN_WIRE_BASELINE_PRESSURE_RATE_QUALITY_POLICY_V1,
        grids: { coarse: { ...grid }, fine: { ...grid, nominalDtSec: grid.nominalDtSec / 2, checkpointSha256: "f".repeat(64) } },
        checks: rateChecks } },
  };
}
