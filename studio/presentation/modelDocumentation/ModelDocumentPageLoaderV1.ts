import { matchesModelDocumentPageV1, modelDocumentPagePathV1,
  type ModelDocumentIndexV1, type ModelDocumentPageDataV1 } from "./ModelDocumentDeliveryV1";
import type { Locale } from "@/localeRouting";

const pages = new Map<string, Promise<ModelDocumentPageDataV1>>();
export function loadModelDocumentPageV1(index: ModelDocumentIndexV1, locale: Locale,
  view: "guide" | "presets", recordId?: string | null): Promise<ModelDocumentPageDataV1> {
  const path = modelDocumentPagePathV1(index, locale, view, recordId);
  const existing = pages.get(path);
  if (existing) return existing;
  const loading = (async () => {
    // Reuse the body already delivered for crawlers and no-JavaScript readers.
    // Keep HTML out of the bootstrap JSON so the first response carries it once.
    const bootstrap = typeof document === "undefined" ? null : document.getElementById("model-document-bootstrap-v1");
    const body = bootstrap?.parentElement?.querySelector<HTMLElement>("[data-model-reading-body]");
    if (bootstrap?.dataset.path === path && body) {
      const page: unknown = { ...JSON.parse(bootstrap.textContent ?? "null"), html: body.innerHTML };
      if (matchesModelDocumentPageV1(page, index, locale, view, recordId)) return page;
    }
    const response = await fetch(path, { credentials: "omit", headers: { Accept: "application/json" } });
    if (!response.ok || !response.headers.get("content-type")?.includes("application/json")) throw new Error("Documentation unavailable");
    const page: unknown = await response.json();
    if (!matchesModelDocumentPageV1(page, index, locale, view, recordId)) throw new Error("Documentation identity mismatch");
    return page;
  })();
  pages.set(path, loading);
  if (pages.size > 12) pages.delete(pages.keys().next().value!);
  // React.use must observe the same rejected promise before the error boundary can recover.
  void loading.catch(() => {});
  return loading;
}

export function retryModelDocumentPageV1(index: ModelDocumentIndexV1, locale: Locale,
  view: "guide" | "presets", recordId?: string | null): void {
  pages.delete(modelDocumentPagePathV1(index, locale, view, recordId));
}
