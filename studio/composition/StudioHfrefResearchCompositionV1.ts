import { studioCanonicalJsonStringify } from "@/domain/json/CanonicalJson";
import { validateScenarioPresetV2 } from "@/studio/application/authoring/StudioExperimentDataV2";
import { composeModelSurfacePresentationBundleV1 } from "@/studio/application/modelSurface/ModelSurfacePresentationBundleV1";
import { resolveRegisteredAnalysisMethodsV1 } from "@/analysis/registry/RegisteredAnalysisMethodsV1";
import { mainWireIntegratedStudioFixtureProjectionV3 } from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioFixtureControlProjectionV3";
import { validateStudioModelWorkerReleaseTicketV2, STUDIO_MODEL_WORKER_RELEASE_TICKET_V2_SCHEMA_ID } from "@/studio/contracts/v2/release";
import { MAIN_WIRE_STATIC_CASE_MODEL_ID_V1 as modelId } from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioStaticCaseIdentityV1";
import type { StudioClientCompositionV2 } from "./StudioDefaultCompositionV2";
import type { ExactModelKernelManifestV3, ModelSurfaceReleaseManifestV1 } from "@/studio/contracts/v2/modelSurface";
import type { ScenarioPresetV2 } from "@/studio/contracts/v2/content";

/** Pinned local package; ordinary production composition is not rebound. */
export async function loadStudioHfrefResearchCompositionV1(): Promise<StudioClientCompositionV2> {
  if (import.meta.env.PROD) throw new Error("Research bundle is available only in the local Model Lab");
  const [{ default: saved }, { default: lock }] = await Promise.all([
    import("@/data/model-releases/standard73/bundle.json"),
    import("@/data/model-releases/standard73/package.json"),
  ]);
  const bundle = saved as unknown as { schemaId: string; recordSha256: string;
    artifactRevisionId: string; manifest: ExactModelKernelManifestV3; surface: ModelSurfaceReleaseManifestV1;
    baseline: ScenarioPresetV2; presets: ScenarioPresetV2[] };
  const { recordSha256, ...body } = bundle;
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(studioCanonicalJsonStringify(body)));
  const actual = [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, "0")).join("");
  if (actual !== recordSha256 || recordSha256 !== lock.bundleSha256
    || bundle.schemaId !== "local-hfref-model-lab-bundle-v1" || bundle.manifest.modelId !== modelId
    || modelId !== lock.modelId || bundle.surface.surfaceReleaseId !== lock.surfaceReleaseId
    || bundle.artifactRevisionId !== lock.artifactRevisionId) throw new Error("Local package identity or digest differs");
  const baseline = validateScenarioPresetV2(bundle.baseline);
  const presets = bundle.presets.map(validateScenarioPresetV2);
  if ([baseline, ...presets].some(p => p.modelId !== modelId)) throw new Error("Research preset targets a different model");
  const ticket = validateStudioModelWorkerReleaseTicketV2({ schemaId: STUDIO_MODEL_WORKER_RELEASE_TICKET_V2_SCHEMA_ID,
    modelId, artifactRevisionId: bundle.artifactRevisionId, manifest: bundle.manifest, surfaceRelease: bundle.surface,
    // Dev-only opaque source asset: neither transformed ESM nor a public build asset.
    moduleAbi: "circleheart-exact-model-esm-v1", artifactUrl:
      new URL("/data/model-releases/standard73/artifact.mjs.txt", location.origin).href });
  const modelSurface = composeModelSurfacePresentationBundleV1({ kernel: bundle.manifest, surfaceRelease: bundle.surface,
    stage: "dev", analysis: resolveRegisteredAnalysisMethodsV1(bundle.surface) });
  return Object.freeze({ exactModel: Object.freeze({ modelId, stage: "dev", defaultFixture: baseline.capture.fixture,
    defaultCheckpoint: baseline.capture.checkpoint, fixtureProjection: mainWireIntegratedStudioFixtureProjectionV3,
    workerReleaseTicket: ticket }), modelSurface, presets: Object.freeze([baseline, ...presets]) });
}
