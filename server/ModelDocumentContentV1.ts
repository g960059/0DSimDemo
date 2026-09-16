import { createHash } from "node:crypto";
import { modelDocumentationHref } from "@/homeLinks";
import { currentModelReadingEntryV1, MODEL_READING_ENTRIES_V1 } from "@/studio/presentation/modelDocumentation/ModelReadingCatalogV1";
import { resolveSavedModelDocumentIndexV1 } from "@/studio/presentation/modelDocumentation/SavedModelDocumentCatalogV1";
import { modelDocumentPagePathV1 } from "@/studio/presentation/modelDocumentation/ModelDocumentDeliveryV1";
import { injectStudioPublicDocumentV1 } from "@/studio/application/publication/StudioPublicArticleRendererV1";
import type { Locale } from "@/localeRouting";

export type ModelDocumentAssetReaderV1 = (path: string) => Promise<string | null>;
export const MODEL_DOCUMENT_CACHE_V1 = "public, max-age=0, s-maxage=300, must-revalidate";

export async function handleModelDocumentRequestV1(request: Request, input: {
  canonicalOrigin: string; clientTemplate: string; readAsset: ModelDocumentAssetReaderV1; production?: boolean;
}): Promise<Response | null> {
  const url = new URL(request.url), route = /^\/(ja|en)\/models(?:\/([^/]+))?\/?$/.exec(url.pathname);
  if (!route) return null;
  const headers = { "Content-Type": "text/html; charset=utf-8", "Cache-Control": MODEL_DOCUMENT_CACHE_V1,
    "X-Content-Type-Options": "nosniff", "Referrer-Policy": "strict-origin-when-cross-origin" };
  const respond = (body: string, status = 200, extra: Record<string, string> = {}) => new Response(request.method === "HEAD" ? null : body, { status, headers: { ...headers, ...extra } });
  if (request.method !== "GET" && request.method !== "HEAD") return respond("Method not allowed", 405, { Allow: "GET, HEAD", "Cache-Control": "no-store" });
  const locale = route[1] as Locale;
  const unavailable = () => respond(injectStudioPublicDocumentV1({ clientTemplate: input.clientTemplate, language: locale,
    canonicalUrl: new URL(url.pathname + url.search, input.canonicalOrigin).href, title: "Model documentation unavailable | CircleHeart",
    description: "No matching saved model, Surface and assessment record is available.",
    additionalHeadHtml: '<meta name="robots" content="noindex">',
    bodyHtml: `<main class="public-static-shell public-static-message"><h1>${locale === "ja" ? "数理モデル文書を表示できません" : "Model documentation unavailable"}</h1><p>${locale === "ja" ? "指定されたモデル・Surface・文書・検証記録の組み合わせが見つかりません。" : "The requested model, Surface, document and assessment record are not available."}</p></main>`,
  }), 404, { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" });
  if (!route[2]) {
    const current = currentModelReadingEntryV1();
    return current ? respond("", 302, { Location: modelDocumentationHref({ locale, ...current.identity, documentId: current.documentId }) }) : unavailable();
  }
  let modelId: string;
  try { modelId = decodeURIComponent(route[2]); } catch { return unavailable(); }
  const index = resolveSavedModelDocumentIndexV1(modelId, url.searchParams.get("surface"), url.searchParams.get("document"));
  const entry = MODEL_READING_ENTRIES_V1.find(e => e.documentId === index?.documentId);
  if (!index || !entry || input.production !== false && entry.state === "research") return unavailable();
  const view = url.searchParams.get("view") === "presets" ? "presets" : "guide", record = url.searchParams.get("record");
  if (record && record.length > 256) return unavailable();
  const path = modelDocumentPagePathV1(index, locale, view, record);
  const fragment = await input.readAsset(path.replace(/\.json$/, ".html"));
  if (fragment === null) return unavailable();
  const canonical = new URL(modelDocumentationHref({ locale, ...index.identity, documentId: index.documentId, view }), input.canonicalOrigin);
  if (record) canonical.searchParams.set("record", record);
  const title = `${view === "guide" ? locale === "ja" ? "しくみ・数式" : "Mechanisms & equations" : entry.presetLabel[locale]} — ${entry.modelLabel[locale]} | CircleHeart`;
  const body = injectStudioPublicDocumentV1({ clientTemplate: input.clientTemplate, language: locale, canonicalUrl: canonical.href,
    title, description: view === "guide" ? locale === "ja" ? "循環の接続、心筋の構成則、圧・流量の計算と解析方法。" : "Circuit connections, myocardial laws, pressure/flow computation and analysis methods." : entry.summary[locale], bodyHtml: fragment });
  const etag = `"${createHash("sha256").update(body).digest("hex")}"`;
  if (request.headers.get("if-none-match")?.split(",").some(tag => tag.trim().replace(/^W\//, "") === etag)) return new Response(null, { status: 304, headers: { ...headers, ETag: etag } });
  return respond(body, 200, { ETag: etag });
}
