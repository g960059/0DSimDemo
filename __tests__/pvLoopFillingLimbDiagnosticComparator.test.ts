import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildFillingLimbDiagnosticComparison,
  loadMetricRowsFromCsv,
  writeFillingLimbDiagnosticComparisonArtifacts,
  type ComparatorMetricRow,
} from "@/tools/myocardium/buildFillingLimbDiagnosticComparator";
import {
  loadFillingLimbCorrelationReadinessValidationInput,
  validateFillingLimbCorrelationReadiness,
} from "@/tools/myocardium/verifyFillingLimbCorrelationReadiness";

function row(overrides: Partial<ComparatorMetricRow>): ComparatorMetricRow {
  return {
    caseId: "normal-sinus",
    branchId: "1",
    branchName: "Normal",
    beatIndex: 3,
    chamber: "LV",
    metricId: "mvOpenLowerLimbRoughness",
    samplingMode: "raw",
    transitionPolicy: "transition-excluded-core",
    value: 1.4,
    unit: "dimensionless",
    samplingInvarianceDelta: 0,
    classificationLabels: ["filling-limb-artifact"],
    ...overrides,
  };
}

function rowsWithComparableEvidence(): ComparatorMetricRow[] {
  return [
    row({ metricId: "mvOpenLowerLimbRoughness", samplingMode: "raw", transitionPolicy: "transition-excluded-core", value: 1.6 }),
    row({ metricId: "eventCorrelationWindowHitFraction", samplingMode: "raw", transitionPolicy: "transition-excluded-core", value: 0.8, classificationLabels: ["event-window-correlation", "event-sensitive"] }),
    row({ metricId: "mvOpenLowerLimbRoughness", samplingMode: "raw", transitionPolicy: "transition-inclusive", value: 1.7 }),
    row({ metricId: "mvOpenLowerLimbRoughness", samplingMode: "uniformBeatGrid", transitionPolicy: "transition-excluded-core", value: 1.5, samplingInvarianceDelta: 0.06 }),
    row({ metricId: "EDV", value: 120, unit: "mL", classificationLabels: [] }),
    row({ metricId: "SV", value: 70, unit: "mL", classificationLabels: [] }),
    row({ metricId: "CO", value: 5.2, unit: "L/min", classificationLabels: [] }),
    row({ metricId: "meanAtrialPressure", value: 9, unit: "mmHg", classificationLabels: [] }),
    row({ metricId: "EAInflowProxy", value: 1.1, classificationLabels: [] }),
    row({ metricId: "inletForwardVolume", value: 72, unit: "mL", classificationLabels: [] }),
    row({ metricId: "inletReverseVolume", value: 0.2, unit: "mL", classificationLabels: [] }),
    row({ metricId: "pressureFloorHitFraction", value: 0, classificationLabels: [] }),
  ];
}

describe("PV-loop filling-limb diagnostic comparator", () => {
  it("builds identity-stable comparison groups without inferring missing anti-gaming readouts", () => {
    const summary = buildFillingLimbDiagnosticComparison(rowsWithComparableEvidence(), {
      inputDir: "artifacts/myocardium/pv-loop-morphology/example",
      sourceSummary: {
        runnerVersion: "pv-loop-morphology-quality-runner-v1",
        claimBoundary: "diagnostic-only-no-model-change",
      },
    });

    expect(summary.comparatorId).toBe("filling-limb-diagnostic-comparator-v1");
    expect(summary.claimBoundary).toBe("off-by-default-diagnostic-comparison-only");
    expect(summary.input.sourceRunnerVersion).toBe("pv-loop-morphology-quality-runner-v1");
    expect(summary.groupCount).toBe(1);

    const group = summary.groups[0];
    expect(group.identity).toMatchObject({
      rowsHaveRequiredIdentity: true,
      rawBeforeResampled: true,
      hasRawTransitionInclusive: true,
      hasRawTransitionExcludedCore: true,
      comparableRawVsResampled: true,
      transitionInclusiveAndExcluded: true,
    });
    expect(group.evidence.rawTransitionExcludedCore).toMatchObject({
      mvOpenLowerLimbRoughness: 1.6,
      eventCorrelationWindowHitFraction: 0.8,
    });
    expect(group.antiGamingReadouts.find((readout) => readout.name === "strokeVolumeM3"))
      .toMatchObject({ status: "available", value: 70e-6, unit: "m3" });
    expect(group.antiGamingReadouts.find((readout) => readout.name === "meanLeftAtrialPressurePa"))
      .toMatchObject({ status: "available", value: 9 * 133.322, unit: "Pa" });

    const missing = group.antiGamingReadouts
      .filter((readout) => readout.status === "missing")
      .map((readout) => readout.name);
    expect(missing).toEqual(expect.arrayContaining([
      "meanRightAtrialPressurePa",
      "qDotClampHitFraction",
      "valveDiodeClampHitFraction",
      "dynamicFlowClampHitFraction",
      "atrialKickBoosterPreservation",
    ]));
    expect(group.interpretable).toBe(false);
    expect(group.uninterpretableReasons.join(" ")).toContain("missing anti-gaming readouts");
  });

  it("parses morphology metric CSV rows and writes comparator artifacts", () => {
    const csv = [
      "caseId,branchId,branchName,beatIndex,chamber,metricId,samplingMode,transitionPolicy,value,unit,samplingInvarianceDelta,classificationLabels",
      "normal-sinus,1,Normal,3,LV,mvOpenLowerLimbRoughness,raw,transition-excluded-core,1.6,dimensionless,0,filling-limb-artifact",
      "normal-sinus,1,Normal,3,LV,mvOpenLowerLimbRoughness,uniformBeatGrid,transition-excluded-core,1.5,dimensionless,0.06,filling-limb-artifact",
      "normal-sinus,1,Normal,3,LV,mvOpenLowerLimbRoughness,raw,transition-inclusive,1.7,dimensionless,0,filling-limb-artifact",
      "normal-sinus,1,Normal,3,LV,EDV,raw,transition-excluded-core,120,mL,0,",
    ].join("\n") + "\n";
    const metricRows = loadMetricRowsFromCsv(csv);
    const summary = buildFillingLimbDiagnosticComparison(metricRows);
    const outDir = mkdtempSync(path.join(tmpdir(), "filling-limb-comparator-"));
    try {
      writeFillingLimbDiagnosticComparisonArtifacts(outDir, summary);
      const written = JSON.parse(readFileSync(path.join(outDir, "summary.json"), "utf8"));
      const groupCsv = readFileSync(path.join(outDir, "filling-limb-comparator-groups.csv"), "utf8");

      expect(written.groupCount).toBe(1);
      expect(groupCsv).toContain("missingAntiGamingReadouts");
      expect(groupCsv).toContain("qDotClampHitFraction");
    } finally {
      rmSync(outDir, { recursive: true, force: true });
    }
  });

  it("does not promote anti-gaming readouts from non-raw-core identities", () => {
    const metricRows = rowsWithComparableEvidence().map((candidate) => (
      candidate.metricId === "EDV"
        ? { ...candidate, transitionPolicy: "transition-inclusive" as const }
        : candidate
    ));
    const summary = buildFillingLimbDiagnosticComparison(metricRows);
    const group = summary.groups[0];

    expect(group.antiGamingReadouts.find((readout) => readout.name === "endDiastolicVolumeM3"))
      .toMatchObject({
        status: "missing",
        sourceMetricId: null,
      });
    expect(group.interpretable).toBe(false);
    expect(group.uninterpretableReasons.join(" ")).toContain("endDiastolicVolumeM3");
  });

  it("keeps the readiness verifier green and package scripts unwired", () => {
    const validation = validateFillingLimbCorrelationReadiness(
      loadFillingLimbCorrelationReadinessValidationInput(process.cwd()),
    );
    expect(validation.errors).toEqual([]);
    expect(validation.pass).toBe(true);

    const packageJson = JSON.parse(readFileSync(path.join(process.cwd(), "package.json"), "utf8"));
    const scriptText = JSON.stringify(packageJson.scripts);
    expect(scriptText).not.toContain("buildFillingLimbDiagnosticComparator");
    expect(scriptText).not.toContain("filling-limb-diagnostic-comparator-v1");
  });
});
