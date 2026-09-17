import React from "react";
import { useLocation } from "react-router-dom";
import { localeFromPathname, type Locale } from "@/localeRouting";
import { readPublicHomeCatalogAsyncV3 } from "@/components/site/PublicCatalogV3";
import { completePublicStaticContentHandoffV1 } from "@/components/site/PublicStaticContentHandoffV1";
import { useSiteAccountSessionV3 } from "@/components/site/SiteAccountSessionV3";
import { createStudioSupabaseContentRepositoryV1 } from "@/studio/infrastructure/supabase/StudioSupabaseContentRepositoryV1";
import {
  readStudioPublicHomeBootstrapV1,
  STUDIO_PUBLIC_HOME_BOOTSTRAP_V1_SCHEMA_ID,
  type StudioPublicHomeBootstrapV1,
} from "@/studio/application/publication/StudioPublicHomeBootstrapV1";
import { HomePageV1 } from "./home/HomePageV1";
import { useHomeSearchV1 } from "./home/HomeSearchV1";
import {
  HOME_FILTER_V1,
  readHomeBookmarksV1,
  writeHomeBookmarksV1,
  type HomeFilterV1,
  type HomeItemV1,
} from "./home/HomeDiscoveryV1";

async function loadHome(locale: Locale): Promise<StudioPublicHomeBootstrapV1> {
  const bootstrap = readStudioPublicHomeBootstrapV1(locale);
  if (bootstrap) return bootstrap;
  const repository = createStudioSupabaseContentRepositoryV1();
  const [catalog, courses, featured] = await Promise.all([
    readPublicHomeCatalogAsyncV3(locale),
    repository?.listPublicCourses({ locale }) ?? [],
    repository?.listPublicCourses({ locale, featured: true }) ?? [],
  ]);
  const allCourses = [
    ...new Map([...featured, ...courses].map((c) => [c.courseId, c])).values(),
  ].slice(0, 50);
  return {
    schemaId: STUDIO_PUBLIC_HOME_BOOTSTRAP_V1_SCHEMA_ID,
    locale,
    articles: catalog.articles.filter((a) => a.locale === locale),
    experiments: catalog.experiments.map((e) => ({
      author: e.author,
      experimentId: e.record.experimentId,
      title: e.record.title,
      publicSlug: e.record.experimentId,
      publishedAt: e.record.updatedAt,
      snapshotId: e.snapshotId,
      modelId: e.modelId,
      scenarioCount: e.scenarioCount,
    })),
    courses: allCourses,
    featuredCourseIds: featured
      .map((c) => c.courseId)
      .filter((id) => allCourses.some((c) => c.courseId === id)),
  };
}
export function Home() {
  const { pathname, search } = useLocation(),
    locale = localeFromPathname(pathname),
    { account, loading } = useSiteAccountSessionV3();
  const searchContext = useHomeSearchV1();
  const bootstrap = React.useMemo(
    () => readStudioPublicHomeBootstrapV1(locale),
    [locale],
  );
  const [state, setState] = React.useState<{
    locale: Locale;
    data: StudioPublicHomeBootstrapV1 | null;
    error: boolean;
  }>({ locale, data: bootstrap, error: false });
  const data = state.locale === locale ? state.data : null;
  const [retry, setRetry] = React.useState(0),
    [filter, setFilter] = React.useState<HomeFilterV1>(HOME_FILTER_V1),
    [limit, setLimit] = React.useState(9);
  const [notice, setNotice] = React.useState(""),
    [loginPrompt, setLoginPrompt] = React.useState(false);
  const [bookmarkState, setBookmarkState] = React.useState<{
    accountId: string | null;
    values: ReadonlySet<string>;
    stored: boolean;
  }>({ accountId: null, values: new Set(), stored: true });
  const accountId = account?.accountId ?? null,
    saved =
      bookmarkState.accountId === accountId
        ? bookmarkState.values
        : new Set<string>();
  React.useEffect(() => {
    let storage: Storage | undefined;
    try {
      storage = window.localStorage;
    } catch {
      /* optional storage */
    }
    const refresh = () => setBookmarkState({
      accountId,
      values: readHomeBookmarksV1(accountId, storage),
      stored: true,
    });
    refresh();
    setFilter((current) => current.savedOnly
      ? { ...current, savedOnly: false }
      : current);
    const onStorage = (event: StorageEvent) => {
      if (storage && event.storageArea === storage &&
        (event.key === null || event.key === "circleheart.home.saved.v1:" + accountId)) {
        refresh();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [accountId]);
  React.useEffect(() => {
    let current = true;
    setFilter({
      ...HOME_FILTER_V1,
      query: new URLSearchParams(search).get("q") ?? "",
    });
    setLimit(9);
    if (bootstrap) {
      setState({ locale, data: bootstrap, error: false });
      return;
    }
    setState({ locale, data: null, error: false });
    void loadHome(locale)
      .then((next) => {
        if (current) setState({ locale, data: next, error: false });
      })
      .catch(() => {
        if (current)
          setState({
            locale,
            data: {
              schemaId: STUDIO_PUBLIC_HOME_BOOTSTRAP_V1_SCHEMA_ID,
              locale,
              articles: [],
              experiments: [],
              courses: [],
            },
            error: true,
          });
      });
    return () => {
      current = false;
    };
  }, [bootstrap, locale, retry, search]);
  React.useEffect(() => {
    if (data !== null) {
      completePublicStaticContentHandoffV1();
    }
  }, [data]);
  React.useEffect(() => {
    searchContext?.publish(data);
    return () => searchContext?.publish(null);
  }, [data, searchContext?.publish]);
  React.useEffect(() => {
    if (!notice) return;
    const timeout = setTimeout(() => setNotice(""), 3500);
    return () => clearTimeout(timeout);
  }, [notice]);
  const save = (item: HomeItemV1) => {
    if (!accountId) {
      setLoginPrompt(true);
      return;
    }
    let storage: Storage | undefined;
    try {
      storage = window.localStorage;
    } catch {
      /* optional storage */
    }
    // Merge into the latest other-tab saves; keep page-only changes if a
    // previous write failed. The action follows the button's visible state.
    const values = new Set(bookmarkState.stored
      ? readHomeBookmarksV1(accountId, storage, saved)
      : saved);
    saved.has(item.key) ? values.delete(item.key) : values.add(item.key);
    if (values.size > 500) {
      setNotice(
        locale === "ja"
          ? "保存は500件までです。"
          : "You can save up to 500 items.",
      );
      return;
    }
    const stored = storage ? writeHomeBookmarksV1(accountId, values, storage) : false;
    setBookmarkState({ accountId, values, stored });
    setNotice(
      stored
        ? locale === "ja"
          ? "このブラウザの保存を更新しました。"
          : "Saved items updated in this browser."
        : locale === "ja"
          ? "保存領域を利用できないため、この画面を開いている間だけ保持します。"
          : "Storage is unavailable; this change lasts for this page only.",
    );
  };
  return (
    <HomePageV1
      locale={locale}
      data={data}
      error={state.locale === locale && state.error}
      filter={filter}
      saved={saved}
      limit={limit}
      signedIn={accountId !== null}
      loginPrompt={loginPrompt && accountId === null}
      onDismissLogin={() => setLoginPrompt(false)}
      notice={notice}
      onFilter={(next) => {
        setFilter(next);
        setLimit(9);
      }}
      onSave={loading ? undefined : save}
      onMore={() => setLimit((n) => n + 9)}
      onRetry={() => setRetry((n) => n + 1)}
    />
  );
}
