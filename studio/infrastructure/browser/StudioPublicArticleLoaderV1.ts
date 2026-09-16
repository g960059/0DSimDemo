import { validateStudioPublishedArticleV1, type StudioPublishedArticleV1 } from "@/studio/application/publication/StudioPublishedArticleV1";
import { createStudioSupabaseContentRepositoryV1 } from "@/studio/infrastructure/supabase/StudioSupabaseContentRepositoryV1";

type Article = StudioPublishedArticleV1 | null;
const routeKeyPattern = /^(?:[a-z0-9][a-z0-9-]{2,95}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/;

/** Use the anonymous CDN representation on deployed sites. Vite/static-only
 * hosts return the SPA HTML at this URL and retain the direct public RPC. */
export function createStudioPublicArticleLoaderV1(input: {
  fetch: typeof fetch;
  fallback(routeKey: string): Promise<Article>;
  now?: () => number;
}) {
  const now = input.now ?? Date.now;
  const pending = new Map<string, Promise<Article>>();
  const prefetched = new Map<string, { expires: number; request: Promise<Article> }>();
  const request = (routeKey: string): Promise<Article> => {
    if (!routeKeyPattern.test(routeKey)) return Promise.resolve(null);
    const existing = pending.get(routeKey);
    if (existing) return existing;
    const promise = (async () => {
      const response = await input.fetch(`/api/v1/public/articles/${encodeURIComponent(routeKey)}`, {
        credentials: "omit",
        headers: { Accept: "application/json, text/html;q=0.1" },
      });
      if (response.status === 404) return null;
      if (!response.ok) throw new Error(`Article request failed (${response.status})`);
      const type = response.headers.get("Content-Type") ?? "";
      if (type.includes("text/html")) return input.fallback(routeKey);
      if (!type.includes("application/json")) throw new Error("Invalid article response");
      const article = validateStudioPublishedArticleV1(await response.json());
      if (article.publicSlug !== routeKey && article.articleId !== routeKey) throw new Error("Article route mismatch");
      return article;
    })();
    pending.set(routeKey, promise);
    const clear = () => { pending.delete(routeKey); };
    void promise.then(clear, clear);
    return promise;
  };
  return {
    read(routeKey: string): Promise<Article> {
      const warm = prefetched.get(routeKey);
      prefetched.delete(routeKey);
      return warm && warm.expires > now() ? warm.request : request(routeKey);
    },
    prefetch(routeKey: string): void {
      for (const [key, entry] of prefetched) if (entry.expires <= now()) prefetched.delete(key);
      if (prefetched.has(routeKey)) return;
      // A short, bounded handoff from link intent to navigation; no durable copy.
      if (prefetched.size >= 16) prefetched.delete(prefetched.keys().next().value!);
      const promise = request(routeKey);
      prefetched.set(routeKey, { expires: now() + 15_000, request: promise });
      void promise.catch(() => {
        if (prefetched.get(routeKey)?.request === promise) prefetched.delete(routeKey);
      });
    },
  };
}

const publicArticleLoader = createStudioPublicArticleLoaderV1({
  fetch: (url, init) => fetch(url, init),
  fallback: routeKey => createStudioSupabaseContentRepositoryV1()?.readPublishedArticle(routeKey) ?? Promise.resolve(null),
});
export const readStudioPublicArticleAsyncV1 = publicArticleLoader.read;
export function prefetchStudioPublicArticleV1(routeKey: string): void {
  if (createStudioSupabaseContentRepositoryV1() !== null) publicArticleLoader.prefetch(routeKey);
}
