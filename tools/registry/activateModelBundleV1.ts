import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  assertExactModelKernelManifestV3,
  assertModelSurfaceReleaseManifestV1,
  composeStandardModelContractV1,
} from "@/studio/contracts/v2/modelSurface";
import {
  validateRegisteredModelModuleAbiV2,
} from "@/studio/contracts/v2/release";
import {
  resolveStudioAnalysisMethodsForSurfaceV1,
} from "@/studio/analysis/StudioAnalysisMethodRegistryV1";

if (
  process.argv[1] !== undefined
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
) {
  await main();
}

async function main(): Promise<void> {
  const options = parseActiveModelBundleArgumentsV1(process.argv.slice(2));
  const secret = projectServiceRoleJwtV1(options.projectRef);
  const baseUrl = `https://${options.projectRef}.supabase.co`;
  await assertActivatableBundleV1(baseUrl, secret, options);
  const rows = await rpcV1(baseUrl, secret, "set_active_model_bundle_v1", {
    p_expected_version: options.expectedVersion,
    p_model_id: options.modelId,
    p_surface_release_id: options.surfaceReleaseId,
  });
  if (!Array.isArray(rows) || rows.length !== 1) {
    throw new Error("Active model bundle update returned an invalid result");
  }
  const row = rows[0] as Record<string, unknown>;
  process.stdout.write(
    `Activated ${String(row.model_id)} + ${String(row.surface_release_id)} `
      + `(bundle version ${String(row.version)})\n`,
  );
}

async function assertActivatableBundleV1(
  baseUrl: string,
  secret: string,
  options: ActiveModelBundleOptionsV1,
): Promise<void> {
  const model = singleRowV1(
    await rpcV1(baseUrl, secret, "get_model_release_v2", {
      p_model_id: options.modelId,
    }),
    "Exact model",
  );
  const surface = singleRowV1(
    await rpcV1(baseUrl, secret, "get_model_surface_release_v1", {
      p_surface_release_id: options.surfaceReleaseId,
    }),
    "Model Surface",
  );
  const moduleAbi = validateRegisteredModelModuleAbiV2(
    model.module_abi,
    "$.model.module_abi",
  );
  assertModelSurfaceReleaseManifestV1(surface.manifest);
  if (surface.manifest.surfaceReleaseId !== options.surfaceReleaseId) {
    throw new Error("Model Surface registry returned another release");
  }
  if (moduleAbi !== "circleheart-exact-model-esm-v1") {
    throw new Error("Active model bundle requires the Standard module ABI");
  }
  assertExactModelKernelManifestV3(model.manifest);
  if (model.manifest.modelId !== options.modelId) {
    throw new Error("Exact model registry returned another modelId");
  }
  // The registry owns immutable bytes; activation additionally proves that
  // this particular Standard kernel/Surface pair can materialize the public
  // Workbench contract before the singleton pointer moves.
  const analysisMethods = resolveStudioAnalysisMethodsForSurfaceV1(
    surface.manifest,
  );
  composeStandardModelContractV1(
    model.manifest,
    surface.manifest,
    analysisMethods.capabilities,
  );
}

function singleRowV1(value: unknown, label: string): Record<string, unknown> {
  if (
    !Array.isArray(value)
    || value.length !== 1
    || value[0] === null
    || typeof value[0] !== "object"
    || Array.isArray(value[0])
  ) {
    throw new Error(`${label} registry row is unavailable`);
  }
  return value[0] as Record<string, unknown>;
}

export type ActiveModelBundleOptionsV1 = Readonly<{
  projectRef: string;
  modelId: string;
  surfaceReleaseId: string;
  expectedVersion: number | null;
}>;

export function parseActiveModelBundleArgumentsV1(
  args: readonly string[],
): ActiveModelBundleOptionsV1 {
  if (args.length !== 8) throw usageErrorV1();
  const values = new Map<string, string>();
  for (let index = 0; index < args.length; index += 2) {
    const key = args[index];
    const value = args[index + 1];
    if (
      key === undefined
      || value === undefined
      || ![
        "--project-ref",
        "--model-id",
        "--surface-release-id",
        "--expected-version",
      ].includes(key)
      || values.has(key)
    ) {
      throw usageErrorV1();
    }
    values.set(key, value);
  }
  const projectRef = values.get("--project-ref");
  const modelId = values.get("--model-id");
  const surfaceReleaseId = values.get("--surface-release-id");
  const expectedVersionText = values.get("--expected-version");
  if (
    projectRef === undefined
    || !/^[a-z0-9]{20}$/.test(projectRef)
    || !portableIdV1(modelId)
    || !portableIdV1(surfaceReleaseId)
    || expectedVersionText === undefined
  ) {
    throw usageErrorV1();
  }
  const expectedVersion = expectedVersionText === "none"
    ? null
    : Number(expectedVersionText);
  if (
    expectedVersion !== null
    && (!Number.isSafeInteger(expectedVersion) || expectedVersion < 0)
  ) {
    throw usageErrorV1();
  }
  return Object.freeze({
    projectRef,
    modelId,
    surfaceReleaseId,
    expectedVersion,
  });
}

function portableIdV1(value: string | undefined): value is string {
  return value !== undefined
    && value.length > 0
    && value === value.trim()
    && !/\s/.test(value);
}

function usageErrorV1(): Error {
  return new Error(
    "Usage: --project-ref <ref> --model-id <id> "
      + "--surface-release-id <id> "
      + "--expected-version <none|integer>",
  );
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
