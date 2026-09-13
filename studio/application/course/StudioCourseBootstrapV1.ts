import { validatePublicCourseV1, type PublicCourseV1 } from "./StudioCourseV1";

const ELEMENT_ID = "circleheart-public-course-bootstrap-v1";

export function renderCourseBootstrapV1(course: PublicCourseV1): string {
  const json = JSON.stringify(validatePublicCourseV1(course)).replaceAll(
    "<",
    "\\u003c",
  );
  return `<script id="${ELEMENT_ID}" type="application/json">${json}</script>`;
}

/** Keep server-resolved navigation during a slow or failed client refresh. */
export function readCourseBootstrapV1(
  courseId: string | null,
  documentLike:
    | Pick<Document, "getElementById">
    | undefined = typeof document === "undefined" ? undefined : document,
): PublicCourseV1 | null {
  const text = documentLike?.getElementById(ELEMENT_ID)?.textContent;
  if (!text || !courseId) return null;
  try {
    const course = validatePublicCourseV1(JSON.parse(text));
    return course.courseId === courseId ? course : null;
  } catch {
    return null;
  }
}
