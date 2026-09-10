import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import clientDescriptor from
  "@/data/model-releases/CurrentModelReleaseV1";
import surface from
  "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioStaticCaseSurfaceV1";
import { prepareCurrentModelPublicationV1, CURRENT_MODEL_PUBLICATION_FILES_V1 } from "./CurrentModelRegistryAdmissionV1";
import {
  assertStudioReleaseStageV1,
  type StudioReleaseStageV1,
} from "@/studio/contracts/v2/modelSurface";
import {
  uploadImmutableExactModelArtifactV1,
} from "./ImmutableExactModelArtifactStorageV1";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const artifactPath = path.join(
  repositoryRoot,
  CURRENT_MODEL_PUBLICATION_FILES_V1.artifact,
);
const lockPath = path.join(
  repositoryRoot,
  CURRENT_MODEL_PUBLICATION_FILES_V1.lock,
);

if (
  process.argv[1] !== undefined
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
) {
  await main();
}

async function main(): Promise<void> {
  const options = parsePublishArgumentsV3(process.argv.slice(2));
  assertReleaseFilesCommitted();

  const { artifact, manifest, defaultFixture, lock, artifactSha256 } =
    await prepareMainWireModelPublicationV1({
      artifact: readFileSync(artifactPath),
      lockJson: readFileSync(lockPath, "utf8"),
      expectedModelId: options.modelId,
    });
  if (options.dryRun) {
    process.stdout.write(JSON.stringify({
      modelId: manifest.modelId,
      artifactRevisionId: lock.artifactRevisionId,
      artifactSha256,
      surfaceReleaseId: surface.surfaceReleaseId,
      stage: options.stage,
      writesPerformed: false,
    }) + "\n");
    return;
  }

  const secret = projectServiceRoleJwt(options.projectRef);
  const baseUrl = `https://${options.projectRef}.supabase.co`;
  const objectName = `${manifest.modelId}/`
    + `${lock.artifactRevisionId}/main-wire-integrated-standard-v1.mjs`;
  const artifactRegistryPath = `model-releases/${objectName}`;
  await uploadImmutableExactModelArtifactV1({
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
  await rpc(baseUrl, secret, "register_model_release_v3", {
    p_model_id: manifest.modelId,
    p_model_family_id: manifest.modelFamilyId,
    p_display_name: surface.displayName,
    p_manifest: manifest,
    p_artifact_revision_id: lock.artifactRevisionId,
    p_artifact_path: artifactRegistryPath,
    p_artifact_sha256: artifactSha256,
    p_source_commit: sourceCommit,
    p_default_fixture: defaultFixture,
    p_expected_artifact_revision_id:
      lock.predecessorArtifactRevisionId,
    p_equivalence_report_sha256: lock.equivalenceReportSha256,
  });
  if (options.stage === "stable") {
    await rpc(baseUrl, secret, "set_model_release_stage_v1", {
      p_model_id: manifest.modelId,
      p_stage: options.stage,
    });
  }
  process.stdout.write(
    `Published Standard exact model ${manifest.modelId} to `
      + `${options.projectRef} as ${options.stage}\n`,
  );
}

type PublishOptionsV3 = Readonly<{
  projectRef: string;
  modelId: string;
  dryRun: boolean;
  stage: Exclude<StudioReleaseStageV1, "retired">;
}>;

export function parseMainWireModelPublishArgumentsV3(
  args: readonly string[],
): PublishOptionsV3 {
  const values = new Map<string, string>();
  let dryRun = false;
  for (let index = 0; index < args.length;) {
    const key = args[index];
    if (key === "--dry-run" && !dryRun) {
      dryRun = true;
      index += 1;
      continue;
    }
    const value = args[index + 1];
    if (
      key === undefined
      || value === undefined
      || !["--project-ref", "--stage", "--model-id"].includes(key)
      || values.has(key)
    ) {
      throw modelPublishUsageErrorV3();
    }
    values.set(key, value);
    index += 2;
  }
  const projectRef = values.get("--project-ref");
  const stage = values.get("--stage");
  const modelId = values.get("--model-id");
  if (modelId !== clientDescriptor.manifest.modelId) {
    throw new Error("Publish requires the explicit current --model-id");
  }
  if (projectRef === undefined || !/^[a-z0-9]{20}$/.test(projectRef)) {
    throw modelPublishUsageErrorV3();
  }
  if (stage === undefined) throw modelPublishUsageErrorV3();
  assertStudioReleaseStageV1(stage, "--stage");
  if (stage === "retired") {
    throw new Error("A new exact model cannot be published directly as retired");
  }
  return Object.freeze({ projectRef, modelId, stage, dryRun });
}

function parsePublishArgumentsV3(args: readonly string[]): PublishOptionsV3 {
  return parseMainWireModelPublishArgumentsV3(args);
}

function modelPublishUsageErrorV3(): Error {
  return new Error(
    "Usage: --project-ref <20-character Supabase project ref> "
      + "--model-id <current-exact-model-id> --stage <dev|stable> [--dry-run]",
  );
}

/** Validate the complete local identity binding before obtaining credentials. */
export async function prepareMainWireModelPublicationV1(input: Readonly<{
  artifact: Uint8Array;
  lockJson: string;
  expectedModelId: string;
}>) {
  return prepareCurrentModelPublicationV1(repositoryRoot, input);
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
