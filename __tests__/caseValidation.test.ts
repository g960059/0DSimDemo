import { describe, expect, it } from "vitest";
import {
  collectExpectedFindingMessages,
  collectHealthMessages,
  verdictFromMessages,
  verifyExpectedFinding,
  type ExpectedFinding,
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
});
