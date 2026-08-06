begin;

create index operation_receipts_actor_created_idx
  on studio.operation_receipts(actor_id, created_at desc);

create or replace function studio.enforce_anonymous_mutation_quota_v1(
  p_actor_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  recent_minute bigint;
  recent_day bigint;
begin
  if not coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) then
    return;
  end if;

  -- Different operation IDs for one anonymous account must not race through
  -- the count together. Idempotent replay is handled before this lock.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      'studio:anonymous-mutation-quota:' || p_actor_id::text,
      0
    )
  );

  select
    count(*) filter (
      where created_at >= pg_catalog.statement_timestamp() - interval '1 minute'
    ),
    count(*)
  into recent_minute, recent_day
  from studio.operation_receipts
  where actor_id = p_actor_id
    and created_at >= pg_catalog.statement_timestamp() - interval '24 hours';

  if recent_minute >= 60 then
    raise exception
      'Anonymous save limit reached. Sign in or try again in a minute.'
      using errcode = '54000';
  end if;
  if recent_day >= 600 then
    raise exception
      'Anonymous daily save limit reached. Sign in to continue saving.'
      using errcode = '54000';
  end if;
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
begin
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_actor_id::text || ':' || p_operation_id::text, 0)
  );
  select * into existing
  from studio.operation_receipts
  where actor_id = p_actor_id and operation_id = p_operation_id;
  if found then
    if existing.operation_kind is distinct from p_operation_kind
      or existing.request is distinct from p_request
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
    p_request
  );
  return null;
end;
$$;

revoke all on function studio.enforce_anonymous_mutation_quota_v1(uuid)
  from public, anon, authenticated;
revoke all on function studio.begin_operation_v1(uuid, uuid, text, jsonb)
  from public, anon, authenticated;

create extension if not exists pg_cron with schema pg_catalog;

select cron.schedule(
  'circleheart-content-gc-v1',
  '*/15 * * * *',
  'select studio.gc_unreferenced_content_v1(500);'
);

commit;
