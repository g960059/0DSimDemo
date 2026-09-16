# Authored model succession

An exact-model adoption and an authored-state transfer are separate decisions.
Qualify a new model's own launches first. An explicit successor transfer may
preserve a compatible predecessor checkpoint as an initial condition; it does
not claim that the successor generated the earlier trajectory or that the saved
state is already settled under the successor.

Before applying a transfer, retain a private, access-restricted database backup,
the admitted plan and receipt, and both generated SQL files. These hold the
old/new immutable-ID mapping and content hashes: they are the administrative
provenance and recovery record, not public scientific evidence. Never commit
article bodies, owner identifiers or credentials into the release archive.

Register the reviewed artifact before executing a prepared transfer. Use a
connection whose server-side statement deadline is already enabled when the
single SQL statement starts. Preparation is offline; applying either generated
SQL file is an explicit administrative write. The transaction checks captured
preimages and inventory, preserving draft/public pointers independently. Any
conflict requires a fresh backup and admission, not bypassing the checks.

Rollback has deliberate boundaries:

- It refuses to overwrite subsequent edits or publication changes. Resolve
  these independently; do not force an old plan over new content.
- Versions advance again instead of rewinding. After rollback, regenerate the
  plan and SQL from a fresh backup before attempting adoption again.
- Both Snapshot generations remain retained. Successor immutable Article
  contents and their projected references may remain after rollback; they are
  not active draft/public pointers and ordinary garbage collection owns them.
- Restore the matching frontend and authoring deployment as well as database
  pointers. Separately handle any newly created successor-only content.
- Keep the predecessor registered and loadable through post-application
  verification and the rollback decision. Do not delete the private recovery
  record when retiring obsolete source/runtime files.

After application, verify the selected model, every changed head/publication,
article Snapshot references and representative reader/Workbench replays.
The local PostgreSQL regression exercises the real generated forward/rollback
under the repository schema and runs in the database CI job.
