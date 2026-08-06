import { Check, LogIn } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";

import { homeHref } from "@/homeLinks";
import { localeFromPathname } from "@/localeRouting";
import { useSiteAccountSessionV3 } from "@/components/site/SiteAccountSessionV3";
import {
  continueStudioWithGoogleV1,
  requestStudioMagicLinkV1,
} from "@/studio/infrastructure/supabase/StudioSupabaseAuthV1";

type AccountAccessStatusV3 = "idle" | "sending" | "sent" | "redirecting";

export function AccountAccessV3Page() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const locale = localeFromPathname(location.pathname);
  const { account, authIdentity, loading } = useSiteAccountSessionV3();
  const [email, setEmail] = React.useState("");
  const [status, setStatus] = React.useState<AccountAccessStatusV3>("idle");
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!loading && account !== null) navigate(homeHref(locale), { replace: true });
  }, [account, loading, locale, navigate]);

  const redirectTo = `${window.location.origin}${homeHref(locale)}`;
  const sendMagicLink = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus("sending");
    setError(null);
    try {
      await requestStudioMagicLinkV1({ email, redirectTo });
      setStatus("sent");
    } catch (cause) {
      setStatus("idle");
      setError(errorMessageV3(cause));
    }
  };

  const continueWithGoogle = async () => {
    setStatus("redirecting");
    setError(null);
    try {
      await continueStudioWithGoogleV1({ redirectTo });
    } catch (cause) {
      setStatus("idle");
      setError(errorMessageV3(cause));
    }
  };

  const unconfigured = authIdentity.kind === "unconfigured";
  return (
    <div className="h-full overflow-y-auto bg-wb-app text-wb-text">
      <main className="mx-auto flex min-h-full w-full max-w-md flex-col justify-center px-6 py-16">
        <LogIn className="h-6 w-6 text-wb-accent" aria-hidden="true" />
        <h1 className="mt-5 text-2xl font-semibold tracking-[-0.025em]">
          {t("accountAccess.title")}
        </h1>
        <p className="mt-3 text-sm leading-7 text-wb-muted">
          {t(authIdentity.kind === "anonymous"
            ? "accountAccess.retainAnonymous"
            : "accountAccess.description")}
        </p>

        {status === "sent" ? (
          <div className="mt-8 rounded-xl bg-wb-soft px-4 py-5" role="status">
            <Check className="h-5 w-5 text-wb-accent" aria-hidden="true" />
            <p className="mt-3 text-sm font-semibold">
              {t("accountAccess.magicLinkSent")}
            </p>
            <p className="mt-1 text-xs leading-6 text-wb-muted">
              {t("accountAccess.magicLinkSentDescription")}
            </p>
          </div>
        ) : (
          <>
            <form className="mt-8" onSubmit={(event) => void sendMagicLink(event)}>
              <label htmlFor="account-email-v3" className="text-xs font-medium text-wb-muted">
                {t("accountAccess.email")}
              </label>
              <input
                id="account-email-v3"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.currentTarget.value)}
                placeholder={t("accountAccess.emailPlaceholder")}
                className="mt-2 h-11 w-full rounded-lg border border-wb-line bg-wb-panel px-3 text-sm outline-none transition-colors placeholder:text-wb-subtle focus:border-wb-accent"
              />
              <button
                type="submit"
                disabled={unconfigured || status !== "idle"}
                className="mt-3 inline-flex h-11 w-full items-center justify-center rounded-lg bg-wb-primary px-4 text-sm font-semibold text-white transition-[background-color,transform] hover:bg-wb-primary-hover active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-45"
              >
                {status === "sending"
                  ? t("accountAccess.sending")
                  : t("accountAccess.continueWithEmail")}
              </button>
            </form>

            <div className="my-5 flex items-center gap-3 text-[11px] text-wb-subtle">
              <span className="h-px flex-1 bg-wb-line" />
              {t("accountAccess.or")}
              <span className="h-px flex-1 bg-wb-line" />
            </div>

            <button
              type="button"
              disabled={unconfigured || status !== "idle"}
              onClick={() => void continueWithGoogle()}
              className="inline-flex h-11 w-full items-center justify-center rounded-lg border border-wb-line bg-wb-panel px-4 text-sm font-semibold transition-[background-color,transform] hover:bg-wb-hover active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-45"
            >
              {status === "redirecting"
                ? t("accountAccess.redirecting")
                : t("accountAccess.continueWithGoogle")}
            </button>
          </>
        )}

        {unconfigured && (
          <p className="mt-5 text-xs leading-6 text-wb-danger" role="alert">
            {t("accountAccess.unconfigured")}
          </p>
        )}
        {error !== null && (
          <p className="mt-5 text-xs leading-6 text-wb-danger" role="alert">
            {error}
          </p>
        )}
        <p className="mt-8 text-[11px] leading-5 text-wb-subtle">
          {t("accountAccess.noPassword")}
        </p>
      </main>
    </div>
  );
}

function errorMessageV3(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export default AccountAccessV3Page;
