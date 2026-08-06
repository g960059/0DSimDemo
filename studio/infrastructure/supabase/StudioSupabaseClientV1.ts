import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type StudioSupabaseConfigurationV1 = Readonly<{
  url: string;
  publishableKey: string;
}>;

let sharedClientV1: SupabaseClient | null | undefined;

/**
 * Reads only Vite's public browser configuration. Database passwords and
 * secret/service-role keys must never cross this boundary.
 */
export function readStudioSupabaseConfigurationV1(
  environment: Pick<ImportMetaEnv,
    "VITE_SUPABASE_URL" | "VITE_SUPABASE_PUBLISHABLE_KEY"> = import.meta.env,
): StudioSupabaseConfigurationV1 | null {
  const url = environment.VITE_SUPABASE_URL?.trim() ?? "";
  const publishableKey =
    environment.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() ?? "";
  if (url.length === 0 && publishableKey.length === 0) return null;
  if (url.length === 0 || publishableKey.length === 0) {
    throw new Error(
      "Supabase configuration requires both URL and publishable key",
    );
  }
  const parsed = new URL(url);
  if (
    parsed.protocol !== "https:"
    && !(parsed.protocol === "http:" && isLoopbackHostV1(parsed.hostname))
  ) {
    throw new Error("Supabase URL must use HTTPS (or local loopback HTTP)");
  }
  if (!publishableKey.startsWith("sb_publishable_")) {
    throw new Error("Supabase browser key must be a publishable key");
  }
  return Object.freeze({
    url: parsed.origin,
    publishableKey,
  });
}

export function studioSupabaseClientV1(): SupabaseClient | null {
  if (sharedClientV1 !== undefined) return sharedClientV1;
  const configuration = readStudioSupabaseConfigurationV1();
  sharedClientV1 = configuration === null
    ? null
    : createClient(configuration.url, configuration.publishableKey, {
        auth: {
          autoRefreshToken: true,
          detectSessionInUrl: true,
          persistSession: true,
        },
      });
  return sharedClientV1;
}

/** Test-only reset for environment-isolated module tests. */
export function resetStudioSupabaseClientForTestV1(): void {
  if (import.meta.env.MODE !== "test" || import.meta.env.PROD) {
    throw new Error("Supabase client reset is available only in tests");
  }
  sharedClientV1 = undefined;
}

function isLoopbackHostV1(hostname: string): boolean {
  return hostname === "127.0.0.1"
    || hostname === "localhost"
    || hostname === "[::1]";
}
