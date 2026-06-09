import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { BookOpen, Activity, PlaySquare, LogIn, LogOut } from 'lucide-react';
import { ModelLimitations } from './ModelLimitations';
import { allCasesHref, homeHref, workbenchHref } from '../homeLinks';
import { type Locale, localeFromPathname, setPreferredLocale, stripLocaleFromPathname, switchLocalePath } from '../localeRouting';

export const Layout = () => {
  const { user, profile, signIn, signOut } = useAuth();
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const locale = localeFromPathname(location.pathname);
  const normalizedPath = stripLocaleFromPathname(location.pathname);

  React.useEffect(() => {
    if (i18n.language !== locale) void i18n.changeLanguage(locale);
    document.documentElement.lang = locale;
    setPreferredLocale(locale);
  }, [i18n, locale]);

  const suppressGlobalChrome =
    normalizedPath === '/workbench' ||
    normalizedPath.startsWith('/workbench/') ||
    normalizedPath.startsWith('/lesson/');

  const navItems = [
    { name: t('nav.home'), path: homeHref(locale), matchPath: '/', icon: <BookOpen className="w-4 h-4" /> },
    { name: t('nav.cases'), path: allCasesHref(locale), matchPath: '/cases', icon: <Activity className="w-4 h-4" /> },
    { name: t('nav.workbench'), path: workbenchHref(locale), matchPath: '/workbench', icon: <PlaySquare className="w-4 h-4" /> },
  ];
  const languageItems: Array<{ locale: Locale; label: string }> = [
    { locale: 'ja', label: t('common.language.ja') },
    { locale: 'en', label: t('common.language.en') },
  ];

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-200 overflow-hidden font-sans">
      {!suppressGlobalChrome && <header className="h-14 bg-slate-900 border-b border-slate-800 shrink-0 flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-6">
          <Link to={homeHref(locale)} className="flex items-center gap-2">
            <span className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
              {t('common.appName')}
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = normalizedPath === item.matchPath || (item.matchPath !== '/' && normalizedPath.startsWith(item.matchPath));
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-500/10 text-blue-400'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {item.icon}
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <ModelLimitations />
          <div className="hidden sm:flex items-center rounded-md border border-slate-800 bg-slate-950 p-0.5">
            {languageItems.map((item) => {
              const isActive = item.locale === locale;
              return (
                <Link
                  key={item.locale}
                  to={switchLocalePath(location.pathname, location.search, location.hash, item.locale)}
                  onClick={() => setPreferredLocale(item.locale)}
                  className={`rounded px-2 py-1 text-xs font-bold transition-colors ${
                    isActive ? 'bg-slate-800 text-slate-100' : 'text-slate-500 hover:text-slate-200'
                  }`}
                  aria-current={isActive ? 'true' : undefined}
                  aria-label={t('common.language.switchTo', { language: item.label })}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
          {user ? (
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-end hidden sm:flex">
                <span className="text-xs font-medium text-slate-200">{user.displayName || user.email}</span>
                {profile?.role === 'admin' && <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">{t('auth.admin')}</span>}
              </div>
              <button
                onClick={signOut}
                className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded transition-colors"
                title={t('auth.signOut')}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={signIn}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm font-bold shadow transition-colors flex items-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              {t('auth.signIn')}
            </button>
          )}
        </div>
      </header>}
      
      <main className="flex-1 overflow-hidden relative">
        <Outlet />
      </main>

      {/* Mobile Nav */}
      {!suppressGlobalChrome && <div className="md:hidden flex items-center justify-around pb-safe bg-slate-900 border-t border-slate-800 z-50 shrink-0">
         {navItems.map((item) => {
              const isActive = normalizedPath === item.matchPath || (item.matchPath !== '/' && normalizedPath.startsWith(item.matchPath));
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex flex-col flex-1 items-center gap-1 py-3 rounded-md text-[10px] font-medium transition-colors ${
                    isActive
                      ? 'text-blue-400 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {item.icon}
                  {item.name}
                </Link>
              );
            })}
      </div>}
    </div>
  );
};
