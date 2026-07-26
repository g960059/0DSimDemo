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

The detailed 2026-07-10 lane diary at
`docs/status/archive/current-lanes-through-2026-07-10.md` is noncanonical
history. It was previously retained because myocardium verifiers inspected its
claim boundaries; those consumers have been migrated — the twenty-one prose pins
against it are removed and `tools/repository/checkRepositoryHygiene.mjs` now
rejects any tool under `tools/` that reads `docs/status/archive/`. Removing the
diary is therefore an ordinary editorial decision now, not a blocked one.

The general rule that produced that pin class is worth stating: a verification
tool must not require particular wording in an archived document. Archives are
frozen by definition, so such a requirement is satisfiable only until the next
phase lands, and then it fails forever while saying nothing about what the tool
exists to check.
