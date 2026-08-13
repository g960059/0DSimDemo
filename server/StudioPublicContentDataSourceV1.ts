import { createClient } from "@supabase/supabase-js";

import type {
  StudioPublishedArticleV1,
} from "@/studio/application/publication/StudioPublishedArticleV1";
import {
  StudioSupabaseContentRepositoryV1,
  type StudioPublicArticleSummaryV1,
  type StudioSummaryPageRequestV1,
  type StudioSummaryPageV1,
} from "@/studio/infrastructure/supabase/StudioSupabaseContentRepositoryV1";

export type StudioPublicContentDataSourceV1 = Readonly<{
  readPublishedArticle: (
    routeKey: string,
  ) => Promise<StudioPublishedArticleV1 | null>;
  listPublicArticles: (
    request?: StudioSummaryPageRequestV1,
  ) => Promise<StudioSummaryPageV1<StudioPublicArticleSummaryV1>>;
}>;

export type StudioPublicContentServerConfigurationV1 = Readonly<{
  canonicalOrigin: string;
  publishableKey: string;
  supabaseUrl: string;
}>;

/**
 * Server rendering deliberately uses the anonymous public contract. A secret
 * or service-role key would turn the SEO tier into an accidental authority.
 */
export function readStudioPublicContentServerConfigurationV1(
  environment: NodeJS.ProcessEnv = process.env,
): StudioPublicContentServerConfigurationV1 {
  const supabaseUrl = (
    environment.CIRCLEHEART_SUPABASE_URL
    ?? environment.VITE_SUPABASE_URL
    ?? ""
  ).trim();
  const publishableKey = (
    environment.CIRCLEHEART_SUPABASE_PUBLISHABLE_KEY
    ?? environment.VITE_SUPABASE_PUBLISHABLE_KEY
    ?? ""
  ).trim();
  const canonicalOrigin = (
    environment.CIRCLEHEART_CANONICAL_ORIGIN
    ?? "https://www.circleheart.dev"
  ).trim();

  if (supabaseUrl.length === 0 || publishableKey.length === 0) {
    throw new Error(
      "Public content server requires Supabase URL and publishable key",
    );
  }
  const parsedSupabaseUrl = new URL(supabaseUrl);
  if (
    parsedSupabaseUrl.protocol !== "https:"
    && !(
      parsedSupabaseUrl.protocol === "http:"
      && isLoopbackHostV1(parsedSupabaseUrl.hostname)
    )
  ) {
    throw new Error("Public content Supabase URL must use HTTPS");
  }
  if (!publishableKey.startsWith("sb_publishable_")) {
    throw new Error("Public content server accepts only a publishable key");
  }
  const parsedCanonicalOrigin = new URL(canonicalOrigin);
  if (
    parsedCanonicalOrigin.protocol !== "https:"
    || parsedCanonicalOrigin.pathname !== "/"
    || parsedCanonicalOrigin.search.length > 0
    || parsedCanonicalOrigin.hash.length > 0
  ) {
    throw new Error("Canonical origin must be an HTTPS origin without a path");
  }

  return Object.freeze({
    canonicalOrigin: parsedCanonicalOrigin.origin,
    publishableKey,
    supabaseUrl: parsedSupabaseUrl.origin,
  });
}

export function createStudioPublicContentDataSourceV1(
  configuration: StudioPublicContentServerConfigurationV1,
): StudioPublicContentDataSourceV1 {
  const client = createClient(
    configuration.supabaseUrl,
    configuration.publishableKey,
    {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
    },
  );
  const repository = new StudioSupabaseContentRepositoryV1(client);
  return Object.freeze({
    readPublishedArticle: (routeKey: string) =>
      repository.readPublishedArticle(routeKey),
    listPublicArticles: (request: StudioSummaryPageRequestV1 = {}) =>
      repository.listPublicArticles(request),
  });
}

function isLoopbackHostV1(hostname: string): boolean {
  return hostname === "127.0.0.1"
    || hostname === "localhost"
    || hostname === "[::1]";
}
