import type {
  ResolvedExactModelRuntimeV2,
} from "@/studio/contracts/v2/executable";
import type {
  ModelContractV2,
} from "@/studio/contracts/v2/model";
import type {
  StudioReleaseChannelV1,
  StudioReleaseStageV1,
} from "@/studio/contracts/v2/modelSurface";
import type { StudioJsonValueV2 } from "@/studio/contracts/v2/json";
import type {
  StudioModelWorkerReleaseTicketV2,
} from "@/studio/contracts/v2/release";
import type {
  StudioSimulationAnalysisExecutionPlanResolverV2,
} from "@/studio/contracts/v2/simulation";
import {
  deriveModelContractFromManifestV2,
} from "@/studio/contracts/v2/model";
import {
  TrustedRegisteredModelClientCatalogV2,
} from "@/studio/infrastructure/model/TrustedRegisteredModelClientCatalogV2";
import {
  studioSupabaseModelReleaseResolverV1,
} from "@/studio/infrastructure/model/StudioSupabaseModelReleaseResolverV1";
import {
  createMainWireIntegratedStudioExecutableReleaseV3 as
    createAdmittedMainWireIntegratedStudioExecutableReleaseV3,
  createMainWireIntegratedStudioModelPackageV3 as
    createAdmittedMainWireIntegratedStudioModelPackageV3,
  MAIN_WIRE_INTEGRATED_STUDIO_MODEL_ID_V3 as
    ADMITTED_MAIN_WIRE_INTEGRATED_STUDIO_MODEL_ID_V3,
} from
  "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioModelV3.artifact.mjs";
import type {
  MAIN_WIRE_INTEGRATED_STUDIO_MODEL_ID_V3,
  MainWireIntegratedStudioExecutableReleaseV3,
  MainWireIntegratedStudioFixtureV3,
  MainWireIntegratedStudioModelPackageV3,
} from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioModelV3";
import {
  resolveMainWireIntegratedStudioAnalysisExecutionPlanV3,
} from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioAnalysisExecutionV3";

export const DEFAULT_STUDIO_MODEL_ID_V2:
typeof MAIN_WIRE_INTEGRATED_STUDIO_MODEL_ID_V3 =
  ADMITTED_MAIN_WIRE_INTEGRATED_STUDIO_MODEL_ID_V3;

export type StudioClientCompositionV2 = Readonly<{
  defaultModelId: string;
  releaseStage: StudioReleaseStageV1;
  defaultFixture: StudioJsonValueV2;
  contract: ModelContractV2;
  analysisExecutionPlan: StudioSimulationAnalysisExecutionPlanResolverV2;
  workerReleaseTicket?: StudioModelWorkerReleaseTicketV2;
}>;

export type StudioDefaultClientCompositionV2 = StudioClientCompositionV2;

export const DEFAULT_STUDIO_ANALYSIS_EXECUTION_PLAN_V2 =
  resolveMainWireIntegratedStudioAnalysisExecutionPlanV3;

export type StudioDefaultWorkerCompositionV2 = Readonly<{
  defaultModelId: typeof DEFAULT_STUDIO_MODEL_ID_V2;
  defaultFixture: MainWireIntegratedStudioFixtureV3;
  runtime: ResolvedExactModelRuntimeV2;
}>;

let browserCompositionPromiseV2:
  Promise<StudioDefaultClientCompositionV2> | undefined;
const browserExactCompositionPromisesV2 = new Map<
  string,
  Promise<StudioClientCompositionV2>
>();
const browserChannelCompositionPromisesV2 = new Map<
  StudioReleaseChannelV1,
  Promise<StudioClientCompositionV2>
>();

/**
 * Loads the one registry-admitted development release into the hash-free
 * client catalog. Startup intentionally creates no Preset, Experiment,
 * Snapshot, Placement, or Lesson content.
 *
 * Authoring remains outside this main-thread composition. The persistent
 * Worker loads the exact runtime below and owns both live simulation and the
 * accepted-boundary Experiment/Snapshot bridge against that single runtime host.
 */
export async function createStudioDefaultClientCompositionV2():
Promise<StudioDefaultClientCompositionV2> {
  // The main thread needs only the registry's public package projection. It
  // must not instantiate the numerical executable bundle owned by the Worker.
  const admittedPackage =
    createAdmittedMainWireIntegratedStudioModelPackageV3() as
      MainWireIntegratedStudioModelPackageV3;
  const contract = deriveModelContractFromManifestV2(
    admittedPackage.manifest,
  );
  if (contract.modelId !== DEFAULT_STUDIO_MODEL_ID_V2) {
    throw new Error("Studio default model registration returned another model");
  }
  return Object.freeze({
    defaultModelId: DEFAULT_STUDIO_MODEL_ID_V2,
    releaseStage: "stable",
    defaultFixture: admittedPackage.defaultFixture,
    contract,
    analysisExecutionPlan: DEFAULT_STUDIO_ANALYSIS_EXECUTION_PLAN_V2,
  });
}

async function createRegistryClientCompositionV2(
  modelId?: string,
  channel: StudioReleaseChannelV1 = "default",
): Promise<StudioClientCompositionV2> {
  const resolver = studioSupabaseModelReleaseResolverV1();
  if (resolver === null) {
    if (channel === "research") {
      throw new Error(
        "Research model registry is unavailable; Model Lab will not fall back "
          + "to the bundled default model",
      );
    }
    return createStudioDefaultClientCompositionV2();
  }
  const release = modelId === undefined
    ? await resolver.resolveChannel(channel)
    : await resolver.resolveExactModel(modelId);
  return Object.freeze({
    defaultModelId: release.contract.modelId,
    releaseStage: release.stage,
    defaultFixture: release.defaultFixture,
    contract: release.contract,
    analysisExecutionPlan: analysisExecutionPlanForProfileV2(
      release.analysisProfileId,
    ),
    workerReleaseTicket: release.ticket,
  });
}

/**
 * Resolves one of the two mutable launch pointers and immediately pins the
 * returned exact modelId. Existing content continues to use the exact loader.
 */
export function loadStudioModelChannelClientCompositionV2(
  channel: StudioReleaseChannelV1,
): Promise<StudioClientCompositionV2> {
  if (channel === "default") return loadStudioDefaultClientCompositionV2();
  const cached = browserChannelCompositionPromisesV2.get(channel);
  if (cached !== undefined) return cached;
  const pending = createRegistryClientCompositionV2(undefined, channel);
  browserChannelCompositionPromisesV2.set(channel, pending);
  void pending.catch(() => {
    if (browserChannelCompositionPromisesV2.get(channel) === pending) {
      browserChannelCompositionPromisesV2.delete(channel);
    }
  });
  return pending;
}

/** Worker-only exact runtime; its model host must never be mistaken for the
 * main-thread authoring owner. */
export async function createStudioDefaultWorkerCompositionV2():
Promise<StudioDefaultWorkerCompositionV2> {
  const resolved = await resolveDefaultWorkerReleaseV2();
  return Object.freeze({
    defaultModelId: DEFAULT_STUDIO_MODEL_ID_V2,
    defaultFixture: resolved.defaultFixture,
    runtime: resolved.registry.resolveExactRuntime(DEFAULT_STUDIO_MODEL_ID_V2),
  });
}

async function resolveDefaultWorkerReleaseV2() {
  // The Worker trusts the registry-admitted distribution and imports its
  // committed artifact as ordinary ESM. Exact-byte evaluation belongs to
  // registry admission/CI, not to every client startup. The generated JS
  // loses TypeScript's non-empty fixture-path tuple annotation, so this cast
  // restores the source release type before the registry revalidates it.
  const admittedRelease =
    createAdmittedMainWireIntegratedStudioExecutableReleaseV3() as unknown as
      MainWireIntegratedStudioExecutableReleaseV3;
  const registry = new TrustedRegisteredModelClientCatalogV2([
    {
      manifest: admittedRelease.manifest,
      executables: admittedRelease.executables,
    },
  ]);
  const contract = registry.resolveContract(DEFAULT_STUDIO_MODEL_ID_V2);
  if (contract.modelId !== DEFAULT_STUDIO_MODEL_ID_V2) {
    throw new Error("Studio default model registration returned another model");
  }
  const fixtureValidation = registry.resolveExactRuntime(DEFAULT_STUDIO_MODEL_ID_V2)
    .fixtureAdapter.validateCompleteFixture({
      context: {
        scenarioId: "scenario/default-composition",
        modelId: DEFAULT_STUDIO_MODEL_ID_V2,
      },
      fixture: admittedRelease.defaultFixture,
    });
  if (fixtureValidation !== undefined) {
    throw new Error("Studio default fixture validator must be synchronous");
  }
  return Object.freeze({
    defaultFixture: admittedRelease.defaultFixture,
    registry,
  });
}

/** One browser composition shared across StrictMode remounts. */
export function loadStudioDefaultClientCompositionV2():
Promise<StudioDefaultClientCompositionV2> {
  if (browserCompositionPromiseV2 !== undefined) {
    return browserCompositionPromiseV2;
  }
  const pending = createRegistryClientCompositionV2();
  browserCompositionPromiseV2 = pending;
  void pending.catch(() => {
    // A transient fetch/evaluation failure must not poison the browser
    // composition for the rest of the page lifetime. Only clear the Promise
    // that actually failed so a later successful load cannot be displaced.
    if (browserCompositionPromiseV2 === pending) {
      browserCompositionPromiseV2 = undefined;
    }
  });
  return pending;
}

/** Existing content pins its exact modelId and never follows a channel. */
export function loadStudioModelClientCompositionV2(
  modelId: string,
): Promise<StudioClientCompositionV2> {
  if (modelId === DEFAULT_STUDIO_MODEL_ID_V2) {
    const resolver = studioSupabaseModelReleaseResolverV1();
    if (resolver === null) return loadStudioDefaultClientCompositionV2();
  }
  const cached = browserExactCompositionPromisesV2.get(modelId);
  if (cached !== undefined) return cached;
  const pending = createRegistryClientCompositionV2(modelId).then(
    (composition) => {
      if (composition.contract.modelId !== modelId) {
        throw new Error("Exact model registry returned another modelId");
      }
      return composition;
    },
  );
  browserExactCompositionPromisesV2.set(modelId, pending);
  void pending.catch(() => {
    if (browserExactCompositionPromisesV2.get(modelId) === pending) {
      browserExactCompositionPromisesV2.delete(modelId);
    }
  });
  return pending;
}

function analysisExecutionPlanForProfileV2(
  profileId: string,
): StudioSimulationAnalysisExecutionPlanResolverV2 {
  if (profileId === "main-wire-integrated-v3") {
    return resolveMainWireIntegratedStudioAnalysisExecutionPlanV3;
  }
  throw new Error(`Unsupported Studio analysis profile ${profileId}`);
}
