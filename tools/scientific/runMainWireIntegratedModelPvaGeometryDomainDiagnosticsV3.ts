import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

import type { MainWireIntegratedModelMethodSpecificPvaResearchV1 } from "@/engine/myocardium/experiments/MainWireIntegratedModelMethodSpecificPvaResearchV1";
import type { MainWireIntegratedModelPvaDiastolicReferenceComparisonV1 } from "@/engine/myocardium/experiments/MainWireIntegratedModelPvaDiastolicReferenceComparisonV1";
import { diagnoseMainWireIntegratedModelPvaGeometryDomainsV3 } from "@/engine/myocardium/experiments/MainWireIntegratedModelPvaGeometryDomainDiagnosticsV3";

const sourcePvaPath = join(
  process.cwd(),
  "artifacts/transient-preload/method-specific-pva-research-v1.json",
);
const comparisonPath = join(
  process.cwd(),
  "artifacts/transient-preload/pva-diastolic-reference-comparison-v1.json",
);
const outputPath = join(
  process.cwd(),
  "artifacts/transient-preload/pva-geometry-domain-diagnostics-v3.json",
);

const [pva, comparison] = await Promise.all([
  readJsonV3<MainWireIntegratedModelMethodSpecificPvaResearchV1>(sourcePvaPath),
  readJsonV3<MainWireIntegratedModelPvaDiastolicReferenceComparisonV1>(
    comparisonPath,
  ),
]);
const result = diagnoseMainWireIntegratedModelPvaGeometryDomainsV3(
  pva,
  comparison,
);

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");

console.log(JSON.stringify({ outputPath, summary: result.summary }, null, 2));

async function readJsonV3<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(path, "utf8")) as T;
}
