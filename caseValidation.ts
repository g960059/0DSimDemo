import type { SimMetrics, SimSample, SimulationHealth } from "@/engine/protocol";
import type { SettleStatus } from "@/engine/settling";

export type ExpectedFindingDirection = "up" | "down" | "unchanged" | "present" | "absent";
export type ExpectedFindingGate = "smoke" | "teaching" | "validation";

export type ExpectedFindingRange = {
  min?: number;
  max?: number;
};

export type ExpectedFinding = {
  id: string;
  description: string;
  instanceId: string;
  comparatorInstanceId?: string;
  metric?: keyof SimMetrics;
  observable?: keyof SimSample;
  direction?: ExpectedFindingDirection;
  range?: ExpectedFindingRange;
  tolerance?: number;
  gate: ExpectedFindingGate;
};

export type StructuredModelLimitation = {
  id: string;
  category: "0d" | "uncalibrated" | "missing-reflex" | "valve" | "coronary" | "pericardium" | "numerical" | "ui";
  severity: "info" | "caution" | "hard-limit";
  message: string;
  affects: string[];
  surfaceInUi: boolean;
};

export type ExpectedFindingResult = {
  finding: ExpectedFinding;
  status: "pass" | "fail" | "skip";
  actualValue?: number | boolean;
  comparatorValue?: number | boolean;
  message: string;
};

export type MorphologyGateResult = {
  id: string;
  label: string;
  instanceId: string;
  status: "pass" | "fail" | "skip";
  message: string;
  values?: Record<string, number | boolean | string | null>;
};

export type CaseValidationSolverConfig = {
  dt: number;
  sampleHz: number;
  settleSeconds?: number;
  recordSeconds?: number;
  measureBeats?: number;
};

export type CaseValidationReport = {
  schemaVersion: 1;
  generatedAt: string;
  modelVersion: string;
  engineVersion: string;
  knobMappingVersion: string;
  caseId: string;
  caseTitle: string;
  solver: CaseValidationSolverConfig;
  settleStatusByInstance: Record<string, SettleStatus | null>;
  healthByInstance: Record<string, SimulationHealth | null>;
  metricsByInstance: Record<string, SimMetrics | null>;
  expectedFindings: ExpectedFindingResult[];
  morphologyGates: MorphologyGateResult[];
  limitations: StructuredModelLimitation[];
  warnings: string[];
  errors: string[];
  verdict: "pass" | "warning" | "fail";
};

export type ValidationResultStatusCounts = {
  pass: number;
  fail: number;
  skip: number;
};

export type HealthStatusCounts = {
  warnings: number;
  errors: number;
};

export type ValidationMessages = {
  warnings: string[];
  errors: string[];
};

export function verifyExpectedFinding(
  finding: ExpectedFinding,
  metricsByInstance: Record<string, SimMetrics | null>,
  sampleByInstance: Record<string, SimSample | null> = {},
): ExpectedFindingResult {
  const actual = finding.metric
    ? metricsByInstance[finding.instanceId]?.[finding.metric]
    : finding.observable
      ? sampleByInstance[finding.instanceId]?.[finding.observable]
      : undefined;
  const comparator = finding.comparatorInstanceId
    ? finding.metric
      ? metricsByInstance[finding.comparatorInstanceId]?.[finding.metric]
      : finding.observable
        ? sampleByInstance[finding.comparatorInstanceId]?.[finding.observable]
        : undefined
    : undefined;

  if (actual === undefined) {
    return { finding, status: "skip", message: "No metric or observable value was available for this finding." };
  }
  if (finding.comparatorInstanceId && comparator === undefined) {
    return { finding, status: "skip", actualValue: comparableValue(actual), message: "Comparator value was unavailable." };
  }

  if (finding.range) {
    const pass = evaluateRange(actual, finding.range);
    return {
      finding,
      status: pass ? "pass" : "fail",
      actualValue: comparableValue(actual),
      comparatorValue: comparableValue(comparator),
      message: pass ? "Expected range satisfied." : "Expected range was not satisfied.",
    };
  }

  if (!finding.direction) {
    return { finding, status: "skip", actualValue: comparableValue(actual), message: "Expected finding has neither range nor direction." };
  }

  const tolerance = finding.tolerance ?? 0;
  const pass = evaluateDirection(actual, comparator, finding.direction, tolerance);
  return {
    finding,
    status: pass ? "pass" : "fail",
    actualValue: comparableValue(actual),
    comparatorValue: comparableValue(comparator),
    message: pass ? "Expected finding satisfied." : "Expected finding was not satisfied.",
  };
}

export function collectExpectedFindingMessages(
  results: ExpectedFindingResult[],
  options: { hasDefinitions: boolean },
): ValidationMessages {
  const warnings: string[] = [];
  const errors: string[] = [];
  if (!options.hasDefinitions) {
    errors.push("No structured expectedFindings are defined.");
  }
  const skipped = results.filter((result) => result.status === "skip");
  const failed = results.filter((result) => result.status === "fail");
  if (skipped.length > 0) {
    errors.push(`${skipped.length} expected finding(s) were skipped.`);
  }
  if (failed.length > 0) {
    errors.push(`${failed.length} expected finding(s) failed.`);
  }
  return { warnings, errors };
}

export function collectHealthMessages(
  healthByInstance: Record<string, SimulationHealth | null>,
  namesByInstance: Record<string, string> = {},
): ValidationMessages {
  const warnings: string[] = [];
  const errors: string[] = [];
  for (const [instanceId, health] of Object.entries(healthByInstance)) {
    if (!health) continue;
    const label = namesByInstance[instanceId] ?? instanceId;
    const details = health.messages.length > 0 ? health.messages.join("; ") : "no details";
    if (health.status === "failed") {
      errors.push(`${label}: health failed (${details})`);
    } else if (health.status === "warning") {
      warnings.push(`${label}: health warning (${details})`);
    }
  }
  return { warnings, errors };
}

export function verdictFromMessages(messages: ValidationMessages): CaseValidationReport["verdict"] {
  if (messages.errors.length > 0) return "fail";
  if (messages.warnings.length > 0) return "warning";
  return "pass";
}

export function countResultStatuses(
  results: ReadonlyArray<{ status: "pass" | "fail" | "skip" }>,
): ValidationResultStatusCounts {
  return results.reduce<ValidationResultStatusCounts>(
    (acc, result) => {
      acc[result.status]++;
      return acc;
    },
    { pass: 0, fail: 0, skip: 0 },
  );
}

export function countHealthStatuses(healthByInstance: Record<string, SimulationHealth | null>): HealthStatusCounts {
  const counts: HealthStatusCounts = { warnings: 0, errors: 0 };
  for (const health of Object.values(healthByInstance)) {
    if (health?.status === "warning") counts.warnings++;
    else if (health?.status === "failed") counts.errors++;
  }
  return counts;
}

export function caseValidationReportToMarkdown(
  reports: ReadonlyArray<CaseValidationReport>,
  generatedAt = new Date().toISOString(),
): string {
  const lines: string[] = [];
  lines.push("# Case Validation Report");
  lines.push("");
  lines.push(`Generated: ${generatedAt}`);
  lines.push("");
  lines.push(`- Cases: ${reports.length}`);
  lines.push(`- Pass: ${reports.filter((r) => r.verdict === "pass").length}`);
  lines.push(`- Warning: ${reports.filter((r) => r.verdict === "warning").length}`);
  lines.push(`- Fail: ${reports.filter((r) => r.verdict === "fail").length}`);
  lines.push("");
  lines.push("| Case | Verdict | Expected pass/fail/skip | Morphology pass/fail/skip | Health warnings/errors |");
  lines.push("| --- | --- | ---: | ---: | ---: |");
  for (const report of reports) {
    const expected = countResultStatuses(report.expectedFindings);
    const morphology = countResultStatuses(report.morphologyGates);
    const health = countHealthStatuses(report.healthByInstance);
    lines.push(
      `| ${report.caseId} | ${report.verdict} | ${formatStatusCounts(expected)} | ${formatStatusCounts(morphology)} | ${health.warnings}/${health.errors} |`,
    );
  }
  for (const report of reports) {
    lines.push("");
    lines.push(`## ${report.caseTitle}`);
    lines.push("");
    lines.push(`- Case id: ${report.caseId}`);
    lines.push(`- Verdict: ${report.verdict}`);
    lines.push(`- Instances measured: ${Object.keys(report.metricsByInstance).length}`);
    lines.push(`- Expected findings: ${report.expectedFindings.length}`);
    lines.push(`- Morphology gates: ${report.morphologyGates.length}`);
    lines.push(`- Limitations: ${report.limitations.length}`);
    for (const warning of report.warnings) lines.push(`- Warning: ${warning}`);
    for (const error of report.errors) lines.push(`- Error: ${error}`);
    lines.push("");
    lines.push("### Valve Flow Metrics");
    lines.push("");
    lines.push("| Instance | MV F/R/RF | AoV F/R/RF | TV F/R/RF | PV F/R/RF |");
    lines.push("| --- | ---: | ---: | ---: | ---: |");
    for (const [instanceId, metrics] of Object.entries(report.metricsByInstance)) {
      lines.push(
        `| ${instanceId} | ${valveFlowCell(metrics, "MV")} | ${valveFlowCell(metrics, "AoV")} | ${valveFlowCell(metrics, "TV")} | ${valveFlowCell(metrics, "PV")} |`,
      );
    }
  }
  lines.push("");
  return lines.join("\n");
}

function comparableValue(value: unknown): number | boolean | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "boolean") return value;
  return undefined;
}

function evaluateRange(actual: unknown, range: ExpectedFindingRange): boolean {
  if (typeof actual !== "number" || !Number.isFinite(actual)) return false;
  if (range.min !== undefined && actual < range.min) return false;
  if (range.max !== undefined && actual > range.max) return false;
  return true;
}

function evaluateDirection(
  actual: unknown,
  comparator: unknown,
  direction: ExpectedFindingDirection,
  tolerance: number,
): boolean {
  if (direction === "present") {
    if (typeof actual === "boolean") return actual;
    return typeof actual === "number" && Number.isFinite(actual) && Math.abs(actual) > tolerance;
  }
  if (direction === "absent") {
    if (typeof actual === "boolean") return !actual;
    return typeof actual === "number" && Number.isFinite(actual) && Math.abs(actual) <= tolerance;
  }
  if (typeof actual !== "number" || !Number.isFinite(actual)) return false;
  if (typeof comparator !== "number" || !Number.isFinite(comparator)) return false;
  if (direction === "up") return actual > comparator + tolerance;
  if (direction === "down") return actual < comparator - tolerance;
  return Math.abs(actual - comparator) <= tolerance;
}

function formatStatusCounts(counts: ValidationResultStatusCounts): string {
  return `${counts.pass}/${counts.fail}/${counts.skip}`;
}

function valveFlowCell(metrics: SimMetrics | null, valve: "MV" | "AoV" | "TV" | "PV"): string {
  if (!metrics) return "n/a";
  if (valve === "MV") {
    return `${round(metrics.MVForwardVolumeMl, 1)}/${round(metrics.MVReverseVolumeMl, 1)}/${round(metrics.MVRegurgitantFraction, 3)}`;
  }
  if (valve === "AoV") {
    return `${round(metrics.AoVForwardVolumeMl, 1)}/${round(metrics.AoVReverseVolumeMl, 1)}/${round(metrics.AoVRegurgitantFraction, 3)}`;
  }
  if (valve === "TV") {
    return `${round(metrics.TVForwardVolumeMl, 1)}/${round(metrics.TVReverseVolumeMl, 1)}/${round(metrics.TVRegurgitantFraction, 3)}`;
  }
  return `${round(metrics.PVForwardVolumeMl, 1)}/${round(metrics.PVReverseVolumeMl, 1)}/${round(metrics.PVRegurgitantFraction, 3)}`;
}

function round(value: number, digits: number): string {
  return Number.isFinite(value) ? value.toFixed(digits) : "n/a";
}
