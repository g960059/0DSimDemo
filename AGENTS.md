# Repository constraints

Source code and tests are authoritative. Keep docs only for durable,
cross-cutting boundaries costly to reconstruct from code. Do not duplicate
discoverable IDs, catalogs, formulas, or worker mechanics; keep completed
research and superseded designs in Git history.

The exact model owns numerical and checkpoint semantics, analysis methods own
derived results, and the Model Surface owns exposure and presentation. Exact
frames must not reserve analysis outputs as placeholders. Persist only exact
model and Model Surface identities; Surfaces pin versioned analysis methods.

New exact-model identities inherit the latest compatible production Model
Surface and its pinned analysis methods by default; omissions or substitutions
require an explicit compatibility decision and regression coverage.

One human maintainer develops this repository with AI agents.
