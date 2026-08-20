import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { runMainWireIntegratedModelTransientVenousReturnReductionEngineeringV1 } from "@/engine/myocardium/experiments/MainWireIntegratedModelTransientVenousReturnReductionEngineeringV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_TRANSIENT_VENOUS_RETURN_REDUCTION_OUTPUT_PATH_V1,
  assertMainWireIntegratedModelTransientVenousReturnReductionOutputAbsentV1,
  writeMainWireIntegratedModelTransientVenousReturnReductionArtifactCreateOnlyV1,
} from "@/tools/scientific/MainWireIntegratedModelTransientVenousReturnReductionArtifactV1";

const DECLARATION_COMMIT_SHA =
  "a775a6aa64565e8feceb0a53b17c70e896c5fd27" as const;

async function main(): Promise<void> {
  if (process.argv.length !== 2) {
    throw new Error(
      "transient venous-return characterization runner accepts no arguments",
    );
  }
  const repositoryRoot = execFileSync("git", ["rev-parse", "--show-toplevel"], {
    encoding: "utf8",
  }).trim();
  const outputPath = resolve(
    repositoryRoot,
    MAIN_WIRE_INTEGRATED_MODEL_TRANSIENT_VENOUS_RETURN_REDUCTION_OUTPUT_PATH_V1,
  );

  // Create-only refusal must precede the first normal-adult source evaluation.
  assertMainWireIntegratedModelTransientVenousReturnReductionOutputAbsentV1(
    outputPath,
  );
  const dirty = execFileSync("git", ["status", "--porcelain"], {
    cwd: repositoryRoot,
    encoding: "utf8",
  });
  if (dirty !== "") {
    throw new Error(
      "transient venous-return characterization requires a clean committed implementation",
    );
  }
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

  mkdirSync(dirname(outputPath), { recursive: true });
  const report =
    await runMainWireIntegratedModelTransientVenousReturnReductionEngineeringV1(
      { implementationCommitSha },
    );
  const writeResult =
    await writeMainWireIntegratedModelTransientVenousReturnReductionArtifactCreateOnlyV1(
      outputPath,
      report,
    );
  process.stdout.write(
    `${JSON.stringify({
      outputPath,
      sizeBytes: writeResult.sizeBytes,
      payloadSha256: report.payloadSha256,
      transientVenousReturnReductionCharacterizationCompleted:
        report.payload.assessment
          .transientVenousReturnReductionCharacterizationCompleted,
      firstFailureClass: report.payload.assessment.firstFailureClass,
    })}\n`,
  );
}

main().catch((error: unknown) => {
  process.stderr.write(
    `${error instanceof Error ? (error.stack ?? error.message) : String(error)}\n`,
  );
  process.exitCode = 1;
});
