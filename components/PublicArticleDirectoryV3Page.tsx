import React from "react";
import { BookOpenText } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";

import { articleReaderHref } from "@/homeLinks";
import { localeFromPathname } from "@/localeRouting";
import {
  publicArticlesForLocaleV3,
  readPublicCatalogAsyncV3,
} from "@/components/site/PublicCatalogV3";

export function PublicArticleDirectoryV3Page() {
  const { t } = useTranslation();
  const location = useLocation();
  const locale = localeFromPathname(location.pathname);
  const [state, setState] = React.useState<
    | Readonly<{ kind: "loading" }>
    | Readonly<{ kind: "ready"; articles: Awaited<ReturnType<typeof readPublicCatalogAsyncV3>>["articles"] }>
    | Readonly<{ kind: "error"; message: string }>
  >({ kind: "loading" });
  React.useEffect(() => {
    let current = true;
    void readPublicCatalogAsyncV3().then((catalog) => {
      if (current) setState({ kind: "ready", articles: catalog.articles });
    }).catch((error) => {
      if (current) {
        setState({
          kind: "error",
          message: error instanceof Error ? error.message : String(error),
        });
      }
    });
    return () => {
      current = false;
    };
  }, []);

  const articles = state.kind === "ready"
    ? publicArticlesForLocaleV3(state.articles, locale)
    : [];

  return (
    <div className="h-full overflow-y-auto bg-wb-app text-wb-text" data-testid="public-article-directory-v3">
      <main className="mx-auto w-full max-w-4xl px-5 py-12 sm:px-8 sm:py-16">
        <h1 className="text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
          {t("publicArticles.title")}
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-wb-muted">
          {t("publicArticles.description")}
        </p>

        {state.kind === "loading" ? (
          <p className="mt-10 text-sm text-wb-muted" role="status">
            {t("articleLibrary.loading")}
          </p>
        ) : state.kind === "error" ? (
          <p className="mt-10 rounded-xl bg-wb-danger-soft p-4 text-sm text-wb-danger" role="alert">
            {state.message}
          </p>
        ) : articles.length === 0 ? (
          <EmptyDirectoryV3
            icon={<BookOpenText className="h-6 w-6" aria-hidden="true" />}
            title={t("publicArticles.emptyTitle")}
            description={t("publicArticles.emptyDescription")}
          />
        ) : (
          <ul className="mt-10 grid gap-3 sm:grid-cols-2 sm:gap-4">
            {articles.map((article) => (
              <li key={article.articleId}>
                <Link
                  to={articleReaderHref({ articleId: article.publicSlug, locale })}
                  className="group flex h-full min-w-0 flex-col rounded-2xl border border-wb-line bg-wb-panel p-5 transition-[background-color,border-color,box-shadow] duration-150 hover:border-wb-line-strong hover:bg-wb-hover/30 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
                >
                  <span className="line-clamp-3 break-words text-base font-bold leading-6 tracking-[-0.015em] text-wb-text">
                    {article.title}
                  </span>
                  <span className="mt-2 line-clamp-3 break-words text-[13px] leading-5 text-wb-muted">
                    {article.excerpt ?? t("publicArticles.articleFallback")}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}

function EmptyDirectoryV3({
  description,
  icon,
  title,
}: Readonly<{
  description: string;
  icon: React.ReactNode;
  title: string;
}>) {
  return (
    <section className="mt-14 py-10 text-center">
      <span className="mx-auto flex h-10 w-10 items-center justify-center text-wb-subtle">
        {icon}
      </span>
      <h2 className="mt-3 text-sm font-semibold">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-xs leading-6 text-wb-muted">
        {description}
      </p>
    </section>
  );
}

export default PublicArticleDirectoryV3Page;
