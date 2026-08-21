import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

import { projectMainWireIntegratedModelMethodSpecificPvaMainCandidateV1 } from "@/engine/myocardium/experiments/MainWireIntegratedModelMethodSpecificPvaMainCandidateV1";
import type { MainWireIntegratedModelPhaseWiseEmaxBaselinePvaResearchV1 } from "@/engine/myocardium/experiments/MainWireIntegratedModelPhaseWiseEmaxBaselinePvaResearchV1";

const sourcePath = join(
  process.cwd(),
  "artifacts/transient-preload/phase-wise-emax-baseline-pva-research-v1.json",
);
const outputPath = join(
  process.cwd(),
  "artifacts/transient-preload/method-specific-pva-main-candidate-v1.json",
);

const source = JSON.parse(
  await readFile(sourcePath, "utf8"),
) as MainWireIntegratedModelPhaseWiseEmaxBaselinePvaResearchV1;
const result =
  projectMainWireIntegratedModelMethodSpecificPvaMainCandidateV1(source);

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");

console.log(
  JSON.stringify(
    {
      outputPath,
      status: result.status,
      mainIntegrationReady: result.promotion.mainIntegrationReady,
      blockers: result.promotion.blockers,
      outputs: result.outputs,
    },
    null,
    2,
  ),
);
