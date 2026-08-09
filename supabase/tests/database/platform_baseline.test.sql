begin;

create extension if not exists pgtap with schema extensions;

select plan(2);

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
