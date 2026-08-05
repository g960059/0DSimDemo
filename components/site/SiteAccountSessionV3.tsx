import React from "react";

export type SiteAccountV3 = Readonly<{
  accountId: string;
  displayName: string;
  avatarUrl?: string;
}>;

export type SiteAccountSessionV3 = Readonly<{
  account: SiteAccountV3 | null;
  signOut?: () => void | Promise<void>;
}>;

const ANONYMOUS_SITE_ACCOUNT_SESSION_V3: SiteAccountSessionV3 = Object.freeze({
  account: null,
});

const SiteAccountSessionContextV3 = React.createContext<SiteAccountSessionV3>(
  ANONYMOUS_SITE_ACCOUNT_SESSION_V3,
);

/**
 * Authentication adapter boundary for site chrome.
 *
 * The pre-release browser build has no authentication backend, so the root
 * intentionally supplies the anonymous session. Firebase (or another
 * identity provider) can later feed this context without coupling navigation
 * or locale presentation to its SDK.
 */
export function SiteAccountSessionProviderV3({
  children,
  session = ANONYMOUS_SITE_ACCOUNT_SESSION_V3,
}: Readonly<{
  children: React.ReactNode;
  session?: SiteAccountSessionV3;
}>) {
  return (
    <SiteAccountSessionContextV3.Provider value={session}>
      {children}
    </SiteAccountSessionContextV3.Provider>
  );
}

export function useSiteAccountSessionV3(): SiteAccountSessionV3 {
  return React.useContext(SiteAccountSessionContextV3);
}
