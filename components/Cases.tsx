import React from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ScientificProductCasesGridV1 } from './scientificProduct';
import { localeFromPathname } from '../localeRouting';

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
      </div>
    </div>
  );
};
