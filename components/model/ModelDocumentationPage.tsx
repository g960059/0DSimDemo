import React from "react";
import { ArrowLeft, FileQuestion } from "lucide-react";
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { SavedModelDocumentationV1 } from "./SavedModelDocumentationV1";
import { resolveSavedModelDocumentV1 } from "@/studio/presentation/modelDocumentation/SavedModelDocumentLibraryV1";

import { homeHref, modelDocumentationHref } from "@/homeLinks";
import { localeFromPathname, type Locale } from "@/localeRouting";
import {
  resolveRegisteredModelDocumentationV1,
  REGISTERED_MODEL_DOCUMENTATION_OPTIONS_V1,
} from "@/studio/presentation/modelDocumentation/RegisteredModelDocumentationV1";

const UNAVAILABLE_COPY = Object.freeze({
  ja: Object.freeze({
    title: "数理モデル文書を表示できません",
    body:
      "このexact modelとModel Surface releaseの組み合わせに対応する文書は、このclientには登録されていません。別のSurfaceの説明を代用することはありません。",
    back: "ホームへ戻る",
  }),
  en: Object.freeze({
    title: "Model documentation is unavailable",
    body:
      "This client has no documentation registered for this exact model and Model Surface release pair. Documentation from another Surface is never substituted.",
    back: "Back to home",
  }),
} as const);

export function ModelDocumentationPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { modelId } = useParams<{ modelId: string }>();
  const [search] = useSearchParams();
  const locale = localeFromPathname(location.pathname);
  const surfaceReleaseId = search.get("surface");
  const identity = resolveRegisteredModelDocumentationV1(
    modelId,
    surfaceReleaseId,
  );
  const Document = React.useMemo(() => React.lazy(async () => {
    const document = await resolveSavedModelDocumentV1(modelId, surfaceReleaseId);
    if (!document) throw new Error("Documentation is unavailable for this exact model and Surface");
    return { default: ({ locale }: { locale: Locale }) => <SavedModelDocumentationV1 document={document} locale={locale} /> };
  }), [modelId, surfaceReleaseId]);

  if (identity === null) {
    const text = UNAVAILABLE_COPY[locale];
    return (
      <div
        className="flex h-full overflow-y-auto bg-wb-app px-5 py-12 text-wb-text sm:px-8"
        data-testid="model-documentation-unavailable-v1"
      >
        <main className="m-auto w-full max-w-xl rounded-2xl border border-wb-line bg-wb-panel p-6 text-center sm:p-8">
          <FileQuestion className="mx-auto h-8 w-8 text-wb-subtle" aria-hidden="true" />
          <h1 className="mt-5 text-xl font-semibold">{text.title}</h1>
          <p className="mt-3 text-sm leading-7 text-wb-muted">{text.body}</p>
          <Link
            to={homeHref(locale)}
            className="mt-6 inline-flex min-h-10 items-center gap-2 rounded-md bg-wb-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-wb-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {text.back}
          </Link>
        </main>
      </div>
    );
  }

  return <div className="flex h-full min-h-0 flex-col bg-wb-app text-wb-text">
    <div className="flex shrink-0 items-center justify-end gap-3 border-b border-wb-line px-5 py-2">
      <label htmlFor="documentation-model-version" className="text-xs text-wb-muted">{locale === "ja" ? "モデル" : "Model"}</label>
      <select id="documentation-model-version" value={identity!.modelId}
        className="max-w-[75%] rounded border border-wb-line bg-wb-panel px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
        onChange={event => {
          const entry = REGISTERED_MODEL_DOCUMENTATION_OPTIONS_V1.find(e => e.identity.modelId === event.target.value);
          if (entry) navigate(modelDocumentationHref({ locale, modelId: entry.identity.modelId, surfaceReleaseId: entry.identity.surfaceReleaseId }));
        }}>
        {REGISTERED_MODEL_DOCUMENTATION_OPTIONS_V1.map(e => <option key={e.identity.modelId} value={e.identity.modelId}>
          {e.label}{e.candidate ? locale === "ja" ? " · ローカル候補" : " · local candidate" : ""}
        </option>)}
      </select>
    </div>
    <div className="min-h-0 flex-1" key={identity!.modelId}>
      <React.Suspense fallback={<p className="p-8 text-sm text-wb-muted" role="status">{locale === "ja" ? "文書を読み込んでいます…" : "Loading documentation…"}</p>}>
        <Document locale={locale} />
      </React.Suspense>
    </div>
  </div>;
}

export default ModelDocumentationPage;
