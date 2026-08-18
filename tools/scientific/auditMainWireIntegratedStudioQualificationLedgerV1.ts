import { MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_IDS_V3 } from "@/engine/myocardium/MainWireIntegratedModelOutputRegistryV3";
import { createCircleHeartExactModelReleaseV1 } from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioExactModelV1";
import {
  MAIN_WIRE_INTEGRATED_STUDIO_QUALIFICATION_FAMILIES_V1,
  auditMainWireIntegratedStudioQualificationLedgerV1,
} from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioQualificationLedgerV1";

const release = createCircleHeartExactModelReleaseV1();
const audit = auditMainWireIntegratedStudioQualificationLedgerV1(
  release.manifest.primitiveControlCatalog.map(({ controlId }) => controlId),
  MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_IDS_V3,
);
const result = Object.freeze({
  ...audit,
  familyCount:
    MAIN_WIRE_INTEGRATED_STUDIO_QUALIFICATION_FAMILIES_V1.length,
  familyEvidence: Object.freeze(
    MAIN_WIRE_INTEGRATED_STUDIO_QUALIFICATION_FAMILIES_V1.map((family) =>
      Object.freeze({
        familyId: family.familyId,
        controlCount: family.controlIds.length,
        componentDirection: family.evidence.componentDirection,
        closedLoopDirection: family.evidence.closedLoopDirection,
        clinicalValidation: family.evidence.clinicalValidation,
      }),
    ),
  ),
});

process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
if (audit.status !== "pass") process.exitCode = 1;
