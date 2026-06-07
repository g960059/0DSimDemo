import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { OFFICIAL_CASES } from "@/officialCases";
import { DEFAULT_SETTLE_POLICY } from "@/engine/settling";
import { measureConverged } from "@/engine/measure";
import { MODEL_VERSION } from "@/engine/stateContract";
import { caseDocumentToSimInstances, ENGINE_VERSION, isCaseDisplayable } from "@/caseDoc";
import type { CaseDocument } from "@/caseDoc";
import type { SimMetrics, SimSample } from "@/engine/protocol";
import type {
  CaseValidationReport,
  ExpectedFinding,
  ExpectedFindingResult,
  StructuredModelLimitation,
} from "@/caseValidation";

const DEFAULT_OUT_DIR = path.join("artifacts", "case-validation", new Date().toISOString().replace(/[:.]/g, "-"));

const MEASURE_OPTIONS = {
  dt: 0.001,
  sampleHz: 240,
  measureBeats: 3,
  settlePolicy: { ...DEFAULT_SETTLE_POLICY, tolShape: 0.25 },
  requireProjectorQuiet: false,
};

function parseArgs(argv: string[]) {
  const outArg = argv.find((arg) => arg.startsWith("--out="));
  return {
    outDir: outArg ? outArg.slice("--out=".length) : DEFAULT_OUT_DIR,
  };
}

function officialMeasureOptions(caseId: string) {
  return {
    ...MEASURE_OPTIONS,
    settlePolicy: {
      ...MEASURE_OPTIONS.settlePolicy,
      ...(caseId === "lv-failure-dobutamine" ? { tolPrimary: 0.01 } : {}),
    },
  };
}

function legacyLimitations(doc: CaseDocument): StructuredModelLimitation[] {
  if (doc.spec.structuredLimitations?.length) return doc.spec.structuredLimitations;
  return doc.spec.modelLimitations.map((message, index) => ({
    id: `legacy-${index + 1}`,
    category: inferLimitationCategory(message),
    severity: "caution",
    message,
    affects: [doc.meta.id],
    surfaceInUi: true,
  }));
}

function inferLimitationCategory(message: string): StructuredModelLimitation["category"] {
  const lower = message.toLowerCase();
  if (lower.includes("0d") || lower.includes("lumped")) return "0d";
  if (lower.includes("calib") || lower.includes("m12")) return "uncalibrated";
  if (lower.includes("reflex") || lower.includes("baroreflex")) return "missing-reflex";
  if (lower.includes("valve")) return "valve";
  if (lower.includes("coronary")) return "coronary";
  if (lower.includes("pericard") || lower.includes("sept")) return "pericardium";
  return "numerical";
}

function verifyExpectedFinding(
  finding: ExpectedFinding,
  metricsByInstance: Record<string, SimMetrics | null>,
  sampleByInstance: Record<string, SimSample | null>,
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

function comparableValue(value: unknown): number | boolean | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "boolean") return value;
  return undefined;
}

function evaluateDirection(
  actual: unknown,
  comparator: unknown,
  direction: ExpectedFinding["direction"],
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

function verifyCase(doc: CaseDocument): CaseValidationReport {
  const warnings: string[] = [];
  const errors: string[] = [];
  const settleStatusByInstance: CaseValidationReport["settleStatusByInstance"] = {};
  const healthByInstance: CaseValidationReport["healthByInstance"] = {};
  const metricsByInstance: CaseValidationReport["metricsByInstance"] = {};
  const sampleByInstance: Record<string, SimSample | null> = {};

  if (!isCaseDisplayable(doc)) {
    errors.push("Case is not displayable: modelLimitations is missing or empty.");
  }
  if (!doc.spec.expectedFindings?.length) {
    warnings.push("No structured expectedFindings are defined yet.");
  }

  try {
    const instances = caseDocumentToSimInstances(doc);
    for (const instance of instances) {
      try {
        const measurement = measureConverged(instance.params, {
          ...officialMeasureOptions(doc.meta.id),
          targetTBV: instance.targetVolume,
        });
        settleStatusByInstance[instance.id] = measurement.settleStatus;
        healthByInstance[instance.id] = measurement.health;
        metricsByInstance[instance.id] = measurement.metrics;
        sampleByInstance[instance.id] = measurement.samples.at(-1) ?? null;
      } catch (err) {
        settleStatusByInstance[instance.id] = null;
        healthByInstance[instance.id] = null;
        metricsByInstance[instance.id] = null;
        sampleByInstance[instance.id] = null;
        errors.push(`${instance.name}: ${(err as Error).message}`);
      }
    }
  } catch (err) {
    errors.push(`Case resolution failed: ${(err as Error).message}`);
  }

  const expectedFindings = (doc.spec.expectedFindings ?? []).map((finding) => (
    verifyExpectedFinding(finding, metricsByInstance, sampleByInstance)
  ));
  if (expectedFindings.some((result) => result.status === "fail")) {
    errors.push("One or more expected findings failed.");
  }

  const verdict = errors.length > 0 ? "fail" : warnings.length > 0 ? "warning" : "pass";
  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    modelVersion: MODEL_VERSION,
    engineVersion: ENGINE_VERSION,
    knobMappingVersion: doc.knobMappingVersion,
    caseId: doc.meta.id,
    caseTitle: doc.meta.title,
    solver: {
      dt: MEASURE_OPTIONS.dt,
      sampleHz: MEASURE_OPTIONS.sampleHz,
      measureBeats: MEASURE_OPTIONS.measureBeats,
    },
    settleStatusByInstance,
    healthByInstance,
    metricsByInstance,
    expectedFindings,
    morphologyGates: [],
    limitations: legacyLimitations(doc),
    warnings,
    errors,
    verdict,
  };
}

function markdownReport(reports: CaseValidationReport[]) {
  const lines: string[] = [];
  lines.push("# Case Validation Report");
  lines.push("");
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push("");
  lines.push(`- Cases: ${reports.length}`);
  lines.push(`- Pass: ${reports.filter((r) => r.verdict === "pass").length}`);
  lines.push(`- Warning: ${reports.filter((r) => r.verdict === "warning").length}`);
  lines.push(`- Fail: ${reports.filter((r) => r.verdict === "fail").length}`);
  for (const report of reports) {
    lines.push("");
    lines.push(`## ${report.caseTitle}`);
    lines.push("");
    lines.push(`- Case id: ${report.caseId}`);
    lines.push(`- Verdict: ${report.verdict}`);
    lines.push(`- Instances measured: ${Object.keys(report.metricsByInstance).length}`);
    lines.push(`- Expected findings: ${report.expectedFindings.length}`);
    lines.push(`- Limitations: ${report.limitations.length}`);
    for (const warning of report.warnings) lines.push(`- Warning: ${warning}`);
    for (const error of report.errors) lines.push(`- Error: ${error}`);
  }
  lines.push("");
  return lines.join("\n");
}

const { outDir } = parseArgs(process.argv.slice(2));
mkdirSync(outDir, { recursive: true });
const reports = OFFICIAL_CASES.map(verifyCase);
writeFileSync(path.join(outDir, "official-case-validation.json"), JSON.stringify(reports, null, 2));
writeFileSync(path.join(outDir, "report.md"), markdownReport(reports));

const failed = reports.filter((report) => report.verdict === "fail");
console.log(`Wrote ${reports.length} case validation reports to ${outDir}`);
console.log(`pass=${reports.filter((r) => r.verdict === "pass").length} warning=${reports.filter((r) => r.verdict === "warning").length} fail=${failed.length}`);
if (failed.length > 0) {
  process.exitCode = 1;
}
