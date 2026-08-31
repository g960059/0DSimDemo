import type { ExactModelFixtureProjectionV1 } from
  "@/studio/application/model/ExactModelFixtureProjectionV1";
import {
  MAIN_WIRE_INTEGRATED_STUDIO_SELECTED_AORTIC_OUTFLOW_MODEL_ID_V1,
  MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_MODEL_ID_V1,
} from
  "@/domain/model/MainWireStandardIdentityV1";
import standardClientDescriptorV1 from
  "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioExactModelV1.client.json";
import {
  mainWireIntegratedStudioFixtureProjectionV3,
} from
  "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioFixtureControlProjectionV3";
import {
  MAIN_WIRE_INTEGRATED_STUDIO_SELECTED_AORTIC_OUTFLOW_FIXTURE_SCHEMA_ID_V1,
} from
  "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioModelIdentityV1";
import {
  mainWireIntegratedStudioSelectedAorticOutflowFixtureProjectionV1,
} from
  "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioSelectedAorticOutflowFixtureProjectionV1";

/** Client-only union point for exact fixture projections shipped in this build. */
export function resolveRegisteredExactModelFixtureProjectionV1(
  identity: Readonly<{
    modelId: string;
    fixtureSchemaId: string;
  }>,
): ExactModelFixtureProjectionV1 {
  const modelId = identity.modelId;
  const fixtureSchemaId = identity.fixtureSchemaId;
  if (
    modelId === MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_MODEL_ID_V1
    && fixtureSchemaId ===
      standardClientDescriptorV1.manifest.fixtureSchema.fixtureSchemaId
  ) {
    return mainWireIntegratedStudioFixtureProjectionV3;
  }
  if (
    modelId
      === MAIN_WIRE_INTEGRATED_STUDIO_SELECTED_AORTIC_OUTFLOW_MODEL_ID_V1
    && fixtureSchemaId
      === MAIN_WIRE_INTEGRATED_STUDIO_SELECTED_AORTIC_OUTFLOW_FIXTURE_SCHEMA_ID_V1
  ) {
    return mainWireIntegratedStudioSelectedAorticOutflowFixtureProjectionV1;
  }
  throw new Error(
    "No exact fixture projection is registered for model " +
      `${modelId} with fixture schema ${fixtureSchemaId}`,
  );
}
