begin;

create or replace function public.list_my_experiments_v1()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
begin
  if actor is null then raise exception 'authentication required' using errcode = '28000'; end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'experiment', jsonb_build_object(
        'schemaId', 'circleheart-studio-experiment-v2',
        'experimentId', e.experiment_id,
        'version', e.version,
        'content', c.content
      ),
      'title', e.title,
      'createdAt', to_char(e.created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
      'updatedAt', to_char(e.updated_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
      'publishedSnapshotId', p.current_snapshot_id,
      'publicSlug', p.public_slug
    ) order by e.updated_at desc)
    from studio.experiments e
    join studio.experiment_contents c on c.content_id = e.current_content_id
    left join studio.experiment_publications p on p.experiment_id = e.experiment_id
    where e.owner_id = actor and e.deleted_at is null
  ), '[]'::jsonb);
end;
$$;

create or replace function public.read_my_experiment_v1(p_experiment_id uuid)
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
  if actor is null then raise exception 'authentication required' using errcode = '28000'; end if;
  select jsonb_build_object(
    'experiment', jsonb_build_object(
      'schemaId', 'circleheart-studio-experiment-v2',
      'experimentId', e.experiment_id,
      'version', e.version,
      'content', c.content
    ),
    'title', e.title,
    'createdAt', to_char(e.created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
    'updatedAt', to_char(e.updated_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
    'publishedSnapshotId', p.current_snapshot_id,
    'publicSlug', p.public_slug
  ) into result_body
  from studio.experiments e
  join studio.experiment_contents c on c.content_id = e.current_content_id
  left join studio.experiment_publications p on p.experiment_id = e.experiment_id
  where e.experiment_id = p_experiment_id
    and e.owner_id = actor
    and e.deleted_at is null;
  return result_body;
end;
$$;

create or replace function public.list_my_experiment_snapshots_v1()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
begin
  if actor is null then raise exception 'authentication required' using errcode = '28000'; end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'schemaId', 'circleheart-studio-experiment-snapshot-v2',
      'snapshotId', s.snapshot_id,
      'content', c.content,
      'createdAt', to_char(s.created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
    ) order by s.created_at desc)
    from studio.experiment_snapshots s
    join studio.experiment_contents c on c.content_id = s.content_id
    where s.owner_id = actor
  ), '[]'::jsonb);
end;
$$;

create or replace function public.list_my_articles_v1()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
begin
  if actor is null then raise exception 'authentication required' using errcode = '28000'; end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'article', jsonb_build_object(
        'schemaId', 'circleheart-studio-article-draft-v2',
        'articleId', a.article_id,
        'draftVersion', a.version,
        'visibility', case when p.article_id is null then 'draft' else 'public' end,
        'locale', c.locale,
        'title', c.title,
        'blocks', c.blocks
      ),
      'createdAt', to_char(a.created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
      'updatedAt', to_char(a.updated_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
      'publicSlug', p.public_slug
    ) order by a.updated_at desc)
    from studio.articles a
    join studio.article_contents c on c.article_content_id = a.current_draft_content_id
    left join studio.article_publications p on p.article_id = a.article_id
    where a.owner_id = actor and a.deleted_at is null
  ), '[]'::jsonb);
end;
$$;

create or replace function public.read_article_v1(p_article_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with resolved as (
    select
      a.article_id,
      case
        when a.owner_id = auth.uid() then a.current_draft_content_id
        else p.current_content_id
      end as content_id,
      case
        when a.owner_id = auth.uid() then a.version
        else 0
      end as version,
      p.article_id is not null as published
    from studio.articles a
    left join studio.article_publications p on p.article_id = a.article_id
    where a.article_id = p_article_id
      and a.deleted_at is null
      and (a.owner_id = auth.uid() or p.article_id is not null)
  )
  select jsonb_build_object(
    'schemaId', 'circleheart-studio-article-draft-v2',
    'articleId', r.article_id,
    'draftVersion', r.version,
    'visibility', case when r.published then 'public' else 'draft' end,
    'locale', c.locale,
    'title', c.title,
    'blocks', c.blocks
  )
  from resolved r
  join studio.article_contents c on c.article_content_id = r.content_id;
$$;

create or replace function public.list_public_experiments_v1()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'experimentId', p.experiment_id,
    'title', e.title,
    'publicSlug', p.public_slug,
    'publishedAt', to_char(p.updated_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
    'snapshot', jsonb_build_object(
      'schemaId', 'circleheart-studio-experiment-snapshot-v2',
      'snapshotId', s.snapshot_id,
      'content', c.content,
      'createdAt', to_char(s.created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
    )
  ) order by p.updated_at desc), '[]'::jsonb)
  from studio.experiment_publications p
  join studio.experiments e on e.experiment_id = p.experiment_id
  join studio.experiment_snapshots s on s.snapshot_id = p.current_snapshot_id
  join studio.experiment_contents c on c.content_id = s.content_id
  where e.deleted_at is null;
$$;

create or replace function public.list_public_articles_v1()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'schemaId', 'circleheart-studio-article-draft-v2',
    'articleId', p.article_id,
    'draftVersion', 0,
    'visibility', 'public',
    'locale', c.locale,
    'title', c.title,
    'blocks', c.blocks
  ) order by p.updated_at desc), '[]'::jsonb)
  from studio.article_publications p
  join studio.articles a on a.article_id = p.article_id
  join studio.article_contents c on c.article_content_id = p.current_content_id
  where a.deleted_at is null;
$$;

revoke all on function public.list_my_experiments_v1() from public;
grant execute on function public.list_my_experiments_v1() to authenticated;
revoke all on function public.read_my_experiment_v1(uuid) from public;
grant execute on function public.read_my_experiment_v1(uuid) to authenticated;
revoke all on function public.list_my_experiment_snapshots_v1() from public;
grant execute on function public.list_my_experiment_snapshots_v1() to authenticated;
revoke all on function public.list_my_articles_v1() from public;
grant execute on function public.list_my_articles_v1() to authenticated;
revoke all on function public.read_article_v1(uuid) from public;
grant execute on function public.read_article_v1(uuid) to anon, authenticated;
revoke all on function public.list_public_experiments_v1() from public;
grant execute on function public.list_public_experiments_v1() to anon, authenticated;
revoke all on function public.list_public_articles_v1() from public;
grant execute on function public.list_public_articles_v1() to anon, authenticated;

commit;
