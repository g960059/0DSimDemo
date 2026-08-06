import type { Session, SupabaseClient, User } from "@supabase/supabase-js";

import { studioSupabaseClientV1 } from "./StudioSupabaseClientV1";

export type StudioAuthIdentityV1 =
  | Readonly<{ kind: "unconfigured" }>
  | Readonly<{ kind: "signed-out" }>
  | Readonly<{
      kind: "anonymous";
      userId: string;
    }>
  | Readonly<{
      kind: "account";
      userId: string;
      displayName: string;
      email: string | null;
      avatarUrl: string | null;
    }>;

/** Creates the disposable account only at the first explicit backend Save. */
export async function ensureStudioAuthenticatedForSaveV1(
  client: SupabaseClient | null = studioSupabaseClientV1(),
): Promise<Session> {
  if (client === null) {
    throw new Error("Supabase is not configured");
  }
  const current = await client.auth.getSession();
  if (current.error !== null) throw current.error;
  if (current.data.session !== null) return current.data.session;
  const created = await client.auth.signInAnonymously();
  if (created.error !== null) throw created.error;
  if (created.data.session === null) {
    throw new Error("Anonymous sign-in did not return a session");
  }
  return created.data.session;
}

export async function readStudioAuthIdentityV1(
  client: SupabaseClient | null = studioSupabaseClientV1(),
): Promise<StudioAuthIdentityV1> {
  if (client === null) return Object.freeze({ kind: "unconfigured" });
  const result = await client.auth.getSession();
  if (result.error !== null) throw result.error;
  const user = result.data.session?.user;
  return user === undefined
    ? Object.freeze({ kind: "signed-out" })
    : studioAuthIdentityForUserV1(user);
}

/**
 * Passwordless email entry. An existing anonymous account is upgraded in
 * place; a signed-out visitor receives an ordinary magic link.
 */
export async function requestStudioMagicLinkV1(input: Readonly<{
  email: string;
  redirectTo: string;
  client?: SupabaseClient | null;
}>): Promise<void> {
  const client = input.client ?? studioSupabaseClientV1();
  if (client === null) throw new Error("Supabase is not configured");
  const email = normalizeEmailV1(input.email);
  const session = await client.auth.getSession();
  if (session.error !== null) throw session.error;
  if (session.data.session?.user.is_anonymous === true) {
    const result = await client.auth.updateUser(
      { email },
      { emailRedirectTo: input.redirectTo },
    );
    if (result.error !== null) throw result.error;
    return;
  }
  const result = await client.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: input.redirectTo,
      shouldCreateUser: true,
    },
  });
  if (result.error !== null) throw result.error;
}

export async function continueStudioWithGoogleV1(input: Readonly<{
  redirectTo: string;
  client?: SupabaseClient | null;
}>): Promise<void> {
  const client = input.client ?? studioSupabaseClientV1();
  if (client === null) throw new Error("Supabase is not configured");
  const session = await client.auth.getSession();
  if (session.error !== null) throw session.error;
  const result = session.data.session?.user.is_anonymous === true
    ? await client.auth.linkIdentity({
        provider: "google",
        options: { redirectTo: input.redirectTo },
      })
    : await client.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: input.redirectTo },
      });
  if (result.error !== null) throw result.error;
}

export async function signOutStudioAccountV1(
  client: SupabaseClient | null = studioSupabaseClientV1(),
): Promise<void> {
  if (client === null) return;
  const result = await client.auth.signOut();
  if (result.error !== null) throw result.error;
}

export function studioAuthIdentityForUserV1(
  user: User,
): StudioAuthIdentityV1 {
  if (user.is_anonymous) {
    return Object.freeze({ kind: "anonymous", userId: user.id });
  }
  const displayName = firstStringV1(
    user.user_metadata.full_name,
    user.user_metadata.name,
    user.email,
  ) ?? "CircleHeart";
  return Object.freeze({
    kind: "account",
    userId: user.id,
    displayName,
    email: user.email ?? null,
    avatarUrl: firstStringV1(
      user.user_metadata.avatar_url,
      user.user_metadata.picture,
    ),
  });
}

function normalizeEmailV1(value: string): string {
  const email = value.trim().toLocaleLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    throw new Error("Enter a valid email address");
  }
  return email;
}

function firstStringV1(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }
  return null;
}
