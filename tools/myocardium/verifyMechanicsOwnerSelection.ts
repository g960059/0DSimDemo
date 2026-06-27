import path from "node:path";
import {
  loadMechanicsOwnerSelectionValidationInput,
  validateMechanicsOwnerSelection,
  type MechanicsOwnerSelectionValidationReport,
} from "./phase4aMechanicsOwnerSelectionValidation";
import type { ValidationIssue } from "./phase4aMechanicsDecisionValidation";

type CliOptions = {
  rootDir: string;
};

const options = parseArgs(process.argv.slice(2));
const report = validateMechanicsOwnerSelection(loadMechanicsOwnerSelectionValidationInput(options.rootDir));

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

function printReport(report: MechanicsOwnerSelectionValidationReport): void {
  const status = report.pass ? "PASS" : "FAIL";
  // eslint-disable-next-line no-console
  console.log(
    `myocardium Phase 4A mechanics owner selection ${status} `
    + `errors=${report.summary.errorCount} warnings=${report.summary.warningCount} `
    + `candidates=${report.summary.candidateCount} criteria=${report.summary.criterionCount} `
    + `phase3Descriptors=${report.summary.phase3DescriptorCount} decisionDocs=${report.summary.decisionDocCount} `
    + `integrationFiles=${report.summary.integrationFileCount} ownerSelection=${report.summary.ownerSelectionPresent}`,
  );

  printIssues("errors", report.errors);
  printIssues("warnings", report.warnings);
}

function printIssues(label: string, issues: ValidationIssue[]): void {
  if (issues.length === 0) return;
  // eslint-disable-next-line no-console
  console.log(`${label}:`);
  for (const issue of issues.slice(0, 30)) {
    // eslint-disable-next-line no-console
    console.log(`- [${issue.code}] ${issue.path}: ${issue.message}`);
  }
  if (issues.length > 30) {
    // eslint-disable-next-line no-console
    console.log(`- ... ${issues.length - 30} more`);
  }
}

function printHelp(): void {
  // eslint-disable-next-line no-console
  console.log([
    "Usage: npm run verify:myocardium-mechanics-selection -- [--root=DIR]",
    "",
    "Validates the Decision 19 owner-selection artifact, accepted docs rows, and runtime/case non-leak boundary.",
    "The Phase 4A dossier must remain recommendation-only and pending; this verifier does not authorize Phase 4B runtime work.",
  ].join("\n"));
}
