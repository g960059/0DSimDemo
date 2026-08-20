import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { canonicalJsonStringify } from "@/engine/integrity";
import { runMainWireNormalAdultPassiveEquilibriumPointSolverComparisonEngineeringV1 } from "@/engine/myocardium/experiments/MainWireNormalAdultPassiveEquilibriumPointSolverComparisonEngineeringV1";

const DEFAULT_OUTPUT =
  "artifacts/passive-equilibrium/point-solver-comparison-engineering-v1.json";

async function main(): Promise<void> {
  const repositoryRoot = execFileSync("git", ["rev-parse", "--show-toplevel"], {
    encoding: "utf8",
  }).trim();
  const dirty = execFileSync("git", ["status", "--porcelain"], {
    cwd: repositoryRoot,
    encoding: "utf8",
  });
  if (dirty !== "")
    throw new Error(
      "point-solver comparison requires a clean committed implementation",
    );
  const implementationCommitSha = execFileSync("git", ["rev-parse", "HEAD"], {
    cwd: repositoryRoot,
    encoding: "utf8",
  }).trim();
  const declarationIsAncestor = execFileSync(
    "git",
    [
      "merge-base",
      "--is-ancestor",
      "b5f929e20820e5cf3e7a54dc23f96e4666ed67f4",
      implementationCommitSha,
    ],
    { cwd: repositoryRoot, encoding: "utf8" },
  );
  if (declarationIsAncestor !== "")
    throw new Error("unexpected declaration ancestry command output");
  const outputArgumentIndex = process.argv.indexOf("--output");
  const requestedOutput =
    outputArgumentIndex >= 0
      ? process.argv[outputArgumentIndex + 1]
      : DEFAULT_OUTPUT;
  if (!requestedOutput)
    throw new Error("--output requires a non-empty path argument");
  const outputPath = resolve(repositoryRoot, requestedOutput);
  const report =
    await runMainWireNormalAdultPassiveEquilibriumPointSolverComparisonEngineeringV1(
      { implementationCommitSha },
    );
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${canonicalJsonStringify(report)}\n`, {
    encoding: "utf8",
    flag: "wx",
  });
  process.stdout.write(
    `${JSON.stringify({
      outputPath,
      payloadSha256: report.payloadSha256,
      engineeringLeadingPolicyId: report.payload.engineeringLeadingPolicyId,
      selectedPointSolverPolicyEstablished:
        report.payload.claims.selectedPointSolverPolicyEstablished,
    })}\n`,
  );
}

main().catch((error: unknown) => {
  process.stderr.write(
    `${error instanceof Error ? (error.stack ?? error.message) : String(error)}\n`,
  );
  process.exitCode = 1;
});
