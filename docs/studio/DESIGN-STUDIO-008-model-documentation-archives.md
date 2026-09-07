# Model documentation: authoring, saved records and retirement

The reader consumes a saved document, not current model code or current gates.
Authoring modules may be reused, but each saved document resolves its prose,
equations, diagrams, parameters, assessment interpretation and source evidence.
The archive is documentation, never a second executable numerical model.

## Boundaries

- Exact-model and Surface release pins remain authoritative. A document for a
  different release is not silently substituted, even within the same series.
- Baseline selection, model promotion and document publication are separate
  actions. Saving a local candidate's explanation does not admit that candidate.
- UI/copy corrections are document revisions, not numerical model mints.
  Preserve the original package; never rewrite historical measurements or
  reinterpret their votes using current thresholds.
- Preset targets/evidence can be reused after checking observation semantics.
  Parameters and assessments remain model-specific; a predecessor checkpoint
  or pass is not evidence for a successor.

## Current format

The compiler uses the existing React/KaTeX authoring components and physical
module library. It saves compiled HTML chapters, resolved scientific records,
full-precision CSV and self-contained archive CSS/fonts in one JSON package.
Shared chapters are stored once; the assessment chapter has explicit records.
This avoids a custom document language or formula interpreter. Runtime code
only selects a saved record, operates disclosures and downloads saved content.
Compiled HTML is trusted repository content, not a user-import feature.

The offline export contains both assessment records and needs no JavaScript,
network, app, worker or authoring source. Native details and data downloads
remain usable. The package checksum covers the resolved content, not scientific
validity. Dirty-source provenance is explicit and is not a release commit.
The workbench reads a small generated index; full prose and font data load only
with the documentation route. `npm run export:docs -- <package> <directory>`
re-exports a saved package without its original authoring or model code.
The reader owns its math-font stylesheet, and the application stylesheet scans
saved markup for utility classes; neither may depend on retired authoring files.

## Verification and retirement

Current-source creation checks compare formulas/settings against the exact
implementation and must run for the candidate being documented. Archive tests
check integrity, coverage, rendering and independence from retired sources;
they must not compare an old package with the latest implementation.

Before deleting a worktree or old authoring code, preserve the package outside
that worktree and commit the required source/evidence or publish immutable
release assets. Ignored artifacts and an unrelated HEAD tag are not a backup.
Keep source tags/locks and the exact artifact, Surface, analysis implementations
and checkpoint needed for any supported replay. A document's availability does
not promise that its model can run in the current app. Use a compatible reader
or matching archived app/worktree for replay rather than retaining every old
model's source in the current application.

Old document schemas need either a compatible reader or the saved offline HTML.
Do not make source retirement depend on migrating every historical page into
the newest authoring format. Registry publication/storage is not implemented
by the local document export commands.
