import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

import type { MainWireIntegratedModelMethodSpecificPvaResearchV1 } from "@/engine/myocardium/experiments/MainWireIntegratedModelMethodSpecificPvaResearchV1";
import type { MainWireIntegratedModelPvaDiastolicReferenceComparisonV1 } from "@/engine/myocardium/experiments/MainWireIntegratedModelPvaDiastolicReferenceComparisonV1";
import { diagnoseMainWireIntegratedModelPvaGeometryDomainsV2 } from "@/engine/myocardium/experiments/MainWireIntegratedModelPvaGeometryDomainDiagnosticsV2";

const pvaInputPath = join(
  process.cwd(),
  "artifacts/transient-preload/method-specific-pva-research-v1.json",
);
const comparisonInputPath = join(
  process.cwd(),
  "artifacts/transient-preload/pva-diastolic-reference-comparison-v1.json",
);
const outputPath = join(
  process.cwd(),
  "artifacts/transient-preload/pva-geometry-domain-diagnostics-v2.json",
);

const pva = JSON.parse(
  await readFile(pvaInputPath, "utf8"),
) as MainWireIntegratedModelMethodSpecificPvaResearchV1;
const comparison = JSON.parse(
  await readFile(comparisonInputPath, "utf8"),
) as MainWireIntegratedModelPvaDiastolicReferenceComparisonV1;

const result = diagnoseMainWireIntegratedModelPvaGeometryDomainsV2(
  pva,
  comparison,
);

await writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");

console.log(
  JSON.stringify(
    {
      outputPath,
      summary: result.summary,
    },
    null,
    2,
  ),
);
