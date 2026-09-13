export type CourseContentV1 = Readonly<{
  title: string;
  description: string;
  audience: string;
  locale: "ja" | "en";
  articleIds: readonly string[];
}>;
export type CourseDraftV1 = Readonly<{
  courseId: string;
  version: number;
  content: CourseContentV1;
  published: boolean;
  updatedAt: string;
}>;
export type CourseEntryV1 = Readonly<{
  articleId: string;
  available: boolean;
  title: string | null;
  publicSlug: string | null;
  authorName: string | null;
}>;
export type PublicCourseV1 = Readonly<{
  courseId: string;
  title: string;
  description: string;
  audience: string;
  locale: "ja" | "en";
  ownerId: string;
  authorName: string;
  updatedAt: string;
  entries: readonly CourseEntryV1[];
}>;
export const courseUuidV1 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
export function validateCourseContentV1(value: unknown): CourseContentV1 {
  const c = value as CourseContentV1;
  if (
    !c ||
    typeof c !== "object" ||
    Object.keys(c).sort().join(",") !==
      "articleIds,audience,description,locale,title" ||
    !["ja", "en"].includes(c.locale) ||
    ![c.title, c.description, c.audience].every(
      (v) => typeof v === "string" && v === v.trim(),
    ) ||
    !c.title ||
    c.title.length > 240 ||
    c.description.length > 4000 ||
    c.audience.length > 1000 ||
    !Array.isArray(c.articleIds) ||
    c.articleIds.length > 64 ||
    c.articleIds.some(
      (id) => typeof id !== "string" || !courseUuidV1.test(id),
    ) ||
    new Set(c.articleIds).size !== c.articleIds.length
  ) {
    throw new Error("Invalid Course content");
  }
  return c;
}
export function validateCourseDraftV1(value: unknown): CourseDraftV1 {
  const c = value as CourseDraftV1;
  if (
    !c ||
    !courseUuidV1.test(c.courseId) ||
    !Number.isSafeInteger(c.version) ||
    c.version < 0 ||
    typeof c.published !== "boolean" ||
    !Number.isFinite(Date.parse(c.updatedAt))
  )
    throw new Error("Invalid Course draft");
  validateCourseContentV1(c.content);
  return c;
}
export function validatePublicCourseV1(value: unknown): PublicCourseV1 {
  const c = value as PublicCourseV1;
  if (
    !c ||
    !courseUuidV1.test(c.courseId) ||
    !courseUuidV1.test(c.ownerId) ||
    typeof c.authorName !== "string" ||
    !Number.isFinite(Date.parse(c.updatedAt)) ||
    !Array.isArray(c.entries)
  )
    throw new Error("Invalid public Course");
  validateCourseContentV1({
    title: c.title,
    description: c.description,
    audience: c.audience,
    locale: c.locale,
    articleIds: c.entries.map((e) => e.articleId),
  });
  for (const e of c.entries) {
    if (
      typeof e.available !== "boolean" ||
      (e.available
        ? typeof e.title !== "string" ||
          typeof e.publicSlug !== "string" ||
          !/^[a-z0-9][a-z0-9-]{2,95}$/.test(e.publicSlug) ||
          typeof e.authorName !== "string"
        : e.title !== null || e.publicSlug !== null || e.authorName !== null)
    )
      throw new Error("Invalid public Course entry");
  }
  return c;
}
export const courseHrefV1 = (id: string, locale = "ja") =>
  `/${locale}/courses/${encodeURIComponent(id)}`;
export const courseArticleHrefV1 = (
  course: PublicCourseV1,
  entry: CourseEntryV1,
) =>
  `/${course.locale}/articles/${encodeURIComponent(entry.publicSlug!)}?course=${encodeURIComponent(course.courseId)}`;
export function courseNeighborsV1(course: PublicCourseV1, articleId: string) {
  const readable = course.entries.filter((e) => e.available);
  const index = readable.findIndex((e) => e.articleId === articleId);
  return index < 0
    ? null
    : {
        previous: readable[index - 1] ?? null,
        next: readable[index + 1] ?? null,
        index: index + 1,
        total: readable.length,
      };
}
