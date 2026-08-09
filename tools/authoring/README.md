# Studio authoring commands

This CLI lets a local AI or developer repeat ordinary Studio content actions.
It uses the same Supabase user authority, CAS versions, model-aware validation,
Snapshot admission boundary and publication RPCs as the product UI.

It is not a numerical back door. Scenario mutation, parameter fitting and
Snapshot capture stay in the Experiment Session until a real repeated workflow
defines their execution-host contract.

## Authentication

Set these only in the local process environment:

```text
CIRCLEHEART_SUPABASE_URL
CIRCLEHEART_SUPABASE_PUBLISHABLE_KEY   # must start sb_publishable_
CIRCLEHEART_AUTHOR_ACCESS_TOKEN
CIRCLEHEART_AUTHOR_REFRESH_TOKEN
```

Never put credentials in a command file. Service-role/secret keys and legacy
service-role JWTs are rejected. The initial CLI expects a currently valid user
token pair; it does not persist a rotated refresh token.

## Run

```sh
npm run author:content -- --command /absolute/path/to/command.json
```

Each file has exactly this envelope:

```json
{
  "schemaId": "circleheart-studio-authoring-command-v1",
  "commandId": "3a3dd8a7-d8ad-48d4-9e23-6826c8a9fb6e",
  "action": "experiment.list",
  "input": { "limit": 50 }
}
```

Reuse the same UUID when retrying the same mutation after an uncertain
response. It is also the backend idempotency key.

## Actions

Read-only actions:

```text
experiment.list  { limit }
experiment.read  { experimentId }
snapshot.list    { limit }
snapshot.read    { snapshotId }
article.list     { limit }
article.read     { articleId }
```

Mutation actions:

```text
experiment.presentation.save
  { experimentId, expectedVersion, title, surface }

experiment.publish
  { experimentId, expectedVersion, snapshotId, publicSlug }

article.save
  { articleId, expectedVersion, article }
  # both identity fields are null for a new Article

article.publish
  { articleId, expectedVersion, publicSlug }
```

Read the current resource first and copy its current version into a mutation.
Presentation and Article saves are validated against the pinned exact model,
Surface and referenced Snapshots. Publication accepts only a Snapshot that has
already passed the common numerical admission path.
