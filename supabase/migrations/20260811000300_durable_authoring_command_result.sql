-- Preserve one compact committed result for every AI semantic command. The
-- ordinary operation receipt remains short-lived; this binding is the durable
-- idempotency authority for delayed assistant retries.

alter table studio.authoring_command_bindings
  add column if not exists committed_operation_kind text,
  add column if not exists committed_result jsonb,
  add column if not exists operation_created_at timestamptz,
  add column if not exists operation_completed_at timestamptz;

do $$
begin
  if not exists (
    select 1
    from pg_catalog.pg_constraint
    where conname = 'authoring_command_bindings_committed_receipt'
      and conrelid = 'studio.authoring_command_bindings'::regclass
  ) then
    alter table studio.authoring_command_bindings
      add constraint authoring_command_bindings_committed_receipt
      check (
        (committed_operation_kind is null
          and committed_result is null
          and operation_created_at is null
          and operation_completed_at is null)
        or
        (committed_operation_kind ~ '^[a-z][a-z0-9-]{0,79}$'
          and jsonb_typeof(committed_result) = 'object'
          and operation_created_at is not null
          and operation_completed_at is not null)
      );
  end if;
end;
$$;

-- Migration 002 briefly allowed a command claim to adopt an operation receipt
-- that predated the binding. Such a receipt cannot be proven to represent the
-- canonical AI command digest, so discard only those unsafe late bindings.
delete from studio.authoring_command_bindings as binding
using studio.operation_receipts as receipt
where receipt.actor_id = binding.actor_id
  and receipt.operation_id = binding.command_id
  and receipt.created_at < binding.created_at;

-- Preserve legitimate claims created before this migration: the binding was
-- reserved first and the content mutation committed afterwards.
update studio.authoring_command_bindings as binding
set committed_operation_kind = receipt.operation_kind,
    committed_result = receipt.result,
    operation_created_at = receipt.created_at,
    operation_completed_at = receipt.completed_at
from studio.operation_receipts as receipt
where receipt.actor_id = binding.actor_id
  and receipt.operation_id = binding.command_id
  and receipt.status = 'committed'
  and binding.created_at <= receipt.created_at;

create or replace function studio.remember_authoring_command_result_v1()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status <> 'committed' then
    return new;
  end if;
  update studio.authoring_command_bindings
  set committed_operation_kind = new.operation_kind,
      committed_result = new.result,
      operation_created_at = new.created_at,
      operation_completed_at = new.completed_at
  where actor_id = new.actor_id
    and command_id = new.operation_id;
  return new;
end;
$$;

drop trigger if exists remember_authoring_command_result_v1
  on studio.operation_receipts;
create trigger remember_authoring_command_result_v1
after insert or update of status, result, completed_at
on studio.operation_receipts
for each row
execute function studio.remember_authoring_command_result_v1();

create or replace function public.claim_my_authoring_command_v1(
  p_command_id uuid,
  p_command_action text,
  p_command_digest text
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  binding studio.authoring_command_bindings%rowtype;
  receipt studio.operation_receipts%rowtype;
  inserted_count integer;
begin
  if actor is null then
    raise exception 'authentication required' using errcode = '28000';
  end if;
  if coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) then
    raise exception 'AI authoring command claims require a signed-in user'
      using errcode = '42501';
  end if;
  if p_command_action !~ '^[a-z][a-z0-9.-]{0,79}$' then
    raise exception 'authoring command action is invalid' using errcode = '22023';
  end if;
  if p_command_digest !~ '^[0-9a-f]{64}$' then
    raise exception 'authoring command digest is invalid' using errcode = '22023';
  end if;

  insert into studio.authoring_command_bindings (
    actor_id,
    command_id,
    command_action,
    command_digest
  ) values (
    actor,
    p_command_id,
    p_command_action,
    p_command_digest
  ) on conflict (actor_id, command_id) do nothing;
  get diagnostics inserted_count = row_count;

  select * into strict binding
  from studio.authoring_command_bindings
  where actor_id = actor
    and command_id = p_command_id;

  if binding.command_action is distinct from p_command_action
    or binding.command_digest is distinct from p_command_digest then
    raise exception 'command_id was already used for a different authoring command'
      using errcode = '23505';
  end if;

  select * into receipt
  from studio.operation_receipts
  where actor_id = actor
    and operation_id = p_command_id;

  if found then
    if inserted_count = 1 then
      raise exception 'command_id already belongs to an unbound content operation'
        using errcode = '23505';
    end if;
    if receipt.status = 'committed' then
      update studio.authoring_command_bindings
      set committed_operation_kind = receipt.operation_kind,
          committed_result = receipt.result,
          operation_created_at = receipt.created_at,
          operation_completed_at = receipt.completed_at
      where actor_id = actor
        and command_id = p_command_id;
    end if;
    return jsonb_build_object(
      'operationId', receipt.operation_id,
      'operationKind', receipt.operation_kind,
      'status', receipt.status,
      'result', receipt.result,
      'createdAt', receipt.created_at,
      'completedAt', receipt.completed_at
    );
  end if;

  if binding.committed_operation_kind is null then
    return null;
  end if;

  return jsonb_build_object(
    'operationId', binding.command_id,
    'operationKind', binding.committed_operation_kind,
    'status', 'committed',
    'result', binding.committed_result,
    'createdAt', binding.operation_created_at,
    'completedAt', binding.operation_completed_at
  );
end;
$$;
