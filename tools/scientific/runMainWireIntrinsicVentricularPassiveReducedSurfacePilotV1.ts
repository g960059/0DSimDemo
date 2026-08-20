import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { runMainWireIntrinsicVentricularPassiveReducedSurfacePilotEngineeringV1 } from "@/engine/myocardium/experiments/MainWireIntrinsicVentricularPassiveReducedSurfacePilotEngineeringV1";
import {
  MAIN_WIRE_INTRINSIC_VENTRICULAR_PASSIVE_REDUCED_SURFACE_PILOT_OUTPUT_PATH_V1,
  assertMainWireIntrinsicVentricularPassiveReducedSurfacePilotOutputAbsentV1,
  writeMainWireIntrinsicVentricularPassiveReducedSurfacePilotArtifactCreateOnlyV1,
} from "@/tools/scientific/MainWireIntrinsicVentricularPassiveReducedSurfacePilotArtifactV1";

const DECLARATION_COMMIT_SHA =
  "e93801ed221c9b3c74b9d837c8d89920c90cbe35" as const;

async function main(): Promise<void> {
  if (process.argv.length !== 2)
    throw new Error(
      "intrinsic ventricular passive surface pilot runner accepts no arguments",
    );
  const repositoryRoot = execFileSync("git", ["rev-parse", "--show-toplevel"], {
    encoding: "utf8",
  }).trim();
  const outputPath = resolve(
    repositoryRoot,
    MAIN_WIRE_INTRINSIC_VENTRICULAR_PASSIVE_REDUCED_SURFACE_PILOT_OUTPUT_PATH_V1,
  );

  // This preflight must remain before the first normal-adult evaluator call.
  assertMainWireIntrinsicVentricularPassiveReducedSurfacePilotOutputAbsentV1(
    outputPath,
  );
  const dirty = execFileSync("git", ["status", "--porcelain"], {
    cwd: repositoryRoot,
    encoding: "utf8",
  });
  if (dirty !== "")
    throw new Error(
      "intrinsic ventricular passive surface pilot requires a clean committed implementation",
    );
  const implementationCommitSha = execFileSync("git", ["rev-parse", "HEAD"], {
    cwd: repositoryRoot,
    encoding: "utf8",
  }).trim();
  execFileSync(
    "git",
    [
      "merge-base",
      "--is-ancestor",
      DECLARATION_COMMIT_SHA,
      implementationCommitSha,
    ],
    { cwd: repositoryRoot, encoding: "utf8" },
  );

  const report =
    await runMainWireIntrinsicVentricularPassiveReducedSurfacePilotEngineeringV1(
      { implementationCommitSha },
    );
  const writeResult =
    await writeMainWireIntrinsicVentricularPassiveReducedSurfacePilotArtifactCreateOnlyV1(
      outputPath,
      report,
    );
  process.stdout.write(
    `${JSON.stringify({
      outputPath,
      sizeBytes: writeResult.sizeBytes,
      payloadSha256: report.payloadSha256,
      sampledLocalIntrinsicVentricularReducedPotentialConsistencyPassed:
        report.payload
          .sampledLocalIntrinsicVentricularReducedPotentialConsistencyPassed,
      firstFailureClass: report.payload.firstFailureClass,
    })}\n`,
  );
}

main().catch((error: unknown) => {
  process.stderr.write(
    `${error instanceof Error ? (error.stack ?? error.message) : String(error)}\n`,
  );
  process.exitCode = 1;
});
