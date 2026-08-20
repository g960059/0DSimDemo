import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { runMainWireIntegratedModelPeriodicFiveWallMechanicalPortLedgerDtCharacterizationV1 } from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicFiveWallMechanicalPortLedgerDtCharacterizationV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_PORT_LEDGER_DT_OUTPUT_PATH_V1,
  assertMainWireIntegratedModelPeriodicFiveWallMechanicalPortLedgerDtOutputAbsentV1,
  writeMainWireIntegratedModelPeriodicFiveWallMechanicalPortLedgerDtArtifactCreateOnlyV1,
} from "@/tools/scientific/MainWireIntegratedModelPeriodicFiveWallMechanicalPortLedgerDtArtifactV1";

const DECLARATION_COMMIT_SHA =
  "cee4a52152771b0a21c12dd2060b9ee324f60ce8" as const;

async function main(): Promise<void> {
  if (process.argv.length !== 2)
    throw new Error(
      "mechanical-port ledger dt characterization runner accepts no arguments",
    );
  const repositoryRoot = execFileSync("git", ["rev-parse", "--show-toplevel"], {
    encoding: "utf8",
  }).trim();
  const outputPath = resolve(
    repositoryRoot,
    MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_PORT_LEDGER_DT_OUTPUT_PATH_V1,
  );

  // This check must remain before the first source-model evaluation.
  assertMainWireIntegratedModelPeriodicFiveWallMechanicalPortLedgerDtOutputAbsentV1(
    outputPath,
  );
  const dirty = execFileSync("git", ["status", "--porcelain"], {
    cwd: repositoryRoot,
    encoding: "utf8",
  });
  if (dirty !== "")
    throw new Error(
      "mechanical-port ledger dt characterization requires a clean committed implementation",
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

  mkdirSync(dirname(outputPath), { recursive: true });
  const report =
    await runMainWireIntegratedModelPeriodicFiveWallMechanicalPortLedgerDtCharacterizationV1(
      { implementationCommitSha },
    );
  const writeResult =
    await writeMainWireIntegratedModelPeriodicFiveWallMechanicalPortLedgerDtArtifactCreateOnlyV1(
      outputPath,
      report,
    );
  process.stdout.write(
    `${JSON.stringify({
      outputPath,
      sizeBytes: writeResult.sizeBytes,
      payloadSha256: report.payloadSha256,
      threeGridMechanicalPortLedgerCharacterizationCompleted:
        report.payload.assessment
          .threeGridMechanicalPortLedgerCharacterizationCompleted,
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
