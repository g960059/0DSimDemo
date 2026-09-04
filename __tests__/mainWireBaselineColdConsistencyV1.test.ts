import { describe, expect, it } from "vitest";
import { MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_IDENTITY_V1 } from
  "@/engine/myocardium/MainWireIntegratedModelStandard70CheckpointV1";
import { evaluateMainWireBaselineColdConsistencyV1, assertMainWireBaselineColdConsistencyV1,
  MAIN_WIRE_BASELINE_COLD_CONSISTENCY_V1_ID,
  type MainWireBaselineColdConsistencyInputV1, type MainWireBaselineColdConsistencySourceV1 } from
  "@/analysis/methods/mainWire/MainWireBaselineColdConsistencyV1";

describe("baseline cold/warm operating-point consistency V1", () => {
  it("compares twelve bound observations without mutation, ODE execution or a physiological claim", () => {
    const input = fixtureV1(), before = JSON.stringify(input);
    const report = evaluateMainWireBaselineColdConsistencyV1(input);
    expect(report).toMatchObject({ methodId: MAIN_WIRE_BASELINE_COLD_CONSISTENCY_V1_ID, status: "passed", issue: null,
      policy: { physiologicalNormalityClaimed: false,
        comparison: "same-dt-initialization-consistency-not-unique-equilibrium-or-accuracy-proof" } });
    expect(report.checks).toHaveLength(12);
    expect(report.checks.every((c) => c.absoluteDifference === 0)).toBe(true);
    expect(report.sources.warm.requestIdentitySha256).not.toBe(report.sources.cold.requestIdentitySha256);
    const persisted = JSON.parse(JSON.stringify(report));
    expect(persisted).toEqual(report);
    expect(() => assertMainWireBaselineColdConsistencyV1(persisted, input)).not.toThrow();
    expect(() => assertMainWireBaselineColdConsistencyV1(persisted, { cold: input.cold })).not.toThrow();
    expect(JSON.stringify(input)).toBe(before);
  });

  it.each(Array.from({ length: 12 }, (_, i) => i))("uses an inclusive declared tolerance for observation %i", (index) => {
    const base = fixtureV1();
    // CI uses its absolute floor in this fixture so the boundary is not self-referential.
    if (index === 3) { setValueV1(base.warm, 3, 1); setValueV1(base.cold, 3, 1); }
    const original = evaluateMainWireBaselineColdConsistencyV1(base).checks[index];
    for (const [scale, expected] of [[0.99, "passed"], [1, "passed"], [1.001, "failed"]] as const) {
      const input = cloneV1(base);
      setValueV1(input.cold, index, original.cold + original.tolerance * scale);
      const report = evaluateMainWireBaselineColdConsistencyV1(input);
      expect(report.status).toBe(expected);
      expect(report.checks[index].status).toBe(expected);
    }
  });

  it("converts the existing CO absolute floor through BSA and uses a symmetric relative CI scale", () => {
    const input = fixtureV1();
    setValueV1(input.warm, 3, 1); setValueV1(input.cold, 3, 1);
    expect(evaluateMainWireBaselineColdConsistencyV1(input).checks[3].tolerance).toBe(0.05 / 1.9);
    setValueV1(input.warm, 3, 4); setValueV1(input.cold, 3, 4.04);
    const report = evaluateMainWireBaselineColdConsistencyV1(input);
    expect(report.checks[3]).toMatchObject({ tolerance: 0.0404, status: "passed" });
    setValueV1(input.cold, 3, 4.05);
    expect(evaluateMainWireBaselineColdConsistencyV1(input).checks[3].status).toBe("failed");
  });

  it("reserves two same-grid steps for ET and does not treat a refined grid as a cold failure", () => {
    const input = fixtureV1();
    for (const side of [input.warm, input.cold]) {
      mutableV1(side).evaluation.nominalDtSec = 0.001;
      mutableV1(side).evaluation.exactResult.nominalDtSec = 0.001;
    }
    expect(evaluateMainWireBaselineColdConsistencyV1(input).checks[10].tolerance).toBe(0.002);
    mutableV1(input.cold).evaluation.nominalDtSec = 0.002;
    mutableV1(input.cold).evaluation.exactResult.nominalDtSec = 0.002;
    expect(evaluateMainWireBaselineColdConsistencyV1(input)).toMatchObject({ status: "unresolved", issue: "same-dt-required", checks: [] });
  });

  it("allows only negligible beat-duration roundoff between different absolute clocks", () => {
    const input = fixtureV1(), beat = mutableV1(input.cold).evaluation.exactResult.checkpoint.baseStandardCheckpointV2.completedBeatMetrics;
    beat.endTimeSec = beat.durationSec = 1 + 1e-12;
    expect(evaluateMainWireBaselineColdConsistencyV1(input).status).toBe("passed");
    beat.endTimeSec = beat.durationSec = 1 + 1e-6;
    expect(evaluateMainWireBaselineColdConsistencyV1(input).issue).toBe("body-size-or-beat-clock-mismatch");
  });

  it("requires accepted P1, actual cold initialization, and internally agreeing exact metadata", () => {
    for (const mutate of [
      (v: any) => { v.evaluation.status = "nonsettled-or-event-change"; },
      (v: any) => { v.evaluation.exactResult.classification.status = "period2-suspect"; },
      (v: any) => { v.evaluation.initializationKind = v.evaluation.exactResult.initializationKind = "standard70-exact-checkpoint"; },
      (v: any) => { v.evaluation.exactResult.initializationKind = "standard70-parameter-continuation"; },
      (v: any) => { v.evaluation.exactResult.nominalDtSec = 0.001; },
      (v: any) => { v.evaluation.exactResult.checkpoint.baseStandardCheckpointV2.completedBeatMetrics = null; },
    ]) {
      const input = fixtureV1(); mutate(mutableV1(input.cold));
      expect(evaluateMainWireBaselineColdConsistencyV1(input).status).toBe("unresolved");
    }
  });

  it("rejects candidate, model, policy, observation, body-size and beat-clock mismatches", () => {
    for (const mutate of [
      (v: any) => { v.candidateIdentitySha256 = "b".repeat(64); },
      (v: any) => { v.evaluation.exactModelIdentitySha256 = "b".repeat(64); },
      (v: any) => { v.evaluation.exactResult.checkpoint.modelIdentity.fixtureId = "different"; },
      (v: any) => { v.evaluation.constructionPolicyIdentitySha256 = "b".repeat(64); },
      (v: any) => { v.evaluation.constructionPolicyRevisionId = "different"; },
      (v: any) => { v.evaluation.exactResult.observation.methodId = "different"; },
      (v: any) => { delete v.evaluation.exactResult.observation; },
      (v: any) => { v.evaluation.exactResult.measurements.cardiacSizeAndFunction.bodySurfaceAreaM2 = 2; },
      (v: any) => { const b = v.evaluation.exactResult.checkpoint.baseStandardCheckpointV2.completedBeatMetrics; b.durationSec = b.endTimeSec = 0.9; },
      (v: any) => { v.evaluation.exactResult.checkpoint.checkpointSha256 = "unbound"; },
    ]) {
      const input = fixtureV1(); mutate(mutableV1(input.cold));
      expect(evaluateMainWireBaselineColdConsistencyV1(input).status).toBe("unresolved");
    }
  });

  it("requires every projected observation to bind its exact accepted beat", () => {
    for (let i = 0; i < 12; i++) {
      const input = fixtureV1();
      setValueV1(input.cold, i, NaN);
      const report = evaluateMainWireBaselineColdConsistencyV1(input);
      expect(report.status).toBe("unresolved");
      expect(JSON.parse(JSON.stringify(report))).toEqual(report);
    }
    const input = fixtureV1();
    mutableV1(input.cold).evaluation.exactResult.measurements.hemodynamicPressure.aortic.maximumMmHg += 0.01;
    expect(evaluateMainWireBaselineColdConsistencyV1(input).issue).toBe("measurement-exact-beat-binding-mismatch");
    mutableV1(input.cold).evaluation.exactResult.measurements.hemodynamicPressure.aortic.maximumMmHg -= 0.01;
    mutableV1(input.cold).evaluation.exactResult.checkpoint.baseStandardCheckpointV2.completedBeatMetrics.leftVentricularValveEventMetrics.endDiastolic = null;
    expect(evaluateMainWireBaselineColdConsistencyV1(input).status).toBe("unresolved");
  });

  it("recomputes persisted status, coverage, policy, arithmetic and source bindings", () => {
    const input = fixtureV1(), report = evaluateMainWireBaselineColdConsistencyV1(input);
    const mutations = [
      (v: any) => { v.status = "failed"; }, (v: any) => { v.methodId = "different"; },
      (v: any) => { v.policy.maximumAorticPressureDifferenceMmHg = 100; },
      (v: any) => { v.checks.pop(); }, (v: any) => { v.checks[1] = v.checks[0]; },
      (v: any) => { v.checks[0].tolerance = 10; }, (v: any) => { v.checks[0].absoluteDifference = 1; },
      (v: any) => { v.checks[0].cold += 0.1; },
      (v: any) => { v.sources.cold.values["aortic-pressure.maximum"] += 0.1; },
      (v: any) => { v.sources.cold.nominalDtSec /= 2; },
      (v: any) => { v.sources.cold.initializationKind = "standard70-exact-checkpoint"; },
    ];
    for (const mutate of mutations) {
      const changed = cloneV1(report); mutate(changed);
      expect(() => assertMainWireBaselineColdConsistencyV1(changed)).toThrow();
    }
    for (const mutate of [
      (v: any) => { v.evaluation.requestIdentitySha256 = "b".repeat(64); },
      (v: any) => { v.evaluation.exactResult.checkpoint.checkpointSha256 = "b".repeat(64); },
      (v: any) => { setValueV1(v, 0, 110.1); },
    ]) {
      const changed = cloneV1(input.cold); mutate(changed);
      expect(() => assertMainWireBaselineColdConsistencyV1(report, { cold: changed })).toThrow("binding");
    }
    const failedInput = fixtureV1(); setValueV1(failedInput.cold, 0, 111);
    expect(() => assertMainWireBaselineColdConsistencyV1(evaluateMainWireBaselineColdConsistencyV1(failedInput))).toThrow();
  });
});

function fixtureV1(): MainWireBaselineColdConsistencyInputV1 {
  const source = (cold: boolean) => ({ candidateIdentitySha256: "a".repeat(64), evaluation: {
    status: "accepted", requestIdentitySha256: (cold ? "1" : "2").repeat(64), exactModelIdentitySha256: "3".repeat(64),
    constructionPolicyIdentitySha256: "4".repeat(64), constructionPolicyRevisionId: "policy-v2", evaluatorId: "evaluator-v2",
    objectiveAnalysisMethodId: "objective-v1", safetyAnalysisMethodId: "safety-v1", initializationKind: cold ? "cold" : "standard70-exact-checkpoint",
    nominalDtSec: 0.002, exactResult: { nominalDtSec: 0.002, initializationKind: cold ? "cold" : "standard70-exact-checkpoint",
      classification: { status: "period1-converged" }, observation: { methodId: "observation-v2" }, measurements: {
        hemodynamicPressure: { aortic: { maximumMmHg: 110, minimumMmHg: 75 }, centralVenousMeanMmHg: 4, pcwpSurrogateMeanMmHg: 10 },
        cardiacSizeAndFunction: { bodySurfaceAreaM2: 1.9, systemicForwardFlow: { cardiacOutputLPerMin: 5.7, cardiacIndexLPerMinPerM2: 3 },
          leftVentricle: { endDiastolicVolumeMl: 140, endSystolicVolumeMl: 60 }, rightVentricle: { endDiastolicVolumeMl: 150, endSystolicVolumeMl: 70 } },
        aorticValve: { ejectionTimeSec: 0.27 }, pulmonaryValve: { ejectionTimeSec: 0.28 } },
      checkpoint: { modelIdentity: { ...MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_IDENTITY_V1 }, checkpointSha256: (cold ? "5" : "6").repeat(64),
        baseStandardCheckpointV2: { completedBeatMetrics: { startTimeSec: 0, endTimeSec: 1, durationSec: 1, meanAorticPressureMmHg: 90,
          nativeLeftCardiacOutputLPerMin: 5.7, pressureSummaries: { Ao: { maximumMmHg: 110, minimumMmHg: 75, timeWeightedMeanMmHg: 90 },
            RA: { timeWeightedMeanMmHg: 4 }, LA: { timeWeightedMeanMmHg: 10 } },
          leftVentricularValveEventMetrics: { endDiastolic: { volumeMl: 140 }, endSystolic: { volumeMl: 60 } },
          rightVentricularValveEventMetrics: { endDiastolic: { volumeMl: 150 }, endSystolic: { volumeMl: 70 } },
          valveForwardPressureGradients: { AoV: { forwardFlowDurationSec: 0.27 }, PV: { forwardFlowDurationSec: 0.28 } } } } } } } });
  // Only readback fields used by this pure observer; no executable exact state.
  return { warm: source(false), cold: source(true) } as unknown as MainWireBaselineColdConsistencyInputV1;
}

function setValueV1(source: MainWireBaselineColdConsistencySourceV1, index: number, value: number): void {
  const q = mutableV1(source).evaluation.exactResult, m = q.measurements, b = q.checkpoint.baseStandardCheckpointV2.completedBeatMetrics;
  if (index === 0) m.hemodynamicPressure.aortic.maximumMmHg = b.pressureSummaries.Ao.maximumMmHg = value;
  else if (index === 1) m.hemodynamicPressure.aortic.minimumMmHg = b.pressureSummaries.Ao.minimumMmHg = value;
  else if (index === 2) b.meanAorticPressureMmHg = b.pressureSummaries.Ao.timeWeightedMeanMmHg = value;
  else if (index === 3) { m.cardiacSizeAndFunction.systemicForwardFlow.cardiacIndexLPerMinPerM2 = value;
    m.cardiacSizeAndFunction.systemicForwardFlow.cardiacOutputLPerMin = b.nativeLeftCardiacOutputLPerMin = value * m.cardiacSizeAndFunction.bodySurfaceAreaM2; }
  else if (index === 4) m.hemodynamicPressure.centralVenousMeanMmHg = b.pressureSummaries.RA.timeWeightedMeanMmHg = value;
  else if (index === 5) m.hemodynamicPressure.pcwpSurrogateMeanMmHg = b.pressureSummaries.LA.timeWeightedMeanMmHg = value;
  else if (index < 10) { const side = index < 8 ? "leftVentricle" : "rightVentricle", event = index % 2 === 0 ? "endDiastolic" : "endSystolic";
    m.cardiacSizeAndFunction[side][`${event}VolumeMl`] = value;
    b[side === "leftVentricle" ? "leftVentricularValveEventMetrics" : "rightVentricularValveEventMetrics"][event].volumeMl = value; }
  else { m[index === 10 ? "aorticValve" : "pulmonaryValve"].ejectionTimeSec = value;
    b.valveForwardPressureGradients[index === 10 ? "AoV" : "PV"].forwardFlowDurationSec = value; }
}
function mutableV1(value: unknown): any { return value; }
function cloneV1<T>(value: T): T { return JSON.parse(JSON.stringify(value)); }
