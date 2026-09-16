import { PublicArticleLinkV1 } from "@/components/article/PublicArticleLinkV1";
import { PublicAuthorV1 } from "@/components/site/PublicAuthorV1";
import { PublicSectionHeadingV1 as HomeSectionHeadingV4, PUBLIC_CARD_CLASS_V1 as HOME_CARD_CLASS_V4 } from "@/components/site/PublicDiscoveryV1";
import { FeaturedCoursesV1 } from "@/components/course/CoursePagesV1";
import React from "react";
import {
  ArrowRight,
  BookOpenText,
  FlaskConical,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";

import {
  publicArticlesForLocaleV3,
  readPublicHomeCatalogAsyncV3,
  readPublicHomeCatalogBootstrapV3,
  type PublicArticleCatalogItemV3,
  type PublicCatalogV3,
  type PublicExperimentCatalogItemV3,
} from "@/components/site/PublicCatalogV3";
import {
  completePublicStaticContentHandoffV1,
} from "@/components/site/PublicStaticContentHandoffV1";
import {
  formatStudioPublicArticleDateV1,
} from "@/studio/application/publication/StudioPublicArticlePresentationV1";
import {
  authoringCliDocsHref,
  articleReaderHref,
  articlesHref,
  experimentSnapshotHref,
  experimentsHref,
  newExperimentHref,
  modelLibraryHref,
} from "@/homeLinks";
import { type Locale, localeFromPathname } from "@/localeRouting";

const HOME_SECTION_LIMIT_V4 = 6;
const EMPTY_PUBLIC_CATALOG_V4: PublicCatalogV3 = Object.freeze({
  articles: Object.freeze([]),
  experiments: Object.freeze([]),
});
type HomeCatalogStateV4 = Readonly<{
  locale: Locale;
  catalog: PublicCatalogV3;
}>;

export function homeCatalogForLocaleV4(
  state: HomeCatalogStateV4 | null,
  locale: Locale,
): PublicCatalogV3 | null {
  return state?.locale === locale ? state.catalog : null;
}

/** The browser fallback stamps epoch zero; only real publication dates show. */
function homePublishedDateV4(isoDate: string, locale: Locale): string | null {
  const timestamp = Date.parse(isoDate);
  if (!Number.isFinite(timestamp) || timestamp <= 0) return null;
  return formatStudioPublicArticleDateV1(isoDate, locale);
}

export const Home = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const locale = localeFromPathname(location.pathname);
  const bootstrapCatalog = React.useMemo(
    () => readPublicHomeCatalogBootstrapV3(locale),
    [locale],
  );
  const [catalogState, setCatalogState] = React.useState<HomeCatalogStateV4 | null>(
    bootstrapCatalog === null
      ? null
      : Object.freeze({ locale, catalog: bootstrapCatalog }),
  );
  const catalog = homeCatalogForLocaleV4(catalogState, locale);

  React.useEffect(() => {
    if (bootstrapCatalog !== null) {
      setCatalogState(Object.freeze({ locale, catalog: bootstrapCatalog }));
      return;
    }
    let current = true;
    setCatalogState(null);
    void readPublicHomeCatalogAsyncV3(locale).then((next) => {
      if (current) setCatalogState(Object.freeze({ locale, catalog: next }));
    }).catch(() => {
      // The public landing page remains usable when the catalog is offline.
      if (current) {
        setCatalogState(Object.freeze({
          locale,
          catalog: EMPTY_PUBLIC_CATALOG_V4,
        }));
      }
    });
    return () => {
      current = false;
    };
  }, [bootstrapCatalog, locale]);
  React.useEffect(() => {
    if (catalog !== null) completePublicStaticContentHandoffV1();
  }, [catalog]);

  const localizedArticles = catalog === null
    ? []
    : publicArticlesForLocaleV3(catalog.articles, locale);
  const articles = localizedArticles.slice(0, HOME_SECTION_LIMIT_V4);
  const experiments = catalog?.experiments.slice(0, HOME_SECTION_LIMIT_V4) ?? [];

  return (
    <div
      className="h-full w-full overflow-y-auto overflow-x-hidden bg-wb-app text-wb-text"
      data-public-static-scroll-host="true"
    >
      <main className="mx-auto w-full max-w-5xl px-4 sm:px-6">
        <section className="py-10 sm:py-20">
          <div>
            <h1 className="max-w-3xl text-balance text-[1.85rem] font-bold leading-[1.28] tracking-[-0.035em] text-wb-text sm:text-5xl sm:leading-[1.18]">
              {t("home.headline")}
            </h1>
            <p className="mt-4 max-w-xl text-pretty text-sm leading-7 text-wb-muted sm:mt-5 sm:text-[15px] sm:leading-8">
              {t("home.lead")}
            </p>
            <div className="mt-6 flex flex-wrap gap-3 sm:mt-7">
              <Link
                to={`/${locale}/courses`}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-wb-primary px-7 text-sm font-bold text-white transition-[background-color,transform] duration-150 hover:bg-wb-primary-hover active:scale-[0.98] motion-reduce:transform-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent sm:w-auto"
              >
                <BookOpenText className="h-4 w-4" aria-hidden="true" />
                {locale === "ja" ? "コースから学ぶ" : "Start a course"}
              </Link>
              <Link to={experimentsHref(locale)} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-wb-line bg-wb-panel px-6 text-sm font-semibold hover:bg-wb-hover focus-visible:ring-2 focus-visible:ring-wb-accent sm:w-auto">
                <FlaskConical className="h-4 w-4" aria-hidden="true" />{locale === "ja" ? "シミュレーションを試す" : "Explore simulations"}
              </Link>
            </div>
          </div>
        </section>

        <FeaturedCoursesV1 />

        <section className="pb-14 sm:pb-20" aria-labelledby="home-articles-heading">
          <HomeSectionHeadingV4
            headingId="home-articles-heading"
            icon={<BookOpenText className="h-5 w-5" aria-hidden="true" />}
            title={t("home.sectionArticles")}
            viewAllHref={articlesHref(locale)}
            viewAllLabel={t("home.viewAll")}
          />
          {catalog === null ? (
            <HomeCatalogSkeletonV4 label={t("home.loading")} />
          ) : articles.length === 0 ? (
            <HomeEmptyStateV4
              icon={<BookOpenText className="h-5 w-5" aria-hidden="true" />}
              message={t("home.noArticles")}
            />
          ) : (
            <div className="mt-5 grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
              {articles.map((article) => (
                <HomeArticleCardV4
                  key={article.articleId}
                  article={article}
                  locale={locale}
                />
              ))}
            </div>
          )}
        </section>

        <section className="pb-14 sm:pb-20" aria-labelledby="home-simulations-heading">
          <HomeSectionHeadingV4
            headingId="home-simulations-heading"
            icon={<FlaskConical className="h-5 w-5" aria-hidden="true" />}
            title={t("home.sectionSimulations")}
            viewAllHref={experimentsHref(locale)}
            viewAllLabel={t("home.viewAll")}
          />
          {catalog === null ? (
            <HomeCatalogSkeletonV4 label={t("home.loading")} />
          ) : experiments.length === 0 ? (
            <HomeEmptyStateV4
              icon={<FlaskConical className="h-5 w-5" aria-hidden="true" />}
              message={t("home.noSimulations")}
              actionHref={newExperimentHref(locale)}
              actionLabel={t("home.startFirstSimulation")}
            />
          ) : (
            <div className="mt-5 grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
              {experiments.map((experiment) => (
                <HomeSimulationCardV4
                  key={experiment.record.experimentId}
                  experiment={experiment}
                  locale={locale}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="border-t border-wb-line">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="min-w-0">
            <p className="text-sm font-bold tracking-[-0.02em] text-wb-text">
              {t("common.appName")}
            </p>
            <p className="mt-1 text-xs text-wb-subtle">{t("home.headline")}</p>
          </div>
          <nav
            className="flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-wb-muted"
            aria-label={t("home.footerNavigation")}
          >
            <Link
              className="rounded-sm hover:text-wb-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
              to={experimentsHref(locale)}
            >
              {t("nav.workbench")}
            </Link>
            <Link
              className="rounded-sm hover:text-wb-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
              to={articlesHref(locale)}
            >
              {t("nav.articles")}
            </Link>
            <Link
              className="rounded-sm hover:text-wb-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
              to={modelLibraryHref(locale)}
            >
              {t("home.modelDocumentation")}
            </Link>
            <Link
              className="rounded-sm hover:text-wb-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
              to={authoringCliDocsHref(locale)}
            >
              AI Authoring CLI
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
};

function HomeArticleCardV4({
  article,
  locale,
}: Readonly<{
  article: PublicArticleCatalogItemV3;
  locale: Locale;
}>) {
  const { t } = useTranslation();
  const publishedDate = homePublishedDateV4(article.publishedAt, locale);
  return (
    <PublicArticleLinkV1
      to={articleReaderHref({ articleId: article.publicSlug, locale })}
      className={HOME_CARD_CLASS_V4}
    >
      <span className="line-clamp-3 break-words text-[15px] font-bold leading-6 tracking-[-0.015em] text-wb-text sm:text-base">
        {article.title}
      </span>
      <span className="mt-2 line-clamp-2 break-words text-[13px] leading-5 text-wb-muted">
        {article.excerpt ?? t("home.articleFallback")}
      </span>
      <span className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-4">
      <PublicAuthorV1 author={article.author} locale={locale} />
      {publishedDate !== null && (
        <time
          className="text-xs text-wb-subtle"
          dateTime={article.publishedAt}
        >
          {publishedDate}
        </time>
      )}
      </span>
    </PublicArticleLinkV1>
  );
}

function HomeSimulationCardV4({
  experiment,
  locale,
}: Readonly<{
  experiment: PublicExperimentCatalogItemV3;
  locale: Locale;
}>) {
  const { t } = useTranslation();
  const updatedDate = homePublishedDateV4(experiment.record.updatedAt, locale);
  return (
    <Link
      to={experimentSnapshotHref({
        locale,
        snapshotId: experiment.snapshotId,
      })}
      className={HOME_CARD_CLASS_V4}
    >
      <span className="line-clamp-3 break-words text-[15px] font-bold leading-6 tracking-[-0.015em] text-wb-text sm:text-base">
        {experiment.record.title}
      </span>
      <span className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-4 text-xs leading-5 text-wb-subtle">
        <PublicAuthorV1 author={experiment.author} locale={locale} />
        <span>
        {t("home.simulationMeta", {
          count: experiment.scenarioCount,
          date: updatedDate ?? "",
        })}</span>
      </span>
    </Link>
  );
}

function HomeCatalogSkeletonV4({ label }: Readonly<{ label: string }>) {
  return (
    <div
      className="mt-5 grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3"
      role="status"
    >
      <span className="sr-only">{label}</span>
      {[0, 1, 2].map((index) => (
        <div
          className="h-36 rounded-2xl border border-wb-line bg-wb-panel p-5 motion-safe:animate-pulse"
          key={index}
          aria-hidden="true"
        >
          <div className="h-4 w-4/5 rounded-full bg-wb-soft" />
          <div className="mt-3 h-3 w-full rounded-full bg-wb-soft" />
          <div className="mt-2 h-3 w-2/3 rounded-full bg-wb-soft" />
          <div className="mt-5 h-3 w-20 rounded-full bg-wb-soft" />
        </div>
      ))}
    </div>
  );
}

function HomeEmptyStateV4({
  actionHref,
  actionLabel,
  icon,
  message,
}: Readonly<{
  actionHref?: string;
  actionLabel?: string;
  icon: React.ReactNode;
  message: string;
}>) {
  return (
    <div className="mt-5 rounded-2xl border border-dashed border-wb-line-strong px-6 py-12 text-center">
      <span
        className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-wb-soft text-wb-subtle"
        aria-hidden="true"
      >
        {icon}
      </span>
      <p className="mt-4 text-sm leading-6 text-wb-muted">{message}</p>
      {actionHref !== undefined && actionLabel !== undefined && (
        <Link
          to={actionHref}
          className="mt-5 inline-flex h-10 items-center gap-2 rounded-full border border-wb-line-strong bg-wb-panel px-5 text-[13px] font-semibold text-wb-text transition-[background-color,transform] duration-150 hover:bg-wb-hover active:scale-[0.98] motion-reduce:transform-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
        >
          {actionLabel}
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}
