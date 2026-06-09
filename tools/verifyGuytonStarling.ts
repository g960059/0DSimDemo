import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  guytonStarlingValidationReportToMarkdown,
  runGuytonStarlingValidation,
} from "@/engine/guytonStarlingValidation";

const DEFAULT_OUT_DIR = path.join(
  "artifacts",
  "guyton-starling-validation",
  new Date().toISOString().replace(/[:.]/g, "-"),
);

function parseArgs(argv: string[]) {
  const outArg = argv.find((arg) => arg.startsWith("--out="));
  return {
    outDir: outArg ? outArg.slice("--out=".length) : DEFAULT_OUT_DIR,
  };
}

const { outDir } = parseArgs(process.argv.slice(2));
mkdirSync(outDir, { recursive: true });

const report = await runGuytonStarlingValidation();
writeFileSync(path.join(outDir, "report.json"), JSON.stringify(report, null, 2));
writeFileSync(path.join(outDir, "report.md"), guytonStarlingValidationReportToMarkdown(report));

console.log(`Wrote Guyton/Starling validation report to ${outDir}`);
console.log(
  `scenarios=${report.summary.scenarioCount} warnings=${report.summary.warningCount} errors=${report.summary.errorCount}`,
);
