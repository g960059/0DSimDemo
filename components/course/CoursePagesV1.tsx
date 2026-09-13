import React from "react";
import { readStudioPublicHomeBootstrapV1 } from "@/studio/application/publication/StudioPublicHomeBootstrapV1";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { createStudioSupabaseContentRepositoryV1 } from "@/studio/infrastructure/supabase/StudioSupabaseContentRepositoryV1";
import {
  courseArticleHrefV1,
  courseHrefV1,
  courseUuidV1,
  type CourseContentV1,
  type CourseDraftV1,
  type PublicCourseV1,
} from "@/studio/application/course/StudioCourseV1";
import { useSiteAccountSessionV3 } from "@/components/site/SiteAccountSessionV3";
import { completePublicStaticContentHandoffV1 } from "@/components/site/PublicStaticContentHandoffV1";
import { localeFromPathname } from "@/localeRouting";

const control =
  "min-h-10 rounded-lg border border-wb-line px-3 py-2 text-sm hover:bg-wb-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent disabled:opacity-40";
const field =
  "w-full rounded-lg border border-wb-line bg-wb-panel px-3 py-2 text-wb-text";
const shell = "mx-auto w-full max-w-3xl px-5 py-10 sm:px-8";
function useCourseEnvironment() {
  const { pathname } = useLocation();
  const locale = localeFromPathname(pathname);
  const repository = React.useMemo(createStudioSupabaseContentRepositoryV1, []);
  return { locale, ja: locale === "ja", repository };
}
export function CourseCardV1({ course }: { course: PublicCourseV1 }) {
  return (
    <Link
      to={courseHrefV1(course.courseId, course.locale)}
      className="block min-w-0 rounded-xl border border-wb-line bg-wb-panel p-5 hover:bg-wb-hover"
    >
      <h3 className="text-lg font-semibold leading-relaxed">{course.title}</h3>
      <p className="mt-2 text-sm leading-7 text-wb-muted">
        {course.description}
      </p>
      <p className="mt-3 text-xs text-wb-muted">
        {course.authorName} · {course.entries.length}
        {course.locale === "ja" ? "章" : " chapters"}
      </p>
    </Link>
  );
}
export function FeaturedCoursesV1() {
  const { repository, locale, ja } = useCourseEnvironment();
  const bootstrap = React.useMemo(
    () => readStudioPublicHomeBootstrapV1(locale)?.courses ?? [],
    [locale],
  );
  const [state, setState] = React.useState({ locale, courses: bootstrap });
  const courses = state.locale === locale ? state.courses : bootstrap;
  React.useEffect(() => {
    let current = true;
    setState({ locale, courses: bootstrap });
    void repository
      ?.listPublicCourses({ locale, featured: true })
      .then((c) => {
        if (current) setState({ locale, courses: c });
      })
      .catch(() => {});
    return () => {
      current = false;
    };
  }, [repository, locale, bootstrap]);
  return (
    <section className="pb-12" aria-label={ja ? "コース" : "Courses"}>
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold">
          {ja ? "コースで学ぶ" : "Learn with courses"}
        </h2>
        <Link className="text-sm text-wb-accent" to={`/${locale}/courses`}>
          {ja ? "コースを見る" : "Explore courses"} →
        </Link>
      </div>
      {courses.length > 0 && (
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {courses.map((c) => (
            <CourseCardV1 key={c.courseId} course={c} />
          ))}
        </div>
      )}
    </section>
  );
}
export function CourseDirectoryPageV1() {
  const { pathname } = useLocation();
  const { account } = useSiteAccountSessionV3();
  return (
    <CourseDirectoryResourceV1
      key={`${pathname}:${account?.accountId ?? "guest"}`}
    />
  );
}
function CourseDirectoryResourceV1() {
  const { repository, locale, ja } = useCourseEnvironment();
  const { pathname } = useLocation();
  const mine = pathname.includes("/me/");
  const [courses, setCourses] = React.useState<
    readonly (PublicCourseV1 | CourseDraftV1)[]
  >([]);
  const [error, setError] = React.useState("");
  const [pending, setPending] = React.useState(true);
  const [more, setMore] = React.useState(false);
  const requestId = React.useRef(0);
  React.useEffect(
    () => () => {
      requestId.current++;
    },
    [],
  );
  const load = React.useCallback(
    async (offset: number) => {
      const request = ++requestId.current;
      setPending(true);
      setError("");
      try {
        const result =
          repository === null
            ? []
            : mine
              ? await repository.listMyCourses({ locale, offset })
              : await repository.listPublicCourses({ locale, offset });
        if (request !== requestId.current) return;
        setCourses((c) => (offset ? [...c, ...result] : result));
        setMore(result.length === 50);
        completePublicStaticContentHandoffV1();
      } catch (e) {
        if (request === requestId.current) setError(String(e));
      } finally {
        if (request === requestId.current) setPending(false);
      }
    },
    [repository, mine, locale],
  );
  React.useEffect(() => {
    void load(0);
  }, [load]);
  return (
    <div
      className="h-full overflow-y-auto bg-wb-app text-wb-text"
      data-testid="course-directory"
    >
      <main className={shell}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-3xl font-semibold">
            {mine
              ? ja
                ? "自分のコース"
                : "My courses"
              : ja
                ? "コース"
                : "Courses"}
          </h1>
          <Link className={control} to={`/${locale}/courses/new`}>
            {ja ? "コースを作成" : "Create course"}
          </Link>
        </div>
        <p className="mt-4 text-wb-muted">
          {ja
            ? "記事を順に読み、実験で確かめる。"
            : "Read connected articles and explore their experiments."}
        </p>
        {error && (
          <p role="alert" className="mt-6">
            {error}
          </p>
        )}
        <div className="mt-8 grid gap-4">
          {courses.map((c) =>
            "content" in c ? (
              <Link
                className="rounded-xl border border-wb-line p-5"
                key={c.courseId}
                to={`${courseHrefV1(c.courseId, locale)}/edit`}
              >
                <h2 className="font-semibold">{c.content.title}</h2>
                <p className="mt-2 text-sm text-wb-muted">
                  {c.published
                    ? ja
                      ? "公開中"
                      : "Published"
                    : ja
                      ? "下書き"
                      : "Draft"}
                </p>
              </Link>
            ) : (
              <CourseCardV1 key={c.courseId} course={c} />
            ),
          )}
        </div>
        {pending ? (
          <p role="status" className="mt-6">
            {ja ? "読み込み中…" : "Loading…"}
          </p>
        ) : courses.length === 0 && !error ? (
          <p className="mt-6">
            {ja ? "コースはまだありません。" : "No courses yet."}
          </p>
        ) : null}
        {more && (
          <button
            className={`${control} mt-6`}
            disabled={pending}
            onClick={() => void load(courses.length)}
          >
            {ja ? "さらに表示" : "Load more"}
          </button>
        )}
      </main>
    </div>
  );
}
export function CourseReaderPageV1() {
  const { courseId } = useParams();
  const { repository, locale, ja } = useCourseEnvironment();
  const { account } = useSiteAccountSessionV3();
  const navigate = useNavigate();
  const [course, setCourse] = React.useState<PublicCourseV1 | null>(null);
  const [pending, setPending] = React.useState(true);
  const [error, setError] = React.useState("");
  React.useEffect(() => {
    let current = true;
    setPending(true);
    setCourse(null);
    setError("");
    void (
      repository && courseId && courseUuidV1.test(courseId)
        ? repository.readPublicCourse(courseId)
        : Promise.resolve(null)
    )
      .then((c) => {
        if (current) {
          setCourse(c);
          completePublicStaticContentHandoffV1();
          if (c && c.locale !== locale)
            navigate(courseHrefV1(c.courseId, c.locale), { replace: true });
        }
      })
      .catch((e) => {
        if (current) setError(String(e));
      })
      .finally(() => {
        if (current) setPending(false);
      });
    return () => {
      current = false;
    };
  }, [repository, courseId, locale, navigate]);
  return (
    <div
      className="h-full overflow-y-auto bg-wb-app text-wb-text"
      data-public-static-scroll-host="true"
      data-testid="course-reader"
    >
      <main className={shell}>
        <Link className="text-sm text-wb-accent" to={`/${locale}/courses`}>
          ← {ja ? "コース" : "Courses"}
        </Link>
        {pending ? (
          <p role="status" className="mt-8">
            {ja ? "読み込み中…" : "Loading…"}
          </p>
        ) : error ? (
          <p role="alert">{error}</p>
        ) : !course ? (
          <h1 className="mt-8 text-xl">
            {ja
              ? "このコースは現在公開されていません。"
              : "This course is not currently published."}
          </h1>
        ) : (
          <>
            <h1 className="mt-6 text-3xl font-bold leading-snug">
              {course.title}
            </h1>
            <p className="mt-3 text-sm text-wb-muted">
              {ja ? "編集：" : "Edited by "}
              {course.authorName}
            </p>
            <p className="mt-6 whitespace-pre-line leading-8">
              {course.description}
            </p>
            {course.audience && (
              <p className="mt-4 text-sm leading-7 text-wb-muted">
                {ja ? "対象読者：" : "Audience: "}
                {course.audience}
              </p>
            )}
            {account?.accountId === course.ownerId && (
              <Link
                className={`${control} mt-5 inline-flex`}
                to={`${courseHrefV1(course.courseId, locale)}/edit`}
              >
                {ja ? "編集" : "Edit"}
              </Link>
            )}
            <h2 className="mt-10 text-xl font-semibold">
              {ja ? "目次" : "Contents"}
            </h2>
            <ol className="mt-4 divide-y divide-wb-line">
              {course.entries.map((entry, i) => (
                <li key={entry.articleId} className="flex gap-4 py-5">
                  <span className="text-sm text-wb-muted">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    {entry.available ? (
                      <>
                        <Link
                          className="font-semibold leading-7 text-wb-accent"
                          to={courseArticleHrefV1(course, entry)}
                        >
                          {entry.title}
                        </Link>
                        <p className="mt-1 text-xs text-wb-muted">
                          {entry.authorName}
                        </p>
                      </>
                    ) : (
                      <span className="text-wb-muted">
                        {ja
                          ? "この記事は現在公開されていません"
                          : "This article is not currently published"}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </>
        )}
      </main>
    </div>
  );
}
export function CourseEditorPageV1() {
  const { courseId } = useParams();
  const { pathname } = useLocation();
  const { account } = useSiteAccountSessionV3();
  return (
    <CourseEditorResourceV1
      key={`${localeFromPathname(pathname)}:${courseId ?? "new"}:${account?.accountId ?? "guest"}`}
    />
  );
}
function CourseEditorResourceV1() {
  const { courseId } = useParams();
  const { repository, locale, ja } = useCourseEnvironment();
  const navigate = useNavigate();
  const { account, loading } = useSiteAccountSessionV3();
  const [draft, setDraft] = React.useState<CourseDraftV1 | null>(null);
  const [content, setContent] = React.useState<CourseContentV1>({
    title: "",
    description: "",
    audience: "",
    locale,
    articleIds: [],
  });
  const [input, setInput] = React.useState("");
  const [labels, setLabels] = React.useState<Record<string, string>>({});
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [loaded, setLoaded] = React.useState(!courseId);
  const active = React.useRef(false);
  React.useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);
  React.useEffect(() => {
    let current = true;
    if (!account || !repository) return;
    setError("");
    setLoaded(!courseId);
    if (courseId)
      void repository
        .readMyCourse(courseId)
        .then((c) => {
          if (current) {
            if (!c)
              throw new Error(
                ja ? "編集できるコースが見つかりません" : "Course not found",
              );
            setDraft(c);
            setContent(c.content);
            setLoaded(true);
          }
        })
        .catch((e) => {
          if (current) setError(String(e));
        });
    return () => {
      current = false;
    };
  }, [account?.accountId, repository, courseId, ja]);
  React.useEffect(() => {
    let current = true;
    if (!repository) return;
    void Promise.all(
      content.articleIds.map(async (id) => {
        const a = await repository.readPublishedArticle(id);
        return [
          id,
          a?.title ?? (ja ? "未公開の記事" : "Unpublished article"),
        ] as const;
      }),
    )
      .then((items) => {
        if (current) setLabels(Object.fromEntries(items));
      })
      .catch(() => {});
    return () => {
      current = false;
    };
  }, [repository, content.articleIds, ja]);
  const change = (value: Partial<CourseContentV1>) => {
    setContent((c) => ({ ...c, ...value }));
    setMessage("");
  };
  const act = async (fn: (isCurrent: () => boolean) => Promise<void>) => {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await fn(() => active.current);
    } catch (e) {
      if (active.current) setError(String(e));
    } finally {
      if (active.current) setBusy(false);
    }
  };
  const add = () =>
    act(async (isCurrent) => {
      if (!repository) throw new Error("Repository unavailable");
      const trimmed = input.trim();
      let key = trimmed;
      if (trimmed.includes("/")) {
        const url = new URL(trimmed, location.origin);
        const match = /^\/(ja|en)\/articles\/([^/]+)\/?$/.exec(url.pathname);
        if (!match)
          throw new Error(
            ja
              ? "公開記事のURLを入力してください"
              : "Enter a public article URL",
          );
        key = decodeURIComponent(match[2]);
      }
      const article = await repository.readPublishedArticle(key);
      if (!isCurrent()) return;
      if (!article)
        throw new Error(
          ja ? "公開記事が見つかりません" : "Published article not found",
        );
      if (article.locale !== content.locale)
        throw new Error(
          ja
            ? "コースと同じ言語の記事を選んでください"
            : "Choose an article in the Course language",
        );
      if (content.articleIds.includes(article.articleId))
        throw new Error(ja ? "追加済みの記事です" : "Article already added");
      if (content.articleIds.length >= 64)
        throw new Error(ja ? "最大64章です" : "Maximum 64 chapters");
      change({ articleIds: [...content.articleIds, article.articleId] });
      setInput("");
    });
  const save = () =>
    act(async (isCurrent) => {
      if (!repository) return;
      const saved = await repository.saveCourse({
        courseId: draft?.courseId ?? null,
        expectedVersion: draft?.version ?? null,
        content: {
          ...content,
          title: content.title.trim(),
          description: content.description.trim(),
          audience: content.audience.trim(),
        },
      });
      // The save may finish after another editor has replaced this resource.
      if (!isCurrent()) return;
      setDraft(saved);
      setContent(saved.content);
      setMessage(ja ? "下書きを保存しました" : "Draft saved");
      if (!courseId)
        navigate(`${courseHrefV1(saved.courseId, locale)}/edit`, {
          replace: true,
        });
    });
  const publish = (value: boolean) =>
    act(async (isCurrent) => {
      if (!repository || !draft) return;
      const saved = await repository.publishCourse({
        courseId: draft.courseId,
        expectedVersion: draft.version,
        publish: value,
      });
      if (!isCurrent()) return;
      setDraft(saved);
      setMessage(
        value
          ? ja
            ? "公開しました"
            : "Published"
          : ja
            ? "非公開にしました"
            : "Unpublished",
      );
    });
  const dirty =
    !draft || JSON.stringify(content) !== JSON.stringify(draft.content);
  if (loading) return <p role="status">{ja ? "読み込み中…" : "Loading…"}</p>;
  if (!account)
    return (
      <main className={shell}>
        <h1 className="text-xl">
          {ja ? "ログインしてコースを作成" : "Sign in to create courses"}
        </h1>
        <Link className={`${control} mt-5 inline-flex`} to={`/${locale}/login`}>
          {ja ? "ログイン" : "Sign in"}
        </Link>
      </main>
    );
  return (
    <div
      className="h-full overflow-y-auto bg-wb-app text-wb-text"
      data-testid="course-editor"
    >
      <main className={shell}>
        <Link className="text-sm text-wb-accent" to={`/${locale}/me/courses`}>
          ← {ja ? "自分のコース" : "My courses"}
        </Link>
        <h1 className="my-6 text-2xl font-semibold">
          {ja ? "コースを編集" : "Edit course"}
        </h1>
        {error && (
          <p role="alert" className="my-4 text-wb-danger">
            {error}
          </p>
        )}
        {loaded && (
          <fieldset disabled={busy} className="space-y-6 disabled:opacity-70">
            <label className="block space-y-2">
              <span>{ja ? "タイトル" : "Title"}</span>
              <input
                className={field}
                value={content.title}
                maxLength={240}
                onChange={(e) => change({ title: e.target.value })}
              />
            </label>
            <label className="block space-y-2">
              <span>{ja ? "紹介" : "Description"}</span>
              <textarea
                className={field}
                rows={4}
                value={content.description}
                maxLength={4000}
                onChange={(e) => change({ description: e.target.value })}
              />
            </label>
            <label className="block space-y-2">
              <span>
                {ja ? "対象読者・前提知識" : "Audience and prerequisites"}
              </span>
              <textarea
                className={field}
                rows={2}
                value={content.audience}
                maxLength={1000}
                onChange={(e) => change({ audience: e.target.value })}
              />
            </label>
            <section>
              <h2 className="text-lg font-semibold">
                {ja ? "章の順序" : "Chapter order"}
              </h2>
              <ol className="mt-3 space-y-2">
                {content.articleIds.map((id, i) => (
                  <li
                    key={id}
                    className="flex items-center gap-2 rounded-lg border border-wb-line p-3"
                  >
                    <span className="mr-auto min-w-0 text-sm leading-6">
                      {i + 1}. {labels[id] ?? id}
                    </span>
                    {[-1, 1].map((delta) => (
                      <button
                        key={delta}
                        className={control}
                        disabled={
                          i + delta < 0 ||
                          i + delta >= content.articleIds.length
                        }
                        aria-label={
                          ja
                            ? delta < 0
                              ? "上へ"
                              : "下へ"
                            : delta < 0
                              ? "Move up"
                              : "Move down"
                        }
                        onClick={() => {
                          const ids = [...content.articleIds];
                          [ids[i], ids[i + delta]] = [ids[i + delta], ids[i]];
                          change({ articleIds: ids });
                        }}
                      >
                        {delta < 0 ? (
                          <ArrowUp size={16} />
                        ) : (
                          <ArrowDown size={16} />
                        )}
                      </button>
                    ))}
                    <button
                      className={control}
                      aria-label={ja ? "章を外す" : "Remove chapter"}
                      onClick={() =>
                        change({
                          articleIds: content.articleIds.filter(
                            (x) => x !== id,
                          ),
                        })
                      }
                    >
                      <Trash2 size={16} />
                    </button>
                  </li>
                ))}
              </ol>
              <label
                className="mt-4 block text-sm"
                htmlFor="course-article-url"
              >
                {ja ? "追加する公開記事のURL" : "Public article URL"}
              </label>
              <div className="mt-2 flex gap-2">
                <input
                  id="course-article-url"
                  className={field}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                />
                <button
                  className={control}
                  disabled={!input.trim()}
                  aria-label={ja ? "記事を追加" : "Add article"}
                  onClick={() => void add()}
                >
                  <Plus size={18} />
                </button>
              </div>
            </section>
            <div className="flex flex-wrap gap-3">
              <button
                className={control}
                disabled={!dirty || !content.title.trim()}
                onClick={() => void save()}
              >
                {ja ? "下書きを保存" : "Save draft"}
              </button>
              <button
                className={`${control} bg-wb-primary text-white`}
                disabled={!draft || dirty || !content.articleIds.length}
                onClick={() => void publish(true)}
              >
                {ja ? "保存した内容を公開" : "Publish saved draft"}
              </button>
              {draft?.published && (
                <>
                  <button
                    className={control}
                    onClick={() => void publish(false)}
                  >
                    {ja ? "非公開にする" : "Unpublish"}
                  </button>
                  <Link
                    className={control}
                    to={courseHrefV1(draft.courseId, locale)}
                  >
                    {ja ? "公開ページ" : "Public page"}
                  </Link>
                </>
              )}
            </div>
            <p className="text-sm text-wb-muted">
              {ja
                ? "下書きの保存では公開中の内容は変わりません。公開すると、保存した紹介文と章の順序が反映されます。"
                : "Saving a draft keeps the published course unchanged. Publish applies the saved introduction and chapter order."}
            </p>
            {draft && (
              <button
                className={`${control} text-wb-danger`}
                onClick={() => {
                  if (
                    window.confirm(
                      ja
                        ? "このコースを削除します。記事はそのまま残ります。"
                        : "Delete this course? Articles will remain available.",
                    )
                  )
                    void act(async (isCurrent) => {
                      if (!repository) return;
                      await repository.deleteCourse({
                        courseId: draft.courseId,
                        expectedVersion: draft.version,
                      });
                      if (!isCurrent()) return;
                      navigate(`/${locale}/me/courses`);
                    });
                }}
              >
                {ja ? "コースを削除" : "Delete course"}
              </button>
            )}
          </fieldset>
        )}
        {message && (
          <p role="status" className="mt-5">
            {message}
          </p>
        )}
      </main>
    </div>
  );
}
