import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { canonicalJsonStringify } from "@/engine/integrity";
import { validateMainWireIntegratedModelStandard72CheckpointV1 } from
  "@/engine/myocardium/MainWireIntegratedModelStandard72CheckpointV1";
import { MainWireIntegratedModelStandard72TypedAuthoritySessionV1 as Session } from
  "@/engine/vnext/MainWireIntegratedModelStandard72TypedAuthoritySessionV1";
import { withHotPathIntegrityTierV1 } from "@/engine/hotPathIntegrityTierV1";
import { MAIN_WIRE_INTEGRATED_STUDIO_STANDARD72_MODEL_ID_V1 as modelId } from
  "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioModelIdentityV1";
import { MAIN_WIRE_STANDARD72_DEFAULT_FIXTURE_V1 as defaultFixture,
  createCircleHeartExactModelReleaseV1 } from
  "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioStandard72ExactModelV1";
import productionSurface from
  "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioStandard72SurfaceV1";
import { resolveRegisteredAnalysisMethodsV1 } from "@/analysis/registry/RegisteredAnalysisMethodsV1";
import { composeStandardModelContractV1, type ModelSurfaceReleaseManifestV1 } from
  "@/studio/contracts/v2/modelSurface";
import type eligibilityShape from "@/data/model-baselines/standard72-reviewed-eligibility-v1.json";
import type provenanceShape from "@/data/model-baselines/standard72-admission-provenance-v1.json";
import type executableShape from "@/data/model-baselines/standard72-reviewed-executable-v1.json";
import type bindingShape from
  "@/studio/integrations/mainWireIntegratedV3/standard72-baseline-binding-evidence.json";

const directory = "studio/integrations/mainWireIntegratedV3/";
export const STANDARD72_RELEASE_FILES_V1 = Object.freeze({
  artifact: directory + "MainWireIntegratedStudioStandard72ExactModelV1.artifact.mjs",
  client: directory + "MainWireIntegratedStudioStandard72ExactModelV1.client.json",
  lock: directory + "standard72-registry-admission-lock.json",
  eligibility: "data/model-baselines/standard72-reviewed-eligibility-v1.json",
  provenance: "data/model-baselines/standard72-admission-provenance-v1.json",
  executable: "data/model-baselines/standard72-reviewed-executable-v1.json",
  binding: directory + "standard72-baseline-binding-evidence.json",
  periodic: directory + "standard72-settled-baseline-checkpoint.json",
  launch: directory + "standard72-launch-checkpoint.json",
});

// Scientific judgments are sealed independently of release packaging. Reuse
// depends on construction/input/numerical/measurement/policy correspondence,
// not just on a shared model name. --update cannot issue scientific approval.
const reviewed = Object.freeze({
  eligibility: "76f38faf7e685f1447eed6f825452ce5b35c9acf8bffe786a56c913a4f493bf7",
  provenance: "4a4dbc3246b7b36171f0313d8993ea9dc662711600f5a1cfa5f4e4cbd89a4728",
});
// These identify executable qualification, not a second scientific approval.
// Changed bytes/pins require the affected qualification and a new binding;
// they do not by themselves require rerunning the baseline or external vote.
const qualified = Object.freeze({
  executable: "6ff96dd8386e4be005943aac53783f29e67d4ca4a979bcb49168e37af90456af",
  binding: "928c767ad66d27ea14e0b63a611a00d1768f75aaa6bd24dd1dd34d8e912f4032",
});
export type Standard72AdmissionFilesV1 = Readonly<{
  artifact: Uint8Array; clientJson: string;
  eligibility: string; provenance: string; executable: string; binding: string;
  periodic: string; launch: string;
}>;

export function readStandard72AdmissionFilesV1(root: string, candidate?: Readonly<{
  artifact: Uint8Array; clientJson: string;
}>): Standard72AdmissionFilesV1 {
  const read = (key: keyof typeof STANDARD72_RELEASE_FILES_V1) =>
    readFileSync(resolve(root, STANDARD72_RELEASE_FILES_V1[key]), "utf8");
  return { artifact: candidate?.artifact ?? readFileSync(resolve(root, STANDARD72_RELEASE_FILES_V1.artifact)),
    clientJson: candidate?.clientJson ?? read("client"), eligibility: read("eligibility"),
    provenance: read("provenance"), executable: read("executable"), binding: read("binding"),
    periodic: read("periodic"), launch: read("launch") };
}

const sha = (value: string | Uint8Array) => createHash("sha256").update(value).digest("hex");
const objectSha = (value: unknown) => sha(canonicalJsonStringify(value));
function requireAdmission(condition: unknown, issue: string): asserts condition {
  if (!condition) throw new Error(`Standard72 admission rejected: ${issue}`);
}
function sealed<T>(raw: string, expected: string, name: string): T {
  requireAdmission(sha(raw) === expected, `${name} is not the sealed evidence`);
  return JSON.parse(raw) as T;
}
function exactInventory(actual: readonly string[], expected: readonly string[], name: string) {
  requireAdmission(actual.length === expected.length && new Set(actual).size === actual.length
    && expected.every(id => actual.includes(id)), `${name} inventory`);
}

/** Content-fixed scientific assessment, independent of executable packaging.
 * Raw traces and their original assessor remain recoverable in PR613; their
 * hash-fixed reviewed assessment is reused here, not relabelled as fresh72
 * fine/reserve execution. This does not establish clinical normality. */
export function verifyStandard72ScientificEvidenceV1(
  files: Pick<Standard72AdmissionFilesV1, "eligibility" | "provenance">,
) {
  const proof = sealed<typeof eligibilityShape>(files.eligibility, reviewed.eligibility, "eligibility");
  const provenance = sealed<typeof provenanceShape>(files.provenance, reviewed.provenance, "provenance");

  requireAdmission(proof.status === "eligible-for-exact-model-promotion"
    && proof.constructionSha256 === "27a5e0e68f076d3837313340faa9fe23228af72006eae635b4d7287d8ce8c8d8"
    && !proof.clinicalNormalityClaimed && !provenance.clinicalNormalityClaimed
    && !provenance.oldGlobalProvenanceAuditCleared, "review scope");
  exactInventory(proof.sources.map(s => String(s.nominalDtSec)), ["0.002", "0.001"], "independent cold grids");
  requireAdmission(proof.observations.length === 2, "two complete observations required");
  const anatomyIds = ["left", "right"].flatMap(side => ["edv-index", "esv-index", "ejection-fraction"]
    .map(metric => `${side}-ventricle.${metric}`));
  const operatingIds = ["systemic-net-flow.cardiac-index", "central-venous-pressure.mean",
    "pulmonary-artery-pressure.mean", "aortic-pressure.maximum", "aortic-pressure.minimum",
    "left-ventricle.native-end-filling-pressure"];
  exactInventory(provenance.operating.map(r => r.metricId), operatingIds, "operating provenance");
  exactInventory(provenance.anatomy.map(r => r.metricId), anatomyIds, "anatomical provenance");
  exactInventory(provenance.retained.flatMap(r => r.checkIds), ["settlement.period1",
    "waveform.LVP.single-peak-no-ringing", "waveform.RVP.single-peak-no-ringing",
    "aortic-valve.mean-gradient", "aortic-valve.peak-gradient",
    "pulmonary-valve.mean-gradient", "pulmonary-valve.peak-gradient",
    "waveform.PAP.single-peak-no-ringing", "waveform.PV-flow.single-forward-episode",
    "waveform.PV-flow.single-peak-no-ringing", "waveform.PAP.post-PV-closure-rebound"], "retained construction provenance");
  for (const observation of proof.observations) {
    const rest = observation.rest;
    requireAdmission(observation.errors.length === 0 && rest.status === "passed"
      && !rest.anatomyReviewRequired && rest.invalidOrFailedRetained.length === 0
      && rest.unavailable.length === 0, "applicability, settlement, conservation or retained construction hold");
    requireAdmission(rest.comparison.subject.bodySurfaceAreaM2 === 1.9
      && Math.abs(rest.comparison.heartRateBpm - 70) < 1e-7, "baseline BSA/HR");
    exactInventory(rest.operating.map(r => r.metricId), operatingIds, "operating observations");
    for (const rule of rest.operating) {
      requireAdmission(Number.isFinite(rule.actual) && (rule.lower === null || rule.actual! >= rule.lower)
        && rule.actual! <= rule.upper, `operating target ${rule.metricId}`);
      requireAdmission(provenance.sources.some(s => s.sourceId === rule.sourceId && s.url.length > 0)
        && rule.locator.length > 0, `operating source ${rule.metricId}`);
    }
    const anatomy = rest.comparison.entries.filter(e => e.role === "demographic-comparison");
    exactInventory(anatomy.map(e => e.metricId), anatomyIds, "anatomy observations");
    for (const entry of anatomy) {
      exactInventory(entry.comparisons.map(c => c.stratum), ["men, pooled adult ages", "women, pooled adult ages"], "CMR strata");
      requireAdmission(Number.isFinite(entry.actual) && entry.comparisons.every(c =>
        (c.range.lower === null || entry.actual! >= c.range.lower) && entry.actual! <= c.range.upper), `CMR ${entry.metricId}`);
    }
    const tau = observation.tau;
    requireAdmission(tau.status === "measured" && tau.issue === null && tau.weiss.tauMs > 0
      && Number.isFinite(tau.weiss.tauMs) && tau.relaxationTrace.excursions.length === 0
      && tau.relaxationTrace.maximumDipAndRecoveryMmHg <= 1e-7
      && tau.relaxationTrace.maximumRiseFromRunningMinimumMmHg <= 1e-7, "tau measurement or unresolved re-rise");
    // No rejection on referenceStatus/48ms: that would change the reviewed policy.
  }
  exactInventory(proof.pressureRateQuality.map(q => q.checkId), ["left", "right"].flatMap(side =>
    ["maximum", "minimum"].map(extremum => `${side}-ventricle.${extremum}-dpdt`)), "pressure-rate quality");
  for (const q of proof.pressureRateQuality) {
    requireAdmission(q.status === "passed" && Number.isFinite(q.relativeDifference) && q.relativeDifference <= .05
      && [q.coarse, q.fine].every(g => g.status === "passed" && g.issue === null
        && g.previousSameSignFraction >= .5 && g.nextSameSignFraction >= .5), "pressure-rate sensitivity/spike");
  }
  exactInventory(proof.reserve.responses.map(r => `${r.side}/${r.direction}`),
    ["left", "right"].flatMap(side => ["hypovolemic", "hypervolemic"].map(d => `${side}/${d}`)), "reserve directions");
  requireAdmission(proof.reserve.issues.length === 0 && proof.reserve.status === "passed", "reserve settlement/protocol");
  for (const r of proof.reserve.responses) {
    exactInventory(r.margins.map(m => m.field), ["directionalFillingPressureChangeMmHg",
      "directionalCardiacOutputChangeLPerMin", "directionalEndDiastolicVolumeChangeMl",
      "directionalEndDiastolicTransmuralPressureChangeMmHg"], "reserve primitive margins");
    exactInventory(r.ratioMargins.map(m => m.field), ["CardiacOutputLPerMin:fractional-floor-residual",
      "EndDiastolicVolumeMl:fractional-floor-residual", "CO-pressure-secant-residual"], "reserve ratio margins");
    requireAdmission(r.passed && r.screens.length === 2 && r.screens.every(s => s.status === "directional-screen-passed")
      && r.margins.length === 4 && r.ratioMargins.length === 3
      && [...r.margins, ...r.ratioMargins].every(m => Number.isFinite(m.margin)
        && Number.isFinite(m.sensitivity) && m.sensitivity >= 0 && m.margin > m.sensitivity), "reserve response sensitivity");
  }

  return { proof, scientificAdmission: Object.freeze({
    policyId: proof.policy.policyId, constructionSha256: proof.constructionSha256,
    ...reviewed, clinicalNormalityClaimed: false as const,
  }) };
}

/** Bind the unchanged assessment to this exact release; no new scientific vote.
 * Neither a passing assessment nor two restored twins alone qualifies the
 * executable: the sealed artifact/Worker uninterrupted-continuation evidence
 * below is also required. */
export async function prepareStandard72RegistryAdmissionV1(
  input: Standard72AdmissionFilesV1,
  expectedModelId: string,
  selectedSurface: ModelSurfaceReleaseManifestV1 = productionSurface,
) {
  // Own every byte before the first await. Publication must upload this copy,
  // never re-read caller buffers or files after asynchronous validation.
  const artifact = Uint8Array.from(input.artifact);
  const files = { ...input, artifact };
  const surface = JSON.parse(canonicalJsonStringify(selectedSurface)) as ModelSurfaceReleaseManifestV1;
  requireAdmission(expectedModelId === modelId, "unsupported modelId");
  const { proof, scientificAdmission } = verifyStandard72ScientificEvidenceV1(files);
  const executable = sealed<typeof executableShape>(files.executable, qualified.executable, "executable qualification");
  const binding = sealed<typeof bindingShape>(files.binding, qualified.binding, "cold binding");
  requireAdmission(binding.sources.admission.sha256 === reviewed.eligibility
    && binding.sources.coarse.sha256 === proof.sources[0]!.sha256
    && binding.priorCheckpointImported === false && binding.nominalDtSec === .002
    && binding.modelId === modelId && Object.values(binding.parity).every(p => p === "exact"), "cold-to-reviewed construction binding");
  const periodic = await validateMainWireIntegratedModelStandard72CheckpointV1(JSON.parse(files.periodic));
  const launch = await validateMainWireIntegratedModelStandard72CheckpointV1(JSON.parse(files.launch));
  requireAdmission(periodic.checkpointSha256 === binding.checkpoint.checkpointSha256
    && launch.checkpointSha256 === binding.launchPreparation.targetCheckpointSha256
    && periodic.checkpointSha256 === binding.launchPreparation.sourceCheckpointSha256
    && launch.acceptedTimeSec === binding.launchPreparation.targetAcceptedTimeSec
    && periodic.acceptedTimeSec === binding.checkpoint.acceptedTimeSec
    && objectSha(periodic.baseStandardCheckpointV2.completedBeatMetrics) === objectSha(launch.baseStandardCheckpointV2.completedBeatMetrics), "periodic/launch checkpoints");

  // Restore through the actual owner, including default fixture/root/clock
  // compatibility, and reproduce the real sub-tick launch preparation.
  const source = await Session.restoreStandard72ExactCheckpoint(periodic);
  requireAdmission(objectSha(await source.checkpointStandard72Exact()) === objectSha(periodic), "periodic owner roundtrip");
  const twin = await Session.restoreStandard72ExactCheckpoint(periodic);
  const step = withHotPathIntegrityTierV1("hot-path-lean", () =>
    source.advanceStructuralAnalysisToPresentationTimeV1(launch.acceptedTimeSec));
  const twinStep = withHotPathIntegrityTierV1("hot-path-lean", () =>
    twin.advanceStructuralAnalysisToPresentationTimeV1(launch.acceptedTimeSec));
  const replayed = await source.checkpointStandard72Exact();
  // Historical source→target replay belongs to the sealed cold-binding
  // evidence. Recompute in this runtime too, but never impose a cross-runtime
  // floating-point golden hash or invent a tolerance for it. The exact
  // restart-alignment comparison is between twins in this JavaScript runtime;
  // uninterrupted continuation is established by separate qualified tests.
  requireAdmission(step.status === "advanced" && twinStep.status === "advanced"
    && replayed.acceptedTimeSec === launch.acceptedTimeSec && replayed.revision === launch.revision
    && objectSha(replayed.baseStandardCheckpointV2.completedBeatMetrics) === objectSha(periodic.baseStandardCheckpointV2.completedBeatMetrics)
    && objectSha(replayed) === objectSha(await twin.checkpointStandard72Exact()), "periodic-to-launch deterministic restart alignment");
  const restarted = await Session.restoreStandard72ExactCheckpoint(launch);
  requireAdmission(objectSha(await restarted.checkpointStandard72Exact()) === objectSha(launch), "launch owner roundtrip");

  const { manifest } = createCircleHeartExactModelReleaseV1();
  const client = JSON.parse(files.clientJson);
  const methods = resolveRegisteredAnalysisMethodsV1(surface);
  const artifactSha256 = sha(artifact);
  requireAdmission(artifactSha256 === executable.artifact.artifactSha256
    && artifact.byteLength === executable.artifact.artifactBytes, "artifact differs from qualified continuation evidence");
  requireAdmission(client?.schemaId === "circleheart-standard-exact-model-client-descriptor-v1"
    && objectSha(client.manifest) === executable.manifestSha256 && objectSha(manifest) === executable.manifestSha256
    && objectSha(client.defaultFixture) === executable.defaultFixtureSha256
    && objectSha(defaultFixture) === executable.defaultFixtureSha256, "manifest/default fixture descriptor");
  requireAdmission(objectSha(surface) === executable.surfaceSha256
    && surface.surfaceReleaseId === executable.artifact.surfaceReleaseId
    && objectSha(methods.capabilities) === objectSha(executable.analysisCapabilities)
    && methods.periodicPvaDerivation?.methodId === executable.periodicPvaMethodId, "production Surface/analysis pins");
  composeStandardModelContractV1(manifest, surface, methods.capabilities);
  const bytes = new TextEncoder().encode(canonicalJsonStringify(manifest));
  const framed = new Uint8Array(8 + bytes.length + artifact.length), lengths = new DataView(framed.buffer);
  lengths.setUint32(0, bytes.length, false); lengths.setUint32(4, artifact.length, false);
  framed.set(bytes, 8); framed.set(artifact, 8 + bytes.length);
  const artifactRevisionId = sha(framed);
  requireAdmission(artifactRevisionId === executable.artifact.artifactRevisionId
    && launch.checkpointSha256 === executable.artifact.launchCheckpointSha256, "artifact revision/checkpoint binding");
  exactInventory(executable.artifact.referenceParity.cases.map(c => c.condition),
    ["settled", "cold-TBV4940", "controlled-TBV4940"], "research executable parity");
  requireAdmission(executable.artifact.referenceParity.cases.every(c => c.steps === 1000 && c.finalCheckpointEqual)
    && executable.artifact.capturedPredictorDepth === 4 && executable.artifact.capturedContinuationSteps === 1000
    && executable.artifact.snapshotAdmission === "passed", "artifact continuation qualification");
  exactInventory(executable.browser.results.map(r => `${r.browser}/${r.executionPlan}/${r.afterControl}`),
    ["chromium/false/false", "chromium/true/true", "webkit/false/false", "webkit/true/true"], "Worker qualification");
  requireAdmission(executable.browser.artifactSha256 === artifactSha256
    && executable.browser.artifactRevisionId === artifactRevisionId
    && executable.browser.results.every(r => r.status === "passed" && r.capturedHistoryDepth === 4
      && r.comparedSteps === 1000 && r.finalCheckpointEqual && r.structuredCloneAndJsonRoundtrip
      && r.snapshotAdmission === "passed"), "Worker continuation qualification");
  const lock = Object.freeze({
    schemaId: "circleheart-standard-exact-model-registry-admission-lock-v2",
    modelId, artifactRevisionId, artifactSha256,
    predecessorArtifactRevisionId: null, equivalenceReportSha256: null,
    scientificAdmission,
    releaseQualification: { ...qualified,
      periodicCheckpointSha256: periodic.checkpointSha256, launchCheckpointSha256: launch.checkpointSha256,
      defaultFixtureSha256: executable.defaultFixtureSha256, surfaceSha256: executable.surfaceSha256,
      surfaceReleaseId: surface.surfaceReleaseId,
      checkpointReproductionScope: "exact-owner-roundtrips-and-current-runtime-twin-alignment; historical-source-to-launch-parity-in-sealed-binding",
    },
  });
  return { artifact, clientJson: files.clientJson, manifest, defaultFixture, lock, artifactSha256,
    referenceFlags: proof.referenceFlags, published: false as const };
}

export function assertStandard72AdmissionLockV1(raw: string, expected: unknown): void {
  requireAdmission(canonicalJsonStringify(JSON.parse(raw)) === canonicalJsonStringify(expected), "admission lock differs from complete qualification");
}
