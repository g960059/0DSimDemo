import path from "node:path";
import {
  loadMechanicsDecisionValidationInput,
  validateMechanicsDecisionDossier,
  type MechanicsDecisionValidationReport,
  type ValidationIssue,
} from "./phase4aMechanicsDecisionValidation";

type CliOptions = {
  rootDir: string;
};

const options = parseArgs(process.argv.slice(2));
const report = validateMechanicsDecisionDossier(loadMechanicsDecisionValidationInput(options.rootDir));

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

function printReport(report: MechanicsDecisionValidationReport): void {
  const status = report.pass ? "PASS" : "FAIL";
  // eslint-disable-next-line no-console
  console.log(
    `myocardium Phase 4A mechanics decision dossier ${status} `
    + `errors=${report.summary.errorCount} warnings=${report.summary.warningCount} `
    + `candidates=${report.summary.candidateCount} criteria=${report.summary.criterionCount} `
    + `phase3Descriptors=${report.summary.phase3DescriptorCount} decisionDocs=${report.summary.decisionDocCount} `
    + `integrationFiles=${report.summary.integrationFileCount}`,
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
    "Usage: npm run verify:myocardium-mechanics-decision -- [--root=DIR]",
    "",
    "Validates the Phase 3 owner GO artifact and Phase 4A mechanics Decision 19 dossier only.",
    "This verifier must not pass if the dossier claims owner acceptance or leaks into runtime/case wiring.",
  ].join("\n"));
}
