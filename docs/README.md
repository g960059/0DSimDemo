# Project documentation

This directory is intentionally small.

Older ADRs, implementation plans, and research notes were removed from the
working tree during the myocardium Revision 3 reorganization because several of
them described superseded architecture or calibration assumptions. They remain
available through git history, for example at baseline commit
`228bef96e5f522de2cfe352de5d6d4d2f017c550`.

## Current canonical entry points

| Area | Entry point | Status |
|---|---|---|
| Mechanics model specification | [myocardium/model-spec/four-chamber-triseg-land-v1.md](myocardium/model-spec/four-chamber-triseg-land-v1.md) | Normative target model; not a runtime claim |
| Myocardial contraction rebuild | [myocardium/README.md](myocardium/README.md) | Proposed Phase 0 |
| Studio / presentation architecture | [studio/DESIGN-STUDIO-002-cell-document-architecture.md](studio/DESIGN-STUDIO-002-cell-document-architecture.md) | Draft for design and implementation |

The MechanicsCore2 / AV-plane sidecar lane was retired and removed from the
working tree. Its code, benches, reports, and lane documents remain in git
history; see the commit that removed `engine/mechanics2`.

## Working policy

These few rules survived the lanes that produced them, so they live here rather
than in a status document:

- Production is unpublished. Ship the current runtime, then refine the model
  continuously; do not claim physiology acceptance from a diagnostic result.
- Diagnostic evidence is not runtime adoption, morphology acceptance, or
  scientific validation.
- Raw morphology and owner visual review are authoritative for user-visible
  model quality. Waveform shape outranks metric values.
- Diagnostics are disposable by default. Promote a check into the repository
  only when it protects a forward invariant; a check that just re-hashes a
  pinned artifact does not. One-off probes belong in a PR or a report, not in a
  new npm script, a new doc, and a new test.
- Experiment histories and variant tables belong in PRs and reports, not in
  working-tree status documents. Git history, PRs, and generated artifacts are
  the evidence sources.

## Recovery policy for removed docs

Use git history when an older document is needed for archaeology:

```bash
git show 228bef96e5f522de2cfe352de5d6d4d2f017c550:docs/<path>
```

Do not restore old docs into the working tree as archives unless they are
actively reviewed and marked as non-canonical. Keeping stale docs locally makes
future implementation context ambiguous.
