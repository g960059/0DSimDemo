begin;

-- Exact numerical packages and authoring surfaces have independent immutable
-- release identities. Lifecycle is mutable metadata and is deliberately not
-- part of modelId or surfaceReleaseId.
alter table studio.model_release_availability
  add column stage text not null default 'dev';

alter table studio.model_release_availability
  add constraint model_release_availability_stage
  check (stage in ('dev', 'stable', 'retired'));

-- Releases already serving the production default channel predate lifecycle
-- metadata and are therefore the only safe automatic stable backfill.
update studio.model_release_availability as availability
set stage = 'stable', updated_at = now()
where exists (
  select 1
  from studio.model_release_channels as channel
  where channel.channel = 'default'
    and channel.model_id = availability.model_id
);

-- The old listed/retired_at pair encoded a second partial lifecycle and was
-- never consumed by the product. Pre-release cutover leaves stage as the sole
-- discovery lifecycle; loadable remains the independent emergency kill switch.
alter table studio.model_release_availability
  drop constraint model_release_availability_retirement;
alter table studio.model_release_availability
  drop column listed,
  drop column retired_at;

-- Pre-lifecycle ad-hoc development pointers are not durable domain data.
delete from studio.model_release_channels
where channel not in ('default', 'research');

alter table studio.model_release_channels
  drop constraint model_release_channels_name;
alter table studio.model_release_channels
  add constraint model_release_channels_name
  check (channel in ('default', 'research'));

create table studio.model_surface_releases (
  surface_release_id text primary key,
  model_family_id text not null,
  display_name text not null,
  manifest jsonb not null,
  source_commit text not null,
  registered_at timestamptz not null default now(),
  constraint model_surface_releases_id_nonempty check (
    surface_release_id = btrim(surface_release_id)
    and char_length(surface_release_id) > 0
  ),
  constraint model_surface_releases_family_nonempty check (
    model_family_id = btrim(model_family_id)
    and char_length(model_family_id) > 0
  ),
  constraint model_surface_releases_display_name check (
    display_name = btrim(display_name)
    and char_length(display_name) between 1 and 160
  ),
  constraint model_surface_releases_manifest check (
    jsonb_typeof(manifest) = 'object'
    and manifest ->> 'schemaId' = 'circleheart-studio-model-surface-release-v1'
    and manifest ->> 'surfaceReleaseId' = surface_release_id
    and manifest ->> 'modelFamilyId' = model_family_id
  ),
  constraint model_surface_releases_source_commit check (
    source_commit = btrim(source_commit)
    and char_length(source_commit) > 0
  )
);

comment on table studio.model_surface_releases is
  'Immutable append-only authoring/analysis surfaces. They contain graphs, derived outputs, knobs, and protocols but no numerical kernel or Snapshot admission profile.';

create table studio.model_surface_release_availability (
  surface_release_id text primary key
    references studio.model_surface_releases(surface_release_id) on delete restrict,
  stage text not null default 'dev',
  updated_at timestamptz not null default now(),
  constraint model_surface_release_stage
    check (stage in ('dev', 'stable', 'retired'))
);

create table studio.model_surface_release_channels (
  model_family_id text not null,
  channel text not null,
  surface_release_id text not null
    references studio.model_surface_releases(surface_release_id) on delete restrict,
  updated_at timestamptz not null default now(),
  primary key (model_family_id, channel),
  constraint model_surface_release_channel
    check (channel in ('default', 'research'))
);

create table studio.model_release_successions (
  from_model_id text not null
    references studio.model_releases(model_id) on delete restrict,
  to_model_id text not null
    references studio.model_releases(model_id) on delete restrict,
  grade text not null,
  registered_at timestamptz not null default now(),
  primary key (from_model_id, to_model_id),
  constraint model_release_succession_not_self
    check (from_model_id <> to_model_id),
  constraint model_release_succession_grade
    check (grade in ('drop-in', 'successor'))
);

comment on table studio.model_release_successions is
  'Explicit model lineage only. It never silently repins existing content; drop-in qualification must be established by registry CI before insertion.';

create trigger model_surface_releases_are_immutable
before update or delete on studio.model_surface_releases
for each row execute function studio.reject_immutable_row_mutation_v1();

create trigger model_release_successions_are_immutable
before update or delete on studio.model_release_successions
for each row execute function studio.reject_immutable_row_mutation_v1();

alter table studio.model_surface_releases enable row level security;
alter table studio.model_surface_release_availability enable row level security;
alter table studio.model_surface_release_channels enable row level security;
alter table studio.model_release_successions enable row level security;

revoke all on studio.model_surface_releases from public, anon, authenticated;
revoke all on studio.model_surface_release_availability from public, anon, authenticated;
revoke all on studio.model_surface_release_channels from public, anon, authenticated;
revoke all on studio.model_release_successions from public, anon, authenticated;
grant all on studio.model_surface_releases to service_role;
grant all on studio.model_surface_release_availability to service_role;
grant all on studio.model_surface_release_channels to service_role;
grant all on studio.model_release_successions to service_role;

create or replace function studio.assert_release_stage_transition_v1(
  p_current text,
  p_next text,
  p_subject text
)
returns void
language plpgsql
immutable
set search_path = ''
as $$
begin
  if p_next not in ('dev', 'stable', 'retired') then
    raise exception 'invalid release stage %', p_next using errcode = '22023';
  end if;
  if p_current = p_next then return; end if;
  if p_current = 'dev' and p_next in ('stable', 'retired') then return; end if;
  if p_current = 'stable' and p_next = 'retired' then return; end if;
  raise exception '% cannot move from % to %', p_subject, p_current, p_next
    using errcode = '22023';
end;
$$;

create or replace function public.set_model_release_stage_v1(
  p_model_id text,
  p_stage text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_stage text;
begin
  select stage into current_stage
  from studio.model_release_availability
  where model_id = p_model_id
  for update;
  if not found then
    raise exception 'model release % is not registered', p_model_id
      using errcode = '23503';
  end if;
  perform studio.assert_release_stage_transition_v1(
    current_stage,
    p_stage,
    'model release ' || p_model_id
  );
  update studio.model_release_availability
  set stage = p_stage,
      updated_at = now()
  where model_id = p_model_id;
  if p_stage = 'retired' then
    delete from studio.model_release_channels where model_id = p_model_id;
  end if;
end;
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
declare
  release_stage text;
begin
  if p_channel not in ('default', 'research') then
    raise exception 'unsupported model release channel %', p_channel
      using errcode = '22023';
  end if;
  select stage into release_stage
  from studio.model_release_availability
  where model_id = p_model_id and loadable;
  if not found then
    raise exception 'model release % is not loadable', p_model_id
      using errcode = '23503';
  end if;
  if release_stage = 'retired'
    or (p_channel = 'default' and release_stage <> 'stable')
  then
    raise exception 'model release % at stage % cannot serve channel %',
      p_model_id, release_stage, p_channel using errcode = '22023';
  end if;
  insert into studio.model_release_channels (channel, model_id)
  values (p_channel, p_model_id)
  on conflict (channel) do update
  set model_id = excluded.model_id, updated_at = now();
end;
$$;

-- V2 read RPCs remain available to already-deployed clients. V3 adds only
-- lifecycle metadata; it does not change the immutable numerical package or
-- the hash-free Worker ticket.
create function public.get_model_release_v3(
  p_model_id text
)
returns table (
  model_id text,
  model_family_id text,
  display_name text,
  manifest jsonb,
  artifact_path text,
  module_abi text,
  default_fixture jsonb,
  analysis_profile_id text,
  stage text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    release.model_id,
    release.model_family_id,
    release.display_name,
    release.manifest,
    release.artifact_path,
    module.module_abi,
    module.default_fixture,
    module.analysis_profile_id,
    availability.stage
  from studio.model_releases as release
  join studio.model_release_availability as availability
    on availability.model_id = release.model_id
  join studio.model_release_modules as module
    on module.model_id = release.model_id
  where release.model_id = p_model_id and availability.loadable;
$$;

create function public.get_model_release_channel_v3(
  p_channel text
)
returns table (
  channel text,
  model_id text,
  model_family_id text,
  display_name text,
  manifest jsonb,
  artifact_path text,
  module_abi text,
  default_fixture jsonb,
  analysis_profile_id text,
  stage text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    channel.channel,
    release.model_id,
    release.model_family_id,
    release.display_name,
    release.manifest,
    release.artifact_path,
    module.module_abi,
    module.default_fixture,
    module.analysis_profile_id,
    availability.stage
  from studio.model_release_channels as channel
  join studio.model_releases as release
    on release.model_id = channel.model_id
  join studio.model_release_availability as availability
    on availability.model_id = release.model_id
  join studio.model_release_modules as module
    on module.model_id = release.model_id
  where channel.channel = p_channel and availability.loadable;
$$;

create or replace function public.register_model_surface_release_v1(
  p_surface_release_id text,
  p_model_family_id text,
  p_display_name text,
  p_manifest jsonb,
  p_source_commit text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  existing studio.model_surface_releases%rowtype;
begin
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('model-surface:' || p_surface_release_id, 0)
  );
  select * into existing
  from studio.model_surface_releases
  where surface_release_id = p_surface_release_id;
  if found then
    if existing.model_family_id is not distinct from p_model_family_id
      and existing.display_name is not distinct from p_display_name
      and existing.manifest is not distinct from p_manifest
    then
      -- Registration is idempotent by immutable release content. Preserve the
      -- first source commit as provenance rather than making retries from a
      -- later operational commit fail.
      return to_jsonb(existing);
    end if;
    raise exception 'surface_release_id % is already registered with different content',
      p_surface_release_id using errcode = '23505';
  end if;
  insert into studio.model_surface_releases (
    surface_release_id,
    model_family_id,
    display_name,
    manifest,
    source_commit
  ) values (
    p_surface_release_id,
    p_model_family_id,
    p_display_name,
    p_manifest,
    p_source_commit
  ) returning * into existing;
  insert into studio.model_surface_release_availability (surface_release_id)
  values (p_surface_release_id);
  return to_jsonb(existing);
end;
$$;

create or replace function public.set_model_surface_release_stage_v1(
  p_surface_release_id text,
  p_stage text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_stage text;
begin
  select stage into current_stage
  from studio.model_surface_release_availability
  where surface_release_id = p_surface_release_id
  for update;
  if not found then
    raise exception 'model surface release % is not registered', p_surface_release_id
      using errcode = '23503';
  end if;
  perform studio.assert_release_stage_transition_v1(
    current_stage,
    p_stage,
    'model surface release ' || p_surface_release_id
  );
  update studio.model_surface_release_availability
  set stage = p_stage, updated_at = now()
  where surface_release_id = p_surface_release_id;
  if p_stage = 'retired' then
    delete from studio.model_surface_release_channels
    where surface_release_id = p_surface_release_id;
  end if;
end;
$$;

create or replace function public.set_model_surface_release_channel_v1(
  p_model_family_id text,
  p_channel text,
  p_surface_release_id text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  release_family text;
  release_stage text;
begin
  if p_channel not in ('default', 'research') then
    raise exception 'unsupported model surface channel %', p_channel
      using errcode = '22023';
  end if;
  select release.model_family_id, availability.stage
  into release_family, release_stage
  from studio.model_surface_releases as release
  join studio.model_surface_release_availability as availability
    on availability.surface_release_id = release.surface_release_id
  where release.surface_release_id = p_surface_release_id;
  if not found then
    raise exception 'model surface release % is not registered', p_surface_release_id
      using errcode = '23503';
  end if;
  if release_family <> p_model_family_id then
    raise exception 'model surface release % belongs to another model family',
      p_surface_release_id using errcode = '22023';
  end if;
  if release_stage = 'retired'
    or (p_channel = 'default' and release_stage <> 'stable')
  then
    raise exception 'model surface release % at stage % cannot serve channel %',
      p_surface_release_id, release_stage, p_channel using errcode = '22023';
  end if;
  insert into studio.model_surface_release_channels (
    model_family_id, channel, surface_release_id
  ) values (
    p_model_family_id, p_channel, p_surface_release_id
  ) on conflict (model_family_id, channel) do update
  set surface_release_id = excluded.surface_release_id, updated_at = now();
end;
$$;

create or replace function public.get_model_surface_release_v1(
  p_surface_release_id text
)
returns table (
  surface_release_id text,
  model_family_id text,
  display_name text,
  manifest jsonb,
  stage text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    release.surface_release_id,
    release.model_family_id,
    release.display_name,
    release.manifest,
    availability.stage
  from studio.model_surface_releases as release
  join studio.model_surface_release_availability as availability
    on availability.surface_release_id = release.surface_release_id
  where release.surface_release_id = p_surface_release_id;
$$;

create or replace function public.get_model_surface_release_channel_v1(
  p_model_family_id text,
  p_channel text
)
returns table (
  surface_release_id text,
  model_family_id text,
  display_name text,
  manifest jsonb,
  stage text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    release.surface_release_id,
    release.model_family_id,
    release.display_name,
    release.manifest,
    availability.stage
  from studio.model_surface_release_channels as channel
  join studio.model_surface_releases as release
    on release.surface_release_id = channel.surface_release_id
  join studio.model_surface_release_availability as availability
    on availability.surface_release_id = release.surface_release_id
  where channel.model_family_id = p_model_family_id
    and channel.channel = p_channel
    and availability.stage <> 'retired';
$$;

create or replace function public.register_model_release_succession_v1(
  p_from_model_id text,
  p_to_model_id text,
  p_grade text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  from_family text;
  to_family text;
  existing_grade text;
begin
  select model_family_id into from_family
  from studio.model_releases where model_id = p_from_model_id;
  select model_family_id into to_family
  from studio.model_releases where model_id = p_to_model_id;
  if from_family is null or to_family is null then
    raise exception 'both model releases must be registered' using errcode = '23503';
  end if;
  if from_family <> to_family then
    raise exception 'model succession cannot cross model families' using errcode = '22023';
  end if;
  select grade into existing_grade
  from studio.model_release_successions
  where from_model_id = p_from_model_id and to_model_id = p_to_model_id;
  if found then
    if existing_grade <> p_grade then
      raise exception 'model succession is already registered with grade %',
        existing_grade using errcode = '23505';
    end if;
    return;
  end if;
  insert into studio.model_release_successions (
    from_model_id, to_model_id, grade
  ) values (
    p_from_model_id, p_to_model_id, p_grade
  );
end;
$$;

create or replace function studio.require_stable_snapshot_model_v1(
  p_snapshot_id uuid
)
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  release_stage text;
begin
  select availability.stage into release_stage
  from studio.experiment_snapshots as snapshot
  join studio.experiment_contents as content
    on content.content_id = snapshot.content_id
  join studio.model_release_availability as availability
    on availability.model_id = content.model_id
  where snapshot.snapshot_id = p_snapshot_id;
  if release_stage is null then
    raise exception 'Snapshot model release is unavailable' using errcode = '23503';
  end if;
  if release_stage <> 'stable' then
    raise exception 'Only stable model releases may be published (found %)',
      release_stage using errcode = '22023';
  end if;
end;
$$;

create or replace function studio.guard_experiment_publication_model_v1()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  perform studio.require_stable_snapshot_model_v1(new.current_snapshot_id);
  return new;
end;
$$;

create or replace function studio.guard_article_publication_models_v1()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  snapshot_id uuid;
begin
  for snapshot_id in
    select reference.snapshot_id
    from studio.article_snapshot_refs as reference
    where reference.article_content_id = new.current_content_id
  loop
    perform studio.require_stable_snapshot_model_v1(snapshot_id);
  end loop;
  return new;
end;
$$;

create trigger experiment_publication_requires_stable_model
before insert or update of current_snapshot_id on studio.experiment_publications
for each row execute function studio.guard_experiment_publication_model_v1();

create trigger article_publication_requires_stable_models
before insert or update of current_content_id on studio.article_publications
for each row execute function studio.guard_article_publication_models_v1();

revoke all on function public.set_model_release_stage_v1(text, text)
  from public, anon, authenticated;
grant execute on function public.set_model_release_stage_v1(text, text)
  to service_role;
revoke all on function public.get_model_release_v3(text) from public;
grant execute on function public.get_model_release_v3(text)
  to anon, authenticated;
revoke all on function public.get_model_release_channel_v3(text) from public;
grant execute on function public.get_model_release_channel_v3(text)
  to anon, authenticated;
revoke all on function public.register_model_surface_release_v1(text, text, text, jsonb, text)
  from public, anon, authenticated;
grant execute on function public.register_model_surface_release_v1(text, text, text, jsonb, text)
  to service_role;
revoke all on function public.set_model_surface_release_stage_v1(text, text)
  from public, anon, authenticated;
grant execute on function public.set_model_surface_release_stage_v1(text, text)
  to service_role;
revoke all on function public.set_model_surface_release_channel_v1(text, text, text)
  from public, anon, authenticated;
grant execute on function public.set_model_surface_release_channel_v1(text, text, text)
  to service_role;
revoke all on function public.register_model_release_succession_v1(text, text, text)
  from public, anon, authenticated;
grant execute on function public.register_model_release_succession_v1(text, text, text)
  to service_role;
revoke all on function public.get_model_surface_release_v1(text) from public;
grant execute on function public.get_model_surface_release_v1(text)
  to anon, authenticated;
revoke all on function public.get_model_surface_release_channel_v1(text, text)
  from public;
grant execute on function public.get_model_surface_release_channel_v1(text, text)
  to anon, authenticated;

commit;
