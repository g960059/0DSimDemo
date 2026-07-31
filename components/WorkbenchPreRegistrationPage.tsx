import React from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Product boundary before the exact integrated V3 model is registered.
 *
 * No simulation surface is exposed until the registered model owns the exact
 * fixture, checkpoint, and output contracts used by the Workbench.
 */
export const WorkbenchPreRegistrationPage = () => {
  const { t } = useTranslation();

  return (
    <div className="h-full w-full overflow-y-auto bg-wb-app px-6 py-16 text-wb-text sm:px-10">
      <section
        className="mx-auto max-w-3xl rounded-2xl border border-wb-line bg-wb-panel p-7 shadow-sm sm:p-10"
        data-testid="workbench-pre-registration"
      >
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-wb-accent">
          {t('workbench.preRegistration.eyebrow')}
        </p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
          {t('workbench.preRegistration.title')}
        </h1>
        <p className="mt-5 max-w-2xl text-sm leading-7 text-wb-muted sm:text-base">
          {t('workbench.preRegistration.description')}
        </p>
        <p className="mt-5 rounded-lg border border-wb-line bg-wb-soft px-4 py-3 text-sm leading-6 text-wb-subtle">
          {t('workbench.preRegistration.status')}
        </p>
      </section>
    </div>
  );
};
