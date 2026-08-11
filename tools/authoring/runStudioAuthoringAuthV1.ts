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
  type StudioAuthoringProfileStoreV1,
  type StudioAuthoringProfileV1,
  type StudioAuthoringRefreshTokenStoreV1,
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

if (
  process.argv[1] !== undefined
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
) {
  await main();
}

async function main(): Promise<void> {
  const args = parseStudioAuthoringAuthArgumentsV1(process.argv.slice(2));
  assertStudioAuthoringAuthActionEnvironmentV1(
    args,
    process.env,
    process.platform,
  );
  const profiles = new FileStudioAuthoringProfileStoreV1();
  const refreshTokens = new MacOSKeychainAuthoringRefreshTokenStoreV1();
  const storedProfile = readStudioAuthoringProfileForAuthActionV1({
    action: args.action,
    profileName: args.profileName,
    profiles,
    refreshTokens,
  });

  if (args.action === "logout") {
    if (storedProfile === null) {
      refreshTokens.delete(args.profileName);
      writeSafeResultV1({
        action: args.action,
        profileName: args.profileName,
        signedIn: false,
        remoteRevoked: false,
      });
      return;
    }
    const project = resolveStudioAuthoringProjectV1({
      environment: {},
      storedProfile,
      allowProfileReplacement: false,
    });
    const client = createAuthoringAuthClientV1(project);
    const revoked = await revokeAndRemoveStudioAuthoringSessionV1({
      auth: client.auth,
      profileName: args.profileName,
      storedProfile,
      refreshTokens,
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
      writeSafeResultV1({
        action: args.action,
        profileName: args.profileName,
        signedIn: false,
        reason: signedOutReason,
      });
      return;
    }
  }

  const project = resolveStudioAuthoringProjectV1({
    environment: process.env,
    storedProfile,
    allowProfileReplacement: args.action === "login",
  });
  const client = createAuthoringAuthClientV1(project);

  if (args.action === "status") {
    const established = await establishStudioAuthoringSessionV1({
      auth: client.auth,
      environment: process.env,
      profileName: args.profileName,
      storedProfile,
      refreshTokens,
    });
    writeSafeResultV1({
      action: args.action,
      profileName: args.profileName,
      signedIn: true,
      source: established.source,
      userId: established.session.user.id,
      email: established.session.user.email ?? null,
      supabaseUrl: project.url,
      expiresAt: established.session.expires_at ?? null,
    });
    return;
  }

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
      profiles.write(profile);
      refreshTokens.write(args.profileName, exchange.data.session.refresh_token);
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

export function readStudioAuthoringProfileForAuthActionV1(input: Readonly<{
  action: StudioAuthoringAuthActionV1;
  profileName: string;
  profiles: StudioAuthoringProfileStoreV1;
  refreshTokens: StudioAuthoringRefreshTokenStoreV1;
}>): StudioAuthoringProfileV1 | null {
  try {
    return input.profiles.read(input.profileName);
  } catch (error) {
    if (input.action !== "logout") throw error;
    // A damaged non-secret profile must never trap its secret in Keychain.
    input.refreshTokens.delete(input.profileName);
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

function writeSafeResultV1(result: Readonly<Record<string, unknown>>): void {
  process.stdout.write(`${JSON.stringify({
    schemaId: "circleheart-studio-authoring-auth-result-v1",
    ...result,
  }, null, 2)}\n`);
}
