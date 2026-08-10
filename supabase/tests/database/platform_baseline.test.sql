begin;

create extension if not exists pgtap with schema extensions;

select plan(5);

select is(
  (
    select count(*)
    from storage.buckets
    where id = 'model-releases'
      and name = 'model-releases'
      and public
      and file_size_limit = 10485760
      and allowed_mime_types = array['application/javascript', 'text/javascript']
  ),
  1::bigint,
  'Fresh baseline provisions the public exact-model artifact bucket'
);

select is(
  (
    select count(*)
    from storage.buckets
    where id = 'article-images'
      and name = 'article-images'
      and public
      and file_size_limit = 8388608
      and allowed_mime_types = array[
        'image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif'
      ]
  ),
  1::bigint,
  'Article rich blocks provision the immutable public image bucket'
);

select is(
  (
    select count(*)
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'article_image_owner_insert_v1'
      and cmd = 'INSERT'
      and 'authenticated' = any(roles)
  ),
  1::bigint,
  'Only the signed-in owner insert policy is installed for Article images'
);

select is(
  (
    select count(*)
    from pg_trigger
    where tgrelid = 'studio.article_publications'::regclass
      and tgname = 'article_publication_requires_title'
      and not tgisinternal
  ),
  1::bigint,
  'Publication authority requires a meaningful Article title'
);

select is(
  (
    select count(*)
    from cron.job
    where jobname = 'circleheart-content-gc-v1'
      and schedule = '*/15 * * * *'
      and command = 'select studio.gc_unreferenced_content_v1(500);'
  ),
  1::bigint,
  'Fresh baseline schedules bounded content garbage collection'
);

select * from finish();

rollback;
