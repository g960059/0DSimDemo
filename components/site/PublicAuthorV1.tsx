import React from "react";
import {
  publicAuthorLabelV1,
  type PublicAuthorV1 as Author,
} from "@/studio/application/profile/StudioPublicProfileV1";
import { createStudioSupabaseContentRepositoryV1 } from "@/studio/infrastructure/supabase/StudioSupabaseContentRepositoryV1";
export function PublicAuthorV1({
  author,
  locale = "ja",
}: {
  author?: Author | null;
  locale?: string;
}) {
  if (!author) return null;
  return (
    <span className="public-author" data-author-id={author.userId}>
      <span>{publicAuthorLabelV1(author, locale)}</span>
      {author.official && (
        <span className="public-author-badge">
          {locale === "ja" ? "公式" : "Official"}
        </span>
      )}
    </span>
  );
}
export function ResourceAuthorV1({
  kind,
  resourceId,
  locale,
}: {
  kind: "article" | "snapshot";
  resourceId: string;
  locale: string;
}) {
  const repository = React.useMemo(createStudioSupabaseContentRepositoryV1, []);
  const [state, setState] = React.useState<{
    key: string;
    author: Author | null;
  } | null>(null);
  const key = `${kind}:${resourceId}`;
  React.useEffect(() => {
    let current = true;
    void repository
      ?.readPublicResourceAuthor(kind, resourceId)
      .then((author) => {
        if (current) setState({ key, author });
      })
      .catch(() => {
        if (current) setState(null);
      });
    return () => {
      current = false;
    };
  }, [repository, kind, resourceId, key]);
  return (
    <PublicAuthorV1
      author={state?.key === key ? state.author : null}
      locale={locale}
    />
  );
}
