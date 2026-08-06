begin;

create table studio.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  locale text not null default 'ja',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_display_name check (
    display_name is null
    or (display_name = btrim(display_name) and char_length(display_name) between 1 and 80)
  ),
  constraint profiles_locale check (locale in ('ja', 'en'))
);

create table studio.operation_receipts (
  actor_id uuid not null references auth.users(id) on delete cascade,
  operation_id uuid not null,
  operation_kind text not null,
  request jsonb not null,
  status text not null default 'running',
  result jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  expires_at timestamptz not null default (now() + interval '7 days'),
  primary key (actor_id, operation_id),
  constraint operation_receipts_kind check (
    operation_kind ~ '^[a-z][a-z0-9-]{0,79}$'
  ),
  constraint operation_receipts_request_object check (jsonb_typeof(request) = 'object'),
  constraint operation_receipts_status check (status in ('running', 'committed')),
  constraint operation_receipts_result check (
    (status = 'running' and result is null and completed_at is null)
    or (status = 'committed' and result is not null and completed_at is not null)
  )
);

create table studio.experiment_contents (
  content_id uuid primary key default gen_random_uuid(),
  model_id text not null references studio.model_releases(model_id) on delete restrict,
  content jsonb not null,
  content_size_bytes bigint not null default 0,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (content_id, model_id),
  constraint experiment_contents_object check (
    jsonb_typeof(content) = 'object'
    and content ->> 'modelId' = model_id
    and jsonb_typeof(content -> 'scenarios') = 'array'
    and jsonb_array_length(content -> 'scenarios') between 1 and 4
    and jsonb_typeof(content -> 'surface') = 'object'
  ),
  constraint experiment_contents_size check (content_size_bytes > 0)
);

create table studio.experiments (
  experiment_id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete restrict,
  model_id text not null references studio.model_releases(model_id) on delete restrict,
  title text not null,
  version bigint not null default 0,
  current_content_id uuid not null,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (current_content_id, model_id)
    references studio.experiment_contents(content_id, model_id) on delete restrict,
  constraint experiments_title check (
    title = btrim(title) and char_length(title) between 1 and 240
  ),
  constraint experiments_version check (version >= 0)
);

create table studio.experiment_snapshots (
  snapshot_id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete restrict,
  content_id uuid not null references studio.experiment_contents(content_id) on delete restrict,
  created_at timestamptz not null default now()
);

comment on table studio.experiment_snapshots is
  'Neutral immutable admitted captures. Article/publication purpose, Briefing, settlement, V&V reports, hashes, and runtime status do not belong to this row.';

create table studio.experiment_snapshot_sources (
  snapshot_id uuid primary key
    references studio.experiment_snapshots(snapshot_id) on delete cascade,
  source_experiment_id uuid not null
    references studio.experiments(experiment_id) on delete cascade
);

comment on table studio.experiment_snapshot_sources is
  'Backend-only saved-Experiment provenance used for clean-head publication enforcement. It is not part of portable Snapshot identity.';

create table studio.experiment_snapshot_retention (
  snapshot_id uuid primary key references studio.experiment_snapshots(snapshot_id) on delete cascade,
  retain_until timestamptz,
  updated_at timestamptz not null default now()
);

create table studio.experiment_publications (
  experiment_id uuid primary key references studio.experiments(experiment_id) on delete restrict,
  owner_id uuid not null references auth.users(id) on delete restrict,
  current_snapshot_id uuid not null unique
    references studio.experiment_snapshots(snapshot_id) on delete restrict,
  public_slug text not null unique,
  published_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint experiment_publications_slug check (
    public_slug ~ '^[a-z0-9][a-z0-9-]{2,95}$'
  )
);

create table studio.article_contents (
  article_content_id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete restrict,
  locale text not null,
  title text not null,
  blocks jsonb not null,
  content_size_bytes bigint not null default 0,
  created_at timestamptz not null default now(),
  constraint article_contents_locale check (locale in ('ja', 'en')),
  constraint article_contents_title check (
    title = btrim(title) and char_length(title) between 1 and 240
  ),
  constraint article_contents_blocks check (jsonb_typeof(blocks) = 'array'),
  constraint article_contents_size check (content_size_bytes > 0)
);

create table studio.articles (
  article_id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete restrict,
  version bigint not null default 0,
  current_draft_content_id uuid not null
    references studio.article_contents(article_content_id) on delete restrict,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint articles_version check (version >= 0)
);

create table studio.article_snapshot_refs (
  article_content_id uuid not null
    references studio.article_contents(article_content_id) on delete cascade,
  block_id text not null,
  placement_id text not null,
  snapshot_id uuid not null
    references studio.experiment_snapshots(snapshot_id) on delete restrict,
  ordinal integer not null,
  briefing jsonb not null,
  title_override text,
  caption text,
  primary key (article_content_id, placement_id),
  unique (article_content_id, block_id),
  unique (article_content_id, ordinal),
  constraint article_snapshot_refs_block_id check (
    block_id = btrim(block_id) and char_length(block_id) > 0
  ),
  constraint article_snapshot_refs_placement_id check (
    placement_id = btrim(placement_id) and char_length(placement_id) > 0
  ),
  constraint article_snapshot_refs_ordinal check (ordinal >= 0),
  constraint article_snapshot_refs_briefing check (jsonb_typeof(briefing) = 'object'),
  constraint article_snapshot_refs_title_override check (
    title_override is null
    or (title_override = btrim(title_override) and char_length(title_override) > 0)
  ),
  constraint article_snapshot_refs_caption check (
    caption is null
    or (caption = btrim(caption) and char_length(caption) > 0)
  )
);

comment on table studio.article_snapshot_refs is
  'Relational projection of Article-owned Placement/Briefing data. The referenced ExperimentSnapshot remains neutral and reusable.';

create table studio.article_publications (
  article_id uuid primary key references studio.articles(article_id) on delete restrict,
  owner_id uuid not null references auth.users(id) on delete restrict,
  current_content_id uuid not null unique
    references studio.article_contents(article_content_id) on delete restrict,
  public_slug text not null unique,
  published_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint article_publications_slug check (
    public_slug ~ '^[a-z0-9][a-z0-9-]{2,95}$'
  )
);

create index experiments_owner_updated_idx
  on studio.experiments(owner_id, updated_at desc)
  where deleted_at is null;
create index experiment_snapshots_owner_created_idx
  on studio.experiment_snapshots(owner_id, created_at desc);
create index experiment_snapshots_content_idx
  on studio.experiment_snapshots(content_id);
create index experiment_snapshot_sources_experiment_idx
  on studio.experiment_snapshot_sources(source_experiment_id);
create index experiment_publications_snapshot_idx
  on studio.experiment_publications(current_snapshot_id);
create index articles_owner_updated_idx
  on studio.articles(owner_id, updated_at desc)
  where deleted_at is null;
create index article_snapshot_refs_snapshot_idx
  on studio.article_snapshot_refs(snapshot_id);
create index article_publications_content_idx
  on studio.article_publications(current_content_id);
create index operation_receipts_expiry_idx
  on studio.operation_receipts(expires_at);

create or replace function studio.set_jsonb_size_v1()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_table_name = 'experiment_contents' then
    new.content_size_bytes := octet_length(new.content::text);
  elsif tg_table_name = 'article_contents' then
    new.content_size_bytes := octet_length(new.blocks::text)
      + octet_length(new.title)
      + octet_length(new.locale);
  else
    raise exception 'unsupported JSONB size trigger target %', tg_table_name;
  end if;
  return new;
end;
$$;

create trigger experiment_contents_measure_size
before insert on studio.experiment_contents
for each row execute function studio.set_jsonb_size_v1();
create trigger article_contents_measure_size
before insert on studio.article_contents
for each row execute function studio.set_jsonb_size_v1();

create or replace function studio.reject_immutable_update_v1()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception '% is immutable', tg_table_name using errcode = '55000';
end;
$$;

create trigger experiment_contents_are_immutable
before update on studio.experiment_contents
for each row execute function studio.reject_immutable_update_v1();
create trigger experiment_snapshots_are_immutable
before update on studio.experiment_snapshots
for each row execute function studio.reject_immutable_update_v1();
create trigger article_contents_are_immutable
before update on studio.article_contents
for each row execute function studio.reject_immutable_update_v1();
create trigger article_snapshot_refs_are_immutable
before update on studio.article_snapshot_refs
for each row execute function studio.reject_immutable_update_v1();

create or replace function studio.handle_auth_user_created_v1()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into studio.profiles (user_id, display_name, locale)
  values (
    new.id,
    nullif(btrim(new.raw_user_meta_data ->> 'display_name'), ''),
    case when new.raw_user_meta_data ->> 'locale' = 'en' then 'en' else 'ja' end
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created_create_studio_profile
after insert on auth.users
for each row execute function studio.handle_auth_user_created_v1();

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

create or replace function studio.finish_operation_v1(
  p_actor_id uuid,
  p_operation_id uuid,
  p_result jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  update studio.operation_receipts
  set status = 'committed', result = p_result, completed_at = now()
  where actor_id = p_actor_id
    and operation_id = p_operation_id
    and status = 'running';
  if not found then
    raise exception 'operation receipt is missing or already committed' using errcode = '55000';
  end if;
  return p_result;
end;
$$;

create or replace function studio.snapshot_preserves_authored_content_v1(
  p_saved jsonb,
  p_candidate jsonb
)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  scenario_count integer;
begin
  if p_saved ->> 'modelId' is distinct from p_candidate ->> 'modelId'
    or p_saved -> 'surface' is distinct from p_candidate -> 'surface'
    or jsonb_typeof(p_saved -> 'scenarios') <> 'array'
    or jsonb_typeof(p_candidate -> 'scenarios') <> 'array'
    or jsonb_array_length(p_saved -> 'scenarios')
      <> jsonb_array_length(p_candidate -> 'scenarios')
  then
    return false;
  end if;
  scenario_count := jsonb_array_length(p_saved -> 'scenarios');
  for scenario_index in 0..scenario_count - 1 loop
    if p_saved #>> array['scenarios', scenario_index::text, 'scenarioId']
        is distinct from p_candidate #>> array['scenarios', scenario_index::text, 'scenarioId']
      or p_saved #>> array['scenarios', scenario_index::text, 'label']
        is distinct from p_candidate #>> array['scenarios', scenario_index::text, 'label']
      or p_saved #> array['scenarios', scenario_index::text, 'capture', 'fixture']
        is distinct from p_candidate #> array['scenarios', scenario_index::text, 'capture', 'fixture']
    then
      return false;
    end if;
  end loop;
  return true;
end;
$$;

create or replace function studio.can_read_snapshot_v1(
  p_actor_id uuid,
  p_snapshot_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from studio.experiment_snapshots s
    where s.snapshot_id = p_snapshot_id and s.owner_id = p_actor_id
  ) or exists (
    select 1 from studio.experiment_publications p
    where p.current_snapshot_id = p_snapshot_id
  ) or exists (
    select 1
    from studio.article_snapshot_refs r
    join studio.article_publications p
      on p.current_content_id = r.article_content_id
    where r.snapshot_id = p_snapshot_id
  );
$$;

create or replace function studio.owns_snapshot_v1(
  p_actor_id uuid,
  p_snapshot_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from studio.experiment_snapshots s
    where s.snapshot_id = p_snapshot_id
      and s.owner_id = p_actor_id
  );
$$;

create or replace function studio.project_article_snapshot_refs_v1(
  p_article_content_id uuid,
  p_actor_id uuid,
  p_blocks jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  block_entry record;
  block_value jsonb;
  block_keys text[];
  placement jsonb;
  placement_keys text[];
  ref_snapshot_id uuid;
begin
  if jsonb_typeof(p_blocks) <> 'array' then
    raise exception 'Article blocks must be an array' using errcode = '22023';
  end if;
  for block_entry in
    select value, (ordinality - 1)::integer as ordinal
    from jsonb_array_elements(p_blocks) with ordinality
  loop
    block_value := block_entry.value;
    if jsonb_typeof(block_value) <> 'object' then
      raise exception 'Article block must be an object' using errcode = '22023';
    end if;
    if block_value ->> 'kind' <> 'experiment' then
      continue;
    end if;
    select array_agg(k order by k) into block_keys
    from jsonb_object_keys(block_value) as keys(k);
    if block_keys is distinct from array['blockId', 'kind', 'placement']::text[] then
      raise exception 'Article Experiment block has unexpected fields'
        using errcode = '22023';
    end if;
    placement := block_value -> 'placement';
    if jsonb_typeof(placement) <> 'object' then
      raise exception 'Article Experiment Placement must be an object'
        using errcode = '22023';
    end if;
    select array_agg(k order by k) into placement_keys
    from jsonb_object_keys(placement) as keys(k);
    if placement_keys is distinct from array[
      'briefing',
      'caption',
      'placementId',
      'schemaId',
      'snapshotId',
      'titleOverride'
    ]::text[] then
      raise exception 'Article Experiment Placement has unexpected fields'
        using errcode = '22023';
    end if;
    if placement ->> 'schemaId'
      <> 'circleheart-studio-experiment-placement-v2'
    then
      raise exception 'Article Experiment Placement schema mismatch'
        using errcode = '22023';
    end if;
    ref_snapshot_id := (placement ->> 'snapshotId')::uuid;
    if not studio.owns_snapshot_v1(p_actor_id, ref_snapshot_id) then
      raise exception 'Article Experiment Placement must reference an owned Snapshot'
        using errcode = '42501';
    end if;
    insert into studio.article_snapshot_refs (
      article_content_id,
      block_id,
      placement_id,
      snapshot_id,
      ordinal,
      briefing,
      title_override,
      caption
    ) values (
      p_article_content_id,
      block_value ->> 'blockId',
      placement ->> 'placementId',
      ref_snapshot_id,
      block_entry.ordinal,
      placement -> 'briefing',
      placement ->> 'titleOverride',
      placement ->> 'caption'
    );
  end loop;
end;
$$;

create or replace function public.save_experiment_v1(
  p_operation_id uuid,
  p_experiment_id uuid,
  p_expected_version bigint,
  p_title text,
  p_model_id text,
  p_content jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  request_body jsonb;
  replayed jsonb;
  target_id uuid;
  target_version bigint;
  content_id uuid;
  current_row studio.experiments%rowtype;
  current_content jsonb;
  result_body jsonb;
begin
  if actor is null then raise exception 'authentication required' using errcode = '28000'; end if;
  request_body := jsonb_build_object(
    'experimentId', p_experiment_id,
    'expectedVersion', p_expected_version,
    'title', p_title,
    'modelId', p_model_id,
    'content', p_content
  );
  replayed := studio.begin_operation_v1(actor, p_operation_id, 'save-experiment-v1', request_body);
  if replayed is not null then return replayed; end if;

  if p_experiment_id is null then
    if p_expected_version is not null then
      raise exception 'new Experiment must omit expectedVersion' using errcode = '22023';
    end if;
    target_id := gen_random_uuid();
    target_version := 0;
    insert into studio.experiment_contents (model_id, content, created_by)
    values (p_model_id, p_content, actor)
    returning experiment_contents.content_id into content_id;
    insert into studio.experiments (
      experiment_id, owner_id, model_id, title, version, current_content_id
    ) values (
      target_id, actor, p_model_id, p_title, target_version, content_id
    );
  else
    select e.* into current_row
    from studio.experiments e
    where e.experiment_id = p_experiment_id
    for update;
    if not found or current_row.owner_id <> actor or current_row.deleted_at is not null then
      raise exception 'Experiment not found' using errcode = 'P0002';
    end if;
    if p_expected_version is null or current_row.version <> p_expected_version then
      raise exception 'Experiment version conflict' using errcode = '40001';
    end if;
    if current_row.model_id <> p_model_id then
      raise exception 'Experiment exact model cannot change in place' using errcode = '22023';
    end if;
    select c.content into current_content
    from studio.experiment_contents c
    where c.content_id = current_row.current_content_id;
    if current_content is not distinct from p_content then
      content_id := current_row.current_content_id;
    else
      insert into studio.experiment_contents (model_id, content, created_by)
      values (p_model_id, p_content, actor)
      returning experiment_contents.content_id into content_id;
    end if;
    target_id := current_row.experiment_id;
    target_version := current_row.version + 1;
    update studio.experiments
    set title = p_title,
        version = target_version,
        current_content_id = content_id,
        updated_at = now()
    where experiment_id = target_id;
  end if;

  result_body := jsonb_build_object(
    'experimentId', target_id,
    'version', target_version,
    'title', p_title,
    'modelId', p_model_id,
    'content', p_content
  );
  return studio.finish_operation_v1(actor, p_operation_id, result_body);
end;
$$;

create or replace function public.commit_admitted_experiment_snapshot_v1(
  p_operation_id uuid,
  p_snapshot_id uuid,
  p_model_id text,
  p_content jsonb,
  p_source_experiment_id uuid default null,
  p_expected_experiment_version bigint default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  request_body jsonb;
  replayed jsonb;
  target_snapshot_id uuid := coalesce(p_snapshot_id, gen_random_uuid());
  content_id uuid;
  source_row studio.experiments%rowtype;
  source_content jsonb;
  created_time timestamptz := now();
  result_body jsonb;
begin
  if actor is null then raise exception 'authentication required' using errcode = '28000'; end if;
  if (p_source_experiment_id is null) <> (p_expected_experiment_version is null) then
    raise exception 'source Experiment and expected version must be supplied together'
      using errcode = '22023';
  end if;
  request_body := jsonb_build_object(
    'snapshotId', p_snapshot_id,
    'modelId', p_model_id,
    'content', p_content,
    'sourceExperimentId', p_source_experiment_id,
    'expectedExperimentVersion', p_expected_experiment_version
  );
  replayed := studio.begin_operation_v1(
    actor, p_operation_id, 'commit-admitted-experiment-snapshot-v1', request_body
  );
  if replayed is not null then return replayed; end if;

  if p_source_experiment_id is not null then
    select e.* into source_row
    from studio.experiments e
    where e.experiment_id = p_source_experiment_id
    for update of e;
    if not found or source_row.owner_id <> actor or source_row.deleted_at is not null then
      raise exception 'source Experiment not found' using errcode = 'P0002';
    end if;
    if source_row.version <> p_expected_experiment_version then
      raise exception 'source Experiment version conflict' using errcode = '40001';
    end if;
    select c.content into source_content
    from studio.experiment_contents c
    where c.content_id = source_row.current_content_id;
    if source_row.model_id <> p_model_id
      or not studio.snapshot_preserves_authored_content_v1(source_content, p_content)
    then
      raise exception 'Snapshot candidate is not the clean saved Experiment head'
        using errcode = '22023';
    end if;
  end if;

  if p_source_experiment_id is not null
    and source_content is not distinct from p_content
  then
    content_id := source_row.current_content_id;
  else
    insert into studio.experiment_contents (model_id, content, created_by)
    values (p_model_id, p_content, actor)
    returning experiment_contents.content_id into content_id;
  end if;
  insert into studio.experiment_snapshots (
    snapshot_id, owner_id, content_id, created_at
  ) values (
    target_snapshot_id, actor, content_id, created_time
  );
  if p_source_experiment_id is not null then
    insert into studio.experiment_snapshot_sources (
      snapshot_id, source_experiment_id
    ) values (
      target_snapshot_id, p_source_experiment_id
    );
  end if;
  insert into studio.experiment_snapshot_retention (snapshot_id, retain_until)
  values (target_snapshot_id, created_time + interval '1 hour');

  result_body := jsonb_build_object(
    'schemaId', 'circleheart-studio-experiment-snapshot-v2',
    'snapshotId', target_snapshot_id,
    'content', p_content,
    'createdAt', to_char(created_time at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
  );
  return studio.finish_operation_v1(actor, p_operation_id, result_body);
end;
$$;

create or replace function public.publish_experiment_v1(
  p_operation_id uuid,
  p_experiment_id uuid,
  p_expected_version bigint,
  p_snapshot_id uuid,
  p_public_slug text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  request_body jsonb;
  replayed jsonb;
  experiment_row studio.experiments%rowtype;
  snapshot_row studio.experiment_snapshots%rowtype;
  previous_snapshot_id uuid;
  result_body jsonb;
begin
  if actor is null then raise exception 'authentication required' using errcode = '28000'; end if;
  if coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) then
    raise exception 'link an email or Google account before publishing' using errcode = '42501';
  end if;
  request_body := jsonb_build_object(
    'experimentId', p_experiment_id,
    'expectedVersion', p_expected_version,
    'snapshotId', p_snapshot_id,
    'publicSlug', p_public_slug
  );
  replayed := studio.begin_operation_v1(actor, p_operation_id, 'publish-experiment-v1', request_body);
  if replayed is not null then return replayed; end if;

  select * into experiment_row from studio.experiments
  where experiment_id = p_experiment_id for update;
  if not found or experiment_row.owner_id <> actor or experiment_row.deleted_at is not null then
    raise exception 'Experiment not found' using errcode = 'P0002';
  end if;
  if experiment_row.version <> p_expected_version then
    raise exception 'Experiment version conflict' using errcode = '40001';
  end if;
  select * into snapshot_row from studio.experiment_snapshots
  where snapshot_id = p_snapshot_id;
  if not found or snapshot_row.owner_id <> actor or not exists (
    select 1 from studio.experiment_snapshot_sources source
    where source.snapshot_id = p_snapshot_id
      and source.source_experiment_id = p_experiment_id
  ) then
    raise exception 'Snapshot is not an admitted capture of this Experiment'
      using errcode = '22023';
  end if;

  select p.current_snapshot_id into previous_snapshot_id
  from studio.experiment_publications p
  where p.experiment_id = p_experiment_id
  for update;

  insert into studio.experiment_publications (
    experiment_id, owner_id, current_snapshot_id, public_slug
  ) values (
    p_experiment_id, actor, p_snapshot_id, p_public_slug
  ) on conflict (experiment_id) do update
    set current_snapshot_id = excluded.current_snapshot_id,
        public_slug = excluded.public_slug,
        updated_at = now();
  update studio.experiment_snapshot_retention
  set retain_until = null, updated_at = now()
  where snapshot_id = p_snapshot_id;
  if previous_snapshot_id is not null
    and previous_snapshot_id <> p_snapshot_id
  then
    update studio.experiment_snapshot_retention
    set retain_until = now() + interval '1 hour', updated_at = now()
    where snapshot_id = previous_snapshot_id;
  end if;

  result_body := jsonb_build_object(
    'experimentId', p_experiment_id,
    'snapshotId', p_snapshot_id,
    'publicSlug', p_public_slug
  );
  return studio.finish_operation_v1(actor, p_operation_id, result_body);
end;
$$;

create or replace function public.save_article_v1(
  p_operation_id uuid,
  p_article_id uuid,
  p_expected_version bigint,
  p_locale text,
  p_title text,
  p_blocks jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  request_body jsonb;
  replayed jsonb;
  target_article_id uuid;
  target_version bigint;
  content_id uuid;
  current_row studio.articles%rowtype;
  result_body jsonb;
begin
  if actor is null then raise exception 'authentication required' using errcode = '28000'; end if;
  request_body := jsonb_build_object(
    'articleId', p_article_id,
    'expectedVersion', p_expected_version,
    'locale', p_locale,
    'title', p_title,
    'blocks', p_blocks
  );
  replayed := studio.begin_operation_v1(actor, p_operation_id, 'save-article-v1', request_body);
  if replayed is not null then return replayed; end if;

  insert into studio.article_contents (owner_id, locale, title, blocks)
  values (actor, p_locale, p_title, p_blocks)
  returning article_content_id into content_id;
  perform studio.project_article_snapshot_refs_v1(content_id, actor, p_blocks);

  if p_article_id is null then
    if p_expected_version is not null then
      raise exception 'new Article must omit expectedVersion' using errcode = '22023';
    end if;
    target_article_id := gen_random_uuid();
    target_version := 0;
    insert into studio.articles (
      article_id, owner_id, version, current_draft_content_id
    ) values (
      target_article_id, actor, target_version, content_id
    );
  else
    select * into current_row from studio.articles
    where article_id = p_article_id for update;
    if not found or current_row.owner_id <> actor or current_row.deleted_at is not null then
      raise exception 'Article not found' using errcode = 'P0002';
    end if;
    if p_expected_version is null or current_row.version <> p_expected_version then
      raise exception 'Article version conflict' using errcode = '40001';
    end if;
    target_article_id := current_row.article_id;
    target_version := current_row.version + 1;
    update studio.articles
    set version = target_version,
        current_draft_content_id = content_id,
        updated_at = now()
    where article_id = target_article_id;
  end if;

  result_body := jsonb_build_object(
    'articleId', target_article_id,
    'version', target_version,
    'locale', p_locale,
    'title', p_title,
    'blocks', p_blocks
  );
  return studio.finish_operation_v1(actor, p_operation_id, result_body);
end;
$$;

create or replace function public.publish_article_v1(
  p_operation_id uuid,
  p_article_id uuid,
  p_expected_version bigint,
  p_public_slug text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  request_body jsonb;
  replayed jsonb;
  article_row studio.articles%rowtype;
  result_body jsonb;
begin
  if actor is null then raise exception 'authentication required' using errcode = '28000'; end if;
  if coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) then
    raise exception 'link an email or Google account before publishing' using errcode = '42501';
  end if;
  request_body := jsonb_build_object(
    'articleId', p_article_id,
    'expectedVersion', p_expected_version,
    'publicSlug', p_public_slug
  );
  replayed := studio.begin_operation_v1(actor, p_operation_id, 'publish-article-v1', request_body);
  if replayed is not null then return replayed; end if;
  select * into article_row from studio.articles
  where article_id = p_article_id for update;
  if not found or article_row.owner_id <> actor or article_row.deleted_at is not null then
    raise exception 'Article not found' using errcode = 'P0002';
  end if;
  if article_row.version <> p_expected_version then
    raise exception 'Article version conflict' using errcode = '40001';
  end if;
  insert into studio.article_publications (
    article_id, owner_id, current_content_id, public_slug
  ) values (
    p_article_id, actor, article_row.current_draft_content_id, p_public_slug
  ) on conflict (article_id) do update
    set current_content_id = excluded.current_content_id,
        public_slug = excluded.public_slug,
        updated_at = now();
  result_body := jsonb_build_object(
    'articleId', p_article_id,
    'articleContentId', article_row.current_draft_content_id,
    'publicSlug', p_public_slug
  );
  return studio.finish_operation_v1(actor, p_operation_id, result_body);
end;
$$;

create or replace function public.unpublish_experiment_v1(
  p_operation_id uuid,
  p_experiment_id uuid,
  p_expected_version bigint
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  request_body jsonb;
  replayed jsonb;
  experiment_row studio.experiments%rowtype;
  released_snapshot_id uuid;
  result_body jsonb;
begin
  if actor is null then raise exception 'authentication required' using errcode = '28000'; end if;
  request_body := jsonb_build_object(
    'experimentId', p_experiment_id,
    'expectedVersion', p_expected_version
  );
  replayed := studio.begin_operation_v1(actor, p_operation_id, 'unpublish-experiment-v1', request_body);
  if replayed is not null then return replayed; end if;

  select * into experiment_row from studio.experiments
  where experiment_id = p_experiment_id for update;
  if not found or experiment_row.owner_id <> actor or experiment_row.deleted_at is not null then
    raise exception 'Experiment not found' using errcode = 'P0002';
  end if;
  if experiment_row.version <> p_expected_version then
    raise exception 'Experiment version conflict' using errcode = '40001';
  end if;
  delete from studio.experiment_publications
  where experiment_id = p_experiment_id and owner_id = actor
  returning current_snapshot_id into released_snapshot_id;
  if released_snapshot_id is not null then
    update studio.experiment_snapshot_retention
    set retain_until = now() + interval '1 hour', updated_at = now()
    where snapshot_id = released_snapshot_id;
  end if;
  result_body := jsonb_build_object(
    'experimentId', p_experiment_id,
    'published', false
  );
  return studio.finish_operation_v1(actor, p_operation_id, result_body);
end;
$$;

create or replace function public.unpublish_article_v1(
  p_operation_id uuid,
  p_article_id uuid,
  p_expected_version bigint
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  request_body jsonb;
  replayed jsonb;
  article_row studio.articles%rowtype;
  result_body jsonb;
begin
  if actor is null then raise exception 'authentication required' using errcode = '28000'; end if;
  request_body := jsonb_build_object(
    'articleId', p_article_id,
    'expectedVersion', p_expected_version
  );
  replayed := studio.begin_operation_v1(actor, p_operation_id, 'unpublish-article-v1', request_body);
  if replayed is not null then return replayed; end if;

  select * into article_row from studio.articles
  where article_id = p_article_id for update;
  if not found or article_row.owner_id <> actor or article_row.deleted_at is not null then
    raise exception 'Article not found' using errcode = 'P0002';
  end if;
  if article_row.version <> p_expected_version then
    raise exception 'Article version conflict' using errcode = '40001';
  end if;
  delete from studio.article_publications
  where article_id = p_article_id and owner_id = actor;
  result_body := jsonb_build_object(
    'articleId', p_article_id,
    'published', false
  );
  return studio.finish_operation_v1(actor, p_operation_id, result_body);
end;
$$;

create or replace function public.delete_experiment_v1(
  p_operation_id uuid,
  p_experiment_id uuid,
  p_expected_version bigint
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  request_body jsonb;
  replayed jsonb;
  experiment_row studio.experiments%rowtype;
  released_snapshot_id uuid;
  deleted_time timestamptz := now();
  result_body jsonb;
begin
  if actor is null then raise exception 'authentication required' using errcode = '28000'; end if;
  request_body := jsonb_build_object(
    'experimentId', p_experiment_id,
    'expectedVersion', p_expected_version
  );
  replayed := studio.begin_operation_v1(actor, p_operation_id, 'delete-experiment-v1', request_body);
  if replayed is not null then return replayed; end if;

  select * into experiment_row from studio.experiments
  where experiment_id = p_experiment_id for update;
  if not found or experiment_row.owner_id <> actor or experiment_row.deleted_at is not null then
    raise exception 'Experiment not found' using errcode = 'P0002';
  end if;
  if experiment_row.version <> p_expected_version then
    raise exception 'Experiment version conflict' using errcode = '40001';
  end if;
  delete from studio.experiment_publications
  where experiment_id = p_experiment_id and owner_id = actor
  returning current_snapshot_id into released_snapshot_id;
  if released_snapshot_id is not null then
    update studio.experiment_snapshot_retention
    set retain_until = deleted_time + interval '1 hour', updated_at = deleted_time
    where snapshot_id = released_snapshot_id;
  end if;
  update studio.experiments
  set deleted_at = deleted_time,
      version = version + 1,
      updated_at = deleted_time
  where experiment_id = p_experiment_id;
  result_body := jsonb_build_object(
    'experimentId', p_experiment_id,
    'version', experiment_row.version + 1,
    'deletedAt', to_char(deleted_time at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
  );
  return studio.finish_operation_v1(actor, p_operation_id, result_body);
end;
$$;

create or replace function public.delete_article_v1(
  p_operation_id uuid,
  p_article_id uuid,
  p_expected_version bigint
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  request_body jsonb;
  replayed jsonb;
  article_row studio.articles%rowtype;
  deleted_time timestamptz := now();
  result_body jsonb;
begin
  if actor is null then raise exception 'authentication required' using errcode = '28000'; end if;
  request_body := jsonb_build_object(
    'articleId', p_article_id,
    'expectedVersion', p_expected_version
  );
  replayed := studio.begin_operation_v1(actor, p_operation_id, 'delete-article-v1', request_body);
  if replayed is not null then return replayed; end if;

  select * into article_row from studio.articles
  where article_id = p_article_id for update;
  if not found or article_row.owner_id <> actor or article_row.deleted_at is not null then
    raise exception 'Article not found' using errcode = 'P0002';
  end if;
  if article_row.version <> p_expected_version then
    raise exception 'Article version conflict' using errcode = '40001';
  end if;
  delete from studio.article_publications
  where article_id = p_article_id and owner_id = actor;
  update studio.articles
  set deleted_at = deleted_time,
      version = version + 1,
      updated_at = deleted_time
  where article_id = p_article_id;
  result_body := jsonb_build_object(
    'articleId', p_article_id,
    'version', article_row.version + 1,
    'deletedAt', to_char(deleted_time at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
  );
  return studio.finish_operation_v1(actor, p_operation_id, result_body);
end;
$$;

create or replace function public.read_public_experiment_v1(p_public_slug text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'experimentId', p.experiment_id,
    'title', e.title,
    'snapshot', jsonb_build_object(
      'schemaId', 'circleheart-studio-experiment-snapshot-v2',
      'snapshotId', s.snapshot_id,
      'content', c.content,
      'createdAt', to_char(s.created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
    )
  )
  from studio.experiment_publications p
  join studio.experiments e on e.experiment_id = p.experiment_id
  join studio.experiment_snapshots s on s.snapshot_id = p.current_snapshot_id
  join studio.experiment_contents c on c.content_id = s.content_id
  where p.public_slug = p_public_slug;
$$;

create or replace function public.read_experiment_snapshot_v1(p_snapshot_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'schemaId', 'circleheart-studio-experiment-snapshot-v2',
    'snapshotId', s.snapshot_id,
    'content', c.content,
    'createdAt', to_char(s.created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
  )
  from studio.experiment_snapshots s
  join studio.experiment_contents c on c.content_id = s.content_id
  where s.snapshot_id = p_snapshot_id
    and studio.can_read_snapshot_v1(auth.uid(), s.snapshot_id);
$$;

create or replace function public.read_public_article_v1(p_public_slug text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'articleId', p.article_id,
    'locale', c.locale,
    'title', c.title,
    'blocks', c.blocks
  )
  from studio.article_publications p
  join studio.article_contents c on c.article_content_id = p.current_content_id
  where p.public_slug = p_public_slug;
$$;

create or replace function studio.gc_unreferenced_content_v1(p_limit integer default 500)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  deleted_experiments integer;
  deleted_articles integer;
  deleted_snapshots integer;
  deleted_experiment_contents integer;
  deleted_article_contents integer;
  deleted_operations integer;
begin
  if p_limit < 1 or p_limit > 5000 then
    raise exception 'GC limit must be within [1, 5000]' using errcode = '22023';
  end if;
  with candidates as (
    select e.experiment_id
    from studio.experiments e
    where e.deleted_at < now() - interval '1 hour'
      and not exists (
        select 1 from studio.experiment_publications p
        where p.experiment_id = e.experiment_id
      )
    order by e.deleted_at
    limit p_limit
  )
  delete from studio.experiments e
  using candidates c
  where e.experiment_id = c.experiment_id;
  get diagnostics deleted_experiments = row_count;

  with candidates as (
    select a.article_id
    from studio.articles a
    where a.deleted_at < now() - interval '1 hour'
      and not exists (
        select 1 from studio.article_publications p
        where p.article_id = a.article_id
      )
    order by a.deleted_at
    limit p_limit
  )
  delete from studio.articles a
  using candidates c
  where a.article_id = c.article_id;
  get diagnostics deleted_articles = row_count;

  with candidates as (
    select s.snapshot_id
    from studio.experiment_snapshots s
    join studio.experiment_snapshot_retention r on r.snapshot_id = s.snapshot_id
    where r.retain_until < now()
      and not exists (
        select 1 from studio.experiment_publications p
        where p.current_snapshot_id = s.snapshot_id
      )
      and not exists (
        select 1 from studio.article_snapshot_refs a
        where a.snapshot_id = s.snapshot_id
      )
    order by r.retain_until
    limit p_limit
  )
  delete from studio.experiment_snapshots s
  using candidates c
  where s.snapshot_id = c.snapshot_id;
  get diagnostics deleted_snapshots = row_count;

  with candidates as (
    select c.content_id
    from studio.experiment_contents c
    where c.created_at < now() - interval '1 hour'
      and not exists (
        select 1 from studio.experiments e where e.current_content_id = c.content_id
      )
      and not exists (
        select 1 from studio.experiment_snapshots s where s.content_id = c.content_id
      )
    order by c.created_at
    limit p_limit
  )
  delete from studio.experiment_contents c
  using candidates x where c.content_id = x.content_id;
  get diagnostics deleted_experiment_contents = row_count;

  with candidates as (
    select c.article_content_id
    from studio.article_contents c
    where c.created_at < now() - interval '1 hour'
      and not exists (
        select 1 from studio.articles a where a.current_draft_content_id = c.article_content_id
      )
      and not exists (
        select 1 from studio.article_publications p where p.current_content_id = c.article_content_id
      )
    order by c.created_at
    limit p_limit
  )
  delete from studio.article_contents c
  using candidates x where c.article_content_id = x.article_content_id;
  get diagnostics deleted_article_contents = row_count;

  delete from studio.operation_receipts
  where ctid in (
    select ctid from studio.operation_receipts
    where expires_at < now()
    order by expires_at
    limit p_limit
  );
  get diagnostics deleted_operations = row_count;

  return jsonb_build_object(
    'experiments', deleted_experiments,
    'articles', deleted_articles,
    'snapshots', deleted_snapshots,
    'experimentContents', deleted_experiment_contents,
    'articleContents', deleted_article_contents,
    'operationReceipts', deleted_operations
  );
end;
$$;

alter table studio.profiles enable row level security;
alter table studio.operation_receipts enable row level security;
alter table studio.experiment_contents enable row level security;
alter table studio.experiments enable row level security;
alter table studio.experiment_snapshots enable row level security;
alter table studio.experiment_snapshot_sources enable row level security;
alter table studio.experiment_snapshot_retention enable row level security;
alter table studio.experiment_publications enable row level security;
alter table studio.article_contents enable row level security;
alter table studio.articles enable row level security;
alter table studio.article_snapshot_refs enable row level security;
alter table studio.article_publications enable row level security;

revoke all on all tables in schema studio from public, anon, authenticated;
grant all on all tables in schema studio to service_role;

revoke all on function studio.begin_operation_v1(uuid, uuid, text, jsonb) from public, anon, authenticated;
revoke all on function studio.finish_operation_v1(uuid, uuid, jsonb) from public, anon, authenticated;
revoke all on function studio.can_read_snapshot_v1(uuid, uuid) from public, anon, authenticated;
revoke all on function studio.owns_snapshot_v1(uuid, uuid) from public, anon, authenticated;
revoke all on function studio.project_article_snapshot_refs_v1(uuid, uuid, jsonb) from public, anon, authenticated;
revoke all on function studio.gc_unreferenced_content_v1(integer) from public, anon, authenticated;
grant execute on function studio.gc_unreferenced_content_v1(integer) to service_role;

revoke all on function public.save_experiment_v1(uuid, uuid, bigint, text, text, jsonb) from public;
grant execute on function public.save_experiment_v1(uuid, uuid, bigint, text, text, jsonb) to authenticated;
revoke all on function public.commit_admitted_experiment_snapshot_v1(uuid, uuid, text, jsonb, uuid, bigint) from public;
grant execute on function public.commit_admitted_experiment_snapshot_v1(uuid, uuid, text, jsonb, uuid, bigint) to authenticated;
revoke all on function public.publish_experiment_v1(uuid, uuid, bigint, uuid, text) from public;
grant execute on function public.publish_experiment_v1(uuid, uuid, bigint, uuid, text) to authenticated;
revoke all on function public.save_article_v1(uuid, uuid, bigint, text, text, jsonb) from public;
grant execute on function public.save_article_v1(uuid, uuid, bigint, text, text, jsonb) to authenticated;
revoke all on function public.publish_article_v1(uuid, uuid, bigint, text) from public;
grant execute on function public.publish_article_v1(uuid, uuid, bigint, text) to authenticated;
revoke all on function public.unpublish_experiment_v1(uuid, uuid, bigint) from public;
grant execute on function public.unpublish_experiment_v1(uuid, uuid, bigint) to authenticated;
revoke all on function public.unpublish_article_v1(uuid, uuid, bigint) from public;
grant execute on function public.unpublish_article_v1(uuid, uuid, bigint) to authenticated;
revoke all on function public.delete_experiment_v1(uuid, uuid, bigint) from public;
grant execute on function public.delete_experiment_v1(uuid, uuid, bigint) to authenticated;
revoke all on function public.delete_article_v1(uuid, uuid, bigint) from public;
grant execute on function public.delete_article_v1(uuid, uuid, bigint) to authenticated;
revoke all on function public.read_public_experiment_v1(text) from public;
grant execute on function public.read_public_experiment_v1(text) to anon, authenticated;
revoke all on function public.read_experiment_snapshot_v1(uuid) from public;
grant execute on function public.read_experiment_snapshot_v1(uuid) to anon, authenticated;
revoke all on function public.read_public_article_v1(text) from public;
grant execute on function public.read_public_article_v1(text) to anon, authenticated;

commit;
