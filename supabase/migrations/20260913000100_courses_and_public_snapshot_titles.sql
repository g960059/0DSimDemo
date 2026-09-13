-- Courses reference Articles; their draft and published order are separate.
create table studio.courses (
  course_id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id),
  version bigint not null default 0 check (version >= 0),
  draft jsonb not null,
  published jsonb,
  updated_at timestamptz not null default now(),
  published_at timestamptz
);
alter table studio.courses enable row level security;
-- Curated placement is editorial authority, never a user-writable Course field.
create table studio.featured_courses (
  course_id uuid primary key references studio.courses(course_id) on delete cascade,
  position integer not null unique check(position >= 0)
);
alter table studio.featured_courses enable row level security;
revoke all on studio.courses, studio.featured_courses from public, anon, authenticated;
grant all on studio.courses, studio.featured_courses to service_role;

create or replace function studio.validate_course_content_v1(body jsonb) returns void
language plpgsql set search_path = '' as $$
begin
  if jsonb_typeof(body) is distinct from 'object'
    or (select array_agg(key order by key) from jsonb_object_keys(body) key)
       is distinct from array['articleIds','audience','description','locale','title']::text[]
    or body->>'locale' not in ('ja','en')
    or jsonb_typeof(body->'articleIds') is distinct from 'array'
  then raise exception 'Invalid Course content' using errcode='22023'; end if;
  if exists(select 1 from jsonb_each(body) e where e.key <> 'articleIds' and jsonb_typeof(e.value) <> 'string')
    or char_length(body->>'title') not between 1 and 240
    or char_length(body->>'description') > 4000 or char_length(body->>'audience') > 1000
    or exists(select 1 from jsonb_each_text(body) e where e.key <> 'articleIds' and e.value <> btrim(e.value))
    or jsonb_array_length(body->'articleIds') > 64
    or exists(select 1 from jsonb_array_elements(body->'articleIds') e
      where jsonb_typeof(e) <> 'string' or e #>> '{}' !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')
    or (select count(*) <> count(distinct e) from jsonb_array_elements_text(body->'articleIds') e)
  then raise exception 'Invalid Course fields or duplicate chapters' using errcode='22023'; end if;
end; $$;
revoke all on function studio.validate_course_content_v1(jsonb) from public;

create or replace function public.read_my_course_v1(p_course_id uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('courseId',course_id,'version',version,'content',draft,
    'published',published is not null,'updatedAt',updated_at)
  from studio.courses where course_id=p_course_id and owner_id=auth.uid();
$$;

create or replace function public.save_course_v1(p_operation_id uuid,p_course_id uuid,p_expected_version bigint,p_content jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare actor uuid:=auth.uid(); replayed jsonb; target uuid; current_row studio.courses%rowtype;
begin
  if actor is null then raise exception 'authentication required' using errcode='28000'; end if;
  replayed:=studio.begin_operation_v1(actor,p_operation_id,'save-course-v1',jsonb_build_object(
    'courseId',p_course_id,'expectedVersion',p_expected_version,'content',p_content));
  if replayed is not null then return replayed; end if;
  perform studio.validate_course_content_v1(p_content);
  if p_course_id is null then
    if p_expected_version is not null then raise exception 'New Course has no version' using errcode='22023'; end if;
  -- Authors may prepare their own unpublished articles; other authors' entries must be public.
  if exists(select 1 from jsonb_array_elements_text(p_content->'articleIds') id
    where not coalesce(current_row.draft->'articleIds' ? id,false) and not exists(select 1 from studio.articles a where a.article_id=id::uuid and a.deleted_at is null
      and (a.owner_id=actor or exists(select 1 from studio.article_publications p where p.article_id=a.article_id))))
  then raise exception 'Article unavailable' using errcode='22023'; end if;
    insert into studio.courses(owner_id,draft) values(actor,p_content) returning course_id into target;
  else
    select * into current_row from studio.courses where course_id=p_course_id and owner_id=actor for update;
    if not found then raise exception 'Course not found' using errcode='P0002'; end if;
    if current_row.version is distinct from p_expected_version then raise exception 'Course version conflict' using errcode='40001'; end if;
  -- Authors may prepare their own unpublished articles; other authors' entries must be public.
  if exists(select 1 from jsonb_array_elements_text(p_content->'articleIds') id
    where not coalesce(current_row.draft->'articleIds' ? id,false) and not exists(select 1 from studio.articles a where a.article_id=id::uuid and a.deleted_at is null
      and (a.owner_id=actor or exists(select 1 from studio.article_publications p where p.article_id=a.article_id))))
  then raise exception 'Article unavailable' using errcode='22023'; end if;
    target:=p_course_id;
    update studio.courses set draft=p_content,version=version+1,updated_at=now() where course_id=target;
  end if;
  return studio.finish_operation_v1(actor,p_operation_id,public.read_my_course_v1(target));
end; $$;

create or replace function public.publish_course_v1(p_operation_id uuid,p_course_id uuid,p_expected_version bigint,p_publish boolean)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare actor uuid:=auth.uid(); replayed jsonb; current_row studio.courses%rowtype;
begin
  if actor is null then raise exception 'authentication required' using errcode='28000'; end if;
  if coalesce((auth.jwt()->>'is_anonymous')::boolean,false) then raise exception 'Account required to publish' using errcode='42501'; end if;
  if p_publish is null then raise exception 'Publication action required' using errcode='22023'; end if;
  replayed:=studio.begin_operation_v1(actor,p_operation_id,'publish-course-v1',jsonb_build_object(
    'courseId',p_course_id,'expectedVersion',p_expected_version,'publish',p_publish));
  if replayed is not null then return replayed; end if;
  select * into current_row from studio.courses where course_id=p_course_id and owner_id=actor for update;
  if not found then raise exception 'Course not found' using errcode='P0002'; end if;
  if current_row.version is distinct from p_expected_version then raise exception 'Course version conflict' using errcode='40001'; end if;
  if p_publish and (jsonb_array_length(current_row.draft->'articleIds')=0 or exists(
    select 1 from jsonb_array_elements_text(current_row.draft->'articleIds') id
    where not (coalesce(current_row.published->'articleIds' ? id,false) and current_row.published->>'locale'=current_row.draft->>'locale') and not exists(select 1 from studio.article_publications p
      join studio.articles a on a.article_id=p.article_id and a.deleted_at is null
      join studio.article_contents c on c.article_content_id=p.current_content_id
      where p.article_id=id::uuid and c.locale=current_row.draft->>'locale')))
  then raise exception 'Publish at least one available Article in the Course language' using errcode='22023'; end if;
  update studio.courses set published=case when p_publish then draft else null end,
    published_at=case when p_publish then now() else null end,updated_at=now(),version=version+1 where course_id=p_course_id;
  return studio.finish_operation_v1(actor,p_operation_id,public.read_my_course_v1(p_course_id));
end; $$;

create or replace function public.read_public_course_v1(p_course_id uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
 select jsonb_build_object('courseId',co.course_id,'title',co.published->>'title',
   'description',co.published->>'description','audience',co.published->>'audience',
   'locale',co.published->>'locale','ownerId',co.owner_id,'authorName',coalesce(pr.display_name,'Author'),
   'updatedAt',co.published_at,'entries',coalesce((
     select jsonb_agg(jsonb_build_object('articleId',id.value,'available',c.article_content_id is not null,
       'title',c.title,'publicSlug',case when c.article_content_id is not null then p.public_slug end,
       'authorName',case when c.article_content_id is not null then coalesce(ap.display_name,'Author') end)
       order by id.ordinality)
     from jsonb_array_elements_text(co.published->'articleIds') with ordinality id(value,ordinality)
     left join studio.articles a on a.article_id=id.value::uuid and a.deleted_at is null
     left join studio.article_publications p on p.article_id=a.article_id
     left join studio.article_contents c on c.article_content_id=p.current_content_id and c.locale=co.published->>'locale'
     left join studio.profiles ap on ap.user_id=a.owner_id
   ),'[]'::jsonb))
 from studio.courses co left join studio.profiles pr on pr.user_id=co.owner_id
 where co.course_id=p_course_id and co.published is not null;
$$;

create or replace function public.list_courses_v1(p_scope text default 'public',p_locale text default 'ja',p_article_id uuid default null,p_offset integer default 0)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
 if p_scope not in ('public','mine','featured') or p_locale not in ('ja','en') or p_offset is null or p_offset<0 then
   raise exception 'Invalid Course list request' using errcode='22023'; end if;
 return coalesce((select jsonb_agg(item order by position,updated_at desc,course_id) from (
   select c.course_id,c.updated_at,f.position,
     case when p_scope='mine' then public.read_my_course_v1(c.course_id)
       else public.read_public_course_v1(c.course_id) end item
   from studio.courses c left join studio.featured_courses f on f.course_id=c.course_id
   where case when p_scope='mine' then c.owner_id=auth.uid() and c.draft->>'locale'=p_locale
     else c.published is not null and c.published->>'locale'=p_locale end
   and (p_scope <> 'featured' or f.course_id is not null)
   and (p_article_id is null or (c.published->'articleIds' ? p_article_id::text
     and public.read_public_article_route_v1(p_article_id::text) is not null))
   order by f.position,c.updated_at desc,c.course_id limit 50 offset p_offset
 ) page),'[]'::jsonb);
end; $$;

create or replace function public.read_public_snapshot_title_v1(p_snapshot_id uuid) returns text
language sql stable security definer set search_path = '' as $$
 select e.title from studio.experiment_publications p
 join studio.experiments e on e.experiment_id=p.experiment_id and e.deleted_at is null
 where p.current_snapshot_id=p_snapshot_id order by p.updated_at desc,p.experiment_id limit 1;
$$;

revoke all on function public.read_my_course_v1(uuid),public.save_course_v1(uuid,uuid,bigint,jsonb),
 public.publish_course_v1(uuid,uuid,bigint,boolean),public.read_public_course_v1(uuid),
 public.list_courses_v1(text,text,uuid,integer),public.read_public_snapshot_title_v1(uuid) from public;
grant execute on function public.read_my_course_v1(uuid),public.save_course_v1(uuid,uuid,bigint,jsonb),
 public.publish_course_v1(uuid,uuid,bigint,boolean) to authenticated;
grant execute on function public.read_public_course_v1(uuid),public.list_courses_v1(text,text,uuid,integer),
 public.read_public_snapshot_title_v1(uuid) to anon,authenticated;

create or replace function public.delete_course_v1(p_operation_id uuid,p_course_id uuid,p_expected_version bigint)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare actor uuid:=auth.uid(); replayed jsonb; current_row studio.courses%rowtype;
begin
 if actor is null then raise exception 'authentication required' using errcode='28000'; end if;
 replayed:=studio.begin_operation_v1(actor,p_operation_id,'delete-course-v1',jsonb_build_object('courseId',p_course_id,'expectedVersion',p_expected_version));
 if replayed is not null then return replayed; end if;
 select * into current_row from studio.courses where course_id=p_course_id and owner_id=actor for update;
 if not found then raise exception 'Course not found' using errcode='P0002'; end if;
 if current_row.version is distinct from p_expected_version then raise exception 'Course version conflict' using errcode='40001'; end if;
 delete from studio.courses where course_id=p_course_id;
 return studio.finish_operation_v1(actor,p_operation_id,jsonb_build_object('courseId',p_course_id,'deleted',true));
end; $$;
revoke all on function public.delete_course_v1(uuid,uuid,bigint) from public;
grant execute on function public.delete_course_v1(uuid,uuid,bigint) to authenticated;
