begin;

create schema if not exists studio;

revoke all on schema studio from public;
revoke all on schema studio from anon;
revoke all on schema studio from authenticated;
grant usage on schema studio to service_role;

create table studio.model_releases (
  model_id text primary key,
  model_family_id text not null,
  display_name text not null,
  manifest jsonb not null,
  artifact_path text not null unique,
  artifact_sha256 text not null,
  registry_fingerprint text not null,
  source_commit text not null,
  registered_at timestamptz not null default now(),
  constraint model_releases_model_id_nonempty
    check (model_id = btrim(model_id) and char_length(model_id) > 0),
  constraint model_releases_family_id_nonempty
    check (model_family_id = btrim(model_family_id) and char_length(model_family_id) > 0),
  constraint model_releases_display_name_nonempty
    check (display_name = btrim(display_name) and char_length(display_name) between 1 and 160),
  constraint model_releases_manifest_object
    check (jsonb_typeof(manifest) = 'object' and manifest ->> 'modelId' = model_id),
  constraint model_releases_artifact_path_nonempty
    check (artifact_path = btrim(artifact_path) and char_length(artifact_path) > 0),
  constraint model_releases_artifact_sha256
    check (artifact_sha256 ~ '^[0-9a-f]{64}$'),
  constraint model_releases_registry_fingerprint
    check (registry_fingerprint ~ '^[0-9a-f]{64}$'),
  constraint model_releases_source_commit_nonempty
    check (source_commit = btrim(source_commit) and char_length(source_commit) > 0)
);

comment on table studio.model_releases is
  'Immutable exact-model registry rows. A model_id can never be rebound to different bytes or a different execution manifest.';
comment on column studio.model_releases.artifact_sha256 is
  'Registry/CI integrity metadata. It is not Studio domain identity and is not returned to ordinary clients.';

create table studio.model_release_availability (
  model_id text primary key references studio.model_releases(model_id) on delete restrict,
  listed boolean not null default false,
  loadable boolean not null default true,
  retired_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint model_release_availability_retirement
    check (retired_at is null or listed = false)
);

create table studio.model_release_channels (
  channel text primary key,
  model_id text not null references studio.model_releases(model_id) on delete restrict,
  updated_at timestamptz not null default now(),
  constraint model_release_channels_name
    check (channel ~ '^[a-z][a-z0-9-]{0,63}$')
);

create or replace function studio.reject_immutable_row_mutation_v1()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception '% is immutable', tg_table_name using errcode = '55000';
end;
$$;

create trigger model_releases_are_immutable
before update or delete on studio.model_releases
for each row execute function studio.reject_immutable_row_mutation_v1();

alter table studio.model_releases enable row level security;
alter table studio.model_release_availability enable row level security;
alter table studio.model_release_channels enable row level security;

revoke all on all tables in schema studio from public, anon, authenticated;
grant all on all tables in schema studio to service_role;

create or replace function public.register_model_release_v1(
  p_model_id text,
  p_model_family_id text,
  p_display_name text,
  p_manifest jsonb,
  p_artifact_path text,
  p_artifact_sha256 text,
  p_registry_fingerprint text,
  p_source_commit text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  existing studio.model_releases%rowtype;
begin
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('model-release:' || p_model_id, 0)
  );
  select * into existing
  from studio.model_releases
  where model_id = p_model_id;

  if found then
    if existing.model_family_id is not distinct from p_model_family_id
      and existing.display_name is not distinct from p_display_name
      and existing.manifest is not distinct from p_manifest
      and existing.artifact_path is not distinct from p_artifact_path
      and existing.artifact_sha256 is not distinct from p_artifact_sha256
      and existing.registry_fingerprint is not distinct from p_registry_fingerprint
    then
      return to_jsonb(existing);
    end if;
    raise exception 'model_id % is already registered with different release bytes or contract',
      p_model_id using errcode = '23505';
  end if;

  insert into studio.model_releases (
    model_id,
    model_family_id,
    display_name,
    manifest,
    artifact_path,
    artifact_sha256,
    registry_fingerprint,
    source_commit
  ) values (
    p_model_id,
    p_model_family_id,
    p_display_name,
    p_manifest,
    p_artifact_path,
    p_artifact_sha256,
    p_registry_fingerprint,
    p_source_commit
  ) returning * into existing;

  insert into studio.model_release_availability (model_id)
  values (p_model_id);

  return to_jsonb(existing);
end;
$$;

create or replace function public.get_model_release_v1(
  p_model_id text
)
returns table (
  model_id text,
  model_family_id text,
  display_name text,
  manifest jsonb,
  artifact_path text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    r.model_id,
    r.model_family_id,
    r.display_name,
    r.manifest,
    r.artifact_path
  from studio.model_releases as r
  join studio.model_release_availability as a on a.model_id = r.model_id
  where r.model_id = p_model_id and a.loadable;
$$;

create or replace function public.set_model_release_channel_v1(
  p_channel text,
  p_model_id text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from studio.model_release_availability
    where model_id = p_model_id and loadable
  ) then
    raise exception 'model release % is not loadable', p_model_id using errcode = '23503';
  end if;
  insert into studio.model_release_channels (channel, model_id)
  values (p_channel, p_model_id)
  on conflict (channel) do update
  set model_id = excluded.model_id, updated_at = now();
end;
$$;

create or replace function public.get_model_release_channel_v1(
  p_channel text
)
returns table (
  channel text,
  model_id text,
  model_family_id text,
  display_name text,
  manifest jsonb,
  artifact_path text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    c.channel,
    r.model_id,
    r.model_family_id,
    r.display_name,
    r.manifest,
    r.artifact_path
  from studio.model_release_channels as c
  join studio.model_releases as r on r.model_id = c.model_id
  join studio.model_release_availability as a on a.model_id = r.model_id
  where c.channel = p_channel and a.loadable;
$$;

revoke all on function public.register_model_release_v1(text, text, text, jsonb, text, text, text, text)
  from public, anon, authenticated;
grant execute on function public.register_model_release_v1(text, text, text, jsonb, text, text, text, text)
  to service_role;
revoke all on function public.set_model_release_channel_v1(text, text)
  from public, anon, authenticated;
grant execute on function public.set_model_release_channel_v1(text, text)
  to service_role;
revoke all on function public.get_model_release_channel_v1(text) from public;
grant execute on function public.get_model_release_channel_v1(text) to anon, authenticated;
revoke all on function public.get_model_release_v1(text) from public;
grant execute on function public.get_model_release_v1(text) to anon, authenticated;

commit;
