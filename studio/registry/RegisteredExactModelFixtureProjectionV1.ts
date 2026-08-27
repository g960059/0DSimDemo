import type { ExactModelFixtureProjectionV1 } from
  "@/studio/application/model/ExactModelFixtureProjectionV1";
import {
  MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_MODEL_ID_V1,
} from
  "@/domain/model/MainWireStandardIdentityV1";
import standardClientDescriptorV1 from
  "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioExactModelV1.client.json";
import {
  mainWireIntegratedStudioFixtureProjectionV3,
} from
  "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioFixtureControlProjectionV3";

/** Client-only union point for exact fixture projections shipped in this build. */
export function resolveRegisteredExactModelFixtureProjectionV1(
  identity: Readonly<{
    modelId: string;
    fixtureSchemaId: string;
  }>,
): ExactModelFixtureProjectionV1 {
  if (
    identity.modelId === MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_MODEL_ID_V1
    && identity.fixtureSchemaId ===
      standardClientDescriptorV1.manifest.fixtureSchema.fixtureSchemaId
  ) {
    return mainWireIntegratedStudioFixtureProjectionV3;
  }
  throw new Error(
    "No exact fixture projection is registered for model " +
      `${identity.modelId} with fixture schema ${identity.fixtureSchemaId}`,
  );
}
