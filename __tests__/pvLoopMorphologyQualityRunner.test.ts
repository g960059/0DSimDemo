import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import targetPack from "@/data/myocardium/targets/pv-loop-morphology-quality-v1.json";
import {
  buildMorphologyEvidenceSummaryForTest,
  buildInitialSummary,
  classifyPvLoopPhaseForTest,
  metricRowsForSamplesForTest,
  metricRowsToCsv,
  PV_LOOP_CLASSIFICATION_PROFILE,
  runPvLoopMorphologyDiagnosticForTest,
  summaryToMarkdownForTest,
  type AnalysisSample,
  type ClampEventRow,
  type MetricRow,
} from "@/tools/myocardium/verifyPvLoopMorphologyQuality";

function sample(overrides: Partial<AnalysisSample>): AnalysisSample {
  return {
    sourceIndex: 0,
    tSec: 0,
    theta: 0.5,
    beatIndex: 1,
    LVP: 8,
    RVP: 3,
    LAP: 10,
    RAP: 5,
    AoP: 90,
    PAP: 15,
    VLV: 120,
    VRV: 120,
    QMV: 80,
    QAo: 0,
    QTV: 80,
    QPV: 0,
    xiMV: 1,
    xiAoV: 0,
    xiTV: 1,
    xiPV: 0,
    aLA: 0,
    aRA: 0,
    ELV_active: 0,
    ERV_active: 0,
    LVPressureFloorHit01: 0,
    RVPressureFloorHit01: 0,
    AoV_qDotRaw: 0,
    AoV_qDotPost: 0,
    AoV_qDotClampHit01: 0,
    AoV_qDotClampImpulse: 0,
    AoV_diodeImpulse: 0,
    AoV_flowClampImpulse: 0,
    dLVPdt: 0,
    dRVPdt: 0,
    dVLVdt: 10,
    dVRVdt: 10,
    ...overrides,
  };
}

function metricRow(overrides: Partial<MetricRow>): MetricRow {
  return {
    caseId: "normal-sinus",
    branchId: "1",
    branchName: "Normal",
    beatIndex: 1,
    chamber: "LV",
    metricId: "mvOpenLowerLimbRoughness",
    samplingMode: "raw",
    transitionPolicy: "transition-excluded-core",
    value: 0,
    unit: "dimensionless",
    samplingInvarianceDelta: 0,
    classificationLabels: [],
    ...overrides,
  };
}

function clampRow(overrides: Partial<ClampEventRow>): ClampEventRow {
  return {
    caseId: "normal-sinus",
    branchId: "1",
    branchName: "Normal",
    beatIndex: 1,
    chamber: "LV",
    signalId: "AoV_qDotClampHit01",
    eventType: "hit",
    timeSec: 12.1,
    theta: 0.2,
    value: 1,
    granularity: "per-sample",
    availability: "available",
    note: "",
    ...overrides,
  };
}

describe("PV-loop morphology quality runner helpers", () => {
  it("classifies core filling and ejection samples without forcing transitions", () => {
    expect(classifyPvLoopPhaseForTest(sample({}), "LV")).toBe("filling");
    expect(classifyPvLoopPhaseForTest(sample({
      xiMV: 0,
      xiAoV: 1,
      QMV: 0,
      QAo: 120,
      dVLVdt: -20,
      dLVPdt: -5,
    }), "LV")).toBe("ejection");
  });

  it("keeps the run summary aligned to the diagnostic-only target contract", () => {
    const summary = buildInitialSummary();
    expect(summary.targetPackId).toBe("pv-loop-morphology-quality-v1");
    expect(summary.claimBoundary).toBe("diagnostic-only-no-model-change");
    expect(summary.runnerVersion).toBe("pv-loop-morphology-quality-runner-v1");
    expect(summary.samplingModes).toEqual(["raw", "uniformBeatGrid", "eventAlignedCore", "coarseSensitivity"]);
    expect(summary.measurementProfile).toMatchObject({
      dt: 0.001,
      requestedSampleHz: 240,
      resolvedRawSampleHz: 1000,
      rawSampleIntervalSec: 0.001,
    });
    expect(summary.derivativeProfile.pressureDerivative).toMatchObject({
      stencil: "centered-neighbor-difference; endpoints use nearest available neighbor",
      inputUnit: "mmHg",
      outputUnit: "Pa/s",
    });
    expect(summary.derivativeProfile.resampling).toMatchObject({
      uniformBeatGrid: "linear interpolation by normalized beat phase theta at 240 samples/beat",
      coarseSensitivity: "linear interpolation by normalized beat phase theta at 60 samples/beat",
      eventAlignedCore: "raw samples with transition samples excluded",
    });
    expect(summary.classificationProfile).toEqual(PV_LOOP_CLASSIFICATION_PROFILE);
    expect(summary.inputArtifactHashes["data/myocardium/targets/pv-loop-morphology-quality-v1.json"]).toMatch(/^[a-f0-9]{64}$/);
    expect(summary.signalAvailability.aovQDotRawM3PerSec2).toBe(true);
    expect(summary.signalAvailability.mvQDotRawM3PerSec2).toBe(false);
    expect(summary.guardrailResults.map((result) => result.id)).toContain("package-scripts-no-change");
    expect(summary.morphologyEvidence.scoringProfile.maxConfidence).toBe("medium");
    expect(summary.morphologyEvidence.evidenceGaps.map((gap) => gap.id)).toContain("filling-limb-root-cause-signal-gap");
  });

  it("summarizes root-cause hypotheses as correlations with explicit evidence gaps", () => {
    const evidence = buildMorphologyEvidenceSummaryForTest([
      metricRow({
        metricId: "mvOpenLowerLimbRoughness",
        value: 3,
        classificationLabels: ["filling-limb-artifact"],
      }),
      metricRow({
        metricId: "eventCorrelationWindowHitFraction",
        value: 0.8,
        classificationLabels: ["event-window-correlation", "event-sensitive"],
      }),
      metricRow({
        metricId: "qDotClampHitFraction",
        chamber: "LV",
        value: 0.75,
      }),
      metricRow({
        metricId: "lowerLimbKinkCount",
        samplingMode: "uniformBeatGrid",
        value: 4,
        samplingInvarianceDelta: 0.5,
        classificationLabels: ["sampling-sensitive"],
      }),
    ], [
      clampRow({ signalId: "AoV_qDotClampHit01", value: 1 }),
    ]);

    expect(evidence.observations.map((observation) => observation.id)).toEqual(expect.arrayContaining([
      "filling-limb-roughness",
      "event-window-correlation",
      "aov-qdot-clamp-activity",
      "sampling-sensitive-metrics",
    ]));

    const filling = evidence.rootCauseHypotheses.find((hypothesis) => hypothesis.id === "filling-event-window-correlation");
    expect(filling).toMatchObject({
      evidenceStatus: "insufficient-evidence",
      confidence: "low",
    });
    expect(filling?.missingSignals).toEqual(expect.arrayContaining([
      "mvQDotRawM3PerSec2",
      "perSampleDynamicFlowClampHits",
    ]));

    const aov = evidence.rootCauseHypotheses.find((hypothesis) => hypothesis.id === "aov-qdot-clamp-correlation");
    expect(aov).toMatchObject({
      evidenceStatus: "supported-correlation",
      confidence: "medium",
    });
    expect(evidence.evidenceGaps.map((gap) => gap.id)).toEqual(expect.arrayContaining([
      "filling-limb-root-cause-signal-gap",
      "ejection-limb-arterial-load-signal-gap",
    ]));
  });

  it("does not emit the RV filling chatter hypothesis from LV-only chatter evidence", () => {
    const evidence = buildMorphologyEvidenceSummaryForTest([
      metricRow({
        chamber: "LV",
        metricId: "mvOpenLowerLimbRoughness",
        value: 3,
        classificationLabels: ["filling-limb-artifact"],
      }),
      metricRow({
        chamber: "LV",
        metricId: "valveOpenCloseChatterCount",
        value: 2,
      }),
    ]);

    expect(evidence.rootCauseHypotheses.some((hypothesis) => (
      hypothesis.id === "rv-filling-valve-chatter-correlation"
    ))).toBe(false);
  });

  it("emits the RV filling chatter hypothesis only when RV roughness and chatter evidence are present", () => {
    const evidence = buildMorphologyEvidenceSummaryForTest([
      metricRow({
        chamber: "RV",
        metricId: "tvOpenLowerLimbRoughness",
        value: 3,
        classificationLabels: ["filling-limb-artifact"],
      }),
      metricRow({
        chamber: "RV",
        metricId: "valveOpenCloseChatterCount",
        value: 2,
      }),
    ]);

    const hypothesis = evidence.rootCauseHypotheses.find((candidate) => (
      candidate.id === "rv-filling-valve-chatter-correlation"
    ));

    expect(hypothesis).toMatchObject({
      evidenceStatus: "insufficient-evidence",
      confidence: "low",
    });
    expect(hypothesis?.supportingSignals).toContain("tricuspidValveOpen01");
  });

  it("renders morphology evidence status and gaps in summary markdown", () => {
    const summary = buildInitialSummary();
    summary.morphologyEvidence = buildMorphologyEvidenceSummaryForTest([
      metricRow({
        metricId: "mvOpenLowerLimbRoughness",
        value: 3,
        classificationLabels: ["filling-limb-artifact"],
      }),
      metricRow({
        metricId: "eventCorrelationWindowHitFraction",
        value: 0.8,
        classificationLabels: ["event-window-correlation", "event-sensitive"],
      }),
    ]);

    const markdown = summaryToMarkdownForTest(summary);

    expect(markdown).toContain("## Morphology Evidence");
    expect(markdown).toContain("filling-event-window-correlation");
    expect(markdown).toContain("insufficient-evidence");
    expect(markdown).toContain("filling-limb-root-cause-signal-gap");
  });

  it("emits metricId-granular CSV with samplingInvarianceDelta", () => {
    const rows: MetricRow[] = [{
      caseId: "normal-sinus",
      branchId: "1",
      branchName: "Normal",
      beatIndex: 1,
      chamber: "LV",
      metricId: "pvLoopArea",
      samplingMode: "uniformBeatGrid",
      transitionPolicy: "transition-excluded-core",
      value: 0.12,
      unit: "Pa*m3",
      samplingInvarianceDelta: 0.03,
      classificationLabels: ["diagnostic-only"],
    }];

    const csv = metricRowsToCsv(rows);

    expect(csv.split("\n")[0]).toContain("caseId,branchId,branchName,beatIndex,chamber,metricId,samplingMode,transitionPolicy,value,unit,samplingInvarianceDelta");
    expect(csv).toContain("normal-sinus,1,Normal,1,LV,pvLoopArea,uniformBeatGrid,transition-excluded-core,0.12,Pa*m3,0.03");
  });

  it("emits the v1 contract metric ids from generated metric rows", () => {
    const rows = metricRowsForSamplesForTest([
      sample({ sourceIndex: 0, tSec: 0.00, theta: 0.10, VLV: 110, VRV: 115, dVLVdt: 20, dVRVdt: 18 }),
      sample({ sourceIndex: 1, tSec: 0.01, theta: 0.20, VLV: 120, VRV: 124, dVLVdt: 20, dVRVdt: 18 }),
      sample({
        sourceIndex: 2,
        tSec: 0.02,
        theta: 0.35,
        xiMV: 0,
        xiAoV: 1,
        xiTV: 0,
        xiPV: 1,
        QMV: 0,
        QAo: 120,
        QTV: 0,
        QPV: 110,
        dVLVdt: -30,
        dVRVdt: -28,
      }),
      sample({
        sourceIndex: 3,
        tSec: 0.03,
        theta: 0.45,
        xiMV: 0,
        xiAoV: 1,
        xiTV: 0,
        xiPV: 1,
        QMV: 0,
        QAo: 100,
        QTV: 0,
        QPV: 96,
        dVLVdt: -24,
        dVRVdt: -22,
      }),
    ]);
    const metricIds = new Set(rows.map((row) => row.metricId));

    expect([...metricIds]).toEqual(expect.arrayContaining([
      "pvLoopArea",
      "phaseNormalizedRoughness",
      "phaseKinkCount",
      "eventCorrelationWindowHitFraction",
      "lvRvAsymmetryIndex",
    ]));
  });

  it("writes artifact headers that include the target-pack required fields", () => {
    const outDir = mkdtempSync(path.join(tmpdir(), "pv-loop-quality-"));
    try {
      const summary = runPvLoopMorphologyDiagnosticForTest(outDir, ["normal-sinus"]);
      expect(summary.errors).toEqual([]);
      expect(summary.measurementProfile).toMatchObject({
        requestedSampleHz: 240,
        resolvedRawSampleHz: 1000,
      });

      const phaseHeader = readFileSync(path.join(outDir, "per-beat-phase-samples.csv"), "utf8")
        .split("\n")[0].split(",");
      const metricHeader = readFileSync(path.join(outDir, "per-case-metrics.csv"), "utf8")
        .split("\n")[0].split(",");
      const runSummary = JSON.parse(readFileSync(path.join(outDir, "summary.json"), "utf8"));

      expect(phaseHeader).toEqual(expect.arrayContaining(
        targetPack.artifactSchemas.phaseSegmentationSeries.requiredFields,
      ));
      expect(phaseHeader).not.toContain("tSec");
      expect(metricHeader).toEqual(expect.arrayContaining(
        targetPack.artifactSchemas.perBeatMetricSummary.requiredFields,
      ));
      expect(runSummary.measurementProfile.resolvedRawSampleHz).toBe(1000);
      expect(runSummary.classificationProfile).toEqual(PV_LOOP_CLASSIFICATION_PROFILE);
    } finally {
      rmSync(outDir, { recursive: true, force: true });
    }
  });

  it("correlates morphology outliers to event or artifact windows rather than transition density", () => {
    const pressures = [10, 11, 12, 13, 200, 15, 16, 17, 18];
    const baseSamples = pressures.map((pressure, index) => sample({
      sourceIndex: index,
      tSec: index * 0.01,
      theta: 0.12 + index * 0.05,
      LVP: pressure,
      VLV: 100 + index * 10,
      QMV: 100,
      xiMV: 1,
      xiAoV: 0,
      dVLVdt: 20,
    }));
    const farRows = metricRowsForSamplesForTest(baseSamples);
    const nearRows = metricRowsForSamplesForTest(baseSamples.map((row, index) => (
      index === 4 ? { ...row, AoV_qDotClampHit01: 1 } : row
    )));
    const transitionRows = metricRowsForSamplesForTest(baseSamples.map((row, index) => (
      index === 4 ? { ...row, xiMV: 0.5 } : row
    )));

    const eventMetric = (rows: MetricRow[]) => rows.find((row) => (
      row.chamber === "LV"
      && row.metricId === "eventCorrelationWindowHitFraction"
      && row.samplingMode === "raw"
      && row.transitionPolicy === "transition-inclusive"
    ));

    expect(eventMetric(farRows)?.value).toBe(0);
    expect(eventMetric(nearRows)?.value).toBeGreaterThan(0);
    expect(eventMetric(transitionRows)?.value).toBeGreaterThan(0);
  });

  it("reports EAInflowProxy as E over A, not A over E", () => {
    const rows = metricRowsForSamplesForTest([
      sample({ sourceIndex: 0, tSec: 0.00, theta: 0.20, QMV: 120, VLV: 100, dVLVdt: 20 }),
      sample({ sourceIndex: 1, tSec: 0.01, theta: 0.30, QMV: 100, VLV: 110, dVLVdt: 20 }),
      sample({ sourceIndex: 2, tSec: 0.02, theta: 0.82, QMV: 60, VLV: 120, dVLVdt: 20, aLA: 0.3 }),
      sample({ sourceIndex: 3, tSec: 0.03, theta: 0.90, QMV: 50, VLV: 130, dVLVdt: 20, aLA: 0.3 }),
    ]);
    const row = rows.find((candidate) => (
      candidate.chamber === "LV"
      && candidate.metricId === "EAInflowProxy"
      && candidate.samplingMode === "raw"
      && candidate.transitionPolicy === "transition-inclusive"
    ));

    expect(row?.value).toBeCloseTo(2);
  });
});
