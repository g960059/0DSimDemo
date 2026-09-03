import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  qualifyMainWireIntegratedModelFormalPreloadReserveV1,
} from "@/analysis/methods/mainWire/MainWirePressureVolumeProtocolsV3";
import type {
  MainWireIntegratedModelStandard68CheckpointV1,
} from "@/engine/myocardium/MainWireIntegratedModelStandard68CheckpointV1";
import {
  qualifyMainWireIntegratedModelStandard70BaselineV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard70BaselineQualificationV1";
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
  buildMainWireIntegratedStudioStandard70BaselineValidationV1,
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
const sourceCheckpoint = cloneAndFreezeStudioJson(
  standard69CheckpointJsonV1,
) as unknown as MainWireIntegratedModelStandard68CheckpointV1;

const startedAt = performance.now();
const qualification =
  await qualifyMainWireIntegratedModelStandard70BaselineV1(sourceCheckpoint);
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
  await qualifyMainWireIntegratedModelFormalPreloadReserveV1(
    settledSession,
    MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_BASELINE_HEMODYNAMIC_INPUTS_V1,
  );
const report = buildMainWireIntegratedStudioStandard70BaselineValidationV1(
  qualification,
  preloadReserve,
);

writeFileSync(
  path.join(
    integrationRoot,
    "algebraic-pulmonary-root-standard70-settled-baseline-checkpoint.json",
  ),
  `${JSON.stringify(qualification.checkpoint, null, 2)}\n`,
  "utf8",
);
writeFileSync(
  path.join(
    integrationRoot,
    "algebraic-pulmonary-root-standard70-baseline-validation.json",
  ),
  `${JSON.stringify(report, null, 2)}\n`,
  "utf8",
);
process.stderr.write(
  `Standard70 continuation qualification: ${qualification.completedCycleCount} `
    + `cycles, ${qualificationDurationMs.toFixed(1)} ms\n`,
);
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
