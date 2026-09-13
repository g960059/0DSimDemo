import { publicAuthorHtmlV1 } from "@/studio/application/profile/StudioPublicProfileV1";
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
const bookIcon =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M12 6C9 3 4 3 2 4v15c3-1 7-1 10 2 3-3 7-3 10-2V4c-3-1-7-1-10 2Z"/><path d="M12 6v15"/></svg>';
export function courseCoverHtmlV1(course: PublicCourseV1) {
  return `<span class="course-cover" aria-hidden="true">${bookIcon}${course.coverUrl ? `<img src="${escape(course.coverUrl)}" alt="" loading="lazy" referrerpolicy="no-referrer" />` : ""}</span>`;
}
export function courseCardsHtmlV1(
  courses: readonly PublicCourseV1[],
  locale: string,
) {
  return `<section class="public-static-home-section" aria-labelledby="home-courses-heading"><header><h2 id="home-courses-heading"><span>${bookIcon}</span>${locale === "ja" ? "コースで学ぶ" : "Learn with courses"}</h2><a class="public-static-home-view-all" href="/${locale}/courses">${locale === "ja" ? "すべて見る" : "View all"}<span aria-hidden="true">→</span></a></header><ul class="course-discovery-grid${courses.length > 1 ? " course-discovery-grid-many" : ""}">${courses.map((c) => `<li><a class="public-static-home-card course-discovery-card" href="${courseHrefV1(c.courseId, c.locale)}">${courseCoverHtmlV1(c)}<div class="course-discovery-copy"><small>${c.entries.length}${locale === "ja" ? "章のコース" : " chapters"}</small><h3>${escape(c.title)}</h3><p>${escape(c.description)}</p><div>${c.author ? publicAuthorHtmlV1(c.author, locale) : escape(c.authorName)}<span aria-hidden="true">→</span></div></div></a></li>`).join("")}</ul></section>`;
}
export function courseBodyHtmlV1(course: PublicCourseV1) {
  const ja = course.locale === "ja";
  const first = course.entries.find((e) => e.available);
  return `<main class="public-static-shell article-document-shell"><article class="article-document"><header class="article-document-header"><p><a href="/${course.locale}/courses">${ja ? "コース" : "Courses"}</a></p>${courseCoverHtmlV1(course)}<h1 class="article-title">${escape(course.title)}</h1><p>${ja ? "編集：" : "Edited by "}${course.author ? publicAuthorHtmlV1(course.author, course.locale) : escape(course.authorName)} · ${course.entries.length}${ja ? "章" : " chapters"}</p></header><p>${escape(course.description)}</p>${course.audience ? `<p>${ja ? "対象読者：" : "Audience: "}${escape(course.audience)}</p>` : ""}${first ? `<a class="course-start" href="${courseArticleHrefV1(course, first)}">${ja ? "読み始める" : "Start reading"} →</a>` : ""}<h2>${ja ? "目次" : "Contents"}</h2><ol>${course.entries.map((e) => `<li>${e.available ? `<a href="${courseArticleHrefV1(course, e)}">${escape(e.title!)}</a>${(e.author ? e.author.userId !== course.ownerId : e.authorName !== course.authorName) ? ` <small>${e.author ? publicAuthorHtmlV1(e.author, course.locale) : escape(e.authorName!)}</small>` : ""}` : ja ? "この記事は現在公開されていません" : "This article is not currently published"}</li>`).join("")}</ol></article></main>`;
}
export function courseNavigationHtmlV1(
  course: PublicCourseV1,
  articleId: string,
  bottom = false,
) {
  const neighbors = courseNeighborsV1(course, articleId);
  if (!neighbors) return "";
  if (bottom)
    return `<nav class="my-6 rounded-xl border border-wb-line p-4 text-sm" aria-label="${course.locale === "ja" ? "コースのナビゲーション" : "Course navigation"}"><div class="grid grid-cols-2 gap-4"><div>${neighbors.previous ? `<a rel="prev" href="${courseArticleHrefV1(course, neighbors.previous)}">← ${escape(neighbors.previous.title!)}</a>` : ""}</div><div class="text-right">${neighbors.next ? `<a rel="next" href="${courseArticleHrefV1(course, neighbors.next)}">${escape(neighbors.next.title!)} →</a>` : `<a href="${courseHrefV1(course.courseId, course.locale)}">${course.locale === "ja" ? "コースの目次へ" : "Back to contents"} →</a>`}</div></div></nav>`;

  return `<nav class="my-6 rounded-xl border border-wb-line p-4 text-sm" aria-label="${course.locale === "ja" ? "コースのナビゲーション" : "Course navigation"}"><div class="flex items-start justify-between gap-3"><a href="${courseHrefV1(course.courseId, course.locale)}">${escape(course.title)}</a><span>${course.entries.findIndex((e) => e.articleId === articleId) + 1} / ${course.entries.length}${course.locale === "ja" ? "章" : " chapters"}</span></div><details class="mt-3"><summary>${course.locale === "ja" ? "コースの目次" : "Course contents"}</summary><ol>${course.entries.map((e) => `<li>${e.available ? `<a ${e.articleId === articleId ? 'aria-current="page"' : ""} href="${courseArticleHrefV1(course, e)}">${escape(e.title!)}</a>` : course.locale === "ja" ? "現在非公開" : "Currently unavailable"}</li>`).join("")}</ol></details></nav>`;
}
