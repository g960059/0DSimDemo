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
import { courseReadingEntryV1 } from "@/studio/application/course/StudioCourseReadingPositionV1";
import { courseArticleHrefV1 } from "@/studio/application/course/StudioCourseV1";
import { HomePageV1, type HomeResumeV1 } from "./home/HomePageV1";
import {
  HOME_FILTER_V1,
  readHomeBookmarksV1,
  writeHomeBookmarksV1,
  readHomeIntroCollapsedV1,
  HOME_INTRO_COLLAPSED_KEY_V1,
  type HomeFilterV1,
  type HomeItemV1,
} from "./home/HomeDiscoveryV1";

const visitKey = "circleheart.home.last-visit.v1";
function readLastVisit() {
  try {
    const date = Number(localStorage.getItem(visitKey));
    return Number.isFinite(date) && date > 0 && date <= Date.now()
      ? date
      : null;
  } catch {
    return null;
  }
}
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
    { account } = useSiteAccountSessionV3();
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
  const [lastVisit] = React.useState(readLastVisit),
    [introCollapsed, setIntroCollapsed] = React.useState(() =>
      readHomeIntroCollapsedV1(),
    ),
    [introExpanded, setIntroExpanded] = React.useState(false),
    [demoOpen, setDemoOpen] = React.useState(false),
    [preset, setPreset] = React.useState(0),
    [notice, setNotice] = React.useState(""),
    [loginPrompt, setLoginPrompt] = React.useState(false);
  const [bookmarkState, setBookmarkState] = React.useState<{
    accountId: string | null;
    values: ReadonlySet<string>;
  }>({ accountId: null, values: new Set() });
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
    setBookmarkState({
      accountId,
      values: readHomeBookmarksV1(accountId, storage),
    });
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
      if (!state.error)
        try {
          localStorage.setItem(visitKey, String(Date.now()));
        } catch {
          /* optional browsing history */
        }
    }
  }, [data, state.error]);
  React.useEffect(() => {
    const shortcut = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        document.getElementById("home-search")?.focus();
      }
      if (e.key === "Escape" && document.activeElement?.id === "home-search") {
        setFilter((value) => ({ ...value, query: "" }));
        (document.activeElement as HTMLElement).blur();
      }
    };
    window.addEventListener("keydown", shortcut);
    return () => window.removeEventListener("keydown", shortcut);
  }, []);
  React.useEffect(() => {
    if (!notice) return;
    const timeout = setTimeout(() => setNotice(""), 3500);
    return () => clearTimeout(timeout);
  }, [notice]);
  const resume = React.useMemo<HomeResumeV1 | null>(() => {
    for (const course of data?.courses ?? []) {
      const position = courseReadingEntryV1(course, accountId ?? undefined);
      if (position.resume && position.entry)
        return {
          title: position.entry.title!,
          href: courseArticleHrefV1(course, position.entry),
          courseId: course.courseId,
          articleId: position.entry.articleId,
          chapter: course.entries.indexOf(position.entry) + 1,
        };
    }
    return null;
  }, [data, accountId]);
  const save = (item: HomeItemV1) => {
    if (!accountId) {
      setLoginPrompt(true);
      return;
    }
    const values = new Set(saved);
    values.has(item.key) ? values.delete(item.key) : values.add(item.key);
    if (values.size > 500) {
      setNotice(
        locale === "ja"
          ? "保存は500件までです。"
          : "You can save up to 500 items.",
      );
      return;
    }
    let stored = false;
    try {
      stored = writeHomeBookmarksV1(accountId, values, localStorage);
    } catch {
      /* storage may be denied */
    }
    setBookmarkState({ accountId, values });
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
      returning={!introExpanded && (introCollapsed || resume !== null)}
      signedIn={accountId !== null}
      loginPrompt={loginPrompt && accountId === null}
      onDismissLogin={() => setLoginPrompt(false)}
      onCollapseIntro={() => {
        setIntroExpanded(false);
        setIntroCollapsed(true);
        try {
          localStorage.setItem(HOME_INTRO_COLLAPSED_KEY_V1, "1");
        } catch {
          /* optional preference */
        }
      }}
      onExpandIntro={() => {
        setIntroExpanded(true);
        setIntroCollapsed(false);
        try {
          localStorage.removeItem(HOME_INTRO_COLLAPSED_KEY_V1);
        } catch {
          /* optional preference */
        }
      }}
      demoOpen={demoOpen}
      resume={resume}
      lastVisit={lastVisit}
      preset={preset}
      notice={notice}
      onFilter={(next) => {
        setFilter(next);
        setLimit(9);
      }}
      onSave={save}
      onMore={() => setLimit((n) => n + 9)}
      onDemo={() => setDemoOpen((v) => !v)}
      onPreset={setPreset}
      onRetry={() => setRetry((n) => n + 1)}
    />
  );
}
