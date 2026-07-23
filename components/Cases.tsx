import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ScientificProductCasesGridV1 } from './scientificProduct';
import { localeFromPathname } from '../localeRouting';
import { integratedPreviewHref } from '../homeLinks';

export const OfficialCases = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const locale = localeFromPathname(location.pathname);

  return (
    <div className="h-full w-full overflow-y-auto p-4 sm:p-8 bg-slate-950 text-slate-200">
      <div className="max-w-5xl mx-auto space-y-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">{t('cases.title')}</h1>
        </div>

        <section>
          <h2 className="mb-1 text-xl font-bold text-slate-100">{t('cases.scientificCases')}</h2>
          <p className="mb-4 text-sm text-slate-400">
            {t('cases.scientificCasesDescription')}
          </p>
          <ScientificProductCasesGridV1
            locale={locale}
            openLabel={t('cases.openCase')}
          />
        </section>
        <section className="rounded-xl border border-amber-700/60 bg-amber-950/20 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-amber-300">
                Experimental model channel
              </div>
              <h2 className="mt-1 text-xl font-bold text-slate-100">
                Integrated base + coronary + MCS + rhythm
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                Exact release-bound preview with raw waveforms, coronary flow,
                composed rhythm events, and an optional one-beat HeartMate II
                transient. Not the current stable release.
              </p>
            </div>
            <Link
              to={integratedPreviewHref(locale)}
              className="shrink-0 rounded bg-amber-700 px-4 py-2 text-center text-sm font-bold text-white hover:bg-amber-600"
            >
              Open preview
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
};
