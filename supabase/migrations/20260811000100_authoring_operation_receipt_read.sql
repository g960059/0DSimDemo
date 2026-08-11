-- AI authoring commands need to recover a committed mutation after the
-- transport response is lost, before they repeat an expensive simulation.
-- The receipt is actor-scoped and contains only the compact result already
-- produced by the mutation RPC.

create or replace function public.read_my_authoring_operation_receipt_v1(
  p_operation_id uuid
) returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  receipt studio.operation_receipts%rowtype;
begin
  if actor is null then
    raise exception 'authentication required' using errcode = '28000';
  end if;

  select * into receipt
  from studio.operation_receipts
  where actor_id = actor
    and operation_id = p_operation_id;

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

revoke all on function public.read_my_authoring_operation_receipt_v1(uuid)
  from public;
grant execute on function public.read_my_authoring_operation_receipt_v1(uuid)
  to authenticated;
