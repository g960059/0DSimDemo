import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_DEFAULT_FIXTURE_V1,
  createCircleHeartExactModelReleaseV1,
} from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioExactModelV1";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const artifactPath = path.join(
  repositoryRoot,
  "studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioExactModelV1.artifact.mjs",
);
const lockPath = path.join(
  repositoryRoot,
  "studio/integrations/mainWireIntegratedV3/standard-registry-admission-lock.json",
);

await main();

async function main(): Promise<void> {
  const projectRef = projectRefArgument(process.argv.slice(2));
  assertReleaseFilesCommitted();

  const exactRelease = createCircleHeartExactModelReleaseV1();
  const artifact = readFileSync(artifactPath);
  const artifactSha256 = sha256(artifact);
  const lock = parseLock(readFileSync(lockPath, "utf8"));
  if (lock.modelId !== exactRelease.manifest.modelId) {
    throw new Error("Registry lock and exact manifest modelId differ");
  }

  const secret = projectServiceRoleJwt(projectRef);
  const baseUrl = `https://${projectRef}.supabase.co`;
  const objectName = `${exactRelease.manifest.modelId}/main-wire-integrated-standard-v1.mjs`;
  const artifactRegistryPath = `model-releases/${objectName}`;
  await uploadImmutableArtifact({
    artifact,
    artifactSha256,
    baseUrl,
    objectName,
    secret,
  });

  const sourceCommit = execFileSync("git", ["rev-parse", "HEAD"], {
    cwd: repositoryRoot,
    encoding: "utf8",
  }).trim();
  await rpc(baseUrl, secret, "register_model_release_v2", {
    p_model_id: exactRelease.manifest.modelId,
    p_model_family_id: exactRelease.manifest.modelFamilyId,
    p_display_name: "Main Wire V3",
    p_manifest: exactRelease.manifest,
    p_artifact_path: artifactRegistryPath,
    p_artifact_sha256: artifactSha256,
    p_registry_fingerprint: lock.packageSha256,
    p_source_commit: sourceCommit,
    p_module_abi: "circleheart-exact-model-esm-v1",
    p_default_fixture:
      MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_DEFAULT_FIXTURE_V1,
    p_analysis_profile_id: "standard-no-model-analysis-v1",
  });
  // Registration is always dev. This specialized command publishes the
  // already-admitted production default, so lifecycle promotion is explicit
  // and precedes the channel move. Generic research releases use their own
  // registry command and must not acquire stable status accidentally.
  await rpc(baseUrl, secret, "set_model_release_stage_v1", {
    p_model_id: exactRelease.manifest.modelId,
    p_stage: "stable",
  });
  await rpc(baseUrl, secret, "set_model_release_channel_v1", {
    p_channel: "default",
    p_model_id: exactRelease.manifest.modelId,
  });
  process.stdout.write(
    `Published Standard exact model ${exactRelease.manifest.modelId} to ${projectRef}\n`,
  );
}

function projectRefArgument(args: readonly string[]): string {
  if (
    args.length !== 2
    || args[0] !== "--project-ref"
    || !/^[a-z0-9]{20}$/.test(args[1] ?? "")
  ) {
    throw new Error("Usage: --project-ref <20-character Supabase project ref>");
  }
  return args[1]!;
}

function assertReleaseFilesCommitted(): void {
  const status = execFileSync("git", ["status", "--porcelain"], {
    cwd: repositoryRoot,
    encoding: "utf8",
  }).trim();
  if (status.length > 0) {
    throw new Error(
      "Commit the complete Standard release worktree before publishing",
    );
  }
}

function projectServiceRoleJwt(projectRef: string): string {
  const raw = execFileSync("supabase", [
    "projects",
    "api-keys",
    "--project-ref",
    projectRef,
    "--output",
    "json",
  ], { encoding: "utf8", maxBuffer: 2_000_000 });
  const parsed = JSON.parse(raw) as unknown;
  if (!Array.isArray(parsed)) throw new Error("Supabase API key response is invalid");
  for (const value of parsed) {
    if (
      value !== null
      && typeof value === "object"
      // Supabase Storage's Authorization header still expects a compact JWT.
      // The newer sb_secret key is valid as an apikey, but is not itself a
      // bearer JWT. Select the legacy service_role JWT explicitly and keep it
      // in memory only.
      && (value as Record<string, unknown>).type === "legacy"
      && (value as Record<string, unknown>).id === "service_role"
      && typeof (value as Record<string, unknown>).api_key === "string"
    ) {
      return (value as Record<string, string>).api_key;
    }
  }
  throw new Error(
    "Supabase service_role JWT is unavailable to the logged-in CLI",
  );
}

async function uploadImmutableArtifact(input: Readonly<{
  artifact: Uint8Array;
  artifactSha256: string;
  baseUrl: string;
  objectName: string;
  secret: string;
}>): Promise<void> {
  const publicUrl = `${input.baseUrl}/storage/v1/object/public/model-releases/${encodeObjectPath(input.objectName)}`;
  const existing = await fetch(publicUrl, { cache: "no-store" });
  if (existing.ok) {
    const bytes = new Uint8Array(await existing.arrayBuffer());
    if (sha256(bytes) !== input.artifactSha256) {
      throw new Error("Remote exact model path already contains different bytes");
    }
    return;
  }
  if (existing.status !== 400 && existing.status !== 404) {
    throw new Error(`Could not inspect remote model artifact (${existing.status})`);
  }

  const upload = await fetch(
    `${input.baseUrl}/storage/v1/object/model-releases/${encodeObjectPath(input.objectName)}`,
    {
      method: "POST",
      headers: {
        apikey: input.secret,
        authorization: `Bearer ${input.secret}`,
        "content-type": "text/javascript",
        "x-upsert": "false",
      },
      body: new Blob([input.artifact], { type: "text/javascript" }),
    },
  );
  if (!upload.ok) {
    throw new Error(`Exact model upload failed (${upload.status}): ${await upload.text()}`);
  }
}

async function rpc(
  baseUrl: string,
  secret: string,
  functionName: string,
  body: Record<string, unknown>,
): Promise<unknown> {
  const response = await fetch(`${baseUrl}/rest/v1/rpc/${functionName}`, {
    method: "POST",
    headers: {
      apikey: secret,
      authorization: `Bearer ${secret}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`${functionName} failed (${response.status}): ${await response.text()}`);
  }
  const text = await response.text();
  return text.length === 0 ? null : JSON.parse(text);
}

function encodeObjectPath(value: string): string {
  return value.split("/").map(encodeURIComponent).join("/");
}

function sha256(value: Uint8Array): string {
  return createHash("sha256").update(value).digest("hex");
}

function parseLock(raw: string): Readonly<{
  modelId: string;
  packageSha256: string;
}> {
  const value = JSON.parse(raw) as Record<string, unknown>;
  if (
    typeof value.modelId !== "string"
    || typeof value.packageSha256 !== "string"
    || !/^[0-9a-f]{64}$/.test(value.packageSha256)
  ) {
    throw new Error("Registry admission lock is invalid");
  }
  return Object.freeze({
    modelId: value.modelId,
    packageSha256: value.packageSha256,
  });
}
