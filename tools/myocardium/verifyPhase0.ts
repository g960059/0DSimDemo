import { readFileSync } from "node:fs";
import path from "node:path";
import {
  validatePhase0Artifacts,
  type Phase0ValidationReport,
  type ValidationIssue,
} from "./phase0Validation";

type CliOptions = {
  rootDir: string;
};

const options = parseArgs(process.argv.slice(2));
const report = validatePhase0Artifacts({
  sourcesRegistry: readJson(path.join(options.rootDir, "data", "myocardium", "sources.json")),
  decisionsArtifact: readJson(path.join(options.rootDir, "data", "myocardium", "phase0-decisions.json")),
  claimFreezeArtifact: readJson(path.join(options.rootDir, "data", "myocardium", "targets", "claim-freeze-v1.json")),
});

printReport(report);
if (!report.pass) process.exitCode = 1;

function parseArgs(args: string[]): CliOptions {
  const options: CliOptions = {
    rootDir: process.cwd(),
  };

  for (const arg of args) {
    const [key, value] = arg.split("=", 2);
    if (key === "--root" && value) options.rootDir = path.resolve(value);
    else if (key === "--help") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return options;
}

function readJson(filePath: string): unknown {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function printReport(report: Phase0ValidationReport): void {
  const status = report.pass ? "PASS" : "FAIL";
  // eslint-disable-next-line no-console
  console.log(
    `myocardium Phase 0 artifact-integrity ${status} ` +
      `errors=${report.summary.errorCount} warnings=${report.summary.warningCount} ` +
      `pendingDecisions=${report.summary.pendingDecisionCount}/${report.summary.requiredDecisionCount} ` +
      `sources=${report.summary.sourceCount} claimFreezeCategories=${report.summary.claimFreezeCategoryCount}`,
  );

  if (report.pendingDecisions.length > 0) {
    // eslint-disable-next-line no-console
    console.log(
      `pending owner decisions: ${report.pendingDecisions
        .map((decision) => `${decision.id} ${decision.title} (${decision.decideBy})`)
        .join("; ")}`,
    );
  }

  printIssues("errors", report.errors);
  printIssues("warnings", report.warnings);
}

function printIssues(label: string, issues: ValidationIssue[]): void {
  if (issues.length === 0) return;
  // eslint-disable-next-line no-console
  console.log(`${label}:`);
  for (const issue of issues.slice(0, 20)) {
    // eslint-disable-next-line no-console
    console.log(`- [${issue.code}] ${issue.path}: ${issue.message}`);
  }
  if (issues.length > 20) {
    // eslint-disable-next-line no-console
    console.log(`- ... ${issues.length - 20} more`);
  }
}

function printHelp(): void {
  // eslint-disable-next-line no-console
  console.log([
    "Usage: npm run verify:myocardium-phase0 -- [--root=DIR]",
    "",
    "Validates myocardium Phase 0 artifact integrity only. Pending owner decisions are reported but do not fail the gate.",
  ].join("\n"));
}
