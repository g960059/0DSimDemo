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
  morphologyGates: [];
  limitations: StructuredModelLimitation[];
  warnings: string[];
  errors: string[];
  verdict: "pass" | "warning" | "fail";
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
