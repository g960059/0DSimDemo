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

if (
  process.argv[1] !== undefined
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
) {
  await main();
}

async function main(): Promise<void> {
  const commandPath = parseCommandPathV1(process.argv.slice(2));
  const command = validateStudioAuthoringCommandV1(
    JSON.parse(readFileSync(commandPath, "utf8")) as unknown,
  );
  const configuration = readAuthoringConfigurationV1(process.env);
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
  const session = await client.auth.setSession({
    access_token: configuration.accessToken,
    refresh_token: configuration.refreshToken,
  });
  if (session.error !== null || session.data.session === null) {
    throw session.error ?? new Error("Authoring session could not be restored");
  }
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
      if (
        input.surfaceReleaseId !== undefined
        && input.surfaceSeriesId === undefined
      ) {
        throw new Error("Exact Surface release requires its Surface series");
      }
      const surfacePin = input.surfaceReleaseId !== undefined
        ? {
            kind: "release" as const,
            surfaceSeriesId: input.surfaceSeriesId!,
            surfaceReleaseId: input.surfaceReleaseId,
          }
        : input.surfaceSeriesId !== undefined
          ? {
              kind: "series" as const,
              surfaceSeriesId: input.surfaceSeriesId,
            }
          : undefined;
      return (await exactModels.resolveExactModel(
        input.modelId,
        surfacePin,
      )).contract;
    },
  });
}

export type StudioAuthoringCliConfigurationV1 = Readonly<{
  url: string;
  publishableKey: string;
  accessToken: string;
  refreshToken: string;
}>;

export function readAuthoringConfigurationV1(
  environment: NodeJS.ProcessEnv,
): StudioAuthoringCliConfigurationV1 {
  const url = requiredV1(
    environment.CIRCLEHEART_SUPABASE_URL ?? environment.VITE_SUPABASE_URL,
    "CIRCLEHEART_SUPABASE_URL",
  );
  const parsedUrl = new URL(url);
  if (parsedUrl.protocol !== "https:" && !["127.0.0.1", "localhost"].includes(parsedUrl.hostname)) {
    throw new Error("Authoring Supabase URL must use HTTPS or loopback HTTP");
  }
  const publishableKey = requiredV1(
    environment.CIRCLEHEART_SUPABASE_PUBLISHABLE_KEY
      ?? environment.VITE_SUPABASE_PUBLISHABLE_KEY,
    "CIRCLEHEART_SUPABASE_PUBLISHABLE_KEY",
  );
  if (!publishableKey.startsWith("sb_publishable_")) {
    throw new Error("Authoring CLI requires an sb_publishable_ key");
  }
  return Object.freeze({
    url: parsedUrl.origin,
    publishableKey,
    accessToken: requiredV1(
      environment.CIRCLEHEART_AUTHOR_ACCESS_TOKEN,
      "CIRCLEHEART_AUTHOR_ACCESS_TOKEN",
    ),
    refreshToken: requiredV1(
      environment.CIRCLEHEART_AUTHOR_REFRESH_TOKEN,
      "CIRCLEHEART_AUTHOR_REFRESH_TOKEN",
    ),
  });
}

function parseCommandPathV1(args: readonly string[]): string {
  if (args.length !== 2 || args[0] !== "--command" || args[1] === undefined) {
    throw new Error("Usage: --command <command.json>");
  }
  return path.resolve(process.cwd(), args[1]);
}

function requiredV1(value: string | undefined, name: string): string {
  if (value === undefined || value.length === 0 || value !== value.trim()) {
    throw new Error(`${name} is required`);
  }
  return value;
}
