import { assertModelSurfaceReleaseLineageV1, type ModelSurfaceReleaseManifestV1 } from "@/studio/contracts/v2/modelSurface";
import inherited from "./MainWireIntegratedStudioAlgebraicPulmonaryRootSurfaceV1";

// Every exact output, control, graph, and pinned analysis method is unchanged.
// The same Surface series remains compatible; only release identity/name change.
const surface = Object.freeze({ ...inherited,
  surfaceReleaseId: "circleheart.main-wire.surface.algebraic-pulmonary-root.standard-70.workbench-v2",
  predecessorSurfaceReleaseId: inherited.surfaceReleaseId,
  displayName: "Main Wire Standard 71",
}) satisfies ModelSurfaceReleaseManifestV1;
assertModelSurfaceReleaseLineageV1(surface, inherited);
export default surface;
