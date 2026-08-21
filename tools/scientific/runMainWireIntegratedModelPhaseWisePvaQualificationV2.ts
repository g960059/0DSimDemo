import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

import { runMainWireIntegratedModelPhaseWisePvaQualificationV2 } from "@/engine/myocardium/experiments/MainWireIntegratedModelPhaseWisePvaQualificationV2";

if (process.argv.length !== 2)
  throw new Error("phase-wise PVA qualification runner accepts no arguments");

const outputPath = join(
  process.cwd(),
  "artifacts/transient-preload/phase-wise-pva-qualification-v2.json",
);
const result = await runMainWireIntegratedModelPhaseWisePvaQualificationV2();
await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");

process.stdout.write(
  `${JSON.stringify({
    outputPath,
    status: result.status,
    outputs: result.outputs.map((output) => ({
      ventricleId: output.ventricleId,
      status: output.status,
      pvaEstimateJ: output.energy.pvaEstimateJ,
      limitations: output.limitations,
    })),
    failure: result.failure,
  })}\n`,
);
