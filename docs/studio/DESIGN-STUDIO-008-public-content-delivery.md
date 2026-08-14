# DESIGN-STUDIO-008: Public content delivery

## Decision

CircleHeart Home and public Articles use a server-rendered read boundary. The
Editor, Experiment Session, Workbench and simulation Workers remain
client-rendered. The application does not adopt universal SSR.

One anonymous Supabase projection is the content authority for all public
representations:

- canonical HTML: `/{locale}/articles/{publicSlug}`
- language-negotiating entry point: `/`
- localized Home: `/{locale}`
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

The first response and interactive client are two renderers of one presentation
contract, not two designs. They share copy, typography, cards and page chrome.
Both Home and Article HTML embed their already validated anonymous projection
as inert JSON, so the client does not repeat the public read before becoming
interactive. Article Snapshot resolution continues in the background; the
handoff occurs only after the Reader is ready and transfers the document scroll
position into the Reader's scroll container. The cached first response
necessarily uses anonymous chrome; account-specific controls may replace it
only after the browser resolves an authenticated session.

The bare origin is a discovery entry point rather than a third Home variant.
It redirects with `302` to `/{locale}` using the saved locale cookie first,
weighted `Accept-Language` second and Japanese as the final fallback. The
redirect preserves the query string, reads no catalog data and is
`private, no-store` with `Vary: Cookie, Accept-Language`. Localized pages persist
the same preference to local storage and a first-party cookie. Their
`hreflang="x-default"` points to `/`, while `ja` and `en` alternates point to the
two stable localized URLs.

## Why this boundary

Search engines, link unfurlers, accessibility tools and AI review clients must
receive the product description, public discovery links, Article title and
Article prose in the first HTTP response. They must not execute the simulation
application merely to discover or read public educational content. Conversely,
SSR adds no value to the numerical Worker runtime or private authoring surfaces
and would couple deployment concerns to scientific runtime code.

The server uses only the Supabase publishable key and anonymous RPCs. A service
role key is prohibited. Publication remains the database authority; the render
tier cannot expose drafts.

## Routing and cache contract

Firebase Hosting routes the bare origin, localized Home, public one-segment
Article paths, public API, sitemap and robots to
`circleheart-public-content` in `asia-northeast1`. The bare-origin redirect is
handled by the render service so it follows the same locale contract as the
client without serving an empty SPA shell.
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

Build and deploy the container from the repository root. Keep the target
project explicit so another local `gcloud` default cannot receive the release.
Replace the key value when needed:

```sh
supabase db push --linked

CIRCLEHEART_GCP_PROJECT=hemodynamics-studio
CIRCLEHEART_BUILD_IDENTITY="circleheart-public-build@${CIRCLEHEART_GCP_PROJECT}.iam.gserviceaccount.com"
CIRCLEHEART_RUNTIME_IDENTITY="circleheart-public-runtime@${CIRCLEHEART_GCP_PROJECT}.iam.gserviceaccount.com"
CIRCLEHEART_RELEASE_TAG="$(git rev-parse --short=8 HEAD)"

gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  --project "${CIRCLEHEART_GCP_PROJECT}"

gcloud iam service-accounts describe "${CIRCLEHEART_BUILD_IDENTITY}" \
  --project "${CIRCLEHEART_GCP_PROJECT}" >/dev/null 2>&1 || \
gcloud iam service-accounts create circleheart-public-build \
  --display-name "CircleHeart public content build" \
  --project "${CIRCLEHEART_GCP_PROJECT}"

for CIRCLEHEART_BUILD_ROLE in \
  roles/artifactregistry.writer \
  roles/logging.logWriter \
  roles/storage.objectViewer
do
  gcloud projects add-iam-policy-binding "${CIRCLEHEART_GCP_PROJECT}" \
    --member "serviceAccount:${CIRCLEHEART_BUILD_IDENTITY}" \
    --role "${CIRCLEHEART_BUILD_ROLE}" \
    --condition None \
    --quiet >/dev/null
done

gcloud iam service-accounts describe "${CIRCLEHEART_RUNTIME_IDENTITY}" \
  --project "${CIRCLEHEART_GCP_PROJECT}" >/dev/null 2>&1 || \
gcloud iam service-accounts create circleheart-public-runtime \
  --display-name "CircleHeart public content runtime" \
  --project "${CIRCLEHEART_GCP_PROJECT}"

gcloud artifacts repositories describe circleheart \
  --location asia-northeast1 \
  --project "${CIRCLEHEART_GCP_PROJECT}" >/dev/null 2>&1 || \
gcloud artifacts repositories create circleheart \
  --repository-format docker \
  --location asia-northeast1 \
  --project "${CIRCLEHEART_GCP_PROJECT}"

gcloud builds submit \
  --config cloudbuild.public-content.yaml \
  --project "${CIRCLEHEART_GCP_PROJECT}" \
  --region global \
  --service-account "projects/${CIRCLEHEART_GCP_PROJECT}/serviceAccounts/${CIRCLEHEART_BUILD_IDENTITY}" \
  --substitutions "_IMAGE=asia-northeast1-docker.pkg.dev/${CIRCLEHEART_GCP_PROJECT}/circleheart/public-content:${CIRCLEHEART_RELEASE_TAG}"

gcloud run deploy circleheart-public-content \
  --image "asia-northeast1-docker.pkg.dev/${CIRCLEHEART_GCP_PROJECT}/circleheart/public-content:${CIRCLEHEART_RELEASE_TAG}" \
  --project "${CIRCLEHEART_GCP_PROJECT}" \
  --region asia-northeast1 \
  --service-account "${CIRCLEHEART_RUNTIME_IDENTITY}" \
  --allow-unauthenticated \
  --ingress all \
  --cpu 1 \
  --memory 512Mi \
  --concurrency 80 \
  --timeout 30s \
  --max-instances 10 \
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
