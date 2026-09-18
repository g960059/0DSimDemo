import React from "react";
import {
  ArrowRight,
  BookOpenText,
  PencilLine,
  Trash2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";
import { ManagementPageHeaderV1 } from "@/components/management/ContentManagementV1";

import {
  articleEditorHref,
  articlePreviewHref,
  newArticleEditorHref,
} from "@/homeLinks";
import { localeFromPathname } from "@/localeRouting";
import {
  BrowserContentStore,
} from "@/studio/infrastructure/browser/BrowserContentStore";
import {
  createStudioSupabaseContentRepositoryV1,
} from "@/studio/infrastructure/supabase/StudioSupabaseContentRepositoryV1";

type ArticleLibraryItemV3 = Readonly<{
  articleId: string;
  version: number;
  visibility: "draft" | "public";
  title: string;
  updatedAt: string | null;
}>;

type ArticleLibraryStateV3 =
  | Readonly<{ kind: "loading" }>
  | Readonly<{ kind: "ready"; items: readonly ArticleLibraryItemV3[] }>
  | Readonly<{ kind: "error"; message: string }>;

export function ArticleLibraryPage() {
  const { t } = useTranslation();
  const location = useLocation();
  const locale = localeFromPathname(location.pathname);
  const store = React.useMemo(() => new BrowserContentStore(), []);
  const remoteRepository = React.useMemo(
    createStudioSupabaseContentRepositoryV1,
    [],
  );
  const [state, setState] = React.useState<ArticleLibraryStateV3>({
    kind: "loading",
  });
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [deletingArticleId, setDeletingArticleId] = React.useState<string | null>(
    null,
  );

  const readArticleItems = React.useCallback(async () => {
    const items: readonly ArticleLibraryItemV3[] = remoteRepository === null
      ? store.listArticles().map((article) => Object.freeze({
          articleId: article.articleId,
          version: article.draftVersion,
          visibility: article.visibility,
          title: article.title,
          updatedAt: null,
        }))
      : (await remoteRepository.listMyArticles()).items.map((resource) =>
          Object.freeze({
            articleId: resource.articleId,
            version: resource.version,
            visibility: resource.visibility,
            title: resource.title,
            updatedAt: resource.updatedAt,
          }));
    return Object.freeze([...items].sort((left, right) => {
      if (left.updatedAt !== null && right.updatedAt !== null) {
        return right.updatedAt.localeCompare(left.updatedAt);
      }
      if (left.updatedAt !== null) return -1;
      if (right.updatedAt !== null) return 1;
      return left.title.localeCompare(right.title);
    }));
  }, [remoteRepository, store]);

  React.useEffect(() => {
    let current = true;
    void readArticleItems().then((items) => {
      if (current) setState({ kind: "ready", items });
    }).catch((error) => {
      if (current) {
        setState({ kind: "error", message: errorMessageV3(error) });
      }
    });
    return () => {
      current = false;
    };
  }, [readArticleItems]);

  const deleteArticle = React.useCallback(async (article: ArticleLibraryItemV3) => {
    if (deletingArticleId !== null) return;
    if (!window.confirm(t("articleLibrary.deleteConfirm"))) return;
    setActionError(null);
    setDeletingArticleId(article.articleId);
    try {
      if (remoteRepository === null) {
        store.deleteArticle(article.articleId);
      } else {
        await remoteRepository.deleteArticle(
          article.articleId,
          article.version,
        );
      }
      setState({ kind: "ready", items: await readArticleItems() });
    } catch (error) {
      setActionError(errorMessageV3(error));
    } finally {
      setDeletingArticleId(null);
    }
  }, [deletingArticleId, readArticleItems, remoteRepository, store, t]);

  return (
    <div
      className="management-page"
      data-testid="article-library-v3"
    >
      <main>
        <ManagementPageHeaderV1
          title={t("management.manageArticles")}
          createHref={newArticleEditorHref(locale)}
          createLabel={t("articleLibrary.new")}
        />

        {actionError !== null && (
          <p
            className="mt-6 rounded-xl bg-wb-danger-soft p-4 text-sm text-wb-danger"
            role="alert"
          >
            {t("articleLibrary.deleteFailed", { message: actionError })}
          </p>
        )}

        {state.kind === "loading" ? (
          <p className="mt-8 text-sm text-wb-muted" role="status">
            {t("articleLibrary.loading")}
          </p>
        ) : state.kind === "error" ? (
          <p className="mt-8 rounded-xl bg-wb-danger-soft p-4 text-sm text-wb-danger" role="alert">
            {state.message}
          </p>
        ) : state.items.length === 0 ? (
          <section className="mt-12 py-12 text-center">
            <BookOpenText className="mx-auto h-7 w-7 text-wb-subtle" aria-hidden="true" />
            <h2 className="mt-4 text-sm font-semibold">
              {t("articleLibrary.emptyTitle")}
            </h2>
            <p className="mt-2 text-xs leading-6 text-wb-muted">
              {t("articleLibrary.emptyDescription")}
            </p>
          </section>
        ) : (
          <ul className="management-list" aria-label={t("articleLibrary.saved") }>
            {state.items.map((article) => {
              const { updatedAt } = article;
              return (
                <li key={article.articleId} className="management-row">
                  <div className="management-row-content">
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate text-base font-semibold tracking-tight">
                        <Link to={articleEditorHref({ articleId: article.articleId, locale })} className="rounded hover:text-wb-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent">
                          {article.title || t("articleEditor.untitled")}
                        </Link>
                      </h2>
                      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs leading-5 text-wb-subtle">
                        <span className={article.visibility === "public"
                          ? "text-wb-accent"
                          : "text-wb-muted"}
                        >
                        {article.visibility === "public"
                            ? t("articleLibrary.statusPublic")
                            : t("articleLibrary.statusDraft")}
                        </span>
                        <span aria-hidden="true"> · </span>
                        {updatedAt === null ? (
                          <span>{t("articleLibrary.savedLocally")}</span>
                        ) : (
                          <time dateTime={updatedAt}>
                            {t("articleLibrary.updated", {
                              date: formatArticleUpdatedAtV3(updatedAt, locale),
                            })}
                          </time>
                        )}
                        <span aria-hidden="true">·</span>
                        <Link
                          to={articlePreviewHref({ articleId: article.articleId, locale })}
                          className="inline-flex min-h-8 items-center gap-1 rounded text-wb-muted underline-offset-4 hover:text-wb-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
                        >
                          {t("management.preview")}
                          <ArrowRight className="h-3 w-3" aria-hidden="true" />
                        </Link>
                      </div>
                    </div>
                    <div className="management-row-actions">
                      <Link
                        to={articleEditorHref({ articleId: article.articleId, locale })}
                        className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-wb-muted transition-[color,background-color,transform] duration-150 hover:bg-wb-hover hover:text-wb-text active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
                      >
                        <PencilLine className="h-3.5 w-3.5" aria-hidden="true" />
                        {t("articleLibrary.edit")}
                      </Link>
                      <button
                        type="button"
                        onClick={() => void deleteArticle(article)}
                        disabled={deletingArticleId !== null}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-wb-muted transition-[color,background-color,transform] duration-150 hover:bg-wb-danger-soft hover:text-wb-danger active:scale-[0.97] disabled:cursor-wait disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-danger"
                        aria-label={t("articleLibrary.delete")}
                        title={t("articleLibrary.delete")}
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
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

function formatArticleUpdatedAtV3(value: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function errorMessageV3(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export default ArticleLibraryPage;
