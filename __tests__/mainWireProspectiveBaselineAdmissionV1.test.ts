import { describe, expect, it } from "vitest";
import launch from "@/data/model-baselines/standard70-launch-baseline.json";
import { assessMainWireProspectiveRestV1 as rest, MAIN_WIRE_PROSPECTIVE_BASELINE_ADMISSION_V1 as policy } from "@/analysis/policies/mainWire/MainWireProspectiveBaselineAdmissionV1";
import { qualifyMainWirePreloadReserveAdmissionV1 as reserve } from "@/analysis/policies/mainWire/MainWirePreloadReserveAdmissionV1";
import { MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRELOAD_RESERVE_PROTOCOL_V2_ID } from "@/analysis/methods/mainWire/MainWirePressureVolumeProtocolsV3";
import { MAIN_WIRE_FIXED_TONE_SETTLEMENT_V2 } from "@/analysis/methods/mainWire/MainWireFixedToneSettlementV2";
import type { MainWireIntegratedModelFormalPreloadReserveMeasurementV2 as Reserve } from "@/analysis/methods/mainWire/MainWirePressureVolumeProtocolsV3";
import type { MainWireIntegratedModelCompletedBeatMetricsV3 as Beat } from "@/engine/myocardium/MainWireIntegratedModelBeatMetricsV3";
import type { MainWireIntegratedModelStandard70BaselineCheckV1 as Check } from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard70BaselineValidationV1";
type Mutable<T> = { -readonly [K in keyof T]: Mutable<T[K]> };
function beat(): Mutable<Beat> {
  const b = structuredClone(launch.qualificationCheckpoint.baseStandardCheckpointV2.completedBeatMetrics) as Mutable<Beat>;
  for (const v of [b.leftVentricularValveEventMetrics, b.rightVentricularValveEventMetrics]) {
    v.endDiastolic!.volumeMl = 140; v.endSystolic!.volumeMl = 60;
    v.endDiastolic!.absolutePressureMmHg = 11; v.endDiastolic!.transmuralPressureMmHg = 11;
  }
  for (const [id, mean, min, max] of [["Ao", 92, 77, 111], ["PA", 18, 12.04, 26], ["RA", 3, 1, 7], ["LA", 8, 4, 12]] as const) {
    b.pressureSummaries[id] = { timeWeightedMeanMmHg: mean, minimumMmHg: min, maximumMmHg: max, pulseMmHg: max - min };
  }
  for (const id of ["AoV", "PV"] as const) b.valveFlowVolumes[id] = { forwardVolumeMl: 85, reverseVolumeMl: 0, netVolumeMl: 85, sameValveRegurgitantFraction: 0 };
  return b;
}
const checks = () => launch.validationReport.checks.map(c => ({ ...c, actual: (c.minimum + c.maximum) / 2, status: "passed" })) as Check[];
function measurement(): Mutable<Reserve> {
  const response = (direction: "hypovolemic" | "hypervolemic") => {
    const s = direction === "hypovolemic" ? -1 : 1;
    return {
      endpointDirection: direction, baselineFillingPressureMmHg: 6, endpointFillingPressureMmHg: 6 + s * .5,
      directionalFillingPressureChangeMmHg: .5, baselineCardiacOutputLPerMin: 5, endpointCardiacOutputLPerMin: 5 + s,
      directionalCardiacOutputChangeLPerMin: 1, directionalCardiacOutputChangeFraction01: .2, cardiacOutputSlopeLPerMinPerMmHg: 2,
      baselineEndDiastolicVolumeMl: 140, endpointEndDiastolicVolumeMl: 140 + s * 28,
      directionalEndDiastolicVolumeChangeMl: 28, directionalEndDiastolicVolumeChangeFraction01: .2,
      baselineEndDiastolicTransmuralPressureMmHg: 10, endpointEndDiastolicTransmuralPressureMmHg: 10 + s,
      directionalEndDiastolicTransmuralPressureChangeMmHg: 1, endDiastolicVolumeResponseMlPerMmHg: 28,
    };
  };
  const settled = { policyId: MAIN_WIRE_FIXED_TONE_SETTLEMENT_V2.policyId, completedBeatCount: 4,
    maximumRecentRedistributedVolumeMl: .01, maximumRecentNormalizedOutputDelta: .01,
    maximumRecentNormalizedLandmarkDelta: .1, measurementDurationSec: 5 };
  return { protocolId: MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRELOAD_RESERVE_PROTOCOL_V2_ID,
    endDiastolicDefinition: "inlet-valve-closure", sourceGlobalTbvMl: 5000,
    hypovolemicGlobalTbvMl: 4400, hypovolemicGlobalTbvScale: .88, hypervolemicGlobalTbvMl: 5600, hypervolemicGlobalTbvScale: 1.12,
    left: { hypovolemic: response("hypovolemic"), hypervolemic: response("hypervolemic") },
    right: { hypovolemic: response("hypovolemic"), hypervolemic: response("hypervolemic") },
    settlement: { center: { ...settled }, hypovolemic: { ...settled }, hypervolemic: { ...settled } } };
}

describe("prospective rest admission, separate from published normality corridors", () => {
  it("keeps strict phasic PAP warnings and a conservative demographic rule without exceptions", () => {
    const r = rest(beat(), checks(), 1.9);
    expect(r.status).toBe("passed");
    expect(r.comparison.entries.find(e => e.metricId === "pulmonary-artery-pressure.minimum")!.comparisons[0]!.status).toBe("outside-source-range");
    expect(policy.operating).toHaveLength(6);
    expect(policy.operating.every(c => c.sourceId && c.locator && c.basis)).toBe(true);
    expect(policy.operating.filter(c => c.metricId.startsWith("aortic-pressure")).every(c => c.basis.includes("NOT-source-derived"))).toBe(true);
    const b = beat(); b.leftVentricularValveEventMetrics.endSystolic!.volumeMl = 70.3;
    expect(rest(b, checks(), 1.9).status).toBe("demographic-review-required");
    b.leftVentricularValveEventMetrics.endSystolic = null;
    expect(rest(b, checks(), 1.9).status).toBe("unresolved");
  });
  it("uses net CI and no independent SVI constraint", () => {
    const b = beat(); b.valveFlowVolumes.AoV.reverseVolumeMl = 60; b.valveFlowVolumes.AoV.netVolumeMl = 25;
    expect(rest(b, checks(), 1.9).operating.find(c => c.metricId === "systemic-net-flow.cardiac-index")!.status).toBe("failed");
    expect(policy.operating.some(c => c.metricId.includes("stroke-volume-index"))).toBe(false);
  });
  it("retains numerical/ringing/gradient and invalid-warning holds", () => {
    for (const id of ["settlement.period1", "waveform.LVP.single-peak-no-ringing", "aortic-valve.mean-gradient"]) {
      const c = checks(); const target = c.find(c => c.checkId === id)!;
      Object.assign(target, { actual: target.maximum + 1, status: "failed" });
      expect(rest(beat(), c, 1.9).status).toBe("failed");
    }
    const c = checks(); Object.assign(c.find(c => c.checkId === "left-ventricle.maximum-dpdt")!, { actual: 2700, status: "failed" });
    expect(rest(beat(), c, 1.9).status).toBe("passed");
    Object.assign(c.find(c => c.checkId === "left-ventricle.maximum-dpdt")!, { actual: NaN });
    expect(rest(beat(), c, 1.9).status).toBe("failed");
    expect(() => rest(beat(), c.slice(1), 1.9)).toThrow();
  });
  it("preserves the exact >16 inequality but labels native end-filling mapping as engineering", () => {
    const b = beat(); b.leftVentricularValveEventMetrics.endDiastolic!.absolutePressureMmHg = 16;
    expect(rest(b, checks(), 1.9).status).toBe("passed");
    b.leftVentricularValveEventMetrics.endDiastolic!.absolutePressureMmHg = 16.000001;
    expect(rest(b, checks(), 1.9).status).toBe("failed");
  });
  it("does not inherit unsupported ET, PA extrema or LA-mean gate corridors", () => {
    const c = checks();
    for (const x of c.filter(c => ["aortic-valve.ejection-time", "pulmonary-valve.ejection-time", "pcwp-surrogate.mean"].includes(c.checkId))) {
      Object.assign(x, { status: "failed", actual: x.maximum * 1.1 });
    }
    expect(rest(beat(), c, 1.9).status).toBe("passed");
  });
});

describe("settled paired-grid preload admission", () => {
  it("qualifies sub-1mmHg resolved excursions without upgrading the research screen", () => {
    const a = measurement(), before = JSON.stringify(a), r = reserve(a, structuredClone(a));
    expect(r.status).toBe("passed");
    expect(r.responses.every(r => r.screens.every(s => !s.baselineAdmissionEstablished && !s.historicalPressureAmplitude.passed))).toBe(true);
    expect(JSON.stringify(a)).toBe(before);
  });
  it("requires reservoir settlement, source TBV and coherent center/direction", () => {
    const mutations = [
      (r: Mutable<Reserve>) => { r.settlement.hypervolemic.maximumRecentRedistributedVolumeMl = .06; },
      (r: Mutable<Reserve>) => { Object.assign(r, { hypervolemicGlobalTbvScale: 1.2 }); },
      (r: Mutable<Reserve>) => { r.hypovolemicGlobalTbvMl = 4500; },
      (r: Mutable<Reserve>) => { r.left.hypervolemic.baselineFillingPressureMmHg = 7; },
      (r: Mutable<Reserve>) => { r.right.hypovolemic.endpointDirection = "hypervolemic"; },
      (r: Mutable<Reserve>) => { r.right.hypovolemic.directionalCardiacOutputChangeFraction01 = NaN; },
    ];
    for (const mutate of mutations) { const b = measurement(); mutate(b); expect(reserve(measurement(), b).status).not.toBe("passed"); }
  });
  it("passes nonzero non-cancelling two-grid sensitivities well below the margins", () => {
    const a = measurement(), b = measurement();
    for (const d of ["hypovolemic", "hypervolemic"] as const) {
      const r = b.right[d], s = d === "hypovolemic" ? -1 : 1;
      r.endpointFillingPressureMmHg += s * .01;
      r.endpointCardiacOutputLPerMin += s * .01;
      r.directionalFillingPressureChangeMmHg = s * (r.endpointFillingPressureMmHg - r.baselineFillingPressureMmHg);
      r.directionalCardiacOutputChangeLPerMin = s * (r.endpointCardiacOutputLPerMin - r.baselineCardiacOutputLPerMin);
      r.directionalCardiacOutputChangeFraction01 = r.directionalCardiacOutputChangeLPerMin / r.baselineCardiacOutputLPerMin;
      r.cardiacOutputSlopeLPerMinPerMmHg = r.directionalCardiacOutputChangeLPerMin / r.directionalFillingPressureChangeMmHg;
    }
    const r = reserve(a, b);
    expect(r.status).toBe("passed");
    expect(r.responses[2]!.margins[0]!.sensitivity).toBeCloseTo(.01);
    expect(r.responses[2]!.ratioMargins[0]!.sensitivity).toBeCloseTo(.01);
  });
  it("detects cancelling center/endpoint pressure shifts", () => {
    const b = measurement();
    for (const d of ["hypovolemic", "hypervolemic"] as const) {
      b.right[d].baselineFillingPressureMmHg += .3; b.right[d].endpointFillingPressureMmHg += .3;
    }
    const r = reserve(measurement(), b);
    expect(r.status).toBe("failed");
    expect(r.responses[2]!.margins[0]!.sensitivity).toBeCloseTo(.6);
  });
  it("uses weighted endpoint sensitivity for fractional floors rather than cancelled ratios", () => {
    const a = measurement(), b = measurement();
    for (const d of ["hypovolemic", "hypervolemic"] as const) {
      const s = d === "hypovolemic" ? -1 : 1;
      for (const r of [a, b]) Object.assign(r.left[d], { endpointCardiacOutputLPerMin: 5 + s * .2,
        directionalCardiacOutputChangeLPerMin: .2, directionalCardiacOutputChangeFraction01: .04, cardiacOutputSlopeLPerMinPerMmHg: .4 });
      Object.assign(b.left[d], { baselineCardiacOutputLPerMin: 5.1, endpointCardiacOutputLPerMin: 5.1 + s * .2,
        directionalCardiacOutputChangeFraction01: .2 / 5.1 });
    }
    const r = reserve(a, b);
    expect(r.status).toBe("failed");
    expect(r.responses[0]!.ratioMargins[0]!.sensitivity).toBeCloseTo(.197);
    expect(r.responses[1]!.ratioMargins[0]!.sensitivity).toBeCloseTo(.203);
  });
  it("does not call a zero-margin floor numerically robust", () => {
    const a = measurement();
    for (const d of ["hypovolemic", "hypervolemic"] as const) {
      Object.assign(a.left[d], { endpointEndDiastolicTransmuralPressureMmHg: 10 + (d === "hypovolemic" ? -.25 : .25),
        directionalEndDiastolicTransmuralPressureChangeMmHg: .25, endDiastolicVolumeResponseMlPerMmHg: 112 });
    }
    expect(reserve(a, structuredClone(a)).status).toBe("failed");
    // Redundant serialized arithmetic cannot manufacture a positive margin.
    for (const d of ["hypovolemic", "hypervolemic"] as const) a.left[d].directionalEndDiastolicTransmuralPressureChangeMmHg += 1e-15;
    expect(reserve(a, structuredClone(a)).status).toBe("failed");
  });
});
