import React from "react";
import {
  ArrowRight,
  Bookmark,
  BookOpen,
  BookOpenText,
  FlaskConical,
  Search,
  Grid2X2,
  Clock,
  Star,
  ChevronDown,
  X,
} from "lucide-react";
import type { StudioPublicHomeBootstrapV1 } from "@/studio/application/publication/StudioPublicHomeBootstrapV1";
import { courseArticleHrefV1 } from "@/studio/application/course/StudioCourseV1";
import { formatStudioPublicArticleDateV1 } from "@/studio/application/publication/StudioPublicArticlePresentationV1";
import {
  HOME_FILTER_V1,
  HOME_TOPICS_V1,
  homeItemsV1,
  selectHomeItemsV1,
  type HomeItemV1,
  type HomeFilterV1,
  type HomeKindV1,
} from "./HomeDiscoveryV1";
import { HomeHeroV1 } from "./HomeHeroV1";
export type HomeResumeV1 = Readonly<{
  title: string;
  href: string;
  courseId: string;
  articleId: string;
  chapter: number;
}>;
export type HomePagePropsV1 = Readonly<{
  locale: "ja" | "en";
  data: StudioPublicHomeBootstrapV1 | null;
  filter?: HomeFilterV1;
  saved?: ReadonlySet<string>;
  limit?: number;
  returning?: boolean;
  demoOpen?: boolean;
  resume?: HomeResumeV1 | null;
  lastVisit?: number | null;
  preset?: number;
  error?: boolean;
  notice?: string;
  staticRender?: boolean;
  signedIn?: boolean;
  loginPrompt?: boolean;
  onDismissLogin?: () => void;
  onCollapseIntro?: () => void;
  onExpandIntro?: () => void;
  onFilter?: (filter: HomeFilterV1) => void;
  onSave?: (item: HomeItemV1) => void;
  onMore?: () => void;
  onDemo?: () => void;
  onPreset?: (index: number) => void;
  onRetry?: () => void;
}>;
const kindLabels = {
  ja: {
    all: "すべて",
    course: "コース",
    article: "記事",
    experiment: "シミュレーション",
  },
  en: {
    all: "All",
    course: "Courses",
    article: "Articles",
    experiment: "Simulations",
  },
};
const kindIcons = {
  all: Grid2X2,
  course: BookOpen,
  article: BookOpenText,
  experiment: FlaskConical,
};
export function HomePageV1(props: HomePagePropsV1) {
  const {
    locale,
    data,
    filter = HOME_FILTER_V1,
    saved = new Set<string>(),
    limit = 9,
    returning = false,
    demoOpen = false,
    resume = null,
    lastVisit = null,
  } = props;
  const ja = locale === "ja",
    items = data ? homeItemsV1(data) : [],
    visible = selectHomeItemsV1(items, filter, saved);
  const featured =
    items.find((i) => i.featured && i.course) ??
    items.find((i) => i.kind === "course" && i.author?.official);
  const newCount = lastVisit
    ? items.filter((i) => Date.parse(i.publishedAt) > lastVisit).length
    : 0;
  const firstChapter = featured?.course?.entries.find((e) => e.available);
  const startHref =
    featured?.course && firstChapter
      ? courseArticleHrefV1(featured.course, firstChapter)
      : `/${locale}/experiments`;
  const startLabel = featured
    ? ja
      ? `「${featured.title}」を読み始める`
      : `Start “${featured.title}”`
    : ja
      ? "シミュレーションを試す"
      : "Explore simulations";
  const set = (patch: Partial<HomeFilterV1>) =>
    props.onFilter?.({ ...filter, ...patch });
  const isDefault =
    filter.kind === "all" &&
    filter.sort === "recommended" &&
    !filter.query &&
    !filter.topic &&
    !filter.since;
  return (
    <div
      className={
        "home-page public-static-home" +
        (props.staticRender ? " home-static-render" : "")
      }
      data-public-static-scroll-host="true"
    >
      <a className="home-skip-link" href="#home-discovery">
        {ja ? "コンテンツ一覧へ" : "Skip to content"}
      </a>
      <main className="home-container">
        {props.staticRender && (
          <div className="home-static-return home-return">
            <h1 className="sr-only">
              {ja
                ? "循環動態を、動かして学ぶ。"
                : "Understand circulation by changing it."}
            </h1>
            <BookOpen aria-hidden="true" />
            <div>
              <small>{ja ? "新しい発見へ" : "Find something new"}</small>
              <a href={startHref}>
                {startLabel}
                <ArrowRight aria-hidden="true" />
              </a>
            </div>
          </div>
        )}
        <section
          className={"home-intro " + (returning ? "is-returning" : "")}
          aria-label={ja ? "はじめに" : "Introduction"}
        >
          {returning ? (
            <div className="home-return">
              <h1 className="sr-only">
                {ja
                  ? "循環動態を、動かして学ぶ。"
                  : "Understand circulation by changing it."}
              </h1>
              <BookOpen aria-hidden="true" />
              <div>
                <small>
                  {resume
                    ? ja
                      ? "続きから"
                      : "Continue reading"
                    : ja
                      ? "新しい発見へ"
                      : "Find something new"}
                </small>
                {resume ? (
                  <a href={resume.href}>
                    {resume.title}
                    <ArrowRight aria-hidden="true" />
                  </a>
                ) : (
                  <a href={startHref}>
                    {startLabel}
                    <ArrowRight aria-hidden="true" />
                  </a>
                )}
              </div>
              <div className="home-return-actions">
                <button type="button" onClick={props.onExpandIntro}>
                  {ja ? "紹介を表示" : "Show introduction"}
                </button>
                {newCount > 0 && (
                  <button
                    type="button"
                    onClick={() => set({ since: lastVisit, sort: "new" })}
                  >
                    <span>{newCount}</span>{" "}
                    {ja ? "前回から新着" : "New since your last visit"}
                  </button>
                )}
                <button
                  type="button"
                  aria-expanded={demoOpen}
                  onClick={props.onDemo}
                >
                  {demoOpen
                    ? ja
                      ? "デモを閉じる"
                      : "Close demo"
                    : ja
                      ? "デモを開く"
                      : "Open demo"}
                </button>
              </div>
            </div>
          ) : (
            <div className="home-intro-copy">
              <h1>
                {ja ? (
                  <>
                    循環動態を、
                    <br />
                    動かして学ぶ。
                  </>
                ) : (
                  <>
                    Understand circulation.
                    <br />
                    By changing it.
                  </>
                )}
              </h1>
              <p>
                {ja
                  ? "記事を読みながら、その場でシミュレーションを動かす。前負荷・後負荷・収縮性の変化を、説明できる理解へ。"
                  : "Read an explanation, change the conditions, and see how pressure and volume respond. Turn observations into understanding."}
              </p>
              <div className="home-hero-actions">
                <a
                  className="home-primary"
                  href={featured?.href ?? `/${locale}/courses`}
                >
                  <BookOpen aria-hidden="true" />
                  {ja ? "コースを始める" : "Start a course"}
                </a>
                <a className="home-secondary" href={`/${locale}/experiments`}>
                  <FlaskConical aria-hidden="true" />
                  {ja ? "シミュレーションを試す" : "Explore simulations"}
                </a>
              </div>
              {featured && (
                <p className="home-start-note">
                  {ja
                    ? `「${featured.title}」から、ひとつずつ。`
                    : `Begin with “${featured.title}”.`}
                </p>
              )}
              <button
                className="home-collapse-intro"
                type="button"
                disabled={!props.onCollapseIntro}
                onClick={props.onCollapseIntro}
              >
                {ja
                  ? "次回から紹介を折りたたむ"
                  : "Keep the introduction collapsed"}
                <ChevronDown aria-hidden="true" />
              </button>
            </div>
          )}
          {(!returning || demoOpen) && (
            <HomeHeroV1
              locale={locale}
              preset={props.preset}
              onPreset={props.onPreset}
            />
          )}
        </section>
        <section
          id="home-discovery"
          className="home-discovery"
          aria-labelledby="home-discovery-title"
        >
          <div className="home-discovery-heading">
            <h2 id="home-discovery-title">{ja ? "見つける" : "Discover"}</h2>
            <p>
              {ja
                ? "コース・記事・シミュレーション。公式もコミュニティも、ひとつの一覧に。"
                : "Courses, articles and simulations, from CircleHeart and the community."}
            </p>
          </div>
          <div className="home-search-row">
            <label className="home-search">
              <Search aria-hidden="true" />
              <span className="sr-only">
                {ja ? "公開コンテンツを検索" : "Search public content"}
              </span>
              <input
                id="home-search"
                type="search"
                disabled={!props.onFilter}
                placeholder={
                  ja
                    ? "タイトル・説明・著者で検索"
                    : "Search titles, descriptions, authors"
                }
                value={filter.query}
                onChange={(e) => set({ query: e.target.value })}
              />
              <kbd aria-hidden="true">⌘K</kbd>
            </label>
          </div>
          <div className="home-browse">
            <div
              className="home-kinds"
              role="group"
              aria-label={ja ? "コンテンツの種類" : "Content type"}
            >
              {(["all", "course", "article", "experiment"] as const).map(
                (kind) => {
                  const Icon = kindIcons[kind],
                    count = selectHomeItemsV1(
                      items,
                      { ...filter, kind },
                      saved,
                    ).length;
                  return (
                    <button
                      type="button"
                      key={kind}
                      disabled={!props.onFilter}
                      aria-pressed={filter.kind === kind}
                      onClick={() => set({ kind })}
                    >
                      <Icon aria-hidden="true" />
                      {kindLabels[locale][kind]}
                      {kind !== "all" && (
                        <small>{data !== null ? count : ""}</small>
                      )}
                    </button>
                  );
                },
              )}
            </div>
            <div
              className="home-sorts"
              role="group"
              aria-label={ja ? "表示順" : "Order"}
            >
              {(["recommended", "new", "saved"] as const).map((sort) => {
                if (sort === "saved" && !props.signedIn) return null;
                const Icon = { recommended: Star, new: Clock, saved: Bookmark }[
                  sort
                ];
                return (
                  <button
                    type="button"
                    key={sort}
                    disabled={!props.onFilter}
                    aria-pressed={filter.sort === sort}
                    onClick={() => set({ sort, since: null })}
                  >
                    <Icon aria-hidden="true" />
                    {sort === "recommended"
                      ? ja
                        ? "おすすめ"
                        : "Recommended"
                      : sort === "new"
                        ? ja
                          ? "新着"
                          : "Newest"
                        : ja
                          ? "保存済み"
                          : "Saved"}
                    {sort === "saved" && saved.size > 0 && (
                      <small>{saved.size}</small>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
          <div
            className="home-topics"
            role="group"
            aria-label={ja ? "テーマで絞り込む" : "Filter by topic"}
          >
            {HOME_TOPICS_V1.filter((t) =>
              items.some((i) => i.topics.includes(t.id)),
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                disabled={!props.onFilter}
                aria-pressed={filter.topic === t.id}
                onClick={() =>
                  set({ topic: filter.topic === t.id ? "" : t.id })
                }
              >
                {t[locale]}
              </button>
            ))}
          </div>
          {filter.sort === "saved" && (
            <p className="home-catalog-note">
              {ja
                ? "保存はログイン中のアカウントごとに、このブラウザに保持されます。"
                : "Saved items are stored in this browser for your signed-in account."}
            </p>
          )}
          {data &&
            [
              data.articles.length,
              data.experiments.length,
              data.courses?.length ?? 0,
            ].some((count) => count >= 50) && (
              <p className="home-catalog-note">
                {ja
                  ? "トップページでは各種類の直近50件を検索できます。過去のコンテンツは各一覧へ。"
                  : "Search the 50 most recent items of each type here. Open a directory to browse older content."}
              </p>
            )}
          {!isDefault && (
            <p className="home-result-count" role="status">
              {visible.length}
              {ja ? "件" : " results"}{" "}
              {filter.since &&
                (ja ? "· 前回の訪問以降" : " · Since your last visit")}{" "}
              <button
                type="button"
                onClick={() => props.onFilter?.(HOME_FILTER_V1)}
              >
                {ja ? "絞り込みを解除" : "Clear filters"}
              </button>
            </p>
          )}
          {data === null ? (
            <div className="home-loading" role="status">
              {ja
                ? "公開コンテンツを読み込んでいます…"
                : "Loading public content…"}
              <div className="home-skeleton" />
            </div>
          ) : props.error ? (
            <div className="home-empty" role="alert">
              <p>
                {ja
                  ? "公開コンテンツを読み込めませんでした。"
                  : "Public content could not be loaded."}
              </p>
              <button
                type="button"
                className="home-secondary"
                onClick={props.onRetry}
              >
                {ja ? "もう一度読み込む" : "Try again"}
              </button>
            </div>
          ) : visible.length === 0 ? (
            <div className="home-empty">
              <Search aria-hidden="true" />
              <p>
                {filter.sort === "saved"
                  ? ja
                    ? "この一覧に保存済みのコンテンツはありません。"
                    : "No saved items in this selection."
                  : ja
                    ? "条件に合うコンテンツはありません。"
                    : "No content matches these filters."}
              </p>
              <button
                type="button"
                onClick={() => props.onFilter?.(HOME_FILTER_V1)}
              >
                {ja ? "すべて表示" : "Show all"}
              </button>
            </div>
          ) : (
            <div className="home-content-grid">
              {visible.slice(0, limit).map((item) => (
                <HomeCardV1
                  key={item.key}
                  item={item}
                  locale={locale}
                  wide={isDefault && item.key === featured?.key}
                  saved={saved.has(item.key)}
                  resume={resume}
                  onSave={props.onSave}
                />
              ))}
            </div>
          )}
          {visible.length > limit && (
            <button
              type="button"
              className="home-load-more"
              disabled={!props.onMore}
              onClick={props.onMore}
            >
              {ja ? "さらに表示" : "Show more"}
              <ChevronDown aria-hidden="true" />
            </button>
          )}
          <div className="home-directory-links">
            {(["course", "article", "experiment"] as const).map((k) => (
              <a
                key={k}
                href={`/${locale}/${k === "course" ? "courses" : k === "article" ? "articles" : "experiments"}`}
              >
                {ja ? "すべての" : ""}
                {kindLabels[locale][k]} →
              </a>
            ))}
          </div>
        </section>
      </main>
      <footer className="home-footer">
        <div className="home-container">
          <div>
            <strong>CircleHeart</strong>
            <span>
              {ja
                ? "循環動態を、動かして学ぶ。"
                : "Understand circulation by changing it."}
            </span>
          </div>
          <nav aria-label={ja ? "フッターナビゲーション" : "Footer navigation"}>
            <a href={`/${locale}/courses`}>{kindLabels[locale].course}</a>
            <a href={`/${locale}/articles`}>{kindLabels[locale].article}</a>
            <a href={`/${locale}/experiments`}>
              {kindLabels[locale].experiment}
            </a>
            <a href={`/${locale}/models`}>
              {ja ? "数理モデル・プリセット" : "Models & presets"}
            </a>
            <a href={`/${locale}/docs/authoring-cli`}>AI Authoring CLI</a>
            <a href="https://github.com/g960059/0DSimDemo">GitHub</a>
          </nav>
          <p>
            {ja
              ? "CircleHeartは教育・研究支援を目的としており、医療機器ではありません。モデルの前提と利用上の注意は数理モデルページをご確認ください。"
              : "CircleHeart supports education and research; it is not a medical device. See the model documentation for assumptions and limitations."}
          </p>
        </div>
      </footer>
      {props.loginPrompt ? (
        <div className="home-toast" role="status">
          <span>
            {ja
              ? "ログインすると保存できます。"
              : "Sign in to save this for later."}
          </span>
          <a href={`/${locale}/login`}>{ja ? "ログイン" : "Sign in"}</a>
          <button
            type="button"
            aria-label={ja ? "通知を閉じる" : "Dismiss notification"}
            onClick={props.onDismissLogin}
          >
            <X aria-hidden="true" />
          </button>
        </div>
      ) : (
        props.notice && (
          <p className="home-toast" role="status">
            {props.notice}
          </p>
        )
      )}
    </div>
  );
}
function HomeCardV1({
  item,
  locale,
  wide,
  saved,
  resume,
  onSave,
}: {
  item: HomeItemV1;
  locale: "ja" | "en";
  wide: boolean;
  saved: boolean;
  resume: HomeResumeV1 | null;
  onSave?: HomePagePropsV1["onSave"];
}) {
  const ja = locale === "ja",
    Icon = kindIcons[item.kind],
    entries = item.course?.entries.filter((e) => e.available) ?? [];
  const date =
    Date.parse(item.publishedAt) > 0
      ? formatStudioPublicArticleDateV1(item.publishedAt, locale)
      : "";
  const name =
    item.author?.displayName ?? item.authorName ?? (ja ? "作者" : "Author");
  return (
    <article className={"home-card" + (wide ? " home-card-wide" : "")}>
      <a
        className={"home-cover home-cover-" + item.kind}
        href={item.href}
        aria-label={item.title}
        tabIndex={-1}
      >
        <CoverV1 item={item} locale={locale} />
      </a>
      <div className="home-card-body">
        <div className="home-card-type">
          <Icon aria-hidden="true" />
          {kindLabels[locale][item.kind]}
          {item.author?.official && (
            <span className="home-official">{ja ? "公式" : "Official"}</span>
          )}
        </div>
        <h3>
          <a href={item.href}>{item.title}</a>
        </h3>
        {item.description && (
          <p className="home-card-description">{item.description}</p>
        )}
        {!!item.course &&
          entries.length > 0 &&
          (wide ? (
            <ChapterListV1 item={item} resume={resume} />
          ) : (
            <details className="home-chapters">
              <summary>
                {entries.length}
                {ja ? "章を見る" : " chapters"}
                <ChevronDown aria-hidden="true" />
              </summary>
              <ChapterListV1 item={item} resume={resume} />
            </details>
          ))}
        <div className="home-card-bottom">
          <span className="home-author">
            <i className={item.author?.official ? "is-official" : ""}>
              {name.slice(0, 1)}
            </i>
            <span>{name}</span>
          </span>
          <span className="home-item-meta">
            {item.course
              ? `${entries.length}${ja ? "章" : " chapters"}`
              : item.scenarioCount !== undefined
                ? `${item.scenarioCount}${ja ? "シナリオ" : " scenarios"}`
                : ""}
            {date && `${item.kind !== "article" ? " · " : ""}${date}`}
          </span>
          {wide && entries.length > 0 && (
            <a
              className="home-course-start"
              href={
                resume?.courseId === item.id
                  ? resume.href
                  : courseArticleHrefV1(item.course!, entries[0])
              }
            >
              {resume?.courseId === item.id
                ? ja
                  ? "続きから"
                  : "Continue"
                : ja
                  ? "読み始める"
                  : "Start reading"}
              <ArrowRight aria-hidden="true" />
            </a>
          )}
          <button
            type="button"
            className="home-bookmark"
            aria-label={
              (saved
                ? ja
                  ? "保存を解除: "
                  : "Unsave: "
                : ja
                  ? "保存: "
                  : "Save: ") + item.title
            }
            aria-pressed={saved}
            onClick={() => onSave?.(item)}
            disabled={!onSave}
          >
            <Bookmark aria-hidden="true" />
          </button>
        </div>
      </div>
    </article>
  );
}
function ChapterListV1({
  item,
  resume,
}: {
  item: HomeItemV1;
  resume: HomeResumeV1 | null;
}) {
  return (
    <ol className="home-chapter-list">
      {item.course!.entries.map(
        (e, index) =>
          e.available && (
            <li
              key={e.articleId}
              data-current={resume?.articleId === e.articleId || undefined}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              <a href={courseArticleHrefV1(item.course!, e)}>{e.title}</a>
            </li>
          ),
      )}
    </ol>
  );
}
function CoverV1({ item, locale }: { item: HomeItemV1; locale: "ja" | "en" }) {
  const hue = [...item.id].reduce((sum, c) => sum + c.charCodeAt(0), 0) % 4;
  const topic = HOME_TOPICS_V1.find((t) => item.topics.includes(t.id));
  const images = item.thumbnailUrl
    ? [item.thumbnailUrl]
    : (item.chapterThumbnails ?? []);
  return (
    <>
      <div
        className={"home-generated-cover home-cover-tone-" + hue}
        aria-hidden="true"
      >
        {item.kind === "course" ? (
          <>
            <span className="home-cover-number">
              {String(
                item.course?.entries.filter((e) => e.available).length ?? 0,
              ).padStart(2, "0")}
            </span>
            <span className="home-cover-caption">
              {locale === "ja" ? "章の学び" : "chapters to explore"}
            </span>
            <BookOpen strokeWidth={0.65} />
          </>
        ) : item.kind === "article" ? (
          <>
            <span className="home-cover-caption">
              {locale === "ja" ? "読みながら、理解する" : "Read. Understand."}
            </span>
            <span className="home-cover-title">
              {topic?.[locale] ??
                (locale === "ja" ? "循環動態" : "Hemodynamics")}
            </span>
            <BookOpenText strokeWidth={0.8} />
          </>
        ) : (
          <>
            <span className="home-cover-caption">
              {topic?.[locale] ??
                (locale === "ja" ? "循環動態を探索" : "Explore circulation")}
            </span>
            <span className="home-cover-number">
              {String(item.scenarioCount ?? 1).padStart(2, "0")}
            </span>
            <span className="home-cover-caption">
              {locale === "ja" ? "シナリオを動かす" : "scenarios to try"}
            </span>
            <FlaskConical strokeWidth={0.7} />
          </>
        )}
      </div>
      {images.length > 0 && (
        <div
          className={
            "home-cover-images" + (images.length > 1 ? " is-collage" : "")
          }
        >
          {images.map((url) => (
            <img
              key={url}
              src={url}
              alt=""
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              onError={(e) => {
                e.currentTarget.hidden = true;
              }}
            />
          ))}
        </div>
      )}
    </>
  );
}
