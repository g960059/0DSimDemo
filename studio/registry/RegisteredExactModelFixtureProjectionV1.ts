import type { ExactModelFixtureProjectionV1 } from
  "@/studio/application/model/ExactModelFixtureProjectionV1";
import { MAIN_WIRE_STATIC_CASE_MODEL_ID_V1, MAIN_WIRE_STATIC_CASE_FIXTURE_SCHEMA_ID_V1 } from "@/domain/model/MainWireStaticCaseIdentityV1";
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
  const modelId = identity.modelId;
  const fixtureSchemaId = identity.fixtureSchemaId;
  if (modelId === MAIN_WIRE_STATIC_CASE_MODEL_ID_V1 && fixtureSchemaId === MAIN_WIRE_STATIC_CASE_FIXTURE_SCHEMA_ID_V1) {
    return mainWireIntegratedStudioFixtureProjectionV3;
  }
  throw new Error(
    "No exact fixture projection is registered for model " +
      `${modelId} with fixture schema ${fixtureSchemaId}`,
  );
}
