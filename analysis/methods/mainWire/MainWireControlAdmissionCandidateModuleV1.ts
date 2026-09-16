import metadata from "@/data/model-candidates/control-admission-v1/candidate.json";
import type { MainWireStaticCaseSessionV1 as Session } from "@/engine/vnext/MainWireControlAdmissionCandidateSessionV1";
import type { ExactModelKernelManifestV3 } from "@/studio/contracts/v2/modelSurface";
import type { RegisteredModelExecutableBundleV2 } from "@/studio/contracts/v2/executable";
import { importExactExecutableArtifactModuleV2 } from "@/runtime/ExactExecutableArtifactModuleLoaderV2";

type CandidateModule = Readonly<{
  createCircleHeartExactModelReleaseV1: () => Readonly<{ manifest: ExactModelKernelManifestV3; executables: RegisteredModelExecutableBundleV2 }>;
  ControlCandidateSessionV1: typeof Session;
}>;
let pending: Promise<CandidateModule> | undefined;

/** A lazily loaded, hash-checked exact module shared by detached candidate
 * analyses in this realm. The registered model never imports these bytes. */
export function loadControlAdmissionCandidateModuleV1(): Promise<CandidateModule> {
  return pending ??= load().catch(error => { pending = undefined; throw error; });
}

async function load(): Promise<CandidateModule> {
  const { default: artifact } = await import("@/data/model-candidates/control-admission-v1/artifact.mjs.txt?raw");
  const bytes = new TextEncoder().encode(artifact);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const sha256 = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
  if (sha256 !== metadata.artifactSha256) throw new Error("Candidate analysis artifact digest differs");
  const module = await importExactExecutableArtifactModuleV2(bytes);
  if (module.VASCULAR_PRESSURE_INVERSE_POLICY_V1 !== "bracketed-step-contraction-venous-inverse-v1"
    || typeof module.createCircleHeartExactModelReleaseV1 !== "function"
    || typeof module.ControlCandidateSessionV1 !== "function")
    throw new Error("Candidate numerical module is incomplete");
  const candidate = module as unknown as CandidateModule;
  if (candidate.createCircleHeartExactModelReleaseV1().manifest.modelId !== metadata.manifest.modelId)
    throw new Error("Candidate numerical module identity differs");
  return candidate;
}
