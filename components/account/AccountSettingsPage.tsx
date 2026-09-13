import React from "react";
import { useSiteAccountSessionV3 } from "@/components/site/SiteAccountSessionV3";
import { createStudioSupabaseContentRepositoryV1 } from "@/studio/infrastructure/supabase/StudioSupabaseContentRepositoryV1";
import {
  validateDisplayNameV1,
  type MyProfileV1,
} from "@/studio/application/profile/StudioPublicProfileV1";
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

export function AccountSettingsPage() {
  const { t } = useTranslation();
  const location = useLocation();
  const locale = localeFromPathname(location.pathname);
  const { account } = useSiteAccountSessionV3();

  return (
    <div className="h-full overflow-y-auto bg-wb-app text-wb-text">
      <main className="mx-auto w-full max-w-2xl px-5 py-12 sm:px-8 sm:py-16">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-wb-accent">
          {t("accountSettings.eyebrow")}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em]">
          {t("accountSettings.title")}
        </h1>
        <PublicProfileSettingsV1
          key={account?.accountId ?? "guest"}
          locale={locale}
        />
        <section className="mt-12 border-t border-wb-line pt-8">
          <h2 className="text-sm font-semibold">
            {t("accountSettings.language")}
          </h2>
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
                  {active && (
                    <Check
                      className="h-4 w-4 text-wb-accent"
                      aria-hidden="true"
                    />
                  )}
                </Link>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}

export default AccountSettingsPage;

function PublicProfileSettingsV1({ locale }: { locale: string }) {
  const { account, acceptProfile } = useSiteAccountSessionV3();
  const ja = locale === "ja";
  const repository = React.useMemo(createStudioSupabaseContentRepositoryV1, []);
  const [profile, setProfile] = React.useState<MyProfileV1 | null>(null);
  const [name, setName] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [message, setMessage] = React.useState("");
  const [error, setError] = React.useState("");
  const active = React.useRef(false);
  React.useEffect(() => {
    active.current = true;
    let current = true;
    if (account)
      void repository
        ?.readMyProfile()
        .then((p) => {
          if (current && p?.userId === account.accountId) {
            setProfile(p);
            setName(p.displayName ?? "");
          }
        })
        .catch(() => {
          if (current)
            setError(
              ja
                ? "プロフィールを読み込めませんでした。ページを再読み込みしてください。"
                : "Could not load your profile. Reload this page.",
            );
        });
    return () => {
      current = false;
      active.current = false;
    };
  }, [account?.accountId, repository]);
  if (!account) return null;
  return (
    <section className="mt-10 border-t border-wb-line pt-8">
      <h2 className="text-lg font-semibold">
        {ja ? "公開プロフィール" : "Public profile"}
      </h2>
      <p className="mt-2 text-sm leading-7 text-wb-muted">
        {ja
          ? "記事・実験・コースに共通して表示する名前です。変更しても公開URLは変わりません。"
          : "Your name on articles, experiments and courses. Changing it keeps their URLs intact."}
      </p>
      <form
        className="mt-5"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!repository || !profile || busy) return;
          setMessage("");
          setError("");
          try {
            validateDisplayNameV1(name.trim());
          } catch {
            setError(
              ja
                ? "表示名は1〜80文字で入力してください。改行や不可視の制御文字は使えません。"
                : "Enter 1–80 characters without line breaks or invisible control characters.",
            );
            return;
          }
          setBusy(true);
          try {
            const next = await repository.saveMyProfile({
              userId: profile.userId,
              expectedVersion: profile.version,
              displayName: name.trim(),
            });
            if (active.current) {
              setProfile(next);
              setName(next.displayName ?? "");
              acceptProfile?.(next);
              setMessage(ja ? "公開名を保存しました。" : "Public name saved.");
            }
          } catch {
            if (active.current)
              setError(
                ja
                  ? "保存できませんでした。他の画面で変更した場合は、再読み込みしてから保存してください。"
                  : "Could not save. If this profile changed elsewhere, reload before saving.",
              );
          } finally {
            if (active.current) setBusy(false);
          }
        }}
      >
        <label
          className="block text-sm font-medium"
          htmlFor="public-display-name"
        >
          {ja ? "表示名" : "Display name"}
        </label>
        <input
          id="public-display-name"
          autoComplete="nickname"
          value={name}
          disabled={!profile || busy}
          onChange={(e) => {
            setName(e.target.value);
            setMessage("");
          }}
          className="mt-2 min-h-11 w-full rounded-lg border border-wb-line bg-wb-panel px-3 text-base"
        />
        <button
          disabled={!profile || busy || name.trim() === profile.displayName}
          className="mt-4 min-h-11 rounded-full bg-wb-primary px-6 text-sm font-semibold text-white disabled:opacity-40"
        >
          {busy ? (ja ? "保存中…" : "Saving…") : ja ? "保存" : "Save"}
        </button>
        {message && (
          <p role="status" className="mt-3 text-sm text-wb-muted">
            {message}
          </p>
        )}
        {error && (
          <p role="alert" className="mt-3 text-sm">
            {error}
          </p>
        )}
      </form>
    </section>
  );
}
