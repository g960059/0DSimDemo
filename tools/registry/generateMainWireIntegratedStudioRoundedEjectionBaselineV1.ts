import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  qualifyMainWireIntegratedModelRoundedEjectionBaselineV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelRoundedEjectionBaselineQualificationV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_BASELINE_HEMODYNAMIC_INPUTS_V1,
  MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_BASELINE_MECHANISM_INPUTS_V1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelRoundedEjectionBaselineV1";
import {
  MainWireIntegratedModelStandard68TypedAuthoritySessionV1,
} from "@/engine/vnext/MainWireIntegratedModelStandard68TypedAuthoritySessionV1";
import {
  qualifyMainWireIntegratedModelFormalPreloadReserveV1,
} from "@/analysis/methods/mainWire/MainWirePressureVolumeProtocolsV3";
import {
  buildMainWireIntegratedStudioRoundedEjectionBaselineValidationV1,
} from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioRoundedEjectionBaselineValidationV1";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const integrationRoot = path.join(
  repositoryRoot,
  "studio/integrations/mainWireIntegratedV3",
);

const qualification =
  await qualifyMainWireIntegratedModelRoundedEjectionBaselineV1();
const settledSession = await MainWireIntegratedModelStandard68TypedAuthoritySessionV1
  .restoreStandard68ExactCheckpoint(
    qualification.checkpoint,
    MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_BASELINE_HEMODYNAMIC_INPUTS_V1,
    1,
    undefined,
    MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_BASELINE_MECHANISM_INPUTS_V1,
  );
const preloadReserve =
  await qualifyMainWireIntegratedModelFormalPreloadReserveV1(
    settledSession,
    MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_BASELINE_HEMODYNAMIC_INPUTS_V1,
  );
const report =
  buildMainWireIntegratedStudioRoundedEjectionBaselineValidationV1(
    qualification,
    preloadReserve,
  );
writeFileSync(
  path.join(
    integrationRoot,
    "rounded-ejection-standard68-settled-baseline-checkpoint.json",
  ),
  `${JSON.stringify(qualification.checkpoint, null, 2)}\n`,
  "utf8",
);
writeFileSync(
  path.join(
    integrationRoot,
    "rounded-ejection-standard68-baseline-validation.json",
  ),
  `${JSON.stringify(report, null, 2)}\n`,
  "utf8",
);
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
