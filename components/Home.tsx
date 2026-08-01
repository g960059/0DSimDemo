import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BookOpen, Play } from 'lucide-react';
import { articlesHref, experimentsHref } from '../homeLinks';
import { localeFromPathname } from '../localeRouting';

/** Top-level entry into independent Article and Experiment resources. */
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
              to={experimentsHref(locale)}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-wb-primary px-5 text-sm font-bold text-white transition-transform duration-150 hover:bg-wb-primary-hover active:scale-[0.98] motion-reduce:transform-none"
            >
              <Play className="h-4 w-4" />
              {t('home.openWorkbenchStatus')}
            </Link>
            <Link
              to={articlesHref(locale)}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg px-4 text-sm font-bold text-wb-muted transition-[color,background-color,transform] duration-150 hover:bg-wb-hover hover:text-wb-text active:scale-[0.98] motion-reduce:transform-none"
            >
              <BookOpen className="h-4 w-4" />
              {t('home.openArticles')}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
