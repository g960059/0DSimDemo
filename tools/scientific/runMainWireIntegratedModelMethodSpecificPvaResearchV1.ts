import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

import { analyzeMainWireIntegratedModelMethodSpecificPvaResearchV1 } from "@/engine/myocardium/experiments/MainWireIntegratedModelMethodSpecificPvaResearchV1";
import { runMainWireIntegratedModelTransientVenousReturnResearchTrajectoryV1 } from "@/engine/myocardium/experiments/MainWireIntegratedModelTransientVenousReturnReductionEngineeringV1";

const outputPath = join(
  process.cwd(),
  "artifacts/transient-preload/method-specific-pva-research-v1.json",
);

const trajectory =
  await runMainWireIntegratedModelTransientVenousReturnResearchTrajectoryV1();
if (trajectory.status !== "completed") {
  throw new Error(
    `transient research trajectory failed: ${trajectory.failureEvidence.failureClass}: ${trajectory.failureEvidence.message}`,
  );
}

const result = analyzeMainWireIntegratedModelMethodSpecificPvaResearchV1(
  trajectory.rawBeats,
);
await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");

console.log(
  JSON.stringify(
    {
      outputPath,
      attemptedRows: result.summary.attemptedRowCount,
      availableRows: result.summary.availableRowCount,
      unavailableRows: result.summary.unavailableRowCount,
      selectedMethodSpread: result.summary.selectedMethodSpread,
    },
    null,
    2,
  ),
);
