begin;

-- The pre-release list RPCs returned every fixture/checkpoint and Article
-- block. Remove that transport shape before it becomes a compatibility
-- surface: list views receive bounded summaries, while existing read RPCs
-- remain the only route to complete immutable content.
drop function if exists public.list_my_experiments_v1();
drop function if exists public.list_my_experiment_snapshots_v1();
drop function if exists public.list_my_articles_v1();
drop function if exists public.list_public_experiments_v1();
drop function if exists public.list_public_articles_v1();

create or replace function public.list_my_experiment_summaries_v1(
  p_limit integer default 50,
  p_before_updated_at timestamptz default null,
  p_before_id uuid default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  result_body jsonb;
begin
  if actor is null then
    raise exception 'authentication required' using errcode = '28000';
  end if;
  if p_limit < 1 or p_limit > 100 then
    raise exception 'List page limit must be within [1, 100]' using errcode = '22023';
  end if;
  if (p_before_updated_at is null) <> (p_before_id is null) then
    raise exception 'List cursor timestamp and ID must be supplied together' using errcode = '22023';
  end if;

  with page as materialized (
    select
      e.experiment_id,
      e.version,
      e.model_id,
      e.title,
      e.created_at,
      e.updated_at,
      jsonb_array_length(c.content -> 'scenarios') as scenario_count,
      p.current_snapshot_id as published_snapshot_id,
      p.public_slug
    from studio.experiments e
    join studio.experiment_contents c on c.content_id = e.current_content_id
    left join studio.experiment_publications p on p.experiment_id = e.experiment_id
    where e.owner_id = actor
      and e.deleted_at is null
      and (
        p_before_updated_at is null
        or (e.updated_at, e.experiment_id) < (p_before_updated_at, p_before_id)
      )
    order by e.updated_at desc, e.experiment_id desc
    limit p_limit
  )
  select jsonb_build_object(
    'items', coalesce(jsonb_agg(jsonb_build_object(
      'experimentId', experiment_id,
      'version', version,
      'modelId', model_id,
      'title', title,
      'scenarioCount', scenario_count,
      'createdAt', to_char(created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
      'updatedAt', to_char(updated_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
      'publishedSnapshotId', published_snapshot_id,
      'publicSlug', public_slug
    ) order by updated_at desc, experiment_id desc), '[]'::jsonb),
    'nextCursor', case when count(*) = p_limit then (
      select jsonb_build_object(
        'timestamp', to_char(last_page.updated_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
        'id', last_page.experiment_id
      )
      from page last_page
      order by last_page.updated_at asc, last_page.experiment_id asc
      limit 1
    ) else null end
  ) into result_body
  from page;
  return result_body;
end;
$$;

create or replace function public.list_my_snapshot_summaries_v1(
  p_limit integer default 50,
  p_before_created_at timestamptz default null,
  p_before_id uuid default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  result_body jsonb;
begin
  if actor is null then
    raise exception 'authentication required' using errcode = '28000';
  end if;
  if p_limit < 1 or p_limit > 100 then
    raise exception 'List page limit must be within [1, 100]' using errcode = '22023';
  end if;
  if (p_before_created_at is null) <> (p_before_id is null) then
    raise exception 'List cursor timestamp and ID must be supplied together' using errcode = '22023';
  end if;

  with page as materialized (
    select
      s.snapshot_id,
      c.model_id,
      s.created_at,
      coalesce(nullif(e.title, ''), nullif(c.content #>> '{scenarios,0,label}', ''), 'Untitled') as title,
      jsonb_array_length(c.content -> 'scenarios') as scenario_count,
      jsonb_array_length(c.content #> '{surface,graphPanes}')
        + jsonb_array_length(c.content #> '{surface,outputPanes}')
        + jsonb_array_length(c.content #> '{surface,controlPanes}') as pane_count
    from studio.experiment_snapshots s
    join studio.experiment_contents c on c.content_id = s.content_id
    left join studio.experiment_snapshot_sources source on source.snapshot_id = s.snapshot_id
    left join studio.experiments e on e.experiment_id = source.source_experiment_id
    where s.owner_id = actor
      and (
        p_before_created_at is null
        or (s.created_at, s.snapshot_id) < (p_before_created_at, p_before_id)
      )
    order by s.created_at desc, s.snapshot_id desc
    limit p_limit
  )
  select jsonb_build_object(
    'items', coalesce(jsonb_agg(jsonb_build_object(
      'snapshotId', snapshot_id,
      'modelId', model_id,
      'title', title,
      'scenarioCount', scenario_count,
      'paneCount', pane_count,
      'createdAt', to_char(created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
    ) order by created_at desc, snapshot_id desc), '[]'::jsonb),
    'nextCursor', case when count(*) = p_limit then (
      select jsonb_build_object(
        'timestamp', to_char(last_page.created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
        'id', last_page.snapshot_id
      )
      from page last_page
      order by last_page.created_at asc, last_page.snapshot_id asc
      limit 1
    ) else null end
  ) into result_body
  from page;
  return result_body;
end;
$$;

create or replace function public.list_my_article_summaries_v1(
  p_limit integer default 50,
  p_before_updated_at timestamptz default null,
  p_before_id uuid default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  result_body jsonb;
begin
  if actor is null then
    raise exception 'authentication required' using errcode = '28000';
  end if;
  if p_limit < 1 or p_limit > 100 then
    raise exception 'List page limit must be within [1, 100]' using errcode = '22023';
  end if;
  if (p_before_updated_at is null) <> (p_before_id is null) then
    raise exception 'List cursor timestamp and ID must be supplied together' using errcode = '22023';
  end if;

  with page as materialized (
    select
      a.article_id,
      a.version,
      c.locale,
      c.title,
      a.created_at,
      a.updated_at,
      case when p.article_id is null then 'draft' else 'public' end as visibility,
      p.public_slug
    from studio.articles a
    join studio.article_contents c on c.article_content_id = a.current_draft_content_id
    left join studio.article_publications p on p.article_id = a.article_id
    where a.owner_id = actor
      and a.deleted_at is null
      and (
        p_before_updated_at is null
        or (a.updated_at, a.article_id) < (p_before_updated_at, p_before_id)
      )
    order by a.updated_at desc, a.article_id desc
    limit p_limit
  )
  select jsonb_build_object(
    'items', coalesce(jsonb_agg(jsonb_build_object(
      'articleId', article_id,
      'version', version,
      'visibility', visibility,
      'locale', locale,
      'title', title,
      'createdAt', to_char(created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
      'updatedAt', to_char(updated_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
      'publicSlug', public_slug
    ) order by updated_at desc, article_id desc), '[]'::jsonb),
    'nextCursor', case when count(*) = p_limit then (
      select jsonb_build_object(
        'timestamp', to_char(last_page.updated_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
        'id', last_page.article_id
      )
      from page last_page
      order by last_page.updated_at asc, last_page.article_id asc
      limit 1
    ) else null end
  ) into result_body
  from page;
  return result_body;
end;
$$;

create or replace function public.list_public_experiment_summaries_v1(
  p_limit integer default 50,
  p_before_published_at timestamptz default null,
  p_before_id uuid default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
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
      p.experiment_id,
      e.title,
      p.public_slug,
      p.updated_at as published_at,
      s.snapshot_id,
      c.model_id,
      jsonb_array_length(c.content -> 'scenarios') as scenario_count
    from studio.experiment_publications p
    join studio.experiments e on e.experiment_id = p.experiment_id
    join studio.experiment_snapshots s on s.snapshot_id = p.current_snapshot_id
    join studio.experiment_contents c on c.content_id = s.content_id
    where e.deleted_at is null
      and (
        p_before_published_at is null
        or (p.updated_at, p.experiment_id) < (p_before_published_at, p_before_id)
      )
    order by p.updated_at desc, p.experiment_id desc
    limit p_limit
  )
  select jsonb_build_object(
    'items', coalesce(jsonb_agg(jsonb_build_object(
      'experimentId', experiment_id,
      'title', title,
      'publicSlug', public_slug,
      'publishedAt', to_char(published_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
      'snapshotId', snapshot_id,
      'modelId', model_id,
      'scenarioCount', scenario_count
    ) order by published_at desc, experiment_id desc), '[]'::jsonb),
    'nextCursor', case when count(*) = p_limit then (
      select jsonb_build_object(
        'timestamp', to_char(last_page.published_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
        'id', last_page.experiment_id
      )
      from page last_page
      order by last_page.published_at asc, last_page.experiment_id asc
      limit 1
    ) else null end
  ) into result_body
  from page;
  return result_body;
end;
$$;

create or replace function public.list_public_article_summaries_v1(
  p_limit integer default 50,
  p_before_published_at timestamptz default null,
  p_before_id uuid default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
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
      c.locale,
      c.title,
      p.public_slug,
      p.updated_at as published_at,
      excerpt.value as excerpt
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
      'locale', locale,
      'title', title,
      'excerpt', excerpt,
      'publicSlug', public_slug,
      'publishedAt', to_char(published_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
    ) order by published_at desc, article_id desc), '[]'::jsonb),
    'nextCursor', case when count(*) = p_limit then (
      select jsonb_build_object(
        'timestamp', to_char(last_page.published_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
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

revoke all on function public.list_my_experiment_summaries_v1(integer, timestamptz, uuid) from public;
grant execute on function public.list_my_experiment_summaries_v1(integer, timestamptz, uuid) to authenticated;
revoke all on function public.list_my_snapshot_summaries_v1(integer, timestamptz, uuid) from public;
grant execute on function public.list_my_snapshot_summaries_v1(integer, timestamptz, uuid) to authenticated;
revoke all on function public.list_my_article_summaries_v1(integer, timestamptz, uuid) from public;
grant execute on function public.list_my_article_summaries_v1(integer, timestamptz, uuid) to authenticated;
revoke all on function public.list_public_experiment_summaries_v1(integer, timestamptz, uuid) from public;
grant execute on function public.list_public_experiment_summaries_v1(integer, timestamptz, uuid) to anon, authenticated;
revoke all on function public.list_public_article_summaries_v1(integer, timestamptz, uuid) from public;
grant execute on function public.list_public_article_summaries_v1(integer, timestamptz, uuid) to anon, authenticated;

commit;
