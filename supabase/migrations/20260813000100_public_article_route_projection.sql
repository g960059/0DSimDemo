-- One anonymous, immutable projection powers browser Reader resolution,
-- semantic HTML, Markdown, JSON and cache identity. Canonical slug lookup is
-- preferred; a public Article UUID remains a temporary redirect alias.

CREATE OR REPLACE FUNCTION public.read_public_article_route_v1(
  p_article_route_key text
) RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $$
declare
  result_body jsonb;
begin
  if p_article_route_key is null
    or p_article_route_key <> btrim(p_article_route_key)
    or char_length(p_article_route_key) < 3
    or char_length(p_article_route_key) > 96
    or p_article_route_key !~ '^[a-z0-9-]+$'
  then
    raise exception using
      errcode = '22023',
      message = 'Public Article route key is invalid';
  end if;

  select jsonb_build_object(
    'schemaId', 'circleheart-studio-published-article-v1',
    'articleId', publication.article_id,
    'articleContentId', publication.current_content_id,
    'publicSlug', publication.public_slug,
    'locale', content.locale,
    'title', content.title,
    'blocks', content.blocks,
    'publishedAt', to_char(
      publication.published_at at time zone 'UTC',
      'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'
    ),
    'updatedAt', to_char(
      publication.updated_at at time zone 'UTC',
      'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'
    )
  ) into result_body
  from studio.article_publications as publication
  join studio.articles as article
    on article.article_id = publication.article_id
  join studio.article_contents as content
    on content.article_content_id = publication.current_content_id
  where article.deleted_at is null
    and (
      publication.public_slug = p_article_route_key
      or (
        p_article_route_key ~
          '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        and publication.article_id::text = p_article_route_key
      )
    )
  order by (publication.public_slug = p_article_route_key) desc
  limit 1;

  return result_body;
end;
$$;

ALTER FUNCTION public.read_public_article_route_v1(text) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.read_public_article_route_v1(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.read_public_article_route_v1(text) TO anon;
GRANT EXECUTE ON FUNCTION public.read_public_article_route_v1(text) TO authenticated;

COMMENT ON FUNCTION public.read_public_article_route_v1(text) IS
  'Returns one exact live Article publication by canonical slug or legacy public UUID route. The returned articleContentId is the immutable render/cache identity.';
