-- Bind an AI command UUID to one canonical semantic request before any
-- expensive local numerical work. This lets the CLI recover a committed RPC
-- receipt without weakening the existing server request-fingerprint check.

create table if not exists studio.authoring_command_bindings (
  actor_id uuid not null references auth.users(id) on delete cascade,
  command_id uuid not null,
  command_action text not null,
  command_digest text not null,
  created_at timestamptz not null default now(),
  primary key (actor_id, command_id),
  constraint authoring_command_bindings_action
    check (command_action ~ '^[a-z][a-z0-9.-]{0,79}$'),
  constraint authoring_command_bindings_digest
    check (command_digest ~ '^[0-9a-f]{64}$')
);

alter table studio.authoring_command_bindings enable row level security;

revoke all on table studio.authoring_command_bindings from public;
revoke all on table studio.authoring_command_bindings from anon;
revoke all on table studio.authoring_command_bindings from authenticated;
grant all on table studio.authoring_command_bindings to service_role;

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
begin
  if actor is null then
    raise exception 'authentication required' using errcode = '28000';
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

  if not found then
    return null;
  end if;

  return jsonb_build_object(
    'operationId', receipt.operation_id,
    'operationKind', receipt.operation_kind,
    'status', receipt.status,
    'result', receipt.result,
    'createdAt', receipt.created_at,
    'completedAt', receipt.completed_at
  );
end;
$$;

revoke all on function public.claim_my_authoring_command_v1(uuid, text, text)
  from public;
grant execute on function public.claim_my_authoring_command_v1(uuid, text, text)
  to authenticated;
