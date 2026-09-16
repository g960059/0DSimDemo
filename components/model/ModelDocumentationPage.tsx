import React from "react";
import { Navigate, useLocation, useParams, useSearchParams } from "react-router-dom";
import "katex/dist/katex.min.css";
import { modelDocumentationHref } from "@/homeLinks";
import { localeFromPathname, type Locale } from "@/localeRouting";
import { resolveSavedModelDocumentIndexV1 } from "@/studio/presentation/modelDocumentation/SavedModelDocumentCatalogV1";
import { MODEL_READING_ENTRIES_V1, currentModelReadingEntryV1, type ModelReadingEntryV1 } from "@/studio/presentation/modelDocumentation/ModelReadingCatalogV1";
import { loadModelDocumentPageV1, retryModelDocumentPageV1 } from "@/studio/presentation/modelDocumentation/ModelDocumentPageLoaderV1";
import { ModelDocumentationUnavailableV1, ModelDocumentationViewV1 } from "./ModelDocumentationViewV1";
import { ModelDocumentationLoadingV1 } from "./ModelDocumentationLoadingV1";

class ReadingBoundary extends React.Component<React.PropsWithChildren<{ locale: Locale; routeKey: string; onRetry: () => void }>, { failed: boolean; routeKey: string }> {
  state = { failed: false, routeKey: this.props.routeKey };
  static getDerivedStateFromProps(props: { routeKey: string }, state: { routeKey: string }) {
    return props.routeKey === state.routeKey ? null : { routeKey: props.routeKey, failed: false };
  }
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <div className="h-full overflow-y-auto bg-wb-app">
    <ModelDocumentationUnavailableV1 locale={this.props.locale} retry={() => { this.props.onRetry(); this.setState({ failed: false }); }} />
  </div> : this.props.children; }
}

function DocumentContent({ entry, locale, view, recordId }: {
  entry: ModelReadingEntryV1; locale: Locale; view: "guide" | "presets"; recordId: string | null;
}) {
  const page = React.use(loadModelDocumentPageV1(entry, locale, view, recordId));
  return <ModelDocumentationViewV1 page={page} entry={entry} />;
}

export function ModelDocumentationPage() {
  const location = useLocation(), { modelId } = useParams<{ modelId: string }>(), [search] = useSearchParams();
  const locale = localeFromPathname(location.pathname);
  const identity = resolveSavedModelDocumentIndexV1(modelId, search.get("surface"), search.get("document"));
  const entry = MODEL_READING_ENTRIES_V1.find(e => e.documentId === identity?.documentId);
  const view = search.get("view") === "presets" ? "presets" : "guide", recordId = search.get("record");
  if (!modelId) {
    const current = currentModelReadingEntryV1();
    return current ? <Navigate to={modelDocumentationHref({ locale, ...current.identity, documentId: current.documentId })} replace /> : <ModelDocumentationUnavailableV1 locale={locale} />;
  }
  if (!entry) return <ModelDocumentationUnavailableV1 locale={locale} />;
  return <ReadingBoundary locale={locale} routeKey={`${entry.documentId}/${locale}/${view}/${recordId}`} onRetry={() => retryModelDocumentPageV1(entry, locale, view, recordId)}>
    <React.Suspense fallback={<ModelDocumentationLoadingV1 />}><DocumentContent entry={entry} locale={locale} view={view} recordId={recordId} /></React.Suspense>
  </ReadingBoundary>;
}

export default ModelDocumentationPage;
