alter table studio.operation_receipts
  alter column expires_at
  set default (now() + interval '30 days');

update studio.operation_receipts
set expires_at = greatest(expires_at, created_at + interval '30 days')
where expires_at < created_at + interval '30 days';

-- A deployed prerelease database may have already collected a short-lived
-- operation receipt while retaining its 30-day authoring binding. Preserve
-- those still-supported command IDs as receipts before removing the duplicate
-- authority. Their original RPC fingerprint cannot be reconstructed from the
-- command digest, so a retry fails closed instead of running the mutation a
-- second time; operation.read can still recover a committed result.
do $$
begin
  if to_regclass('studio.authoring_command_bindings') is not null then
    execute $migration$
      insert into studio.operation_receipts (
        actor_id,
        operation_id,
        operation_kind,
        request,
        status,
        result,
        created_at,
        completed_at,
        expires_at
      )
      select
        binding.actor_id,
        binding.command_id,
        coalesce(
          binding.committed_operation_kind,
          'legacy-authoring-command-v1'
        ),
        jsonb_build_object(
          'legacyAuthoringCommandAction', binding.command_action,
          'legacyAuthoringCommandDigest', binding.command_digest
        ),
        case
          when binding.committed_operation_kind is null then 'running'
          else 'committed'
        end,
        binding.committed_result,
        coalesce(binding.operation_created_at, binding.created_at),
        binding.operation_completed_at,
        coalesce(binding.operation_created_at, binding.created_at)
          + interval '30 days'
      from studio.authoring_command_bindings as binding
      where coalesce(binding.operation_created_at, binding.created_at)
        >= pg_catalog.statement_timestamp() - interval '30 days'
        and not exists (
          select 1
          from studio.operation_receipts as receipt
          where receipt.actor_id = binding.actor_id
            and receipt.operation_id = binding.command_id
        )
      on conflict (actor_id, operation_id) do nothing
    $migration$;
  end if;
end;
$$;

drop trigger if exists remember_authoring_command_result_v1
  on studio.operation_receipts;
drop function if exists public.claim_my_authoring_command_v1(uuid, text, text);
drop function if exists studio.remember_authoring_command_result_v1();
drop table if exists studio.authoring_command_bindings;
