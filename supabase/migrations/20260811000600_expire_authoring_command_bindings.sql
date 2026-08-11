-- Retain exact AI command retries for at least 30 days without allowing the
-- permanent command-history quota to lock an authoring account forever.
-- Existing command IDs are resolved before cleanup, so an exact retry keeps
-- its durable replay result even when the binding is older than the window.

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
  binding_inserted boolean := false;
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

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(actor::text, 721903)
  );
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      actor::text || ':' || p_command_id::text,
      0
    )
  );
  select * into binding
  from studio.authoring_command_bindings
  where actor_id = actor
    and command_id = p_command_id;

  if not found then
    delete from studio.authoring_command_bindings
    where actor_id = actor
      and created_at < pg_catalog.statement_timestamp() - interval '30 days';
    if (
      select count(*) >= 240
      from studio.authoring_command_bindings
      where actor_id = actor
        and created_at >= pg_catalog.statement_timestamp() - interval '1 minute'
    ) then
      raise exception 'AI authoring command claim rate limit reached'
        using errcode = '54000';
    end if;
    if (
      select count(*) >= 100000
      from (
        select 1
        from studio.authoring_command_bindings
        where actor_id = actor
        limit 100000
      ) as bounded_authoring_history
    ) then
      raise exception 'AI authoring command history limit reached'
        using errcode = '54000';
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
    ) returning * into binding;
    binding_inserted := true;
  end if;

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
    if binding_inserted or receipt.created_at < binding.created_at then
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

revoke all on function public.claim_my_authoring_command_v1(uuid, text, text)
  from public;
revoke all on function public.claim_my_authoring_command_v1(uuid, text, text)
  from anon;
grant execute on function public.claim_my_authoring_command_v1(uuid, text, text)
  to authenticated;
grant execute on function public.claim_my_authoring_command_v1(uuid, text, text)
  to service_role;
