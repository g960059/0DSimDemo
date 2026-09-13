import {
  courseHrefV1,
  courseArticleHrefV1,
  courseNeighborsV1,
  type PublicCourseV1,
} from "./StudioCourseV1";
const escape = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
export function courseCardsHtmlV1(
  courses: readonly PublicCourseV1[],
  locale: string,
) {
  return `<section class="public-static-directory"><h2><a href="/${locale}/courses">${locale === "ja" ? "コースで学ぶ" : "Learn with courses"}</a></h2><ul>${courses.map((c) => `<li><a href="${courseHrefV1(c.courseId, c.locale)}"><h3>${escape(c.title)}</h3><p>${escape(c.description)}</p><p>${escape(c.authorName)} · ${c.entries.length}${locale === "ja" ? "章" : " chapters"}</p></a></li>`).join("")}</ul></section>`;
}
export function courseBodyHtmlV1(course: PublicCourseV1) {
  const ja = course.locale === "ja";
  return `<main class="public-static-shell article-document-shell"><article class="article-document"><header class="article-document-header"><p><a href="/${course.locale}/courses">${ja ? "コース" : "Courses"}</a></p><h1 class="article-title">${escape(course.title)}</h1><p>${ja ? "編集：" : "Edited by "}${escape(course.authorName)}</p></header><p>${escape(course.description)}</p><p>${ja ? "対象読者：" : "Audience: "}${escape(course.audience)}</p><h2>${ja ? "目次" : "Contents"}</h2><ol>${course.entries.map((e) => `<li>${e.available ? `<a href="${courseArticleHrefV1(course, e)}">${escape(e.title!)}</a> <small>${escape(e.authorName!)}</small>` : ja ? "この記事は現在公開されていません" : "This article is not currently published"}</li>`).join("")}</ol></article></main>`;
}
export function courseNavigationHtmlV1(
  course: PublicCourseV1,
  articleId: string,
) {
  const neighbors = courseNeighborsV1(course, articleId);
  if (!neighbors) return "";
  return `<nav class="my-6 rounded-xl border border-wb-line p-4 text-sm" aria-label="${course.locale === "ja" ? "コースのナビゲーション" : "Course navigation"}"><a href="${courseHrefV1(course.courseId, course.locale)}">${escape(course.title)}</a><div>${neighbors.previous ? `<a rel="prev" href="${courseArticleHrefV1(course, neighbors.previous)}">← ${escape(neighbors.previous.title!)}</a>` : ""} ${neighbors.next ? `<a rel="next" href="${courseArticleHrefV1(course, neighbors.next)}">${escape(neighbors.next.title!)} →</a>` : ""}</div></nav>`;
}
