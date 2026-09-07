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

Keep research candidates mutable and content-hash tracked until a durable
replay contract is fixed (including dev registration). After fixation, preserve
exact identity semantics. Select validation by change impact, not by mint;
reuse evidence only with compatible inputs, numerics, measurements, and policy.
Use the external 1/2 review gate for changed scientific judgments, not repeated
mechanical release steps. See DESIGN-STUDIO-006 for the release boundary.

Before the first release there are no external users. Retire obsolete model
identities, code, and tests instead of preserving legacy compatibility; keep
dependencies and regression coverage required by the current model and Surface.

Reuse model-documentation modules when authoring; preserve self-contained
documents and frozen assessments independently of retired implementation code.
