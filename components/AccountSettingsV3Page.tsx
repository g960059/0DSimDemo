import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";

import {
  type Locale,
  localeFromPathname,
  setPreferredLocale,
  switchLocalePath,
} from "@/localeRouting";

const ACCOUNT_LANGUAGE_OPTIONS_V3: readonly Readonly<{
  locale: Locale;
  labelKey: "common.language.ja" | "common.language.en";
}>[] = Object.freeze([
  Object.freeze({ locale: "ja", labelKey: "common.language.ja" }),
  Object.freeze({ locale: "en", labelKey: "common.language.en" }),
]);

export function AccountSettingsV3Page() {
  const { t } = useTranslation();
  const location = useLocation();
  const locale = localeFromPathname(location.pathname);

  return (
    <div className="h-full overflow-y-auto bg-wb-app text-wb-text">
      <main className="mx-auto w-full max-w-2xl px-5 py-12 sm:px-8 sm:py-16">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-wb-accent">
          {t("accountSettings.eyebrow")}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em]">
          {t("accountSettings.title")}
        </h1>
        <section className="mt-12 border-t border-wb-line pt-8">
          <h2 className="text-sm font-semibold">{t("accountSettings.language")}</h2>
          <p className="mt-2 text-xs leading-6 text-wb-muted">
            {t("accountSettings.languageDescription")}
          </p>
          <div className="mt-5 grid gap-1">
            {ACCOUNT_LANGUAGE_OPTIONS_V3.map((option) => {
              const active = option.locale === locale;
              return (
                <Link
                  key={option.locale}
                  to={switchLocalePath(
                    location.pathname,
                    location.search,
                    location.hash,
                    option.locale,
                  )}
                  onClick={() => setPreferredLocale(option.locale)}
                  className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm text-wb-muted hover:bg-wb-hover hover:text-wb-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
                >
                  <span className="min-w-0 flex-1">{t(option.labelKey)}</span>
                  {active && <Check className="h-4 w-4 text-wb-accent" aria-hidden="true" />}
                </Link>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}

export default AccountSettingsV3Page;
