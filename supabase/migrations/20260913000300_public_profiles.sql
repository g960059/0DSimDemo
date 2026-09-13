-- Public attribution is mutable profile data; official status is administrative.
alter table studio.profiles add column version bigint not null default 0 check(version >= 0);
alter table studio.profiles add column is_official boolean not null default false;
create function studio.valid_display_name_v1(value text) returns boolean
language sql immutable set search_path='' as $$
 select value is not null and value = btrim(value, U&'\0009\000A\000B\000C\000D\0020\00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF')
   and char_length(value) + char_length(regexp_replace(value,U&'[^\+010000-\+10FFFF]','','g')) between 1 and 80
   and value !~ U&'[\0001-\001F\007F-\009F\200B-\200F\202A-\202E\2060-\206F\FEFF]';
$$;
revoke all on function studio.valid_display_name_v1(text) from public;
create function studio.public_author_v1(actor uuid) returns jsonb
language sql stable set search_path='' as $$
 select jsonb_build_object('userId',user_id,
   'displayName',case when studio.valid_display_name_v1(display_name) then display_name end,
   'official',is_official) from studio.profiles where user_id=actor;
$$;
revoke all on function studio.public_author_v1(uuid) from public;
create function public.read_my_profile_v1() returns jsonb
language sql stable security definer set search_path='' as $$
 select studio.public_author_v1(user_id) || jsonb_build_object('version',version)
 from studio.profiles where user_id=auth.uid() and not coalesce((auth.jwt()->>'is_anonymous')::boolean,false);
$$;
create function public.save_my_profile_v1(p_operation_id uuid,p_expected_user_id uuid,p_expected_version bigint,p_display_name text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); replayed jsonb; current_version bigint;
begin
 if actor is null or coalesce((auth.jwt()->>'is_anonymous')::boolean,false) then raise exception 'Account required' using errcode='42501'; end if;
 if actor is distinct from p_expected_user_id then raise exception 'Profile account changed' using errcode='42501'; end if;
 replayed:=studio.begin_operation_v1(actor,p_operation_id,'save-profile-v1',jsonb_build_object('expectedUserId',p_expected_user_id,'expectedVersion',p_expected_version,'displayName',p_display_name));
 if replayed is not null then return replayed; end if;
 if not studio.valid_display_name_v1(p_display_name) then raise exception 'Invalid display name' using errcode='22023'; end if;
 select version into current_version from studio.profiles where user_id=actor for update;
 if not found then raise exception 'Profile not found' using errcode='P0002'; end if;
 if current_version is distinct from p_expected_version then raise exception 'Profile version conflict; reload before saving' using errcode='40001'; end if;
 update studio.profiles set display_name=p_display_name,version=version+1,updated_at=now() where user_id=actor;
 return studio.finish_operation_v1(actor,p_operation_id,public.read_my_profile_v1());
end; $$;
-- Only a public resource reveals attribution; this is not a user directory.
create function public.read_public_resource_author_v1(p_kind text,p_resource_id uuid) returns jsonb
language sql stable security definer set search_path='' as $$
 select studio.public_author_v1(owner_id) from (
  select a.owner_id from studio.articles a join studio.article_publications p using(article_id)
   where p_kind='article' and a.article_id=p_resource_id and a.deleted_at is null
  union all
  select e.owner_id from studio.experiments e join studio.experiment_publications p using(experiment_id)
   where p_kind='snapshot' and p.current_snapshot_id=p_resource_id and e.deleted_at is null
 ) owners limit 1;
$$;
revoke all on function public.read_my_profile_v1(), public.save_my_profile_v1(uuid,uuid,bigint,text),public.read_public_resource_author_v1(text,uuid) from public;
grant execute on function public.read_my_profile_v1(),public.save_my_profile_v1(uuid,uuid,bigint,text) to authenticated;
grant execute on function public.read_public_resource_author_v1(text,uuid) to anon,authenticated;

CREATE OR REPLACE FUNCTION "public"."list_public_article_summaries_v1"("p_limit" integer DEFAULT 50, "p_before_published_at" timestamp with time zone DEFAULT NULL::timestamp with time zone, "p_before_id" "uuid" DEFAULT NULL::"uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  result_body jsonb;
begin
  if p_limit < 1 or p_limit > 100 then
    raise exception 'List page limit must be within [1, 100]' using errcode = '22023';
  end if;
  if (p_before_published_at is null) <> (p_before_id is null) then
    raise exception 'List cursor timestamp and ID must be supplied together' using errcode = '22023';
  end if;

  with page as materialized (
    select
      p.article_id,
      a.owner_id,
      c.locale,
      c.title,
      p.public_slug,
      p.updated_at as published_at,
      excerpt.value as excerpt
    from studio.article_publications p
    join studio.articles a on a.article_id = p.article_id
    join studio.article_contents c on c.article_content_id = p.current_content_id
    left join lateral (
      select left(block.value ->> 'text', 240) as value
      from jsonb_array_elements(c.blocks) with ordinality block(value, position)
      where block.value ->> 'kind' in ('heading', 'paragraph')
        and length(btrim(coalesce(block.value ->> 'text', ''))) > 0
      order by block.position
      limit 1
    ) excerpt on true
    where a.deleted_at is null
      and (
        p_before_published_at is null
        or (p.updated_at, p.article_id) < (p_before_published_at, p_before_id)
      )
    order by p.updated_at desc, p.article_id desc
    limit p_limit
  )
  select jsonb_build_object(
    'items', coalesce(jsonb_agg(jsonb_build_object(
      'articleId', article_id,
      'author', studio.public_author_v1(owner_id),
      'locale', locale,
      'title', title,
      'excerpt', excerpt,
      'publicSlug', public_slug,
      'publishedAt', to_char(published_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"')
    ) order by published_at desc, article_id desc), '[]'::jsonb),
    'nextCursor', case when count(*) = p_limit then (
      select jsonb_build_object(
        'timestamp', to_char(last_page.published_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
        'id', last_page.article_id
      )
      from page last_page
      order by last_page.published_at asc, last_page.article_id asc
      limit 1
    ) else null end
  ) into result_body
  from page;
  return result_body;
end;
$$;

CREATE OR REPLACE FUNCTION "public"."list_public_experiment_summaries_v1"("p_limit" integer DEFAULT 50, "p_before_published_at" timestamp with time zone DEFAULT NULL::timestamp with time zone, "p_before_id" "uuid" DEFAULT NULL::"uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  result_body jsonb;
begin
  if p_limit < 1 or p_limit > 100 then
    raise exception 'List page limit must be within [1, 100]' using errcode = '22023';
  end if;
  if (p_before_published_at is null) <> (p_before_id is null) then
    raise exception 'List cursor timestamp and ID must be supplied together' using errcode = '22023';
  end if;

  with page as materialized (
    select
      p.experiment_id,
      e.owner_id,
      e.title,
      p.public_slug,
      p.updated_at as published_at,
      s.snapshot_id,
      c.model_id,
      jsonb_array_length(c.content -> 'scenarios') as scenario_count
    from studio.experiment_publications p
    join studio.experiments e on e.experiment_id = p.experiment_id
    join studio.experiment_snapshots s on s.snapshot_id = p.current_snapshot_id
    join studio.experiment_contents c on c.content_id = s.content_id
    where e.deleted_at is null
      and (
        p_before_published_at is null
        or (p.updated_at, p.experiment_id) < (p_before_published_at, p_before_id)
      )
    order by p.updated_at desc, p.experiment_id desc
    limit p_limit
  )
  select jsonb_build_object(
    'items', coalesce(jsonb_agg(jsonb_build_object(
      'experimentId', experiment_id,
      'author', studio.public_author_v1(owner_id),
      'title', title,
      'publicSlug', public_slug,
      'publishedAt', to_char(published_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
      'snapshotId', snapshot_id,
      'modelId', model_id,
      'scenarioCount', scenario_count
    ) order by published_at desc, experiment_id desc), '[]'::jsonb),
    'nextCursor', case when count(*) = p_limit then (
      select jsonb_build_object(
        'timestamp', to_char(last_page.published_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
        'id', last_page.experiment_id
      )
      from page last_page
      order by last_page.published_at asc, last_page.experiment_id asc
      limit 1
    ) else null end
  ) into result_body
  from page;
  return result_body;
end;
$$;

create or replace function public.read_public_course_v1(p_course_id uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
 select jsonb_build_object('courseId',co.course_id,'title',co.published->>'title',
   'coverUrl',co.published->'coverUrl','description',co.published->>'description','audience',co.published->>'audience',
   'locale',co.published->>'locale','ownerId',co.owner_id,'author',studio.public_author_v1(co.owner_id),'authorName',coalesce(studio.public_author_v1(co.owner_id)->>'displayName','名前未設定'),
   'updatedAt',co.published_at,'entries',coalesce((
     select jsonb_agg(jsonb_build_object('articleId',id.value,'available',c.article_content_id is not null,
       'title',c.title,'publicSlug',case when c.article_content_id is not null then p.public_slug end,
       'author',case when c.article_content_id is not null then studio.public_author_v1(a.owner_id) end,
       'authorName',case when c.article_content_id is not null then coalesce(studio.public_author_v1(a.owner_id)->>'displayName','名前未設定') end)
       order by id.ordinality)
     from jsonb_array_elements_text(co.published->'articleIds') with ordinality id(value,ordinality)
     left join studio.articles a on a.article_id=id.value::uuid and a.deleted_at is null
     left join studio.article_publications p on p.article_id=a.article_id
     left join studio.article_contents c on c.article_content_id=p.current_content_id and c.locale=co.published->>'locale'
   ),'[]'::jsonb))
 from studio.courses co
 where co.course_id=p_course_id and co.published is not null;
$$;

create or replace function studio.validate_course_content_v1(body jsonb) returns void
language plpgsql set search_path = '' as $$
declare
  trim_chars constant text := U&'\0009\000A\000B\000C\000D\0020\00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF';
begin
  if jsonb_typeof(body) is distinct from 'object'
    or (select array_agg(key order by key) from jsonb_object_keys(body - 'coverUrl') key)
       is distinct from array['articleIds','audience','description','locale','title']::text[]
    or body->>'locale' not in ('ja','en')
    or jsonb_typeof(body->'articleIds') is distinct from 'array'
  then raise exception 'Invalid Course content' using errcode='22023'; end if;
  if exists(select 1 from jsonb_each(body) e where e.key not in ('articleIds','coverUrl') and jsonb_typeof(e.value) <> 'string')
    or char_length(body->>'title') < 1
    or exists(
      select 1 from jsonb_each_text(body) e where e.key in ('title','description','audience')
      and char_length(e.value)
        + char_length(regexp_replace(e.value, U&'[^\+010000-\+10FFFF]', '', 'g'))
        > case e.key when 'title' then 240 when 'description' then 4000 else 1000 end
    )
    or exists(select 1 from jsonb_each_text(body) e where e.key not in ('articleIds','coverUrl') and e.value <> btrim(e.value,trim_chars))
    or jsonb_array_length(body->'articleIds') > 64
    or exists(select 1 from jsonb_array_elements(body->'articleIds') e
      where jsonb_typeof(e) <> 'string' or e #>> '{}' !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')
    or (select count(*) <> count(distinct e) from jsonb_array_elements_text(body->'articleIds') e)
  then raise exception 'Invalid Course fields or duplicate chapters' using errcode='22023'; end if;
  if body ? 'coverUrl' and body->'coverUrl' <> 'null'::jsonb and (
    jsonb_typeof(body->'coverUrl') <> 'string'
    or char_length(body->>'coverUrl') + char_length(regexp_replace(body->>'coverUrl',U&'[^\+010000-\+10FFFF]','','g')) > 2048
    or body->>'coverUrl' !~ '^https://[A-Za-z0-9.-]+(:[0-9]{1,5})?([/?#][^[:space:]]*)?$'
    or (body->>'coverUrl') ~ ('[' || trim_chars || ']')
  ) then raise exception 'Cover must be an HTTPS image URL' using errcode='22023'; end if;
end; $$;
revoke all on function studio.validate_course_content_v1(jsonb) from public;
