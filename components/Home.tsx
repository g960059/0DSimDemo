import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Play } from 'lucide-react';
import { workbenchHref } from '../homeLinks';
import { localeFromPathname } from '../localeRouting';

/**
 * Pre-release entry into the simulation product.
 *
 * Published-content entry points stay absent until the exact V3 model is
 * registered and the new Snapshot/Placement path owns their content.
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
              to={workbenchHref(locale)}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-wb-primary px-5 text-sm font-bold text-white transition-transform duration-150 hover:bg-wb-primary-hover active:scale-[0.98] motion-reduce:transform-none"
            >
              <Play className="h-4 w-4" />
              {t('home.openWorkbenchStatus')}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
