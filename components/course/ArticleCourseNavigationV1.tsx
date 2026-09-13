import { readCourseBootstrapV1 } from "@/studio/application/course/StudioCourseBootstrapV1";
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createStudioSupabaseContentRepositoryV1 } from "@/studio/infrastructure/supabase/StudioSupabaseContentRepositoryV1";
import {
  courseUuidV1,
  courseHrefV1,
  courseArticleHrefV1,
  courseNeighborsV1,
  type PublicCourseV1,
} from "@/studio/application/course/StudioCourseV1";

export function ArticleCourseNavigationV1({
  articleId,
  locale,
  bottom = false,
}: {
  articleId: string;
  locale: string;
  bottom?: boolean;
}) {
  const { search } = useLocation();
  const requested = new URLSearchParams(search).get("course");
  const ja = locale === "ja";
  const repository = React.useMemo(createStudioSupabaseContentRepositoryV1, []);
  const bootstrap = React.useMemo(() => {
    const course = readCourseBootstrapV1(requested);
    return course &&
      course.locale === locale &&
      courseNeighborsV1(course, articleId)
      ? [course]
      : [];
  }, [requested, locale, articleId]);
  const identity = `${requested}:${locale}:${articleId}`;
  const [state, setState] = React.useState<{
    identity: string;
    courses: readonly PublicCourseV1[];
  }>({ identity, courses: bootstrap });
  const courses = state.identity === identity ? state.courses : bootstrap;
  React.useEffect(() => {
    let current = true;
    setState({ identity, courses: bootstrap });
    if (!repository) return;
    const request =
      requested && courseUuidV1.test(requested)
        ? repository
            .readPublicCourse(requested)
            .then((c) =>
              c && c.locale === locale && courseNeighborsV1(c, articleId)
                ? [c]
                : [],
            )
        : repository.listPublicCourses({ locale, articleId });
    void request
      .then((c) => {
        if (current) setState({ identity, courses: c });
      })
      .catch(() => {});
    return () => {
      current = false;
    };
  }, [repository, requested, articleId, locale, bootstrap, identity]);
  if (!courses.length) return null;
  const selected = requested
    ? courses.find((c) => c.courseId === requested)
    : undefined;
  if (!selected)
    return bottom ? null : (
      <aside
        className="my-5 text-sm"
        aria-label={
          ja ? "この記事を含むコース" : "Courses containing this article"
        }
      >
        <span className="text-wb-muted">
          {ja ? "コースで読む：" : "Read in a course: "}
        </span>
        {courses.map((c) => (
          <Link
            className="mr-4 text-wb-accent"
            key={c.courseId}
            to={courseArticleHrefV1(
              c,
              c.entries.find((e) => e.articleId === articleId)!,
            )}
          >
            {c.title}
          </Link>
        ))}
      </aside>
    );
  const neighbors = courseNeighborsV1(selected, articleId)!;
  return (
    <nav
      className="my-6 rounded-xl border border-wb-line p-4 text-sm"
      aria-label={ja ? "コースのナビゲーション" : "Course navigation"}
    >
      {!bottom && (
        <>
          <Link
            className="font-semibold text-wb-accent"
            to={courseHrefV1(selected.courseId, locale)}
          >
            {selected.title}
          </Link>
          <details className="mt-3">
            <summary className="cursor-pointer text-wb-muted">
              {ja ? "コースの目次" : "Course contents"}
            </summary>
            <ol className="mt-3 space-y-3">
              {selected.entries.map((e, i) => (
                <li key={e.articleId}>
                  {i + 1}.{" "}
                  {e.available ? (
                    <Link
                      aria-current={
                        e.articleId === articleId ? "page" : undefined
                      }
                      className="text-wb-accent"
                      to={courseArticleHrefV1(selected, e)}
                    >
                      {e.title}
                    </Link>
                  ) : (
                    <span className="text-wb-muted">
                      {ja ? "現在非公開" : "Currently unavailable"}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </details>
        </>
      )}
      <div className={`grid grid-cols-2 gap-4 ${bottom ? "" : "mt-4"}`}>
        <div>
          {neighbors.previous && (
            <Link
              rel="prev"
              className="block text-wb-accent"
              to={courseArticleHrefV1(selected, neighbors.previous)}
            >
              ← {neighbors.previous.title}
            </Link>
          )}
        </div>
        <div className="text-right">
          {neighbors.next ? (
            <Link
              rel="next"
              className="block text-wb-accent"
              to={courseArticleHrefV1(selected, neighbors.next)}
            >
              {neighbors.next.title} →
            </Link>
          ) : (
            <Link
              className="text-wb-accent"
              to={courseHrefV1(selected.courseId, locale)}
            >
              {ja ? "コースの目次へ" : "Back to contents"} →
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
