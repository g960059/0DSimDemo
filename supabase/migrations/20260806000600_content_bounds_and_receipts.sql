begin;

-- Operation receipts prove idempotent commitment; they must not become a
-- second content store. Large authored payloads are represented by a stable
-- server-side digest, and committed receipts retain only the identity needed
-- to replay the client response.
create or replace function studio.operation_request_fingerprint_v1(
  p_operation_kind text,
  p_request jsonb
)
returns jsonb
language plpgsql
immutable
set search_path = ''
as $$
begin
  if p_operation_kind in (
    'save-experiment-v1',
    'commit-admitted-experiment-snapshot-v1'
  ) and p_request ? 'content' then
    return (p_request - 'content') || jsonb_build_object(
      'contentSha256',
      encode(
        extensions.digest(
          pg_catalog.convert_to((p_request -> 'content')::text, 'UTF8'),
          'sha256'
        ),
        'hex'
      )
    );
  end if;
  if p_operation_kind = 'save-article-v1' and p_request ? 'blocks' then
    return (p_request - 'blocks') || jsonb_build_object(
      'blocksSha256',
      encode(
        extensions.digest(
          pg_catalog.convert_to((p_request -> 'blocks')::text, 'UTF8'),
          'sha256'
        ),
        'hex'
      )
    );
  end if;
  return p_request;
end;
$$;

create or replace function studio.operation_result_receipt_v1(
  p_operation_kind text,
  p_result jsonb
)
returns jsonb
language plpgsql
immutable
set search_path = ''
as $$
begin
  if p_operation_kind = 'save-experiment-v1' then
    return jsonb_build_object(
      'experimentId', p_result -> 'experimentId',
      'version', p_result -> 'version'
    );
  end if;
  if p_operation_kind = 'commit-admitted-experiment-snapshot-v1' then
    return jsonb_build_object(
      'schemaId', p_result -> 'schemaId',
      'snapshotId', p_result -> 'snapshotId',
      'createdAt', p_result -> 'createdAt'
    );
  end if;
  if p_operation_kind = 'save-article-v1' then
    return jsonb_build_object(
      'articleId', p_result -> 'articleId',
      'version', p_result -> 'version'
    );
  end if;
  return p_result;
end;
$$;

create or replace function studio.begin_operation_v1(
  p_actor_id uuid,
  p_operation_id uuid,
  p_operation_kind text,
  p_request jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  existing studio.operation_receipts%rowtype;
  compact_request jsonb := studio.operation_request_fingerprint_v1(
    p_operation_kind,
    p_request
  );
begin
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_actor_id::text || ':' || p_operation_id::text, 0)
  );
  select * into existing
  from studio.operation_receipts
  where actor_id = p_actor_id and operation_id = p_operation_id;
  if found then
    if existing.operation_kind is distinct from p_operation_kind
      or existing.request is distinct from compact_request
    then
      raise exception 'operation_id was already used for a different request'
        using errcode = '23505';
    end if;
    if existing.status = 'committed' then
      return existing.result;
    end if;
    raise exception 'operation is already running' using errcode = '55000';
  end if;

  perform studio.enforce_anonymous_mutation_quota_v1(p_actor_id);

  insert into studio.operation_receipts (
    actor_id,
    operation_id,
    operation_kind,
    request
  ) values (
    p_actor_id,
    p_operation_id,
    p_operation_kind,
    compact_request
  );
  return null;
end;
$$;

create or replace function studio.finish_operation_v1(
  p_actor_id uuid,
  p_operation_id uuid,
  p_result jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  receipt_kind text;
  compact_result jsonb;
begin
  select operation_kind into receipt_kind
  from studio.operation_receipts
  where actor_id = p_actor_id
    and operation_id = p_operation_id
    and status = 'running'
  for update;
  if not found then
    raise exception 'operation receipt is missing or already committed'
      using errcode = '55000';
  end if;
  compact_result := studio.operation_result_receipt_v1(
    receipt_kind,
    p_result
  );
  update studio.operation_receipts
  set status = 'committed',
      result = compact_result,
      completed_at = now()
  where actor_id = p_actor_id
    and operation_id = p_operation_id
    and status = 'running';
  return compact_result;
end;
$$;

alter table studio.operation_receipts
  alter column expires_at set default (now() + interval '24 hours');
update studio.operation_receipts
set request = studio.operation_request_fingerprint_v1(
      operation_kind,
      request
    ),
    result = case
      when result is null then null
      else studio.operation_result_receipt_v1(operation_kind, result)
    end,
    expires_at = least(expires_at, now() + interval '24 hours');

alter table studio.experiment_contents
  drop constraint experiment_contents_size;
alter table studio.experiment_contents
  add constraint experiment_contents_size check (
    content_size_bytes between 1 and 8388608
  );
alter table studio.article_contents
  drop constraint article_contents_size;
alter table studio.article_contents
  add constraint article_contents_size check (
    content_size_bytes between 1 and 2097152
  );

create or replace function studio.extend_new_snapshot_retention_v1()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.retain_until is not null then
    new.retain_until := greatest(
      new.retain_until,
      pg_catalog.statement_timestamp() + interval '24 hours'
    );
  end if;
  return new;
end;
$$;

create trigger extend_new_snapshot_retention
before insert on studio.experiment_snapshot_retention
for each row execute function studio.extend_new_snapshot_retention_v1();

-- Anonymous accounts are useful for try-before-save, but immutable revisions
-- make rate limiting alone insufficient. These small pre-release caps bound
-- stored rows and bytes until the user links an email or Google account.
create or replace function studio.enforce_anonymous_storage_quota_v1()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid;
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

  actor := case
    when tg_table_name = 'experiment_contents' then new.created_by
    when tg_table_name = 'article_contents' then new.owner_id
    else new.owner_id
  end;
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
    incoming_bytes := pg_catalog.octet_length(new.content::text);
    if experiment_content_count >= 200 then
      raise exception 'Anonymous Experiment revision limit reached. Sign in to keep saving.'
        using errcode = '54000';
    end if;
  elsif tg_table_name = 'article_contents' then
    incoming_bytes := pg_catalog.octet_length(new.blocks::text)
      + pg_catalog.octet_length(new.title)
      + pg_catalog.octet_length(new.locale);
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

create trigger enforce_anonymous_experiment_content_storage
before insert on studio.experiment_contents
for each row execute function studio.enforce_anonymous_storage_quota_v1();
create trigger enforce_anonymous_article_content_storage
before insert on studio.article_contents
for each row execute function studio.enforce_anonymous_storage_quota_v1();
create trigger enforce_anonymous_snapshot_storage
before insert on studio.experiment_snapshots
for each row execute function studio.enforce_anonymous_storage_quota_v1();
create trigger enforce_anonymous_experiment_storage
before insert on studio.experiments
for each row execute function studio.enforce_anonymous_storage_quota_v1();
create trigger enforce_anonymous_article_storage
before insert on studio.articles
for each row execute function studio.enforce_anonymous_storage_quota_v1();

revoke all on function studio.operation_request_fingerprint_v1(text, jsonb)
  from public, anon, authenticated;
revoke all on function studio.operation_result_receipt_v1(text, jsonb)
  from public, anon, authenticated;
revoke all on function studio.begin_operation_v1(uuid, uuid, text, jsonb)
  from public, anon, authenticated;
revoke all on function studio.finish_operation_v1(uuid, uuid, jsonb)
  from public, anon, authenticated;
revoke all on function studio.enforce_anonymous_storage_quota_v1()
  from public, anon, authenticated;

commit;
