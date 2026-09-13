-- The public reader validates every Course. RPC writes must obey the same
-- UTF-16 lengths and ECMAScript trim boundary as validateCourseContentV1.
create or replace function studio.validate_course_content_v1(body jsonb) returns void
language plpgsql set search_path = '' as $$
declare
  trim_chars constant text := U&'\0009\000A\000B\000C\000D\0020\00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF';
begin
  if jsonb_typeof(body) is distinct from 'object'
    or (select array_agg(key order by key) from jsonb_object_keys(body) key)
       is distinct from array['articleIds','audience','description','locale','title']::text[]
    or body->>'locale' not in ('ja','en')
    or jsonb_typeof(body->'articleIds') is distinct from 'array'
  then raise exception 'Invalid Course content' using errcode='22023'; end if;
  if exists(select 1 from jsonb_each(body) e where e.key <> 'articleIds' and jsonb_typeof(e.value) <> 'string')
    or char_length(body->>'title') < 1
    or exists(
      select 1 from jsonb_each_text(body) e where e.key in ('title','description','audience')
      and char_length(e.value)
        + char_length(regexp_replace(e.value, U&'[^\+010000-\+10FFFF]', '', 'g'))
        > case e.key when 'title' then 240 when 'description' then 4000 else 1000 end
    )
    or exists(select 1 from jsonb_each_text(body) e where e.key <> 'articleIds' and e.value <> btrim(e.value,trim_chars))
    or jsonb_array_length(body->'articleIds') > 64
    or exists(select 1 from jsonb_array_elements(body->'articleIds') e
      where jsonb_typeof(e) <> 'string' or e #>> '{}' !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')
    or (select count(*) <> count(distinct e) from jsonb_array_elements_text(body->'articleIds') e)
  then raise exception 'Invalid Course fields or duplicate chapters' using errcode='22023'; end if;
end; $$;
revoke all on function studio.validate_course_content_v1(jsonb) from public;
