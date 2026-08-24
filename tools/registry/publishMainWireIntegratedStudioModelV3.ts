import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_DEFAULT_FIXTURE_V1,
  createCircleHeartExactModelReleaseV1,
} from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioExactModelV1";
import {
  assertStudioReleaseStageV1,
  type StudioReleaseStageV1,
} from "@/studio/contracts/v2/modelSurface";
import {
  uploadImmutableExactModelArtifactV1,
} from "./ImmutableExactModelArtifactStorageV1";
import {
  MAIN_WIRE_INTEGRATED_STUDIO_ANALYSIS_PROFILE_V2_ID,
} from "@/studio/analysis/StudioAnalysisMethodRegistryV1";

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
  const options = parsePublishArgumentsV3(process.argv.slice(2));
  assertReleaseFilesCommitted();

  const exactRelease = createCircleHeartExactModelReleaseV1();
  const artifact = readFileSync(artifactPath);
  const artifactSha256 = sha256(artifact);
  const lock = parseLock(readFileSync(lockPath, "utf8"));
  if (lock.modelId !== exactRelease.manifest.modelId) {
    throw new Error("Registry lock and exact manifest modelId differ");
  }
  if (lock.artifactSha256 !== artifactSha256) {
    throw new Error("Registry lock and exact artifact digest differ");
  }

  const secret = projectServiceRoleJwt(options.projectRef);
  const baseUrl = `https://${options.projectRef}.supabase.co`;
  const objectName = `${exactRelease.manifest.modelId}/`
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
  await rpc(baseUrl, secret, "register_model_release_v2", {
    p_model_id: exactRelease.manifest.modelId,
    p_model_family_id: exactRelease.manifest.modelFamilyId,
    p_display_name: "Main Wire V3",
    p_manifest: exactRelease.manifest,
    p_artifact_revision_id: lock.artifactRevisionId,
    p_artifact_path: artifactRegistryPath,
    p_artifact_sha256: artifactSha256,
    p_source_commit: sourceCommit,
    p_default_fixture:
      MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_DEFAULT_FIXTURE_V1,
    p_analysis_profile_id:
      MAIN_WIRE_INTEGRATED_STUDIO_ANALYSIS_PROFILE_V2_ID,
    p_expected_artifact_revision_id:
      lock.predecessorArtifactRevisionId,
    p_equivalence_report_sha256: lock.equivalenceReportSha256,
  });
  if (options.stage === "stable") {
    await rpc(baseUrl, secret, "set_model_release_stage_v1", {
      p_model_id: exactRelease.manifest.modelId,
      p_stage: options.stage,
    });
  }
  process.stdout.write(
    `Published Standard exact model ${exactRelease.manifest.modelId} to `
      + `${options.projectRef} as ${options.stage}\n`,
  );
}

type PublishOptionsV3 = Readonly<{
  projectRef: string;
  stage: Exclude<StudioReleaseStageV1, "retired">;
}>;

export function parseMainWireModelPublishArgumentsV3(
  args: readonly string[],
): PublishOptionsV3 {
  const values = new Map<string, string>();
  for (let index = 0; index < args.length; index += 2) {
    const key = args[index];
    const value = args[index + 1];
    if (
      key === undefined
      || value === undefined
      || !["--project-ref", "--stage"].includes(key)
      || values.has(key)
    ) {
      throw modelPublishUsageErrorV3();
    }
    values.set(key, value);
  }
  const projectRef = values.get("--project-ref");
  const stage = values.get("--stage");
  if (projectRef === undefined || !/^[a-z0-9]{20}$/.test(projectRef)) {
    throw modelPublishUsageErrorV3();
  }
  if (stage === undefined) throw modelPublishUsageErrorV3();
  assertStudioReleaseStageV1(stage, "--stage");
  if (stage === "retired") {
    throw new Error("A new exact model cannot be published directly as retired");
  }
  return Object.freeze({ projectRef, stage });
}

function parsePublishArgumentsV3(args: readonly string[]): PublishOptionsV3 {
  return parseMainWireModelPublishArgumentsV3(args);
}

function modelPublishUsageErrorV3(): Error {
  return new Error(
    "Usage: --project-ref <20-character Supabase project ref> "
      + "--stage <dev|stable>",
  );
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

function sha256(value: Uint8Array): string {
  return createHash("sha256").update(value).digest("hex");
}

function parseLock(raw: string): Readonly<{
  modelId: string;
  artifactRevisionId: string;
  artifactSha256: string;
  predecessorArtifactRevisionId: string | null;
  equivalenceReportSha256: string | null;
}> {
  const value = JSON.parse(raw) as Record<string, unknown>;
  if (
    value.schemaId
      !== "circleheart-standard-exact-model-registry-admission-lock-v2"
    || typeof value.modelId !== "string"
    || typeof value.artifactRevisionId !== "string"
    || !/^[0-9a-f]{64}$/.test(value.artifactRevisionId)
    || typeof value.artifactSha256 !== "string"
    || !/^[0-9a-f]{64}$/.test(value.artifactSha256)
    || (
      value.predecessorArtifactRevisionId !== null
      && (
        typeof value.predecessorArtifactRevisionId !== "string"
        || !/^[0-9a-f]{64}$/.test(value.predecessorArtifactRevisionId)
      )
    )
    || (
      value.equivalenceReportSha256 !== null
      && (
        typeof value.equivalenceReportSha256 !== "string"
        || !/^[0-9a-f]{64}$/.test(value.equivalenceReportSha256)
      )
    )
    || (
      (value.predecessorArtifactRevisionId === null)
      !== (value.equivalenceReportSha256 === null)
    )
  ) {
    throw new Error("Registry admission lock is invalid");
  }
  return Object.freeze({
    modelId: value.modelId,
    artifactRevisionId: value.artifactRevisionId,
    artifactSha256: value.artifactSha256,
    predecessorArtifactRevisionId:
      value.predecessorArtifactRevisionId as string | null,
    equivalenceReportSha256:
      value.equivalenceReportSha256 as string | null,
  });
}
