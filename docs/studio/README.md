# CircleHeart Studio

Studio owns Experiment authoring, immutable Snapshots, Article placements,
runtime orchestration, publication, and presentation. It does not own model
equations, solver state, or analysis-result meaning.

Read only the contract relevant to the task:

- [003](DESIGN-STUDIO-003-experiment-data-architecture.md): Experiment,
  Snapshot, capture, persistence, and publication authority.
- [004](DESIGN-STUDIO-004-reader-briefing-experiment-ia.md): Article
  placement and Briefing authority.
- [005](DESIGN-STUDIO-005-live-graph-performance.md): Worker-to-Canvas
  presentation and performance boundaries.
- [006](DESIGN-STUDIO-006-model-surface-release-and-model-lab.md): exact
  model, analysis methods, Model Surface, and active-bundle identity.
- [007](DESIGN-STUDIO-007-flat-numerical-kernel.md): accepted numerical
  authority and checkpoint boundary.
- [008](DESIGN-STUDIO-008-public-content-delivery.md): public rendering and
  delivery trust boundaries.
- [009](DESIGN-STUDIO-009-model-definition-execution-plan.md): build-time
  model compilation and Worker-local plan binding.

New Sessions resolve one active exact-model/Surface bundle. The Surface pins
its analysis methods. Saved Experiments and Snapshots retain their explicit
pins; a failed historical load must never substitute the active release.

Source, schemas, migrations, and tests own current IDs and field catalogs. Git
history owns superseded designs, launch plans, and completed vertical slices.
