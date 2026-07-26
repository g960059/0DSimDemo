import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Play } from 'lucide-react';
import { ScientificProductCasesGridV1 } from './scientificProduct';
import { allCasesHref, authorPreviewHref, workbenchHref } from '../homeLinks';
import { localeFromPathname } from '../localeRouting';

/**
 * The two doorways into the product.
 *
 * Reading and running are the whole surface area: an article carries live
 * experiments, and the Workbench is where the physiology behind one is built.
 * There is one article destination, so the page offers it once — a second
 * block pointing at the same route would invent a distinction the product
 * does not have.
 *
 * Sections alternate ground and are split: the left column says what the
 * section is, the right column is the thing itself. That keeps the page
 * readable at a glance for someone who does not yet know which of the two
 * doorways is theirs.
 */
export const Home = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const locale = localeFromPathname(location.pathname);

  return (
    <div className="h-full w-full overflow-y-auto bg-wb-app text-wb-text">
      <section className="border-b border-wb-line px-6 py-14 sm:px-10 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-wb-accent">
            {t('home.eyebrow')}
          </p>
          <h1 className="mt-4 max-w-3xl text-3xl font-bold leading-tight tracking-tight text-wb-text sm:text-5xl">
            {t('home.headline')}
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-wb-muted sm:text-base">
            {t('home.lead')}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              to={authorPreviewHref(locale)}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-wb-primary px-5 text-sm font-bold text-white transition-transform duration-150 hover:bg-wb-primary-hover active:scale-[0.98] motion-reduce:transform-none"
            >
              <Play className="h-4 w-4" />
              {t('home.openArticle')}
            </Link>
            <Link
              to={workbenchHref(locale)}
              className="inline-flex min-h-11 items-center rounded-lg border border-wb-line-strong px-5 text-sm font-bold text-wb-text transition-colors hover:bg-wb-hover"
            >
              {t('home.openBlankWorkbench')}
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b border-wb-line bg-wb-soft px-6 py-14 sm:px-10">
        <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] lg:gap-12">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-wb-text">
              {t('home.readTitle')}
            </h2>
            <p className="mt-2 text-sm leading-6 text-wb-muted">
              {t('home.readDescription')}
            </p>
          </div>
          <div className="rounded-xl border border-wb-line bg-wb-panel p-6">
            <h3 className="text-base font-bold text-wb-text">
              {t('studioAuthorPreview.home.title')}
            </h3>
            <p className="mt-2 text-sm leading-6 text-wb-muted">
              {t('studioAuthorPreview.home.description')}
            </p>
            <p className="mt-3 text-xs leading-5 text-wb-warning">
              {t('studioAuthorPreview.home.boundaryNotice')}
            </p>
            <Link
              to={authorPreviewHref(locale)}
              data-testid="studio-author-preview-entry-v1"
              className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-wb-accent transition-colors hover:underline"
            >
              {t('studioAuthorPreview.home.openAuthor')}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="px-6 py-14 sm:px-10">
        <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] lg:gap-12">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-wb-text">
              {t('home.exploreTitle')}
            </h2>
            <p className="mt-2 text-sm leading-6 text-wb-muted">
              {t('home.exploreDescription')}
            </p>
            <Link
              to={allCasesHref(locale)}
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-wb-accent transition-colors hover:underline"
            >
              {t('home.seeAllCases')}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <ScientificProductCasesGridV1
            locale={locale}
            openLabel={t('home.openCase')}
          />
        </div>
      </section>
    </div>
  );
};
