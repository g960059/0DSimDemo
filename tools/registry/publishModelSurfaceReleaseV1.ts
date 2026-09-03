import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type {
  ModelSurfaceReleaseManifestV1,
  StudioReleaseStageV1,
} from "@/studio/contracts/v2/modelSurface";
import {
  assertModelSurfaceReleaseManifestV1,
  assertModelSurfaceReleaseLineageV1,
  assertStudioReleaseStageV1,
} from "@/studio/contracts/v2/modelSurface";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

await main();

async function main(): Promise<void> {
  const options = parseArgumentsV1(process.argv.slice(2));
  const manifestPath = resolveCommittedManifestPathV1(options.manifestPath);
  const manifest = parseManifestV1(readFileSync(manifestPath, "utf8"));
  const sourceCommit = execFileSync("git", ["rev-parse", "HEAD"], {
    cwd: repositoryRoot,
    encoding: "utf8",
  }).trim();
  const secret = projectServiceRoleJwtV1(options.projectRef);
  const baseUrl = `https://${options.projectRef}.supabase.co`;

  if (manifest.predecessorSurfaceReleaseId === null) {
    assertModelSurfaceReleaseLineageV1(manifest);
  } else {
    const predecessorRows = await rpcV1(
      baseUrl,
      secret,
      "get_model_surface_release_v1",
      { p_surface_release_id: manifest.predecessorSurfaceReleaseId },
    );
    if (!Array.isArray(predecessorRows) || predecessorRows.length !== 1) {
      throw new Error(
        `Predecessor Model Surface ${manifest.predecessorSurfaceReleaseId} `
          + "is unavailable",
      );
    }
    const predecessorRow = predecessorRows[0];
    if (
      predecessorRow === null
      || typeof predecessorRow !== "object"
      || Array.isArray(predecessorRow)
    ) {
      throw new Error("Predecessor Model Surface row is invalid");
    }
    const predecessor = (predecessorRow as Record<string, unknown>).manifest;
    assertModelSurfaceReleaseManifestV1(predecessor);
    assertModelSurfaceReleaseLineageV1(manifest, predecessor);
  }

  await rpcV1(baseUrl, secret, "register_model_surface_release_v1", {
    p_surface_release_id: manifest.surfaceReleaseId,
    p_surface_series_id: manifest.surfaceSeriesId,
    p_predecessor_surface_release_id: manifest.predecessorSurfaceReleaseId,
    p_model_family_id: manifest.modelFamilyId,
    p_display_name: manifest.displayName,
    p_manifest: manifest,
    p_source_commit: sourceCommit,
  });
  if (options.stage !== "dev") {
    await rpcV1(baseUrl, secret, "set_model_surface_release_stage_v1", {
      p_surface_release_id: manifest.surfaceReleaseId,
      p_stage: options.stage,
    });
  }
  process.stdout.write(
    `Published Model Surface ${manifest.surfaceReleaseId} as `
      + `${options.stage}\n`,
  );
}

type PublishOptionsV1 = Readonly<{
  projectRef: string;
  manifestPath: string;
  stage: StudioReleaseStageV1;
}>;

export function parseModelSurfacePublishArgumentsV1(
  args: readonly string[],
): PublishOptionsV1 {
  const values = new Map<string, string>();
  for (let index = 0; index < args.length; index += 2) {
    const key = args[index];
    const value = args[index + 1];
    if (
      key === undefined
      || value === undefined
      || !["--project-ref", "--manifest", "--stage"].includes(key)
      || values.has(key)
    ) {
      throw usageErrorV1();
    }
    values.set(key, value);
  }
  const projectRef = values.get("--project-ref");
  const manifestPath = values.get("--manifest");
  if (
    projectRef === undefined
    || !/^[a-z0-9]{20}$/.test(projectRef)
    || manifestPath === undefined
    || manifestPath.length === 0
  ) {
    throw usageErrorV1();
  }
  const stageValue = values.get("--stage") ?? "dev";
  assertStudioReleaseStageV1(stageValue, "--stage");
  if (stageValue === "retired") {
    throw new Error("A new Model Surface cannot be published directly as retired");
  }
  return Object.freeze({
    projectRef,
    manifestPath,
    stage: stageValue,
  });
}

function parseArgumentsV1(args: readonly string[]): PublishOptionsV1 {
  return parseModelSurfacePublishArgumentsV1(args);
}

function usageErrorV1(): Error {
  return new Error(
    "Usage: --project-ref <ref> --manifest <repo-relative.json> "
      + "[--stage dev|stable]",
  );
}

function resolveCommittedManifestPathV1(inputPath: string): string {
  const absolutePath = path.resolve(repositoryRoot, inputPath);
  const relativePath = path.relative(repositoryRoot, absolutePath);
  if (
    relativePath.length === 0
    || relativePath.startsWith("..")
    || path.isAbsolute(relativePath)
  ) {
    throw new Error("Model Surface manifest must be a file inside the repository");
  }
  execFileSync("git", ["ls-files", "--error-unmatch", "--", relativePath], {
    cwd: repositoryRoot,
    stdio: "ignore",
  });
  const status = execFileSync(
    "git",
    ["status", "--porcelain", "--", relativePath],
    { cwd: repositoryRoot, encoding: "utf8" },
  ).trim();
  if (status.length > 0) {
    throw new Error("Commit the Model Surface manifest before publishing it");
  }
  return absolutePath;
}

function parseManifestV1(raw: string): ModelSurfaceReleaseManifestV1 {
  const parsed: unknown = JSON.parse(raw);
  assertModelSurfaceReleaseManifestV1(parsed);
  return parsed;
}

function projectServiceRoleJwtV1(projectRef: string): string {
  const raw = execFileSync("supabase", [
    "projects",
    "api-keys",
    "--project-ref",
    projectRef,
    "--output",
    "json",
  ], { encoding: "utf8", maxBuffer: 2_000_000 });
  const parsed = JSON.parse(raw) as unknown;
  if (!Array.isArray(parsed)) {
    throw new Error("Supabase API key response is invalid");
  }
  for (const value of parsed) {
    if (
      value !== null
      && typeof value === "object"
      && (value as Record<string, unknown>).type === "legacy"
      && (value as Record<string, unknown>).id === "service_role"
      && typeof (value as Record<string, unknown>).api_key === "string"
    ) {
      return (value as Record<string, string>).api_key;
    }
  }
  throw new Error("Supabase service_role JWT is unavailable to the logged-in CLI");
}

async function rpcV1(
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
    throw new Error(
      `${functionName} failed (${response.status}): ${await response.text()}`,
    );
  }
  const text = await response.text();
  return text.length === 0 ? null : JSON.parse(text);
}
