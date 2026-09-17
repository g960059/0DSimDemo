import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { ContentManagementLayoutV1, isContentManagementRouteV1 } from "@/components/management/ContentManagementV1";
import { useAppTheme } from "@/appTheme";
import { homeHref } from "@/homeLinks";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { usePreviousPageV1 } from "@/components/usePreviousPageV1";
import { HomeSearchProviderV1 } from "@/components/home/HomeSearchV1";
import { SiteHeaderV3 } from "@/components/site/SiteHeaderV3";
import { WorkbenchPerformanceReportV3 } from "@/components/workbench/runtime/WorkbenchPerformanceReportV3";
import {
  localeFromPathname,
  setPreferredLocale,
  stripLocaleFromPathname,
} from "@/localeRouting";

/**
 * Editors and live Experiment Sessions own contextual task chrome. Reader,
 * directory, Home, and account-management pages share the stable site shell.
 */
export function routeOwnsApplicationChrome(pathname: string): boolean {
  if (/^\/dev\/model-lab\/?$/.test(pathname)) return true;
  if (pathname.startsWith("/snapshots/") || pathname.startsWith("/experiments/published/")) return true;
  if (/^\/experiments\/(?:new|[^/]+)$/.test(pathname)) return true;
  return /^\/articles\/(?:new|[^/]+)\/edit$/.test(pathname);
}

export const Layout = () => {
  const { i18n } = useTranslation();
  const location = useLocation();
  const locale = localeFromPathname(location.pathname);
  const normalizedPath = stripLocaleFromPathname(location.pathname);
  const pageOwnsChrome = routeOwnsApplicationChrome(normalizedPath);
  const { appTheme } = useAppTheme();
  const returnToPreviousPage = usePreviousPageV1(homeHref(locale));

  React.useEffect(() => {
    if (i18n.language !== locale) void i18n.changeLanguage(locale);
    document.documentElement.lang = locale;
    setPreferredLocale(locale);
  }, [i18n, locale]);

  const content = (
    <ErrorBoundary resetKey={location.key} onBack={returnToPreviousPage}>
      <Outlet />
    </ErrorBoundary>
  );

  return (
    <div
      className="app-root flex h-screen w-full flex-col overflow-hidden bg-wb-app font-sans text-wb-text"
      data-app-theme={appTheme}
    >
      <HomeSearchProviderV1>
        {!pageOwnsChrome && <SiteHeaderV3 />}
        <div className="relative min-h-0 flex-1 overflow-hidden">
          {isContentManagementRouteV1(location.pathname)
            ? <ContentManagementLayoutV1>{content}</ContentManagementLayoutV1>
            : content}
        </div>
      </HomeSearchProviderV1>
      <WorkbenchPerformanceReportV3 />
    </div>
  );
};
