# CircleHeart Supabase release spine

This directory is the reviewed backend foundation for CircleHeart. It is
intentionally not linked to a remote project in source control.

The first cut keeps interactive numerical execution in browser Web Workers and
uses Supabase only for:

- Auth and identity linking;
- exact-model release lookup;
- private Experiment and Article ownership;
- immutable Snapshot/content storage;
- public pointers and Reader access;
- idempotent semantic writes; and
- bounded garbage collection.

## Production topology

`circleheart.dev` is the production product domain. Squarespace remains the DNS
manager and the application is served by Firebase Hosting. The current Hosting
configuration redirects the apex domain to the canonical browser origin
`https://www.circleheart.dev`. Firebase is only the static Vite/SPA delivery
layer; Firestore, Firebase Auth, and Firebase Storage are not part of the new
architecture.

```text
circleheart.dev / www.circleheart.dev (Squarespace-managed DNS)
  -> Firebase Hosting (dist + SPA rewrite)
  -> Browser Web Workers (interactive simulation)
  -> Supabase (Auth + Postgres + model artifact Storage)
```

The checked-in `firebase.json` deliberately contains Hosting only. Hashed Vite
assets are cached immutably, while `index.html` is revalidated so a new release
can move the application shell without stale route code.

## Local setup

Docker Desktop must be running.

```bash
supabase start
supabase db reset
supabase db lint --local
```

The repository currently carries no remote project ref. Link only the intended
CircleHeart project after reviewing the migration diff:

```bash
supabase link --project-ref <circleheart-project-ref>
supabase db push --dry-run
supabase db push
```

Never link or push these migrations to an unrelated existing project.

For a configured browser build, copy `.env.example` to an ignored
`.env.local` and provide only the project URL and publishable key. Database
passwords, secret keys, and CLI access tokens must never enter Vite variables.

## Migrations

### `20260809000100_active_model_bundle.sql`

This is the only Studio migration. Before the first user, the former
development sequence was deliberately squashed into one Standard-only
baseline. It creates:

- immutable exact-model and Surface registries with explicit lifecycle;
- one atomic active exact-model + Surface bundle pointer;
- required Surface-series pins on every mutable Experiment and required exact
  Surface-release pins on every Snapshot;
- owner/private and public content reads, semantic write RPCs, idempotency,
  quotas, publication guards, retention, and bounded garbage collection;
- the public, client-read-only `model-releases` Storage bucket; and
- a 15-minute Supabase Cron schedule for bounded content GC.

Mutable content resolves a Surface by series lineage rather than timestamp.
Stable/retired exact models see stable Surfaces only; dev exact models may
reopen dev Surface successors without leaking those definitions into ordinary
stable content.

Artifact digests and registry fingerprints stay registry/CI metadata. Portable
domain objects use exact `modelId`, `surfaceSeriesId`, and
`surfaceReleaseId`; they never expose storage paths, codecs, or hashes as
product identity.

## Auth policy

Supported product flows are:

- anonymous visitor: no account is created merely by opening or forking;
- first backend Save: sign in anonymously, then perform the semantic Save RPC;
- retained private work: available to that anonymous account;
- account upgrade: link magic-link email or Google identity to the same user;
- Publish: rejected while the JWT is anonymous; and
- passwords: not offered by the product.

Local email sign-in is enabled. Google remains disabled in `config.toml`
because production client credentials belong in Supabase secrets/Dashboard,
not source control.

The production Supabase Site URL is the final canonical origin
`https://www.circleheart.dev`; both apex and `www` remain allow-listed.
Localhost and loopback redirects remain explicitly allow-listed for
development; the client always supplies its current origin as `redirectTo`.

## Write boundary

Clients have no direct table write grants. They call versioned RPCs:

```text
save_experiment_v1
commit_admitted_experiment_snapshot_v1
publish_experiment_v1
unpublish_experiment_v1
delete_experiment_v1
save_article_v1
publish_article_v1
unpublish_article_v1
delete_article_v1
```

Each mutation receives a caller-generated UUID `operation_id`. Repeating the
same operation and canonical request returns its committed result. Reusing the
ID with different input is rejected. Mutable resources additionally require an
expected version.

The browser retains an unacknowledged operation ID for the exact semantic
request for 24 hours, including in same-tab session storage, so a response-loss
retry cannot create a second immutable revision. Database receipts keep
SHA-256 request fingerprints and compact identity results rather than copying
Experiment/Article/Snapshot JSON. Experiment content is capped at 8 MiB,
Article content at 2 MiB, and anonymous identities have bounded row and 64 MiB
immutable-storage quotas in addition to mutation-rate limits.

`commit_admitted_experiment_snapshot_v1` is a persistence boundary, not a
numerical verifier. The browser must first receive the sealed result of the
exact model's common Snapshot admission Worker. This protects ordinary product
flows; it is not a cryptographic proof against a malicious modified client.

For standalone publication, the commit includes saved Experiment identity and
expected version. The database verifies that model, Surface, Scenario order,
labels, and fixtures still match the clean saved head; only captured
checkpoints may be newer. Session-origin Article capture omits that source.

Article Save accepts `blocks` once. Experiment Placement references and
Briefing are projected by the database from those blocks into
`article_snapshot_refs`; callers cannot provide a second divergent list.

## Read boundary

Public reads use:

```text
get_active_model_bundle_v1
get_model_release_v1
get_model_surface_release_v1
get_model_surface_series_latest_v1
read_public_experiment_v1
read_public_article_v1
read_experiment_snapshot_v1
list_my_experiment_summaries_v1
read_my_experiment_v1
list_my_snapshot_summaries_v1
list_my_article_summaries_v1
read_article_v1
list_public_experiment_summaries_v1
list_public_article_summaries_v1
```

A Snapshot is readable by its owner, through the current public Experiment
pointer, or through a published Article content reference. Private draft
Article references do not make a Snapshot public.

Summary calls accept a bounded page size and stable `(timestamp, id)` cursor.
They never return complete numerical state; detail RPCs remain reference- and
ownership-authorized independently.

## Retention and scheduled GC

Newly committed Snapshots receive a 24-hour handoff grace period. Publication retains
them explicitly; Article references retain them relationally. Unpublish and
soft delete release those pointers; deleted roots and otherwise unreachable
immutable content are eligible for physical collection after one hour. A
scheduled service-role job calls:

```sql
select studio.gc_unreferenced_content_v1(500);
```

The function removes only bounded batches of expired soft-deleted roots,
unreferenced Snapshots, unreachable immutable content, and expired idempotency
receipts. The pre-release baseline migration registers the production
Supabase Cron job at a 15-minute interval; job history is available in
`cron.job_run_details`.

## Release registration

CI builds the deterministic **numerical execution** artifact and verifies its
repository lock before calling `register_model_release_v1` with service-role
authority. If that contract or those bytes change, CI must assign a new exact
`modelId`; registry registration rejects rebinding an existing ID. Studio
admission policy, presentation catalogs, UI, Auth, database, Article, and
hosting releases are versioned separately and must not churn `modelId`.

The registry accepts only the Standard exact-model manifest. Immutable launch
metadata consists of the default fixture and an analysis-profile ID and is
stored with the exact release row. Public reads return those values with the
manifest and public Storage path, but continue to hide artifact SHA,
fingerprint, and source commit. Exact artifacts export
`createCircleHeartExactModelReleaseV1() -> { manifest, executables }`.
Registry metadata is the sole authority for the default fixture. Analysis
profile IDs are immutable; changed analysis semantics require another profile
ID rather than rebinding an existing release.

After the exact release and Surface files are committed, a maintainer with an
authenticated Supabase CLI session publishes immutable registry rows without
exposing a secret to the browser or shell output:

```bash
npm run publish:registry:main-wire-v3 -- \
  --project-ref <project-ref> --stage <dev|stable>

npm run publish:registry:model-surface -- \
  --project-ref <project-ref> --manifest <surface.json> \
  --stage <dev|stable>
```

Registration never changes the ordinary launch target. After both rows are
stable and compatible, a trusted operator replaces the singleton active bundle
with an explicit compare-and-swap:

```bash
npm run activate:registry:model-bundle -- \
  --project-ref <project-ref> --model-id <modelId> \
  --surface-release-id <surfaceReleaseId> \
  --expected-version <none|integer>
```

New Experiment Sessions resolve that exact model/Surface pair atomically and
then pin it. Existing content keeps its stored exact model and Surface pins;
it never follows later active-bundle replacements.

## Pre-release baseline rollout

The repository intentionally contains one current-state Studio migration.
Earlier pre-release migrations and legacy model-loader tables/RPCs were
squashed before any user content existed. A Supabase project that previously
applied those development migrations must therefore be treated as disposable:

1. verify that Auth, Experiment, Snapshot, Article, and publication row counts
   are zero;
2. export any registry metadata that must be re-published;
3. reset or recreate the development project from the checked-in baseline;
4. publish the current Standard exact model and Surface; and
5. activate that stable pair with the compare-and-swap command above.

Do not repair migration history in place on a project containing user data.
After the first real user is admitted, all schema changes are forward-only
migrations and this pre-release reset exception ends.

## Deferred work

- configure production email delivery and Google OAuth credentials;
- enable production CAPTCHA/Turnstile for anonymous sign-in;
- exercise retained exact loading when the first Standard successor is
  registered;
- verify Worker Blob ESM import and Storage CORS in WebKit and real Safari/iOS
  Safari before public deployment;
- keep immutable artifacts write/delete restricted, forbid path reuse, audit
  registry digests server-side, and retain an independently restorable mirror;
- define retention for abandoned anonymous identities after account-linking UX
  is complete; and
- introduce Cloud Run Jobs only for patient fitting or expensive batch work.

Realtime numerical frames, ordinary simulation stepping, CRDT editing, and
patient data are outside this release spine.
