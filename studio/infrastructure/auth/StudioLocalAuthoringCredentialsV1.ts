import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  unlinkSync,
  utimesSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";

export const STUDIO_AUTHORING_PROFILE_V1_SCHEMA_ID =
  "circleheart-local-authoring-profile-v1" as const;
export const DEFAULT_STUDIO_AUTHORING_PROFILE_V1 = "default" as const;
export const STUDIO_AUTHORING_KEYCHAIN_SERVICE_V1 =
  "dev.circleheart.authoring.refresh-token.v1" as const;

const PROFILE_NAME_V1 = /^[a-z0-9][a-z0-9._-]{0,63}$/;

export type StudioAuthoringProjectConfigurationV1 = Readonly<{
  url: string;
  publishableKey: string;
}>;

export type StudioAuthoringProfileV1 = Readonly<{
  schemaId: typeof STUDIO_AUTHORING_PROFILE_V1_SCHEMA_ID;
  profileName: string;
  supabaseUrl: string;
  publishableKey: string;
  userId: string;
  email: string | null;
  updatedAt: string;
}>;

export interface StudioAuthoringProfileStoreV1 {
  read(profileName: string): StudioAuthoringProfileV1 | null;
  write(profile: StudioAuthoringProfileV1): void;
}

export interface StudioAuthoringRefreshTokenStoreV1 {
  read(profileName: string): string | null;
  write(profileName: string, refreshToken: string): void;
  delete(profileName: string): void;
}

export type StudioAuthoringAuthSessionV1 = Readonly<{
  access_token: string;
  refresh_token: string;
  expires_at?: number;
  user: Readonly<{
    id: string;
    email?: string;
    is_anonymous?: boolean;
  }>;
}>;

type StudioAuthoringAuthResultV1 = Readonly<{
  data: Readonly<{ session: StudioAuthoringAuthSessionV1 | null }>;
  error: Readonly<{ message: string }> | null;
}>;

export interface StudioAuthoringAuthClientPortV1 {
  setSession(input: Readonly<{
    access_token: string;
    refresh_token: string;
  }>): Promise<StudioAuthoringAuthResultV1>;
  refreshSession(input: Readonly<{
    refresh_token: string;
  }>): Promise<StudioAuthoringAuthResultV1>;
  signOut(input: Readonly<{
    scope: "local";
  }>): Promise<Readonly<{ error: Readonly<{ message: string }> | null }>>;
}

export type StudioAuthoringSessionSourceV1 = "environment" | "keychain";

export type StudioAuthoringEstablishedSessionV1 = Readonly<{
  session: StudioAuthoringAuthSessionV1;
  source: StudioAuthoringSessionSourceV1;
}>;

const AUTHORING_PROFILE_LOCK_STALE_MS_V1 = 60_000;
const AUTHORING_PROFILE_LOCK_TIMEOUT_MS_V1 = 30_000;
// The longest supported numerical authoring command may consume ten minutes.
// Keep a five-minute margin so an externally managed, non-persisted token does
// not expire after expensive work but before its authority mutation.
const HEADLESS_ACCESS_TOKEN_MINIMUM_TTL_SEC_V1 = 900;

/**
 * Serializes the one-time refresh-token rotation performed by independent AI
 * tool processes. The lock is intentionally held only while authentication is
 * restored and the rotated token is persisted; numerical work never holds it.
 */
export async function withStudioAuthoringProfileLockV1<T>(input: Readonly<{
  profileName: string;
  environment?: NodeJS.ProcessEnv;
  timeoutMs?: number;
  staleMs?: number;
}>, operation: () => Promise<T>): Promise<T> {
  const profileName = requireStudioAuthoringProfileNameV1(input.profileName);
  const root = defaultStudioAuthoringConfigDirectoryV1(
    input.environment ?? process.env,
  );
  const locks = path.join(root, "locks");
  const lockPath = path.join(locks, `${profileName}.lock`);
  const timeoutMs = boundedLockDurationV1(
    input.timeoutMs ?? AUTHORING_PROFILE_LOCK_TIMEOUT_MS_V1,
    "authoring lock timeout",
  );
  const staleMs = boundedLockDurationV1(
    input.staleMs ?? AUTHORING_PROFILE_LOCK_STALE_MS_V1,
    "authoring stale-lock duration",
  );
  mkdirSync(locks, { recursive: true, mode: 0o700 });
  chmodSync(root, 0o700);
  chmodSync(locks, 0o700);
  const startedAt = Date.now();
  const ownerToken = randomUUID();
  for (;;) {
    try {
      mkdirSync(lockPath, { mode: 0o700 });
      try {
        writeFileSync(
          path.join(lockPath, "owner.json"),
          `${JSON.stringify({
            pid: process.pid,
            ownerToken,
            acquiredAt: new Date().toISOString(),
          })}\n`,
          { encoding: "utf8", mode: 0o600, flag: "wx" },
        );
      } catch (error) {
        rmSync(lockPath, { recursive: true, force: true });
        throw error;
      }
      break;
    } catch (error) {
      if (!isAlreadyExistsV1(error)) throw error;
      if (isStaleAuthoringLockV1(lockPath, staleMs)) {
        quarantineStaleAuthoringLockV1(lockPath);
        continue;
      }
      if (Date.now() - startedAt >= timeoutMs) {
        throw new Error(
          `Authoring profile '${profileName}' is busy in another process`,
        );
      }
      await delayV1(50 + Math.floor(Math.random() * 50));
    }
  }
  const heartbeatMs = Math.max(10, Math.min(5_000, Math.floor(staleMs / 3)));
  const heartbeat = setInterval(() => {
    if (!authoringLockOwnedByV1(lockPath, ownerToken)) return;
    try {
      const now = new Date();
      utimesSync(lockPath, now, now);
    } catch {
      // A missing path means ownership was already lost. The token check in
      // finally prevents this process from deleting a successor's lock.
    }
  }, heartbeatMs);
  heartbeat.unref();
  try {
    return await operation();
  } finally {
    clearInterval(heartbeat);
    removeOwnedAuthoringLockV1(lockPath, ownerToken);
  }
}

export function requireStudioAuthoringProfileNameV1(value: string): string {
  if (!PROFILE_NAME_V1.test(value)) {
    throw new Error(
      "Authoring profile must start with a lowercase letter or digit and use only lowercase letters, digits, '.', '_' or '-'",
    );
  }
  return value;
}

export function readStudioAuthoringEnvironmentProjectV1(
  environment: NodeJS.ProcessEnv,
): StudioAuthoringProjectConfigurationV1 | null {
  const url = environment.CIRCLEHEART_SUPABASE_URL
    ?? environment.VITE_SUPABASE_URL;
  const publishableKey = environment.CIRCLEHEART_SUPABASE_PUBLISHABLE_KEY
    ?? environment.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (url === undefined && publishableKey === undefined) return null;
  if (url === undefined || publishableKey === undefined) {
    throw new Error(
      "Authoring project configuration requires both Supabase URL and publishable key",
    );
  }
  return validateStudioAuthoringProjectV1({ url, publishableKey });
}

export function resolveStudioAuthoringProjectV1(input: Readonly<{
  environment: NodeJS.ProcessEnv;
  storedProfile: StudioAuthoringProfileV1 | null;
  allowProfileReplacement: boolean;
}>): StudioAuthoringProjectConfigurationV1 {
  const fromEnvironment = readStudioAuthoringEnvironmentProjectV1(
    input.environment,
  );
  const fromProfile = input.storedProfile === null
    ? null
    : validateStudioAuthoringProjectV1({
        url: input.storedProfile.supabaseUrl,
        publishableKey: input.storedProfile.publishableKey,
      });
  if (fromEnvironment === null && fromProfile === null) {
    throw new Error(
      "Authoring project is not configured; set CIRCLEHEART_SUPABASE_URL and CIRCLEHEART_SUPABASE_PUBLISHABLE_KEY for the first login",
    );
  }
  if (
    fromEnvironment !== null
    && fromProfile !== null
    && !input.allowProfileReplacement
    && (
      fromEnvironment.url !== fromProfile.url
      || fromEnvironment.publishableKey !== fromProfile.publishableKey
    )
  ) {
    throw new Error(
      "Authoring environment project does not match the selected saved profile",
    );
  }
  return (fromEnvironment ?? fromProfile) as StudioAuthoringProjectConfigurationV1;
}

export function readStudioAuthoringHeadlessSessionV1(
  environment: NodeJS.ProcessEnv,
): Readonly<{ accessToken: string; refreshToken: string }> | null {
  const accessToken = environment.CIRCLEHEART_AUTHOR_ACCESS_TOKEN;
  const refreshToken = environment.CIRCLEHEART_AUTHOR_REFRESH_TOKEN;
  if (accessToken === undefined && refreshToken === undefined) return null;
  if (accessToken === undefined || refreshToken === undefined) {
    throw new Error(
      "Headless authoring requires both CIRCLEHEART_AUTHOR_ACCESS_TOKEN and CIRCLEHEART_AUTHOR_REFRESH_TOKEN",
    );
  }
  return Object.freeze({
    accessToken: requiredSecretV1(accessToken, "author access token"),
    refreshToken: requiredSecretV1(refreshToken, "author refresh token"),
  });
}

export async function establishStudioAuthoringSessionV1(input: Readonly<{
  auth: StudioAuthoringAuthClientPortV1;
  environment: NodeJS.ProcessEnv;
  profileName: string;
  storedProfile: StudioAuthoringProfileV1 | null;
  refreshTokens: StudioAuthoringRefreshTokenStoreV1;
}>): Promise<StudioAuthoringEstablishedSessionV1> {
  const profileName = requireStudioAuthoringProfileNameV1(input.profileName);
  const headless = readStudioAuthoringHeadlessSessionV1(input.environment);
  if (headless !== null) {
    assertFreshHeadlessAccessTokenV1(headless.accessToken);
    const result = await input.auth.setSession({
      access_token: headless.accessToken,
      refresh_token: headless.refreshToken,
    });
    const session = requireAuthorSessionV1(result, input.storedProfile);
    if (
      session.access_token !== headless.accessToken
      || session.refresh_token !== headless.refreshToken
    ) {
      throw new Error(
        "The headless token pair was rotated unexpectedly; provide a fresh pair from the external token manager",
      );
    }
    return Object.freeze({
      session,
      source: "environment",
    });
  }
  const refreshToken = input.refreshTokens.read(profileName);
  if (refreshToken === null) {
    throw new Error(
      `Authoring profile '${profileName}' is signed out; run npm run author:login -- --profile ${profileName}`,
    );
  }
  const result = await input.auth.refreshSession({
    refresh_token: refreshToken,
  });
  if (result.error !== null || result.data.session === null) {
    throw new Error(
      `Authoring profile '${profileName}' could not refresh its session; run npm run author:login -- --profile ${profileName}`,
      { cause: result.error ?? undefined },
    );
  }
  const session = requireAuthorSessionV1(result, input.storedProfile);
  // Supabase refresh tokens are one-time credentials. Persist the rotated
  // value before any content command is allowed to mutate durable state.
  input.refreshTokens.write(profileName, session.refresh_token);
  return Object.freeze({ session, source: "keychain" });
}

function assertFreshHeadlessAccessTokenV1(accessToken: string): void {
  const segments = accessToken.split(".");
  if (segments.length !== 3 || segments[1] === undefined) {
    throw new Error(
      "Headless authoring requires a JWT access token with an explicit expiry",
    );
  }
  let payload: unknown;
  try {
    payload = JSON.parse(
      Buffer.from(segments[1], "base64url").toString("utf8"),
    ) as unknown;
  } catch {
    throw new Error(
      "Headless authoring access token has an invalid JWT payload",
    );
  }
  const expiry = isRecordV1(payload) ? payload.exp : undefined;
  if (
    typeof expiry !== "number"
    || !Number.isSafeInteger(expiry)
    || expiry <= Math.floor(Date.now() / 1_000)
      + HEADLESS_ACCESS_TOKEN_MINIMUM_TTL_SEC_V1
  ) {
    throw new Error(
      `Headless authoring requires an access token valid for at least ${HEADLESS_ACCESS_TOKEN_MINIMUM_TTL_SEC_V1} more seconds; refresh it in the external token manager`,
    );
  }
}

function isRecordV1(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export async function revokeAndRemoveStudioAuthoringSessionV1(
  input: Readonly<{
    auth: StudioAuthoringAuthClientPortV1;
    profileName: string;
    storedProfile: StudioAuthoringProfileV1;
    refreshTokens: StudioAuthoringRefreshTokenStoreV1;
  }>,
): Promise<Readonly<{ remoteRevoked: boolean }>> {
  const profileName = requireStudioAuthoringProfileNameV1(input.profileName);
  const refreshToken = input.refreshTokens.read(profileName);
  if (refreshToken === null) {
    input.refreshTokens.delete(profileName);
    return Object.freeze({ remoteRevoked: false });
  }
  let remoteRevoked = false;
  try {
    const refreshed = await input.auth.refreshSession({
      refresh_token: refreshToken,
    });
    if (refreshed.error !== null || refreshed.data.session === null) {
      throw new Error("Authoring session could not be restored for logout");
    }
    // The Keychain credential is the authority being removed. Even when
    // non-secret profile metadata is stale or mismatched, revoke that live
    // credential rather than leaving its remote session behind.
    requireNonAnonymousAuthorSessionV1(refreshed.data.session);
    const signedOut = await input.auth.signOut({ scope: "local" });
    remoteRevoked = signedOut.error === null;
  } catch {
    // Logout must remain available offline or with an expired credential.
    // The local Keychain credential is removed even when remote revocation
    // cannot be confirmed.
  } finally {
    input.refreshTokens.delete(profileName);
  }
  return Object.freeze({ remoteRevoked });
}

export function createStudioAuthoringProfileV1(input: Readonly<{
  profileName: string;
  project: StudioAuthoringProjectConfigurationV1;
  session: StudioAuthoringAuthSessionV1;
  now?: Date;
}>): StudioAuthoringProfileV1 {
  const session = requireNonAnonymousAuthorSessionV1(input.session);
  return Object.freeze({
    schemaId: STUDIO_AUTHORING_PROFILE_V1_SCHEMA_ID,
    profileName: requireStudioAuthoringProfileNameV1(input.profileName),
    supabaseUrl: validateStudioAuthoringProjectV1(input.project).url,
    publishableKey: input.project.publishableKey,
    userId: requiredIdentityV1(session.user.id, "author user ID"),
    email: session.user.email === undefined
      ? null
      : requiredIdentityV1(session.user.email, "author email"),
    updatedAt: (input.now ?? new Date()).toISOString(),
  });
}

export class FileStudioAuthoringProfileStoreV1
implements StudioAuthoringProfileStoreV1 {
  readonly #directory: string;

  constructor(directory = defaultStudioAuthoringConfigDirectoryV1()) {
    this.#directory = path.resolve(directory);
  }

  read(profileName: string): StudioAuthoringProfileV1 | null {
    const filePath = this.#path(profileName);
    if (!existsSync(filePath)) return null;
    let parsed: unknown;
    try {
      parsed = JSON.parse(readFileSync(filePath, "utf8")) as unknown;
    } catch {
      throw new Error(`Authoring profile '${profileName}' is unreadable`);
    }
    return validateStudioAuthoringProfileV1(parsed, profileName);
  }

  write(profile: StudioAuthoringProfileV1): void {
    const validated = validateStudioAuthoringProfileV1(
      profile,
      profile.profileName,
    );
    mkdirSync(this.#directory, { recursive: true, mode: 0o700 });
    chmodSync(this.#directory, 0o700);
    const destination = this.#path(validated.profileName);
    const temporary = `${destination}.${process.pid}.tmp`;
    writeFileSync(temporary, `${JSON.stringify(validated, null, 2)}\n`, {
      encoding: "utf8",
      mode: 0o600,
      flag: "wx",
    });
    try {
      renameSync(temporary, destination);
      chmodSync(destination, 0o600);
    } catch (error) {
      if (existsSync(temporary)) unlinkSync(temporary);
      throw error;
    }
  }

  #path(profileName: string): string {
    return path.join(
      this.#directory,
      `${requireStudioAuthoringProfileNameV1(profileName)}.json`,
    );
  }
}

export type StudioSecurityCommandResultV1 = Readonly<{
  status: number | null;
  stdout: string;
  stderr: string;
}>;

export type StudioSecurityCommandRunnerV1 = (
  args: readonly string[],
  input?: string,
) => StudioSecurityCommandResultV1;

export class MacOSKeychainAuthoringRefreshTokenStoreV1
implements StudioAuthoringRefreshTokenStoreV1 {
  readonly #run: StudioSecurityCommandRunnerV1;

  constructor(run: StudioSecurityCommandRunnerV1 = runMacOSSecurityV1) {
    this.#run = run;
  }

  read(profileName: string): string | null {
    const result = this.#run([
      "find-generic-password",
      "-a", requireStudioAuthoringProfileNameV1(profileName),
      "-s", STUDIO_AUTHORING_KEYCHAIN_SERVICE_V1,
      "-w",
    ]);
    if (result.status !== 0) {
      if (result.status === 44 || /could not be found/i.test(result.stderr)) {
        return null;
      }
      throw new Error("macOS Keychain could not read the authoring credential");
    }
    return requiredSecretV1(result.stdout.trim(), "Keychain refresh token");
  }

  write(profileName: string, refreshToken: string): void {
    const profile = requireStudioAuthoringProfileNameV1(profileName);
    const secret = requiredSecretV1(refreshToken, "author refresh token");
    // Passing -w without a value makes `security` prompt on stdin. A new or
    // updated item asks for the value twice, so provide the same secret twice.
    // The credential never appears in argv or process listings.
    const result = this.#run([
      "add-generic-password",
      "-a", profile,
      "-s", STUDIO_AUTHORING_KEYCHAIN_SERVICE_V1,
      "-l", `CircleHeart authoring (${profile})`,
      "-U",
      "-w",
    ], `${secret}\n${secret}\n`);
    if (result.status !== 0) {
      throw new Error("macOS Keychain could not store the authoring credential");
    }
  }

  delete(profileName: string): void {
    const result = this.#run([
      "delete-generic-password",
      "-a", requireStudioAuthoringProfileNameV1(profileName),
      "-s", STUDIO_AUTHORING_KEYCHAIN_SERVICE_V1,
    ]);
    if (
      result.status !== 0
      && result.status !== 44
      && !/could not be found/i.test(result.stderr)
    ) {
      throw new Error("macOS Keychain could not remove the authoring credential");
    }
  }
}

export function defaultStudioAuthoringConfigDirectoryV1(
  environment: NodeJS.ProcessEnv = process.env,
): string {
  const explicit = environment.CIRCLEHEART_AUTHOR_CONFIG_HOME;
  if (explicit !== undefined) {
    if (explicit.length === 0 || explicit !== explicit.trim()) {
      throw new Error("CIRCLEHEART_AUTHOR_CONFIG_HOME must be a nonempty path");
    }
    return path.resolve(explicit);
  }
  if (process.platform === "darwin") {
    return path.join(
      os.homedir(),
      "Library",
      "Application Support",
      "CircleHeart",
      "authoring",
    );
  }
  const xdg = environment.XDG_CONFIG_HOME;
  return path.join(xdg === undefined ? path.join(os.homedir(), ".config") : xdg,
    "circleheart", "authoring");
}

function boundedLockDurationV1(value: number, label: string): number {
  if (!Number.isSafeInteger(value) || value < 1 || value > 10 * 60_000) {
    throw new Error(`${label} must be an integer between 1 and 600000 ms`);
  }
  return value;
}

function isAlreadyExistsV1(error: unknown): boolean {
  return error !== null
    && typeof error === "object"
    && "code" in error
    && (error as { code?: unknown }).code === "EEXIST";
}

function isStaleAuthoringLockV1(lockPath: string, staleMs: number): boolean {
  try {
    if (Date.now() - statSync(lockPath).mtimeMs < staleMs) return false;
    const owner = readAuthoringLockOwnerV1(lockPath);
    return owner === null || !isProcessAliveV1(owner.pid);
  } catch {
    return false;
  }
}

function readAuthoringLockOwnerV1(
  lockPath: string,
): Readonly<{ pid: number; ownerToken: string }> | null {
  try {
    const parsed = JSON.parse(
      readFileSync(path.join(lockPath, "owner.json"), "utf8"),
    ) as unknown;
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null;
    }
    const record = parsed as Record<string, unknown>;
    if (
      !Number.isSafeInteger(record.pid)
      || (record.pid as number) < 1
      || typeof record.ownerToken !== "string"
      || !/^[0-9a-f-]{36}$/i.test(record.ownerToken)
    ) {
      return null;
    }
    return Object.freeze({
      pid: record.pid as number,
      ownerToken: record.ownerToken,
    });
  } catch {
    return null;
  }
}

function isProcessAliveV1(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error !== null
      && typeof error === "object"
      && "code" in error
      && (error as { code?: unknown }).code === "EPERM";
  }
}

function authoringLockOwnedByV1(lockPath: string, ownerToken: string): boolean {
  return readAuthoringLockOwnerV1(lockPath)?.ownerToken === ownerToken;
}

function removeOwnedAuthoringLockV1(lockPath: string, ownerToken: string): void {
  if (!authoringLockOwnedByV1(lockPath, ownerToken)) return;
  rmSync(lockPath, { recursive: true, force: true });
}

function quarantineStaleAuthoringLockV1(lockPath: string): void {
  const quarantinePath = `${lockPath}.stale-${process.pid}-${randomUUID()}`;
  try {
    renameSync(lockPath, quarantinePath);
  } catch (error) {
    if (isAlreadyExistsV1(error) || !existsSync(lockPath)) return;
    throw error;
  }
  rmSync(quarantinePath, { recursive: true, force: true });
}

function delayV1(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function validateStudioAuthoringProjectV1(
  value: Readonly<{ url: string; publishableKey: string }>,
): StudioAuthoringProjectConfigurationV1 {
  const rawUrl = requiredIdentityV1(value.url, "authoring Supabase URL");
  const parsedUrl = new URL(rawUrl);
  const loopbackHost = ["127.0.0.1", "localhost", "[::1]"]
    .includes(parsedUrl.hostname);
  if (
    parsedUrl.protocol !== "https:"
    && !(parsedUrl.protocol === "http:" && loopbackHost)
  ) {
    throw new Error("Authoring Supabase URL must use HTTPS or loopback HTTP");
  }
  const publishableKey = requiredIdentityV1(
    value.publishableKey,
    "authoring publishable key",
  );
  if (!publishableKey.startsWith("sb_publishable_")) {
    throw new Error("Authoring CLI requires an sb_publishable_ key");
  }
  return Object.freeze({
    url: parsedUrl.origin,
    publishableKey,
  });
}

function validateStudioAuthoringProfileV1(
  value: unknown,
  expectedProfileName: string,
): StudioAuthoringProfileV1 {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Authoring profile must be an object");
  }
  const record = value as Record<string, unknown>;
  const expected = [
    "email",
    "profileName",
    "publishableKey",
    "schemaId",
    "supabaseUrl",
    "updatedAt",
    "userId",
  ].sort();
  const actual = Object.keys(record).sort();
  if (
    actual.length !== expected.length
    || actual.some((key, index) => key !== expected[index])
  ) {
    throw new Error("Authoring profile has an unexpected field set");
  }
  if (record.schemaId !== STUDIO_AUTHORING_PROFILE_V1_SCHEMA_ID) {
    throw new Error("Authoring profile schema identity mismatch");
  }
  const profileName = requireStudioAuthoringProfileNameV1(
    requiredIdentityV1(record.profileName, "authoring profile name"),
  );
  if (profileName !== expectedProfileName) {
    throw new Error("Authoring profile file identity mismatch");
  }
  const project = validateStudioAuthoringProjectV1({
    url: requiredIdentityV1(record.supabaseUrl, "authoring Supabase URL"),
    publishableKey: requiredIdentityV1(
      record.publishableKey,
      "authoring publishable key",
    ),
  });
  const email = record.email === null
    ? null
    : requiredIdentityV1(record.email, "author email");
  const updatedAt = requiredIdentityV1(record.updatedAt, "profile update time");
  if (!Number.isFinite(Date.parse(updatedAt))) {
    throw new Error("Authoring profile update time must be ISO-compatible");
  }
  return Object.freeze({
    schemaId: STUDIO_AUTHORING_PROFILE_V1_SCHEMA_ID,
    profileName,
    supabaseUrl: project.url,
    publishableKey: project.publishableKey,
    userId: requiredIdentityV1(record.userId, "author user ID"),
    email,
    updatedAt,
  });
}

function requireAuthorSessionV1(
  result: StudioAuthoringAuthResultV1,
  storedProfile: StudioAuthoringProfileV1 | null,
): StudioAuthoringAuthSessionV1 {
  if (result.error !== null || result.data.session === null) {
    throw new Error(
      result.error?.message ?? "Authoring session could not be restored",
    );
  }
  const session = requireNonAnonymousAuthorSessionV1(result.data.session);
  if (
    storedProfile !== null
    && session.user.id !== storedProfile.userId
  ) {
    throw new Error(
      "Authoring credential user does not match the selected profile",
    );
  }
  return session;
}

function requireNonAnonymousAuthorSessionV1(
  session: StudioAuthoringAuthSessionV1,
): StudioAuthoringAuthSessionV1 {
  requiredSecretV1(session.access_token, "author access token");
  requiredSecretV1(session.refresh_token, "author refresh token");
  requiredIdentityV1(session.user.id, "author user ID");
  if (session.user.is_anonymous === true) {
    throw new Error("AI-assisted authoring requires a signed-in non-anonymous user");
  }
  return session;
}

function requiredIdentityV1(value: unknown, name: string): string {
  if (
    typeof value !== "string"
    || value.length === 0
    || value !== value.trim()
  ) {
    throw new Error(`${name} is required`);
  }
  return value;
}

function requiredSecretV1(value: string, name: string): string {
  if (value.length === 0 || value !== value.trim() || /[\r\n]/.test(value)) {
    throw new Error(`${name} is invalid`);
  }
  return value;
}

function requireDarwinV1(): void {
  if (process.platform !== "darwin") {
    throw new Error(
      "Local authoring profiles currently require macOS Keychain; use the explicit headless token override on other platforms",
    );
  }
}

function runMacOSSecurityV1(
  args: readonly string[],
  input?: string,
): StudioSecurityCommandResultV1 {
  requireDarwinV1();
  const result = spawnSync("/usr/bin/security", [...args], {
    encoding: "utf8",
    input,
    stdio: ["pipe", "pipe", "pipe"],
  });
  return Object.freeze({
    status: result.status,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  });
}
