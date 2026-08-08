begin;

alter table studio.experiment_contents
  add column surface_series_id text;

alter table studio.experiment_contents
  add constraint experiment_contents_surface_series_pin check (
    (content ? 'surfaceSeriesId') = (surface_series_id is not null)
    and content ->> 'surfaceSeriesId' is not distinct from surface_series_id
  );

alter table studio.experiment_snapshots
  add column surface_release_id text
    references studio.model_surface_releases(surface_release_id) on delete restrict;

comment on column studio.experiment_contents.surface_series_id is
  'Mutable Experiment presentation lineage. Historical V2 compatibility rows may be null; Standard-ABI content must pin a Surface series.';

comment on column studio.experiment_snapshots.surface_release_id is
  'Exact immutable presentation contract captured with a Standard-ABI Snapshot. Historical V2 compatibility rows may be null.';

create or replace function studio.guard_snapshot_surface_pin_v1()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  content_series_id text;
  content_model_family_id text;
  release_series_id text;
  release_model_family_id text;
begin
  select content.surface_series_id, model.model_family_id
  into content_series_id, content_model_family_id
  from studio.experiment_contents as content
  join studio.model_releases as model on model.model_id = content.model_id
  where content.content_id = new.content_id;
  if not found then
    raise exception 'Snapshot content is unavailable' using errcode = '23503';
  end if;
  if (content_series_id is null) <> (new.surface_release_id is null) then
    raise exception 'Snapshot Surface series and release pins must be supplied together'
      using errcode = '22023';
  end if;
  if content_series_id is null then return new; end if;
  select release.surface_series_id, release.model_family_id
  into release_series_id, release_model_family_id
  from studio.model_surface_releases as release
  where release.surface_release_id = new.surface_release_id;
  if not found then
    raise exception 'Snapshot Surface release is unavailable' using errcode = '23503';
  end if;
  if release_series_id <> content_series_id
    or release_model_family_id <> content_model_family_id
  then
    raise exception 'Snapshot Surface release is incompatible with its content'
      using errcode = '22023';
  end if;
  return new;
end;
$$;

create trigger experiment_snapshot_surface_pin_is_compatible
before insert or update of content_id, surface_release_id
on studio.experiment_snapshots
for each row execute function studio.guard_snapshot_surface_pin_v1();

create or replace function public.get_model_surface_series_latest_v1(
  p_surface_series_id text
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
  where release.surface_series_id = p_surface_series_id
    and availability.stage <> 'retired'
  order by release.registered_at desc, release.surface_release_id desc
  limit 1;
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
  surface_series_id text := p_content ->> 'surfaceSeriesId';
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
    insert into studio.experiment_contents (
      model_id, surface_series_id, content, created_by
    ) values (
      p_model_id, surface_series_id, p_content, actor
    ) returning experiment_contents.content_id into content_id;
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
    if current_content ->> 'surfaceSeriesId' is distinct from surface_series_id then
      raise exception 'Experiment Surface series cannot change in place' using errcode = '22023';
    end if;
    if current_content is not distinct from p_content then
      content_id := current_row.current_content_id;
    else
      insert into studio.experiment_contents (
        model_id, surface_series_id, content, created_by
      ) values (
        p_model_id, surface_series_id, p_content, actor
      ) returning experiment_contents.content_id into content_id;
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

drop function public.commit_admitted_experiment_snapshot_v1(
  uuid, uuid, text, jsonb, uuid, bigint
);

create function public.commit_admitted_experiment_snapshot_v1(
  p_operation_id uuid,
  p_snapshot_id uuid,
  p_model_id text,
  p_content jsonb,
  p_surface_release_id text,
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
  surface_series_id text := p_content ->> 'surfaceSeriesId';
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
  if (surface_series_id is null) <> (p_surface_release_id is null) then
    raise exception 'Snapshot Surface series and release pins must be supplied together'
      using errcode = '22023';
  end if;
  request_body := jsonb_build_object(
    'snapshotId', p_snapshot_id,
    'modelId', p_model_id,
    'content', p_content,
    'surfaceReleaseId', p_surface_release_id,
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
    insert into studio.experiment_contents (
      model_id, surface_series_id, content, created_by
    ) values (
      p_model_id, surface_series_id, p_content, actor
    ) returning experiment_contents.content_id into content_id;
  end if;
  insert into studio.experiment_snapshots (
    snapshot_id, owner_id, content_id, surface_release_id, created_at
  ) values (
    target_snapshot_id, actor, content_id, p_surface_release_id, created_time
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
  ) || case when p_surface_release_id is null then '{}'::jsonb else
    jsonb_build_object('surfaceReleaseId', p_surface_release_id) end;
  return studio.finish_operation_v1(actor, p_operation_id, result_body);
end;
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
    'snapshotId', snapshot.snapshot_id,
    'content', content.content,
    'createdAt', to_char(snapshot.created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
  ) || case when snapshot.surface_release_id is null then '{}'::jsonb else
    jsonb_build_object('surfaceReleaseId', snapshot.surface_release_id) end
  from studio.experiment_snapshots as snapshot
  join studio.experiment_contents as content
    on content.content_id = snapshot.content_id
  where snapshot.snapshot_id = p_snapshot_id
    and studio.can_read_snapshot_v1(auth.uid(), snapshot.snapshot_id);
$$;

create or replace function public.read_public_experiment_v1(p_public_slug text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'experimentId', publication.experiment_id,
    'title', experiment.title,
    'snapshot', jsonb_build_object(
      'schemaId', 'circleheart-studio-experiment-snapshot-v2',
      'snapshotId', snapshot.snapshot_id,
      'content', content.content,
      'createdAt', to_char(snapshot.created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
    ) || case when snapshot.surface_release_id is null then '{}'::jsonb else
      jsonb_build_object('surfaceReleaseId', snapshot.surface_release_id) end
  )
  from studio.experiment_publications as publication
  join studio.experiments as experiment
    on experiment.experiment_id = publication.experiment_id
  join studio.experiment_snapshots as snapshot
    on snapshot.snapshot_id = publication.current_snapshot_id
  join studio.experiment_contents as content
    on content.content_id = snapshot.content_id
  where publication.public_slug = p_public_slug;
$$;

create or replace function public.list_my_experiment_summaries_v1(
  p_limit integer default 50,
  p_before_updated_at timestamptz default null,
  p_before_id uuid default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  result_body jsonb;
begin
  if actor is null then raise exception 'authentication required' using errcode = '28000'; end if;
  if p_limit < 1 or p_limit > 100 then
    raise exception 'List page limit must be within [1, 100]' using errcode = '22023';
  end if;
  if (p_before_updated_at is null) <> (p_before_id is null) then
    raise exception 'List cursor timestamp and ID must be supplied together' using errcode = '22023';
  end if;
  with page as materialized (
    select experiment.experiment_id, experiment.version, experiment.model_id,
      content.surface_series_id, experiment.title, experiment.created_at,
      experiment.updated_at,
      jsonb_array_length(content.content -> 'scenarios') as scenario_count,
      publication.current_snapshot_id as published_snapshot_id,
      publication.public_slug
    from studio.experiments as experiment
    join studio.experiment_contents as content
      on content.content_id = experiment.current_content_id
    left join studio.experiment_publications as publication
      on publication.experiment_id = experiment.experiment_id
    where experiment.owner_id = actor and experiment.deleted_at is null
      and (p_before_updated_at is null or
        (experiment.updated_at, experiment.experiment_id)
          < (p_before_updated_at, p_before_id))
    order by experiment.updated_at desc, experiment.experiment_id desc
    limit p_limit
  )
  select jsonb_build_object(
    'items', coalesce(jsonb_agg((jsonb_build_object(
      'experimentId', experiment_id,
      'version', version,
      'modelId', model_id,
      'title', title,
      'scenarioCount', scenario_count,
      'createdAt', to_char(created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
      'updatedAt', to_char(updated_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
      'publishedSnapshotId', published_snapshot_id,
      'publicSlug', public_slug
    ) || case when surface_series_id is null then '{}'::jsonb else
      jsonb_build_object('surfaceSeriesId', surface_series_id) end)
      order by updated_at desc, experiment_id desc), '[]'::jsonb),
    'nextCursor', case when count(*) = p_limit then (
      select jsonb_build_object(
        'timestamp', to_char(last_page.updated_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
        'id', last_page.experiment_id
      ) from page as last_page
      order by last_page.updated_at asc, last_page.experiment_id asc limit 1
    ) else null end
  ) into result_body from page;
  return result_body;
end;
$$;

create or replace function public.list_my_snapshot_summaries_v1(
  p_limit integer default 50,
  p_before_created_at timestamptz default null,
  p_before_id uuid default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  result_body jsonb;
begin
  if actor is null then raise exception 'authentication required' using errcode = '28000'; end if;
  if p_limit < 1 or p_limit > 100 then
    raise exception 'List page limit must be within [1, 100]' using errcode = '22023';
  end if;
  if (p_before_created_at is null) <> (p_before_id is null) then
    raise exception 'List cursor timestamp and ID must be supplied together' using errcode = '22023';
  end if;
  with page as materialized (
    select snapshot.snapshot_id, content.model_id, content.surface_series_id,
      snapshot.surface_release_id, snapshot.created_at,
      coalesce(nullif(experiment.title, ''),
        nullif(content.content #>> '{scenarios,0,label}', ''), 'Untitled') as title,
      jsonb_array_length(content.content -> 'scenarios') as scenario_count,
      jsonb_array_length(content.content #> '{surface,graphPanes}')
        + jsonb_array_length(content.content #> '{surface,outputPanes}')
        + jsonb_array_length(content.content #> '{surface,controlPanes}') as pane_count
    from studio.experiment_snapshots as snapshot
    join studio.experiment_contents as content on content.content_id = snapshot.content_id
    left join studio.experiment_snapshot_sources as source
      on source.snapshot_id = snapshot.snapshot_id
    left join studio.experiments as experiment
      on experiment.experiment_id = source.source_experiment_id
    where snapshot.owner_id = actor
      and (p_before_created_at is null or
        (snapshot.created_at, snapshot.snapshot_id)
          < (p_before_created_at, p_before_id))
    order by snapshot.created_at desc, snapshot.snapshot_id desc
    limit p_limit
  )
  select jsonb_build_object(
    'items', coalesce(jsonb_agg((jsonb_build_object(
      'snapshotId', snapshot_id,
      'modelId', model_id,
      'title', title,
      'scenarioCount', scenario_count,
      'paneCount', pane_count,
      'createdAt', to_char(created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"')
    ) || case when surface_series_id is null then '{}'::jsonb else
      jsonb_build_object('surfaceSeriesId', surface_series_id) end
      || case when surface_release_id is null then '{}'::jsonb else
      jsonb_build_object('surfaceReleaseId', surface_release_id) end)
      order by created_at desc, snapshot_id desc), '[]'::jsonb),
    'nextCursor', case when count(*) = p_limit then (
      select jsonb_build_object(
        'timestamp', to_char(last_page.created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
        'id', last_page.snapshot_id
      ) from page as last_page
      order by last_page.created_at asc, last_page.snapshot_id asc limit 1
    ) else null end
  ) into result_body from page;
  return result_body;
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
  model_stage text;
  model_loadable boolean;
  surface_stage text;
begin
  select model_availability.stage, model_availability.loadable,
    surface_availability.stage
  into model_stage, model_loadable, surface_stage
  from studio.experiment_snapshots as snapshot
  join studio.experiment_contents as content
    on content.content_id = snapshot.content_id
  join studio.model_release_availability as model_availability
    on model_availability.model_id = content.model_id
  left join studio.model_surface_release_availability as surface_availability
    on surface_availability.surface_release_id = snapshot.surface_release_id
  where snapshot.snapshot_id = p_snapshot_id;
  if model_stage is null then
    raise exception 'Snapshot model release is unavailable' using errcode = '23503';
  end if;
  if not model_loadable then
    raise exception 'Snapshot model release is disabled' using errcode = '22023';
  end if;
  if model_stage <> 'stable' then
    raise exception 'Only stable model releases may be published (found %)', model_stage
      using errcode = '22023';
  end if;
  if surface_stage is null then
    raise exception 'Snapshot Surface release is unavailable' using errcode = '23503';
  end if;
  if surface_stage <> 'stable' then
    raise exception 'Only stable Surface releases may be published (found %)', surface_stage
      using errcode = '22023';
  end if;
end;
$$;

revoke all on function public.get_model_surface_series_latest_v1(text) from public;
grant execute on function public.get_model_surface_series_latest_v1(text)
  to anon, authenticated;
revoke all on function public.commit_admitted_experiment_snapshot_v1(
  uuid, uuid, text, jsonb, text, uuid, bigint
) from public;
grant execute on function public.commit_admitted_experiment_snapshot_v1(
  uuid, uuid, text, jsonb, text, uuid, bigint
) to authenticated;

commit;
