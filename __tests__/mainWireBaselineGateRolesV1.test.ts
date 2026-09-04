import { describe, expect, it } from "vitest";
import baseline from "@/studio/integrations/mainWireIntegratedV3/algebraic-pulmonary-root-standard70-baseline-validation.json";
import { assertMainWireBaselineCheckCoverageV1, mainWireBaselineCheckBlocksV1,
  mainWireBaselineCheckWarnsV1, mainWireBaselineGateRoleV1 } from
  "@/analysis/policies/mainWire/MainWireBaselineGateRolesV1";
import { validateMainWireIntegratedStudioStandard70BaselineValidationV1 } from
  "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioStandard70BaselineValidationV1";
import { MAIN_WIRE_BASELINE_GATE_ROLES_V1_ID } from "@/analysis/policies/mainWire/MainWireBaselineGateRolesV1";
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
    expect(() => mainWireBaselineGateRoleV1("unregistered" )).toThrow();
    expect(() => assertMainWireBaselineCheckCoverageV1(baseline.checks.slice(1) as never)).toThrow();
    expect(() => assertMainWireBaselineCheckCoverageV1([...baseline.checks, baseline.checks[0]!] as never)).toThrow();
  });

  it("retains the pressure, flow, timing, and morphology construction guards", () => {
    for (const id of ["aortic-pressure.maximum", "systemic-forward-flow.cardiac-index",
      "timing.tei-index", "waveform.LVP.single-peak-no-ringing"] ) {
      const source = baseline.checks.find((x) => x.checkId === id)!;
      expect(mainWireBaselineCheckBlocksV1(check(id, source.maximum + 1))).toBe(true);
    }
  });

  it("does not retroactively upgrade a historical report to the new admission policy", () => {
    expect(validateMainWireIntegratedStudioStandard70BaselineValidationV1(baseline)).toBe(baseline);
    const changed = structuredClone(baseline);
    changed.measurements.leftVentricle.maximumDpDtMmHgPerSec = 2502;
    const old = changed.checks.find((x) => x.checkId === "left-ventricle.maximum-dpdt")!;
    Object.assign(old, { actual: 2502, status: "failed" });
    expect(() => validateMainWireIntegratedStudioStandard70BaselineValidationV1(changed)).toThrow();
  });

  it("admits a reference warning only with coherent current observations and numerical evidence", () => {
    const report = currentReportFixtureV1();
    expect(validateMainWireIntegratedStudioStandard70BaselineValidationV1(report)).toBe(report);
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
    ];
    for (const change of changes) {
      const report = currentReportFixtureV1();
      change(report);
      expect(() => validateMainWireIntegratedStudioStandard70BaselineValidationV1(report)).toThrow();
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
      pressureRateQuality: { methodId: MAIN_WIRE_BASELINE_PRESSURE_RATE_QUALITY_V1_ID,
        status: "passed", issue: null, policy: MAIN_WIRE_BASELINE_PRESSURE_RATE_QUALITY_POLICY_V1,
        grids: { coarse: { ...grid }, fine: { ...grid, nominalDtSec: grid.nominalDtSec / 2, checkpointSha256: "f".repeat(64) } },
        checks: rateChecks } },
  };
}
