import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ScientificProductCasesGridV1 } from './scientificProduct';
import { allCasesHref, authorPreviewHref, workbenchHref } from '../homeLinks';
import { localeFromPathname } from '../localeRouting';
import { useWorkbenchTheme } from '../features/workbench/hooks/useWorkbenchTheme';

/**
 * The two doorways into the product.
 *
 * Reading and running are the whole surface area: an article carries live
 * experiments, and the Workbench is where the physiology behind one is built.
 * Everything a reader meets is a document, so the home page offers the
 * document first and the case catalogue as the way into the bench.
 */
export const Home = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const locale = localeFromPathname(location.pathname);
  const { workbenchTheme } = useWorkbenchTheme();

  return (
    <div
      className="workbench-root h-full w-full overflow-y-auto bg-wb-app p-4 font-sans text-wb-text sm:p-8"
      data-workbench-theme={workbenchTheme}
    >
      <div className="mx-auto max-w-5xl space-y-10">
        <section className="border-b border-wb-line pb-8">
          <h1 className="text-3xl font-bold tracking-tight text-wb-text sm:text-4xl">
            {t('common.appName')}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-wb-muted sm:text-base">
            {t('home.lead')}
          </p>
        </section>

        <section
          className="rounded-2xl bg-wb-panel p-6 sm:p-8"
          data-testid="studio-author-preview-entry-v1"
        >
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-bold text-wb-text">
                {t('studioAuthorPreview.home.title')}
              </h2>
              <p className="mt-2 text-sm leading-6 text-wb-muted">
                {t('studioAuthorPreview.home.description')}
              </p>
              <p className="mt-3 text-xs leading-5 text-wb-warning">
                {t('studioAuthorPreview.home.boundaryNotice')}
              </p>
            </div>
            <Link
              to={authorPreviewHref(locale)}
              className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg bg-wb-primary px-4 text-sm font-bold text-white transition-transform duration-150 active:scale-[0.97] motion-reduce:transform-none hover:bg-wb-primary-hover"
            >
              {t('studioAuthorPreview.home.openAuthor')}
            </Link>
          </div>
        </section>

        <section className="pb-6">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-wb-text">
                {t('home.exploreTitle')}
              </h2>
              <p className="mt-1 text-sm text-wb-muted">
                {t('home.exploreDescription')}
              </p>
            </div>
            <span className="flex flex-wrap items-center gap-4">
              <Link
                to={workbenchHref(locale)}
                className="text-sm font-bold text-wb-muted transition-colors hover:text-wb-text"
              >
                {t('home.openBlankWorkbench')}
              </Link>
              <Link
                to={allCasesHref(locale)}
                className="text-sm font-bold text-wb-accent transition-colors hover:underline"
              >
                {t('home.seeAllCases')} →
              </Link>
            </span>
          </div>

          <ScientificProductCasesGridV1
            locale={locale}
            openLabel={t('home.openCase')}
          />
        </section>
      </div>
    </div>
  );
};
