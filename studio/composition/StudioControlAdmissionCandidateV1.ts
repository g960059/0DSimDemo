import candidate from "@/data/model-candidates/control-admission-v1/candidate.json";
import launches from "@/data/model-candidates/control-admission-v1/launches.json";
import { loadStudioLocalCurrentClientCompositionV1, type StudioClientCompositionV2 } from "./StudioDefaultCompositionV2";
import { validateStudioModelWorkerReleaseTicketV2 } from "@/studio/contracts/v2/release";
import { composeModelSurfacePresentationBundleV1 } from "@/studio/application/modelSurface/ModelSurfacePresentationBundleV1";
import { validateScenarioPresetV2 } from "@/studio/application/authoring/StudioExperimentDataV2";

/** Only the ephemeral model-lab route may launch this unregistered candidate. */
export async function loadStudioControlAdmissionCandidateV1(): Promise<StudioClientCompositionV2> {
  const inherited = await loadStudioLocalCurrentClientCompositionV1();
  if (launches.scope !== "ephemeral-review-only" || launches.modelId !== candidate.manifest.modelId
    || launches.artifactRevisionId !== candidate.artifactRevisionId
    || launches.surfaceReleaseId !== inherited.modelSurface.identity.surfaceReleaseId)
    throw new Error("Candidate launch package requires regeneration for this exact artifact and Surface");
  const presets = launches.presets.map(value => validateScenarioPresetV2(value));
  if (!presets.length || presets.some(preset => preset.modelId !== candidate.manifest.modelId || !preset.capture.checkpoint))
    throw new Error("Candidate launch package requires its own captured presets");
  const baseline = presets[0]!.capture;
  const artifactUrl = new URL("../../data/model-candidates/control-admission-v1/artifact.mjs.txt", import.meta.url);
  const ticket = validateStudioModelWorkerReleaseTicketV2({
    ...inherited.exactModel.workerReleaseTicket,
    modelId: candidate.manifest.modelId, manifest: candidate.manifest,
    artifactRevisionId: candidate.artifactRevisionId,
    artifactUrl: artifactUrl.protocol === "file:" ? "http://127.0.0.1/__control_admission_candidate__.mjs" : artifactUrl.href,
  });
  return Object.freeze({
    exactModel: Object.freeze({ ...inherited.exactModel, modelId: ticket.modelId, stage: "dev",
      defaultFixture: baseline.fixture, defaultCheckpoint: baseline.checkpoint, workerReleaseTicket: ticket }),
    modelSurface: composeModelSurfacePresentationBundleV1({ kernel: ticket.manifest,
      surfaceRelease: ticket.surfaceRelease, stage: "dev", analysis: inherited.modelSurface.analysis }),
    presets,
  });
}
