import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { canonicalJsonStringify } from "@/engine/integrity";
import { assertExactModelKernelManifestV3 } from "@/studio/contracts/v2/modelSurface";
import { MAIN_WIRE_INTEGRATED_STUDIO_ALGEBRAIC_PULMONARY_ROOT_MODEL_ID_V1 as modelId } from
  "@/domain/model/MainWireStandardIdentityV1";

// Standard70 is still the active browser/fitting package while72 is a candidate.
// Verify its retained bytes, never rebuild it from the candidate's shared host.
const directory = "studio/integrations/mainWireIntegratedV3/";
export const RETAINED_EXACT_PACKAGE_FILES_V1 = Object.freeze({
  artifact: directory + "MainWireIntegratedStudioAlgebraicPulmonaryRootExactModelV1.artifact.mjs",
  client: directory + "MainWireIntegratedStudioAlgebraicPulmonaryRootExactModelV1.client.json",
  lock: directory + "algebraic-pulmonary-root-standard70-registry-admission-lock.json",
});
const sha = (bytes: string | Uint8Array) => createHash("sha256").update(bytes).digest("hex");

export function verifyRetainedExactPackageBytesV1(input: Readonly<{
  artifact: Uint8Array; client: string; lock: string;
}>) {
  const client = JSON.parse(input.client), lock = JSON.parse(input.lock);
  assertExactModelKernelManifestV3(client.manifest);
  if (client.schemaId !== "circleheart-standard-exact-model-client-descriptor-v1"
    || lock.schemaId !== "circleheart-standard-exact-model-registry-admission-lock-v2"
    || client.manifest.modelId !== modelId || lock.modelId !== modelId) {
    throw new Error("Retained package identity mismatch");
  }
  const manifestBytes = new TextEncoder().encode(canonicalJsonStringify(client.manifest));
  const framed = new Uint8Array(8 + manifestBytes.length + input.artifact.length);
  const lengths = new DataView(framed.buffer);
  lengths.setUint32(0, manifestBytes.length, false);
  lengths.setUint32(4, input.artifact.length, false);
  framed.set(manifestBytes, 8); framed.set(input.artifact, 8 + manifestBytes.length);
  if (sha(input.artifact) !== lock.artifactSha256 || sha(framed) !== lock.artifactRevisionId) {
    throw new Error("Retained package artifact/manifest integrity mismatch");
  }
  return { modelId, artifactRevisionId: lock.artifactRevisionId as string,
    artifactSha256: lock.artifactSha256 as string, scope: "retained-package-integrity" as const };
}

export function verifyRetainedExactModelPackageV1(root: string, baseRef = "HEAD") {
  if (!baseRef || /^0+$/.test(baseRef)) baseRef = "HEAD";
  // This lane is explicitly read-only and cannot reseal an old package. A real
  // revision belongs in its equivalence/admission lane, not an integrity update.
  const contents = Object.fromEntries(Object.entries(RETAINED_EXACT_PACKAGE_FILES_V1).map(([key, path]) => {
    const current = readFileSync(resolve(root, path));
    const prior = execFileSync("git", ["show", `${baseRef}:${path}`], {
      cwd: root, maxBuffer: 32 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"],
    });
    if (!current.equals(prior)) throw new Error(`Retained package changed from ${baseRef}: ${path}; use its admission/equivalence lane`);
    return [key, current];
  }));
  return verifyRetainedExactPackageBytesV1({ artifact: contents.artifact!,
    client: contents.client!.toString("utf8"), lock: contents.lock!.toString("utf8") });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.length !== 2) throw new Error("No update mode: retained-package verification is read-only");
  console.log(JSON.stringify(verifyRetainedExactModelPackageV1(
    resolve(dirname(fileURLToPath(import.meta.url)), "../.."),
    process.env.CIRCLEHEART_REGISTRY_BASE_REF,
  )));
}
