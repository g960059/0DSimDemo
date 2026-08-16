# Project documentation

This tree documents the system that exists now. Git history is the archive for
completed, explicitly superseded, or abandoned plans; release diaries;
rejected experiments; generated debug output; and superseded architecture.

## Canonical entry points

| Area | Entry point | Owns |
|---|---|---|
| Studio | [studio/README.md](studio/README.md) | Product, persistence, authoring, Reader, and publication boundaries |
| Live performance | [DESIGN-STUDIO-005](studio/DESIGN-STUDIO-005-live-graph-performance.md) | Worker transport, group playback, presentation cadence, and device gates |
| Numerical runtime | [DESIGN-STUDIO-007](studio/DESIGN-STUDIO-007-flat-numerical-kernel.md) | Accepted-state authority, solver boundary, checkpoints, and extension rules |
| Model compiler | [DESIGN-STUDIO-009](studio/DESIGN-STUDIO-009-model-definition-execution-plan.md) | `ModelDefinition`, `NumericalPolicy`, and generated `ExecutionPlan` |
| Integrated model | [scientific-runtime/README.md](scientific-runtime/README.md) | Active model behavior and scientific claim limits |
| Scientific evidence | [myocardium/README.md](myocardium/README.md) | Model specifications, verification, and retained evidence |
| AI-assisted authoring | [authoring CLI](../tools/authoring/README.md) | Machine protocol and safe content workflow |
| Supabase | [Supabase operations](../supabase/README.md) | Registry, content authority, lifecycle, and deployment operations |

Official Articles, Experiments, and Snapshots are durable Supabase content, not
checked-in recipe files. Product content plans are removed after completion or
explicit supersession by the ordinary authoring workflow; their durable content
and Git history are the record. Removing a plan is not evidence that every
acceptance item in that plan was completed.

## Recovery policy

Use Git when superseded context is needed:

```bash
git show <commit>:<path>
```

Do not restore old documents as an in-tree archive. A historical document may
return only when a current test, release gate, or scientific claim explicitly
depends on it and the document is clearly marked non-canonical.
