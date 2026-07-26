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
    <div className="h-full w-full overflow-y-auto bg-wb-app p-6 text-wb-text sm:p-10">
      <div className="mx-auto max-w-5xl space-y-10">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight text-wb-text">{t('cases.title')}</h1>
        </div>

        <section>
          <h2 className="mb-1 text-xl font-bold text-wb-text">{t('cases.scientificCases')}</h2>
          <p className="mb-4 text-sm leading-6 text-wb-muted">
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
