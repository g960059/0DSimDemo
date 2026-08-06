import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BookOpen, PlaySquare, Moon, Sun } from 'lucide-react';
import { ModelLimitations } from './ModelLimitations';
import { homeHref, workbenchHref } from '../homeLinks';
import { useAppTheme } from '../appTheme';
import { type Locale, localeFromPathname, setPreferredLocale, stripLocaleFromPathname, switchLocalePath } from '../localeRouting';

export function routeOwnsApplicationChrome(pathname: string): boolean {
  return pathname === '/workbench'
    || pathname.startsWith('/workbench/')
    || pathname === '/articles'
    || pathname.startsWith('/articles/');
}

export const Layout = () => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const locale = localeFromPathname(location.pathname);
  const normalizedPath = stripLocaleFromPathname(location.pathname);
  const pageOwnsChrome = routeOwnsApplicationChrome(normalizedPath);
  const { appTheme, setAppTheme } = useAppTheme();

  React.useEffect(() => {
    if (i18n.language !== locale) void i18n.changeLanguage(locale);
    document.documentElement.lang = locale;
    setPreferredLocale(locale);
  }, [i18n, locale]);

  const navItems = [
    { name: t('nav.home'), path: homeHref(locale), matchPath: '/', icon: <BookOpen className="h-4 w-4" /> },
    { name: t('nav.workbench'), path: workbenchHref(locale), matchPath: '/workbench', icon: <PlaySquare className="h-4 w-4" /> },
  ];
  const languageItems: Array<{ locale: Locale; label: string }> = [
    { locale: 'ja', label: t('common.language.ja') },
    { locale: 'en', label: t('common.language.en') },
  ];
  return (
    <div
      className="app-root flex h-screen w-screen flex-col overflow-hidden bg-wb-app font-sans text-wb-text"
      data-app-theme={appTheme}
    >
      {!pageOwnsChrome && (
        <header className="z-50 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-wb-line bg-wb-header px-4">
          <div className="flex min-w-0 items-center gap-6">
            <Link to={homeHref(locale)} className="shrink-0">
              <span className="text-lg font-bold tracking-tight text-wb-accent">
                {t('common.appName')}
              </span>
            </Link>

            <nav className="hidden shrink-0 items-center gap-1 md:flex">
              {navItems.map((item) => {
                const isActive = normalizedPath === item.matchPath || (item.matchPath !== '/' && normalizedPath.startsWith(item.matchPath));
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    aria-current={isActive ? 'page' : undefined}
                    className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-bold transition-colors ${
                      isActive
                        ? 'bg-wb-active text-wb-text'
                        : 'text-wb-muted hover:bg-wb-hover hover:text-wb-text'
                    }`}
                  >
                    {item.icon}
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex min-w-0 shrink items-center gap-2">
            <ModelLimitations />
            <button
              type="button"
              onClick={() => setAppTheme(appTheme === 'light' ? 'dark' : 'light')}
              aria-label={t('common.theme.toggle')}
              title={t('common.theme.toggle')}
              data-testid="app-theme-toggle"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-wb-muted transition-colors hover:bg-wb-hover hover:text-wb-text"
            >
              {appTheme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </button>
            <div className="hidden items-center rounded-md bg-wb-soft p-0.5 sm:flex">
              {languageItems.map((item) => {
                const isActive = item.locale === locale;
                return (
                  <Link
                    key={item.locale}
                    to={switchLocalePath(location.pathname, location.search, location.hash, item.locale)}
                    onClick={() => setPreferredLocale(item.locale)}
                    className={`rounded px-2.5 py-1 text-xs font-bold transition-colors ${
                      isActive ? 'bg-wb-panel text-wb-text shadow-sm' : 'text-wb-subtle hover:text-wb-text'
                    }`}
                    aria-current={isActive ? 'true' : undefined}
                    aria-label={t('common.language.switchTo', { language: item.label })}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </header>
      )}

      <main className="relative flex-1 overflow-hidden">
        <Outlet />
      </main>

      {!pageOwnsChrome && (
        <div className="pb-safe z-50 flex shrink-0 items-center justify-around border-t border-wb-line bg-wb-header md:hidden">
          {navItems.map((item) => {
            const isActive = normalizedPath === item.matchPath || (item.matchPath !== '/' && normalizedPath.startsWith(item.matchPath));
            return (
              <Link
                key={item.name}
                to={item.path}
                aria-current={isActive ? 'page' : undefined}
                className={`flex flex-1 flex-col items-center gap-1 rounded-md py-3 text-[10px] font-medium transition-colors ${
                  isActive ? 'font-bold text-wb-accent' : 'text-wb-muted hover:text-wb-text'
                }`}
              >
                {item.icon}
                {item.name}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};
