import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { DEFAULT_PARAMS } from "@/constants";
import {
  MODELCORE_RUNTIME_LEGACY_ACTIVE_STRESS_ROLLBACK_MODE,
  MODELCORE_RUNTIME_USER0_STAGED_DEFAULT_MODE,
  type ModelCoreRuntimeActiveSourceMode,
} from "@/engine/myocardium/runtimeActiveSource";
import { generateVerificationSvgs } from "@/engine/verification/artifacts";
import {
  reportToMarkdown,
  runVerification,
  toVerificationArtifact,
  type VerificationGateSet,
} from "@/engine/verification/report";
import type { VerificationMode } from "@/engine/verification/profiles";

type CliOptions = {
  profile: VerificationMode;
  gateSet: VerificationGateSet;
  outDir: string;
  runtimeActiveSourceMode?: ModelCoreRuntimeActiveSourceMode;
};

const options = parseArgs(process.argv.slice(2));
const report = runVerification(DEFAULT_PARAMS, {
  profile: options.profile,
  gateSet: options.gateSet,
  runtimeActiveSourceMode: options.runtimeActiveSourceMode,
});
mkdirSync(options.outDir, { recursive: true });
writeFileSync(
  path.join(options.outDir, "report.json"),
  `${JSON.stringify(toVerificationArtifact(report), null, 2)}\n`,
);
writeFileSync(path.join(options.outDir, "report.md"), reportToMarkdown(report));
const svgs = generateVerificationSvgs(report);
for (const [filename, svg] of Object.entries(svgs)) {
  writeFileSync(path.join(options.outDir, filename), svg);
}

// eslint-disable-next-line no-console
console.log(
  `verification ${report.summary.pass ? "PASS" : "FAIL"} ` +
  `profile=${report.profile.mode} gateSet=${report.gateSet} ` +
  `runtime=${report.runtimeActiveSourceMode ?? "legacy-default"} ` +
  `hardFailures=${report.summary.hardFailures} softFailures=${report.summary.softFailures} ` +
  `out=${options.outDir}`,
);

if (!report.summary.pass) process.exitCode = 1;

function parseArgs(args: string[]): CliOptions {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const opts: CliOptions = {
    profile: "verifyAccurate",
    gateSet: "normalBaseline",
    outDir: path.join("artifacts", "verification", timestamp),
  };
  for (const arg of args) {
    const [key, value] = arg.split("=", 2);
    if (key === "--profile" && isVerificationMode(value)) opts.profile = value;
    else if (key === "--gate-set" && isGateSet(value)) opts.gateSet = value;
    else if (key === "--out" && value) opts.outDir = value;
    else if (key === "--runtime" && isRuntimeMode(value)) opts.runtimeActiveSourceMode = runtimeMode(value);
    else if (key === "--help") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return opts;
}

function isVerificationMode(value: string | undefined): value is VerificationMode {
  return value === "preview" || value === "fitFast" || value === "verifyAccurate";
}

function isGateSet(value: string | undefined): value is VerificationGateSet {
  return value === "validityOnly" || value === "normalBaseline";
}

function printHelp(): void {
  // eslint-disable-next-line no-console
  console.log([
    "Usage: npm run verify:baseline -- [--profile=fitFast|verifyAccurate|preview] [--gate-set=normalBaseline|validityOnly] [--runtime=user0|legacy|none] [--out=DIR]",
    "",
    "Examples:",
    "  npm run verify:baseline",
    "  npm run verify:baseline -- --runtime=user0",
    "  npm run verify:baseline -- --profile=fitFast --out=artifacts/verification/fit-fast",
  ].join("\n"));
}

function isRuntimeMode(value: string | undefined): value is "user0" | "legacy" | "none" {
  return value === "user0" || value === "legacy" || value === "none";
}

function runtimeMode(value: "user0" | "legacy" | "none"): ModelCoreRuntimeActiveSourceMode | undefined {
  if (value === "user0") return MODELCORE_RUNTIME_USER0_STAGED_DEFAULT_MODE;
  if (value === "legacy") return MODELCORE_RUNTIME_LEGACY_ACTIVE_STRESS_ROLLBACK_MODE;
  return undefined;
}
