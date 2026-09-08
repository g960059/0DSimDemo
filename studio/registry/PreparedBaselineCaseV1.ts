import { cloneAndFreezeStudioJson, studioCanonicalJsonStringify } from "@/domain/json/CanonicalJson";
import type { ScenarioPresetV2 } from "@/studio/contracts/v2/content";
import type { StudioModelWorkerReleaseTicketV2 } from "@/studio/contracts/v2/release";
import { validateScenarioPresetV2 } from "@/studio/application/authoring/StudioExperimentDataV2";
import { mainWireBaselineAssessmentPresentationV1,
  type MainWireBaselineAssessmentReadbackV1 } from "@/studio/presentation/CurrentBaselinePresentationV1";
import descriptor from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioStandard72ExactModelV1.client.json";
import lock from "@/studio/integrations/mainWireIntegratedV3/standard72-registry-admission-lock.json";
import surface from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioStandard72SurfaceV1";

/** Local review package around the existing preset/capture, not a new runtime
 * identity or a publication vote. The large qualification/source archive stays
 * beside this file. Digests bind records; they do not certify arbitrary JSON. */
export type PreparedBaselineCaseV1 = Readonly<{
  schemaId: "prepared-main-wire-baseline-case-v1";
  preset: ScenarioPresetV2;
  surfaceReleaseId: string;
  artifactRevisionId: string;
  artifactSha256: string;
  fixtureSha256: string;
  assessment: MainWireBaselineAssessmentReadbackV1;
  evidence: Readonly<{
    qualificationReportSha256: string;
    qualificationPolicySha256: string;
    referenceSha256: string;
    executionSourceSha256: string;
    qualifiedCheckpointSha256: string;
    launchCheckpointSha256: string;
    sourceArtifactContinuationSteps: number;
  }>;
  publicBaselinePromotionAuthorized: false;
  recordSha256: string;
}>;

const equal = (a: unknown, b: unknown) => studioCanonicalJsonStringify(a) === studioCanonicalJsonStringify(b);
const sha = (value: unknown) => typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
async function sha256CanonicalJsonHex(value: unknown) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(studioCanonicalJsonStringify(value)));
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
}

/** Cheap import integrity only. The exact Worker still validates/restores the
 * paired fixture/checkpoint before the workbench is made live. */
export async function readPreparedBaselineCaseV1(input: unknown): Promise<PreparedBaselineCaseV1> {
  const value = cloneAndFreezeStudioJson(input) as unknown as PreparedBaselineCaseV1;
  if (!value || value.schemaId !== "prepared-main-wire-baseline-case-v1" || !sha(value.recordSha256)) {
    throw new Error("Invalid prepared baseline case");
  }
  const { recordSha256, ...body } = value;
  if (await sha256CanonicalJsonHex(body) !== recordSha256) throw new Error("Prepared case digest differs");
  const preset = validateScenarioPresetV2(value.preset);
  if (preset.modelId !== descriptor.manifest.modelId || value.artifactRevisionId !== lock.artifactRevisionId
    || value.artifactSha256 !== lock.artifactSha256 || value.surfaceReleaseId !== surface.surfaceReleaseId
    || value.publicBaselinePromotionAuthorized !== false || !value.evidence
    || (["qualificationReportSha256", "qualificationPolicySha256", "referenceSha256", "executionSourceSha256",
      "qualifiedCheckpointSha256", "launchCheckpointSha256"] as const).some(key => !sha(value.evidence[key]))
    || !Number.isInteger(value.evidence.sourceArtifactContinuationSteps) || value.evidence.sourceArtifactContinuationSteps < 1000
    || await sha256CanonicalJsonHex(preset.capture.fixture) !== value.fixtureSha256) {
    throw new Error("Prepared case model, artifact, Surface or evidence binding differs");
  }
  const payload = preset.capture.checkpoint.payload as Record<string, unknown>;
  const { checkpointSha256, ...checkpointBody } = payload;
  const beat = (payload.baseStandardCheckpointV2 as { completedBeatMetrics?: Record<string, unknown> })?.completedBeatMetrics;
  if (checkpointSha256 !== value.evidence.launchCheckpointSha256
    || await sha256CanonicalJsonHex(checkpointBody) !== checkpointSha256
    || preset.capture.checkpoint.acceptedTimeSec !== payload.acceptedTimeSec
    || preset.capture.checkpoint.acceptedRevision !== payload.revision
    || !beat || !equal(value.assessment.beat, { ventricularAbsolutePressureRateExtrema: beat.ventricularAbsolutePressureRateExtrema,
      valveForwardPressureGradients: beat.valveForwardPressureGradients })
    || value.assessment.rest.status !== "passed" || !value.assessment.reserveVerified) {
    throw new Error("Prepared case checkpoint or assessment differs");
  }
  mainWireBaselineAssessmentPresentationV1(value.assessment, "en", "candidate");
  return value;
}

/** Explicit selection affects only a newly created session. Saved captures and
 * the registered baseline package are never modified by this operation. */
export function preparedBaselineLaunchV1(value: PreparedBaselineCaseV1,
  ticket: StudioModelWorkerReleaseTicketV2) {
  if (ticket.modelId !== value.preset.modelId || ticket.artifactRevisionId !== value.artifactRevisionId
    || !equal(ticket.manifest, descriptor.manifest) || !equal(ticket.surfaceRelease, surface)) {
    throw new Error("Prepared case is incompatible with the selected release");
  }
  return { defaultFixture: value.preset.capture.fixture, defaultCheckpoint: value.preset.capture.checkpoint };
}
