import React from "react";
import {
  ArrowRight,
  BookOpenText,
  FilePlus2,
  PencilLine,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";

import {
  articleEditorHref,
  articleReaderHref,
  newArticleEditorHref,
} from "@/homeLinks";
import { localeFromPathname } from "@/localeRouting";
import type { StudioArticleDraftV2 } from "@/studio/contracts/v2/article";
import {
  StudioBrowserContentStoreV3,
} from "@/studio/infrastructure/browser/StudioBrowserContentStoreV3";
import {
  publicArticleExcerptV3,
} from "@/components/site/PublicCatalogPresentationV3";

type ArticleLibraryStateV3 =
  | Readonly<{ kind: "ready"; articles: readonly StudioArticleDraftV2[] }>
  | Readonly<{ kind: "error"; message: string }>;

export function ArticleLibraryV3Page() {
  const { t } = useTranslation();
  const location = useLocation();
  const locale = localeFromPathname(location.pathname);
  const store = React.useMemo(() => new StudioBrowserContentStoreV3(), []);
  const [state] = React.useState<ArticleLibraryStateV3>(() => {
    try {
      return {
        kind: "ready",
        articles: Object.freeze([...store.listArticles()].sort((left, right) =>
          left.title.localeCompare(right.title))),
      };
    } catch (error) {
      return {
        kind: "error",
        message: error instanceof Error ? error.message : String(error),
      };
    }
  });

  return (
    <div
      className="h-full overflow-y-auto bg-wb-app text-wb-text"
      data-testid="article-library-v3"
    >
      <main className="mx-auto w-full max-w-4xl px-5 py-10 sm:px-8 sm:py-14">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-wb-accent">
              {t("articleLibrary.eyebrow")}
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              {t("articleLibrary.heading")}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-wb-muted">
              {t("articleLibrary.description")}
            </p>
          </div>
          <Link
            to={newArticleEditorHref(locale)}
            className="inline-flex min-h-10 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-wb-primary px-3 text-xs font-semibold text-white transition-[background-color,transform] duration-150 hover:bg-wb-primary-hover active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
          >
            <FilePlus2 className="h-3.5 w-3.5" aria-hidden="true" />
            {t("articleLibrary.new")}
          </Link>
        </div>

        {state.kind === "error" ? (
          <p className="mt-8 rounded-xl bg-wb-danger-soft p-4 text-sm text-wb-danger" role="alert">
            {state.message}
          </p>
        ) : state.articles.length === 0 ? (
          <section className="mt-12 py-12 text-center">
            <BookOpenText className="mx-auto h-7 w-7 text-wb-subtle" aria-hidden="true" />
            <h3 className="mt-4 text-sm font-semibold">
              {t("articleLibrary.emptyTitle")}
            </h3>
            <p className="mt-2 text-xs leading-6 text-wb-muted">
              {t("articleLibrary.emptyDescription")}
            </p>
          </section>
        ) : (
          <ul className="mt-10 divide-y divide-wb-line" aria-label={t("articleLibrary.saved") }>
            {state.articles.map((article) => {
              return (
                <li key={article.articleId} className="group py-5 sm:py-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-base font-semibold tracking-tight">
                        {article.title || t("articleEditor.untitled")}
                      </h3>
                      <p className="mt-1 truncate text-xs leading-5 text-wb-subtle">
                        <span className={article.visibility === "public"
                          ? "text-wb-accent"
                          : "text-wb-muted"}
                        >
                          {article.visibility === "public"
                            ? t("articleLibrary.statusPublic")
                            : t("articleLibrary.statusDraft")}
                        </span>
                        <span aria-hidden="true"> · </span>
                        <span>
                          {publicArticleExcerptV3(article.blocks)
                            ?? t("articleLibrary.articleFallback")}
                        </span>
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Link
                        to={articleEditorHref({ articleId: article.articleId, locale })}
                        className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-wb-muted transition-[color,background-color,transform] duration-150 hover:bg-wb-hover hover:text-wb-text active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
                      >
                        <PencilLine className="h-3.5 w-3.5" aria-hidden="true" />
                        {t("articleLibrary.edit")}
                      </Link>
                      <Link
                        to={articleReaderHref({ articleId: article.articleId, locale })}
                        className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-wb-accent transition-[color,background-color,transform] duration-150 hover:bg-wb-hover active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
                      >
                        {t("articleLibrary.read")}
                        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </Link>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}

export default ArticleLibraryV3Page;
