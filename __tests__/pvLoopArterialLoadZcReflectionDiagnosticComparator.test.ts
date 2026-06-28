import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildArterialLoadZcReflectionDiagnosticComparison,
  loadMetricRowsFromCsv,
  writeArterialLoadZcReflectionDiagnosticComparisonArtifacts,
  type ComparatorMetricRow,
} from "@/tools/myocardium/buildArterialLoadZcReflectionDiagnosticComparator";

function row(overrides: Partial<ComparatorMetricRow>): ComparatorMetricRow {
  return {
    caseId: "normal-sinus",
    branchId: "1",
    branchName: "Normal",
    beatIndex: 3,
    chamber: "LV",
    metricId: "semilunarOpenEjectionSquareness",
    samplingMode: "raw",
    transitionPolicy: "transition-excluded-core",
    value: 0.8,
    unit: "dimensionless",
    samplingInvarianceDelta: 0,
    classificationLabels: ["aov-open-ejection", "excessive-squareness"],
    ...overrides,
  };
}

function rowsWithComparableEvidence(): ComparatorMetricRow[] {
  return [
    row({ metricId: "semilunarOpenEjectionSquareness", value: 0.82 }),
    row({ metricId: "ejectionPlateauFraction", value: 0.58 }),
    row({ metricId: "ejectionTopCurvature", value: 1.4 }),
    row({ metricId: "cornerSharpnessAtOpen", value: 1.7 }),
    row({ metricId: "cornerSharpnessAtClose", value: 1.6 }),
    row({ metricId: "incisuraPresenceScore", value: 0.08 }),
    row({ metricId: "arterialPressureIncisuraDepth", value: 210, unit: "Pa" }),
    row({ metricId: "peakPressureTimingAsFractionOfEjection", value: 0.42 }),
    row({
      metricId: "eventCorrelationWindowHitFraction",
      value: 0.75,
      classificationLabels: ["event-window-correlation", "event-sensitive"],
    }),
    row({ metricId: "semilunarOpenEjectionSquareness", samplingMode: "raw", transitionPolicy: "transition-inclusive", value: 0.83 }),
    row({ metricId: "ejectionPlateauFraction", samplingMode: "raw", transitionPolicy: "transition-inclusive", value: 0.57 }),
    row({ metricId: "semilunarOpenEjectionSquareness", samplingMode: "uniformBeatGrid", value: 0.81, samplingInvarianceDelta: 0.01 }),
    row({ metricId: "semilunarOpenEjectionSquareness", samplingMode: "eventAlignedCore", value: 0.82, samplingInvarianceDelta: 0 }),
    row({ metricId: "semilunarOpenEjectionSquareness", samplingMode: "coarseSensitivity", value: 0.78, samplingInvarianceDelta: 0.05 }),
    row({ metricId: "SV", value: 70, unit: "mL", classificationLabels: [] }),
    row({ metricId: "CO", value: 5.2, unit: "L/min", classificationLabels: [] }),
    row({ metricId: "strokeWork", value: 1.25, unit: "J", classificationLabels: [] }),
    row({ metricId: "peakPressure", value: 120, unit: "mmHg", classificationLabels: [] }),
    row({ metricId: "ejectionDuration", value: 0.24, unit: "sec", classificationLabels: [] }),
    row({ metricId: "semilunarForwardVolume", value: 72, unit: "mL", classificationLabels: [] }),
    row({ metricId: "semilunarReverseVolume", value: 0.4, unit: "mL", classificationLabels: [] }),
    row({ metricId: "qDotClampHitFraction", value: 0.1, classificationLabels: [] }),
    row({ metricId: "semilunarValveDiodeClampHitFraction", value: 0.05, classificationLabels: [] }),
    row({ metricId: "semilunarDynamicFlowClampHitFraction", value: 0.02, classificationLabels: [] }),
  ];
}

describe("PV-loop arterial-load Zc/reflection diagnostic comparator", () => {
  it("builds comparable ejection evidence with all anti-gaming readouts", () => {
    const summary = buildArterialLoadZcReflectionDiagnosticComparison(rowsWithComparableEvidence(), {
      inputDir: "artifacts/myocardium/pv-loop-morphology/example",
      sourceSummary: {
        runnerVersion: "pv-loop-morphology-quality-runner-v1",
        claimBoundary: "diagnostic-only-no-model-change",
      },
    });

    expect(summary.comparatorId).toBe("arterial-load-zc-reflection-diagnostic-comparator-v1");
    expect(summary.claimBoundary).toBe("off-by-default-diagnostic-comparison-only");
    expect(summary.input.sourceRunnerVersion).toBe("pv-loop-morphology-quality-runner-v1");
    expect(summary.readinessBoundaryReference).toMatchObject({
      protocolPath: "data/myocardium/protocols/arterial-load-zc-reflection-comparator-v1.json",
      role: "future-readiness-reference-only",
    });
    expect(summary.groupCount).toBe(1);

    const group = summary.groups[0];
    expect(group.identity).toMatchObject({
      rowsHaveRequiredIdentity: true,
      rawBeforeResampled: true,
      hasRawTransitionInclusive: true,
      hasRawTransitionExcludedCore: true,
      matchedResampledEvidence: true,
      transitionInclusiveAndExcluded: true,
      explicitMissingSignalRecords: true,
    });
    expect(group.identity.resampledModes).toEqual([
      "uniformBeatGrid",
      "eventAlignedCore",
      "coarseSensitivity",
    ]);
    expect(group.evidence.rawTransitionExcludedCore).toMatchObject({
      semilunarOpenEjectionSquareness: 0.82,
      ejectionPlateauFraction: 0.58,
      eventCorrelationWindowHitFraction: 0.75,
    });
    expect(group.antiGamingReadouts.find((readout) => readout.name === "strokeVolumeM3"))
      .toMatchObject({ status: "available", value: 70e-6, unit: "m3" });
    const cardiacOutput = group.antiGamingReadouts.find((readout) => readout.name === "cardiacOutputM3PerSec");
    expect(cardiacOutput).toMatchObject({ status: "available", unit: "m3/s" });
    expect(cardiacOutput?.value).toBeCloseTo(5.2e-3 / 60);
    expect(group.antiGamingReadouts.find((readout) => readout.name === "strokeWorkJ"))
      .toMatchObject({ status: "available", value: 1.25, unit: "J" });
    expect(group.antiGamingReadouts.find((readout) => readout.name === "peakPressurePa"))
      .toMatchObject({ status: "available", value: 120 * 133.322, unit: "Pa" });
    expect(group.antiGamingReadouts.find((readout) => readout.name === "ejectionDurationSec"))
      .toMatchObject({ status: "available", value: 0.24, unit: "sec" });
    expect(group.antiGamingReadouts.find((readout) => readout.name === "semilunarForwardVolumeM3"))
      .toMatchObject({ status: "available", value: 72e-6, unit: "m3" });
    expect(group.antiGamingReadouts.find((readout) => readout.name === "semilunarReverseVolumeM3"))
      .toMatchObject({ status: "available", value: 0.4e-6, unit: "m3" });
    expect(group.antiGamingReadouts.find((readout) => readout.name === "qDotClampHitFraction"))
      .toMatchObject({ status: "available", value: 0.1, sourceMetricId: "qDotClampHitFraction" });
    expect(group.antiGamingReadouts.find((readout) => readout.name === "valveDiodeClampHitFraction"))
      .toMatchObject({ status: "available", value: 0.05, sourceMetricId: "semilunarValveDiodeClampHitFraction" });
    expect(group.antiGamingReadouts.find((readout) => readout.name === "dynamicFlowClampHitFraction"))
      .toMatchObject({ status: "available", value: 0.02, sourceMetricId: "semilunarDynamicFlowClampHitFraction" });
    expect(group.antiGamingReadouts.filter((readout) => readout.status === "missing")).toEqual([]);
    expect(group.interpretable).toBe(true);
    expect(group.uninterpretableReasons).toEqual([]);
  });

  it("emits explicit missing/no-proxy Zc/reflection records without hypothesis promotion", () => {
    const group = buildArterialLoadZcReflectionDiagnosticComparison(rowsWithComparableEvidence()).groups[0];

    expect(group.hypothesisPromotion).toBe("not-promoted-no-proxy");
    expect(group.missingNoProxySignals).toEqual(expect.arrayContaining([
      expect.objectContaining({
        name: "arterialReflectionCoefficient",
        status: "missing-no-proxy",
        proxyPolicy: "forbidden",
        promotesHypothesis: false,
        value: null,
      }),
      expect.objectContaining({
        name: "arterialReflectionDelaySec",
        status: "missing-no-proxy",
        proxyPolicy: "forbidden",
        promotesHypothesis: false,
        value: null,
      }),
      expect.objectContaining({
        name: "characteristicImpedancePaSecPerM3",
        status: "missing-no-proxy",
        proxyPolicy: "forbidden",
        promotesHypothesis: false,
        value: null,
      }),
    ]));
    expect(group.missingNoProxySignals).toHaveLength(3);
  });

  it("does not promote Zc/reflection proxy rows even when raw-core values are present", () => {
    const metricRows = [
      ...rowsWithComparableEvidence(),
      row({ metricId: "characteristicImpedancePaSecPerM3", value: 123, unit: "Pa*s/m3", classificationLabels: [] }),
      row({ metricId: "arterialReflectionCoefficient", value: 0.4, unit: "dimensionless", classificationLabels: [] }),
      row({ metricId: "arterialReflectionDelaySec", value: 0.12, unit: "sec", classificationLabels: [] }),
    ];
    const group = buildArterialLoadZcReflectionDiagnosticComparison(metricRows).groups[0];

    expect(group.hypothesisPromotion).toBe("not-promoted-no-proxy");
    expect(group.missingNoProxySignals).toEqual(expect.arrayContaining([
      expect.objectContaining({
        name: "characteristicImpedancePaSecPerM3",
        status: "missing-no-proxy",
        value: null,
        promotesHypothesis: false,
      }),
      expect.objectContaining({
        name: "arterialReflectionCoefficient",
        status: "missing-no-proxy",
        value: null,
        promotesHypothesis: false,
      }),
      expect.objectContaining({
        name: "arterialReflectionDelaySec",
        status: "missing-no-proxy",
        value: null,
        promotesHypothesis: false,
      }),
    ]));
  });

  it("does not promote anti-gaming readouts from non-raw-core identities", () => {
    const metricRows = rowsWithComparableEvidence().map((candidate) => (
      candidate.metricId === "qDotClampHitFraction"
        ? { ...candidate, transitionPolicy: "transition-inclusive" as const }
        : candidate
    ));
    const summary = buildArterialLoadZcReflectionDiagnosticComparison(metricRows);
    const group = summary.groups[0];

    expect(group.antiGamingReadouts.find((readout) => readout.name === "qDotClampHitFraction"))
      .toMatchObject({
        status: "missing",
        sourceMetricId: null,
      });
    expect(group.interpretable).toBe(false);
    expect(group.uninterpretableReasons.join(" ")).toContain("qDotClampHitFraction");
  });

  it("parses morphology metric CSV rows and writes comparator artifacts", () => {
    const metricRows = loadMetricRowsFromCsv(rowsToCsv(rowsWithComparableEvidence()));
    const summary = buildArterialLoadZcReflectionDiagnosticComparison(metricRows);
    const outDir = mkdtempSync(path.join(tmpdir(), "arterial-zc-comparator-"));
    try {
      writeArterialLoadZcReflectionDiagnosticComparisonArtifacts(outDir, summary);
      const written = JSON.parse(readFileSync(path.join(outDir, "summary.json"), "utf8"));
      const groupCsv = readFileSync(path.join(outDir, "arterial-load-zc-reflection-comparator-groups.csv"), "utf8");
      const markdown = readFileSync(path.join(outDir, "summary.md"), "utf8");

      expect(written.groupCount).toBe(1);
      expect(groupCsv).toContain("missingNoProxySignals");
      expect(groupCsv).toContain("allAntiGamingReadoutsAvailable");
      expect(groupCsv).toContain("arterialReflectionDelaySec");
      expect(markdown).toContain("does not infer Zc/reflection values");
    } finally {
      rmSync(outDir, { recursive: true, force: true });
    }
  });
});

function rowsToCsv(rows: readonly ComparatorMetricRow[]): string {
  const header = [
    "caseId",
    "branchId",
    "branchName",
    "beatIndex",
    "chamber",
    "metricId",
    "samplingMode",
    "transitionPolicy",
    "value",
    "unit",
    "samplingInvarianceDelta",
    "classificationLabels",
  ];
  return [
    header.join(","),
    ...rows.map((candidate) => header.map((column) => csvCell(valueForColumn(candidate, column))).join(",")),
  ].join("\n") + "\n";
}

function valueForColumn(row: ComparatorMetricRow, column: string): unknown {
  if (column === "classificationLabels") return row.classificationLabels.join("|");
  return row[column as keyof ComparatorMetricRow];
}

function csvCell(value: unknown): string {
  if (value == null) return "";
  const raw = String(value);
  return /[",\n]/.test(raw) ? `"${raw.replace(/"/g, "\"\"")}"` : raw;
}
