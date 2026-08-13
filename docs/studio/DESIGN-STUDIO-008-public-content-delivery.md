# DESIGN-STUDIO-008: Public content delivery

## Decision

Public CircleHeart Articles use a server-rendered read boundary. The Editor,
Experiment Session, Workbench and simulation Workers remain client-rendered.
The application does not adopt universal SSR.

One anonymous Supabase projection is the content authority for all public
representations:

- canonical HTML: `/{locale}/articles/{publicSlug}`
- Markdown: `/{locale}/articles/{publicSlug}.md`
- JSON: `/api/v1/public/articles/{publicSlug}`
- Article directory: `/{locale}/articles`
- discovery: `/sitemap.xml` and `/robots.txt`

HTML, Markdown and JSON all carry the same immutable `articleContentId` and
derive from the same validated Article block tree. Interactive Experiment
placements have a semantic static summary in HTML/Markdown; JavaScript replaces
that summary with the live Reader without changing the durable content model.
The static document lives outside React's mount root and remains visible until
the client route has resolved; a slow or failed bundle therefore cannot replace
readable content with a loading screen.

## Why this boundary

Search engines, link unfurlers, accessibility tools and AI review clients must
receive the title and Article prose in the first HTTP response. They must not
execute the simulation application merely to read public educational content.
Conversely, SSR adds no value to the numerical Worker runtime or private
authoring surfaces and would couple deployment concerns to scientific runtime
code.

The server uses only the Supabase publishable key and anonymous RPCs. A service
role key is prohibited. Publication remains the database authority; the render
tier cannot expose drafts.

## Routing and cache contract

Firebase Hosting routes only the public one-segment Article paths, public API,
sitemap and robots to `circleheart-public-content` in `asia-northeast1`.
`/{locale}/articles/{articleId}/edit` and every other application path continue
to the SPA fallback. Authored draft previews use
`/{locale}/articles/{articleId}/preview`, are explicitly routed to the SPA, and
are marked `noindex`; public one-segment Article routes are the only Article
Reader routes sent to the render service.

Canonical slug routes return `200`. A still-public UUID route or locale mismatch
returns `308` to the canonical slug. Missing/unpublished resources return a real
`404` with `noindex`. HTML/Markdown/JSON use `articleContentId` plus an explicit
representation/renderer revision and the exact response-byte SHA-256 as a
strong ETag. UUID-shaped slugs are reserved so they cannot shadow another
Article's legacy UUID alias. Responses use a five-minute
shared-cache lifetime with stale-while-revalidate.

## Deployment

Build locally with:

```sh
npm run build:public-content
```

Build and deploy the container from the repository root (replace project and
key values when needed):

```sh
supabase db push --linked

gcloud artifacts repositories describe circleheart \
  --location asia-northeast1 >/dev/null 2>&1 || \
gcloud artifacts repositories create circleheart \
  --repository-format docker --location asia-northeast1

gcloud builds submit --config cloudbuild.public-content.yaml

gcloud run deploy circleheart-public-content \
  --image asia-northeast1-docker.pkg.dev/$(gcloud config get-value project)/circleheart/public-content:latest \
  --region asia-northeast1 \
  --allow-unauthenticated \
  --set-env-vars CIRCLEHEART_CANONICAL_ORIGIN=https://www.circleheart.dev,CIRCLEHEART_SUPABASE_URL=https://hidoxfvibxkboksemhdv.supabase.co,CIRCLEHEART_SUPABASE_PUBLISHABLE_KEY=sb_publishable_REPLACE_ME
```

Create the service before deploying Firebase Hosting because Hosting pins a
revision tag when `pinTag` is enabled. Deploy Hosting last with
`firebase deploy --only hosting`; this ensures the hashed client assets and the
server template come from the same application build. Never deploy the client
that calls `read_public_article_route_v1` before its migration.

## Follow-up boundary

The initial implementation renders on demand behind the Hosting cache. If
traffic or publication latency warrants it, publication can materialize the
same renderer output into immutable Storage objects and use an outbox to purge
the alias cache. That optimization must not introduce another content model or
another renderer.
