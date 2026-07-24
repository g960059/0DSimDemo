# Repository history and recovery

Git is the archive for material that is reproducible, superseded, or useful
only for archaeology. The working tree should contain inputs, current
specifications, implementation, tests, and evidence that actively participates
in a release decision.

The Studio v1 foundation cleanup started from:

```text
efb85f281db20df632b471e3d0d59d9667cbe475
```

The following categories were removed from the working tree in that cleanup:

- root-level solver debug captures (`logs.txt`, `mv_out.txt`);
- one-off BlockNote import probes;
- an imported assistant prompt-history JSON;
- the superseded `tools/sweeps` exploratory scripts and notes.
- the v0.1 Studio ADR/roadmap.

They can be inspected without restoring them:

```bash
git show efb85f281db20df632b471e3d0d59d9667cbe475:logs.txt
git show efb85f281db20df632b471e3d0d59d9667cbe475:tools/sweeps/README.md
git ls-tree -r --name-only efb85f281db20df632b471e3d0d59d9667cbe475 tools/sweeps
```

Restore a specific file only when it becomes an input to current work:

```bash
git restore --source=efb85f281db20df632b471e3d0d59d9667cbe475 -- <path>
```

Generated scientific reports under `data/` are not bulk-archived by this
policy. Many are imported by tests or referenced by verification tools. Move
one to history only after its consumer has been migrated to a canonical
artifact or fixture.

The detailed 2026-07-10 lane diary is similarly retained at
`docs/status/archive/current-lanes-through-2026-07-10.md` as a noncanonical
legacy fixture because historical myocardium verifiers still inspect its claim
boundaries. Remove it only in the same change that migrates those consumers.
