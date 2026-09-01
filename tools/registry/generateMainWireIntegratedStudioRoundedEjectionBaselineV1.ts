import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  qualifyMainWireIntegratedModelRoundedEjectionBaselineV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelRoundedEjectionBaselineQualificationV1";
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
const report =
  buildMainWireIntegratedStudioRoundedEjectionBaselineValidationV1(
    qualification,
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
