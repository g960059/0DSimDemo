import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

import type { MainWireIntegratedModelMethodSpecificPvaResearchV1 } from "@/engine/myocardium/experiments/MainWireIntegratedModelMethodSpecificPvaResearchV1";
import {
  compareMainWireIntegratedModelPvaCommonPericardiumReferenceV1,
  type MainWireIntegratedModelPvaCommonPericardiumReferenceV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPvaCommonPericardiumReferenceV1";
import type { MainWireIntegratedModelPvaDiastolicReferenceComparisonV1 } from "@/engine/myocardium/experiments/MainWireIntegratedModelPvaDiastolicReferenceComparisonV1";

const directory = join(process.cwd(), "artifacts/transient-preload");
const methodSpecificInputPath = join(
  directory,
  "method-specific-pva-research-v1.json",
);
const intrinsicInputPath = join(
  directory,
  "pva-diastolic-reference-comparison-v1.json",
);
const outputPath = join(directory, "pva-common-pericardium-reference-v1.json");

const methodSpecific = JSON.parse(
  await readFile(methodSpecificInputPath, "utf8"),
) as MainWireIntegratedModelMethodSpecificPvaResearchV1;
const intrinsic = JSON.parse(
  await readFile(intrinsicInputPath, "utf8"),
) as MainWireIntegratedModelPvaDiastolicReferenceComparisonV1;

const result: MainWireIntegratedModelPvaCommonPericardiumReferenceV1 =
  compareMainWireIntegratedModelPvaCommonPericardiumReferenceV1(
    methodSpecific,
    intrinsic,
  );

await writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");

console.log(
  JSON.stringify(
    {
      outputPath,
      fixedCondition: result.fixedCondition,
      slices: result.constrainedSlices.map((slice) =>
        slice.status === "available"
          ? {
              ventricleId: slice.ventricleId,
              zeroPressureVolumeMl: slice.zeroPressureVolumeMl,
              minimumSlackMarginMl: slice.minimumSlackMarginMl,
              maximumCommonPericardialExcessPressureMmHg:
                slice.maximumCommonPericardialExcessPressureMmHg,
              pointCount: slice.points.length,
            }
          : slice,
      ),
      positiveControl: result.positiveControl,
      summary: result.summary,
    },
    null,
    2,
  ),
);
