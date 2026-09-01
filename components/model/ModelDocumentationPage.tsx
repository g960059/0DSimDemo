import React from "react";
import { ArrowLeft, FileQuestion } from "lucide-react";
import { Link, useLocation, useParams, useSearchParams } from "react-router-dom";

import { MainWireStandard66DocumentationV1 } from
  "@/components/model/MainWireStandard66DocumentationV1";
import { MainWireStandard68DocumentationV1 } from
  "@/components/model/MainWireStandard68DocumentationV1";
import { homeHref } from "@/homeLinks";
import { localeFromPathname } from "@/localeRouting";
import {
  resolveMainWireStandard66DocumentationFactsV1,
} from "@/studio/presentation/modelDocumentation/MainWireStandard66DocumentationFactsV1";
import {
  resolveMainWireStandard68DocumentationFactsV1,
} from "@/studio/presentation/modelDocumentation/MainWireStandard68DocumentationFactsV1";
import {
  resolveRegisteredModelDocumentationV1,
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
  const { modelId } = useParams<{ modelId: string }>();
  const [search] = useSearchParams();
  const locale = localeFromPathname(location.pathname);
  const identity = resolveRegisteredModelDocumentationV1(
    modelId,
    search.get("surface"),
  );
  const standard68Facts = identity === null
    ? null
    : resolveMainWireStandard68DocumentationFactsV1(identity);
  const legacyFacts = identity === null || standard68Facts !== null
    ? null
    : resolveMainWireStandard66DocumentationFactsV1(identity);

  if (standard68Facts === null && legacyFacts === null) {
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

  return standard68Facts !== null
    ? <MainWireStandard68DocumentationV1 facts={standard68Facts} locale={locale} />
    : <MainWireStandard66DocumentationV1 facts={legacyFacts!} locale={locale} />;
}

export default ModelDocumentationPage;
