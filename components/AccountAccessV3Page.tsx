import { LogIn } from "lucide-react";
import { useTranslation } from "react-i18next";

/** Honest pre-backend account boundary; no local pseudo-authentication. */
export function AccountAccessV3Page() {
  const { t } = useTranslation();
  return (
    <div className="h-full overflow-y-auto bg-wb-app text-wb-text">
      <main className="mx-auto flex min-h-full w-full max-w-xl flex-col justify-center px-6 py-16 text-center">
        <LogIn className="mx-auto h-7 w-7 text-wb-accent" aria-hidden="true" />
        <h1 className="mt-5 text-2xl font-semibold tracking-[-0.025em]">
          {t("accountAccess.title")}
        </h1>
        <p className="mt-3 text-sm leading-7 text-wb-muted">
          {t("accountAccess.preRelease")}
        </p>
      </main>
    </div>
  );
}

export default AccountAccessV3Page;
