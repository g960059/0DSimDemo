import type {
  ResolvedExactModelRuntimeV2,
} from "@/studio/contracts/v2/executable";
import type {
  ModelContractV2,
} from "@/studio/contracts/v2/model";
import {
  TrustedRegisteredModelClientCatalogV2,
} from "@/studio/infrastructure/model/TrustedRegisteredModelClientCatalogV2";
import {
  MAIN_WIRE_INTEGRATED_STUDIO_MODEL_ID_V3,
  createMainWireIntegratedStudioModelPackageV3,
  type MainWireIntegratedStudioFixtureV3,
} from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioModelV3";

export const DEFAULT_STUDIO_MODEL_ID_V2 =
  MAIN_WIRE_INTEGRATED_STUDIO_MODEL_ID_V3;

export type StudioDefaultClientCompositionV2 = Readonly<{
  defaultModelId: typeof DEFAULT_STUDIO_MODEL_ID_V2;
  defaultFixture: MainWireIntegratedStudioFixtureV3;
  contract: ModelContractV2;
}>;

export type StudioDefaultWorkerCompositionV2 = Readonly<{
  defaultModelId: typeof DEFAULT_STUDIO_MODEL_ID_V2;
  defaultFixture: MainWireIntegratedStudioFixtureV3;
  runtime: ResolvedExactModelRuntimeV2;
}>;

let browserCompositionPromiseV2:
  Promise<StudioDefaultClientCompositionV2> | undefined;

/**
 * Loads the one registry-admitted development release into the hash-free
 * client catalog. Startup intentionally creates no Preset, Workspace,
 * Snapshot, Placement, or Lesson content.
 *
 * Authoring is not composed here yet. Live numerical ownership is inside the
 * Worker, so binding authoring to this main-thread package instance would give
 * Draft capture a second runtime host that cannot see the live session. The
 * future Save UI must first add an explicit Worker capture bridge and then
 * compose authoring against that one owner.
 */
export async function createStudioDefaultClientCompositionV2():
Promise<StudioDefaultClientCompositionV2> {
  const resolved = resolveDefaultReleaseV2();
  return Object.freeze({
    defaultModelId: DEFAULT_STUDIO_MODEL_ID_V2,
    defaultFixture: resolved.defaultFixture,
    contract: resolved.registry.resolveContract(DEFAULT_STUDIO_MODEL_ID_V2),
  });
}

/** Worker-only exact runtime; its model host must never be mistaken for the
 * main-thread authoring owner. */
export async function createStudioDefaultWorkerCompositionV2():
Promise<StudioDefaultWorkerCompositionV2> {
  const resolved = resolveDefaultReleaseV2();
  return Object.freeze({
    defaultModelId: DEFAULT_STUDIO_MODEL_ID_V2,
    defaultFixture: resolved.defaultFixture,
    runtime: resolved.registry.resolveExactRuntime(DEFAULT_STUDIO_MODEL_ID_V2),
  });
}

function resolveDefaultReleaseV2() {
  const modelPackage = createMainWireIntegratedStudioModelPackageV3();
  const registry = new TrustedRegisteredModelClientCatalogV2([
    {
      manifest: modelPackage.manifest,
      executables: modelPackage.executables,
    },
  ]);
  const contract = registry.resolveContract(DEFAULT_STUDIO_MODEL_ID_V2);
  if (contract.modelId !== DEFAULT_STUDIO_MODEL_ID_V2) {
    throw new Error("Studio default model registration returned another model");
  }
  return Object.freeze({
    defaultFixture: modelPackage.defaultFixture,
    registry,
  });
}

/** One browser composition shared across StrictMode remounts. */
export function loadStudioDefaultClientCompositionV2():
Promise<StudioDefaultClientCompositionV2> {
  browserCompositionPromiseV2 ??= createStudioDefaultClientCompositionV2();
  return browserCompositionPromiseV2;
}
