import React from "react";

import {
  readStudioAuthIdentityV1,
  signOutStudioAccountV1,
  studioAuthIdentityForUserV1,
  type StudioAuthIdentityV1,
} from "@/studio/infrastructure/supabase/StudioSupabaseAuthV1";
import {
  studioSupabaseClientV1,
} from "@/studio/infrastructure/supabase/StudioSupabaseClientV1";

export type SiteAccountV3 = Readonly<{
  accountId: string;
  displayName: string;
  avatarUrl?: string;
}>;

export type SiteAccountSessionV3 = Readonly<{
  account: SiteAccountV3 | null;
  authIdentity: StudioAuthIdentityV1;
  loading: boolean;
  signOut?: () => void | Promise<void>;
}>;

const ANONYMOUS_SITE_ACCOUNT_SESSION_V3: SiteAccountSessionV3 = Object.freeze({
  account: null,
  authIdentity: Object.freeze({ kind: "signed-out" }),
  loading: false,
});

const SiteAccountSessionContextV3 = React.createContext<SiteAccountSessionV3>(
  ANONYMOUS_SITE_ACCOUNT_SESSION_V3,
);

/**
 * Authentication adapter boundary for site chrome.
 *
 * Supabase sessions are observed here, while browser data access remains
 * behind Studio repository adapters. Anonymous backend users intentionally do
 * not become a visible signed-in profile in the site header.
 */
export function SiteAccountSessionProviderV3({
  children,
  session,
}: Readonly<{
  children: React.ReactNode;
  /** Deterministic site-shell injection used by isolated component tests. */
  session?: Readonly<{
    account: SiteAccountV3 | null;
    signOut?: () => void | Promise<void>;
  }>;
}>) {
  const client = React.useMemo(() => studioSupabaseClientV1(), []);
  const [identity, setIdentity] = React.useState<StudioAuthIdentityV1>(
    client === null
      ? Object.freeze({ kind: "unconfigured" })
      : Object.freeze({ kind: "signed-out" }),
  );
  const [loading, setLoading] = React.useState(client !== null);

  React.useEffect(() => {
    if (client === null || session !== undefined) return undefined;
    let current = true;
    void readStudioAuthIdentityV1(client).then((next) => {
      if (current) setIdentity(next);
    }).catch(() => {
      if (current) setIdentity(Object.freeze({ kind: "signed-out" }));
    }).finally(() => {
      if (current) setLoading(false);
    });
    const { data } = client.auth.onAuthStateChange((_event, session) => {
      if (!current) return;
      setIdentity(session === null
        ? Object.freeze({ kind: "signed-out" })
        : studioAuthIdentityForUserV1(session.user));
      setLoading(false);
    });
    return () => {
      current = false;
      data.subscription.unsubscribe();
    };
  }, [client, session]);

  const value = React.useMemo<SiteAccountSessionV3>(() => {
    if (session !== undefined) {
      return Object.freeze({
        ...session,
        authIdentity: session.account === null
          ? Object.freeze({ kind: "signed-out" as const })
          : Object.freeze({
              kind: "account" as const,
              userId: session.account.accountId,
              displayName: session.account.displayName,
              email: null,
              avatarUrl: session.account.avatarUrl ?? null,
            }),
        loading: false,
      });
    }
    const account = identity.kind === "account"
      ? Object.freeze({
          accountId: identity.userId,
          displayName: identity.displayName,
          ...(identity.avatarUrl === null
            ? {}
            : { avatarUrl: identity.avatarUrl }),
        })
      : null;
    return Object.freeze({
      account,
      authIdentity: identity,
      loading,
      ...(client === null
        ? {}
        : { signOut: () => signOutStudioAccountV1(client) }),
    });
  }, [client, identity, loading, session]);

  return (
    <SiteAccountSessionContextV3.Provider value={value}>
      {children}
    </SiteAccountSessionContextV3.Provider>
  );
}

export function useSiteAccountSessionV3(): SiteAccountSessionV3 {
  return React.useContext(SiteAccountSessionContextV3);
}
