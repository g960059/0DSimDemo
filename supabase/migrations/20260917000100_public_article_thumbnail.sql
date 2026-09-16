-- Derive the cover from the published body in the existing anonymous summary.
-- Drafts and numerical Snapshots never enter this projection.
begin;

CREATE OR REPLACE FUNCTION "public"."list_public_article_summaries_v1"("p_limit" integer DEFAULT 50, "p_before_published_at" timestamp with time zone DEFAULT NULL::timestamp with time zone, "p_before_id" "uuid" DEFAULT NULL::"uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  result_body jsonb;
begin
  if p_limit < 1 or p_limit > 100 then
    raise exception 'List page limit must be within [1, 100]' using errcode = '22023';
  end if;
  if (p_before_published_at is null) <> (p_before_id is null) then
    raise exception 'List cursor timestamp and ID must be supplied together' using errcode = '22023';
  end if;

  with page as materialized (
    select
      p.article_id,
      a.owner_id,
      c.locale,
      c.title,
      p.public_slug,
      p.updated_at as published_at,
      excerpt.value as excerpt,
      thumbnail.value as thumbnail_url
    from studio.article_publications p
    join studio.articles a on a.article_id = p.article_id
    join studio.article_contents c on c.article_content_id = p.current_content_id
    left join lateral (
      select left(block.value ->> 'text', 240) as value
      from jsonb_array_elements(c.blocks) with ordinality block(value, position)
      where block.value ->> 'kind' in ('heading', 'paragraph')
        and length(btrim(coalesce(block.value ->> 'text', ''))) > 0
      order by block.position
      limit 1
    ) excerpt on true
    left join lateral (
      select block.value ->> 'imageUrl' as value
      from jsonb_array_elements(c.blocks) with ordinality block(value, position)
      where block.value ->> 'kind' = 'image'
        and block.value ->> 'imageUrl' ~ '^https://[A-Za-z0-9.-]+(:[0-9]{1,5})?([/?#][^[:space:]]*)?$'
        and length(block.value ->> 'imageUrl') <= 2048
      order by block.position
      limit 1
    ) thumbnail on true
    where a.deleted_at is null
      and (
        p_before_published_at is null
        or (p.updated_at, p.article_id) < (p_before_published_at, p_before_id)
      )
    order by p.updated_at desc, p.article_id desc
    limit p_limit
  )
  select jsonb_build_object(
    'items', coalesce(jsonb_agg(jsonb_build_object(
      'articleId', article_id,
      'author', studio.public_author_v1(owner_id),
      'locale', locale,
      'title', title,
      'excerpt', excerpt,
      'thumbnailUrl', thumbnail_url,
      'publicSlug', public_slug,
      'publishedAt', to_char(published_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"')
    ) order by published_at desc, article_id desc), '[]'::jsonb),
    'nextCursor', case when count(*) = p_limit then (
      select jsonb_build_object(
        'timestamp', to_char(last_page.published_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
        'id', last_page.article_id
      )
      from page last_page
      order by last_page.published_at asc, last_page.article_id asc
      limit 1
    ) else null end
  ) into result_body
  from page;
  return result_body;
end;
$$;


commit;
