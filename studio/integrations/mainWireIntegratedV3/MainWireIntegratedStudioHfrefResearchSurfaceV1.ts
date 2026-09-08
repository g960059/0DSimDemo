import inherited from "./MainWireIntegratedStudioStandard72SurfaceV1";
import { controlCapabilityV1, type ModelSurfaceReleaseManifestV1 } from "@/studio/contracts/v2/modelSurface";

/** Research-only exposure; all production analysis pins and graph/output items are inherited. */
export default Object.freeze({
  ...inherited,
  surfaceReleaseId: "circleheart.main-wire.surface.hfref-lv-domain.research-v1",
  surfaceSeriesId: "circleheart.main-wire.surface.hfref-lv-domain.research",
  predecessorSurfaceReleaseId: null,
  displayName: "LV systolic-dysfunction research",
  controlCatalog: Object.freeze([...inherited.controlCatalog, Object.freeze({
    controlId: "myocardium.lv-contractility", preferredPresentation: "slider" as const,
    requiredCapabilities: Object.freeze([controlCapabilityV1("myocardium.lv-contractility")]),
  })]),
}) satisfies ModelSurfaceReleaseManifestV1;
