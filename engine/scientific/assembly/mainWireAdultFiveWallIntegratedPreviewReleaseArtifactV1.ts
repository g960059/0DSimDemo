import artifact from
  "@/engine/scientific/assembly/releases/main-wire-adult-five-wall-integrated-preview-0.1.0.json";
import {
  MAIN_WIRE_ADULT_FIVE_WALL_INTEGRATED_PREVIEW_RELEASE_V1_ID,
  MAIN_WIRE_ADULT_FIVE_WALL_INTEGRATED_PREVIEW_RELEASE_V1_SHA256,
  MAIN_WIRE_ADULT_FIVE_WALL_INTEGRATED_PREVIEW_RELEASE_V1_VERSION,
} from "@/engine/scientific/assembly/mainWireAdultFiveWallIntegratedPreviewReleaseV1";
import {
  loadSimulationReleaseV1,
  SimulationReleaseValidationError,
  type SimulationReleaseV1,
} from "@/engine/scientific/release";

export async function loadMainWireAdultFiveWallIntegratedPreviewReleaseV1():
Promise<SimulationReleaseV1> {
  const release = await loadSimulationReleaseV1(artifact);
  if (
    release.ref.id
      !== MAIN_WIRE_ADULT_FIVE_WALL_INTEGRATED_PREVIEW_RELEASE_V1_ID
    || release.ref.version
      !== MAIN_WIRE_ADULT_FIVE_WALL_INTEGRATED_PREVIEW_RELEASE_V1_VERSION
    || release.ref.sha256
      !== MAIN_WIRE_ADULT_FIVE_WALL_INTEGRATED_PREVIEW_RELEASE_V1_SHA256
  ) {
    throw new SimulationReleaseValidationError([
      "checked-in integrated preview release does not match its pinned identity",
    ]);
  }
  return release;
}
