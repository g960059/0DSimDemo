import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  qualifyMainWireIntegratedModelFormalPreloadReserveV1,
} from "@/analysis/methods/mainWire/MainWirePressureVolumeProtocolsV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD69_BASELINE_HEMODYNAMIC_INPUTS_V1,
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD69_BASELINE_MECHANISM_INPUTS_V1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard69BaselineV1";
import {
  qualifyMainWireIntegratedModelStandard69BaselineV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard69BaselineQualificationV1";
import {
  MainWireIntegratedModelStandard68TypedAuthoritySessionV1,
} from "@/engine/vnext/MainWireIntegratedModelStandard68TypedAuthoritySessionV1";
import {
  buildMainWireIntegratedStudioStandard69BaselineValidationV1,
} from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioStandard69BaselineValidationV1";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const integrationRoot = path.join(
  repositoryRoot,
  "studio/integrations/mainWireIntegratedV3",
);

const qualification =
  await qualifyMainWireIntegratedModelStandard69BaselineV1();
const settledSession = await MainWireIntegratedModelStandard68TypedAuthoritySessionV1
  .restoreStandard68ExactCheckpoint(
    qualification.checkpoint,
    MAIN_WIRE_INTEGRATED_MODEL_STANDARD69_BASELINE_HEMODYNAMIC_INPUTS_V1,
    1,
    undefined,
    MAIN_WIRE_INTEGRATED_MODEL_STANDARD69_BASELINE_MECHANISM_INPUTS_V1,
  );
const preloadReserve =
  await qualifyMainWireIntegratedModelFormalPreloadReserveV1(
    settledSession,
    MAIN_WIRE_INTEGRATED_MODEL_STANDARD69_BASELINE_HEMODYNAMIC_INPUTS_V1,
  );
const report = buildMainWireIntegratedStudioStandard69BaselineValidationV1(
  qualification,
  preloadReserve,
);

writeFileSync(
  path.join(
    integrationRoot,
    "qualified-baseline-standard69-settled-baseline-checkpoint.json",
  ),
  `${JSON.stringify(qualification.checkpoint, null, 2)}\n`,
  "utf8",
);
writeFileSync(
  path.join(
    integrationRoot,
    "qualified-baseline-standard69-baseline-validation.json",
  ),
  `${JSON.stringify(report, null, 2)}\n`,
  "utf8",
);
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
