import { describe, expect, it } from "vitest";
import {
  caseValidationReportToMarkdown,
  collectExpectedFindingMessages,
  collectHealthMessages,
  countResultStatuses,
  verdictFromMessages,
  verifyExpectedFinding,
  type CaseValidationReport,
  type ExpectedFinding,
  type ExpectedFindingResult,
  type MorphologyGateResult,
} from "@/caseValidation";
import type { SimMetrics, SimulationHealth } from "@/engine/protocol";

const metricFinding = (overrides: Partial<ExpectedFinding> = {}): ExpectedFinding => ({
  id: "co-up",
  description: "CO rises",
  instanceId: "2",
  comparatorInstanceId: "1",
  metric: "CO_L",
  direction: "up",
  gate: "teaching",
  ...overrides,
});

const metrics = (values: Partial<SimMetrics>): SimMetrics => values as SimMetrics;

const expectedResult = (status: ExpectedFindingResult["status"], id: string = status): ExpectedFindingResult => ({
  finding: metricFinding({ id }),
  status,
  message: `${status} finding`,
});

const health = (status: SimulationHealth["status"], messages: string[] = []): SimulationHealth => ({
  status,
  messages,
  tbvDriftMl: 0,
  tbvDriftPercent: 0,
  leftRightFlowMismatchLMin: 0,
  cycleMetricDelta: 0,
  clampHitCount: 0,
  numericalStability: "ok",
  massConservation: "ok",
  flowBalance: "ok",
  physiologicalRange: "ok",
});

const report = (overrides: Partial<CaseValidationReport> = {}): CaseValidationReport => ({
  schemaVersion: 1,
  generatedAt: "2026-06-07T00:00:00.000Z",
  modelVersion: "model-test",
  engineVersion: "engine-test",
  knobMappingVersion: "knobmap-test",
  caseId: "normal-sinus",
  caseTitle: "Normal physiology",
  solver: { dt: 0.001, sampleHz: 240, measureBeats: 3 },
  settleStatusByInstance: {},
  healthByInstance: {},
  metricsByInstance: {},
  expectedFindings: [],
  morphologyGates: [],
  limitations: [],
  warnings: [],
  errors: [],
  verdict: "pass",
  ...overrides,
});

describe("case validation helpers", () => {
  it("fails report when expected findings are missing", () => {
    const messages = collectExpectedFindingMessages([], { hasDefinitions: false });
    expect(messages.errors).toContain("No structured expectedFindings are defined.");
    expect(verdictFromMessages(messages)).toBe("fail");
  });

  it("fails report when expected finding is skipped", () => {
    const result = verifyExpectedFinding(metricFinding(), {});
    expect(result.status).toBe("skip");

    const messages = collectExpectedFindingMessages([result], { hasDefinitions: true });
    expect(messages.errors).toContain("1 expected finding(s) were skipped.");
    expect(verdictFromMessages(messages)).toBe("fail");
  });

  it("fails report when comparator instance is missing", () => {
    const result = verifyExpectedFinding(metricFinding(), {
      "2": metrics({ CO_L: 5.5 }),
    });
    expect(result.status).toBe("skip");
    expect(result.message).toMatch(/Comparator/);

    const messages = collectExpectedFindingMessages([result], { hasDefinitions: true });
    expect(verdictFromMessages(messages)).toBe("fail");
  });

  it("fails report when metric or observable is omitted", () => {
    const result = verifyExpectedFinding(metricFinding({ metric: undefined, observable: undefined }), {
      "1": metrics({ CO_L: 4 }),
      "2": metrics({ CO_L: 5 }),
    });
    expect(result.status).toBe("skip");

    const messages = collectExpectedFindingMessages([result], { hasDefinitions: true });
    expect(verdictFromMessages(messages)).toBe("fail");
  });

  it("fails report when health status is failed", () => {
    const messages = collectHealthMessages({ "1": health("failed", ["NaN state"]) }, { "1": "Normal" });
    expect(messages.errors).toEqual(["Normal: health failed (NaN state)"]);
    expect(verdictFromMessages(messages)).toBe("fail");
  });

  it("reports warning verdict when health status is warning", () => {
    const messages = collectHealthMessages({ "1": health("warning", ["small drift"]) }, { "1": "Normal" });
    expect(messages.warnings).toEqual(["Normal: health warning (small drift)"]);
    expect(verdictFromMessages(messages)).toBe("warning");
  });

  it("passes and fails range assertions", () => {
    const finding = metricFinding({
      id: "co-range",
      comparatorInstanceId: undefined,
      direction: undefined,
      range: { min: 4, max: 6 },
    });

    expect(verifyExpectedFinding(finding, { "2": metrics({ CO_L: 5 }) }).status).toBe("pass");
    expect(verifyExpectedFinding(finding, { "2": metrics({ CO_L: 7 }) }).status).toBe("fail");
  });

  it("counts morphology gate pass, fail, and skip statuses", () => {
    const gates: MorphologyGateResult[] = [
      { id: "la-loop", label: "LA loop", instanceId: "1", status: "pass", message: "ok" },
      { id: "pvf-ar", label: "PVF Ar", instanceId: "1", status: "fail", message: "missing reversal" },
      { id: "qmv-peaks", label: "QMV peaks", instanceId: "1", status: "skip", message: "not configured" },
    ];

    expect(countResultStatuses(gates)).toEqual({ pass: 1, fail: 1, skip: 1 });
  });

  it("keeps empty morphology gates non-failing", () => {
    const validationReport = report();

    expect(countResultStatuses(validationReport.morphologyGates)).toEqual({ pass: 0, fail: 0, skip: 0 });
    expect(validationReport.verdict).toBe("pass");
    expect(caseValidationReportToMarkdown([validationReport], "2026-06-07T00:00:00.000Z"))
      .toContain("| normal-sinus | pass | 0/0/0 | 0/0/0 | 0/0 |");
  });

  it("renders expected finding summary and valve flow metrics in Markdown", () => {
    const validationReport = report({
      verdict: "warning",
      healthByInstance: { "1": health("warning", ["small drift"]) },
      metricsByInstance: {
        "1": metrics({
          MVForwardVolumeMl: 12.34,
          MVReverseVolumeMl: 1.23,
          MVRegurgitantFraction: 0.1,
          AoVForwardVolumeMl: 23.45,
          AoVReverseVolumeMl: 0.5,
          AoVRegurgitantFraction: 0.02,
          TVForwardVolumeMl: 34.56,
          TVReverseVolumeMl: 0.25,
          TVRegurgitantFraction: 0.01,
          PVForwardVolumeMl: 45.67,
          PVReverseVolumeMl: 0.1,
          PVRegurgitantFraction: 0.002,
        }),
      },
      expectedFindings: [
        expectedResult("pass", "co-normal"),
        expectedResult("fail", "lap-high"),
        expectedResult("skip", "ef-missing"),
      ],
      morphologyGates: [
        { id: "la-loop", label: "LA loop", instanceId: "1", status: "skip", message: "not configured" },
      ],
      warnings: ["Normal: health warning (small drift)"],
    });

    const markdown = caseValidationReportToMarkdown([validationReport], "2026-06-07T00:00:00.000Z");

    expect(markdown).toContain("| Case | Verdict | Expected pass/fail/skip | Morphology pass/fail/skip | Health warnings/errors |");
    expect(markdown).toContain("| normal-sinus | warning | 1/1/1 | 0/0/1 | 1/0 |");
    expect(markdown).toContain("| Instance | MV F/R/RF | AoV F/R/RF | TV F/R/RF | PV F/R/RF |");
    expect(markdown).toContain("| 1 | 12.3/1.2/0.100 | 23.4/0.5/0.020 | 34.6/0.3/0.010 | 45.7/0.1/0.002 |");
  });
});
