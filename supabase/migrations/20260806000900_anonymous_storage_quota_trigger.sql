begin;

-- A polymorphic trigger RECORD cannot safely reference a column that is
-- absent from any one of its target tables, even inside a CASE branch. Read
-- table-specific fields through JSON so anonymous Experiment content inserts
-- use created_by while the other protected rows use owner_id.
create or replace function studio.enforce_anonymous_storage_quota_v1()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid;
  row_data jsonb := pg_catalog.to_jsonb(new);
  experiment_content_count bigint;
  article_content_count bigint;
  snapshot_count bigint;
  live_experiment_count bigint;
  live_article_count bigint;
  stored_bytes bigint;
  incoming_bytes bigint := 0;
begin
  if not coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) then
    return new;
  end if;

  actor := coalesce(
    nullif(row_data ->> 'created_by', '')::uuid,
    nullif(row_data ->> 'owner_id', '')::uuid
  );
  if actor is null then
    raise exception 'Anonymous storage quota row has no owner'
      using errcode = '23502';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      'studio:anonymous-storage-quota:' || actor::text,
      0
    )
  );

  select count(*), coalesce(sum(content_size_bytes), 0)
  into experiment_content_count, stored_bytes
  from studio.experiment_contents
  where created_by = actor;
  select count(*), stored_bytes + coalesce(sum(content_size_bytes), 0)
  into article_content_count, stored_bytes
  from studio.article_contents
  where owner_id = actor;
  select count(*) into snapshot_count
  from studio.experiment_snapshots
  where owner_id = actor;
  select count(*) into live_experiment_count
  from studio.experiments
  where owner_id = actor and deleted_at is null;
  select count(*) into live_article_count
  from studio.articles
  where owner_id = actor and deleted_at is null;

  if tg_table_name = 'experiment_contents' then
    incoming_bytes := pg_catalog.octet_length((row_data -> 'content')::text);
    if experiment_content_count >= 200 then
      raise exception 'Anonymous Experiment revision limit reached. Sign in to keep saving.'
        using errcode = '54000';
    end if;
  elsif tg_table_name = 'article_contents' then
    incoming_bytes := pg_catalog.octet_length((row_data -> 'blocks')::text)
      + pg_catalog.octet_length(row_data ->> 'title')
      + pg_catalog.octet_length(row_data ->> 'locale');
    if article_content_count >= 200 then
      raise exception 'Anonymous Article revision limit reached. Sign in to keep saving.'
        using errcode = '54000';
    end if;
  elsif tg_table_name = 'experiment_snapshots' and snapshot_count >= 100 then
    raise exception 'Anonymous Snapshot limit reached. Sign in to keep saving.'
      using errcode = '54000';
  elsif tg_table_name = 'experiments' and live_experiment_count >= 20 then
    raise exception 'Anonymous Experiment limit reached. Sign in to keep saving.'
      using errcode = '54000';
  elsif tg_table_name = 'articles' and live_article_count >= 20 then
    raise exception 'Anonymous Article limit reached. Sign in to keep saving.'
      using errcode = '54000';
  end if;

  if stored_bytes + incoming_bytes > 67108864 then
    raise exception 'Anonymous storage limit reached. Sign in to keep saving.'
      using errcode = '54000';
  end if;
  return new;
end;
$$;

revoke all on function studio.enforce_anonymous_storage_quota_v1()
  from public, anon, authenticated;

commit;
