import React from "react";
import {
  BookOpenText,
  ChevronDown,
  FlaskConical,
  LogIn,
  LogOut,
  Moon,
  Plus,
  Settings,
  Sun,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";

import { useAppTheme } from "@/appTheme";
import {
  accountSettingsHref,
  homeHref,
  loginHref,
  myArticlesHref,
  myExperimentsHref,
  newArticleEditorHref,
  newExperimentHref,
} from "@/homeLinks";
import {
  type Locale,
  localeFromPathname,
  setPreferredLocale,
  switchLocalePath,
} from "@/localeRouting";
import { useSiteAccountSessionV3 } from "./SiteAccountSessionV3";

const LANGUAGE_ITEMS_V3: readonly Readonly<{
  locale: Locale;
  shortLabel: string;
}>[] = Object.freeze([
  Object.freeze({ locale: "ja", shortLabel: "JA" }),
  Object.freeze({ locale: "en", shortLabel: "EN" }),
]);

export function SiteHeaderV3() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const locale = localeFromPathname(location.pathname);
  const { appTheme, setAppTheme } = useAppTheme();
  const accountSession = useSiteAccountSessionV3();

  React.useEffect(() => {
    if (i18n.language !== locale) void i18n.changeLanguage(locale);
    document.documentElement.lang = locale;
    setPreferredLocale(locale);
  }, [i18n, locale]);

  return (
    <header
      className="z-50 flex h-14 shrink-0 items-center gap-3 bg-wb-header/95 px-3 shadow-[inset_0_-1px_0_color-mix(in_srgb,var(--wb-border)_72%,transparent)] backdrop-blur-xl sm:px-5"
      data-testid="site-header-v3"
    >
      <Link
        to={homeHref(locale)}
        className="min-w-0 shrink truncate rounded-md text-[15px] font-semibold tracking-[-0.02em] text-wb-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
        aria-label={t("siteHeader.home")}
      >
        {t("common.appName")}
      </Link>

      <span className="min-w-0 flex-1" />

      {accountSession.account === null && (
        <nav
          className="flex items-center rounded-lg bg-wb-soft p-0.5"
          aria-label={t("siteHeader.language")}
          data-testid="anonymous-language-switch-v3"
        >
          {LANGUAGE_ITEMS_V3.map((item) => {
            const active = item.locale === locale;
            return (
              <Link
                key={item.locale}
                to={switchLocalePath(
                  location.pathname,
                  location.search,
                  location.hash,
                  item.locale,
                )}
                onClick={() => setPreferredLocale(item.locale)}
                aria-current={active ? "true" : undefined}
                aria-label={t("common.language.switchTo", {
                  language: t(`common.language.${item.locale}`),
                })}
                className={`rounded-md px-2 py-1 text-[10px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent ${
                  active
                    ? "bg-wb-panel text-wb-text shadow-sm"
                    : "text-wb-subtle hover:text-wb-text"
                }`}
              >
                {item.shortLabel}
              </Link>
            );
          })}
        </nav>
      )}

      <button
        type="button"
        onClick={() => setAppTheme(appTheme === "light" ? "dark" : "light")}
        aria-label={t("common.theme.toggle")}
        title={t("common.theme.toggle")}
        data-testid="site-theme-toggle-v3"
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-wb-muted transition-[color,background-color,transform] duration-150 hover:bg-wb-hover hover:text-wb-text active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
      >
        {appTheme === "light"
          ? <Moon className="h-4 w-4" aria-hidden="true" />
          : <Sun className="h-4 w-4" aria-hidden="true" />}
      </button>

      {accountSession.account === null ? (
        <Link
          to={newExperimentHref(locale)}
          aria-label={t("siteHeader.startSimulation")}
          data-testid="site-start-simulation-v3"
          className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-lg bg-wb-primary px-2.5 text-xs font-semibold text-white transition-[background-color,transform] duration-150 hover:bg-wb-primary-hover active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent sm:px-3"
        >
          <FlaskConical className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="hidden sm:inline">
            {t("siteHeader.startSimulation")}
          </span>
        </Link>
      ) : (
        <SiteCreateMenuV3 locale={locale} />
      )}

      {accountSession.account === null ? (
        <Link
          to={loginHref(locale)}
          aria-label={t("siteHeader.login")}
          className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold text-wb-muted transition-[color,background-color,transform] duration-150 hover:bg-wb-hover hover:text-wb-text active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
        >
          <LogIn className="h-3.5 w-3.5 sm:hidden" aria-hidden="true" />
          <span className="hidden sm:inline">{t("siteHeader.login")}</span>
        </Link>
      ) : (
        <SiteProfileMenuV3 locale={locale} />
      )}
    </header>
  );
}

function SiteCreateMenuV3({ locale }: Readonly<{ locale: Locale }>) {
  const { t } = useTranslation();
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!open) return undefined;
    const closeOnPointerDown = (event: PointerEvent) => {
      if (
        event.target instanceof Node
        && !rootRef.current?.contains(event.target)
      ) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("pointerdown", closeOnPointerDown);
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      window.removeEventListener("pointerdown", closeOnPointerDown);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        data-testid="site-create-trigger-v3"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-wb-primary px-3 text-xs font-semibold text-white transition-[background-color,transform] duration-150 hover:bg-wb-primary-hover active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
      >
        <Plus className="h-3.5 w-3.5" aria-hidden="true" />
        {t("siteHeader.create")}
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform duration-150 motion-reduce:transition-none ${
            open ? "rotate-180" : ""
          }`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div
          role="menu"
          aria-label={t("siteHeader.create")}
          data-testid="site-create-menu-v3"
          className="absolute right-0 top-11 z-[70] w-72 max-w-[calc(100vw-1.5rem)] origin-top-right rounded-xl border border-wb-line bg-wb-panel p-1.5 shadow-2xl"
        >
          <SiteCreateMenuLinkV3
            to={newExperimentHref(locale)}
            icon={<FlaskConical className="h-4 w-4" aria-hidden="true" />}
            title={t("siteHeader.newSimulation")}
            description={t("siteHeader.newSimulationDescription")}
            onSelect={() => setOpen(false)}
          />
          <SiteCreateMenuLinkV3
            to={newArticleEditorHref(locale)}
            icon={<BookOpenText className="h-4 w-4" aria-hidden="true" />}
            title={t("siteHeader.newArticle")}
            description={t("siteHeader.newArticleDescription")}
            onSelect={() => setOpen(false)}
          />
        </div>
      )}
    </div>
  );
}

function SiteCreateMenuLinkV3({
  description,
  icon,
  onSelect,
  title,
  to,
}: Readonly<{
  description: string;
  icon: React.ReactNode;
  onSelect(): void;
  title: string;
  to: string;
}>) {
  return (
    <Link
      to={to}
      role="menuitem"
      onClick={onSelect}
      className="flex min-h-14 items-start gap-3 rounded-lg px-2.5 py-2.5 text-left transition-colors hover:bg-wb-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
    >
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-wb-soft text-wb-accent">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-xs font-semibold text-wb-text">{title}</span>
        <span className="mt-0.5 block text-[11px] leading-5 text-wb-muted">
          {description}
        </span>
      </span>
    </Link>
  );
}

function SiteProfileMenuV3({ locale }: Readonly<{ locale: Locale }>) {
  const { t } = useTranslation();
  const { account, signOut } = useSiteAccountSessionV3();
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!open) return undefined;
    const closeOnPointerDown = (event: PointerEvent) => {
      if (
        event.target instanceof Node
        && !rootRef.current?.contains(event.target)
      ) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("pointerdown", closeOnPointerDown);
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      window.removeEventListener("pointerdown", closeOnPointerDown);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  if (account === null) return null;
  const initial = account.displayName.trim().charAt(0).toLocaleUpperCase()
    || account.accountId.charAt(0).toLocaleUpperCase();

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t("siteHeader.profile")}
        data-testid="site-profile-trigger-v3"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-wb-soft text-xs font-semibold text-wb-text transition-[background-color,transform] duration-150 hover:bg-wb-hover active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
      >
        {account.avatarUrl === undefined ? (
          <span aria-hidden="true">{initial}</span>
        ) : (
          <img
            src={account.avatarUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-11 z-[70] w-60 origin-top-right rounded-xl border border-wb-line bg-wb-panel p-1.5 shadow-2xl"
          data-testid="site-profile-menu-v3"
        >
          <div className="px-2.5 pb-2 pt-1.5">
            <p className="truncate text-xs font-semibold text-wb-text">
              {account.displayName}
            </p>
          </div>
          <ProfileMenuLinkV3
            to={myExperimentsHref(locale)}
            icon={<FlaskConical className="h-4 w-4" aria-hidden="true" />}
            onSelect={() => setOpen(false)}
          >
            {t("siteHeader.manageExperiments")}
          </ProfileMenuLinkV3>
          <ProfileMenuLinkV3
            to={myArticlesHref(locale)}
            icon={<BookOpenText className="h-4 w-4" aria-hidden="true" />}
            onSelect={() => setOpen(false)}
          >
            {t("siteHeader.manageArticles")}
          </ProfileMenuLinkV3>
          <div className="my-1 h-px bg-wb-line" />
          <ProfileMenuLinkV3
            to={accountSettingsHref(locale)}
            icon={<Settings className="h-4 w-4" aria-hidden="true" />}
            onSelect={() => setOpen(false)}
          >
            {t("siteHeader.accountSettings")}
          </ProfileMenuLinkV3>
          {signOut !== undefined && (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                void signOut();
              }}
              className="flex min-h-10 w-full items-center gap-3 rounded-lg px-2.5 text-left text-xs font-medium text-wb-muted hover:bg-wb-hover hover:text-wb-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              {t("siteHeader.logout")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function ProfileMenuLinkV3({
  children,
  icon,
  onSelect,
  to,
}: Readonly<{
  children: React.ReactNode;
  icon: React.ReactNode;
  onSelect(): void;
  to: string;
}>) {
  return (
    <Link
      to={to}
      role="menuitem"
      onClick={onSelect}
      className="flex min-h-10 items-center gap-3 rounded-lg px-2.5 text-xs font-medium text-wb-muted hover:bg-wb-hover hover:text-wb-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
    >
      {icon}
      {children}
    </Link>
  );
}
