import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { OFFICIAL_CASES } from "@/officialCases";
import { DEFAULT_SETTLE_POLICY } from "@/engine/settling";
import { measureConverged } from "@/engine/measure";
import { MODEL_VERSION } from "@/engine/stateContract";
import { caseDocumentToSimInstances, ENGINE_VERSION, isCaseDisplayable } from "@/caseDoc";
import type { CaseDocument } from "@/caseDoc";
import type { SimSample } from "@/engine/protocol";
import type {
  CaseValidationReport,
  StructuredModelLimitation,
} from "@/caseValidation";
import {
  collectExpectedFindingMessages,
  collectHealthMessages,
  verdictFromMessages,
  verifyExpectedFinding,
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
    allowWarnings: argv.includes("--allow-warnings"),
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

function verifyCase(doc: CaseDocument): CaseValidationReport {
  const warnings: string[] = [];
  const errors: string[] = [];
  const settleStatusByInstance: CaseValidationReport["settleStatusByInstance"] = {};
  const healthByInstance: CaseValidationReport["healthByInstance"] = {};
  const metricsByInstance: CaseValidationReport["metricsByInstance"] = {};
  const sampleByInstance: Record<string, SimSample | null> = {};
  const namesByInstance: Record<string, string> = {};

  if (!isCaseDisplayable(doc)) {
    errors.push("Case is not displayable: modelLimitations is missing or empty.");
  }

  try {
    const instances = caseDocumentToSimInstances(doc);
    for (const instance of instances) {
      namesByInstance[instance.id] = instance.name;
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
  const expectedMessages = collectExpectedFindingMessages(expectedFindings, {
    hasDefinitions: Boolean(doc.spec.expectedFindings?.length),
  });
  warnings.push(...expectedMessages.warnings);
  errors.push(...expectedMessages.errors);

  const healthMessages = collectHealthMessages(healthByInstance, namesByInstance);
  warnings.push(...healthMessages.warnings);
  errors.push(...healthMessages.errors);

  const verdict = verdictFromMessages({ warnings, errors });
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

const { outDir, allowWarnings } = parseArgs(process.argv.slice(2));
mkdirSync(outDir, { recursive: true });
const reports = OFFICIAL_CASES.map(verifyCase);
writeFileSync(path.join(outDir, "official-case-validation.json"), JSON.stringify(reports, null, 2));
writeFileSync(path.join(outDir, "report.md"), markdownReport(reports));

const failed = reports.filter((report) => report.verdict === "fail");
const nonPass = reports.filter((report) => report.verdict !== "pass");
console.log(`Wrote ${reports.length} case validation reports to ${outDir}`);
console.log(`pass=${reports.filter((r) => r.verdict === "pass").length} warning=${reports.filter((r) => r.verdict === "warning").length} fail=${failed.length}`);
if (failed.length > 0 || (!allowWarnings && nonPass.length > 0)) {
  process.exitCode = 1;
}
