import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LESSONS } from '../lessonDoc';
import { OFFICIAL_CASES } from '../officialCases';
import { allCasesHref, caseHref, lessonHref, workbenchHref } from '../homeLinks';
import { localeFromPathname } from '../localeRouting';

export const Home = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const locale = localeFromPathname(location.pathname);
  const lessons = LESSONS.map((lesson, index) => ({
    id: lesson.meta.id,
    order: index + 1,
    title: t(`lessons.${lesson.meta.id}.title`, { defaultValue: lesson.meta.title }),
    description: t(`lessons.${lesson.meta.id}.objective`, { defaultValue: lesson.meta.objective ?? '' }),
  }));

  return (
    <div className="h-full w-full overflow-y-auto p-4 sm:p-8 bg-slate-950 text-slate-200">
      <div className="max-w-5xl mx-auto space-y-10">
        <section className="flex flex-col gap-5 border-b border-slate-800 pb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-100">{t('common.appName')}</h1>
            <p className="mt-3 max-w-2xl text-sm sm:text-base text-slate-400">
              {t('home.lead')}
            </p>
          </div>
          <div>
            <Link
              to={workbenchHref(locale)}
              className="inline-flex px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded text-sm font-bold text-slate-200 shadow transition-colors"
            >
              {t('home.openFreeSimulation')}
            </Link>
          </div>
        </section>

        <section>
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-slate-100">{t('home.learnTitle')}</h2>
            <p className="mt-1 text-sm text-slate-400">{t('home.learnDescription')}</p>
          </div>

          <div className="space-y-4">
            {lessons.length > 0 ? (
              lessons.map((lesson) => (
                <div key={lesson.id} className="bg-slate-900 border border-slate-800 rounded-xl p-6 transition-all hover:border-slate-700 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-sm">
                        {lesson.order}
                      </span>
                      <h3 className="text-xl font-bold text-slate-200">{lesson.title}</h3>
                    </div>
                    <p className="text-sm text-slate-400 pl-11">
                      {lesson.description || t('home.openLessonFallback')}
                    </p>
                  </div>
                  <Link
                    to={lessonHref(lesson.id, locale)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded text-sm font-bold shadow transition-colors w-full sm:w-auto text-center"
                  >
                    {t('home.startLesson')}
                  </Link>
                </div>
              ))
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-sm text-slate-400">
                {t('home.noLessons')}
              </div>
            )}
          </div>
        </section>

        <section>
          <div className="mb-4 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold text-slate-100">{t('home.exploreTitle')}</h2>
              <p className="mt-1 text-sm text-slate-400">{t('home.exploreDescription')}</p>
            </div>
            <Link to={allCasesHref(locale)} className="text-sm font-bold text-blue-400 hover:text-blue-300 transition-colors">
              {t('home.seeAllCases')} →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {OFFICIAL_CASES.length > 0 ? (
              OFFICIAL_CASES.map((c) => (
                // Kept intentionally close to Cases.tsx for HI-1; shared card extraction is a follow-up.
                <div key={c.meta.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 transition-all hover:border-slate-700 flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-slate-200 line-clamp-1">
                      {t(`officialCases.${c.meta.id}.title`, { defaultValue: c.meta.title })}
                    </h3>
                  </div>
                  <p className="text-sm text-slate-400 mb-6 flex-1 line-clamp-3">
                    {t(`officialCases.${c.meta.id}.description`, { defaultValue: c.spec.description })}
                  </p>
                  <Link
                    to={caseHref(c.meta.id, locale)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded text-sm font-bold shadow transition-colors w-full text-center"
                  >
                    {t('home.openCase')}
                  </Link>
                </div>
              ))
            ) : (
              <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 text-sm text-slate-400">
                {t('home.noCases')}
              </div>
            )}
          </div>
        </section>

        <section className="pb-6">
          <Link
            to={workbenchHref(locale)}
            className="inline-flex px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded text-sm font-bold text-slate-200 shadow transition-colors"
          >
            {t('home.openBlankWorkbench')}
          </Link>
        </section>
      </div>
    </div>
  );
};
