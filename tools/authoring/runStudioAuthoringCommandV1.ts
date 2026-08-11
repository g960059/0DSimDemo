import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import {
  describeStudioAuthoringProtocolV1,
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
  withStudioAuthoringProfileLockV1,
} from "@/studio/infrastructure/auth/StudioLocalAuthoringCredentialsV1";
import {
  createDefaultExperimentSurfaceV3,
  reconcileWorkbenchSurfaceScenariosV3,
} from "@/components/workbench/WorkbenchSurfaceV3";
import {
  LocalTrustedAuthoringRuntimeLoaderV1,
} from "./LocalTrustedAuthoringRuntimeLoaderV1";

let commandContextV1: Readonly<{
  commandId: string | null;
  action: string | null;
  phase: StudioAuthoringCliPhaseV1;
  mutation: boolean;
}> = Object.freeze({
  commandId: null,
  action: null,
  phase: "input",
  mutation: false,
});

type StudioAuthoringCliPhaseV1 =
  | "input"
  | "authentication"
  | "execution"
  | "output";

const AUTHORING_MUTATION_ACTIONS_V1 = new Set([
  "experiment.apply",
  "experiment.presentation.save",
  "snapshot.seal",
  "article.briefing.place",
  "article.blocks.patch",
  "experiment.publish",
  "article.save",
  "article.publish",
]);

if (
  process.argv[1] !== undefined
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
) {
  try {
    await main();
  } catch (error) {
    process.stdout.write(`${JSON.stringify({
      schemaId: "circleheart-studio-authoring-command-error-v1",
      ok: false,
      commandId: commandContextV1.commandId,
      action: commandContextV1.action,
      error: classifyAuthoringErrorV1(error, commandContextV1),
    })}\n`);
    process.exitCode = 1;
  }
}

async function main(): Promise<void> {
  const args = parseStudioAuthoringContentArgumentsV1(process.argv.slice(2));
  if (args.mode === "describe") {
    process.stdout.write(`${JSON.stringify(
      describeStudioAuthoringProtocolV1(),
      null,
      2,
    )}\n`);
    return;
  }
  const command = validateStudioAuthoringCommandV1(
    JSON.parse(readFileSync(args.commandPath, "utf8")) as unknown,
  );
  commandContextV1 = Object.freeze({
    commandId: command.commandId,
    action: command.action,
    phase: "authentication",
    mutation: AUTHORING_MUTATION_ACTIONS_V1.has(command.action),
  });
  const profiles = new FileStudioAuthoringProfileStoreV1();
  const refreshTokens = new MacOSKeychainAuthoringRefreshTokenStoreV1();
  const authenticated = await withStudioAuthoringProfileLockV1({
    profileName: args.profileName,
    environment: process.env,
  }, async () => {
    // Treat profile metadata and its Keychain credential as one local
    // authority record. Reading either side outside this lock lets a
    // concurrent login replace the profile between the read and a refresh,
    // which can rotate and then discard the replacement credential.
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
    return Object.freeze({ client, configuration });
  });
  const { client, configuration } = authenticated;
  commandContextV1 = Object.freeze({ ...commandContextV1, phase: "execution" });
  const result = await executeStudioAuthoringCommandV1(
    new StudioSupabaseContentRepositoryV1(client, {
      fixedMutationOperationId: command.commandId,
    }),
    createAuthoringModelPortV1(client, configuration.url),
    command,
  );
  commandContextV1 = Object.freeze({ ...commandContextV1, phase: "output" });
  process.stdout.write(`${JSON.stringify({
    schemaId: "circleheart-studio-authoring-command-result-v1",
    ok: true,
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
  const runtimes = new LocalTrustedAuthoringRuntimeLoaderV1();
  const ownNumerical = async (
    release: Awaited<ReturnType<
      StudioSupabaseModelReleaseResolverV1["resolveActiveBundle"]
    >>,
  ) => Object.freeze({
    contract: release.contract,
    defaultFixture: release.defaultFixture,
    runtime: await runtimes.load(release.ticket),
    surfaceReleaseId: release.surfaceReleaseId,
    surfaceSeriesId: release.surfaceSeriesId,
  });
  return Object.freeze({
    async resolveModel(input) {
      return (await exactModels.resolveExactModel(
        input.modelId,
        {
          kind: "release" as const,
          surfaceSeriesId: input.surfaceSeriesId,
          surfaceReleaseId: input.surfaceReleaseId,
        },
      )).contract;
    },
    async resolveActiveNumericalModel() {
      return ownNumerical(await exactModels.resolveActiveBundle());
    },
    async resolveLatestNumericalModel(input) {
      return ownNumerical(await exactModels.resolveExactModel(
        input.modelId,
        {
          kind: "series" as const,
          surfaceSeriesId: input.surfaceSeriesId,
        },
      ));
    },
    async resolveExactNumericalModel(input) {
      return ownNumerical(await exactModels.resolveExactModel(
        input.modelId,
        {
          kind: "release" as const,
          surfaceSeriesId: input.surfaceSeriesId,
          surfaceReleaseId: input.surfaceReleaseId,
        },
      ));
    },
    prepareSurface(input) {
      if (input.presentation.mode === "preserve" && input.currentSurface === null) {
        throw new Error("A new Experiment cannot preserve a missing Surface");
      }
      const initial = input.presentation.mode === "preserve"
        ? input.currentSurface!
        : createDefaultExperimentSurfaceV3(
            input.contract,
            input.scenarioIds[0],
          );
      const reconciled = reconcileWorkbenchSurfaceScenariosV3(
        initial,
        input.scenarioIds.map((scenarioId) => Object.freeze({ scenarioId })),
      );
      return Object.freeze({
        ...reconciled,
        note: Object.freeze({ text: input.presentation.note }),
      });
    },
  });
}

export function classifyAuthoringErrorV1(
  error: unknown,
  context: Readonly<{
    phase: StudioAuthoringCliPhaseV1;
    mutation: boolean;
  }> = Object.freeze({ phase: "execution", mutation: true }),
): Readonly<{
  code: string;
  category:
    | "validation"
    | "conflict"
    | "authentication"
    | "authorization"
    | "not-found"
    | "quota"
    | "numerical"
    | "transport"
    | "internal";
  retryable: boolean;
  commitState: "none" | "unknown" | "confirmed";
  recovery:
    | "fix-command"
    | "mint-new-command-id"
    | "refresh-authority-state"
    | "login"
    | "request-access"
    | "refresh-headless-token"
    | "reduce-work-or-wait"
    | "retry-same-command"
    | "inspect-operation-then-retry-same-command"
    | "read-authority-state"
    | "report-bug";
  message: string;
}> {
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();
  const sqlState = authoringSqlStateV1(error);
  if (
    authoringConfirmedCommitV1(error)
    || (context.phase === "output" && context.mutation)
  ) {
    return Object.freeze({
      code: "AUTHORING_COMMIT_CONFIRMED_RESPONSE_INVALID",
      category: "internal",
      retryable: false,
      commitState: "confirmed",
      recovery: "read-authority-state",
      message,
    });
  }
  if (/operation_id was already used for a different request|unbound content operation/.test(lower)) {
    return Object.freeze({
      code: "AUTHORING_OPERATION_ID_CONFLICT",
      category: "conflict",
      retryable: false,
      commitState: "unknown",
      recovery: "read-authority-state",
      message,
    });
  }
  if (/already bound|different authoring command/.test(lower)) {
    return Object.freeze({
      code: "AUTHORING_COMMAND_ID_CONFLICT",
      category: "conflict",
      retryable: false,
      commitState: "none",
      recovery: "mint-new-command-id",
      message,
    });
  }
  if (sqlState === "23505") {
    return Object.freeze({
      code: "AUTHORING_UNIQUE_VALUE_CONFLICT",
      category: "conflict",
      retryable: false,
      commitState: "none",
      recovery: "fix-command",
      message,
    });
  }
  if (sqlState === "23514") {
    return Object.freeze({
      code: "AUTHORING_CONSTRAINT_VALIDATION_FAILED",
      category: "validation",
      retryable: false,
      commitState: "none",
      recovery: "fix-command",
      message,
    });
  }
  if (sqlState === "40001" || /version conflict/.test(lower)) {
    return Object.freeze({
      code: "AUTHORING_VERSION_CONFLICT",
      category: "conflict",
      retryable: false,
      commitState: "none",
      recovery: "refresh-authority-state",
      message,
    });
  }
  if (sqlState === "28000") {
    return Object.freeze({
      code: "AUTHORING_AUTHENTICATION_REQUIRED",
      category: "authentication",
      retryable: false,
      commitState: "none",
      recovery: "login",
      message,
    });
  }
  if (sqlState === "42501") {
    return Object.freeze({
      code: "AUTHORING_AUTHORIZATION_DENIED",
      category: "authorization",
      retryable: false,
      commitState: "none",
      recovery: "request-access",
      message,
    });
  }
  if (sqlState === "P0002") {
    return Object.freeze({
      code: "AUTHORING_RESOURCE_NOT_FOUND",
      category: "not-found",
      retryable: false,
      commitState: "none",
      recovery: "refresh-authority-state",
      message,
    });
  }
  if (/\b(?:experiment|snapshot|article(?: snapshot)?)\b.*\bis unavailable\b/.test(lower)) {
    return Object.freeze({
      code: "AUTHORING_RESOURCE_NOT_FOUND",
      category: "not-found",
      retryable: false,
      commitState: "none",
      recovery: "refresh-authority-state",
      message,
    });
  }
  if (sqlState === "54000" || (sqlState !== null && /^53/.test(sqlState))) {
    return Object.freeze({
      code: "AUTHORING_QUOTA_EXCEEDED",
      category: "quota",
      retryable: true,
      commitState: "none",
      recovery: "reduce-work-or-wait",
      message,
    });
  }
  if (/authoring profile .* is busy in another process/.test(lower)) {
    return Object.freeze({
      code: "AUTHORING_PROFILE_BUSY",
      category: "conflict",
      retryable: true,
      commitState: "none",
      recovery: "retry-same-command",
      message,
    });
  }
  if (sqlState !== null && /^22/.test(sqlState)) {
    return Object.freeze({
      code: "AUTHORING_VALIDATION_FAILED",
      category: "validation",
      retryable: false,
      commitState: "none",
      recovery: "fix-command",
      message,
    });
  }
  if (
    /authoring numerical execution exceeded|maxpresentationsteps|wallclocktimeoutms|execution budget/.test(lower)
  ) {
    return Object.freeze({
      code: "AUTHORING_NUMERICAL_BUDGET_EXCEEDED",
      category: "numerical",
      retryable: false,
      commitState: "none",
      recovery: "reduce-work-or-wait",
      message,
    });
  }
  if (
    sqlState === "55000"
    || /operation is already running|authoring operation is already running/.test(lower)
  ) {
    return Object.freeze({
      code: "AUTHORING_OPERATION_UNCERTAIN",
      category: "transport",
      retryable: true,
      commitState: "unknown",
      recovery: "inspect-operation-then-retry-same-command",
      message,
    });
  }
  if (
    (sqlState !== null && (/^08/.test(sqlState) || sqlState === "57014"))
    || /failed to fetch|network|econn|enotfound|socket|connection reset|connection refused|fetch failed|response timeout/.test(lower)
  ) {
    const mutationMayHaveReachedAuthority = context.mutation
      && context.phase === "execution";
    return Object.freeze({
      code: mutationMayHaveReachedAuthority
        ? "AUTHORING_OPERATION_UNCERTAIN"
        : "AUTHORING_TRANSPORT_UNAVAILABLE",
      category: "transport",
      retryable: true,
      commitState: mutationMayHaveReachedAuthority ? "unknown" : "none",
      recovery: mutationMayHaveReachedAuthority
        ? "inspect-operation-then-retry-same-command"
        : "retry-same-command",
      message,
    });
  }
  if (/headless authoring.*access token|headless token pair/.test(lower)) {
    return Object.freeze({
      code: "AUTHORING_HEADLESS_TOKEN_REFRESH_REQUIRED",
      category: "authentication",
      retryable: false,
      commitState: "none",
      recovery: "refresh-headless-token",
      message,
    });
  }
  if (
    /authentication|required sign-in|signed out|\bsession\b|credential|keychain|unauthorized|forbidden/.test(lower)
  ) {
    return Object.freeze({
      code: "AUTHORING_AUTHENTICATION_REQUIRED",
      category: "authentication",
      retryable: false,
      commitState: "none",
      recovery: "login",
      message,
    });
  }
  if (/numerical|checkpoint|capture|snapshot|simulation|model/.test(lower)) {
    return Object.freeze({
      code: "AUTHORING_NUMERICAL_REJECTED",
      category: "numerical",
      retryable: false,
      commitState: "none",
      recovery: "fix-command",
      message,
    });
  }
  if (/must|required|unsupported|unexpected|invalid|unavailable/.test(lower)) {
    return Object.freeze({
      code: "AUTHORING_VALIDATION_FAILED",
      category: "validation",
      retryable: false,
      commitState: "none",
      recovery: "fix-command",
      message,
    });
  }
  const commitState = context.mutation && context.phase === "execution"
    ? "unknown" as const
    : "none" as const;
  return Object.freeze({
    code: "AUTHORING_INTERNAL_ERROR",
    category: "internal",
    retryable: false,
    commitState,
    recovery: commitState === "unknown"
      ? "inspect-operation-then-retry-same-command"
      : "report-bug",
    message,
  });
}

function authoringConfirmedCommitV1(error: unknown): boolean {
  return error !== null
    && typeof error === "object"
    && "authoringCommitState" in error
    && (error as { authoringCommitState?: unknown }).authoringCommitState
      === "confirmed";
}

function authoringSqlStateV1(error: unknown): string | null {
  if (error === null || typeof error !== "object" || !("code" in error)) {
    return null;
  }
  const code = (error as { code?: unknown }).code;
  return typeof code === "string" && /^[0-9A-Z]{5}$/.test(code)
    ? code
    : null;
}

export type StudioAuthoringContentArgumentsV1 =
  | Readonly<{ mode: "describe" }>
  | Readonly<{
      mode: "execute";
      commandPath: string;
      profileName: string;
    }>;

export function parseStudioAuthoringContentArgumentsV1(
  args: readonly string[],
): StudioAuthoringContentArgumentsV1 {
  let commandPath: string | null = null;
  let profileName: string = DEFAULT_STUDIO_AUTHORING_PROFILE_V1;
  let sawProfile = false;
  let describe = false;
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--describe" && !describe && commandPath === null) {
      describe = true;
      continue;
    }
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
  if (describe) {
    if (commandPath !== null || sawProfile) throw contentUsageV1();
    return Object.freeze({ mode: "describe" as const });
  }
  if (commandPath === null) throw contentUsageV1();
  return Object.freeze({
    mode: "execute" as const,
    commandPath,
    profileName,
  });
}

function contentUsageV1(): Error {
  return new Error(
    "Usage: --describe | --command <command.json> [--profile <name>]",
  );
}
