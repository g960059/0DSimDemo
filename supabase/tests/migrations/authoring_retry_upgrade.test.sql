begin;

create extension if not exists pgtap with schema extensions;

select plan(5);

insert into auth.users (
  id,
  aud,
  role,
  raw_app_meta_data,
  raw_user_meta_data,
  is_anonymous,
  created_at,
  updated_at
) values (
  '10000000-0000-0000-0000-000000000010',
  'authenticated',
  'authenticated',
  '{}'::jsonb,
  '{}'::jsonb,
  false,
  now(),
  now()
);

create table studio.authoring_command_bindings (
  actor_id uuid not null references auth.users(id) on delete cascade,
  command_id uuid not null,
  command_action text not null,
  command_digest text not null,
  created_at timestamptz not null default now(),
  committed_operation_kind text,
  committed_result jsonb,
  operation_created_at timestamptz,
  operation_completed_at timestamptz,
  primary key (actor_id, command_id)
);

insert into studio.authoring_command_bindings (
  actor_id,
  command_id,
  command_action,
  command_digest,
  created_at,
  committed_operation_kind,
  committed_result,
  operation_created_at,
  operation_completed_at
) values (
  '10000000-0000-0000-0000-000000000010',
  '20000000-0000-0000-0000-000000000010',
  'article.save',
  repeat('a', 64),
  pg_catalog.statement_timestamp() - interval '10 days',
  'save-article-v1',
  '{"articleId":"30000000-0000-0000-0000-000000000010","version":0}'::jsonb,
  pg_catalog.statement_timestamp() - interval '10 days',
  pg_catalog.statement_timestamp() - interval '10 days'
);

\ir ../../migrations/20260827000100_simplify_authoring_retry_authority.sql

select ok(
  to_regclass('studio.authoring_command_bindings') is null,
  'The superseded binding table is removed after upgrade'
);

select is(
  (
    select status
    from studio.operation_receipts
    where actor_id = '10000000-0000-0000-0000-000000000010'
      and operation_id = '20000000-0000-0000-0000-000000000010'
  ),
  'committed',
  'A binding-only committed command becomes a retained receipt'
);

select is(
  (
    select result ->> 'articleId'
    from studio.operation_receipts
    where actor_id = '10000000-0000-0000-0000-000000000010'
      and operation_id = '20000000-0000-0000-0000-000000000010'
  ),
  '30000000-0000-0000-0000-000000000010',
  'The committed result remains recoverable through operation.read'
);

select ok(
  (
    select expires_at >= created_at + interval '30 days'
    from studio.operation_receipts
    where actor_id = '10000000-0000-0000-0000-000000000010'
      and operation_id = '20000000-0000-0000-0000-000000000010'
  ),
  'The migrated receipt preserves the original 30-day retry window'
);

select throws_ok(
  $$
    select studio.begin_operation_v1(
      '10000000-0000-0000-0000-000000000010',
      '20000000-0000-0000-0000-000000000010',
      'save-article-v1',
      '{"title":"A retry whose original fingerprint is unavailable"}'::jsonb
    )
  $$,
  '23505',
  'operation_id was already used for a different request',
  'A binding-only retry fails closed instead of creating duplicate content'
);

select * from finish();

rollback;
