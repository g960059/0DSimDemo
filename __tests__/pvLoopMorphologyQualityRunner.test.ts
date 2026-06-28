import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import targetPack from "@/data/myocardium/targets/pv-loop-morphology-quality-v1.json";
import {
  buildMorphologyEvidenceSummaryForTest,
  buildInitialSummary,
  classifyPvLoopPhaseForTest,
  clampEventRowsForTest,
  metricRowsForSamplesForTest,
  metricRowsToCsv,
  PV_LOOP_CLASSIFICATION_PROFILE,
  runPvLoopMorphologyDiagnosticForTest,
  summaryToMarkdownForTest,
  traceRowsForBeatForTest,
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
    systemicArterialPressurePa: 11_000,
    downstreamPulmonaryArterialPressurePa: 1_800,
    VLV: 120,
    VRV: 120,
    QMV: 80,
    QAo: 0,
    QTV: 80,
    QPV: 0,
    aorticRootToSystemicArteryFlowM3PerSec: 0.00008,
    proximalPulmonaryArterialFlowM3PerSec: 0.00007,
    aorticRootComplianceM3PerPa: 1.5e-8,
    pulmonaryRootComplianceM3PerPa: 2.2e-8,
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
    MV_qDotRaw: 0,
    MV_qDotPost: 0,
    MV_qDotClampHit01: 0,
    MV_qDotClampImpulse: 0,
    MV_diodeImpulse: 0,
    MV_flowClampImpulse: 0,
    AoV_qDotRaw: 0,
    AoV_qDotPost: 0,
    AoV_qDotClampHit01: 0,
    AoV_qDotClampImpulse: 0,
    AoV_diodeImpulse: 0,
    AoV_flowClampImpulse: 0,
    TV_qDotRaw: 0,
    TV_qDotPost: 0,
    TV_qDotClampHit01: 0,
    TV_qDotClampImpulse: 0,
    TV_diodeImpulse: 0,
    TV_flowClampImpulse: 0,
    PV_qDotRaw: 0,
    PV_qDotPost: 0,
    PV_qDotClampHit01: 0,
    PV_qDotClampImpulse: 0,
    PV_diodeImpulse: 0,
    PV_flowClampImpulse: 0,
    perSampleValveDiodeClampHits: 0,
    perSampleDynamicFlowClampHits: 0,
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
    expect(summary.signalAvailability.mvQDotRawM3PerSec2).toBe(true);
    expect(summary.signalAvailability.tvQDotRawM3PerSec2).toBe(true);
    expect(summary.signalAvailability.pvQDotRawM3PerSec2).toBe(true);
    expect(summary.signalAvailability.perSampleValveDiodeClampHits).toBe(true);
    expect(summary.signalAvailability.perSampleDynamicFlowClampHits).toBe(true);
    expect(summary.signalAvailability.systemicArterialPressurePa).toBe(true);
    expect(summary.signalAvailability.downstreamPulmonaryArterialPressurePa).toBe(true);
    expect(summary.signalAvailability.aorticRootToSystemicArteryFlowM3PerSec).toBe(true);
    expect(summary.signalAvailability.proximalPulmonaryArterialFlowM3PerSec).toBe(true);
    expect(summary.signalAvailability.aorticRootComplianceM3PerPa).toBe(true);
    expect(summary.signalAvailability.pulmonaryRootComplianceM3PerPa).toBe(true);
    expect(summary.signalAvailability.characteristicImpedancePaSecPerM3).toBe(false);
    expect(summary.signalAvailability.arterialReflectionCoefficient).toBe(false);
    expect(summary.guardrailResults.map((result) => result.id)).toContain("package-scripts-no-change");
    expect(summary.morphologyEvidence.scoringProfile.maxConfidence).toBe("medium");
    expect(summary.morphologyEvidence.evidenceGaps.map((gap) => gap.id)).not.toContain("filling-limb-root-cause-signal-gap");
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
      evidenceStatus: "supported-correlation",
      confidence: "medium",
    });
    expect(filling?.missingSignals).toEqual([]);

    const aov = evidence.rootCauseHypotheses.find((hypothesis) => hypothesis.id === "aov-qdot-clamp-correlation");
    expect(aov).toMatchObject({
      evidenceStatus: "supported-correlation",
      confidence: "medium",
    });
    expect(evidence.evidenceGaps.map((gap) => gap.id)).toEqual(expect.arrayContaining([
      "ejection-limb-arterial-load-signal-gap",
    ]));
  });

  it("keeps arterial-load evidence insufficient only for missing Zc and reflection", () => {
    const evidence = buildMorphologyEvidenceSummaryForTest([
      metricRow({
        metricId: "semilunarOpenEjectionSquareness",
        value: 0.9,
        classificationLabels: ["excessive-squareness"],
      }),
      metricRow({
        metricId: "ejectionPlateauFraction",
        value: 0.7,
        classificationLabels: ["flat-aop-during-ejection"],
      }),
    ]);

    const observation = evidence.observations.find((candidate) => candidate.id === "ejection-shape-alert");
    expect(observation?.supportingSignals).toEqual(expect.arrayContaining([
      "systemicArterialPressurePa",
      "downstreamPulmonaryArterialPressurePa",
      "aorticRootToSystemicArteryFlowM3PerSec",
      "proximalPulmonaryArterialFlowM3PerSec",
      "aorticRootComplianceM3PerPa",
      "pulmonaryRootComplianceM3PerPa",
    ]));
    expect(observation?.missingSignals).toEqual([
      "characteristicImpedancePaSecPerM3",
      "arterialReflectionCoefficient",
    ]);

    const hypothesis = evidence.rootCauseHypotheses.find((candidate) => (
      candidate.id === "arterial-load-structure-hypothesis"
    ));
    expect(hypothesis).toMatchObject({
      evidenceStatus: "insufficient-evidence",
      confidence: "low",
      missingSignals: [
        "characteristicImpedancePaSecPerM3",
        "arterialReflectionCoefficient",
      ],
    });

    const gap = evidence.evidenceGaps.find((candidate) => candidate.id === "ejection-limb-arterial-load-signal-gap");
    expect(gap).toMatchObject({
      missingSignals: [
        "characteristicImpedancePaSecPerM3",
        "arterialReflectionCoefficient",
      ],
      note: "Proximal arterial pressure/flow/root-compliance evidence is available; arterial/load hypotheses remain insufficient while Zc/reflection evidence is not modeled.",
    });
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

  it("does not emit filling event-window correlation from split aggregate evidence groups", () => {
    const evidence = buildMorphologyEvidenceSummaryForTest([
      metricRow({
        beatIndex: 1,
        chamber: "LV",
        metricId: "mvOpenLowerLimbRoughness",
        value: 3,
        classificationLabels: ["filling-limb-artifact"],
      }),
      metricRow({
        beatIndex: 2,
        chamber: "LV",
        metricId: "eventCorrelationWindowHitFraction",
        value: 0.8,
        classificationLabels: ["event-window-correlation", "event-sensitive"],
      }),
    ]);

    expect(evidence.observations.map((observation) => observation.id)).toEqual(expect.arrayContaining([
      "filling-limb-roughness",
      "event-window-correlation",
    ]));
    expect(evidence.evidenceGaps.map((gap) => gap.id)).not.toContain("filling-limb-root-cause-signal-gap");
    expect(evidence.rootCauseHypotheses.some((hypothesis) => (
      hypothesis.id === "filling-event-window-correlation"
    ))).toBe(false);
  });

  it("does not emit raw-core filling event-window correlation from transition-inclusive-only event evidence", () => {
    const evidence = buildMorphologyEvidenceSummaryForTest([
      metricRow({
        chamber: "LV",
        metricId: "mvOpenLowerLimbRoughness",
        transitionPolicy: "transition-excluded-core",
        value: 3,
        classificationLabels: ["filling-limb-artifact"],
      }),
      metricRow({
        chamber: "LV",
        metricId: "eventCorrelationWindowHitFraction",
        transitionPolicy: "transition-inclusive",
        value: 0.8,
        classificationLabels: ["event-window-correlation", "event-sensitive"],
      }),
    ]);

    expect(evidence.observations.map((observation) => observation.id)).toContain("filling-limb-roughness");
    expect(evidence.evidenceGaps.map((gap) => gap.id)).not.toContain("filling-limb-root-cause-signal-gap");
    expect(evidence.rootCauseHypotheses.some((hypothesis) => (
      hypothesis.id === "filling-event-window-correlation"
    ))).toBe(false);
  });

  it("does not emit RV filling chatter correlation from split beats", () => {
    const evidence = buildMorphologyEvidenceSummaryForTest([
      metricRow({
        beatIndex: 1,
        chamber: "RV",
        metricId: "tvOpenLowerLimbRoughness",
        value: 3,
        classificationLabels: ["filling-limb-artifact"],
      }),
      metricRow({
        beatIndex: 2,
        chamber: "RV",
        metricId: "valveOpenCloseChatterCount",
        value: 2,
      }),
    ]);

    expect(evidence.observations.map((observation) => observation.id)).toContain("filling-limb-roughness");
    expect(evidence.evidenceGaps.map((gap) => gap.id)).not.toContain("filling-limb-root-cause-signal-gap");
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
      evidenceStatus: "supported-correlation",
      confidence: "medium",
    });
    expect(hypothesis?.supportingSignals).toContain("tricuspidValveOpen01");
  });

  it("does not promote clamp-only AoV markers to qDot clamp correlation hypotheses", () => {
    const evidence = buildMorphologyEvidenceSummaryForTest([], [
      clampRow({ signalId: "AoV_qDotClampHit01", value: 1 }),
    ]);

    expect(evidence.observations.map((observation) => observation.id)).toContain("aov-qdot-clamp-activity");
    expect(evidence.rootCauseHypotheses.some((hypothesis) => (
      hypothesis.id === "aov-qdot-clamp-correlation"
    ))).toBe(false);
  });

  it("does not promote per-sample clamp markers to filling hypotheses without raw-core metric evidence", () => {
    const evidence = buildMorphologyEvidenceSummaryForTest([], [
      clampRow({
        chamber: "both",
        signalId: "perSampleValveDiodeClampHits",
        eventType: "hit-count",
        value: 1,
      }),
      clampRow({
        chamber: "both",
        signalId: "perSampleDynamicFlowClampHits",
        eventType: "hit-count",
        value: 1,
      }),
    ]);

    expect(evidence.rootCauseHypotheses.some((hypothesis) => (
      hypothesis.id === "filling-event-window-correlation"
    ))).toBe(false);
    expect(evidence.rootCauseHypotheses.some((hypothesis) => (
      hypothesis.id === "rv-filling-valve-chatter-correlation"
    ))).toBe(false);
  });

  it("does not promote pressure-floor clamp markers to overlap hypotheses without raw-core floor evidence", () => {
    const evidence = buildMorphologyEvidenceSummaryForTest([], [
      clampRow({ signalId: "LVPressureFloorHit01", value: 1 }),
    ]);

    expect(evidence.observations.map((observation) => observation.id)).toContain("pressure-floor-activity");
    expect(evidence.rootCauseHypotheses.some((hypothesis) => (
      hypothesis.id === "pressure-floor-correlation"
    ))).toBe(false);
  });

  it("does not report missing-incisura alerts from generated rows without ejection samples", () => {
    const rows = metricRowsForSamplesForTest([
      sample({ sourceIndex: 0, tSec: 0.00, theta: 0.20, VLV: 100, dVLVdt: 20 }),
      sample({ sourceIndex: 1, tSec: 0.01, theta: 0.30, VLV: 110, dVLVdt: 20 }),
      sample({ sourceIndex: 2, tSec: 0.02, theta: 0.40, VLV: 120, dVLVdt: 20 }),
      sample({ sourceIndex: 3, tSec: 0.03, theta: 0.50, VLV: 130, dVLVdt: 20 }),
    ]);
    const incisura = rows.find((row) => (
      row.chamber === "LV"
      && row.metricId === "incisuraPresenceScore"
      && row.samplingMode === "raw"
      && row.transitionPolicy === "transition-excluded-core"
    ));
    const evidence = buildMorphologyEvidenceSummaryForTest(rows);

    expect(incisura).toMatchObject({
      value: null,
      classificationLabels: ["no-ejection-evidence"],
    });
    expect(evidence.observations.some((observation) => (
      observation.id === "ejection-shape-alert"
    ))).toBe(false);
    expect(evidence.rootCauseHypotheses.some((hypothesis) => (
      hypothesis.id === "arterial-load-structure-hypothesis"
    ))).toBe(false);
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
    expect(markdown).toContain("supported-correlation");
    expect(markdown).not.toContain("filling-limb-root-cause-signal-gap");
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
      "fillingInletQDotClampHitFraction",
      "fillingInletValveDiodeClampHitFraction",
      "fillingInletDynamicFlowClampHitFraction",
      "ejectionDuration",
      "semilunarValveDiodeClampHitFraction",
      "semilunarDynamicFlowClampHitFraction",
      "atrialKickBoosterPreservation",
      "lvRvAsymmetryIndex",
    ]));
  });

  it("emits filling-inlet anti-gaming readout metrics from raw-core samples", () => {
    const rows = metricRowsForSamplesForTest([
      sample({
        sourceIndex: 0,
        tSec: 0.00,
        theta: 0.10,
        MV_qDotClampHit01: 1,
        MV_diodeImpulse: 3,
        MV_flowClampImpulse: 4,
        TV_qDotClampHit01: 1,
        TV_diodeImpulse: 2,
        TV_flowClampImpulse: 5,
      }),
      sample({ sourceIndex: 1, tSec: 0.01, theta: 0.20, VLV: 122, VRV: 123 }),
      sample({ sourceIndex: 2, tSec: 0.02, theta: 0.84, VLV: 126, VRV: 127, aLA: 0.8, aRA: 0.7 }),
      sample({ sourceIndex: 3, tSec: 0.03, theta: 0.88, VLV: 130, VRV: 131, aLA: 1.0, aRA: 1.0 }),
    ]);
    const rawCore = (chamber: "LV" | "RV", metricId: string) => rows.find((row) => (
      row.chamber === chamber
      && row.metricId === metricId
      && row.samplingMode === "raw"
      && row.transitionPolicy === "transition-excluded-core"
    ));

    expect(rawCore("LV", "fillingInletQDotClampHitFraction")?.value).toBeGreaterThan(0);
    expect(rawCore("LV", "fillingInletValveDiodeClampHitFraction")?.value).toBeGreaterThan(0);
    expect(rawCore("LV", "fillingInletDynamicFlowClampHitFraction")?.value).toBeGreaterThan(0);
    expect(rawCore("RV", "fillingInletQDotClampHitFraction")?.value).toBeGreaterThan(0);
    expect(rawCore("RV", "fillingInletValveDiodeClampHitFraction")?.value).toBeGreaterThan(0);
    expect(rawCore("RV", "fillingInletDynamicFlowClampHitFraction")?.value).toBeGreaterThan(0);
    expect(rawCore("LV", "atrialKickBoosterPreservation")?.value).toBe(1);
    expect(rawCore("RV", "atrialKickBoosterPreservation")?.value).toBe(1);
  });

  it("emits semilunar ejection anti-gaming readout metrics from raw-core samples", () => {
    const rows = metricRowsForSamplesForTest([
      sample({
        sourceIndex: 0,
        tSec: 0.00,
        theta: 0.30,
        xiMV: 0,
        xiAoV: 1,
        xiTV: 0,
        xiPV: 1,
        QMV: 0,
        QAo: 120,
        QTV: 0,
        QPV: 110,
        VLV: 130,
        VRV: 128,
        dVLVdt: -30,
        dVRVdt: -28,
        AoV_qDotClampHit01: 1,
        AoV_diodeImpulse: 3,
        AoV_flowClampImpulse: 4,
        PV_qDotClampHit01: 1,
        PV_diodeImpulse: 2,
        PV_flowClampImpulse: 5,
      }),
      sample({
        sourceIndex: 1,
        tSec: 0.01,
        theta: 0.36,
        xiMV: 0,
        xiAoV: 1,
        xiTV: 0,
        xiPV: 1,
        QMV: 0,
        QAo: 100,
        QTV: 0,
        QPV: 96,
        VLV: 124,
        VRV: 122,
        dVLVdt: -24,
        dVRVdt: -22,
      }),
      sample({
        sourceIndex: 2,
        tSec: 0.02,
        theta: 0.42,
        xiMV: 0,
        xiAoV: 1,
        xiTV: 0,
        xiPV: 1,
        QMV: 0,
        QAo: 90,
        QTV: 0,
        QPV: 86,
        VLV: 118,
        VRV: 116,
        dVLVdt: -22,
        dVRVdt: -20,
      }),
      sample({
        sourceIndex: 3,
        tSec: 0.03,
        theta: 0.48,
        xiMV: 0,
        xiAoV: 1,
        xiTV: 0,
        xiPV: 1,
        QMV: 0,
        QAo: 70,
        QTV: 0,
        QPV: 66,
        VLV: 112,
        VRV: 110,
        dVLVdt: -20,
        dVRVdt: -18,
      }),
    ]);
    const rawCore = (chamber: "LV" | "RV", metricId: string) => rows.find((row) => (
      row.chamber === chamber
      && row.metricId === metricId
      && row.samplingMode === "raw"
      && row.transitionPolicy === "transition-excluded-core"
    ));

    expect(rawCore("LV", "ejectionDuration")?.value).toBeCloseTo(0.03);
    expect(rawCore("RV", "ejectionDuration")?.value).toBeCloseTo(0.03);
    expect(rawCore("LV", "qDotClampHitFraction")?.value).toBeGreaterThan(0);
    expect(rawCore("LV", "semilunarValveDiodeClampHitFraction")?.value).toBeGreaterThan(0);
    expect(rawCore("LV", "semilunarDynamicFlowClampHitFraction")?.value).toBeGreaterThan(0);
    expect(rawCore("RV", "qDotClampHitFraction")?.value).toBeGreaterThan(0);
    expect(rawCore("RV", "semilunarValveDiodeClampHitFraction")?.value).toBeGreaterThan(0);
    expect(rawCore("RV", "semilunarDynamicFlowClampHitFraction")?.value).toBeGreaterThan(0);
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
      const traceHeader = readFileSync(path.join(outDir, runSummary.branches[0].traceFile), "utf8")
        .split("\n")[0].split(",");

      expect(phaseHeader).toEqual(expect.arrayContaining(
        targetPack.artifactSchemas.phaseSegmentationSeries.requiredFields,
      ));
      expect(phaseHeader).not.toContain("tSec");
      expect(metricHeader).toEqual(expect.arrayContaining(
        targetPack.artifactSchemas.perBeatMetricSummary.requiredFields,
      ));
      expect(runSummary.measurementProfile.resolvedRawSampleHz).toBe(1000);
      expect(runSummary.classificationProfile).toEqual(PV_LOOP_CLASSIFICATION_PROFILE);
      expect(traceHeader).toEqual(expect.arrayContaining([
        "mvQDotRawM3PerSec2",
        "tvQDotRawM3PerSec2",
        "pvQDotRawM3PerSec2",
        "systemicArterialPressurePa",
        "downstreamPulmonaryArterialPressurePa",
        "aorticRootToSystemicArteryFlowM3PerSec",
        "proximalPulmonaryArterialFlowM3PerSec",
        "aorticRootComplianceM3PerPa",
        "pulmonaryRootComplianceM3PerPa",
        "perSampleValveDiodeClampHits",
        "perSampleDynamicFlowClampHits",
      ]));
    } finally {
      rmSync(outDir, { recursive: true, force: true });
    }
  });

  it("emits normalized qDot trace columns and available clamp marker rows", () => {
    const rows = [
      sample({
        MV_qDotRaw: 2_000_000,
        MV_qDotPost: 1_000_000,
        MV_qDotClampHit01: 1,
        MV_qDotClampImpulse: -1_000_000,
        TV_diodeImpulse: -3,
        PV_flowClampImpulse: 4,
        systemicArterialPressurePa: 12_345,
        downstreamPulmonaryArterialPressurePa: 2_345,
        aorticRootToSystemicArteryFlowM3PerSec: 0.000123,
        proximalPulmonaryArterialFlowM3PerSec: 0.000045,
        aorticRootComplianceM3PerPa: 1.23e-8,
        pulmonaryRootComplianceM3PerPa: 4.56e-8,
      }),
    ];

    const trace = traceRowsForBeatForTest(rows)[0];
    expect(trace).toMatchObject({
      mvQDotRawM3PerSec2: 2,
      mvQDotPostM3PerSec2: 1,
      mvQDotClampImpulseM3PerSec2: -1,
      tvValveDiodeImpulseM3PerSec: -0.000003,
      pvDynamicFlowClampImpulseM3PerSec: 0.000004,
      systemicArterialPressurePa: 12_345,
      downstreamPulmonaryArterialPressurePa: 2_345,
      aorticRootToSystemicArteryFlowM3PerSec: 0.000123,
      proximalPulmonaryArterialFlowM3PerSec: 0.000045,
      aorticRootComplianceM3PerPa: 1.23e-8,
      pulmonaryRootComplianceM3PerPa: 4.56e-8,
      perSampleValveDiodeClampHits: 1,
      perSampleDynamicFlowClampHits: 1,
    });

    const clampRows = clampEventRowsForTest(rows);
    expect(clampRows).toEqual(expect.arrayContaining([
      expect.objectContaining({
        signalId: "mvQDotRawPostDivergenceM3PerSec2",
        value: 1,
        granularity: "per-sample",
        availability: "available",
      }),
      expect.objectContaining({
        signalId: "tvValveDiodeImpulseM3PerSec",
        value: -0.000003,
        granularity: "per-sample",
        availability: "available",
      }),
      expect.objectContaining({
        signalId: "pvDynamicFlowClampImpulseM3PerSec",
        value: 0.000004,
        granularity: "per-sample",
        availability: "available",
      }),
      expect.objectContaining({
        signalId: "perSampleValveDiodeClampHits",
        value: 1,
        granularity: "per-sample",
        availability: "available",
      }),
      expect.objectContaining({
        signalId: "perSampleDynamicFlowClampHits",
        value: 1,
        granularity: "per-sample",
        availability: "available",
      }),
    ]));
    expect(clampRows.some((row) => row.availability === "unavailable")).toBe(false);
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
    const mvNearRows = metricRowsForSamplesForTest(baseSamples.map((row, index) => (
      index === 4 ? { ...row, MV_qDotClampHit01: 1 } : row
    )));
    const lvWithRvOnlyMarkerRows = metricRowsForSamplesForTest(baseSamples.map((row, index) => (
      index === 4 ? { ...row, TV_diodeImpulse: -2, PV_flowClampImpulse: 2, RVPressureFloorHit01: 1 } : row
    )));
    const transitionRows = metricRowsForSamplesForTest(baseSamples.map((row, index) => (
      index === 4 ? { ...row, xiMV: 0.5 } : row
    )));
    const rvFillingSamples = pressures.map((pressure, index) => sample({
      sourceIndex: index,
      tSec: index * 0.01,
      theta: 0.12 + index * 0.05,
      RVP: pressure,
      VRV: 100 + index * 10,
      QTV: 100,
      xiTV: 1,
      xiPV: 0,
      dVRVdt: 20,
    }));
    const tvNearRows = metricRowsForSamplesForTest(rvFillingSamples.map((row, index) => (
      index === 4 ? { ...row, TV_diodeImpulse: -2 } : row
    )));
    const rvWithLvOnlyMarkerRows = metricRowsForSamplesForTest(rvFillingSamples.map((row, index) => (
      index === 4 ? { ...row, MV_qDotClampHit01: 1, AoV_qDotClampHit01: 1, LVPressureFloorHit01: 1 } : row
    )));
    const rvEjectionSamples = pressures.map((pressure, index) => sample({
      sourceIndex: index,
      tSec: index * 0.01,
      theta: 0.12 + index * 0.05,
      RVP: pressure,
      VRV: 180 - index * 6,
      QTV: 0,
      QPV: 100,
      xiTV: 0,
      xiPV: 1,
      dVRVdt: -20,
    }));
    const pvNearRows = metricRowsForSamplesForTest(rvEjectionSamples.map((row, index) => (
      index === 4 ? { ...row, PV_flowClampImpulse: 2 } : row
    )));

    const eventMetric = (rows: MetricRow[], chamber: "LV" | "RV" = "LV", transitionPolicy = "transition-inclusive") => rows.find((row) => (
      row.chamber === chamber
      && row.metricId === "eventCorrelationWindowHitFraction"
      && row.samplingMode === "raw"
      && row.transitionPolicy === transitionPolicy
    ));

    expect(eventMetric(farRows)?.value).toBe(0);
    expect(eventMetric(nearRows)?.value).toBeGreaterThan(0);
    expect(eventMetric(mvNearRows)?.value).toBeGreaterThan(0);
    expect(eventMetric(lvWithRvOnlyMarkerRows)?.value).toBe(0);
    expect(eventMetric(tvNearRows, "RV")?.value).toBeGreaterThan(0);
    expect(eventMetric(rvWithLvOnlyMarkerRows, "RV")?.value).toBe(0);
    expect(eventMetric(pvNearRows, "RV")?.value).toBeGreaterThan(0);
    expect(eventMetric(transitionRows)?.value).toBeGreaterThan(0);
    expect(eventMetric(transitionRows, "LV", "transition-excluded-core")?.value ?? 0).toBeLessThan(
      PV_LOOP_CLASSIFICATION_PROFILE.eventSensitiveHitFractionMin,
    );
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
