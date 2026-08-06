import React from "react";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpenText,
  FlaskConical,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";

import {
  readPublicCatalogAsyncV3,
  type PublicCatalogV3,
} from "@/components/site/PublicCatalogV3";
import {
  articleReaderHref,
  articlesHref,
  experimentSnapshotHref,
  experimentsHref,
  newExperimentHref,
} from "@/homeLinks";
import { localeFromPathname } from "@/localeRouting";

export const Home = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const locale = localeFromPathname(location.pathname);
  const [catalog, setCatalog] = React.useState<PublicCatalogV3>(() =>
    Object.freeze({ articles: Object.freeze([]), experiments: Object.freeze([]) }));

  React.useEffect(() => {
    let current = true;
    void readPublicCatalogAsyncV3().then((next) => {
      if (current) setCatalog(next);
    }).catch(() => {
      // The public landing page remains usable when the catalog is offline.
    });
    return () => {
      current = false;
    };
  }, []);

  return (
    <div className="h-full w-full overflow-y-auto bg-wb-app text-wb-text">
      <main>
        <section className="px-6 py-16 sm:px-10 sm:py-24">
          <div className="mx-auto max-w-5xl">
            <h1 className="max-w-3xl text-4xl font-semibold leading-[1.08] tracking-[-0.04em] text-wb-text sm:text-6xl">
              {t("home.headline")}
            </h1>
            <p className="mt-6 max-w-2xl text-sm leading-7 text-wb-muted sm:text-base">
              {t("home.lead")}
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link
                to={newExperimentHref(locale)}
                className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-wb-primary px-5 text-sm font-semibold text-white transition-[background-color,transform] duration-150 hover:bg-wb-primary-hover active:scale-[0.98] motion-reduce:transform-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
              >
                <FlaskConical className="h-4 w-4" aria-hidden="true" />
                {t("home.startExperiment")}
              </Link>
              <Link
                to={articlesHref(locale)}
                className="inline-flex min-h-11 items-center gap-2 rounded-lg px-4 text-sm font-semibold text-wb-muted transition-[color,background-color,transform] duration-150 hover:bg-wb-hover hover:text-wb-text active:scale-[0.98] motion-reduce:transform-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
              >
                <BookOpenText className="h-4 w-4" aria-hidden="true" />
                {t("home.readArticles")}
              </Link>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-5xl px-6 pb-24 sm:px-10">
          <div className="grid gap-x-14 lg:grid-cols-2">
            <HomeCatalogSectionV3
              icon={<FlaskConical className="h-4 w-4" aria-hidden="true" />}
              title={t("home.featuredExperiments")}
              empty={t("home.noFeaturedExperiments")}
              moreLabel={t("home.moreExperiments")}
              moreHref={experimentsHref(locale)}
            >
              {catalog.experiments.slice(0, 4).map((experiment) => (
                <HomeCatalogLinkV3
                  key={experiment.record.experimentId}
                  title={experiment.record.title}
                  supportingText={t("home.simulationMeta", {
                    count: experiment.scenarioCount,
                    date: new Intl.DateTimeFormat(locale, {
                      dateStyle: "medium",
                    }).format(new Date(experiment.record.updatedAt)),
                  })}
                  to={experimentSnapshotHref({
                    locale,
                    snapshotId: experiment.snapshotId,
                  })}
                />
              ))}
            </HomeCatalogSectionV3>

            <HomeCatalogSectionV3
              icon={<BookOpenText className="h-4 w-4" aria-hidden="true" />}
              title={t("home.featuredArticles")}
              empty={t("home.noFeaturedArticles")}
              moreLabel={t("home.moreArticles")}
              moreHref={articlesHref(locale)}
            >
              {catalog.articles.slice(0, 4).map((article) => (
                <HomeCatalogLinkV3
                  key={article.articleId}
                  title={article.title}
                  supportingText={article.excerpt ?? t("home.articleFallback")}
                  to={articleReaderHref({
                    articleId: article.articleId,
                    locale,
                  })}
                />
              ))}
            </HomeCatalogSectionV3>
          </div>
        </div>
      </main>

      <footer className="border-t border-wb-line px-6 py-8 text-xs text-wb-subtle sm:px-10">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-5 gap-y-2">
          <span className="font-semibold text-wb-muted">{t("common.appName")}</span>
          <Link className="hover:text-wb-text" to={experimentsHref(locale)}>
            {t("nav.workbench")}
          </Link>
          <Link className="hover:text-wb-text" to={articlesHref(locale)}>
            {t("nav.articles")}
          </Link>
        </div>
      </footer>
    </div>
  );
};

function HomeCatalogSectionV3({
  children,
  empty,
  icon,
  moreHref,
  moreLabel,
  title,
}: Readonly<{
  children: React.ReactNode;
  empty: string;
  icon: React.ReactNode;
  moreHref: string;
  moreLabel: string;
  title: string;
}>) {
  const items = React.Children.toArray(children);
  return (
    <section className="border-t border-wb-line py-10 sm:py-12">
      <div className="flex items-center justify-between gap-5">
        <h2 className="flex items-center gap-2.5 text-lg font-semibold tracking-[-0.025em] sm:text-xl">
          <span className="text-wb-accent">{icon}</span>
          <span>{title}</span>
        </h2>
        <Link
          to={moreHref}
          className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold text-wb-muted hover:text-wb-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
        >
          {moreLabel}
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>
      {items.length === 0 ? (
        <p className="mt-8 text-sm leading-6 text-wb-subtle">{empty}</p>
      ) : (
        <div className="mt-5 divide-y divide-wb-line/70">
          {items}
        </div>
      )}
    </section>
  );
}

function HomeCatalogLinkV3({
  supportingText,
  title,
  to,
}: Readonly<{
  supportingText: string;
  title: string;
  to: string;
}>) {
  return (
    <Link
      to={to}
      className="group -mx-3 flex min-h-20 items-center gap-4 rounded-xl px-3 py-4 transition-[background-color,transform] duration-150 hover:bg-wb-hover active:scale-[0.995] motion-reduce:transform-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
    >
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold tracking-[-0.01em] text-wb-text">
          {title}
        </span>
        <span className="mt-1 block truncate text-xs leading-5 text-wb-subtle">
          {supportingText}
        </span>
      </span>
      <ArrowUpRight className="h-4 w-4 shrink-0 text-wb-subtle transition-[color,transform] duration-150 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-wb-text motion-reduce:transform-none" aria-hidden="true" />
    </Link>
  );
}
