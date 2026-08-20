import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

import type { MainWireIntegratedModelMethodSpecificPvaResearchV1 } from "@/engine/myocardium/experiments/MainWireIntegratedModelMethodSpecificPvaResearchV1";
import {
  compareMainWireIntegratedModelPvaDiastolicReferencesV1,
  generateMainWireIntrinsicPassiveCenterSlicesForPvaV1,
  type MainWireIntrinsicPassiveSurfacePilotSourceV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPvaDiastolicReferenceComparisonV1";

const pvaInputPath = join(
  process.cwd(),
  "artifacts/transient-preload/method-specific-pva-research-v1.json",
);
const passiveSurfaceInputPath = join(
  process.cwd(),
  "artifacts/passive-equilibrium/intrinsic-ventricular-passive-reduced-surface-pilot-v1.json",
);
const outputPath = join(
  process.cwd(),
  "artifacts/transient-preload/pva-diastolic-reference-comparison-v1.json",
);

const pva = JSON.parse(
  await readFile(pvaInputPath, "utf8"),
) as MainWireIntegratedModelMethodSpecificPvaResearchV1;
const passiveSurfaceEnvelope = JSON.parse(
  await readFile(passiveSurfaceInputPath, "utf8"),
) as Readonly<{ payload: MainWireIntrinsicPassiveSurfacePilotSourceV1 }>;

const intrinsicSlices = generateMainWireIntrinsicPassiveCenterSlicesForPvaV1(
  passiveSurfaceEnvelope.payload,
);
const result = compareMainWireIntegratedModelPvaDiastolicReferencesV1(
  pva,
  intrinsicSlices,
);

await writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");

console.log(
  JSON.stringify(
    {
      outputPath,
      intrinsicSlices: result.intrinsicSlices.map((slice) =>
        slice.status === "available"
          ? {
              ventricleId: slice.ventricleId,
              fixedContralateralVolumeMl: slice.fixedContralateralVolumeMl,
              modelMinimumVolumeMl: slice.modelMinimumVolumeMl,
              zeroPressureVolumeMl: slice.zeroPressureVolumeMl,
              maximumSampledVolumeMl: slice.maximumSampledVolumeMl,
              pointCount: slice.points.length,
            }
          : slice,
      ),
      summary: result.summary,
    },
    null,
    2,
  ),
);
