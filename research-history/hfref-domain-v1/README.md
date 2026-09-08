# HFrEF research evidence

This is a research-branch archive, not a production dependency or a new public
model release. Keep it in Git history when retiring this experiment.

The human-readable findings are in
`artifacts/hfref-domain-v1/REPORT.md`. `runs.tar.gz` contains the trials,
qualification results, original plans, run scripts, source sidecars and the
local launch bundle. The large source archives are stored separately under
`sources/`. No prior result hashes were recomputed.

To inspect, extract `runs.tar.gz` into a new empty directory. Restore each source
archive beside its sidecar using this mapping; verify its SHA-256 against the
sidecar before extracting the source into another new empty directory:

| Stored source archive | Original prefix under artifacts/hfref-domain-v1 |
|---|---|
| search-001.source.tar.gz | search-001/execution.source.tar.gz |
| diagnostics-001.source.tar.gz | diagnostics-001/execution.source.tar.gz |
| route-001-original.source.tar.gz | route-001/execution.source.tar.gz |
| route-001-partial.source.tar.gz | route-001/partial.source.tar.gz |
| route-002.source.tar.gz | route-002/execution.source.tar.gz |
| route-002-gradual.source.tar.gz | route-002/gradual.source.tar.gz |

The original route-001 stopped on a harness session-ID reuse error. Its partial
results were sealed before editing the harness; it is not final qualification.
Route-002 completed. The gradual follow-up has its own source binding. The
initial broad-domain search and its checkpoints predate the narrowed LV-only
domain and cannot be imported into the final research owner.

`reviews/` preserves the neutral brief, both complete independent reviews and
the adoption decision. The two requested reviewers were GPT-6 Astra xhigh and
Claude Fable 5.1 xhigh. Both were conditionally supportive; Astra's conditions
are used for the 1-of-2 decision. Those numerical/operation checks subsequently
passed. Real-browser testing additionally confirmed analysis inheritance and
exposed a transient-source analysis failure; an explicit retry at the current
state was added and verified, without changing analysis thresholds or pins.

This branch deliberately isolates a mutable exact-model derivative. Do not
copy its replacements of shared Standard71/72 source owners into the released
implementation as though they were backward-compatible changes. The original
Standard72 worktree, artifact and baseline remain separate.

To launch this checked-out research snapshot, install locked dependencies, run
`npm run dev -- --host 127.0.0.1 --port 4189 --strictPort`, and open
`/ja/dev/model-lab?research=hfref`. The checked-in local bundle contains own-model
settled baseline and HFrEF captures. The preset is a development demonstration,
not a public/clinical validation claim. Rebuilding and qualifying a new snapshot
uses `vite-node --script tools/scientific/prepareHfrefResearchLabV1.ts` with a
fresh output directory; do not overwrite an earlier source-bound run.
