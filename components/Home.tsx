import React from "react";
import {
  ArrowRight,
  BookOpenText,
  FlaskConical,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";

import {
  readPublicCatalogAsyncV3,
  type PublicArticleCatalogItemV3,
  type PublicCatalogV3,
  type PublicExperimentCatalogItemV3,
} from "@/components/site/PublicCatalogV3";
import {
  authoringCliDocsHref,
  articleReaderHref,
  articlesHref,
  experimentSnapshotHref,
  experimentsHref,
  newExperimentHref,
} from "@/homeLinks";
import { type Locale, localeFromPathname } from "@/localeRouting";

const HOME_SECTION_LIMIT_V4 = 6;

/**
 * Deterministic accent per durable content identity: a card keeps its hue
 * across visits without storing any presentation data.
 */
const HOME_TILE_ACCENTS_V4 = Object.freeze([
  Object.freeze({ tile: "bg-sky-500/15", icon: "text-sky-500" }),
  Object.freeze({ tile: "bg-teal-500/15", icon: "text-teal-500" }),
  Object.freeze({ tile: "bg-violet-500/15", icon: "text-violet-500" }),
  Object.freeze({ tile: "bg-rose-500/15", icon: "text-rose-500" }),
  Object.freeze({ tile: "bg-amber-500/15", icon: "text-amber-500" }),
  Object.freeze({ tile: "bg-emerald-500/15", icon: "text-emerald-500" }),
]);

function homeTileAccentV4(contentId: string) {
  let hash = 0;
  for (const character of contentId) {
    hash = ((hash * 31) + (character.codePointAt(0) ?? 0)) >>> 0;
  }
  return HOME_TILE_ACCENTS_V4[hash % HOME_TILE_ACCENTS_V4.length];
}

/** The browser fallback stamps epoch zero; only real publication dates show. */
function homePublishedDateV4(isoDate: string, locale: Locale): string | null {
  const timestamp = Date.parse(isoDate);
  if (!Number.isFinite(timestamp) || timestamp <= 0) return null;
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" })
    .format(timestamp);
}

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

  const articles = catalog.articles.slice(0, HOME_SECTION_LIMIT_V4);
  const experiments = catalog.experiments.slice(0, HOME_SECTION_LIMIT_V4);

  return (
    <div className="h-full w-full overflow-y-auto overflow-x-hidden bg-wb-app text-wb-text">
      <main className="mx-auto w-full max-w-5xl px-4 sm:px-6">
        <section className="relative py-14 sm:py-24">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-10 right-0 h-56 w-56 rounded-full bg-wb-accent-soft blur-3xl sm:-top-16 sm:h-80 sm:w-80"
          />
          <div className="relative">
            <h1 className="max-w-3xl text-balance text-[1.9rem] font-bold leading-[1.28] tracking-[-0.035em] text-wb-text sm:text-5xl sm:leading-[1.18]">
              {t("home.headline")}
            </h1>
            <p className="mt-5 max-w-xl text-pretty text-sm leading-7 text-wb-muted sm:text-[15px] sm:leading-8">
              {t("home.lead")}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                to={newExperimentHref(locale)}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-wb-primary px-7 text-sm font-bold text-white transition-[background-color,transform] duration-150 hover:bg-wb-primary-hover active:scale-[0.98] motion-reduce:transform-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent sm:h-11"
              >
                <FlaskConical className="h-4 w-4" aria-hidden="true" />
                {t("home.startExperiment")}
              </Link>
              <Link
                to={articlesHref(locale)}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-wb-line-strong bg-wb-panel px-6 text-sm font-semibold text-wb-text transition-[background-color,transform] duration-150 hover:bg-wb-hover active:scale-[0.98] motion-reduce:transform-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent sm:h-11"
              >
                <BookOpenText className="h-4 w-4" aria-hidden="true" />
                {t("home.readArticles")}
              </Link>
            </div>
          </div>
        </section>

        <section className="pb-14 sm:pb-20" aria-labelledby="home-articles-heading">
          <HomeSectionHeadingV4
            headingId="home-articles-heading"
            icon={<BookOpenText className="h-5 w-5" aria-hidden="true" />}
            title={t("home.sectionArticles")}
            viewAllHref={articles.length > 0 ? articlesHref(locale) : null}
            viewAllLabel={t("home.viewAll")}
          />
          {articles.length === 0 ? (
            <HomeEmptyStateV4
              icon={<BookOpenText className="h-5 w-5" aria-hidden="true" />}
              message={t("home.noArticles")}
            />
          ) : (
            <div className="mt-5 grid gap-3 sm:grid-cols-2 sm:gap-4">
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

        <section className="pb-16 sm:pb-24" aria-labelledby="home-simulations-heading">
          <HomeSectionHeadingV4
            headingId="home-simulations-heading"
            icon={<FlaskConical className="h-5 w-5" aria-hidden="true" />}
            title={t("home.sectionSimulations")}
            viewAllHref={experiments.length > 0 ? experimentsHref(locale) : null}
            viewAllLabel={t("home.viewAll")}
          />
          {experiments.length === 0 ? (
            <HomeEmptyStateV4
              icon={<FlaskConical className="h-5 w-5" aria-hidden="true" />}
              message={t("home.noSimulations")}
              actionHref={newExperimentHref(locale)}
              actionLabel={t("home.startFirstSimulation")}
            />
          ) : (
            <div className="mt-5 grid gap-3 sm:grid-cols-2 sm:gap-4">
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
            aria-label={t("common.appName")}
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

function HomeSectionHeadingV4({
  headingId,
  icon,
  title,
  viewAllHref,
  viewAllLabel,
}: Readonly<{
  headingId: string;
  icon: React.ReactNode;
  title: string;
  viewAllHref: string | null;
  viewAllLabel: string;
}>) {
  return (
    <div className="flex items-center justify-between gap-4">
      <h2
        id={headingId}
        className="flex min-w-0 items-center gap-2.5 text-xl font-bold tracking-[-0.02em] text-wb-text sm:text-[1.35rem]"
      >
        <span className="text-wb-accent">{icon}</span>
        <span className="truncate">{title}</span>
      </h2>
      {viewAllHref !== null && (
        <Link
          to={viewAllHref}
          className="inline-flex shrink-0 items-center gap-1 rounded-sm text-[13px] font-semibold text-wb-muted transition-colors hover:text-wb-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
        >
          {viewAllLabel}
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}

const HOME_CARD_CLASS_V4 =
  "group flex items-start gap-4 rounded-2xl border border-wb-line bg-wb-panel p-4 transition-[border-color,box-shadow,transform] duration-150 hover:-translate-y-0.5 hover:border-wb-line-strong hover:shadow-[0_16px_32px_-20px_rgba(2,8,23,0.5)] motion-reduce:transform-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent sm:p-5";

function HomeArticleCardV4({
  article,
  locale,
}: Readonly<{
  article: PublicArticleCatalogItemV3;
  locale: Locale;
}>) {
  const { t } = useTranslation();
  const accent = homeTileAccentV4(article.articleId);
  const publishedDate = homePublishedDateV4(article.publishedAt, locale);
  return (
    <Link
      to={articleReaderHref({ articleId: article.articleId, locale })}
      className={HOME_CARD_CLASS_V4}
    >
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${accent.tile}`}
        aria-hidden="true"
      >
        <BookOpenText className={`h-5 w-5 ${accent.icon}`} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="line-clamp-2 break-words text-[15px] font-bold leading-6 tracking-[-0.015em] text-wb-text">
          {article.title}
        </span>
        <span className="mt-1.5 line-clamp-2 break-words text-xs leading-5 text-wb-subtle">
          {article.excerpt ?? t("home.articleFallback")}
        </span>
        {publishedDate !== null && (
          <span className="mt-2 block text-[11px] text-wb-subtle">
            {publishedDate}
          </span>
        )}
      </span>
    </Link>
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
  const accent = homeTileAccentV4(experiment.record.experimentId);
  return (
    <Link
      to={experimentSnapshotHref({
        locale,
        snapshotId: experiment.snapshotId,
      })}
      className={HOME_CARD_CLASS_V4}
    >
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${accent.tile}`}
        aria-hidden="true"
      >
        <FlaskConical className={`h-5 w-5 ${accent.icon}`} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="line-clamp-2 break-words text-[15px] font-bold leading-6 tracking-[-0.015em] text-wb-text">
          {experiment.record.title}
        </span>
        <span className="mt-1.5 block text-xs leading-5 text-wb-subtle">
          {t("home.simulationMeta", {
            count: experiment.scenarioCount,
            date: new Intl.DateTimeFormat(locale, { dateStyle: "medium" })
              .format(new Date(experiment.record.updatedAt)),
          })}
        </span>
      </span>
    </Link>
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
