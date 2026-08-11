import path from "node:path";
import { fileURLToPath } from "node:url";

import { createClient } from "@supabase/supabase-js";

import {
  createStudioAuthoringProfileV1,
  DEFAULT_STUDIO_AUTHORING_PROFILE_V1,
  establishStudioAuthoringSessionV1,
  FileStudioAuthoringProfileStoreV1,
  MacOSKeychainAuthoringRefreshTokenStoreV1,
  readStudioAuthoringHeadlessSessionV1,
  requireStudioAuthoringProfileNameV1,
  resolveStudioAuthoringProjectV1,
  revokeAndRemoveStudioAuthoringSessionV1,
  withStudioAuthoringProfileLockV1,
  type StudioAuthoringProfileStoreV1,
  type StudioAuthoringProfileV1,
} from "@/studio/infrastructure/auth/StudioLocalAuthoringCredentialsV1";
import {
  openStudioAuthoringBrowserV1,
  startStudioAuthoringLoopbackV1,
} from "@/tools/authoring/StudioAuthoringLoopbackOAuthV1";

export type StudioAuthoringAuthActionV1 = "login" | "logout" | "status";

export type StudioAuthoringAuthArgumentsV1 = Readonly<{
  action: StudioAuthoringAuthActionV1;
  profileName: string;
  openBrowser: boolean;
}>;

let authCommandContextV1: Readonly<{
  action: StudioAuthoringAuthActionV1 | null;
  profileName: string | null;
}> = Object.freeze({ action: null, profileName: null });

if (
  process.argv[1] !== undefined
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
) {
  try {
    await main();
  } catch (error) {
    process.stdout.write(`${JSON.stringify({
      schemaId: "circleheart-studio-authoring-auth-error-v1",
      ok: false,
      action: authCommandContextV1.action,
      profileName: authCommandContextV1.profileName,
      error: classifyStudioAuthoringAuthErrorV1(error),
    })}\n`);
    process.exitCode = 1;
  }
}

async function main(): Promise<void> {
  const args = parseStudioAuthoringAuthArgumentsV1(process.argv.slice(2));
  authCommandContextV1 = Object.freeze({
    action: args.action,
    profileName: args.profileName,
  });
  assertStudioAuthoringAuthActionEnvironmentV1(
    args,
    process.env,
    process.platform,
  );
  const profiles = new FileStudioAuthoringProfileStoreV1();
  const refreshTokens = new MacOSKeychainAuthoringRefreshTokenStoreV1();

  if (args.action === "logout") {
    const revoked = await withStudioAuthoringProfileLockV1({
      profileName: args.profileName,
      environment: process.env,
    }, async () => {
      const storedProfile = readStudioAuthoringProfileForAuthActionV1({
        action: args.action,
        profileName: args.profileName,
        profiles,
      });
      if (storedProfile === null) {
        // Corrupt or absent non-secret metadata must not trap the Keychain
        // credential. Keep this deletion inside the same profile lock as
        // refresh-token rotation so logout cannot race a credential write.
        refreshTokens.delete(args.profileName);
        return Object.freeze({ remoteRevoked: false });
      }
      const project = resolveStudioAuthoringProjectV1({
        environment: {},
        storedProfile,
        allowProfileReplacement: false,
      });
      const client = createAuthoringAuthClientV1(project);
      return revokeAndRemoveStudioAuthoringSessionV1({
        auth: client.auth,
        profileName: args.profileName,
        storedProfile,
        refreshTokens,
      });
    });
    writeSafeResultV1({
      action: args.action,
      profileName: args.profileName,
      signedIn: false,
      remoteRevoked: revoked.remoteRevoked,
    });
    return;
  }

  if (args.action === "status") {
    const status = await withStudioAuthoringProfileLockV1({
      profileName: args.profileName,
      environment: process.env,
    }, async () => {
      // Status may refresh a stored credential. Keep profile read, Keychain
      // read/rotation, project resolution and session establishment inside one
      // lock so a concurrent login cannot splice two different identities.
      const storedProfile = readStudioAuthoringProfileForAuthActionV1({
        action: args.action,
        profileName: args.profileName,
        profiles,
      });
      const headlessSession = readStudioAuthoringHeadlessSessionV1(process.env);
      const signedOutReason = classifyStudioAuthoringSignedOutReasonV1({
        hasHeadlessSession: headlessSession !== null,
        hasProfile: storedProfile !== null,
        hasRefreshToken: headlessSession !== null
          || (
            storedProfile !== null
            && refreshTokens.read(args.profileName) !== null
          ),
      });
      if (signedOutReason !== null) {
        return Object.freeze({
          action: args.action,
          profileName: args.profileName,
          signedIn: false as const,
          reason: signedOutReason,
        });
      }
      const project = resolveStudioAuthoringProjectV1({
        environment: process.env,
        storedProfile,
        allowProfileReplacement: false,
      });
      const client = createAuthoringAuthClientV1(project);
      const established = await establishStudioAuthoringSessionV1({
        auth: client.auth,
        environment: process.env,
        profileName: args.profileName,
        storedProfile,
        refreshTokens,
      });
      return Object.freeze({
        action: args.action,
        profileName: args.profileName,
        signedIn: true as const,
        source: established.source,
        userId: established.session.user.id,
        email: established.session.user.email ?? null,
        supabaseUrl: project.url,
        expiresAt: established.session.expires_at ?? null,
      });
    });
    writeSafeResultV1(status);
    return;
  }

  const storedProfile = readStudioAuthoringProfileForAuthActionV1({
    action: args.action,
    profileName: args.profileName,
    profiles,
  });
  const project = resolveStudioAuthoringProjectV1({
    environment: process.env,
    storedProfile,
    allowProfileReplacement: true,
  });
  const client = createAuthoringAuthClientV1(project);

  const callback = await startStudioAuthoringLoopbackV1();
  try {
    const oauth = await client.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callback.redirectUrl,
        skipBrowserRedirect: true,
      },
    });
    if (oauth.error !== null || oauth.data.url === null) {
      throw oauth.error ?? new Error("Google sign-in URL was not returned");
    }
    process.stderr.write(
      `Open this URL to sign in:\n${oauth.data.url}\n\nWaiting for ${callback.redirectUrl}\n`,
    );
    if (args.openBrowser) openStudioAuthoringBrowserV1(oauth.data.url);
    const code = await callback.waitForCode();
    const exchange = await client.auth.exchangeCodeForSession(
      code,
      oauth.data.flowId === null ? undefined : { flowId: oauth.data.flowId },
    );
    if (exchange.error !== null || exchange.data.session === null) {
      throw exchange.error ?? new Error("Google sign-in session was not returned");
    }
    const profile = createStudioAuthoringProfileV1({
      profileName: args.profileName,
      project,
      session: exchange.data.session,
    });
    try {
      // Profile metadata is non-secret. Writing it before the Keychain secret
      // makes an interrupted login fail safely as a signed-out profile.
      await withStudioAuthoringProfileLockV1({
        profileName: args.profileName,
        environment: process.env,
      }, async () => {
        const currentProfile = readStudioAuthoringProfileForAuthActionV1({
          action: args.action,
          profileName: args.profileName,
          profiles,
        });
        if (!sameStudioAuthoringProfileGenerationV1(
          storedProfile,
          currentProfile,
        )) {
          throw new Error(
            `Authoring profile '${args.profileName}' changed while Google sign-in was in progress`,
          );
        }
        profiles.write(profile);
        refreshTokens.write(args.profileName, exchange.data.session.refresh_token);
      });
    } catch (error) {
      // Do not leave a live CLI session behind when local persistence fails.
      await client.auth.signOut({ scope: "local" });
      throw error;
    }
    writeSafeResultV1({
      action: args.action,
      profileName: args.profileName,
      signedIn: true,
      userId: profile.userId,
      email: profile.email,
      supabaseUrl: profile.supabaseUrl,
    });
  } finally {
    await callback.close();
  }
}

function sameStudioAuthoringProfileGenerationV1(
  left: StudioAuthoringProfileV1 | null,
  right: StudioAuthoringProfileV1 | null,
): boolean {
  if (left === null || right === null) return left === right;
  return left.schemaId === right.schemaId
    && left.profileName === right.profileName
    && left.supabaseUrl === right.supabaseUrl
    && left.publishableKey === right.publishableKey
    && left.userId === right.userId
    && left.email === right.email
    && left.updatedAt === right.updatedAt;
}

export function readStudioAuthoringProfileForAuthActionV1(input: Readonly<{
  action: StudioAuthoringAuthActionV1;
  profileName: string;
  profiles: StudioAuthoringProfileStoreV1;
}>): StudioAuthoringProfileV1 | null {
  try {
    return input.profiles.read(input.profileName);
  } catch (error) {
    if (input.action !== "logout") throw error;
    // The caller performs credential deletion while holding the profile lock.
    return null;
  }
}

export type StudioAuthoringSignedOutReasonV1 =
  | "profile-not-found"
  | "credential-not-found";

export function classifyStudioAuthoringSignedOutReasonV1(input: Readonly<{
  hasHeadlessSession: boolean;
  hasProfile: boolean;
  hasRefreshToken: boolean;
}>): StudioAuthoringSignedOutReasonV1 | null {
  if (input.hasHeadlessSession) return null;
  if (!input.hasProfile) return "profile-not-found";
  return input.hasRefreshToken ? null : "credential-not-found";
}

export function assertStudioAuthoringAuthActionEnvironmentV1(
  args: StudioAuthoringAuthArgumentsV1,
  environment: NodeJS.ProcessEnv,
  platform: NodeJS.Platform,
): void {
  if (args.action === "login" && platform !== "darwin") {
    throw new Error(
      "Interactive authoring login currently requires macOS Keychain; use the explicit headless token override on this platform",
    );
  }
  if (
    args.action === "login"
    && readStudioAuthoringHeadlessSessionV1(environment) !== null
  ) {
    throw new Error(
      "author:login cannot replace a persisted profile while the CIRCLEHEART_AUTHOR_* headless token override is active; remove those variables first",
    );
  }
  if (
    args.action === "logout"
    && readStudioAuthoringHeadlessSessionV1(environment) !== null
  ) {
    throw new Error(
      "author:logout cannot revoke a non-persisted headless token pair; remove the CIRCLEHEART_AUTHOR_* token variables instead",
    );
  }
}

function createAuthoringAuthClientV1(
  project: Readonly<{ url: string; publishableKey: string }>,
) {
  return createClient(project.url, project.publishableKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      flowType: "pkce",
      persistSession: false,
    },
  });
}

export function parseStudioAuthoringAuthArgumentsV1(
  args: readonly string[],
): StudioAuthoringAuthArgumentsV1 {
  const action = args[0];
  if (action !== "login" && action !== "status" && action !== "logout") {
    throw usageV1();
  }
  let profileName: string = DEFAULT_STUDIO_AUTHORING_PROFILE_V1;
  let openBrowser = true;
  let sawProfile = false;
  for (let index = 1; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--profile" && !sawProfile) {
      const candidate = args[index + 1];
      if (candidate === undefined) throw usageV1();
      profileName = requireStudioAuthoringProfileNameV1(candidate);
      sawProfile = true;
      index += 1;
      continue;
    }
    if (arg === "--no-open" && action === "login" && openBrowser) {
      openBrowser = false;
      continue;
    }
    throw usageV1();
  }
  return Object.freeze({ action, profileName, openBrowser });
}

function usageV1(): Error {
  return new Error(
    "Usage: <login|status|logout> [--profile <name>] [--no-open (login only)]",
  );
}

export function classifyStudioAuthoringAuthErrorV1(error: unknown): Readonly<{
  code: string;
  category:
    | "validation"
    | "configuration"
    | "platform"
    | "authentication"
    | "conflict"
    | "transport"
    | "internal";
  retryable: boolean;
  recovery:
    | "fix-arguments"
    | "configure-project"
    | "remove-headless-override"
    | "use-headless-token-pair"
    | "login-again"
    | "retry-same-auth-action"
    | "report-bug";
  message: string;
}> {
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();
  if (/^usage:/.test(lower)) {
    return Object.freeze({
      code: "AUTHORING_AUTH_ARGUMENTS_INVALID",
      category: "validation",
      retryable: false,
      recovery: "fix-arguments",
      message,
    });
  }
  if (/requires macos keychain/.test(lower)) {
    return Object.freeze({
      code: "AUTHORING_AUTH_PLATFORM_UNSUPPORTED",
      category: "platform",
      retryable: false,
      recovery: "use-headless-token-pair",
      message,
    });
  }
  if (/headless token override is active|cannot revoke a non-persisted headless/.test(lower)) {
    return Object.freeze({
      code: "AUTHORING_AUTH_HEADLESS_OVERRIDE_ACTIVE",
      category: "configuration",
      retryable: false,
      recovery: "remove-headless-override",
      message,
    });
  }
  if (/authoring profile .* is busy in another process/.test(lower)) {
    return Object.freeze({
      code: "AUTHORING_AUTH_PROFILE_BUSY",
      category: "conflict",
      retryable: true,
      recovery: "retry-same-auth-action",
      message,
    });
  }
  if (/supabase|publishable|project.*match|https or loopback/.test(lower)) {
    return Object.freeze({
      code: "AUTHORING_AUTH_PROJECT_CONFIGURATION_INVALID",
      category: "configuration",
      retryable: false,
      recovery: "configure-project",
      message,
    });
  }
  if (/refresh token|invalid.*token|session.*not returned|sign-in|oauth|credential|keychain/.test(lower)) {
    return Object.freeze({
      code: "AUTHORING_AUTH_SESSION_INVALID",
      category: "authentication",
      retryable: false,
      recovery: "login-again",
      message,
    });
  }
  if (/failed to fetch|network|econn|enotfound|socket|connection|timeout/.test(lower)) {
    return Object.freeze({
      code: "AUTHORING_AUTH_TRANSPORT_UNAVAILABLE",
      category: "transport",
      retryable: true,
      recovery: "retry-same-auth-action",
      message,
    });
  }
  return Object.freeze({
    code: "AUTHORING_AUTH_INTERNAL_ERROR",
    category: "internal",
    retryable: false,
    recovery: "report-bug",
    message,
  });
}

function writeSafeResultV1(result: Readonly<Record<string, unknown>>): void {
  process.stdout.write(`${JSON.stringify({
    schemaId: "circleheart-studio-authoring-auth-result-v1",
    ok: true,
    ...result,
  }, null, 2)}\n`);
}
