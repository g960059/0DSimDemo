/** Mutable attribution is separate from immutable Article/Experiment content. */
export type PublicAuthorV1 = Readonly<{
  userId: string;
  displayName: string | null;
  official: boolean;
}>;
export type MyProfileV1 = PublicAuthorV1 & Readonly<{ version: number }>;
export function validateDisplayNameV1(value: unknown): string {
  if (
    typeof value !== "string" ||
    !value ||
    value !== value.trim() ||
    value.length > 80 ||
    /[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u202a-\u202e\u2060-\u206f\ufeff]/u.test(
      value,
    )
  ) {
    throw new Error(
      "Display name must contain 1–80 characters without control characters",
    );
  }
  return value;
}
export function validatePublicAuthorV1(value: unknown): PublicAuthorV1 {
  const p = value as PublicAuthorV1;
  if (
    !p ||
    typeof p !== "object" ||
    !/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/.test(p.userId) ||
    typeof p.official !== "boolean"
  )
    throw new Error("Invalid public author");
  if (p.displayName !== null) validateDisplayNameV1(p.displayName);
  return Object.freeze({
    userId: p.userId,
    displayName: p.displayName,
    official: p.official,
  });
}
export function validateMyProfileV1(value: unknown): MyProfileV1 {
  const author = validatePublicAuthorV1(value);
  const version = (value as MyProfileV1).version;
  if (!Number.isSafeInteger(version) || version < 0)
    throw new Error("Invalid profile version");
  return Object.freeze({ ...author, version });
}
export function publicAuthorLabelV1(author: PublicAuthorV1, locale = "ja") {
  return (
    author.displayName ?? (locale === "ja" ? "名前未設定" : "Unnamed author")
  );
}
export function publicAuthorHtmlV1(
  author: PublicAuthorV1 | undefined,
  locale = "ja",
) {
  if (!author) return "";
  const name = publicAuthorLabelV1(author, locale).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
  return `<span class="public-author" data-author-id="${author.userId}"><span>${name}</span>${author.official ? `<span class="public-author-badge">${locale === "ja" ? "公式" : "Official"}</span>` : ""}</span>`;
}
