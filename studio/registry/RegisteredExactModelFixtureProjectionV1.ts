import type { ExactModelFixtureProjectionV1 } from
  "@/studio/application/model/ExactModelFixtureProjectionV1";
import {
  MAIN_WIRE_INTEGRATED_STUDIO_MODEL_FAMILY_ID_V3,
} from
  "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioModelIdentityV1";
import {
  mainWireIntegratedStudioFixtureProjectionV3,
} from
  "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioFixtureControlProjectionV3";

/** Client-only union point for exact fixture projections shipped in this build. */
export function resolveRegisteredExactModelFixtureProjectionV1(
  modelFamilyId: string,
): ExactModelFixtureProjectionV1 {
  if (modelFamilyId === MAIN_WIRE_INTEGRATED_STUDIO_MODEL_FAMILY_ID_V3) {
    return mainWireIntegratedStudioFixtureProjectionV3;
  }
  throw new Error(
    `No exact fixture projection is registered for model family ${modelFamilyId}`,
  );
}
