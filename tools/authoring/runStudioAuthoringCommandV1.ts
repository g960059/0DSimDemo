import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import {
  executeStudioAuthoringCommandV1,
  type StudioAuthoringModelPortV1,
  validateStudioAuthoringCommandV1,
} from "@/studio/application/authoring/StudioAuthoringCommandV1";
import {
  StudioSupabaseModelReleaseResolverV1,
  type StudioModelReleaseRpcPortV1,
} from "@/studio/infrastructure/model/StudioSupabaseModelReleaseResolverV1";
import {
  StudioSupabaseModelSurfaceResolverV1,
  type StudioModelSurfaceRpcPortV1,
} from "@/studio/infrastructure/model/StudioSupabaseModelSurfaceResolverV1";
import {
  StudioSupabaseContentRepositoryV1,
} from "@/studio/infrastructure/supabase/StudioSupabaseContentRepositoryV1";
import {
  DEFAULT_STUDIO_AUTHORING_PROFILE_V1,
  establishStudioAuthoringSessionV1,
  FileStudioAuthoringProfileStoreV1,
  MacOSKeychainAuthoringRefreshTokenStoreV1,
  requireStudioAuthoringProfileNameV1,
  resolveStudioAuthoringProjectV1,
} from "@/studio/infrastructure/auth/StudioLocalAuthoringCredentialsV1";

if (
  process.argv[1] !== undefined
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
) {
  await main();
}

async function main(): Promise<void> {
  const args = parseStudioAuthoringContentArgumentsV1(process.argv.slice(2));
  const command = validateStudioAuthoringCommandV1(
    JSON.parse(readFileSync(args.commandPath, "utf8")) as unknown,
  );
  const profiles = new FileStudioAuthoringProfileStoreV1();
  const refreshTokens = new MacOSKeychainAuthoringRefreshTokenStoreV1();
  const storedProfile = profiles.read(args.profileName);
  const configuration = resolveStudioAuthoringProjectV1({
    environment: process.env,
    storedProfile,
    allowProfileReplacement: false,
  });
  const client = createClient(
    configuration.url,
    configuration.publishableKey,
    {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
    },
  );
  await establishStudioAuthoringSessionV1({
    auth: client.auth,
    environment: process.env,
    profileName: args.profileName,
    storedProfile,
    refreshTokens,
  });
  const result = await executeStudioAuthoringCommandV1(
    new StudioSupabaseContentRepositoryV1(client, {
      fixedMutationOperationId: command.commandId,
    }),
    createAuthoringModelPortV1(client, configuration.url),
    command,
  );
  process.stdout.write(`${JSON.stringify({
    schemaId: "circleheart-studio-authoring-command-result-v1",
    commandId: command.commandId,
    action: command.action,
    result,
  }, null, 2)}\n`);
}

function createAuthoringModelPortV1(
  client: SupabaseClient,
  supabaseOrigin: string,
): StudioAuthoringModelPortV1 {
  const callRpc = async (
    functionName: string,
    parameters: Readonly<Record<string, string>>,
  ) => {
    const result = await client.rpc(functionName, parameters);
    return Object.freeze({
      data: result.data,
      error: result.error === null
        ? null
        : Object.freeze({ message: result.error.message }),
    });
  };
  const modelRpc: StudioModelReleaseRpcPortV1 = Object.freeze({
    async call(functionName: string, parameters: Readonly<Record<string, string>>) {
      return callRpc(functionName, parameters);
    },
  });
  const surfaceRpc: StudioModelSurfaceRpcPortV1 = Object.freeze({
    async call(functionName, parameters) {
      return callRpc(functionName, parameters);
    },
  });
  const exactModels = new StudioSupabaseModelReleaseResolverV1({
    rpc: modelRpc,
    supabaseOrigin,
    surfaceResolver: new StudioSupabaseModelSurfaceResolverV1({
      rpc: surfaceRpc,
    }),
  });
  return Object.freeze({
    async resolveModel(input) {
      const surfacePin = input.surfaceReleaseId !== null
        ? {
            kind: "release" as const,
            surfaceSeriesId: input.surfaceSeriesId,
            surfaceReleaseId: input.surfaceReleaseId,
          }
        : {
            kind: "series" as const,
            surfaceSeriesId: input.surfaceSeriesId,
          };
      return (await exactModels.resolveExactModel(
        input.modelId,
        surfacePin,
      )).contract;
    },
  });
}

export type StudioAuthoringContentArgumentsV1 = Readonly<{
  commandPath: string;
  profileName: string;
}>;

export function parseStudioAuthoringContentArgumentsV1(
  args: readonly string[],
): StudioAuthoringContentArgumentsV1 {
  let commandPath: string | null = null;
  let profileName: string = DEFAULT_STUDIO_AUTHORING_PROFILE_V1;
  let sawProfile = false;
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--command" && commandPath === null) {
      const candidate = args[index + 1];
      if (candidate === undefined || candidate.startsWith("--")) {
        throw contentUsageV1();
      }
      commandPath = path.resolve(process.cwd(), candidate);
      index += 1;
      continue;
    }
    if (arg === "--profile" && !sawProfile) {
      const candidate = args[index + 1];
      if (candidate === undefined) throw contentUsageV1();
      profileName = requireStudioAuthoringProfileNameV1(candidate);
      sawProfile = true;
      index += 1;
      continue;
    }
    throw contentUsageV1();
  }
  if (commandPath === null) throw contentUsageV1();
  return Object.freeze({ commandPath, profileName });
}

function contentUsageV1(): Error {
  return new Error("Usage: --command <command.json> [--profile <name>]");
}
