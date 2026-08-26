drop trigger if exists remember_authoring_command_result_v1
  on studio.operation_receipts;
drop function if exists public.claim_my_authoring_command_v1(uuid, text, text);
drop function if exists studio.remember_authoring_command_result_v1();
drop table if exists studio.authoring_command_bindings;

alter table studio.operation_receipts
  alter column expires_at
  set default (now() + interval '30 days');

update studio.operation_receipts
set expires_at = greatest(expires_at, created_at + interval '30 days')
where expires_at < created_at + interval '30 days';
