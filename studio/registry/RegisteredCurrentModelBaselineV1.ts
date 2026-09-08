import { studioCanonicalJsonStringify } from "@/domain/json/CanonicalJson";
import type { ScenarioCheckpointV2 } from "@/studio/contracts/v2/content";
import type { StudioJsonValueV2 } from "@/studio/contracts/v2/json";
import type { StudioModelWorkerReleaseTicketV2 } from "@/studio/contracts/v2/release";
import descriptor from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioStandard72ExactModelV1.client.json";
import { CURRENT_BASELINE_V1 as adopted } from "@/data/model-baselines/CurrentBaselineV1";
import lock from "@/studio/integrations/mainWireIntegratedV3/standard72-registry-admission-lock.json";
import surface from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioStandard72SurfaceV1";

const equal = (a: unknown, b: unknown) => studioCanonicalJsonStringify(a) === studioCanonicalJsonStringify(b);

// Publication verifies hashes and restores this own-model checkpoint. The
// browser only binds that checked package; it never recomputes an assessment.
const checkpoint = adopted.capture.checkpoint;
if (descriptor.manifest.modelId !== lock.modelId || adopted.modelId !== lock.modelId
  || adopted.artifactRevisionId !== lock.artifactRevisionId || adopted.artifactSha256 !== lock.artifactSha256
  || checkpoint.payload.checkpointSha256 !== adopted.evidence.launchCheckpointSha256
  || checkpoint.acceptedTimeSec !== checkpoint.payload.acceptedTimeSec
  || checkpoint.acceptedRevision !== checkpoint.payload.revision
  || adopted.surfaceReleaseId !== surface.surfaceReleaseId
  || surface.surfaceReleaseId !== lock.releaseQualification.surfaceReleaseId) {
  throw new Error("Current baseline package is not bound to its launch checkpoint");
}

export const REGISTERED_CURRENT_MODEL_BASELINE_V1 = Object.freeze({
  modelId: descriptor.manifest.modelId,
  baselineId: adopted.baselineId,
  fixture: adopted.capture.fixture,
  checkpoint: checkpoint as ScenarioCheckpointV2,
  assessment: adopted.assessment,
  document: adopted.document,
});

export function isRegisteredCurrentBaselineFixtureV1(modelId: string | null | undefined,
  fixture: StudioJsonValueV2 | null | undefined): boolean {
  return modelId === REGISTERED_CURRENT_MODEL_BASELINE_V1.modelId && fixture != null
    && equal(fixture, REGISTERED_CURRENT_MODEL_BASELINE_V1.fixture);
}

export function resolveRegisteredCurrentModelLaunchV1(input: Readonly<{
  ticket: Pick<StudioModelWorkerReleaseTicketV2, "modelId" | "manifest" | "surfaceRelease">;
  defaultFixture: StudioJsonValueV2;
}>) {
  return isRegisteredCurrentBaselineFixtureV1(input.ticket.modelId, input.defaultFixture)
    && equal(input.ticket.manifest, descriptor.manifest) && equal(input.ticket.surfaceRelease, surface)
    ? Object.freeze({ defaultFixture: REGISTERED_CURRENT_MODEL_BASELINE_V1.fixture,
      defaultCheckpoint: REGISTERED_CURRENT_MODEL_BASELINE_V1.checkpoint }) : undefined;
}
