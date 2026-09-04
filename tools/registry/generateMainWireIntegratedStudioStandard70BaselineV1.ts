import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

import {
  qualifyMainWireIntegratedModelFormalPreloadReserveV2,
} from "@/analysis/methods/mainWire/MainWirePressureVolumeProtocolsV3";
import type {
  MainWireIntegratedModelStandard68CheckpointV1,
} from "@/engine/myocardium/MainWireIntegratedModelStandard68CheckpointV1";
import {
  qualifyMainWireStandard70BaselineAssessmentV2,
} from "@/analysis/methods/mainWire/MainWireStandard70BaselineAssessmentV2";
import {
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_BASELINE_HEMODYNAMIC_INPUTS_V1,
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_BASELINE_MECHANISM_INPUTS_V1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard70BaselineV1";
import {
  MainWireIntegratedModelStandard70TypedAuthoritySessionV1,
} from "@/engine/vnext/MainWireIntegratedModelStandard70TypedAuthoritySessionV1";
import {
  cloneAndFreezeStudioJson,
} from "@/domain/json/CanonicalJson";
import {
  buildMainWireIntegratedStudioStandard70BaselineValidationV2,
} from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioStandard70BaselineValidationV1";
import standard69CheckpointJsonV1 from
  "@/studio/integrations/mainWireIntegratedV3/qualified-baseline-standard69-settled-baseline-checkpoint.json";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const integrationRoot = path.join(
  repositoryRoot,
  "studio/integrations/mainWireIntegratedV3",
);
const { values } = parseArgs({
  options: { "output-dir": { type: "string" } },
});
const requestedOutputDirectory = values["output-dir"];
if (requestedOutputDirectory !== undefined && requestedOutputDirectory.trim() === "") {
  throw new Error("--output-dir requires a new directory path");
}
const outputRoot = requestedOutputDirectory === undefined
  ? integrationRoot
  : path.resolve(requestedOutputDirectory);
if (requestedOutputDirectory !== undefined) {
  // Fail before simulation if the requested isolated output already exists.
  mkdirSync(path.dirname(outputRoot), { recursive: true });
  mkdirSync(outputRoot);
}
const outputOptions = { encoding: "utf8" as const,
  flag: requestedOutputDirectory === undefined ? "w" : "wx" };
const sourceCheckpoint = cloneAndFreezeStudioJson(
  standard69CheckpointJsonV1,
) as unknown as MainWireIntegratedModelStandard68CheckpointV1;

const startedAt = performance.now();
const { qualification, pressureRateQuality } =
  await qualifyMainWireStandard70BaselineAssessmentV2(sourceCheckpoint);
const qualificationDurationMs = performance.now() - startedAt;
const settledSession =
  await MainWireIntegratedModelStandard70TypedAuthoritySessionV1
    .restoreStandard70ExactCheckpoint(
      qualification.checkpoint,
      MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_BASELINE_HEMODYNAMIC_INPUTS_V1,
      1,
      undefined,
      MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_BASELINE_MECHANISM_INPUTS_V1,
    );
const preloadReserve =
  await qualifyMainWireIntegratedModelFormalPreloadReserveV2(
    settledSession,
    MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_BASELINE_HEMODYNAMIC_INPUTS_V1,
  );
const report = buildMainWireIntegratedStudioStandard70BaselineValidationV2(
  qualification,
  preloadReserve,
  pressureRateQuality,
);

writeFileSync(
  path.join(
    outputRoot,
    "algebraic-pulmonary-root-standard70-settled-baseline-checkpoint.json",
  ),
  `${JSON.stringify(qualification.checkpoint, null, 2)}\n`,
  outputOptions,
);
writeFileSync(
  path.join(
    outputRoot,
    "algebraic-pulmonary-root-standard70-baseline-validation.json",
  ),
  `${JSON.stringify(report, null, 2)}\n`,
  outputOptions,
);
process.stderr.write(
  `Standard70 continuation qualification: ${qualification.completedCycleCount} `
    + `cycles, ${qualificationDurationMs.toFixed(1)} ms\n`,
);
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
