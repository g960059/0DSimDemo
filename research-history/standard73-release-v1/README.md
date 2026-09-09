# Standard73 fixed local release candidate

2026-09-10. Implementation: `18ca5a31`. This is local adoption, not remote
registration or default activation. Standard72 remains selected.

`evidence.tar.gz` preserves all 93 regular files (107 archive members) from
`artifacts/standard73-release-v1/`. `REPORT.md` inside the archive describes
the Japanese results, failed attempts, review disposition and remaining scope.
The directory includes full source snapshots, independent cold baseline and
HFrEF results, own launch preparation, actual Chromium/WebKit Worker evidence,
document records, UI screenshots, and both independent review responses.

Archive SHA-256:
`b1701c6f60988805b403ad68d70b1fcb442b0ddd94e9018d83ffbeddc9b34162`
(69,623,141 bytes). Archive regular-file paths match the source file set. The
archived `worker-001/report.json` matches the digest pinned in the local package.
No dependencies, credentials, supplied screenshots or paper PDFs are included.

`data/model-releases/standard73/package.json` SHA-256:
`bedb4198cf4d15fc31993db5d59e7e8925866b36935484ec951788c2dddc5fc0`.
It pins the exact artifact, production-framed revision, bundle, two own-model
checkpoints and two self-contained documents. The artifact is stored as opaque
`.mjs.txt` to prevent dev-server ESM transformation. Neither that asset nor
the retired `public/research/static-case-v1` files enter the production build.

Codex 6 Astra xhigh and Claude Fable 5.1 xhigh both returned unconditional
approval for the bounded fixed local candidate; the user's 1/2 gate is met.
See `review-001/{ASTRA.md,FABLE.md,FABLE.json,DECISION.md}` in the archive.
Scientific thresholds, equations and selected parameter values did not change.
Baseline and HFrEF were recomputed independently under the new identity rather
than relabeling historical checkpoints. Source/artifact and browser save/restore
continuations agree for both cases. The later `current-bits-final` record reuses
browser evidence by exact artifact/Worker/Surface equality, not a claimed rerun.
The subsequent deletion of the unreferenced legacy installer is source hygiene,
not an executable change; its last source is preserved in the archive.

Typecheck, 1188 fast tests, 876 PR tests, 11 dedicated static tests, 30 focused
document tests, production build and hygiene passed. Suites overlap. Full
canonical/nightly was not run. JA/EN desktop/mobile document checks and actual
baseline-to-HFrEF addition passed (`ui-004`).

Public registration remains separate. Nonblocking public-document cleanup:
identify the prior lab-004 slow-tail comparison as historical rather than the
current launch, and harmonize creation-status vocabulary. Historical v4 remains
unchanged. Existing coronary-mass, Glantz-tau, inflow, extreme-TBV and low-volume
inlet-event limitations remain explicit; this is not whole-domain validation
or a clinical claim. No authored case experiment/article, push or merge.
