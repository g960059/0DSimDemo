import mainWireAdultFiveWallNonCoronaryReleaseArtifactV1
  from "@/engine/scientific/assembly/releases/main-wire-adult-five-wall-noncoronary-0.2.0.json";
import {
  MAIN_WIRE_ADULT_FIVE_WALL_NONCORONARY_RELEASE_V1_ID,
  MAIN_WIRE_ADULT_FIVE_WALL_NONCORONARY_RELEASE_V1_SHA256,
  MAIN_WIRE_ADULT_FIVE_WALL_NONCORONARY_RELEASE_V1_VERSION,
} from "@/engine/scientific/assembly/mainWireAdultFiveWallNonCoronaryReleaseV1";
import {
  loadSimulationReleaseV1,
  SimulationReleaseValidationError,
  type SimulationReleaseV1,
} from "@/engine/scientific/release";

/** Loads and digest-validates the same immutable release bytes on every host. */
export async function loadMainWireAdultFiveWallNonCoronaryReleaseV1():
Promise<SimulationReleaseV1> {
  const release = await loadSimulationReleaseV1(
    mainWireAdultFiveWallNonCoronaryReleaseArtifactV1,
  );
  if (
    release.ref.id
      !== MAIN_WIRE_ADULT_FIVE_WALL_NONCORONARY_RELEASE_V1_ID
    || release.ref.version
      !== MAIN_WIRE_ADULT_FIVE_WALL_NONCORONARY_RELEASE_V1_VERSION
    || release.ref.sha256
      !== MAIN_WIRE_ADULT_FIVE_WALL_NONCORONARY_RELEASE_V1_SHA256
  ) {
    throw new SimulationReleaseValidationError([
      "checked-in main-wire release does not match its pinned ID, version, and SHA-256",
    ]);
  }
  return release;
}
