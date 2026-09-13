import type { PublicCourseV1 } from "./StudioCourseV1";
const key = (courseId: string, accountId?: string) =>
  `circleheart.course-position.v1:${accountId ?? "guest"}:${courseId}`;
/** Last visited chapter only; no claim of completion. Storage is optional. */
export function courseReadingEntryV1(
  course: PublicCourseV1,
  accountId?: string,
  storage?: Pick<Storage, "getItem"> | undefined,
) {
  let last: string | null = null;
  try {
    last =
      (
        storage ??
        (typeof localStorage === "undefined" ? undefined : localStorage)
      )?.getItem(key(course.courseId, accountId)) ?? null;
  } catch {
    /* Private browsing may deny storage. */
  }
  const entry = course.entries.find((e) => e.available && e.articleId === last);
  return {
    entry: entry ?? course.entries.find((e) => e.available) ?? null,
    resume: !!entry,
  };
}
export function rememberCourseReadingEntryV1(
  course: PublicCourseV1,
  articleId: string,
  accountId?: string,
  storage?: Pick<Storage, "setItem"> | undefined,
) {
  if (!course.entries.some((e) => e.available && e.articleId === articleId))
    return;
  try {
    (
      storage ??
      (typeof localStorage === "undefined" ? undefined : localStorage)
    )?.setItem(key(course.courseId, accountId), articleId);
  } catch {
    /* Reading remains available without persistence. */
  }
}
