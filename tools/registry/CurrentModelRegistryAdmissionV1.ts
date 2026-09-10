import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { canonicalJsonStringify as canonical } from "@/engine/integrity";
import { createMainWireIntegratedStudioStaticCaseCoreReleaseV1 as release } from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioSelectedAorticOutflowExactModelV1";
import surface from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioStaticCaseSurfaceV1";
import { composeStandardModelContractV1 } from "@/studio/contracts/v2/modelSurface";
import { resolveRegisteredAnalysisMethodsV1 } from "@/analysis/registry/RegisteredAnalysisMethodsV1";
import type bundleShape from "@/data/model-releases/standard73/bundle.json";
import type packageShape from "@/data/model-releases/standard73/package.json";
import type lockShape from "@/data/model-releases/standard73/publication.json";
import type baselineShape from "@/data/model-baselines/standard73-baseline-v1.json";
import type baselineDoc from "@/studio/presentation/modelDocumentation/packages/standard73-document-v2.json";
import type caseDoc from "@/studio/presentation/modelDocumentation/packages/standard73-hfref-document-v2.json";
import { validateScenarioPresetV2 } from "@/studio/application/authoring/StudioExperimentDataV2";

export const CURRENT_MODEL_PUBLICATION_FILES_V1 = {
  artifact: "data/model-releases/standard73/artifact.mjs.txt",
  lock: "data/model-releases/standard73/publication.json",
} as const;
const sha = (bytes: Uint8Array | string) => createHash("sha256").update(bytes).digest("hex");
const same = (a: unknown, b: unknown, label: string) => {
  if (canonical(a) !== canonical(b)) throw new Error(`Current model admission rejected: ${label}`);
};
function requireProof(condition: unknown, issue: string): asserts condition {
  if (!condition) throw new Error(`Current model admission rejected: ${issue}`);
}

/** Publication reuses the content-fixed, independently reviewed two-case
 * qualification. It checks own captures and current bindings, not a fresh
 * scientific vote or a rerun of the archived cold-grid experiments. */
export async function prepareCurrentModelPublicationV1(root: string, input: Readonly<{
  artifact: Uint8Array; lockJson: string; expectedModelId: string;
}>) {
  const artifact = Uint8Array.from(input.artifact), lockJson = input.lockJson;
  const read = (p: string) => readFileSync(resolve(root, p), "utf8");
  const lock = JSON.parse(read(CURRENT_MODEL_PUBLICATION_FILES_V1.lock)) as typeof lockShape;
  same(JSON.parse(lockJson), lock, "admission lock differs from complete qualification");
  const rawPackage = read("data/model-releases/standard73/package.json");
  // Both review decisions and complete numerical/Worker evidence are retained
  // in this archive. A new case, state or artifact cannot self-approve a hash.
  requireProof(sha(rawPackage) === "bedb4198cf4d15fc31993db5d59e7e8925866b36935484ec951788c2dddc5fc0"
    && sha(rawPackage) === lock.reviewedLocalPackageSha256, "reviewed local package changed");
  const reviewed = JSON.parse(rawPackage) as typeof packageShape;
  const evidencePath = resolve(root, reviewed.workerEvidence.path);
  requireProof(sha(readFileSync(evidencePath)) === "b1701c6f60988805b403ad68d70b1fcb442b0ddd94e9018d83ffbeddc9b34162"
    && lock.reviewedEvidenceArchiveSha256 === "b1701c6f60988805b403ad68d70b1fcb442b0ddd94e9018d83ffbeddc9b34162", "reviewed evidence archive changed");
  const worker = execFileSync("tar", ["-xOzf", evidencePath, "./" + reviewed.workerEvidence.entry]);
  requireProof(sha(worker) === reviewed.workerEvidence.sha256, "Worker evidence binding");
  const bundle = JSON.parse(read("data/model-releases/standard73/bundle.json")) as typeof bundleShape;
  const { recordSha256, ...body } = bundle;
  requireProof(sha(canonical(body)) === recordSha256 && recordSha256 === reviewed.bundleSha256
    && recordSha256 === lock.bundleSha256, "qualified bundle changed");
  const exact = release(), manifest = exact.manifest;
  requireProof(input.expectedModelId === manifest.modelId && manifest.modelId === lock.modelId
    && manifest.modelId === reviewed.modelId, "unsupported modelId");
  same(manifest, bundle.manifest, "exact manifest changed"); same(surface, bundle.surface, "Surface/analysis pins changed");
  requireProof(surface.surfaceReleaseId === lock.surfaceReleaseId, "Surface identity");
  const model = composeStandardModelContractV1(manifest, surface, resolveRegisteredAnalysisMethodsV1(surface).capabilities).contract;
  const artifactSha256 = sha(artifact);
  requireProof(artifactSha256 === reviewed.artifactSha256 && artifactSha256 === lock.artifactSha256, "artifact differs from qualification");
  const manifestBytes = Buffer.from(canonical(manifest)), lengths = Buffer.alloc(8);
  lengths.writeUInt32BE(manifestBytes.length, 0); lengths.writeUInt32BE(artifact.length, 4);
  requireProof(sha(Buffer.concat([lengths, manifestBytes, artifact])) === lock.artifactRevisionId
    && lock.artifactRevisionId === reviewed.artifactRevisionId, "artifact revision binding");
  const baseline = JSON.parse(read("data/model-baselines/standard73-baseline-v1.json")) as typeof baselineShape;
  const { recordSha256: baselineSha, ...baselineBody } = baseline;
  requireProof(sha(canonical(baselineBody)) === baselineSha && baselineSha === lock.baselineRecordSha256, "baseline record");
  same(baseline.capture, bundle.baseline.capture, "baseline launch capture");
  same(baseline.evidence, { kind: "own-static-baseline-qualification", ...bundle.baselineQualification }, "own baseline evidence");
  same(JSON.parse(read("data/model-baselines/current-baseline-selection-v1.json")), {
    baselineId: baseline.baselineId, modelId: baseline.modelId, surfaceReleaseId: baseline.surfaceReleaseId,
    recordSha256: baselineSha, document: baseline.document,
  }, "default selection");
  requireProof(baseline.modelId === lock.modelId && baseline.surfaceReleaseId === lock.surfaceReleaseId
    && baseline.artifactSha256 === artifactSha256 && baseline.artifactRevisionId === lock.artifactRevisionId, "baseline release identity");
  const presets = [bundle.baseline, ...bundle.presets].map(validateScenarioPresetV2);
  requireProof(lock.cases.length === presets.length && presets.length === reviewed.cases.length, "case inventory");
  // Snapshot every document before asynchronous exact-owner validation.
  const docs = lock.cases.map(c => JSON.parse(read(`studio/presentation/modelDocumentation/packages/${c.documentId}.json`))) as [typeof baselineDoc, typeof caseDoc];
  for (const [i, preset] of presets.entries()) {
    const c = lock.cases[i]!, approved = reviewed.cases[i]!, doc = docs[i]!;
    const { contentSha256, ...documentBody } = doc;
    requireProof(sha(JSON.stringify(documentBody)) === contentSha256 && contentSha256 === c.documentSha256
      && doc.documentId === c.documentId && doc.identity.modelId === model.modelId
      && doc.identity.surfaceReleaseId === surface.surfaceReleaseId
      && doc.identity.baselineId === preset.presetId && preset.presetId === c.presetId
      && preset.presetId === approved.presetId, "case document identity/digest");
    const payload = preset.capture.checkpoint.payload as unknown as typeof bundle.baseline.capture.checkpoint.payload;
    requireProof(payload.checkpointSha256 === approved.checkpointSha256 && payload.checkpointSha256 === c.checkpointSha256, "case checkpoint");
    same(doc.scientificRecord.measurements.construction, payload.construction, "document construction");
    const prior = JSON.parse(read(`studio/presentation/modelDocumentation/packages/${approved.documentId}.json`));
    same(doc.scientificRecord.measurements.observations, prior.scientificRecord.measurements.observations, "reviewed observations changed");
  }
  const m = docs[0].scientificRecord.measurements, o = m.observations[0]!;
  same(baseline.document, { documentId: docs[0].documentId, contentSha256: docs[0].contentSha256 }, "baseline document");
  same(baseline.assessment, { rest: o.rest, native: o.native,
    tau: { weiss: { tauMs: o.tau.weiss.tauMs }, glantz: { tauMs: o.tau.glantz.tauMs } },
    beat: bundle.baseline.capture.checkpoint.payload.base.completedBeatMetrics,
    reserveVerified: m.admission.reserve.status === "passed" }, "baseline assessment readback");
  for (const preset of presets) await exact.executables.captureAdapter.validateCapture({ model, capture: preset.capture });
  return { artifact, manifest, defaultFixture: bundle.baseline.capture.fixture, lock, artifactSha256 };
}
