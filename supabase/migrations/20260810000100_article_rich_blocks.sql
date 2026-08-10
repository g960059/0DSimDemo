-- Rich Article blocks share the existing portable JSON document. This
-- migration adds immutable public image assets and aligns draft title storage
-- with the Editor's exact-text autosave contract.

alter table studio.article_contents
  drop constraint if exists article_contents_title;

alter table studio.article_contents
  add constraint article_contents_title
  check (char_length(title) <= 240);

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
) values (
  'article-images',
  'article-images',
  true,
  8388608,
  array[
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/gif',
    'image/avif'
  ]
) on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists article_image_owner_insert_v1 on storage.objects;

create policy article_image_owner_insert_v1
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'article-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and coalesce(((select auth.jwt()) ->> 'is_anonymous')::boolean, false) = false
);

comment on policy article_image_owner_insert_v1 on storage.objects is
  'Signed-in Article owners may append immutable images only below their own user folder.';

create or replace function studio.enforce_publishable_article_content_v1()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  authored_title text;
begin
  select title into authored_title
  from studio.article_contents
  where article_content_id = new.current_content_id;
  if authored_title is null or char_length(btrim(authored_title)) = 0 then
    raise exception 'Article title must not be empty when published'
      using errcode = '22023';
  end if;
  return new;
end;
$$;

drop trigger if exists article_publication_requires_title
  on studio.article_publications;

create trigger article_publication_requires_title
before insert or update of current_content_id
on studio.article_publications
for each row execute function studio.enforce_publishable_article_content_v1();
