import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { buildStandard72ArtifactV1 } from "./BuildStandard72ArtifactV1";
import { prepareStandard72RegistryAdmissionV1, readStandard72AdmissionFilesV1,
  STANDARD72_RELEASE_FILES_V1 as paths } from "./Standard72RegistryAdmissionV1";
import { createCircleHeartExactModelReleaseV1, MAIN_WIRE_STANDARD72_DEFAULT_FIXTURE_V1 } from
  "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioStandard72ExactModelV1";

/** One72-only release gate. No old-ID fallback, uploads, stage or default writes. */
export async function verifyMainWireStandard72RegistryV1(root: string, update = false) {
  const sha = (b: Uint8Array) => createHash("sha256").update(b).digest("hex");
  const first = await buildStandard72ArtifactV1(root), second = await buildStandard72ArtifactV1(root);
  if (sha(first) !== sha(second)) throw new Error("Standard72 deterministic builds differ");
  const { manifest } = createCircleHeartExactModelReleaseV1();
  const clientJson = JSON.stringify({ schemaId: "circleheart-standard-exact-model-client-descriptor-v1",
    manifest, defaultFixture: MAIN_WIRE_STANDARD72_DEFAULT_FIXTURE_V1 }, null, 2) + "\n";
  const admitted = await prepareStandard72RegistryAdmissionV1(
    readStandard72AdmissionFilesV1(root, { artifact: first, clientJson }), manifest.modelId);
  const files = [
    [paths.artifact, admitted.artifact],
    [paths.client, new TextEncoder().encode(admitted.clientJson)],
    [paths.lock, new TextEncoder().encode(JSON.stringify(admitted.lock, null, 2) + "\n")],
  ] as const;
  // No writes until the entire scientific+checkpoint+executable guard passes.
  // --update cannot issue a new scientific approval or change the pinned proof.
  for (const [path, bytes] of files) {
    if (update) writeFileSync(resolve(root, path), bytes);
    else if (sha(readFileSync(resolve(root, path))) !== sha(bytes)) throw new Error(`Standard72 committed release differs: ${path}`);
  }
  return { modelId: manifest.modelId, artifactSha256: admitted.artifactSha256,
    artifactRevisionId: admitted.lock.artifactRevisionId, status: "admitted-local-package",
    updated: update, published: false, defaultChanged: false, clinicalNormalityClaimed: false };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args.length > 1 || args.some(a => a !== "--update")) throw new Error("Usage: [--update]");
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
  console.log(JSON.stringify(await verifyMainWireStandard72RegistryV1(root, args.includes("--update"))));
}
