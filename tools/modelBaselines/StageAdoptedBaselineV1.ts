import { createHash } from "node:crypto";
import { canonicalJsonStringify, sha256CanonicalJsonHex } from "@/engine/integrity";
import { readPreparedBaselineCaseV1 } from "@/studio/registry/PreparedBaselineCaseV1";
import type { SavedModelDocumentV1 } from "@/studio/presentation/modelDocumentation/SavedModelDocumentV1";
import type { composeFittedBaselineDocumentV1 } from "../modelDocumentation/authoring/FittedBaselineDocumentCompositionV1";

const same = (a: unknown, b: unknown, label: string) => {
  if (canonicalJsonStringify(a) !== canonicalJsonStringify(b)) throw new Error(`Adoption binding differs: ${label}`);
};
/** Stage data for review, not a write to the application's selection or DB.
 * Repository-owned compiled HTML is trusted content, not an import channel for
 * arbitrary third-party pages. Digests protect binding, not scientific validity.
 */
export async function stageAdoptedBaselineV1(preparedCase: unknown, savedDocument: unknown) {
  const prepared = await readPreparedBaselineCaseV1(preparedCase);
  const document = savedDocument as SavedModelDocumentV1;
  const { contentSha256, ...documentBody } = document;
  if (document.schemaId !== "circleheart.saved-model-document.v1"
    || createHash("sha256").update(JSON.stringify(documentBody)).digest("hex") !== contentSha256
    || document.identity.modelId !== prepared.preset.modelId
    || document.identity.surfaceReleaseId !== prepared.surfaceReleaseId
    || document.identity.baselineId !== prepared.preset.presetId) throw new Error("Adoption needs the case's own compiled document");
  const m = document.scientificRecord.measurements as Awaited<ReturnType<typeof composeFittedBaselineDocumentV1>>["measurements"];
  if (m.schemaId !== "main-wire-fitted-baseline-documentation-v1"
    || m.qualification.preparedCaseSha256 !== prepared.recordSha256
    || m.qualification.reportSha256 !== prepared.evidence.qualificationReportSha256
    || m.qualification.policyIdentitySha256 !== prepared.evidence.qualificationPolicySha256
    || m.qualification.executionSourceSha256 !== prepared.evidence.executionSourceSha256
    || m.qualification.launchPreparation.targetCheckpointSha256 !== prepared.evidence.launchCheckpointSha256) {
    throw new Error("Adoption document has another case, assessment or launch state");
  }
  same(m.fixtureIdentity, prepared.preset.capture.fixture, "fixture");
  const o = m.observations[0]!;
  same({ rest: o.rest, native: o.native,
    tau: { weiss: { tauMs: o.tau.weiss.tauMs }, glantz: { tauMs: o.tau.glantz.tauMs } },
    beat: o.beat, reserveVerified: m.admission.reserve?.status === "passed" }, prepared.assessment, "header assessment");
  const body = {
    schemaId: "adopted-main-wire-baseline-v1", baselineId: prepared.preset.presetId, modelId: prepared.preset.modelId,
    surfaceReleaseId: prepared.surfaceReleaseId, artifactRevisionId: prepared.artifactRevisionId,
    artifactSha256: prepared.artifactSha256, title: "baseline", capture: prepared.preset.capture,
    assessment: prepared.assessment, document: { documentId: document.documentId, contentSha256 },
    evidence: { kind: "paired-grid-fitted-case", ...prepared.evidence, preparedCaseSha256: prepared.recordSha256 },
    publicBaselinePromotionAuthorized: false,
  };
  const record = { ...body, recordSha256: await sha256CanonicalJsonHex(body) };
  const selection = { baselineId: record.baselineId, modelId: record.modelId, surfaceReleaseId: record.surfaceReleaseId,
    recordSha256: record.recordSha256, document: record.document };
  return { record, selection };
}
