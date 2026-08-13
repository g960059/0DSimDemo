import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";

import {
  MAIN_WIRE_SOLVER_REPLACEMENT_CORPUS_CASES_V1,
  MAIN_WIRE_SOLVER_REPLACEMENT_CORPUS_V1_ID,
} from "@/engine/vnext/MainWireSolverReplacementCorpusV1";
import {
  captureMainWireIntegratedModelSequenceV3,
  mainWireIntegratedModelSequenceSha256V3,
} from "@/tools/performance/verifyMainWireIntegratedModelValidationOnceV3";

export function captureMainWireSolverReplacementCorpusV1() {
  return Object.freeze({
    corpusId: MAIN_WIRE_SOLVER_REPLACEMENT_CORPUS_V1_ID,
    cases: Object.freeze(
      MAIN_WIRE_SOLVER_REPLACEMENT_CORPUS_CASES_V1.map((corpusCase) => {
        const sequence = captureMainWireIntegratedModelSequenceV3(
          corpusCase.acceptedStepCount,
          Object.freeze({
            hemodynamicResearchInputs:
              corpusCase.hemodynamicResearchInputs,
            ventricularContractilityScale:
              corpusCase.ventricularContractilityScale,
          }),
        );
        const actualSha256 = mainWireIntegratedModelSequenceSha256V3(
          sequence.canonicalAcceptedStates,
        );
        return Object.freeze({
          caseId: corpusCase.caseId,
          acceptedStepCount: corpusCase.acceptedStepCount,
          expectedSha256: corpusCase.legacyAcceptedSequenceSha256,
          actualSha256,
          matches: actualSha256
            === corpusCase.legacyAcceptedSequenceSha256,
        });
      }),
    ),
  });
}

if (
  process.argv[1] !== undefined
  && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  process.stdout.write(
    `${JSON.stringify(captureMainWireSolverReplacementCorpusV1(), null, 2)}\n`,
  );
}
